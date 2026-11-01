'use strict';
/* ===== Enjin perlumbaan: kelayakan, tayar, cuaca, pas, safety car ===== */
function carPerf(team, c) { var k = team.car; return c.pw * k.engine + (1 - c.pw) * (k.aero * 0.55 + k.chassis * 0.45); }
function wetPen(cm, wet) { var x = Math.abs(wet - cm.opt) - 0.1; return x > 0 ? 16 * Math.pow(x, 1.15) : 0; }
var MODEW = [0.7, 1, 1.35];

function tyreState(car, R) {
  var cm = COMP[car.comp], c = R.c, d = car.d;
  var dry = (car.comp === 'I' || car.comp === 'W') && R.wet < 0.15;
  var rate = cm.rate * (dry ? 3 : 1);
  var life = cm.life * (1 + (d.tyre - 75) / 250) / c.wear / (dry ? 2.5 : 1);
  var p = rate * c.wear * (1 + (75 - d.tyre) / 300) * car.eff;
  if (car.eff > life) p += 0.32 * Math.pow(car.eff - life, 1.4);
  return { p: p, life: life, health: clamp(1 - car.eff / life, 0, 1) };
}
function estStint(d, k, c, rem) {
  var cm = COMP[k], life = cm.life * (1 + (d.tyre - 75) / 250) / c.wear, tot = 0;
  for (var a = 0; a < rem; a++) { tot += cm.off + cm.rate * c.wear * (1 + (75 - d.tyre) / 300) * a; if (a > life) tot += 0.32 * Math.pow(a - life, 1.4); }
  return tot;
}
function bestWetCost(w) {
  return Math.min(wetPen(COMP.S, w), wetPen(COMP.I, w) + COMP.I.off, wetPen(COMP.W, w) + COMP.W.off);
}
function crewTime(car) { return clamp(2.35 + Math.abs(gauss()) * 0.45 - car.t.prestige * 0.025 + (rnd() < 0.07 ? rr(2, 6) : 0), 1.9, 9); }

function genWeather(c) {
  var r = rnd();
  if (r < c.rain * 0.3) return { start: -9, end: Math.floor(2 + rnd() * 5), int: 0.4 + rnd() * 0.4, type: 'basah' };
  if (r < c.rain) { var st = Math.floor(c.laps * (0.3 + rnd() * 0.4)); return { start: st, end: st + Math.floor(5 + rnd() * 8), int: 0.35 + rnd() * 0.65, type: 'hujan' }; }
  return { start: 999, end: 999, int: 0, type: 'kering' };
}
function forecastText(c, w) {
  var lie = rnd() < 0.15;
  if (w.type === 'basah' && !lie) return 'Wet track at the start, expected to dry within the first few laps.';
  if (w.type === 'hujan' && !lie) { var a = Math.max(2, w.start + Math.round(gauss() * 1.5)); return 'Rain expected around lap ' + a + '–' + (a + 7) + '. Exact timing may vary.'; }
  if (w.type === 'kering' && lie) return 'Mostly dry, but there are dark clouds in the distance.';
  return 'Dry for the whole race.';
}
function genQualiWet(c, w) { return w.start < 0 ? w.int * 0.8 : (rnd() < c.rain * 0.12 ? 0.35 : 0); }

function runQuali(S, c, wetQ, mod) {
  var rows = S.drivers.map(function (d) {
    var team = S.teams[d.team];
    var t = c.base - 1.6 + (100 - carPerf(team, c)) * 0.035 + (100 - d.pace) * 0.017;
    t += wetQ * 8 + (100 - d.wet) * 0.04 * wetQ + bestWetCost(wetQ);
    t += gauss() * (0.17 - (d.cons - 70) / 600);
    if (d.id === S.pi && mod != null) t += mod;
    return { di: d.id, t: t };
  });
  rows.sort(function (a, b) { return a.t - b.t; });
  rows.forEach(function (r, i) { r.pos = i + 1; });
  return rows;
}

