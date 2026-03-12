import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { SectionHead, FieldGroup, Field } from "./editor-layout";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/admin/theme-wrapper";

interface TabGeneralProps {
    form: any;
    setForm: (form: any) => void;
}

export function TabGeneral({ form, setForm }: TabGeneralProps) {
    const { theme } = useTheme();
    const isDark = theme === "dark";

    return (
        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
            <SectionHead
                title="General Information"
                desc="Defined branding and detailed storytelling for your customers."
            />
            <FieldGroup cols={2}>
                <Field label="Product Name" sub="Primary display title">
                    <Input
                        value={form.name || ""}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        placeholder="e.g. Samsung Galaxy S24 Ultra"
                        className={cn(
                            "h-11 rounded-xl transition-all font-sans text-sm",
                            isDark
                                ? "bg-[#111827] border-[#1f2937] text-white focus:ring-[#3b82f6]"
                                : "bg-white border-[#e2e8f0] text-[#0f172a] focus:ring-[#3b82f6]"
                        )}
                    />
                </Field>
                <Field label="Short Name" sub="Cleaner label for badges/cards">
                    <Input
                        value={form.short_name || ""}
                        onChange={(e) => setForm({ ...form, short_name: e.target.value })}
                        placeholder="e.g. S24 Ultra"
                        className={cn(
                            "h-11 rounded-xl transition-all font-sans text-sm",
                            isDark
                                ? "bg-[#111827] border-[#1f2937] text-white focus:ring-[#3b82f6]"
                                : "bg-white border-[#e2e8f0] text-[#0f172a] focus:ring-[#3b82f6]"
                        )}
                    />
                </Field>
            </FieldGroup>

            <FieldGroup>
                <Field label="Subtitle" sub="Highlight a key selling point">
                    <Input
                        value={form.subtitle || ""}
                        onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                        placeholder="e.g. Epic, just like that."
                        className={cn(
                            "h-11 rounded-xl transition-all font-sans text-sm",
                            isDark
                                ? "bg-[#111827] border-[#1f2937] text-white focus:ring-[#3b82f6]"
                                : "bg-white border-[#e2e8f0] text-[#0f172a] focus:ring-[#3b82f6]"
                        )}
                    />
                </Field>
            </FieldGroup>

            <FieldGroup>
                <Field label="Full Description" sub="Detailed features and specs list">
                    <Textarea
                        value={form.description || ""}
                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                        rows={8}
                        placeholder="Portray the product experience in detail..."
                        className={cn(
                            "rounded-2xl transition-all font-sans text-[15px] font-medium tracking-tight p-5 leading-relaxed min-h-[160px]",
                            isDark
                                ? "bg-[#111827] border-[#1f2937] text-white focus:ring-[#3b82f6] focus:border-[#3b82f6]"
                                : "bg-white border-[#e2e8f0] text-[#0f172a] focus:ring-[#3b82f6] focus:border-[#3b82f6]"
                        )}
                    />
                </Field>
            </FieldGroup>

            <div className={cn(
                "flex items-center gap-4 p-5 rounded-2xl border transition-all",
                isDark ? "bg-[#1e293b]/50 border-[#1f2937]" : "bg-slate-50 border-slate-100"
            )}>
                <Switch
                    checked={form.is_active}
                    onCheckedChange={(checked) => setForm({ ...form, is_active: checked })}
                    className="data-[state=checked]:bg-[#3b82f6]"
                />
                <div className="flex flex-col">
                    <Label className="text-[13px] font-bold text-[#0f172a] dark:text-[#f1f5f9]">Public Visibility</Label>
                    <span className="text-[11px] text-[#64748b] dark:text-[#94a3b8] font-medium mt-0.5">
                        {form.is_active ? "This item is active and visible to all customers." : "Hidden from search and catalog."}
                    </span>
                </div>
            </div>
        </div>
    );
}

interface TabSEOProps {
    form: any;
    setForm: (form: any) => void;
}

