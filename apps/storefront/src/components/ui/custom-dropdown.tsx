"use client";

import * as React from "react";
import { ChevronDown, FileText, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DropdownItem {
  id: string;
  label: string;
  badge?: string;
}

export interface DropdownGroup {
  id: string;
  label: string;
  items: DropdownItem[];
}

interface CustomDropdownProps {
  triggerLabel?: string;
  groups: DropdownGroup[];
  onSelect: (id: string) => void;
  align?: "start" | "end";
}

export function CustomDropdown({
  triggerLabel = "Template",
  groups,
  onSelect,
  align = "end",
}: CustomDropdownProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [expandedCategory, setExpandedCategory] = React.useState<string | null>(
    groups[0]?.id || null
  );
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Handle click outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Handle Escape key
  React.useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  const handleCategoryClick = (categoryId: string) => {
    setExpandedCategory(expandedCategory === categoryId ? null : categoryId);
  };

  const handleItemClick = (itemId: string) => {
    onSelect(itemId);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
      >
        {triggerLabel}
        <ChevronDown className={cn("w-4 h-4 transition-transform", isOpen && "rotate-180")} />
      </button>

      {/* Dropdown Content */}
      {isOpen && (
        <div
          className={cn(
            "absolute z-50 mt-1 min-w-[280px] rounded-lg border bg-white shadow-lg overflow-hidden",
            align === "end" ? "right-0" : "left-0"
          )}
        >
          <div className="py-1 max-h-[400px] overflow-y-auto">
            {groups.map((group) => (
              <div key={group.id} className="border-b last:border-b-0">
                {/* Category Header */}
                <button
                  type="button"
                  onClick={() => handleCategoryClick(group.id)}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-[#86868B] uppercase tracking-wider hover:bg-gray-50 transition-colors"
                >
                  <span>{group.label}</span>
                  <ChevronRight
                    className={cn(
                      "w-4 h-4 transition-transform duration-200",
                      expandedCategory === group.id && "rotate-90"
                    )}
                  />
                </button>

                {/* Category Items */}
                {expandedCategory === group.id && (
                  <div className="pb-1">
                    {group.items.map((item) => (
                      <button
                        type="button"
                        key={item.id}
                        onClick={() => handleItemClick(item.id)}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-[#1D1D1F] hover:bg-[#0071E3]/5 transition-colors text-left"
                      >
                        <FileText className="w-4 h-4 text-[#86868B]" />
                        <span className="flex-1">{item.label}</span>
                        {item.badge && (
                          <span className="text-xs bg-[#0071E3] text-white px-1.5 py-0.5 rounded">
                            {item.badge}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="border-t px-3 py-2 bg-gray-50">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                window.open("/admin/products/import", "_blank");
              }}
              className="text-sm text-[#0071E3] hover:underline"
            >
              More import options →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
