'use strict';
/* ===== Logik karier: kedudukan, XP, R&D, musim, kontrak ===== */
var RDNAME = { aero: 'Aero', engine: 'Engine', chassis: 'Chassis', rel: 'Reliability' };
/* countback: mata sama -> paling banyak menang, kemudian P2, P3... sampai P20 (pemandu tanpa mata disusun ikut keputusan terbaik) */
function cbCmp(a, b) { var x = a.fp || [], y = b.fp || []; for (var i = 0; i < 20; i++) { var df = (y[i] || 0) - (x[i] || 0); if (df) return df; } return 0; }
function driverStandings(S) { return S.drivers.slice().sort(function (a, b) { return b.pts - a.pts || b.wins - a.wins || cbCmp(a, b) || b.pods - a.pods || a.id - b.id; }); }
function teamStandings(S) { return S.teams.slice().sort(function (a, b) { return b.pts - a.pts || b.wins - a.wins || a.id - b.id; }); }
function teamPower(t) { return (t.car.aero + t.car.engine + t.car.chassis + t.car.rel) / 4; }
function teamRank(S, id) { var l = S.teams.slice().sort(function (a, b) { return teamPower(b) - teamPower(a); }); for (var i = 0; i < l.length; i++) if (l[i].id === id) return i + 1; return 10; }
function rating(d) { return d.pace * 0.4 + d.cons * 0.15 + d.race * 0.2 + d.wet * 0.1 + d.tyre * 0.15; }
function ageMul(S) { var p = S && S.drivers && S.drivers[S.pi]; return p && p.age > 32 ? 1 + 0.15 * (p.age - 32) : 1; }
function skillCost(v, S) { return Math.ceil((v - 40) / 2.5 * ageMul(S)); }
function buySkill(S, k) {
  var p = S.drivers[S.pi], cost = skillCost(p[k], S);
  if (p[k] >= 99 || S.xp < cost) return false;
  S.xp -= cost; p[k]++; return true;
}

function developTeams(S) {
  var logs = [], mine = S.drivers[S.pi].team;
  S.teams.forEach(function (t) {
    var isMine = t.id === mine;
    var focus = isMine ? S.rd : pick(['aero', 'engine', 'chassis', 'rel']);
    var mult = 0.55 + t.prestige * 0.09;
    if (isMine) mult *= 1 + (S.drivers[S.pi].fb - 70) / 150;
    var gain = mult * rr(0.4, 1.6) * (100 - t.car[focus]) / 30;
    t.car[focus] = clamp(t.car[focus] + gain, 40, 99);
    if (isMine) logs.push('+' + gain.toFixed(1) + ' ' + RDNAME[focus]);
  });
  return logs;
}

