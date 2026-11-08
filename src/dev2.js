'use strict';
/* ===== Pembangunan kereta AI v2: aero, enjin, casis, kebolehharapan =====
   Dalam musim: pakej naik taraf pada pusingan tertentu. Musim sejuk: pakej besar + peraturan baru kadang-kadang.
   Semua pasukan guna peraturan sama; beza dari bajet (prestij), mutu pengarah teknikal (td), falsafah dan nasib.  */
var PARTS = ['aero', 'engine', 'chassis', 'rel'];
var DEV = {
  rounds: [3, 6, 9],      /* (lama) kini setiap pasukan pilih masa sendiri, lihat devInSeason */
  pkg: 1.6,               /* saiz pakej dalam musim */
  winter: 2.2,            /* pakej musim sejuk (kali ganda) */
  div: 24,                /* pulangan berkurang: (siling - nilai)/div */
  ceil: 99,
  budA: 0.80, budB: 0.02, /* bajet = budA + budB*prestij */
  catchUp: 1.0,          /* pasukan di belakang lebih cekap hingga +55% */
  failLead: 0.10, failBack: 0.22,
  tdSd: 0.12, tdRev: 0.35,/* mutu pengarah teknikal: hanyut tahunan, tarik balik ke 1 */
  regEvery: [3, 5],       /* tahun peraturan baru */
  regMix: 0.7,           /* sebahagian kereta diundi semula pada tahun peraturan */
  relW: 0.6,              /* kebolehharapan kurang diutamakan */
  meanKeep: true,         /* kekalkan purata liga supaya tiada inflasi */
  sdTarget: 6.5,          /* sebaran kuasa antara pasukan dikekalkan (belanjawan, kos, gaji beza) */
  hist: 0.0,              /* pengaruh prestasi musim lepas pada bajet */
  staffK: 2.5, staffG: 2, tpG: 1.5,            /* kesan staf lemah pada kadar gagal */
  gambleSize: 1.25, gambleFail: 1.5, safeSize: 0.85, safeFail: 0.6,
  poach: 0.35, sackGap: 4, sack: 0.6, bankK: 0.6
};
var TPNAMES = ['Rafael Ostrowski', 'Mei Lin Teoh', 'Gunnar Holm', 'Aziz Rahman', 'Claire Dubois', 'Paolo Ferretti', 'Hana Kobayashi', 'Marcus Webb', 'Sofia Lindqvist', 'Tomas Novak', 'Farah Ismail', 'Diego Arrieta', 'Ingrid Vos', 'Kenji Mori', 'Leila Haddad', 'Owen Pryde', 'Rosa Câmara', 'Stefan Brauer'];
function newTP(t) { return { name: pick(TPNAMES), skill: clamp(1 + gauss() * 0.15, 0.75, 1.25), amb: Math.round(clamp(gauss() * 1.2 + 0.4, -1, 3)) }; }
function powerRank(S) { var l = S.teams.slice().sort(function (a, b) { return teamPower(b) - teamPower(a); }), r = {}; l.forEach(function (t, i) { r[t.id] = i + 1; }); return r; }
function setTargets(S) { var pr = powerRank(S); S.teams.forEach(function (t) { t.dev.target = clamp(pr[t.id] - t.dev.tp.amb, 1, 10); t.dev.bank = t.dev.bank || 0; }); }

function leagueMean(S, k) { var s = 0; S.teams.forEach(function (t) { s += t.car[k]; }); return s / S.teams.length; }

function initDev(S) {
  if (S.mode === 'pro' && S.teams[0].spec) {
    S.teams.forEach(function (t) { t.dev = t.dev || { td: 1, phil: { aero: 1, engine: 1, chassis: 1, rel: 1 }, rank: t.id + 1 }; t.dev.staff = 0.8 + t.ops.coaching * 0.4; t.dev.tp = t.dev.tp || { name: 'Team operations', skill: 1, amb: 0 }; });
    setTargets(S); S.target = worldSpec(leagueOf(S)); S.regYear = S.world.era.next; return;
  }
  S.teams.forEach(function (t) {
    t.dev = t.dev || { td: 1 + gauss() * 0.05, phil: { aero: rr(0.8, 1.2), engine: rr(0.8, 1.2), chassis: rr(0.8, 1.2), rel: rr(0.8, 1.2) }, rank: t.id + 1 };
    if (!t.dev.phil) t.dev.phil = { aero: 1, engine: 1, chassis: 1, rel: 1 };
    if (t.dev.staff == null) t.dev.staff = clamp(0.86 + 0.028 * t.prestige + gauss() * 0.04, 0.8, 1.2);
    if (!t.dev.tp) t.dev.tp = (TEAMS[t.id] && TEAMS[t.id].tp && S.season === 1) ? Object.assign({}, TEAMS[t.id].tp) : newTP(t);
  });
  setTargets(S);
  S.target = S.target || {}; PARTS.forEach(function (k) { S.target[k] = leagueMean(S, k); });
  S.regYear = S.mode === 'pro' && S.world ? S.world.era.next : S.season + Math.floor(rr(DEV.regEvery[0], DEV.regEvery[1] + 1));
}

