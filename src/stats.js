// Stats, for analysts: the play's numbers (who touches it, how far everyone runs, spacing, how open
// each catch is, how fast the ball moves), and the AI meter (every call's model, tokens, cache, time
// and estimated cost, today / this week / all time, by task and model, exportable). All on this device.

import { meter } from './ai.js';
import { icon } from './icons.js';
import { memory, forget } from './learn.js';

const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const BEAT_S = 2.4;   // a beat is ~2.4 s at 1×

// the play's numbers, sampled from the engine's timeline
export function playStats(sim, sport) {
  const dt = 0.05, end = sim.beats, n = sim.players.length, dist = new Array(n).fill(0), O = [], catches = [];
  let prev = null, spacingSum = 0, spacingN = 0, minGap = Infinity;
  for (let t = 0; t <= end + 1e-6; t += dt) {
    const P = sim.posAt(Math.min(t, end - 1e-3));
    if (prev) for (let i = 0; i < n; i++) dist[i] += Math.hypot(P[i][0] - prev[i][0], P[i][1] - prev[i][1]);
    const off = sim.players.map((p, i) => i).filter(i => sim.players[i].side === 'O');
    for (let a = 0; a < off.length; a++) for (let b = a + 1; b < off.length; b++) {
      const d = Math.hypot(P[off[a]][0] - P[off[b]][0], P[off[a]][1] - P[off[b]][1]); spacingSum += d; spacingN++;
      if (sim.players[off[a]].role !== 'C' && sim.players[off[b]].role !== 'C') minGap = Math.min(minGap, d);
    }
    prev = P.map(p => p.slice());
  }
  const touches = {};
  sim.play.beats.forEach((b, k) => b.actions.forEach(a => {
    const K = sport.kinds[a.kind]; if (!K) return;
    if (K.type === 'pass' || K.type === 'handoff') {
      const P0 = sim.posAt(k + 0.5), i = sim.idx[a.who], j = sim.idx[a.target];
      const len = i != null && j != null ? Math.hypot(P0[j][0] - P0[i][0], P0[j][1] - P0[i][1]) : 0;
      if (a.kind !== 'snap') catches.push({ beat: k, from: a.who, to: a.target, kind: a.kind, len, space: sim.space(k + 0.94, j), open: sim.space(k + 0.94, j) >= sport.open });
      touches[a.target] = (touches[a.target] || 0) + 1;
    }
    if (K.type === 'shot') O.push({ beat: k, who: a.who });
  }));
  const holder0 = sim.holderAt(0); if (holder0 >= 0) touches[sim.players[holder0].id] = (touches[sim.players[holder0].id] || 0) + 1;
  return {
    beats: sim.beats, seconds: sim.beats * BEAT_S, players: sim.players.map((p, i) => ({ id: p.id, side: p.side, role: p.role, dist: dist[i], touches: touches[p.id] || 0, smart: !!p.smart })),
    spacing: spacingN ? spacingSum / spacingN : 0, minGap: isFinite(minGap) ? minGap : 0, catches, shots: O,
    openRate: catches.length ? catches.filter(c => c.open).length / catches.length : null
  };
}

// the AI meter, rolled up
export function rollup(rows, since) {
  const R = rows.filter(r => r.at >= since), sum = (a, k) => a.reduce((s, r) => s + (r[k] || 0), 0);
  const ms = R.map(r => r.ms || 0).sort((a, b) => a - b), q = p => ms.length ? ms[Math.min(ms.length - 1, Math.floor(p * ms.length))] : 0;
  const by = key => { const m = {}; R.forEach(r => { const k = r[key] || '?'; (m[k] = m[k] || []).push(r); }); return Object.entries(m).map(([k, a]) => ({ k, calls: a.length, in: sum(a, 'in'), out: sum(a, 'out'), cache: sum(a, 'cacheRead'), cost: sum(a, 'cost'), neurons: sum(a, 'neurons'), ms: Math.round(sum(a, 'ms') / a.length) })).sort((a, b) => b.calls - a.calls); };
  const inT = sum(R, 'in'), cache = sum(R, 'cacheRead');
  return { calls: R.length, fails: R.filter(r => r.ok === false).length, in: inT, out: sum(R, 'out'), cache, cacheRate: inT + cache ? cache / (inT + cache) : 0, cost: sum(R, 'cost'), neurons: sum(R, 'neurons'), p50: q(0.5), p95: q(0.95), byTask: by('task'), byModel: by('model'), free: R.filter(r => r.provider === 'free').length };
}

const money = v => v >= 1 ? '$' + v.toFixed(2) : v >= 0.01 ? '$' + v.toFixed(3) : v > 0 ? '$' + v.toFixed(4) : '$0';
const num = v => v >= 1e6 ? (v / 1e6).toFixed(2) + 'M' : v >= 1e4 ? (v / 1e3).toFixed(1) + 'k' : String(Math.round(v));
const secs = ms => ms >= 1000 ? (ms / 1000).toFixed(1) + ' s' : Math.round(ms) + ' ms';

