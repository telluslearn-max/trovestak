"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
    ArrowLeft,
    CreditCard,
    MapPin,
    Check,
    Loader2,
    AlertCircle,
    ShoppingBag,
    Zap,
    Phone,
    ShieldCheck,
    ChevronRight
} from "lucide-react";
import { formatKES } from "@/lib/formatters";
import { useCartStore } from "@/stores/cart";
import { kenyanCounties } from "@/lib/counties";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { validateDiscountAction, getShippingRateAction, validateCartAction, initiateMpesaStkAction, getMpesaStatusAction, createManualOrderAction } from "./actions";

interface ShippingForm {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    county: string;
    postalCode: string;
}

export default function CheckoutClient() {
    const router = useRouter();
    const { cart, clearCart, toggleVat } = useCartStore();
    const [step, setStep] = useState<"shipping" | "payment">("shipping");
    const [isProcessing, setIsProcessing] = useState(false);
    const [paymentStatus, setPaymentStatus] = useState<"idle" | "processing" | "awaiting_pin" | "success" | "error" | "timeout">("idle");
    const [errorMessage, setErrorMessage] = useState("");
    const [mpesaPhone, setMpesaPhone] = useState("");
    const [orderId, setOrderId] = useState<string | null>(null);
    const [pollCount, setPollCount] = useState(0);
    const [paymentMethod, setPaymentMethod] = useState<"mpesa_stk" | "manual_till" | "cod">("mpesa_stk");
    const [transactionCode, setTransactionCode] = useState("");


    const [shippingForm, setShippingForm] = useState<ShippingForm>({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        address: "",
        city: "",
        county: "",
        postalCode: "",
    });

    const [discountCode, setDiscountCode] = useState("");
    const [appliedDiscount, setAppliedDiscount] = useState<{ code: string; type: string; value: number } | null>(null);
    const [isValidatingDiscount, setIsValidatingDiscount] = useState(false);
    const [shippingRate, setShippingRate] = useState(1500); // Default fallback

    const handleShippingSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setStep("payment");
        setMpesaPhone(shippingForm.phone);
    };

    const handleApplyDiscount = async () => {
        if (!discountCode) return;
        setIsValidatingDiscount(true);
        setErrorMessage("");

        const result = await validateDiscountAction(discountCode);

        if (result.error) {
            setErrorMessage(result.error);
            setAppliedDiscount(null);
        } else if (result.discount) {
            setAppliedDiscount(result.discount);
        }
        setIsValidatingDiscount(false);
    };

    const handleCountyChange = async (countyName: string) => {
        setShippingForm({ ...shippingForm, county: countyName });

        const result = await getShippingRateAction(countyName);
        if (result.rate !== undefined) {
            setShippingRate(result.rate);
        }
    };

    const handlePayment = async () => {
        if (!cart) return;
        
        if (paymentMethod === "mpesa_stk" && (!mpesaPhone || mpesaPhone.length < 10)) {
            setErrorMessage("Please enter a valid M-Pesa phone number");
            return;
        }

        if (paymentMethod === "manual_till" && (!transactionCode || transactionCode.length < 8)) {
            setErrorMessage("Please enter a valid transaction code");
            return;
        }

        setIsProcessing(true);
        setPaymentStatus("processing");
        setErrorMessage("");

        try {
            // ── Step 0: Reconcile cart with server (price + stock validation) ───────
            const reconcileRes = await validateCartAction(cart?.items ?? []);

            if (!reconcileRes.valid) {
                if (reconcileRes.errors.length > 0) {
                    setPaymentStatus("error");
                    setErrorMessage(reconcileRes.errors[0]);
                    setIsProcessing(false);
                    return;
                }

                if (reconcileRes.warnings.length > 0) {
                    setErrorMessage(`Note: ${reconcileRes.warnings[0]}`);
                }
            }

            const orderData = {
                firstName: shippingForm.firstName,
                lastName: shippingForm.lastName,
                email: shippingForm.email,
                phone: shippingForm.phone,
                address: shippingForm.address,
                city: shippingForm.city,
                county: shippingForm.county,
                postalCode: shippingForm.postalCode,
                items: (cart?.items ?? []).map(i => ({ id: i.id, product_id: i.product_id, variant_id: i.variant_id, title: i.title, quantity: i.quantity, unit_price: i.unit_price })),
                subtotal: subtotal,
                shippingAmount: subtotal > 500000 ? 0 : shippingRate,
                discountAmount: discountAmount || 0,
                vatAmount: vatAmount || 0,
            };

            if (paymentMethod === "mpesa_stk") {
                // ── Step 1: Create order + initiate STK Push ──────────────────────────
                const initiateRes = await initiateMpesaStkAction(
                    mpesaPhone,
                    total, // Pass cents directly to backend
                    orderData
                );

                if (initiateRes.error) {
                    throw new Error(initiateRes.error);
                }

                setOrderId(initiateRes.orderId!);
                setPaymentStatus("awaiting_pin");

                // Step 2: Poll for payment confirmation
                const POLL_INTERVAL = 3000;
                const MAX_POLLS = 40;
                let polls = 0;

                const poll = async () => {
                    polls++;
                    setPollCount(polls);

                    try {
                        const statusData = await getMpesaStatusAction(initiateRes.orderId!);

                        if (statusData.status === "paid") {
                            setPaymentStatus("success");
                            clearCart();
                            setTimeout(() => router.push(`/order-confirmation?orderId=${initiateRes.orderId}`), 1500);
                            return;
                        }

                        if (statusData.status === "failed") {
                            throw new Error("Payment was declined or cancelled. Please try again.");
                        }

                        if (statusData.status === "timeout" || polls >= MAX_POLLS) {
                            setPaymentStatus("timeout");
                            setErrorMessage("Payment timed out. If you entered your PIN, please contact support with your order ID.");
                            setIsProcessing(false);
                            return;
                        }

                        setTimeout(poll, POLL_INTERVAL);
                    } catch (err: any) {
                        setPaymentStatus("error");
                        setErrorMessage(err.message || "Payment check failed");
                        setIsProcessing(false);
                    }
                };

                setTimeout(poll, POLL_INTERVAL);
            } else {
                // Manual Till or COD
                const res = await createManualOrderAction(total, orderData, paymentMethod, transactionCode);
                
                if (res.error) {
                    throw new Error(res.error);
                }

                setPaymentStatus("success");
                clearCart();
                setTimeout(() => router.push(`/order-confirmation?orderId=${res.orderId}`), 1500);
            }
        } catch (error: any) {
            setPaymentStatus("error");
            setErrorMessage(error.message || "Payment failed. Please try again.");
            setIsProcessing(false);
        }
    };

    if (!cart || cart.items.length === 0) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
                <div className="h-24 w-24 rounded-[2rem] bg-muted/30 flex items-center justify-center mb-8 border border-border/50">
                    <ShoppingBag className="w-10 h-10 text-muted-foreground/40" />
                </div>
                <h1 className="text-4xl font-black tracking-tight text-foreground mb-4">Your bag is empty</h1>
                <p className="text-muted-foreground font-medium mb-12 uppercase text-xs tracking-[0.2em]">Ready to find your next favorite thing?</p>
                <Link
                    href="/store"
                    className="h-16 px-12 bg-primary text-white rounded-2xl font-black text-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/20"
                >
                    Explore Products
                </Link>
            </div>
        );
    }

    const subtotal = cart.subtotal;
    const vatAmount = cart.vat_total || 0;

    // Calculate discount
    let discountAmount = 0;
    if (appliedDiscount) {
        if (appliedDiscount.type === "percentage") {
            discountAmount = (subtotal * appliedDiscount.value) / 100;
        } else {
            discountAmount = appliedDiscount.value * 100; // Fixed amount in cents
        }
    }

    const shippingCharge = subtotal > 500000 ? 0 : shippingRate;
    const total = subtotal + vatAmount + (shippingCharge * 100) - discountAmount;

    return (
        <div className="min-h-screen bg-background pb-32 pt-32 px-6">
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center gap-6 mb-16">
                    <Link href="/cart" className="h-12 w-12 rounded-2xl bg-card border border-border/50 flex items-center justify-center hover:bg-muted/50 transition-colors shadow-sm">
                        <ArrowLeft className="h-5 w-5 text-muted-foreground" />
                    </Link>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-1">Final Step</p>
                        <h1 className="text-4xl font-black tracking-tighter text-foreground">Checkout</h1>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                    <div className="lg:col-span-7 space-y-12">
                        <AnimatePresence mode="wait">
                            {step === "shipping" ? (
                                <motion.div
                                    key="shipping"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    className="bg-card rounded-[2.5rem] p-10 shadow-xl shadow-black/[0.02] border border-border/50"
                                >
                                    <SectionHeader
                                        icon={<MapPin className="w-5 h-5" />}
                                        title="Shipping Logistics"
                                        subtitle="Where should we deliver your premium gear?"
                                    />

                                    <form onSubmit={handleShippingSubmit} className="space-y-10">
                                        <div className="grid grid-cols-2 gap-8">
                                            <InputGroup label="First Name" value={shippingForm.firstName} onChange={(v) => setShippingForm({ ...shippingForm, firstName: v })} placeholder="John" required />
                                            <InputGroup label="Last Name" value={shippingForm.lastName} onChange={(v) => setShippingForm({ ...shippingForm, lastName: v })} placeholder="Doe" required />
                                        </div>

                                        <InputGroup label="Email Address" type="email" value={shippingForm.email} onChange={(v) => setShippingForm({ ...shippingForm, email: v })} placeholder="john@example.com" required />

                                        <div className="grid grid-cols-2 gap-8">
                                            <InputGroup label="Contact Phone" type="tel" value={shippingForm.phone} onChange={(v) => setShippingForm({ ...shippingForm, phone: v })} placeholder="0712 345 678" required />
                                            <div className="space-y-3">
                                                <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground/40 ml-1">County</label>
                                                <select
                                                    required
                                                    value={shippingForm.county}
                                                    onChange={(e) => handleCountyChange(e.target.value)}
                                                    className="w-full h-14 px-6 rounded-2xl bg-muted/30 border-none text-foreground font-black focus:ring-4 focus:ring-primary/10 transition-all appearance-none outline-none"
                                                >
                                                    <option value="">Select County</option>
                                                    {kenyanCounties.map((c) => <option key={c.code} value={c.name}>{c.name}</option>)}
                                                </select>
                                            </div>
                                        </div>

                                        <InputGroup label="Delivery Address" value={shippingForm.address} onChange={(v) => setShippingForm({ ...shippingForm, address: v })} placeholder="Apartment, Street, Building..." required />

                                        <button type="submit" className="w-full h-16 bg-foreground text-background rounded-2xl font-black text-lg flex items-center justify-center hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-black/10 group">
                                            Continue to Payment <ChevronRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                                        </button>
                                    </form>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="payment"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    className="space-y-8"
                                >
                                    <div className="bg-card rounded-[2.5rem] p-10 shadow-xl shadow-black/[0.02] border border-border/50">
                                        <SectionHeader icon={<CreditCard className="w-5 h-5" />} title="Payment Authentication" subtitle="Securely verify your purchase via M-Pesa" />

                                        <div className="flex gap-4 mb-8">
                                            <button 
                                                onClick={() => { setPaymentMethod("mpesa_stk"); setErrorMessage(""); }}
                                                className={cn("flex-1 py-4 px-4 rounded-2xl flex flex-col items-center justify-center gap-2 border transition-all", paymentMethod === "mpesa_stk" ? "border-primary bg-primary/5 shadow-sm" : "border-border hover:bg-muted/30")}
                                            >
                                                <Zap className={cn("h-6 w-6", paymentMethod === "mpesa_stk" ? "text-primary" : "text-muted-foreground")} />
                                                <span className="text-[10px] font-black uppercase tracking-widest">STK Push</span>
                                            </button>
                                            <button 
                                                onClick={() => { setPaymentMethod("manual_till"); setErrorMessage(""); }}
                                                className={cn("flex-1 py-4 px-4 rounded-2xl flex flex-col items-center justify-center gap-2 border transition-all", paymentMethod === "manual_till" ? "border-primary bg-primary/5 shadow-sm" : "border-border hover:bg-muted/30")}
                                            >
                                                <Phone className={cn("h-6 w-6", paymentMethod === "manual_till" ? "text-primary" : "text-muted-foreground")} />
                                                <span className="text-[10px] font-black uppercase tracking-widest">Manual Till</span>
                                            </button>
                                            <button 
                                                onClick={() => { setPaymentMethod("cod"); setErrorMessage(""); }}
                                                className={cn("flex-1 py-4 px-4 rounded-2xl flex flex-col items-center justify-center gap-2 border transition-all", paymentMethod === "cod" ? "border-primary bg-primary/5 shadow-sm" : "border-border hover:bg-muted/30")}
                                            >
                                                <MapPin className={cn("h-6 w-6", paymentMethod === "cod" ? "text-primary" : "text-muted-foreground")} />
                                                <span className="text-[10px] font-black uppercase tracking-widest">COD</span>
                                            </button>
                                        </div>

                                        <div className="p-8 rounded-3xl bg-primary/5 border border-primary/20 mb-10">
                                            <AnimatePresence mode="wait">
                                                <motion.div
                                                    key={paymentMethod}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -10 }}
                                                    className="space-y-6"
                                                >
                                                    {paymentMethod === "mpesa_stk" && (
                                                        <>
                                                            <div className="flex items-center gap-4 mb-6">
                                                                <div className="h-12 w-12 rounded-xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                                                                    <Zap className="h-6 w-6 text-white" />
                                                                </div>
                                                                <div>
                                                                    <h3 className="font-black text-foreground">Lipa Na M-Pesa</h3>
                                                                    <p className="text-xs font-medium text-muted-foreground">Instant STK Push Verification</p>
                                                                </div>
                                                            </div>
                                                            <InputGroup label="Payment Phone (M-Pesa)" value={mpesaPhone} onChange={setMpesaPhone} placeholder="07XX XXX XXX" disabled={isProcessing} />
                                                        </>
                                                    )}

                                                    {paymentMethod === "manual_till" && (
                                                        <>
                                                            <div className="flex items-center gap-4 mb-6">
                                                                <div className="h-12 w-12 rounded-xl bg-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
                                                                    <Phone className="h-6 w-6 text-white" />
                                                                </div>
                                                                <div>
                                                                    <h3 className="font-black text-foreground">Manual Till Payment</h3>
                                                                    <p className="text-xs font-medium text-muted-foreground">Pay to Till: 123456</p>
                                                                </div>
                                                            </div>
                                                            <p className="text-sm font-medium text-muted-foreground my-4">Please go to your M-Pesa menu, select Buy Goods and Services, enter Till Number <strong>123456</strong>, and pay <strong>{formatKES(total)}</strong>. Enter the transaction code below.</p>
                                                            <InputGroup label="M-Pesa Transaction Code" value={transactionCode} onChange={setTransactionCode} placeholder="OXX123XXXX" disabled={isProcessing} />
                                                        </>
                                                    )}

                                                    {paymentMethod === "cod" && (
                                                        <>
                                                            <div className="flex items-center gap-4 mb-6">
                                                                <div className="h-12 w-12 rounded-xl bg-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
                                                                    <MapPin className="h-6 w-6 text-white" />
                                                                </div>
                                                                <div>
                                                                    <h3 className="font-black text-foreground">Cash on Delivery</h3>
                                                                    <p className="text-xs font-medium text-muted-foreground">Pay when you receive the item</p>
                                                                </div>
                                                            </div>
                                                            <p className="text-sm font-medium text-muted-foreground my-4">You will pay <strong>{formatKES(total)}</strong> via cash or M-Pesa when our rider delivers your order.</p>
                                                        </>
                                                    )}

                                                    {errorMessage && <p className="text-xs font-bold text-destructive flex items-center gap-2"><AlertCircle className="h-4 w-4" /> {errorMessage}</p>}
                                                    {paymentStatus === "awaiting_pin" && paymentMethod === "mpesa_stk" && <p className="text-xs font-bold text-amber-500 flex items-center gap-2"><Phone className="h-4 w-4 animate-pulse" /> STK Push sent! Enter your M-Pesa PIN on your phone...</p>}
                                                    {paymentStatus === "awaiting_pin" && pollCount > 0 && <p className="text-[10px] text-muted-foreground">Checking payment status... ({pollCount})</p>}
                                                    {paymentStatus === "success" && <p className="text-xs font-bold text-emerald-500 flex items-center gap-2"><Check className="h-4 w-4" /> ORDER CONFIRMED! Redirecting...</p>}
                                                    {orderId && (paymentStatus === "timeout" || paymentStatus === "error") && <p className="text-[10px] text-muted-foreground mt-1">Order ref: {orderId.slice(0, 8).toUpperCase()}</p>}

                                                    <button
                                                        onClick={handlePayment}
                                                        disabled={isProcessing || paymentStatus === "success" || paymentStatus === "awaiting_pin"}
                                                        className="w-full h-16 bg-primary text-white rounded-2xl font-black text-lg flex items-center justify-center hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-primary/20 disabled:opacity-50"
                                                    >
                                                        {paymentStatus === "awaiting_pin" ? <><Loader2 className="h-5 w-5 animate-spin mr-2" />Waiting for PIN...</> : paymentStatus === "success" ? "ORDER CONFIRMED ✓" : (paymentMethod === "cod" ? "CONFIRM ORDER" : `PAY ${formatKES(total)}`)}
                                                    </button>
                                                </motion.div>
                                            </AnimatePresence>
                                        </div>

                                        <button onClick={() => setStep("shipping")} className="text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors">
                                            ← Re-edit shipping details
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="bg-muted/30 rounded-3xl p-10 border border-border/50 flex items-start gap-6">
                            <ShieldCheck className="h-10 w-10 text-primary opacity-20" />
                            <div>
                                <h4 className="font-black text-foreground mb-1 uppercase text-[10px] tracking-widest">Marketeo Buyer Protection</h4>
                                <p className="text-xs font-medium text-muted-foreground leading-relaxed">Your transaction is secured with end-to-end encryption. Items are verified for authenticity before dispatch. 14-day hassle-free returns on all standard products.</p>
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-5">
                        <div className="bg-card rounded-[2.5rem] p-10 shadow-xl shadow-black/[0.02] border border-border/50 sticky top-32">
                            <h2 className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground/50 mb-10">Order Manifest</h2>

                            <div className="space-y-6 mb-10">
                                {cart.items.map((item) => (
                                    <div key={item.id} className="flex gap-6 group">
                                        <div className="relative h-20 w-20 rounded-2xl overflow-hidden bg-muted/50 border border-border/50 flex-shrink-0 group-hover:scale-105 transition-transform">
                                            {item.thumbnail ? <img src={item.thumbnail} alt={item.title} className="object-cover h-full w-full" /> : <div className="h-full w-full flex items-center justify-center text-[10px] font-black text-muted-foreground/30">IMG</div>}
                                        </div>
                                        <div className="flex-1 py-1">
                                            <h3 className="text-sm font-black text-foreground mb-1 line-clamp-1">{item.title}</h3>
                                            <p className="text-[10px] font-heavy text-muted-foreground uppercase tracking-widest mb-2">QTY: {item.quantity}</p>
                                            <p className="text-sm font-black text-primary">{formatKES(item.unit_price * item.quantity)}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Discount Code Input */}
                            <div className="mb-10 pt-8 border-t border-border/30">
                                <div className="flex gap-3">
                                    <div className="flex-1 relative">
                                        <input
                                            type="text"
                                            value={discountCode}
                                            onChange={(e) => setDiscountCode(e.target.value)}
                                            placeholder="Discount Code"
                                            className="w-full h-14 bg-muted/30 border-none rounded-2xl text-foreground font-black px-6 focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-muted-foreground/20 outline-none uppercase"
                                        />
                                        {appliedDiscount && (
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                                <Badge className="bg-emerald-500 text-white border-none font-black text-[10px] uppercase">Applied</Badge>
                                            </div>
                                        )}
                                    </div>
                                    <Button
                                        onClick={handleApplyDiscount}
                                        disabled={!discountCode || isValidatingDiscount}
                                        className="h-14 px-8 rounded-2xl font-black bg-foreground text-background"
                                    >
                                        {isValidatingDiscount ? <Loader2 className="w-4 h-4 animate-spin" /> : "Apply"}
                                    </Button>
                                </div>
                            </div>

                            <div className="space-y-4 pt-8 border-t border-border/30">
                                <SummaryRow label="Subtotal" value={formatKES(subtotal)} />

                                {appliedDiscount && (
                                    <SummaryRow
                                        label={`Discount (${appliedDiscount.code})`}
                                        value={`-${formatKES(discountAmount)}`}
                                        isFree
                                    />
                                )}

                                {/* VAT Toggle */}
                                <div className="flex items-center justify-between py-3">
                                    <div className="flex flex-col">
                                        <span className="text-xs font-black uppercase tracking-widest text-muted-foreground/50">Include VAT</span>
                                        <span className="text-[10px] text-muted-foreground/40">Standard 16%</span>
                                    </div>
                                    <Switch
                                        checked={cart.vat_enabled}
                                        onCheckedChange={(checked) => toggleVat(checked)}
                                    />
                                </div>

                                <SummaryRow label="VAT (16%)" value={cart.vat_enabled ? formatKES(vatAmount) : formatKES(0)} muted={!cart.vat_enabled} />
                                <SummaryRow label="Logistics" value={shippingCharge === 0 ? "FREE" : formatKES(shippingCharge * 100)} isFree={shippingCharge === 0} />
                                <div className="pt-6 border-t border-border/30 flex items-center justify-between">
                                    <span className="text-lg font-black text-foreground uppercase tracking-tighter">Grand Total</span>
                                    <span className="text-3xl font-black text-foreground tracking-tighter">{formatKES(total)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function SectionHeader({ icon, title, subtitle }: { icon: React.ReactNode, title: string, subtitle: string }) {
    return (
        <div className="flex items-center gap-6 mb-12">
            <div className="h-14 w-14 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                <div className="text-white">{icon}</div>
            </div>
            <div>
                <h2 className="text-2xl font-black tracking-tight text-foreground">{title}</h2>
                <p className="text-sm font-medium text-muted-foreground">{subtitle}</p>
            </div>
        </div>
    );
}

function InputGroup({ label, value, onChange, placeholder, type = "text", required, disabled }: { label: string, value: string, onChange: (v: string) => void, placeholder: string, type?: string, required?: boolean, disabled?: boolean }) {
    return (
        <div className="space-y-3">
            <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground/40 ml-1">{label}</label>
            <input
                type={type}
                required={required}
                disabled={disabled}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full h-14 bg-muted/30 border-none rounded-2xl text-foreground font-black px-6 focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-muted-foreground/20 outline-none disabled:opacity-50"
                placeholder={placeholder}
            />
        </div>
    );
}

function SummaryRow({ label, value, isFree, muted }: { label: string, value: string, isFree?: boolean, muted?: boolean }) {
    return (
        <div className="flex justify-between items-center">
            <span className="text-xs font-black uppercase tracking-widest text-muted-foreground/50">{label}</span>
            <span className={cn("text-sm font-black", isFree ? "text-emerald-500" : muted ? "text-muted-foreground/30" : "text-foreground")}>{value}</span>
        </div>
    );
}
