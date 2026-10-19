// ACT III · 107.15-110.41 · 世界 是我的舞台: THE ENCOUNTER (bug battle, part 1).
// The whole battle (107.15-123.354) is one scene in battle.js; this entry renders its first range. Under the 4-frame
// battle swirl (107.15+) the verse2 scene itself renders, so the 107.15 seam is exact. See battle.js for the beat list.
import { setupBattle } from './battle.js';
export const ORDER = ['jade', 'charlie', 'ricky'];
export async function setup(ctx) { return setupBattle(ctx, { withVerse2: true }); }
