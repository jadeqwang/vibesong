// (v4b stage_3d) DROP 2 · the carved slabs again (targets assets/v4_stills/09 / 10, reversed for a front-on hero shot).
// Drop 2 is the aerial (act5/aerial.js: photoreal plates, the graphite redraw on FIXTURES!, colour back on FUNCTIONS!). On each accent
// the aerial cuts to this insert in the shared TALOS world (the coloured world after the flood), on mesa B's stage:
//   180.21 -> 181.125  FIXTURES!  the trio FRONT-ON (Charlie left, Jade centre, Ricky right) shouting it; behind them a graphite slab
//                      slams up out of the stage with FIXTURES carved into it (the biggest thing in frame), dust + chips
//   183.30 -> 183.87   FUNCTIONS! the same framing, the slab slams up again with FUNCTIONS: the grooves fill with rainbow light left
//                      to right on the accent; then the aerial's dive takes over
// Front-on = the drop-2 section's front-on medium of Jade (the critique: every 3D section has one). Pure function of t.
//
//   const ins = await makeSlabInsert(ctx); ins.window(t) -> null | 'fix' | 'fun'; ins.update(t); ins.render(t, target)
import * as THREE from 'three';
import * as T from '../../show/timing.js';
import { G } from '../../util.js';
import { getWorld, MESA_B } from './world/build.js';
import { make3D, V, aim, persp, smooth, clamp01, LOOK } from './common.js';
import { makeCarvedFace } from './carved_slab.js';
import { r5ShotClear } from '../../look.js';

export const INSERTS = { fix: [180.21, 181.125], fun: [183.30, 183.87] };
const top = MESA_B.top;
const SLAB = { c: V(1436, top, 432), w: 230, h: 160, d: 16 };            // standing across the stage front (in front of the arch), facing the seats (-x)
const TRIO = { charlie: V(1388, top, 400), jade: V(1376, top, 432), ricky: V(1388, top, 464) };
const RISE = 0.17;
// (M3) the slab's graphite stone; the SUN rakes across it from the upper left (k08b's per-frame LOOK override: azimuth turn 108 from the
// world's sun = front-left of the slab, elevation 26), so the trio + the slab share one key and real shadows; SLAB_KEY = the carved face's
// own extra key along the same direction (slab-local)
const SLAB_STONE = '#7a7882', SLAB_SUN = { k8SunAz: 108, k8SunElev: 26 }, SLAB_KEY = 0.6, SLAB_KEYDIR = new THREE.Vector3(-0.71, 0.44, 0.40);

