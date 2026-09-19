/**
 * Generates an RFC 5545 standard .ics iCalendar file content string.
 */

export interface CalendarEventData {
  title: string;
  description: string;
  location: string;
  startsAt: Date;
  endsAt: Date;
  reference: string;
  clinicName: string;
}

function formatIcsDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

export function generateIcsCalendar(event: CalendarEventData): string {
  const dtStart = formatIcsDate(event.startsAt);
  const dtEnd = formatIcsDate(event.endsAt);
  const dtStamp = formatIcsDate(new Date());

  // Escape special characters in text
  const cleanSummary = event.title.replace(/[\\,;]/g, "\\$&");
  const cleanDescription = event.description.replace(/\n/g, "\\n").replace(/[\\,;]/g, "\\$&");
  const cleanLocation = event.location.replace(/\n/g, ", ").replace(/[\\,;]/g, "\\$&");

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Medical Clinic//Consultation Booking//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${event.reference}@${event.clinicName.toLowerCase().replace(/[^a-z0-9]/g, "")}`,
    `DTSTAMP:${dtStamp}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${cleanSummary}`,
    `DESCRIPTION:${cleanDescription}`,
    `LOCATION:${cleanLocation}`,
    "STATUS:CONFIRMED",
    "SEQUENCE:0",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}
