'use strict';
/* ===== Track profile on the strategy page (2.6.9): the circuit guide and the four race factors where the race is planned ===== */
function trackLevel(n) { return '<i class="tp-pips" data-n="' + n + '"><u></u><u></u><u></u></i>'; }
function trackProfileHTML(ci) {
  var c = circuitFor(S, ci); if (!c) return '';
  var g = c.guide || (CIRCUITS[ci] && CIRCUITS[ci].guide) || null, rain = Math.round(c.rain * 100);
  var f = [['Tyre wear', c.wear < 0.95 ? 'Low' : c.wear < 1.15 ? 'Medium' : 'High', c.wear < 0.95 ? 1 : c.wear < 1.15 ? 2 : 3], ['Overtaking', c.ot < 0.5 ? 'Easy' : c.ot < 0.7 ? 'Medium' : 'Hard', c.ot < 0.5 ? 1 : c.ot < 0.7 ? 2 : 3],
    ['Engine', c.pw >= 0.55 ? 'Key' : c.pw <= 0.4 ? 'Minor' : 'Medium', c.pw >= 0.55 ? 3 : c.pw <= 0.4 ? 1 : 2], ['Rain', rain + '%', rain >= 45 ? 3 : rain >= 20 ? 2 : 1]];
  var tip = c.ot >= 0.7 ? 'Track position is king: protect your grid slot, and an undercut is worth more than a late charge.' : c.ot < 0.5 ? 'Passing is easy here: a faster tyre late in the race can make up places.' : 'Passing is possible but costly: plan your stop around traffic.';
  tip += ' ' + (c.wear >= 1.15 ? 'High tyre wear: expect more stops or a harder compound.' : c.wear < 0.95 ? 'Low tyre wear: a one-stop is usually on.' : 'Medium tyre wear.') + ' Pit stop costs about ' + c.pit + ' s.';
  var st = typeof thStats === 'function' ? thStats(ci, leagueOf(S)) : null, last = st && st.a.length ? st.a[st.a.length - 1] : null;
  var hist = st && st.a.length ? '<div class="tp-hist"><span><small>Last winner</small><b>' + esc(last.w ? last.w.n : '—') + '</b></span><span><small>Your best here</small><b>' + (st.best ? 'P' + st.best : '—') + '</b></span>' + (st.lap ? '<span><small>Lap record</small><b>' + fmtT(st.lap.t) + '</b></span>' : '') + '</div>' : '';
  return '<section class="tp-card"><header><div><small>Track profile</small><h3>' + esc(g && g.type ? g.type : c.name) + '</h3></div>' + (typeof circuitSVG === 'function' ? '<span class="tp-map">' + circuitSVG(ci, 92, '#ffd24a') + '</span>' : '') + '</header>' +
    (g && g.character ? '<p class="tp-char">' + esc(g.character) + '</p>' : '') +
    '<div class="tp-fcs">' + f.map(function (x) { return '<div class="tp-fc"><small>' + x[0] + '</small><b>' + x[1] + '</b>' + trackLevel(x[2]) + '</div>'; }).join('') + '</div>' +
    '<p class="tp-tip"><b>PLAN</b>' + esc(g && g.strategy ? g.strategy : tip) + (g && g.strategy ? ' ' + esc(tip) : '') + '</p>' + hist + '</section>';
}
(function () {
  if (typeof vStrat !== 'function') return;
  var s0 = vStrat;
  vStrat = function () {
    var h = s0.apply(this, arguments), wk = UI.wk; if (!wk || !wk.R) return h;
    var box = trackProfileHTML(wk.R.ci), m = '<div class="qv-main">', k = h.indexOf(m); if (k < 0) return h;
    var at = k + m.length, pen = h.indexOf('<section class="pu-pens"', at); if (pen === at) at = h.indexOf('</section>', pen) + 10;
    return h.slice(0, at) + box + h.slice(at);
  };
})();
