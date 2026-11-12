'use strict';
/* ===== Race weekend v3, phase 2: Strategy ("Pit wall"). Presentation only: plan maths, tyre rules and s-* actions are unchanged. ===== */
function sgTyre(k, size) {
  var s = size || 30;
  return '<svg class="sg-ty" viewBox="0 0 40 40" width="' + s + '" height="' + s + '" aria-hidden="true"><circle cx="20" cy="20" r="18.5" fill="#15171f"/><circle cx="20" cy="20" r="13" fill="none" stroke="' + COMP[k].col + '" stroke-width="4.5"/><circle cx="20" cy="20" r="18.5" fill="none" stroke="#ffffff22" stroke-width="1"/><text x="20" y="24.4" text-anchor="middle" font-size="12.5" font-weight="700" fill="#fff" font-family="sans-serif">' + k + '</text></svg>';
}
/* forecast rain window in laps, using the same forecast error as the text forecast */
function sgRain(wk, L) {
  var w = wk.w, err = wk.fcErr || 0;
  if (w.type === 'hujan') return [clamp(w.start + err, 0, L), clamp(w.end + err * 0.7, 0, L)];
  if (w.type === 'basah') return [0, clamp(w.end + err * 0.7, 0, L)];
  return null;
}
function sgLine(comp, stops, L, band) {
  var segs = [], start = 0, c = comp;
  stops.concat([{ lap: L }]).forEach(function (s) { segs.push({ c: c, a: start, b: s.lap }); start = s.lap; if (s.comp) c = s.comp; });
  return '<span class="sg-line">' + (band ? '<i class="sg-rain" style="left:' + (band[0] / L * 100) + '%;width:' + ((band[1] - band[0]) / L * 100) + '%"></i>' : '') +
    segs.map(function (g) { var n = g.b - g.a; return '<i class="sg-seg" style="left:' + (g.a / L * 100) + '%;width:' + (n / L * 100) + '%;--c:' + COMP[g.c].col + '"><b>' + g.c + '</b>' + (n >= 4 ? '<small>' + n + '</small>' : '') + '</i>'; }).join('') +
    stops.map(function (s) { return '<i class="sg-pit" style="left:' + (s.lap / L * 100) + '%"><small>L' + s.lap + '</small></i>'; }).join('') + '</span>';
}
function sgRuler(L, band) {
  var ticks = [1, Math.round(L / 4), Math.round(L / 2), Math.round(L * 3 / 4), L];
  return '<div class="sg-ruler" aria-hidden="true">' + (band ? '<i class="sg-rain" style="left:' + (band[0] / L * 100) + '%;width:' + ((band[1] - band[0]) / L * 100) + '%"><em>Rain</em></i>' : '') + ticks.map(function (t) { return '<span style="left:' + (t / L * 100) + '%">' + t + '</span>'; }).join('') + '</div>';
}
function sgPitCalls() { return '<p class="sg-calls">' + (S.settings.ask ? 'Pit calls pause for your decision.' : 'Pit calls are automatic in Just watch mode.') + ' Your engineer reviews the plan every lap.</p>'; }

