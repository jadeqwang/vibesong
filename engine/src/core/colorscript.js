// COLOR SCRIPT (v4 Pass B, unit "color"): the time-keyed colour ration for the whole show.
//
// The bible's rule, made global: the drafted world is graphite + paper; colour exists only where the blue-eraser
// (FUNCTIONS) pencil has touched, until the paint flood. Then the bridge drains it to dusk, and the 画 slam brings it
// back for good. Ration (song seconds):
//   0 -> 119.02      graphite + paper. Colour only on EXEMPT things: the heroes (canon colours: they bring the colour),
//                    the pencils, rainbow strokes she just drew (Hanzi2D style 'rainbow' / colour flood, PixelMaterial
//                    rainbow FX), HDR emissives in 3D (beams), and anything a scene tags with userData.cs (0..1).
//                    The rainbow 出发 (72.17) is a rainbow Hanzi2D, so it stays: the one big preview.
//   119.02 -> 123.354  the flood (the pencil plant on 119.02): the single full-spectrum break (sat ramps to 1.15).
//   123.354 -> 139.395 the bridge: the Eraser drains it to dusk (sat 1 -> 0.14, lilac-grey dusk tint) by 125.769.
//   139.395 ->       the 画 slam: colour returns for good (the grade switches off: frames are as authored).
//
// Mechanism (no scene edits needed for wave 1):
//   - 3D: src/post.js final pass (after tone map, before pixelate / palette / vignette). Exempt: heroes + creatures
//     (the alpha-0.5 mask paint.js already writes under --r5 + k08b), HDR emissives (luminance > protL), optional
//     high-chroma accents per key (protSat: the bridge's colour shards).
//   - 2D: src/core/stage2d.js patches every world / UI material once (a wrapper around main()) and sets a per-material
//     keep value each frame from existing state (duck-typed: hero Actors, Pencil props, rainbow Hanzi2D / flood,
//     PixelMaterial rainbow FX, userData.cs). UI: subtitles (ZUI.SUBS layer) are exempt (the one lyric style),
//     every other UI layer (prompt box, banners, REALITY bar, ...) is graded like the world.
//   - Paper inserts / cards that render with renderer.render (paper.js, spread.js, the new paper_inserts) never pass
//     through post: paper is its own layer and stays full colour.
// Switch: opt-in until the coordinator flips it. `--look k08b+cs` = k08b + this script; `--look k08b` = unchanged
// (byte-identical). `cs.enabled` is set by LookPass (src/look.js).
//
// Frame clock: src/core/show.js ShowRunner.render(t) sets CS.t (R-COLOR1; the wave-1 ENGINE wrapper shim is retired).
// This module has NO imports on purpose (node can import it to plot the script: tools/v4/colorscript_strip.py).

export const CS = { enabled: false, t: 0, variant: 'default', stageProtSat: 0.42 };

/** named tints (sRGB hex). Applied luminance-preserving: L * tint/luma(tint). */
export const CS_TINTS = { paper: '#efe2c8', plaster: '#f0d9b5', dusk: '#b9aecb', none: '#ffffff' };

/** cue times (seconds) the script snaps to. Every change lands on a drop or a stroke. */
export const CS_CUES = {
  chufa: 72.17,         // rainbow 出发 (the one preview: exempt by its own style, the world stays graphite)
  drop1: 80.815,        // the shatter: pixel/editor -> plaster (look change on a drop; grade unchanged)
  turnEnd: 86.385,      // the accent before FIXTURES!: the 3D 出发 preview protection ends
  stage: 107.15,        // 世界 是我的舞台: one coloured spotlight per member (gold / rose / teal, stage_3d)
  stageEnd: 110.41,     // the rap
  plant: 119.02,        // the pencil plant: the flood (the only full-spectrum break)
  wave: 119.6,          // the wave crest is up: full spectrum reached
  bridge: 123.354,      // the Eraser rises: the drain starts
  card: 125.769,        // the bridge paper card: drained to dusk by here
  shards: 129.34,       // the erased world: colour shards (protected accents) appear
  slam: 139.395,        // 画 FULL SLAM: colour back for good
};

const lerp = (a, b, u) => a + (b - a) * u;
const clamp01 = (x) => Math.max(0, Math.min(1, x));
const smooth = (u) => { u = clamp01(u); return u * u * (3 - 2 * u); };

/** variants. default (coordinator, M1 review): the 3D pre-flood (86.4-119) is WARM PLASTER: the golden light kept as a sepia
 *  (sat 0.30, plaster tint), so the approved warm targets 08 (1:47 stage) and 09 (1:27 slab) still read. graphite = the M1
 *  first pass (3D sat 0.12, paper tint). The 2D grade is the same in both. `+cs=warm` is kept as an alias of the default. */
