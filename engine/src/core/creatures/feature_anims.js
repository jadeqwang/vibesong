// Procedural anims shared by bugs and features (blink, antennae) and the features' own anims.
//   lamp:   'idle' (sway, warm glow) · 'dance' (bob, cap hop) · 'use' (lit full). params: glow 0..1
//   glider: 'idle' (hover bob) · 'dance' (bank + flap) · 'use' (glide). params: bank (rad), flap (rad)
//   wheel:  'idle' · 'dance' (hop + wobble) · 'roll'. params: roll (rad, + = rolls toward +x) or dist (world units)
//   bridge: 'idle' (plank ripple) · 'dance' (beat wave) · 'use' (still, walkable)
//   button: 'idle' · 'dance' (bounce, spots blink on the beat) · 'use' (press pulse on the beat). params: press 0..1, flash 0..1
import { blinkAt, sstep } from './vox.js';

export function commonAnim(J, t, s, o) {
  const bl = o.blink ?? blinkAt(t, 3.1 + o.seed * 0.37, o.seed * 1.3);
  for (const n of ['eyeL', 'eyeR']) if (J[n]) J[n].scale.y = Math.max(0.08, 1 - 0.9 * bl);
  for (const n of ['antL', 'antR']) if (J[n]) { const sd = n === 'antL' ? 1 : -1; J[n].rotation.x += sd * 0.08 * Math.sin(t * 2.3 + o.seed); J[n].rotation.z += 0.07 * Math.sin(t * 1.7 + o.seed * 2); }
}
const bounce = (b) => Math.abs(Math.sin(Math.PI * b));

export const FANIMS = {
  lamp(J, t, b, mode, s, o, U) {
    let glow = 0.85 + 0.08 * Math.sin(t * 2.1) + 0.04 * Math.sin(t * 13.7);
    if (mode === 'dance') { J.body.position.y += s * 2 * bounce(b); J.head.rotation.z = 0.1 * Math.sin(Math.PI * b); J.cap.position.y += s * 1.6 * Math.pow(bounce(b + 0.25), 4); J.cap.rotation.z = 0.12 * Math.sin(Math.PI * b); glow = 0.75 + 0.25 * bounce(b); }
    else if (mode === 'use') { glow = 1; }
    else { J.body.rotation.z = 0.025 * Math.sin(t * 1.1); J.cap.rotation.z = -0.03 * Math.sin(t * 1.1 + 0.4); }
    glow = o.glow ?? glow; U.glow = glow;
    const m = J.bulb.children[0]?.material; if (m) m.emissiveIntensity = 0.2 + 2.4 * glow;
    if (U.light) U.light.intensity = (o.lightK ?? 1) * glow;
  },
  glider(J, t, b, mode, s, o, U) {
    let bank = 0, flap = 0;
    if (mode === 'dance') { J.body.position.y += s * 3 * bounce(b); bank = 0.22 * Math.sin(Math.PI * b); flap = 0.18 * Math.sin(2 * Math.PI * b); }
    else if (mode === 'use') { bank = 0.15 * Math.sin(t * 0.9); flap = 0.04 * Math.sin(t * 3); J.body.position.y += s * 1.5 * Math.sin(t * 1.4); }
    else { J.body.position.y += s * 0.8 * Math.sin(t * 1.6); bank = 0.06 * Math.sin(t * 0.8); flap = 0.05 * Math.sin(t * 2.2); }
    bank = o.bank ?? bank; flap = o.flap ?? flap;
    J.body.rotation.x = bank; J.wingL.rotation.x = -flap; J.wingR.rotation.x = flap;
  },
  wheel(J, t, b, mode, s, o, U) {
    const R = (J.tyre.children[0]?.geometry.boundingBox?.max.y ?? 8) ; // tyre mesh is local to the hub pivot: max.y = radius
    let roll = o.roll ?? (o.dist != null ? o.dist / R : 0);
    if (mode === 'dance') { J.body.position.y += s * 2.5 * bounce(b); J.head.rotation.x = 0.12 * Math.sin(Math.PI * b); roll += 0.25 * Math.sin(Math.PI * b); }
    else if (mode === 'roll' && o.roll == null && o.dist == null) roll = t * 4;
    else if (mode === 'idle') J.body.scale.y = 1 + 0.015 * Math.sin(t * 2.4);
    (J.spin || J.head).rotation.z = -roll;   // tyre + hub + horns spin; the face (eyes, mouth) stays upright on the head
  },
  bridge(J, t, b, mode, s, o, U) {
    const n = 8; let amp = 0.35, ph = t * 3, k = 0.8;
    if (mode === 'dance') { amp = 1.6; ph = Math.PI * 2 * b; k = 0.7; J.head.position.y += s * 2.2 * bounce(b); J.head.rotation.z = 0.15 * Math.sin(Math.PI * b); }
    else if (mode === 'use') amp = 0;
    for (let i = 0; i < n; i++) { const g = J['plank' + i]; if (g) g.position.y += s * amp * Math.max(0, Math.sin(ph - (n - i) * k)); }
  },
  button(J, t, b, mode, s, o, U) {
    let press = o.press ?? 0, flash = o.flash ?? 0;
    if (mode === 'dance') { J.body.position.y += s * 1.5 * bounce(b); J.head.rotation.z = 0.06 * Math.sin(Math.PI * b); if (o.flash == null) flash = Math.pow(Math.max(0, Math.cos(Math.PI * 2 * b)), 8); }
    else if (mode === 'use' && o.press == null) { const f = ((b % 1) + 1) % 1; press = f < 0.12 ? sstep(0, 0.12, f) : 1 - sstep(0.12, 0.45, f); }
    else if (mode === 'idle') J.head.scale.y = 1 + 0.012 * Math.sin(t * 2.2);
    J.head.scale.y *= 1 - 0.38 * press; J.head.scale.x *= 1 + 0.06 * press; J.head.scale.z *= 1 + 0.06 * press;
    U.press = press; U.flash = flash;
    const m = J.spots.children[0]?.material; if (m?.emissive) { m.emissive.setRGB(1, 0.92, 0.55); m.emissiveIntensity = 2.2 * flash; }
  },
};
