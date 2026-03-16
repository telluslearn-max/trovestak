"use client";
/**
 * useWakeword
 * Lightweight always-on wakeword listener using the browser's native
 * SpeechRecognition API (Chrome/Edge). Fires `onWakeword` when any of the
 * configured phrases are heard. Auto-restarts after each utterance so it
 * stays continuously active until `enabled` flips to false.
 *
 * Supported wakewords (case-insensitive, substring match):
 *   "hey trove"  |  "trove voice"  |  "hey trove voice"
 */

import { useCallback, useEffect, useRef, useState } from "react";

interface UseWakewordOptions {
    /** Called once when a wakeword phrase is detected. */
    onWakeword: () => void;
    /** Start/stop the listener. Pass false while TroveVoice session is active. */
    enabled: boolean;
    /** Override default phrases if needed. */
    phrases?: string[];
}

export function useWakeword({
    onWakeword,
    enabled,
    phrases = ["hey trove", "trove voice", "hey trove voice"],
}: UseWakewordOptions): { listening: boolean; supported: boolean } {
    const recognitionRef = useRef<any>(null);
    const enabledRef = useRef(enabled);
    const firedRef = useRef(false); // debounce: only fire once per detection cycle
    const [listening, setListening] = useState(false);
    // Start false so SSR and first client render match; set to true after mount
    const [supported, setSupported] = useState(false);
    useEffect(() => {
        setSupported(
            !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)
        );
    }, []);

    // Keep enabled ref in sync without restarting the loop
    useEffect(() => {
        enabledRef.current = enabled;
    }, [enabled]);

    const stop = useCallback(() => {
        setListening(false);
        try {
            recognitionRef.current?.abort();
        } catch {
            // already stopped
        }
        recognitionRef.current = null;
    }, []);

    const start = useCallback(() => {
        const SR =
            (window as any).SpeechRecognition ||
            (window as any).webkitSpeechRecognition;
        if (!SR) return;

        firedRef.current = false;

        const rec = new SR();
        rec.continuous = false;       // restart manually — more reliable across browsers
        rec.interimResults = false;
        rec.lang = "en-US";
        rec.maxAlternatives = 3;

        rec.onstart = () => setListening(true);

        rec.onresult = (event: any) => {
            for (let i = 0; i < event.results.length; i++) {
                for (let j = 0; j < event.results[i].length; j++) {
                    const text = event.results[i][j].transcript.toLowerCase().trim();
                    if (phrases.some((p) => text.includes(p.toLowerCase()))) {
                        if (!firedRef.current && enabledRef.current) {
                            firedRef.current = true;
                            onWakeword();
                        }
                        return;
                    }
                }
            }
        };

        rec.onend = () => {
            setListening(false);
            if (enabledRef.current) {
                // Brief pause then restart for continuous listening
                setTimeout(() => {
                    if (enabledRef.current) start();
                }, 250);
            }
        };

        rec.onerror = (e: any) => {
            setListening(false);
            // Mic access denied — give up silently
            if (e.error === "not-allowed" || e.error === "service-not-allowed") return;
            // Any other error — retry after a second
            if (enabledRef.current) {
                setTimeout(() => {
                    if (enabledRef.current) start();
                }, 1000);
            }
        };

        recognitionRef.current = rec;
        try {
            rec.start();
        } catch {
            // Catches "already started" races
        }
    }, [onWakeword, phrases]);

    useEffect(() => {
        if (!supported) return;
        if (enabled) {
            start();
        } else {
            stop();
        }
        return () => stop();
    }, [enabled, supported, start, stop]);

    return { listening, supported };
}
