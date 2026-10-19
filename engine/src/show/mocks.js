// Mock show: keyframe tableaux for the game design pass (docs/game_design_acts1-3.md). Not part of the cut.
export default function show() {
  return [
    { id: 'mocks.a', t0: 14, t1: 34.69, load: () => import('../scenes/mocks/mocks_a.js') },
    { id: 'mocks.b', t0: 34.69, t1: 87, load: () => import('../scenes/mocks/mocks_b.js') },
  ];
}
