import Link from "next/link";
import { clinicConfig } from "@/config/clinic.config";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Phone, ShieldCheck, Clock, Award, Star } from "lucide-react";

export function Hero() {
  const primaryPhone = clinicConfig.contact.phones[0] || "+91 40 2360 7777";
  const telLink = `tel:${primaryPhone.replace(/\s+/g, "")}`;

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-sky-50/60 via-background to-background py-16 sm:py-24 border-b border-border/40">
      {/* Decorative background glow */}
      <div className="pointer-events-none absolute -top-40 right-0 -z-10 h-[500px] w-[500px] rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 left-0 -z-10 h-[500px] w-[500px] rounded-full bg-accent/10 blur-3xl" />

      <div className="container mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
          {/* Main Hero Column */}
          <div className="lg:col-span-8 flex flex-col items-start space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3.5 py-1 text-xs font-semibold text-primary">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Verified Senior Consultants • Jubilee Hills, Hyderabad</span>
            </div>

            <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl sm:leading-tight">
              Direct Specialist Consultations.{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-sky-600 to-accent">
                Zero Hospital Queues.
              </span>
            </h1>

            <p className="max-w-2xl text-lg text-muted-foreground leading-relaxed">
              {clinicConfig.about.intro}
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Button asChild size="lg" className="rounded-xl shadow-lg px-7 text-base font-semibold">
                <Link href="/book" className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  <span>Book In-Clinic Consultation</span>
                </Link>
              </Button>

              <Button asChild variant="outline" size="lg" className="rounded-xl border-border/80 px-6 text-base font-medium">
                <a href={telLink} className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-primary" />
                  <span>Call {primaryPhone}</span>
                </a>
              </Button>
            </div>

            {/* Micro Benefits Strip */}
            <div className="flex flex-wrap items-center gap-6 pt-3 text-xs text-muted-foreground font-medium">
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-accent" />
                15-Min Dedicated Slots
              </span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                No Account Required
              </span>
              <span className="flex items-center gap-1.5">
                <Award className="h-3.5 w-3.5 text-amber-500" />
                Transparent Consultation Fees
              </span>
            </div>
          </div>

          {/* Quick Stats Card Column */}
          <div className="lg:col-span-4">
            <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-xl relative overflow-hidden backdrop-blur">
              <div className="absolute top-0 right-0 h-24 w-24 bg-primary/5 rounded-bl-full pointer-events-none" />

              <div className="flex items-center justify-between border-b border-border/60 pb-4 mb-5">
                <div>
                  <h3 className="font-bold text-foreground">Clinic Overview</h3>
                  <p className="text-xs text-muted-foreground">{clinicConfig.shortName}</p>
                </div>
                <Badge variant="success" className="gap-1 font-medium text-xs">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Accepting Consultations
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {clinicConfig.about.stats.map((stat, idx) => (
                  <div key={idx} className="rounded-xl bg-muted/40 p-3.5 border border-border/40">
                    <p className="text-2xl font-extrabold text-foreground">{stat.value}</p>
                    <p className="text-xs font-medium text-muted-foreground mt-0.5">{stat.label}</p>
                  </div>
                ))}
              </div>

              <div className="mt-5 rounded-xl bg-sky-500/5 p-3.5 border border-sky-500/20 text-xs text-sky-900 flex items-center gap-2.5">
                <Star className="h-4 w-4 text-amber-500 fill-amber-500 shrink-0" />
                <span>
                  Rated <strong>4.9/5</strong> by over 5,000+ patients across Jubilee Hills & Banjara Hills.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
