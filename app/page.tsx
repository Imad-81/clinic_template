import { prisma } from "@/lib/db";
import { clinicConfig } from "@/config/clinic.config";
import { Header } from "@/components/landing/Header";
import { Hero } from "@/components/landing/Hero";
import { AboutSection } from "@/components/landing/AboutSection";
import { DoctorsSection } from "@/components/landing/DoctorsSection";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { TestimonialsSection } from "@/components/landing/TestimonialsSection";
import { FaqSection } from "@/components/landing/FaqSection";
import { ContactSection } from "@/components/landing/ContactSection";
import { Footer } from "@/components/landing/Footer";

export const revalidate = 300; // Cache and revalidate every 5 minutes

export default async function HomePage() {
  // Query active doctors from DB ordered by displayOrder
  const doctors = await prisma.doctor.findMany({
    where: { isActive: true },
    select: {
      id: true,
      slug: true,
      fullName: true,
      specialty: true,
      qualifications: true,
      experienceYears: true,
      languages: true,
      consultationFee: true,
      photoPath: true,
    },
    orderBy: { displayOrder: "asc" },
  });

  // Generate JSON-LD schema for SEO
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "MedicalClinic",
    name: clinicConfig.name,
    image: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}${clinicConfig.logo}`,
    url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
    telephone: clinicConfig.contact.phones[0],
    address: {
      "@type": "PostalAddress",
      streetAddress: clinicConfig.contact.address,
      addressLocality: clinicConfig.contact.locality,
      addressRegion: clinicConfig.contact.state,
      postalCode: clinicConfig.contact.pincode,
      addressCountry: "IN",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: clinicConfig.contact.coordinates.lat,
      longitude: clinicConfig.contact.coordinates.lng,
    },
    medicalSpecialty: [
      "GeneralMedicine",
      "Cardiology",
      "Orthopedics",
      "Pediatrics",
      "Gynecology",
      "Dermatology",
      "Otolaryngology",
      "Neurology",
    ],
    availableService: {
      "@type": "MedicalTherapy",
      name: "Outpatient Doctor Consultation",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Header />
      <main className="flex-1">
        <Hero />
        <AboutSection />
        <DoctorsSection doctors={doctors} />
        <HowItWorks />
        <TestimonialsSection />
        <FaqSection />
        <ContactSection />
      </main>
      <Footer />
    </>
  );
}
