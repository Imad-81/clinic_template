/**
 * Utilities for Indian phone numbers (E.164 standard)
 */

// Regex for 10-digit Indian mobile number starting with 6, 7, 8, or 9
const INDIAN_MOBILE_REGEX = /^(?:\+91|91|0)?[6-9]\d{9}$/;

/**
 * Validates if the input is a valid Indian mobile phone number.
 */
export function isValidIndianMobile(phone: string): boolean {
  if (!phone) return false;
  const cleanPhone = phone.replace(/[\s\-()]/g, "");
  return INDIAN_MOBILE_REGEX.test(cleanPhone);
}

/**
 * Normalizes any valid Indian mobile number into standard E.164 format: +91XXXXXXXXXX
 */
export function normalizeIndianMobile(phone: string): string {
  if (!isValidIndianMobile(phone)) {
    throw new Error("Invalid Indian mobile number");
  }

  const cleanDigits = phone.replace(/\D/g, "");
  // Take last 10 digits
  const last10Digits = cleanDigits.slice(-10);
  return `+91${last10Digits}`;
}

/**
 * Masks a phone number to protect PII in logs or user interface.
 * Example: +919876543210 -> +91 ******3210
 */
export function maskPhoneNumber(phone: string): string {
  if (!phone) return "";
  try {
    const normalized = normalizeIndianMobile(phone);
    return `${normalized.slice(0, 3)} ******${normalized.slice(-4)}`;
  } catch {
    // Fallback if not standard Indian format
    if (phone.length <= 4) return "****";
    return `***${phone.slice(-4)}`;
  }
}

/**
 * Formats a phone number for friendly human display: +91 98765 43210
 */
export function formatPhoneDisplay(phone: string): string {
  try {
    const normalized = normalizeIndianMobile(phone);
    return `${normalized.slice(0, 3)} ${normalized.slice(3, 8)} ${normalized.slice(8)}`;
  } catch {
    return phone;
  }
}
