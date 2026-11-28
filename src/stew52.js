'use strict';
/* ===== Stewards (design D2 + C9): rulings on contact and in qualifying, time and grid penalties, penalty points, bans =====
   Contact: the engine knows how likely the pass was (p) when the cars touched. A hopeful move is the attacker's fault; a fair one is a racing incident.
   Time penalties are served at the next pit stop (the car is held); if the car never stops again they are added to its race time.
   A penalty that cannot be served (the car retired) becomes a grid drop at the next race. Penalty points expire after 22 races; 12 points = a one-race ban.
   Gated by S.stew (F1 Pro careers; round 0 now, otherwise from the next season). No extra race random numbers are drawn: culprits come from a hash. */
var STW = { v: 1, p10: 0.02, p5: 0.08, hurtS: 2, pts5: 1, pts10: 2, ptsGrid: 1, ptsImpede: 1, gridServe5: 3, gridServe10: 5, impede: 3, qLoss: 0.5, impedePlaces: 3, yellowDriver: 0.5, window: 22, ban: 12, keepLog: 60 };
function stewOn(S) { return !!(S && S.mode === 'pro' && S.stew && S.stew.v >= 1 && S.season >= S.stew.from && S.teams && S.teams[0] && !S.teams[0].spec && (typeof leagueOf !== 'function' || leagueOf(S) === 'f1')); }
function stewMigrate(S) { if (!S || S.mode !== 'pro' || S.stew || !S.teams) return; S.stew = { v: STW.v, from: (S.round || 0) === 0 ? S.season : S.season + 1, n: 0, pts: {}, grid: [], ban: [], log: [] }; }
function stewKey(d) { return d ? (d.uid || d.name) : ''; }
function stewNext(S) { var n = seasonRounds(S); return S.round + 1 < n ? { s: S.season, r: S.round + 1 } : { s: S.season + 1, r: 0 }; }
function stewPts(S, d) { var L = (S.stew.pts[stewKey(d)] || []).filter(function (x) { return S.stew.n - x.n < STW.window; }); return L.reduce(function (a, x) { return a + x.p; }, 0); }
function stewH(S, salt) { return typeof hashS === 'function' ? hashS(S.season + ':' + S.round + ':' + salt) : 0.5; }

/* ---------- qualifying: traffic and yellow flags get a cause ---------- */
function stewCulprit(Q, si, victim, salt) {
  var L = Q.alive.filter(function (di) { return di !== victim; }); if (!L.length) return null;
  return L[Math.floor(stewH(Q.g, 'q' + si + ':' + victim + ':' + salt) * L.length) % L.length];
}
/* before the session is sorted: a driver who caused a yellow loses the lap he was on (his better run is deleted) */
function stewQualiPre(Q, si, rows) {
  var S = Q.g; if (!stewOn(S)) return;
  Q.stew = Q.stew || [];
  var yDone = Q.stew.some(function (x) { return x.k === 'yellow' && x.si === si; });
  rows.forEach(function (r) {
    [r.r1, r.r2].forEach(function (run, k) {
      if (!run || run.ev !== 'kuning' || yDone) return;   /* one yellow-flag incident per session: the other laps it spoiled share the same cause */
      if (stewH(S, 'yd' + si) >= STW.yellowDriver) { yDone = true; return; }   /* some yellows are debris or a stopped car, not a driver error */
      var c = stewCulprit(Q, si, r.di, 'y' + k), cr = rows.filter(function (x) { return x.di === c; })[0]; if (!cr || cr.yDel) return;
      var keep = cr.r1.t >= cr.r2.t ? cr.r1 : cr.r2; cr.yDel = true; cr.t = keep.t;
      Q.stew.push({ si: si, k: 'yellow', c: c, v: r.di, txt: 'caused a yellow flag in ' + QNAME[si] + ': best lap deleted' }); yDone = true;
    });
  });
}
/* after the session is sorted: a hold-up that cost the other driver a place is impeding (grid drop); a smaller one is a reprimand */
function stewQualiPost(Q, si, rows) {
  var S = Q.g; if (!stewOn(S)) return;
  Q.stew = Q.stew || [];
  rows.forEach(function (r) {
    var run = [r.r1, r.r2].filter(function (x) { return x && x.ev === 'trafik' && x.tl >= STW.qLoss; })[0]; if (!run) return;
    var clean = run.t - run.tl; if (clean >= r.t) return;   /* without the hold-up this run would not have improved his time: no harm done */
    var better = rows.filter(function (x) { return x !== r && x.t > clean && x.t < r.t; }).length, c = stewCulprit(Q, si, r.di, 't'); if (c == null) return;
    var key = si + ':' + r.di; if (Q.stew.some(function (x) { return x.key === key; })) return;
    Q.stew.push(better >= STW.impedePlaces ? { key: key, si: si, k: 'impede', c: c, v: r.di, places: STW.impede, txt: 'impeded ' + S.drivers[r.di].name + ' in ' + QNAME[si] + ' (cost ' + run.tl.toFixed(2) + ' s and ' + better + (better === 1 ? ' place' : ' places') + ')' } : { key: key, si: si, k: 'reprimand', c: c, v: r.di, txt: 'held up ' + S.drivers[r.di].name + ' in ' + QNAME[si] + ': reprimand' });
  });
  /* the rulings go to the race grid of this round, once */
  if (si === 2 || Q.alive.length <= 10) {
    var dn = {}; (S.stew.grid || []).forEach(function (g) { if (g.q) dn[g.key] = 1; });
    Q.stew.forEach(function (x) {
      var d = S.drivers[x.c]; if (!d) return; var key = S.season + ':' + S.round + ':' + (x.key || x.si + ':y:' + x.c);
      if (x.k === 'impede' && !dn[key]) { S.stew.grid.push({ k: stewKey(d), n: d.name, s: S.season, r: S.round, places: x.places, why: x.txt, q: 1, key: key }); stewPoint(S, d, STW.ptsImpede, 'Impeding in qualifying'); dn[key] = 1; }
      stewLog(S, { s: S.season, r: S.round, q: 1, k: x.k, n: d.name, txt: x.txt });
    });
  }
}

