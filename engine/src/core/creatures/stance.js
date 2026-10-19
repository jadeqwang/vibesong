// UPRIGHT stance (round 2): the bugs stand on their hind legs like k09 / m1, the front legs become arms, the face turns
// front-on. Applied by set() AFTER the anim (everything composes: dance bounce/sway, bug loops), so it is additive.
//   legged bugs: the body pitches up by theta about Q (its rear-bottom, voxels) and Q is planted at (0, hipY); the hind legs
//   are re-hipped at Q and counter-rotated (they keep standing), legs 0/1 are arms; the head counter-rotates (headK * theta).
//   firefly: pitched hover (no ground contact).  caterpillar: the front half curves up off the ground (cobra), face forward.
import * as THREE from 'three';

export const STANCES = {
  ladybug: { Q: [-14, 5], theta: 1.22, hipY: 7.2, headK: 0.88, arms: 0.55 },
  beetle: { Q: [-16, 5], theta: 1.22, hipY: 7.4, headK: 0.9, arms: 0.55 },
  moth: { Q: [-14, 6], theta: 1.12, hipY: 5.4, headK: 0.85, arms: 0.5 },
  firefly: { Q: [0, 20], theta: 0.85, hipY: 20, headK: 0.75, arms: 0.45, hover: true },
  caterpillar: { R: 17, from: 2.5 },
};
const SIDES = [1, -1]; const LR = (s) => (s > 0 ? 'L' : 'R');
const _m = new THREE.Matrix4(), _v = new THREE.Vector3(), _e = new THREE.Euler();

export function applyStance(name, J, rest, s, o, b, mode, pivots) {
  const st = STANCES[name]; if (!st) return;
  if (name === 'caterpillar') return caterpillarUp(J, s, st, pivots);
  const th = st.theta; const B = J.body; const P = pivots.body;
  const off = _v.copy(B.position).sub(rest.body.p); const ox = off.x, oy = off.y, oz = off.z;
  B.rotation.z += th; B.updateMatrix(); _m.makeRotationFromQuaternion(B.quaternion);
  const v = new THREE.Vector3((st.Q[0] - P[0]) * s, (st.Q[1] - P[1]) * s, 0).applyMatrix4(_m);
  const tx = st.hover ? st.Q[0] * s : 0, ty = st.hipY * s;
  B.position.set(tx - v.x + ox, ty - v.y + oy, oz);
  // head front-on (slight upward tilt left for a high battle camera)
  if (J.head) J.head.rotation.z -= th * st.headK;
  const dance = mode === 'dance', pump = (k) => Math.max(0, Math.sin(Math.PI * (b + k)));
  for (const sd of SIDES) {
    const hind = J[`leg${LR(sd)}2`];
    if (hind) {
      if (!st.hover) { const hp = pivots[`leg${LR(sd)}2`]; hind.position.set((st.Q[0] - P[0]) * s, (st.Q[1] - P[1]) * s, (hp[2] - P[2]) * s); }
      hind.rotation.z -= th * (st.hover ? 0.7 : 1);
    }
    // arms: front pair spread and raised; on the dance they pump on alternating beats
    const a0 = J[`leg${LR(sd)}0`], a1 = J[`leg${LR(sd)}1`];
    const up = st.arms + (dance ? 0.9 * pump(sd > 0 ? 0 : 0.5) : 0.1 * Math.sin(b * Math.PI + sd));
    if (a0) { a0.rotation.z += up; a0.rotation.x += -sd * 0.55; }
    if (a1) { a1.rotation.z += 0.15 + (dance ? 0.35 * pump(sd > 0 ? 0.5 : 0) : 0); a1.rotation.x += -sd * 0.25; }
  }
}

function caterpillarUp(J, s, st, pivots) {
  // segments behind `from` stay down; ahead of it they follow an arc of radius R (voxels) up to the head
  const x0 = -19 + st.from * 6.4; const R = st.R;
  const lift = (x) => { const a = x - x0; if (a <= 0) return [0, 0]; const ang = a / R; return [x0 + R * Math.sin(ang) - x, R * (1 - Math.cos(ang))]; };
  for (let i = 0; i < 6; i++) { const g = J['seg' + i]; const px = pivots['seg' + i][0]; const [dx, dy] = lift(px); g.position.x += dx * s; g.position.y += dy * s; g.rotation.z += Math.max(0, (px - x0) / R) * 0.5; }
  const hx = pivots.head[0] + 3.5; const [dx, dy] = lift(hx); J.head.position.x += dx * s; J.head.position.y += dy * s; J.head.rotation.z -= 0.08;
}
