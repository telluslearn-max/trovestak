"use client";

import React, { useState, useEffect } from "react";
import { Plus, Tags, Edit2, Trash2, Menu, Package, Folder, Search, MoreVertical, LayoutGrid } from "lucide-react";
import { getCategories, upsertCategory, deleteCategory, getCategoryDetail } from "../actions";
import { MenuBuilder } from "@/components/admin/menu-builder";
import { toast } from "sonner";
import {
  Av, Chip, Card, StatCard, Btn, SInput, TH, TD, T, PageHeader
} from "@/components/admin/ui-pro";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");

  // Dialogs
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [formData, setFormData] = useState({ name: "", slug: "", description: "" });
  const [megamenuOpen, setMegamenuOpen] = useState(false);
  const [viewCategoryOpen, setViewCategoryOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [categoryProducts, setCategoryProducts] = useState<any[]>([]);
  const [subcategories, setSubcategories] = useState<any[]>([]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const { categories, totalCount } = await getCategories();
      setCategories(categories);
      setTotalCount(totalCount);
    } catch (err: any) {
      toast.error(err.message || "Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  const filteredCategories = categories.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.slug?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenDialog = (category?: any) => {
    if (category) {
      setEditingCategory(category);
      setFormData({ name: category.name, slug: category.slug || "", description: category.description || "" });
    } else {
      setEditingCategory(null);
      setFormData({ name: "", slug: "", description: "" });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name) return;
    const slug = formData.slug || formData.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

    try {
      await upsertCategory({ name: formData.name, slug, description: formData.description }, editingCategory?.id);
      toast.success(editingCategory ? "Category updated" : "Category created");
      setDialogOpen(false);
      fetchCategories();
    } catch (err: any) {
      toast.error(err.message || "Operation failed");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this category?")) return;
    try {
      await deleteCategory(id);
      toast.success("Category removed");
      fetchCategories();
    } catch (err: any) {
      toast.error(err.message || "Failed to remove category");
    }
  };

  const handleViewCategory = async (category: any) => {
    setSelectedCategory(category);
    setViewCategoryOpen(true);
    try {
      const { subcategories, products } = await getCategoryDetail(category.id);
      setSubcategories(subcategories);
      setCategoryProducts(products);
    } catch (err: any) {
      toast.error(err.message || "Failed to load category details");
    }
  };


  return (
    <div className="page-enter" style={{ padding: "32px" }}>
      <PageHeader title="Categories" sub={`${categories.length} segments in catalog taxonomy`}>
        <Btn variant="ghost" onClick={() => setMegamenuOpen(true)}>Megamenu Architect</Btn>
        <Btn onClick={() => handleOpenDialog()}>+ Add Category</Btn>
      </PageHeader>

      <Card>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1.5fr 1fr 0.8fr 80px" }}>
          {["Name", "Slug", "Products", "Status", ""].map(h => <TH key={h}>{h}</TH>)}
          {loading ? (
            <div style={{ gridColumn: "span 5", padding: "40px", textAlign: "center", color: T.textMuted }}>
              Synchronizing dictionary...
            </div>
          ) : filteredCategories.length === 0 ? (
            <div style={{ gridColumn: "span 5", padding: "40px", textAlign: "center", color: T.textMuted }}>
              No categories found matching &quot;{searchQuery}&quot;
            </div>
          ) : (
            filteredCategories.map((c, i) => [
              <TD key={`n${i}`}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: T.surface, border: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>
                    📁
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{c.name}</span>
                </div>
              </TD>,
              <TD key={`sl${i}`} mono muted>/{c.slug}</TD>,
              <TD key={`pr${i}`} mono>{c.product_count || 0}</TD>,
              <TD key={`st${i}`}><Chip s={c.is_active ? "active" : "inactive"} label={c.is_active ? "Active" : "Disabled"} /></TD>,
              <TD key={`ac${i}`}>
                <div style={{ display: "flex", gap: 4 }}>
                  <Btn small variant="ghost" onClick={() => handleOpenDialog(c)}>Edit</Btn>
                  <Btn small variant="ghost" onClick={() => handleDelete(c.id)} style={{ color: T.red }}>✕</Btn>
                </div>
              </TD>,
            ])
          )}
        </div>
      </Card>

      {/* Megamenu Dialog */}
      <Dialog open={megamenuOpen} onOpenChange={setMegamenuOpen}>
        <DialogContent className="max-w-6xl h-[90vh] overflow-auto border-border bg-card">
          <DialogHeader>
            <DialogTitle className={T.h3}>Megamenu Architect</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <MenuBuilder
              items={[]}
              onChange={() => { }}
              pages={[]}
              categories={categories}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="border-border bg-card max-w-md">
          <DialogHeader>
            <DialogTitle className={T.h3}>{editingCategory ? "Configure Category" : "New Category"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className={T.labelMuted}>Display Name</label>
              <SInput
                value={formData.name}
                onChange={(v: string) => setFormData({ ...formData, name: v })}
                placeholder="e.g. Smart Electronics"
              />
            </div>
            <div className="space-y-2">
              <label className={T.labelMuted}>URL Slug (Optional)</label>
              <SInput
                value={formData.slug}
                onChange={(v: string) => setFormData({ ...formData, slug: v })}
                placeholder="e.g. smart-electronics"
              />
            </div>
            <div className="space-y-2">
              <label className={T.labelMuted}>Description</label>
              <SInput
                value={formData.description}
                onChange={(v: string) => setFormData({ ...formData, description: v })}
                placeholder="Marketing blurb for this category"
              />
            </div>
          </div>
          <DialogFooter>
            <Btn variant="ghost" onClick={() => setDialogOpen(false)}>Cancel</Btn>
            <Btn onClick={handleSave}>{editingCategory ? "Update" : "Initialize"}</Btn>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