function estCompare(car, R, k, rem) { return estStint(car.d, k, R.c, rem); }
function chooseComp(car, R) {
  if (R.wet > 0.68) return 'W';
  if (R.wet > 0.28) return 'I';
  var rem = R.c.laps - R.lap;
  var dry = ['S', 'M', 'H'].filter(function (k) { return car.used[k]; });
  var need = dry.length < 2 && !(car.used.I || car.used.W);
  var best = null, bt = 1e9;
  ['S', 'M', 'H'].forEach(function (k) {
    if (need && car.used[k]) return;
    var t = estStint(car.d, k, R.c, Math.max(rem, 1));
    if (t < bt) { bt = t; best = k; }
  });
  return best || 'M';
}
function planAI(car, R) {
  var c = R.c, L = c.laps;
  if (R.wet > 0.68) { car.comp = 'W'; return; }
  if (R.wet > 0.28) { car.comp = 'I'; return; }
  var two = rnd() < (c.wear > 1.15 ? 0.5 : 0.22);
  var seq = two ? pick([['S', 'M', 'M'], ['M', 'S', 'M'], ['S', 'M', 'H'], ['M', 'M', 'H']]) : pick([['M', 'H'], ['M', 'H'], ['H', 'M'], ['S', 'H'], ['S', 'M'], ['M', 'S']]);
  var lives = seq.map(function (k) { return COMP[k].life * (1 + (car.d.tyre - 75) / 250) / c.wear; });
  var sum = lives.reduce(function (a, b) { return a + b; }, 0), acc = 0;
  car.comp = seq[0];
  for (var i = 0; i < seq.length - 1; i++) { acc += L * lives[i] / sum; car.plan.push({ lap: clamp(Math.round(acc + gauss()), 4, L - 3), comp: seq[i + 1] }); }
}
function aiPit(car, R, underSC) {
  var lap = R.lap, rem = R.c.laps - lap;
  if (rem < 2) return null;
  var slick = car.comp === 'S' || car.comp === 'M' || car.comp === 'H';
  if (slick && R.wet > 0.30 && rnd() < 0.40) { car.plan = []; return chooseComp(car, R); }
  if (!slick) {
    if (R.wet < 0.17 && rnd() < 0.40) { car.plan = []; return chooseComp(car, R); }
    if (car.comp === 'I' && R.wet > 0.72 && rnd() < 0.40) return 'W';
    if (car.comp === 'W' && R.wet < 0.5 && R.wet > 0.2 && rnd() < 0.3) return 'I';
    return null;
  }
  var ts = tyreState(car, R);
  if (car.plan.length && lap >= car.plan[0].lap) { var p = car.plan.shift(); return R.wet > 0.28 ? chooseComp(car, R) : p.comp; }
  if (ts.health <= 0.02) return chooseComp(car, R);
  if (underSC && ts.health < 0.65 && rem > 4 && car.stops < 2 && rnd() < 0.5) { car.plan.shift(); return chooseComp(car, R); }
  return null;
}

