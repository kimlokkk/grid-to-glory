'use strict';
/* ===== Fasa 14: kontrak profesional (kad tawaran, helaian kontrak, majlis menandatangani) dan gaya sidang akhbar ===== */

function offerAttrs(o) {
  return 'data-t="' + o.team + '" data-y="' + o.years + '" data-p="' + o.pay + '" data-w="' + (o.wb || 0) + '" data-o="' + (o.opt ? 1 : 0) + '" data-b="' + (o.buy ? o.buy.id : -1) + '" data-sit="' + (o.sit ? 1 : 0) + '" data-r="' + (o.renew ? 1 : 0) + '"';
}
function offerKind(o) { return o.sit ? 'Reserve year' : o.renew ? 'Contract extension' : o.last ? 'Final offer' : 'Contract offer'; }
function offerCardHTML(o) {
  var t = S.teams[o.team], rk = teamRank(S, o.team), tg = t.dev && t.dev.target;
  return '<div class="offer" style="--tc:' + t.color + '"><div class="of-h"><div class="of-id"><span class="of-k">' + offerKind(o) + '</span><b>' + esc(t.name) + '</b><small>Car rank #' + rk + (tg ? ' · board target P' + tg : '') + '</small></div><div class="of-car">' + carSVG(t, 120) + '</div></div>' +
    '<div class="of-g"><div><small>Term</small><b>' + o.years + (o.years === 1 ? ' season' : ' seasons') + '</b></div><div><small>Salary</small><b>' + payTxt(o.pay) + '</b><em>per season</em></div>' +
    '<div><small>Win bonus</small><b>' + (o.wb ? payTxt(o.wb) : '–') + '</b>' + (o.wb ? '<em>per win</em>' : '') + '</div><div><small>Team option</small><b>' + (o.opt ? '+1 season' : 'None') + '</b></div></div>' +
    (o.sit ? '<p class="of-n">Test and reserve driver. A stand-in races your seat. You train, your name recovers, and new offers come next winter.</p>' : '') +
    (o.buy ? '<p class="of-n warn">No free seat: they would buy out ' + esc(o.buy.n) + ' (' + o.buy.o + ' OVR) for ' + payTxt(o.buy.cost) + '.</p>' : '') +
    '<button class="btn pri wide" data-act="sign-pre" ' + offerAttrs(o) + '>Review contract</button></div>';
}
A['sign-pre'] = function (d) {
  var t = S.teams[+d.t], p = me(), yrs = +d.y, pay = +d.p, wb = +d.w, sit = +d.sit === 1, ren = +d.r === 1, today = 'Season ' + (S.season + 1);
  var attrs = 'data-t="' + d.t + '" data-y="' + d.y + '" data-p="' + d.p + '" data-w="' + d.w + '" data-o="' + d.o + '" data-b="' + d.b + '" data-sit="' + d.sit + '" data-r="' + d.r + '"';
  showModal('<div class="contract" style="--tc:' + t.color + '"><div class="ct-top"><span>' + esc(t.name).toUpperCase() + '</span><small>DRIVER CONTRACT</small></div>' +
    '<p class="ct-p">This agreement is made between <b>' + esc(t.name) + '</b> (the Team) and <b>' + esc(p.name) + '</b> (the Driver) for the ' + today + ' championship' + (yrs > 1 ? ' and the ' + (yrs - 1) + ' following ' + (yrs - 1 === 1 ? 'season' : 'seasons') : '') + '.</p>' +
    '<table class="ct-t"><tbody><tr><td>Type</td><td>' + (sit ? 'Test and reserve driver' : ren ? 'Contract extension' : 'Race driver') + '</td></tr><tr><td>Term</td><td>' + yrs + (yrs === 1 ? ' season' : ' seasons') + '</td></tr><tr><td>Base salary</td><td>' + payTxt(pay) + ' per season</td></tr>' +
    '<tr><td>Win bonus</td><td>' + (wb ? payTxt(wb) + ' per win' : 'None') + '</td></tr><tr><td>Team option</td><td>' + (+d.o ? 'One extra season at the Team\'s discretion' : 'None') + '</td></tr>' +
    (t.dev && t.dev.target ? '<tr><td>Board target</td><td>P' + t.dev.target + ' in the constructors\' championship</td></tr>' : '') + '</tbody></table>' +
    '<div class="ct-sig"><div><svg viewBox="0 0 200 50" class="ct-pen"><path d="M8 38 C 28 4, 38 62, 58 26 S 98 6, 118 34 S 160 52, 192 18"/></svg><span>' + esc(p.name) + ' · Driver</span></div><div><i>' + esc(t.name) + '</i><span>Team Principal</span></div></div>' +
    '<div class="row" style="flex-wrap:nowrap"><button class="btn" data-act="mclose">Back</button><button class="btn pri" style="flex:1" data-act="sign" ' + attrs + '>Sign contract</button></div></div>');
};

