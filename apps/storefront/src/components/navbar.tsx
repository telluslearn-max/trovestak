"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ShoppingBag, Menu, X, ChevronRight, ChevronDown } from "lucide-react";
import { useCartStore } from "@/stores/cart";
import { useSearchStore } from "@/stores/search";

// Map display category names to actual database slugs
const categorySlugMapping: Record<string, string> = {
  "Studio Equipment": "professional-audio",
  "Business Audio": "business-audio",
  "Over-Ear Headphones": "over-ear-headphones",
  "Wireless Earbuds": "wireless-earbuds",
  "Bluetooth Speakers": "bluetooth-speakers",
  "Home Audio": "home-audio",
  "Soundbars": "soundbars",
};

const megaMenuData = {
  mobile: {
    columns: [
      {
        title: "Mobile Phones",
        items: [
          { 
            category: "Flagship Phones",
            links: [
              { name: "iPhone", href: "/category/mobile/flagship-phones/apple" },
              { name: "Samsung Galaxy S", href: "/category/mobile/flagship-phones/samsung" },
              { name: "Google Pixel", href: "/category/mobile/flagship-phones/google" },
              { name: "OnePlus", href: "/category/mobile/flagship-phones/oneplus" },
            ]
          },
          { 
            category: "Mid-Range Phones",
            links: [
              { name: "Samsung A Series", href: "/category/mobile/mid-range-phones/Samsung" },
              { name: "Xiaomi", href: "/category/mobile/mid-range-phones/Xiaomi" },
              { name: "OPPO", href: "/category/mobile/mid-range-phones/OPPO" },
              { name: "vivo", href: "/category/mobile/mid-range-phones/vivo" },
            ]
          },
          { 
            category: "Budget Phones",
            links: [
              { name: "Infinix", href: "/category/mobile/budget-phones/Infinix" },
              { name: "Tecno", href: "/category/mobile/budget-phones/Tecno" },
              { name: "Realme", href: "/category/mobile/budget-phones/Realme" },
              { name: "Nokia", href: "/category/mobile/budget-phones/Nokia" },
            ]
          },
        ],
        footer: { name: "Shop All Phones", href: "/category/mobile" }
      },
      {
        title: "Tablets",
        items: [
          { 
            category: "iPad",
            links: [
              { name: "iPad Pro", href: "/category/mobile/ipad/Apple" },
              { name: "iPad Air", href: "/category/mobile/ipad/Apple" },
              { name: "iPad Mini", href: "/category/mobile/ipad/Apple" },
              { name: "iPad 10th Gen", href: "/category/mobile/ipad/Apple" },
            ]
          },
          { 
            category: "Android Tablets",
            links: [
              { name: "Samsung Tab S", href: "/category/mobile/android-tablets/Samsung" },
              { name: "Xiaomi Pad", href: "/category/mobile/android-tablets/Xiaomi" },
              { name: "Lenovo Tab", href: "/category/mobile/android-tablets/Lenovo" },
            ]
          },
        ],
        footer: { name: "Shop All Tablets", href: "/category/mobile/ipad" }
      },
      {
        title: "Accessories",
        items: [
          { 
            category: "Charging",
            links: [
              { name: "Phone Chargers", href: "/category/mobile/charging" },
              { name: "Cables", href: "/category/mobile/charging" },
              { name: "Power Banks", href: "/category/mobile/charging" },
              { name: "Wireless Chargers", href: "/category/mobile/charging" },
            ]
          },
          { 
            category: "Cases & Protection",
            links: [
              { name: "Phone Cases", href: "/category/mobile/accessories" },
              { name: "Tablet Cases", href: "/category/mobile/accessories" },
              { name: "Screen Protectors", href: "/category/mobile/accessories" },
            ]
          },
        ],
        footer: { name: "Shop All Accessories", href: "/category/mobile/accessories" }
      },
    ],
    featured: {
      image: "https://images.unsplash.com/photo-1696446701796-da61225697cc?w=400&q=80",
      badge: "NEW",
      title: "iPhone 16 Pro",
      description: "Available Now",
      href: "/products/iphone-16-pro",
      cta: "Learn more"
    }
  },
  computing: {
    columns: [
      {
        title: "Laptops",
        items: [
          { 
            category: "MacBooks",
            links: [
              { name: "MacBook Air", href: "/category/computers/macbooks/Apple" },
              { name: "MacBook Pro", href: "/category/computers/macbooks/Apple" },
            ]
          },
          { 
            category: "Windows Laptops",
            links: [
              { name: "Business Laptops", href: "/category/computers/windows-laptops" },
              { name: "Gaming Laptops", href: "/category/computers/windows-laptops" },
              { name: "Student Laptops", href: "/category/computers/windows-laptops" },
              { name: "Ultrabooks", href: "/category/computers/windows-laptops" },
            ]
          },
          { 
            category: "Chromebooks",
            links: [
              { name: "Chrome OS Laptops", href: "/category/computers/windows-laptops" },
            ]
          },
        ],
        footer: { name: "Shop All Laptops", href: "/category/computers/laptops" }
      },
      {
        title: "Desktop & monitors",
        items: [
          { 
            category: "Desktops",
            links: [
              { name: "iMac", href: "/category/computers/desktops/Apple" },
              { name: "Mac Mini/Mac Studio", href: "/category/computers/desktops/Apple" },
              { name: "HP All-in-One", href: "/category/computers/desktops/HP" },
              { name: "Gaming PCs", href: "/category/computers/desktops" },
            ]
          },
          { 
            category: "Monitors",
            links: [
              { name: "Gaming Monitors", href: "/category/computers/monitors" },
              { name: "4K Monitors", href: "/category/computers/monitors" },
              { name: "Ultrawide Monitors", href: "/category/computers/monitors" },
              { name: "Business Monitors", href: "/category/computers/monitors" },
            ]
          },
        ],
        footer: { name: "Shop All Desktops", href: "/category/computers/desktops" }
      },
      {
        title: "Accessories & Power",
        items: [
          { 
            category: "Power & UPS",
            links: [
              { name: "UPS Systems", href: "/category/computers/power" },
              { name: "Power Strips", href: "/category/computers/power" },
              { name: "Surge Protectors", href: "/category/computers/power" },
            ]
          },
          { 
            category: "Peripherals",
            links: [
              { name: "Keyboards & Mice", href: "/category/computers/peripherals" },
              { name: "Webcams", href: "/category/computers/peripherals" },
              { name: "Laptop Bags", href: "/category/computers/peripherals" },
              { name: "Docking Stations", href: "/category/computers/peripherals" },
            ]
          },
        ],
        footer: { name: "Shop All Accessories", href: "/category/computers/accessories" }
      },
    ],
    featured: {
      image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&q=80",
      badge: "NEW",
      title: "MacBook Air M3",
      description: "The lightest MacBook ever",
      href: "/products/macbook-air-m3",
      cta: "Shop now"
    }
  },
  audio: {
    columns: [
      {
        title: "Headphones",
        items: [
          { 
            category: "Over-Ear Headphones",
            links: [
              { name: "Sony WH-1000XM5", href: "/category/audio/over-ear-headphones/Sony" },
              { name: "Bose QC45", href: "/category/audio/over-ear-headphones/Bose" },
              { name: "Apple AirPods Max", href: "/category/audio/over-ear-headphones/Apple" },
              { name: "JBL Tune", href: "/category/audio/over-ear-headphones/JBL" },
            ]
          },
          { 
            category: "Wireless Earbuds",
            links: [
              { name: "Apple AirPods", href: "/category/audio/wireless-earbuds/Apple" },
              { name: "Samsung Galaxy Buds", href: "/category/audio/wireless-earbuds/Samsung" },
              { name: "Sony WF-1000XM5", href: "/category/audio/wireless-earbuds/Sony" },
              { name: "JBL/Bose/Beats", href: "/category/audio/wireless-earbuds" },
            ]
          },
        ],
        footer: { name: "Shop All Headphones", href: "/category/audio/headphones" }
      },
      {
        title: "Speakers",
        items: [
          { 
            category: "Bluetooth Speakers",
            links: [
              { name: "JBL Flip", href: "/category/audio/bluetooth-speakers/JBL" },
              { name: "Sony SRS", href: "/category/audio/bluetooth-speakers/Sony" },
              { name: "Ultimate Ears", href: "/category/audio/bluetooth-speakers" },
              { name: "Portable Speakers", href: "/category/audio/bluetooth-speakers" },
            ]
          },
          { 
            category: "Home Audio",
            links: [
              { name: "Soundbars", href: "/category/audio/soundbars" },
              { name: "Home Theater", href: "/category/audio/home-audio" },
              { name: "Smart Speakers", href: "/category/audio/home-audio" },
            ]
          },
        ],
        footer: { name: "Shop All Speakers", href: "/category/audio/speakers" }
      },
      {
        title: "Professional Audio",
        items: [
          { 
            category: "Studio Equipment",
            links: [
              { name: "Microphones", href: "/category/audio/microphones" },
              { name: "Audio Interfaces", href: "/category/audio/professional-audio" },
              { name: "Studio Monitors", href: "/category/audio/professional-audio" },
            ]
          },
          { 
            category: "Business Audio",
            links: [
              { name: "Conference Systems", href: "/category/audio/business-audio" },
              { name: "PA Systems", href: "/category/audio/business-audio" },
            ]
          },
        ],
        footer: { name: "Shop All Audio", href: "/category/audio" }
      },
    ],
    featured: {
      image: "https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=400&q=80",
      badge: "NEW",
      title: "AirPods Pro 2",
      description: "Adaptive Audio. Active Noise Cancellation.",
      href: "/products/airpods-pro-2",
      cta: "Buy now"
    }
  },
  gaming: {
    columns: [
      {
        title: "Consoles",
        items: [
          { 
            category: "PlayStation 5",
            links: [
              { name: "PS5 Standard", href: "/category/gaming/playstation-5" },
              { name: "PS5 Digital", href: "/category/gaming/playstation-5" },
              { name: "PS5 Accessories", href: "/category/gaming/playstation-5" },
            ]
          },
          { 
            category: "Xbox Series X|S",
            links: [
              { name: "Xbox Series X", href: "/category/gaming/xbox-series?brand=Microsoft" },
              { name: "Xbox Series S", href: "/category/gaming/xbox-series?brand=Microsoft" },
              { name: "Xbox Accessories", href: "/category/gaming/xbox-series" },
            ]
          },
          { 
            category: "Nintendo Switch",
            links: [
              { name: "OLED Model", href: "/category/gaming/nintendo-switch?brand=Nintendo" },
              { name: "Standard", href: "/category/gaming/nintendo-switch?brand=Nintendo" },
              { name: "Lite", href: "/category/gaming/nintendo-switch?brand=Nintendo" },
            ]
          },
        ],
        footer: { name: "Shop All Consoles", href: "/category/gaming/consoles" }
      },
      {
        title: "PC Gaming",
        items: [
          { 
            category: "Gaming Laptops",
            links: [
              { name: "High-End Gaming", href: "/category/computers/gaming-laptops" },
              { name: "Mid-Range Gaming", href: "/category/computers/gaming-laptops" },
            ]
          },
          { 
            category: "Gaming PCs",
            links: [
              { name: "Pre-Built Gaming PCs", href: "/category/computers/gaming-pcs" },
              { name: "Custom Build", href: "/category/computers/gaming-pcs" },
            ]
          },
          { 
            category: "Graphics Cards",
            links: [
              { name: "NVIDIA RTX", href: "/category/gaming/pc-gaming/NVIDIA" },
              { name: "AMD Radeon", href: "/category/gaming/pc-gaming/AMD" },
            ]
          },
        ],
        footer: { name: "Shop PC Gaming", href: "/category/gaming/pc-gaming" }
      },
      {
        title: "Gaming Accessories",
        items: [
          { 
            category: "Controllers",
            links: [
              { name: "PS5 Controllers", href: "/category/gaming/playstation-accessories" },
              { name: "Xbox Controllers", href: "/category/gaming/xbox-series" },
              { name: "Pro Controllers", href: "/category/gaming/controllers" },
            ]
          },
          { 
            category: "Gaming Gear",
            links: [
              { name: "Gaming Headsets", href: "/category/gaming/consoles" },
              { name: "Gaming Keyboards", href: "/category/gaming/consoles" },
              { name: "Gaming Mice", href: "/category/gaming/consoles" },
              { name: "Mouse Pads", href: "/category/gaming/consoles" },
            ]
          },
        ],
        footer: { name: "Shop All Accessories", href: "/category/gaming/consoles" }
      },
    ],
    featured: {
      image: "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=400&q=80",
      badge: "NEW",
      title: "PlayStation 5",
      description: "New Games Available",
      href: "/products/ps5-slim",
      cta: "Shop PS5"
    }
  },
  cameras: {
    columns: [
      {
        title: "Cameras",
        items: [
          { 
            category: "Digital Cameras",
            links: [
              { name: "DSLR Cameras", href: "/category/cameras/dslr-cameras" },
              { name: "Mirrorless", href: "/category/cameras/mirrorless" },
              { name: "Point & Shoot", href: "/category/cameras" },
            ]
          },
          { 
            category: "Action & Special",
            links: [
              { name: "Action Cameras", href: "/category/cameras/action-cameras" },
              { name: "Instant Cameras", href: "/category/cameras/instant-cameras" },
              { name: "360 Cameras", href: "/category/cameras" },
            ]
          },
          { 
            category: "Brands",
            links: [
              { name: "Sony", href: "/category/cameras?brand=Sony" },
              { name: "Canon", href: "/category/cameras?brand=Canon" },
              { name: "Nikon", href: "/category/cameras?brand=Nikon" },
            ]
          },
        ],
        footer: { name: "Shop All Cameras", href: "/category/cameras" }
      },
      {
        title: "Drones & Gimbal",
        items: [
          { 
            category: "Drones",
            links: [
              { name: "DJI Drones", href: "/category/cameras/drones/DJI" },
              { name: "Consumer Drones", href: "/category/cameras/drones" },
              { name: "Professional Drones", href: "/category/cameras/drones" },
            ]
          },
          { 
            category: "Stabilizers",
            links: [
              { name: "DJI Gimbals", href: "/category/cameras/gimbals/DJI" },
              { name: "Zhiyun Gimbals", href: "/category/cameras/gimbals" },
              { name: "Handheld Stabilizers", href: "/category/cameras/gimbals" },
            ]
          },
        ],
        footer: { name: "Shop All Drones", href: "/category/cameras/drones" }
      },
      {
        title: "Accessories",
        items: [
          { 
            category: "Lenses",
            links: [
              { name: "Camera Lenses", href: "/category/cameras/lenses" },
              { name: "Lens Accessories", href: "/category/cameras/lenses" },
            ]
          },
          { 
            category: "Storage & Bags",
            links: [
              { name: "Memory Cards", href: "/category/cameras/accessories" },
              { name: "Camera Bags", href: "/category/cameras/accessories" },
              { name: "Tripods", href: "/category/cameras/accessories" },
            ]
          },
        ],
        footer: { name: "Shop Accessories", href: "/category/cameras/accessories" }
      },
    ],
    featured: {
      image: "https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=400&q=80",
      badge: "NEW",
      title: "DJI Mini 4 Pro",
      description: "Capture Kenya from above",
      href: "/products/dji-mini-4-pro",
      cta: "Learn more"
    }
  },
  wearables: {
    columns: [
      {
        title: "Smartwatches",
        items: [
          { 
            category: "Apple Watch",
            links: [
              { name: "Series 10", href: "/category/wearables/apple-watch/Apple" },
              { name: "Ultra 2", href: "/category/wearables/apple-watch/Apple" },
              { name: "SE", href: "/category/wearables/apple-watch/Apple" },
            ]
          },
          { 
            category: "Samsung Galaxy Watch", 
            links: [
              { name: "Galaxy Watch 7", href: "/category/wearables/samsung-watch/Samsung" },
              { name: "Galaxy Watch Ultra", href: "/category/wearables/samsung-watch/Samsung" },
              { name: "Galaxy Watch FE", href: "/category/wearables/samsung-watch/Samsung" },
            ]
          },
          { 
            category: "Other Brands",
            links: [
              { name: "Garmin", href: "/category/wearables/smartwatches/Garmin" },
              { name: "Amazfit", href: "/category/wearables/smartwatches/Amazfit" },
              { name: "Fitbit", href: "/category/wearables/smartwatches/Fitbit" },
            ]
          },
        ],
        footer: { name: "Shop All Smartwatches", href: "/category/wearables/smartwatches" }
      },
      {
        title: "Fitness & Audio",
        items: [
          { 
            category: "Fitness Trackers",
            links: [
              { name: "Xiaomi Band", href: "/category/wearables/fitness-trackers/Xiaomi" },
              { name: "Garmin", href: "/category/wearables/fitness-trackers/Garmin" },
              { name: "Amazfit Band", href: "/category/wearables/fitness-trackers/Amazfit" },
            ]
          },
          { 
            category: "Wireless Earbuds",
            links: [
              { name: "AirPods", href: "/category/wearables/wireless-earbuds/Apple" },
              { name: "Galaxy Buds", href: "/category/wearables/wireless-earbuds/Samsung" },
              { name: "Other Earbuds", href: "/category/wearables/wireless-earbuds" },
            ]
          },
        ],
        footer: { name: "Shop All Wearables", href: "/category/wearables" }
      },
      {
        title: "Smart Glasses",
        items: [
          { 
            category: "Smart Glasses",
            links: [
              { name: "Audio Glasses", href: "/category/wearables/smart-glasses" },
              { name: "AR Glasses", href: "/category/wearables/smart-glasses" },
              { name: "Camera Glasses", href: "/category/wearables/smart-glasses" },
            ]
          },
        ],
        footer: { name: "Shop Smart Glasses", href: "/category/wearables/smart-glasses" }
      },
    ],
    featured: {
      image: "https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?w=400&q=80",
      badge: "NEW",
      title: "Apple Watch Ultra 2",
      description: "Toughest Apple Watch ever",
      href: "/products/apple-watch-ultra-2",
      cta: "Shop now"
    }
  },
  "smart-home": {
    columns: [
      {
        title: "Smart TVs",
        items: [
          { 
            category: "Samsung TVs",
            links: [
              { name: "QLED 4K", href: "/category/smart-home/samsung-tvs/Samsung" },
              { name: "Crystal UHD", href: "/category/smart-home/samsung-tvs/Samsung" },
              { name: "OLED", href: "/category/smart-home/samsung-tvs/Samsung" },
            ]
          },
          { 
            category: "Other Brands",
            links: [
              { name: "LG OLED", href: "/category/smart-home/lg-tvs/LG" },
              { name: "Sony TVs", href: "/category/smart-home/sony-tvs/Sony" },
              { name: "TCL TVs", href: "/category/smart-home/tcl-tvs/TCL" },
              { name: "Hisense TVs", href: "/category/smart-home/hisense-tvs/Hisense" },
            ]
          },
          { 
            category: "Vision Plus",
            links: [
              { name: "Vidaa TVs", href: "/category/smart-home/vision-plus-tvs/Vision+"},
              { name: "Smart TVs", href: "/category/smart-home/vision-plus-tvs"},
            ]
          },
        ],
        footer: { name: "Shop All TVs", href: "/category/smart-home/smart-tvs" }
      },
      {
        title: "Connectivity",
        items: [
          { 
            category: "Starlink",
            links: [
              { name: "Residential Kit", href: "/category/smart-home/starlink/Starlink" },
              { name: "Roam/Mini", href: "/category/smart-home/starlink/Starlink" },
              { name: "Accessories", href: "/category/smart-home/starlink" },
            ]
          },
          { 
            category: "Networking",
            links: [
              { name: "WiFi 6 Routers", href: "/category/smart-home/networking" },
              { name: "WiFi 7 Routers", href: "/category/smart-home/networking" },
              { name: "Mesh WiFi", href: "/category/smart-home/mesh-wifi" },
              { name: "Mobile WiFi", href: "/category/smart-home/mobile-wifi" },
            ]
          },
        ],
        footer: { name: "Shop Connectivity", href: "/category/smart-home/networking" }
      },
      {
        title: "Streaming & Smart",
        items: [
          { 
            category: "Streaming Devices",
            links: [
              { name: "Apple TV", href: "/category/smart-home/streaming/Apple" },
              { name: "Chromecast", href: "/category/smart-home/streaming" },
              { name: "Amazon Fire TV", href: "/category/smart-home/streaming" },
            ]
          },
          { 
            category: "Smart Home",
            links: [
              { name: "Smart Lights", href: "/category/smart-home/smart-lights" },
              { name: "Smart Plugs", href: "/category/smart-home/smart-home-devices" },
              { name: "Security Cameras", href: "/category/smart-home/security-cameras" },
            ]
          },
        ],
        footer: { name: "Shop Smart Home", href: "/category/smart-home" }
      },
    ],
    featured: {
      image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&q=80",
      badge: "POPULAR",
      title: "Starlink",
      description: "High-speed internet everywhere",
      href: "/products/starlink-standard",
      cta: "Get Starlink"
    }
  },
};

