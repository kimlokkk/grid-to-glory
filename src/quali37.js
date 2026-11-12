'use strict';
/* ===== Race weekend v3, phase 1: Qualifying ("Saturday"). Presentation only: session maths, mini game and actions are unchanged. ===== */
var QV_OPTS = [['awal', 'Early', 'Beat the queue', [1, 3, 1]], ['biasa', 'Normal', 'Middle of the session', [2, 2, 2]], ['lewat', 'Late', 'Last-second flyer', [3, 1, 3]]];
function qvPips(n, bad) { return '<i class="qv-pips ' + (bad ? 'bad' : 'good') + '">' + [1, 2, 3].map(function (k) { return '<u class="' + (k <= n ? 'on' : '') + '"></u>'; }).join('') + '</i>'; }
function qvCode(d) { return (d.code || lastName(d).slice(0, 3)).toUpperCase(); }

/* ---------- session banner ---------- */
function qvBanner(wk, Q, done) {
  var c = wk.c, si = Q.s, alive = Q.alive.indexOf(S.pi) >= 0, wet = Q.wq > 0.1;
  var steps = QNAME.map(function (n, i) {
    var st = done || i < si ? 'past' : i === si ? (alive ? 'current' : 'out') : (alive ? '' : 'out');
    return '<li class="' + st + '"><b>' + n + '</b><small>' + (i === 2 ? 'Pole shootout' : (i === 0 ? S.drivers.length : QK.cut[0]) + ' cars') + '</small></li>';
  }).join('') + '<li class="' + (done ? 'current' : '') + '"><b>Grid</b><small>Lights out</small></li>';
  return '<section class="qv-banner"><div class="qv-banner-main"><div class="cv-eyebrow"><i></i>Round ' + (S.round + 1) + ' · Qualifying</div><h1>' + esc(c.name) + '</h1>' +
    '<div class="qv-chips"><span class="' + (wet ? 'wet' : 'dry') + '">' + (wet ? 'Wet track' : 'Dry track') + '</span><span>' + wk.L + ' laps</span><span>' + c.km.toFixed(1) + ' km</span></div>' +
    '<p>' + esc(wk.fc) + (wet ? ' Wet qualifying: rain skill matters.' : '') + '</p></div>' +
    '<div class="qv-banner-map" aria-hidden="true">' + (typeof circuitSVG === 'function' ? circuitSVG(wk.ci, 170, '#ffd24a') : '') + '</div>' +
    '<ol class="qv-steps" aria-label="Qualifying sessions">' + steps + '</ol></section>';
}

