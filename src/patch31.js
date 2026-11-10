'use strict';
/* Patch 2 engine: talent, steeper XP, Mind ceiling, wider AI spread. */
PROGRESSION.annual.f1 = 105;
PROGRESSION.cost.steep = { from: 12, k: 0.5, pow: 1.6 };

/* ---- Topic 5: per-player talent (84..96, gifted 95..97) ---- */
function talentFor(name, seed) {
  var h1 = hashS(name + '|t1|' + seed), h2 = hashS(name + '|t2|' + seed), h3 = hashS(name + '|t3|' + seed), g = hashS(name + '|g|' + seed);
  if (g > 0.97) return 95 + Math.round(hashS(name + '|g2|' + seed) * 2);
  return clamp(Math.round(90 + (h1 + h2 + h3 - 1.5) * 6), 84, 94);
}
var p31OldInit = progressionInit;
progressionInit = function (game) {
  var fresh = false;
  if (game.mode === 'pro') { var p0 = progressionPlayer(game); fresh = !p0.growthCaps; if (fresh) p0.talentApplied = false; if (fresh && p0.talent == null) p0.talent = talentFor(p0.name, game.proSeed || (game.meta && game.meta.rng) || 0); }
  p31OldInit(game);
  if (game.mode === 'pro') {
    var p = progressionPlayer(game);
    if (fresh && p.talent != null && !p.talentApplied) {
      PROGRESSION.stats.forEach(function (k) { p.growthCaps[k] = clamp(p.growthCaps[k] + (p.talent - 90), Math.max(60, p[k]), 99); });
      p.talentApplied = true;
    }
  }
};

/* ---- steeper cost near the cap ---- */
proSkillCost = function (v, game, k) {
  var c = PROGRESSION.cost, gap = statCap(game, k) - v;
  var base = Math.ceil((c.base + Math.floor((v - 40) / c.step) + Math.ceil(Math.max(0, c.nearCap - gap) / c.premiumStep)) * c.scale);
  var extra = gap < c.steep.from ? Math.round(Math.pow(c.steep.from - gap, c.steep.pow) * c.steep.k) : 0;
  return Math.max(1, base + extra);
};

/* ---- Mind log (season mean confidence) ---- */
var p31OldFinish = finishRace;
finishRace = function (S, R, mg) {
  var out = p31OldFinish(S, R, mg);
  if (S.mode === 'pro' && !S.sit && !S.worldAI) {
    var p = progressionPlayer(S);
    if (p.mind) { var l = p.mindLog = p.mindLog && p.mindLog.season === S.season ? p.mindLog : { season: S.season, n: 0, sum: 0 }; l.n++; l.sum += p.mind.confidence; }
  }
  return out;
};

/* ---- wider AI / regen talent spread (pro worlds only) ---- */
var p31OldJunior = newJunior;
newJunior = function (S, age, opt) {
  if (S.mode !== 'pro' || (opt && opt.pot)) return p31OldJunior(S, age, opt);
  var r = rnd(), pot = Math.round(r < 0.04 ? rr(91, 97) : r < 0.22 ? rr(85, 91) : rr(66, 85));
  var j = p31OldJunior(S, age, Object.assign({}, opt, { pot: pot })); j.pay = Math.pow(rnd(), 2); return j;
};

