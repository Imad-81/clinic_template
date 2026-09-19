import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getImageUrl } from "@/lib/storage";
import { Calendar, Languages, Clock, ArrowRight } from "lucide-react";

export interface DoctorCardData {
  id: string;
  slug: string;
  fullName: string;
  specialty: string;
  qualifications: string;
  experienceYears: number;
  languages: string[];
  consultationFee: number;
  photoPath: string;
}

export function DoctorsSection({ doctors }: { doctors: DoctorCardData[] }) {
  return (
    <section id="doctors" className="py-20 bg-muted/30 border-b border-border/40">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-primary mb-2">
              Our Medical Faculty
            </p>
            <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
              Consult with Senior Specialists
            </h2>
            <p className="mt-2 text-muted-foreground text-base max-w-2xl">
              Direct outpatient consultations with certified senior clinicians across 8 major medical departments.
            </p>
          </div>

          <Button asChild variant="outline" className="self-start sm:self-auto rounded-xl">
            <Link href="/book" className="flex items-center gap-1.5 font-medium">
              <span>View All Specialties</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        {/* Doctor Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {doctors.map((doctor) => {
            const photoUrl = getImageUrl(doctor.photoPath);

            return (
              <div
                key={doctor.id}
                className="group flex flex-col rounded-2xl border border-border/80 bg-card p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:border-primary/40"
              >
                {/* Image Container */}
                <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-muted/60 mb-4 border border-border/40">
                  <Image
                    src={photoUrl}
                    alt={doctor.fullName}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute top-2 right-2">
                    <Badge variant="accent" className="font-semibold text-[11px] shadow-sm">
                      ₹{doctor.consultationFee} Fee
                    </Badge>
                  </div>
                </div>

                {/* Info Block */}
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-xs font-bold text-primary tracking-wide uppercase">
                        {doctor.specialty}
                      </span>
                      <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {doctor.experienceYears}y exp
                      </span>
                    </div>

                    <Link
                      href={`/doctors/${doctor.slug}`}
                      className="text-base font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1"
                    >
                      {doctor.fullName}
                    </Link>

                    <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5 font-medium">
                      {doctor.qualifications}
                    </p>

                    <div className="mt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <Languages className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="truncate">{doctor.languages.join(", ")}</span>
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className="mt-5 pt-3 border-t border-border/60 flex items-center gap-2">
                    <Button
                      asChild
                      size="sm"
                      className="flex-1 rounded-lg font-semibold text-xs shadow-sm cursor-pointer"
                    >
                      <Link href={`/book?doctor=${doctor.slug}`} className="flex items-center justify-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>Book</span>
                      </Link>
                    </Button>

                    <Button
                      asChild
                      variant="ghost"
                      size="sm"
                      className="rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground"
                    >
                      <Link href={`/doctors/${doctor.slug}`}>
                        Profile
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
