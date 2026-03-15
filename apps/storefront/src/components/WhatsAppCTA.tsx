"use client";

import { MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface WhatsAppCTAProps {
    productName: string;
    productUrl?: string;
    className?: string;
    variant?: "primary" | "outline";
}

export function WhatsAppCTA({ productName, productUrl, className, variant = "outline" }: WhatsAppCTAProps) {
    const phoneNumber = "254708594339";
    const currentUrl = typeof window !== "undefined" ? window.location.href : "";
    const url = productUrl || currentUrl;
    
    const message = `Hi! I'm interested in the ${productName}. Here is the link: ${url}`;
    
    const handleWhatsApp = () => {
        const encodedMessage = encodeURIComponent(message);
        window.open(`https://wa.me/${phoneNumber}?text=${encodedMessage}`, "_blank");
    };

    return (
        <button
            onClick={handleWhatsApp}
            className={cn(
                "flex items-center justify-center gap-2 px-6 h-12 rounded-2xl font-black text-sm uppercase tracking-widest transition-all active:scale-95",
                variant === "primary" 
                    ? "bg-[#25D366] text-white hover:bg-[#128C7E] shadow-lg shadow-green-500/20" 
                    : "bg-muted/30 border border-border/50 text-foreground hover:border-[#25D366] hover:text-[#25D366]",
                className
            )}
        >
            <MessageCircle className="w-5 h-5" />
            Buy via WhatsApp
        </button>
    );
}