export async function makeSlabInsert(ctx) {
  const W = await getWorld(ctx); const aspect = ctx.width / ctx.height;
  // the slab: a graphite block with the carved face toward -x (two slabs, one per word, at the same spot); a light graphite (the face is
  // in the sun's shade from the seats: the dark grooves must read against it)
  const slabMat = new THREE.MeshStandardMaterial({ color: '#a4a4ae', roughness: 0.5, metalness: 0.05 }); slabMat.userData.noPaint = true;
  const mk = async (word, kind) => {
    const g = new THREE.Group(); g.position.copy(SLAB.c); g.rotation.y = -Math.PI / 2;   // local +z (the carved face) -> world -x
    // (M3) the old box body is still allocated (the seeded Math.random stream: THREE uuids) but no longer used: carved_slab builds the
    // whole slab (chipped voxel-stone solid, SLAB.d thick, the word cut 5 u deep, its own raking key)
    const body = new THREE.Mesh(new THREE.BoxGeometry(SLAB.w, SLAB.h, SLAB.d - 3), slabMat); body.geometry.dispose();
    const face = await makeCarvedFace({ word, w: SLAB.w, h: SLAB.h, depth: 5, thick: SLAB.d, cell: 0.6, letterH: 0.26, yC: 0.66, kind, color: SLAB_STONE, chip: 4.5, seed: 1,
      key: SLAB_KEY, keyDir: SLAB_KEYDIR, legacy: { word, w: SLAB.w, h: SLAB.h, depth: 3, slab: 3, cell: 1.0, letterH: 0.26, yC: 0.66, kind, faceMat: slabMat } });
    g.add(face.group); g.visible = false; W.scene.add(g); return { g, face };
  };
  const [FX, FN] = await Promise.all([mk('FIXTURES', 'graphite'), mk('FUNCTIONS', 'rainbow')]);
  const P = W.props;
  const which = (t) => (t >= INSERTS.fix[0] && t < INSERTS.fix[1] ? 'fix' : t >= INSERTS.fun[0] && t < INSERTS.fun[1] ? 'fun' : null);
  const sc = await make3D(ctx, W, {
    subs: false,
    frame(t, fxs) {
      r5ShotClear?.();
      const k = which(t) || 'fix'; const t0 = INSERTS[k][0]; const s = t - t0;
      // the world as the flood left it: coloured everywhere
      G.uPaintC.value.set(1354, top, 454); G.uPaintR.value = 1e5; G.uPaintW.value = 60;
      // the slab slams up (overshoot), shakes the lens
      const S = k === 'fix' ? FX : FN; FX.g.visible = k === 'fix'; FN.g.visible = k === 'fun';
      const u = clamp01(s / RISE); const rise = 1 - Math.pow(1 - u, 3) + 0.05 * Math.sin(Math.PI * u);
      S.g.position.y = top - SLAB.h * (1 - rise); FN.face.setGlow(smooth(t0 + 0.05, t0 + 0.2, t), 1.9 + 0.9 * T.pulse(t, [t0 + 0.05], 0.25));   // (M3) gain down: the hues stay saturated (was 3.4-5.0: white cores)
      // the trio, front-on to the seats (facing -x): they shout it (Jade's rainbow pencil up on FUNCTIONS)
      const e8 = Math.floor(T.beatAt(t) * 2);
      const H = {
        charlie: { anim: 'chord', frame: e8 % 2, hat: true }, ricky: { anim: k === 'fun' ? 'victory' : 'chord', frame: (e8 + 1) % 2 },
        jade: { anim: k === 'fun' ? 'draw_rainbow' : 'sing', t: s, pencil: true, frame: null },
      };
      for (const n of ['jade', 'charlie', 'ricky']) { const g = W.heroes[n]; const p = TRIO[n]; g.visible = true;
        g.set({ ...H[n], facing: -1, x: p.x, y: p.y + 4 * T.pulse(t, [t0], 0.2) * (n === 'jade' ? 1 : 0.6) }); g.position.z = p.z; g.rotation.y = n === 'charlie' ? 0.24 : n === 'ricky' ? -0.24 : 0; }
      // dust + chips where it breaks out of the stage; rainbow sparks on FUNCTIONS
      P.burst.visible = true;
      P.burst.run(t, [{ t0, x: SLAB.c.x - 12, y: top, z: SLAB.c.z, n: 70, speed: 110, up: 50, g: 180, dur: 0.9, seed: 900 + (k === 'fun' ? 1 : 0), size: 2.2, colors: ['#e8dcc6', '#cfc0a4', '#9a9aa2', '#4a4a50'] }]);
      if (k === 'fun') { P.sparks.visible = true; P.sparks.run(t, [{ t0: t0 + 0.05, x: SLAB.c.x - 10, y: top + SLAB.h * 0.66, z: SLAB.c.z, n: 60, speed: 90, up: 40, g: 60, dur: 0.7, seed: 910, colors: ['#ff4d6d', '#ffb02e', '#ffe14d', '#4fd06a', '#2bb4e8', '#a35cff'] }]); }
      if (T.exactFrame(t, [t0])) { fxs.flash = 0.22; fxs.flashColor = k === 'fun' ? '#fff4fb' : '#ffffff'; }
      // camera: front-on from the seats, chest-to-head height, the slab filling the upper two thirds behind them; a punch on the slam
      const punch = T.pulse(t, [t0 + RISE * 0.8], 0.12); const push = smooth(t0, INSERTS[k][1], t);
      const pos = V(1196 + 14 * push, top + 74, 432 + Math.sin(t * 70) * 1.6 * punch), tgt = V(1450, top + 70, 432);
      const camera = aim(persp('slabIns', aspect), pos, tgt, 40 - 3 * punch);
      const focus = TRIO.jade.clone().setY(top + 50);
      return { camera, target: tgt, focus, shadowExtent: 520,
        // (M3) ao 0: after any drop_r5 frame in the same process the GTAO pass draws a dark horizontal band across the slab at the
        // lens height (a state leak into this shot, seen in full_v4 at 180.5; not reproducible without a drop-1 frame first)
        look: LOOK({ rays: 0.25, dofAmount: 0.06, sat: 1.18, exposure: 0.6, ao: 0, ...SLAB_SUN, r5: { dof: 0.12, tilt: 0, focus } }) };
    },
  });
  return {
    window: which, stage: sc.stage,
    update(t) { sc.update(t); },
    render(t, target) { FX.g.visible = which(t) === 'fix'; FN.g.visible = which(t) === 'fun';
      try { sc.render(t, target); } finally { FX.g.visible = FN.g.visible = false; P.burst.count = 0; P.sparks.count = 0; } },
  };
}
