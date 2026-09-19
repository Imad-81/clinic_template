import type { Metadata } from "next";
import { clinicConfig } from "@/config/clinic.config";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: {
    default: clinicConfig.seo.defaultTitle,
    template: clinicConfig.seo.titleTemplate,
  },
  description: clinicConfig.seo.description,
  keywords: [
    clinicConfig.name,
    "doctor consultation",
    "clinic Hyderabad",
    "Jubilee Hills clinic",
    ...clinicConfig.seo.localityKeywords,
  ],
  openGraph: {
    title: clinicConfig.seo.defaultTitle,
    description: clinicConfig.seo.description,
    url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
    siteName: clinicConfig.name,
    images: [
      {
        url: clinicConfig.seo.ogImage,
        width: 1200,
        height: 630,
        alt: clinicConfig.name,
      },
    ],
    locale: "en_IN",
    type: "website",
  },
  icons: {
    icon: clinicConfig.favicon,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Inject theme variables from config
  const themeStyle = {
    "--clinic-primary": clinicConfig.theme.primary,
    "--clinic-primary-foreground": clinicConfig.theme.primaryForeground,
    "--clinic-accent": clinicConfig.theme.accent,
    "--clinic-accent-foreground": clinicConfig.theme.accentForeground,
    "--clinic-radius": clinicConfig.theme.radius,
    "--clinic-font": clinicConfig.theme.fontFamily,
  } as React.CSSProperties;

  return (
    <html lang="en" className="scroll-smooth">
      <body style={themeStyle} className="min-h-screen flex flex-col bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
