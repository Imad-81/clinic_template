import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "./auth";

export type Role = "admin" | "receptionist";

export async function getCurrentSession() {
  const reqHeaders = await headers();
  const session = await auth.api.getSession({
    headers: reqHeaders,
  });

  if (!session) {
    return null;
  }

  // Check if user is banned
  if (session.user.banned) {
    return null;
  }

  return session;
}

export async function requireRole(allowedRoles: Role[] = ["admin", "receptionist"]) {
  const session = await getCurrentSession();

  if (!session) {
    redirect("/admin/login");
  }

  const userRole = (session.user.role as Role) || "receptionist";

  if (!allowedRoles.includes(userRole)) {
    // If logged in as receptionist trying to access admin-only resource, redirect to today's view
    redirect("/admin/today?error=unauthorized");
  }

  return { session, user: session.user, role: userRole };
}

export async function requireAdmin() {
  return requireRole(["admin"]);
}
