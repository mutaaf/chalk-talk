// Static build for mutaafaziz.com/chalktalk/: the page, its modules and aurora-field, no bundler.
import { cpSync, mkdirSync, rmSync, copyFileSync, readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { execSync } from 'node:child_process';
const out = 'dist/chalktalk';
rmSync('dist', { recursive: true, force: true });
mkdirSync(out + '/vendor', { recursive: true });
copyFileSync('index.html', out + '/index.html');
copyFileSync('glasses.html', out + '/glasses.html');   // Meta Ray-Ban Display web app (Trace)
copyFileSync('go.html', out + '/go.html');   // a headset types a 4-digit code here (mutaafaziz.com/chalktalk/go) to open a handed play
mkdirSync(out + '/guide', { recursive: true }); copyFileSync('guide/index.html', out + '/guide/index.html');   // the coach's guide: plain server-rendered text (mutaafaziz.com/chalktalk/guide/), never cached by the SW
cpSync('beta', out + '/beta', { recursive: true });   // the public beta's landing page (mutaafaziz.com/chalktalk/beta/): marketing, never cached by the SW
mkdirSync(out + '/xr', { recursive: true }); copyFileSync('xr/index.html', out + '/xr/index.html');   // mutaafaziz.com/chalktalk/xr: the short link a headset types, into Trace with one tap
mkdirSync(out + '/admin', { recursive: true }); copyFileSync('admin/index.html', out + '/admin/index.html');   // the owner's analytics (not cached offline)
cpSync('src', out + '/src', { recursive: true });
copyFileSync('node_modules/aurora-field/dist/aurora-field.mjs', out + '/vendor/aurora-field.mjs');
copyFileSync('node_modules/aurora-field/LICENSE', out + '/vendor/aurora-field.LICENSE');
cpSync('icons', out + '/icons', { recursive: true });
copyFileSync('manifest.webmanifest', out + '/manifest.webmanifest');
// the service worker precaches the whole app shell, versioned by commit so updates roll out
const files = [];
(function walk(d) { for (const f of readdirSync(d)) { const p = join(d, f); if (statSync(p).isDirectory()) walk(p); else files.push('./' + relative(out, p)); } })(out);
let rev = 'dev'; try { rev = execSync('git rev-parse --short HEAD').toString().trim() + '-' + Date.now().toString(36); } catch (e) {}
writeFileSync(out + '/sw.js', readFileSync('sw.js', 'utf8').replace('__BUILD__', rev).replace('__SHELL__', JSON.stringify(['./'].concat(files.filter(f => f !== './index.html' && !f.startsWith('./admin/') && !f.startsWith('./guide/') && !f.startsWith('./beta/'))))));
console.log('built → ' + out + ' (' + files.length + ' files, sw ' + rev + ')');
