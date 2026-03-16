import { useState, useRef } from "react";

// ── THEMES ────────────────────────────────────────────────────────
const LIGHT = {
  bg: "#f5f4f0",
  surface: "#ffffff",
  card: "#ffffff",
  cardInner: "#faf9f7",
  border: "#e8e5df",
  borderStrong: "#d4cfc7",
  text: "#1a1814",
  textSub: "#6b6560",
  textMuted: "#9e9890",
  blue: "#2563eb",
  green: "#059669",
  orange: "#d97706",
  red: "#dc2626",
  sidebar: "#1a1814",
  shadow: "0 1px 3px rgba(0,0,0,.06),0 1px 2px rgba(0,0,0,.04)",
  shadowMd: "0 4px 16px rgba(0,0,0,.08)",
  inputBg: "#faf9f7",
  btnPrimary: "#1a1814",
  btnPrimaryText: "#ffffff",
};

const DARK = {
  bg: "#07080f",
  surface: "#0b0d17",
  card: "#0f1120",
  cardInner: "#0a0c18",
  border: "#1a1d2e",
  borderStrong: "#2a2d40",
  text: "#f8fafc",
  textSub: "#8892a4",
  textMuted: "#4a5568",
  blue: "#3b82f6",
  green: "#10b981",
  orange: "#f59e0b",
  red: "#ef4444",
  sidebar: "#0b0d17",
  shadow: "none",
  shadowMd: "none",
  inputBg: "#07080f",
  btnPrimary: "#3b82f6",
  btnPrimaryText: "#ffffff",
};

const uid = () => Math.random().toString(36).slice(2, 8);

const TABS = [
  { id: "general",      label: "General",       icon: "◻" },
  { id: "media",        label: "Media",          icon: "◈" },
  { id: "pricing",      label: "Pricing",        icon: "◆" },
  { id: "inventory",    label: "Inventory",      icon: "▦" },
  { id: "variants",     label: "Variants",       icon: "⊞" },
  { id: "specs",        label: "Specs",          icon: "≡" },
  { id: "shipping",     label: "Shipping",       icon: "◎" },
  { id: "seo",          label: "SEO",            icon: "⊙" },
  { id: "organization", label: "Organization",   icon: "◷" },
];

const COMPLETION = {
  general: ["name", "shortDesc"],
  media: ["images"],
  pricing: ["price"],
  inventory: ["sku", "stock"],
  variants: ["variants"],
  specs: ["specGroups"],
  shipping: ["weight"],
  seo: ["metaTitle", "metaDesc"],
  organization: ["category", "brand"],
};

// ── INITIAL STATE ─────────────────────────────────────────────────
const INIT = {
  name: "", slug: "", shortDesc: "", longDesc: "",
  status: "draft", visibility: "online",
  images: [],
  price: "", compareAt: "", cost: "",
  taxClass: "taxable",
  sku: "", barcode: "", stock: "", lowStock: "10",
  continueOos: false, backorder: false,
  variants: [
    { id: uid(), color: "Black", storage: "128GB", price: "", sku: "", stock: "" },
    { id: uid(), color: "Black", storage: "256GB", price: "", sku: "", stock: "" },
    { id: uid(), color: "White", storage: "128GB", price: "", sku: "", stock: "" },
  ],
  specsEnabled: true,
  specGroups: [
    { id: uid(), label: "Display", rows: [
      { id: uid(), label: "Screen Size", value: "" },
      { id: uid(), label: "Resolution", value: "" },
      { id: uid(), label: "Panel Type", value: "" },
    ]},
    { id: uid(), label: "Performance", rows: [
      { id: uid(), label: "Processor", value: "" },
      { id: uid(), label: "RAM", value: "" },
    ]},
  ],
  weight: "", length: "", width: "", height: "",
  shippingClass: "standard", origin: "ke", hsCode: "",
  metaTitle: "", metaDesc: "", canonical: "",
  category: "", brand: "", tags: [], collection: "",
};

// ── HELPERS ───────────────────────────────────────────────────────
function getCompletion(data) {
  const scores = {};
  TABS.forEach(tab => {
    const fields = COMPLETION[tab.id] || [];
    const filled = fields.filter(f => {
      const v = data[f];
      if (Array.isArray(v)) return v.length > 0;
      return v && String(v).trim() !== "";
    });
    scores[tab.id] = fields.length ? Math.round((filled.length / fields.length) * 100) : 0;
  });
  return scores;
}

// ── FIELD COMPONENTS ──────────────────────────────────────────────
function Field({ label, sub, children, T }) {
  return (
    <div>
      <div style={{ marginBottom: 8 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: T.textSub, textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</span>
        {sub && <span style={{ fontSize: 11, color: T.textMuted, marginLeft: 6 }}>{sub}</span>}
      </div>
      {children}
    </div>
  );
}

function Input({ value, onChange, placeholder, mono, type = "text", T, ...rest }) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      value={value} onChange={e => onChange(e.target.value)}
      placeholder={placeholder} type={type}
      onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
      style={{
        width: "100%", padding: "9px 13px", borderRadius: 9,
        border: `1px solid ${focused ? T.blue : T.border}`,
        background: T.inputBg, fontSize: 13, color: T.text,
        fontFamily: mono ? "'JetBrains Mono',monospace" : "inherit",
        boxShadow: focused ? `0 0 0 3px ${T.blue}18` : "none",
        transition: "border-color .15s, box-shadow .15s",
        outline: "none",
      }}
      {...rest}
    />
  );
}

