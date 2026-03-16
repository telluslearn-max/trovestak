"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    Search, 
    Package, 
    CreditCard, 
    Truck, 
    CheckCircle2, 
    Clock, 
    AlertCircle,
    ChevronRight,
    MapPin,
    ArrowLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trackOrderAction } from "./actions";
import { formatKES } from "@/lib/formatters";
import Link from "next/link";
import { cn } from "@/lib/utils";

const STEPS = [
    { id: "ordered", label: "Order Placed", icon: Clock },
    { id: "paid", label: "Payment Confirmed", icon: CreditCard },
    { id: "processing", label: "Processing", icon: Package },
    { id: "dispatched", label: "Dispatched", icon: Truck },
    { id: "arrived", label: "Successfully Delivered", icon: CheckCircle2 },
];

export default function TrackingClient() {
    const [orderId, setOrderId] = useState("");
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [order, setOrder] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    const handleTrack = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        
        try {
            const res = await trackOrderAction(orderId, email);
            if (res.success) {
                setOrder(res.order);
            } else {
                setError(res.error || "Failed to find order");
            }
        } catch (err) {
            setError("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // Calculate current step index
    const getActiveStep = (status: string, paymentStatus: string) => {
        if (status === "cancelled") return -1;
        if (status === "arrived") return 4;
        if (status === "dispatched") return 3;
        if (status === "processing") return 2;
        if (paymentStatus === "paid" || status === "paid") return 1;
        return 0; // pending/ordered
    };

    const activeStepIndex = order ? getActiveStep(order.status, order.payment_status) : -1;

    return (
        <div className="container max-w-4xl mx-auto py-12 px-4 min-h-[80vh] flex flex-col items-center justify-center">
            <AnimatePresence mode="wait">
                {!order ? (
                    <motion.div
                        key="search"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="w-full max-w-md"
                    >
                        <div className="text-center mb-8">
                            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <Package className="w-8 h-8 text-primary" />
                            </div>
                            <h1 className="text-3xl font-bold tracking-tight mb-2">Track Your Order</h1>
                            <p className="text-muted-foreground">
                                Enter your order details to see real-time deployment status.
                            </p>
                        </div>

                        <Card className="border-border/40 shadow-xl shadow-primary/5 bg-background/50 backdrop-blur-xl">
                            <CardContent className="pt-6">
                                <form onSubmit={handleTrack} className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Order Number</label>
                                        <Input 
                                            placeholder="e.g. 550e8400-e29b-41d4-a716-446655440000" 
                                            value={orderId}
                                            onChange={(e) => setOrderId(e.target.value)}
                                            required
                                            className="bg-muted/30"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Email Address</label>
                                        <Input 
                                            type="email"
                                            placeholder="you@example.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                            className="bg-muted/30"
                                        />
                                    </div>
                                    {error && (
                                        <div className="flex items-center gap-2 text-red-500 text-sm bg-red-500/10 p-3 rounded-lg">
                                            <AlertCircle className="w-4 h-4" />
                                            <p>{error}</p>
                                        </div>
                                    )}
                                    <Button type="submit" className="w-full" disabled={loading}>
                                        {loading ? "Locating..." : "Track Deployment"}
                                        <ChevronRight className="ml-2 w-4 h-4" />
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </motion.div>
                ) : (
                    <motion.div
                        key="status"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="w-full space-y-8"
                    >
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                            <div>
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => setOrder(null)}
                                    className="mb-4 -ml-2 text-muted-foreground hover:text-foreground"
                                >
                                    <ArrowLeft className="mr-2 w-4 h-4" />
                                    Track another order
                                </Button>
                                <h1 className="text-4xl font-extrabold tracking-tighter">
                                    {order.status === "cancelled" ? "Order Cancelled" : "Deployment Status"}
                                </h1>
                                <p className="text-muted-foreground mt-1">
                                    Reference ID: <span className="font-mono text-foreground font-medium">{order.id}</span>
                                </p>
                            </div>
                            <div className="flex items-center gap-3">
                                <Badge variant="outline" className="px-4 py-1.5 border-primary/20 bg-primary/5 text-primary">
                                    {order.status.toUpperCase()}
                                </Badge>
                                <span className="text-sm text-muted-foreground">
                                    Placed {new Date(order.created_at).toLocaleDateString()}
                                </span>
                            </div>
                        </div>

                        {/* Visual Timeline */}
                        {order.status !== "cancelled" && (
                            <Card className="border-border/40 overflow-hidden bg-background/50 backdrop-blur-xl shadow-lg">
                                <CardContent className="p-8">
                                    <div className="relative">
                                        {/* Progress Bar Background */}
                                        <div className="absolute top-5 left-0 w-full h-1 bg-muted rounded-full" />
                                        
                                        {/* Progress Bar Active */}
                                        <motion.div 
                                            className="absolute top-5 left-0 h-1 bg-primary rounded-full"
                                            initial={{ width: 0 }}
                                            animate={{ width: `${(activeStepIndex / (STEPS.length - 1)) * 100}%` }}
                                            transition={{ duration: 1, ease: "easeOut" }}
                                        />

                                        <div className="relative flex justify-between">
                                            {STEPS.map((step, idx) => {
                                                const Icon = step.icon;
                                                const isActive = idx <= activeStepIndex;
                                                const isCurrent = idx === activeStepIndex;

                                                return (
                                                    <div key={step.id} className="flex flex-col items-center">
                                                        <motion.div 
                                                            className={cn(
                                                                "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors z-10 bg-background",
                                                                isActive ? "border-primary text-primary" : "border-muted text-muted-foreground",
                                                                isCurrent && "ring-4 ring-primary/20"
                                                            )}
                                                            animate={isCurrent ? { scale: [1, 1.1, 1] } : {}}
                                                            transition={{ repeat: Infinity, duration: 2 }}
                                                        >
                                                            <Icon className="w-5 h-5" />
                                                        </motion.div>
                                                        <div className="mt-4 text-center">
                                                            <p className={cn(
                                                                "text-xs font-bold uppercase tracking-widest",
                                                                isActive ? "text-foreground" : "text-muted-foreground"
                                                            )}>
                                                                {step.label}
                                                            </p>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Order Details */}
                            <Card className="border-border/40 shadow-sm">
                                <CardHeader>
                                    <CardTitle className="text-lg">Order Details</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-muted-foreground">Deliver to:</span>
                                        <span className="font-medium text-right">{order.customer_name}</span>
                                    </div>
                                    <div className="flex justify-between items-start text-sm">
                                        <span className="text-muted-foreground">Address:</span>
                                        <div className="text-right flex flex-col items-end">
                                            <span className="font-medium">{order.shipping_address.address}</span>
                                            <span className="text-muted-foreground text-xs">{order.shipping_address.city}, {order.shipping_address.county}</span>
                                        </div>
                                    </div>
                                    <div className="pt-4 border-t border-border/40 flex justify-between items-center">
                                        <span className="text-xl font-black text-primary">
                                            {formatKES(order.total_amount)}
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Need Help */}
                            <Card className="border-border/40 bg-muted/20">
                                <CardHeader>
                                    <CardTitle className="text-lg">Deployment Support</CardTitle>
                                    <CardDescription>Need help with your shipment?</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <p className="text-sm text-muted-foreground">
                                        Our logistics team is monitoring your order. If you have questions about current status or estimated arrival, we&apos;re here to help.
                                    </p>
                                    <div className="flex gap-2">
                                        <Button asChild variant="outline" className="flex-1 bg-background">
                                            <Link href="/contact">Email Ops</Link>
                                        </Button>
                                        <Button className="flex-1 bg-green-500 hover:bg-green-600">
                                            WhatsApp Ops
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
