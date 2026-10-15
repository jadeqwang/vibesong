// Shared TALOS world assembly (used by turn_demo and talos stills): geometry,
// heroes, the 画 platform, lights, IBL, and `applyLook()` which maps a set of
// look parameters (from turnParams or a still's preset) onto lights + post.
import * as THREE from 'three';
import { SpriteLib, Actor } from '../core/sprites.js';
import { loadHanzi, voxelizeHanzi, HanziVoxels } from '../hanzi.js';
import { makeSky, makeSea, makeEnvironment, envUniforms } from '../env.js';
import { makeStrip, makeMeadow, makeCliff, makeTufts, makeBoulders, makeRuins, makeCypresses, makeIslands, makeBackdrop } from '../world.js';
import { G, patchSceneFlat, lerp } from '../util.js';

export const SEA_Y = -200;

// 2D palette (SNES-ish). Sprite colours are added automatically.
export const PALETTE = [
  '#1d2f66', '#28418a', '#3657a6', '#4a72bf', '#6a8fcf', '#8eaad6', '#b3bfd8', '#d8c8c8', '#f0d2b0', '#ffd9a8', '#ffe9c8', '#fff6e6',
  '#e8a774', '#f4b98a', '#d98a5e', '#5a6fa8', '#7f8fbf', '#a7a9c8', '#c9b6bf', '#e8c0a6', '#ffcf94', '#ffbb73', '#fca65e', '#f0e0d0', '#9cb0d8',
  '#cdbfc2', '#e2d6d4', '#b5a7ad', '#a0959c', '#857f88', '#6e6c70', '#7c7a7c', '#57526a',
  // plaster / clay ramp (the unpainted world)
  '#fffaf0', '#f4ecdc', '#e8dcc6', '#d8c9b0', '#c4b399', '#ab9a82', '#8f7f6c', '#6f6253', '#4d4339',
  '#2f4a26', '#3f6b2a', '#5c8e33', '#7cad46',
  '#0e0f16', '#1c2030', '#2c3244', '#41485e', '#646b80', '#9aa0b0', '#c9ccd6', '#ffffff',
  '#3b7bff', '#9ec2ff', '#ff7a1a', '#ffb36b',
];

