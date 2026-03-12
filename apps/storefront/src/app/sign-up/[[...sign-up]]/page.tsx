"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signUpAction } from "@/app/auth/actions";
import { motion } from "framer-motion";
import { Loader2, ArrowRight, Mail, Lock, User } from "lucide-react";

export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("email", email);
    formData.append("password", password);
    formData.append("fullName", fullName);

    const result = await signUpAction(formData);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    } else {
      setSuccess(true);
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-white/80 dark:bg-apple-dark/80 backdrop-blur-xl rounded-3xl p-8 border border-apple-border/50 dark:border-apple-border-dark/50 shadow-2xl text-center"
        >
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <Mail className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-apple-text dark:text-white mb-4">Check your email</h2>
          <p className="text-apple-text-secondary dark:text-gray-400 mb-8">
            We&apos;ve sent a confirmation link to <strong>{email}</strong>. Please click the link to activate your account.
          </p>
          <Link
            href="/sign-in"
            className="inline-block py-3 px-8 bg-apple-blue hover:bg-apple-blue-hover text-white rounded-xl font-medium transition-all"
          >
            Go to Sign In
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <Link href="/" className="text-3xl font-bold tracking-tight text-apple-text dark:text-white">
            Trovestak
          </Link>
          <h1 className="mt-6 text-2xl font-semibold text-apple-text dark:text-white">
            Create your account
          </h1>
          <p className="mt-2 text-apple-text-secondary dark:text-gray-400">
            Join the Trovestak ecosystem today
          </p>
        </div>

        <div className="bg-white/80 dark:bg-apple-dark/80 backdrop-blur-xl rounded-3xl p-8 border border-apple-border/50 dark:border-apple-border-dark/50 shadow-2xl">
          <form onSubmit={handleSignUp} className="space-y-4">
            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-xl text-red-600 dark:text-red-400 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-apple-text-secondary" />
                <input
                  type="text"
                  placeholder="Full Name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-apple-gray/50 dark:bg-gray-900/50 rounded-xl border border-apple-border dark:border-apple-border-dark focus:outline-none focus:ring-2 focus:ring-apple-blue transition-all"
                  required
                />
              </div>

              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-apple-text-secondary" />
                <input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-apple-gray/50 dark:bg-gray-900/50 rounded-xl border border-apple-border dark:border-apple-border-dark focus:outline-none focus:ring-2 focus:ring-apple-blue transition-all"
                  required
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-apple-text-secondary" />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-apple-gray/50 dark:bg-gray-900/50 rounded-xl border border-apple-border dark:border-apple-border-dark focus:outline-none focus:ring-2 focus:ring-apple-blue transition-all"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center space-x-2 py-3 bg-apple-blue hover:bg-apple-blue-hover text-white rounded-xl font-medium transition-all transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-apple-border/50 dark:border-apple-border-dark/50">
            <p className="text-center text-sm text-apple-text-secondary dark:text-gray-400">
              Already have an account?{" "}
              <Link
                href="/sign-in"
                className="text-apple-blue hover:underline font-medium"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
