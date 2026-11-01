'use strict';
/* ===== Mini game v2: banyak jenis, dirotasi =====
   Prinsip (rujukan reka bentuk kawalan sentuh mudah alih): satu jenis sentuhan setiap game, 2-4 saat,
   kemahiran = timing/membaca, bukan tekan bertubi-tubi. Semua boleh main dengan jari atau Space/anak panah. */
var MG = { last: {} };
function mgPick(cat, list) {
  var opts = list.filter(function (k) { return k !== MG.last[cat]; });
  var k = opts[Math.floor(rnd() * opts.length)]; MG.last[cat] = k; return k;
}
function mgEnd(q, cb, good, ok, bad) {
  var cls = q > 0.8 ? 'pur' : q > 0.45 ? 'good' : q > 0.2 ? 'warn' : 'bad';
  showModal('<h2 class="' + cls + '">' + (q > 0.8 ? good : q > 0.2 ? ok : bad) + '</h2>');
  setTimeout(function () { closeModal(); cb(q); }, 650);
}
function holdBtn(id, label) { return '<button class="btn pri hit" id="' + id + '" style="min-height:84px;touch-action:none;user-select:none;-webkit-user-select:none">' + label + '</button>'; }
function bindHold(id, dn, up) {
  var b = document.getElementById(id); if (!b) return;
  b.addEventListener('pointerdown', function (e) { e.preventDefault(); try { b.setPointerCapture(e.pointerId); } catch (x) { } dn(e); });
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(function (ev) { b.addEventListener(ev, function (e) { up(e); }); });
  b.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  UI.mkeyDown = dn; UI.mkeyUp = up;
}
function unbindHold() { UI.mkeyDown = null; UI.mkeyUp = null; }

/* 1. Garisan apex (ala Tap Drift): tekan bila penanda masuk jalur kuning, lepas bila keluar */
function apexGame(title, hint, skill, cb) {
  var b0 = 0.25 + rnd() * 0.2, bw = 0.3 + rnd() * 0.12, b1 = b0 + bw, tol = clamp(0.07 + (skill - 60) / 500, 0.06, 0.12), dur = 2100 + rnd() * 500;
  var t0 = performance.now(), raf = 0, done = false, pIn = null, pOut = null, x = 0;
  showModal('<h2>' + esc(title) + '</h2><p class="dim">' + hint + '</p><div class="track"><div class="zone" style="left:' + (b0 * 100) + '%;width:' + (bw * 100) + '%;background:#f0b42940;border-color:var(--warn)"></div><div class="mk" id="mk"></div></div>' + holdBtn('apb', 'HOLD IN THE CORNER'));
  function dn() { if (pIn == null && !done) pIn = x; }
  function up() { if (pIn != null && pOut == null && !done) { pOut = x; fin(); } }
  function fin() {
    if (done) return; done = true; cancelAnimationFrame(raf); unbindHold();
    var q = pIn == null ? 0 : clamp(1 - (Math.abs(pIn - b0) + Math.abs((pOut == null ? 1 : pOut) - b1)) / (tol * 3), 0, 1);
    mgEnd(q, cb, 'Perfect line!', 'Not bad', pIn == null ? 'Missed the corner!' : 'Ran wide');
  }
  function lp(now) { if (done) return; x = (now - t0) / dur; var m = document.getElementById('mk'); if (m) m.style.left = Math.min(100, x * 100) + '%'; if (x >= 1.02) { fin(); return; } raf = requestAnimationFrame(lp); }
  bindHold('apb', dn, up); raf = requestAnimationFrame(lp);
}

