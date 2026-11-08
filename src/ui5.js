'use strict';
/* ===== Hujung minggu v2: enjin baru masa nyata, radio Ya/Tak, mini game semula jadi ===== */
var TYN = { S: 'Soft', M: 'Medium', H: 'Hard', I: 'Inter', W: 'Wet' };
var PUSHN = ['Save', 'Balanced', 'Push'];
function wetLabel(w) { return w < 0.08 ? 'Dry' : w < 0.28 ? 'Damp' : w < 0.6 ? 'Wet' : 'Very wet'; }
function wkHead(quit) {
  return '<div class="top"><div class="brand">Grid to <b>Glory</b></div><div class="meta"><span>' + UI.wk.c.name + (S.mode === 'pro' && !S.sit && UI.wk.R && UI.wk.R.p ? ' · Focus ' + (UI.wk.R.p.focus == null ? 50 : UI.wk.R.p.focus) : '') + '</span>' + (quit ? '<button class="btn sm" data-act="wk-quit">Exit</button>' : '') + '</div></div>';
}
function lastName(d) { return d.name.split(' ').slice(-1)[0]; }
function fc2(c, w, L, error) {
  var err = error || 0, end = w.end + err * 0.7;
  function range(lap) { var lo = clamp(Math.floor(lap) - 1, 1, L), hi = clamp(Math.ceil(lap) + 1, lo, L); return lo + '–' + hi; }
  if (w.type === 'basah') return 'Wet track at the start. ' + (end >= L ? 'Rain is expected to continue through the race; the track should remain wet.' : 'Rain should ease around lap ' + range(end) + '; the track will take longer to dry. Timing may vary.');
  if (w.type === 'hujan') return 'Rain expected around lap ' + range(w.start + err) + (end >= L ? ' and may continue through the finish.' : ', easing around lap ' + range(end) + '.') + ' The track may remain wet after the rain eases. Timing may vary.';
  return 'Dry conditions expected for the race.';
}
function vWk() { return ({ quali: vQuali, strat: vStrat, race: vRace, result: vResult })[UI.wk.step](); }
A['wk-start'] = function () {
  if (S.mode === 'pro' && (S.playerRetired || progressionPlayer(S).age >= AGEING.retireAt)) { UI.screen = 'retire'; render(); return; }
  trainingPrepare(S);
  evaluationPrepare(S, S.cal[S.round]);
  if (S.mode === 'pro') save();
  var ci = S.cal[S.round], c = circuitFor(S, ci), L = laps2(c), w = genWeather2(c, L);
  if (typeof ensureDev === 'function') ensureDev(S);
  var rv = ensureRival(S), fcErr = gauss() * P2.fcErrEng;
  UI.wk = { ci: ci, c: c, L: L, w: w, fcErr: fcErr, fc: fc2(c, w, L, fcErr), step: 'quali', q: null, qq: null, mg: { q: 0.5, s: 0.5, pn: [], bq: [] }, R: null, rep: null, obj: makeObjectives(S) };
  if (!rv.intro) { rv.intro = true; UI.wk.rivIntro = fmtR(pick(RIV.pick), { r: S.drivers[rv.di].name }); }
  UI.screen = 'wk'; render();
};
A['wk-quit'] = function () { stopRace(); if (RUN && S.live) liveCheckpoint(RUN.R); UI.wk = null; UI.screen = 'hub'; if (typeof liveSettle === 'function') liveSettle(); RUN = null; render(); };

/* ---------- kelayakan ---------- */
function vQuali() {
  var wk = UI.wk, c = wk.c, h = wkHead(true), Q = wk.Q || (wk.Q = qkInit(S, wk.ci, qualiWet(wk.w)));
  h += '<div class="stack"><div class="card stack"><h3>Round ' + (S.round + 1) + ' · Qualifying</h3><h2>' + c.name + ' · ' + wk.L + ' laps</h2><div class="row">' + circuitChips(c) + '</div><p>' + esc(wk.fc) + '</p>' + (Q.wq > 0.1 ? '<p class="warn">Wet qualifying. Rain skill matters.</p>' : '') + '</div>' + focusHTML() + objCard(wk);
  if (wk.q) {
    var mine = wk.q.filter(function (r) { return r.di === S.pi; })[0], pole = wk.q[0], mate = wk.q.filter(function (r) { return r.di !== S.pi && S.drivers[r.di].team === me().team; })[0];
    h += '<div class="card stack"><h2>You start P' + mine.pos + '</h2><p class="dim">' + (mine.pos === 1 ? 'POLE! The engineer is in tears on the pit wall.' : (mine.sess < 2 ? 'Knocked out in ' + QNAME[mine.sess] + '. ' : '') + '+' + (mine.t - pole.t).toFixed(3) + 's off pole') + (mate ? ' · teammate P' + mate.pos : '') + '</p></div>';
    h += '<div class="card"><h3 style="margin-bottom:8px">Grid</h3><div class="scroll"><table class="t"><thead><tr><th>#</th><th>Driver</th><th>Session</th><th class="r">Time</th><th class="r">Gap</th></tr></thead><tbody>';
    wk.q.forEach(function (r) {
      var d = S.drivers[r.di];
      h += '<tr class="' + (r.di === S.pi ? 'me' : '') + '"' + (r.pos === 11 || r.pos === 16 ? ' style="border-top:2px solid var(--bad)"' : '') + '><td class="mono dim">' + r.pos + '</td><td>' + tagD(d) + ' ' + esc(d.name) + '</td><td class="dim mono">' + QNAME[r.sess] + '</td><td class="r mono">' + fmtT(r.lap) + '</td><td class="r mono dim">' + (r.pos === 1 ? '' : '+' + (r.t - pole.t).toFixed(3)) + '</td></tr>';
    });
    return h + '</tbody></table></div></div><button class="btn pri wide" data-act="q-next">Next: strategy</button></div>';
  }
  var si = Q.s, last = si > 0 ? Q.res[si - 1] : null, alive = Q.alive.indexOf(S.pi) >= 0;
  if (last) {
    var cut = QK.cut[si - 1], pr = last.filter(function (r) { return r.di === S.pi; })[0];
    h += '<div class="card"><div class="row sp" style="margin-bottom:8px"><h3>Results ' + QNAME[si - 1] + '</h3>' + (pr ? '<span class="' + (pr.pos <= cut ? 'good' : 'bad') + '">' + (pr.pos <= cut ? 'Through! P' + pr.pos : 'Knocked out, P' + pr.pos) + '</span>' : '') + '</div><div class="scroll"><table class="t"><tbody>';
    last.forEach(function (r) {
      var d = S.drivers[r.di];
      h += '<tr class="' + (r.di === S.pi ? 'me' : '') + '"' + (r.pos === cut + 1 ? ' style="border-top:2px solid var(--bad)"' : '') + '><td class="mono dim" style="width:28px">' + r.pos + '</td><td>' + tagD(d) + ' ' + esc(lastName(d)) + (r.ev ? ' <span class="warn" style="font-size:12px">' + (r.ev === 'kuning' ? 'yellow flag' : 'trafik') + '</span>' : '') + '</td><td class="r mono">' + fmtT(r.lap) + '</td><td class="r mono dim">' + (r.pos === 1 ? '' : '+' + (r.t - last[0].t).toFixed(3)) + '</td></tr>';
    });
    h += '</tbody></table></div>' + (wk.qmsg ? '<p class="dim" style="margin-top:8px">' + esc(wk.qmsg) + '</p>' : '') + '</div>';
  }
  if (si < 3 && alive) {
    var n = Q.alive.length;
    h += '<div class="card stack"><h3>' + QNAME[si] + ' · ' + n + ' cars' + (si < 2 ? ', ' + (n - QK.cut[si]) + ' knocked out' : ', fighting for pole') + '</h3><div class="pick">';
    [['awal', 'Go out early', 'Track is still green and there\'s more traffic, but yellow flags are rare.'], ['biasa', 'Standard', 'Middle of the road.'], ['lewat', 'Go out late', 'Fastest track, but one yellow flag and your lap is gone.']].forEach(function (x) {
      h += '<button class="opt ' + ((wk.qch || 'biasa') === x[0] ? 'on' : '') + '" data-act="q-ch" data-v="' + x[0] + '"><div class="t">' + x[1] + '</div><div class="s">' + x[2] + '</div></button>';
    });
    h += '</div><div class="row"><button class="btn pri" data-act="q-play">' + (S.settings.mini ? 'Hot lap' : 'Run ' + QNAME[si]) + '</button>' + (S.settings.mini ? '<button class="btn" data-act="q-auto">Auto</button>' : '') + '</div></div>';
  } else {
    h += '<button class="btn pri wide" data-act="q-fin">' + (alive ? 'View grid' : 'Simulate rest of qualifying') + '</button>';
  }
  return h + '</div>';
}
function qSess(mod) {
  var wk = UI.wk, Q = wk.Q, si = Q.s, rows = qkSession(Q, { di: S.pi, ch: wk.qch || 'biasa', mod: mod });
  var pr = rows.filter(function (r) { return r.di === S.pi; })[0];
  wk.qmsg = !pr ? '' : pr.ev === 'kuning' && pr.r2.ev === 'kuning' ? 'Engineer: Yellow flag on your hot lap. Bad luck, not your fault.' : pr.r2.ev === 'trafik' ? 'Engineer: Slow car in sector 3. I reported it to the stewards. They didn\'t care.' :
    pr.pos === 1 ? 'Engineer: Fastest in ' + QNAME[si] + '! Don\'t smile yet.' : si < 2 && pr.pos > QK.cut[si] ? 'Engineer: Not quick enough this time. The car has nothing more.' : si < 2 && pr.pos > QK.cut[si] - 2 ? 'Engineer: Phew! Through by the skin of our teeth.' : 'Engineer: Okay, comfortably through.';
  render();
}
A['q-ch'] = function (d) { UI.wk.qch = d.v; render(); };
A['q-play'] = function () { UI.mgCtx = { k: 'quali' }; if (S.settings.mini) qualiAny(function (mod, qual) { UI.wk.mg.qs = (UI.wk.mg.qs || []).concat([qual]); qSess(mod * 0.6); }); else qSess(null); };
A['q-auto'] = function () { qSess(null); };
A['q-fin'] = function () {
  var wk = UI.wk, Q = wk.Q;
  while (Q.s < 3) qkSession(Q, null);
  qkGrid(Q); wk.q = P2._qrows.slice(); wk.qq = P2._q; P2._q = null; judgeQuali(wk);
  var qs = wk.mg.qs || []; wk.mg.q = qs.length ? qs.reduce(function (a, b) { return a + b; }, 0) / qs.length : 0.5;
  render();
};
A['q-next'] = function () {
  var wk = UI.wk; P2._q = wk.qq;
  var R = makeRace2(S, wk.ci, wk.q.map(function (r) { return r.di; }), { weather: wk.w, fcErr: wk.fcErr });
  R.p = R.cars.filter(function (f) { return f.isP; })[0];
  wk.R = R; wk.step = 'strat'; render();
};

