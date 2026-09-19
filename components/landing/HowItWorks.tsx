import { UserCheck, CalendarCheck, CheckCircle, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function HowItWorks() {
  const steps = [
    {
      number: "01",
      title: "Select Doctor & Specialty",
      description: "Browse our 8 outpatient departments and choose your preferred consultant based on specialty, experience, and fee.",
      icon: <UserCheck className="h-6 w-6 text-primary" />,
    },
    {
      number: "02",
      title: "Choose Date & Time Slot",
      description: "Pick a date up to 30 days ahead. View live free slots grouped by morning, afternoon, or evening sessions.",
      icon: <CalendarCheck className="h-6 w-6 text-accent" />,
    },
    {
      number: "03",
      title: "Enter Mobile & Confirm",
      description: "Provide your name and phone number. Receive a unique appointment code (e.g. CLN-7K3Q9X) instantly with zero password hassle.",
      icon: <CheckCircle className="h-6 w-6 text-emerald-600" />,
    },
  ];

  return (
    <section id="how-it-works" className="py-20 bg-background border-b border-border/40">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-xs font-bold uppercase tracking-wider text-primary mb-2">
            Seamless Outpatient Booking
          </p>
          <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Book in 3 Simple Steps
          </h2>
          <p className="mt-3 text-muted-foreground text-base">
            No mandatory app downloads. No complex patient accounts. Book in under 60 seconds on any phone.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3 relative">
          {steps.map((step, idx) => (
            <div
              key={idx}
              className="relative flex flex-col items-center text-center rounded-2xl border border-border/80 bg-card p-8 shadow-sm"
            >
              <div className="absolute -top-4 left-8 rounded-full bg-foreground text-background px-3 py-0.5 text-xs font-black">
                STEP {step.number}
              </div>

              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/70">
                {step.icon}
              </div>

              <h3 className="text-lg font-bold text-foreground mb-3">
                {step.title}
              </h3>

              <p className="text-sm text-muted-foreground leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Button asChild size="lg" className="rounded-xl px-8 shadow-md font-semibold">
            <Link href="/book" className="flex items-center gap-2">
              <span>Start Consultation Booking</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
