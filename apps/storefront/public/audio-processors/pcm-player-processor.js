/**
 * PCM Player Processor
 * Plays back 24kHz PCM Float32 audio from a ring buffer.
 */
class PCMPlayerProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
        // Ring buffer: 24kHz * 180 seconds capacity
        this.bufferSize = 24000 * 180;
        this.buffer = new Float32Array(this.bufferSize);
        this.writeIndex = 0;
        this.readIndex = 0;

        this.port.onmessage = (event) => {
            // Interruption handler: clear buffer immediately
            if (event.data.command === 'endOfAudio') {
                this.readIndex = this.writeIndex;
                return;
            }

            // Enqueue audio samples: Int16 -> Float32 [-1, 1]
            const int16Samples = new Int16Array(event.data);
            for (let i = 0; i < int16Samples.length; i++) {
                this.buffer[this.writeIndex] = int16Samples[i] / 32768;
                this.writeIndex = (this.writeIndex + 1) % this.bufferSize;
            }
        };
    }

    process(inputs, outputs, parameters) {
        const output = outputs[0];
        const channelCount = output.length;

        for (let frame = 0; frame < output[0].length; frame++) {
            const sample = this.buffer[this.readIndex];
            
            // Fill all output channels (mono to stereo)
            for (let channel = 0; channel < channelCount; channel++) {
                output[channel][frame] = sample;
            }

            if (this.readIndex !== this.writeIndex) {
                this.readIndex = (this.readIndex + 1) % this.bufferSize;
            }
        }
        return true;
    }
}

registerProcessor('pcm-player-processor', PCMPlayerProcessor);
