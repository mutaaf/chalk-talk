// Static build for mutaafaziz.com/chalktalk/: the page, its modules and aurora-field, no bundler.
import { cpSync, mkdirSync, rmSync, copyFileSync, readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { execSync } from 'node:child_process';
const out = 'dist/chalktalk';
rmSync('dist', { recursive: true, force: true });
mkdirSync(out + '/vendor', { recursive: true });
copyFileSync('index.html', out + '/index.html');
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
writeFileSync(out + '/sw.js', readFileSync('sw.js', 'utf8').replace('__BUILD__', rev).replace('__SHELL__', JSON.stringify(['./'].concat(files.filter(f => f !== './index.html' && !f.startsWith('./admin/'))))));
console.log('built → ' + out + ' (' + files.length + ' files, sw ' + rev + ')');
