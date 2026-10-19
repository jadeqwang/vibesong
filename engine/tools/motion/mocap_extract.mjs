// Offline mocap -> voxfig rig retarget (MOTION spike, 2026-10-16).
//   node tools/motion/mocap_extract.mjs            -> assets/mocap/ual/ual_rig.json
// Source: Quaternius Universal Animation Library 1 + 2, Standard (CC0 1.0), GLBs in assets/mocap/ual/_dl*/x/ (read as data).
//
// Retarget = direction-based, so it is independent of bone lengths / rest poses:
//   legs (pelvis group)  <- pelvis orientation change vs bind      body <- pelvis/chest blend      head <- neck/head (body-local)
//   shoulder / hip       <- upper-bone DIRECTION + the elbow / knee hinge axis (measured per bone in the upper bone's local frame)
//   elbow / knee         <- signed hinge angle between upper and lower bone directions
//   ankle (not in the rig yet) <- foot pitch vs the shin, stored for a rig upgrade
//   root                 <- pelvis sway (x, z) scaled by leg length; height re-solved on OUR leg FK so the planted foot touches y = 0
// Mocap space: +z forward, +x = character's left, y up. Ours (voxfig): +x forward, +z = right, y up => C = rotation +90 deg about y.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as THREE from 'three';
import { loadMocap } from './mocap_fk.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const SRC = {
  ual1: path.join(ROOT, 'assets/mocap/ual/_dl/x/UAL1_Standard.glb'),
  ual2: path.join(ROOT, 'assets/mocap/ual/_dl2/x/UAL2_Standard.glb'),
};
// name: [source, clip, loop]
const CLIPS = {
  idle: ['ual1', 'Idle_Loop', true], walk: ['ual1', 'Walk_Loop', true], jog: ['ual1', 'Jog_Fwd_Loop', true], run: ['ual1', 'Sprint_Loop', true],
  jump_start: ['ual1', 'Jump_Start', false], jump_loop: ['ual1', 'Jump_Loop', true], jump_land: ['ual1', 'Jump_Land', false],
  push: ['ual1', 'Push_Loop', true], pickup: ['ual1', 'PickUp_Table', false], interact: ['ual1', 'Interact', false],
  dance: ['ual1', 'Dance_Loop', true], talk: ['ual1', 'Idle_Talking_Loop', true], crouch_walk: ['ual1', 'Crouch_Fwd_Loop', true],
  throw: ['ual2', 'OverhandThrow', false], yes: ['ual2', 'Yes', false], fold_arms: ['ual2', 'Idle_FoldArms_Loop', true],
  carry_walk: ['ual2', 'Walk_Carry_Loop', true], climb_1m: ['ual2', 'ClimbUp_1m', false],
};
const LOCO = { walk: 1, jog: 1, run: 1, crouch_walk: 1, carry_walk: 1, push: 1 };   // loops re-phased so phase 0 = right-foot strike
export const JOINTS = ['legs', 'body', 'head', 'shoulderR', 'elbowR', 'shoulderL', 'elbowL', 'hipR', 'kneeR', 'hipL', 'kneeL'];
// our rig (design units, voxfig heromodels SKEL): hip 45.5, knee 24.5, ankle 6, legZ ~6.3; shoe sole heel / toe (avg of the 3 heroes)
const RIG = { hip: 45.5, thigh: 21, shinAnkle: 18.5, shinSole: 24.5, legZ: 6.3, heel: -4.2, toe: 9.6 };
const LEGM = 0.932;                       // mocap thigh-joint height at bind (m)
const K = RIG.hip / LEGM;                  // design units per mocap metre (leg-length ratio)
const SR = 240;                            // analysis sample rate (Hz)

const C = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2), Ci = C.clone().invert();
const cv = (v) => v.clone().applyQuaternion(C);
const cq = (q) => C.clone().multiply(q).multiply(Ci);
const V = (x, y, z) => new THREE.Vector3(x, y, z);

