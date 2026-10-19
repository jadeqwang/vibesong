// ACT III · act3.turn scene-local props (built inside this scene so the shared world files stay untouched).
// Everything here lives in ONE group added to the shared world scene; turn.js shows it per frame and W.reset()
// hides it again (patched in installReset), so no other scene ever sees these objects.
//   steps        Jade's drummed graphite blocks (3 pillars pumped up in 3 hits each) + the 一 stroke she taps out
//                in the last triplet, which Ricky's rising note bends up into the launch ramp
//   waves        Ricky's rising sound-wave arcs (2D phase)
//   segments     the causeway as raisable chunks (the old 2D strip + 4 segments sunk in the plaster)
//   switches     4 far ▶ switches (same face as Act II's "oh oh oh" switches), Charlie's waypoint pings on them
//   chute        Charlie's hat parachute carrying Jade and Ricky (art-dept strips when present, else cropped _hang)
import * as THREE from 'three';
import { makeDrawnStrip } from './world/props.js';
import { patchPaint } from './world/paint.js';
import { Actor } from '../../core/sprites.js';
import { pixelCanvas } from '../../core/gfx.js';
import { cubeCanvas } from '../act1/kaizo_art.js';
import { PAL } from '../../core/palette.js';
import { LAUNCH } from '../act2/launch_set.js';

// ------------------------------------------------------------------ layout (world units, 2D phase: x = gx - 200, y = gy - 60)
export const STEP = { x0: -26, dx: 12, w: 12, bh: 5, depth: 14 };          // pillar c: centre x0 + c*dx, 3(c+1) blocks of bh
export const colX = (c) => STEP.x0 + c * STEP.dx;
export const colTop = (c) => 3 * (c + 1) * STEP.bh;
export const STROKE = { x0: colX(2) + STEP.w / 2, y0: colTop(2), len: 54, maxAng: 58, n: 18, th: 6 };   // the 一 that bends into the ramp
// causeway segments: [x0, x1, raise time] (null = always up; the last one is raised by the 86.385 click, in act3.drop)
export const SEGS = [[-408, 240, null], [240, 352, 82.265], [352, 552, 83.09], [552, 664, 85.56], [664, 1400, 86.385]];
export const SWITCH_X = [352, 552, 664, 720];   // switch 4 sits inside act3.drop's first camera
export const SWITCH_Z = -36;

const C = (h) => new THREE.Color(h);
function tex(cv, rep) {
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter;
  t.generateMipmaps = false; if (rep) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...rep); } return t;
}
const std = (o) => { const m = new THREE.MeshStandardMaterial({ roughness: 0.8, ...o }); patchPaint(m, { noPaint: true }); return m; };

/** a graphite brick (fixtures): flat graphite with a pencil-hatch, light top edge, dark outline */
function graphiteBrick(w, h, seed = 1) {
  return pixelCanvas(w, h, (g, px) => {
    px(0, 0, '#2e2e33', w, h); px(1, 1, '#6b6b72', w - 2, h - 2);
    px(1, 1, '#a4a4ac', w - 2, 1); px(1, h - 2, '#55555c', w - 2, 1);
    for (let x = 2 + (seed % 3); x < w - 2; x += 3) px(x, 2 + ((x + seed) % 2), '#7e7e86', 1, Math.max(1, h - 4));
  });
}

/** sound-wave arc "(((" opening to the right (Ricky's held note) */
function waveCanvas(r) {
  const W = r + 3, H = 2 * r + 3;
  return pixelCanvas(W, H, (g, px) => {
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const dx = x + 0.5, dy = y + 0.5 - H / 2, d = Math.hypot(dx, dy), ang = Math.abs(Math.atan2(dy, dx));
      if (ang > 0.95) continue;
      if (Math.abs(d - r) < 0.9) px(x, y, '#e6fbff'); else if (Math.abs(d - r) < 1.9) px(x, y, '#2ee6ff');
    }
  });
}

/** Act II's ▶ switch face (18 px): off red / hit white / on green, number n in the corner */
const OUT = '#14121c';
const DIG = { 1: ['010', '110', '010', '010', '111'], 2: ['110', '001', '010', '100', '111'], 3: ['110', '001', '010', '001', '110'], 4: ['101', '101', '111', '001', '001'] };
function switchFace(n, state) {
  return pixelCanvas(18, 18, (g, px) => {
    const face = state === 'on' ? ['#3ad06a', '#8cffb0', '#1e8a43'] : state === 'hit' ? ['#ffffff', '#ffffff', '#ffe14d'] : ['#c42a3a', '#ff6a7a', '#7a1020'];
    px(0, 0, OUT, 18, 18); px(1, 1, face[0], 16, 16); px(1, 1, face[1], 16, 2); px(1, 15, face[2], 16, 2); px(15, 1, face[2], 2, 16);
    for (let y = -4; y <= 4; y++) px(7, 9 + y, state === 'hit' ? '#ff7a1a' : '#ffffff', Math.round((4 - Math.abs(y)) * 1.3) + 1, 1);
    (DIG[n] || DIG[1]).forEach((row, j) => [...row].forEach((b, i) => { if (b === '1') px(2 + i, 3 + j, state === 'hit' ? '#7a4a00' : '#ffffff'); }));
  });
}