function objCard(wk) {
  var rv = S.rival ? S.drivers[S.rival.di] : null;
  return '<div class="card stack"><div class="row sp"><h3>Team objectives</h3><span class="dim" style="font-size:12.5px">' + moraleTxt(S.morale == null ? 50 : S.morale) + '</span></div><div>' + objHTML(wk.obj) + '</div>' +
    (rv ? '<p class="dim" style="font-size:13px">Rival: ' + tagD(rv) + ' ' + esc(rv.name) + ' · H2H ' + S.rival.w + '-' + S.rival.l + '</p>' : '') + (wk.rivIntro ? '<p class="warn" style="font-size:13.5px">' + esc(wk.rivIntro) + '</p>' : '') + '</div>';
}
/* ---------- strategi ---------- */
function planText(R, p) {
  if (!p.plan.length) return (p.comp === 'I' || p.comp === 'W') ? 'Weather-dependent, your engineer will call it when the track changes.' : 'No stop planned.';
  var plan = p.plan.map(function (s) { return 'pit lap ' + s.lap + ' → ' + TYN[s.comp]; }).join(', ');
  return R.w.type !== 'kering' || R.wet > 0.04 ? 'dry baseline: ' + plan + '. Weather may change the stops and tyres' : plan;
}
function vStrat() {
  var wk = UI.wk, R = wk.R, p = R.p, c = wk.c, h = wkHead(true);
  h += '<div class="stack">' + (typeof fnlPreHTML === 'function' ? fnlPreHTML() : '') + '<div class="card stack"><h3>Strategy</h3><h2>' + c.name + ' · ' + R.L + ' laps · start P' + p.grid + '</h2><p>' + esc(wk.fc) + '</p>' +
    '<p class="dim">Dry race: you must use two different dry compounds. If you run Inters or Wets, this rule doesn\'t apply.</p>' + (R.wet > 0.28 ? '<p class="warn">Wet grid. Slicks will be painfully slow.</p>' : '') + (typeof thStrip === 'function' ? '<div>' + thStrip(R.ci) + '</div>' : '') + '</div>' + objCard(wk);
  h += focusHTML();
  h += '<div class="card stack"><h3>Engineer\'s plan</h3><p>Start <b>' + TYN[p.comp] + '</b>, ' + planText(R, p) + '.</p><p class="dim">Your engineer reviews the plan every lap. ' + (S.settings.ask ? 'Pit calls pause for your decision.' : 'Pit calls are automatic in Just watch mode.') + '</p><div class="pick">';
  ['S', 'M', 'H', 'I', 'W'].forEach(function (k) {
    var life = tyreLife(p, R, k) / raceDistance(R), dry = !!SLICK[k];
    h += '<button class="opt ' + (p.comp === k ? 'on' : '') + '" data-act="s-start" data-v="' + k + '"><div class="t">' + tyc(k) + TYN[k] + '</div><div class="s">' + (dry ? '≈ ' + Math.round(life) + ' laps · ' + (COMP2[k].off === 0 ? 'fastest' : '+' + COMP2[k].off.toFixed(2) + 's/lap') + ' in the dry' : (k === 'I' ? 'Damp/wet track' : 'Heavy rain')) + '</div></button>';
  });
  h += '</div></div><div class="card stack"><h3>Race mode</h3>' + raceControlsHTML(R, 's') +
    '<p class="dim">Auto lets your engineer manage that control. Picking a setting makes only that control Manual until you choose Auto again. You can ignore advice. Tyre Push trades wear, heat and spin risk for pace. Fuel Push burns more fuel; Deploy spends battery. Fuel margin estimates the finish at your current setting and conditions.</p>' +
    '<div class="row"><button class="btn sm ' + (S.settings.ask ? 'on' : '') + '" data-act="s-ask">Pit decisions: ' + (S.settings.ask ? 'I decide' : 'Auto') + '</button><button class="btn sm ' + (S.settings.mini ? 'on' : '') + '" data-act="s-mini">Mini game: ' + (S.settings.mini ? 'On' : 'Off') + '</button></div>' +
    '<p class="dim">' + (S.settings.ask ? 'Pit and safety-car calls pause for your decision.' : 'Pit calls are automatic. Take over any race control at any time.') + '</p></div>';
  return h + '<button class="btn pri wide" data-act="s-go">To the grid</button></div>';
}
A['s-start'] = function (d) {
  var R = UI.wk.R, p = R.p; p.comp = d.v; p.used = {}; p.used[d.v] = 1; p.eff = 0; p.tyreTemp = 0.3;
  p.lock = 0; UI.wk.sel = null;
  p.plan = []; if (SLICK[d.v]) brainPlan(R, p, R.L);
  render();
};
function raceControlsHTML(R, prefix, only) {
  var p = R.p;
  return [['push', 'Tyres', PUSHN], ['fuelMode', 'Fuel', PUSHN], ['energyMode', 'Energy', ['Harvest', 'Balanced', 'Deploy']]].filter(function (x) { return !only || x[0] === only; }).map(function (x) {
    var manual = p.bot && p.bot[x[0]] != null, mode = raceMode(p, x[0]), heat = tyreHeat(p);
    var margin = fuelMargin(R, p);
    var detail = x[0] === 'push' ? ' · ' + Math.round(tyreHealth(p, R) * 100) + '% · ' + (heat < 0.35 ? 'Cold' : heat > 0.78 ? 'Hot' : 'Optimal') : x[0] === 'fuelMode' ? ' · ' + (margin < 0 ? '' : '+') + margin.toFixed(1) + 'L' : ' · ' + Math.round(p.en * 100) + '%';
    return '<div class="race-control"><div class="row sp"><b>' + x[1] + detail + '</b><small>' + (manual ? 'Manual' : 'Auto') + ' · ' + x[2][mode] + '</small></div><div class="seg">' + [-1, 0, 1, 2].map(function (v) {
      return '<button class="' + ((manual ? mode : -1) === v ? 'on' : '') + '" data-act="' + prefix + '-mode" data-k="' + x[0] + '" data-v="' + v + '" aria-pressed="' + ((manual ? mode : -1) === v) + '" aria-label="' + x[1] + ': ' + (v < 0 ? 'Auto' : x[2][v]) + '">' + (v < 0 ? 'Auto' : x[2][v]) + '</button>';
    }).join('') + '</div></div>';
  }).join('');
}
A['s-mode'] = function (d) {
  var R = UI.wk.R;
  if (!setRaceMode(R, R.p, d.k, +d.v)) return;
  if (d.k === 'push' && typeof refreshStratOptions === 'function') refreshStratOptions();
  render();
};
A['s-ask'] = function () { S.settings.ask = !S.settings.ask; save(); render(); };
A['s-mini'] = function () { S.settings.mini = !S.settings.mini; save(); render(); };
A['s-go'] = function () {
  var wk = UI.wk; wk.step = 'race'; render(); initRun();
  if (typeof fnlFinal === 'function' && fnlFinal()) radio(wk.R, 'Final race of the season. Make it count.', 'e', 1);
  S.live = { r: S.round, ci: wk.R.ci }; liveCheckpoint(wk.R); save();
  UI.mgCtx = { k: 'start', pos: posOf(wk.R, wk.R.p) };
  if (S.settings.mini && S.settings.ask) startAny(function (react, jump, q) { applyStart(react, jump, q); goRun(); });
  else { applyStart(clamp(0.235 + gauss() * 0.035 - (me().race - 70) / 2500, 0.17, 0.4), false, 0.5); goRun(); }
};
function applyStart(react, jump, q) {
  var wk = UI.wk, R = wk.R, p = R.p, gain = jump ? 0 : clamp((0.26 - react) * 2.2, -0.35, 0.22);
  p.s += gain / R.c.base; p.l1b = jump ? 0 : (q - 0.5) * 1.2; wk.mg.s = q == null ? 0.5 : q;
  if (jump) { p.pen = 5; radio(R, 'Jump start! 5-second penalty. No worries, we\'ll claw it back.', 'x', 1); }
  else radio(R, 'Reaction ' + Math.round(react * 1000) + ' ms. ' + (react < 0.21 ? 'Rocket!' : react < 0.27 ? 'Good start.' : 'Bit slow, no worries.'), react < 0.27 ? 'me' : 'e', 1);
}

/* ---------- race masa nyata ---------- */
var RUN = null;
function initRun() {
  var R = UI.wk.R;
  RUN = { R: R, acc: 0, last: 0, spd: UI.spd2 || 2, pause: true, fast: false, highlights: false, highlightUntil: 0, wait: false, logI: 0, radio: R.radio || [], mgCd: 0, sig: '', tSig: 0, fin: false };
  R.radio = RUN.radio; RUN.stops = R.p.stops;
  R.cars.forEach(function (f) { f.sPrev = f.s; });
  setupMap(R); drawCars(R, 0); paintPanels(true);
}
function goRun() { if (!RUN) return; RUN.pause = false; RUN.last = 0; paintPanels(true); if (!UI.raf) UI.raf = requestAnimationFrame(loop); }
function stopRace() { if (UI.raf) { cancelAnimationFrame(UI.raf); UI.raf = 0; } if (RUN) RUN.pause = true; }
function radio(R, t, k, imp) { (R.radio = R.radio || []).push({ lap: Math.max(1, Math.min(R.L, R.lap)), t: t, k: k || 'i', imp: imp ? 1 : 0 }); }
function loop(now) {
  UI.raf = 0;
  var wk = UI.wk; if (!wk || !RUN || wk.R !== RUN.R || UI.screen !== 'wk' || wk.step !== 'race') return;
  var R = RUN.R, dt = RUN.last ? Math.min(0.1, (now - RUN.last) / 1000) : 0; RUN.last = now;
  if (!RUN.pause && !RUN.wait && !R.done) {
    if (RUN.fast && !(RUN.highlights && now < RUN.highlightUntil)) { for (var n = 0; n < 60 && !RUN.wait && !R.done; n++) { var logStart = R.log.length; stepOne(R); if (RUN.highlights && highlightMoment(R, logStart)) { RUN.highlightUntil = now + 1600; break; } } RUN.acc = 0; }
    else { RUN.acc += dt * 3 * RUN.spd; while (RUN.acc >= 1 && !RUN.wait && !R.done) { stepOne(R); RUN.acc -= 1; } }
  }
  if (R.done && !RUN.fin) finishRun(R);
  drawCars(R, RUN.wait || RUN.pause ? 1 : Math.min(1, RUN.acc));
  paintPanels(false);
  if (!RUN.pause && !R.done) UI.raf = requestAnimationFrame(loop);
}
function highlightMoment(R, from) { return R.log.slice(from).some(function (e) { return ['pass','pit','dnf','sc','vsc','restart','spin','contact','wx','finish'].indexOf(e.k) >= 0; }); }
A['r-highlights'] = function () { if (!RUN || RUN.R.done) return; RUN.highlights = !RUN.highlights; RUN.fast = RUN.highlights; RUN.highlightUntil = 0; cap(''); paintPanels(true); };
function asking() { return S.settings.ask && !RUN.auto; }
function stepOne(R) {
  var p = R.p;
  if (!p.fin && asking() && S.settings.mini && !RUN.fast) { if (miniCheck(R, p)) return; }
  p.bot = p.bot || {}; p.bot.noAttack = p.bot.energyMode != null;
  tick2(R);
  readLog(R);
  mgWatch(R, p);
  if (p.rsb && R.restartT <= 0) p.rsb = 0;
  if (p.mgExp != null && p.s > p.mgExp) { p.mgAtk = 0; p.mgDef = 0; p.mgExp = null; }
  if (p.stops !== RUN.stops) { RUN.stops = p.stops; p.pitOk = false; }
  if (p.pitReq && !p.pitOk && !p.fin) {
    if (asking()) pitCard(R, p);
    else p.pitOk = true;
  }
  if (typeof toCheck === 'function' && !RUN.wait) toCheck(R, p);
  if (S.live && S.live.lap !== p.lap && !R.done) { liveCheckpoint(R); save(); }
}

