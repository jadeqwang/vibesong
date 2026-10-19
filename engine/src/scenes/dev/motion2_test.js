// motion_r2 review scene (show 'dev'): SPIKE (frozen approved spike module) | R2 (core/motion) side by side on the same
// intent, one scenario per entry (entry.scenario: stepup | landing | trio | ramp | turn), or entry.mode 'r2' for R2 only.
// Each half has its own camera following its own heroes (the two versions can run on different timing).
import * as THREE from 'three';
import { loadMotionClips, MotionFigure } from '../../core/motion/index.js';
import { loadMotionClips as loadSpikeClips, MotionFigure as SpikeFigure } from '../../core/motion/_spike/index.js';
import { SCENARIOS } from './motion2_choreo.js';
import * as T from '../../show/timing.js';

function checkerTex() {
  const cv = document.createElement('canvas'); cv.width = cv.height = 256; const g = cv.getContext('2d');
  for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { g.fillStyle = (x + y) % 2 ? '#e9dfca' : '#d9ccb2'; g.fillRect(x * 32, y * 32, 32, 32); }
  g.strokeStyle = 'rgba(90,70,50,0.35)'; g.lineWidth = 1; for (let i = 0; i <= 8; i++) { g.beginPath(); g.moveTo(i * 32 + 0.5, 0); g.lineTo(i * 32 + 0.5, 256); g.stroke(); g.beginPath(); g.moveTo(0, i * 32 + 0.5); g.lineTo(256, i * 32 + 0.5); g.stroke(); }
  const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}
function label(w, h) {
  const cv = document.createElement('canvas'); cv.width = 1024; cv.height = 64; const g = cv.getContext('2d');
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(512, 32), new THREE.MeshBasicMaterial({ map: t, transparent: true, depthTest: false }));
  const sc = new THREE.Scene(); sc.add(m); const cam = new THREE.OrthographicCamera(0, w, h, 0, -1, 1); m.position.set(10 + 256, h - 10 - 16, 0);
  const draw = (s) => { g.clearRect(0, 0, 1024, 64); g.font = 'bold 28px Inter, Arial, sans-serif'; const tw = g.measureText(s).width + 28; g.fillStyle = 'rgba(20,20,26,0.72)'; g.fillRect(0, 0, tw, 64); g.fillStyle = '#fff'; g.textBaseline = 'middle'; g.fillText(s, 14, 33); t.needsUpdate = true; };
  return { scene: sc, cam, draw };
}