/* ---------- timing tower for the session just run ---------- */
function qvTower(wk, Q) {
  var si = Q.s, last = Q.res[si - 1], name = QNAME[si - 1], cut = si - 1 < 2 ? QK.cut[si - 1] : 0, pr = last.filter(function (r) { return r.di === S.pi; })[0], best = last[0].t;
  var verdict = '';
  if (pr) {
    var through = !cut || pr.pos <= cut, edge = cut && last[cut] && last[cut - 1] ? (through ? last[cut].t - pr.t : pr.t - last[cut - 1].t) : 0;
    verdict = '<div class="qv-verdict ' + (through ? 'ok' : 'out') + '"><b>P' + pr.pos + '</b><div><strong>' + (!cut ? (pr.pos === 1 ? 'Provisional pole' : 'Top-ten shootout') : through ? 'Through to ' + QNAME[si] : 'Knocked out in ' + name) + '</strong><span>' + (!cut ? (pr.pos === 1 ? 'Fastest of all' : '+' + (pr.t - best).toFixed(3) + 's off pole') : through ? edge.toFixed(3) + 's clear of the drop zone' : edge.toFixed(3) + 's short of P' + cut) + '</span></div><em>' + fmtT(pr.lap) + '</em></div>';
  }
  var show = {}, mine = pr ? pr.pos : 0;
  last.forEach(function (r) { if (UI.qvFull || r.pos <= 3 || (cut && r.pos >= cut - 1 && r.pos <= cut + 2) || (mine && Math.abs(r.pos - mine) <= 1)) show[r.pos] = 1; });
  var rows = '', prev = 0;
  last.forEach(function (r) {
    if (!show[r.pos]) return;
    var d = S.drivers[r.di], t = S.teams[d.team], isMe = r.di === S.pi, out = cut && r.pos > cut;
    if (prev && r.pos > prev + 1) rows += '<div class="qv-gap" aria-hidden="true">···</div>';
    if (cut && r.pos === cut + 1 || (cut && prev && prev <= cut && r.pos > cut + 1)) rows += '<div class="qv-cut"><span>Drop zone</span></div>';
    rows += '<div class="qv-row' + (isMe ? ' me' : '') + (out ? ' out' : '') + (r.pos === 1 ? ' p1' : '') + '" style="--tc:' + t.color + '"><span class="qv-pos">' + r.pos + '</span><i></i><span class="qv-name"><b>' + qvCode(d) + '</b><span>' + esc(lastName(d)) + '</span>' + (r.ev ? '<em>' + (r.ev === 'kuning' ? 'Yellow flag' : 'Traffic') + '</em>' : '') + '</span><span class="qv-time">' + fmtT(r.lap) + '</span><span class="qv-delta">' + (r.pos === 1 ? 'Fastest' : '+' + (r.t - best).toFixed(3)) + '</span></div>';
    prev = r.pos;
  });
  var result = verdict ? '<section class="qv-result">' + verdict + (wk.qmsg ? '<p class="qv-radio"><b>Radio</b>' + esc(wk.qmsg.replace(/^Engineer:\s*/, '')) + '</p>' : '') + '</section>' : '';
  return [result, '<section class="qv-tower"><header><div><small>Timing</small><h2>' + name + ' classification</h2></div><button class="qv-toggle" data-act="qv-full">' + (UI.qvFull ? 'Key rows' : 'All ' + last.length) + '</button></header><div class="qv-rows">' + rows + '</div></section>'];
}

/* ---------- run plan ---------- */
function qvPlan(wk, Q) {
  var si = Q.s, n = Q.alive.length, ch = wk.qch || 'biasa';
  return '<section class="card qv-plan"><div class="tg-head"><div><small>' + QNAME[si] + ' · run plan</small><h2>' + (si < 2 ? n + ' cars, ' + (n - QK.cut[si]) + ' go out' : 'Fight for pole') + '</h2></div><span class="tg-tag">' + (si < 2 ? 'Top ' + QK.cut[si] + ' advance' : n + ' cars') + '</span></div>' +
    '<div class="qv-opts" role="group" aria-label="When to go out">' + QV_OPTS.map(function (x) {
      return '<button class="qv-opt ' + (ch === x[0] ? 'on' : '') + '" data-act="q-ch" data-v="' + x[0] + '" aria-pressed="' + (ch === x[0]) + '"><b>' + x[1] + '</b><small>' + x[2] + '</small><span>Grip ' + qvPips(x[3][0], false) + '</span><span>Traffic ' + qvPips(x[3][1], true) + '</span><span>Flag risk ' + qvPips(x[3][2], true) + '</span></button>';
    }).join('') + '</div>' +
    '<div class="qv-go"><button class="btn pri qv-go-main" data-act="q-play">' + (S.settings.mini ? 'Hot lap' : 'Run ' + QNAME[si]) + '</button>' + (S.settings.mini ? '<button class="btn" data-act="q-auto">Auto</button>' : '') + '</div>' +
    '<details class="driver-help dg-help"><summary>How the run plan works</summary><p>Early: the track is still green and there is more traffic, but yellow flags are rare. Late: the fastest track, but one yellow flag and your lap is gone. Standard sits in the middle. Each session is two flying laps; the best one counts.</p></details></section>';
}

