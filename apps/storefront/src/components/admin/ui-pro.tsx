"use client";

import React from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// ── DESIGN TOKENS ──────────────────────────────────────────────────
export const T = {
    bg: "var(--admin-bg)",
    surface: "var(--admin-surface)",
    card: "var(--admin-card)",
    border: "var(--admin-border)",
    borderHover: "var(--admin-border-strong)",
    text: "var(--admin-text)",
    textMuted: "var(--admin-text-secondary)",
    textSub: "var(--admin-text-muted)",
    blue: "var(--admin-blue)",
    purple: "var(--admin-purple)",
    cyan: "var(--admin-cyan)",
    green: "var(--admin-green)",
    orange: "var(--admin-orange)",
    red: "var(--admin-red)",
    // Typography Styles (Classes/Components)
    h1: "text-4xl font-black tracking-tight text-foreground",
    h2: "text-3xl font-extrabold tracking-tight text-foreground",
    h3: "text-xl font-bold tracking-tight text-foreground",
    p: "text-base text-foreground",
    pMuted: "text-sm text-muted-foreground font-medium",
    labelMuted: "text-[10px] font-bold uppercase tracking-[0.2em] font-mono opacity-70",
};

// ── HELPERS ───────────────────────────────────────────────────────
export const fmt = (n: number) => `$${Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
export const fmtK = (n: number) => n >= 1000 ? `$${(n / 1000).toFixed(0)}k` : fmt(n);

const AV_COLORS: Record<string, string> = {
    A: "var(--admin-blue)", S: "var(--admin-purple)", O: "var(--admin-cyan)", F: "var(--admin-red)",
    K: "var(--admin-green)", L: "var(--admin-orange)", Y: "var(--admin-red)", N: "var(--admin-blue)",
    H: "var(--admin-cyan)", D: "var(--admin-orange)"
};

// ── COMPONENTS ─────────────────────────────────────────────────────

export const Av = ({ l, size = 28 }: { l: string; size?: number }) => (
    <div style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: AV_COLORS[l[0].toUpperCase()] || "var(--admin-blue)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.38,
        fontWeight: 700,
        color: "#fff",
        flexShrink: 0
    }}>{l[0].toUpperCase()}</div>
);

export const STATUS_CFG: Record<string, { bg: string; c: string; dot: string }> = {
    active: { bg: "var(--status-active-bg)", c: "var(--status-active-text)", dot: "var(--status-active-dot)" },
    delivered: { bg: "var(--status-active-bg)", c: "var(--status-active-text)", dot: "var(--status-active-dot)" },
    processing: { bg: "var(--status-processing-bg)", c: "var(--status-processing-text)", dot: "var(--status-processing-dot)" },
    shipped: { bg: "var(--status-shipped-bg)", c: "var(--status-shipped-text)", dot: "var(--status-shipped-dot)" },
    pending: { bg: "var(--status-pending-bg)", c: "var(--status-pending-text)", dot: "var(--status-pending-dot)" },
    cancelled: { bg: "var(--status-cancelled-bg)", c: "var(--status-cancelled-text)", dot: "var(--status-cancelled-dot)" },
    draft: { bg: "var(--status-draft-bg)", c: "var(--status-draft-text)", dot: "var(--status-draft-dot)" },
    refunded: { bg: "var(--status-refunded-bg)", c: "var(--status-refunded-text)", dot: "var(--status-refunded-dot)" },
    vip: { bg: "var(--status-vip-bg)", c: "var(--status-vip-text)", dot: "var(--status-vip-dot)" },
};

export const Chip = ({ s, variant, label, children, className }: { s?: string; variant?: string; label?: string; children?: React.ReactNode; className?: string }) => {
    const status = (s || variant || "draft").toLowerCase();
    const cfg = STATUS_CFG[status] || STATUS_CFG.draft;
    return (
        <span className={className} style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            background: cfg.bg,
            color: cfg.c,
            borderRadius: 6,
            padding: "3px 9px",
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: ".03em",
            whiteSpace: "nowrap",
            transition: "all 0.2s"
        }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: cfg.dot, flexShrink: 0 }} />
            {children || label || (s || variant || "").replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
        </span>
    );
};

export const Card = ({ children, className, style = {} }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) => (
    <div className={cn("fade-up", className)} style={{
        background: "var(--admin-card)",
        border: `1px solid var(--admin-border)`,
        borderRadius: 14,
        boxShadow: "var(--admin-shadow-sm)",
        transition: "all 0.2s",
        ...style
    }}>
        {children}
    </div>
);


export const PageHeader = ({ title, sub, children }: { title: string; sub?: string; children?: React.ReactNode }) => (
    <div style={{ marginBottom: 28, display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16 }}>
        <div>
            <h1 style={{ fontSize: 28, fontWeight: 900, color: T.text, letterSpacing: "-.02em", margin: 0 }}>{title}</h1>
            {sub && <p style={{ fontSize: 13, color: T.textSub, marginTop: 4, fontWeight: 500 }}>{sub}</p>}
        </div>
        {children && <div style={{ display: "flex", gap: 12 }}>{children}</div>}
    </div>
);

export const StatCard = ({ label, value, icon: Icon, color, sub, iconChar }: { label: string; value: string | number; icon?: LucideIcon; color: string; sub?: string; iconChar?: string }) => {
    const hexColor = (T as any)[color] || color;
    return (
        <Card style={{ padding: "22px 24px", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${hexColor}30, ${hexColor})` }} />
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: ".1em", fontFamily: "var(--font-jetbrains), monospace" }}>{label}</div>
                <div style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: hexColor + "20",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 15,
                    color: hexColor
                }}>
                    {Icon ? <Icon size={16} /> : <span>{iconChar || "⬢"}</span>}
                </div>
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, color: T.text, letterSpacing: "-.03em", fontFamily: "var(--font-jetbrains), monospace" }}>{value}</div>
            {sub && <div style={{ fontSize: 11, color: T.textMuted, marginTop: 8 }}>{sub}</div>}
        </Card>
    );
};

