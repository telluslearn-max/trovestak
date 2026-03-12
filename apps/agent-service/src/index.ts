async function bootstrap() {
    try {
        // 1. Conditional dotenv
        if (process.env.NODE_ENV !== "production") {
            try {
                const { config } = await import("dotenv");
                config();
            } catch (e) {
                console.warn("Dotenv not found, skipping.");
            }
        }

        const { WebSocketServer } = await import("ws");
        const { createLogger, validateEnv } = await import("@trovestak/shared");
        const { 
            Runner, 
            InMemorySessionService, 
            StreamingMode,
            LiveRequestQueue
        } = await import("@google/adk");
        const { Modality } = await import("@google/genai");
        const { conciergeAgent } = await import("./agent.js");

        const log = createLogger("agent-service");

        // 2. Validate environment
        const env = validateEnv([
            "GOOGLE_CLOUD_PROJECT",
            "GEMINI_API_KEY",
            "NEXT_PUBLIC_SUPABASE_URL",
            "SUPABASE_SERVICE_ROLE_KEY"
        ]);

        const PORT = parseInt(process.env.PORT || "8080");
        const wss = new WebSocketServer({ port: PORT });

        // 3. Initialize ADK Runner
        const sessionService = new InMemorySessionService();
        const runner = new Runner({
            appName: "TroveStack Concierge",
            agent: conciergeAgent,
            sessionService
        });

        wss.on("connection", async (clientWs, req) => {
            const url = new URL(req.url || "/", `http://${req.headers.host}`);
            const sessionId = url.searchParams.get("session_id") || "anonymous";
            const userId = "anonymous-user";

            log.info(`New TroveVoice session: ${sessionId}`);

            const liveRequestQueue = new LiveRequestQueue();
            const runConfig = {
                streamingMode: StreamingMode.BIDI,
                responseModalities: [Modality.AUDIO],
            };

            (async () => {
                try {
                    const events = runner.runAsync({
                        userId,
                        sessionId,
                        newMessage: { 
                            role: "user", 
                            parts: [{ text: "Initialize concierge context" }] 
                        },
                        runConfig
                    });

                    for await (const event of events) {
                        const anyEvent = event as any;
                        if (anyEvent.candidates?.[0]?.content?.parts) {
                            for (const part of anyEvent.candidates[0].content.parts) {
                                if (part.inlineData) {
                                    clientWs.send(Buffer.from(part.inlineData.data, 'base64'));
                                }
                            }
                        }
                        log.debug("ADK Event Received", { id: event.id });
                    }
                } catch (error) {
                    log.error("ADK Runner error", { error });
                } finally {
                    liveRequestQueue.close();
                    clientWs.close();
                }
            })();

            clientWs.on("message", (data) => {
                if (Buffer.isBuffer(data)) {
                    liveRequestQueue.sendRealtime({
                        mimeType: "audio/pcm;rate=16000",
                        data: data.toString("base64")
                    });
                }
            });

            clientWs.on("close", () => {
                log.info("Client disconnected");
                liveRequestQueue.close();
            });
        });

        log.info(`TroveVoice Concierge listening on port ${PORT}`);

        // 4. Graceful Shutdown
        const shutdown = () => {
            log.info("Shutting down concierge service...");
            wss.close();
            process.exit(0);
        };

        process.on("SIGTERM", shutdown);
        process.on("SIGINT", shutdown);

    } catch (error) {
        console.error("FATAL STARTUP ERROR:", error);
        process.exit(1);
    }
}

bootstrap();