const MO = { ual1: loadMocap(SRC.ual1), ual2: loadMocap(SRC.ual2) };
const BIND = { ual1: MO.ual1.worldAt(null, 0), ual2: MO.ual2.worldAt(null, 0) };

// ---- hinge axes (elbow / knee) in the upper bone's local frame, averaged over every frame of every clip, oriented so that
//      cross(upper dir, lower dir) . axis > 0 is a normal bend
const CH = { R: { arm: ['upperarm_r', 'lowerarm_r', 'hand_r'], leg: ['thigh_r', 'calf_r', 'foot_r'] }, L: { arm: ['upperarm_l', 'lowerarm_l', 'hand_l'], leg: ['thigh_l', 'calf_l', 'foot_l'] } };
const HINGE = {};
for (const sd of ['R', 'L']) for (const limb of ['arm', 'leg']) {
  const [a, b, c] = CH[sd][limb]; const acc = V(0, 0, 0);
  for (const [nm, [src, clip]] of Object.entries(CLIPS)) {
    const M = MO[src], Cl = M.clips[clip];
    for (let t = 0; t <= Cl.dur; t += 1 / 30) {
      const W = M.worldAt(Cl, t); const qi = W.Q[a].clone().invert();
      const du = W.P[b].clone().sub(W.P[a]).applyQuaternion(qi).normalize(), dl = W.P[c].clone().sub(W.P[b]).applyQuaternion(qi).normalize();
      acc.add(du.clone().cross(dl));   // weighted by sin(bend)
    }
  }
  HINGE[sd + limb] = acc.normalize();
}
console.log('hinge axes (upper-bone local):', Object.fromEntries(Object.entries(HINGE).map(([k, v]) => [k, v.toArray().map((x) => +x.toFixed(3))])));

const basis = (d, n) => { const b = d.clone().cross(n); return new THREE.Matrix4().makeBasis(d, n, b); };
const REST = { arm: basis(V(0, -1, 0), V(0, 0, 1)), leg: basis(V(0, -1, 0), V(0, 0, -1)) };
const restInvT = { arm: REST.arm.clone().transpose(), leg: REST.leg.clone().transpose() };
/** rotation mapping our rest limb frame (dir -y, hinge +-z) to (d, n), expressed in a parent frame with orientation qp */
function limbRot(kind, d, n, qp) {
  const qi = qp.clone().invert(); const dl = d.clone().applyQuaternion(qi).normalize(); let nl = n.clone().applyQuaternion(qi);
  nl.addScaledVector(dl, -nl.dot(dl)).normalize();
  const m = basis(dl, nl).multiply(restInvT[kind]); return new THREE.Quaternion().setFromRotationMatrix(m);
}
const hingeAngle = (du, dl, n) => Math.max(0, Math.min(2.7, Math.atan2(du.clone().cross(dl).dot(n), du.dot(dl))));

