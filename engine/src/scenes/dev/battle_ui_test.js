// DEV · Battle UI preview (BATTLE UI team). Draws src/show/battle_ui.js over the CURRENT scenes at the same song time:
// act3.stage (107.15-110.41), act3.rap (110.41-123.354), act4.main (123.354-...), with their own subtitles suppressed
// wherever battleOwnsSubs(t) (exactly what the real scenes will do). ?plate=1 (or window.__BATTLE_PLATE__) uses the
// mock clean plates (out/mocks/half2/*_clean.png) instead of the 3D scenes. Floating tags use DEFAULT_ANCHORS here.
// Registered only in the 'dev' show: dev.battle_a [106, 124.6) and dev.battle_b [143, 155).
import * as THREE from 'three';
import { makeBattleUI, battleOwnsSubs } from '../../show/battle_ui.js';
import { loadImage } from '../../core/gfx.js';

const PLATES = [[0, 'm1_encounter_clean.png'], [116.88, 'm2_triple_tech_clean.png'], [121.0, 'm3_recruit_clean.png'], [140, 'm3_recruit_clean.png']];

export async function setup(ctx) {
  const { renderer, width, height } = ctx; const e = ctx.entry;
  const bui = await makeBattleUI(ctx, { fallbackAnchors: true });
  const usePlate = new URLSearchParams(location.search).get('plate') === '1' || window.__BATTLE_PLATE__;
  const bases = [];   // [t0, t1, inst, kind]
  let plate = null;
  if (usePlate) {
    const scene = new THREE.Scene(); const cam = new THREE.OrthographicCamera(0, 1, 1, 0, -1, 1);
    const texs = await Promise.all(PLATES.map(async ([t0, f]) => { const tx = new THREE.Texture(await loadImage('/out/mocks/half2/' + f)); tx.needsUpdate = true; tx.colorSpace = THREE.SRGBColorSpace; return [t0, tx]; }));
    const mat = new THREE.MeshBasicMaterial({ map: texs[0][1], depthTest: false }); const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat); m.position.set(0.5, 0.5, 0); scene.add(m);
    plate = { scene, cam, mat, texs };
  } else {
    const sub = (id, t0, t1) => ({ ...ctx, entry: { id, t0, t1 } });
    if (e.t0 < 110.41) bases.push([107.15, 110.41, await (await import('../act3/stage.js')).setup(sub('act3.stage', 107.15, 110.41)), 'make3D']);
    if (e.t0 < 123.354 && e.t1 > 110.41) bases.push([110.41, 123.354, await (await import('../act3/rap.js')).setup(sub('act3.rap', 110.41, 123.354)), 'make3D']);
    if (e.t1 > 123.354) bases.push([123.354, 173.02, await (await import('../act4/main3d.js')).setup(sub('act4.main', 123.354, 173.02)), 'act4']);
    if (e.t0 < 107.15) bases[0][0] = e.t0;   // the stage scene also holds the frames before 107.15 in this preview
  }
  const fx = { flash: 0, flashColor: '#ffffff', fade: 0, fadeColor: '#000000' };
  let cur = null;
  return {
    stage: { kind: '3d', fx, beginFrame() { fx.flash = 0; fx.fade = 0; } },
    update(t) {
      if (plate) { let tx = plate.texs[0][1]; for (const [t0, x] of plate.texs) if (t >= t0) tx = x; plate.mat.map = tx; }
      else {
        cur = bases.find(([a, b]) => t >= a && t < b) || bases[bases.length - 1];
        const [, , inst, kind] = cur;
        if (kind === 'act4') inst.suppressSubs = battleOwnsSubs(t);
        if (inst.stage?.beginFrame) inst.stage.beginFrame();
        inst.update(t);
        if (kind === 'make3D' && battleOwnsSubs(t)) inst.smooth.set(null);   // = frame() returning noSubs: battleOwnsSubs(t)
        Object.assign(fx, { flash: inst.stage.fx.flash, flashColor: inst.stage.fx.flashColor, fade: inst.stage.fx.fade, fadeColor: inst.stage.fx.fadeColor });
      }
      bui.update(t);
    },
    render(t, target) {
      if (plate) { renderer.setRenderTarget(target); renderer.render(plate.scene, plate.cam); }
      else cur[2].render(t, target);
      bui.render(renderer, target);
    },
  };
}
