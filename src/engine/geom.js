// Small, allocation-light geometry for routes: polylines in [x, y, h?], in the sport's units.

export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const ease = x => x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x);

export function bez(a, c, b, t) { const u = 1 - t; return [u * u * a[0] + 2 * u * t * c[0] + t * t * b[0], u * u * a[1] + 2 * u * t * c[1] + t * t * b[1]]; }

// a smooth curve through one control point, or straight legs through waypoints (routes break sharp)
export function route(a, waypoints, b, curve, steps) {
  if (curve && waypoints.length === 1) {
    const out = []; for (let i = 0; i <= steps; i++) out.push(bez(a, waypoints[0], b, i / steps)); return out;
  }
  const knots = [a].concat(waypoints, [b]), out = [a.slice()];
  for (let k = 1; k < knots.length; k++) {
    const p = knots[k - 1], q = knots[k], n = Math.max(2, Math.round(steps / (knots.length - 1)));
    for (let i = 1; i <= n; i++) out.push([p[0] + (q[0] - p[0]) * i / n, p[1] + (q[1] - p[1]) * i / n]);
  }
  return out;
}

export function plen(p) { let s = 0; for (let i = 1; i < p.length; i++) s += Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1], (p[i][2] || 0) - (p[i - 1][2] || 0)); return s; }

// a polyline with its cumulative lengths, so walking it is a binary search, not a scan
export function measured(pts) {
  const cum = new Float64Array(pts.length); let s = 0;
  for (let i = 1; i < pts.length; i++) { s += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1], (pts[i][2] || 0) - (pts[i - 1][2] || 0)); cum[i] = s; }
  return { pts, cum, len: s };
}
export function walk(m, t, out) {
  const { pts, cum, len } = m, d = clamp(t, 0, 1) * len;
  if (pts.length < 2 || !len) { out[0] = pts[0][0]; out[1] = pts[0][1]; out[2] = pts[0][2] || 0; return out; }
  let lo = 1, hi = pts.length - 1;
  while (lo < hi) { const mid = (lo + hi) >> 1; if (cum[mid] < d) lo = mid + 1; else hi = mid; }
  const a = pts[lo - 1], b = pts[lo], l = cum[lo] - cum[lo - 1], k = l ? (d - cum[lo - 1]) / l : 0;
  out[0] = a[0] + (b[0] - a[0]) * k; out[1] = a[1] + (b[1] - a[1]) * k; out[2] = (a[2] || 0) + ((b[2] || 0) - (a[2] || 0)) * k;
  return out;
}
export function slice(m, frac) {
  if (frac >= 1) return m.pts;
  const d = clamp(frac, 0, 1) * m.len, out = [m.pts[0]];
  for (let i = 1; i < m.pts.length; i++) {
    if (m.cum[i] >= d) { const p = walk(m, frac, [0, 0, 0]); out.push(p); return out; }
    out.push(m.pts[i]);
  }
  return out;
}
export function arc(cx, cy, r, a0, a1, steps, h) {
  const p = [];
  for (let i = 0; i <= steps; i++) { const a = a0 + (a1 - a0) * i / steps; p.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r, h || 0]); }
  return p;
}
export function toward(from, to, d) {
  const dx = to[0] - from[0], dy = to[1] - from[1], l = Math.hypot(dx, dy) || 1;
  return [from[0] + dx / l * d, from[1] + dy / l * d];
}
