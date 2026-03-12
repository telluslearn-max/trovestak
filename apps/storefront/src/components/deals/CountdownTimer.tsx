"use client";

import { useEffect, useState, useRef } from "react";

interface CountdownTimerProps {
    endTime: string | Date;
    onExpire?: () => void;
    className?: string;
}

interface TimeRemaining {
    hours: number;
    minutes: number;
    seconds: number;
    expired: boolean;
}

export function CountdownTimer({ endTime, onExpire, className }: CountdownTimerProps) {
    const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>({
        hours: 0,
        minutes: 0,
        seconds: 0,
        expired: false,
    });
    const hasExpired = useRef(false);

    useEffect(() => {
        const end = new Date(endTime).getTime();

        const updateTimer = () => {
            const now = Date.now();
            const diff = end - now;

            if (diff <= 0) {
                setTimeRemaining({ hours: 0, minutes: 0, seconds: 0, expired: true });
                if (!hasExpired.current) {
                    hasExpired.current = true;
                    onExpire?.();
                }
                return;
            }

            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            setTimeRemaining({ hours, minutes, seconds, expired: false });
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);

        return () => clearInterval(interval);
    }, [endTime, onExpire]);

    if (timeRemaining.expired) {
        return (
            <span className={className}>
                <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs font-bold rounded">
                    EXPIRED
                </span>
            </span>
        );
    }

    const TimeBlock = ({ value, label }: { value: number; label: string }) => (
        <div className="flex flex-col items-center">
            <span className="bg-background/80 backdrop-blur-sm px-2 py-1 rounded-lg text-lg font-black tabular-nums">
                {String(value).padStart(2, "0")}
            </span>
            <span className="text-[9px] uppercase tracking-wider mt-0.5 opacity-60">{label}</span>
        </div>
    );

    return (
        <div className={className}>
            <div className="flex items-center gap-1">
                <TimeBlock value={timeRemaining.hours} label="HRS" />
                <span className="text-lg font-bold opacity-40">:</span>
                <TimeBlock value={timeRemaining.minutes} label="MIN" />
                <span className="text-lg font-bold opacity-40">:</span>
                <TimeBlock value={timeRemaining.seconds} label="SEC" />
            </div>
        </div>
    );
}