/* 2. Baca lawan: kereta lawan alih ke satu sisi (kadang tipu). Serang: pilih sisi bertentangan. Bertahan: tutup sisi sama. */
function readGame(title, mode, skill, cb) {
  var rounds = 3, r = 0, score = 0, win = clamp(0.62 + (skill - 70) / 200, 0.5, 0.8), timer = 0, t0 = 0, side = null, done = false, locked = true;
  function draw(msg, pos, flash) {
    showModal('<h2>' + esc(title) + '</h2><p class="dim">' + (mode === 'atk' ? 'Watch which side he covers, then take the other one.' : 'Check your mirrors. He goes left, you cover left.') + ' (arrow keys work too)</p>' +
      '<div class="lanes" style="position:relative"><div class="lane" style="min-height:110px;cursor:default"></div><div class="lane" style="min-height:110px;cursor:default"></div><div style="position:absolute;top:30%;left:' + pos + '%;transform:translateX(-50%);width:44px;height:64px;border-radius:8px;background:' + (flash ? 'var(--warn)' : 'var(--bad)') + ';transition:left .14s"></div></div>' +
      '<div class="stps">' + [0, 1, 2].map(function (i) { return '<i class="stp ' + (i < r ? 'ok' : i === r ? 'cur' : '') + '"></i>'; }).join('') + '</div><p style="text-align:center;font-weight:600;min-height:1.4em">' + msg + '</p>' +
      '<div class="row" style="flex-wrap:nowrap"><button class="btn pri hit" data-tap="rd-s" data-d="L" style="min-height:70px">◀ LEFT</button><button class="btn pri hit" data-tap="rd-s" data-d="R" style="min-height:70px">RIGHT ▶</button></div>');
  }
  function round() {
    if (r >= rounds) { done = true; UI.mkeyLR = null; mgEnd(score / rounds, cb, mode === 'atk' ? 'Read him like a book!' : 'Door slammed shut!', 'Half right', 'He read you first'); return; }
    side = rnd() < 0.5 ? 'L' : 'R'; locked = true; draw('Get ready...', 50);
    var feint = r > 0 && rnd() < 0.45, d1 = 500 + rnd() * 700;
    if (feint) timer = setTimeout(function () { draw('...', side === 'L' ? 62 : 38, false); timer = setTimeout(go, 260 + rnd() * 200); }, d1);
    else timer = setTimeout(go, d1);
  }
  function go() { locked = false; t0 = performance.now(); draw('NOW!', side === 'L' ? 25 : 75, true); timer = setTimeout(function () { hit(null); }, win * 1000 + 250); }
  function hit(d) {
    if (done || locked) return; clearTimeout(timer); locked = true;
    var rt = (performance.now() - t0) / 1000, want = mode === 'atk' ? (side === 'L' ? 'R' : 'L') : side, ok = d === want;
    score += ok ? clamp(1.15 - rt / win * 0.6, 0.4, 1) : 0; r++;
    draw(ok ? 'Correct!' : d ? 'Wrong side!' : 'Too slow!', side === 'L' ? 25 : 75); setTimeout(round, 420);
  }
  A['rd-s'] = function (dd) { hit(dd.d); }; UI.mkeyLR = function (d) { hit(d); };
  round();
}

/* 3. Traksi: tahan untuk minyak, jaga jarum dalam jalur */
function tractionGame(title, hint, dur, cb) {
  var x = 0.3, held = false, inB = 0, t0 = performance.now(), last = t0, raf = 0, done = false, T = dur;
  showModal('<h2>' + esc(title) + '</h2><p class="dim">' + hint + '</p><div class="track"><div class="zone" id="gz"></div><div class="mk" id="mk"></div></div><div class="bar"><i id="gt" style="width:0%"></i></div>' + holdBtn('gbtn', 'HOLD = THROTTLE'));
  bindHold('gbtn', function () { held = true; }, function () { held = false; });
  function lp(now) {
    if (done) return;
    var dt = Math.min(0.05, (now - last) / 1000); last = now;
    var u = (now - t0) / 1000, b0 = 0.45 + 0.18 * Math.sin(u * 1.7) + 0.06 * Math.sin(u * 4.3), bw = 0.2;
    x = clamp(x + (held ? 0.85 : -0.75) * dt + Math.sin(u * 9) * 0.004, 0, 1);
    if (x >= b0 - bw / 2 && x <= b0 + bw / 2) inB += dt;
    var gz = document.getElementById('gz'), mk = document.getElementById('mk'), gt = document.getElementById('gt');
    if (gz) { gz.style.left = ((b0 - bw / 2) * 100) + '%'; gz.style.width = (bw * 100) + '%'; }
    if (mk) mk.style.left = (x * 100) + '%'; if (gt) gt.style.width = Math.min(100, u / T * 100) + '%';
    if (u >= T) { done = true; unbindHold(); mgEnd(clamp(inB / T * 1.15, 0, 1), cb, 'Smooth as silk', 'Safe', 'Lost the rear!'); return; }
    raf = requestAnimationFrame(lp);
  }
  raf = requestAnimationFrame(lp);
}

