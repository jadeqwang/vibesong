// turn_demo: 6 s proof of concept of THE DIMENSIONAL TURN.
//   0.0–1.0 s  pure 2D (CARTRIDGE): the last two strokes of 画 are drawn on, camera scrolls
//   1.0–5.0 s  THE TURN (u: 0 -> 1)
//   5.0–6.0 s  TALOS hold (the unpainted plaster world, "fixtures only")
import * as THREE from 'three';
import { TurnRig } from '../turn.js';
import { G, smoothstep, clamp01 } from '../util.js';
import { buildWorld } from './talos_world.js';

export const TURN_START = 1.0, TURN_LEN = 4.0;
export const turnAt = (t) => clamp01((t - TURN_START) / TURN_LEN);
const FOCUS = new THREE.Vector3(20, 55, 0);

export async function setup(ctx) {
  const { width, height } = ctx;
  const W = await buildWorld(ctx);
  const rig = new TurnRig(width / height, { az3D: 60, el3D: 9, H3D: 280, target2D: new THREE.Vector3(10, 70, 0), target3D: new THREE.Vector3(-70, 50, 10) });
  W.setSun(new THREE.Vector3(-0.99, 0.085, -0.087));
  G.uPaintR.value = -1; // unpainted

  function update(t) {
    const u = turnAt(t);
    const pan = t < TURN_START ? -10 + 10 * t : 0;
    const { camera, p, dist, target } = rig.apply(u, pan);
    for (let i = 0; i < W.hz.strokeCount; i++) W.hua.setProgress(i, i < 6 ? 1 : 0);
    W.hua.setProgress(6, smoothstep(0.0, 0.55, t));
    W.hua.setProgress(7, smoothstep(0.45, 0.95, t));
    W.heroes.jade.setTime(t, 0.0); W.heroes.charlie.setTime(t, 0.25); W.heroes.ricky.setTime(t, 0.5);
    W.backdrop.userData.update(camera.position.x - 20, t, p.backdropFade);
    const L = { ...p, atmos: smoothstep(0.15, 0.7, u), rays: 0.25 * smoothstep(0.45, 1.0, u), ao: smoothstep(0.3, 0.8, u) };
    W.applyLook(t, L, { camera, target, dist, focus: FOCUS, virtFov: 1 - smoothstep(0.35, 0.97, u), distOffset: Math.max(0, dist - 420) });
    out.camera = camera;
  }
  const out = { scene: W.scene, camera: rig.ortho, update, duration: 6, warmup: [0, 2.5, 5.5] };
  return out;
}