/* kedudukan semasa ikut mata (jika belum ada mata, ikut kekuatan kereta) */
function devRank(S) {
  var tot = 0; S.teams.forEach(function (t) { tot += t.pts; });
  var l = S.teams.slice().sort(function (a, b) {
    if (tot > 0) return b.pts - a.pts || b.wins - a.wins;
    return teamPower(b) - teamPower(a);
  });
  var r = {}; l.forEach(function (t, i) { r[t.id] = i + 1; });
  return r;
}

/* satu pakej untuk satu pasukan; 'size' = skala pakej */
function devPackage(S, t, size, ranks, tops, log, opt) {
  var n = S.teams.length, rk = ranks[t.id], back = (rk - 1) / (n - 1);          /* 0 = depan, 1 = belakang */
  var bud = DEV.budA + DEV.budB * t.prestige;
  var eff = 1 + DEV.catchUp * back;
  /* pilih bahagian: lemah berbanding terbaik liga + falsafah */
  var tp = t.dev.tp, w = PARTS.map(function (k) { return Math.pow(t.dev.phil[k] * (3 + Math.max(0, tops[k] - t.car[k])) * (k === 'rel' ? DEV.relW : 1), tp.skill * 1.4); });
  var tot = w.reduce(function (a, b) { return a + b; }, 0), x = rnd() * tot, ki = 0;
  while (ki < 3 && x > w[ki]) { x -= w[ki]; ki++; }
  var k = PARTS[ki];
  var mine = S.drivers && S.pi != null && S.drivers[S.pi] && S.drivers[S.pi].team === t.id;
  if (mine && S.rd && rnd() < 0.75) k = S.rd;                                    /* pasukan pemain ikut fokus R&D pilihan */
  if (opt && opt.k) k = opt.k;
  var fail = (DEV.failLead + (DEV.failBack - DEV.failLead) * back) * (1 + (1 - t.dev.staff) * DEV.staffK);
  var mode = rk - t.dev.target >= 2 ? 'judi' : t.dev.target - rk >= 2 ? 'selamat' : 'biasa';
  if (mode === 'judi') { size *= DEV.gambleSize; fail *= DEV.gambleFail; } else if (mode === 'selamat') { size *= DEV.safeSize; fail *= DEV.safeFail; }
  if (opt && opt.fm) fail *= opt.fm;
  var gain;
  if (rnd() < fail) gain = -rr(0.3, 1.4) * (0.6 + back);                         /* naik taraf gagal, pasukan belakang lebih berani maka lebih risiko */
  else gain = size * bud * t.dev.td * Math.pow(t.dev.staff, DEV.staffG) * Math.pow(t.dev.tp.skill, DEV.tpG) * eff * rr(0.5, 1.6 + 0.5 * back) * (DEV.ceil - t.car[k]) / DEV.div * (typeof facMul === 'function' ? facMul(t) : 1);
  if (mine && gain > 0) gain *= S.mode === 'pro' ? clamp((1 + (S.drivers[S.pi].fb - 70) / 150) * (1 + abilityEffects(S, S.cal[Math.min(S.round, S.cal.length - 1)]).feedback), 0.8, 1.25) : 1 + (S.drivers[S.pi].fb - 70) / 150;            /* maklum balas pemandu bantu */
  t.car[k] = clamp(t.car[k] + gain, 45, 99);
  if (k === 'engine' && typeof engShare === 'function') engShare(S, t, gain);
  if (log) log.push({ t: t.id, k: k, g: gain, mode: mode, rush: !!(opt && opt.rush), big: !!(opt && opt.big) });
  return { k: k, g: gain };
}

