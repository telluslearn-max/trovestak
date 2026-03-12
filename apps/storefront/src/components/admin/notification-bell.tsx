"use client";

import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { getAdminNotifications } from "@/app/actions";

export function NotificationBell() {
    const [count, setCount] = useState(0);
    const [recentOrders, setRecentOrders] = useState<any[]>([]);

    useEffect(() => {
        const fetchNotifications = async () => {
            const { success, data } = await getAdminNotifications();
            if (success) {
                setRecentOrders(data || []);
                setCount(data?.length || 0);
            }
        };

        fetchNotifications();

        // Subscribe to new orders
        const channel = supabase
            .channel("admin-notifications")
            .on(
                "postgres_changes",
                { event: "INSERT", schema: "public", table: "orders" },
                () => fetchNotifications()
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 relative">
                    <Bell className="h-4 w-4" />
                    {count > 0 && (
                        <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 border-2 border-white animate-pulse" />
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 p-2 rounded-2xl border-border shadow-2xl">
                <div className="px-3 py-2 border-b border-border mb-2">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Recent Activity</h3>
                </div>
                {recentOrders.length > 0 ? (
                    recentOrders.map((order) => (
                        <DropdownMenuItem key={order.id} className="p-3 rounded-xl cursor-pointer hover:bg-muted focus:bg-muted flex flex-col items-start gap-1">
                            <div className="flex items-center justify-between w-full">
                                <span className="text-xs font-bold text-foreground">New Order #{order.id.slice(0, 8)}</span>
                                <span className="text-[9px] font-medium text-muted-foreground">{new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <p className="text-[10px] text-muted-foreground">A new order worth KES {(order.total_amount / 100).toLocaleString()} is awaiting processing.</p>
                        </DropdownMenuItem>
                    ))
                ) : (
                    <div className="py-8 text-center">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">No new notifications</p>
                    </div>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
