"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  getDashboardStats,
  getRevenueTrend,
  getRecentOrders,
  getTopProducts,
  getLowStockItems
} from "./actions";
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from "recharts";
import { T, StatCard, Card, PageHeader, Av, Chip, fmt, fmtK } from "@/components/admin/ui-pro";

// Removed StatusBadge and KpiCard in favor of ui-pro components

export default function AdminDashboard() {
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [lowStockItems, setLowStockItems] = useState<any[]>([]);
  const [stats, setStats] = useState({
    revenueToday: 0,
    ordersToday: 0,
    avgOrderValue: 0,
    lowStockCount: 0,
  });

  const categoryData = [
    { name: "Smartphones", value: 38, color: T.blue },
    { name: "Laptops", value: 22, color: T.purple },
    { name: "Audio", value: 16, color: T.cyan },
    { name: "TVs", value: 14, color: T.green },
    { name: "Other", value: 10, color: T.orange },
  ];

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsData, trendData, ordersData, topData, lowData] = await Promise.all([
        getDashboardStats(),
        getRevenueTrend(),
        getRecentOrders(),
        getTopProducts(),
        getLowStockItems()
      ]);

      setStats(statsData);
      setRevenueData(trendData);
      setRecentOrders(ordersData);
      setTopProducts(topData);
      setLowStockItems(lowData);
    } catch (e) {
      console.error("Dashboard Fetch Error:", e);
    }
  };


  return (
    <div className="page-enter">
      <PageHeader title="Good morning, Admin 👋" sub="Here's a high-fidelity overview of your performace today." />

      {/* KPI Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 28 }}>
        <StatCard label="Monthly Revenue" value={fmtK(stats.revenueToday * 30)} iconChar="◆" color={T.green} sub="March 2026 Forecast" />
        <StatCard label="Total Orders" value={stats.ordersToday.toString()} iconChar="◉" color={T.blue} sub="New orders today" />
        <StatCard label="Conversion Rate" value="3.8%" iconChar="↗" color={T.cyan} sub="Visit to purchase" />
        <StatCard label="Avg Order Value" value={fmt(stats.avgOrderValue)} iconChar="◈" color={T.purple} sub="Last 7 days" />
      </div>

      {/* Charts Row */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16, marginBottom: 16 }}>
        <Card>
          <div style={{ padding: "20px 24px", borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>Revenue Trend</div>
              <div style={{ fontSize: 11, color: T.textMuted }}>Daily revenue last 14 days</div>
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: T.blue, fontFamily: "var(--font-jetbrains), monospace" }}>{fmtK(stats.revenueToday * 14)}</div>
          </div>
          <div style={{ padding: "20px 16px 8px" }}>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={revenueData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="ag2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={T.blue} stopOpacity={0.4} />
                    <stop offset="95%" stopColor={T.blue} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} vertical={false} />
                <XAxis dataKey="d" tick={{ fontSize: 9, fill: T.textMuted }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 9, fill: T.textMuted }} tickLine={false} axisLine={false} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 11, color: T.text }} formatter={(v: any) => [fmt(v)]} />
                <Area type="monotone" dataKey="rev" stroke={T.blue} strokeWidth={2.5} fill="url(#ag2)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <div style={{ padding: "20px 24px", borderBottom: `1px solid ${T.border}` }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>Category Mix</div>
          </div>
          <div style={{ padding: "16px 20px 8px" }}>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={categoryData} cx="50%" cy="50%" innerRadius={42} outerRadius={68} paddingAngle={3} dataKey="value">
                  {categoryData.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ padding: "0 24px 24px" }}>
            {categoryData.map(c => (
              <div key={c.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: c.color }} />
                  <span style={{ fontSize: 11, color: T.textSub }}>{c.name}</span>
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: T.text }}>{c.value}%</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Lists Row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Card>
          <div style={{ padding: "20px 24px", borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>Recent Orders</div>
            <Link href="/admin/orders" style={{ fontSize: 11, color: T.blue, textDecoration: "none" }}>View All</Link>
          </div>
          {recentOrders.map((o: any, i) => (
            <div key={o.id} className="hover-row" style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 24px", borderBottom: i < recentOrders.length - 1 ? `1px solid ${T.bg}` : "" }}>
              <Av l={o.profiles?.full_name || o.profiles?.email || "U"} size={32} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.text }}>{o.profiles?.full_name || "Guest Customer"}</div>
                <div style={{ fontSize: 10, color: T.textMuted, fontFamily: "var(--font-jetbrains), monospace" }}>ORD-{o.id.slice(0, 8).toUpperCase()}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: T.text, fontFamily: "var(--font-jetbrains), monospace" }}>{fmt(o.total_amount / 100)}</div>
                <Chip s={o.status} />
              </div>
            </div>
          ))}
        </Card>

        <Card>
          <div style={{ padding: "20px 24px", borderBottom: `1px solid ${T.border}` }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>Low Stock Registry</div>
          </div>
          <div style={{ padding: "12px 0" }}>
            {lowStockItems.map((item, i) => (
              <div key={i} style={{ padding: "14px 24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: T.textSub }}>{item.product?.name}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: item.stock_quantity < 5 ? T.red : T.orange, fontFamily: "var(--font-jetbrains), monospace" }}>{item.stock_quantity} Left</span>
                </div>
                <div style={{ height: 4, background: T.surface, borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${item.progress}%`, background: item.stock_quantity < 5 ? T.red : T.orange, borderRadius: 4 }} />
                </div>
              </div>
            ))}
            {lowStockItems.length === 0 && (
              <div style={{ padding: "40px 24px", textAlign: "center", color: T.textMuted, fontSize: 12 }}>
                All stock levels are optimal.
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
