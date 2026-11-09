/* ===== Penutup musim: radio sebelum race terakhir, radio selepas bendera berkotak, dan skrin Season review. ===== */
function fnlFinal() { return !!(S && !S.sit && S.round === seasonRounds(S) - 1); }
function fnlOrd(n) { return n === 1 ? '1st' : n === 2 ? '2nd' : n === 3 ? '3rd' : n + 'th'; }
function fnlCtx() {
  var p = me(), t = myTeam(), ds = driverStandings(S), ts = teamStandings(S), dp = ds.indexOf(p) + 1, tp = ts.indexOf(t) + 1, tgt = t.dev && t.dev.target ? t.dev.target : null;
  var lead = ds[0], ahead = dp > 1 ? ds[dp - 2] : null;
  return { p: p, t: t, ds: ds, ts: ts, dp: dp, tp: tp, tgt: tgt, lead: lead, gapL: lead.pts - p.pts, gapA: ahead ? ahead.pts - p.pts : 0, ahead: ahead, obj: p.obj };
}
function fnlMet(c) {
  var o = c.obj; if (!o) return null;
  if (o.ty === 'beat') { var m = null; S.drivers.forEach(function (x) { if (x.name === o.mate) m = x; }); return m ? c.ds.indexOf(c.p) < c.ds.indexOf(m) : null; }
  return o.tgt != null ? c.dp <= o.tgt : null;
}
/* radio sebelum lampu merah race terakhir */
function fnlPreText() {
  var c = fnlCtx(), s = 'This is it, the final race of the season. ';
  if (c.dp === 1 && c.ds[1]) {
    var margin = c.p.pts - c.ds[1].pts;
    s += margin > 26 ? 'You have already secured the drivers\' title. Let us finish the season strongly.' : margin === 0 ? 'You are level on points at the top. The final result and countback will decide the title.' : 'You lead the championship by ' + margin + ' points. The title depends on today\'s results; make every point count.';
  }
  else if (c.dp > 1 && c.gapL <= 26) s += 'You are P' + c.dp + ', ' + c.gapL + ' points behind ' + c.lead.name.split(' ').slice(-1)[0] + '. Chase the maximum score; the other results and countback matter too.';
  else if (c.dp <= 3) s += 'You are P' + c.dp + ' in the standings. A strong finish today and the season ends on a high.';
  else if (c.dp <= 10) s += 'You are P' + c.dp + ' in the championship' + (c.ahead && c.gapA <= 12 ? (c.gapA === 0 ? ', level on points with ' : ', only ' + c.gapA + ' points behind ') + c.ahead.name.split(' ').slice(-1)[0] : '') + '. Finish as high as you can.';
  else s += 'Nothing to lose today. A clean race and a good finish are all we want.';
  if (c.tgt) s += ' The team sits P' + c.tp + ' in the constructors' + (c.tp > c.tgt ? ', and the board wanted P' + c.tgt + '.' : '.');
  return s + ' Good luck out there.';
}
function fnlPreHTML() {
  if (!fnlFinal()) return '';
  return radioCard({ t: '“Final race of the season. Make it count.”', sub: esc(fnlPreText()), lap: 0, big: true, live: true });
}
/* radio selepas bendera berkotak di race terakhir */
function fnlPostText(P) {
  var c = fnlCtx(), res = P.dnf ? 'We lost it today, but' : P.pos === 1 ? 'What a way to finish, a win!' : P.pos <= 3 ? 'A podium to end the year,' : P.pos <= 10 ? 'Points in the final race,' : 'Not our day, but', s;
  var met = fnlMet(c), teamOk = c.tgt ? c.tp <= c.tgt : null;
  if (c.dp === 1) return 'That is the title! You are the World Champion. The whole team is going crazy, thank you for every lap this season.' + (c.tp === 1 ? ' And we take the constructors too!' : '');
  s = res + ' we finish the season P' + c.dp + ' in the drivers\' championship with ' + c.p.pts + ' points';
  s += c.tp <= 3 ? ', and the team ends P' + c.tp + ' in the constructors.' : ', and the team ends P' + c.tp + ' in the constructors.';
  if (c.dp <= 3) s += ' A fantastic season. Be proud.';
  else if (met === true && teamOk !== false) s += ' You hit the objective and the team hit its target. Good job.';
  else if (met === true) s += ' You hit your objective, though the team missed its target. Good job.';
  else if (met === false && teamOk === true) s += ' The team hit its target but you fell short of your own. We will work on it over the winter.';
  else if (met === false) s += ' Not the season we wanted. We will regroup over the winter and come back stronger.';
  else s += c.dp <= 10 ? ' Good job this season.' : ' We will regroup over the winter.';
  return s;
}
function fnlPostHTML(P) {
  if (S.sit || S.round < seasonRounds(S)) return '';
  var c = fnlCtx(), good = c.dp <= 3 || fnlMet(c) === true;
  return radioCard({ t: '“' + (c.dp === 1 ? 'You are the champion!' : good ? 'Good job. That is the season.' : 'That is the season. Chin up.') + '”', sub: esc(fnlPostText(P)), lap: 0, big: true, live: true, col: c.dp === 1 ? '#f0b429' : null });
}
/* ---- skrin Season review ---- */
function fnlAwards() {
  var best = function (key) { var b = null; S.drivers.forEach(function (d) { if (d[key] > 0 && (!b || d[key] > b[key])) b = d; }); return b; };
  var out = [], w = best('wins'), po = best('poles'), fl = best('fl');
  if (w) out.push(['Most wins', w.name + ' · ' + w.wins]);
  if (po) out.push(['Most poles', po.name + ' · ' + po.poles]);
  if (fl) out.push(['Most fastest laps', fl.name + ' · ' + fl.fl]);
  var ts = teamStandings(S), g = null, b = null;
  ts.forEach(function (t, i) { var d = teamRank(S, t.id) - (i + 1); if (!g || d > g.d) g = { t: t, d: d }; if (!b || d < b.d) b = { t: t, d: d }; });
  if (g && g.d >= 2) out.push(['Over-achievers', g.t.name + ' · P' + (ts.indexOf(g.t) + 1) + ' from car rank #' + teamRank(S, g.t.id)]);
  if (b && b.d <= -2) out.push(['Under-achievers', b.t.name + ' · P' + (ts.indexOf(b.t) + 1) + ' from car rank #' + teamRank(S, b.t.id)]);
  return out;
}
function vReview() {
  var c = fnlCtx(), p = c.p, t = c.t, res = S.results || [], fin = res.filter(function (r) { return !r.dnf; }), mate = mateOf(S, p);
  var avg = fin.length ? fin.reduce(function (a, r) { return a + r.pos; }, 0) / fin.length : 0, bestR = fin.reduce(function (b, r) { return !b || r.pos < b.pos ? r : b; }, null);
  var gain = res.reduce(function (b, r) { return !r.dnf && (!b || r.grid - r.pos > b.grid - b.pos) ? r : b; }, null);
  var h = '<div class="top"><div class="brand">Grid to <b>Glory</b></div><div class="meta"><span>Season ' + S.season + ' review</span></div></div><div class="stack">';
  h += '<div class="card stack"><h3>Season ' + S.season + ' review</h3><div class="row sp"><div class="lapno" style="font-size:64px">P' + c.dp + '</div><div class="mono dim" style="text-align:right">' + p.pts + ' pts<br>' + p.wins + ' wins · ' + p.pods + ' podiums</div></div>' +
    '<p style="margin:0">' + (c.dp === 1 ? '<b class="pur">World Champion.</b> ' : '') + 'Champion: <b>' + esc(c.lead.name) + '</b> (' + esc(S.teams[c.lead.team].name) + '). Constructors: <b>' + esc(c.ts[0].name) + '</b>.</p></div>';
  h += '<div class="card stack"><h3>Race by race</h3><div class="row" style="flex-wrap:wrap;gap:6px">' + res.map(function (r, i) {
    var cls = r.dnf ? 'bad' : r.pos === 1 ? 'pur' : r.pos <= 3 ? 'good' : r.pos <= 10 ? '' : 'dim';
    return '<span class="mono ' + cls + '" style="min-width:52px;text-align:center;padding:6px 4px;border-radius:8px;background:var(--panel2,#f1ede5)" title="' + esc(CIRCUITS[r.ci].name) + '"><small style="display:block;opacity:.6">R' + (i + 1) + '</small><b>' + (r.dnf ? 'DNF' : 'P' + r.pos) + '</b></span>';
  }).join('') + '</div>' + pfTiles([['Avg finish', avg ? avg.toFixed(1) : '–'], ['Best', bestR ? 'P' + bestR.pos : '–'], ['Poles', p.poles || 0], ['DNFs', p.dnf || 0]]) +
    (gain && gain.grid - gain.pos >= 3 ? '<p class="dim" style="margin:0;font-size:13px">Best recovery: P' + gain.grid + ' to P' + gain.pos + ' at ' + esc(CIRCUITS[gain.ci].name) + '.</p>' : '') + '</div>';
  h += '<div class="card stack"><h3>Your team</h3><p style="margin:0"><b>' + esc(t.name) + '</b> finish P' + c.tp + ' in the constructors with ' + t.pts + ' points' + (c.tgt ? '; the board wanted P' + c.tgt + (c.tp <= c.tgt ? ', target met.' : ', target missed.') : '.') + '</p>' +
    (mate ? '<p class="dim" style="margin:0;font-size:13px">Teammate ' + esc(mate.name) + ': ' + mate.pts + ' points. ' + (p.pts > mate.pts ? 'You beat him by ' + (p.pts - mate.pts) + '.' : p.pts < mate.pts ? 'He beat you by ' + (mate.pts - p.pts) + '.' : 'Dead level.') + '</p>' : '') +
    (c.obj && c.obj.txt ? '<p class="dim" style="margin:0;font-size:13px">Your objective: ' + esc(c.obj.txt) + (fnlMet(c) != null ? ' · ' + (fnlMet(c) ? 'met' : 'missed') : '') + '.</p>' : '') + '</div>';
  var aw = fnlAwards();
  if (aw.length) h += '<div class="card stack"><h3>Season awards</h3>' + aw.map(function (a) { return '<div class="row sp" style="flex-wrap:nowrap"><span class="dim">' + a[0] + '</span><b style="text-align:right">' + esc(a[1]) + '</b></div>'; }).join('') + '</div>';
  h += '<div class="card"><h3 style="margin-bottom:8px">Drivers · top 10</h3><table class="t"><tbody>' + c.ds.slice(0, 10).map(function (d, i) { return '<tr class="' + (d === p ? 'me' : '') + '"><td class="mono dim" style="width:28px">' + (i + 1) + '</td><td>' + tagD(d) + ' ' + esc(d.name) + '</td><td class="r mono">' + d.pts + '</td></tr>'; }).join('') + '</tbody></table></div>';
  h += '<div class="card"><h3 style="margin-bottom:8px">Constructors</h3><table class="t"><tbody>' + c.ts.map(function (x, i) { return '<tr class="' + (x === t ? 'me' : '') + '"><td class="mono dim" style="width:28px">' + (i + 1) + '</td><td>' + tagT(x) + ' ' + esc(x.name) + '</td><td class="r mono">' + x.pts + '</td></tr>'; }).join('') + '</tbody></table></div>';
  return h + '<button class="btn pri wide" data-act="rev-done">Contract and what is next</button></div>';
}
if (typeof A !== 'undefined') {
  var fnlSE = A['season-end'], fnlRN = A['r-next'];
  A['season-end'] = function () {
    if (!S.sit && S.revSeen !== S.season && S.round >= seasonRounds(S) && !S.lastSummary && typeof vReview === 'function') { UI.screen = 'review'; render(); return; }
    fnlSE();
  };
  A['rev-done'] = function () { S.revSeen = S.season; fnlSE(); };
  A['r-next'] = function () { fnlRN(); if (!S.sit && S.round >= seasonRounds(S) && !S.lastSummary && S.revSeen !== S.season) { UI.screen = 'review'; render(); } };
}
/* ---- keluar semasa race: keputusan dikunci ----
   Lampu padam menanda S.live. Kalau pemain keluar atau muat semula sebelum bendera berkotak, jurutera menamatkan race dengan autopilot
   (tiada bonus minigame atau objektif, moral -6). Tiada kelebihan mengulang race yang berjalan buruk. */
