"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { format, addDays } from "date-fns";
import { getImageUrl } from "@/lib/storage";
import { getDoctorSlotsAction, createBookingAction } from "@/app/actions/booking";
import { GroupedSlots, TimeSlot } from "@/lib/booking/slots";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import {
  Clock,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sun,
  Sunset,
  Moon,
} from "lucide-react";

export interface DoctorOption {
  id: string;
  slug: string;
  fullName: string;
  specialty: string;
  qualifications: string;
  experienceYears: number;
  consultationFee: number;
  languages: string[];
  photoPath: string;
}

interface BookingWizardProps {
  doctors: DoctorOption[];
  preselectedDoctorSlug?: string;
}

export function BookingWizard({ doctors, preselectedDoctorSlug }: BookingWizardProps) {
  const router = useRouter();

  // Step 1: Doctor
  const initialDoctor =
    doctors.find((d) => d.slug === preselectedDoctorSlug) || doctors[0] || null;
  const [selectedDoctor, setSelectedDoctor] = React.useState<DoctorOption | null>(initialDoctor);
  const [specialtyFilter, setSpecialtyFilter] = React.useState<string>("All");

  // Step 2: Date & Slot
  const todayStr = format(new Date(), "yyyy-MM-dd");
  const [selectedDateStr, setSelectedDateStr] = React.useState<string>(todayStr);
  const [groupedSlots, setGroupedSlots] = React.useState<GroupedSlots | null>(null);
  const [selectedSlot, setSelectedSlot] = React.useState<TimeSlot | null>(null);
  const [loadingSlots, setLoadingSlots] = React.useState<boolean>(false);

  // Step 3: Patient Form
  const [fullName, setFullName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [age, setAge] = React.useState<string>("");
  const [gender, setGender] = React.useState<"MALE" | "FEMALE" | "OTHER">("MALE");
  const [visitType, setVisitType] = React.useState<"FIRST_VISIT" | "FOLLOW_UP">("FIRST_VISIT");
  const [reasonForVisit, setReasonForVisit] = React.useState("");
  const [consentGiven, setConsentGiven] = React.useState(false);

  // Step navigation (1 to 4)
  const [step, setStep] = React.useState<number>(preselectedDoctorSlug ? 2 : 1);
  const [submitting, setSubmitting] = React.useState<boolean>(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  // Extract unique specialties
  const specialties = ["All", ...Array.from(new Set(doctors.map((d) => d.specialty)))];

  const filteredDoctors =
    specialtyFilter === "All"
      ? doctors
      : doctors.filter((d) => d.specialty === specialtyFilter);

  // Fetch slots whenever doctor or date changes
  React.useEffect(() => {
    if (!selectedDoctor || !selectedDateStr) return;

    let isMounted = true;
    const timer = setTimeout(() => {
      setLoadingSlots(true);
      setSelectedSlot(null);
    }, 0);

    getDoctorSlotsAction(selectedDoctor.id, selectedDateStr)
      .then((res) => {
        if (isMounted) {
          setGroupedSlots(res);
          setLoadingSlots(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error(err);
          setLoadingSlots(false);
        }
      });

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [selectedDoctor, selectedDateStr]);

  // Handle Form Submission
  async function handleSubmit() {
    if (!selectedDoctor || !selectedSlot) return;

    setSubmitting(true);
    setErrorMessage(null);

    const res = await createBookingAction({
      doctorId: selectedDoctor.id,
      startsAtIso: selectedSlot.startsAt.toISOString(),
      fullName,
      phone,
      email: email || undefined,
      age: parseInt(age, 10),
      gender,
      visitType,
      reasonForVisit: reasonForVisit || undefined,
      consentGiven: Boolean(consentGiven),
    });

    if (res.success && res.reference) {
      router.push(`/appointment/${res.reference}`);
    } else {
      setErrorMessage(res.error || "Booking failed. Please try again.");
      setSubmitting(false);
    }
  }

  // Next Step validation
  function canProceed(): boolean {
    if (step === 1) return selectedDoctor !== null;
    if (step === 2) return selectedSlot !== null;
    if (step === 3) {
      const isPhoneValid = /^[6-9]\d{9}$/.test(phone.replace(/\D/g, ""));
      const isAgeValid = parseInt(age, 10) > 0 && parseInt(age, 10) <= 120;
      return (
        fullName.trim().length >= 2 &&
        isPhoneValid &&
        isAgeValid &&
        consentGiven
      );
    }
    return true;
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Step Progress Bar */}
      <div className="mb-8">
        <div className="grid grid-cols-4 gap-2 text-center text-xs font-semibold sm:text-sm">
          {[
            { num: 1, label: "Doctor" },
            { num: 2, label: "Date & Time" },
            { num: 3, label: "Your Details" },
            { num: 4, label: "Review" },
          ].map((s) => (
            <div
              key={s.num}
              className={`pb-2 border-b-2 transition-colors ${
                step === s.num
                  ? "border-primary text-primary font-bold"
                  : step > s.num
                  ? "border-emerald-600 text-emerald-700"
                  : "border-border text-muted-foreground/60"
              }`}
            >
              <span className="hidden sm:inline">Step {s.num}: </span>
              <span>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div className="mb-6 rounded-xl bg-destructive/10 border border-destructive/20 p-4 text-sm text-destructive flex items-start gap-3">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">{errorMessage}</p>
            {errorMessage.includes("taken") && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setStep(2);
                  setErrorMessage(null);
                }}
                className="mt-2 text-xs h-8"
              >
                Pick Another Slot
              </Button>
            )}
          </div>
        </div>
      )}

      {/* STEP 1: CHOOSE DOCTOR */}
      {step === 1 && (
        <div className="space-y-6 animate-in fade-in-50 duration-200">
          <div>
            <h2 className="text-xl font-bold text-foreground">Select a Specialist</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Choose the doctor you would like to consult with.
            </p>
          </div>

          {/* Specialty Filter Badges */}
          <div className="flex flex-wrap gap-2 pt-1">
            {specialties.map((spec) => (
              <button
                key={spec}
                type="button"
                onClick={() => setSpecialtyFilter(spec)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                  specialtyFilter === spec
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                {spec}
              </button>
            ))}
          </div>

          {/* Doctors Grid */}
          <div className="grid gap-4 sm:grid-cols-2">
            {filteredDoctors.map((doc) => {
              const isSelected = selectedDoctor?.id === doc.id;
              return (
                <div
                  key={doc.id}
                  onClick={() => setSelectedDoctor(doc)}
                  className={`flex gap-4 rounded-2xl border p-4 cursor-pointer transition-all ${
                    isSelected
                      ? "border-primary bg-primary/5 shadow-md ring-2 ring-primary/20"
                      : "border-border/80 bg-card hover:border-primary/40 hover:shadow-sm"
                  }`}
                >
                  <div className="relative h-20 w-20 shrink-0 rounded-xl overflow-hidden bg-muted/60 border border-border/60">
                    <Image
                      src={getImageUrl(doc.photoPath)}
                      alt={doc.fullName}
                      fill
                      className="object-cover"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-bold text-primary truncate">
                        {doc.specialty}
                      </span>
                      <span className="text-xs font-bold text-foreground">
                        ₹{doc.consultationFee}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-foreground truncate mt-0.5">
                      {doc.fullName}
                    </h3>
                    <p className="text-xs text-muted-foreground truncate">{doc.qualifications}</p>
                    <p className="text-[11px] text-muted-foreground/80 mt-1">
                      {doc.experienceYears}y exp • {doc.languages.join(", ")}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* STEP 2: CHOOSE DATE & TIME */}
      {step === 2 && selectedDoctor && (
        <div className="space-y-6 animate-in fade-in-50 duration-200">
          <div>
            <h2 className="text-xl font-bold text-foreground">Select Consultation Time</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Consulting with <strong className="text-foreground">{selectedDoctor.fullName}</strong> ({selectedDoctor.specialty} • ₹{selectedDoctor.consultationFee})
            </p>
          </div>

          {/* Rolling Date Chips (Next 14 Days) */}
          <div>
            <Label className="text-xs font-semibold uppercase text-muted-foreground mb-2 block">
              Choose Date
            </Label>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
              {[...Array(14)].map((_, i) => {
                const d = addDays(new Date(), i);
                const dStr = format(d, "yyyy-MM-dd");
                const dayName = format(d, "EEE");
                const dayNum = format(d, "dd MMM");
                const isSelected = selectedDateStr === dStr;

                return (
                  <button
                    key={dStr}
                    type="button"
                    onClick={() => setSelectedDateStr(dStr)}
                    className={`flex flex-col items-center min-w-[76px] rounded-xl border p-2.5 transition-all cursor-pointer ${
                      isSelected
                        ? "border-primary bg-primary text-primary-foreground shadow-sm font-semibold"
                        : "border-border/80 bg-card hover:border-primary/50 text-foreground"
                    }`}
                  >
                    <span className="text-xs opacity-80">{dayName}</span>
                    <span className="text-sm font-bold mt-0.5">{dayNum}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Slots View */}
          <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <span>Available Slots for {format(new Date(selectedDateStr), "EEEE, dd MMMM yyyy")}</span>
              </h3>
              {loadingSlots && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
            </div>

            {loadingSlots ? (
              <div className="py-12 text-center text-muted-foreground text-sm flex flex-col items-center justify-center gap-2">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span>Loading free slots...</span>
              </div>
            ) : groupedSlots && groupedSlots.all.length > 0 ? (
              <div className="space-y-6">
                {/* Morning Slots */}
                {groupedSlots.morning.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2.5">
                      <Sun className="h-3.5 w-3.5 text-amber-500" />
                      <span>Morning Session (Before 12 PM)</span>
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                      {groupedSlots.morning.map((slot, idx) => {
                        const isSelected = selectedSlot?.startsAt.toISOString() === slot.startsAt.toISOString();
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setSelectedSlot(slot)}
                            className={`rounded-lg py-2 px-1 text-center text-xs font-semibold border transition-all cursor-pointer ${
                              isSelected
                                ? "border-primary bg-primary text-primary-foreground shadow-sm"
                                : "border-border/80 bg-muted/40 text-foreground hover:border-primary/50 hover:bg-muted"
                            }`}
                          >
                            {slot.displayTime}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Afternoon Slots */}
                {groupedSlots.afternoon.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2.5">
                      <Sunset className="h-3.5 w-3.5 text-orange-500" />
                      <span>Afternoon Session (12 PM - 5 PM)</span>
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                      {groupedSlots.afternoon.map((slot, idx) => {
                        const isSelected = selectedSlot?.startsAt.toISOString() === slot.startsAt.toISOString();
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setSelectedSlot(slot)}
                            className={`rounded-lg py-2 px-1 text-center text-xs font-semibold border transition-all cursor-pointer ${
                              isSelected
                                ? "border-primary bg-primary text-primary-foreground shadow-sm"
                                : "border-border/80 bg-muted/40 text-foreground hover:border-primary/50 hover:bg-muted"
                            }`}
                          >
                            {slot.displayTime}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Evening Slots */}
                {groupedSlots.evening.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2.5">
                      <Moon className="h-3.5 w-3.5 text-indigo-500" />
                      <span>Evening Session (After 5 PM)</span>
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                      {groupedSlots.evening.map((slot, idx) => {
                        const isSelected = selectedSlot?.startsAt.toISOString() === slot.startsAt.toISOString();
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setSelectedSlot(slot)}
                            className={`rounded-lg py-2 px-1 text-center text-xs font-semibold border transition-all cursor-pointer ${
                              isSelected
                                ? "border-primary bg-primary text-primary-foreground shadow-sm"
                                : "border-border/80 bg-muted/40 text-foreground hover:border-primary/50 hover:bg-muted"
                            }`}
                          >
                            {slot.displayTime}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-10 text-center text-sm text-muted-foreground">
                <p className="font-semibold text-foreground">No available slots for this date.</p>
                <p className="text-xs mt-1">Please select another date or choose a different doctor.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* STEP 3: PATIENT DETAILS */}
      {step === 3 && (
        <div className="space-y-6 animate-in fade-in-50 duration-200">
          <div>
            <h2 className="text-xl font-bold text-foreground">Patient Information</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Minimum details required for outpatient clinical consultation.
            </p>
          </div>

          <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-sm space-y-4">
            {/* Full Name */}
            <div>
              <Label htmlFor="fullName" className="text-xs font-semibold">
                Patient Full Name *
              </Label>
              <Input
                id="fullName"
                placeholder="e.g. Ramesh Kumar"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="mt-1.5"
              />
            </div>

            {/* Mobile & Email */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="phone" className="text-xs font-semibold">
                  Mobile Number (India) *
                </Label>
                <div className="relative mt-1.5">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-xs font-semibold text-muted-foreground">
                    +91
                  </span>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="98765 43210"
                    maxLength={10}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                    className="pl-12"
                  />
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">
                  10 digits starting with 6, 7, 8, or 9
                </p>
              </div>

              <div>
                <Label htmlFor="email" className="text-xs font-semibold">
                  Email Address (Optional)
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1.5"
                />
              </div>
            </div>

            {/* Age, Gender, Visit Type */}
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <Label htmlFor="age" className="text-xs font-semibold">
                  Age (Years) *
                </Label>
                <Input
                  id="age"
                  type="number"
                  placeholder="e.g. 42"
                  min={1}
                  max={120}
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="gender" className="text-xs font-semibold">
                  Gender *
                </Label>
                <Select
                  id="gender"
                  value={gender}
                  onChange={(e) => setGender(e.target.value as "MALE" | "FEMALE" | "OTHER")}
                  className="mt-1.5"
                >
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </Select>
              </div>

              <div>
                <Label htmlFor="visitType" className="text-xs font-semibold">
                  Visit Type *
                </Label>
                <Select
                  id="visitType"
                  value={visitType}
                  onChange={(e) => setVisitType(e.target.value as "FIRST_VISIT" | "FOLLOW_UP")}
                  className="mt-1.5"
                >
                  <option value="FIRST_VISIT">First Visit</option>
                  <option value="FOLLOW_UP">Follow-up</option>
                </Select>
              </div>
            </div>

            {/* Reason for Visit */}
            <div>
              <div className="flex justify-between items-center">
                <Label htmlFor="reason" className="text-xs font-semibold">
                  Reason for Visit / Symptoms (Optional)
                </Label>
                <span className="text-[11px] text-muted-foreground">
                  {reasonForVisit.length}/200
                </span>
              </div>
              <Textarea
                id="reason"
                maxLength={200}
                placeholder="Briefly describe what you would like to discuss (e.g. routine BP check, joint stiffness, chest discomfort)"
                value={reasonForVisit}
                onChange={(e) => setReasonForVisit(e.target.value)}
                className="mt-1.5 text-sm"
              />
            </div>

            {/* DPDP Act Privacy Notice & Consent */}
            <div className="pt-2 border-t border-border/60">
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={consentGiven}
                  onChange={(e) => setConsentGiven(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-input text-primary focus:ring-primary"
                />
                <span className="text-xs text-muted-foreground leading-relaxed">
                  I consent to the collection and processing of my contact and consultation details exclusively for outpatient appointment scheduling and reminders under India&apos;s <strong>Digital Personal Data Protection (DPDP) Act, 2023</strong>. Your data is never shared with third parties or advertisers.
                </span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* STEP 4: REVIEW & CONFIRM */}
      {step === 4 && selectedDoctor && selectedSlot && (
        <div className="space-y-6 animate-in fade-in-50 duration-200">
          <div>
            <h2 className="text-xl font-bold text-foreground">Review & Confirm Appointment</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Please check your appointment information before final confirmation.
            </p>
          </div>

          <div className="rounded-2xl border border-border/80 bg-card p-6 sm:p-8 shadow-sm space-y-6">
            {/* Consultation Overview */}
            <div className="flex items-start gap-4 pb-6 border-b border-border/60">
              <div className="relative h-16 w-16 shrink-0 rounded-xl overflow-hidden bg-muted/60 border">
                <Image
                  src={getImageUrl(selectedDoctor.photoPath)}
                  alt={selectedDoctor.fullName}
                  fill
                  className="object-cover"
                />
              </div>

              <div className="flex-1">
                <Badge variant="default" className="text-[11px] mb-1">
                  {selectedDoctor.specialty}
                </Badge>
                <h3 className="text-lg font-bold text-foreground">
                  {selectedDoctor.fullName}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {selectedDoctor.qualifications}
                </p>
              </div>

              <div className="text-right">
                <span className="text-xs text-muted-foreground block">Fee Due at Desk</span>
                <span className="text-lg font-extrabold text-foreground">
                  ₹{selectedDoctor.consultationFee}
                </span>
              </div>
            </div>

            {/* Date & Time Summary */}
            <div className="grid gap-4 sm:grid-cols-2 pb-6 border-b border-border/60">
              <div className="rounded-xl bg-muted/40 p-4 border border-border/40">
                <span className="text-xs text-muted-foreground block font-medium">Date</span>
                <p className="text-base font-bold text-foreground mt-0.5">
                  {format(new Date(selectedDateStr), "EEEE, dd MMMM yyyy")}
                </p>
              </div>

              <div className="rounded-xl bg-muted/40 p-4 border border-border/40">
                <span className="text-xs text-muted-foreground block font-medium">Time Slot</span>
                <p className="text-base font-bold text-primary mt-0.5">
                  {selectedSlot.displayTime} IST (15 Minutes)
                </p>
              </div>
            </div>

            {/* Patient Details Summary */}
            <div className="space-y-2 text-sm">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Patient Information
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm">
                <div>
                  <span className="text-muted-foreground">Name: </span>
                  <span className="font-semibold text-foreground">{fullName}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Phone: </span>
                  <span className="font-semibold text-foreground">+91 {phone}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Age & Gender: </span>
                  <span className="font-semibold text-foreground">{age} yrs, {gender}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Visit Type: </span>
                  <span className="font-semibold text-foreground">
                    {visitType === "FIRST_VISIT" ? "First Visit" : "Follow-up"}
                  </span>
                </div>
                {reasonForVisit && (
                  <div className="col-span-2 pt-1">
                    <span className="text-muted-foreground">Reason: </span>
                    <span className="text-foreground italic">{reasonForVisit}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action Footer Navigation Buttons */}
      <div className="mt-8 flex items-center justify-between pt-4 border-t border-border/60">
        {step > 1 ? (
          <Button
            type="button"
            variant="outline"
            onClick={() => setStep(step - 1)}
            disabled={submitting}
            className="rounded-xl"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            <span>Back</span>
          </Button>
        ) : (
          <div />
        )}

        {step < 4 ? (
          <Button
            type="button"
            onClick={() => setStep(step + 1)}
            disabled={!canProceed()}
            className="rounded-xl px-6 font-semibold shadow-sm"
          >
            <span>Continue</span>
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        ) : (
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="rounded-xl px-8 font-semibold shadow-md bg-primary text-primary-foreground"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                <span>Confirming Slot...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                <span>Confirm Appointment</span>
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
