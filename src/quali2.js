'use strict';
/* ===== Kelayakan v2: Q1/Q2/Q3 knockout =====
   Q1: 20 kereta, 5 tersingkir (P16-20). Q2: 15 kereta, 5 tersingkir (P11-15). Q3: 10 kereta lawan untuk pole.
   Setiap sesi dua pusingan laju (terbaik dikira). Trek makin laju (evolusi). Keluar awal = kurang risiko bendera kuning
   tapi trek lebih perlahan dan lebih trafik; keluar lewat = trek terlaju tapi risiko kuning lebih tinggi. */
var QK = {
  evo: [0, -0.12, -0.22],
  opt: {
    awal: { evo: 0.06, traffic: 0.16, yellow: 0.03 },
    biasa: { evo: 0, traffic: 0.10, yellow: 0.05 },
    lewat: { evo: -0.07, traffic: 0.06, yellow: 0.11 }
  },
  trafLoss: [0.15, 0.6], cut: [15, 10], nzRun: 0.85
};
var QNAME = ['Q1', 'Q2', 'Q3'];
function qkInit(S, ci, wq) {
  trainingPrepare(S);
  evaluationPrepare(S, ci);
  var c = circuitFor(S, ci), setup = {}, temp = P2.v3 ? rnd() : 0.5, base = {};
  S.teams.forEach(function (t) { setup[t.id] = (P2.v3 ? gauss() * P2.setupK : 0) + worldSetup(t); });
  S.drivers.forEach(function (d) {
    var team = S.teams[d.team], cp = carPerf3(team, c, P2.v3), a = worldAttributes(S, d);
    var t = (100 - cp.q) * P2.carK + (100 - a.qpace) * P2.drvK + setup[team.id];
    t += combinedPace(driverFocus(S, d.id), abilityEffects(S, ci, d.id), true, wq);
    if (wq > 0.02) t += wq * 8 + (100 - (0.6 * d.wet + 0.4 * a.adapt)) * 0.04 * wq - (team.car.aero - 75) * 0.01 * wq;
    base[d.id] = { t: t, nz: P2.qNoise - (d.cons - 70) / 600, wet: wq };
  });
  return { ci: ci, c: c, wq: wq, setup: setup, temp: temp, base: base, s: 0, alive: S.drivers.map(function (d) { return d.id; }), res: [], elim: [], log: [] };
}
function qkRun(Q, di, si, ch, mod) {
  var b = Q.base[di], o = QK.opt[ch] || QK.opt.biasa, t = b.t + QK.evo[si] + o.evo + gauss() * b.nz * QK.nzRun, ev = null;
  if (b.wet > 0.2) t += gauss() * 0.25;
  if (rnd() < o.traffic) { t += rr(QK.trafLoss[0], QK.trafLoss[1]); ev = 'trafik'; }
  if (rnd() < o.yellow) { t += 6; ev = 'kuning'; }
  if (mod != null) t += mod;
  return { t: t, ev: ev };
}
/* satu sesi. pl = { di, ch, mod } untuk pemain (mod hanya pada pusingan kedua) */
function qkSession(Q, pl) {
  var si = Q.s, rows = [];
  Q.alive.forEach(function (di) {
    var me = pl && pl.di === di, ch = me ? pl.ch : pick(['awal', 'biasa', 'biasa', 'lewat']);
    var r1 = qkRun(Q, di, si, ch, null), r2 = qkRun(Q, di, si, ch, me ? pl.mod : null), best = r1.t <= r2.t ? r1 : r2;
    rows.push({ di: di, t: best.t, ev: r1.ev && r2.ev ? r1.ev : (best.ev || null), r1: r1, r2: r2, ch: ch });
  });
  rows.sort(function (a, b) { return a.t - b.t; });
  rows.forEach(function (r, i) { r.pos = i + 1; r.lap = Q.c.base - 1.6 + r.t; });
  Q.res[si] = rows;
  if (si < 2) { var keep = QK.cut[si]; Q.elim[si] = rows.slice(keep); Q.alive = rows.slice(0, keep).map(function (r) { return r.di; }); }
  Q.s++;
  return rows;
}
function qkGrid(Q) {
  var order = Q.res[2].slice().concat(Q.elim[1] || [], Q.elim[0] || []);
  order.forEach(function (r, i) { r.gpos = i + 1; });
  P2._q = { setup: Q.setup, temp: Q.temp };
  P2._qrows = order.map(function (r, i) { return { di: r.di, t: r.t, pos: i + 1, lap: r.lap, sess: i < 10 ? 2 : i < 15 ? 1 : 0 }; });
  return order.map(function (r) { return r.di; });
}
function qkAuto(S, ci, wq, mod) {
  var Q = qkInit(S, ci, wq || 0);
  for (var i = 0; i < 3; i++) qkSession(Q, mod != null ? { di: S.pi, ch: 'biasa', mod: mod } : null);
  return qkGrid(Q);
}
function qualiWet(w) { return w && w.type === 'basah' ? w.int * 0.8 : (w && w.type === 'hujan' && w.start < 3 ? 0.3 : 0); }
