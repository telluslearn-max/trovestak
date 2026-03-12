import { ReactNode } from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface FieldProps {
  label: string;
  sub?: string;
  children: ReactNode;
  className?: string;
}

export function Field({ label, sub, children, className }: FieldProps) {
  return (
    <div className={cn("space-y-2.5", className)}>
      <div className="flex flex-col gap-1">
        <Label className="text-[12px] font-bold text-[#0f172a] dark:text-[#f8fafc] tracking-tight font-sans uppercase opacity-90">
          {label}
        </Label>
        {sub && (
          <span className="text-[11px] text-[#64748b] dark:text-[#94a3b8] font-medium leading-relaxed tracking-normal">
            {sub}
          </span>
        )}
      </div>
      <div className="relative group">
        {children}
      </div>
    </div>
  );
}

interface FieldGroupProps {
  children: ReactNode;
  cols?: 1 | 2 | 3 | 4;
  className?: string;
}

export function FieldGroup({ children, cols = 1, className }: FieldGroupProps) {
  const gridCols = {
    1: "grid-cols-1",
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-3",
    4: "grid-cols-1 md:grid-cols-4",
  };

  return (
    <div className={cn("grid gap-x-10 gap-y-12 mb-12", gridCols[cols], className)}>
      {children}
    </div>
  );
}

interface SectionHeadProps {
  title: string;
  desc?: string;
  className?: string;
}

export function SectionHead({ title, desc, className }: SectionHeadProps) {
  return (
    <div className={cn("mb-10 pb-5 border-b border-slate-100 dark:border-slate-800/60", className)}>
      <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-[#3b82f6] mb-2 font-mono">
        {title}
      </h3>
      {desc && (
        <p className="text-[14px] text-[#334155] dark:text-[#cbd5e1] font-semibold tracking-tight leading-relaxed">
          {desc}
        </p>
      )}
    </div>
  );
}