/* ---------- banner ---------- */
function sgBanner(wk, R, p) {
  var wet = R.w.type !== 'kering', steps = [['Quali', 'P' + p.grid, 'past'], ['Strategy', 'Pit wall', 'current'], ['Race', R.L + ' laps', ''], ['Result', 'Flag', '']];
  return '<section class="qv-banner sg-banner"><div class="qv-banner-main"><div class="cv-eyebrow"><i></i>Round ' + (S.round + 1) + ' · Race strategy</div><h1>' + esc(wk.c.name) + '</h1>' +
    '<div class="qv-chips"><span class="sg-start">Start P' + p.grid + '</span><span class="' + (wet ? 'wet' : 'dry') + '">' + (R.w.type === 'basah' ? 'Wet start' : R.w.type === 'hujan' ? 'Rain expected' : 'Dry race') + '</span><span>' + R.L + ' laps</span>' + (dryStrategy(R) ? '<span>2 compounds</span>' : '') + '</div>' +
    '<p>' + esc(wk.fc) + (R.wet > 0.28 ? ' Wet grid: slicks will be painfully slow.' : '') + '</p></div>' +
    '<div class="qv-banner-map" aria-hidden="true">' + (typeof circuitSVG === 'function' ? circuitSVG(wk.ci, 170, '#ffd24a') : '') + '</div>' +
    '<ol class="qv-steps" aria-label="Race weekend">' + steps.map(function (s) { return '<li class="' + s[2] + '"><b>' + s[0] + '</b><small>' + s[1] + '</small></li>'; }).join('') + '</ol></section>';
}

/* ---------- plans ---------- */
function sgPlans(wk, R, p) {
  var o = wk.opts, L = R.L, band = sgRain(wk, L);
  var guide = '<div class="sg-guide">' + KS.map(function (k) { var life = Math.round(tyreLife(p, R, k) / raceDistance(R)); return '<div>' + sgTyre(k, 34) + '<span><b>' + TYN[k] + '</b><small>≈ ' + life + ' laps · ' + (COMP2[k].off === 0 ? 'fastest' : '+' + COMP2[k].off.toFixed(2) + 's/lap') + '</small></span></div>'; }).join('') + '</div>';
  var cards = o.map(function (x, i) {
    var on = wk.sel === i;
    return '<button class="sg-plan' + (on ? ' on' : '') + '" data-act="s-plan" data-v="' + i + '" aria-pressed="' + on + '"><span class="sg-plan-top"><b>' + (x.n === 1 ? '1-stop' : '2-stop') + '</b><span class="sg-seq">' + [x.comp].concat(x.stops.map(function (s) { return s.comp; })).map(function (k) { return sgTyre(k, 22); }).join('<i>›</i>') + '</span>' + (i === 0 ? '<em class="sg-pick">Engineer\'s pick</em>' : '') + '</span>' +
      sgLine(x.comp, x.stops, L, band) +
      '<span class="sg-plan-foot"><span class="sg-est">' + fmtRace(x.est) + '</span><span class="sg-delta ' + (x.delta < 0.05 ? 'best' : '') + '">' + (x.delta < 0.05 ? 'Fastest' : '+' + x.delta.toFixed(1) + 's') + '</span></span><span class="sg-why">' + stratWhy(x, o[0]) + '</span></button>';
  }).join('');
  return '<section class="card sg-wall"><div class="tg-head"><div><small>Pit wall</small><h3>Engineer\'s plan</h3></div><span class="tg-tag">' + o.length + ' plans</span></div>' + sgPitCalls() + guide +
    '<div class="sg-plans">' + sgRuler(L, band) + cards + '</div>' +
    '<details class="driver-help dg-help"><summary>How these estimates work</summary><p>Your engineer ran every sensible plan for this track. Estimates use your tyre setting (Auto uses typical wear), balanced fuel and energy, and a clean race. Heat and setting changes can alter the result. Safety cars, rain and rivals can change the best plan during the race; your engineer will tell you, and you can switch.</p></details></section>';
}
function sgWet(wk, R, p) {
  var L = R.L, band = sgRain(wk, L);
  return '<section class="card sg-wall"><div class="tg-head"><div><small>Pit wall</small><h3>Engineer\'s plan</h3></div><span class="tg-tag">Weather call</span></div>' + sgPitCalls() +
    '<div class="sg-plans">' + sgRuler(L, band) + '<div class="sg-plan on sg-static">' + '<span class="sg-plan-top"><b>Start ' + TYN[p.comp] + '</b></span>' + sgLine(p.comp, p.plan, L, band) + '<span class="sg-why">' + (p.plan.length ? 'Start ' + TYN[p.comp] + ', ' + esc(planText(R, p)) + '.' : esc(planText(R, p))) + '</span></div></div>' +
    '<div class="tg-head sg-sub"><div><small>Starting tyre</small><h3>Pick your rubber</h3></div></div><div class="sg-tyres">' +
    ['S', 'M', 'H', 'I', 'W'].map(function (k) {
      var life = tyreLife(p, R, k) / raceDistance(R), dry = !!SLICK[k];
      return '<button class="opt sg-tyre ' + (p.comp === k ? 'on' : '') + '" data-act="s-start" data-v="' + k + '" aria-pressed="' + (p.comp === k) + '">' + sgTyre(k, 40) + '<div class="t">' + TYN[k] + '</div><div class="s">' + (dry ? '≈ ' + Math.round(life) + ' laps · ' + (COMP2[k].off === 0 ? 'fastest' : '+' + COMP2[k].off.toFixed(2) + 's/lap') + ' in the dry' : (k === 'I' ? 'Damp or wet track' : 'Heavy rain')) + '</div></button>';
    }).join('') + '</div></section>';
}

