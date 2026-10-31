// CourtIQ / FieldIQ, the game: players pick their profile (a nickname and an age band, kept on this
// device), then read real plays from the library: the board runs, freezes at the decision, and they tap
// the open player, the spot, or name the play or coverage. A tutor (the AI when it answers, the play's
// own reads when it doesn't) explains at their age; ratings climb a ladder of levels and the profile
// earns a likeness to a modern pro, or a hybrid of two.

import { icon } from './icons.js';
import { quiz, playFor, grade, record, blank, level, likeness, explain, ageOf, AGES, DIMS, DAILY, dayNumber } from './engine/iq.js';
import { tutor } from './ai.js';
import { chime } from './sound.js';
import { howChip } from './howai.js';

const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// profiles: on this device only. The AI only ever hears an age band, never a nickname.
function store(team) {
  const K = 'chalktalk.iq.' + team;
  return {
    get() { try { return JSON.parse(localStorage.getItem(K) || '') || { players: [] }; } catch (e) { return { players: [] }; } },
    put(v) { try { localStorage.setItem(K, JSON.stringify(v)); } catch (e) {} }
  };
}

// the daily challenge: one result per day per game (CourtIQ / FieldIQ / PitchIQ), and the streak of days
export function dailyStore(fam) {
  const K = 'chalktalk.iqdaily.' + fam;
  return {
    get() { try { return JSON.parse(localStorage.getItem(K) || '') || { days: {}, streak: 0, last: 0 }; } catch (e) { return { days: {}, streak: 0, last: 0 }; } },
    put(v) { try { localStorage.setItem(K, JSON.stringify(v)); } catch (e) {} },
    today() { return this.get().days[dayNumber()] || null; }
  };
}
// the share line: no names, no play details, just the squares
export function shareText(name, day, log, secs, streak, sport) {
  const sq = log.map(x => (x.right ? (x.quick ? '🟩' : '🟨') : x.partial ? '🟧' : '⬛')).join('');
  const right = log.filter(x => x.right).length;
  return `${name} Daily #${day}  ${right}/${log.length}  ${sq}  ${Math.round(secs)}s${streak > 1 ? '  🔥' + streak : ''}\nmutaafaziz.com/chalktalk?iq=daily${sport && sport !== 'basketball' ? '&sport=' + sport : ''}`;
}

