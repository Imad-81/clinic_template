"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "@/lib/auth-client";
import { clinicConfig } from "@/config/clinic.config";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CalendarDays,
  CalendarCheck,
  PlusCircle,
  Stethoscope,
  Clock,
  Users,
  LogOut,
  ExternalLink,
} from "lucide-react";

interface AdminNavProps {
  user: {
    name: string;
    email: string;
    role: string;
  };
}

export function AdminNav({ user }: AdminNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const isAdmin = user.role === "admin";

  async function handleLogout() {
    await signOut();
    router.push("/admin/login");
    router.refresh();
  }

  const navItems = [
    { href: "/admin/today", label: "Today's Clinic", icon: <CalendarDays className="h-4 w-4" /> },
    { href: "/admin/appointments", label: "Appointments", icon: <CalendarCheck className="h-4 w-4" /> },
    { href: "/admin/appointments/new", label: "Book Walk-in", icon: <PlusCircle className="h-4 w-4" /> },
    ...(isAdmin
      ? [
          { href: "/admin/doctors", label: "Doctors", icon: <Stethoscope className="h-4 w-4" /> },
          { href: "/admin/schedules", label: "Schedules & Leave", icon: <Clock className="h-4 w-4" /> },
          { href: "/admin/staff", label: "Staff Users", icon: <Users className="h-4 w-4" /> },
        ]
      : []),
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card shadow-xs">
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Brand */}
        <div className="flex items-center gap-6">
          <Link href="/admin/today" className="flex items-center gap-3">
            <div className="relative h-8 w-36">
              <Image
                src={clinicConfig.logo}
                alt={clinicConfig.name}
                fill
                className="object-contain object-left"
              />
            </div>
            <span className="hidden sm:inline-block font-bold text-xs uppercase tracking-wider text-muted-foreground border-l border-border pl-3">
              Staff Portal
            </span>
          </Link>

          {/* Desktop Nav Items */}
          <nav className="hidden lg:flex items-center gap-1 text-sm font-medium">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 transition-colors ${
                    isActive
                      ? "bg-primary/10 text-primary font-semibold"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Badge & Logout */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-xs font-bold text-foreground leading-none">{user.name}</span>
            <span className="text-[10px] text-muted-foreground mt-0.5">{user.email}</span>
          </div>

          <Badge
            variant={isAdmin ? "default" : "secondary"}
            className="text-[11px] uppercase font-bold tracking-wider"
          >
            {user.role}
          </Badge>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="rounded-lg text-xs font-semibold text-muted-foreground hover:text-destructive cursor-pointer"
            title="Sign Out"
          >
            <LogOut className="h-4 w-4 mr-1.5" />
            <span className="hidden sm:inline">Logout</span>
          </Button>

          <Button asChild variant="outline" size="sm" className="hidden md:flex rounded-lg text-xs">
            <Link href="/" target="_blank" className="flex items-center gap-1.5">
              <span>View Site</span>
              <ExternalLink className="h-3 w-3" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Mobile Nav Sub-bar */}
      <div className="lg:hidden border-t border-border px-4 py-2 bg-muted/20 flex gap-2 overflow-x-auto scrollbar-none text-xs font-medium">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-2.5 py-1 transition-colors ${
                isActive
                  ? "bg-primary text-primary-foreground font-semibold"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </header>
  );
}
