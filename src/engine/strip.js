// What leaves the device about a play: X's and O's, roles and the plan. Never names (they aren't in the play at
// all). Shared by the board and scripts/prewarm-cache.mjs, so a pre-filled answer matches what the board asks.
export const strip = p => ({ title: p.title, los: p.los, coverage: p.coverage || undefined,
    players: p.players.map(q => Object.assign({ id: q.id, side: q.side, role: q.role, at: { x: +q.x.toFixed(1), y: +q.y.toFixed(1) } }, q.smart ? { smart: true } : {}, q.cover ? { cover: q.cover } : {})),
    ball: p.ball, beats: p.beats.map(b => Object.assign({ say: b.say, actions: b.actions.map(a => Object.assign({ kind: a.kind, who: a.who, to: a.to, via: a.via, path: a.path, target: a.target }, a.thought ? { thought: a.thought } : {}, a.tree ? { tree: a.tree } : {})) }, b.thoughts ? { thoughts: b.thoughts } : {})), reads: p.reads });
