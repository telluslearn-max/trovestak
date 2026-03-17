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
import { useCartStore } from "@/stores/cart";
import { useRouter } from "next/navigation";

// ─────────────────────────────────────────────
// Gemini Live config (copied from agent-service)
// ─────────────────────────────────────────────

const CONCIERGE_SYSTEM_PROMPT = `
You are TroveVoice — Trovestak's expert sales concierge and the most knowledgeable
tech advisor in East Africa. You are not just helpful; you are a world-class salesperson
who genuinely loves technology and wants every customer to walk away with the perfect device.

IDENTITY:
- Name: TroveVoice
- Store: Trovestak (trovestak.com) — premium electronics, Kenya
- Market: Kenya — prices in KES. Budget tiers: entry <20K, mid 20–60K, premium 60K+
- Brands in market: Samsung, Apple, Tecno, Infinix, Huawei, HP, Dell, Lenovo, Sony, JBL

TONE & STYLE:
- Confident and persuasive — you make strong recommendations, never hedge
- Warm and personal — sound like a trusted friend who happens to be a tech genius
- Concise in voice mode — max 2–3 sentences per turn, then invite a response
- Translate specs into real-world benefits: "120Hz means buttery-smooth scrolling"
- Use social proof naturally: "This is our most popular laptop right now"
- Acknowledge budget respectfully — never make customers feel judged

SALES BEHAVIOURS (apply on every interaction):
- UPSELL: Always mention one premium step-up option ("For KES 8K more you get double the storage")
- CROSS-SELL: Suggest a natural accessory or companion product after a recommendation
- URGENCY: If availability is "limited", mention it — "Stock is running low on this one"
- CLOSE: End every recommendation with a clear action prompt ("Want me to tell you more about this one?")
- ANCHOR: Frame prices relative to value ("For under KES 50K, you're getting flagship-level specs")

WORKFLOW — PRODUCT DISCOVERY:
1. Listen for the shopper's intent
2. For vague queries ("gift for my dad", "something for university") call research_agent
   first to expand into 5 specific queries, then search_products with the best query
3. Check your injected PRODUCT CATALOG first — if you can already see the item exists,
   go straight to search_products for full details
4. Present top 2–3 options: name, price in KES, ONE key benefit, availability status
5. Upsell one tier up. Cross-sell one accessory. Ask one clarifying question.

WORKFLOW — CATALOG GROUNDING (STRICT):
- At session start you receive the full Trovestak product catalog in your context.
- You may ONLY recommend or describe products that appear in that catalog.
- If a customer asks for a product NOT in the catalog:
  1. Say: "That's not something we stock right now, but I can get our team to source it for you."
  2. Immediately call whatsapp_handoff with context_summary = "Product request: [item] — customer wants this sourced"
  3. Never name, describe, or quote a price for a product not in the catalog.
- If search_products returns 0 results AND the item is not in your catalog context,
  treat it as not stocked and call whatsapp_handoff.

WORKFLOW — PERSONALISATION:
1. At session start, call get_concierge_context with the session_id from context
2. If the shopper has category history, lead with: "Based on what you've browsed before..."
3. Call get_ml_recommendations for returning shoppers
4. Use taste profile to rank options — mention it naturally

WORKFLOW — COMPARISON:
1. Call compare_products with the product IDs
2. Frame trade-offs around the customer's stated use case
3. Make a definitive recommendation: "Between these two, I'd go with X for you because..."
4. Never be neutral — your job is to help them decide

CONSTRAINTS:
- CATALOG ONLY: Never recommend, describe, or price any product not in the injected catalog
  or returned by search_products. No exceptions.
- ZERO RESULTS = WHATSAPP: If search_products returns empty and item is not in catalog,
  call whatsapp_handoff immediately as a product request.
- Never quote a price not retrieved from the catalog
- Never say "I don't know" — if you don't have the answer, escalate to WhatsApp
- SESSION END: When the user says goodbye, bye, thanks I'm done, close, end, stop, or any
  clear farewell — say a warm 1-sentence closing ("Happy shopping — come back anytime!")
  then immediately call end_session. Never leave a farewell without closing the session.

CART & CHECKOUT:
- Use add_to_cart ONLY after the customer explicitly confirms ("yes", "add that", "put it in my bag").
- Use view_cart before initiating checkout to confirm bag contents with the customer.
- Use remove_from_cart if the customer changes their mind about an item.

PRE-CHECKOUT (required before calling initiate_checkout for ANY method):
1. Call view_cart — read the items and total aloud to confirm.
2. Collect customer's full name.
3. Ask for their phone number for delivery updates.
4. Ask: "What's your delivery address? Street and building name."
5. Ask: "Which county are you in?"
6. Ask: "How would you like to pay? M-Pesa STK Push, Manual Till, or Cash on Delivery?"

Once you have all six pieces of information, call initiate_checkout — the customer will be redirected to the checkout page.

CHECKOUT REDIRECT:
- After calling initiate_checkout, tell the customer: "I'm taking you to checkout now — your details are pre-filled. Please sign in or continue as guest, then confirm your order."
- Do NOT attempt to collect a PIN or transaction code — payment happens on the checkout page.
- End the session once the customer confirms they can see the checkout page.
`.trim();

