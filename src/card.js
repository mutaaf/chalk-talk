// The player card: tap anyone on the board and the play holds still while you coach them.
// Their position drawn small with its move, their live state in their sport's words (the court zone and the
// partner gap in pickleball, space and the lane on offense, the man and the help on defense, the read order
// in football), a step bar to walk them through the play without closing the card, a roster strip to flip
// to the next player, and four tabs: Now (the best reads, said aloud on a tap), Their play (beat by beat),
// Coach it (the read, do and don't, by age, a drill) and Edit (label, name, the AI brain).
// cardModel is pure (the tests run it on every library play); createCard renders and wires it.

import { icon } from './icons.js';
import { miniBoard, storyOf, positionOf, VERBS } from './guide.js';
import { bestReads } from './engine/reads.js';
import { facts, telemetry, doing } from './engine/mind.js';

const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const r0 = v => Math.round(v);
export const TABS = [['now', 'Now'], ['play', 'Their play'], ['coach', 'Coach it'], ['edit', 'Edit']];
const AGES = [['young', '6–11'], ['mid', '12–14'], ['older', '15+']];

// the numbers that matter for this player right now, as chips: { k, v, tone: 'good' | 'warn' | 'bad' | '' }
export function statsOf(T, sport, nameOf) {
  const nm = nameOf || (x => x), u = sport.unit || 'ft', out = [];
  if (T.net) {
    const n = T.net;
    out.push({ k: 'Court', v: n.zone, tone: n.zone === 'kitchen line' ? 'good' : n.zone === 'transition zone' ? 'warn' : '' });
    out.push({ k: 'To the net', v: r0(n.toNet) + ' ' + u, tone: '' });
    if (n.gap != null) out.push({ k: 'Partner', v: r0(n.gap) + ' ' + u + ' from ' + nm(n.mate), tone: n.gap > sport.court.W * 0.7 ? 'bad' : n.gap > sport.court.W * 0.5 ? 'warn' : 'good' });
  } else if (T.def) {
    const d = T.def;
    if (d.job && d.job.type === 'keeper') out.push({ k: 'Job', v: 'in goal', tone: '' });
    else if (d.job && d.job.type === 'zone') out.push({ k: 'Zone', v: d.zone, tone: '' });
    else if (d.job && d.job.type === 'rush') out.push({ k: 'Job', v: 'rush', tone: '' });
    if (d.man) out.push({ k: d.manHasBall ? 'On the ball' : 'Marking', v: nm(d.man) + ' · ' + r0(d.toMan) + ' ' + u, tone: d.toMan > (sport.open || 3) * 1.5 ? 'warn' : 'good' });
    if (d.beaten) out.push({ k: 'Beaten', v: 'trailing', tone: 'bad' });
    else if (d.screenedBy) out.push({ k: 'Screened', v: 'by ' + nm(d.screenedBy), tone: 'warn' });
    else if (d.help) out.push({ k: 'Help', v: 'on the drive', tone: 'warn' });
    if (d.toBall != null && !d.manHasBall) out.push({ k: 'To the ball', v: r0(d.toBall) + ' ' + u, tone: '' });
  } else if (T.off) {
    const o = T.off;
    if (o.space != null) out.push({ k: 'Space', v: r0(o.space) + ' ' + u + ' · ' + o.open, tone: o.open === 'open' ? 'good' : o.open === 'tight' ? 'warn' : 'bad' });
    if (o.laneOk != null) out.push({ k: 'Lane', v: o.laneOk ? 'clear' : 'blocked', tone: o.laneOk ? 'good' : 'bad' });
    if (o.guards && o.guards.length) out.push({ k: 'Marked by', v: o.guards.map(nm).join(', '), tone: '' });
    if (o.toBall != null) out.push({ k: 'To the ball', v: r0(o.toBall) + ' ' + u, tone: '' });
  }
  if (T.fb) {
    if (T.fb.qb) out.unshift({ k: 'Reading', v: T.fb.reading ? nm(T.fb.reading) : T.fb.startsIn ? 'in ' + T.fb.startsIn.toFixed(1) + 's' : 'done', tone: '' });
    else out.unshift({ k: 'Read', v: T.fb.read + ' of ' + T.fb.of, tone: T.fb.now ? 'good' : T.fb.past ? '' : '' });
  }
  if (T.speed > 0.4) out.push({ k: 'Moving', v: T.speed.toFixed(1) + ' ' + u + '/s', tone: '' });
  return out.slice(0, 4);
}