/* ---------- pit stop: tiga jenis ---------- */
/* P2. Tork nat: tahan sampai meter masuk hijau, lepas. Lebih = benang rosak, kurang = longgar */
function pitTorque(cb) {
  var names = ['Front left', 'Front right', 'Rear left', 'Rear right'], i = 0, v = 0, held = false, pen = 0, raf = 0, last = 0, t0 = performance.now(), done = false, z0 = 0, z1 = 0, res = [];
  function newZone() { z0 = 0.62 + rnd() * 0.18; z1 = z0 + 0.12; v = 0; }
  function draw() {
    showModal('<h2>Pit stop: wheel gun</h2><p class="dim">Hold until the needle hits green, then release. Too much torque = stripped thread. Too little = loose wheel.</p><p style="font-weight:600">Wheel ' + (i + 1) + '/4 · ' + names[i] + '</p><div class="track"><div class="zone" style="left:' + (z0 * 100) + '%;width:' + ((z1 - z0) * 100) + '%"></div><div style="position:absolute;top:0;bottom:0;left:' + (z1 * 100) + '%;right:0;background:#d93a2f2e"></div><div class="mk" id="mk"></div></div>' +
      '<div class="stps">' + [0, 1, 2, 3].map(function (k) { return '<i class="stp ' + (k < i ? (res[k] ? 'ok' : 'no') : k === i ? 'cur' : '') + '"></i>'; }).join('') + '</div>' + holdBtn('tq', 'HOLD (wheel gun)'));
    bindHold('tq', function () { held = true; }, release);
  }
  function release() {
    if (!held || done) return; held = false;
    var ok = v >= z0 && v <= z1; res[i] = ok;
    if (v > z1) pen += 0.7; else if (v < z0) pen += 0.45; i++;
    if (i >= 4) { done = true; cancelAnimationFrame(raf); unbindHold(); var t = (performance.now() - t0) / 1000, stop = clamp(1.9 + Math.max(0, t - 2.4) * 0.35 + pen, 1.9, 7); showRes(stop); return; }
    newZone(); draw();
  }
  function showRes(stop) {
    var q = clamp(1 - (stop - 1.9) / 2.2, 0, 1);
    showModal('<h2>Pit stop done</h2><div class="big">' + stop.toFixed(1) + ' s</div><p style="text-align:center" class="' + (stop < 2.4 ? 'pur' : stop < 3.2 ? 'good' : 'warn') + '">' + (stop < 2.4 ? 'World-class crew!' : stop < 3.2 ? 'Good stop.' : 'One wheel nut had other ideas.') + '</p><button class="btn pri wide" data-act="mg-ok">Leave the pit lane</button>');
    A['mg-ok'] = function () { closeModal(); cb(stop, q); };
  }
  function lp(now) { if (done) return; var dt = last ? Math.min(0.05, (now - last) / 1000) : 0; last = now; if (held) v = Math.min(1.05, v + dt * 1.25); var m = document.getElementById('mk'); if (m) m.style.left = Math.min(100, v * 100) + '%'; if (v >= 1.05 && held) release(); raf = requestAnimationFrame(lp); }
  newZone(); draw(); raf = requestAnimationFrame(lp);
}
/* P3. Lollipop: lepaskan kereta bila lampu hijau. Awas kereta lain lalu di lorong pit (lampu merah berkelip) */
function pitRelease(cb) {
  var st = 'kerja', t0 = 0, tm = [], done = false, unsafe = false, pen = 0, react = 0, threat = rnd() < 0.55;
  function draw(msg, col, bg) { showModal('<h2>Pit stop: lollipop</h2><p class="dim">The crew changes the tyres. Release the car when the light turns GREEN. If another car is coming (red), hold it. Unsafe release = penalty.</p><div class="big" style="padding:24px 0;border-radius:6px;background:' + bg + ';color:' + col + '">' + msg + '</div><button class="btn pri hit" data-tap="mg-lp">RELEASE!</button>'); }
  function clear() { tm.forEach(clearTimeout); tm = []; }
  function press() {
    if (done) return;
    if (st === 'kerja') { pen += 0.6; draw('NOT YET!', 'var(--bad)', '#fde3e0'); return; }
    if (st === 'bahaya') { unsafe = true; pen += 3; }
    done = true; clear(); UI.mkey = null;
    react = st === 'hijau' ? (performance.now() - t0) / 1000 : 0;
    var stop = clamp(2.1 + Math.max(0, react - 0.18) * 1.6 + pen, 1.9, 9), q = unsafe ? 0 : clamp(1 - (stop - 2.1) / 1.8, 0, 1);
    showModal('<h2>' + (unsafe ? 'UNSAFE RELEASE!' : 'Car released') + '</h2><div class="big">' + stop.toFixed(1) + ' s</div><p style="text-align:center" class="' + (unsafe ? 'bad' : stop < 2.6 ? 'pur' : 'good') + '">' + (unsafe ? 'Nearly hit a car in the pit lane. The stewards took your number.' : stop < 2.6 ? 'Released right on time!' : 'Okay, safe.') + '</p><button class="btn pri wide" data-act="mg-ok">Leave the pit lane</button>');
    A['mg-ok'] = function () { closeModal(); cb(stop, q); };
  }
  draw('WORKING...', 'var(--warn)', '#fff1cc');
  var tw = 1100 + rnd() * 900;
  if (threat) { tm.push(setTimeout(function () { st = 'bahaya'; draw('CAR COMING!', 'var(--bad)', '#fde3e0'); }, tw)); tw += 700 + rnd() * 500; }
  tm.push(setTimeout(function () { st = 'hijau'; t0 = performance.now(); draw('GREEN!', 'var(--good)', '#dff3e6'); }, tw));
  tm.push(setTimeout(function () { if (!done) { st = 'hijau'; press(); } }, tw + 1600));
  A['mg-lp'] = press; UI.mkey = press;
}
function pitAny(cb) { var k = mgPick('pit', ['roda', 'tork', 'lollipop']); mgIntro('pit-' + k, function () { if (k === 'roda') pitGame(cb); else if (k === 'tork') pitTorque(cb); else pitRelease(cb); }); }

