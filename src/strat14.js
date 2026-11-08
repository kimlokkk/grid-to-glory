'use strict';
/* ===== Fasa 14: pelbagai strategi pit dengan anggaran masa, jurutera cadang satu, pemandu putuskan ===== */

/* anggaran masa perlumbaan tanpa pit/tayar (untuk paparan masa penamat) */
function stratBase(f, R) {
  var c = R.c, per = c.base + (100 - f.perf) * P2.carK + (100 - f.a.rpace) * P2.drvK + f.setup + P2.fuelPer * Math.max(f.fuel0 != null ? f.fuel0 : f.fuel, 0) * 0.5;
  return per * R.L;
}
/* semua strategi kering yang munasabah dari lap 1: 1 dan 2 pit, setiap kombinasi tayar */
function stratEnum(f, R) {
  var L = R.L, pw = plannedWear(f, R), pitC = pitLossOf(f, R) + P2.stopTraffic, cum = {}, out = [];
  KS.forEach(function (k) { var a = [0], s = 0; for (var m = 0; m < L; m++) { s += lossAt(f, R, k, (m + 0.5) * pw); a.push(s); } cum[k] = a; });
  var minStint = 5;
  KS.forEach(function (s0) {
    KS.forEach(function (b) {
      if (b === s0) return;                                       /* peraturan dua kompaun kering (dua kompaun berbeza) */
      var best = null;
      for (var x = minStint; x <= L - minStint; x++) { var c = cum[s0][x] + pitC + cum[b][L - x]; if (!best || c < best.c) best = { c: c, x: x }; }
      if (best) out.push({ comp: s0, stops: [{ lap: best.x, comp: b }], cost: best.c, n: 1 });
    });
  });
  KS.forEach(function (s0) {
    KS.forEach(function (b) {
      KS.forEach(function (d) {
        if (s0 === b && b === d) return;
        var best = null;
        for (var x1 = minStint; x1 <= L - 2 * minStint; x1++) for (var y = x1 + minStint; y <= L - minStint; y++) {
          var c = cum[s0][x1] + pitC + cum[b][y - x1] + pitC + cum[d][L - y]; if (!best || c < best.c) best = { c: c, x1: x1, y: y };
        }
        if (best) out.push({ comp: s0, stops: [{ lap: best.x1, comp: b }, { lap: best.y, comp: d }], cost: best.c, n: 2 });
      });
    });
  });
  out.sort(function (a, b) { return a.cost - b.cost; });
  /* pilih set yang berguna: 3 terbaik 1-pit, 3 terbaik 2-pit, tanpa kombinasi yang hampir sama */
  var pick = [], seen = {};
  [1, 2].forEach(function (n) {
    var k = 0; out.forEach(function (o) {
      if (o.n !== n || k >= 3) return;
      var key = o.n + o.comp + o.stops.map(function (s) { return s.comp; }).join('');
      if (seen[key]) return; seen[key] = 1; pick.push(o); k++;
    });
  });
  pick.sort(function (a, b) { return a.cost - b.cost; });
  var base = stratBase(f, R), top = pick.length ? pick[0].cost : 0;
  pick.forEach(function (o) { o.delta = o.cost - top; o.est = base + o.cost; });
  return pick;
}
/* Reprice the displayed plans without silently replacing the player's selected pit plan. */
function refreshStratOptions() {
  var wk = UI.wk, R = wk.R, f = R.p, opts = wk.opts;
  if (!opts || !opts.length) return;
  var selected = opts[wk.sel], pw = plannedWear(f, R), base = stratBase(f, R);
  opts.forEach(function (o) {
    var start = 0, comp = o.comp, cost = 0;
    o.stops.concat([{ lap: R.L }]).forEach(function (stop) {
      for (var n = 0; n < stop.lap - start; n++) cost += lossAt(f, R, comp, (n + 0.5) * pw);
      if (stop.comp) { cost += pitLossOf(f, R) + P2.stopTraffic; comp = stop.comp; }
      start = stop.lap;
    });
    o.cost = cost; o.est = base + cost;
  });
  opts.sort(function (a, b) { return a.cost - b.cost; });
  opts.forEach(function (o) { o.delta = o.cost - opts[0].cost; });
  wk.sel = opts.indexOf(selected);
}
function fmtRace(s) { var h = Math.floor(s / 3600), m = Math.floor((s - h * 3600) / 60), r = s - h * 3600 - m * 60; return h + ':' + (m < 10 ? '0' : '') + m + ':' + (r < 10 ? '0' : '') + r.toFixed(1); }
function stratName(o) { return (o.n === 1 ? '1-stop' : '2-stop') + ' · ' + [o.comp].concat(o.stops.map(function (s) { return s.comp; })).map(function (k) { return TYN[k]; }).join(' → '); }
function stratWhy(o, best) {
  if (o === best) return 'Lowest total time on current conditions.';
  var d = o.delta;
  if (o.n === 2) return d < 6 ? 'A close call. A safety car or a rival\'s early stop could make this the better option.' : 'Fresher tyres, but the extra stop costs time in the pit lane.';
  return d < 6 ? 'Close to the best. Fewer stops means less risk in traffic.' : 'Longer stints push the tyres harder, slower in the end.';
}