// a player the guide can't name by role (an auto defender, a soccer player with no label): the spot they start nearest
function nearestPos(sport, side, at) {
  const oy = sport.los == null ? 0 : sport.los, d = q => Math.hypot(q.home[0] - at[0], q.home[1] + oy - at[1]);
  return (sport.positions || []).filter(q => q.side === side && (!q.only || q.only === sport.id)).sort((a, b) => d(a) - d(b))[0] || null;
}

// the headline: the mind view's line, but a move says its job in the sport's words, not its kind name
function statusOf(T, sport, nm) {
  const a = T.action && !T.action.incoming ? T.action : null, K = a && sport.kinds[a.kind];
  if (a && K && K.job && !/pass|handoff|hit|shot/.test(a.type) && !(T.ball && T.ball.state !== 'released' && T.ball.state !== 'holding')) {
    const job = K.job.replace(/\{t\}/g, a.target ? nm(a.target) : '').replace(/\{w\}/g, '').split(/[,:]/)[0].trim();
    return job + (T.route ? ' · ' + Math.round(T.route.done * 100) + '%' : '');
  }
  if (a && !/pass|handoff|hit|shot/.test(a.type) && VERBS[a.kind]) {
    const v = VERBS[a.kind] + (a.target && /for$|to$/.test(VERBS[a.kind]) ? ' ' + nm(a.target) : '');
    return v[0].toUpperCase() + v.slice(1) + (T.route ? ' · ' + Math.round(T.route.done * 100) + '%' : '');
  }
  return doing(T, nm);
}

// everything the card shows for player id at time t
export function cardModel(sim, sport, play, t, id, nameOf, F) {
  const nm = nameOf || (x => x), i = sim.idx[id], p = sim.players[i];
  F = F || facts(sim, sport);
  const T = telemetry(sim, sport, t, i, F), done = t >= sim.beats;
  const board = play.players.find(q => q.id === id) || p;
  const at = sim.posAt(0)[i], pos = positionOf(sport, play, { ...board, x: at[0], y: at[1] }) || nearestPos(sport, p.side, at);
  const steps = [];
  for (let k = 0; k < sim.beats; k++) { const b = sim.beatInfo(k) || { actions: [] }; steps.push({ k, mine: (b.actions || []).some(a => a.who === id || a.target === id), say: b.say || '' }); }
  return {
    id, side: p.side, T, done,
    beat: done ? sim.beats : Math.min(sim.beats - 1, Math.floor(t)),
    status: statusOf(T, sport, nm),
    stats: statsOf(T, sport, nm),
    reads: bestReads(sim, sport, t, i, k => nm(sim.players[k].id)),
    story: storyOf(play, id, sport),
    steps, pos,
    brain: sport.brains ? sport.brains(p) : null,
    thought: T.thought || T.auto || null
  };
}

