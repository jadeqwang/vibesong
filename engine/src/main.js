// Browser entry. Exposes window.ENGINE for the headless renderer (render.js):
//   await ENGINE.init({ show:'main' | scene:'turn_demo', width, height, fps, from, to })
//   await ENGINE.render(t)          t in seconds on the song timeline, fully deterministic
//   await ENGINE.readPixels()       base64 raw RGBA (bottom-up rows) of the canvas -> piped into ffmpeg
//   await ENGINE.capture()          base64 PNG of the canvas
//   ENGINE.sheetTimes/sheetBegin/sheetAdd/sheetEnd   contact sheet (one frame per beat) built in-page
//   ENGINE.gpu()                    WebGL UNMASKED_RENDERER string
// Preview: http://localhost:8123/web/?show=main&t=2.5&w=960&h=540  (&live=1&from=0 to play in real time)
import * as THREE from 'three';
import { Post } from './post.js';
import { scenes } from './scenes/index.js';
import { ShowRunner } from './core/show.js';
import * as T from './show/timing.js';

const qs = new URLSearchParams(location.search);
// determinism: some three/addons (e.g. GTAO's SimplexNoise) call Math.random -> seed it
{ let a = 0x9e3779b9; Math.random = () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

const ENGINE = {
  async init(o = {}) {
    if (typeof o === 'string') o = { scene: o, ...(arguments[1] || {}) };
    const { width = 1920, height = 1080, fps = 30, shot } = o;
    this.W = width; this.H = height;
    const renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(1); renderer.setSize(width, height);
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.NoToneMapping; // tone mapping happens in the final post pass
    document.body.appendChild(renderer.domElement);
    this.renderer = renderer;
    this.post = new Post(renderer, width, height);
    await T.load(); T.setFps(fps);
    if (o.show) {
      this.runner = new ShowRunner({ renderer, post: this.post, width, height, fps });
      await this.runner.load(o.show, o.from ?? 0, o.to ?? 1e9);
      return { duration: this.runner.duration };
    }
    const mod = scenes[o.scene]; if (!mod) throw new Error('unknown scene ' + o.scene);
    this.sc = await mod.setup({ renderer, post: this.post, width, height, shot });
    for (const t of this.sc.warmup || [0]) { this.sc.update(t); this.post.render(this.sc.scene, this.sc.camera); }
    return { duration: this.sc.duration };
  },
  async render(t) {
    if (this.runner) { await this.runner.prepare(t); this.runner.render(t); }
    else { this.sc.update(t); this.post.render(this.sc.scene, this.sc.camera); }
    this.renderer.getContext().finish();
  },
  async readPixels() {
    const gl = this.renderer.getContext();
    if (!this._px) this._px = new Uint8Array(this.W * this.H * 4);
    gl.readPixels(0, 0, this.W, this.H, gl.RGBA, gl.UNSIGNED_BYTE, this._px);
    const url = await new Promise((res) => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.readAsDataURL(new Blob([this._px])); });
    return url.slice(url.indexOf(',') + 1);
  },
  async capture() {
    const blob = await new Promise((res) => this.renderer.domElement.toBlob(res, 'image/png'));
    const url = await new Promise((res) => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.readAsDataURL(blob); });
    return url.slice(url.indexOf(',') + 1);
  },
  // ---------------------------------------------------------------- contact sheet
  sheetTimes(a, b, every = 'beat') {
    let ts;
    if (every === 'beat') ts = T.beatsIn(a, b, 1);
    else if (every === 'bar') ts = T.beatsIn(a, b, 0.25);
    else { ts = []; for (let t = a; t < b; t += +every) ts.push(t); }
    if (!ts.length || ts[0] - a > 0.15) ts.unshift(a);
    return ts.filter((t) => Math.round(t * T.fps()) < Math.round(b * T.fps()));
  },
  sheetBegin(n, cols, tw) {
    const th = Math.round(tw * this.H / this.W), rows = Math.ceil(n / cols), lab = 16;
    const cv = document.createElement('canvas'); cv.width = cols * tw; cv.height = rows * (th + lab);
    const g = cv.getContext('2d'); g.fillStyle = '#111'; g.fillRect(0, 0, cv.width, cv.height);
    this._sheet = { cv, g, cols, tw, th, lab };
  },
  sheetAdd(i, label) {
    const s = this._sheet, x = (i % s.cols) * s.tw, y = Math.floor(i / s.cols) * (s.th + s.lab);
    s.g.imageSmoothingEnabled = true; s.g.drawImage(this.renderer.domElement, x, y + s.lab, s.tw, s.th);
    const t = parseFloat(label); const bb = T.barAt(t + 0.5 / T.fps());
    s.g.fillStyle = '#ddd'; s.g.font = '12px monospace'; s.g.fillText(`${t.toFixed(3)}s  b${bb.bar}.${Math.floor(bb.beat)}`, x + 4, y + 12);
  },
  sheetEnd() { const u = this._sheet.cv.toDataURL('image/jpeg', 0.88); return u.slice(u.indexOf(',') + 1); },
  gpu() {
    const gl = this.renderer.getContext(); const e = gl.getExtension('WEBGL_debug_renderer_info');
    return e ? gl.getParameter(e.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
  },
};
window.ENGINE = ENGINE;

if (qs.get('show') || qs.get('scene')) {
  (async () => {
    const w = +(qs.get('w') || innerWidth), h = +(qs.get('h') || innerHeight);
    const from = +(qs.get('from') || qs.get('t') || 0);
    await ENGINE.init({ show: qs.get('show'), scene: qs.get('scene'), width: w, height: h, from, to: +(qs.get('to') || 1e9), shot: qs.get('shot') || undefined });
    if (qs.get('live')) { const t0 = performance.now(); const loop = () => { ENGINE.render(from + (performance.now() - t0) / 1000); requestAnimationFrame(loop); }; loop(); }
    else ENGINE.render(+(qs.get('t') || 0));
  })();
}
