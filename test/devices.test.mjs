// Folds and two screens: where the hinge is, and when the board gets a screen of its own.
import assert from 'node:assert/strict';
import { splitFor, watchDevice } from '../src/devices.js';
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
console.log('ok: device layouts (two screens, folds, embedded boards)');
