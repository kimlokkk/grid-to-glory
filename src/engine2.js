'use strict';
/* ===== Enjin race v2 (Fasa 1 dan 2) =====
   ~20 langkah masa setiap lap. Setiap kereta ada kedudukan sebenar (s, dalam unit lap).
   Satu formula pace untuk semua kereta. Pintasan hanya di zon pintas. Setiap kejadian ada tag sebab.
   Bergantung pada: data.js (rnd, gauss, clamp, COMP, CIRCUITS) dan sim.js (carPerf, crewTime, runQuali). */

var TICKS_PER_LAP = 20;
function hash01(n, salt) { var x = Math.sin(n * 127.1 + salt * 311.7) * 43758.5453; return x - Math.floor(x); }
var P2 = {
  push: { pace: [0.40, 0, -0.35], wear: [0.80, 1, 1.35] },
  fuel: { pace: [0.22, 0, -0.12], use: [0.93, 1, 1.08] },
  energy: { pace: [0.25, 0, -0.25], charge: [0.20, 0.02, -0.22] },
  atk: { pace: -0.45, en: 0.12, dur: 0.15, cd: 2.5, wear: 1.25 },
  drs: { pace: -0.30, gap: 1.0 },
  dirty: { gap: 1.5, pace: 0.22, wear: 0.18 },
  slip: { gap: 1.0, pace: 0.12 },
  warm: { S: [0.45, 0.7], M: [0.55, 1.0], H: [0.85, 1.6] },
  fuelPer: 0.032, fuel0: 1.035, cliffK: 0.26, cliffP: 1.4, wearE: 1.38, pitS: 0.557, lifeScale: 1,
  minGap: 0.30, passK: 1.3, gridGap: 0.45, otK: 5.2, advK: 1.6, lap1: 0.35, stopTraffic: 3.0, planWear: 1.12, carK: 0.045, drvK: 0.018, qNoise: 0.14, v3: true, specK: 0.4, setupK: 0.15, tempK: 0.30, qSpread: 4, fcErrAI: 2.2, fcErrEng: 1.0, mechK: 0.00007, scMech: 0.2, scCrash: 0.5, vscSpin: 0.05, mistK: 0.0065, lapNz: 0.30, errK: 0.005, lapNzK: 250, crashPerSpin: 0.09, contactDNF: 0.12, scSpeed: 1.5, engNoise: 0.5, aiNoise: 1.8, ko: true, brain: 2, posVal: 1.5, ucGap: 2.5, ucH: 0.5, ucNeed: 1.0, ucWin: 3, scMargin: 4, wxMargin: 2.5, brNz: 1.2, brHyst: 0.3, aiV: { tyreSave: 1, chase: 0, chaseGap: 1.2, defend: 0, save: 0, finish: 1 }
};

/* angka tayar v2 (dilaras untuk race 15 hingga 25 lap) */
var COMP2 = {
  S: { off: 0.00, rate: 0.137, life: 7.0 },
  M: { off: 0.42, rate: 0.076, life: 15.6 },
  H: { off: 0.65, rate: 0.048, life: 29.0 },
  I: { off: 1.20, rate: 0.050, life: 22.0 },
  W: { off: 2.00, rate: 0.040, life: 30.0 }
};
var SLICK = { S: 1, M: 1, H: 1 };
function genWeather2(c, L) {
  var r = rnd();
  if (r < c.rain * 0.3) return { type: 'basah', start: -9, end: 2 + rnd() * 5, int: 0.4 + rnd() * 0.4 };
  if (r < c.rain) { var st = L * (0.25 + rnd() * 0.45); return { type: 'hujan', start: st, end: st + 4 + rnd() * 6, int: 0.35 + rnd() * 0.65 }; }
  return { type: 'kering', start: 999, end: 999, int: 0 };
}

function laps2(c) { return c.raceLaps || clamp(Math.round(88 / c.km), 15, 25); }


/* ---------- atribut pemandu v3 (diterbitkan daripada rating lama, supaya save lama tidak rosak) ---------- */
function drvAttrs(d, on) {
  var a;
  if (!on) a = { qpace: d.pace, rpace: d.pace, start: d.race, attack: d.race, defend: d.race, restart: d.cons, save: d.tyre, adapt: d.wet, risk: 50 };
  else {
    var h = function (sl) { return hash01(d.id + 1, sl) * 2 - 1; }, sp = P2.qSpread, c1 = function (v) { return clamp(Math.round(v), 35, 100); };
    a = {
      qpace: c1(d.pace + sp * h(1)), rpace: c1(d.pace - sp * h(1)),
      start: c1(d.race + 8 * h(2)), attack: c1(d.race + 9 * h(3)), defend: c1(d.race - 9 * h(3)),
      restart: c1(d.cons + 8 * h(4)), save: c1(d.tyre + 8 * h(5)), adapt: c1(d.wet + 9 * h(6)),
      risk: clamp(Math.round(50 + 35 * h(7) + (d.race - 75) * 0.3), 5, 95)
    };
  }
  if (d.ov) for (var k in d.ov) a[k] = d.ov[k];
  return a;
}
/* profil litar: tiga paksi kuasa (enjin), downforce (aero), mekanikal (casis) */
function carProfile(c) {
  var pw = c.pw, wm = clamp((1 - pw) * (0.25 + 0.5 * (c.wear - 0.8) / 0.5), (1 - pw) * 0.2, (1 - pw) * 0.6);
  return { P: pw, M: wm, A: 1 - pw - wm };
}
function carPerf3(team, c, on) {
  if (team.spec) { var spec = carPerf(team, c); return { r: spec, q: spec }; }
  if (!on) { var p = carPerf(team, c); return { r: p, q: p }; }
  var k = team.car, id = team.id + 1, sk = P2.specK;
  var oe = 0, oa = 0, oc = 0, qb = 4.5 * (hash01(id, 14) * 2 - 1) * sk;
  var w = carProfile(c); if (team.eraProfile) { var ep = team.eraProfile; w.P *= ep.P; w.A *= ep.A; w.M *= ep.M; var total = w.P + w.A + w.M; w.P /= total; w.A /= total; w.M /= total; } var v = w.P * (k.engine + oe) + w.A * (k.aero + oa) + w.M * (k.chassis + oc);
  return { r: v - qb, q: v + qb };
}

