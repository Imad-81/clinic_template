import crypto from "crypto";

// Unambiguous characters (avoiding 0, O, 1, I, L)
const CHARS = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

/**
 * Generates a human-friendly appointment reference code: CLN-XXXXXX
 * Example: CLN-7K3Q9X
 */
export function generateAppointmentReference(prefix = "CLN"): string {
  const bytes = crypto.randomBytes(6);
  let code = "";
  for (let i = 0; i < 6; i++) {
    const randomIndex = bytes[i] % CHARS.length;
    code += CHARS[randomIndex];
  }
  return `${prefix}-${code}`;
}

/**
 * Validates whether a reference string matches the expected format.
 */
export function isValidAppointmentReference(ref: string): boolean {
  if (!ref) return false;
  return /^[A-Z]{3,4}-[2-9A-HJ-NP-Z]{6}$/i.test(ref.trim());
}
