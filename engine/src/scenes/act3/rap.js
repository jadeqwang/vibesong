// ACT III · 110.41-123.354 · RAP VERSE = THE BUG BATTLE (turns 1-5, the triple tech, VICTORY = THE PAINT FLOOD, THE RECRUIT).
// The whole battle (107.15-123.354) is one scene in battle.js; this entry renders its second range.
// Exports kept for Act IV (src/scenes/act4/main3d.js imports FLOOD, FEATURE_T) and for HANDOFF_123.md.
import { setupBattle } from './battle.js';
export { FLOOD, floodRadius, FEATURE_T, REVEAL, BAND, BUGP, PENCIL, HANDOVER_CAM, handover, handoverBand, handoverFeature, handoverProps, bookPose } from './battle.js';
export async function setup(ctx) { return setupBattle(ctx); }
