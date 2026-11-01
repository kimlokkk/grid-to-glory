/* ===== Fasa E1: kewangan team. Duit masuk (hadiah, penaja), duit keluar (gaji, operasi, akademi), baki = dana R&D.
   Setiap pakej upgrade ada kos; dana tak cukup bermakna pakej lebih kecil atau lewat. Had kos lembut menghalang team terkaya membelanjakan tanpa had. ===== */
var FIN = {
  K: 13,                 /* kos ($J) setiap unit saiz pakej */
  rush: 1.25, big: 0.9,   /* pakej gopoh lebih mahal, pakej besar lebih jimat */
  ops: 40,                /* kos operasi tetap (kilang, perjalanan) */
  cap: 80,                /* had lembut dana R&D */
  prize: [40, 37, 34, 32, 30, 28, 26, 24.5, 23, 22],
  sp0: 90, sp1: 5,      /* penaja asas = sp0 + sp1 * prestij */
  payFrac: 0.30,          /* gaji (pemandu + staf) tak sepatutnya melebihi 30% pendapatan */
  acad: 1.5               /* kos setiap junior akademi */
};
function finSponBase(t) { return FIN.sp0 + FIN.sp1 * t.prestige; }
function finEff(f) { return f <= FIN.cap ? f : FIN.cap + 0.2 * (f - FIN.cap); }
function finAcad(S, t) { var n = 0; (S.juniors || []).forEach(function (j) { if (j.acad === t.id) n++; }); return n * FIN.acad; }
function finPayroll(S, t) { var p = typeof teamPayroll === 'function' ? teamPayroll(S, t) : { dr: 0, st: 0 }; return p.dr + p.st; }
function finInit(S) {
  S.teams.forEach(function (t) {
    if (t.fin) return;
    var rk = teamRank(S, t.id), pz = FIN.prize[rk - 1], sp = finSponBase(t), pay = finPayroll(S, t);
    var fund = finEff(pz + sp - FIN.ops - pay - finAcad(S, t));
    t.fin = { spon: sp, pz: pz, rev: pz + sp, pay: pay, fund: fund, cash: fund, spent: 0, debt: 0, hist: [{ s: S.season, rev: pz + sp, pay: pay, fund: fund }] };
  });
  if (typeof mktPlans === 'function') mktPlans(S);
}
/* gaji maksimum yang team mampu (untuk keputusan pasaran) */
function finPayCap(t) { return FIN.payFrac * ((t.fin && t.fin.rev) || 140); }
/* dipanggil di awal musim sejuk (sebelum pakej musim sejuk), selepas pasaran transfer */
function finSeason(S) {
  finInit(S);
  var ts = S.teams.slice().sort(function (a, b) { return b.pts - a.pts || b.wins - a.wins; }), pos = {};
  ts.forEach(function (t, i) { pos[t.id] = i + 1; });
  S.teams.forEach(function (t) {
    var f = t.fin, last = f.hist[f.hist.length - 1];
    if (last) { last.spent = +f.spent.toFixed(1); last.left = +f.cash.toFixed(1); last.pos = pos[t.id]; }
    var prev = (t.sh && t.sh.length > 1) ? t.sh[t.sh.length - 2].pos : pos[t.id], avg = (pos[t.id] + prev) / 2;
    var target = finSponBase(t) * (1.08 - 0.016 * (avg - 1));          /* keputusan baik tarik penaja */
    f.spon += 0.5 * (target - f.spon);
    f.pz = FIN.prize[pos[t.id] - 1]; f.rev = f.pz + f.spon + (typeof sponIncome === 'function' && t.id === S.drivers[S.pi].team ? sponIncome(S) : 0);
    f.pay = finPayroll(S, t);
    var carry = clamp(f.cash, 0, 0.25 * FIN.cap) * 0.7, debt = Math.max(0, -f.cash) * 1.25 + (f.debt || 0);
    if (typeof facLoan === 'function') debt = facLoan(S, t, f, debt);
    var raw = f.rev - FIN.ops - f.pay - finAcad(S, t) + carry - debt - (f.bonus || 0); f.bonus = 0;
    f.fund = finEff(Math.max(8, raw)); f.cash = f.fund; f.spent = 0; f.debt = 0; f.brk = false;
    f.hist.push({ s: S.season + 1, rev: +f.rev.toFixed(1), pay: +f.pay.toFixed(1), fund: +f.fund.toFixed(1) });
    if (f.hist.length > 8) f.hist.shift();
  });
}
/* bonus kemenangan dibayar oleh team di hujung musim, ditolak daripada dana tahun depan */
function finBonus(S) {
  S.drivers.forEach(function (d) {
    var c = d.team >= 0 ? conOf(S, d) : null; if (!c || !c.wb || !d.wins) return;
    var f = S.teams[d.team].fin; if (f) f.bonus = (f.bonus || 0) + d.wins * c.wb;
  });
}
function finCostOf(size, rush, big) { return FIN.K * size * (rush ? FIN.rush : big ? FIN.big : 1); }
/* wang yang boleh dibelanjakan dalam musim: TP berhati-hati simpan sebahagian untuk tahun depan, TP berani sanggup berhutang sedikit */
function finAvail(t) {
  var a = t.dev.tp.amb, f = t.fin.fund || 50;
  var res = f * (a <= 0 ? 0.22 : a === 1 ? 0.12 : 0.04), allow = a >= 2 ? 0.12 * f : 0;
  return t.fin.cash - res + allow;
}
/* pakej musim sejuk: sentiasa dibuat, tapi kecil kalau dana tak cukup */
function finWinter(t, size) {
  var cost = finCostOf(size, false, size >= 3), a = clamp(t.fin.cash / cost, 0.5, 1);
  t.fin.cash -= cost * a; t.fin.spent += cost * a; return a;
}
function finStatus(t) {
  var f = t.fin; if (!f) return { k: 'ok', txt: 'Comfortable' };
  if (f.fund >= FIN.cap * 0.97) return { k: 'cap', txt: 'At the cost cap' };
  if (f.cash < 0) return { k: 'bad', txt: 'In the red' };
  if (f.fund < 52 || f.cash < 0.12 * f.fund) return { k: 'bad', txt: 'Cash-strapped' };
  if (f.fund >= 70) return { k: 'good', txt: 'Well funded' };
  return { k: 'ok', txt: 'Comfortable' };
}
function finHTML(t) {
  var f = t.fin; if (!f) return '';
  var st = finStatus(t), m = function (v) { return '$' + Math.round(v) + 'M'; };
  var h = '<h4>Finances</h4>' + pfTiles([['Revenue', m(f.rev)], ['Payroll', m(f.pay)], ['R&D fund', m(f.fund)], ['Left', (f.cash < 0 ? '-' : '') + m(Math.abs(f.cash))]]);
  h += '<p class="fin-st ' + st.k + '"><b>' + st.txt + '.</b> Prize money ' + m(f.pz) + ' · sponsors ' + m(f.spon) + ' · fixed costs ' + m(FIN.ops) + '.</p>';
  var H = f.hist.slice(0, -1).slice(-4).reverse();
  if (H.length) h += '<table class="t pf-hist"><thead><tr><th>Season</th><th class="r">Revenue</th><th class="r">Payroll</th><th class="r">R&D fund</th><th class="r">Spent</th></tr></thead><tbody>' + H.map(function (r) { return '<tr><td class="mono">S' + r.s + '</td><td class="r mono">' + m(r.rev) + '</td><td class="r mono">' + m(r.pay) + '</td><td class="r mono">' + m(r.fund) + '</td><td class="r mono">' + (r.spent != null ? m(r.spent) : '–') + '</td></tr>'; }).join('') + '</tbody></table>';
  return h;
}
/* kad dana untuk skrin R&D pemain */
function finCardHTML(t) {
  var f = t.fin, d = t.dev; if (!f || !d) return '';
  var st = finStatus(t), p = d.prog || 0, c = finCostOf(DEV.pkg * Math.max(p, 1.0) / DEV.std, p < 1.2, p >= 2.0);
  return '<div class="fin-card ' + st.k + '"><div><small>R&D fund left</small><b>$' + Math.round(f.cash) + 'M</b><span>of $' + Math.round(f.fund) + 'M · ' + st.txt + '</span></div><div><small>Next package costs</small><b>~$' + Math.round(c) + 'M</b><span>' + (finAvail(t) >= c ? 'Affordable' : 'Over budget: it will be scaled down') + '</span></div></div>';
}
function finReport(S) {
  var rows = S.teams.slice().sort(function (a, b) { return teamPower(b) - teamPower(a); }).map(function (t) { return t.short + ' fund ' + t.fin.fund.toFixed(0) + ' rev ' + t.fin.rev.toFixed(0) + ' pay ' + t.fin.pay.toFixed(0) + ' left ' + t.fin.cash.toFixed(0); });
  console.log(rows.join(' | '));
}