var FBURN = [0.93, 1, 1.08], MBURN = [0.95, 1, 1.10];
function fuelState(R, car) {
  var burn = FBURN[car.fmix == null ? 1 : car.fmix] * MBURN[car.mode], need = R.c.laps - R.lap;
  return { burn: burn, laps: car.fuel / burn, need: need, margin: car.fuel / burn - need };
}
/* mod pemanduan AI mengikut keadaan trek: serang, jimat atau normal */
function aiMode(car, R, gA, gB) {
  var lapNo = R.lap, rem = R.c.laps - R.lap + 1;
  if (lapNo <= 1) return 1;
  var h = tyreState(car, R).health;
  if (rem <= 2 && h > 0.12) return 2;
  if (gA < 1.1 && h > 0.25 && rnd() < 0.8) return 2;
  if (gB < 0.8 && h > 0.35 && rnd() < 0.45) return 2;
  if (h < 0.3 && car.stops >= 0 && rem > 4) return 0;
  if (gA > 3.5 && gB > 3.5 && rnd() < 0.55) return 0;
  return 1;
}
function makeRace(S, ci, gridIds, w, o) {
  o = o || {};
  var c = CIRCUITS[ci];
  var R = { manual: !!o.manual, c: c, ci: ci, lap: 0, sc: 0, w: w, wet: w.start < 0 ? w.int * 0.9 : 0, cars: [], order: [], out: [], log: [], fl: { t: 999, di: -1, lap: 0 }, done: false, overtakes: 0, scLaps: 0, scCount: 0, lastImp: 0, cls: null };
  gridIds.forEach(function (di, i) {
    var d = S.drivers[di], team = S.teams[d.team];
    var car = { di: di, d: d, t: team, team: d.team, perf: carPerf(team, c), rel: team.car.rel, total: 0, last: 0, best: 999, comp: 'M', age: 0, eff: 0, mode: 1, stops: 0, used: {}, plan: [], pitNext: null, pitTime: null, dnf: null, lapsDone: 0, grid: i + 1, pen: 0, fuel: c.laps * 1.035, fmix: 1, fuelWarn: false, isP: di === S.pi, nt: 0, raw: 0, pitting: false, spin: 0, warned: false, lastPit: 0 };
    var react = (o.reacts && o.reacts[di] != null) ? o.reacts[di] : 0.23 + gauss() * 0.035;
    car.total = i * 0.5 + (react - 0.22) * 3 + gauss() * 0.2;
    if (car.isP) {
      car.pen = o.jump ? 5 : 0; car.auto = !!o.autoP;
      if (o.plan) { car.comp = o.plan.comp; car.plan = o.plan.stops.slice(); } else planAI(car, R);
    } else planAI(car, R);
    car.used[car.comp] = 1;
    R.cars.push(car);
  });
  R.order = R.cars.slice().sort(function (a, b) { return a.total - b.total; });
  R.pcar = R.cars.filter(function (x) { return x.isP; })[0];
  return R;
}

function rawLap(R, car, gapAhead) {
  var c = R.c, d = car.d, cm = COMP[car.comp], ts = tyreState(car, R);
  var t = c.base + (100 - car.perf) * 0.035 + (100 - d.pace) * 0.015;
  t += R.wet * 8 + (100 - d.wet) * 0.04 * R.wet;
  t += cm.off + ts.p + wetPen(cm, R.wet);
  t += 0.032 * (c.laps - R.lap + 1);
  t += [0.42, 0, -0.32][car.mode] + [0.22, 0, -0.14][car.fmix == null ? 1 : car.fmix];
  if (gapAhead < 1.0) t += 0.16;
  t += gauss() * (0.2 - (d.cons - 70) / 450);
  if (rnd() < (100 - d.cons) / 2400) t += 1.2 + rnd() * 2.5;
  return t;
}
function passScore(R, b, a, lap, noStance) {
  var c = R.c, adv = a.raw - b.raw;
  var drs = R.wet < 0.4 && lap > 1 && (b.total - a.total) < 1.0;
  var s = adv * 3 + (b.d.race - a.d.race) / 35 + (drs ? 0.7 : 0) - c.ot * 4.2 + (lap === 1 ? 1.2 : 0) + (b.mode === 2 ? 0.3 : 0) - (a.mode === 2 ? 0.3 : 0);
  if (!noStance) {
    if (b.isP && b.stance) s += b.stance === 'attack' ? 0.7 + 1.6 * b.sq : b.stance === 'hold' ? -1.4 : 0;
    if (a.isP && a.stance) s += a.stance === 'defend' ? -(0.7 + 1.6 * a.sq) : a.stance === 'yield' ? 1.5 : 0;
  }
  return s;
}
function passProb(s) { return 1 / (1 + Math.exp(-s * 1.6)); }
function tryPass(R, b, a, lap) { return rnd() < passProb(passScore(R, b, a, lap)); }

