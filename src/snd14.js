'use strict';
/* ===== Fasa 14: bunyi (disintesis WebAudio, tiada fail audio) ===== */
var SND = { ctx: null, on: true, vol: 0.5 };
try { SND.on = localStorage.getItem('g2g_snd') !== '0'; } catch (e) { }
function sndCtx() {
  if (!SND.on) return null;
  try {
    if (!SND.ctx) SND.ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (SND.ctx.state === 'suspended') SND.ctx.resume();
    return SND.ctx;
  } catch (e) { return null; }
}
/* satu nada: frekuensi, tempoh, jenis, kelantangan, gelongsor ke frekuensi lain, tunda */
function sTone(f, d, type, vol, to, delay) {
  var c = sndCtx(); if (!c) return;
  var t = c.currentTime + (delay || 0), o = c.createOscillator(), g = c.createGain();
  o.type = type || 'sine'; o.frequency.setValueAtTime(f, t); if (to) o.frequency.exponentialRampToValueAtTime(to, t + d);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime((vol || 0.2) * SND.vol, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
  o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + d + 0.03);
}
function sNoise(d, vol, f0, f1, delay) {
  var c = sndCtx(); if (!c) return;
  var t = c.currentTime + (delay || 0), n = Math.max(1, Math.floor(c.sampleRate * d)), b = c.createBuffer(1, n, c.sampleRate), a = b.getChannelData(0);
  for (var i = 0; i < n; i++) a[i] = Math.random() * 2 - 1;
  var s = c.createBufferSource(), fl = c.createBiquadFilter(), g = c.createGain(); s.buffer = b; fl.type = 'bandpass'; fl.frequency.setValueAtTime(f0, t); if (f1) fl.frequency.exponentialRampToValueAtTime(f1, t + d);
  g.gain.setValueAtTime((vol || 0.2) * SND.vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
  s.connect(fl); fl.connect(g); g.connect(c.destination); s.start(t);
}
var SFX = {
  tick: function () { sTone(620, 0.05, 'triangle', 0.12); },
  perfect: function () { sTone(880, 0.14, 'sine', 0.25); sTone(1320, 0.22, 'sine', 0.22, null, 0.07); sTone(1760, 0.3, 'sine', 0.16, null, 0.15); },
  good: function () { sTone(660, 0.12, 'sine', 0.22); sTone(990, 0.2, 'sine', 0.2, null, 0.08); },
  ok: function () { sTone(420, 0.16, 'triangle', 0.2); },
  bad: function () { sTone(180, 0.28, 'sawtooth', 0.16, 110); },
  boost: function () { sNoise(0.55, 0.22, 400, 3200); sTone(160, 0.5, 'sawtooth', 0.08, 520); },
  pass: function () { sTone(520, 0.1, 'square', 0.1); sTone(780, 0.16, 'square', 0.1, null, 0.09); },
  lost: function () { sTone(300, 0.2, 'triangle', 0.14, 200); },
  crash: function () { sNoise(0.45, 0.3, 900, 120); sTone(110, 0.35, 'sawtooth', 0.14, 50); },
  dnf: function () { sTone(330, 0.25, 'sawtooth', 0.14, 160); sTone(220, 0.45, 'sawtooth', 0.14, 90, 0.22); },
  sc: function () { for (var i = 0; i < 3; i++) { sTone(740, 0.22, 'square', 0.1, null, i * 0.5); sTone(560, 0.22, 'square', 0.1, null, i * 0.5 + 0.25); } },
  pit: function () { sNoise(0.14, 0.26, 3000, 2200); sNoise(0.14, 0.26, 3000, 2200, 0.2); sNoise(0.14, 0.26, 3000, 2200, 0.4); sNoise(0.14, 0.26, 3000, 2200, 0.6); },
  win: function () { [523, 659, 784, 1047].forEach(function (f, i) { sTone(f, 0.28, 'triangle', 0.22, null, i * 0.13); }); sTone(1047, 0.7, 'sine', 0.2, null, 0.55); },
  podium: function () { [523, 659, 784].forEach(function (f, i) { sTone(f, 0.24, 'triangle', 0.2, null, i * 0.13); }); },
  result: function () { sTone(392, 0.2, 'triangle', 0.14); sTone(330, 0.3, 'triangle', 0.14, null, 0.16); },
  sign: function () { sNoise(0.22, 0.14, 2500, 800); sTone(1100, 0.1, 'sine', 0.18, null, 0.3); sTone(1650, 0.35, 'sine', 0.2, null, 0.4); },
  light: function () { sTone(440, 0.12, 'square', 0.1); },
  go: function () { sTone(880, 0.3, 'square', 0.14); },
  toast: function () { sTone(740, 0.08, 'sine', 0.12); sTone(988, 0.14, 'sine', 0.12, null, 0.07); }
};
function snd(k) { try { if (SND.on && SFX[k]) SFX[k](); } catch (e) { } }

/* klik pada butang/tindakan */
document.addEventListener('click', function (e) { if (SND.on && e.target.closest && e.target.closest('[data-act],[data-tap]')) snd('tick'); }, true);
/* mini-game: gred */
(function () {
  var v0 = verdict; verdict = function (g, sub) { snd(g === 'P' ? 'perfect' : g === 'B' ? 'good' : g === 'O' ? 'ok' : 'bad'); return v0(g, sub); };
  var c0 = cap; cap = function (t, cls) {
    var s = String(t || '');
    if (/^Overtake/.test(s)) snd('pass'); else if (/^Passed by/.test(s)) snd('lost'); else if (/^Boost/.test(s)) snd('boost'); else if (/^(Spun|Contact)/.test(s)) snd('crash'); else if (/^DNF/.test(s)) snd('dnf'); else if (/afety car/.test(s)) snd('sc');
    return c0(t, cls);
  };
  var p0 = pitResolve; pitResolve = function (k) { if (k !== null) snd('pit'); return p0(k); };
  var t0 = toast; toast = function (m) { snd('toast'); return t0(m); };
  var s0 = A['sign']; A['sign'] = function (d) { if (+d.sit !== 1) snd('sign'); return s0(d); };
  var r0 = render, last = null;
  render = function () {
    r0();
    try {
      var k = UI.screen === 'wk' && UI.wk && UI.wk.step === 'result' ? 'res' + S.season + '-' + S.round : null;
      if (k && k !== last) { last = k; var r = S.results && S.results[S.results.length - 1]; if (r && !r.dnf) snd(r.pos === 1 ? 'win' : r.pos <= 3 ? 'podium' : 'result'); else snd('result'); }
      if (!k) last = last && last.indexOf('res') === 0 ? last : null;
    } catch (e) { }
  };
})();
A['snd-toggle'] = function () { SND.on = !SND.on; try { localStorage.setItem('g2g_snd', SND.on ? '1' : '0'); } catch (e) { } if (SND.on) { snd('good'); } render(); };
