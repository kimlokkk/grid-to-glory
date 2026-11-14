'use strict';
/* ===== Race weekend v3, phase 3: Race ("Lights to flag"). Presentation only: the sim, loop timing, actions and panel ids are unchanged.
   Kept ids: strip, cockpit, towerb, radiob, lastr, posb, planb, dtrk/tc*, btchip. New: rmap (circuit with team-coloured dots). ===== */
var RM = { R: null, cars: {}, labs: {}, T: null };

/* ---------- circuit map with real car sprites ---------- */
/* An oval keeps the cars readable; the real layout is still shown on the qualifying and strategy banners. */
function rmOval() {
  if (RM.oval) return RM.oval;
  var N = 220, pts = [], i;
  for (i = 0; i < N; i++) { var th = Math.PI / 2 + i / N * Math.PI * 2; pts.push([200 + 168 * Math.cos(th), 120 + 88 * Math.sin(th)]); }
  var cum = [0];
  for (i = 1; i <= N; i++) { var a = pts[i - 1], b = pts[i % N]; cum.push(cum[i - 1] + Math.hypot(b[0] - a[0], b[1] - a[1])); }
  var T = { pts: pts, cum: cum, total: cum[N], d: 'M' + pts.map(function (q) { return q[0].toFixed(1) + ' ' + q[1].toFixed(1); }).join('L') + 'Z' };
  T.marks = [1 / 3, 2 / 3, 0].map(function (f) { var p0 = posAt(T, f), p1 = posAt(T, (f + 0.004) % 1), dx = p1[0] - p0[0], dy = p1[1] - p0[1], l = Math.hypot(dx, dy) || 1; return { x: p0[0], y: p0[1], nx: -dy / l, ny: dx / l }; });
  return (RM.oval = T);
}
function rmBuild(R) {
  var svg = document.getElementById('rmap'); if (!svg) { RM.R = null; return; }
  var T = buildTrack(R.ci), st = posAt(T, 0), m0 = T.marks[2], zl = '';
  (R.zones || []).forEach(function (z) {
    var a = posAt(T, z.at), b = posAt(T, (z.at + 0.004) % 1), dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l;
    zl += '<g class="rm-zone"><circle cx="' + a[0].toFixed(1) + '" cy="' + a[1].toFixed(1) + '" r="3.2"/><text x="' + (a[0] + nx * 15).toFixed(1) + '" y="' + (a[1] + ny * 15 + 2.5).toFixed(1) + '">' + esc(z.n) + '</text></g>';
  });
  var cars = '', labs = '';
  R.cars.forEach(function (f) {
    var me = f.isP, rv = S.rival && f.di === S.rival.di;
    cars += '<g class="rm-car' + (me ? ' me' : '') + (rv ? ' rv' : '') + '" id="mc' + f.di + '">' + (me ? '<circle class="rm-halo" r="11"/>' : '') + '<circle class="rm-dot" r="' + (me ? 6.5 : 4.6) + '" fill="' + f.t.color + '"/></g>';
    labs += '<g class="rm-lab' + (me ? ' me' : '') + (rv ? ' rv' : '') + '" id="ml' + f.di + '" style="display:none"><path class="rm-leader"/><g class="rm-tag"><rect x="-13" y="-6" width="26" height="12" rx="3"/><text y="2.6">' + esc(f.d.code) + '</text></g></g>';
  });
  svg.innerHTML = '<path class="rm-run" d="' + T.d + '"/><path class="rm-kerb" d="' + T.d + '"/><path class="rm-kerb2" d="' + T.d + '"/><path class="rm-road" d="' + T.d + '"/><path class="rm-mid" d="' + T.d + '"/>' +
    '<g class="rm-start" transform="translate(' + st[0].toFixed(1) + ' ' + st[1].toFixed(1) + ') rotate(' + (Math.atan2(m0.ny, m0.nx) * 180 / Math.PI).toFixed(1) + ')"><rect x="-8" y="-1.6" width="16" height="3.2"/><rect class="w" x="-8" y="-1.6" width="2" height="1.6"/><rect class="w" x="-4" y="-1.6" width="2" height="1.6"/><rect class="w" x="0" y="-1.6" width="2" height="1.6"/><rect class="w" x="4" y="-1.6" width="2" height="1.6"/><rect class="w" x="-6" y="0" width="2" height="1.6"/><rect class="w" x="-2" y="0" width="2" height="1.6"/><rect class="w" x="2" y="0" width="2" height="1.6"/><rect class="w" x="6" y="0" width="2" height="1.6"/></g>' +
    zl + '<g id="rm-cars">' + cars + '</g><g>' + labs + '</g>';
  RM.R = R; RM.T = T; RM.cars = {}; RM.labs = {}; RM.tags = {}; RM.lines = {}; RM.svg = svg; RM.prog = document.getElementById('rmprog'); RM.pr = null; RM.hot = null;
  R.cars.forEach(function (f) { RM.cars[f.di] = document.getElementById('mc' + f.di); RM.labs[f.di] = document.getElementById('ml' + f.di); RM.tags[f.di] = RM.labs[f.di].querySelector('.rm-tag'); RM.lines[f.di] = RM.labs[f.di].querySelector('.rm-leader'); });
  var me = RM.cars[R.p.di]; if (me) me.parentNode.appendChild(me);   /* player drawn on top */
}
function rmDraw(R, al) {
  if (RM.R !== R) { if (document.getElementById('rmap')) rmBuild(R); if (RM.R !== R) return; }
  var T = RM.T, p = R.p, ord = RUN && RUN.ord ? RUN.ord : trackOrder(R), pi = ord.indexOf(p), nb = {};
  if (pi > 0) nb[ord[pi - 1].di] = 1; if (ord[pi + 1] && !ord[pi + 1].dnf) nb[ord[pi + 1].di] = 1;
  var hot = !!(RUN && RUN.hot && !R.sc); if (RM.hot !== hot) { RM.hot = hot; RM.svg.classList.toggle('hot', hot); }
  if (RM.prog) { var pr = clamp((p.fin ? R.L : sAt(R, p, al)) / R.L * 100, 0, 100).toFixed(1); if (RM.pr !== pr) { RM.pr = pr; RM.prog.style.width = pr + '%'; } }
  var labels = [];
  R.cars.forEach(function (f) {
    var g = RM.cars[f.di], lb = RM.labs[f.di]; if (!g) return;
    if (f.dnf || (f.fin && !f.isP)) { if (g.style.display !== 'none') { g.style.display = 'none'; lb.style.display = 'none'; } return; }
    var s = sAt(R, f, al), fr = s - Math.floor(s), a = posAt(T, fr), b = posAt(T, (fr + 0.006) % 1), ang = Math.atan2(b[1] - a[1], b[0] - a[0]) * 180 / Math.PI;
    if (g.style.display === 'none') g.style.display = '';
    g.setAttribute('transform', 'translate(' + a[0].toFixed(1) + ' ' + a[1].toFixed(1) + ') rotate(' + ang.toFixed(0) + ')');
    var pit = f.hold > 0 && !f.fin; if (g._pit !== pit) { g._pit = pit; g.classList.toggle('pit', pit); }
    var show = f.isP || nb[f.di] || (S.rival && f.di === S.rival.di);
    if (show) labels.push({ f: f, a: a, priority: f.isP ? 0 : nb[f.di] ? 1 : 2 });
    else if (lb.style.display !== 'none') lb.style.display = 'none';
  });
  var placed = [];
  labels.sort(function (a, b) { return a.priority - b.priority || a.f.di - b.f.di; });
  labels.forEach(function (l) {
    var f = l.f, a = l.a, lb = RM.labs[f.di], spot = null;
    var offsets = f.isP ? [[0, -18], [-28, -18], [28, -18], [0, -35], [-28, 18], [28, 18]] : [[0, 18], [-28, 18], [28, 18], [0, 35], [-28, -18], [28, -18], [0, 52], [0, -52]];
    offsets.some(function (v) {
      var q = [clamp(a[0] + v[0], 15, 385), clamp(a[1] + v[1], 9, 231)];
      if (placed.some(function (b) { return Math.abs(q[0] - b[0]) < 29 && Math.abs(q[1] - b[1]) < 15; })) return false;
      spot = q; return true;
    });
    if (!spot) { lb.style.display = 'none'; return; }
    placed.push(spot); lb.style.display = '';
    lb.setAttribute('transform', 'translate(' + a[0].toFixed(1) + ' ' + a[1].toFixed(1) + ')');
    var dx = (spot[0] - a[0]).toFixed(1), dy = (spot[1] - a[1]).toFixed(1);
    RM.tags[f.di].setAttribute('transform', 'translate(' + dx + ' ' + dy + ')');
    RM.lines[f.di].setAttribute('d', 'M0 0L' + dx + ' ' + dy);
  });
}
var rmOldSetup = setupMap; setupMap = function (R) { rmOldSetup(R); RM.R = null; rmBuild(R); };
var rmOldDraw = drawCars; drawCars = function (R, al) { rmOldDraw(R, al); rmDraw(R, al); };