/* ---------- race: contact rulings ---------- */
(function () {
  if (typeof attemptPass !== 'function') return;
  var ap0 = attemptPass;
  attemptPass = function (R, b, a, z) {
    var n0 = R.log.length, ah = a.hold, ok = ap0.apply(this, arguments);
    if (!R.stewOn || ok) return ok;
    var c = null, fl = null; for (var i = n0; i < R.log.length; i++) { if (R.log[i].k === 'contact') c = R.log[i]; if (R.log[i].k === 'fail') fl = R.log[i]; }
    if (!c || !fl) return ok;
    var p = fl.p, sec = p < STW.p10 ? 10 : p < STW.p5 ? 5 : 0, hurt = a.hold > ah + STW.hurtS, out = !!b.dnf;
    if (sec && (hurt || out)) sec = 10; else if (!sec && out && p < STW.p5 * 1.5) sec = 5;
    if (!sec) { R.stew.push({ lap: b.lap, k: 'noaction', b: b.di, a: a.di, p: +p.toFixed(3), txt: 'Contact ' + b.d.name + ' / ' + a.d.name + ': racing incident, no further action' }); return ok; }
    var e = { lap: b.lap, k: out ? 'grid' : 'time', sec: sec, b: b.di, a: a.di, p: +p.toFixed(3), places: out ? (sec >= 10 ? STW.gridServe10 : STW.gridServe5) : 0 };
    e.txt = b.d.name + ' caused a collision with ' + a.d.name + (out ? ' and retired: ' + e.places + '-place grid drop at the next race' : ': ' + sec + '-second time penalty');
    R.stew.push(e);
    if (!out) { b.penQ = (b.penQ || 0) + sec; b.penTot = (b.penTot || 0) + sec; }
    R.log.push({ t: R.t, lap: b.lap, k: 'pen', b: b.di, a: a.di, sec: sec, out: out ? 1 : 0, places: e.places, txt: e.txt, tags: ['stewards'] });
    return ok;
  };
})();
/* served at a pit stop: the car is held for the penalty before the crew may work */
function stewServe(R, f) { f.hold += f.penQ; f.penServed = (f.penServed || 0) + f.penQ; R.log.push({ t: R.t, lap: f.lap, k: 'penserve', b: f.di, sec: f.penQ, txt: f.d.name + ' serves a ' + f.penQ + '-second penalty in the pit stop', tags: ['stewards'] }); f.penQ = 0; }
/* at the flag: whatever was not served is added to the race time */
function stewFinish(R) {
  if (!R.stewOn || R.stewDone) return; R.stewDone = true;
  R.cars.forEach(function (f) { if (f.penQ > 0 && !f.dnf) { f.pen = (f.pen || 0) + f.penQ; R.stew.push({ lap: R.L, k: 'added', b: f.di, sec: f.penQ, txt: f.d.name + ': ' + f.penQ + ' s added to the race time (not served in a stop)' }); f.penQ = 0; } });
}

