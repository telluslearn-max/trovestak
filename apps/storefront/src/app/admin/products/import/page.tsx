"use client";

import { useState, useRef } from "react";
import { Upload, FileText, Download, ChevronDown, Check, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { templates, getTemplates, getCategories, getTemplateFilePath } from "@/lib/templates";

interface ImportResult {
  row: number;
  success: boolean;
  status: 'created' | 'updated' | 'error';
  id?: string;
  error?: string;
  name?: string;
}

export default function ProductImportPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("mobile");
  const [selectedTemplate, setSelectedTemplate] = useState<string>("mobile-full");
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState<ImportResult[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const templates = getTemplates();
  const categories = getCategories();
  const categoryTemplates = templates.filter(t => t.category === selectedCategory);

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
    const firstTemplate = templates.find(t => t.category === categoryId);
    if (firstTemplate) {
      setSelectedTemplate(firstTemplate.id);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.csv')) {
        toast.error("Please select a CSV file");
        return;
      }
      setFile(selectedFile);
      setResults([]);
    }
  };

  const handleImport = async () => {
    if (!file) {
      toast.error("Please select a CSV file to import");
      return;
    }

    setImporting(true);
    setResults([]);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('template', selectedTemplate);

      const response = await fetch('/api/products/import', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Import failed');
      }

      setResults(data.results || []);
      toast.success(`Import completed: ${data.summary?.success || 0} products imported`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Import failed';
      toast.error(errorMessage);
    } finally {
      setImporting(false);
    }
  };

  const handleDownloadTemplate = () => {
    const template = templates.find(t => t.id === selectedTemplate);
    if (!template) return;

    const link = document.createElement('a');
    link.href = getTemplateFilePath(selectedTemplate);
    link.download = template.file.split('/').pop() || 'template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const selectedTemplateData = templates.find(t => t.id === selectedTemplate);

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-[#1D1D1F]">Import Products</h1>
        <p className="text-sm text-[#86868B] mt-1">
          Import products from CSV files with full product data including variants, specs, and content
        </p>
      </div>

      <div className="grid gap-6">
        {/* Step 1: Select Category */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#0071E3] text-white text-sm">1</span>
              Select Category
            </CardTitle>
            <CardDescription>Choose the product category for your import</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {categories.map((category) => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? "default" : "outline"}
                  onClick={() => handleCategoryChange(category.id)}
                  className={selectedCategory === category.id ? "bg-[#0071E3] hover:bg-[#0077ED]" : ""}
                >
                  {category.name}
                  {category.templates.length > 0 && (
                    <Badge variant="secondary" className="ml-2 text-xs">
                      {category.templates.length}
                    </Badge>
                  )}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Step 2: Select Template */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#0071E3] text-white text-sm">2</span>
              Select Template
            </CardTitle>
            <CardDescription>Choose a template type for your category</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid gap-3">
                {categoryTemplates.map((template) => (
                  <div
                    key={template.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      selectedTemplate === template.id
                        ? "border-[#0071E3] bg-[#0071E3]/5"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => setSelectedTemplate(template.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className={`mt-1 w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          selectedTemplate === template.id
                            ? "border-[#0071E3] bg-[#0071E3]"
                            : "border-gray-300"
                        }`}>
                          {selectedTemplate === template.id && (
                            <Check className="w-2.5 h-2.5 text-white" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-medium text-[#1D1D1F]">{template.name}</h3>
                          <p className="text-sm text-[#86868B] mt-1">{template.description}</p>
                          <p className="text-xs text-[#86868B] mt-2">
                            Example: <span className="font-medium">{template.example_product}</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {selectedTemplateData && (
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-[#1D1D1F]">
                      {selectedTemplateData.fields?.length || 0} fields available
                    </p>
                    <p className="text-xs text-[#86868B]">
                      Use case: {selectedTemplateData.use_case}
                    </p>
                  </div>
                  <Button variant="outline" onClick={handleDownloadTemplate}>
                    <Download className="w-4 h-4 mr-2" />
                    Download Template
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Step 3: Upload File */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#0071E3] text-white text-sm">3</span>
              Upload CSV
            </CardTitle>
            <CardDescription>Upload your CSV file with product data</CardDescription>
          </CardHeader>
          <CardContent>
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-[#0071E3] transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
              />
              {file ? (
                <div className="flex items-center justify-center gap-3">
                  <FileText className="w-8 h-8 text-[#0071E3]" />
                  <div className="text-left">
                    <p className="font-medium text-[#1D1D1F]">{file.name}</p>
                    <p className="text-sm text-[#86868B]">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                    }}
                  >
                    Change
                  </Button>
                </div>
              ) : (
                <>
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-[#1D1D1F] font-medium">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-sm text-[#86868B] mt-1">
                    CSV files only (max 10MB)
                  </p>
                </>
              )}
            </div>

            <div className="mt-4 flex justify-end">
              <Button
                onClick={handleImport}
                disabled={!file || importing}
                className="bg-[#0071E3] hover:bg-[#0077ED]"
              >
                {importing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Import Products
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {results.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Import Results</CardTitle>
              <CardDescription>
                Summary: {results.filter(r => r.status === 'created' || r.status === 'updated').length} success, {results.filter(r => r.status === 'error').length} errors
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {results.map((result: any, index: number) => (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      result.status === 'created' || result.status === 'updated' ? "bg-green-50" : 
                      result.status === 'error' ? "bg-red-50" : "bg-yellow-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {result.status === 'created' || result.status === 'updated' ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : result.status === 'error' ? (
                        <AlertCircle className="w-4 h-4 text-red-600" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-yellow-600" />
                      )}
                      <span className={result.status === 'created' || result.status === 'updated' ? "text-green-800" : 
                        result.status === 'error' ? "text-red-800" : "text-yellow-800"}>
                        {result.name || `Row ${result.row}`}
                      </span>
                    </div>
                    {result.status === 'created' || result.status === 'updated' ? (
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        {result.status === 'created' ? 'Created' : 'Updated'}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-red-600 border-red-600 max-w-[300px] truncate">
                        {result.error || result.status || 'Error'}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
