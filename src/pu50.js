'use strict';
/* ===== Power units (design C2, C3, C9): 4 units per driver and season, a pool the driver chooses from before each race =====
   Life from reliability; wear costs race pace (never qualifying) and raises the failure chance (mean-neutral over a unit's life);
   a 5th or later unit is a 10-place grid drop, at most 15 places per driver per race. F1 Pro careers only, gated by S.pu. */
var PU = {
  v: 1, units: 4, life: 5.5, lifeMin: 4.4, lifeMax: 6.6, pen: 10, penCap: 15,
  loss: { start: 0.4, at1: 0.3, exp: 1.8 },          /* seconds a lap at wear w: 0.3 * ((w - 0.4) / 0.6) ^ 1.8, about 0.04 at 60%, 0.14 at 80%, 0.3 at 100% */
  fail: 4,                                           /* failure multiplier (1 + 4 w^2) / (1 + 4/3): 0.43 fresh, 0.86 mid-life, 2.14 at the end of life */
  dnfShare: 0.5, stretch: 1.15, maxW: 1.4
};
function puOn(S, year) { return !!(S && S.mode === 'pro' && S.pu && S.pu.v >= 1 && (year == null ? S.season : year) >= S.pu.from && S.teams && S.teams[0] && !S.teams[0].spec && (typeof leagueOf !== 'function' || leagueOf(S) === 'f1')); }
function puMigrate(S) { if (!S || S.mode !== 'pro' || S.pu || !S.teams || !S.drivers) return; S.pu = { v: PU.v, from: (S.round || 0) === 0 ? S.season : S.season + 1, d: {} }; }
function puKey(d) { return d.uid || d.name; }
function puLife(t) { var r = t && t.car ? t.car.rel : 75; return clamp(PU.life * (1 + (r - 75) / 100), PU.lifeMin, PU.lifeMax); }
/* this season's pool for a driver */
function puPool(S, d) {
  var k = puKey(d), P = S.pu.d[k];
  if (!P || P.s !== S.season) P = S.pu.d[k] = { s: S.season, units: [], pens: 0 };
  return P;
}
function puLossAt(w) { var x = (w - PU.loss.start) / (1 - PU.loss.start); return x <= 0 ? 0 : PU.loss.at1 * Math.pow(x, PU.loss.exp); }
function puFailAt(w) { return (1 + PU.fail * w * w) / (1 + PU.fail / 3); }
/* which unit to run: least worn at engine-heavy tracks, most worn (still healthy) at engine-light tracks; a new unit when none is fit.
   No random numbers: a small fixed offset per team keeps teams from all doing the same. */
