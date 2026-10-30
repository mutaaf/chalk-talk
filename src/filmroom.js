// The film room: every player on the board gets a card, and every card opens into a full breakdown
// of that position in this play: its move on the mini board, what its AI brain sees, the risk and the
// cue, what it does beat by beat (with "Watch it"), and the position's reads, do's and don'ts.
// It opens instantly from the engine's own read; each brain's take fills in as it answers.

import { icon } from './icons.js';
import { miniBoard, playerFor, storyOf } from './guide.js';
import { filmFor, brainFor } from './ai.js';

const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const cache = new Map();   // play → { id: note }

// the guide position a player on the board plays
function positionOf(sport, play, p) {
  return (sport.positions || []).find(pos => { const q = playerFor(sport, play, pos); return q && q.id === p.id; })
    || (sport.positions || []).find(pos => pos.side === p.side && (pos.id === p.role || (p.side === 'D' && sport.los == null && pos.id === (p.id === 'X1' ? 'X1' : 'X3'))));
}

// ctx: { sport, play, sim, raw, openPanel, posName, mark, watch(id, beat), say(text), band, booth }
export function openFilm(ctx, startId) {
  const S = ctx.sport, play = ctx.play, sim = ctx.sim;
  const ids = play.players.filter((p, i) => p.side === 'O' || sim.match[i] >= 0 || sim.job[i]).map(p => p.id).slice(0, 10);
  const key = JSON.stringify(ctx.raw.beats) + ':' + ids.join(',');
  const notes = cache.get(key) || {}; cache.set(key, notes);
  const pending = new Set(); let down = null;   // why the brains couldn't answer, if they couldn't
  // no AI: say so plainly and offer the ways to connect it (your own key, or the host's subscription)
  const connect = () => down && !Object.keys(notes).length ? `<div class="ct-fconnect">${icon('brain')}<div><b>${esc(down)}</b>
      <p>You're seeing the engine's instant read. Connect AI and every position gets its own brain: what it sees, the risk, and the cue for a kid in that spot.</p>
      <div class="ct-fcbtns"><button type="button" class="go" data-b="key">${icon('key')}<span>Connect your Claude or OpenAI key</span></button>
      ${ctx.upgrade ? `<button type="button" class="pro" data-b="pro">${icon('sparkle')}<span>${esc(ctx.upgrade.label || 'Get unlimited AI')}</span></button>` : ''}</div>
      ${ctx.upgrade && ctx.upgrade.note ? `<small>${esc(ctx.upgrade.note)}</small>` : '<small>Your key stays in this browser and goes only to Claude or OpenAI.</small>'}</div></div>` : '';
  const local = id => {
    const p = play.players.find(q => q.id === id), pos = positionOf(S, play, p), st = storyOf(play, id), i = sim.idx[id];
    const catches = []; play.beats.forEach((b, k) => b.actions.forEach(a => { if (a.target === id && S.kinds[a.kind].type === 'pass' && a.kind !== 'snap') catches.push({ k, space: sim.space(k + 0.94, i) }); }));
    const beaten = sim.beaten.some(bk => bk[i]);
    return { pos, story: st, catches, beaten,
      read: st.length ? st.map(s => s.text).join(' ') : p.side === 'O' ? 'Spaces the floor and reads the ball.' : 'Guards the play and reacts to the ball.',
      risk: pos ? pos.donts[0] : '', tip: pos ? pos.cue : '' };
  };
  const card = (id, n) => {
    const p = play.players.find(q => q.id === id), L = local(id), ai = notes[id], brain = brainFor(S, play, id).name;
    return `<button type="button" class="ct-fcard ${p.side}${ai ? ' ai' : ''}" data-id="${esc(id)}" style="--i:${n}">
      <span class="ct-fhead"><b class="ct-m ${p.side === 'O' ? 'O' : 'X'}">${esc(ctx.posName(id))}</b><span>${esc(L.pos ? L.pos.name : brain)}</span><i class="ct-fsrc">${ai ? icon('brain') + 'AI brain' : pending.has(id) ? '<i class="ct-spin"></i>thinking' : 'Instant read'}</i></span>
      <p>${ai ? '“' + esc(ai.read) + '”' : ctx.mark(L.read)}</p>
      <span class="ct-fmeta">${ai ? `<em>⚠ ${esc(ai.risk)}</em><strong>${esc(ai.tip)}</strong>` : `<em>${L.risk ? '⚠ ' + esc(L.risk) : ''}</em><strong>${esc(L.tip)}</strong>`}</span>
      ${L.catches.length ? `<span class="ct-fstat">${L.catches.map(c => `Catch, beat ${c.k + 1}: ${c.space >= 99 ? 'unguarded' : c.space.toFixed(1) + ' ' + S.unit + ' of space'}`).join(' · ')}</span>` : L.beaten ? '<span class="ct-fstat bad">Beaten on the play</span>' : ''}
    </button>`;
  };
  const grid = () => connect() + `<p class="ct-glede"><b>${esc(play.title)}</b>. Every position's brain watches the play. Tap a player for the full breakdown.</p>
    <div class="ct-fgrid">${ids.map(card).join('')}</div>`;
  const detail = id => {
    const p = play.players.find(q => q.id === id), L = local(id), ai = notes[id], brain = brainFor(S, play, id), pos = L.pos, n = ids.indexOf(id);
    const band = ctx.band || 'young';
    return `<div class="ct-fdeep ${p.side}">
      <button type="button" class="ct-gback" data-b="back">${icon('undo')}<span>All players</span></button>
      <div class="ct-ghero">${pos ? miniBoard(S, pos, { anim: true }) : ''}
        <div><div class="ct-gkick"><b class="ct-m ${p.side === 'O' ? 'O' : 'X'}">${esc(ctx.posName(id))}</b>${esc(pos ? pos.nick : '')}</div>
          <h5>${esc(pos ? pos.name : ctx.posName(id))}</h5>
          <div class="ct-fbrain">${icon('brain')}<div><b>${esc(brain.name)}</b><small>${esc(brain.instincts)}</small></div></div>
          <div class="ct-fbtns"><button type="button" class="ct-gwatch" data-b="watch" data-id="${esc(id)}">${icon('view')}<span>Watch ${esc(ctx.posName(id))}</span></button>
          <button type="button" class="ct-gsay" data-b="say" data-id="${esc(id)}" aria-label="Hear it">${icon('speaker')}</button></div></div></div>
      <div class="ct-fsee">
        ${connect()}<section class="ct-fq"><h6>What I see</h6><p>${ai ? '“' + esc(ai.read) + '”' : pending.has(id) ? '<i class="ct-spin"></i> The brain is watching…' : ctx.mark(L.read)}</p></section>
        <section class="ct-fq risk"><h6>What could go wrong</h6><p>${esc(ai ? ai.risk : L.risk)}</p></section>
        <section class="ct-fq cue"><h6>The cue</h6><p>${esc(ai ? ai.tip : L.tip)}</p></section>
      </div>
      ${L.story.length ? `<section class="ct-gstory"><h6>Beat by beat</h6><ol>${L.story.map(s => `<li><button type="button" data-b="beat" data-k="${s.beat}" data-id="${esc(id)}"><span class="ct-n">${s.beat + 1}</span>${ctx.mark(s.text)}</button>${ctx.booth && ctx.booth[s.beat] ? `<small class="ct-fbooth">${ctx.mark(ctx.booth[s.beat])}</small>` : ''}</li>`).join('')}</ol></section>` : ''}
      ${L.catches.length ? `<div class="ct-tiles">${L.catches.map(c => `<div class="ct-tile"><small>Catch · beat ${c.k + 1}</small><b>${c.space >= 99 ? '∞' : c.space.toFixed(1)}</b><span>${S.unit} to the nearest defender${c.space >= S.open ? ' · open' : ' · covered'}</span></div>`).join('')}</div>` : ''}
      ${pos ? `<div class="ct-gcols"><section><h6>What to read</h6><ol class="ct-gsee">${pos.sees.map(x => `<li>${esc(x)}</li>`).join('')}</ol></section>
        <section><h6>Do this</h6><ul class="ct-gdo">${pos.does.map(x => `<li>${esc(x)}</li>`).join('')}</ul><h6>Not that</h6><ul class="ct-gdont">${pos.donts.map(x => `<li>${esc(x)}</li>`).join('')}</ul></section></div>
        <section class="ct-gage"><h6>Say it to a kid (${band === 'young' ? '6–11' : band === 'mid' ? '12–14' : '15+'})</h6><p>${esc(pos.ages[band])}</p></section>` : ''}
      <nav class="ct-gnav">${n > 0 ? `<button type="button" data-id="${esc(ids[n - 1])}" data-b="go">← ${esc(ctx.posName(ids[n - 1]))}</button>` : '<span></span>'}${n < ids.length - 1 ? `<button type="button" data-id="${esc(ids[n + 1])}" data-b="go">${esc(ctx.posName(ids[n + 1]))} →</button>` : ''}</nav>
    </div>`;
  };
  let view = startId || null, pb = null;
  const redraw = keep => { if (!pb || !pb.isConnected) return; const y = pb.scrollTop; pb.innerHTML = view ? detail(view) : grid(); if (keep) pb.scrollTop = y; };
  ctx.openPanel('Film room · ' + play.title, view ? detail(view) : grid(), body => {
    pb = body;
    pb.onclick = e => {
      const t = e.target.closest('[data-b],[data-id]'); if (!t) return;
      const b = t.dataset.b;
      if (!b && t.classList.contains('ct-fcard')) { view = t.dataset.id; redraw(); pb.scrollTop = 0; return; }
      if (b === 'back') { view = null; redraw(); return; }
      if (b === 'go') { view = t.dataset.id; redraw(); pb.scrollTop = 0; return; }
      if (b === 'key') ctx.connectAI();
      if (b === 'pro') ctx.upgradeAI();
      if (b === 'watch') ctx.watch(t.dataset.id);
      if (b === 'beat') ctx.watch(t.dataset.id, +t.dataset.k);
      if (b === 'say') { const ai = notes[t.dataset.id], L = local(t.dataset.id); ctx.say(ai ? `${ai.read} Watch out: ${ai.risk} The cue: ${ai.tip}` : `${L.read} The cue: ${L.tip}`); }
    };
  }, 'ct-xl ct-filmp');
  // the brains, all at once; each card fills in as its brain answers
  ids.filter(id => !notes[id]).forEach(id => {
    pending.add(id);
    filmFor(ctx.strip, id, { sport: S }).then(n => { if (n) notes[id] = n; })
      .catch(e => { if (e.name === 'AbortError') return; down = e.code === 'nokey' ? 'Connect AI to wake the brains.' : e.status === 429 ? 'The free AI is resting for today.' : 'The brains are offline right now.'; })
      .finally(() => { pending.delete(id); redraw(true); });
  });
  redraw(true);
}