/* zon pintas: lokasi dalam lap (0 hingga 1) dan kualiti zon */
function zonesFor(c) {
  var z = [{ at: 0.03, q: 1.0, n: 'turn 1' }, { at: 0.46, q: 0.8, n: 'hairpin' }, { at: 0.78, q: 0.6, n: 'chicane' }];
  return c.ot > 0.85 ? z.slice(0, 2) : z;
}

/* ---------- model tayar ---------- */
function dryWetTyre(R, k) { return (k === 'I' || k === 'W') && R.wet < 0.15; }
function tyreLife(f, R, k) {
  k = k || f.comp;
  return COMP2[k].life * (1 + (f.tk - 75) / 170) * (1 + (f.t.car.chassis - 75) / 400) / R.c.wear * P2.lifeScale / (dryWetTyre(R, k) ? 2.5 : 1);
}
function lossAt(f, R, k, eff) {
  var cm = COMP2[k], d = f.d, c = R.c, life = tyreLife(f, R, k), wr = P2.warm[k] || [0.3, 0.6];
  var rate = cm.rate * (dryWetTyre(R, k) ? 3 : 1) * (1 + (75 - f.t.car.chassis) / 400) * (1 + P2.tempK * ((R.temp == null ? 0.5 : R.temp) - 0.5));
  var l = cm.off + rate * c.wear * (1 + (75 - f.tk) / 200) * Math.pow(Math.max(eff, 0), P2.wearE);
  if (eff > life) l += P2.cliffK * Math.pow(eff - life, P2.cliffP);
  if (eff < wr[1]) l += wr[0] * (1 - eff / wr[1]);
  if (R.wet > 0.02) l += wetPen(COMP[k], R.wet);
  return l;
}
function tyreHealth(f, R) { return clamp(1 - f.eff / tyreLife(f, R), 0, 1); }
function stintCost(f, R, k, eff0, n) { var t = 0; for (var a = 0; a < n; a++) t += lossAt(f, R, k, eff0 + (a + 0.5) * raceDistance(R)); return t; }
function pitLossOf(f, R) { return R.c.pit * P2.pitS + (f.crewT != null ? f.crewT : crewTime(f)) - 2.4; }

/* ---------- pace: satu formula untuk semua ---------- */
function paceFree(R, f) {
  var c = R.c, d = f.d;
  var p = c.base + (100 - f.perf) * P2.carK + (100 - f.a.rpace) * P2.drvK + f.setup;
  p += lossAt(f, R, f.comp, f.eff);
  if (R.wet > 0.02) p += R.wet * 8 + (100 - (0.6 * d.wet + 0.4 * f.a.adapt)) * 0.04 * R.wet - (f.t.car.aero - 75) * 0.01 * R.wet + ((R.wet > 0.1 && R.wet < 0.6) ? (100 - f.a.adapt) * 0.01 : 0);
  p += P2.fuelPer * Math.max(f.fuel, 0) + (f.fuel <= 0 ? 3 : 0);
  if (!R.sc) {
    p += P2.push.pace[f.push] + (f.fuel > 0 ? P2.fuel.pace[raceMode(f, 'fuelMode')] : 0);
    var em = raceMode(f, 'energyMode');
    if (f.atk <= 0) p += em === 2 ? P2.energy.pace[2] * clamp(f.en / 0.15, 0, 1) : P2.energy.pace[em];
  }
  p += tyreThermalLoss(f);
  if (f.atk > 0 && !R.sc) p += P2.atk.pace;
  p += combinedPace(f.focus, f.ability, false, R.wet);
  p += f.lapNoise;
  return p;
}

function canBoost(R, f) {
  return !R.done && !R.sc && !f.fin && !f.dnf && f.hold <= 0 && f.lap >= 2 && f.en >= 0.2 && f.atk <= 0 && f.atkCd <= 0;
}
function activateBoost(R, f) {
  if (!canBoost(R, f)) return false;
  f.atk = P2.atk.dur * f.pA / raceDistance(R); f.atkCd = P2.atk.cd * f.pA / raceDistance(R); f.en -= P2.atk.en;
  return true;
}

/* ---------- strategi AI ---------- */
function mandOf(f) { var n = 0; for (var k in f.used) if (SLICK[k]) n++; return n < 2 && !f.used.I && !f.used.W; }
function wetComp(R) { return R.wet > 0.68 ? 'W' : 'I'; }
function chooseComp(f, R, rem) {
  if (R.wet > 0.28) return wetComp(R);
  var mand = mandOf(f), best = null, bt = 1e9;
  ['S', 'M', 'H'].forEach(function (k) {
    if (mand && f.used[k]) return;
    var t = stintCost(f, R, k, 0, Math.max(rem, 1));
    if (t < bt) { bt = t; best = k; }
  });
  return best || 'M';
}
/* Pelan strategi: kira kos semua pelan 1 dan 2 pit, tambah "kesilapan" ikut kemahiran jurutera, ambil yang terbaik */
function planAI2(f, R, noise) {
  var L = R.L, K = ['S', 'M', 'H'], cum = {}, pit = R.c.pit * P2.pitS + P2.stopTraffic;
  K.forEach(function (k) { var a = [0], t = 0; for (var n = 0; n < L; n++) { t += lossAt(f, R, k, (n + 0.5) * plannedWear(f, R)); a.push(t); } cum[k] = a; });
  var best = null, bt = 1e9, nz = noise == null ? 1.8 : noise;
  K.forEach(function (a) { K.forEach(function (b) {
    if (a === b) return;
    var e = gauss() * nz;
    for (var x = 3; x <= L - 3; x++) { var t = cum[a][x] + cum[b][L - x] + pit + e; if (t < bt) { bt = t; best = { seq: [a, b], cuts: [x] }; } }
  }); });
  K.forEach(function (a) { K.forEach(function (b) { K.forEach(function (d) {
    if (a === b && b === d) return;
    var e = gauss() * nz;
    for (var x = 3; x < L - 5; x++) for (var y = x + 3; y <= L - 3; y++) { var t = cum[a][x] + cum[b][y - x] + cum[d][L - y] + 2 * pit + e; if (t < bt) { bt = t; best = { seq: [a, b, d], cuts: [x, y] }; } }
  }); }); });
  f.comp = best.seq[0]; f.plan = [];
  for (var i = 1; i < best.seq.length; i++) f.plan.push({ lap: best.cuts[i - 1] + Math.round(gauss() * 0.6), comp: best.seq[i] });
}

