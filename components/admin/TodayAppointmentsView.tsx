"use client";

import * as React from "react";
import { formatInTimeZone } from "date-fns-tz";
import { clinicConfig } from "@/config/clinic.config";
import { updateAppointmentStatusAction } from "@/app/actions/admin";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AppointmentStatus } from "@prisma/client";
import {
  CheckCircle,
  XCircle,
  Clock,
  User,
  AlertCircle,
  Phone,
  FileText,
  UserCheck,
  UserX,
  Loader2,
} from "lucide-react";

export interface TodayAppointment {
  id: string;
  reference: string;
  status: AppointmentStatus;
  startsAt: string; // ISO
  endsAt: string;   // ISO
  visitType: string;
  reasonForVisit: string | null;
  notes: string | null;
  doctor: {
    id: string;
    fullName: string;
    specialty: string;
  };
  patient: {
    fullName: string;
    phone: string;
    age: number;
    gender: string;
  };
}

interface TodayViewProps {
  doctors: { id: string; fullName: string; specialty: string }[];
  appointments: TodayAppointment[];
  todayDateFormatted: string;
}

export function TodayAppointmentsView({ doctors, appointments, todayDateFormatted }: TodayViewProps) {
  const [activeDoctorId, setActiveDoctorId] = React.useState<string>("all");
  const [loadingId, setLoadingId] = React.useState<string | null>(null);

  // Notes Modal
  const [notesModalOpen, setNotesModalOpen] = React.useState(false);
  const [targetAppointment, setTargetAppointment] = React.useState<TodayAppointment | null>(null);
  const [currentNotes, setCurrentNotes] = React.useState("");

  const filteredAppointments =
    activeDoctorId === "all"
      ? appointments
      : appointments.filter((a) => a.doctor.id === activeDoctorId);

  // Status breakdown counts
  const totalCount = appointments.length;
  const bookedCount = appointments.filter((a) => a.status === "BOOKED").length;
  const confirmedCount = appointments.filter((a) => a.status === "CONFIRMED").length;
  const completedCount = appointments.filter((a) => a.status === "COMPLETED").length;
  const cancelledCount = appointments.filter((a) => a.status === "CANCELLED").length;

  async function handleQuickStatus(appointmentId: string, status: AppointmentStatus) {
    setLoadingId(appointmentId);
    await updateAppointmentStatusAction({
      appointmentId,
      status,
    });
    setLoadingId(null);
  }

  async function handleSaveNotes() {
    if (!targetAppointment) return;
    setLoadingId(targetAppointment.id);
    await updateAppointmentStatusAction({
      appointmentId: targetAppointment.id,
      status: targetAppointment.status,
      notes: currentNotes,
    });
    setLoadingId(null);
    setNotesModalOpen(false);
  }

  return (
    <div className="space-y-6">
      {/* Top Banner / Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight sm:text-3xl">
            Today&apos;s Clinic Schedule
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            {todayDateFormatted} • Outpatient Consultation Desk
          </p>
        </div>

        {/* Quick Summary Badges */}
        <div className="flex flex-wrap gap-2 text-xs font-semibold">
          <Badge variant="outline" className="px-3 py-1">
            Total: {totalCount}
          </Badge>
          <Badge variant="default" className="px-3 py-1 bg-sky-600">
            Booked: {bookedCount}
          </Badge>
          <Badge variant="success" className="px-3 py-1">
            Checked In: {confirmedCount}
          </Badge>
          <Badge variant="secondary" className="px-3 py-1">
            Completed: {completedCount}
          </Badge>
          {cancelledCount > 0 && (
            <Badge variant="destructive" className="px-3 py-1">
              Cancelled: {cancelledCount}
            </Badge>
          )}
        </div>
      </div>

      {/* Doctor Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
        <button
          type="button"
          onClick={() => setActiveDoctorId("all")}
          className={`rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeDoctorId === "all"
              ? "bg-foreground text-background shadow-xs"
              : "bg-card border border-border text-muted-foreground hover:text-foreground"
          }`}
        >
          All Specialists ({appointments.length})
        </button>

        {doctors.map((doc) => {
          const count = appointments.filter((a) => a.doctor.id === doc.id).length;
          const isSelected = activeDoctorId === doc.id;
          return (
            <button
              key={doc.id}
              type="button"
              onClick={() => setActiveDoctorId(doc.id)}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                isSelected
                  ? "bg-foreground text-background shadow-xs"
                  : "bg-card border border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {doc.fullName} ({count})
            </button>
          );
        })}
      </div>

      {/* Appointments List */}
      {filteredAppointments.length === 0 ? (
        <div className="rounded-2xl border border-border/80 bg-card p-12 text-center shadow-xs">
          <Clock className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
          <h3 className="text-base font-bold text-foreground">No appointments scheduled for today</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            No patients booked under this filter for today. Staff can add walk-in consultations anytime.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredAppointments.map((app) => {
            const timeStr = formatInTimeZone(
              new Date(app.startsAt),
              clinicConfig.booking.timezone,
              "hh:mm a"
            );
            const isLoading = loadingId === app.id;

            return (
              <div
                key={app.id}
                className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl border border-border/80 bg-card p-5 shadow-xs transition-all hover:border-primary/40"
              >
                {/* Left: Time & Doctor */}
                <div className="flex items-start gap-4 sm:w-64 shrink-0">
                  <div className="rounded-xl bg-primary/10 px-3.5 py-2.5 text-center border border-primary/20 shrink-0">
                    <span className="text-sm font-black text-primary block leading-none">
                      {timeStr}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-semibold mt-0.5 block">
                      IST
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-mono font-bold text-muted-foreground tracking-wider block">
                      {app.reference}
                    </span>
                    <h4 className="text-sm font-bold text-foreground leading-tight mt-0.5">
                      {app.doctor.fullName}
                    </h4>
                    <span className="text-xs text-primary font-medium">
                      {app.doctor.specialty}
                    </span>
                  </div>
                </div>

                {/* Middle: Patient Info */}
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-foreground">
                      {app.patient.fullName}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      ({app.patient.age}y, {app.patient.gender})
                    </span>
                    <Badge variant="outline" className="text-[10px] py-0 px-1.5 font-medium">
                      {app.visitType === "FIRST_VISIT" ? "First Visit" : "Follow-up"}
                    </Badge>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <a
                      href={`tel:${app.patient.phone}`}
                      className="inline-flex items-center gap-1 hover:text-primary transition-colors"
                    >
                      <Phone className="h-3 w-3" />
                      <span>{app.patient.phone}</span>
                    </a>

                    {app.reasonForVisit && (
                      <span className="italic text-foreground/80 truncate max-w-xs">
                        &quot;{app.reasonForVisit}&quot;
                      </span>
                    )}
                  </div>

                  {app.notes && (
                    <p className="text-[11px] text-amber-700 bg-amber-500/10 rounded px-2 py-0.5 inline-block mt-1">
                      Staff Note: {app.notes}
                    </p>
                  )}
                </div>

                {/* Right: Status & Quick Actions */}
                <div className="flex flex-wrap items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-border/60 justify-end">
                  {/* Status Indicator */}
                  <div className="mr-2">
                    {app.status === "BOOKED" && (
                      <Badge variant="default" className="text-xs font-semibold">
                        Booked
                      </Badge>
                    )}
                    {app.status === "CONFIRMED" && (
                      <Badge variant="success" className="text-xs font-semibold">
                        Checked-In
                      </Badge>
                    )}
                    {app.status === "COMPLETED" && (
                      <Badge variant="secondary" className="text-xs font-semibold">
                        Completed
                      </Badge>
                    )}
                    {app.status === "CANCELLED" && (
                      <Badge variant="destructive" className="text-xs font-semibold">
                        Cancelled
                      </Badge>
                    )}
                    {app.status === "NO_SHOW" && (
                      <Badge variant="destructive" className="text-xs font-semibold">
                        No-Show
                      </Badge>
                    )}
                  </div>

                  {/* Actions depending on status */}
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  ) : (
                    <>
                      {app.status === "BOOKED" && (
                        <Button
                          size="sm"
                          onClick={() => handleQuickStatus(app.id, "CONFIRMED")}
                          className="h-8 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                          <UserCheck className="h-3.5 w-3.5 mr-1" />
                          <span>Check In</span>
                        </Button>
                      )}

                      {(app.status === "BOOKED" || app.status === "CONFIRMED") && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleQuickStatus(app.id, "COMPLETED")}
                            className="h-8 rounded-lg text-xs font-semibold text-emerald-700 hover:bg-emerald-50"
                          >
                            <CheckCircle className="h-3.5 w-3.5 mr-1" />
                            <span>Done</span>
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleQuickStatus(app.id, "NO_SHOW")}
                            className="h-8 rounded-lg text-xs font-medium text-muted-foreground hover:text-destructive"
                          >
                            <UserX className="h-3.5 w-3.5 mr-1" />
                            <span>No-Show</span>
                          </Button>
                        </>
                      )}

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setTargetAppointment(app);
                          setCurrentNotes(app.notes || "");
                          setNotesModalOpen(true);
                        }}
                        className="h-8 rounded-lg text-xs text-muted-foreground hover:text-foreground"
                        title="Add/Edit Notes"
                      >
                        <FileText className="h-3.5 w-3.5" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Notes Dialog */}
      <Dialog open={notesModalOpen} onOpenChange={setNotesModalOpen}>
        <DialogHeader>
          <DialogTitle>Admin Internal Notes</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <p className="text-xs text-muted-foreground">
            Notes for {targetAppointment?.patient.fullName} ({targetAppointment?.reference}). Visible to staff only.
          </p>
          <Input
            placeholder="e.g. Patient called to say running 5 mins late; reports mild dizziness"
            value={currentNotes}
            onChange={(e) => setCurrentNotes(e.target.value)}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setNotesModalOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSaveNotes} disabled={loadingId !== null}>
            Save Notes
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
