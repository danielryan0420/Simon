import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { latLonToVector3, vector3ToLatLon } from "../game/geo";
import { createAtmosphere } from "./atmosphere";
import { createStarfield } from "./starfield";
import { Projectile } from "./trail";
import { ConfettiSystem } from "./confetti";
import { getTheme } from "./themes";
import { getSkin } from "./skins";

const GLOBE_RADIUS = 1;
const MIN_DISTANCE = 1.35;
const MAX_DISTANCE = 3.2;

export interface GlobeOptions {
  onTap?: (lat: number, lon: number) => void;
}

function isMobileDevice(): boolean {
  return window.matchMedia("(max-width: 820px)").matches || "ontouchstart" in window;
}

/** Spherical interpolation between two unit vectors (THREE.Vector3 has no slerp of its own). */
function slerpUnitVectors(a: THREE.Vector3, b: THREE.Vector3, t: number): THREE.Vector3 {
  const dot = Math.max(-1, Math.min(1, a.dot(b)));
  const theta = Math.acos(dot);
  if (theta < 1e-6) return a.clone();
  const sinTheta = Math.sin(theta);
  const wa = Math.sin((1 - t) * theta) / sinTheta;
  const wb = Math.sin(t * theta) / sinTheta;
  return a.clone().multiplyScalar(wa).add(b.clone().multiplyScalar(wb)).normalize();
}

export class GlobeScene {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly camera: THREE.PerspectiveCamera;
  readonly controls: OrbitControls;
  private earth: THREE.Mesh;
  private clouds: THREE.Mesh;
  private atmosphere: THREE.Mesh;
  private starfield: THREE.Points;
  private pinGroup = new THREE.Group();
  private projectiles: Projectile[] = [];
  private confetti = new ConfettiSystem();
  private container: HTMLElement;
  private raf = 0;
  private lastTime = 0;
  private mobile = isMobileDevice();
  private onTap?: (lat: number, lon: number) => void;
  private pointerDown: { x: number; y: number; time: number } | null = null;
  private resizeObserver: ResizeObserver;

  constructor(container: HTMLElement, opts: GlobeOptions = {}) {
    this.container = container;
    this.onTap = opts.onTap;

    this.renderer = new THREE.WebGLRenderer({ antialias: !this.mobile, alpha: false });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    this.camera.position.set(0, 0.4, 2.4);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.minDistance = MIN_DISTANCE;
    this.controls.maxDistance = MAX_DISTANCE;
    this.controls.enablePan = false;
    this.controls.rotateSpeed = 0.5;
    this.controls.zoomSpeed = 0.7;
    this.controls.autoRotate = true;
    this.controls.autoRotateSpeed = 0.4;
    this.controls.touches = { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_ROTATE };

    const loader = new THREE.TextureLoader();
    const base = import.meta.env.BASE_URL;
    const colorMap = loader.load(`${base}textures/earth_atmos_2048.jpg`);
    colorMap.colorSpace = THREE.SRGBColorSpace;
    const normalMap = loader.load(`${base}textures/earth_normal_2048.jpg`);
    const specularMap = loader.load(`${base}textures/earth_specular_2048.jpg`);
    const cloudsMap = loader.load(`${base}textures/earth_clouds_1024.png`);

    const earthGeo = new THREE.SphereGeometry(GLOBE_RADIUS, this.mobile ? 48 : 96, this.mobile ? 48 : 96);
    const earthMat = new THREE.MeshPhongMaterial({
      map: colorMap,
      normalMap: this.mobile ? null : normalMap,
      specularMap,
      specular: new THREE.Color(0x333333),
      shininess: 6,
    });
    this.earth = new THREE.Mesh(earthGeo, earthMat);
    this.scene.add(this.earth);

    const cloudGeo = new THREE.SphereGeometry(GLOBE_RADIUS * 1.008, this.mobile ? 32 : 64, this.mobile ? 32 : 64);
    const cloudMat = new THREE.MeshLambertMaterial({
      map: cloudsMap,
      transparent: true,
      opacity: 0.4,
      blending: THREE.NormalBlending,
      depthWrite: false,
    });
    this.clouds = new THREE.Mesh(cloudGeo, cloudMat);
    this.scene.add(this.clouds);

    this.atmosphere = createAtmosphere(GLOBE_RADIUS * 1.15);
    this.scene.add(this.atmosphere);

    this.starfield = createStarfield(this.mobile ? 2200 : 6000);
    this.scene.add(this.starfield);

    this.scene.add(this.pinGroup);
    this.scene.add(this.confetti.group);

    const sun = new THREE.DirectionalLight(0xffffff, 2.2);
    sun.position.set(5, 2, 5);
    this.scene.add(sun);
    const ambient = new THREE.AmbientLight(0x6080a0, 1.1);
    this.scene.add(ambient);

    this.renderer.domElement.addEventListener("pointerdown", this.handlePointerDown);
    this.renderer.domElement.addEventListener("pointerup", this.handlePointerUp);

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(container);
    this.resize();

    this.lastTime = performance.now();
    this.raf = requestAnimationFrame(this.tick);
  }

