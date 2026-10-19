// prints the colour script as JSON samples: node tools/v4/color/sample_cs.mjs [variant] [step]
import { csAt, CS_CUES } from '../../../src/core/colorscript.js';
const v = process.argv[2] || 'default', step = +(process.argv[3] || 0.05), out = [];
for (let t = 0; t <= 203.0001; t += step) { const s = csAt(t, v); out.push([+t.toFixed(3), s.on ? s.sat2d : 1, s.on ? s.sat3d : 1, s.on ? s.tintAmt : 0, s.tint, s.protSat]); }
console.log(JSON.stringify({ cues: CS_CUES, samples: out }));
