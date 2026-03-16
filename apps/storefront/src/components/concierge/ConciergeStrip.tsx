"use client";
/**
 * ConciergeStrip.tsx
 * TroveVoice — bottom-anchored voice concierge strip for Trovestak storefront.
 *
 * States
 * ──────
 *  idle        → collapsed pill, single mic button
 *  connecting  → pill expands, scan-line skeleton, "Connecting…"
 *  ready       → pulse ring on mic, "Listening…"
 *  listening   → gold waveform, live transcription scrolls in
 *  tool        → waveform pauses, tool-call badge animates in
 *  speaking    → teal waveform, agent text streams in
 *  error       → red tint, retry affordance
 *
 * Props
 * ──────
 *  pageContext   – injected on connection as a silent user turn
 *  onCheckout    – called when initiate_checkout tool fires
 *  onWhatsApp    – called when whatsapp_handoff tool fires
 */

import React, {
  useCallback,
  useEffect,
  useReducer,
  useRef,
  useState,
} from "react";
import { GoogleGenAI, Modality } from "@google/genai";
import { LiveAudioHandler } from "@/services/liveAudioHandler";

// ─────────────────────────────────────────────
// Gemini Live config (copied from agent-service)
// ─────────────────────────────────────────────

const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY! });

const CONCIERGE_SYSTEM_PROMPT = `
You are TroveVoice, the Personal Shopping Concierge for TroveStack — a premium
electronics store serving customers in Kenya.

IDENTITY:
- Name: TroveVoice
- Role: Personal Shopping Concierge
- Store: TroveStack (trovestak.com)
- Market: Kenya — prices in KES, payments via M-Pesa

TONE & STYLE:
- High-end concierge: Professional, warm, and highly assistive
- Knowledgeable: You understand technical specs of every product category
- Concise in voice mode: Keep responses under 3 sentences when speaking
- Kenyan context: Aware of M-Pesa, local pricing, popular brands (Samsung, Tecno,
  Infinix, Apple). Common budget reference points: entry <20K KES, mid 20-60K KES,
  premium 60K+ KES
- Never robotic: Sound like a knowledgeable friend, not a spec sheet

WORKFLOW — PRODUCT DISCOVERY:
1. Listen for the shopper's intent
2. If the query is vague or intent-based (e.g. "gift for my dad", "something for
   university"), ALWAYS call research_agent first to expand into 5 specific queries
3. Pass the expanded queries to search_products
4. Present top 3 results: name, price in KES, and ONE key benefit relevant to
   the shopper's stated need
5. Ask one clarifying follow-up to narrow down further

WORKFLOW — PERSONALISATION:
1. At session start, call get_concierge_context with the session_id
2. Use the taste profile to bias recommendations toward known preferences
3. Call get_ml_recommendations for returning shoppers with history
4. Acknowledge known preferences naturally: "Since you tend to prefer Samsung..."

WORKFLOW — COMPARISON:
1. When asked to compare products, call compare_products with their IDs
2. Explain trade-offs in the context of the shopper's use case
3. Make a clear recommendation — don't be neutral, be helpful

CONSTRAINTS:
- Never invent products — only recommend from search_products results
- Never quote a price you haven't retrieved from the catalog
- Never ask for payment details beyond the M-Pesa phone number
- If a product is out of stock, acknowledge it and offer alternatives
- If the ML or research service is unavailable, fall back gracefully to direct search
`.trim();

