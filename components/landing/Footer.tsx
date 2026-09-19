import Link from "next/link";
import Image from "next/image";
import { clinicConfig } from "@/config/clinic.config";

export function Footer() {
  return (
    <footer className="border-t border-border bg-card py-12 text-sm text-muted-foreground">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-12 pb-10 border-b border-border/60">
          {/* Clinic Brand */}
          <div className="lg:col-span-6 space-y-4">
            <div className="relative h-10 w-44">
              <Image
                src={clinicConfig.logo}
                alt={clinicConfig.name}
                fill
                className="object-contain object-left"
              />
            </div>
            <p className="text-sm max-w-md leading-relaxed text-muted-foreground">
              {clinicConfig.tagline}
            </p>
            <p className="text-xs text-muted-foreground/80 leading-relaxed max-w-lg">
              {clinicConfig.footer.disclaimer}
            </p>
          </div>

          {/* Quick Links */}
          <div className="lg:col-span-3 space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-foreground">
              Quick Navigation
            </p>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/#about" className="hover:text-primary transition-colors">
                  About Clinic
                </Link>
              </li>
              <li>
                <Link href="/#doctors" className="hover:text-primary transition-colors">
                  Doctor Directory
                </Link>
              </li>
              <li>
                <Link href="/#how-it-works" className="hover:text-primary transition-colors">
                  How Booking Works
                </Link>
              </li>
              <li>
                <Link href="/book" className="hover:text-primary transition-colors font-semibold text-primary">
                  Book Consultation
                </Link>
              </li>
            </ul>
          </div>

          {/* Administrative & Legal */}
          <div className="lg:col-span-3 space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-foreground">
              Administration & Legal
            </p>
            <ul className="space-y-2 text-sm">
              {clinicConfig.footer.links.map((link, idx) => (
                <li key={idx}>
                  <Link href={link.href} className="hover:text-primary transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
              <li className="pt-2">
                <Link
                  href="/admin/login"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1 text-xs font-medium text-foreground hover:bg-muted transition-colors"
                >
                  🔒 Clinic Staff Portal
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <p>{clinicConfig.footer.copyright}</p>
          <p className="text-muted-foreground/60">
            Powered by Antigravity Reusable Clinic Engine
          </p>
        </div>
      </div>
    </footer>
  );
}
