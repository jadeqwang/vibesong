// ACT III paint ledger: EVERY character interaction colours one object (Jade's note, 2026-10-14). The ledger is the
// single source of all hand-colouring before THE PAINT FLOOD; every Act III frame applies it after W.reset(), so colour
// accumulates across scenes as a pure function of song time. Each colouring grows with the colored-pencil hatching
// edge (the flood's shader, scoped to one object) from its beat / interaction hit.
//   Jade      pencil flicks colour the cypress avenue (from the tip down) + her footsteps colour the flowers
//   Charlie   whatever his hat touches (the temple column the boomerang hits, the pressure plate)
//   Ricky     whatever his beam / chord hits (the two far switches, the tripod, the receiver, the stage arch)
//   stage     the coloured spotlights colour the steps under each band member
// Large areas (hills, far ruins, the meadow, the cliffs) stay plaster until 119.02.
import * as THREE from 'three';
import * as T from '../../show/timing.js';
import { CUE, V, clamp01 } from './common.js';
import { MESA_A, MESA_B, CHASM } from './world/build.js';

export const TREE_HITS = [[81.87, 0], [82.265, 1], [83.09, 2], [84.15, 3], [85.19, 4], [85.56, 5], [86.385, 6]];
export const BOOMERANG = { throw: 84.55, hit: 84.95, back: 85.4, col: new THREE.Vector3(522, 0, -78) };   // Charlie's hat hits a temple column
export const COOP = { plate: 101.15, tripod: 103.88, receiver: 104.3 };
export const STAGE_HITS = [108.08, 108.68, 109.28];
export const PATH_V2 = { x0: 600, x1: 784, z: 348, t0: 94.204, t1: 100.55 };

const ease = (u) => 1 - Math.pow(1 - clamp01(u), 2);
const mats = (obj) => { const out = new Set(); obj.traverse((o) => { const m = o.material; if (m?.userData?.lp) out.add(m); }); return [...out]; };

export function makeLedger(W) {
  const P = W.props;
  const ruinMats = mats(W.ruins);
  const switchMats = P.switches.map(mats);
  const recvMats = mats(P.receiver), tripodMats = mats(P.tripod), archMats = mats(P.arch);
  const plateMat = P.plate.userData.plate.material;
  const lpOf = (m) => m.userData.lp;
  const flowerLP = [P.flowers.stemMat, P.flowers.headMat, W.mesaA.userData.tufts.material].map(lpOf);
  const topA = lpOf(W.mesaA.userData.tops.material), topB = lpOf(W.mesaB.userData.tops.material);
  const S = P.stageC;
  // band positions on the stage (shared with stage.js)
  const BAND = { jade: V(S.x, MESA_B.top + 6, S.z), charlie: V(S.x - 6, MESA_B.top + 6, S.z - 30), ricky: V(S.x - 6, MESA_B.top + 6, S.z + 30) };
  P.BAND = BAND;

  return function apply(t) {
    // cypress avenue (Jade's flicks): tip-down wipe
    for (const [te, k] of TREE_HITS) {
      const s = T.since(t, te); if (s < 0) continue;
      const m = W.avenue[k]; const { h, base } = m.userData; const u = ease((s - 0.08) / 0.55);
      W.avenueLP[k].wipe(base + h + 40 - (h + 80) * u, 28);
    }
    // Charlie's boomerang hat -> one temple column, bottom to top
    { const s = t - BOOMERANG.hit; if (s >= 0) { const u = ease(s / 0.5); const c = BOOMERANG.col;
      for (const m of ruinMats) for (let k = 0; k < 4; k++) { const r = 34 * clamp01(u * 4 - k); if (r > 1) lpOf(m).addSphere(c.x, W.groundY(c.x, c.z) + 25 + k * 50, c.z, r); } } }
    // Ricky's far switches (accent pair 88.86 / 89.68)
    [CUE.pairs[4], CUE.pairs[5]].forEach((te, k) => { const s = t - te - 0.08; if (s >= 0) for (const m of switchMats[k]) lpOf(m).all(ease(s / 0.4)); });
    // Jade's path of colour through the flowers (and footstep trail on mesa A)
    if (t >= PATH_V2.t0) {
      const x = PATH_V2.x0 + (PATH_V2.x1 - PATH_V2.x0) * clamp01((t - PATH_V2.t0) / (PATH_V2.t1 - PATH_V2.t0));
      for (const lp of flowerLP) lp.capsule(V(PATH_V2.x0 - 10, MESA_A.top, PATH_V2.z), V(x + 10, MESA_A.top, PATH_V2.z), 24).edge(18);
    }
    // co-op: plate (Charlie), tripod + receiver (Ricky's beam), the beam's pools on the mesa tops
    if (t >= COOP.plate) plateMat.userData.lp.all(ease((t - COOP.plate) / 0.35));
    if (t >= COOP.tripod) for (const m of tripodMats) lpOf(m).all(ease((t - COOP.tripod) / 0.4));
    if (t >= COOP.receiver) for (const m of recvMats) lpOf(m).all(ease((t - COOP.receiver) / 0.4));
    if (t >= COOP.tripod) topA.addSphere(990, MESA_A.top, 410, 30 * ease((t - COOP.tripod) / 0.6));
    if (t >= COOP.receiver) topB.addSphere(1125, MESA_B.top, 455, 28 * ease((t - COOP.receiver) / 0.6));
    // footsteps across the bridge onto mesa B
    if (t >= 106.2) topB.addSphere(CHASM.x1 + 30, MESA_B.top, 412, 34 * ease((t - 106.2) / 0.6));
    // the stage: each spotlight slams colour onto the steps under its band member; the arch takes Ricky's chord
    const order = ['jade', 'charlie', 'ricky'];
    STAGE_HITS.forEach((te, i) => { const s = t - te; if (s < 0) return; const b = BAND[order[i]]; const u = ease(s / 0.3);
      lpOf(P.stageMat).addSphere(b.x, b.y, b.z, 22 * u); lpOf(P.seatMat).addSphere(b.x - 85, b.y, b.z, 46 * u); });
    if (t >= STAGE_HITS[2]) { const u = ease((t - STAGE_HITS[2]) / 0.5); const a = P.arch.position;
      for (const m of archMats) { lpOf(m).addSphere(a.x, a.y + 60, a.z - 38, 80 * u); lpOf(m).addSphere(a.x, a.y + 60, a.z + 38, 80 * u); } }
    if (t >= 109.6) lpOf(P.stageMat).all(ease((t - 109.6) / 0.6));
  };
}
