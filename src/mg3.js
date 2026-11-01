'use strict';
/* ===== Mini game v3: penilaian adil =====
   Prinsip (rujukan reka bentuk game ritma/timing):
   1. Nilai ikut masa SENTUHAN (cap masa event), tolak kependaman skrin+sentuh (~60 ms), supaya apa yang kau NAMPAK ialah apa yang dinilai.
   2. Gred jelas dengan tingkap tetap: SEMPURNA / BAGUS / HAMPIR / TERLEPAS, plus arah (awal atau lewat).
   3. Penanda berhenti di tempat kau tekan dan zon kekal ditunjuk, jadi kau nampak sendiri kenapa dapat gred tu.
   4. Hanya butang besar yang terima input. Input diabaikan 250 ms pertama selepas game muncul. Satu input = satu penilaian. */
var MGT = { lat: 60, arm: 250 };
var GRD = { P: { n: 'PERFECT', q: 1, c: 'pur' }, B: { n: 'GOOD', q: 0.8, c: 'good' }, O: { n: 'CLOSE', q: 0.5, c: 'warn' }, M: { n: 'MISS', q: 0.15, c: 'bad' } };
function tEv(e) { return e && e.timeStamp ? e.timeStamp : performance.now(); }
function armed() { return !UI.mgArm || performance.now() >= UI.mgArm; }
function arm() { UI.mgArm = performance.now() + MGT.arm; }
function trackH(id, zones, extra) {
  return '<div class="track trk3" id="' + id + '">' + zones + '<div class="mk" id="' + id + 'm"></div>' + (extra || '') + '</div>';
}
function zoneH(a, b, cls) { return '<div class="' + cls + '" style="left:' + (a * 100) + '%;width:' + ((b - a) * 100) + '%"></div>'; }
function hitMark(id, x, label) {
  var t = document.getElementById(id); if (!t) return;
  var d = document.createElement('div'); d.className = 'hit3'; d.style.left = (clamp(x, 0, 1) * 100) + '%'; if (label) d.setAttribute('data-l', label); t.appendChild(d);
}
function verdict(g, sub) {
  var v = document.getElementById('vd3'); if (!v) return;
  v.innerHTML = '<b class="' + GRD[g].c + '">' + GRD[g].n + '</b>' + (sub ? '<span>' + sub + '</span>' : '');
}
function gradeEdge(err, w) { var a = Math.abs(err); return a <= w ? 'P' : a <= w * 2 ? 'B' : a <= w * 3 ? 'O' : 'M'; }

/* 1. Timing ulang-alik (hairpin, cabaran) */
function timingGame(title, hint, zoneW, sp, cb) {
  /* tingkap masa tetap (ms), lebar zon dikira dari laju penanda: apa yang kau nampak = tingkap sebenar */
  var sk = clamp(zoneW / 0.12, 0.8, 1.25), wP = 0.042 * sk, wB = 0.088 * sk, wO = 0.13 * sk, zw = 2 * wB * sp, sw = 2 * wP * sp, c = 0.22 + rnd() * 0.56, t0 = 0, raf = 0, done = false;
  function pos(t) { var ph = ((t - t0) / 1000 * sp) % 2; return ph < 1 ? ph : 2 - ph; }
  function dir(t) { var ph = ((t - t0) / 1000 * sp) % 2; return ph < 1 ? 1 : -1; }
  showModal('<h2>' + esc(title) + '</h2><p class="dim">' + hint + '</p>' + trackH('tg3', zoneH(c - zw / 2, c + zw / 2, 'zone') + zoneH(c - sw / 2, c + sw / 2, 'sweet')) +
    '<div class="vd3" id="vd3"><span>Dark green in the middle = PERFECT</span></div><button class="btn pri hit" data-tap="mg-tg" style="min-height:80px">BRAKE!</button>');
  function lp(now) { if (done) return; var m = document.getElementById('tg3m'); if (m) m.style.left = (pos(now) * 100) + '%'; raf = requestAnimationFrame(lp); }
  function press(e) {
    if (done || !armed()) return; done = true; cancelAnimationFrame(raf); UI.mkey = null;
    var t = tEv(e) - MGT.lat, x = pos(t), err = x - c, a = Math.abs(err), ms = a / sp, g = ms <= wP ? 'P' : ms <= wB ? 'B' : ms <= wO ? 'O' : 'M';
    var early = (err * dir(t)) < 0;
    var m = document.getElementById('tg3m'); if (m) m.style.left = (x * 100) + '%';
    hitMark('tg3', x); verdict(g, g === 'P' ? 'Dead centre' : (early ? 'Early ' : 'Late ') + Math.round(a / sp * 1000) + ' ms');
    setTimeout(function () { closeModal(); cb(GRD[g].q); }, 1000);
  }
  A['mg-tg'] = function (d, b, e) { press(e); }; UI.mkey = press; arm(); t0 = performance.now(); raf = requestAnimationFrame(lp);
}

