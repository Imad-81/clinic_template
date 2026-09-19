import { prisma } from "@/lib/db";
import { ManualBookingForm } from "@/components/admin/ManualBookingForm";

export const dynamic = "force-dynamic";

export default async function AdminNewAppointmentPage() {
  const doctors = await prisma.doctor.findMany({
    where: { isActive: true },
    select: {
      id: true,
      fullName: true,
      specialty: true,
      consultationFee: true,
    },
    orderBy: { displayOrder: "asc" },
  });

  return <ManualBookingForm doctors={doctors} />;
}
