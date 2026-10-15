// THE TURN: one parameter u∈[0,1] drives camera, projection, pixelation,
// lighting and post. u=0 is the exact orthographic 2D side view; u=1 the
// cinematic 3D view. Reusable by any scene (pass different `cfg`).
//
// Projection blend = dolly zoom: a perspective camera whose FOV grows from ~0.2°
// to `fov3D` while its distance shrinks so the frustum height at the target stays
// H(u). At u=0 we swap in a real OrthographicCamera (pixel-exact 2D).
import * as THREE from 'three';
import { lerp, smoothstep, smootherstep, clamp01 } from './util.js';

const DEG = Math.PI / 180;

export const TURN_DEFAULTS = {
  H2D: 180,              // world units visible vertically in 2D (=1080/6 -> 6px blocks)
  H3D: 175,
  fov3D: 40,             // degrees
  fovMin: 0.25,
  az3D: 68,              // degrees of swing around +Y
  el3D: 15,              // degrees of rise
  roll: 2.5,             // degrees of mid-turn dutch roll (disorientation)
  pix2D: 6,              // block size in output px at u=0
  target2D: new THREE.Vector3(20, 70, 0),
  target3D: new THREE.Vector3(-40, 55, 0),
  depth2D: 150,          // how far behind the target the 2D camera sees (far clip) …
  depthFar: 90000,       // … ramps to this
};

/** Pure function: all turn-dependent parameters for u. */
export function turnParams(u, cfg = TURN_DEFAULTS) {
  u = clamp01(u);
  // swing starts gently but commits early; lands softly
  const eAz = 1 - Math.pow(1 - smoothstep(0.0, 1.0, u), 1.6);
  const eEl = smoothstep(0.08, 0.95, u);
  const eF = smoothstep(0.0, 0.92, u);
  const fov = cfg.fovMin + (cfg.fov3D - cfg.fovMin) * Math.pow(eF, 1.6);
  return {
    u, fov, az: cfg.az3D * eAz * DEG, el: cfg.el3D * eEl * DEG,
    roll: cfg.roll * Math.sin(Math.PI * u) * smoothstep(0.0, 0.3, u) * DEG,
    H: lerp(cfg.H2D, cfg.H3D, eF),
    target: cfg.target2D.clone().lerp(cfg.target3D, smootherstep(0.05, 1.0, u)),
    pix: Math.max(1, lerp(cfg.pix2D, 1, smoothstep(0.06, 0.62, u))),
    palette: 1 - smoothstep(0.05, 0.5, u),
    outline: 1 - smoothstep(0.0, 0.35, u),
    flat: 1 - smoothstep(0.12, 0.6, u),
    light: smoothstep(0.15, 0.75, u),
    shadow: smoothstep(0.25, 0.8, u),
    tone: smoothstep(0.1, 0.65, u),
    backdropFade: smoothstep(0.08, 0.42, u),
    farReveal: smoothstep(0.12, 0.72, u),
    bloom: smoothstep(0.35, 0.9, u),
    dof: smoothstep(0.55, 1.0, u),
    grade: smoothstep(0.3, 1.0, u),
  };
}

export class TurnRig {
  constructor(aspect, cfg = {}) {
    this.cfg = { ...TURN_DEFAULTS, ...cfg };
    this.aspect = aspect;
    this.persp = new THREE.PerspectiveCamera(40, aspect, 1, 1000);
    this.ortho = new THREE.OrthographicCamera(-1, 1, 1, -1, 1, 1000);
  }
  /** returns {camera, p, dist} for turn u; `pan2D` is an extra world-x offset (2D scrolling) */
  apply(u, pan2D = 0) {
    const c = this.cfg, p = turnParams(u, c);
    const T = p.target.clone(); T.x += pan2D;
    if (u <= 0) {
      // pixel-exact: snap so frustum left/bottom land on integer world units
      T.x = Math.round(T.x - (c.H2D * this.aspect) / 2) + (c.H2D * this.aspect) / 2;
      T.y = Math.round(T.y - c.H2D / 2) + c.H2D / 2;
      const o = this.ortho, hh = c.H2D / 2, hw = hh * this.aspect;
      o.left = -hw; o.right = hw; o.top = hh; o.bottom = -hh;
      o.position.set(T.x, T.y, T.z + 1000); o.up.set(0, 1, 0); o.lookAt(T);
      o.near = 1000 - 500; o.far = 1000 + c.depth2D; o.updateProjectionMatrix(); o.updateMatrixWorld();
      return { camera: o, p, dist: 1000, target: T };
    }
    const cam = this.persp;
    const dist = p.H / (2 * Math.tan((p.fov * DEG) / 2));
    const dir = new THREE.Vector3(Math.sin(p.az) * Math.cos(p.el), Math.sin(p.el), Math.cos(p.az) * Math.cos(p.el));
    cam.position.copy(T).addScaledVector(dir, dist);
    const fwd = dir.clone().negate();
    const right = new THREE.Vector3().crossVectors(fwd, new THREE.Vector3(0, 1, 0)).normalize();
    const up = new THREE.Vector3().crossVectors(right, fwd).normalize();
    cam.up.copy(up.applyAxisAngle(fwd, p.roll));
    cam.lookAt(T);
    cam.fov = p.fov; cam.aspect = this.aspect;
    // exponential far-plane sweep: the world 'unfolds' behind the slice at a steady perceptual rate
    const reach = c.depth2D * Math.pow(c.depthFar / c.depth2D, p.farReveal);
    cam.near = Math.max(1, dist - 500); cam.far = dist + reach;
    cam.updateProjectionMatrix(); cam.updateMatrixWorld();
    return { camera: cam, p, dist, target: T };
  }
}
