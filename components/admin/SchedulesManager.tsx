"use client";

import * as React from "react";
import { formatInTimeZone } from "date-fns-tz";
import {
  addDoctorScheduleAction,
  deleteDoctorScheduleAction,
  addDoctorTimeOffAction,
  deleteDoctorTimeOffAction,
  createClinicHolidayAction,
  deleteClinicHolidayAction,
} from "@/app/actions/admin";
import { clinicConfig } from "@/config/clinic.config";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Dialog, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  Clock,
  Calendar,
  PlusCircle,
  Trash2,
  AlertTriangle,
  UserCheck,
  CheckCircle2,
} from "lucide-react";

export interface ScheduleItem {
  id: string;
  dayOfWeek: number;
  startTime: string; // ISO
  endTime: string;   // ISO
  slotDurationMinutes: number | null;
}

export interface TimeOffItem {
  id: string;
  startsAt: string; // ISO
  endsAt: string;   // ISO
  reason: string;
}

export interface HolidayItem {
  id: string;
  date: string; // ISO
  name: string;
}

export interface DoctorWithSchedules {
  id: string;
  fullName: string;
  specialty: string;
  schedules: ScheduleItem[];
  timeOffs: TimeOffItem[];
}

interface SchedulesManagerProps {
  doctors: DoctorWithSchedules[];
  holidays: HolidayItem[];
}