/* ---------- grid drops before the race, bans, and race setup ---------- */
function stewBefore(S, ci, gridIds, o) {
  if (!stewOn(S)) return gridIds;
  var drops = {}, list = [];
  (S.stew.grid || []).forEach(function (g) { if (g.s !== S.season || g.r !== S.round) return; var di = S.drivers.findIndex(function (d) { return stewKey(d) === g.k; }); if (di < 0) return; drops[di] = Math.min(15, (drops[di] || 0) + g.places); list.push({ di: di, n: g.n, places: g.places, why: g.why }); });
  S.stewRun = { s: S.season, r: S.round, grid: list };
  if (!list.length) return gridIds;
  var slot = gridIds.map(function (di, i) { return { di: di, v: i + (drops[di] || 0) + (drops[di] ? 0.5 : 0) }; });
  slot.sort(function (a, b) { return a.v - b.v; });
  return slot.map(function (x) { return x.di; });
}
var STW_LAST = null;   /* the race being run (kept outside the save: a race object is large and refers back to the drivers) */
(function () { if (typeof makeRace2 !== 'function') return; var mk0 = makeRace2; makeRace2 = function (S, ci, gridIds, o) { var R = mk0.apply(this, arguments); if (stewOn(S)) { R.stewOn = true; R.stew = []; R.stewGrid = S.stewRun && S.stewRun.s === S.season && S.stewRun.r === S.round ? S.stewRun.grid.slice() : []; STW_LAST = { s: S.season, r: S.round, R: R }; } return R; }; })();
function stewPoint(S, d, p, why) {
  if (!p || !d) return; var k = stewKey(d), L = S.stew.pts[k] = (S.stew.pts[k] || []).filter(function (x) { return S.stew.n - x.n < STW.window; });
  L.push({ n: S.stew.n, p: p, why: why, s: S.season, r: S.round });
  if (L.reduce(function (a, x) { return a + x.p; }, 0) >= STW.ban) {
    var nx = stewNext(S); S.stew.ban.push({ k: k, n: d.name, s: nx.s, r: nx.r }); S.stew.pts[k] = [];
    stewLog(S, { s: S.season, r: S.round, k: 'ban', n: d.name, txt: d.name + ' reaches ' + STW.ban + ' penalty points: banned for the next race' });
    if (typeof pushNews === 'function') pushNews(S, { k: 'garage', kick: 'STEWARDS', t: d.team, s: S.season, r: S.round + 1, head: d.name + ' banned for the next race', sub: STW.ban + ' penalty points within ' + STW.window + ' races. A reserve driver takes the seat.' });
  }
}
function stewLog(S, e) { S.stew.log.push(e); if (S.stew.log.length > STW.keepLog) S.stew.log = S.stew.log.slice(-STW.keepLog); }
function stewBanned(S, d, s, r) { var k = stewKey(d); return (S.stew.ban || []).some(function (b) { return b.k === k && b.s === s && b.r === r; }); }
/* after the race: points, grid drops that could not be served, the log; idempotent per round */
function stewCommit(S, R0) {
  var R = R0 && R0.stew ? R0 : STW_LAST && STW_LAST.s === S.season && STW_LAST.r === S.round ? STW_LAST.R : null;
  if (!stewOn(S) || !R || !R.stew || R.stewCommitted) return; R.stewCommitted = true;
  if (S.stew.lastC === S.season + ':' + S.round) return; S.stew.lastC = S.season + ':' + S.round;
  S.stew.n++;
  var nx = stewNext(S), byDi = {}; (R.cars || []).forEach(function (f) { byDi[f.di] = f; });
  R.stew.forEach(function (e) {
    var d = S.drivers[e.b]; if (!d || e.k === 'noaction' || e.k === 'added') { if (e.k !== 'noaction') stewLog(S, { s: S.season, r: S.round, k: e.k, n: d ? d.name : '?', txt: e.txt }); return; }
    stewLog(S, { s: S.season, r: S.round, k: e.k, n: d.name, txt: e.txt });
    stewPoint(S, d, e.sec >= 10 ? STW.pts10 : STW.pts5, 'Causing a collision');
    if (e.k === 'grid') S.stew.grid.push({ k: stewKey(d), n: d.name, s: nx.s, r: nx.r, places: e.places, why: 'caused a collision and retired' });
  });
  (R.stewGrid || []).forEach(function (g) { stewLog(S, { s: S.season, r: S.round, k: 'gridapplied', n: g.n, txt: g.n + ' starts ' + g.places + ' places back: ' + g.why }); });
  S.stew.grid = S.stew.grid.filter(function (g) { return g.s > S.season || (g.s === S.season && g.r > S.round); });
  S.stew.ban = S.stew.ban.filter(function (b) { return b.s > S.season || (b.s === S.season && b.r > S.round); });
  S.stew.races = S.stew.races || []; S.stew.races = S.stew.races.filter(function (x) { return !(x.s === S.season && x.r === S.round); });
  S.stew.races.push({ s: S.season, r: S.round, rulings: R.stew.filter(function (e) { return e.k !== 'noaction'; }).map(function (e) { return e.txt; }), grid: (R.stewGrid || []).map(function (g) { return g.n + ' -' + g.places + ' (' + g.why + ')'; }), incidents: R.stew.filter(function (e) { return e.k === 'noaction'; }).length });
  if (S.stew.races.length > 30) S.stew.races = S.stew.races.slice(-30);
}