/* ---------- race mode + switches ---------- */
function sgMode(R) {
  return '<section class="card sg-mode"><div class="tg-head"><div><small>Race mode</small><h3>Car settings</h3></div><span class="tg-tag">Change any lap</span></div>' + raceControlsHTML(R, 's') +
    '<div class="sg-switches"><button class="sg-switch ' + (S.settings.ask ? 'on' : '') + '" data-act="s-ask" aria-pressed="' + !!S.settings.ask + '"><span><b>Pit calls</b><small>' + (S.settings.ask ? 'I decide' : 'Auto') + '</small></span><i></i></button><button class="sg-switch ' + (S.settings.mini ? 'on' : '') + '" data-act="s-mini" aria-pressed="' + !!S.settings.mini + '"><span><b>Mini games</b><small>' + (S.settings.mini ? 'On' : 'Off') + '</small></span><i></i></button></div>' +
    '<details class="driver-help dg-help"><summary>What these settings do</summary><p>Auto lets your engineer manage that control. Picking a setting makes only that control Manual until you choose Auto again. Tyre Push trades wear, heat and spin risk for pace. Fuel Push burns more fuel; Deploy spends battery. Fuel margin estimates the finish at your current setting and conditions.</p></details></section>';
}

var sgOldStrat = vStrat;
vStrat = function () {
  var wk = UI.wk, R = wk.R, p = R.p, dry = dryStrategy(R) && SLICK[p.comp];
  if (dry && !wk.opts) { wk.opts = stratEnum(p, R); if (wk.opts.length) { wk.sel = 0; applyStrat(0, false); } }
  var plans = dry && wk.opts && wk.opts.length ? sgPlans(wk, R, p) : sgWet(wk, R, p);
  var seq = [p.comp].concat(p.plan.map(function (s) { return s.comp; })), sum = seq.map(function (k) { return k; }).join(' › ') + (p.plan.length ? ' · pit ' + p.plan.map(function (s) { return 'L' + s.lap; }).join(', ') : ' · no stop planned');
  var side = qvFocus() + '<div class="qv-obj">' + objCard(wk) + '</div>' + (typeof thStrip === 'function' ? '<div class="sg-th">' + thStrip(R.ci) + '</div>' : '');
  return wkHead(true) + '<div class="qv sg">' + sgBanner(wk, R, p) + '<div class="qv-main">' + (typeof fnlPreHTML === 'function' ? fnlPreHTML() : '') + plans + sgMode(R) + '</div><div class="qv-side">' + side + '</div>' +
    '<div class="sg-go"><span class="sg-go-sum">' + seq.map(function (k) { return sgTyre(k, 24); }).join('') + '<span><small>Your plan</small><b>' + sum + '</b></span></span><button class="btn pri" data-act="s-go">To the grid →</button></div></div>';
};
