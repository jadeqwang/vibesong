// ACT III · 77.76-86.385 · triplet roll + launch (VOID, 2D) -> 0.935 s silence with the 2° tilt -> THE TURN (80.815)
// -> fly-over of the plaster world along the causeway, Jade colouring the cypress avenue one tree per accent.
//
// One scene, one continuous camera: the 2D view IS the 3D world seen through a pixel-exact orthographic camera
// (flat albedo, 6 px blocks @1080p, palette, depth outline) in front of the VOID: a blueprint wall standing just
// behind the causeway. On the impact the camera whips ~60° and rises while orthographic dollies into perspective,
// pixels melt 6 -> 1, the sun floods in, and the VOID wall shatters into tumbling blueprint tiles: the level was
// one slice of an enormous sunlit world.
import * as THREE from 'three';
import * as T from '../../show/timing.js';
import { turnParams } from '../../turn.js';
import { Stage2D, ZUI } from '../../core/stage2d.js';
import { Subtitle, subtitleFor, HUD, HUD_H } from '../../core/ui.js';
import { getWorld } from './world/build.js';
import { make3D, CUE, V, aim, persp, pathAt, runFrame, arc, smooth, clamp01, LOOK, faceCam, CRISP } from './common.js';

const DEG = Math.PI / 180;
const IMP = () => T.snap(CUE.impact);   // the impact frame (80.815 measured)
const lerp = (a, b, u) => a + (b - a) * u;

// ---------------------------------------------------------------- choreography (world units, x right, y up)
// Team A's launch set (HANDOFF_77.md) mapped to world: x = gx - 200, y = gy - 60. Party at 77.757: Ricky -126,
// Charlie -96, Jade -64 (drum, hair down). 出 at -20, 发 at 62 (96 tall), lamp at -42 (GREEN on 77.757).
const RAMP = { x0: -32, step: 8, rise: 6 };                // block i: centre x = x0 + i*step, top = (i+1)*rise
const JADE_DRUM_X = -64, TRAMP_X = -96, RICKY_X = -140;
const APEX = { jade: [128, 84], charlie: [96, 80], ricky: [64, 74] };
const LAND = { jade: 210, charlie: 184, ricky: 160 };
const LAND_T = 81.47, RUN_V = 82;
const rollIdx = (t) => T.lastIdx(t, CUE.roll);
const relaunch = 79.46;   // last roll hits -> leap; apex at the start of the silence

/** ortho/perspective rig for the turn. u = 0 is pixel-exact 2D (with yaw/pitch/roll for the silent tilt). */
function rig(t, aspect, H2D, pix2D) {
  const tilt = smooth(CUE.silence[0], CUE.silence[1], t);                // the silent 2° creep (eased in)
  const yaw0 = -4 * tilt, pitch0 = 2 * tilt, roll0 = 2 * tilt;
  const u = clamp01((t - IMP()) / (82.31 - IMP()));
  const T2 = V(0, 46, 0), T3 = V(250, 118, -40);
  if (u <= 0) {
    const cam = rig.ortho ||= new THREE.OrthographicCamera(-1, 1, 1, -1, 1, 3000);
    const hh = H2D / 2, hw = hh * aspect;
    const tg = T2.clone();
    if (tilt === 0) { tg.x = Math.round(tg.x - hw) + hw; tg.y = Math.round(tg.y - hh) + hh; }
    cam.left = -hw; cam.right = hw; cam.top = hh; cam.bottom = -hh;
    const dir = V(Math.sin(yaw0 * DEG) * Math.cos(pitch0 * DEG), Math.sin(pitch0 * DEG), Math.cos(yaw0 * DEG) * Math.cos(pitch0 * DEG));
    cam.position.copy(tg).addScaledVector(dir, 1000); cam.up.set(0, 1, 0); cam.lookAt(tg); cam.rotateZ(roll0 * DEG);
    cam.near = 500; cam.far = 1100; cam.updateProjectionMatrix(); cam.updateMatrixWorld();
    return { camera: cam, u: 0, p: turnParams(0), target: tg, pix: pix2D };
  }
  const p = turnParams(u);
  const eAz = 1 - Math.pow(1 - u, 3.2), eEl = smooth(0.05, 0.9, u), eF = 1 - Math.pow(1 - u, 2.4), eT = smooth(0.0, 1.0, u);
  const az = lerp(yaw0, -64, eAz) * DEG, el = lerp(pitch0, 6, eEl) * DEG;
  const roll = (roll0 * (1 - smooth(0, 0.45, u)) - 3.5 * Math.sin(Math.PI * Math.min(1, u * 1.3))) * DEG;
  const fov = 0.25 + (50 - 0.25) * Math.pow(eF, 1.5);
  const H = lerp(H2D, 330, eF);
  const tg = T2.clone().lerp(T3, eT);
  const cam = persp('turn', aspect);
  const dist = H / (2 * Math.tan(fov * DEG / 2));
  const dir = V(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el));
  cam.position.copy(tg).addScaledVector(dir, dist); cam.up.set(0, 1, 0); cam.lookAt(tg); cam.rotateZ(roll);
  cam.fov = fov; cam.aspect = aspect; cam.near = Math.max(1, dist - 900); cam.far = dist + 150 * Math.pow(90000 / 150, smooth(0.0, 0.6, u));
  cam.updateProjectionMatrix(); cam.updateMatrixWorld();
  return { camera: cam, u, p, target: tg, pix: Math.max(1, lerp(pix2D, 1, smooth(0.04, 0.55, u))) };
}

