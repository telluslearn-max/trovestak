// Phone number normalisation for Kenya numbers.
// Daraja-specific helpers (getDarajaToken, initiateSTKPushRequest) live in apps/mpesa-service/src/daraja.ts.

export function normalizePhone(phone) {
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.startsWith("0") && cleaned.length === 10) return `254${cleaned.slice(1)}`;
    if (cleaned.startsWith("254") && cleaned.length === 12) return cleaned;
    if (cleaned.startsWith("7") && cleaned.length === 9) return `254${cleaned}`;
    return null;
}