export function TabSEO({ form, setForm }: TabSEOProps) {
    const { theme } = useTheme();
    const isDark = theme === "dark";
    const metaTitle = form.seo_title || form.name || "";
    const metaDesc = form.seo_description || form.description?.substring(0, 160) || "";

    return (
        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
            <SectionHead
                title="Search Engine Optimization"
                desc="Manage how your product appears on search engines and social platforms."
            />

            <FieldGroup>
                <Field
                    label="Meta Title"
                    sub={`${metaTitle.length}/60 characters - Optimal length for SERPs`}
                >
                    <Input
                        value={form.seo_title || ""}
                        onChange={(e) => setForm({ ...form, seo_title: e.target.value })}
                        placeholder="SEO Title Control"
                        className={cn(
                            "h-12 px-5 rounded-xl transition-all font-sans text-[15px] font-medium tracking-tight",
                            isDark
                                ? "bg-[#111827] border-[#1f2937] text-white focus:ring-[#3b82f6] focus:border-[#3b82f6]"
                                : "bg-white border-[#e2e8f0] text-[#0f172a] focus:ring-[#3b82f6] focus:border-[#3b82f6]"
                        )}
                    />
                    <div className="h-1 w-full bg-[#f1f5f9] dark:bg-[#1e293b] rounded-full mt-3 overflow-hidden">
                        <div
                            className={cn(
                                "h-full transition-all duration-300",
                                metaTitle.length > 60 ? "bg-red-500" : metaTitle.length > 50 ? "bg-amber-500" : "bg-[#3b82f6]"
                            )}
                            style={{ width: `${Math.min(100, (metaTitle.length / 60) * 100)}%` }}
                        />
                    </div>
                </Field>
            </FieldGroup>

            <FieldGroup>
                <Field
                    label="Meta Description"
                    sub={`${metaDesc.length}/160 characters - Brief summary for Google`}
                >
                    <Textarea
                        value={form.seo_description || ""}
                        onChange={(e) => setForm({ ...form, seo_description: e.target.value })}
                        rows={4}
                        placeholder="Custom Meta Description..."
                        className={cn(
                            "rounded-2xl transition-all font-sans text-[14px] font-medium tracking-tight p-5 leading-relaxed min-h-[120px]",
                            isDark
                                ? "bg-[#111827] border-[#1f2937] text-white focus:ring-[#3b82f6] focus:border-[#3b82f6]"
                                : "bg-white border-[#e2e8f0] text-[#0f172a] focus:ring-[#3b82f6] focus:border-[#3b82f6]"
                        )}
                    />
                    <div className="h-1 w-full bg-[#f1f5f9] dark:bg-[#1e293b] rounded-full mt-3 overflow-hidden">
                        <div
                            className={cn(
                                "h-full transition-all duration-300",
                                metaDesc.length > 160 ? "bg-red-500" : metaDesc.length > 140 ? "bg-amber-500" : "bg-[#3b82f6]"
                            )}
                            style={{ width: `${Math.min(100, (metaDesc.length / 160) * 100)}%` }}
                        />
                    </div>
                </Field>
            </FieldGroup>

            <div className={cn(
                "p-8 rounded-[2rem] border shadow-sm space-y-3",
                isDark ? "bg-[#0f172a] border-[#1e293b]" : "bg-white border-slate-100"
            )}>
                <div className="text-[10px] font-black uppercase tracking-widest text-[#64748b] dark:text-[#94a3b8] mb-4 font-mono">Real-time Search Preview</div>
                <div className="text-[#1a0dab] dark:text-[#8ab4f8] text-xl font-medium hover:underline cursor-pointer truncate font-sans">
                    {metaTitle || "Product metadata title"}
                </div>
                <div className="text-[#006621] dark:text-[#34a853] text-[14px] truncate font-sans">
                    https://trovestak.com/products/{form.slug || "product-slug"}
                </div>
                <div className="text-[#545454] dark:text-[#bdc1c6] text-[15px] line-clamp-2 leading-relaxed font-sans">
                    {metaDesc || "Enter a meta description to see how it looks in search results. A good description increases click-through rate."}
                </div>
            </div>
        </div>
    );
}
