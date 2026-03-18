"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

/**
 * Global Error Boundary (root level)
 *
 * Catches errors that even escape the root layout.
 * Replaces the entire page — must be self-contained (no layout imports).
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Global Error]", error);
  }, [error]);

  return (
    <html>
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          background: "#07080f",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
          color: "#f4f4f8",
          gap: 24,
        }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 18,
            background: "rgba(239,68,68,0.12)",
            border: "1.5px solid rgba(239,68,68,0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <AlertTriangle size={28} color="#ef4444" />
        </div>

        <div style={{ textAlign: "center", maxWidth: 400, padding: "0 24px" }}>
          <h1
            style={{
              fontSize: 20,
              fontWeight: 900,
              marginBottom: 8,
              letterSpacing: "-0.02em",
            }}
          >
            Critical error
          </h1>
          <p style={{ fontSize: 13, color: "#888", lineHeight: 1.6 }}>
            A critical error occurred. Please try refreshing the page. If the
            problem persists, contact support.
          </p>
          {error.message && (
            <p style={{ fontSize: 11, color: "#666", fontFamily: "monospace", marginTop: 8, wordBreak: "break-all" }}>
              {error.message}
            </p>
          )}
          {error.digest && (
            <p style={{ fontSize: 11, color: "#555", fontFamily: "monospace", marginTop: 4 }}>
              ID: {error.digest}
            </p>
          )}
        </div>

        <button
          onClick={reset}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            height: 44,
            padding: "0 24px",
            borderRadius: 12,
            background: "#6366f1",
            color: "#fff",
            fontWeight: 800,
            fontSize: 13,
            border: "none",
            cursor: "pointer",
          }}
        >
          <RefreshCw size={14} />
          Reload
        </button>
      </body>
    </html>
  );
}