/* log enjin → radio dan kapsyen */
var TAGN = { pace: 'faster car', drs: 'DRS', attack: 'boost', tayar: 'fresher tyres', skil: 'skill', 'kitaran-pit': 'pit cycle', start: 'start', agresif: 'bold move', peluang: 'opportunist' };
function readLog(R) {
  var p = R.p;
  for (; RUN.logI < R.log.length; RUN.logI++) {
    var e = R.log[RUN.logI], b = e.b != null ? S.drivers[e.b] : null, a = e.a != null ? S.drivers[e.a] : null;
    if (e.k === 'pass') {
      if (e.b === p.di) { var why = e.tags.filter(function (g) { return TAGN[g]; }).map(function (g) { return TAGN[g]; }).slice(0, 2).join(', '); cap('Overtake ' + a.code + '! P' + posOf(R, p), 'pass'); if (S.rival && e.a === S.rival.di) radio(R, fmtR(pick(RIV.pass), { r: a.code }), 'me', 1); else radio(R, pick(RADIO.gain) + ' (' + a.code + ', ' + e.zone + (why ? ', ' + why : '') + ')', 'me', 1); }
      else if (e.a === p.di) { cap('Passed by ' + b.code + '. P' + posOf(R, p), 'lost'); if (S.rival && e.b === S.rival.di) radio(R, fmtR(pick(RIV.lost), { r: b.code }), 'x', 1); else radio(R, pick(RADIO.lose) + ' (' + b.code + ', ' + e.zone + ')', 'x', 1); }
      else if (posOfDi(R, e.b) === 1) radio(R, b.code + ' takes the lead from ' + a.code + '.', 'i');
    } else if (e.k === 'contact' && (e.b === p.di || e.a === p.di)) { cap('Contact!', 'lost'); radio(R, 'Contact with ' + (e.b === p.di ? a : b).code + '. Front wing okay? Okay. Probably.', 'x', 1); }
    else if (e.k === 'pit') {
      if (e.b === p.di) radio(R, 'Pit: ' + TYN[e.comp] + ', lost ' + e.loss.toFixed(1) + 's.' + (e.loss < R.c.pit * 0.4 ? ' ' + pick(RADIO.fastpit) : ''), 'e', 1);
      else if (posOfDi(R, e.b) <= 5 || e.tags.indexOf('undercut') >= 0 && Math.abs(posOfDi(R, e.b) - posOf(R, p)) <= 2) radio(R, b.code + ' pits (' + TYN[e.comp] + (e.tags[1] ? ', ' + (WHYS[e.tags[1]] || e.tags[1]) : '') + ').', 'i');
    } else if (e.k === 'dnf') {
      if (e.b === p.di) { cap('DNF', 'lost'); radio(R, e.tags[0] + '. ' + pick(RADIO.dnf), 'x', 1); }
      else radio(R, b.code + ' retires: ' + e.tags[0].toLowerCase() + '.', 'i', 1);
    } else if (e.k === 'spin' && e.b === p.di) { cap('Spun!', 'lost'); radio(R, 'You spun. Deep breath, carry on.', 'x', 1); }
    else if (e.k === 'sc' || e.k === 'vsc') { cap(e.k === 'sc' ? 'Safety car' : 'Virtual safety car', 'sc'); radio(R, (e.k === 'sc' ? pick(RADIO.sc) : 'VSC. Keep to the delta, no overtaking.'), 'sc', 1); }
    else if (e.k === 'restart') { radio(R, 'Safety car in this lap. Get ready for the restart!', 'sc'); if (asking() && S.settings.mini && !RUN.fast && !p.fin && !p.dnf && p.hold <= 0) restartGame(R, p); }
    else if (e.k === 'wx') { cap(e.tags[0] === 'kering' ? 'Track drying' : 'Rain falling', 'wet'); radio(R, e.tags[0] === 'kering' ? 'A dry line is appearing.' : 'Rain is starting. Easy on the throttle.', 'w', 1); }
  }
}
function trackOrder(R) {
  return R.cars.slice().sort(function (x, y) { return key(y) - key(x); });
  function key(f) { return f.dnf ? -1e6 + (f.dnfS || 0) : f.fin ? R.L + 1e5 - f.tFin - (f.pen || 0) : f.s; }
}
function posOf(R, f) { return trackOrder(R).indexOf(f) + 1; }
function posOfDi(R, di) { var o = trackOrder(R); for (var i = 0; i < o.length; i++) if (o[i].di === di) return i + 1; return 99; }
var capT = 0;
function cap(t, cls) { var el = document.getElementById('cap'); if (!el || (RUN.fast && t)) return; el.textContent = t; el.className = t ? 'cap show ' + (cls || '') : 'cap'; clearTimeout(capT); if (t) capT = setTimeout(function () { var e = document.getElementById('cap'); if (e) e.className = 'cap'; }, 2000); }

/* ---------- kad radio Ya/Tak ---------- */
var WHYS = { sc: 'safety car', 'sc+cuaca': 'safety car + weather', cuaca: 'weather', pelan: 'planned', undercut: 'undercut' };
var WHYT = {
  pelan: ['Pit window is open', 'Per the plan, time for fresh tyres.'],
  sc: ['Safety car! Cheap stop', 'Pitting under the safety car saves half the time. Others might stay out.'],
  'sc+cuaca': ['Safety car + weather', 'Cheap stop now, and switch tyres for the conditions.'],
  cuaca: ['Track has changed', 'Engineer reckons a different tyre is quicker for the rest of the race.'],
  undercut: ['Undercut opportunity', 'Car ahead is close. Fresh tyres can jump him when he pits.']
};
function pitCard(R, p) {
  RUN.wait = true;
  var w = WHYT[p.why] || ['Engineer wants to pit', 'Fresh tyres are faster for the rest of the race.'], hp = Math.round(tyreHealth(p, R) * 100), ah = nearAhead(R, p);
  var body = w[1] + ' Currently on ' + TYN[p.comp] + ', ' + Math.floor(p.eff) + ' laps old, ' + hp + '% left. Recommended: <b>' + TYN[p.pitReq] + '</b>.' + (p.why === 'undercut' && ah ? ' Target: ' + ah.d.code + '.' : '') + (mandOf(p) ? ' <span class="warn">You haven\'t used two dry compounds yet.</span>' : '');
  var opts = '<button class="opt" data-act="pc-yes"><div class="t">Yes, box: ' + tyc(p.pitReq) + ' ' + TYN[p.pitReq] + '</div><div class="s">Pit at the end of this lap.</div></button>';
  ['S', 'M', 'H', 'I', 'W'].forEach(function (k) { if (k !== p.pitReq && (SLICK[k] === SLICK[p.pitReq] || R.wet > 0.1)) opts += '<button class="opt" data-act="pc-alt" data-v="' + k + '"><div class="t">Box, but ' + tyc(k) + ' ' + TYN[k] + '</div><div class="s">Your call.</div></button>'; });
  opts += '<button class="opt" data-act="pc-no"><div class="t">No, stay out</div><div class="s">Engineer will ask again in 2 laps.</div></button>';
  showModal('<div><span class="badge ' + (p.why === 'sc' ? 'sc' : p.why === 'cuaca' ? 'wet' : '') + '">Radio · Lap ' + p.lap + '</span></div><h2>' + w[0] + '</h2><p>' + body + '</p><div class="evopts">' + opts + '</div>');
}
function pitResolve(k) {
  var R = RUN.R, p = R.p;
  closeModal();
  if (k === null) { p.pitReq = null; p.noPitUntil = p.lap + 2; p.plan = []; radio(R, 'Okay, staying out. ' + (tyreHealth(p, R) < 0.2 ? 'Those tyres are hanging on by a thread, just so you know.' : 'I trust you.'), 'e'); RUN.wait = false; resume(); return; }
  p.pitReq = k; p.pitOk = true; p.plan = []; radio(R, 'Box, box. ' + TYN[k] + ' ready and waiting.', 'e', 1);
  UI.mgCtx = { k: 'pit', comp: k };
  if (S.settings.mini && !RUN.fast) pitAny(function (stop, q) { p.crewT = stop; if (q != null) UI.wk.mg.pn.push(q); RUN.wait = false; resume(); });
  else { RUN.wait = false; resume(); }
}
A['pc-yes'] = function () { pitResolve(RUN.R.p.pitReq); };
A['pc-alt'] = function (d) { pitResolve(d.v); };
A['pc-no'] = function () { pitResolve(null); };
function resume() { RUN.last = 0; paintPanels(true); if (!RUN.pause && !UI.raf) UI.raf = requestAnimationFrame(loop); }

