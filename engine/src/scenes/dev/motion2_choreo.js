// motion_r2 review choreography: SPIKE (the approved spike module, frozen in core/motion/_spike) vs R2 (core/motion) on the
// same intent, one scenario per review clip. Shared by the dev scene (motion2_test.js) and tools/motion/drift_check.mjs.
// Scenario: { heroes, boxes (the ground blocks), ground(x, z), spike(clipsSpike, unit, t0) -> { hero: track },
// r2(clips, unit, t0, timing) -> { hero: track }, cam: { dist, height, fov, side } }
import * as THREE from 'three';
import { MotionTrack, MotionGroup, SPEEDS, press, hold, place, onJoint, strumLayer, carryBody, carryFrame, lipSync, column } from '../../core/motion/index.js';
import { MotionTrack as SpikeTrack } from '../../core/motion/_spike/index.js';

const groundOf = (boxes) => (x, z) => { let y = 0; for (const b of boxes) if (x >= b.x0 && x <= b.x1 && z >= b.z0 && z <= b.z1) y = Math.max(y, b.h); return y; };
const M = (unit) => 48.8197 * unit;   // world units per metre (the clip library's designPerMetre)

export const SCENARIOS = {
  // a 16-unit step (half a hip height: a quick hop) then a 36-unit ledge (1.1 hip heights: a climb / mantle)
  stepup: (() => {
    const boxes = [{ x0: 40, x1: 400, z0: -90, z1: 90, h: 16 }, { x0: 200, x1: 400, z0: -90, z1: 90, h: 52 }];
    const ground = groundOf(boxes);
    return { heroes: ['jade'], boxes, ground, cam: { dist: 300, height: 70, fov: 30, side: true },
      spike: (clips, unit, t0) => ({ jade: new SpikeTrack(clips, { t0, pos: [-150, 0], heading: 0, unit, ground })
        .idle(0.4).move([[-60, 0], [10, 0]], { speed: [[0, 'walk']] }).idle(0.3).jump({ to: [85, 0], apex: 26 })
        .move([[140, 0], [180, 0]], { speed: [[0, 'walk']] }).idle(0.3).jump({ to: [245, 0], apex: 26 }).idle(2.5).build() }),
      r2: (clips, unit, t0) => ({ jade: new MotionTrack(clips, { t0, pos: [-150, 0], heading: 0, unit, ground, name: 'jade' })
        .idle(0.4).traverse({ to: [250, 0] }).idle(2.5).build() }) };
  })(),
  // Charlie walks off a 40-unit platform (1.25 hip heights: a jump down), lands, walks on and hops up a 14-unit step
  landing: (() => {
    const boxes = [{ x0: -400, x1: -40, z0: -90, z1: 90, h: 40 }, { x0: 160, x1: 400, z0: -90, z1: 90, h: 14 }];
    const ground = groundOf(boxes);
    return { heroes: ['charlie'], boxes, ground, cam: { dist: 290, height: 60, fov: 30, side: true },
      spike: (clips, unit, t0) => ({ charlie: new SpikeTrack(clips, { t0, pos: [-170, 0], heading: 0, unit, ground })
        .idle(0.4).move([[-110, 0], [-55, 0]], { speed: [[0, 'walk']] }).idle(0.2).jump({ to: [10, 0] })
        .move([[90, 0], [140, 0]], { speed: [[0, 'walk']] }).idle(0.2).jump({ to: [190, 0], apex: 26 }).idle(2.5).build() }),
      r2: (clips, unit, t0) => ({ charlie: new MotionTrack(clips, { t0, pos: [-170, 0], heading: 0, unit, ground, name: 'charlie' })
        .idle(0.4).traverse({ to: [215, 0] }).idle(2.5).build() }) };
  })(),
  // the trio, staged naively: paths that cross (Jade / Charlie) and Ricky following Jade to the SAME stop point
  trio: (() => {
    const boxes = [], ground = groundOf(boxes);
    const P = { jade: [[-220, 30], [-80, 10], [60, -30], [170, -40]], charlie: [[-220, -40], [-80, -20], [60, 20], [170, 30]], ricky: [[-250, 30], [-80, 10], [60, -30], [170, -40]] };
    const D = { jade: 0.3, charlie: 0.45, ricky: 0.6 }, END = { jade: 0, charlie: Math.PI / 2, ricky: -Math.PI / 2 };
    const hd = (p) => Math.atan2(p[1][1] - p[0][1], p[1][0] - p[0][0]);
    return { heroes: ['jade', 'charlie', 'ricky'], boxes, ground, cam: { dist: 300, height: 300, fov: 34 },
      spike: (clips, unit, t0) => Object.fromEntries(Object.entries(P).map(([h, p]) => [h, new SpikeTrack(clips, { t0, pos: p[0], heading: hd(p), unit, ground })
        .idle(D[h]).move(p.slice(1), { speed: [[0, 'walk']], accel: 260, decel: 240 }).idle(0.5, { face: END[h] }).idle(2.5).build()])),
      r2: (clips, unit, t0) => { const g = new MotionGroup({ radius: 0.55 }); const out = {};
        for (const [h, p] of Object.entries(P)) out[h] = g.add(new MotionTrack(clips, { t0, pos: p[0], heading: hd(p), unit, ground, name: h })
          .idle(D[h]).move(p.slice(1), { speed: [[0, 'walk']] }).idle(0.6, { face: END[h] }).idle(2.5));
        g.build(); out._group = g; return out; } };
  })(),
  // Ricky on a long straight: walk -> brisk -> jog -> run -> sprint -> brake (the same speed profile for both)
  ramp: (() => {
    const boxes = [], ground = groundOf(boxes);
    const prof = (unit) => [[0, SPEEDS.walk], [1.8, SPEEDS.brisk], [3.2, SPEEDS.jog], [4.6, SPEEDS.run], [6.0, SPEEDS.sprint]].map(([a, v]) => [a, v * M(unit)]);
    const L = 1500;
    return { heroes: ['ricky'], boxes, ground, cam: { dist: 300, height: 60, fov: 30, side: true },
      spike: (clips, unit, t0) => ({ ricky: new SpikeTrack(clips, { t0, pos: [-200, 0], heading: 0, unit, ground }).idle(0.4).move([[L / 2 - 200, 0], [L - 200, 0]], { speed: prof(unit), accel: 300, decel: 260 }).idle(2).build() }),
      r2: (clips, unit, t0) => ({ ricky: new MotionTrack(clips, { t0, pos: [-200, 0], heading: 0, unit, ground, name: 'ricky' }).idle(0.4).move([[L / 2 - 200, 0], [L - 200, 0]], { speed: prof(unit), accel: 300, decel: 260 }).idle(2).build() }) };
  })(),
  // Jade turns in place 120 deg right, then 180 deg left, then walks a path with a sharp corner, stops and turns to camera
  turn: (() => {
    const boxes = [], ground = groundOf(boxes);
    const seq = (T, extra) => T.idle(0.5).idle(1.1, { face: 2.1 }).idle(0.4).idle(1.3, { face: 2.1 - Math.PI }).idle(0.3)
      .move([[-40, -60], [-40, -120], [40, -125]], { speed: [[0, 'walk']], ...extra }).idle(0.9, { face: Math.PI / 2 }).idle(1.5);
    return { heroes: ['jade'], boxes, ground, cam: { dist: 230, height: 90, fov: 30, at: [-10, 0, -50] },
      spike: (clips, unit, t0) => ({ jade: seq(new SpikeTrack(clips, { t0, pos: [0, 0], heading: 0, unit, ground }), { accel: 260, decel: 240 }).build() }),
      r2: (clips, unit, t0) => ({ jade: seq(new MotionTrack(clips, { t0, pos: [0, 0], heading: 0, unit, ground, name: 'jade' }), {}).build() }) };
  })(),
  // r2 only: life + contacts. A bug orbits; heads track it, then each other; Jade walks to a YES button and presses it;
  // Charlie holds a post with both hands; Ricky strums on the beat (timing grid). Springs everywhere (bun pencils, guitars).
  life: (() => {
    const boxes = [], ground = groundOf(boxes);
    const BTN = [74, 36, 28], POST = [-70, 0, 8];   // a YES console at waist height
    const bug = (t) => { const a = t * 1.3; return [-10 + 70 * Math.cos(a), 52 + 10 * Math.sin(t * 2.7), 40 + 45 * Math.sin(a)]; };
    let T0 = 0; const head = (tr) => (t) => { const s = tr.state(t); return [s.x, s.y + 60, s.z]; };
    return { heroes: ['jade', 'charlie', 'ricky'], boxes, ground, only: true, cam: { dist: 330, height: 120, fov: 30, at: [-10, 0, 0] },
      props(scene, t0) { T0 = t0; const g = new THREE.Group();
        const btn = new THREE.Mesh(new THREE.BoxGeometry(14, BTN[1] - 2, 14), new THREE.MeshStandardMaterial({ color: '#8a8f99' })); btn.position.set(BTN[0], (BTN[1] - 2) / 2, BTN[2]);
        const cap = new THREE.Mesh(new THREE.CylinderGeometry(4, 4, 2.4, 20), new THREE.MeshStandardMaterial({ color: '#3fbf5f', emissive: '#000000' })); cap.position.set(BTN[0], BTN[1] - 0.8, BTN[2]);
        const post = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.8, 46, 12), new THREE.MeshStandardMaterial({ color: '#6b5a44' })); post.position.set(POST[0] + 17, 23, POST[2]);
        const bb = new THREE.Mesh(new THREE.SphereGeometry(2.6, 12, 10), new THREE.MeshStandardMaterial({ color: '#c0392b', emissive: '#401010' }));
        for (const m of [btn, cap, post, bb]) { m.castShadow = true; g.add(m); } scene.add(g);
        return (t, tr) => { const p = bug(t - t0); bb.position.set(...p); const hit = tr.jade._press.hit; const k = Math.max(0, 1 - Math.abs(t - hit - 0.08) / 0.12); cap.position.y = BTN[1] - 0.8 - 1.4 * Math.min(1, k * 2); cap.material.emissive.set(t > hit ? '#1f7a33' : '#000000'); }; },
      r2: (clips, unit, t0, timing) => {
        // staged naively on purpose: Ricky starts right behind Charlie from this camera; the group's staging pass moves him
        const g = new MotionGroup({ radius: 0.55, camera: { pos: [155, 120, 330] } });
        const tj = g.add(new MotionTrack(clips, { t0, pos: [10, 34], heading: Math.PI / 2, unit, ground, name: 'jade', timing }).idle(6.2).approach(BTN, { speed: 'walk' }).idle(5));   // level with the console in depth: side-on to the camera, nothing hides her
        const tc = g.add(new MotionTrack(clips, { t0, pos: [POST[0], POST[2]], heading: 0, unit, ground, name: 'charlie' }).idle(13), { pin: true });   // holds the post
        const tr = g.add(new MotionTrack(clips, { t0, pos: [-150, -75], heading: 0.75, unit, ground, name: 'ricky' }).idle(13));
        g.build();
        const mv = tj.segs.find((q) => q.kind === 'move'); tj._press = press(BTN, mv.t1 + 0.55, { tHit: mv.t1 + 1.0 });
        return { jade: tj, charlie: tc, ricky: tr, _group: g };
      },
      opts: (h, t, tr, T) => {
        const t0 = tr[h].t0, b = (tt) => bug(tt - t0);
        const look = h === 'jade' ? [{ at: b, t0: t0 + 0.8, t1: t0 + 4.6 }, { at: head(tr.charlie), t0: t0 + 4.6, t1: t0 + 6.4 }, { at: BTN, t0: tr.jade.segs[1].t1 - 0.3, t1: tr.jade.segs[1].t1 + 1.8 }]
          : h === 'charlie' ? [{ at: head(tr.jade), t0: t0 + 1.5, t1: t0 + 5 }, { at: b, t0: t0 + 6.5, t1: t0 + 10 }]
          : [{ at: b, t0: t0 + 2.5, t1: t0 + 8 }, { at: head(tr.jade), t0: t0 + 9, t1: t0 + 12 }];
        const o = { look };
        if (h === 'jade') o.hands = { R: tr.jade._press.spec };
        if (h === 'charlie') o.hands = { R: hold([POST[0] + 17, 40, POST[2] + 2], t0 + 3, t0 + 9, { fade: 0.35 }), L: hold([POST[0] + 17, 33, POST[2] - 2], t0 + 3.2, t0 + 9, { fade: 0.35 }) };
        if (h === 'ricky' && T) o.layers = [strumLayer(T, t0 + 2, t0 + 11, { every: 1 })];
        return o;
      } };
  })(),
  // r2 only: Ricky carries a crate in front of his chest across the floor, sets off at a walk (body-relative carry, both hands)
  carry: (() => {
    const boxes = [], ground = groundOf(boxes);
    return { heroes: ['ricky'], boxes, ground, only: true, cam: { dist: 280, height: 90, fov: 30, side: true },
      props(scene) { const crate = new THREE.Mesh(new THREE.BoxGeometry(12, 9, 14), new THREE.MeshStandardMaterial({ color: '#a8743e' })); crate.castShadow = true; scene.add(crate);
        return (t, tr, figs) => { if (!figs) return; const f = carryFrame(figs.ricky, carryBody(figs.ricky).mid); crate.position.copy(f.position); crate.quaternion.copy(f.quaternion); }; },
      r2: (clips, unit, t0) => ({ ricky: new MotionTrack(clips, { t0, pos: [-160, 0], heading: 0, unit, ground, name: 'ricky' }).idle(0.6).move([[0, 10], [140, 0]], { speed: 'walk' }).idle(0.6, { face: Math.PI / 2 }).idle(1.5).build() }),
      opts: (h, t, tr, T, figs) => (figs ? { hands: carryBody(figs[h]) } : {}) };
  })(),
  // r2 only, close-up (split rig): Jade, hair down (so pencils in hand, the hair rule), sings line 35 (一笔一画 都是我的回答)
  // shifted to scene time, looks to camera then at Charlie, steps away and back (hair / straps swing); Charlie watches her
  face: (() => {
    const boxes = [], ground = groundOf(boxes); const CAM = [28, 60, 120]; let mouthFn = null;
    const head = (tr) => (t) => { const s = tr.state(t); return [s.x, s.y + 60, s.z]; };
    return { heroes: ['jade', 'charlie'], variants: { jade: 'jade_down' }, boxes, ground, only: true, cam: { dist: 120, height: 60, fov: 30, at: [-8, 0, 0], lookY: 52 },
      r2: (clips, unit, t0) => ({
        jade: new MotionTrack(clips, { t0, pos: [6, 0], heading: Math.PI / 2 - 0.25, unit, ground, name: 'jade' }).idle(5.2).move([[34, -18]], { speed: 'walk' }).idle(0.5).move([[6, 0]], { speed: 'walk' }).idle(0.6, { face: Math.PI / 2 - 0.25 }).idle(2).build(),
        charlie: new MotionTrack(clips, { t0, pos: [-34, -10], heading: 0.75, unit, ground, name: 'charlie' }).idle(14).build() }),
      opts: (h, t, tr, T) => {
        const t0 = tr[h].t0;
        if (h === 'jade') { if (!mouthFn && T && T.raw && T.raw()?.lyrics) mouthFn = lipSync(T.raw().lyrics, { lines: [35], shift: 125.86 - (t0 + 0.7) });
          return { pencil: true, mouth: mouthFn || undefined, look: [{ at: CAM, t0: t0 + 0.2, t1: t0 + 2.6 }, { at: head(tr.charlie), t0: t0 + 2.6, t1: t0 + 5.0 }, { at: CAM, t0: t0 + 9.0, t1: t0 + 12 }] }; }
        return { look: [{ at: head(tr.jade), t0: t0 + 0.8, t1: t0 + 12 }] };
      } };
  })(),
  // talos_r4 requests. LIFT: Ricky walks onto a plate, it rises 30 units in 0.8 s (feet ride it), he hops off onto the ledge
  lift: (() => {
    const PL = { x0: 40, x1: 90, z0: -25, z1: 25 }, LEDGE = { x0: 90, x1: 300, z0: -90, z1: 90, h: 30 };
    const lifted = (t) => 30 * (t < 4.0 ? 0 : t > 4.8 ? 1 : (1 - Math.cos(Math.PI * (t - 4.0) / 0.8)) / 2);   // scene time
    let T0 = 0; const ground = (x, z, t = 0) => { if (x >= LEDGE.x0 && x <= LEDGE.x1 && z >= LEDGE.z0 && z <= LEDGE.z1) return LEDGE.h; if (x >= PL.x0 && x < PL.x1 && z >= PL.z0 && z <= PL.z1) return 1 + lifted(t - T0); return 0; };
    return { heroes: ['ricky'], boxes: [{ ...LEDGE }], ground, only: true, cam: { dist: 260, height: 70, fov: 30, side: true },
      props(scene) { const plate = new THREE.Mesh(new THREE.BoxGeometry(PL.x1 - PL.x0, 2, PL.z1 - PL.z0), new THREE.MeshStandardMaterial({ color: '#7d8796' })); plate.receiveShadow = plate.castShadow = true; scene.add(plate);
        return (t) => { plate.position.set((PL.x0 + PL.x1) / 2, ground((PL.x0 + PL.x1) / 2, 0, t) - 1, 0); }; },
      r2: (clips, unit, t0) => { T0 = t0; return { ricky: new MotionTrack(clips, { t0, pos: [-60, 0], heading: 0, unit, ground, name: 'ricky' }).idle(0.4).move([[62, 0]], { speed: 'walk' }).idle(null, { until: t0 + 5.2 }).hop({ to: [118, 0] }).idle(1.5).build() }; } };
  })(),
  // QUICK: Charlie's threat step (12 units, 0.2 s, no shuffle), a sidestep left (14 units, 0.24 s) and a step onto a spot
  quick: (() => {
    const boxes = [], ground = groundOf(boxes);
    return { heroes: ['charlie'], boxes, ground, only: true, cam: { dist: 220, height: 70, fov: 30, at: [20, 0, 0], lookY: 30 },
      r2: (clips, unit, t0) => ({ charlie: new MotionTrack(clips, { t0, pos: [0, 0], heading: 0, unit, ground, name: 'charlie' })
        .idle(0.6).step([12, 0], { dur: 0.2, shuffle: false }).idle(0.8).step([2, 0], { dur: 0.3 }).idle(0.5).step([2, -14], { dur: 0.24 }).idle(0.6).step([16, -14], { dur: 0.22 }).idle(1.2).build() }) };
  })(),
  // FILE: single file on a plank (no sideways pushes), the leader stops early; the followers keep their gaps and stop short
  file: (() => {
    const boxes = [], ground = groundOf(boxes); const P = [[-200, 0], [0, 0], [200, 0]];
    return { heroes: ['jade', 'charlie', 'ricky'], boxes, ground, only: true, cam: { dist: 330, height: 120, fov: 32 },
      r2: (clips, unit, t0) => { const F = column(P, 3, 34); const g = new MotionGroup({ radius: 0.5, sideways: false }); const out = {};
        ['jade', 'charlie', 'ricky'].forEach((h, i) => { out[h] = g.add(new MotionTrack(clips, { t0, pos: F[i].start, heading: F[i].heading, unit, ground, name: h }).idle(0.3 + 0.15 * i).move(F[i].pts, { speed: i === 0 ? 'brisk' : 'jog' }).idle(2), { weight: 1 + i }); });
        g.build(); out._group = g; return out; } };
  })(),
};