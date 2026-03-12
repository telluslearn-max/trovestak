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
    const [isConnecting, setIsConnecting] = useState(true);
    const [isListening, setIsListening] = useState(false);
    const [agentSpeaking, setAgentSpeaking] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const wsRef = useRef<WebSocket | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const playerNodeRef = useRef<AudioWorkletNode | null>(null);
    const recorderNodeRef = useRef<AudioWorkletNode | null>(null);
    const streamRef = useRef<MediaStream | null>(null);

    useEffect(() => {
        initConcierge();
        return () => cleanup();
    }, []);

    const initConcierge = async () => {
        try {
            // 1. Setup Audio Context
            const audioContext = new AudioContext({ sampleRate: 16000 }); // Input at 16k
            audioContextRef.current = audioContext;

            // 2. Load Processors
            await Promise.all([
                audioContext.audioWorklet.addModule("/audio-processors/pcm-player-processor.js"),
                audioContext.audioWorklet.addModule("/audio-processors/pcm-recorder-processor.js")
            ]);

            // 3. Initialize Player (Output at 24k relative to ADK, but context is 16k, we'll let browser resample for now or fix if needed)
            // Note: In a production app, we'd use a separate context or resampler for the player if 24k is strict.
            const playerNode = new AudioWorkletNode(audioContext, "pcm-player-processor");
            playerNode.connect(audioContext.destination);
            playerNodeRef.current = playerNode;

            // 4. Initialize WebSocket
            const wsUrl = `${process.env.NEXT_PUBLIC_AGENT_SERVICE_WS || "ws://localhost:8080"}?session_id=${sessionId}`;
            const ws = new WebSocket(wsUrl);
            wsRef.current = ws;

            ws.onopen = () => {
                setIsConnecting(false);
                startRecording();
            };

            ws.onmessage = async (event) => {
                if (event.data instanceof Blob) {
                    const arrayBuffer = await event.data.arrayBuffer();
                    playerNode.port.postMessage(arrayBuffer, [arrayBuffer]);
                    setAgentSpeaking(true);
                    
                    // Reset agent speaking after a delay if no new data arrives
                    // In a real app, we'd use 'endOfTurn' signal from ADK
                }
            };

            ws.onerror = () => setError("Failed to connect to concierge.");
            ws.onclose = () => onClose();

        } catch (err: any) {
            setError(err.message || "Microphone access denied.");
            setIsConnecting(false);
        }
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;
            
            const source = audioContextRef.current!.createMediaStreamSource(stream);
            const recorderNode = new AudioWorkletNode(audioContextRef.current!, "pcm-recorder-processor");
            
            recorderNode.port.onmessage = (event) => {
                if (wsRef.current?.readyState === WebSocket.OPEN) {
                    wsRef.current.send(event.data);
                }
            };

            source.connect(recorderNode);
            recorderNodeRef.current = recorderNode;
            setIsListening(true);
        } catch (err) {
            setError("Microphone access is required for TroveVoice.");
        }
    };

    const cleanup = () => {
        wsRef.current?.close();
        streamRef.current?.getTracks().forEach(t => t.stop());
        audioContextRef.current?.close();
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
                <div className="p-12 flex flex-col items-center justify-center text-center">
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

                    {isConnecting ? (
                        <p className="text-muted-foreground animate-pulse">Connecting to your personal shopper...</p>
                    ) : error ? (
                        <p className="text-destructive font-medium">{error}</p>
                    ) : (
                        <div>
                            <p className="text-xl font-medium mb-1">
                                {agentSpeaking ? "TroveVoice is speaking..." : "Listening to you..."}
                            </p>
                            <p className="text-sm text-muted-foreground">
                                "What are the best gaming laptops under 200k?"
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer Tip */}
                <div className="p-4 bg-muted/30 text-center text-[10px] text-muted-foreground uppercase tracking-widest border-t border-border/30">
                    TensorFlow Personalization Enabled
                </div>
            </div>
        </motion.div>
    );
}
