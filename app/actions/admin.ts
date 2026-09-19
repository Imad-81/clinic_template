"use server";

import { prisma } from "@/lib/db";
import { requireRole, requireAdmin } from "@/lib/auth-guards";
import { hashPassword } from "better-auth/crypto";
import { randomUUID } from "crypto";
import { generateAppointmentReference } from "@/lib/booking/reference";
import { normalizeIndianMobile, isValidIndianMobile } from "@/lib/phone";
import { AppointmentStatus, VisitType, Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";

// -------------------------------------------------------------------
// Appointment Status Quick-Actions & Notes (Admin & Receptionist)
// -------------------------------------------------------------------

export async function updateAppointmentStatusAction(params: {
  appointmentId: string;
  status: AppointmentStatus;
  notes?: string;
  cancellationReason?: string;
}) {
  const { user } = await requireRole(["admin", "receptionist"]);

  const existing = await prisma.appointment.findUnique({
    where: { id: params.appointmentId },
  });

  if (!existing) {
    return { success: false, error: "Appointment not found" };
  }

  const updateData: Prisma.AppointmentUpdateInput = {
    status: params.status,
  };

  if (params.notes !== undefined) {
    updateData.notes = params.notes;
  }

  if (params.status === "CANCELLED") {
    updateData.cancelledAt = new Date();
    updateData.cancelledBy = "ADMIN";
    updateData.cancellationReason = params.cancellationReason || "Cancelled by staff";
  }

  const updated = await prisma.appointment.update({
    where: { id: params.appointmentId },
    data: updateData,
  });

  // Audit Log
  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: `STAFF_UPDATE_STATUS_${params.status}`,
      entity: "Appointment",
      entityId: updated.id,
      metadata: {
        previousStatus: existing.status,
        newStatus: params.status,
        notes: params.notes,
      },
    },
  });

  revalidatePath("/admin/today");
  revalidatePath("/admin/appointments");
  return { success: true };
}

// -------------------------------------------------------------------
// Manual Booking for Staff (Walk-in / Phone Call)
// -------------------------------------------------------------------

export async function createManualBookingAction(params: {
  doctorId: string;
  startsAt: string; // ISO
  fullName: string;
  phone: string;
  email?: string;
  age: number;
  gender: string;
  visitType: VisitType;
  reasonForVisit?: string;
  notes?: string;
}) {
  const { user } = await requireRole(["admin", "receptionist"]);

  if (!isValidIndianMobile(params.phone)) {
    return { success: false, error: "Invalid Indian mobile number" };
  }

  const normalizedPhone = normalizeIndianMobile(params.phone);
  const startsAtDate = new Date(params.startsAt);
  const endsAtDate = new Date(startsAtDate.getTime() + 15 * 60 * 1000);
  const reference = generateAppointmentReference();

  try {
    const result = await prisma.$transaction(async (tx) => {
      let patient = await tx.patient.findFirst({
        where: {
          phone: normalizedPhone,
          fullName: { equals: params.fullName, mode: "insensitive" },
        },
      });

      if (!patient) {
        patient = await tx.patient.create({
          data: {
            fullName: params.fullName,
            phone: normalizedPhone,
            email: params.email || null,
            age: params.age,
            gender: params.gender,
          },
        });
      }

      // Check slot availability
      const existingApp = await tx.appointment.findFirst({
        where: {
          doctorId: params.doctorId,
          startsAt: startsAtDate,
          status: { in: ["BOOKED", "CONFIRMED"] },
        },
      });

      if (existingApp) {
        throw new Error("SLOT_TAKEN");
      }

      const app = await tx.appointment.create({
        data: {
          reference,
          doctorId: params.doctorId,
          patientId: patient.id,
          startsAt: startsAtDate,
          endsAt: endsAtDate,
          status: "CONFIRMED", // Staff bookings default to confirmed
          visitType: params.visitType,
          reasonForVisit: params.reasonForVisit || null,
          notes: params.notes || "Booked by clinic staff via portal",
        },
      });

      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: "STAFF_MANUAL_BOOKING",
          entity: "Appointment",
          entityId: app.id,
          metadata: {
            reference: app.reference,
            doctorId: params.doctorId,
          },
        },
      });

      return app;
    });

    revalidatePath("/admin/today");
    revalidatePath("/admin/appointments");
    return { success: true, reference: result.reference };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "";
    const code = typeof err === "object" && err !== null && "code" in err ? (err as { code: unknown }).code : undefined;
    if (message === "SLOT_TAKEN" || code === "P2002" || message.includes("23505")) {
      return { success: false, error: "That slot was just taken, please pick another." };
    }
    console.error("Manual booking error:", err);
    return { success: false, error: "Failed to create appointment." };
  }
}

