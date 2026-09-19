"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { format, addDays } from "date-fns";
import { getDoctorSlotsAction } from "@/app/actions/booking";
import { createManualBookingAction } from "@/app/actions/admin";
import { GroupedSlots, TimeSlot } from "@/lib/booking/slots";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Clock, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

interface ManualBookingFormProps {
  doctors: {
    id: string;
    fullName: string;
    specialty: string;
    consultationFee: number;
  }[];
}

export function ManualBookingForm({ doctors }: ManualBookingFormProps) {
  const router = useRouter();

  const [doctorId, setDoctorId] = React.useState<string>(doctors[0]?.id || "");
  const [selectedDate, setSelectedDate] = React.useState<string>(format(new Date(), "yyyy-MM-dd"));
  const [groupedSlots, setGroupedSlots] = React.useState<GroupedSlots | null>(null);
  const [selectedSlot, setSelectedSlot] = React.useState<TimeSlot | null>(null);
  const [loadingSlots, setLoadingSlots] = React.useState(false);

  // Patient Fields
  const [fullName, setFullName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [age, setAge] = React.useState("30");
  const [gender, setGender] = React.useState("MALE");
  const [visitType, setVisitType] = React.useState<"FIRST_VISIT" | "FOLLOW_UP">("FIRST_VISIT");
  const [reasonForVisit, setReasonForVisit] = React.useState("");
  const [notes, setNotes] = React.useState("Booked by staff at clinic reception");

  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [successRef, setSuccessRef] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!doctorId || !selectedDate) return;
    setLoadingSlots(true);
    setSelectedSlot(null);

    getDoctorSlotsAction(doctorId, selectedDate)
      .then((res) => {
        setGroupedSlots(res);
        setLoadingSlots(false);
      })
      .catch((err) => {
        console.error(err);
        setLoadingSlots(false);
      });
  }, [doctorId, selectedDate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!doctorId || !selectedSlot) {
      setError("Please pick an available consultation slot.");
      return;
    }

    setSubmitting(true);
    setError(null);

    const res = await createManualBookingAction({
      doctorId,
      startsAt: selectedSlot.startsAt.toISOString(),
      fullName,
      phone,
      email: email || undefined,
      age: parseInt(age, 10),
      gender,
      visitType,
      reasonForVisit: reasonForVisit || undefined,
      notes,
    });

    setSubmitting(false);

    if (res.success && res.reference) {
      setSuccessRef(res.reference);
      setTimeout(() => {
        router.push("/admin/today");
        router.refresh();
      }, 2000);
    } else {
      setError(res.error || "Failed to book consultation.");
    }
  }

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-foreground tracking-tight sm:text-3xl">
          Manual Consultation Booking
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
          Schedule walk-in or phone-in patients directly into verified doctor slots.
        </p>
      </div>

      {successRef && (
        <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4 text-emerald-800 text-sm flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          <div>
            <p className="font-bold">Consultation Booked Successfully!</p>
            <p className="text-xs mt-0.5">Reference: <strong>{successRef}</strong>. Redirecting to today&apos;s schedule...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-xl bg-destructive/10 border border-destructive/20 p-4 text-destructive text-sm flex items-center gap-3">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="rounded-2xl border border-border/80 bg-card p-6 sm:p-8 shadow-xs space-y-6">
        {/* Doctor & Date Pickers */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="docSelect" className="text-xs font-semibold">
              Select Specialist Doctor *
            </Label>
            <Select
              id="docSelect"
              value={doctorId}
              onChange={(e) => setDoctorId(e.target.value)}
              className="mt-1.5"
            >
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.fullName} ({d.specialty} • ₹{d.consultationFee})
                </option>
              ))}
            </Select>
          </div>

          <div>
            <Label htmlFor="dateSelect" className="text-xs font-semibold">
              Consultation Date *
            </Label>
            <Input
              id="dateSelect"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="mt-1.5"
            />
          </div>
        </div>

        {/* Live Slot Picker */}
        <div>
          <Label className="text-xs font-semibold block mb-2">
            Pick Free Consultation Slot *
          </Label>

          {loadingSlots ? (
            <div className="p-6 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span>Checking doctor schedule & free slots...</span>
            </div>
          ) : groupedSlots && groupedSlots.all.length > 0 ? (
            <div className="max-h-48 overflow-y-auto border border-border rounded-xl p-3 bg-muted/20 space-y-3">
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5">
                {groupedSlots.all.map((slot, idx) => {
                  const isSelected = selectedSlot?.startsAt.toISOString() === slot.startsAt.toISOString();
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedSlot(slot)}
                      className={`rounded-lg py-1.5 px-2 text-center text-xs font-bold border transition-all cursor-pointer ${
                        isSelected
                          ? "bg-primary text-primary-foreground border-primary shadow-xs"
                          : "bg-card border-border/80 hover:border-primary/50 text-foreground"
                      }`}
                    >
                      {slot.displayTime}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="p-4 text-center text-xs text-muted-foreground border border-dashed rounded-xl">
              No free slots available for this doctor on {selectedDate}.
            </div>
          )}

          {selectedSlot && (
            <p className="mt-2 text-xs font-bold text-primary flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              <span>Selected Slot: {selectedSlot.displayTime} IST</span>
            </p>
          )}
        </div>

        {/* Patient Details */}
        <div className="border-t border-border/60 pt-4 space-y-4">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Patient Information
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="mName" className="text-xs font-semibold">
                Patient Full Name *
              </Label>
              <Input
                id="mName"
                required
                placeholder="e.g. Anand Varma"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="mt-1.5"
              />
            </div>

            <div>
              <Label htmlFor="mPhone" className="text-xs font-semibold">
                Mobile Number *
              </Label>
              <Input
                id="mPhone"
                required
                placeholder="10-digit number e.g. 9876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-1.5"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label htmlFor="mAge" className="text-xs font-semibold">
                Age *
              </Label>
              <Input
                id="mAge"
                type="number"
                required
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="mt-1.5"
              />
            </div>

            <div>
              <Label htmlFor="mGender" className="text-xs font-semibold">
                Gender *
              </Label>
              <Select
                id="mGender"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="mt-1.5"
              >
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </Select>
            </div>

            <div>
              <Label htmlFor="mVisit" className="text-xs font-semibold">
                Visit Type *
              </Label>
              <Select
                id="mVisit"
                value={visitType}
                onChange={(e) => setVisitType(e.target.value as any)}
                className="mt-1.5"
              >
                <option value="FIRST_VISIT">First Visit</option>
                <option value="FOLLOW_UP">Follow-up</option>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="mReason" className="text-xs font-semibold">
              Reason for Visit (Optional)
            </Label>
            <Input
              id="mReason"
              placeholder="e.g. Knee pain after exercise, general review"
              value={reasonForVisit}
              onChange={(e) => setReasonForVisit(e.target.value)}
              className="mt-1.5"
            />
          </div>

          <div>
            <Label htmlFor="mNotes" className="text-xs font-semibold">
              Staff Internal Notes
            </Label>
            <Input
              id="mNotes"
              placeholder="Internal receptionist remarks"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-1.5"
            />
          </div>
        </div>

        <Button
          type="submit"
          disabled={submitting || !selectedSlot}
          className="w-full rounded-xl font-semibold shadow-xs"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              <span>Booking Walk-in Consultation...</span>
            </>
          ) : (
            <span>Create & Confirm Appointment</span>
          )}
        </Button>
      </form>
    </div>
  );
}
