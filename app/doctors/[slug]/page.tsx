import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Metadata } from "next";
import { prisma } from "@/lib/db";
import { clinicConfig } from "@/config/clinic.config";
import { getImageUrl } from "@/lib/storage";
import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Languages,
  Clock,
  Award,
  ChevronLeft,
  CheckCircle2,
  Stethoscope,
} from "lucide-react";
import { formatInTimeZone } from "date-fns-tz";

interface DoctorPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: DoctorPageProps): Promise<Metadata> {
  const { slug } = await params;
  const doctor = await prisma.doctor.findUnique({
    where: { slug, isActive: true },
  });

  if (!doctor) {
    return { title: "Doctor Not Found" };
  }

  return {
    title: `${doctor.fullName} - ${doctor.specialty} | ${clinicConfig.shortName}`,
    description: `Book consultation with ${doctor.fullName}, ${doctor.specialty} at ${clinicConfig.name}, Jubilee Hills Hyderabad. ${doctor.experienceYears} years experience.`,
  };
}

export default async function DoctorProfilePage({ params }: DoctorPageProps) {
  const { slug } = await params;

  const doctor = await prisma.doctor.findUnique({
    where: { slug, isActive: true },
    include: {
      schedules: {
        orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
      },
    },
  });

  if (!doctor) {
    notFound();
  }

  const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  // Group schedules by day of week
  const scheduleByDay: Record<number, string[]> = {};
  for (const s of doctor.schedules) {
    const startStr = formatInTimeZone(s.startTime, "UTC", "hh:mm a");
    const endStr = formatInTimeZone(s.endTime, "UTC", "hh:mm a");
    if (!scheduleByDay[s.dayOfWeek]) {
      scheduleByDay[s.dayOfWeek] = [];
    }
    scheduleByDay[s.dayOfWeek].push(`${startStr} – ${endStr}`);
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Physician",
    name: doctor.fullName,
    medicalSpecialty: doctor.specialty,
    worksFor: {
      "@type": "MedicalClinic",
      name: clinicConfig.name,
      address: clinicConfig.contact.address,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Header />
      <main className="flex-1 py-12 bg-muted/20">
        <div className="container mx-auto max-w-5xl px-4 sm:px-6">
          {/* Breadcrumb Back */}
          <Link
            href="/#doctors"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground mb-8 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Back to All Doctors</span>
          </Link>

          {/* Profile Card */}
          <div className="rounded-3xl border border-border/80 bg-card p-6 sm:p-10 shadow-sm">
            <div className="grid gap-8 md:grid-cols-12 md:items-start">
              {/* Doctor Avatar */}
              <div className="md:col-span-4">
                <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-muted/60 border border-border/60 shadow-inner">
                  <Image
                    src={getImageUrl(doctor.photoPath)}
                    alt={doctor.fullName}
                    fill
                    className="object-cover"
                    priority
                  />
                </div>

                <div className="mt-6 rounded-2xl bg-muted/40 border border-border/60 p-4 space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Consultation Fee</span>
                    <span className="font-extrabold text-foreground text-base">
                      ₹{doctor.consultationFee}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Experience</span>
                    <span className="font-semibold text-foreground">
                      {doctor.experienceYears} Years
                    </span>
                  </div>
                  <div className="flex justify-between items-start text-sm pt-1 border-t border-border/40">
                    <span className="text-muted-foreground">Languages</span>
                    <span className="font-medium text-foreground text-right">
                      {doctor.languages.join(", ")}
                    </span>
                  </div>
                </div>

                <Button asChild size="lg" className="w-full mt-5 rounded-xl shadow-md font-semibold">
                  <Link href={`/book?doctor=${doctor.slug}`} className="flex items-center justify-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>Book Appointment</span>
                  </Link>
                </Button>
              </div>

              {/* Bio & Availability */}
              <div className="md:col-span-8 space-y-6">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <Badge variant="default" className="text-xs">
                      {doctor.specialty}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      Outpatient Clinic
                    </Badge>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                    {doctor.fullName}
                  </h1>
                  <p className="text-sm font-medium text-muted-foreground mt-1 flex items-center gap-1.5">
                    <Award className="h-4 w-4 text-primary" />
                    <span>{doctor.qualifications}</span>
                  </p>
                </div>

                {/* About Doctor */}
                <div>
                  <h2 className="text-base font-bold text-foreground mb-2 flex items-center gap-2">
                    <Stethoscope className="h-4 w-4 text-primary" />
                    <span>Clinical Profile</span>
                  </h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {doctor.bio}
                  </p>
                </div>

                {/* Weekly Availability Table */}
                <div>
                  <h2 className="text-base font-bold text-foreground mb-3 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-accent" />
                    <span>Weekly Outpatient Schedule</span>
                  </h2>
                  <div className="rounded-xl border border-border/70 overflow-hidden divide-y divide-border/50 text-xs sm:text-sm">
                    {daysOfWeek.map((dayName, dayIndex) => {
                      const sessions = scheduleByDay[dayIndex];
                      return (
                        <div key={dayName} className="flex justify-between items-center p-3 bg-card hover:bg-muted/30">
                          <span className="font-semibold text-foreground/80 w-28 sm:w-36">
                            {dayName}
                          </span>
                          {sessions && sessions.length > 0 ? (
                            <span className="text-foreground font-medium text-right">
                              {sessions.join(", ")}
                            </span>
                          ) : (
                            <span className="text-muted-foreground/60 italic text-right">
                              No Clinic Sessions
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Patient Information Note */}
                <div className="rounded-xl bg-sky-500/10 border border-sky-500/20 p-4 text-xs text-sky-950 flex items-start gap-3">
                  <CheckCircle2 className="h-4 w-4 text-sky-600 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    Consultations are scheduled in dedicated 15-minute windows. Please arrive 10 minutes prior to your selected slot at our Jubilee Hills outpatient desk.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
