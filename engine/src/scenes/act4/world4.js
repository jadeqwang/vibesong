// ACT IV world: everything the Act IV shots stand in, built once (module singleton) and shared by the main 3D
// timeline (main3d.js) and the recap montage (montage.js).
//
// Base world: Team B's shared TALOS world (engine/WORLD_API.md, src/scenes/act3/world/build.js getWorld), the same
// instance Act III renders, so the 123.354 hand-over is the same world (+x forward, the sun ahead at +x, the band on
// mesa B). Every Act IV anchor below is expressed in that world: the erased page sits at mesa B's stage height
// (GY), the vantage / spiral / glyph lie on the page beside mesa B, looking along F (the dusk sun's heading).
// On top of the shared world Act IV adds (all inside one group `root`, visible only while Act IV renders):
//   erase patch    a guarded discard on the base world's materials (uEOn = 1 only during Act IV frames): the radial rub
//                  spreading from the Eraser, and the restore. Heroes / bugs / Act IV objects are never erased.
//   paper ground   the blank page left behind (pale paper) + the Eraser's white rub trails = the 凵 of 画 seen from E
//   glyph field    the anamorphic 画 (glyph.js)
//   the Eraser     procedural (eraser3d.js), gray -> pink
//   spiral         Ricky's sound-wave bridge (glowing ribbon, draws on along its length)
//   vantage        a floating 丶 stepping stone (the high vantage point); E = Jade's eye on it
//   props          hat trampoline (art-dept strip, voxelised), the every-colour pencil (3D), bug features, 出发 gate
// begin()/end() wrap every Act IV render: they switch the Act IV layer + erase patch on, and afterwards restore the
// shared world exactly (visibility, sun), so Act III / V frames rendered later in the same page are untouched.
import * as THREE from 'three';
import { getWorld as getSharedWorld, MESA_B, SUN_DIR } from '../act3/world/build.js';
import { Actor } from '../../core/sprites.js';
import { loadHanzi, voxelizeHanzi, HanziVoxels } from '../../hanzi.js';
import { G } from '../../util.js';
import { buildGlyphField, patchPaperGround } from './glyph.js';
import { makeEraser } from './eraser3d.js';

export const V = (x, y, z) => new THREE.Vector3(x, y, z);
export const SUN_DAY = SUN_DIR.clone();                    // Team B's golden-hour sun (the hand-over frame)
// dusk: the same heading, lower (3.5 degrees), the sun behind the 画
export const SUN = V(SUN_DIR.x, 0.062, SUN_DIR.z).normalize();
export const F = V(SUN.x, 0, SUN.z).normalize();          // Jade looks toward the sunset
export const RT = V(-F.z, 0, F.x);                          // screen-right when looking along F
export const GY = MESA_B.top;                               // the page height = mesa B's stage top
export const PAPER_Y = GY + 0.3;
// the vantage point (a floating 丶) and Jade's eye, on the page at the land end of mesa B
export const J = V(1150, GY + 90, 470);                     // Jade's feet on the vantage
export const E = J.clone().addScaledVector(F, 10).add(V(0, 31, 0));
// Ricky's spiral (behind the vantage)
export const SPIRAL = { c: J.clone().addScaledVector(F, -50).setY(0), r: 34, y0: GY + 2, y1: GY + 68, turns: 1.62 };
const along = (p, f, r, y = 0) => p.clone().addScaledVector(F, f).addScaledVector(RT, r).add(V(0, y, 0));
export const at = along;
// heroes on the erased page (around the spiral base)
export const GROUND = { jade: along(SPIRAL.c, -20, -30).setY(GY), charlie: along(SPIRAL.c, -2, 42).setY(GY), ricky: along(SPIRAL.c, -42, 18).setY(GY) };

/** facing helper: rotation.y so a side-view voxel sprite (drawn facing +x) faces horizontal direction d */
export const yawFor = (d) => Math.atan2(-d.z, d.x);

let BUILT = null;
export function getWorld(ctx) { if (!BUILT) BUILT = build(ctx); return BUILT; }