const CONCIERGE_TOOL_DECLARATIONS = [
  {
    name: "search_products",
    description: "Search TroveStack catalog. For vague queries, first call research_agent to expand intent into specific queries, then call this tool with each query.",
    parameters: {
      type: "OBJECT",
      properties: {
        query:         { type: "STRING", description: "Product search query" },
        category:      { type: "STRING", description: "Optional category filter: Smartphones | Laptops | Audio | Gaming | Cameras | Wearables | Smart Home" },
        max_price_kes: { type: "NUMBER", description: "Optional budget ceiling in KES" },
      },
      required: ["query"],
    },
  },
  {
    name: "get_concierge_context",
    description: "Retrieve the shopper's taste profile and preferences to personalise recommendations.",
    parameters: {
      type: "OBJECT",
      properties: { session_id: { type: "STRING" } },
    },
  },
  {
    name: "compare_products",
    description: "Compare 2-3 products side by side on specs, price, and use-case fit.",
    parameters: {
      type: "OBJECT",
      properties: {
        product_ids: { type: "ARRAY", items: { type: "STRING" }, description: "Array of 2-3 product IDs to compare" },
        use_case:    { type: "STRING", description: "What the shopper will use the product for" },
      },
      required: ["product_ids"],
    },
  },
  {
    name: "get_ml_recommendations",
    description: "Fetch personalised product recommendations based on the shopper's browsing history.",
    parameters: {
      type: "OBJECT",
      properties: {
        session_id: { type: "STRING" },
        limit:      { type: "NUMBER", description: "Max recommendations, default 5" },
      },
      required: ["session_id"],
    },
  },
  {
    name: "initiate_checkout",
    description: "Create an order and initiate an M-Pesa STK Push payment for the shopper's cart.",
    parameters: {
      type: "OBJECT",
      properties: {
        phone:      { type: "STRING", description: "M-Pesa phone number e.g. 0712345678" },
        amount_kes: { type: "NUMBER", description: "Total order amount in KES" },
        items:      { type: "STRING", description: "JSON array of cart items: [{product_id, variant_id, name, quantity, unit_price}]" },
      },
      required: ["phone", "amount_kes", "items"],
    },
  },
  {
    name: "whatsapp_handoff",
    description: "Escalate to a human agent on WhatsApp for delivery queries, bulk orders, or warranty specifics.",
    parameters: {
      type: "OBJECT",
      properties: {
        context_summary: { type: "STRING", description: "Summary of what the shopper needs" },
      },
      required: ["context_summary"],
    },
  },
  {
    name: "research_agent",
    description: "Market researcher that expands vague shopping queries into 5 specific product search queries. Call this FIRST for any vague or intent-based queries.",
    parameters: {
      type: "OBJECT",
      properties: {
        query: { type: "STRING", description: "The vague shopping intent to expand" },
      },
      required: ["query"],
    },
  },
];

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export type ConciergeState =
  | "idle"
  | "connecting"
  | "ready"
  | "listening"
  | "tool"
  | "speaking"
  | "error";

export interface PageContext {
  pageType: "product" | "category" | "cart" | "home";
  productName?: string;
  productId?: string;
  price?: number;
  currency?: string;
}

export interface ConciergeStripProps {
  /** Page context injected as silent user turn on connect */
  pageContext?: PageContext;
  /** Called when initiate_checkout tool resolves */
  onCheckout?: (orderId: string) => void;
  /** Called when whatsapp_handoff tool resolves */
  onWhatsApp?: (url: string) => void;
  /** Optional override for bottom positioning */
  bottom?: number;
}

interface StripState {
  phase: ConciergeState;
  transcription: string;
  agentText: string;
  activeTool: string | null;
  errorMsg: string | null;
}

type StripAction =
  | { type: "CONNECT" }
  | { type: "READY" }
  | { type: "LISTENING" }
  | { type: "TRANSCRIPTION"; text: string }
  | { type: "TOOL_CALL"; name: string }
  | { type: "AGENT_TEXT"; text: string }
  | { type: "SPEAKING" }
  | { type: "ERROR"; msg: string }
  | { type: "RESET" };

// ─────────────────────────────────────────────
// State machine
// ─────────────────────────────────────────────

const initial: StripState = {
  phase: "idle",
  transcription: "",
  agentText: "",
  activeTool: null,
  errorMsg: null,
};

function reducer(state: StripState, action: StripAction): StripState {
  switch (action.type) {
    case "CONNECT":
      return { ...initial, phase: "connecting" };
    case "READY":
      return { ...state, phase: "ready" };
    case "LISTENING":
      return { ...state, phase: "listening", transcription: "", agentText: "" };
    case "TRANSCRIPTION":
      return { ...state, transcription: action.text };
    case "TOOL_CALL":
      return { ...state, phase: "tool", activeTool: action.name };
    case "AGENT_TEXT":
      return { ...state, phase: "speaking", agentText: action.text, activeTool: null };
    case "SPEAKING":
      return { ...state, phase: "speaking" };
    case "ERROR":
      return { ...state, phase: "error", errorMsg: action.msg };
    case "RESET":
      return { ...initial };
    default:
      return state;
  }
}

