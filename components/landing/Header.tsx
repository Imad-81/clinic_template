import Link from "next/link";
import Image from "next/image";
import { clinicConfig } from "@/config/clinic.config";
import { Button } from "@/components/ui/button";
import { Phone, Calendar } from "lucide-react";

export function Header() {
  const primaryPhone = clinicConfig.contact.phones[0] || "+91 40 2360 7777";
  const telLink = `tel:${primaryPhone.replace(/\s+/g, "")}`;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      {/* Top emergency & contact bar */}
      <div className="bg-muted/60 border-b border-border/50 py-1.5 px-4 text-xs">
        <div className="container mx-auto flex flex-wrap items-center justify-between gap-2 max-w-7xl">
          <p className="text-muted-foreground hidden sm:block">
            📍 {clinicConfig.contact.locality}, {clinicConfig.contact.city} • Open today: {clinicConfig.hours.schedule["Monday – Friday"] || "08:30 AM – 08:00 PM"}
          </p>
          <div className="flex items-center gap-4 ml-auto text-xs">
            <a
              href={telLink}
              className="flex items-center gap-1.5 font-medium text-primary hover:underline"
            >
              <Phone className="h-3 w-3" />
              <span>{primaryPhone}</span>
            </a>
            <span className="text-border">|</span>
            <Link
              href="/admin/login"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Staff Portal
            </Link>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-3">
          <div className="relative h-10 w-44 sm:w-52">
            <Image
              src={clinicConfig.logo}
              alt={clinicConfig.name}
              fill
              className="object-contain object-left"
              priority
            />
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-foreground/80">
          <Link href="/#about" className="transition hover:text-primary">
            About Clinic
          </Link>
          <Link href="/#doctors" className="transition hover:text-primary">
            Our Doctors
          </Link>
          <Link href="/#how-it-works" className="transition hover:text-primary">
            How It Works
          </Link>
          {clinicConfig.features.showFAQ && (
            <Link href="/#faq" className="transition hover:text-primary">
              FAQ
            </Link>
          )}
          <Link href="/#contact" className="transition hover:text-primary">
            Contact & Location
          </Link>
        </nav>

        {/* Header Action Button */}
        <div className="flex items-center gap-3">
          <Button asChild className="rounded-full shadow-md font-semibold">
            <Link href="/book" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>Book Consultation</span>
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