/* push remains the tyre mode for timing-tower and legacy scripted bot compatibility. */
function raceMode(f, key) { return f[key] == null ? 1 : f[key]; }
function tyreHeat(f) { return f.tyreTemp == null ? 0.5 : f.tyreTemp; }
function tyreThermalLoss(f) { var t = tyreHeat(f); return Math.max(0, 0.35 - t) * 1.5 + Math.max(0, t - 0.78) * 2; }
function fuelMargin(R, f) {
  var sc = R.sc === 'SC' ? 0.45 : R.sc === 'VSC' ? 0.7 : 1;
  return (f.fuel - Math.max(0, R.L - f.s) * raceDistance(R) * P2.fuel.use[R.sc ? 1 : raceMode(f, 'fuelMode')] * sc) / raceDistance(R);
}
function plannedWear(f, R) {
  return (R ? raceDistance(R) : 1) * (f.bot && f.bot.push != null ? P2.push.wear[f.bot.push] * (1 + Math.max(0, tyreHeat(f) - 0.78) * 2) : P2.planWear);
}
function aiPush(R, f) {
  var rem = R.L - Math.max(0, f.s), h = tyreHealth(f, R), t = tyreHeat(f);
  if (R.sc || t > 0.82 || (f.push === 0 && t > 0.68) || (h < 0.15 && rem > 1)) return 0;
  if (f.lap <= 1) return 1;
  var fight = f.gA < 1.2 || f.gB < 0.7;
  if (h > 0.25 && (rem <= 2 || fight || (f.plan.length && f.plan[0].lap - f.lap <= 1))) return 2;
  /* Keep the existing overcut opportunity, independently of fuel/energy ownership. */
  if (f.br >= 3 && h > 0.5 && f.plan.length && f.plan[0].lap - f.lap >= 3) {
    for (var q = 0; q < R.cars.length; q++) { var r = R.cars[q]; if (r !== f && r.team !== f.team && !r.fin && r.lastPit >= f.lap - 1 && r.lastPit >= 3 && Math.abs(r.s - f.s) < 0.25) { f.why = f.why || 'overcut'; return 2; } }
  }
  if (h < 0.3 && rem > 3) return 0;
  return 1;
}
function aiRaceModes(R, f) {
  var rem = Math.max(0, R.L - f.s), spare = f.fuel / raceDistance(R) - rem, fight = f.gA < 1.2 || f.gB < 0.7;
  var fm = spare < 0.12 ? 0 : spare > rem * 0.08 + 0.12 && (fight || rem <= 2) ? 2 : 1;
  var em = 1;
  if (R.sc || f.en < 0.25 || (f.energyMode === 0 && f.en < 0.55)) em = 0;
  else if (f.en > 0.35 && (fight || rem <= 2)) em = 2;
  return { push: aiPush(R, f), fuelMode: R.sc ? 0 : fm, energyMode: em };
}
function refreshRaceModes(R, f) {
  var modes = aiRaceModes(R, f), b = f.bot || {};
  ['push', 'fuelMode', 'energyMode'].forEach(function (key) { f[key] = b[key] == null ? modes[key] : b[key]; });
}
function setRaceMode(R, f, key, value) {
  if (['push', 'fuelMode', 'energyMode'].indexOf(key) < 0 || [-1, 0, 1, 2].indexOf(value) < 0 || R.done || f.fin || f.dnf) return false;
  f.bot = f.bot || {}; f.bot[key] = value < 0 ? null : value;
  refreshRaceModes(R, f);
  return true;
}
function raceAdvice(R, f) {
  if (fuelMargin(R, f) < 0) return 'Fuel is tight at this setting. Recommend Fuel Save. Your call.';
  if (tyreHeat(f) > 0.78) return 'Tyres are too hot. Recommend Tyre Save to cool them. Your call.';
  if (tyreHealth(f, R) < 0.18) return 'Tyres are worn. Save them or consider a pit stop.';
  if (raceMode(f, 'energyMode') === 2 && f.en < 0.15) return 'Battery is low. Deploy has little effect. Recommend Harvest.';
  return '';
}

function decidePit(R, f) {
  if (f.pitReq || f.hold > 0) return;
  var rem = R.L - f.lap + 1; if (rem < 2) return;
  if (f.noPitUntil && f.lap < f.noPitUntil) return;
  if (f.br && !(f.bot && f.bot.plan)) { brainPit(R, f, rem); return; }
  var h = tyreHealth(f, R), mand = mandOf(f), bot = f.bot, wet = R.wet, slick = !!SLICK[f.comp];
  if (!(bot && bot.plan)) {
    var fc = R.w.type === 'hujan' && slick && wet < 0.28 && R.lapPos >= R.w.start + f.fcErr - 1 && R.lapPos < R.w.end - 1;
    if (slick && ((wet > 0.30 && rnd() < 0.4) || (fc && rnd() < 0.5))) { f.pitReq = (wet > 0.30 ? wetComp(R) : (R.w.int > 0.7 ? 'W' : 'I')); f.plan = []; return; }
    if (!slick) {
      if (wet < 0.17 && rnd() < 0.4) { f.pitReq = chooseComp(f, R, rem); f.plan = []; }
      else if (f.comp === 'I' && wet > 0.72 && rnd() < 0.4) f.pitReq = 'W';
      else if (f.comp === 'W' && wet < 0.5 && wet > 0.2 && rnd() < 0.3) f.pitReq = 'I';
      return;
    }
  }
  function worth(k) {
    if (mand) return true;
    var ride = stintCost(f, R, f.comp, f.eff, rem), pit = pitLossOf(f, R) + stintCost(f, R, k, 0, rem);
    return pit < ride;
  }
  if (f.plan.length) {
    var pl = f.plan[0];
    if (f.lap >= pl.lap) { if (bot || worth(pl.comp)) { f.pitReq = pl.comp; f.plan.shift(); } else f.plan.shift(); return; }
    /* undercut: pit lebih awal bila kereta depan dekat */
    var uc = bot ? bot.undercut : rnd() < 0.3;
    if (uc && f.lap >= Math.max(3, pl.lap - 4) && h < (bot ? 0.8 : 0.7) && f.gA < (bot ? 2.2 : 2.6) && f.lap >= 3) { f.pitReq = pl.comp; f.plan.shift(); return; }
  }
  if (h <= 0.04) { var k = chooseComp(f, R, rem); if (worth(k)) { f.pitReq = k; if (f.plan.length) f.plan.shift(); return; } }
  if (mand && rem <= 3) f.pitReq = chooseComp(f, R, rem);
}

