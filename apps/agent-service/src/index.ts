// Only load .env locally — Cloud Run injects env vars directly
if (process.env.NODE_ENV !== "production") {
    const { config } = await import("dotenv");
    config();
}
import { WebSocketServer } from "ws";
import { 
    createLogger, 
    validateEnv 
} from "@trovestak/shared";
import { 
    Runner, 
    InMemorySessionService, 
    StreamingMode,
    LiveRequestQueue,
    EventType
} from "@google/adk";
import { Modality } from "@google/genai";
import { conciergeAgent } from "./agent";

/**
 * AGENT SERVICE 2.0 — ADK-Powered Shopping Concierge
 */

const log = createLogger("agent-service");

// 1. Validate environment
const env = validateEnv([
    "GOOGLE_CLOUD_PROJECT",
    "GEMINI_API_KEY",
    "NEXT_PUBLIC_SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY"
]);

const PORT = parseInt(process.env.PORT || "8080");
const wss = new WebSocketServer({ port: PORT });

// 2. Initialize ADK Runner
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

    // Phase 2: Session Initialization
    const liveRequestQueue = new LiveRequestQueue();
    const runConfig = {
        streamingMode: StreamingMode.BIDI,
        responseModalities: [Modality.AUDIO],
    };

    // Phase 3: Bidi-streaming
    (async () => {
        try {
            // Start the ADK runner for this session
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
                // In Multimodal Live (Native Audio), events are yielded from the runner.
                // We cast to any to access the response structure for the live proto.
                const anyEvent = event as any;
                
                if (anyEvent.candidates?.[0]?.content?.parts) {
                    for (const part of anyEvent.candidates[0].content.parts) {
                        if (part.inlineData) {
                            // Forward raw audio back to client
                            clientWs.send(Buffer.from(part.inlineData.data, 'base64'));
                        }
                    }
                }
                
                // Logging for debugging during hackathon
                log.debug("ADK Event Received", { id: event.id });
            }
        } catch (error) {
            log.error("ADK Runner error", { error });
        } finally {
            liveRequestQueue.close();
            clientWs.close();
        }
    })();

    // Handle Client Inputs (Audio/Text)
    clientWs.on("message", (data) => {
        if (Buffer.isBuffer(data)) {
            // Forward audio/media chunks to the LiveRequestQueue
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
