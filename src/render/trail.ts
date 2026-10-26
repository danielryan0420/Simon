import * as THREE from "three";

export interface ProjectileOptions {
  color?: number;
  trailLength?: number;
  arcHeight?: number;
  duration?: number;
}

/**
 * Flies a small glowing "ship" from one point to another over the globe
 * surface along a raised arc, leaving a fading comet trail behind it.
 * Returns an updater to call each frame with elapsed ms; resolves via onDone.
 */
export class Projectile {
  readonly group = new THREE.Group();
  private head: THREE.Mesh;
  private trailDots: THREE.Mesh[] = [];
  private history: THREE.Vector3[] = [];
  private from: THREE.Vector3;
  private to: THREE.Vector3;
  private control: THREE.Vector3;
  private duration: number;
  private elapsed = 0;
  private done = false;
  private onDone?: () => void;

  constructor(from: THREE.Vector3, to: THREE.Vector3, opts: ProjectileOptions = {}) {
    this.from = from.clone();
    this.to = to.clone();
    this.duration = opts.duration ?? 900;

    const mid = from.clone().add(to).multiplyScalar(0.5);
    const normal = mid.clone().normalize();
    const arcHeight = opts.arcHeight ?? 0.35;
    this.control = mid.add(normal.multiplyScalar(arcHeight));

    const color = opts.color ?? 0xffcc33;
    const headGeo = new THREE.ConeGeometry(0.018, 0.05, 8);
    const headMat = new THREE.MeshBasicMaterial({ color });
    this.head = new THREE.Mesh(headGeo, headMat);
    this.group.add(this.head);

    const trailLength = opts.trailLength ?? 16;
    for (let i = 0; i < trailLength; i++) {
      const t = i / trailLength;
      const dotGeo = new THREE.SphereGeometry(0.012 * (1 - t * 0.7), 6, 6);
      const dotMat = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: (1 - t) * 0.65,
      });
      const dot = new THREE.Mesh(dotGeo, dotMat);
      this.trailDots.push(dot);
      this.group.add(dot);
    }
  }

  onComplete(cb: () => void): this {
    this.onDone = cb;
    return this;
  }

  private pointAt(t: number): THREE.Vector3 {
    const a = this.from.clone().lerp(this.control, t);
    const b = this.control.clone().lerp(this.to, t);
    return a.lerp(b, t);
  }

  update(deltaMs: number): boolean {
    if (this.done) return false;
    this.elapsed += deltaMs;
    const t = Math.min(1, this.elapsed / this.duration);
    const eased = 1 - Math.pow(1 - t, 2);
    const pos = this.pointAt(eased);
    this.head.position.copy(pos);
    this.head.lookAt(this.pointAt(Math.min(1, eased + 0.05)));

    this.history.unshift(pos.clone());
    if (this.history.length > this.trailDots.length) this.history.pop();
    this.trailDots.forEach((dot, i) => {
      const hp = this.history[i];
      if (hp) {
        dot.visible = true;
        dot.position.copy(hp);
      } else {
        dot.visible = false;
      }
    });

    if (t >= 1) {
      this.done = true;
      this.onDone?.();
      return false;
    }
    return true;
  }

  dispose(): void {
    this.group.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
        (obj.material as THREE.Material).dispose();
      }
    });
  }
}