/* ---------- skrin strategi ---------- */
function dryStrategy(R) { return R.w.type === 'kering' && R.wet <= 0.04; }
var vStrat0 = vStrat;
vStrat = function () {
  var wk = UI.wk, R = wk.R, p = R.p;
  if (!dryStrategy(R) || !SLICK[p.comp]) return vStrat0();
  if (!wk.opts) {
    wk.opts = stratEnum(p, R);
    if (wk.opts.length) { wk.sel = 0; applyStrat(0, false); }
  }
  var base = vStrat0(), o = wk.opts;
  if (!o || !o.length) return base;
  var cards = '<div class="card stack"><h3>Choose your strategy</h3><p class="dim" style="margin:0">Your engineer ran every sensible plan for this track. Estimates use your tyre setting (Auto uses typical wear), balanced fuel/energy and a clean race. Heat and setting changes can alter the result. The engineer recommends one, but you decide.</p><div class="strats">' +
    o.map(function (x, i) {
      var tyres = [x.comp].concat(x.stops.map(function (s) { return s.comp; })).map(function (k) { return '<i class="sdot" style="background:' + COMP[k].col + '">' + k + '</i>'; }).join('<em>›</em>');
      return '<button class="strat ' + (wk.sel === i ? 'on' : '') + '" data-act="s-plan" data-v="' + i + '"><div class="sh"><span class="sd">' + tyres + '</span>' + (i === 0 ? '<span class="srec">Engineer\'s pick</span>' : '') + '</div>' +
        '<div class="sn"><b>' + (x.n === 1 ? '1-stop' : '2-stop') + '</b> · pit lap ' + x.stops.map(function (s) { return s.lap; }).join(' and ') + '</div>' +
        '<div class="se"><span class="mono">' + fmtRace(x.est) + '</span><span class="mono ' + (x.delta < 0.05 ? 'good' : 'dim') + '">' + (x.delta < 0.05 ? 'fastest' : '+' + x.delta.toFixed(1) + 's') + '</span></div>' +
        '<div class="sw">' + stratWhy(x, o[0]) + '</div></button>';
    }).join('') + '</div><p class="dim" style="font-size:12.5px;margin:0">Safety cars, rain and rivals can change the best plan during the race. Your engineer will tell you, and you can switch.</p></div>';
  /* gantikan kad "Engineer's plan" lama dengan pilihan baru */
  return base.replace(/<div class="card stack"><h3>Engineer's plan<\/h3>[\s\S]*?<\/div><\/div>(?=<div class="card stack"><h3>Race mode)/, cards);
};
function applyStrat(i, lock) {
  var wk = UI.wk, p = wk.R.p, x = wk.opts[i]; if (!x) return;
  p.comp = x.comp; p.used = {}; p.used[x.comp] = 1; p.eff = 0; p.tyreTemp = 0.3;
  p.plan = x.stops.map(function (s) { return { lap: s.lap, comp: s.comp }; }); p.lock = lock ? 1 : 0; wk.sel = i;
}
A['s-plan'] = function (d) { applyStrat(+d.v, +d.v !== 0); render(); };

/* kekalkan pelan pilihan pemandu: jurutera tidak kira semula pelan yang dikunci */
var brainPlan0 = brainPlan;
brainPlan = function (R, f, rem) {
  if (f.lock && f.plan.length) return { stops: f.plan, cost: 0 };
  if (f.lock) f.lock = 0;
  return brainPlan0(R, f, rem);
};

/* ---------- panggilan pit: tunjuk anggaran masa setiap pilihan ---------- */
function pitCosts(R, p) {
  var rem = R.L - p.lap + 1, mand = mandOf(p), pf = pitLossOf(p, R), pitC = pf + P2.stopTraffic, fac = R.sc === 'SC' ? 0.5 : R.sc === 'VSC' ? 0.7 : 1, out = {};
  if (!dryStrategy(R) || !SLICK[p.comp]) return null;
  out.stay = planFrom(p, R, p.comp, p.eff, rem, mand, pitC).cost;
  KS.forEach(function (k) { out[k] = pf * fac + planFrom(p, R, k, 0, rem, mand && k === p.comp, pitC).cost; });
  var min = Math.min(out.stay, out.S, out.M, out.H);
  for (var k in out) out[k] = out[k] - min;
  return out;
}
function dTxt(v) { return v < 0.05 ? 'Best estimate' : '+' + v.toFixed(1) + 's vs best'; }
var pitCard0 = pitCard;
pitCard = function (R, p) {
  pitCard0(R, p);
  try {
    var C = pitCosts(R, p); if (!C) return;
    var box = document.querySelector('#modal .evopts'); if (!box) return;
    var btns = box.querySelectorAll('.opt');
    btns.forEach(function (b) {
      var act = b.getAttribute('data-act'), v = b.getAttribute('data-v'), k = act === 'pc-yes' ? p.pitReq : act === 'pc-alt' ? v : null, c = act === 'pc-no' ? C.stay : (k && C[k] != null ? C[k] : null);
      if (c == null) return; var s = b.querySelector('.s'); if (s) s.innerHTML = s.textContent + ' <b class="' + (c < 0.05 ? 'good' : 'dim') + '">' + dTxt(c) + '</b>';
    });
    if (R.sc) { var h = document.querySelector('#modal h2'); if (h) h.insertAdjacentHTML('afterend', '<p class="dim" style="margin:0 0 6px;font-size:13px">Your engineer recalculated the rest of the race. Estimated time lost or gained for each option:</p>'); }
  } catch (e) { }
};
