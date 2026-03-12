"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

/**
 * Admin Error Boundary
 *
 * Caught by Next.js when any admin page or child component throws.
 * Provides recovery options without crashing the whole admin shell.
 */
export default function AdminError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log to your error tracking service here (e.g., Sentry, GCP Error Reporting)
        console.error("[Admin Error]", error);
    }, [error]);

    return (
        <div
            className="flex flex-col items-center justify-center min-h-[60vh] gap-6"
            style={{ fontFamily: "var(--font-syne, sans-serif)" }}
        >
            {/* Icon */}
            <div
                style={{
                    width: 72,
                    height: 72,
                    borderRadius: 20,
                    background: "rgba(239,68,68,0.1)",
                    border: "1.5px solid rgba(239,68,68,0.25)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <AlertTriangle size={32} color="#ef4444" />
            </div>

            {/* Heading */}
            <div style={{ textAlign: "center", maxWidth: 420 }}>
                <h1
                    style={{
                        fontSize: 22,
                        fontWeight: 900,
                        color: "var(--admin-fg, #f4f4f8)",
                        letterSpacing: "-0.02em",
                        marginBottom: 8,
                    }}
                >
                    Something went wrong
                </h1>
                <p
                    style={{
                        fontSize: 13,
                        color: "var(--admin-fg-muted, #888)",
                        lineHeight: 1.6,
                    }}
                >
                    An unexpected error occurred while loading this page. Your data is
                    safe — this is an isolated UI failure.
                </p>

                {/* Error detail (dev-only) */}
                {process.env.NODE_ENV === "development" && error.message && (
                    <pre
                        style={{
                            marginTop: 16,
                            padding: "10px 14px",
                            background: "rgba(239,68,68,0.08)",
                            borderRadius: 10,
                            fontSize: 11,
                            color: "#ef4444",
                            textAlign: "left",
                            whiteSpace: "pre-wrap",
                            wordBreak: "break-word",
                            border: "1px solid rgba(239,68,68,0.2)",
                        }}
                    >
                        {error.message}
                        {error.digest && `\nDigest: ${error.digest}`}
                    </pre>
                )}
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: 12 }}>
                <button
                    onClick={reset}
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        height: 44,
                        padding: "0 20px",
                        borderRadius: 12,
                        background: "var(--admin-accent, #6366f1)",
                        color: "#fff",
                        fontWeight: 800,
                        fontSize: 13,
                        border: "none",
                        cursor: "pointer",
                        letterSpacing: "0.02em",
                    }}
                >
                    <RefreshCw size={15} />
                    Try again
                </button>

                <a
                    href="/admin"
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        height: 44,
                        padding: "0 20px",
                        borderRadius: 12,
                        background: "var(--admin-card, #0f1120)",
                        color: "var(--admin-fg-muted, #888)",
                        fontWeight: 800,
                        fontSize: 13,
                        border: "1.5px solid var(--admin-border, #1e2035)",
                        cursor: "pointer",
                        textDecoration: "none",
                        letterSpacing: "0.02em",
                    }}
                >
                    <Home size={15} />
                    Admin Home
                </a>
            </div>
        </div>
    );
}
