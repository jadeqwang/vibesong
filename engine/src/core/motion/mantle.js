// Synthetic keyed clip for MotionTrack.climb(): a mantle onto a ledge at ~0.85-1.5x hip height (UAL Standard has no mantle;
// its Climb_1m is a ladder cycle). Root motion is keyed by the track (_climb) and the hands go on the lip by arm IK; these are
// the FK body / leg shapes underneath. Euler degrees in the voxfig convention (hero faces +x; z > 0 swings a limb forward,
// knees bend with -z, elbows with +z; body / head z < 0 = lean forward / look down; x = abduction, - right / + left).
import { keyedClip } from './clips.js';

const ARMS = (zR, zL, eR, eL, ab = 9) => ({ shoulderR: [-ab, 0, zR], shoulderL: [ab, 0, zL], elbowR: [0, 0, eR], elbowL: [0, 0, eL] });
export const MANTLE_KEYS = [
  [0.00, { ...ARMS(0, 0, 10, 10) }],
  [0.12, { body: [0, 0, -24], head: [0, 0, 14], ...ARMS(-38, -38, 22, 22, 12), hipR: [0, 0, 52], kneeR: [0, 0, -88], hipL: [0, 0, 52], kneeL: [0, 0, -88] }],   // crouch, arms back
  [0.30, { body: [0, 0, -12], head: [0, 0, 18], ...ARMS(150, 150, 20, 20, 12), hipR: [0, 0, -6], kneeR: [0, 0, -34], hipL: [0, 0, -10], kneeL: [0, 0, -28] }],     // spring up, hands over the lip, legs back off the wall
  [0.45, { body: [0, 0, -44], head: [0, 0, 22], ...ARMS(52, 52, 6, 6, 14), hipR: [0, 0, -4], kneeR: [0, 0, -44], hipL: [0, 0, -10], kneeL: [0, 0, -30] }],         // press up over the lip
  [0.53, { body: [0, 0, -46], head: [0, 0, 20], ...ARMS(46, 46, 8, 8, 14), hipR: [0, 0, 70], kneeR: [0, 0, -135], hipL: [0, 0, -8], kneeL: [0, 0, -26] }],        // right knee comes up (foot tucked under)
  [0.60, { body: [0, 0, -40], head: [0, 0, 16], ...ARMS(38, 38, 14, 14, 12), hipR: [0, 0, 104], kneeR: [0, 0, -124], hipL: [0, 0, -4], kneeL: [0, 0, -24] }],     // right foot onto the ledge
  [0.68, { body: [0, 0, -30], head: [0, 0, 10], ...ARMS(24, 24, 18, 18, 10), hipR: [0, 0, 70], kneeR: [0, 0, -90], hipL: [0, 0, 28], kneeL: [0, 0, -122] }],        // pushing up on the right, left foot tucked up off the wall
  [0.80, { body: [0, 0, -18], head: [0, 0, 4], ...ARMS(14, -12, 22, 18), hipR: [0, 0, 38], kneeR: [0, 0, -46], hipL: [0, 0, 62], kneeL: [0, 0, -96] }],          // stand up on the right, left leg comes up
  [1.00, { ...ARMS(0, 0, 10, 10) }],
];
export function mantleClip(dur = 1.25) { return keyedClip('mantle', MANTLE_KEYS, { dur, n: 61 }); }
