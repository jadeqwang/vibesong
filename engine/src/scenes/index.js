// Scene registry: name -> module exporting async setup(ctx) -> {scene, camera, update(t), duration, warmup?}
import * as turn_demo from './turn_demo.js';
import * as talos from './talos.js';
export const scenes = { turn_demo, talos };
