"use server";

import { prisma } from "@/lib/db";
import { clinicConfig } from "@/config/clinic.config";
import { generateAvailableSlots, GroupedSlots } from "@/lib/booking/slots";
import { generateAppointmentReference } from "@/lib/booking/reference";
import { normalizeIndianMobile, isValidIndianMobile } from "@/lib/phone";
import { checkRateLimit } from "@/lib/rate-limit";
import { notificationService } from "@/lib/notifications";
import { headers } from "next/headers";
import { z } from "zod";

const bookingSchema = z.object({
  doctorId: z.string().uuid("Invalid doctor selected"),
  startsAtIso: z.string().datetime("Invalid slot selected"),
  fullName: z.string().trim().min(2, "Full name must be at least 2 characters").max(80),
  phone: z.string().refine(isValidIndianMobile, "Enter a valid 10-digit Indian mobile number"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  age: z.coerce.number().min(1, "Age must be at least 1").max(120, "Please enter a valid age"),
  gender: z.enum(["MALE", "FEMALE", "OTHER"], {
    message: "Please select gender",
  }),
  visitType: z.enum(["FIRST_VISIT", "FOLLOW_UP"]),
  reasonForVisit: z.string().max(200, "Reason must not exceed 200 characters").optional(),
  consentGiven: z.literal(true, {
    message: "Consent under DPDP Act is required to proceed",
  }),
});

export type BookingInput = z.infer<typeof bookingSchema>;

export interface BookingResponse {
  success: boolean;
  reference?: string;
  error?: string;
}

/**
 * Server action to fetch available slots for a doctor on a specific date.
 */
export async function getDoctorSlotsAction(
  doctorId: string,
  targetDateStr: string
): Promise<GroupedSlots> {
  try {
    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId, isActive: true },
      include: {
        schedules: true,
        timeOffs: true,
      },
    });

    if (!doctor) {
      return { morning: [], afternoon: [], evening: [], all: [] };
    }

    const holidays = await prisma.clinicHoliday.findMany();

    // Query active appointments on that date
    // Convert targetDateStr (YYYY-MM-DD) to a wide UTC search window (+/- 24 hours)
    const searchDate = new Date(`${targetDateStr}T00:00:00Z`);
    const dayStart = new Date(searchDate.getTime() - 24 * 60 * 60 * 1000);
    const dayEnd = new Date(searchDate.getTime() + 48 * 60 * 60 * 1000);

    const existingAppointments = await prisma.appointment.findMany({
      where: {
        doctorId,
        startsAt: {
          gte: dayStart,
          lte: dayEnd,
        },
        status: {
          in: ["BOOKED", "CONFIRMED"],
        },
      },
      select: {
        startsAt: true,
        endsAt: true,
        status: true,
      },
    });

    const slots = generateAvailableSlots({
      targetDate: targetDateStr,
      schedules: doctor.schedules,
      timeOffs: doctor.timeOffs,
      holidays,
      existingAppointments,
      config: {
        defaultSlotDurationMinutes: clinicConfig.booking.slotDurationMinutes,
        bookingWindowDays: clinicConfig.booking.bookingWindowDays,
        minLeadTimeMinutes: clinicConfig.booking.minLeadTimeMinutes,
        timezone: clinicConfig.booking.timezone,
      },
    });

    return slots;
  } catch (error) {
    console.error("Error fetching slots:", error);
    return { morning: [], afternoon: [], evening: [], all: [] };
  }
}

/**
 * Server action to submit a patient consultation booking.
 * Enforces Zod validation, rate limiting, active booking caps,
 * interactive transaction, and partial unique index conflict handling.
 */
