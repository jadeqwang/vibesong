// THE ERASER in 3D (Act IV): a big rubber block in the art-dept design (eraser sheet: gray body, beige paper sleeve
// with two blue stripes, stubby round arms, sleepy-grumpy face). Built procedurally so it can be mountain-sized
// at dusk, look at the 画, and be COLOURED IN by Jade's every-colour pencil: a hatched wavefront turns the gray
// rubber into the classic pink eraser of the art-dept redeemed form (#f2788f, lighter #f7a1b0 top face), and the face turns happy.
//   const er = makeEraser(); er.set({ pink: 0..1, face: 'grumpy'|'look'|'happy'|'sing', blink, scrub, lean })
// The group's origin is the bottom centre; height = 1.6 units before scaling (group.scale).
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const W = 1.0, H = 1.6, D = 0.62;

function faceCanvas(kind, blink = 0) {
  const cv = document.createElement('canvas'); cv.width = 512; cv.height = 512;
  const g = cv.getContext('2d'); g.lineCap = 'round'; g.lineJoin = 'round';
  const ink = '#1b1b22';
  const eye = (cx, cy, open, look, lid) => {
    const rx = 62, ry = 46 * open;
    if (open < 0.08) { g.strokeStyle = ink; g.lineWidth = 12; g.beginPath(); g.moveTo(cx - rx, cy); g.quadraticCurveTo(cx, cy + 22, cx + rx, cy); g.stroke(); return; }
    g.fillStyle = '#fbf6ea'; g.beginPath(); g.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); g.fill();
    g.save(); g.beginPath(); g.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); g.clip();
    g.fillStyle = ink; g.beginPath(); g.ellipse(cx + look * 24, cy + 6, 24, 28, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#ffffff'; g.beginPath(); g.ellipse(cx + look * 24 + 9, cy - 6, 8, 8, 0, 0, Math.PI * 2); g.fill();
    if (lid > 0) { g.fillStyle = '#6e6c70'; g.fillRect(cx - rx - 5, cy - ry - 5, rx * 2 + 10, (ry * 2 + 10) * lid); g.strokeStyle = ink; g.lineWidth = 10; g.beginPath(); g.moveTo(cx - rx, cy - ry + (ry * 2) * lid); g.lineTo(cx + rx, cy - ry + (ry * 2) * lid); g.stroke(); }
    g.restore();
    g.strokeStyle = ink; g.lineWidth = 9; g.beginPath(); g.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); g.stroke();
  };
  const L = 160, R = 352, EY = 210;
  if (kind === 'grumpy' || kind === 'look') {
    const lid = kind === 'grumpy' ? 0.5 : 0.18;
    const open = Math.max(0, 1 - blink) * (kind === 'look' ? 1.05 : 0.85);
    // heavy brows
    g.strokeStyle = ink; g.lineWidth = 16;
    if (kind === 'grumpy') { g.beginPath(); g.moveTo(L - 70, EY - 62); g.lineTo(L + 60, EY - 48); g.stroke(); g.beginPath(); g.moveTo(R - 60, EY - 48); g.lineTo(R + 70, EY - 62); g.stroke(); }
    else { g.beginPath(); g.moveTo(L - 60, EY - 80); g.quadraticCurveTo(L, EY - 100, L + 60, EY - 82); g.stroke(); g.beginPath(); g.moveTo(R - 60, EY - 82); g.quadraticCurveTo(R, EY - 100, R + 60, EY - 80); g.stroke(); }
    // bags
    g.strokeStyle = 'rgba(40,36,48,0.55)'; g.lineWidth = 8;
    for (const cx of [L, R]) { g.beginPath(); g.arc(cx, EY + 30, 58, 0.2 * Math.PI, 0.8 * Math.PI); g.stroke(); }
    eye(L, EY, open, kind === 'look' ? 0.5 : 0.35, lid * (1 - blink)); eye(R, EY, open, kind === 'look' ? 0.5 : 0.35, lid * (1 - blink));
    g.strokeStyle = ink; g.lineWidth = 14; g.beginPath();
    if (kind === 'grumpy') { g.moveTo(186, 390); g.quadraticCurveTo(256, 340, 326, 392); }
    else { g.ellipse(262, 378, 22, 26, 0, 0, Math.PI * 2); }
    g.stroke();
  } else {
    // happy / sing: round shiny eyes, blush, open smile
    const open = Math.max(0, 1 - blink);
    eye(L, EY, open * 1.15, 0.15, 0); eye(R, EY, open * 1.15, 0.15, 0);
    g.fillStyle = 'rgba(232,52,96,0.45)'; g.beginPath(); g.ellipse(L - 30, EY + 92, 44, 24, 0, 0, Math.PI * 2); g.fill(); g.beginPath(); g.ellipse(R + 30, EY + 92, 44, 24, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#7a1630'; g.strokeStyle = ink; g.lineWidth = 12; g.beginPath();
    if (kind === 'sing') g.ellipse(256, 372, 54, 62, 0, 0, Math.PI * 2);
    else { g.moveTo(170, 340); g.quadraticCurveTo(256, 470, 342, 340); g.closePath(); }
    g.fill(); g.stroke();
    g.fillStyle = '#ff6b8a'; g.beginPath(); g.ellipse(256, kind === 'sing' ? 400 : 392, 34, 18, 0, 0, Math.PI * 2); g.fill();
  }
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}

