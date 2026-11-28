'use strict';
/* ===== Aerodynamic Testing Restrictions (2.6.9): R&D allowance by constructors' place, as in F1 since 2021 =====
   The leader gets the least wind tunnel and simulation time, the last team the most. Period 1 (rounds before mid-season) uses last
   season's final order; from mid-season the order at the halfway round. The winter package uses the final order of the season.
   The gain of every successful upgrade is multiplied by 1 + k x (allowance - average), so the league average stays the same.
   Gated by S.atr (Pro careers; new careers at once, older saves from the next season). No random numbers. */
var ATR = { v: 1, top: 0.70, bot: 1.15, k: 1 };
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

/* the allowance strip in the R&D workshop and the team dossier */
function atrStripHTML(S, t) {
  if (!atrOn(S) || !t || t.spec) return '';
  var o = atrOrder(S), p = o.pos[t.id] || 5, n = S.teams.length, mul = atrMul(S, t), half = Math.ceil(seasonRounds(S) / 2);
  var bars = ''; for (var i = 1; i <= n; i++) bars += '<i class="' + (i === p ? 'on' : '') + '" style="height:' + Math.round(30 + 70 * (atrPctAt(S, i) - ATR.top) / (ATR.bot - ATR.top)) + '%" title="P' + i + ' ' + Math.round(atrPctAt(S, i) * 100) + '%"></i>';
  var when = o.per === 1 ? 'Set by last season\'s final order · reset after round ' + half : 'Set by the order at mid-season · the winter car uses the final order';
  return '<div class="atr-strip"><div class="atr-l"><small>Wind tunnel allowance</small><b>' + atrTxt(S, t) + '</b><span>as P' + p + ' · upgrades ' + (mul >= 1 ? '+' : '−') + Math.abs(Math.round((mul - 1) * 100)) + '% against the average</span></div><div class="atr-bars" aria-hidden="true">' + bars + '</div><p>' + when + '. The leaders get the least testing time, the last team the most.</p></div>';
}
(function () {
  if (typeof tgWorkshop === 'function') { var w0 = tgWorkshop; tgWorkshop = function (t) { var h = w0.apply(this, arguments), box = atrStripHTML(S, t); if (!box) return h; var k = h.indexOf('<div class="tg-rd">'); return k >= 0 ? h.slice(0, k) + box + h.slice(k) : h; }; }
})();
function atrPackLine(S, t) { var o = atrOrder(S); return 'Wind tunnel allowance (ATR): ' + atrTxt(S, t) + ' as P' + (o.pos[t.id] || 5) + ' (' + (o.per === 1 ? 'from last season\'s final order' : 'from the mid-season order') + '), upgrade gains x' + atrMul(S, t).toFixed(2); }
