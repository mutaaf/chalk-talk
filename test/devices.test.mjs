// Folds and two screens: where the hinge is, and when the board gets a screen of its own.
import assert from 'node:assert/strict';
import { splitFor, watchDevice, duoSegments, saneSegments } from '../src/devices.js';
const none = { x: false, y: false, folded: false };
const box = (w, h) => ({ left: 0, top: 0, width: w, height: h });
const rect = (l, t, w, h) => ({ left: l, top: t, right: l + w, bottom: t + h, width: w, height: h });
// Surface Duo, double portrait: two 540 × 720 screens and a 34px hinge
assert.deepEqual(splitFor(box(1114, 720), [rect(0, 0, 540, 720), rect(574, 0, 540, 720)], none), { mode: 'x', a: 540, b: 574 });
// on its side, one above the other
assert.deepEqual(splitFor(box(720, 1114), [rect(0, 0, 720, 540), rect(0, 574, 720, 540)], none), { mode: 'y', a: 540, b: 574 });
// a board embedded off to one side never splits across a hinge it doesn't span
assert.equal(splitFor({ left: 600, top: 0, width: 514, height: 720 }, [rect(0, 0, 540, 720), rect(574, 0, 540, 720)], none), null);
// a fold half-closed on a table with no segment geometry: the hinge across the middle
assert.deepEqual(splitFor(box(412, 915), null, { x: false, y: false, folded: true }), { mode: 'y', a: null, b: null });
assert.equal(splitFor(box(260, 512), null, { x: false, y: false, folded: true }), null, 'too small to split');
assert.equal(splitFor(box(390, 844), null, none), null, 'a plain phone');
// no window (a server, a test): a no-op
assert.equal(typeof watchDevice({}), 'function');
// the watcher: classes and the hinge on the root, updated by events only
{
  const ls = {}, mqs = {};
  const on = (o, ev, f) => { (o.ls = o.ls || {})[ev] = f; };
  globalThis.window = {
    matchMedia: q => (mqs[q] = mqs[q] || { matches: false, addEventListener(ev, f) { on(this, ev, f); }, removeEventListener() {} }),
    visualViewport: { segments: null },
    navigator: { devicePosture: { type: 'continuous', addEventListener(ev, f) { on(this, ev, f); }, removeEventListener() {} } },
    addEventListener: (ev, f) => { ls[ev] = f; }, removeEventListener: ev => { delete ls[ev]; }
  };
  const cls = new Set(), props = {};
  const root = { classList: { toggle: (c, v) => (v ? cls.add(c) : cls.delete(c)) }, style: { setProperty: (k, v) => { props[k] = v; }, removeProperty: k => { delete props[k]; } }, getBoundingClientRect: () => box(1114, 720) };
  const stop = watchDevice(root);
  assert.equal(cls.size, 0, 'one flat screen: nothing');
  window.visualViewport.segments = [rect(0, 0, 540, 720), rect(574, 0, 540, 720)]; ls.resize();
  assert.ok(cls.has('ct-split-x')); assert.equal(props['--ct-fold-a'], '540px'); assert.equal(props['--ct-fold-b'], '574px');
  window.visualViewport.segments = null; ls.resize();
  assert.equal(cls.size, 0, 'back to one screen'); assert.equal(props['--ct-fold-a'], undefined);
  root.getBoundingClientRect = () => box(412, 915); window.navigator.devicePosture.type = 'folded'; window.navigator.devicePosture.ls.change();
  assert.ok(cls.has('ct-split-y'), 'tabletop / Flex mode');
  stop(); assert.equal(ls.resize, undefined, 'stops listening');
  delete globalThis.window;
}
// iPhone Duo (iOS 27.1), where Safari has no fold API without a feature flag: known by its 951 × 669 pt open screen
{
  const book = duoSegments({ sw: 669, sh: 951, iw: 951, ih: 669, ios: true });
  assert.deepEqual(splitFor(box(951, 669), book, none), { mode: 'x', a: 455.5, b: 495.5 }, 'held like a book: the fold band from the simulator');
  const table = duoSegments({ sw: 669, sh: 951, iw: 669, ih: 880, ios: true });
  assert.deepEqual(splitFor(box(669, 880), table, none), { mode: 'y', a: 455.5, b: 495.5 }, 'tabletop: board above the fold');
  assert.equal(duoSegments({ sw: 466, sh: 678, iw: 466, ih: 600, ios: true }), null, 'closed: the outer screen is a plain phone');
  assert.equal(duoSegments({ sw: 669, sh: 951, iw: 600, ih: 669, ios: true }), null, 'Safari in a split view');
  assert.equal(duoSegments({ sw: 669, sh: 951, iw: 951, ih: 669, ios: false }), null, 'not iOS');
  assert.equal(duoSegments({ sw: 390, sh: 844, iw: 844, ih: 390, ios: true }), null, 'a plain iPhone on its side');
  // a preview build's nonsense segments are ignored
  assert.equal(saneSegments([rect(0, 0, 2000, 669), rect(2040, 0, 2000, 669)], 951, 669), null);
  assert.ok(saneSegments(book, 951, 669));
  // the watcher finds it with no segments API, and re-lays out on rotation
  const ls = {};
  globalThis.window = { matchMedia: () => ({ matches: false, addEventListener() {}, removeEventListener() {} }), navigator: { userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 27_1 like Mac OS X)', maxTouchPoints: 5 },
    screen: { width: 669, height: 951 }, innerWidth: 951, innerHeight: 669, addEventListener: (ev, f) => { ls[ev] = f; }, removeEventListener: ev => { delete ls[ev]; } };
  const cls = new Set(), props = {}; let bx = box(951, 669);
  const root = { classList: { toggle: (c, v) => (v ? cls.add(c) : cls.delete(c)) }, style: { setProperty: (k, v) => { props[k] = v; }, removeProperty: k => { delete props[k]; } }, getBoundingClientRect: () => bx };
  const stop = watchDevice(root);
  assert.ok(cls.has('ct-split-x')); assert.equal(props['--ct-fold-a'], '456px'); assert.equal(props['--ct-fold-b'], '496px');
  window.innerWidth = 669; window.innerHeight = 880; bx = box(669, 880); ls.orientationchange();
  assert.ok(cls.has('ct-split-y') && !cls.has('ct-split-x'), 'stood up in tabletop');
  window.screen = { width: 466, height: 678 }; window.innerWidth = 466; window.innerHeight = 600; bx = box(466, 600); ls.resize();
  stop(); delete globalThis.window;
}
// style.js never trusts Safari's env(viewport-segment-*) (reported far larger than the segments on iPhone Duo)
{ const { CSS } = await import('../src/style.js'); assert.ok(!/env\(viewport-segment/.test(CSS), 'no env(viewport-segment-*) in the CSS'); }
console.log('ok: device layouts (two screens, folds, iPhone Duo, embedded boards)');
