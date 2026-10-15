#!/usr/bin/env node
// Deterministic headless renderer for the 一笔一画 show (every frame = pure function of t).
//
//   node render.js --show main --from 0 --to 41.03 --fps 30 --res 960x540 --mp4 out/review/act1_v1.mp4 --audio
//   node render.js --show main --from 14 --to 20 --res 960x540 --mp4 out/review/v1_slice.mp4 --audio --sheet out/review/v1_slice_sheet.jpg
//   node render.js --show main --stills 0.343:a.png,2.63:b.png --res 960x540
//   node render.js --show main --from 0 --to 41.03 --sheet out/review/act1_sheet.jpg --sheet-only   (one frame per beat)
//   node render.js --scene turn_demo --from 0 --to 6 --mp4 out/turn_demo.mp4      (legacy single scenes)
//   node render.js --serve            preview server: http://localhost:8123/web/?show=main&t=3.2  (&live=1 loops)
//
// Options: --res WxH (default 1920x1080) | --width --height, --fps (30), --gpu vulkan|gl|swiftshader,
//          --crf (16), --preset (medium), --workers N (split the range over N browsers, then concat),
//          --sheet path.jpg [--sheet-every beat|bar|<seconds>] [--sheet-cols 8] [--sheet-only]
//          --out dir (also write PNG frames; normally frames are piped straight into ffmpeg)
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PROJECT = path.resolve(ROOT, '..');
const SONG = path.join(PROJECT, 'inputs', 'The Vibe Coding song (一笔一画).mp3');
const args = Object.fromEntries(process.argv.slice(2).reduce((a, v, i, arr) => {
  if (v.startsWith('--')) a.push([v.slice(2), arr[i + 1] !== undefined && !arr[i + 1].startsWith('--') ? arr[i + 1] : true]); return a; }, []));
let W = +(args.width || 1920), H = +(args.height || 1080);
if (args.res) [W, H] = String(args.res).split('x').map(Number);
const FPS = +(args.fps || 30);

