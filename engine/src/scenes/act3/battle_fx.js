// ACT III · battle-only props for battle.js (the bug battle 107.15-123.354). Everything lives in ONE group that the
// battle scene shows only while it renders (fx.show() / fx.hide()), so nothing leaks into other scenes that share the
// world. Every piece is set per frame by battle.js (pure in t); fx.reset() hides all at the start of each frame.
//   checker      missing-texture checkerboard decal (the glitch floor under the bugs; also the beetle's glitch rings)
//   bangs[3]     the half-1 "!" bubbles over the heroes
//   caps[3]      Charlie's beige flat caps (onto the firefly; onto the two triple-tech drafts)
//   boomer       the boomerang cap of turn 4
//   axle         Jade's graphite 丨 (turn 4)
//   rings[4]     Ricky's sound rings (metronome eh eh eh, the triple-tech run ring)
//   draft        the updraft streaks (turn 3)
//   wave         the boss's glitch wave (a checker wall)
//   shield       Charlie's GUARD bubble
import * as THREE from 'three';
import { capGeo } from '../../core/heromodels/heroes.js';
import { canvasTex, pixelCanvas } from '../../core/gfx.js';
import { bangCanvas } from '../../core/props.js';
import { patchPaint } from './world/paint.js';

const MISS_A = '#b028c8', MISS_B = '#120814';
function checkerTex(rep) {
  const cv = pixelCanvas(2, 2, (g, px) => { px(0, 0, MISS_A); px(1, 1, MISS_A); px(1, 0, MISS_B); px(0, 1, MISS_B); });
  const t = canvasTex(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep[0], rep[1]); return t;
}
const basic = (o) => { const m = new THREE.MeshBasicMaterial({ toneMapped: false, ...o }); return m; };