export async function createBookingAction(
  data: BookingInput
): Promise<BookingResponse> {
  // 1. Re-validate with Zod
  const validation = bookingSchema.safeParse(data);
  if (!validation.success) {
    const firstError = validation.error.issues[0]?.message || "Invalid submission data";
    return { success: false, error: firstError };
  }

  const values = validation.data;

  // 2. Client IP Rate Limiting
  const reqHeaders = await headers();
  const forwardedFor = reqHeaders.get("x-forwarded-for");
  const clientIp = forwardedFor ? forwardedFor.split(",")[0].trim() : "127.0.0.1";

  const ipRate = await checkRateLimit(`ip:${clientIp}`, 15, 60);
  if (!ipRate.success) {
    return {
      success: false,
      error: "Too many booking attempts from your network. Please wait a minute and try again.",
    };
  }

  // 3. Phone Rate Limiting
  const normalizedPhone = normalizeIndianMobile(values.phone);
  const phoneRate = await checkRateLimit(`phone:${normalizedPhone}`, 5, 300);
  if (!phoneRate.success) {
    return {
      success: false,
      error: "Too many booking attempts for this phone number. Please wait a few minutes.",
    };
  }

  // 4. Max Active Bookings per Phone Guard
  const activeCount = await prisma.appointment.count({
    where: {
      patient: { phone: normalizedPhone },
      status: { in: ["BOOKED", "CONFIRMED"] },
      startsAt: { gte: new Date() },
    },
  });

  if (activeCount >= clinicConfig.booking.maxActiveBookingsPerPhone) {
    return {
      success: false,
      error: `You already have ${activeCount} active consultation bookings. Maximum permitted per phone is ${clinicConfig.booking.maxActiveBookingsPerPhone}.`,
    };
  }

  // 5. Interactive Prisma Transaction
  try {
    const slotStart = new Date(values.startsAtIso);
    const doctor = await prisma.doctor.findUnique({
      where: { id: values.doctorId, isActive: true },
      include: { schedules: true },
    });

    if (!doctor) {
      return { success: false, error: "Selected doctor is currently unavailable." };
    }

    const slotDuration = clinicConfig.booking.slotDurationMinutes || 15;
    const slotEnd = new Date(slotStart.getTime() + slotDuration * 60 * 1000);

    const referenceCode = generateAppointmentReference();

    const createdAppointment = await prisma.$transaction(async (tx) => {
      // Find or create patient
      let patient = await tx.patient.findFirst({
        where: {
          phone: normalizedPhone,
          fullName: { equals: values.fullName, mode: "insensitive" },
        },
      });

      if (!patient) {
        patient = await tx.patient.create({
          data: {
            fullName: values.fullName,
            phone: normalizedPhone,
            email: values.email || null,
            age: values.age,
            gender: values.gender,
          },
        });
      }

      // Check slot availability inside transaction
      const conflictingAppointment = await tx.appointment.findFirst({
        where: {
          doctorId: values.doctorId,
          status: { in: ["BOOKED", "CONFIRMED"] },
          startsAt: slotStart,
        },
      });

      if (conflictingAppointment) {
        throw new Error("SLOT_TAKEN");
      }

      // Create appointment
      const app = await tx.appointment.create({
        data: {
          reference: referenceCode,
          doctorId: doctor.id,
          patientId: patient.id,
          startsAt: slotStart,
          endsAt: slotEnd,
          status: "BOOKED",
          visitType: values.visitType,
          reasonForVisit: values.reasonForVisit || null,
        },
      });

      // Audit Log
      await tx.auditLog.create({
        data: {
          action: "PATIENT_BOOKED_CONSULTATION",
          entity: "Appointment",
          entityId: app.id,
          metadata: {
            reference: app.reference,
            doctorId: doctor.id,
            startsAt: app.startsAt.toISOString(),
          },
        },
      });

      return { app, patient, doctor };
    });

    // 6. Trigger Asynchronous Notification
    notificationService.sendBookingConfirmation({
      patientName: createdAppointment.patient.fullName,
      patientPhone: createdAppointment.patient.phone,
      patientEmail: createdAppointment.patient.email,
      doctorName: createdAppointment.doctor.fullName,
      specialty: createdAppointment.doctor.specialty,
      appointmentReference: createdAppointment.app.reference,
      startsAt: createdAppointment.app.startsAt,
      clinicName: clinicConfig.name,
      clinicAddress: clinicConfig.contact.address,
    }).catch((err) => console.error("Notification trigger error:", err));

    return {
      success: true,
      reference: createdAppointment.app.reference,
    };
  } catch (err: any) {
    // Gracefully handle double booking conflicts (P2002 or Postgres 23505)
    if (
      err?.message === "SLOT_TAKEN" ||
      err?.code === "P2002" ||
      err?.message?.includes("23505") ||
      err?.message?.includes("appointments_doctor_slot_active_uniq")
    ) {
      return {
        success: false,
        error: "That slot was just taken, please pick another.",
      };
    }

    console.error("Booking error:", err);
    return {
      success: false,
      error: "An unexpected error occurred while booking. Please try again.",
    };
  }
}
