// ACT IV · FLASH-RECAP MONTAGE (168.075 – 172.795): one cut per measured 8th through every look of the video,
// pixel -> void -> plaster -> paper -> colour. Every cut is a REAL callback frame: the montage re-renders the show's
// own scene entries at the callback time (frames are pure functions of t, so this is exact). If an entry for a
// callback time isn't in the show yet (other acts in progress), the cut falls back to an Act IV world frame with the
// matching look. Paper cuts use the v5 paper sheet stills.
import * as T from '../../show/timing.js';
import * as THREE from 'three';
import { buildPaper } from './paper.js';
import { Subtitle, subtitleFor } from '../../core/ui.js';
import { SmoothSubs } from '../act3/common.js';
import { getWorld as getAct4World } from './world4.js';
import { CUTS, makeAct4HUD } from './hud2d.js';   // (act4 M2) the SPEEDRUN: split timer + the bar on every cut, the cart in the frames

// callback times on the song timeline, in recap order: CUTS lives in hud2d.js (the speedrun splits are named from it)
// fallbacks (own Act IV frames that carry the look) when a callback entry doesn't exist yet
const FALLBACK = { pixel: [139.45], void: [131.0], plaster: [124.0], color: [157.3] };

const PAPER = {
  lineup: { frames: [{ id: 'recap_lineup', img: 'lineup.jpg', x: 0.5, y: 0.52, h: 0.86, push: [1.06, 1.0], drift: [0, 0], note: '' }] },
  laugh: { frames: [{ id: 'recap_laugh', img: 'jade_laugh.jpg', x: 0.5, y: 0.52, h: 0.84, push: [1.0, 1.08], drift: [0, 0], note: '' }] },
  sing: { frames: [{ id: 'recap_sing', img: 'jade_sing_b.jpg', x: 0.5, y: 0.52, h: 0.84, push: [1.08, 1.0], drift: [0, 0], note: '' }] },
};

