import { Metadata } from "next";
import { clinicConfig } from "@/config/clinic.config";
import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";
import { AppointmentManager } from "@/components/appointment/AppointmentManager";

interface AppointmentPageProps {
  params: Promise<{ reference: string }>;
}

export async function generateMetadata({ params }: AppointmentPageProps): Promise<Metadata> {
  const { reference } = await params;
  return {
    title: `Appointment ${reference.toUpperCase()} | ${clinicConfig.shortName}`,
    description: `Manage consultation appointment ${reference} at ${clinicConfig.name}, Jubilee Hills Hyderabad.`,
  };
}

export default async function AppointmentPage({ params }: AppointmentPageProps) {
  const { reference } = await params;

  return (
    <>
      <Header />
      <main className="flex-1 py-12 bg-muted/20">
        <div className="container mx-auto max-w-4xl px-4 sm:px-6">
          <AppointmentManager reference={reference.toUpperCase()} />
        </div>
      </main>
      <Footer />
    </>
  );
}