// ─────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────

/** Animated waveform bars — 12 bars, color & height driven by phase */
const Waveform: React.FC<{ active: boolean; variant: "user" | "agent" }> = ({
  active,
  variant,
}) => {
  const heights = [0.4, 0.7, 1.0, 0.85, 0.55, 0.9, 0.65, 1.0, 0.75, 0.45, 0.8, 0.6];
  return (
    <div style={waveWrap}>
      {heights.map((h, i) => (
        <span
          key={i}
          style={{
            ...waveBar,
            background: variant === "agent" ? "var(--cs-teal)" : "var(--cs-ink)",
            animationDuration: active ? `${0.6 + i * 0.07}s` : "0s",
            animationPlayState: active ? "running" : "paused",
            height: active ? undefined : `${h * 10 + 2}px`,
            opacity: active ? 1 : 0.25,
            animationDelay: `${i * 0.04}s`,
          }}
        />
      ))}
    </div>
  );
};

/** Tool call badge with shimmer */
const ToolBadge: React.FC<{ name: string }> = ({ name }) => {
  const labels: Record<string, string> = {
    search_products: "Searching products",
    get_concierge_context: "Reading your taste profile",
    compare_products: "Comparing specs",
    get_ml_recommendations: "Personalising picks",
    initiate_checkout: "Initiating checkout",
    whatsapp_handoff: "Connecting to agent",
    research_agent: "Researching intent",
  };
  return (
    <span style={toolBadgeStyle}>
      <span style={toolDot} />
      {labels[name] ?? name}
    </span>
  );
};

/** Mic icon SVG */
const MicIcon: React.FC<{ size?: number }> = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    <line x1="12" y1="19" x2="12" y2="22" />
    <line x1="9" y1="22" x2="15" y2="22" />
  </svg>
);

/** Stop / X icon */
const StopIcon: React.FC = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <rect x="4" y="4" width="16" height="16" rx="3" />
  </svg>
);

// ─────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────

