// Minimal GLB reader (data only: JSON chunk + BIN chunk, accessors). Used offline by mocap_extract.mjs.
// Treats the file as untrusted data: no loaders, no textures, no code paths beyond typed-array reads.
import fs from 'node:fs';

const CT = { 5120: Int8Array, 5121: Uint8Array, 5122: Int16Array, 5123: Uint16Array, 5125: Uint32Array, 5126: Float32Array };
const NC = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT4: 16 };

export function readGLB(path) {
  const buf = fs.readFileSync(path);
  if (buf.readUInt32LE(0) !== 0x46546c67) throw new Error('not a GLB');
  let off = 12, json = null, bin = null;
  while (off < buf.length) {
    const len = buf.readUInt32LE(off), type = buf.readUInt32LE(off + 4);
    const data = buf.subarray(off + 8, off + 8 + len);
    if (type === 0x4e4f534a) json = JSON.parse(data.toString('utf8')); else if (type === 0x004e4942) bin = data;
    off += 8 + len;
  }
  const acc = (i) => {
    const a = json.accessors[i], bv = json.bufferViews[a.bufferView], T = CT[a.componentType], n = NC[a.type];
    const start = (bv.byteOffset || 0) + (a.byteOffset || 0), stride = bv.byteStride || 0, es = T.BYTES_PER_ELEMENT;
    const out = new Float32Array(a.count * n);
    if (!stride || stride === es * n) { const ab = bin.buffer.slice(bin.byteOffset + start, bin.byteOffset + start + a.count * n * es); const v = new T(ab); for (let k = 0; k < v.length; k++) out[k] = v[k]; }
    else for (let k = 0; k < a.count; k++) { const ab = bin.buffer.slice(bin.byteOffset + start + k * stride, bin.byteOffset + start + k * stride + n * es); const v = new T(ab); for (let c = 0; c < n; c++) out[k * n + c] = v[c]; }
    if (a.normalized) { const m = T === Int16Array ? 32767 : T === Int8Array ? 127 : T === Uint16Array ? 65535 : 255; for (let k = 0; k < out.length; k++) out[k] = Math.max(-1, out[k] / m); }
    return { data: out, n, count: a.count };
  };
  return { json, acc };
}
