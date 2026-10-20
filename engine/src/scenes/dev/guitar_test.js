// (v47_hands) Dev bench for the guitar-playing rig: Ricky (Strat) / Charlie (acoustic) posed by voxfig pose('chord' | 'sustain' | 'idle')
// at fixed strum phases, close-up from 5 angles, plus a numeric penetration check (arm / hand / torso vertices inside the guitar's solid).
//   u = t - t0:  hero = u < 100 ? ricky : charlie (u -= 100);  anim = ['chord', 'sustain', 'idle'][floor(u / 25)];
//   phase p = [0, 0.25, 0.5, 0.75, 0.9][floor(u % 25 / 5)];  view = floor(u % 5): 0 3/4 front (picking side), 1 front, 2 3/4 fretting side, 3 top, 4 low side
// Logs '[engine] [gtest] ...' once per pose (view 0) with the counts of vertices inside the guitar (margin 0.35 model px).
import * as THREE from 'three';
import { Actor } from '../../core/sprites.js';
import { pose as figPose, HANDS_V47 } from '../../core/voxfig.js';

const ANIMS = ['chord', 'sustain', 'idle'], PH = [0, 0.25, 0.5, 0.75, 0.9];
// guitar solids in guitar-mesh local model px (heroes.js stratGeo / acousticGeo)
const stratIn = (u, v, z, m) => {
  const inBody = (u, v) => (((u + 3) / 8) ** 2 + (v / 7.2) ** 2 <= 1 || ((u - 4) / 5.5) ** 2 + ((v - 0.6) / 6.2) ** 2 <= 1 || ((u - 8.5) / 4.2) ** 2 + ((v - 4.4) / 1.9) ** 2 <= 1 || ((u - 7) / 3.2) ** 2 + ((v + 4.3) / 1.7) ** 2 <= 1)
    && !(u > 6.2 && Math.abs(v) < 2.6 && !(u < 10.5 && Math.abs(v) < 1.6));
  const sh = (f) => f(u - m, v) && f(u + m, v) && f(u, v - m) && f(u, v + m);
  if (z > -2 + m && z < 2 - m && sh(inBody)) return 'body';
  if (u >= 10 + m && u < 34 - m && Math.abs(v) <= 1.5 - m && z >= -1 + m && z < 2 - m) return 'neck';
  return null;
};
const acouIn = (u, v, z, m) => {
  const body = (u, v) => ((u + 5.5) / 8.2) ** 2 + (v / 8.2) ** 2 <= 1 || ((u - 5) / 6.2) ** 2 + (v / 6.6) ** 2 <= 1;
  const sh = (f) => f(u - m, v) && f(u + m, v) && f(u, v - m) && f(u, v + m);
  if (z > m && z < 5 - m && sh(body)) return 'body';
  if (u >= 10 + m && u < 31 - m && Math.abs(v) <= 1.5 - m && z >= 2 + m && z < 5 - m) return 'neck';
  return null;
};
const figOf = (g) => { for (const o of g.children[0]?.children || []) if (o.visible && o.userData.F) return o.userData.F; return null; };
const _v = new THREE.Vector3(), _m = new THREE.Matrix4();
/** count vertices of the visible meshes under joint j that sit inside the guitar solid; returns { n, body, neck, maxZ } */
function inside(F, roots, test, face) {
  const gm = F.items.guitar.children.find((c) => c.isMesh); gm.updateWorldMatrix(true, false); const inv = _m.copy(gm.matrixWorld).invert(); const u = F.model.u;
  const out = { n: 0, body: 0, neck: 0, depth: 0, face }; const seen = new Set();
  for (const r of roots) r.traverseVisible((o) => {
    if (!o.isMesh || o === gm || seen.has(o) || o.parent === F.items.guitar) return; seen.add(o); o.updateWorldMatrix(true, false);
    const pos = o.geometry.attributes.position; for (let i = 0; i < pos.count; i += 1) {
      _v.fromBufferAttribute(pos, i).applyMatrix4(o.matrixWorld).applyMatrix4(inv).divideScalar(u);
      const k = test(_v.x, _v.y, _v.z, 0.35); if (k) { out.n++; out[k]++; if (k === 'body') { out.depth = Math.max(out.depth, out.face - _v.z); out.uv ||= [99, -99, 99, -99]; out.uv[0] = Math.min(out.uv[0], _v.x); out.uv[1] = Math.max(out.uv[1], _v.x); out.uv[2] = Math.min(out.uv[2], _v.y); out.uv[3] = Math.max(out.uv[3], _v.y); } }
    }
  });
  return out;
}
export async function setup(ctx) {
  const scene = new THREE.Scene(); scene.background = new THREE.Color('#c9d6e6');
  scene.add(new THREE.HemisphereLight(0xdde8ff, 0x8a7050, 1.4)); const sun = new THREE.DirectionalLight(0xfff0dd, 2.2); sun.position.set(90, 140, 120); scene.add(sun);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(600, 600), new THREE.MeshStandardMaterial({ color: '#e8dcc6' })); ground.rotation.x = -Math.PI / 2; scene.add(ground);
  const heroes = { ricky: new Actor(ctx.lib, 'ricky', { name: 'ricky' }).voxel({}), charlie: new Actor(ctx.lib, 'charlie', { name: 'charlie' }).voxel({}) };
  for (const g of Object.values(heroes)) scene.add(g);
  const cam = new THREE.PerspectiveCamera(26, ctx.width / ctx.height, 1, 3000);
  const t0 = ctx.entry.t0; const logged = new Set();
  return {
    stage: { kind: '3d', fx: { flash: 0, fade: 0 } },
    update(t) {
      let u = t - t0 + 1e-6; const v46 = u >= 200 && u < 400; if (u >= 400) u -= 400; if (v46) u -= 200; globalThis.__HANDS47 = v46 ? null : 'grip';   // u >= 200: the v4.6 rig
      const hero = u < 100 ? 'ricky' : 'charlie'; if (u >= 100) u -= 100;
      const anim = ANIMS[Math.min(2, Math.floor(u / 25))], p = PH[Math.floor((u % 25) / 5)], view = Math.floor(u % 5);
      for (const [n, g] of Object.entries(heroes)) { g.visible = n === hero; }
      const g = heroes[hero]; g.set({ x: 0, y: 0, anim: 'chord', frame: 0, pencil: false, facing: 1 }); const F = figOf(g);
      figPose(F, anim, p, { hero }); g.updateMatrixWorld(true);
      const key = (t - t0 >= 400 ? 'flip' : '') + (v46 ? 'v46' : '') + hero + anim + p;
      if (!logged.has(key) && F.items.guitar) { logged.add(key);
        const test = hero === 'ricky' ? stratIn : acouIn, J = F.J;
        const fz = hero === 'ricky' ? 2 : 5; const R = inside(F, [J.elbowR], test, fz), L = inside(F, [J.elbowL], test, fz), uR = inside(F, [J.shoulderR], test, fz), uL = inside(F, [J.shoulderL], test, fz), tor = inside(F, [J.chest || J.body], test, fz);
        const gm = F.items.guitar.children.find((c) => c.isMesh); const q = new THREE.Quaternion(); (J.wristL || J.elbowL).getWorldQuaternion(q);
        const hx = new THREE.Vector3(1, 0, 0).applyQuaternion(q), hz = new THREE.Vector3(0, 0, 1).applyQuaternion(q), gx = new THREE.Vector3().setFromMatrixColumn(gm.matrixWorld, 0).normalize(), gz = new THREE.Vector3().setFromMatrixColumn(gm.matrixWorld, 2).normalize();
        const hl = J.handL.getWorldPosition(new THREE.Vector3()).applyMatrix4(new THREE.Matrix4().copy(gm.matrixWorld).invert()).divideScalar(F.model.u);
        if (F.hands?.L?.grip && !globalThis.__gb) { globalThis.__gb = 1; const gg = F.hands.L.grip; gg.geometry.computeBoundingBox(); const b = gg.geometry.boundingBox, hp = F.J.handL.position, u = F.model.u;
          const f = (v) => [v.x, v.y, v.z].map((x) => (x / u).toFixed(2)).join(',');
          // occupancy along hand x / y / z lines through the hand centre: count grip vertices in slabs
          const pos = gg.geometry.attributes.position; const hist = { x: {}, y: {}, z: {} };
          for (let i = 0; i < pos.count; i++) { const x = (pos.getX(i) + gg.position.x - hp.x) / u, y = (pos.getY(i) + gg.position.y - hp.y) / u, z = (pos.getZ(i) + gg.position.z - hp.z) / u;
            if (Math.abs(y) < 0.6 && Math.abs(z) < 0.6) hist.x[Math.round(x * 2) / 2] = 1; if (Math.abs(x) < 0.6 && Math.abs(z) < 0.6) hist.y[Math.round(y * 2) / 2] = 1; if (Math.abs(x) < 0.6 && Math.abs(y) < 0.6) hist.z[Math.round(z * 2) / 2] = 1; }
          console.log(`[engine] [gtest] grip bbox ${f(b.min)} .. ${f(b.max)} meshpos ${f(gg.position)} handpos ${f(hp)} | verts on x-line ${Object.keys(hist.x).sort((a, b) => a - b)} | y-line ${Object.keys(hist.y).sort((a, b) => a - b)} | z-line ${Object.keys(hist.z).sort((a, b) => a - b)}`); }
        console.log(`[engine] [gtest] axes ${hero} ${anim} p=${p} handX.faceN ${hx.dot(gz).toFixed(2)} handZ.neck ${hz.dot(gx).toFixed(2)} handL@guitar ${hl.x.toFixed(1)},${hl.y.toFixed(1)},${hl.z.toFixed(1)} hand=${F.handPose?.L}`);
        console.log(`[engine] [gtest] ${v46 ? 'v4.6' : 'v4.7'} ${hero} ${anim} p=${p}  pickArm(fore+hand) ${R.n} (body ${R.body} neck ${R.neck} depth ${R.depth.toFixed(2)} uv ${(R.uv || []).map((x) => x.toFixed(1))})  fretArm ${L.n} (body ${L.body} neck ${L.neck})  upperR ${uR.n - R.n} upperL ${uL.n - L.n}  torso+all ${tor.n}`);
      }
      // camera: the figure faces +x; its right (picking) side is +z
      const C = new THREE.Vector3(0, 27, 0); F.items.guitar?.getWorldPosition(C); C.y += 1;
      const D = 52, dirs = [[0.75, 0.15, 0.75], [1, 0.1, 0], [0.7, 0.35, -0.75], [0.35, 1, 0.12], [0.6, 0.1, 0.8]];
      if (view === 3) {   // the fretting hand seen square-on to the fretboard (fingers should cover the board)
        const gm = F.items.guitar.children.find((c) => c.isMesh); gm.updateWorldMatrix(true, false); F.J.handL.getWorldPosition(C);
        const ax = new THREE.Vector3().setFromMatrixColumn(gm.matrixWorld, 2).normalize(); cam.position.copy(C).addScaledVector(ax, 24); cam.up.set(0, 1, 0); cam.lookAt(C); return; }
      if (view === 2) F.J.handL.getWorldPosition(C); if (view === 4) F.J.handR.getWorldPosition(C);   // close-ups on the fretting / picking hand
      const d = new THREE.Vector3(...dirs[view]).normalize().multiplyScalar(view === 2 || view === 4 ? 26 : D); cam.position.copy(C).add(d); cam.lookAt(C);
    },
    render(t, target) { ctx.renderer.setRenderTarget(target); ctx.renderer.render(scene, cam); },
  };
}