/* ===== Dalam musim: setiap pasukan ada projek naik taraf sendiri. Kemajuan bertambah setiap pusingan,
   dan team principal yang putuskan bila nak bawa ke trek:
   - TP sabar tunggu pakej besar (lebih untung, kurang risiko); TP gopoh / pasukan terdesak bawa awal (kecil, lebih mudah gagal)
   - bawa lebih awal kalau litar seterusnya sesuai dengan bahagian yang dibangunkan
   - lewat musim, pasukan yang jauh dari sasaran boleh tutup projek dan simpan untuk tahun depan  */
DEV.rate = 0.45;     /* kemajuan purata / pusingan (1.5 = satu pakej biasa) */
DEV.std = 1.5;
function suitPart(c, k) { if (!c) return false; return k === 'engine' ? c.pw >= 0.55 : (k === 'aero' || k === 'chassis') ? c.pw <= 0.42 : false; }
function pickPart(S, t, tops) {
  var tp = t.dev.tp, w = PARTS.map(function (k) { return Math.pow(t.dev.phil[k] * (3 + Math.max(0, tops[k] - t.car[k])) * (k === 'rel' ? DEV.relW : 1), tp.skill * 1.4); });
  var tot = w.reduce(function (a, b) { return a + b; }, 0), x = rnd() * tot, ki = 0;
  while (ki < 3 && x > w[ki]) { x -= w[ki]; ki++; }
  var k = PARTS[ki], mine = S.drivers && S.pi != null && S.drivers[S.pi] && S.drivers[S.pi].team === t.id;
  if (mine && S.rd && rnd() < 0.75) k = S.rd;
  return k;
}
function devThreshold(S, t, rk, nextC) {
  var tp = t.dev.tp, th = DEV.std;
  if (tp.amb >= 2) th -= 0.3; else if (tp.amb <= 0) th += 0.35;                 /* perangai TP */
  if (rk - t.dev.target >= 2) th -= 0.4; else if (t.dev.target - rk >= 2) th += 0.3; /* terdesak vs selesa */
  if (suitPart(nextC, t.dev.next)) th -= 0.4;                                  /* litar depan sesuai */
  return clamp(th + (t.dev.thN || 0), 0.8, 2.6);
}
function devInSeason(S, round, log) {            /* panggil selepas pusingan ke-'round' (1..) siap */
  var ranks = devRank(S), tops = {}; PARTS.forEach(function (k) { tops[k] = Math.max.apply(null, S.teams.map(function (t) { return t.car[k]; })); });
  var nextC = S.cal && round < S.cal.length ? circuitFor(S, S.cal[round]) : null, last = round >= seasonRounds(S);
  S.teams.forEach(function (t) {
    var d = t.dev;
    if (d.next == null) { d.next = pickPart(S, t, tops); d.prog = 0; d.thN = gauss() * 0.2; }
    if (d.banked) return;
    d.prog = (d.prog || 0) + DEV.rate * rr(0.75, 1.25) * (0.85 + 0.15 * d.staff / 1.0);
    /* TP bijak tutup projek musim ni bila jauh dari sasaran, simpan untuk kereta tahun depan */
    if (round >= seasonMilestone(S, 7) && !last && ranks[t.id] - d.target >= 3 && d.tp.skill > 1.0) { d.bank = (d.bank || 0) + DEV.bankK + d.prog * 0.3; d.prog = 0; d.banked = true; if (log) log.push({ t: t.id, bank: true }); return; }
    if (last) return;                                                          /* pusingan akhir: baki dibawa ke musim sejuk */
    var th = devThreshold(S, t, ranks[t.id], nextC);
    if (d.prog >= th) {
      var p = d.prog, rush = p < 1.2, big = p >= 2.0, sz = DEV.pkg * p / DEV.std;
      if (typeof finAvail === 'function' && t.fin) {
        var cost0 = finCostOf(sz, rush, big), av = finAvail(t);
        if (av < 0.3 * cost0) { d.prog = Math.min(d.prog, 3.4); if (!t.fin.brk) { t.fin.brk = true; if (log) log.push({ t: t.id, broke: true, k: d.next }); } return; }   /* tak mampu: tunggu */
        var af = Math.min(1, av / cost0); sz *= af; t.fin.cash -= cost0 * af; t.fin.spent += cost0 * af;
      }
      devPackage(S, t, sz, ranks, tops, log, { k: d.next, fm: rush ? 1.45 : big ? 0.75 : 1, rush: rush, big: big });
      d.prog = 0; d.rum = false; d.next = pickPart(S, t, tops); d.thN = gauss() * 0.2;
    } else if (!d.rum && d.prog >= th - DEV.rate * 1.1 && log) { d.rum = true; log.push({ t: t.id, rumour: true, k: d.next, big: th >= 1.9 }); }
  });
}
function devStatus(t) {        /* untuk UI: projek semasa pasukan */
  var d = t.dev || {}; return { k: d.next, prog: d.prog || 0, banked: !!d.banked, th: DEV.std };
}

