import { MetadataRoute } from "next";
import { prisma } from "@/lib/db";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  // Base public routes
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/book`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
  ];

  try {
    const doctors = await prisma.doctor.findMany({
      where: { isActive: true },
      select: { slug: true, updatedAt: true },
    });

    const doctorRoutes: MetadataRoute.Sitemap = doctors.map((doc) => ({
      url: `${baseUrl}/doctors/${doc.slug}`,
      lastModified: doc.updatedAt,
      changeFrequency: "weekly",
      priority: 0.8,
    }));

    return [...staticRoutes, ...doctorRoutes];
  } catch {
    return staticRoutes;
  }
}
