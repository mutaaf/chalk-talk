// My plays: every play the AI drew for this coach (from their voice, their typing or a sketch), on this
// device. Each entry keeps the words that made it, so the coach can find it again, and so the same request
// on the same board is answered from here instantly with no AI call. Plus a small cache for the AI's other
// deterministic answers (film-room brains, the analyst), keyed by a hash of the request.

const KEY = 'chalktalk.history', MAX = 150;
export const hash = s => { let h = 0x811c9dc5; s = String(s); for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); } return (h >>> 0).toString(36); };
const norm = s => String(s || '').toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
// words that mean "change what's on the board": those requests depend on the board, so they only reuse an
// answer made from the very same board
const EDIT = /\b(change|instead|now|also|then|make|move|add|remove|swap|switch|flip|mirror|again|same|but|more|less|faster|slower|wider|deeper)\b/;

const read = () => { try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch (e) { return []; } };
const write = a => { try { localStorage.setItem(KEY, JSON.stringify(a.slice(0, MAX))); } catch (e) { try { localStorage.setItem(KEY, JSON.stringify(a.slice(0, Math.floor(MAX / 2)))); } catch (e2) {} } };

export const history = {
  all: () => read(),
  // a finished AI play: newest first; the same words on the same board replace the older entry
  add(e) {
    const a = read(), k = keyOf(e.sport, e.said, e.board), at = Date.now();
    const old = a.find(x => x.key === k);
    const entry = Object.assign({ id: (old && old.id) || at.toString(36) + Math.random().toString(36).slice(2, 6), key: k, at, uses: 1, fav: false }, old ? { fav: old.fav, name: old.name, uses: (old.uses || 0) + 1 } : {}, e, { key: k, at });
    write([entry].concat(a.filter(x => x.key !== k)));
    return entry;
  },
  // the cached answer for these words, if there is one: an exact match on the same board, or, for a fresh
  // request (not an edit), the same words on any board in this sport
  find(sport, said, board) {
    const a = read(), exact = a.find(x => x.key === keyOf(sport, said, board));
    if (exact) return exact;
    const n = norm(said);
    if (!n || EDIT.test(n)) return null;
    return a.find(x => x.sport === sport && norm(x.said) === n) || null;
  },
  touch(id) { const a = read(), e = a.find(x => x.id === id); if (e) { e.uses = (e.uses || 0) + 1; e.last = Date.now(); write(a); } },
  update(id, patch) { const a = read(), e = a.find(x => x.id === id); if (e) { Object.assign(e, patch); write(a); } },
  remove(id) { write(read().filter(x => x.id !== id)); },
  clear() { write(read().filter(x => x.fav)); }   // favorites survive a clear
};
const keyOf = (sport, said, board) => sport + '|' + hash(norm(said)) + '|' + (board || '-');

// the AI's other answers that only depend on what was asked (a brain's film read, the analyst's lines)
const AKEY = 'chalktalk.aicache', AMAX = 120;
export const aiCache = {
  get(k) { try { const m = JSON.parse(localStorage.getItem(AKEY) || '{}'); return m[k] ? m[k].v : null; } catch (e) { return null; } },
  set(k, v) {
    try {
      const m = JSON.parse(localStorage.getItem(AKEY) || '{}'); m[k] = { v, t: Date.now() };
      const keys = Object.keys(m); if (keys.length > AMAX) keys.sort((a, b) => m[a].t - m[b].t).slice(0, keys.length - AMAX).forEach(x => delete m[x]);
      localStorage.setItem(AKEY, JSON.stringify(m));
    } catch (e) {}
  }
};