export const ConciergeStrip: React.FC<ConciergeStripProps> = ({
  pageContext,
  onCheckout,
  onWhatsApp,
  bottom = 24,
}) => {
  const [state, dispatch] = useReducer(reducer, initial);
  const [sessionId] = useState(() => crypto.randomUUID());
  const sessionRef = useRef<any>(null);
  const audioHandlerRef = useRef<LiveAudioHandler | null>(null);

  // ── Animate transcription text in character by character ──
  const [displayedTranscription, setDisplayedTranscription] = useState("");
  useEffect(() => {
    if (!state.transcription) { setDisplayedTranscription(""); return; }
    let i = displayedTranscription.length;
    if (i >= state.transcription.length) return;
    const id = setInterval(() => {
      i++;
      setDisplayedTranscription(state.transcription.slice(0, i));
      if (i >= state.transcription.length) clearInterval(id);
    }, 18);
    return () => clearInterval(id);
  }, [state.transcription]);

  // ── Stream agent text word by word ──
  const [displayedAgent, setDisplayedAgent] = useState("");
  useEffect(() => {
    if (!state.agentText) { setDisplayedAgent(""); return; }
    const words = state.agentText.split(" ");
    let idx = 0;
    const id = setInterval(() => {
      idx++;
      setDisplayedAgent(words.slice(0, idx).join(" "));
      if (idx >= words.length) clearInterval(id);
    }, 60);
    return () => clearInterval(id);
  }, [state.agentText]);

  // ── Tool call handler ─────────────────────────────────────
  const handleToolCalls = useCallback(async (calls: any[], session: any) => {
    const responses = [];
    for (const call of calls) {
      dispatch({ type: "TOOL_CALL", name: call.name });
      let response: any = { error: "not implemented" };
      try {
        if (call.name === "search_products") {
          const res = await fetch("/api/concierge/search", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(call.args),
          });
          response = await res.json();
        } else if (call.name === "whatsapp_handoff") {
          const url = `https://wa.me/254700000000?text=${encodeURIComponent(
            `Hi TroveStack! I need help with: ${call.args?.context_summary ?? ""}`
          )}`;
          onWhatsApp?.(url);
          response = { url };
        } else if (call.name === "initiate_checkout") {
          onCheckout?.(call.args?.product_id ?? "");
          response = { success: true };
        } else if (call.name === "research_agent") {
          // Fallback: build queries from the raw query text
          const q = call.args?.query ?? "";
          response = {
            queries: [
              `${q} Kenya price`,
              `best ${q} under 50000 KES`,
              `${q} Samsung Tecno Infinix`,
              `affordable ${q} Nairobi`,
              `${q} review Kenya 2025`,
            ],
          };
        }
      } catch (e: any) {
        response = { error: e.message };
      }
      responses.push({ id: call.id, name: call.name, response });
    }
    try {
      session.sendToolResponse({ functionResponses: responses });
    } catch {
      // session may have closed
    }
    dispatch({ type: "LISTENING" });
  }, [onCheckout, onWhatsApp]);

  // ── Connect ───────────────────────────────────────────────
  const connect = useCallback(async () => {
    if (!process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
      dispatch({ type: "ERROR", msg: "NEXT_PUBLIC_GEMINI_API_KEY not set" });
      return;
    }
    dispatch({ type: "CONNECT" });
    try {
      // Start audio INSIDE user gesture — creates AudioContext synchronously
      const handler = new LiveAudioHandler((base64: string) => {
        try {
          sessionRef.current?.sendRealtimeInput({
            media: { data: base64, mimeType: "audio/pcm;rate=16000" },
          });
        } catch {
          // session may have closed
        }
      });
      audioHandlerRef.current = handler;
      await handler.start(); // getUserMedia + AudioContext

      // Connect to Gemini Live directly from browser
      const session = await ai.live.connect({
        model: "gemini-2.5-flash-native-audio-preview-09-2025",
        callbacks: {
          onopen: () => {},
          onmessage: async (msg: any) => {
            // Audio chunks from agent
            const parts = msg.serverContent?.modelTurn?.parts;
            if (parts) {
              for (const part of parts) {
                if (part.inlineData?.data) {
                  audioHandlerRef.current?.playChunk(part.inlineData.data);
                  dispatch({ type: "SPEAKING" });
                }
                if (part.text) dispatch({ type: "AGENT_TEXT", text: part.text });
              }
            }
            // User speech transcription (enabled by inputAudioTranscription config)
            const transcript = msg.serverContent?.inputTranscription?.text;
            if (transcript) dispatch({ type: "TRANSCRIPTION", text: transcript });
            // Agent interrupted user
            if (msg.serverContent?.interrupted) audioHandlerRef.current?.interrupt();
            // Tool calls
            if (msg.toolCall?.functionCalls?.length) {
              await handleToolCalls(msg.toolCall.functionCalls, session);
            }
          },
          onerror: (e: any) => {
            const detail = e?.message || e?.reason || e?.type || "Connection error";
            dispatch({ type: "ERROR", msg: detail });
          },
          onclose: () => {
            audioHandlerRef.current?.stop();
            audioHandlerRef.current = null;
            dispatch({ type: "RESET" });
          },
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Aoede" } },
          },
          systemInstruction: CONCIERGE_SYSTEM_PROMPT,
          tools: [{ functionDeclarations: CONCIERGE_TOOL_DECLARATIONS as any }],
        },
      });
      sessionRef.current = session;

      // Inject page context as a silent turn
      if (pageContext) {
        try {
          session.sendClientContent({
            turns: [{ role: "user", parts: [{ text:
              `[Context: User is on ${pageContext.pageType} page.${
                pageContext.productName ? ` Currently viewing: ${pageContext.productName}.` : ""
              } Session: ${sessionId}]`
            }] }],
            turnComplete: false,
          });
        } catch {
          // non-critical
        }
      }

      dispatch({ type: "LISTENING" });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to start";
      dispatch({ type: "ERROR", msg });
      audioHandlerRef.current?.stop();
      audioHandlerRef.current = null;
    }
  }, [pageContext, sessionId, handleToolCalls]);

  // ── Disconnect ────────────────────────────────────────────
  const disconnect = useCallback(() => {
    try { sessionRef.current?.close(); } catch { /* ignore */ }
    sessionRef.current = null;
    audioHandlerRef.current?.stop();
    audioHandlerRef.current = null;
    dispatch({ type: "RESET" });
  }, []);

  // Cleanup on unmount
  useEffect(() => () => { disconnect(); }, [disconnect]);

  // ─────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────

  const { phase, activeTool, errorMsg } = state;
  const isActive = phase !== "idle";
  const isListening = phase === "listening";
  const isSpeaking = phase === "speaking";
  const isConnecting = phase === "connecting";
  const isError = phase === "error";

  return (
    <>
      <style>{CSS}</style>

      <div style={{ ...stripRoot, bottom }} aria-live="polite" aria-label="TroveVoice concierge">

        {/* ── Idle: collapsed pill ── */}
        {phase === "idle" && (
          <button
            style={collapsedPill}
            onClick={connect}
            aria-label="Start TroveVoice"
            className="cs-collapsed-pill"
          >
            <span style={pillMicWrap}>
              <MicIcon size={16} />
            </span>
            <span style={pillLabel}>Ask TroveVoice</span>
          </button>
        )}

        {/* ── Active strip ── */}
        {isActive && (
          <div
            style={{
              ...activeStrip,
              ...(isListening ? activeStripListening : {}),
              ...(isSpeaking ? activeStripSpeaking : {}),
              ...(isError ? activeStripError : {}),
            }}
            className={`cs-strip ${isConnecting ? "cs-connecting" : ""}`}
          >
            {/* Left: mic button */}
            <button
              style={{
                ...micButton,
                ...(isListening ? micButtonListening : {}),
                ...(isSpeaking ? micButtonSpeaking : {}),
                ...(isError ? micButtonError : {}),
              }}
              className={isListening ? "cs-mic-pulse" : ""}
              onClick={isError ? connect : undefined}
              aria-label={isListening ? "Listening" : "TroveVoice"}
              disabled={!isError && !isListening}
            >
              <MicIcon size={16} />
            </button>

            {/* Centre: content */}
            <div style={centreCol}>

              {/* Connecting state */}
              {isConnecting && (
                <span style={statusText} className="cs-fade-in">
                  Connecting to TroveVoice
                  <span className="cs-ellipsis" />
                </span>
              )}

              {/* Ready */}
              {phase === "ready" && (
                <span style={statusText} className="cs-fade-in">
                  Ready — say something
                </span>
              )}

              {/* Listening: waveform + transcription */}
              {isListening && (
                <div style={listenRow} className="cs-fade-in">
                  <Waveform active={true} variant="user" />
                  {displayedTranscription && (
                    <span style={transcriptionText}>
                      {displayedTranscription}
                      <span style={cursor} className="cs-cursor" />
                    </span>
                  )}
                </div>
              )}

              {/* Tool call */}
              {phase === "tool" && activeTool && (
                <div style={toolRow} className="cs-fade-in">
                  <ToolBadge name={activeTool} />
                </div>
              )}

              {/* Speaking: waveform + agent text */}
              {isSpeaking && (
                <div style={speakRow} className="cs-fade-in">
                  <Waveform active={true} variant="agent" />
                  {displayedAgent && (
                    <span style={agentText}>{displayedAgent}</span>
                  )}
                </div>
              )}

              {/* Error */}
              {isError && (
                <span style={errorText} className="cs-fade-in">
                  {errorMsg ?? "Something went wrong"} — tap mic to retry
                </span>
              )}
            </div>

            {/* Right: stop button */}
            <button
              style={stopButton}
              onClick={disconnect}
              aria-label="End session"
              className="cs-stop-btn"
            >
              <StopIcon />
            </button>
          </div>
        )}
      </div>
    </>
  );
};