/* ---- Topic 1: team setup/crew/coaching strength and team characters ---- */
var TEAM_CHARS = {
  young:   { name: 'Young-driver builder', xp: 0.15, setup: 0.10, note: '+15% XP, setup -0.1s' },
  setup:   { name: 'Setup specialist', setup: -0.15, xp: -0.05, note: 'setup +0.15s, coaching -5%' },
  crew:    { name: 'Pit-crew team', crew: -0.3, note: 'pit stops 0.3s quicker' },
  rain:    { name: 'Rain specialist', wet: -0.25, dry: 0.08, note: 'quicker in the wet, slower in the dry' },
  academy: { name: 'Academy-tied', discount: 0.25, exclusive: true, note: '25% cheaper seat, exclusive to the academy' }
};
var TEAM_CHAR_KEYS = ['young', 'setup', 'crew', 'rain', 'academy'];
var p31OldWorldTeams = worldTeams;
worldTeams = function (league) {
  var teams = p31OldWorldTeams(league), keys = [];
  TEAM_CHAR_KEYS.forEach(function (k) { keys.push(k, k); });
  for (var i = keys.length - 1; i > 0; i--) { var j = Math.floor(rnd() * (i + 1)), t = keys[i]; keys[i] = keys[j]; keys[j] = t; }
  teams.forEach(function (t, i) { t.char = keys[i % keys.length]; if (TEAM_CHARS[t.char].discount) t.seasonCost = +(t.seasonCost * (1 - TEAM_CHARS[t.char].discount)).toFixed(4); });
  return teams;
};
worldSetup = function (t) {
  if (!(t.spec && t.ops)) return 0;
  var c = TEAM_CHARS[t.char] || {}, v = clamp((0.5 - t.ops.setup) * 0.9, -0.35, 0.35) + (c.setup || 0);
  return clamp(v, -0.5, 0.5);
};
var p31OldCrew = crewTime;
crewTime = function (car) { var v = p31OldCrew(car), c = car.t && TEAM_CHARS[car.t.char]; return c && c.crew ? Math.max(1.9, v + c.crew) : v; };
function teamCharWet(team, R) {
  var c = team && team.spec && TEAM_CHARS[team.char]; if (!c || !c.wet) return 0;
  var wet = R && R.w && R.w.type && R.w.type !== 'kering';
  return wet ? c.wet : c.dry || 0;
}
function teamXpMult(game) {
  if (game.mode !== 'pro') return 1;
  var p = progressionPlayer(game), t = game.teams[p.team];
  if (!t || !t.spec || !t.ops) return 1;
  var c = TEAM_CHARS[t.char] || {};
  return clamp(1 + (t.ops.coaching - 0.5) * 0.3 + (c.xp || 0), 0.94, 1.3);
}
var p31OldXP = progressionXP;
progressionXP = function (game, source, amount) {
  var m = game.mode === 'pro' ? teamXpMult(game) : 1;
  if (m === 1 || source === 'manual' || source === 'objectives') return p31OldXP(game, source, amount);
  var lg = leagueOf(game), a0 = PROGRESSION.annual[lg], b0 = PROGRESSION.bonuses[source];
  PROGRESSION.annual[lg] = a0 * m; if (b0 != null) PROGRESSION.bonuses[source] = b0 * m;
  try { return p31OldXP(game, source, amount * m); } finally { PROGRESSION.annual[lg] = a0; if (b0 != null) PROGRESSION.bonuses[source] = b0; }
};
/* Annual drift: pull towards prestige-based level, results nudge, never more than 0.08 a year. */
var p31OldEconomy = worldJuniorEconomy;
worldJuniorEconomy = function (v, season) {
  var before = v.teams.map(function (t) { return Object.assign({}, t.ops || {}); });
  p31OldEconomy(v, season);
  var rank = v.teams.slice().sort(function (a, b) { return (b.pts || 0) - (a.pts || 0); }).map(function (t) { return t.id; });
  v.teams.forEach(function (t, i) {
    if (!t.ops) return;
    var pos = rank.indexOf(t.id), bonus = pos < 3 ? 0.015 : pos >= v.teams.length - 3 ? -0.015 : 0, pr = 10 - (t.id % 10), anchor = 0.35 + pr * 0.04;
    Object.keys(t.ops).forEach(function (k) {
      var o = before[i][k] != null ? before[i][k] : t.ops[k], d = (t.ops[k] - o) + (anchor - o) * 0.12 + bonus;
      t.ops[k] = clamp(o + clamp(d, -0.08, 0.08), 0.2, 0.95);
    });
  });
};

