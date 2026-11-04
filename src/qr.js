// A tiny QR code encoder (byte mode, error correction M, versions 1–10: up to 213 bytes), enough for a link.
// After Nayuki's reference implementation (MIT); pure, so it runs in the tests too. qr(text) → { size, at(x, y) },
// qrSvg(text) → an <svg> with a 4-module quiet zone.

const ECC = [10, 16, 26, 18, 24, 16, 18, 22, 22, 26], BLOCKS = [1, 1, 1, 2, 2, 4, 4, 4, 5, 5];   // M, versions 1–10
const rawModules = v => { let r = (16 * v + 128) * v + 64; if (v >= 2) { const n = Math.floor(v / 7) + 2; r -= (25 * n - 10) * n - 55; if (v >= 7) r -= 36; } return r; };
const dataCodewords = v => Math.floor(rawModules(v) / 8) - ECC[v - 1] * BLOCKS[v - 1];
const gmul = (x, y) => { let z = 0; for (let i = 7; i >= 0; i--) { z = (z << 1) ^ ((z >>> 7) * 0x11d); z ^= ((y >>> i) & 1) * x; } return z & 255; };
function divisor(n) { const r = new Array(n).fill(0); r[n - 1] = 1; let root = 1; for (let i = 0; i < n; i++) { for (let j = 0; j < n; j++) { r[j] = gmul(r[j], root); if (j + 1 < n) r[j] ^= r[j + 1]; } root = gmul(root, 2); } return r; }
function remainder(data, div) { const r = new Array(div.length).fill(0); for (const b of data) { const f = b ^ r.shift(); r.push(0); div.forEach((c, i) => { r[i] ^= gmul(c, f); }); } return r; }