function sleeveCanvas() {
  const cv = document.createElement('canvas'); cv.width = 256; cv.height = 128; const g = cv.getContext('2d');
  g.fillStyle = '#e9dfca'; g.fillRect(0, 0, 256, 128);
  for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(120,100,70,${0.04 + 0.05 * ((i * 37) % 7) / 7})`; g.fillRect((i * 97) % 256, (i * 53) % 128, 2, 1); }
  g.fillStyle = '#3f6fc2'; g.fillRect(0, 14, 256, 12); g.fillRect(0, 100, 256, 12);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = THREE.RepeatWrapping; return t;
}

export function makeEraser() {
  const g = new THREE.Group();
  const inner = new THREE.Group(); g.add(inner); // lean / scrub pivot at the bottom
  const U = { uPink: { value: 0 }, uGray: { value: new THREE.Color('#8f8c92') }, uPinkC: { value: new THREE.Color('#f2788f') }, uPinkHi: { value: new THREE.Color('#f7a1b0') } };   // classic pink eraser (art-dept redeemed form)
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.82, metalness: 0 });
  bodyMat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, U);
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vLP;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvLP = position;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
      uniform float uPink; uniform vec3 uGray, uPinkC, uPinkHi; varying vec3 vLP;
      float eh(vec3 p){ return fract(sin(dot(p, vec3(12.9898,78.233,37.719))) * 43758.5453); }
      float en(vec3 p){ vec3 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
        return mix(mix(mix(eh(i), eh(i+vec3(1,0,0)), f.x), mix(eh(i+vec3(0,1,0)), eh(i+vec3(1,1,0)), f.x), f.y),
                   mix(mix(eh(i+vec3(0,0,1)), eh(i+vec3(1,0,1)), f.x), mix(eh(i+vec3(0,1,1)), eh(i+vec3(1,1,1)), f.x), f.y), f.z); }`)
      .replace('#include <color_fragment>', `#include <color_fragment>
      { float n = en(vLP * 9.0); float spk = step(0.82, en(vLP * 40.0));
        vec3 gray = uGray * (0.86 + 0.22 * n) * (1.0 - 0.18 * spk);
        // the colouring wavefront runs top -> bottom with coloured-pencil hatching
        float front = uPink * 2.2 - 0.6 - (1.0 - vLP.y / ${H.toFixed(2)}) * 1.0 + (n - 0.5) * 0.25;
        float k = clamp(front, 0.0, 1.0);
        float h1 = fract((vLP.x + vLP.y) * 26.0 + n), h2 = fract((vLP.x * 0.7 - vLP.y + vLP.z) * 19.0 - n);
        float cov = max(step(h1, k * 1.3), step(h2, k * 1.3 - 0.45));
        vec3 pink = mix(uPinkC, uPinkHi, smoothstep(${(H - 0.14).toFixed(2)}, ${(H - 0.02).toFixed(2)}, vLP.y) + n * 0.12) * (1.0 - 0.12 * smoothstep(0.5, 0.0, vLP.y));
        diffuseColor.rgb = mix(gray, pink, cov); }`);
  };
  bodyMat.customProgramCacheKey = () => 'act4eraserbody';
  const body = new THREE.Mesh(new RoundedBoxGeometry(W, H, D, 6, 0.12), bodyMat);
  body.geometry.translate(0, H / 2, 0); body.castShadow = true; body.receiveShadow = true;
  inner.add(body);
  // sleeve band
  const sleeve = new THREE.Mesh(new RoundedBoxGeometry(W * 1.04, H * 0.34, D * 1.06, 4, 0.05), new THREE.MeshStandardMaterial({ map: sleeveCanvas(), roughness: 0.95 }));
  sleeve.position.y = H * 0.36; sleeve.castShadow = true; sleeve.receiveShadow = true; inner.add(sleeve);
  // arms: stubby rounded nubs
  const armMat = bodyMat;
  const arms = [-1, 1].map((sx) => { const a = new THREE.Mesh(new THREE.SphereGeometry(0.17, 24, 16), armMat); a.scale.set(0.9, 1.15, 0.9); a.position.set(sx * (W / 2 + 0.1), H * 0.3, 0.05); a.castShadow = true; inner.add(a); return a; });
  // face (front, +z)
  const faces = {};
  for (const k of ['grumpy', 'look', 'happy', 'sing']) faces[k] = faceCanvas(k);
  const blinkTex = { grumpy: faceCanvas('grumpy', 1), look: faceCanvas('look', 1), happy: faceCanvas('happy', 1), sing: faceCanvas('sing', 1) };
  const faceMat = new THREE.MeshStandardMaterial({ map: faces.grumpy, transparent: true, roughness: 0.7, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 });
  const face = new THREE.Mesh(new THREE.PlaneGeometry(W * 0.86, W * 0.86), faceMat);
  face.position.set(0, H * 0.72, D / 2 + 0.004); inner.add(face);
  g.userData = { body, sleeve, arms, face, U };
  g.set = ({ pink = 0, face: f = 'grumpy', blink = 0, scrub = 0, lean = 0, squash = 0, wave = 0 } = {}) => {
    U.uPink.value = pink;
    faceMat.map = blink > 0.5 ? blinkTex[f] : faces[f];
    inner.rotation.z = lean; inner.position.x = scrub;
    inner.scale.set(1 + squash * 0.5, 1 - squash, 1 + squash * 0.5);
    arms[0].position.y = H * (0.3 + 0.12 * wave); arms[1].position.y = H * (0.3 + 0.12 * Math.max(0, -wave) + 0.05 * wave);
    return g;
  };
  g.set({});
  return g;
}
