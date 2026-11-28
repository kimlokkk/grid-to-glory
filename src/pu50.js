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
function puCardHTML() {
  if (!S || !puOn(S) || !UI.wk) return '';
  var d = S.drivers[S.pi], P = puPool(S, d), ci = UI.wk.ci, sug = puPlan(S, d, ci), pick = S.puPick && S.puPick.s === S.season && S.puPick.r === S.round ? S.puPick.i : sug.i, c = circuitFor(S, ci);
  var row = function (i, label, w, note, off) { var on = pick === i; return '<button class="pu-u' + (on ? ' on' : '') + (off ? ' off' : '') + '" data-act="pu-pick" data-v="' + i + '"' + (off ? ' disabled' : '') + '><span><b>' + label + '</b><em>' + note + '</em></span>' + (w != null ? '<i><u style="width:' + clamp(w * 100 / 1.2, 0, 100) + '%" class="' + (w >= 1 ? 'bad' : w >= 0.7 ? 'mid' : '') + '"></u></i><strong>' + Math.round(w * 100) + '%</strong>' : '<strong>NEW</strong>') + '</button>'; };
  var rows = P.units.map(function (u, i) { var loss = puLossAt(u.w + 1 / puLife(myTeam())) * c.pw / 0.55; return row(i, 'Unit ' + (i + 1), u.w, u.f ? 'Failed in round ' + u.f : 'End-of-race cost here about ' + loss.toFixed(2) + ' s a lap', !!u.f); }).join('');
  var nextN = P.units.length + 1, pen = P.units.length >= PU.units;
  rows += row(-1, 'Unit ' + nextN + (pen ? ' (penalty)' : ' (new)'), null, pen ? PU.pen + '-place grid drop after qualifying' : 'Free: ' + (PU.units - P.units.length) + ' of ' + PU.units + ' left', false);
  return '<section class="card pu-card"><header><small>Power unit</small><h3>Choose for this race</h3></header><p class="pu-sug"><b>Engineer:</b> ' + esc(puWhy(S, d, ci, sug)) + '. ' + (c.pw >= 0.55 ? 'Engine-heavy track: wear costs more here.' : c.pw <= 0.4 ? 'Engine-light track: a good place for a worn unit.' : 'Balanced track.') + '</p><div class="pu-list">' + rows + '</div><p class="pu-note">Wear costs race pace only (not qualifying) and raises the failure risk. Reliability ' + Math.round(myTeam().car.rel) + ': a unit lasts about ' + puLife(myTeam()).toFixed(1) + ' races.</p></section>';
}
if (typeof A !== 'undefined') A['pu-pick'] = function (x) { S.puPick = { s: S.season, r: S.round, i: +x.v }; if (typeof save === 'function') save(); render(); };
(function () {
  if (typeof vQuali === 'function') { var q0 = vQuali; vQuali = function () { var h = q0.apply(this, arguments); return h.replace('<div class="qv-side">', '<div class="qv-side">' + puCardHTML()); }; }
  if (typeof vStrat === 'function') { var s0 = vStrat; vStrat = function () { var h = s0.apply(this, arguments), R = UI.wk && UI.wk.R, P = R && R.puPens || []; if (!P.length) return h; var box = '<section class="card pu-pens"><small>Stewards</small><h3>Grid penalties</h3>' + P.map(function (p) { return '<p><b>' + esc(p.n) + '</b> drops ' + p.places + ' places (power unit ' + p.unit + ')</p>'; }).join('') + '</section>'; var k = h.indexOf('<div class="stack">'); return k >= 0 ? h.slice(0, k + 19) + box + h.slice(k + 19) : box + h; }; }
})();
