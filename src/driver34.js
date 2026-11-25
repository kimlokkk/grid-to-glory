'use strict';
/* ===== Driver v3: "Driver Garage" — character card with radar, XP shop, tier ladder, perk slots, circuit collection.
   Presentation only: every purchase, training edit and ability change goes through the existing actions. ===== */

var DG = { pop: null };
var DG_ICO = { pace: '⚡', cons: '🎯', race: '⚔️', wet: '🌧️', tyre: '🛞', fb: '🔧' };
var DG_ABI = { qualifier: '⏱️', racer: '🏎️', raincraft: '🌧️', strategist: '🧠', technical: '🔧', composure: '🧘', tyrecraft: '🛞', legend: '👑' };
var DG_TRN = { simulator: '🖥️', racecraft: '⚔️', wet: '🌧️', technical: '🔧', fitness: '💪', recovery: '😴' };
function dgHelp(title, body) { return '<details class="driver-help dg-help"><summary>' + title + '</summary>' + body + '</details>'; }

/* six-axis radar: current stats solid, growth caps as a faint outline */
function dgRadar(p) {
  var n = SKILLS.length, cx = 130, cy = 118, R = 84, lo = 40, hi = 99;
  var pt = function (i, v) { var a = -Math.PI / 2 + i * 2 * Math.PI / n, r = R * clamp((v - lo) / (hi - lo), 0.04, 1); return [cx + Math.cos(a) * r, cy + Math.sin(a) * r]; };
  var poly = function (f) { return SKILLS.map(function (s, i) { return pt(i, f(s[0])).map(function (x) { return x.toFixed(1); }).join(','); }).join(' '); };
  var h = '<svg class="dg-radar" viewBox="0 0 260 240" role="img" aria-label="Skill radar">';
  [0.25, 0.5, 0.75, 1].forEach(function (k) { h += '<polygon points="' + SKILLS.map(function (s, i) { var a = -Math.PI / 2 + i * 2 * Math.PI / n; return (cx + Math.cos(a) * R * k).toFixed(1) + ',' + (cy + Math.sin(a) * R * k).toFixed(1); }).join(' ') + '" fill="none" stroke="#ffffff22" stroke-width="1"/>'; });
  SKILLS.forEach(function (s, i) { var e = pt(i, hi); h += '<line x1="' + cx + '" y1="' + cy + '" x2="' + e[0].toFixed(1) + '" y2="' + e[1].toFixed(1) + '" stroke="#ffffff18"/>'; });
  h += '<polygon points="' + poly(function (k) { return statCap(S, k); }) + '" fill="none" stroke="#ffffff66" stroke-width="1.5" stroke-dasharray="4 4"/>';
  h += '<polygon class="dg-radar-val" points="' + poly(function (k) { return p[k]; }) + '" fill="#ffd24a55" stroke="#ffd24a" stroke-width="2.5" stroke-linejoin="round"/>';
  SKILLS.forEach(function (s, i) {
    var a = -Math.PI / 2 + i * 2 * Math.PI / n, lx = cx + Math.cos(a) * (R + 22), ly = cy + Math.sin(a) * (R + 16), d = pt(i, p[s[0]]);
    h += '<circle cx="' + d[0].toFixed(1) + '" cy="' + d[1].toFixed(1) + '" r="3.5" fill="#ffd24a"/><text x="' + lx.toFixed(1) + '" y="' + ly.toFixed(1) + '" text-anchor="middle" class="dg-radar-l">' + s[1].split(' ')[0].toUpperCase() + '</text><text x="' + lx.toFixed(1) + '" y="' + (ly + 14).toFixed(1) + '" text-anchor="middle" class="dg-radar-v">' + p[s[0]] + '</text>';
  });
  return h + '</svg>';
}
function dgToNext(p) { var c = Object.assign({}, p), base = ovr(p), k = 0; while (k < 12 && ovr(c) === base) { c[SKILLS[k % SKILLS.length][0]]++; k++; } return k; }

