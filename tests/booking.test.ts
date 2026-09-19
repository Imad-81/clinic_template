import { describe, expect, it } from "bun:test";
import { generateAppointmentReference, isValidAppointmentReference } from "../lib/booking/reference";
import { isValidIndianMobile, normalizeIndianMobile, maskPhoneNumber } from "../lib/phone";
import { checkRateLimit } from "../lib/rate-limit";
import { generateIcsCalendar } from "../lib/ics";

describe("Booking Utilities & Guards", () => {
  describe("Appointment Reference Generation", () => {
    it("generates references matching CLN-XXXXXX pattern with unambiguous characters", () => {
      const ref = generateAppointmentReference();
      expect(ref).toMatch(/^CLN-[2-9A-HJ-NP-Z]{6}$/);
      expect(isValidAppointmentReference(ref)).toBe(true);

      // Verify no ambiguous characters (0, O, 1, I, L) in the generated random part
      const randomPart = ref.split("-")[1];
      expect(randomPart).not.toMatch(/[01OIL]/);
    });

    it("generates distinct references in subsequent calls", () => {
      const set = new Set();
      for (let i = 0; i < 50; i++) {
        set.add(generateAppointmentReference());
      }
      expect(set.size).toBe(50);
    });
  });

  describe("Indian Phone Number Handling", () => {
    it("validates 10-digit Indian numbers starting with 6, 7, 8, 9", () => {
      expect(isValidIndianMobile("9876543210")).toBe(true);
      expect(isValidIndianMobile("+91 98765 43210")).toBe(true);
      expect(isValidIndianMobile("08888888888")).toBe(true);
      expect(isValidIndianMobile("7123456789")).toBe(true);
      expect(isValidIndianMobile("6123456789")).toBe(true);
    });

    it("rejects invalid numbers", () => {
      expect(isValidIndianMobile("1234567890")).toBe(false); // starts with 1
      expect(isValidIndianMobile("5234567890")).toBe(false); // starts with 5
      expect(isValidIndianMobile("987654321")).toBe(false);  // 9 digits
      expect(isValidIndianMobile("98765432100")).toBe(false); // 11 digits without prefix
      expect(isValidIndianMobile("abcdefghij")).toBe(false);
    });

    it("normalizes into standard E.164 +91 format", () => {
      expect(normalizeIndianMobile("9876543210")).toBe("+919876543210");
      expect(normalizeIndianMobile("+91 98765 43210")).toBe("+919876543210");
      expect(normalizeIndianMobile("09876543210")).toBe("+919876543210");
    });

    it("masks phone numbers to prevent leaking PII", () => {
      expect(maskPhoneNumber("+919876543210")).toBe("+91 ******3210");
      expect(maskPhoneNumber("9876543210")).toBe("+91 ******3210");
    });
  });

  describe("Rate Limiting Guard", () => {
    it("allows requests up to limit and blocks when exceeded", async () => {
      const key = `test-ip-${Date.now()}`;
      const limit = 3;

      const r1 = await checkRateLimit(key, limit, 60);
      expect(r1.success).toBe(true);
      expect(r1.remaining).toBe(2);

      const r2 = await checkRateLimit(key, limit, 60);
      expect(r2.success).toBe(true);
      expect(r2.remaining).toBe(1);

      const r3 = await checkRateLimit(key, limit, 60);
      expect(r3.success).toBe(true);
      expect(r3.remaining).toBe(0);

      // 4th request must be rejected
      const r4 = await checkRateLimit(key, limit, 60);
      expect(r4.success).toBe(false);
      expect(r4.remaining).toBe(0);
    });
  });

  describe("Calendar (.ics) Generation", () => {
    it("produces valid RFC 5545 iCalendar content", () => {
      const ics = generateIcsCalendar({
        title: "Doctor Consultation with Dr. Srinivas Murthy",
        description: "Appointment Reference: CLN-7K3Q9X\nSpecialty: Cardiology",
        location: "Road No. 72, Jubilee Hills, Hyderabad",
        startsAt: new Date("2026-10-05T03:30:00Z"),
        endsAt: new Date("2026-10-05T03:45:00Z"),
        reference: "CLN-7K3Q9X",
        clinicName: "Apollo Jubilee Hills",
      });

      expect(ics).toContain("BEGIN:VCALENDAR");
      expect(ics).toContain("VERSION:2.0");
      expect(ics).toContain("BEGIN:VEVENT");
      expect(ics).toContain("SUMMARY:Doctor Consultation with Dr. Srinivas Murthy");
      expect(ics).toContain("LOCATION:Road No. 72\\, Jubilee Hills\\, Hyderabad");
      expect(ics).toContain("DTSTART:20261005T033000Z");
      expect(ics).toContain("DTEND:20261005T034500Z");
      expect(ics).toContain("END:VEVENT");
      expect(ics).toContain("END:VCALENDAR");
    });
  });
});