const CONCIERGE_TOOL_DECLARATIONS = [
  {
    name: "search_products",
    description: "Search Trovestak catalog. For vague queries, first call research_agent to expand intent into specific queries, then call this tool with each query.",
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
    name: "whatsapp_handoff",
    description: "Escalate to a human agent on WhatsApp. REQUIRED triggers: (1) product not in catalog — set context_summary to 'Product request: [item] — customer wants this sourced'; (2) search_products returns 0 results; (3) delivery queries; (4) bulk orders; (5) warranty specifics. Never leave the customer without a next step.",
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
  {
    name: "end_session",
    description: "End the TroveVoice session. Call this when the user says goodbye, bye, close, end, stop, or signals they want to finish. Always say a warm 1-sentence closing before calling this.",
    parameters: {
      type: "OBJECT",
      properties: {},
    },
  },
  {
    name: "add_to_cart",
    description: "Add a product to the customer's shopping cart. Only call this after the customer explicitly confirms they want to add it (e.g. 'yes', 'add that', 'put it in my bag').",
    parameters: {
      type: "OBJECT",
      properties: {
        product_id: { type: "STRING", description: "Product ID from search results" },
        quantity: { type: "NUMBER", description: "Quantity to add, default 1" },
      },
      required: ["product_id"],
    },
  },
  {
    name: "remove_from_cart",
    description: "Remove a product from the customer's shopping cart.",
    parameters: {
      type: "OBJECT",
      properties: {
        product_id: { type: "STRING", description: "Product ID to remove" },
      },
      required: ["product_id"],
    },
  },
  {
    name: "view_cart",
    description: "Get a summary of the customer's current shopping cart contents and total.",
    parameters: {
      type: "OBJECT",
      properties: {},
    },
  },
  {
    name: "initiate_checkout",
    description: "Redirect the customer to the checkout page with their details pre-filled. Call ONLY after confirming cart contents and collecting name, phone, address, county, and payment method.",
    parameters: {
      type: "OBJECT",
      properties: {
        payment_method: { type: "STRING", description: "Payment: 'mpesa' for M-Pesa STK push, 'manual_till' for manual till payment, 'cod' for cash on delivery" },
        phone: { type: "STRING", description: "Customer phone number e.g. 0712345678 or +254712345678" },
        customer_name: { type: "STRING", description: "Customer full name for the order record" },
        address: { type: "STRING", description: "Customer delivery address — street and building name" },
        county: { type: "STRING", description: "Kenyan county for delivery e.g. Nairobi, Mombasa, Kisumu" },
      },
      required: ["payment_method", "phone", "customer_name", "address", "county"],
    },
  },
];

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export interface ProductCard {
  id: string;
  name: string;
  brand: string | null;
  nav_category: string;
  sell_price: number;
  slug?: string;
  availability?: string;
}

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
  /** Optional override for bottom positioning */
  bottom?: number;
}

