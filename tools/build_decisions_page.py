#!/usr/bin/env python3
"""Build docs/pages/decisions.html (local page for Jade) from docs/decisions_open.json + docs/decisions.md.
Re-run after either file changes:  python3 tools/build_decisions_page.py"""
import html, json, re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OPEN = json.loads((ROOT / 'docs/decisions_open.json').read_text())
LOG = (ROOT / 'docs/decisions.md').read_text()
OUT = ROOT / 'docs/pages/decisions.html'


def inline(s):
    s = html.escape(s, quote=False)
    s = re.sub(r'`([^`]+)`', r'<code>\1</code>', s)
    s = re.sub(r'\*\*([^*]+)\*\*', r'<strong>\1</strong>', s)
    return s


def log_html(md):
    """decisions.md -> collapsible sections, newest first"""
    secs, cur = [], None
    for line in md.splitlines():
        if line.startswith('# ') or line.startswith('## '):
            cur = {'title': line.lstrip('#').strip(), 'items': []}; secs.append(cur)
        elif cur is not None and re.match(r'^\s*(-|\d+\.)\s+', line):
            cur['items'].append(re.sub(r'^\s*(-|\d+\.)\s+', '', line))
        elif cur is not None and line.strip():
            if cur['items']: cur['items'][-1] += ' ' + line.strip()
            else: cur.setdefault('lead', []).append(line.strip())
    out = []
    for i, s in enumerate(reversed(secs)):
        lead = ''.join(f'<p>{inline(p)}</p>' for p in s.get('lead', []))
        lis = ''.join(f'<li>{inline(it)}</li>' for it in s['items'])
        out.append(f'<details class="log"{" open" if i == 0 else ""}><summary>{inline(s["title"])}'
                   f'<span class="count">{len(s["items"])}</span></summary>{lead}<ul>{lis}</ul></details>')
    return '\n'.join(out)


