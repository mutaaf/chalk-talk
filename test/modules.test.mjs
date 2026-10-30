// Every module loads as an ES module (catches duplicate declarations and bad imports that a
// syntax check misses). The DOM-only modules are imported, not run.
const mods = ['ai', 'voice', 'icons', 'tour', 'style', 'ui', 'index', 'engine/sim', 'engine/field', 'engine/geom', 'engine/football', 'engine/sketch', 'engine/iq', 'sports/index', 'guide', 'iqmode', 'stats', 'analyst', 'learn', 'sound', 'filmroom', 'track', 'server', 'history', 'playbook', 'engine/reads', 'engine/mind', 'mind', 'devices'];
for (const m of mods) await import('../src/' + m + '.js');
console.log(`ok: ${mods.length} modules load`);
