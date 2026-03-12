"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Sparkles, Zap, Shield, Truck, Smartphone } from "lucide-react";

interface Slide {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  cta: { text: string; href: string };
  gradient: string;
}

const slides: Slide[] = [
  {
    id: "1",
    title: "iPhone 16 Pro",
    subtitle: "New Arrival",
    description: "The most powerful iPhone ever with A18 Pro chip.",
    cta: { text: "Shop Now", href: "/category/mobile" },
    gradient: "from-slate-900 via-purple-900 to-slate-900",
  },
  {
    id: "2",
    title: "MacBook Air",
    subtitle: "Supercharged by M3",
    description: "Incredibly thin. Incredibly fast. Incredibly powerful.",
    cta: { text: "Shop Now", href: "/category/computing" },
    gradient: "from-gray-900 via-blue-900 to-gray-900",
  },
  {
    id: "3",
    title: "Samsung Galaxy S25",
    subtitle: "Galaxy AI",
    description: "Your everyday AI companion is here.",
    cta: { text: "Shop Now", href: "/category/mobile" },
    gradient: "from-blue-900 via-indigo-900 to-purple-900",
  },
  {
    id: "4",
    title: "Sony WH-1000XM5",
    subtitle: "Industry-leading Noise Cancellation",
    description: "Hear nothing but your music.",
    cta: { text: "Shop Now", href: "/category/audio" },
    gradient: "from-gray-800 via-slate-700 to-gray-800",
  },
];

export function HeroCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const paginate = useCallback((direction: number) => {
    setCurrentIndex((prev) => {
      if (direction === 1) {
        return prev === slides.length - 1 ? 0 : prev + 1;
      }
      return prev === 0 ? slides.length - 1 : prev - 1;
    });
  }, []);

  useEffect(() => {
    const timer = setInterval(() => paginate(1), 5000);
    return () => clearInterval(timer);
  }, [paginate]);

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const swipeThreshold = 50;
    if (info.offset.x > swipeThreshold) paginate(-1);
    else if (info.offset.x < -swipeThreshold) paginate(1);
  };

  const currentSlide = slides[currentIndex];

  return (
    <section className="relative h-[600px] md:h-[700px] overflow-hidden">
      <AnimatePresence initial={false}>
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7 }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={1}
          onDragEnd={handleDragEnd}
          className={`absolute inset-0 bg-gradient-to-br ${currentSlide.gradient}`}
        >
          {/* Animated background pattern */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-400 rounded-full blur-3xl animate-pulse delay-1000" />
          </div>

          <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center">
            <div className="grid md:grid-cols-2 gap-12 items-center w-full">
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                className="text-white"
              >
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-sm mb-6">
                  <Sparkles className="w-4 h-4 text-yellow-300" />
                  <span>{currentSlide.subtitle}</span>
                </div>
                <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-4">
                  {currentSlide.title}
                </h1>
                <p className="text-lg md:text-xl text-white/80 mb-8 max-w-md">
                  {currentSlide.description}
                </p>
                <Link
                  href={currentSlide.cta.href}
                  className="inline-flex items-center gap-2 px-8 py-4 bg-white text-black font-bold rounded-full hover:bg-gray-100 transition-all hover:scale-105 shadow-lg"
                >
                  {currentSlide.cta.text}
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="hidden md:block"
              >
                <div className="relative w-full aspect-square">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-3xl backdrop-blur-sm border border-white/20" />
                  <div className="absolute inset-8 flex items-center justify-center">
                    <Smartphone className="w-24 h-24 text-white/30" />
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Custom Dots */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3">
        {slides.map((slide, i) => (
          <button
            key={slide.id}
            onClick={() => paginate(i > currentIndex ? 1 : -1)}
            className={`h-1 rounded-full transition-all duration-300 ${
              i === currentIndex 
                ? "w-12 bg-white" 
                : "w-4 bg-white/40 hover:bg-white/60"
            }`}
          />
        ))}
      </div>
    </section>
  );
}

export function ValueProps() {
  const features = [
    {
      icon: Truck,
      title: "Express Delivery",
      description: "Same-day in Nairobi, next-day across Kenya",
      color: "bg-blue-500",
    },
    {
      icon: Shield,
      title: "Official Warranty",
      description: "100% genuine products with manufacturer support",
      color: "bg-green-500",
    },
    {
      icon: Zap,
      title: "Best Prices",
      description: "Competitive pricing on all premium electronics",
      color: "bg-yellow-500",
    },
  ];

  return (
    <section className="py-16 bg-gradient-to-b from-background to-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.4 }}
              className="flex items-start gap-4 p-6 rounded-2xl bg-card border border-border/50 hover:border-primary/30 transition-colors"
            >
              <div className={`p-3 rounded-xl ${feature.color} text-white`}>
                <feature.icon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg">{feature.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{feature.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
