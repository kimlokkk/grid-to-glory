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
  if (typeof leadMigrate === 'function') leadMigrate(S);
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
  var lead = typeof leadOn === 'function' && leadOn(S), k;
  if (lead) k = leadPickPart(S, t, tops);                                        /* principal decides, director advises (Leadership, B3) */
  else {
    var tp = t.dev.tp, w = PARTS.map(function (k) { return Math.pow(t.dev.phil[k] * (3 + Math.max(0, tops[k] - t.car[k])) * (k === 'rel' ? DEV.relW : 1), tp.skill * 1.4); });
    var tot = w.reduce(function (a, b) { return a + b; }, 0), x = rnd() * tot, ki = 0;
    while (ki < 3 && x > w[ki]) { x -= w[ki]; ki++; }
    k = PARTS[ki];
  }
  var mine = S.drivers && S.pi != null && S.drivers[S.pi] && S.drivers[S.pi].team === t.id;
  if (!lead && mine && S.rd && rnd() < 0.75) k = S.rd;                          /* pasukan pemain ikut fokus R&D pilihan (Leadership: the principal and director decide, not the driver) */
  if (opt && opt.k) k = opt.k;
  var fail = (DEV.failLead + (DEV.failBack - DEV.failLead) * back) * (1 + (1 - t.dev.staff) * (lead ? LEAD.staffK : DEV.staffK));
  if (lead) fail *= 1 - (leadFeedback(S, t) - 70) / LEAD.fbFail;                           /* a driver who explains the car well: fewer failed upgrades */
  var mode = rk - t.dev.target >= 2 ? 'judi' : t.dev.target - rk >= 2 ? 'selamat' : 'biasa';
  if (mode === 'judi') { size *= DEV.gambleSize; fail *= DEV.gambleFail; } else if (mode === 'selamat') { size *= DEV.safeSize; fail *= DEV.safeFail; }
  if (opt && opt.fm) fail *= opt.fm;
  var lp = lead ? leadPackage(S, t) : null; if (lp) fail *= lp.fail;
  var gain;
  if (rnd() < fail) gain = -rr(0.3, 1.4) * (0.6 + back);                         /* naik taraf gagal, pasukan belakang lebih berani maka lebih risiko */
  else gain = size * bud * (lp ? lp.q : t.dev.td) * Math.pow(t.dev.staff, lp ? LEAD.staffG : DEV.staffG) * Math.pow(t.dev.tp.skill, lp ? LEAD.tpG : DEV.tpG) * eff * rr(0.5, 1.6 + 0.5 * back) * (DEV.ceil - t.car[k]) / DEV.div * (typeof facMul === 'function' ? facMul(t) : 1);
  if (lead && gain > 0) gain *= (opt && opt.k ? LEAD.gainIn : LEAD.gainWin);
  if (lead) { if (gain > 0) gain *= clamp(leadFbGain(S, t) * (mine && S.mode === 'pro' ? 1 + abilityEffects(S, S.cal[Math.min(S.round, S.cal.length - 1)]).feedback : 1), 0.8, 1.25); }
  else if (mine && gain > 0) gain *= S.mode === 'pro' ? clamp((1 + (S.drivers[S.pi].fb - 70) / 150) * (1 + abilityEffects(S, S.cal[Math.min(S.round, S.cal.length - 1)]).feedback), 0.8, 1.25) : 1 + (S.drivers[S.pi].fb - 70) / 150;            /* maklum balas pemandu bantu */
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
  if (typeof leadOn === 'function' && leadOn(S)) return leadPickPart(S, t, tops);
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
/* Leadership: the principal's sense of timing. A good one notices a suiting circuit and rarely mistimes the package. */
function devThresholdLead(S, t, rk, nextC) {
  var tp = t.dev.tp, th = DEV.std, tr = leadTPRating(t);
  if (tp.amb >= 2) th -= 0.3; else if (tp.amb <= 0) th += 0.35;
  if (rk - t.dev.target >= 2) th -= 0.4; else if (t.dev.target - rk >= 2) th += 0.3;
  if (suitPart(nextC, t.dev.next) && rnd() < leadLerp(LEAD.suitSee, tr)) th -= 0.4;
  return clamp(th + (t.dev.thN || 0), 0.8, 2.6);
}
function devInSeason(S, round, log) {            /* panggil selepas pusingan ke-'round' (1..) siap */
  var ranks = devRank(S), tops = {}; PARTS.forEach(function (k) { tops[k] = Math.max.apply(null, S.teams.map(function (t) { return t.car[k]; })); });
  var nextC = S.cal && round < S.cal.length ? circuitFor(S, S.cal[round]) : null, last = round >= seasonRounds(S), lead = typeof leadOn === 'function' && leadOn(S);
  if (lead) leadIncome(S, round);
  S.teams.forEach(function (t) {
    var d = t.dev;
    if (d.next == null) { d.next = pickPart(S, t, tops); d.prog = 0; d.thN = gauss() * (lead ? leadLerp(LEAD.timeSd, leadTPRating(t)) : 0.2); }
    if (d.banked) return;
    d.prog = (d.prog || 0) + (lead ? LEAD.rate * leadFbRate(S, t) : DEV.rate) * rr(0.75, 1.25) * (0.85 + 0.15 * d.staff / 1.0);
    /* TP bijak tutup projek musim ni bila jauh dari sasaran, simpan untuk kereta tahun depan */
    var shelve = lead ? leadShelve(S, t, ranks, round, last) : (round >= seasonMilestone(S, 7) && !last && ranks[t.id] - d.target >= 3 && d.tp.skill > 1.0);
    if (shelve) { d.bank = (d.bank || 0) + DEV.bankK + d.prog * 0.3; d.prog = 0; d.banked = true; if (log) log.push({ t: t.id, bank: true }); return; }
    if (last) return;                                                          /* pusingan akhir: baki dibawa ke musim sejuk */
    var th = lead ? devThresholdLead(S, t, ranks[t.id], nextC) : devThreshold(S, t, ranks[t.id], nextC);
    if (d.prog >= th) {
      var p = d.prog, rush = p < 1.2, big = p >= 2.0, sz = DEV.pkg * p / DEV.std;
      if (typeof finAvail === 'function' && t.fin) {
        var cost0 = finCostOf(sz, rush, big) * (lead ? LEAD.costMul : 1), av = finAvail(t);
        if (av < 0.3 * cost0) { d.prog = Math.min(d.prog, 3.4); if (!t.fin.brk) { t.fin.brk = true; if (log) log.push({ t: t.id, broke: true, k: d.next }); } return; }   /* tak mampu: tunggu */
        var af = Math.min(1, av / cost0); sz *= af; t.fin.cash -= cost0 * af; t.fin.spent += cost0 * af;
      }
      devPackage(S, t, sz, ranks, tops, log, { k: d.next, fm: rush ? 1.45 : big ? 0.75 : 1, rush: rush, big: big });
      d.prog = 0; d.rum = false; d.next = pickPart(S, t, tops); d.thN = gauss() * (lead ? leadLerp(LEAD.timeSd, leadTPRating(t)) : 0.2);
    } else if (!d.rum && d.prog >= th - DEV.rate * 1.1 && log) { d.rum = true; log.push({ t: t.id, rumour: true, k: d.next, big: th >= 1.9 }); }
  });
}
function devStatus(t) {        /* untuk UI: projek semasa pasukan */
  var d = t.dev || {}; return { k: d.next, prog: d.prog || 0, banked: !!d.banked, th: DEV.std };
}

