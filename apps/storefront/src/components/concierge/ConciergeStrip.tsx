"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, X, ShoppingCart, Zap } from "lucide-react";
import { useAudioPipeline } from "@/hooks/useAudioPipeline";
import { useSessionId } from "@/hooks/useSessionId";
import { supabase } from "@/lib/supabase";

// ─── Types ──────────────────────────────────────────────────────────────────

type StripMode = "ambient" | "nudge" | "guided" | "transaction" | "voice";

interface MemoryTag {
    label: string;
    color: "purple" | "green" | "amber";
}

interface PageContext {
    type: "home" | "product" | "store" | "cart" | "checkout" | "other";
    productId?: string;
    productName?: string;
    category?: string;
}

// ─── Page context from pathname ──────────────────────────────────────────────

function getPageContext(pathname: string): PageContext {
    if (pathname === "/") return { type: "home" };
    if (pathname.startsWith("/products/")) return { type: "product" };
    if (pathname.startsWith("/store")) return { type: "store" };
    if (pathname.startsWith("/cart")) return { type: "cart" };
    if (pathname.startsWith("/checkout")) return { type: "checkout" };
    return { type: "other" };
}

function getNudgeMessage(ctx: PageContext, tags: MemoryTag[]): string {
    const hasPrefs = tags.some(t => t.color === "purple");
    if (ctx.type === "product" && ctx.productName) {
        return hasPrefs
            ? `Based on your taste profile, I can compare ${ctx.productName} with similar options.`
            : `Tell me your budget and I'll find the best deal on ${ctx.productName}.`;
    }
    if (ctx.type === "cart") return "Ready to pay? I can initiate M-Pesa checkout right here.";
    if (ctx.type === "store") return "Looking for something specific? I know the full catalog.";
    return "Ask me anything — price, specs, or which to buy.";
}

// ─── Memory Tags ─────────────────────────────────────────────────────────────

async function fetchMemoryTags(sessionId: string): Promise<MemoryTag[]> {
    const tags: MemoryTag[] = [];
    const { data: prefs } = await supabase
        .from("user_preferences")
        .select("categories, brands, budget_min, budget_max")
        .eq("session_id", sessionId)
        .single();

    if (prefs?.categories?.length) {
        tags.push({ label: prefs.categories[0], color: "purple" });
    }
    if (prefs?.brands?.length) {
        tags.push({ label: prefs.brands[0], color: "purple" });
    }
    if (prefs?.budget_max) {
        tags.push({ label: `≤ KES ${(prefs.budget_max as number).toLocaleString()}`, color: "amber" });
    }

    const { count } = await supabase
        .from("user_events")
        .select("id", { count: "exact", head: true })
        .eq("session_id", sessionId);

    if (count && count > 0) {
        tags.push({ label: `${count} signals`, color: "green" });
    }

    return tags.slice(0, 4);
}

// ─── Tag pill ────────────────────────────────────────────────────────────────

