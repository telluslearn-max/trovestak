"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import Navbar from "@/components/navbar";
import { Footer } from "@/components/Footer";
import { CompareBar } from "@/components/CompareDrawer";
import { ChatWidget } from "@/components/ChatWidget";

export function StorefrontWrapper({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isAdmin = pathname?.startsWith("/admin");

    // Admin has its own ThemeWrapper — do NOT wrap it in next-themes
    // because next-themes would conflict with the admin's dark class management.
    if (isAdmin) {
        return <>{children}</>;
    }

    return (
        <NextThemesProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange={false}
        >
            <Navbar />
            <main className="min-h-screen">
                {children}
            </main>
            <CompareBar />
            <ChatWidget />
            <Footer />
        </NextThemesProvider>
    );
}
