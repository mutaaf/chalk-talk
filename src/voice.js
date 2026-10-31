import { player, audioSession } from './sound.js';
import { hash } from './history.js';

// Ears and a voice. Speech in through the browser's recogniser; speech out as a play-by-play
// broadcaster: OpenAI's TTS or ElevenLabs with your own key (an OpenAI play key doubles as
// the voice key), else the most natural voice the device has. A small local grammar makes
// the common commands work with no AI at all.


// how loud the coach is right now (0..1), from a mic stream: drives the field's ripples while listening
function meterFor(stream) {
  try {
    const AC = window.AudioContext || window.webkitAudioContext, ac = new AC(), an = ac.createAnalyser(); an.fftSize = 512;
    ac.createMediaStreamSource(stream).connect(an);
    const buf = new Uint8Array(an.fftSize);
    return { level() { an.getByteTimeDomainData(buf); let s = 0; for (let i = 0; i < buf.length; i++) { const v = (buf[i] - 128) / 128; s += v * v; } return Math.min(1, Math.sqrt(s / buf.length) * 4); }, close() { try { ac.close(); } catch (e) {} } };
  } catch (e) { return null; }
}

// Where the browser can't recognise speech itself (Firefox, installed iPhone/iPad apps), the mic
// records and the free API transcribes it (Whisper, an open model). Audio is not stored.
export function recorder(onText, onState, transcribe) {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices || typeof MediaRecorder === 'undefined') return null;
  let rec = null, chunks = [], stream = null, want = false, meter = null;
  async function start() {
    if (rec) return; want = true; onState('starting', '');
    try { stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } }); }
    catch (e) { onState('error', 'Microphone is blocked for this page.'); want = false; return; }
    if (!want) { stream.getTracks().forEach(t => t.stop()); return; }
    chunks = []; rec = new MediaRecorder(stream); meter = meterFor(stream);
    rec.ondataavailable = e => { if (e.data.size) chunks.push(e.data); };
    rec.onstop = async () => {
      stream.getTracks().forEach(t => t.stop()); rec = null; if (meter) { meter.close(); meter = null; }
      const blob = new Blob(chunks, { type: chunks[0] ? chunks[0].type : 'audio/webm' });
      if (drop) { drop = false; onState('idle', ''); return; }   // cancelled: nothing is sent or drawn
      if (blob.size < 2000) { onState('idle', ''); return; }
      onState('hearing', 'Writing down what you said…');
      try { const t = (await transcribe(blob)).trim(); onState('idle', t); if (t) onText(t); }
      catch (e) { onState('error', e.message || 'Couldn’t hear that. Try again, or type it.'); }
    };
    rec.start(); onState('listening', '');
    setTimeout(() => { if (rec && rec.state === 'recording') rec.stop(); }, 45000);   // a long play, at most
  }
  let drop = false;
  function stop() { want = false; if (rec && rec.state === 'recording') rec.stop(); }
  function cancel() { drop = true; want = false; if (rec && rec.state === 'recording') rec.stop(); else onState('idle', ''); }
  return { start, stop, cancel, level: () => (meter ? meter.level() : 0), get on() { return want; } };
}
const standaloneIOS = () => typeof navigator !== 'undefined' && /iPhone|iPad|iPod/.test(navigator.userAgent || '') && (navigator.standalone || (typeof matchMedia !== 'undefined' && matchMedia('(display-mode: standalone)').matches));

export function listener(onText, onState, transcribe, vocab) {
  const R = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);
  const rec2 = transcribe ? recorder(t => { audioSession('play'); onText(t); }, (st, t) => { if (st !== 'listening' && st !== 'hearing') audioSession('play'); onState(st, t); }, transcribe) : null;
  if (!R || standaloneIOS()) return rec2 && { start() { audioSession('record'); rec2.start(); }, stop: () => rec2.stop(), cancel: () => rec2.cancel(), level: () => rec2.level(), get on() { return rec2.on; } };
  const ios = /iPhone|iPad|iPod/.test(navigator.userAgent || '') || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  let meter = null, mstream = null;
  const openMeter = () => { if (ios || !navigator.mediaDevices) return; navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true } }).then(st => { if (!want) { st.getTracks().forEach(t => t.stop()); return; } mstream = st; meter = meterFor(st); }).catch(() => {}); };
  const closeMeter = () => { if (meter) meter.close(); meter = null; if (mstream) mstream.getTracks().forEach(t => t.stop()); mstream = null; };
  // the browser's recogniser first; if it can't run here (unsupported, blocked by the service, offline), the
  // mic quietly switches to recording + Whisper for good, and this very tap carries on with it
  let rec = null, finalText = '', want = false, useRecorder = false, heardAny = false;
  const FALLBACK = ['service-not-allowed', 'network', 'language-not-supported', 'phrases-not-supported', 'audio-capture'];
  const MSG = { 'not-allowed': 'The microphone is blocked for this page. Allow it in the address bar, then tap the mic again.', 'no-speech': 'I didn’t hear anything. Tap the mic and say the play.', 'audio-capture': 'No microphone found.' };
  function start() {
    if (useRecorder && rec2) { audioSession('record'); want = true; rec2.start(); return; }
    if (rec) return;
    want = true; finalText = ''; heardAny = false;
    audioSession('record');
    rec = new R(); rec.lang = 'en-US'; rec.interimResults = true; rec.continuous = true; rec.maxAlternatives = 1;
    rec.onaudiostart = () => { onState('listening', ''); openMeter(); };   // only now is it really listening
    rec.onresult = e => {
      heardAny = true;
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i]; if (r.isFinal) finalText += r[0].transcript + ' '; else interim += r[0].transcript;
      }
      onState('hearing', (finalText + interim).trim());
    };
    rec.onerror = e => {
      if (FALLBACK.indexOf(e.error) >= 0 && rec2 && !heardAny) {
        useRecorder = true; rec.onend = null; try { rec.abort(); } catch (x) {} rec = null; closeMeter();
        if (want) rec2.start();   // carry on with this tap, recording instead
        return;
      }
      onState('error', MSG[e.error] || (e.error === 'aborted' ? '' : 'The microphone stopped (' + e.error + '). Tap it to try again.'));
    };
    rec.onend = () => { rec = null; closeMeter(); audioSession('play'); const t = dropped ? '' : finalText.trim(); dropped = false; onState('idle', t); if (t) onText(t); want = false; };
    try { rec.start(); onState('starting', ''); }
    catch (e) { rec = null; if (rec2) { useRecorder = true; rec2.start(); } else onState('error', 'The microphone couldn’t start. Type the play instead.'); }
  }
  let dropped = false;
  function stop() { want = false; if (useRecorder && rec2) { rec2.stop(); return; } if (rec) try { rec.stop(); } catch (e) {} }
  function cancel() { want = false; if (useRecorder && rec2) { rec2.cancel(); return; } if (rec) { dropped = true; try { rec.abort(); } catch (e) {} } else onState('idle', ''); }
  return { start, stop, cancel, level: () => (useRecorder && rec2 ? rec2.level() : meter ? meter.level() : 0), get on() { return useRecorder && rec2 ? rec2.on : want; } };
}

