'use strict';
/* ===== Story pack race analysis (2.6.9): in depth without storing every lap of every car =====
   At the flag the game reduces the lap times (f.laps) to a compact summary, about 1.3 KB a race:
   race pace (median clean lap per driver), a lap chart at five checkpoints, the player's race lap by lap,
   the player's main battle, and who decided each of the player's pit stops (team call, player's own call, declined, automatic). */

/* the player's pit decisions during the live race: [lap, src, why, recommended, chosen]
   src: 'call' (engineer's call, accepted), 'alt' (engineer's call, other tyre), 'stay' (engineer's call, declined),
        'self' (the player pressed the pit button), 'cancel' (a queued stop cancelled), 'auto' (the team decided, nothing was asked) */
function spPitDec(R, src, chosen) {
  if (!R || !R.p) return; var p = R.p; R.pdec = R.pdec || [];
  if (R.pdec.length > 40) return;
  R.pdec.push([p.lap || 0, src, src === 'self' ? 'manual' : (p.why || ''), src === 'self' ? '' : (p.pitReq || ''), chosen || '']);
}
(function () {
  if (typeof A === 'undefined') return;
  var wrap = function (k, f) { var o = A[k]; if (typeof o !== 'function') return; A[k] = function (d) { try { if (typeof RUN !== 'undefined' && RUN && RUN.R) f(RUN.R, d); } catch (e) { } return o.apply(this, arguments); }; };
  wrap('pc-yes', function (R) { spPitDec(R, 'call', R.p.pitReq); });
  wrap('pc-alt', function (R, d) { spPitDec(R, 'alt', d && d.v); });
  wrap('pc-no', function (R) { spPitDec(R, 'stay', ''); });
  wrap('r-pit-confirm', function (R) { if (UI.pitDraft && UI.pitDraft.comp && !R.p.pitOk) spPitDec(R, 'self', UI.pitDraft.comp); });
  wrap('r-pitx', function (R) { if (R.p.pitReq) spPitDec(R, 'cancel', ''); });
})();

function spMedian(a) { if (!a.length) return 0; var b = a.slice().sort(function (x, y) { return x - y; }), m = b.length >> 1; return b.length % 2 ? b[m] : (b[m - 1] + b[m]) / 2; }