function stepLap(R, S) { stepLapA(R, S); stepLapB(R, S); }
/* fasa A: cuaca, insiden, keputusan pit, masa lap mentah. Pemain boleh campur tangan sebelum fasa B. */
function stepLapA(R, S) {
  if (R.done) return;
  var c = R.c; R.lap++; var lap = R.lap; R.lastImp = 0;
  function say(t, k, imp) { R.log.push({ lap: lap, t: t, k: k || 'i', imp: imp ? 1 : 0 }); if (imp) R.lastImp++; }
  var w = R.w, prevWet = R.wet, tgt = (lap >= w.start && lap < w.end) ? w.int : 0;
  if (R.wet < tgt) R.wet = Math.min(tgt, R.wet + 0.16 * Math.max(0.5, w.int)); else R.wet = Math.max(0, R.wet - 0.07);
  if (w.start > 0 && w.start < 999 && lap === Math.max(1, w.start - 3)) say('Radar: rain approaching, expected in ~3 laps.', 'w', 1);
  if (prevWet < 0.12 && R.wet >= 0.12) say('Rain is starting to fall!', 'w', 1);
  if (prevWet >= 0.25 && R.wet < 0.25) say('Track is drying, a dry line is appearing.', 'w', 1);

  var underSC = R.sc > 0; if (underSC) R.scLaps++;
  var pre = R.order.slice(), gapA = {}, gapB = {};
  pre.forEach(function (car, i) { gapA[car.di] = i === 0 ? 99 : car.total - pre[i - 1].total; gapB[car.di] = i >= pre.length - 1 ? 99 : pre[i + 1].total - car.total; });

  /* insiden */
  var trigSC = 0, leaderBefore = pre[0] ? pre[0].di : -1;
  pre.forEach(function (car, i) {
    var pm = (100 - car.rel) * 0.00005 * (car.mode === 2 ? 1.3 : 1) * (1 + car.eff * 0.004);
    var pc = 0.0011 * (1 + (100 - car.d.race) / 50) * [0.7, 1, 1.5][car.mode] * (1 + R.wet * 2.2) * (lap === 1 ? 4 : 1) * (underSC ? 0.1 : 1) * (gapA[car.di] < 1.0 ? 1.4 : 1);
    var r = rnd();
    if (r < pm) { car.dnf = 'Mechanical failure'; trigSC = Math.max(trigSC, 0.25); }
    else if (r < pm + pc) {
      if (rnd() < 0.42) { car.spin = rr(5, 11); if (car.isP || i < 4) say(car.d.code + ' spun and lost time.', 'i', car.isP); }
      else { car.dnf = 'Crash'; trigSC = Math.max(trigSC, 0.6); }
    }
  });
  pre.forEach(function (car) {
    if (!car.dnf) return;
    car.lapsDone = lap - 1; R.out.push(car); car.dnfDist = (lap - 1) - (car.total - pre[0].total) / c.base;
    say((car.isP ? 'YOU\'RE OUT: ' : '') + car.d.code + ' retires from the race (' + car.dnf.toLowerCase() + ').', 'x', car.isP);
    if (car.isP) R.log.push({ lap: lap, t: pick(RADIO.dnf), k: 'f', imp: 0 });
  });
  var act = pre.filter(function (car) { return !car.dnf; });

  /* keputusan pit + masa lap mentah */
  act.forEach(function (car, i) {
    var pc = car.pitNext || ((car.isP && !car.auto) ? null : aiPit(car, R, underSC));
    car.pitting = !!pc; car.pitComp = pc;
    if (!car.isP || !R.manual) car.mode = underSC ? 1 : aiMode(car, R, gapA[car.di], gapB[car.di]);
    if (car.isP && !R.manual && !underSC) car.fmix = fuelState(R, car).margin < 0.3 ? 0 : 1;
    if (car.isP && car.fuel <= 0) { car.mode = 0; car.fmix = 0; }
    var raw;
    if (underSC) raw = c.base * 1.38;
    else raw = rawLap(R, car, gapA[car.di]);
    if (car.pitting) {
      var st = (car.isP && car.pitTime != null) ? car.pitTime : crewTime(car);
      car.lastStop = st;
      raw += (underSC ? 0.5 : 1) * c.pit + st;
    }
    raw += car.spin; car.spin = 0;
    if (car.isP && car.fuel <= 0) raw += 7;
    car.raw = raw; car.prev = car.total; car.nt = car.total + raw;
  });

  R.pend = { lap: lap, underSC: underSC, trigSC: trigSC, leaderBefore: leaderBefore, act: act };
}
/* fasa B: susunan (pemotongan), kemas kini kereta, safety car */
function stepLapB(R, S) {
  if (R.done || !R.pend) return;
  var c = R.c, P = R.pend, lap = P.lap, underSC = P.underSC, trigSC = P.trigSC, leaderBefore = P.leaderBefore, act = P.act; R.pend = null;
  function say(t, k, imp) { R.log.push({ lap: lap, t: t, k: k || 'i', imp: imp ? 1 : 0 }); if (imp) R.lastImp++; }
  R.wasSC = underSC;
  /* susunan: SC atau lumba bebas */
  if (underSC) {
    act.sort(function (a, b) { return a.nt - b.nt; });
    for (var i = 1; i < act.length; i++) {
      var g = act[i].nt - act[i - 1].nt, lim = R.scLaps === 1 ? Math.max(1.0, g * 0.6) : 0.9 + rnd() * 0.3;
      if (g > lim) act[i].nt = act[i - 1].nt + lim; else if (g < 0.7) act[i].nt = act[i - 1].nt + 0.7;
    }
  } else {
    for (var sw = 0; sw < 3; sw++) {
      var ch = false;
      for (var j = 1; j < act.length; j++) {
        var b = act[j], a = act[j - 1];
        if (b.nt < a.nt) {
          if (a.pitting || tryPass(R, b, a, lap)) {
            act[j - 1] = b; act[j] = a; ch = true;
            if (!a.pitting && !b.pitting) { R.overtakes++; if (b.isP) say('You pass ' + a.d.code + '!', 'me', 0); else if (a.isP) say(b.d.code + ' passes you.', 'me', 0); }
          } else { b.nt = a.nt + 0.26 + rnd() * 0.14; }
        } else if (b.nt < a.nt + 0.26 && !b.pitting) b.nt = a.nt + 0.26 + rnd() * 0.1;
      }
      if (!ch) break;
    }
  }
  /* kesan pilihan pertarungan pemain */
  var pp = R.pcar, bt = R.battle;
  if (bt && !pp.dnf && !underSC) {
    var ri = act.indexOf(bt.rival), pi = act.indexOf(pp);
    if (bt.kind === 'attack') {
      pp.eff += 0.4;
      if (ri >= 0 && pi >= 0 && ri < pi) {
        if (rnd() < 0.11 * (1 + R.wet * 2)) { pp.nt += rr(2, 4); say('Contact with ' + bt.rival.d.code + ' while attacking! Time lost.', 'x', 1); }
        else say(bt.rival.d.code + ' holds off your attack.', 'me', 0);
      }
    } else if (bt.kind === 'defend') {
      pp.eff += 0.5;
      if (pi >= 0 && ri >= 0 && pi < ri) say('You held off ' + bt.rival.d.code + '!', 'me', 0);
    } else pp.eff = Math.max(0, pp.eff - 0.3);
  }
  R.battle = null; pp.stance = null;
  act.sort(function (a, b) { return a.nt - b.nt; });

  /* kemas kini kereta */
  act.forEach(function (car) {
    car.last = car.nt - car.prev; car.total = car.nt; car.lapsDone = lap;
    if (!underSC && !car.pitting && car.last < car.best) car.best = car.last;
    if (!underSC && !car.pitting && car.last < R.fl.t) {
      R.fl = { t: car.last, di: car.di, lap: lap };
    }
    if (car.pitting) {
      car.comp = car.pitComp; car.age = 0; car.eff = 0; car.stops++; car.used[car.comp] = 1; car.lastPit = lap; car.warned = false;
      if (car.isP) { say('Pit: ' + COMP[car.comp].n + ' tyres, stop ' + car.lastStop.toFixed(1) + 's.', 'p', 0); if (car.lastStop < 2.4) say(pick(RADIO.fastpit), 'f', 0); else if (car.lastStop > 3.6) say(pick(RADIO.slowpit), 'f', 0); }
      car.pitNext = null; car.pitTime = null;
    } else { car.age++; car.eff += MODEW[car.mode]; }
    if (car.isP) {
      car.fuel -= FBURN[car.fmix == null ? 1 : car.fmix] * MBURN[car.mode] * (underSC ? 0.45 : 1);
      if (car.fuel <= 0 && !car.fuelWarn) { car.fuelWarn = true; say('OUT OF FUEL! The car crawls to the finish.', 'x', 1); }
      else if (car.fuel > 0 && R.manual && c.laps - lap > 2) {
        var fs = fuelState(R, car);
        if (fs.margin < -0.2 && (!car.fuelCall || lap - car.fuelCall >= 3)) { car.fuelCall = lap; say('Not enough fuel to finish. Short by ' + (-fs.margin).toFixed(1) + ' laps. Save fuel!', 'e', 1); }
      }
    }
    if (car.isP && !car.pitting) {
      var ts = tyreState(car, R);
      if (ts.health < 0.2 && !car.warned && R.c.laps - lap > 2) { car.warned = true; say('Tyres almost gone. Consider pitting.', 'e', 1); }
    }
  });
  var rank0 = R.order.indexOf(R.pcar);
  R.order = act;
  if (!R.pcar.dnf) chatter(R, R.pcar, rank0, act.indexOf(R.pcar), lap);
  if (act[0] && act[0].di !== leaderBefore && lap > 1) say(act[0].d.code + ' leads the race.', 'i', 0);
  if (lap === 1) say('Lap one complete. ' + act[0].d.code + ' leads.', 'i', 0);

  /* safety car */
  if (underSC) { R.sc--; if (R.sc === 0) say('Safety car in. Racing resumes!', 'sc', 1); }
  if (trigSC && R.sc === 0 && !underSC && lap < c.laps - 2 && rnd() < trigSC + 0.1) { R.sc = 3 + Math.floor(rnd() * 3); R.scCount++; say('SAFETY CAR deployed! Cheaper pit stop opportunity.', 'sc', 1); }

  if (lap >= c.laps) finalizeRace(R);
}