export function makeBattleFX(W) {
  const group = new THREE.Group(); group.name = 'battle_fx'; group.visible = false; W.scene.add(group);
  const F = { group };
  const noAO = (o) => { o.traverse((c) => { c.userData.noAO = true; }); return o; };

  // ---- checkerboard glitch floor (90 x 84 units, 7-unit cells)
  F.checker = new THREE.Mesh(new THREE.PlaneGeometry(90, 84), basic({ map: checkerTex([90 / 14, 84 / 14]), transparent: true, opacity: 1, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4 }));
  F.checker.rotation.x = -Math.PI / 2; F.checker.renderOrder = 2; group.add(noAO(F.checker));
  // ---- glitch rings (the beetle's endless loop grinds them into the stage)
  F.loopRings = [0, 1, 2].map(() => { const m = new THREE.Mesh(new THREE.RingGeometry(1, 1.22, 64, 1), basic({ map: checkerTex([16, 1]), transparent: true, depthWrite: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -4 }));
    m.rotation.x = -Math.PI / 2; m.renderOrder = 2; group.add(noAO(m)); return m; });
  // ---- "!" bubbles
  const bangTex = canvasTex(bangCanvas());
  // (camera-facing planes, not THREE.Sprite: the post chain's override passes render sprites as black boxes)
  F.bangs = [0, 1, 2].map(() => { const s = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), basic({ map: bangTex, depthTest: false, transparent: true, alphaTest: 0.5 })); s.renderOrder = 10; group.add(noAO(s)); return s; });
  // ---- Charlie's beige flat caps (the heromodels team's carved cap, the same shape as the one on his head). Hat scale:
  //      they land ON TOP of a bug, never over it. Origin = cap bottom centre, brim toward +x.
  const capG = capGeo(); capG.computeBoundingBox();
  const capMat = new THREE.MeshStandardMaterial({ vertexColors: !!capG.attributes.color, color: capG.attributes.color ? 0xffffff : 0xcdae74, roughness: 0.8 }); patchPaint(capMat, { noPaint: true, hero: true });   // (v44 open) the caps are Charlie's hat (hero gear): the --r5 hero mask keeps their tan under the pre-flood 3D grade (was greyed at 113.3 / 116.2 / 118.4)
  const mkCap = (k = 1) => { const m = new THREE.Mesh(capG, capMat); m.castShadow = true; m.scale.setScalar(k); group.add(m); return m; };
  F.caps = [mkCap(), mkCap(), mkCap()];
  F.boomer = mkCap();
  // ---- Jade's graphite axle (a 丨 stroke): tapered graphite column, drawn from the top down (scale.y)
  { const geo = new THREE.CylinderGeometry(1.5, 2.1, 1, 8).translate(0, -0.5, 0);
    const m = new THREE.MeshStandardMaterial({ color: 0x3e3e45, roughness: 0.45, metalness: 0.35 }); patchPaint(m, { noPaint: true });
    F.axle = new THREE.Mesh(geo, m); F.axle.castShadow = true; group.add(F.axle); }
  // ---- sound rings (additive tori)
  F.rings = [0, 1, 2, 3].map(() => { const m = new THREE.Mesh(new THREE.TorusGeometry(1, 0.035, 8, 72), basic({ color: new THREE.Color('#7fe8ff').multiplyScalar(3), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
    group.add(noAO(m)); return m; });
  // ---- updraft streaks (instanced thin boxes on a rising helix)
  { const n = 60; const m = new THREE.InstancedMesh(new THREE.BoxGeometry(0.5, 7, 0.5), basic({ color: new THREE.Color('#e8f6ff').multiplyScalar(2.2), transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false }), n);
    m.frustumCulled = false; F.updraft = m; group.add(noAO(m)); }
  // ---- the glitch wave: a checker wall (z-wide, 34 tall)
  F.wave = new THREE.Mesh(new THREE.PlaneGeometry(120, 34).translate(0, 17, 0), basic({ map: checkerTex([120 / 6, 34 / 6]), transparent: true, opacity: 0.85, depthWrite: false, side: THREE.DoubleSide }));
  F.wave.rotation.y = Math.PI / 2; group.add(noAO(F.wave));
  F.waveBits = new THREE.InstancedMesh(new THREE.BoxGeometry(3, 3, 3), basic({ color: '#ffffff' }), 80); F.waveBits.frustumCulled = false;
  for (let i = 0; i < 80; i++) F.waveBits.setColorAt(i, new THREE.Color(i % 2 ? MISS_A : '#2a0a30'));
  group.add(noAO(F.waveBits));
  // ---- GUARD bubble
  F.shield = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 16, 0, Math.PI), basic({ color: new THREE.Color('#7fc4ff').multiplyScalar(1.6), transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
  group.add(noAO(F.shield));

  F.reset = () => { for (const c of group.children) c.visible = false; };
  F.show = () => { group.visible = true; };
  F.hide = () => { group.visible = false; };
  /** helix streaks around c (Vector3), rising, u = 0..1 strength, s = seconds since start */
  F.setUpdraft = (c, u, s) => {
    const m = F.updraft; const n = m.count; const M = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
    for (let i = 0; i < n; i++) {
      const ph = (i * 0.61803) % 1, a = i * 2.4 + s * 7, h = ((ph + s * 1.4) % 1);
      const r = 10 + 14 * h; const y = c.y - 30 + 70 * h; const k = u * Math.sin(Math.PI * h);
      e.set(0, -a, 0.5); q.setFromEuler(e);
      M.compose(new THREE.Vector3(c.x + Math.cos(a) * r, y, c.z + Math.sin(a) * r), q, new THREE.Vector3(k, k * (0.6 + ph), k));
      m.setMatrixAt(i, M);
    }
    m.instanceMatrix.needsUpdate = true; m.visible = u > 0;
  };
  /** glitch-wave debris: the wall shatters on the shield */
  F.setWaveBits = (c, s) => {
    const m = F.waveBits; const M = new THREE.Matrix4(); const q = new THREE.Quaternion(); let vis = false;
    for (let i = 0; i < m.count; i++) {
      const r1 = Math.sin(i * 12.9898) * 43758.5453 % 1, r2 = Math.sin(i * 78.233) * 12543.123 % 1, r3 = Math.sin(i * 39.425) * 9131.77 % 1;
      const vx = -30 - 50 * Math.abs(r1), vy = 25 + 50 * Math.abs(r2), vz = 120 * r3;
      const k = Math.max(0, 1 - s / 0.6);
      q.setFromEuler(new THREE.Euler(s * 9 * r1, s * 7 * r2, 0));
      M.compose(new THREE.Vector3(c.x + vx * s, Math.max(10.5, c.y + 4 + 30 * Math.abs(r3) + vy * s - 140 * s * s), c.z + vz * s * 0.6 + 50 * r3), q, new THREE.Vector3(k, k, k));
      m.setMatrixAt(i, M); vis = vis || k > 0;
    }
    m.instanceMatrix.needsUpdate = true; m.instanceColor.needsUpdate = true; m.visible = vis && s >= 0;
  };
  return F;
}