/* 2. Brek lewat / tutup garisan: penanda ke kanan makin laju. Bahagian hujung zon = SEMPURNA */
function brakeGame(title, hint, skill, cb) {
  var zw = clamp(0.14 + (skill - 60) / 350, 0.12, 0.24), z1 = 0.86 - rnd() * 0.06, z0 = z1 - zw, s0 = z1 - zw * 0.45, t0 = 0, dur = 1700 + rnd() * 400, raf = 0, done = false, def = title.indexOf('Defend') === 0;
  function pos(t) { var u = (t - t0) / dur; return Math.max(0, u * u * 0.6 + u * 0.4); }
  showModal('<h2>' + esc(title) + '</h2><p class="dim">' + hint + '</p>' + trackH('bk3', zoneH(z0, z1, 'zone') + zoneH(s0, z1, 'sweet') + zoneH(z1, 1, 'red3')) +
    '<div class="vd3" id="vd3"><span>End of the green zone (dark) = PERFECT. Red = overshot.</span></div><button class="btn pri hit" data-tap="mg-brk" style="min-height:80px">' + (def ? 'COVER!' : 'BRAKE!') + '</button>');
  function fin(x, g, sub, q) {
    done = true; cancelAnimationFrame(raf); UI.mkey = null;
    var m = document.getElementById('bk3m'); if (m) m.style.left = (clamp(x, 0, 1) * 100) + '%';
    hitMark('bk3', x); verdict(g, sub);
    setTimeout(function () { closeModal(); cb(q == null ? GRD[g].q : q); }, 1000);
  }
  function press(e) {
    if (done || !armed()) return;
    var x = pos(tEv(e) - MGT.lat);
    if (x > z1) fin(x, 'M', 'Overshot into the red zone', 0.05);
    else if (x >= s0) fin(x, 'P', 'Latest possible braking point');
    else if (x >= z0) fin(x, 'B', 'In the zone, but you could brake later');
    else if (x >= z0 - 0.045) fin(x, 'O', 'Slightly early, just before the zone');
    else fin(x, 'M', 'Way too early', 0.2);
  }
  function lp(now) { if (done) return; var x = pos(now), m = document.getElementById('bk3m'); if (m) m.style.left = (Math.min(1, x) * 100) + '%'; if (x >= 1.02) { fin(1, 'M', 'Didn\'t brake at all!', 0.05); return; } raf = requestAnimationFrame(lp); }
  A['mg-brk'] = function (d, b, e) { press(e); }; UI.mkey = press; arm(); t0 = performance.now(); raf = requestAnimationFrame(lp);
}

