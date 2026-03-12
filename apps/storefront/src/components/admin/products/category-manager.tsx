"use client";

import React, { useState } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  ChevronRight,
  ChevronDown,
  Search,
  Image as ImageIcon,
  Loader2,
  Check,
  X,
  Eye,
  Package,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useCategories, useCategoryTree, useCategoryMutations } from "@/hooks/useCategories";
import { getCategoryDetail } from "@/app/admin/actions";
import type { Category } from "@/types/product";

const categorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().optional(),
  description: z.string().optional(),
  parent_id: z.string().optional(),
});

type CategoryFormData = z.infer<typeof categorySchema>;

export function CategoryManager() {
  const { categories, loading, refetch } = useCategories({ activeOnly: false });
  const { tree, loading: treeLoading } = useCategoryTree();
  const { createCategory, updateCategory, deleteCategory, loading: mutationLoading } = useCategoryMutations();

  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [categoryProducts, setCategoryProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [productsDialogOpen, setProductsDialogOpen] = useState(false);

  const { register, handleSubmit, reset, setValue, watch } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
  });

  // Filter categories by search
  const filteredCategories = categories.filter(cat =>
    cat.name.toLowerCase().includes(search.toLowerCase()) ||
    cat.slug?.toLowerCase().includes(search.toLowerCase())
  );

  // Handle open dialog for new/edit
  const handleOpenDialog = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      reset({
        name: category.name,
        slug: category.slug,
        description: category.description,
        parent_id: category.parent_id,
      });
    } else {
      setEditingCategory(null);
      reset({ name: "", slug: "", description: "", parent_id: "" });
    }
    setDialogOpen(true);
  };

  // Save category
  const onSubmit = async (data: CategoryFormData) => {
    const result = editingCategory
      ? await updateCategory(editingCategory.id, data)
      : await createCategory(data);

    if (!result.error) {
      setDialogOpen(false);
      refetch();
    }
  };

  // Delete category
  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this category?")) {
      await deleteCategory(id);
      refetch();
    }
  };

  // Toggle expand for tree view
  const toggleExpand = (id: string) => {
    const newSet = new Set(expandedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setExpandedIds(newSet);
  };

  // View products in category
  const handleViewProducts = async (category: Category) => {
    setSelectedCategory(category);
    setLoadingProducts(true);
    setProductsDialogOpen(true);

    try {
      const { products } = await getCategoryDetail(category.id);
      setCategoryProducts(products || []);
    } catch (err) {
      console.error("Error loading products:", err);
      setCategoryProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  };

  // Render tree node
  const renderTreeNode = (category: Category & { children?: Category[] }, level = 0) => {
    const hasChildren = category.children && category.children.length > 0;
    const isExpanded = expandedIds.has(category.id);

    return (
      <React.Fragment key={category.id}>
        <TableRow className="hover:bg-[#F5F5F7]">
          <TableCell className="w-[30px]">
            {hasChildren && (
              <button
                onClick={(e) => { e.stopPropagation(); toggleExpand(category.id); }}
                className="p-1 hover:bg-[#E5E5E7] rounded"
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </button>
            )}
          </TableCell>
          <TableCell className="w-[50px]">
            {category.thumbnail_url ? (
              <img
                src={category.thumbnail_url}
                alt={category.name}
                className="w-10 h-10 rounded object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded bg-[#F5F5F7] flex items-center justify-center">
                <ImageIcon className="w-4 h-4 text-[#86868B]" />
              </div>
            )}
          </TableCell>
          <TableCell>
            <div className="flex items-center gap-2">
              <span style={{ paddingLeft: `${level * 20}px` }} className="font-medium">
                {category.name}
              </span>
              {category.parent_id && (
                <Badge variant="secondary" className="text-xs">
                  Child
                </Badge>
              )}
            </div>
            <p className="text-xs text-[#86868B]">{category.slug}</p>
          </TableCell>
          <TableCell className="text-[#86868B]">
            {category.description || "—"}
          </TableCell>
          <TableCell className="w-[100px]">
            <Badge variant={category.is_active ? "success" : "secondary"}>
              {category.is_active ? "Active" : "Inactive"}
            </Badge>
          </TableCell>
          <TableCell className="w-[140px] text-right">
            <div className="flex items-center justify-end gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-[#0071E3]"
                title="View Products"
                onClick={() => handleViewProducts(category)}
              >
                <Eye className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => handleOpenDialog(category)}
              >
                <Edit2 className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-[#FF3B30]"
                onClick={() => handleDelete(category.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </TableCell>
        </TableRow>
        {hasChildren && isExpanded && category.children!.map(child =>
          renderTreeNode(child, level + 1)
        )}
      </React.Fragment>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#86868B]" />
          <Input
            placeholder="Search categories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-white border-[#E5E5E7]"
          />
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="w-4 h-4 mr-1" />
              Add Category
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleSubmit(onSubmit)}>
              <DialogHeader>
                <DialogTitle>
                  {editingCategory ? "Edit Category" : "New Category"}
                </DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    {...register("name")}
                    placeholder="Category name"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="slug">URL Slug</Label>
                  <Input
                    id="slug"
                    {...register("slug")}
                    placeholder="category-slug"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="parent">Parent Category</Label>
                  <select
                    id="parent"
                    {...register("parent_id")}
                    className="flex h-10 w-full rounded-md border border-[#E5E5E7] bg-white px-3 py-2 text-sm"
                    value={watch("parent_id") || ""}
                    onChange={(e) => setValue("parent_id", e.target.value || undefined)}
                  >
                    <option value="">No parent</option>
                    {categories
                      .filter(c => c.id !== editingCategory?.id)
                      .map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))
                    }
                  </select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    {...register("description")}
                    placeholder="Category description"
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={mutationLoading}>
                  {mutationLoading && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
                  {editingCategory ? "Save Changes" : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Categories Table */}
      <div className="bg-white rounded-lg border border-[#E5E5E7] overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-[#F5F5F7] hover:bg-[#F5F5F7]">
              <TableHead className="w-[30px]"></TableHead>
              <TableHead className="w-[50px]">Image</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="w-[100px]">Status</TableHead>
              <TableHead className="w-[100px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading || treeLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><div className="w-4 h-4" /></TableCell>
                  <TableCell><div className="w-10 h-10 bg-[#F5F5F7] rounded" /></TableCell>
                  <TableCell><div className="h-4 w-[150px] bg-[#F5F5F7] rounded" /></TableCell>
                  <TableCell><div className="h-4 w-[200px] bg-[#F5F5F7] rounded" /></TableCell>
                  <TableCell><div className="h-5 w-[60px] bg-[#F5F5F7] rounded" /></TableCell>
                  <TableCell><div className="h-8 w-16 bg-[#F5F5F7] rounded" /></TableCell>
                </TableRow>
              ))
            ) : filteredCategories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-[200px] text-center text-[#86868B]">
                  <div className="flex flex-col items-center gap-2">
                    <p>No categories found</p>
                    <Button variant="outline" size="sm" onClick={() => handleOpenDialog()}>
                      Create your first category
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              tree.map(category => renderTreeNode(category))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Products in Category Dialog */}
      <Dialog open={productsDialogOpen} onOpenChange={setProductsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Products in {selectedCategory?.name}
            </DialogTitle>
          </DialogHeader>

          {loadingProducts ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-[#0071E3]" />
            </div>
          ) : categoryProducts.length === 0 ? (
            <div className="text-center py-8 text-[#86868B]">
              <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No products in this category</p>
            </div>
          ) : (
            <div className="space-y-2">
              {categoryProducts.map(product => (
                <div
                  key={product.id}
                  className="flex items-center justify-between p-3 bg-[#F5F5F7] rounded-lg hover:bg-[#E5E5E7] transition-colors"
                >
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-[#86868B]">{product.slug}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={product.is_active ? "success" : "secondary"}>
                      {product.is_active ? "Active" : "Inactive"}
                    </Badge>
                    <span className="font-medium">
                      KES {product.regular_price?.toLocaleString() || 0}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-4 pt-4 border-t flex justify-between items-center">
            <p className="text-sm text-[#86868B]">
              {categoryProducts.length} product(s)
            </p>
            <Button variant="outline" onClick={() => setProductsDialogOpen(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
