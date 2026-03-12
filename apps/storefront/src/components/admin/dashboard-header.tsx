"use client";

import { useState } from "react";
import { Filter, Calendar, ChevronDown, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function DashboardHeader() {
    const [range, setRange] = useState("Last 7 Days");

    const ranges = [
        "Today",
        "Yesterday",
        "Last 7 Days",
        "Last 30 Days",
        "This Month",
        "Last Month"
    ];

    return (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
            <div>
                <div className="flex items-center gap-3 mb-1">
                    <h2 className="text-4xl font-black text-foreground tracking-tight">Intelligence</h2>
                    <Badge className="bg-primary hover:bg-primary shadow-lg shadow-primary/20 text-white border-none font-black text-[10px] uppercase tracking-widest px-2.5 py-1 rounded-lg">Pro</Badge>
                </div>
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-[0.2em]">
                    Performance telemetry across the ecosystem
                </p>
            </div>

            <div className="flex items-center gap-3">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="h-12 rounded-2xl border-white/20 bg-white/5 backdrop-blur-sm text-foreground text-[11px] font-black uppercase tracking-widest px-6 hover:bg-white/10 transition-all border border-gray-200 dark:border-border gap-2">
                            <Calendar className="w-4 h-4 text-primary" />
                            {range}
                            <ChevronDown className="w-3 h-3 opacity-40" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 p-2 rounded-2xl border-border shadow-2xl">
                        {ranges.map((r) => (
                            <DropdownMenuItem
                                key={r}
                                onClick={() => setRange(r)}
                                className="p-3 rounded-xl cursor-pointer hover:bg-primary/5 focus:bg-primary/5 text-[10px] font-black uppercase tracking-widest transition-colors"
                            >
                                {r}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>

                <Button variant="outline" className="h-12 rounded-2xl border-white/20 bg-white/5 backdrop-blur-sm text-foreground/40 text-[11px] font-black uppercase tracking-widest px-6 hover:bg-white/10 transition-all border border-gray-200 dark:border-border gap-2">
                    <Download className="w-4 h-4" />
                    Export
                </Button>
            </div>
        </div>
    );
}
