// Full-resolution screen overlay for ACT IV (3D + PAPER shots): subtitles, placeholder labels, hero type.
// Everything is canvas-rasterised at OUTPUT resolution (smooth fonts: LXGW WenKai 'kai' = handwritten, Inter 'sans'),
// cached by content, drawn by an ortho camera in output pixels after the post pass. Texels pass through raw
// (sRGB bytes in, sRGB bytes out) so it looks identical on the canvas and inside transition targets.
import * as THREE from 'three';
import { subtitleFor } from '../../core/ui.js';
import { SUBS } from '../../show/subtitles.js';
import * as T from '../../show/timing.js';

const FONT = { kai: '"LXGWWenKai"', sans: '"InterVar", "LXGWWenKai"' };

const RAW_VS = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }';
const RAW_FS = 'uniform sampler2D map; uniform float opacity; varying vec2 vUv; void main(){ vec4 c = texture2D(map, vUv); gl_FragColor = vec4(c.rgb, c.a * opacity); }';

export class Overlay {
  constructor(ctx) {
    this.W = ctx.width; this.H = ctx.height; this.r = ctx.renderer;
    this.scene = new THREE.Scene();
    this.cam = new THREE.OrthographicCamera(0, this.W, this.H, 0, -10, 10);
    this.items = new Map();
  }
  /** a reusable quad keyed by name; draw(g, w, h) paints the canvas when `key` changes */
  item(name) {
    if (!this.items.has(name)) {
      const mat = new THREE.ShaderMaterial({ uniforms: { map: { value: null }, opacity: { value: 1 } }, vertexShader: RAW_VS, fragmentShader: RAW_FS, transparent: true, depthTest: false, depthWrite: false,
        blending: THREE.CustomBlending, blendSrc: THREE.SrcAlphaFactor, blendDst: THREE.OneMinusSrcAlphaFactor, blendSrcAlpha: THREE.OneFactor, blendDstAlpha: THREE.OneMinusSrcAlphaFactor });
      const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1).translate(0.5, 0.5, 0), mat); m.frustumCulled = false;
      m.userData = { key: null, cv: document.createElement('canvas'), tex: null };
      this.scene.add(m); this.items.set(name, m);
    }
    return this.items.get(name);
  }
  hideAll() { for (const m of this.items.values()) m.visible = false; }
  /** show item at (x, y) bottom-left in px with canvas size w x h; repaint only when key changes */
  show(name, key, w, h, x, y, draw, { opacity = 1, renderOrder = 0, scale = 1, anchor = [0, 0] } = {}) {
    const m = this.item(name); const U = m.userData;
    w = Math.max(2, Math.ceil(w)); h = Math.max(2, Math.ceil(h));
    if (U.key !== key || U.cv.width !== w || U.cv.height !== h) {
      U.cv.width = w; U.cv.height = h; const g = U.cv.getContext('2d'); g.clearRect(0, 0, w, h); draw(g, w, h);
      if (U.tex) U.tex.dispose();
      U.tex = new THREE.CanvasTexture(U.cv); U.tex.colorSpace = THREE.NoColorSpace; U.tex.minFilter = THREE.LinearFilter; U.tex.generateMipmaps = false;
      m.material.uniforms.map.value = U.tex; U.key = key;
    }
    m.visible = true; m.material.uniforms.opacity.value = opacity; m.renderOrder = renderOrder;
    m.scale.set(w * scale, h * scale, 1); m.position.set(Math.round(x - anchor[0] * w * scale), Math.round(y - anchor[1] * h * scale), 0);
    return m;
  }
  render(target) {
    const r = this.r; r.setRenderTarget(target); const ac = r.autoClear; r.autoClear = false; r.clearDepth();
    r.render(this.scene, this.cam); r.autoClear = ac;
  }

  // ------------------------------------------------------------------ subtitles (both directions, one slot)
  /** style: 'hand' (PAPER / bridge: ink on a torn paper strip) | 'sans' (TALOS 3D: white on a dark box) */
  subtitle(t, ids, style = 'sans', { y = 0.075, x = 0.5, botOnly = [] } = {}) {
    let c = null;
    for (const id of ids) { c = subtitleFor(t, id, { lit: style === 'hand' ? '#1b1b22' : '#ffd23f', unlit: style === 'hand' ? '#9a92a2' : '#ffffff' }); if (c) { if (botOnly.includes(id)) c = { ...c, top: null }; break; } }
    if (!c) { const m = this.items.get('sub'); if (m) m.visible = false; return; }
    const H = this.H, s = H / 1080;
    const topPx = Math.round((style === 'hand' ? 50 : 42) * s), botPx = Math.round((style === 'hand' ? 34 : 30) * s);
    const fTop = `${topPx}px ${FONT[style === 'hand' ? 'kai' : 'sans']}`, fBot = `${style === 'hand' ? 'italic ' : ''}${botPx}px ${FONT[style === 'hand' ? 'kai' : 'sans']}`;
    const meas = document.createElement('canvas').getContext('2d');
    meas.font = fTop; const topW = c.top ? c.top.reduce((a, sp) => a + meas.measureText(sp.text).width, 0) : 0;
    meas.font = fBot; const botW = c.bot ? meas.measureText(c.bot).width : 0;
    const padX = 34 * s, padY = 14 * s, gap = 8 * s;
    const w = Math.max(topW, botW) + padX * 2, h = (c.top ? topPx * 1.25 : 0) + (c.bot ? botPx * 1.25 + gap : 0) + padY * 2;
    const key = style + JSON.stringify(c) + this.H;
    this.show('sub', key, w, h, this.W * x, H * y, (g, cw, ch) => {
      if (style === 'hand') {
        // torn paper strip: cream with a ragged edge and pencil grain
        g.fillStyle = 'rgba(250,244,230,0.93)'; g.beginPath();
        const n = 28; g.moveTo(0, 6 * s);
        for (let i = 0; i <= n; i++) g.lineTo(cw * i / n, (i % 2 ? 2 : 7) * s * (0.6 + 0.4 * Math.abs(Math.sin(i * 7.1))));
        for (let i = n; i >= 0; i--) g.lineTo(cw * i / n, ch - (i % 2 ? 3 : 8) * s * (0.6 + 0.4 * Math.abs(Math.sin(i * 3.3))));
        g.closePath(); g.fill();
        g.fillStyle = 'rgba(120,100,80,0.07)'; for (let i = 0; i < 400; i++) g.fillRect((i * 97.3) % cw, (i * 53.7) % ch, 2 * s, 1 * s);
      } else {
        g.fillStyle = 'rgba(13,16,34,0.62)'; const r = 10 * s; g.beginPath(); g.roundRect(0, 0, cw, ch, r); g.fill();
      }
      let yy = padY;
      if (c.top) {
        g.font = fTop; g.textBaseline = 'top'; let x = (cw - topW) / 2;
        for (const sp of c.top) {
          if (style !== 'hand') { g.fillStyle = 'rgba(0,0,0,0.55)'; g.fillText(sp.text, x + 2 * s, yy + 2 * s); }
          g.fillStyle = sp.color; g.fillText(sp.text, x, yy); x += g.measureText(sp.text).width;
        }
        yy += topPx * 1.25 + gap;
      }
      if (c.bot) { g.font = fBot; g.textBaseline = 'top'; g.fillStyle = style === 'hand' ? '#5d5466' : '#c9d6ff'; g.fillText(c.bot, (cw - botW) / 2, yy); }
    }, { anchor: [0.5, 0], renderOrder: 30 });
  }

  // ------------------------------------------------------------------ placeholder label (AI clip slot)
  placeholder(id, tin, tout, note, { right = false } = {}) {
    const s = this.H / 1080; const f1 = `600 ${Math.round(30 * s)}px ${FONT.sans}`, f2 = `${Math.round(20 * s)}px ${FONT.sans}`;
    const l1 = `PLACEHOLDER: ${id}`, l2 = `${tin.toFixed(3)} → ${tout.toFixed(3)} s · ${note}`;
    const meas = document.createElement('canvas').getContext('2d'); meas.font = f1; const w1 = meas.measureText(l1).width; meas.font = f2; const w2 = meas.measureText(l2).width;
    const w = Math.max(w1, w2) + 36 * s, h = 86 * s;
    this.show('ph_' + id, l1 + l2 + this.H, w, h, right ? this.W - 24 * s - w : 24 * s, this.H - 24 * s - h, (g, cw, ch) => {
      g.fillStyle = 'rgba(200,30,50,0.86)'; g.beginPath(); g.roundRect(0, 0, cw, ch, 8 * s); g.fill();
      g.fillStyle = '#fff'; g.textBaseline = 'top'; g.font = f1; g.fillText(l1, 18 * s, 12 * s); g.font = f2; g.fillStyle = '#ffe2e6'; g.fillText(l2, 18 * s, 52 * s);
    }, { renderOrder: 50 });
  }

  // ------------------------------------------------------------------ big brush characters (chant slams)
  /** chars: [{ ch, t }]; stamps each char with a scale punch at its time; returns nothing */
  stampChars(t, name, chars, { y = 0.55, size = 0.3, color = '#ffffff', stroke = '#1b1b22', gap = 0.02, rainbow = false } = {}) {
    const s = this.H; const px = Math.round(size * s);
    chars.forEach((c, i) => {
      const since = t - T.snap(c.t);
      const m = this.items.get(name + i);
      if (since < 0) { if (m) m.visible = false; return; }
      const k = [1.45, 1.18, 1.05, 1][Math.min(3, Math.floor(since * T.fps()))];
      const n = chars.length, cx = this.W / 2 + (i - (n - 1) / 2) * px * (1 + gap);
      this.show(name + i, c.ch + px + color + rainbow, px * 1.2, px * 1.2, cx, s * y, (g, w, h) => {
        g.font = `${px}px ${FONT.kai}`; g.textAlign = 'center'; g.textBaseline = 'middle';
        g.lineJoin = 'round'; g.lineWidth = px * 0.09; g.strokeStyle = stroke; g.strokeText(c.ch, w / 2, h / 2 + px * 0.04);
        if (rainbow) { const gr = g.createLinearGradient(0, 0, w, h); ['#ff4d6d', '#ffb02e', '#ffe14d', '#4fd06a', '#2bb4e8', '#6a5cff', '#e858d0'].forEach((cc, k2) => gr.addColorStop(k2 / 6, cc)); g.fillStyle = gr; }
        else g.fillStyle = color;
        g.fillText(c.ch, w / 2, h / 2 + px * 0.04);
      }, { anchor: [0.5, 0.5], scale: k, renderOrder: 40 });
    });
  }
}

export const hasSub = (id) => !!SUBS[id];
