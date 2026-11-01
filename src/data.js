'use strict';
/* ===== Grid to Glory: utiliti & data ===== */
var _s = (Date.now() ^ 0x9e3779b9) >>> 0;
function rnd() { _s = (_s + 0x6D2B79F5) | 0; var t = Math.imul(_s ^ (_s >>> 15), 1 | _s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }
function seedRnd(n) { _s = n >>> 0; }
function gauss() { var u = 0, v = 0; while (!u) u = rnd(); while (!v) v = rnd(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(6.283185307 * v); }
function clamp(x, a, b) { return Math.max(a, Math.min(b, x)); }
function pick(a) { return a[Math.floor(rnd() * a.length)]; }
function rr(a, b) { return a + rnd() * (b - a); }
function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(rnd() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
function fmtT(s) { if (s == null || !isFinite(s)) return '–'; var m = Math.floor(s / 60), r = s - m * 60; return m + ':' + (r < 10 ? '0' : '') + r.toFixed(3); }
function fmtGap(s) { return '+' + s.toFixed(1); }
function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

var TEAMS = [
  { id: 0, name: 'Brennhart Motorsport', wins0: 112, short: 'BRE', color: '#19c3b4', prestige: 10, car: { aero: 84, engine: 95, chassis: 85, rel: 84 },
    base: 'Esslingen, Germany', founded: 1962, titles: 6, engine: 'Brennhart (works)', tp: { name: 'Konrad Seidel', skill: 1.05, amb: 1 },
    blurb: 'The German manufacturer’s works team. Precise, well funded and very hard to beat once they get a car right.' },
  { id: 1, name: 'Whitmore Racing', wins0: 176, short: 'WHI', color: '#ff7a1a', prestige: 9, car: { aero: 92, engine: 80, chassis: 87, rel: 80 },
    base: 'Banbury, United Kingdom', founded: 1966, titles: 8, engine: 'Brennhart (customer)', tp: { name: 'Andrew Calloway', skill: 1.1, amb: 2 },
    blurb: 'A proud British privateer with a famous orange livery. Back at the front after a long rebuild.' },
  { id: 2, name: 'Scuderia Valerio', wins0: 243, short: 'VAL', color: '#d62839', prestige: 8, car: { aero: 76, engine: 86, chassis: 84, rel: 86 },
    base: 'Modena, Italy', founded: 1949, titles: 11, engine: 'Valerio (works)', tp: { name: 'Paolo Ferretti', skill: 0.95, amb: 3 },
    blurb: 'The oldest name on the grid and the one every driver dreams of. Huge pressure, huger expectations.' },
  { id: 3, name: 'Voltra Racing', wins0: 121, short: 'VOL', color: '#1e2a78', prestige: 7, car: { aero: 84, engine: 70, chassis: 80, rel: 78 },
    base: 'Bicester, United Kingdom', founded: 2005, titles: 5, engine: 'Kaze (customer)', tp: { name: 'Stefan Gruber', skill: 1.1, amb: 2 },
    blurb: 'Owned by an Austrian energy drink giant. Aggressive, fast-moving and never shy of a bold driver call.' },
  { id: 4, name: 'Fairbourne Racing', wins0: 114, short: 'FAI', color: '#1f6fe0', prestige: 6, car: { aero: 68, engine: 84, chassis: 70, rel: 76 },
    base: 'Didcot, United Kingdom', founded: 1977, titles: 9, engine: 'Brennhart (customer)', tp: { name: 'James Hartley', skill: 1.05, amb: 0 },
    blurb: 'A legendary family team that fell on hard times. New owners, new money and a slow climb back up.' },
  { id: 5, name: 'Ashgrove Racing', wins0: 2, short: 'ASH', color: '#0f7a55', prestige: 5, car: { aero: 78, engine: 66, chassis: 72, rel: 74 },
    base: 'Towcester, United Kingdom', founded: 1991, titles: 0, engine: 'Valerio (customer)', tp: { name: 'Mike Rennick', skill: 0.9, amb: 3 },
    blurb: 'Backed by a billionaire owner with big ambitions and a brand-new factory. Results haven’t caught up yet.' },
  { id: 6, name: 'Lumière F1 Team', wins0: 35, short: 'LUM', color: '#ff5aa5', prestige: 4, car: { aero: 64, engine: 78, chassis: 68, rel: 71 },
    base: 'Magny-Cours, France', founded: 1981, titles: 2, engine: 'Lumière (works)', tp: { name: 'Céline Garnier', skill: 0.95, amb: 1 },
    blurb: 'France’s national team in all but name. Brilliant on its day, chaotic on most others.' },
  { id: 7, name: 'Kaze Racing', wins0: 0, short: 'KAZ', color: '#8b5cf6', prestige: 3, car: { aero: 68, engine: 64, chassis: 75, rel: 69 },
    base: 'Cologne, Germany', founded: 2009, titles: 0, engine: 'Kaze (works)', tp: { name: 'Hiroshi Kanda', skill: 1.0, amb: 0 },
    blurb: 'The racing arm of a Japanese manufacturer, run from a German base. Patient, methodical, still chasing a first win.' },
  { id: 8, name: 'Alpenwerk Racing', wins0: 1, short: 'ALP', color: '#7ed957', prestige: 2, car: { aero: 72, engine: 58, chassis: 66, rel: 67 },
    base: 'Zürich, Switzerland', founded: 1993, titles: 0, engine: 'Lumière (customer)', tp: { name: 'Beat Zellweger', skill: 1.0, amb: -1 },
    blurb: 'A quiet Swiss independent with a reputation for finding young talent and selling it on.' },
  { id: 9, name: 'Ridgeline F1', wins0: 0, short: 'RID', color: '#f5b700', prestige: 1, car: { aero: 56, engine: 70, chassis: 62, rel: 65 },
    base: 'Charlotte, USA', founded: 2016, titles: 0, engine: 'Valerio (customer)', tp: { name: 'Dale Mercer', skill: 0.9, amb: 1 },
    blurb: 'America’s scrappy underdog. Small budget, smart people and a habit of punching above its weight.' }
];

/* nama, negara, umur, pace, cons, race, wet, tyre, pasukan, nombor, potensi, bio */
var BASE_DRIVERS = [
  ['Jonas Albrecht', 'DE', 31, 91, 90, 87, 85, 88, 0, 8, 91, 'Two-time world champion. Relentless, metronomic, rarely makes a mistake.'],
  ['Leo Castellani', 'IT', 21, 89, 80, 86, 80, 79, 0, 12, 96, 'Brennhart academy prodigy. Blindingly quick, still a bit raw.'],
  ['Oliver Hale', 'GB', 27, 92, 86, 89, 84, 84, 1, 4, 93, 'Reigning world champion and the face of the Whitmore revival.'],
  ['Ryan Kellett', 'AU', 25, 90, 85, 85, 80, 83, 1, 22, 93, 'Cool-headed Australian. Few words, lots of speed.'],
  ['Antoine Sauvage', 'FR', 28, 90, 84, 86, 82, 82, 2, 19, 91, 'Electric over one lap. The tifosi already adore him.'],
  ['Matteo Ruggeri', 'IT', 33, 89, 90, 85, 88, 86, 2, 7, 89, 'Home hero at Valerio. Calm, experienced and lethal in the wet.'],
  ['Thiago Valença', 'BR', 27, 93, 85, 90, 86, 82, 3, 11, 94, 'Three-time champion. Ruthless wheel-to-wheel and loves a fight.'],
  ['Kenta Arakawa', 'JP', 24, 84, 80, 83, 78, 80, 3, 24, 89, 'Promoted from the Voltra junior programme. Under pressure to deliver.'],
  ['Callum Ashby', 'GB', 30, 85, 86, 83, 82, 85, 4, 23, 86, 'Fairbourne’s steady hand. Great feedback, great with tyres.'],
  ['Javier Lozano', 'ES', 32, 86, 87, 84, 83, 84, 4, 30, 86, 'Four-time race winner chasing one more shot at the front.'],
  ['Lars Kjær', 'DK', 36, 83, 88, 82, 85, 86, 5, 6, 83, 'Grizzled Dane. Rain specialist and the paddock’s dry wit.'],
  ['Nathan Desrosiers', 'CA', 26, 79, 76, 78, 74, 76, 5, 26, 82, 'The owner’s protégé. Quicker than his critics think, slower than he thinks.'],
  ['Hugo Lemaire', 'FR', 29, 83, 82, 82, 80, 80, 6, 45, 85, 'Lumière’s local favourite. One podium away from a breakthrough.'],
  ['Emiliano Robles', 'MX', 24, 81, 76, 82, 76, 75, 6, 34, 88, 'Fearless Mexican with a huge fanbase and a few too many crashes.'],
  ['Sebastian Vogt', 'DE', 34, 81, 86, 80, 79, 84, 7, 9, 82, 'Veteran German who knows every circuit by heart.'],
  ['Freddie Marsh', 'GB', 20, 80, 72, 79, 74, 72, 7, 42, 92, 'Junior series runner-up and the youngest driver on the grid.'],
  ['Aleksi Rautio', 'FI', 30, 79, 85, 77, 80, 83, 8, 21, 82, 'Quiet Finn. Consistent, tidy and very hard to rattle.'],
  ['Blake Harrow', 'NZ', 22, 79, 74, 79, 75, 73, 8, 15, 88, 'Kiwi talent spotted in single-seaters down under.'],
  ['Jamie Thornton', 'GB', 28, 77, 80, 76, 74, 78, 9, 28, 80, 'Ridgeline lifer. Has dragged the car into the points more than once.'],
  ['Cole Matthews', 'US', 21, 76, 72, 77, 70, 72, 9, 38, 87, 'The first American on the grid in a decade. The home crowd loves him.']
];
var ROOKIE_NAMES = ['Ivo Brandão', 'Lukas Hofer', 'Remy Delacroix', 'Tobias Kerr', 'Aiden Walsh', 'Matías Ortega', 'Sven Dahl', 'Kenji Ohara', 'Rafael Quintero', 'Felix Aubert', 'Oscar Lindqvist', 'Gianluca Serra', 'Pablo Ferrán', 'Noah Visser'];
var ROOKIE_NAT = { 'Ivo Brandão': 'BR', 'Lukas Hofer': 'AT', 'Remy Delacroix': 'FR', 'Tobias Kerr': 'GB', 'Aiden Walsh': 'IE', 'Matías Ortega': 'AR', 'Sven Dahl': 'SE', 'Kenji Ohara': 'JP', 'Rafael Quintero': 'ES', 'Felix Aubert': 'BE', 'Oscar Lindqvist': 'SE', 'Gianluca Serra': 'IT', 'Pablo Ferrán': 'ES', 'Noah Visser': 'NL' };

/* wear = kadar haus tayar, ot = kesukaran memotong (0-1), pw = pengaruh enjin, rain = peluang hujan, pit = kos lorong pit (s) */
var CIRCUITS = [
  { name: 'GP Cempaka Raya', loc: 'Lembah Cempaka', laps: 22, base: 97.0, km: 5.5, wear: 1.0, ot: 0.50, pw: 0.55, rain: 0.40, pit: 14 },
  { name: 'GP Costa Vermelha', loc: 'Costa Vermelha', laps: 24, base: 88.5, km: 4.6, wear: 1.25, ot: 0.60, pw: 0.45, rain: 0.10, pit: 13 },
  { name: 'GP Monte Albrecht', loc: 'Monte Albrecht (street circuit)', laps: 28, base: 73.0, km: 3.3, wear: 0.80, ot: 0.95, pw: 0.30, rain: 0.25, pit: 12 },
  { name: 'GP Hanabi', loc: 'Teluk Hanabi', laps: 22, base: 93.0, km: 5.3, wear: 1.10, ot: 0.55, pw: 0.50, rain: 0.30, pit: 15 },
  { name: 'GP Sierra Alta', loc: 'Sierra Alta', laps: 24, base: 84.0, km: 4.3, wear: 1.30, ot: 0.45, pw: 0.60, rain: 0.05, pit: 13 },
  { name: 'GP Nordkap', loc: 'Nordkap', laps: 20, base: 101.0, km: 6.0, wear: 0.90, ot: 0.50, pw: 0.55, rain: 0.45, pit: 16 },
  { name: 'GP Dunmere', loc: 'Dunmere Moor', laps: 24, base: 90.0, km: 4.9, wear: 0.90, ot: 0.50, pw: 0.45, rain: 0.50, pit: 14 },
  { name: 'GP Valle Dorado', loc: 'Valle Dorado', laps: 26, base: 80.0, km: 4.0, wear: 1.00, ot: 0.70, pw: 0.35, rain: 0.15, pit: 13 },
  { name: 'GP Seri Mutiara', loc: 'Seri Mutiara', laps: 22, base: 92.0, km: 5.0, wear: 1.10, ot: 0.50, pw: 0.50, rain: 0.35, pit: 14 },
  { name: 'GP Aurelia', loc: 'Aurelia Bay', laps: 26, base: 86.0, km: 5.0, wear: 1.00, ot: 0.60, pw: 0.60, rain: 0.20, pit: 14 }
];

var COMP = {
  S: { k: 'S', n: 'Soft', off: 0.00, life: 12, rate: 0.095, opt: 0, col: '#ff5468' },
  M: { k: 'M', n: 'Medium', off: 0.55, life: 19, rate: 0.055, opt: 0, col: '#ffd23f' },
  H: { k: 'H', n: 'Hard', off: 1.00, life: 28, rate: 0.035, opt: 0, col: '#e9ecf1' },
  I: { k: 'I', n: 'Inter', off: 1.20, life: 22, rate: 0.050, opt: 0.42, col: '#3ddc84' },
  W: { k: 'W', n: 'Wet', off: 2.00, life: 30, rate: 0.040, opt: 0.85, col: '#5aa9ff' }
};
var PTS = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1];
var SKILLS = [
  ['pace', 'Pace', 'Raw one-lap and race speed.'],
  ['cons', 'Consistency', 'Fewer mistakes, steadier pace.'],
  ['race', 'Racecraft', 'Overtaking, defending and staying out of trouble.'],
  ['wet', 'Wet weather', 'Speed on a wet track.'],
  ['tyre', 'Tyres', 'Longer tyre life.'],
  ['fb', 'Feedback', 'Speeds up your team\'s car development.']
];
var ARCHS = {
  pace: { n: 'The Speedster', d: 'Raw pace. A little shaky in the rain.', b: { pace: 10, race: 3, tyre: 3 } },
  cons: { n: 'The Ice Man', d: 'Rarely makes mistakes and looks after the tyres.', b: { cons: 10, tyre: 8, wet: 2 } },
  wet: { n: 'Rain Master', d: 'Shines when the track is wet.', b: { wet: 16, cons: 4 } },
  race: { n: 'The Overtaker', d: 'Fearless wheel-to-wheel.', b: { race: 12, pace: 4 } }
};

function mkCode(name, used) {
  var p = name.split(' ');
  var s = p[p.length - 1].normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z]/g, '').toUpperCase().slice(0, 3);
  while (s.length < 3) s += 'X';
  var c = s, i = 1;
  while (used[c]) { c = s.slice(0, 2) + String.fromCharCode(65 + i); i++; }
  used[c] = 1; return c;
}

