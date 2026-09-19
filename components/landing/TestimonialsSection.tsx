import { clinicConfig } from "@/config/clinic.config";
import { Star, Quote } from "lucide-react";

export function TestimonialsSection() {
  if (!clinicConfig.features.showTestimonials || clinicConfig.testimonials.length === 0) {
    return null;
  }

  return (
    <section className="py-20 bg-muted/20 border-b border-border/40">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <p className="text-xs font-bold uppercase tracking-wider text-primary mb-2">
            Patient Feedback
          </p>
          <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Trusted by Hyderabad Families
          </h2>
          <p className="mt-3 text-muted-foreground text-base">
            Verified outpatient experiences from residents across Jubilee Hills, Banjara Hills, and Madhapur.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {clinicConfig.testimonials.map((t, idx) => (
            <div
              key={idx}
              className="flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-6 shadow-sm"
            >
              <div>
                <div className="flex items-center gap-1 text-amber-500 mb-4">
                  {[...Array(t.rating)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-500" />
                  ))}
                </div>
                <Quote className="h-6 w-6 text-muted-foreground/30 mb-2" />
                <p className="text-sm text-foreground/90 italic leading-relaxed">
                  &ldquo;{t.review}&rdquo;
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-border/60">
                <p className="text-sm font-bold text-foreground">{t.name}</p>
                <div className="flex items-center justify-between text-xs text-muted-foreground mt-0.5">
                  <span>{t.locality}</span>
                  <span>{t.date}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
