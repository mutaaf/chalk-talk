// Phones that fold, and phones with two screens. One cheap watcher (media-query, posture and resize events; never per
// frame) puts a class on the root that style.js lays out, so the board never straddles a hinge:
//   ct-split-x  two screens side by side (Surface Duo held like a book, a Fold half-open in book posture):
//               the board on the first screen, the header, play card, dock and panels on the second
//   ct-split-y  one above the other (Duo on its side, a Fold or Flip half-folded on a table: tabletop / Flex mode):
//               the board on top, the controls below
// and --ct-fold-a / --ct-fold-b: where the hinge starts and ends, in px within the root (else the middle).
// iPhone Duo (iOS 27.1): Safari's Viewport Segments API is a preview behind a feature flag and absent in WKWebView,
// and its env(viewport-segment-*) values were reported far larger than the segments (so style.js never reads them).
// So a Duo is known by its open screen, 951 × 669 pt, whose fold band sits in the middle of the full screen
// (455.5–495.5 in book pose; the 84 pt status strip on one side is safe area, not the board's). Held like a book
// (wider than tall) the board takes the first page; standing in tabletop (taller) the board goes above the fold.
// Flat and folded lay out the same (Apple's rule: the fold's region, never the hinge angle, sets the layout).
// The real segments win whenever Safari reports them.
const QUERIES = { x: '(horizontal-viewport-segments: 2)', y: '(vertical-viewport-segments: 2)', folded: '(device-posture: folded)' };
const MIN = 260;   // a pane narrower (or, for the board on top, shorter) than this isn't worth splitting for

// the two viewport segments, if the browser has them: the Viewport Segments API (viewport.segments), or its older home.
// Only sane ones: two non-empty rects inside the window (a preview build reporting nonsense mustn't wreck the layout).
export function saneSegments(s, iw, ih) {
  if (!s || s.length !== 2) return null;
  const ok = r => r && r.width > 0 && r.height > 0 && r.left >= -1 && r.top >= -1 && r.right <= iw + 1 && r.bottom <= ih + 1;
  return ok(s[0]) && ok(s[1]) ? s : null;
}
function segmentsOf(w) {
  return saneSegments((w.viewport && w.viewport.segments) || (w.visualViewport && w.visualViewport.segments), w.innerWidth || 1e9, w.innerHeight || 1e9);
}

// iPhone Duo's inner screen, in points (the outer one, 466 × 678, is a plain phone)
export const DUO = { long: 951, short: 669, band: 40, slack: 4 };
const near = (v, t) => Math.abs(v - t) <= DUO.slack;
// pure: the fold of an open iPhone Duo as two segments in viewport px, or null. sw/sh the screen, iw/ih the window.
export function duoSegments({ sw, sh, iw, ih, ios }) {
  if (!ios || !near(Math.max(sw, sh), DUO.long) || !near(Math.min(sw, sh), DUO.short)) return null;
  const r = (l, t, w, h) => ({ left: l, top: t, right: l + w, bottom: t + h, width: w, height: h }), h2 = DUO.band / 2;
  if (iw > ih) {   // held like a book: the fold runs down the middle of the full-width window
    if (!near(iw, DUO.long)) return null;   // Safari not full screen (a split view): no fold to find
    const c = iw / 2;
    return [r(0, 0, c - h2, ih), r(c + h2, 0, iw - c - h2, ih)];
  }
  // tabletop / open in portrait: across the middle of the screen; Safari's bars float over the page, so the window starts at the top
  const c = DUO.long / 2;
  if (ih < c + h2 + 200) return null;
  return [r(0, 0, iw, c - h2), r(0, c + h2, iw, ih - c - h2)];
}
function duoOf(w) {
  const n = w.navigator || {}, ua = n.userAgent || '', sc = w.screen || {};
  const ios = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && n.maxTouchPoints > 1);
  return duoSegments({ sw: sc.width || 0, sh: sc.height || 0, iw: w.innerWidth || 0, ih: w.innerHeight || 0, ios });
}
const maybeDuo = w => { const sc = w.screen || {}; return near(Math.max(sc.width || 0, sc.height || 0), DUO.long) && near(Math.min(sc.width || 0, sc.height || 0), DUO.short); };

// pure: what the layout is, given the root's box, the segments (or none) and the media/posture signals
export function splitFor(box, segs, sig) {
  if (segs) {
    const [a, b] = segs, side = Math.abs(a.top - b.top) < 1;
    const start = side ? a.right - box.left : a.bottom - box.top, end = side ? b.left - box.left : b.top - box.top;
    const size = side ? box.width : box.height;
    if (start < MIN || size - end < MIN) return null;   // the root doesn't span the hinge (an embedded board), or a pane is too small
    return { mode: side ? 'x' : 'y', a: start, b: end };
  }
  if (sig.x && box.width >= MIN * 2) return { mode: 'x', a: null, b: null };
  if (sig.y || sig.folded) return box.height >= MIN * 2 ? { mode: 'y', a: null, b: null } : null;   // half-folded, the hinge runs across
  return null;
}

export function watchDevice(root, onChange) {
  const w = typeof window !== 'undefined' ? window : null;
  if (!w || !w.matchMedia) return () => {};
  const mq = {}; Object.keys(QUERIES).forEach(k => { mq[k] = w.matchMedia(QUERIES[k]); });
  const posture = w.navigator && w.navigator.devicePosture;
  const hasSegs = !!((w.viewport && 'segments' in w.viewport) || (w.visualViewport && 'segments' in w.visualViewport));
  const duo = maybeDuo(w), sized = hasSegs || duo;   // a Duo re-lays out on resize and rotation
  let last = '';
  function update() {
    const sig = { x: mq.x.matches, y: mq.y.matches, folded: mq.folded.matches || !!(posture && posture.type === 'folded') };
    const segs = (hasSegs ? segmentsOf(w) : null) || (duo ? duoOf(w) : null);
    if (!segs && !sig.x && !sig.y && !sig.folded) { if (last) apply(null); return; }   // the usual case: one flat screen, nothing to measure
    apply(splitFor(root.getBoundingClientRect(), segs, sig));
  }
  function apply(s) {
    const key = s ? s.mode + (s.a == null ? '' : ':' + Math.round(s.a) + ':' + Math.round(s.b)) : '';
    if (key === last) return;
    last = key;
    root.classList.toggle('ct-split-x', !!s && s.mode === 'x');
    root.classList.toggle('ct-split-y', !!s && s.mode === 'y');
    if (s && s.a != null) { root.style.setProperty('--ct-fold-a', Math.round(s.a) + 'px'); root.style.setProperty('--ct-fold-b', Math.round(s.b) + 'px'); }
    else { root.style.removeProperty('--ct-fold-a'); root.style.removeProperty('--ct-fold-b'); }
    if (onChange) onChange(s);
  }
  const on = (t, ev, f) => { if (t && t.addEventListener) t.addEventListener(ev, f); };
  const off = (t, ev, f) => { if (t && t.removeEventListener) t.removeEventListener(ev, f); };
  Object.keys(mq).forEach(k => on(mq[k], 'change', update));
  on(posture, 'change', update);
  if (sized) { on(w, 'resize', update); on(w, 'orientationchange', update); }   // segments only ever change with a resize (spanning, folding, rotating)
  update();
  return () => { Object.keys(mq).forEach(k => off(mq[k], 'change', update)); off(posture, 'change', update); if (sized) { off(w, 'resize', update); off(w, 'orientationchange', update); } };
}
