/**
 * SHARED FORMATTING UTILITIES
 *
 * Use these anywhere (Client or Server).
 * No dependency on legacy Supabase client.
 */

/** Format KES currency from cents — e.g. 150000 → "KES 1,500.00" */
export function formatKES(kes: number): string {
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

/** Cloudinary URL transformation helper */
export function getCloudinaryUrl(
    publicId: string,
    options: { width?: number; height?: number; quality?: number } = {}
): string {
    const { width = 600, height, quality = 80 } = options;
    const transformations = [
        "f_auto",
        "q_auto",
        `w_${width}`,
        height ? `h_${height}` : "",
        "c_fit",
    ].filter(Boolean).join(",");

    return `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/${transformations}/${publicId}`;
}
