"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

export function Breadcrumbs() {
    const pathname = usePathname();
    const paths = pathname.split("/").filter(Boolean);

    // Don't show on dashboard root
    if (paths.length <= 1) return null;

    return (
        <nav className="flex items-center space-x-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-6 px-1 overflow-x-auto whitespace-nowrap scrollbar-hide">
            <Link
                href="/admin"
                className="flex items-center hover:text-foreground transition-colors"
            >
                <Home className="w-3 h-3 mr-1.5" />
                Admin
            </Link>

            {paths.slice(1).map((path, index) => {
                const href = `/${paths.slice(0, index + 2).join("/")}`;
                const isLast = index === paths.length - 2;
                const label = path.charAt(0).toUpperCase() + path.slice(1).replace(/-/g, " ");

                return (
                    <div key={path} className="flex items-center space-x-2">
                        <ChevronRight className="w-3 h-3 opacity-40" />
                        <Link
                            href={href}
                            className={cn(
                                "transition-colors",
                                isLast ? "text-foreground pointer-events-none" : "hover:text-foreground"
                            )}
                        >
                            {label}
                        </Link>
                    </div>
                );
            })}
        </nav>
    );
}
