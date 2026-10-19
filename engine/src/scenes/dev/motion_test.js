// MOTION spike dev scene (show 'dev'): OLD (lerp + pose('run'), today's approach) vs NEW (core/motion: retargeted mocap,
// distance-driven gait phase, damped facing + lean, cross-fades, foot-locking IK, ankle prototype) on the same choreography.
// entry.mode: 'split' (OLD left | NEW right, tracking camera), 'feet' (same split, fixed low camera on the walk-in),
// 'new' / 'old' (one side, full frame).
import * as THREE from 'three';
import { Actor } from '../../core/sprites.js';
import { loadMotionClips, MotionFigure } from '../../core/motion/index.js';
import { buildTracks, oldState, layersFor, HEROES, STEP } from './motion_choreo.js';

function checkerTex() {
  const cv = document.createElement('canvas'); cv.width = cv.height = 256; const g = cv.getContext('2d');
  for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { g.fillStyle = (x + y) % 2 ? '#e9dfca' : '#d9ccb2'; g.fillRect(x * 32, y * 32, 32, 32); }
  g.strokeStyle = 'rgba(90,70,50,0.35)'; g.lineWidth = 1; for (let i = 0; i <= 8; i++) { g.beginPath(); g.moveTo(i * 32 + 0.5, 0); g.lineTo(i * 32 + 0.5, 256); g.stroke(); g.beginPath(); g.moveTo(0, i * 32 + 0.5); g.lineTo(256, i * 32 + 0.5); g.stroke(); }
  const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}
function label(text, w, h, wide = 1) {
  const cv = document.createElement('canvas'); cv.width = 512 * wide; cv.height = 64; const g = cv.getContext('2d');
  const draw = (s) => { g.clearRect(0, 0, cv.width, 64); g.fillStyle = 'rgba(20,20,26,0.72)'; g.fillRect(0, 0, cv.width, 64); g.fillStyle = '#fff'; g.font = 'bold 30px Inter, Arial, sans-serif'; g.textBaseline = 'middle'; g.fillText(s, 16, 33); t.needsUpdate = true; };
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; const m = new THREE.Mesh(new THREE.PlaneGeometry(256 * wide, 32), new THREE.MeshBasicMaterial({ map: t, transparent: true, depthTest: false }));
  const sc = new THREE.Scene(); sc.add(m); const cam = new THREE.OrthographicCamera(0, w, h, 0, -1, 1); m.position.set(12 + 128 * wide, h - 12 - 16, 0); draw(text); return { scene: sc, cam, draw };
}

