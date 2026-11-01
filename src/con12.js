/* ===== Fasa C1: kontrak pemandu + staf (team principal, technical director) ===== */
var TDNAMES = ['Adrian Whitlock', 'Matteo Brandolini', 'Kaito Fujimoto', 'Henrik Solberg', 'Lucas Beaumont', 'Arjun Mehta', 'Tobias Kreuz', 'Elena Marchetti', 'Dominic Hargreave', 'Yusuf Demir', 'Camille Roussel', 'Niklas Bergström', 'Ravi Subramaniam', 'Oliver Dunmore', 'Isabelle Fournier', 'Marco Zanetti', 'Pieter van Dijk', 'Graham Ashworth', 'Sven Lindgren', 'Daniel Okafor', 'Julien Marchand', 'Takumi Hayashi', 'Rhys Pemberton', 'Anders Kjellberg'];

/* gaji ($ juta / musim): naik mendadak ikut rating, macam F1 sebenar */
function payFor(o, k) { return clamp(Math.round(0.25 * Math.pow(1.17, o - 60) * (k || 1) * 10) / 10, 0.5, 48); }
function payTxt(v) { return '$' + (v >= 10 ? Math.round(v) : v.toFixed(1)) + 'M'; }
function staffPay(skill) { return clamp(Math.round((2 + (skill - 0.75) * 18) * 10) / 10, 2, 12); }

/* panjang kontrak baharu: bakat muda dikunci lama, veteran setahun-setahun */
function conLen(d) {
  var o = ovr(d);
  if (d.age >= 35) return 1;
  if (d.age >= 33) return rnd() < 0.7 ? 1 : 2;
  if (d.age <= 24 && (d.pot || 0) >= 88) return 3 + (rnd() < 0.4 ? 1 : 0);
  if (o >= 88) return 2 + Math.floor(rnd() * 3);
  return 1 + Math.floor(rnd() * 3);
}
function conMake(S, d, opt) {
  opt = opt || {};
  var L = opt.len || conLen(d), rk = d.cs && d.cs.starts < 20 ? 0.35 : 1, pay = payFor(ovr(d), (opt.k || (1 + gauss() * 0.07)) * rk);
  var rem = opt.stagger ? 1 + Math.floor(rnd() * L) : L;
  var c = { len: L, end: (opt.from || S.season) + rem - 1, pay: pay }, o = ovr(d);
  /* klausa: bonus kemenangan untuk pemandu bagus; opsyen tahun tambahan (team untuk bakat muda, pemandu untuk bintang) */
  if (o >= 78 && rnd() < 0.55) c.wb = Math.max(0.1, Math.round(pay * 0.05 * 10) / 10);
  var young = d.age <= 24 && (d.pot || 0) >= 84;
  if (rnd() < (young ? 0.45 : 0.2)) c.opt = { by: young || o < 86 ? 'team' : 'driver', used: false };
  return c;
}
/* staf: kontrak 2-4 tahun, bermula bercampur */
function staffCon(S, skill, stagger) {
  var L = 2 + Math.floor(rnd() * 3), rem = stagger ? 1 + Math.floor(rnd() * L) : L;
  return { len: L, end: S.season + rem - 1, pay: staffPay(skill) };
}
/* pemain: tarikh tamat diambil dari S.contract (bilangan musim tinggal) */
function conOf(S, d) {
  if (!d) return null;
  if (d.id === S.pi) {
    d.con = d.con || { len: S.contract, pay: payFor(ovr(d)) };
    d.con.end = S.season + S.contract - 1;
    return d.con;
  }
  return d.con || null;
}
function conLeft(S, d) { var c = conOf(S, d); return c ? c.end - S.season + 1 : 0; }
function conUntil(S, d) { var c = conOf(S, d); return c ? 'S' + c.end : '–'; }

