// Marquee ads (owner decision 2026-10-30): only the standalone page shows them, never /admin,
// never a host that mounts the package (CourtIQ), never over the board, and never cached by the SW.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import assert from 'node:assert/strict';

const read = p => readFileSync(new URL('../' + p, import.meta.url), 'utf8');
const page = read('index.html');
assert.match(page, /<script async src="\/ads\/v1\/ads\.js" data-app="chalktalk" data-slots="library:banner:menu"><\/script>/, 'index.html loads the Marquee loader, async, same origin');
assert.match(page, /data-marquee="library" data-marquee-context="menu"/, 'the library banner is a menu-context slot');
assert.match(page, /https:\/\/mutaafaziz\.com\/ads\/privacy\//, 'the ad privacy policy is linked');
assert.doesNotMatch(read('admin/index.html'), /ads\/v1|data-marquee/, 'the admin page loads no ads');

// The slot hooks onto the Plays list classes; if ui.js renames them the ad silently disappears.
const ui = read('src/ui.js');
assert.ok(['ct-lib', 'ct-plays', 'ct-playgrid'].every(c => ui.includes(c)), 'ui.js still renders .ct-lib / .ct-plays / .ct-playgrid');

// The package itself (what CourtIQ mounts) never references ads.
const src = new URL('../src/', import.meta.url).pathname;
(function walk(d) {
  for (const f of readdirSync(d)) {
    const p = join(d, f);
    if (statSync(p).isDirectory()) walk(p);
    else if (p.endsWith('.js')) assert.doesNotMatch(readFileSync(p, 'utf8'), /ads\/v1\/ads\.js|data-marquee=/, p + ' must not load ads');
  }
})(src);

// The service worker never caches /ads/* (a stale loader or creative would outlive a policy change).
assert.match(read('sw.js'), /u\.pathname\.startsWith\('\/ads\/'\)\) return;/, 'sw.js passes /ads/* to the network');
console.log('ok: ads stay on the standalone page, off /admin, off the board, out of the SW cache');