function newCareer(name, arch, teamId) {
  var used = {};
  var S = {
    v: 2, season: 1, round: 0, pi: 19, contract: 2, xp: 8, rd: 'aero', results: [], rdLog: [], hist: [],
    settings: { mini: true, ask: true, v: 3 }, cal: shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]),
    career: { starts: 0, wins: 0, pods: 0, poles: 0, pts: 0, fl: 0, titles: 0, dnf: 0 }, arch: arch, reserves: []
  };
  S.teams = TEAMS.map(function (t) {
    return {
      id: t.id, name: t.name, short: t.short, color: t.color, prestige: t.prestige, pts: 0, wins: 0,
      car: Object.assign({}, t.car), base: Object.assign({}, t.car)
    };
  });
  /* pemandu yang paling lemah dalam pasukan pilihan beri tempat kepada pemain, jadi pemandu simpanan */
  var mates = BASE_DRIVERS.filter(function (b) { return b[8] === teamId; }), bench = teamId == null ? null : (mates[0][3] < mates[1][3] ? mates[0] : mates[1]);
  var list = BASE_DRIVERS.filter(function (b) { return b !== bench; }).slice(0, 19);
  function mk(b, i) {
    return {
      id: i, name: b[0], nat: b[1], age: b[2], pace: b[3], cons: b[4], race: b[5], wet: b[6], tyre: b[7], fb: 60 + Math.round(rnd() * 20),
      team: b[8], num: b[9], pot: b[10], bio: b[11], code: mkCode(b[0], used), pts: 0, wins: 0, pods: 0, poles: 0, starts: 0, dnf: 0, fl: 0
    };
  }
  S.drivers = list.map(mk);
  if (bench) { var r = mk(bench, -1); r.team = -1; S.reserves.push(r); }
  var taken = {}; S.drivers.forEach(function (d) { taken[d.num] = 1; });
  var nums = shuffle([2, 3, 5, 10, 13, 17, 25, 27, 33, 44, 47, 50, 51, 66, 88, 99].filter(function (n) { return !taken[n]; }));
  var p = { id: 19, name: name, nat: 'MY', age: 19, pace: 66, cons: 66, race: 66, wet: 66, tyre: 66, fb: 66, team: teamId, num: nums.pop(), code: mkCode(name, used), pts: 0, wins: 0, pods: 0, poles: 0, starts: 0, dnf: 0, fl: 0, pot: 90, bio: 'Rookie' };
  var bonus = ARCHS[arch].b;
  for (var k in bonus) p[k] += bonus[k];
  S.drivers.push(p);
  if (typeof drvInit === 'function') drvInit(S);
  return S;
}