/** hero state at t: { x, y, z, anim, frame|t, pencil, rotY } */
function heroes(t) {
  const out = {};
  const frozen = t >= CUE.silence[0] && t < IMP();
  const tt = frozen ? CUE.silence[0] : t;
  const runX = (who) => LAND[who] + RUN_V * Math.max(0, t - LAND_T);
  // in the air: relaunch -> apex (silence start) -> (frozen) -> land
  const air = (who, x0, y0) => {
    const [ax, ay] = APEX[who];
    if (tt < CUE.silence[0]) { const u = clamp01((tt - relaunch) / (CUE.silence[0] - relaunch)); return { x: lerp(x0, ax, u), y: lerp(y0, ay, 1 - (1 - u) * (1 - u)), rising: true }; }
    const u = clamp01((t - IMP()) / (LAND_T - IMP())); return { x: lerp(ax, LAND[who], u), y: ay * (1 - u * u), rising: false };
  };
  const twist = -58 * smooth(IMP(), 81.8, t);
  // JADE: drums until the last roll hit, dashes up the ramp, leaps
  if (tt < 79.27) out.jade = { x: JADE_DRUM_X, y: 0, anim: 'drum', frame: Math.max(0, rollIdx(tt)) % 2, pencil: true };
  else if (tt < relaunch) { const u = (tt - 79.27) / (relaunch - 79.27); const x = lerp(JADE_DRUM_X + 10, RAMP.x0 + 11 * RAMP.step, u); const i = Math.floor((x - RAMP.x0 + RAMP.step / 2) / RAMP.step); out.jade = { x, y: Math.max(0, Math.min(12, i + 1)) * RAMP.rise, anim: 'run', frame: Math.floor(u * 4) % 2, pencil: true }; }
  else if (t < LAND_T) { const a = air('jade', RAMP.x0 + 11 * RAMP.step, 12 * RAMP.rise); out.jade = { x: a.x, y: a.y, anim: 'run', frame: 1, pencil: true }; }
  else out.jade = { x: runX('jade'), y: 0, anim: 'run', frame: runFrame(t, 2, 2), pencil: true };
  // CHARLIE bounces on his flipped hat, higher on every other triplet; RICKY holds the rising note, then both leap
  if (tt < 78.17) out.charlie = { x: TRAMP_X, y: 0, anim: tt < 77.95 ? 'idle' : 'trampoline', t: tt - 77.757 };
  else if (tt < relaunch) {
    const i = rollIdx(tt); let k = i; if (k % 2 !== 0) k -= 1; k = Math.max(4, k);
    const a = CUE.roll[k] ?? 78.17; const u = clamp01((tt - a) / 0.276);
    const h = 8 + 5 * (k - 4);
    out.charlie = { x: TRAMP_X, y: 4 + h * 4 * u * (1 - u), anim: 'jump', frame: u < 0.5 ? 0 : 1 };
  } else if (t < LAND_T) { const a = air('charlie', TRAMP_X, 4); out.charlie = { x: a.x, y: a.y, anim: 'jump', frame: a.rising ? 0 : 1 }; }
  else out.charlie = { x: runX('charlie'), y: 0, anim: 'run', frame: runFrame(t + 0.1, 6, 3) };
  const rx = lerp(-126, RICKY_X, smooth(77.757, 78.1, tt));
  if (tt < relaunch) out.ricky = { x: rx, y: 0, anim: tt < 77.9 ? 'idle' : 'sustain', t: tt };
  else if (t < LAND_T) { const a = air('ricky', RICKY_X, 0); out.ricky = { x: a.x, y: a.y, anim: 'jump', frame: a.rising ? 0 : 1 }; }
  else out.ricky = { x: runX('ricky'), y: 0, anim: 'run', frame: runFrame(t + 0.2, 6, 3) };
  out.charlie.z = -7; out.ricky.z = 7; out.jade.z = 0;
  for (const h of Object.values(out)) h.rotY = twist * DEG;
  return out;
}