function MemoryPill({ tag }: { tag: MemoryTag }) {
    const colors = {
        purple: "bg-purple-500/20 text-purple-300 border-purple-500/30",
        green:  "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
        amber:  "bg-amber-500/20 text-amber-300 border-amber-500/30",
    };
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${colors[tag.color]}`}>
            {tag.label}
        </span>
    );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function ConciergeStrip() {
    const pathname = usePathname();
    const rawSessionId = useSessionId();
    const sessionId = rawSessionId ?? "anonymous";

    const [mode, setMode] = useState<StripMode>("ambient");
    const [dismissed, setDismissed] = useState(false);
    const [memoryTags, setMemoryTags] = useState<MemoryTag[]>([]);
    const [nudgeMessage, setNudgeMessage] = useState("");
    const [pageContext, setPageContext] = useState<PageContext>({ type: "home" });

    const nudgeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const scrollTracked = useRef(false);
    const hasFetchedTags = useRef(false);

    const handleAgentText = useCallback((text: string) => {
        setNudgeMessage(text);
    }, []);

    const audio = useAudioPipeline(sessionId, handleAgentText);

    // Update page context on route change
    useEffect(() => {
        const ctx = getPageContext(pathname);
        setPageContext(ctx);
        // Reset nudge timer on page change
        scrollTracked.current = false;
        if (nudgeTimer.current) clearTimeout(nudgeTimer.current);
        if (mode === "nudge" || mode === "guided") setMode("ambient");

        // Product page: nudge after 8s
        if (ctx.type === "product" || ctx.type === "store") {
            nudgeTimer.current = setTimeout(() => {
                if (mode === "ambient") {
                    setNudgeMessage(getNudgeMessage(ctx, memoryTags));
                    setMode("nudge");
                }
            }, 8000);
        }

        return () => {
            if (nudgeTimer.current) clearTimeout(nudgeTimer.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pathname]);

    // Scroll-based nudge (60% scroll depth)
    useEffect(() => {
        const handleScroll = () => {
            if (scrollTracked.current || mode !== "ambient") return;
            const depth = (window.scrollY + window.innerHeight) / document.documentElement.scrollHeight;
            if (depth > 0.6) {
                scrollTracked.current = true;
                setNudgeMessage(getNudgeMessage(pageContext, memoryTags));
                setMode("nudge");
            }
        };
        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, [mode, pageContext, memoryTags]);

    // Fetch memory tags once session is ready
    useEffect(() => {
        if (!rawSessionId || hasFetchedTags.current) return;
        hasFetchedTags.current = true;
        fetchMemoryTags(rawSessionId).then(tags => {
            setMemoryTags(tags);
        });
    }, [rawSessionId]);

    // Cart page: auto-nudge for transaction mode
    useEffect(() => {
        if (pageContext.type === "cart" && mode === "ambient") {
            nudgeTimer.current = setTimeout(() => {
                setNudgeMessage("Ready to checkout? I can walk you through M-Pesa payment.");
                setMode("nudge");
            }, 3000);
        }
        return () => { if (nudgeTimer.current) clearTimeout(nudgeTimer.current); };
    }, [pageContext.type, mode]);

    const handleMicToggle = useCallback(async () => {
        if (mode === "voice") {
            audio.stop();
            setMode("ambient");
        } else {
            setMode("voice");
            await audio.start();
        }
    }, [mode, audio]);

    const handleDismissNudge = useCallback(() => {
        setMode("ambient");
    }, []);

    const handleDismissStrip = useCallback(() => {
        audio.stop();
        setDismissed(true);
    }, [audio]);

    if (dismissed) return null;

    const isVoice = mode === "voice";
    const isExpanded = mode === "nudge" || mode === "guided" || mode === "voice";

    return (
        <motion.div
            layout
            className="fixed bottom-0 left-0 right-0 z-50 flex flex-col"
            style={{ backdropFilter: "blur(12px)" }}
        >
            {/* Memory tags sub-strip */}
            <AnimatePresence>
                {memoryTags.length > 0 && (
                    <motion.div
                        key="tags"
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 4 }}
                        className="flex items-center gap-1.5 px-4 py-1 bg-black/80 border-t border-white/5"
                    >
                        <span className="text-[9px] uppercase tracking-widest text-white/30 mr-1">Memory</span>
                        {memoryTags.map((tag, i) => (
                            <MemoryPill key={i} tag={tag} />
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main strip */}
            <motion.div
                layout
                className="bg-black/90 border-t border-white/10 text-white"
                animate={{ height: isExpanded ? "auto" : "52px" }}
                transition={{ type: "spring", stiffness: 400, damping: 35 }}
            >
                {/* Ambient / Voice bar */}
                <div className="flex items-center gap-3 px-4 h-[52px]">
                    {/* Avatar pulse */}
                    <div className="relative flex-shrink-0">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center ${
                            isVoice && audio.agentSpeaking
                                ? "bg-primary"
                                : isVoice && audio.isListening
                                    ? "bg-primary/70"
                                    : "bg-white/10"
                        }`}>
                            <Zap className="w-3.5 h-3.5 text-white" />
                        </div>
                        {(isVoice && (audio.isListening || audio.agentSpeaking)) && (
                            <motion.div
                                className="absolute inset-0 rounded-full bg-primary/30"
                                animate={{ scale: [1, 1.8, 1], opacity: [0.5, 0, 0.5] }}
                                transition={{ duration: 2, repeat: Infinity }}
                            />
                        )}
                    </div>

                    {/* Status text */}
                    <div className="flex-1 min-w-0">
                        {isVoice ? (
                            <p className="text-xs text-white/80 truncate">
                                {audio.error
                                    ? audio.error
                                    : audio.isConnecting
                                        ? "Connecting to TroveVoice..."
                                        : audio.agentSpeaking
                                            ? "TroveVoice speaking..."
                                            : audio.transcription || "Listening..."}
                            </p>
                        ) : mode === "nudge" || mode === "guided" ? (
                            <p className="text-xs text-white/80 truncate">{nudgeMessage}</p>
                        ) : (
                            <p className="text-[11px] text-white/40 uppercase tracking-widest">
                                TroveVoice · Your guide
                            </p>
                        )}
                    </div>

                    {/* Controls */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                        {(mode === "nudge" || mode === "guided") && (
                            <button
                                onClick={handleDismissNudge}
                                className="p-1.5 rounded-full hover:bg-white/10 transition-colors"
                                aria-label="Dismiss"
                            >
                                <X className="w-3.5 h-3.5 text-white/50" />
                            </button>
                        )}
                        <button
                            onClick={handleMicToggle}
                            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                                isVoice
                                    ? "bg-primary text-white shadow-lg shadow-primary/40"
                                    : "bg-white/10 text-white/60 hover:bg-white/20"
                            }`}
                            aria-label={isVoice ? "Stop voice" : "Start voice"}
                        >
                            {isVoice ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                        </button>
                        <button
                            onClick={handleDismissStrip}
                            className="p-1.5 rounded-full hover:bg-white/10 transition-colors"
                            aria-label="Hide concierge"
                        >
                            <X className="w-3.5 h-3.5 text-white/30" />
                        </button>
                    </div>
                </div>

                {/* Expanded content — nudge actions */}
                <AnimatePresence>
                    {(mode === "nudge" || mode === "guided") && (
                        <motion.div
                            key="nudge-actions"
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            className="px-4 pb-3 flex items-center gap-2"
                        >
                            <button
                                onClick={handleMicToggle}
                                className="flex-1 h-9 bg-primary text-white text-xs font-semibold rounded-xl hover:bg-primary/90 transition-colors flex items-center justify-center gap-1.5"
                            >
                                <Mic className="w-3.5 h-3.5" />
                                Ask with voice
                            </button>
                            {pageContext.type === "cart" && (
                                <button
                                    onClick={() => setMode("transaction")}
                                    className="flex-1 h-9 bg-emerald-600 text-white text-xs font-semibold rounded-xl hover:bg-emerald-500 transition-colors flex items-center justify-center gap-1.5"
                                >
                                    <ShoppingCart className="w-3.5 h-3.5" />
                                    Pay via M-Pesa
                                </button>
                            )}
                        </motion.div>
                    )}

                    {/* Voice mode expanded content */}
                    {isVoice && audio.transcription && (
                        <motion.div
                            key="voice-transcript"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="px-4 pb-3"
                        >
                            <p className="text-xs text-white/50 leading-relaxed line-clamp-2">
                                {audio.transcription}
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </motion.div>
    );
}
