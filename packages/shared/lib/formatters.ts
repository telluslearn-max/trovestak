// ============================================
// SHARED FORMATTING UTILITIES
// Safe to use in any runtime (Node, browser, edge)
// ============================================

/** Format KES currency from cents — e.g. 150000 → "KES 1,500.00" */
export function formatKES(cents: number): string {
    const kes = cents / 100;
    return new Intl.NumberFormat("en-KE", {
        style: "currency",
        currency: "KES",
        minimumFractionDigits: 2,
    }).format(kes);
}

/** Format price with "From" prefix for variable products */
export function formatPrice(fromCents?: number, toCents?: number): string {
    if (!fromCents) return "Price unavailable";
    if (toCents && toCents !== fromCents) return `From ${formatKES(fromCents)}`;
    return formatKES(fromCents);
}

/** Format a date string to a human-readable date */
export function formatDate(dateStr: string, locale = "en-KE"): string {
    return new Date(dateStr).toLocaleDateString(locale, {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
}

/** Format a number with thousands separators */
export function formatNumber(value: number): string {
    return new Intl.NumberFormat("en-KE").format(value);
}

/** Convert cents to KES decimal (no formatting) */
export function centsToKES(cents: number): number {
    return cents / 100;
}

/** Convert KES decimal to cents */
export function kesToCents(kes: number): number {
    return Math.round(kes * 100);
}
