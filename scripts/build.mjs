// Static build for mutaafaziz.com/chalktalk/: the page, its modules and aurora-field, no bundler.
import { cpSync, mkdirSync, rmSync, copyFileSync } from 'node:fs';
const out = 'dist/chalktalk';
rmSync('dist', { recursive: true, force: true });
mkdirSync(out + '/vendor', { recursive: true });
copyFileSync('index.html', out + '/index.html');
cpSync('src', out + '/src', { recursive: true });
copyFileSync('node_modules/aurora-field/dist/aurora-field.mjs', out + '/vendor/aurora-field.mjs');
copyFileSync('node_modules/aurora-field/LICENSE', out + '/vendor/aurora-field.LICENSE');
console.log('built → ' + out);