/* ---- Topic 2: minor/major regulation schedule ---- */
var p31OldInitDev = initDev;
initDev = function (S) {
  p31OldInitDev(S);
  if (S.mode === 'pro' && S.world && S.world.era && !S.regMinor) S.regMinor = S.season + 2 + Math.floor(rnd() * 2);
};
function regulationWatch(game) {
  if (game.mode !== 'pro' || !game.world) return null;
  var major = game.world.era.next, minor = game.regMinor || null, next = minor && minor < major ? { kind: 'minor', season: minor } : { kind: 'major', season: major };
  return { next: next, last: game.regLast || null, era: game.world.era.number, announced: game.world.era.announced === major };
}

/* ---- Topic 3: performance-based abilities (no trade-offs, no levels, hard to earn) ---- */
Object.assign(ABILITIES, {
  qualifier: { n: 'Qualifying Instinct', d: '0.10s faster qualifying.', effect: { q: 0.10 }, need: '8 F1 poles' },
  racer: { n: 'Race Rhythm', d: '0.06s faster race pace.', effect: { r: 0.06 }, need: '5 F1 wins' },
  raincraft: { n: 'Rain Craft', d: 'Up to 0.12s faster in wet conditions.', effect: { wet: 0.12 }, need: '3 wet F1 podiums including a win' },
  strategist: { n: 'Strategic Calm', d: '4% less tyre wear and 6% less mistake risk.', effect: { tyre: 0.96, risk: 0.94 }, need: '12 clean F1 top-5 finishes' },
  technical: { n: 'Technical Insight', d: '4% stronger positive car-development feedback, within the combined feedback limit.', effect: { feedback: 0.04 }, need: 'Beat your F1 team-mate 30 times' },
  composure: { n: 'Composure', d: '8% less mistake risk.', effect: { risk: 0.92 }, need: '20 clean F1 finishes in a row' },
  tyrecraft: { n: 'Tyre Savant', d: '6% less tyre wear.', effect: { tyre: 0.94 }, need: '5 F1 fastest laps' },
  opportunist: { n: 'Opportunist', d: '0.05s faster race pace.', effect: { r: 0.05 }, need: '4 F1 comebacks (gain 8+ places into the points)' },
  grandslam: { n: 'Pole to Flag', d: '0.06s faster qualifying and 0.04s faster race pace.', effect: { q: 0.06, r: 0.04 }, need: '3 F1 grand slams (pole, win and fastest lap)' },
  ironman: { n: 'Ironman', d: '10% less mistake risk.', effect: { risk: 0.90 }, need: '40 clean F1 finishes in a row' },
  podiummachine: { n: 'Podium Machine', d: '0.05s faster race pace and 4% less tyre wear.', effect: { r: 0.05, tyre: 0.96 }, need: '5 F1 podiums in a row' },
  charger: { n: 'Late Charger', d: '3% less tyre wear and 3% less mistake risk.', effect: { tyre: 0.97, risk: 0.97 }, need: '3 F1 wins from 8th or lower on the grid' },
  b_quali: { n: 'Sharp Lap', d: '0.03s faster qualifying. Junior basic ability.', effect: { q: 0.03 }, need: '2 junior poles', basic: true },
  b_race: { n: 'Steady Pace', d: '0.02s faster race pace. Junior basic ability.', effect: { r: 0.02 }, need: '2 junior wins', basic: true },
  b_wet: { n: 'Wet Learner', d: '0.04s faster in wet conditions. Junior basic ability.', effect: { wet: 0.04 }, need: '2 junior wet podiums', basic: true },
  b_clean: { n: 'Clean Racer', d: '3% less mistake risk. Junior basic ability.', effect: { risk: 0.97 }, need: '12 clean junior finishes', basic: true },
  b_tyre: { n: 'Tyre Sense', d: '2% less tyre wear. Junior basic ability.', effect: { tyre: 0.98 }, need: '4 junior podiums', basic: true }
});
function abilityExt(a, league) {
  a.ext = a.ext || {};
  return a.ext[league] = a.ext[league] || { starts: 0, poles: 0, wins: 0, pods: 0, fl: 0, slam: 0, wetPods: 0, wetWins: 0, clean: 0, cleanTop5: 0, beatMate: 0, comebacks: 0, charger: 0, cs: 0, bestCs: 0, ps: 0, bestPs: 0 };
}
function abilityExtSum(a, leagues, key) { return leagues.reduce(function (s, l) { var e = a.ext && a.ext[l]; return s + (e ? e[key] || 0 : 0); }, 0); }
function abilityExtMax(a, leagues, key) { return leagues.reduce(function (m, l) { var e = a.ext && a.ext[l]; return Math.max(m, e ? e[key] || 0 : 0); }, 0); }
var p31OldAbilityRace = abilityRace;
abilityRace = function (game, R) {
  if (game.mode !== 'pro' || game.sit) return;
  var p = progressionPlayer(game), a = p.abilities, key = 'race-' + leagueOf(game) + '-' + game.season + '-' + game.round, was = !!(a && a.seen[key]);
  p31OldAbilityRace(game, R);
  if (was) return;
  var x = R.cls.filter(function (r) { return r.car.isP; })[0]; if (!x) return;
  var e = abilityExt(a, leagueOf(game)), pos = x.dnf ? 0 : x.pos, grid = x.car.grid, wet = !!R.wetRace, clean = !x.dnf && !(x.car.evalSpins || x.car.pen);
  var mate = R.cls.filter(function (r) { return !r.car.isP && r.car.team === x.car.team; })[0];
  e.starts++;
  if (grid === 1) e.poles++;
  if (pos === 1) e.wins++;
  if (pos > 0 && pos <= 3) { e.pods++; e.ps++; e.bestPs = Math.max(e.bestPs, e.ps); } else e.ps = 0;
  var fl = R.fl && R.fl.di === x.car.di; if (fl) e.fl++;
  if (grid === 1 && pos === 1 && fl) e.slam++;
  if (wet && pos > 0 && pos <= 3) { e.wetPods++; if (pos === 1) e.wetWins++; }
  if (clean) { e.clean++; e.cs++; e.bestCs = Math.max(e.bestCs, e.cs); if (pos > 0 && pos <= 5) e.cleanTop5++; } else e.cs = 0;
  if (mate && pos > 0 && (mate.dnf || mate.pos > pos)) e.beatMate++;
  if (pos > 0 && pos <= 10 && grid - pos >= 8) e.comebacks++;
  if (pos === 1 && grid >= 8) e.charger++;
  abilityUnlock(game);
};
abilityUnlock = function (game) {
  var p = progressionPlayer(game), a = p.abilities; if (!a) return;
  var F = ['f1'], J = ['f3', 'f2'], S1 = function (k) { return abilityExtSum(a, F, k); }, SJ = function (k) { return abilityExtSum(a, J, k); };
  var checks = {
    qualifier: S1('poles') >= 9, racer: S1('wins') >= 16, raincraft: S1('wetPods') >= 10 && S1('wetWins') >= 3, strategist: S1('cleanTop5') >= 85,
    technical: S1('beatMate') >= 110, composure: abilityExtMax(a, F, 'bestCs') >= 25, tyrecraft: S1('fl') >= 18, opportunist: S1('comebacks') >= 12,
    grandslam: S1('slam') >= 2, ironman: abilityExtMax(a, F, 'bestCs') >= 40, podiummachine: abilityExtMax(a, F, 'bestPs') >= 8, charger: S1('charger') >= 6,
    legend: p.evaluation.tier === 3,
    b_quali: SJ('poles') >= 3, b_race: SJ('wins') >= 4, b_wet: SJ('wetPods') >= 4, b_clean: SJ('clean') >= 24, b_tyre: SJ('pods') >= 10
  };
  Object.keys(checks).forEach(function (id) { if (checks[id] && a.owned.indexOf(id) < 0) { a.owned.push(id); (a.log = a.log || {})[id] = p.age; } });
};

