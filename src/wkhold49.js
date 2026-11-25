'use strict';
/* ===== Weekend hold (2.6.5): leaving qualifying or the strategy page keeps the weekend as it was =====
   Before this, Exit during qualifying threw the session away and a new start ran qualifying again with a new result, so a bad
   grid could be re-rolled. Now the weekend (qualifying progress, grid and strategy) is kept in the save until the race starts;
   Exit still goes back to Home, and Start weekend continues exactly where the player left. The race itself was already locked. */
function wkHoldKey(S) { return S.season + ':' + S.round + ':' + (typeof leagueOf === 'function' ? leagueOf(S) : ''); }
function wkHoldSnap() {
  var w = UI.wk; if (!w || (w.step !== 'quali' && w.step !== 'strat')) return null;
  var o = {}; Object.keys(w).forEach(function (k) { if (k !== 'c' && typeof w[k] !== 'function') o[k] = w[k]; });
  try { return JSON.parse(JSON.stringify(o)); } catch (e) { return null; }
}
function wkHoldSave() {
  if (!S || S.mode !== 'pro' || !UI.wk) return;
  var w = UI.wk, started = w.q || (w.Q && ((w.Q.s || 0) > 0 || (w.Q.res && w.Q.res.length) || (w.Q.log && w.Q.log.length)));
  if (!started && w.step === 'quali') return;   /* nothing run yet: nothing to protect */
  var snap = wkHoldSnap(); if (!snap) return;
  var fp = JSON.stringify(snap).length + ':' + snap.step + ':' + (snap.q ? snap.q.length : 0) + ':' + (snap.Q ? snap.Q.s : '');
  if (S.wkHold && S.wkHold.key === wkHoldKey(S) && S.wkHold.fp === fp) return;
  S.wkHold = { key: wkHoldKey(S), fp: fp, wk: snap };
  if (typeof save === 'function') save();
}
(function () {
  var render0 = render;
  render = function () {
    var r = render0.apply(this, arguments);
    try {
      if (S && UI.screen === 'wk' && UI.wk) { if (UI.wk.step === 'quali' || UI.wk.step === 'strat') wkHoldSave(); else if (S.wkHold) { delete S.wkHold; } }
      if (S && S.wkHold && S.wkHold.key !== wkHoldKey(S)) delete S.wkHold;
    } catch (e) { }
    return r;
  };
  var start0 = A['wk-start'];
  A['wk-start'] = function () {
    if (S && S.wkHold && S.wkHold.key === wkHoldKey(S) && S.wkHold.wk && S.wkHold.wk.ci === S.cal[S.round]) {
      var w = JSON.parse(JSON.stringify(S.wkHold.wk)); w.c = circuitFor(S, w.ci); UI.wk = w; UI.screen = 'wk'; render(); window.scrollTo(0, 0);
      if (typeof toast === 'function') toast(w.step === 'strat' ? 'Back to your strategy. Qualifying is done.' : 'Qualifying continues where you left it.');
      return;
    }
    return start0.apply(this, arguments);
  };
})();
