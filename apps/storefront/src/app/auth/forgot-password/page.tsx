"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Mail, Loader2, CheckCircle } from "lucide-react";
import { resetPasswordAction } from "../actions";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        const formData = new FormData();
        formData.append("email", email);

        const result = await resetPasswordAction(formData);

        if (result?.error) {
            setError(result.error);
            setIsLoading(false);
        } else {
            setSuccess(true);
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center px-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="w-full max-w-sm"
            >
                <Link
                    href="/auth/login"
                    className="inline-flex items-center gap-2 text-sm text-[#6e6e73] hover:text-[#1d1d1f] transition-colors mb-8"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to sign in
                </Link>

                {success ? (
                    <div className="bg-white rounded-3xl p-10 shadow-sm text-center space-y-4">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                            <CheckCircle className="w-8 h-8 text-green-600" />
                        </div>
                        <h1 className="text-2xl font-semibold text-[#1d1d1f]">Check your email</h1>
                        <p className="text-[#6e6e73] text-sm leading-relaxed">
                            We sent a password reset link to <strong>{email}</strong>. Check your inbox and follow the link to reset your password.
                        </p>
                        <Link
                            href="/auth/login"
                            className="block w-full py-3 bg-black text-white rounded-full text-sm font-medium text-center hover:bg-black/90 transition-colors mt-4"
                        >
                            Back to sign in
                        </Link>
                    </div>
                ) : (
                    <div className="bg-white rounded-3xl p-10 shadow-sm">
                        <h1 className="text-2xl font-semibold text-[#1d1d1f] mb-2">Reset your password</h1>
                        <p className="text-[#6e6e73] text-sm mb-8">
                            Enter your email and we&apos;ll send you a link to reset your password.
                        </p>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-[#6e6e73] uppercase tracking-wide">
                                    Email
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6e6e73]" />
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="you@example.com"
                                        className="w-full h-12 pl-11 pr-4 rounded-xl bg-[#f5f5f7] text-[#1d1d1f] text-sm placeholder:text-[#6e6e73] focus:outline-none focus:ring-2 focus:ring-black/10"
                                    />
                                </div>
                            </div>

                            {error && (
                                <p className="text-sm text-red-600">{error}</p>
                            )}

                            <button
                                type="submit"
                                disabled={isLoading || !email}
                                className="w-full h-12 bg-black text-white rounded-full text-sm font-medium flex items-center justify-center gap-2 hover:bg-black/90 transition-colors disabled:opacity-50"
                            >
                                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send reset link"}
                            </button>
                        </form>
                    </div>
                )}
            </motion.div>
        </div>
    );
}