// ------------------------------------------------------------ hanzi index (lazy)
let hanziIdx = null;
function hanziLine(ch) {
  if (!hanziIdx) {
    hanziIdx = new Map();
    for (const line of fs.readFileSync(path.join(ROOT, 'data', 'graphics.txt'), 'utf8').split('\n')) {
      const m = line.match(/^\{"character":"(.+?)"/); if (m) hanziIdx.set(m[1], line);
    }
  }
  return hanziIdx.get(ch);
}

// ------------------------------------------------------------ static server
// /analysis/* -> ../analysis (timing + lyrics), /sprites/* -> ../assets/sprites (art dept strips, read live
// so updated strips drop in), /hanzi/<char> -> Make Me a Hanzi line, everything else from engine/.
const MIME = { '.js': 'text/javascript', '.html': 'text/html', '.json': 'application/json', '.png': 'image/png', '.css': 'text/css',
  '.ttf': 'font/ttf', '.otf': 'font/otf', '.woff2': 'font/woff2', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.mp4': 'video/mp4', '.webm': 'video/webm', '.webp': 'image/webp' };
const MOUNTS = [['/analysis/', path.join(PROJECT, 'analysis')], ['/sprites/', path.join(PROJECT, 'assets', 'sprites')], ['/media/', path.join(PROJECT, 'media')],
  ['/clipcache/', path.join(ROOT, 'out', 'cache', 'clips')]];
// ------------------------------------------------------------ video clips (R-C1): decode once to a JPEG sequence
// GET /clip?src=/media/clips/x.mp4[&fps=24] -> { n, fps, w, h, base: '/clipcache/<id>/', pattern: 'f_%05d.jpg' }
// Frames are decoded at the clip's own rate (or ?fps=), cached by source path + mtime + fps, never re-decoded.
function clipInfo(src, fpsWant) {
  const mount = MOUNTS.find(([m]) => src.startsWith(m)); if (!mount) throw new Error('clip must be under /media/ or another mount: ' + src);
  const file = path.join(mount[1], src.slice(mount[0].length - 1)); if (!fs.existsSync(file)) throw new Error('no clip ' + file);
  const st = fs.statSync(file);
  const id = (src.replace(/[^a-zA-Z0-9]+/g, '_') + '_' + Math.round(st.mtimeMs) + (fpsWant ? '_' + fpsWant : '')).slice(-120);
  const dir = path.join(ROOT, 'out', 'cache', 'clips', id); const meta = path.join(dir, 'info.json');
  if (fs.existsSync(meta)) return JSON.parse(fs.readFileSync(meta, 'utf8'));
  const ff = findFfmpeg(); fs.mkdirSync(dir, { recursive: true });
  const probe = spawnSync(ff, ['-hide_banner', '-i', file]).stderr.toString();
  const m = probe.match(/(\d+(?:\.\d+)?) fps/); const sz = probe.match(/Video:.*?(\d{2,5})x(\d{2,5})/);
  const fps = fpsWant ? +fpsWant : (m ? +m[1] : 24);
  const r = spawnSync(ff, ['-y', '-v', 'error', '-i', file, ...(fpsWant ? ['-vf', `fps=${fpsWant}`] : []), '-q:v', '2', path.join(dir, 'f_%05d.jpg')], { stdio: 'inherit' });
  if (r.status !== 0) throw new Error('clip decode failed ' + file);
  const n = fs.readdirSync(dir).filter((f) => f.endsWith('.jpg')).length;
  const info = { n, fps, w: sz ? +sz[1] : 0, h: sz ? +sz[2] : 0, base: `/clipcache/${id}/`, pattern: 'f_%05d.jpg', first: 1, src };
  fs.writeFileSync(meta, JSON.stringify(info)); return info;
}
function startServer(port = 0) {
  const srv = http.createServer((req, res) => {
    const url = decodeURIComponent(req.url.split('?')[0]);
    if (url === '/clip') {
      try { const q = new URL(req.url, 'http://x').searchParams; const info = clipInfo(q.get('src'), q.get('fps'));
        res.writeHead(200, { 'content-type': 'application/json' }); return res.end(JSON.stringify(info)); }
      catch (e) { res.writeHead(404); return res.end(String(e.message)); }
    }
    if (url.startsWith('/hanzi/')) {
      const line = hanziLine(url.slice(7));
      if (!line) { res.writeHead(404); return res.end('no such hanzi'); }
      res.writeHead(200, { 'content-type': 'application/json' }); return res.end(line);
    }
    let base = ROOT, rel = url;
    for (const [m, dir] of MOUNTS) if (url.startsWith(m)) { base = dir; rel = url.slice(m.length - 1); }
    let p = path.join(base, path.normalize(rel === '/' ? '/web/index.html' : rel));
    if (rel.endsWith('/')) p = path.join(p, 'index.html');
    if (!p.startsWith(base) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'content-type': MIME[path.extname(p)] || 'application/octet-stream', 'cache-control': 'no-store' });
    fs.createReadStream(p).pipe(res);
  });
  return new Promise((r) => srv.listen(port, '127.0.0.1', () => r(srv)));
}

// ------------------------------------------------------------ browser
const GPU_FLAGS = {
  vulkan: ['--use-angle=vulkan', '--enable-features=Vulkan', '--ignore-gpu-blocklist', '--enable-gpu'],
  gl: ['--use-angle=gl', '--ignore-gpu-blocklist', '--enable-gpu'],
  swiftshader: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
};
async function launch(mode) {
  const modes = mode ? [mode] : ['vulkan', 'gl', 'swiftshader'];
  for (const m of modes) {
    const browser = await puppeteer.launch({
      executablePath: process.env.CHROME || '/usr/bin/google-chrome', headless: 'new',
      args: ['--no-sandbox', '--hide-scrollbars', `--window-size=${W},${H}`, '--disable-gpu-watchdog', '--font-render-hinting=none', ...GPU_FLAGS[m]],
      protocolTimeout: 900000,
    });
    const page = await browser.newPage();
    const ok = await page.evaluate(() => !!document.createElement('canvas').getContext('webgl2')).catch(() => false);
    if (ok) return { browser, page, mode: m };
    await browser.close();
  }
  throw new Error('no WebGL2 context available');
}

export function findFfmpeg() {
  const cands = [process.env.FFMPEG, 'ffmpeg'];
  const venv = path.join(PROJECT, '.venv', 'bin', 'python');
  if (fs.existsSync(venv)) {
    const r = spawnSync(venv, ['-c', 'import imageio_ffmpeg;print(imageio_ffmpeg.get_ffmpeg_exe())']);
    if (r.status === 0) cands.unshift(r.stdout.toString().trim());
  }
  for (const c of cands.filter(Boolean)) { const r = spawnSync(c, ['-version']); if (r.status === 0) return c; }
  return null;
}
/** Decode the song once to WAV whose sample 0 = first decoded sample (the analysis time base). */
function songWav(ff) {
  const wav = path.join(ROOT, 'out', 'cache', 'song.wav');
  if (!fs.existsSync(wav)) {
    fs.mkdirSync(path.dirname(wav), { recursive: true });
    const r = spawnSync(ff, ['-y', '-v', 'error', '-i', SONG, '-vn', '-ac', '2', '-ar', '48000', '-c:a', 'pcm_s16le', wav], { stdio: 'inherit' });
    if (r.status !== 0) throw new Error('song decode failed');
  }
  return wav;
}

async function openEngine(port, from, to) {
  const { browser, page, mode } = await launch(args.gpu);
  page.on('console', (m) => { if (['error', 'warn', 'warning'].includes(m.type()) || /^\[engine\]/.test(m.text())) console.log('[page]', m.text()); });
  page.on('pageerror', (e) => console.log('[pageerror]', e.message));
  await page.setViewport({ width: W, height: H });
  await page.goto(`http://127.0.0.1:${port}/web/index.html`, { waitUntil: 'load' });
  await page.waitForFunction(() => !!window.ENGINE);
  const t0 = Date.now();
  const info = await page.evaluate((o) => window.ENGINE.init(o),
    { show: args.show || null, scene: args.show ? null : (args.scene || 'turn_demo'), width: W, height: H, fps: FPS, from, to, shot: args.shot || null });
  const gpu = await page.evaluate(() => window.ENGINE.gpu());
  return { browser, page, mode, info, gpu, initMs: Date.now() - t0 };
}

function frameList(from, to) { const f0 = Math.round(from * FPS), f1 = Math.round(to * FPS); const out = []; for (let f = f0; f < f1; f++) out.push(f); return out; }

async function renderRange({ port, from, to, mp4, label = '' }) {
  const E = await openEngine(port, from, to);
  console.log(`${label}init ${E.initMs}ms gpu-mode=${E.mode} :: ${E.gpu}`);
  const frames = frameList(from, to);
  const ff = findFfmpeg();
  let enc = null;
  if (mp4) {
    fs.mkdirSync(path.dirname(mp4), { recursive: true });
    enc = spawn(ff, ['-y', '-v', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', `${W}x${H}`, '-r', String(FPS), '-i', 'pipe:0',
      '-vf', 'vflip', '-c:v', 'libx264', '-preset', args.preset || 'medium', '-crf', String(args.crf || 16), '-pix_fmt', 'yuv420p', mp4],
    { stdio: ['pipe', 'inherit', 'inherit'] });
  }
  const outDir = args.out ? path.resolve(args.out) : null; if (outDir) fs.mkdirSync(outDir, { recursive: true });
  const tStart = Date.now(); let tr = 0, tc = 0;
  for (const [k, f] of frames.entries()) {
    const t = f / FPS;
    const a = Date.now();
    await E.page.evaluate((tt) => window.ENGINE.render(tt), t);
    const b = Date.now();
    if (enc) {
      const b64 = await E.page.evaluate(() => window.ENGINE.readPixels());
      const buf = Buffer.from(b64, 'base64');
      if (!enc.stdin.write(buf)) await new Promise((r) => enc.stdin.once('drain', r));
    }
    if (outDir) { const png = await E.page.evaluate(() => window.ENGINE.capture()); fs.writeFileSync(path.join(outDir, `f_${String(f).padStart(5, '0')}.png`), Buffer.from(png, 'base64')); }
    const c = Date.now(); tr += b - a; tc += c - b;
    if (k % 60 === 0) console.log(`${label}t=${t.toFixed(3)}  render ${b - a}ms  readback ${c - b}ms`);
  }
  const wall = Date.now() - tStart;
  if (enc) { enc.stdin.end(); await new Promise((r) => enc.on('close', r)); }
  await E.browser.close();
  return { n: frames.length, wall, tr, tc };
}

async function renderSheet(port, from, to, file) {
  const every = args['sheet-every'] || 'beat';
  const E = await openEngine(port, from, to);
  const times = await E.page.evaluate((a, b, ev) => window.ENGINE.sheetTimes(a, b, ev), from, to, every);
  const cols = +(args['sheet-cols'] || 8);
  await E.page.evaluate((n, c) => window.ENGINE.sheetBegin(n, c, 240), times.length, cols);
  for (const [i, t] of times.entries()) {
    const tf = Math.round(t * FPS) / FPS;
    await E.page.evaluate((tt) => window.ENGINE.render(tt), tf);
    await E.page.evaluate((ii, tt, lab) => window.ENGINE.sheetAdd(ii, lab), i, tf, `${tf.toFixed(3)}s  ${times.labels ? '' : ''}`);
  }
  const jpg = await E.page.evaluate(() => window.ENGINE.sheetEnd());
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, Buffer.from(jpg, 'base64'));
  await E.browser.close();
  console.log(`wrote ${file} (${times.length} frames)`);
}

