/* ===== Fasa C2: musim transfer (pemandu + staf), akademi, potensi tersembunyi, generasi emas ===== */
function hashS(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return ((h >>> 0) % 100000) / 100000; }
function hgauss(s) { return (hashS(s + 'a') + hashS(s + 'b') + hashS(s + 'c') + hashS(s + 'd') - 2) * 1.73; }
/* kualiti scout team = kualiti staf teknikal (0..1) */
function scoutQ(t) { var dv = t.dev || {}; return clamp(((dv.staff == null ? 1 : dv.staff) - 0.8) / 0.4, 0, 1); }
/* anggaran POTENSI oleh sesebuah team: konsisten setiap musim, makin salah kalau scout lemah */
function estPot(t, d, N) { return clamp(d.pot + hgauss(t.id + '|' + d.name + '|' + N) * (7 - 5 * scoutQ(t)), 60, 99); }
/* potensi yang orang ramai nampak (media): potensi sebenar + hype; hype susut bila bakat tu dah banyak berlumba */
function scoutPot(d) { return clamp(d.pot + (d.hy || 0), 60, 99); }
function teamPolicy(t) { var a = t.dev && t.dev.acad != null ? t.dev.acad : 0.5; return a >= 0.62 ? 'Develops its own talent' : a <= 0.38 ? 'Buys proven talent' : 'Balanced approach'; }
function pickAcad(S) {
  if (rnd() < 0.42) return null;
  var w = S.teams.map(function (t) { return t.prestige + 2; }), tot = 0; w.forEach(function (x) { tot += x; });
  var r = rnd() * tot; for (var i = 0; i < w.length; i++) { r -= w[i]; if (r <= 0) return i; } return 0;
}
function mktInit(S) {
  S.teams.forEach(function (t) { if (!t.dev) return; if (t.dev.acad == null) t.dev.acad = clamp(0.58 - 0.1 * (t.dev.tp ? t.dev.tp.amb : 0) + gauss() * 0.15, 0.1, 0.9); });
  (S.juniors || []).forEach(function (j) { if (j.acad === undefined) j.acad = pickAcad(S); if (j.hy == null) j.hy = gauss() * 4; });
  (S.drivers || []).concat(S.reserves || []).forEach(function (d) { if (d.hy == null) d.hy = gauss() * 3 * (d.age < 27 ? 1 : 0.3); });
}
function mktNum(S) {
  var tk = {}; S.drivers.concat(S.reserves || [], S.bench ? [S.bench] : []).forEach(function (d) { tk[d.num] = 1; });
  var f = []; for (var n = 2; n < 100; n++) if (!tk[n]) f.push(n); return pick(f);
}
function juniorToDriver(S, j, id, team) {
  var nd = {
    id: id, uid: personId(S, j), name: j.name, nat: j.nat, age: j.age, team: team, num: mktNum(S), pot: j.pot, pk: j.pk, fb: j.fb, ty: j.ty, hy: j.hy, acad: j.acad,
    bio: (j.jr && j.jr.titles ? JR_NAME + ' champion' : 'Graduate of the ' + JR_NAME) + '. ' + DTYPES[j.ty || 'all'].bio + ' ' + (scoutPot(j) >= 92 ? 'Tipped as a future star.' : scoutPot(j) >= 86 ? 'Highly rated by the paddock.' : 'Will need to prove himself quickly.'),
    pts: 0, wins: 0, pods: 0, poles: 0, starts: 0, dnf: 0, fl: 0, cs: { starts: 0, wins: 0, pods: 0, poles: 0, titles: 0 }, sh: [], rh: [], pa: {}, jr: j.jr
  };
  ATTRS.forEach(function (k) { nd[k] = j[k]; });
  nd.code = mkCode(nd.name, usedCodes(S));
  return nd;
}
/* pelan team: menentukan siapa dicari. win = pemandu siap sekarang, build = seimbang, rebuild = naikkan akademi, cut = jimat gaji */
var PLAN = {
  win: { n: 'Win now', d: 'Wants proven drivers, little patience for prospects.', pot: 0.4, ac: 0, cap: 1, old: 0.6 },
  build: { n: 'Build for the future', d: 'Balances today with tomorrow.', pot: 1.3, ac: 1.2, cap: 1, old: 1 },
  rebuild: { n: 'Rebuilding', d: 'Clearing the decks for young talent, academy first.', pot: 1.8, ac: 3, cap: 1, old: 1.6 },
  cut: { n: 'Cutting costs', d: 'Money is tight: cheaper deals, no big names.', pot: 1, ac: 1, cap: 2.6, old: 1 }
};
function mktPlans(S) {
  var ord = S.teams.slice().sort(function (a, b) { return teamPower(b) - teamPower(a); }), rk = {}; ord.forEach(function (t, i) { rk[t.id] = i + 1; });
  S.teams.forEach(function (t) {
    var f = t.fin, cap = f ? finPayCap(t) : 99, pr = typeof teamPayroll === 'function' ? teamPayroll(S, t) : { dr: 0, st: 0 }, amb = t.dev && t.dev.tp ? t.dev.tp.amb : 1, pl;
    if (f && (f.cash < 0 || pr.dr + pr.st > 0.95 * cap)) pl = 'cut';
    else if (rk[t.id] <= 4 || (rk[t.id] <= 7 && amb >= 2)) pl = 'win';
    else if (rk[t.id] >= 8) pl = 'rebuild';
    else pl = 'build';
    t.plan = pl;
  });
}
/* nilai calon di mata sesebuah team */
function mktScore(S, t, c, N, wPot) {
  var d = c.d, o = ovr(d) + hgauss(t.id + '|o|' + d.name + '|' + N) * 0.8, sc = o + evaluationMarketBonus(S, d), PL = PLAN[t.plan] || PLAN.build;
  if (d.age < (d.pk || 28)) { var pe = estPot(t, d, N); sc += wPot * PL.pot * Math.max(0, pe - ovr(d)) * clamp((28 - d.age) / 6, 0.3, 1.2); }
  if (c.from === t.id) sc += d.sk ? -9 : (d.miss || 0) >= 2 ? -4 : d.obj && d.obj.res === 'met' ? 4.5 : 3;
  if (c.k === 'jr' || c.k === 'new') { if (d.acad === t.id) sc += (1.5 + 4 * (t.dev.acad || 0.5)) * (0.6 + 0.4 * PL.ac); else if (d.acad != null) sc -= 5; }
  if (d.age >= 36) sc -= 4 * PL.old; else if (d.age >= 34) sc -= 2 * PL.old; else if (d.age >= 31 && PL.old > 1) sc -= 1.5;
  if (MKTCTX && t.fin) { var proj = (MKTCTX.pay[t.id] || 0) + mktPay(c), cap = finPayCap(t); if (proj > cap) sc -= (proj - cap) * 0.35 * PL.cap; if (PL.cap > 1) sc -= mktPay(c) * 0.12; }   /* tak mampu gaji */
  return sc;
}
var MKTCTX = null;
function mktPay(c) { var d = c.d; return payFor(ovr(d), (c.k === 'jr' || c.k === 'new' || (d.cs && d.cs.starts < 20)) ? 0.35 : 1); }
function mktLog(S, e) { S.mkt.moves.push(e); }
function retirePerson(S, d, reason) {
  S.retired.push({ uid: personId(S, d), name: d.name, nat: d.nat, age: d.age, cs: d.cs, sh: d.sh, num: d.num, code: d.code, s: S.season, r: reason });
}