// --------------------------------------------------------------------------------------------- erase patch
const ERASE = {
  uEC: { value: V() }, uER: { value: -1 },             // erased where |P - uEC|_xz < uER (the rub spreads out from the Eraser)
  uRC: { value: V() }, uRR: { value: -1 },              // restored where |P - uRC|_xz < uRR
  uGlowW: { value: 60 }, uEOn: { value: 0 },          // the patch is inert (0) outside Act IV frames
};
function patchErase(root) {
  root.traverse((o) => {
    const ms = Array.isArray(o.material) ? o.material : o.material ? [o.material] : [];
    for (const m of ms) {
      if (m.userData.act4erase || !(m.isMeshStandardMaterial || m.isMeshLambertMaterial || m.isMeshPhongMaterial)) continue;
      m.userData.act4erase = true;
      const prev = m.onBeforeCompile; const pk = m.customProgramCacheKey ? m.customProgramCacheKey.call(m) : '';
      m.onBeforeCompile = (sh, r) => {
        if (prev) prev.call(m, sh, r);
        Object.assign(sh.uniforms, ERASE);
        sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vEW4;')
          .replace('#include <begin_vertex>', `#include <begin_vertex>
          { mat4 mw4 = modelMatrix;
          #ifdef USE_INSTANCING
            mw4 = modelMatrix * instanceMatrix;
          #endif
            vEW4 = (mw4 * vec4(position, 1.0)).xyz; }`);
        sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
          varying vec3 vEW4; uniform vec3 uEC, uRC; uniform float uER, uRR, uGlowW, uEOn;`)
          .replace('#include <clipping_planes_fragment>', `#include <clipping_planes_fragment>
          float eD = distance(vEW4.xz, uEC.xz) - uER; bool eRest = uRR > 0.0 && distance(vEW4.xz, uRC.xz) < uRR;
          if (uEOn > 0.5 && eD < 0.0 && !eRest) discard;`)
          .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
          if (uEOn > 0.5 && uER > 0.0) totalEmissiveRadiance += vec3(1.0, 0.97, 0.92) * 1.6 * (1.0 - smoothstep(0.0, uGlowW, eD)) * (eRest ? 0.0 : 1.0);`);
      };
      m.customProgramCacheKey = () => pk + '|act4erase';
      m.needsUpdate = true;
    }
  });
}

// --------------------------------------------------------------------------------------------- spiral bridge
function spiralPoint(u, rOff = 0) {
  const S = SPIRAL; const th0 = Math.atan2(-(E.z - S.c.z), E.x - S.c.x); // ends toward the vantage
  const th = th0 - (1 - u) * S.turns * Math.PI * 2;
  return V(S.c.x + Math.cos(th) * (S.r + rOff), S.y0 + (S.y1 - S.y0) * u, S.c.z - Math.sin(th) * (S.r + rOff));
}
export { spiralPoint };
function makeSpiral() {
  const N = 600, w = 7; const pos = [], uv = [], idx = [];
  for (let i = 0; i <= N; i++) {
    const u = i / N; const a = spiralPoint(u, -w), b = spiralPoint(u, w);
    pos.push(a.x, a.y, a.z, b.x, b.y, b.z); uv.push(u, 0, u, 1);
    if (i < N) { const k = i * 2; idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); }
  }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geo.setIndex(idx);
  const U = { uProg: { value: 0 }, uT: { value: 0 }, uAmp: { value: 1 }, uLen: { value: SPIRAL.turns * 2 * Math.PI * SPIRAL.r } };
  const mat = new THREE.ShaderMaterial({
    uniforms: U, side: THREE.DoubleSide, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: /* glsl */`uniform float uProg, uT, uAmp, uLen; varying vec2 vUv;
      vec3 hue(float h){ return clamp(abs(fract(h + vec3(0.0, 2.0/3.0, 1.0/3.0)) * 6.0 - 3.0) - 1.0, 0.0, 1.0); }
      void main(){
        if (vUv.x > uProg) discard;
        float s = vUv.x * uLen;                       // arc length
        float v = vUv.y * 2.0 - 1.0;
        // three standing sound waves across the ribbon, travelling up the spiral
        float a = 0.0;
        for (int k = 0; k < 3; k++) { float fk = float(k);
          float y = 0.55 * uAmp * sin(s * (0.09 + 0.04 * fk) - uT * (9.0 + 3.0 * fk) + fk * 2.1) * (0.6 + 0.4 * sin(s * 0.013 + fk));
          float dy = (v - y) * 9.0; a += exp(-dy * dy) * (1.0 - 0.25 * fk); }
        float edge = exp(-pow(abs(v) * 1.1, 6.0));
        float tip = smoothstep(uProg - 0.04, uProg, vUv.x);
        vec3 c = hue(0.55 + 0.25 * sin(s * 0.004 - uT * 0.5)) * (0.55 * edge + 1.6 * a) + vec3(0.35, 0.5, 0.9) * 0.25 * edge + vec3(1.0) * tip * 2.0;
        gl_FragColor = vec4(c, 1.0);
      }`,
  });
  const mesh = new THREE.Mesh(geo, mat); mesh.frustumCulled = false; mesh.userData.noAO = true;
  const g = new THREE.Group(); g.add(mesh); g.userData.U = U;
  return g;
}

