// ============================================
// STRUCTURED LOGGER
// Outputs JSON for Google Cloud Logging compatibility
// ============================================
function toSeverity(level) {
    const map = {
        debug: "DEBUG",
        info: "INFO",
        warn: "WARNING",
        error: "ERROR",
    };
    return map[level];
}
function emit(level, service, message, meta) {
    const entry = {
        severity: toSeverity(level),
        message,
        service,
        timestamp: new Date().toISOString(),
        ...meta,
    };
    // In production (GCP), structured JSON is picked up by Cloud Logging.
    // In development, pretty-print for readability.
    if (process.env.NODE_ENV === "production") {
        process.stdout.write(JSON.stringify(entry) + "\n");
    }
    else {
        const color = { DEBUG: "\x1b[36m", INFO: "\x1b[32m", WARNING: "\x1b[33m", ERROR: "\x1b[31m" }[entry.severity];
        console.log(`${color}[${entry.severity}]\x1b[0m [${service}] ${message}`, meta ? meta : "");
    }
}
export function createLogger(service) {
    return {
        debug: (msg, meta) => emit("debug", service, msg, meta),
        info: (msg, meta) => emit("info", service, msg, meta),
        warn: (msg, meta) => emit("warn", service, msg, meta),
        error: (msg, meta) => emit("error", service, msg, meta),
    };
}