function Textarea({ value, onChange, rows = 4, placeholder, T }) {
  const [focused, setFocused] = useState(false);
  return (
    <textarea
      value={value} onChange={e => onChange(e.target.value)}
      rows={rows} placeholder={placeholder}
      onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
      style={{
        width: "100%", padding: "10px 13px", borderRadius: 9,
        border: `1px solid ${focused ? T.blue : T.border}`,
        background: T.inputBg, fontSize: 13, color: T.text,
        fontFamily: "inherit", resize: "vertical", lineHeight: 1.6,
        boxShadow: focused ? `0 0 0 3px ${T.blue}18` : "none",
        transition: "border-color .15s, box-shadow .15s",
        outline: "none",
      }}
    />
  );
}

function Select({ value, onChange, children, T }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      style={{
        width: "100%", padding: "9px 13px", borderRadius: 9,
        border: `1px solid ${T.border}`, background: T.inputBg,
        fontSize: 13, color: T.text, cursor: "pointer",
        fontFamily: "inherit", outline: "none",
      }}
    >{children}</select>
  );
}

function Toggle({ value, onChange, label, T }) {
  return (
    <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
      <div onClick={() => onChange(!value)} style={{
        width: 38, height: 21, borderRadius: 11, position: "relative",
        background: value ? T.blue : T.border, transition: "background .2s", flexShrink: 0,
      }}>
        <span style={{
          position: "absolute", top: 2.5, left: value ? 19 : 2.5,
          width: 16, height: 16, borderRadius: "50%", background: "#fff",
          transition: "left .2s", boxShadow: "0 1px 3px rgba(0,0,0,.2)",
        }} />
      </div>
      {label && <span style={{ fontSize: 13, color: T.textSub }}>{label}</span>}
    </label>
  );
}

function Grid({ cols = 1, gap = 20, children }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap }}>
      {children}
    </div>
  );
}

function SectionDivider({ title, T }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "32px 0 24px" }}>
      <span style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.1em", whiteSpace: "nowrap" }}>{title}</span>
      <div style={{ flex: 1, height: 1, background: T.border }} />
    </div>
  );
}

// ── SECTION: GENERAL ─────────────────────────────────────────────
function GeneralSection({ data, set, T }) {
  const autoSlug = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <Field label="Product Name" T={T}>
        <Input value={data.name} onChange={v => { set("name", v); set("slug", autoSlug(v)); }} placeholder="e.g. Samsung Galaxy S25 Ultra" T={T} />
      </Field>
      <Grid cols={2} gap={20}>
        <Field label="URL Slug" sub="auto-generated" T={T}>
          <Input value={data.slug} onChange={v => set("slug", v)} placeholder="samsung-galaxy-s25-ultra" mono T={T} />
        </Field>
        <Field label="Status" T={T}>
          <Select value={data.status} onChange={v => set("status", v)} T={T}>
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="archived">Archived</option>
          </Select>
        </Field>
      </Grid>
      <Field label="Short Description" sub="max 160 chars · shown in listing cards" T={T}>
        <Input value={data.shortDesc} onChange={v => set("shortDesc", v)} placeholder="Punchy one-liner highlighting top 3 features..." T={T} />
        <div style={{ textAlign: "right", fontSize: 11, color: data.shortDesc.length > 140 ? T.red : T.textMuted, marginTop: 4 }}>
          {data.shortDesc.length} / 160
        </div>
      </Field>
      <Field label="Long Description" sub="shown in description accordion on PDP" T={T}>
        <Textarea value={data.longDesc} onChange={v => set("longDesc", v)} rows={6} placeholder="Full product description, marketing copy, key features..." T={T} />
        <div style={{ marginTop: 8, padding: "8px 12px", background: T.cardInner, borderRadius: 7, border: `1px solid ${T.border}`, fontSize: 11, color: T.textMuted }}>
          ℹ Rich text editor (TipTap / Slate) mounts here in production
        </div>
      </Field>
      <Grid cols={2} gap={20}>
        <Field label="Visibility" T={T}>
          <Select value={data.visibility} onChange={v => set("visibility", v)} T={T}>
            <option value="online">Online</option>
            <option value="instore">In-store only</option>
            <option value="both">Online + In-store</option>
            <option value="hidden">Hidden</option>
          </Select>
        </Field>
      </Grid>
    </div>
  );
}