/* ---------- otak strategi v2 (Fasa 4): kira nilai, bukan dadu ---------- */
function lossW(f, R, k, eff, wet) { var w = R.wet; R.wet = wet; var v = lossAt(f, R, k, eff); R.wet = w; return v; }
/* ramalan basah untuk H lap ke depan (ikut ramalan kereta ini: ralat masa fcErr) */
function wetPath(R, f, H) {
  var W = R.w, out = [], w = R.wet, st = W.start + f.fcErr, en = W.end + f.fcErr * 0.7;
  for (var a = 0; a < H; a++) {
    var lp = R.lapPos + a + 0.5, tgt = (W.type !== 'kering' && lp >= st && lp < en) ? W.int : 0;
    if (w < tgt) w = Math.min(tgt, w + 0.16 * Math.max(0.5, W.int)); else w = Math.max(0, w - 0.07);
    out.push(w);
  }
  return out;
}
var KS = ['S', 'M', 'H'], KI = { S: 0, M: 1, H: 2 };
/* pelan terbaik dari keadaan sekarang: 0, 1 atau 2 pit. Hingar tetap-per-kereta ikut kemahiran jurutera. */
function planFrom(f, R, comp, eff0, rem, needMand, pitC) {
  var pw = plannedWear(f, R), nz = (f.isP ? P2.engNoise : P2.aiNoise) * P2.brNz, cum0 = [0], t = 0, cumF = {}, n, i;
  for (n = 0; n < rem; n++) { t += lossAt(f, R, comp, eff0 + (n + 0.5) * pw); cum0.push(t); }
  KS.forEach(function (k) { var a = [0], s = 0; for (var m = 0; m < rem; m++) { s += lossAt(f, R, k, (m + 0.5) * pw); a.push(s); } cumF[k] = a; });
  function e(code) { return (hash01(f.di + 1, 100 + code + 17 * R.ci) * 2 - 1) * nz * 1.7; }
  var best = { cost: 1e9, stops: [] };
  if (!needMand) { best = { cost: cum0[rem] + e(0), stops: [] }; }
  var c0 = KI[comp] == null ? 1 : KI[comp];
  for (i = 0; i < 3; i++) {
    var b = KS[i]; if (needMand && b === comp) continue;
    var eb = e(1 + c0 * 3 + i);
    for (var x = 1; x <= rem - 2; x++) { var cst = cum0[x] + pitC + cumF[b][rem - x] + eb; if (cst < best.cost) best = { cost: cst, stops: [{ x: x, comp: b }] }; }
  }
  if (rem >= 8) for (i = 0; i < 3; i++) for (var j = 0; j < 3; j++) {
    var b2 = KS[i], d2 = KS[j]; if (needMand && b2 === comp && d2 === comp) continue;
    var e2 = e(12 + c0 * 9 + i * 3 + j);
    for (var x1 = 2; x1 <= rem - 6; x1++) for (var y = x1 + 3; y <= rem - 3; y++) {
      var c2 = cum0[x1] + pitC + cumF[b2][y - x1] + pitC + cumF[d2][rem - y] + e2; if (c2 < best.cost) best = { cost: c2, stops: [{ x: x1, comp: b2 }, { x: y, comp: d2 }] };
    }
  }
  return best;
}

function nearAhead(R, f) {
  var best = null, bd = 1e9;
  R.cars.forEach(function (r) { if (r === f || r.fin || r.hold > 0) return; var d = r.s - f.s; if (d > 0 && d < bd) { bd = d; best = r; } });
  return best;
}
/* undercut: pit awal bila kereta depan dekat dan tayar baru cukup laju untuk melompatinya */
function undercutEval(R, f, rem) {
  if (f.lap < 3 || rem < 5 || f.lap - f.lastPit < 5) return null;
  var ah = nearAhead(R, f); if (!ah || ah.team === f.team) return null;
  var gap = (ah.s - f.s) * f.pA; if (gap > P2.ucGap || ah.stops > f.stops) return null;
  if (tyreHealth(f, R) > P2.ucH) return null;
  var mand = mandOf(f), pitC = pitLossOf(f, R) + P2.stopTraffic, stay = planFrom(f, R, f.comp, f.eff, rem, mand, pitC);
  if (!stay.stops.length || stay.stops[0].x > P2.ucWin) return null;
  var cur = lossAt(f, R, f.comp, f.eff + 0.5), best = null, bc = 1e9;
  KS.forEach(function (k) {
    if (mand && k === f.comp) return;
    var c = cur + pitC + planFrom(f, R, k, 0, rem - 1, mand && k === f.comp, pitC).cost;
    if (c < bc) { bc = c; best = k; }
  });
  if (!best) return null;
  var dl = (cur - lossAt(f, R, best, 1.5) + cur - lossAt(f, R, best, 2.5)) / 2 * 2;   /* untung ~2 lap */
  if (dl < gap + P2.ucNeed) return null;
  return (bc - stay.cost < P2.posVal) ? best : null;
}
function brainPlan(R, f, rem) {                  /* kemas kini pelan pit dari keadaan sekarang */
  var pitC = pitLossOf(f, R) + P2.stopTraffic, mand = mandOf(f);
  var bp = planFrom(f, R, f.comp, f.eff, rem, mand, pitC);
  var old = f.plan.length;
  f.plan = bp.stops.map(function (s) { return { lap: f.lap + s.x - 1, comp: s.comp }; });
  return bp;
}
/* basah: atur cara dinamik atas baki race, termasuk kos pit balik ke tayar lain bila trek kering/basah semula */
function wetEval(R, f, rem) {
  var r = Math.min(rem, 24); if (r < 2) return null;
  var wp = wetPath(R, f, r), K = ['I', 'W', 'S', 'M', 'H'], cur = f.comp, e0 = f.eff, i, k, s;
  var sc = R.sc === 'SC' ? 0.5 : R.sc === 'VSC' ? 0.7 : 1, pit0 = pitLossOf(f, R) * sc, pitF = pitLossOf(f, R) + P2.stopTraffic * 0.5;
  var INIT = [], LT = {};
  for (i = 0; i < r; i++) INIT.push(lossW(f, R, cur, e0 + (i + 0.5) * raceDistance(R), wp[i]));
  K.forEach(function (kk) { LT[kk] = []; for (var a = 0; a < r; a++) { var row = []; for (var ii = a; ii < r; ii++) row[ii] = lossW(f, R, kk, (a + 0.5) * raceDistance(R), wp[ii]); LT[kk][a] = row; } });
  var Vf = {}; K.forEach(function (kk) { Vf[kk] = []; for (var ii = 0; ii < r; ii++) Vf[kk][ii] = []; });
  var B = [], Vi = [];
  for (i = r - 1; i >= 0; i--) {
    K.forEach(function (kk) {
      for (var ss = 0; ss <= i; ss++) {
        var v = LT[kk][i - ss][i];
        if (i < r - 1) v += Math.min(Vf[kk][i + 1][ss], pitF + B[i + 1]);
        Vf[kk][i][ss] = v;
      }
    });
    var bm = 1e9; K.forEach(function (kk) { if (Vf[kk][i][i] < bm) bm = Vf[kk][i][i]; }); B[i] = bm;
    Vi[i] = INIT[i] + (i < r - 1 ? Math.min(Vi[i + 1], pitF + B[i + 1]) : 0);
  }
  var stay = Vi[1], best = null, bc = 1e9;
  K.forEach(function (kk) { if (kk === cur) return; var c = pit0 + Vf[kk][1][1]; if (c < bc) { bc = c; best = kk; } });
  var bg = P2.wxMargin + ((f.lap - f.lastPit) < 3 ? 2 : 0);
  return (best && stay - bc > bg) ? best : null;
}
/* safety car: bandingkan "kekal" dengan "pit murah sekarang" */
function scEval(R, f, rem) {
  var fac = R.sc === 'SC' ? 0.5 : 0.7, pf = pitLossOf(f, R), mand = mandOf(f), pitC = pf + P2.stopTraffic;
  var stay = planFrom(f, R, f.comp, f.eff, rem, mand, pitC).cost, best = null, bc = 1e9;
  KS.forEach(function (k) {
    if (f.lap - f.lastPit < 2 && k === f.comp) return;
    var m2 = mand && k === f.comp, c = pf * fac + planFrom(f, R, k, 0, rem, m2, pitC).cost;
    if (c < bc) { bc = c; best = k; }
  });
  return (stay - bc > P2.scMargin) ? best : null;
}
function brainSC(R, f, rem) {
  if (R.wet > 0.28 || !SLICK[f.comp]) { var wk = wetEval(R, f, rem); if (wk) { f.pitReq = wk; f.plan = []; f.why = 'sc+cuaca'; } return; }
  var k = scEval(R, f, rem);
  if (k) { f.pitReq = k; f.plan = []; f.why = 'sc'; }
}
function brainPit(R, f, rem) {
  var wetNow = R.wet > 0.04 || !SLICK[f.comp] || R.w.type !== 'kering';
  if (wetNow) {
    var wk = wetEval(R, f, rem);
    if (wk) { f.pitReq = wk; f.plan = []; f.why = 'cuaca'; return; }
    if (R.wet > 0.28 || !SLICK[f.comp]) return;
  }
  if (R.sc) { var k = scEval(R, f, rem); if (k) { f.pitReq = k; f.plan = []; f.why = 'sc'; return; } }
  if (f.lap < 2 || rem < 2) return;
  if (f.br >= 2) { var uk = undercutEval(R, f, rem); if (uk) { f.pitReq = uk; f.plan = []; f.why = 'undercut'; return; } }
  brainPlan(R, f, rem);
  if (f.plan.length && f.plan[0].lap <= f.lap) { f.pitReq = f.plan[0].comp; f.plan.shift(); f.why = 'pelan'; }
}

