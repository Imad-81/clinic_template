import { z } from "zod";

export const clinicThemeSchema = z.object({
  primary: z.string().describe("Primary brand color (hex, e.g. #0284c7)"),
  primaryForeground: z.string().default("#ffffff"),
  accent: z.string().describe("Secondary/accent color (hex, e.g. #059669)"),
  accentForeground: z.string().default("#ffffff"),
  radius: z.string().default("0.5rem"),
  fontFamily: z.string().default("Inter, sans-serif"),
});

export const clinicContactSchema = z.object({
  phones: z.array(z.string()).min(1),
  whatsapp: z.string(),
  email: z.string().email(),
  address: z.string(),
  locality: z.string().default("Jubilee Hills"),
  city: z.string().default("Hyderabad"),
  state: z.string().default("Telangana"),
  pincode: z.string().default("500033"),
  mapsEmbedUrl: z.string().url(),
  directionsUrl: z.string().url(),
  coordinates: z.object({
    lat: z.number(),
    lng: z.number(),
  }),
});

export const clinicHoursSchema = z.object({
  schedule: z.record(z.string(), z.string()).describe("e.g. Monday to Saturday timings"),
  emergencyNote: z.string(),
});

export const clinicStatSchema = z.object({
  label: z.string(),
  value: z.string(),
  description: z.string().optional(),
});

export const clinicAboutSchema = z.object({
  intro: z.string(),
  mission: z.string(),
  whyUs: z.array(
    z.object({
      title: z.string(),
      description: z.string(),
      icon: z.string().optional(),
    })
  ),
  establishedYear: z.number(),
  stats: z.array(clinicStatSchema),
});

export const clinicSeoSchema = z.object({
  titleTemplate: z.string(),
  defaultTitle: z.string(),
  description: z.string(),
  ogImage: z.string(),
  city: z.string().default("Hyderabad"),
  localityKeywords: z.array(z.string()),
});

export const clinicBookingSchema = z.object({
  slotDurationMinutes: z.number().default(15),
  bookingWindowDays: z.number().default(30),
  minLeadTimeMinutes: z.number().default(60),
  cancellationCutoffHours: z.number().default(2),
  maxActiveBookingsPerPhone: z.number().default(3),
  timezone: z.string().default("Asia/Kolkata"),
});

export const clinicFeaturesSchema = z.object({
  showGallery: z.boolean().default(true),
  showTestimonials: z.boolean().default(true),
  showFAQ: z.boolean().default(true),
});

export const clinicSocialSchema = z.object({
  twitter: z.string().optional(),
  facebook: z.string().optional(),
  instagram: z.string().optional(),
  linkedin: z.string().optional(),
  youtube: z.string().optional(),
});

export const clinicFooterSchema = z.object({
  copyright: z.string(),
  disclaimer: z.string(),
  links: z.array(
    z.object({
      label: z.string(),
      href: z.string(),
    })
  ),
});

export const clinicTestimonialSchema = z.object({
  name: z.string(),
  locality: z.string(),
  rating: z.number().min(1).max(5).default(5),
  review: z.string(),
  date: z.string(),
});

export const clinicFaqSchema = z.object({
  question: z.string(),
  answer: z.string(),
  category: z.string().optional(),
});

export const clinicConfigSchema = z.object({
  id: z.string(),
  name: z.string(),
  shortName: z.string(),
  tagline: z.string(),
  logo: z.string(),
  favicon: z.string(),
  theme: clinicThemeSchema,
  contact: clinicContactSchema,
  hours: clinicHoursSchema,
  about: clinicAboutSchema,
  seo: clinicSeoSchema,
  booking: clinicBookingSchema,
  features: clinicFeaturesSchema,
  social: clinicSocialSchema,
  footer: clinicFooterSchema,
  testimonials: z.array(clinicTestimonialSchema).default([]),
  faqs: z.array(clinicFaqSchema).default([]),
});

export type ClinicConfig = z.infer<typeof clinicConfigSchema>;
