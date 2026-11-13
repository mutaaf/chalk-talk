// The coach's guide (mutaafaziz.com/chalktalk/guide/): a plain, server-rendered page with real text,
// linked from the standalone board, copied by the build, and never served from the SW's shell cache.
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const read = p => readFileSync(new URL('../' + p, import.meta.url), 'utf8');
const g = read('guide/index.html');
const title = g.match(/<title>([^<]+)<\/title>/)[1];
assert.ok(title.length <= 65, 'title under 65 chars: ' + title);
const desc = g.match(/<meta name="description" content="([^"]+)">/)[1];
assert.ok(desc.length >= 70 && desc.length <= 160, 'meta description 70-160 chars (' + desc.length + ')');
assert.match(g, /<link rel="canonical" href="https:\/\/mutaafaziz\.com\/chalktalk\/guide\/">/, 'canonical URL');
assert.match(g, /<meta name="viewport"/, 'viewport meta');
assert.match(g, /<h1>[^]*?Coach's Guide[^]*?<\/h1>/, 'the h1');
assert.match(g, /href="\/chalktalk\/"/, 'a way back to the board');
// the one script is Box Office's async analytics tag at the end (CLAUDE.md → Box Office); the page needs none
assert.doesNotMatch(g.replace('<script async src="/boxoffice/v1/insights.js"></script>', ''), /<script/i, 'no scripts: the text is the page');
assert.doesNotMatch(g, /ads\/v1|data-marquee/, 'no ads on the guide');
assert.doesNotMatch(g, /—|&mdash;/, 'no em-dashes');
const words = g.slice(g.indexOf('<body>')).replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
assert.ok(words >= 900, 'at least 900 words of text (' + words + ')');

assert.match(read('scripts/build.mjs'), /copyFileSync\('guide\/index\.html', out \+ '\/guide\/index\.html'\)/, 'the build copies the guide');
assert.match(read('scripts/build.mjs'), /!f\.startsWith\('\.\/guide\/'\)/, 'the guide is not precached');
assert.match(read('sw.js'), /if \(\/\\\/guide\(\\\/\|\$\)\/\.test\(u\.pathname\)\) return;/, 'sw.js passes the guide to the network');
const page = read('index.html');
assert.match(page, /href="guide\/"/, 'the board links the guide under the Plays list');
assert.match(page, /guide: 'guide\/'/, 'the board passes the guide to Help');
console.log('ok: the coach\'s guide (' + words + ' words) builds, links, and skips the service worker');