/* ---------- character card ---------- */
function dgHero() {
  var p = me(), t = myTeam(), b = progressionPlayer(S).body, k = dgToNext(p), ds = driverStandings(S), pos = ds.indexOf(p) + 1, m = S.morale == null ? 50 : S.morale;
  return '<section class="dg-hero" style="--tc:' + t.color + '"><span class="dg-num" aria-hidden="true">' + p.num + '</span>' +
    '<div class="dg-id"><button class="dg-helm" data-act="prof" data-v="d:' + p.id + '" aria-label="Open driver profile">' + helmetSVG(p, 132, false) + '</button><div class="dg-name"><span class="dg-eyebrow">' + leagueOf(S).toUpperCase() + ' driver · #' + p.num + '</span><h1>' + esc(p.name) + '</h1><p>' + (typeof flagE === 'function' ? flagE(p.nat) + ' ' + natName(p.nat) : p.nat) + ' · age ' + p.age + ' · <b>' + esc(t.name) + '</b></p>' +
    '<div class="dg-ovr"><div><small>Overall</small><b>' + ovr(p) + '</b></div><div class="dg-ovr-next"><span>' + k + ' skill ' + (k === 1 ? 'point' : 'points') + ' to OVR ' + (ovr(p) + 1) + '</span><i><u style="width:' + clamp((6 - k) / 6 * 100, 6, 100) + '%"></u></i></div></div></div></div>' +
    '<div class="dg-radar-wrap">' + dgRadar(p) + '<small>Solid: your skills · dashed: growth cap</small></div>' +
    '<div class="dg-vitals" id="fitness-care"><div class="dg-vital"><span><small>Fitness</small><b>' + b.fitness.toFixed(0) + '<em>/100</em></b></span><i class="hp"><u style="width:' + clamp(b.fitness, 0, 100) + '%"></u></i></div><div class="dg-vital"><span><small>Career wear</small><b>' + b.wear.toFixed(1) + '</b></span><i class="dmg"><u style="width:' + clamp(b.wear, 0, 100) + '%"></u></i></div>' +
    '<div class="dg-chips"><span>P' + pos + ' · ' + p.pts + ' pts</span><span>Morale ' + m + '%</span><span>' + S.contract + (S.contract === 1 ? ' season' : ' seasons') + ' left</span></div>' +
    dgHelp('Fitness, wear and age', '<p>Fitness sessions build condition; Recovery clears fatigue before racing. Fitness and consistent care reduce annual wear. Wear gradually lowers growth caps; Pace is more sensitive than Racecraft and Feedback. Annual changes happen once and overlap with cap adjustments, so the same loss is not charged twice.</p>') + '</div></section>';
}

/* ---------- XP shop ---------- */
function dgShop() {
  var p = me(), h = '<section class="card driver-panel driver-skills dg-shop" id="driver-skills"><header class="dg-head"><div><h3>Skill shop</h3><h2>Spend your XP</h2></div><div class="dg-coin' + (S.xp > 0 ? ' has' : '') + '"><b>' + S.xp + '</b><span>XP</span></div></header><div class="driver-skill-list dg-skills">';
  SKILLS.forEach(function (s) {
    var v = p[s[0]], cost = skillCost(v, S, s[0]), cap = statCap(S, s[0]), max = v >= cap, can = !max && S.xp >= cost;
    h += '<div class="driver-skill dg-skill' + (can ? ' can' : '') + (max ? ' max' : '') + (DG.pop === s[0] ? ' pop' : '') + '"><span class="dg-ico" aria-hidden="true">' + DG_ICO[s[0]] + '</span><div class="dg-skill-m"><div class="driver-skill-head"><b>' + s[1] + '</b><span>' + v + ' <small>/ ' + cap + '</small></span></div>' + driverMeter(v, cap, s[1] + ' progress to cap') + '<p>' + s[2] + '</p></div>' +
      '<button class="dg-buy" data-act="buy" data-k="' + s[0] + '" ' + (can ? '' : 'disabled') + '>' + (max ? '<b>MAX</b>' : can ? '<b>+1</b><span>' + cost + ' XP</span>' : '<b>' + cost + ' XP</b><span>need ' + (cost - S.xp) + ' more</span>') + '</button></div>';
  });
  return h + '</div>' + dgHelp('XP, Overall &amp; growth caps', '<p>Overall averages all six stats. Each value shows your current skill / current cap. Costs increase near the cap; there is no age gate. You still need to spend XP to grow.</p><p>Season race XP: ' + PROGRESSION.annual[leagueOf(S)] + ' base, up to ' + PROGRESSION.bonuses.performance + ' performance, ' + PROGRESSION.bonuses.objectives + ' objectives, ' + PROGRESSION.bonuses.manual + ' manual and ' + PROGRESSION.bonuses.facilities + ' simulator XP. Auto earns the same base XP. Unspent XP carries over.</p>') + '</section>';
}
var dgBuy0 = A['buy'];
A['buy'] = function (d, b) { var before = S.xp; DG.pop = d.k; try { dgBuy0(d, b); } finally { DG.pop = null; } if (S.xp < before) snd('good'); };