export async function setup(ctx) {
  const mode = ctx.entry.mode || 'split'; const t0 = ctx.entry.t0;
  const clips = await loadMotionClips();
  const scene = new THREE.Scene(); scene.background = new THREE.Color('#cdd8e6'); scene.fog = new THREE.Fog('#cdd8e6', 700, 1600);
  scene.add(new THREE.HemisphereLight(0xdde8ff, 0x8a7050, 1.25)); const sun = new THREE.DirectionalLight(0xfff0dd, 2.5); sun.position.set(120, 220, 160); sun.castShadow = true;
  sun.shadow.mapSize.set(4096, 4096); sun.shadow.bias = -0.0005; sun.shadow.normalBias = 0.3; Object.assign(sun.shadow.camera, { left: -420, right: 420, top: 300, bottom: -300, near: 10, far: 900 }); scene.add(sun); scene.add(sun.target);
  const tex = checkerTex(); tex.repeat.set(3000 / 40, 3000 / 40);   // 20-unit squares
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(3000, 3000), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.95 })); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
  const step = new THREE.Mesh(new THREE.BoxGeometry(STEP.x1 - STEP.x0, STEP.h, STEP.z1 - STEP.z0), new THREE.MeshStandardMaterial({ color: '#b9aa90', roughness: 0.9 }));
  step.position.set((STEP.x0 + STEP.x1) / 2, STEP.h / 2, (STEP.z0 + STEP.z1) / 2); step.castShadow = step.receiveShadow = true; scene.add(step);
  const stepTop = new THREE.Mesh(new THREE.PlaneGeometry(STEP.x1 - STEP.x0, STEP.z1 - STEP.z0), new THREE.MeshStandardMaterial({ map: tex.clone(), roughness: 0.95, color: '#f2ead8' }));
  stepTop.material.map.repeat.set((STEP.x1 - STEP.x0) / 40, (STEP.z1 - STEP.z0) / 40); stepTop.rotation.x = -Math.PI / 2; stepTop.position.set(step.position.x, STEP.h + 0.02, step.position.z); stepTop.receiveShadow = true; scene.add(stepTop);

  const NEW = {}, OLD = {};
  for (const h of HEROES) { NEW[h] = new MotionFigure(ctx.lib, h); scene.add(NEW[h].group); OLD[h] = new Actor(ctx.lib, h, { name: h }).voxel({}); scene.add(OLD[h]); }
  const tracks = buildTracks(clips, NEW.jade.unit, t0);
  const W = ctx.width, H = ctx.height, half = mode === 'split';
  const cam = new THREE.PerspectiveCamera(half ? 30 : 34, half ? (W / 2) / H : W / H, 2, 4000);
  const labels = { old: label("OLD  lerp + pose('run')", half ? W / 2 : W, H), neo: label('NEW  mocap + foot IK', half ? W / 2 : W, H, mode === 'feet' ? 2.4 : 1) };
  // feet mode: a marker cross on the ground at each planted foot's lock pivot (red = right, blue = left)
  const marks = {}; for (const [sd, col] of [['R', '#e0303a'], ['L', '#2f6fe0']]) { const g = new THREE.Group(); const mm = new THREE.MeshBasicMaterial({ color: col });
    g.add(new THREE.Mesh(new THREE.BoxGeometry(5, 0.15, 0.5), mm), new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.15, 5), mm)); g.visible = false; scene.add(g); marks[sd] = g; }
  const centroid = (t) => { const c = new THREE.Vector3(); for (const h of HEROES) { const s = tracks[h].state(t); c.x += s.x / 3; c.z += s.z / 3; } return c; };
  return {
    stage: { kind: '3d', fx: { flash: 0, fade: 0 } },
    update(t) {
      for (const h of HEROES) {
        NEW[h].apply(tracks[h], t, { layers: layersFor(h, tracks[h]) });
        const s = oldState(h, tracks[h], t); OLD[h].set({ x: s.x, y: s.y, anim: s.anim, t: s.t, frame: s.frame, facing: 1 }); OLD[h].position.z = s.z; OLD[h].rotation.y = -s.h;
      }
      if (mode === 'feet') {   // fixed, low camera on Ricky's feet during his walk-in (the nearest lane); Ricky only
        cam.position.set(-207, 13, 150); cam.lookAt(-207, 6, 20); cam.fov = 22; cam.updateProjectionMatrix();
        for (const h of HEROES) NEW[h].group.visible = h === 'ricky';
        const D = NEW.ricky.debug, f = (sd) => (D[sd].pivot ? 'planted (' + D[sd].mode + ')' : 'swing');
        for (const sd of ['R', 'L']) { marks[sd].visible = !!D[sd].pivot; if (D[sd].pivot) marks[sd].position.copy(D[sd].pivot).setY(D[sd].pivot.y + 0.1); }
        labels.neo.draw(`t ${(t - t0).toFixed(3)}  f${Math.round((t - t0) * 30)}   R: ${f('R')}   L: ${f('L')}`); }
      else { // tracking camera: the heroes' centroid averaged over +-0.5 s (pure in t), from the front-right 3/4
        const c = new THREE.Vector3(); for (let k = -4; k <= 4; k++) c.add(centroid(t + k * 0.125)); c.multiplyScalar(1 / 9);
        cam.position.set(c.x - 10, 105, c.z + (half ? 345 : 300)); cam.lookAt(c.x + 16, 26, c.z); }
      sun.position.set(cam.position.x + 120, 220, 160); sun.target.position.set(cam.position.x, 0, 0);
    },
    render(t, target) {
      const r = ctx.renderer; r.shadowMap.enabled = true; r.setRenderTarget(target); r.autoClear = false; r.setScissorTest(true);
      const show = (o, n) => { for (const h of HEROES) { OLD[h].visible = o; NEW[h].group.visible = n && (mode !== 'feet' || h === 'ricky'); } };
      const pass = (x, w, o, n, lab) => { r.setViewport(x, 0, w, H); r.setScissor(x, 0, w, H); show(o, n); r.clear(); r.render(scene, cam); r.clearDepth(); r.render(lab.scene, lab.cam); };
      if (half) { pass(0, W / 2, true, false, labels.old); pass(W / 2, W / 2, false, true, labels.neo); }
      else if (mode === 'old') pass(0, W, true, false, labels.old); else pass(0, W, false, true, labels.neo);
      r.setScissorTest(false); r.setViewport(0, 0, W, H); r.autoClear = true; show(true, true);
    },
  };
}
