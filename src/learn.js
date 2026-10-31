// The board gets better every time a coach uses it, on this device only:
//  - heal(): fixes what speech-to-text gets wrong about coaching talk ("oh five" → O5, "pick in roll"
//    → pick and roll), from a built-in table plus every correction the coach has made;
//  - learned shortcuts: a phrase the AI recognised as a library concept, and the coach kept, answers
//    instantly next time with no network;
//  - corrections: tapping the transcript to fix a word teaches the healer that word;
//  - the log: every voice attempt's path, timing and outcome, for the Voice stats and the eval corpus.
// Nothing here leaves the device unless the coach opts in to sharing (off by default): then the words of
// plays they keep, and the words they fix, go to Chalk Talk's API with their players' names removed here
// first. Phrases several coaches confirm come back to everyone as a community lexicon.

const K = 'chalktalk.learn';
const empty = () => ({ words: {}, phrases: {}, log: [] });
export const memory = {
  get() { try { return Object.assign(empty(), JSON.parse(localStorage.getItem(K) || '{}')); } catch (e) { return empty(); } },
  put(v) { try { localStorage.setItem(K, JSON.stringify(v)); } catch (e) {} },
  clear() { try { localStorage.removeItem(K); } catch (e) {} }
};

// coaching words speech recognisers reliably miss
const NUM = '(one|won|two|to|too|three|tree|four|for|fore|five|six|sex|seven|1|2|3|4|5|6|7)';
const N = { one: 1, won: 1, two: 2, to: 2, too: 2, three: 3, tree: 3, four: 4, for: 4, fore: 4, five: 5, six: 6, sex: 6, seven: 7 };
const FIXES = [
  [/\bpick (in|an|n|end) roll\b/g, 'pick and roll'], [/\bpick (in|an|n|end) pop\b/g, 'pick and pop'],
  [/\bd\.? ?h\.? ?o\.?\b/g, 'DHO'], [/\bdribble hand ?off\b/g, 'DHO'], [/\bhand ?off\b/g, 'handoff'],
  [/\bback ?door\b/g, 'backdoor'], [/\bball ?screen\b/g, 'ball screen'], [/\bdown ?screen\b/g, 'down screen'],
  [/\bflare ?screen\b/g, 'flare screen'], [/\bpin ?down\b/g, 'pin down'], [/\belbow\b/g, 'elbow'],
  [/\b(sender|santa)\b/g, 'center'], [/\bquarter ?back\b/g, 'quarterback'], [/\bcover (to|too)\b/g, 'cover 2'], [/\bcover (tree)\b/g, 'cover 3'],
  [/\b(slam|slat) route\b/g, 'slant route'], [/\bspain pick\b/g, 'Spain pick'], [/\bhorns?\b/g, 'horns'],
  [/\bfree ?throw line\b/g, 'free throw line'], [/\bdunker spot\b/g, 'dunker spot'], [/\bfour (verts|verticals)\b/g, 'four verticals']
];
// "oh five", "o 5", "o-5", "x three" → O5 / X3 (only when it reads like a player)
function players(t) {
  return t.replace(new RegExp('\\b(o|oh|owe|0)[ -]?' + NUM + '\\b', 'gi'), (m, a, n) => 'O' + (N[n.toLowerCase()] || n))
    .replace(new RegExp('\\b(x|ex|ax)[ -]?' + NUM + '\\b', 'gi'), (m, a, n) => 'X' + (N[n.toLowerCase()] || n));
}
export function heal(text, mem) {
  mem = mem || memory.get();
  let t = ' ' + String(text || '') + ' ';
  const words = Object.assign({}, community().words, mem.words);   // the coach's own fixes win
  for (const [w, fix] of Object.entries(words)) t = t.replace(new RegExp('\\b' + w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'gi'), fix);
  t = t.replace(/\s+/g, ' ');
  let low = t.toLowerCase();
  FIXES.forEach(([re, fix]) => { low = low.replace(re, fix.toLowerCase()); });
  return players(low).replace(/\bdho\b/gi, 'DHO').replace(/\bspain pick\b/g, 'Spain pick').trim();
}