function puPlan(S, d, ci) {
  var P = puPool(S, d), c = circuitFor(S, ci), pw = c ? c.pw : 0.5, ok = P.units.map(function (u, i) { return { u: u, i: i }; }).filter(function (x) { return !x.u.f; });
  var lean = typeof hashS === 'function' ? (hashS('pu|' + (d.team || 0)) - 0.5) * 0.1 : 0, fit = ok.filter(function (x) { return x.u.w < 1 - lean; });
  var free = P.units.length < PU.units;
  if (!fit.length) { if (free || !ok.filter(function (x) { return x.u.w < PU.stretch; }).length) return { i: -1 }; fit = ok.filter(function (x) { return x.u.w < PU.stretch; }); }
  if (free && pw >= 0.55 && fit.every(function (x) { return x.u.w > 0.45; })) return { i: -1 };   /* a power track and only used units: fit a fresh one while it is free */
  fit.sort(function (a, b) { return a.u.w - b.u.w; });
  var pick = pw >= 0.55 ? fit[0] : pw <= 0.4 ? fit[fit.length - 1] : fit[Math.floor((fit.length - 1) / 2)];
  return { i: pick.i };
}
function puWhy(S, d, ci, plan) {
  var P = puPool(S, d), c = circuitFor(S, ci), heavy = c.pw >= 0.55 ? 'engine-heavy' : c.pw <= 0.4 ? 'engine-light' : 'balanced';
  if (plan.i < 0) return P.units.length < PU.units ? 'Fit unit ' + (P.units.length + 1) + ' (no penalty, ' + (PU.units - P.units.length) + ' of ' + PU.units + ' still free)' : 'New unit ' + (P.units.length + 1) + ': ' + PU.pen + '-place grid penalty';
  var u = P.units[plan.i]; return 'Use unit ' + (plan.i + 1) + ' (' + Math.round(u.w * 100) + '% worn): ' + c.name + ' is ' + heavy;
}
/* before the race: choose units, fit new ones, apply grid penalties; returns the grid after penalties */
function puBefore(S, ci, gridIds, o) {
  if (!puOn(S)) return gridIds;
  var run = { s: S.season, r: S.round, ci: ci, cars: {}, pens: [] }, drops = {};
  gridIds.forEach(function (di) {
    var d = S.drivers[di]; if (!d) return;
    var P = puPool(S, d), pick = di === S.pi && S.puPick && S.puPick.s === S.season && S.puPick.r === S.round ? { i: S.puPick.i } : puPlan(S, d, ci);
    if (pick.i >= 0 && (!P.units[pick.i] || P.units[pick.i].f)) pick = puPlan(S, d, ci);
    var fresh = pick.i < 0, idx = fresh ? P.units.length : pick.i, pen = fresh && P.units.length >= PU.units;
    run.cars[di] = { k: puKey(d), i: idx, fresh: fresh, pen: pen, w0: fresh ? 0 : P.units[idx].w };
    if (pen) { drops[di] = Math.min(PU.penCap, PU.pen); run.pens.push({ di: di, n: d.name, places: drops[di], unit: idx + 1 }); }
  });
  S.puRun = run;
  if (!run.pens.length) return gridIds;
  /* each penalised car drops its places; the others keep their order */
  var slot = gridIds.map(function (di, i) { return { di: di, v: i + (drops[di] || 0) + (drops[di] ? 0.5 : 0) }; });
  slot.sort(function (a, b) { return a.v - b.v; });
  return slot.map(function (x) { return x.di; });
}
/* attach the unit to each car so the engine can read its wear */
function puAttach(S, R) {
  var run = S.puRun; if (!run || run.s !== S.season || run.r !== S.round || !puOn(S)) return;
  R.puPens = run.pens.slice();
  R.cars.forEach(function (f) { var x = run.cars[f.di]; if (!x) return; f.pu = { w0: x.w0, inc: 1 / puLife(f.t), i: x.i, fresh: x.fresh, pen: x.pen }; });
}
function puW(R, f) { var p = f.pu; return Math.min(PU.maxW, p.w0 + p.inc * clamp((f.lap - 1) / Math.max(1, R.L), 0, 1)); }
/* race pace cost in seconds a lap, scaled by how much the track depends on the engine */
function puLoss(R, f) { return f.pu ? puLossAt(puW(R, f)) * (R.c.pw / 0.55) : 0; }
function puFail(R, f) { return f.pu ? puFailAt(puW(R, f)) : 1; }
/* after the race: add the wear, mark failures; idempotent per round */
function puCommit(S, R) {
  var run = S.puRun; if (!run || run.s !== S.season || run.r !== S.round || run.done || !puOn(S)) return;
  run.done = true;
  (R.cls || []).forEach(function (x) {
    var car = x.car || x, d = car.d, di = car.di, slot = run.cars[di]; if (!d || !slot) return;
    var P = puPool(S, d), life = puLife(S.teams[d.team]), dnf = car.dnf || x.dnf;
    if (slot.fresh && !P.units[slot.i]) { P.units[slot.i] = { w: 0, races: 0, f: 0, from: S.round + 1 }; if (slot.pen) P.pens++; }
    var u = P.units[slot.i]; if (!u) return;
    u.w = Math.min(PU.maxW, u.w + (dnf ? PU.dnfShare : 1) / life); u.races++;
    if (dnf === 'Mechanical failure') { u.f = S.round + 1; }
  });
  S.puLast = { s: run.s, r: run.r, pens: run.pens };
  puLogAdd(S, run);
}