/* ---------- F1 steering wheel ---------- */
function whRing(v, col, txt, lab) {
  var c = 2 * Math.PI * 15, f = clamp(v, 0, 1);
  return '<div class="wh-pod"><svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="15" fill="none" stroke="#ffffff1f" stroke-width="5"/><circle cx="20" cy="20" r="15" fill="none" stroke="' + col + '" stroke-width="5" stroke-linecap="round" stroke-dasharray="' + (c * f).toFixed(1) + ' ' + c.toFixed(1) + '" transform="rotate(-90 20 20)"/></svg><b>' + txt + '</b><small>' + lab + '</small></div>';
}
function whDial(cx, cy, label, manual, mode) {
  var ang = manual ? [-42, 0, 42][mode] : -96, t = '';
  [-96, -42, 0, 42].forEach(function (a) { t += '<line class="wh-tick" x1="0" y1="-13.5" x2="0" y2="-11" transform="rotate(' + a + ')"/>'; });
  return '<g transform="translate(' + cx + ' ' + cy + ')"><circle class="wh-dial" r="10"/>' + t + '<g transform="rotate(' + ang + ')"><circle class="wh-knob" r="7"/><line class="wh-ptr" x1="0" y1="-7" x2="0" y2="-2.5"/></g><text class="wh-dl" y="19">' + label + '</text></g>';
}
function whGauge(v, col) {
  var c = 2 * Math.PI * 16, a = c * 0.75, f = clamp(v, 0, 1);
  return '<svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="19" fill="#0c0e14" stroke="#4a5378" stroke-width="1.2"/><circle cx="20" cy="20" r="16" fill="none" stroke="#ffffff1f" stroke-width="4" stroke-linecap="round" stroke-dasharray="' + a.toFixed(1) + ' ' + c.toFixed(1) + '" transform="rotate(135 20 20)"/><circle cx="20" cy="20" r="16" fill="none" stroke="' + col + '" stroke-width="4" stroke-linecap="round" stroke-dasharray="' + (a * f).toFixed(1) + ' ' + c.toFixed(1) + '" transform="rotate(135 20 20)"/></svg>';
}
/* Display state only. Never call crewTime/pitLossOf from a repaint: they consume race RNG. */
function raceAlert(R) {
  var p = R.p, hp = tyreHealth(p, R), fuel = fuelMargin(R, p);
  if (fuel < 0) return { cls: 'danger', title: 'Fuel critical', detail: fuel.toFixed(1) + 'L at the flag · save fuel', key: 'fuelMode', value: 0, action: 'Save fuel' };
  if (R.wet > 0.28 && p.comp !== wetComp(R)) {
    var wetTyre = wetComp(R), wetDetail = TYN[wetTyre] + ' recommended · review pit call';
    if (p.pitReq && p.pitOk) wetDetail = p.pitReq === wetTyre ? TYN[wetTyre] + ' queued · box this lap' : TYN[wetTyre] + ' recommended · ' + TYN[p.pitReq] + ' queued';
    return { cls: 'danger', title: SLICK[p.comp] ? 'Wet track · slick tyres' : 'Wet-tyre crossover', shortTitle: 'Check tyres', detail: wetDetail, pit: true, action: 'Pit wall' };
  }
  if (tyreHeat(p) > 0.78) return { cls: 'danger', title: 'Tyres overheating', detail: Math.round(hp * 100) + '% left · cool this stint', key: 'push', value: 0, action: 'Cool tyres' };
  if (hp < 0.18) return { cls: 'danger', title: 'Tyres at the limit', detail: Math.round(hp * 100) + '% left · consider boxing', pit: true, action: 'Pit wall' };
  if (raceMode(p, 'energyMode') === 2 && p.en < 0.15) return { cls: 'warning', title: 'Battery running low', detail: 'Deploy limited · recover energy', key: 'energyMode', value: 0, action: 'Harvest' };
  return null;
}
function raceBoost(R) {
  var p = R.p;
  if (R.done || p.fin || p.dnf) return { label: 'OFFLINE', detail: 'Session complete' };
  if (R.sc) return { label: 'NEUTRAL', detail: 'Overtake disabled under ' + R.sc };
  if (p.hold > 0) return { label: 'PIT LANE', detail: 'Overtake unavailable in the pit lane' };
  if (p.atk > 0) return { label: 'DEPLOYING', readout: 'ACTIVE ' + Math.ceil(p.atk) + 's', detail: 'Overtake active · ' + Math.ceil(p.atk) + 's left' };
  if (p.lap < 2) return { label: 'LAP 2', detail: 'Overtake unlocks on lap 2' };
  if (p.atkCd > 0) return { label: Math.ceil(p.atkCd) + 's', readout: 'COOLDOWN ' + Math.ceil(p.atkCd) + 's', detail: 'Overtake cooldown · ' + Math.ceil(p.atkCd) + 's remaining' };
  if (p.en < 0.2) return { label: 'LOW ERS', detail: 'Overtake needs 20% battery' };
  return { label: 'READY', detail: 'Overtake ready · press OT' };
}
function wheelHTML(R) {
  var p = R.p, o = trackOrder(R), i = o.indexOf(p), ah = i > 0 ? o[i - 1] : null, hp = tyreHealth(p, R), spare = fuelMargin(R, p);
  var gap = ah ? Math.max(0, (Math.min(ah.s, R.L) - p.s) * (p.pA || R.c.base)) : 99, lit = R.sc ? 15 : clamp(Math.round((2.5 - gap) / 2.5 * 15), 0, 15), mode = R.sc ? ' sc' : p.atk > 0 ? ' boost' : '';
  var leds = ''; for (var k = 0; k < 15; k++) leds += '<i class="' + (k < 5 ? 'g' : k < 10 ? 'r' : 'b') + (k < lit ? ' on' : '') + '"></i>';
  var tc = COMP[p.comp] ? COMP[p.comp].col : '#fff';
  var pos = i + 1, now = performance.now();
  if (RM.posR !== R) { RM.posR = R; RM.pos = pos; RM.posT = -1e9; }
  if (pos !== RM.pos) { RM.posD = pos < RM.pos ? 1 : -1; RM.posN = Math.abs(pos - RM.pos); RM.posT = now; RM.pos = pos; if (RM.posD > 0 && RUN && !RUN.fast && R.lap > 1) { try { snd('good'); } catch (e) { } } }
  var pop = now - RM.posT < 1800 && R.lap > 1 ? (RM.posD > 0 ? ' up' : ' dn') : '';
  var alert = raceAlert(R), boost = raceBoost(R);
  var status = R.sc ? (R.sc === 'SC' ? 'SAFETY CAR' : 'VSC') : alert ? (alert.shortTitle || alert.title) : p.pitReq && p.pitOk ? 'BOX THIS LAP' : p.atk > 0 ? 'OVERTAKE' : gap < 1 ? 'IN THE FIGHT' : 'RACE';
  var tank = clamp(p.fuel / (R.L * raceDistance(R) * P2.fuel0), 0, 1);
  var dial = function (key, lab, val, frac, col, names, extra) {
    var manual = !!(p.bot && p.bot[key] != null), m = raceMode(p, key);
    return '<button class="wh-dial-b' + (manual ? ' man' : '') + '" data-act="r-control" data-k="' + key + '" aria-label="Adjust ' + lab + ' control">' + whGauge(frac, col) + '<span class="wh-dl2"><small>' + lab + '</small>' + (extra || '') + '</span><span class="wh-dv"><b>' + val + '</b></span><em>' + (manual ? names[m] : 'Auto') + '</em></button>';
  };
  return '<div class="wh' + mode + (alert ? ' caution' : '') + '" role="group" aria-label="Steering wheel display"><svg class="wh-body" viewBox="0 0 360 230" aria-hidden="true">' +
    '<defs><pattern id="whcf" width="6" height="6" patternUnits="userSpaceOnUse"><rect width="6" height="6" fill="#20242f"/><rect width="3" height="3" fill="#2a2f3d"/><rect x="3" y="3" width="3" height="3" fill="#2a2f3d"/></pattern></defs>' +
    '<path class="wh-paddle" d="M40 62 L18 72 L14 168 L40 180Z"/><path class="wh-paddle" d="M320 62 L342 72 L346 168 L320 180Z"/>' +
    '<path class="wh-grip" d="M8 62 Q4 36 24 30 L52 26 L52 204 L28 212 Q8 214 6 190Z"/><path class="wh-grip" d="M352 62 Q356 36 336 30 L308 26 L308 204 L332 212 Q352 214 354 190Z"/>' +
    '<path class="wh-rib" d="M14 78H44M13 96H44M13 114H44M13 132H44M13 150H44M14 168H44M316 78H346M316 96H347M316 114H347M316 132H347M316 150H347M316 168H346"/>' +
    '<path class="wh-plate" d="M44 22 Q44 8 62 8 L298 8 Q316 8 316 22 L316 180 Q316 206 286 210 L248 214 Q236 196 180 196 Q124 196 112 214 L74 210 Q44 206 44 180Z"/>' +
    '<rect class="wh-ledbar" x="62" y="9" width="236" height="15" rx="7.5"/>' +
    '<g class="wh-mini"><circle cx="65" cy="100" r="6"/><text x="65" y="101.8">N</text><circle cx="295" cy="100" r="6"/><text x="295" y="101.8">RAD</text><circle cx="83" cy="112" r="4.2"/><text x="83" y="113.4">+</text><circle cx="277" cy="112" r="4.2"/><text x="277" y="113.4">−</text></g></svg>' +
    '<button class="wh-side wh-boost' + (p.atk > 0 ? ' on' : '') + '" data-act="r-atk"' + (canBoost(R, p) ? '' : ' disabled') + ' aria-label="Boost" title="' + boost.detail + '"><b>OT</b><small>' + boost.label + '</small></button>' +
    '<button class="wh-side wh-pit' + (UI.pitOpen ? ' on' : '') + '" data-act="r-pitm" aria-label="' + (UI.pitOpen ? 'Close pit menu' : 'Pit') + '"><b>BOX</b><small>' + (UI.pitOpen ? 'Close' : 'Pit') + '</small></button>' +
    '<div class="wh-leds" aria-hidden="true">' + leds + '</div>' +
    '<div class="wh-screen' + pop + '"><div class="wh-top"><em class="wh-status">' + status + '</em>' + (pop ? '<em class="wh-pop">' + (RM.posD > 0 ? '▲ +' : '▼ −') + RM.posN + '</em>' : '') + '</div>' +
    (UI.phone ? '<div class="rpos" id="posb"></div>' : posHTML(R)) +
    '<div class="wh-lap" title="' + boost.detail + '"><span>OT · ' + (boost.readout || boost.label) + '</span><i class="wh-ers"><u style="width:' + Math.round(p.en * 100) + '%"></u></i></div></div>' +
    '<div class="wh-dials">' +
    dial('push', 'Tyres', Math.round(hp * 100) + '%', hp, hp > 0.5 ? '#39d98a' : hp > 0.2 ? '#ffd24a' : '#ff5a4f', PUSHN, '<i class="wh-tc" style="background:' + tc + '"></i>' + p.comp + ' ' + Math.floor(p.eff) + 'L') +
    dial('fuelMode', 'Fuel', (spare < 0 ? '' : '+') + spare.toFixed(1) + 'L', tank, spare < 0 ? '#ff5a4f' : spare < 0.3 ? '#ffd24a' : '#5aa9ff', PUSHN, Math.round(tank * 100) + '% tank') +
    dial('energyMode', 'Energy', Math.round(p.en * 100) + '%', p.en, '#a78bfa', ['Harvest', 'Balanced', 'Deploy'], 'ERS') +
    '</div>' + (p.pitReq && p.pitOk ? '<button class="wh-boxnote" data-act="r-pitm" aria-label="Review pit call">BOX ' + p.pitReq + ' · THIS LAP</button>' : '') + '</div>';
}