/* ---------- bans: a reserve takes the seat for one round (before qualifying), the banned driver is put back after the race ---------- */
function stewStandIn(S, di) {
  var src = (S.reserves || [])[0] || (S.world && worldView(S, 'f2').drivers.slice().sort(function (a, b) { return ovr(b) - ovr(a); })[0]) || null, orig = S.drivers[di];
  var d = src ? JSON.parse(JSON.stringify(src)) : JSON.parse(JSON.stringify(orig));
  if (!src) { d.name = 'Reserve driver'; d.pace = Math.max(60, orig.pace - 8); d.race = Math.max(60, orig.race - 8); }
  d.id = di; d.team = orig.team; d.num = orig.num; d.uid = (d.uid || d.name) + ':standin'; d.stand = true; d.pts = 0; d.wins = 0; d.pods = 0; d.starts = 0; d.poles = 0; d.dnf = 0; d.fl = 0; d.obj = null; d.con = null;
  return d;
}
function stewSwapIn(S) {
  if (!stewOn(S)) return;
  var key = S.season + ':' + S.round; if (S.stewSwap && S.stewSwap.key === key) return;
  var sw = { key: key, cars: [] };
  S.drivers.forEach(function (d, di) {
    if (!stewBanned(S, d, S.season, S.round)) return;
    var sub = stewStandIn(S, di); sw.cars.push({ di: di, orig: d, sub: sub.name, me: di === S.pi });
    if (di === S.pi) { S.bench = d; S.sit = { ban: 1, s: S.season, team: d.team }; }
    S.drivers[di] = sub;
    stewLog(S, { s: S.season, r: S.round, k: 'standin', n: d.name, txt: sub.name + ' replaces the banned ' + d.name + ' this round' });
  });
  S.stewSwap = sw.cars.length ? sw : { key: key, cars: [] };
}
function stewSwapOut(S) {
  var sw = S.stewSwap; if (!sw || !sw.cars || !sw.cars.length) { S.stewSwap = null; return; }
  sw.cars.forEach(function (x) {
    var sub = S.drivers[x.di];
    S.drivers[x.di] = x.orig;
    if (x.me) {
      S.bench = null; S.sit = null;
      S.results.push({ round: S.round - 1, ci: S.cal[S.round - 1], grid: 0, pos: 0, dnf: 'Banned', pts: 0, fl: false, ban: true, sub: sub ? sub.name : '' });
    }
  });
  S.stewSwap = null;
}
(function () {
  if (typeof qkInit === 'function') { var qi0 = qkInit; qkInit = function (G) { stewSwapIn(G); var Q = qi0.apply(this, arguments); if (Q) Q.g = G; return Q; }; }
  var sb0 = stewBefore; stewBefore = function (S) { stewSwapIn(S); return sb0.apply(this, arguments); };
  if (typeof finishRace === 'function') { var fr0 = finishRace; finishRace = function (S) { var r = fr0.apply(this, arguments); try { stewSwapOut(S); } catch (e) { } return r; }; }
  /* the player is banned: no weekend to drive; the round is run with the reserve in the seat */
  if (typeof A !== 'undefined' && A['wk-start']) {
    var ws0 = A['wk-start'];
    A['wk-start'] = function () {
      if (!(S && stewOn(S) && stewBanned(S, S.drivers[S.pi], S.season, S.round))) return ws0.apply(this, arguments);
      var me = S.drivers[S.pi], ci = S.cal[S.round], c = circuitFor(S, ci);
      stewSwapIn(S);
      var sub = S.drivers[S.pi], R = runRace2(S, ci, qualiGrid2(S, ci), {}), fl = null;
      R.cars.forEach(function (f) { if (!f.dnf && f.best < 900 && (!fl || f.best < fl.best)) fl = f; });
      R.fl = { di: fl ? fl.di : -1, t: fl ? fl.best : 0 };
      var mine = R.cls.filter(function (f) { return f.di === S.pi; })[0];
      finishRace(S, { ci: R.ci, c: R.c, fl: R.fl, stew: R.stew, stewGrid: R.stewGrid, cars: R.cars, cls: R.cls.map(function (f) { return { car: { d: f.d, di: f.di, isP: f.isP, grid: f.grid, dnf: f.dnf }, pos: f.pos, dnf: !!f.dnf }; }) }, 0);
      if (typeof save === 'function') save(); render();
      showModal('<div class="stw-ban"><small>Stewards</small><h2>You are banned</h2><p>' + STW.ban + ' penalty points in ' + STW.window + ' races mean you sit out ' + esc(c.name) + '. ' + esc(sub.name) + ' drove your car' + (mine ? (mine.dnf ? ' and retired.' : ' and finished P' + mine.pos + '.') : '.') + '</p><p class="dim">Your points are back to zero. The next race is yours again.</p><button class="btn pri wide" data-act="mclose">Back to the paddock</button></div>');
    };
  }
})();

