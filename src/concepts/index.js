// Every concept Chalk Talk can teach, by sport. Adding one is a data file (see basketball-space.js for the shape)
// plus a line here; test/concepts.test.mjs checks it against the engine before it ships.
import space from './basketball-space.js';

const ALL = [space];
export const conceptsFor = sportId => ALL.filter(c => c.sport === sportId);
export const concept = id => ALL.find(c => c.id === id) || null;
export const allConcepts = () => ALL.slice();