function engineerLap(R, f) {
  decidePit(R, f);
  refreshRaceModes(R, f);
  if (f.isP) {
    var advice = raceAdvice(R, f);
    if (advice && (advice !== f.lastAdvice || f.lap - (f.adviceLap || 0) >= 3)) {
      (R.radio = R.radio || []).push({ lap: f.lap, t: advice, k: 'e', imp: 1 }); f.adviceLap = f.lap;
    }
    f.lastAdvice = advice;
  }
}

/* ---------- penciptaan race ---------- */
function makeRace2(S, ci, gridIds, o) {
  trainingPrepare(S);
  evaluationPrepare(S, ci);
  o = o || {};
  var c = circuitFor(S, ci), L = laps2(c);
  var R = { v: 2, distanceScale: c.distanceScale || 1, c: c, ci: ci, L: L, dt: c.base / TICKS_PER_LAP, t: 0, ticks: 0, cars: [], log: [], done: false, nPass: 0, nClean: 0, nStart: 0, nFail: 0, nContact: 0, tagCount: {}, zones: zonesFor(c), lap: 1, lapPos: 0, drsOK: true, sc: 0, scT: 0, scCool: 0, restartT: 0, nDNF: 0, nSC: 0, nVSC: 0, nSpin: 0, nMech: 0, nCrash: 0 };
  var qq = P2._q; P2._q = null;
  R.temp = o.temp != null ? o.temp : (qq ? qq.temp : (P2.v3 ? rnd() : 0.5));
  R.setup = o.setup || (qq ? qq.setup : {});
  R.w = o.weather || genWeather2(c, L); R.wet = R.w.start < 0 ? R.w.int * 0.9 : 0;
  gridIds.forEach(function (di, i) {
    var d = S.drivers[di], team = S.teams[d.team], cp = carPerf3(team, c, P2.v3), a3 = worldAttributes(S, d);
    if (R.setup[d.team] == null) R.setup[d.team] = worldSetup(team);
    var f = {
      di: di, d: d, focus: driverFocus(S, di), ability: abilityEffects(S, ci, di), a: a3, tk: 0.35 * d.tyre + 0.65 * a3.save, t: team, team: d.team, perf: cp.r, perfQ: cp.q, setup: (R.setup[d.team] || 0) + (P2.v3 ? gauss() * 0.04 : 0), grid: i + 1,
      s: -((i + 1) * P2.gridGap + gauss() * 0.2) / c.base, sPrev: 0, lap: 1, lapStart: 0, lapNoise: 0,
      comp: 'M', eff: 0, tyreTemp: 0.3, push: 1, fuelMode: 1, energyMode: 1, en: 0.8, fuel: L * (c.distanceScale || 1) * P2.fuel0, hold: 0, pitReq: null, stops: 0, used: {}, plan: [],
      atk: 0, atkCd: 0, pF: c.base, pA: c.base, gA: 99, gB: 99, drs: false, dirty: 0, fin: false, tFin: 0,
      br: (o.brains && o.brains[di] != null) ? +o.brains[di] : +P2.brain, passes: 0, passed: 0, lastPit: -9, dnf: null, fcErr: di === S.pi && o.fcErr != null ? o.fcErr : gauss() * ((di === S.pi) ? P2.fcErrEng : P2.fcErrAI), isP: di === S.pi, bot: null, best: 999, laps: []
    };
    planAI2(f, R, (di === S.pi) ? P2.engNoise : P2.aiNoise);
    if (o.bots && o.bots[di]) {
      f.bot = o.bots[di];
      if (f.bot.plan) { f.comp = f.bot.plan.comp; f.plan = f.bot.plan.stops.map(function (s) { return { lap: s.lap, comp: s.comp }; }); }
    }
    if (R.wet > 0.28 && !(f.bot && f.bot.plan)) { f.comp = wetComp(R); f.plan = []; }
    f.used[f.comp] = 1;
    f.s += (f.a.start - 75) * 0.018 / c.base;
    refreshRaceModes(R, f);
    R.cars.push(f);
  });
  return R;
}