/* opsyen tahun tambahan: kontrak yang tamat musim ini disambung setahun kalau pihak pemegang opsyen mahu */
function mktOptions(S, N) {
  var rank = {}; S.teams.slice().sort(function (a, b) { return teamPower(b) - teamPower(a); }).forEach(function (t, i) { rank[t.id] = i + 1; });
  S.drivers.forEach(function (d) {
    var c = d.con; if (d.id === S.pi || d.vac || !c || !c.opt || c.opt.used || c.end !== N - 1) return;
    var t = S.teams[d.team], o = ovr(d), ok;
    if (c.opt.by === 'team') ok = ((d.obj && d.obj.res === 'met') || o >= 80) && (d.miss || 0) < 2 && !(t.fin && t.fin.cash < -2 && c.pay >= 8);
    else ok = rank[t.id] <= 4 || (o < 80 && rank[t.id] <= 7);
    c.opt.used = true; c.opt.ex = ok;
    if (ok) { c.end++; c.pay = Math.min(48, Math.round(c.pay * 1.1 * 10) / 10); }
    S.mkt.moves.push({ k: ok ? 'optx' : 'optn', n: d.name, nat: d.nat, a: d.age, o: o, f: t.id, by: c.opt.by, u: c.end });
  });
}
/* pemecatan dalam kontrak: tersasar objektif berulang kali, atau team terlalu miskin untuk gaji tinggi */
function mktSack(S, N) {
  S.teams.forEach(function (t) {
    var best = null, bp = 0, why = null;
    S.drivers.forEach(function (d) {
      if (d.team !== t.id || d.id === S.pi || d.vac || !d.con || d.con.end < N) return;
      var m = d.miss || 0, p = m >= 3 ? 0.5 : m === 2 ? 0.18 : 0, w = 'perf';
      if (d.age <= 22) p *= 0.5; if (ovr(d) >= 86) p *= 0.4;
      if (t.fin && t.fin.cash < -2 && d.con.pay >= 8 && p < 0.3) { p = 0.3; w = 'budget'; }
      if (p > bp) { bp = p; best = d; why = w; }
    });
    if (best && rnd() < bp) { best.con.end = S.season; best.sk = { s: N, why: why }; mktLog(S, { k: 'sack', n: best.name, nat: best.nat, a: best.age, o: ovr(best), f: t.id, w: why }); }
  });
}
function mktRun(S, dlog) {
  if (S.mode === 'pro') { worldNewSeason(S, dlog); return; }
  var N = S.season + 1, P = S.pi;
  mktInit(S);
  S.mkt = { s: N, moves: [], staff: [], gold: null, seen: false };
  if (S.pbuy) { S.mkt.moves.push({ k: 'pbuy', n: S.pbuy.n, nat: S.pbuy.nat, o: S.pbuy.o, a: S.pbuy.a, t: S.pbuy.t, c: S.pbuy.cost, pl: S.drivers[P].name }); S.pbuy = null; }
  S.reserves = S.reserves || [];
  S.reserves.forEach(function (r) { r.age++; r.rs = (r.rs || 0) + 1; if (typeof drvGrow === 'function') drvGrow(r, 0.85); });
  S.drivers.forEach(function (d) { if (d.hy) d.hy *= 0.7; });
  S.juniors.forEach(function (j) { if (j.hy) j.hy *= 0.88; });
  /* generasi emas: kumpulan junior luar biasa setiap 5-7 tahun */
  if (S.goldAt == null) S.goldAt = S.season + 4 + Math.floor(rnd() * 3);
  if (N >= S.goldAt) {
    var gn = 3 + Math.floor(rnd() * 2), gl = [];
    for (var g = 0; g < gn; g++) { var j = newJunior(S, 16 + Math.floor(rnd() * 2), { pot: Math.round(rr(90, 95)) }); j.gold = true; S.juniors.push(j); gl.push(j.name); }
    S.mkt.gold = gl; S.goldAt = N + 5 + Math.floor(rnd() * 3);
    if (dlog) dlog.push({ gold: gl });
  }
  mktPlans(S);
  mktOptions(S, N);
  mktSack(S, N);
  /* susunan draft: team terbaik pilih dulu */
  var ord = S.teams.map(function (t) { return { t: t, v: teamPower(t) + t.prestige * 0.8 + gauss() * 1.2 }; }).sort(function (a, b) { return b.v - a.v; }).map(function (x) { return x.t; });
  var wPot = {}; ord.forEach(function (t, i) { wPot[t.id] = 0.15 + 0.035 * i; });
  var keep = {}, pool = [], open = {}, picks = {};
  S.teams.forEach(function (t) { keep[t.id] = []; picks[t.id] = []; });
  S.drivers.forEach(function (d) {
    if (d.vac) return;
    if (d.id === P || (d.con && d.con.end >= N)) keep[d.team].push(d);
    else pool.push({ d: d, k: 'exp', from: d.team });
  });
  S.teams.forEach(function (t) {   /* lebih 2 orang? lebihan masuk pasaran */
    keep[t.id].sort(function (a, b) { return (b.id === P ? 99 : ovr(b)) - (a.id === P ? 99 : ovr(a)); });
    while (keep[t.id].length > 2) { var x = keep[t.id].pop(); pool.push({ d: x, k: 'exp', from: t.id }); }
  });
  S.reserves.forEach(function (r) { pool.push({ d: r, k: 'res', from: r.exTeam == null ? -1 : r.exTeam }); });
  S.juniors.forEach(function (j) { if (j.age >= 18 && ovr(j) >= 66) pool.push({ d: j, k: 'jr', from: -1 }); });
  MKTCTX = { pay: {} };
  S.teams.forEach(function (t) {
    var p = 0; keep[t.id].forEach(function (d) { p += (d.con ? d.con.pay : 0); });
    [t.dev.tp, t.dev.tdp].forEach(function (x) { if (x && x.con) p += x.con.pay; });
    MKTCTX.pay[t.id] = p;
  });
  var need = 0; S.teams.forEach(function (t) { open[t.id] = 2 - keep[t.id].length; need += open[t.id]; });
  while (pool.length < need + 3) pool.push({ d: newJunior(S, 19), k: 'new', from: -1 });
  for (var guard = 0; guard < 40; guard++) {
    var any = false;
    ord.forEach(function (t) {
      if (open[t.id] <= 0 || !pool.length) return;
      var best = null, bs = -1e9;
      pool.forEach(function (c) { var s = mktScore(S, t, c, N, wPot[t.id]); if (s > bs) { bs = s; best = c; } });
      pool.splice(pool.indexOf(best), 1); picks[t.id].push(best); open[t.id]--; any = true; MKTCTX.pay[t.id] += mktPay(best);
    });
    if (!any) break;
  }
  MKTCTX = null;
  /* susunan akhir */
  var fin = [];
  S.teams.forEach(function (t) {
    keep[t.id].forEach(function (d) { fin.push({ d: d, t: t.id, c: null }); });
    picks[t.id].forEach(function (c) { fin.push({ d: c.d, t: t.id, c: c }); });
  });
  var finSet = fin.map(function (x) { return x.d; });
  var freeSlots = [], leavers = [];
  S.drivers.forEach(function (d, idx) { if (finSet.indexOf(d) < 0) { freeSlots.push(idx); leavers.push(d); } });
  var enter = fin.filter(function (x) { return S.drivers.indexOf(x.d) < 0; });
  if (enter.length !== freeSlots.length) throw new Error('mkt slot mismatch ' + enter.length + '/' + freeSlots.length);
  var oldTeam = {}; S.drivers.forEach(function (d) { oldTeam[d.id] = d.team; });
  /* 1) pemandu sedia ada: sambung / pindah */
  fin.forEach(function (x) {
    var d = x.d; if (S.drivers.indexOf(d) < 0) return;
    if (!x.c) return;                                  /* ada kontrak, kekal */
    var f = d.team;
    d.con = conMake(S, d, { from: N }); d.sk = null;
    if (f === x.t) { if (d.id !== P) mktLog(S, { k: 'resign', n: d.name, nat: d.nat, a: d.age, o: ovr(d), t: x.t, u: d.con.end }); }
    else { d.team = x.t; d.miss = 0; mktLog(S, { k: 'move', n: d.name, nat: d.nat, a: d.age, o: ovr(d), f: f, t: x.t, u: d.con.end }); }
  });
  /* 2) yang keluar: simpanan atau bersara */
  leavers.forEach(function (d) {
    if (d.vac) return;
    var o = ovr(d);
    if (d.age >= 35 || (o < 70 && d.age >= 30)) { retirePerson(S, d, 'nodeal'); mktLog(S, { k: 'retire2', n: d.name, a: d.age, f: d.team }); if (dlog) dlog.push({ retire: d.name, age: d.age, t: d.team, wins: d.cs.wins + d.wins, titles: d.cs.titles, nodeal: true }); }
    else { var f = d.team; d.exTeam = f; d.team = -1; d.id = -1; d.rs = 0; d.con = null; d.pts = 0; d.wins = 0; d.pods = 0; d.fp = []; S.reserves.push(d); mktLog(S, { k: 'drop', n: d.name, nat: d.nat, a: d.age, o: o, f: f }); }
  });
  /* 3) yang masuk: simpanan / junior / baru */
  enter.forEach(function (x, i) {
    var slot = freeSlots[i], c = x.c, d = c.d, nd;
    if (c.k === 'res') {
      S.reserves.splice(S.reserves.indexOf(d), 1); d.id = slot; d.team = x.t; d.rs = 0; d.exTeam = null;
      d.pts = 0; d.wins = 0; d.pods = 0; d.fp = []; d.miss = 0; d.con = conMake(S, d, { from: N }); nd = d;
      mktLog(S, { k: 'sign', n: d.name, nat: d.nat, a: d.age, o: ovr(d), f: c.from, t: x.t, u: d.con.end });
    } else {
      if (c.k === 'jr') S.juniors.splice(S.juniors.indexOf(d), 1);
      nd = juniorToDriver(S, d, slot, x.t); nd.con = conMake(S, nd, { from: N, len: 2 + Math.floor(rnd() * 2) });
      mktLog(S, { k: 'rookie', n: nd.name, nat: nd.nat, a: nd.age, o: ovr(nd), t: x.t, ac: d.acad === x.t, ch: !!(d.jr && d.jr.titles), u: nd.con.end, g: !!d.gold });
      if (dlog) dlog.push({ debut: nd.name, nat: nd.nat, t: x.t, jt: d.jr ? d.jr.titles : 0, ac: d.acad === x.t });
    }
    if (S.rival && S.rival.di === slot) S.rival = null;
    S.drivers[slot] = nd;
  });
  /* simpanan yang tak dapat tempat: sabar 3 musim */
  S.reserves = S.reserves.filter(function (r) {
    if (r.age >= 34 || (r.rs || 0) >= 3 || ovr(r) < 68) { retirePerson(S, r, 'res'); return false; }
    return true;
  }).sort(function (a, b) { return ovr(b) - ovr(a); }).slice(0, 5);
  /* junior: buang yang terlalu tua, tambah budak baru */
  S.juniors = S.juniors.filter(function (j) { return j.age <= 23; });
  while (S.juniors.length < 10) { var nj = newJunior(S, 16 + Math.floor(rnd() * 2)); S.juniors.push(nj); }
  mktStaff(S, N, ord);
  S.mkt.stay = fin.filter(function (x) { return !x.c; }).length;
}

