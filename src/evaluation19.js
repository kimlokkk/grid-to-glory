'use strict';
var EVALUATION = {
  tiers: ['Prospect', 'Star', 'Superstar', 'Legend'], slots: [1, 2, 3, 4],
  thresholds: [0, 58, 66, 72], protection: 2, margin: 5, minCoverage: 0.5,
  weights: { performance: 0.4, h2h: 0.25, consistency: 0.15, achievement: 0.2 }
};
function mechanicalDNF(x) { return !!x.dnf && /mechanical/i.test(String(x.car ? x.car.dnf || '' : x.dnf)); }
function evaluationInit(game) {
  if (game.mode !== 'pro') return;
  var p = progressionPlayer(game);
  if (!p.evaluation) p.evaluation = { tier: 0, everLegend: false, weakSeasons: 0, races: [], seasons: [], capture: null, closed: null, f1Titles: 0 };
  if (game.live && game.live.r === game.round && !p.evaluation.capture) p.evaluation.legacyLive = trainingKey(game);
}
function evaluationSkill(d) { return d.pace * 0.4 + d.cons * 0.2 + d.race * 0.2 + d.wet * 0.1 + d.tyre * 0.1; }
function evaluationExpected(game, ci, d) {
  var c = circuitFor(game, ci), mine = carPerf3(game.teams[d.team], c, P2.v3).r - worldSetup(game.teams[d.team]) / P2.carK;
  var carExpected = 1;
  game.drivers.forEach(function (other) {
    if (other.id === d.id) return;
    var power = carPerf3(game.teams[other.team], c, P2.v3).r - worldSetup(game.teams[other.team]) / P2.carK;
    carExpected += 1 / (1 + Math.exp((mine - power) / 2));
  });
  var mate = mateOf(game, d), skill = evaluationSkill(d), mateSkill = mate ? evaluationSkill(mate) : skill;
  return { expected: clamp(carExpected + (80 - skill) * 0.12, 1, game.drivers.length), carExpected: carExpected,
    skill: skill, mateSkill: mateSkill, mateId: mate ? mate.id : null, mateUid: mate ? mate.uid : null,
    h2hExpected: 1 / (1 + Math.exp((mateSkill - skill) / 8)), carPower: mine };
}
function evaluationPrepare(game, ci) {
  if (game.mode !== 'pro' || game.worldAI || game.sit) return null;
  evaluationInit(game);
  var p = progressionPlayer(game), e = p.evaluation, key = trainingKey(game);
  if (e.legacyLive === key) return null;
  if (e.capture && e.capture.key === key) return e.capture;
  e.capture = Object.assign(evaluationExpected(game, ci, p), { key: key, ci: ci, season: game.season, league: leagueOf(game), round: game.round, team: p.team });
  return e.capture;
}
function evaluationRace(game, R) {
  if (game.mode !== 'pro' || game.sit) return;
  var p = progressionPlayer(game), e = p.evaluation, key = trainingKey(game);
  if (e.races.some(function (r) { return r.key === key; })) return;
  var x = R.cls.filter(function (r) { return r.car.isP; })[0], snap = e.capture;
  var excluded = mechanicalDNF(x) ? 'Mechanical DNF: excluded from performance and H2H.' : !snap || snap.key !== key ? 'No pre-race expectation: ungraded.' : null;
  var row = { key: key, season: game.season, league: leagueOf(game), round: game.round, excluded: excluded, pos: x.pos, dnf: !!x.dnf };
  if (!excluded) {
    var mate = R.cls.filter(function (r) { return r.car.di === snap.mateId; })[0];
    var credit = clamp(x.car.evalOrderCredit || 0, -1, 1), pos = clamp(x.pos - credit, 1, game.drivers.length);
    row.snapshot = JSON.parse(JSON.stringify(snap)); row.order = !!x.car.evalOrder;
    row.performance = x.dnf ? 0 : clamp(50 + (snap.expected - pos) * 6, 0, 100);
    row.h2h = !mate || mechanicalDNF(mate) || row.order || mate.car.evalOrder || x.dnf && mate.dnf ? null : clamp(50 + ((mate.dnf || !x.dnf && x.pos < mate.pos ? 1 : 0) - snap.h2hExpected) * 100, 0, 100);
    row.h2hWin = row.h2h == null ? null : !x.dnf && (mate.dnf || x.pos < mate.pos);
    row.consistency = x.dnf ? 0 : Math.max(0, 100 - ((x.car.evalSpins || 0) + (x.car.pen > 0 ? 1 : 0)) * 25);
    row.achievement = x.dnf ? 0 : x.pos === 1 ? 100 : x.pos <= 3 ? 85 : x.pos <= 10 ? 60 : 40;
    var weight = 0, score = 0;
    Object.keys(EVALUATION.weights).forEach(function (k) { if (row[k] != null) { weight += EVALUATION.weights[k]; score += row[k] * EVALUATION.weights[k]; } });
    row.sts = score / weight;
  }
  e.races.push(row); e.latest = row;
}
function evaluationSummary(game) {
  var e = progressionPlayer(game).evaluation;
  var rows = e.races.filter(function (r) { return r.season === game.season && r.league === leagueOf(game); });
  var valid = rows.filter(function (r) { return !r.excluded; }), h2h = valid.filter(function (r) { return r.h2h != null; });
  return { season: game.season, league: leagueOf(game), rounds: seasonRounds(game), n: valid.length, excluded: rows.length - valid.length,
    sts: valid.length ? valid.reduce(function (sum, r) { return sum + r.sts; }, 0) / valid.length : null,
    h2hWins: h2h.filter(function (r) { return r.h2hWin; }).length, h2hRaces: h2h.length };
}
function tierPreview(game) {
  var e = progressionPlayer(game).evaluation, now = evaluationSummary(game), tier = e.tier;
  var history = e.seasons.filter(function (s) { return s.league === 'f1' && s.season < game.season && s.sts != null && s.n >= Math.ceil(s.rounds * EVALUATION.minCoverage); }).slice(-1);
  var eligible = now.league === 'f1' && now.sts != null && now.n >= Math.ceil(now.rounds * EVALUATION.minCoverage);
  var recent = history.concat(now.sts == null ? [] : [now]), avg = recent.length ? recent.reduce(function (sum, s) { return sum + s.sts; }, 0) / recent.length : null;
  var titles = (game.hist || []).filter(function (h) { return h.pos === 1 && !h.jr && (h.league === 'f1' || !h.league && leagueOf(game) === 'f1'); }).length;
  var target = tier, weak = e.weakSeasons, reason = 'Not enough assessed F1 races; tier is protected.';
  if (eligible) {
    target = 0;
    for (var i = 1; i < 4; i++) if (avg >= EVALUATION.thresholds[i] && now.sts >= EVALUATION.thresholds[i] - EVALUATION.margin && (i < 3 || titles >= 3)) target = i;
    if (target < tier) {
      var poor = now.sts < EVALUATION.thresholds[tier] - EVALUATION.margin && avg < EVALUATION.thresholds[tier] - EVALUATION.margin;
      weak = poor ? weak + 1 : 0;
      target = weak >= EVALUATION.protection ? tier - 1 : tier;
      reason = poor ? (target < tier ? 'Two consecutive weak assessed seasons: down one tier.' : 'First weak season: warning, tier protected. Stronger results can clear it.') : 'Current recovery protects your tier.';
      if (target < tier) weak = 0;
    } else { weak = 0; reason = target > tier ? 'Promotion earned from assessed performance.' : 'Tier maintained by assessed performance.'; }
  }
  return { summary: now, average: avg, from: tier, to: target, weakSeasons: weak, titles: titles, reason: reason,
    slotsBefore: EVALUATION.slots[tier], slotsAfter: EVALUATION.slots[target] };
}
function evaluationClose(game) {
  if (game.mode !== 'pro' || game.sit) return;
  var e = progressionPlayer(game).evaluation, key = game.season + ':' + leagueOf(game);
  if (e.closed === key) return e.review;
  var v = tierPreview(game);
  e.seasons.push(v.summary); e.tier = v.to; e.weakSeasons = v.weakSeasons; e.f1Titles = v.titles;
  e.everLegend = e.everLegend || e.tier === 3; e.closed = key; e.review = v;
  abilityUnlock(game);
  return v;
}
function evaluationMarketBonus(game, d) {
  if (game.mode !== 'pro' || !d.evaluation) return 0;
  var e = d.evaluation, current = evaluationSummary(game), s = current.n >= Math.ceil(current.rounds * EVALUATION.minCoverage) ? current : e.review ? e.review.summary : current;
  return s.sts == null || s.n < Math.ceil(s.rounds * EVALUATION.minCoverage) ? 0 : clamp((s.sts - 50) / 12 + e.tier * 0.5, -3, 5);
}
function evaluationCardHTML(review) {
  if (S.mode !== 'pro' || S.sit) return '';
  var e = progressionPlayer(S).evaluation, s = review && e.review ? e.review.summary : evaluationSummary(S), r = e.latest;
  return '<div class="card stack" id="performance-review"><h3>Performance &amp; tier</h3><div class="chips">' + chip('Tier', EVALUATION.tiers[e.tier]) + chip('Ability slots', EVALUATION.slots[e.tier]) + chip('Season STS', s.sts == null ? 'Unrated' : s.sts.toFixed(1) + '/100') + chip('H2H', s.h2hWins + '/' + s.h2hRaces) + '</div><p class="dim">' + s.n + ' assessed races · ' + s.excluded + ' excluded. STS uses car-relative results, teammate strength, clean driving and achievements. Mechanical DNF is excluded, not scored as zero. Team-order comparisons are excluded from H2H.</p>' +
    (review && e.review ? '<p>' + e.review.reason + ' Two-season STS: ' + (e.review.average == null ? 'Unrated' : e.review.average.toFixed(1)) + '. Slots: ' + e.review.slotsBefore + ' → ' + e.review.slotsAfter + '.</p>' : '') +
    (r ? '<p class="dim">Latest race: ' + (r.excluded || 'Expected P' + r.snapshot.expected.toFixed(1) + ' before racing; finished P' + r.pos + '. STS ' + r.sts.toFixed(1) + '. Pre-race teammate win expectation: ' + Math.round(r.snapshot.h2hExpected * 100) + '%' + (r.order ? '. Team order: one-place credit applied; H2H excluded.' : '.')) + '</p>' : '') +
    '<p class="dim">Rookie reviews use available history only. A first weak season gives a warning; recovery can clear it. Legend needs three F1 titles and current performance. Tier never discounts XP or reduces wear.' + (e.everLegend ? ' Career record: previously Legend.' : '') + '</p></div>';
}

function evaluationObjectiveProtection(game) {
  var s = evaluationSummary(game);
  if (s.n === 0 && s.excluded === 0) return 'No pre-race evidence for this saved season; no new performance strike.';
  if (s.excluded > 0 && (s.n < Math.ceil(s.rounds * EVALUATION.minCoverage) || s.sts >= 50)) return 'Mechanical/ungraded races excluded; assessed driving does not justify a performance strike.';
  return null;
}
