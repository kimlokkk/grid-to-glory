'use strict';
/* Save/data foundation. Legacy circuit indexes 0..9 and slot ids remain compatible. */
var GTG_SCHEMA = 2;
var GTG_LEAGUES = { f1: { rounds: 22, seats: 20 }, f2: { rounds: 8, seats: 20 }, f3: { rounds: 8, seats: 30 } };
/* ci, stable key, name, laps, km, base, wear, passing difficulty, power, rain, pit */
var GTG_TRACKS = [
  [0,'cempaka-raya','Cempaka Raya',25,5.3,97,1.0,.58,.55,.40,14],
  [10,'longwei','Longwei',24,5.5,99,1.25,.40,.65,.30,15],
  [3,'hanabi','Hanabi',24,5.6,98,1.25,.58,.35,.30,15],
  [11,'maravela','Maravela',26,4.9,89,1.0,.58,.55,.25,14],
  [12,'ile-laurent','Île Laurent',28,4.4,81,1.0,.40,.60,.30,13],
  [2,'monte-albrecht','Monte Albrecht',30,3.4,73,.80,.95,.30,.25,12],
  [13,'sol-de-vega','Sol de Vega',25,5.2,92,1.25,.58,.40,.10,15],
  [14,'falkenring','Falkenring',30,4.2,76,1.0,.40,.65,.30,13],
  [6,'dunmere','Dunmere',24,5.8,102,1.25,.58,.35,.50,15],
  [5,'nordkap','Nordkap',20,6.8,116,1.0,.40,.55,.50,17],
  [7,'valle-dorado','Valle Dorado',29,4.4,80,1.25,.85,.35,.10,13],
  [15,'duinveld','Duinveld',29,4.3,79,1.25,.88,.35,.30,14],
  [16,'velocera','Velocera',25,5.7,92,.80,.40,.75,.30,15],
  [17,'kaspira','Kaspira',23,6.1,105,1.0,.40,.65,.10,16],
  [8,'seri-mutiara','Seri Mutiara',25,5.5,96,1.25,.40,.50,.50,15],
  [18,'senja-marina','Senja Marina',26,4.9,98,1.25,.88,.35,.30,16],
  [19,'redstone-hills','Redstone Hills',24,5.6,98,1.0,.58,.50,.30,15],
  [4,'sierra-alta','Sierra Alta',28,4.4,82,1.25,.40,.65,.05,13],
  [1,'costa-vermelha','Costa Vermelha',29,4.3,80,1.25,.40,.45,.30,13],
  [20,'lumen-city','Lumen City',22,6.2,103,.80,.40,.75,.05,16],
  [21,'qamar-dunes','Qamar Dunes',25,5.4,94,1.25,.58,.35,.05,15],
  [9,'aurelia','Aurelia',26,5.2,92,1.0,.58,.55,.10,14]
];
GTG_TRACKS.forEach(function (x) {
  var profile = { name: 'GP ' + x[2], loc: x[2], raceLaps: x[3], km: x[4], base: x[5], wear: x[6], ot: x[7], pw: x[8], rain: x[9], pit: x[10] };
  if (!CIRCUITS[x[0]]) CIRCUITS[x[0]] = Object.assign({}, profile, { laps: x[3] });
  CIRCUITS[x[0]].key = x[1]; CIRCUITS[x[0]].pro = profile;
});
function leagueOf(game) { return game.jr && game.jr.on ? 'f2' : game.league || 'f1'; }
function seasonRounds(game) { return game && game.cal ? game.cal.length : 10; }
function seasonCalendar(game) {
  if (game.mode !== 'pro') return shuffle([0,1,2,3,4,5,6,7,8,9]);
  var ids = GTG_TRACKS.map(function (t) { return t[0]; });
  return leagueOf(game) === 'f1' ? ids : [0,3,2,6,5,7,1,9];
}
function circuitFor(game, ci) {
  var c = CIRCUITS[ci];
  return game && game.mode === 'pro' && c ? Object.assign({}, c, c.pro, { distanceScale: c.pro.km / 5.3 }) : c;
}
function raceDistance(R) { return R.distanceScale || 1; }
function seasonMilestone(game, legacyRound) { return game.mode === 'pro' ? Math.max(1, Math.round(legacyRound * seasonRounds(game) / 10)) : legacyRound; }
function personId(game, person) {
  game.meta = game.meta || {}; game.meta.nextPersonId = game.meta.nextPersonId || 1;
  game.people = game.people || {};
  if (!person.uid) { do { person.uid = 'person-' + game.meta.nextPersonId++; } while (game.people[person.uid]); }
  return person.uid;
}
function syncPeople(game) {
  game.people = game.people || {};
  Object.keys(game.people).forEach(function (uid) { if (['active', 'reserve', 'junior', 'f1', 'f2', 'f3'].indexOf(game.people[uid].role) >= 0) game.people[uid].role = 'archived'; });
  function sync(d, role, league) {
    if (!d) return;
    var uid = personId(game, d), e = game.people[uid] || { uid: uid, seasons: [] };
    e.name = d.name; e.nat = d.nat; e.role = role; e.league = league || leagueOf(game); e.team = d.team == null ? -1 : d.team;
    (d.sh || []).forEach(function (r) { if (!e.seasons.some(function (x) { return x.s === r.s && x.league === (r.league || league || leagueOf(game)); })) e.seasons.push(Object.assign({}, r, { league: r.league || league || leagueOf(game) })); });
    game.people[uid] = e;
  }
  (game.retired || []).forEach(function (d) { sync(d, 'retired', d.league); });
  (game.juniors || []).forEach(function (d) { sync(d, 'junior'); });
  (game.reserves || []).forEach(function (d) { sync(d, 'reserve'); });
  (game.drivers || []).forEach(function (d) { sync(d, 'active'); });
  sync(game.bench, 'reserve');
  if (game.world) Object.keys(game.world.leagues).forEach(function (league) { var v = game.world.leagues[league]; v.drivers.forEach(function (d) { sync(d, league, league); }); v.reserves.forEach(function (d) { sync(d, 'reserve', league); }); });
}
function foundationInit(game) {
  game.mode = game.mode || 'classic'; if (['classic', 'pro'].indexOf(game.mode) < 0) throw new Error('Unsupported career mode'); game.league = game.league || (game.jr && game.jr.on ? 'f2' : 'f1');
  game.meta = game.meta || {}; game.events = game.events || []; game.people = game.people || {};
  game.wallet = game.wallet || { balance: 0, ledger: [] };
  if (game.mode === 'pro' && !GTG_LEAGUES[leagueOf(game)]) throw new Error('Unsupported league');
  if (!game.cal) game.cal = seasonCalendar(game);
  if (game.mode === 'pro' && JSON.stringify(game.cal) !== JSON.stringify(seasonCalendar(game))) throw new Error('Invalid Pro calendar');
  var all = (game.drivers || []).concat(game.reserves || [], game.juniors || [], game.retired || [], game.bench ? [game.bench] : [], worldPeople(game));
  all.forEach(function (d) { var n = /^person-(\d+)$/.exec(d.uid || ''); if (n) game.meta.nextPersonId = Math.max(game.meta.nextPersonId || 1, +n[1] + 1); });
  syncPeople(game);
  game.playerUid = personId(game, game.bench || game.drivers[game.pi]);
  (game.rr || []).forEach(function (r) { if (!r.circuitId && CIRCUITS[r.ci]) r.circuitId = CIRCUITS[r.ci].key; });
  if (game.meta.rng == null) game.meta.rng = _s;
  worldInit(game, false);
  syncPeople(game);
  progressionInit(game);
  limitCareerTerms(game);
  marketInit(game);
  juniorInit(game);
  careerInit(game);
  worldValidate(game);
  game.saveVer = GTG_SCHEMA;
  game.schemaVersion = GTG_SCHEMA;
  return game;
}
/* Existing records remain authoritative; events point to those facts, never invent a second result. */
function recordEvent(game, kind, data) {
  game.meta = game.meta || {}; game.events = game.events || [];
  var e = { id: 'event-' + ((game.meta.nextEventId = (game.meta.nextEventId || 0) + 1)), kind: kind, season: game.season, round: game.round, league: leagueOf(game), data: data };
  game.events.push(e); game.events = game.events.slice(-1000); return e;
}
/* Internal F1 prototype; public Pro onboarding still waits for the junior-career phases. */
function newProCareer(name, arch, team, league) {
  return newCareer(name, arch, team, { mode: 'pro', league: league || 'f1' });
}
function simulateWeekend(game, options) {
  if (game.mode === 'pro' && (game.playerRetired || progressionPlayer(game).age >= AGEING.retireAt)) throw new Error('This driver has retired');
  options = options || {}; if (game.round >= seasonRounds(game)) throw new Error('Season is complete');
  var ci = game.cal[game.round], R = runRace2(game, ci, qualiGrid2(game, ci), options), fl = null;
  R.cars.forEach(function (f) { if (!f.dnf && f.best < 900 && (!fl || f.best < fl.best)) fl = f; });
  R.fl = { di: fl ? fl.di : -1, t: fl ? fl.best : 0 };
  var old = { ci: ci, c: R.c, wetRace: R.w && R.w.type !== 'kering', fl: R.fl, cls: R.cls.map(function (f) { return { car: { d: f.d, di: f.di, isP: f.isP, team: f.team, grid: f.grid, dnf: f.dnf, evalOrder: !!f.evalOrder, evalOrderCredit: f.evalOrderCredit || 0, evalSpins: f.evalSpins || 0, pen: f.pen || 0 }, pos: f.pos, dnf: !!f.dnf }; }) };
  var result = finishRace(game, old, 0); game.meta.rng = _s;
  return { race: R, result: result };
}
