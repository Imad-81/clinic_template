import { clinicConfig } from "@/config/clinic.config";
import { Accordion, AccordionItem } from "@/components/ui/accordion";
import { HelpCircle } from "lucide-react";

export function FaqSection() {
  if (!clinicConfig.features.showFAQ || clinicConfig.faqs.length === 0) {
    return null;
  }

  return (
    <section id="faq" className="py-20 bg-background border-b border-border/40">
      <div className="container mx-auto max-w-4xl px-4 sm:px-6">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary mb-3">
            <HelpCircle className="h-3.5 w-3.5" />
            <span>Frequently Asked Questions</span>
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Everything You Need to Know
          </h2>
          <p className="mt-3 text-muted-foreground text-base">
            Common questions regarding outpatient appointments, doctor timings, and consultation policies.
          </p>
        </div>

        <div className="rounded-2xl border border-border/80 bg-card p-6 sm:p-8 shadow-sm">
          <Accordion>
            {clinicConfig.faqs.map((faq, idx) => (
              <AccordionItem key={idx} title={faq.question} defaultOpen={idx === 0}>
                {faq.answer}
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
