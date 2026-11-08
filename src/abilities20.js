'use strict';
var ABILITIES = {
  qualifier: { n: 'Qualifying Instinct', d: '0.10s faster qualifying.', effect: { q: 0.10 }, need: '3 F1 poles' },
  racer: { n: 'Race Rhythm', d: '0.06s faster race pace.', effect: { r: 0.06 }, need: '5 F1 points finishes' },
  raincraft: { n: 'Rain Craft', d: 'Up to 0.12s faster in wet conditions.', effect: { wet: 0.12 }, need: '3 wet F1 finishes' },
  strategist: { n: 'Strategic Calm', d: '4% less tyre wear and 6% less mistake risk.', effect: { tyre: 0.96, risk: 0.94 }, need: '8 clean F1 finishes' },
  technical: { n: 'Technical Insight', d: '4% stronger positive car-development feedback, within the combined feedback limit.', effect: { feedback: 0.04 }, need: '12 F1 starts' },
  composure: { n: 'Composure', d: '8% less mistake risk.', effect: { risk: 0.92 }, need: '10 clean F1 finishes' },
  tyrecraft: { n: 'Tyre Savant', d: '6% less tyre wear.', effect: { tyre: 0.94 }, need: '15 clean F1 finishes' },
  legend: { n: "Champion's Edge", d: '0.08s faster qualifying/race pace and 6% less mistake risk. Uses one normal slot; active only as Legend.', effect: { q: 0.08, r: 0.08, risk: 0.94 }, need: 'Reach Legend' }
};
var ABILITY_RULES = { starter: { pace: 'qualifier', race: 'racer', wet: 'raincraft', cons: 'strategist', tech: 'technical' }, visits: [1, 3, 5, 8, 12], paceLimit: 0.30, riskMin: 0.60, riskMax: 1.65 };
function masteryLevel(visits) { return ABILITY_RULES.visits.filter(function (n) { return visits >= n; }).length; }
function abilitiesInit(game) {
  if (game.mode !== 'pro') return;
  var p = progressionPlayer(game);
  if (p.abilities) return;
  var starter = ABILITY_RULES.starter[game.arch] || 'qualifier';
  p.abilities = { owned: [starter], priority: [starter], mastery: {}, stats: {}, seen: {}, locked: null };
  /* Recover factual personal visits; reserve stand-ins have no personal th.me entry. */
  Object.keys(game.th || {}).forEach(function (ci) { var c = CIRCUITS[+ci]; if (c) p.abilities.mastery[c.key] = game.th[ci].filter(function (r) { return !!r.me; }).length; });
  (game.rr || []).forEach(function (r) {
    var x = r.c.filter(function (x) { return x[7] === p.uid && x[5]; })[0];
    if (!x) return;
    p.abilities.seen[r.key] = true;
    abilityMilestoneStats(p.abilities, r.league || 'f1', x[2], x[4], false, false);
  });
  if (game.round > 0 || game.live || p.mind.locked && p.mind.locked.key === trainingKey(game) || p.evaluation.capture && p.evaluation.capture.key === trainingKey(game)) p.abilities.locked = { season: game.season, league: leagueOf(game), ids: [], neutral: true };
  abilityUnlock(game);
}
function abilityMilestoneStats(a, league, pos, grid, wet, clean) {
  var s = a.stats[league] = a.stats[league] || { starts: 0, poles: 0, points: 0, wet: 0, clean: 0 };
  s.starts++; if (grid === 1) s.poles++; if (pos > 0 && pos <= 10) s.points++;
  if (pos > 0 && wet) s.wet++; if (pos > 0 && clean) s.clean++;
}
function abilityUnlock(game) {
  var p = progressionPlayer(game), a = p.abilities, s = a.stats.f1 || {};
  var checks = { qualifier: s.poles >= 3, racer: s.points >= 5, raincraft: s.wet >= 3, strategist: s.clean >= 8, technical: s.starts >= 12, composure: s.clean >= 10, tyrecraft: s.clean >= 15, legend: p.evaluation.tier === 3 };
  Object.keys(checks).forEach(function (id) { if (checks[id] && a.owned.indexOf(id) < 0) a.owned.push(id); });
}
function abilitySlots(p, tier) { return EVALUATION.slots[Math.floor(clamp(tier == null ? p.evaluation.tier : tier, 0, 3))]; }
function selectedAbilities(p, tier) {
  return p.abilities.priority.filter(function (id, i, list) { return list.indexOf(id) === i && ABILITIES[id] && p.abilities.owned.indexOf(id) >= 0 && (id !== 'legend' || (tier == null ? p.evaluation.tier : tier) === 3); }).slice(0, abilitySlots(p, tier));
}
function abilityEditable(game) {
  if (game.mode !== 'pro' || game.sit || game.playerRetired || game.live) return false;
  var p = progressionPlayer(game), locked = p.abilities.locked;
  return game.round >= seasonRounds(game) && !!game.lastSummary || game.round === 0 && !(locked && locked.season === game.season && locked.league === leagueOf(game));
}
function abilityLock(game) {
  if (game.mode !== 'pro' || game.sit) return;
  var p = progressionPlayer(game), a = p.abilities;
  if (!a.locked || a.locked.season !== game.season || a.locked.league !== leagueOf(game)) a.locked = { season: game.season, league: leagueOf(game), ids: selectedAbilities(p), neutral: false };
}
function activeAbilityIds(game) {
  var p = progressionPlayer(game), lock = p.abilities.locked;
  if (lock && lock.season === game.season && lock.league === leagueOf(game) && game.round < seasonRounds(game)) return lock.neutral ? [] : lock.ids.filter(function (id) { return id !== 'legend' || p.evaluation.tier === 3; }).slice(0, abilitySlots(p));
  return selectedAbilities(p);
}
function abilityEffects(game, ci, di) {
  var e = { q: 0, r: 0, wet: 0, risk: 1, tyre: 1, feedback: 0, mastery: 0 };
  if (game.mode !== 'pro' || game.worldAI || game.sit || di != null && di !== game.pi) return e;
  var p = progressionPlayer(game), a = p.abilities, lock = a.locked;
  var locked = lock && lock.season === game.season && lock.league === leagueOf(game) && game.round < seasonRounds(game);
  if (locked && lock.neutral) return e;
  var ids = activeAbilityIds(game);
  ids.filter(function (id, i) { return ids.indexOf(id) === i && a.owned.indexOf(id) >= 0 && ABILITIES[id] && (id !== 'legend' || p.evaluation.tier === 3); }).slice(0, abilitySlots(p)).forEach(function (id) {
    var b = ABILITIES[id].effect;
    ['q', 'r', 'wet', 'feedback'].forEach(function (k) { e[k] += b[k] || 0; });
    e.risk *= b.risk || 1; e.tyre *= b.tyre || 1;
  });
  var c = CIRCUITS[ci], level = c ? masteryLevel(a.mastery[c.key] || 0) : 0;
  e.mastery = level * 0.02; e.risk *= Math.pow(0.99, level);
  e.q = Math.min(0.20, e.q); e.r = Math.min(0.20, e.r); e.wet = Math.min(0.15, e.wet);
  e.risk = clamp(e.risk, 0.8, 1); e.tyre = clamp(e.tyre, 0.90, 1); e.feedback = Math.min(0.05, e.feedback);
  return e;
}
function combinedPace(focus, bonus, qualifying, wet) {
  bonus = bonus || { q: 0, r: 0, wet: 0, mastery: 0 };
  return clamp(focusPace(focus) - (qualifying ? bonus.q : bonus.r) - bonus.mastery - bonus.wet * clamp(wet || 0, 0, 1), -ABILITY_RULES.paceLimit, ABILITY_RULES.paceLimit);
}
function combinedRisk(R, f) { return clamp(focusRisk(R, f) * (f.ability ? f.ability.risk : 1), ABILITY_RULES.riskMin, ABILITY_RULES.riskMax); }
function abilityCapParts(game, k, tier) {
  var p = progressionPlayer(game), a = p.abilities;
  var expert = a ? Object.keys(a.mastery).filter(function (key) { return masteryLevel(a.mastery[key]) >= 4; }).length : 0;
  var mastery = Math.min(3, Math.floor(expert / 4)), legend = (tier == null ? p.evaluation.tier : tier) === 3 ? 2 : 0;
  var legacy = p.capBreakers && Number.isFinite(p.capBreakers[k]) ? Math.floor(clamp(p.capBreakers[k], 0, 5)) : 0;
  return { mastery: mastery, legend: legend, legacy: legacy, total: Math.min(5, mastery + legend + legacy) };
}
function abilityRace(game, R) {
  if (game.mode !== 'pro' || game.sit) return;
  var p = progressionPlayer(game), a = p.abilities, key = 'race-' + leagueOf(game) + '-' + game.season + '-' + game.round;
  if (a.seen[key]) return;
  a.seen[key] = true;
  var x = R.cls.filter(function (r) { return r.car.isP; })[0], ci = CIRCUITS[R.ci].key;
  a.mastery[ci] = (a.mastery[ci] || 0) + 1;
  abilityMilestoneStats(a, leagueOf(game), x.dnf ? 0 : x.pos, x.car.grid, !!R.wetRace, !x.dnf && !(x.car.evalSpins || x.car.pen));
  abilityUnlock(game);
}
function abilityPriority(game, id, action) {
  if (!abilityEditable(game)) return false;
  var p = progressionPlayer(game), a = p.abilities;
  if (action === 'auto') {
    var starter = ABILITY_RULES.starter[game.arch];
    a.priority = a.owned.slice().sort(function (x, y) { return (x === 'legend' && p.evaluation.tier === 3 ? -2 : x === starter ? -1 : 0) - (y === 'legend' && p.evaluation.tier === 3 ? -2 : y === starter ? -1 : 0); }); return true;
  }
  if (!ABILITIES[id] || a.owned.indexOf(id) < 0) return false;
  var i = a.priority.indexOf(id);
  if (action === 'toggle') { if (i < 0) a.priority.push(id); else a.priority.splice(i, 1); }
  else if (action === 'up' && i > 0) { a.priority.splice(i, 1); a.priority.splice(i - 1, 0, id); }
  else return false;
  return true;
}
function abilitiesHTML(review) {
  if (S.mode !== 'pro' || S.sit) return '';
  var p = progressionPlayer(S), a = p.abilities, editable = abilityEditable(S), selected = activeAbilityIds(S), parts = abilityCapParts(S, 'pace'), v = p.evaluation.review;
  var h = '<div class="card stack" id="ability-loadout"><h3>Abilities &amp; mastery</h3><p>' + selected.length + '/' + abilitySlots(p) + ' active slots · ' + (editable ? 'Loadout open' : 'Loadout locked until the season break') + '</p><p class="dim">Priority decides which eligible abilities stay active if slots fall. Owned abilities are never deleted. Change the queue before your first weekend or at season review.</p>';
  h += a.priority.map(function (id, i) { return '<div class="row sp" style="flex-wrap:wrap"><span>' + (i + 1) + '. ' + ABILITIES[id].n + ' · ' + (selected.indexOf(id) >= 0 ? 'Active' : 'Standby') + '</span><button class="btn sm" data-act="ability-up" data-v="' + id + '" ' + (!editable || i === 0 ? 'disabled' : '') + '>Move up</button></div>'; }).join('');
  h += '<button class="btn sm" data-act="ability-auto" ' + (!editable ? 'disabled' : '') + '>Recommend order</button><details><summary>Owned abilities and unlocks</summary>';
  h += Object.keys(ABILITIES).map(function (id) { var b = ABILITIES[id], owned = a.owned.indexOf(id) >= 0; return '<div class="card"><b>' + b.n + '</b><p class="dim">' + b.d + '</p>' + (owned ? '<button class="btn sm" data-act="ability-toggle" data-v="' + id + '" ' + (!editable ? 'disabled' : '') + '>' + (a.priority.indexOf(id) >= 0 ? 'Remove from queue' : 'Add to queue') + '</button>' : '<small>Unlock: ' + b.need + '</small>') + '</div>'; }).join('');
  h += '</details><p class="dim">Cap Breaker: mastery +' + parts.mastery + ', Legend +' + parts.legend + (parts.legacy ? ', existing save +' + parts.legacy : '') + '. Combined maximum +5 per stat; absolute stat limit 99. Four circuits at mastery 4 grant +1 mastery cap, up to +3.</p>';
  if (review && v) h += '<p>Next active queue: ' + selected.map(function (id) { return ABILITIES[id].n; }).join(', ') + '. Slots ' + v.slotsBefore + ' → ' + v.slotsAfter + '; Legend cap component +' + (v.from === 3 ? 2 : 0) + ' → +' + (v.to === 3 ? 2 : 0) + '. Mastery is retained. Above-cap stats adjust gradually in the annual preview.</p>';
  h += '<details><summary>Circuit mastery</summary><div class="scroll"><table class="t"><thead><tr><th>Circuit</th><th>Visits</th><th>Mastery</th></tr></thead><tbody>' + GTG_TRACKS.map(function (t) { var visits = a.mastery[t[1]] || 0; return '<tr><td>' + t[2] + '</td><td>' + visits + '</td><td>' + masteryLevel(visits) + '/5</td></tr>'; }).join('') + '</tbody></table></div><p class="dim">Levels at 1/3/5/8/12 personal race visits, including juniors. Each level gives 0.02s local pace and 1% lower mistake risk, within combined limits. Repeated saves never add visits.</p></details><p class="dim">Combined Focus, ability and mastery pace is capped at ±0.30s/lap; mistake multiplier 0.60–1.65; ability tyre wear at 0.90–1.00. No XP or annual body-wear bonuses.</p></div>';
  return h;
}