/* ---------- log, news, screens ---------- */
function puLogAdd(S, run) {
  S.pu.log = (S.pu.log || []).filter(function (x) { return !(x.s === run.s && x.r === run.r); });
  var me = run.cars[S.pi];
  S.pu.log.push({ s: run.s, r: run.r, pens: run.pens.map(function (p) { return { n: p.n, places: p.places, unit: p.unit }; }), me: me ? { unit: me.i + 1, w0: Math.round(me.w0 * 100), fresh: me.fresh ? 1 : 0, pen: me.pen ? 1 : 0 } : null });
  if (S.pu.log.length > 30) S.pu.log = S.pu.log.slice(-30);
  run.pens.forEach(function (p) { if (typeof pushNews === 'function') pushNews(S, { k: 'garage', kick: 'GRID PENALTY', t: S.drivers[p.di] ? S.drivers[p.di].team : 0, s: S.season, r: S.round + 1, head: p.n + ' takes a ' + p.places + '-place grid penalty', sub: 'Power unit ' + p.unit + ' of the season: anything beyond ' + PU.units + ' costs grid places.' }); });
}
function puPoolText(S, d) {
  var P = puPool(S, d); if (!P.units.length) return 'no unit fitted yet (' + PU.units + ' free this season)';
  return P.units.map(function (u, i) { return 'unit ' + (i + 1) + ' ' + Math.round(u.w * 100) + '% worn' + (u.f ? ' (failed in round ' + u.f + ')' : ''); }).join(', ') + ' · ' + Math.max(0, PU.units - P.units.length) + ' free unit' + (PU.units - P.units.length === 1 ? '' : 's') + ' left' + (P.pens ? ' · ' + P.pens + ' penalty unit' + (P.pens === 1 ? '' : 's') : '');
}
function puGauge(w, col) {
  var h = clamp(1 - w, 0, 1), r = 25, C = 2 * Math.PI * r, tone = w >= 1 ? '#ff5a4f' : w >= 0.7 ? '#ffb020' : '#33d6a6';
  return '<svg class="pu-g" viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="' + r + '" fill="none" stroke="#ffffff1a" stroke-width="7"/><circle cx="32" cy="32" r="' + r + '" fill="none" stroke="' + tone + '" stroke-width="7" stroke-linecap="round" stroke-dasharray="' + (C * h).toFixed(1) + ' ' + C.toFixed(1) + '" transform="rotate(-90 32 32)"/><text x="32" y="30" text-anchor="middle" font-size="15" font-weight="700" fill="#fff">' + Math.round(h * 100) + '</text><text x="32" y="43" text-anchor="middle" font-size="7" fill="#c4cce0" letter-spacing="1">HEALTH</text></svg>';
}
function puCardHTML() {
  if (!S || !puOn(S) || !UI.wk) return '';
  var d = S.drivers[S.pi], P = puPool(S, d), ci = UI.wk.ci, sug = puPlan(S, d, ci), pick = S.puPick && S.puPick.s === S.season && S.puPick.r === S.round ? S.puPick.i : sug.i, c = circuitFor(S, ci), t = myTeam();
  var kind = c.pw >= 0.55 ? ['ENGINE-HEAVY', 'hot'] : c.pw <= 0.4 ? ['ENGINE-LIGHT', 'cool'] : ['BALANCED', 'mid'];
  var tiles = P.units.map(function (u, i) {
    var loss = puLossAt(Math.min(PU.maxW, u.w + 1 / puLife(t))) * c.pw / 0.55, on = pick === i, tag = u.f ? '<em class="pu-tag dead">FAILED</em>' : i === sug.i ? '<em class="pu-tag sug">ENGINEER PICK</em>' : u.w >= 1 ? '<em class="pu-tag warn">WORN OUT</em>' : '';
    return '<button class="pu-tile' + (on ? ' on' : '') + (u.f ? ' dead' : '') + '" data-act="pu-pick" data-v="' + i + '"' + (u.f ? ' disabled' : '') + ' aria-pressed="' + on + '"><span class="pu-tn">PU ' + (i + 1) + '</span>' + tag + puGauge(u.w) +
      '<span class="pu-ts">' + (u.f ? 'Out for the season' : '<b>' + (loss < 0.005 ? '±0.00' : '−' + loss.toFixed(2)) + 's</b> a lap by the flag') + '</span><span class="pu-tr">' + u.races + (u.races === 1 ? ' race' : ' races') + '</span></button>';
  }).join('');
  var pen = P.units.length >= PU.units, onNew = pick === -1;
  tiles += '<button class="pu-tile new' + (onNew ? ' on' : '') + (pen ? ' pen' : '') + '" data-act="pu-pick" data-v="-1" aria-pressed="' + onNew + '"><span class="pu-tn">PU ' + (P.units.length + 1) + '</span>' + (sug.i === -1 ? '<em class="pu-tag sug">ENGINEER PICK</em>' : '') + '<span class="pu-plus">+</span><span class="pu-ts">' + (pen ? '<b class="bad">−' + PU.pen + ' GRID</b> penalty' : '<b>FREE</b> · ' + (PU.units - P.units.length) + ' of ' + PU.units + ' left') + '</span><span class="pu-tr">fresh unit</span></button>';
  var dots = ''; for (var k = 0; k < PU.units; k++) dots += '<i class="' + (k < P.units.length ? (P.units[k].f ? 'dead' : 'used') : '') + '"></i>';
  return '<section class="pu-bay" style="--tc:' + t.color + '"><header><div><small>Power unit bay</small><h3>Pick your engine</h3></div><div class="pu-alloc" title="Season allocation"><span>' + dots + '</span><small>' + P.units.length + '/' + PU.units + ' USED</small></div></header>' +
    '<div class="pu-track ' + kind[1] + '"><b>' + kind[0] + '</b><span>' + esc(c.name) + ' · wear costs ' + (c.pw >= 0.55 ? 'more' : c.pw <= 0.4 ? 'less' : 'the usual') + ' here</span></div>' +
    '<p class="pu-radio"><b>RADIO</b>' + esc(puWhy(S, d, ci, sug)) + '.</p><div class="pu-grid">' + tiles + '</div>' +
    '<p class="pu-foot">Race pace only, never qualifying · reliability ' + Math.round(t.car.rel) + ' → about ' + puLife(t).toFixed(1) + ' races a unit</p></section>';
}
if (typeof A !== 'undefined') A['pu-pick'] = function (x) { S.puPick = { s: S.season, r: S.round, i: +x.v }; if (typeof save === 'function') save(); render(); };
(function () {
  if (typeof vQuali === 'function') { var q0 = vQuali; vQuali = function () { var h = q0.apply(this, arguments); return h.replace('<div class="qv-side">', '<div class="qv-side">' + puCardHTML()); }; }
  if (typeof vStrat === 'function') { var s0 = vStrat; vStrat = function () { var h = s0.apply(this, arguments), R = UI.wk && UI.wk.R, P = R && R.puPens || []; if (!P.length) return h; var box = '<section class="pu-pens"><small>Stewards · grid penalties</small>' + P.map(function (p) { return '<p><b>' + esc(p.n) + '</b><em>−' + p.places + ' places</em><span>power unit ' + p.unit + '</span></p>'; }).join('') + '</section>'; var k = h.indexOf('<div class="qv-main">'); return k >= 0 ? h.slice(0, k + 21) + box + h.slice(k + 21) : h.replace('<div class="stack">', '<div class="stack">' + box); }; }
})();

