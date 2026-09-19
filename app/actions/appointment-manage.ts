"use server";

import { prisma } from "@/lib/db";
import { clinicConfig } from "@/config/clinic.config";
import { notificationService } from "@/lib/notifications";
import { differenceInHours } from "date-fns";

export interface AppointmentDetailResponse {
  success: boolean;
  appointment?: {
    id: string;
    reference: string;
    status: string;
    startsAt: string; // ISO
    endsAt: string;   // ISO
    reasonForVisit: string | null;
    visitType: string;
    cancellationReason: string | null;
    cancelledAt: string | null;
    canCancel: boolean;
    hoursUntilAppointment: number;
    doctor: {
      id: string;
      slug: string;
      fullName: string;
      specialty: string;
      consultationFee: number;
      photoPath: string;
    };
    patient: {
      fullName: string;
      phoneMasked: string;
      age: number;
      gender: string;
    };
  };
  error?: string;
}

/**
 * Verifies access to an appointment via reference code and patient phone number
 * (last 4 digits or full number) to prevent enumeration.
 */
export async function getAppointmentByReferenceAction(
  reference: string,
  phoneInput: string
): Promise<AppointmentDetailResponse> {
  const cleanRef = reference.trim().toUpperCase();
  const cleanPhone = phoneInput.trim().replace(/\D/g, "");

  if (cleanPhone.length < 4) {
    return { success: false, error: "Please enter at least the last 4 digits of your registered mobile number." };
  }

  const app = await prisma.appointment.findUnique({
    where: { reference: cleanRef },
    include: {
      doctor: true,
      patient: true,
    },
  });

  if (!app) {
    return { success: false, error: "No appointment found with this reference code." };
  }

  // Verify against patient's stored phone (which is E.164 +91XXXXXXXXXX)
  const patientDigits = app.patient.phone.replace(/\D/g, "");
  const last4 = patientDigits.slice(-4);
  const full10 = patientDigits.slice(-10);

  const isLast4Match = cleanPhone === last4 || cleanPhone.slice(-4) === last4;
  const isFullMatch = cleanPhone === full10 || cleanPhone === patientDigits;

  if (!isLast4Match && !isFullMatch) {
    return {
      success: false,
      error: "The phone number does not match our records for this reference.",
    };
  }

  const now = new Date();
  const hoursUntil = differenceInHours(app.startsAt, now);
  const cutoff = clinicConfig.booking.cancellationCutoffHours || 2;
  const canCancel =
    (app.status === "BOOKED" || app.status === "CONFIRMED") && hoursUntil >= cutoff;

  return {
    success: true,
    appointment: {
      id: app.id,
      reference: app.reference,
      status: app.status,
      startsAt: app.startsAt.toISOString(),
      endsAt: app.endsAt.toISOString(),
      reasonForVisit: app.reasonForVisit,
      visitType: app.visitType,
      cancellationReason: app.cancellationReason,
      cancelledAt: app.cancelledAt?.toISOString() || null,
      canCancel,
      hoursUntilAppointment: hoursUntil,
      doctor: {
        id: app.doctor.id,
        slug: app.doctor.slug,
        fullName: app.doctor.fullName,
        specialty: app.doctor.specialty,
        consultationFee: app.doctor.consultationFee,
        photoPath: app.doctor.photoPath,
      },
      patient: {
        fullName: app.patient.fullName,
        phoneMasked: `+91 ******${last4}`,
        age: app.patient.age,
        gender: app.patient.gender,
      },
    },
  };
}

/**
 * Patient action to cancel their appointment, strictly enforcing cutoff.
 */
export async function cancelAppointmentAction(
  reference: string,
  phoneInput: string,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  const verification = await getAppointmentByReferenceAction(reference, phoneInput);
  if (!verification.success || !verification.appointment) {
    return { success: false, error: verification.error };
  }

  const app = verification.appointment;
  if (!app.canCancel) {
    return {
      success: false,
      error: `Cancellation cutoff of ${clinicConfig.booking.cancellationCutoffHours} hours before the appointment has passed. Please call the clinic directly.`,
    };
  }

  try {
    const updated = await prisma.appointment.update({
      where: { reference: app.reference },
      data: {
        status: "CANCELLED",
        cancelledAt: new Date(),
        cancelledBy: "PATIENT",
        cancellationReason: reason.trim() || "Cancelled by patient via website",
      },
      include: {
        doctor: true,
        patient: true,
      },
    });

    // Write audit log
    await prisma.auditLog.create({
      data: {
        action: "PATIENT_CANCELLED_APPOINTMENT",
        entity: "Appointment",
        entityId: updated.id,
        metadata: {
          reference: updated.reference,
          reason: updated.cancellationReason,
        },
      },
    });

    // Notify
    notificationService.sendCancellation({
      patientName: updated.patient.fullName,
      patientPhone: updated.patient.phone,
      doctorName: updated.doctor.fullName,
      specialty: updated.doctor.specialty,
      appointmentReference: updated.reference,
      startsAt: updated.startsAt,
      clinicName: clinicConfig.name,
      clinicAddress: clinicConfig.contact.address,
      cancellationReason: updated.cancellationReason || undefined,
    }).catch(console.error);

    return { success: true };
  } catch (err) {
    console.error("Cancellation error:", err);
    return { success: false, error: "Failed to cancel appointment. Please try again or call the clinic." };
  }
}
