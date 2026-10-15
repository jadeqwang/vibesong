// talos: hero stills of the TALOS world from several camera setups.
//   node render.js --scene talos --shot <name> --stills 0:out.png
// Shots: hero_low | establishing | stroke_sky | paintwave
import * as THREE from 'three';
import { G, smoothstep } from '../util.js';
import { terrainHeight } from '../world.js';
import { buildWorld } from './talos_world.js';
import { TurnRig } from '../turn.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const stylobateTop = () => terrainHeight(-780, -120) + 4;
const LOOK3D = { flat: 0, light: 1, shadow: 1, tone: 1, palette: 0, pix: 1, outline: 0, bloom: 1, dof: 1, grade: 1, atmos: 1, rays: 0.35, ao: 1 };

export const SHOTS = {
  // low wide hero shot of the party in the colonnade aisle, sun low through the columns
  hero_low: () => {
    const y = stylobateTop();
    return {
      sun: V(-0.86, 0.10, 0.50), cam: V(-395, y + 16, -112), target: V(-760, y + 38, -128), fov: 52,
      heroPos: { jade: [-505, y, -128], charlie: [-535, y, -98], ricky: [-612, y, -116], rotY: [1.25, 1.45, 1.4] }, hideFar: true,
      focus: V(-520, y + 20, -124), shadowExtent: 900, look: { dofAmount: 0.55, rays: 1.2 },
    };
  },
  // high establishing shot: the 2D slice continues as a causeway along the sea cliff to the great gate
  establishing: () => ({
    sun: V(-0.62, 0.09, 0.78), cam: V(700, 520, 640), target: V(-1500, -40, -120), fov: 42,
    focus: V(-900, 0, 0), shadowExtent: 2600, look: { dofAmount: 0.15, rays: 0.3 },
  }),
  // looking up at a floating giant stroke-character with the sun right behind it
  stroke_sky: () => ({
    sun: V(-700, 560, 22).normalize(), cam: V(-1180, 7, 4), target: V(-1880, 350, 0), fov: 62, hideFar: true,
    extraHanzi: [['画', [-1900, 330, 0], 9, Math.PI / 2, 6, 0.0]],
    heroPos: { jade: [-1330, 0, -6], charlie: [-1360, 0, 14], ricky: [-1372, 0, -18], rotY: [0.35, 0.6, -0.2] },
    focus: V(-1880, 470, 0), shadowExtent: 1400, look: { dofAmount: 0.0, rays: 0.9, exposure: 0.55, fill: 0.1, atmos: 0.45 },
  }),
  // the colour flood ("functions 上色") mid-wave, seen from the turn's end camera
  paintwave: () => ({ turnEnd: true, sun: V(-0.99, 0.085, -0.087), paint: { c: V(60, 40, 20), r: 560, w: 150 }, focus: V(20, 55, 0), look: {} }),
};

export async function setup(ctx) {
  const name = ctx.shot || 'hero_low';
  const S = SHOTS[name](); if (!S) throw new Error('unknown shot ' + name);
  const W = await buildWorld({ ...ctx, heroPos: S.heroPos, extraHanzi: S.extraHanzi || [] });
  W.setSun(S.sun);
  if (S.hideFar) W.floating[0].visible = false;
  W.backdrop.visible = false; W.backdrop.userData.update(0, 0, 1);
  let camera, target, dist;
  if (S.turnEnd) {
    const rig = new TurnRig(ctx.width / ctx.height, { az3D: 60, el3D: 9, H3D: 280, target2D: V(10, 70, 0), target3D: V(-70, 50, 10) });
    ({ camera, target, dist } = rig.apply(1));
  } else {
    camera = new THREE.PerspectiveCamera(S.fov, ctx.width / ctx.height, 1, 120000);
    camera.position.copy(S.cam); camera.lookAt(S.target); camera.updateMatrixWorld(); target = S.target; dist = S.cam.distanceTo(S.target);
  }
  if (S.paint) { G.uPaintC.value.copy(S.paint.c); G.uPaintR.value = S.paint.r; G.uPaintW.value = S.paint.w; } else G.uPaintR.value = -1;
  function update(t) {
    W.hua.setAll(1);
    W.heroes.jade.setTime(t, 0); W.heroes.charlie.setTime(t, 0.25); W.heroes.ricky.setTime(t, 0.5);
    W.applyLook(t, { ...LOOK3D, ...S.look }, { camera, target, dist, focus: S.focus, shadowExtent: S.shadowExtent || 700, virtFov: 0, distOffset: 0 });
  }
  void smoothstep;
  return { scene: W.scene, camera, update, duration: 1, warmup: [0] };
}