  get isMobile(): boolean {
    return this.mobile;
  }

  resize(): void {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    if (w === 0 || h === 0) return;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  setTheme(themeId: string): void {
    const theme = getTheme(themeId);
    (this.earth.material as THREE.MeshPhongMaterial).color.set(theme.earthTint);
    (this.atmosphere.material as THREE.ShaderMaterial).uniforms.glowColor.value.set(theme.atmosphereColor);
    (this.starfield.material as THREE.PointsMaterial).color.set(theme.starColor);
    this.renderer.setClearColor(theme.bgColor, 1);
  }

  setAutoRotate(value: boolean): void {
    this.controls.autoRotate = value;
  }

  private handlePointerDown = (e: PointerEvent): void => {
    this.pointerDown = { x: e.clientX, y: e.clientY, time: performance.now() };
  };

  private handlePointerUp = (e: PointerEvent): void => {
    const start = this.pointerDown;
    this.pointerDown = null;
    if (!start) return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    const dist = Math.hypot(dx, dy);
    const dt = performance.now() - start.time;
    // Treat as a tap only if the pointer barely moved and was quick (not a drag/pinch).
    if (dist > 8 || dt > 600) return;

    const hit = this.raycastPointer(e.clientX, e.clientY);
    if (hit) this.onTap?.(hit.lat, hit.lon);
  };

  raycastPointer(clientX: number, clientY: number): { lat: number; lon: number } | null {
    const rect = this.renderer.domElement.getBoundingClientRect();
    const ndc = new THREE.Vector2(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1
    );
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(ndc, this.camera);
    const hits = raycaster.intersectObject(this.earth, false);
    if (hits.length === 0) return null;
    const p = hits[0].point;
    return vector3ToLatLon(p.x, p.y, p.z);
  }

  /** Smoothly orbits the camera so the given lat/lon faces the viewer. */
  flyTo(lat: number, lon: number, distance = 1.8, duration = 1400): Promise<void> {
    return new Promise((resolve) => {
      const [tx, ty, tz] = latLonToVector3(lat, lon, 1);
      const targetDir = new THREE.Vector3(tx, ty, tz).normalize();
      const startPos = this.camera.position.clone();
      const startDist = startPos.length();
      const startDir = startPos.clone().normalize();

      const wasAutoRotate = this.controls.autoRotate;
      this.controls.autoRotate = false;

      const startTime = performance.now();
      const animate = () => {
        const t = Math.min(1, (performance.now() - startTime) / duration);
        const eased = 1 - Math.pow(1 - t, 3);
        const dir = slerpUnitVectors(startDir, targetDir, eased);
        const dist = startDist + (distance - startDist) * eased;
        this.camera.position.copy(dir.multiplyScalar(dist));
        this.controls.update();
        if (t < 1) {
          requestAnimationFrame(animate);
        } else {
          this.controls.autoRotate = wasAutoRotate;
          resolve();
        }
      };
      requestAnimationFrame(animate);
    });
  }

  dropPin(lat: number, lon: number, color = 0xff4d4d): THREE.Group {
    const [x, y, z] = latLonToVector3(lat, lon, GLOBE_RADIUS * 1.01);
    const group = new THREE.Group();
    const poleGeo = new THREE.CylinderGeometry(0.004, 0.004, 0.05, 6);
    const poleMat = new THREE.MeshBasicMaterial({ color });
    const pole = new THREE.Mesh(poleGeo, poleMat);
    pole.position.set(0, 0.025, 0);
    const headGeo = new THREE.SphereGeometry(0.014, 12, 12);
    const head = new THREE.Mesh(headGeo, poleMat);
    head.position.set(0, 0.05, 0);
    group.add(pole, head);
    group.position.set(x, y, z);
    group.lookAt(0, 0, 0);
    group.rotateX(Math.PI / 2);
    // Pop-in animation.
    group.scale.setScalar(0.001);
    this.pinGroup.add(group);
    const start = performance.now();
    const grow = () => {
      const t = Math.min(1, (performance.now() - start) / 350);
      const s = t < 1 ? 1.15 * Math.sin((t * Math.PI) / 2) + (1 - t) * 0.001 : 1;
      group.scale.setScalar(Math.max(0.05, s));
      if (t < 1) requestAnimationFrame(grow);
      else group.scale.setScalar(1);
    };
    requestAnimationFrame(grow);
    return group;
  }

  clearPins(): void {
    while (this.pinGroup.children.length > 0) {
      const child = this.pinGroup.children[0];
      this.pinGroup.remove(child);
      child.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          (obj.material as THREE.Material).dispose();
        }
      });
    }
  }

  launchProjectile(
    fromLat: number,
    fromLon: number,
    toLat: number,
    toLon: number,
    skinId = "plane-classic"
  ): Promise<void> {
    return new Promise((resolve) => {
      const skin = getSkin(skinId);
      const [fx, fy, fz] = latLonToVector3(fromLat, fromLon, GLOBE_RADIUS * 1.02);
      const [tx, ty, tz] = latLonToVector3(toLat, toLon, GLOBE_RADIUS * 1.02);
      const projectile = new Projectile(
        new THREE.Vector3(fx, fy, fz),
        new THREE.Vector3(tx, ty, tz),
        { color: skin.color, trailLength: this.mobile ? 8 : 16 }
      );
      projectile.onComplete(() => resolve());
      this.scene.add(projectile.group);
      this.projectiles.push(projectile);
    });
  }

  burstConfetti(lat: number, lon: number, count?: number): void {
    const [x, y, z] = latLonToVector3(lat, lon, GLOBE_RADIUS * 1.03);
    this.confetti.burst(new THREE.Vector3(x, y, z), count ?? (this.mobile ? 20 : 45));
  }

  private tick = (now: number): void => {
    const delta = now - this.lastTime;
    this.lastTime = now;

    this.clouds.rotation.y += delta * 0.00002;
    this.controls.update();

    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      const alive = p.update(delta);
      if (!alive) {
        this.scene.remove(p.group);
        p.dispose();
        this.projectiles.splice(i, 1);
      }
    }
    this.confetti.update(delta);

    this.renderer.render(this.scene, this.camera);
    this.raf = requestAnimationFrame(this.tick);
  };

  dispose(): void {
    cancelAnimationFrame(this.raf);
    this.resizeObserver.disconnect();
    this.renderer.domElement.removeEventListener("pointerdown", this.handlePointerDown);
    this.renderer.domElement.removeEventListener("pointerup", this.handlePointerUp);
    this.controls.dispose();
    this.renderer.dispose();
    this.container.removeChild(this.renderer.domElement);
  }
}
