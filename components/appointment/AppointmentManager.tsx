"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { formatInTimeZone } from "date-fns-tz";
import { clinicConfig } from "@/config/clinic.config";
import { getImageUrl } from "@/lib/storage";
import { generateIcsCalendar } from "@/lib/ics";
import {
  getAppointmentByReferenceAction,
  cancelAppointmentAction,
  AppointmentDetailResponse,
} from "@/app/actions/appointment-manage";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import {
  Calendar,
  Clock,
  MapPin,
  Printer,
  Share2,
  CalendarPlus,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Loader2,
  Lock,
  ExternalLink,
} from "lucide-react";

interface AppointmentManagerProps {
  reference: string;
}

export function AppointmentManager({ reference }: AppointmentManagerProps) {
  const [phoneDigits, setPhoneDigits] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [data, setData] = React.useState<AppointmentDetailResponse["appointment"] | null>(null);

  // Cancellation Dialog
  const [cancelOpen, setCancelOpen] = React.useState(false);
  const [cancelReason, setCancelReason] = React.useState("");
  const [cancelling, setCancelling] = React.useState(false);

  // Automatic attempt if 4 or 10 digits entered
  async function handleVerify(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (phoneDigits.length < 4) {
      setError("Please enter at least the last 4 digits of your phone number.");
      return;
    }

    setLoading(true);
    setError(null);

    const res = await getAppointmentByReferenceAction(reference, phoneDigits);
    setLoading(false);

    if (res.success && res.appointment) {
      setData(res.appointment);
    } else {
      setError(res.error || "Unable to verify appointment.");
    }
  }

  // Handle Download .ics
  function handleDownloadIcs() {
    if (!data) return;

    const icsContent = generateIcsCalendar({
      title: `Doctor Consultation with ${data.doctor.fullName}`,
      description: `Appointment Reference: ${data.reference}\\nSpecialty: ${data.doctor.specialty}\\nFee: ₹${data.doctor.consultationFee}`,
      location: clinicConfig.contact.address,
      startsAt: new Date(data.startsAt),
      endsAt: new Date(data.endsAt),
      reference: data.reference,
      clinicName: clinicConfig.name,
    });

    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `appointment-${data.reference}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Handle Print
  function handlePrint() {
    window.print();
  }

  // Handle WhatsApp Share
  function handleWhatsAppShare() {
    if (!data) return;
    const timeFormatted = formatInTimeZone(new Date(data.startsAt), clinicConfig.booking.timezone, "dd MMM yyyy, hh:mm a");
    const message = `Doctor Consultation Confirmed!\n\nReference: ${data.reference}\nDoctor: ${data.doctor.fullName} (${data.doctor.specialty})\nDate & Time: ${timeFormatted}\nClinic: ${clinicConfig.name}\nAddress: ${clinicConfig.contact.address}\n\nMap Directions: ${clinicConfig.contact.directionsUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank");
  }

  // Handle Cancellation
  async function handleConfirmCancel() {
    setCancelling(true);
    setError(null);

    const res = await cancelAppointmentAction(reference, phoneDigits, cancelReason);
    setCancelling(false);

    if (res.success) {
      setCancelOpen(false);
      // Refresh details
      const refreshed = await getAppointmentByReferenceAction(reference, phoneDigits);
      if (refreshed.success && refreshed.appointment) {
        setData(refreshed.appointment);
      }
    } else {
      setError(res.error || "Failed to cancel appointment.");
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Privacy Gate (If not verified yet) */}
      {!data ? (
        <div className="rounded-3xl border border-border/80 bg-card p-6 sm:p-10 shadow-sm text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Lock className="h-7 w-7" />
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-foreground">
            Appointment Verification
          </h2>
          <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
            Reference: <strong className="text-foreground tracking-wider font-mono">{reference}</strong>.
            To view private patient details, please enter the registered mobile number.
          </p>

          <form onSubmit={handleVerify} className="mt-6 max-w-xs mx-auto space-y-4">
            <div>
              <Label htmlFor="phoneDigits" className="text-xs font-semibold block text-left mb-1.5">
                Last 4 Digits (or Full Mobile Number)
              </Label>
              <Input
                id="phoneDigits"
                type="tel"
                placeholder="e.g. 3210"
                maxLength={10}
                value={phoneDigits}
                onChange={(e) => setPhoneDigits(e.target.value.replace(/\D/g, ""))}
                className="text-center font-mono text-base tracking-widest"
                autoFocus
              />
            </div>

            {error && (
              <p className="text-xs text-destructive font-medium flex items-center justify-center gap-1">
                <AlertCircle className="h-3.5 w-3.5" />
                <span>{error}</span>
              </p>
            )}

            <Button type="submit" disabled={loading} className="w-full rounded-xl font-semibold shadow-sm">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  <span>Verifying...</span>
                </>
              ) : (
                <span>Access Appointment</span>
              )}
            </Button>
          </form>
        </div>
      ) : (
        /* Verified Appointment Card */
        <div className="space-y-6">
          <div className="rounded-3xl border border-border/80 bg-card p-6 sm:p-10 shadow-sm relative overflow-hidden">
            {/* Header / Status Banner */}
            <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-border/60">
              <div>
                <span className="text-xs text-muted-foreground block font-medium">
                  Appointment Reference
                </span>
                <span className="text-2xl font-black text-foreground font-mono tracking-wider">
                  {data.reference}
                </span>
              </div>

              <div>
                {data.status === "BOOKED" && (
                  <Badge variant="default" className="text-xs px-3 py-1 font-semibold gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Booking Confirmed</span>
                  </Badge>
                )}
                {data.status === "CONFIRMED" && (
                  <Badge variant="success" className="text-xs px-3 py-1 font-semibold gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Checked-In / Confirmed</span>
                  </Badge>
                )}
                {data.status === "COMPLETED" && (
                  <Badge variant="secondary" className="text-xs px-3 py-1 font-semibold">
                    Completed
                  </Badge>
                )}
                {data.status === "CANCELLED" && (
                  <Badge variant="destructive" className="text-xs px-3 py-1 font-semibold gap-1.5">
                    <XCircle className="h-3.5 w-3.5" />
                    <span>Cancelled</span>
                  </Badge>
                )}
                {data.status === "NO_SHOW" && (
                  <Badge variant="destructive" className="text-xs px-3 py-1 font-semibold">
                    No-Show
                  </Badge>
                )}
              </div>
            </div>

            {/* Doctor Info */}
            <div className="py-6 border-b border-border/60 flex items-start gap-4">
              <div className="relative h-16 w-16 shrink-0 rounded-xl overflow-hidden bg-muted/60 border">
                <Image
                  src={getImageUrl(data.doctor.photoPath)}
                  alt={data.doctor.fullName}
                  fill
                  className="object-cover"
                />
              </div>

              <div className="flex-1">
                <Badge variant="outline" className="text-[11px] mb-1">
                  {data.doctor.specialty}
                </Badge>
                <h3 className="text-lg font-bold text-foreground">
                  {data.doctor.fullName}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Consultation Fee: <strong className="text-foreground font-bold">₹{data.doctor.consultationFee}</strong> (Payable at desk)
                </p>
              </div>
            </div>

            {/* Date, Time & Location */}
            <div className="grid gap-4 sm:grid-cols-2 py-6 border-b border-border/60">
              <div className="rounded-xl bg-muted/40 p-4 border border-border/40 space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                  <Calendar className="h-3.5 w-3.5 text-primary" />
                  <span>Date & Schedule</span>
                </div>
                <p className="text-sm font-bold text-foreground">
                  {formatInTimeZone(new Date(data.startsAt), clinicConfig.booking.timezone, "EEEE, dd MMMM yyyy")}
                </p>
                <p className="text-sm font-bold text-primary flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>
                    {formatInTimeZone(new Date(data.startsAt), clinicConfig.booking.timezone, "hh:mm a")} – {formatInTimeZone(new Date(data.endsAt), clinicConfig.booking.timezone, "hh:mm a")} IST
                  </span>
                </p>
              </div>

              <div className="rounded-xl bg-muted/40 p-4 border border-border/40 space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                  <MapPin className="h-3.5 w-3.5 text-accent" />
                  <span>Clinic Location</span>
                </div>
                <p className="text-xs font-semibold text-foreground leading-snug">
                  {clinicConfig.name}
                </p>
                <p className="text-[11px] text-muted-foreground leading-tight">
                  {clinicConfig.contact.address}
                </p>
                <a
                  href={clinicConfig.contact.directionsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline pt-1"
                >
                  <span>Google Maps Directions</span>
                  <ExternalLink className="h-2.5 w-2.5" />
                </a>
              </div>
            </div>

            {/* Patient Verification Summary */}
            <div className="py-5 border-b border-border/60 space-y-1 text-xs">
              <p className="font-bold uppercase tracking-wider text-muted-foreground">
                Registered Patient Details
              </p>
              <div className="grid grid-cols-2 gap-2 text-foreground pt-1">
                <p>Name: <span className="font-semibold">{data.patient.fullName}</span></p>
                <p>Phone: <span className="font-semibold">{data.patient.phoneMasked}</span></p>
                <p>Age/Gender: <span className="font-semibold">{data.patient.age}y, {data.patient.gender}</span></p>
                <p>Visit Type: <span className="font-semibold">{data.visitType === "FIRST_VISIT" ? "First Visit" : "Follow-up"}</span></p>
              </div>
            </div>

            {/* Cancellation Notice if Cancelled */}
            {data.status === "CANCELLED" && (
              <div className="mt-5 rounded-xl bg-destructive/10 border border-destructive/20 p-4 text-xs text-destructive">
                <p className="font-bold">This consultation has been cancelled.</p>
                {data.cancellationReason && (
                  <p className="mt-1 text-muted-foreground">Reason: {data.cancellationReason}</p>
                )}
                <div className="mt-3">
                  <Button asChild size="sm" className="rounded-lg text-xs">
                    <Link href={`/book?doctor=${data.doctor.slug}`}>
                      Book a New Appointment
                    </Link>
                  </Button>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            {data.status !== "CANCELLED" && (
              <div className="pt-6 flex flex-wrap items-center gap-3">
                <Button
                  onClick={handleDownloadIcs}
                  variant="outline"
                  size="sm"
                  className="rounded-xl flex items-center gap-1.5 font-semibold text-xs"
                >
                  <CalendarPlus className="h-3.5 w-3.5 text-primary" />
                  <span>Add to Calendar (.ics)</span>
                </Button>

                <Button
                  onClick={handlePrint}
                  variant="outline"
                  size="sm"
                  className="rounded-xl flex items-center gap-1.5 font-semibold text-xs print-include"
                >
                  <Printer className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Print Receipt</span>
                </Button>

                <Button
                  onClick={handleWhatsAppShare}
                  variant="outline"
                  size="sm"
                  className="rounded-xl flex items-center gap-1.5 font-semibold text-xs text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                >
                  <Share2 className="h-3.5 w-3.5" />
                  <span>Share on WhatsApp</span>
                </Button>

                <div className="w-full sm:w-auto sm:ml-auto flex items-center gap-2 pt-2 sm:pt-0">
                  <Button asChild variant="secondary" size="sm" className="rounded-xl text-xs font-semibold">
                    <Link href={`/book?doctor=${data.doctor.slug}`}>
                      Reschedule
                    </Link>
                  </Button>

                  {data.canCancel ? (
                    <Button
                      onClick={() => setCancelOpen(true)}
                      variant="destructive"
                      size="sm"
                      className="rounded-xl text-xs font-semibold"
                    >
                      Cancel Appointment
                    </Button>
                  ) : (
                    <span className="text-[11px] text-muted-foreground/80 italic">
                      Cancellation closed (within {clinicConfig.booking.cancellationCutoffHours}h)
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Cancellation Dialog */}
      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogHeader>
          <DialogTitle>Cancel Consultation Appointment</DialogTitle>
          <DialogDescription>
            Are you sure you want to cancel reference <strong className="text-foreground">{reference}</strong>? This slot will immediately be made available to other patients.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <Label htmlFor="cancelReason" className="text-xs font-semibold">
            Reason for Cancellation (Optional)
          </Label>
          <Input
            id="cancelReason"
            placeholder="e.g. Schedule conflict, feeling better"
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setCancelOpen(false)} disabled={cancelling}>
            Keep Appointment
          </Button>
          <Button variant="destructive" onClick={handleConfirmCancel} disabled={cancelling}>
            {cancelling ? "Cancelling..." : "Confirm Cancellation"}
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
