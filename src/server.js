// For servers that run Chalk Talk's AI themselves (the free Worker, or a host app like CourtIQ with its
// own key and subscription): the same prompts, schemas, validation and repair round the browser uses.
//   const req = requestFor('play', body);          // throws { status: 400 } on a bad body
//   const raw = await solve(req, (sys, messages, schema) => yourModelCall(...));
// `lite` tasks (brain, tutor, analyst) suit a small fast model; play and smart want a stronger one.

import { playRequest, smartRequest, brainRequest, tutorRequest, analystRequest, solve } from './ai.js';
import { getSport } from './sports/index.js';

export const TASKS = ['play', 'smart', 'brain', 'tutor', 'analyst'];
export const LITE = { play: false, smart: false, brain: true, tutor: true, analyst: true };
const SPORTS = ['basketball', 'flag5', 'flag7', 'soccer7', 'soccer9'];
const bad = msg => Object.assign(new Error(msg), { status: 400 });

export function requestFor(task, body) {
  body = body || {};
  if (TASKS.indexOf(task) < 0) throw Object.assign(new Error('Not found.'), { status: 404 });
  if (SPORTS.indexOf(body.sport) < 0) throw bad('Unknown sport.');
  const sport = getSport(body.sport);
  if (task === 'play') {
    if (!String(body.text || '').trim() && !body.sketch) throw bad('Say or sketch a play first.');
    return playRequest({ sport, text: String(body.text || '').slice(0, 2000), current: body.current || null, sketch: !!body.sketch, coach: typeof body.coach === 'string' ? body.coach.slice(0, 20) : undefined });
  }
  if (task === 'smart') {
    if (!body.play || !Array.isArray(body.ids) || !body.ids.length) throw bad('Pick a player to make smart.');
    return smartRequest({ sport, play: body.play, ids: body.ids.map(String).filter(id => /^[OX][1-9]$/.test(id)).slice(0, 7) });
  }
  if (task === 'brain') {
    if (!body.play || !/^[OX][1-9]$/.test(String(body.id || '')) || ['smart', 'film'].indexOf(body.mode) < 0) throw bad('Pick a player and a mode.');
    return brainRequest({ sport, play: body.play, id: String(body.id), mode: body.mode });
  }
  if (task === 'analyst') {
    if (!body.play || !Array.isArray(body.facts) || !body.facts.length || body.facts.length > 12) throw bad('Nothing to analyse.');
    return analystRequest({ sport, play: body.play, facts: body.facts.map(f => String(f).slice(0, 600)) });
  }
  if (!body.q || ['answer', 'recap'].indexOf(body.mode) < 0) throw bad('Nothing to tutor.');
  return tutorRequest({ sport, band: ['young', 'mid', 'older'].indexOf(body.band) >= 0 ? body.band : 'young', mode: body.mode, q: body.q, play: body.play || null, given: body.given == null ? null : body.given, right: !!body.right, summary: body.summary || null });
}
export { solve };