// ── SECTION: MEDIA ────────────────────────────────────────────────
function MediaSection({ data, set, T }) {
  const fileRef = useRef();
  const images = data.images || [];

  const handleFiles = (e) => {
    const files = Array.from(e.target.files);
    const newImgs = files.map(f => ({ id: uid(), url: URL.createObjectURL(f), alt: f.name.replace(/\.[^.]+$/, "") }));
    set("images", [...images, ...newImgs]);
  };

  const removeImg = (id) => set("images", images.filter(i => i.id !== id));
  const updateAlt = (id, alt) => set("images", images.map(i => i.id === id ? { ...i, alt } : i));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      <div>
        <div style={{ marginBottom: 16, fontSize: 11, fontWeight: 700, color: T.textSub, textTransform: "uppercase", letterSpacing: "0.08em" }}>Product Images</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 12, marginBottom: 12 }}>
          {images.map((img, idx) => (
            <div key={img.id} style={{ position: "relative", borderRadius: 12, overflow: "hidden", border: `1px solid ${T.border}`, aspectRatio: "1", background: T.cardInner, boxShadow: T.shadow }}>
              <img src={img.url} alt={img.alt} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => e.target.style.display = "none"} />
              {idx === 0 && <span style={{ position: "absolute", top: 7, left: 7, fontSize: 9, fontWeight: 700, background: T.blue, color: "#fff", borderRadius: 5, padding: "2px 7px", letterSpacing: "0.06em" }}>PRIMARY</span>}
              <button onClick={() => removeImg(img.id)} style={{ position: "absolute", top: 7, right: 7, width: 22, height: 22, borderRadius: "50%", background: "rgba(0,0,0,.5)", border: "none", color: "#fff", cursor: "pointer", fontSize: 11, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
            </div>
          ))}
          <button onClick={() => fileRef.current?.click()} style={{
            border: `2px dashed ${T.border}`, borderRadius: 12, background: "none",
            aspectRatio: "1", display: "flex", flexDirection: "column", alignItems: "center",
            justifyContent: "center", gap: 8, cursor: "pointer", color: T.textMuted,
            transition: "border-color .15s, color .15s", minHeight: 140,
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = T.blue; e.currentTarget.style.color = T.blue; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.textMuted; }}
          >
            <span style={{ fontSize: 24 }}>+</span>
            <span style={{ fontSize: 11, fontWeight: 600 }}>Add image</span>
          </button>
          <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={handleFiles} />
        </div>
        <div style={{ padding: "10px 14px", background: T.cardInner, borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 11, color: T.textMuted }}>
          Accepted: JPG, PNG, WebP · Max 5MB · Recommended: 1200×1200px · Drag to reorder
        </div>
      </div>

      {images.length > 0 && (
        <div>
          <SectionDivider title="Alt Text" T={T} />
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {images.map((img, idx) => (
              <div key={img.id} style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <img src={img.url} alt="" style={{ width: 44, height: 44, objectFit: "cover", borderRadius: 8, border: `1px solid ${T.border}`, flexShrink: 0 }} onError={e => e.target.style.display = "none"} />
                <div style={{ flex: 1 }}>
                  <Input value={img.alt} onChange={v => updateAlt(img.id, v)} placeholder={`Alt text for image ${idx + 1}...`} T={T} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── SECTION: PRICING ─────────────────────────────────────────────
function PricingSection({ data, set, T }) {
  const price = parseFloat(data.price) || 0;
  const cost = parseFloat(data.cost) || 0;
  const compareAt = parseFloat(data.compareAt) || 0;
  const margin = price && cost ? (((price - cost) / price) * 100).toFixed(1) : null;
  const discount = price && compareAt ? (((compareAt - price) / compareAt) * 100).toFixed(0) : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <Grid cols={3} gap={20}>
        <Field label="Price" sub="(USD)" T={T}>
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: T.textMuted, pointerEvents: "none" }}>$</span>
            <Input value={data.price} onChange={v => set("price", v)} placeholder="0.00" type="number" T={T} style={{ paddingLeft: 26 }} />
          </div>
        </Field>
        <Field label="Compare-at Price" sub="shows strikethrough" T={T}>
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: T.textMuted, pointerEvents: "none" }}>$</span>
            <Input value={data.compareAt} onChange={v => set("compareAt", v)} placeholder="0.00" type="number" T={T} style={{ paddingLeft: 26 }} />
          </div>
        </Field>
        <Field label="Cost Per Item" sub="internal only" T={T}>
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: T.textMuted, pointerEvents: "none" }}>$</span>
            <Input value={data.cost} onChange={v => set("cost", v)} placeholder="0.00" type="number" T={T} style={{ paddingLeft: 26 }} />
          </div>
        </Field>
      </Grid>

      {(margin !== null || discount) && (
        <div style={{ display: "flex", gap: 12 }}>
          {margin !== null && (
            <div style={{ flex: 1, padding: "14px 18px", background: T.cardInner, border: `1px solid ${T.border}`, borderRadius: 10 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4, fontFamily: "'JetBrains Mono',monospace" }}>Margin</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: parseFloat(margin) > 30 ? T.green : parseFloat(margin) > 10 ? T.orange : T.red, fontFamily: "'JetBrains Mono',monospace" }}>{margin}%</div>
            </div>
          )}
          {margin !== null && price && cost && (
            <div style={{ flex: 1, padding: "14px 18px", background: T.cardInner, border: `1px solid ${T.border}`, borderRadius: 10 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4, fontFamily: "'JetBrains Mono',monospace" }}>Profit / Unit</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: T.blue, fontFamily: "'JetBrains Mono',monospace" }}>${(price - cost).toFixed(2)}</div>
            </div>
          )}
          {discount && (
            <div style={{ flex: 1, padding: "14px 18px", background: T.cardInner, border: `1px solid ${T.border}`, borderRadius: 10 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4, fontFamily: "'JetBrains Mono',monospace" }}>Discount</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: T.orange, fontFamily: "'JetBrains Mono',monospace" }}>{discount}% off</div>
            </div>
          )}
        </div>
      )}

      <Grid cols={2} gap={20}>
        <Field label="Tax Class" T={T}>
          <Select value={data.taxClass} onChange={v => set("taxClass", v)} T={T}>
            <option value="taxable">Taxable</option>
            <option value="exempt">Tax Exempt</option>
            <option value="digital">Digital Good</option>
          </Select>
        </Field>
      </Grid>
    </div>
  );
}