/* ---------- insiden dan safety car ---------- */
function startSC(R, kind) {
  var c = R.c;
  R.sc = kind; R.scCool = 5 * c.base;
  R.scT = kind === 'SC' ? rr(3, 5) * c.base * P2.scSpeed : rr(1.5, 2.5) * c.base * 1.4;
  if (kind === 'SC') R.nSC++; else R.nVSC++;
  R.log.push({ t: R.t, lap: R.lapPos | 0, k: kind === 'SC' ? 'sc' : 'vsc', tags: [kind] });
  /* AI nampak peluang pit murah */
  R.cars.forEach(function (f) {
    if (f.fin || f.pitReq || f.hold > 0 || (f.bot && f.bot.plan)) return;
    var rem = R.L - f.lap + 1; if (rem < 4) return;
    if (f.noPitUntil && f.lap < f.noPitUntil) return;
    if (f.br) { brainSC(R, f, rem); return; }
    var h = tyreHealth(f, R), planSoon = f.plan.length && f.plan[0].lap - f.lap <= 5;
    if ((h < 0.65 || planSoon) && rnd() < (kind === 'SC' ? 0.7 : 0.45)) {
      f.pitReq = f.plan.length ? f.plan[0].comp : chooseComp(f, R, rem);
      if (!(R.wet > 0.28) && f.plan.length) f.plan.shift();
      if (R.wet > 0.28) f.pitReq = chooseComp(f, R, rem);
    }
  });
}
function maybeSC(R, pFull, pVsc) {
  if (R.sc || R.scCool > 0 || R.lapPos > R.L - 2) return;
  var r = rnd();
  if (r < pFull) startSC(R, 'SC'); else if (r < pFull + pVsc) startSC(R, 'VSC');
}
function retire(R, f, reason, pFull, pVsc) {
  f.fin = true; f.dnf = reason; f.tFin = 1e9; f.dnfS = f.s; R.nDNF++;
  if (reason === 'Mechanical failure') R.nMech++; else R.nCrash++;
  R.log.push({ t: R.t, lap: f.lap, k: 'dnf', b: f.di, tags: [reason] });
  maybeSC(R, pFull, pVsc);
}
function incidents(R, trk) {
  var T = TICKS_PER_LAP, wet = R.wet;
  trk.forEach(function (f) {
    if (f.fin || f.hold > 0) return;
    var d = f.d, pm = (100 - f.t.car.rel) * P2.mechK * (1 + f.eff * 0.003) / T;
    var pe = P2.mistK * (1 + (100 - (0.7 * d.cons + 0.3 * f.a.restart)) / 30) * (R.sc ? 1 : [0.7, 1, 1.5][f.push]) * (1 + Math.max(0, tyreHeat(f) - 0.78) * 3 + Math.max(0, 0.2 - tyreHealth(f, R)) * 2) * (1 + wet * 2.5 * (1 + (100 - (0.6 * d.wet + 0.4 * f.a.adapt)) / 40)) * (1 + (f.a.risk - 50) / 170) * (f.lap <= 1 ? 3 : 1) * (f.gA < 0.8 ? 1.3 : 1) * (R.sc ? 0.1 : 1) / T;
    pe *= combinedRisk(R, f);
    var r = rnd();
    if (r < pm) retire(R, f, 'Mechanical failure', P2.scMech, P2.scMech);
    else if (r < pm + pe) {
      R.nSpin++; f.evalSpins = (f.evalSpins || 0) + 1;
      if (rnd() < P2.crashPerSpin * (1 + wet)) retire(R, f, 'Crash', P2.scCrash, P2.scCrash * 0.4);
      else {
        f.hold += rr(5, 11);
        R.log.push({ t: R.t, lap: f.lap, k: 'spin', b: f.di, tags: ['kesilapan'] });
        maybeSC(R, 0, P2.vscSpin);
      }
    }
  });
}

/* ---------- pintasan ---------- */
function attemptPass(R, b, a, z) {
  var c = R.c, adv = a.pF - b.pF;
  var s = adv * P2.advK + (b.a.attack - a.a.defend) / 32 + (b.a.risk - 50) / 55 + (b.lap <= 1 ? (b.a.start - a.a.start) / 25 : 0) + (R.restartT > 0 ? (b.a.restart - a.a.restart) / 22 : 0) + (b.drs ? 0.55 : 0) + (b.atk > 0 ? 0.6 : 0) - (a.atk > 0 ? 0.5 : 0)
    + (b.en > 0.3 ? 0.15 : 0) - c.ot * (P2.otK - 1.4 * z.q) + ((b.lap <= 1 || R.restartT > 0) ? P2.lap1 : 0) - (a.energyMode === 2 && a.en > 0.2 ? 0.2 : 0)
    + (b.mgAtk || 0) - (a.mgDef || 0) + (b.lap <= 1 ? (b.l1b || 0) - (a.l1b || 0) : 0) + (R.restartT > 0 ? (b.rsb || 0) - (a.rsb || 0) : 0);
  b.mgAtk = 0; a.mgDef = 0;
  var p = 1 / (1 + Math.exp(-s * P2.passK));
  var ok = rnd() < p, tags = [];
  if (adv > 0.3) tags.push('pace'); if (b.drs) tags.push('drs'); if (b.atk > 0) tags.push('attack');
  if (lossAt(a, R, a.comp, a.eff) - lossAt(b, R, b.comp, b.eff) > 0.35) tags.push('tayar');
  if (b.a.attack - a.a.defend > 6) tags.push('skil'); if (b.a.risk > 70 && p < 0.5) tags.push('agresif'); if (b.lap <= 1) tags.push('start');
  var cyc = (b.lap - b.lastPit <= 3) || (a.lap - a.lastPit <= 3); if (cyc) tags.push('kitaran-pit');
  if (!tags.length) tags.push('peluang');
  R.log.push({ t: R.t, lap: b.lap, k: ok ? 'pass' : 'fail', b: b.di, a: a.di, p: p, zone: z.n, tags: tags });
  if (ok) { R.nPass++; if (!cyc && b.lap > 1) R.nClean++; if (b.lap <= 1) R.nStart++; b.passes++; a.passed++; tags.forEach(function (g) { R.tagCount[g] = (R.tagCount[g] || 0) + 1; }); }
  else {
    R.nFail++;
    var pc = 0.012 * (1 + (b.push === 2 ? 1 : 0)) * (0.6 + c.ot) * (1 + (100 - (b.a.attack + b.a.defend) / 2) / 60) * (1 + (b.a.risk - 50) / 110);
    if (rnd() < pc) {
      R.nContact++; b.hold += rr(2, 6); if (rnd() < 0.35) a.hold += rr(1, 3);
      if (rnd() < P2.contactDNF) retire(R, b, 'Crash', P2.scCrash, P2.scCrash * 0.4);
      R.log.push({ t: R.t, lap: b.lap, k: 'contact', b: b.di, a: a.di, zone: z.n, tags: ['sentuhan'] });
    }
  }
  return ok;
}