/** retarget one mocap frame -> { q: {joint: Quaternion}, ankle: {R, L} (rad), contact: {R, L}, pel: Vector3 (ours, m) } */
// contact overrides (in-place jump clips dangle a foot near y = 0 in the air)
const CONTACT_OVERRIDE = { Jump_Start: (t) => t < 0.085, Jump_Loop: () => false };
function frame(src, clip, t) {
  const M = MO[src], B = BIND[src], W = M.worldAt(clip, t);
  const rel = (bone) => cq(W.Q[bone].clone().multiply(B.Q[bone].clone().invert()));
  const q = {};
  q.legs = rel('pelvis');
  q.body = rel('pelvis').slerp(rel('spine_03'), 0.8);
  q.head = q.body.clone().invert().multiply(rel('neck_01').slerp(rel('Head'), 0.6));
  const out = { q, ankle: {}, contact: {} };
  for (const sd of ['R', 'L']) {
    for (const limb of ['arm', 'leg']) {
      const [a, b, c] = CH[sd][limb];
      const du = cv(W.P[b].clone().sub(W.P[a])).normalize(), dl = cv(W.P[c].clone().sub(W.P[b])).normalize();
      const n = cv(HINGE[sd + limb].clone().applyQuaternion(W.Q[a])).normalize();
      const parent = limb === 'arm' ? q.body : q.legs;
      const th = hingeAngle(du, dl, n);
      if (limb === 'arm') { q['shoulder' + sd] = limbRot('arm', du, n, parent); q['elbow' + sd] = new THREE.Quaternion().setFromAxisAngle(V(0, 0, 1), th); }
      else { q['hip' + sd] = limbRot('leg', du, n, parent); q['knee' + sd] = new THREE.Quaternion().setFromAxisAngle(V(0, 0, 1), -th); }
    }
    // ankle pitch vs the shin (rest: the bind foot direction)
    const s = sd.toLowerCase(), fd = cv(W.P['ball_' + s].clone().sub(W.P['foot_' + s])).normalize(), fb = cv(B.P['ball_' + s].clone().sub(B.P['foot_' + s])).normalize();
    const shinQ = q.legs.clone().multiply(q['hip' + sd]).multiply(q['knee' + sd]); const fl = fd.applyQuaternion(shinQ.clone().invert());
    out.ankle[sd] = Math.atan2(fl.y, fl.x) - Math.atan2(fb.y, fb.x);
    out.contact[sd] = CONTACT_OVERRIDE[clip.name] ? CONTACT_OVERRIDE[clip.name](t) : (W.P['foot_' + s].y < 0.118 || W.P['ball_' + s].y < 0.03);
  }
  // r2 rig-split extras (used only when the figure has J.chest / J.wrist*): lower torso, chest on it, head on the chest, wrist flex
  const b2 = rel('pelvis').slerp(rel('spine_01'), 0.6), chW = rel('spine_03'), nh = rel('neck_01').slerp(rel('Head'), 0.6);
  out.ex = { body2: b2, chest: b2.clone().invert().multiply(chW), head2: chW.clone().invert().multiply(nh), wrist: {} };
  for (const sd of ['R', 'L']) { const s = sd.toLowerCase(), [a, b, c] = CH[sd].arm;
    const sAng = (P, Q) => { const dl = cv(P[c].clone().sub(P[b])).normalize(), dh = cv(P['middle_01_' + s].clone().sub(P[c])).normalize(), n = cv(HINGE[sd + 'arm'].clone().applyQuaternion(Q[a])).normalize(); return Math.atan2(dl.clone().cross(dh).dot(n), dl.dot(dh)); };
    out.ex.wrist[sd] = sAng(W.P, W.Q) - sAng(B.P, B.Q); }
  out.pel = cv(W.P.pelvis);
  out.feetMid = cv(W.P.foot_l.clone().add(W.P.foot_r).add(W.P.ball_l).add(W.P.ball_r).multiplyScalar(0.25));
  return out;
}

/** our leg FK (design units, root at the origin, hip centre at RIG.hip + dy): lowest sole y, ankle point */
function legFK(fr, sd, dy = 0) {
  const H = V(0, RIG.hip + dy, 0), z = sd === 'R' ? RIG.legZ : -RIG.legZ;
  const qh = fr.q.legs.clone().multiply(fr.q['hip' + sd]); const qk = qh.clone().multiply(fr.q['knee' + sd]);
  const knee = H.clone().add(V(0, 0, z).applyQuaternion(fr.q.legs)).add(V(0, -RIG.thigh, 0).applyQuaternion(qh));
  const heel = knee.clone().add(V(RIG.heel, -RIG.shinSole, 0).applyQuaternion(qk)), toe = knee.clone().add(V(RIG.toe, -RIG.shinSole, 0).applyQuaternion(qk));
  const ankle = knee.clone().add(V(0, -RIG.shinAnkle, 0).applyQuaternion(qk));
  return { low: Math.min(heel.y, toe.y), heel, toe, ankle };
}