// ── SECTION: INVENTORY ────────────────────────────────────────────
function InventorySection({ data, set, T }) {
  const stockNum = parseInt(data.stock) || 0;
  const threshold = parseInt(data.lowStock) || 10;
  const healthy = stockNum > threshold;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <Grid cols={2} gap={20}>
        <Field label="SKU" sub="stock keeping unit" T={T}>
          <Input value={data.sku} onChange={v => set("sku", v)} placeholder="e.g. SAM-S25U-256-BLK" mono T={T} />
        </Field>
        <Field label="Barcode" sub="UPC / EAN / GTIN" T={T}>
          <Input value={data.barcode} onChange={v => set("barcode", v)} placeholder="e.g. 8806094914766" mono T={T} />
        </Field>
      </Grid>
      <Grid cols={3} gap={20}>
        <Field label="Stock Quantity" T={T}>
          <Input value={data.stock} onChange={v => set("stock", v)} placeholder="0" type="number" min="0" T={T} />
        </Field>
        <Field label="Low Stock Threshold" T={T}>
          <Input value={data.lowStock} onChange={v => set("lowStock", v)} placeholder="10" type="number" min="0" T={T} />
        </Field>
        <Field label="Warehouse" T={T}>
          <Select value={data.warehouse || "main"} onChange={v => set("warehouse", v)} T={T}>
            <option value="main">Main Warehouse</option>
            <option value="east">East Hub</option>
            <option value="west">West Hub</option>
          </Select>
        </Field>
      </Grid>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <Toggle value={data.continueOos} onChange={v => set("continueOos", v)} label="Continue selling when out of stock" T={T} />
        <Toggle value={data.backorder} onChange={v => set("backorder", v)} label="Allow backorders" T={T} />
      </div>
      {data.stock && (
        <div style={{
          padding: "14px 18px", borderRadius: 10,
          background: healthy ? (T === LIGHT ? "#f0fdf4" : "#052e16") : (T === LIGHT ? "#fff7ed" : "#451a03"),
          border: `1px solid ${healthy ? (T === LIGHT ? "#bbf7d0" : "#14532d") : (T === LIGHT ? "#fed7aa" : "#7c2d12")}`,
          display: "flex", alignItems: "center", gap: 12,
        }}>
          <span style={{ fontSize: 18 }}>{healthy ? "✓" : "⚠"}</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: healthy ? T.green : T.orange }}>{healthy ? "Stock level healthy" : "Low stock warning"}</div>
            <div style={{ fontSize: 11, color: T.textSub, marginTop: 2 }}>{data.stock} units · threshold at {data.lowStock}</div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── SECTION: VARIANTS ─────────────────────────────────────────────
function VariantsSection({ data, set, T }) {
  const variants = data.variants || [];
  const update = (id, field, value) => set("variants", variants.map(v => v.id === id ? { ...v, [field]: value } : v));
  const remove = (id) => set("variants", variants.filter(v => v.id !== id));
  const add = () => set("variants", [...variants, { id: uid(), color: "", storage: "", price: data.price, sku: "", stock: "" }]);

  const inlineInput = (value, onChange, placeholder, mono) => (
    <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      style={{ border: `1px solid ${T.border}`, borderRadius: 7, padding: "6px 9px", fontSize: 12, fontFamily: mono ? "'JetBrains Mono',monospace" : "inherit", color: T.text, background: T.inputBg, width: "100%", outline: "none" }}
      onFocus={e => { e.target.style.borderColor = T.blue; e.target.style.boxShadow = `0 0 0 3px ${T.blue}18`; }}
      onBlur={e => { e.target.style.borderColor = T.border; e.target.style.boxShadow = "none"; }}
    />
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ padding: "12px 16px", background: T.cardInner, borderRadius: 9, border: `1px solid ${T.border}`, fontSize: 12, color: T.textSub }}>
        One row per SKU. Each unique combination of attributes (Color + Storage) is a separate purchasable variant.
      </div>
      <div style={{ border: `1px solid ${T.border}`, borderRadius: 12, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1.2fr 0.8fr 32px", gap: 0, background: T.cardInner, borderBottom: `1px solid ${T.border}`, padding: "8px 16px" }}>
          {["Color", "Storage", "Price", "SKU", "Stock", ""].map(h => (
            <span key={h} style={{ fontSize: 9, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: "'JetBrains Mono',monospace" }}>{h}</span>
          ))}
        </div>
        {variants.map((v, idx) => (
          <div key={v.id} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1.2fr 0.8fr 32px", gap: 8, padding: "8px 16px", borderBottom: idx < variants.length - 1 ? `1px solid ${T.border}` : "none", alignItems: "center", background: idx % 2 === 0 ? "transparent" : T.cardInner + "60" }}>
            {inlineInput(v.color, val => update(v.id, "color", val), "e.g. Black")}
            {inlineInput(v.storage, val => update(v.id, "storage", val), "e.g. 256GB")}
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", fontSize: 11, color: T.textMuted, pointerEvents: "none" }}>$</span>
              <input value={v.price} onChange={e => update(v.id, "price", e.target.value)} placeholder="0.00"
                style={{ border: `1px solid ${T.border}`, borderRadius: 7, padding: "6px 9px 6px 20px", fontSize: 12, fontFamily: "'JetBrains Mono',monospace", color: T.text, background: T.inputBg, width: "100%", outline: "none" }}
                onFocus={e => e.target.style.borderColor = T.blue} onBlur={e => e.target.style.borderColor = T.border}
              />
            </div>
            {inlineInput(v.sku, val => update(v.id, "sku", val), "SKU", true)}
            {inlineInput(v.stock, val => update(v.id, "stock", val), "0")}
            <button onClick={() => remove(v.id)} style={{ background: "none", border: "none", cursor: "pointer", color: T.textMuted, fontSize: 13, padding: 0, borderRadius: 4, lineHeight: 1 }}
              onMouseEnter={e => e.currentTarget.style.color = T.red}
              onMouseLeave={e => e.currentTarget.style.color = T.textMuted}
            >✕</button>
          </div>
        ))}
        <div style={{ padding: "10px 16px", borderTop: variants.length ? `1px solid ${T.border}` : "none" }}>
          <button onClick={add} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: `1px dashed ${T.border}`, borderRadius: 8, padding: "6px 14px", fontSize: 12, color: T.textMuted, cursor: "pointer", fontFamily: "inherit", transition: "all .15s" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = T.blue; e.currentTarget.style.color = T.blue; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.textMuted; }}
          >+ Add variant row</button>
        </div>
      </div>
      <div style={{ fontSize: 11, color: T.textMuted }}>
        {variants.length} variants · Total stock: {variants.reduce((a, v) => a + (parseInt(v.stock) || 0), 0)} units
      </div>
    </div>
  );
}