function devWinter(S, log) {
  var rgCtx = null;                                   /* Garage Watch: records what a regulation change did, from the real numbers */
  if (typeof finSeason === 'function') finSeason(S);
  var ranks = devRank(S), tops = {}; PARTS.forEach(function (k) { tops[k] = Math.max.apply(null, S.teams.map(function (t) { return t.car[k]; })); });
  /* pengarah teknikal hanyut */
  /* old system: the team's director quality random-walks every winter whoever the person is. With Leadership it is the person's rating (it drifts slowly in the staff market). */
  if (!(typeof leadOn === 'function' && leadOn(S, S.season + 1))) S.teams.forEach(function (t) { t.dev.td = clamp(t.dev.td + (1 - t.dev.td) * DEV.tdRev + gauss() * DEV.tdSd, 0.8, 1.2); });
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
    if (ranks[t.id] - t.dev.target >= DEV.sackGap && rnd() < DEV.sack) { var old = t.dev.tp.name;
      if (typeof leadOn === 'function' && leadOn(S, S.season + 1)) { t.dev.tp._fire = 1; if (log) log.push({ sack: true, t: t.id, old: old, nw: null }); return; }   /* Leadership: he goes into the pool and the team hires from the pool in the winter market */
      t.dev.tp = newTP(t);
      if (typeof leadOn === 'function' && leadOn(S, S.season + 1)) { var tries = 0; while (tries++ < 30 && S.teams.some(function (o) { return o !== t && o.dev.tp && o.dev.tp.name === t.dev.tp.name; })) t.dev.tp = newTP(t); }   /* Leadership: a new principal never shares a name with another team's */ if (log) log.push({ sack: true, t: t.id, old: old, nw: t.dev.tp.name }); }
  });
  /* peraturan baru: sebahagian kereta diundi semula, falsafah diundi semula */
  var pro = S.mode === 'pro' && S.world && S.world.era, kind = S.season + 1 >= S.regYear ? 'major' : (pro && S.regMinor && S.season + 1 >= S.regMinor ? 'minor' : null), reg = !!kind;
  if (reg) {
    var rgParts = kind === 'minor' && regAOn(S) ? regMinorParts(S).slice() : null;
    var mix = regMix(!!pro, kind), before = powerRank(S), champId = S.teams.slice().sort(function (a, b) { return b.pts - a.pts; })[0].id;
    var lastId = S.teams.slice().sort(function (a, b) { return teamPower(a) - teamPower(b); })[0].id;
    if (typeof rgBegin === 'function') rgCtx = rgBegin(S, kind, mix, champId, lastId);
    var merit = pro && regMeritOn(S), offs = {}; if (merit) S.teams.forEach(function (t) { offs[t.id] = regConcept(S, t, true); });
    S.teams.forEach(function (t) {
      PARTS.forEach(function (k) { var nv = clamp(S.target[k] + gauss() * (merit ? REGB.sd : 9) + (merit ? regOffPart(offs[t.id], k) * (kind === 'minor' ? REGB.minorK : 1) : 0), 50, 97), m = pro ? regPartMix(S, kind, k) : mix; t.car[k] = (1 - m) * t.car[k] + m * nv; if (kind !== 'minor') t.dev.phil[k] = rr(0.75, 1.25); });
    });
    if (typeof rgMid === 'function') rgMid(rgCtx, 1);
    if (pro) regBalance(S, kind, champId, lastId, before, merit);
    if (typeof rgMid === 'function') rgMid(rgCtx, 2);
    if (kind === 'major' || !pro) S.regYear = pro ? S.world.era.next : S.season + 1 + Math.floor(rr(DEV.regEvery[0], DEV.regEvery[1] + 1));
    if (pro) { S.regMinor = regNextMinor(S, kind); S.regLast = { kind: kind, season: S.season + 1 }; }
    if (log) log.push({ reg: true, kind: kind, parts: rgParts });
  }
  S.teams.forEach(function (t) { var wsz = (typeof leadOn === 'function' && leadOn(S, S.season + 1) && t.dev.tp ? leadWinterSize(S, t) : DEV.winter) + (t.dev.bank || 0) + (t.dev.prog || 0) * 0.5 / DEV.std; if (typeof finWinter === 'function' && t.fin) wsz *= finWinter(t, wsz, typeof leadOn === 'function' && leadOn(S, S.season + 1) ? LEAD.costMul : 1); devPackage(S, t, wsz, ranks, tops, log); t.dev.bank = 0; t.dev.prog = 0; t.dev.banked = false; t.dev.regReady = false; t.dev.regDecided = false; t.dev.rum = false; t.dev.next = null; });
  if (typeof e4Winter === 'function') e4Winter(S, log);
  if (DEV.meanKeep) PARTS.forEach(function (k) { var d = S.target[k] - leagueMean(S, k); S.teams.forEach(function (t) { t.car[k] = clamp(t.car[k] + d, 45, 99); }); });
  if (DEV.sdTarget) {
    var sd = Math.sqrt(S.teams.reduce(function (a, t) { var m = teamPower(t) - 0; return a + m * m; }, 0) / S.teams.length - Math.pow(S.teams.reduce(function (a, t) { return a + teamPower(t); }, 0) / S.teams.length, 2));
    var f = clamp(DEV.sdTarget / Math.max(0.5, sd), 0.9, 1.5);
    PARTS.forEach(function (k) { var m = leagueMean(S, k); S.teams.forEach(function (t) { t.car[k] = clamp(m + (t.car[k] - m) * f, 45, 99); }); });
  }
  setTargets(S);
  if (typeof rgFinish === 'function') rgFinish(S, rgCtx, reg, log);
  return reg;
}

