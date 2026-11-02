'use strict';
/* ===== Mini game, akhir musim, persaraan, boot ===== */

/* --- 1. Permulaan: lampu padam --- */
function startGame(cb) {
  var st = { phase: 'wait', lights: 0, t0: 0, timers: [], done: false };
  function clear() { st.timers.forEach(clearTimeout); st.timers = []; }
  function finish(react, jump) {
    if (st.done) return; st.done = true; clear(); UI.mkey = null;
    var q = jump ? 0 : clamp((0.30 - react) / 0.14, 0, 1);
    var msg = jump ? '<h2 class="bad">Jump start!</h2><p>+5 seconds added to your final time.</p>' : '<div class="big">' + Math.round(react * 1000) + ' ms</div><p style="text-align:center" class="' + (react < 0.2 ? 'pur' : react < 0.26 ? 'good' : 'warn') + '">' + (react < 0.2 ? 'Incredible reaction!' : react < 0.26 ? 'Good start.' : react < 0.33 ? 'Average start.' : 'Slow off the line.') + '</p>';
    showModal(msg + '<button class="btn pri wide" data-act="mg-ok">Continue</button>');
    A['mg-ok'] = function () { closeModal(); cb(jump ? 0.5 : react, jump, q); };
  }
  function press() {
    if (st.phase === 'wait') { finish(0.5, true); }
    else if (st.phase === 'go') { finish((performance.now() - st.t0) / 1000, false); }
  }
  function draw() {
    var l = ''; for (var i = 0; i < 5; i++) l += '<i class="' + (i < st.lights ? 'on' : '') + '"></i>';
    showModal('<h2>Race start</h2><p class="dim">Tap the moment all five lights go out. Go early and it\'s a jump start.</p><div class="lights">' + l + '</div><button class="btn pri hit" data-tap="mg-hit">TAP</button><button class="btn sm" data-act="mg-auto">Auto</button>');
  }
  A['mg-hit'] = press;
  A['mg-auto'] = function () { finish(clamp(0.235 + gauss() * 0.035 - (me().race - 70) / 2500, 0.17, 0.4), false); };
  UI.mkey = press;
  draw();
  var i = 0;
  (function next() {
    st.timers.push(setTimeout(function () {
      st.lights = ++i; draw();
      if (i < 5) next();
      else st.timers.push(setTimeout(function () { st.lights = 0; st.phase = 'go'; st.t0 = performance.now(); draw(); }, 600 + rnd() * 2000));
    }, 750));
  })();
}

/* --- 2. Kelayakan: kunci tiga sektor --- */
function qualiGame(cb) {
  var st = { sec: 0, es: [], zone: 0, raf: 0, t0: 0, speed: 1.15, locked: false };
  function newZone() { st.zone = 0.28 + rnd() * 0.44; st.t0 = performance.now(); st.speed = 1.15 + st.sec * 0.35; }
  function pos() { var ph = ((performance.now() - st.t0) / 1000 * st.speed) % 2; return ph < 1 ? ph : 2 - ph; }
  function secHtml() {
    var h = '';
    for (var i = 0; i < 3; i++) {
      var e = st.es[i], cls = e == null ? '' : e < 0.2 ? 'pur' : e < 0.5 ? 'good' : 'warn';
      h += '<div class="sec ' + cls + '">S' + (i + 1) + '<br>' + (e == null ? '–' : e < 0.2 ? 'Perfect' : e < 0.5 ? 'Good' : 'Slow') + '</div>';
    }
    return h;
  }
  function draw() {
    showModal('<h2>Hot lap · Sector ' + (st.sec + 1) + '</h2><p class="dim">Tap (or press Space) when the marker is in the middle of the green zone.</p><div class="track" id="trk" data-tap="mg-lock"><div class="zone" style="left:' + ((st.zone - 0.07) * 100) + '%;width:14%"></div><div class="mk" id="mk"></div></div><div class="sectors">' + secHtml() + '</div><button class="btn pri hit" data-tap="mg-lock" style="min-height:70px">LOCK</button><button class="btn sm" data-act="mg-auto">Auto</button>');
    loop();
  }
  function loop() { cancelAnimationFrame(st.raf); var f = function () { var m = document.getElementById('mk'); if (!m) return; m.style.left = (pos() * 100) + '%'; st.raf = requestAnimationFrame(f); }; st.raf = requestAnimationFrame(f); }
  function lock() {
    if (st.locked) return;
    var e = clamp(Math.abs(pos() - st.zone) / 0.35, 0, 1);
    st.es.push(e); st.sec++;
    if (st.sec < 3) { newZone(); draw(); } else done(st.es.reduce(function (a, b) { return a + b; }, 0) / 3);
  }
  function done(avg) {
    st.locked = true; cancelAnimationFrame(st.raf); UI.mkey = null;
    var mod = -0.35 + 1.0 * avg;
    showModal('<h2>Lap complete</h2><div class="sectors">' + secHtml() + '</div><p class="dim" style="text-align:center">' + (mod < 0 ? 'Lap faster than usual: ' : 'Lap slower than usual: ') + '<b class="mono ' + (mod < 0 ? 'pur' : 'warn') + '">' + (mod < 0 ? '−' : '+') + Math.abs(mod).toFixed(2) + 's</b></p><button class="btn pri wide" data-act="mg-ok">View grid</button>');
    A['mg-ok'] = function () { closeModal(); cb(mod, 1 - avg); };
  }
  A['mg-lock'] = lock;
  A['mg-auto'] = function () { st.locked = true; cancelAnimationFrame(st.raf); UI.mkey = null; closeModal(); var avg = clamp(0.35 + gauss() * 0.12 - (me().pace - 70) / 400, 0, 1); cb(-0.35 + 1.0 * avg, 0.5); };
  UI.mkey = lock; newZone(); draw();
}

