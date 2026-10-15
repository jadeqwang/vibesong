// Dev test for VideoClip (R-C1): shows a media clip frame-exact on a Quad.
import { Stage2D, Z } from '../../core/stage2d.js';
import { Quad } from '../../core/gfx.js';
import { VideoClip } from '../../core/video.js';
import { TextSprite } from '../../core/text.js';
export async function setup(ctx) {
  const st = new Stage2D(ctx, { bg: '#202020' });
  const src = new URLSearchParams(location.search).get('clip') || window.__CLIP__ || '/media/gen/act5_resolve_d3047b1d97.mp4';
  const v = await VideoClip.load(src);
  const q = st.add(new Quad(v.textureAt(0), 240, 135), Z.PROP); q.place(40, 30);
  const lab = st.addUI(new TextSprite({ text: '', font: 'fp12', color: '#ffffff' }), 50); lab.place(4, 166);
  return { stage: st, update(t) { const dt = t - ctx.entry.t0; q.material.setMap(v.textureAt(dt)); lab.set({ text: `frame ${v.frameIndex(dt)} / ${v.n} @ ${v.fps}fps` }); } };
}