/* ---------- screens and story pack ---------- */
function stewPtsList(S, d) { return (S.stew.pts[stewKey(d)] || []).filter(function (x) { return S.stew.n - x.n < STW.window; }); }
function stewCardHTML() {
  if (!S || !stewOn(S)) return '';
  var me = S.drivers[S.pi], L = stewPtsList(S, me), tot = L.reduce(function (a, x) { return a + x.p; }, 0), segs = '';
  for (var i = 0; i < STW.ban; i++) segs += '<i class="' + (i < tot ? (tot >= 9 ? 'hot' : 'on') : '') + '"></i>';
  var next = S.stew.grid.filter(function (g) { return g.k === stewKey(me); });
  return '<section class="stw-card"><header><div><small>Stewards</small><h3>Penalty points</h3></div><b class="stw-tot">' + tot + '<small>/' + STW.ban + '</small></b></header><div class="stw-bar">' + segs + '</div>' +
    (L.length ? '<ul class="stw-list">' + L.slice().reverse().map(function (x) { return '<li><b>+' + x.p + '</b><span>' + esc(x.why) + '</span><em>S' + x.s + ' R' + (x.r + 1) + ' · clears in ' + Math.max(1, STW.window - (S.stew.n - x.n)) + ' races</em></li>'; }).join('') + '</ul>' : '<p class="stw-clean">Clean licence. Keep it that way.</p>') +
    (next.length ? '<p class="stw-warn">Grid drop waiting: ' + next.map(function (g) { return g.places + ' places (' + esc(g.why) + ')'; }).join(', ') + '</p>' : '') +
    '<p class="stw-foot">Points clear after ' + STW.window + ' races · ' + STW.ban + ' points = one-race ban</p></section>';
}
function stewResultHTML(R) {
  if (!R || !R.stewOn) return '';
  var L = (R.stew || []).filter(function (e) { return e.k !== 'noaction'; }), G = R.stewGrid || [], inc = (R.stew || []).filter(function (e) { return e.k === 'noaction'; }).length;
  var rows = G.map(function (g) { return '<li class="g"><b>GRID</b><span>' + esc(g.n) + ' started ' + g.places + ' places back: ' + esc(g.why) + '</span></li>'; }).concat(L.map(function (e) { return '<li class="' + (e.k === 'added' ? 'a' : e.k === 'grid' ? 'g' : 't') + '"><b>' + (e.k === 'grid' ? 'GRID' : e.k === 'added' ? '+' + e.sec + 's' : e.sec + 's') + '</b><span>' + esc(e.txt) + '</span></li>'; })).join('');
  return '<div class="stw-res">' + (rows ? '<ul>' + rows + '</ul>' : '<p class="dim">No penalties this race.</p>') + '<p class="dim">' + inc + ' other contact' + (inc === 1 ? ' was' : 's were') + ' judged racing incidents. Time penalties are served at the next pit stop; if a car does not stop again, they are added at the flag.</p>' + stewCardHTML() + '</div>';
}
function stewPackText(S) {
  if (!stewOn(S)) return '';
  var me = S.drivers[S.pi], L = stewPtsList(S, me), tot = L.reduce(function (a, x) { return a + x.p; }, 0), out = ['Penalty points: ' + tot + ' of ' + STW.ban + ' (points clear after ' + STW.window + ' races; ' + STW.ban + ' = one-race ban)' + (L.length ? ': ' + L.map(function (x) { return '+' + x.p + ' ' + x.why + ' (S' + x.s + ' R' + (x.r + 1) + ')'; }).join(', ') : '')];
  var others = S.drivers.filter(function (d) { return d !== me; }).map(function (d) { return { n: d.name, p: stewPts(S, d) }; }).filter(function (x) { return x.p > 0; }).sort(function (a, b) { return b.p - a.p; }).slice(0, 5);
  if (others.length) out.push('Most penalty points in the field: ' + others.map(function (x) { return x.n + ' ' + x.p; }).join(', '));
  return out.join('\n');
}
(function () {
  if (typeof vResult === 'function') { var vr0 = vResult; vResult = function () { var h = vr0.apply(this, arguments), wk = UI.wk, R = wk && wk.R; if (!R || !R.stewOn || typeof rvFold !== 'function') return h; var L = (R.stew || []).filter(function (e) { return e.k !== 'noaction'; }).length + (R.stewGrid || []).length; var fold = rvFold('stewards', "Stewards' decisions", L ? L + ' decision' + (L === 1 ? '' : 's') + ' · your penalty points' : 'No penalties · your penalty points', stewResultHTML(R)); var k = h.indexOf('<details class="rv-file" data-rv-fold="storypack"'); return k >= 0 ? h.slice(0, k) + fold + h.slice(k) : h; }; }
  if (typeof hAku === 'function') { var ha0 = hAku; hAku = function () { var h = ha0.apply(this, arguments), box = stewCardHTML(); if (!box) return h; var k = h.indexOf('<div class="dg-col">', h.indexOf('<div class="dg-col">') + 1); return k >= 0 ? h.slice(0, k + 20) + box + h.slice(k + 20) : h; }; }
})();