export async function buildWorld({ renderer, post, width, height, heroPos = {}, extraHanzi = [] }) {
  const scene = new THREE.Scene();
  const sky = makeSky(); scene.add(sky);
  scene.add(makeSea(SEA_Y));
  scene.add(makeStrip());
  scene.add(makeMeadow());
  scene.add(makeCliff({ seaY: SEA_Y }));
  scene.add(makeTufts());
  scene.add(makeBoulders());
  scene.add(makeRuins());
  scene.add(makeCypresses({ spots: [
    [-420, -330, 1], [-470, -350, 0.8], [-640, -270, 1.1], [-690, -255, 0.9], [-900, -520, 1.2], [-180, -560, 1], [-1300, -230, 1.0], [-480, -430, 0.9],
    [-1500, -420, 1.3], [-1180, -470, 1.0], [-1230, -500, 0.85], [-2000, -380, 1.2], [-2060, -420, 1.0], [-760, -900, 1.4], [-820, -940, 1.1], [-300, -1200, 1.5],
    [-1600, -1100, 1.6], [-1700, -1150, 1.3], [-2400, -900, 1.6], [200, -800, 1.2], [260, -840, 1.0]] }));
  scene.add(makeIslands({ seaY: SEA_Y }));
  const backdrop = makeBackdrop(); scene.add(backdrop);

  // 画 platform: the level piece the heroes stand on
  const hz = voxelizeHanzi(await loadHanzi('画'), { cells: 128 });
  const huaOrigin = new THREE.Vector3(-22, 0, 0);
  const hua = new HanziVoxels(hz, { voxel: 1, depth: 16, origin: huaOrigin, tipColor: 0xfff0d0 });
  scene.add(hua.mesh);
  // floating calligraphy sculptures
  const floating = [];
  for (const [ch, pos, vox, rotY, depth, rotZ] of [['笔', [-3300, 380, -60], 14, 1.35, 5, 0], ...extraHanzi]) {
    const v = voxelizeHanzi(await loadHanzi(ch), { cells: 64 });
    const h = new HanziVoxels(v, { voxel: vox, depth, origin: new THREE.Vector3(-v.bounds.maxx * vox / 2, 0, 0), seed: 9 });
    const g = new THREE.Group(); g.add(h.mesh); g.position.set(...pos); g.rotation.set(0, rotY, rotZ || 0); scene.add(g); floating.push(g);
  }

  // heroes (full colour, never plaster)
  // real art-dept strips (served live from assets/sprites via sprites.json), voxelised; Jade's hair canon is
  // enforced by Actor.stripFor (hair up when hands are empty, hair down with a pencil in hand)
  const lib = await SpriteLib.load();
  const STRIPS = ['jade_idle', 'jade_run', 'jade_draw_rainbow', 'charlie_idle', 'ricky_idle'];
  await lib.preload(STRIPS);
  const heroes = {};
  for (const n of ['jade', 'charlie', 'ricky']) {
    const g = new Actor(lib, n, { name: n }).voxel({ scale: 1 });
    g.setTime = (t, ph = 0) => g.set({ anim: 'idle', t: t + ph, pencil: false });
    g.setTime(0);
    g.traverse((o) => { if (o.material) o.material.userData.noPaint = true; });
    heroes[n] = g; scene.add(g);
  }
  const jadeX = 30;
  heroes.jade.position.set(...(heroPos.jade || [jadeX, hua.surfaceAt(jadeX, huaOrigin), 0]));
  heroes.charlie.position.set(...(heroPos.charlie || [-62, 0, 0]));
  heroes.ricky.position.set(...(heroPos.ricky || [92, 0, 0]));
  if (heroPos.rotY) Object.values(heroes).forEach((h, i) => (h.rotation.y = heroPos.rotY[i] ?? 0));

  // lights: low warm sun + sky IBL + warm bounce hemisphere + soft camera-side fill
  const sun = new THREE.DirectionalLight(new THREE.Color(1.0, 0.74, 0.46), 3);
  sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096);
  sun.shadow.bias = -0.0003; sun.shadow.normalBias = 0.8; sun.shadow.radius = 3;
  const sunTarget = new THREE.Object3D(); scene.add(sunTarget); sun.target = sunTarget; scene.add(sun);
  const hemi = new THREE.HemisphereLight(new THREE.Color(0.50, 0.60, 0.90), new THREE.Color(0.80, 0.58, 0.36), 1.0);
  scene.add(hemi);
  const fill = new THREE.DirectionalLight(new THREE.Color(1.0, 0.85, 0.7), 0); scene.add(fill); scene.add(fill.target);

  patchSceneFlat(scene);

  const spriteCols = lib.colors(STRIPS);
  post.setPalette([...PALETTE, ...spriteCols]);
  post.setScene(scene, new THREE.PerspectiveCamera());

  let envSunKey = '';
  function setSun(dir) {
    envUniforms.uSunDir.value.copy(dir).normalize();
    const key = envUniforms.uSunDir.value.toArray().map((v) => v.toFixed(4)).join();
    if (key !== envSunKey) { // regenerate IBL only when the sun moves (deterministic either way)
      if (scene.environment) scene.environment.dispose();
      scene.environment = makeEnvironment(renderer); envSunKey = key;
    }
  }

  /**
   * L: { flat, light, shadow, tone, palette, pix, outline, bloom, dof, grade, atmos, rays, ao, exposure }
   * cam: { camera, target (Vector3), dist (dolly distance), focus (Vector3), shadowExtent }
   */
  function applyLook(t, L, { camera, target, dist, focus, shadowExtent = 700, virtFov = 0, distOffset = 0 }) {
    envUniforms.uTime.value = t;
    G.uFlat.value = L.flat;
    G.uValueKeep.value = lerp(0.9, 0.35, L.light); // the 2D draft keeps more value contrast
    sun.intensity = lerp(0.0, 3.6, L.light);
    hemi.intensity = lerp(1.0, 0.45, L.light);
    scene.environmentIntensity = lerp(0.0, 0.75, L.light);
    sun.shadow.intensity = L.shadow;
    const sd = envUniforms.uSunDir.value;
    sunTarget.position.copy(target); sun.position.copy(target).addScaledVector(sd, 3000);
    const sc = sun.shadow.camera; sc.left = sc.bottom = -shadowExtent; sc.right = sc.top = shadowExtent; sc.near = 10; sc.far = 6000; sc.updateProjectionMatrix();
    sunTarget.updateMatrixWorld(); sun.updateMatrixWorld();
    // soft fill from just behind/above the camera so backlit voxel heroes keep their colours
    fill.intensity = (L.fill ?? 0.55) * L.light; fill.position.copy(camera.position).add(new THREE.Vector3(0, 200, 0)); fill.target.position.copy(target); fill.updateMatrixWorld(); fill.target.updateMatrixWorld();

    // sky: virtual FOV in near-ortho mode, real directions in 3D
    const sm = sky.material.uniforms;
    const fwd = new THREE.Vector3(); camera.getWorldDirection(fwd);
    const right = new THREE.Vector3().crossVectors(fwd, camera.up).normalize();
    const up = new THREE.Vector3().crossVectors(right, fwd).normalize();
    sm.uCamFwd.value.copy(fwd); sm.uCamRight.value.copy(right); sm.uCamUp.value.copy(up);
    sm.uAspect.value = width / height;
    const fovRad = (camera.isPerspectiveCamera ? camera.fov : 0) * Math.PI / 180;
    sm.uVirtFov.value = lerp(fovRad, 0.75, virtFov); sm.uVirtMix.value = virtFov; sm.uSkyLift.value = 0.12 * virtFov;

    const F = post.finalMat.uniforms;
    F.uPix.value = L.pix; F.uPalMix.value = L.palette; F.uDither.value = 0.35; F.uOutline.value = L.outline; F.uOutlineDepth.value = 6;
    F.uTone.value = L.tone; F.uExposure.value = L.exposure ?? lerp(0.82, 0.6, L.light); F.uVignette.value = 0.38 * L.grade; F.uGrain.value = 0.016 * L.grade; F.uTime.value = t;
    F.uGrade.value = L.grade; F.uSat.value = lerp(1.0, 1.12, L.grade); F.uContrast.value = lerp(1.0, 1.07, L.grade);
    post.params.bloom = 0.35 * L.bloom; post.bloom.threshold = 1.2; post.bloom.radius = 0.6;
    post.params.dof = (L.dofAmount ?? 0.4) * L.dof; post.params.focus = camera.position.distanceTo(focus); post.dofMat.uniforms.uMaxR.value = 7;
    post.params.ao = L.ao; post.params.atmos = L.atmos; post.params.rays = L.rays; post.params.distOffset = distOffset;
    void dist;
  }

  return { scene, sky, backdrop, hua, hz, huaOrigin, heroes, floating, sun, hemi, fill, setSun, applyLook };
}
