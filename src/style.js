// Every rule hangs off .ct, so the board can live inside another app without touching it.
export const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@500;700;900&family=Atkinson+Hyperlegible:wght@400;700&family=Permanent+Marker&display=swap');
.ct {
  --night: #04070c; --deep: #0a1220; --ice: #8cbcff; --ice-dim: rgba(140, 188, 255, .14); --line: rgba(140, 188, 255, .22);
  --o: #ff8e3a; --x: #a9d4ff; --paper: #eef4ff; --mute: #8a9bb5; --glass: rgba(8, 14, 26, .66);
  --gold: #ffc75a; --violet: #b89cff; --good: #6ee7a8; --bad: #ff9c8a; --hi: #ffd166;
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
.ct [hidden] { display: none !important; }
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
.ct-ink .r.a1 { opacity: .32; }
.ct-ink .r.a2 { opacity: .16; stroke-dasharray: 1 7; }
.ct-ink .r.recap { opacity: .26; }
.ct-ink .r.auto { stroke-dasharray: 2 6; }
.ct-ink .eye { stroke-width: 2.2; stroke-linecap: round; opacity: .9; }
.ct-ink .eye.O { stroke: var(--o); } .ct-ink .eye.D { stroke: var(--x); }
.ct-ink .g.smart { stroke-dasharray: 4 3; filter: drop-shadow(0 0 7px rgba(160, 120, 255, .9)); }
.ct-ink .g.open { stroke: #4ade80; filter: drop-shadow(0 0 8px rgba(74, 222, 128, .85)); }
.ct-wrong { display: inline-block; margin-left: 6px; padding: 2px 9px; border-radius: 8px; background: #4ade80; color: #04140a; font-size: .8em; font-weight: 700; }
.ct-ink .g.hover { stroke: #fff; stroke-width: 3.6; }
.ct-think { position: absolute; left: 0; top: 0; translate: -50% -100%; max-width: 190px; padding: 5px 9px; border-radius: 10px 10px 10px 2px; font-size: 11.5px; line-height: 1.3;
  background: rgba(238, 244, 255, .94); color: #0a1220; box-shadow: 0 6px 20px rgba(0, 0, 0, .35); opacity: 0; transition: opacity .3s; pointer-events: none; white-space: normal; will-change: transform; }
.ct-think.on { opacity: 1; }
.ct-think.D { background: rgba(169, 212, 255, .95); }
.ct-brain { display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: var(--violet); box-shadow: 0 0 8px var(--violet); margin-right: 5px; vertical-align: 1px; }
.ct-lbl.name { text-transform: none; letter-spacing: .02em; font-size: 12px; background: rgba(255, 142, 58, .18); border-color: rgba(255, 142, 58, .6); }
.ct-edrow { width: 100%; display: flex; gap: 6px; }
.ct-edrow input { flex: 1; width: auto !important; }
.ct-edrow button { background: rgba(180, 140, 255, .18) !important; color: var(--paper) !important; font-weight: 400 !important; }
.ct-edit { flex-wrap: wrap; max-width: 330px; }
.ct-view { position: absolute; top: 60px; right: 22px; z-index: 6; width: 290px; display: grid; gap: 8px; padding: 12px; border-radius: 14px; background: var(--deep); border: 1px solid var(--line); box-shadow: 0 12px 34px rgba(0, 0, 0, .45); }
.ct-view[hidden] { display: none; }
.ct-vrow { display: flex; align-items: center; gap: 5px; }
.ct-vrow span { width: 44px; font-size: 11px; letter-spacing: .14em; text-transform: uppercase; color: var(--mute); font-family: var(--display); font-weight: 700; }
.ct-vrow button { height: 30px; padding: 0 10px; border-radius: 8px; border: 1px solid var(--line); font-size: 13px; flex: 1; }
.ct-lock { height: 36px; border-radius: 10px; border: 1px solid var(--o) !important; color: var(--o); font-weight: 700; }
.ct-lock.on { background: var(--o) !important; color: var(--night); }
.ct-view .ct-fine { font-size: 12px; color: var(--mute); }
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
.ct-pill { height: 34px; padding: 0 12px; border-radius: 17px; border: 1px solid var(--line) !important; background: var(--glass) !important; backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); font-size: 13px !important; display: inline-flex; align-items: center; gap: 7px; color: var(--paper); transition: border-color .2s, color .2s, background .2s; white-space: nowrap; }
.ct-pill:hover { border-color: var(--ice) !important; }
.ct-pill.off { color: var(--mute); }
.ct-pill.on { background: var(--o) !important; color: var(--night); border-color: var(--o) !important; font-weight: 700; }
.ct-keypill::before { content: ''; width: 7px; height: 7px; border-radius: 50%; background: var(--mute); order: 3; }
.ct-keypill.set::before { background: var(--good); box-shadow: 0 0 8px var(--good); }
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

/* icons */
.ct-i { width: 16px; height: 16px; flex: none; }
.ct-pill .ct-i { width: 15px; height: 15px; }
.ct-pill.on .ct-i, .ct-pill:not(.off) .ct-i { opacity: .95; }

/* panels: always in bounds, titled, closable */
.ct-panel { position: absolute; z-index: 20; width: 320px; max-width: calc(100% - 24px); overflow: auto; border-radius: 14px; background: var(--deep); border: 1px solid var(--line);
  box-shadow: 0 18px 50px rgba(0, 0, 0, .55); animation: ct-pop .16s ease-out; overscroll-behavior: contain; }
.ct-panel.ct-wide { width: 360px; }
@keyframes ct-pop { from { opacity: 0; transform: translateY(4px) scale(.98); } }
.ct-panel > header { position: sticky; top: 0; display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 10px 10px 8px 14px; background: var(--deep); border-bottom: 1px solid var(--line); z-index: 1; }
.ct-panel h4 { margin: 0; font-family: var(--display); font-weight: 700; font-size: 15px; letter-spacing: .06em; text-transform: uppercase; }
.ct-x { width: 32px; height: 32px; border-radius: 9px; display: grid; place-items: center; color: var(--mute); flex: none; }
.ct-x:hover { background: var(--ice-dim); color: var(--paper); }
.ct-x .ct-i { width: 18px; height: 18px; }
.ct-pbody { padding: 12px 14px 14px; display: grid; gap: 10px; }
.ct-panel.sheet { left: 0 !important; right: 0; bottom: 0; top: auto !important; width: auto; max-width: none; max-height: 72%; border-radius: 18px 18px 0 0; animation: ct-sheet .22s cubic-bezier(.2, .8, .2, 1); padding-bottom: env(safe-area-inset-bottom); }
.ct-panel.sheet > header::before { content: ''; position: absolute; left: 50%; top: 5px; width: 40px; height: 4px; border-radius: 2px; background: var(--line); translate: -50% 0; }
@keyframes ct-sheet { from { transform: translateY(100%); } }
.ct-form { display: grid; gap: 7px; }
.ct-form label { font-size: 12px; font-weight: 700; color: var(--paper); }
.ct-form label small { font-weight: 400; color: var(--mute); margin-left: 4px; }
.ct-form input { width: 100%; height: 38px; border-radius: 9px; border: 1px solid var(--line); background: var(--night); color: var(--paper); padding: 0 11px; font: inherit; font-size: 14px; }
.ct-form input:focus { outline: none; border-color: var(--o); }
.ct-row { display: flex; gap: 6px; }
.ct-row .go, .ct-pbody .go { height: 38px; padding: 0 14px; border-radius: 9px; background: var(--o); color: var(--night); font-weight: 700; flex: none; }
.ct-chips { display: flex; flex-wrap: wrap; gap: 5px; }
.ct-chips button { height: 28px; padding: 0 10px; border-radius: 8px; background: var(--ice-dim); font-size: 12.5px; }
.ct-chips button:hover { background: rgba(140, 188, 255, .26); }
.ct-brains { display: grid; gap: 6px; padding-top: 4px; border-top: 1px solid var(--line); }
.ct-brains button { display: flex; align-items: center; gap: 8px; height: 36px; padding: 0 12px; border-radius: 9px; background: rgba(180, 140, 255, .14); border: 1px solid rgba(180, 140, 255, .35) !important; font-size: 13px; text-align: left; }
.ct-brains button:hover { background: rgba(180, 140, 255, .24); }
.ct-brains .ct-i { color: #c4a6ff; }
.ct-tree { display: grid; grid-template-columns: repeat(3, 1fr); gap: 5px; }
.ct-tree button { height: 34px; border-radius: 8px; background: var(--ice-dim); font-size: 13px; text-transform: capitalize; display: flex; align-items: center; gap: 6px; padding: 0 9px; }
.ct-tree button i { font-style: normal; color: var(--o); font-weight: 700; width: 12px; }
.ct-tree button:hover { background: var(--o); color: var(--night); }
.ct-tree button:hover i { color: var(--night); }
.ct-seg { display: flex; align-items: center; gap: 5px; }
.ct-seg span { width: 46px; font-size: 11px; letter-spacing: .14em; text-transform: uppercase; color: var(--mute); font-family: var(--display); font-weight: 700; }
.ct-seg button { flex: 1; height: 32px; border-radius: 8px; border: 1px solid var(--line) !important; font-size: 13px; }
.ct-seg button:hover { border-color: var(--ice) !important; }
.ct-lock { display: flex; align-items: center; justify-content: center; gap: 8px; height: 38px; border-radius: 10px; border: 1px solid var(--o) !important; color: var(--o); font-weight: 700; }
.ct-lock.on { background: var(--o) !important; color: var(--night); }
.ct-pbody .ct-fine { font-size: 12px; color: var(--mute); margin: 0; }
.ct-dlghead { display: flex; align-items: center; justify-content: space-between; margin: -6px -6px 6px 0; }
.ct-dlghead h3 { margin: 0 !important; }
.ct-dlg { max-height: calc(100dvh - 32px); overflow: auto; }
.ct-cardx { position: absolute; top: 8px; right: 8px; display: none; }
@container (max-width: 900px) { .ct-cardx { display: grid; } }

/* sketch */
.ct-sketchbar { flex-wrap: wrap; justify-content: center; max-width: calc(100% - 24px); gap: 8px !important; padding: 8px !important; }
.ct-tools { display: flex; gap: 3px; padding: 3px; border-radius: 10px; background: var(--night); }
.ct-tools button { height: 32px; padding: 0 9px; border-radius: 7px; border: 0 !important; display: flex; align-items: center; gap: 5px; font-size: 12.5px; color: var(--mute); }
.ct-tools button.on { background: var(--paper) !important; color: var(--night); }
.ct-together { display: flex; align-items: center; gap: 6px; font-size: 12.5px; color: var(--paper); cursor: pointer; }
.ct-together input { accent-color: var(--o); }
.ct-steps { display: flex; gap: 5px; overflow-x: auto; max-width: 420px; scrollbar-width: none; }
.ct-step { flex: none; display: flex; align-items: center; gap: 6px; height: 30px; padding: 0 4px 0 8px; border-radius: 8px; background: var(--ice-dim); font-size: 12px; white-space: nowrap; }
.ct-step b { color: var(--o); font-family: var(--display); }
.ct-step button { width: 22px; height: 22px; border-radius: 6px; color: var(--mute); border: 0 !important; padding: 0 !important; }
.ct-step button:hover { background: rgba(255, 120, 100, .25); color: #fff; }
.ct-step.empty { color: var(--mute); padding-right: 8px; }
.ct-skend { display: flex; gap: 5px; }
.ct-skend button { display: flex; align-items: center; gap: 5px; }
.ct-sklabel { position: absolute; left: 0; top: 0; z-index: 8; padding: 5px 10px; border-radius: 9px; background: var(--paper); color: var(--night); font-size: 13px; font-weight: 700; pointer-events: none; opacity: 0; transition: opacity .12s; white-space: nowrap; }
.ct-sklabel.on { opacity: 1; }
.ct-ink .g.target { stroke: #fff; stroke-width: 4; filter: drop-shadow(0 0 10px rgba(255, 255, 255, .9)); }
.ct[data-tool=move].ct-sketch .ct-ink { cursor: grab; } .ct[data-tool=erase].ct-sketch .ct-ink { cursor: not-allowed; } .ct[data-tool=ball].ct-sketch .ct-ink { cursor: pointer; }
.ct-filmbtn { display: flex; align-items: center; justify-content: center; gap: 8px; }

.ct-help { width: 34px; justify-content: center; padding: 0 !important; font-weight: 700; font-size: 15px !important; position: relative; }
.ct-dot { position: absolute; top: 3px; right: 3px; width: 8px; height: 8px; border-radius: 50%; background: var(--o); box-shadow: 0 0 8px var(--o); }
.ct-spot { position: absolute; z-index: 15; border-radius: 12px; box-shadow: 0 0 0 9999px rgba(2, 4, 8, .62), 0 0 0 2px var(--o), 0 0 24px rgba(255, 142, 58, .55); pointer-events: none; transition: all .35s cubic-bezier(.2, .8, .2, 1); }
.ct-spot.round { border-radius: 50%; }
.ct-panel.ct-tourcard { width: 340px; z-index: 21; border-color: rgba(255, 142, 58, .6); }
.ct-call { margin: 0; font-size: 15px; line-height: 1.5; color: var(--paper); }
.ct-tourrow { display: flex; align-items: center; gap: 8px; }
.ct-tourrow .ct-count { flex: 1; font-size: 11px; letter-spacing: .14em; text-transform: uppercase; color: var(--o); font-family: var(--display); font-weight: 700; }
.ct-tourrow button { height: 34px; padding: 0 14px; border-radius: 9px; border: 1px solid var(--line) !important; font-size: 13px; }
.ct-tourrow button.go { border-color: var(--o) !important; }
.ct-menu { display: grid; gap: 4px; }
.ct-menu button { display: flex; align-items: center; gap: 10px; height: 40px; padding: 0 12px; border-radius: 9px; font-size: 14px; text-align: left; }
.ct-menu button:hover { background: var(--ice-dim); }
.ct-menu button span { flex: 1; }
.ct-new { font-style: normal; font-size: 10.5px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; padding: 2px 7px; border-radius: 6px; background: var(--o); color: var(--night); }
.ct-rel h5 { margin: 4px 0 8px; font-family: var(--display); font-size: 18px; font-weight: 900; text-transform: uppercase; display: flex; justify-content: space-between; align-items: baseline; gap: 8px; }
.ct-rel h5 small { font-family: var(--body); font-weight: 400; font-size: 11px; color: var(--mute); text-transform: none; }
.ct-rel ul { list-style: none; padding: 0; margin: 0 0 10px; display: grid; gap: 8px; }
.ct-rel li { display: grid; grid-template-columns: 1fr auto; gap: 2px 10px; font-size: 13px; line-height: 1.45; }
.ct-rel li b { color: var(--paper); } .ct-rel li span { grid-column: 1; color: color-mix(in srgb, var(--paper) 80%, transparent); }
.ct-rel li button { grid-column: 2; grid-row: 1 / span 2; align-self: center; height: 28px; padding: 0 10px; border-radius: 8px; border: 1px solid rgba(255, 142, 58, .5) !important; color: var(--o); font-size: 12px; }
.ct-keys { display: grid; grid-template-columns: auto 1fr; gap: 6px 14px; margin: 0; font-size: 13px; }
.ct-keys dt { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 12px; color: var(--o); }
.ct-keys dd { margin: 0; color: color-mix(in srgb, var(--paper) 85%, transparent); }
.ct-tip { position: absolute; z-index: 30; max-width: 260px; padding: 6px 10px; border-radius: 8px; background: var(--paper); color: var(--night); font-size: 12.5px; line-height: 1.35; box-shadow: 0 6px 20px rgba(0, 0, 0, .35); pointer-events: none; }

/* sport switch */
.ct-sports { display: flex; gap: 4px; padding: 3px; border-radius: 20px; background: var(--glass); border: 1px solid var(--line); }
.ct-sports[hidden] { display: none; }
.ct-sports .ct-pill { height: 28px; border: 0 !important; background: none !important; padding: 0 12px; }
.ct-sports .ct-pill.on { background: var(--o) !important; color: var(--night); }
.ct-hint { color: var(--mute); font-size: .8em; }

/* concept library */
.ct-lib { position: absolute; left: 22px; top: 70px; bottom: 190px; display: flex; flex-direction: column; gap: 2px; z-index: 3; width: 200px; overflow-y: auto; scrollbar-width: none; }
.ct-lib::before { content: 'Concepts'; font-family: var(--display); font-weight: 700; text-transform: uppercase; letter-spacing: .18em; font-size: 12px; color: var(--mute); margin: 0 0 6px 12px; }
.ct-lib button { text-align: left; padding: 7px 12px; border-radius: 10px; font-family: var(--display); font-weight: 700; font-size: 18px; letter-spacing: .02em; line-height: 1.05; color: color-mix(in srgb, var(--paper) 78%, transparent); border: 1px solid transparent; transition: background .2s, color .2s, border-color .2s; flex: none; }
.ct-lib button span { display: block; font-family: var(--body); font-weight: 400; font-size: 10.5px; letter-spacing: .08em; text-transform: uppercase; color: var(--mute); margin-bottom: 2px; }
.ct-lib button:hover { background: var(--ice-dim); color: var(--paper); }
.ct-lib button.on { background: var(--glass); border-color: rgba(255, 142, 58, .5); color: var(--paper); }
.ct-lib button.on span { color: var(--o); }

/* the play card */
.ct-card { position: absolute; right: 22px; top: 70px; width: 300px; max-height: calc(100cqh - 260px); overflow: auto; z-index: 3; padding: 18px 18px 16px; border-radius: 16px; background: var(--glass); border: 1px solid var(--line); backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); scrollbar-width: none; }
.ct-eyebrow { font-size: 11px; letter-spacing: .16em; text-transform: uppercase; color: var(--o); }
.ct-card h1 { font-family: var(--display); font-weight: 900; font-size: 34px; line-height: .95; margin: 6px 0 10px; text-transform: uppercase; letter-spacing: .01em; color: var(--paper); }
.ct-card p { font-size: 15px; line-height: 1.5; color: color-mix(in srgb, var(--paper) 86%, transparent); }
.ct-card h2 { font-family: var(--display); font-weight: 700; font-size: 12px; letter-spacing: .18em; text-transform: uppercase; color: var(--mute); margin: 18px 0 8px; }
.ct-cues { list-style: none; padding: 0; display: flex; flex-wrap: wrap; gap: 6px; }
.ct-cues li { font-family: var(--marker); font-size: 15px; padding: 5px 10px 3px; border-radius: 8px; background: rgba(255, 142, 58, .1); color: var(--o); border: 1px dashed rgba(255, 142, 58, .35); }
.ct-reads { list-style: none; padding: 0; display: grid; gap: 6px; }
.ct-reads li { display: flex; gap: 10px; align-items: baseline; font-size: 14px; line-height: 1.35; color: color-mix(in srgb, var(--paper) 80%, transparent); padding: 7px 9px; border-radius: 9px; border: 1px solid transparent; transition: background .4s, border-color .4s; transition-delay: calc(var(--i) * 120ms); }
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

.ct-filmbtn { margin-top: 16px; width: 100%; height: 34px; border-radius: 10px; border: 1px solid rgba(180, 140, 255, .55) !important; background: rgba(180, 140, 255, .12) !important; font-size: 13px; font-weight: 700; }
.ct-filmbtn:disabled { opacity: .5; }
.ct-film { list-style: none; padding: 0; margin: 10px 0 0; display: grid; gap: 8px; }
.ct-film li { display: flex; gap: 10px; align-items: flex-start; font-size: 13px; line-height: 1.4; color: color-mix(in srgb, var(--paper) 90%, transparent); }
.ct-film li.wait span { color: var(--mute); animation: ct-blink .9s infinite alternate; }
.ct-film li > b { flex: none; min-width: 22px; }
.ct-film i { display: block; font-style: normal; font-size: 10.5px; letter-spacing: .12em; text-transform: uppercase; color: var(--violet); }
.ct-film small { display: block; color: var(--mute); margin-top: 2px; }
.ct-film em { font-family: var(--marker); font-style: normal; color: var(--o); }

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
.ct-dlg { border: 1px solid var(--line); border-radius: 18px; background: var(--deep); color: var(--paper); padding: 24px 24px 20px; width: min(520px, calc(100vw - 32px)); max-height: calc(100dvh - 48px); overflow: auto; overscroll-behavior: contain; font-family: var(--body); box-shadow: 0 24px 70px rgba(0, 0, 0, .5); }
.ct-dlg::backdrop { background: rgba(2, 4, 8, .7); backdrop-filter: blur(4px); }
.ct-dlg h3 { font-family: var(--display); font-weight: 900; text-transform: uppercase; font-size: 26px; margin: 0 0 8px; }
.ct-dlg p { font-size: 14px; line-height: 1.5; color: color-mix(in srgb, var(--paper) 80%, transparent); margin: 0 0 14px; }
.ct-dlg .ct-fine { font-size: 12.5px; color: var(--mute); margin: 6px 0 14px; }
.ct-dlg label { display: flex; justify-content: space-between; font-size: 13px; font-weight: 700; margin-bottom: 6px; }
.ct-dlg a { color: var(--ice); }
.ct-dlg input { width: 100%; height: 42px; border-radius: 10px; border: 1px solid var(--line); background: var(--night); color: var(--paper); padding: 0 12px; font: inherit; font-size: 14px; }
.ct-dlg menu { display: flex; justify-content: flex-end; gap: 8px; padding: 0; margin: 10px 0 0; }
.ct-dlg menu button { height: 38px; padding: 0 16px; border-radius: 10px; border: 1px solid var(--line); background: none; color: var(--paper); font: inherit; cursor: pointer; }
.ct-dlg menu button[value=save] { background: var(--o); color: #04070c; border-color: var(--o); font-weight: 700; }
.ct-badge { font-weight: 400; color: var(--mute); } .ct-badge.ok { color: var(--good); } .ct-badge.bad { color: var(--bad); }
[data-r=infoBtn] { display: none !important; }

/* phones and narrow hosts: concepts become a strip, the card a sheet */
@container (max-width: 900px) {
  .ct-top .ct-pill > span { display: none; }
  .ct-top .ct-pill { padding: 0 9px; }
  .ct-sports { order: 5; }
  [data-r=statsBtn], [data-r=narrate] { display: none; }
  .ct-top .ct-switch .ct-sw { display: none; }
  .ct-word small { display: none; }
  .ct-top { padding: 12px 12px 0; flex-wrap: wrap; }
  .ct-lib { top: 104px; bottom: auto; left: 0; right: 0; width: auto; flex-direction: row; overflow-x: auto; padding: 0 12px; }
  .ct-lib::before { display: none; }
  .ct-lib button { font-size: 15px; padding: 7px 11px; background: var(--glass); border-color: var(--line); white-space: nowrap; }
  .ct-lib button span { display: none; }
  .ct-card { top: auto; bottom: 0; right: 0; left: 0; width: auto; max-height: 70cqh; border-radius: 18px 18px 0 0; translate: 0 105%; transition: translate .35s cubic-bezier(.2, .8, .2, 1); z-index: 7; }
  .ct.ct-info .ct-card { translate: 0 0; }
  [data-r=infoBtn] { display: inline-flex !important; }
  .ct-mic { width: 58px; height: 58px; }
  .ct-legend { display: none; }
  .ct.ct-football .ct-lib { bottom: auto; }
  .ct-fb { left: 8px; right: 8px; bottom: 240px; top: auto; width: auto; padding: 6px; display: flex; gap: 6px; overflow-x: auto; scrollbar-width: none; }
  .ct-fbrow { display: flex; flex: none; gap: 4px; }
  .ct-fbrow > span { display: none; }
  .ct-fbrow > div { flex-wrap: nowrap; }
  .ct-fb .ct-open { flex: none; height: 28px; font-size: 12.5px; }
  .ct-fb button { white-space: nowrap; }
  .ct-sketchbar { top: 104px; }
}

/* the defense switch */
.ct-switch .ct-sw { width: 24px; height: 14px; border-radius: 7px; background: rgba(140, 188, 255, .25); position: relative; transition: background .2s; flex: none; }
.ct-switch .ct-sw::after { content: ''; position: absolute; left: 2px; top: 2px; width: 10px; height: 10px; border-radius: 50%; background: var(--paper); transition: translate .2s cubic-bezier(.2, .8, .2, 1); }
.ct-switch.on .ct-sw { background: rgba(4, 7, 12, .35); } .ct-switch.on .ct-sw::after { translate: 10px 0; background: var(--night); }
.ct-iqpill { border-color: rgba(255, 199, 90, .45) !important; }
.ct-iqpill .ct-i { color: var(--gold); }

/* big panels: guide, IQ, stats */
.ct-panel.ct-xl { width: min(880px, calc(100% - 32px)); max-width: none; }
.ct-panel.ct-xl.sheet { width: auto; max-height: 90%; }
.ct-seg { display: inline-flex; padding: 3px; gap: 2px; border-radius: 11px; background: rgba(140, 188, 255, .08); border: 1px solid var(--line); }
.ct-seg button, .ct-seg label > span { height: 30px; padding: 0 13px; border-radius: 8px; font-size: 13px; color: var(--mute); display: inline-flex; align-items: center; cursor: pointer; }
.ct-seg button.on, .ct-seg input:checked + span { background: var(--paper); color: var(--night); font-weight: 700; }
.ct-seg label input { position: absolute; opacity: 0; pointer-events: none; }
.ct-gtabs { margin: 12px 14px 0; }
.ct-gbody { padding: 12px 14px 18px; }
.ct-glede { color: var(--mute); font-size: 13.5px; margin-bottom: 12px !important; }
.ct-glede b { color: var(--paper); }
.ct-ggrid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 10px; }
.ct .ct-gtile { position: relative; display: flex; flex-direction: column; align-items: flex-start; gap: 3px; padding: 8px 10px 11px; border-radius: 12px; text-align: left; background: linear-gradient(180deg, rgba(140, 188, 255, .07), rgba(140, 188, 255, .02)); border: 1px solid var(--line) !important; transition: transform .18s, border-color .18s; animation: ct-rise .38s both; animation-delay: calc(var(--i) * 35ms); }
.ct .ct-gtile:hover { transform: translateY(-2px); border-color: var(--o) !important; }
.ct-gtile.D:hover { border-color: var(--x) !important; }
.ct .ct-gtile .ct-mb { width: 100%; height: 92px; margin-bottom: 4px; }
.ct .ct-gtile b { font-family: var(--display); font-size: 17px; letter-spacing: .04em; text-transform: uppercase; }
.ct .ct-gtile small { color: var(--mute); font-size: 12px; }
.ct-gnum { display: inline-grid; place-items: center; min-width: 26px; height: 26px; padding: 0 6px; border-radius: 13px; font-family: var(--display); font-weight: 900; font-size: 15px; background: var(--o); color: var(--night); }
.ct-gnum.D { background: var(--x); }
.ct .ct-gtile .ct-gnum { position: absolute; top: 8px; left: 8px; }
@keyframes ct-rise { from { opacity: 0; transform: translateY(8px); } }
.ct-mb { display: block; color: var(--o); }
.ct-gdeep.D .ct-mb, .ct-gtile.D .ct-mb { color: var(--x); }
.ct-mb .mb-l { fill: none; stroke: rgba(140, 188, 255, .42); stroke-linecap: round; stroke-linejoin: round; }
.ct-mb .mb-l.hot { stroke: rgba(255, 190, 120, .8); } .ct-mb .mb-l.warm { stroke: rgba(255, 210, 80, .55); } .ct-mb .mb-l.dots { stroke-dasharray: .4 .6; }
.ct-mb .mb-p circle, .ct-mb .mb-p rect, .ct-mb .mb-p path { fill: rgba(4, 7, 12, .7); stroke-width: .32; }
.ct-mb .mb-p.O circle, .ct-mb .mb-p.O rect { stroke: var(--o); } .ct-mb .mb-p.D path { stroke: var(--x); stroke-width: .45; stroke-linecap: round; }
.ct-mb .mb-p text { fill: var(--paper); font-family: var(--display); font-weight: 700; text-anchor: middle; dominant-baseline: central; }
.ct-mb .mb-p.mate { opacity: .38; }
.ct-mb .mb-p.me circle, .ct-mb .mb-p.me rect { fill: currentColor; stroke: #fff; } .ct-mb .mb-p.me path { stroke: currentColor; stroke-width: .6; }
.ct-mb .mb-p.me text { fill: var(--night); }
.ct-mb .mb-p.D.me text { fill: var(--paper); }
.ct-mb .mb-p.me.home { opacity: .35; }
.ct-mb .mb-m { fill: none; stroke: currentColor; stroke-width: .4; stroke-linecap: round; stroke-linejoin: round; }
.ct-mb .mb-m.pass { stroke: var(--paper); stroke-dasharray: .9 .7; }
.ct-mb .mb-m.slide { stroke-dasharray: .3 .5; }
.ct-mb .mb-ah { fill: currentColor; } .ct-mb .mb-ah.p { fill: var(--paper); }
.ct-mb .mb-ball { fill: #ffb067; filter: drop-shadow(0 0 1px #ff8e3a); }
.ct-mb.anim .mb-m:not(.pass) { stroke-dasharray: 1; stroke-dashoffset: 1; animation: ct-draw 3.6s ease-in-out infinite; }
@keyframes ct-draw { 0% { stroke-dashoffset: 1; } 55%, 92% { stroke-dashoffset: 0; } 100% { stroke-dashoffset: 0; opacity: 0; } }
.ct .ct-gback { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; color: var(--mute); margin-bottom: 10px; }
.ct .ct-gback .ct-i { width: 15px; height: 15px; }
.ct-ghero { display: grid; grid-template-columns: minmax(0, 1.05fr) minmax(0, 1fr); gap: 18px; align-items: start; }
.ct-ghero .ct-mb { width: 100%; aspect-ratio: 1.1; border-radius: 14px; background: radial-gradient(80% 70% at 50% 50%, rgba(60, 110, 200, .18), transparent), #050a14; border: 1px solid var(--line); }
.ct-gkick { display: flex; align-items: center; gap: 8px; color: var(--mute); font-size: 12px; letter-spacing: .14em; text-transform: uppercase; }
.ct-gdeep h5 { margin: 6px 0 2px; font-family: var(--display); font-weight: 900; font-size: 38px; line-height: 1; letter-spacing: .02em; text-transform: uppercase; }
.ct-gcue { font-family: var(--marker); font-size: 22px; color: var(--o); margin: 8px 0 10px !important; display: flex; align-items: center; gap: 8px; }
.ct-gdeep.D .ct-gcue { color: var(--x); }
.ct .ct-gsay { width: 30px; height: 30px; border-radius: 15px; display: inline-grid; place-items: center; border: 1px solid var(--line) !important; flex: none; }
.ct .ct-gsay .ct-i { width: 15px; height: 15px; }
.ct-gdeep p { font-size: 14.5px; }
.ct .ct-gwatch { margin-top: 12px; display: inline-flex; align-items: center; gap: 8px; height: 36px; padding: 0 14px; border-radius: 18px; background: var(--o); color: var(--night); font-weight: 700; font-size: 13px; }
.ct .ct-gdeep.D .ct-gwatch { background: var(--x); }
.ct .ct-gwatch .ct-i { width: 16px; height: 16px; }
.ct-gcols { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 14px; }
.ct-gdeep section { padding: 12px 14px; border-radius: 12px; background: rgba(140, 188, 255, .05); border: 1px solid rgba(140, 188, 255, .12); }
.ct-gdeep h6 { margin: 0 0 7px; font-family: var(--display); font-size: 13px; letter-spacing: .14em; text-transform: uppercase; color: var(--mute); display: flex; align-items: center; gap: 6px; }
.ct-gdeep h6 .ct-i { width: 14px; height: 14px; }
.ct-gdeep h6 + ul, .ct-gdeep h6 + ol { margin: 0 0 10px; padding-left: 18px; font-size: 14px; display: grid; gap: 4px; }
.ct-gdo li::marker { content: '✓  '; color: #4ade80; } .ct-gdont li::marker { content: '✕  '; color: var(--bad); }
.ct-gage { margin-top: 12px; } .ct-gage .ct-seg { margin-bottom: 8px; }
.ct-gstory { margin-top: 12px; } .ct-gstory ol { list-style: none; padding: 0 !important; }
.ct-gstory button, .ct-gplay p { display: flex; gap: 8px; align-items: baseline; text-align: left; font-size: 14px; padding: 4px 0; }
.ct-gnav { display: flex; justify-content: space-between; margin-top: 14px; }
.ct-gnav button { font-size: 13px; color: var(--mute); padding: 6px 2px; } .ct-gnav button:hover { color: var(--paper); }
.ct-gplay { list-style: none; padding: 0; display: grid; gap: 8px; }
.ct-gplay li { display: grid; grid-template-columns: 54px 1fr; gap: 10px; padding: 10px 12px; border-radius: 12px; background: rgba(140, 188, 255, .05); }
.ct-gwho .ct-m { font-size: 18px; }
.ct-cards { display: grid; grid-auto-flow: column; grid-auto-columns: min(78%, 300px); gap: 12px; overflow-x: auto; scroll-snap-type: x mandatory; padding-bottom: 8px; }
.ct-scard { scroll-snap-align: start; min-height: 230px; padding: 18px; border-radius: 18px; display: flex; flex-direction: column; gap: 8px; background: linear-gradient(160deg, rgba(255, 142, 58, .18), rgba(255, 142, 58, .03)); border: 1px solid rgba(255, 142, 58, .4); }
.ct-scard.D { background: linear-gradient(160deg, rgba(169, 212, 255, .16), rgba(169, 212, 255, .03)); border-color: rgba(169, 212, 255, .4); }
.ct-scard .ct-gnum { min-width: 46px; height: 46px; font-size: 26px; border-radius: 23px; }
.ct-scard small { color: var(--mute); letter-spacing: .12em; text-transform: uppercase; font-size: 12px; }
.ct-scard b { font-family: var(--display); font-weight: 900; font-size: 34px; line-height: 1.02; text-transform: uppercase; }
.ct-scard p { margin-top: auto !important; color: var(--mute); font-size: 14px; }
@container (max-width: 640px) { .ct-ghero, .ct-gcols { grid-template-columns: 1fr; } .ct-gdeep h5 { font-size: 30px; } .ct-ggrid { grid-template-columns: repeat(2, 1fr); } }

/* focus: watch one player */
.ct-ink.focus g:not(.me) > .g, .ct-ink.focus g:not(.me) > .n, .ct-ink.focus g:not(.me) > .eye { opacity: .22; transition: opacity .3s; }
.ct-ink.focus .r:not(.me) { opacity: .1; }
.ct-ink.focus .r.me { stroke-width: 3.4; filter: drop-shadow(0 0 6px currentColor); }
.ct-ink g.me > .g { stroke-width: 3.6; filter: drop-shadow(0 0 10px rgba(255, 142, 58, .9)); }
.ct .ct-focus { position: absolute; z-index: 9; top: 64px; left: 50%; translate: -50% 0; display: inline-flex; align-items: center; gap: 8px; height: 34px; padding: 0 12px; border-radius: 17px; background: var(--o); color: var(--night); font-size: 13px; box-shadow: 0 8px 30px rgba(0, 0, 0, .4); }
.ct .ct-focus .ct-i { width: 15px; height: 15px; }

/* IQ reveals and the sketch ghost */
.ct-ink .g.ans { stroke: #4ade80; stroke-width: 4; filter: drop-shadow(0 0 12px rgba(74, 222, 128, 1)); animation: ct-pulse 1s ease-in-out infinite; }
.ct-ink .g.miss { stroke: #ff6b5a; stroke-width: 4; }
.ct-ink .g.hint { stroke: var(--hi); stroke-width: 3.4; animation: ct-pulse 1.2s ease-in-out infinite; }
@keyframes ct-pulse { 50% { stroke-opacity: .45; } }
.ct-ink .iqtarget { fill: rgba(74, 222, 128, .18); stroke: #4ade80; stroke-width: 2; stroke-dasharray: 5 4; }
.ct-ink .iqtap { stroke: #ff6b5a; stroke-width: 3; stroke-linecap: round; }
.ct-ink .ghost { fill: none; stroke: var(--hi); stroke-width: 9; stroke-linecap: round; stroke-linejoin: round; opacity: .35; stroke-dasharray: 2 14; animation: ct-march 1s linear infinite; }
@keyframes ct-march { to { stroke-dashoffset: -16; } }
.ct-ink .finger { fill: rgba(255, 209, 102, .3); stroke: var(--hi); stroke-width: 2; }
.ct-ink .laserdot { fill: #ff3b6b; stroke: #fff; stroke-width: 1.5; filter: drop-shadow(0 0 6px #ff3b6b) drop-shadow(0 0 14px rgba(255, 59, 107, .8)); }
.ct.ct-present-on.ct-laser .ct-stage { cursor: none; }
.ct-ink .laser { fill: none; stroke: #ff3b6b; stroke-width: 4; stroke-linecap: round; stroke-linejoin: round; filter: drop-shadow(0 0 8px #ff3b6b) drop-shadow(0 0 18px rgba(255, 59, 107, .7)); }
.ct.ct-quiz .ct-ink { pointer-events: auto; cursor: pointer; }
.ct.ct-quiz .ct-card, .ct.ct-quiz .ct-lib, .ct.ct-quiz .ct-dock, .ct.ct-quiz .ct-fb, .ct.ct-quiz .ct-think, .ct.ct-quiz .ct-legend, .ct.ct-quiz .ct-top > :not(.ct-word) { display: none !important; }

/* the IQ game */
.ct-iqhud { position: absolute; z-index: 12; left: 50%; top: 14px; translate: -50% 0; width: min(620px, calc(100% - 24px)); padding: 12px 14px 14px; border-radius: 18px; background: rgba(6, 11, 22, .86); backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); border: 1px solid rgba(255, 199, 90, .35); box-shadow: 0 18px 60px rgba(0, 0, 0, .5); }
.ct-iqbar { display: flex; align-items: center; gap: 10px; font-size: 12.5px; color: var(--mute); }
.ct-iqbrand { font-family: var(--display); font-weight: 900; font-size: 15px; letter-spacing: .1em; text-transform: uppercase; color: var(--gold); margin-right: auto; }
.ct-iqscore { font-weight: 700; color: var(--paper); }
.ct-iqstreak { color: #ffb067; font-weight: 700; }
.ct-iqprompt { margin-top: 8px; font-size: 20px; line-height: 1.25; } .ct-iqprompt em { font-style: normal; font-weight: 700; color: var(--gold); }
.ct-iqclock { height: 4px; border-radius: 2px; background: rgba(140, 188, 255, .14); margin-top: 10px; overflow: hidden; } .ct-iqclock i { display: block; height: 100%; width: 100%; background: linear-gradient(90deg, var(--gold), #ff8e3a); }
.ct-iqchoices { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 8px; margin-top: 10px; } .ct-iqchoices:empty { display: none; }
.ct-iqchoices button { min-height: 44px; padding: 8px 12px; border-radius: 12px; border: 1px solid var(--line) !important; background: rgba(140, 188, 255, .06); font-weight: 700; font-size: 14.5px; }
.ct-iqchoices button:hover:not(:disabled) { border-color: var(--gold) !important; }
.ct-iqchoices button.yes { background: #4ade80; color: #04140a; } .ct-iqchoices button.no { background: #ff6b5a; color: #1a0503; }
.ct-iqfeed { margin-top: 10px; display: grid; grid-template-columns: 1fr auto; gap: 4px 12px; align-items: center; animation: ct-rise .3s both; }
.ct-iqfeed p { grid-column: 1; font-size: 14.5px; }
.ct-iqfeed .ct-iqtip { color: var(--gold); font-weight: 700; font-size: 13.5px; }
.ct-iqfeed button { grid-column: 2; grid-row: 1 / span 3; height: 44px; padding: 0 20px; border-radius: 22px; background: var(--o); color: var(--night); font-weight: 700; }
.ct-iqverdict { font-family: var(--display); font-weight: 900; font-size: 24px; letter-spacing: .04em; text-transform: uppercase; }
.ct-iqverdict.yes { color: #4ade80; } .ct-iqverdict.half { color: var(--hi); } .ct-iqverdict.no { color: var(--bad); }
.ct-iqlist { list-style: none; padding: 0; display: grid; gap: 8px; margin-bottom: 14px; }
.ct-iqp { display: flex; gap: 6px; } .ct-iqp > button:first-child { flex: 1; display: flex; align-items: center; gap: 12px; padding: 10px 12px; border-radius: 14px; text-align: left; background: rgba(140, 188, 255, .05); border: 1px solid var(--line) !important; }
.ct-iqp > button:first-child:hover { border-color: var(--gold) !important; }
.ct-iqav { width: 42px; height: 42px; border-radius: 21px; display: grid; place-items: center; font-family: var(--display); font-weight: 900; font-size: 17px; background: linear-gradient(135deg, var(--gold), #ff8e3a); color: var(--night); flex: none; }
.ct-iqwho { flex: 1; display: grid; gap: 3px; min-width: 0; } .ct-iqwho small { color: var(--mute); font-size: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ct-iqlv { display: block; height: 5px; border-radius: 3px; background: rgba(140, 188, 255, .14); overflow: hidden; } .ct-iqlv > i { display: block; height: 100%; background: linear-gradient(90deg, var(--gold), #ff8e3a); border-radius: 3px; }
.ct-iqnum { font-family: var(--display); font-weight: 900; font-size: 32px; line-height: 1; text-align: right; } .ct-iqnum small { display: block; font-size: 10px; letter-spacing: .14em; color: var(--mute); }
.ct-iqdel { width: 34px; color: var(--mute); } .ct-iqdel .ct-i { width: 14px; height: 14px; }
.ct-iqadd { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; padding: 12px; border-radius: 14px; border: 1px dashed var(--line); }
.ct-iqadd input[name=nick] { flex: 1 1 200px; height: 40px; padding: 0 12px; border-radius: 10px; border: 1px solid var(--line); background: var(--night); color: var(--paper); font: inherit; }
.ct-iqadd .go, .ct-iqagain .go { height: 40px; padding: 0 18px; border-radius: 20px; background: var(--o); color: var(--night); font-weight: 700; }
.ct-iqfoot { display: flex; align-items: center; gap: 12px; margin-top: 12px; flex-wrap: wrap; } .ct-iqfoot small { color: var(--mute); font-size: 12px; flex: 1 1 220px; }
.ct-iqfoot button { display: inline-flex; align-items: center; gap: 7px; height: 38px; padding: 0 14px; border-radius: 19px; border: 1px solid rgba(255, 199, 90, .5) !important; color: var(--gold); font-weight: 700; }
.ct-iqfoot .ct-i { width: 15px; height: 15px; }
.ct-iqend { display: grid; gap: 12px; text-align: center; padding: 6px 4px; }
.ct-iqbig { display: flex; align-items: baseline; justify-content: center; gap: 10px; }
.ct-iqcount { font-family: var(--display); font-weight: 900; font-size: 84px; line-height: .9; background: linear-gradient(180deg, #fff, var(--gold)); -webkit-background-clip: text; background-clip: text; color: transparent; }
.ct-iqbig small { font-family: var(--display); letter-spacing: .16em; text-transform: uppercase; color: var(--mute); }
.ct-iqbig em { font-style: normal; font-weight: 700; } .ct-iqbig em.up { color: #4ade80; } .ct-iqbig em.down { color: var(--bad); }
.ct-iqlevel { display: grid; gap: 6px; justify-items: center; } .ct-iqlevel b { font-family: var(--display); font-size: 26px; letter-spacing: .08em; text-transform: uppercase; }
.ct-iqlevel .ct-iqlv { width: min(320px, 80%); } .ct-iqlevel small { color: var(--mute); font-size: 12px; }
.ct-iqlevel.up span { padding: 3px 10px; border-radius: 10px; background: var(--gold); color: var(--night); font-weight: 700; font-size: 12px; animation: ct-pop .5s cubic-bezier(.2, 1.6, .4, 1) both; }
@keyframes ct-pop { from { transform: scale(.4); opacity: 0; } }
.ct-iqline { color: var(--mute); font-size: 13.5px; }
.ct-iqdims { list-style: none; padding: 0; display: grid; gap: 7px; max-width: 460px; width: 100%; margin: 0 auto; text-align: left; }
.ct-iqdims li { display: grid; grid-template-columns: 120px 1fr 34px; gap: 10px; align-items: center; font-size: 13px; }
.ct-iqdims li > i { height: 8px; border-radius: 4px; background: rgba(140, 188, 255, .12); overflow: hidden; } .ct-iqdims li > i > i { display: block; height: 100%; width: var(--w); background: linear-gradient(90deg, #8cbcff, var(--gold)); border-radius: 4px; animation: ct-grow 1s .2s both cubic-bezier(.2, .8, .2, 1); }
@keyframes ct-grow { from { width: 0; } }
.ct-iqdims b { text-align: right; }
.ct-iqlike { position: relative; display: grid; gap: 4px; padding: 18px; border-radius: 18px; overflow: hidden; background: radial-gradient(120% 120% at 0% 0%, rgba(255, 199, 90, .28), transparent 60%), radial-gradient(120% 120% at 100% 100%, rgba(140, 188, 255, .22), transparent 60%), #0b1424; border: 1px solid rgba(255, 199, 90, .4); }
.ct-iqlike small { letter-spacing: .2em; text-transform: uppercase; color: var(--gold); font-size: 11px; }
.ct-iqlike b { font-family: var(--display); font-weight: 900; font-size: 32px; line-height: 1; text-transform: uppercase; }
.ct-iqlike span { color: var(--mute); font-size: 13px; letter-spacing: .06em; text-transform: uppercase; } .ct-iqlike p { font-size: 14.5px; }
.ct-iqcoach { font-size: 14.5px; font-style: italic; color: var(--paper); min-height: 1em; }
.ct-iqagain { display: flex; justify-content: center; gap: 10px; } .ct-iqagain button:not(.go) { height: 40px; padding: 0 16px; border-radius: 20px; border: 1px solid var(--line) !important; }

/* stats */
.ct-tiles { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 8px; margin: 10px 0 14px; }
.ct-tile { padding: 11px 12px; border-radius: 12px; background: rgba(140, 188, 255, .05); border: 1px solid rgba(140, 188, 255, .12); display: grid; gap: 2px; }
.ct-tile small { color: var(--mute); font-size: 11px; letter-spacing: .12em; text-transform: uppercase; }
.ct-tile b { font-family: var(--display); font-weight: 900; font-size: 28px; line-height: 1.05; font-variant-numeric: tabular-nums; }
.ct-tile span { color: var(--mute); font-size: 12px; }
.ct-stats h6, .ct-gbody > h6 { margin: 14px 0 6px; font-family: var(--display); font-size: 13px; letter-spacing: .14em; text-transform: uppercase; color: var(--mute); }
.ct-tbl { width: 100%; border-collapse: collapse; font-size: 13px; font-variant-numeric: tabular-nums; }
.ct-tbl th { text-align: left; font-weight: 400; color: var(--mute); font-size: 11.5px; padding: 4px 6px; border-bottom: 1px solid var(--line); }
.ct-tbl td { padding: 6px; border-bottom: 1px solid rgba(140, 188, 255, .07); }
.ct-tbl td.ok { color: var(--good); } .ct-tbl td.bad { color: var(--bad); }
.ct-barc { width: 40%; } .ct-barc i { display: block; height: 6px; width: var(--w); border-radius: 3px; background: var(--o); } .ct-barc i.D { background: var(--x); }
.ct-span { margin-top: 2px; }
.ct-calls { list-style: none; padding: 0; display: grid; gap: 2px; font-size: 12.5px; font-variant-numeric: tabular-nums; }
.ct-calls li { display: grid; grid-template-columns: 70px 70px 1fr 90px 60px 60px; gap: 8px; padding: 5px 6px; border-radius: 6px; } .ct-calls li:nth-child(odd) { background: rgba(140, 188, 255, .04); }
.ct-calls li.bad { color: var(--bad); } .ct-calls time, .ct-calls span { color: var(--mute); } .ct-calls span:last-child { text-align: right; color: var(--paper); }
@container (max-width: 640px) { .ct-calls li { grid-template-columns: 60px 1fr 60px; } .ct-calls li > span:nth-child(3), .ct-calls li > span:nth-child(4) { display: none; } }
.ct-statsfoot { display: flex; gap: 8px; margin-top: 12px; } .ct-statsfoot button { display: inline-flex; align-items: center; gap: 6px; height: 34px; padding: 0 12px; border-radius: 17px; border: 1px solid var(--line) !important; font-size: 13px; } .ct-statsfoot .ct-i { width: 14px; height: 14px; }
.ct-learned { list-style: none; padding: 0; display: grid; gap: 4px; } .ct-learned li { display: flex; align-items: center; gap: 10px; padding: 6px 8px; border-radius: 8px; background: rgba(140, 188, 255, .04); font-size: 13.5px; }
.ct-learned li span { flex: 1; color: var(--mute); } .ct-learned button { width: 26px; height: 26px; color: var(--mute); } .ct-learned .ct-i { width: 13px; height: 13px; }
.ct-empty { color: var(--mute); font-size: 13.5px; padding: 6px 0; }

/* voice menu, transcript fix */
.ct-voices button { align-items: flex-start !important; } .ct-voices button span { display: grid; gap: 2px; text-align: left; } .ct-voices small { color: var(--mute); font-size: 12px; font-weight: 400; }
.ct-voices button.on { background: rgba(255, 142, 58, .14); outline: 1px solid rgba(255, 142, 58, .5); }
.ct-check { display: flex; align-items: center; gap: 8px; padding: 10px 8px 4px; font-size: 13.5px; color: var(--mute); }
.ct-heard.fix { cursor: text; text-decoration: underline dotted rgba(140, 188, 255, .4); text-underline-offset: 4px; }
.ct-fixin { width: 100%; height: 34px; padding: 0 10px; border-radius: 8px; border: 1px solid var(--o); background: var(--night); color: var(--paper); font: inherit; font-size: 15px; }

/* first sketch coach */
.ct-coach { position: absolute; z-index: 11; left: 50%; bottom: 150px; translate: -50% 0; width: min(440px, calc(100% - 24px)); padding: 14px 16px; border-radius: 16px; background: rgba(6, 11, 22, .9); border: 1px solid rgba(255, 209, 102, .5); box-shadow: 0 18px 50px rgba(0, 0, 0, .5); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); animation: ct-rise .3s both; }
.ct-coachk { font-family: var(--display); font-weight: 700; font-size: 12px; letter-spacing: .16em; text-transform: uppercase; color: var(--hi); margin-bottom: 4px; }
.ct-coach p { font-size: 15.5px; margin-bottom: 6px !important; } .ct-coach b { color: var(--hi); }
.ct-coachrow { display: flex; align-items: center; gap: 10px; margin-top: 6px; }
.ct-coachdots { display: flex; gap: 5px; } .ct-coachdots i { width: 8px; height: 8px; border-radius: 4px; background: rgba(140, 188, 255, .25); } .ct-coachdots i.now { background: var(--hi); width: 20px; } .ct-coachdots i.done { background: #4ade80; }
.ct-coachms { flex: 1; font-size: 12.5px; color: var(--good); font-variant-numeric: tabular-nums; }
.ct-coachrow button { height: 34px; padding: 0 14px; border-radius: 17px; border: 1px solid var(--line) !important; font-size: 13px; display: inline-flex; align-items: center; gap: 6px; }
.ct-coachrow button.go { background: var(--hi); color: var(--night); border-color: var(--hi) !important; font-weight: 700; margin-left: auto; }
.ct-coachrow .ct-i { width: 15px; height: 15px; }

/* presenter mode: clean, big, broadcast lower third, controls that fade away */
.ct.ct-present-on .ct-top, .ct.ct-present-on .ct-dock, .ct.ct-present-on .ct-card, .ct.ct-present-on .ct-lib, .ct.ct-present-on .ct-legend, .ct.ct-present-on .ct-fb { display: none !important; }
.ct.ct-present-on .ct-ink .n { font-weight: 900; }
.ct.ct-present-on .ct-stage { transform: translateY(-4cqh); transition: transform .4s cubic-bezier(.2, .8, .2, 1); }
.ct.ct-present-on .ct-ink .g { stroke-width: 3.4; } .ct.ct-present-on .ct-ink .r { stroke-width: 3.2; }
.ct.ct-present-on .ct-lbl, .ct.ct-present-on .ct-think { font-size: 15px; }
.ct-present { position: absolute; inset: 0; z-index: 10; pointer-events: none; }
.ct-l3 { position: absolute; left: 3cqw; right: auto; bottom: 3cqh; display: flex; align-items: stretch; max-width: min(860px, 70cqw); animation: ct-l3in .5s cubic-bezier(.2, .8, .2, 1) both; filter: drop-shadow(0 14px 40px rgba(0, 0, 0, .55)); }
@keyframes ct-l3in { from { transform: translateX(-30px); opacity: 0; } }
.ct-l3k { display: grid; place-items: center; padding: 0 18px; background: var(--o); color: var(--night); font-family: var(--display); font-weight: 900; font-size: clamp(11px, 1cqw, 15px); letter-spacing: .1em; text-transform: uppercase; clip-path: polygon(0 0, 100% 0, calc(100% - 14px) 100%, 0 100%); padding-right: 30px; }
.ct-l3 > div { flex: 1; padding: 7px 16px 9px; background: linear-gradient(90deg, rgba(8, 14, 26, .94), rgba(8, 14, 26, .82)); border-top: 2px solid var(--o); margin-left: -10px; }
.ct-l3 b { display: block; font-family: var(--display); font-weight: 900; font-size: clamp(15px, 1.5cqw, 24px); line-height: 1; text-transform: uppercase; letter-spacing: .03em; }
.ct-l3 p { margin-top: 3px !important; font-size: clamp(13px, 1.15cqw, 18px); line-height: 1.3; color: var(--paper); }
.ct-l3 .ct-n { display: inline-grid; place-items: center; min-width: 1.5em; height: 1.5em; margin-right: 8px; border-radius: .75em; background: var(--ice-dim); color: var(--ice); font-weight: 700; font-size: .8em; }
.ct-pbar { position: absolute; top: 18px; left: 50%; translate: -50% 0; display: flex; align-items: center; gap: 4px; padding: 6px; border-radius: 16px; background: rgba(6, 11, 22, .82); border: 1px solid var(--line); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); pointer-events: auto; transition: opacity .5s, translate .5s; max-width: calc(100% - 24px); overflow-x: auto; scrollbar-width: none; }
.ct-pbar button { height: 38px; min-width: 38px; padding: 0 10px; border-radius: 10px; display: inline-flex; align-items: center; justify-content: center; gap: 7px; font-size: 13px; white-space: nowrap; }
.ct-pbar button:hover { background: var(--ice-dim); } .ct-pbar button.on { background: var(--o); color: var(--night); font-weight: 700; }
.ct-pbar .ct-i { width: 17px; height: 17px; } .ct-psep { width: 1px; height: 22px; background: var(--line); margin: 0 4px; flex: none; }
.ct.ct-idle .ct-pbar { opacity: 0; translate: -50% -12px; pointer-events: none; }
.ct.ct-idle { cursor: none; }
@container (max-width: 640px) { .ct-pbar button span { display: none; } .ct-l3 { left: 8px; right: 8px; bottom: 12px; } .ct-l3k { display: none; } }

/* ---- phones and tablets: Apple / Tesla style. A clean header, a tab bar with the mic in the middle,
   everything else in a control center of big labeled tiles. ---- */
.ct-tabbar, .ct-playchip { display: none; }
@container (max-width: 1100px) {
  .ct-top { padding: max(10px, env(safe-area-inset-top)) 14px 0; flex-wrap: nowrap; gap: 8px; }
  .ct-word { font-size: 21px; margin-right: 0; } .ct-word small { display: none; }
  .ct-top > .ct-pill:not([data-r=keyBtn]):not([data-r=helpBtn]), .ct-top [data-r=infoBtn] { display: none !important; }
  .ct-top .ct-pill { padding: 0 10px; } .ct-top .ct-pill > span { display: none; }
  .ct-sports { order: 0; margin-left: auto; height: 34px; }
  .ct-sports .ct-pill { height: 28px; padding: 0 11px; font-size: 13px !important; }
  .ct-sports + .ct-sp { display: none; }
  .ct-lib, .ct-legend { display: none !important; }
  .ct-fb { display: none !important; }
  .ct.ct-fbopen .ct-fb { display: flex !important; position: absolute; left: 12px; right: 12px; top: auto; bottom: calc(196px + env(safe-area-inset-bottom)); width: auto; z-index: 6; padding: 8px; gap: 8px; overflow-x: auto; border-radius: 14px; }
  .ct .ct-playchip { display: inline-flex; position: absolute; z-index: 5; top: calc(max(10px, env(safe-area-inset-top)) + 44px); left: 50%; translate: -50% 0; max-width: calc(100% - 28px); align-items: center; gap: 8px; height: 38px; padding: 0 8px 0 14px; border-radius: 19px; background: var(--glass); border: 1px solid var(--line) !important; backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); }
  .ct-playchip small { color: var(--o); font-size: 10.5px; letter-spacing: .12em; text-transform: uppercase; white-space: nowrap; }
  .ct-playchip b { font-family: var(--display); font-size: 17px; letter-spacing: .03em; text-transform: uppercase; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .ct-playchip .ct-i { width: 16px; height: 16px; color: var(--mute); flex: none; }
  .ct-tabbar { display: grid; grid-template-columns: repeat(5, 1fr); align-items: end; position: absolute; z-index: 8; left: 0; right: 0; bottom: 0; padding: 6px 8px calc(6px + env(safe-area-inset-bottom)); background: linear-gradient(180deg, rgba(4, 7, 12, 0), rgba(4, 7, 12, .92) 26%); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border-top: 1px solid rgba(140, 188, 255, .1); }
  .ct-tabbar button { position: relative; display: grid; justify-items: center; gap: 3px; padding: 6px 0 2px; font-size: 11px; letter-spacing: .02em; color: var(--mute); min-height: 50px; -webkit-tap-highlight-color: transparent; }
  .ct-tabbar button .ct-i { width: 24px; height: 24px; transition: transform .15s; }
  .ct-tabbar button:active .ct-i { transform: scale(.88); }
  .ct-tabbar button.on { color: var(--o); }
  .ct-tabbar .ct-dot { position: absolute; top: 4px; right: calc(50% - 16px); }
  .ct-tbmic { align-self: center; width: 66px; height: 66px; min-height: 0 !important; margin: -22px auto 0; padding: 0 !important; border-radius: 50%; display: grid !important; place-items: center; background: radial-gradient(circle at 35% 30%, #ffb067, var(--o)) !important; color: var(--night) !important; box-shadow: 0 10px 30px rgba(255, 142, 58, .45), 0 0 0 6px rgba(4, 7, 12, .9); }
  .ct-tbmic svg { width: 28px; height: 28px; fill: currentColor; }
  .ct-tbmic[data-state=listening], .ct-tbmic[data-state=hearing] { animation: ct-live 1.2s ease-in-out infinite; background: radial-gradient(circle at 35% 30%, #ff8a8a, #ff4d4d) !important; }
  @keyframes ct-live { 50% { box-shadow: 0 0 0 6px rgba(4, 7, 12, .9), 0 0 0 16px rgba(255, 77, 77, .25); } }
  .ct-tabbar .ct-switch .ct-sw { display: none; }
  .ct-dock { bottom: calc(68px + env(safe-area-inset-bottom)); left: 12px; right: 12px; width: auto; translate: none; }
  .ct-talk .ct-mic { display: none; }
  .ct-talk { gap: 0; }
  .ct-caption { font-size: 15px; }
  .ct-card { z-index: 9; bottom: 0; max-height: 78cqh; padding-bottom: calc(80px + env(safe-area-inset-bottom)); }
  .ct-sketchbar { top: calc(max(10px, env(safe-area-inset-top)) + 92px); left: 12px; right: 12px; translate: none; width: auto; overflow-x: auto; }
  .ct.ct-sketch .ct-playchip { display: none; }
  .ct-focus { top: calc(max(10px, env(safe-area-inset-top)) + 92px); }
  .ct-coach { bottom: calc(84px + env(safe-area-inset-bottom)); }
  .ct.ct-sketch .ct-dock { display: none; }
  .ct-toast { top: calc(max(10px, env(safe-area-inset-top)) + 92px); }
  .ct-iqhud { top: max(10px, env(safe-area-inset-top)); }
  .ct.ct-quiz .ct-tabbar, .ct.ct-quiz .ct-playchip, .ct.ct-present-on .ct-tabbar, .ct.ct-present-on .ct-playchip { display: none !important; }
  .ct-panel.sheet { padding-bottom: calc(16px + env(safe-area-inset-bottom)); }
  .ct-panel:not(.sheet):not(.ct-tourcard) { bottom: auto; }
}
/* stock-style switch rows (control center on phones and tablets) */
.ct-rows { margin: 0 14px 16px; border-radius: 16px; overflow: hidden; background: rgba(140, 188, 255, .05); border: 1px solid rgba(140, 188, 255, .12); }
.ct .ct-row { display: flex; align-items: center; gap: 12px; width: 100%; min-height: 58px; padding: 9px 14px; text-align: left; border-bottom: 1px solid rgba(140, 188, 255, .08); -webkit-tap-highlight-color: transparent; }
.ct .ct-row:last-child { border-bottom: 0; }
.ct .ct-row:active { background: rgba(140, 188, 255, .06); }
.ct-row > .ct-i { width: 22px; height: 22px; color: var(--ice); flex: none; }
.ct-row > span { flex: 1; display: grid; gap: 1px; min-width: 0; } .ct-row b { font-size: 15.5px; font-weight: 700; } .ct-row small { color: var(--mute); font-size: 12.5px; }
.ct-ios { position: relative; flex: none; width: 51px; height: 31px; border-radius: 16px; background: rgba(120, 120, 128, .32); transition: background .25s; }
.ct-ios::after { content: ''; position: absolute; top: 2px; left: 2px; width: 27px; height: 27px; border-radius: 50%; background: #fff; box-shadow: 0 3px 8px rgba(0, 0, 0, .25), 0 1px 1px rgba(0, 0, 0, .12); transition: transform .25s cubic-bezier(.3, .7, .3, 1); }
.ct-ios.on { background: #34c759; } .ct-ios.on::after { transform: translateX(20px); }
.ct.ct-light .ct-ios { background: rgba(120, 120, 128, .2); }
/* the control center and the plays sheet */
.ct-cc { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 10px; padding: 14px; }
.ct-cc button { display: grid; justify-items: start; align-content: start; gap: 4px; min-height: 104px; padding: 14px; border-radius: 18px; text-align: left; background: linear-gradient(160deg, rgba(140, 188, 255, .1), rgba(140, 188, 255, .03)); border: 1px solid rgba(140, 188, 255, .14) !important; animation: ct-rise .3s both; animation-delay: calc(var(--i) * 25ms); transition: transform .12s; }
.ct-cc button:active { transform: scale(.97); }
.ct-cc button .ct-i { width: 26px; height: 26px; margin-bottom: 6px; color: var(--ice); }
.ct-cc button b { font-size: 15.5px; } .ct-cc button small { color: var(--mute); font-size: 12.5px; line-height: 1.25; }
.ct-cc button.on { background: linear-gradient(160deg, rgba(255, 142, 58, .32), rgba(255, 142, 58, .1)); border-color: rgba(255, 142, 58, .55) !important; } .ct-cc button.on .ct-i { color: var(--o); }
.ct-playgrid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 8px; padding: 14px; }
.ct-playgrid button { display: grid; gap: 2px; padding: 12px 14px; min-height: 64px; border-radius: 14px; text-align: left; background: rgba(140, 188, 255, .05); border: 1px solid rgba(140, 188, 255, .12) !important; }
.ct-playgrid button small { color: var(--o); font-size: 10.5px; letter-spacing: .1em; text-transform: uppercase; }
.ct-playgrid button b { font-family: var(--display); font-size: 18px; text-transform: uppercase; letter-spacing: .02em; }
.ct-playgrid button.on { border-color: var(--o) !important; background: rgba(255, 142, 58, .12); }
@container (max-width: 520px) { .ct-top [data-r=keyBtn], .ct-top [data-r=helpBtn] { display: none !important; } .ct-word { font-size: 18px; } .ct-sports .ct-pill { padding: 0 9px; font-size: 12.5px !important; } .ct-cc { grid-template-columns: repeat(4, 1fr); gap: 8px; } .ct-cc button { min-height: 76px; padding: 10px 4px; justify-items: center; text-align: center; border-radius: 16px; } .ct-cc button small { display: none; } .ct-cc button b { font-size: 12px; } .ct-cc button .ct-i { margin-bottom: 2px; } .ct-playgrid { grid-template-columns: 1fr 1fr; } }
/* desktop that's a little narrow: secondary pills go icon-only so the bar never runs off */
@container (min-width: 1101px) and (max-width: 1440px) { .ct-top [data-r=viewBtn] > span, .ct-top [data-r=statsBtn] > span, .ct-top [data-r=presentBtn] > span, .ct-top [data-r=namesBtn] > span, .ct-top [data-r=narrate] > span { display: none; } .ct-word small { display: none; } }

/* the film room: prominent, a card per player, a full breakdown per position */
.ct .ct-filmpill { border-color: rgba(160, 120, 255, .55) !important; } .ct-filmpill .ct-i { color: var(--violet); }
.ct .ct-filmbtn { width: 100%; height: 46px; margin-top: 10px; border-radius: 14px; display: inline-flex; align-items: center; justify-content: center; gap: 9px; font-weight: 700; font-size: 15px; color: #fff; background: linear-gradient(135deg, #7b5cff, #b04cff) !important; border: 0 !important; box-shadow: 0 10px 26px rgba(123, 92, 255, .35); }
.ct .ct-filmbtn .ct-i { width: 19px; height: 19px; }
.ct-fgrid { display: grid; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); gap: 10px; }
.ct .ct-fcard { display: grid; gap: 8px; align-content: start; padding: 13px 14px; min-height: 150px; border-radius: 16px; text-align: left; background: linear-gradient(170deg, rgba(160, 120, 255, .1), rgba(140, 188, 255, .03)); border: 1px solid rgba(160, 120, 255, .22) !important; animation: ct-rise .35s both; animation-delay: calc(var(--i) * 30ms); transition: transform .15s, border-color .15s; }
.ct .ct-fcard:hover { transform: translateY(-2px); border-color: var(--violet) !important; }
.ct .ct-fcard.ai { border-color: rgba(160, 120, 255, .5) !important; }
.ct-fhead { display: flex; align-items: center; gap: 8px; } .ct-fhead > span { flex: 1; font-family: var(--display); font-size: 16px; letter-spacing: .04em; text-transform: uppercase; }
.ct-fhead .ct-m { font-size: 18px; }
.ct-fsrc { display: inline-flex; align-items: center; gap: 4px; font-style: normal; font-size: 11px; color: var(--mute); white-space: nowrap; } .ct-fsrc .ct-i { width: 13px; height: 13px; color: var(--violet); }
.ct-fcard.ai .ct-fsrc { color: var(--violet); }
.ct-fcard p { font-size: 14px; line-height: 1.35; }
.ct-fmeta { display: grid; gap: 3px; font-size: 12.5px; } .ct-fmeta em { font-style: normal; color: var(--bad); } .ct-fmeta strong { color: var(--o); font-family: var(--marker); font-weight: 400; font-size: 14px; }
.ct-fstat { font-size: 11.5px; color: var(--good); } .ct-fstat.bad { color: var(--bad); }
.ct-spin { display: inline-block; width: 11px; height: 11px; border-radius: 50%; border: 2px solid rgba(184, 156, 255, .3); border-top-color: var(--violet); animation: ct-rot .8s linear infinite; vertical-align: -1px; }
@keyframes ct-rot { to { transform: rotate(360deg); } }
.ct-fdeep h5 { margin: 6px 0 8px; font-family: var(--display); font-weight: 900; font-size: 36px; line-height: 1; text-transform: uppercase; }
.ct-fbrain { display: flex; gap: 10px; padding: 10px 12px; border-radius: 12px; background: rgba(160, 120, 255, .1); border: 1px solid rgba(160, 120, 255, .25); }
.ct-fbrain .ct-i { width: 22px; height: 22px; color: var(--violet); flex: none; } .ct-fbrain b { display: block; font-size: 14px; } .ct-fbrain small { color: var(--mute); font-size: 12.5px; line-height: 1.35; }
.ct-fbtns { display: flex; align-items: center; gap: 8px; margin-top: 10px; } .ct-fbtns .ct-gwatch { margin-top: 0; }
.ct-fsee { display: grid; grid-template-columns: 1.4fr 1fr 1fr; gap: 10px; margin-top: 14px; }
.ct-fq { padding: 13px 14px; border-radius: 14px; background: rgba(140, 188, 255, .05); border: 1px solid rgba(140, 188, 255, .12); }
.ct-fq h6 { margin: 0 0 6px; font-family: var(--display); font-size: 12.5px; letter-spacing: .14em; text-transform: uppercase; color: var(--violet); }
.ct-fq p { font-size: 15px; } .ct-fq.risk h6 { color: var(--bad); } .ct-fq.cue h6 { color: var(--o); } .ct-fq.cue p { font-family: var(--marker); font-size: 19px; color: var(--o); }
.ct-fbooth { display: block; margin: 0 0 6px 30px; color: var(--mute); font-size: 12.5px; font-style: italic; }
@container (max-width: 760px) { .ct-fsee { grid-template-columns: 1fr; } }

/* coach style picker */
.ct-coachsel { margin: 12px 0 4px; }
.ct-coachgrid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 6px; }
.ct .ct-coachgrid button { display: grid; gap: 2px; text-align: left; padding: 9px 11px; border-radius: 12px; border: 1px solid var(--line) !important; background: rgba(140, 188, 255, .04); color: var(--paper); font: inherit; cursor: pointer; }
.ct .ct-coachgrid button.on { border-color: var(--o) !important; background: rgba(255, 142, 58, .12); }
.ct-coachgrid b { font-size: 13.5px; } .ct-coachgrid small { font-size: 11.5px; color: var(--mute); font-weight: 400; }
/* CourtIQ connection in AI settings */
.ct-ciq { display: flex; align-items: center; gap: 12px; margin: 12px 0 4px; padding: 12px 14px; border-radius: 14px; border: 1px solid rgba(255, 142, 58, .45); background: rgba(255, 142, 58, .08); }
.ct-ciq > div { flex: 1; display: grid; gap: 2px; } .ct-ciq b { font-size: 14px; } .ct-ciq small { font-size: 12.5px; color: var(--mute); }
.ct-ciq button { flex: none; height: 36px; padding: 0 14px; border-radius: 18px; border: 0; background: var(--o); color: #04070c; font: inherit; font-weight: 700; font-size: 13px; cursor: pointer; }
.ct-ciq button[data-c=unlink] { background: none; color: var(--paper); border: 1px solid var(--line); font-weight: 400; }
/* opt-in sharing */
.ct-share { display: flex; gap: 10px; align-items: flex-start; margin: 10px 0 12px; padding: 12px; border-radius: 12px; border: 1px solid var(--line); cursor: pointer; text-transform: none; letter-spacing: 0; }
.ct-share input { margin-top: 3px; width: 18px; height: 18px; accent-color: var(--o); flex: none; }
.ct-share span { display: grid; gap: 3px; } .ct-share b { font-size: 14px; color: var(--paper); } .ct-share small { font-size: 12.5px; color: var(--mute); font-weight: 400; line-height: 1.4; }
/* the subscription row in AI settings (when the host offers one) */
.ct-keypro { display: flex; align-items: center; gap: 12px; width: 100%; margin: 4px 0 14px; padding: 12px 14px; border-radius: 14px; border: 0; cursor: pointer; text-align: left; background: linear-gradient(135deg, var(--gold), #ff8e3a); color: #04070c; font: inherit; }
.ct-keypro .ct-i { width: 22px; height: 22px; } .ct-keypro span { display: grid; } .ct-keypro small { font-size: 12.5px; opacity: .8; }
/* film room without AI: connect it */
.ct-fconnect { display: flex; gap: 14px; margin: 0 0 14px; padding: 16px; border-radius: 16px; background: radial-gradient(120% 140% at 0% 0%, rgba(160, 120, 255, .22), transparent 60%), rgba(140, 188, 255, .04); border: 1px solid rgba(160, 120, 255, .45); animation: ct-rise .3s both; }
.ct-fconnect > .ct-i { width: 30px; height: 30px; color: var(--violet); flex: none; }
.ct-fconnect b { font-size: 16px; } .ct-fconnect p { font-size: 14px; color: var(--mute); margin: 4px 0 10px !important; } .ct-fconnect small { color: var(--mute); font-size: 12px; }
.ct-fcbtns { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 8px; }
.ct .ct-fcbtns button { display: inline-flex; align-items: center; gap: 8px; height: 42px; padding: 0 16px; border-radius: 21px; font-weight: 700; font-size: 14px; }
.ct .ct-fcbtns .go { background: linear-gradient(135deg, #7b5cff, #b04cff); color: #fff; }
.ct .ct-fcbtns .pro { background: linear-gradient(135deg, var(--gold), #ff8e3a); color: #04070c; }
.ct-fcbtns .ct-i { width: 17px; height: 17px; flex: none; }
.ct .ct-fcbtns button { max-width: 100%; }
@container (max-width: 520px) { .ct-fconnect { flex-direction: column; gap: 8px; } .ct .ct-fcbtns button { width: 100%; justify-content: center; } }

/* dismissing: panels fade and slide out; the big ones dim the board behind them */
.ct-scrim { position: absolute; inset: 0; z-index: 15; background: rgba(2, 4, 8, .42); backdrop-filter: blur(2px); -webkit-backdrop-filter: blur(2px); opacity: 0; pointer-events: none; transition: opacity .2s; }
.ct-scrim.on { opacity: 1; pointer-events: auto; }
.ct-panel.out { animation: ct-out .18s ease-in forwards; pointer-events: none; }
.ct-panel.sheet.out { animation: ct-sheetout .2s ease-in forwards; }
@keyframes ct-out { to { opacity: 0; transform: translateY(6px) scale(.97); } }
@keyframes ct-sheetout { to { transform: translateY(100%); } }

/* light mode: for a bright sideline. The field's light is inverted to ink on paper. */
.ct.ct-light {
  --night: #f3efe6; --deep: #fffdf8; --ice: #2457a6; --ice-dim: rgba(36, 87, 166, .1); --line: rgba(20, 38, 70, .16);
  --o: #c2410c; --x: #1e4b91; --paper: #101a2b; --mute: #4b5869; --glass: rgba(255, 253, 248, .88);
  --gold: #8a5a00; --violet: #5b3cc4; --good: #15803d; --bad: #b42318; --hi: #8a6100;
}
.ct.ct-light::before { background: radial-gradient(60% 50% at 50% 58%, rgba(36, 87, 166, .07), transparent 70%), radial-gradient(30% 40% at 50% 8%, rgba(217, 89, 10, .05), transparent 70%); }
.ct.ct-light::after { opacity: .035; mix-blend-mode: multiply; }
.ct.ct-light .ct-court { filter: invert(1) hue-rotate(180deg) saturate(1.4) contrast(1.05); }
.ct.ct-light .ct-ink .g { fill: rgba(255, 253, 248, .85); }
.ct.ct-light .ct-ink .g.open { stroke: #16a34a; } .ct.ct-light .ct-ink .r.pass, .ct.ct-light .ct-ink .r.shot, .ct.ct-light .ct-ink .r.handoff { stroke: #101a2b; }
.ct.ct-light .ct-ink .ball { fill: #d9590a; }
.ct.ct-light .ct-caption { background: linear-gradient(180deg, transparent, rgba(255, 253, 248, .85)); }
.ct.ct-light .ct-panel { box-shadow: 0 18px 50px rgba(16, 26, 43, .18); }
.ct.ct-light .ct-scrim { background: rgba(243, 239, 230, .5); }
.ct.ct-light .ct-iqhud, .ct.ct-light .ct-coach, .ct.ct-light .ct-pbar, .ct.ct-light .ct-think { background: rgba(255, 253, 248, .92); color: var(--paper); box-shadow: 0 14px 40px rgba(16, 26, 43, .16); }
.ct.ct-light .ct-l3 > div { background: linear-gradient(90deg, rgba(255, 253, 248, .97), rgba(255, 253, 248, .9)); }
.ct.ct-light .ct-tabbar { background: linear-gradient(180deg, rgba(243, 239, 230, 0), rgba(243, 239, 230, .94) 26%); border-top-color: var(--line); }
.ct.ct-light .ct-tbmic { box-shadow: 0 10px 30px rgba(217, 89, 10, .35), 0 0 0 6px rgba(243, 239, 230, .95); color: #fff !important; }
.ct.ct-light .ct-mb, .ct.ct-light .ct-ghero .ct-mb { background: #fbf8f1; }
.ct.ct-light .ct-ghero .ct-mb { background: radial-gradient(80% 70% at 50% 50%, rgba(36, 87, 166, .06), transparent), #fbf8f1; }
.ct.ct-light .ct-mb .mb-l { stroke: rgba(36, 87, 166, .45); } .ct.ct-light .ct-mb .mb-p circle, .ct.ct-light .ct-mb .mb-p rect { fill: #fffdf8; }
.ct.ct-light .ct-mb .mb-p.me circle, .ct.ct-light .ct-mb .mb-p.me rect { fill: currentColor; stroke: #fffdf8; } .ct.ct-light .ct-mb .mb-p.me text { fill: #fff; }
.ct.ct-light .ct-iqlike { background: radial-gradient(120% 120% at 0% 0%, rgba(255, 179, 64, .3), transparent 60%), radial-gradient(120% 120% at 100% 100%, rgba(36, 87, 166, .14), transparent 60%), #fffdf8; }
.ct.ct-light .ct-iqcount { background: linear-gradient(180deg, #101a2b, #d9590a); -webkit-background-clip: text; background-clip: text; }
.ct.ct-light .ct-iqbrand, .ct.ct-light .ct-iqprompt em { color: #b7791f; }
.ct.ct-light .ct-ink .ghost { stroke: #d99a00; } .ct.ct-light .ct-coachk, .ct.ct-light .ct-coach b { color: #b7791f; }
.ct.ct-light .ct-pill.on, .ct.ct-light .ct-gwatch, .ct.ct-light .ct-focus, .ct.ct-light .ct-iqfeed button, .ct.ct-light .ct-gnum, .ct.ct-light .ct-l3k { color: #fff; }
.ct.ct-light .ct-seg button.on, .ct.ct-light .ct-seg input:checked + span { background: var(--paper); color: #fffdf8; }
.ct.ct-light .ct-switch.on .ct-sw { background: rgba(255, 255, 255, .45); }
.ct.ct-light .ct-fmeta em { color: #c2410c; } .ct.ct-light .ct-fstat { color: #15803d; }
/* fit and finish: every field at 16px so iOS never zooms the page on focus (which pushed dialogs off a
   tablet's screen), menus with room for two lines, the AI settings laid out on a grid */
.ct input, .ct select, .ct textarea { font-size: 16px !important; }
.ct-dlg form { display: grid; gap: 4px; }
.ct-dlghead { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 4px; }
.ct-dlg label.ct-share { display: flex; justify-content: flex-start; font-size: 14px; font-weight: 400; margin: 12px 0 8px; }
.ct-dlg menu { flex-wrap: wrap; position: sticky; bottom: -20px; margin: 12px -24px -20px; padding: 12px 24px 16px; background: var(--deep); border-top: 1px solid var(--line); }
.ct-dlg menu button[data-r=keyClear] { margin-right: auto; }
.ct .ct-menu button { height: auto; min-height: 44px; padding: 10px 12px; align-items: center; }
.ct .ct-voices button { align-items: flex-start; } .ct-voices button .ct-i { margin-top: 2px; flex: none; }
.ct-voices button span { line-height: 1.3; } .ct-voices button small { display: block; margin-top: 2px; }
@container (max-width: 640px) { .ct-dlg { padding: 20px 16px 16px; } .ct-dlg menu { margin: 12px -16px -16px; padding: 12px 16px 16px; } }
/* landscape phones and tablets: the lower third shrinks to a strip so the field gets the screen */
@container (max-height: 520px) { .ct-l3 { bottom: 8px; left: 8px; max-width: 62cqw; } .ct-l3 b { font-size: 14px; } .ct-l3 p { font-size: 12.5px; } .ct-l3k { display: none; } .ct-pbar { top: 6px; } }
/* the sketch button on phones and tablets: a floating pencil, like a compose button */
.ct-fab { display: none; }
@container (max-width: 1100px) {
  .ct .ct-fab { display: grid; place-items: center; position: absolute; z-index: 7; right: 12px; top: calc(max(10px, env(safe-area-inset-top)) + 42px); width: 44px; height: 44px; border-radius: 50%; background: var(--deep); border: 1px solid var(--line); color: var(--o); box-shadow: 0 10px 28px rgba(0, 0, 0, .45); }
  .ct .ct-fab .ct-i { width: 24px; height: 24px; } .ct .ct-fab.on { background: var(--o); color: var(--night); }
  .ct.ct-sketch .ct-fab { display: none; }
  .ct.ct-quiz .ct-fab, .ct.ct-present-on .ct-fab { display: none; }
}
/* whiteboard only: the board and a rail of icons, nothing else */
.ct-rail { display: none; }
.ct.ct-board .ct-top, .ct.ct-board .ct-lib, .ct.ct-board .ct-card, .ct.ct-board .ct-legend, .ct.ct-board .ct-fb, .ct.ct-board .ct-dock, .ct.ct-board .ct-tabbar, .ct.ct-board .ct-playchip, .ct.ct-board .ct-fab { display: none !important; }
.ct.ct-board .ct-rail { display: flex; flex-direction: column; align-items: center; gap: 4px; position: absolute; z-index: 9; right: max(10px, env(safe-area-inset-right)); top: 50%; translate: 0 -50%; padding: 8px 6px; border-radius: 22px; background: var(--glass); border: 1px solid var(--line); backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); }
.ct .ct-rail button { width: 44px; height: 44px; border-radius: 14px; display: grid; place-items: center; color: var(--paper); }
.ct .ct-rail button:hover { background: var(--ice-dim); } .ct .ct-rail button.on { background: var(--o); color: var(--night); }
.ct-rail .ct-i { width: 21px; height: 21px; } .ct-rail svg:not(.ct-i) { width: 20px; height: 20px; fill: currentColor; }
.ct .ct-rail [data-rl=mic] { background: var(--o); color: var(--night); border-radius: 50%; }
.ct .ct-rail [data-rl=mic][data-state=listening], .ct .ct-rail [data-rl=mic][data-state=hearing] { background: #ff4d4d; }
.ct-rail > i { width: 22px; height: 1px; background: var(--line); margin: 2px 0; }
.ct.ct-board.ct-sketch .ct-sketchbar { top: 10px; }
@container (max-height: 520px) { .ct.ct-board .ct-rail { flex-direction: row; top: auto; bottom: 8px; right: 50%; translate: 50% 0; } .ct-rail > i { width: 1px; height: 22px; } }

/* touch-first devices (iPad in landscape too): the same phone/tablet layout whatever the width. Generated from the
   (max-width: 1100px) rules above: keep them in step. */
.ct.ct-touch .ct-top { padding: max(10px, env(safe-area-inset-top)) 14px 0; flex-wrap: nowrap; gap: 8px; }
.ct.ct-touch .ct-word { font-size: 21px; margin-right: 0; }
.ct.ct-touch .ct-word small { display: none; }
.ct.ct-touch .ct-top > .ct-pill:not([data-r=keyBtn]):not([data-r=helpBtn]), .ct.ct-touch .ct-top [data-r=infoBtn] { display: none !important; }
.ct.ct-touch .ct-top .ct-pill { padding: 0 10px; }
.ct.ct-touch .ct-top .ct-pill > span { display: none; }
.ct.ct-touch .ct-sports { order: 0; margin-left: auto; height: 34px; }
.ct.ct-touch .ct-sports .ct-pill { height: 28px; padding: 0 11px; font-size: 13px !important; }
.ct.ct-touch .ct-sports + .ct-sp { display: none; }
.ct.ct-touch .ct-lib, .ct.ct-touch .ct-legend { display: none !important; }
.ct.ct-touch .ct-fb { display: none !important; }
.ct.ct-touch.ct-fbopen .ct-fb { display: flex !important; position: absolute; left: 12px; right: 12px; top: auto; bottom: calc(196px + env(safe-area-inset-bottom)); width: auto; z-index: 6; padding: 8px; gap: 8px; overflow-x: auto; border-radius: 14px; }
.ct.ct-touch .ct-playchip { display: inline-flex; position: absolute; z-index: 5; top: calc(max(10px, env(safe-area-inset-top)) + 44px); left: 50%; translate: -50% 0; max-width: calc(100% - 28px); align-items: center; gap: 8px; height: 38px; padding: 0 8px 0 14px; border-radius: 19px; background: var(--glass); border: 1px solid var(--line) !important; backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); }
.ct.ct-touch .ct-playchip small { color: var(--o); font-size: 10.5px; letter-spacing: .12em; text-transform: uppercase; white-space: nowrap; }
.ct.ct-touch .ct-playchip b { font-family: var(--display); font-size: 17px; letter-spacing: .03em; text-transform: uppercase; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ct.ct-touch .ct-playchip .ct-i { width: 16px; height: 16px; color: var(--mute); flex: none; }
.ct.ct-touch .ct-tabbar { display: grid; grid-template-columns: repeat(5, 1fr); align-items: end; position: absolute; z-index: 8; left: 0; right: 0; bottom: 0; padding: 6px 8px calc(6px + env(safe-area-inset-bottom)); background: linear-gradient(180deg, rgba(4, 7, 12, 0), rgba(4, 7, 12, .92) 26%); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border-top: 1px solid rgba(140, 188, 255, .1); }
.ct.ct-touch .ct-tabbar button { position: relative; display: grid; justify-items: center; gap: 3px; padding: 6px 0 2px; font-size: 11px; letter-spacing: .02em; color: var(--mute); min-height: 50px; -webkit-tap-highlight-color: transparent; }
.ct.ct-touch .ct-tabbar button .ct-i { width: 24px; height: 24px; transition: transform .15s; }
.ct.ct-touch .ct-tabbar button:active .ct-i { transform: scale(.88); }
.ct.ct-touch .ct-tabbar button.on { color: var(--o); }
.ct.ct-touch .ct-tabbar .ct-dot { position: absolute; top: 4px; right: calc(50% - 16px); }
.ct.ct-touch .ct-tbmic { align-self: center; width: 66px; height: 66px; min-height: 0 !important; margin: -22px auto 0; padding: 0 !important; border-radius: 50%; display: grid !important; place-items: center; background: radial-gradient(circle at 35% 30%, #ffb067, var(--o)) !important; color: var(--night) !important; box-shadow: 0 10px 30px rgba(255, 142, 58, .45), 0 0 0 6px rgba(4, 7, 12, .9); }
.ct.ct-touch .ct-tbmic svg { width: 28px; height: 28px; fill: currentColor; }
.ct.ct-touch .ct-tbmic[data-state=listening], .ct.ct-touch .ct-tbmic[data-state=hearing] { animation: ct-live 1.2s ease-in-out infinite; background: radial-gradient(circle at 35% 30%, #ff8a8a, #ff4d4d) !important; }
.ct.ct-touch .ct-tabbar .ct-switch .ct-sw { display: none; }
.ct.ct-touch .ct-dock { bottom: calc(68px + env(safe-area-inset-bottom)); left: 12px; right: 12px; width: auto; translate: none; }
.ct.ct-touch .ct-talk .ct-mic { display: none; }
.ct.ct-touch .ct-talk { gap: 0; }
.ct.ct-touch .ct-caption { font-size: 15px; }
.ct.ct-touch .ct-card { z-index: 9; bottom: 0; max-height: 78cqh; padding-bottom: calc(80px + env(safe-area-inset-bottom)); }
.ct.ct-touch .ct-sketchbar { top: calc(max(10px, env(safe-area-inset-top)) + 92px); left: 12px; right: 12px; translate: none; width: auto; overflow-x: auto; }
.ct.ct-touch.ct-sketch .ct-playchip { display: none; }
.ct.ct-touch .ct-focus { top: calc(max(10px, env(safe-area-inset-top)) + 92px); }
.ct.ct-touch .ct-coach { bottom: calc(84px + env(safe-area-inset-bottom)); }
.ct.ct-touch.ct-sketch .ct-dock { display: none; }
.ct.ct-touch .ct-toast { top: calc(max(10px, env(safe-area-inset-top)) + 92px); }
.ct.ct-touch .ct-iqhud { top: max(10px, env(safe-area-inset-top)); }
.ct.ct-touch.ct-quiz .ct-tabbar, .ct.ct-touch.ct-quiz .ct-playchip, .ct.ct-touch.ct-present-on .ct-tabbar, .ct.ct-touch.ct-present-on .ct-playchip { display: none !important; }
.ct.ct-touch .ct-panel.sheet { padding-bottom: calc(16px + env(safe-area-inset-bottom)); }
.ct.ct-touch .ct-panel:not(.sheet):not(.ct-tourcard) { bottom: auto; }
.ct.ct-touch .ct-fab { display: grid; place-items: center; position: absolute; z-index: 7; right: 12px; top: calc(max(10px, env(safe-area-inset-top)) + 42px); width: 44px; height: 44px; border-radius: 50%; background: var(--deep); border: 1px solid var(--line); color: var(--o); box-shadow: 0 10px 28px rgba(0, 0, 0, .45); }
.ct.ct-touch .ct-fab .ct-i { width: 24px; height: 24px; }
.ct.ct-touch .ct-fab.on { background: var(--o); color: var(--night); }
.ct.ct-touch.ct-sketch .ct-fab { display: none; }
.ct.ct-touch.ct-quiz .ct-fab, .ct.ct-touch.ct-present-on .ct-fab { display: none; }
/* one calm top bar at every size: the everyday controls, then More (the control center) for the rest */
.ct-top [data-r=viewBtn], .ct-top [data-r=namesBtn], .ct-top [data-r=statsBtn], .ct-top [data-r=presentBtn], .ct-top [data-r=boardBtn], .ct-top [data-r=themeBtn], .ct-top [data-r=narrate] { display: none !important; }
.ct .ct-morepill .ct-i { color: var(--ice); }
.ct.ct-touch .ct-top .ct-morepill { display: none !important; }
@container (max-width: 1100px) { .ct-top .ct-morepill { display: none !important; } }
/* My plays */
.ct-histbar { display: flex; flex-wrap: wrap; gap: 8px; padding: 14px 14px 0; }
.ct-histbar input { flex: 1 1 220px; height: 38px; padding: 0 12px; border-radius: 10px; border: 1px solid var(--line); background: var(--night); color: var(--paper); font: inherit; }
.ct-hist { list-style: none; margin: 0; padding: 12px 14px 16px; display: grid; gap: 8px; }
.ct-hist li { display: flex; align-items: stretch; gap: 4px; border-radius: 14px; background: rgba(140, 188, 255, .05); border: 1px solid rgba(140, 188, 255, .12); }
.ct .ct-hplay { flex: 1; display: grid; gap: 2px; text-align: left; padding: 10px 12px; min-width: 0; }
.ct-hplay small { color: var(--o); font-size: 11px; letter-spacing: .06em; text-transform: uppercase; } .ct-hplay b { font-family: var(--display); font-size: 19px; text-transform: uppercase; letter-spacing: .02em; }
.ct-hplay span { color: var(--mute); font-size: 13px; font-style: italic; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ct .ct-hist li > button:not(.ct-hplay) { width: 40px; color: var(--mute); font-size: 18px; display: grid; place-items: center; } .ct .ct-hist li > button.on { color: var(--gold); }
.ct-hist .ct-i { width: 15px; height: 15px; }
.ct #lib-mine, .ct .ct-lib .ct-mine { border: 1px dashed rgba(255, 142, 58, .5) !important; margin-bottom: 6px; }
.ct .ct-lib .ct-mine .ct-i { width: 14px; height: 14px; vertical-align: -2px; margin-right: 4px; color: var(--o); }
.ct .ct-minebar { display: flex; align-items: center; gap: 12px; margin: 14px 14px 0; padding: 12px 14px; border-radius: 14px; text-align: left; border: 1px solid rgba(255, 142, 58, .45) !important; background: rgba(255, 142, 58, .08); width: calc(100% - 28px); }
.ct-minebar span { flex: 1; display: grid; } .ct-minebar small { color: var(--mute); font-size: 12.5px; } .ct-minebar .ct-i { width: 22px; height: 22px; color: var(--o); }
/* collapsible side panels (desktop) */
.ct .ct-edge { position: absolute; z-index: 6; top: 92px; width: 18px; height: 64px; display: grid; place-items: center; border-radius: 9px; background: var(--glass); border: 1px solid var(--line) !important; color: var(--mute); font-size: 16px; line-height: 1; backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); transition: left .3s, right .3s, color .2s; }
.ct .ct-edge:hover { color: var(--paper); border-color: var(--o) !important; }
.ct-edgel { left: 228px; } .ct-edger { right: 328px; }
.ct-lib, .ct-card, .ct-legend { transition: transform .32s cubic-bezier(.2, .8, .2, 1), opacity .25s; }
@container (min-width: 1101px) {
  .ct:not(.ct-touch).ct-sidelib .ct-lib, .ct:not(.ct-touch).ct-sidelib .ct-legend { transform: translateX(calc(-100% - 40px)); opacity: 0; pointer-events: none; }
  .ct:not(.ct-touch).ct-sidelib .ct-edgel { left: 8px; }
  .ct:not(.ct-touch).ct-sidecard .ct-card { transform: translateX(calc(100% + 40px)); opacity: 0; pointer-events: none; }
  .ct:not(.ct-touch).ct-sidecard .ct-edger { right: 8px; }
}
@container (max-width: 1100px) { .ct .ct-edge { display: none; } }
.ct.ct-touch .ct-edge, .ct.ct-board .ct-edge, .ct.ct-present-on .ct-edge, .ct.ct-quiz .ct-edge { display: none; }
/* light mode: everything that sat on a dark glass reads on paper too */
.ct.ct-light .ct-lib button { color: var(--paper); } .ct.ct-light .ct-lib button span { color: var(--o); }
.ct.ct-light .ct-lib button.on { background: rgba(194, 65, 12, .1); border-color: rgba(194, 65, 12, .45); }
.ct.ct-light .ct-cues li { background: rgba(194, 65, 12, .1); color: #9a3412; border-color: rgba(194, 65, 12, .3); }
.ct.ct-light .ct-reads li { background: rgba(30, 75, 145, .06); }
.ct.ct-light .ct-lbl { background: rgba(255, 253, 248, .92); color: var(--paper); border-color: var(--line); }
.ct.ct-light .ct-legend { color: var(--paper); }
.ct.ct-light .ct-transport button, .ct.ct-light .ct-speed { color: var(--paper); background: rgba(255, 253, 248, .85); border-color: var(--line); }
.ct.ct-light .ct-dots button { background: rgba(16, 26, 43, .18); } .ct.ct-light .ct-dots button.past { background: rgba(16, 26, 43, .4); }
.ct.ct-light .ct-heard, .ct.ct-light .ct-status { color: var(--mute); }
.ct.ct-light .ct-ask input, .ct.ct-light form[data-r=ask] input { background: #fff; color: var(--paper); border-color: var(--line); }
.ct.ct-light .ct-tip { background: var(--paper); color: #fffdf8; }
.ct.ct-light .ct-toast { background: var(--paper); color: #fffdf8; }
.ct.ct-light .ct-ink .n { fill: var(--paper); } .ct.ct-light .ct-ink .zl { fill: var(--mute); }
.ct.ct-light .ct-ink .zone { fill: rgba(30, 75, 145, .08); stroke: rgba(30, 75, 145, .35); }
.ct.ct-light .ct-ink .r.a1 { opacity: .45; } .ct.ct-light .ct-ink .r.recap { opacity: .4; }
.ct.ct-light .ct-ink .eye { opacity: 1; }
.ct.ct-light .ct-mb .mb-p.mate { opacity: .55; }
.ct.ct-light .ct-card, .ct.ct-light .ct-fb, .ct.ct-light .ct-sketchbar { background: rgba(255, 253, 248, .94); box-shadow: 0 12px 34px rgba(16, 26, 43, .12); }
.ct.ct-light .ct-wrong { background: #15803d; color: #fff; }
/* the live moment: listening and drawing, front and center */
.ct-live { position: absolute; inset: 0; z-index: 14; display: grid; place-items: center; background: radial-gradient(60% 50% at 50% 50%, rgba(4, 7, 12, .55), rgba(4, 7, 12, .78)); backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px); animation: ct-fadein .2s both; padding: 16px; }
@keyframes ct-fadein { from { opacity: 0; } }
.ct-livecard { width: min(620px, 100%); display: grid; justify-items: center; gap: 14px; text-align: center; }
.ct-liveorb { position: relative; width: 112px; height: 112px; border-radius: 50%; display: grid; place-items: center; background: radial-gradient(circle at 35% 30%, #ffb067, var(--o)); color: #04070c; box-shadow: 0 0 60px rgba(255, 142, 58, .55); }
.ct-liveorb svg { width: 42px; height: 42px; fill: currentColor; position: relative; z-index: 1; }
.ct-liveorb i { position: absolute; inset: 0; border-radius: 50%; border: 2px solid rgba(255, 142, 58, .7); animation: ct-ripple 2.1s ease-out infinite; }
.ct-liveorb i:nth-child(3) { animation-delay: .7s; } .ct-liveorb i:nth-child(4) { animation-delay: 1.4s; }
@keyframes ct-ripple { from { transform: scale(1); opacity: .9; } to { transform: scale(2.1); opacity: 0; } }
.ct-liveorb.beat { animation: ct-thump .25s ease-out; } @keyframes ct-thump { 50% { transform: scale(1.08); } }
.ct-live[data-mode=draw] .ct-liveorb { background: radial-gradient(circle at 35% 30%, #c8b6ff, #7b5cff); box-shadow: 0 0 60px rgba(123, 92, 255, .55); color: #fff; }
.ct-live[data-mode=draw] .ct-liveorb i { border-color: rgba(184, 156, 255, .7); animation-duration: 1.4s; }
.ct-live[data-mode=done] .ct-liveorb { background: radial-gradient(circle at 35% 30%, #b6f5cf, #22c55e); box-shadow: 0 0 60px rgba(34, 197, 94, .5); }
.ct-live[data-mode=done] .ct-liveorb i { animation: none; opacity: 0; }
.ct-livek { font-family: var(--display); font-weight: 900; font-size: clamp(26px, 4.6cqw, 44px); letter-spacing: .06em; text-transform: uppercase; color: #fff; }
.ct-livesaid { font-size: clamp(19px, 3cqw, 30px); line-height: 1.3; color: #fff; text-wrap: balance; min-height: 1.3em; max-height: 40cqh; overflow: auto; }
.ct-livesaid.hint { color: rgba(238, 244, 255, .6); font-size: clamp(15px, 2cqw, 19px); }
.ct-livesteps { list-style: none; margin: 0; padding: 0; display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; }
.ct-livesteps:empty { display: none; }
.ct-livesteps li { padding: 6px 12px; border-radius: 16px; font-size: 13.5px; color: rgba(238, 244, 255, .5); border: 1px solid rgba(238, 244, 255, .15); transition: all .3s; }
.ct-livesteps li.now { color: #fff; border-color: #b89cff; background: rgba(123, 92, 255, .25); }
.ct-livesteps li.done { color: #b6f5cf; border-color: rgba(34, 197, 94, .5); }
.ct-livesteps li.done::before { content: '✓ '; }
.ct-livefoot { display: flex; align-items: center; gap: 10px; }
.ct-livefoot span { min-width: 54px; color: rgba(238, 244, 255, .6); font-variant-numeric: tabular-nums; }
.ct .ct-livefoot button { height: 44px; padding: 0 22px; border-radius: 22px; background: #fff; color: #04070c; font-weight: 700; font-size: 15px; }
.ct .ct-livefoot button.ghost { background: none; color: #fff; border: 1px solid rgba(238, 244, 255, .35) !important; }
.ct.ct-liveon .ct-tabbar, .ct.ct-liveon .ct-dock { z-index: 15; }
.ct.ct-liveon .ct-dock .ct-said, .ct.ct-liveon .ct-dock .ct-transport, .ct.ct-liveon .ct-dock .ct-caption { visibility: hidden; }
/* recent plays, one tap away */
.ct-recent { display: grid; gap: 4px; margin: 0 0 8px; }
.ct .ct-recent button { display: grid; gap: 1px; text-align: left; padding: 7px 10px; border-radius: 10px; background: rgba(255, 142, 58, .07); border: 1px solid rgba(255, 142, 58, .2) !important; }
.ct .ct-recent button:hover { border-color: var(--o) !important; }
.ct-recent b { font-family: var(--display); font-size: 15px; text-transform: uppercase; letter-spacing: .02em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ct-recent small { color: var(--mute); font-size: 11.5px; font-style: italic; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ct-libhead { font-family: var(--display); font-size: 11px; letter-spacing: .18em; text-transform: uppercase; color: var(--mute); margin: 6px 0 2px 10px; }
.ct-histp .ct-recent, .ct-panel .ct-recent { margin: 10px 14px 0; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); }
/* touch devices at any width (an iPad in landscape): the play card is the bottom sheet, like on a phone */
.ct.ct-touch .ct-card { top: auto; bottom: 0; right: 0; left: 0; width: auto; max-width: 720px; margin: 0 auto; max-height: 72cqh; border-radius: 20px 20px 0 0; translate: 0 105%; transition: translate .35s cubic-bezier(.2, .8, .2, 1); z-index: 9; padding-bottom: calc(80px + env(safe-area-inset-bottom)); }
.ct.ct-touch.ct-info .ct-card { translate: 0 0; }
.ct.ct-touch .ct-cardx { display: grid; }
.ct.ct-touch .ct-legend, .ct.ct-touch .ct-lib { display: none !important; }
.ct.ct-touch .ct-mic { width: 58px; height: 58px; }

/* the dock: a floating, labeled bar of sections (phones and tablets) */
@container (max-width: 1100px) { .ct .ct-panel.sheet { left: 8px !important; right: 8px; bottom: calc(84px + env(safe-area-inset-bottom)); max-height: calc(100% - 150px); border-radius: 22px; padding-bottom: 0; } }
.ct.ct-touch .ct-panel.sheet { left: 8px !important; right: 8px; bottom: calc(84px + env(safe-area-inset-bottom)); max-height: calc(100% - 150px); border-radius: 22px; padding-bottom: 0; }
@keyframes ct-live2 { 50% { box-shadow: 0 0 0 8px rgba(255, 77, 77, .22); } }
@container (max-width: 1100px) {
  .ct nav.ct-tabbar { display: flex; align-items: stretch; gap: 2px; position: absolute; z-index: 17; left: 50%; right: auto; translate: -50% 0; bottom: calc(10px + env(safe-area-inset-bottom)); width: auto; max-width: calc(100% - 20px); padding: 6px; border-radius: 30px; border: 1px solid rgba(255, 255, 255, .08); border-top-color: rgba(255, 255, 255, .14); background: rgba(10, 16, 28, .72); backdrop-filter: blur(22px) saturate(1.6); -webkit-backdrop-filter: blur(22px) saturate(1.6); box-shadow: 0 18px 50px rgba(0, 0, 0, .5), inset 0 1px 0 rgba(255, 255, 255, .05); }
  .ct nav.ct-tabbar button { display: grid; justify-items: center; align-content: center; gap: 4px; min-width: 70px; min-height: 0; height: 58px; padding: 6px 10px; border-radius: 24px; color: rgba(238, 244, 255, .62); font-size: 11px; font-weight: 600; letter-spacing: .02em; white-space: nowrap; transition: background .2s, color .2s, transform .12s; }
  .ct nav.ct-tabbar button .ct-i { width: 22px; height: 22px; }
  .ct nav.ct-tabbar button:active { transform: scale(.94); }
  .ct nav.ct-tabbar button.on { color: var(--o); background: rgba(255, 142, 58, .15); }
  .ct nav.ct-tabbar .ct-dot { top: 6px; right: 18px; }
  .ct nav.ct-tabbar .ct-tbmic { width: auto; height: 58px; margin: 0 4px; padding: 4px 12px 6px; border-radius: 24px; background: none !important; box-shadow: none; color: var(--o) !important; animation: none !important; }
  .ct nav.ct-tabbar .ct-tbmic i { display: grid; place-items: center; width: 34px; height: 34px; border-radius: 50%; background: radial-gradient(circle at 35% 30%, #ffb067, var(--o)); color: #04070c; box-shadow: 0 6px 18px rgba(255, 142, 58, .45); transition: background .2s, box-shadow .2s; }
  .ct nav.ct-tabbar .ct-tbmic i svg { width: 18px; height: 18px; fill: currentColor; }
  .ct nav.ct-tabbar .ct-tbmic span { color: var(--o); }
  .ct nav.ct-tabbar .ct-tbmic[data-state=listening] i, .ct nav.ct-tabbar .ct-tbmic[data-state=hearing] i { background: radial-gradient(circle at 35% 30%, #ff9a9a, #ff4d4d); animation: ct-live2 1.2s ease-in-out infinite; }
  .ct nav.ct-tabbar .ct-tbmic[data-state=listening] span, .ct nav.ct-tabbar .ct-tbmic[data-state=hearing] span { color: #ff6b6b; }

  .ct .ct-dock { bottom: calc(86px + env(safe-area-inset-bottom)); }
  .ct .ct-coach { bottom: calc(90px + env(safe-area-inset-bottom)); }
  .ct .ct-card { padding-bottom: calc(96px + env(safe-area-inset-bottom)); }
}

.ct.ct-touch nav.ct-tabbar { display: flex; align-items: stretch; gap: 2px; position: absolute; z-index: 17; left: 50%; right: auto; translate: -50% 0; bottom: calc(10px + env(safe-area-inset-bottom)); width: auto; max-width: calc(100% - 20px); padding: 6px; border-radius: 30px; border: 1px solid rgba(255, 255, 255, .08); border-top-color: rgba(255, 255, 255, .14); background: rgba(10, 16, 28, .72); backdrop-filter: blur(22px) saturate(1.6); -webkit-backdrop-filter: blur(22px) saturate(1.6); box-shadow: 0 18px 50px rgba(0, 0, 0, .5), inset 0 1px 0 rgba(255, 255, 255, .05); }
.ct.ct-touch nav.ct-tabbar button { display: grid; justify-items: center; align-content: center; gap: 4px; min-width: 70px; min-height: 0; height: 58px; padding: 6px 10px; border-radius: 24px; color: rgba(238, 244, 255, .62); font-size: 11px; font-weight: 600; letter-spacing: .02em; white-space: nowrap; transition: background .2s, color .2s, transform .12s; }
.ct.ct-touch nav.ct-tabbar button .ct-i { width: 22px; height: 22px; }
.ct.ct-touch nav.ct-tabbar button:active { transform: scale(.94); }
.ct.ct-touch nav.ct-tabbar button.on { color: var(--o); background: rgba(255, 142, 58, .15); }
.ct.ct-touch nav.ct-tabbar .ct-dot { top: 6px; right: 18px; }
.ct.ct-touch nav.ct-tabbar .ct-tbmic { width: auto; height: 58px; margin: 0 4px; padding: 4px 12px 6px; border-radius: 24px; background: none !important; box-shadow: none; color: var(--o) !important; animation: none !important; }
.ct.ct-touch nav.ct-tabbar .ct-tbmic i { display: grid; place-items: center; width: 34px; height: 34px; border-radius: 50%; background: radial-gradient(circle at 35% 30%, #ffb067, var(--o)); color: #04070c; box-shadow: 0 6px 18px rgba(255, 142, 58, .45); transition: background .2s, box-shadow .2s; }
.ct.ct-touch nav.ct-tabbar .ct-tbmic i svg { width: 18px; height: 18px; fill: currentColor; }
.ct.ct-touch nav.ct-tabbar .ct-tbmic span { color: var(--o); }
.ct.ct-touch nav.ct-tabbar .ct-tbmic[data-state=listening] i, .ct.ct-touch nav.ct-tabbar .ct-tbmic[data-state=hearing] i { background: radial-gradient(circle at 35% 30%, #ff9a9a, #ff4d4d); animation: ct-live2 1.2s ease-in-out infinite; }
.ct.ct-touch nav.ct-tabbar .ct-tbmic[data-state=listening] span, .ct.ct-touch nav.ct-tabbar .ct-tbmic[data-state=hearing] span { color: #ff6b6b; }

.ct.ct-touch .ct-dock { bottom: calc(86px + env(safe-area-inset-bottom)); }
.ct.ct-touch .ct-coach { bottom: calc(90px + env(safe-area-inset-bottom)); }
.ct.ct-touch .ct-card { padding-bottom: calc(96px + env(safe-area-inset-bottom)); }
@container (max-width: 420px) { .ct nav.ct-tabbar button { min-width: 58px; padding: 6px 6px; font-size: 10.5px; } .ct nav.ct-tabbar { gap: 0; padding: 5px; } }
.ct.ct-light nav.ct-tabbar { background: rgba(255, 253, 248, .82); border-color: rgba(16, 26, 43, .1); box-shadow: 0 16px 40px rgba(16, 26, 43, .16); }
.ct.ct-light nav.ct-tabbar button { color: rgba(16, 26, 43, .6); }
.ct.ct-light nav.ct-tabbar button.on { color: var(--o); background: rgba(194, 65, 12, .1); }
/* the live moment, lighter: the court itself shows it (aurora ripples and sparks); the words sit low and big,
   the status is a pill at the top, nothing covers the board */
.ct .ct-live { inset: 0; background: none; backdrop-filter: none; -webkit-backdrop-filter: none; pointer-events: none; display: block; padding: 0; }
.ct .ct-livecard { position: absolute; left: 50%; translate: -50% 0; bottom: calc(150px + env(safe-area-inset-bottom)); width: min(760px, calc(100% - 24px)); gap: 10px; pointer-events: auto; }
.ct .ct-liveorb { display: none; }
.ct .ct-livek { position: static; translate: none; font-family: var(--body); font-weight: 700; font-size: 14px; letter-spacing: .04em; text-transform: none; display: inline-flex; align-items: center; gap: 8px; padding: 7px 14px; border-radius: 18px; background: rgba(10, 16, 28, .72); border: 1px solid rgba(255, 255, 255, .1); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); }
.ct .ct-livek::before { content: ''; width: 9px; height: 9px; border-radius: 50%; background: #ff4d4d; box-shadow: 0 0 0 0 rgba(255, 77, 77, .6); animation: ct-rec 1.2s ease-out infinite; }
.ct-live[data-mode=starting] .ct-livek::before { background: var(--mute); animation: none; }
.ct-live[data-mode=draw] .ct-livek::before { background: #b89cff; animation: ct-rec 1s ease-out infinite; }
.ct-live[data-mode=done] .ct-livek::before { background: #22c55e; animation: none; }
@keyframes ct-rec { 70% { box-shadow: 0 0 0 9px rgba(255, 77, 77, 0); } 100% { box-shadow: 0 0 0 0 rgba(255, 77, 77, 0); } }
.ct .ct-livesaid { font-family: var(--display); font-weight: 700; font-size: clamp(22px, 3.4cqw, 38px); letter-spacing: .01em; text-shadow: 0 2px 18px rgba(0, 0, 0, .8), 0 0 2px rgba(0, 0, 0, .9); max-height: 34cqh; }
.ct .ct-livesaid.hint { font-family: var(--body); font-weight: 400; font-size: clamp(14px, 1.8cqw, 17px); }
.ct .ct-livesteps li { background: rgba(10, 16, 28, .66); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); }
.ct .ct-livefoot span { text-shadow: 0 1px 8px rgba(0, 0, 0, .8); }
.ct .ct-livefoot button { box-shadow: 0 8px 24px rgba(0, 0, 0, .4); }
.ct.ct-liveon .ct-dock .ct-said, .ct.ct-liveon .ct-dock .ct-caption { visibility: hidden; }
.ct.ct-liveon .ct-dock .ct-transport { visibility: visible; }
.ct-mic[data-state=starting], .ct-tbmic[data-state=starting] i { opacity: .7; }
@media (prefers-reduced-motion: reduce) { .ct *, .ct *::before, .ct *::after { animation: none !important; transition: none !important; } }
`;
