// Under the hood: how Chalk Talk uses AI, told as layers (ears → draft → engine → board → minds), with this
// device's own numbers and what stays private. It shows the shape of the system and hints at the craft; it never
// shows prompts, schemas, model routing, the engine's rules or tuning. Small "how" chips (howChip) sit where the
// AI does something (a play drawn, a phrase understood instantly, the IQ game, the booth) and open the matching
// layer. Own scoped <style>; ui.js hooks: createHow(...), a delegated [data-how] click, the control-center tile.

const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// the layers: what it does, the line to remember, and a hint (never the recipe)
export const LAYERS = [
  { id: 'ears', n: '01', name: 'The ears', line: 'Most of what you say never reaches an AI.',
    body: 'Your words go through a coaching vocabulary first: play names, positions, spots, the commands you use at practice. When it knows the play, it draws it on your device, instantly, for free. It learns the phrases you keep.',
    hint: 'It knows “Spain”, “pistol” and “get” are basketball, not a country, a gun or a fetch.' },
  { id: 'draft', n: '02', name: 'The draft', line: 'When it does ask an AI, it asks in our language.',
    body: 'The AI never draws pixels. It writes a draft in a compact play language: spots, steps, who does what to whom. Small enough to be fast, strict enough to check, and the same language whichever AI you use.',
    hint: 'The language is the trick. We didn’t teach the AI basketball; we taught it how we write a play down.' },
  { id: 'engine', n: '03', name: 'The engine', line: 'The AI drafts. The engine decides.',
    body: 'Every draft is played out before you see it: spacing, timing, screens and handoffs, passes that have to get there, and a defense that reacts. A draft that doesn’t hold together goes back with notes. What reaches your board has already been run.',
    hint: 'Defenders get screened, beaten and caught ball-watching by rules we tuned by hand, one bad clip at a time.' },
  { id: 'board', n: '04', name: 'The board and the booth', line: 'It explains what happened, not what sounds good.',
    body: 'The play draws itself in light. The analyst’s voice is written from what the engine saw on each step: who got screened, who’s open and by how much. An AI adds the colour; the facts come from the engine.',
    hint: 'That’s why the booth can say “a step late” and be right about it.' },
  { id: 'minds', n: '05', name: 'The minds', line: 'Every player can think for themselves.',
    body: 'Turn on smart players or the film room and each position gets its own small brain, all thinking at once. The engine merges their ideas one by one and drops any that would break the play.',
    hint: 'Ten opinions, one referee.' },
  { id: 'iq', n: '06', name: 'The game', line: 'Every answer in the IQ game is the engine’s, not a guess.',
    body: 'Questions are cut from real plays and from situations the engine makes up on the spot: it plays the action out against its own defense and asks you to find whoever it says is open. Only clear reads make the cut.',
    hint: 'Thousands of questions, and most of them no person ever wrote.' }
];
export const PRIVATE = [
  ['Names stay here', 'Player names live on this device. The AI sees X’s and O’s.'],
  ['Your key, your provider', 'A key you add goes from your browser to that company only.'],
  ['Counted, not read', 'Usage numbers never include your words, names, keys or IP address.']
];

// this device's numbers: how much was understood instantly, how long the AI takes when it's asked
export function numbers(log, meter) {
  const said = (log || []).filter(r => r && r.ok !== false && r.path);
  const instant = said.filter(r => r.path !== 'ai' && r.path !== 'sketch').length;
  const ai = (meter || []).filter(r => r && r.ok && (r.task === 'play' || r.task === 'sketch') && r.ms > 0).map(r => r.ms).sort((a, b) => a - b);
  const cached = (meter || []).filter(r => r && (r.provider === 'cache' || r.model === 'cache') && (r.task === 'play' || r.task === 'sketch' || r.task == null)).length;
  return { said: said.length, instant, pct: said.length ? Math.round(instant / said.length * 100) : null, aiMs: ai.length ? ai[Math.floor(ai.length / 2)] : null, aiN: ai.length, cached };
}

