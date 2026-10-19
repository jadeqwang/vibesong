// Dev turntable for the sculpted voxel heroes (core/voxfig.js, density team). t - t0:
//   0..8   orbit 360 deg, idle (Jade hair up)       8..16  orbit, run (Jade hair down, pencils)
//   16..   pose gallery every 1.5 s: sing / draw_rainbow / chord / throw / parachute / jump / victory / back_run
import * as THREE from 'three';
import { Actor } from '../../core/sprites.js';
const GALLERY = [['sing', 'idle', 'chord'], ['draw_rainbow', 'idle!', 'sustain'], ['drum', 'parachute', 'victory'], ['jump', 'trampoline', 'jump'], ['back', 'back', 'back'], ['back_run_pencil', 'back_run', 'back_run'], ['victory', 'shield', 'run'], ['draw_graphite', 'pull', 'idle']];
export async function setup(ctx) {
  const scene = new THREE.Scene(); scene.background = new THREE.Color('#c9d6e6');
  scene.add(new THREE.HemisphereLight(0xdde8ff, 0x8a7050, 1.3)); const sun = new THREE.DirectionalLight(0xfff0dd, 2.4); sun.position.set(90, 140, 120); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -0.0005; sun.shadow.normalBias = 0.3;
  Object.assign(sun.shadow.camera, { left: -120, right: 120, top: 120, bottom: -120 }); scene.add(sun);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(600, 600), new THREE.MeshStandardMaterial({ color: '#e8dcc6' })); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
  const names = ['jade', 'charlie', 'ricky'];
  const heroes = names.map((n) => { const g = new Actor(ctx.lib, n, { name: n }).voxel({}); scene.add(g); return g; });
  const cam = new THREE.PerspectiveCamera(30, ctx.width / ctx.height, 1, 3000);
  const t0 = ctx.entry.t0;
  return {
    stage: { kind: '3d', fx: { flash: 0, fade: 0 } },
    update(t) {
      const u = t - t0; let a = 0, anims = ['idle', 'idle', 'idle'], pencil = false, tt = u;
      if (u < 8) a = u / 8 * Math.PI * 2; else if (u < 16) { a = (u - 8) / 8 * Math.PI * 2; anims = ['run', 'run', 'run']; pencil = true; }
      else { const k = Math.floor((u - 16) / 1.5); anims = GALLERY[k % GALLERY.length]; a = 0.55; tt = (u - 16) % 1.5; pencil = /pencil|sing|draw|drum/.test(anims[0]); }
      heroes.forEach((g, i) => { const a = anims[i].replace('!', ''); g.set({ x: (i - 1) * 46, y: 0, anim: a, t: tt, pencil: i === 0 ? pencil : false, facing: 1, hat: anims[i].endsWith('!') ? false : undefined }); });
      if (u >= 32) { // front portraits: all three, hat on (32-33) / Charlie hatless (33-34)
        heroes.forEach((g, i) => { g.visible = true; g.set({ x: (i - 1) * 40, y: 0, anim: 'idle', t: 0, facing: 1, pencil: false, hat: u >= 33 && i === 1 ? false : undefined }); g.rotation.y = -Math.PI / 2 + 0.25; });
        cam.position.set(0, 44, 150); cam.lookAt(0, 32, 0); return; }
      heroes.forEach((g) => { g.rotation.y = 0; });
      if (u >= 30) { // close-up: Ricky with the Strat (idle / chord / sustain, 0.66 s each), 3/4 front-right
        const P3 = ['idle', 'chord', 'sustain']; const k = Math.min(2, Math.floor((u - 30) / 0.667));
        heroes.forEach((g, i) => { g.visible = i === 2; }); heroes[2].set({ x: 0, y: 0, anim: P3[k], t: (u - 30) % 0.667, facing: 1 });
        cam.position.set(58, 36, 52); cam.lookAt(0, 26, 0); return; }
      if (u >= 28.5) { // close-up: Charlie's head at 3/4 (hat on, then hat off)
        heroes.forEach((g, i) => { g.visible = i === 1; }); heroes[1].set({ x: 0, y: 0, anim: 'idle', t: 0, facing: 1, hat: u < 29.25 ? undefined : false });
        const a2 = u < 29.25 ? 0.75 : -0.75; cam.position.set(Math.cos(a2) * 55, 44, Math.sin(a2) * 55); cam.lookAt(0, 40, 0); return; }
      if (u >= 26) { // close-up: Jade alone, pencil poses (each 0.5 s), camera 3/4 front-left then front-right
        const P2 = ['sing', 'draw_rainbow', 'draw_graphite', 'drum']; const k = Math.floor((u - 26) / 0.5) % 4; const side = Math.floor((u - 26) / 2) % 2 ? -1 : 1;
        heroes.forEach((g, i) => { g.visible = i === 0; }); heroes[0].set({ x: 0, y: 0, anim: P2[k], t: 0.1, pencil: true, facing: 1 });
        cam.position.set(60, 34, side * 55); cam.lookAt(0, 26, 0); return; }
      heroes.forEach((g) => { g.visible = true; });
      const R = (globalThis.__FIGR || 120); cam.position.set(Math.sin(a) * R, 40, Math.cos(a) * R); cam.lookAt(0, 24, 0);
    },
    render(t, target) { ctx.renderer.shadowMap.enabled = true; ctx.renderer.setRenderTarget(target); ctx.renderer.render(scene, cam); },
  };
}
