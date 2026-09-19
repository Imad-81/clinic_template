import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-guards";
import { StaffManager, StaffUserRecord } from "@/components/admin/StaffManager";

export const dynamic = "force-dynamic";

export default async function AdminStaffPage() {
  const { user } = await requireAdmin();

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      banned: true,
      createdAt: true,
    },
  });

  const serialized: StaffUserRecord[] = users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role || "receptionist",
    banned: u.banned ?? false,
    createdAt: u.createdAt.toISOString(),
  }));

  return <StaffManager initialUsers={serialized} currentUserId={user.id} />;
}
