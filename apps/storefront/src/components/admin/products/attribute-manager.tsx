"use client";

import { useState } from "react";
import { 
  Plus, 
  Edit2, 
  Trash2, 
  ChevronRight, 
  ChevronDown,
  Search,
  Loader2,
  GripVertical,
  Palette,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useAttributeGroups, useAttributeGroupMutations } from "@/hooks/useAttributeGroups";
import type { ProductAttributeGroup, ProductAttributeTerm } from "@/types/product";

const groupSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().optional(),
  type: z.enum(["select", "multiselect", "text", "color", "boolean"]).default("select"),
  display_type: z.enum(["dropdown", "radio", "checkbox", "text"]).default("dropdown"),
});

const termSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().optional(),
  value: z.string().optional(), // For color type
});

type GroupFormData = z.infer<typeof groupSchema>;
type TermFormData = z.infer<typeof termSchema>;

export function AttributeManager() {
  const { groups, loading, refetch } = useAttributeGroups();
  const { createGroup, updateGroup, deleteGroup, createTerm, updateTerm, deleteTerm, loading: mutationLoading } = useAttributeGroupMutations();

  const [search, setSearch] = useState("");
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [termDialogOpen, setTermDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<ProductAttributeGroup | null>(null);
  const [editingTerm, setEditingTerm] = useState<{ term?: ProductAttributeTerm; groupId: string } | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const { register: registerGroup, handleSubmit: handleGroupSubmit, reset: resetGroup, setValue: setGroupValue, watch: watchGroup } = useForm<GroupFormData>({
    resolver: zodResolver(groupSchema),
    defaultValues: { type: "select", display_type: "dropdown" },
  });

  const { register: registerTerm, handleSubmit: handleTermSubmit, reset: resetTerm, setValue: setTermValue } = useForm<TermFormData>({
    resolver: zodResolver(termSchema),
  });

  // Filter by search
  const filteredGroups = groups.filter(group => 
    group.name.toLowerCase().includes(search.toLowerCase()) ||
    group.slug?.toLowerCase().includes(search.toLowerCase())
  );

  // Toggle group expand
  const toggleGroupExpand = (id: string) => {
    const newSet = new Set(expandedGroups);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setExpandedGroups(newSet);
  };

  // Group dialog
  const handleOpenGroupDialog = (group?: ProductAttributeGroup) => {
    if (group) {
      setEditingGroup(group);
      resetGroup({
        name: group.name,
        slug: group.slug,
        type: group.type,
        display_type: group.display_type,
      });
    } else {
      setEditingGroup(null);
      resetGroup({ name: "", slug: "", type: "select", display_type: "dropdown" });
    }
    setGroupDialogOpen(true);
  };

  const onSubmitGroup = async (data: GroupFormData) => {
    const result = editingGroup
      ? await updateGroup(editingGroup.id, data)
      : await createGroup(data);

    if (!result.error) {
      setGroupDialogOpen(false);
      refetch();
    }
  };

  // Term dialog
  const handleOpenTermDialog = (groupId: string, term?: ProductAttributeTerm) => {
    if (term) {
      setEditingTerm({ term, groupId });
      resetTerm({ name: term.name, slug: term.slug, value: term.value });
    } else {
      setEditingTerm({ groupId });
      resetTerm({ name: "", slug: "", value: "" });
    }
    setTermDialogOpen(true);
  };

  const onSubmitTerm = async (data: TermFormData) => {
    if (!editingTerm) return;

    const result = editingTerm.term
      ? await updateTerm(editingTerm.term.id, data)
      : await createTerm(editingTerm.groupId, data);

    if (!result.error) {
      setTermDialogOpen(false);
      refetch();
    }
  };

  // Delete group
  const handleDeleteGroup = async (id: string) => {
    if (confirm("Delete this attribute group and all its values?")) {
      await deleteGroup(id);
      refetch();
    }
  };

  // Delete term
  const handleDeleteTerm = async (termId: string) => {
    await deleteTerm(termId);
    refetch();
  };

  // Get type icon
  const getTypeIcon = (type: string) => {
    switch (type) {
      case "color": return <Palette className="w-4 h-4" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#86868B]" />
          <Input 
            placeholder="Search attributes..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-white border-[#E5E5E7]"
          />
        </div>
        <Dialog open={groupDialogOpen} onOpenChange={setGroupDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenGroupDialog()}>
              <Plus className="w-4 h-4 mr-1" />
              Add Attribute Group
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleGroupSubmit(onSubmitGroup)}>
              <DialogHeader>
                <DialogTitle>
                  {editingGroup ? "Edit Attribute" : "New Attribute Group"}
                </DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input 
                    id="name" 
                    {...registerGroup("name")}
                    placeholder="e.g., Color, Size, Material"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="slug">Slug</Label>
                  <Input 
                    id="slug" 
                    {...registerGroup("slug")}
                    placeholder="e.g., color-size"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Type</Label>
                  <select 
                    {...registerGroup("type")}
                    className="flex h-10 w-full rounded-md border border-[#E5E5E7] bg-white px-3 py-2 text-sm"
                    value={watchGroup("type")}
                    onChange={(e) => setGroupValue("type", e.target.value as any)}
                  >
                    <option value="select">Select</option>
                    <option value="multiselect">Multi-select</option>
                    <option value="text">Text</option>
                    <option value="color">Color</option>
                    <option value="boolean">Yes/No</option>
                  </select>
                </div>
                <div className="grid gap-2">
                  <Label>Display Type</Label>
                  <select 
                    {...registerGroup("display_type")}
                    className="flex h-10 w-full rounded-md border border-[#E5E5E7] bg-white px-3 py-2 text-sm"
                    value={watchGroup("display_type")}
                    onChange={(e) => setGroupValue("display_type", e.target.value as any)}
                  >
                    <option value="dropdown">Dropdown</option>
                    <option value="radio">Radio Buttons</option>
                    <option value="checkbox">Checkboxes</option>
                    <option value="text">Text Field</option>
                  </select>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setGroupDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={mutationLoading}>
                  {mutationLoading && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
                  {editingGroup ? "Save" : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Groups List */}
      <div className="space-y-2">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-lg border border-[#E5E5E7] p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#F5F5F7] rounded" />
                <div className="space-y-2">
                  <div className="h-4 w-[150px] bg-[#F5F5F7] rounded" />
                  <div className="h-3 w-[100px] bg-[#F5F5F7] rounded" />
                </div>
              </div>
            </div>
          ))
        ) : filteredGroups.length === 0 ? (
          <div className="bg-white rounded-lg border border-[#E5E5E7] p-8 text-center">
            <p className="text-[#86868B] mb-4">No attributes found</p>
            <Button variant="outline" onClick={() => handleOpenGroupDialog()}>
              Create your first attribute
            </Button>
          </div>
        ) : (
          filteredGroups.map((group) => {
            const isExpanded = expandedGroups.has(group.id);
            const terms = group.terms || [];

            return (
              <div 
                key={group.id}
                className="bg-white rounded-lg border border-[#E5E5E7] overflow-hidden"
              >
                {/* Group Header */}
                <div 
                  className="flex items-center gap-3 p-4 cursor-pointer hover:bg-[#F5F5F7]"
                  onClick={() => toggleGroupExpand(group.id)}
                >
                  <GripVertical className="w-4 h-4 text-[#86868B]" />
                  <div className="flex items-center gap-2">
                    {getTypeIcon(group.type)}
                    <span className="font-medium">{group.name}</span>
                    <Badge variant="outline">{group.type}</Badge>
                  </div>
                  <div className="flex-1" />
                  <span className="text-sm text-[#86868B]">
                    {terms.length} values
                  </span>
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </div>

                {/* Terms (expanded) */}
                {isExpanded && (
                  <div className="border-t border-[#E5E5E7] p-4 bg-[#FDFDFF]">
                    <div className="flex flex-wrap gap-2 mb-4">
                      {terms.map((term) => (
                        <div 
                          key={term.id}
                          className="flex items-center gap-2 px-3 py-1.5 bg-white border border-[#E5E5E7] rounded-full"
                        >
                          {group.type === "color" && term.value && (
                            <span 
                              className="w-4 h-4 rounded-full border border-[#E5E5E7]"
                              style={{ backgroundColor: term.value }}
                            />
                          )}
                          <span className="text-sm">{term.name}</span>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleOpenTermDialog(group.id, term); }}
                            className="text-[#86868B] hover:text-[#0071E3]"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteTerm(term.id); }}
                            className="text-[#86868B] hover:text-[#FF3B30]"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-full"
                        onClick={(e) => { e.stopPropagation(); handleOpenTermDialog(group.id); }}
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Add Value
                      </Button>
                    </div>

                    {/* Group Actions */}
                    <div className="flex items-center gap-2 pt-2 border-t border-[#E5E5E7]">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenGroupDialog(group)}
                      >
                        <Edit2 className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-[#FF3B30]"
                        onClick={() => handleDeleteGroup(group.id)}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Term Dialog */}
      <Dialog open={termDialogOpen} onOpenChange={setTermDialogOpen}>
        <DialogContent>
          <form onSubmit={handleTermSubmit(onSubmitTerm)}>
            <DialogHeader>
              <DialogTitle>
                {editingTerm?.term ? "Edit Value" : "New Value"}
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="term-name">Name *</Label>
                <Input 
                  id="term-name" 
                  {...registerTerm("name")}
                  placeholder="e.g., Blue, Red, Large"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="term-slug">Slug</Label>
                <Input 
                  id="term-slug" 
                  {...registerTerm("slug")}
                  placeholder="e.g., blue-red"
                />
              </div>
              {watchGroup("type") === "color" && (
                <div className="grid gap-2">
                  <Label htmlFor="term-value">Color Value</Label>
                  <div className="flex items-center gap-2">
                    <input 
                      type="color"
                      {...registerTerm("value")}
                      className="w-10 h-10 rounded border border-[#E5E5E7]"
                    />
                    <Input 
                      {...registerTerm("value")}
                      placeholder="#000000"
                      className="flex-1"
                    />
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setTermDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={mutationLoading}>
                {mutationLoading && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
                {editingTerm?.term ? "Save" : "Add"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
