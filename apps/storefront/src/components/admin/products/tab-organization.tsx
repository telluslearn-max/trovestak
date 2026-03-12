import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectValue, SelectTrigger } from "@/components/ui/select";
import { SectionHead, FieldGroup, Field } from "./editor-layout";
import { useTheme } from "@/components/admin/theme-wrapper";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { getBrands } from "@/app/admin/actions";
import { Loader2 } from "lucide-react";
import { ProductBundlesPanel } from "./product-bundles-panel";

interface TabOrganizationProps {
    form: any;
    setForm: (form: any) => void;
}

const CATEGORIES = [
    { value: "mobile", label: "Mobile" },
    { value: "computing", label: "Computing" },
    { value: "audio", label: "Audio" },
    { value: "wearables", label: "Wearables" },
    { value: "gaming", label: "Gaming" },
    { value: "cameras", label: "Cameras" },
    { value: "smart-home", label: "Smart Home" },
];

const SUBCATEGORIES: Record<string, string[]> = {
    mobile: ["Flagship Phones", "Mid-Range Phones", "Budget Phones", "Tablets"],
    computing: ["Laptops", "Monitors", "Peripherals", "Networking"],
    audio: ["Headphones", "Earbuds", "Home Audio", "Speakers"],
    wearables: ["Smartwatches", "Fitness Trackers"],
    gaming: ["Consoles", "PC Gaming", "Accessories"],
    cameras: ["DSLR", "Mirrorless", "Drones", "Action Cameras"],
    "smart-home": ["TVs", "Appliances", "Lighting"],
};