/* Keep physics state without duplicating driver/team histories in every car. */
function liveCheckpoint(R) {
  if (!S || !S.live || !R || R.done || S.live.r !== S.round || S.live.ci !== R.ci) return;
  var snap = {};
  Object.keys(R).forEach(function (key) { if (key !== 'c' && key !== 'p' && key !== 'cars') snap[key] = R[key]; });
  snap.cars = R.cars.map(function (f) {
    var car = {}; Object.keys(f).forEach(function (key) { if (key !== 'd' && key !== 't') car[key] = f[key]; }); return car;
  });
  S.live.race = snap; S.live.seed = _s; S.live.lap = R.p.lap;
}
function liveRestore(S, lv) {
  if (!lv.race || lv.race.v !== 2 || lv.race.ci !== lv.ci || !lv.race.cars || !lv.race.cars.length) return null;
  var R = JSON.parse(JSON.stringify(lv.race)); R.c = circuitFor(S, R.ci);
  if (!R.c || !R.cars.every(function (f) { return S.drivers[f.di] && S.teams[f.team]; })) return null;
  R.cars.forEach(function (f) { f.d = S.drivers[f.di]; f.t = S.teams[f.team]; });
  R.p = R.cars.filter(function (f) { return f.isP; })[0];
  if (!R.p) return null;
  if (lv.seed != null) seedRnd(lv.seed);
  while (!R.done) tick2(R);
  R.cls = R.cars.slice().sort(function (a, b) { var ta = a.dnf ? 1e9 - a.dnfS : a.tFin + (a.pen || 0), tb = b.dnf ? 1e9 - b.dnfS : b.tFin + (b.pen || 0); return ta - tb; });
  R.cls.forEach(function (f, i) { f.pos = i + 1; });
  return R;
}
/* Reload/page close saves the current race, including an open pit/mini-game decision. */
window.addEventListener('pagehide', function () {
  if (typeof RUN !== 'undefined' && RUN && S && S.live) { liveCheckpoint(RUN.R); save(); }
});
function liveSettle() {
  if (!S || !S.live || S.sit) { if (S) S.live = null; return; }
  var lv = S.live; S.live = null;
  if (lv.r !== S.round || S.round >= seasonRounds(S)) return;
  var ci = S.cal[S.round], R = liveRestore(S, lv) || runRace2(S, ci, qualiGrid2(S, ci), {}), fl = null;
  R.cars.forEach(function (f) { if (!f.dnf && f.best < 900 && (!fl || f.best < fl.best)) fl = f; });
  R.fl = { di: fl ? fl.di : -1, t: fl ? fl.best : 0 };
  var rep = finishRace(S, { ci: R.ci, c: R.c, wetRace: R.w && R.w.type !== 'kering', fl: R.fl, cls: R.cls.map(function (f) { return { car: { d: f.d, di: f.di, isP: f.isP, grid: f.grid, dnf: f.dnf, evalOrder: !!f.evalOrder, evalOrderCredit: f.evalOrderCredit || 0, evalSpins: f.evalSpins || 0, pen: f.pen || 0 }, pos: f.pos, dnf: !!f.dnf }; }) }, 0);
  S.morale = clamp((S.morale == null ? 50 : S.morale) - 6, 0, 100);
  save();
  try { toast('You left mid-race. Your engineer finished it on autopilot: ' + (rep.P.dnf ? 'DNF' : 'P' + rep.P.pos) + ', morale -6.'); } catch (e) { }
}
/* ---- peringatan XP: pemain yang tak belanja XP tak akan bertambah baik ---- */
function xpNudgeHTML(cls) {
  if (!S || S.sit) return '';
  var p = me(), cheap = Math.min.apply(null, PROGRESSION.stats.filter(function (k) { return p[k] < statCap(S, k); }).map(function (k) { return skillCost(p[k], S, k); }));
  if (!isFinite(cheap) || S.xp < cheap) return '';
  return '<div class="' + (cls || '') + ' card spon-b"><div><b>' + S.xp + ' XP to spend</b><span>Spend earned XP on skill training in the Driver tab.</span></div><button class="btn sm pri" data-act="tab" data-v="aku">Train</button></div>';
}
