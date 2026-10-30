// CourtIQ / FieldIQ, the game: players pick their profile (a nickname and an age band, kept on this
// device), then read real plays from the library: the board runs, freezes at the decision, and they tap
// the open player, the spot, or name the play or coverage. A tutor (the AI when it answers, the play's
// own reads when it doesn't) explains at their age; ratings climb a ladder of levels and the profile
// earns a likeness to a modern pro, or a hybrid of two.

import { icon } from './icons.js';
import { quiz, playFor, grade, record, blank, level, likeness, explain, ageOf, AGES, DIMS } from './engine/iq.js';
import { tutor } from './ai.js';
import { chime } from './sound.js';

const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// profiles: on this device only. The AI only ever hears an age band, never a nickname.
function store(team) {
  const K = 'chalktalk.iq.' + team;
  return {
    get() { try { return JSON.parse(localStorage.getItem(K) || '') || { players: [] }; } catch (e) { return { players: [] }; } },
    put(v) { try { localStorage.setItem(K, JSON.stringify(v)); } catch (e) {} }
  };
}

const PROMPTS = {
  pass: q => `<b class="ct-m O">${q.whoName}</b> has the ball. <em>Who's open?</em> Tap them.`,
  spot: q => `Where does <b class="ct-m O">${q.whoName}</b> go next? <em>Tap the spot.</em>`,
  name: () => '<em>Name that play.</em>',
  coverage: () => '<em>What coverage is the defense in?</em>'
};

