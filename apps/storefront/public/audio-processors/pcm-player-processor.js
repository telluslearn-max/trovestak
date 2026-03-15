class PCMPlayerProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this._buffer = [];
    this.port.onmessage = (e) => {
      const int16 = new Int16Array(e.data);
      const float32 = new Float32Array(int16.length);
      for (let i = 0; i < int16.length; i++) {
        float32[i] = int16[i] / 32768.0;
      }
      this._buffer.push(...float32);
    };
  }
  process(inputs, outputs) {
    const output = outputs[0][0];
    if (!output) return true;
    if (this._buffer.length >= output.length) {
      output.set(this._buffer.splice(0, output.length));
    } else {
      output.fill(0);
    }
    return true;
  }
}
registerProcessor("pcm-player-processor", PCMPlayerProcessor);
