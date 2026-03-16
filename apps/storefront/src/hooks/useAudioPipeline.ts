"use client";
import { useEffect, useRef, useState, useCallback } from "react";

export interface AudioPipelineState {
    isConnecting: boolean;
    isListening: boolean;
    agentSpeaking: boolean;
    geminiReady: boolean;
    transcription: string;
    error: string | null;
}

export interface AudioPipelineControls {
    start: () => Promise<void>;
    stop: () => void;
}

export function useAudioPipeline(
    sessionId: string,
    onText?: (text: string) => void
): AudioPipelineState & AudioPipelineControls {
    const [isConnecting, setIsConnecting] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [agentSpeaking, setAgentSpeaking] = useState(false);
    const [geminiReady, setGeminiReady] = useState(false);
    const [transcription, setTranscription] = useState("");
    const [error, setError] = useState<string | null>(null);

    const geminiReadyRef = useRef(false);
    const wsRef = useRef<WebSocket | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const playerNodeRef = useRef<AudioWorkletNode | null>(null);
    const recorderNodeRef = useRef<AudioWorkletNode | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const reconnectAttempts = useRef(0);
    const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isMounted = useRef(true);
    const isActive = useRef(false);

    useEffect(() => {
        isMounted.current = true;
        return () => {
            isMounted.current = false;
            doStop();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const doStop = useCallback(() => {
        isActive.current = false;
        if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
        wsRef.current?.close(1000);
        streamRef.current?.getTracks().forEach(t => t.stop());
        try {
            if (audioContextRef.current && audioContextRef.current.state !== "closed") {
                audioContextRef.current.close().catch(() => {});
            }
        } catch {}
        wsRef.current = null;
        audioContextRef.current = null;
        playerNodeRef.current = null;
        recorderNodeRef.current = null;
        streamRef.current = null;
        geminiReadyRef.current = false;
        setIsConnecting(false);
        setIsListening(false);
        setAgentSpeaking(false);
        setGeminiReady(false);
        setTranscription("");
        setError(null);
    }, []);

    const connect = useCallback(async () => {
        if (!isActive.current) return;
        try {
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            audioContextRef.current = audioContext;

            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            if (!isMounted.current || !isActive.current) {
                stream.getTracks().forEach(t => t.stop());
                return;
            }
            streamRef.current = stream;

            await Promise.all([
                audioContext.audioWorklet.addModule("/audio-processors/pcm-player-processor.js"),
                audioContext.audioWorklet.addModule("/audio-processors/pcm-recorder-processor.js"),
            ]);

            const source = audioContext.createMediaStreamSource(stream);
            const recorderNode = new AudioWorkletNode(audioContext, "pcm-recorder-processor");
            recorderNode.port.onmessage = (event) => {
                if (wsRef.current?.readyState === WebSocket.OPEN && geminiReadyRef.current) {
                    wsRef.current.send(event.data);
                }
            };
            source.connect(recorderNode);
            recorderNodeRef.current = recorderNode;

            const playerNode = new AudioWorkletNode(audioContext, "pcm-player-processor");
            playerNode.connect(audioContext.destination);
            playerNodeRef.current = playerNode;

            await audioContext.suspend();

            const wsUrl = process.env.NEXT_PUBLIC_AGENT_WS_URL || "ws://localhost:8088";
            const ws = new WebSocket(`${wsUrl}?session_id=${sessionId}`);
            ws.binaryType = "arraybuffer";
            wsRef.current = ws;

            ws.onopen = () => {
                if (!isActive.current) { ws.close(1000); return; }
                setIsConnecting(false);
                setTranscription("Waking up TroveVoice...");
            };

            ws.onmessage = async (event) => {
                if (event.data instanceof ArrayBuffer) {
                    playerNodeRef.current?.port.postMessage(event.data, [event.data]);
                    setAgentSpeaking(true);
                } else {
                    try {
                        const msg = JSON.parse(event.data as string);
                        if (msg.type === "agent_text") {
                            setTranscription(msg.content);
                            setAgentSpeaking(false);
                            onText?.(msg.content);
                        } else if (msg.type === "transcription") {
                            setTranscription(`You: ${msg.content}`);
                            setAgentSpeaking(false);
                        } else if (msg.type === "status" && msg.content === "ready") {
                            geminiReadyRef.current = true;
                            setGeminiReady(true);
                            setIsListening(true);
                            setTranscription("Listening...");
                            if (audioContextRef.current?.state === "suspended") {
                                audioContextRef.current.resume();
                            }
                        } else if (msg.type === "status" && msg.content === "agent_speaking") {
                            setAgentSpeaking(true);
                        } else if (msg.type === "error") {
                            setError(msg.content || "Agent error.");
                        }
                    } catch {}
                }
            };

            ws.onerror = () => {
                if (isActive.current) setError("Connection failed.");
            };

            ws.onclose = (event) => {
                if (!isMounted.current || !isActive.current || event.code === 1000 || event.code === 1001) return;
                if (reconnectAttempts.current < 3) {
                    const delay = Math.pow(2, reconnectAttempts.current) * 1000;
                    reconnectAttempts.current++;
                    setTranscription(`Reconnecting in ${delay / 1000}s...`);
                    reconnectTimer.current = setTimeout(() => {
                        if (isMounted.current && isActive.current) connect();
                    }, delay);
                } else {
                    setError("Connection lost. Tap mic to retry.");
                }
            };

        } catch (err: any) {
            if (isMounted.current) {
                setError(err.message || "Microphone access denied.");
                setIsConnecting(false);
            }
        }
    }, [sessionId, onText]);

    const start = useCallback(async () => {
        if (isActive.current) return;
        isActive.current = true;
        reconnectAttempts.current = 0;
        setError(null);
        setIsConnecting(true);
        await connect();
    }, [connect]);

    const stop = useCallback(() => {
        doStop();
    }, [doStop]);

    return { isConnecting, isListening, agentSpeaking, geminiReady, transcription, error, start, stop };
}
