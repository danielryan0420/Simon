import * as THREE from "three";

interface Piece {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  spin: THREE.Vector3;
  life: number;
  maxLife: number;
}

const COLORS = [0xff5a5f, 0xffd23f, 0x3fd0ff, 0x6bff6b, 0xff8cf0, 0xffffff];

export class ConfettiSystem {
  readonly group = new THREE.Group();
  private pieces: Piece[] = [];

  burst(origin: THREE.Vector3, count = 40): void {
    const normal = origin.clone().normalize();
    for (let i = 0; i < count; i++) {
      const color = COLORS[Math.floor(Math.random() * COLORS.length)];
      const geo = new THREE.PlaneGeometry(0.02, 0.012);
      const mat = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        side: THREE.DoubleSide,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(origin);
      this.group.add(mesh);

      const outward = normal
        .clone()
        .add(new THREE.Vector3((Math.random() - 0.5) * 1.2, (Math.random() - 0.5) * 1.2, (Math.random() - 0.5) * 1.2))
        .normalize()
        .multiplyScalar(0.015 + Math.random() * 0.02);

      this.pieces.push({
        mesh,
        velocity: outward,
        spin: new THREE.Vector3(Math.random() * 0.3, Math.random() * 0.3, Math.random() * 0.3),
        life: 0,
        maxLife: 900 + Math.random() * 500,
      });
    }
  }

  update(deltaMs: number): void {
    for (let i = this.pieces.length - 1; i >= 0; i--) {
      const p = this.pieces[i];
      p.life += deltaMs;
      const t = p.life / p.maxLife;
      if (t >= 1) {
        this.group.remove(p.mesh);
        p.mesh.geometry.dispose();
        (p.mesh.material as THREE.Material).dispose();
        this.pieces.splice(i, 1);
        continue;
      }
      p.mesh.position.addScaledVector(p.velocity, deltaMs * 0.06);
      p.velocity.multiplyScalar(0.98);
      p.mesh.rotation.x += p.spin.x;
      p.mesh.rotation.y += p.spin.y;
      p.mesh.rotation.z += p.spin.z;
      (p.mesh.material as THREE.MeshBasicMaterial).opacity = 1 - t;
    }
  }

  dispose(): void {
    for (const p of this.pieces) {
      this.group.remove(p.mesh);
      p.mesh.geometry.dispose();
      (p.mesh.material as THREE.Material).dispose();
    }
    this.pieces = [];
  }
}
