///
function createPerspectiveMatrix (fov: number, aspect: number, near: number, far: number) {
  const f = 1 / Math.tan(fov / 2);
  return new Float32Array([
    f / aspect, 0, 0, 0,
    0, f, 0, 0,
    0, 0, far / (near - far), -1,
    0, 0, (near * far) / (near - far), 0,
  ]);
};

function multiplyMatrices(a, b) {
  const result = new Float32Array(16);
  for (let column = 0; column < 4; column++) {
    for (let row = 0; row < 4; row++) {
      result[column * 4 + row] =
        a[0 * 4 + row] * b[column * 4 + 0] +
        a[1 * 4 + row] * b[column * 4 + 1] +
        a[2 * 4 + row] * b[column * 4 + 2] +
        a[3 * 4 + row] * b[column * 4 + 3];
    }
  }
  return result;
};

function createViewMatrix(camera) {
  const eye = [camera.x, camera.y, camera.z];
  const forward = [camera.dx, camera.dy, camera.dz];
  const up = [0, 1, 0]
  const right = [
    forward[1] * up[2] - forward[2] * up[1],
    forward[2] * up[0] - forward[0] * up[2],
    forward[0] * up[1] - forward[1] * up[0],
  ];
  const realUp = [
    right[1] * forward[2] - right[2] * forward[1],
    right[2] * forward[0] - right[0] * forward[2],
    right[0] * forward[1] - right[1] * forward[0],
  ];
  return new Float32Array([
    right[0],         realUp[0],         -forward[0],       0,
    right[1],         realUp[1],         -forward[1],       0,
    right[2],         realUp[2],         -forward[2],       0,
    -dot(right, eye), -dot(realUp, eye), dot(forward, eye), 1,
  ]);
}

const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

export function getCameraMatrix(camera, aspect) {
  const viewMatrix = createViewMatrix(camera);
  const projectionMatrix = createPerspectiveMatrix(Math.PI / 3, aspect, 0.1, 100);
  return multiplyMatrices(projectionMatrix, viewMatrix);
}

export async function createContext (canvas) {
  const adapter = await navigator.gpu.requestAdapter();
  if (!adapter) {
    throw new Error("WebGPU adapter not found");
  }
  const device = await adapter.requestDevice();
  const format = navigator.gpu.getPreferredCanvasFormat();
  const context = canvas.getContext("webgpu");
  context.configure({ device, format, alphaMode: "premultiplied" });
  return {device, context, format};
}

export async function createPipeline(device, format) {
  const shaderSource = await fetch("/shaders/3d-rendering.wgsl").then(response => response.text())
  const shader = device.createShaderModule({code: shaderSource});
  return device.createRenderPipeline({
    layout: "auto",
    vertex: {
      module: shader,
      entryPoint: "vs_main",
      buffers: [
        {
          arrayStride: 32,
          attributes: [
            { shaderLocation: 0, offset: 0, format: "float32x3", },
            { shaderLocation: 1, offset: 16, format: "float32x3", }
          ],
        },
      ],
    },
    fragment: {
      module: shader,
      entryPoint: "fs_main",
      targets: [ { format }, ],
    },
    primitive: { topology: "triangle-list" },
    depthStencil: {
      format: "depth24plus",
      depthWriteEnabled: true,
      depthCompare: "less",
    },
  });
}

export function createBindGroup(device, pipeline, cameraBuffer) {
  return device.createBindGroup({
    layout: pipeline.getBindGroupLayout(0),
    entries: [
      {
        binding: 0,
        resource: {
          buffer: cameraBuffer,
        },
      },
    ],
  });
}

export function initObjects(device, objects) {
  return objects.map(object => {
    const { vertices, indices } = object.mesh;
    const vertexBuffer = device.createBuffer({
      size: vertices.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(vertexBuffer, 0, vertices);
    const indexBuffer = device.createBuffer({
      size: indices.byteLength,
      usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(indexBuffer, 0, indices);
    return {
      ...object,
      buffers: {
        vertex: vertexBuffer,
        index: indexBuffer,
      },
    };
  })
}

export function renderObjects(pass, object) {
  pass.setVertexBuffer(0, object.buffers.vertex);
  pass.setIndexBuffer(object.buffers.index, "uint32");
  pass.drawIndexed(object.mesh.indices.length);
}
