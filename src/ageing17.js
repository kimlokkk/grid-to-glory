'use strict';
/* Pro annual care tuning; no race-result, mood or tier multipliers. */
var AGEING = {
  fitness: 70, care: 0.5, minStat: 40, retirePrompt: 36, retireAt: 42,
  bands: [[30, 0, 0], [33, 1.8, 1], [36, 3.0, 2], [39, 4.5, 2.5], [42, 6.0, 3]],
  sensitivity: { pace: 0.7, cons: 0.2, race: 0.15, wet: 0.4, tyre: 0.2, fb: 0.05 },
  capAdjustment: 1
};
function ageingInit(game) {
  if (game.mode !== 'pro') return;
  var p = progressionPlayer(game);
  /* No retrospective wear/age/stat deductions on an existing save. */
  if (!p.body) p.body = { fitness: AGEING.fitness, care: AGEING.care, wear: 0, carry: {}, appliedSeason: game.season };
}
function careerNextYears(game) { return Math.max(0, AGEING.retireAt - 1 - progressionPlayer(game).age); }
function careerRetirementDue(game) { return game.mode === 'pro' && progressionPlayer(game).age + 1 >= AGEING.retireAt; }
function limitCareerTerms(game) {
  if (game.mode !== 'pro') return;
  var p = progressionPlayer(game), current = Math.max(0, AGEING.retireAt - p.age), next = careerNextYears(game);
  game.contract = Math.min(game.contract, current);
  if (p.age >= AGEING.retireAt) game.playerRetired = true;
  if (p.con) {
    p.con.end = Math.min(p.con.end, game.season + current - 1);
    if (p.con.opt && p.con.end + 1 >= game.season + current) p.con.opt = null;
  }
  if (game.offers) game.offers = game.offers.filter(function (o) { return next > 0 && (!o.sit || next > 1); }).map(function (o) {
    o.years = Math.min(o.years, next); if (o.years >= next) o.opt = false; return o;
  });
}
function ageStatCap(game, k, wear) {
  var p = progressionPlayer(game), bonus = abilityCapParts(game, k).total;
  return clamp(p.growthCaps[k] + bonus - Math.floor(wear * AGEING.sensitivity[k] + 1e-8), AGEING.minStat, PROGRESSION.maxStat);
}
/* Pure preview: no RNG, rewards, stat changes or cached forecasts. */
function annualPreview(game) {
  var p = progressionPlayer(game), b = p.body, age = p.age + 1, retire = age >= AGEING.retireAt;
  var band = AGEING.bands.filter(function (x) { return age < x[0]; })[0] || AGEING.bands[AGEING.bands.length - 1];
  var care = clamp(b.care, 0, 1), fitness = clamp(b.fitness, 0, 100);
  var rate = retire ? 0 : band[1] * clamp(1.35 - fitness / 200 - care * 0.2, 0.6, 1.35);
  var wear = +(b.wear + rate).toFixed(4), nextFitness = retire ? fitness : clamp(fitness + Math.round((care - 0.5) * 4) - band[2], 0, 100);
  var rows = PROGRESSION.stats.map(function (k) {
    var total = (b.carry[k] || 0) + rate * AGEING.sensitivity[k], natural = Math.floor(total + 1e-8);
    var cap = ageStatCap(game, k, wear), settle = retire ? 0 : Math.min(AGEING.capAdjustment, Math.max(0, p[k] - cap));
    /* Cap adjustment overlaps natural wear; it is never an additional penalty. */
    var loss = retire ? 0 : Math.min(Math.max(0, p[k] - AGEING.minStat), Math.max(natural, settle));
    return { k: k, before: p[k], after: p[k] - loss, loss: loss, wearLoss: natural, capLoss: settle,
      capBefore: ageStatCap(game, k, b.wear), capAfter: cap, carry: +(total - natural).toFixed(6) };
  });
  return { season: game.season + 1, ageBefore: p.age, age: age, retire: retire,
    fitnessBefore: fitness, fitness: nextFitness, wearBefore: b.wear, wear: wear, rate: rate, rows: rows };
}
function applyAnnualChange(game) {
  ageingInit(game);
  var p = progressionPlayer(game), b = p.body;
  if (b.appliedSeason >= game.season + 1) return b.last;
  var v = annualPreview(game);
  p.age = v.age; b.fitness = v.fitness; b.wear = v.wear;
  v.rows.forEach(function (r) { p[r.k] = r.after; b.carry[r.k] = r.carry; });
  b.appliedSeason = v.season; b.last = v;
  if (v.retire) game.playerRetired = true;
  return v;
}
function bodyCardHTML() {
  if (S.mode !== 'pro') return '';
  var b = progressionPlayer(S).body;
  return '<div class="card"><h3>Fitness &amp; care</h3><div class="chips">' + chip('Fitness', b.fitness.toFixed(1) + '/100') + chip('Career wear', b.wear.toFixed(1)) + '</div><p class="dim">Higher Fitness and consistent care reduce annual wear. Wear affects your development caps; pace fades faster than racecraft and feedback.</p></div>';
}
function annualPreviewHTML() {
  if (S.mode !== 'pro') return '';
  var v = annualPreview(S);
  return '<div class="card stack" id="annual-preview"><h3>Next-season preview</h3><div class="chips">' + chip('Age', v.ageBefore + ' → ' + v.age) + chip('Fitness', v.fitnessBefore.toFixed(1) + ' → ' + v.fitness.toFixed(1)) + chip('Wear', v.wearBefore.toFixed(1) + ' → ' + v.wear.toFixed(1)) + '</div>' +
    (v.retire ? '<p>You will turn '+AGEING.retireAt+'. Retirement is compulsory before another racing season.</p>' : '<p class="dim">One annual change. Wear and cap adjustment overlap: the larger loss applies once. XP is retained. This preview updates after any stat purchases.</p><div class="scroll"><table class="t"><thead><tr><th>Stat</th><th>Next value</th><th>Next cap</th><th>Net</th></tr></thead><tbody>' + v.rows.map(function (r) { return '<tr><td>' + ATTRN[r.k] + '</td><td class="mono">' + r.before + ' → ' + r.after + '</td><td class="mono">' + r.capBefore + ' → ' + r.capAfter + '</td><td class="mono">' + (r.loss ? '−' + r.loss : '0') + '</td></tr>'; }).join('') + '</tbody></table></div>') +
    (!v.retire && v.ageBefore >= AGEING.retirePrompt ? '<p class="dim">You can retire now or continue with a seat. Age '+(AGEING.retireAt-1)+' is your final racing season.</p>' : '') + '</div>';
}