/* ---------- tier ladder + season grade ---------- */
function dgGrade(s) { return s == null ? '–' : s >= 85 ? 'S' : s >= 75 ? 'A' : s >= 65 ? 'B' : s >= 55 ? 'C' : s >= 45 ? 'D' : 'E'; }
function dgTier() {
  var p = progressionPlayer(S), e = p.evaluation, s = evaluationSummary(S), r = e.latest, f1 = leagueOf(S) === 'f1', g = dgGrade(s.sts), mate = S.drivers.filter(function (d) { return d.team === me().team && d !== me(); })[0];
  var last = '';
  if (r && !r.excluded) { var df = r.snapshot.expected - r.pos; last = '<div class="dg-last ' + (df >= 0.5 ? 'up' : df <= -0.5 ? 'dn' : '') + '"><b>' + (df >= 0.5 ? '▲ Beat expectations' : df <= -0.5 ? '▼ Below expectations' : '● Matched expectations') + '</b><p>Last race: expected P' + r.snapshot.expected.toFixed(1) + ', finished P' + r.pos + ' · score ' + r.sts.toFixed(1) + '</p></div>'; }
  else last = '<div class="dg-last"><p>' + (r ? esc(r.excluded) : 'Complete a race to see how you performed against expectations.') + '</p></div>';
  return '<section class="card driver-panel dg-tier" id="performance-review"><header class="dg-head"><div><h3>Performance &amp; tier</h3><h2>' + EVALUATION.tiers[e.tier] + '</h2></div><span class="home-tag">' + abilitySlots(p) + ' ability ' + (abilitySlots(p) === 1 ? 'slot' : 'slots') + '</span></header>' +
    '<ol class="dg-ladder">' + EVALUATION.tiers.map(function (t, i) { return '<li class="' + (i < e.tier ? 'past' : i === e.tier ? 'current' : 'locked') + '"><span>' + (i <= e.tier ? ['🌱', '⭐', '🌟', '👑'][i] : '🔒') + '</span><b>' + t + '</b><small>' + EVALUATION.slots[i] + (EVALUATION.slots[i] === 1 ? ' slot' : ' slots') + '</small></li>'; }).join('') + '</ol>' +
    '<div class="dg-score"><div class="dg-grade g' + g + '"><b>' + g + '</b><small>Grade</small></div><div class="dg-score-m"><div><small>Season score</small><b>' + (s.sts == null ? '—' : s.sts.toFixed(1)) + '<em> / 100</em></b></div><i><u style="width:' + (s.sts == null ? 0 : clamp(s.sts, 0, 100)) + '%"></u></i><span>' + s.n + ' rated · ' + s.excluded + ' excluded</span></div>' +
    '<div class="dg-h2h"><small>vs ' + (mate ? esc(mate.name.split(' ').slice(-1)[0]) : 'teammate') + '</small><b>' + s.h2hWins + '<i>–</i>' + (s.h2hRaces - s.h2hWins) + '</b></div></div>' + last +
    '<p class="driver-caption">' + (!f1 ? 'Tier upgrades begin in F1. Your junior results still build your record.' : 'Higher tiers unlock more ability slots.') + '</p>' +
    dgHelp('How your rating works', '<p>STS is your season performance score. It combines results against car expectations, teammate strength, clean driving and achievements. Mechanical failures do not count as a zero. Team orders are excluded from teammate comparisons.</p><p>' + (!f1 ? 'Tier promotions are reviewed in F1; your junior performance still builds your racing record.' : 'Tier is reviewed at season end using enough race evidence and recent performance. A first weak season gives a warning; recovery can clear it.') + ' Legend also requires three F1 titles. Tier does not discount XP or reduce wear.</p>') + '</section>';
}

