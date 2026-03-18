"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
    ArrowLeft,
    Check,
    Loader2,
    AlertCircle,
    ShoppingBag,
    Phone,
    ShieldCheck,
    LogIn,
    X,
} from "lucide-react";
import { formatKES } from "@/lib/formatters";
import { useCartStore } from "@/stores/cart";
import { kenyanCounties } from "@/lib/counties";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/lib/supabase";
import {
    validateDiscountAction,
    getShippingRateAction,
    validateCartAction,
    initiateMpesaStkAction,
    getMpesaStatusAction,
    createManualOrderAction,
} from "./actions";

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

    const [isProcessing, setIsProcessing] = useState(false);
    const [paymentStatus, setPaymentStatus] = useState<"idle" | "processing" | "awaiting_pin" | "success" | "error" | "timeout">("idle");
    const [errorMessage, setErrorMessage] = useState("");
    const [mpesaPhone, setMpesaPhone] = useState("");
    const [orderId, setOrderId] = useState<string | null>(null);
    const [pollCount, setPollCount] = useState(0);
    const [paymentMethod, setPaymentMethod] = useState<"mpesa_stk" | "manual_till" | "cod">("mpesa_stk");
    const [transactionCode, setTransactionCode] = useState("");

    const [shippingForm, setShippingForm] = useState<ShippingForm>({
        firstName: "", lastName: "", email: "", phone: "",
        address: "", city: "", county: "", postalCode: "",
    });

    const [isVoiceCheckout, setIsVoiceCheckout] = useState(false);
    const [showAuthBanner, setShowAuthBanner] = useState(false);
    // Store prefill in a ref so applyPrefill is always stable (no closure deps)
    const pendingPrefillRef = useRef<{
        customer_name: string; phone: string; payment_method: string;
        address: string; county: string;
    } | null>(null);

    // Read voice prefill data on mount — store it but don't apply until auth is dismissed
    useEffect(() => {
        const isVoice = new URLSearchParams(window.location.search).get("voice") === "1";
        setIsVoiceCheckout(isVoice);
        if (!isVoice) return;

        setShowAuthBanner(true);
        try {
            const raw = sessionStorage.getItem("voice_checkout_prefill");
            sessionStorage.removeItem("voice_checkout_prefill");
            if (!raw) return;
            pendingPrefillRef.current = JSON.parse(raw);
        } catch { /* storage unavailable or invalid JSON */ }
    }, []);

    // Apply prefill to form after auth step (sign-in or guest dismiss)
    const applyPrefill = useCallback(() => {
        const data = pendingPrefillRef.current;
        if (!data) return;
        pendingPrefillRef.current = null;
        const nameParts = data.customer_name?.trim().split(" ") ?? [];
        setShippingForm(prev => ({
            ...prev,
            firstName: nameParts[0] ?? "",
            lastName: nameParts.slice(1).join(" "),
            phone: data.phone || prev.phone,
            address: data.address || prev.address,
            county: data.county || prev.county,
        }));
        const methodMap: Record<string, "mpesa_stk" | "manual_till" | "cod"> = {
            mpesa: "mpesa_stk", manual_till: "manual_till", cod: "cod",
        };
        if (data.payment_method && methodMap[data.payment_method]) {
            setPaymentMethod(methodMap[data.payment_method]);
        }
        if (data.phone && data.payment_method === "mpesa") {
            setMpesaPhone(data.phone);
        }
    }, []);

    const dismissAuthBanner = useCallback(() => {
        setShowAuthBanner(false);
        applyPrefill();
    }, [applyPrefill]);

    const [discountCode, setDiscountCode] = useState("");
    const [appliedDiscount, setAppliedDiscount] = useState<{ code: string; type: string; value: number } | null>(null);
    const [isValidatingDiscount, setIsValidatingDiscount] = useState(false);
    const [shippingRate, setShippingRate] = useState(1500);

    const handleApplyDiscount = async () => {
        if (!discountCode) return;
        setIsValidatingDiscount(true);
        setErrorMessage("");
        const result = await validateDiscountAction(discountCode);
        if (result.error) { setErrorMessage(result.error); setAppliedDiscount(null); }
        else if (result.discount) { setAppliedDiscount(result.discount); }
        setIsValidatingDiscount(false);
    };

    const handleCountyChange = async (countyName: string) => {
        setShippingForm({ ...shippingForm, county: countyName });
        const result = await getShippingRateAction(countyName);
        if (result.rate !== undefined) setShippingRate(result.rate);
    };

    // ── Google Sign-In via GCP Identity Services ──────────────
    // Load the GSI script and initialise on mount so the credential
    // callback is wired up before the user clicks the button.
    const googleBtnRef = useRef<HTMLDivElement>(null);

    const handleGoogleCredential = useCallback(async (credentialResponse: { credential: string }) => {
        const { error } = await supabase.auth.signInWithIdToken({
            provider: "google",
            token: credentialResponse.credential,
        });
        if (!error) dismissAuthBanner();
    }, [dismissAuthBanner]);

    const initGSI = useCallback((clientId: string) => {
        const g = (window as any).google;
        if (!g) return;
        g.accounts.id.initialize({ client_id: clientId, callback: handleGoogleCredential });
        if (googleBtnRef.current) {
            g.accounts.id.renderButton(googleBtnRef.current, {
                type: 'standard', theme: 'outline', size: 'medium',
                text: 'signin_with', shape: 'rectangular',
            });
        }
    }, [handleGoogleCredential]);

    useEffect(() => {
        const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
        if (!clientId) return;

        const existing = document.getElementById("gsi-script");
        if (existing) {
            initGSI(clientId);
            return;
        }

        const script = document.createElement("script");
        script.id = "gsi-script";
        script.src = "https://accounts.google.com/gsi/client";
        script.async = true;
        script.defer = true;
        script.onload = () => initGSI(clientId);
        document.head.appendChild(script);
    }, [initGSI]);

    const handlePlaceOrder = async (e: React.FormEvent) => {
        e.preventDefault();
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
            const reconcileRes = await validateCartAction(cart?.items ?? []);
            if (!reconcileRes.valid) {
                if (reconcileRes.errors.length > 0) {
                    setPaymentStatus("error");
                    setErrorMessage(reconcileRes.errors[0]);
                    setIsProcessing(false);
                    return;
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
                items: (cart?.items ?? []).map(i => ({
                    id: i.id, product_id: i.product_id, variant_id: i.variant_id,
                    title: i.title, quantity: i.quantity, unit_price: i.unit_price,
                })),
                subtotal,
                shippingAmount: subtotal > 500000 ? 0 : shippingRate,
                discountAmount: discountAmount || 0,
                vatAmount: vatAmount || 0,
            };

            if (paymentMethod === "mpesa_stk") {
                const initiateRes = await initiateMpesaStkAction(mpesaPhone, total, orderData);
                if (initiateRes.error) throw new Error(initiateRes.error);

                setOrderId(initiateRes.orderId!);
                setPaymentStatus("awaiting_pin");

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
                        if (statusData.status === "failed") throw new Error("Payment was declined or cancelled.");
                        if (statusData.status === "timeout" || polls >= MAX_POLLS) {
                            setPaymentStatus("timeout");
                            setErrorMessage("Taking longer than expected. If you entered your PIN, your payment may still process.");
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
                const res = await createManualOrderAction(total, orderData, paymentMethod, transactionCode);
                if (res.error) throw new Error(res.error);
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
            <div className="min-h-screen bg-[#f5f5f7] flex flex-col items-center justify-center p-6 text-center">
                <ShoppingBag className="w-16 h-16 text-[#6e6e73] mb-6" />
                <h1 className="text-[32px] font-semibold text-[#1d1d1f] mb-2">Your bag is empty</h1>
                <p className="text-[#6e6e73] mb-8">Add some products before checking out.</p>
                <Link href="/store" className="px-8 py-3 bg-black text-white rounded-full text-[17px] font-medium hover:bg-[#1d1d1f] transition-colors">
                    Browse Products
                </Link>
            </div>
        );
    }

    const subtotal = cart.subtotal;
    const vatAmount = cart.vat_total || 0;

    let discountAmount = 0;
    if (appliedDiscount) {
        if (appliedDiscount.type === "percentage") discountAmount = (subtotal * appliedDiscount.value) / 100;
        else discountAmount = appliedDiscount.value * 100;
    }

    const shippingCharge = subtotal > 500000 ? 0 : shippingRate;
    const total = subtotal + vatAmount + (shippingCharge * 100) - discountAmount;

    const isAwaitingPin = paymentStatus === "awaiting_pin";
    const isSuccess = paymentStatus === "success";
    const canSubmit = !isProcessing && !isSuccess && !isAwaitingPin;

    return (
        <div className="min-h-screen bg-[#f5f5f7] pt-[44px]">
            <div className="max-w-6xl mx-auto px-4 py-12">
                {/* Header */}
                <div className="flex items-center gap-4 mb-10">
                    <Link href="/cart" className="w-9 h-9 rounded-full bg-white flex items-center justify-center hover:bg-gray-100 transition-colors">
                        <ArrowLeft className="w-4 h-4 text-[#1d1d1f]" />
                    </Link>
                    <h1 className="text-[28px] font-semibold text-[#1d1d1f]">Checkout</h1>
                </div>

                <AnimatePresence>
                    {showAuthBanner && (
                        <motion.div
                            initial={{ opacity: 0, y: -12 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -12 }}
                            className="bg-white rounded-2xl p-5 mb-6 flex items-center justify-between gap-4"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-[#f5f5f7] flex items-center justify-center shrink-0">
                                    <LogIn className="w-4 h-4 text-[#1d1d1f]" />
                                </div>
                                <div>
                                    <p className="text-[14px] font-semibold text-[#1d1d1f]">Sign in to save this order</p>
                                    <p className="text-[12px] text-[#6e6e73]">Track your order and earn rewards</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                {process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ? (
                                    <div ref={googleBtnRef} />
                                ) : (
                                    <span className="text-[12px] text-[#6e6e73] px-2">Google Sign-In not configured</span>
                                )}
                                <Link
                                    href={`/auth/login?redirect=/checkout${isVoiceCheckout ? "?voice=1" : ""}`}
                                    className="px-4 py-2 rounded-xl border border-[#d2d2d7] text-[#1d1d1f] text-[13px] font-medium hover:bg-[#f5f5f7] transition-colors"
                                >
                                    Email
                                </Link>
                                <button
                                    type="button"
                                    onClick={dismissAuthBanner}
                                    className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[#f5f5f7] transition-colors"
                                    aria-label="Continue as guest"
                                >
                                    <X className="w-4 h-4 text-[#6e6e73]" />
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <form onSubmit={handlePlaceOrder}>
                    <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 items-start">
                        {/* ── Left column ── */}
                        <div className="space-y-4">

                            {/* Section 1: Contact + Shipping */}
                            <div className="bg-white rounded-2xl p-6">
                                <h2 className="text-[17px] font-semibold text-[#1d1d1f] mb-5">Shipping Details</h2>
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField label="First Name" value={shippingForm.firstName} onChange={(v) => setShippingForm({ ...shippingForm, firstName: v })} placeholder="John" required />
                                        <FormField label="Last Name" value={shippingForm.lastName} onChange={(v) => setShippingForm({ ...shippingForm, lastName: v })} placeholder="Doe" required />
                                    </div>
                                    <FormField label="Email" type="email" value={shippingForm.email} onChange={(v) => setShippingForm({ ...shippingForm, email: v })} placeholder="john@example.com" required />
                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField label="Phone" type="tel" value={shippingForm.phone} onChange={(v) => setShippingForm({ ...shippingForm, phone: v })} placeholder="0712 345 678" required />
                                        <div className="space-y-1.5">
                                            <label className="text-[12px] font-medium text-[#6e6e73]">County</label>
                                            <select
                                                required
                                                value={shippingForm.county}
                                                onChange={(e) => handleCountyChange(e.target.value)}
                                                className="w-full h-11 px-4 rounded-xl bg-[#f5f5f7] text-[#1d1d1f] text-[14px] outline-none focus:ring-2 focus:ring-black/20 appearance-none"
                                            >
                                                <option value="">Select county</option>
                                                {kenyanCounties.map((c) => <option key={c.code} value={c.name}>{c.name}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    <FormField label="Delivery Address" value={shippingForm.address} onChange={(v) => setShippingForm({ ...shippingForm, address: v })} placeholder="Street, building, apartment..." required />
                                </div>
                            </div>

                            {/* Section 2: Payment */}
                            <div className="bg-white rounded-2xl p-6">
                                <h2 className="text-[17px] font-semibold text-[#1d1d1f] mb-5">Payment</h2>

                                {/* Method tabs */}
                                <div className="grid grid-cols-3 gap-2 mb-5">
                                    {([
                                        { id: 'mpesa_stk', label: 'STK Push' },
                                        { id: 'manual_till', label: 'Manual Till' },
                                        { id: 'cod', label: 'Cash on Delivery' },
                                    ] as const).map((m) => (
                                        <button
                                            key={m.id}
                                            type="button"
                                            onClick={() => { setPaymentMethod(m.id); setErrorMessage(""); }}
                                            className={cn(
                                                'py-2.5 px-3 rounded-xl text-[13px] font-medium border transition-all',
                                                paymentMethod === m.id
                                                    ? 'bg-black text-white border-black'
                                                    : 'bg-[#f5f5f7] text-[#1d1d1f] border-transparent hover:border-[#d2d2d7]'
                                            )}
                                        >
                                            {m.label}
                                        </button>
                                    ))}
                                </div>

                                {/* STK Push fields */}
                                {paymentMethod === "mpesa_stk" && (
                                    <div className="space-y-4">
                                        <FormField
                                            label="M-Pesa Phone Number"
                                            type="tel"
                                            value={mpesaPhone}
                                            onChange={setMpesaPhone}
                                            placeholder="07XX XXX XXX"
                                            disabled={isProcessing}
                                        />
                                        {/* Inline STK status */}
                                        <AnimatePresence>
                                            {isAwaitingPin && (
                                                <motion.div
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: 'auto' }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                    className="overflow-hidden"
                                                >
                                                    <div className="flex items-center gap-3 p-4 rounded-xl bg-green-50 border border-green-200">
                                                        <Phone className="w-5 h-5 text-green-600 animate-pulse shrink-0" />
                                                        <div>
                                                            <p className="text-[14px] font-medium text-green-800">STK Push sent to {mpesaPhone}</p>
                                                            <p className="text-[12px] text-green-600">Enter your M-Pesa PIN to confirm payment...{pollCount > 0 ? ` (${pollCount})` : ''}</p>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                )}

                                {/* Manual Till fields */}
                                {paymentMethod === "manual_till" && (
                                    <div className="space-y-4">
                                        <div className="p-4 rounded-xl bg-[#f5f5f7]">
                                            <p className="text-[14px] text-[#1d1d1f] font-medium">Pay to Till: <strong>123456</strong></p>
                                            <p className="text-[13px] text-[#6e6e73] mt-1">Amount: {formatKES(total)}</p>
                                        </div>
                                        <FormField
                                            label="M-Pesa Transaction Code"
                                            value={transactionCode}
                                            onChange={setTransactionCode}
                                            placeholder="OXX123XXXX"
                                            disabled={isProcessing}
                                        />
                                    </div>
                                )}

                                {/* COD */}
                                {paymentMethod === "cod" && (
                                    <div className="p-4 rounded-xl bg-[#f5f5f7]">
                                        <p className="text-[14px] text-[#1d1d1f]">
                                            Pay <strong>{formatKES(total)}</strong> when your order is delivered.
                                        </p>
                                    </div>
                                )}

                                {/* Error message */}
                                {errorMessage && (
                                    <div className="flex items-start gap-2 mt-4 p-3 rounded-xl bg-red-50 border border-red-200">
                                        <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                                        <p className="text-[13px] text-red-700">{errorMessage}</p>
                                    </div>
                                )}

                                {/* Timeout recovery */}
                                {orderId && (paymentStatus === "timeout" || paymentStatus === "error") && (
                                    <div className="mt-3 flex items-center gap-3">
                                        <p className="text-[12px] text-[#6e6e73]">Ref: {orderId.slice(0, 8).toUpperCase()}</p>
                                        <Link href="/account/orders" className="text-[12px] font-medium text-[#0071e3] hover:underline">
                                            Check payment status
                                        </Link>
                                    </div>
                                )}

                                {/* Success */}
                                {isSuccess && (
                                    <div className="flex items-center gap-3 mt-4 p-4 rounded-xl bg-green-50 border border-green-200">
                                        <Check className="w-5 h-5 text-green-600 shrink-0" />
                                        <p className="text-[14px] font-medium text-green-800">Order confirmed! Redirecting...</p>
                                    </div>
                                )}
                            </div>

                            {/* Trust badge */}
                            <div className="flex items-center gap-3 px-4 py-3 bg-white rounded-2xl">
                                <ShieldCheck className="w-5 h-5 text-[#6e6e73] shrink-0" />
                                <p className="text-[13px] text-[#6e6e73]">
                                    All transactions are secured with end-to-end encryption. 14-day returns on all products.
                                </p>
                            </div>

                            {/* Submit button */}
                            <button
                                type="submit"
                                disabled={!canSubmit}
                                className={cn(
                                    'w-full h-14 rounded-full text-[17px] font-semibold transition-all flex items-center justify-center gap-2',
                                    isSuccess ? 'bg-green-600 text-white' :
                                    isAwaitingPin ? 'bg-black/50 text-white cursor-not-allowed' :
                                    'bg-black text-white hover:bg-[#1d1d1f] disabled:opacity-50'
                                )}
                            >
                                {isAwaitingPin && <Loader2 className="w-5 h-5 animate-spin" />}
                                {isSuccess ? 'Order Confirmed' :
                                 isAwaitingPin ? 'Waiting for PIN...' :
                                 paymentMethod === 'cod' ? 'Place Order' :
                                 `Pay ${formatKES(total)}`}
                            </button>
                        </div>

                        {/* ── Right column: Order summary ── */}
                        <div className="bg-white rounded-2xl p-6 sticky top-[60px]">
                            <h2 className="text-[17px] font-semibold text-[#1d1d1f] mb-5">Order Summary</h2>

                            {/* Cart items */}
                            <div className="space-y-4 mb-5">
                                {cart.items.map((item) => (
                                    <div key={item.id} className="flex gap-3">
                                        <div className="w-14 h-14 rounded-xl bg-[#f5f5f7] shrink-0 overflow-hidden">
                                            {item.thumbnail ? (
                                                <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <ShoppingBag className="w-5 h-5 text-[#6e6e73]" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[14px] font-medium text-[#1d1d1f] truncate">{item.title}</p>
                                            <p className="text-[12px] text-[#6e6e73]">Qty {item.quantity}</p>
                                        </div>
                                        <p className="text-[14px] font-medium text-[#1d1d1f] shrink-0">{formatKES(item.unit_price * item.quantity)}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Discount code */}
                            <div className="flex gap-2 mb-5">
                                <input
                                    type="text"
                                    value={discountCode}
                                    onChange={(e) => setDiscountCode(e.target.value)}
                                    placeholder="Discount code"
                                    className="flex-1 h-10 px-4 rounded-xl bg-[#f5f5f7] text-[14px] text-[#1d1d1f] outline-none focus:ring-2 focus:ring-black/20"
                                />
                                <button
                                    type="button"
                                    onClick={handleApplyDiscount}
                                    disabled={!discountCode || isValidatingDiscount}
                                    className="h-10 px-4 rounded-xl bg-black text-white text-[14px] font-medium disabled:opacity-50"
                                >
                                    {isValidatingDiscount ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Apply'}
                                </button>
                            </div>

                            {/* Totals */}
                            <div className="space-y-2.5 pt-4 border-t border-[#f5f5f7]">
                                <SummaryRow label="Subtotal" value={formatKES(subtotal)} />
                                {appliedDiscount && (
                                    <SummaryRow label={`Discount (${appliedDiscount.code})`} value={`-${formatKES(discountAmount)}`} green />
                                )}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[14px] text-[#6e6e73]">VAT (16%)</span>
                                        <Switch
                                            checked={cart.vat_enabled}
                                            onCheckedChange={(checked) => toggleVat(checked)}
                                            className="scale-75"
                                        />
                                    </div>
                                    <span className={cn('text-[14px]', cart.vat_enabled ? 'text-[#1d1d1f]' : 'text-[#6e6e73] line-through')}>
                                        {formatKES(vatAmount)}
                                    </span>
                                </div>
                                <SummaryRow
                                    label="Shipping"
                                    value={shippingCharge === 0 ? 'Free' : formatKES(shippingCharge * 100)}
                                    green={shippingCharge === 0}
                                />
                                <div className="flex justify-between items-center pt-3 border-t border-[#f5f5f7]">
                                    <span className="text-[17px] font-semibold text-[#1d1d1f]">Total</span>
                                    <span className="text-[22px] font-semibold text-[#1d1d1f]">{formatKES(total)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}

function FormField({ label, value, onChange, placeholder, type = "text", required, disabled }: {
    label: string; value: string; onChange: (v: string) => void;
    placeholder: string; type?: string; required?: boolean; disabled?: boolean;
}) {
    return (
        <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-[#6e6e73]">{label}</label>
            <input
                type={type}
                required={required}
                disabled={disabled}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full h-11 px-4 rounded-xl bg-[#f5f5f7] text-[14px] text-[#1d1d1f] outline-none focus:ring-2 focus:ring-black/20 placeholder:text-[#aaaaaa] disabled:opacity-50"
            />
        </div>
    );
}

function SummaryRow({ label, value, green }: { label: string; value: string; green?: boolean }) {
    return (
        <div className="flex justify-between items-center">
            <span className="text-[14px] text-[#6e6e73]">{label}</span>
            <span className={cn('text-[14px]', green ? 'text-green-600 font-medium' : 'text-[#1d1d1f]')}>{value}</span>
        </div>
    );
}