TEMPLATE = r'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Vibesong Decisions</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=LXGW+WenKai+TC&display=swap" rel="stylesheet">
<style>
:root{
  --bg:#f6f1e7; --card:#fffdf8; --ink:#2a2622; --muted:#6f665c; --line:#e3d9c8;
  --accent:#e8742c; --accent-ink:#fff; --blue:#94bde3; --rec:#2f7d4f; --rec-bg:#e5f2e9;
  --chip:#f1e9da; --chip-on:#2a2622; --chip-on-ink:#fffdf8; --shadow:0 1px 2px rgba(60,40,20,.06),0 4px 16px rgba(60,40,20,.06);
}
@media (prefers-color-scheme: dark){ :root:not([data-theme="light"]){
  --bg:#191714; --card:#221f1b; --ink:#efe8dc; --muted:#a59a8b; --line:#38322b;
  --accent:#f08a45; --accent-ink:#1a1612; --rec:#7fcf9c; --rec-bg:#1f3327;
  --chip:#2d2823; --chip-on:#efe8dc; --chip-on-ink:#191714; --shadow:none; } }
:root[data-theme="dark"]{
  --bg:#191714; --card:#221f1b; --ink:#efe8dc; --muted:#a59a8b; --line:#38322b;
  --accent:#f08a45; --accent-ink:#1a1612; --rec:#7fcf9c; --rec-bg:#1f3327;
  --chip:#2d2823; --chip-on:#efe8dc; --chip-on-ink:#191714; --shadow:none; }
*{box-sizing:border-box}
html{-webkit-text-size-adjust:100%}
body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.55 Inter,system-ui,sans-serif}
.wrap{max-width:900px;margin:0 auto;padding:0 16px 80px}
header.top{position:sticky;top:0;z-index:5;background:color-mix(in srgb,var(--bg) 92%,transparent);backdrop-filter:blur(8px);border-bottom:1px solid var(--line)}
header.top .wrap{display:flex;align-items:center;gap:12px;flex-wrap:wrap;padding-top:12px;padding-bottom:12px}
h1{font-size:18px;margin:0;white-space:nowrap;font-weight:700;letter-spacing:-.01em}
h1 .zh{font-family:"LXGW WenKai TC",serif;font-weight:400;color:var(--accent);margin-left:6px}
.progress{font-size:13px;color:var(--muted);margin-right:auto}
.bar{height:4px;background:var(--line);border-radius:2px;overflow:hidden;width:120px;display:inline-block;vertical-align:middle;margin-left:8px}
.bar i{display:block;height:100%;background:var(--accent);width:0;transition:width .3s}
button{font:inherit;font-size:13px;font-weight:600;border-radius:8px;border:1px solid var(--line);background:var(--card);color:var(--ink);padding:7px 12px;cursor:pointer}
button.primary{background:var(--accent);border-color:var(--accent);color:var(--accent-ink)}
button:focus-visible,.opt input:focus-visible+span,textarea:focus-visible,summary:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
nav.tabs{display:flex;gap:4px;margin:24px 0 8px}
nav.tabs button{border:none;background:none;color:var(--muted);padding:8px 12px;border-radius:8px}
nav.tabs button[aria-selected="true"]{background:var(--chip);color:var(--ink)}
.lede{color:var(--muted);margin:4px 0 20px}
h2{font-size:15px;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);margin:32px 0 4px;font-weight:600}
.intro{color:var(--muted);margin:0 0 14px;font-size:14px}
.card{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:18px;margin:0 0 14px;box-shadow:var(--shadow)}
.card.done{border-left:4px solid var(--accent)}
.qrow{display:flex;gap:10px;align-items:flex-start;justify-content:space-between}
.q{font-weight:600;font-size:16px;margin:0}
.state{font-size:12px;color:var(--muted);white-space:nowrap;padding-top:3px}
.card.done .state{color:var(--accent);font-weight:600}
.why{color:var(--muted);margin:6px 0 12px;font-size:14px}
.opts{display:flex;flex-wrap:wrap;gap:8px}
.opt{position:relative}
.opt input{position:absolute;opacity:0;pointer-events:none}
.opt span{display:inline-flex;align-items:center;gap:6px;padding:7px 12px;border-radius:999px;background:var(--chip);border:1px solid transparent;cursor:pointer;font-size:14px;line-height:1.3}
.opt input:checked+span{background:var(--chip-on);color:var(--chip-on-ink)}
.opt .rec{font-size:11px;font-weight:700;color:var(--rec);background:var(--rec-bg);padding:1px 6px;border-radius:999px}
.opt input:checked+span .rec{background:transparent;color:inherit;opacity:.8}
textarea{width:100%;margin-top:12px;min-height:44px;resize:vertical;font:inherit;font-size:14px;color:var(--ink);background:var(--bg);border:1px solid var(--line);border-radius:10px;padding:9px 11px}
.imgs{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:10px;margin:0 0 14px}
.imgs figure{margin:0}
.links{display:flex;flex-wrap:wrap;gap:8px 16px;margin:-4px 0 14px;font-size:14px}
.links a{color:var(--accent);font-weight:600;text-decoration:none}
.links a:hover{text-decoration:underline}
.imgs img{width:100%;aspect-ratio:16/9;object-fit:contain;border-radius:8px;border:1px solid var(--line);cursor:zoom-in;background:var(--chip);display:block}
.imgs figcaption{font-size:12px;color:var(--muted);margin-top:4px}
details.log{background:var(--card);border:1px solid var(--line);border-radius:12px;margin:0 0 10px;padding:0 16px}
details.log summary{cursor:pointer;padding:12px 0;font-weight:600;display:flex;justify-content:space-between;gap:12px}
details.log .count{font-weight:500;color:var(--muted);font-size:13px}
details.log ul{margin:0 0 14px;padding-left:20px}
details.log li{margin:4px 0;font-size:14px}
code{font-size:12.5px;background:var(--chip);padding:1px 5px;border-radius:5px;overflow-wrap:anywhere}
.lightbox{position:fixed;inset:0;background:rgba(10,8,6,.88);display:none;align-items:center;justify-content:center;z-index:20;padding:16px;cursor:zoom-out}
.lightbox.on{display:flex}
.lightbox img{max-width:100%;max-height:100%;border-radius:6px}
.toast{position:fixed;left:50%;bottom:24px;transform:translateX(-50%);background:var(--ink);color:var(--bg);padding:9px 16px;border-radius:999px;font-size:13px;opacity:0;transition:opacity .2s;pointer-events:none;z-index:30}
.toast.on{opacity:1}
[hidden]{display:none!important}
@media (max-width:560px){ .bar{display:none} .qrow{flex-direction:column;gap:2px} }
</style>
</head>
<body>
<header class="top"><div class="wrap">
  <h1>Vibesong decisions<span class="zh">一笔一画</span></h1>
  <span class="progress"><span id="prog">0 of 0 answered</span><span class="bar"><i id="progbar"></i></span></span>
  <button id="reset" title="Clear the answers saved in this browser">Reset</button>
  <button id="dl">Download .md</button>
  <button id="copy" class="primary">Copy answers</button>
</div></header>
<main class="wrap">
  <nav class="tabs" role="tablist">
    <button role="tab" aria-selected="true" data-tab="open">Open</button>
    <button role="tab" aria-selected="false" data-tab="log">Decided log</button>
  </nav>
  <section id="tab-open">
    <p class="lede">Updated __UPDATED__. Your picks save in this browser as you go. When you're done, hit <strong>Copy answers</strong> and paste them into the chat. Click any image to enlarge it.</p>
    <div id="groups"></div>
  </section>
  <section id="tab-log" hidden>
    <p class="lede">Mirror of <code>docs/decisions.md</code>, newest first.</p>
    __LOG__
  </section>
</main>
<div class="lightbox" id="lb"><img alt=""></div>
<div class="toast" id="toast"></div>
<script>
const DATA = __DATA__;
const KEY = 'vibesong-decisions-v1';
let S = {};
try { S = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { S = {}; }
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} };
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const isRec = (it, i) => Array.isArray(it.rec) ? it.rec.includes(i) : it.rec === i;
const answered = (it) => { const a = S[it.id] || {}; return Array.isArray(a.pick) ? a.pick.length > 0 : a.pick != null; };
const items = DATA.groups.flatMap((g) => g.items);