// ctx: { sport, sim, openPanel, posName, mark, toast }
export function openStats(ctx, start) {
  let tab = (start && start.tab) || 'play', span = 'today';
  const S = ctx.sport, unit = S.unit;
  const playTab = () => {
    const st = playStats(ctx.sim, S), max = Math.max(1, ...st.players.map(p => p.dist));
    const tiles = [
      ['Length', st.seconds.toFixed(0) + ' s', st.beats + ' beats at 1×'],
      ['Ball moves', String(st.catches.length), st.catches.length ? 'avg ' + (st.catches.reduce((s, c) => s + c.len, 0) / st.catches.length).toFixed(1) + ' ' + unit : 'no passes'],
      ['Open catches', st.openRate == null ? '–' : Math.round(st.openRate * 100) + '%', 'defender ≥ ' + S.open + ' ' + unit + ' at the catch'],
      ['Spacing', st.spacing.toFixed(1) + ' ' + unit, 'avg between teammates · tightest ' + st.minGap.toFixed(1)]
    ];
    return `<div class="ct-tiles">${tiles.map(([k, v, s]) => `<div class="ct-tile"><small>${k}</small><b>${v}</b><span>${esc(s)}</span></div>`).join('')}</div>
      <h6>Workload</h6><table class="ct-tbl"><thead><tr><th>Player</th><th>Distance</th><th></th><th>Touches</th></tr></thead><tbody>${st.players.map(p => `<tr><td><b class="ct-m ${p.side === 'O' ? 'O' : 'X'}">${esc(ctx.posName(p.id))}</b>${p.smart ? ' <small>AI</small>' : ''}</td><td>${p.dist.toFixed(1)} ${unit}</td><td class="ct-barc"><i style="--w:${Math.round(p.dist / max * 100)}%" class="${p.side}"></i></td><td>${p.touches || ''}</td></tr>`).join('')}</tbody></table>
      ${st.catches.length ? `<h6>Every catch</h6><table class="ct-tbl"><thead><tr><th>Beat</th><th>Pass</th><th>Length</th><th>Space at catch</th></tr></thead><tbody>${st.catches.map(c => `<tr><td>${c.beat + 1}</td><td>${esc(ctx.posName(c.from))} → ${esc(ctx.posName(c.to))}</td><td>${c.len.toFixed(1)} ${unit}</td><td class="${c.open ? 'ok' : 'bad'}">${c.space >= 99 ? 'unguarded' : c.space.toFixed(1) + ' ' + unit}${c.open ? ' ✓' : ' covered'}</td></tr>`).join('')}</tbody></table>` : ''}
      <p class="ct-fine">Turn Defense on to measure space against defenders. Distances are along each player's path; a beat is ${BEAT_S} s at 1×.</p>`;
  };
  const aiTab = () => {
    const rows = meter.all(), now = Date.now(), d0 = new Date(); d0.setHours(0, 0, 0, 0);
    const since = span === 'today' ? d0.getTime() : span === 'week' ? now - 7 * 864e5 : 0, r = rollup(rows, since);
    const tiles = [
      ['AI calls', String(r.calls), r.fails ? r.fails + ' failed' : r.free ? r.free + ' on the free AI' : 'all with your key'],
      ['Tokens', num(r.in + r.out + r.cache), num(r.in) + ' in · ' + num(r.out) + ' out'],
      ['Cache hits', Math.round(r.cacheRate * 100) + '%', num(r.cache) + ' tokens read from cache'],
      ['Est. cost', money(r.cost), r.neurons ? num(r.neurons) + ' free neurons' : 'your key, list prices'],
      ['Latency', r.calls ? secs(r.p50) : '–', r.calls ? 'p50 · p95 ' + secs(r.p95) : 'no calls yet']
    ];
    const table = (head, list) => list.length ? `<h6>${head}</h6><table class="ct-tbl"><thead><tr><th></th><th>Calls</th><th>In</th><th>Out</th><th>Cached</th><th>Avg</th><th>Cost</th></tr></thead><tbody>${list.map(x => `<tr><td>${esc(x.k)}</td><td>${x.calls}</td><td>${num(x.in)}</td><td>${num(x.out)}</td><td>${num(x.cache)}</td><td>${secs(x.ms)}</td><td>${money(x.cost)}</td></tr>`).join('')}</tbody></table>` : '';
    const recent = rows.slice(-12).reverse();
    return `<div class="ct-seg ct-span">${[['today', 'Today'], ['week', '7 days'], ['all', 'All time']].map(([k, l]) => `<button type="button" data-span="${k}" class="${k === span ? 'on' : ''}">${l}</button>`).join('')}</div>
      <div class="ct-tiles">${tiles.map(([k, v, s]) => `<div class="ct-tile"><small>${k}</small><b>${v}</b><span>${esc(s)}</span></div>`).join('')}</div>
      ${table('By task', r.byTask)}${table('By model', r.byModel)}
      ${recent.length ? `<h6>Latest calls</h6><ul class="ct-calls">${recent.map(x => `<li class="${x.ok === false ? 'bad' : ''}"><time>${new Date(x.at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</time><b>${esc(x.task)}</b><span>${esc(x.model)}</span><span>${num((x.in || 0) + (x.cacheRead || 0))}→${num(x.out || 0)}</span><span>${secs(x.ms || 0)}</span><span>${x.provider === 'free' ? 'free' : money(x.cost || 0)}</span></li>`).join('')}</ul>` : '<p class="ct-empty">No AI calls yet. Say a play, run the film room or play CourtIQ.</p>'}
      <div class="ct-statsfoot"><button type="button" data-b="csv">${icon('film')}<span>Export CSV</span></button><button type="button" data-b="clear">Reset the meter</button></div>
      <p class="ct-fine">Costs are estimates at list prices (Sonnet 5.5 $2 / $10, Haiku 5.5 $0.10 / $0.50 per million tokens in / out, cache reads at a tenth). The free AI costs you nothing; it counts against a shared daily allowance. Only counts are kept, on this device: never what was said.</p>`;
  };
  const voiceTab = () => {
    const m = memory.get(), L = m.log.filter(x => !x.sport || x.sport === S.id), n = L.length;
    const ok = L.filter(x => x.ok), inst = L.filter(x => x.path === 'command' || x.path === 'library' || x.path === 'learned');
    const ai = L.filter(x => x.path === 'ai' && x.ok), judged = ai.filter(x => x.kept != null), kept = judged.filter(x => x.kept);
    const med = a => { const v = a.map(x => x.ms).sort((p, q) => p - q); return v.length ? v[Math.floor(v.length / 2)] : 0; };
    const tiles = [
      ['Understood', n ? Math.round(ok.length / n * 100) + '%' : '–', n + ' things said or sketched'],
      ['Instant', n ? Math.round(inst.length / n * 100) + '%' : '–', 'answered on the device · ' + (inst.length ? secs(med(inst)) : '–')],
      ['AI drawn', ai.length ? secs(med(ai)) : '–', 'median, words to play'],
      ['Kept', judged.length ? Math.round(kept.length / judged.length * 100) + '%' : '–', 'AI plays the coach kept']
    ];
    const P = m.phrases[S.id] || {}, phrases = Object.entries(P), words = Object.entries(m.words);
    return `<div class="ct-tiles">${tiles.map(([k, v, s2]) => `<div class="ct-tile"><small>${k}</small><b>${v}</b><span>${esc(s2)}</span></div>`).join('')}</div>
      <h6>It learned these shortcuts (instant next time)</h6>${phrases.length ? `<ul class="ct-learned">${phrases.map(([ph, e]) => `<li><span>“${esc(ph)}”</span><b>${esc((S.plays.find(p => p.key === e.key) || {}).title || e.key)}</b><button type="button" data-forget="phrase" data-k="${esc(ph)}" aria-label="Forget">${icon('close')}</button></li>`).join('')}</ul>` : '<p class="ct-empty">Say a play in your own words; when you keep what the AI draws, the phrase is learned.</p>'}
      <h6>Words it hears right now</h6>${words.length ? `<ul class="ct-learned">${words.map(([w, f]) => `<li><span>“${esc(w)}”</span><b>→ ${esc(f)}</b><button type="button" data-forget="word" data-k="${esc(w)}" aria-label="Forget">${icon('close')}</button></li>`).join('')}</ul>` : '<p class="ct-empty">Tap what it heard (under the mic) to fix a word. It remembers.</p>'}
      <p class="ct-fine">All of this lives on this device and gets better every time you talk to it. Nothing you say is stored anywhere else.</p>`;
  };
  const body = () => `<div class="ct-seg ct-gtabs">${[['play', 'This play'], ['voice', 'Voice'], ['ai', 'AI usage']].map(([k, l]) => `<button type="button" data-tab="${k}" class="${k === tab ? 'on' : ''}">${l}</button>`).join('')}</div><div class="ct-gbody">${tab === 'play' ? playTab() : tab === 'voice' ? voiceTab() : aiTab()}</div>`;
  ctx.openPanel('Stats', body(), pb => {
    const redraw = () => { pb.innerHTML = body(); };
    pb.onclick = e => {
      const t = e.target.closest('[data-tab],[data-span],[data-b],[data-forget]'); if (!t) return;
      if (t.dataset.forget) { forget(t.dataset.forget, t.dataset.k, S.id); redraw(); return; }
      if (t.dataset.tab) { tab = t.dataset.tab; redraw(); }
      if (t.dataset.span) { span = t.dataset.span; redraw(); }
      if (t.dataset.b === 'clear') { meter.clear(); redraw(); ctx.toast('Meter reset.'); }
      if (t.dataset.b === 'csv') {
        const rows = meter.all(), cols = ['at', 'task', 'provider', 'model', 'ok', 'ms', 'in', 'out', 'cacheRead', 'cacheWrite', 'neurons', 'cost'];
        const csv = [cols.join(',')].concat(rows.map(r => cols.map(c => c === 'at' ? new Date(r.at).toISOString() : r[c] == null ? '' : String(r[c]).replace(/,/g, ' ')).join(','))).join('\n');
        const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = 'chalk-talk-ai-usage.csv'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
      }
    };
  }, 'ct-xl ct-stats');
}
