'use strict';
/* ===== Aerodynamic Testing Restrictions (2.6.9): R&D allowance by constructors' place, as in F1 since 2021 =====
   The leader gets the least wind tunnel and simulation time, the last team the most. Period 1 (rounds before mid-season) uses last
   season's final order; from mid-season the order at the halfway round. The winter package uses the final order of the season.
   The gain of every successful upgrade is multiplied by 1 + k x (allowance - average), so the league average stays the same.
   Gated by S.atr (Pro careers; new careers at once, older saves from the next season). No random numbers. */
var ATR = { v: 1, top: 0.70, bot: 1.15, k: 2 };   /* k tuned in 12 careers x 20 seasons with the package cap: 1.5 -> 15%, 2 -> 28%, 2.5 -> 26% of bottom-half teams reach the top 3 within 5 seasons */
function atrOn(S, season) { return !!(S && S.mode === 'pro' && S.atr && S.atr.v >= 1 && (season != null ? season : S.season) >= S.atr.from && S.teams && S.teams[0] && !S.teams[0].spec); }
function atrMigrate(S) { if (!S || S.mode !== 'pro' || S.atr || !S.teams) return; S.atr = { v: ATR.v, from: (S.round || 0) === 0 ? S.season : S.season + 1 }; }
function atrPctAt(S, p) { var n = S.teams.length; return ATR.top + (ATR.bot - ATR.top) * (p - 1) / Math.max(1, n - 1); }
/* the order the allowance is set from */
function atrOrder(S) {
  var n = seasonRounds(S), half = Math.ceil(n / 2), per = (S.round || 0) >= half ? 2 : 1, key = S.season + ':' + per;
  if (S.atrP && S.atrP.k === key) return S.atrP;
  var pos = {};
  if (per === 2) teamStandings(S).forEach(function (t, i) { pos[t.id] = i + 1; });
  else {
    var have = S.teams.every(function (t) { return t.sh && t.sh.length; });
    if (have) S.teams.forEach(function (t) { pos[t.id] = t.sh[t.sh.length - 1].pos; });
    else S.teams.slice().sort(function (a, b) { return teamPower(b) - teamPower(a); }).forEach(function (t, i) { pos[t.id] = i + 1; });
  }
  S.atrP = { k: key, per: per, pos: pos }; return S.atrP;
}
/* in the winter the next car is built with the allowance of the final order (as the new period starts) */
function atrPos(S, t, winter) {
  if (winter) { var r = teamStandings(S).indexOf(t); return r >= 0 ? r + 1 : 5; }
  return atrOrder(S).pos[t.id] || 5;
}
function atrPct(S, t, winter) { return atrPctAt(S, atrPos(S, t, winter)); }
function atrMul(S, t, winter) {
  if (!t || t.spec || !atrOn(S, winter ? S.season + 1 : null)) return 1;
  return 1 + ATR.k * (atrPct(S, t, winter) - (ATR.top + ATR.bot) / 2);
}
function atrTxt(S, t) { return Math.round(atrPct(S, t) * 100) + '%'; }

/* the allowance panel in the R&D workshop: F1 broadcast style, the whole order with every team's share */
function atrStripHTML(S, t) {
  if (!atrOn(S) || !t || t.spec) return '';
  var o = atrOrder(S), p = o.pos[t.id] || 5, n = S.teams.length, mul = atrMul(S, t), rounds = seasonRounds(S), half = Math.ceil(rounds / 2), byPos = {};
  S.teams.forEach(function (x) { byPos[o.pos[x.id] || 5] = x; });
  var rows = ''; for (var i = 1; i <= n; i++) { var x = byPos[i], pc = atrPctAt(S, i), me = x === t;
    rows += '<div class="atr-row' + (me ? ' on' : '') + '"><em>P' + i + '</em><span class="atr-tm" style="--c:' + (x ? x.color : '#888') + '">' + esc(x ? x.short : '—') + '</span><span class="atr-bar"><i class="' + (me ? 'on' : '') + '" style="width:' + Math.round(pc / ATR.bot * 100) + '%"></i></span><b>' + Math.round(pc * 100) + '%</b></div>'; }
  var segs = ''; for (var r = 1; r <= rounds; r++) segs += '<i class="' + (r <= (S.round || 0) ? 'done' : '') + (r === half + 1 ? ' reset' : '') + '"></i>';
  return '<section class="f1g atr-strip" style="--tc:' + t.color + '"><header class="f1g-h"><span class="f1g-chip">ATR</span><div><small>Aerodynamic testing restrictions</small><h3>Wind tunnel allowance</h3></div><span class="f1g-per"><b>Period ' + o.per + '</b><small>' + (o.per === 1 ? 'R1–R' + half : 'R' + (half + 1) + '–R' + rounds) + '</small></span></header>' +
    '<div class="atr-main"><div class="atr-big"><small>Your share · P' + p + '</small><b>' + Math.round(atrPct(S, t) * 100) + '<i>%</i></b></div><div class="atr-fx ' + (mul >= 1 ? 'up' : 'down') + '"><small>Upgrade gain</small><b>' + (mul >= 1 ? '+' : '−') + Math.abs(Math.round((mul - 1) * 100)) + '%</b><span>against the average</span></div></div>' +
    '<div class="atr-bars">' + rows + '</div>' +
    '<div class="atr-period"><span>' + segs + '</span><small>' + (o.per === 1 ? 'Set by last season\'s final order · resets after round ' + half : 'Set by the order at mid-season · the winter car uses the final order') + '</small></div>' +
    '<p class="f1g-foot">The leaders get the least wind tunnel time, the last team the most</p></section>';
}
(function () {
  if (typeof tgWorkshop === 'function') { var w0 = tgWorkshop; tgWorkshop = function (t) { var h = w0.apply(this, arguments), box = atrStripHTML(S, t); if (!box) return h; var k = h.indexOf('<div class="tg-rd">'); return k >= 0 ? h.slice(0, k) + box + h.slice(k) : h; }; }
})();
function atrPackLine(S, t) { var o = atrOrder(S); return 'Wind tunnel allowance (ATR): ' + atrTxt(S, t) + ' as P' + (o.pos[t.id] || 5) + ' (' + (o.per === 1 ? 'from last season\'s final order' : 'from the mid-season order') + '), upgrade gains x' + atrMul(S, t).toFixed(2); }

/* Soft cap on one package (2.6.9). Catch-up, diminishing returns and the wider luck of a back marker multiplied together could give
   +25 to +36 in one in-season upgrade (1 in 100 packages, seen as aero 56 -> 93 at once). Gains up to the knee are unchanged, above it they
   bend towards the cap. Winter packages (the next car) have their own, higher limits. Same gate as the allowance. */
var DEVCAP = { knee: 8, cap: 14, wKnee: 20, wCap: 30 };
function devCap(S, g, winter) {
  if (!atrOn(S, winter ? S.season + 1 : null)) return g;
  var k = winter ? DEVCAP.wKnee : DEVCAP.knee, c = winter ? DEVCAP.wCap : DEVCAP.cap;
  return g <= k ? g : k + (c - k) * Math.tanh((g - k) / (c - k));
}