export function createIQ(ctx) {
  const S = () => ctx.sport(), db = store(ctx.team);
  let run = null;
  const hud = document.createElement('div');
  hud.className = 'ct-iqhud'; hud.hidden = true;
  hud.innerHTML = `<div class="ct-iqbar"><span class="ct-iqbrand" data-q="brand"></span><span class="ct-iqstep" data-q="step"></span><span class="ct-iqstreak" data-q="streak"></span><span class="ct-iqscore" data-q="score"></span><button type="button" class="ct-x" data-q="quit" aria-label="End the session">${icon('close')}</button></div>
    <div class="ct-iqprompt" data-q="prompt"></div><div class="ct-iqclock"><i data-q="clock"></i></div>
    <div class="ct-iqchoices" data-q="choices"></div>
    <div class="ct-iqfeed" data-q="feed" hidden><div class="ct-iqverdict" data-q="verdict"></div><p data-q="tutor"></p><p class="ct-iqtip" data-q="tip"></p><button type="button" class="go" data-q="next">Next</button></div>`;
  ctx.root.appendChild(hud);
  const H = {}; hud.querySelectorAll('[data-q]').forEach(e => { H[e.dataset.q] = e; });
  H.quit.onclick = () => finish(true);
  H.next.onclick = () => ask(run.i + 1);
  H.choices.onclick = e => { const b = e.target.closest('button'); if (b && run && run.waiting) answer(b.dataset.v); };

  const fam = () => S().iq.name;
  const profOf = pl => (pl.fam && pl.fam[fam()]) || blank();

  // ---- the lobby ----
  function open() {
    const d = db.get(), sport = S(), IQ = sport.iq;
    const card = (pl, i) => {
      const pr = profOf(pl), lv = level(pr.iq, sport), lk = likeness(pr, sport);
      return `<li class="ct-iqp"><button type="button" data-play="${i}"><span class="ct-iqav">${esc((pl.nick || '?').slice(0, 2).toUpperCase())}</span>
        <span class="ct-iqwho"><b>${esc(pl.nick)}</b><small>${esc(ageOf(pl.age).label)} · ${esc(lv.name)}${lk.name ? ' · plays like ' + esc(lk.name) : ''}</small>
        <i class="ct-iqlv"><i style="width:${Math.round(lv.progress * 100)}%"></i></i></span><span class="ct-iqnum">${Math.round(pr.iq)}<small>${esc(IQ.short)}</small></span></button>
        <button type="button" class="ct-iqdel" data-del="${i}" aria-label="Remove ${esc(pl.nick)}">${icon('close')}</button></li>`;
    };
    const body = `<p class="ct-glede">Read real plays like a pro. The board runs, freezes at the moment of truth, and you make the call. Every answer moves your <b>${esc(IQ.name)}</b>.</p>
      <ul class="ct-iqlist">${d.players.map(card).join('') || '<li class="ct-empty">No players yet. Add one below, or jump in as a guest.</li>'}</ul>
      <form class="ct-iqadd" data-f="add"><input name="nick" maxlength="16" placeholder="Nickname (stays on this device)" autocomplete="off" required>
        <div class="ct-seg" role="radiogroup" aria-label="Age">${AGES.map((a, i) => `<label><input type="radio" name="age" value="${a.id}"${i === 1 ? ' checked' : ''}><span>${a.label}</span></label>`).join('')}</div>
        <button class="go">Add player</button></form>
      <div class="ct-iqfoot"><button type="button" data-guest="1">${icon('sparkle')}<span>Play as a guest</span></button><small>Nicknames and scores live on this device. The tutor only hears an age range.</small></div>`;
    ctx.openPanel(IQ.name, body, pb => {
      pb.onclick = e => {
        const t = e.target.closest('[data-play],[data-del],[data-guest]'); if (!t) return;
        if (t.dataset.del != null) { const v = db.get(); v.players.splice(+t.dataset.del, 1); db.put(v); open(); return; }
        if (t.dataset.guest) { start(null, '9-11'); return; }
        start(+t.dataset.play);
      };
      pb.querySelector('[data-f=add]').onsubmit = e => {
        e.preventDefault(); const f = new FormData(e.target), nick = String(f.get('nick') || '').trim().slice(0, 16); if (!nick) return;
        const v = db.get(); v.players.push({ id: Date.now().toString(36), nick, age: f.get('age') || '9-11', fam: {} }); db.put(v); open();
      };
    }, 'ct-xl ct-iq');
  }

  // ---- a session ----
  function start(pi, guestAge) {
    ctx.closePanel();
    const d = db.get(), pl = pi == null ? null : d.players[pi], sport = S();
    const age = pl ? pl.age : guestAge, before = pl ? profOf(pl) : blank();
    run = { pi, age, sport, prof: before, before, qs: quiz(sport, { age, iq: before.iq, n: 6 }), i: -1, score: 0, log: [] };
    if (!run.qs.length) { ctx.toast('No questions for this sport yet.'); run = null; return; }
    ctx.enter();
    hud.hidden = false; H.brand.textContent = sport.iq.name + (pl ? ' · ' + pl.nick : '');
    ask(0);
  }
  function ask(i) {
    if (!run) return;
    if (i >= run.qs.length) { finish(); return; }
    const q = run.qs[i], sport = run.sport, A = ageOf(run.age);
    run.i = i; run.q = q; run.waiting = false; run.t0 = 0;
    const raw = playFor(q, sport);
    ctx.loadQuiz(raw, A.speed);
    q.whoName = q.who ? esc(ctx.posName(q.who)) : '';
    H.step.textContent = `${i + 1} / ${run.qs.length}`; H.feed.hidden = true; H.choices.innerHTML = '';
    H.prompt.innerHTML = q.type === 'name' || q.type === 'coverage' ? '<em>Watch the play…</em>' : 'Watch the play…';
    H.clock.style.transition = 'none'; H.clock.style.width = '100%';
    renderScore();
  }
  // the board reached the freeze point: ask
  function tick(t) {
    if (!run || run.waiting || run.done || !run.q || t < run.q.at) return false;
    const q = run.q, A = ageOf(run.age);
    run.waiting = true; run.t0 = performance.now();
    H.prompt.innerHTML = PROMPTS[q.type](q);
    if (q.choices) H.choices.innerHTML = q.choices.map(c => `<button type="button" data-v="${esc(c)}">${esc(c)}</button>`).join('');
    requestAnimationFrame(() => { H.clock.style.transition = `width ${A.time}s linear`; H.clock.style.width = '0%'; });
    clearTimeout(run.timer);
    run.timer = setTimeout(() => { if (run && run.waiting) { if (A.band === 'young') ctx.hint(q); else answer(null); } }, A.time * 1000);
    chime('ask');
    return true;   // pause here
  }
  const wantsTap = () => !!(run && run.waiting && run.q.type === 'pass');
  const wantsSpot = () => !!(run && run.waiting && run.q.type === 'spot');
  function answer(given) {
    if (!run || !run.waiting) return;
    run.waiting = false; clearTimeout(run.timer);
    const q = run.q, sport = run.sport, ms = performance.now() - run.t0, g = grade(q, given, ms, run.age);
    run.prof = record(run.prof, q, g, run.age);
    run.score += Math.round(g.score * 100);
    run.log.push({ type: q.type, right: g.right, partial: g.partial, quick: g.quick });
    H.clock.style.transition = 'none';
    const raw = playFor(q, sport);
    H.verdict.className = 'ct-iqverdict ' + (g.right ? 'yes' : g.partial ? 'half' : 'no');
    H.verdict.innerHTML = g.right ? (g.quick ? 'Quick read! +' : 'Right read! +') + Math.round(g.score * 100) : g.partial ? 'Open too: +50' : given == null ? 'Time!' : 'Not quite';
    H.tutor.textContent = explain(q, sport, raw, given); H.tip.textContent = '';
    H.choices.querySelectorAll('button').forEach(b => { b.disabled = true; b.classList.toggle('yes', b.dataset.v === q.answer); b.classList.toggle('no', b.dataset.v === given && given !== q.answer); });
    H.feed.hidden = false; H.next.textContent = run.i + 1 < run.qs.length ? 'Next' : 'See my ' + sport.iq.name;
    ctx.reveal(q, given, g);
    chime(g.right ? 'yes' : g.partial ? 'half' : 'no');
    renderScore();
    // the tutor: the AI, pitched at their age, if it answers in time; X's and O's only
    const me = run, ctl = new AbortController(); me.ctl = ctl;
    tutor({ sport, band: ageOf(run.age).band, mode: 'answer', q: { type: q.type, who: q.who, answer: q.answer, also: q.also }, play: ctx.strip(raw), given, right: g.right }, { signal: ctl.signal })
      .then(r => { if (run === me && me.q === q && r && r.say) { H.tutor.textContent = r.say; H.tip.textContent = r.tip ? '→ ' + r.tip : ''; ctx.speak(r.say); } })
      .catch(() => { if (run === me) ctx.speak(H.tutor.textContent); });
  }
  function renderScore() {
    if (!run) return;
    H.score.textContent = run.score + ' pts';
    H.streak.textContent = run.prof.streak >= 2 ? '🔥 ' + run.prof.streak : '';
  }
  function finish(quit) {
    if (!run) return;
    const r = run; run = null; clearTimeout(r.timer); r.ctl && r.ctl.abort();
    hud.hidden = true; ctx.exit();
    if (quit && !r.log.length) return;
    const sport = r.sport, IQ = sport.iq, d = db.get();
    if (r.pi != null && d.players[r.pi]) { const pl = d.players[r.pi]; pl.fam = pl.fam || {}; r.prof.history = (r.prof.history || []).concat([Math.round(r.prof.iq)]).slice(-30); pl.fam[IQ.name] = r.prof; db.put(d); }
    const lv0 = level(r.before.iq, sport), lv = level(r.prof.iq, sport), lk = likeness(r.prof, sport), delta = Math.round((r.prof.iq - r.before.iq) * 10) / 10;
    const right = r.log.filter(x => x.right).length;
    const bars = DIMS.map(k => { const v = k === 'speed' ? r.prof.dims.speed : Math.max(0, Math.min(100, (r.prof.dims[k] - 60) * 1.25)); return `<li><span>${esc(IQ.dims[k])}</span><i><i style="--w:${Math.round(v)}%"></i></i><b>${Math.round(k === 'speed' ? v : r.prof.dims[k])}</b></li>`; }).join('');
    const body = `<div class="ct-iqend">
      <div class="ct-iqbig"><span class="ct-iqcount" data-from="${Math.round(r.before.iq)}" data-to="${Math.round(r.prof.iq)}">${Math.round(r.before.iq)}</span><small>${esc(IQ.name)}</small>
        <em class="${delta >= 0 ? 'up' : 'down'}">${delta >= 0 ? '▲ +' : '▼ '}${delta}</em></div>
      <div class="ct-iqlevel${lv.i > lv0.i ? ' up' : ''}"><b>${esc(lv.name)}</b>${lv.i > lv0.i ? '<span>Level up!</span>' : ''}<i class="ct-iqlv"><i style="width:${Math.round(lv.progress * 100)}%"></i></i><small>${lv.next ? `${Math.max(0, Math.ceil(lv.to - r.prof.iq))} to ${esc(lv.next)}` : 'Top of the ladder'}</small></div>
      <p class="ct-iqline">${right} of ${r.log.length} right · best streak ${r.prof.best}</p>
      <ul class="ct-iqdims">${bars}</ul>
      ${lk.name ? `<div class="ct-iqlike${lk.hybrid ? ' hybrid' : ''}"><small>${lk.hybrid ? 'Hybrid' : 'Plays like'}</small><b>${esc(lk.name)}</b><span>${esc(lk.style)}</span><p>${esc(lk.why)}</p></div>` : `<p class="ct-iqline">${esc(lk.why)}</p>`}
      <p class="ct-iqcoach" data-r="recap"></p>
      <div class="ct-iqagain"><button type="button" data-again="1" class="go">Play again</button><button type="button" data-lobby="1">Players</button></div></div>`;
    ctx.openPanel(IQ.name + ' report', body, pb => {
      const c = pb.querySelector('.ct-iqcount'), a = +c.dataset.from, b = +c.dataset.to, t0 = performance.now();
      (function count(now) { const u = Math.min(1, (now - t0) / 1200); c.textContent = Math.round(a + (b - a) * (1 - Math.pow(1 - u, 3))); if (u < 1 && c.isConnected) requestAnimationFrame(count); })(t0);
      pb.onclick = e => { if (e.target.closest('[data-again]')) start(r.pi, r.age); if (e.target.closest('[data-lobby]')) open(); };
      tutor({ sport, band: ageOf(r.age).band, mode: 'recap', q: { type: 'recap' }, summary: { right, of: r.log.length, byType: r.log, level: lv.name, likeness: lk.name } })
        .then(x => { const el = pb.querySelector('[data-r=recap]'); if (el && x && x.say) el.textContent = x.say + (x.tip ? ' Next time: ' + x.tip : ''); }).catch(() => {});
    }, 'ct-xl ct-iq');
    chime(lv.i > lv0.i ? 'level' : 'done');
    ctx.speak(`${IQ.name} ${Math.round(r.prof.iq)}. ${lv.i > lv0.i ? 'Level up: ' + lv.name + '!' : lv.name + '.'}${lk.name ? ' Plays like ' + lk.name + '.' : ''}`);
  }
  return { open, tick, wantsTap, wantsSpot, answer, active: () => !!run, stop: () => finish(true), destroy() { finish(true); hud.remove(); } };
}
