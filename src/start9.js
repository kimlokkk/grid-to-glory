/* ===== Start klac v2: dua kawalan. TAHAN = minyak (rev naik, lepas = rev turun), TEKAN LAUNCH bila lampu padam ===== */
function clutchStart(cb) {
  var lights = 0, held = false, out = false, t0 = 0, rev = 0.2, done = false, raf = 0, last = 0, tm = [], jumped = false, z0 = 0.58, z1 = 0.76, inG = 0, tot = 0;
  function draw() {
    var l = ''; for (var i = 0; i < 5; i++) l += '<i class="' + (i < lights ? 'on' : '') + '"></i>';
    showModal('<h2>Start: clutch & throttle</h2><p class="dim">Hold <b>THROTTLE</b> to build revs, let go to drop them. Keep the needle in the <b class="good">green</b>. Tap <b>LAUNCH</b> when the lights go out.</p>' +
      '<div class="lights">' + l + '</div><div class="track trk3"><div class="zone" style="left:' + z0 * 100 + '%;width:' + (z1 - z0) * 100 + '%"></div><div class="red3" style="left:90%;width:10%"></div><div class="mk" id="mk"></div></div>' +
      '<div class="vd3" id="vd3"><span id="revtx">Revs low. Hold throttle.</span></div>' +
      '<div class="row st9" style="flex-wrap:nowrap">' + holdBtn('cl', 'THROTTLE<br><small>hold</small>') + '<button class="btn hit st9-go" data-tap="mg-launch">LAUNCH<br><small>tap at lights out</small></button></div>' +
      '<p class="dim" style="font-size:11.5px;text-align:center;margin:0">Keyboard: hold Space for throttle, press → to launch.</p>');
    bindHold('cl', function () { held = true; }, function () { held = false; });
  }
  function paint() { var ls = document.querySelectorAll('.lights i'); for (var k = 0; k < ls.length; k++) ls[k].className = k < lights ? 'on' : ''; }
  function launch(e) {
    if (done) return;
    if (!out) { jumped = true; finish(0.5); return; }
    finish(Math.max(0, (tEv(e) - MGT.lat - t0) / 1000));
  }
  function finish(react) {
    done = true; tm.forEach(clearTimeout); cancelAnimationFrame(raf); unbindHold(); UI.mkeyLR = null; held = false;
    var revOk = rev >= z0 && rev <= z1, hold = tot > 0 ? inG / tot : 0;
    var q = jumped ? 0 : clamp((0.32 - react) / 0.14, 0, 1) * (revOk ? 1 : 0.55) * (0.8 + 0.2 * hold);
    var r2 = jumped ? 0.5 : react + (revOk ? 0 : rev > z1 ? 0.08 : 0.12);
    var msg = jumped ? '<h2 class="bad">Jump start!</h2><p>You launched before the lights went out. 5-second penalty.</p>' :
      '<div class="big">' + Math.round(react * 1000) + ' ms</div><p style="text-align:center" class="' + (revOk ? 'good' : 'warn') + '">' + (revOk ? 'Perfect revs, great traction!' : rev > z1 ? 'Revs too high, wheelspin off the line.' : 'Revs too low, the car bogged down.') + '</p><p class="dim" style="text-align:center;margin:0">Needle in the green ' + Math.round(hold * 100) + '% of the time while the lights were on.</p>';
    showModal(msg + '<button class="btn pri wide" data-act="mg-ok">Continue</button>');
    A['mg-ok'] = function () { closeModal(); cb(jumped ? 0.5 : r2, jumped, q); };
  }
  function lp(now) {
    if (done) return;
    var dt = last ? Math.min(0.05, (now - last) / 1000) : 0; last = now;
    rev = clamp(rev + (held ? 0.6 : -0.75) * dt + Math.sin(now / 90) * 0.003, 0, 1);
    if (lights > 0 && !out) { tot += dt; if (rev >= z0 && rev <= z1) inG += dt; }
    var m = document.getElementById('mk'); if (m) m.style.left = (rev * 100) + '%';
    var tx = document.getElementById('revtx'); if (tx) { var s = rev < z0 ? 'Revs low. Hold throttle.' : rev > z1 ? 'Too many revs! Ease off.' : 'In the green. Hold it there…'; if (tx.textContent !== s) { tx.textContent = s; tx.className = rev < z0 ? '' : rev > z1 ? 'bad' : 'good'; } }
    raf = requestAnimationFrame(lp);
  }
  draw(); arm(); raf = requestAnimationFrame(lp);
  A['mg-launch'] = function (d, b, e) { launch(e); };
  UI.mkeyLR = function (s) { if (s === 'R') launch(null); };
  var i = 0;
  (function next() { tm.push(setTimeout(function () { if (done) return; lights = ++i; paint(); if (i < 5) next(); else tm.push(setTimeout(function () { if (done) return; lights = 0; out = true; t0 = performance.now(); paint(); tm.push(setTimeout(function () { if (!done) finish(0.6); }, 1500)); }, 700 + rnd() * 1600)); }, i === 0 ? 1400 : 850)); })();
}