interface StripState {
  phase: ConciergeState;
  transcription: string;
  agentText: string;
  activeTool: string | null;
  errorMsg: string | null;
  displayProducts: ProductCard[];
  displayMode: "list" | "compare" | null;
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
  | { type: "RESET" }
  | { type: "SHOW_PRODUCTS"; products: ProductCard[]; mode: "list" | "compare" }
  | { type: "CLEAR_PRODUCTS" };

// ─────────────────────────────────────────────
// State machine
// ─────────────────────────────────────────────

const initial: StripState = {
  phase: "idle",
  transcription: "",
  agentText: "",
  activeTool: null,
  errorMsg: null,
  displayProducts: [],
  displayMode: null,
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
    case "SHOW_PRODUCTS":
      return { ...state, displayProducts: action.products, displayMode: action.mode };
    case "CLEAR_PRODUCTS":
      return { ...state, displayProducts: [], displayMode: null };
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
    add_to_cart: "Adding to your bag",
    remove_from_cart: "Updating your bag",
    view_cart: "Checking your bag",
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

/** Single product card */
const ProductCardView: React.FC<{ product: ProductCard }> = ({ product }) => {
  const card = (
    <div style={cardStyle}>
      <div style={cardCategoryTag}>{product.nav_category}</div>
      <div style={cardName}>{product.name}</div>
      {product.brand && <div style={cardBrand}>{product.brand}</div>}
      <div style={cardPrice}>KES {(product.sell_price ?? 0).toLocaleString()}</div>
      {product.availability && (
        <div style={{
          ...cardAvail,
          color: product.availability === "in_stock" ? "#2d8f72" : "#c0392b",
        }}>
          {product.availability === "in_stock" ? "In stock" : "Limited stock"}
        </div>
      )}
    </div>
  );
  return product.slug
    ? <a href={`/products/${product.slug}`} style={cardLink} target="_blank" rel="noopener noreferrer">{card}</a>
    : <>{card}</>;
};

/** Product panel — floats above the strip */
const ProductPanel: React.FC<{
  products: ProductCard[];
  mode: "list" | "compare" | null;
  onDismiss: () => void;
}> = ({ products, mode, onDismiss }) => {
  if (!products.length) return null;
  return (
    <div style={panelRoot} className="cs-fade-in">
      <div style={mode === "compare" ? compareGrid : listRow}>
        {products.map((p) => <ProductCardView key={p.id} product={p} />)}
      </div>
      <button style={panelDismiss} onClick={onDismiss} aria-label="Dismiss products" className="cs-stop-btn">
        ✕
      </button>
    </div>
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
  bottom = 24,
}) => {
  const router = useRouter();
  const routerRef = useRef<ReturnType<typeof useRouter> | null>(null);
  useEffect(() => { routerRef.current = router; }, [router]);

  const [state, dispatch] = useReducer(reducer, initial);
  const [sessionId] = useState(() => crypto.randomUUID());
  const sessionRef = useRef<any>(null);
  const audioHandlerRef = useRef<LiveAudioHandler | null>(null);
  const aiRef = useRef<GoogleGenAI | null>(null);

  // Stable ref for connect function
  const connectRef = useRef<() => void>(() => {});

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
          if (response.products?.length) {
            dispatch({ type: "SHOW_PRODUCTS", products: response.products.slice(0, 3), mode: "list" });
          }
        } else if (call.name === "compare_products") {
          const res = await fetch("/api/concierge/compare", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(call.args),
          });
          response = await res.json();
          if (response.products?.length) {
            dispatch({ type: "SHOW_PRODUCTS", products: response.products, mode: "compare" });
          }
        } else if (call.name === "get_concierge_context") {
          const res = await fetch("/api/concierge/context", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(call.args),
          });
          response = await res.json();
        } else if (call.name === "get_ml_recommendations") {
          const res = await fetch("/api/concierge/recommendations", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(call.args),
          });
          response = await res.json();
        } else if (call.name === "whatsapp_handoff") {
          const url = `https://wa.me/254700000000?text=${encodeURIComponent(
            `Hi Trovestak! I need help with: ${call.args?.context_summary ?? ""}`
          )}`;
          window.open(url, "_blank", "noopener,noreferrer");
          response = { url, message: "I've prepared a WhatsApp link — our team will assist you within minutes." };
        } else if (call.name === "research_agent") {
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
        } else if (call.name === "end_session") {
          response = { closed: true };
          try {
            session.sendToolResponse({ functionResponses: [{ id: call.id, name: call.name, response }] });
          } catch { /* ignore */ }
          setTimeout(() => {
            try { sessionRef.current?.close(); } catch { /* ignore */ }
            sessionRef.current = null;
            audioHandlerRef.current?.stop();
            audioHandlerRef.current = null;
            dispatch({ type: "RESET" });
          }, 900);
          return;
        } else if (call.name === "add_to_cart") {
          const productRes = await fetch(`/api/concierge/product?id=${encodeURIComponent(call.args?.product_id ?? "")}`);
          const product = await productRes.json();
          if (product.error || !product.id) {
            response = { error: "Product not found" };
          } else {
            const { addItem, getCartCount } = useCartStore.getState();
            addItem({
              id: `${product.id}-${product.variant_id}`,
              product_id: product.id,
              variant_id: product.variant_id,
              title: product.name,
              quantity: call.args?.quantity ?? 1,
              unit_price: product.sell_price,
              thumbnail: product.thumbnail_url ?? undefined,
            });
            routerRef.current?.push('/cart');
            const count = getCartCount();
            response = {
              added: product.name,
              unit_price: product.sell_price,
              cart_count: count,
              message: `${product.name} is in your bag. You now have ${count} item${count !== 1 ? "s" : ""} in your bag.`,
            };
          }
        } else if (call.name === "remove_from_cart") {
          const { cart, removeItem } = useCartStore.getState();
          const item = cart?.items.find(i => i.product_id === (call.args?.product_id ?? ""));
          if (item) {
            removeItem(item.id);
            response = { removed: true, name: item.title, message: `${item.title} removed from your bag.` };
          } else {
            response = { removed: false, message: "That item is not in your bag." };
          }
        } else if (call.name === "view_cart") {
          const { cart, getCartCount } = useCartStore.getState();
          if (!cart?.items.length) {
            response = { items: [], total: 0, message: "Your bag is empty." };
          } else {
            response = {
              items: cart.items.map(i => ({
                name: i.title,
                quantity: i.quantity,
                unit_price: i.unit_price,
                line_total: i.quantity * i.unit_price,
              })),
              subtotal: cart.subtotal,
              total: cart.total,
              item_count: getCartCount(),
            };
          }
        } else if (call.name === "initiate_checkout") {
          const { cart } = useCartStore.getState();
          if (!cart?.items.length) {
            response = { error: "Cart is empty. Add products before checking out." };
          } else {
            // Persist voice-collected data so checkout page can pre-fill the form
            try {
              sessionStorage.setItem("voice_checkout_prefill", JSON.stringify({
                customer_name: call.args?.customer_name ?? "",
                phone: call.args?.phone ?? "",
                payment_method: call.args?.payment_method ?? "",
                address: call.args?.address ?? "",
                county: call.args?.county ?? "",
              }));
            } catch { /* storage unavailable */ }
            // Navigate to checkout — payment is handled there
            routerRef.current?.push("/checkout?voice=1");
            response = {
              status: "redirecting",
              message: "Taking you to checkout now. Your details are pre-filled — please sign in or continue as guest, then confirm your order.",
            };
          }
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
  }, []);

  // ── Connect ───────────────────────────────────────────────
  const connect = useCallback(async () => {
    if (!process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
      dispatch({ type: "ERROR", msg: "NEXT_PUBLIC_GEMINI_API_KEY not set" });
      return;
    }
    if (!aiRef.current) {
      aiRef.current = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY });
    }
    dispatch({ type: "CONNECT" });
    try {
      // Fetch full product catalog (before audio — non-blocking if it fails)
      let catalogText = "";
      try {
        const catalogRes = await fetch("/api/concierge/catalog");
        const { products } = await catalogRes.json();
        if (products?.length) {
          catalogText = JSON.stringify(products);
        }
      } catch {
        // non-critical — agent falls back to search_products
      }

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

      // Build system instruction with catalog baked in (sent as part of connection setup)
      const systemWithCatalog = catalogText
        ? `${CONCIERGE_SYSTEM_PROMPT}\n\nPRODUCT CATALOG (the ONLY products Trovestak stocks — never recommend anything outside this list):\n${catalogText}`
        : CONCIERGE_SYSTEM_PROMPT;

      // Connect to Gemini Live directly from browser
      const session = await aiRef.current!.live.connect({
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
            // Agent interrupted by user — stop playback and flip to listening
            if (msg.serverContent?.interrupted) {
              audioHandlerRef.current?.interrupt();
              dispatch({ type: "LISTENING" });
            }
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
          systemInstruction: systemWithCatalog,
          tools: [{ functionDeclarations: CONCIERGE_TOOL_DECLARATIONS as any }],
        },
      });
      sessionRef.current = session;

      // Inject page context as a silent turn (catalog is in systemInstruction)
      try {
        const contextParts: string[] = [
          `[Session: ${sessionId}]`,
          pageContext
            ? `[Page: ${pageContext.pageType}${pageContext.productName ? `, viewing: ${pageContext.productName}` : ""}]`
            : "",
        ].filter(Boolean);

        session.sendClientContent({
          turns: [{ role: "user", parts: [{ text: contextParts.join(" ") }] }],
          turnComplete: false,
        });
      } catch {
        // non-critical
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

  // Keep connectRef in sync so wakeword hook always calls the latest version
  useEffect(() => { connectRef.current = connect; }, [connect]);

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

        {/* ── Product panel (shows above strip when agent returns results) ── */}
        <ProductPanel
          products={state.displayProducts}
          mode={state.displayMode}
          onDismiss={() => dispatch({ type: "CLEAR_PRODUCTS" })}
        />

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
            <span style={pillLabel}>
              Ask TroveVoice
            </span>
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
              className={isSpeaking ? "cs-mic-speaking" : isListening ? "cs-mic-pulse" : ""}
              onClick={
                isError ? connect
                : isSpeaking ? () => {
                    audioHandlerRef.current?.interrupt();
                    dispatch({ type: "LISTENING" });
                  }
                : undefined
              }
              aria-label={isSpeaking ? "Interrupt" : isListening ? "Listening" : "TroveVoice"}
              disabled={!isError && !isListening && !isSpeaking}
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

  /* Passive wakeword listening — subtle teal border pulse on pill */
  @keyframes cs-wake-pulse {
    0%,100% { box-shadow: 0 0 0 0 rgba(45,143,114,0.18), 0 4px 20px rgba(0,0,0,0.07); }
    50%      { box-shadow: 0 0 0 4px rgba(45,143,114,0.08), 0 4px 20px rgba(0,0,0,0.07); }
  }
  .cs-wake-active {
    border-color: rgba(45,143,114,0.25) !important;
    animation: cs-wake-pulse 2.8s ease-in-out infinite;
  }

  /* Wake dot blink */
  @keyframes cs-wake-dot {
    0%,100% { opacity: 1; transform: scale(1); }
    50%     { opacity: 0.4; transform: scale(0.7); }
  }
  .cs-wake-dot {
    animation: cs-wake-dot 1.8s ease-in-out infinite;
  }

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

  /* Mic button during speaking — clickable barge-in affordance */
  .cs-mic-speaking:hover {
    background: rgba(45,143,114,0.2) !important;
  }
  .cs-mic-speaking:active { transform: scale(0.92); }

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
  position: "relative",
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
  borderWidth: 1,
  borderStyle: "solid",
  borderColor: "rgba(26,26,26,0.1)",
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
  cursor: "pointer",
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

// ── Product panel styles ───────────────────────────────────────────────────

const panelRoot: React.CSSProperties = {
  position: "relative",
  width: "calc(100vw - 48px)",
  maxWidth: 600,
  marginBottom: 10,
  pointerEvents: "auto",
};

const listRow: React.CSSProperties = {
  display: "flex",
  gap: 10,
  overflowX: "auto",
  paddingBottom: 2,
};

const compareGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
  gap: 10,
};