export async function setup(ctx) {
  const t0 = ctx.entry.t0, t1 = ctx.entry.t1;
  const cutTimes = T.beatsIn(t0 - 0.02, t1 - 0.05, 2);
  const show = ctx.show; const entries = show.entries || [];
  const own = () => entries.find((e) => e.id === 'act4.main');
  const insts = new Map();
  async function instFor(e) {
    if (e.inst) return e;
    if (insts.has(e.id)) return insts.get(e.id);
    try { const mod = await e.load(); const inst = await mod.setup({ ...ctx, entry: e }); const fake = { ...e, inst }; insts.set(e.id, fake); return fake; }
    catch (err) { console.warn('[act4.montage] callback entry failed', e.id, err.message); insts.set(e.id, null); return null; }
  }
  // the Act IV main entry may not be set up when only the montage range renders
  let ownE = own(); if (ownE && !ownE.inst) ownE = await instFor(ownE);
  const plan = [];
  for (let i = 0; i < cutTimes.length; i++) {
    const c = CUTS[i % CUTS.length];
    if (c.paper) { plan.push({ kind: 'paper', P: await buildPaper(ctx, PAPER[c.paper]), c }); continue; }
    let e = null;
    if (!c.own) {
      const src = entries.find((x) => !x.id.startsWith('act4.') && c.t >= x.t0 && c.t < x.t1);
      if (src) e = await instFor(src);
    }
    if (e) plan.push({ kind: 'entry', e, t: c.t });
    else if (ownE) plan.push({ kind: 'entry', e: ownE, t: c.own ? c.t : FALLBACK[c.look][0] + (i % 3) * 0.37 });
  }
  // render another team's entry at a callback time WITHOUT its own subtitles (they would be from another moment)
  const W4 = await getAct4World(ctx);
  const hud = makeAct4HUD(ctx);
  // (act4 M2) a 3D callback frame (Act III's shared world): the party cart blasts across in front of that scene's own camera
  const placeCartM = (camera, u) => {
    camera.updateMatrixWorld(); const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion), right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
    const d = 230; const half = d * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2) * camera.aspect;
    const pos = camera.position.clone().addScaledVector(fwd, d).addScaledVector(right, (u * 3.2 - 1.6) * half).add(new THREE.Vector3(0, -40, 0));
    W4.cartM.visible = true; W4.cartRigM.pose({ pos, yaw: Math.atan2(-right.z, right.x) }, { t: 170, dist: u * 300, glow: 1, flap: 0.3 });
  };
  const renderWithCart = (e, tt, target, u) => renderCallback(e, tt, target, (camera) => placeCartM(camera, u));
  // render another team's entry at a callback time WITHOUT its own UI: its subtitles, captions, HUD panels and battle windows are
  // all drawn with renderer.render() calls AFTER its post.render(), so those are skipped (only the world frame stays);
  // our live lyric line and the speedrun HUD go on top afterwards. cartAt(camera) optionally drops the 3D cart into the frame.
  function renderCallback(e, tt, target, cartAt = null) {
    const inst = e.inst, st = inst.stage, r = ctx.renderer, post = ctx.post;
    if (/^act3\./.test(e.id)) W4.restoreSun();            // the shared world gets its own sun back (Act IV runs at dusk)
    if (st?.beginFrame) st.beginFrame();
    inst.update(tt);
    if (inst.smooth) inst.smooth.set(null);                 // act3 make3D subtitle slot
    const pr = post.render, rr = r.render; let afterPost = false;
    post.render = function (scene, camera, tgt) {
      if (cartAt && scene === W4.W.scene && camera?.isPerspectiveCamera) cartAt(camera);
      const out = pr.call(this, scene, camera, tgt); W4.cartM.visible = false; afterPost = true; return out; };
    r.render = function (scene, camera) { if (afterPost) return; return rr.call(this, scene, camera); };
    try {
      if (inst.render) return inst.render(tt, target);
      if (st?.kind === '2d') {
        ctx.post.set2D({ pix: st.pix(ctx.height), palMix: st.look.palMix, dither: st.look.dither });
        if (st.look.palette) ctx.post.setPalette(st.look.palette);
        st.cam.apply(); ctx.post.render(st.scene, st.cam.cam, target);
      }
    } finally { post.render = pr; r.render = rr; W4.cartM.visible = false; }
  }
  const LIVE = [42, 43];
  const smooth = new SmoothSubs(ctx.width, ctx.height); const ui = new THREE.Scene(); ui.add(smooth.mesh);
  const uiCam = new THREE.OrthographicCamera(0, ctx.width, ctx.height, 0, -10, 10);
  let cur = null; const fx = { flash: 0, fade: 0, flashColor: '#ffffff', fadeColor: '#000000' };
  return {
    stage: { kind: '3d', fx },
    update(t) {
      let k = 0; for (let i = 0; i < cutTimes.length; i++) if (t >= T.snap(cutTimes[i])) k = i;
      cur = plan[Math.min(k, plan.length - 1)];
      fx.flash = T.exactFrame(t, cutTimes) ? 0.22 : 0; fx.fade = 0;
      if (cur?.kind === 'paper') cur.P.update(t, T.snap(cutTimes[k]), T.snap(cutTimes[k]) + 0.2, { labels: false, subs: false });
      cur.u = T.clamp01((t - T.snap(cutTimes[k])) / Math.max(0.1, (cutTimes[k + 1] ?? (cutTimes[k] + 0.2)) - cutTimes[k]));   // (act4 M2) progress through this cut
      cur.local = cur.kind === 'entry' ? cur.t + (t - T.snap(cutTimes[k])) * 0.6 : t;  // a few frames of motion inside each cut
    },
    render(t, target) {
      if (!cur) return;
      const is2D = cur.kind === 'entry' && cur.e.inst?.stage?.kind === '2d';
      if (cur.kind === 'paper') cur.P.render(target);
      else if (cur.e.id.startsWith('act4.')) {
        cur.e.inst.suppressSubs = true;           // callback frames carry no subtitles of their own time
        cur.e.inst.noHUD = true; cur.e.inst.callback = true; cur.e.inst.cartFly = cur.t < 160 ? cur.u : null;   // (act4 M2) the cart crosses (164.2 / 166.4 have the real one)
        show.renderEntry(cur.e, cur.local, target);
        cur.e.inst.suppressSubs = false; cur.e.inst.noHUD = false; cur.e.inst.callback = false; cur.e.inst.cartFly = null;
      } else if (is2D) renderCallback(cur.e, cur.local, target);
      else renderWithCart(cur.e, cur.local, target, cur.u);
      // only the LIVE sung line (the 一切从这里出发! chant) is subtitled over the recap
      const c = LIVE.map((id) => subtitleFor(t, id, { lit: '#ffd23f', unlit: '#ffffff', hold: 0.25 })).find(Boolean);
      smooth.set(c || null, 'bottom');
      if (c) { const r = ctx.renderer; r.setRenderTarget(target); r.autoClear = false; r.clearDepth(); r.render(ui, uiCam); r.autoClear = true; }
      // (act4 M2) the speedrun HUD: the bar (the one constant through every cut), the split timer, the pixel cart in 2D callbacks
      hud.update(t, { cart2d: is2D ? cur.u : null }); hud.render(ctx.renderer, target);
    },
  };
}