// ---- the broadcaster ----
const VKEY = 'chalktalk.voicekey';
export function voiceKind(k) { k = (k || '').trim(); return /^sk_[A-Za-z0-9]{20,}$/.test(k) || /^[a-f0-9]{32}$/.test(k) ? 'elevenlabs' : /^sk-(?!ant-)[A-Za-z0-9_-]{10,}/.test(k) ? 'openai' : ''; }
export const voiceKey = {
  get() { try { return localStorage.getItem(VKEY) || ''; } catch (e) { return ''; } },
  set(v) { try { v ? localStorage.setItem(VKEY, v.trim()) : localStorage.removeItem(VKEY); } catch (e) {} }
};
const CALLER = 'Voice: a former player turned color analyst in the broadcast booth, explaining the read to the audience. ' +
  'Conversational, insightful and warm; relaxed confidence, like talking a friend through the play. Slow down and lean in on ' +
  'the key ("watch the safety here"), a little excitement when the read pays off. Never shouting, never robotic. Easy for kids to follow.';

const spoken = t => t.replace(/\bO(\d)\b/g, 'O $1').replace(/\bX(\d)\b/g, 'X $1').replace(/\bDHO\b/g, 'D H O');
const cache = new Map();   // text → Promise<blob url>
let audio = null, seq = 0, waiting = false;

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
  return r.blob();
}
// a line, synthesized once: kept in Cache Storage across sessions, so each line is only paid for once
async function synthCached(text, p) {
  const id = 'https://chalk-talk.local/voice/' + p.kind + '/' + hash(text);
  let c = null;
  try { c = await caches.open('chalktalk-voice'); const hit = await c.match(id); if (hit) return URL.createObjectURL(await hit.blob()); } catch (e) {}
  const blob = await synth(text, p);
  try { if (c) await c.put(id, new Response(blob, { headers: { 'content-type': blob.type || 'audio/mpeg' } })); } catch (e) {}
  return URL.createObjectURL(blob);
}
function fetchLine(text, p) {
  const id = p.kind + '|' + text;
  if (!cache.has(id)) cache.set(id, synthCached(text, p).catch(e => { cache.delete(id); throw e; }));
  return cache.get(id);
}

// warm up every line of a play, so steps never wait on the network
export function prefetch(lines, playKey) {
  const p = provider(playKey); if (!p) return;
  lines.filter(Boolean).forEach(t => fetchLine(t, p).catch(() => {}));
}

// a Short (src/shorts.js): is a cloud voice set up (it can be recorded; the device's voice can't), and every line
// synthesized before recording starts, so no step waits on the network
export const cloudVoice = playKey => !!provider(playKey);
export function ready(lines, playKey) {
  const p = provider(playKey); if (!p) return Promise.resolve(false);
  return Promise.all(lines.filter(Boolean).map(t => fetchLine(t, p))).then(() => true);
}

let onError = null;
export function voiceErrors(fn) { onError = fn; }

export function say(text, playKey, opts) {
  if (!text) return;
  hush(); const my = ++seq;
  const p = provider(playKey), localText = (opts && opts.local) || text;
  if (p) {
    waiting = true;
    fetchLine(text, p).then(url => {
      if (my !== seq) return;
      waiting = false;
      audio = player || new Audio();   // the shared element a tap unlocked (iOS blocks a fresh one here)
      audio.src = url; audio.play().catch(() => { onError && onError('Tap the board once to turn on sound.'); local(localText); });
    }).catch(e => { if (my === seq) { waiting = false; onError && onError(e.message); local(localText); } });
    return;
  }
  local(localText);
}
export function hush() {
  seq++; waiting = false;
  if (audio) { audio.pause(); audio = null; }
  if (typeof speechSynthesis !== 'undefined') speechSynthesis.cancel();
}

// is a line still playing (or about to)? the board waits for it instead of talking over it
export function speaking() {
  if (waiting) return true;
  if (audio && !audio.paused && !audio.ended) return true;
  return typeof speechSynthesis !== 'undefined' && (speechSynthesis.speaking || speechSynthesis.pending);
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
    if (has(/ (again|replay|restart|from the top|one more time|run it back) /)) return { cmd: 'again' };
    if (has(/ (next|forward|next step|keep going) /)) return { cmd: 'next' };
    if (has(/ (back|previous|go back|last step) /)) return { cmd: 'back' };
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
