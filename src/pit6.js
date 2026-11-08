/* ===== Pit stop dengan kereta atas: roda ditekan terus pada kereta ===== */
/* kereta menghala kanan: atas = sisi kiri kereta. k: 0 depan kiri, 1 depan kanan, 2 belakang kiri, 3 belakang kanan */
var PTY = [[71, 4], [71, 79.6], [10, 4], [10, 79.6]], PTYS = ['FL', 'FR', 'RL', 'RR'];
function pitCarH(cls, tap) {
  var h = '<div class="pcar" id="pcar">' + carSVG(myTeam(), 700);
  for (var k = 0; k < 4; k++) h += '<i class="pty ' + (cls[k] || '') + '" style="left:' + PTY[k][0] + '%;top:' + PTY[k][1] + '%">' + PTYS[k] + '</i>';
  if (tap) for (k = 0; k < 4; k++) h += '<button class="pq" data-tap="mg-w" data-k="' + k + '" aria-label="wheel ' + k + '" style="left:' + (PTY[k][0] > 50 ? 50 : 0) + '%;top:' + (PTY[k][1] > 50 ? 50 : 0) + '%"></button>';
  return h + '</div>';
}
function pitGame(cb) {
  var st = { order: shuffle([0, 1, 2, 3]), i: 0, err: 0, t0: 0, started: false, timer: 0 };
  function cls() { return [0, 1, 2, 3].map(function (k) { var idx = st.order.indexOf(k); return !st.started || st.i < 0 ? '' : idx < st.i ? 'done' : idx === st.i ? 'lit' : ''; }); }
  function draw() {
    showModal('<h2>Pit stop</h2><p class="dim">' + (st.started ? 'Tap the <b class="warn">lit</b> wheel as fast as you can.' : 'Crew is standing by. Tap Start, then tap each wheel as it lights up on the car.') + '</p>' + pitCarH(cls(), st.started) +
      (st.started ? '<p class="dim" style="text-align:center;font-size:12px">' + Math.max(0, st.i) + '/4 wheels</p>' : '<button class="btn pri wide" data-act="mg-begin">Start</button>') + '<button class="btn sm" data-act="mg-auto">Auto</button>');
  }
  A['mg-begin'] = function () { st.started = true; st.i = -1; draw(); arm(); st.timer = setTimeout(function () { st.i = 0; st.t0 = performance.now(); draw(); }, 400 + rnd() * 500); };
  A['mg-w'] = function (d) {
    if (!st.started || st.i < 0 || st.i >= 4) return;
    if (+d.k === st.order[st.i]) {
      st.i++;
      if (st.i >= 4) {
        var t = (performance.now() - st.t0) / 1000, stop = clamp(1.9 + Math.max(0, t - 1.6) * 0.9 + st.err * 0.4, 1.9, 7), q = clamp(1 - (stop - 1.9) / 2.2, 0, 1);
        draw();
        setTimeout(function () {
          showModal('<h2>Pit stop done</h2>' + pitCarH(['done', 'done', 'done', 'done'], false) + '<div class="big">' + stop.toFixed(1) + ' s</div><p style="text-align:center" class="' + (stop < 2.4 ? 'pur' : stop < 3.2 ? 'good' : 'warn') + '">' + (stop < 2.4 ? 'World-class pit stop!' : stop < 3.2 ? 'Good stop.' : 'A touch slow.') + (st.err ? ' (' + st.err + ' wrong taps)' : '') + '</p><button class="btn pri wide" data-act="mg-ok">Leave the pit lane</button>');
          A['mg-ok'] = function () { closeModal(); cb(stop, q); };
        }, 220);
      } else draw();
    } else { st.err++; draw(); var w = document.getElementById('pcar'); if (w) w.classList.add('shake'); }
  };
  A['mg-auto'] = function () { clearTimeout(st.timer); closeModal(); cb(crewTime({ t: myTeam() }), null); };
  draw();
}
function pitTorque(cb) {
  var order = [0, 1, 2, 3], names = ['Front left', 'Front right', 'Rear left', 'Rear right'], i = 0, v = 0, held = false, pen = 0, raf = 0, last = 0, t0 = performance.now(), done = false, z0 = 0, z1 = 0, res = [], hist = [];
  function newZone() { z0 = 0.6 + rnd() * 0.18; z1 = z0 + 0.13; v = 0; }
  function cls() { return order.map(function (k) { return k < i ? (res[k] ? 'ok' : 'no') : k === i ? 'cur' : ''; }); }
  function draw() {
    showModal('<h2>Pit stop: wheel gun</h2><p class="dim">Hold until the needle hits green, then release. Red = over-torqued.</p>' + pitCarH(cls(), false) + '<p style="font-weight:600;text-align:center;margin:0">Wheel ' + (i + 1) + '/4 · ' + names[i] + '</p>' +
      trackH('tq3', zoneH(z0, z1, 'zone') + zoneH(z1, 1, 'red3')) + '<div class="vd3" id="vd3">' + (hist.length ? hist[hist.length - 1] : '<span>Hold the button and watch the needle climb.</span>') + '</div>' + holdBtn('tq', 'HOLD (wheel gun)'));
    bindHold('tq', function () { if (armed()) held = true; }, release); arm();
  }
  function release() {
    if (!held || done) return; held = false;
    var x = v - 1.1 * MGT.lat / 1000, ok = x >= z0 && x <= z1, g, msg;
    if (ok) { g = 'P'; msg = 'Spot on'; } else if (x > z1) { g = x <= z1 + 0.03 ? 'O' : 'M'; msg = 'Over-torqued'; pen += g === 'O' ? 0.25 : 0.7; } else { g = x >= z0 - 0.03 ? 'O' : 'M'; msg = 'Under-torqued, loose'; pen += g === 'O' ? 0.2 : 0.45; }
    res[i] = ok; hist.push('<b class="' + GRD[g].c + '">' + names[i] + ': ' + msg + '</b>'); i++;
    if (i >= 4) { done = true; cancelAnimationFrame(raf); unbindHold(); var t = (performance.now() - t0) / 1000, stop = clamp(1.9 + Math.max(0, t - 3.2) * 0.3 + pen, 1.9, 7); showRes(stop); return; }
    newZone(); draw();
  }
  function showRes(stop) {
    var q = clamp(1 - (stop - 1.9) / 2.2, 0, 1);
    showModal('<h2>Pit stop done</h2>' + pitCarH(cls(), false) + '<div class="big">' + stop.toFixed(1) + ' s</div><div class="vd3">' + hist.join('') + '</div><button class="btn pri wide" data-act="mg-ok">Leave the pit lane</button>');
    A['mg-ok'] = function () { closeModal(); cb(stop, q); };
  }
  function lp(now) { if (done) return; var dt = last ? Math.min(0.05, (now - last) / 1000) : 0; last = now; if (held) v = Math.min(1.05, v + dt * 1.1); var m = document.getElementById('tq3m'); if (m) m.style.left = Math.min(100, v * 100) + '%'; if (v >= 1.05 && held) release(); raf = requestAnimationFrame(lp); }
  newZone(); draw(); raf = requestAnimationFrame(lp);
}
function pitRelease(cb) {
  var st = 'kerja', t0 = 0, tm = [], done = false, unsafe = false, pen = 0, react = 0, threat = rnd() < 0.55;
  var others = S.teams.filter(function (t) { return t.id !== myTeam().id; }), foe = others[Math.floor(rnd() * others.length)];
  function draw(msg, col, bg) {
    var w = st === 'kerja' ? 'wrk' : st === 'hijau' ? 'done' : 'done';
    showModal('<h2>Pit stop: lollipop</h2><p class="dim">The crew changes the tyres. Release the car when the light turns GREEN. If a car is coming through (red), hold it. Unsafe release = penalty.</p>' +
      '<div class="plane">' + (st === 'bahaya' ? '<div class="pass">' + carSVG(foe, 300) + '</div>' : '') + '</div>' + pitCarH([w, w, w, w], false) +
      '<div class="big" style="padding:18px 0;border-radius:6px;background:' + bg + ';color:' + col + '">' + msg + '</div><button class="btn pri hit" data-tap="mg-lp">RELEASE!</button>');
  }
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
