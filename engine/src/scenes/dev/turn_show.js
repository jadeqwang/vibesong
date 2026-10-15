// The prototype's dimensional turn (2D CARTRIDGE slice -> 3D TALOS) running inside the show runner.
// Pattern for 3D scenes: build a world, return { stage:{kind:'3d', fx}, update(t), render(t, target) } and
// drive post/look yourself (applyLook from talos_world.js). Local time u = t - entry.t0.
import { setup as turnSetup } from '../turn_demo.js';

export async function setup(ctx) {
  const sc = await turnSetup(ctx);
  const t0 = ctx.entry.t0;
  return {
    stage: { kind: '3d', fx: { flash: 0, fade: 0 } },
    update(t) { sc.update(t - t0); },
    render(t, target) { ctx.post.render(sc.scene, sc.camera, target); },
  };
}