const norm = s => ' ' + String(s).toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim() + ' ';
// a learned shortcut for this sport, if this phrase (or one it contains) was taught before
export function recall(sport, text, mem) {
  mem = mem || memory.get();
  const t = norm(text), P = mem.phrases[sport] || {};
  let best = null, len = 0;
  for (const ph in P) if (t.indexOf(' ' + ph + ' ') >= 0 && ph.length > len && P[ph].n >= 1) { best = P[ph].key; len = ph.length; }
  if (best) return best;
  const C = community().phrases[sport] || {};   // what other coaches confirmed
  for (const ph in C) if (t.indexOf(' ' + ph + ' ') >= 0 && ph.length > len) { best = C[ph]; len = ph.length; }
  return best;
}
// the coach kept what the AI drew for this phrase: next time, it's instant
export function teach(sport, text, key) {
  const t = norm(text).trim(); if (!key || !t || t.split(' ').length > 8) return;
  const m = memory.get(); m.phrases[sport] = m.phrases[sport] || {};
  const e = m.phrases[sport][t] || { key, n: 0 }; if (e.key !== key) { e.key = key; e.n = 0; }
  e.n++; e.at = Date.now(); m.phrases[sport][t] = e; memory.put(m);
}
// the coach fixed the transcript: learn each word that changed (same position, short words only)
export function correct(heard, meant) {
  const a = norm(heard).trim().split(' '), b = norm(meant).trim().split(' '), m = memory.get(), learned = [];
  if (a.length === b.length) a.forEach((w, i) => { if (w !== b[i] && w.length > 1 && b[i].length > 1 && w.length < 16) { m.words[w] = b[i]; learned.push([w, b[i]]); } });
  else if (a.length <= 6 && b.length <= 6) { m.words[a.join(' ')] = b.join(' '); learned.push([a.join(' '), b.join(' ')]); }
  memory.put(m); return learned;
}
export function forget(kind, k, sport) { const m = memory.get(); if (kind === 'word') delete m.words[k]; else if (m.phrases[sport]) delete m.phrases[sport][k]; memory.put(m); }

// one voice attempt: how it was understood, how long it took, and whether the coach kept it
export function log(row) {
  const m = memory.get(); m.log.push(Object.assign({ at: Date.now() }, row)); m.log = m.log.slice(-300); memory.put(m);
  return m.log.length - 1;
}
// the voice log (paths and timings, this device only) for the explainer's numbers
export const voiceLog = () => memory.get().log || [];
export function mark(i, patch) { const m = memory.get(); if (m.log[i]) { Object.assign(m.log[i], patch); memory.put(m); } }

// words to bias the recognisers toward, for a sport
export function vocabulary(sport) {
  const ids = [];
  for (let i = 1; i <= sport.roster.perSide; i++) ids.push('O' + i, 'X' + i);
  const titles = sport.plays.map(p => p.title), concepts = sport.plays.map(p => p.concept);
  const spots = Object.keys(sport.spots).slice(0, 30), kinds = Object.keys(sport.kinds);
  return Array.from(new Set(ids.concat(titles, concepts, spots, kinds))).filter(Boolean);
}

// ---- sharing (opt-in) and the community lexicon ----
const SHARE = 'chalktalk.shareVoice', LEX = 'chalktalk.lexicon';
export const sharing = () => { try { return localStorage.getItem(SHARE) === '1'; } catch (e) { return false; } };
export const setSharing = v => { try { localStorage.setItem(SHARE, v ? '1' : '0'); } catch (e) {} };
// the coach's players' names (every team and sport saved on this device) never leave it: replaced here
export function scrub(text) {
  let t = String(text || ''), names = [];
  try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (/^chalktalk\.names\./.test(k)) names = names.concat(Object.values(JSON.parse(localStorage.getItem(k) || '{}'))); } } catch (e) {}
  names.filter(n => n && n.length > 1).sort((a, b) => b.length - a.length).forEach(n => {
    n.split(/\s+/).filter(w => w.length > 1).forEach(w => { t = t.replace(new RegExp('\\b' + w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'gi'), '[name]'); });
  });
  return t;
}
// send one learning, only if the coach opted in
export function share(base, row) {
  if (!sharing() || typeof fetch === 'undefined') return;
  const body = Object.assign({}, row, { text: row.text != null ? scrub(row.text).slice(0, 160) : undefined, a: row.a != null ? scrub(row.a).slice(0, 40) : undefined, b: row.b != null ? scrub(row.b).slice(0, 40) : undefined });
  if (/\[name\]/.test((body.a || '') + (body.b || ''))) return;   // a fix that was about a name: keep it here
  fetch(base + '/learn', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body), keepalive: true }).catch(() => {});
}
export function community() { try { return Object.assign({ words: {}, phrases: {} }, JSON.parse(localStorage.getItem(LEX) || '{}')); } catch (e) { return { words: {}, phrases: {} }; } }
// everyone gets the community lexicon (it holds no one's data), refreshed at most every 12 hours
export async function refreshLexicon(base) {
  const c = community(); if (c.at && Date.now() - c.at < 12 * 3600e3) return;
  try { const r = await fetch(base + '/lexicon'); if (!r.ok) return; const j = await r.json(); localStorage.setItem(LEX, JSON.stringify({ at: Date.now(), words: j.words || {}, phrases: j.phrases || {} })); } catch (e) {}
}
