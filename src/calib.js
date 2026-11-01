/* ===== Kalibrasi sentuhan: ukur kependaman skrin + sentuh setiap peranti ===== */
MGT.lat0 = 60;
Object.defineProperty(MGT, 'lat', { get: function () { return (typeof S !== 'undefined' && S && S.settings && S.settings.lat != null) ? S.settings.lat : MGT.lat0; }, set: function (v) { MGT.lat0 = v; }, configurable: true });
function calibGame(back) {
  var per = 1400, t0 = 0, raf = 0, taps = [], N = 8, done = false;
  function pos(t) { return ((t - t0) % per) / per; }          /* 0→1 kiri ke kanan, garisan di 0.5 */
  function draw() {
    showModal('<h2>Touch calibration</h2><p class="dim">Tap the button right as the marker <b>crosses the centre line</b>. Do it naturally, don\'t overthink it. ' + N + ' times.</p>' +
      '<div class="track trk3" id="cb3"><div class="cline"></div><div class="mk" id="cb3m"></div></div>' +
      '<div class="stps">' + Array.apply(null, Array(N)).map(function (_, i) { return '<i class="stp ' + (i < taps.length ? 'ok' : i === taps.length ? 'cur' : '') + '"></i>'; }).join('') + '</div>' +
      '<div class="vd3" id="vd3"><span>Current: ' + Math.round(MGT.lat) + ' ms</span></div><button class="btn pri hit" data-tap="cb-t" style="min-height:84px">TAP</button>');
  }
  function lp(now) { if (done) return; var m = document.getElementById('cb3m'); if (m) m.style.left = (pos(now) * 100) + '%'; raf = requestAnimationFrame(lp); }
  function tap(e) {
    if (done) return;
    var t = tEv(e), k = Math.round((t - t0) / per - 0.5), cross = t0 + (k + 0.5) * per, off = t - cross;
    if (Math.abs(off) > per * 0.4) return;                       /* tekan sesat, abaikan */
    taps.push(off);
    var v = document.getElementById('vd3'); if (v) v.innerHTML = '<span>' + (off >= 0 ? 'Late ' : 'Early ') + Math.abs(Math.round(off)) + ' ms</span>';
    var st = document.querySelectorAll('#modal .stp'); if (st[taps.length - 1]) st[taps.length - 1].className = 'stp ok'; if (st[taps.length]) st[taps.length].className = 'stp cur';
    if (taps.length >= N) fin();
  }
  function fin() {
    done = true; cancelAnimationFrame(raf); UI.mkey = null;
    var a = taps.slice(2).sort(function (x, y) { return x - y; }), med = a[Math.floor(a.length / 2)], spread = a[a.length - 2] - a[1];
    var lat = Math.round(clamp(med, 0, 220));
    showModal('<h2>Calibration done</h2><div class="big">' + lat + ' ms</div><p style="text-align:center" class="dim">' +
      (med > 220 ? 'Way too late, you may be tapping after the marker has passed. Try again.' : 'The game will subtract ' + lat + ' ms from every tap, so what you see is what gets judged.') +
      (spread > 120 ? '<br><span class="warn">Your taps were quite inconsistent, try once more for a more accurate result.</span>' : '') + '</p>' +
      '<div class="row" style="flex-wrap:nowrap"><button class="btn" data-act="cb-again">Redo</button><button class="btn pri wide" data-act="cb-save">Save</button></div><button class="btn sm" data-act="cb-reset">Use default (' + MGT.lat0 + ' ms)</button>');
    A['cb-save'] = function () { S.settings.lat = lat; save(); end(); };
    A['cb-again'] = function () { calibGame(back); };
    A['cb-reset'] = function () { delete S.settings.lat; save(); end(); };
  }
  function end() { closeModal(); if (back) back(); else render(); }
  A['cb-t'] = function (d, b, e) { tap(e); }; UI.mkey = tap;
  draw(); UI.mgArm = performance.now() + 400; t0 = performance.now(); raf = requestAnimationFrame(lp);
}
A['calib'] = function () { calibGame(null); };
