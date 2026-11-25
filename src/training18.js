'use strict';
/* Training spends the existing XP budget. Mind never changes XP earnings/costs. */
var TRAINING = {
  focuses: { simulator: 'Simulator', racecraft: 'Racecraft / Tyre', wet: 'Wet', technical: 'Technical', fitness: 'Fitness', recovery: 'Recovery' },
  goals: { balanced: 'Balanced', simulator: 'Pace / Consistency', racecraft: 'Racecraft / Tyre', wet: 'Wet', technical: 'Feedback', fitness: 'Fitness' },
  intensity: { light: { n: 'Light', load: 1, prep: 3, points: 1, fitness: 0.6 }, normal: { n: 'Normal', load: 3, prep: 6, points: 1, fitness: 1 }, hard: { n: 'Hard', load: 7, prep: 9, points: 2, fitness: 1.5 } },
  rest: 8, raceLoad: 4, recovery: 12, fitnessAnnual: 18, autoRecover: 55,
  paceMax: 0.18, riskMin: 0.65, riskMax: 1.65
};
function trainingKey(game) { return game.season + ':' + leagueOf(game) + ':' + game.round; }
function trainingInit(game) {
  if (game.mode !== 'pro') return;
  var p = progressionPlayer(game);
  if (!p.training) p.training = { mode: 'manual', goal: 'balanced', intensity: 'normal', slots: ['simulator', 'racecraft', 'recovery'], slotSources: {}, qualitySources: {} };
  if (!p.mind) {
    p.mind = { confidence: 50, momentum: 0, fatigue: 0, focus: 50, settled: null, locked: null };
    /* An imported live weekend must not receive retroactive training or a new Focus. */
    if (game.live && game.live.r === game.round) p.mind.locked = { key: trainingKey(game), focus: 50, preparation: 0, pressure: 0, fatigue: 0, spent: 0, gains: [], reasons: ['Existing weekend: neutral Focus retained.'] };
  }
}
function trainingSlots(p) { return 2 + Math.min(1, Object.keys(p.training.slotSources || {}).filter(function (k) { return !!p.training.slotSources[k]; }).length); }
function trainingQuality(p, game) { var team = game && game.teams[p.team], support = team && team.spec && team.ops ? team.ops.coaching * 0.1 : 0; return clamp(1 + support + Object.keys(p.training.qualitySources || {}).reduce(function (sum, k) { return sum + Math.max(0, +p.training.qualitySources[k] || 0); }, 0), 1, 1.15); }
function trainingSkills(focus) { return ({ simulator: ['pace', 'cons'], racecraft: ['race', 'tyre'], wet: ['wet'], technical: ['fb'] })[focus] || []; }
function weakestFocus(p) {
  var k = PROGRESSION.stats.slice().sort(function (a, b) { return p[a] - p[b]; })[0];
  return ({ pace: 'simulator', cons: 'simulator', race: 'racecraft', tyre: 'racecraft', wet: 'wet', fb: 'technical' })[k];
}
function effectiveTraining(p) {
  var t = p.training, n = trainingSlots(p), slots = t.slots.slice(0, n), intensity = t.intensity;
  if (t.mode === 'auto') {
    var focus = t.goal === 'balanced' ? weakestFocus(p) : t.goal;
    var canTrainFitness = p.body.fitness < 100 && (!t.year || t.year.fitness < TRAINING.fitnessAnnual);
    if (focus === 'fitness' && !canTrainFitness) focus = weakestFocus(p);
    slots = [focus, p.body.fitness < 65 && canTrainFitness ? 'fitness' : 'racecraft', 'recovery'].slice(0, n);
    if (p.mind.fatigue >= TRAINING.autoRecover) slots = slots.map(function () { return 'recovery'; });
    else if (p.mind.fatigue >= 35) slots[1] = 'recovery';
    if (p.mind.fatigue >= 25 && intensity === 'hard') intensity = 'light';
  }
  return { slots: slots, intensity: intensity };
}
function focusFromState(game, preparation, expected) {
  var p = progressionPlayer(game), m = p.mind;
  var pressure = clamp((p.miss || 0) * 3, 0, 9);
  var leader = driverStandings(game)[0];
  if (game.round >= seasonRounds(game) * 0.7 && p.pts > 0 && leader.pts - p.pts <= 25) pressure += 6;
  var focus = Math.round(clamp(50 + (m.confidence - 50) * 0.3 + m.momentum * 0.5 + preparation * 0.6 - m.fatigue * 0.4 - pressure * 0.3, 15, 85));
  return { focus: focus, pressure: pressure, expected: expected, reasons: [
    'Confidence ' + Math.round(m.confidence) + '/100', 'Momentum ' + m.momentum.toFixed(1),
    'Fatigue ' + m.fatigue.toFixed(1) + '/100', 'Preparation ' + preparation.toFixed(1) + '/20', 'Pressure ' + pressure + '/15'
  ] };
}
function trainingPrepare(game) {
  if (game.mode !== 'pro' || game.worldAI || game.sit || game.playerRetired || game.round >= seasonRounds(game)) return null;
  progressionInit(game);
  var p = progressionPlayer(game), t = p.training, m = p.mind, key = trainingKey(game);
  abilityLock(game);
  if (m.locked && m.locked.key === key) return m.locked;
  if (!t.year || t.year.season !== game.season || t.year.league !== leagueOf(game)) t.year = { season: game.season, league: leagueOf(game), fitness: 0, care: 0 };
  var plan = effectiveTraining(p), intensity = TRAINING.intensity[plan.intensity], scale = 22 / seasonRounds(game), gains = [], spent = 0, prep = 0, fitnessGain = 0, fatigueChange = 0, care = 0, quality = trainingQuality(p, game);
  m.fatigue = Math.max(0, m.fatigue - TRAINING.rest * scale);
  plan.slots.forEach(function (focus) {
    if (focus === 'recovery') {
      fatigueChange -= TRAINING.recovery * scale;
      care += 0.5 / plan.slots.length;
    } else {
      fatigueChange += intensity.load * scale;
      if (focus === 'fitness') {
        fitnessGain += TRAINING.fitnessAnnual / seasonRounds(game) * intensity.fitness * quality;
        care += 0.25 / plan.slots.length;
      } else {
        prep += intensity.prep * quality;
        var keys = trainingSkills(focus);
        for (var i = 0; i < intensity.points; i++) {
          var k = keys.filter(function (k) { return p[k] < statCap(game, k); }).sort(function (a, b) { return p[a] - p[b]; })[0];
          if (!k) break;
          var oldXP = game.xp;
          if (buySkill(game, k)) { spent += oldXP - game.xp; gains.push(ATTRN[k] + ' +1'); }
        }
      }
    }
    if (plan.intensity === 'hard' && focus !== 'recovery') care -= 0.1 / plan.slots.length;
  });
  m.fatigue = clamp(m.fatigue + fatigueChange, 0, 100);
  fitnessGain = Math.min(fitnessGain, Math.max(0, TRAINING.fitnessAnnual - t.year.fitness), Math.max(0, 100 - p.body.fitness));
  p.body.fitness = +(p.body.fitness + fitnessGain).toFixed(4); t.year.fitness += fitnessGain;
  t.year.care += care; p.body.care = clamp(0.5 + t.year.care / seasonRounds(game), 0, 1);
  if (fitnessGain > 0) gains.push('Fitness +' + fitnessGain.toFixed(1));
  prep = Math.min(20, prep);
  var state = focusFromState(game, prep, evaluationExpected(game, game.cal[game.round], p).expected);
  m.focus = state.focus;
  m.locked = Object.assign(state, { key: key, preparation: prep, fatigue: m.fatigue, slots: plan.slots, intensity: plan.intensity, spent: spent, gains: gains });
  return m.locked;
}
function trainingAfterRace(game, P) {
  if (game.mode !== 'pro' || game.sit) return;
  trainingInit(game);
  var p = progressionPlayer(game), m = p.mind, key = trainingKey(game);
  if (m.settled === key) return;
  var expected = m.locked && m.locked.key === key && Number.isFinite(m.locked.expected) ? m.locked.expected : evaluationExpected(game, game.cal[game.round], p).expected;
  var mechanical = mechanicalDNF(P);
  if (P.car.evalOrder) expected = P.pos;
  var delta = mechanical ? 0 : P.dnf ? -2 : clamp((expected - P.pos) / 3, -4, 4);
  m.confidence = clamp(m.confidence + delta, 0, 100);
  m.momentum = clamp(m.momentum * 0.65 + delta * 1.5, -20, 20);
  m.fatigue = clamp(m.fatigue + TRAINING.raceLoad * 22 / seasonRounds(game), 0, 100);
  m.settled = key;
}
function driverFocus(game, di) {
  if (game.mode !== 'pro' || game.worldAI || game.sit || di !== game.pi) return 50;
  var locked = trainingPrepare(game); return locked ? locked.focus : 50;
}
function focusPace(focus) { return clamp((50 - (focus == null ? 50 : focus)) / 50 * 0.25, -TRAINING.paceMax, TRAINING.paceMax); }
function focusRisk(R, f) {
  var pressure = !R.sc && (f.push === 2 || f.atk > 0) ? 1.2 : 0.6;
  return clamp(1 + (50 - (f.focus == null ? 50 : f.focus)) / 100 * pressure, TRAINING.riskMin, TRAINING.riskMax);
}
function focusHTML() {
  if (S.mode !== 'pro' || S.sit) return '';
  var m = progressionPlayer(S).mind, v = m.locked;
  if (!v || v.key !== trainingKey(S)) return '';
  return '<div class="card"><b>Weekend Focus ' + v.focus + '/100</b><p class="dim">' + v.reasons.join(' · ') + '</p><p class="' + (v.focus < 40 ? 'warn' : 'dim') + '">' + (v.focus < 40 ? 'Low readiness: slower pace and more mistake risk. Recovery helps before your next weekend.' : 'Focus affects qualifying, race pace and mistakes. Tyre Push and Boost amplify the risk difference.') + '</p><small>Training: ' + (v.slots || []).map(function (k) { return TRAINING.focuses[k]; }).join(' + ') + ' · ' + v.spent + ' XP spent' + (v.gains && v.gains.length ? ' · ' + v.gains.join(', ') : '') + '</small></div>';
}
function trainingCardHTML() {
  if (S.mode !== 'pro' || S.sit) return '';
  var p = progressionPlayer(S), t = p.training, m = p.mind;
  function select(field, options, value, index) {
    return '<select class="btn sm" style="max-width:100%" data-training="' + field + '"' + (index == null ? '' : ' data-index="' + index + '"') + ' aria-label="' + (field === 'slot' ? 'Training slot ' + (index + 1) : 'Training ' + field) + '">' + Object.keys(options).map(function (k) { return '<option value="' + k + '"' + (value === k ? ' selected' : '') + '>' + options[k] + '</option>'; }).join('') + '</select>';
  }
  var h = '<div class="card stack" id="training-plan"><h3>Training &amp; Mind</h3><div class="chips">' + chip('Confidence', Math.round(m.confidence)) + chip('Momentum', m.momentum.toFixed(1)) + chip('Fatigue', m.fatigue.toFixed(1) + '/100') + '</div>';
  h += '<div class="row" style="flex-wrap:wrap">' + select('mode', { manual: 'Manual plan', auto: 'Auto training' }, t.mode) + select('intensity', { light: 'Light', normal: 'Normal', hard: 'Hard' }, t.intensity) + '</div>';
  if (t.mode === 'auto') h += '<label>Auto target ' + select('goal', TRAINING.goals, t.goal) + '</label>';
  else for (var i = 0; i < trainingSlots(p); i++) h += '<label>Slot ' + (i + 1) + ' ' + select('slot', TRAINING.focuses, t.slots[i], i) + '</label>';
  return h + '<p class="dim">Your plan repeats before qualifying. Skill drills buy points using your existing XP and caps; they never award extra XP. Light/Normal: up to one point per skill slot; Hard: up to two. Simulator trains Pace/Consistency; Racecraft/Tyre trains the weaker stat; Wet and Technical train Wet and Feedback.</p><p class="dim">Per slot: Light/Normal/Hard adds 1/3/7 fatigue and 3/6/9 preparation for skill drills. Fitness restores up to 18 points per season across all slots; Recovery removes 12 fatigue. Between weekends, rest removes 8 and a race adds 4 fatigue. These loads scale with season length. Auto switches to Recovery when tired and reduces Hard intensity before overload.</p>' +
    '<p class="' + (m.fatigue >= 55 ? 'warn' : 'dim') + '">' + (m.fatigue >= 55 ? 'High fatigue: plan Recovery. There is no season-long burnout lock.' : 'Focus is calculated before qualifying from confidence, momentum, fatigue, preparation and pressure. It does not change overall or XP earnings.') + '</p>' +
    (m.locked && m.locked.key === trainingKey(S) ? '<p class="dim">This weekend is already prepared. Plan changes apply next weekend.</p>' : '') + '</div>';
}
document.addEventListener('change', function (e) {
  var el = e.target, field = el.dataset.training;
  if (!field || !S || S.mode !== 'pro' || S.playerRetired || S.sit) return;
  var t = progressionPlayer(S).training, value = el.value;
  if (field === 'slot' && Object.prototype.hasOwnProperty.call(TRAINING.focuses, value) && +el.dataset.index < trainingSlots(progressionPlayer(S))) t.slots[+el.dataset.index] = value;
  else if (field === 'mode' && ['manual', 'auto'].indexOf(value) >= 0) t.mode = value;
  else if (field === 'intensity' && TRAINING.intensity[value]) t.intensity = value;
  else if (field === 'goal' && TRAINING.goals[value]) t.goal = value;
  save(); render();
});