/* ---------- mini game semula jadi ---------- */
function zoneAhead(R, f) {
  var best = null, bd = 9;
  R.zones.forEach(function (z) { var zs = Math.floor(f.s - z.at) + 1 + z.at, d = zs - f.s; if (d < bd) { bd = d; best = z; } });
  return { z: best, d: bd };
}
function miniCheck(R, p) {
  if (R.sc || p.lap < 2 || p.hold > 0 || p.lap <= RUN.mgCd || p.lap >= R.L) return false;
  if (backmarker(R, p)) return true;
  var za = zoneAhead(R, p); if (za.d < 0.03 || za.d > 0.08) return false;
  if (RUN.mgZone === Math.floor(p.s + za.d) * 10 + R.zones.indexOf(za.z)) return false;
  RUN.mgZone = Math.floor(p.s + za.d) * 10 + R.zones.indexOf(za.z);
  if (R.wet > 0.3 && rnd() < 0.3) return wetGrip(R, p);
  var ah = nearAhead(R, p), atk = ah && !ah.fin && p.gA < 0.8, def = !atk && p.gB < 0.55;
  if (!atk && !def) return soloCheck(R, p, za);
  if (rnd() > 0.5) return false;
  RUN.wait = true; RUN.mgCd = p.lap + 1;
  var exp = p.s + za.d + 0.02, rv = atk ? ah : behindOf(R, p);
  function done(q, kind) {
    var qq = clamp(q, 0, 1); UI.wk.mg.bq.push(qq);
    if (kind === 'atk') p.mgAtk = (qq - 0.5) * 2.4; else p.mgDef = (qq - 0.5) * 2.4;
    p.mgExp = exp;
    if (qq < 0.15) { p.hold += kind === 'atk' ? 0.7 : 0.5; p.eff += 0.5; radio(R, kind === 'atk' ? 'Lock-up! Bit of a flat spot. Don\'t panic.' : 'Ran wide. Door wide open for him.', 'x', 1); }
    else if (qq > 0.8) radio(R, kind === 'atk' ? 'Great braking! He\'s within reach.' : 'Inside line covered. He\'ll have to find another way.', 'me', 1);
    else if (qq > 0.45) radio(R, kind === 'atk' ? 'Okay, close. Keep the pressure on, wait for a mistake.' : 'Okay, you\'re still ahead. Nail the exit.', 'e', 1);
    else radio(R, kind === 'atk' ? 'Not close enough on the brakes. Patience, plenty of laps left.' : 'Left a bit of a gap there. He\'s seen it.', 'e', 1);
    if (rv) RUN.mgW = { kind: kind, di: rv.di, code: rv.d.code, until: exp + 0.06 };
    RUN.wait = false; resume();
  }
  UI.mgFoe = atk ? ah : rv;
  UI.mgCtx = { k: atk ? 'atk' : 'def', foe: atk ? ah : rv, g: atk ? p.gA : p.gB, zone: za.z.n, drs: atk && p.gA < 1 && R.lap >= 3 && R.wet < 0.3 };
  if (atk) attackGame(za.z.n, p.a.attack, ah.d.code, function (q) { done(q, 'atk'); });
  else defendGame(rv ? rv.d.code : 'Someone', p.a.defend, function (q) { done(q, 'def'); });
  return true;
}
/* cabaran solo di hairpin/chicane bila tiada pertarungan: ±0.4 saat */
function soloCheck(R, p, za) {
  if (RUN.soloCd != null && p.lap <= RUN.soloCd) return false;
  var pz = za.z.n === 'turn 1' ? 0.12 : 0.3; if (rnd() > pz) return false;
  RUN.wait = true; RUN.soloCd = p.lap + 2; RUN.mgCd = p.lap; UI.mgCtx = { k: 'solo', zone: za.z.n };
  soloGame(za.z.n, p.a.rpace, function (q) {
    var qq = clamp(q, 0, 1), dl = (qq - 0.5) * 0.8; UI.wk.mg.bq.push(qq);
    if (qq < 0.15) { p.hold += 0.5; radio(R, 'Ran wide at ' + za.z.n + '. Lost half a second.', 'x', 1); }
    else { p.s += dl / p.pA; radio(R, (dl >= 0 ? 'Lovely through ' + za.z.n + '! Gained ' : 'A bit messy through ' + za.z.n + '. Lost ') + Math.abs(dl).toFixed(1) + 's.', dl >= 0.2 ? 'me' : 'e', dl >= 0.25); }
    RUN.wait = false; resume();
  });
  return true;
}
function behindOf(R, f) { var best = null, bd = 1e9; R.cars.forEach(function (r) { if (r === f || r.fin || r.hold > 0) return; var d = f.s - r.s; if (d > 0 && d < bd) { bd = d; best = r; } }); return best; }
/* brek lewat: penanda bergerak sekali ke kanan, makin laju; zon hijau dekat hujung, merah selepas */
function brakeGame(title, hint, skill, cb) {
  var zw = clamp(0.10 + (skill - 60) / 350, 0.08, 0.2), z1 = 0.86 - rnd() * 0.06, z0 = z1 - zw, t0 = performance.now(), dur = 1500 + rnd() * 400, raf = 0, done = false;
  function pos() { var u = (performance.now() - t0) / dur; return Math.min(1.05, u * u * 0.6 + u * 0.4); }
  showModal('<h2>' + esc(title) + '</h2><p class="dim">' + hint + '</p><div class="track"><div class="zone" style="left:' + (z0 * 100) + '%;width:' + (zw * 100) + '%"></div><div style="position:absolute;top:0;bottom:0;left:' + (z1 * 100) + '%;right:0;background:#d93a2f2e"></div><div class="mk" id="mk"></div></div><button class="btn pri hit" data-tap="mg-brk" style="min-height:70px">' + (skill === -1 ? '' : '') + (title.indexOf('Defend') === 0 ? 'COVER!' : 'BRAKE!') + '</button>');
  function end(q, msg, cls) {
    if (done) return; done = true; cancelAnimationFrame(raf); UI.mkey = null;
    showModal('<h2 class="' + cls + '">' + msg + '</h2>'); setTimeout(function () { closeModal(); cb(q); }, 600);
  }
  function lock() {
    var x = pos();
    if (x < z0) { var q = clamp(0.5 * x / z0, 0, 0.45); end(q, q > 0.35 ? 'Bit early' : 'Way too early', 'warn'); }
    else if (x <= z1) { var q2 = 0.6 + 0.4 * (x - z0) / zw; end(q2, q2 > 0.85 ? 'Perfect!' : 'Good', q2 > 0.85 ? 'pur' : 'good'); }
    else end(0.05, 'Overshot!', 'bad');
  }
  function lp() { var m = document.getElementById('mk'); if (!m || done) return; var x = pos(); m.style.left = (Math.min(1, x) * 100) + '%'; if (x >= 1.05) { end(0.05, 'Braked too late!', 'bad'); return; } raf = requestAnimationFrame(lp); }
  A['mg-brk'] = lock; UI.mkey = lock; raf = requestAnimationFrame(lp);
}

/* ---------- garis lap + pita jarak (ganti peta) ---------- */
function llx(fr) { return (2 + fr * 96); }
function setupMap(R) {
  var ll = document.getElementById('ll');
  if (ll) {
    var h = '<div class="bar5"></div><div class="fin"></div>';
    R.zones.forEach(function (z) { h += '<div class="z" style="left:' + llx(z.at) + '%">' + z.n + '</div>'; });
    R.cars.forEach(function (f) { h += '<div class="c' + (f.isP ? ' me' : '') + (S.rival && f.di === S.rival.di ? ' rv' : '') + '" id="lc' + f.di + '" style="background:' + f.t.color + '"></div><div class="t' + (f.isP ? ' me' : '') + (S.rival && f.di === S.rival.di ? ' rv' : '') + '" id="lt' + f.di + '" style="display:none">' + f.d.code + '</div>'; });
    ll.innerHTML = h;
  }
  var tr = document.getElementById('dtrk'); if (tr) tr._built = null;
}
/* pita: depan di kiri. g = saat di depan kita (positif = dia depan) */
function rbx(g) { return 50 - g / 3 * 46; }
function sAt(R, f, al) { return f.dnf ? f.dnfS : (f.fin ? R.L : (f.sPrev + (f.s - f.sPrev) * al)); }
function drawCars(R, al) {
  var p = R.p, ps = sAt(R, p, al), labs = [], near = 99, aheadL = [], behindL = [];
  var ord = RUN.ordT && performance.now() - RUN.ordT < 300 ? RUN.ord : (RUN.ord = trackOrder(R), RUN.ordT = performance.now(), RUN.ord), pi = ord.indexOf(p), nb = {};
  if (pi > 0) nb[ord[pi - 1].di] = 1; if (ord[pi + 1] && !ord[pi + 1].dnf) nb[ord[pi + 1].di] = 1;
  R.cars.forEach(function (f) {
    var c = document.getElementById('lc' + f.di), t = document.getElementById('lt' + f.di);
    if (f.dnf || (f.fin && !f.isP)) { if (c) { c.style.display = 'none'; t.style.display = 'none'; } return; }
    var s = sAt(R, f, al), fr = s - Math.floor(s), x = llx(fr);
    if (c) { c.style.display = ''; c.style.left = x + '%'; } if (c) c.className = 'c' + (f.isP ? ' me' : '') + (S.rival && f.di === S.rival.di ? ' rv' : '') + (f.hold > 0 ? ' hold' : '');
    var df = fr - (ps - Math.floor(ps)); if (df > 0.5) df -= 1; if (df < -0.5) df += 1;
    var show = f.isP || (S.rival && f.di === S.rival.di) || (nb[f.di] && Math.abs(df) < 0.25);
    if (c) { if (show) labs.push({ el: t, x: x, me: f.isP }); else t.style.display = 'none'; }
    if (!f.isP && !p.fin && !p.dnf) {
      var gap = (s - ps) * (p.pA || R.c.base);
      if (Math.abs(gap) <= 3 && f.hold <= 0) { if (Math.abs(gap) < near) near = Math.abs(gap); if (gap > 0) aheadL.push({ f: f, g: gap }); else behindL.push({ f: f, g: -gap }); }
    }
  });
  /* label tak bertindih: susun ikut x, naik baris kalau rapat */
  labs.sort(function (a, b) { return a.x - b.x; });
  var rowsX = [-99, -99], tops = [4, 80];
  labs.forEach(function (l) {
    l.el.style.display = ''; l.el.style.left = l.x + '%';
    if (l.me) { l.el.style.top = '20px'; return; }
    var k = l.x - rowsX[0] > 10 ? 0 : 1; rowsX[k] = l.x; l.el.style.top = tops[k] + 'px';
  });
  drawTrain(R, p, aheadL, behindL);
  var bc = document.getElementById('btchip');
  var out = R.done || p.fin || p.dnf, hot = !out && ((near < 1 && !R.sc) || !!R.sc);
  if (UI.phone && hot && !RUN.hot && UI.rtab && UI.rtab !== 'trek' && (!UI.rtabT || performance.now() - UI.rtabT > 6000)) A['rtab']({ v: 'trek' });
  RUN.hot = hot;
  if (bc) { var on = !out && near < 1 && !R.sc; bc.className = 'btchip' + (on ? ' on' : ''); bc.textContent = R.done ? 'CHEQUERED FLAG' : p.dnf ? 'DNF' : p.fin ? 'FINISHED' : R.sc ? (R.sc === 'SC' ? 'SAFETY CAR' : 'VSC') : on ? 'BATTLE' : near < 3 ? 'CLOSE' : 'CLEAN AIR'; }
}