/* ---------- final grid ---------- */
function qvGrid(wk) {
  var q = wk.q, mine = q.filter(function (r) { return r.di === S.pi; })[0], pole = q[0], mate = q.filter(function (r) { return r.di !== S.pi && S.drivers[r.di].team === me().team; })[0], t = myTeam();
  var hero = '<section class="qv-start ' + (mine.pos === 1 ? 'pole' : mine.pos <= 3 ? 'front' : '') + '" style="--tc:' + t.color + '"><div><small>Starting grid</small><h1>You start <b>P' + mine.pos + '</b></h1><p>' + (mine.pos === 1 ? 'Pole position. The engineer is in tears on the pit wall.' : (mine.sess < 2 ? 'Knocked out in ' + QNAME[mine.sess] + ' · ' : '') + '+' + (mine.t - pole.t).toFixed(3) + 's off pole') + (mate ? ' · teammate P' + mate.pos : '') + '</p><button class="btn pri qv-next" data-act="q-next">Next: strategy →</button></div><div class="qv-start-car" aria-hidden="true">' + carSVG(t, 260) + '</div></section>';
  var slots = q.map(function (r) {
    var d = S.drivers[r.di], tm = S.teams[d.team], isMe = r.di === S.pi, zone = r.pos === 11 ? 'Q2 exits' : r.pos === 16 ? 'Q1 exits' : '';
    return (zone ? '<div class="qv-zone"><span>' + zone + '</span></div>' : '') + '<div class="qv-slot' + (isMe ? ' me' : '') + (r.pos % 2 ? '' : ' r') + '" style="--tc:' + tm.color + '"><span class="qv-slot-n">' + r.pos + '</span><span class="qv-slot-car" aria-hidden="true">' + carSVG(tm, 66, true) + '</span><span class="qv-slot-id"><b>' + qvCode(d) + '</b><small>' + (r.pos === 1 ? fmtT(r.lap) : '+' + (r.t - pole.t).toFixed(3)) + '</small></span></div>';
  }).join('');
  return hero + '<section class="qv-gridcard"><header><div><small>Formation</small><h2>The grid</h2></div><span class="qv-flag" aria-hidden="true"></span></header><div class="qv-grid">' + slots + '</div><button class="btn pri wide" data-act="q-next">Next: strategy →</button></section>';
}

/* ---------- readiness + objectives ---------- */
function qvFocus() {
  if (S.mode !== 'pro' || S.sit) return '';
  var m = progressionPlayer(S).mind, v = m.locked; if (!v || v.key !== trainingKey(S)) return '';
  var tone = v.focus < 40 ? 'bad' : v.focus < 60 ? 'mid' : 'good';
  return '<section class="card qv-focus ' + tone + '"><div class="qv-focus-top"><div><small>Weekend focus</small><b>' + v.focus + '<i> / 100</i></b></div><span>' + (v.focus < 40 ? 'Low readiness' : v.focus < 60 ? 'Steady' : 'Sharp') + '</span></div><i class="qv-bar"><u style="width:' + clamp(v.focus, 0, 100) + '%"></u></i>' +
    '<details class="driver-help dg-help"><summary>What is behind this number</summary><p>' + v.reasons.join(' · ') + '</p><p>' + (v.focus < 40 ? 'Low readiness: slower pace and more mistake risk. Recovery helps before your next weekend.' : 'Focus affects qualifying, race pace and mistakes. Tyre Push and Boost amplify the risk difference.') + '</p><p>Training: ' + (v.slots || []).map(function (k) { return TRAINING.focuses[k]; }).join(' + ') + ' · ' + v.spent + ' XP spent' + (v.gains && v.gains.length ? ' · ' + v.gains.join(', ') : '') + '</p></details></section>';
}

var qvOldQuali = vQuali;
vQuali = function () {
  var wk = UI.wk, Q = wk.Q || (wk.Q = qkInit(S, wk.ci, qualiWet(wk.w))), done = !!wk.q, si = Q.s, alive = Q.alive.indexOf(S.pi) >= 0;
  var main = '', side = qvFocus() + '<div class="qv-obj">' + objCard(wk) + '</div>';
  if (done) main = qvGrid(wk);
  else {
    var tw = si > 0 ? qvTower(wk, Q) : ['', ''];
    main += tw[0];
    if (si < 3 && alive) main += qvPlan(wk, Q);
    else main += '<button class="btn pri wide qv-fin" data-act="q-fin">' + (alive ? 'View the grid →' : 'Simulate the rest of qualifying →') + '</button>';
    main += tw[1];
  }
  return wkHead(true) + '<div class="qv' + (done ? ' qv-done' : '') + '">' + qvBanner(wk, Q, done) + '<div class="qv-main">' + main + '</div><div class="qv-side">' + side + '</div></div>';
};
A['qv-full'] = function () { UI.qvFull = !UI.qvFull; render(); };
