import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-guards";
import { DoctorsManager, DoctorAdminRecord } from "@/components/admin/DoctorsManager";

export const dynamic = "force-dynamic";

export default async function AdminDoctorsPage() {
  await requireAdmin();

  const doctors = await prisma.doctor.findMany({
    orderBy: { displayOrder: "asc" },
  });

  const serialized: DoctorAdminRecord[] = doctors.map((d) => ({
    id: d.id,
    slug: d.slug,
    fullName: d.fullName,
    specialty: d.specialty,
    qualifications: d.qualifications,
    experienceYears: d.experienceYears,
    bio: d.bio,
    languages: d.languages,
    consultationFee: d.consultationFee,
    photoPath: d.photoPath,
    isActive: d.isActive,
    displayOrder: d.displayOrder,
  }));

  return <DoctorsManager initialDoctors={serialized} />;
}