/* ---------- perk slots + circuit collection ---------- */
function dgAbilities() {
  var p = progressionPlayer(S), a = p.abilities, editable = abilityEditable(S), active = activeAbilityIds(S), slots = abilitySlots(p), cap = abilityCapParts(S, 'pace');
  var expert = Object.keys(a.mastery).filter(function (k) { return masteryLevel(a.mastery[k]) >= 4; }).length, ci = S.cal[Math.min(S.round, S.cal.length - 1)], nextKey = CIRCUITS[ci].key;
  var h = '<section class="card driver-panel dg-abi" id="ability-loadout"><header class="dg-head"><div><h3>Abilities &amp; mastery</h3><h2>Your racing edge</h2></div><span class="home-tag">' + active.length + ' / ' + slots + ' active</span></header><div class="dg-slots">';
  for (var i = 0; i < 4; i++) {
    var id = active[i], open = i < slots;
    h += '<div class="dg-slot ' + (id ? 'on' : open ? 'empty' : 'locked') + '"><span>' + (id ? DG_ABI[id] || '✨' : open ? '+' : '🔒') + '</span><small>' + (id ? esc(ABILITIES[id].n) : open ? 'Empty slot' : EVALUATION.tiers[EVALUATION.slots.indexOf(i + 1)] || 'Locked') + '</small></div>';
  }
  h += '</div><div class="driver-section-head"><h4>Active abilities</h4><span class="driver-caption">' + (editable ? 'You can change these now' : 'Locked for this season') + '</span></div>';
  h += a.priority.map(function (id, i) { var b = ABILITIES[id], on = active.indexOf(id) >= 0; return '<div class="ability-choice dg-perk ' + (on ? 'active' : '') + '"><span class="dg-ico" aria-hidden="true">' + (DG_ABI[id] || '✨') + '</span><div class="dg-perk-m"><b>' + esc(b.n) + '</b><small>' + (on ? 'Active · applies automatically' : 'Standby · not active') + '</small><p>' + esc(b.d) + '</p></div><div class="ability-actions"><button class="btn sm" data-act="ability-up" data-v="' + id + '" ' + (!editable || i === 0 ? 'disabled' : '') + '>Move up</button><button class="btn sm" data-act="ability-toggle" data-v="' + id + '" ' + (!editable ? 'disabled' : '') + '>Remove</button></div></div>'; }).join('');
  if (!a.priority.length) h += '<p class="driver-insight">No abilities selected. Add one from your collection below.</p>';
  h += '<button class="btn sm" data-act="ability-auto" ' + (!editable ? 'disabled' : '') + '>Recommend my selection</button><details class="driver-help dg-help"><summary>All abilities &amp; unlocks</summary><div class="ability-library">' + Object.keys(ABILITIES).map(function (id) { var b = ABILITIES[id], owned = a.owned.indexOf(id) >= 0, queued = a.priority.indexOf(id) >= 0; return '<div class="ability-library-item' + (owned ? '' : ' dg-locked') + '"><div class="home-card-head"><b>' + (owned ? DG_ABI[id] || '✨' : '🔒') + ' ' + esc(b.n) + '</b><span class="home-tag">' + (owned ? 'Owned' : 'Locked') + '</span></div><p>' + esc(b.d) + '</p>' + (owned ? '<button class="btn sm" data-act="ability-toggle" data-v="' + id + '" ' + (!editable ? 'disabled' : '') + '>' + (queued ? 'Remove from selection' : 'Add to selection') + '</button>' : '<small>Earn it: ' + esc(b.need) + '</small>') + '</div>'; }).join('') + '</div></details>';
  var seen = GTG_TRACKS.filter(function (t) { return (a.mastery[t[1]] || 0) > 0; }).length;
  h += '<div class="driver-section-head"><h4>Circuit collection</h4><span class="home-tag">' + seen + ' / ' + GTG_TRACKS.length + ' raced</span></div><div class="dg-tracks">' + GTG_TRACKS.map(function (t) {
    var n = a.mastery[t[1]] || 0, l = masteryLevel(n), idx = -1; CIRCUITS.forEach(function (c, i) { if (c.key === t[1]) idx = i; });
    var stars = ''; for (var s = 1; s <= 5; s++) stars += '<u class="' + (s <= l ? 'on' : '') + '">★</u>';
    return '<div class="dg-track' + (n ? ' has' : '') + (t[1] === nextKey ? ' next' : '') + '" title="' + esc(t[2]) + ' · ' + n + ' visits">' + (idx >= 0 ? circuitSVG(idx, 60, 'currentColor') : '') + '<b>' + esc(t[2]) + '</b><span>' + stars + '</span>' + (t[1] === nextKey ? '<em>Next</em>' : '') + '</div>';
  }).join('') + '</div><p class="driver-caption">Race a circuit to learn it. Each star adds a small pace and mistake-risk benefit there. Growth cap bonus: mastery +' + cap.mastery + ' · legend +' + cap.legend + (cap.legacy ? ' · existing save bonuses retained' : '') + ' (' + expert + ' circuits at 4★+).</p>' +
    dgHelp('Selection rules &amp; bonus limits', '<p>Change your selection before the first weekend or during season review. Top eligible abilities use your available slots. Lower entries wait on standby. Removing one never deletes an owned ability.</p><p>Cap Breaker raises your growth ceiling, not your stats instantly. Combined cap boosts stop at +5; no stat exceeds 99. Mastery and abilities do not award extra XP or reduce annual body wear.</p><p>Mastery levels need 1, 3, 5, 8 and 12 personal race visits. Each level adds 0.02s local pace and 1% lower mistake risk. Total Focus, ability and mastery pace stays within ±0.30s/lap; mistake multiplier 0.60–1.65 and ability tyre wear 0.90–1.00.</p>') + '</section>';
  return h;
}

