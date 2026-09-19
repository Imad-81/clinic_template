import { maskPhoneNumber } from "../phone";

export interface NotificationPayload {
  patientName: string;
  patientPhone: string;
  patientEmail?: string | null;
  doctorName: string;
  specialty: string;
  appointmentReference: string;
  startsAt: Date;
  clinicName: string;
  clinicAddress: string;
  cancellationReason?: string;
}

export interface NotificationProvider {
  sendBookingConfirmation(payload: NotificationPayload): Promise<boolean>;
  sendCancellation(payload: NotificationPayload): Promise<boolean>;
  sendReminder(payload: NotificationPayload): Promise<boolean>;
}

class ConsoleNotificationProvider implements NotificationProvider {
  async sendBookingConfirmation(payload: NotificationPayload): Promise<boolean> {
    const maskedPhone = maskPhoneNumber(payload.patientPhone);
    console.log(`[NOTIFICATION::BOOKING_CONFIRMATION] To: ${maskedPhone} | Ref: ${payload.appointmentReference} | Doctor: ${payload.doctorName} (${payload.specialty}) | Time: ${payload.startsAt.toISOString()} | Clinic: ${payload.clinicName}`);
    return true;
  }

  async sendCancellation(payload: NotificationPayload): Promise<boolean> {
    const maskedPhone = maskPhoneNumber(payload.patientPhone);
    console.log(`[NOTIFICATION::CANCELLATION] To: ${maskedPhone} | Ref: ${payload.appointmentReference} | Doctor: ${payload.doctorName} | Reason: ${payload.cancellationReason || "Patient request"}`);
    return true;
  }

  async sendReminder(payload: NotificationPayload): Promise<boolean> {
    const maskedPhone = maskPhoneNumber(payload.patientPhone);
    console.log(`[NOTIFICATION::24H_REMINDER] To: ${maskedPhone} | Ref: ${payload.appointmentReference} | Tomorrow with: ${payload.doctorName} at ${payload.clinicName}`);
    return true;
  }
}

// Default provider instance (swappable with MSG91/Twilio/Resend)
export const notificationService: NotificationProvider = new ConsoleNotificationProvider();
