// Anonymous, cookieless usage analytics: what gets used and how, so the board gets better where it matters.
// No cookies, no device id, nothing stored on the device for it; the server counts visitors with a salted
// hash that rotates daily and never stores an IP. Never a name, never what was said, never a key.
// Hosts can turn it off with mount({ analytics: false }).

let base = null, on = true, ctx = {};
const q = [];
let timer = 0;

export function startTracking(apiBase, enabled, context) {
  base = apiBase; on = enabled !== false; ctx = context || {};
}
// one event: a short name and a few small, non-personal properties
export function track(name, props) {
  if (!on || !base || typeof navigator === 'undefined') return;
  q.push({ n: String(name).slice(0, 32), p: props || {}, t: Date.now() });
  clearTimeout(timer); timer = setTimeout(flush, 1500);
  if (q.length >= 20) flush();
}
function flush() {
  if (!q.length) return;
  const body = JSON.stringify({ ctx: Object.assign({}, ctx, ctx.live ? ctx.live() : {}), events: q.splice(0, 40) });
  try {
    const blob = new Blob([body], { type: 'application/json' });
    if (!(navigator.sendBeacon && navigator.sendBeacon(base + '/event', blob))) fetch(base + '/event', { method: 'POST', headers: { 'content-type': 'application/json' }, body, keepalive: true }).catch(() => {});
  } catch (e) {}
}
if (typeof addEventListener !== 'undefined') addEventListener('pagehide', flush);