/* ===== pasaran staf: Technical Director & Team Principal ===== */
function mktStaff(S, N, ord) {
  var used = {}; S.teams.forEach(function (t) { used[t.dev.tdp && t.dev.tdp.name] = 1; used[t.dev.tp && t.dev.tp.name] = 1; });
  /* technical director */
  var tdPool = [], tdOpen = {};
  S.teams.forEach(function (t) { var p = t.dev.tdp; if (p && p.con && p.con.end < N) { p.skill = t.dev.td; tdPool.push({ p: p, from: t.id }); tdOpen[t.id] = 1; } });
  var nOpen = Object.keys(tdOpen).length;
  for (var i = 0; i < 2; i++) { var nm = shuffle(TDNAMES.filter(function (n) { return !used[n]; }))[0] || pick(TDNAMES); used[nm] = 1; tdPool.push({ p: { name: nm, age: Math.round(rr(37, 58)), skill: clamp(1 + gauss() * 0.06, 0.9, 1.1) }, from: -1 }); }
  for (var g = 0; g < 30 && nOpen > 0; g++) {
    var any = false;
    ord.forEach(function (t) {
      if (!tdOpen[t.id] || !tdPool.length) return;
      var best = null, bs = -1e9;
      tdPool.forEach(function (c) { var s = c.p.skill + (c.from === t.id ? 0.03 : 0) + hgauss(t.id + c.p.name + N) * 0.02; if (s > bs) { bs = s; best = c; } });
      tdPool.splice(tdPool.indexOf(best), 1); tdOpen[t.id] = 0; nOpen--; any = true;
      var p = best.p; p.con = staffCon(S, p.skill, false); p.con.end = N + p.con.len - 1;
      var old = t.dev.tdp;
      t.dev.tdp = p; t.dev.td = clamp(p.skill, 0.8, 1.2);
      if (best.from === t.id) S.mkt.staff.push({ k: 'tdre', n: p.name, t: t.id });
      else S.mkt.staff.push({ k: 'td', n: p.name, f: best.from, t: t.id, old: old ? old.name : '' });
    });
    if (!any) break;
  }
  /* team principal: kebanyakan disambung, sebahagian dilepaskan */
  var tpPool = [], tpOpen = {};
  S.teams.forEach(function (t) {
    var p = t.dev.tp; if (!p || !p.con || p.con.end >= N) return;
    if (rnd() < 0.78) { p.con = staffCon(S, p.skill, false); p.con.end = N + p.con.len - 1; S.mkt.staff.push({ k: 'tpre', n: p.name, t: t.id }); }
    else { tpPool.push({ p: p, from: t.id }); tpOpen[t.id] = 1; }
  });
  nOpen = Object.keys(tpOpen).length;
  for (var q = 0; q < 2 && nOpen > 0; q++) { var np = newTP(S.teams[0]); var tries = 0; while (used[np.name] && tries++ < 20) np = newTP(S.teams[0]); used[np.name] = 1; np.age = Math.round(rr(40, 60)); tpPool.push({ p: np, from: -1 }); }
  for (var g2 = 0; g2 < 30 && nOpen > 0; g2++) {
    var any2 = false;
    ord.forEach(function (t) {
      if (!tpOpen[t.id] || !tpPool.length) return;
      var best = null, bs = -1e9;
      tpPool.forEach(function (c) { var s = c.p.skill + (c.from === t.id ? 0.03 : 0) + hgauss(t.id + c.p.name + N) * 0.04; if (s > bs) { bs = s; best = c; } });
      tpPool.splice(tpPool.indexOf(best), 1); tpOpen[t.id] = 0; nOpen--; any2 = true;
      var p = best.p; p.con = staffCon(S, p.skill, false); p.con.end = N + p.con.len - 1;
      var old = t.dev.tp; t.dev.tp = p;
      S.mkt.staff.push(best.from === t.id ? { k: 'tpre', n: p.name, t: t.id } : { k: 'tp', n: p.name, f: best.from, t: t.id, old: old ? old.name : '' });
    });
    if (!any2) break;
  }
  if (typeof setTargets === 'function') setTargets(S);
}