/* ---------- start: dua jenis ---------- */
/* S2. Klac: tahan sepanjang lampu, jaga rev dalam hijau, lepas bila lampu padam */
function clutchStart(cb) {
  var lights = 0, held = false, out = false, t0 = 0, rev = 0.2, done = false, raf = 0, last = 0, tm = [], jumped = false;
  function draw() {
    var l = ''; for (var i = 0; i < 5; i++) l += '<i class="' + (i < lights ? 'on' : '') + '"></i>';
    showModal('<h2>Start: clutch</h2><p class="dim">Hold the button to build revs and keep the needle in the green. RELEASE when all the lights go out.</p><div class="lights">' + l + '</div><div class="track"><div class="zone" style="left:58%;width:18%"></div><div class="mk" id="mk"></div></div>' + holdBtn('cl', held ? 'HOLDING...' : 'HOLD CLUTCH'));
    bindHold('cl', function () { held = true; }, release);
  }
  function paint() { var ls = document.querySelectorAll('.lights i'); for (var k = 0; k < ls.length; k++) ls[k].className = k < lights ? 'on' : ''; }
  function release() {
    if (done) return; held = false;
    if (!out) { if (lights > 0) { jumped = true; finish(0.5); } return; }
    finish((performance.now() - t0) / 1000);
  }
  function finish(react) {
    done = true; tm.forEach(clearTimeout); cancelAnimationFrame(raf); unbindHold();
    var revOk = rev >= 0.58 && rev <= 0.76, q = jumped ? 0 : clamp((0.32 - react) / 0.14, 0, 1) * (revOk ? 1 : 0.55);
    var r2 = jumped ? 0.5 : react + (revOk ? 0 : rev > 0.76 ? 0.08 : 0.12);
    showModal((jumped ? '<h2 class="bad">Jump start!</h2><p>5-second penalty.</p>' : '<div class="big">' + Math.round(react * 1000) + ' ms</div><p style="text-align:center" class="' + (revOk ? 'good' : 'warn') + '">' + (revOk ? 'Perfect revs, great traction!' : rev > 0.76 ? 'Revs too high, wheelspin.' : 'Revs too low, the car bogged down.') + '</p>') + '<button class="btn pri wide" data-act="mg-ok">Continue</button>');
    A['mg-ok'] = function () { closeModal(); cb(jumped ? 0.5 : r2, jumped, q); };
  }
  function lp(now) { if (done) return; var dt = last ? Math.min(0.05, (now - last) / 1000) : 0; last = now; rev = clamp(rev + (held ? 0.55 : -0.7) * dt + Math.sin(now / 90) * 0.003, 0, 1); var m = document.getElementById('mk'); if (m) m.style.left = (rev * 100) + '%'; raf = requestAnimationFrame(lp); }
  draw(); raf = requestAnimationFrame(lp);
  var i = 0;
  (function next() { tm.push(setTimeout(function () { if (done) return; lights = ++i; paint(); if (i < 5) next(); else tm.push(setTimeout(function () { if (done) return; lights = 0; out = true; t0 = performance.now(); paint(); if (!held) finish(0.42); }, 700 + rnd() * 1600)); }, i === 0 ? 1200 : 800)); })();
}
function startAny(cb) { var k = mgPick('start', ['lampu', 'klac']); mgIntro('start-' + k, function () { if (k === 'klac') clutchStart(cb); else startGame(cb); }); }


