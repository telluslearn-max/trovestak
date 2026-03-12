"use client";

import { useState, useEffect, useRef } from "react";
import { X, Upload, Search, ChevronLeft, ChevronRight, Trash2, Check } from "lucide-react";
import Image from "next/image";
import { useTheme } from "@/components/admin/theme-wrapper";
import { cn } from "@/lib/utils";

interface MediaItem {
  id: string;
  filename: string;
  url: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  created_at: string;
}

interface MediaLibraryProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (urls: string[]) => void;
  multiple?: boolean;
  title?: string;
}

export function MediaLibrary({
  isOpen,
  onClose,
  onSelect,
  multiple = false,
  title = "Media Library"
}: MediaLibraryProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      fetchMedia();
    }
  }, [isOpen, page, search]);

  const fetchMedia = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
      });
      if (search) params.append("search", search);

      const res = await fetch(`/api/upload?${params}`);
      const data = await res.json();

      if (data.media) {
        setMedia(data.media);
        setTotalPages(data.pagination?.pages || 1);
      }
    } catch (err) {
      console.error("Failed to fetch media:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();

        if (data.url) {
          setMedia(prev => [data.media, ...prev]);
        }
      }
    } catch (err) {
      console.error("Upload failed:", err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDelete = async (item: MediaItem) => {
    if (!confirm("Delete this image?")) return;

    try {
      await fetch(`/api/upload?id=${item.id}`, { method: "DELETE" });
      setMedia(prev => prev.filter(m => m.id !== item.id));
      setSelected(prev => prev.filter(url => url !== item.url));
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  const toggleSelect = (url: string) => {
    if (multiple) {
      setSelected(prev =>
        prev.includes(url)
          ? prev.filter(u => u !== url)
          : [...prev, url]
      );
    } else {
      setSelected([url]);
    }
  };

  const handleConfirm = () => {
    onSelect(selected);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className={cn(
        "relative rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col",
        isDark ? "bg-[#111827] text-white" : "bg-white text-[#0f172a]"
      )}>
        {/* Header */}
        <div className={cn("flex items-center justify-between p-4 border-b", isDark ? "border-[#1f2937]" : "border-gray-100")}>
          <h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose} className={cn("p-1 rounded transition-colors", isDark ? "hover:bg-gray-800" : "hover:bg-gray-100")}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-4 p-4 border-b">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search images..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className={cn(
                "w-full pl-9 pr-4 py-2 border rounded-lg text-sm transition-all",
                isDark
                  ? "bg-[#0f172a] border-[#1f2937] text-white focus:ring-1 focus:ring-blue-500"
                  : "bg-white border-gray-200 text-[#0f172a] focus:ring-1 focus:ring-blue-500"
              )}
            />
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleUpload}
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <Upload className="w-4 h-4" />
            {uploading ? "Uploading..." : "Upload"}
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          {loading ? (
            <div className="grid grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className={cn("aspect-square rounded-lg animate-pulse", isDark ? "bg-gray-800" : "bg-gray-200")} />
              ))}
            </div>
          ) : media.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No images yet. Upload some images to get started.
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-4">
              {media.map((item) => (
                <div
                  key={item.id}
                  className={`relative aspect-square rounded-lg overflow-hidden border-2 cursor-pointer transition-all ${selected.includes(item.url)
                      ? "border-blue-600 ring-2 ring-blue-600 ring-offset-2"
                      : "border-gray-200 hover:border-gray-300"
                    }`}
                  onClick={() => toggleSelect(item.url)}
                >
                  <Image
                    src={item.url}
                    alt={item.filename}
                    fill
                    className="object-cover"
                  />

                  {selected.includes(item.url) && (
                    <div className="absolute inset-0 bg-blue-600/30 flex items-center justify-center">
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                        <Check className="w-5 h-5 text-white" />
                      </div>
                    </div>
                  )}

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(item);
                    }}
                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded opacity-0 hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                    <p className="text-xs text-white truncate">{item.filename}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 p-4 border-t">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 hover:bg-gray-100 rounded disabled:opacity-50"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 hover:bg-gray-100 rounded disabled:opacity-50"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Footer */}
        <div className={cn("flex items-center justify-between p-4 border-t", isDark ? "bg-[#0f172a] border-[#1f2937]" : "bg-gray-50 border-gray-100")}>
          <p className={cn("text-sm", isDark ? "text-gray-400" : "text-gray-500")}>
            {selected.length > 0
              ? `${selected.length} image${selected.length > 1 ? "s" : ""} selected`
              : "Select an image to continue"}
          </p>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border rounded-lg hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={selected.length === 0}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {multiple ? `Add ${selected.length} Image${selected.length > 1 ? "s" : ""}` : "Select Image"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
