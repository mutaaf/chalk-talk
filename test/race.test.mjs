// A coach is never left waiting on one slow AI: the free AI joins after a delay, or right away when the key fails.
import assert from 'node:assert/strict';
import { firstOf } from '../src/ai.js';

const later = (ms, v, fail) => new Promise((res, rej) => setTimeout(() => (fail ? rej(Object.assign(new Error(v), fail === true ? {} : fail)) : res(v)), ms));
let calls = 0;
const backup = (ms, v, fail) => () => { calls++; return later(ms, v, fail); };

assert.equal(await firstOf(later(10, 'own'), backup(5, 'free'), 100), 'own'); assert.equal(calls, 0, 'fast key: no backup call');
calls = 0; assert.equal(await firstOf(later(400, 'own'), backup(20, 'free'), 50), 'free'); assert.equal(calls, 1, 'slow key: the free AI wins');
calls = 0; assert.equal(await firstOf(later(10, 'bad', true), backup(20, 'free'), 5000), 'free', 'key fails: free right away, no waiting');
calls = 0; assert.equal(await firstOf(later(60, 'own'), backup(400, 'free'), 20), 'own', 'both running: the first answer wins');
await assert.rejects(firstOf(later(10, 'key failed', true), backup(10, 'free failed', true), 5000), /key failed/, 'both fail: the key’s error');
calls = 0; await assert.rejects(firstOf(later(10, 'stop', { name: 'AbortError' }), backup(10, 'free'), 50), e => e.name === 'AbortError');
await new Promise(r => setTimeout(r, 80)); assert.equal(calls, 0, 'a cancel never starts the backup');
console.log('ok: a slow or failing key hands off to the free AI (first answer wins, cancel stops both)');