export const Btn = ({ children, onClick, variant = "primary", small, className, ...props }: any) => {
    const styles: any = {
        primary: { background: T.blue, color: "#fff", border: "none" },
        ghost: { background: "transparent", color: T.textSub, border: `1px solid ${T.border}` },
        danger: { background: "#1c0505", color: "#fca5a5", border: "1px solid #7f1d1d" },
        success: { background: "#052e16", color: "#4ade80", border: "1px solid #14532d" },
    };
    return (
        <button
            onClick={onClick}
            className={cn("pill-btn", className)}
            style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                padding: small ? "5px 12px" : "8px 18px",
                borderRadius: 8,
                fontSize: small ? 11 : 13,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "'Syne', sans-serif",
                transition: "opacity .15s",
                ...styles[variant]
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = "0.8"}
            onMouseLeave={e => e.currentTarget.style.opacity = "1"}
            {...props}
        >
            {children}
        </button>
    );
};

export const SInput = ({ value, onChange, placeholder, className, ...props }: any) => (
    <input
        value={value}
        onChange={e => onChange?.(e.target.value)}
        placeholder={placeholder}
        className={className}
        style={{
            background: T.surface,
            border: `1px solid ${T.border}`,
            borderRadius: 8,
            padding: "7px 12px",
            fontSize: 12,
            color: T.text,
            fontFamily: "'Syne', sans-serif",
            width: "100%"
        }}
        onFocus={e => e.target.style.borderColor = T.blue}
        onBlur={e => e.target.style.borderColor = T.border}
        {...props}
    />
);

export const TH = ({ children, className, style = {} }: any) => (
    <div
        className={className}
        style={{
            padding: "10px 18px",
            fontSize: 9,
            fontWeight: 700,
            color: T.textMuted,
            textTransform: "uppercase",
            letterSpacing: ".1em",
            fontFamily: "var(--font-jetbrains), monospace",
            borderBottom: `1px solid ${T.border}`,
            background: T.surface,
            ...style
        }}
    >
        {children}
    </div>
);

export const TD = ({ children, mono, muted, color, className, style = {} }: any) => (
    <div
        className={className}
        style={{
            padding: "13px 18px",
            fontSize: 12,
            color: color || (muted ? T.textSub : T.text),
            fontFamily: mono ? "var(--font-jetbrains), monospace" : "inherit",
            display: "flex",
            alignItems: "center",
            borderBottom: `1px solid #0a0c14`,
            ...style
        }}
    >
        {children}
    </div>
);
