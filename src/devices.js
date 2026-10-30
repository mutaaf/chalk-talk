// Phones that fold, and phones with two screens. One cheap watcher (media-query, posture and resize events; never per
// frame) puts a class on the root that style.js lays out, so the board never straddles a hinge:
//   ct-split-x  two screens side by side (Surface Duo held like a book, a Fold half-open in book posture):
//               the board on the first screen, the header, play card, dock and panels on the second
//   ct-split-y  one above the other (Duo on its side, a Fold or Flip half-folded on a table: tabletop / Flex mode):
//               the board on top, the controls below
// and --ct-fold-a / --ct-fold-b: where the hinge starts and ends, in px within the root. Without the segments from
// script, style.js falls back to env(viewport-segment-*) and then to the middle.
const QUERIES = { x: '(horizontal-viewport-segments: 2)', y: '(vertical-viewport-segments: 2)', folded: '(device-posture: folded)' };
const MIN = 260;   // a pane narrower (or, for the board on top, shorter) than this isn't worth splitting for

// the two viewport segments, if the browser has them: the Viewport Segments API (viewport.segments), or its older home
function segmentsOf(w) {
  const s = (w.viewport && w.viewport.segments) || (w.visualViewport && w.visualViewport.segments);
  return s && s.length === 2 ? s : null;
}

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
  let last = '';
  function update() {
    const sig = { x: mq.x.matches, y: mq.y.matches, folded: mq.folded.matches || !!(posture && posture.type === 'folded') };
    const segs = hasSegs ? segmentsOf(w) : null;
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
  if (hasSegs) on(w, 'resize', update);   // segments only ever change with a resize (spanning, folding, rotating)
  update();
  return () => { Object.keys(mq).forEach(k => off(mq[k], 'change', update)); off(posture, 'change', update); if (hasSegs) off(w, 'resize', update); };
}
