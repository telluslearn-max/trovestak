"use client";

import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

interface BreadcrumbItem {
    label: string;
    href?: string;
}

interface BreadcrumbProps {
    items: BreadcrumbItem[];
    className?: string;
}

export function Breadcrumb({ items, className }: BreadcrumbProps) {
    return (
        <nav className={cn("flex items-center gap-1.5 text-sm", className)}>
            <Link
                href="/"
                className="text-muted-foreground hover:text-foreground transition-colors"
            >
                <Home className="w-4 h-4" />
            </Link>
            
            {items.map((item, index) => (
                <div key={index} className="flex items-center gap-1.5">
                    <ChevronRight className="w-4 h-4 text-muted-foreground/40" />
                    {item.href && index < items.length - 1 ? (
                        <Link
                            href={item.href}
                            className="text-muted-foreground hover:text-foreground transition-colors font-medium"
                        >
                            {item.label}
                        </Link>
                    ) : (
                        <span className={cn(
                            "font-medium",
                            index === items.length - 1 ? "text-foreground" : "text-muted-foreground"
                        )}>
                            {item.label}
                        </span>
                    )}
                </div>
            ))}
        </nav>
    );
}
