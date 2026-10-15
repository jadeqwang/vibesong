// Dev test for R-C2: voxel heroes with back-view strips, orbiting camera (front -> 3/4 -> behind).
import * as THREE from 'three';
import { Actor } from '../../core/sprites.js';
export async function setup(ctx) {
  const scene = new THREE.Scene(); scene.background = new THREE.Color('#9fb8d8');
  scene.add(new THREE.HemisphereLight(0xdde8ff, 0x8a7050, 1.6)); const sun = new THREE.DirectionalLight(0xfff0dd, 2.2); sun.position.set(80, 120, 60); scene.add(sun);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), new THREE.MeshStandardMaterial({ color: '#d8ccb4' })); ground.rotation.x = -Math.PI / 2; scene.add(ground);
  const heroes = ['charlie', 'jade', 'ricky'].map((n, i) => { const g = new Actor(ctx.lib, n, { name: n }).voxel({ back: true }); g.set({ x: (i - 1) * 40, y: 0, anim: 'idle', t: 0, pencil: false }); scene.add(g); return g; });
  const cam = new THREE.PerspectiveCamera(35, ctx.width / ctx.height, 1, 2000);
  const t0 = ctx.entry.t0;
  return {
    stage: { kind: '3d', fx: { flash: 0, fade: 0 } },
    update(t) { const a = (t - t0) / 6 * Math.PI * 2 * 0.5; cam.position.set(Math.sin(a) * 170, 50, Math.cos(a) * 170); cam.lookAt(0, 22, 0); },
    render(t, target) { ctx.renderer.setRenderTarget(target); ctx.renderer.render(scene, cam); },
  };
}
