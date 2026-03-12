"use client";

import React, { useState, useEffect } from "react";
import { getAnalyticsSummary } from "../actions";
import { useTheme } from "@/components/admin/theme-wrapper";
import {
    TrendingUp,
    DollarSign,
    ShoppingBag,
    Users,
    ArrowUpRight,
    ArrowDownRight,
    Download,
    Calendar,
    Filter
} from "lucide-react";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    Cell
} from "recharts";
import { toast } from "sonner";

const fmt = (n: number) => {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 0
    }).format(n / 100); // data is in cents
};

const fmtNum = (n: number) => new Intl.NumberFormat("en-US").format(n);

export default function AnalyticsPage() {
    const { theme } = useTheme();
    const isDark = theme === "dark";

    const [data, setData] = useState<any[]>([]);
    const [stats, setStats] = useState({
        revenue: 0,
        orders: 0,
        customers: 0,
        avgOrder: 0
    });
    const [loading, setLoading] = useState(true);
    const [animIn, setAnimIn] = useState(false);

    useEffect(() => {
        async function fetchAnalytics() {
            try {
                const { chartData, stats } = await getAnalyticsSummary();
                setData(chartData);
                setStats(stats);
            } catch (err: any) {
                toast.error(err.message || "Failed to load analytics");
                console.error(err);
            } finally {
                setLoading(false);
                setTimeout(() => setAnimIn(true), 50);
            }
        }
        fetchAnalytics();
    }, []);


    const colors = {
        bg: isDark ? "#030712" : "#f8fafc",
        card: isDark ? "#0f172a" : "#ffffff",
        border: isDark ? "#1e293b" : "#e2e8f0",
        text: isDark ? "#f8fafc" : "#0f172a",
        muted: isDark ? "#64748b" : "#94a3b8",
        accent: "#3b82f6",
        accent2: "#8b5cf6",
    };

    return (
        <div style={{
            padding: "40px 48px",
            background: colors.bg,
            minHeight: "100vh",
            fontFamily: "var(--font-dm-sans), sans-serif"
        }}>
            {/* Header */}
            <div style={{
                display: "flex",
                alignItems: "flex-end",
                justifyContent: "space-between",
                marginBottom: 40,
                opacity: animIn ? 1 : 0,
                transform: animIn ? "none" : "translateY(-10px)",
                transition: "all 0.6s cubic-bezier(0.16, 1, 0.3, 1)"
            }}>
                <div>
                    <div style={{
                        fontSize: 11,
                        fontWeight: 800,
                        textTransform: "uppercase",
                        letterSpacing: "0.2em",
                        color: colors.accent2,
                        marginBottom: 8,
                        fontFamily: "var(--font-dm-mono)"
                    }}>
                        Platform Intelligence
                    </div>
                    <h1 style={{
                        fontSize: 32,
                        fontWeight: 900,
                        letterSpacing: "-0.03em",
                        color: colors.text,
                        margin: 0
                    }}>
                        Store <span style={{ color: colors.muted, fontStyle: "italic", fontWeight: 400 }}>Analytics</span>
                    </h1>
                </div>

                <div style={{ display: "flex", gap: 12 }}>
                    <button style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "10px 20px",
                        borderRadius: 14,
                        background: colors.card,
                        border: `1px solid ${colors.border}`,
                        color: colors.text,
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: "pointer"
                    }}>
                        <Download size={14} /> Intelligence Report
                    </button>
                </div>
            </div>

            {/* KPI Row */}
            <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: 20,
                marginBottom: 32,
                opacity: animIn ? 1 : 0,
                transform: animIn ? "none" : "translateY(20px)",
                transition: "all 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.1s"
            }}>
                {[
                    { label: "Total Revenue", value: fmt(stats.revenue), delta: "+12.4%", icon: DollarSign, color: colors.accent },
                    { label: "Acquisition Count", value: fmtNum(stats.orders), delta: "+8.1%", icon: ShoppingBag, color: colors.accent2 },
                    { label: "Unique Agents", value: fmtNum(stats.customers), delta: "+5.2%", icon: Users, color: "#10b981" },
                    { label: "Average Yield", value: fmt(stats.avgOrder), delta: "+2.3%", icon: TrendingUp, color: "#f59e0b" },
                ].map((stat, i) => {
                    const Icon = stat.icon;
                    return (
                        <div key={i} style={{
                            background: colors.card,
                            border: `1px solid ${colors.border}`,
                            borderRadius: 24,
                            padding: "24px",
                            position: "relative"
                        }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                                <div style={{
                                    width: 40,
                                    height: 40,
                                    borderRadius: 12,
                                    background: stat.color + "15",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: stat.color
                                }}>
                                    <Icon size={20} />
                                </div>
                                <div style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 4,
                                    fontSize: 11,
                                    fontWeight: 800,
                                    color: "#10b981",
                                    fontFamily: "var(--font-dm-mono)"
                                }}>
                                    <ArrowUpRight size={14} />
                                    {stat.delta}
                                </div>
                            </div>
                            <div style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: colors.muted, marginBottom: 4 }}>{stat.label}</div>
                            <div style={{ fontSize: 26, fontWeight: 900, color: colors.text, fontFamily: "var(--font-dm-mono)" }}>{stat.value}</div>
                        </div>
                    );
                })}
            </div>

            {/* Main Charts Row */}
            <div style={{
                display: "grid",
                gridTemplateColumns: "2fr 1fr",
                gap: 24,
                opacity: animIn ? 1 : 0,
                transform: animIn ? "none" : "translateY(30px)",
                transition: "all 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.2s"
            }}>
                {/* Revenue Area Chart */}
                <div style={{
                    background: colors.card,
                    border: `1px solid ${colors.border}`,
                    borderRadius: 24,
                    padding: "32px",
                    height: 480
                }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
                        <div>
                            <h3 style={{ fontSize: 18, fontWeight: 900, color: colors.text, margin: 0 }}>Revenue Dynamics</h3>
                            <p style={{ fontSize: 13, color: colors.muted, margin: "4px 0 0" }}>Daily performance overview for the last 30 days</p>
                        </div>
                        <div style={{ display: "flex", gap: 8 }}>
                            <button style={{ padding: "8px 16px", borderRadius: 10, background: colors.accent + "10", border: `1px solid ${colors.accent}20`, color: colors.accent, fontSize: 11, fontWeight: 800 }}>Revenue</button>
                            <button style={{ padding: "8px 16px", borderRadius: 10, background: "transparent", border: `1px solid ${colors.border}`, color: colors.muted, fontSize: 11, fontWeight: 800 }}>Orders</button>
                        </div>
                    </div>

                    <div style={{ width: "100%", height: 320 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={colors.accent} stopOpacity={0.3} />
                                        <stop offset="95%" stopColor={colors.accent} stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={colors.border} />
                                <XAxis
                                    dataKey="day"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 10, fill: colors.muted, fontWeight: 600 }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 10, fill: colors.muted, fontWeight: 600 }}
                                    tickFormatter={v => `$${v}`}
                                />
                                <Tooltip
                                    contentStyle={{
                                        background: colors.card,
                                        border: `1px solid ${colors.border}`,
                                        borderRadius: 12,
                                        boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
                                        fontSize: 12,
                                        color: colors.text
                                    }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="revenue"
                                    stroke={colors.accent}
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorRev)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Breakdown Card */}
                <div style={{
                    background: colors.card,
                    border: `1px solid ${colors.border}`,
                    borderRadius: 24,
                    padding: "32px",
                    display: "flex",
                    flexDirection: "column"
                }}>
                    <h3 style={{ fontSize: 18, fontWeight: 900, color: colors.text, margin: "0 0 8px" }}>Sector Growth</h3>
                    <p style={{ fontSize: 13, color: colors.muted, margin: 0 }}>Top performing categories</p>

                    <div style={{ flex: 1, marginTop: 40, display: "flex", flexDirection: "column", gap: 24 }}>
                        {[
                            { name: "Computing", value: 42, color: colors.accent },
                            { name: "Audio", value: 28, color: colors.accent2 },
                            { name: "Mobile", value: 18, color: "#10b981" },
                            { name: "Other", value: 12, color: colors.muted },
                        ].map((cat, i) => (
                            <div key={i}>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                                    <span style={{ fontSize: 13, fontWeight: 700, color: colors.text }}>{cat.name}</span>
                                    <span style={{ fontSize: 13, fontWeight: 800, color: colors.text, fontFamily: "var(--font-dm-mono)" }}>{cat.value}%</span>
                                </div>
                                <div style={{ width: "100%", height: 8, background: isDark ? "#1e293b" : "#f1f5f9", borderRadius: 4, overflow: "hidden" }}>
                                    <div style={{
                                        height: "100%",
                                        width: `${cat.value}%`,
                                        background: cat.color,
                                        borderRadius: 4,
                                        boxShadow: `0 0 10px ${cat.color}40`
                                    }} />
                                </div>
                            </div>
                        ))}
                    </div>

                    <div style={{ padding: "24px", background: colors.accent + "08", borderRadius: 20, marginTop: "auto", border: `1px solid ${colors.accent}15` }}>
                        <div style={{ fontSize: 11, fontWeight: 800, color: colors.accent, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.1em" }}>Growth Strategy</div>
                        <p style={{ fontSize: 12, color: colors.muted, margin: 0, lineHeight: 1.6 }}>Your current trajectory shows a <span style={{ color: "#10b981", fontWeight: 800 }}>15.4% increase</span> in customer retention compared to last quarter.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
