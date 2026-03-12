/**
 * M-Pesa utility helpers for the storefront.
 * Phone normalization for Safaricom Daraja API.
 */

/**
 * Normalizes a Kenyan phone number to the 254XXXXXXXXX format.
 * Returns null if the number is invalid.
 */
export function normalizePhone(phone: string): string | null {
    const digits = phone.replace(/\D/g, "");

    // Already in international format: 254XXXXXXXXX
    if (/^254[17]\d{8}$/.test(digits)) {
        return digits;
    }

    // Local format: 0XXXXXXXXX
    if (/^0[17]\d{8}$/.test(digits)) {
        return "254" + digits.slice(1);
    }

    // Short format: 7XXXXXXXX or 1XXXXXXXX
    if (/^[17]\d{8}$/.test(digits)) {
        return "254" + digits;
    }

    return null;
}