/* ---------- kad arahan sebelum setiap mini game ---------- */
var MGINFO = {
  quali: ['Hot lap', 'Tap', ['A marker sweeps back and forth across the bar.', 'Tap LOCK when the marker is in the middle of the green zone.', '3 sectors, each one faster than the last.']],
  'start-lampu': ['Start: lights out', 'Tap', ['Five red lights come on one by one.', 'Tap as soon as ALL the lights go out.', 'Tap early = jump start, 5-second penalty.']],
  'start-klac': ['Start: clutch & throttle', 'Hold + tap', ['HOLD the THROTTLE button to build revs. Let go and they drop.', 'Feather it to keep the needle in the GREEN zone while the lights come on.', 'Tap LAUNCH the moment all the lights go out. Tapping before that is a jump start.']],
  brek: ['Brake late', 'Tap', ['The marker moves right and keeps speeding up.', 'Tap in the green zone. The later, the better.', 'Red zone = you\'ve overshot.']],
  tutup: ['Cover the line', 'Tap', ['The marker moves right and keeps speeding up.', 'Tap in the green zone to shut the inside line.', 'Red = overshoot, door left wide open.']],
  timing: ['Timing hairpin', 'Tap', ['The marker sweeps back and forth.', 'Tap when the marker is in the green zone.']],
  apex: ['Apex line', 'Hold & release', ['HOLD exactly when the marker enters the yellow band.', 'RELEASE exactly when it leaves the band.', 'Both timings count.']],
  'baca-atk': ['Read the rival', 'Left / right', ['The rival will move to cover one side.', 'You tap the OTHER side.', '3 rounds. Sometimes he fakes it first.']],
  'baca-def': ['Mirrors', 'Left / right', ['Watch where he goes in your mirrors.', 'Tap the SAME side to cover it.', '3 rounds. Sometimes he fakes it first.']],
  chicane: ['Chicane sequence', 'Left / right', ['Four arrows are shown at once.', 'Tap the direction of the LIT arrow, from left to right.', 'There\'s a time limit. Faster is better.']],
  traksi: ['Traction', 'Hold & release', ['HOLD = throttle, RELEASE = lift.', 'Keep the needle inside the moving green zone.', 'Takes about 2-3 seconds.']],
  grip: ['Wet grip', 'Hold & release', ['HOLD = throttle, RELEASE = lift.', 'Keep the needle in the green zone for 3 seconds.', 'Too long outside the zone = spin.']],
  'pit-roda': ['Pit stop: wheels', 'Tap', ['Tap Start.', 'Tap the lit wheel right on the car, as fast as you can.', 'Wrong tap = extra time.']],
  'pit-tork': ['Pit stop: wheel gun', 'Hold & release', ['For each wheel: HOLD the wheel gun.', 'RELEASE when the needle is in the green zone.', 'Too much = stripped thread, too little = loose wheel.']],
  'pit-lollipop': ['Pit stop: lollipop', 'Tap', ['Wait for the crew to finish.', 'Tap RELEASE when the screen turns GREEN.', 'If it\'s RED (car coming), don\'t tap!']],
  restart: ['Restart', 'Tap', ['Wait for the screen to turn GREEN.', 'Tap GO as fast as you can.', 'Tapping early gives you nothing.']],
  lane: ['Slow car', 'Pick a lane', ['There\'s a slow car ahead.', 'Tap the CLEAR lane.', 'Careful, he might switch lanes.']]
};
function mgIntro(key, go, sub) {
  var inf = MGINFO[key]; if (!inf) { go(); return; }
  var done = false;
  showModal('<div class="row sp"><span class="badge sc">' + inf[1] + '</span><span class="dim" style="font-size:12px">' + (sub ? esc(sub) : 'Mini game') + '</span></div><h2>' + inf[0] + '</h2><ol style="margin:0;padding-left:20px;line-height:1.6">' + inf[2].map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ol>' +
    '<p class="dim" style="font-size:12.5px">Keyboard: Space to tap/hold, arrow keys for left/right.</p><button class="btn pri hit" data-act="mg-go" style="min-height:64px">Ready!</button>' +
    '<button class="btn sm" data-act="mg-cal">' + (S.settings.lat == null ? 'Taps feel off? Calibrate touch' : 'Touch calibration (' + S.settings.lat + ' ms)') + '</button>');
  A['mg-cal'] = function () { if (done) return; calibGame(function () { mgIntro(key, go, sub); }); };
  function start() {
    if (done) return; done = true; UI.mkey = null; var n = 3;
    (function tick() { if (n === 0) { UI.mgArm = performance.now() + 250; go(); return; } showModal('<h2>' + inf[0] + '</h2><div class="big" style="font-size:72px;padding:20px 0;color:var(--acc)">' + n + '</div>'); n--; setTimeout(tick, 450); })();
  }
  A['mg-go'] = start; UI.mkey = start;
}
function laneAny(cb) { mgIntro('lane', function () { laneGame(cb); }); }
function qualiAny(cb) { mgIntro('quali', function () { qualiGame(cb); }); }

