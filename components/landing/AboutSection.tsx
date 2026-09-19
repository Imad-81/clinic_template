import { clinicConfig } from "@/config/clinic.config";
import { Stethoscope, Clock, Smartphone, MapPin, CheckCircle2 } from "lucide-react";

export function AboutSection() {
  const iconMap: Record<string, React.ReactNode> = {
    Stethoscope: <Stethoscope className="h-6 w-6 text-primary" />,
    Clock: <Clock className="h-6 w-6 text-accent" />,
    Smartphone: <Smartphone className="h-6 w-6 text-primary" />,
    MapPin: <MapPin className="h-6 w-6 text-accent" />,
  };

  return (
    <section id="about" className="py-20 bg-background border-b border-border/40">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6">
        {/* Section Header */}
        <div className="max-w-3xl mb-14">
          <p className="text-xs font-bold uppercase tracking-wider text-primary mb-2">
            About Our Medical Center
          </p>
          <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Thoughtfully Designed Outpatient Care for Hyderabad
          </h2>
          <p className="mt-4 text-muted-foreground text-base leading-relaxed">
            {clinicConfig.about.mission}
          </p>
        </div>

        {/* Why Choose Us Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {clinicConfig.about.whyUs.map((point, index) => {
            const iconElement = (point.icon && iconMap[point.icon]) || (
              <CheckCircle2 className="h-6 w-6 text-primary" />
            );

            return (
              <div
                key={index}
                className="group relative rounded-2xl border border-border/80 bg-card p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md hover:border-primary/40"
              >
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-muted/60 transition-colors group-hover:bg-primary/10">
                  {iconElement}
                </div>
                <h3 className="text-base font-bold text-foreground mb-2">
                  {point.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {point.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
