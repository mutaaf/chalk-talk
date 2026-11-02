// Every concept Chalk Talk can teach, by sport. A concept is data (see basketball-space.js for the shape); ones
// that depend on the field's size are built from the sport (flag 5v5 and 7v7, soccer 7v7 and 9v9 each get their
// own geometry). Adding one is a file plus a line here; test/concepts.test.mjs checks it before it ships.
import space from './basketball-space.js';
import spacing from './basketball-spacing.js';
import { keepInFront } from './flag-front.js';
import { showOutside } from './soccer-outside.js';
import { getSport } from '../sports/index.js';

const BUILD = {
  basketball: () => [space, spacing],
  flag5: s => [keepInFront('flag5', s.field.x[1] * 2, s.los, s.field.y[1], s.noRush ? 0 : s.rush.depth)],
  flag7: s => [keepInFront('flag7', s.field.x[1] * 2, s.los, s.field.y[1], s.noRush ? 0 : s.rush.depth)],
  soccer7: s => [showOutside('soccer7', s.pitch)],
  soccer9: s => [showOutside('soccer9', s.pitch)]
};
const cache = {};
export const conceptsFor = sportId => BUILD[sportId] ? (cache[sportId] = cache[sportId] || BUILD[sportId](getSport(sportId))) : [];
export const concept = (id, sportId) => (sportId ? conceptsFor(sportId) : allConcepts()).find(c => c.id === id) || null;
export const allConcepts = () => Object.keys(BUILD).flatMap(conceptsFor);