const r4 = (x) => Math.round(x * 1e4) / 1e4;
const OUT = { meta: {
  source: 'Quaternius Universal Animation Library 1 + 2 (Standard), https://quaternius.com/packs/universalanimationlibrary.html', license: 'CC0 1.0 Universal (public domain), see LICENSE_UAL.txt',
  generated: 'tools/motion/mocap_extract.mjs', rig: RIG, joints: JOINTS, units: 'root offsets in design units (x model.u = world); quats [x,y,z,w] per joint in the parent joint frame of voxfig buildFigure',
  frame: 'per frame: [11 joint quats (44)] [root dx, dy, dz] [ankle pitch R, L] [contact R, L]', extra: 'clip.ex per frame: [body2 quat (lower torso), chest quat (on body2), head2 quat (on chest), wrist flex R, L (rad, about the elbow hinge)] for the rig split', designPerMetre: r4(K) }, clips: {} };

for (const [name, [src, clipName, loop]] of Object.entries(CLIPS)) {
  const M = MO[src], Cl = M.clips[clipName]; const dur = Cl.dur;
  // dense analysis at SR: contacts, phase-0 marker, ground speeds
  const NS = Math.round(dur * SR); const dense = [];
  for (let i = 0; i <= NS; i++) dense.push(frame(src, Cl, (i / NS) * dur));
  let t0 = 0;
  if (LOCO[name]) { for (let i = 1; i <= NS; i++) if (dense[i].contact.R && !dense[i - 1].contact.R) { t0 = (i / NS) * dur; break; } }
  // output frames at ~30 fps of the clip, uniform in phase from t0
  const N = Math.max(2, Math.round(dur * 30)); const frames = [], exFrames = [];
  const at = (u) => frame(src, Cl, loop ? ((t0 + u * dur) % dur) : u * dur);
  const F = []; for (let i = 0; i < N + (loop ? 0 : 1); i++) F.push(at(i / N));
  // root: x, z sway vs the cycle mean (loops) or the feet at frame 0 (one-shots); y re-solved on our legs
  const ref = loop ? F.reduce((a, f) => a.add(f.pel), V(0, 0, 0)).multiplyScalar(1 / F.length) : F[0].feetMid.clone().setY(F[0].pel.y);
  const pelBindY = cv(BIND[src].P.pelvis).y;
  const dyC = F.map((f) => { const lows = ['R', 'L'].filter((s) => f.contact[s]).map((s) => legFK(f, s).low); return lows.length ? -Math.max(...lows) : null; });
  const dyM = F.map((f) => (f.pel.y - pelBindY) * K);
  // fill contact-free frames (flight): mocap pelvis motion + the contact-solved correction interpolated across the gap
  const corr = dyC.map((d, i) => (d === null ? null : d - dyM[i])); const n = F.length;
  const known = corr.map((c, i) => (c === null ? -1 : i)).filter((i) => i >= 0);
  const dy = F.map((_, i) => {
    if (corr[i] !== null) return dyC[i]; if (!known.length) return dyM[i];
    let a = -1, b = -1; for (let k = 1; k < n && (a < 0 || b < 0); k++) { const ia = loop ? (i - k + n) % n : i - k, ib = loop ? (i + k) % n : i + k;
      if (a < 0 && ia >= 0 && corr[ia] !== null) a = k; if (b < 0 && ib < n && corr[ib] !== null) b = k; }
    const ca = a > 0 ? corr[loop ? (i - a + n) % n : i - a] : null, cb = b > 0 ? corr[loop ? (i + b) % n : i + b] : null;
    const c = ca === null ? cb : cb === null ? ca : (ca * b + cb * a) / (a + b); return dyM[i] + c; });
  for (const [i, f] of F.entries()) {
    const row = []; for (const j of JOINTS) { const qq = f.q[j]; row.push(r4(qq.x), r4(qq.y), r4(qq.z), r4(qq.w)); }
    row.push(r4((f.pel.x - ref.x) * K), r4(dy[i]), r4((f.pel.z - ref.z) * K), r4(f.ankle.R), r4(f.ankle.L), f.contact.R ? 1 : 0, f.contact.L ? 1 : 0);
    frames.push(row);
    const e = f.ex, xr = []; for (const k of ['body2', 'chest', 'head2']) xr.push(r4(e[k].x), r4(e[k].y), r4(e[k].z), r4(e[k].w)); xr.push(r4(e.wrist.R), r4(e.wrist.L)); exFrames.push(xr);
  }
  // contact intervals (phase / progress units) from the dense pass, re-phased; ground speeds (mocap m/s and our design u/s)
  const cont = { R: [], L: [] }; const sp = { m: [], ours: [] };
  for (const s of ['R', 'L']) {
    const flags = []; for (let i = 0; i < NS; i++) flags.push(dense[i].contact[s]);
    const shift = Math.round((t0 / dur) * NS); const fl = loop ? flags.map((_, i) => flags[(i + shift) % NS]) : flags;
    let a = -1; for (let i = 0; i <= NS; i++) { const on = i < NS && fl[i]; if (on && a < 0) a = i; if (!on && a >= 0) { cont[s].push([r4(a / NS), r4(i / NS)]); a = -1; } }
    for (let k = cont[s].length - 1; k > 0; k--) if (cont[s][k][0] - cont[s][k - 1][1] < 0.03) { cont[s][k - 1][1] = cont[s][k][1]; cont[s].splice(k, 1); }   // merge flicker gaps
    if (loop && cont[s].length > 1 && cont[s][0][0] === 0 && cont[s][cont[s].length - 1][1] === 1) { const last = cont[s].pop(); cont[s][0] = [r4(last[0] - 1), cont[s][0][1]]; }
    for (let i = 1; i < NS; i++) if (flags[i] && flags[i - 1]) {
      const dt = dur / NS; const b0 = MO[src].worldAt(Cl, (i - 1) * dt), b1 = MO[src].worldAt(Cl, i * dt); const bn = 'ball_' + s.toLowerCase();
      if (i % 8) continue; sp.m.push(-(cv(b1.P[bn]).x - cv(b0.P[bn]).x) / dt);
      const f0 = dense[i - 1], f1 = dense[i]; sp.ours.push(-(legFK(f1, s).ankle.x - legFK(f0, s).ankle.x) / dt);
    }
  }
  const med = (a) => { if (!a.length) return 0; const b = [...a].sort((x, y) => x - y); return b[b.length >> 1]; };
  const vm = med(sp.m), vo = med(sp.ours);
  OUT.clips[name] = { src: `${src}:${clipName}`, loop, dur: r4(dur), n: frames.length, loco: !!LOCO[name], phase0: r4(t0 / dur),
    speedMocap: r4(vm), speed: LOCO[name] ? r4(vo) : 0, stride: LOCO[name] ? r4(vo * dur) : 0, contacts: cont, frames, ex: exFrames };
  console.log(name.padEnd(12), clipName.padEnd(20), `dur ${dur.toFixed(2)} n ${frames.length} phase0 ${(t0 / dur).toFixed(3)}  v_mocap ${vm.toFixed(2)} m/s  v_ours ${vo.toFixed(1)} du/s (k*v ${(vm * K).toFixed(1)})`,
    'R', JSON.stringify(cont.R), 'L', JSON.stringify(cont.L), 'dy', Math.min(...dy).toFixed(1), Math.max(...dy).toFixed(1));
}
const out = path.join(ROOT, 'assets/mocap/ual/ual_rig.json');
fs.writeFileSync(out, JSON.stringify(OUT));
fs.copyFileSync(path.join(ROOT, 'assets/mocap/ual/_dl/x/License.txt'), path.join(ROOT, 'assets/mocap/ual/LICENSE_UAL.txt'));
console.log('wrote', out, (fs.statSync(out).size / 1024).toFixed(0) + ' KB');