// ---------------------------------------------------------------- 2D cuts every 8th through the roll (pixel camera)
const CUTS = [
  [77.757, { c: [-8, 30], z: 1 }],     // = Team A's last frame (Stage2D centre (192, 90), zoom 1)
  [78.17, { c: [-44, 26], z: 2 }],     // Jade drumming, blocks popping
  [78.377, { c: [-112, 34], z: 2 }],   // Charlie's trampoline bounce + Ricky's held note
  [78.583, { c: [8, 32], z: 2 }],      // the ramp growing
  [78.79, { c: [-8, 30], z: 1 }],
  [78.996, { c: [-40, 34], z: 2 }],
  [79.202, { c: [-104, 46], z: 2 }],
  [79.409, { c: [0, 46], z: 1 }],      // = the turn's u = 0 frame
];

import { TREE_HITS, BOOMERANG } from './paintlog.js';

export async function setup(ctx) {
  const W = await getWorld(ctx);
  const { width, height } = ctx; const aspect = width / height; const pix2D = height / 180;
  const P = W.props;
  P.voidWall.userData.setBreak(APEX.jade[0], APEX.jade[1], 1500);
  // pixel subtitle for the 2D part (bible: pixel font in the 2D looks)
  const st = new Stage2D(ctx); const sub2 = st.addUI(new Subtitle({ y: HUD_H + 3 }), ZUI.SUBS);
  const hud = st.addUI(new HUD(ctx.lib), ZUI.HUD);
  // fly-over camera keys (anchor = Jade); the first key is filled with the turn's end pose
  const endPose = (() => { const r = rig(82.31, aspect, 180, pix2D); return { pos: r.camera.position.clone(), tgt: r.target.clone() }; })();
  const A0 = LAND.jade + RUN_V * (82.31 - LAND_T);
  const camKeys = [
    [82.31, endPose.pos.clone().sub(V(A0, 0, 0))],
    [83.6, V(-95, 52, 150)],
    [85.0, V(-70, 100, 215)],
    [86.4, V(-30, 72, 185)],
  ];
  const tgtKeys = [[82.31, endPose.tgt.clone().sub(V(A0, 0, 0))], [83.6, V(25, 26, -30)], [85.0, V(55, 18, -50)], [86.4, V(45, 22, -40)]];

  const sc = await make3D(ctx, W, {
    inWorldSubs: [18],
    frame(t, fx) {
      const r = rig(t, aspect, 180, pix2D);
      let camera = r.camera, target = r.target, look, pix = r.pix, shadowExtent = 420;
      const P2 = r.p;
      // ---- 2D section: cut every 8th (pixel camera with zoom)
      if (t < CUE.silence[0]) {
        const cut = CUTS.reduce((a, c) => (t >= T.snap(c[0]) - 1e-6 ? c : a), CUTS[0])[1];
        const cam = camera; const hh = 90 / cut.z, hw = hh * aspect;
        const cx = Math.round(cut.c[0] - hw) + hw, cy = Math.round(cut.c[1] - hh) + hh;
        cam.left = -hw; cam.right = hw; cam.top = hh; cam.bottom = -hh; cam.position.set(cx, cy, 1000); cam.up.set(0, 1, 0); cam.lookAt(cx, cy, 0);
        cam.updateProjectionMatrix(); cam.updateMatrixWorld(); target = V(cx, cy, 0); pix = pix2D * cut.z;
      }
      look = { flat: P2.flat, light: P2.light, shadow: P2.shadow, tone: P2.tone, palette: P2.palette, pix, outline: P2.outline, bloom: P2.bloom, dof: P2.dof * 0.6, grade: P2.grade,
        rays: 0.3 * smooth(0.45, 1, r.u), ao: smooth(0.3, 0.8, r.u), dofAmount: 0.2, ...CRISP, atmos: CRISP.atmos * smooth(0.12, 0.7, r.u), hazeStart: CRISP.hazeStart * r.u, contrast: 1 + (CRISP.contrast - 1) * r.u, accent: 1 + (CRISP.accent - 1) * r.u };
      let flyPos = null;
      let virtFov = r.u > 0 ? 1 - smooth(0.3, 0.95, r.u) : 1;
      // ---- after the turn: fly-over along the causeway
      if (t >= 82.31) {
        const A = LAND.jade + RUN_V * (t - LAND_T);
        const pos = pathAt(t, camKeys).add(V(A, 0, 0)), tgt = pathAt(t, tgtKeys).add(V(A, 0, 0));
        camera = aim(persp('fly', aspect), pos, tgt, lerp(42, 50, smooth(83.6, 85.0, t))); target = tgt;
        flyPos = pos; look = LOOK({ rays: 0.35, dofAmount: 0.15 }); virtFov = 0; shadowExtent = 700;
      }

      // ---- world state
      const ut = t - IMP();
      P.gate2.visible = true; P.lamp.visible = true;
      // Team A's wireframe gizmo cubes: drift + spin in the VOID, tumble away with the shattering wall
      P.gizmos.forEach((g, i) => { const [x, y, z] = g.userData.home; const s = Math.max(0, t - IMP());
        g.visible = s < 2.0; g.position.set(x + 40 * s, y + Math.round(3 * Math.sin(t * 1.1 + i)) + 60 * s - 200 * s * s, z - 160 * s);
        g.rotation.set(0.5 + 3 * s, 0.6 + t * 0.4 + i, 4 * s); });
      P.voidWall.visible = ut < 2.4; P.voidWall.material.uniforms.uT.value = ut;
      // drum blocks: block i pops on roll hit i
      const ri = rollIdx(t < CUE.silence[0] ? t : CUE.silence[0]);
      P.blocks.forEach((b, i) => {
        if (i > ri) return; b.visible = true; const s = T.since(t, CUE.roll[i]); const pop = s < 0.09 ? 0.4 + 0.6 * (s / 0.09) * 1.2 : 1;
        const top = (i + 1) * RAMP.rise * Math.min(1, pop); // a plaster column growing up to its step
        b.position.set(RAMP.x0 + i * RAMP.step, top / 2, -19); b.scale.set(Math.min(1.15, pop), top / 5, 1);
      });
      // trampoline (Charlie's hat, flipped)
      if (t >= 78.17) {
        P.tramp.visible = true; const s = T.since(t, CUE.roll[rollIdx(Math.min(t, relaunch))] ?? 78.17);
        W.put(P.tramp, { x: TRAMP_X, y: 0, z: 0, anim: 'rest', frame: t < CUE.silence[0] ? (s < 0.05 ? 1 : s < 0.11 ? 2 : 0) : 0 });
      }
      // heroes
      const H = heroes(t);
      for (const [n, s] of Object.entries(H)) W.put(W.heroes[n], s);
      if (flyPos) faceCam(Object.values(W.heroes), flyPos, 0.6 * smooth(82.31, 83.0, t));
      // the four chant characters slam in the VOID sky (stroke order, fast), then hang in the 3D sky
      const CH = [[-132, 108], [-80, 108], [-28, 108], [24, 108]];   // centres; big and bold over the left of the frame
      P.chant.forEach((g, i) => {
        const te = CUE.chant[i]; if (t < T.snap(te) - 1e-6) return; g.visible = true;
        const s = t - te; const n = g.hz.vox.strokeCount;
        for (let k = 0; k < n; k++) g.hz.setProgress(k, clamp01((s - k * 0.025) / 0.05));
        const punch = s < 0.12 ? 1.25 - 0.25 * (s / 0.12) : 1;
        g.scale.setScalar(punch); g.position.set(CH[i][0] - (g.box.w * punch) / 2, CH[i][1] - (g.box.h * punch) / 2, 2);
      });
      // the pencil flick: a short spark streak from Jade to the tree tip
      const fl = TREE_HITS.find(([te]) => t >= te - 0.02 && t < te + 0.16);
      if (fl) {
        const [te, k] = fl; const m = W.avenue[k]; const jx = H.jade.x + 8;
        const a = V(jx, H.jade.y + 30, 2), b = V(m.position.x, m.userData.base + m.userData.h * 0.95, m.position.z);
        P.beam2.visible = true; P.beam2.set([a, b], clamp01((t - te + 0.02) / 0.1), { width: 0.6 });
      }
      P.sparks.visible = true; P.sparks.run(t, [...TREE_HITS.map(([te, k], i) => { const m = W.avenue[k]; return { t0: te + 0.08, x: m.position.x, y: m.userData.base + m.userData.h, z: m.position.z, n: 14, speed: 50, up: 20, g: 60, dur: 0.6, seed: 10 + i, colors: ['#ff4d6d', '#ffe14d', '#4fd06a', '#2bb4e8', '#a35cff'] }; }),
        { t0: BOOMERANG.hit, x: BOOMERANG.col.x, y: 70, z: BOOMERANG.col.z + 12, n: 18, speed: 60, up: 30, g: 80, dur: 0.6, seed: 77, colors: ['#ffb02e', '#ff7a3d', '#ffe14d'] }]);
      // Charlie's hat boomerang: out to a temple column (it takes colour, see paintlog) and back
      if (t >= BOOMERANG.throw && t < BOOMERANG.back) {
        const c = W.heroes.charlie.position; const hitP = V(BOOMERANG.col.x - 4, 70, BOOMERANG.col.z + 12);
        const out = t < BOOMERANG.hit; const u = out ? (t - BOOMERANG.throw) / (BOOMERANG.hit - BOOMERANG.throw) : (t - BOOMERANG.hit) / (BOOMERANG.back - BOOMERANG.hit);
        const a = out ? V(c.x + 8, 30, c.z) : hitP, b = out ? hitP : V(c.x + 8, 30, c.z); const mid = a.clone().lerp(b, 0.5).add(V(0, 26, 18));
        const p = a.clone().multiplyScalar((1 - u) * (1 - u)).addScaledVector(mid, 2 * u * (1 - u)).addScaledVector(b, u * u);
        W.put(P.boomer, { x: p.x, y: p.y, z: p.z, anim: 'spin', t: t * 2 });
      }
      if (t >= BOOMERANG.throw - 0.1 && t < BOOMERANG.throw + 0.25) H.charlie && W.put(W.heroes.charlie, { ...H.charlie, anim: 'throw', t: t - BOOMERANG.throw + 0.1, frame: null });
      // landing dust + impact
      P.burst.visible = true; P.burst.run(t, [
        ...['jade', 'charlie', 'ricky'].map((n, i) => ({ t0: LAND_T, x: LAND[n], y: 0, z: H[n].z, n: 12, speed: 40, up: 18, g: 120, dur: 0.6, seed: 3 + i, size: 1.2 })),
        ...CUE.roll.map((te, i) => ({ t0: te, x: RAMP.x0 + i * RAMP.step, y: (i + 1) * RAMP.rise, z: 0, n: 5, speed: 30, up: 30, g: 200, dur: 0.3, seed: 40 + i, size: 0.7 })),
      ]);
      // flash on the impact frame
      if (T.exactFrame(t, [IMP()])) fx.flash = 0.35;

      // 2D pixel subtitle before the turn, smooth after
      // HUD (as in Act II) drops off the bottom on the impact; pixel subtitle before the turn, smooth after
      const drop = smooth(IMP(), IMP() + 0.28, t);
      const chantOn = t >= 79.36 && t < 81.0;
      hud.set({ singing: { jade: chantOn, charlie: chantOn, ricky: chantOn } }); hud.position.y = -Math.round(60 * drop * drop);
      const c18 = subtitleFor(t, 18); sub2.set(t < IMP() && c18 ? { top: null, bot: c18.bot } : null);
      const ui2d = drop < 1 ? { scene: st.ui, cam: st.uiCam } : null;
      return { camera, target, focus: V(H.jade.x, 20, 0), look, shadowExtent, virtFov, distOffset: 0, ui2d, noSubs: t < IMP() };

    },
  });
  return sc;
}