/* at the flag: reduce the race to the summary kept in the save (rec.dp) */
function spDeepRecord(S, rec, R) {
  if (!R || !R.cars || !R.cars.length) return;
  var L = R.L || rec.laps, lapsOf = function (f) { var a = (f.laps || []).slice(); if (f.fin && f.tFin > 0 && f.lapStart != null && a.length === L - 1 && f.tFin > f.lapStart) a.push(f.tFin - f.lapStart); return a; };   /* the engine records the last lap only as the finish time */
  var cars = R.cars.filter(function (f) { return f.laps && f.laps.length; }).map(function (f) { return { di: f.di, laps: lapsOf(f), c0: f.c0, comp: f.comp }; }), code = function (f) { var d = S.drivers[f.di]; return d ? d.code : '?'; };
  if (!cars.length) return;
  /* laps run behind a safety car or VSC, and each car's pit laps */
  var scL = {}, scOn = 0, scFrom = 0;
  (R.log || []).slice().sort(function (a, b) { return (a.lap || 0) - (b.lap || 0); }).forEach(function (e) {
    if ((e.k === 'sc' || e.k === 'vsc') && !scOn) { scOn = 1; scFrom = e.lap || 0; }
    else if (e.k === 'restart' && scOn) { for (var l = scFrom; l <= (e.lap || scFrom); l++) scL[l] = 1; scOn = 0; }
  });
  if (scOn) for (var l2 = scFrom; l2 <= L; l2++) scL[l2] = 1;
  var pitL = {}; (R.log || []).forEach(function (e) { if (e.k === 'pit' && e.b != null) { var o = pitL[e.b] = pitL[e.b] || {}; o[e.lap || 0] = 1; o[(e.lap || 0) + 1] = 1; } });
  /* race time at each line crossing */
  var cum = {}; cars.forEach(function (f) { var t = 0; cum[f.di] = f.laps.map(function (x) { t += x; return t; }); });
  var orderAt = function (k) { return cars.filter(function (f) { return cum[f.di].length >= k; }).sort(function (a, b) { return cum[a.di][k - 1] - cum[b.di][k - 1]; }); };
  /* race pace: median of clean laps (no lap 1, no pit in or out lap, no safety car lap, nothing 7% over the driver's own median) */
  var pace = cars.map(function (f) {
    var c = f.laps.map(function (x, i) { return { t: x, l: i + 1 }; }).filter(function (o) { return o.l > 1 && !scL[o.l] && !(pitL[f.di] && pitL[f.di][o.l]); }), m0 = spMedian(c.map(function (o) { return o.t; }));
    var c2 = c.filter(function (o) { return o.t <= m0 * 1.07; }).map(function (o) { return o.t; });
    return c2.length >= 3 ? [code(f), +spMedian(c2).toFixed(3), c2.length] : null;
  }).filter(Boolean).sort(function (a, b) { return a[1] - b[1]; });
  /* lap chart: the order at lap 1, a quarter, half, three quarters and the flag */
  var Lmax = Math.max.apply(null, cars.map(function (f) { return f.laps.length; })), Lc = Math.min(L, Lmax);
  var cps = [1, Math.round(Lc / 4), Math.round(Lc / 2), Math.round(3 * Lc / 4), Lc].filter(function (v, i, a) { return v >= 1 && a.indexOf(v) === i; });
  var pdi = R.p ? R.p.di : S.pi, me = cars.filter(function (f) { return f.di === pdi; })[0], mc = me ? code(me) : '', lc = cps.map(function (k) { var o = orderAt(k).map(code), pos = o.indexOf(mc) + 1; return [k, o.slice(0, 10), pos]; });
  /* the player lap by lap: time, position, gap to the car ahead and behind, tyre and its age */
  var pl = [], bt = null;
  if (me && cum[me.di]) {
    var stops = (R.log || []).filter(function (e) { return e.k === 'pit' && e.b === me.di; }).map(function (e) { return [e.lap || 0, e.comp || '']; }), comp = me.c0 || me.comp || '', from = 0, si = 0, near = {};
    for (var k = 1; k <= cum[me.di].length; k++) {
      while (si < stops.length && stops[si][0] < k) { comp = stops[si][1] || comp; from = stops[si][0]; si++; }
      var o = orderAt(k), i = o.indexOf(me), t = cum[me.di][k - 1];
      var ga = i > 0 ? +(t - cum[o[i - 1].di][k - 1]).toFixed(1) : null, gb = i >= 0 && i < o.length - 1 ? +(cum[o[i + 1].di][k - 1] - t).toFixed(1) : null;
      var fl = (scL[k] ? 'S' : '') + (stops.some(function (s) { return s[0] === k; }) ? 'P' : '');
      pl.push([+me.laps[k - 1].toFixed(2), i + 1, ga, gb, comp, k - from, fl]);
      if (i > 0 && ga != null && ga < 1.0) { var a = code(o[i - 1]); near[a] = near[a] || [0, k, k]; near[a][0]++; near[a][2] = k; }
      if (i >= 0 && i < o.length - 1 && gb != null && gb < 1.0) { var b = code(o[i + 1]); near[b] = near[b] || [0, k, k]; near[b][0]++; near[b][2] = k; }
    }
    Object.keys(near).forEach(function (c) { if (!bt || near[c][0] > bt[1]) bt = [c, near[c][0], near[c][1], near[c][2]]; });
    if (bt && bt[1] < 3) bt = null;
    if (bt) { var lk = Math.min(bt[3], cum[me.di].length), ord = orderAt(lk).map(code); bt.push(ord.indexOf(mc) < ord.indexOf(bt[0]) ? 'you' : bt[0]); }
  }
  rec.dp = { v: 1, pace: pace, lc: lc, pl: pl, bt: bt, pd: (R.pdec || []).slice(0, 30), sc: Object.keys(scL).length };
}