/* ---------- weekend prep board ---------- */
function dgRing(label, value, max, tone, text) {
  var c = 2 * Math.PI * 26, f = clamp(value / max, 0, 1);
  return '<div class="dg-ring ' + tone + '"><svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="26" fill="none" stroke="var(--line)" stroke-width="7"/><circle cx="32" cy="32" r="26" fill="none" stroke="currentColor" stroke-width="7" stroke-linecap="round" stroke-dasharray="' + (c * f).toFixed(1) + ' ' + c.toFixed(1) + '" transform="rotate(-90 32 32)"/></svg><b>' + text + '</b><small>' + label + '</small></div>';
}
function dgTraining() {
  var p = progressionPlayer(S), t = p.training, m = p.mind, plan = effectiveTraining(p), prepared = m.locked && m.locked.key === trainingKey(S);
  var hints = { simulator: 'Pace or Consistency · uses XP', racecraft: 'Racecraft or Tyres · uses XP', wet: 'Wet Weather · uses XP', technical: 'Feedback · uses XP', fitness: 'Builds Fitness · free', recovery: 'Clears fatigue · free' };
  function select(field, options, value, index) { return '<select data-training="' + field + '"' + (index == null ? '' : ' data-index="' + index + '"') + ' aria-label="' + (field === 'slot' ? 'Training slot ' + (index + 1) : 'Training ' + field) + '">' + Object.keys(options).map(function (k) { return '<option value="' + k + '"' + (value === k ? ' selected' : '') + '>' + (options[k].n || options[k]) + '</option>'; }).join('') + '</select>'; }
  var inten = {}; Object.keys(TRAINING.intensity).forEach(function (k) { inten[k] = TRAINING.intensity[k].n; });
  var h = '<section class="card driver-panel dg-train" id="training-plan"><header class="dg-head"><div><h3>Training &amp; mind</h3><h2>Prepare for race day</h2></div><span class="home-tag">' + (prepared ? 'Weekend prepared' : 'Repeating plan') + '</span></header>' +
    '<div class="dg-rings">' + dgRing('Confidence', m.confidence, 100, m.confidence >= 60 ? 'good' : m.confidence >= 40 ? 'mid' : 'bad', Math.round(m.confidence)) + dgRing('Form', Math.abs(m.momentum), 20, m.momentum > 0.5 ? 'good' : m.momentum < -0.5 ? 'bad' : 'mid', (m.momentum > 0 ? '+' : '') + m.momentum.toFixed(1)) + dgRing('Fatigue', m.fatigue, 100, m.fatigue >= 55 ? 'bad' : m.fatigue >= 30 ? 'mid' : 'good', m.fatigue.toFixed(0)) + '</div>' +
    '<p class="dg-focus ' + (m.fatigue >= 55 ? 'warn' : '') + '">' + (m.locked ? 'Last race-day Focus: <b>' + m.locked.focus + '</b> / 100. ' : '') + (m.fatigue >= 55 ? 'You are tired. Pick Recovery before the next race.' : 'Lower fatigue and good form raise your Focus.') + '</p>' +
    '<div class="training-controls dg-ctl"><label>Who plans?' + select('mode', { manual: 'I choose', auto: 'Auto training' }, t.mode) + '</label><label>Workload' + select('intensity', inten, t.intensity) + '</label>' + (t.mode === 'auto' ? '<label class="training-goal">Auto priority' + select('goal', TRAINING.goals, t.goal) + '</label>' : '') + '</div>' +
    '<div class="training-sessions dg-sessions">' + plan.slots.map(function (k, i) { return '<div class="training-session dg-session' + (t.mode === 'manual' ? ' pick' : '') + '"><span class="dg-ico" aria-hidden="true">' + DG_TRN[k] + '</span><div><small>Session ' + (i + 1) + '</small><b>' + TRAINING.focuses[k] + (t.mode === 'manual' ? ' <i>▾</i>' : '') + '</b><p>' + hints[k] + '</p></div>' + (t.mode === 'manual' ? select('slot', TRAINING.focuses, t.slots[i], i) : '') + '</div>'; }).join('') + '</div>' +
    '<p class="driver-caption">' + (prepared ? 'This weekend is already prepared. Changes apply before the following qualifying.' : 'The plan runs before qualifying each weekend. Sessions never give extra XP; a skill point you cannot afford is skipped.') + '</p>' +
    dgHelp('How training and Focus work', '<p>Light and Normal can buy up to one skill point per session; Hard can buy up to two. Sessions choose the weaker eligible skill. Existing XP and growth caps still apply.</p><p>Hard adds more fatigue and preparation. Auto selects Recovery at high fatigue and reduces Hard workload before overload. Fitness gains are capped at 18 per season. Recovery reduces fatigue; these loads scale with season length.</p><p>Focus combines confidence, recent form, preparation, fatigue and pressure. It affects qualifying and race pace and mistakes; it does not change base Overall or XP rewards.</p>') + '</section>';
  return h;
}

var dgOldAku = hAku;
hAku = function () {
  if (S.mode !== 'pro' || S.sit) return dgOldAku();
  return '<div class="driver-page dg">' + dgHero() + '<div class="dg-col">' + dgShop() + dgTraining() + '</div><div class="dg-col">' + dgTier() + dgAbilities() + '</div></div>';
};
