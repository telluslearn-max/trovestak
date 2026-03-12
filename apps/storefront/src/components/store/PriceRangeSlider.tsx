"use client";

import { useState, useEffect, useCallback } from "react";
import { Slider } from "@/components/ui/slider";
import { formatKES } from "@/lib/formatters";

interface PriceRangeSliderProps {
    min: number;
    max: number;
    value: [number, number];
    onChange: (range: [number, number]) => void;
}

export function PriceRangeSlider({ min, max, value, onChange }: PriceRangeSliderProps) {
    const [localValue, setLocalValue] = useState<[number, number]>(value);

    useEffect(() => {
        setLocalValue(value);
    }, [value]);

    const handleChange = useCallback((vals: number[]) => {
        setLocalValue([vals[0], vals[1]]);
    }, []);

    const handleCommit = useCallback((vals: number[]) => {
        onChange([vals[0], vals[1]]);
    }, [onChange]);

    const step = max > 100000 ? 5000 : max > 10000 ? 1000 : 500;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
                <span className="font-bold text-foreground">{formatKES(localValue[0])}</span>
                <span className="text-muted-foreground">—</span>
                <span className="font-bold text-foreground">{formatKES(localValue[1])}</span>
            </div>
            <Slider
                min={min}
                max={max}
                step={step}
                value={[localValue[0], localValue[1]]}
                onValueChange={handleChange}
                onValueCommit={handleCommit}
                className="w-full"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground/50 font-medium">
                <span>Min: {formatKES(min)}</span>
                <span>Max: {formatKES(max)}</span>
            </div>
        </div>
    );
}
