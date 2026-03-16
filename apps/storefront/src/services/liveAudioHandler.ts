"use client";
/**
 * liveAudioHandler.ts
 * Ported from ideas/luxe-concierge-live/src/services/liveService.ts
 *
 * Handles:
 *  - Microphone capture → base64 PCM 16kHz (via ScriptProcessorNode)
 *  - Agent audio playback → queued AudioBufferSourceNode chunks
 *  - Interrupt (hard-stop all queued audio)
 */

export class LiveAudioHandler {
  private audioContext: AudioContext | null = null;
  private processor: ScriptProcessorNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private stream: MediaStream | null = null;
  private nextStartTime: number = 0;
  private activeSources: AudioBufferSourceNode[] = [];

  constructor(private onAudioData: (base64Data: string) => void) {}

  async start() {
    this.audioContext = new AudioContext({ sampleRate: 16000 });
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.source = this.audioContext.createMediaStreamSource(this.stream);

    this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);
    this.processor.onaudioprocess = (e) => {
      const inputData = e.inputBuffer.getChannelData(0);
      const pcmData = this.floatTo16BitPCM(inputData);
      const base64Data = btoa(
        String.fromCharCode(...new Uint8Array(pcmData.buffer))
      );
      this.onAudioData(base64Data);
    };

    this.source.connect(this.processor);
    this.processor.connect(this.audioContext.destination);
    this.nextStartTime = this.audioContext.currentTime;
  }

  stop() {
    this.interrupt();
    this.source?.disconnect();
    this.processor?.disconnect();
    this.stream?.getTracks().forEach((t) => t.stop());
    this.audioContext?.close();
    this.audioContext = null;
    this.source = null;
    this.processor = null;
    this.stream = null;
  }

  playChunk(base64Data: string) {
    if (!this.audioContext || this.audioContext.state === "suspended") return;

    const binary = atob(base64Data);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const pcmData = new Int16Array(bytes.buffer);
    const floatData = new Float32Array(pcmData.length);
    for (let i = 0; i < pcmData.length; i++) floatData[i] = pcmData[i] / 32768.0;

    const buffer = this.audioContext.createBuffer(1, floatData.length, 24000);
    buffer.getChannelData(0).set(floatData);

    const src = this.audioContext.createBufferSource();
    src.buffer = buffer;
    src.connect(this.audioContext.destination);

    const startTime = Math.max(this.nextStartTime, this.audioContext.currentTime);
    src.start(startTime);
    this.nextStartTime = startTime + buffer.duration;

    this.activeSources.push(src);
    src.onended = () => {
      this.activeSources = this.activeSources.filter((s) => s !== src);
    };
  }

  interrupt() {
    this.activeSources.forEach((src) => {
      try {
        src.stop(0);
        src.disconnect();
      } catch {
        // already stopped
      }
    });
    this.activeSources = [];
    this.nextStartTime = this.audioContext?.currentTime ?? 0;
  }

  private floatTo16BitPCM(float32Array: Float32Array): Int16Array {
    const buffer = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
      const s = Math.max(-1, Math.min(1, float32Array[i]));
      buffer[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    return buffer;
  }
}
