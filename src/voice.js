// Ears and a voice. Speech in through the browser's recogniser; speech out as a play-by-play
// broadcaster: OpenAI's TTS or ElevenLabs with your own key (an OpenAI play key doubles as
// the voice key), else the most natural voice the device has. A small local grammar makes
// the common commands work with no AI at all.


// Where the browser can't recognise speech itself (Firefox, installed iPhone/iPad apps), the mic
// records and the free API transcribes it (Whisper, an open model). Audio is not stored.
export function recorder(onText, onState, transcribe) {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices || typeof MediaRecorder === 'undefined') return null;
  let rec = null, chunks = [], stream = null, want = false;
  async function start() {
    if (rec) return; want = true;
    try { stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } }); }
    catch (e) { onState('error', 'Microphone is blocked for this page.'); want = false; return; }
    if (!want) { stream.getTracks().forEach(t => t.stop()); return; }
    chunks = []; rec = new MediaRecorder(stream);
    rec.ondataavailable = e => { if (e.data.size) chunks.push(e.data); };
    rec.onstop = async () => {
      stream.getTracks().forEach(t => t.stop()); rec = null;
      const blob = new Blob(chunks, { type: chunks[0] ? chunks[0].type : 'audio/webm' });
      if (blob.size < 2000) { onState('idle', ''); return; }
      onState('hearing', 'Writing down what you said…');
      try { const t = (await transcribe(blob)).trim(); onState('idle', t); if (t) onText(t); }
      catch (e) { onState('error', e.message || 'Couldn’t hear that. Try again, or type it.'); }
    };
    rec.start(); onState('listening', '');
    setTimeout(() => { if (rec && rec.state === 'recording') rec.stop(); }, 45000);   // a long play, at most
  }
  function stop() { want = false; if (rec && rec.state === 'recording') rec.stop(); }
  return { start, stop, get on() { return want; } };
}
const standaloneIOS = () => typeof navigator !== 'undefined' && /iPhone|iPad|iPod/.test(navigator.userAgent || '') && (navigator.standalone || (typeof matchMedia !== 'undefined' && matchMedia('(display-mode: standalone)').matches));

export function listener(onText, onState, transcribe) {
  const R = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);
  if (!R || standaloneIOS()) return transcribe ? recorder(onText, onState, transcribe) : null;
  let rec = null, finalText = '', want = false;
  function start() {
    if (rec) return;
    want = true; finalText = '';
    rec = new R(); rec.lang = 'en-US'; rec.interimResults = true; rec.continuous = true;
    rec.onresult = e => {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i]; if (r.isFinal) finalText += r[0].transcript + ' '; else interim += r[0].transcript;
      }
      onState('hearing', (finalText + interim).trim());
    };
    rec.onerror = e => { onState('error', e.error === 'not-allowed' ? 'Microphone is blocked for this page.' : ''); };
    rec.onend = () => { rec = null; const t = finalText.trim(); onState('idle', t); if (t) onText(t); want = false; };
    try { rec.start(); onState('listening', ''); } catch (e) { rec = null; }
  }
  function stop() { want = false; if (rec) try { rec.stop(); } catch (e) {} }
  return { start, stop, get on() { return want; } };
}

// ---- the broadcaster ----
const VKEY = 'chalktalk.voicekey';
export function voiceKind(k) { k = (k || '').trim(); return /^sk_[A-Za-z0-9]{20,}$/.test(k) || /^[a-f0-9]{32}$/.test(k) ? 'elevenlabs' : /^sk-(?!ant-)[A-Za-z0-9_-]{10,}/.test(k) ? 'openai' : ''; }
export const voiceKey = {
  get() { try { return localStorage.getItem(VKEY) || ''; } catch (e) { return ''; } },
  set(v) { try { v ? localStorage.setItem(VKEY, v.trim()) : localStorage.removeItem(VKEY); } catch (e) {} }
};
const CALLER = 'Voice: a professional play-by-play sports broadcaster. Clear, confident and warm, with measured energy: ' +
  'crisp delivery, natural pauses between actions, a slight lift on the key moment of the play. Never shouting, never ' +
  'cartoonish, never robotic. Easy for young players to follow.';