/* ===== berita: khabar angin dalam musim + pengesahan ===== */
function mktRumours(S, rd) {
  var P = S.pi, N = S.season + 1, exp = S.drivers.filter(function (d) { return d.id !== P && d.con && d.con.end <= S.season; });
  var rank = {}; S.teams.slice().sort(function (a, b) { return teamPower(b) - teamPower(a); }).forEach(function (t, i) { rank[t.id] = i; });
  if (!S.rm || S.rm.s !== S.season) S.rm = { s: S.season, n: {} };
  var byO = exp.slice().sort(function (a, b) { return ovr(b) - ovr(a); });
  if (rd === seasonMilestone(S, 3) && byO.length) byO.slice(0, 2).forEach(function (d) { S.rm.n[d.name] = 1; pushNews(S, { k: 'cexp', n: d.name, t: d.team }); });
  if ((rd === seasonMilestone(S, 5) || rd === seasonMilestone(S, 8)) && byO.length) {
    var cand = byO.filter(function (x) { return !S.rm.n[x.name] || rd === seasonMilestone(S, 8) && S.rm.n[x.name] === 1; }).slice(0, 4), d = cand[Math.floor(rnd() * Math.min(cand.length, 3))], best = null, bs = -1e9;
    if (!d) return;
    S.teams.forEach(function (t) {
      if (t.id === d.team) return;
      var seats = S.drivers.filter(function (x) { return x.team === t.id && (x.id === P ? false : x.con && x.con.end <= S.season); }).length;
      if (!seats) return;
      var s = mktScore(S, t, { d: d, k: 'exp', from: d.team }, N, 0.15 + 0.035 * rank[t.id]) + gauss() * 1.5;
      if (s > bs) { bs = s; best = t; }
    });
    if (best && ovr(d) >= 72) { S.rm.n[d.name] = 2; pushNews(S, { k: 'rumd', n: d.name, t: best.id, f: d.team }); }
  }
  if (rd === seasonMilestone(S, 10)) {
    var ts = S.teams.filter(function (t) { return S.drivers.some(function (x) { return x.team === t.id && x.id !== P && x.con && x.con.end <= S.season; }); }).map(function (t) { return t.id; });
    pushNews(S, { k: 'seats', c: exp.length + (S.contract === 1 ? 1 : 0), ts: ts.slice(0, 5) });
  }
  if (S.contract === 1 && !S.sit && (rd === seasonMilestone(S, 5) || rd === seasonMilestone(S, 9))) {
    var ds = driverStandings(S), pos = ds.indexOf(S.drivers[P]) + 1, offs = typeof makeOffers === 'function' ? makeOffers(S, pos) : [];
    pushNews(S, { k: 'mine', ts: offs.filter(function (o) { return !o.renew; }).map(function (o) { return o.team; }) });
  }
}
function mktNews(S) {
  var m = S.mkt; if (!m) return;
  var mine = S.drivers[S.pi].team, rank = {}; S.teams.slice().sort(function (a, b) { return teamPower(b) - teamPower(a); }).forEach(function (t, i) { rank[t.id] = i; });
  var L = [];
  m.moves.forEach(function (x) {
    if (x.k === 'pbuy') { L.push({ v: 300, o: { k: 'pbuy', n: x.n, t: x.t, c: x.c, pl: x.pl } }); return; }
    if (x.k === 'optx' || x.k === 'optn') { if (x.o >= 82 || x.f === mine) L.push({ v: (x.o || 70) + (x.f === mine ? 12 : 0) - 6, o: { k: x.k === 'optx' ? 'opx' : 'opn', n: x.n, t: x.f, by: x.by, u: x.u } }); return; }
    if (x.k === 'sack') { L.push({ v: (x.o || 70) + 8 + (x.f === mine ? 12 : 0), o: { k: 'csack', n: x.n, t: x.f, w: x.w, a: x.a } }); return; }
    var imp = (x.o || 70) + (x.t != null && rank[x.t] < 4 ? 4 : 0) + (x.t === mine || x.f === mine ? 12 : 0);
    if (x.k === 'move') L.push({ v: imp + 6, o: { k: 'cmove', n: x.n, t: x.t, f: x.f, u: x.u, o: x.o } });
    else if (x.k === 'sign') L.push({ v: imp - 4, o: { k: 'csign', n: x.n, t: x.t, u: x.u } });
    else if (x.k === 'resign' && (x.o >= 84 || x.t === mine || rank[x.t] < 3)) L.push({ v: imp - 10, o: { k: 'cre', n: x.n, t: x.t, u: x.u } });
    else if (x.k === 'drop') L.push({ v: imp - 2, o: { k: 'cdrop', n: x.n, t: x.f, a: x.a } });
  });
  m.staff.forEach(function (x) { if (x.k === 'td' || x.k === 'tp') L.push({ v: 60 + (x.t === mine || x.f === mine ? 20 : 0), o: { k: 'cstaff', z: x.k, n: x.n, t: x.t, f: x.f } }); });
  if (m.gold) L.push({ v: 100, o: { k: 'gold', ns: m.gold } });
  var jh = S.juniors.slice().sort(function (a, b) { return scoutPot(b) - scoutPot(a); })[0];
  if (jh && scoutPot(jh) >= 88 && !jh.gold) L.push({ v: 55, o: { k: 'hype', n: jh.name, nat: jh.nat, st: potStars(scoutPot(jh)) } });
  if (S.teams[0].fin) { var bt = S.teams.slice().sort(function (a, b) { return b.fin.fund - a.fin.fund; }); L.push({ v: 76, o: { k: 'budget', t: bt[0].id, z: bt[bt.length - 1].id, a: Math.round(bt[0].fin.fund), b: Math.round(bt[bt.length - 1].fin.fund), cap: bt[0].fin.fund >= FIN.cap * 0.97 } }); }
  L.sort(function (a, b) { return a.v - b.v; });
  L.slice(-9).forEach(function (x) { x.o.s = S.season + 1; x.o.r = 0; pushNews(S, x.o); });
}