/* ---------- cockpit: wheel + controls (same actions and classes) ---------- */
cockpitHTML = function (R) {
  var p = R.p, h = '';
  if (R.done) {
    var o = trackOrder(R), pos = p.dnf ? null : o.indexOf(p) + 1, t = p.t || myTeam();
    return '<div class="rflag' + (pos === 1 ? ' win' : pos && pos <= 3 ? ' pod' : '') + '"><div class="rflag-band" aria-hidden="true"></div><small>Chequered flag</small><h2>' + (p.dnf ? 'Did not finish' : pos === 1 ? 'You win!' : 'You finish P' + pos) + '</h2><p>' + (p.dnf ? esc(p.dnf) + '.' : pos <= 3 ? 'Podium. Get up there.' : pos <= 10 ? 'In the points.' : 'Race complete.') + '</p><button class="btn pri wide" data-act="r-done">View results →</button></div>';
  }
  if (p.dnf) return '<div class="rflag out"><small>Retired</small><h2>You\'re out of the race</h2><p>' + esc(p.dnf) + '.</p><button class="btn wide" data-act="r-ff">Skip to the finish</button></div>';
  if (p.fin) return '<div class="rflag pod"><div class="rflag-band" aria-hidden="true"></div><small>Finished</small><h2>Across the line</h2><p>Waiting for the others to finish.</p><button class="btn wide" data-act="r-ff">Skip to the finish</button></div>';
  var hp = tyreHealth(p, R), spare = fuelMargin(R, p);
  h += wheelHTML(R);
  var alert = raceAlert(R);
  if (alert) {
    var active = alert.key && raceMode(p, alert.key) === alert.value;
    h += '<div class="rx-alert ' + alert.cls + '"><i aria-hidden="true">!</i><div><small>Engineer · ' + esc(alert.title) + '</small><b>' + esc(alert.detail) + '</b></div>' +
      (active ? '<span class="rx-alert-active">' + (alert.key === 'energyMode' ? 'Harvest active' : 'Save active') + '</span>' : '<button class="btn sm" data-act="' + (alert.pit ? 'r-pitm' : 'r-mode') + '"' + (alert.key ? ' data-k="' + alert.key + '" data-v="' + alert.value + '"' : '') + '>' + alert.action + '</button>') + '</div>';
  }
  if (!UI.phone) h += '<p class="rplan">Plan: ' + planText(R, p) + '</p>';
  h += '<div class="ctlrow">' + (RUN.pause ? '<button class="btn pri" data-act="r-go">' + (R.t > 0 ? '▶ Resume' : '▶ Start') + '</button>' : '<button class="btn" data-act="r-pause">❚❚ Pause</button>') +
    (UI.phone ? '<button class="btn sm" data-act="r-playback" aria-label="Choose race playback speed">Playback · ' + (RUN.highlights ? 'Highlights' : RUN.fast ? 'Fast' : RUN.spd + '×') + '</button>' :
      [1, 2, 4].map(function (v) { return '<button class="btn sm ' + (RUN.spd === v && !RUN.fast ? 'on' : '') + '" data-act="r-spd" data-v="' + v + '">' + v + '×</button>'; }).join('') +
      '<button class="btn sm ' + (RUN.fast && !RUN.highlights ? 'on' : '') + '" data-act="r-fast" aria-label="Fast race playback">Fast</button><button class="btn sm ' + (RUN.highlights ? 'on' : '') + '" data-act="r-highlights" aria-pressed="' + !!RUN.highlights + '">Highlights</button>') + '</div>';
  return h;
};