// ─────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────

const CSS = `
  :root {
    --cs-ink:    #1a1a1a;
    --cs-teal:   #2d8f72;
    --cs-red:    #c0392b;
    --cs-border: rgba(26,26,26,0.1);
    --cs-shadow: 0 4px 24px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.06);
  }

  /* Collapsed pill hover */
  .cs-collapsed-pill {
    transition: box-shadow 0.2s, transform 0.15s;
    cursor: pointer;
  }
  .cs-collapsed-pill:hover {
    box-shadow: 0 6px 28px rgba(0,0,0,0.12), 0 1px 4px rgba(0,0,0,0.08) !important;
    transform: translateY(-1px);
  }
  .cs-collapsed-pill:active { transform: scale(0.98); }

  /* Connecting scan-line */
  @keyframes cs-scan {
    0%   { left: -60%; }
    100% { left: 140%; }
  }
  .cs-connecting::before {
    content: '';
    position: absolute;
    top: 0; left: -60%; height: 100%; width: 55%;
    background: linear-gradient(90deg, transparent, rgba(26,26,26,0.03), transparent);
    animation: cs-scan 1.6s ease-in-out infinite;
    pointer-events: none;
    border-radius: 20px;
  }

  /* Mic pulse ring */
  @keyframes cs-pulse {
    0%   { transform: scale(0.9); opacity: 0.6; }
    100% { transform: scale(1.55); opacity: 0; }
  }
  .cs-mic-pulse::after {
    content: '';
    position: absolute;
    inset: -6px;
    border-radius: 50%;
    border: 1.5px solid var(--cs-ink);
    animation: cs-pulse 1.4s ease-out infinite;
    pointer-events: none;
  }

  /* Waveform bars */
  @keyframes cs-wave {
    0%   { transform: scaleY(0.25); }
    50%  { transform: scaleY(1); }
    100% { transform: scaleY(0.25); }
  }

  /* Stop button hover */
  .cs-stop-btn {
    transition: color 0.15s, background 0.15s, transform 0.1s;
  }
  .cs-stop-btn:hover {
    color: var(--cs-red) !important;
    background: rgba(192,57,43,0.06) !important;
  }
  .cs-stop-btn:active { transform: scale(0.92); }

  /* Ellipsis dots */
  @keyframes cs-ellipsis {
    0%   { content: '.'; }
    33%  { content: '..'; }
    66%  { content: '...'; }
    100% { content: '.'; }
  }
  .cs-ellipsis::after {
    content: '.';
    animation: cs-ellipsis 1.2s steps(1) infinite;
  }

  /* Blinking cursor */
  @keyframes cs-blink { 0%,100%{opacity:1} 50%{opacity:0} }
  .cs-cursor { animation: cs-blink 0.9s step-end infinite; }

  /* Tool badge shimmer */
  @keyframes cs-tool-shimmer {
    0%   { background-position: -200% center; }
    100% { background-position: 200% center; }
  }

  /* Fade in */
  @keyframes cs-fadein { from{opacity:0;transform:translateY(3px)} to{opacity:1;transform:none} }
  .cs-fade-in { animation: cs-fadein 0.2s ease forwards; }
`;

