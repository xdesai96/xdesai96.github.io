// @ts-nocheck

let wasmInstance = undefined;

export const SoundGenerator = {
  async load() {
    const memory = new WebAssembly.Memory({initial: 24, maximum: 128});
    if (wasmInstance) return new SoundGenerator(wasm.instance, memory);
    const wasm = await WebAssembly.instantiateStreaming(fetch("/wasm/sound-generator.wasm"), {
      env: {
        memory,
      },
    });
    return new SoundGeneratorInstance(wasm.instance, memory);
  }
}

class SoundGeneratorInstance {
  #wasm: WebAssembly.Instance;
  #memory: WebAssembly.Memory;
  #exports: WebAssembly.Exports;

  constructor(wasm: WebAssembly.Instance, memory: WebAssembly.Memory) {
    this.#wasm = wasm;
    this.#memory = memory;
    this.#exports = wasm.exports;
    this.audioCtx = new AudioContext();
    this.duration = 3.*1000.;
  }

  #prepareSound = async (sample_rate, freqs) => {
    if (this.audioCtx.state === 'suspended') {
      await this.audioCtx.resume();
    }
    const ptrFreqs = this.#wasm.exports.alloc_frequencies(freqs.length);
    const freqView = new Float32Array(this.#memory.buffer, ptrFreqs, freqs.length);
    for (let i = 0; i < freqs.length; i++) freqView[i] = parseFloat(freqs[i]);
    const sample_count = Math.floor((sample_rate * this.duration) / 1000);
    return { ptrFreqs, sample_count };
  }

  #playSound = async (sample_rate, sample_count, samples_ptr) => {
    const audioBuf = this.audioCtx.createBuffer(1, sample_count, sample_rate);
    const farr = new Float32Array(this.#memory.buffer, samples_ptr, sample_count);
    audioBuf.copyToChannel(farr, 0);
    const source = this.audioCtx.createBufferSource();
    source.buffer = audioBuf;
    source.connect(this.audioCtx.destination);
    source.start();
  }

  sine = async (sample_rate, freqs) => {
    const { ptrFreqs, sample_count } = await this.#prepareSound(sample_rate, freqs, this.duration);
    const samplesPtr = this.#wasm.exports.sine(sample_rate, ptrFreqs, freqs.length, this.duration);
    await this.#playSound(sample_rate, sample_count, samplesPtr);
  }

  square = async (sample_rate, freqs) => {
    const { ptrFreqs, sample_count } = await this.#prepareSound(sample_rate, freqs, this.duration);
    const samplesPtr = this.#wasm.exports.square(sample_rate, ptrFreqs, freqs.length, this.duration);
    await this.#playSound(sample_rate, sample_count, samplesPtr);
  }

  sawtooth = async (sample_rate, freqs) => {
    const { ptrFreqs, sample_count } = await this.#prepareSound(sample_rate, freqs, this.duration);
    const samplesPtr = this.#wasm.exports.sawtooth(sample_rate, ptrFreqs, freqs.length, this.duration);
    await this.#playSound(sample_rate, sample_count, samplesPtr);
  }

  triangle = async (sample_rate, freqs) => {
    const { ptrFreqs, sample_count } = await this.#prepareSound(sample_rate, freqs, this.duration);
    const samplesPtr = this.#wasm.exports.triangle(sample_rate, ptrFreqs, freqs.length, this.duration);
    await this.#playSound(sample_rate, sample_count, samplesPtr);
  }

  whiteNoise = async (sample_rate, freqs) => {
    const { ptrFreqs, sample_count } = await this.#prepareSound(sample_rate, freqs, this.duration);
    const samplesPtr = this.#wasm.exports.white_noise(sample_rate, this.duration);
    await this.#playSound(sample_rate, sample_count, samplesPtr);
  }
}
