'use strict';
/* Pro progression tuning. Classic keeps its original XP economy. */
var PROGRESSION = {
  stats: ['pace', 'cons', 'race', 'wet', 'tyre', 'fb'],
  maxStat: 99, maxCapBreaker: 5,
  caps: {
    pace: { pace: 99, cons: 94, race: 93, wet: 88, tyre: 89, fb: 87 },
    cons: { pace: 92, cons: 99, race: 91, wet: 89, tyre: 95, fb: 90 },
    wet: { pace: 93, cons: 94, race: 90, wet: 99, tyre: 88, fb: 89 },
    race: { pace: 95, cons: 90, race: 99, wet: 88, tyre: 91, fb: 90 },
    tech: { pace: 88, cons: 94, race: 90, wet: 89, tyre: 93, fb: 99 }
  },
  cost: { base: 2, step: 10, nearCap: 10, premiumStep: 2, scale: 1.75 },
  annual: { f3: 90, f2: 105, f1: 120 },
  bonuses: { performance: 60, objectives: 24, manual: 6, facilities: 6 }
};
function baseOverall(d) {
  return PROGRESSION.stats.reduce(function (sum, k) { return sum + (Number.isFinite(d[k]) ? d[k] : 66); }, 0) / PROGRESSION.stats.length;
}
function progressionPlayer(game) { return game.bench || game.drivers[game.pi]; }
function progressionInit(game) {
  (game.drivers || []).concat(game.reserves || [], game.juniors || [], game.retired || [], game.bench ? [game.bench] : []).forEach(function (d) {
    if (!Number.isFinite(d.fb)) d.fb = Math.round((d.pace + d.cons + d.race + d.wet + d.tyre) / 5);
  });
  if (game.mode !== 'pro') return;
  var p = progressionPlayer(game), caps = PROGRESSION.caps[game.arch] || PROGRESSION.caps.pace;
  /* Existing stats above a new cap are retained, never silently removed. */
  if (!p.growthCaps) {
    p.growthCaps = {};
    PROGRESSION.stats.forEach(function (k) { p.growthCaps[k] = Math.min(99, Math.max(caps[k], p[k])); });
  }
  ageingInit(game);
  trainingInit(game);
  evaluationInit(game);
  abilitiesInit(game);
  if (!game.progression || game.progression.season !== game.season || game.progression.league !== leagueOf(game)) {
    game.progression = { season: game.season, league: leagueOf(game), earned: {}, fractions: {}, receipts: {} };
  }
}
function statCap(game, k) {
  if (PROGRESSION.stats.indexOf(k) < 0) return 0;
  if (game.mode !== 'pro') return 99;
  progressionInit(game);
  var p = progressionPlayer(game);
  return ageStatCap(game, k, p.body.wear);
}
function proSkillCost(v, game, k) {
  var c = PROGRESSION.cost, gap = statCap(game, k) - v;
  return Math.max(1, Math.ceil((c.base + Math.floor((v - 40) / c.step) + Math.ceil(Math.max(0, c.nearCap - gap) / c.premiumStep)) * c.scale));
}
/* Receipts make each reward source once-only for each weekend, including reloads. */
function progressionXP(game, source, amount) {
  progressionInit(game);
  var g = game.progression, key = game.round + ':' + source;
  if (g.receipts[key]) return 0;
  g.receipts[key] = true;
  var cap = source === 'base' ? PROGRESSION.annual[leagueOf(game)] : PROGRESSION.bonuses[source];
  if (!Number.isFinite(cap) || !Number.isFinite(amount)) return 0;
  var total = (g.fractions[source] || 0) + Math.max(0, amount);
  var award = Math.min(Math.max(0, cap - (g.earned[source] || 0)), Math.floor(total + 1e-8));
  g.fractions[source] = total - Math.floor(total + 1e-8);
  g.earned[source] = (g.earned[source] || 0) + award;
  return award;
}
function proRaceXP(game, P, mg, fastest) {
  var snap = progressionPlayer(game).evaluation.capture;
  var expected = snap && snap.key === trainingKey(game) ? snap.expected : evaluationExpected(game, game.cal[game.round], progressionPlayer(game)).expected;
  var performance = P.dnf ? 0 : clamp((expected - P.pos) / 12 + (P.pos <= 3 ? 0.35 : 0) + (fastest ? 0.1 : 0), 0, 1);
  return progressionXP(game, 'base', PROGRESSION.annual[leagueOf(game)] / seasonRounds(game)) +
    progressionXP(game, 'performance', performance * PROGRESSION.bonuses.performance / seasonRounds(game)) +
    progressionXP(game, 'manual', clamp((mg || 0) / 8, 0, 1) * PROGRESSION.bonuses.manual / seasonRounds(game));
}

function proManualBonus(mg) {
  var avg = function (a) { return a && a.length ? a.reduce(function (sum, q) { return sum + q; }, 0) / a.length : 0.5; };
  return [mg.q, mg.s, avg(mg.pn), avg(mg.bq)].reduce(function (sum, q) { return sum + Math.max(0, (q == null ? 0.5 : q) - 0.5) * 4; }, 0);
}
