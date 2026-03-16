"use client";

import React, { useState } from "react";
import { Truck, MapPin, Clock, Package } from "lucide-react";
import { motion } from "framer-motion";
import { Card, StatCard, Btn, PageHeader, T } from "@/components/admin/ui-pro";
import type { ShippingZone } from "./page";

interface Props {
    initialZones: ShippingZone[];
}

const fmtKES = (n: number) => `KES ${Number(n).toLocaleString()}`;

export default function ShippingZonesClient({ initialZones }: Props) {
    const [zones] = useState(initialZones);
    const [expanded, setExpanded] = useState<string | null>(null);

    const active = zones.filter(z => z.is_active).length;
    const totalCounties = zones.reduce((s, z) => s + (z.counties?.length || 0), 0);
    const avgRate = zones.length > 0 ? Math.round(zones.reduce((s, z) => s + z.rate_amount, 0) / zones.length) : 0;

    return (
        <div className="p-8 space-y-8 max-w-[1600px] mx-auto">
            <PageHeader title="Shipping Zones" sub="Kenya delivery coverage and carrier rates">
                <Btn small variant="ghost" className="gap-2">
                    <Package size={13} /> Configure Carrier
                </Btn>
            </PageHeader>

            <div className="grid grid-cols-3 gap-4">
                <StatCard label="Active Zones" value={String(active)} color={T.green} icon={Truck} sub="Currently enabled" />
                <StatCard label="Counties Covered" value={String(totalCounties)} color={T.blue} icon={MapPin} sub={`of 47 Kenya counties`} />
                <StatCard label="Avg. Shipping Rate" value={fmtKES(avgRate)} color={T.cyan} icon={Clock} sub="Across all zones" />
            </div>

            {zones.length === 0 ? (
                <Card className="p-12 text-center">
                    <Truck size={32} className="text-muted-foreground/20 mx-auto mb-4" />
                    <p className="text-sm text-muted-foreground">No shipping zones configured. Run the migration to seed Kenya zones.</p>
                </Card>
            ) : (
                <div className="space-y-3">
                    {zones.map(zone => (
                        <motion.div
                            key={zone.id}
                            layout
                        >
                            <Card
                                className={`overflow-hidden cursor-pointer transition-all ${!zone.is_active ? "opacity-50" : ""}`}
                                style={{ cursor: "pointer" }}
                            >
                                <div
                                    className="flex items-center gap-5 p-5 hover:bg-muted/10 transition-colors"
                                    onClick={() => setExpanded(expanded === zone.id ? null : zone.id)}
                                >
                                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${zone.is_active ? "bg-green-400" : "bg-muted-foreground/30"}`} />

                                    <div className="flex-1">
                                        <div className="text-sm font-bold">{zone.name}</div>
                                        {zone.carrier && <div className="text-[11px] text-muted-foreground mt-0.5">Carrier: {zone.carrier}</div>}
                                    </div>

                                    <div className="text-center w-24">
                                        <div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-1">Rate</div>
                                        <div className="font-mono font-black text-base">{fmtKES(zone.rate_amount)}</div>
                                    </div>

                                    <div className="text-center w-20">
                                        <div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-1">ETA</div>
                                        <div className="text-sm font-bold text-cyan-400">{zone.estimated_days || "—"}</div>
                                    </div>

                                    <div className="text-center w-20">
                                        <div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-1">Counties</div>
                                        <div className="font-mono font-bold text-base">{zone.counties.length}</div>
                                    </div>

                                    <Btn small variant="ghost" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                                        Edit
                                    </Btn>
                                </div>

                                {expanded === zone.id && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="border-t border-border/30 px-5 py-4 bg-muted/5"
                                    >
                                        <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-2">Counties</div>
                                        <div className="flex flex-wrap gap-1.5">
                                            {zone.counties.map(county => (
                                                <span
                                                    key={county}
                                                    className="text-[10px] font-medium px-2.5 py-1 rounded-full border border-border/50 text-muted-foreground"
                                                >
                                                    {county}
                                                </span>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </Card>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}