const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function SchedulesManager({ doctors: initialDoctors, holidays: initialHolidays }: SchedulesManagerProps) {
  const [doctors, setDoctors] = React.useState<DoctorWithSchedules[]>(initialDoctors);
  const [holidays, setHolidays] = React.useState<HolidayItem[]>(initialHolidays);

  const [selectedDoctorId, setSelectedDoctorId] = React.useState<string>(initialDoctors[0]?.id || "");
  const [activeTab, setActiveTab] = React.useState<"weekly" | "timeoff" | "holidays">("weekly");

  const [warningMessage, setWarningMessage] = React.useState<string | null>(null);

  // New Shift Modal
  const [shiftModalOpen, setShiftModalOpen] = React.useState(false);
  const [newDay, setNewDay] = React.useState("1");
  const [newStart, setNewStart] = React.useState("09:00");
  const [newEnd, setNewEnd] = React.useState("13:00");
  const [newDuration, setNewDuration] = React.useState("15");

  // New Time-off Modal
  const [timeOffModalOpen, setTimeOffModalOpen] = React.useState(false);
  const [toStartsAt, setToStartsAt] = React.useState("");
  const [toEndsAt, setToEndsAt] = React.useState("");
  const [toReason, setToReason] = React.useState("Annual Leave / Conference");

  // New Holiday Modal
  const [holidayModalOpen, setHolidayModalOpen] = React.useState(false);
  const [holDate, setHolDate] = React.useState("");
  const [holName, setHolName] = React.useState("");

  const currentDoctor = doctors.find((d) => d.id === selectedDoctorId) || doctors[0];

  // Add Shift
  async function handleAddShift(e: React.FormEvent) {
    e.preventDefault();
    if (!currentDoctor) return;

    await addDoctorScheduleAction({
      doctorId: currentDoctor.id,
      dayOfWeek: parseInt(newDay, 10),
      startTime: newStart,
      endTime: newEnd,
      slotDurationMinutes: parseInt(newDuration, 10),
    });

    setShiftModalOpen(false);
    window.location.reload();
  }

  // Delete Shift
  async function handleDeleteShift(scheduleId: string) {
    await deleteDoctorScheduleAction(scheduleId);
    setDoctors((prev) =>
      prev.map((d) =>
        d.id === currentDoctor.id
          ? { ...d, schedules: d.schedules.filter((s) => s.id !== scheduleId) }
          : d
      )
    );
  }

  // Add Time Off with Conflict Check
  async function handleAddTimeOff(e: React.FormEvent) {
    e.preventDefault();
    if (!currentDoctor || !toStartsAt || !toEndsAt) return;

    const res = await addDoctorTimeOffAction({
      doctorId: currentDoctor.id,
      startsAt: new Date(toStartsAt).toISOString(),
      endsAt: new Date(toEndsAt).toISOString(),
      reason: toReason,
    });

    if (res.warning) {
      setWarningMessage(res.warning);
    }

    setTimeOffModalOpen(false);
    window.location.reload();
  }

  // Delete Time Off
  async function handleDeleteTimeOff(timeOffId: string) {
    await deleteDoctorTimeOffAction(timeOffId);
    setDoctors((prev) =>
      prev.map((d) =>
        d.id === currentDoctor.id
          ? { ...d, timeOffs: d.timeOffs.filter((t) => t.id !== timeOffId) }
          : d
      )
    );
  }

  // Add Clinic Holiday with Conflict Check
  async function handleAddHoliday(e: React.FormEvent) {
    e.preventDefault();
    if (!holDate || !holName) return;

    const res = await createClinicHolidayAction({
      date: holDate,
      name: holName,
    });

    if (res.warning) {
      setWarningMessage(res.warning);
    }

    setHolidayModalOpen(false);
    window.location.reload();
  }

  // Delete Holiday
  async function handleDeleteHoliday(holidayId: string) {
    await deleteClinicHolidayAction(holidayId);
    setHolidays((prev) => prev.filter((h) => h.id !== holidayId));
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight sm:text-3xl">
            Schedules, Leave & Holidays
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Configure weekly consultation shifts, doctor leave dates, and all-clinic holiday closures.
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex gap-2">
          <Button
            variant={activeTab === "weekly" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("weekly")}
            className="rounded-xl text-xs font-semibold"
          >
            Weekly Shifts
          </Button>
          <Button
            variant={activeTab === "timeoff" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("timeoff")}
            className="rounded-xl text-xs font-semibold"
          >
            Doctor Leave
          </Button>
          <Button
            variant={activeTab === "holidays" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("holidays")}
            className="rounded-xl text-xs font-semibold"
          >
            Clinic Holidays
          </Button>
        </div>
      </div>

      {/* Conflict Warning Banner */}
      {warningMessage && (
        <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-4 text-amber-900 text-xs flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold">Schedule Conflict Alert</p>
            <p className="mt-0.5 leading-relaxed">{warningMessage}</p>
          </div>
          <button
            onClick={() => setWarningMessage(null)}
            className="text-amber-800 hover:text-amber-950 font-bold ml-2"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* TAB 1: WEEKLY SHIFTS */}
      {activeTab === "weekly" && (
        <div className="space-y-6">
          {/* Doctor Selector */}
          <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Label htmlFor="docSelectTab" className="text-xs font-bold uppercase text-muted-foreground shrink-0">
                Specialist:
              </Label>
              <Select
                id="docSelectTab"
                value={selectedDoctorId}
                onChange={(e) => setSelectedDoctorId(e.target.value)}
                className="text-xs font-semibold min-w-[240px]"
              >
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.fullName} ({d.specialty})
                  </option>
                ))}
              </Select>
            </div>

            <Button
              onClick={() => setShiftModalOpen(true)}
              size="sm"
              className="rounded-xl flex items-center gap-1.5 text-xs font-semibold"
            >
              <PlusCircle className="h-3.5 w-3.5" />
              <span>Add Consultation Shift</span>
            </Button>
          </div>

          {/* Weekly Days List */}
          <div className="grid gap-4">
            {dayNames.map((dayName, dayIndex) => {
              const shifts = (currentDoctor?.schedules || []).filter((s) => s.dayOfWeek === dayIndex);

              return (
                <div
                  key={dayName}
                  className="rounded-2xl border border-border/80 bg-card p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="sm:w-36">
                    <span className="text-sm font-bold text-foreground block">
                      {dayName}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      {shifts.length} shift(s)
                    </span>
                  </div>

                  <div className="flex-1 flex flex-wrap gap-2">
                    {shifts.length === 0 ? (
                      <span className="text-xs text-muted-foreground/60 italic">
                        No clinic sessions scheduled
                      </span>
                    ) : (
                      shifts.map((s) => {
                        const start = formatInTimeZone(new Date(s.startTime), "UTC", "hh:mm a");
                        const end = formatInTimeZone(new Date(s.endTime), "UTC", "hh:mm a");
                        return (
                          <div
                            key={s.id}
                            className="inline-flex items-center gap-2 rounded-xl bg-muted/60 border px-3 py-1.5 text-xs"
                          >
                            <Clock className="h-3.5 w-3.5 text-primary" />
                            <span className="font-semibold text-foreground">
                              {start} – {end}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              ({s.slotDurationMinutes || 15}m slots)
                            </span>
                            <button
                              type="button"
                              onClick={() => handleDeleteShift(s.id)}
                              className="text-muted-foreground hover:text-destructive transition-colors ml-1 cursor-pointer"
                              title="Delete shift"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: DOCTOR TIME OFF */}
      {activeTab === "timeoff" && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Label className="text-xs font-bold uppercase text-muted-foreground shrink-0">
                Specialist:
              </Label>
              <Select
                value={selectedDoctorId}
                onChange={(e) => setSelectedDoctorId(e.target.value)}
                className="text-xs font-semibold min-w-[240px]"
              >
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.fullName} ({d.specialty})
                  </option>
                ))}
              </Select>
            </div>

            <Button
              onClick={() => setTimeOffModalOpen(true)}
              size="sm"
              className="rounded-xl flex items-center gap-1.5 text-xs font-semibold"
            >
              <PlusCircle className="h-3.5 w-3.5" />
              <span>Record Doctor Leave</span>
            </Button>
          </div>

          <div className="rounded-2xl border border-border/80 bg-card shadow-xs overflow-hidden">
            {(!currentDoctor || currentDoctor.timeOffs.length === 0) ? (
              <div className="p-8 text-center text-xs text-muted-foreground">
                No leave or time-off registered for {currentDoctor?.fullName}.
              </div>
            ) : (
              <div className="divide-y divide-border/60">
                {currentDoctor.timeOffs.map((t) => {
                  const start = formatInTimeZone(new Date(t.startsAt), clinicConfig.booking.timezone, "dd MMM yyyy, hh:mm a");
                  const end = formatInTimeZone(new Date(t.endsAt), clinicConfig.booking.timezone, "dd MMM yyyy, hh:mm a");
                  return (
                    <div key={t.id} className="p-4 flex items-center justify-between gap-4 hover:bg-muted/20">
                      <div>
                        <p className="text-xs font-bold text-foreground">
                          {start} &rarr; {end} (IST)
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          Reason: {t.reason}
                        </p>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteTimeOff(t.id)}
                        className="text-destructive hover:bg-destructive/10 text-xs h-8"
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-1" />
                        <span>Remove</span>
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: CLINIC HOLIDAYS */}
      {activeTab === "holidays" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <p className="text-xs text-muted-foreground">
              Official clinic holidays block slot generation across all doctors.
            </p>
            <Button
              onClick={() => setHolidayModalOpen(true)}
              size="sm"
              className="rounded-xl flex items-center gap-1.5 text-xs font-semibold"
            >
              <PlusCircle className="h-3.5 w-3.5" />
              <span>Add Clinic Holiday</span>
            </Button>
          </div>

          <div className="rounded-2xl border border-border/80 bg-card shadow-xs overflow-hidden divide-y divide-border/60">
            {holidays.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground">
                No clinic holidays listed.
              </div>
            ) : (
              holidays.map((h) => {
                const dateStr = formatInTimeZone(new Date(h.date), "UTC", "EEEE, dd MMMM yyyy");
                return (
                  <div key={h.id} className="p-4 flex items-center justify-between gap-4 hover:bg-muted/20">
                    <div>
                      <p className="text-xs font-bold text-foreground">{h.name}</p>
                      <p className="text-[11px] text-muted-foreground">{dateStr}</p>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteHoliday(h.id)}
                      className="text-destructive hover:bg-destructive/10 text-xs h-8"
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1" />
                      <span>Remove</span>
                    </Button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Modal: Add Shift */}
      <Dialog open={shiftModalOpen} onOpenChange={setShiftModalOpen}>
        <DialogHeader>
          <DialogTitle>Add Weekly Shift Window</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleAddShift} className="space-y-4 py-2 text-xs">
          <div>
            <Label className="text-xs font-semibold">Day of Week</Label>
            <Select value={newDay} onChange={(e) => setNewDay(e.target.value)} className="mt-1">
              {dayNames.map((d, i) => (
                <option key={i} value={i}>
                  {d}
                </option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-semibold">Start Time (24h)</Label>
              <Input
                type="time"
                value={newStart}
                onChange={(e) => setNewStart(e.target.value)}
                className="mt-1"
                required
              />
            </div>
            <div>
              <Label className="text-xs font-semibold">End Time (24h)</Label>
              <Input
                type="time"
                value={newEnd}
                onChange={(e) => setNewEnd(e.target.value)}
                className="mt-1"
                required
              />
            </div>
          </div>

          <div>
            <Label className="text-xs font-semibold">Slot Duration (Minutes)</Label>
            <Input
              type="number"
              value={newDuration}
              onChange={(e) => setNewDuration(e.target.value)}
              className="mt-1"
              required
            />
          </div>

          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => setShiftModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Save Shift</Button>
          </DialogFooter>
        </form>
      </Dialog>

      {/* Modal: Add Time Off */}
      <Dialog open={timeOffModalOpen} onOpenChange={setTimeOffModalOpen}>
        <DialogHeader>
          <DialogTitle>Record Doctor Leave</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleAddTimeOff} className="space-y-4 py-2 text-xs">
          <div>
            <Label className="text-xs font-semibold">Leave Starts At</Label>
            <Input
              type="datetime-local"
              required
              value={toStartsAt}
              onChange={(e) => setToStartsAt(e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <Label className="text-xs font-semibold">Leave Ends At</Label>
            <Input
              type="datetime-local"
              required
              value={toEndsAt}
              onChange={(e) => setToEndsAt(e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <Label className="text-xs font-semibold">Reason for Leave</Label>
            <Input
              value={toReason}
              onChange={(e) => setToReason(e.target.value)}
              className="mt-1"
              required
            />
          </div>

          <p className="text-[11px] text-muted-foreground leading-relaxed">
            * Note: If any appointments were already booked during this leave window, you will receive a conflict warning.
          </p>

          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => setTimeOffModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Record Leave</Button>
          </DialogFooter>
        </form>
      </Dialog>

      {/* Modal: Add Holiday */}
      <Dialog open={holidayModalOpen} onOpenChange={setHolidayModalOpen}>
        <DialogHeader>
          <DialogTitle>Add Clinic Holiday</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleAddHoliday} className="space-y-4 py-2 text-xs">
          <div>
            <Label className="text-xs font-semibold">Holiday Date</Label>
            <Input
              type="date"
              required
              value={holDate}
              onChange={(e) => setHolDate(e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <Label className="text-xs font-semibold">Holiday Name</Label>
            <Input
              required
              placeholder="e.g. Telangana Formation Day"
              value={holName}
              onChange={(e) => setHolName(e.target.value)}
              className="mt-1"
            />
          </div>

          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => setHolidayModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Save Holiday</Button>
          </DialogFooter>
        </form>
      </Dialog>
    </div>
  );
}
