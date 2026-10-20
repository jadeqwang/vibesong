// Dev show: system tests and the legacy 3D turn demo wrapped as a show entry.
export default function show() {
  return [
    { id: 'dev.systems', t0: 0, t1: 10, load: () => import('../scenes/dev/systems.js') },
    { id: 'dev.turn', t0: 10, t1: 16, load: () => import('../scenes/dev/turn_show.js') },
    { id: 'dev.video', t0: 20, t1: 30, load: () => import('../scenes/dev/video_test.js') },
    { id: 'dev.voxel_back', t0: 30, t1: 36, load: () => import('../scenes/dev/voxel_back_test.js') },
    { id: 'dev.figures', t0: 40, t1: 76, load: () => import('../scenes/dev/figure_test.js') },
    { id: 'dev.guitar', t0: 3000, t1: 3600, load: () => import('../scenes/dev/guitar_test.js') },   // (v47_hands) guitar rig bench
    { id: 'dev.creatures', t0: 1000, t1: 1400, load: () => import('../scenes/dev/creatures_test.js') },
    // MOTION spike (core/motion): OLD vs NEW locomotion. 2000: split (OLD | NEW), 2100: feet close-up split, 2200: NEW only
    { id: 'dev.motion', t0: 2000, t1: 2010, mode: 'split', load: () => import('../scenes/dev/motion_test.js') },
    { id: 'dev.motion_feet', t0: 2100, t1: 2110, mode: 'feet', load: () => import('../scenes/dev/motion_test.js') },
    { id: 'dev.motion_new', t0: 2200, t1: 2210, mode: 'new', load: () => import('../scenes/dev/motion_test.js') },
    // MOTION r2 (core/motion, checkpoints/motion_r2.md): SPIKE | R2 side by side, one scenario per entry
    { id: 'dev.motion2_stepup', t0: 2300, t1: 2316, scenario: 'stepup', load: () => import('../scenes/dev/motion2_test.js') },
    { id: 'dev.motion2_landing', t0: 2320, t1: 2336, scenario: 'landing', load: () => import('../scenes/dev/motion2_test.js') },
    { id: 'dev.motion2_trio', t0: 2340, t1: 2356, scenario: 'trio', load: () => import('../scenes/dev/motion2_test.js') },
    { id: 'dev.motion2_ramp', t0: 2360, t1: 2376, scenario: 'ramp', load: () => import('../scenes/dev/motion2_test.js') },
    { id: 'dev.motion2_turn', t0: 2380, t1: 2396, scenario: 'turn', load: () => import('../scenes/dev/motion2_test.js') },
    { id: 'dev.motion2_life', t0: 2400, t1: 2416, scenario: 'life', load: () => import('../scenes/dev/motion2_test.js') },
    { id: 'dev.motion2_carry', t0: 2420, t1: 2432, scenario: 'carry', load: () => import('../scenes/dev/motion2_test.js') },
    // r2b: the same scenarios on models_r6's split rig (rig: true; needs --figres 2.5): face / blink / lip sync, springs, hands
    { id: 'dev.motion2_face_rig', t0: 2440, t1: 2454, scenario: 'face', rig: true, load: () => import('../scenes/dev/motion2_test.js') },
    { id: 'dev.motion2_life_rig', t0: 2460, t1: 2476, scenario: 'life', rig: true, load: () => import('../scenes/dev/motion2_test.js') },
    { id: 'dev.motion2_stepup_rig', t0: 2480, t1: 2496, scenario: 'stepup', rig: true, load: () => import('../scenes/dev/motion2_test.js') },
    { id: 'dev.motion2_carry_rig', t0: 2500, t1: 2512, scenario: 'carry', rig: true, load: () => import('../scenes/dev/motion2_test.js') },
    // talos_r4 requests: a moving lift (feet ride it), quick steps, single file
    { id: 'dev.motion2_lift', t0: 2520, t1: 2530, scenario: 'lift', rig: true, load: () => import('../scenes/dev/motion2_test.js') },
    { id: 'dev.motion2_quick', t0: 2540, t1: 2546, scenario: 'quick', rig: true, load: () => import('../scenes/dev/motion2_test.js') },
    { id: 'dev.motion2_file', t0: 2560, t1: 2572, scenario: 'file', rig: true, load: () => import('../scenes/dev/motion2_test.js') },
    // BATTLE UI preview at real song time (src/show/battle_ui.js over the current act3/act4 scenes)
    { id: 'dev.battle_a', t0: 106, t1: 124.6, load: () => import('../scenes/dev/battle_ui_test.js') },
    { id: 'dev.battle_b', t0: 143, t1: 155, load: () => import('../scenes/dev/battle_ui_test.js') },
  ];
}
