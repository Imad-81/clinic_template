import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-guards";
import { SchedulesManager, DoctorWithSchedules, HolidayItem } from "@/components/admin/SchedulesManager";

export const dynamic = "force-dynamic";

export default async function AdminSchedulesPage() {
  await requireAdmin();

  const [doctors, holidays] = await Promise.all([
    prisma.doctor.findMany({
      where: { isActive: true },
      include: {
        schedules: {
          orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
        },
        timeOffs: {
          orderBy: { startsAt: "asc" },
        },
      },
      orderBy: { displayOrder: "asc" },
    }),
    prisma.clinicHoliday.findMany({
      orderBy: { date: "asc" },
    }),
  ]);

  const serializedDoctors: DoctorWithSchedules[] = doctors.map((d) => ({
    id: d.id,
    fullName: d.fullName,
    specialty: d.specialty,
    schedules: d.schedules.map((s) => ({
      id: s.id,
      dayOfWeek: s.dayOfWeek,
      startTime: s.startTime.toISOString(),
      endTime: s.endTime.toISOString(),
      slotDurationMinutes: s.slotDurationMinutes,
    })),
    timeOffs: d.timeOffs.map((t) => ({
      id: t.id,
      startsAt: t.startsAt.toISOString(),
      endsAt: t.endsAt.toISOString(),
      reason: t.reason,
    })),
  }));

  const serializedHolidays: HolidayItem[] = holidays.map((h) => ({
    id: h.id,
    date: h.date.toISOString(),
    name: h.name,
  }));

  return (
    <SchedulesManager
      doctors={serializedDoctors}
      holidays={serializedHolidays}
    />
  );
}
