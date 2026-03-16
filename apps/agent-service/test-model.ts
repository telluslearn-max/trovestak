import { GoogleGenAI, Modality } from "@google/genai";
import { config } from "dotenv";
config();

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function testModel(modelName: string) {
    console.log(`Testing model with AUDIO modality: ${modelName}`);
    try {
        // We have to wait for the setup connection response
        await new Promise<void>((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error("Timeout waiting for setup Complete")), 5000);
            
            genAI.live.connect({
                model: modelName,
                config: {
                    responseModalities: [Modality.AUDIO]
                },
                callbacks: {
                    onmessage: (msg: any) => {
                        if (msg.setupComplete) {
                            console.log(`✅ ${modelName} SETUP COMPLETE WITH AUDIO!`);
                            clearTimeout(timeout);
                            resolve();
                        }
                    },
                    onerror: (e) => reject(e),
                    onclose: () => {}
                }
            }).then(session => {
                setTimeout(() => { session.close(); }, 100);
            }).catch(reject);
        });
        return true;
    } catch (e: any) {
        console.error(`❌ ${modelName} FAILED: ${e.message}`);
        return false;
    }
}

async function run() {
    const models = [
        "gemini-2.0-flash-exp",
        "gemini-2.5-flash",
        "gemini-2.0-flash",
        "gemini-2.5-flash-native-audio-preview-12-2025",
        "gemini-2.0-flash-thinking-exp-01-21"
    ];
    for (const m of models) {
        await testModel(m).catch(()=>null);
    }
}
run();
