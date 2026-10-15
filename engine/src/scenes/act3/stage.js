// ACT III · 107.15-110.41 · 世界 是我的舞台 (the world is my stage).
// The ruins on mesa B are an amphitheatre. Over the three stutter stops the world goes dark and on each re-hit
// (108.08 / 108.68 / 109.28) a coloured spotlight slams onto one band member (Jade, Charlie, Ricky); the steps under
// each one take its colour (paintlog). On Ricky's hit his chord colours the stage arch; for one bar they are a band.
import * as THREE from 'three';
import * as T from '../../show/timing.js';
import { getWorld, MESA_B } from './world/build.js';
import { make3D, CUE, V, aim, persp, smooth, clamp01, LOOK } from './common.js';
import { STAGE_HITS } from './paintlog.js';

export const ORDER = ['jade', 'charlie', 'ricky'];

/** band on the stage (shared with rap.js): poses at t */
export function bandPose(P, t, { playing = true } = {}) {
  const B = P.BAND; const out = {};
  const bp = T.beatPulse(t, 1, 0.12);
  out.jade = { x: B.jade.x, y: B.jade.y, z: B.jade.z, anim: 'sing', frame: Math.floor(T.beatAt(t) * 2) % 2, pencil: true, rotY: -Math.PI / 2 };
  out.charlie = { x: B.charlie.x, y: B.charlie.y + (playing ? 2 * bp : 0), z: B.charlie.z, anim: 'idle', t, rotY: -Math.PI / 2 };
  out.ricky = { x: B.ricky.x, y: B.ricky.y, z: B.ricky.z, anim: playing ? 'sustain' : 'idle', t, rotY: -Math.PI / 2, facing: -1 };
  return out;
}
/** spotlight rig: on = [0..1] per member */
export function spots(W, on, t, dark = 1) {
  const P = W.props;
  ORDER.forEach((n, i) => {
    const s = P.spots[i], b = P.BAND[n], k = on[i]; if (k <= 0) return;
    // front light from the audience side, high: faces read; the cone is visible between the lamp and the performer
    const lamp = V(b.x - 100, b.y + 100, b.z + (i === 1 ? -45 : i === 2 ? 45 : 0)), aimP = V(b.x, b.y + 20, b.z);   // keyed from the front at ~45°
    const dir = aimP.clone().sub(lamp); const len = dir.length(); dir.normalize();
    s.cone.visible = true; s.cone.position.copy(lamp); s.cone.quaternion.setFromUnitVectors(V(0, -1, 0), dir); s.cone.scale.set(1, len / 170, 1);
    s.cone.material.opacity = 0.04 * k * (0.35 + 0.65 * dark); // a faint beam only: the colour lives in the floor pools
    s.pool.visible = true; s.pool.position.set(b.x, b.y + 0.9, b.z); s.pool.material.opacity = 0.55 * k;
    s.light.color.set(s.col).lerp(new THREE.Color('#fff4e6'), 0.8); s.light.intensity = 2600 * k * (0.5 + 0.5 * dark); // near-white key: true colours, the pools carry the tint
    s.light.angle = 0.2; s.light.position.copy(lamp); s.tgt.position.copy(aimP); s.tgt.updateMatrixWorld();
  });
}

export async function setup(ctx) {
  const W = await getWorld(ctx); const P = W.props; const aspect = ctx.width / ctx.height;
  const S = P.stageC;
  return make3D(ctx, W, {
    frame(t) {
      const [s1, s2, s3] = CUE.stops; const H = STAGE_HITS;
      // darkness: the stops black the world out; the spots stay
      const dark = t >= s1 ? (t < H[2] ? 1 : 1 - smooth(H[2] + 0.25, H[2] + 0.9, t)) : 0;
      const on = H.map((h) => (t >= T.snap(h) ? 1 : 0));
      // freeze the band in each stop (stutter): poses held at the stop start
      const frozenT = t >= s1 && t < H[0] ? s1 : t >= s2 && t < H[1] ? s2 : t >= s3 && t < H[2] ? s3 : t;
      const band = bandPose(P, frozenT, { playing: t < s1 || t >= H[2] });
      if (t >= H[2] && t < H[2] + 0.2) band.ricky = { ...band.ricky, anim: 'chord', frame: 1, facing: -1 };
      if (t >= H[0] && t < H[0] + 0.25) band.jade.frame = 1;
      for (const [n, s] of Object.entries(band)) W.put(W.heroes[n], s);
      spots(W, on.map((k, i) => k * (1 + 0.6 * T.pulse(t, [H[i]], 0.12))), t, dark);
      P.sparks.visible = true; P.sparks.run(t, H.map((h, i) => { const b = P.BAND[ORDER[i]]; return { t0: h, x: b.x, y: b.y + 2, z: b.z, n: 16, speed: 40, up: 30, g: 60, dur: 0.6, seed: 200 + i, colors: [P.spots[i].col, '#ffffff'] }; }));
      // cameras: wide from the seats; punch-in on each hit; wide again for the band bar
      let pos, tgt, fov = 46;
      const wideP = V(S.x - 175, MESA_B.top + 52, S.z + 8), wideT = V(S.x + 10, MESA_B.top + 40, S.z);
      const hit = H.reduce((a, h, i) => (t >= T.snap(h) ? i : a), -1);
      if (hit < 0 || t >= H[2] + 0.35) {
        const k = smooth(CUE.stage, 110.41, t);
        pos = wideP.clone().add(V(30 * k, -6 * k, 0)); tgt = wideT; fov = 46 - 4 * k;
      } else {
        const b = P.BAND[ORDER[hit]]; const k = smooth(H[hit], H[hit] + 0.5, t);
        pos = V(b.x - 150 + 12 * k, b.y + 40, b.z + (hit === 1 ? -14 : hit === 2 ? 14 : 0)); tgt = V(b.x, b.y + 28, b.z); fov = 40;
      }
      const camera = aim(persp('stage', aspect), pos, tgt, fov);
      const look = LOOK({ dim: 1 - 0.38 * dark, rays: 0.45 * (1 - dark), atmos: 1, dofAmount: 0.2, bloomAmt: 0.16, hemi: 1, fill: 1.1 });
      return { camera, target: tgt, focus: V(S.x, 30, S.z), look, shadowExtent: 350, subPos: 'top' };
    },
  });
}
