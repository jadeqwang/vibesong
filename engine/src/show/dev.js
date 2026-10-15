// Dev show: system tests and the legacy 3D turn demo wrapped as a show entry.
export default function show() {
  return [
    { id: 'dev.systems', t0: 0, t1: 10, load: () => import('../scenes/dev/systems.js') },
    { id: 'dev.turn', t0: 10, t1: 16, load: () => import('../scenes/dev/turn_show.js') },
    { id: 'dev.video', t0: 20, t1: 30, load: () => import('../scenes/dev/video_test.js') },
    { id: 'dev.voxel_back', t0: 30, t1: 36, load: () => import('../scenes/dev/voxel_back_test.js') },
  ];
}
