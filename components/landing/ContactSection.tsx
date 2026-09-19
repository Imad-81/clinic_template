import { clinicConfig } from "@/config/clinic.config";
import { Button } from "@/components/ui/button";
import { MapPin, Phone, Clock, MessageSquare, ExternalLink, AlertTriangle } from "lucide-react";

export function ContactSection() {
  const primaryPhone = clinicConfig.contact.phones[0] || "+91 40 2360 7777";
  const telLink = `tel:${primaryPhone.replace(/\s+/g, "")}`;
  const whatsappUrl = `https://wa.me/${clinicConfig.contact.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent("Hello, I would like to inquire about doctor consultation slots at Apollo Jubilee Hills.")}`;

  return (
    <section id="contact" className="py-20 bg-muted/30 border-b border-border/40">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6">
        <div className="max-w-3xl mb-14">
          <p className="text-xs font-bold uppercase tracking-wider text-primary mb-2">
            Reach Out To Us
          </p>
          <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Location & Contact Details
          </h2>
          <p className="mt-3 text-muted-foreground text-base">
            Centrally located on Road No. 72 Film Nagar, Jubilee Hills with convenient access from Banjara Hills and Hitec City.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-12">
          {/* Contact Cards Column */}
          <div className="lg:col-span-5 space-y-6">
            {/* Address Card */}
            <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 shrink-0 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground">Clinic Address</h3>
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                    {clinicConfig.contact.address}
                  </p>
                  <a
                    href={clinicConfig.contact.directionsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary mt-3 hover:underline"
                  >
                    <span>Open in Google Maps</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            </div>

            {/* Timings Card */}
            <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 shrink-0 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
                  <Clock className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-foreground">Consultation Hours</h3>
                  <div className="mt-2 space-y-1 text-sm">
                    {Object.entries(clinicConfig.hours.schedule).map(([days, timing]) => (
                      <div key={days} className="flex justify-between py-1 border-b border-border/40 text-xs sm:text-sm">
                        <span className="font-medium text-foreground/80">{days}</span>
                        <span className="text-muted-foreground">{timing}</span>
                      </div>
                    ))}
                  </div>

                  {clinicConfig.hours.emergencyNote && (
                    <div className="mt-3.5 rounded-lg bg-amber-500/10 p-2.5 text-xs text-amber-900 border border-amber-500/20 flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                      <span>{clinicConfig.hours.emergencyNote}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Direct Connect Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <Button asChild variant="outline" className="h-12 rounded-xl font-semibold">
                <a href={telLink} className="flex items-center justify-center gap-2">
                  <Phone className="h-4 w-4 text-primary" />
                  <span>Call Reception</span>
                </a>
              </Button>

              <Button asChild className="h-12 rounded-xl font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm">
                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  <span>WhatsApp Us</span>
                </a>
              </Button>
            </div>
          </div>

          {/* Interactive Map Column */}
          <div className="lg:col-span-7">
            <div className="h-full min-h-[380px] w-full overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm relative">
              <iframe
                title="Clinic Location Map"
                src={clinicConfig.contact.mapsEmbedUrl}
                width="100%"
                height="100%"
                style={{ border: 0, minHeight: "380px" }}
                allowFullScreen={false}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="w-full h-full"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
