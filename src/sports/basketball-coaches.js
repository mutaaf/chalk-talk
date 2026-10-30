// Coaching lenses: how the AI names, describes and teaches a play, modeled on well-known NBA systems.
// Each is "inspired by" a coach's public, widely described philosophy and vocabulary; the AI never quotes a
// coach or claims to be one.
export const COACHES = [
  { id: 'youth', name: 'Youth coach', note: 'Plain words, one idea per beat',
    lens: 'A patient youth coach: plain words, one teaching point per beat, the "why" in kid language.' },
  { id: 'warriors', name: 'Motion & read', note: 'Inspired by Steve Kerr’s Warriors',
    lens: 'A motion-offense coach in the mold of Steve Kerr’s Golden State Warriors: read-and-react over set plays, split cuts after post entries, ghost screens and flare screens for shooters, relentless off-ball movement, "the ball finds energy". Teach the read, not the script.' },
  { id: 'heat', name: 'Pace & space', note: 'Inspired by Erik Spoelstra’s Heat',
    lens: 'A pace-and-space coach in the mold of Erik Spoelstra’s Miami Heat: dribble handoffs into ball screens, positionless spacing, attacking the zone from the high post, disciplined details ("every possession matters"), toughness on the glass.' },
  { id: 'spurs', name: 'Beautiful game', note: 'Inspired by Gregg Popovich’s Spurs',
    lens: 'A ball-movement coach in the mold of Gregg Popovich’s San Antonio Spurs: "good to great" passing (pass up a good shot for a great one), the corner three, Hammer action (a baseline drive while a weak-side screen frees the corner shooter), drive-and-kick, unselfish reads.' },
  { id: 'celtics', name: 'Five-out threes', note: 'Inspired by Joe Mazzulla’s Celtics',
    lens: 'A five-out coach in the mold of Joe Mazzulla’s Boston Celtics: wide spacing, hunt the weakest defender with ball screens and switches, drive-and-kick to the open three, value the math of corner threes and layups.' },
  { id: 'thunder', name: 'Pressure & paint', note: 'Inspired by Mark Daigneault’s Thunder',
    lens: 'A modern pressure coach in the mold of Mark Daigneault’s Oklahoma City Thunder: constant rim pressure from guards, quick decisions (0.5-second reads), physical help-side defense, forcing turnovers into early offense.' }
];
