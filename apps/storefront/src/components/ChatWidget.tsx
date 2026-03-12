"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Hand, Mic } from "lucide-react";
import { cn } from "@/lib/utils";
import { ConciergeVoice } from "./concierge/ConciergeVoice";

export function ChatWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [message, setMessage] = useState("");
    const [isAnimating, setIsAnimating] = useState(false);
    const [isVoiceOpen, setIsVoiceOpen] = useState(false);

    useEffect(() => {
        // Pulse animation after 5 seconds
        const timer = setTimeout(() => {
            setIsAnimating(true);
        }, 5000);

        return () => clearTimeout(timer);
    }, []);

    const phoneNumber = "254700000000"; // Replace with actual WhatsApp number
    const defaultMessage = "Hi! I need help with a product on Trovestak.";

    const handleWhatsApp = () => {
        const encodedMessage = encodeURIComponent(message || defaultMessage);
        window.open(`https://wa.me/${phoneNumber}?text=${encodedMessage}`, "_blank");
        setMessage("");
        setIsOpen(false);
    };

    return (
        <>
            {/* Chat Button */}
            <motion.button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all",
                    isOpen 
                        ? "bg-foreground text-background" 
                        : "bg-green-500 text-white"
                )}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                animate={isAnimating && !isOpen ? { scale: [1, 1.2, 1] } : {}}
            >
                <AnimatePresence mode="wait">
                    {isOpen ? (
                        <motion.div
                            key="close"
                            initial={{ rotate: -90, opacity: 0 }}
                            animate={{ rotate: 0, opacity: 1 }}
                            exit={{ rotate: 90, opacity: 0 }}
                        >
                            <X className="w-6 h-6" />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="chat"
                            initial={{ rotate: 90, opacity: 0 }}
                            animate={{ rotate: 0, opacity: 1 }}
                            exit={{ rotate: -90, opacity: 0 }}
                        >
                            <MessageCircle className="w-6 h-6" />
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.button>

            {/* Notification Badge */}
            {!isOpen && (
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="fixed bottom-16 right-6 z-50 bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center"
                >
                    1
                </motion.div>
            )}

            {/* Chat Panel */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        className="fixed bottom-24 right-6 z-50 w-80 bg-background border border-border/50 rounded-2xl shadow-2xl overflow-hidden"
                    >
                        {/* Header */}
                        <div className="bg-green-500 text-white p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                                    <MessageCircle className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold">Trovestak Support</h3>
                                    <p className="text-xs text-white/80">Typically replies instantly</p>
                                </div>
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div className="p-4 h-48 bg-muted/20">
                            <div className="bg-white dark:bg-muted/30 rounded-2xl rounded-tl-none p-3 shadow-sm max-w-[80%]">
                                <p className="text-sm flex items-center gap-2">
                                    <Hand className="w-4 h-4" /> Hi! Need help? Chat with us on WhatsApp or talk to our AI Concierge.
                                </p>
                                <span className="text-[10px] text-muted-foreground mt-1 block">Just now</span>
                            </div>

                            {/* Voice Launcher */}
                            <button 
                                onClick={() => { setIsVoiceOpen(true); setIsOpen(false); }}
                                className="mt-4 w-full p-4 bg-primary/10 rounded-2xl flex items-center gap-4 hover:bg-primary/20 transition-all group"
                            >
                                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                                    <Mic className="w-5 h-5" />
                                </div>
                                <div className="text-left">
                                    <p className="text-sm font-bold">Talk to TroveVoice</p>
                                    <p className="text-[10px] text-muted-foreground">ML-Powered Personal Shopper</p>
                                </div>
                            </button>
                        </div>

                        {/* Input */}
                        <div className="p-4 border-t border-border/30">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    placeholder="Type a message..."
                                    className="flex-1 h-10 px-4 bg-muted/30 rounded-xl text-sm outline-none focus:ring-2 focus:ring-green-500/30"
                                />
                                <button
                                    onClick={handleWhatsApp}
                                    className="w-10 h-10 bg-green-500 text-white rounded-xl flex items-center justify-center hover:bg-green-600 transition-colors"
                                >
                                    <Send className="w-4 h-4" />
                                </button>
                            </div>
                            <p className="text-[10px] text-muted-foreground text-center mt-3">
                                Opens WhatsApp to continue chat
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* TroveVoice Modal */}
            <AnimatePresence>
                {isVoiceOpen && (
                    <ConciergeVoice onClose={() => setIsVoiceOpen(false)} />
                )}
            </AnimatePresence>
        </>
    );
}