/* ---------- panel ---------- */
function gapTxt(R, f, ref) {
  if (f.dnf) return '<span class="bad">DNF</span>';
  if (f.fin && ref.fin) return '+' + Math.max(0, f.tFin + (f.pen || 0) - ref.tFin - (ref.pen || 0)).toFixed(1);
  var ds = ref.s - f.s; if (ref.fin) ds = R.L - f.s;
  if (ds >= 1) return '+' + Math.floor(ds) + (Math.floor(ds) > 1 ? ' laps' : ' lap');
  return '+' + Math.max(0, ds * (f.pA || R.c.base)).toFixed(1);
}
function towerHTML(R) {
  var o = trackOrder(R), lead = o[0], pi = o.indexOf(R.p), full = !!UI.twFull;
  var h = '<div class="tower"><div class="tr head"><span>P</span><span>Code</span><span>Driver</span><span class="g">' + (UI.tw === 'int' ? 'Interval' : 'Gap') + '</span><span>Tyr</span><span>Pit</span><span></span></div>', gapShown = false;
  o.forEach(function (f, i) {
    var keep = full || i === 0 || Math.abs(i - pi) <= 2 || (S.rival && f.di === S.rival.di);
    if (!keep) { if (!gapShown) { h += '<div class="tr gap">···</div>'; gapShown = true; } return; }
    gapShown = false;
    var v = i === 0 ? (f.fin ? 'Wins' : 'Leader') : gapTxt(R, f, UI.tw === 'int' ? o[i - 1] : lead), pit = f.hold > 0 && !f.fin && !f.dnf && f.lastPit === f.lap;
    h += '<div class="tr ' + (f.isP ? 'me' : '') + (S.rival && f.di === S.rival.di ? ' rv' : '') + (f.dnf ? ' out' : '') + '"><span>' + (f.dnf ? '–' : i + 1) + '</span><span class="c" style="--tc:' + f.t.color + '">' + f.d.code + '</span><span class="dim nm">' + esc(lastName(f.d)) + (pit ? ' <span class="pit">PIT</span>' : '') + (f.pen ? ' <span class="warn">+' + f.pen + 's</span>' : '') + '</span><span class="g">' + v + '</span><span class="ty2">' + tyc(f.comp) + '<i>' + Math.floor(f.eff) + '</i></span><span class="dim">' + f.stops + '</span><span><i class="md m' + f.push + '" title="' + PUSHN[f.push] + '"></i></span></div>';
  });
  return h + '</div>';
}
function ringH(v, col, txt, lab) { return '<div><div class="ring" style="--rc:' + col + ';--v:' + clamp(Math.round(v), 0, 100) + '"><b>' + txt + '</b></div><small>' + lab + '</small></div>'; }
function cockpitHTML(R) {
  var p = R.p, h = '';
  if (R.done) return '<div class="card stack"><h2>Chequered flag</h2><p class="dim">Race over.</p><button class="btn pri wide" data-act="r-done">View results</button></div>';
  if (p.dnf) return '<div class="card stack"><h2 class="bad">You\'re out of the race</h2><p class="dim">' + esc(p.dnf) + '.</p><button class="btn wide" data-act="r-ff">Skip to the finish</button></div>';
  if (p.fin) return '<div class="card stack"><h2>You\'ve finished</h2><p class="dim">Waiting for the others to finish.</p><button class="btn wide" data-act="r-ff">Skip to the finish</button></div>';
  var o = trackOrder(R), i = o.indexOf(p), ah = i > 0 ? o[i - 1] : null, bh = o[i + 1] && !o[i + 1].dnf ? o[i + 1] : null, hp = tyreHealth(p, R), spare = fuelMargin(R, p);
  var rv = S.rival ? S.rival.di : -1;
  if (!UI.phone) h += posHTML(R);
  h += '<div class="rings">' + ringH(hp * 100, hp > 0.5 ? 'var(--good)' : hp > 0.2 ? 'var(--a2)' : 'var(--bad)', Math.round(hp * 100) + '%', 'Tyre ' + p.comp + ' · ' + Math.floor(p.eff) + 'L') +
    ringH(clamp(p.fuel / (R.L * raceDistance(R) * P2.fuel0) * 100, 0, 100), spare < 0 ? 'var(--bad)' : spare < 0.3 ? 'var(--a2)' : 'var(--good)', (spare < 0 ? '' : '+') + spare.toFixed(1), 'Fuel margin · ' + PUSHN[raceMode(p, 'fuelMode')]) +
    ringH(p.en * 100, 'var(--acc)', Math.round(p.en * 100) + '%', 'Energy') + '</div>';
  if (false) h += '<div class="posl"><div class="bigp">P' + (i + 1) + '</div><div class="gp">' +
    (ah ? '▲ ' + esc(lastName(ah.d)) + ' <b>' + Math.max(0, (Math.min(ah.s, R.L) - p.s) * p.pA).toFixed(1) + 's</b>' + (ah.di === rv ? ' · <span class="warn">rival</span>' : '') : '<b>You\'re leading!</b>') + '<br>' +
    (bh ? '▼ ' + esc(lastName(bh.d)) + ' <b>' + Math.max(0, (p.s - bh.s) * p.pA).toFixed(1) + 's</b>' + (bh.di === rv ? ' · <span class="warn">rival</span>' : '') : '<span class="dim">Last place</span>') + '</div></div>';

  h += '<div class="race-summary">' + [['push', 'Tyres', Math.round(hp * 100) + '%', PUSHN], ['fuelMode', 'Fuel', (spare < 0 ? '' : '+') + spare.toFixed(1) + 'L', PUSHN], ['energyMode', 'Energy', Math.round(p.en * 100) + '%', ['Harvest', 'Balanced', 'Deploy']]].map(function (x) {
    var manual = p.bot && p.bot[x[0]] != null;
    return '<button data-act="r-control" data-k="' + x[0] + '" aria-label="Adjust ' + x[1] + ' control"><b>' + x[1] + ' ' + x[2] + '</b><span>' + (manual ? 'Manual' : 'Auto') + ' · ' + x[3][raceMode(p, x[0])] + '</span>' + (x[0] === 'push' ? '<small>' + (tyreHeat(p) < 0.35 ? 'Cold' : tyreHeat(p) > 0.78 ? 'Hot' : 'Optimal') + '</small>' : '<small>Tap to adjust</small>') + '</button>';
  }).join('') + '</div><div class="race-controls">' + raceControlsHTML(R, 'r') + '</div>';
  var advice = raceAdvice(R, p);
  if (advice) h += '<p class="control-advice">ENG: ' + esc(advice) + '</p>';
  var noB = !canBoost(R, p);
  if (p.pitReq && p.pitOk) h += '<div class="pitnote"><span>Boxing this lap: ' + tyc(p.pitReq) + ' ' + TYN[p.pitReq] + '</span><button class="btn sm" data-act="r-pitx">Cancel</button></div>';
  h += '<div class="acts"><button class="btn boost" data-act="r-atk"' + (noB ? ' disabled' : '') + '>' + (p.atk > 0 ? 'Boost!' : 'Boost') + '</button><button class="btn pitb" data-act="r-pitm">' + (UI.pitOpen ? 'Close' : 'Pit') + '</button></div>';
  if (UI.pitOpen && !(p.pitReq && p.pitOk)) h += '<div class="tyrow">' + ['S', 'M', 'H', 'I', 'W'].map(function (k) { return '<button class="btn" data-act="r-pit" data-v="' + k + '">' + tyc(k) + TYN[k] + '</button>'; }).join('') + '</div>';
  if (!UI.phone) h += '<p class="dim" style="font-size:12.5px">Engineer\'s plan: ' + planText(R, p) + '</p>';
  h += '<div class="ctlrow">' + (RUN.pause ? '<button class="btn pri" data-act="r-go">' + (R.t > 0 ? 'Resume' : 'Start') + '</button>' : '<button class="btn" data-act="r-pause">Pause</button>') +
    (UI.phone ? '<button class="btn sm" data-act="r-playback" aria-label="Choose race playback speed">Playback · ' + (RUN.highlights ? 'Highlights' : RUN.fast ? 'Fast' : RUN.spd + '×') + '</button>' :
    [1, 2, 4].map(function (v) { return '<button class="btn sm ' + (RUN.spd === v && !RUN.fast ? 'on' : '') + '" data-act="r-spd" data-v="' + v + '">' + v + '×</button>'; }).join('') +
    '<button class="btn sm ' + (RUN.fast && !RUN.highlights ? 'on' : '') + '" data-act="r-fast" aria-label="Fast race playback">Fast</button><button class="btn sm ' + (RUN.highlights ? 'on' : '') + '" data-act="r-highlights" aria-pressed="' + !!RUN.highlights + '">Highlights</button>') + '</div>';
  return UI.phone ? h : '<div class="card stack">' + h + '</div>';
}
function posHTML(R) {
  var p = R.p; if (p.dnf) return '<div class="posl"><div class="bigp">DNF</div></div>';
  var o = trackOrder(R), i = o.indexOf(p), ah = i > 0 ? o[i - 1] : null, bh = o[i + 1] && !o[i + 1].dnf ? o[i + 1] : null, rv = S.rival ? S.rival.di : -1;
  return '<div class="posl"><div class="bigp">P' + (i + 1) + '</div><div class="gp">' +
    (ah ? '▲ ' + esc(lastName(ah.d)) + ' <b>' + (p.fin && ah.fin ? gapTxt(R, p, ah) : Math.max(0, (Math.min(ah.s, R.L) - p.s) * p.pA).toFixed(1)) + 's</b>' + (ah.di === rv ? ' · <span class="warn">rival</span>' : '') : '<b>You\'re leading!</b>') + '<br>' +
    (bh ? '▼ ' + esc(lastName(bh.d)) + ' <b>' + (p.fin && bh.fin ? gapTxt(R, bh, p) : Math.max(0, (p.s - bh.s) * p.pA).toFixed(1)) + 's</b>' + (bh.di === rv ? ' · <span class="warn">rival</span>' : '') : '<span class="dim">Last place</span>') + '</div></div>';
}
function stripHTML(R) {
  return '<div class="lapno">LAP ' + Math.max(1, Math.min(R.lap, R.L)) + '<span class="dim" style="font-size:15px;font-style:normal"> / ' + R.L + '</span></div><div class="row" style="gap:6px">' + (R.sc ? '<span class="badge sc">' + (R.sc === 'SC' ? 'Safety car' : 'VSC') + '</span>' : '') + '<span class="badge ' + (R.wet > 0.12 ? 'wet' : '') + '">' + wetLabel(R.wet) + '</span>' + (R.p.pen ? '<span class="badge sc">+' + R.p.pen + 's</span>' : '') + '</div>';
}
function radioHTML(R) {
  var l = (R.radio || []).slice(-30).reverse();
  if (!l.length) return '<span class="dim">Red lights. Get ready.</span>';
  return l.map(function (x) { return '<div><span class="l">L' + x.lap + '</span><span class="' + x.k + '">' + esc(x.t) + '</span></div>'; }).join('');
}
function lastRadioHTML(R) {
  var l = (R.radio || []).filter(function (x) { return x.k !== 'i'; }).slice(-1)[0];
  return '<div class="av">ENG</div><p><small>RADIO' + (l ? ' · L' + l.lap : '') + '</small>' + (l ? esc(l.t) : 'Red lights. Focus.') + '</p>';
}
function setHTML(id, h) { var el = document.getElementById(id); if (el && el._h !== h) { el.innerHTML = h; el._h = h; } }
function paintPanels(force) {
  if (!RUN) return; var now = performance.now();
  if (!force && now - RUN.tSig < 250) return;
  RUN.tSig = now; var R = RUN.R;
  setHTML('strip', stripHTML(R)); setHTML('cockpit', cockpitHTML(R)); if (UI.phone) { setHTML('posb', posHTML(R)); setHTML('planb', 'Plan: ' + planText(R, R.p)); } setHTML('towerb', towerHTML(R)); setHTML('radiob', radioHTML(R)); setHTML('lastr', lastRadioHTML(R));
}
function vRacePhone(R) {
  var t = UI.rtab || 'trek';
  var h = '<div class="rfull tab-' + t + '"><div class="rtop5"><div class="rhead" id="strip"></div><button class="btn sm" data-act="wk-quit">Exit</button></div>' +
    '<div class="rpos" id="posb"></div>' +
    '<div class="rtabs">' + [['trek', 'Track'], ['lap', 'Lap'], ['ked', 'Timing'], ['radio', 'Radio']].map(function (x) { return '<button class="' + (t === x[0] ? 'on' : '') + '" data-act="rtab" data-v="' + x[0] + '">' + x[1] + '</button>'; }).join('') + '</div>' +
    '<div class="rview">' +
    '<div class="v-trek">' + trainCard() + '<p class="dim plan5" id="planb"></p></div>' +
    '<div class="v-lap"><div class="card"><div class="lbl"><span>On the lap</span><span>direction ▶</span></div><div class="ll" id="ll"></div></div><p class="dim" style="font-size:12.5px;margin:4px 2px">Every car on one lap of the circuit. Dashed line = finish line.</p></div>' +
    '<div class="v-ked card"><div class="row sp" style="margin-bottom:4px"><button class="btn sm ' + (UI.twFull ? 'on' : '') + '" data-act="tw-full">' + (UI.twFull ? 'Full' : 'Compact') + '</button><button class="btn sm ' + (UI.tw === 'int' ? 'on' : '') + '" data-act="tw2" data-v="' + (UI.tw === 'int' ? 'gap' : 'int') + '">' + (UI.tw === 'int' ? 'Interval' : 'Gap') + '</button></div><div id="towerb"></div></div>' +
    '<div class="v-radio"><div id="radiob"></div></div>' +
    '</div><div class="lastr5" id="lastr"></div><div class="dock" id="cockpit"></div></div>';
  setTimeout(function () { if (RUN && UI.wk && UI.wk.R === RUN.R) { setupMap(RUN.R); drawCars(RUN.R, 1); paintPanels(true); } }, 0);
  return h;
}
function isPhone() { return window.innerWidth < 900; }
window.addEventListener('resize', function () { if (UI.screen === 'wk' && UI.wk && UI.wk.step === 'race' && isPhone() !== !!UI.phone) render(); });
A['rtab'] = function (d) { UI.rtab = d.v; UI.rtabT = performance.now(); var f = document.querySelector('.rfull'); if (f) { f.className = 'rfull tab-' + d.v; document.querySelectorAll('.rtabs button').forEach(function (b) { b.className = b.dataset.v === d.v ? 'on' : ''; }); } paintPanels(true); };
function vRace() {
  var R = UI.wk.R;
  UI.phone = isPhone(); RUN && (RUN.sig = '');
  ['strip', 'cockpit', 'towerb', 'radiob', 'lastr', 'posb', 'planb'].forEach(function () { });
  if (UI.phone) return vRacePhone(R);
  var h = '<div class="top"><div class="brand">Grid to <b>Glory</b></div><div class="meta"><span>' + R.c.name + '</span><button class="btn sm" data-act="wk-quit">Exit</button></div></div>';
  h += '<div class="race5"><div class="stack"><div class="rhead" id="strip"></div>' +
    '<div class="card"><div class="lbl"><span>Positions on the lap</span><span>direction ▶</span></div><div class="ll" id="ll"></div></div>' +
    trainCard() +
    '<div id="cockpit"></div><div class="lastr5" id="lastr"></div></div>' +
    '<div class="stack"><div class="card"><div class="row sp" style="margin-bottom:6px"><h3>Standings</h3><div class="row" style="gap:4px"><button class="btn sm ' + (UI.twFull ? 'on' : '') + '" data-act="tw-full">' + (UI.twFull ? 'Full' : 'Compact') + '</button><button class="btn sm ' + (UI.tw === 'int' ? 'on' : '') + '" data-act="tw2" data-v="' + (UI.tw === 'int' ? 'gap' : 'int') + '">' + (UI.tw === 'int' ? 'Interval' : 'Gap') + '</button></div></div><div id="towerb"></div></div>' +
    '<div class="card"><h3 style="margin-bottom:8px">Team radio</h3><div id="radiob" class="radwrap"></div></div></div></div>';
  setTimeout(function () { if (RUN && UI.wk && UI.wk.R === RUN.R) { setupMap(RUN.R); drawCars(RUN.R, 1); paintPanels(true); } }, 0);
  return h;
}
A['tw2'] = function (d) { UI.tw = d.v; render(); };
A['tw-full'] = function () { UI.twFull = !UI.twFull; render(); };
A['r-pitm'] = function () { UI.pitOpen = !UI.pitOpen; paintPanels(true); };
A['r-go'] = function () { RUN.pause = false; resume(); };
A['r-pause'] = function () { RUN.pause = true; RUN.fast = false; RUN.highlights = false; paintPanels(true); };
A['r-spd'] = function (d) { RUN.spd = +d.v; UI.spd2 = RUN.spd; RUN.fast = false; RUN.highlights = false; paintPanels(true); };
A['r-fast'] = function () { RUN.fast = !RUN.fast || RUN.highlights; RUN.highlights = false; if (RUN.fast) cap(''); paintPanels(true); };
A['r-ff'] = function () { RUN.auto = true; RUN.fast = true; RUN.highlights = false; RUN.pause = false; cap(''); resume(); };
A['r-control'] = function (d) {
  if (['push', 'fuelMode', 'energyMode'].indexOf(d.k) < 0) return;
  stopRace(); paintPanels(true);
  showModal('<div id="resource-control"><h3>Race control</h3>' + raceControlsHTML(RUN.R, 'r', d.k) + '<p class="dim">Race paused. Choose a setting for Manual control, or Auto for your engineer.</p><button class="btn wide" data-act="mclose">Close</button></div>');
};
A['r-mode'] = function (d) { var R = RUN.R; if (setRaceMode(R, R.p, d.k, +d.v)) { if (document.getElementById('resource-control')) closeModal(); paintPanels(true); } };
A['r-atk'] = function () { var R = RUN.R; if (!activateBoost(R, R.p)) return; cap('Boost!', 'pass'); paintPanels(true); };
A['r-pit'] = function (d) { var R = RUN.R, p = R.p; if (p.fin || p.dnf) return; UI.pitOpen = false; RUN.wait = true; p.pitReq = d.v; p.why = 'manual'; pitResolve(d.v); };
A['r-pitx'] = function () { var p = RUN.R.p; p.pitReq = null; p.pitOk = false; p.noPitUntil = p.lap + 1; p.crewT = null; paintPanels(true); };

