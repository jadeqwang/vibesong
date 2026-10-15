// Named colours for every look. Use these (not ad-hoc hex) so the show stays coherent and so an optional
// palette-quantise pass (post uPalMix) has every authored colour available.
export const PAL = {
  // paper + graphite (CARTRIDGE draft world). Bible: graphite #4A4A50 -> #9A9AA2.
  paper: '#efe6d2', paperHi: '#f7f0e0', paperLo: '#e2d6bd', paperSpeck: '#d6c9ae', blank: '#fbf8f1',
  g0: '#2e2e33', g1: '#4a4a50', g2: '#6b6b72', g3: '#9a9aa2', g4: '#c4c4ca', g5: '#dcdce0',
  ink: '#1b1b22',
  // the two pencils
  pencilBody: '#f2c230', pencilBodyLo: '#c9971c', pencilBodyHi: '#ffe27a', wood: '#e8c08a', woodLo: '#b98a52',
  ferrule: '#c8c8d0', ferruleLo: '#8e8e98', capBlue: '#4f8bff', capBlueLo: '#2f5fd0', capPink: '#ff8a5c', capPinkLo: '#d9603a',
  // rainbow (FUNCTIONS) ramp, 12 hues
  rainbow: ['#ff4d6d', '#ff7a3d', '#ffb02e', '#ffe14d', '#b6e84a', '#4fd06a', '#2ec4a6', '#2bb4e8', '#3b7bff', '#6a5cff', '#a35cff', '#e858d0'],
  // UI / HUD
  navy0: '#0d1022', navy1: '#161b38', navy2: '#222a52', navy3: '#323d72', slate: '#3a3f55', slateHi: '#5a6080', slateLo: '#24273a',
  gold: '#f5c542', goldLo: '#b8862a', goldHi: '#ffe58a', white: '#ffffff', offwhite: '#f4f1ea', black: '#000000',
  red: '#e8344a', redLo: '#9e1f30', green: '#3ad06a', greenLo: '#1e8a43', termGreen: '#58f08a', blue: '#3b7bff', blueHi: '#9ec2ff', sky: '#7cc4ff',
  orange: '#ff7a1a', yellow: '#ffd23f',
  // VOID / EDITOR
  void: '#05060d', grid: '#13234a', gridHi: '#1f3d7a', gizmoBlue: '#3d7bff', missingA: '#b028c8', missingB: '#120814',
  hyperlink: '#2b5cff',
  // subtitles
  subTop: '#ffffff', subBot: '#c9d6ff', subBox: '#0d1022',
};
export const hexToRgb = (h) => { const v = parseInt(h.replace('#', ''), 16); return [(v >> 16) & 255, (v >> 8) & 255, v & 255]; };
export const rainbowAt = (u) => PAL.rainbow[((Math.floor(u * PAL.rainbow.length) % PAL.rainbow.length) + PAL.rainbow.length) % PAL.rainbow.length];
export function allPalette() {
  const out = [];
  for (const v of Object.values(PAL)) Array.isArray(v) ? out.push(...v) : out.push(v);
  return out;
}
