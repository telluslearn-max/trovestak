// ============================================
// ENV VALIDATION UTILITY
// Fail fast at startup if required vars are missing
// ============================================
/**
 * Validate required environment variables at startup.
 * Throws a descriptive error listing all missing vars —
 * never starts the service with a broken config.
 */
export function validateEnv(requiredVars) {
    const missing = requiredVars.filter((key) => !process.env[key]);
    if (missing.length > 0) {
        const errorMsg = `CRITICAL STARTUP ERROR: Missing required environment variables: ${missing.join(", ")}`;
        console.error(errorMsg);
        throw new Error(errorMsg);
    }
    return Object.fromEntries(requiredVars.map((key) => [key, process.env[key]]));
}