/* ---------- team view: both drivers' units (Team tab and the team dossier) ---------- */
function puMiniGauge(u) {
  var w = u.w, h = clamp(1 - w, 0, 1), r = 13, C = 2 * Math.PI * r, tone = u.f ? '#ff5a4f' : w >= 1 ? '#ff5a4f' : w >= 0.7 ? '#ffb020' : '#33d6a6';
  return '<svg class="pu-mg" viewBox="0 0 34 34" aria-label="' + (u.f ? 'Failed' : Math.round(w * 100) + '% worn') + '"><circle cx="17" cy="17" r="' + r + '" fill="none" stroke="#ffffff1a" stroke-width="4"/>' + (u.f ? '<path d="M11 11 L23 23 M23 11 L11 23" stroke="#ff5a4f" stroke-width="3" stroke-linecap="round"/>' : '<circle cx="17" cy="17" r="' + r + '" fill="none" stroke="' + tone + '" stroke-width="4" stroke-linecap="round" stroke-dasharray="' + (C * h).toFixed(1) + ' ' + C.toFixed(1) + '" transform="rotate(-90 17 17)"/><text x="17" y="21" text-anchor="middle" font-size="10" font-weight="700" fill="#fff">' + Math.round(h * 100) + '</text>') + '</svg>';
}
function puTeamHTML(t) {
  if (!S || !puOn(S) || !t || t.spec) return '';
  var ds = S.drivers.filter(function (d) { return d.team === t.id; });
  var rows = ds.map(function (d) {
    var P = puPool(S, d), dots = ''; for (var k = 0; k < PU.units; k++) dots += '<i class="' + (k < P.units.length ? (P.units[k].f ? 'dead' : 'used') : '') + '"></i>';
    var units = P.units.length ? P.units.map(function (u, i) { return '<span class="pu-mu"><small>PU' + (i + 1) + '</small>' + puMiniGauge(u) + '</span>'; }).join('') : '<em class="pu-none">No unit fitted yet</em>';
    return '<div class="pu-drow"><div class="pu-dn"><b>' + esc(d.name) + (d === S.drivers[S.pi] ? ' <i>YOU</i>' : '') + '</b><span class="pu-alloc"><span>' + dots + '</span></span><small>' + P.units.length + '/' + PU.units + ' used' + (P.pens ? ' · <b class="bad">' + P.pens + ' penalt' + (P.pens === 1 ? 'y' : 'ies') + '</b>' : '') + '</small></div><div class="pu-mus">' + units + '</div></div>';
  }).join('');
  return '<section class="pu-bay pu-team" style="--tc:' + t.color + '"><header><div><small>Power units · season ' + S.season + '</small><h3>Engine health</h3></div><div class="pu-life"><b>' + puLife(t).toFixed(1) + '</b><small>RACES A UNIT</small></div></header>' + rows +
    '<p class="pu-foot">Reliability ' + Math.round(t.car.rel) + ' sets how long a unit lasts · beyond ' + PU.units + ' units: −' + PU.pen + ' grid</p></section>';
}
(function () {
  if (typeof hTeam === 'function') { var t0 = hTeam; hTeam = function () { var h = t0.apply(this, arguments), t = typeof myTeam === 'function' ? myTeam() : null, box = puTeamHTML(t); if (!box) return h; var k = h.indexOf('<div class="team-development tg-col">'); return k >= 0 ? h.slice(0, k) + box + h.slice(k) : h; }; }
  if (typeof pdTeamHTML === 'function') { var d0 = pdTeamHTML; pdTeamHTML = function (r) { var h = d0.apply(this, arguments); if (!h || PD42.tab !== 'performance' || r.league !== leagueOf(S)) return h; var t = S.teams[r.index], box = puTeamHTML(t); if (!box) return h; var k = h.lastIndexOf('</div></div>'); return k >= 0 ? h.slice(0, k) + '<div class="pd-span">' + box + '</div>' + h.slice(k) : h + box; }; }
})();
