import { Metadata } from "next";
import { prisma } from "@/lib/db";
import { clinicConfig } from "@/config/clinic.config";
import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";
import { BookingWizard } from "@/components/booking/BookingWizard";

export const metadata: Metadata = {
  title: `Book Doctor Consultation | ${clinicConfig.shortName}`,
  description: `Schedule a confirmed doctor consultation at ${clinicConfig.name}, Jubilee Hills Hyderabad. Transparent fees and dedicated appointment slots.`,
};

interface BookPageProps {
  searchParams: Promise<{ doctor?: string }>;
}

export default async function BookPage({ searchParams }: BookPageProps) {
  const { doctor: preselectedDoctorSlug } = await searchParams;

  const doctors = await prisma.doctor.findMany({
    where: { isActive: true },
    select: {
      id: true,
      slug: true,
      fullName: true,
      specialty: true,
      qualifications: true,
      experienceYears: true,
      consultationFee: true,
      languages: true,
      photoPath: true,
    },
    orderBy: { displayOrder: "asc" },
  });

  return (
    <>
      <Header />
      <main className="flex-1 py-12 bg-muted/20">
        <div className="container mx-auto max-w-5xl px-4 sm:px-6">
          <div className="text-center max-w-xl mx-auto mb-10">
            <h1 className="text-3xl font-extrabold text-foreground tracking-tight sm:text-4xl">
              Book Outpatient Consultation
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Select your doctor, pick a convenient time, and get instant confirmation.
            </p>
          </div>

          <BookingWizard
            doctors={doctors}
            preselectedDoctorSlug={preselectedDoctorSlug}
          />
        </div>
      </main>
      <Footer />
    </>
  );
}
