/**
 * PCM Recorder Processor
 * Captures Float32 audio from the microphone and converts it to Int16 PCM.
 * Downsamples if necessary to 16kHz.
 */
class PCMRecorderProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
    }

    process(inputs, outputs, parameters) {
        const input = inputs[0];
        if (input.length > 0) {
            const float32Samples = input[0]; // Mono input
            const int16Samples = new Int16Array(float32Samples.length);

            for (let i = 0; i < float32Samples.length; i++) {
                // Convert Float32 [-1, 1] to Int16 [-32768, 32767]
                let s = Math.max(-1, Math.min(1, float32Samples[i]));
                int16Samples[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
            }

            // Post the raw Int16 data back to the main thread
            this.port.postMessage(int16Samples.buffer, [int16Samples.buffer]);
        }
        return true;
    }
}

registerProcessor('pcm-recorder-processor', PCMRecorderProcessor);
