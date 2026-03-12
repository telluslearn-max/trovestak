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
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

interface SortableItemProps {
  id: string;
  children: React.ReactNode;
  onDragEnd?: (id: string, newPosition: number) => void;
}

export function SortableItem({ id, children, onDragEnd }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-2">
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-1 hover:bg-[#E5E5E7] rounded"
        onClick={(e) => e.preventDefault()}
      >
        <GripVertical className="w-4 h-4 text-[#86868B]" />
      </button>
      <div className="flex-1">{children}</div>
    </div>
  );
}

interface DragDropListProps {
  items: Array<{ id: string; position: number }>;
  onReorder: (items: Array<{ id: string; position: number }>) => void;
  renderItem: (item: { id: string; position: number }) => React.ReactNode;
}

export function DragDropList({ items, onReorder, renderItem }: DragDropListProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

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

  const handleDragStart = (event: { active: { id: string } }) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);

      const newItems = arrayMove(items, oldIndex, newIndex).map((item, index) => ({
        ...item,
        position: index,
      }));

      onReorder(newItems);
    }

    setActiveId(null);
  }, [items, onReorder]);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={items.map((item) => item.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-2">
          {items
            .sort((a, b) => a.position - b.position)
            .map((item) => (
              <SortableItem key={item.id} id={item.id}>
                {renderItem(item)}
              </SortableItem>
            ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

// Hook for managing reordering with position field
export function useReorder<T extends { id: string; position: number }>(
  initialItems: T[]
) {
  const [items, setItems] = useState(initialItems);

  const handleReorder = useCallback((newItems: T[]) => {
    setItems(newItems);
  }, []);

  const moveItem = useCallback((fromIndex: number, toIndex: number) => {
    setItems((prev) => {
      const newItems = arrayMove(prev, fromIndex, toIndex);
      return newItems.map((item, index) => ({
        ...item,
        position: index,
      }));
    });
  }, []);

  return {
    items,
    setItems,
    handleReorder,
    moveItem,
  };
}
