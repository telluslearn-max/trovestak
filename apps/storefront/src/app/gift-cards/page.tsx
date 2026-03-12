"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Gift, CreditCard, Sparkles, Check, ArrowRight, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const giftCardAmounts = [
    { value: 5000, popular: false },
    { value: 10000, popular: true },
    { value: 20000, popular: false },
    { value: 50000, popular: false },
    { value: 100000, popular: false },
];

const giftCardDesigns = [
    { id: "classic", name: "Classic", color: "from-blue-500 to-purple-500" },
    { id: "celebration", name: "Celebration", color: "from-rose-500 to-amber-500" },
    { id: "minimal", name: "Minimal", color: "from-slate-600 to-slate-400" },
    { id: "nature", name: "Nature", color: "from-emerald-500 to-teal-500" },
];

export default function GiftCardsPage() {
    const [selectedAmount, setSelectedAmount] = useState<number | null>(10000);
    const [customAmount, setCustomAmount] = useState("");
    const [selectedDesign, setSelectedDesign] = useState("classic");
    const [recipientName, setRecipientName] = useState("");
    const [recipientEmail, setRecipientEmail] = useState("");
    const [message, setMessage] = useState("");
    const [senderName, setSenderName] = useState("");

    const finalAmount = selectedAmount || parseInt(customAmount) || 0;

    const handlePurchase = () => {
        // In production, this would create an order and redirect to payment
        alert(`Gift card purchase initiated for KES ${finalAmount.toLocaleString()}`);
    };

    return (
        <div className="min-h-screen bg-background pt-32 pb-24">
            <div className="max-w-6xl mx-auto px-6">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-16"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full text-primary text-xs font-bold uppercase tracking-wider mb-6">
                        <Gift className="w-4 h-4" />
                        Digital Gift Cards
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-foreground mb-4">
                        Give the Gift of <span className="text-primary">Tech</span>
                    </h1>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                        Perfect for any occasion. Digital delivery within minutes. Redeemable across all products.
                    </p>
                </motion.div>

                <div className="grid lg:grid-cols-2 gap-12">
                    {/* Left - Configuration */}
                    <div className="space-y-8">
                        {/* Amount Selection */}
                        <div>
                            <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground mb-4">
                                Select Amount
                            </h2>
                            <div className="grid grid-cols-3 gap-3">
                                {giftCardAmounts.map((amount) => (
                                    <button
                                        key={amount.value}
                                        onClick={() => {
                                            setSelectedAmount(amount.value);
                                            setCustomAmount("");
                                        }}
                                        className={cn(
                                            "relative p-4 rounded-xl border text-center transition-all",
                                            selectedAmount === amount.value
                                                ? "border-primary bg-primary/10"
                                                : "border-border/50 hover:border-primary/30"
                                        )}
                                    >
                                        {amount.popular && (
                                            <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-primary text-white text-[9px] font-bold rounded-full">
                                                POPULAR
                                            </span>
                                        )}
                                        <span className="text-lg font-black text-foreground">
                                            KES {(amount.value / 1000)}K
                                        </span>
                                    </button>
                                ))}
                                <div className="col-span-3">
                                    <Input
                                        type="number"
                                        placeholder="Custom amount (min KES 1,000)"
                                        value={customAmount}
                                        onChange={(e) => {
                                            setCustomAmount(e.target.value);
                                            setSelectedAmount(null);
                                        }}
                                        className="h-12 bg-muted/20 border-border/50"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Design Selection */}
                        <div>
                            <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground mb-4">
                                Choose Design
                            </h2>
                            <div className="grid grid-cols-4 gap-3">
                                {giftCardDesigns.map((design) => (
                                    <button
                                        key={design.id}
                                        onClick={() => setSelectedDesign(design.id)}
                                        className={cn(
                                            "relative p-3 rounded-xl border transition-all text-center",
                                            selectedDesign === design.id
                                                ? "border-primary ring-2 ring-primary/20"
                                                : "border-border/50 hover:border-primary/30"
                                        )}
                                    >
                                        <div className={cn(
                                            "w-full aspect-video rounded-lg bg-gradient-to-br mb-2",
                                            design.color
                                        )} />
                                        <span className="text-xs font-bold text-foreground">
                                            {design.name}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Recipient Details */}
                        <div className="space-y-4">
                            <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground">
                                Recipient Details
                            </h2>
                            <Input
                                placeholder="Recipient Name"
                                value={recipientName}
                                onChange={(e) => setRecipientName(e.target.value)}
                                className="h-12 bg-muted/20 border-border/50"
                            />
                            <Input
                                type="email"
                                placeholder="Recipient Email"
                                value={recipientEmail}
                                onChange={(e) => setRecipientEmail(e.target.value)}
                                className="h-12 bg-muted/20 border-border/50"
                            />
                            <textarea
                                placeholder="Personal message (optional)"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                rows={3}
                                className="w-full p-4 bg-muted/20 border border-border/50 rounded-xl text-foreground placeholder:text-muted-foreground/40 resize-none outline-none focus:ring-2 focus:ring-primary/20"
                            />
                            <Input
                                placeholder="Your Name"
                                value={senderName}
                                onChange={(e) => setSenderName(e.target.value)}
                                className="h-12 bg-muted/20 border-border/50"
                            />
                        </div>
                    </div>

                    {/* Right - Preview */}
                    <div className="lg:sticky lg:top-32 space-y-6">
                        {/* Gift Card Preview */}
                        <div className="bg-muted/10 rounded-[2rem] p-6 border border-border/30">
                            <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground mb-4">
                                Preview
                            </h2>

                            <div className={cn(
                                "relative aspect-[1.6/1] rounded-2xl bg-gradient-to-br overflow-hidden p-6 flex flex-col justify-between",
                                giftCardDesigns.find(d => d.id === selectedDesign)?.color
                            )}>
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="text-white/80 text-xs font-bold uppercase tracking-wider">Trovestak</p>
                                        <p className="text-white/60 text-[10px]">Gift Card</p>
                                    </div>
                                    <Gift className="w-8 h-8 text-white/30" />
                                </div>

                                <div>
                                    <p className="text-white text-3xl font-black">
                                        KES {finalAmount.toLocaleString()}
                                    </p>
                                    {recipientName && (
                                        <p className="text-white/80 text-sm mt-1">
                                            For: {recipientName}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Summary */}
                            <div className="mt-6 space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Gift Card Value</span>
                                    <span className="font-bold text-foreground">KES {finalAmount.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Delivery</span>
                                    <span className="font-bold text-emerald-500">FREE (Email)</span>
                                </div>
                                <div className="pt-3 border-t border-border/30">
                                    <div className="flex justify-between">
                                        <span className="font-bold text-foreground">Total</span>
                                        <span className="text-xl font-black text-foreground">
                                            KES {finalAmount.toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <Button
                                onClick={handlePurchase}
                                disabled={finalAmount < 1000 || !recipientEmail || !recipientName}
                                className="w-full h-14 mt-6 bg-primary hover:bg-primary/90 rounded-xl font-black uppercase tracking-widest"
                            >
                                <CreditCard className="w-5 h-5 mr-2" />
                                Purchase Gift Card
                            </Button>
                        </div>

                        {/* Benefits */}
                        <div className="bg-muted/10 rounded-[2rem] p-6 border border-border/30">
                            <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground mb-4">
                                Why Gift Trovestak?
                            </h2>
                            <div className="space-y-4">
                                {[
                                    { icon: Sparkles, text: "Premium tech products" },
                                    { icon: Check, text: "Never expires" },
                                    { icon: Star, text: "Official EA warranty on all items" },
                                    { icon: Gift, text: "Instant email delivery" },
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                                            <item.icon className="w-4 h-4 text-primary" />
                                        </div>
                                        <span className="text-sm font-medium text-foreground">{item.text}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* How it Works */}
                <div className="mt-24">
                    <h2 className="text-3xl font-black tracking-tight text-foreground text-center mb-12">
                        How It Works
                    </h2>
                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            { step: 1, title: "Choose Amount", desc: "Select a preset value or enter a custom amount (KES 1,000 - KES 500,000)" },
                            { step: 2, title: "Personalize", desc: "Add the recipient's details and a custom message" },
                            { step: 3, title: "Send Instantly", desc: "We'll deliver the gift card to their email within minutes" },
                        ].map((item) => (
                            <div key={item.step} className="text-center">
                                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <span className="text-2xl font-black text-primary">{item.step}</span>
                                </div>
                                <h3 className="text-lg font-bold text-foreground mb-2">{item.title}</h3>
                                <p className="text-sm text-muted-foreground">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Terms */}
                <div className="mt-16 text-center">
                    <p className="text-xs text-muted-foreground max-w-2xl mx-auto">
                        Gift cards are digital only and delivered via email. They never expire and can be redeemed 
                        for any product on Trovestak. Cannot be exchanged for cash. Full terms available at checkout.
                    </p>
                </div>
            </div>
        </div>
    );
}
