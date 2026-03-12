"use client";

import Link from "next/link";
import { useState } from "react";
import { Mail, Phone, MapPin, Send, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const shopLinks = [
    { label: "Mobile Phones", href: "/category/mobile" },
    { label: "Computing", href: "/category/computing" },
    { label: "Audio", href: "/category/audio" },
    { label: "Gaming", href: "/category/gaming" },
    { label: "Cameras", href: "/category/cameras" },
    { label: "Wearables", href: "/category/wearables" },
    { label: "Smart Home", href: "/category/smart-home" },
    { label: "Deals", href: "/deals" },
];

const supportLinks = [
    { label: "Help Center", href: "/support" },
    { label: "Track Order", href: "/orders" },
    { label: "Returns & Refunds", href: "/returns" },
    { label: "Warranty Info", href: "/warranty" },
    { label: "Trade-In Program", href: "/trade-in" },
    { label: "Contact Us", href: "/contact" },
];

const companyLinks = [
    { label: "About Trovestak", href: "/about" },
    { label: "Careers", href: "/careers" },
    { label: "Blog", href: "/blog" },
    { label: "Terms of Service", href: "/terms" },
    { label: "Privacy Policy", href: "/privacy" },
];

const socialLinks = [
    { label: "WhatsApp", href: "https://wa.me/254700000000" },
    { label: "Instagram", href: "https://instagram.com/trovestak" },
    { label: "Twitter", href: "https://x.com/trovestak" },
    { label: "LinkedIn", href: "https://linkedin.com/company/trovestak" },
];

import { subscribeToNewsletter } from "@/app/actions";

export function Footer() {
    const [email, setEmail] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [subscribed, setSubscribed] = useState(false);

    const handleSubscribe = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;

        setIsSubmitting(true);

        try {
            const result = await subscribeToNewsletter(email);
            if (result.success) {
                setSubscribed(true);
                setEmail("");
            }
        } catch (err) {
            console.error("Newsletter error:", err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-background border-t border-border">
            {/* Newsletter Section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
                    <div className="text-center lg:text-left max-w-lg">
                        <h3 className="text-xl font-semibold text-foreground">
                            Stay updated
                        </h3>
                        <p className="mt-2 text-sm text-muted-foreground">
                            Subscribe for updates on new products and exclusive offers.
                        </p>
                    </div>

                    <form onSubmit={handleSubscribe} className="flex w-full max-w-md">
                        {subscribed ? (
                            <p className="text-sm text-green-600 font-medium">
                                Thanks for subscribing!
                            </p>
                        ) : (
                            <>
                                <Input
                                    type="email"
                                    placeholder="Enter your email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="rounded-r-none border-r-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                                />
                                <Button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="rounded-l-none px-6"
                                >
                                    {isSubmitting ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Send className="w-4 h-4" />
                                    )}
                                </Button>
                            </>
                        )}
                    </form>
                </div>
            </div>

            {/* Main Footer Content */}
            <div className="border-t border-border">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
                        {/* Logo & Description */}
                        <div className="col-span-2">
                            <Link href="/" className="inline-block">
                                <span className="text-xl font-bold tracking-tight">
                                    Trovestak
                                </span>
                            </Link>
                            <p className="mt-3 text-sm text-muted-foreground max-w-xs">
                                Kenya's trusted source for premium electronics with official warranties.
                            </p>
                            <div className="mt-6 flex gap-6">
                                {socialLinks.map((link) => (
                                    <a
                                        key={link.label}
                                        href={link.href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-muted-foreground hover:text-foreground transition-colors text-sm"
                                    >
                                        {link.label}
                                    </a>
                                ))}
                            </div>
                        </div>

                        {/* Shop Links */}
                        <div>
                            <h4 className="text-sm font-medium text-foreground mb-4">
                                Shop
                            </h4>
                            <ul className="space-y-2.5">
                                {shopLinks.map((link) => (
                                    <li key={link.href}>
                                        <Link
                                            href={link.href}
                                            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                                        >
                                            {link.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Support Links */}
                        <div>
                            <h4 className="text-sm font-medium text-foreground mb-4">
                                Support
                            </h4>
                            <ul className="space-y-2.5">
                                {supportLinks.map((link) => (
                                    <li key={link.href}>
                                        <Link
                                            href={link.href}
                                            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                                        >
                                            {link.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Company Links */}
                        <div>
                            <h4 className="text-sm font-medium text-foreground mb-4">
                                Company
                            </h4>
                            <ul className="space-y-2.5">
                                {companyLinks.map((link) => (
                                    <li key={link.href}>
                                        <Link
                                            href={link.href}
                                            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                                        >
                                            {link.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Bar */}
            <div className="border-t border-border">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
                        <p>© {currentYear} Trovestak Kenya. All rights reserved.</p>
                        <div className="flex items-center gap-6">
                            <a href="tel:+254700000000" className="hover:text-foreground transition-colors">
                                +254 700 000 000
                            </a>
                            <a href="mailto:hello@trovestak.com" className="hover:text-foreground transition-colors">
                                hello@trovestak.com
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
