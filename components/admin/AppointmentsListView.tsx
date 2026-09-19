"use client";

import * as React from "react";
import Link from "next/link";
import { formatInTimeZone } from "date-fns-tz";
import { clinicConfig } from "@/config/clinic.config";
import { updateAppointmentStatusAction } from "@/app/actions/admin";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Dialog, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AppointmentStatus } from "@prisma/client";
import {
  Search,
  Download,
  PlusCircle,
  Eye,
} from "lucide-react";

export interface AppointmentRecord {
  id: string;
  reference: string;
  status: AppointmentStatus;
  startsAt: string; // ISO
  endsAt: string;   // ISO
  visitType: string;
  reasonForVisit: string | null;
  cancellationReason: string | null;
  cancelledAt: string | null;
  cancelledBy: string | null;
  notes: string | null;
  doctor: {
    id: string;
    fullName: string;
    specialty: string;
    consultationFee: number;
  };
  patient: {
    id: string;
    fullName: string;
    phone: string;
    email: string | null;
    age: number;
    gender: string;
  };
}

interface AppointmentsListProps {
  initialAppointments: AppointmentRecord[];
  doctors: { id: string; fullName: string; specialty: string }[];
}

export function AppointmentsListView({ initialAppointments, doctors }: AppointmentsListProps) {
  const [appointments, setAppointments] = React.useState<AppointmentRecord[]>(initialAppointments);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedDoctorId, setSelectedDoctorId] = React.useState<string>("all");
  const [selectedStatus, setSelectedStatus] = React.useState<string>("all");
  const [dateFilter, setDateFilter] = React.useState<string>("");

  // Detail Modal / Drawer State
  const [selectedApp, setSelectedApp] = React.useState<AppointmentRecord | null>(null);
  const [editingNotes, setEditingNotes] = React.useState("");
  const [savingNotes, setSavingNotes] = React.useState(false);

  // Filter Logic
  const filtered = appointments.filter((app) => {
    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = app.patient.fullName.toLowerCase().includes(q);
      const matchPhone = app.patient.phone.includes(q);
      const matchRef = app.reference.toLowerCase().includes(q);
      const matchDoc = app.doctor.fullName.toLowerCase().includes(q);
      if (!matchName && !matchPhone && !matchRef && !matchDoc) return false;
    }

    // Doctor filter
    if (selectedDoctorId !== "all" && app.doctor.id !== selectedDoctorId) {
      return false;
    }

    // Status filter
    if (selectedStatus !== "all" && app.status !== selectedStatus) {
      return false;
    }

    // Date filter
    if (dateFilter) {
      const appDateStr = formatInTimeZone(
        new Date(app.startsAt),
        clinicConfig.booking.timezone,
        "yyyy-MM-dd"
      );
      if (appDateStr !== dateFilter) return false;
    }

    return true;
  });

  // Export to CSV
  function handleExportCsv() {
    const headers = [
      "Reference",
      "Date",
      "Time (IST)",
      "Doctor Name",
      "Specialty",
      "Patient Name",
      "Phone",
      "Age",
      "Gender",
      "Visit Type",
      "Status",
      "Consultation Fee",
      "Reason for Visit",
      "Internal Notes",
    ];

    const rows = filtered.map((app) => {
      const dateStr = formatInTimeZone(new Date(app.startsAt), clinicConfig.booking.timezone, "yyyy-MM-dd");
      const timeStr = formatInTimeZone(new Date(app.startsAt), clinicConfig.booking.timezone, "hh:mm a");
      return [
        `"${app.reference}"`,
        `"${dateStr}"`,
        `"${timeStr}"`,
        `"${app.doctor.fullName.replace(/"/g, '""')}"`,
        `"${app.doctor.specialty}"`,
        `"${app.patient.fullName.replace(/"/g, '""')}"`,
        `"${app.patient.phone}"`,
        app.patient.age,
        `"${app.patient.gender}"`,
        `"${app.visitType}"`,
        `"${app.status}"`,
        app.doctor.consultationFee,
        `"${(app.reasonForVisit || "").replace(/"/g, '""')}"`,
        `"${(app.notes || "").replace(/"/g, '""')}"`,
      ].join(",");
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `clinic-appointments-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Handle Save Notes
  async function handleSaveNotes() {
    if (!selectedApp) return;
    setSavingNotes(true);
    await updateAppointmentStatusAction({
      appointmentId: selectedApp.id,
      status: selectedApp.status,
      notes: editingNotes,
    });
    setSavingNotes(false);

    // Update local state
    setAppointments((prev) =>
      prev.map((a) => (a.id === selectedApp.id ? { ...a, notes: editingNotes } : a))
    );
    setSelectedApp((prev) => (prev ? { ...prev, notes: editingNotes } : null));
  }

  // Handle Status Transition from Modal
  async function handleStatusChange(newStatus: AppointmentStatus) {
    if (!selectedApp) return;
    setSavingNotes(true);
    await updateAppointmentStatusAction({
      appointmentId: selectedApp.id,
      status: newStatus,
    });
    setSavingNotes(false);

    // Update local state
    setAppointments((prev) =>
      prev.map((a) => (a.id === selectedApp.id ? { ...a, status: newStatus } : a))
    );
    setSelectedApp((prev) => (prev ? { ...prev, status: newStatus } : null));
  }

  return (
    <div className="space-y-6">
      {/* Header & New Booking CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight sm:text-3xl">
            Consultation Appointments
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Search, filter, and review outpatient consultations across all specialties.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            className="rounded-xl flex items-center gap-1.5 text-xs font-semibold"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export CSV</span>
          </Button>

          <Button asChild size="sm" className="rounded-xl flex items-center gap-1.5 text-xs font-semibold shadow-xs">
            <Link href="/admin/appointments/new">
              <PlusCircle className="h-3.5 w-3.5" />
              <span>Book Walk-in</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-xs">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {/* Search Box */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search name, phone, ref..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 text-xs"
            />
          </div>

          {/* Doctor Filter */}
          <Select
            value={selectedDoctorId}
            onChange={(e) => setSelectedDoctorId(e.target.value)}
            className="text-xs"
          >
            <option value="all">All Doctors</option>
            {doctors.map((d) => (
              <option key={d.id} value={d.id}>
                {d.fullName} ({d.specialty})
              </option>
            ))}
          </Select>

          {/* Status Filter */}
          <Select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="text-xs"
          >
            <option value="all">All Statuses</option>
            <option value="BOOKED">Booked</option>
            <option value="CONFIRMED">Checked-In</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="NO_SHOW">No-Show</option>
          </Select>

          {/* Date Filter */}
          <Input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="text-xs"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-border/80 bg-card shadow-xs overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs font-bold uppercase">Reference</TableHead>
              <TableHead className="text-xs font-bold uppercase">Schedule (IST)</TableHead>
              <TableHead className="text-xs font-bold uppercase">Doctor</TableHead>
              <TableHead className="text-xs font-bold uppercase">Patient</TableHead>
              <TableHead className="text-xs font-bold uppercase">Status</TableHead>
              <TableHead className="text-right text-xs font-bold uppercase">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground text-xs">
                  No appointments found matching your search criteria.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((app) => {
                const dateStr = formatInTimeZone(
                  new Date(app.startsAt),
                  clinicConfig.booking.timezone,
                  "dd MMM yyyy"
                );
                const timeStr = formatInTimeZone(
                  new Date(app.startsAt),
                  clinicConfig.booking.timezone,
                  "hh:mm a"
                );

                return (
                  <TableRow key={app.id} className="hover:bg-muted/30">
                    <TableCell className="font-mono text-xs font-bold text-foreground">
                      {app.reference}
                    </TableCell>

                    <TableCell>
                      <div className="text-xs font-semibold text-foreground">{dateStr}</div>
                      <div className="text-[11px] text-primary font-medium">{timeStr}</div>
                    </TableCell>

                    <TableCell>
                      <div className="text-xs font-bold text-foreground">{app.doctor.fullName}</div>
                      <div className="text-[11px] text-muted-foreground">{app.doctor.specialty}</div>
                    </TableCell>

                    <TableCell>
                      <div className="text-xs font-semibold text-foreground">{app.patient.fullName}</div>
                      <div className="text-[11px] text-muted-foreground">{app.patient.phone}</div>
                    </TableCell>

                    <TableCell>
                      {app.status === "BOOKED" && (
                        <Badge variant="default" className="text-[10px] font-semibold">
                          Booked
                        </Badge>
                      )}
                      {app.status === "CONFIRMED" && (
                        <Badge variant="success" className="text-[10px] font-semibold">
                          Checked-In
                        </Badge>
                      )}
                      {app.status === "COMPLETED" && (
                        <Badge variant="secondary" className="text-[10px] font-semibold">
                          Completed
                        </Badge>
                      )}
                      {app.status === "CANCELLED" && (
                        <Badge variant="destructive" className="text-[10px] font-semibold">
                          Cancelled
                        </Badge>
                      )}
                      {app.status === "NO_SHOW" && (
                        <Badge variant="destructive" className="text-[10px] font-semibold">
                          No-Show
                        </Badge>
                      )}
                    </TableCell>

                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedApp(app);
                          setEditingNotes(app.notes || "");
                        }}
                        className="h-8 rounded-lg text-xs font-semibold"
                      >
                        <Eye className="h-3.5 w-3.5 mr-1" />
                        <span>Details</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Detail Drawer / Modal */}
      <Dialog
        open={selectedApp !== null}
        onOpenChange={(open) => !open && setSelectedApp(null)}
      >
        {selectedApp && (
          <>
            <DialogHeader>
              <div className="flex items-center justify-between pr-6">
                <DialogTitle className="text-lg font-bold">
                  Appointment {selectedApp.reference}
                </DialogTitle>
                <Badge variant="outline" className="text-xs font-mono">
                  {selectedApp.status}
                </Badge>
              </div>
            </DialogHeader>

            <div className="space-y-4 py-2 text-xs">
              {/* Doctor */}
              <div className="rounded-xl bg-muted/40 p-3 border">
                <span className="text-muted-foreground block text-[10px] uppercase font-bold">
                  Doctor
                </span>
                <p className="font-bold text-foreground text-sm mt-0.5">
                  {selectedApp.doctor.fullName} ({selectedApp.doctor.specialty})
                </p>
                <p className="text-muted-foreground mt-0.5">
                  Fee: ₹{selectedApp.doctor.consultationFee}
                </p>
              </div>

              {/* Schedule */}
              <div className="grid grid-cols-2 gap-2 rounded-xl bg-muted/40 p-3 border">
                <div>
                  <span className="text-muted-foreground block text-[10px] uppercase font-bold">
                    Date
                  </span>
                  <p className="font-semibold text-foreground mt-0.5">
                    {formatInTimeZone(new Date(selectedApp.startsAt), clinicConfig.booking.timezone, "dd MMM yyyy")}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px] uppercase font-bold">
                    Slot Time
                  </span>
                  <p className="font-semibold text-primary mt-0.5">
                    {formatInTimeZone(new Date(selectedApp.startsAt), clinicConfig.booking.timezone, "hh:mm a")} IST
                  </p>
                </div>
              </div>

              {/* Patient */}
              <div className="rounded-xl bg-muted/40 p-3 border space-y-1">
                <span className="text-muted-foreground block text-[10px] uppercase font-bold">
                  Patient Information
                </span>
                <p className="font-bold text-foreground">
                  {selectedApp.patient.fullName} ({selectedApp.patient.age}y, {selectedApp.patient.gender})
                </p>
                <p className="text-muted-foreground">Phone: {selectedApp.patient.phone}</p>
                {selectedApp.patient.email && (
                  <p className="text-muted-foreground">Email: {selectedApp.patient.email}</p>
                )}
                {selectedApp.reasonForVisit && (
                  <p className="text-foreground pt-1 italic">
                    Reason: &ldquo;{selectedApp.reasonForVisit}&rdquo;
                  </p>
                )}
              </div>

              {/* Cancellation Info */}
              {selectedApp.status === "CANCELLED" && (
                <div className="rounded-xl bg-destructive/10 border border-destructive/20 p-3 text-destructive">
                  <p className="font-bold">Cancelled by: {selectedApp.cancelledBy || "Patient"}</p>
                  {selectedApp.cancellationReason && (
                    <p className="mt-0.5 text-xs">Reason: {selectedApp.cancellationReason}</p>
                  )}
                </div>
              )}

              {/* Internal Notes */}
              <div>
                <span className="text-muted-foreground block text-[10px] uppercase font-bold mb-1">
                  Staff Internal Notes
                </span>
                <Input
                  placeholder="Add internal notes about this consultation..."
                  value={editingNotes}
                  onChange={(e) => setEditingNotes(e.target.value)}
                />
              </div>

              {/* Status Transition Buttons */}
              <div className="pt-2 border-t flex flex-wrap items-center gap-2">
                <span className="text-xs text-muted-foreground mr-1 font-semibold">
                  Change Status:
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleStatusChange("CONFIRMED")}
                  className="text-xs h-7"
                >
                  Check In
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleStatusChange("COMPLETED")}
                  className="text-xs h-7 text-emerald-700"
                >
                  Completed
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleStatusChange("NO_SHOW")}
                  className="text-xs h-7"
                >
                  No-Show
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleStatusChange("CANCELLED")}
                  className="text-xs h-7"
                >
                  Cancel
                </Button>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedApp(null)}>
                Close
              </Button>
              <Button onClick={handleSaveNotes} disabled={savingNotes}>
                {savingNotes ? "Saving..." : "Save Notes"}
              </Button>
            </DialogFooter>
          </>
        )}
      </Dialog>
    </div>
  );
}
