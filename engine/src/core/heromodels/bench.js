// Portrait bench for the hero models (MODELS team review gate). Not part of any show: loaded by tools/models_shots.js
// through a dynamic import in the engine page. A neutral plaster stage, warm low sun + sky fill, ACES, soft shadows.
//   await bench.init({ width, height })
//   await bench.shot({ heroes: [{ name, anim, t, pencil, hat, x, z, rotY }], cam: { yaw, pitch, dist, ty, fov } }) -> PNG base64
import * as THREE from 'three';
import { SpriteLib, Actor } from '../sprites.js';

let R = null;
export async function init({ width = 1920, height = 1080 } = {}) {
  // borrow the engine's renderer (a context created from a bare evaluate gets dropped by headless Chrome after a moment)
  if (!window.ENGINE.renderer) await window.ENGINE.init({ show: 'dev', from: 40, to: 40.05, width, height });
  const renderer = window.ENGINE.renderer; renderer.setSize(width, height); renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; renderer.setRenderTarget(null);
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0; renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene(); scene.background = new THREE.Color('#d9cbb8');
  scene.add(new THREE.HemisphereLight(0xe4ecff, 0x9a8466, 1.25));
  const sun = new THREE.DirectionalLight(0xffe6c8, 2.6); sun.position.set(70, 110, 90); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.25; Object.assign(sun.shadow.camera, { left: -90, right: 90, top: 90, bottom: -90, near: 1, far: 400 }); scene.add(sun);
  const fill = new THREE.DirectionalLight(0xbfd2ff, 0.55); fill.position.set(-80, 40, -40); scene.add(fill);
  const ground = new THREE.Mesh(new THREE.CircleGeometry(400, 64), new THREE.MeshStandardMaterial({ color: '#ece0cc', roughness: 0.95 })); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
  const lib = await SpriteLib.load('/sprites/'); await lib.preloadAll(['jade', 'charlie', 'ricky']);
  const t0 = performance.now();
  const heroes = {}; for (const n of ['jade', 'charlie', 'ricky']) { const g = new Actor(lib, n, { name: n }).voxel({}); g.visible = false; scene.add(g); heroes[n] = g; }
  // build every variant once (timing = figure init cost)
  heroes.jade.set({ anim: 'idle', t: 0, pencil: false }); heroes.jade.set({ anim: 'run', t: 0, pencil: true }); heroes.charlie.set({ anim: 'idle', t: 0 }); heroes.charlie.set({ anim: 'idle', t: 0, hat: false }); heroes.ricky.set({ anim: 'idle', t: 0 });
  const buildMs = performance.now() - t0;
  const cam = new THREE.PerspectiveCamera(30, width / height, 0.5, 2000);
  R = { renderer, scene, heroes, cam, lib, sun };
  for (const g of Object.values(heroes)) g.visible = true; cam.position.set(0, 30, 150); cam.lookAt(0, 26, 0); renderer.render(scene, cam); renderer.getContext().finish();   // warm-up (shader compile)
  const models = [...(lib._figModels || new Map()).entries()].map(([k, m]) => ({ k, ms: m.buildMs ?? null, voxels: m.native?.voxels ?? null, height: m.height }));
  return { buildMs, models };
}
export async function shot({ heroes = [], cam = {}, bg } = {}) {
  const { renderer, scene, cam: C } = R;
  for (const g of Object.values(R.heroes)) g.visible = false;
  for (const h of heroes) { const g = R.heroes[h.name]; g.visible = true; g.set({ x: h.x || 0, y: 0, anim: h.anim || 'idle', t: h.t || 0, pencil: !!h.pencil, facing: h.facing ?? 1, hat: h.hat });
    g.position.z = h.z || 0; g.rotation.y = (h.rotY || 0) * Math.PI / 180;
    // r6: joint overrides { joint: [x, y, z] degrees } (added to the pose), finger poses { R, L }, face state (split rig only)
    let F = null; g.traverse((o) => { if (o.userData.F && o.visible !== false && (!F || o.parent?.visible)) { let v = true; for (let p = o; p; p = p.parent) if (!p.visible) v = false; if (v) F = o.userData.F; } });
    if (F && h.joints) for (const [k, d] of Object.entries(h.joints)) { const j = F.J[k]; if (j) { j.rotation.x += d[0] * Math.PI / 180; j.rotation.y += d[1] * Math.PI / 180; j.rotation.z += d[2] * Math.PI / 180; } }
    if (F && h.hands && F.setHand) for (const [sd, ps] of Object.entries(h.hands)) F.setHand(sd, ps);
    if (F && h.face && F.setFace) F.setFace(h.face); }
  const { yaw = 0, pitch = 8, dist = 120, ty = 26, tx = 0, tz = 0, fov = 30 } = cam;
  C.fov = fov; C.updateProjectionMatrix();
  const a = yaw * Math.PI / 180, p = pitch * Math.PI / 180;
  C.position.set(tx + Math.sin(a) * Math.cos(p) * dist, ty + Math.sin(p) * dist, tz + Math.cos(a) * Math.cos(p) * dist); C.lookAt(tx, ty, tz);
  scene.background = new THREE.Color(bg || '#d9cbb8');
  renderer.render(scene, C); const t0 = performance.now(); renderer.render(scene, C); renderer.getContext().finish(); const ms = performance.now() - t0;
  const blob = await new Promise((res) => renderer.domElement.toBlob(res, 'image/png'));
  const url = await new Promise((res) => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.readAsDataURL(blob); });
  return { png: url.slice(url.indexOf(',') + 1), ms, lost: renderer.getContext().isContextLost() };
}