export function qr(text) {
  const bytes = [...new TextEncoder().encode(String(text))];
  let v = 1; while (v <= 10 && 4 + (v < 10 ? 8 : 16) + bytes.length * 8 > dataCodewords(v) * 8) v++;
  if (v > 10) throw new Error('too long for a QR code here');
  // the bits: mode, count, bytes, terminator, then pad
  const bits = [], put = (x, n) => { for (let i = n - 1; i >= 0; i--) bits.push((x >>> i) & 1); };
  put(4, 4); put(bytes.length, v < 10 ? 8 : 16); bytes.forEach(b => put(b, 8));
  const cap = dataCodewords(v) * 8; put(0, Math.min(4, cap - bits.length)); put(0, (8 - bits.length % 8) % 8);
  for (let p = 0xec; bits.length < cap; p ^= 0xec ^ 0x11) put(p, 8);
  const data = []; for (let i = 0; i < bits.length; i += 8) data.push(bits.slice(i, i + 8).reduce((a, b) => (a << 1) | b, 0));
  // error correction, in blocks, interleaved
  const nb = BLOCKS[v - 1], el = ECC[v - 1], raw = Math.floor(rawModules(v) / 8), short = nb - raw % nb, slen = Math.floor(raw / nb), div = divisor(el), blocks = [];
  for (let i = 0, k = 0; i < nb; i++) { const d = data.slice(k, k + slen - el + (i < short ? 0 : 1)); k += d.length; const e = remainder(d, div); if (i < short) d.push(0); blocks.push(d.concat(e)); }
  const all = []; for (let i = 0; i < blocks[0].length; i++) blocks.forEach((b, j) => { if (i !== slen - el || j >= short) all.push(b[i]); });
  // the function patterns
  const size = v * 4 + 17, m = [...Array(size)].map(() => new Array(size).fill(false)), fn = [...Array(size)].map(() => new Array(size).fill(false));
  const set = (x, y, d) => { m[y][x] = d; fn[y][x] = true; };
  for (let i = 0; i < size; i++) { set(6, i, i % 2 === 0); set(i, 6, i % 2 === 0); }
  for (const [cx, cy] of [[3, 3], [size - 4, 3], [3, size - 4]]) for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) { const x = cx + dx, y = cy + dy, d = Math.max(Math.abs(dx), Math.abs(dy)); if (x >= 0 && x < size && y >= 0 && y < size) set(x, y, d !== 2 && d !== 4); }
  if (v > 1) {
    const n = Math.floor(v / 7) + 2, step = Math.ceil((v * 4 + 4) / (n * 2 - 2)) * 2, pos = [6]; for (let p = size - 7; pos.length < n; p -= step) pos.splice(1, 0, p);
    pos.forEach((x, i) => pos.forEach((y, j) => { if ((i === 0 && j === 0) || (i === 0 && j === n - 1) || (i === n - 1 && j === 0)) return; for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) set(x + dx, y + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1); }));
  }
  const format = mask => {
    const d = mask; let r = d; for (let i = 0; i < 10; i++) r = (r << 1) ^ ((r >>> 9) * 0x537);   // M is 00
    const b = ((d << 10) | r) ^ 0x5412, bit = i => ((b >>> i) & 1) === 1;
    for (let i = 0; i <= 5; i++) set(8, i, bit(i)); set(8, 7, bit(6)); set(8, 8, bit(7)); set(7, 8, bit(8)); for (let i = 9; i < 15; i++) set(14 - i, 8, bit(i));
    for (let i = 0; i < 8; i++) set(size - 1 - i, 8, bit(i)); for (let i = 8; i < 15; i++) set(8, size - 15 + i, bit(i)); set(8, size - 8, true);
  };
  format(0);
  if (v >= 7) { let r = v; for (let i = 0; i < 12; i++) r = (r << 1) ^ ((r >>> 11) * 0x1f25); const b = (v << 12) | r; for (let i = 0; i < 18; i++) { const d = ((b >>> i) & 1) === 1, a = size - 11 + i % 3, c = Math.floor(i / 3); set(a, c, d); set(c, a, d); } }
  // the data, zig-zagging up and down in two-module columns from the bottom right
  let i = 0;
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    for (let vert = 0; vert < size; vert++) for (let j = 0; j < 2; j++) {
      const x = right - j, y = ((right + 1) & 2) === 0 ? size - 1 - vert : vert;
      if (!fn[y][x] && i < all.length * 8) { m[y][x] = ((all[i >>> 3] >>> (7 - (i & 7))) & 1) === 1; i++; }
    }
  }
  // the mask that reads best (runs, blocks, balance)
  const masks = [(x, y) => (x + y) % 2 === 0, (x, y) => y % 2 === 0, x => x % 3 === 0, (x, y) => (x + y) % 3 === 0, (x, y) => (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0, (x, y) => x * y % 2 + x * y % 3 === 0, (x, y) => (x * y % 2 + x * y % 3) % 2 === 0, (x, y) => ((x + y) % 2 + x * y % 3) % 2 === 0];
  const apply = k => { for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) if (!fn[y][x] && masks[k](x, y)) m[y][x] = !m[y][x]; };
  const penalty = () => {
    let p = 0, dark = 0;
    for (let a = 0; a < size; a++) for (const row of [true, false]) { let run = 1; for (let b = 1; b <= size; b++) { const c = b < size && (row ? m[a][b] : m[b][a]) === (row ? m[a][b - 1] : m[b - 1][a]); if (c) run++; else { if (run >= 5) p += run - 2; run = 1; } } }
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) { if (m[y][x]) dark++; if (x < size - 1 && y < size - 1 && m[y][x] === m[y][x + 1] && m[y][x] === m[y + 1][x] && m[y][x] === m[y + 1][x + 1]) p += 3; }
    return p + Math.floor(Math.abs(dark * 20 - size * size * 10) / (size * size)) * 10;
  };
  let best = 0, low = Infinity;
  for (let k = 0; k < 8; k++) { apply(k); format(k); const p = penalty(); if (p < low) { low = p; best = k; } apply(k); }
  apply(best); format(best);
  return { size, version: v, mask: best, at: (x, y) => m[y][x] };
}

export function qrSvg(text, { dark = '#04070c', light = '#fff' } = {}) {
  const q = qr(text), n = q.size + 8; let d = '';
  for (let y = 0; y < q.size; y++) for (let x = 0; x < q.size; x++) if (q.at(x, y)) d += `M${x + 4} ${y + 4}h1v1h-1z`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${n} ${n}" shape-rendering="crispEdges" role="img" aria-label="QR code"><rect width="${n}" height="${n}" fill="${light}"/><path d="${d}" fill="${dark}"/></svg>`;
}