/* ---------- tamat ---------- */
function finishRun(R) {
  RUN.fin = true;
  R.cls = R.cars.slice().sort(function (a, b) { var ta = a.dnf ? 1e9 - a.dnfS : a.tFin + (a.pen || 0), tb = b.dnf ? 1e9 - b.dnfS : b.tFin + (b.pen || 0); return ta - tb; });
  R.cls.forEach(function (f, i) { f.pos = i + 1; });
  var fl = null; R.cars.forEach(function (f) { if (!f.dnf && f.best < 900 && (!fl || f.best < fl.best)) fl = f; });
  R.fl = fl ? { di: fl.di, t: fl.best } : { di: -1, t: 0 };
  var P = R.p; radio(R, P.dnf ? 'Not our day.' : P.pos === 1 ? 'WE WON! Get in there!' : P.pos <= 3 ? 'Podium! P' + P.pos + '. Brilliant!' : 'Finished P' + P.pos + '. ' + (P.pos < P.grid ? 'Gained ' + (P.grid - P.pos) + ' places.' : 'We learn and come back stronger.'), P.pos <= 3 && !P.dnf ? 'me' : 'e', 1);
  cap(''); paintPanels(true);
  if (UI.wk && !UI.wk.rep) commitRace(UI.wk);
}
function oldShape(R) {
  var w = R.cls[0], wt = w.tFin + (w.pen || 0);
  return {
    ci: R.ci, c: R.c, wetRace: R.w && R.w.type !== 'kering', fl: R.fl, overtakes: R.nClean, scCount: R.nSC,
    cls: R.cls.map(function (f) { return { car: { d: f.d, di: f.di, isP: f.isP, grid: f.grid, dnf: f.dnf, evalOrder: !!f.evalOrder, evalOrderCredit: f.evalOrderCredit || 0, evalSpins: f.evalSpins || 0, fin: f.tFin, pen: f.pen || 0, comp: f.comp, stops: f.stops, t: f.t }, pos: f.pos, dnf: !!f.dnf, gap: f.dnf ? 0 : f.tFin + (f.pen || 0) - wt }; }),
    log: R.radio
  };
}
/* keputusan dikunci sebaik bendera berkotak jatuh (tiada ulang race dengan keluar sebelum tekan 'View results') */
function commitRace(wk) {
  if (wk.rep) return;
  var avg = function (a) { return a.length ? a.reduce(function (x, y) { return x + y; }, 0) / a.length : 0.5; };
  var bonus = wk.mg.q * 2 + wk.mg.s * 2 + avg(wk.mg.pn) * 2 + avg(wk.mg.bq) * 2;
  if (S.mode === 'pro') bonus = proManualBonus(wk.mg);
  wk.old = oldShape(wk.R); wk.jr = judgeRace(wk, wk.R);
  if (wk.press === undefined) wk.press = typeof pressMake === 'function' ? pressMake(S, wk.old.cls.filter(function (x) { return x.car.isP; })[0], wk.R.ci) : null;
  wk.rep = finishRace(S, wk.old, bonus); S.xp += wk.jr.xp; save();
}
A['r-done'] = function () {
  var wk = UI.wk; if (wk.step === 'result') return; stopRace();
  commitRace(wk); wk.step = 'result'; save(); render();
};
function vResult() {
  var wk = UI.wk, R = wk.old, rep = wk.rep, P = rep.P, c = R.c, h = wkHead(false);
  var note = P.dnf ? 'Race ended early: ' + String(P.car.dnf).toLowerCase() + '.' : (P.pos < P.car.grid ? 'Gained ' + (P.car.grid - P.pos) + ' places from the grid.' : P.pos > P.car.grid ? 'Lost ' + (P.pos - P.car.grid) + ' places from the grid.' : 'Finished where you started.');
  if (!P.dnf && P.pos === 1) note = 'Win!'; else if (!P.dnf && P.pos <= 3) note = 'Podium! ' + note;
  h += '<div class="stack">' + (typeof fnlPostHTML === 'function' ? fnlPostHTML(P) : '') + '<div class="card stack"><h3>Results · ' + c.name + '</h3><div class="row sp"><div class="lapno" style="font-size:68px">' + (P.dnf ? 'DNF' : 'P' + P.pos) + '</div><div class="mono dim" style="text-align:right">Start P' + P.car.grid + '<br><b style="color:var(--fg)">' + P.pts + ' pts</b><br><span class="good">XP +' + rep.xp + '</span></div></div><p>' + note + '</p>';
  if (rep.rd && rep.rd.length) h += '<p class="dim">Team upgrades: ' + rep.rd.join(', ') + '</p>';
  h += '</div>' + evaluationCardHTML(false) + '<div class="card"><div class="row sp" style="margin-bottom:8px"><h3>Classification</h3><button class="btn sm" data-act="cls-all">' + (UI.clsAll ? 'Top 10' : 'Full result') + '</button></div><div class="scroll"><table class="t"><thead><tr><th>#</th><th>Driver</th><th>Tyre · stops</th><th class="r">Time / gap</th><th class="r">Pts</th></tr></thead><tbody>';
  R.cls.forEach(function (x) {
    var d = x.car.d; if (!UI.clsAll && x.pos > 10 && !x.car.isP) return;
    var tm = x.dnf ? '<span class="bad">DNF</span>' : x.pos === 1 ? fmtT(x.car.fin + x.car.pen) : '+' + x.gap.toFixed(1);
    h += '<tr class="' + (x.car.isP ? 'me' : '') + ' clk" data-act="prof" data-v="d:' + x.car.di + '"><td class="mono dim">' + (x.dnf ? '–' : x.pos) + '</td><td>' + tagD(d) + ' ' + esc(d.name) + (R.fl.di === x.car.di ? ' <span class="pur" title="Fastest lap">●</span>' : '') + (x.car.pen ? ' <span class="warn mono" style="font-size:12px">+' + x.car.pen + 's</span>' : '') + '</td><td>' + tyc(x.car.comp) + ' <span class="dim mono">' + x.car.stops + '</span></td><td class="r mono">' + tm + '</td><td class="r mono">' + (x.pts || '') + '</td></tr>';
  });
  h += '</tbody></table></div><p class="dim" style="margin-top:8px;font-size:13px">' + (R.fl.di >= 0 ? '● fastest lap ' + S.drivers[R.fl.di].code + ' ' + fmtT(R.fl.t) + ' · ' : '') + R.overtakes + ' clean overtakes · ' + R.scCount + ' safety car</p></div>';
  h += '<div class="card stack"><div class="row sp"><h3>Team objectives</h3><span class="good mono">XP +' + wk.jr.xp + '</span></div><div>' + objHTML(wk.obj) + '</div><p class="dim" style="font-size:13px">' + moraleTxt(S.morale) + ' (' + (wk.jr.mor >= 0 ? '+' : '') + wk.jr.mor + ')' + (wk.jr.rmsg ? ' · ' + esc(wk.jr.rmsg) : '') + '</p></div>';
  if (wk.press === undefined) wk.press = typeof pressMake === 'function' ? pressMake(S, P, R.ci) : null;
  if (wk.press) h += pressHTML(wk.press);
  var hb = P.dnf ? HEAD.dnf : P.pos === 1 ? HEAD.win : P.pos <= 3 ? HEAD.pod : P.pos <= 10 ? HEAD.pts : P.pos <= 15 ? HEAD.mid : HEAD.back;
  var rvd = S.rival ? S.drivers[S.rival.di] : null, rvf = rvd ? R.cls.filter(function (x) { return x.car.di === rvd.id; })[0] : null, hd = wk.headline;
  if (!hd) {
    hd = pick(hb);
    if (rvf && rnd() < 0.5 && !P.dnf) hd = pick(P.pos < rvf.pos ? HEAD2.rivalW : HEAD2.rivalL);
    wk.headline = hd;
  }
  h += '<div class="card nw"><div class="nw-bar"><span class="nw-brand">PADDOCK<b>WIRE</b></span><span class="nw-live"><i></i>JUST IN</span></div><div class="nw-top" style="--tc:' + myTeam().color + '"><div class="nw-tx"><span class="nw-k k-race">' + esc(c.name.toUpperCase()) + '</span><h4>' + esc(fmtR(hd, { n: me().name.split(' ')[0], r: rvd ? rvd.name.split(' ').slice(-1)[0] : '' })) + '</h4><small>S' + S.season + ' · Round ' + S.round + '</small></div><div class="nw-img">' + helmetSVG(me(), 64, false) + '</div></div></div>';
  var hl = (R.log || []).filter(function (l) { return l.imp; });
  if (hl.length) { h += '<div class="card"><h3 style="margin-bottom:8px">Key moments</h3><div class="radio" style="max-height:none">'; hl.slice(0, 16).forEach(function (l) { h += '<div><span class="l">L' + l.lap + '</span><span class="' + l.k + '">' + esc(l.t.replace(/^Engineer:\s*/, '')) + '</span></div>'; }); h += '</div></div>'; }
  return h + '<button class="btn pri wide" data-act="r-next">' + (S.round >= seasonRounds(S) && !S.sit ? 'Season review' : 'Continue') + '</button></div>';
}
A['r-next'] = function () { RUN = null; UI.wk = null; UI.screen = 'hub'; UI.tab = 'utama'; save(); render(); };

