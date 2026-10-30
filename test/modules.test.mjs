// Every module loads as an ES module (catches duplicate declarations and bad imports that a
// syntax check misses). The DOM-only modules are imported, not run.
const mods = ['ai', 'voice', 'icons', 'tour', 'style', 'ui', 'index', 'engine/sim', 'engine/field', 'engine/geom', 'engine/football', 'engine/sketch', 'sports/index'];
for (const m of mods) await import('../src/' + m + '.js');
console.log(`ok: ${mods.length} modules load`);