// --------------------------------------------------------------------------------------------- props
function makePencil3D({ kind = 'rainbow', len = 16 } = {}) {
  // tip at the origin pointing -y... we build along +y with the tip at y=0
  const g = new THREE.Group(); const r = 0.55;
  const body = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 6), new THREE.MeshStandardMaterial({ color: 0xf2c230, roughness: 0.5 })); body.position.y = 3 + len / 2;
  const wood = new THREE.Mesh(new THREE.ConeGeometry(r, 3, 6), new THREE.MeshStandardMaterial({ color: 0xe8c08a, roughness: 0.8 })); wood.rotation.x = Math.PI; wood.position.y = 1.5;
  const leadMat = kind === 'rainbow' ? new THREE.MeshStandardMaterial({ color: 0xff4d6d, emissive: 0xff6aa0, emissiveIntensity: 2.5 }) : new THREE.MeshStandardMaterial({ color: 0x2e2e33, roughness: 0.4, metalness: 0.4 });
  const lead = new THREE.Mesh(new THREE.ConeGeometry(r * 0.35, 1.1, 6), leadMat); lead.rotation.x = Math.PI; lead.position.y = 0.4;
  const fer = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.05, r * 1.05, 1.2, 12), new THREE.MeshStandardMaterial({ color: 0xc8c8d0, metalness: 0.8, roughness: 0.3 })); fer.position.y = 3 + len + 0.6;
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 1.4, 12), new THREE.MeshStandardMaterial({ color: kind === 'rainbow' ? 0x4f8bff : 0xff8a5c, roughness: 0.6 })); cap.position.y = 3 + len + 1.9;
  for (const m of [body, wood, lead, fer, cap]) { m.castShadow = true; g.add(m); }
  g.userData.lead = leadMat;
  return g;
}

function voxelActor(lib, strips, name = '') { return new Actor(lib, strips, { name }).voxel({ scale: 1 }); }

