// Motion module (opt-in): retargeted mocap locomotion with a stride / cadence gait model, damped facing + momentum lean,
// cross-fades, layers, foot-locking leg IK, arm IK hand contacts, secondary springs, life (look-at, blinks, breathing),
// beat locking and lip sync for the voxfig heroes. API: engine/checkpoints/motion_r2.md (spike: checkpoints/motion.md).
export { loadMotionClips, sampleClip, Pose, blendPoses, layerPose, MASKS, JOINTS, clipStats, warpPhase, scaleGaitPose, keyedClip } from './clips.js';
export { Path } from './path.js';
export { MotionTrack, gaitWeights, gaitInfo, GAITS, GAIT_MODEL, SPEEDS, GRAVITY, FADE, DT } from './track.js';
export { MotionFigure } from './figure.js';
export { MotionGroup, formation, column } from './group.js';
export { hold, press, place, onJoint, onObject, carry, carryBody, carryFrame, guitarPoint, neckHand } from './contacts.js';
export { stopOn, beatPhase, strumLayer, footfallReport, landings } from './beats.js';
export { lipSync, visemeKeys, wordVisemes, toSet } from './lipsync.js';
export { defaultSprings, simSpring } from './springs.js';
export { blink, saccade, breath, weightShift, glance, exertion, follow, seedOf } from './life.js';
