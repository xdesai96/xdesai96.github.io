// @ts-nocheck

let wasmInstance = undefined;

export type Size = { width: number; height: number; }
export type Position = { x: number; y: number; }
export type Color = { r: number; g: number; b: number; a: number; }

class ImageGenerator {
  private wasm: WebAssembly.Instance;
  private memory: WebAssembly.Memory;
  private exports: WebAssembly.Exports;

  constructor(wasm: WebAssembly.Instance, memory: WebAssembly.Memory) {
    this.wasm = wasm;
    this.memory = memory;
    this.exports = wasm.exports;
  }

  init = (canvas: HTMLCanvasElement, size: Size, color: Color) => {
    canvas.height = size.height;
    canvas.width = size.width;
    const view = new DataView(this.memory.buffer);
    const channels = view.getUint32(this.wasm.exports.CHANNELS.value, true);
    const imagePtr = this.exports.generateCanvas(canvas.width, canvas.height, color.r, color.g, color.b, color.a);
    const pixels = new Uint8ClampedArray(this.memory.buffer, imagePtr, canvas.width * canvas.height * channels);
    return pixels;
  }

  drawRect = (position: Position, size: Size, color: Color) => {
    this.exports.drawRect(size.width, size.height, position.x, position.y, color.r, color.g, color.b, color.a);
  };
}

export const loadImageGenerator = async () => {
  // maximum bytes is 128 * 64kb * 1024b = 8388608 bytes
  // I guess it's enough for some bigger pictures ;)
  const memory = new WebAssembly.Memory({initial: 24, maximum: 128});
  if (wasmInstance) return new ImageGenerator(wasm.instance, memory);

  const wasm = await WebAssembly.instantiateStreaming(fetch("/wasm/image-generator.wasm"),
    {
      env: {
        memory
      }
    }
  );

  wasmInstance = wasm.instance;
  return new ImageGenerator(wasm.instance, memory);
};

