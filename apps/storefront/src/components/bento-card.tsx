"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface BentoCardProps {
  title: string;
  subtitle: string;
  description: string;
  href: string;
  variant?: "large" | "medium" | "small";
  gradient?: string;
}

const gradients = {
  mobile: "from-blue-600 via-indigo-600 to-purple-600",
  computing: "from-slate-600 via-gray-600 to-zinc-600",
  audio: "from-rose-500 via-orange-500 to-amber-500",
  gaming: "from-violet-600 via-purple-600 to-fuchsia-600",
  wearables: "from-emerald-500 via-teal-500 to-cyan-500",
  smartHome: "from-lime-500 via-green-500 to-emerald-500",
  cameras: "from-amber-500 via-orange-500 to-red-500",
  deals: "from-red-600 via-pink-600 to-rose-600",
};

function BentoCard({ title, subtitle, description, href, variant = "medium", gradient = "from-slate-700 to-slate-800" }: BentoCardProps) {
  const sizeClasses = {
    large: "col-span-2 row-span-2",
    medium: "col-span-1 row-span-2",
    small: "col-span-1 row-span-1",
  };

  return (
    <Link
      href={href}
      className={`relative overflow-hidden rounded-2xl group cursor-pointer ${sizeClasses[variant]}`}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`} />
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        <div className="absolute top-4 right-4 w-32 h-32 bg-white/20 rounded-full blur-2xl" />
        <div className="absolute bottom-4 left-4 w-24 h-24 bg-white/10 rounded-full blur-xl" />
      </div>
      <div className="relative h-full flex flex-col justify-end p-6">
        <div className="mb-auto pt-4">
          <span className="inline-block px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-xs font-medium text-white">
            {subtitle}
          </span>
        </div>
        <h3 className="text-2xl font-black text-white mb-1">{title}</h3>
        <p className="text-white/70 text-sm mb-4">{description}</p>
        <div className="inline-flex items-center gap-2 text-white font-medium text-sm group-hover:gap-3 transition-all">
          Shop now <ArrowRight className="w-4 h-4" />
        </div>
      </div>
    </Link>
  );
}

export function BentoGrid() {
  const categories = [
    { title: "Mobile Phones", subtitle: "New Arrivals", description: "iPhone, Samsung, Pixel & more", href: "/category/mobile", variant: "large" as const, gradient: gradients.mobile },
    { title: "Computing", subtitle: "Laptops", description: "MacBook, Windows & more", href: "/category/computing", variant: "medium" as const, gradient: gradients.computing },
    { title: "Audio", subtitle: "Sound", description: "Headphones & speakers", href: "/category/audio", variant: "small" as const, gradient: gradients.audio },
    { title: "Gaming", subtitle: "Play", description: "Consoles & accessories", href: "/category/gaming", variant: "small" as const, gradient: gradients.gaming },
  ];

  return (
    <section>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 auto-rows-[220px]">
        {categories.map((cat, i) => (
          <motion.div
            key={cat.href}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1, duration: 0.4 }}
          >
            <BentoCard {...cat} />
          </motion.div>
        ))}
      </div>
    </section>
  );
}