async function makeGate() {
  // 出发 as two standing rainbow voxel characters (the launch gate), each drawn stroke by stroke
  const out = [];
  for (const ch of ['出', '发']) {
    const vx = voxelizeHanzi(await loadHanzi(ch), { cells: 96 });
    const h = new HanziVoxels(vx, { voxel: 2.2, depth: 10, origin: V(0, 0, 0), tipColor: 0xffffff, seed: ch.charCodeAt(0) });
    // recolour the ink to the every-colour pencil: rainbow along the stroke + stroke order
    const prev = h.material.onBeforeCompile;
    h.material.onBeforeCompile = (sh, r) => {
      prev(sh, r);
      sh.fragmentShader = sh.fragmentShader
        .replace('diffuseColor.rgb = mix(vec3(0.012, 0.012, 0.016), vec3(0.17, 0.168, 0.165), im);',
          'diffuseColor.rgb = clamp(abs(fract(vStroke * 0.13 + vParam * 0.35 + vec3(0.0, 2.0/3.0, 1.0/3.0)) * 6.0 - 3.0) - 1.0, 0.0, 1.0) * (0.75 + 0.25 * im);')
        .replace('roughnessFactor = mix(0.16, 0.62, im);', 'roughnessFactor = 0.45;')
        .replace('metalnessFactor = mix(0.0, 0.45, im);', 'metalnessFactor = 0.0;');
    };
    h.material.customProgramCacheKey = () => 'act4gate';
    h.mesh.userData.noAO = true;
    out.push(h);
  }
  return out;
}

