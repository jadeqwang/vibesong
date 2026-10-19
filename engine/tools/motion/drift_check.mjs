// node tools/motion/drift_check.mjs  -> foot skate numbers for the motion dev choreography, NEW (motion module) vs OLD
// (lerp + voxfig pose('run') on time, the way Actor.voxelFigure drives it). Skate = horizontal travel of a foot's lowest
// sole point between consecutive 30 fps frames while it touches the ground (within 0.6 world units).
import path from 'node:path';
import { fileURLToPath } from 'node:url';
// env: FIGRES=2.5 (hero density) FIGRIG=1 (models_r6 split rig) to check the motion module on those figures too
if (process.env.FIGRES) globalThis.FIGRES = +process.env.FIGRES; if (process.env.FIGRIG) globalThis.FIGRIG = process.env.FIGRIG === '1';
const THREE = await import('three');
const { loadMotionClips, MotionFigure } = await import('../../src/core/motion/index.js');
const { pose: voxPose } = await import('../../src/core/voxfig.js');
const { buildTracks, oldState, layersFor, HEROES, ground } = await import('../../src/scenes/dev/motion_choreo.js');

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const clips = await loadMotionClips(path.join(ROOT, 'assets/mocap/ual/ual_rig.json'));
const lib = { turn: null };
const FPS = 30, T0 = 0;
const figs = Object.fromEntries(HEROES.map((h) => [h, new MotionFigure(lib, h, { src: 'native' })]));
const tracks = buildTracks(clips, figs.jade.unit, T0);
const lowPt = (fig, sd) => { const p = fig.footPts(sd); return p.heel.y <= p.toe.y ? p.heel : p.toe; };
let moving = () => true;
function skate(name, step) {
  // per foot: heel and toe points touching the ground (within 0.6) in two consecutive frames; the foot's skate is the SMALLER of
  // their horizontal moves (a rolling foot keeps one point fixed), so heel-toe roll is not counted, sliding is
  const prev = { R: null, L: null }; let sum = 0, max = 0, n = 0, maxAt = 0; const per = []; let hover = 0, hn = 0;
  for (let f = 0; f <= Math.round((tracks.jade.t1 - T0) * FPS); f++) {
    const t = T0 + f / FPS; const fig = step(t);
    for (const sd of ['R', 'L']) {
      const p = fig.footPts(sd); const cur = {}; for (const k of ['heel', 'toe']) { const q = p[k]; if (q.y - ground(q.x, q.z) < 0.6) cur[k] = q.clone(); }
      const low = Math.min(p.heel.y - ground(p.heel.x, p.heel.z), p.toe.y - ground(p.toe.x, p.toe.z)); hover += Math.max(0, low); hn++;
      const ds = []; if (prev[sd]) for (const k of ['heel', 'toe']) if (cur[k] && prev[sd][k]) ds.push(Math.hypot(cur[k].x - prev[sd][k].x, cur[k].z - prev[sd][k].z));
      if (ds.length) { const d = Math.min(...ds); sum += d; n++; per.push(d); if (d > max) { max = d; maxAt = t; } }
      prev[sd] = cur;
    }
  }
  per.sort((a, b) => a - b);
  // support-foot slide while moving: the lower foot's horizontal travel per frame (same foot two frames running), mean over the move
  let ss = 0, sn = 0; let last = null;
  for (let f = 0; f <= Math.round((tracks.jade.t1 - T0) * FPS); f++) { const t = T0 + f / FPS; const fig = step(t); if (!moving(t)) { last = null; continue; }
    const lo = (sd) => { const p = fig.footPts(sd); return p.heel.y <= p.toe.y ? p.heel : p.toe; }; const r = lo('R'), l = lo('L'); const sd = r.y <= l.y ? 'R' : 'L'; const p = (sd === 'R' ? r : l).clone();
    const fp = fig.footPts(sd); if (last && last.sd === sd) { ss += Math.min(Math.hypot(fp.heel.x - last.heel.x, fp.heel.z - last.heel.z), Math.hypot(fp.toe.x - last.toe.x, fp.toe.z - last.toe.z)); sn++; }
    last = { sd, heel: fp.heel.clone(), toe: fp.toe.clone() }; }
  return { name, supportSlidePerFrame: +(ss / Math.max(1, sn)).toFixed(3), contactFrames: n, meanSlide: +(sum / Math.max(1, n)).toFixed(3), p95: +(per[Math.floor(per.length * 0.95)] || 0).toFixed(3), max: +max.toFixed(3), maxAt: +maxAt.toFixed(2), meanLowestFootAboveGround: +(hover / hn).toFixed(2) };
}
const out = [];
for (const h of HEROES) {
  const fig = figs[h], tr = tracks[h]; const mv = tr.segs.find((s) => s.kind === 'move'); moving = (t) => t >= mv.t0 && t < mv.t1;
  out.push({ hero: h, ...skate('NEW', (t) => { fig.apply(tr, t, { layers: layersFor(h, tr) }); return fig; }) });
  // OLD: same figure object, posed the old way (rest of voxfig pose('run' / 'idle' / 'jump') + group placement)
  out.push({ hero: h, ...skate('OLD', (t) => { const s = oldState(h, tr, t); const F = fig.F; const p = s.anim === 'run' ? (s.t * 12 / 6) % 1 : s.anim === 'jump' ? s.frame / 2 : ((s.t * 3 / 2) % 1);
    voxPose(F, s.anim, p, { hero: h }); fig.group.position.set(s.x, s.y, s.z); fig.group.quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), -s.h); fig.group.updateMatrixWorld(true); return fig; }) });
}
console.table(out);
// planted-foot drift: during every NEW contact interval, the pinned pivot vs its lock (max over the interval)
for (const h of HEROES) {
  const fig = figs[h], tr = tracks[h]; let worst = 0, cnt = 0;
  for (const sd of ['R', 'L']) for (const iv of tr.contacts[sd]) {
    let base = null; for (let t = iv.t0; t < iv.t1; t += 1 / FPS) { fig.apply(tr, t, { layers: layersFor(h, tr) }); const D = fig.debug[sd]; if (!D.pivot) continue;
      const p = (D.mode === 'heel' ? fig.footPts(sd).heel : fig.footPts(sd).toe); const e = p.distanceTo(D.pivot); if (e > worst) worst = e; cnt++; }
  }
  console.log(h, 'contacts R', tr.contacts.R.length, 'L', tr.contacts.L.length, 'pinned frames', cnt, 'max |pivot - lock|', worst.toFixed(4), 'world units; track', T0, '->', tr.t1.toFixed(2), 's; segs', tr.segs.map((s) => s.kind + ' ' + s.t0.toFixed(2) + '-' + s.t1.toFixed(2)).join(', '));
}