function conInit(S) {
  if (!S.teams || !S.drivers) return;
  if (typeof ensureDev === 'function') ensureDev(S);
  S.drivers.forEach(function (d) {
    if (d.id === S.pi) { conOf(S, d); return; }
    if (!d.con || d.con.end < S.season) d.con = conMake(S, d, { stagger: true });
  });
  var used = {}; S.teams.forEach(function (t) { if (t.dev && t.dev.tdp) used[t.dev.tdp.name] = 1; });
  var pool = shuffle(TDNAMES.filter(function (n) { return !used[n]; }));
  S.teams.forEach(function (t) {
    var dv = t.dev; if (!dv) return;
    if (dv.tp) {
      if (dv.tp.age == null) dv.tp.age = Math.round(rr(41, 63));
      if (!dv.tp.con || dv.tp.con.end < S.season) dv.tp.con = staffCon(S, dv.tp.skill, true);
    }
    if (!dv.tdp) dv.tdp = { name: pool.pop() || pick(TDNAMES), age: Math.round(rr(38, 60)) };
    if (!dv.tdp.con || dv.tdp.con.end < S.season) dv.tdp.con = staffCon(S, dv.td, true);
  });
}
/* dipanggil lepas S.season naik: sesiapa yang kontraknya tamat disambung semula (Fasa C2 akan gantikan dengan musim transfer) */
function conRollover(S) {
  S.drivers.forEach(function (d) {
    if (d.id === S.pi) { conOf(S, d); return; }
    if (!d.con || d.con.end < S.season) d.con = conMake(S, d, d.cs && d.cs.starts === 0 && d.age <= 20 ? { len: 2 + Math.floor(rnd() * 2) } : null);
  });
  S.teams.forEach(function (t) {
    var dv = t.dev; if (!dv) return;
    if (dv.tp) { dv.tp.age = dv.tp.age == null ? Math.round(rr(41, 63)) : dv.tp.age + 1; if (!dv.tp.con || dv.tp.con.end < S.season) dv.tp.con = staffCon(S, dv.tp.skill, false); }
    if (dv.tdp) { dv.tdp.age++; if (!dv.tdp.con || dv.tdp.con.end < S.season) dv.tdp.con = staffCon(S, dv.td, false); }
  });
}
function teamPayroll(S, t) {
  var dr = 0, st = 0, exp = 0, n = 0;
  S.drivers.forEach(function (d) { if (d.team === t.id) { var c = conOf(S, d); if (c) { dr += c.pay; n++; if (c.end <= S.season) exp++; } } });
  var dv = t.dev || {};
  [dv.tp, dv.tdp].forEach(function (x) { if (x && x.con) { st += x.con.pay; n++; if (x.con.end <= S.season) exp++; } });
  return { dr: dr, st: st, exp: exp, n: n };
}
/* bahagian "Contract" untuk profil pemandu */
function conSectionHTML(S, d) {
  var c = conOf(S, d); if (!c) return '';
  var left = conLeft(S, d), fin = left <= 1;
  var tiles = [['Salary', payTxt(c.pay)], ['Until', 'S' + c.end], ['Left', left + (left === 1 ? ' season' : ' seasons')]];
  if (c.wb) tiles.push(['Win bonus', payTxt(c.wb)]);
  var h = '<h4>Contract</h4>' + pfTiles(tiles);
  if (c.opt) h += '<p class="pf-note">' + (c.opt.used ? 'Option for an extra year ' + (c.opt.ex ? 'was taken up.' : 'lapsed.') : (c.opt.by === 'team' ? 'The team holds an option for S' + (c.end + 1) + '.' : 'The driver holds an option for S' + (c.end + 1) + '.')) + '</p>';
  var note = fin ? (d.id === S.pi ? 'Your deal runs out at the end of this season. Talks start once the chequered flag falls on the finale.' : 'Final year of his deal. Expect him to be linked with other teams.') : left >= 3 ? 'Tied down for the long term.' : '';
  if (note) h += '<p class="pf-note' + (fin ? ' warn' : '') + '">' + note + '</p>';
  if (typeof objDrvHTML === 'function' && d.obj) { h += objDrvHTML(S, d, true); var lr = (d.sh && d.sh.length) ? null : null; if ((d.miss || 0) >= 2) h += '<p class="pf-note warn">Missed his targets ' + d.miss + ' seasons running. His seat is under pressure.</p>'; }
  return h;
}
