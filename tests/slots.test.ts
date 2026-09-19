import { describe, expect, it } from "bun:test";
import { generateAvailableSlots, SlotGenerationConfig } from "../lib/booking/slots";
import { fromZonedTime } from "date-fns-tz";

describe("Slot Generation Logic (lib/booking/slots.ts)", () => {
  const config: SlotGenerationConfig = {
    defaultSlotDurationMinutes: 15,
    bookingWindowDays: 30,
    minLeadTimeMinutes: 60,
    timezone: "Asia/Kolkata",
  };

  // Fixed reference time: Monday, 2026-10-05 at 06:00 AM IST (00:30 UTC)
  const referenceNow = fromZonedTime("2026-10-05 06:00:00", "Asia/Kolkata");

  const standardSchedule = [
    {
      dayOfWeek: 1, // Monday
      startTime: "09:00",
      endTime: "13:00",
      slotDurationMinutes: 15,
    },
    {
      dayOfWeek: 1, // Monday evening
      startTime: "16:00",
      endTime: "18:00",
      slotDurationMinutes: 15,
    },
  ];

  it("generates slots across multiple windows and groups them into morning and evening", () => {
    const result = generateAvailableSlots({
      targetDate: "2026-10-05",
      schedules: standardSchedule,
      timeOffs: [],
      holidays: [],
      existingAppointments: [],
      config,
      referenceNow,
    });

    // 09:00 to 13:00 (4 hours = 16 slots of 15m)
    // 16:00 to 18:00 (2 hours = 8 slots of 15m)
    // Total = 24 slots (09:00 - 12:00 = 12 morning, 12:00 - 13:00 = 4 afternoon, 16:00 - 18:00 = 8 evening)
    expect(result.all.length).toBe(24);
    expect(result.morning.length).toBe(12);
    expect(result.afternoon.length).toBe(8);
    expect(result.evening.length).toBe(4);

    // Verify first and last slots
    expect(result.morning[0].displayTime).toBe("09:00 AM");
    expect(result.morning[11].displayTime).toBe("11:45 AM");
    expect(result.afternoon[0].displayTime).toBe("12:00 PM");
    expect(result.evening[0].displayTime).toBe("05:00 PM");
    expect(result.evening[3].displayTime).toBe("05:45 PM");
  });

  it("removes all slots on a clinic holiday", () => {
    const result = generateAvailableSlots({
      targetDate: "2026-10-05",
      schedules: standardSchedule,
      timeOffs: [],
      holidays: [{ date: "2026-10-05" }],
      existingAppointments: [],
      config,
      referenceNow,
    });

    expect(result.all.length).toBe(0);
  });

  it("removes slots overlapping with doctor time off", () => {
    // Time off from 10:00 AM to 11:00 AM IST (4 slots: 10:00, 10:15, 10:30, 10:45)
    const timeOffStart = fromZonedTime("2026-10-05 10:00:00", "Asia/Kolkata");
    const timeOffEnd = fromZonedTime("2026-10-05 11:00:00", "Asia/Kolkata");

    const result = generateAvailableSlots({
      targetDate: "2026-10-05",
      schedules: standardSchedule,
      timeOffs: [{ startsAt: timeOffStart, endsAt: timeOffEnd }],
      holidays: [],
      existingAppointments: [],
      config,
      referenceNow,
    });

    // 24 - 4 = 20 slots
    expect(result.all.length).toBe(20);

    // Ensure 10:00 AM, 10:15 AM, 10:30 AM, 10:45 AM are not present
    const times = result.all.map((s) => s.displayTime);
    expect(times).not.toContain("10:00 AM");
    expect(times).not.toContain("10:15 AM");
    expect(times).not.toContain("10:30 AM");
    expect(times).not.toContain("10:45 AM");
    expect(times).toContain("09:45 AM");
    expect(times).toContain("11:00 AM");
  });

  it("removes slots for active BOOKED and CONFIRMED appointments, but keeps CANCELLED", () => {
    const app1Start = fromZonedTime("2026-10-05 09:30:00", "Asia/Kolkata");
    const app1End = fromZonedTime("2026-10-05 09:45:00", "Asia/Kolkata");

    const app2Start = fromZonedTime("2026-10-05 16:30:00", "Asia/Kolkata");
    const app2End = fromZonedTime("2026-10-05 16:45:00", "Asia/Kolkata");

    const cancelledStart = fromZonedTime("2026-10-05 12:00:00", "Asia/Kolkata");
    const cancelledEnd = fromZonedTime("2026-10-05 12:15:00", "Asia/Kolkata");

    const result = generateAvailableSlots({
      targetDate: "2026-10-05",
      schedules: standardSchedule,
      timeOffs: [],
      holidays: [],
      existingAppointments: [
        { startsAt: app1Start, endsAt: app1End, status: "BOOKED" },
        { startsAt: app2Start, endsAt: app2End, status: "CONFIRMED" },
        { startsAt: cancelledStart, endsAt: cancelledEnd, status: "CANCELLED" },
      ],
      config,
      referenceNow,
    });

    const times = result.all.map((s) => s.displayTime);
    expect(times).not.toContain("09:30 AM");
    expect(times).not.toContain("04:30 PM");
    // Cancelled slot should still be free to book!
    expect(times).toContain("12:00 PM");
    expect(result.all.length).toBe(22);
  });

  it("respects minLeadTimeMinutes and filters out slots starting too soon", () => {
    // Reference now: 09:15 AM IST, min lead time: 60 minutes
    // Threshold = 10:15 AM IST.
    // Slots before 10:15 AM (09:00, 09:15, 09:30, 09:45, 10:00) must be removed!
    const lateMorningNow = fromZonedTime("2026-10-05 09:15:00", "Asia/Kolkata");

    const result = generateAvailableSlots({
      targetDate: "2026-10-05",
      schedules: standardSchedule,
      timeOffs: [],
      holidays: [],
      existingAppointments: [],
      config,
      referenceNow: lateMorningNow,
    });

    const times = result.all.map((s) => s.displayTime);
    expect(times).not.toContain("09:00 AM");
    expect(times).not.toContain("09:15 AM");
    expect(times).not.toContain("09:30 AM");
    expect(times).not.toContain("09:45 AM");
    expect(times).not.toContain("10:00 AM");
    expect(times).toContain("10:15 AM");
  });

  it("returns empty if target date is outside bookingWindowDays", () => {
    const result = generateAvailableSlots({
      targetDate: "2026-11-20", // > 45 days in the future
      schedules: standardSchedule,
      timeOffs: [],
      holidays: [],
      existingAppointments: [],
      config,
      referenceNow,
    });

    expect(result.all.length).toBe(0);
  });
});
