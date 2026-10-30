// Every rule hangs off .ct, so the board can live inside another app without touching it.
export const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@500;700;900&family=Atkinson+Hyperlegible:wght@400;700&family=Permanent+Marker&display=swap');
.ct {
  --night: #04070c; --deep: #0a1220; --ice: #8cbcff; --ice-dim: rgba(140, 188, 255, .14); --line: rgba(140, 188, 255, .22);
  --o: #ff8e3a; --x: #a9d4ff; --paper: #eef4ff; --mute: #8a9bb5; --glass: rgba(8, 14, 26, .66);
  --display: 'Big Shoulders Display', Impact, sans-serif; --body: 'Atkinson Hyperlegible', system-ui, sans-serif; --marker: 'Permanent Marker', cursive;
  position: relative; overflow: hidden; isolation: isolate; container-type: size; min-height: 520px;
  background: var(--night); color: var(--paper); font-family: var(--body); -webkit-font-smoothing: antialiased; line-height: 1.4;
}
.ct.ct-full { position: fixed; inset: 0; min-height: 0; }
.ct *, .ct *::before, .ct *::after { box-sizing: border-box; }
.ct::before { content: ''; position: absolute; inset: 0; pointer-events: none; z-index: 0;
  background: radial-gradient(60% 50% at 50% 58%, rgba(60, 110, 200, .16), transparent 70%), radial-gradient(30% 40% at 50% 8%, rgba(255, 142, 58, .06), transparent 70%); }
