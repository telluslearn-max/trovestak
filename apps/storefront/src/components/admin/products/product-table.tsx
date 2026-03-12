"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { MoreHorizontal, Search, AlertCircle, Download, Upload, FileSpreadsheet, X, Check, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useProducts } from "@/hooks/useProducts";
import { Checkbox } from "@/components/ui/checkbox";
import { deleteProduct, bulkDeleteProducts } from "@/app/admin/products/actions";
import { toast } from "sonner";

function formatPrice(price: number | undefined | null): string {
  if (!price || price === 0) return "—";
  return `KES ${price.toLocaleString()}`;
}

export function ProductTable() {
  const [page, setPage] = useState(1);
  const limit = 100;
  const { products, loading, error, refetch, pagination } = useProducts(page, limit);
  const [search, setSearch] = useState("");
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Clear selection when page changes
  useEffect(() => {
    setSelectedIds(new Set());
  }, [page]);

  const filteredProducts = products.filter(p =>
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.slug?.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(filteredProducts.map(p => p.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedIds);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedIds(newSelected);
  };

  const handleExport = async () => {
    try {
      const res = await fetch("/api/products/export");
      if (!res.ok) throw new Error("Export failed");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `products-export-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error("Export error:", err);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setImportResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/products/import", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      setImportResult(data);

      if (data.summary?.success > 0) {
        refetch();
      }
    } catch (err) {
      console.error("Import error:", err);
      setImportResult({ error: "Import failed" });
    } finally {
      setImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    try {
      await deleteProduct(id);
      toast.success("Product deleted successfully");
      refetch();
    } catch (err) {
      console.error("Delete error:", err);
      toast.error("Failed to delete product");
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedIds.size} product(s)?`)) return;

    setDeleting(true);
    try {
      await bulkDeleteProducts(Array.from(selectedIds));
      toast.success(`${selectedIds.size} products deleted successfully`);
      setSelectedIds(new Set());
      refetch();
    } catch (err) {
      console.error("Bulk delete error:", err);
      toast.error("Failed to delete products");
    } finally {
      setDeleting(false);
    }
  };

  const handleDownloadTemplate = () => {
    window.open("/products-import-template.csv", "_blank");
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPage(newPage);
    }
  };

  if (error) {
    return (
      <div className="bg-white rounded-lg border border-red-200 p-8 text-center">
        <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-4" />
        <p className="text-red-600">Error: {error}</p>
        <Button variant="outline" onClick={refetch} className="mt-4">Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#86868B]" />
          <Input
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-white border-[#E5E5E7]"
          />
        </div>
        <div className="flex items-center gap-2">
          {selectedIds.size > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleBulkDelete}
              disabled={deleting}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {deleting ? "Deleting..." : `Delete (${selectedIds.size})`}
            </Button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleImport}
            className="hidden"
          />
          <Button variant="outline" size="sm" onClick={handleDownloadTemplate}>
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Template
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
          >
            <Upload className="w-4 h-4 mr-2" />
            {importing ? "Importing..." : "Import"}
          </Button>
          <Button variant="outline" size="sm" onClick={refetch}>Refresh</Button>
        </div>
      </div>

      {/* Import Result */}
      {importing && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="animate-spin w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full" />
            <span className="font-medium text-blue-700">Importing products...</span>
          </div>
          <div className="mt-3 h-2 bg-blue-100 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 animate-pulse w-3/4" />
          </div>
        </div>
      )}

      {importResult && !importing && (
        <div className={`p-4 rounded-lg border ${importResult.error ? "bg-red-50 border-red-200" :
            importResult.summary?.errors > 0 ? "bg-yellow-50 border-yellow-200" :
              "bg-green-50 border-green-200"
          }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {importResult.error ? (
                <AlertCircle className="w-5 h-5 text-red-500" />
              ) : (
                <Check className="w-5 h-5 text-green-500" />
              )}
              <span className="font-medium">
                {importResult.error
                  ? "Import failed"
                  : `Import complete: ${importResult.summary?.success} created/updated`
                }
              </span>
            </div>
            <button onClick={() => setImportResult(null)}>
              <X className="w-4 h-4" />
            </button>
          </div>

          {importResult.results && importResult.results.length > 0 && (
            <div className="mt-3 text-sm">
              {importResult.summary?.errors > 0 && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-red-600 font-medium">
                    {importResult.summary?.errors} error(s) - click to see details
                  </summary>
                  <div className="mt-2 max-h-48 overflow-y-auto bg-red-50 rounded p-2">
                    {importResult.results
                      .filter((r: any) => r.status === "error")
                      .map((r: any, i: number) => (
                        <div key={i} className="text-red-700 py-1 border-b border-red-100 last:border-0">
                          <span className="font-medium">{r.name || "Row " + r.row}:</span> {r.error}
                        </div>
                      ))}
                  </div>
                </details>
              )}
              {importResult.summary?.skipped > 0 && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-yellow-600 font-medium">
                    {importResult.summary?.skipped} skipped - click to see details
                  </summary>
                  <div className="mt-2 max-h-48 overflow-y-auto bg-yellow-50 rounded p-2">
                    {importResult.results
                      .filter((r: any) => r.status === "skipped")
                      .map((r: any, i: number) => (
                        <div key={i} className="text-yellow-700 py-1 border-b border-yellow-100 last:border-0">
                          <span className="font-medium">{r.name || "Row " + r.row}:</span> {r.error}
                        </div>
                      ))}
                  </div>
                </details>
              )}
            </div>
          )}
        </div>
      )}

      <div className="bg-white rounded-lg border border-[#E5E5E7] overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-[#F5F5F7]">
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={filteredProducts.length > 0 && selectedIds.size === filteredProducts.length}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead className="w-[50px]">#</TableHead>
              <TableHead>Product</TableHead>
              <TableHead className="w-[120px] text-right">Price</TableHead>
              <TableHead className="w-[80px]">Status</TableHead>
              <TableHead className="w-[60px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="w-4 h-4" /></TableCell>
                  <TableCell><Skeleton className="w-6 h-4" /></TableCell>
                  <TableCell><Skeleton className="h-12 w-full" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-[60px]" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                </TableRow>
              ))
            ) : filteredProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-[200px] text-center text-[#86868B]">
                  <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                  <p>No products found</p>
                  <Button variant="outline" size="sm" asChild className="mt-2">
                    <Link href="/admin/products/new">Add your first product</Link>
                  </Button>
                </TableCell>
              </TableRow>
            ) : (
              filteredProducts.map((product, index) => (
                <TableRow key={product.id} className="hover:bg-[#F5F5F7]">
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.has(product.id)}
                      onCheckedChange={(checked) => handleSelectOne(product.id, checked as boolean)}
                    />
                  </TableCell>
                  <TableCell className="font-mono text-[#86868B]">{index + 1}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded bg-[#F5F5F7] overflow-hidden relative">
                        {product.thumbnail_url ? (
                          <Image src={product.thumbnail_url} alt={product.name} fill className="object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[#86868B] text-xs">—</div>
                        )}
                      </div>
                      <Link href={`/admin/products/${product.id}`} className="font-medium hover:text-[#0071E3]">
                        {product.name}
                      </Link>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatPrice(product.regular_price || (product as any).price)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={product.is_active ? "success" : "secondary"}>
                      {product.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/products/${product.id}`}>Edit</Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-600 focus:text-red-600"
                          onClick={() => handleDelete(product.id)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      {!loading && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-[#86868B]">
            Showing {((pagination.page - 1) * limit) + 1}-{Math.min(pagination.page * limit, pagination.total)} of {pagination.total} products
            {selectedIds.size > 0 && ` (${selectedIds.size} selected)`}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(page - 1)}
              disabled={page <= 1}
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </Button>
            <span className="text-sm text-[#86868B] px-2">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(page + 1)}
              disabled={page >= pagination.totalPages}
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {!loading && pagination.totalPages <= 1 && pagination.total > 0 && (
        <p className="text-sm text-[#86868B]">
          Showing {pagination.total} products
          {selectedIds.size > 0 && ` (${selectedIds.size} selected)`}
        </p>
      )}
    </div>
  );
}