function ensureDev(S) { if (typeof initDev === 'function' && (!S.teams[0].dev || !S.target)) initDev(S); }
var PNAME = { aero: 'aero', engine: 'engine', chassis: 'chassis', rel: 'reliability' };
/* pakej naik taraf dalam musim (pusingan 3, 6, 9). Pulang: teks untuk pasukan pemain; berita pasukan lain di S.news */
function devRound(S) {
  ensureDev(S);
  var log = [], mine = S.drivers[S.pi].team, out = [];
  devInSeason(S, S.round + 1, log);
  S.news = S.news || [];
  log.forEach(function (e) {
    if (e.rumour) { if (e.t !== mine && (e.big ? rnd() < 0.6 : rnd() < 0.15)) pushNews(S, { k: 'rumour', t: e.t, p: e.k, big: e.big }); return; }
    if (e.broke) { pushNews(S, { k: 'broke', t: e.t, p: e.k }); return; }
    if (e.reg || e.g == null) { if (e.bank) pushNews(S, { k: 'bank', t: e.t }); return; }
    var t = S.teams[e.t], txt = e.g >= 0 ? '+' + e.g.toFixed(1) + ' ' + RDNAME[e.k] + (e.big ? ' (major package)' : e.rush ? ' (rushed)' : '') : 'The ' + (e.rush ? 'rushed ' : '') + PNAME[e.k] + ' package failed (' + e.g.toFixed(1) + ')';
    if (e.t === mine) out.push(txt);
    else if (e.g < 0 && S.teams[e.t].dev.staff < 0.92) pushNews(S, { k: 'upgf2', t: e.t, p: e.k });
    else if (e.g < 0 || e.g > 2.2 || e.big) pushNews(S, { k: e.g < 0 ? 'upgf' : 'upg', t: e.t, p: e.k, g: +e.g.toFixed(1), rush: e.rush, big: e.big });
  });
  return out;
}
function finishRace(S, R, mg) {
  R.cls.forEach(function (x) {
    var d = x.car.d, pts = 0;
    if (!x.dnf && x.pos <= 10) pts = PTS[x.pos - 1];
    if (R.fl.di === x.car.di && !x.dnf && x.pos <= 10) pts += 1;
    x.pts = pts; d.pts += pts; d.starts++;
    if (x.car.grid === 1) d.poles++;
    if (!x.dnf) { d.fp = d.fp || []; d.fp[x.pos - 1] = (d.fp[x.pos - 1] || 0) + 1; }
    if (x.dnf) d.dnf++; else { if (x.pos === 1) { d.wins++; S.teams[d.team].wins++; } if (x.pos <= 3) d.pods++; }
    if (R.fl.di === x.car.di) d.fl++;
    S.teams[d.team].pts += pts;
    if (typeof drvPerf === 'function') drvPerf(S, d, x);
  });
  var P = R.cls.filter(function (x) { return x.car.isP; })[0];
  S.live = null;
  /* rekod keputusan penuh (nama disimpan sebab slot pemandu boleh diganti musim depan) */
  S.rr = S.rr || [];
  S.rr.push({ s: S.season, r: S.round, ci: R.ci, fl: R.fl.di >= 0 && S.drivers[R.fl.di] ? S.drivers[R.fl.di].name : null, c: R.cls.map(function (x) { var d = x.car.d; return [d.name, d.team, x.dnf ? 0 : x.pos, x.pts || 0, x.car.grid, x.car.isP ? 1 : 0, d.nat || '']; }) });
  if (S.rr.length > 400) S.rr = S.rr.slice(-400);
  if (typeof thRecord === 'function') thRecord(S, R, S.sit ? null : P);
  var xp = 0;
  if (!S.sit) {
  S.results.push({ round: S.round, ci: R.ci, grid: P.car.grid, pos: P.pos, dnf: P.dnf ? P.car.dnf : null, pts: P.pts, fl: R.fl.di === S.pi });
  var cr = S.career; cr.starts++; cr.pts += P.pts;
  if (P.dnf) cr.dnf++; else { if (P.pos === 1) cr.wins++; if (P.pos <= 3) cr.pods++; }
  if (P.car.grid === 1) cr.poles++;
  if (R.fl.di === S.pi) cr.fl++;
  if (typeof fameRace === 'function') fameRace(S, P, R.ci);
  if (typeof tmRace === 'function') tmRace(S);
  if (typeof facRace === 'function') facRace(S);
  var expected = teamRank(S, P.car.team) * 2 - 0.5; xp = 8;
  if (!P.dnf) {
    xp += clamp(Math.round((expected - P.pos) * 1.6), -4, 14);
    if (P.pts > 0) xp += 2;
    if (P.pos === 1) xp += 10; else if (P.pos <= 3) xp += 5;
  } else xp -= 3;
  if (R.fl.di === S.pi) xp += 3;
  xp += Math.round(mg || 0);
  xp = clamp(xp, 3, 45);
  S.xp += xp;
  }
  var rd = (typeof devInSeason === 'function') ? devRound(S) : developTeams(S);
  var pod = R.cls.filter(function (x) { return !x.dnf; }).slice(0, 3).map(function (x) { return x.car.di; });
  pushNews(S, { k: 'race', c: CIRCUITS[R.ci].name, w: pod, me: P.dnf ? 0 : P.pos });
  if (typeof mktRumours === 'function') mktRumours(S, S.round + 1);
  if (rd.length) S.rdLog.unshift('Season ' + S.season + ' · ' + CIRCUITS[R.ci].name + ': ' + rd.join(', '));
  S.rdLog = S.rdLog.slice(0, 12);
  S.round++;
  return { P: P, xp: xp, rd: rd };
}

