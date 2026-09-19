import { requireRole } from "@/lib/auth-guards";
import { AdminNav } from "@/components/admin/AdminNav";

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Strict server-side session and role validation
  const { user } = await requireRole(["admin", "receptionist"]);

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col">
      <AdminNav
        user={{
          name: user.name,
          email: user.email,
          role: (user.role as string) || "receptionist",
        }}
      />
      <main className="flex-1 container mx-auto max-w-7xl px-4 sm:px-6 py-8">
        {children}
      </main>
    </div>
  );
}
