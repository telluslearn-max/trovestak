// ============================================
// STRUCTURED LOGGER
// Outputs JSON for Google Cloud Logging compatibility
// ============================================

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogEntry {
    severity: "DEBUG" | "INFO" | "WARNING" | "ERROR";
    message: string;
    service: string;
    timestamp: string;
    [key: string]: unknown;
}

function toSeverity(level: LogLevel): LogEntry["severity"] {
    const map: Record<LogLevel, LogEntry["severity"]> = {
        debug: "DEBUG",
        info: "INFO",
        warn: "WARNING",
        error: "ERROR",
    };
    return map[level];
}

function emit(level: LogLevel, service: string, message: string, meta?: Record<string, unknown>) {
    const entry: LogEntry = {
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
    } else {
        const color = { DEBUG: "\x1b[36m", INFO: "\x1b[32m", WARNING: "\x1b[33m", ERROR: "\x1b[31m" }[entry.severity];
        console.log(`${color}[${entry.severity}]\x1b[0m [${service}] ${message}`, meta ? meta : "");
    }
}

export function createLogger(service: string) {
    return {
        debug: (msg: string, meta?: Record<string, unknown>) => emit("debug", service, msg, meta),
        info: (msg: string, meta?: Record<string, unknown>) => emit("info", service, msg, meta),
        warn: (msg: string, meta?: Record<string, unknown>) => emit("warn", service, msg, meta),
        error: (msg: string, meta?: Record<string, unknown>) => emit("error", service, msg, meta),
    };
}

export type Logger = ReturnType<typeof createLogger>;