/* Regulation changes (Pro): a dynasty drops after a major change; minor changes shuffle the leaders a little. Preparation softens the fall. */
/* share of each car that is rebuilt on a regulation change (one source for the winter re-roll and the Garage Watch expectation) */
function regMix(pro, kind) { return !pro ? DEV.regMix : kind === 'major' ? 0.6 : 0.3; }
/* Regulations phase A (Leadership saves, S.lead.reg): a major change rebuilds 70% of every part; a minor change targets one or two
   areas (aero most often, then chassis, then engine) and reworks 75% of those, the rest carries over. Chosen from a hash, so no race random numbers move. */
var REGA = { major: 0.7, minor: 0.75, w: [['aero', 0.5], ['chassis', 0.3], ['engine', 0.2]] };
function regAOn(S) { return !!(S && S.mode === 'pro' && S.lead && S.lead.reg >= 1); }
function regMinorParts(S) {
  if (!S.regMinor) return [];
  if (S.regParts && S.regParts.s === S.regMinor) return S.regParts.p;
  var pickOne = function (u, not) { var L = REGA.w.filter(function (x) { return x[0] !== not; }), tot = L.reduce(function (a, x) { return a + x[1]; }, 0), c = 0, i; for (i = 0; i < L.length; i++) { c += L[i][1] / tot; if (u < c) return L[i][0]; } return L[L.length - 1][0]; };
  var a = pickOne(hash01(S.regMinor * 17 + 3, 9)), parts = [a];
  if (hash01(S.regMinor * 29 + 5, 11) < 0.5) parts.push(pickOne(hash01(S.regMinor * 41 + 7, 13), a));
  S.regParts = { s: S.regMinor, p: parts }; return parts;
}
function regPartMix(S, kind, k) {
  var pro = S.mode === 'pro';
  if (!regAOn(S)) return regMix(pro, kind);
  if (kind === 'major') return REGA.major;
  return regMinorParts(S).indexOf(k) >= 0 ? REGA.minor : 0;
}
/* Regulations phase B (S.lead.reg >= 2): the new car comes from the people, not from a fixed handicap.
   Concept = director rating + principal rating + preparation (the principal started the new car in time) + money + luck (wider for a weak director).
   Execution = technical staff (reliability and the first packages). No forced drop for the champion; the slowest team gets a smaller lift. */
