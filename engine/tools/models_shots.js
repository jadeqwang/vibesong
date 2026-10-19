#!/usr/bin/env node
// MODELS team still driver (review gate for the 3D-native heroes). Starts the engine server (render.js --serve), opens the
// engine page with ?fig=<native|carve> (voxfig FIGURE_SRC switch, this page only) and renders:
//   --main  t:file,t:file      stills of the main show (same path as render.js --stills)
//   --bench spec.json          portrait bench shots (src/core/heromodels/bench.js): [{ file, heroes: [...], cam: {...} }]
//   --perf  from:to            ms/frame of the main show over a range (render + readback, like render.js) + init time
// usage: node tools/models_shots.js --fig native --res 1920x1080 --main 101.5:out/x.png
//   --figres 2.5 / --figscale 1.3   pass-through to heroes.js RES / SCALE (density spike)
//   --figrig [0|1]                r6: split rig on native figures at --figres 2.5 (voxfig FIGRIG; default ON there, --figrig 0 = off)
import { spawn } from 'node:child_process';
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = Object.fromEntries(process.argv.slice(2).reduce((a, v, i, arr) => { if (v.startsWith('--')) a.push([v.slice(2), arr[i + 1] !== undefined && !arr[i + 1].startsWith('--') ? arr[i + 1] : true]); return a; }, []));
const [W, H] = String(args.res || '1920x1080').split('x').map(Number); const FIG = args.fig || 'native';
const port = 8300 + Math.floor(Math.random() * 500);

const srv = spawn(process.execPath, [path.join(ROOT, 'render.js'), '--serve', '--port', String(port)], { cwd: ROOT, stdio: ['ignore', 'pipe', 'inherit'] });
await new Promise((res, rej) => { srv.stdout.on('data', (d) => { if (/preview:/.test(String(d))) res(); }); srv.on('exit', () => rej(new Error('server exited'))); });
const browser = await puppeteer.launch({ executablePath: process.env.CHROME || '/usr/bin/google-chrome', headless: 'new', protocolTimeout: 900000,
  args: ['--no-sandbox', '--hide-scrollbars', `--window-size=${W},${H}`, '--disable-gpu-watchdog', '--use-angle=vulkan', '--enable-features=Vulkan', '--ignore-gpu-blocklist', '--enable-gpu'] });
const done = async (code = 0) => { await browser.close(); srv.kill(); process.exit(code); };
try {
  const page = await browser.newPage(); await page.setViewport({ width: W, height: H });
  if (args.debug) await page.evaluateOnNewDocument(() => { for (const C of [WebGLRenderingContext, WebGL2RenderingContext]) { const g = C.prototype.getExtension; C.prototype.getExtension = function (n) { const e = g.call(this, n); if (e && n === 'WEBGL_lose_context') { const l = e.loseContext.bind(e); e.loseContext = () => { console.warn('[models] loseContext from ' + new Error().stack); l(); }; } return e; }; } });
  page.on('console', (m) => { const t = m.text(); if (/GPU stall|GL Driver/.test(t)) return; if (['error', 'warn', 'warning'].includes(m.type()) || /^\[(engine|models)\]/.test(t)) console.log('[page]', t); });
  page.on('pageerror', (e) => console.log('[pageerror]', e.message));
  // sacrificial context (as render.js launch() does): the first WebGL context on a fresh headless GPU process gets lost
  await page.evaluate(() => !!document.createElement('canvas').getContext('webgl2')); await new Promise((r) => setTimeout(r, 1500));
  await page.goto(`http://127.0.0.1:${port}/web/index.html?fig=${FIG}${args.figscale ? '&figscale=' + args.figscale : ''}${args.figres ? '&figres=' + args.figres : ''}${args.figrig !== undefined ? '&figrig=' + (args.figrig === true ? '1' : args.figrig) : ''}`, { waitUntil: 'load' }); await page.waitForFunction(() => !!window.ENGINE);
  if (args.main || args.perf) {
    const jobs = args.main ? String(args.main).split(',').map((s) => { const i = s.lastIndexOf(':'); return { t: +s.slice(0, i), file: path.resolve(s.slice(i + 1)) }; }) : [];
    let from = jobs.length ? Math.min(...jobs.map((j) => j.t)) : 0, to = jobs.length ? Math.max(...jobs.map((j) => j.t)) + 0.04 : 0;
    if (args.perf) { const [a, b] = String(args.perf).split(':').map(Number); from = Math.min(jobs.length ? from : a, a); to = Math.max(to, b); }
    const t0 = Date.now(); await page.evaluate((o) => window.ENGINE.init(o), { show: 'main', width: W, height: H, fps: 30, from, to }); const initMs = Date.now() - t0;
    console.log(`[models] fig=${FIG} init ${initMs} ms`);
    for (const j of jobs) { await page.evaluate((tt) => window.ENGINE.render(tt), j.t); const png = await page.evaluate(() => window.ENGINE.capture()); fs.mkdirSync(path.dirname(j.file), { recursive: true }); fs.writeFileSync(j.file, Buffer.from(png, 'base64')); console.log('[models] wrote', j.file); }
    if (args.perf) {
      const [a, b] = String(args.perf).split(':').map(Number); const f0 = Math.round(a * 30), f1 = Math.round(b * 30);
      let tr = 0, tb = 0; const w0 = Date.now();
      for (let f = f0; f < f1; f++) { const x = Date.now(); await page.evaluate((tt) => window.ENGINE.render(tt), f / 30); const y = Date.now(); await page.evaluate(() => window.ENGINE.readPixels()); tr += y - x; tb += Date.now() - y; }
      const n = f1 - f0; console.log(`[models] perf fig=${FIG} ${a}-${b}: ${n} frames, render ${(tr / n).toFixed(1)} ms, readback ${(tb / n).toFixed(1)} ms, wall ${((Date.now() - w0) / n).toFixed(1)} ms/frame, init ${initMs} ms`);
    }
  }
  if (args.bench) {
    const spec = JSON.parse(fs.readFileSync(args.bench, 'utf8'));
    const info = await page.evaluate(async (w, h) => { const b = await import('/src/core/heromodels/bench.js'); window.__bench = b; return b.init({ width: w, height: h }); }, W, H);
    console.log('[models] bench init', JSON.stringify(info));
    let ms = 0;
    for (const s of spec) { const r = await page.evaluate((x) => window.__bench.shot(x), s); ms += r.ms; if (r.lost) console.log('[models] CONTEXT LOST at', s.file); const f = path.resolve(s.file); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, Buffer.from(r.png, 'base64')); }
    console.log(`[models] bench wrote ${spec.length} shots, avg render ${(ms / spec.length).toFixed(1)} ms`);
  }
  await done(0);
} catch (e) { console.error(e); await done(1); }
