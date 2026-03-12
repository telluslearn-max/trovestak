export interface NavItem {
  href: string;
  label: string;
  icon: string;
  badge?: number | null;
}

export interface NavSection {
  section: string | null;
  items: NavItem[];
}

export const DEFAULT_COLLAPSED_SECTIONS = ["Shipping", "Marketing", "Finance"];

export const ADMIN_NAV_SECTIONS: NavSection[] = [
  {
    section: null,
    items: [
      { href: "/admin", label: "Dashboard", icon: "⬡" },
    ],
  },
  {
    section: "Catalog",
    items: [
      { href: "/admin/products", label: "Products", icon: "📦" },
      { href: "/admin/categories", label: "Categories", icon: "◈" },
      { href: "/admin/brands", label: "Brands", icon: "◎" },
      { href: "/admin/attributes", label: "Attributes & Variants", icon: "⊞" },
      { href: "/admin/bundles", label: "Bundles & Kits", icon: "◫" },
    ],
  },
  {
    section: "Orders",
    items: [
      { href: "/admin/orders", label: "All Orders", icon: "◉" },
      { href: "/admin/orders/pending", label: "Pending", icon: "⏳", badge: 14 },
      { href: "/admin/orders/fulfillment", label: "Fulfillment", icon: "🚚" },
      { href: "/admin/orders/returns", label: "Returns & Refunds", icon: "↩", badge: 3 },
      { href: "/admin/orders/cancellations", label: "Cancellations", icon: "✕" },
    ],
  },
  {
    section: "Customers",
    items: [
      { href: "/admin/customers", label: "All Customers", icon: "◷" },
      { href: "/admin/customers/segments", label: "Segments", icon: "◈" },
      { href: "/admin/customers/reviews", label: "Reviews", icon: "★" },
      { href: "/admin/customers/support", label: "Support Tickets", icon: "💬", badge: 7 },
    ],
  },
  {
    section: "Inventory",
    items: [
      { href: "/admin/inventory/stock", label: "Stock Levels", icon: "▦" },
      { href: "/admin/inventory/provenance", label: "Stock Provenance", icon: "🧬" },
      { href: "/admin/inventory/suppliers", label: "Suppliers", icon: "🏭" },
      { href: "/admin/inventory/trade-ins", label: "Trade-in Intake", icon: "🔄" },
      { href: "/admin/inventory/purchase-orders", label: "Purchase Orders", icon: "↻" },
      { href: "/admin/inventory/warehouses", label: "Warehouses", icon: "⌂" },
      { href: "/admin/inventory/alerts", label: "Low Stock Alerts", icon: "⚠", badge: 22 },
    ],
  },
  {
    section: "Finance",
    items: [
      { href: "/admin/finance/transactions", label: "Transactions", icon: "◆" },
      { href: "/admin/finance/invoices", label: "Invoices", icon: "◻" },
      { href: "/admin/finance/refunds", label: "Refunds", icon: "↲" },
      { href: "/admin/finance/tax", label: "Tax Config", icon: "⬡" },
      { href: "/admin/finance/gift-cards", label: "Gift Cards", icon: "◈" },
    ],
  },
  {
    section: "Shipping",
    items: [
      { href: "/admin/shipping/methods", label: "Methods & Carriers", icon: "◎" },
      { href: "/admin/shipping/zones", label: "Delivery Zones", icon: "◱" },
      { href: "/admin/shipping/tracking", label: "Tracking", icon: "⊙" },
    ],
  },
  {
    section: "Marketing",
    items: [
      { href: "/admin/marketing/promotions", label: "Promotions", icon: "◐" },
      { href: "/admin/marketing/coupons", label: "Coupons", icon: "✂" },
      { href: "/admin/marketing/flash-sales", label: "Flash Sales", icon: "⚡" },
      { href: "/admin/marketing/email", label: "Email Campaigns", icon: "◈" },
      { href: "/admin/marketing/loyalty", label: "Loyalty Program", icon: "★" },
      { href: "/admin/marketing/seo", label: "SEO Tools", icon: "◎" },
    ],
  },
  {
    section: "Analytics",
    items: [
      { href: "/admin/analytics/sales", label: "Sales Reports", icon: "↗" },
      { href: "/admin/analytics/revenue", label: "Revenue", icon: "◈" },
      { href: "/admin/analytics/customers", label: "Customer Insights", icon: "◷" },
      { href: "/admin/analytics/products", label: "Product Performance", icon: "▦" },
      { href: "/admin/analytics/traffic", label: "Traffic & Conversion", icon: "⊙" },
    ],
  },
  {
    section: "Settings",
    items: [
      { href: "/admin/settings", label: "Store Settings", icon: "◎" },
      { href: "/admin/settings/payment", label: "Payment Gateways", icon: "◆" },
      { href: "/admin/settings/notifications", label: "Notifications", icon: "◷" },
      { href: "/admin/settings/roles", label: "Roles & Permissions", icon: "◈" },
      { href: "/admin/settings/api", label: "API & Integrations", icon: "⊞" },
      { href: "/admin/settings/audit", label: "Audit Logs", icon: "◻" },
    ],
  },
];
