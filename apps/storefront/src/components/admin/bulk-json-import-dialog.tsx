"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Upload,
  FileJson,
  Package,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

interface ImportResult {
  success: boolean;
  productName: string;
  error?: string;
}

export function BulkJSONImportDialog({
  open,
  onClose,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<ImportResult[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResults([]);
      setProgress(0);
    }
  };

  const handleImport = async () => {
    if (!file) return;

    setImporting(true);
    setResults([]);

    try {
      const text = await file.text();
      const products = JSON.parse(text);

      if (!Array.isArray(products)) {
        throw new Error("Invalid JSON format. Expected an array of products.");
      }

      const total = products.length;
      const newResults: ImportResult[] = [];

      for (let i = 0; i < products.length; i++) {
        const product = products[i];

        try {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/import-products`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
              },
              body: JSON.stringify({ products: [product] }),
            }
          );

          const data = await response.json();

          if (response.ok && data.success > 0) {
            newResults.push({
              success: true,
              productName: product.product?.name || "Unknown",
            });
          } else {
            newResults.push({
              success: false,
              productName: product.product?.name || "Unknown",
              error: data.errors?.[0] || "Import failed",
            });
          }
        } catch (err: any) {
          newResults.push({
            success: false,
            productName: product.product?.name || "Unknown",
            error: err.message,
          });
        }

        setProgress(((i + 1) / total) * 100);
      }

      setResults(newResults);
      const successful = newResults.filter((r) => r.success).length;
      const failed = newResults.filter((r) => !r.success).length;

      if (successful > 0) {
        toast.success(`Imported ${successful} products`);
        onSuccess();
      }
      if (failed > 0) {
        toast.error(`Failed to import ${failed} products`);
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setImporting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="w-full max-w-lg mx-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileJson className="w-5 h-5" />
            Import Products from JSON
          </CardTitle>
          <CardDescription>
            Upload a JSON file with product data to bulk import
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!importing && results.length === 0 && (
            <div className="space-y-4">
              <div
                className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Click to upload JSON file
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Supports JSON array of products
                </p>
              </div>

              <Input
                ref={fileInputRef}
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleFileChange}
              />

              {file && (
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-2">
                    <FileJson className="w-4 h-4" />
                    <span className="text-sm">{file.name}</span>
                  </div>
                  <Button onClick={handleImport} disabled={importing}>
                    <Upload className="w-4 h-4 mr-2" />
                    Import
                  </Button>
                </div>
              )}
            </div>
          )}

          {importing && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span>Importing products...</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
              <p className="text-sm text-muted-foreground text-center">
                Please don't close this dialog
              </p>
            </div>
          )}

          {results.length > 0 && (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {results.map((result, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 text-sm"
                >
                  <div className="flex items-center gap-2">
                    {result.success ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-500" />
                    )}
                    <span>{result.productName}</span>
                  </div>
                  {result.error && (
                    <Badge variant="destructive" className="text-xs">
                      {result.error}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose} disabled={importing}>
              Close
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Single product JSON import
export async function importSingleProduct(jsonData: any): Promise<boolean> {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/import-products`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ products: [jsonData] }),
      }
    );

    const data = await response.json();
    return response.ok && data.success > 0;
  } catch {
    return false;
  }
}