function endSeason(S) {
  if (S.sit && typeof endSit === 'function') return endSit(S);
  var ds = driverStandings(S), ts = teamStandings(S), p = S.drivers[S.pi];
  var pos = ds.indexOf(p) + 1;
  var rec = { season: S.season, pos: pos, pts: p.pts, wins: p.wins, pods: p.pods, team: S.teams[p.team].short, tcol: S.teams[p.team].color, champ: ds[0].name, champTeam: ts[0].name, age: p.age };
  S.hist.push(rec);
  if (pos === 1) S.career.titles++;
  if (typeof drvRecord === 'function') drvRecord(S);
  S.lastSummary = { rec: rec, ds: ds.map(function (d) { return d.id; }), ts: ts.map(function (t) { return t.id; }) };
  S.offers = null; S.fired = null; S.paddock = null;
  if (typeof finBonus === 'function') finBonus(S);
  if (typeof repEval === 'function') repEval(S);
  S.lastSummary.spon = typeof sponEval === 'function' ? sponEval(S) : null;
  S.lastSummary.test = typeof testRun === 'function' ? testRun(S) : null;
  var vd = typeof objVerdict === 'function' ? objVerdict(S) : { renew: true, terminate: false };
  S.lastSummary.obj = p.obj ? { txt: p.obj.txt, res: p.obj.res, pos: p.obj.pos, role: p.obj.role } : null;
  /* opsyen team untuk tahun tambahan */
  var cp = p.con; S.lastSummary.opt = null;
  if (S.contract === 1 && cp && cp.opt && !cp.opt.used) {
    cp.opt.used = true;
    var take = vd.renew && ((p.obj && p.obj.res === 'met') || ovr(p) >= 84);
    if (take) { cp.pay = Math.min(48, Math.round(cp.pay * 1.1 * 10) / 10); S.contract = 2; S.lastSummary.opt = { x: true, pay: cp.pay }; }
    else S.lastSummary.opt = { x: false };
  }
  var needOffers = S.contract - 1 <= 0 || vd.terminate;
  if (needOffers && !vd.renew) { S.fired = { why: vd.why, team: p.team, term: vd.terminate }; if (typeof repFired === 'function') repFired(S, S.fired); }
  S.lastSummary.warn = !needOffers && (p.miss || 0) >= 2;
  if (needOffers) S.offers = makeOffers(S, pos, vd, true);
  return rec;
}
function makeOffers(S, pos, vd, full) {
  var p = S.drivers[S.pi], hasRep = typeof repStance === 'function';
  var V = rating(p) + (pos <= 3 ? 4 : pos <= 6 ? 2 : 0) + Math.min(3, p.wins * 0.6) + ((S.morale == null ? 50 : S.morale) - 50) / 12;
  var pd = { burn: [], cautious: [], bold: [], warm: [] }, st = {};
  S.teams.forEach(function (t) {
    if (t.id === p.team && !(vd && !vd.renew)) return;
    var x = hasRep ? repStance(S, t) : { ok: true, dV: 0, tag: null }; st[t.id] = x;
    if (x.ok && x.tag !== 'cautious' && x.tag !== 'bold' && x.tag !== 'warm') return;
    if (!x.ok && x.tag !== 'burn') x.tag = 'cautious';
    if (x.tag && pd[x.tag]) pd[x.tag].push(t.id);
  });
  var cand = [];
  S.teams.forEach(function (t) {
    if (t.id === p.team || !st[t.id] || !st[t.id].ok) return;
    var si = seatInfo(S, t.id), thr = 62 + t.prestige * 2.4, buy = null;
    if (si.open < 1) {   /* no free seat: the team would have to buy out its weaker driver, and can only afford that sometimes */
      var wk = si.kept.slice().sort(function (a, b) { return ovr(a) - ovr(b); })[0], cost = wk ? buyCost(S, wk) : 0;
      if (!wk || t.fin && (t.fin.cash < -2 || cost > 0.2 * t.fin.fund) || ovr(p) < ovr(wk) + 2) return;
      thr += 3; buy = { id: wk.id, n: wk.name, o: ovr(wk), cost: cost };
    }
    if (V + st[t.id].dV + (typeof sponV === 'function' ? sponV(S, t) : 0) + rr(-1.5, 2.5) >= thr) cand.push({ t: t, buy: buy });
  });
  var offers = cand.sort(function (a, b) { return b.t.prestige - a.t.prestige; }).slice(0, 3)
    .map(function (x) { var o = mkOffer(S, p, x.t, { years: 1 + Math.floor(rnd() * 3), renew: false, k: 0.88 + 0.03 * x.t.prestige }); if (x.buy) o.buy = x.buy; return o; });
  if (!vd || vd.renew) offers.unshift(mkOffer(S, p, S.teams[p.team], { years: 2, renew: true, k: (0.9 + 0.03 * S.teams[p.team].prestige) * 1.04, noOpt: true }));
  if (!offers.length) {   /* nobody rang: the weakest team that will still talk offers a last-chance one-year deal, buying out a driver if it has no seat */
    var lw = S.teams.filter(function (t) { return t.id !== p.team && st[t.id] && st[t.id].ok; })
      .sort(function (a, b) { return (seatInfo(S, a.id).open ? 0 : 20) + a.prestige - ((seatInfo(S, b.id).open ? 0 : 20) + b.prestige); })[0] || S.teams.filter(function (t) { return t.id !== p.team; })[0];
    var li = seatInfo(S, lw.id), lo = { team: lw.id, years: 1, renew: false, last: true, pay: payFor(ovr(p), 0.6), wb: 0, opt: false };
    if (li.open < 1) { var lk = li.kept.slice().sort(function (a, b) { return ovr(a) - ovr(b); })[0]; if (lk) lo.buy = { id: lk.id, n: lk.name, o: ovr(lk), cost: buyCost(S, lk) }; }
    offers.push(lo);
  }
  if (full) { S.paddock = pd; var so = typeof sitOffer === 'function' ? sitOffer(S, offers) : null; if (so) offers.push(so); }
  return offers;
}
/* seat: pemandu (bukan pemain) yang kontraknya masih berjalan selepas musim ini; bakinya terbuka */
function seatInfo(S, tid) {
  var kept = S.drivers.filter(function (d) { return d.team === tid && d.id !== S.pi && !d.vac && d.con && d.con.end > S.season; });
  return { kept: kept, open: 2 - kept.length };
}
/* kos buyout: separuh gaji untuk baki kontrak, dibayar dari bajet team */
function buyCost(S, d) { return Math.round(d.con.pay * Math.max(1, d.con.end - S.season) * 0.5 * 10) / 10; }
/* satu tawaran: gaji, bonus kemenangan, kadang-kadang opsyen tahun tambahan oleh team (gaji awal lebih tinggi sebagai pemanis) */
function mkOffer(S, p, t, o) {
  var opt = !o.noOpt && o.years <= 2 && rnd() < 0.35, k = (o.k) * (1 + gauss() * 0.04) * (opt ? 1.1 : 1), pay = payFor(ovr(p), k);
  var wb = ovr(p) >= 78 && rnd() < 0.55 ? Math.max(0.1, Math.round(pay * 0.05 * 10) / 10) : 0;
  return { team: t.id, years: o.years, renew: !!o.renew, pay: pay, wb: wb, opt: opt };
}
function usedCodes(S) { var u = {}; S.drivers.forEach(function (d) { u[d.code] = 1; }); return u; }

