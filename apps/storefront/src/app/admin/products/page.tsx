"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { getProductsAdminList, deleteProduct } from "./actions";
import { toast } from "sonner";
import { useTheme } from "@/components/admin/theme-wrapper";

import { T, StatCard, Card, PageHeader, Btn, Chip, Av, SInput, TH, TD, fmt } from "@/components/admin/ui-pro";
import { Search, Filter, Plus, MoreHorizontal, ArrowLeft, Download, Upload } from "lucide-react";

// Local Constants for Status Logic
const STATUS_MAP: Record<string, string> = {
  active: "active",
  draft: "pending",
  outofstock: "cancelled",
  lowstock: "shipped"
};

// Removed StatusBadge and Avatar in favor of ui-pro components

export default function ProductsPage() {
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("All");
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    outOfStock: 0,
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { products, stats } = await getProductsAdminList();
      setProducts(products);
      setStats(stats);
      setCategories(["All", ...new Set(products.map(p => p.category).filter(Boolean))]);
    } catch (error: any) {
      console.error("Error fetching products:", error);
      toast.error(error.message || "Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  const filtered = products.filter(p => {
    const s = search.toLowerCase();
    const matchSearch = p.name?.toLowerCase().includes(s) || p.sku?.toLowerCase().includes(s);
    const matchCat = filterCat === "All" || p.category === filterCat;
    return matchSearch && matchCat;
  });

  const toggleSelectAll = () => {
    if (selectedProducts.length === filtered.length) setSelectedProducts([]);
    else setSelectedProducts(filtered.map(p => p.id));
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure?")) return;
    try {
      await deleteProduct(id);
      toast.success("Product deleted");
      fetchProducts();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete product");
    }
  };


  return (
    <div className="page-enter">
      <PageHeader title="Products" sub={`${products.length} products total in registry`}>
        <Btn variant="ghost" style={{ gap: 8 }}><Upload size={14} /> Import</Btn>
        <Btn variant="ghost" style={{ gap: 8 }}><Download size={14} /> Export</Btn>
        <Link href="/admin/products/new"><Btn style={{ gap: 8 }}><Plus size={16} /> New Product</Btn></Link>
      </PageHeader>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 28 }}>
        <StatCard label="Total Inventory" value={products.length.toString()} iconChar="◆" color={T.blue} sub="Active items in shop" />
        <StatCard label="Live on Site" value={stats.active.toString()} iconChar="◉" color={T.green} sub="Published status" />
        <StatCard label="Depleted Stock" value={stats.outOfStock.toString()} iconChar="✕" color={T.red} sub="Requires immediate restock" />
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
        <SInput
          placeholder="Search items by name or SKU..."
          style={{ maxWidth: 360 }}
          value={search}
          onChange={(e: any) => setSearch(e.target.value)}
        />
        <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
          {categories.slice(0, 6).map(c => (
            <button
              key={c}
              onClick={() => setFilterCat(c)}
              style={{
                padding: "8px 16px", borderRadius: 8, border: `1px solid ${filterCat === c ? T.blue : T.border}`,
                background: filterCat === c ? `${T.blue}15` : T.surface,
                color: filterCat === c ? T.blue : T.textSub,
                fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap"
              }}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <Card>
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr 0.6fr 0.6fr 0.6fr 0.4fr", gap: 0 }}>
          <TH style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <input type="checkbox" checked={selectedProducts.length === filtered.length && filtered.length > 0} onChange={toggleSelectAll} style={{ accentColor: T.blue }} />
            Item Details
          </TH>
          <TH>Category</TH>
          <TH>Market Value</TH>
          <TH>Inventory</TH>
          <TH>Protocol</TH>
          <TH style={{ textAlign: "right" }}>Actions</TH>

          {loading ? (
            <div style={{ gridColumn: "1/-1", padding: 60, textAlign: "center", color: T.textMuted, fontSize: 13 }}>Syncing with central node...</div>
          ) : filtered.map((p, i) => (
            <React.Fragment key={p.id}>
              <TD style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <input
                  type="checkbox"
                  checked={selectedProducts.includes(p.id)}
                  onChange={() => setSelectedProducts(prev => prev.includes(p.id) ? prev.filter(x => x !== p.id) : [...prev, p.id])}
                  style={{ accentColor: T.blue }}
                />
                <Av l={p.name} size={36} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</div>
                  <div style={{ fontSize: 10, color: T.textMuted, fontFamily: "var(--font-jetbrains), monospace" }}>{p.sku || "N/A"}</div>
                </div>
              </TD>
              <TD><span style={{ padding: "4px 8px", background: T.bg, borderRadius: 6, fontSize: 11 }}>{p.category || "General"}</span></TD>
              <TD style={{ fontFamily: "var(--font-jetbrains), monospace", fontWeight: 700 }}>{fmt(p.sell_price)}</TD>
              <TD style={{ fontFamily: "var(--font-jetbrains), monospace", fontWeight: 700 }}>
                <span style={{ color: (p.stock_quantity || 0) < 5 ? T.red : T.textSub }}>{p.stock_quantity || 0}</span>
                <span style={{ fontSize: 9, color: T.textMuted, marginLeft: 4 }}>QTY</span>
              </TD>
              <TD><Chip s={p.is_active ? "active" : "pending"} /></TD>
              <TD style={{ textAlign: "right", display: "flex", justifyContent: "flex-end", gap: 8 }}>
                <Link href={`/admin/products/${p.id}`}><Btn variant="ghost" style={{ padding: 6 }}><Plus size={14} /></Btn></Link>
                <Btn variant="ghost" style={{ padding: 6, color: T.red }} onClick={() => handleDelete(p.id)}><MoreHorizontal size={14} /></Btn>
              </TD>
              {i < filtered.length - 1 && <div style={{ gridColumn: "1/-1", height: 1, background: T.bg }} />}
            </React.Fragment>
          ))}
          {filtered.length === 0 && !loading && (
            <div style={{ gridColumn: "1/-1", padding: 60, textAlign: "center", color: T.textMuted, fontSize: 13 }}>No artifacts found in this sector.</div>
          )}
        </div>
      </Card>
    </div>
  );
}