/* 3. Garisan apex: tahan masuk jalur kuning, lepas bila keluar. Dua tepi dinilai berasingan */
function apexGame(title, hint, skill, cb) {
  var b0 = 0.24 + rnd() * 0.18, bw = 0.3 + rnd() * 0.12, b1 = b0 + bw, w = clamp(0.022 + (skill - 60) / 1200, 0.018, 0.035), dur = 2300 + rnd() * 500;
  var t0 = 0, raf = 0, done = false, xIn = null, xOut = null;
  function pos(t) { return (t - t0) / dur; }
  showModal('<h2>' + esc(title) + '</h2><p class="dim">' + hint + '</p>' + trackH('ap3', zoneH(b0, b1, 'band3')) +
    '<div class="vd3" id="vd3"><span>Hold when the marker reaches the left edge of the band, release at the right edge.</span></div>' + holdBtn('apb', 'HOLD IN THE CORNER'));
  function dn(e) { if (done || xIn != null || !armed()) return; xIn = pos(tEv(e) - MGT.lat); hitMark('ap3', xIn, 'in'); }
  function up(e) { if (done || xIn == null || xOut != null) return; xOut = pos(tEv(e) - MGT.lat); hitMark('ap3', xOut, 'out'); fin(); }
  function fin() {
    if (done) return; done = true; cancelAnimationFrame(raf); unbindHold();
    var gi = xIn == null ? 'M' : gradeEdge(xIn - b0, w), go = xOut == null ? 'M' : gradeEdge(xOut - b1, w), q = (GRD[gi].q + GRD[go].q) / 2;
    var tot = q > 0.9 ? 'P' : q > 0.7 ? 'B' : q > 0.4 ? 'O' : 'M';
    function lab(x, ref) { if (x == null) return 'none'; var d = Math.round((x - ref) * dur); return Math.abs(d) <= w * dur ? 'spot on' : (d < 0 ? 'early ' : 'late ') + Math.abs(d) + ' ms'; }
    verdict(tot, 'In: ' + GRD[gi].n.toLowerCase() + ' (' + lab(xIn, b0) + ') · Out: ' + GRD[go].n.toLowerCase() + ' (' + lab(xOut, b1) + ')');
    setTimeout(function () { closeModal(); cb(q); }, 1300);
  }
  function lp(now) { if (done) return; var x = pos(now), m = document.getElementById('ap3m'); if (m) m.style.left = Math.min(100, x * 100) + '%'; if (x >= 1.03) { fin(); return; } raf = requestAnimationFrame(lp); }
  bindHold('apb', dn, up); arm(); t0 = performance.now(); raf = requestAnimationFrame(lp);
}

/* 4. Kelayakan: 3 sektor, gred setiap sektor */
var QMOD = { P: -0.11, B: -0.04, O: 0.06, M: 0.18 };
function qualiGame(cb) {
  var sec = 0, gs = [], c = 0, sp = 1, t0 = 0, raf = 0, busy = false, zw = 0.15, sw = 0.06, wP = 0.04, wB = 0.085, wO = 0.13;
  function pos(t) { var ph = ((t - t0) / 1000 * sp) % 2; return ph < 1 ? ph : 2 - ph; }
  function secH() { var h = ''; for (var i = 0; i < 3; i++) { var g = gs[i]; h += '<div class="sec ' + (g ? GRD[g].c : '') + '">S' + (i + 1) + '<br>' + (g ? GRD[g].n : i === sec ? '…' : '–') + '</div>'; } return h; }
  function draw() {
    c = 0.24 + rnd() * 0.52; sp = 1.15 + sec * 0.3; zw = 2 * wB * sp; sw = 2 * wP * sp;
    showModal('<h2>Hot lap · Sector ' + (sec + 1) + '/3</h2><p class="dim">Tap when the marker is in the green. Dark green in the middle = PERFECT.</p>' + trackH('q3', zoneH(c - zw / 2, c + zw / 2, 'zone') + zoneH(c - sw / 2, c + sw / 2, 'sweet')) +
      '<div class="vd3" id="vd3"><span>Sector ' + (sec + 1) + '</span></div><div class="sectors">' + secH() + '</div><button class="btn pri hit" data-tap="mg-lock" style="min-height:76px">LOCK</button><button class="btn sm" data-act="mg-auto">Auto</button>');
    busy = false; arm(); t0 = performance.now(); cancelAnimationFrame(raf); raf = requestAnimationFrame(lp);
  }
  function lp(now) { var m = document.getElementById('q3m'); if (!m || busy) return; m.style.left = (pos(now) * 100) + '%'; raf = requestAnimationFrame(lp); }
  function lock(e) {
    if (busy || !armed()) return; busy = true; cancelAnimationFrame(raf);
    var t = tEv(e) - MGT.lat, x = pos(t), a = Math.abs(x - c), ms = a / sp, g = ms <= wP ? 'P' : ms <= wB ? 'B' : ms <= wO ? 'O' : 'M';
    var m = document.getElementById('q3m'); if (m) m.style.left = (x * 100) + '%';
    hitMark('q3', x); gs.push(g); verdict(g, g === 'P' ? 'Perfect sector' : Math.round(a / sp * 1000) + ' ms off centre'); sec++;
    setTimeout(function () { if (sec < 3) draw(); else finish(); }, 850);
  }
  function finish() {
    UI.mkey = null;
    var mod = gs.reduce(function (s, g) { return s + QMOD[g]; }, 0), q = gs.reduce(function (s, g) { return s + GRD[g].q; }, 0) / 3;
    showModal('<h2>Lap complete</h2><div class="sectors">' + secH() + '</div><p class="dim" style="text-align:center">Lap time vs. normal: <b class="mono ' + (mod < 0 ? 'pur' : 'warn') + '">' + (mod < 0 ? '−' : '+') + Math.abs(mod).toFixed(2) + 's</b></p><button class="btn pri wide" data-act="mg-ok">Continue</button>');
    A['mg-ok'] = function () { closeModal(); cb(mod / 0.6, q); };
  }
  A['mg-lock'] = function (d, b, e) { lock(e); };
  A['mg-auto'] = function () { busy = true; cancelAnimationFrame(raf); UI.mkey = null; closeModal(); var avg = clamp(0.35 + gauss() * 0.12 - (me().pace - 70) / 400, 0, 1); cb(-0.35 + 1.0 * avg, 0.5); };
  UI.mkey = lock; draw();
}

