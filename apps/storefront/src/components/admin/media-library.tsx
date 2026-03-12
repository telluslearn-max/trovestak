"use client";

import { supabase } from "@/lib/supabase";
import { useState, useEffect, useCallback } from "react";
import {
  Image as ImageIcon,
  Video,
  File,
  Search,
  Upload,
  X,
  Check,
  Trash2,
  Copy,
  ExternalLink,
  FolderOpen,
  Grid,
  List,
  MoreVertical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

interface MediaAsset {
  id: string;
  public_id: string;
  url: string;
  filename: string;
  alt_text: string | null;
  type: "image" | "video" | "document";
  width: number | null;
  height: number | null;
  size_bytes: number | null;
  folder: string;
  created_at: string;
}

interface MediaLibraryProps {
  onSelect?: (assets: MediaAsset[]) => void;
  multiple?: boolean;
  selectedIds?: string[];
  onSelectedChange?: (ids: string[]) => void;
}

export function MediaLibrary({ onSelect, multiple = false, selectedIds = [], onSelectedChange }: MediaLibraryProps) {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [uploading, setUploading] = useState(false);

  const fetchAssets = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from("media_assets")
      .select("*")
      .order("created_at", { ascending: false });

    if (search) {
      query = query.ilike("filename", `%${search}%`);
    }
    if (typeFilter !== "all") {
      query = query.eq("type", typeFilter);
    }

    const { data } = await query;
    setAssets(data || []);
    setLoading(false);
  }, [search, typeFilter]);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  const handleSelect = (asset: MediaAsset) => {
    if (multiple) {
      const newSelected = selectedIds.includes(asset.id)
        ? selectedIds.filter((id) => id !== asset.id)
        : [...selectedIds, asset.id];
      onSelectedChange?.(newSelected);
    } else {
      onSelectedChange?.([asset.id]);
      onSelect?.([asset]);
    }
  };

  const handleConfirmSelection = () => {
    const selected = assets.filter((a) => selectedIds.includes(a.id));
    onSelect?.(selected);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this asset?")) return;

    const asset = assets.find((a) => a.id === id);
    
    await supabase.from("media_assets").delete().eq("id", id);
    setAssets((prev) => prev.filter((a) => a.id !== id));
    onSelectedChange?.(selectedIds.filter((sid) => sid !== id));
  };

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "";
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/40" />
          <Input
            placeholder="Search media..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-12 pl-12 pr-4 rounded-2xl bg-muted/30 border-none"
          />
        </div>

        <div className="flex items-center gap-2">
          {["all", "image", "video", "document"].map((type) => (
            <Button
              key={type}
              variant={typeFilter === type ? "default" : "ghost"}
              size="sm"
              onClick={() => setTypeFilter(type)}
              className={cn(
                "rounded-xl capitalize",
                typeFilter === type && "bg-primary text-white"
              )}
            >
              {type}
            </Button>
          ))}
        </div>

        <div className="flex items-center gap-1 bg-muted/30 rounded-xl p-1">
          <Button
            variant={viewMode === "grid" ? "default" : "ghost"}
            size="icon"
            onClick={() => setViewMode("grid")}
            className={cn("h-9 w-9", viewMode === "grid" && "bg-primary text-white")}
          >
            <Grid className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "ghost"}
            size="icon"
            onClick={() => setViewMode("list")}
            className={cn("h-9 w-9", viewMode === "list" && "bg-primary text-white")}
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="aspect-square rounded-2xl bg-muted/30 animate-pulse" />
          ))}
        </div>
      ) : assets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-20 h-20 rounded-3xl bg-muted/30 flex items-center justify-center mb-6">
            <FolderOpen className="w-10 h-10 text-muted-foreground/30" />
          </div>
          <h3 className="font-black text-lg text-foreground/60 mb-2">No media found</h3>
          <p className="text-sm text-muted-foreground">Upload images and videos to get started</p>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <AnimatePresence>
            {assets.map((asset) => (
              <motion.div
                key={asset.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className={cn(
                  "group relative aspect-square rounded-2xl overflow-hidden cursor-pointer border-2 transition-all",
                  selectedIds.includes(asset.id)
                    ? "border-primary ring-4 ring-primary/20"
                    : "border-transparent hover:border-border"
                )}
                onClick={() => handleSelect(asset)}
              >
                {asset.type === "image" ? (
                  <img
                    src={asset.url}
                    alt={asset.alt_text || asset.filename}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center">
                    {asset.type === "video" ? (
                      <Video className="w-10 h-10 text-muted-foreground/40" />
                    ) : (
                      <File className="w-10 h-10 text-muted-foreground/40" />
                    )}
                  </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-xs font-bold text-white truncate">{asset.filename}</p>
                </div>

                {selectedIds.includes(asset.id) && (
                  <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                )}

                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      copyToClipboard(asset.url);
                    }}
                    className="p-2 rounded-lg bg-black/50 text-white hover:bg-black/70 transition-colors"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(asset.id);
                    }}
                    className="p-2 rounded-lg bg-red-500/80 text-white hover:bg-red-500 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="space-y-2">
          {assets.map((asset) => (
            <div
              key={asset.id}
              className={cn(
                "flex items-center gap-4 p-4 rounded-2xl border transition-all cursor-pointer",
                selectedIds.includes(asset.id)
                  ? "border-primary bg-primary/5"
                  : "border-border/50 hover:border-border"
              )}
              onClick={() => handleSelect(asset)}
            >
              <div className="w-16 h-16 rounded-xl overflow-hidden bg-muted flex-shrink-0">
                {asset.type === "image" ? (
                  <img src={asset.url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    {asset.type === "video" ? (
                      <Video className="w-6 h-6 text-muted-foreground/40" />
                    ) : (
                      <File className="w-6 h-6 text-muted-foreground/40" />
                    )}
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm truncate">{asset.filename}</p>
                <div className="flex items-center gap-3 mt-1">
                  <Badge variant="outline" className="text-[9px] uppercase">
                    {asset.type}
                  </Badge>
                  {asset.width && asset.height && (
                    <span className="text-[10px] text-muted-foreground">
                      {asset.width} x {asset.height}
                    </span>
                  )}
                  {asset.size_bytes && (
                    <span className="text-[10px] text-muted-foreground">
                      {formatFileSize(asset.size_bytes)}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    copyToClipboard(asset.url);
                  }}
                  className="h-9 w-9"
                >
                  <Copy className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  asChild
                  className="h-9 w-9"
                >
                  <a href={asset.url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(asset.id);
                  }}
                  className="h-9 w-9 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {multiple && selectedIds.length > 0 && (
        <div className="flex items-center justify-between p-4 bg-primary/10 border border-primary/20 rounded-2xl">
          <span className="text-sm font-bold text-primary">
            {selectedIds.length} selected
          </span>
          <Button onClick={handleConfirmSelection} className="bg-primary text-white">
            Insert Selected
          </Button>
        </div>
      )}
    </div>
  );
}