const VARIANTS = {
  default: { sat2d: 0.06, sat3d: 0.30, tint3d: 'plaster', tintAmt3d: 0.75 },
  graphite: { sat2d: 0.06, sat3d: 0.12, tint3d: 'paper', tintAmt3d: 0.55 },
};
VARIANTS.warm = VARIANTS.default;

/**
 * The script at song time t. Returns
 *   on        grade active (false = frame exactly as authored)
 *   sat2d / sat3d   world saturation (0 = graphite/paper, 1 = authored, > 1 = the flood's vibrance)
 *   uiSat     2D UI chrome saturation (subtitles always exempt)
 *   tint, tintAmt   the paper / dusk cast of the desaturated part
 *   keepAmt   how much the exempt things keep (1 = full canon colour)
 *   protL     3D: HDR luminance above which pixels keep colour (beams, the glyph)
 *   protSat   3D: HSV saturation above which bright accents keep colour (0 = off)
 */
export function csAt(t, variant = CS.variant) {
  const V = VARIANTS[variant] || VARIANTS.default, K = CS_CUES;
  const o = { on: true, sat2d: V.sat2d, sat3d: V.sat3d, uiSat: V.sat2d, tint: V.tint3d, tintAmt: V.tintAmt3d, tintAmt2d: 0.5, keepAmt: 1, protL: 2.0, protSat: 0 };
  // 72.17 -> 86.385: the rainbow 出发 is the one preview; the 3D turn redraws it in its own geometry (no tag yet: COLOR_REQUESTS
  // H9), so strongly saturated, bright accents keep their colour in 3D until the drop (2D is exempt by the Hanzi2D style)
  if (t >= K.chufa && t < K.turnEnd) return { ...o, protSat: 0.8 };
  // 107.15 -> 110.41: the band on a stage (target 08): the coloured spotlights are the heroes' colours. Their pools / cones are
  // not HDR (additive cones, basic-material pools), so chroma protect keeps them (COLOR_REQUESTS H12 asks for an exact tag)
  if (t >= K.stage && t < K.stageEnd) return { ...o, protSat: CS.stageProtSat };
  if (t < K.plant) return o;
  if (t < K.bridge) {                                   // the flood: ramp with the wave, then hold the full spectrum
    const u = smooth((t - K.plant) / (K.wave - K.plant));
    return { ...o, sat2d: lerp(V.sat2d, 1.15, u), sat3d: lerp(V.sat3d, 1.15, u), uiSat: lerp(V.sat2d, 1, u), tintAmt: lerp(V.tintAmt3d, 0, u), tintAmt2d: lerp(0.5, 0, u) };
  }
  if (t < K.slam) {                                     // the bridge: drained to dusk; the shards keep their colour
    const u = smooth((t - K.bridge) / (K.card - K.bridge));
    const s = lerp(1.15, 0.14, u);   // continuous with the flood hold (no 0.15 step on 123.354)
    return { ...o, sat2d: s, sat3d: s, uiSat: s, tint: 'dusk', tintAmt: lerp(0, 0.6, u), tintAmt2d: lerp(0, 0.6, u), protSat: t >= K.shards ? 0.62 : 0 };
  }
  return { ...o, on: false, sat2d: 1, sat3d: 1, uiSat: 1, tintAmt: 0, tintAmt2d: 0 };
}

/** '#rrggbb' -> [r, g, b] 0..1, normalised to Rec.709 luma 1 (so the tint keeps the pixel's brightness) */
export function csTintVec(name, linear = false) {
  const h = CS_TINTS[name] || CS_TINTS.none, v = parseInt(h.slice(1), 16);
  let c = [(v >> 16 & 255) / 255, (v >> 8 & 255) / 255, (v & 255) / 255];
  if (linear) c = c.map((x) => (x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4));
  const l = 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  return c.map((x) => x / Math.max(l, 1e-4));
}

/** GLSL shared by post.js and stage2d.js: csGrade(colour, keep) with the uniforms below */
export const CS_GLSL = /* glsl */`
uniform float uCsOn, uCsSat, uCsTintAmt, uCsKeepAmt; uniform vec3 uCsTint;
vec3 csGrade(vec3 c, float keep){
  float L = dot(c, vec3(0.2126, 0.7152, 0.0722));
  vec3 base = mix(vec3(L), L * uCsTint, uCsTintAmt);
  vec3 g = uCsSat <= 1.0 ? mix(base, c, uCsSat) : vec3(L) + (c - vec3(L)) * uCsSat;
  return max(mix(g, c, clamp(keep * uCsKeepAmt, 0.0, 1.0)), 0.0);
}
`;
