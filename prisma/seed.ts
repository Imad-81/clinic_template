import "dotenv/config";
import { prisma } from "../lib/db";
import { hashPassword } from "better-auth/crypto";
import { randomUUID } from "crypto";

async function main() {
  console.log("🌱 Starting database seeding...");

  // 1. Seed Admin User
  const adminEmail = process.env.ADMIN_SEED_EMAIL || "admin@apollo-demo.local";
  const adminPassword = process.env.ADMIN_SEED_PASSWORD || "Admin@Apollo2026!";

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    const adminId = randomUUID();
    const hashedPassword = await hashPassword(adminPassword);

    await prisma.user.create({
      data: {
        id: adminId,
        name: "Clinic Administrator",
        email: adminEmail,
        emailVerified: true,
        role: "admin",
        banned: false,
        accounts: {
          create: {
            id: randomUUID(),
            accountId: adminId,
            providerId: "credential",
            password: hashedPassword,
          },
        },
      },
    });
    console.log(`✅ Admin user created: ${adminEmail}`);
  } else {
    console.log(`ℹ️ Admin user already exists: ${adminEmail}`);
  }

  // 2. Seed 8 Fictional Doctors
  const doctorsData = [
    {
      slug: "dr-raghavendra-rao",
      fullName: "Dr. K. Raghavendra Rao",
      specialty: "General Medicine",
      qualifications: "MBBS, MD (General Medicine)",
      experienceYears: 16,
      bio: "Dr. Raghavendra Rao is a distinguished consultant physician focusing on adult internal medicine, lifestyle disorders, hypertension, diabetes management, and preventive health screenings.",
      languages: ["English", "Telugu", "Hindi"],
      consultationFee: 800,
      photoPath: "/images/doctors/dr-raghavendra-rao.svg",
      displayOrder: 1,
      isActive: true,
    },
    {
      slug: "dr-srinivas-murthy",
      fullName: "Dr. P. Srinivas Murthy",
      specialty: "Cardiology",
      qualifications: "MBBS, MD, DM (Cardiology), FACC",
      experienceYears: 22,
      bio: "Senior Consultant Cardiologist specializing in preventive cardiology, coronary artery disease assessment, lipid management, and non-invasive cardiovascular evaluations.",
      languages: ["English", "Telugu", "Hindi"],
      consultationFee: 1200,
      photoPath: "/images/doctors/dr-srinivas-murthy.svg",
      displayOrder: 2,
      isActive: true,
    },
    {
      slug: "dr-pradeep-chaitanya",
      fullName: "Dr. G. Pradeep Chaitanya",
      specialty: "Orthopaedics",
      qualifications: "MBBS, MS (Orthopaedics), MCh, Fellowship in Joint Arthroplasty",
      experienceYears: 18,
      bio: "Consultant Orthopaedic Surgeon dedicated to the diagnosis and non-surgical/surgical management of knee, hip, and shoulder joint disorders, sports injuries, and degenerative arthritis.",
      languages: ["English", "Telugu"],
      consultationFee: 1000,
      photoPath: "/images/doctors/dr-pradeep-chaitanya.svg",
      displayOrder: 3,
      isActive: true,
    },
    {
      slug: "dr-ananya-sharma",
      fullName: "Dr. Ananya Sharma",
      specialty: "Paediatrics",
      qualifications: "MBBS, MD (Paediatrics), DNB (Neonatology)",
      experienceYears: 14,
      bio: "Compassionate paediatrician specializing in child growth and developmental monitoring, immunizations, paediatric nutrition, and management of acute childhood illnesses.",
      languages: ["English", "Telugu", "Hindi"],
      consultationFee: 800,
      photoPath: "/images/doctors/dr-ananya-sharma.svg",
      displayOrder: 4,
      isActive: true,
    },
    {
      slug: "dr-meenakshi-sundaram",
      fullName: "Dr. S. Meenakshi Sundaram",
      specialty: "Gynaecology",
      qualifications: "MBBS, MS (OBG), DNB, FMAS",
      experienceYears: 20,
      bio: "Senior Consultant Obstetrician & Gynaecologist with extensive experience in women's health across all age milestones, PCOS/PCOD management, antenatal counseling, and menopause care.",
      languages: ["English", "Telugu", "Tamil", "Hindi"],
      consultationFee: 1000,
      photoPath: "/images/doctors/dr-meenakshi-sundaram.svg",
      displayOrder: 5,
      isActive: true,
    },
    {
      slug: "dr-vikramaditya-reddy",
      fullName: "Dr. T. Vikramaditya Reddy",
      specialty: "Dermatology",
      qualifications: "MBBS, MD (Dermatology, Venereology & Leprosy)",
      experienceYears: 12,
      bio: "Consultant Dermatologist providing evidence-based care for clinical dermatological conditions including psoriasis, eczema, acne, allergic reactions, and scalp/hair health.",
      languages: ["English", "Telugu", "Hindi"],
      consultationFee: 900,
      photoPath: "/images/doctors/dr-vikramaditya-reddy.svg",
      displayOrder: 6,
      isActive: true,
    },
    {
      slug: "dr-swathi-narayan",
      fullName: "Dr. Swathi Narayan",
      specialty: "ENT",
      qualifications: "MBBS, MS (ENT / Otorhinolaryngology), DNB",
      experienceYears: 15,
      bio: "Specialist ENT surgeon treating chronic sinusitis, allergic rhinitis, middle ear disorders, tonsillitis, vertigo, and voice disturbances in adults and children.",
      languages: ["English", "Telugu", "Hindi"],
      consultationFee: 850,
      photoPath: "/images/doctors/dr-swathi-narayan.svg",
      displayOrder: 7,
      isActive: true,
    },
    {
      slug: "dr-rajesh-kulkarni",
      fullName: "Dr. Rajesh V. Kulkarni",
      specialty: "Neurology",
      qualifications: "MBBS, MD (General Medicine), DM (Neurology)",
      experienceYears: 24,
      bio: "Senior Consultant Neurologist specializing in headache disorders and migraine management, epilepsy, peripheral neuropathy, Parkinson's disease, and post-stroke rehabilitation.",
      languages: ["English", "Telugu", "Marathi", "Hindi"],
      consultationFee: 1500,
      photoPath: "/images/doctors/dr-rajesh-kulkarni.svg",
      displayOrder: 8,
      isActive: true,
    },
  ];

  for (const docData of doctorsData) {
    const doctor = await prisma.doctor.upsert({
      where: { slug: docData.slug },
      update: docData,
      create: docData,
    });

    // Delete existing schedules to refresh
    await prisma.doctorSchedule.deleteMany({
      where: { doctorId: doctor.id },
    });

    // Seed weekly schedules (Monday through Friday: 2 sessions, Saturday: 1 session)
    // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const schedulesToCreate = [];

    // Weekdays (Mon - Fri: 1 to 5)
    for (let day = 1; day <= 5; day++) {
      // Morning session: 09:00 to 13:00
      schedulesToCreate.push({
        doctorId: doctor.id,
        dayOfWeek: day,
        startTime: new Date("1970-01-01T09:00:00Z"),
        endTime: new Date("1970-01-01T13:00:00Z"),
        slotDurationMinutes: 15,
      });
      // Evening session: 16:00 to 20:00
      schedulesToCreate.push({
        doctorId: doctor.id,
        dayOfWeek: day,
        startTime: new Date("1970-01-01T16:00:00Z"),
        endTime: new Date("1970-01-01T20:00:00Z"),
        slotDurationMinutes: 15,
      });
    }

    // Saturday (day 6: 09:00 to 14:00)
    schedulesToCreate.push({
      doctorId: doctor.id,
      dayOfWeek: 6,
      startTime: new Date("1970-01-01T09:00:00Z"),
      endTime: new Date("1970-01-01T14:00:00Z"),
      slotDurationMinutes: 15,
    });

    await prisma.doctorSchedule.createMany({
      data: schedulesToCreate,
    });
  }

  console.log(`✅ Seeded ${doctorsData.length} doctors and their weekly schedules`);

  // 3. Seed Clinic Holidays
  const holidays = [
    { date: new Date("2026-10-02T00:00:00Z"), name: "Mahatma Gandhi Jayanti" },
    { date: new Date("2026-10-20T00:00:00Z"), name: "Vijaya Dashami (Dussehra)" },
    { date: new Date("2026-11-08T00:00:00Z"), name: "Diwali (Deepavali)" },
    { date: new Date("2026-12-25T00:00:00Z"), name: "Christmas" },
    { date: new Date("2027-01-01T00:00:00Z"), name: "New Year's Day" },
    { date: new Date("2027-01-14T00:00:00Z"), name: "Makar Sankranti" },
    { date: new Date("2027-01-26T00:00:00Z"), name: "Republic Day" },
  ];

  for (const h of holidays) {
    await prisma.clinicHoliday.upsert({
      where: { date: h.date },
      update: { name: h.name },
      create: { date: h.date, name: h.name },
    });
  }

  console.log(`✅ Seeded ${holidays.length} clinic holidays`);
  console.log("🎉 Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