/* ---------- mini game Fasa 6: restart, kereta lambat, grip hujan ---------- */
function restartGame(R, p) {
  RUN.wait = true; UI.mgCtx = { k: 'restart' };
  mgIntro('restart', function () { restartGo(R, p); });
}
function restartGo(R, p) {
  var t0 = 0, done = false, tm = 0, d = 900 + rnd() * 1500;
  showModal('<h2>Restart!</h2><p class="dim">Safety car is in. Tap when the screen turns GREEN. Don\'t jump it.</p><div class="big" id="rsg" style="padding:26px 0;border-radius:6px;background:#fde3e0;color:var(--bad)">WAIT...</div><button class="btn pri hit" data-tap="mg-rs">GO</button>');
  tm = setTimeout(function () { t0 = performance.now(); var e = document.getElementById('rsg'); if (e) { e.textContent = 'GREEN!'; e.style.background = '#dff3e6'; e.style.color = 'var(--good)'; } }, d);
  function fin() {
    if (done) return; done = true; clearTimeout(tm); UI.mkey = null;
    var early = !t0, rt = early ? 1 : (performance.now() - t0) / 1000, q = early ? 0.1 : clamp((0.5 - rt) / 0.3, 0, 1);
    p.rsb = (q - 0.5) * 1.6; UI.wk.mg.bq.push(q);
    showModal('<h2 class="' + (early ? 'bad' : q > 0.7 ? 'pur' : 'good') + '">' + (early ? 'Way too early! Hold it.' : Math.round(rt * 1000) + ' ms') + '</h2>');
    radio(R, early ? 'You went before the line. Nearly a penalty.' : q > 0.7 ? 'Restart power! Off like a rocket.' : 'Standard restart.', early ? 'x' : q > 0.7 ? 'me' : 'e');
    setTimeout(function () { closeModal(); RUN.wait = false; resume(); }, 650);
  }
  A['mg-rs'] = fin; UI.mkey = fin;
}
function backmarker(R, p) {
  if (RUN.bmCd != null && p.lap <= RUN.bmCd) return false;
  for (var i = 0; i < R.cars.length; i++) {
    var r = R.cars[i]; if (r === p || r.fin || r.dnf || r.s > p.s - 0.6) continue;
    var dd = r.s - p.s; dd -= Math.floor(dd);
    if (dd > 0.004 && dd < 0.012) {
      if (rnd() > 0.6) { RUN.bmCd = p.lap; return false; }
      RUN.wait = true; RUN.bmCd = p.lap + 2;
      radio(R, r.d.code + ' (backmarker) ahead. Blue flags are out. Let\'s see if he checks his mirrors.', 'e');
      UI.mgCtx = { k: 'lane', foe: r }; laneAny(function (q) {
        UI.wk.mg.bq.push(q);
        if (q < 0.35) { p.hold += 0.8; radio(R, 'Stuck behind ' + r.d.code + '. Lost nearly a second.', 'x', 1); }
        else if (q > 0.75) { p.s += 0.25 / p.pA; radio(R, 'Past ' + r.d.code + ' like he wasn\'t there. Clean!', 'me'); }
        RUN.wait = false; resume();
      });
      return true;
    }
  }
  return false;
}
function wetGrip(R, p) {
  RUN.wait = true; RUN.mgCd = p.lap + 2; UI.mgCtx = { k: 'grip', zone: (zoneAhead(R, p).z || {}).n };
  mgIntro('grip', function () { wetGo(R, p); });
  return true;
}
function wetGo(R, p) {
  var x = 0.3, held = false, b0 = 0.5, inB = 0, T = 3, t0 = performance.now(), last = t0, raf = 0, done = false;
  showModal('<h2>Wet track: throttle control</h2><p class="dim">Hold the button (or Space) for throttle, release to lift. Keep the needle in the green zone until the end.</p><div class="track"><div class="zone" id="gz"></div><div class="mk" id="mk"></div></div><div class="bar"><i id="gt" style="width:0%"></i></div><button class="btn pri hit" id="gbtn" style="min-height:80px;touch-action:none;user-select:none">HOLD</button>');
  var btn = document.getElementById('gbtn');
  function dn(e) { if (e) e.preventDefault(); held = true; } function up() { held = false; }
  btn.addEventListener('pointerdown', function (e) { try { btn.setPointerCapture(e.pointerId); } catch (x) { } dn(e); }); btn.addEventListener('pointerup', up); btn.addEventListener('pointercancel', up); btn.addEventListener('lostpointercapture', up);
  UI.mkeyDown = function () { held = true; }; UI.mkeyUp = up;
  function lp(now) {
    if (done) return;
    var dt = Math.min(0.05, (now - last) / 1000); last = now;
    var u = (now - t0) / 1000;
    b0 = 0.45 + 0.18 * Math.sin(u * 1.7) + 0.06 * Math.sin(u * 4.3);
    x = clamp(x + (held ? 0.85 : -0.75) * dt + Math.sin(u * 9) * 0.004, 0, 1);
    var bw = 0.2, ok = x >= b0 - bw / 2 && x <= b0 + bw / 2; if (ok) inB += dt;
    var gz = document.getElementById('gz'), mk = document.getElementById('mk'), gt = document.getElementById('gt');
    if (gz) { gz.style.left = ((b0 - bw / 2) * 100) + '%'; gz.style.width = (bw * 100) + '%'; }
    if (mk) mk.style.left = (x * 100) + '%';
    if (gt) gt.style.width = Math.min(100, u / T * 100) + '%';
    if (u >= T) { fin(inB / T); return; }
    raf = requestAnimationFrame(lp);
  }
  function fin(q) {
    done = true; cancelAnimationFrame(raf); UI.mkeyDown = null; UI.mkeyUp = null; UI.wk.mg.bq.push(q);
    var spin = q < 0.3;
    if (spin) { p.evalSpins = (p.evalSpins || 0) + 1; p.hold += 2.5; radio(R, 'Rear end let go. Little spin, but we kissed nothing.', 'x', 1); }
    else if (q > 0.75) { p.s += 0.3 / p.pA; radio(R, 'Throttle like silk. You\'re flying in the rain!', 'me'); }
    showModal('<h2 class="' + (spin ? 'bad' : q > 0.75 ? 'pur' : 'good') + '">' + (spin ? 'Lost the rear!' : q > 0.75 ? 'Smooth as silk' : 'Safe') + '</h2>');
    setTimeout(function () { closeModal(); RUN.wait = false; resume(); }, 650);
  }
  raf = requestAnimationFrame(lp);
  return true;
}

