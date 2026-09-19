import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { admin } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";
import { createAccessControl } from "better-auth/plugins/access";
import { prisma } from "./db";

export const statement = {
  appointment: ["create", "read", "update", "delete"],
  doctor: ["create", "read", "update", "delete"],
  schedule: ["create", "read", "update", "delete"],
  staff: ["create", "read", "update", "delete"],
} as const;

export const ac = createAccessControl(statement);

export const adminRole = ac.newRole({
  appointment: ["create", "read", "update", "delete"],
  doctor: ["create", "read", "update", "delete"],
  schedule: ["create", "read", "update", "delete"],
  staff: ["create", "read", "update", "delete"],
});

export const receptionistRole = ac.newRole({
  appointment: ["create", "read", "update", "delete"],
  doctor: ["read"],
  schedule: ["read"],
  staff: [],
});

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
  },
  plugins: [
    admin({
      ac,
      roles: {
        admin: adminRole,
        receptionist: receptionistRole,
      },
      defaultRole: "receptionist",
      adminRole: "admin",
    }),
    nextCookies(),
  ],
  rateLimit: {
    storage: "database",
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
  trustedOrigins: [
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
    "http://localhost:3000",
  ],
});

export type Session = typeof auth.$Infer.Session;