/* 5. Tork nat: tahan, lepas dalam hijau. Label terus setiap roda */
function pitTorque(cb) {
  var names = ['Front left', 'Front right', 'Rear left', 'Rear right'], i = 0, v = 0, held = false, pen = 0, raf = 0, last = 0, t0 = performance.now(), done = false, z0 = 0, z1 = 0, res = [], hist = [];
  function newZone() { z0 = 0.6 + rnd() * 0.18; z1 = z0 + 0.13; v = 0; }
  function draw() {
    showModal('<h2>Pit stop: wheel gun</h2><p class="dim">Hold until the needle hits green, then release. Red = over-torqued.</p><p style="font-weight:600">Wheel ' + (i + 1) + '/4 · ' + names[i] + '</p>' +
      trackH('tq3', zoneH(z0, z1, 'zone') + zoneH(z1, 1, 'red3')) + '<div class="vd3" id="vd3">' + (hist.length ? hist[hist.length - 1] : '<span>Hold the button and watch the needle climb.</span>') + '</div>' +
      '<div class="stps">' + [0, 1, 2, 3].map(function (k) { return '<i class="stp ' + (k < i ? (res[k] ? 'ok' : 'no') : k === i ? 'cur' : '') + '"></i>'; }).join('') + '</div>' + holdBtn('tq', 'HOLD (wheel gun)'));
    bindHold('tq', function () { if (armed()) held = true; }, release); arm();
  }
  function release(e) {
    if (!held || done) return; held = false;
    var x = v - 1.1 * MGT.lat / 1000, ok = x >= z0 && x <= z1, g, msg;
    if (ok) { g = 'P'; msg = 'Spot on'; } else if (x > z1) { g = x <= z1 + 0.03 ? 'O' : 'M'; msg = 'Over-torqued'; pen += g === 'O' ? 0.25 : 0.7; } else { g = x >= z0 - 0.03 ? 'O' : 'M'; msg = 'Under-torqued, loose'; pen += g === 'O' ? 0.2 : 0.45; }
    res[i] = ok; hist.push('<b class="' + GRD[g].c + '">' + names[i] + ': ' + msg + '</b>'); i++;
    if (i >= 4) { done = true; cancelAnimationFrame(raf); unbindHold(); var t = (performance.now() - t0) / 1000, stop = clamp(1.9 + Math.max(0, t - 3.2) * 0.3 + pen, 1.9, 7); showRes(stop); return; }
    newZone(); draw();
  }
  function showRes(stop) {
    var q = clamp(1 - (stop - 1.9) / 2.2, 0, 1);
    showModal('<h2>Pit stop done</h2><div class="big">' + stop.toFixed(1) + ' s</div><div class="vd3">' + hist.join('') + '</div><button class="btn pri wide" data-act="mg-ok">Leave the pit lane</button>');
    A['mg-ok'] = function () { closeModal(); cb(stop, q); };
  }
  function lp(now) { if (done) return; var dt = last ? Math.min(0.05, (now - last) / 1000) : 0; last = now; if (held) v = Math.min(1.05, v + dt * 1.1); var m = document.getElementById('tq3m'); if (m) m.style.left = Math.min(100, v * 100) + '%'; if (v >= 1.05 && held) release(); raf = requestAnimationFrame(lp); }
  newZone(); draw(); raf = requestAnimationFrame(lp);
}