/* ---------- pertarungan: kereta berderet ikut jarak saat (depan di kiri), sampai 3 depan + 3 belakang ---------- */
var TRN = 3, TRW = 13.5, TRMAX = 3;
function trainCard() { return '<div class="card duel"><div class="lbl"><span>Battle · ahead ◀</span><span class="btchip" id="btchip">CLEAN AIR</span></div><div class="dtrk" id="dtrk"></div><div class="tinfo" id="tinfo"></div><div id="cap" class="cap"></div></div>'; }
function trainCarH(f) { return '<b class="' + (f.isP ? 'me' : S.rival && f.di === S.rival.di ? 'rv' : '') + '">' + f.d.code + '</b><span class="cv">' + carSVG(f.t, 90) + '</span>'; }
function trainPlace(list) {
  /* offset dari kereta kau (unit %), ikut jarak tapi tak bertindih */
  var n = list.length, lo = TRW, hi = 50 - TRW / 2, off = list.map(function (o) { return lo + Math.min(1, o.g / TRMAX) * (hi - lo); });
  for (var i = 1; i < n; i++) off[i] = Math.max(off[i], off[i - 1] + TRW);
  for (i = n - 1; i >= 0; i--) off[i] = Math.min(off[i], hi - (n - 1 - i) * TRW);
  return off;
}
function drawTrain(R, p, ahead, behind) {
  var tr = document.getElementById('dtrk'); if (!tr) return;
  ahead.sort(function (a, b) { return a.g - b.g; }); behind.sort(function (a, b) { return a.g - b.g; });
  var out = p.fin || p.dnf; if (out) { ahead = []; behind = []; }
  tr.style.opacity = out ? .45 : 1;
  ahead = ahead.slice(0, TRN); behind = behind.slice(0, TRN);
  var oa = trainPlace(ahead), ob = trainPlace(behind), slots = UI.tslot || (UI.tslot = []);
  function put(k, o, x) {
    var el = document.getElementById('ts' + k); if (!el) return;
    if (!o) { el.style.display = 'none'; slots[k] = -1; return; }
    if (slots[k] !== o.f.di) { slots[k] = o.f.di; el.innerHTML = trainCarH(o.f); }
    el.style.display = ''; el.style.left = x + '%';
  }
  function gap(k, x, g, drs) {
    var el = document.getElementById('tg' + k); if (!el) return;
    if (g == null) { el.style.display = 'none'; return; }
    el.style.display = ''; el.style.left = x + '%'; el.className = 'tgap' + (g < 0.35 ? ' hot' : '') + (drs ? ' drs' : '');
    el.innerHTML = g.toFixed(1) + (drs ? '<i>DRS</i>' : '');
  }
  var drsOk = R.lap >= 3 && R.wet < 0.3 && !R.sc;
  for (var i = 0; i < TRN; i++) {
    var xa = 50 - (oa[i] || 0), xb = 50 + (ob[i] || 0);
    put(TRN - 1 - i, ahead[i], xa); put(TRN + 1 + i, behind[i], xb);
    var pa = i ? 50 - oa[i - 1] : 50, pb = i ? 50 + ob[i - 1] : 50;
    gap(i, (xa + pa) / 2, ahead[i] ? ahead[i].g - (i ? ahead[i - 1].g : 0) : null, i === 0 && ahead[i] && ahead[i].g < 1 && drsOk);
    gap(TRN + i, (xb + pb) / 2, behind[i] ? behind[i].g - (i ? behind[i - 1].g : 0) : null, false);
  }
  trainInfo(R, p, ahead[0], behind[0]);
  var me = document.getElementById('ts' + TRN); if (me) me.className = 'tcar me' + ((ahead[0] && ahead[0].g < 1) || (behind[0] && behind[0].g < 1) ? ' fight' : '');
}

/* trend jarak: simpan sampel jarak setiap kereta, banding dengan satu lap lepas */
function gapTrend(R, f, g, ps) {
  var H = UI.gh || (UI.gh = {}), a = H[f.di] || (H[f.di] = []);
  if (!a.length || ps - a[a.length - 1][0] > 0.2) { a.push([ps, g]); if (a.length > 12) a.shift(); }
  for (var i = a.length - 1; i >= 0; i--) if (ps - a[i][0] >= 0.9) return g - a[i][1];
  return null;
}
function trainInfo(R, p, a, b) {
  var el = document.getElementById('tinfo'); if (!el) return;
  if (R.done || p.fin || p.dnf) { el.innerHTML = ''; return; }
  if (UI.tinfoT && performance.now() - UI.tinfoT < 400) return; UI.tinfoT = performance.now();
  var ps = p.s;
  function cell(o, ahead) {
    if (!o) return '<div class="ti"><small>' + (ahead ? 'Ahead' : 'Behind') + '</small><div class="dim">Clean air</div></div>';
    var f = o.f, tr = gapTrend(R, f, o.g, ps), good = tr != null && (ahead ? tr < -0.05 : tr > 0.05), bad = tr != null && (ahead ? tr > 0.05 : tr < -0.05);
    var trs = tr == null ? '<span class="dim">…</span>' : Math.abs(tr) < 0.05 ? '<span class="dim">steady</span>' : '<span class="' + (good ? 'good' : bad ? 'bad' : '') + '">' + (tr < 0 ? '▼' : '▲') + Math.abs(tr).toFixed(1) + '/lap</span>';
    return '<div class="ti"><small>' + (ahead ? 'Ahead' : 'Behind') + '</small><div class="row" style="gap:6px;flex-wrap:nowrap"><b>' + f.d.code + '</b><span class="mono">' + o.g.toFixed(1) + 's</span>' + tyc(f.comp) + '<span class="dim mono">' + Math.floor(f.eff) + 'L</span></div><div class="mono tt">' + trs + '</div></div>';
  }
  el.innerHTML = (p.fin || p.dnf) ? '' : cell(a, true) + cell(b, false);
}

/* lepas mini game serang/bertahan: tengok apa jadi betul-betul, jurutera komen */
function mgWatch(R, p) {
  var w = RUN.mgW; if (!w) return;
  var f = R.cars.filter(function (c) { return c.di === w.di; })[0];
  if (!f || f.dnf || p.dnf || p.fin) { RUN.mgW = null; return; }
  var ahead = f.s > p.s;
  if (w.kind === 'atk' && !ahead) { RUN.mgW = null; return; }          /* dah potong: readLog dah umum */
  if (w.kind === 'def' && ahead) { RUN.mgW = null; return; }           /* dia lepas: readLog dah umum */
  if (p.s > w.until) {
    RUN.mgW = null;
    if (w.kind === 'atk') radio(R, pick(['He held on this time. We go again next lap.', w.code + ' shut the door. No worries, we\'ve got DRS next lap.', 'Didn\'t happen. Save the tyres, try the next zone.']), 'e', 1);
    else radio(R, pick(['Door shut! ' + w.code + ' couldn\'t get by.', 'Great defending. ' + w.code + ' is still behind.', 'He tried, you held. Keep it up.']), 'me', 1);
  }
}

A['cls-all'] = function () { UI.clsAll = !UI.clsAll; render(); };