function devWinter(S, log) {
  if (typeof finSeason === 'function') finSeason(S);
  var ranks = devRank(S), tops = {}; PARTS.forEach(function (k) { tops[k] = Math.max.apply(null, S.teams.map(function (t) { return t.car[k]; })); });
  /* pengarah teknikal hanyut */
  S.teams.forEach(function (t) { t.dev.td = clamp(t.dev.td + (1 - t.dev.td) * DEV.tdRev + gauss() * DEV.tdSd, 0.8, 1.2); });
  /* staf: ikut bajet, perlahan */
  S.teams.forEach(function (t) { var tg = 0.86 + 0.028 * t.prestige; t.dev.staff = clamp(t.dev.staff + (tg - t.dev.staff) * 0.3 + gauss() * 0.04, 0.8, 1.2); });
  /* juara curi jurutera dari pasukan lain */
  var champ = S.teams.slice().sort(function (a, b) { return b.pts - a.pts; })[0];
  if (rnd() < DEV.poach) {
    var vic = pick(S.teams.filter(function (t) { return t !== champ && t.dev.staff > 0.9; }));
    if (vic) { vic.dev.staff -= 0.05; champ.dev.staff = clamp(champ.dev.staff + 0.04, 0.8, 1.2); if (log) log.push({ poach: true, from: vic.id, to: champ.id }); }
  }
  /* TP yang gagal teruk dipecat */
  S.teams.forEach(function (t) {
    if (ranks[t.id] - t.dev.target >= DEV.sackGap && rnd() < DEV.sack) { var old = t.dev.tp.name; t.dev.tp = newTP(t); if (log) log.push({ sack: true, t: t.id, old: old, nw: t.dev.tp.name }); }
  });
  /* peraturan baru: sebahagian kereta diundi semula, falsafah diundi semula */
  var reg = S.season + 1 >= S.regYear;
  if (reg) {
    S.teams.forEach(function (t) {
      PARTS.forEach(function (k) { var nv = clamp(S.target[k] + gauss() * 9, 50, 97); t.car[k] = (1 - DEV.regMix) * t.car[k] + DEV.regMix * nv; t.dev.phil[k] = rr(0.75, 1.25); });
    });
    S.regYear = S.season + 1 + Math.floor(rr(DEV.regEvery[0], DEV.regEvery[1] + 1));
    if (log) log.push({ reg: true });
  }
  S.teams.forEach(function (t) { var wsz = DEV.winter + (t.dev.bank || 0) + (t.dev.prog || 0) * 0.5 / DEV.std; if (typeof finWinter === 'function' && t.fin) wsz *= finWinter(t, wsz); devPackage(S, t, wsz, ranks, tops, log); t.dev.bank = 0; t.dev.prog = 0; t.dev.banked = false; t.dev.rum = false; t.dev.next = null; });
  if (typeof e4Winter === 'function') e4Winter(S, log);
  if (DEV.meanKeep) PARTS.forEach(function (k) { var d = S.target[k] - leagueMean(S, k); S.teams.forEach(function (t) { t.car[k] = clamp(t.car[k] + d, 45, 99); }); });
  if (DEV.sdTarget) {
    var sd = Math.sqrt(S.teams.reduce(function (a, t) { var m = teamPower(t) - 0; return a + m * m; }, 0) / S.teams.length - Math.pow(S.teams.reduce(function (a, t) { return a + teamPower(t); }, 0) / S.teams.length, 2));
    var f = clamp(DEV.sdTarget / Math.max(0.5, sd), 0.9, 1.5);
    PARTS.forEach(function (k) { var m = leagueMean(S, k); S.teams.forEach(function (t) { t.car[k] = clamp(m + (t.car[k] - m) * f, 45, 99); }); });
  }
  setTargets(S);
  return reg;
}