const spoken = t => t.replace(/\bO(\d)\b/g, 'O $1').replace(/\bX(\d)\b/g, 'X $1').replace(/\bDHO\b/g, 'D H O');
const cache = new Map();   // text → Promise<blob url>
let audio = null, seq = 0;

function provider(playKey) {
  const v = voiceKey.get(), vk = voiceKind(v);
  if (vk) return { kind: vk, key: v };
  if (voiceKind(playKey) === 'openai') return { kind: 'openai', key: playKey };
  return null;
}
async function synth(text, p) {
  let r;
  if (p.kind === 'openai') {
    r = await fetch('https://api.openai.com/v1/audio/speech', { method: 'POST',
      headers: { 'content-type': 'application/json', authorization: 'Bearer ' + p.key },
      body: JSON.stringify({ model: 'gpt-4o-mini-tts', voice: 'ash', input: spoken(text), instructions: CALLER, response_format: 'mp3' }) });
  } else {
    // ElevenLabs "Adam": a deep, broadcast-ready stock voice
    r = await fetch('https://api.elevenlabs.io/v1/text-to-speech/pNInz6obpgDQGcFmaJgB?output_format=mp3_44100_128', { method: 'POST',
      headers: { 'content-type': 'application/json', 'xi-api-key': p.key },
      body: JSON.stringify({ text: spoken(text), model_id: 'eleven_flash_v2_5', voice_settings: { stability: 0.55, similarity_boost: 0.8, style: 0.25, use_speaker_boost: true } }) });
  }
  if (!r.ok) throw Object.assign(new Error(r.status === 401 ? 'The voice key didn’t work.' : 'The broadcaster voice is unavailable (' + r.status + ').'), { status: r.status });
  return URL.createObjectURL(await r.blob());
}
function fetchLine(text, p) {
  const id = p.kind + '|' + text;
  if (!cache.has(id)) cache.set(id, synth(text, p).catch(e => { cache.delete(id); throw e; }));
  return cache.get(id);
}

// warm up every line of a play, so steps never wait on the network
export function prefetch(lines, playKey) {
  const p = provider(playKey); if (!p) return;
  lines.filter(Boolean).forEach(t => fetchLine(t, p).catch(() => {}));
}

let onError = null;
export function voiceErrors(fn) { onError = fn; }

export function say(text, playKey, opts) {
  if (!text) return;
  hush(); const my = ++seq;
  const p = provider(playKey), localText = (opts && opts.local) || text;
  if (p) {
    fetchLine(text, p).then(url => {
      if (my !== seq) return;
      audio = new Audio(url); audio.play().catch(() => {});
    }).catch(e => { if (my === seq) { onError && onError(e.message); local(localText); } });
    return;
  }
  local(localText);
}
export function hush() {
  seq++;
  if (audio) { audio.pause(); audio = null; }
  if (typeof speechSynthesis !== 'undefined') speechSynthesis.cancel();
}

// no voice key: the most natural voice on this device, read with a caller's energy
let best = null;
function rank(v) {
  let s = 0;
  if (/^en-US/.test(v.lang)) s += 4; else if (/^en/.test(v.lang)) s += 2; else return -1;
  if (/(Premium|Enhanced|Neural|Natural|Online)/i.test(v.name)) s += 10;
  if (/Google US English|Microsoft (Guy|Davis|Andrew|Brian|Christopher|Eric)/i.test(v.name)) s += 6;
  if (/(Evan|Nathan|Tom|Alex|Aaron)\b/.test(v.name)) s += 2;
  if (/(Albert|Bad News|Bahh|Bells|Boing|Bubbles|Cellos|Deranged|Good News|Hysterical|Jester|Organ|Superstar|Trinoids|Whisper|Wobble|Zarvox|Fred|Junior|Ralph|Kathy|Grandma|Grandpa|Rocko|Eddy|Flo|Reed|Sandy|Shelley)/.test(v.name)) s -= 20;
  return s;
}
function pick() {
  const vs = speechSynthesis.getVoices().map(v => [rank(v), v]).filter(x => x[0] >= 0).sort((a, b) => b[0] - a[0]);
  return vs.length ? vs[0][1] : null;
}
function local(text) {
  if (typeof speechSynthesis === 'undefined') return;
  best = best || pick();
  // a caller's read: a beat faster, a touch brighter, with a lift on the punchline
  const parts = spoken(text).split(/(?<=[.!?])\s+/);
  parts.forEach(part => {
    const u = new SpeechSynthesisUtterance(part);
    if (best) u.voice = best;
    u.rate = 1.02; u.pitch = 1; u.volume = 1;   // measured and natural
    speechSynthesis.speak(u);
  });
}
if (typeof speechSynthesis !== 'undefined') speechSynthesis.onvoiceschanged = () => { best = pick(); };
export function localVoiceName() { best = best || (typeof speechSynthesis !== 'undefined' ? pick() : null); return best ? best.name : ''; }