/* ---------- pemilih ikut situasi ---------- */
function attackGame(zone, skill, rival, cb) {
  var t = 'Attack ' + rival + ' into ' + zone + '!';
  var pool = zone === 'hairpin' ? ['timing', 'apex', 'baca'] : zone === 'chicane' ? ['kiri-kanan', 'apex', 'baca'] : ['brek', 'baca', 'timing'];
  var k = mgPick('atk', pool);
  mgIntro(k === 'baca' ? 'baca-atk' : k === 'kiri-kanan' ? 'chicane' : k, function () {
  if (k === 'brek') brakeGame(t, 'Tap as late as you dare, but before the red zone.', skill, cb);
  else if (k === 'timing') timingGame(t, 'Tap (or press Space) when the marker is in the green zone. Nail the braking = faster exit.', clamp(0.07 + (skill - 60) / 450, 0.06, 0.15), 1.9 + rnd() * 0.6, cb);
  else if (k === 'apex') apexGame(t, 'Hold when the marker enters the yellow band (turn in), release when it leaves. A tidy line = a fast exit.', skill, cb);
  else if (k === 'kiri-kanan') chicaneGame(cb);
  else readGame(t, 'atk', skill, cb);
  }, t);
}
function defendGame(rival, skill, cb) {
  var t = 'Defend: ' + rival + ' is right behind!', k = mgPick('def', ['tutup', 'cermin', 'traksi']);
  mgIntro(k === 'cermin' ? 'baca-def' : k, function () {
  if (k === 'tutup') brakeGame(t, 'Cover the inside line: tap in the green zone.', skill, cb);
  else if (k === 'cermin') readGame(t, 'def', skill, cb);
  else tractionGame(t, 'Get out of the corner with full traction so he can\'t use your tow. Hold for throttle, keep the needle in the green.', 2.4, cb);
  }, t);
}
function soloGame(zone, skill, cb) {
  var kk = zone === 'hairpin' ? mgPick('soloH', ['apex', 'timing']) : zone === 'chicane' ? 'chicane' : 'brek';
  mgIntro(kk, function () { soloGo(zone, skill, cb, kk); }, 'Solo challenge: ' + zone);
}
function soloGo(zone, skill, cb, kk) {
  if (zone === 'hairpin') { if (kk === 'apex') apexGame('Hairpin challenge', 'Hold as you enter the yellow band, release as you leave. Your engineer is watching the data.', skill, cb); else timingGame('Hairpin challenge', 'Brake right in the green zone.', clamp(0.07 + (skill - 60) / 450, 0.06, 0.15), 1.9 + rnd() * 0.6, cb); }
  else if (zone === 'chicane') chicaneGame(cb);
  else brakeGame('Braking challenge: ' + zone, 'Find the latest braking point before the red.', skill, cb);
}