// ctx: { sim, sport, play, nameOf, posName, names, mark, roles, quiz, title(p), band, setBand,
//        seek(k), hint(h), say(text), watch(id, beat), setRole(id, role), setName(id, name), smart(ids), close(), track(ev, o) }
export function createCard(ctx, startId) {
  const S = ctx.sport, sim = ctx.sim, F = facts(sim, S);
  let id = startId, tab = 'now', t = sim.time(), pick = 0, pb = null, el = null, M = null;
  try { const v = localStorage.getItem('chalktalk.cardTab'); if (TABS.some(x => x[0] === v)) tab = v; } catch (e) {}
  const order = sim.players.map(q => q.id);
  const model = () => (M = cardModel(sim, S, ctx.play, t, id, ctx.nameOf, F), pick = 0, M);
  model();

  const roster = () => `<nav class="ct-pc-roster" aria-label="Players">${order.map(q => {
    const pl = sim.players[sim.idx[q]];
    return `<button type="button" data-who="${esc(q)}" class="${pl.side}${q === id ? ' on' : ''}" aria-pressed="${q === id}" aria-label="${esc(ctx.nameOf(q))}">${esc(ctx.posName(q))}</button>`;
  }).join('')}</nav>`;
  const hero = () => {
    const p = M.pos, nm = ctx.nameOf(id), pn = ctx.posName(id);
    return `<div class="ct-pc-hero">${p ? `<div class="ct-pc-mini">${miniBoard(S, p, { anim: true })}</div>` : `<div class="ct-pc-mini ct-pc-glyph ${M.side}"><span>${esc(pn)}</span></div>`}
      <div class="ct-pc-who"><div class="ct-pc-kick"><span class="ct-gnum ${M.side}">${esc(pn)}</span>${esc(p ? p.name : (S.sides ? S.sides[M.side] : M.side === 'O' ? 'Offense' : 'Defense'))}</div>
        <h5>${esc(nm !== pn ? nm : p ? p.nick || p.name : pn)}</h5>
        ${p ? `<p class="ct-pc-cue">“${esc(p.cue)}” <button type="button" class="ct-pc-say" data-say="cue" aria-label="Say the cue">${icon('speaker')}</button></p>` : ''}
        <p class="ct-pc-now"><i></i><span>${esc(M.status)}</span></p></div></div>
      ${M.stats.length ? `<dl class="ct-pc-stats">${M.stats.map((s, n) => `<div class="${s.tone}" style="--i:${n}"><dt>${esc(s.k)}</dt><dd>${esc(s.v)}</dd></div>`).join('')}</dl>` : ''}`;
  };
  const stepBar = () => {
    if (!sim.beats) return '';
    const b = M.done ? null : M.steps[M.beat];
    return `<div class="ct-pc-steps"><div class="ct-pc-bar"><button type="button" data-step="-1" aria-label="Step back" ${M.beat <= 0 ? 'disabled' : ''}>‹</button>
      <ol>${M.steps.map(s => `<li><button type="button" data-k="${s.k}" class="${s.k === M.beat ? 'on' : ''}${s.mine ? ' mine' : ''}" aria-label="Step ${s.k + 1}${s.mine ? ', ' + esc(ctx.posName(id)) + ' is in it' : ''}">${s.k + 1}</button></li>`).join('')}<li><button type="button" data-k="${sim.beats}" class="end${M.done ? ' on' : ''}" aria-label="End of the play">${icon('check')}</button></li></ol>
      <button type="button" data-step="1" aria-label="Step forward" ${M.done ? 'disabled' : ''}>›</button></div>
      <p>${b ? `<b>Step ${M.beat + 1}</b> ${ctx.mark(b.say || '')}` : '<b>End of the play</b> where everyone finished'}</p></div>`;
  };
  const tabs = () => `<div class="ct-seg ct-pc-tabs" role="tablist">${TABS.map(([k, l]) => `<button type="button" role="tab" data-tab="${k}" aria-selected="${k === tab}" class="${k === tab ? 'on' : ''}">${l}</button>`).join('')}</div>`;

  const nowTab = () => {
    if (ctx.quiz) return `<p class="ct-pc-empty">${icon('lock')} Quiz is on: the reads stay hidden until the team answers.</p>`;
    const th = M.thought ? `<blockquote class="ct-pc-think">${icon('brain')}<span>${ctx.mark(M.thought)}</span></blockquote>` : '';
    if (!M.reads.length) return th + `<p class="ct-pc-empty">No read here. Step to a moment ${esc(ctx.posName(id))} is in (the lit numbers).</p>`;
    return th + `<section class="ct-best"><h6>${icon('sparkle')} Best read ${M.done ? 'at the end' : 'at step ' + (M.beat + 1)}<button type="button" class="ct-pc-say" data-say="read" aria-label="Say the read">${icon('speaker')}</button></h6>
      <ol>${M.reads.map((r, n) => `<li style="--i:${n}"><button type="button" data-read="${n}" class="${n === pick ? 'on' : ''}"><span class="ct-pc-rank">${n + 1}</span><b>${esc(r.text)}</b><small>${esc(r.why)}</small><i class="ct-pc-score" style="--s:${Math.max(0.08, Math.min(1, r.score / (M.reads[0].score || 1))).toFixed(2)}"></i></button></li>`).join('')}</ol>
      <p class="ct-pc-tip">The lit one is drawn on the board. Tap another to see it.</p></section>`;
  };
  const playTab = () => {
    const st = M.story;
    if (!st.length) return `<p class="ct-pc-empty">${esc(ctx.posName(id))} has nothing scripted in “${esc(ctx.play.title)}”. ${esc(idleLine(S, M.side))}</p>`;
    return `<ol class="ct-pc-story">${st.map(s => `<li class="${s.beat === M.beat ? 'on' : s.beat < M.beat ? 'past' : ''}"><button type="button" data-k="${s.beat}"><span class="ct-n">${s.beat + 1}</span><span>${ctx.mark(s.text)}</span></button></li>`).join('')}</ol>
      <button type="button" class="ct-gwatch" data-watch>${icon('view')}<span>Watch only ${esc(ctx.nameOf(id))}</span></button>`;
  };
  const coachTab = () => {
    const p = M.pos, br = M.brain;
    if (!p && !br) return `<p class="ct-pc-empty">No guide for this spot yet.</p>`;
    return (p ? `<p class="ct-pc-job">${esc(p.job)}</p>
      <div class="ct-gcols"><section><h6>What they read</h6><ol class="ct-gsee">${p.sees.map(x => `<li>${esc(x)}</li>`).join('')}</ol></section>
      <section><h6>Do this</h6><ul class="ct-gdo">${p.does.map(x => `<li>${esc(x)}</li>`).join('')}</ul><h6>Not that</h6><ul class="ct-gdont">${p.donts.map(x => `<li>${esc(x)}</li>`).join('')}</ul></section></div>
      <section class="ct-gage"><h6>Coach it by age</h6><div class="ct-seg" role="tablist">${AGES.map(([k, l]) => `<button type="button" role="tab" data-band="${k}" class="${k === ctx.band() ? 'on' : ''}">${l}</button>`).join('')}</div><p>${esc(p.ages[ctx.band()])}</p></section>
      <section class="ct-gdrill"><h6>${icon('check')} Drill: ${esc(p.drill.name)}</h6><p>${esc(p.drill.how)}</p></section>` : '')
      + (br ? `<section class="ct-gbrain"><h6>${icon('brain')} ${esc(br.name)}</h6><p>${esc(br.instincts)}</p></section>` : '');
  };
  const editTab = () => {
    const p = ctx.play.players.find(q => q.id === id) || {}, chips = ctx.roles;
    return `<form class="ct-form"><label>Label</label><div class="ct-row"><input data-role value="${esc(p.role || '')}" placeholder="e.g. ${esc(chips[0] || 'Shooter')}" maxlength="18" autocomplete="off"><button class="go">Save</button></div>
      <div class="ct-chips">${chips.map(c => `<button type="button" data-chip>${esc(c)}</button>`).join('')}</div>
      <label>Name <small>saved on this device only, never sent to the AI</small></label><input data-n value="${esc(ctx.names()[id] || '')}" placeholder="Player's first name" maxlength="24" autocomplete="off"></form>
      <div class="ct-brains"><button type="button" data-s="1">${icon('brain')}<span>${p.smart ? 'Ask this brain again' : 'Let the AI play ' + esc(ctx.posName(id))}</span></button><button type="button" data-s="all">${icon('brain')}<span>${S.rally ? (M.side === 'O' ? 'Your team thinks' : 'The other side thinks') : 'Every ' + (M.side === 'O' ? 'teammate' : 'defender') + ' thinks'}</span></button></div>`;
  };
  const body = () => ({ now: nowTab, play: playTab, coach: coachTab, edit: editTab }[tab])();
  const html = () => `<div class="ct-pc ${M.side}">${roster()}<div class="ct-pc-top">${hero()}</div>${stepBar()}${tabs()}<div class="ct-pc-body" role="tabpanel">${body()}</div></div>`;

  const hint = () => { const r = !ctx.quiz && M.reads[pick]; ctx.hint(r ? { from: sim.idx[id], to: r.to, kind: r.kind } : null); };
  function paint(part) {
    if (!pb) return;
    const sc = pb.closest('.ct-panel'), keep = sc ? sc.scrollTop : 0;
    if (part === 'body') pb.querySelector('.ct-pc-body').innerHTML = body();
    else { pb.innerHTML = html(); if (el) el.querySelector('header h4').textContent = ctx.title(id); }
    if (sc && part !== 'all') sc.scrollTop = keep;
    wire(); hint();
  }
  function go(k) {
    k = Math.max(0, Math.min(sim.beats, k)); ctx.seek(k); t = k; model(); paint('steps');
    const live = pb && pb.querySelector('.ct-pc-steps .on'); if (live && live.scrollIntoView) live.scrollIntoView({ block: 'nearest', inline: 'center' });
  }
  function who(q) { if (q === id || sim.idx[q] == null) return; id = q; model(); paint('all'); ctx.track('card_player'); }
  function wire() {
    pb.querySelectorAll('[data-who]').forEach(b => b.onclick = () => who(b.dataset.who));
    pb.querySelectorAll('[data-step]').forEach(b => b.onclick = () => go(M.beat + +b.dataset.step));
    pb.querySelectorAll('.ct-pc-steps [data-k], .ct-pc-story [data-k]').forEach(b => b.onclick = () => go(+b.dataset.k));
    pb.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => {
      tab = b.dataset.tab; try { localStorage.setItem('chalktalk.cardTab', tab); } catch (e) {}
      pb.querySelectorAll('[data-tab]').forEach(x => { x.classList.toggle('on', x === b); x.setAttribute('aria-selected', String(x === b)); });
      paint('body'); ctx.track('card_tab', { tab });
    });
    pb.querySelectorAll('[data-read]').forEach(b => b.onclick = () => { pick = +b.dataset.read; pb.querySelectorAll('[data-read]').forEach(x => x.classList.toggle('on', x === b)); hint(); });
    pb.querySelectorAll('[data-say]').forEach(b => b.onclick = () => {
      if (b.dataset.say === 'cue' && M.pos) ctx.say(M.pos.cue);
      else if (M.reads[pick]) ctx.say(ctx.nameOf(id) + ': ' + M.reads[pick].text + '. ' + M.reads[pick].why);
    });
    pb.querySelectorAll('[data-band]').forEach(b => b.onclick = () => { ctx.setBand(b.dataset.band); paint('body'); });
    const w = pb.querySelector('[data-watch]'); if (w) w.onclick = () => ctx.watch(id, M.story[0] ? M.story[0].beat : null);
    const form = pb.querySelector('form.ct-form');
    if (form) {
      const roleIn = form.querySelector('[data-role]'), nameIn = form.querySelector('[data-n]');
      form.querySelectorAll('[data-chip]').forEach(b => b.onclick = () => { roleIn.value = b.textContent; form.requestSubmit(); });
      form.onsubmit = e => { e.preventDefault(); ctx.setName(id, nameIn.value.trim()); ctx.close(); ctx.setRole(id, roleIn.value); };
      pb.querySelectorAll('[data-s]').forEach(b => b.onclick = () => {
        ctx.close();
        const team = ctx.play.players.filter(q => q.side === M.side && q.id !== ctx.play.ball && !(S.autonomy && S.autonomy.skip && S.autonomy.skip(q))).map(q => q.id);
        ctx.smart(b.dataset.s === 'all' ? team : [id]);
      });
    }
  }
  // arrows inside the card walk the play (left, right) and the roster (up, down); the board's own keys wait
  function keys(e) {
    if (/INPUT|TEXTAREA/.test(e.target.tagName)) return;
    const d = { ArrowLeft: -1, ArrowRight: 1 }[e.key], r = { ArrowUp: -1, ArrowDown: 1 }[e.key];
    if (d) { e.preventDefault(); e.stopPropagation(); go(M.beat + d); }
    else if (r) { e.preventDefault(); e.stopPropagation(); const n = order.indexOf(id); who(order[(n + r + order.length) % order.length]); }
  }
  return {
    html, title: () => ctx.title(id),
    mount(body, panel) { pb = body; el = panel; wire(); hint(); panel.addEventListener('keydown', keys); ctx.track('best_read', { kind: M.reads[0] ? M.reads[0].kind : 'none' }); },
    get id() { return id; }, get tab() { return tab; }, go, who
  };
}

const idleLine = (S, side) => S.rally ? (side === 'O' ? 'They stay level with the partner, paddle up.' : 'They play the same game from the other side of the net.')
  : S.pitch ? (side === 'O' ? 'They keep the shape and find space to receive.' : 'They stay goal-side and keep the shape.')
  : S.kinds.route ? (side === 'O' ? 'They hold the spacing and read the defense.' : 'They play the coverage and react to the ball.')
  : side === 'O' ? 'They space the floor and read the ball.' : 'They guard the play and react to the ball.';