/* ===== UI: ringkasan musim transfer ===== */
function mktCard(cls) {
  var m = S.mkt; if (!m || m.s !== S.season || m.seen) return '';
  var T = function (id) { return id == null || id < 0 ? 'Free agent' : S.teams[id].short; };
  var tg = function (id) { var t = S.teams[id]; return '<span class="tag" style="--tc:' + t.color + '">' + t.short + '</span>'; };
  var mv = m.moves, mine = S.drivers[S.pi].team;
  var rows = function (arr, f) { return arr.length ? '<div class="mk-g">' + arr.map(f).join('') + '</div>' : ''; };
  var mover = mv.filter(function (x) { return x.k === 'move' || x.k === 'sign'; }).sort(function (a, b) { return b.o - a.o; });
  var rk = mv.filter(function (x) { return x.k === 'rookie'; });
  var out = mv.filter(function (x) { return x.k === 'retire2' || x.k === 'drop'; });
  var h = '<div class="' + (cls || '') + ' card mk"><div class="mk-h"><span class="mk-b">SILLY<b>SEASON</b></span><span class="mk-s">Season ' + m.s + ' line-ups</span></div>';
  if (m.gold) h += '<div class="mk-gold">★ A golden generation has arrived in the Apex Junior Series: ' + m.gold.map(esc).join(', ') + '.</div>';
  if (mover.length) h += '<h5>On the move</h5>' + rows(mover, function (x) { return '<div class="mk-r"><b>' + esc(x.n) + '</b><span>' + flagE(x.nat) + ' ' + x.o + ' OVR</span><em>' + (x.f != null && x.f >= 0 ? tg(x.f) : '<small>FA</small>') + ' → ' + tg(x.t) + '</em></div>'; });
  if (rk.length) h += '<h5>New faces</h5>' + rows(rk, function (x) { return '<div class="mk-r"><b>' + esc(x.n) + '</b><span>' + flagE(x.nat) + ' age ' + x.a + (x.ac ? ' · own academy' : '') + (x.ch ? ' · junior champion' : '') + '</span><em>' + tg(x.t) + '</em></div>'; });
  if (out.length) h += '<h5>Out of a seat</h5>' + rows(out, function (x) { return '<div class="mk-r"><b>' + esc(x.n) + '</b><span>age ' + x.a + (x.k === 'retire2' ? ' · retires' : ' · reserve') + '</span><em>' + (x.f != null && x.f >= 0 ? tg(x.f) : '') + '</em></div>'; });
  if (m.staff.some(function (x) { return x.k === 'td' || x.k === 'tp'; })) h += '<h5>Staff</h5>' + rows(m.staff.filter(function (x) { return x.k === 'td' || x.k === 'tp'; }), function (x) { return '<div class="mk-r"><b>' + esc(x.n) + '</b><span>' + (x.k === 'td' ? 'Technical director' : 'Team principal') + '</span><em>' + (x.f >= 0 ? tg(x.f) + ' → ' : '') + tg(x.t) + '</em></div>'; });
  h += '<div class="mk-f"><p class="dim" style="font-size:12.5px;margin:0 0 10px">' + (m.stay != null ? m.stay + ' of 19 rivals stayed put under contract or re-signed.' : '') + '</p><button class="btn wide" data-act="mkt-x">Got it</button></div></div>';
  return h;
}
if (typeof A !== 'undefined') A['mkt-x'] = function () { if (S.mkt) S.mkt.seen = true; save(); render(); };