const stripRoot: React.CSSProperties = {
  position: "fixed",
  left: "50%",
  transform: "translateX(-50%)",
  zIndex: 9999,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif",
  pointerEvents: "none",
};

const collapsedPill: React.CSSProperties = {
  pointerEvents: "auto",
  display: "flex",
  alignItems: "center",
  gap: 8,
  background: "#ffffff",
  border: "1px solid rgba(26,26,26,0.1)",
  borderRadius: 40,
  padding: "8px 16px 8px 8px",
  cursor: "pointer",
  boxShadow: "0 4px 20px rgba(0,0,0,0.07), 0 1px 3px rgba(0,0,0,0.05)",
  outline: "none",
};

const pillMicWrap: React.CSSProperties = {
  width: 34,
  height: 34,
  borderRadius: "50%",
  background: "#f4f4f2",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#1a1a1a",
  flexShrink: 0,
};

const pillLabel: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 450,
  color: "#6b6b68",
  letterSpacing: "-0.01em",
  paddingRight: 2,
};

const activeStrip: React.CSSProperties = {
  pointerEvents: "auto",
  display: "flex",
  alignItems: "center",
  gap: 10,
  background: "#ffffff",
  borderWidth: 1,
  borderStyle: "solid",
  borderColor: "rgba(26,26,26,0.1)",
  borderRadius: 20,
  padding: "9px 9px 9px 9px",
  boxShadow: "0 4px 24px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.05)",
  minWidth: 260,
  maxWidth: 520,
  width: "calc(100vw - 48px)",
  position: "relative",
  overflow: "hidden",
  transition: "border-color 0.25s, box-shadow 0.25s",
};

