import { prisma } from "@/lib/db";
import { AppointmentsListView, AppointmentRecord } from "@/components/admin/AppointmentsListView";

export const dynamic = "force-dynamic";

export default async function AdminAppointmentsPage() {
  const [doctors, appointments] = await Promise.all([
    prisma.doctor.findMany({
      select: { id: true, fullName: true, specialty: true },
      orderBy: { displayOrder: "asc" },
    }),
    prisma.appointment.findMany({
      include: {
        doctor: {
          select: { id: true, fullName: true, specialty: true, consultationFee: true },
        },
        patient: {
          select: { id: true, fullName: true, phone: true, email: true, age: true, gender: true },
        },
      },
      orderBy: { startsAt: "desc" },
      take: 200, // Reasonable initial page size
    }),
  ]);

  const serialized: AppointmentRecord[] = appointments.map((a) => ({
    id: a.id,
    reference: a.reference,
    status: a.status,
    startsAt: a.startsAt.toISOString(),
    endsAt: a.endsAt.toISOString(),
    visitType: a.visitType,
    reasonForVisit: a.reasonForVisit,
    cancellationReason: a.cancellationReason,
    cancelledAt: a.cancelledAt?.toISOString() || null,
    cancelledBy: a.cancelledBy,
    notes: a.notes,
    doctor: a.doctor,
    patient: a.patient,
  }));

  return (
    <AppointmentsListView
      initialAppointments={serialized}
      doctors={doctors}
    />
  );
}