/** register a cropped copy of a strip in the sprite lib (e.g. *_hang without the baked grab bar); anchor = [ax, ay] */
function cropStrip(lib, src, name, { top = 0, anchor }) {
  if (lib.has(name)) return name;
  const sp = lib.get(src); const W = sp.w, H = sp.h - top;
  const cv = document.createElement('canvas'); cv.width = W * sp.n; cv.height = H;
  cv.getContext('2d').drawImage(sp.img, 0, top, W * sp.n, H, 0, 0, W * sp.n, H);
  const meta = { ...sp.meta, file: null, frame_w: W, frame_h: H, anchor: anchor || [sp.meta.anchor[0], sp.meta.anchor[1] - top] };
  lib.meta[name] = meta; lib.cache.set(name, { meta, img: cv, tex: null, w: W, h: H, n: sp.n });
  return name;
}

export async function buildTurnProps(W, lib) {
  const root = new THREE.Group(); root.name = 'turnProps'; root.visible = false; W.scene.add(root);
  const shadow = (o) => { o.traverse((m) => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } }); return o; };

  // ---- Jade's graphite steps: 3 pillars of 3(c+1) bricks each (one pump of c+1 bricks per drum hit)
  const brickMat = std({ map: tex(graphiteBrick(STEP.w, STEP.bh, 1)), roughness: 0.55, metalness: 0.15 });
  const brickGeo = new THREE.BoxGeometry(STEP.w, STEP.bh, STEP.depth);
  const bricks = [];   // [{ mesh, c, k (index in its pillar), hit (roll index) }]
  for (let c = 0; c < 3; c++) for (let k = 0; k < 3 * (c + 1); k++) {
    const m = shadow(new THREE.Mesh(brickGeo, brickMat)); root.add(m);
    bricks.push({ mesh: m, c, k, hit: 3 * c + Math.floor(k / (c + 1)) });
  }
  // ---- the 一 stroke: n graphite segments along a curve that bends up (Ricky's note)
  const segLen = STROKE.len / STROKE.n;
  const strokeMat = std({ map: tex(graphiteBrick(6, STROKE.th, 2)), roughness: 0.5, metalness: 0.15 });
  const strokeGeo = new THREE.BoxGeometry(segLen + 0.8, STROKE.th, STEP.depth);
  const strokeSegs = []; for (let i = 0; i < STROKE.n; i++) { const m = shadow(new THREE.Mesh(strokeGeo, strokeMat)); root.add(m); strokeSegs.push(m); }
  // ---- Ricky's sound-wave arcs (flat, they read in 2D)
  const waveTex = tex(waveCanvas(9));
  const waves = []; for (let i = 0; i < 8; i++) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(12, 21), new THREE.MeshBasicMaterial({ map: waveTex, transparent: true, alphaTest: 0.5, depthWrite: false, toneMapped: false }));
    m.userData.noAO = true; root.add(m); waves.push(m);
  }

  // ---- causeway segments (the drawn strip continues as a road, chunk by chunk, out of the plaster)
  const capMat = std({ color: C('#6e4426'), roughness: 0.95 }), capTop = std({ color: C('#4cae40'), roughness: 0.9 });
  const segments = SEGS.map(([x0, x1, te]) => {
    const g = makeDrawnStrip({ x0, x1 }); g.userData.te = te; g.userData.x0 = x0; g.userData.x1 = x1;
    // the strip only caps its x0 end: close the far end too (a raised chunk shows its leading face)
    const cap = new THREE.Mesh(new THREE.BoxGeometry(1, 64, 48), capMat); cap.position.set(x1 - 0.5, -32, 0); g.add(cap);
    const ct = new THREE.Mesh(new THREE.BoxGeometry(1.4, 3, 48), capTop); ct.position.set(x1 - 0.5, -1.5, 0); g.add(ct);
    root.add(g); return g;
  });
  // plaster lips around each sunken bay (so a lowered chunk reads as sitting IN the plaster, not as a hole)
  const lipMat = std({ color: C('#efe6d6'), roughness: 0.9 });
  const lips = SEGS.slice(1).map(([x0, x1]) => {
    const g = new THREE.Group();
    for (const z of [-27, 27]) { const b = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, 6, 6), lipMat); b.position.set((x0 + x1) / 2, -3, z); g.add(b); }
    const f = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, 2, 60), lipMat); f.position.set((x0 + x1) / 2, -64, 0); g.add(f);
    shadow(g); root.add(g); return g;
  });

  // ---- far switches: plaster pedestal + ▶ cube (face texture per state)
  const faces = [1, 2, 3, 4].map((n) => ({ off: tex(switchFace(n, 'off')), hit: tex(switchFace(n, 'hit')), on: tex(switchFace(n, 'on')) }));
  const pedMat = std({ color: C('#efe6d6'), roughness: 0.85 });
  const switches = SWITCH_X.map((x, i) => {
    const g = new THREE.Group();
    const ped = new THREE.Mesh(new THREE.BoxGeometry(12, 30, 12).translate(0, 15, 0), pedMat); g.add(ped);
    const cap = new THREE.Mesh(new THREE.BoxGeometry(17, 2, 17).translate(0, 31, 0), pedMat); g.add(cap);
    const mat = new THREE.MeshBasicMaterial({ map: faces[i].off, toneMapped: false });
    const cube = new THREE.Mesh(new THREE.BoxGeometry(21, 21, 21).translate(0, 43, 0), mat); g.add(cube);
    g.userData = { cube, mat, faces: faces[i] };
    const gy = W.groundY ? W.groundY(x, SWITCH_Z) : 0;
    g.position.set(x, Math.max(-2, gy), SWITCH_Z); g.rotation.y = -0.35; shadow(g); root.add(g); return g;
  });
  // ---- Charlie's waypoint pings: floating diamond + ground ring + thin light pillar (hat-beige / PM orange)
  const pingCol = C('#ffb02e');
  const pings = SWITCH_X.map(() => {
    const g = new THREE.Group();
    const dia = new THREE.Mesh(new THREE.OctahedronGeometry(9, 0), new THREE.MeshBasicMaterial({ color: pingCol.clone().multiplyScalar(2.2), toneMapped: false })); dia.scale.y = 1.5; g.add(dia);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(14, 1.3, 6, 32), new THREE.MeshBasicMaterial({ color: pingCol.clone().multiplyScalar(1.8), transparent: true, toneMapped: false, depthWrite: false })); ring.rotation.x = Math.PI / 2; g.add(ring);
    const pil = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.3, 1, 8, 1, true).translate(0, 0.5, 0), new THREE.MeshBasicMaterial({ color: pingCol.clone().multiplyScalar(1.5), transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false })); g.add(pil);
    g.traverse((o) => { o.userData.noAO = true; }); g.userData = { dia, ring, pil }; root.add(g); return g;
  });

  // ---- Charlie's hat parachute + the dangling chain (art-dept strips when they exist, else stand-ins)
  const heroMat = () => { const m = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.75 }); m.userData.noPaint = true; patchPaint(m, { noPaint: true, hero: true }); return m; };
  const DEPTH = { baseDepth: 3, depthPerPixel: 2.2, maxDepth: 18 };
  const voxActor = (strip, name, scale = 1) => { const a = new Actor(lib, { pose: strip }, { name }); const g = a.voxel({ scale, material: heroMat(), depth: DEPTH, figure: false }); root.add(g); return g; };
  const hasCarry = lib.has('charlie_parachute_carry');
  const jStrip = lib.has('jade_dangle') ? 'jade_dangle' : cropStrip(lib, 'jade_hang', 'turn_jade_hang', { top: 3, anchor: [18, 0] });
  const rStrip = lib.has('ricky_dangle') ? 'ricky_dangle' : cropStrip(lib, 'ricky_hang', 'turn_ricky_hang', { top: 3, anchor: [18, 0] });
  const cStrip = hasCarry ? 'charlie_parachute_carry' : cropStrip(lib, 'charlie_hang', 'turn_charlie_hang', { top: 3, anchor: [18, 0] });
  const chute = {
    hasCarry,
    canopy: hasCarry ? null : voxActor('charlie_prop_parachute', 'canopy', 1.25),
    charlie: voxActor(cStrip, 'turn_charlie'),
    jade: voxActor(jStrip, 'turn_jade'),
    ricky: voxActor(rStrip, 'turn_ricky'),
    // Charlie's anchor height above his boots (stand-in hangs from its hands) and where Jade (front) / Ricky (back) grab
    cH: hasCarry ? 0 : 41,
    boot: (() => { if (!hasCarry) return { jade: [9, 0], ricky: [-10, 0] };
      const m = lib.meta.charlie_parachute_carry; const [ax, ay] = m.anchor; const [[lx, ly], [rx, ry]] = (m.boots && m.boots[0]) || [[ax - 17, ay - 3], [ax + 14, ay - 3]];
      return { jade: [rx - ax, ay - ry], ricky: [lx - ax, ay - ly] }; })(),
    pop: (t) => 1,
    strings: [0, 1, 2, 3].map(() => { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 1, 4).translate(0, 0.5, 0), std({ color: C('#5a3a18') })); root.add(m); return m; }),
  };

  // ---- Act II's launch set continuity (act2/launch_set.js): the three PRESSED plates + lit wires to 出 (flush, below the
  //      grass line, so they sit on the strip's front face), and the four 2D wireframe gizmo cubes of the VOID
  const flat = (cv, w, h) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex(cv), transparent: true, alphaTest: 0.5, depthWrite: false, toneMapped: false })); m.userData.noAO = true; return m; };
  const PW = 26; const plateOn = pixelCanvas(PW, 6, (g, px) => { px(0, 2, OUT, PW, 4); px(1, 3, '#6b6b72', PW - 2, 3); px(1, 3, '#9a9aa2', PW - 2, 1); px(3, 2, '#ffe14d', PW - 6, 2); px(4, 2, '#ffffff', 4, 1); });
  const launchSet = new THREE.Group();
  Object.entries(LAUNCH.party).map(([, gx], i) => [gx, i]).forEach(([gx, i]) => {
    const pl = flat(plateOn, PW, 6); pl.position.set(gx - 200, -4 + 3, 24.6); launchSet.add(pl);       // canvas rows 0..5 = gy 56..61
    const x0 = gx + PW / 2, x1 = 186, n = Math.max(1, Math.floor((x1 - x0) / 3));
    const w = flat(pixelCanvas(x1 - x0, 1, (g, px) => { for (let k = 0; k < n; k++) px(k * 3, 0, '#ffe14d', 2, 1); }), x1 - x0, 1); w.position.set((x0 + x1) / 2 - 200, -2 - i + 0.5, 24.6); launchSet.add(w);
  });
  root.add(launchSet);
  const cubes2D = [[40, 118, 20], [300, 112, 16], [340, 140, 24], [-20, 110, 18]].map(([x, y, sz], i) => { const cv = cubeCanvas(sz, PAL.gizmoBlue, i % 2 === 1); const m = flat(cv, cv.width, cv.height); m.userData.home = [x, y]; root.add(m); return m; });

  // ---- front-only heroes for the side-on 2D phase: the shared world heroes carry a back-view half (voxel back:true)
  //      whose standing silhouette pokes out around crouched / action poses when seen exactly side-on
  const heroes2D = {};
  for (const n of ['jade', 'charlie', 'ricky']) { const a = new Actor(lib, n, { name: n }); const g = a.voxel({ scale: 1, material: heroMat(), back: false, depth: DEPTH, figure: false }); g.visible = false; root.add(g); heroes2D[n] = g; }   // extruded sprite = pixel-matches Act II's 2D frame

  return { root, bricks, strokeSegs, segLen, waves, segments, lips, switches, pings, chute, heroes2D, launchSet, cubes2D };
}

