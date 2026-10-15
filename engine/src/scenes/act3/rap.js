// ACT III · 110.41-123.354 · RAP VERSE on mesa B.
//   110.41 不用背语法: giant plaster textbooks (SYNTAX / 语法 / { ; } ...) topple like dominoes; Jade walks past, talking
//   112.33 eh eh eh: the last books slam down
//   113.82 一句话 屏幕上就开出花: a monolith that is also a screen types 一句话; on 开 (114.95) flowers explode out of it
//   116.88 Bug 也不怕: the bugs arrive. Pacifist DANCE BATTLE: on each accent a hero hits a pose and a bug becomes a feature
//          118.175 ladybug -> button · 118.38 beetle -> wheel · 120.135 moth -> glider · 120.537 caterpillar -> bridge
//          121.405 firefly -> lamp
//   119.02 Fixtures 打底 functions 上色: THE PAINT FLOOD. Jade plants the every-colour pencil; a colored-pencil hatching
//          wavefront races out across the whole plaster world. First time the 3D world is in full colour.
import * as THREE from 'three';
import * as T from '../../show/timing.js';
import { G } from '../../util.js';
import { getWorld, MESA_B } from './world/build.js';
import { make3D, CUE, V, aim, persp, pathAt, runFrame, smooth, clamp01, LOOK } from './common.js';

const top = MESA_B.top;
const BOOKS = { x0: 1130, dx: 52, z: 302 };
const FALL = [110.75, 111.0, 111.25, 111.705, 112.33, 112.56];
const WALK = { z: 270, x0: 1110, x1: 1430, t0: 110.41, t1: 112.3 };
const MONO = V(1532, top, 375);
const TYPE = [113.82, 113.915, 114.035], BLOOM = 114.95;
const BUGS = ['ladybug', 'beetle', 'moth', 'caterpillar', 'firefly'];
// measured drum transients: 118.18, 118.38, 118.785 (before the flood), 122.22, 122.62 (in the full-colour band shot)
export const FEATURE_T = { ladybug: 118.175, beetle: 118.38, moth: 118.785, caterpillar: 122.22, firefly: 122.62 };
export const REVEAL = 121.405;   // measured accent (bar 73 beat 4): the fast pull-back reveal
const POSER = { ladybug: 'jade', beetle: 'charlie', moth: 'ricky', caterpillar: 'jade', firefly: 'ricky' };
// dance battle line-up (side view from the sea at +z: band on the right facing left, bugs on the left)
const BAND = { jade: V(1378, top, 454), charlie: V(1402, top, 442), ricky: V(1424, top, 460) };
const BUGP = { ladybug: V(1330, top, 458), beetle: V(1306, top, 446), moth: V(1318, top + 22, 436), caterpillar: V(1280, top, 462), firefly: V(1292, top + 28, 470) };
const PENCIL = V(1354, top, 454);
export const FLOOD = { t0: CUE.flood, c: PENCIL };

/** the wavefront: a hatched ring bursts from the pencil (119.02), then races to the horizon in ~1.55 s in the aerial */
export function floodRadius(t) {
  const s = t - FLOOD.t0; if (s < 0) return -1;
  if (t < 119.45) return 20 + 180 * Math.pow(s / 0.43, 0.8);
  const u = Math.min(1, (t - 119.45) / 1.55); return 200 + 6800 * Math.pow(u, 1.35) + Math.max(0, t - 121.0) * 4000;
}

