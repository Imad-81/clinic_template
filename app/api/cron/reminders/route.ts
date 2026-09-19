import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { notificationService } from "@/lib/notifications";
import { clinicConfig } from "@/config/clinic.config";
import { addHours } from "date-fns";

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const expectedSecret = process.env.CRON_SECRET;

  if (!expectedSecret || authHeader !== `Bearer ${expectedSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
    // Look ahead 23 to 25 hours
    const windowStart = addHours(now, 23);
    const windowEnd = addHours(now, 25);

    const upcomingAppointments = await prisma.appointment.findMany({
      where: {
        startsAt: {
          gte: windowStart,
          lte: windowEnd,
        },
        status: {
          in: ["BOOKED", "CONFIRMED"],
        },
      },
      include: {
        doctor: true,
        patient: true,
      },
    });

    let sentCount = 0;
    for (const app of upcomingAppointments) {
      await notificationService.sendReminder({
        patientName: app.patient.fullName,
        patientPhone: app.patient.phone,
        patientEmail: app.patient.email,
        doctorName: app.doctor.fullName,
        specialty: app.doctor.specialty,
        appointmentReference: app.reference,
        startsAt: app.startsAt,
        clinicName: clinicConfig.name,
        clinicAddress: clinicConfig.contact.address,
      });
      sentCount++;
    }

    return NextResponse.json({
      success: true,
      processed: sentCount,
      timestamp: now.toISOString(),
    });
  } catch (error) {
    console.error("Failed to process reminders cron:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