/* Radio jurutera dan tajuk akhbar (rekaan, ringan, loghat harian) */
var RADIO = {
  start: ['Engineer: Lights out. Please don\'t fall asleep.', 'Engineer: Okay, we\'re racing. Breakfast can wait.', 'Engineer: Go, go, go! Your mum is watching.'],
  gain: ['Engineer: Wow, you flew! What did you have for breakfast?', 'Engineer: Clean move. I\'m saving that clip.', 'Engineer: Lovely. Don\'t get too proud just yet.'],
  lose: ['Engineer: Ah, he\'s through. No drama, we\'ll take it back.', 'Engineer: Right, no crying in the helmet. Focus.', 'Engineer: He\'s only a bit quicker. A bit. Okay, a lot.'],
  fuel: ['Engineer: That tank is not an oil well. Save some fuel!', 'Engineer: Fuel is getting tight. Don\'t floor it everywhere.', 'Engineer: Keep this up and we\'ll be pushing the car to the line.'],
  tyre: ['Engineer: Those tyres are tired. Like me on a Monday.', 'Engineer: Your tyres are still alive. Barely.', 'Engineer: Grip is fading. Don\'t trust the corners too much.'],
  lead: ['Engineer: You\'re leading. Eyes forward, not on the mirrors.', 'Engineer: P1! Nothing silly now, please.'],
  idle: ['Engineer: All good. Drink some water. Oh wait, you can\'t.', 'Engineer: Great rhythm. No idea why. Don\'t change anything.', 'Engineer: The boss wants to know if you fancy a coffee after this.', 'Engineer: Car behind is dreaming about a move. Let him dream.'],
  sc: ['Engineer: Safety car! Time to think, not time to panic.', 'Engineer: Everyone\'s queued up. Like the coffee line at 8 a.m.'],
  dnf: ['Engineer: ...Okay. See you in the garage. Please don\'t throw the helmet.', 'Engineer: It happens. Even cars need a day off sometimes.'],
  slowpit: ['Engineer: Pit crew... did we just wake up?', 'Engineer: Slow stop. I\'ll have a word with the crew.'],
  fastpit: ['Engineer: Lovely stop! Pizza for the crew tonight.', 'Engineer: Mega stop! Crew, you\'ve all earned a raise.']
};
var HEAD = {
  win: ['HOMETOWN GOES WILD: {n} WINS, BUYS PIZZA FOR THE WHOLE STREET', '{n} IS CHAMPION! ENGINEER SPOTTED CRYING ON THE PIT WALL', 'TRACK KING: {n} GIVES THE REST NO CHANCE'],
  pod: ['{n} Takes the Podium, Mum Already Planning the Party', '{n} on the Podium: "Champagne Is for Spraying, Not Drinking"', 'Podium Again! {n} Starts Building a Fan Club'],
  pts: ['{n} Scores Points, Boss Almost Smiles', '{n} Cracks the Top Ten: "Not Bad at All"', 'First Points of the Season? {n} Says "Patience"'],
  mid: ['{n} Finishes Mid-Pack: "We\'re Still Hungry"', '{n} Comfortable in the Midfield, Points Not So Much', '{n}: "Car Was Fine, Luck Wasn\'t"'],
  back: ['{n} Brings Up the Rear: "Wrong Tyres, Not Me"', '{n} Races Alone. Lovely View From the Back', '{n} Learns Patience. Lots of It'],
  dnf: ['{n} Out Early: Car Decides to Take a Nap', '{n} Stranded. Crew Didn\'t Even Get Lunch', 'That\'s All, Folks: {n} Pushed Back to the Garage']
};
