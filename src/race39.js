'use strict';
/* ===== Race weekend v3, phase 3: Race ("Lights to flag"). Presentation only: the sim, loop timing, actions and panel ids are unchanged.
   Kept ids: strip, cockpit, towerb, radiob, lastr, posb, planb, dtrk/tc*, btchip. New: rmap (circuit with car sprites). ===== */
var RM = { R: null, cars: {}, labs: {}, T: null };

/* ---------- circuit map with real car sprites ---------- */
function rmBuild(R) {
  var svg = document.getElementById('rmap'); if (!svg) { RM.R = null; return; }
  var T = buildTrack(R.ci), st = posAt(T, 0), m0 = T.marks[2], zl = '';
  (R.zones || []).forEach(function (z) {
    var a = posAt(T, z.at), b = posAt(T, (z.at + 0.004) % 1), dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l;
    zl += '<g class="rm-zone"><circle cx="' + a[0].toFixed(1) + '" cy="' + a[1].toFixed(1) + '" r="3.2"/><text x="' + (a[0] + nx * 15).toFixed(1) + '" y="' + (a[1] + ny * 15 + 2.5).toFixed(1) + '">' + esc(z.n) + '</text></g>';
  });
  var cars = '', labs = '';
  R.cars.forEach(function (f) {
    var me = f.isP, w = me ? 27 : 21, h = w * CAR2.h / CAR2.w;
    cars += '<g class="rm-car' + (me ? ' me' : '') + (S.rival && f.di === S.rival.di ? ' rv' : '') + '" id="mc' + f.di + '">' + (me ? '<circle class="rm-halo" r="11"/>' : '') + '<g transform="translate(' + (-w / 2).toFixed(1) + ' ' + (-h / 2).toFixed(1) + ')">' + carSVG(f.t, w) + '</g></g>';
    labs += '<g class="rm-lab' + (me ? ' me' : '') + (S.rival && f.di === S.rival.di ? ' rv' : '') + '" id="ml' + f.di + '" style="display:none"><rect x="-11" y="-6" width="22" height="11" rx="3"/><text y="2.6">' + esc(f.d.code) + '</text></g>';
  });
  svg.innerHTML = '<path class="rm-run" d="' + T.d + '"/><path class="rm-kerb" d="' + T.d + '"/><path class="rm-kerb2" d="' + T.d + '"/><path class="rm-road" d="' + T.d + '"/><path class="rm-mid" d="' + T.d + '"/>' +
    '<g class="rm-start" transform="translate(' + st[0].toFixed(1) + ' ' + st[1].toFixed(1) + ') rotate(' + (Math.atan2(m0.ny, m0.nx) * 180 / Math.PI).toFixed(1) + ')"><rect x="-8" y="-1.6" width="16" height="3.2"/><rect class="w" x="-8" y="-1.6" width="2" height="1.6"/><rect class="w" x="-4" y="-1.6" width="2" height="1.6"/><rect class="w" x="0" y="-1.6" width="2" height="1.6"/><rect class="w" x="4" y="-1.6" width="2" height="1.6"/><rect class="w" x="-6" y="0" width="2" height="1.6"/><rect class="w" x="-2" y="0" width="2" height="1.6"/><rect class="w" x="2" y="0" width="2" height="1.6"/><rect class="w" x="6" y="0" width="2" height="1.6"/></g>' +
    zl + '<g id="rm-cars">' + cars + '</g><g>' + labs + '</g>';
  RM.R = R; RM.T = T; RM.cars = {}; RM.labs = {}; RM.svg = svg; RM.prog = document.getElementById('rmprog'); RM.pr = null; RM.hot = null;
  R.cars.forEach(function (f) { RM.cars[f.di] = document.getElementById('mc' + f.di); RM.labs[f.di] = document.getElementById('ml' + f.di); });
  var me = RM.cars[R.p.di]; if (me) me.parentNode.appendChild(me);   /* player drawn on top */
}
function rmDraw(R, al) {
  if (RM.R !== R) { if (document.getElementById('rmap')) rmBuild(R); if (RM.R !== R) return; }
  var T = RM.T, p = R.p, ord = RUN && RUN.ord ? RUN.ord : trackOrder(R), pi = ord.indexOf(p), nb = {};
  if (pi > 0) nb[ord[pi - 1].di] = 1; if (ord[pi + 1] && !ord[pi + 1].dnf) nb[ord[pi + 1].di] = 1;
  var hot = !!(RUN && RUN.hot && !R.sc); if (RM.hot !== hot) { RM.hot = hot; RM.svg.classList.toggle('hot', hot); }
  if (RM.prog) { var pr = clamp((p.fin ? R.L : sAt(R, p, al)) / R.L * 100, 0, 100).toFixed(1); if (RM.pr !== pr) { RM.pr = pr; RM.prog.style.width = pr + '%'; } }
  R.cars.forEach(function (f) {
    var g = RM.cars[f.di], lb = RM.labs[f.di]; if (!g) return;
    if (f.dnf || (f.fin && !f.isP)) { if (g.style.display !== 'none') { g.style.display = 'none'; lb.style.display = 'none'; } return; }
    var s = sAt(R, f, al), fr = s - Math.floor(s), a = posAt(T, fr), b = posAt(T, (fr + 0.006) % 1), ang = Math.atan2(b[1] - a[1], b[0] - a[0]) * 180 / Math.PI;
    if (g.style.display === 'none') g.style.display = '';
    g.setAttribute('transform', 'translate(' + a[0].toFixed(1) + ' ' + a[1].toFixed(1) + ') rotate(' + ang.toFixed(0) + ')');
    var pit = f.hold > 0 && !f.fin; if (g._pit !== pit) { g._pit = pit; g.classList.toggle('pit', pit); }
    var show = f.isP || nb[f.di] || (S.rival && f.di === S.rival.di);
    if (show) { lb.style.display = ''; lb.setAttribute('transform', 'translate(' + a[0].toFixed(1) + ' ' + (a[1] - (f.isP ? 15 : 12)).toFixed(1) + ')'); }
    else if (lb.style.display !== 'none') lb.style.display = 'none';
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
function wheelHTML(R) {
  var p = R.p, o = trackOrder(R), i = o.indexOf(p), ah = i > 0 ? o[i - 1] : null, hp = tyreHealth(p, R), spare = fuelMargin(R, p), heat = tyreHeat(p);
  var gap = ah ? Math.max(0, (Math.min(ah.s, R.L) - p.s) * (p.pA || R.c.base)) : 99, lit = R.sc ? 15 : clamp(Math.round((2.5 - gap) / 2.5 * 15), 0, 15), mode = p.atk > 0 ? ' boost' : R.sc ? ' sc' : '';
  var leds = ''; for (var k = 0; k < 15; k++) leds += '<i class="' + (k < 5 ? 'g' : k < 10 ? 'r' : 'b') + (k < lit ? ' on' : '') + '"></i>';
  var tc = COMP[p.comp] ? COMP[p.comp].col : '#fff', man = function (key) { return !!(p.bot && p.bot[key] != null); };
  /* position change pop: green when you gain a place, red when you lose one */
  var pos = i + 1, now = performance.now();
  if (RM.posR !== R) { RM.posR = R; RM.pos = pos; RM.posT = -1e9; }
  if (pos !== RM.pos) { RM.posD = pos < RM.pos ? 1 : -1; RM.posN = Math.abs(pos - RM.pos); RM.posT = now; RM.pos = pos; if (RM.posD > 0 && RUN && !RUN.fast && R.lap > 1) { try { snd('good'); } catch (e) { } } }
  var pop = now - RM.posT < 1800 && R.lap > 1 ? (RM.posD > 0 ? ' up' : ' dn') : '';
  return '<div class="wh' + mode + '" role="group" aria-label="Steering wheel display"><svg class="wh-body" viewBox="0 0 360 170" aria-hidden="true">' +
    '<defs><pattern id="whcf" width="6" height="6" patternUnits="userSpaceOnUse"><rect width="6" height="6" fill="#20242f"/><rect width="3" height="3" fill="#2a2f3d"/><rect x="3" y="3" width="3" height="3" fill="#2a2f3d"/></pattern></defs>' +
    '<path class="wh-paddle" d="M40 54 L18 62 L14 118 L40 126Z"/><path class="wh-paddle" d="M320 54 L342 62 L346 118 L320 126Z"/>' +
    '<path class="wh-grip" d="M8 58 Q4 36 24 30 L52 26 L52 150 L28 158 Q8 160 6 138Z"/><path class="wh-grip" d="M352 58 Q356 36 336 30 L308 26 L308 150 L332 158 Q352 160 354 138Z"/>' +
    '<path class="wh-rib" d="M14 70H44M13 84H44M13 98H44M13 112H44M14 126H44M316 70H346M316 84H347M316 98H347M316 112H347M316 126H346"/>' +
    '<path class="wh-plate" d="M44 22 Q44 8 62 8 L298 8 Q316 8 316 22 L316 120 Q316 150 286 154 L248 158 Q236 136 180 136 Q124 136 112 158 L74 154 Q44 150 44 120Z"/>' +
    '<rect class="wh-ledbar" x="62" y="9" width="236" height="15" rx="7.5"/>' +
    '<g class="wh-btn"><rect x="56" y="36" width="15" height="9" rx="3" fill="#ffd24a"/><text x="63.5" y="42.6">DRS</text><rect x="289" y="36" width="15" height="9" rx="3" fill="#5aa9ff"/><text x="296.5" y="42.6">RAD</text>' +
    '</g>' +
    whDial(74, 126, 'TYRE', man('push'), raceMode(p, 'push')) + whDial(286, 126, 'ERS', man('energyMode'), raceMode(p, 'energyMode')) + '</svg>' +
    '<div class="wh-leds" aria-hidden="true">' + leds + '</div>' +
    '<div class="wh-mid">' + whRing(hp, hp > 0.5 ? '#39d98a' : hp > 0.2 ? '#ffd24a' : '#ff5a4f', Math.round(hp * 100) + '%', 'Tyre ' + p.comp + (heat > 0.78 ? ' · hot' : heat < 0.35 ? ' · cold' : '')) +
    '<div class="wh-screen' + pop + '">' + (pop ? '<em class="wh-pop">' + (RM.posD > 0 ? '▲ +' : '▼ −') + RM.posN + '</em>' : '') + (UI.phone ? '<div class="rpos" id="posb"></div>' : posHTML(R)) + '<div class="wh-lap">L' + Math.max(1, Math.min(R.lap, R.L)) + '/' + R.L + ' <i style="background:' + tc + '"></i>' + Math.floor(p.eff) + 'L</div></div>' +
    whRing(p.en, '#a78bfa', Math.round(p.en * 100) + '%', 'Energy') + '</div>' +
    '<div class="wh-foot"><span class="' + (spare < 0 ? 'bad' : spare < 0.3 ? 'mid' : '') + '">FUEL ' + (spare < 0 ? '' : '+') + spare.toFixed(1) + 'L</span><span>' + (p.atk > 0 ? 'BOOST' : R.sc ? (R.sc === 'SC' ? 'SAFETY CAR' : 'VSC') : gap < 1 ? 'ATTACK' : 'RACE') + '</span></div></div>';
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
  h += '<div class="race-summary">' + [['push', 'Tyres', Math.round(hp * 100) + '%', PUSHN], ['fuelMode', 'Fuel', (spare < 0 ? '' : '+') + spare.toFixed(1) + 'L', PUSHN], ['energyMode', 'Energy', Math.round(p.en * 100) + '%', ['Harvest', 'Balanced', 'Deploy']]].map(function (x) {
    var manual = p.bot && p.bot[x[0]] != null;
    return '<button data-act="r-control" data-k="' + x[0] + '" aria-label="Adjust ' + x[1] + ' control"><b>' + x[1] + ' ' + x[2] + '</b><span>' + (manual ? 'Manual' : 'Auto') + ' · ' + x[3][raceMode(p, x[0])] + '</span>' + (x[0] === 'push' ? '<small>' + (tyreHeat(p) < 0.35 ? 'Cold' : tyreHeat(p) > 0.78 ? 'Hot' : 'Optimal') + '</small>' : '<small>Tap to adjust</small>') + '</button>';
  }).join('') + '</div><div class="race-controls">' + raceControlsHTML(R, 'r') + '</div>';
  var advice = raceAdvice(R, p); if (advice) h += '<p class="control-advice"><b>ENG</b> ' + esc(advice) + '</p>';
  var noB = !canBoost(R, p);
  if (p.pitReq && p.pitOk) h += '<div class="pitnote"><span>Boxing this lap: ' + tyc(p.pitReq) + ' ' + TYN[p.pitReq] + '</span><button class="btn sm" data-act="r-pitx">Cancel</button></div>';
  h += '<div class="acts"><button class="btn boost' + (p.atk > 0 ? ' on' : '') + '" data-act="r-atk"' + (noB ? ' disabled' : '') + '><span aria-hidden="true">⚡</span> ' + (p.atk > 0 ? 'Boost!' : 'Boost') + '</button><button class="btn pitb' + (UI.pitOpen ? ' on' : '') + '" data-act="r-pitm"><span aria-hidden="true">🔧</span> ' + (UI.pitOpen ? 'Close' : 'Pit') + '</button></div>';
  if (UI.pitOpen && !(p.pitReq && p.pitOk)) h += '<div class="tyrow">' + ['S', 'M', 'H', 'I', 'W'].map(function (k) { return '<button class="btn" data-act="r-pit" data-v="' + k + '">' + sgTyre(k, 26) + '<span>' + TYN[k] + '</span></button>'; }).join('') + '</div>';
  if (!UI.phone) h += '<p class="rplan">Plan: ' + planText(R, p) + '</p>';
  h += '<div class="ctlrow">' + (RUN.pause ? '<button class="btn pri" data-act="r-go">' + (R.t > 0 ? '▶ Resume' : '▶ Start') + '</button>' : '<button class="btn" data-act="r-pause">❚❚ Pause</button>') +
    (UI.phone ? '<button class="btn sm" data-act="r-playback" aria-label="Choose race playback speed">Playback · ' + (RUN.highlights ? 'Highlights' : RUN.fast ? 'Fast' : RUN.spd + '×') + '</button>' :
      [1, 2, 4].map(function (v) { return '<button class="btn sm ' + (RUN.spd === v && !RUN.fast ? 'on' : '') + '" data-act="r-spd" data-v="' + v + '">' + v + '×</button>'; }).join('') +
      '<button class="btn sm ' + (RUN.fast && !RUN.highlights ? 'on' : '') + '" data-act="r-fast" aria-label="Fast race playback">Fast</button><button class="btn sm ' + (RUN.highlights ? 'on' : '') + '" data-act="r-highlights" aria-pressed="' + !!RUN.highlights + '">Highlights</button>') + '</div>';
  return h;
};

/* ---------- layout ---------- */
function rmMapCard() { return '<div class="rmapc"><i class="rm-prog" aria-hidden="true"><u id="rmprog"></u></i><svg id="rmap" class="rmap" viewBox="0 0 400 240" role="img" aria-label="Circuit map with every car"></svg></div>'; }
vRacePhone = function (R) {
  var t = UI.rtab === 'ked' || UI.rtab === 'radio' ? UI.rtab : 'trek';
  var h = '<div class="rfull rx tab-' + t + '"><div class="rtop5"><div class="rhead" id="strip"></div><button class="btn sm" data-act="wk-quit">Exit</button></div>' +
    '<div class="rtabs">' + [['trek', 'Track'], ['ked', 'Timing'], ['radio', 'Radio']].map(function (x) { return '<button class="' + (t === x[0] ? 'on' : '') + '" data-act="rtab" data-v="' + x[0] + '">' + x[1] + '</button>'; }).join('') + '</div>' +
    '<div class="rview">' +
    '<div class="v-trek">' + rmMapCard() + trainCard() + '<p class="dim plan5" id="planb"></p></div>' +
    '<div class="v-ked card"><div class="row sp" style="margin-bottom:4px"><button class="btn sm ' + (UI.twFull ? 'on' : '') + '" data-act="tw-full">' + (UI.twFull ? 'Full' : 'Compact') + '</button><button class="btn sm ' + (UI.tw === 'int' ? 'on' : '') + '" data-act="tw2" data-v="' + (UI.tw === 'int' ? 'gap' : 'int') + '">' + (UI.tw === 'int' ? 'Interval' : 'Gap') + '</button></div><div id="towerb"></div></div>' +
    '<div class="v-radio"><div id="radiob"></div></div>' +
    '</div><div class="lastr5" id="lastr"></div><div class="dock" id="cockpit"></div></div>';
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
    '<div class="card"><h3 style="margin-bottom:8px">Team radio</h3><div id="radiob" class="radwrap"></div></div></div></div>';
  setTimeout(function () { if (RUN && UI.wk && UI.wk.R === RUN.R) { setupMap(RUN.R); drawCars(RUN.R, 1); paintPanels(true); } }, 0);
  return h;
};