// -------------------------------------------------------------------
// Doctor Management (Admin Only)
// -------------------------------------------------------------------

export async function upsertDoctorAction(data: {
  id?: string;
  slug: string;
  fullName: string;
  specialty: string;
  qualifications: string;
  experienceYears: number;
  bio: string;
  languages: string[];
  consultationFee: number;
  photoPath: string;
  isActive?: boolean;
}) {
  const { user } = await requireAdmin();

  let doctor;
  if (data.id) {
    doctor = await prisma.doctor.update({
      where: { id: data.id },
      data: {
        slug: data.slug,
        fullName: data.fullName,
        specialty: data.specialty,
        qualifications: data.qualifications,
        experienceYears: data.experienceYears,
        bio: data.bio,
        languages: data.languages,
        consultationFee: data.consultationFee,
        photoPath: data.photoPath,
        isActive: data.isActive ?? true,
      },
    });
  } else {
    doctor = await prisma.doctor.create({
      data: {
        slug: data.slug,
        fullName: data.fullName,
        specialty: data.specialty,
        qualifications: data.qualifications,
        experienceYears: data.experienceYears,
        bio: data.bio,
        languages: data.languages,
        consultationFee: data.consultationFee,
        photoPath: data.photoPath,
        isActive: data.isActive ?? true,
      },
    });
  }

  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: data.id ? "ADMIN_UPDATE_DOCTOR" : "ADMIN_CREATE_DOCTOR",
      entity: "Doctor",
      entityId: doctor.id,
      metadata: { fullName: doctor.fullName, specialty: doctor.specialty },
    },
  });

  revalidatePath("/admin/doctors");
  revalidatePath("/#doctors");
  revalidatePath(`/doctors/${doctor.slug}`);
  return { success: true, doctor };
}

export async function toggleDoctorActiveAction(doctorId: string, isActive: boolean) {
  const { user } = await requireAdmin();

  const doctor = await prisma.doctor.update({
    where: { id: doctorId },
    data: { isActive },
  });

  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: isActive ? "ADMIN_ACTIVATE_DOCTOR" : "ADMIN_DEACTIVATE_DOCTOR",
      entity: "Doctor",
      entityId: doctor.id,
    },
  });

  revalidatePath("/admin/doctors");
  revalidatePath("/#doctors");
  return { success: true };
}

// -------------------------------------------------------------------
// Schedules, Time-Off & Holiday Management (Admin Only)
// -------------------------------------------------------------------

export async function addDoctorScheduleAction(params: {
  doctorId: string;
  dayOfWeek: number;
  startTime: string; // "HH:mm"
  endTime: string;   // "HH:mm"
  slotDurationMinutes?: number;
}) {
  const { user } = await requireAdmin();

  const schedule = await prisma.doctorSchedule.create({
    data: {
      doctorId: params.doctorId,
      dayOfWeek: params.dayOfWeek,
      startTime: new Date(`1970-01-01T${params.startTime}:00Z`),
      endTime: new Date(`1970-01-01T${params.endTime}:00Z`),
      slotDurationMinutes: params.slotDurationMinutes || 15,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: "ADMIN_ADD_DOCTOR_SCHEDULE",
      entity: "DoctorSchedule",
      entityId: schedule.id,
      metadata: params,
    },
  });

  revalidatePath("/admin/schedules");
  return { success: true };
}

export async function deleteDoctorScheduleAction(scheduleId: string) {
  const { user } = await requireAdmin();

  await prisma.doctorSchedule.delete({
    where: { id: scheduleId },
  });

  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: "ADMIN_DELETE_DOCTOR_SCHEDULE",
      entity: "DoctorSchedule",
      entityId: scheduleId,
    },
  });

  revalidatePath("/admin/schedules");
  return { success: true };
}

export async function addDoctorTimeOffAction(params: {
  doctorId: string;
  startsAt: string; // ISO
  endsAt: string;   // ISO
  reason: string;
}) {
  const { user } = await requireAdmin();
  const start = new Date(params.startsAt);
  const end = new Date(params.endsAt);

  // Check for conflicts with existing booked appointments
  const conflictingAppointments = await prisma.appointment.findMany({
    where: {
      doctorId: params.doctorId,
      status: { in: ["BOOKED", "CONFIRMED"] },
      startsAt: { lte: end },
      endsAt: { gte: start },
    },
    include: { patient: true },
  });

  const timeOff = await prisma.doctorTimeOff.create({
    data: {
      doctorId: params.doctorId,
      startsAt: start,
      endsAt: end,
      reason: params.reason,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: "ADMIN_ADD_DOCTOR_TIMEOFF",
      entity: "DoctorTimeOff",
      entityId: timeOff.id,
      metadata: {
        ...params,
        conflictCount: conflictingAppointments.length,
      },
    },
  });

  revalidatePath("/admin/schedules");
  return {
    success: true,
    warning:
      conflictingAppointments.length > 0
        ? `Note: ${conflictingAppointments.length} existing booked appointment(s) fall within this time-off period. Please contact patients to reschedule.`
        : undefined,
  };
}

