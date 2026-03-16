"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { updatePasswordAction } from "@/app/auth/actions";
import { Lock, Check, AlertCircle, Loader2 } from "lucide-react";

export default function ResetPasswordPage() {
    const router = useRouter();
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirm) {
            setError("Passwords do not match.");
            return;
        }
        if (password.length < 8) {
            setError("Password must be at least 8 characters.");
            return;
        }

        setIsLoading(true);
        setError("");

        const formData = new FormData();
        formData.set("password", password);
        const result = await updatePasswordAction(formData);

        setIsLoading(false);

        if (result.error) {
            setError(result.error);
        } else {
            setSuccess(true);
            setTimeout(() => router.push("/auth/login"), 2500);
        }
    };

    return (
        <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center px-4 pt-[44px]">
            <div className="w-full max-w-sm">
                <div className="text-center mb-8">
                    <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center mx-auto mb-5">
                        <Lock className="w-6 h-6 text-white" />
                    </div>
                    <h1 className="text-[28px] font-semibold text-[#1d1d1f]">Set new password</h1>
                    <p className="text-[#6e6e73] mt-2 text-[15px]">Choose a strong password for your account.</p>
                </div>

                {success ? (
                    <div className="bg-white rounded-2xl p-8 text-center">
                        <div className="w-12 h-12 bg-[#34c759] rounded-full flex items-center justify-center mx-auto mb-4">
                            <Check className="w-6 h-6 text-white" />
                        </div>
                        <p className="text-[17px] font-medium text-[#1d1d1f] mb-1">Password updated!</p>
                        <p className="text-[14px] text-[#6e6e73]">Redirecting to login...</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-8 space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-[12px] font-medium text-[#6e6e73]">New Password</label>
                            <input
                                type="password"
                                required
                                minLength={8}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="At least 8 characters"
                                className="w-full h-11 px-4 rounded-xl bg-[#f5f5f7] text-[14px] text-[#1d1d1f] outline-none focus:ring-2 focus:ring-black/20 placeholder:text-[#aaaaaa]"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[12px] font-medium text-[#6e6e73]">Confirm Password</label>
                            <input
                                type="password"
                                required
                                value={confirm}
                                onChange={(e) => setConfirm(e.target.value)}
                                placeholder="Repeat your password"
                                className="w-full h-11 px-4 rounded-xl bg-[#f5f5f7] text-[14px] text-[#1d1d1f] outline-none focus:ring-2 focus:ring-black/20 placeholder:text-[#aaaaaa]"
                            />
                        </div>

                        {error && (
                            <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-200">
                                <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                                <p className="text-[13px] text-red-700">{error}</p>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full h-11 bg-black text-white rounded-full text-[15px] font-medium hover:bg-[#1d1d1f] transition-colors flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
                        >
                            {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Updating...</> : "Update Password"}
                        </button>

                        <p className="text-center text-[13px] text-[#6e6e73]">
                            <Link href="/auth/login" className="text-[#0071e3] hover:underline">Back to login</Link>
                        </p>
                    </form>
                )}
            </div>
        </div>
    );
}