// --------------------------------------------------------------------------------------------- build
async function build(ctx) {
  const W = await getSharedWorld(ctx);
  const sea = W.sea;
  const sharedHeroes = new Set([...Object.values(W.heroes), ...Object.values(W.bugs)]);
  // everything in the shared scene except sky / sea / heroes / bugs / lights is "the drawing" and can be erased
  const baseObjs = W.scene.children.filter((o) => !o.isLight && o !== W.sky && o !== sea && !sharedHeroes.has(o) && o.type !== 'Object3D');
  for (const o of baseObjs) patchErase(o);
  const root = new THREE.Group(); root.name = 'act4'; root.visible = false; W.scene.add(root);

  const scene = root; const lib = ctx.lib;
  // ---- heroes (own voxel actors from the live strips; Jade canon enforced by Actor)
  const measureLib = Object.create(lib);
  { const sp = lib.get('jade_draw_graphite'); const cv = document.createElement('canvas'); cv.width = sp.img.width; cv.height = sp.img.height;
    const g = cv.getContext('2d'); g.drawImage(sp.img, 0, 0); g.clearRect(48, 0, cv.width - 48, cv.height); // painter's gesture: arm out, no baked line
    const m2 = { ...sp, img: cv }; measureLib.get = (n) => (n === 'jade_draw_graphite' ? m2 : lib.get(n)); }
  const heroes = {
    jade: new Actor(measureLib, 'jade', { name: 'jade' }).voxel({ scale: 1, back: true, depth: HERO_DEPTH }),
    charlie: new Actor(lib, 'charlie', { name: 'charlie' }).voxel({ scale: 1, back: true, depth: HERO_DEPTH }),
    ricky: new Actor(lib, 'ricky', { name: 'ricky' }).voxel({ scale: 1, back: true, depth: HERO_DEPTH }),
  };
  for (const h of Object.values(heroes)) scene.add(h);

  // ---- paper ground (the erased page) + glyph field
  const field = await buildGlyphField('画', { E: E.clone(), Fh: F.clone(), groundY: GY });
  scene.add(field.group);
  const groundMat = new THREE.MeshStandardMaterial({ color: new THREE.Color('#b9b2c0'), roughness: 0.95 });
  const PG = patchPaperGround(groundMat, field);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(240000, 240000), groundMat);
  ground.rotation.x = -Math.PI / 2; ground.position.y = PAPER_Y; ground.receiveShadow = true; ground.userData.noAO = true; scene.add(ground);

  // ---- vantage stepping stone (a graphite 丶), spiral, trampoline
  // the vantage: a graphite 丶 (dot stroke): a fat teardrop lying on its side, flat top to stand on
  const dotGeo = new THREE.SphereGeometry(1, 32, 16); { const P = dotGeo.attributes.position; for (let i = 0; i < P.count; i++) { let x = P.getX(i), y = P.getY(i), z = P.getZ(i);
    const tail = Math.max(0, x) ; x *= 1 + 0.8 * tail; z *= 1 - 0.45 * tail; y = y > 0 ? y * 0.25 : y * (0.9 - 0.4 * tail); P.setXYZ(i, x, y, z); } dotGeo.computeVertexNormals(); }
  const vantage = new THREE.Mesh(dotGeo, new THREE.MeshStandardMaterial({ color: 0x6a6a78, roughness: 0.55, metalness: 0.1, emissive: 0x1a1a24 }));
  vantage.scale.set(12, 7, 10); vantage.rotation.y = yawFor(F) + Math.PI; vantage.position.copy(J).add(V(0, -3.2, 0)); vantage.castShadow = true; vantage.receiveShadow = true; scene.add(vantage);
  const spiral = makeSpiral(); scene.add(spiral);
  const tramp = voxelActor(lib, { rest: 'charlie_prop_trampoline' }); scene.add(tramp);
  const pencil = makePencil3D({ kind: 'rainbow' }); scene.add(pencil);

  // ---- the Eraser
  const eraser = makeEraser(); scene.add(eraser);

  // ---- bug features (the rap-verse dance battle turned them into features)
  const bugs = [];
  const BUGS = [
    ['lamp', 'bug_firefly_lamp'], ['lamp', 'bug_firefly_lamp'], ['wheel', 'bug_beetle_wheel'], ['wheel', 'bug_beetle_wheel'], ['glider', 'bug_moth_glider'], ['glider', 'bug_moth_glider'],
    ['dance', 'bug_ladybug_dance'], ['dance', 'bug_caterpillar_dance'], ['dance', 'bug_firefly_dance'],
  ];
  for (const [kind, strip] of BUGS) { const b = voxelActor(lib, { a: strip }); b.userData.kind = kind; b.visible = false; scene.add(b); bugs.push(b); }
  const lampLights = [0, 1].map(() => { const l = new THREE.PointLight(0xffd27a, 0, 120, 1.6); scene.add(l); return l; });

  // ---- 出发 gate
  const gate = await makeGate();
  const gateGroup = new THREE.Group(); gate.forEach((h, i) => { h.mesh.position.x = i ? 14 : -h.widthWorld - 14; gateGroup.add(h.mesh); }); scene.add(gateGroup);
  gateGroup.visible = false;

  // the post palette must know every authored colour only in pixel looks; Act IV is full 3D so it is unused
  const cams = { main: new THREE.PerspectiveCamera(45, ctx.width / ctx.height, 0.5, 200000) };

  // ---- begin/end: switch the Act IV layer on for one render and restore the shared world afterwards
  const baseVis = new Map(baseObjs.map((o) => [o, o.visible]));
  let sunNow = null;
  function setSun(dir) { if (!sunNow || !sunNow.equals(dir)) { W.setSun(dir.clone()); sunNow = dir.clone(); } }
  function begin(sunDir) { root.visible = true; ERASE.uEOn.value = 1; setSun(sunDir); }
  function end() {   // cheap restore after every Act IV frame (the sun is restored on demand: restoreSun)
    root.visible = false; ERASE.uEOn.value = 0;
    for (const [o, v] of baseVis) o.visible = v; sea.visible = true; ground.position.y = PAPER_Y;
  }
  /** before another team's scene renders in the same page (montage callbacks): give the shared world its own sun back */
  function restoreSun() { setSun(SUN_DAY); }
  return { W, scene: W.scene, root, heroes, field, ground, PG, vantage, spiral, tramp, pencil, eraser, bugs, lampLights, gate, gateGroup, sea, baseObjs, cams, ERASE, begin, end, restoreSun };
}
const HERO_DEPTH = { baseDepth: 3, depthPerPixel: 2.2, maxDepth: 18 };   // same extrusion as the shared heroes

/** helper: place a voxel hero (feet at p) facing horizontal direction d */
export function placeHero(h, p, d, state) {
  h.set({ frame: undefined, ...state }); h.position.copy(p); h.rotation.set(0, yawFor(d), 0); h.scale.x = 1; h.visible = true;
}
/** set the global paint wave (shared util.G uniforms) */
export function paint(c, r, w = 150) { G.uPaintC.value.copy(c); G.uPaintR.value = r; G.uPaintW.value = w; }