/** the bent 一: points + tangents along the stroke for bend b (0 flat .. 1 full curl) */
export function strokeCurve(b) {
  const n = STROKE.n, L = STROKE.len, ds = L / n; const pts = []; let x = STROKE.x0, y = STROKE.y0;
  for (let i = 0; i < n; i++) {
    const s = (i + 0.5) / n; const a = (b * STROKE.maxAng * Math.pow(s, 1.8)) * Math.PI / 180;
    const cx = x + Math.cos(a) * ds / 2, cy = y + Math.sin(a) * ds / 2;
    pts.push({ x: cx, y: cy, a }); x += Math.cos(a) * ds; y += Math.sin(a) * ds;
  }
  return { pts, tip: { x, y, a: b * STROKE.maxAng * Math.PI / 180 } };
}
/** point on the TOP surface of the stroke at arc fraction s (0..1) */
export function strokeTopAt(b, s) {
  const { pts, tip } = strokeCurve(b); const f = Math.max(0, Math.min(STROKE.n - 1e-6, s * STROKE.n - 0.5));
  if (s >= 1) return { x: tip.x - Math.sin(tip.a) * STROKE.th / 2, y: tip.y + Math.cos(tip.a) * STROKE.th / 2 };
  const i = Math.floor(f), u = f - i, p = pts[i], q = pts[Math.min(STROKE.n - 1, i + 1)];
  const a = p.a + (q.a - p.a) * u; const x = p.x + (q.x - p.x) * u, y = p.y + (q.y - p.y) * u;
  return { x: x - Math.sin(a) * STROKE.th / 2, y: y + Math.cos(a) * STROKE.th / 2 };
}