// badges: earned once, kept on this device. Each checks what's already stored (the daily days and streak,
// the best run, the "You" profile's reads and level)
export const BADGES = [
  { id: 'first', icon: '🎯', name: 'First read', how: 'Play a Daily', ok: x => x.dailies >= 1 },
  { id: 'perfect', icon: '💎', name: 'Perfect five', how: 'Get all five in a Daily', ok: x => x.perfect >= 1 },
  { id: 'streak3', icon: '🔥', name: 'On a heater', how: 'Play the Daily 3 days in a row', ok: x => x.streak >= 3 },
  { id: 'streak7', icon: '📅', name: 'Every day', how: 'A 7-day Daily streak', ok: x => x.streak >= 7 },
  { id: 'streak30', icon: '🏆', name: 'Season ticket', how: 'A 30-day Daily streak', ok: x => x.streak >= 30 },
  { id: 'run10', icon: '⚡', name: 'Ten straight', how: '10 in a row in Streak Run', ok: x => x.run >= 10 },
  { id: 'run25', icon: '🌪️', name: 'Unstoppable', how: '25 in a row in Streak Run', ok: x => x.run >= 25 },
  { id: 'reads100', icon: '👀', name: 'Film junkie', how: 'Make 100 reads', ok: x => x.reads >= 100 },
  { id: 'reads500', icon: '🎬', name: 'Film room regular', how: 'Make 500 reads', ok: x => x.reads >= 500 },
  { id: 'level', icon: '📈', name: 'Moving up', how: 'Reach the second level', ok: x => x.level >= 1 }
];
export function earned(x) { return BADGES.filter(b => b.ok(x)).map(b => b.id); }
// the time until tomorrow's five, said simply
export function untilTomorrow(now = new Date()) {
  const t = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1), m = Math.max(1, Math.round((t - now) / 60000));
  return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m`;
}

// the same question, said a few ways (q.n picks one), shown while the clip runs so they know what to watch
const W = q => `<b class="ct-m O">${q.whoName}</b>`, D = q => `<b class="ct-m X">${q.whoName}</b>`;
const PROMPTS = {
  pass: [q => `${W(q)} has the ball. <em>Who's open?</em> Tap them.`, q => `<em>Find the open player.</em> ${W(q)} is about to pass.`, q => `Be ${W(q)}: <em>where does the ball go?</em>`],
  spot: [q => `Where does ${W(q)} go next? <em>Tap the spot.</em>`, q => `${W(q)} moves next. <em>Tap where.</em>`, q => `<em>Tap the spot</em> ${W(q)} runs to.`],
  read: [q => `${W(q)} has it. <em>What's the read?</em>`, q => `<em>Pass, drive or shoot?</em> You're ${W(q)}.`, q => `Ball in ${W(q)}'s hands. <em>Make the call.</em>`],
  next: [() => '<em>What happens next?</em>', () => '<em>Call the next move</em> before it happens.', () => '<em>What comes next?</em>'],
  defense: [q => `You're ${D(q)}. <em>What's your job right now?</em>`, q => `<em>Defense:</em> what should ${D(q)} do?`, q => `${D(q)}, <em>read the ball.</em> What's the job?`],
  name: [() => '<em>Name that play.</em>', () => '<em>What play is this?</em> Call it early.', () => '<em>Name it</em> before it finishes.'],
  coverage: [() => '<em>What coverage is the defense in?</em>', () => '<em>Read the defense.</em> Which coverage?', () => '<em>Count the deep defenders.</em> What is it?']
};
const prompt = q => { const P = PROMPTS[q.type]; return P[(q.n || 0) % P.length](q); };