// ── SECTION: SPECS ────────────────────────────────────────────────
function SpecsSection({ data, set, T }) {
  const groups = data.specGroups || [];
  const setGroups = g => set("specGroups", g);
  const addGroup = () => setGroups([...groups, { id: uid(), label: "New Group", rows: [{ id: uid(), label: "", value: "" }] }]);
  const removeGroup = gid => setGroups(groups.filter(g => g.id !== gid));
  const updateGroupLabel = (gid, label) => setGroups(groups.map(g => g.id === gid ? { ...g, label } : g));
  const addRow = gid => setGroups(groups.map(g => g.id === gid ? { ...g, rows: [...g.rows, { id: uid(), label: "", value: "" }] } : g));
  const removeRow = (gid, rid) => setGroups(groups.map(g => g.id === gid ? { ...g, rows: g.rows.filter(r => r.id !== rid) } : g));
  const updateRow = (gid, rid, f, v) => setGroups(groups.map(g => g.id === gid ? { ...g, rows: g.rows.map(r => r.id === rid ? { ...r, [f]: v } : r) } : g));

  const inlineInput = (value, onChange, placeholder, mono) => (
    <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      style={{ border: `1px solid ${T.border}`, borderRadius: 7, padding: "6px 10px", fontSize: 12, fontFamily: mono ? "'JetBrains Mono',monospace" : "inherit", color: T.text, background: T.inputBg, width: "100%", outline: "none" }}
      onFocus={e => { e.target.style.borderColor = T.blue; e.target.style.boxShadow = `0 0 0 3px ${T.blue}18`; }}
      onBlur={e => { e.target.style.borderColor = T.border; e.target.style.boxShadow = "none"; }}
    />
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Toggle value={data.specsEnabled} onChange={v => set("specsEnabled", v)} label="Include specifications section on this product" T={T} />
        {data.specsEnabled && (
          <button onClick={addGroup} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8, border: "none", background: T.btnPrimary, fontSize: 12, fontWeight: 700, color: T.btnPrimaryText, cursor: "pointer" }}>
            + Add group
          </button>
        )}
      </div>

      {!data.specsEnabled ? (
        <div style={{ border: `2px dashed ${T.border}`, borderRadius: 12, padding: "40px 32px", textAlign: "center", color: T.textMuted }}>
          <div style={{ fontSize: 24, marginBottom: 8 }}>◻</div>
          <div style={{ fontSize: 13 }}>Specs section disabled for this product</div>
          <div style={{ fontSize: 11, marginTop: 4 }}>Toggle on above to add a specifications tab to the PDP accordion</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {groups.map(group => (
            <div key={group.id} style={{ border: `1px solid ${T.border}`, borderRadius: 12, overflow: "hidden", boxShadow: T.shadow }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 16px", background: T.cardInner, borderBottom: `1px solid ${T.border}` }}>
                <input value={group.label} onChange={e => updateGroupLabel(group.id, e.target.value)}
                  style={{ flex: 1, border: "none", background: "transparent", fontSize: 13, fontWeight: 700, color: T.text, fontFamily: "inherit", outline: "none" }}
                />
                <span style={{ fontSize: 10, color: T.textMuted, fontFamily: "'JetBrains Mono',monospace" }}>{group.rows.length} rows</span>
                <button onClick={() => removeGroup(group.id)} style={{ background: "none", border: "none", cursor: "pointer", color: T.textMuted, fontSize: 13 }}
                  onMouseEnter={e => e.currentTarget.style.color = T.red}
                  onMouseLeave={e => e.currentTarget.style.color = T.textMuted}
                >✕</button>
              </div>
              <div style={{ padding: "8px 0" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 24px", gap: 8, padding: "4px 16px 8px" }}>
                  {["Spec Label", "Value", ""].map(h => (
                    <span key={h} style={{ fontSize: 9, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: "'JetBrains Mono',monospace" }}>{h}</span>
                  ))}
                </div>
                {group.rows.map(row => (
                  <div key={row.id} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 24px", gap: 8, padding: "3px 16px", alignItems: "center" }}>
                    {inlineInput(row.label, v => updateRow(group.id, row.id, "label", v), "e.g. Screen Size")}
                    {inlineInput(row.value, v => updateRow(group.id, row.id, "value", v), "e.g. 6.8 inches")}
                    <button onClick={() => removeRow(group.id, row.id)} style={{ background: "none", border: "none", cursor: "pointer", color: T.textMuted, fontSize: 12 }}
                      onMouseEnter={e => e.currentTarget.style.color = T.red}
                      onMouseLeave={e => e.currentTarget.style.color = T.textMuted}
                    >✕</button>
                  </div>
                ))}
                <div style={{ padding: "8px 16px" }}>
                  <button onClick={() => addRow(group.id)} style={{ background: "none", border: `1px dashed ${T.border}`, borderRadius: 6, padding: "4px 12px", fontSize: 11, color: T.textMuted, cursor: "pointer", fontFamily: "inherit" }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = T.blue; e.currentTarget.style.color = T.blue; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.textMuted; }}
                  >+ Add row</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── SECTION: SHIPPING ─────────────────────────────────────────────
function ShippingSection({ data, set, T }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <Grid cols={2} gap={20}>
        <Field label="Weight" sub="grams" T={T}>
          <Input value={data.weight} onChange={v => set("weight", v)} placeholder="e.g. 232" type="number" min="0" T={T} />
        </Field>
        <Field label="Shipping Class" T={T}>
          <Select value={data.shippingClass} onChange={v => set("shippingClass", v)} T={T}>
            <option value="standard">Standard</option>
            <option value="oversized">Oversized</option>
            <option value="fragile">Fragile</option>
            <option value="hazmat">Hazmat</option>
            <option value="free">Free Shipping</option>
          </Select>
        </Field>
      </Grid>
      <SectionDivider title="Package Dimensions (mm)" T={T} />
      <Grid cols={3} gap={20}>
        <Field label="Length (mm)" T={T}><Input value={data.length} onChange={v => set("length", v)} placeholder="0" type="number" T={T} /></Field>
        <Field label="Width (mm)" T={T}><Input value={data.width} onChange={v => set("width", v)} placeholder="0" type="number" T={T} /></Field>
        <Field label="Height (mm)" T={T}><Input value={data.height} onChange={v => set("height", v)} placeholder="0" type="number" T={T} /></Field>
      </Grid>
      <Grid cols={2} gap={20}>
        <Field label="Country of Origin" T={T}>
          <Select value={data.origin} onChange={v => set("origin", v)} T={T}>
            <option value="ke">Kenya</option>
            <option value="kr">South Korea</option>
            <option value="cn">China</option>
            <option value="us">United States</option>
            <option value="vn">Vietnam</option>
            <option value="in">India</option>
          </Select>
        </Field>
        <Field label="HS Tariff Code" sub="for customs" T={T}>
          <Input value={data.hsCode} onChange={v => set("hsCode", v)} placeholder="e.g. 8517.12.00" mono T={T} />
        </Field>
      </Grid>
    </div>
  );
}

// ── SECTION: SEO ─────────────────────────────────────────────────
function SeoSection({ data, set, T }) {
  const title = data.metaTitle || data.name || "";
  const desc = data.metaDesc || data.shortDesc || "";
  const slug = data.slug || "product-slug";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <Field label="Meta Title" sub={`${title.length}/60`} T={T}>
        <Input value={title} onChange={v => set("metaTitle", v)} placeholder="SEO title (50–60 chars ideal)" T={T} />
        <div style={{ height: 4, background: T.border, borderRadius: 4, marginTop: 6, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${Math.min(100, (title.length / 60) * 100)}%`, background: title.length > 60 ? T.red : title.length > 45 ? T.orange : T.green, borderRadius: 4, transition: "width .2s, background .2s" }} />
        </div>
      </Field>
      <Field label="Meta Description" sub={`${desc.length}/160`} T={T}>
        <Textarea value={desc} onChange={v => set("metaDesc", v)} rows={3} placeholder="SEO description shown in search results (max 160 chars)" T={T} />
      </Field>

      {/* Google preview */}
      <div style={{ border: `1px solid ${T.border}`, borderRadius: 12, padding: "18px 20px", background: T.cardInner }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 14, fontFamily: "'JetBrains Mono',monospace" }}>Google Search Preview</div>
        <div style={{ fontSize: 18, color: "#1a0dab", marginBottom: 3, fontWeight: 400, cursor: "pointer" }}>{title || "Product title"}</div>
        <div style={{ fontSize: 13, color: "#006621", marginBottom: 4 }}>https://beststore.co.ke/products/{slug}</div>
        <div style={{ fontSize: 14, color: "#545454", lineHeight: 1.5 }}>{desc || "No meta description set. Add one above to control how this page appears in search results."}</div>
      </div>

      <Field label="Canonical URL" sub="leave empty to use default" T={T}>
        <Input value={data.canonical} onChange={v => set("canonical", v)} placeholder="https://beststore.co.ke/products/..." mono T={T} />
      </Field>
    </div>
  );
}

// ── SECTION: ORGANIZATION ─────────────────────────────────────────
function OrganizationSection({ data, set, T }) {
  const [tagInput, setTagInput] = useState("");
  const tags = data.tags || [];

  const addTag = (e) => {
    if ((e.key === "Enter" || e.key === ",") && tagInput.trim()) {
      e.preventDefault();
      const tag = tagInput.trim().replace(/,$/, "").toLowerCase();
      if (!tags.includes(tag)) set("tags", [...tags, tag]);
      setTagInput("");
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <Grid cols={2} gap={20}>
        <Field label="Category" T={T}>
          <Select value={data.category} onChange={v => set("category", v)} T={T}>
            <option value="">Select category...</option>
            <option>Smartphones</option><option>Laptops</option><option>Tablets</option>
            <option>Televisions</option><option>Audio</option><option>Cameras</option>
            <option>Networking</option><option>Accessories</option>
          </Select>
        </Field>
        <Field label="Brand" T={T}>
          <Select value={data.brand} onChange={v => set("brand", v)} T={T}>
            <option value="">Select brand...</option>
            <option>Samsung</option><option>Apple</option><option>Sony</option>
            <option>LG</option><option>Lenovo</option><option>Dell</option>
            <option>HP</option><option>Bose</option><option>Google</option>
          </Select>
        </Field>
      </Grid>
      <Field label="Tags" sub="press Enter or comma to add" T={T}>
        <div style={{ border: `1px solid ${T.border}`, borderRadius: 9, padding: "8px 10px", background: T.inputBg, display: "flex", flexWrap: "wrap", gap: 6, minHeight: 44 }}>
          {tags.map(tag => (
            <span key={tag} style={{ display: "inline-flex", alignItems: "center", gap: 5, background: T.cardInner, border: `1px solid ${T.border}`, borderRadius: 6, padding: "3px 8px", fontSize: 12, color: T.textSub }}>
              #{tag}
              <button onClick={() => set("tags", tags.filter(t => t !== tag))} style={{ background: "none", border: "none", cursor: "pointer", color: T.textMuted, padding: 0, fontSize: 11, lineHeight: 1 }}>✕</button>
            </span>
          ))}
          <input value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={addTag}
            placeholder={tags.length ? "" : "android, flagship, 5g..."}
            style={{ border: "none", outline: "none", fontSize: 12, color: T.text, fontFamily: "inherit", minWidth: 120, flex: 1, background: "transparent" }}
          />
        </div>
      </Field>
      <Grid cols={2} gap={20}>
        <Field label="Collection" sub="featured grouping" T={T}>
          <Select value={data.collection} onChange={v => set("collection", v)} T={T}>
            <option value="">None</option>
            <option value="new-arrivals">New Arrivals</option>
            <option value="best-sellers">Best Sellers</option>
            <option value="deals">Deals</option>
            <option value="featured">Featured</option>
            <option value="ramadan-sale">Ramadan Sale</option>
          </Select>
        </Field>
        <Field label="Related Products" sub="shown at bottom of PDP" T={T}>
          <Input value={data.related || ""} onChange={v => set("related", v)} placeholder="Search to link products..." T={T} />
        </Field>
      </Grid>
    </div>
  );
}

// ── ROOT ──────────────────────────────────────────────────────────
export default function ProductNew() {
  const [theme, setTheme] = useState("light");
  const [activeTab, setActiveTab] = useState("general");
  const [data, setData] = useState(INIT);
  const [saved, setSaved] = useState(false);
  const T = theme === "light" ? LIGHT : DARK;

  const set = (field, value) => setData(prev => ({ ...prev, [field]: value }));

  const handleSave = (status) => {
    set("status", status);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const completion = getCompletion(data);
  const overallPct = Math.round(Object.values(completion).reduce((a, v) => a + v, 0) / TABS.length);

  const statusColors = { draft: T.orange, active: T.green, archived: T.textMuted };

  const SECTIONS = {
    general:      <GeneralSection data={data} set={set} T={T} />,
    media:        <MediaSection data={data} set={set} T={T} />,
    pricing:      <PricingSection data={data} set={set} T={T} />,
    inventory:    <InventorySection data={data} set={set} T={T} />,
    variants:     <VariantsSection data={data} set={set} T={T} />,
    specs:        <SpecsSection data={data} set={set} T={T} />,
    shipping:     <ShippingSection data={data} set={set} T={T} />,
    seo:          <SeoSection data={data} set={set} T={T} />,
    organization: <OrganizationSection data={data} set={set} T={T} />,
  };

  return (
    <div style={{ fontFamily: "'DM Sans','Geist',system-ui,sans-serif", background: T.bg, minHeight: "100vh", color: T.text, transition: "background .2s, color .2s" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
        *{box-sizing:border-box;}
        body{margin:0;}
        input[type=number]::-webkit-inner-spin-button{-webkit-appearance:none;}
        ::-webkit-scrollbar{width:5px;}
        ::-webkit-scrollbar-thumb{background:${T.border};border-radius:8px;}
        @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
      `}</style>

      {/* TOP SAVE BAR */}
      <div style={{
        position: "sticky", top: 0, zIndex: 100,
        background: T.surface, borderBottom: `1px solid ${T.border}`,
        padding: "0 32px", height: 58,
        display: "flex", alignItems: "center", gap: 14,
        boxShadow: T.shadowMd,
      }}>
        {/* Breadcrumb */}
        <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, fontSize: 13, minWidth: 0 }}>
          <span style={{ color: T.textMuted, cursor: "pointer" }}>Products</span>
          <span style={{ color: T.border }}>›</span>
          <span style={{ fontWeight: 700, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {data.name || "New Product"}
          </span>
        </div>

        {/* Overall completion */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 80, height: 4, background: T.border, borderRadius: 4, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${overallPct}%`, background: overallPct > 66 ? T.green : overallPct > 33 ? T.orange : T.red, borderRadius: 4, transition: "width .3s" }} />
          </div>
          <span style={{ fontSize: 11, color: T.textMuted, fontFamily: "'JetBrains Mono',monospace" }}>{overallPct}%</span>
        </div>

        {/* Status badge */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, background: T.cardInner, border: `1px solid ${T.border}`, borderRadius: 8, padding: "5px 12px" }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: statusColors[data.status] || T.textMuted }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: T.textSub, textTransform: "capitalize" }}>{data.status}</span>
        </div>

        {/* Theme toggle */}
        <button onClick={() => setTheme(t => t === "light" ? "dark" : "light")} style={{
          width: 36, height: 36, borderRadius: 9, border: `1px solid ${T.border}`,
          background: T.cardInner, cursor: "pointer", fontSize: 16,
          display: "flex", alignItems: "center", justifyContent: "center",
          color: T.textSub, transition: "all .15s",
        }}
          title="Toggle theme"
          onMouseEnter={e => e.currentTarget.style.borderColor = T.blue}
          onMouseLeave={e => e.currentTarget.style.borderColor = T.border}
        >{theme === "light" ? "🌙" : "☀️"}</button>

        {saved && <span style={{ fontSize: 12, color: T.green, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>✓ Saved</span>}

        <button onClick={() => handleSave("draft")} style={{ padding: "7px 18px", borderRadius: 9, border: `1px solid ${T.border}`, background: "transparent", fontSize: 13, fontWeight: 600, color: T.textSub, cursor: "pointer", fontFamily: "inherit", transition: "all .15s" }}
          onMouseEnter={e => { e.currentTarget.style.background = T.cardInner; e.currentTarget.style.color = T.text; }}
          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = T.textSub; }}
        >Save draft</button>
        <button onClick={() => handleSave("active")} style={{ padding: "7px 20px", borderRadius: 9, border: "none", background: T.btnPrimary, fontSize: 13, fontWeight: 700, color: T.btnPrimaryText, cursor: "pointer", fontFamily: "inherit", transition: "opacity .15s" }}
          onMouseEnter={e => e.currentTarget.style.opacity = ".85"}
          onMouseLeave={e => e.currentTarget.style.opacity = "1"}
        >Publish</button>
      </div>

      <div style={{ display: "flex", maxWidth: 1160, margin: "0 auto", padding: "32px 24px", gap: 24 }}>

        {/* LEFT NAV */}
        <div style={{ width: 196, flexShrink: 0 }}>
          <div style={{ position: "sticky", top: 82 }}>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, overflow: "hidden", boxShadow: T.shadow, marginBottom: 16 }}>
              {TABS.map((tab, i) => {
                const isActive = activeTab === tab.id;
                const pct = completion[tab.id] || 0;
                return (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                    display: "flex", alignItems: "center", gap: 10,
                    width: "100%", padding: "10px 14px",
                    border: "none", borderRight: `2px solid ${isActive ? T.blue : "transparent"}`,
                    borderBottom: i < TABS.length - 1 ? `1px solid ${T.border}` : "none",
                    background: isActive ? (theme === "light" ? "#f0f7ff" : T.card) : "transparent",
                    cursor: "pointer", textAlign: "left",
                    fontSize: 12, fontWeight: isActive ? 700 : 500,
                    color: isActive ? T.blue : T.textSub,
                    fontFamily: "inherit", transition: "all .1s",
                  }}
                    onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = T.cardInner; e.currentTarget.style.color = T.text; } }}
                    onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = T.textSub; } }}
                  >
                    <span style={{ fontSize: 12, opacity: 0.7, flexShrink: 0 }}>{tab.icon}</span>
                    <span style={{ flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{tab.label}</span>
                    {pct === 100
                      ? <span style={{ fontSize: 10, color: T.green, flexShrink: 0 }}>✓</span>
                      : pct > 0
                        ? <span style={{ fontSize: 9, color: T.orange, fontFamily: "'JetBrains Mono',monospace", flexShrink: 0 }}>{pct}%</span>
                        : null
                    }
                  </button>
                );
              })}
            </div>

            {/* JSON snapshot */}
            <div style={{ background: theme === "light" ? "#1a1814" : T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: "14px", overflow: "hidden" }}>
              <div style={{ fontSize: 9, color: "#4a5568", fontFamily: "'JetBrains Mono',monospace", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 10 }}>Output snapshot</div>
              <pre style={{ margin: 0, fontSize: 9, color: "#64748b", fontFamily: "'JetBrains Mono',monospace", overflow: "auto", maxHeight: 180, lineHeight: 1.6, whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
                {JSON.stringify({ name: data.name, slug: data.slug, status: data.status, price: data.price, sku: data.sku, stock: data.stock, variants: data.variants?.length, specGroups: data.specGroups?.length, tags: data.tags }, null, 2)}
              </pre>
            </div>
          </div>
        </div>

        {/* MAIN CONTENT */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, padding: "32px 36px", boxShadow: T.shadow, animation: "fadeUp .25s ease" }} key={activeTab}>
            {/* Section header */}
            <div style={{ marginBottom: 32, paddingBottom: 24, borderBottom: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.12em", fontFamily: "'JetBrains Mono',monospace", marginBottom: 6 }}>
                {TABS.findIndex(t => t.id === activeTab) + 1} of {TABS.length} — Product Setup
              </div>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: T.text, letterSpacing: "-0.02em" }}>
                {TABS.find(t => t.id === activeTab)?.label}
              </h2>
              <p style={{ margin: "6px 0 0", fontSize: 13, color: T.textSub }}>
                {{
                  general: "Core product identity — name, description, and visibility settings.",
                  media: "Product images shown on the storefront PDP and listing cards.",
                  pricing: "Set your sell price, compare-at for sale display, and internal cost for margin tracking.",
                  inventory: "Stock quantity, SKU, and reorder configuration.",
                  variants: "Each row is a unique purchasable SKU with its own stock and price.",
                  specs: "Grouped key-value spec rows shown in the specifications accordion.",
                  shipping: "Weight, dimensions, and carrier configuration for delivery calculation.",
                  seo: "Control how this product appears in Google search results.",
                  organization: "Category, brand, and collection groupings for storefront navigation.",
                }[activeTab]}
              </p>
            </div>

            {/* Tab content */}
            {SECTIONS[activeTab]}

            {/* Bottom nav */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 40, paddingTop: 24, borderTop: `1px solid ${T.border}` }}>
              <button
                onClick={() => { const idx = TABS.findIndex(t => t.id === activeTab); if (idx > 0) setActiveTab(TABS[idx - 1].id); }}
                disabled={activeTab === TABS[0].id}
                style={{ padding: "8px 20px", borderRadius: 9, border: `1px solid ${T.border}`, background: "transparent", fontSize: 13, fontWeight: 600, color: activeTab === TABS[0].id ? T.textMuted : T.textSub, cursor: activeTab === TABS[0].id ? "not-allowed" : "pointer", fontFamily: "inherit" }}
              >← Previous</button>
              <span style={{ fontSize: 11, color: T.textMuted, fontFamily: "'JetBrains Mono',monospace" }}>
                {TABS.findIndex(t => t.id === activeTab) + 1} / {TABS.length}
              </span>
              <button
                onClick={() => { const idx = TABS.findIndex(t => t.id === activeTab); if (idx < TABS.length - 1) setActiveTab(TABS[idx + 1].id); }}
                disabled={activeTab === TABS[TABS.length - 1].id}
                style={{ padding: "8px 20px", borderRadius: 9, border: "none", background: activeTab === TABS[TABS.length - 1].id ? T.border : T.btnPrimary, fontSize: 13, fontWeight: 700, color: activeTab === TABS[TABS.length - 1].id ? T.textMuted : T.btnPrimaryText, cursor: activeTab === TABS[TABS.length - 1].id ? "not-allowed" : "pointer", fontFamily: "inherit" }}
              >Next →</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