var REGB = { td: 5, tp: 2, prep: 2.5, money: 2, staff: 2, luck: 2.5, sd: 5, minorK: 0.6, lift: 8 };
function regMeritOn(S) { return regAOn(S) && S.lead.reg >= 2 && typeof leadOn === 'function' && leadOn(S, S.season + 1); }
function regRatings(t) {
  var dv = t.dev || {};
  return { td: dv.tdp && typeof leadRating === 'function' ? leadRating('td', dv.td) : 50, tp: dv.tp && typeof leadRating === 'function' ? leadRating('tp', dv.tp.skill) : 50,
    st: clamp((((dv.staff || 1) - 0.8) / 0.4) * 100, 0, 100), ready: !!dv.regReady };
}
/* expected offset (no luck) and the luck draw; `draw` false gives the expectation only (Regulation Watch) */
function regConcept(S, t, draw) {
  var r = regRatings(t), funds = S.teams.map(function (o) { return o.fin ? o.fin.fund : 0; }), mf = funds.reduce(function (a, x) { return a + x; }, 0) / funds.length || 1;
  var money = t.fin ? clamp((t.fin.fund - mf) / mf, -0.5, 0.5) * 2 : 0;
  var c = REGB.td * (r.td - 50) / 50 + REGB.tp * (r.tp - 50) / 50 + (r.ready ? REGB.prep : 0) + REGB.money * money;
  if (draw) c += gauss() * REGB.luck * (1.3 - 0.6 * r.td / 100);
  return { c: c, s: REGB.staff * (r.st - 50) / 50 };
}
function regOffPart(o, k) { return !o ? 0 : k === 'aero' || k === 'chassis' ? o.c + 0.5 * o.s : k === 'engine' ? 0.3 * o.c : 0.3 * o.c + 1.5 * o.s; }
function regAvgMix(S, kind) { var m = 0; PARTS.forEach(function (k) { m += regPartMix(S, kind, k); }); return m / PARTS.length; }
function regPartsText(parts) { var n = { aero: 'aero', chassis: 'chassis', engine: 'engine' }; return parts.map(function (k) { return n[k] || k; }).join(' and '); }
/* the words every screen uses for a change, so the news, Regulation Watch and the story pack never disagree with the mechanics */
function regWords(S, kind) {
  if (!regAOn(S)) return kind === 'major' ? { pct: '60%', badge: 'MAJOR · 60% REBUILT', line: 'About 60% of every car will be rebuilt from scratch.' } : { pct: '30%', badge: 'MINOR · 30% REWORKED', line: 'About a third of every car is reworked. Quick adapters gain ground, but nothing is rebuilt from scratch.' };
  if (kind === 'major') return { pct: '70%', badge: 'MAJOR · 70% REBUILT', line: 'About 70% of every car will be rebuilt from scratch.' };
  var pt = regPartsText(regMinorParts(S));
  return { pct: '75% of ' + pt, badge: 'MINOR · ' + pt.toUpperCase() + ' RULES', parts: pt, line: 'The ' + pt + ' rules change: about 75% of ' + (regMinorParts(S).length > 1 ? 'those areas is' : 'that area is') + ' reworked and the rest of the car carries over. Teams strong in ' + pt + ' have the most to lose.' };
}
function regPrep(t) { return clamp(((t.prestige || 5) - 5) * 0.04 + ((t.dev && t.dev.td) || 1) - 1 + ((t.dev && t.dev.staff) || 1) - 1 + (t.dev && t.dev.regReady ? LEAD.regBonus : 0), -0.2, 0.35); }
function regBalance(S, kind, champId, lastId, before, merit) {
  var champ = S.teams[champId], last = S.teams[lastId];
  function crew(t) { var ds = S.drivers.filter(function (d) { return d.team === t.id; }); return ds.length ? ds.reduce(function (a, d) { return a + baseOverall(d); }, 0) / ds.length : 70; }
  function strength(t) { return teamPower(t) + (kind === 'major' ? 0.8 : 0.5) * crew(t); }
  function rankOf(t) { var st = strength(t); return 1 + S.teams.filter(function (o) { return o !== t && strength(o) > st; }).length; }
  if (merit) {   /* phase B: no handicap for the champion; only the slowest team gets a smaller lift on a major change */
    if (kind === 'major' && last.id !== champId) { var g0 = 0, lift0 = REGB.lift - Math.round(regPrep(last) * 2); while (rankOf(last) > lift0 && g0++ < 40) PARTS.forEach(function (k) { last.car[k] = clamp(last.car[k] + 1, 45, 99); }); }
    return;
  }
  var drop = kind === 'major' ? (rnd() < 0.5 ? 5 : 6) : before[champId] + 1 + Math.floor(rnd() * 3);
  drop = clamp(Math.round(drop - regPrep(champ) * (kind === 'major' ? 3 : 1)), 2, 10);
  var guard = 0; while (rankOf(champ) < drop && guard++ < 40) PARTS.forEach(function (k) { champ.car[k] = clamp(champ.car[k] - 1, 45, 99); });
  if (kind === 'major' && last.id !== champId) { guard = 0; var lift = 7 - Math.round(regPrep(last) * 2); while (rankOf(last) > lift && guard++ < 40) PARTS.forEach(function (k) { last.car[k] = clamp(last.car[k] + 1, 45, 99); }); }
}
function regNextMinor(S, kind) {
  var major = S.regYear, y = S.season + 1 + 2 + Math.floor(rnd() * 2);
  if (Math.abs(y - major) < 2) y = major + 2 + Math.floor(rnd() * 2);
  return y;
}
