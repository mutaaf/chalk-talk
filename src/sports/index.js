// The sports Chalk Talk knows. A sport is data (src/sports/*.js): add a file, register it here.
import basketball from './basketball.js';
import { flag5, flag7 } from './flag.js';
import { soccer7, soccer9 } from './soccer.js';

const SPORTS = {};
export function registerSport(pack) {
  for (const k of ['id', 'name', 'roster', 'field', 'view', 'mark', 'ball', 'spots', 'kinds', 'guard', 'plays', 'ai']) {
    if (pack[k] == null) throw new Error('chalk-talk: sport "' + (pack.id || '?') + '" is missing ' + k);
  }
  SPORTS[pack.id] = pack; return pack;
}
export const getSport = id => SPORTS[id] || SPORTS.basketball;
export const sports = () => Object.values(SPORTS);
// hosts say "basketball", "flag", "flag-football", "flag 7v7", "soccer", "soccer 9v9", "futbol"…
export function sportFor(slug) {
  const s = String(slug || '').toLowerCase();
  if (/soccer|futbol|fútbol/.test(s) || (/football/.test(s) && /assoc/.test(s))) return /9|11/.test(s) ? SPORTS.soccer9 : SPORTS.soccer7;
  if (/7/.test(s) && /flag|7v7|7 ?on ?7/.test(s)) return SPORTS.flag7;
  if (/flag|football/.test(s)) return SPORTS.flag5;
  return SPORTS[s] || SPORTS.basketball;
}

[basketball, flag5, flag7, soccer7, soccer9].forEach(registerSport);
