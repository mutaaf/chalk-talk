// Voice: what coaches really say, including what speech-to-text gets wrong, must reach the right
// command or concept on the device (no AI, instant). Add every miss you find in the field here.
import assert from 'node:assert/strict';
const store = {}; globalThis.localStorage = { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; } };
const { heal, recall, teach, correct } = await import('../src/learn.js');
const { understand } = await import('../src/voice.js');
const { getSport } = await import('../src/sports/index.js');

const CORPUS = [
  ['basketball', 'show me a pick in roll', 'concept', /pick-and-roll|pnr/],
  ['basketball', 'run spain pick and roll', 'concept', /spain/],
  ['basketball', 'show me the back door cut', 'concept', /backdoor/],
  ['basketball', 'horns', 'concept', /horns/],
  ['basketball', 'add the defense', 'cmd', /defense-on/],
  ['basketball', 'take out the defense', 'cmd', /defense-off/],
  ['basketball', 'run it back', 'cmd', /again/],
  ['basketball', 'slow it down', 'cmd', /slower/],
  ['flag5', 'show me mesh', 'concept', /mesh/],
  ['flag5', 'sender pop', 'concept', /center-pop/],
  ['flag7', 'show me four verts', 'concept', /four-verts|verts/],
  ['flag7', 'run smash', 'concept', /smash/],
  ['basketball', 'label oh five the big', 'label', /O5/]
];
let pass = 0;
for (const [sp, said, kind, want] of CORPUS) {
  const sport = getSport(sp), u = understand(heal(said), sport.aliases);
  const got = kind === 'cmd' ? u.cmd : kind === 'concept' ? u.concept : u.label && u.label.id;
  assert.ok(got && want.test(got), `"${said}" (${sp}) → ${JSON.stringify(u)}, wanted ${kind} ${want}`);
  pass++;
}
// the healer: players and coaching words
assert.equal(heal('oh five sets a pick in roll for oh one'), 'O5 sets a pick and roll for O1');
assert.equal(heal('x three helps'), 'X3 helps');
// it learns: a kept phrase is instant next time; a fixed word is heard right next time
teach('basketball', 'our thing with five rolling', 'pick-and-roll');
assert.equal(recall('basketball', 'okay run our thing with five rolling'), 'pick-and-roll');
correct('show me spade pick', 'show me spain pick');
assert.match(heal('run spade pick'), /spain pick/i);
console.log(`ok: ${pass} voice phrases understood on the device; healing and learning work`);
