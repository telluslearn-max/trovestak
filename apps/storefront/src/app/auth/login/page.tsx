"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Mail, Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import { signInAction } from "../actions";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        const formData = new FormData();
        formData.append("email", email);
        formData.append("password", password);

        const result = await signInAction(formData);

        if (result?.error) {
            setError(result.error);
            setIsLoading(false);
        } else {
            router.push("/store");
            router.refresh();
        }
    };

    return (
        <div className="min-h-screen bg-background flex">
            {/* Left Panel - Branding */}
            <div className="hidden lg:flex lg:w-1/2 bg-primary/5 items-center justify-center p-12">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-md text-center"
                >
                    <h1 className="text-6xl font-black tracking-tighter text-foreground mb-6">
                        Welcome<span className="text-primary">.</span>
                    </h1>
                    <p className="text-lg text-muted-foreground leading-relaxed">
                        Sign in to access your orders, trade-in history, and exclusive member benefits.
                    </p>
                </motion.div>
            </div>

            {/* Right Panel - Form */}
            <div className="flex-1 flex items-center justify-center p-8">
                <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full max-w-md"
                >
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-10 text-sm font-medium"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Store
                    </Link>

                    <div className="mb-10">
                        <h2 className="text-4xl font-black tracking-tight text-foreground mb-2">
                            Sign In
                        </h2>
                        <p className="text-muted-foreground">
                            New customer?{" "}
                            <Link href="/auth/signup" className="text-primary hover:underline font-medium">
                                Create an account
                            </Link>
                        </p>
                    </div>

                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm font-medium"
                        >
                            {error}
                        </motion.div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground/60">
                                Email Address
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/40" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="w-full pl-12 pr-4 py-4 bg-muted/30 border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/30 transition-all font-medium"
                                    placeholder="you@example.com"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground/60">
                                Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/40" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="w-full pl-12 pr-12 py-4 bg-muted/30 border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/30 transition-all font-medium"
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" className="w-4 h-4 rounded border-border" />
                                <span className="text-sm text-muted-foreground">Remember me</span>
                            </label>
                            <Link href="/auth/forgot-password" className="text-sm text-primary hover:underline font-medium">
                                Forgot password?
                            </Link>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-4 bg-primary text-white rounded-xl font-black uppercase tracking-widest hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Signing In...
                                </>
                            ) : (
                                "Sign In"
                            )}
                        </button>
                    </form>

                    <div className="mt-8 pt-8 border-t border-border">
                        <p className="text-xs text-muted-foreground text-center leading-relaxed">
                            By signing in, you agree to our{" "}
                            <Link href="/terms" className="text-foreground hover:underline">Terms of Service</Link>
                            {" "}and{" "}
                            <Link href="/privacy" className="text-foreground hover:underline">Privacy Policy</Link>
                        </p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