/* majlis menandatangani selepas kontrak disahkan */
var sign0 = A['sign'];
A['sign'] = function (d) {
  var t = S.teams[+d.t], sit = +d.sit === 1, ren = +d.r === 1, prev = me().team, name = me().name, yrs = +d.y, pay = +d.p;
  sign0(d);
  try {
    if (sit) return;
    var mv = !ren && +d.t !== prev;
    var conf = ''; for (var i = 0; i < 26; i++) conf += '<i style="left:' + Math.round(Math.random() * 100) + '%;animation-delay:' + (Math.random() * 1.2).toFixed(2) + 's;background:' + (i % 3 ? t.color : '#f0b429') + '"></i>';
    showModal('<div class="ceremony" style="--tc:' + t.color + '"><div class="cm-conf">' + conf + '</div><div class="cm-bar"><span class="cm-live"><i></i>BREAKING NEWS</span><span>PADDOCK WIRE</span></div>' +
      '<div class="cm-hero"><div class="cm-car">' + carSVG(t, 210, true) + '</div></div><div class="cm-body"><span class="cm-hs">🤝</span><h2>' + esc(name) + (mv ? ' signs for ' : ren ? ' extends with ' : ' commits to ') + esc(t.name) + '</h2>' +
      '<p>' + (mv ? 'The move is official. ' : '') + yrs + (yrs === 1 ? '-year' : '-year') + ' deal worth ' + payTxt(pay) + ' per season' + (mv ? '. A new chapter begins.' : '. Continuity for the new season.') + '</p></div>' +
      '<div class="cm-tick"><div><p>' + esc(name).toUpperCase() + ' · ' + esc(t.name).toUpperCase() + ' · SEASON ' + S.season + '<i>◆</i>DEAL DONE<i>◆</i>' + esc(name).toUpperCase() + ' · ' + esc(t.name).toUpperCase() + ' · SEASON ' + S.season + '<i>◆</i>DEAL DONE</p></div></div>' +
      '<button class="btn pri wide" data-act="cm-ok">Let\'s go</button></div>');
  } catch (e) { }
};
A['cm-ok'] = function () { closeModal(); render(); };

/* ---------- gaya sidang akhbar ---------- */
(function () {
  var hp = preHTML, pp = pressHTML;
  preHTML = function (pr) {
    var Q = PRE[pr.kind], h = '<div class="pcf"><div class="pcf-bar"><span class="pcf-live"><i></i>LIVE</span><b>Pre-season press conference</b><small>Season ' + pr.s + '</small></div><div class="pcf-q"><span class="pcf-mic">🎙</span><p>' + Q.q(pr.ctx) + '</p></div>';
    if (pr.done == null) h += '<div class="pcf-o">' + Q.o.map(function (o, i) { return '<button class="pcf-b ' + o.hint.toLowerCase() + '" data-act="pre-a" data-i="' + i + '"><span class="pcf-t">' + o.hint + '</span><span class="pcf-x">' + o.t + '</span></button>'; }).join('') + '</div>';
    else { var c = Q.o[pr.done]; h += '<div class="pcf-a"><span class="pcf-t ' + c.hint.toLowerCase() + '">' + c.hint + '</span><q>' + c.t.replace(/[“”]/g, '') + '</q><p>' + c.r + '</p><div class="chips">' + [['Morale', c.mor], ['Fame', c.fame], ['Team', c.rel]].map(function (x) { return '<span class="' + (x[1] > 0 ? 'up' : x[1] < 0 ? 'dn' : '') + '">' + x[0] + ' ' + (x[1] > 0 ? '+' : '') + x[1] + '</span>'; }).join('') + '</div></div><button class="btn pri wide" data-act="pre-ok">On to the season</button>'; }
    return h + '</div>';
  };
  pressHTML = function (pr) {
    if (!pr) return '';
    var Q = PRESS[pr.kind], h = '<div class="card pcf"><div class="pcf-bar"><span class="pcf-live"><i></i>LIVE</span><b>Press conference</b><small>' + (pr.home ? 'Home race · double fame' : 'Post-race') + '</small></div><div class="pcf-q"><span class="pcf-mic">🎙</span><p>' + Q.q + '</p></div>';
    if (pr.done == null) h += '<div class="pcf-o">' + Q.o.map(function (o, i) { return '<button class="pcf-b ' + o.hint.toLowerCase() + '" data-act="press" data-i="' + i + '"><span class="pcf-t">' + o.hint + '</span><span class="pcf-x">' + o.t + '</span></button>'; }).join('') + '</div>';
    else { var c = Q.o[pr.done], m = pr.home ? 2 : 1; h += '<div class="pcf-a"><span class="pcf-t ' + c.hint.toLowerCase() + '">' + c.hint + '</span><q>' + c.t.replace(/[“”]/g, '') + '</q><p>' + c.r + '</p><div class="chips">' + [['Morale', c.mor], ['Fame', c.fame * m], ['Team', c.rel]].map(function (x) { return '<span class="' + (x[1] > 0 ? 'up' : x[1] < 0 ? 'dn' : '') + '">' + x[0] + ' ' + (x[1] > 0 ? '+' : '') + x[1] + '</span>'; }).join('') + '</div></div>'; }
    return h + '</div>';
  };
})();