export function TabOrganization({ form, setForm }: TabOrganizationProps) {
    const { theme } = useTheme();
    const isDark = theme === "dark";
    const [brands, setBrands] = useState<any[]>([]);
    const [loadingBrands, setLoadingBrands] = useState(false);

    useEffect(() => {
        const fetchBrands = async () => {
            setLoadingBrands(true);
            try {
                const data = await getBrands();
                setBrands(data || []);
            } catch (err) {
                console.error("Error fetching brands:", err);
                // Fallback to empty if table doesn't exist
                setBrands([]);
            } finally {
                setLoadingBrands(false);
            }
        };

        fetchBrands();
    }, []);

    return (
        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
            <SectionHead title="Store Architecture" desc="Precisely categorize this product within the store's global taxonomy." />

            <div className="mt-8 space-y-10">
                <FieldGroup cols={2}>
                    <Field label="Primary Category" sub="Base navigation layer">
                        <Select
                            value={form.nav_category || ""}
                            onValueChange={(v) => setForm({ ...form, nav_category: v, nav_subcategory: "" })}
                        >
                            <SelectTrigger className={cn(
                                "h-12 px-5 rounded-xl transition-all font-sans text-[15px] font-medium tracking-tight focus:ring-2 focus:ring-[#3b82f6] outline-none",
                                isDark
                                    ? "border-[#1f2937] bg-[#111827] text-white"
                                    : "border-[#e2e8f0] bg-white text-[#0f172a]"
                            )}>
                                <SelectValue placeholder="Select Category" />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl border-[#e2e8f0] dark:border-[#1f2937] bg-white dark:bg-[#111827] shadow-2xl">
                                {CATEGORIES.map(cat => (
                                    <SelectItem key={cat.value} value={cat.value} className="rounded-lg m-1">{cat.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </Field>

                    <Field label="Product Subcategory" sub="Granular grouping layer">
                        <Select
                            value={form.nav_subcategory || ""}
                            onValueChange={(v) => setForm({ ...form, nav_subcategory: v })}
                            disabled={!form.nav_category}
                        >
                            <SelectTrigger className={cn(
                                "h-12 px-5 rounded-xl transition-all font-sans text-[15px] font-medium tracking-tight focus:ring-2 focus:ring-[#3b82f6] outline-none",
                                isDark
                                    ? "border-[#1f2937] bg-[#111827] text-white"
                                    : "border-[#e2e8f0] bg-white text-[#0f172a]"
                            )}>
                                <SelectValue placeholder="Select Subcategory" />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl border-[#e2e8f0] dark:border-[#1f2937] bg-white dark:bg-[#111827] shadow-2xl">
                                {(SUBCATEGORIES[form.nav_category] || []).map(sub => (
                                    <SelectItem key={sub} value={sub} className="rounded-lg m-1">{sub}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </Field>
                </FieldGroup>

                <FieldGroup cols={2}>
                    <Field label="Brand / Manufacturer" sub="Select from brand registry">
                        <Select
                            value={form.brand_type || ""}
                            onValueChange={(v) => setForm({ ...form, brand_type: v })}
                        >
                            <SelectTrigger className={cn(
                                "h-12 px-5 rounded-xl transition-all font-sans text-[15px] font-medium tracking-tight focus:ring-2 focus:ring-[#3b82f6] outline-none",
                                isDark
                                    ? "border-[#1f2937] bg-[#111827] text-white"
                                    : "border-[#e2e8f0] bg-white text-[#0f172a]"
                            )}>
                                {loadingBrands ? (
                                    <div className="flex items-center gap-2">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span>Syncing...</span>
                                    </div>
                                ) : (
                                    <SelectValue placeholder="Select Brand" />
                                )}
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl border-[#e2e8f0] dark:border-[#1f2937] bg-white dark:bg-[#111827] shadow-2xl max-h-[300px]">
                                {brands.length > 0 ? (
                                    brands.map(brand => (
                                        <SelectItem key={brand.slug} value={brand.slug} className="rounded-lg m-1">
                                            {brand.name}
                                        </SelectItem>
                                    ))
                                ) : (
                                    <div className="p-4 text-center text-xs text-muted-foreground italic">
                                        No brands found. Register them in the Brands section.
                                    </div>
                                )}
                            </SelectContent>
                        </Select>
                    </Field>
                    <Field label="Catalog Collection" sub="Assignment to internal sets">
                        <Input
                            value={form.collection || ""}
                            onChange={(e) => setForm({ ...form, collection: e.target.value })}
                            placeholder="e.g. Galaxy S Series"
                            className={cn(
                                "h-12 px-5 rounded-xl transition-all font-sans text-[15px] font-medium tracking-tight focus:ring-2 focus:ring-[#3b82f6]",
                                isDark
                                    ? "bg-[#111827] border-[#1f2937] text-white"
                                    : "bg-white border-[#e2e8f0] text-[#0f172a]"
                            )}
                        />
                    </Field>
                </FieldGroup>

                <div className={cn(
                    "p-8 rounded-[2rem] border transition-all",
                    isDark ? "bg-[#1e293b]/30 border-[#1f2937]" : "bg-slate-50 border-slate-100"
                )}>
                    <Field label="Metadata Tags" sub="Comma-separated keywords for internal search optimization">
                        <Input
                            value={form.tags || ""}
                            onChange={(e) => setForm({ ...form, tags: e.target.value })}
                            placeholder="flagship, wireless, premium, titanium"
                            className={cn(
                                "h-12 px-5 rounded-xl transition-all font-mono text-[14px] font-medium tracking-tight focus:ring-2 focus:ring-[#3b82f6]",
                                isDark
                                    ? "bg-[#111827] border-[#334155] text-white"
                                    : "bg-white border-[#e2e8f0] text-[#0f172a]"
                            )}
                        />
                        <div className="flex flex-wrap gap-2 mt-4">
                            {(form.tags || "").split(",").map((tag: string, i: number) => tag.trim() && (
                                <span key={i} className="px-3 py-1 rounded-full bg-[#3b82f6]/10 text-[#3b82f6] text-[10px] font-black uppercase tracking-widest border border-[#3b82f6]/20">
                                    {tag.trim()}
                                </span>
                            ))}
                        </div>
                    </Field>
                </div>

                <div className="pt-6 border-t border-border">
                    <SectionHead
                        title="Bundle Affiliations"
                        desc="Associations within the Bundles & Kits system."
                    />
                    <div className="mt-8">
                        <ProductBundlesPanel
                            productId={form.id}
                            isDark={isDark}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