async function main() {
  const srv = await startServer(args.serve ? +(args.port || 8123) : 0);
  const port = srv.address().port;
  if (args.serve) { console.log(`preview: http://localhost:${port}/web/?show=main&t=0&w=960&h=540`); return; }

  if (args.stills) {
    const jobs = String(args.stills).split(',').map((s) => { const i = s.lastIndexOf(':'); return { t: +s.slice(0, i), file: path.resolve(s.slice(i + 1)) }; });
    const ts = jobs.map((j) => j.t);
    const E = await openEngine(port, Math.min(...ts), Math.max(...ts) + 1 / FPS);
    console.log(`init ${E.initMs}ms :: ${E.gpu}`);
    for (const j of jobs) {
      await E.page.evaluate((tt) => window.ENGINE.render(tt), j.t);
      const png = await E.page.evaluate(() => window.ENGINE.capture());
      fs.mkdirSync(path.dirname(j.file), { recursive: true }); fs.writeFileSync(j.file, Buffer.from(png, 'base64'));
    }
    await E.browser.close(); srv.close(); console.log(`wrote ${jobs.length} stills`); return;
  }

  const from = +(args.from || 0), to = +(args.to ?? 6);
  const ff = findFfmpeg();
  if (!args['sheet-only']) {
    const mp4 = args.mp4 ? path.resolve(args.mp4) : null;
    const workers = Math.max(1, +(args.workers || 1));
    const t0 = Date.now(); let n = 0;
    if (workers === 1 || !mp4) {
      const r = await renderRange({ port, from, to, mp4: mp4 && (args.audio ? mp4 + '.video.mp4' : mp4) });
      n = r.n; console.log(`frames=${r.n}  avg render ${(r.tr / r.n).toFixed(1)}ms  avg readback ${(r.tc / r.n).toFixed(1)}ms  wall/frame ${(r.wall / r.n).toFixed(1)}ms`);
    } else {
      // contiguous chunks on the frame grid -> segment files -> concat (each frame is a pure function of t)
      const fr = frameList(from, to); const per = Math.ceil(fr.length / workers); const segs = [];
      const jobs = [];
      for (let w = 0; w < workers; w++) {
        const a = fr[w * per]; if (a === undefined) break; const b = (fr[Math.min(fr.length, (w + 1) * per) - 1] + 1);
        const seg = `${mp4}.seg${w}.mp4`; segs.push(seg);
        jobs.push(renderRange({ port, from: a / FPS, to: b / FPS, mp4: seg, label: `[w${w}] ` }));
      }
      const rs = await Promise.all(jobs); n = rs.reduce((s, r) => s + r.n, 0);
      const list = mp4 + '.txt'; fs.writeFileSync(list, segs.map((s) => `file '${s}'`).join('\n'));
      spawnSync(ff, ['-y', '-v', 'error', '-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', args.audio ? mp4 + '.video.mp4' : mp4], { stdio: 'inherit' });
      for (const s of segs) fs.unlinkSync(s); fs.unlinkSync(list);
    }
    const wall = (Date.now() - t0) / 1000;
    console.log(`rendered ${n} frames in ${wall.toFixed(1)}s  (${(n / wall).toFixed(1)} fps, ${(1000 * wall / n).toFixed(1)} ms/frame incl. init)`);
    if (mp4 && args.audio) {
      const wav = songWav(ff);
      // audio slice on the frame grid: starts at the first frame's time, lasts exactly n frames
      const a0 = Math.round(from * FPS) / FPS, ad = (Math.round(to * FPS) - Math.round(from * FPS)) / FPS;
      const r = spawnSync(ff, ['-y', '-v', 'error', '-i', mp4 + '.video.mp4', '-ss', a0.toFixed(6), '-t', ad.toFixed(6), '-i', wav,
        '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-af', 'apad', '-t', ad.toFixed(6), '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', mp4], { stdio: 'inherit' });
      fs.unlinkSync(mp4 + '.video.mp4');
      console.log(r.status === 0 ? `wrote ${mp4} (+audio ${from}-${to}s)` : 'audio mux failed');
    } else if (mp4) console.log(`wrote ${mp4}`);
  }
  if (args.sheet) await renderSheet(port, from, to, path.resolve(args.sheet));
  srv.close();
}
main().catch((e) => { console.error(e); process.exit(1); });