const navItems = [
  { id: "store", label: "Store", href: "/store", hasMegaMenu: false },
  { id: "mobile", label: "Mobile", href: "/category/mobile", hasMegaMenu: true },
  { id: "computing", label: "Computing", href: "/category/computers", hasMegaMenu: true },
  { id: "audio", label: "Audio", href: "/category/audio", hasMegaMenu: true },
  { id: "gaming", label: "Gaming", href: "/category/gaming", hasMegaMenu: true },
  { id: "cameras", label: "Cameras", href: "/category/cameras", hasMegaMenu: true },
  { id: "wearables", label: "Wearables", href: "/category/wearables", hasMegaMenu: true },
  { id: "smart-home", label: "Smart Home", href: "/category/smart-home", hasMegaMenu: true },
  { id: "deals", label: "Deals", href: "/deals", hasMegaMenu: false },
];

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [scrollDir, setScrollDir] = useState<'up' | 'down'>('up');
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeMegaMenu, setActiveMegaMenu] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { setIsOpen: setSearchOpen } = useSearchStore();
  const [expandedMobileCategories, setExpandedMobileCategories] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  
  const cart = useCartStore((s) => s.cart);
  const isOpen = useCartStore((s) => s.isOpen);
  const setIsOpen = useCartStore((s) => s.setIsOpen);
  const getCartCount = useCartStore((s) => s.getCartCount);
  const cartCountNum = mounted ? getCartCount() : 0;
  
  const megaMenuRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery("");
    }
  };

  const handleMobileSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setIsMobileMenuOpen(false);
      setSearchQuery("");
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY;
      setIsScrolled(y > 0);
      setScrollDir(y > lastScrollY && y > 44 ? 'down' : 'up');
      setLastScrollY(y);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    setMounted(true);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  const handleMouseLeave = () => {
    closeTimeoutRef.current = setTimeout(() => {
      setActiveMegaMenu(null);
    }, 200);
  };

  const handleMouseEnter = (id: string) => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setActiveMegaMenu(id);
  };

  const handleMegaMenuMouseEnter = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  };

  const toggleMobileCategory = (categoryId: string) => {
    setExpandedMobileCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const isMobileCategoryExpanded = (categoryId: string) => {
    return expandedMobileCategories.includes(categoryId);
  };

  const currentMegaMenu = activeMegaMenu && megaMenuData[activeMegaMenu as keyof typeof megaMenuData];

  return (
    <>
      <nav
        ref={navRef}
        className="fixed top-0 left-0 right-0 z-[9999] h-[44px] transition-all duration-300"
        style={{
          backgroundColor: scrollDir === 'down' && isScrolled ? 'transparent' : "rgba(29, 29, 31, 0.92)",
          backdropFilter: scrollDir === 'down' && isScrolled ? 'none' : "saturate(180%) blur(20px)",
          transform: scrollDir === 'down' && isScrolled ? 'translateY(-100%)' : 'translateY(0)',
        }}
      >
        <div className="max-w-[980px] mx-auto px-4 h-full flex items-center justify-between">
          <Link 
            href="/" 
            className="text-[#f5f5f7] hover:text-white transition-colors duration-300 text-lg font-semibold tracking-tight"
          >
            Trovestak
          </Link>

          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <div
                key={item.id}
                className="relative"
                onMouseEnter={() => item.hasMegaMenu && handleMouseEnter(item.id)}
                onMouseLeave={handleMouseLeave}
              >
                <Link
                  href={item.href}
                  className={`text-[12px] font-normal tracking-wide transition-colors duration-300 ${
                    activeMegaMenu === item.id 
                      ? "text-white" 
                      : "text-[rgba(245,245,247,0.88)] hover:text-white"
                  }`}
                  style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}
                >
                  {item.label}
                </Link>
              </div>
            ))}
          </div>

          <div className="flex items-center space-x-6">
            <button
              onClick={() => setSearchOpen(true)}
              className="text-[rgba(245,245,247,0.88)] hover:text-white transition-colors duration-300"
              aria-label="Search"
            >
              <Search className="w-4 h-4" strokeWidth={1.5} />
            </button>
            <button
              onClick={() => setIsOpen(true)}
              className="relative text-[rgba(245,245,247,0.88)] hover:text-white transition-colors duration-300"
              aria-label="Shopping bag"
            >
              <ShoppingBag className="w-4 h-4" strokeWidth={1.5} />
              {cartCountNum > 0 && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-[#00C853] text-white text-[8px] rounded-full flex items-center justify-center font-medium">
                  {cartCountNum}
                </span>
              )}
            </button>
          </div>

          <button
            className="md:hidden text-[rgba(245,245,247,0.88)] hover:text-white transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {activeMegaMenu && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.75 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="fixed inset-0 top-[44px] z-[9997] bg-white pointer-events-none"
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {currentMegaMenu && (
          <motion.div
            ref={megaMenuRef}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="fixed left-0 right-0 top-[44px] z-[9998] w-full"
            style={{
              backgroundColor: "rgba(29, 29, 31, 0.95)",
              backdropFilter: "blur(20px)",
            }}
            onMouseEnter={handleMegaMenuMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <div className="max-w-[1200px] mx-auto px-8 py-10">
              <div className="grid grid-cols-12 gap-10">
                {currentMegaMenu.columns.map((column, idx) => (
                  <div key={idx} className="col-span-3">
                    <h3 className="text font-semibold text-[12px]-[rgba(245,245,247,0.6)] uppercase tracking-[0.5px] mb-4">
                      {column.title}
                    </h3>
                    <div className="space-y-4">
                      {column.items.map((group, groupIdx) => {
                        const actualSlug = categorySlugMapping[group.category] || group.category.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
                        const baseHref = `/category/${activeMegaMenu}/${actualSlug}`;
                        return (
                        <div key={groupIdx}>
                          <Link
                            href={baseHref}
                            className="text-[14px] font-semibold text-[rgba(245,245,247,0.88)] hover:text-white mb-2 inline-block transition-colors"
                            onClick={() => setActiveMegaMenu(null)}
                          >
                            {group.category}
                          </Link>
                          <ul className="space-y-1">
                            {group.links.map((link, linkIdx) => (
                              <li key={linkIdx}>
                                <Link
                                  href={link.href}
                                  className="text-[14px] text-[rgba(245,245,247,0.88)] hover:text-white transition-colors duration-200 block py-0.5"
                                  onClick={() => setActiveMegaMenu(null)}
                                >
                                  {link.name}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      );
                      })}
                    </div>
                    {column.footer && (
                      <Link
                        href={column.footer.href}
                        className="inline-flex items-center gap-1 mt-6 text-[14px] text-[rgba(245,245,247,0.88)] hover:text-white transition-colors duration-200"
                        onClick={() => setActiveMegaMenu(null)}
                      >
                        {column.footer.name} <ChevronRight className="w-3 h-3" />
                      </Link>
                    )}
                  </div>
                ))}

                {currentMegaMenu.featured && (
                  <div className="col-span-3 border-l border-[rgba(245,245,247,0.1)] pl-10">
                    <div className="relative">
                      {currentMegaMenu.featured.badge && (
                        <span className="absolute top-2 left-2 px-2 py-0.5 bg-[#f56300] text-white text-[10px] font-semibold rounded">
                          {currentMegaMenu.featured.badge}
                        </span>
                      )}
                      <img
                        src={currentMegaMenu.featured.image}
                        alt={currentMegaMenu.featured.title}
                        className="w-full aspect-square object-cover rounded-xl mb-4"
                      />
                    </div>
                    <h4 className="text-[16px] font-semibold text-white mb-1">
                      {currentMegaMenu.featured.title}
                    </h4>
                    <p className="text-[14px] text-[rgba(245,245,247,0.6)] mb-3">
                      {currentMegaMenu.featured.description}
                    </p>
                    <Link
                      href={currentMegaMenu.featured.href}
                      className="text-[14px] text-[#00C853] hover:underline"
                      onClick={() => setActiveMegaMenu(null)}
                    >
                      {currentMegaMenu.featured.cta} →
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search overlay is rendered via SearchOverlay in StorefrontWrapper */}

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 top-[44px] z-[9998] bg-[rgba(29,29,31,0.98)] md:hidden overflow-auto"
          >
            <div className="px-6 pt-6 pb-20">
              <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search Trovestak"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleMobileSearch}
                  className="w-full pl-10 pr-4 py-3 bg-[rgba(245,245,247,0.1)] text-white text-[17px] rounded-xl outline-none placeholder-gray-500"
                />
              </div>

              <nav className="space-y-0">
                {navItems.map((item) => (
                  <div key={item.id} className="border-b border-[rgba(245,245,247,0.1)]">
                    {item.hasMegaMenu ? (
                      <>
                        <button
                          onClick={() => toggleMobileCategory(item.id)}
                          className="w-full flex items-center justify-between py-4 text-[17px] text-[rgba(245,245,247,0.88)] hover:text-white transition-colors"
                        >
                          <span>{item.label}</span>
                          <ChevronDown 
                            className={`w-5 h-5 transition-transform duration-300 ${isMobileCategoryExpanded(item.id) ? 'rotate-180' : ''}`} 
                          />
                        </button>
                        
                        <AnimatePresence>
                          {isMobileCategoryExpanded(item.id) && megaMenuData[item.id as keyof typeof megaMenuData] && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                              className="overflow-hidden"
                            >
                              <div className="pb-4 pl-4 space-y-4">
                                {megaMenuData[item.id as keyof typeof megaMenuData].columns.map((column, colIdx) => (
                                  <div key={colIdx} className="space-y-2">
                                    <p className="text-[12px] font-semibold text-[rgba(245,245,247,0.5)] uppercase tracking-wide">
                                      {column.title}
                                    </p>
                                    <div className="space-y-1">
                                      {column.items.map((group, groupIdx) => {
                                        const actualSlug = categorySlugMapping[group.category] || group.category.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
                                        const baseHref = `/category/${item.id}/${actualSlug}`;
                                        return (
                                        <div key={groupIdx}>
                                          <Link
                                            href={baseHref}
                                            onClick={() => setIsMobileMenuOpen(false)}
                                            className="text-[14px] font-medium text-[rgba(245,245,247,0.7)] hover:text-white mt-2 inline-block transition-colors"
                                          >
                                            {group.category}
                                          </Link>
                                          {group.links.map((link, linkIdx) => (
                                            <Link
                                              key={linkIdx}
                                              href={link.href}
                                              onClick={() => setIsMobileMenuOpen(false)}
                                              className="block py-2 text-[15px] text-[rgba(245,245,247,0.88)] hover:text-white transition-colors pl-2"
                                            >
                                              {link.name}
                                            </Link>
                                          ))}
                                        </div>
                                      );
                                      })}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </>
                    ) : (
                      <Link
                        href={item.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="block py-4 text-[17px] text-[rgba(245,245,247,0.88)] hover:text-white transition-colors"
                      >
                        {item.label}
                      </Link>
                    )}
                  </div>
                ))}
              </nav>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
