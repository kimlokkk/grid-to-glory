'use strict';
/* One world clock: F1, F2 and F3 advance together. F2/F3 race on 10 of the 22 F1 weekends. */
var syncOldFinish = finishRace;
finishRace = function (S, R, mg) {
  var out = syncOldFinish(S, R, mg);
  if (S.mode === 'pro' && S.world && !S.worldAI) worldSyncTo(S, worldWeekend(leagueOf(S), S.round - 1));
  return out;
};
function syncWeekend(game) { return game.mode === 'pro' ? worldWeekend(leagueOf(game), Math.min(game.round, seasonRounds(game) - 1)) : game.round; }
function syncStatus(game, league) {
  var p = worldProgress(game), len = league === 'f1' ? 22 : JUNIOR_WEEKENDS.length;
  return { done: league === leagueOf(game) ? game.round : (game.world.prepared === game.season ? len : p[league] || 0), total: len };
}

/* Dynamic ceiling: performance against the car moves every stat cap by up to +/-1 a season (total +/-3);
   an academy membership at season end adds one extra +1, once. */
var capOldAnnual = applyAnnualChange;
applyAnnualChange = function (g) {
  var p = progressionPlayer(g), already = !!(p.body && p.body.appliedSeason >= g.season + 1);
  var v = capOldAnnual(g);
  if (!already && g.mode === 'pro' && !v.retire && p.growthCaps) {
    var e = evaluationSummary(g), delta = e && e.sts != null ? (e.sts >= 62 ? 1 : e.sts <= 38 ? -1 : 0) : 0;
    p.capDrift = p.capDrift || 0;
    var next = clamp(p.capDrift + delta, -3, 3), move = next - p.capDrift;
    if (g.market8 && g.market8.academy && !p.capAcademy) { p.capAcademy = true; move += 1; }
    if (move) PROGRESSION.stats.forEach(function (k) { p.growthCaps[k] = clamp(p.growthCaps[k] + move, 40, 99); });
    p.capDrift = next;
  }
  return v;
};
