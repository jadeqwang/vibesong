// FROZEN COPY of the approved motion spike (2026-10-16 09:38), kept only for spike-vs-r2 review renders. Do not use in scenes.
// Motion module (opt-in): retargeted mocap locomotion with distance-driven gait phase, damped facing + lean, cross-fades,
// layers and foot-locking leg IK for the voxfig heroes. See engine/checkpoints/motion.md for the API and results.
export { loadMotionClips, sampleClip, Pose, blendPoses, layerPose, MASKS, JOINTS } from './clips.js';
export { Path } from './path.js';
export { MotionTrack, gaitWeights, GRAVITY, FADE, DT } from './track.js';
export { MotionFigure } from './figure.js';