const cardStyle: React.CSSProperties = {
  background: "#ffffff",
  border: "1px solid rgba(26,26,26,0.1)",
  borderRadius: 14,
  padding: "12px 14px",
  boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
  minWidth: 140,
  flexShrink: 0,
  display: "flex",
  flexDirection: "column",
  gap: 2,
};

const cardLink: React.CSSProperties = {
  textDecoration: "none",
  color: "inherit",
  display: "block",
  flexShrink: 0,
  transition: "transform 0.12s",
};

const cardCategoryTag: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 500,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  color: "#6b6b68",
  marginBottom: 2,
};

const cardName: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  color: "#1a1a1a",
  lineHeight: 1.3,
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
} as React.CSSProperties;

const cardBrand: React.CSSProperties = {
  fontSize: 11,
  color: "#6b6b68",
  marginTop: 1,
};

const cardPrice: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 700,
  color: "#1a1a1a",
  marginTop: 6,
  letterSpacing: "-0.02em",
};

const cardAvail: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 450,
  marginTop: 2,
};

const panelDismiss: React.CSSProperties = {
  position: "absolute",
  top: -6,
  right: -6,
  width: 22,
  height: 22,
  borderRadius: "50%",
  border: "1px solid rgba(26,26,26,0.1)",
  background: "#ffffff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 10,
  color: "#b0afa9",
  cursor: "pointer",
  outline: "none",
  boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
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
