// ACT III · 86.385-94.204 · DROP 1 in 3D: "FIXTURES! / FUNCTIONS!"  combo PAINT -> SHIP -> RUN (pre-battle pass)
//   86.385           seam: Ricky's 4th chord clicks switch 4, the last causeway chunk rises (act3.turn's turnCarry)
//   86.63-87.13      FIXTURES!  Jade slashes the air with the graphite (pink-cap) pencil, five strokes; each stroke runs
//                    along the ground and SLAMS UP as a monumental graphite slab (she makes them). Big one on the 86.87 accent.
//   87.26-87.83      stop: freeze. The slabs stand scattered at random angles (a draft, not a bridge).
//   88.48-89.88      whistle answer: Charlie's boomerang hat tags the slabs IN ORDER with numbered waypoint pings (SHIP =
//                    the plan; tags 2 and 5 on the accents 88.86 / 89.68). Ricky aims, tracking the hat.
//   89.95            FUNCTIONS!  Ricky's chord beam connects the slabs in Charlie's order (Talos connectors); freeze 90.375-91.11
//   91.11            re-hit: the slabs swing out over the sea and lie down crosswise as a bridge to mesa A, in Charlie's order
//   91.72-92.5       the party crosses; Jade flicks each plank with the rainbow (blue-cap) pencil as she reaches it: colour stays
//   92.56            hey hey hey: the three co-op gestures on mesa A
import * as THREE from 'three';
import * as T from '../../show/timing.js';
import { getWorld, MESA_A } from './world/build.js';
import { make3D, CUE, V, aim, persp, runFrame, smooth, clamp01, LOOK, faceCam, pathAt } from './common.js';
import { turnCarry } from './turn.js';   // act3.turn team: the 86.385 click (Ricky's 4th chord, switch 4, last causeway chunk)
import { ensurePB, setArc, heroJoints, setJ, heroH, putHero, SLAB_DIMS } from './prebattle_props.js';

const C0 = V(630, 0, 0);
// slab standing poses [x, z, rotY, tiltX, tiltZ]: scattered among the cypresses (avenue x 558/632/706/780 at z -47) and on the road
export const STAND = [[540, -12, 1.1, 0.1, 0.16], [595, -60, 0.25, -0.12, -0.15], [712, -2, -0.35, 0.07, -0.11], [745, -56, -0.5, -0.1, 0.19], [669, -64, 0.1, 0.13, -0.12]];
export const SLASH = [[0, 86.63], [3, 86.75], [2, 86.87], [1, 87.0], [4, 87.13]];   // Jade's creation order: [slab, time]; the big one on the accent
export const ORDER = [0, 1, 4, 2, 3];                                               // Charlie's order (left to right = the bridge order)
export const TAGS = [88.62, CUE.pairs[4], 89.12, 89.4, CUE.pairs[5]];                // hat tags; 2 and 5 on the accent pair
const THROW = 88.48, CATCH = 89.88;
const SWING0 = CUE.funStop[1], SWING_DT = 0.09, SWING_DUR = 0.42;
const CROSS0 = 91.72, CROSS_DUR = 0.75;
const BRIDGE_X = 700, BRIDGE_Z0 = 24;
const RUN_V = 82, LAND_T = 81.47, LAND_J = 210;
/** scene clock: the two stops freeze everything (camera included) */
export const tau = (t) => (t >= CUE.fixStop[0] && t < CUE.fixStop[1] ? CUE.fixStop[0] : t >= CUE.funStop[0] && t < CUE.funStop[1] ? CUE.funStop[0] : t);
export const slashT = (i) => SLASH.find((s) => s[0] === i)[1];