/* ---- Topic 4: limited interest, academy as a home, runway, buyouts ---- */
function marketInterestCap(g, tl) {
  var m = g.market8, p = progressionPlayer(g), e = evaluationSummary(g), sts = e && e.sts != null ? e.sts : 50;
  var cap = clamp(4 + Math.floor(Math.max(0, sts - 45) / 10), 4, 8), list = [];
  Object.keys(m.scouts).forEach(function (id) { var s = m.scouts[id]; if (s.kind === 'seat' && tl.indexOf(s.league) >= 0 && s.stage > 0) list.push(s); });
  list.sort(function (a, b) { return (b.score - b.threshold) - (a.score - a.threshold); });
  var strong = 0;
  list.forEach(function (s, i) {
    if (i >= cap) { s.stage = 0; s.capped = true; return; }
    if (s.stage === 2) { if (strong >= 3) s.stage = 1; else strong++; }
  });
  list.forEach(function (s) {
    if (s.stage > 0 && s.stage !== s.oldStage) { var t = worldView(g, s.league).teams[s.team]; marketNews(g, t.name + ' ' + (s.stage === 2 ? 'show strong interest' : 'are watching'), p.name + ' is being assessed for ' + s.league.toUpperCase() + '. ' + s.blocker + ' Interest is not a contract offer.'); }
  });
  /* Every stored scout without a fresh stage-change keeps its previous record; unlisted seat scouts are quiet. */
  Object.keys(m.scouts).forEach(function (id) { var s = m.scouts[id]; if (s.kind === 'seat' && tl.indexOf(s.league) >= 0 && list.indexOf(s) < 0) { s.stage = 0; } });
  /* A member of an academy no longer receives other academy approaches. */
  if (m.academy) Object.keys(m.scouts).forEach(function (id) { if (m.scouts[id].kind === 'academy') delete m.scouts[id]; });
}
function freedomRunway(g) {
  var m = g.market8; if (!m || !g.wallet) return null;
  var p = progressionPlayer(g), t = g.teams[p.team], league = leagueOf(g);
  var living = MARKET8.living, cost = league === 'f1' ? 0 : (t && t.seasonCost || 0) * (1 - (m.academy ? m.academy.support : 0)) * (m.commitment && m.commitment.package ? 0 : 1);
  var need = living + (league === 'f1' ? 0 : cost), seasons = need > 0 ? Math.floor(Math.max(0, g.wallet.balance) / need) : 99;
  return { balance: g.wallet.balance, seasons: seasons, perSeason: need };
}
/* Academy members have a home: seat routes arrive from the academy partner; other teams must pay the release. */
function academyPartner(g, league) {
  var a = g.market8 && g.market8.academy; if (!a) return null;
  if (a.partner == null) a.partner = Math.floor(hashS('partner|' + a.team) * 10);
  return a.partner;
}
var p31OldPublish = marketPublish;
marketPublish = function (g) {
  p31OldPublish(g);
  var m = g.market8, w = m.window, a = m.academy; if (!w || w.signed || !a || leagueOf(g) === 'f1' || a.until < g.season + 1) return;
  var targets = marketTargets(g).filter(function (l) { return l !== 'f1'; }), partner = academyPartner(g), p = progressionPlayer(g), pos = driverStandings(g).indexOf(p)+1;
  targets.forEach(function (l) {
    var teams = worldView(g, l).teams, t = teams[partner % teams.length];
    if (!t) return;
    var id = w.id + ':' + l + ':' + t.id + ':academy';
    if (pos <= 6 && !w.offers.some(function (o) { return o.id === id || (o.league === l && o.team === t.id && o.status === 'open'); })) {
      var o = marketOffer(g, l, t, true, false);
      if (o) { o.id = id; o.viaAcademy = true; o.reason = 'Academy route: ' + worldView(g, 'f1').teams[a.team].name + ' academy place you at ' + t.name + '.'; w.offers.push(o); marketNews(g, worldView(g, 'f1').teams[a.team].name + ' academy offer a seat route', t.name + ' ' + l.toUpperCase() + ' seat arranged through the academy.'); }
    }
  });
  w.offers.forEach(function (o) { if (o.status === 'open' && !o.viaAcademy && !o.protected && o.league !== 'f1' && !o.exit) { o.exit = a.release; o.package = Object.assign({}, o.package, { release: a.release, own: marketMoney(o.package.own + a.release) }); o.reason = (o.reason || '') + ' Leaving the academy costs a release fee.'; } });
  g.offers = w.offers.filter(function (o) { return o.status === 'open'; });
};
var p31OldAccept = marketAccept;
marketAccept = function (g, id) {
  var w = g.market8 && g.market8.window, o = w && w.offers.filter(function (x) { return x.id === id && x.status === 'open'; })[0];
  if (o && o.exit && g.market8.academy) {
    if (g.wallet.balance < o.package.own) return false;
    var rel = o.exit, pack = o.package; o.package = Object.assign({}, pack, { own: marketMoney(pack.own - rel), release: 0 });
    var saved = g.market8.academy; var ok = academyRelease(g);
    if (!ok) { o.package = pack; return false; }
    var res = p31OldAccept(g, id);
    if (!res) { g.market8.academy = saved; progressionPlayer(g).acad = saved.team; walletPost(g, 'academy-refund:' + g.season + ':' + saved.team, rel, 'Academy release refunded'); o.package = pack; }
    return res;
  }
  return p31OldAccept(g, id);
};

