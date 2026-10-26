import * as THREE from "three";

const VERTEX = /* glsl */ `
varying vec3 vNormal;
void main() {
  vNormal = normalize(normalMatrix * normal);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const FRAGMENT = /* glsl */ `
varying vec3 vNormal;
uniform vec3 glowColor;
void main() {
  float intensity = pow(0.72 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 3.0);
  gl_FragColor = vec4(glowColor, 1.0) * intensity;
}
`;

export function createAtmosphere(radius: number, color = 0x4fb6ff): THREE.Mesh {
  const geometry = new THREE.SphereGeometry(radius, 64, 64);
  const material = new THREE.ShaderMaterial({
    uniforms: { glowColor: { value: new THREE.Color(color) } },
    vertexShader: VERTEX,
    fragmentShader: FRAGMENT,
    blending: THREE.AdditiveBlending,
    side: THREE.BackSide,
    depthWrite: false,
    transparent: true,
  });
  return new THREE.Mesh(geometry, material);
}