/* --- 3. Pit stop: klik nat roda mengikut urutan --- */
function pitGame(cb) {
  var names = ['Front left', 'Front right', 'Rear left', 'Rear right'], short = ['DK', 'DB', 'BK', 'BB'];
  var st = { order: shuffle([0, 1, 2, 3]), i: 0, err: 0, t0: 0, started: false, timer: 0 };
  function wheels() {
    var h = '<div class="wheels">';
    for (var k = 0; k < 4; k++) {
      var idx = st.order.indexOf(k), cls = !st.started ? '' : idx < st.i ? 'done' : idx === st.i ? 'lit' : '';
      h += '<button class="wheel ' + cls + '" data-tap="mg-w" data-k="' + k + '" aria-label="' + names[k] + '">' + short[k] + '</button>';
    }
    return h + '</div>';
  }
  function draw(extra) {
    showModal('<h2>Pit stop</h2><p class="dim">' + (st.started ? 'Tap the lit wheel as fast as you can.' : 'Crew is ready. Tap Start, then tap each wheel as it lights up.') + '</p>' + wheels() + (st.started ? '' : '<button class="btn pri wide" data-act="mg-begin">Start</button>') + '<button class="btn sm" data-act="mg-auto">Auto</button>' + (extra || ''));
  }
  A['mg-begin'] = function () { st.started = true; st.i = -1; draw(); st.timer = setTimeout(function () { st.i = 0; st.t0 = performance.now(); draw(); }, 400 + rnd() * 500); };
  A['mg-w'] = function (d, b) {
    if (!st.started || st.i < 0) return;
    if (+d.k === st.order[st.i]) {
      st.i++;
      if (st.i >= 4) {
        var t = (performance.now() - st.t0) / 1000, stop = clamp(1.9 + Math.max(0, t - 1.6) * 0.9 + st.err * 0.4, 1.9, 7);
        var q = clamp(1 - (stop - 1.9) / 2.2, 0, 1);
        showModal('<h2>Pit stop done</h2><div class="big">' + stop.toFixed(1) + ' s</div><p style="text-align:center" class="' + (stop < 2.4 ? 'pur' : stop < 3.2 ? 'good' : 'warn') + '">' + (stop < 2.4 ? 'World-class pit stop!' : stop < 3.2 ? 'Good stop.' : 'A touch slow.') + '</p><button class="btn pri wide" data-act="mg-ok">Leave the pit lane</button>');
        A['mg-ok'] = function () { closeModal(); cb(stop, q); };
      } else draw();
    } else { st.err++; draw(); var w = $modal.querySelector('.wheels'); if (w) w.classList.add('shake'); }
  };
  A['mg-auto'] = function () { clearTimeout(st.timer); closeModal(); cb(crewTime({ t: myTeam() }), null); };
  draw();
}