.ct::after { content: ''; position: absolute; inset: 0; pointer-events: none; opacity: .07; mix-blend-mode: overlay; z-index: 1;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E"); }
.ct button { font: inherit; color: inherit; background: none; border: 0; cursor: pointer; margin: 0; }
.ct h1, .ct h2, .ct h3, .ct p, .ct ul { margin: 0; }
.ct-stage { position: absolute; inset: 0; z-index: 1; }
.ct-court { position: absolute; inset: 0; width: 100%; height: 100%; display: block; }
.ct-ink, .ct-labels { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; overflow: visible; }
.ct.ct-sketch .ct-ink { pointer-events: auto; cursor: crosshair; touch-action: none; }

/* the whiteboard marks, drawn exactly on top of the light */
.ct-ink .r { fill: none; stroke-linecap: round; stroke-linejoin: round; }
.ct-ink .r.O { stroke: var(--o); } .ct-ink .r.D { stroke: var(--x); }
.ct-ink .r.pass, .ct-ink .r.shot { stroke: var(--paper); stroke-dasharray: 7 7; }
.ct-ink .r.handoff { stroke: var(--paper); }
.ct-ink .r.old { opacity: .38; }
.ct-ink .g { fill: rgba(4, 7, 12, .55); stroke-width: 2.6; }
.ct-ink .g.O { stroke: var(--o); } .ct-ink .g.D { stroke: var(--x); fill: none; stroke-width: 3; stroke-linecap: round; }
.ct-ink .g.hold { fill: rgba(255, 142, 58, .32); stroke-width: 3.4; filter: drop-shadow(0 0 6px rgba(255, 142, 58, .8)); }
.ct-ink .n { font-family: var(--display); font-weight: 900; text-anchor: middle; dominant-baseline: central; paint-order: stroke; stroke: rgba(4, 7, 12, .85); stroke-width: 3px; }
.ct-ink .n.O { fill: var(--o); } .ct-ink .n.D { fill: var(--x); }
.ct-ink .ball { fill: #ffb070; stroke: #6b2a00; stroke-width: 1.2; filter: drop-shadow(0 0 6px rgba(255, 142, 58, .9)); }
.ct-ink .shadow { fill: rgba(0, 0, 0, .45); }
.ct-ink .stroke { fill: none; stroke: #fff; stroke-width: 3; stroke-linecap: round; stroke-linejoin: round; opacity: .9; filter: drop-shadow(0 0 6px rgba(255, 255, 255, .6)); }
.ct-ink .hot { cursor: pointer; pointer-events: auto; fill: transparent; }

.ct-lbl { position: absolute; left: 0; top: 0; font-size: 11px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; line-height: 1; padding: 4px 7px 3px; border-radius: 6px;
  translate: -50% 0; background: rgba(4, 7, 12, .78); border: 1px solid var(--line); color: var(--paper); white-space: nowrap; will-change: transform; transition: background .3s, color .3s; }
.ct-lbl.O { border-color: rgba(255, 142, 58, .5); } .ct-lbl.D { border-color: rgba(169, 212, 255, .5); }
.ct-lbl.read { background: var(--o); color: var(--night); border-color: var(--o); box-shadow: 0 0 18px rgba(255, 142, 58, .7); }
.ct-lbl.empty { display: none; }
.ct-lbl.read.empty { display: block; }
.ct-edit { position: absolute; z-index: 8; translate: -50% 0; display: flex; gap: 6px; padding: 6px; border-radius: 10px; background: var(--deep); border: 1px solid var(--o); box-shadow: 0 10px 30px rgba(0, 0, 0, .5); }
.ct-edit input { width: 130px; height: 30px; border-radius: 7px; border: 1px solid var(--line); background: var(--night); color: var(--paper); padding: 0 8px; font: inherit; font-size: 13px; }
.ct-edit button { height: 30px; padding: 0 9px; border-radius: 7px; background: var(--o); color: var(--night); font-weight: 700; font-size: 12px; }
.ct-edit .chips { display: flex; gap: 4px; }
.ct-edit .chips button { background: var(--ice-dim); color: var(--paper); font-weight: 400; }

/* top bar */
.ct-top { position: absolute; top: 0; left: 0; right: 0; display: flex; align-items: center; gap: 8px; padding: 16px 22px 0; z-index: 4; pointer-events: none; }
.ct-top > * { pointer-events: auto; }
.ct-word { font-family: var(--display); font-weight: 900; font-size: 26px; letter-spacing: .06em; text-transform: uppercase; display: flex; align-items: baseline; gap: 10px; margin-right: 8px; }
.ct-word i { font-style: normal; color: var(--o); }
.ct-word small { font-family: var(--body); font-weight: 400; font-size: 12px; letter-spacing: .02em; text-transform: none; color: var(--mute); }
.ct-sp { flex: 1; }
.ct-pill { height: 34px; padding: 0 13px; border-radius: 17px; border: 1px solid var(--line) !important; background: var(--glass) !important; backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); font-size: 13px !important; display: inline-flex; align-items: center; gap: 7px; color: var(--paper); transition: border-color .2s, color .2s, background .2s; white-space: nowrap; }
.ct-pill:hover { border-color: var(--ice) !important; }
.ct-pill.off { color: var(--mute); }
.ct-pill.on { background: var(--o) !important; color: var(--night); border-color: var(--o) !important; font-weight: 700; }
.ct-keypill::before { content: ''; width: 7px; height: 7px; border-radius: 50%; background: var(--mute); }
.ct-keypill.set::before { background: #6ee7a8; box-shadow: 0 0 8px #6ee7a8; }
.ct-legend { position: absolute; left: 22px; bottom: 22px; z-index: 3; display: grid; gap: 6px; font-size: 12px; color: var(--mute); pointer-events: none; }
.ct-legend span { display: flex; align-items: center; gap: 8px; }
.ct-legend svg { width: 18px; height: 18px; overflow: visible; }

/* football tools */
.ct-ink .zone { fill: rgba(140, 188, 255, .07); stroke: rgba(140, 188, 255, .35); stroke-width: 1; stroke-dasharray: 5 5; }
.ct-ink .zl { fill: rgba(169, 212, 255, .7); font-size: 11px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; text-anchor: middle; }
.ct-ink .dim { fill: rgba(2, 4, 8, .5); }
.ct-ink .cone { fill: rgba(255, 238, 180, .16); stroke: rgba(255, 238, 180, .5); stroke-width: 1; }
.ct-ink .rd circle { stroke: var(--night); stroke-width: 2; fill: var(--mute); transition: fill .2s; }
.ct-ink .rd text { font-family: var(--display); font-weight: 900; font-size: 12px; fill: var(--night); text-anchor: middle; dominant-baseline: central; }
.ct-ink .rd.open circle { fill: #4ade80; } .ct-ink .rd.tight circle { fill: #facc15; } .ct-ink .rd.covered circle { fill: #f87171; }
.ct-ink .rd.now circle { stroke: #fff; stroke-width: 3; r: 11; }
.ct-fb { position: absolute; left: 22px; bottom: 22px; z-index: 4; display: grid; gap: 8px; padding: 12px; border-radius: 14px; background: var(--glass); border: 1px solid var(--line); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); width: 300px; }
.ct-fb[hidden] { display: none; }
.ct-fbrow { display: grid; gap: 5px; }
.ct-fbrow > span { font-family: var(--display); font-weight: 700; font-size: 11px; letter-spacing: .18em; text-transform: uppercase; color: var(--mute); }
.ct-fbrow > div { display: flex; flex-wrap: wrap; gap: 4px; }
.ct-fb button { height: 28px; padding: 0 9px; border-radius: 8px; border: 1px solid var(--line); font-size: 12.5px; }
.ct-fb button.on { background: var(--paper); color: var(--night); border-color: var(--paper); }
.ct-fb .ct-open { height: 34px; background: var(--o); color: var(--night); border-color: var(--o); font-weight: 700; font-size: 14px; }
.ct.ct-football .ct-legend { display: none; }
.ct.ct-football .ct-lib { bottom: 300px; }
.ct-tree { flex-wrap: wrap; width: 280px; translate: -50% 0; }
.ct-tree .ct-treehead { width: 100%; font-size: 12px; color: var(--mute); padding: 0 2px 2px; }
.ct-tree button { background: var(--ice-dim) !important; color: var(--paper) !important; font-weight: 400 !important; text-transform: capitalize; }
.ct-tree button i { font-style: normal; color: var(--o); font-weight: 700; margin-right: 5px; }
.ct-tree button:hover { background: var(--o) !important; color: var(--night) !important; }

/* sport switch */
.ct-sports { display: flex; gap: 4px; padding: 3px; border-radius: 20px; background: var(--glass); border: 1px solid var(--line); }
.ct-sports[hidden] { display: none; }
.ct-sports .ct-pill { height: 28px; border: 0 !important; background: none !important; padding: 0 12px; }
.ct-sports .ct-pill.on { background: var(--o) !important; color: var(--night); }
.ct-hint { color: var(--mute); font-size: .8em; }

/* concept library */
.ct-lib { position: absolute; left: 22px; top: 70px; bottom: 190px; display: flex; flex-direction: column; gap: 2px; z-index: 3; width: 200px; overflow-y: auto; scrollbar-width: none; }
.ct-lib::before { content: 'Concepts'; font-family: var(--display); font-weight: 700; text-transform: uppercase; letter-spacing: .18em; font-size: 12px; color: var(--mute); margin: 0 0 6px 12px; }
.ct-lib button { text-align: left; padding: 7px 12px; border-radius: 10px; font-family: var(--display); font-weight: 700; font-size: 18px; letter-spacing: .02em; line-height: 1.05; color: rgba(238, 244, 255, .78); border: 1px solid transparent; transition: background .2s, color .2s, border-color .2s; flex: none; }
.ct-lib button span { display: block; font-family: var(--body); font-weight: 400; font-size: 10.5px; letter-spacing: .08em; text-transform: uppercase; color: var(--mute); margin-bottom: 2px; }
.ct-lib button:hover { background: var(--ice-dim); color: var(--paper); }
.ct-lib button.on { background: var(--glass); border-color: rgba(255, 142, 58, .5); color: var(--paper); }
.ct-lib button.on span { color: var(--o); }

/* the play card */
.ct-card { position: absolute; right: 22px; top: 70px; width: 300px; max-height: calc(100cqh - 260px); overflow: auto; z-index: 3; padding: 18px 18px 16px; border-radius: 16px; background: var(--glass); border: 1px solid var(--line); backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); scrollbar-width: none; }
.ct-eyebrow { font-size: 11px; letter-spacing: .16em; text-transform: uppercase; color: var(--o); }
.ct-card h1 { font-family: var(--display); font-weight: 900; font-size: 34px; line-height: .95; margin: 6px 0 10px; text-transform: uppercase; letter-spacing: .01em; color: var(--paper); }
.ct-card p { font-size: 15px; line-height: 1.5; color: rgba(238, 244, 255, .86); }
.ct-card h2 { font-family: var(--display); font-weight: 700; font-size: 12px; letter-spacing: .18em; text-transform: uppercase; color: var(--mute); margin: 18px 0 8px; }
.ct-cues { list-style: none; padding: 0; display: flex; flex-wrap: wrap; gap: 6px; }
.ct-cues li { font-family: var(--marker); font-size: 15px; padding: 5px 10px 3px; border-radius: 8px; background: rgba(255, 142, 58, .1); color: var(--o); border: 1px dashed rgba(255, 142, 58, .35); }
.ct-reads { list-style: none; padding: 0; display: grid; gap: 6px; }
.ct-reads li { display: flex; gap: 10px; align-items: baseline; font-size: 14px; line-height: 1.35; color: rgba(238, 244, 255, .8); padding: 7px 9px; border-radius: 9px; border: 1px solid transparent; transition: background .4s, border-color .4s; transition-delay: calc(var(--i) * 120ms); }
.ct-reads li.lit { background: rgba(255, 142, 58, .1); border-color: rgba(255, 142, 58, .4); color: var(--paper); }
.ct-m { font-family: var(--display); font-weight: 900; letter-spacing: .02em; }
.ct-m.O { color: var(--o); } .ct-m.X { color: var(--x); }
.ct-ai { margin-top: 16px; padding: 12px; border-radius: 12px; border: 1px solid rgba(255, 142, 58, .45); background: linear-gradient(160deg, rgba(255, 142, 58, .12), rgba(255, 142, 58, .02)); }
.ct-ai[hidden] { display: none; }
.ct-ai .ct-like { font-size: 13px; color: var(--mute); }
.ct-ai .ct-like button { color: var(--o); font-weight: 700; text-decoration: underline; text-underline-offset: 3px; }
.ct-ai ul { padding-left: 18px; margin: 8px 0 0; font-size: 14px; line-height: 1.45; display: grid; gap: 4px; }
.ct-ai .ct-row { display: flex; gap: 8px; margin-top: 10px; }
.ct-ai .ct-row button { height: 32px; padding: 0 12px; border-radius: 9px; border: 1px solid var(--line); font-size: 13px; }
.ct-ai .ct-row button.go { background: var(--o); border-color: var(--o); color: var(--night); font-weight: 700; }

/* caption, transport, mic */
.ct-dock { position: absolute; left: 50%; bottom: 18px; translate: -50% 0; width: min(760px, calc(100% - 32px)); z-index: 4; display: grid; gap: 10px; justify-items: center; }
.ct-caption { min-height: 56px; width: 100%; font-size: clamp(16px, 2.3cqw, 22px); line-height: 1.35; text-align: center; padding: 10px 18px; border-radius: 14px; background: linear-gradient(180deg, transparent, rgba(4, 7, 12, .72)); text-wrap: balance; }
.ct-n { display: inline-grid; place-items: center; width: 26px; height: 26px; border-radius: 50%; margin-right: 10px; font-family: var(--display); font-weight: 900; font-size: 15px; background: var(--paper); color: var(--night); vertical-align: 2px; }
.ct-caption.end .ct-n { background: var(--o); }
.ct-transport { display: flex; align-items: center; gap: 10px; }
.ct-transport > button { width: 34px; height: 34px; border-radius: 50%; border: 1px solid var(--line); background: var(--glass); font-size: 12px; display: grid; place-items: center; }
.ct-transport > button:hover { border-color: var(--ice); }
.ct-transport > .ct-speed { width: auto; padding: 0 11px; border-radius: 17px; font-size: 13px; }
.ct-dots { display: flex; gap: 6px; padding: 0 6px; }
.ct-dots button { width: 26px; height: 6px; border-radius: 3px; background: var(--ice-dim); transition: background .3s, width .3s; }
.ct-dots button.past { background: rgba(140, 188, 255, .5); }
.ct-dots button.now { background: var(--o); width: 40px; box-shadow: 0 0 10px rgba(255, 142, 58, .6); }
.ct-talk { display: flex; align-items: center; gap: 12px; width: 100%; }
.ct-mic { flex: none; position: relative; width: 70px; height: 70px; border-radius: 50%; display: grid; place-items: center;
  background: radial-gradient(circle at 50% 40%, #ffb27a, var(--o) 45%, #a33d0a 100%) !important; box-shadow: 0 0 0 1px rgba(255, 190, 140, .6) inset, 0 10px 40px rgba(255, 142, 58, .35); transition: transform .2s; }
.ct-mic:hover { transform: scale(1.04); }
.ct-mic svg { width: 28px; height: 28px; fill: var(--night); }
.ct-mic::before, .ct-mic::after { content: ''; position: absolute; inset: -6px; border-radius: 50%; border: 2px solid rgba(255, 142, 58, .5); opacity: 0; }
.ct-mic[data-state=listening]::before, .ct-mic[data-state=hearing]::before { animation: ct-ring 1.4s ease-out infinite; }
.ct-mic[data-state=listening]::after, .ct-mic[data-state=hearing]::after { animation: ct-ring 1.4s .7s ease-out infinite; }
@keyframes ct-ring { from { opacity: .9; transform: scale(.95); } to { opacity: 0; transform: scale(1.6); } }
.ct-mic:disabled { filter: grayscale(1); opacity: .4; cursor: default; }
.ct-said { flex: 1; min-width: 0; display: grid; gap: 4px; }
.ct-heard { font-size: 14px; color: var(--mute); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-height: 18px; }
.ct-said form { display: flex; margin: 0; }
.ct-said input { flex: 1; min-width: 0; height: 44px; border-radius: 12px; border: 1px solid var(--line); background: var(--glass); color: var(--paper); padding: 0 14px; font: inherit; font-size: 15px; backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); }
.ct-said input:focus { outline: none; border-color: var(--o); }
.ct-said input::placeholder { color: var(--mute); }
.ct-status { font-size: 12px; color: var(--ice); min-height: 15px; }
.ct.ct-drawing .ct-status::before { content: ''; display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: var(--o); margin-right: 8px; animation: ct-blink .8s infinite alternate; }
@keyframes ct-blink { to { opacity: .2; } }

/* sketch mode */
.ct-sketchbar { position: absolute; top: 64px; left: 50%; translate: -50% 0; z-index: 5; display: none; align-items: center; gap: 8px; padding: 6px 6px 6px 14px; border-radius: 14px; background: var(--deep); border: 1px solid var(--o); box-shadow: 0 10px 30px rgba(0, 0, 0, .4); font-size: 13px; }
.ct.ct-sketch .ct-sketchbar { display: flex; }
.ct-sketchbar button { height: 30px; padding: 0 11px; border-radius: 8px; border: 1px solid var(--line); font-size: 13px; }
.ct-sketchbar button.on { background: var(--paper); color: var(--night); }
.ct-sketchbar button.go { background: var(--o); color: var(--night); border-color: var(--o); font-weight: 700; }
.ct.ct-sketch .ct-card, .ct.ct-sketch .ct-lib { opacity: .35; pointer-events: none; }

.ct-toast { position: absolute; top: 70px; left: 50%; translate: -50% -10px; opacity: 0; z-index: 9; padding: 10px 16px; border-radius: 12px; background: var(--paper); color: var(--night); font-size: 14px; max-width: calc(100% - 32px); transition: opacity .3s, translate .3s; pointer-events: none; }
.ct-toast.on { opacity: 1; translate: -50% 0; }
.ct-dlg { border: 1px solid var(--line); border-radius: 16px; background: var(--deep); color: var(--paper); padding: 22px; width: min(440px, calc(100vw - 32px)); font-family: var(--body); }
.ct-dlg::backdrop { background: rgba(2, 4, 8, .7); backdrop-filter: blur(4px); }
.ct-dlg h3 { font-family: var(--display); font-weight: 900; text-transform: uppercase; font-size: 26px; margin: 0 0 8px; }
.ct-dlg p { font-size: 14px; line-height: 1.5; color: rgba(238, 244, 255, .8); margin: 0 0 14px; }
.ct-dlg .ct-fine { font-size: 12.5px; color: var(--mute); margin: 6px 0 14px; }
.ct-dlg label { display: flex; justify-content: space-between; font-size: 13px; font-weight: 700; margin-bottom: 6px; }
.ct-dlg a { color: var(--ice); }
.ct-dlg input { width: 100%; height: 42px; border-radius: 10px; border: 1px solid var(--line); background: var(--night); color: var(--paper); padding: 0 12px; font: inherit; font-size: 14px; }
.ct-dlg menu { display: flex; justify-content: flex-end; gap: 8px; padding: 0; margin: 10px 0 0; }
.ct-dlg menu button { height: 38px; padding: 0 16px; border-radius: 10px; border: 1px solid var(--line); background: none; color: var(--paper); font: inherit; cursor: pointer; }
.ct-dlg menu button[value=save] { background: var(--o); color: #04070c; border-color: var(--o); font-weight: 700; }
.ct-badge { font-weight: 400; color: var(--mute); } .ct-badge.ok { color: #6ee7a8; } .ct-badge.bad { color: #ff9c8a; }
[data-r=infoBtn] { display: none !important; }

/* phones and narrow hosts: concepts become a strip, the card a sheet */
@container (max-width: 900px) {
  .ct-sports { order: 5; }
  [data-r=defBtn], [data-r=narrate] { display: none; }
  .ct-word small { display: none; }
  .ct-top { padding: 12px 12px 0; flex-wrap: wrap; }
  .ct-lib { top: 56px; bottom: auto; left: 0; right: 0; width: auto; flex-direction: row; overflow-x: auto; padding: 0 12px; }
  .ct-lib::before { display: none; }
  .ct-lib button { font-size: 15px; padding: 7px 11px; background: var(--glass); border-color: var(--line); white-space: nowrap; }
  .ct-lib button span { display: none; }
  .ct-card { top: auto; bottom: 0; right: 0; left: 0; width: auto; max-height: 70cqh; border-radius: 18px 18px 0 0; translate: 0 105%; transition: translate .35s cubic-bezier(.2, .8, .2, 1); z-index: 7; }
  .ct.ct-info .ct-card { translate: 0 0; }
  [data-r=infoBtn] { display: inline-flex !important; }
  .ct-mic { width: 58px; height: 58px; }
  .ct-legend { display: none; }
  .ct-fb { left: 8px; right: 8px; bottom: auto; top: 100px; width: auto; padding: 8px; gap: 5px; }
  .ct-fbrow { grid-template-columns: 74px 1fr; align-items: center; }
  .ct-sketchbar { top: 104px; }
}
@media (prefers-reduced-motion: reduce) { .ct *, .ct *::before, .ct *::after { animation: none !important; transition: none !important; } }
`;