export const howChip = (id, label) => `<button type="button" class="ct-how" data-how="${esc(id)}" aria-label="How this works">✦ ${esc(label || 'how')}</button>`;

const CSS = `
.ct-how { display: inline-flex; align-items: center; gap: 3px; margin-left: 6px; padding: 1px 8px 2px; border-radius: 10px; border: 1px solid rgba(255, 199, 90, .45) !important; background: rgba(255, 199, 90, .08); color: var(--gold, #ffc75a); font: 700 11px/1.5 var(--body, system-ui), sans-serif; letter-spacing: .02em; cursor: pointer; vertical-align: 1px; white-space: nowrap; }
.ct-how:hover { background: rgba(255, 199, 90, .18); }
.ct-hw { display: grid; gap: 18px; }
.ct-hwhead small { font: 700 12px/1 var(--display); letter-spacing: .2em; text-transform: uppercase; color: var(--gold, #ffc75a); }
.ct-hwhead h3 { margin: 8px 0 6px; font: 900 clamp(30px, 6vw, 44px)/.95 var(--display); text-transform: uppercase; letter-spacing: .01em; }
.ct-hwhead h3 em { font-style: normal; color: var(--o, #ff8e3a); }
.ct-hwhead p { margin: 0; color: var(--mute); font-size: 14.5px; max-width: 58ch; }
.ct-hwrail { position: relative; display: grid; gap: 10px; padding-left: 34px; }
.ct-hwrail::before { content: ''; position: absolute; left: 13px; top: 18px; bottom: 18px; width: 2px; background: linear-gradient(var(--o, #ff8e3a), rgba(140, 188, 255, .6), rgba(74, 222, 128, .6)); opacity: .55; border-radius: 2px; }
.ct-hwrail::after { content: ''; position: absolute; left: 9px; top: 18px; width: 10px; height: 10px; border-radius: 50%; background: #fff; box-shadow: 0 0 0 4px rgba(255, 142, 58, .35), 0 0 22px 6px rgba(255, 199, 90, .7); animation: ct-hwpacket 6s cubic-bezier(.6, 0, .4, 1) infinite; }
@keyframes ct-hwpacket { 0% { top: 18px; opacity: 0; } 6% { opacity: 1; } 94% { opacity: 1; } 100% { top: calc(100% - 28px); opacity: 0; } }
.ct-hwl { position: relative; display: grid; gap: 4px; padding: 14px 16px 14px; border-radius: 16px; border: 1px solid var(--line); background: rgba(140, 188, 255, .04); scroll-margin: 20px; transition: border-color .3s, background .3s; }
.ct-hwl::before { content: attr(data-n); position: absolute; left: -34px; top: 12px; width: 28px; height: 28px; display: grid; place-items: center; border-radius: 50%; background: var(--night, #04070c); border: 2px solid rgba(255, 142, 58, .7); font: 900 11px/1 var(--display); color: var(--o, #ff8e3a); }
.ct-hwl.hot { border-color: rgba(255, 199, 90, .7); background: rgba(255, 199, 90, .07); }
.ct-hwl.hot::before { background: var(--o, #ff8e3a); color: var(--night, #04070c); box-shadow: 0 0 18px rgba(255, 142, 58, .6); }
.ct-hwl small { font: 700 11px/1 var(--display); letter-spacing: .16em; text-transform: uppercase; color: var(--mute); }
.ct-hwl b { font: 900 20px/1.1 var(--display); text-transform: uppercase; letter-spacing: .01em; }
.ct-hwl p { margin: 2px 0 0; font-size: 14px; color: var(--paper); opacity: .86; }
.ct-hwl i { display: block; margin-top: 4px; font-size: 13px; font-style: italic; color: var(--gold, #ffc75a); }
.ct-hwl i::before { content: '✦ '; font-style: normal; }
.ct-hwnums { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.ct-hwnums div { padding: 12px; border-radius: 14px; border: 1px solid var(--line); text-align: center; }
.ct-hwnums b { display: block; font: 900 30px/1 var(--display); color: var(--o, #ff8e3a); }
.ct-hwnums small { display: block; margin-top: 4px; font-size: 11.5px; color: var(--mute); line-height: 1.3; }
.ct-hwpriv { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.ct-hwpriv div { padding: 12px; border-radius: 14px; background: rgba(74, 222, 128, .06); border: 1px solid rgba(74, 222, 128, .28); }
.ct-hwpriv b { display: block; font-size: 13.5px; } .ct-hwpriv small { font-size: 12px; color: var(--mute); line-height: 1.35; }
.ct-hwh { margin: 0; font: 900 14px/1 var(--display); letter-spacing: .14em; text-transform: uppercase; color: var(--mute); }
.ct-hwsauce { padding: 14px 16px; border-radius: 16px; border: 1px dashed rgba(255, 199, 90, .5); font-size: 13.5px; color: var(--mute); }
.ct-hwsauce b { color: var(--paper); }
@media (max-width: 560px) { .ct-hwnums, .ct-hwpriv { grid-template-columns: 1fr; } }
@media (prefers-reduced-motion: reduce) { .ct-hwrail::after { animation: none; display: none; } }
.ct.ct-light .ct-hwl { background: rgba(16, 26, 43, .03); } .ct.ct-light .ct-hwl i, .ct.ct-light .ct-hwhead small, .ct.ct-light .ct-how { color: #b7791f; }
`;

