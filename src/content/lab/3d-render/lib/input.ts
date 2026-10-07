export class InputHandler {
  #keys = {};
  #yaw = 0;
  #pitch = 0;
  #sensitivity = 0.003;
  #isLocked = false;

  constructor(canvas) {
    window.addEventListener("keydown", (e) => { this.#keys[e.code] = true; });
    window.addEventListener("keyup", (e) => { this.#keys[e.code] = false; });

    canvas.addEventListener("click", () => {
      canvas.requestPointerLock();
    });

    document.addEventListener("pointerlockchange", () => {
      this.#isLocked = (document.pointerLockElement === canvas);
    });

    document.addEventListener("mousemove", (e) => {
      if (!this.#isLocked) return;
      this.#yaw += e.movementX * this.#sensitivity;
      this.#pitch -= e.movementY * this.#sensitivity;
      const maxPitch = Math.PI / 2 - 1;
      this.#pitch = Math.max(-maxPitch, Math.min(maxPitch, this.#pitch));
    });
  }

  updateCamera(cam, setCameraCallback) {
    if (!this.#isLocked) return;
    const dx = Math.cos(this.#pitch) * Math.sin(this.#yaw);
    const dy = Math.sin(this.#pitch);
    const dz = -Math.cos(this.#pitch) * Math.cos(this.#yaw);

    const rightX = Math.cos(this.#yaw);
    const rightZ = Math.sin(this.#yaw);

    const speed = 0.2;
    let x = cam.x;
    let y = cam.y;
    let z = cam.z;

    if (this.#keys["KeyW"]) {
      x += dx * speed;
      y += dy * speed;
      z += dz * speed;
    }
    if (this.#keys["KeyS"]) {
      x -= dx * speed;
      y -= dy * speed;
      z -= dz * speed;
    }
    if (this.#keys["KeyA"]) {
      x -= rightX * speed;
      z -= rightZ * speed;
    }
    if (this.#keys["KeyD"]) {
      x += rightX * speed;
      z += rightZ * speed;
    }
    if (this.#keys["Space"]) {
      y += speed;
    }
    if (this.#keys["ShiftLeft"] || this.#keys["ShiftRight"]) {
      y -= speed;
    }
    setCameraCallback(x, y, z, dx, dy, dz);
  }
}