/* ---------- Urutan chicane v2 (ganti versi lama): semua anak panah nampak, ikut yang menyala ---------- */
function chicaneGame(cb) {
  var n = 4, seq = [], i = 0, res = [], T = 3.4, t0 = 0, raf = 0, done = false;
  for (var k = 0; k < n; k++) seq.push(k === 0 ? (rnd() < 0.5 ? 'L' : 'R') : (rnd() < 0.7 ? (seq[k - 1] === 'L' ? 'R' : 'L') : seq[k - 1]));
  showModal('<h2>Chicane sequence</h2><p class="dim">Tap the direction of each <b>lit</b> arrow, one at a time, left to right.</p>' +
    '<div id="chs" style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px">' + seq.map(function (d, j) { return '<div id="ch' + j + '" style="aspect-ratio:1;border-radius:14px;display:grid;place-items:center;font:700 40px var(--disp);background:var(--panel);box-shadow:inset 0 0 0 2px var(--line2);color:var(--dim);transition:background .12s,transform .12s">' + (d === 'L' ? '◀' : '▶') + '</div>'; }).join('') + '</div>' +
    '<div class="bar"><i id="cht" style="width:100%"></i></div>' +
    '<div class="row" style="flex-wrap:nowrap"><button class="btn pri hit" data-tap="mg-lr" data-d="L" style="min-height:90px">◀ LEFT</button><button class="btn pri hit" data-tap="mg-lr" data-d="R" style="min-height:90px">RIGHT ▶</button></div>');
  function paint() {
    for (var j = 0; j < n; j++) {
      var e = document.getElementById('ch' + j); if (!e) continue;
      if (j < i) { e.style.background = res[j] ? '#dff3e6' : '#fde3e0'; e.style.color = res[j] ? 'var(--good)' : 'var(--bad)'; e.style.boxShadow = 'none'; e.style.transform = 'scale(.92)'; }
      else if (j === i) { e.style.background = 'var(--acc)'; e.style.color = 'var(--onAcc)'; e.style.boxShadow = '0 6px 16px #0003'; e.style.transform = 'scale(1.06)'; }
      else { e.style.background = 'var(--panel)'; e.style.color = 'var(--dim)'; e.style.transform = 'none'; }
    }
  }
  function step(dir) {
    if (done || i >= n) return;
    res[i] = dir === seq[i]; i++; paint();
    if (i >= n) fin();
  }
  function fin() {
    if (done) return; done = true; cancelAnimationFrame(raf); UI.mkeyLR = null;
    var ok = res.filter(Boolean).length, left = Math.max(0, T - (performance.now() - t0) / 1000), q = clamp(ok / n * (0.75 + 0.25 * left / T), 0, 1);
    setTimeout(function () { mgEnd(q, cb, ok + ' / ' + n + ' correct. Clean!', ok + ' / ' + n + ' correct', ok + ' / ' + n + ' correct. Clipped a cone!'); }, 250);
  }
  function lp(now) { if (done) return; var u = (now - t0) / 1000, b = document.getElementById('cht'); if (b) b.style.width = Math.max(0, 100 - u / T * 100) + '%'; if (u >= T) { while (i < n) { res[i] = false; i++; } paint(); fin(); return; } raf = requestAnimationFrame(lp); }
  A['mg-lr'] = function (d) { step(d.d); }; UI.mkeyLR = function (d) { step(d); };
  paint(); t0 = performance.now(); raf = requestAnimationFrame(lp);
}
