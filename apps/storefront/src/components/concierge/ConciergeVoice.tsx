"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, MicOff, Volume2, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSessionId } from "@/hooks/useSessionId";

interface Props {
    onClose: () => void;
}

export function ConciergeVoice({ onClose }: Props) {
    const rawSessionId = useSessionId();
    const sessionId = rawSessionId ?? "anonymous";
    const [hasStarted, setHasStarted] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [agentSpeaking, setAgentSpeaking] = useState(false);
    
    // We must use refs for values accessed inside the audio worklet's onmessage callback
    // because that callback is defined once and traps the initial state in its closure.
    const geminiReadyRef = useRef(false);
    const [geminiReadyState, setGeminiReadyState] = useState(false); // only for UI updates
    
    const [transcription, setTranscription] = useState<string>("");
    const [error, setError] = useState<string | null>(null);

    const wsRef = useRef<WebSocket | null>(null);
    const reconnectAttempts = useRef(0);
    const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const playerNodeRef = useRef<AudioWorkletNode | null>(null);
    const recorderNodeRef = useRef<AudioWorkletNode | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const isMounted = useRef(true);

    useEffect(() => {
        isMounted.current = true;
        return () => {
            isMounted.current = false;
            cleanup();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleStart = async () => {
        setIsConnecting(true);
        setHasStarted(true);
        setError(null);
        await initConcierge();
    };
    const initConcierge = async () => {
        try {
            console.log("[Concierge] Requesting microphone access FIRST (user gesture)...");
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            audioContextRef.current = audioContext;

            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            if (!isMounted.current) {
                stream.getTracks().forEach(t => t.stop());
                return;
            }
            streamRef.current = stream;

            console.log("[Concierge] Loading audio worklet modules...");
            await Promise.all([
                audioContext.audioWorklet.addModule("/audio-processors/pcm-player-processor.js"),
                audioContext.audioWorklet.addModule("/audio-processors/pcm-recorder-processor.js")
            ]);

            const source = audioContext.createMediaStreamSource(stream);
            const recorderNode = new AudioWorkletNode(audioContext, "pcm-recorder-processor");
            
            recorderNode.port.onmessage = (event) => {
                // Send if we have connection AND we are ready
                if (wsRef.current?.readyState === WebSocket.OPEN) {
                    if (geminiReadyRef.current) {
                        wsRef.current.send(event.data);
                    }
                }
            };

            source.connect(recorderNode);
            recorderNodeRef.current = recorderNode;

            console.log("[Concierge] Audio worklets loaded. Initializing player...");
            const playerNode = new AudioWorkletNode(audioContext, "pcm-player-processor");
            playerNode.connect(audioContext.destination);
            playerNodeRef.current = playerNode;

            // Pause it until connection and setup is complete
            await audioContext.suspend();
            console.log("[Concierge] Microphone accessed and suspended. Connecting to WS...");

            const wsUrl = process.env.NEXT_PUBLIC_AGENT_WS_URL || "ws://localhost:8088";
            console.log("[Concierge] Connecting to:", wsUrl);
            const ws = new WebSocket(`${wsUrl}?session_id=${sessionId}`);
            ws.binaryType = "arraybuffer";
            wsRef.current = ws;

            ws.onopen = async () => {
                console.log("[Concierge] WebSocket Connected.");
                setIsConnecting(false);
                setTranscription("Waiting for TroveVoice to wake up...");
                // Recording will start when server sends { type: "status", content: "ready" }
            };

            ws.onmessage = async (event) => {
                if (event.data instanceof ArrayBuffer) {
                    if (playerNodeRef.current) {
                        playerNodeRef.current.port.postMessage(event.data, [event.data]);
                    }
                    setAgentSpeaking(true);
                } else {
                    try {
                        const msg = JSON.parse(event.data);
                        if (msg.type === "agent_text") {
                            setTranscription(msg.content);
                            setAgentSpeaking(false);
                        } else if (msg.type === "transcription") {
                            // User's speech transcribed — show what the user said
                            setTranscription(`You: ${msg.content}`);
                            setAgentSpeaking(false);
                        } else if (msg.type === "status") {
                            if (msg.content === "ready") {
                                console.log("[Concierge] Gemini ready — resuming audio context now.");
                                geminiReadyRef.current = true;
                                setGeminiReadyState(true);
                                setIsListening(true);
                                setTranscription("Listening... Say something!");
                                // Fix #5: Resume the pre-initialized audio context to start recording
                                if (audioContextRef.current?.state === "suspended") {
                                    audioContextRef.current.resume();
                                }
                            } else if (msg.content === "agent_speaking") {
                                setAgentSpeaking(true);
                            }
                        } else if (msg.type === "error") {
                            setError(msg.content || "Connection error.");
                        }
                    } catch (e) {
                        console.log("[Concierge] Raw message:", event.data);
                    }
                }
            };

            ws.onerror = (err) => {
                console.warn("[Concierge] WebSocket error:", err);
                setError("Failed to connect to concierge.");
            };
            
            ws.onclose = (event) => {
                console.log("[Concierge] WebSocket Closed:", event.code, event.reason);
                // Normal close (user dismissed) — don't reconnect
                if (!isMounted.current || event.code === 1000 || event.code === 1001) {
                    onClose();
                    return;
                }
                // Unexpected close — retry with exponential backoff (max 3 attempts)
                if (reconnectAttempts.current < 3) {
                    const delay = Math.pow(2, reconnectAttempts.current) * 1000;
                    reconnectAttempts.current++;
                    setTranscription(`Connection lost. Reconnecting in ${delay / 1000}s...`);
                    reconnectTimer.current = setTimeout(() => {
                        if (isMounted.current) initConcierge();
                    }, delay);
                } else {
                    setError("Connection lost. Please close and try again.");
                }
            };

        } catch (err: any) {
            console.error("[Concierge] Init error:", err);
            setError(err.message || "Microphone access denied.");
            setIsConnecting(false);
        }
    };

    const cleanup = () => {
        if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
        wsRef.current?.close(1000);
        streamRef.current?.getTracks().forEach(t => t.stop());
        try {
            if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
                audioContextRef.current.close().catch(() => {});
            }
        } catch (e) {}
    };

    return (
        <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        >
            <div className="bg-background w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border border-border/50">
                {/* Header */}
                <div className="p-6 flex items-center justify-between border-b border-border/30">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                            <Volume2 className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <h2 className="font-bold text-lg">TroveVoice</h2>
                            <p className="text-xs text-muted-foreground">ADK Intelligence Active</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-12 flex flex-col items-center justify-center text-center focus-visible:outline-none">
                    <div className="relative mb-8">
                        {/* Pulse rings */}
                        <AnimatePresence>
                            {(isListening || agentSpeaking) && (
                                <>
                                    <motion.div 
                                        initial={{ scale: 0.8, opacity: 0.5 }}
                                        animate={{ scale: 1.5, opacity: 0 }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                        className="absolute inset-0 rounded-full bg-primary/20"
                                    />
                                    <motion.div 
                                        initial={{ scale: 0.8, opacity: 0.5 }}
                                        animate={{ scale: 2, opacity: 0 }}
                                        transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                                        className="absolute inset-0 rounded-full bg-primary/10"
                                    />
                                </>
                            )}
                        </AnimatePresence>

                        <div className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-500 ${
                            agentSpeaking ? 'bg-primary scale-110' : (isListening ? 'bg-primary/80' : 'bg-muted')
                        }`}>
                            {isListening ? (
                                <Mic className="w-10 h-10 text-white" />
                            ) : (
                                <MicOff className="w-10 h-10 text-muted-foreground" />
                            )}
                        </div>
                    </div>

                    {!hasStarted ? (
                        <div className="space-y-6">
                            <p className="text-muted-foreground text-sm">Tap the button below to start your personalized voice shopping experience.</p>
                            <button 
                                onClick={handleStart}
                                className="px-8 h-14 bg-primary text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/20"
                            >
                                Activate TroveVoice
                            </button>
                        </div>
                    ) : isConnecting ? (
                        <p className="text-muted-foreground animate-pulse">Connecting to your personal shopper...</p>
                    ) : error ? (
                        <p className="text-destructive font-medium">{error}</p>
                    ) : (
                        <div>
                            <p className="text-xl font-medium mb-1">
                                {agentSpeaking ? "TroveVoice is speaking..." : (geminiReadyState ? "Listening to you..." : "Waking up TroveVoice...")}
                            </p>
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap max-w-xs mx-auto">
                                {transcription || '"What are the best gaming laptops under 200k?"'}
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer Tip */}
                <div className="p-4 bg-muted/30 text-center text-[10px] text-muted-foreground uppercase tracking-widest border-t border-border/30">
                    ADK Voice Protocol v1.0
                </div>
            </div>
        </motion.div>
    );
}
