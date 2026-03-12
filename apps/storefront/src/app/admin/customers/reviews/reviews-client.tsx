"use client";

import React, { useState } from "react";
import { StatCard, Card, T, PageHeader, TH, TD } from "@/components/admin/ui-pro";

interface Review {
    id: string;
    rating: number | null;
    content: string | null;
    author_name: string | null;
    product_name: string | null;
    created_at: string;
    status: string | null;
}

interface CustomerReviewsClientProps {
    initialReviews: Review[];
    stats: {
        avg: number;
        total: number;
        positivePerc: string;
    };
}

const STARS = (n: number) => "★".repeat(Math.round(n)) + "☆".repeat(5 - Math.round(n));

export default function CustomerReviewsClient({ initialReviews, stats }: CustomerReviewsClientProps) {
    const [reviews] = useState(initialReviews);

    return (
        <div className="page-enter" style={{ padding: "32px" }}>
            <PageHeader title="Customer Reviews" sub="Product sentiment and feedback management" />

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 28 }}>
                <StatCard label="Avg. Rating" value={`${stats.avg} ★`} iconChar="⭐" color={T.orange} sub="All reviews" />
                <StatCard label="Total Reviews" value={String(stats.total)} iconChar="◉" color={T.blue} sub="Collected" />
                <StatCard label="Positive (≥4★)" value={stats.positivePerc} iconChar="↗" color={T.green} sub="Sentiment score" />
            </div>

            <Card>
                <div style={{ display: "grid", gridTemplateColumns: "0.5fr 1.4fr 2fr 1fr 0.8fr" }}>
                    {["Rating", "Author", "Review", "Product", "Date"].map(h => <TH key={h}>{h}</TH>)}
                    {reviews.length === 0 ? (
                        <div style={{ gridColumn: "span 5", padding: 40, textAlign: "center", color: T.textMuted }}>No reviews yet.</div>
                    ) : reviews.map((r, i) => [
                        <TD key={`st${i}`}>
                            <span style={{ color: T.orange, fontSize: 11, letterSpacing: 1 }}>{STARS(r.rating || 0)}</span>
                        </TD>,
                        <TD key={`au${i}`}><span style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{r.author_name || "Anonymous"}</span></TD>,
                        <TD key={`co${i}`} muted>
                            <span style={{ fontSize: 11, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                                {r.content || "—"}
                            </span>
                        </TD>,
                        <TD key={`pr${i}`} muted>{r.product_name || "—"}</TD>,
                        <TD key={`dt${i}`} muted>{new Date(r.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</TD>,
                    ])}
                </div>
            </Card>
        </div>
    );
}
