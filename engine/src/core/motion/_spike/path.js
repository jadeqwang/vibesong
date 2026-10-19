// Ground paths for locomotion: a centripetal Catmull-Rom spline through [x, z] points, arc-length parametrised.
export class Path {
  /** pts: [[x, z], ...] (>= 2). The spline passes through every point; ends are extrapolated. */
  constructor(pts, { samples = 64 } = {}) {
    if (pts.length < 2) throw new Error('Path needs 2+ points');
    this.pts = pts.map((p) => [p[0], p[1]]);
    const P = this.pts, n = P.length;
    const ext = [[2 * P[0][0] - P[1][0], 2 * P[0][1] - P[1][1]], ...P, [2 * P[n - 1][0] - P[n - 2][0], 2 * P[n - 1][1] - P[n - 2][1]]];
    // dense polyline, then a cumulative-length table
    const xs = [], zs = [];
    for (let i = 0; i < n - 1; i++) for (let k = 0; k < samples; k++) { const q = cr(ext[i], ext[i + 1], ext[i + 2], ext[i + 3], k / samples); xs.push(q[0]); zs.push(q[1]); }
    xs.push(P[n - 1][0]); zs.push(P[n - 1][1]);
    this.x = Float64Array.from(xs); this.z = Float64Array.from(zs); const L = new Float64Array(xs.length);
    for (let i = 1; i < xs.length; i++) L[i] = L[i - 1] + Math.hypot(xs[i] - xs[i - 1], zs[i] - zs[i - 1]);
    this.L = L; this.length = L[L.length - 1];
  }
  /** point + unit tangent at arc length s (clamped to [0, length]) */
  at(s) {
    const L = this.L; s = Math.max(0, Math.min(this.length, s));
    let lo = 0, hi = L.length - 1; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (L[m] <= s) lo = m; else hi = m; }
    const a = (s - L[lo]) / Math.max(1e-9, L[hi] - L[lo]);
    const x = this.x[lo] + (this.x[hi] - this.x[lo]) * a, z = this.z[lo] + (this.z[hi] - this.z[lo]) * a;
    const i0 = Math.max(0, lo - 1), i1 = Math.min(L.length - 1, hi + 1); const tx = this.x[i1] - this.x[i0], tz = this.z[i1] - this.z[i0]; const tl = Math.hypot(tx, tz) || 1;
    return { x, z, tx: tx / tl, tz: tz / tl };
  }
}
/** centripetal Catmull-Rom (alpha 0.5) between p1 and p2 */
function cr(p0, p1, p2, p3, u) {
  const d = (a, b) => Math.max(1e-6, Math.pow(Math.hypot(b[0] - a[0], b[1] - a[1]), 0.5));
  const t0 = 0, t1 = t0 + d(p0, p1), t2 = t1 + d(p1, p2), t3 = t2 + d(p2, p3); const t = t1 + (t2 - t1) * u;
  const L = (a, b, ta, tb) => [((tb - t) * a[0] + (t - ta) * b[0]) / (tb - ta), ((tb - t) * a[1] + (t - ta) * b[1]) / (tb - ta)];
  const A1 = L(p0, p1, t0, t1), A2 = L(p1, p2, t1, t2), A3 = L(p2, p3, t2, t3);
  const B1 = L(A1, A2, t0, t2), B2 = L(A2, A3, t1, t3); return L(B1, B2, t1, t2);
}