const ground = (W, x, z) => (Math.abs(z) <= 24 ? 0 : W.groundY(x, z) - 1);
/** plank k (Charlie's order) lying crosswise on the bridge: origin at the plank's -x end, face (+z local) up */
const _basis = new THREE.Matrix4().makeBasis(V(0, 0, 1), V(1, 0, 0), V(0, 1, 0));
const PLANK_Q = new THREE.Quaternion().setFromRotationMatrix(_basis);
export function plankPose(k) {
  const i = ORDER[k]; const [w, h, d] = SLAB_DIMS[i];
  let z = BRIDGE_Z0; for (let j = 0; j < k; j++) z += SLAB_DIMS[ORDER[j]][0];
  const zc = z + w / 2, yTop = 1 + 2.2 * k + (k % 2 ? 0.6 : 0);
  const jit = new THREE.Quaternion().setFromAxisAngle(V(0, 1, 0), [0.03, -0.04, 0.02, -0.03, 0.04][k]);
  return { pos: V(BRIDGE_X - h / 2 + [3, -4, 2, -3, 1][k], yTop - d / 2, zc), quat: jit.multiply(PLANK_Q.clone()), zc, w, yTop };
}
/** Jade's crossing z at t (shared with the colour flicks) */
const crossU = (t, delay = 0) => clamp01((t - CROSS0 - delay) / CROSS_DUR);
export const flickT = (k) => { const p = plankPose(k); return CROSS0 + CROSS_DUR * clamp01((p.zc - p.w / 2 + 6) / 300); };

/** slab state at song time t (pure); used by drop + verse2 (the bridge stays there, coloured) */
export function slabsAt(PB, W, t) {
  const tc = tau(t);
  PB.slabs.forEach((s, i) => {
    const [x, z, ry, tx, tz] = STAND[i]; const b = ground(W, x, z); const { h } = s.userData;
    const t0 = slashT(i) + 0.06; if (tc < t0) return;
    s.visible = true;
    const k = clamp01((tc - t0) / 0.12); const e = 1 - Math.pow(1 - k, 3); const over = k < 1 ? 0 : 0;
    const qs = new THREE.Quaternion().setFromEuler(new THREE.Euler(tx * e, ry, tz * e, 'YXZ'));
    const ps = V(x, b - h * (1 - e) + over, z);
    const kk = ORDER.indexOf(i); const ta = SWING0 + kk * SWING_DT; const u = smooth(0, 1, clamp01((tc - ta) / SWING_DUR));
    if (u <= 0) { s.position.copy(ps); s.quaternion.copy(qs); return; }
    const pp = plankPose(kk);
    s.position.lerpVectors(ps, pp.pos, u); s.position.y += 85 * Math.sin(Math.PI * u);
    s.quaternion.slerpQuaternions(qs, pp.quat, u);
    // colour: Jade's flick as she reaches the plank (hatching grows out from her foot) -> stays
    const tf = flickT(kk); const lp = PB.slabMats[i].userData.lp;
    if (t >= tf) { const c = clamp01((t - tf) / 0.35); lp.edge(14).addSphere(BRIDGE_X, pp.yTop, pp.zc - pp.w / 2, 10 + 120 * (1 - Math.pow(1 - c, 2))); }
  });
}

function partyAt(t) {
  // run in from the fly-over (identical to the turn's hand-off at 86.385), then each decelerates to a stop
  const P = {};
  const base = [['jade', 0, 0, 86.66], ['charlie', -28, -7, 86.85], ['ricky', -52, 7, 86.95]];
  for (const [n, dx, z, stop] of base) {
    const x0 = LAND_J + dx + RUN_V * (86.385 - LAND_T); const dur = stop - 86.385; const s = clamp01((Math.min(t, stop) - 86.385) / dur) * dur;
    const x = t < 86.385 ? LAND_J + dx + RUN_V * (t - LAND_T) : x0 + RUN_V * (s - s * s / (2 * dur));
    const zs = z + (n === 'charlie' ? -13 : n === 'ricky' ? 11 : 0) * smooth(86.45, 86.85, t);   // the three fan out (native figures are wide)
    P[n] = t < stop - 0.06 ? { x, y: 0, z: zs, anim: 'run', frame: n === 'jade' ? runFrame(t, 2, 2) : runFrame(t, 6, 3) } : { x, y: 0, z: zs, anim: 'idle', t: t - stop };
  }
  P.jade.pencil = true;
  return P;
}

