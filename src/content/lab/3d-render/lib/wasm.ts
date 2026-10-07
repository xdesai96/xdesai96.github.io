///
const WASM = "/wasm/3d-renderer.wasm"

export async function loadWasm() {
  const memory = new WebAssembly.Memory({
    initial: 24,
    maximum: 128,
  });
  const wasm = await WebAssembly.instantiateStreaming(fetch(WASM), {
    env: {
      memory,
      print: (args: number) => { console.log("WASM:", args) },
    },
  });
  return new ShadersInstance(wasm.instance, memory);
}

class ShadersInstance {
  #wasm;
  #memory;
  #dataView
  constructor(wasm: WebAssembly.Instance, memory: WebAssembly.Memory){
    this.#wasm = wasm;
    this.#memory = memory;
    this.#dataView = new DataView(memory.buffer);
  }

  #refreshView() {
    if (this.#dataView.buffer.byteLength !== this.#memory.buffer.byteLength)
      this.#dataView = new DataView(this.#memory.buffer);

  }

  getCamera = () => {
    // @ts-ignore
    const ptr = this.#wasm.exports.getCameraPtr();
    const camera = new Float32Array(this.#memory.buffer, ptr, 8);
    return {
      x: camera[0], y: camera[1], z: camera[2],
      dx: camera[4], dy: camera[5], dz: camera[6],
    };
  }

  setCamera = (x: number, y: number, z: number, dx: number, dy: number, dz: number) => {
    this.#wasm.exports.setCamera(x, y, z, dx, dy, dz);
  }

  getObjects = () => {
    this.#refreshView();
    const objsPtr = this.#wasm.exports.getObjectsPtr();
    const objsCount = this.#wasm.exports.getObjectsCount();
    const objSize = this.#wasm.exports.getObjectSize();

    const objects = [];
    for (let i = 0; i < objsCount; i++) {
      const objPtr = objsPtr + i * objSize;
      const verticesPtr = this.#dataView.getUint32(objPtr + 16, true);
      const verticesLen = this.#dataView.getUint32(objPtr + 20, true);
      const indicesPtr = this.#dataView.getUint32(objPtr + 24, true);
      const indicesLen = this.#dataView.getUint32(objPtr + 28, true);
      objects.push({
        mesh: {
          vertices: new Float32Array(this.#memory.buffer, verticesPtr, verticesLen * 8),
          indices: new Uint32Array(this.#memory.buffer, indicesPtr, indicesLen),
        }
      });
    }
    return objects;
  }

  initScene = () => {
    this.#wasm.exports.initScene();
    return this.getObjects();
  }
}
