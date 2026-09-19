import { prisma } from "@/lib/db";
import { clinicConfig } from "@/config/clinic.config";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import { TodayAppointmentsView, TodayAppointment } from "@/components/admin/TodayAppointmentsView";

export const dynamic = "force-dynamic";

export default async function AdminTodayPage() {
  const tz = clinicConfig.booking.timezone || "Asia/Kolkata";
  const now = new Date();
  const todayStr = formatInTimeZone(now, tz, "yyyy-MM-dd");

  const startUtc = fromZonedTime(`${todayStr} 00:00:00`, tz);
  const endUtc = fromZonedTime(`${todayStr} 23:59:59`, tz);

  const [doctors, appointments] = await Promise.all([
    prisma.doctor.findMany({
      where: { isActive: true },
      select: { id: true, fullName: true, specialty: true },
      orderBy: { displayOrder: "asc" },
    }),
    prisma.appointment.findMany({
      where: {
        startsAt: {
          gte: startUtc,
          lte: endUtc,
        },
      },
      include: {
        doctor: {
          select: { id: true, fullName: true, specialty: true },
        },
        patient: {
          select: { fullName: true, phone: true, age: true, gender: true },
        },
      },
      orderBy: { startsAt: "asc" },
    }),
  ]);

  const serializedAppointments: TodayAppointment[] = appointments.map((a) => ({
    id: a.id,
    reference: a.reference,
    status: a.status,
    startsAt: a.startsAt.toISOString(),
    endsAt: a.endsAt.toISOString(),
    visitType: a.visitType,
    reasonForVisit: a.reasonForVisit,
    notes: a.notes,
    doctor: a.doctor,
    patient: a.patient,
  }));

  const todayFormatted = formatInTimeZone(now, tz, "EEEE, dd MMMM yyyy");

  return (
    <TodayAppointmentsView
      doctors={doctors}
      appointments={serializedAppointments}
      todayDateFormatted={todayFormatted}
    />
  );
}