/* 6. Baca lawan v2: tunggu dia alih betul-betul. Serang: lorong yang terbuka jadi HIJAU, tekan situ. Bertahan: dia pilih sisi (merah), tekan sisi sama. */
function readGame(title, mode, skill, cb) {
  var rounds = 3, r = 0, scores = [], tm = 0, t0 = 0, side = null, live = false, fin = false, slack = clamp((skill - 60) / 400, 0, 0.08);
  function draw(pos, glow, msg) {
    var lane = function (s) { var on = glow && ((mode === 'atk' && s !== side) || (mode === 'def' && s === side)); return '<div class="lane3' + (on ? (mode === 'atk' ? ' open' : ' threat') : '') + '">' + (on ? (mode === 'atk' ? 'GAP!' : 'COVER!') : '') + '</div>'; };
    showModal('<h2>' + esc(title) + '</h2><p class="dim">' + (mode === 'atk' ? 'Wait for him to move. The open lane will turn <b class="good">GREEN</b>, tap that side.' : 'Wait for him to pick a side. His side will turn <b class="bad">RED</b>, tap that side to cover it.') + '</p>' +
      '<div class="lanes3 ' + mode + '">' + lane('L') + lane('R') + '<div class="rv3" style="left:' + pos + '%">' + carSVG(UI.mgFoe && UI.mgFoe.t ? UI.mgFoe.t : S.teams[(myTeam().id + 3) % S.teams.length], 90, true) + '</div><div class="me3">' + carSVG(myTeam(), 90, true) + '</div></div>' +
      '<div class="stps">' + [0, 1, 2].map(function (i) { return '<i class="stp ' + (i < r ? (scores[i] > 0.4 ? 'ok' : 'no') : i === r ? 'cur' : '') + '"></i>'; }).join('') + '</div><div class="vd3" id="vd3">' + (msg || '<span>Round ' + (r + 1) + '/3 · wait for it…</span>') + '</div>' +
      '<div class="row" style="flex-wrap:nowrap"><button class="btn pri hit" data-tap="rd-s" data-d="L" style="min-height:80px">◀ LEFT</button><button class="btn pri hit" data-tap="rd-s" data-d="R" style="min-height:80px">RIGHT ▶</button></div>');
  }
  function round() {
    if (r >= rounds) { fin = true; UI.mkeyLR = null; var q = scores.reduce(function (a, b) { return a + b; }, 0) / rounds; setTimeout(function () { closeModal(); cb(q); }, 200); return; }
    side = rnd() < 0.5 ? 'L' : 'R'; live = false; draw(50, false);
    var feint = r > 0 && rnd() < 0.5, d1 = 600 + rnd() * 800;
    if (feint) tm = setTimeout(function () { draw(side === 'L' ? 60 : 40, false); tm = setTimeout(go, 280 + rnd() * 220); }, d1);
    else tm = setTimeout(go, d1);
  }
  function go() { live = true; t0 = performance.now(); draw(side === 'L' ? 25 : 75, true); tm = setTimeout(function () { res(null, null); }, 1100); }
  function res(d, e) {
    if (fin) return;
    if (!live) return;                       /* tekan sebelum isyarat diabaikan, tiada denda */
    clearTimeout(tm); live = false;
    var want = mode === 'atk' ? (side === 'L' ? 'R' : 'L') : side, rt = d ? Math.max(0, (tEv(e) - t0) / 1000 - MGT.lat / 1000) : 9, g;
    if (!d) g = 'M'; else if (d !== want) g = 'M'; else g = rt <= 0.38 + slack ? 'P' : rt <= 0.58 + slack ? 'B' : 'O';
    scores.push(GRD[g].q); r++;
    draw(side === 'L' ? 25 : 75, true, '<b class="' + GRD[g].c + '">' + GRD[g].n + '</b><span>' + (!d ? 'Too slow' : d !== want ? 'Wrong side' : Math.round(rt * 1000) + ' ms') + '</span>');
    setTimeout(round, 700);
  }
  A['rd-s'] = function (dd, b, e) { res(dd.d, e); }; UI.mkeyLR = function (d) { res(d, null); };
  round();
}