// ---------------------------------------------------------------------------------------------- r2 scenarios (motion2_choreo)
// planted drift (pivot vs lock), swing feet through the ground, hand-target residuals, min distance between heroes, warnings
const { SCENARIOS } = await import('../../src/scenes/dev/motion2_choreo.js');
const fs = await import('node:fs'); const T = await import('../../src/show/timing.js'); const RT = path.join(ROOT, '..');
T.init(JSON.parse(fs.readFileSync(path.join(RT, 'analysis/timing.json'))), JSON.parse(fs.readFileSync(path.join(RT, 'analysis/lyrics_timed.json'))), JSON.parse(fs.readFileSync(path.join(ROOT, 'data/cues.json'))));
// contact check: staged hand contacts (hold / press / carry): |hand - target| on contact frames (weight >= 0.99; for a press,
// the push window) must stay <= 1 world unit
const contactMax = {};
const only = process.argv[2];
const rows = [];
for (const [name, sc] of Object.entries(SCENARIOS)) {
  if (only && only !== name) continue;
  const tr = sc.r2(clips, figs.jade.unit, 0, T); let minD = Infinity;
  for (const h of sc.heroes) {
    const vn = sc.variants?.[h]; const fig = vn ? (figs[h + ':' + vn] ||= new MotionFigure(lib, h, { src: 'native', variant: vn })) : figs[h], t1 = tr[h].t1; let worst = 0, cnt = 0, sink = 0, hand = 0, gap = 0;
    for (let f = 0; f <= Math.round(t1 * FPS); f++) { const t = f / FPS; const o = sc.opts ? sc.opts(h, t, tr, T, figs) : {}; fig.apply(tr[h], t, o);
      for (const sd of ['R', 'L']) { const spec = o.hands?.[sd], Hd = fig.debug.hands?.[sd]; if (!spec || !Hd || !spec.kind) continue;
        const on = spec.kind === 'press' || spec.kind === 'place' ? t >= spec.push[0] && t <= spec.push[1] : Hd.w >= 0.99; if (!on) continue;
        const e = fig.hand(sd).distanceTo(Hd.target); const k = name + ':' + h + ':' + spec.kind; contactMax[k] = Math.max(contactMax[k] || 0, e); }
      for (const sd of ['R', 'L']) { const D = fig.debug[sd]; const p = fig.footPts(sd);
        if (D.pivot) { const e = (D.mode === 'heel' ? p.heel : p.toe).distanceTo(D.pivot); if (e > worst) worst = e; cnt++; }
        else for (const q of [p.heel, p.toe]) sink = Math.max(sink, sc.ground(q.x, q.z) - q.y); }
      for (const sd of ['R', 'L']) { const H = fig.debug.hands?.[sd]; if (H) hand = Math.max(hand, H.residual); }
      for (const o of sc.heroes) if (o !== h) { const a = tr[h].state(t), b = tr[o].state(t); minD = Math.min(minD, Math.hypot(a.x - b.x, a.z - b.z)); } }
    rows.push({ scenario: name, hero: h, seconds: +t1.toFixed(2), pinnedFrames: cnt, maxPlantedDrift: +worst.toFixed(4), maxSwingSink: +sink.toFixed(2), maxHandResidual: +hand.toFixed(2), segs: tr[h].segs.map((s) => s.kind[0] + (s.style ? ':' + s.style[0] : '') + ' ' + s.t0.toFixed(2)).join(' '), warn: tr[h].warnings.join('; ') });
  }
  if (sc.heroes.length > 1) rows.push({ scenario: name, hero: 'min dist', seconds: +minD.toFixed(1), warn: (tr._group?.warnings || []).join('; ') });
}
console.table(rows);
console.log('hand contacts |hand - target| max (must be <= 1):', JSON.stringify(Object.fromEntries(Object.entries(contactMax).map(([k, v]) => [k, +v.toFixed(3)]))), Object.values(contactMax).every((v) => v <= 1) ? 'OK' : 'FAIL');
