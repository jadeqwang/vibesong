// 2D primitives on the game-pixel grid (1 world unit = 1 game pixel; y up; z = layer).
//   PixelMaterial  unlit, alpha-tested, NEAREST; uniforms: tint, flash (to white), sil (silhouette colour),
//                  opacity, uvRect (frame selection), flip, rainbow (hue-shift FX), dissolve (pixel dissolve)
//   Quad           a textured rectangle with an anchor in texels; place(x, y) snaps to whole game pixels
//   canvasTex()    CanvasTexture configured for pixel art
//   pixelCanvas()  helper to paint small pixel-art textures in code (props, icons, UI frames)
import * as THREE from 'three';

export function canvasTex(cv) {
  const t = new THREE.CanvasTexture(cv);
  t.magFilter = t.minFilter = THREE.NearestFilter; t.generateMipmaps = false; t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
export function imageTex(img) {
  const t = new THREE.Texture(img); t.needsUpdate = true;
  t.magFilter = t.minFilter = THREE.NearestFilter; t.generateMipmaps = false; t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
export function pixelCanvas(w, h, draw) {
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  const g = cv.getContext('2d', { willReadFrequently: true }); g.imageSmoothingEnabled = false;
  const px = (x, y, c, ww = 1, hh = 1) => { g.fillStyle = c; g.fillRect(x, y, ww, hh); };
  if (draw) draw(g, px, cv);
  return cv;
}
export function loadImage(url) { return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; }); }

const VS = /* glsl */`
  uniform vec4 uvRect; uniform float flip;
  varying vec2 vUv; varying float vWX;
  void main(){
    vec2 u = uv; if (flip > 0.5) u.x = 1.0 - u.x;
    vUv = uvRect.xy + u * uvRect.zw;
    vWX = (modelMatrix * vec4(position, 1.0)).x;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }`;
const FS = /* glsl */`
  uniform sampler2D map; uniform float hasMap; uniform vec4 tint; uniform float flash; uniform vec4 sil; uniform float opacity;
  uniform float rainbow; uniform float time; uniform float dissolve; uniform vec2 texSize; uniform float clipX; uniform float clipR;
  varying vec2 vUv; varying float vWX;
  vec3 hue(float h){ return clamp(abs(fract(h + vec3(0.0, 2.0/3.0, 1.0/3.0)) * 6.0 - 3.0) - 1.0, 0.0, 1.0); }
  float h21(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
  void main(){
    vec4 c = hasMap > 0.5 ? texture2D(map, vUv) : vec4(1.0);
    if (c.a < 0.5 || vWX < clipX || vWX > clipR) discard;   // clipX: world-x rub-out line (THE ERASER)
    vec2 tp = floor(vUv * texSize);
    if (dissolve > 0.0 && h21(tp) < dissolve) discard;
    c.rgb *= tint.rgb;
    if (rainbow > 0.0) { float l = dot(c.rgb, vec3(0.3, 0.59, 0.11)); c.rgb = mix(c.rgb, hue(tp.x * 0.03 + tp.y * 0.02 - time) * (0.35 + 0.9 * l), rainbow); }
    c.rgb = mix(c.rgb, sil.rgb, sil.a);
    c.rgb = mix(c.rgb, vec3(1.0), flash);
    gl_FragColor = vec4(c.rgb, opacity * tint.a);
    #include <colorspace_fragment>
  }`;

export class PixelMaterial extends THREE.ShaderMaterial {
  constructor(map = null, { opacity = 1, color = 0xffffff } = {}) {
    super({
      uniforms: {
        map: { value: map }, hasMap: { value: map ? 1 : 0 }, uvRect: { value: new THREE.Vector4(0, 0, 1, 1) }, flip: { value: 0 },
        tint: { value: new THREE.Vector4(1, 1, 1, 1) }, flash: { value: 0 }, sil: { value: new THREE.Vector4(0, 0, 0, 0) }, opacity: { value: opacity },
        rainbow: { value: 0 }, time: { value: 0 }, dissolve: { value: 0 }, clipX: { value: -1e9 }, clipR: { value: 1e9 },
        texSize: { value: new THREE.Vector2(map?.image?.width || 1, map?.image?.height || 1) },
      },
      vertexShader: VS, fragmentShader: FS, transparent: true, depthTest: false, depthWrite: false,
    });
    this.setColor(color);
  }
  setColor(c, a = this.uniforms.tint.value.w) { const col = new THREE.Color(c); this.uniforms.tint.value.set(col.r, col.g, col.b, a); }
  setMap(map) { this.uniforms.map.value = map; this.uniforms.hasMap.value = map ? 1 : 0; if (map?.image) this.uniforms.texSize.value.set(map.image.width, map.image.height); }
}

const PLANE = new THREE.PlaneGeometry(1, 1).translate(0.5, 0.5, 0); // origin at bottom-left

/**
 * A rectangle of w x h game pixels. anchor = [ax, ay] in pixels from the bottom-left of the rect
 * (sprites use their feet: anchor from sprites.json converted to bottom-up).
 */
export class Quad extends THREE.Mesh {
  constructor(tex, w, h, { anchor = [0, 0], color = 0xffffff, opacity = 1 } = {}) {
    super(PLANE, new PixelMaterial(tex, { color, opacity }));
    this.w = w; this.h = h; this.anchor = anchor; this.frustumCulled = false;
    this.px = 0; this.py = 0; this.sx = 1; this.sy = 1; this.flipped = false;
    this.scale.set(w, h, 1);
  }
  get U() { return this.material.uniforms; }
  setSize(w, h) { this.w = w; this.h = h; this._apply(); return this; }
  setRect(u0, v0, du, dv) { this.U.uvRect.value.set(u0, v0, du, dv); return this; }
  setFlip(f) { this.flipped = !!f; this.U.flip.value = f ? 1 : 0; this._apply(); return this; }
  /** place anchor at (x, y); snap=true rounds to whole game pixels (pixel-perfect) */
  place(x, y, snap = true) { this.px = snap ? Math.round(x) : x; this.py = snap ? Math.round(y) : y; this._apply(); return this; }
  /** uniform or xy scale about the anchor (hero-type punch). Non-integer scales are re-gridded by the pixel post. */
  setScale(sx, sy = sx) { this.sx = sx; this.sy = sy; this._apply(); return this; }
  _apply() {
    const ax = this.flipped ? this.w - this.anchor[0] : this.anchor[0];
    this.scale.set(this.w * this.sx, this.h * this.sy, 1);
    this.position.x = this.px - ax * this.sx; this.position.y = this.py - this.anchor[1] * this.sy;
  }
  set opacity(v) { this.U.opacity.value = v; }
  set flash(v) { this.U.flash.value = v; }
}

/** Solid-colour rectangle (no texture) in game pixels, bottom-left anchored. */
export function rect(w, h, color, opacity = 1) { return new Quad(null, w, h, { color, opacity }); }

/** Set render order (layer) for an object and all children. Higher z draws on top. */
export function setZ(obj, z) { obj.traverse((o) => { o.renderOrder = z; }); obj.position.z = 0; return obj; }