function startNewSeason(S, teamId, years, buyId, opts) {
  var p = S.drivers[S.pi], prevTeam = p.team;
  if (teamId != null && teamId !== p.team) {
    var bd = buyId != null && +buyId >= 0 ? S.drivers[+buyId] : null;
    if (bd && bd.team === teamId && bd.id !== S.pi && bd.con) {   /* buyout: team pays him off and he goes into the open market */
      var cost = buyCost(S, bd), bf = S.teams[teamId].fin;
      if (bf) bf.bonus = (bf.bonus || 0) + cost;
      bd.con.end = S.season; bd.sk = { s: S.season + 1, why: 'buyout' };
      S.pbuy = { n: bd.name, nat: bd.nat, o: ovr(bd), a: bd.age, t: teamId, cost: cost };
    }
    p.team = teamId; p.miss = 0;
  }
  if (opts && opts.sit && typeof sitStart === 'function') sitStart(S, p.team);
  if (years != null) S.contract = years; else S.contract--;
  if (teamId != null && typeof pushNews === 'function') pushNews(S, { k: 'psign', n: p.name, t: p.team, f: prevTeam, y: years != null ? years : S.contract, mv: p.team !== prevTeam, s: S.season + 1, r: 0 });
  var dlog = [];
  S.drivers.forEach(function (d) {
    d.age++;
    if (d.id === S.pi) { if (d.age >= 31) ['pace', 'cons', 'race', 'wet', 'tyre'].forEach(function (k) { d[k] = clamp(Math.round(d[k] - (d.age < 33 ? rr(0, 0.6) : rr(0.6, 1.4) + 0.7 * (d.age - 33))), 45, 99); }); }
    d.pts = 0; d.wins = 0; d.pods = 0; d.fp = [];
  });
  if (S.xp > 800) S.xp = Math.round(800 + (S.xp - 800) * 0.5);                       /* simpanan XP berlebihan susut */
  if (typeof drvNewSeason === 'function') drvNewSeason(S, dlog);
  p.pts = 0; p.wins = 0; p.pods = 0; p.fp = [];
  if (typeof devWinter === 'function') {
    ensureDev(S);
    var wl = [], reg = devWinter(S, wl), mineT = S.drivers[S.pi].team;
    S.news = S.news || [];
    if (reg) pushNews(S, { k: 'reg', s: S.season + 1, r: 0 });
    dlog.forEach(function (e) {
      if (e.jchamp) pushNews(S, { k: 'jchamp', n: e.jchamp, nat: e.nat, w: e.w, s: S.season + 1, r: 0 });
      else if (e.retire) pushNews(S, { k: 'retire', n: e.retire, a: e.age, t: e.t, w: e.wins, ti: e.titles, nd: e.nodeal, s: S.season + 1, r: 0 });
      else if (e.debut) pushNews(S, { k: 'rookie', n: e.debut, nat: e.nat, t: e.t, jt: e.jt, ac: e.ac, s: S.season + 1, r: 0 });
    });
    wl.forEach(function (e) {
      if (e.poach) pushNews(S, { k: 'poach', t: e.to, f: e.from, s: S.season + 1, r: 0 });
      else if (e.sack) pushNews(S, { k: 'sack', t: e.t, o: e.old, n: e.nw, s: S.season + 1, r: 0 });
      else if (e.eng) pushNews(S, { k: 'eng', t: e.t, f: e.f, to: e.to, s: S.season + 1, r: 0 });
      else if (e.fac) pushNews(S, { k: 'fac', t: e.t, up: e.up, lv: e.lv, s: S.season + 1, r: 0 });
      else if (e.g != null && e.t === mineT) pushNews(S, { k: 'winter', t: e.t, p: e.k, g: +e.g.toFixed(1), s: S.season + 1, r: 0 });
    });
    S.teams.forEach(function (t) { var tp = t.dev.tp; if (tp.amb >= 2 && rnd() < 0.5) pushNews(S, { k: 'tp', t: t.id, n: tp.name, x: t.dev.target, am: tp.amb, s: S.season + 1, r: 0 }); });
    if (typeof mktNews === 'function') mktNews(S);
  } else S.teams.forEach(function (t) {
    ['aero', 'engine', 'chassis', 'rel'].forEach(function (k) { t.car[k] = clamp(Math.round(0.7 * t.car[k] + 0.3 * t.base[k] + gauss() * 2.5), 45, 99); });
  });
  S.teams.forEach(function (t) { t.pts = 0; t.wins = 0; });
  S.season++; S.round = 0; S.results = []; S.cal = shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]); S.offers = null; S.lastSummary = null;
  if (typeof conRollover === 'function') conRollover(S);
  if (typeof sponNew === 'function' && !S.sit) sponNew(S);
  if (typeof objAssign === 'function') objAssign(S, S.season);
}