/* --- akhir musim --- */
A['season-end'] = function () { if (!S.lastSummary) { endSeason(S); save(); } UI.screen = 'season'; render(); };
function vSeason() {
  var sm = S.lastSummary, r = sm.rec, p = me(), h = '<div class="top"><div class="brand">Grid to <b>Glory</b></div><div class="meta"><span>Season ' + S.season + ' complete</span></div></div><div class="stack">';
  if (r.reserve) {
    h += '<div class="card stack"><h3>Reserve year complete</h3><h2>' + esc(p.name) + '</h2><p class="dim" style="margin:0">A year in the garage at ' + esc(r.team) + '. This season\'s World Champion: <b>' + esc(r.champ) + '</b> (' + esc(r.champTeam) + ').</p><div class="good mono" style="font-size:13px">' +
      Object.keys(r.gain || {}).map(function (k) { return SITF[k] + ' +' + r.gain[k]; }).concat(['XP +40']).join(' · ') + '</div><p class="pf-note">Your reputation has recovered and ' + esc(r.team) + ' know you well now. Teams are ready to talk again.</p></div>';
  } else
  h += '<div class="card stack"><h3>Final standings</h3><div class="row sp"><div class="lapno" style="font-size:64px">P' + r.pos + '</div><div class="mono dim" style="text-align:right">' + r.pts + ' pts<br>' + r.wins + ' wins · ' + r.pods + (r.pods === 1 ? ' podium' : ' podiums') + '</div></div>' +
    '<p>' + (r.pos === 1 ? '<b class="pur">World Champion! Congratulations.</b>' : 'This season\'s World Champion: <b>' + esc(r.champ) + '</b> (' + esc(r.champTeam) + ').') + '</p></div>';
  h += '<div class="cols two"><div class="card"><h3 style="margin-bottom:8px">Drivers · top 6</h3><table class="t"><tbody>';
  sm.ds.slice(0, 6).forEach(function (id, i) { var d = S.drivers[id]; h += '<tr><td class="mono dim" style="width:28px">' + (i + 1) + '</td><td>' + tagD(d) + ' ' + esc(d.name) + '</td><td class="r mono">' + d.pts + '</td></tr>'; });
  h += '</tbody></table></div><div class="card"><h3 style="margin-bottom:8px">Constructors · top 5</h3><table class="t"><tbody>';
  sm.ts.slice(0, 5).forEach(function (id, i) { var t = S.teams[id]; h += '<tr><td class="mono dim" style="width:28px">' + (i + 1) + '</td><td>' + tagT(t) + ' ' + t.name + '</td><td class="r mono">' + t.pts + '</td></tr>'; });
  h += '</tbody></table></div></div>';
  if (sm.obj) {
    var okk = sm.obj.res === 'met';
    h += '<div class="card stack"><h3>Contract review</h3><div class="objres ' + (okk ? 'ok' : 'bad') + '"><b>' + (okk ? 'Objective met' : 'Objective missed') + '</b><span>' + esc(sm.obj.txt) + ' · you finished P' + sm.obj.pos + '.</span></div>' +
      (sm.opt ? '<p class="pf-note' + (sm.opt.x ? '' : ' warn') + '">' + (sm.opt.x ? 'Your team took up its option: you are signed for one more season, now on ' + payTxt(sm.opt.pay) + '.' : 'Your team did not take up its option for an extra year.') + '</p>' : '') +
      (sm.warn ? '<p class="pf-note warn">The team is not happy: this is a repeat. Another miss and your seat is on the line.</p>' : '') +
      (S.fired ? '<div class="firedb"><b>' + (S.fired.term ? 'Your contract has been terminated' : 'The team will not renew your contract') + '</b><span>' + (S.fired.why === 'budget' ? 'Budget cuts: the team can no longer carry your salary. It is not personal.' : 'Targets were missed too often. The team is moving on.') + '</span></div>' : '') + '</div>';
  }
  if (sm.spon && sm.spon.length) h += '<div class="card stack"><h3>Sponsors</h3>' + sm.spon.map(function (x) { return '<div class="objres ' + (x.ok ? 'ok' : 'bad') + '"><b>' + esc(x.n) + ': ' + (x.ok ? 'happy with your season' : 'unhappy with your season') + '</b><span>' + (x.ended ? (x.why === 'unhappy' ? 'They are walking away.' : 'The deal has run its course.') : 'The deal continues.') + '</span></div>'; }).join('') + '</div>';
  if (typeof facTestHTML === 'function') h += facTestHTML(sm.test);
  if (S.offers && typeof repCardHTML === 'function') h += repCardHTML(S);
  if (p.age >= 42 && !S.sit) {
    h += '<div class="card stack"><h3>The end of the road</h3><p class="dim" style="margin:0">At ' + p.age + ' the reflexes are not what they were and no team will sign you for another year. It is time to hang up the helmet.</p><button class="btn pri wide" data-act="retire">Retire from racing</button></div>';
  } else if (S.offers) {
    h += '<div class="card stack"><h3>' + (S.fired ? 'Looking for a seat' : 'Contract offers') + '</h3><p class="dim">' + (S.fired ? 'Time to find a new team. Stronger teams only make an offer if your results and skills are good enough.' : 'Your contract is up. Pick a team for next season. Stronger teams only make an offer if your results and skills are good enough.') + '</p><div class="pick">';
    S.offers.forEach(function (o) {
      var t = S.teams[o.team];
      h += typeof offerCardHTML === 'function' ? offerCardHTML(o) : '<button class="opt" data-act="sign" data-t="' + o.team + '" data-y="' + o.years + '" data-p="' + o.pay + '" data-w="' + (o.wb || 0) + '" data-o="' + (o.opt ? 1 : 0) + '" data-b="' + (o.buy ? o.buy.id : -1) + '" data-sit="' + (o.sit ? 1 : 0) + '"><div class="t"><span class="tag" style="--tc:' + t.color + '">' + t.short + '</span>' + t.name + '</div><div class="s">' + (o.sit ? 'Take a year out' : o.renew ? 'Contract extension' : o.last ? 'Last chance' : 'New offer') + ' · ' + o.years + (o.years === 1 ? ' season' : ' seasons') + ' · ' + payTxt(o.pay) + '/season' + (o.wb ? ' · ' + payTxt(o.wb) + ' per win' : '') + (o.opt ? ' · +1 team option' : '') + ' · car rank #' + teamRank(S, o.team) + (o.sit ? '<br><em class="buy" style="color:inherit;opacity:.8">Test and reserve driver. A stand-in races your seat. You train, your name recovers, and new offers come next winter.</em>' : '') + (o.buy ? '<br><em class="buy">No free seat: they would buy out ' + esc(o.buy.n) + ' (' + o.buy.o + ' OVR) for ' + payTxt(o.buy.cost) + '.</em>' : '') + '</div></button>';
    });
    h += '</div></div>';
  } else h += '<button class="btn pri wide" data-act="next-season">Start season ' + (S.season + 1) + '</button>';
  if (p.age >= 38 && p.age < 42) h += '<button class="btn wide" data-act="retire">Retire from racing</button>';
  return h + '</div>';
}
A['sign'] = function (d) { var sit = +d.sit === 1; startNewSeason(S, +d.t, +d.y, d.b != null ? +d.b : null, sit ? { sit: true } : null); var c = sit ? null : me().con; if (d.p != null && c) { c.pay = +d.p; c.wb = +d.w || 0; c.opt = +d.o ? { by: 'team', used: false } : null; } save(); UI.screen = 'hub'; UI.tab = 'musim'; render(); };
A['next-season'] = function () { startNewSeason(S, null, null); save(); UI.screen = 'hub'; UI.tab = 'musim'; render(); };
function vRetire() {
  var c = S.career, p = me(), h = '<div class="top"><div class="brand">Grid to <b>Glory</b></div></div><div class="stack"><div class="card stack"><h3>Retirement</h3><h2>' + esc(p.name) + '</h2><p class="dim">Age ' + p.age + ' · ' + S.hist.length + ' complete seasons</p><div class="grid3">';
  [['Races', c.starts], ['Wins', c.wins], ['Podium', c.pods], ['Pole', c.poles], ['Points', c.pts], ['World titles', c.titles]].forEach(function (x) { h += '<div class="card" style="background:var(--panel2)"><div class="dim" style="font-size:12px">' + x[0] + '</div><div class="num" style="font-size:24px;font-weight:600">' + x[1] + '</div></div>'; });
  h += '</div></div><div class="row"><button class="btn pri" data-act="wipe-go">New career</button><button class="btn" data-act="tab" data-v="kerjaya" ' + '>Back</button></div></div>';
  return h;
}
A['tab'] = function (d) { UI.tab = d.v; UI.wipe = false; if (UI.screen !== 'hub') UI.screen = 'hub'; render(); };

/* --- boot --- */
/* render awal dipindah ke hujung skrip (home8.js) */