function nextZoneDist(R, f) {
  var m = 9;
  R.zones.forEach(function (z) { var zs = Math.floor(f.s - z.at) + 1 + z.at; var d = zs - f.s; if (d < m) m = d; });
  return m;
}

/* ---------- satu langkah masa ---------- */
function tick2(R) {
  var dt = R.dt, c = R.c, L = R.L;
  var act = R.cars.filter(function (f) { return !f.fin; });
  act.sort(function (x, y) { return y.s - x.s; });
  var trk = act.filter(function (x) { return x.hold <= 0; });
  trk.forEach(function (b, i) {
    var a = i > 0 ? trk[i - 1] : null, n = i < trk.length - 1 ? trk[i + 1] : null;
    b.gA = a ? Math.max(0, a.s - b.s) * a.pA : 99;
    b.gB = n ? Math.max(0, b.s - n.s) * b.pA : 99;
  });
  /* cuaca ikut posisi pendahulu */
  R.lapPos = act.length ? act[0].s : R.lapPos;
  var w = R.w, wtgt = (R.lapPos >= w.start && R.lapPos < w.end) ? w.int : 0, pw0 = R.wet;
  if (R.wet < wtgt) R.wet = Math.min(wtgt, R.wet + 0.16 * Math.max(0.5, w.int) * dt / c.base); else R.wet = Math.max(0, R.wet - 0.07 * dt / c.base);
  if (pw0 < 0.12 && R.wet >= 0.12) R.log.push({ t: R.t, lap: R.lapPos | 0, k: 'wx', tags: ['rain starts'] });
  if (pw0 >= 0.25 && R.wet < 0.25) R.log.push({ t: R.t, lap: R.lapPos | 0, k: 'wx', tags: ['kering'] });
  R.drsOK = R.wet < 0.4 && !R.sc;
  trk.forEach(function (f) { refreshRaceModes(R, f); });
  incidents(R, trk);
  act = act.filter(function (x) { return !x.fin; }); trk = trk.filter(function (x) { return !x.fin; });
  if (R.scCool > 0) R.scCool -= dt;
  if (R.restartT > 0) R.restartT -= dt;
  /* tolak serang AI */
  trk.forEach(function (f) {
    if ((f.bot && (f.bot.noAttack || f.bot.energyMode != null)) || raceMode(f, 'energyMode') === 0) return;
    if (!canBoost(R, f)) return;
    var d = nextZoneDist(R, f);
    if (d < 0.12 && ((f.gA < 0.8 && rnd() < 0.6) || (f.gB < 0.5 && f.en > 0.3 && rnd() < 0.35))) {
      activateBoost(R, f);
    }
  });
  /* pace */
  act.forEach(function (f) {
    f.pF = paceFree(R, f);
    var m = 0; f.drs = false; f.dirty = 0;
    if (f.hold <= 0) {
      var eg = f.t.car.engine / 80;
      if (f.gA < P2.dirty.gap) { var k = 1 - f.gA / P2.dirty.gap; f.dirty = k; m += P2.dirty.pace * k * (1 - c.pw * 0.6) * (1 + (f.t.car.aero - 75) / 150); }
      if (f.gA < P2.slip.gap) m -= P2.slip.pace * (1 - f.gA / P2.slip.gap) * c.pw * eg;
      if (f.gA < P2.drs.gap && f.lap >= 3 && R.drsOK) { f.drs = true; m += P2.drs.pace * (0.5 + 0.5 * c.pw) * eg; }
    }
    f.pA = f.pF + m;
    if (R.sc === 'VSC') f.pA = f.pF * 1.4;
    else if (R.sc === 'SC') f.pA = c.base * P2.scSpeed * ((f.gA > 1.5 && f.gA < 90) ? 0.8 : 1);
  });
  /* gerakan */
  act.forEach(function (f) {
    f.sPrev = f.s; f.pitFresh = 0; f.waitT = 0;
    var tm = dt;
    if (f.hold > 0) { var u = Math.min(f.hold, tm); f.hold -= u; tm -= u; f.waitT += u; }
    if (tm <= 0) return;
    var boosting = f.atk > 0 && !R.sc;
    var scW = R.sc === 'SC' ? 0.3 : R.sc === 'VSC' ? 0.55 : 1, scF = R.sc === 'SC' ? 0.45 : R.sc === 'VSC' ? 0.7 : 1;
    var wm = P2.push.wear[R.sc ? 1 : f.push] * (1 + Math.max(0, tyreHeat(f) - 0.78) * 2) * (1 + P2.dirty.wear * f.dirty) * (boosting ? P2.atk.wear : 1) * scW;
    var fm = P2.fuel.use[R.sc ? 1 : raceMode(f, 'fuelMode')] * (boosting ? 1.05 : 1) * scF;
    var enr = P2.energy.charge[R.sc ? 0 : raceMode(f, 'energyMode')]; if (boosting && enr > 0) enr = 0; if (R.sc) enr = enr > 0 ? enr * 1.3 : enr * 0.15;
    function drive(distance) {
      f.s += distance; f.eff += distance * raceDistance(R) * wm * (f.ability ? f.ability.tyre : 1); f.fuel -= distance * raceDistance(R) * fm;
      var target = R.sc ? 0.25 : [0.40, 0.62, 0.98][f.push] + ((R.temp == null ? 0.5 : R.temp) - 0.5) * 0.14 + f.dirty * 0.08 - R.wet * 0.18;
      f.tyreTemp = clamp(tyreHeat(f) + (target - tyreHeat(f)) * (1 - Math.exp(-distance * raceDistance(R) * 0.8)), 0, 1.2);
      f.en = clamp(f.en + distance * raceDistance(R) * (enr > 0 ? enr * f.t.car.engine / 80 : enr), 0, 1);
    }
    var dl = tm / f.pA, pitS = Math.floor(f.sPrev + 0.03) + 0.97;
    if (f.pitReq && f.lap < L && f.sPrev < pitS && f.s + dl >= pitS) {
      dl = pitS - f.sPrev; drive(dl); tm = Math.max(0, tm - dl * f.pA);
      f.s = pitS; var entryT = R.t + dt - tm;
      var k = f.pitReq; f.pitReq = null;
      f.hold = pitLossOf(f, R) * (R.sc === 'SC' ? 0.5 : R.sc === 'VSC' ? 0.7 : 1); f.crewT = null; f.comp = k; f.eff = 0; f.tyreTemp = 0.3; f.stops++; f.used[k] = 1; f.pitFresh = 1; f.lastPit = f.lap;
      R.log.push({ t: entryT, lap: f.lap, k: 'pit', b: f.di, comp: k, loss: f.hold, tags: ['pit'].concat(f.why ? [f.why] : []) }); f.why = null;
      var pitWait = Math.min(f.hold, tm); f.hold -= pitWait; tm -= pitWait; f.waitT += pitWait;
      if (tm > 0) drive(tm / f.pA);
    } else drive(dl);
  });
  /* kekang jarak dan pintasan */
  var prev = null;
  for (var i = 0; i < trk.length; i++) {
    var b = trk[i];
    if (b.hold > 0) continue;
    if (prev) {
      var lim = prev.s - (R.sc === 'SC' ? 0.8 : P2.minGap) / prev.pA;
      if (b.s > lim) {
        b.s = Math.max(Math.min(b.s, lim), b.sPrev);
        var cross = null;
        R.zones.forEach(function (z) { if (Math.floor(b.s - z.at) > Math.floor(b.sPrev - z.at)) cross = z; });
        if (cross && !R.sc && (prev.s - b.s) * prev.pA <= 0.9 && attemptPass(R, b, prev, cross)) {
          var aOld = prev.s;
          b.s = aOld; prev.s = aOld - 0.0004;
          /* b kini di hadapan; kereta di belakang diperiksa terhadap prev (yang kini di belakang b) */
          continue;
        }
      }
    }
    prev = b;
  }
  /* tamat dan lap baru */
  R.t += dt;
  if (R.sc) { R.scT -= dt; if (R.scT <= 0) { R.log.push({ t: R.t, lap: R.lapPos | 0, k: 'restart', tags: [R.sc + ' tamat'] }); R.sc = 0; R.restartT = c.base * 1.1; } }
  act.forEach(function (f) {
    if (f.atk > 0) f.atk = Math.max(0, f.atk - dt);
    if (f.atkCd > 0) f.atkCd = Math.max(0, f.atkCd - dt);
    var wait = f.waitT || 0, moving = dt - wait;
    if (f.s >= L) {
      f.fin = true; f.tFin = R.t - dt + wait + moving * (L - f.sPrev) / Math.max(f.s - f.sPrev, 1e-9);
      return;
    }
    var nl = Math.max(1, Math.floor(f.s) + 1);
    while (f.lap < nl) {
      f.lap++; var tc = R.t - dt + wait + moving * clamp((f.lap - 1 - f.sPrev) / Math.max(f.s - f.sPrev, 1e-9), 0, 1), lt = tc - f.lapStart; f.lapStart = tc; f.laps.push(lt); if (f.lap > 2 && lt < f.best) f.best = lt;
      f.lapNoise = gauss() * (P2.lapNz - (f.d.cons - 70) / P2.lapNzK) + Math.abs(gauss()) * (100 - f.d.cons) * P2.errK;
      engineerLap(R, f);
    }
  });
  R.ticks++;
  var ld = R.cars.filter(function (x) { return !x.fin; }); R.done = ld.length === 0;
  if (!R.done) R.lap = ld.reduce(function (m, x) { return Math.max(m, x.lap); }, 1);
  if (R.ticks > TICKS_PER_LAP * L * 3) R.done = true;
}

