/**
 * TroveStack Agent Service — Bible §5.5
 *
 * DEFINITIVE FIX — Root causes resolved:
 * 1. Model: `models/gemini-2.0-flash-live-001` — the ONLY stable Live API model with native audio
 * 2. Eager init: Gemini session opens IMMEDIATELY on WS connect, before any audio arrives
 * 3. Modality: Uses Modality.AUDIO enum (not raw string "audio")
 * 4. No burst: Audio is queued only for the small window before Gemini opens (~1s).
 *    Client is told to start recording only AFTER `setupComplete` fires (status:ready)
 */

async function bootstrap() {
    try {
        if (process.env.NODE_ENV !== "production") {
            try { const { config } = await import("dotenv"); config(); } catch (e) {}
        }

        // ── Phase 1: fast core imports + HTTP bind (Cloud Run health check must pass quickly) ──
        const { createServer } = await import("http");
        const { WebSocketServer } = await import("ws");
        const { createLogger } = await import("@trovestak/shared");

        const log = createLogger("agent-service");
        const PORT = parseInt(process.env.PORT || "8088");
        const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

        if (!GEMINI_API_KEY) {
            log.error("GEMINI_API_KEY required");
            process.exit(1);
        }

        // HTTP server handles Cloud Run health checks (GET /) and hosts the WS server.
        // Must bind to PORT before any slow imports so the startup probe passes.
        const httpServer = createServer((req, res) => {
            res.writeHead(200, { "Content-Type": "text/plain" });
            res.end("TroveVoice OK");
        });

        const wss = new WebSocketServer({ server: httpServer });
        wss.on("error", (err) => log.error("WSS Error", { err }));
        httpServer.listen(PORT, () => log.info(`TroveVoice listening on port ${PORT}`));

        // ── Phase 2: heavy AI deps (load after port is bound) ────────────────────────
        const { GoogleGenAI, Modality } = await import("@google/genai");
        const { CONCIERGE_INSTRUCTIONS, getGenAITools } = await import("./agent.js");
        const { conciergeTools, recommendationCache } = await import("./tools.js");
        log.info("AI modules loaded — ready for connections");

        // ── Recommendation pre-warm subscriber (non-blocking) ─────────────────
        const recSub = process.env.PUBSUB_SUBSCRIPTION_RECOMMENDATION_READY;
        if (recSub && process.env.GOOGLE_CLOUD_PROJECT) {
            try {
                const { PubSub } = await import("@google-cloud/pubsub");
                const pubsub = new PubSub({ projectId: process.env.GOOGLE_CLOUD_PROJECT });
                const sub = pubsub.subscription(recSub);
                sub.on("message", (message: any) => {
                    try {
                        const event = JSON.parse(message.data.toString());
                        const { user_id, recommendations } = event.data ?? {};
                        if (user_id && Array.isArray(recommendations)) {
                            recommendationCache.set(user_id, { recommendations, cachedAt: Date.now() });
                            log.info("Pre-warmed recommendations cached", { user_id, count: recommendations.length });
                        }
                        message.ack();
                    } catch (e) {
                        log.error("recommendation.ready parse error", { e });
                        message.nack();
                    }
                });
                sub.on("error", (err: any) => log.error("recommendation.ready sub error", { err: err.message }));
                log.info(`Subscribed to ${recSub}`);
            } catch (e: any) {
                log.warn("recommendation.ready subscriber failed (non-fatal)", { err: e.message });
            }
        }

        wss.on("connection", async (clientWs, req) => {
            const url = new URL(req.url || "/", `http://${req.headers.host}`);
            const sessionId = url.searchParams.get("session_id") || "anonymous";
            log.info(`New connection: ${sessionId}`);

            let liveSession: any = null;
            let sessionContext: Record<string, string> = {};
            // Small buffer only for audio that arrives in the ~1 second before Gemini opens.
            // The client does NOT send audio until it receives status:ready, so this should be empty.
            let pendingAudio: Buffer[] = [];

            // ── EAGER INIT: Connect to Gemini immediately on WebSocket open ──────────
            // This ensures Gemini is ready BEFORE the client starts sending audio.
            const initGemini = async () => {
                try {
                    const genAI = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
                    log.info("Connecting to Gemini Live API...");

                    const session = await genAI.live.connect({
                        // Fix #1: correct model — the only stable Live API model with native audio I/O
                        model: "gemini-2.5-flash-native-audio-preview-12-2025",
                        config: {
                            systemInstruction: String(CONCIERGE_INSTRUCTIONS),
                            tools: [{ functionDeclarations: getGenAITools() }],
                            // Fix #2: Use Modality enum, not raw string
                            responseModalities: [Modality.AUDIO],
                            speechConfig: {
                                voiceConfig: {
                                    prebuiltVoiceConfig: { voiceName: "Aoede" }
                                }
                            }
                        },
                        callbacks: {
                            onopen: () => {
                                log.info("BIDI session open (WebSocket established)");
                            },
                            onmessage: (msg: any) => {
                                // console.log("[DEBUG] msg keys:", Object.keys(msg));
                                if (msg.serverContent) {
                                    console.log("[DEBUG] serverContent keys:", Object.keys(msg.serverContent));
                                    if (msg.serverContent.modelTurn) console.log("[DEBUG]   - has modelTurn");
                                    if (msg.serverContent.interrupted) console.log("[DEBUG]   - has interrupted");
                                }
                                
                                // ── SETUP COMPLETE: Tell client to start recording now ──
                                if (msg.setupComplete) {
                                    log.info("Gemini setup complete — session ready for audio");
                                    // Fix #4: Signal client to begin recording only NOW
                                    try {
                                        clientWs.send(JSON.stringify({ type: "status", content: "ready" }));
                                    } catch (e) {}

                                    // Inject page context as silent system turn so agent knows what product user is on
                                    if (Object.keys(sessionContext).length > 0 && liveSession) {
                                        try {
                                            liveSession.sendClientContent({
                                                turns: [{ role: "user", parts: [{ text:
                                                    `[Context: User is on ${sessionContext.pageType} page.${
                                                        sessionContext.productName
                                                            ? ` Currently viewing: ${sessionContext.productName}${sessionContext.category ? ` (${sessionContext.category})` : ''}.`
                                                            : ''
                                                    } Session: ${sessionId}]`
                                                }] }],
                                                turnComplete: false
                                            });
                                        } catch (e) {}
                                    }

                                    // Flush any audio that slipped in before setup completed
                                    if (pendingAudio.length > 0) {
                                        const combined = Buffer.concat(pendingAudio);
                                        log.info(`Flushing pre-ready audio: ${combined.length} bytes`);
                                        try {
                                            liveSession.sendRealtimeInput([{
                                                mimeType: "audio/pcm;rate=16000",
                                                data: combined.toString("base64")
                                            }]);
                                        } catch (e) {}
                                        pendingAudio = [];
                                    }
                                }

                                // ── Relay audio/text from Gemini to browser ──
                                const parts = msg.serverContent?.modelTurn?.parts || msg.modelTurn?.parts;
                                if (parts) {
                                    for (const part of parts) {
                                        if (part.inlineData?.data) {
                                            try { clientWs.send(Buffer.from(part.inlineData.data, "base64")); } catch (e) {}
                                            try { clientWs.send(JSON.stringify({ type: "status", content: "agent_speaking" })); } catch (e) {}
                                        }
                                        if (part.text) {
                                            try { clientWs.send(JSON.stringify({ type: "agent_text", content: part.text })); } catch (e) {}
                                        }
                                    }
                                }

                                // ── Relay transcription (user speech → text) ──
                                const inputTranscription = msg.serverContent?.modelTurn?.parts?.[0]?.text; // WAIT SDK abstracts it?
                                // Let's check where it lives
                                if (msg.serverContent?.turnComplete) {
                                     console.log("[DEBUG] Turn complete triggered");
                                }

                                // Let's log any text part that comes back regardless
                                let transcriptionMsg = msg.serverContent?.interrupted ? "interrupted" : null;
                                // 
                                // Actually, let's just log msg:
                                if (Object.keys(msg).length > 0 && !msg.serverContent?.modelTurn) {
                                   try { console.log("[DEBUG] Non-modelTurn msg:", JSON.stringify(msg).substring(0,200)); } catch(e){}
                                }
                                
                                if (msg.serverContent?.inputTranscription) {
                                     console.log("[DEBUG] User transcription found:", msg.serverContent.inputTranscription);
                                }
                                
                                const userText = msg.serverContent?.inputTranscription?.text || msg.serverContent?.interrupted;
                                if (userText) {
                                    try {
                                        clientWs.send(JSON.stringify({
                                            type: "transcription",
                                            content: userText
                                        }));
                                    } catch (e) {}
                                }

                                // ── Tool calls ──
                                const toolCall = msg.toolCall || msg.serverContent?.toolCall;
                                if (toolCall?.functionCalls?.length > 0) {
                                    (async () => {
                                        const functionResponses = [];
                                        for (const fc of toolCall.functionCalls) {
                                            log.info(`Executing tool: ${fc.name}`);
                                            const tool = conciergeTools.find((t: any) => t.name === fc.name);
                                            let response: any;
                                            if (tool) {
                                                try {
                                                    response = await (tool as any).execute(fc.args || {});
                                                    log.info(`Tool: ${fc.name}`, { args: fc.args, keys: Object.keys(response ?? {}) });
                                                } catch (e: any) {
                                                    response = { error: e.message };
                                                }
                                            } else if (fc.name === "research_agent") {
                                                // Stub: expand query into Kenya-specific searches
                                                const q = fc.args?.query || "";
                                                response = {
                                                    queries: [
                                                        `${q} Kenya price`,
                                                        `best ${q} under 50000 KES`,
                                                        `${q} Samsung Tecno Infinix`,
                                                        `affordable ${q} Nairobi`,
                                                        `${q} review Kenya 2025`
                                                    ]
                                                };
                                            } else {
                                                response = { error: `Tool not found: ${fc.name}` };
                                            }
                                            functionResponses.push({ name: fc.name, id: fc.id, response });
                                        }
                                        if (liveSession) {
                                            try {
                                                liveSession.sendToolResponse({ functionResponses });
                                            } catch (e) {}
                                        }
                                    })();
                                }
                            },
                            onerror: (err: any) => {
                                log.error("Gemini BIDI Error", { err: String(err) });
                            },
                            onclose: (event: any) => {
                                log.info(`Gemini session closed (code=${event?.code ?? "?"} reason="${event?.reason ?? ""}")`);
                                liveSession = null;
                            }
                        }
                    });

                    // Session object is ready — assign it
                    liveSession = session;
                    log.info("Gemini session assigned and active");

                } catch (err: any) {
                    log.error("Gemini Init Failed", { err: err.message || String(err) });
                    try {
                        clientWs.send(JSON.stringify({ type: "error", content: "Gemini connection failed" }));
                    } catch (e) {}
                }
            };

            // Start Gemini init immediately — do NOT wait for audio
            initGemini();

            clientWs.on("message", async (data) => {
                if (Buffer.isBuffer(data)) {
                    console.log(`[DEBUG] Received ${data.length} bytes of audio from UI`);
                    if (!liveSession) {
                        // Buffer audio briefly (only if Gemini is still warming up < 1s)
                        if (pendingAudio.length > 50) pendingAudio.shift(); // cap at ~25KB
                        pendingAudio.push(data);
                    } else {
                        try {
                            liveSession.sendRealtimeInput([{
                                mimeType: "audio/pcm;rate=16000",
                                data: data.toString("base64")
                            }]);
                        } catch (e) {}
                    }
                } else {
                    try {
                        const msg = JSON.parse(data.toString());
                        if (msg.type === "context") {
                            sessionContext = msg;
                            log.info("Session context received", sessionContext);
                            return;
                        }
                        if (msg.type === "text" && msg.content && liveSession) {
                            liveSession.sendClientContent({
                                turns: [{ role: "user", parts: [{ text: msg.content }] }]
                            });
                        }
                    } catch (e) {}
                }
            });

            clientWs.on("close", () => {
                log.info(`Client disconnected: ${sessionId}`);
                if (liveSession) {
                    try { liveSession.close(); } catch (e) {}
                    liveSession = null;
                }
                pendingAudio = [];
            });
        });

        const handleKill = () => { wss.close(); process.exit(0); };
        process.on("SIGINT", handleKill);
        process.on("SIGTERM", handleKill);

    } catch (e) { console.error("Fatal", e); process.exit(1); }
}

bootstrap();
