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
import {
  GripVertical,
  ChevronDown,
  ChevronRight,
  Plus,
  Trash2,
  Edit3,
  ExternalLink,
  FileText,
  Folder,
  Package,
  X,
  Link as LinkIcon,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export interface MegaColumnItem {
  category: string;
  links: { name: string; href: string }[];
}

export interface MegaColumn {
  title: string;
  items: MegaColumnItem[];
  footer?: { name: string; href: string };
}

export interface FeaturedConfig {
  image: string;
  badge?: string;
  title: string;
  description: string;
  href: string;
  cta: string;
}

export interface MenuItem {
  id: string;
  label: string;
  url: string;
  type: "page" | "category" | "product" | "custom";
  target?: string;
  children?: MenuItem[];
  layout?: "simple" | "mega";
  columns?: MegaColumn[];
  featured?: FeaturedConfig;
}

interface MenuBuilderProps {
  items: MenuItem[];
  onChange: (items: MenuItem[]) => void;
  pages?: { id: string; title: string; slug: string }[];
  categories?: { id: string; name: string; slug: string }[];
}

export function MenuBuilder({ items, onChange, pages = [], categories = [] }: MenuBuilderProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<MenuItem>>({});
  const [showPreview, setShowPreview] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      if (over && active.id !== over.id) {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        onChange(arrayMove(items, oldIndex, newIndex));
      }
    },
    [items, onChange]
  );

  const addItem = () => {
    const newItem: MenuItem = {
      id: `item-${Date.now()}`,
      label: "New Menu Item",
      url: "/",
      type: "custom",
    };
    onChange([...items, newItem]);
    setEditingId(newItem.id);
    setEditForm(newItem);
  };

  const updateItem = (id: string, updates: Partial<MenuItem>) => {
    onChange(
      items.map((item) =>
        item.id === id ? { ...item, ...updates } : item
      )
    );
  };

  const deleteItem = (id: string) => {
    onChange(items.filter((item) => item.id !== id));
  };

  const addChildItem = (parentId: string) => {
    const newItem: MenuItem = {
      id: `item-${Date.now()}`,
      label: "New Sub-Item",
      url: "/",
      type: "custom",
    };

    onChange(
      items.map((item) =>
        item.id === parentId
          ? { ...item, children: [...(item.children || []), newItem] }
          : item
      )
    );
  };

  const updateChildItem = (parentId: string, childId: string, updates: Partial<MenuItem>) => {
    onChange(
      items.map((item) =>
        item.id === parentId
          ? {
            ...item,
            children: item.children?.map((child) =>
              child.id === childId ? { ...child, ...updates } : child
            ),
          }
          : item
      )
    );
  };

  const deleteChildItem = (parentId: string, childId: string) => {
    onChange(
      items.map((item) =>
        item.id === parentId
          ? {
            ...item,
            children: item.children?.filter((child) => child.id !== childId),
          }
          : item
      )
    );
  };

  const getTypeIcon = (type: MenuItem["type"]) => {
    switch (type) {
      case "page":
        return FileText;
      case "category":
        return Folder;
      case "product":
        return Package;
      default:
        return LinkIcon;
    }
  };

  const duplicateItem = (item: MenuItem) => {
    const newItem = {
      ...item,
      id: `item-${Date.now()}`,
      label: `${item.label} (Copy)`
    };
    onChange([...items, newItem]);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-black text-lg">Menu Structure</h3>
          <p className="text-sm text-muted-foreground">
            Drag items to reorder. Click to edit.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowPreview(!showPreview)}
            className={cn("gap-2 rounded-xl", showPreview && "bg-primary text-white border-primary")}
          >
            {showPreview ? <X className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {showPreview ? "Close Preview" : "Live Preview"}
          </Button>
          <Button onClick={addItem} className="gap-2 rounded-xl">
            <Plus className="w-4 h-4" /> Add Item
          </Button>
        </div>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            <AnimatePresence>
              {items.map((item) => (
                <SortableMenuItem
                  key={item.id}
                  item={item}
                  editingId={editingId}
                  setEditingId={setEditingId}
                  editForm={editForm}
                  setEditForm={setEditForm}
                  onUpdate={updateItem}
                  onDelete={deleteItem}
                  onAddChild={addChildItem}
                  onUpdateChild={updateChildItem}
                  onDeleteChild={deleteChildItem}
                  pages={pages}
                  categories={categories}
                  getTypeIcon={getTypeIcon}
                  onDuplicate={duplicateItem}
                />
              ))}
            </AnimatePresence>
          </div>
        </SortableContext>
      </DndContext>

      {items.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-border/50 rounded-[2rem]">
          <div className="w-16 h-16 rounded-2xl bg-muted/30 flex items-center justify-center mb-4">
            <Folder className="w-8 h-8 text-muted-foreground/30" />
          </div>
          <p className="font-bold text-muted-foreground mb-4">No menu items yet</p>
          <Button onClick={addItem} variant="outline" className="gap-2">
            <Plus className="w-4 h-4" /> Add First Item
          </Button>
        </div>
      )}

      {/* Live Preview Display */}
      <AnimatePresence>
        {showPreview && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-[#f8f8f8] dark:bg-[#050505] rounded-[2.5rem] border border-border/50 p-10 mt-8 relative shadow-2xl">
              <div className="flex items-center gap-3 mb-10">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground">Actual Rendering Preview</span>
              </div>

              <div className="flex items-center gap-10">
                {items.map((item) => (
                  <div key={item.id} className="group relative">
                    <div className="flex items-center gap-1.5 cursor-default">
                      <span className="text-sm font-black uppercase tracking-widest text-foreground/60 hover:text-primary transition-colors">{item.label}</span>
                      {item.layout === "mega" && <ChevronDown className="w-3 h-3 text-muted-foreground/40 group-hover:text-primary transition-colors" />}
                    </div>

                    {item.layout === "mega" && (
                      <div className="absolute top-full left-1/2 -translate-x-1/2 pt-6 opacity-0 translate-y-2 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all duration-300 z-50">
                        <div className="w-[800px] bg-white dark:bg-[#0c0c0c] rounded-[2.5rem] shadow-2xl border border-black/5 dark:border-white/5 p-10 grid grid-cols-4 gap-10">
                          {item.columns?.map((col, idx) => (
                            <div key={idx} className="space-y-6">
                              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">{col.title}</h4>
                              <div className="space-y-6">
                                {col.items.map((group, gIdx) => (
                                  <div key={gIdx} className="space-y-2.5">
                                    <h5 className="text-[9px] font-black uppercase tracking-widest text-foreground/40">{group.category}</h5>
                                    <ul className="space-y-2">
                                      {group.links.map((link, lIdx) => (
                                        <li key={lIdx}>
                                          <a href={link.href} className="text-sm font-bold text-foreground/60 hover:text-primary transition-colors">{link.name}</a>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                          {item.featured && (
                            <div className="col-span-1 rounded-3xl overflow-hidden relative group/feat aspect-[4/5] bg-muted/20">
                              <img src={item.featured.image} alt="Featured" className="w-full h-full object-cover transition-transform duration-700 group-hover/feat:scale-110" />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-6 flex flex-col justify-end">
                                <Badge className="w-fit bg-primary text-white border-none mb-2 text-[8px] font-black uppercase">{item.featured.badge || "NEW"}</Badge>
                                <h4 className="text-lg font-black text-white leading-tight mb-1">{item.featured.title}</h4>
                                <p className="text-[10px] text-white/60 font-medium mb-3">{item.featured.description}</p>
                                <div className="text-[9px] font-black text-white uppercase tracking-widest flex items-center gap-1.5">
                                  {item.featured.cta} <ChevronRight className="w-3 h-3" />
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface SortableMenuItemProps {
  item: MenuItem;
  editingId: string | null;
  setEditingId: (id: string | null) => void;
  editForm: Partial<MenuItem>;
  setEditForm: (form: Partial<MenuItem>) => void;
  onUpdate: (id: string, updates: Partial<MenuItem>) => void;
  onDelete: (id: string) => void;
  onAddChild: (parentId: string) => void;
  onUpdateChild: (parentId: string, childId: string, updates: Partial<MenuItem>) => void;
  onDeleteChild: (parentId: string, childId: string) => void;
  pages: { id: string; title: string; slug: string }[];
  categories: { id: string; name: string; slug: string }[];
  getTypeIcon: (type: MenuItem["type"]) => typeof FileText;
  onDuplicate: (item: MenuItem) => void;
}

function SortableMenuItem({
  item,
  editingId,
  setEditingId,
  editForm,
  setEditForm,
  onUpdate,
  onDelete,
  onAddChild,
  onUpdateChild,
  onDeleteChild,
  pages,
  categories,
  getTypeIcon,
}: SortableMenuItemProps) {
  const [expanded, setExpanded] = useState(true);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const Icon = getTypeIcon(item.type);
  const isEditing = editingId === item.id;

  const handleSaveEdit = () => {
    onUpdate(item.id, editForm);
    setEditingId(null);
    setEditForm({});
  };

  const toggleLayout = () => {
    const newLayout = editForm.layout === "mega" ? "simple" : "mega";
    setEditForm({
      ...editForm,
      layout: newLayout,
      columns: newLayout === "mega" ? (editForm.columns || [{ title: "Column 1", items: [] }]) : undefined,
      featured: newLayout === "mega" ? (editForm.featured || { image: "", title: "", description: "", href: "", cta: "" }) : undefined
    });
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={cn(
        "bg-card border border-border/50 rounded-2xl overflow-hidden",
        isDragging && "shadow-xl ring-2 ring-primary/20"
      )}
    >
      <div className="flex items-center gap-3 p-4">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-2 rounded-lg hover:bg-muted/50 transition-colors"
        >
          <GripVertical className="w-4 h-4 text-muted-foreground/50" />
        </button>

        <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center">
          <Icon className="w-4 h-4 text-muted-foreground" />
        </div>

        {isEditing ? (
          <div className="flex-1 space-y-3">
            <Input
              value={editForm.label || ""}
              onChange={(e) => setEditForm({ ...editForm, label: e.target.value })}
              placeholder="Label"
              className="h-9"
            />
            <Input
              value={editForm.url || ""}
              onChange={(e) => setEditForm({ ...editForm, url: e.target.value })}
              placeholder="URL"
              className="h-9"
            />
            <div className="flex flex-wrap gap-2">
              <select
                value={editForm.type || "custom"}
                onChange={(e) => setEditForm({ ...editForm, type: e.target.value as MenuItem["type"] })}
                className="h-9 px-3 rounded-lg bg-muted/30 border-none text-sm"
              >
                <option value="custom">Custom Link</option>
                <option value="page">Page</option>
                <option value="category">Category</option>
                <option value="product">Product</option>
              </select>
              <Button
                size="sm"
                variant={editForm.layout === "mega" ? "default" : "outline"}
                onClick={toggleLayout}
                className="rounded-lg gap-2"
              >
                <Package className="w-3.5 h-3.5" />
                Mega Menu
              </Button>
              <div className="flex-1" />
              <Button size="sm" onClick={handleSaveEdit} className="rounded-lg">
                Save
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setEditingId(null);
                  setEditForm({});
                }}
                className="rounded-lg"
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-bold text-sm truncate">{item.label}</p>
                {item.layout === "mega" && (
                  <Badge className="bg-primary/20 text-primary border-none text-[8px] h-4">MEGA</Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground truncate">{item.url}</p>
            </div>

            <div className="flex items-center gap-1">
              <Badge variant="outline" className="text-[9px] uppercase">
                {item.type}
              </Badge>

              {item.children && item.children.length > 0 && (
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="p-2 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  {expanded ? (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  )}
                </button>
              )}

              <button
                onClick={() => {
                  setEditingId(item.id);
                  setEditForm(item);
                }}
                className="p-2 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <Edit3 className="w-4 h-4 text-muted-foreground" />
              </button>

              <button
                onClick={() => onAddChild(item.id)}
                className="p-2 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <Plus className="w-4 h-4 text-muted-foreground" />
              </button>

              <button
                onClick={() => onDelete(item.id)}
                className="p-2 rounded-lg hover:bg-red-500/10 text-red-500 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </>
        )}
      </div>

      {expanded && item.children && item.children.length > 0 && item.layout !== "mega" && (
        <div className="border-t border-border/30 pl-8 pr-4 py-2 space-y-1 bg-muted/10">
          {item.children.map((child) => (
            <div
              key={child.id}
              className="flex items-center gap-3 p-3 rounded-xl bg-card hover:bg-muted/30 transition-colors group"
            >
              <div className="w-6 h-6 rounded-lg bg-muted/50 flex items-center justify-center">
                <Icon className="w-3 h-3 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{child.label}</p>
                <p className="text-xs text-muted-foreground truncate">{child.url}</p>
              </div>
              <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                <button
                  onClick={() => {
                    setEditingId(child.id);
                    setEditForm(child);
                  }}
                  className="p-1.5 rounded-lg hover:bg-muted"
                >
                  <Edit3 className="w-3 h-3 text-muted-foreground" />
                </button>
                <button
                  onClick={() => onDeleteChild(item.id, child.id)}
                  className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-500"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {isEditing && editForm.layout === "mega" && (
        <MegaMenuEditor
          editForm={editForm}
          setEditForm={setEditForm}
        />
      )}
    </motion.div>
  );
}

function MegaMenuEditor({ editForm, setEditForm }: {
  editForm: Partial<MenuItem>;
  setEditForm: (form: Partial<MenuItem>) => void;
}) {
  const addColumn = () => {
    const columns = [...(editForm.columns || [])];
    columns.push({ title: `Column ${columns.length + 1}`, items: [] });
    setEditForm({ ...editForm, columns });
  };

  const updateColumn = (index: number, updates: Partial<MegaColumn>) => {
    const columns = [...(editForm.columns || [])];
    columns[index] = { ...columns[index], ...updates };
    setEditForm({ ...editForm, columns });
  };

  const removeColumn = (index: number) => {
    const columns = (editForm.columns || []).filter((_, i) => i !== index);
    setEditForm({ ...editForm, columns });
  };

  const addLinkGroup = (colIndex: number) => {
    const columns = [...(editForm.columns || [])];
    columns[colIndex].items.push({ category: "New Group", links: [] });
    setEditForm({ ...editForm, columns });
  };

  const updateLinkGroup = (colIndex: number, groupIndex: number, category: string) => {
    const columns = [...(editForm.columns || [])];
    columns[colIndex].items[groupIndex].category = category;
    setEditForm({ ...editForm, columns });
  };

  const removeLinkGroup = (colIndex: number, groupIndex: number) => {
    const columns = [...(editForm.columns || [])];
    columns[colIndex].items = columns[colIndex].items.filter((_, i) => i !== groupIndex);
    setEditForm({ ...editForm, columns });
  };

  const addLink = (colIndex: number, groupIndex: number) => {
    const columns = [...(editForm.columns || [])];
    columns[colIndex].items[groupIndex].links.push({ name: "New Link", href: "/" });
    setEditForm({ ...editForm, columns });
  };

  const updateLink = (colIndex: number, groupIndex: number, linkIndex: number, updates: { name?: string; href?: string }) => {
    const columns = [...(editForm.columns || [])];
    columns[colIndex].items[groupIndex].links[linkIndex] = {
      ...columns[colIndex].items[groupIndex].links[linkIndex],
      ...updates
    };
    setEditForm({ ...editForm, columns });
  };

  const removeLink = (colIndex: number, groupIndex: number, linkIndex: number) => {
    const columns = [...(editForm.columns || [])];
    columns[colIndex].items[groupIndex].links = columns[colIndex].items[groupIndex].links.filter((_, i) => i !== linkIndex);
    setEditForm({ ...editForm, columns });
  };

  return (
    <div className="p-6 bg-muted/20 border-t border-border/50 animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="flex items-center justify-between mb-6">
        <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Columns & Content</h4>
        <Button size="sm" variant="outline" onClick={addColumn} className="h-7 text-[10px] rounded-lg gap-1.5 uppercase tracking-wider font-bold">
          <Plus className="w-3 h-3" /> Add Column
        </Button>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
        {(editForm.columns || []).map((column, colIdx) => (
          <div key={colIdx} className="min-w-[280px] bg-card border border-border/50 rounded-2xl p-4 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <Input
                value={column.title}
                onChange={(e) => updateColumn(colIdx, { title: e.target.value })}
                placeholder="Column Title"
                className="h-8 text-xs font-bold bg-muted/30 border-none"
              />
              <button
                onClick={() => removeColumn(colIdx)}
                className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-500 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-4">
              {column.items.map((group, groupIdx) => (
                <div key={groupIdx} className="bg-muted/20 rounded-xl p-3 space-y-2 border border-border/50">
                  <div className="flex items-center justify-between gap-2">
                    <Input
                      value={group.category}
                      onChange={(e) => updateLinkGroup(colIdx, groupIdx, e.target.value)}
                      placeholder="Group Category"
                      className="h-7 text-[10px] font-bold bg-transparent border-none p-0 focus-visible:ring-0"
                    />
                    <button onClick={() => removeLinkGroup(colIdx, groupIdx)} className="text-muted-foreground hover:text-red-500 transition-colors">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    {group.links.map((link, linkIdx) => (
                      <div key={linkIdx} className="flex gap-1.5">
                        <Input
                          value={link.name}
                          onChange={(e) => updateLink(colIdx, groupIdx, linkIdx, { name: e.target.value })}
                          placeholder="Link Name"
                          className="h-7 text-[10px] bg-card border-border/30"
                        />
                        <Input
                          value={link.href}
                          onChange={(e) => updateLink(colIdx, groupIdx, linkIdx, { href: e.target.value })}
                          placeholder="Href"
                          className="h-7 text-[10px] bg-card border-border/30"
                        />
                        <button onClick={() => removeLink(colIdx, groupIdx, linkIdx)} className="p-1 text-muted-foreground hover:text-red-500">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => addLink(colIdx, groupIdx)}
                      className="w-full h-7 border border-dashed border-border/50 rounded-lg text-[9px] font-bold text-muted-foreground hover:bg-muted/50 transition-colors flex items-center justify-center gap-1"
                    >
                      <Plus className="w-2.5 h-2.5" /> Add Link
                    </button>
                  </div>
                </div>
              ))}
              <button
                onClick={() => addLinkGroup(colIdx)}
                className="w-full h-8 border border-dashed border-border/50 rounded-xl text-[10px] font-bold text-muted-foreground hover:bg-muted/50 transition-colors flex items-center justify-center gap-1.5"
              >
                <Plus className="w-3 h-3" /> New Link Group
              </button>
            </div>

            <div className="pt-2 border-t border-border/30">
              <p className="text-[9px] font-bold text-muted-foreground uppercase mb-2">Column Footer</p>
              <div className="grid gap-1.5">
                <Input
                  value={column.footer?.name || ""}
                  onChange={(e) => updateColumn(colIdx, { footer: { name: e.target.value, href: column.footer?.href || "" } })}
                  placeholder="Footer Label"
                  className="h-7 text-[10px] bg-muted/30 border-none"
                />
                <Input
                  value={column.footer?.href || ""}
                  onChange={(e) => updateColumn(colIdx, { footer: { name: column.footer?.name || "", href: e.target.value } })}
                  placeholder="Footer URL"
                  className="h-7 text-[10px] bg-muted/30 border-none"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 border-t border-border/50 pt-8">
        <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-4">Featured Promotion</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="space-y-3">
            <p className="text-[10px] font-bold text-muted-foreground uppercase">Promoted Node Content</p>
            <Input
              value={editForm.featured?.title || ""}
              onChange={(e) => setEditForm({ ...editForm, featured: { ...(editForm.featured as FeaturedConfig), title: e.target.value } })}
              placeholder="Title (e.g. iPhone 16 Pro)"
              className="h-9 text-xs"
            />
            <Input
              value={editForm.featured?.description || ""}
              onChange={(e) => setEditForm({ ...editForm, featured: { ...(editForm.featured as FeaturedConfig), description: e.target.value } })}
              placeholder="Description (e.g. Available Now)"
              className="h-9 text-xs"
            />
            <div className="flex gap-2">
              <Input
                value={editForm.featured?.badge || ""}
                onChange={(e) => setEditForm({ ...editForm, featured: { ...(editForm.featured as FeaturedConfig), badge: e.target.value } })}
                placeholder="Badge (e.g. NEW)"
                className="h-9 text-xs"
              />
              <Input
                value={editForm.featured?.cta || ""}
                onChange={(e) => setEditForm({ ...editForm, featured: { ...(editForm.featured as FeaturedConfig), cta: e.target.value } })}
                placeholder="CTA (e.g. Shop Now)"
                className="h-9 text-xs"
              />
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-[10px] font-bold text-muted-foreground uppercase">Destination & Asset</p>
            <Input
              value={editForm.featured?.href || ""}
              onChange={(e) => setEditForm({ ...editForm, featured: { ...(editForm.featured as FeaturedConfig), href: e.target.value } })}
              placeholder="Target URL (/product/...)"
              className="h-9 text-xs"
            />
            <Input
              value={editForm.featured?.image || ""}
              onChange={(e) => setEditForm({ ...editForm, featured: { ...(editForm.featured as FeaturedConfig), image: e.target.value } })}
              placeholder="Image URL (Unsplash or Media Library)"
              className="h-9 text-xs"
            />
          </div>

          <div className="flex items-center justify-center p-4 bg-muted/30 rounded-2xl border border-dashed border-border/50">
            {editForm.featured?.image ? (
              <div className="relative group overflow-hidden rounded-xl aspect-square w-full max-w-[120px]">
                <img src={editForm.featured.image} alt="Preview" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Badge className="bg-primary hover:bg-primary-hover">Preview</Badge>
                </div>
              </div>
            ) : (
              <p className="text-[10px] font-medium text-muted-foreground">Image Preview</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