function runRace2(S, ci, gridIds, o) {
  var R = makeRace2(S, ci, gridIds, o);
  R.cars.forEach(function (f) { engineerLap(R, f); });
  while (!R.done) tick2(R);
  R.cls = R.cars.slice().sort(function (a, b) { var ta = a.dnf ? 1e9 - a.dnfS : a.tFin + (a.pen || 0), tb = b.dnf ? 1e9 - b.dnfS : b.tFin + (b.pen || 0); return ta - tb; });
  R.cls.forEach(function (f, i) { f.pos = i + 1; });
  return R;
}

/* kelayakan: kereta (bias kelayakan), pace kelayakan pemandu, hingar ikut konsistensi, setup hujung minggu */
function qualiGrid2(S, ci, mod) {
  trainingPrepare(S);
  evaluationPrepare(S, ci);
  if (P2.ko && typeof qkAuto === 'function') return qkAuto(S, ci, 0, mod);
  var c = circuitFor(S, ci), setup = {}, temp = P2.v3 ? rnd() : 0.5;
  S.teams.forEach(function (t) { setup[t.id] = (P2.v3 ? gauss() * P2.setupK : 0) + worldSetup(t); });
  var rows = S.drivers.map(function (d) {
    var team = S.teams[d.team], cp = carPerf3(team, c, P2.v3), a = worldAttributes(S, d);
    var t = (100 - cp.q) * P2.carK + (100 - a.qpace) * P2.drvK + setup[team.id] + gauss() * (P2.qNoise - (d.cons - 70) / 600);
    t += combinedPace(driverFocus(S, d.id), abilityEffects(S, ci, d.id), true, 0);
    if (d.id === S.pi && mod != null) t += mod;
    return { di: d.id, t: t };
  });
  rows.sort(function (a, b) { return a.t - b.t; });
  rows.forEach(function (r, i) { r.pos = i + 1; r.lap = c.base - 1.6 + r.t; });
  P2._qrows = rows;
  var g = rows.map(function (r) { return r.di; });
  P2._q = { setup: setup, temp: temp };
  return g;
}