export function createHow(ctx) {
  let styleEl = null;
  const style = () => { if (!styleEl) { styleEl = document.createElement('style'); styleEl.dataset.chalkTalkHow = ''; styleEl.textContent = CSS; document.head.appendChild(styleEl); } };
  style();   // the chips appear around the board before the explainer is ever opened
  function open(focus) {
    style();
    const N = numbers(ctx.log(), ctx.meter());
    const nums = `<div class="ct-hwnums">
      <div><b>${N.pct == null ? '—' : N.pct + '%'}</b><small>${N.said ? `of what you’ve said was understood instantly, no AI` : 'understood instantly, once you start talking'}</small></div>
      <div><b>${N.aiMs == null ? '—' : (N.aiMs / 1000).toFixed(1) + 's'}</b><small>${N.aiN ? 'typical time when an AI drew it' : 'typical AI draw, once you ask for one'}</small></div>
      <div><b>${N.cached}</b><small>plays someone had already asked for: instant, free</small></div></div>`;
    const body = `<div class="ct-hw">
      <div class="ct-hwhead"><small>Under the hood</small><h3>Not a chatbot <em>that draws.</em></h3>
        <p>Chalk Talk is a coach’s brain in layers. AI is one of them, and it never gets the last word: what you see has been understood, drafted, checked and played out before it reaches the board.</p></div>
      <div class="ct-hwrail">${LAYERS.map(l => `<section class="ct-hwl${l.id === focus ? ' hot' : ''}" data-n="${l.n}" data-layer="${l.id}"><small>${esc(l.name)}</small><b>${esc(l.line)}</b><p>${esc(l.body)}</p><i>${esc(l.hint)}</i></section>`).join('')}</div>
      <h4 class="ct-hwh">On this device</h4>${nums}
      <h4 class="ct-hwh">What stays yours</h4><div class="ct-hwpriv">${PRIVATE.map(([t, s]) => `<div><b>${esc(t)}</b><small>${esc(s)}</small></div>`).join('')}</div>
      <p class="ct-hwsauce"><b>What we don’t show:</b> the play language, the prompts, which AI gets which job, and the small rules that make a defender a step late. That’s the playbook. Everything above is what it does for you.</p>
    </div>`;
    ctx.openPanel('How Chalk Talk uses AI', body, pb => {
      const hot = focus && pb.querySelector(`[data-layer="${focus}"]`);
      if (hot) requestAnimationFrame(() => hot.scrollIntoView({ block: 'center', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }));
    }, 'ct-xl ct-howp');
    ctx.track && ctx.track('how_open', { at: focus || 'menu' });
  }
  return { open, destroy() { if (styleEl) { styleEl.remove(); styleEl = null; } } };
}