function racePitSheet(R) {
  var p = R.p, rem = Math.max(1, R.L - p.lap + 1), queued = p.pitReq && p.pitOk, pick = queued ? p.pitReq : chooseComp(p, R, rem);
  var loss = (R.c.pit * P2.pitS + (p.crewT == null ? 0 : p.crewT - 2.4)) * (R.sc === 'SC' ? 0.5 : R.sc === 'VSC' ? 0.7 : 1);
  return '<div class="rx-pit-overlay"><button class="rx-pit-shade" data-act="r-pitm" aria-label="Close pit wall"></button><section class="rx-pit-sheet" role="dialog" aria-modal="true" aria-labelledby="rx-pit-title">' +
    '<div class="rx-pit-head"><span><i></i>PIT WALL / LAP ' + p.lap + '</span><button class="btn sm" id="rx-pit-close" data-act="r-pitm" aria-label="Close pit menu">✕</button></div>' +
    '<h2 id="rx-pit-title">' + (queued ? 'Box, box.' : 'Make the call.') + '</h2><p>' + (queued ? TYN[p.pitReq] + ' tyres ready. Boxing at the end of this lap.' : 'Fresh rubber. A new chance to attack.') + '</p>' +
    '<div class="rx-pit-stats"><span><small>To the flag</small><b>' + rem + ' laps</b></span><span><small>Est. pit loss</small><b>≈ ' + loss.toFixed(1) + 's</b></span><span><small>Current tyres</small><b>' + p.comp + ' · ' + Math.round(tyreHealth(p, R) * 100) + '%</b></span></div>' +
    (queued ? '<button class="btn wide" data-act="r-pitx">Cancel pit call · stay out</button>' : '<div class="rx-pit-pick"><span>Engineer\'s pick</span><b>' + TYN[pick] + '</b><small>For the remaining distance</small></div><div class="tyrow rx-pit-tyres">' + ['S', 'M', 'H', 'I', 'W'].map(function (k) {
      return '<button class="btn' + (k === pick ? ' recommended' : '') + '" data-act="r-pit" data-v="' + k + '" aria-label="Box for ' + TYN[k] + '">' + (k === pick ? '<em>Pick</em>' : '') + sgTyre(k, 40) + '<b>' + TYN[k] + '</b><small>' + (SLICK[k] ? '≈ ' + Math.round(tyreLife(p, R, k) / raceDistance(R)) + 'L life' : k === 'I' ? 'Damp / wet' : 'Heavy rain') + '</small></button>';
    }).join('') + '</div>') +
    '<p class="rx-pit-note">' + (R.sc ? R.sc + ' · reduced pit loss. ' : '') + 'Estimate assumes a 2.4s service; crew and traffic can change it.' + (mandOf(p) ? ' Two dry compounds still required.' : '') + '</p><div class="rx-pit-foot"><span><i class="' + (RUN.pause ? 'paused' : '') + '"></i>' + (RUN.pause ? 'Race paused' : 'Race live') + '</span><button class="btn" data-act="r-pitm">Back to race →</button></div></section></div>';
}
function paintPitSheet(R) {
  var root = document.getElementById('rxpit'); if (!root) return;
  if (R.done || R.p.fin || R.p.dnf || document.querySelector('#modal [data-act="pc-yes"]')) UI.pitOpen = false;
  var focus = document.activeElement, restore = root.contains(focus) && focus.dataset ? { act: focus.dataset.act, v: focus.dataset.v, id: focus.id } : null;
  setHTML('rxpit', UI.pitOpen ? racePitSheet(R) : '');
  if (restore && !focus.isConnected) {
    var buttons = root.querySelectorAll('button');
    for (var i = 0; i < buttons.length; i++) if (buttons[i].id === restore.id && buttons[i].dataset.act === restore.act && buttons[i].dataset.v === restore.v) { buttons[i].focus({ preventScroll: true }); break; }
  }
}
var rmPitToggle = A['r-pitm'];
A['r-pitm'] = function () { rmPitToggle(); var close = document.getElementById('rx-pit-close'); if (close) close.focus(); else { var pit = document.querySelector('[data-act="r-pitm"].wh-pit'); if (pit) pit.focus(); } };
var rmPitCancel = A['r-pitx'];
A['r-pitx'] = function () { UI.pitOpen = false; rmPitCancel(); };
document.addEventListener('keydown', function (e) {
  var sheet = document.querySelector('.rx-pit-sheet'); if (!sheet) return;
  if (e.key === 'Escape') { e.preventDefault(); A['r-pitm'](); }
  if (e.key === 'Tab') {
    var buttons = sheet.querySelectorAll('button'), first = buttons[0], last = buttons[buttons.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
});

/* ---------- layout ---------- */
/* Weather uses the same uncertain forecast as strategy. All helpers are read-only. */
function raceWeatherState(R) {
  var w = R.w, now = R.lapPos || 0, err = R.p.fcErr || 0;
  var band = sgRain({ w: w, fcErr: err }, R.L), raining = w.int > 0 && now >= w.start && now < w.end;
  var end = band ? band[1] : 0, incoming = w.type === 'hujan' && now < end && !raining;
  var phase = raining ? 'rain' : R.wet >= 0.08 ? 'drying' : incoming ? 'incoming' : 'dry';
  function range(lap) { var lo = clamp(Math.floor(lap) - 1, 1, R.L), hi = clamp(Math.ceil(lap) + 1, lo, R.L); return lo + '–' + hi; }
  var title = raining ? (w.int > 0.68 ? 'Heavy rain' : 'Rain falling') : phase === 'drying' ? 'Track drying' : incoming ? 'Rain expected' : 'Dry track';
  var tag = 'Dry to flag', label = 'Outlook';
  if (raining) { label = end >= R.L ? 'Rain' : 'Easing ≈'; tag = end >= R.L ? 'To the flag' : 'L' + range(w.end + err * 0.7); }
  else if (phase === 'drying') { label = 'Surface'; tag = wetLabel(R.wet); }
  else if (incoming) { label = band[0] - now < 3 ? 'Rain soon ≈' : 'Rain window ≈'; tag = 'L' + range(w.start + err); }
  else if (w.type !== 'kering') { label = 'Outlook'; tag = 'Clearing'; }
  var summary = fc2(R.c, w, R.L, err);
  if (raining) summary = end >= R.L ? 'Rain is falling. Forecast to continue through the finish. Surface wetness can keep changing.' : 'Rain is falling. Expected to ease around lap ' + range(w.end + err * 0.7) + '. The circuit can stay wet after rain eases. Timing may vary.';
  else if (phase === 'drying') summary = 'Rain has eased. The surface is still ' + wetLabel(R.wet).toLowerCase() + '. Watch the wetness level as the dry line returns.';
  return { phase: phase, raining: raining, title: title, tag: tag, label: label, band: band, progress: clamp(now / R.L * 100, 0, 100), summary: summary };
}
function raceWeatherIcon(phase) {
  var sun = '<g class="wx-sun"><circle cx="16" cy="15" r="6"/><path d="M16 4v3m0 16v3M5 15h3m16 0h3M8 7l2 2m12 12 2 2M8 23l2-2M22 9l2-2"/></g>';
  var cloud = '<path class="wx-cloud" d="M12 28a6 6 0 0 1-1-12 9 9 0 0 1 17-3 7.5 7.5 0 1 1 3 15Z"/>';
  var drops = '<g class="wx-drops"><path d="m15 32-2 4"/><path d="m24 32-2 4"/><path d="m33 32-2 4"/></g>';
  return '<svg viewBox="0 0 44 44" aria-hidden="true">' + (phase !== 'rain' ? sun : '') + (phase !== 'dry' ? cloud : '') + (phase === 'rain' || phase === 'incoming' ? drops : '') + '</svg>';
}
function raceWeatherTimeline(R, m, detail) {
  var band = m.band, desc = band ? 'Estimated rain window. Timing may vary.' : 'Dry conditions expected through the race.';
  return '<div class="wx-timeline" role="img" aria-label="' + desc + '"><div class="wx-line">' + (band ? '<i class="wx-rain-band" style="left:' + (band[0] / R.L * 100).toFixed(2) + '%;width:' + (Math.max(0, band[1] - band[0]) / R.L * 100).toFixed(2) + '%"></i>' : '') +
    '<i class="wx-now"' + (detail ? ' style="left:' + m.progress.toFixed(2) + '%"' : ' id="wx-now"') + '></i></div><div class="wx-scale"><span>L1</span><span>' + (band ? '<i></i>Rain forecast · approx.' : 'Dry outlook') + '</span><span>L' + R.L + '</span></div></div>';
}
function raceWeatherHTML(R, m) {
  m = m || raceWeatherState(R);
  return '<section class="wx ' + m.phase + '"><button class="wx-open" data-act="r-weather" aria-label="Open weather forecast"><span class="wx-icon">' + raceWeatherIcon(m.phase) + '</span><span class="wx-heading"><small><i></i>WEATHER / LIVE</small><b>' + m.title + '</b></span><span class="wx-outlook"><small>' + m.label + '</small><b>' + m.tag + '<em>›</em></b></span></button>' + raceWeatherTimeline(R, m, false) + '</section>';
}
function paintRaceWeather(R) {
  var m = raceWeatherState(R);
  setHTML('rxweather', raceWeatherHTML(R, m));
  var marker = document.getElementById('wx-now'); if (marker) marker.style.left = m.progress.toFixed(2) + '%';
}
A['r-weather'] = function () {
  if (!RUN) return;
  stopRace(); paintPanels(true);
  var R = RUN.R, m = raceWeatherState(R), wet = R.wet, comp = R.p.comp;
  var call;
  if (wet > 0.28) call = comp !== wetComp(R) ? TYN[wetComp(R)] + ' recommended for the current surface. Review the pit call.' : 'Wet tyres fitted. Watch the surface as conditions change.';
  else if (m.raining) call = 'Rain is falling. Watch the tyre crossover as the surface gets wetter.';
  else if (!SLICK[comp]) call = m.phase === 'incoming' ? 'Dry surface, wet tyres fitted. Watch the rain window.' : 'The surface is drying. Review the switch back to slicks.';
  else call = 'Slicks suit the current surface. Watch the forecast.';
  showModal('<div class="wx-details ' + m.phase + '"><div class="wx-dialog-head"><small>WEATHER CENTRE / PIT WALL</small><button class="btn sm" data-act="mclose" aria-label="Close weather forecast">✕</button></div><div class="wx-hero"><span class="wx-icon">' + raceWeatherIcon(m.phase) + '</span><div><small>' + (m.phase === 'incoming' ? 'Forecast watch' : 'Current conditions') + '</small><h2>' + m.title + '</h2></div></div>' +
    '<div class="wx-surface"><span>TRACK WETNESS</span><b>' + Math.round(wet * 100) + '% <small>' + wetLabel(wet) + '</small></b><i><u style="width:' + Math.round(wet * 100) + '%"></u></i></div>' +
    '<div class="wx-detail-forecast"><small>RACE OUTLOOK</small>' + raceWeatherTimeline(R, m, true) + '<p>' + esc(m.summary) + '</p></div>' +
    '<div class="wx-engineer"><small>ENGINEER / ' + comp + ' FITTED</small><b>' + call + '</b><button class="btn" data-act="r-weather-pit"' + (R.done || R.p.fin || R.p.dnf ? ' disabled' : '') + '>Open pit wall →</button></div><p class="wx-paused">' + (R.done ? 'Session complete · weather at the finish.' : 'Race paused · close to return to the cockpit.') + '</p></div>');
};
A['r-weather-pit'] = function () { if (!RUN || RUN.R.done || RUN.R.p.fin || RUN.R.p.dnf) return; closeModal(); if (!UI.pitOpen) A['r-pitm'](); };
function rmMapCard() { return '<div class="rmapc"><i class="rm-prog" aria-hidden="true"><u id="rmprog"></u></i><div id="rxweather"></div><div class="rm-ident"><span>TRACK POSITION</span><span><i></i>YOU</span></div><svg id="rmap" class="rmap" viewBox="0 0 400 240" role="img" aria-label="Circuit map with every car"></svg></div>'; }
vRacePhone = function (R) {
  var t = UI.rtab === 'ked' || UI.rtab === 'radio' ? UI.rtab : 'trek';
  var h = '<div class="rfull rx tab-' + t + '"><div class="rtop5"><div class="rhead" id="strip"></div><button class="btn sm" data-act="wk-quit">Exit</button></div>' +
    '<div class="rtabs">' + [['trek', 'Track'], ['ked', 'Timing'], ['radio', 'Radio']].map(function (x) { return '<button class="' + (t === x[0] ? 'on' : '') + '" data-act="rtab" data-v="' + x[0] + '">' + x[1] + '</button>'; }).join('') + '</div>' +
    '<div class="rview">' +
    '<div class="v-trek">' + rmMapCard() + trainCard() + '<p class="dim plan5" id="planb"></p></div>' +
    '<div class="v-ked card"><div class="row sp" style="margin-bottom:4px"><button class="btn sm ' + (UI.twFull ? 'on' : '') + '" data-act="tw-full">' + (UI.twFull ? 'Full' : 'Compact') + '</button><button class="btn sm ' + (UI.tw === 'int' ? 'on' : '') + '" data-act="tw2" data-v="' + (UI.tw === 'int' ? 'gap' : 'int') + '">' + (UI.tw === 'int' ? 'Interval' : 'Gap') + '</button></div><div id="towerb"></div></div>' +
    '<div class="v-radio"><div id="radiob"></div></div>' +
    '</div><div class="lastr5" id="lastr"></div><div class="dock" id="cockpit"></div></div><div id="rxpit"></div>';
  setTimeout(function () { if (RUN && UI.wk && UI.wk.R === RUN.R) { setupMap(RUN.R); drawCars(RUN.R, 1); paintPanels(true); } }, 0);
  return h;
};
vRace = function () {
  var R = UI.wk.R;
  UI.phone = isPhone(); RUN && (RUN.sig = '');
  if (UI.phone) return vRacePhone(R);
  var h = '<div class="top"><div class="brand">Grid to <b>Glory</b></div><div class="meta"><span>' + esc(R.c.name) + '</span><button class="btn sm" data-act="wk-quit">Exit</button></div></div>';
  h += '<div class="race5 rx"><div class="rx-left"><div class="rhead rx-strip" id="strip"></div><div class="card rx-mapcard">' + rmMapCard() + '</div>' + trainCard() + '<div class="lastr5" id="lastr"></div></div>' +
    '<div class="rx-right"><div class="rx-cock" id="cockpit"></div><div class="card rx-tower"><div class="row sp" style="margin-bottom:6px"><h3>Standings</h3><div class="row" style="gap:4px"><button class="btn sm ' + (UI.twFull ? 'on' : '') + '" data-act="tw-full">' + (UI.twFull ? 'Full' : 'Compact') + '</button><button class="btn sm ' + (UI.tw === 'int' ? 'on' : '') + '" data-act="tw2" data-v="' + (UI.tw === 'int' ? 'gap' : 'int') + '">' + (UI.tw === 'int' ? 'Interval' : 'Gap') + '</button></div></div><div id="towerb"></div></div>' +
    '<div class="card"><h3 style="margin-bottom:8px">Team radio</h3><div id="radiob" class="radwrap"></div></div></div></div><div id="rxpit"></div>';
  setTimeout(function () { if (RUN && UI.wk && UI.wk.R === RUN.R) { setupMap(RUN.R); drawCars(RUN.R, 1); paintPanels(true); } }, 0);
  return h;
};

/* ---------- wheel screen: rivals' tyres next to the gaps ---------- */
function whTy(f) { var k = f.comp, c = COMP[k] ? COMP[k].col : '#fff'; return '<i class="gpt" style="--tyc:' + c + '" title="' + (TYN[k] || k) + ', ' + Math.floor(f.eff) + ' laps old">' + k + '<u>' + Math.floor(f.eff) + '</u></i>'; }
posHTML = function (R) {
  var p = R.p; if (p.dnf) return '<div class="posl"><div class="bigp">DNF</div></div>';
  var o = trackOrder(R), i = o.indexOf(p), ah = i > 0 ? o[i - 1] : null, bh = o[i + 1] && !o[i + 1].dnf ? o[i + 1] : null, rv = S.rival ? S.rival.di : -1;
  var line = function (f, up) {
    var g = up ? (p.fin && f.fin ? gapTxt(R, p, f) : Math.max(0, (Math.min(f.s, R.L) - p.s) * p.pA).toFixed(1)) : (p.fin && f.fin ? gapTxt(R, f, p) : Math.max(0, (p.s - f.s) * p.pA).toFixed(1));
    return '<span class="gpl' + (f.di === rv ? ' rv' : '') + '">' + (up ? '▲' : '▼') + ' <span class="gpn">' + esc(f.d.code || lastName(f.d)) + '</span> <b>' + g + 's</b>' + whTy(f) + '</span>';
  };
  return '<div class="posl"><div class="bigp">P' + (i + 1) + '</div><div class="gp">' + (ah ? line(ah, true) : '<b class="lead">Leading</b>') + '<br>' + (bh ? line(bh, false) : '<span class="dim">Last place</span>') + '</div></div>';
};