export async function setup(ctx) {
  const W = await getWorld(ctx); const P = W.props; const aspect = ctx.width / ctx.height;
  return make3D(ctx, W, {
    frame(t, fx) {
      // ---- the flood (global)
      const R = floodRadius(t);
      if (R > 0) { G.uPaintC.value.copy(FLOOD.c); G.uPaintR.value = R; G.uPaintW.value = 60 + 0.2 * Math.min(R, 3000); }
      // ---- books (dominoes)
      P.books.forEach((b, i) => {
        b.visible = true; const x = BOOKS.x0 + i * BOOKS.dx; b.position.set(x, top, BOOKS.z); b.rotation.set(0, 0, 0);
        const u = clamp01((t - FALL[i] + 0.22) / 0.22); const last = i === P.books.length - 1;
        const rest = last ? Math.PI / 2 : Math.PI / 2 - 0.35; const k = u * u;
        b.rotation.z = -rest * k - (u >= 1 ? 0.04 * Math.exp(-(t - FALL[i]) * 8) * Math.sin((t - FALL[i]) * 40) : 0);
      });
      // ---- party
      const party = {};
      if (t < 113.0) {
        const x = WALK.x0 + (WALK.x1 - WALK.x0) * clamp01((t - WALK.t0) / (WALK.t1 - WALK.t0));
        const walking = t < WALK.t1;
        party.jade = { x, y: top, z: WALK.z, anim: walking ? 'run' : 'sing', frame: walking ? runFrame(t, 2, 1) : Math.floor(T.beatAt(t) * 2) % 2, pencil: true, rotY: Math.PI, facing: -1 };
        party.charlie = { x: x - 40, y: top, z: WALK.z + 12, anim: 'run', frame: runFrame(t, 6, 1.5), rotY: Math.PI, facing: -1 };
        party.ricky = { x: x - 66, y: top, z: WALK.z - 8, anim: 'run', frame: runFrame(t + 0.3, 6, 1.5), rotY: Math.PI, facing: -1 };
        if (!walking) { party.charlie.anim = 'idle'; party.charlie.t = t; party.ricky.anim = 'idle'; party.ricky.t = t; }
      } else if (t < 115.6) {
        party.jade = { x: MONO.x - 72, y: top, z: MONO.z - 14, anim: 'sing', frame: t >= TYPE[0] && t < 115.6 ? Math.floor(T.beatAt(t) * 4) % 2 : 0, pencil: true, rotY: Math.PI * 0.85, facing: -1 };
      } else {
        // dance battle line-up
        for (const n of ['jade', 'charlie', 'ricky']) {
          const p = BAND[n]; const bp = T.beatPulse(t, 1, 0.1);
          party[n] = { x: p.x, y: p.y + 3 * bp, z: p.z, anim: n === 'jade' ? 'sing' : n === 'ricky' ? 'sustain' : 'idle', frame: n === 'jade' ? Math.floor(T.beatAt(t) * 2) % 2 : null, t, pencil: n === 'jade', rotY: 0, facing: -1 };
        }
        // poses on the accents
        for (const b of BUGS) { const te = FEATURE_T[b]; if (t >= te - 0.05 && t < te + 0.35) { const n = POSER[b]; party[n] = { ...party[n], y: top + 8 * Math.sin(Math.PI * clamp01((t - te + 0.05) / 0.4)), anim: n === 'jade' ? 'draw_rainbow' : n === 'ricky' ? 'chord' : 'shield', frame: n === 'ricky' ? 1 : null, t: t - te }; } }
        // the flood: Jade plants the giant pencil
        if (t >= 118.75 && t < 119.6) party.jade = { ...party.jade, x: PENCIL.x + 14, anim: 'draw_rainbow', t: t - 118.75 };
      }
      for (const [n, s] of Object.entries(party)) W.put(W.heroes[n], s);
      // ---- monolith screen: 一句话 typed on the syllables, flowers burst on 开
      if (t >= 112.8) {
        P.monolith.visible = true; P.monolith.position.copy(MONO); P.monolith.rotation.y = Math.PI * 1.12;
        const n = TYPE.filter((e) => t >= e).length;
        P.monolith.userData.draw('一句话'.slice(0, n), Math.floor(t * 4) % 2 === 0 && t < BLOOM, T.pulse(t, [BLOOM], 0.6) + (n ? 0.3 : 0));
      }
      P.petals.visible = true;
      const burstC = MONO.clone().add(V(-6, 60, -10));
      P.petals.run(t, [0, 1, 2, 3].map((k) => ({ t0: BLOOM + k * 0.11, x: burstC.x, y: burstC.y, z: burstC.z, n: 80, speed: 170, up: 80, size: 1.6, g: 130, dur: 2.4, seed: 300 + k, floor: top + 0.6, sz: 1.3, colors: ['#ff4d6d', '#ffb02e', '#ffe14d', '#e858d0', '#a35cff', '#ffffff', '#4fd06a'] })));
      // ---- bugs + features
      for (const b of BUGS) {
        const g = W.bugs[b]; const p = BUGP[b]; const ent = CUE.bug + BUGS.indexOf(b) * 0.12;
        if (t < ent) continue;
        const u = clamp01((t - ent) / 0.55); const from = p.clone().add(V(-110, b === 'moth' || b === 'firefly' ? 60 : 0, -20));
        const pos = from.clone().lerp(p, 1 - Math.pow(1 - u, 2));
        const fe = FEATURE_T[b]; const isF = t >= T.snap(fe); let pop = 1;
        const s = { x: pos.x, y: pos.y, z: pos.z, anim: isF ? 'feature' : u < 1 ? 'idle' : 'dance', t, rotY: 0, facing: 1 };
        if (!isF && u >= 1) { s.y += 3 * Math.abs(Math.sin(Math.PI * T.beatAt(t))); s.facing = Math.floor(T.beatAt(t)) % 2 ? -1 : 1; }
        if (isF) {
          const k = t - fe; pop = k < 0.12 ? 1.4 - 0.4 * (k / 0.12) : 1;
          if (b === 'beetle') { s.x = p.x - 40 * Math.min(1, k / 1.2); s.y = top; }                   // the wheel rolls
          if (b === 'moth') { const a = k * 1.6; s.x = 1320 + 40 * Math.cos(a); s.z = 440 + 20 * Math.sin(a); s.y = top + 46 + 6 * Math.sin(a * 2); s.facing = Math.sin(a) > 0 ? -1 : 1; } // the glider circles
          if (b === 'caterpillar') { s.y = top; }
          if (b === 'firefly') { s.y = top; }
          if (b === 'ladybug') { s.y = top; }
        }
        // W.put mirrors with scale.x = -1 for facing -1; keep that sign (mirror X only), apply the pop to all axes
        W.put(g, s); const sx = g.scale.x < 0 ? -1 : 1; g.scale.set(sx * pop, pop, pop);
      }
      P.sparks.visible = true;
      P.sparks.run(t, BUGS.map((b, i) => ({ t0: FEATURE_T[b], x: BUGP[b].x, y: BUGP[b].y + 14, z: BUGP[b].z, n: 22, speed: 70, up: 40, g: 80, dur: 0.7, seed: 400 + i, colors: ['#ff4d6d', '#ffe14d', '#4fd06a', '#2bb4e8', '#a35cff', '#ffffff'] })));
      // ---- the giant pencil
      if (t >= 118.75) {
        P.pencil.visible = true; const d = smooth(118.75, CUE.flood, t);
        P.pencil.position.set(PENCIL.x, top - 6 * d + 140 * (1 - d) * (1 - d), PENCIL.z); P.pencil.rotation.set(0, 0, 0.18 * (1 - d) - 0.08);
      }
      P.burst.visible = true;
      P.burst.run(t, [...FALL.map((te, i) => ({ t0: te, x: BOOKS.x0 + i * BOOKS.dx + 30, y: top, z: BOOKS.z, n: 14, speed: 60, up: 20, g: 160, dur: 0.7, seed: 500 + i, size: 1.5, colors: ['#efe7d6', '#d8c9b0'] })),
        { t0: CUE.flood, x: PENCIL.x, y: top, z: PENCIL.z, n: 40, speed: 120, up: 40, g: 100, dur: 1.2, seed: 77, size: 1.4, colors: ['#ff4d6d', '#ffb02e', '#ffe14d', '#4fd06a', '#2bb4e8', '#a35cff'] }]);
      if (T.exactFrame(t, [CUE.flood])) fx.flash = 0.25;

      // ---- cameras
      let pos, tgt, fov = 46, focus, ext = 450, look = LOOK({ rays: 0.35, dofAmount: 0.2 });
      const jx = W.heroes.jade.position.x;
      if (t < 113.0) {            // tracking Jade past the toppling books (from over the sea edge)
        const sh = T.pulse(t, [112.33, 112.56, 112.78], 0.1) * 2;
        pos = V(jx - 10 + Math.sin(t * 70) * sh, top + 42, 180); tgt = V(jx + 10, top + 30, 310); fov = 50; focus = V(jx, 20, WALK.z);
      } else if (t < 115.6) {     // the monolith screen
        const k = smooth(113.0, 115.6, t);
        pos = MONO.clone().add(V(-20 - 30 * k, 42 + 18 * k, -120 - 50 * k)); tgt = MONO.clone().add(V(-30, 48 - 10 * k, 0)); fov = 46 + 6 * k; focus = MONO.clone();
      } else if (t < CUE.flood) { // the dance battle, side view
        const k = smooth(115.6, CUE.flood, t);
        pos = V(1352, top + 36 - 6 * k, 600 - 20 * k); tgt = V(1352, top + 26, 450); fov = 46; focus = V(1352, 20, 450);
      } else if (t < 119.45) {    // the pencil goes in: a hatched ring bursts out under the dance battle
        const k = smooth(CUE.flood, 119.45, t);
        pos = V(1352, top + 34 + 30 * k, 590 + 20 * k); tgt = V(1352, top + 14, 450); fov = 50; focus = PENCIL.clone();
        look = LOOK({ rays: 0.3, dofAmount: 0.15, sat: 1.2 });
      } else if (t < REVEAL) {     // high above the amphitheatre: the wavefront races over meadow, ruins, hills to the horizon
        const k = smooth(119.45, REVEAL, t);
        pos = V(1560 + 40 * k, 330 + 60 * k, 860 + 40 * k); tgt = V(1000 - 60 * k, -20, -150); fov = 56; focus = tgt; ext = 2400;
        look = LOOK({ rays: 0.25, dofAmount: 0.0, sat: 1.25, atmos: 0.7 });
      } else if (t < 121.95) {     // the fast pull-back reveal of the fully coloured world
        const k = 1 - Math.pow(1 - smooth(REVEAL, 121.95, t), 2);
        pos = V(1600 + 300 * k, 390 + 520 * k, 900 + 700 * k); tgt = V(940 - 140 * k, -20, -150 - 300 * k); fov = 56 + 6 * k; focus = tgt; ext = 3200;
        look = LOOK({ rays: 0.25, dofAmount: 0.0, sat: 1.28, atmos: 0.8 });
      } else {                    // down to the stage: the band and the bug-features in the full-colour world
        const k = smooth(121.95, CUE.end, t);
        pos = pathAt(t, [[121.95, V(1480, 160, 760)], [122.7, V(1400, 70, 640)], [CUE.end, V(1380, 52, 610)]]);
        tgt = V(1350, top + 26, 440 - 10 * k); fov = 52; focus = V(1352, 20, 450); ext = 700;
        look = LOOK({ rays: 0.35, dofAmount: 0.15, sat: 1.22 });
      }
      const camera = aim(persp('rap', aspect), pos, tgt, fov);
      return { camera, target: tgt, focus, look, shadowExtent: ext };
    },
  });
}
