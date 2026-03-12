"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    Smartphone,
    ChevronRight,
    CheckCircle2,
    AlertCircle,
    ArrowLeft,
    Search,
    ShieldCheck,
    Zap,
    Scale,
    Gem,
    Package
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCartStore } from "@/stores/cart";
import { cn } from "@/lib/utils";
import Link from "next/link";

type Step = "serial" | "condition" | "valuation" | "success";

interface TradeInState {
    serial: string;
    model: string;
    condition: "excellent" | "good" | "fair" | "broken";
    value: number;
}

export default function TradeInPage() {
    const [step, setStep] = useState<Step>("serial");
    const [state, setState] = useState<TradeInState>({
        serial: "",
        model: "iPhone 15 Pro",
        condition: "excellent",
        value: 0
    });
    const [error, setError] = useState<string | null>(null);
    const [isVerifying, setIsVerifying] = useState(false);

    const setTradeInCredit = useCartStore((s) => s.setTradeInCredit);
    const router = useRouter();

    const handleVerifySerial = async () => {
        setIsVerifying(true);
        setError(null);

        // Mocking verification delay
        await new Promise(r => setTimeout(r, 1500));

        if (state.serial.length < 8) {
            setError("SERIAL_IDENTIFIER_INVALID");
            setIsVerifying(false);
            return;
        }

        // Mocking dynamic model detection based on serial
        const isTrovestak = state.serial.startsWith("TRV");
        setState(prev => ({
            ...prev,
            model: isTrovestak ? "Apple iPhone 15 Pro Max (Mesh Certified)" : "Third-Party Mobile Device"
        }));

        setIsVerifying(false);
        setStep("condition");
    };

    const calculateValuation = () => {
        let baseValue = state.model.includes("15") ? 120000 : 80000;
        const conditionMultipliers = {
            excellent: 1,
            good: 0.85,
            fair: 0.6,
            broken: 0.2
        };

        const finalValue = Math.round(baseValue * conditionMultipliers[state.condition]);
        setState(prev => ({ ...prev, value: finalValue }));
        setStep("valuation");
    };

    const applyCredit = () => {
        setTradeInCredit(state.value);
        setStep("success");
    };

    return (
        <div className="min-h-screen pt-32 pb-24 px-4 md:px-8 bg-background selection:bg-primary/20 overflow-hidden">
            <div className="max-w-4xl mx-auto relative">
                {/* Background Graphics */}
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/5 blur-[120px] rounded-full -z-10" />
                <div className="absolute top-1/2 -left-40 w-80 h-80 bg-blue-500/5 blur-[100px] rounded-full -z-10" />

                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                >
                    <header className="mb-20 text-center">
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 mb-6"
                        >
                            <Scale className="w-3 h-3 text-primary" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-primary">Valuation Mesh v2.0</span>
                        </motion.div>
                        <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-foreground mb-6">
                            Trade-in <span className="text-muted-foreground/40 italic font-serif">Gateway.</span>
                        </h1>
                        <p className="text-lg text-muted-foreground font-medium max-w-xl mx-auto">
                            Transform your current equipment into liquid credit for your next mesh deployment.
                        </p>
                    </header>

                    {/* Progress Indicator */}
                    <div className="flex justify-center mb-16 gap-3">
                        {["serial", "condition", "valuation", "success"].map((s, idx) => (
                            <div
                                key={s}
                                className={cn(
                                    "h-1.5 rounded-full transition-all duration-500",
                                    step === s ? "w-12 bg-primary" : idx < ["serial", "condition", "valuation", "success"].indexOf(step) ? "w-4 bg-emerald-500" : "w-4 bg-muted/30"
                                )}
                            />
                        ))}
                    </div>

                    <div className="glass-card rounded-[3rem] p-8 md:p-14 border border-apple-border dark:border-apple-border-dark shadow-3xl overflow-hidden relative">
                        <AnimatePresence mode="wait">
                            {step === "serial" && (
                                <motion.div
                                    key="serial"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-10"
                                >
                                    <div className="flex items-center gap-4 py-4 px-6 bg-muted/30 rounded-2xl border border-apple-border dark:border-apple-border-dark">
                                        <Smartphone className="w-5 h-5 text-primary" />
                                        <div className="flex-1">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Device Identity</p>
                                            <p className="text-xs font-bold text-foreground">Specify the serial number or IMEI for automated detection.</p>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground ml-2">Serial Number / IMEI</label>
                                        <div className="relative group">
                                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
                                            <Input
                                                value={state.serial}
                                                onChange={(e) => setState(prev => ({ ...prev, serial: e.target.value.toUpperCase() }))}
                                                placeholder="ENTER IDENTIFIER (E.G. TRV-789X2...)"
                                                className="h-16 pl-16 pr-6 bg-muted/20 border-apple-border dark:border-apple-border-dark rounded-2xl text-lg font-black tracking-widest placeholder:text-muted-foreground/20 focus-visible:ring-primary/20 transition-all font-mono"
                                            />
                                        </div>
                                        {error && (
                                            <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 text-red-500 mt-2 ml-2">
                                                <AlertCircle className="w-4 h-4" />
                                                <span className="text-[10px] font-black uppercase tracking-widest">{error}</span>
                                            </motion.div>
                                        )}
                                    </div>

                                    <Button
                                        onClick={handleVerifySerial}
                                        disabled={isVerifying || !state.serial}
                                        className="w-full h-16 rounded-2xl bg-foreground text-background font-black uppercase tracking-[0.2em] text-[11px] hover:scale-[0.98] transition-all relative overflow-hidden group"
                                    >
                                        {isVerifying ? (
                                            <div className="w-5 h-5 border-2 border-background/20 border-t-background rounded-full animate-spin" />
                                        ) : (
                                            <>
                                                Initialize Verification
                                                <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-2 transition-transform" />
                                            </>
                                        )}
                                    </Button>

                                    <p className="text-center text-[10px] text-muted-foreground font-medium px-10 leading-relaxed uppercase tracking-wider opacity-60">
                                        Verification is performed against the global mesh registry and Trovestak acquisition records.
                                    </p>
                                </motion.div>
                            )}

                            {step === "condition" && (
                                <motion.div
                                    key="condition"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-10"
                                >
                                    <header>
                                        <div className="flex items-center gap-3 mb-2">
                                            <Smartphone className="w-5 h-5 text-primary" />
                                            <h2 className="text-2xl font-black uppercase tracking-tighter text-foreground">{state.model}</h2>
                                        </div>
                                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Identify the physical state of your node.</p>
                                    </header>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {[
                                            { id: "excellent", label: "FLAWLESS / MINT", desc: "No visible scratches, 100% functionality.", icon: <Gem className="w-5 h-5" /> },
                                            { id: "good", label: "STANDARD USE", desc: "Minor cosmetic wear, no structural damage.", icon: <CheckCircle2 className="w-5 h-5" /> },
                                            { id: "fair", label: "HEAVY WEAR", desc: "Scratches, minor dents, fully functional.", icon: <Smartphone className="w-5 h-5" /> },
                                            { id: "broken", label: "COMPROMISED", desc: "Screen cracks, battery issues, or major dents.", icon: <AlertCircle className="w-5 h-5" /> }
                                        ].map((cond) => (
                                            <button
                                                key={cond.id}
                                                onClick={() => setState(prev => ({ ...prev, condition: cond.id as any }))}
                                                className={cn(
                                                    "p-6 rounded-2xl border text-left transition-all relative overflow-hidden group",
                                                    state.condition === cond.id
                                                        ? "bg-primary/5 border-primary shadow-lg shadow-primary/5"
                                                        : "bg-muted/10 border-apple-border dark:border-apple-border-dark hover:border-primary/30"
                                                )}
                                            >
                                                <div className={cn(
                                                    "w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110",
                                                    state.condition === cond.id ? "bg-primary text-white" : "bg-muted/30 text-muted-foreground"
                                                )}>
                                                    {cond.icon}
                                                </div>
                                                <h3 className="text-[11px] font-black uppercase tracking-widest mb-1">{cond.label}</h3>
                                                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-tight opacity-60">{cond.desc}</p>
                                                {state.condition === cond.id && (
                                                    <motion.div layoutId="active" className="absolute top-4 right-4 text-primary">
                                                        <CheckCircle2 className="w-4 h-4" />
                                                    </motion.div>
                                                )}
                                            </button>
                                        ))}
                                    </div>

                                    <div className="flex gap-4">
                                        <Button variant="outline" onClick={() => setStep("serial")} className="flex-1 h-14 rounded-xl font-black uppercase tracking-widest text-[10px] border-apple-border dark:border-apple-border-dark">
                                            <ArrowLeft className="w-4 h-4 mr-2" />
                                            REVISE ID
                                        </Button>
                                        <Button onClick={calculateValuation} className="flex-[2] h-14 rounded-xl bg-foreground text-background font-black uppercase tracking-widest text-[10px] hover:scale-[0.98] transition-all">
                                            GENERATE VALUATION
                                            <Zap className="w-4 h-4 ml-2" />
                                        </Button>
                                    </div>
                                </motion.div>
                            )}

                            {step === "valuation" && (
                                <motion.div
                                    key="valuation"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="text-center space-y-12"
                                >
                                    <div>
                                        <p className="text-[11px] font-black uppercase tracking-[0.3em] text-muted-foreground mb-4">Estimated Acquisition Value</p>
                                        <motion.h2
                                            initial={{ scale: 0.9, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            className="text-6xl md:text-8xl font-black tracking-tighter text-foreground"
                                        >
                                            <span className="text-3xl opacity-20 mr-2 font-medium">KES</span>
                                            {state.value.toLocaleString()}
                                        </motion.h2>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="p-6 rounded-2xl bg-muted/20 border border-apple-border dark:border-apple-border-dark">
                                            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1">Model Family</p>
                                            <p className="text-xs font-black uppercase tracking-tighter truncate">{state.model.split(' ')[1]}</p>
                                        </div>
                                        <div className="p-6 rounded-2xl bg-muted/20 border border-apple-border dark:border-apple-border-dark">
                                            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1">Assessed State</p>
                                            <p className="text-xs font-black uppercase tracking-tighter">{state.condition}</p>
                                        </div>
                                        <div className="p-6 rounded-2xl bg-emerald-500/5 border border-emerald-500/20">
                                            <p className="text-[9px] font-black uppercase tracking-widest text-emerald-500 mb-1">Redeemable Credit</p>
                                            <p className="text-xs font-black uppercase tracking-tighter text-emerald-500">LIQUID CREDIT</p>
                                        </div>
                                    </div>

                                    <div className="space-y-4 pt-6">
                                        <Button
                                            onClick={applyCredit}
                                            className="w-full h-16 rounded-2xl bg-foreground text-background font-black uppercase tracking-[0.2em] text-[11px] hover:scale-[0.98] transition-all shadow-2xl shadow-foreground/20"
                                        >
                                            Accept Quote & Sync Credit
                                        </Button>
                                        <button onClick={() => setStep("condition")} className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors">
                                            DISCARD QUOTE & RE-ASSESS
                                        </button>
                                    </div>

                                    <div className="p-6 bg-primary/5 rounded-2xl border border-primary/10 flex items-start gap-4 text-left">
                                        <ShieldCheck className="w-5 h-5 text-primary mt-0.5" />
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase leading-relaxed tracking-wider">
                                            By accepting, you agree to verified inspection upon equipment handover. Final value may adjust +/- 10% based on physical audit.
                                        </p>
                                    </div>
                                </motion.div>
                            )}

                            {step === "success" && (
                                <motion.div
                                    key="success"
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="text-center space-y-10 py-10"
                                >
                                    <div className="relative inline-block">
                                        <div className="w-24 h-24 bg-emerald-500 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-emerald-500/30">
                                            <Zap className="w-10 h-10 text-white fill-white" />
                                        </div>
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={{ delay: 0.3 }}
                                            className="absolute -bottom-2 -right-2 w-10 h-10 bg-white dark:bg-black rounded-full border-4 border-emerald-500 flex items-center justify-center text-emerald-500"
                                        >
                                            <CheckCircle2 className="w-5 h-5" />
                                        </motion.div>
                                    </div>

                                    <div>
                                        <h2 className="text-4xl font-black uppercase tracking-tighter text-foreground mb-4">Credit Synced.</h2>
                                        <p className="text-muted-foreground font-medium max-w-sm mx-auto leading-relaxed">
                                            Your trade-in credit of <span className="text-foreground font-black tracking-tight">KES {state.value.toLocaleString()}</span> has been applied to your session.
                                        </p>
                                    </div>

                                    <div className="p-8 bg-muted/20 rounded-[2.5rem] border border-apple-border dark:border-apple-border-dark flex flex-col items-center gap-6">
                                        <div className="flex items-center gap-3 py-2 px-4 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">LIVE BALANCE ACTIVE</span>
                                        </div>
                                        <Button
                                            asChild
                                            className="w-full h-14 rounded-xl bg-foreground text-background font-black uppercase tracking-widest text-[10px]"
                                        >
                                            <Link href="/store">Initialize Deployment</Link>
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            asChild
                                            className="text-[10px] font-black uppercase tracking-widest text-muted-foreground"
                                        >
                                            <Link href="/cart">Review Acquisitions</Link>
                                        </Button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Footer Stats / Support */}
                    <footer className="mt-20 flex flex-wrap justify-center gap-10 opacity-30">
                        <div className="flex items-center gap-3">
                            <ShieldCheck className="w-4 h-4" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Secured Node Registry</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <Scale className="w-4 h-4" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Market-Indexed Value</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <Gem className="w-4 h-4" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Premium Mesh Exchange</span>
                        </div>
                    </footer>
                </motion.div>
            </div>
        </div>
    );
}
