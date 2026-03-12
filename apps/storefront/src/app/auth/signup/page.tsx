"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Mail, Lock, User, Eye, EyeOff, Loader2, CheckCircle } from "lucide-react";
import { signUpAction } from "../actions";

export default function SignupPage() {
    const router = useRouter();
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        const formData = new FormData();
        formData.append("email", email);
        formData.append("password", password);
        formData.append("fullName", fullName);

        const result = await signUpAction(formData);

        if (result?.error) {
            setError(result.error);
            setIsLoading(false);
        } else {
            setSuccess(true);
            setIsLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-8">
                <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full max-w-md text-center"
                >
                    <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-8">
                        <CheckCircle className="w-10 h-10 text-emerald-500" />
                    </div>
                    <h2 className="text-3xl font-black tracking-tight text-foreground mb-4">
                        Check Your Email
                    </h2>
                    <p className="text-muted-foreground mb-8">
                        We sent a confirmation link to <strong className="text-foreground">{email}</strong>.
                        Click the link to activate your account.
                    </p>
                    <Link
                        href="/auth/login"
                        className="inline-block px-8 py-4 bg-primary text-white rounded-xl font-black uppercase tracking-widest hover:bg-primary/90 transition-all"
                    >
                        Back to Sign In
                    </Link>
                </motion.div>
            </div>
        );
    }

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
                        Join Us<span className="text-primary">.</span>
                    </h1>
                    <p className="text-lg text-muted-foreground leading-relaxed">
                        Create an account to unlock exclusive deals, track orders, and enjoy personalized recommendations.
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
                            Create Account
                        </h2>
                        <p className="text-muted-foreground">
                            Already have an account?{" "}
                            <Link href="/auth/login" className="text-primary hover:underline font-medium">
                                Sign in
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

                    <form onSubmit={handleSignup} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground/60">
                                Full Name
                            </label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/40" />
                                <input
                                    type="text"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    required
                                    className="w-full pl-12 pr-4 py-4 bg-muted/30 border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/30 transition-all font-medium"
                                    placeholder="John Doe"
                                />
                            </div>
                        </div>

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
                                    minLength={8}
                                    className="w-full pl-12 pr-12 py-4 bg-muted/30 border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/30 transition-all font-medium"
                                    placeholder="Min. 8 characters"
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

                        <label className="flex items-start gap-3 cursor-pointer">
                            <input type="checkbox" required className="w-4 h-4 mt-1 rounded border-border" />
                            <span className="text-sm text-muted-foreground leading-relaxed">
                                I agree to the{" "}
                                <Link href="/terms" className="text-foreground hover:underline">Terms of Service</Link>
                                {" "}and{" "}
                                <Link href="/privacy" className="text-foreground hover:underline">Privacy Policy</Link>
                            </span>
                        </label>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-4 bg-primary text-white rounded-xl font-black uppercase tracking-widest hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Creating Account...
                                </>
                            ) : (
                                "Create Account"
                            )}
                        </button>
                    </form>
                </motion.div>
            </div>
        </div>
    );
}
