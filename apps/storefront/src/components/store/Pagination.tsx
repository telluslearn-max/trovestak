"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    className?: string;
}

export function Pagination({
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    className,
}: PaginationProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const goToPage = (page: number) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("page", String(page));
        router.push(`/store?${params.toString()}`);
    };

    if (totalPages <= 1) return null;

    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    // Generate page numbers to show
    const getPageNumbers = () => {
        const pages: (number | "ellipsis")[] = [];
        const showEllipsis = totalPages > 7;

        if (!showEllipsis) {
            return Array.from({ length: totalPages }, (_, i) => i + 1);
        }

        // Always show first page
        pages.push(1);

        if (currentPage > 3) {
            pages.push("ellipsis");
        }

        // Show pages around current
        const start = Math.max(2, currentPage - 1);
        const end = Math.min(totalPages - 1, currentPage + 1);

        for (let i = start; i <= end; i++) {
            pages.push(i);
        }

        if (currentPage < totalPages - 2) {
            pages.push("ellipsis");
        }

        // Always show last page
        if (totalPages > 1) {
            pages.push(totalPages);
        }

        return pages;
    };

    return (
        <div className={cn("flex flex-col md:flex-row items-center justify-between gap-4", className)}>
            {/* Items count */}
            <p className="text-sm text-muted-foreground">
                Showing <span className="font-bold text-foreground">{startItem}</span> -{" "}
                <span className="font-bold text-foreground">{endItem}</span> of{" "}
                <span className="font-bold text-foreground">{totalItems}</span> products
            </p>

            {/* Page navigation */}
            <div className="flex items-center gap-1">
                {/* Previous */}
                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="h-10 w-10 rounded-lg"
                >
                    <ChevronLeft className="w-4 h-4" />
                </Button>

                {/* Page numbers */}
                {getPageNumbers().map((page, i) =>
                    page === "ellipsis" ? (
                        <span key={`ellipsis-${i}`} className="px-2 text-muted-foreground">
                            ...
                        </span>
                    ) : (
                        <Button
                            key={page}
                            variant={page === currentPage ? "default" : "outline"}
                            onClick={() => goToPage(page)}
                            className={cn(
                                "h-10 w-10 rounded-lg font-bold",
                                page === currentPage && "bg-primary text-white"
                            )}
                        >
                            {page}
                        </Button>
                    )
                )}

                {/* Next */}
                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="h-10 w-10 rounded-lg"
                >
                    <ChevronRight className="w-4 h-4" />
                </Button>
            </div>

            {/* Items per page */}
            <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Show:</span>
                <select
                    value={itemsPerPage}
                    onChange={(e) => {
                        const params = new URLSearchParams(searchParams.toString());
                        params.set("perPage", e.target.value);
                        params.delete("page");
                        router.push(`/store?${params.toString()}`);
                    }}
                    className="h-10 px-3 bg-muted/30 border border-border/50 rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20"
                >
                    <option value="12">12</option>
                    <option value="24">24</option>
                    <option value="48">48</option>
                </select>
            </div>
        </div>
    );
}