const activeStripListening: React.CSSProperties = {
  borderColor: "rgba(26,26,26,0.2)",
  boxShadow: "0 4px 28px rgba(0,0,0,0.1), 0 1px 4px rgba(0,0,0,0.06)",
};

const activeStripSpeaking: React.CSSProperties = {
  borderColor: "rgba(45,143,114,0.35)",
  boxShadow: "0 4px 28px rgba(45,143,114,0.1), 0 1px 4px rgba(0,0,0,0.05)",
};

const activeStripError: React.CSSProperties = {
  borderColor: "rgba(192,57,43,0.3)",
  boxShadow: "0 4px 20px rgba(192,57,43,0.08)",
};

const micButton: React.CSSProperties = {
  width: 36,
  height: 36,
  borderRadius: "50%",
  border: "1px solid rgba(26,26,26,0.1)",
  background: "#f6f6f4",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#1a1a1a",
  flexShrink: 0,
  cursor: "default",
  outline: "none",
  position: "relative",
  transition: "background 0.2s, border-color 0.2s, color 0.2s",
};

const micButtonListening: React.CSSProperties = {
  background: "#1a1a1a",
  color: "#ffffff",
  borderColor: "#1a1a1a",
  cursor: "default",
};

const micButtonSpeaking: React.CSSProperties = {
  background: "rgba(45,143,114,0.1)",
  color: "var(--cs-teal, #2d8f72)",
  borderColor: "rgba(45,143,114,0.3)",
};

const micButtonError: React.CSSProperties = {
  background: "rgba(192,57,43,0.07)",
  color: "var(--cs-red, #c0392b)",
  borderColor: "rgba(192,57,43,0.25)",
  cursor: "pointer",
};

const centreCol: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  paddingLeft: 2,
};

const statusText: React.CSSProperties = {
  fontSize: 13,
  color: "#6b6b68",
  letterSpacing: "-0.01em",
  fontWeight: 400,
};

const listenRow: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  minWidth: 0,
};

const speakRow: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  minWidth: 0,
};

const toolRow: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
};

const transcriptionText: React.CSSProperties = {
  fontSize: 13,
  color: "#1a1a1a",
  fontWeight: 450,
  letterSpacing: "-0.015em",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  lineHeight: 1,
};

const cursor: React.CSSProperties = {
  display: "inline-block",
  width: 1.5,
  height: 12,
  background: "#1a1a1a",
  marginLeft: 1,
  verticalAlign: "middle",
};

const agentText: React.CSSProperties = {
  fontSize: 13,
  color: "#2d8f72",
  fontWeight: 400,
  letterSpacing: "-0.015em",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  lineHeight: 1,
};

const errorText: React.CSSProperties = {
  fontSize: 12.5,
  color: "#c0392b",
  letterSpacing: "-0.01em",
};

const toolBadgeStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  fontSize: 12,
  fontWeight: 450,
  color: "#1a1a1a",
  background: "#f4f4f2",
  border: "1px solid rgba(26,26,26,0.1)",
  borderRadius: 20,
  padding: "4px 10px",
  letterSpacing: "-0.01em",
  backgroundImage: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.8) 50%, transparent 100%)",
  backgroundSize: "200% auto",
  animation: "cs-tool-shimmer 1.8s linear infinite",
};

const toolDot: React.CSSProperties = {
  width: 5,
  height: 5,
  borderRadius: "50%",
  background: "#1a1a1a",
  flexShrink: 0,
  animation: "cs-blink 0.8s step-end infinite",
};

const stopButton: React.CSSProperties = {
  width: 30,
  height: 30,
  borderRadius: "50%",
  border: "1px solid rgba(26,26,26,0.1)",
  background: "transparent",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#b0afa9",
  flexShrink: 0,
  cursor: "pointer",
  outline: "none",
};

// Waveform bar styles
const waveWrap: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 2.5,
  height: 24,
  flexShrink: 0,
};

const waveBar: React.CSSProperties = {
  width: 2.5,
  borderRadius: 2,
  transformOrigin: "center",
  animation: "cs-wave 0.7s ease-in-out infinite alternate",
  transition: "background 0.3s",
};

export default ConciergeStrip;