// what the coach said → a command, a concept, or words for the AI
const NUM = { one: 1, won: 1, two: 2, to: 2, too: 2, three: 3, tree: 3, four: 4, for: 4, five: 5, six: 6, seven: 7 };
export function understand(text, aliases) {
  aliases = aliases || {};
  const t = ' ' + text.toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ') + ' ';
  const has = re => re.test(t), words = t.trim().split(' ').length;
  // "label O5 the big" / "O3 is the shooter" / "call X1 the rusher" / "make O1 point guard"
  const who = '(o|oh|x|ex)\\s?(\\d|one|won|two|to|too|three|tree|four|for|five|six|seven)';
  const lm = t.match(new RegExp(' (?:label|call|name|make|tag) ' + who + ' (?:as |the |a |our )*([a-z0-9 ]{1,24}?) $')) ||
    t.match(new RegExp('^ ' + who + ' (?:is|will be|plays) (?:the |our |a )*([a-z0-9 ]{1,24}?) $'));
  if (lm) {
    const side = /^x|^ex/.test(lm[1]) ? 'X' : 'O', n = /\d/.test(lm[2]) ? +lm[2] : NUM[lm[2]];
    if (n) return { label: { id: side + n, role: lm[3].trim().replace(/\b\w/g, c => c.toUpperCase()) } };
  }
  if (words <= 5 && has(/ (show|add|turn on|put in|bring in) (the )?(defense|defence|d) /)) return { cmd: 'defense-on' };
  if (words <= 5 && has(/ (hide|remove|turn off|take out|no) (the )?(defense|defence|d) /)) return { cmd: 'defense-off' };
  if (words <= 3 && has(/ (sketch|draw mode|let me draw|whiteboard) /)) return { cmd: 'sketch' };
  if (words <= 4) {
    if (has(/ (next|forward|next step|keep going) /)) return { cmd: 'next' };
    if (has(/ (back|previous|go back|last step) /)) return { cmd: 'back' };
    if (has(/ (again|replay|restart|from the top|one more time|run it back) /)) return { cmd: 'again' };
    if (has(/ (pause|stop|freeze|hold it|wait) /)) return { cmd: 'pause' };
    if (has(/ (play|go|resume|run it) /)) return { cmd: 'play' };
    if (has(/ (slower|slow down|slow it down|slow motion) /)) return { cmd: 'slower' };
    if (has(/ (faster|speed up|speed it up) /)) return { cmd: 'faster' };
    if (has(/ (clear|erase|wipe|new play|blank) /)) return { cmd: 'clear' };
  }
  // "show me a pick and roll" / "teach the backdoor cut" / just "horns"
  if (has(/ (show|teach|draw|explain|run|pull up|what is|whats|lets see) /) || words <= 4) {
    let bestKey = null, bestLen = 0;
    for (const k in aliases) aliases[k].forEach(a => { if (t.indexOf(' ' + a + ' ') >= 0 && a.length > bestLen) { bestKey = k; bestLen = a.length; } });
    if (bestKey) return { concept: bestKey };
  }
  return { free: text };
}