export async function deleteDoctorTimeOffAction(timeOffId: string) {
  const { user } = await requireAdmin();

  await prisma.doctorTimeOff.delete({
    where: { id: timeOffId },
  });

  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: "ADMIN_DELETE_DOCTOR_TIMEOFF",
      entity: "DoctorTimeOff",
      entityId: timeOffId,
    },
  });

  revalidatePath("/admin/schedules");
  return { success: true };
}

export async function createClinicHolidayAction(params: {
  date: string; // YYYY-MM-DD
  name: string;
}) {
  const { user } = await requireAdmin();
  const dateObj = new Date(`${params.date}T00:00:00Z`);

  // Check for any booked appointments on that date
  const dayStart = new Date(dateObj.getTime() - 12 * 60 * 60 * 1000);
  const dayEnd = new Date(dateObj.getTime() + 36 * 60 * 60 * 1000);

  const conflicts = await prisma.appointment.count({
    where: {
      status: { in: ["BOOKED", "CONFIRMED"] },
      startsAt: { gte: dayStart, lte: dayEnd },
    },
  });

  const holiday = await prisma.clinicHoliday.create({
    data: {
      date: dateObj,
      name: params.name,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: "ADMIN_CREATE_CLINIC_HOLIDAY",
      entity: "ClinicHoliday",
      entityId: holiday.id,
      metadata: { ...params, conflictCount: conflicts },
    },
  });

  revalidatePath("/admin/schedules");
  return {
    success: true,
    warning:
      conflicts > 0
        ? `Warning: ${conflicts} active appointment(s) already exist on this holiday date.`
        : undefined,
  };
}

export async function deleteClinicHolidayAction(holidayId: string) {
  const { user } = await requireAdmin();

  await prisma.clinicHoliday.delete({
    where: { id: holidayId },
  });

  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: "ADMIN_DELETE_CLINIC_HOLIDAY",
      entity: "ClinicHoliday",
      entityId: holidayId,
    },
  });

  revalidatePath("/admin/schedules");
  return { success: true };
}

// -------------------------------------------------------------------
// Staff User Management (Admin Only)
// -------------------------------------------------------------------

export async function createStaffUserAction(params: {
  name: string;
  email: string;
  password: string;
  role: "admin" | "receptionist";
}) {
  const { user } = await requireAdmin();

  const existing = await prisma.user.findUnique({
    where: { email: params.email },
  });

  if (existing) {
    return { success: false, error: "A user with this email already exists." };
  }

  const newUserId = randomUUID();
  const hashedPassword = await hashPassword(params.password);

  await prisma.user.create({
    data: {
      id: newUserId,
      name: params.name,
      email: params.email,
      emailVerified: true,
      role: params.role,
      accounts: {
        create: {
          id: randomUUID(),
          accountId: newUserId,
          providerId: "credential",
          password: hashedPassword,
        },
      },
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: "ADMIN_CREATE_STAFF_USER",
      entity: "User",
      entityId: newUserId,
      metadata: { email: params.email, role: params.role },
    },
  });

  revalidatePath("/admin/staff");
  return { success: true };
}

export async function toggleBanStaffUserAction(params: {
  userId: string;
  banned: boolean;
  banReason?: string;
}) {
  const { user } = await requireAdmin();

  if (params.userId === user.id) {
    return { success: false, error: "You cannot ban your own administrator account." };
  }

  await prisma.user.update({
    where: { id: params.userId },
    data: {
      banned: params.banned,
      banReason: params.banReason || (params.banned ? "Deactivated by administrator" : null),
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: params.banned ? "ADMIN_BAN_STAFF_USER" : "ADMIN_UNBAN_STAFF_USER",
      entity: "User",
      entityId: params.userId,
    },
  });

  revalidatePath("/admin/staff");
  return { success: true };
}

export async function resetStaffPasswordAction(params: {
  userId: string;
  newPassword: string;
}) {
  const { user } = await requireAdmin();

  if (params.newPassword.length < 8) {
    return { success: false, error: "Password must be at least 8 characters long." };
  }

  const hashedPassword = await hashPassword(params.newPassword);

  await prisma.account.updateMany({
    where: {
      userId: params.userId,
      providerId: "credential",
    },
    data: {
      password: hashedPassword,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: "ADMIN_RESET_STAFF_PASSWORD",
      entity: "User",
      entityId: params.userId,
    },
  });

  return { success: true };
}
