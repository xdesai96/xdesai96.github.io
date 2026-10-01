// @ts-nocheck
export const loadImageGenerator = async () => {
  // maximum bytes is 128 * 64kb * 1024b = 8388608 bytes
  // I guess it's enough for some bigger pictures ;)
  const memory = new WebAssembly.Memory({
    initial: 24,
    maximum: 128,
  });

  const wasm = await WebAssembly.instantiateStreaming(
    fetch("/wasm/image-generator.wasm"),
    {
      env: {
        memory
      }
    }
  );

  return new ImageGenerator(wasm.instance, memory);
};

class ImageGenerator {
  private wasm: WebAssembly.Instance;
  private memory: WebAssembly.Memory;
  private exports: WebAssembly.Exports;

  constructor(wasm: WebAssembly.Instance, memory: WebAssembly.Memory) {
    this.wasm = wasm;
    this.memory = memory;
    this.exports = wasm.exports;
  }

  draw = (canvas: HTMLCanvasElement, width: number, height: number) => {
    canvas.height = height;
    canvas.width = width;
    const view = new DataView(this.memory.buffer);
    const channels = view.getUint32(this.wasm.exports.CHANNELS.value, true);
    // generateCanvas(width, height, r, g, b, a);
    const imagePtr = this.exports.generateCanvas(canvas.width, canvas.height, 0x18, 0x18, 0x18, 255);
    this.exports.drawImage();
    const pixels = new Uint8ClampedArray(this.memory.buffer, imagePtr, canvas.width * canvas.height * channels);
    return pixels;
  };
}