export function createIQ(ctx) {
  const S = () => ctx.sport(), db = store(ctx.team);
  let run = null;
  const hud = document.createElement('div');
  hud.className = 'ct-iqhud'; hud.hidden = true;
  hud.innerHTML = `<div class="ct-iqbar"><span class="ct-iqbrand" data-q="brand"></span><span class="ct-iqstep" data-q="step"></span><span class="ct-iqstreak" data-q="streak"></span><span class="ct-iqscore" data-q="score"></span><button type="button" class="ct-x" data-q="quit" aria-label="End the session">${icon('close')}</button></div>
    <div class="ct-iqprompt" data-q="prompt"></div><div class="ct-iqclock"><i data-q="clock"></i></div>
    <div class="ct-iqchoices" data-q="choices"></div>
    <div class="ct-iqfeed" data-q="feed" hidden><div class="ct-iqverdict" data-q="verdict"></div><p data-q="tutor"></p><p class="ct-iqtip" data-q="tip"></p><button type="button" class="go" data-q="next"><span data-q="nextLabel">Next</span><i data-q="auto"></i></button></div>`;
  ctx.root.appendChild(hud);
  const H = {}; hud.querySelectorAll('[data-q]').forEach(e => { H[e.dataset.q] = e; });
  H.quit.onclick = () => finish(true);
  H.next.onclick = () => { if (run) ask(run.i + 1); };
  H.feed.onpointerdown = e => { if (run && !e.target.closest('[data-q=next]')) holdOn(); };   // reading the tutor: don't move on
  H.choices.onclick = e => { const b = e.target.closest('button'); if (b && run && run.waiting) answer(b.dataset.v); };

  const fam = () => S().iq.name;
  const profOf = pl => (pl.fam && pl.fam[fam()]) || blank();

  // ---- the lobby: the daily challenge up top, a quick game, then the players ----
  function dailyCard(sport) {
    const ds = dailyStore(fam()), d = ds.get(), today = d.days[dayNumber()], IQ = sport.iq;
    const streak = today || d.last === dayNumber() - 1 ? d.streak : 0;
    if (today) {
      const sq = today.log.map(x => `<i class="${x.right ? (x.quick ? 'g' : 'y') : x.partial ? 'o' : 'k'}"></i>`).join('');
      return `<section class="ct-iqhero done"><small>${esc(IQ.name)} Daily · #${dayNumber()}</small><h3>${today.right}/${today.log.length} <span>in ${Math.round(today.secs)}s</span></h3>
        <div class="ct-iqsq">${sq}</div><p>${streak > 1 ? `🔥 ${streak}-day streak. ` : ''}Next five in <b data-tick="1">${untilTomorrow()}</b>.</p>
        <div class="ct-iqherorow"><button type="button" class="go" data-share="1">${icon('share')}<span>Share</span></button><button type="button" data-quick="1">Keep playing</button></div></section>`;
    }
    return `<section class="ct-iqhero"><small>${esc(IQ.name)} Daily · #${dayNumber()}${streak ? ` · 🔥 ${streak}` : ''}</small><h3>${streak ? `Keep the ${streak}-day streak` : `How high is your ${esc(IQ.name)}?`}</h3>
      <p>${streak ? `Today’s five are up. Play before midnight and the streak lives.` : 'Five real plays. The board freezes at the moment of truth and you make the read. About a minute; the same five for everyone today.'}${howChip('iq', 'who writes these?')}</p>
      <div class="ct-iqherorow"><button type="button" class="go" data-daily="1">${icon('play')}<span>Play today's five</span></button><button type="button" data-quick="1">Quick game</button></div></section>`;
  }
  // more ways to play, always there: a quick five on your rating, and Streak Run (until the first miss)
  function modes(sport) {
    const best = dailyStore(fam()).get().bestRun || 0;
    return `<div class="ct-iqmodes"><button type="button" data-quick="1"><b>${icon('play')}Quick five</b><small>Five fresh reads on your rating</small></button>
      <button type="button" data-run="1"><b>⚡ Streak Run</b><small>${best ? `Best: ${best} in a row. Beat it.` : 'How many in a row? One miss ends it.'}</small></button></div>`;
  }
  // the badge shelf: what's earned, what's next
  function stats() {
    const d = dailyStore(fam()).get(), me = db.get().players.find(p => p.you), pr = me ? profOf(me) : blank();
    const days = Object.values(d.days || {});
    return { dailies: days.length, perfect: days.filter(x => x.right === x.log.length).length, streak: Math.max(d.streak || 0, d.bestStreak || 0), run: d.bestRun || 0, reads: (d.reads || 0), level: level(pr.iq, S()).i };
  }
  function shelf() {
    const have = new Set(dailyStore(fam()).get().badges || []);
    return `<h4 class="ct-iqh">Badges <small>${have.size} of ${BADGES.length}</small></h4><ul class="ct-iqbadges">${BADGES.map(b => `<li class="${have.has(b.id) ? 'on' : ''}" title="${esc(b.how)}"><i>${b.icon}</i><b>${esc(b.name)}</b><small>${esc(b.how)}</small></li>`).join('')}</ul>`;
  }
  // after any game: count the reads, keep the bests, award what's new (a toast for each)
  function award(reads) {
    const ds = dailyStore(fam()), d = ds.get();
    d.reads = (d.reads || 0) + (reads || 0); d.bestStreak = Math.max(d.bestStreak || 0, d.streak || 0); ds.put(d);
    const have = new Set(d.badges || []), now = earned(stats()).filter(id => !have.has(id));
    if (!now.length) return [];
    d.badges = [...have, ...now]; ds.put(d);
    now.forEach((id, i) => { const b = BADGES.find(x => x.id === id); setTimeout(() => ctx.toast(`${b.icon} Badge: ${b.name}`), 900 + i * 1600); });
    ctx.track && ctx.track('iq_badge', { n: now.length });
    return now;
  }
  // the player behind "Quick five" when nobody's been added: "You", made once, so the rating always carries over
  function you() {
    const v = db.get(); let i = v.players.findIndex(p => p.you);
    if (i < 0 && v.players.length === 1) return 0;
    if (i < 0) { v.players.unshift({ id: 'you', nick: 'You', you: true, age: '12-14', fam: {} }); db.put(v); i = 0; }
    return i;
  }
  function open(mode) {
    if (mode === 'daily' && !dailyStore(fam()).today()) { daily(); return; }
    const d = db.get(), sport = S(), IQ = sport.iq;
    const card = (pl, i) => {
      const pr = profOf(pl), lv = level(pr.iq, sport), lk = likeness(pr, sport);
      return `<li class="ct-iqp"><button type="button" data-play="${i}"><span class="ct-iqav">${esc((pl.nick || '?').slice(0, 2).toUpperCase())}</span>
        <span class="ct-iqwho"><b>${esc(pl.nick)}</b><small>${esc(ageOf(pl.age).label)} · ${esc(lv.name)}${lk.name ? ' · plays like ' + esc(lk.name) : ''}</small>
        <i class="ct-iqlv"><i style="width:${Math.round(lv.progress * 100)}%"></i></i></span><span class="ct-iqnum">${Math.round(pr.iq)}<small>${esc(IQ.short)}</small></span></button>
        <button type="button" class="ct-iqdel" data-del="${i}" aria-label="Remove ${esc(pl.nick)}">${icon('close')}</button></li>`;
    };
    const body = dailyCard(sport) + modes(sport) + `<h4 class="ct-iqh">Players <small>Build a rating, level up, find whose game yours reads like</small></h4>
      <ul class="ct-iqlist">${d.players.map(card).join('') || '<li class="ct-empty">No players yet. Add one and every game moves their rating.</li>'}</ul>
      <form class="ct-iqadd" data-f="add"><input name="nick" maxlength="16" placeholder="Nickname (stays on this device)" autocomplete="off" required>
        <div class="ct-seg" role="radiogroup" aria-label="Age">${AGES.map((a, i) => `<label><input type="radio" name="age" value="${a.id}"${i === 1 ? ' checked' : ''}><span>${a.label}</span></label>`).join('')}</div>
        <button class="go">Add player</button></form>
      ${shelf()}
      <div class="ct-iqfoot"><small>Nicknames and scores live on this device. The tutor only hears an age range.</small></div>`;
    ctx.openPanel(IQ.name, body, pb => {
      const tk = pb.querySelector('[data-tick]'); if (tk) { const iv = setInterval(() => { if (!tk.isConnected) clearInterval(iv); else tk.textContent = untilTomorrow(); }, 30000); }
      pb.onclick = e => {
        const t = e.target.closest('[data-play],[data-del],[data-daily],[data-quick],[data-share],[data-run]'); if (!t) return;
        if (t.dataset.run) { streakRun(); return; }
        if (t.dataset.del != null) { const v = db.get(); v.players.splice(+t.dataset.del, 1); db.put(v); open(); return; }
        if (t.dataset.daily) { daily(); return; }
        if (t.dataset.quick) { start(you()); return; }
        if (t.dataset.share) { const x = dailyStore(fam()).today(); if (x) share(shareText(S().iq.name, dayNumber(), x.log, x.secs, dailyStore(fam()).get().streak, S().id)); return; }
        start(+t.dataset.play);
      };
      pb.querySelector('[data-f=add]').onsubmit = e => {
        e.preventDefault(); const f = new FormData(e.target), nick = String(f.get('nick') || '').trim().slice(0, 16); if (!nick) return;
        const v = db.get(); v.players.push({ id: Date.now().toString(36), nick, age: f.get('age') || '9-11', fam: {} }); db.put(v); open();
      };
    }, 'ct-xl ct-iq');
  }
  async function share(text) {
    ctx.track && ctx.track('iq_share', {});
    try { if (navigator.share) { await navigator.share({ text }); return; } } catch (e) { if (e && e.name === 'AbortError') return; }
    try { await navigator.clipboard.writeText(text); ctx.toast('Copied. Paste it anywhere.'); } catch (e) { ctx.toast(text); }
  }

  // ---- a session ----
  function start(pi, guestAge) {
    ctx.closePanel();
    const d = db.get(), pl = pi == null ? null : d.players[pi], sport = S();
    const age = pl ? pl.age : guestAge, before = pl ? profOf(pl) : blank();
    run = { pi, age, sport, prof: before, before, qs: quiz(sport, { age, iq: before.iq, n: 5, seen: before.seen || guestSeen() }), i: -1, score: 0, log: [], t: performance.now() };
    begin(pl ? pl.nick : '');
  }
  // the daily: same five for everyone (seeded by the day), pitched mid-range, no rating on the line
  function daily() {
    ctx.closePanel();
    const sport = S();
    run = { daily: true, pi: null, age: DAILY.age, sport, prof: blank(), before: blank(), qs: quiz(sport, { seed: dayNumber() * 7919 + sport.id.length, n: DAILY.n, iq: DAILY.iq, age: DAILY.age, mix: DAILY.mix }), i: -1, score: 0, log: [], t: performance.now() };
    begin('Daily #' + dayNumber());
  }
  // Streak Run: reads until the first miss, five at a time on your rating, the best run kept
  function streakRun() {
    ctx.closePanel();
    const pi = you(), pl = db.get().players[pi], sport = S(), before = profOf(pl);
    run = { mode: 'run', pi, age: pl.age, sport, prof: before, before, qs: [], i: -1, score: 0, log: [], t: performance.now(), seed: Date.now() };
    run.qs = quiz(sport, { age: pl.age, iq: before.iq, n: 5, seen: before.seen, seed: run.seed });
    begin('Streak Run');
  }
  function begin(label) {
    if (!run.qs.length) { ctx.toast('No questions for this sport yet.'); run = null; return; }
    const sport = run.sport;
    ctx.enter(); ctx.track && ctx.track('iq_start', { band: ageOf(run.age).band, guest: run.pi == null ? 1 : 0, daily: run.daily ? 1 : 0 });
    hud.hidden = false; H.brand.textContent = sport.iq.name + (label ? ' · ' + label : '');
    ask(0);
  }
  // a guest's recent questions, so even without a profile the next game is new
  const GK = 'chalktalk.iqseen';
  function guestSeen() { try { return JSON.parse(localStorage.getItem(GK) || '{}') || {}; } catch (e) { return {}; } }
  function guestSaw(q) { if (!q.id) return; const s2 = guestSeen(); s2[q.id] = Date.now(); const ids = Object.keys(s2); if (ids.length > 300) ids.sort((a, b) => s2[a] - s2[b]).slice(0, ids.length - 300).forEach(k => delete s2[k]); try { localStorage.setItem(GK, JSON.stringify(s2)); } catch (e) {} }
  function holdOn() { if (!run || !run.auto) return; clearTimeout(run.auto); run.auto = 0; H.next.classList.remove('auto'); }
  function ask(i) {
    if (!run) return;
    holdOn();
    if (run.mode === 'run' && run.over) { finish(); return; }
    if (run.mode === 'run' && i >= run.qs.length - 1) { const seen = Object.assign({}, run.prof.seen); run.qs.slice(0, i + 1).forEach(x => { seen[x.id] = 1e9; }); run.qs = run.qs.concat(quiz(run.sport, { age: run.age, iq: run.prof.iq, n: 5, seen, seed: run.seed + i + 1 })); }
    if (i >= run.qs.length) { finish(); return; }
    const q = run.qs[i], sport = run.sport, A = ageOf(run.age);
    run.i = i; run.q = q; run.waiting = false; run.t0 = 0;
    const raw = playFor(q, sport);
    q.whoName = q.who ? esc(ctx.posName(q.who)) : '';
    ctx.loadQuiz(raw, A.speed, q.from || 0);
    H.step.textContent = run.mode === 'run' ? `⚡ ${run.log.filter(x => x.right || x.partial).length} in a row` : `${i + 1} / ${run.qs.length}`; H.feed.hidden = true;
    hud.classList.add('watch');
    H.prompt.innerHTML = prompt(q);
    H.choices.innerHTML = q.choices ? q.choices.map(c => `<button type="button" data-v="${esc(c)}" disabled>${esc(c)}</button>`).join('') : '';
    H.clock.style.transition = 'none'; H.clock.style.width = '100%';
    renderScore();
  }
  // the board reached the freeze point: ask
  function tick(t) {
    if (!run || run.waiting || run.done || !run.q || run.q.asked || t < run.q.at) return false;   // once: the reveal plays on past it
    const q = run.q, A = ageOf(run.age);
    run.waiting = true; run.t0 = performance.now(); q.asked = true;
    hud.classList.remove('watch');
    H.choices.querySelectorAll('button').forEach(b => { b.disabled = false; });
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
    H.tutor.textContent = explain(q, sport, raw, given).replace(/\b([OX][1-9])\b/g, m => ctx.posName(m)); H.tip.innerHTML = /^sit-/.test(q.key) ? 'A game situation the engine made up for you' + howChip('iq') : '';
    H.choices.querySelectorAll('button').forEach(b => { b.disabled = true; b.classList.toggle('yes', b.dataset.v === q.answer); b.classList.toggle('no', b.dataset.v === given && given !== q.answer); });
    if (run.mode === 'run' && !g.right && !g.partial) run.over = true;
    H.feed.hidden = false; H.nextLabel.textContent = run.over ? 'See my run' : run.mode === 'run' || run.i + 1 < run.qs.length ? 'Next' : run.daily ? 'See my score' : 'See my ' + sport.iq.name;
    ctx.reveal(q, given, g);
    chime(g.right ? 'yes' : g.partial ? 'half' : 'no');
    renderScore();
    if (run.pi == null) guestSaw(q);
    // on to the next one by itself: quick when it was right, time to read when it wasn't (tap the card to stay)
    const me = run, wait = g.right ? 2200 : 4800;
    H.next.classList.remove('auto'); void H.next.offsetWidth; H.next.style.setProperty('--auto', wait + 'ms'); H.next.classList.add('auto');
    me.auto = setTimeout(() => { if (run === me && me.q === q) ask(me.i + 1); }, wait);
    if (g.right) return;
    // a miss: the tutor (the AI, pitched at their age, if it answers in time; X's and O's only)
    const ctl = new AbortController(); me.ctl = ctl;
    tutor({ sport, band: ageOf(run.age).band, mode: 'answer', q: { type: q.type, who: q.who, answer: q.answer, also: q.also }, play: ctx.strip(raw), given, right: g.right }, { signal: ctl.signal })
      .then(r => { if (run === me && me.q === q && r && r.say) { H.tutor.textContent = r.say; H.tip.textContent = r.tip ? '→ ' + r.tip : ''; } })
      .catch(() => {});
  }
  function renderScore() {
    if (!run) return;
    H.score.textContent = run.score + ' pts';
    H.streak.textContent = run.prof.streak >= 2 ? '🔥 ' + run.prof.streak : '';
  }
  function finish(quit) {
    if (!run) return;
    const r = run; run = null; clearTimeout(r.timer); clearTimeout(r.auto); r.ctl && r.ctl.abort();
    hud.hidden = true; ctx.exit();
    if (quit && !r.log.length) return;
    if (r.daily) { if (!quit) dailyDone(r); return; }
    if (r.mode === 'run') { runDone(r); return; }
    const sport = r.sport, IQ = sport.iq, d = db.get();
    if (r.pi != null && d.players[r.pi]) { const pl = d.players[r.pi]; pl.fam = pl.fam || {}; r.prof.history = (r.prof.history || []).concat([Math.round(r.prof.iq)]).slice(-30); pl.fam[IQ.name] = r.prof; db.put(d); }
    award(r.log.length);
    const lv0 = level(r.before.iq, sport), lv = level(r.prof.iq, sport), lk = likeness(r.prof, sport), delta = Math.round((r.prof.iq - r.before.iq) * 10) / 10;
    const right = r.log.filter(x => x.right).length;
    ctx.track && ctx.track('iq_done', { band: ageOf(r.age).band, right, of: r.log.length, level: lv.name, up: lv.i > lv0.i ? 1 : 0 });
    const bars = DIMS.map(k => { const v = k === 'speed' ? r.prof.dims.speed : Math.max(0, Math.min(100, (r.prof.dims[k] - 60) * 1.25)); return `<li><span>${esc(IQ.dims[k])}</span><i><i style="--w:${Math.round(v)}%"></i></i><b>${Math.round(k === 'speed' ? v : r.prof.dims[k])}</b></li>`; }).join('');
    const body = `<div class="ct-iqend">
      <div class="ct-iqbig"><span class="ct-iqcount" data-from="${Math.round(r.before.iq)}" data-to="${Math.round(r.prof.iq)}">${Math.round(r.before.iq)}</span><small>${esc(IQ.name)}</small>
        <em class="${delta >= 0 ? 'up' : 'down'}">${delta >= 0 ? '▲ +' : '▼ '}${delta}</em></div>
      <div class="ct-iqlevel${lv.i > lv0.i ? ' up' : ''}"><b>${esc(lv.name)}</b>${lv.i > lv0.i ? '<span>Level up!</span>' : ''}<i class="ct-iqlv"><i style="width:${Math.round(lv.progress * 100)}%"></i></i><small>${lv.next ? `${Math.max(0, Math.ceil(lv.to - r.prof.iq))} to ${esc(lv.next)}` : 'Top of the ladder'}</small></div>
      <p class="ct-iqline">${right} of ${r.log.length} right · best streak ${r.prof.best}</p>
      <ul class="ct-iqdims">${bars}</ul>
      ${lk.name ? `<div class="ct-iqlike${lk.hybrid ? ' hybrid' : ''}"><small>${lk.hybrid ? 'Hybrid' : 'Plays like'}</small><b>${esc(lk.name)}</b><span>${esc(lk.style)}</span><p>${esc(lk.why)}</p></div>` : `<p class="ct-iqline">${esc(lk.why)}</p>`}
      <p class="ct-iqcoach" data-r="recap"></p>
      <div class="ct-iqagain"><button type="button" data-again="1" class="go">Play again</button>${dailyStore(IQ.name).today() ? '' : '<button type="button" data-daily="1">Today’s Daily</button>'}<button type="button" data-lobby="1">Players</button></div></div>`;
    ctx.openPanel(IQ.name + ' report', body, pb => {
      const c = pb.querySelector('.ct-iqcount'), a = +c.dataset.from, b = +c.dataset.to, t0 = performance.now();
      (function count(now) { const u = Math.min(1, (now - t0) / 1200); c.textContent = Math.round(a + (b - a) * (1 - Math.pow(1 - u, 3))); if (u < 1 && c.isConnected) requestAnimationFrame(count); })(t0);
      pb.onclick = e => { if (e.target.closest('[data-again]')) start(r.pi, r.age); if (e.target.closest('[data-lobby]')) open(); if (e.target.closest('[data-daily]')) daily(); };
      tutor({ sport, band: ageOf(r.age).band, mode: 'recap', q: { type: 'recap' }, summary: { right, of: r.log.length, byType: r.log, level: lv.name, likeness: lk.name } })
        .then(x => { const el = pb.querySelector('[data-r=recap]'); if (el && x && x.say) el.textContent = x.say + (x.tip ? ' Next time: ' + x.tip : ''); }).catch(() => {});
    }, 'ct-xl ct-iq');
    chime(lv.i > lv0.i ? 'level' : 'done');
    ctx.speak(`${IQ.name} ${Math.round(r.prof.iq)}. ${lv.i > lv0.i ? 'Level up: ' + lv.name + '!' : lv.name + '.'}${lk.name ? ' Plays like ' + lk.name + '.' : ''}`);
  }
  function runDone(r) {
    const sport = r.sport, IQ = sport.iq, ds = dailyStore(IQ.name), d = ds.get(), n = r.log.filter(x => x.right || x.partial).length, best = d.bestRun || 0, rec = n > best;
    if (rec) { d.bestRun = n; ds.put(d); }
    const dd = db.get(); if (dd.players[r.pi]) { const pl = dd.players[r.pi]; pl.fam = pl.fam || {}; pl.fam[IQ.name] = r.prof; db.put(dd); }
    award(r.log.length);
    ctx.track && ctx.track('iq_run', { n, record: rec ? 1 : 0 });
    const text = `${IQ.name} Streak Run: ${n} in a row ⚡${rec ? ' (a new best)' : ''}\nmutaafaziz.com/chalktalk?iq=1${sport.id !== 'basketball' ? '&sport=' + sport.id : ''}`;
    const body = `<div class="ct-iqend ct-iqdaily"><small class="ct-iqkick">${esc(IQ.name)} Streak Run</small>
      <div class="ct-iqbig"><span>${n}</span><small>${rec ? 'A new best!' : `in a row · best ${best}`}</small></div>
      <p class="ct-iqline">${n >= 10 ? 'That’s a coach’s eye.' : n >= 5 ? 'Seeing the floor.' : 'Shake it off. Again?'}</p>
      <div class="ct-iqagain"><button type="button" data-again="1" class="go">⚡ Run it back</button><button type="button" data-share="1">${icon('share')}<span>Share</span></button><button type="button" data-lobby="1">${esc(IQ.name)}</button></div></div>`;
    ctx.openPanel(IQ.name, body, pb => { pb.onclick = e => { if (e.target.closest('[data-again]')) streakRun(); if (e.target.closest('[data-share]')) share(text); if (e.target.closest('[data-lobby]')) open(); }; }, 'ct-xl ct-iq');
    chime(rec ? 'level' : 'done');
    ctx.speak(rec ? `${n} in a row. A new best.` : `${n} in a row.`);
  }
  function dailyDone(r) {
    const sport = r.sport, IQ = sport.iq, ds = dailyStore(IQ.name), d = ds.get(), day = dayNumber(), secs = (performance.now() - r.t) / 1000;
    const right = r.log.filter(x => x.right).length;
    if (!d.days[day]) { d.streak = d.last === day - 1 ? d.streak + 1 : 1; d.last = day; d.days[day] = { right, log: r.log, secs }; Object.keys(d.days).filter(k => +k < day - 60).forEach(k => delete d.days[k]); ds.put(d); }
    ctx.track && ctx.track('iq_daily', { right, of: r.log.length });
    award(r.log.length);
    ctx.changed && ctx.changed();
    const text = shareText(IQ.name, day, r.log, secs, d.streak, sport.id), verdict = right === r.log.length ? 'Perfect read.' : right >= r.log.length - 1 ? 'Sharp.' : right >= Math.ceil(r.log.length / 2) ? 'Solid.' : 'Tomorrow’s yours.';
    const sq = r.log.map(x => `<i class="${x.right ? (x.quick ? 'g' : 'y') : x.partial ? 'o' : 'k'}"></i>`).join('');
    const body = `<div class="ct-iqend ct-iqdaily"><small class="ct-iqkick">${esc(IQ.name)} Daily · #${day}</small>
      <div class="ct-iqbig"><span>${right}/${r.log.length}</span><small>${esc(verdict)}</small></div>
      <div class="ct-iqsq big">${sq}</div>
      <p class="ct-iqline">${Math.round(secs)} seconds${d.streak > 1 ? ` · 🔥 ${d.streak}-day streak` : ''} · 🟩 quick 🟨 right 🟧 open too ⬛ missed</p>
      <div class="ct-iqagain"><button type="button" data-share="1" class="go">${icon('share')}<span>Share my score</span></button><button type="button" data-quick="1">Quick five</button></div>
      <div class="ct-iqagain"><button type="button" data-run="1">⚡ Streak Run</button></div>
      <p class="ct-iqline">Next five in ${untilTomorrow()}. Come back to keep the streak.</p></div>`;
    ctx.openPanel(IQ.name + ' Daily', body, pb => {
      pb.onclick = e => { if (e.target.closest('[data-share]')) share(text); if (e.target.closest('[data-quick]')) start(you()); if (e.target.closest('[data-run]')) streakRun(); };
    }, 'ct-xl ct-iq');
    chime(right >= r.log.length - 1 ? 'level' : 'done');
    ctx.speak(`${right} of ${r.log.length}. ${verdict}`);
  }
  const doneToday = () => !!dailyStore(S().iq.name).today();
  return { open, daily, streakRun, doneToday, tick, wantsTap, wantsSpot, answer, active: () => !!run, stop: () => finish(true), destroy() { finish(true); hud.remove(); } };
}
