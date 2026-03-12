"use client";

import { useState, useEffect } from "react";
import { X, Upload, Cloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MediaLibrary } from "./media-library";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface MediaAsset {
  id: string;
  public_id: string;
  url: string;
  filename: string;
  alt_text: string | null;
  type: "image" | "video" | "document";
}

interface MediaPickerProps {
  open: boolean;
  onClose: () => void;
  onSelect: (assets: MediaAsset[]) => void;
  multiple?: boolean;
  title?: string;
}

export function MediaPicker({
  open,
  onClose,
  onSelect,
  multiple = false,
  title = "Select Media",
}: MediaPickerProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<"library" | "upload">("library");

  useEffect(() => {
    if (!open) {
      setSelectedIds([]);
      setActiveTab("library");
    }
  }, [open]);

  const handleSelect = (assets: MediaAsset[]) => {
    onSelect(assets);
    onClose();
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);

    try {
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
      const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "trovestak";

      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", uploadPreset);
        formData.append("folder", "trovestak");

        const response = await fetch(
          `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
          {
            method: "POST",
            body: formData,
          }
        );

        const data = await response.json();

        if (data.public_id) {
          const asset = {
            public_id: data.public_id,
            url: data.secure_url,
            filename: file.name,
            type: data.resource_type === "video" ? "video" : data.resource_type === "image" ? "image" : "document",
            width: data.width,
            height: data.height,
            size_bytes: data.bytes,
            folder: "trovestak",
          };

          const { data: inserted } = await supabase
            .from("media_assets")
            .insert({
              ...asset,
              uploaded_by: (await supabase.auth.getUser()).data.user?.id,
            })
            .select()
            .single();

          if (inserted && !multiple) {
            onSelect([inserted]);
            onClose();
            return;
          }
        }
      }

      setActiveTab("library");
    } catch (error) {
      console.error("Upload failed:", error);
      alert("Upload failed. Please try again.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[85vh] overflow-hidden flex flex-col p-0 gap-0">
        <DialogHeader className="p-6 border-b border-border/30">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-black">{title}</DialogTitle>
            <Button variant="ghost" size="icon" onClick={onClose} className="h-10 w-10 rounded-xl">
              <X className="w-5 h-5" />
            </Button>
          </div>

          <div className="flex gap-2 mt-4">
            <Button
              variant={activeTab === "library" ? "default" : "outline"}
              onClick={() => setActiveTab("library")}
              className={cn("rounded-xl", activeTab === "library" && "bg-primary text-white")}
            >
              Media Library
            </Button>
            <Button
              variant={activeTab === "upload" ? "default" : "outline"}
              onClick={() => setActiveTab("upload")}
              className={cn("rounded-xl", activeTab === "upload" && "bg-primary text-white")}
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload New
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-auto p-6">
          {activeTab === "library" ? (
            <MediaLibrary
              multiple={multiple}
              selectedIds={selectedIds}
              onSelectedChange={setSelectedIds}
              onSelect={handleSelect}
            />
          ) : (
            <div className="flex flex-col items-center justify-center py-20">
              <label className="cursor-pointer group">
                <div className="w-40 h-40 rounded-[3rem] bg-muted/30 border-2 border-dashed border-border flex items-center justify-center group-hover:border-primary group-hover:bg-primary/5 transition-all">
                  <div className="text-center">
                    <Cloud className="w-12 h-12 text-muted-foreground/30 group-hover:text-primary transition-colors mx-auto mb-3" />
                    <p className="text-sm font-bold text-muted-foreground group-hover:text-primary transition-colors">
                      Drop files or click to upload
                    </p>
                  </div>
                </div>
                <input
                  type="file"
                  accept="image/*,video/*"
                  multiple={multiple}
                  onChange={handleUpload}
                  className="hidden"
                  disabled={uploading}
                />
              </label>

              {uploading && (
                <div className="mt-6 flex items-center gap-3">
                  <div className="w-5 h-5 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                  <span className="text-sm font-bold text-muted-foreground">Uploading...</span>
                </div>
              )}

              <p className="mt-6 text-xs text-muted-foreground text-center max-w-sm">
                Supported formats: JPG, PNG, GIF, WebP, MP4, WebM. Max file size: 100MB.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