function render() {
  const root = document.getElementById('groups');
  root.innerHTML = DATA.groups.map((g) => `<h2>${esc(g.title)}</h2>${g.intro ? `<p class="intro">${esc(g.intro)}</p>` : ''}` + g.items.map((it) => {
    const a = S[it.id] || {}; const type = it.multi ? 'checkbox' : 'radio';
    const opts = it.options.map((o, i) => {
      const on = it.multi ? (a.pick || []).includes(i) : a.pick === i;
      return `<label class="opt"><input type="${type}" name="${it.id}" value="${i}"${on ? ' checked' : ''}><span>${esc(o)}${isRec(it, i) ? '<b class="rec">recommended</b>' : ''}</span></label>`;
    }).join('');
    const imgs = (it.imgs || []).map(([src, cap]) => `<figure><img src="${esc(src)}" alt="${esc(cap)}" loading="lazy"><figcaption>${esc(cap)}</figcaption></figure>`).join('');
    return `<article class="card${answered(it) ? ' done' : ''}" data-id="${it.id}">
      <div class="qrow"><p class="q">${esc(it.q)}</p><span class="state">${answered(it) ? 'answered' : it.multi ? 'pick any' : 'pick one'}</span></div>
      ${it.why ? `<p class="why">${esc(it.why)}</p>` : ''}
      ${imgs ? `<div class="imgs">${imgs}</div>` : ''}
      ${(it.links || []).length ? `<p class="links">${it.links.map(([h, l]) => `<a href="${esc(h)}" target="_blank" rel="noopener">▶ ${esc(l)}</a>`).join('')}</p>` : ''}
      <div class="opts">${opts}</div>
      <textarea placeholder="Notes (optional)" aria-label="Notes for: ${esc(it.q)}">${esc(a.note || '')}</textarea>
    </article>`;
  }).join('')).join('');
  progress();
}
function progress() {
  const n = items.filter(answered).length;
  document.getElementById('prog').textContent = `${n} of ${items.length} answered`;
  document.getElementById('progbar').style.width = (100 * n / items.length) + '%';
}
document.getElementById('groups').addEventListener('change', (e) => {
  const card = e.target.closest('.card'); if (!card) return; const id = card.dataset.id; const it = items.find((x) => x.id === id);
  S[id] = S[id] || {};
  if (e.target.matches('input')) {
    S[id].pick = it.multi ? [...card.querySelectorAll('input:checked')].map((x) => +x.value) : +e.target.value;
    card.classList.toggle('done', answered(it)); card.querySelector('.state').textContent = answered(it) ? 'answered' : (it.multi ? 'pick any' : 'pick one');
    progress();
  }
  save();
});
document.getElementById('groups').addEventListener('input', (e) => {
  if (!e.target.matches('textarea')) return; const id = e.target.closest('.card').dataset.id;
  S[id] = S[id] || {}; S[id].note = e.target.value; save();
});
function summary() {
  const lines = [`Decisions from Jade (page updated ${DATA.updated}):`];
  for (const g of DATA.groups) for (const it of g.items) {
    const a = S[it.id] || {};
    let pick = it.multi ? (a.pick || []).map((i) => it.options[i]).join('; ') : (a.pick != null ? it.options[a.pick] : '');
    if (it.multi && a.pick && a.pick.length === 0) pick = 'none';
    if (!pick && !(a.note || '').trim()) continue;
    lines.push(`- [${it.id}] ${it.q}: ${pick || '(no pick)'}${(a.note || '').trim() ? `. Notes: ${a.note.trim()}` : ''}`);
  }
  if (lines.length === 1) lines.push('- (nothing answered yet)');
  return lines.join('\n');
}
function toast(msg) { const t = document.getElementById('toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('on'), 1800); }
document.getElementById('copy').onclick = async () => {
  const txt = summary();
  try { await navigator.clipboard.writeText(txt); toast('Copied. Paste it into the chat'); }
  catch (e) { const ta = document.createElement('textarea'); ta.value = txt; document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); toast('Copied. Paste it into the chat'); } catch (e2) { toast('Copy blocked: use Download .md'); } ta.remove(); }
};
document.getElementById('dl').onclick = () => {
  const b = new Blob([summary() + '\n'], { type: 'text/markdown' }); const u = URL.createObjectURL(b);
  const a = document.createElement('a'); a.href = u; a.download = `vibesong_decisions_${new Date().toISOString().slice(0, 10)}.md`; a.click(); setTimeout(() => URL.revokeObjectURL(u), 1000);
};
document.getElementById('reset').onclick = () => { S = {}; save(); render(); toast('Cleared'); };
document.querySelectorAll('nav.tabs button').forEach((b) => b.onclick = () => {
  document.querySelectorAll('nav.tabs button').forEach((x) => x.setAttribute('aria-selected', x === b));
  document.getElementById('tab-open').hidden = b.dataset.tab !== 'open'; document.getElementById('tab-log').hidden = b.dataset.tab !== 'log';
});
const lb = document.getElementById('lb');
document.addEventListener('click', (e) => { if (e.target.matches('.imgs img')) { lb.querySelector('img').src = e.target.src; lb.classList.add('on'); } else if (e.target.closest('#lb')) lb.classList.remove('on'); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') lb.classList.remove('on'); });
render();
</script>
</body>
</html>
'''

page = (TEMPLATE.replace('__UPDATED__', html.escape(OPEN.get('updated', '')))
        .replace('__LOG__', log_html(LOG))
        .replace('__DATA__', json.dumps(OPEN, ensure_ascii=False).replace('</', '<\\/')))
OUT.write_text(page)
print(f'wrote {OUT.relative_to(ROOT)} ({len(page) // 1024} KB, {sum(len(g["items"]) for g in OPEN["groups"])} open items)')