/* ---------- text ---------- */
function spLapT(t) { if (!(t > 0)) return '—'; var m = Math.floor(t / 60), s = t - m * 60; return (m ? m + ':' + (s < 10 ? '0' : '') : '') + s.toFixed(m ? 2 : 2); }
var SP_DEC = { call: 'the engineer called it and you agreed', alt: 'the engineer called it, you chose a different tyre', stay: 'the engineer called for a stop and you stayed out', self: 'your own call: you pressed the pit button', cancel: 'you cancelled the queued stop', auto: 'the team decided (you were not asked: auto or fast-forward)' };
function spDeepText(S, rec, scope) {
  var d = rec.dp; if (!d) return '';
  var mc = S.drivers[S.pi] ? S.drivers[S.pi].code : '', L = [], tn = function (k) { return typeof TYN !== 'undefined' && TYN[k] ? TYN[k] : k || '?'; };
  if (d.pace && d.pace.length) {
    var top = d.pace[0][1], mi = -1; d.pace.forEach(function (x, i) { if (x[0] === mc) mi = i; });
    var show = d.pace.slice(0, 10); if (mi >= 10) show.push(d.pace[mi]);
    L.push('Race pace (median clean lap, without lap 1, pit laps and safety car laps): ' + show.map(function (x) { var i = d.pace.indexOf(x); return (i + 1) + ' ' + x[0] + ' ' + (i === 0 ? spLapT(x[1]) : '+' + (x[1] - top).toFixed(3)); }).join(' · ') + (mi >= 0 ? ' · you were the ' + spOrd(mi + 1) + ' fastest on pace' : ''));
  }
  if (d.lc && d.lc.length) { L.push('Lap chart (top 10' + (mc ? ', and your place' : '') + '):'); d.lc.forEach(function (x) { L.push('  L' + x[0] + ': ' + x[1].join(' ') + (x[2] > 10 ? ' … you P' + x[2] : x[2] ? ' (you P' + x[2] + ')' : '')); }); }
  if (d.bt) L.push('Your main battle: ' + d.bt[0] + ', within 1 s for ' + d.bt[1] + ' laps (L' + d.bt[2] + '–L' + d.bt[3] + '), ' + (d.bt[4] === 'you' ? 'you came out ahead' : d.bt[0] + ' came out ahead') + '.');
  if (d.pl && d.pl.length) {
    if (scope === 'season') {
      var st = [], cur = null; d.pl.forEach(function (r, i) { if (!cur || r[5] === 1 && i > 0 || r[4] !== cur.c) { cur = { c: r[4], a: i + 1, t: [], p0: r[1] }; st.push(cur); } cur.b = i + 1; cur.p1 = r[1]; if (!r[6]) cur.t.push(r[0]); });
      L.push('Your stints: ' + st.map(function (s, i) { return (i + 1) + ') ' + tn(s.c) + ' L' + s.a + '–L' + s.b + ', average ' + spLapT(s.t.length ? s.t.reduce(function (a, b) { return a + b; }, 0) / s.t.length : 0) + ', P' + s.p0 + ' to P' + s.p1; }).join('; '));
    } else {
      L.push('Your race lap by lap (lap time · place · gap to the car ahead / behind · tyre and its age; PIT = pit lap, SC = safety car):');
      d.pl.forEach(function (r, i) { L.push('  L' + (i + 1) + ' ' + spLapT(r[0]) + ' · P' + r[1] + ' · ' + (r[2] == null ? 'leading' : '+' + r[2].toFixed(1)) + ' / ' + (r[3] == null ? 'last' : '−' + r[3].toFixed(1)) + ' · ' + r[4] + r[5] + (r[6].indexOf('P') >= 0 ? ' · PIT' : '') + (r[6].indexOf('S') >= 0 ? ' · SC' : '')); });
    }
  }
  /* who decided each stop */
  var pits = (rec.lg || []).filter(function (e) { return e[1] === 'pit' && e[2] === mc; }), dec = d.pd || [];
  if (dec.length || pits.length) {
    L.push('Your pit decisions:');
    var used = {}, out = [];
    dec.forEach(function (x) {
      var w = typeof WHYT !== 'undefined' && WHYT[x[2]] ? WHYT[x[2]][0] : x[2] === 'manual' ? '' : x[2];
      var pi = -1; if (x[1] !== 'stay' && x[1] !== 'cancel') pits.forEach(function (e, i) { if (pi < 0 && !used[i] && e[0] >= x[0]) pi = i; });
      var e = pi >= 0 ? pits[pi] : null; if (pi >= 0) used[pi] = 1;
      out.push([x[0], '  L' + x[0] + ' ' + SP_DEC[x[1]] + (w ? ' (' + w + ')' : '') + (x[3] && x[1] !== 'self' ? ', recommended ' + tn(x[3]) : '') + (x[4] && x[1] !== 'stay' ? ', fitted ' + tn(x[4]) : '') + (e ? ' → boxed L' + e[0] + (e[5] ? ', P' + e[5][0] + ' to P' + (e[5][1] || '?') : '') + (e[4] ? ' (' + spEn(e[4]) + ')' : '') : '')]);
    });
    pits.forEach(function (e, i) { if (!used[i]) out.push([e[0], '  L' + e[0] + ' stop with no recorded decision (an older save, or a race simulated without you)' + (e[5] ? ', P' + e[5][0] + ' to P' + (e[5][1] || '?') : '')]); });
    out.sort(function (a, b) { return a[0] - b[0]; }).forEach(function (o) { L.push(o[1]); });
  }
  return L.join('\n');
}
function spOrd(n) { var s = ['th', 'st', 'nd', 'rd'], v = n % 100; return n + (s[(v - 20) % 10] || s[v] || s[0]); }
