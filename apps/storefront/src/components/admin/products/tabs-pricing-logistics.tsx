import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SectionHead, FieldGroup, Field } from "./editor-layout";
import { useTheme } from "@/components/admin/theme-wrapper";
import { cn } from "@/lib/utils";

interface TabPricingProps {
    priceForm: any;
    setPriceForm: (form: any) => void;
}

export function TabPricing({ priceForm, setPriceForm }: TabPricingProps) {
    const { theme } = useTheme();
    const isDark = theme === "dark";

    const calculateFinalPrice = () => {
        const discount = priceForm.sell_price * (priceForm.discount_percent / 100);
        return priceForm.sell_price - discount;
    };

    return (
        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
            <SectionHead title="Pricing Strategy" desc="Define your margins and customer-facing price points." />
            <FieldGroup cols={2}>
                <Field label="Cost Price" sub="Your acquisition cost (KES)">
                    <Input
                        type="number"
                        value={priceForm.cost_price || 0}
                        onChange={(e) => setPriceForm({ ...priceForm, cost_price: parseInt(e.target.value) || 0 })}
                        className={cn(
                            "h-11 rounded-xl transition-all font-mono text-sm",
                            isDark
                                ? "bg-[#111827] border-[#1f2937] text-white"
                                : "bg-white border-[#e2e8f0] text-[#0f172a]"
                        )}
                    />
                </Field>
                <Field label="Compare Price" sub="Original price for 'Sale' displays (KES)">
                    <Input
                        type="number"
                        value={priceForm.compare_price || 0}
                        onChange={(e) => setPriceForm({ ...priceForm, compare_price: parseInt(e.target.value) || 0 })}
                        className={cn(
                            "h-12 px-5 rounded-xl transition-all font-mono text-[15px] font-medium tracking-tight",
                            isDark
                                ? "bg-[#111827] border-[#1f2937] text-[#94a3b8] focus:ring-[#3b82f6] focus:border-[#3b82f6]"
                                : "bg-white border-[#e2e8f0] text-[#64748b] focus:ring-[#3b82f6] focus:border-[#3b82f6]"
                        )}
                    />
                </Field>
            </FieldGroup>

            <FieldGroup cols={2}>
                <Field label="Selling Price" sub="Primary price on storefront (KES)">
                    <Input
                        type="number"
                        value={priceForm.sell_price || 0}
                        onChange={(e) => setPriceForm({ ...priceForm, sell_price: parseInt(e.target.value) || 0 })}
                        className={cn(
                            "h-14 px-6 rounded-xl transition-all font-mono text-xl font-bold tracking-tight",
                            isDark
                                ? "bg-[#111827] border-[#1f2937] text-[#3b82f6] focus:ring-[#3b82f6] focus:border-[#3b82f6]"
                                : "bg-white border-[#e2e8f0] text-[#3b82f6] focus:ring-[#3b82f6] focus:border-[#3b82f6]"
                        )}
                    />
                </Field>
                <Field label="Discount Percent" sub="Percentage off selling price (%)">
                    <Input
                        type="number"
                        value={priceForm.discount_percent || 0}
                        onChange={(e) => setPriceForm({ ...priceForm, discount_percent: parseInt(e.target.value) || 0 })}
                        className={cn(
                            "h-11 rounded-xl transition-all font-mono text-sm",
                            isDark
                                ? "bg-[#111827] border-[#1f2937] text-white"
                                : "bg-white border-[#e2e8f0] text-[#0f172a]"
                        )}
                        max={100}
                        min={0}
                    />
                </Field>
            </FieldGroup>

            <div className={cn(
                "p-8 rounded-[2rem] border transition-all relative overflow-hidden group",
                isDark ? "bg-[#0f172a] border-[#1e293b]" : "bg-white border-slate-100 shadow-sm"
            )}>
                <div className="absolute top-0 left-0 w-1 h-full bg-[#3b82f6]" />
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[#3b82f6] mb-2 font-mono">Calculated Listing Price</div>
                <div className="text-4xl font-black text-[#0f172a] dark:text-[#f8fafc] font-mono tracking-tighter">
                    <span className="text-[20px] mr-1 opacity-50">KES</span>
                    {calculateFinalPrice().toLocaleString()}
                </div>
                <p className="text-[11px] text-[#64748b] dark:text-[#94a3b8] font-medium mt-3">
                    This is the final price customers will see on the product detail page.
                </p>
            </div>
        </div>
    );
}

interface TabInventoryProps {
    form: any;
    setForm: (form: any) => void;
}

export function TabInventory({ form, setForm }: TabInventoryProps) {
    return (
        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
            <SectionHead title="Stock Management" desc="Track availability and fulfill customer demand." />
            <FieldGroup cols={2}>
                <Field label="SKU" sub="Unique Stock Keeping Unit">
                    <Input
                        value={form.sku || ""}
                        onChange={(e) => setForm({ ...form, sku: e.target.value })}
                        placeholder="e.g. SAM-S24U-512-BLK"
                        className="h-11 rounded-xl border-[#e2e8f0] dark:border-[#1f2937] bg-white dark:bg-[#111827] focus:ring-2 focus:ring-[#3b82f6] transition-all font-mono uppercase text-sm"
                    />
                </Field>
                <Field label="Stock Quantity" sub="Units currently in-hand">
                    <Input
                        type="number"
                        value={form.stock_quantity || 0}
                        onChange={(e) => setForm({ ...form, stock_quantity: parseInt(e.target.value) || 0 })}
                        className="h-11 rounded-xl border-[#e2e8f0] dark:border-[#1f2937] bg-white dark:bg-[#111827] focus:ring-2 focus:ring-[#3b82f6] transition-all font-mono text-sm"
                    />
                </Field>
            </FieldGroup>

            <FieldGroup>
                <Field label="Inventory Status" sub="Current purchase eligibility">
                    <Select
                        value={form.availability || "in_stock"}
                        onValueChange={(v) => setForm({ ...form, availability: v })}
                    >
                        <SelectTrigger className="h-12 rounded-xl border-[#e2e8f0] dark:border-[#1f2937] bg-white dark:bg-[#111827] font-sans text-sm">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-[#e2e8f0] dark:border-[#1f2937] bg-white dark:bg-[#111827] shadow-2xl">
                            <SelectItem value="in_stock" className="rounded-lg m-1">In Stock</SelectItem>
                            <SelectItem value="limited" className="rounded-lg m-1">Limited Availability</SelectItem>
                            <SelectItem value="preorder" className="rounded-lg m-1">Pre-Order Only</SelectItem>
                            <SelectItem value="out_of_stock" className="rounded-lg m-1 text-red-500">Temporarily Out of Stock</SelectItem>
                            <SelectItem value="discontinued" className="rounded-lg m-1 opacity-50">Discontinued</SelectItem>
                        </SelectContent>
                    </Select>
                </Field>
            </FieldGroup>
        </div>
    );
}

interface TabShippingProps {
    shippingForm: any;
    setShippingForm: (form: any) => void;
}

export function TabShipping({ shippingForm, setShippingForm }: TabShippingProps) {
    const { theme } = useTheme();
    const isDark = theme === "dark";

    return (
        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
            <SectionHead title="Logistics & Handling" desc="Data for weight-based delivery calculations." />
            <FieldGroup cols={2}>
                <Field label="Net Weight" sub="Weight in grams (g)">
                    <Input
                        type="number"
                        value={shippingForm.weight || 0}
                        onChange={(e) => setShippingForm({ ...shippingForm, weight: parseInt(e.target.value) || 0 })}
                        className={cn(
                            "h-11 rounded-xl transition-all font-mono text-sm",
                            isDark
                                ? "bg-[#111827] border-[#1f2937] text-white"
                                : "bg-white border-[#e2e8f0] text-[#0f172a]"
                        )}
                    />
                </Field>
                <Field label="Shipping Class" sub="Internal fulfillment category">
                    <Select
                        value={shippingForm.shipping_class || "standard"}
                        onValueChange={(v) => setShippingForm({ ...shippingForm, shipping_class: v })}
                    >
                        <SelectTrigger className="h-12 rounded-xl border-[#e2e8f0] dark:border-[#1f2937] bg-white dark:bg-[#111827] font-sans text-sm">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-[#e2e8f0] dark:border-[#1f2937] bg-white dark:bg-[#111827] shadow-2xl">
                            <SelectItem value="standard" className="rounded-lg m-1">Standard Shipping</SelectItem>
                            <SelectItem value="express" className="rounded-lg m-1">Express Only</SelectItem>
                            <SelectItem value="heavy" className="rounded-lg m-1">Heavy / Bulky Item</SelectItem>
                            <SelectItem value="fragile" className="rounded-lg m-1">Fragile Handling</SelectItem>
                        </SelectContent>
                    </Select>
                </Field>
            </FieldGroup>

            <SectionHead title="Parcel Dimensions" desc="Box size in mm (L × W × H)" className="mt-12" />
            <FieldGroup cols={3}>
                <Field label="Length">
                    <Input
                        type="number"
                        value={shippingForm.length || 0}
                        onChange={(e) => setShippingForm({ ...shippingForm, length: parseInt(e.target.value) || 0 })}
                        className={cn(
                            "h-11 rounded-xl transition-all font-mono text-sm",
                            isDark
                                ? "bg-[#111827] border-[#1f2937] text-white"
                                : "bg-white border-[#e2e8f0] text-[#0f172a]"
                        )}
                    />
                </Field>
                <Field label="Width">
                    <Input
                        type="number"
                        value={shippingForm.width || 0}
                        onChange={(e) => setShippingForm({ ...shippingForm, width: parseInt(e.target.value) || 0 })}
                        className={cn(
                            "h-11 rounded-xl transition-all font-mono text-sm",
                            isDark
                                ? "bg-[#111827] border-[#1f2937] text-white"
                                : "bg-white border-[#e2e8f0] text-[#0f172a]"
                        )}
                    />
                </Field>
                <Field label="Height">
                    <Input
                        type="number"
                        value={shippingForm.height || 0}
                        onChange={(e) => setShippingForm({ ...shippingForm, height: parseInt(e.target.value) || 0 })}
                        className={cn(
                            "h-11 rounded-xl transition-all font-mono text-sm",
                            isDark
                                ? "bg-[#111827] border-[#1f2937] text-white"
                                : "bg-white border-[#e2e8f0] text-[#0f172a]"
                        )}
                    />
                </Field>
            </FieldGroup>
        </div>
    );
}