/* radio jurutera ringan (rekaan, tidak mengganggu lumba) */
function chatter(R, p, r0, r1, lap) {
  var cd = p.cd2 = p.cd2 || {};
  function say2(key, pr, gap) {
    if (cd[key] != null && lap - cd[key] < gap) return false;
    if (rnd() > pr) return false;
    cd[key] = lap; R.log.push({ lap: lap, t: pick(RADIO[key]), k: 'f', imp: 0 }); return true;
  }
  if (lap === 1) { say2('start', 1, 99); return; }
  if (R.sc > 0 && cd.scc !== R.scCount) { cd.scc = R.scCount; R.log.push({ lap: lap, t: pick(RADIO.sc), k: 'f', imp: 0 }); return; }
  if (r0 >= 0 && r1 <= r0 - 2 && say2('gain', 0.85, 2)) return;
  if (r0 >= 0 && r1 >= r0 + 2 && say2('lose', 0.85, 2)) return;
  if (R.manual && p.fuel > 0 && fuelState(R, p).margin < 0.2 && say2('fuel', 0.5, 4)) return;
  if (tyreState(p, R).health < 0.4 && say2('tyre', 0.5, 6)) return;
  if (r1 === 0 && lap > 2 && say2('lead', 0.3, 5)) return;
  say2('idle', 0.15, 5);
}
function finalizeRace(R) {
  R.done = true;
  R.order.forEach(function (car) {
    var dry = ['S', 'M', 'H'].filter(function (k) { return car.used[k]; }).length;
    if (dry < 2 && !(car.used.I || car.used.W)) { car.pen += 15; if (car.isP) R.log.push({ lap: R.lap, t: 'Penalty +15s: did not use two dry compounds.', k: 'x', imp: 1 }); }
    car.fin = car.total + car.pen;
  });
  var fin = R.order.slice().sort(function (a, b) { return a.fin - b.fin; });
  var cls = fin.map(function (car, i) { return { car: car, pos: i + 1, dnf: false, gap: car.fin - fin[0].fin }; });
  var outs = R.out.slice().sort(function (a, b) { return b.lapsDone - a.lapsDone; });
  outs.forEach(function (car, i) { cls.push({ car: car, pos: fin.length + i + 1, dnf: true, gap: 0 }); });
  R.cls = cls;
}