export async function setup(ctx) {
  const W = await getWorld(ctx); const P = W.props; const aspect = ctx.width / ctx.height;
  const carry = await turnCarry(ctx, W);
  const PB = await ensurePB(W);
  const H = { jade: heroH(W, 'jade'), charlie: heroH(W, 'charlie'), ricky: heroH(W, 'ricky') };
  const hs = H.jade / 52;                      // 1 = carve figures, ~1.3 = native
  const slabTop = (i, out = V(0, 0, 0)) => { const s = PB.slabs[i]; s.updateMatrixWorld(true); return s.localToWorld(out.set(0, s.userData.h + 2, 0)); };
  const yawTo = (from, to) => Math.atan2(-(to.z - from.z), to.x - from.x);
  /** the boomerang cap's flight (pure in t): Charlie's hand -> the slab tops in his order -> his hand */
  let chHandRef = V(612, 50, -7);
  const capAt = (tt) => { const keys = [[THROW + 0.08, chHandRef.clone()]]; ORDER.forEach((i, k) => keys.push([TAGS[k], slabTop(i).add(V(0, 12 * hs, 0))])); keys.push([CATCH, chHandRef.clone()]); return pathAt(clamp01((tt - THROW) / 2) * 2 + THROW, keys); };

  const scene = await make3D(ctx, W, {
    frame(t, fx) {
      const tc = tau(t);
      PB.begin();
      const party = partyAt(tc);
      carry.update(t, party);
      slabsAt(PB, W, t);

      // ---------------------------------------------------------- FIXTURES!: Jade's five slashes
      const jp = V(party.jade.x, 0, party.jade.z);
      let cur = -1; SLASH.forEach(([, ts], k) => { if (tc >= ts - 0.08) cur = k; });
      if (cur >= 0 && tc < 88.3) {
        const [i] = SLASH[cur]; const st = STAND[i]; const tgt = V(st[0], 0, st[1]);
        Object.assign(party.jade, { anim: 'draw_graphite', t: 0.4, frame: null, rotY: yawTo(jp, tgt) });
      }
      // ground streaks: the stroke runs from Jade's feet to where the slab erupts (a drawn line: it stays until the swing)
      SLASH.forEach(([i, ts], k) => {
        const st = STAND[i]; const a = V(jp.x + 6 * Math.cos(yawTo(jp, V(st[0], 0, st[1]))), 0.6, jp.z), b = V(st[0], ground(W, st[0], st[1]) + 0.6, st[1]);
        const u = clamp01((tc - ts - 0.02) / 0.05); const kk = ORDER.indexOf(i);
        if (u <= 0 || tc >= SWING0 + kk * SWING_DT + 0.1) return;
        const m = PB.streaks[k]; m.visible = true; const d = b.clone().sub(a); const L = d.length();
        m.position.copy(a); m.rotation.set(0, Math.atan2(-d.z, d.x), Math.atan2(d.y, Math.hypot(d.x, d.z)), 'YZX'); m.scale.set(L * u, 1, 1);
      });

      // ---------------------------------------------------------- Charlie's boomerang hat tags the slabs in order
      const hatOut = tc >= THROW + 0.08 && tc < CATCH;
      if (tc >= THROW - 0.1 && tc < THROW + 0.22) Object.assign(party.charlie, { anim: 'throw', t: tc - THROW + 0.1, frame: null });
      if (tc >= CATCH - 0.04 && tc < CATCH + 0.25) Object.assign(party.charlie, { anim: 'throw', frame: 0 });
      if (tc >= THROW - 0.1 && tc < CATCH + 0.3) party.charlie.rotY = yawTo(V(party.charlie.x, 0, party.charlie.z), V(650, 0, -40)) * 0.6;
      if (hatOut) party.charlie.hat = false;

      // ---------------------------------------------------------- Ricky: aims (88.48), the big chord on FUNCTIONS!
      if (tc >= CUE.answer[0] - 0.1 && tc < 91.75) {
        const blast = tc >= CUE.functions && tc < CUE.functions + 0.2;
        Object.assign(party.ricky, { anim: 'chord', frame: blast ? 1 : 0 });
      }

      // ---------------------------------------------------------- the crossing (91.72 -> 92.5)
      const cross = (n, delay) => {
        const a = CROSS0 + delay; if (t < a) return;
        const u = crossU(t, delay); const s = party[n];
        const lane = n === 'charlie' ? -18 : n === 'ricky' ? 18 : 0;
        s.x = BRIDGE_X + lane; s.z = u * 300; s.y = u < 0.08 ? 0 : 1 + 9 * Math.min(1, (u - 0.08) / 0.8);
        s.anim = 'run'; s.frame = n === 'jade' ? runFrame(t, 2, 2) : runFrame(t, 6, 3); s.rotY = -Math.PI / 2; s.t = t;
        if (u >= 1) { s.anim = 'idle'; s.t = t - a - CROSS_DUR; s.rotY = 0; }
      };
      // before the crossing the three line up at the bridge foot (during the swing)
      if (t >= SWING0 && t < CROSS0 + 0.2) {
        const k = smooth(SWING0 + 0.05, CROSS0, t);
        for (const [n, lane] of [['jade', 0], ['charlie', -18], ['ricky', 18]]) {
          const s = party[n]; s.x += (BRIDGE_X + lane - s.x) * k; s.z += (-6 - s.z) * k; if (k > 0 && k < 1) { s.anim = 'run'; s.frame = runFrame(t, n === 'jade' ? 2 : 6, 3); }
        }
      }
      cross('jade', 0); cross('charlie', 0.08); cross('ricky', 0.16);
      // Jade's flick on each plank (blue-cap rainbow pencil): a quick draw_rainbow pose + sparks from the pencil tip
      let flick = -1; for (let k = 0; k < 5; k++) if (t >= flickT(k) - 0.03 && t < flickT(k) + 0.1) flick = k;
      if (flick >= 0) Object.assign(party.jade, { anim: 'draw_rainbow', t: 0.3, frame: null });

      // ---------------------------------------------------------- hey hey hey on mesa A
      if (t >= 92.5) {
        const base = { jade: [700, 342], charlie: [664, 354], ricky: [736, 354] };
        for (const [n, [x, z]] of Object.entries(base)) Object.assign(party[n], { x, z, y: MESA_A.top, anim: 'idle', t: t - 92.5, rotY: 0 });
        const pairs = [['jade', 'charlie'], ['charlie', 'ricky'], ['jade', 'charlie', 'ricky']];
        CUE.hey.forEach((te, i) => {
          const s = t - te; if (s < -0.12 || s > 0.3) return;
          const u = clamp01((s + 0.12) / 0.42);
          for (const n of pairs[i]) { party[n].anim = 'jump'; party[n].frame = u < 0.5 ? 0 : 1; party[n].y = MESA_A.top + 16 * hs * Math.sin(Math.PI * u); }
        });
        const hi = CUE.hey.findIndex((te) => t >= te - 0.02 && t < te + 0.16);
        if (hi >= 0) {
          const ps = pairs[hi].map((n) => party[n]); const cx = ps.reduce((a, p) => a + p.x, 0) / ps.length;
          P.star.visible = true; const s = t - CUE.hey[hi]; P.star.scale.setScalar(1 + 6 * s); P.star.position.set(cx, MESA_A.top + 60 * hs + 16 * Math.sin(Math.PI * clamp01((s + 0.12) / 0.42)), 352);
          P.star.rotation.set(s * 6, s * 9, 0);
        }
      }

      // ---------------------------------------------------------- place the heroes (+ joint overrides)
      for (const [n, s] of Object.entries(party)) putHero(W, W.heroes[n], { ...s, pencil: n === 'jade' });
      const J = heroJoints(W.heroes.jade);
      if (cur >= 0 && tc < 88.3 && J) {
        // the slash: right arm from overhead down through the stroke, body twisting into it
        // phases over the 0.12 s per slash: wind-up (arm overhead, ~2 frames), strike (~2 frames), follow-through hold
        const ts = SLASH[cur][1]; const p = (tc - ts + 0.08) / 0.12; const sm = (x) => { const u = clamp01(x); return u * u * (3 - 2 * u); };
        const a = p < 0.4 ? -25 + 193 * sm(p / 0.4) : p < 0.65 ? 168 - 193 * sm((p - 0.4) / 0.25) : -25;
        const e = p < 0.4 ? 0 : p < 0.65 ? sm((p - 0.4) / 0.25) : 1; const side = cur % 2 ? -1 : 1;
        setJ(J, 'shoulderR', a, 0, -12 * side); setJ(J, 'elbowR', 24 - 18 * e); setJ(J, 'body', 8 - 26 * e, 0, 10 * side * (2 * e - 1)); setJ(J, 'shoulderL', -40 + 30 * e, 0, 28);
        setJ(J, 'hipR', 30 * e + 8, 0, 0); setJ(J, 'kneeR', -30 * e); setJ(J, 'hipL', -18 * e); setJ(J, 'kneeL', -10);
      }
      if (flick >= 0 && J) { const u = clamp01((t - flickT(flick) + 0.03) / 0.1); setJ(J, 'shoulderR', 120 - 120 * u, 0, -10); setJ(J, 'elbowR', 10); }

      // slash ribbons (graphite) from the pencil hand's arc
      SLASH.forEach(([i, ts], k) => {
        const m = PB.trails[k]; const head = clamp01((tc - ts + 0.032) / 0.035), tail = clamp01((tc - ts - 0.04) / 0.3);
        if (head <= 0 || tail >= 1) return;
        const st = STAND[i]; const dir = V(st[0] - jp.x, 0, st[1] - jp.z).normalize();
        const c = V(jp.x, 0.6 * H.jade, jp.z).addScaledVector(dir, 0.1 * H.jade);
        setArc(m, c, dir, 1.95, -0.75, head, tail, 0.55 * H.jade, 9 * hs); m.children[0].visible = false;
      });

      // ---------------------------------------------------------- the hat in flight + pings
      const chHand = W.heroes.charlie.hand('R', V(0, 0, 0)); chHandRef = chHand.clone();
      const cs = 1.3 * hs;
      if (hatOut) {
        const p = capAt(tc);
        PB.cap.visible = true; PB.cap.position.copy(p); PB.cap.rotation.set(0.55, tc * 14, 0.2); PB.cap.scale.setScalar(cs);
      } else if (tc >= THROW - 0.1 && tc < THROW + 0.08) {
        PB.cap.visible = true; PB.cap.position.copy(chHand); PB.cap.rotation.set(0, 0, 0); PB.cap.scale.setScalar(cs);
        party.charlie.hat = false; putHero(W, W.heroes.charlie, { ...party.charlie });
      }
      ORDER.forEach((i, k) => {
        const g = PB.pings[k]; const s = tc - TAGS[k]; const end = SWING0 + k * SWING_DT;
        if (s < 0 || tc >= end + 0.05) return;
        g.visible = true; const top = slabTop(i); const pop = s < 0.12 ? 0.4 + 5 * s : 1;
        g.position.copy(top); const { dia, ring, pil, num } = g.userData;
        dia.position.y = 20 * hs + 2 * Math.sin(s * 9); dia.rotation.y = s * 4; dia.scale.set(pop, 1.5 * pop, pop);
        num.position.y = 36 * hs; num.scale.setScalar(13 * hs * pop);
        ring.position.y = 0.5; ring.scale.setScalar(s < 0.3 ? 0.5 + 2.5 * s : 1.25); ring.material.opacity = s < 0.3 ? 1 : 0.7;
        pil.scale.set(1, 18 * hs, 1);
      });

      // ---------------------------------------------------------- FUNCTIONS!: Ricky's beam through the slabs in Charlie's order
      const beamT0 = CUE.functions, beamT1 = CUE.functions + 0.38;
      const lit = clamp01((tc - beamT0) / (beamT1 - beamT0));
      PB.glowMat.color.set('#ffe7b0').multiplyScalar(4 * smooth(beamT0, beamT1, tc) * (1 - smooth(SWING0, SWING0 + 0.5, t)));
      PB.functions.material.opacity = smooth(CUE.functions + 0.15, CUE.functions + 0.35, tc);
      const gtr = W.heroes.ricky.hand('R', V(0, 0, 0));
      if (tc >= beamT0 && tc < SWING0 + 0.05) {
        P.beam.visible = true; P.beam.set([gtr, ...ORDER.map((i) => slabTop(i))], lit, { width: (1 + 0.4 * T.pulse(tc, [CUE.functions], 0.2)) * hs });
      }
      if (tc >= CUE.answer[0] - 0.1 && tc < CUE.functions) {   // Ricky tracks the hat
        const r = W.heroes.ricky; const aimAt = PB.cap.visible ? PB.cap.position : slabTop(ORDER[0]);
        r.rotation.y = yawTo(r.position, aimAt) * 0.7;
      }

      // ---------------------------------------------------------- particles
      P.burst.visible = true;
      P.burst.run(tc, [
        ...SLASH.map(([i, ts]) => { const [x, z] = STAND[i]; return { t0: ts + 0.1, x, y: ground(W, x, z), z: z + 4, n: 20, speed: 80, up: 34, g: 200, dur: 0.8, seed: 70 + i, size: 2.2, colors: ['#e8dcc6', '#cfc0a4', '#4a4a50'] }; }),
        ...ORDER.map((i, k) => { const pp = plankPose(k); return { t0: SWING0 + k * SWING_DT + SWING_DUR, x: BRIDGE_X, y: pp.yTop, z: pp.zc, n: 12, speed: 50, up: 25, g: 200, dur: 0.6, seed: 90 + k, size: 1.6, colors: ['#4a4a50', '#9a9aa2'] }; }),
      ]);
      P.sparks.visible = true;
      const pencilTip = W.heroes.jade.hand('R', V(0, 0, 0));
      P.sparks.run(t, [
        ...[0, 1, 2, 3, 4].map((k) => { const pp = plankPose(k); return { t0: flickT(k), x: BRIDGE_X, y: pp.yTop + 2, z: pp.zc - pp.w / 2 + 4, n: 16, speed: 45, up: 30, g: 120, dur: 0.5, seed: 200 + k, colors: ['#ff4d6d', '#ffe14d', '#3ad06a', '#2bb4e8', '#a35cff'] }; }),
        ...(flick >= 0 ? [{ t0: flickT(flick), x: pencilTip.x, y: pencilTip.y, z: pencilTip.z, n: 8, speed: 30, up: 10, g: 40, dur: 0.3, seed: 300 + flick, colors: ['#ff4d6d', '#ffe14d', '#2bb4e8'] }] : []),
        ...TAGS.map((te, k) => { const p = slabTop(ORDER[k]); return { t0: te, x: p.x, y: p.y + 8, z: p.z, n: 14, speed: 40, up: 20, g: 60, dur: 0.45, seed: 400 + k, colors: ['#ffb02e', '#ffffff'] }; }),
      ]);

      // ---------------------------------------------------------- cameras
      let pos, tgt, fov = 50, focus = V(party.jade.x, 30 * hs, 0), ext = 650;
      const slam = T.pulse(tc, SLASH.map((s) => s[1] + 0.1), 0.1);
      if (t < CUE.fixStop[1]) {            // S1: low from the sea side (seam frame = act3.turn contract), pushes in on Jade's
        // slashes, pulls back on the last slab so the freeze shows the whole scattered draft
        const pin = smooth(86.40, 86.6, tc) * (1 - smooth(87.13, 87.26, tc)), wide = smooth(87.13, 87.26, tc);
        const jx = party.jade.x;
        pos = C0.clone().add(V(-25, 20, 150)).lerp(V(jx - 34, 38, 112), pin).lerp(C0.clone().add(V(-10, 42, 178)), wide);
        tgt = C0.clone().add(V(8, 46, -30)).lerp(V(jx + 14, 46, -30), pin).lerp(C0.clone().add(V(20, 62, -30)), wide);
        fov = 50 + 6 * wide;
        const sh = slam * 2.4; pos.x += Math.sin(tc * 90) * sh; pos.y += Math.cos(tc * 70) * sh;
      } else if (t < TAGS[0] - 0.06) {     // S2a: medium on Charlie: the throw
        const k = smooth(CUE.fixStop[1], TAGS[0], tc); const c = party.charlie;
        pos = V(c.x + 58 - 6 * k, 44 * hs, c.z + 92 * hs); tgt = V(c.x - 4, 34 * hs, c.z - 8); fov = 44; focus = V(c.x, 30, c.z);
      } else if (t < TAGS[3] - 0.04) {     // S2b: follow the cap across the first slabs (pings 1-3)
        const hp = capAt(tc), lag = capAt(tc - 0.14);
        pos = lag.clone().add(V(-6, 22, 112)); tgt = hp.clone().add(V(0, -6, 0)); fov = 48; focus = hp.clone(); ext = 500;
      } else if (t < CUE.functions) {      // S2c: on Ricky, aiming, as the cap tags 4 and 5
        const k = smooth(TAGS[3], CUE.functions, tc); const r = party.ricky;
        pos = V(r.x - 34 - 4 * k, 50 * hs, r.z + 40 * hs); tgt = V(r.x + 130, 50 * hs, -44); fov = 50; focus = V(r.x, 30, r.z);
      } else if (t < SWING0) {             // S3: FUNCTIONS! low from behind Ricky (freeze in the stop)
        const k = smooth(CUE.functions, CUE.funStop[0], tc);
        pos = V(520 - 10 * k, 52 + 10 * k, 170 + 12 * k); tgt = V(660, 52, -36); fov = 54; focus = V(party.ricky.x, 30, party.ricky.z);
      } else if (t < 92.5) {               // S4: clear 3/4 wide from off mesa A's corner: the swing into a bridge, then the crossing
        const k = smooth(SWING0, 92.5, t);
        const kp = smooth(SWING0 + 0.25, CROSS0 + 0.2, t); pos = V(915 + 40 * k, 108, 215 + 25 * k); tgt = V(690 + 10 * kp, 52 - 22 * kp, 10 + 150 * kp); fov = 52; focus = V(700, 10, 120 + 80 * k); ext = 800;
      } else {                             // S5: front medium on mesa A, the co-op gestures (head room for native heroes)
        const k = smooth(92.5, 94.204, t);
        pos = V(728 + 24 * k, MESA_A.top + 44 * hs, 352 + 128 * hs - 12 * k); tgt = V(700, MESA_A.top + 34 * hs, 345); fov = 44; focus = V(700, 30, 348);
      }
      const camera = aim(persp('drop', aspect), pos, tgt, fov);
      if (t >= CUE.fixStop[1] && t < SWING0) faceCam([W.heroes.jade], pos, 0.5);
      if (t < CUE.fixStop[0] && cur < 0) faceCam(Object.values(W.heroes), pos, 0.5);
      if (t >= 92.5) faceCam(Object.values(W.heroes), pos, 0.6);
      return { camera, target: tgt, focus, look: LOOK({ rays: 0.3, dofAmount: 0.22 }), shadowExtent: ext };
    },
  });
  // the compose layer's 88.0 sea-column framing (built for the old over-the-shoulder camera) blocks the new high 3/4: off here
  const base = scene.update; scene.update = (t) => { base(t); if (W.compose?.dressing?.s88) W.compose.dressing.s88.visible = false; };
  return scene;
}