/* Safety net: a protected (floor) seat is never priced above what the driver actually holds. */
var p31OldPublish2 = marketPublish;
marketPublish = function (g) {
  p31OldPublish2(g);
  var w = g.market8 && g.market8.window; if (!w || !g.wallet) return;
  w.offers.forEach(function (o) { if (o.status === 'open' && o.protected && o.package && o.package.own > g.wallet.balance) o.package = Object.assign({}, o.package, { own: marketMoney(Math.max(0, g.wallet.balance)) }); });
  g.offers = w.offers.filter(function (o) { return o.status === 'open'; });
};

var p31OldPackage = marketPackage;
marketPackage = function (g, league, team, prot) {
  var k = p31OldPackage(g, league, team, prot);
  if (prot && g.wallet && k && k.own > g.wallet.balance) k = Object.assign({}, k, { own: marketMoney(Math.max(0, g.wallet.balance)) });
  return k;
};

/* Aero-testing handicap: back-to-back constructors' champions lose development time (Pro). */
var p31OldDevWinter = devWinter;
devWinter = function (S, log) {
  if (S.mode === 'pro' && S.world && S.teams && S.teams.length) {
    var champ = S.teams.slice().sort(function (a, b) { return b.pts - a.pts; })[0];
    if (S.titleRun && S.titleRun.id === champ.id) S.titleRun.n++; else S.titleRun = { id: champ.id, n: 1 };
    if (S.titleRun.n >= 2) { var cut = S.titleRun.n >= 3 ? 8 : 5; PARTS.forEach(function (k) { champ.car[k] = clamp(champ.car[k] - cut, 45, 99); }); }
  }
  if (S.mode === 'pro' && S.world && S.teams) S.teams.forEach(function (t) { if (t.prestige != null) t.prestige = clamp(t.prestige + (6 - t.prestige) * 0.12 + gauss() * 0.5, 2, 9.5); });
  return p31OldDevWinter(S, log);
};
