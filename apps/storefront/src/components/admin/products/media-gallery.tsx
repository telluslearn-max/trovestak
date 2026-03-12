"use client";

import { useState, useCallback } from "react";
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import { 
  arrayMove, 
  SortableContext, 
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { 
  GripVertical, 
  X, 
  Image as ImageIcon, 
  Upload, 
  Star,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { ProductMedia } from "@/types/product";

interface MediaGalleryProps {
  productId: string;
  media: ProductMedia[];
  onReorder: (media: ProductMedia[]) => void;
  onUpload: (files: FileList) => Promise<void>;
  onDelete: (mediaId: string) => Promise<void>;
  onSetPrimary: (mediaId: string) => Promise<void>;
  uploading?: boolean;
}

interface SortableMediaItemProps {
  media: ProductMedia;
  onDelete: () => void;
  onSetPrimary: () => void;
}

function SortableMediaItem({ media, onDelete, onSetPrimary }: SortableMediaItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: media.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative group rounded-lg overflow-hidden border-2 transition-colors",
        media.is_primary ? "border-[#0071E3]" : "border-transparent hover:border-[#E5E5E7]"
      )}
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute top-2 left-2 z-10 p-1 bg-black/50 rounded cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <GripVertical className="w-4 h-4 text-white" />
      </div>

      {/* Position Badge */}
      <div className="absolute top-2 right-2 z-10 px-2 py-0.5 bg-black/50 rounded text-xs text-white">
        {media.position + 1}
      </div>

      {/* Primary Badge */}
      {media.is_primary && (
        <div className="absolute bottom-2 left-2 z-10">
          <span className="px-2 py-0.5 bg-[#0071E3] rounded text-xs text-white flex items-center gap-1">
            <Star className="w-3 h-3 fill-current" /> Primary
          </span>
        </div>
      )}

      {/* Image */}
      <div className="aspect-square bg-[#F5F5F7]">
        {media.url ? (
          <img
            src={media.url}
            alt={media.alt_text || "Product image"}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon className="w-8 h-8 text-[#86868B]" />
          </div>
        )}
      </div>

      {/* Actions Overlay */}
      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
        {!media.is_primary && (
          <Button
            size="sm"
            variant="secondary"
            onClick={onSetPrimary}
            className="bg-white text-black hover:bg-gray-100"
          >
            <Star className="w-4 h-4 mr-1" /> Primary
          </Button>
        )}
        <Button
          size="sm"
          variant="destructive"
          onClick={onDelete}
          className="bg-red-500 text-white hover:bg-red-600"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

export function MediaGallery({ 
  productId, 
  media, 
  onReorder, 
  onUpload,
  onDelete,
  onSetPrimary,
  uploading = false,
}: MediaGalleryProps) {
  const [dragActive, setDragActive] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = media.findIndex((item) => item.id === active.id);
      const newIndex = media.findIndex((item) => item.id === over.id);

      const newMedia = arrayMove(media, oldIndex, newIndex).map((item, index) => ({
        ...item,
        position: index,
      }));

      onReorder(newMedia);
    }

    setDragActive(false);
  }, [media, onReorder]);

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = () => {
    setDragActive(false);
  };

  const handleDrop = async (event: React.DragEvent) => {
    event.preventDefault();
    setDragActive(false);

    const files = event.dataTransfer.files;
    if (files.length > 0) {
      await onUpload(files);
    }
  };

  const handleFileInput = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      await onUpload(files);
    }
  };

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
          dragActive 
            ? "border-[#0071E3] bg-[#0071E3]/5" 
            : "border-[#E5E5E7] hover:border-[#0071E3]/50"
        )}
      >
        <Upload className="w-12 h-12 mx-auto text-[#86868B] mb-4" />
        <p className="text-[#86868B] mb-2">
          Drag and drop images here, or click to browse
        </p>
        <p className="text-xs text-[#86868B] mb-4">
          Supported: JPG, PNG, GIF, WebP • Max 5MB per file
        </p>
        <div className="flex items-center justify-center gap-2">
          <label>
            <Input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFileInput}
              disabled={uploading}
            />
            <Button 
              type="button" 
              variant="outline" 
              size="sm"
              disabled={uploading}
              className="cursor-pointer"
              asChild
            >
              <span>
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-1" />
                    Browse Files
                  </>
                )}
              </span>
            </Button>
          </label>
        </div>
      </div>

      {/* Gallery Grid */}
      {media.length > 0 && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={media.map((m) => m.id)}
            strategy={horizontalListSortingStrategy}
          >
            <div className="grid grid-cols-4 gap-4">
              {media
                .sort((a, b) => a.position - b.position)
                .map((item) => (
                  <SortableMediaItem
                    key={item.id}
                    media={item}
                    onDelete={() => onDelete(item.id)}
                    onSetPrimary={() => onSetPrimary(item.id)}
                  />
                ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Empty State */}
      {media.length === 0 && (
        <div className="text-center py-8 text-[#86868B]">
          <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>No images yet</p>
        </div>
      )}
    </div>
  );
}