/* ---------- the live race: the engineer tells you, the caption flashes, the tower shows the pending penalty ---------- */
(function () {
  if (typeof readLog !== 'function') return;
  var rl0 = readLog;
  readLog = function (R) {
    try {
      var p = R.p;
      for (var i = RUN.logI; i < R.log.length; i++) {
        var e = R.log[i]; if (e.k !== 'pen' && e.k !== 'penserve') continue;
        var b = S.drivers[e.b], a = e.a != null ? S.drivers[e.a] : null;
        if (e.k === 'pen') {
          if (e.b === p.di) { if (typeof cap === 'function') cap(e.out ? 'Grid drop next race' : '+' + e.sec + 's penalty', 'lost'); radio(R, e.out ? 'Stewards: that collision is a ' + e.places + '-place grid drop at the next race.' : 'Stewards have given us a ' + e.sec + '-second penalty for the contact with ' + a.code + '. We serve it at the next stop. If we don’t stop again it goes on our race time.', 'x', 1); }
          else if (e.a === p.di) radio(R, 'Stewards: ' + b.code + ' gets ' + (e.out ? 'a grid drop' : e.sec + ' seconds') + ' for hitting us.', 'i', 1);
          else radio(R, 'Stewards: ' + e.sec + ' seconds for ' + b.code + ', contact with ' + (a ? a.code : '') + '.', 'i');
        } else if (e.k === 'penserve') {
          if (e.b === p.di) radio(R, 'Penalty served: we held you ' + e.sec + ' seconds in the box.', 'e', 1);
          else radio(R, b.code + ' serves a ' + e.sec + '-second penalty in the stop.', 'i');
        }
      }
    } catch (er) { }
    return rl0.apply(this, arguments);
  };
})();
