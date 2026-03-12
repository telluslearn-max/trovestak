import { PubSub } from "@google-cloud/pubsub";
import { createLogger } from "./logger.js";

const log = createLogger("pubsub-publisher");

let pubsub: PubSub | null = null;

function getPubSub() {
    if (!pubsub) {
        const projectId = process.env.GOOGLE_CLOUD_PROJECT;
        if (!projectId) {
            log.warn("GOOGLE_CLOUD_PROJECT not set, PubSub publishing will be disabled");
            return null;
        }
        pubsub = new PubSub({ projectId });
    }
    return pubsub;
}

/**
 * Publishes a typed event to a Google Cloud Pub/Sub topic.
 */
export async function publishEvent(topicName: string, eventPayload: any) {
    const ps = getPubSub();
    if (!ps) {
        log.error("PubSub not initialized. Skipping publish.", { topicName });
        return;
    }

    try {
        const dataBuffer = Buffer.from(JSON.stringify(eventPayload));
        const messageId = await ps.topic(topicName).publishMessage({ data: dataBuffer });
        log.info(`Published message to ${topicName}`, { messageId, type: eventPayload.type });
        return messageId;
    } catch (error: any) {
        log.error(`Failed to publish message to ${topicName}`, { error: error.message });
        throw error;
    }
}