export async function setup(ctx) {
  const t0 = ctx.entry.t0, name = ctx.entry.scenario || 'stepup', sc = SCENARIOS[name], only = ctx.entry.mode === 'r2' || !!sc.only;
  const [clips, sclips] = await Promise.all([loadMotionClips(), loadSpikeClips()]);
  const scene = new THREE.Scene(); scene.background = new THREE.Color('#cdd8e6'); scene.fog = new THREE.Fog('#cdd8e6', 900, 2200);
  scene.add(new THREE.HemisphereLight(0xdde8ff, 0x8a7050, 1.25)); const sun = new THREE.DirectionalLight(0xfff0dd, 2.5); sun.castShadow = true;
  sun.shadow.mapSize.set(4096, 4096); sun.shadow.bias = -0.0005; sun.shadow.normalBias = 0.3; Object.assign(sun.shadow.camera, { left: -420, right: 420, top: 300, bottom: -300, near: 10, far: 900 }); scene.add(sun, sun.target);
  const tex = checkerTex(); tex.repeat.set(4000 / 40, 4000 / 40);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(4000, 4000), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.95 })); floor.rotation.x = -Math.PI / 2; floor.position.x = 400; floor.receiveShadow = true; scene.add(floor);
  for (const b of sc.boxes) {
    const w = b.x1 - b.x0, d = b.z1 - b.z0; const m = new THREE.Mesh(new THREE.BoxGeometry(w, b.h, d), new THREE.MeshStandardMaterial({ color: '#b9aa90', roughness: 0.9 }));
    m.position.set((b.x0 + b.x1) / 2, b.h / 2, (b.z0 + b.z1) / 2); m.castShadow = m.receiveShadow = true; scene.add(m);
    const top = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshStandardMaterial({ map: tex.clone(), roughness: 0.95, color: '#f2ead8' }));
    top.material.map.repeat.set(w / 40, d / 40); top.rotation.x = -Math.PI / 2; top.position.set(m.position.x, b.h + 0.02 + b.h * 0.0005, m.position.z); top.receiveShadow = true; scene.add(top);
  }
  const R2 = {}, SP = {};
  for (const h of sc.heroes) { R2[h] = new MotionFigure(ctx.lib, h, { variant: sc.variants?.[h] || null, ...(ctx.entry.rig ? { rig: true } : {}) }); scene.add(R2[h].group); if (!only) { SP[h] = new SpikeFigure(ctx.lib, h); scene.add(SP[h].group); } }
  const unit = R2[sc.heroes[0]].unit;
  const tr = sc.r2(clips, unit, t0, T), ts = only ? null : sc.spike(sclips, unit, t0);
  const props = sc.props ? sc.props(scene, t0) : null;
  const W = ctx.width, H = ctx.height, half = !only; const VW = half ? W / 2 : W;
  const mkCam = () => new THREE.PerspectiveCamera(sc.cam.fov, VW / H, 2, 5000); const camR = mkCam(), camS = mkCam();
  const labR = label(VW, H), labS = label(VW, H);
  const centroid = (tracks, t) => { const c = new THREE.Vector3(); for (const h of sc.heroes) { const s = tracks[h].state(t); c.x += s.x / sc.heroes.length; c.y += s.y / sc.heroes.length; c.z += s.z / sc.heroes.length; } return c; };
  const aim = (cam, tracks, t) => {
    if (sc.cam.at) { const [x, y, z] = sc.cam.at; cam.position.set(x + sc.cam.dist * 0.5, sc.cam.height, z + sc.cam.dist); cam.lookAt(x, sc.cam.lookY ?? 26, z); return; }
    const c = new THREE.Vector3(); for (let k = -4; k <= 4; k++) c.add(centroid(tracks, t + k * 0.12)); c.multiplyScalar(1 / 9);   // smoothed follow (pure in t)
    if (sc.cam.side) { cam.position.set(c.x + 30, c.y + sc.cam.height, c.z + sc.cam.dist); cam.lookAt(c.x + 30, c.y + 26, c.z); }
    else { cam.position.set(c.x - 40, sc.cam.height, c.z + sc.cam.dist); cam.lookAt(c.x + 10, 20, c.z); }
  };
  const speedTxt = (tracks, t) => { const s = tracks[sc.heroes[0]].state(t); return (s.v / (48.8197 * unit)).toFixed(1) + ' m/s'; };
  return {
    stage: { kind: '3d', fx: { flash: 0, fade: 0 } },
    update(t) {
      for (const h of sc.heroes) { R2[h].apply(tr[h], t, sc.opts ? sc.opts(h, t, tr, T, R2) : {}); if (!only) SP[h].apply(ts[h], t); }
      if (props) props(t, tr, R2);   // after the heroes: carried props follow this frame's pose
      aim(camR, tr, t); if (!only) aim(camS, ts, t);
      const extra = name === 'ramp' ? '   ' : '';
      labR.draw(`R2${ctx.entry.rig ? ' rig' : ''}  ${name}${extra}${name === 'ramp' ? speedTxt(tr, t) : ''}   t ${(t - t0).toFixed(2)}`);
      if (!only) labS.draw(`SPIKE  ${name}${extra}${name === 'ramp' ? speedTxt(ts, t) : ''}`);
    },
    render(t, target) {
      const r = ctx.renderer; r.shadowMap.enabled = true; r.setRenderTarget(target); r.autoClear = false; r.setScissorTest(true);
      const show = (s, n) => { for (const h of sc.heroes) { R2[h].group.visible = n; if (!only) SP[h].group.visible = s; } };
      const pass = (x, cam, s, n, lab) => { sun.position.set(cam.position.x + 120, 260, cam.position.z - 60); sun.target.position.set(cam.position.x, 0, cam.position.z - sc.cam.dist);
        r.setViewport(x, 0, VW, H); r.setScissor(x, 0, VW, H); show(s, n); r.clear(); r.render(scene, cam); r.clearDepth(); r.render(lab.scene, lab.cam); };
      if (half) { pass(0, camS, true, false, labS); pass(VW, camR, false, true, labR); } else pass(0, camR, false, true, labR);
      r.setScissorTest(false); r.setViewport(0, 0, W, H); r.autoClear = true; show(true, true);
    },
  };
}
