"use client";

import Link from "next/link";
import { Package, RefreshCcw, Home, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

interface ErrorPageProps {
  title?: string;
  message?: string;
  showHome?: boolean;
  showStore?: boolean;
  showRetry?: boolean;
}

export function ErrorPage({
  title = "Something went wrong",
  message = "We encountered an unexpected error while loading this page. Our team has been notified and we're working on a fix.",
  showHome = true,
  showStore = true,
  showRetry = true,
}: ErrorPageProps) {
  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6">
      <div className="w-full max-w-xl text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="w-24 h-24 bg-muted/50 rounded-3xl flex items-center justify-center mx-auto mb-6 relative">
             <Package className="w-12 h-12 text-muted-foreground opacity-40" />
             <div className="absolute -top-1 -right-1 w-6 h-6 bg-primary/20 rounded-full animate-pulse border border-primary/50" />
          </div>
          
          <h1 className="text-4xl font-black tracking-tight text-foreground mb-4">
            {title}
          </h1>
          <p className="text-lg text-muted-foreground mb-12 leading-relaxed">
            {message}
          </p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="flex flex-wrap items-center justify-center gap-4"
        >
          {showHome && (
            <Link
              href="/"
              className="px-8 py-3 bg-foreground text-background rounded-full font-bold text-sm transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
            >
              <Home className="w-4 h-4" />
              Return Home
            </Link>
          )}

          {showStore && (
            <Link
              href="/store"
              className="px-8 py-3 bg-muted text-foreground border border-border rounded-full font-bold text-sm transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
            >
              <Package className="w-4 h-4" />
              Store
            </Link>
          )}

          {showRetry && (
            <button
               onClick={() => window.location.reload()}
               className="px-8 py-3 bg-primary/10 text-primary border border-primary/20 rounded-full font-bold text-sm transition-all hover:bg-primary/20 flex items-center gap-2"
            >
              <RefreshCcw className="w-4 h-4" />
              Try Again
            </button>
          )}
        </motion.div>

        <p className="mt-16 text-muted-foreground/40 text-xs font-medium uppercase tracking-[0.2em]">
          Error Code: TROVESTAK_SSR_CRASH_PROTECTED
        </p>
      </div>
    </div>
  );
}
