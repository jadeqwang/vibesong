// node tools/motion/mocap_probe.mjs <glb> <clip> : bone world positions over the clip (facing, foot heights, root drift)
import { loadMocap } from './mocap_fk.mjs';
const M = loadMocap(process.argv[2]); const C = M.clips[process.argv[3]];
const f = (v) => v.toArray().map((x) => x.toFixed(3).padStart(7)).join('');
const bind = M.worldAt(null, 0);
console.log('BIND pelvis', f(bind.P.pelvis), 'head', f(bind.P.Head), 'ball_l', f(bind.P.ball_l), 'foot_l', f(bind.P.foot_l), 'hand_l', f(bind.P.hand_l), 'thigh_l', f(bind.P.thigh_l));
for (let i = 0; i <= Math.round(C.dur * 30); i += +(process.argv[4] || 3)) {
  const t = i / 30, W = M.worldAt(C, t);
  console.log(t.toFixed(2), 'pel', f(W.P.pelvis), '| footL', f(W.P.foot_l), 'ballL', f(W.P.ball_l), '| footR', f(W.P.foot_r), 'ballR', f(W.P.ball_r));
}
