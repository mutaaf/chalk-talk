// My plays and the AI cache: a repeat is free only when it's truly the same request.
import assert from 'node:assert/strict';
const store = {}; globalThis.localStorage = { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; } };
const { history, aiCache } = await import('../src/history.js');
const raw = { title: 'Spain PnR', beats: [] };
history.add({ sport: 'basketball', said: 'Run Spain pick and roll!', board: 'b1', source: 'voice', raw, title: raw.title });
assert.ok(history.find('basketball', 'run spain pick and roll', 'b1'), 'same words, same board');
assert.ok(history.find('basketball', 'run spain pick and roll', 'b2'), 'a fresh request matches on any board');
assert.equal(history.find('basketball', 'now make 5 pop instead', 'b9'), null, 'an edit is never answered from another board');
history.add({ sport: 'basketball', said: 'now make 5 pop instead', board: 'b1', source: 'text', raw });
assert.ok(history.find('basketball', 'now make 5 pop instead', 'b1'), 'an edit on the very same board is');
assert.equal(history.find('flag5', 'run spain pick and roll', 'b1'), null, 'never across sports');
history.add({ sport: 'basketball', said: 'Run Spain pick and roll', board: 'b1', source: 'voice', raw });
assert.equal(history.all().filter(e => e.said.toLowerCase().startsWith('run spain')).length, 1, 'a repeat replaces, not duplicates');
const id = history.all()[0].id; history.update(id, { fav: true }); history.clear(); assert.equal(history.all().length, 1, 'favorites survive a clear');
aiCache.set('k', { read: 'x' }); assert.deepEqual(aiCache.get('k'), { read: 'x' });
console.log('ok: My plays answers repeats instantly, never across boards, sports or edits');
