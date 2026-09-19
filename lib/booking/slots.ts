import { fromZonedTime, formatInTimeZone, toZonedTime } from "date-fns-tz";
import { addMinutes, isBefore, isAfter, addDays, startOfDay } from "date-fns";

export interface DoctorScheduleInput {
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  startTime: Date | string;
  endTime: Date | string;
  slotDurationMinutes?: number | null;
}

export interface DoctorTimeOffInput {
  startsAt: Date;
  endsAt: Date;
}

export interface ClinicHolidayInput {
  date: Date | string;
}

export interface AppointmentInput {
  startsAt: Date;
  endsAt: Date;
  status: string; // 'BOOKED' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW'
}

export interface SlotGenerationConfig {
  defaultSlotDurationMinutes: number;
  bookingWindowDays: number;
  minLeadTimeMinutes: number;
  timezone: string;
}

export interface TimeSlot {
  startsAt: Date; // UTC
  endsAt: Date;   // UTC
  displayTime: string; // e.g. "09:00 AM" in IST
  period: "morning" | "afternoon" | "evening";
}

export interface GroupedSlots {
  morning: TimeSlot[];
  afternoon: TimeSlot[];
  evening: TimeSlot[];
  all: TimeSlot[];
}

/**
 * Extracts { hours, minutes } from Date or "HH:mm" string
 */
function parseTime(time: Date | string): { hours: number; minutes: number } {
  if (typeof time === "string") {
    const parts = time.split(":");
    return {
      hours: parseInt(parts[0], 10),
      minutes: parseInt(parts[1], 10),
    };
  }
  // If Date, Prisma @db.Time is stored as 1970-01-01THH:mm:ss.000Z
  return {
    hours: time.getUTCHours(),
    minutes: time.getUTCMinutes(),
  };
}

/**
 * Pure function to generate available slots for a doctor on a specific date.
 */
export function generateAvailableSlots(params: {
  targetDate: Date | string; // Date or 'YYYY-MM-DD'
  schedules: DoctorScheduleInput[];
  timeOffs: DoctorTimeOffInput[];
  holidays: ClinicHolidayInput[];
  existingAppointments: AppointmentInput[];
  config: SlotGenerationConfig;
  referenceNow?: Date; // Allows deterministic testing
}): GroupedSlots {
  const {
    targetDate,
    schedules,
    timeOffs,
    holidays,
    existingAppointments,
    config,
    referenceNow = new Date(),
  } = params;

  const tz = config.timezone || "Asia/Kolkata";

  // Parse target date in target timezone
  let dateStr: string;
  if (typeof targetDate === "string") {
    dateStr = targetDate.slice(0, 10);
  } else {
    dateStr = formatInTimeZone(targetDate, tz, "yyyy-MM-dd");
  }

  const zonedTargetDate = toZonedTime(fromZonedTime(`${dateStr} 00:00:00`, tz), tz);
  const targetDayOfWeek = zonedTargetDate.getDay();

  const emptyResult: GroupedSlots = {
    morning: [],
    afternoon: [],
    evening: [],
    all: [],
  };

  // 1. Check if target date is outside booking window
  const zonedNow = toZonedTime(referenceNow, tz);
  const minAllowedDate = startOfDay(zonedNow);
  const maxAllowedDate = addDays(minAllowedDate, config.bookingWindowDays);

  if (isBefore(zonedTargetDate, minAllowedDate) || isAfter(zonedTargetDate, maxAllowedDate)) {
    return emptyResult;
  }

  // 2. Check if target date is a Clinic Holiday
  const isHoliday = holidays.some((h) => {
    let holidayDateStr: string;
    if (typeof h.date === "string") {
      holidayDateStr = h.date.slice(0, 10);
    } else {
      holidayDateStr = formatInTimeZone(h.date, tz, "yyyy-MM-dd");
    }
    return holidayDateStr === dateStr;
  });

  if (isHoliday) {
    return emptyResult;
  }

  // 3. Find schedules for this day of week
  const matchingSchedules = schedules.filter((s) => s.dayOfWeek === targetDayOfWeek);
  if (matchingSchedules.length === 0) {
    return emptyResult;
  }

  // Filter active appointments
  const activeAppointments = existingAppointments.filter(
    (app) => app.status === "BOOKED" || app.status === "CONFIRMED"
  );

  const minLeadTimeThreshold = addMinutes(referenceNow, config.minLeadTimeMinutes);
  const generatedSlots: TimeSlot[] = [];

  for (const schedule of matchingSchedules) {
    const slotDuration = schedule.slotDurationMinutes || config.defaultSlotDurationMinutes || 15;
    const start = parseTime(schedule.startTime);
    const end = parseTime(schedule.endTime);

    const scheduleStartUtc = fromZonedTime(
      `${dateStr} ${String(start.hours).padStart(2, "0")}:${String(start.minutes).padStart(2, "0")}:00`,
      tz
    );
    const scheduleEndUtc = fromZonedTime(
      `${dateStr} ${String(end.hours).padStart(2, "0")}:${String(end.minutes).padStart(2, "0")}:00`,
      tz
    );

    let currentSlotStart = scheduleStartUtc;

    while (true) {
      const currentSlotEnd = addMinutes(currentSlotStart, slotDuration);
      if (isAfter(currentSlotEnd, scheduleEndUtc)) {
        break;
      }

      // Check A: Is slot in the past or within min lead time?
      const isPastOrTooSoon = isBefore(currentSlotStart, minLeadTimeThreshold);

      // Check B: Does slot overlap with any doctor time-off?
      const overlapsTimeOff = timeOffs.some((off) => {
        return (
          isBefore(currentSlotStart, off.endsAt) &&
          isAfter(currentSlotEnd, off.startsAt)
        );
      });

      // Check C: Does slot overlap with any active appointment?
      const overlapsAppointment = activeAppointments.some((app) => {
        return (
          isBefore(currentSlotStart, app.endsAt) &&
          isAfter(currentSlotEnd, app.startsAt)
        );
      });

      if (!isPastOrTooSoon && !overlapsTimeOff && !overlapsAppointment) {
        const displayTime = formatInTimeZone(currentSlotStart, tz, "hh:mm a");
        const hourInTz = parseInt(formatInTimeZone(currentSlotStart, tz, "HH"), 10);

        let period: "morning" | "afternoon" | "evening";
        if (hourInTz < 12) {
          period = "morning";
        } else if (hourInTz < 17) {
          period = "afternoon";
        } else {
          period = "evening";
        }

        generatedSlots.push({
          startsAt: currentSlotStart,
          endsAt: currentSlotEnd,
          displayTime,
          period,
        });
      }

      currentSlotStart = currentSlotEnd;
    }
  }

  // Sort slots deterministically by startsAt
  generatedSlots.sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());

  // Group slots
  const grouped: GroupedSlots = {
    morning: generatedSlots.filter((s) => s.period === "morning"),
    afternoon: generatedSlots.filter((s) => s.period === "afternoon"),
    evening: generatedSlots.filter((s) => s.period === "evening"),
    all: generatedSlots,
  };

  return grouped;
}
