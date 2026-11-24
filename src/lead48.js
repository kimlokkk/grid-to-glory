'use strict';
/* ===== Leadership (2.6.0): rating scale, principal and director decisions, feedback for every team, staff market =====
   Design: MAJOR-UPDATE-DESIGN.md Part B5 to B8.
   Gate: S.lead = { v: 1, from: <season> }. Until the gate is on, none of this runs and the old code path (and its random numbers) is untouched. */
var LEAD = {
  v: 1,
  rng: { td: [0.8, 1.2], tp: [0.75, 1.25], staff: [0.8, 1.2] },   /* multiplier range that rating 0 to 100 maps onto (same scales the screens already used) */
  poolSd: 15, poolMin: 6, poolMax: 94,                               /* new directors: rating spread, no clamp pile-up at 0 and 100 */
  /* A decision is the part with the most to gain. Each person judges the parts with some error (log-normal noise, sd = sigma), so a mistake is a near miss
     (engine instead of chassis), almost never a part that is already maxed. Sigma falls with rating; calibrated so the chance of the right call matches the design. */
  eps: 0.25,                                                         /* real uncertainty in what pays off, shared by principal and director */
  sTP: [1.0, 0.15], sTD: [0.8, 0.07], fbSig: 0.004,                  /* judgement error at rating 0 and 100; feedback above 75 lowers the director's error */
  consBase: 0.77, consSlope: 0.24,                                   /* principal leans on advice: 77% at rating 0 to 53% at 100 */
  fbGain: 150, fbFail: 600, fbRate: 400,                             /* team feedback: gain 1 + (feedback - 70) / fbGain (was the player's driver only), failure x(1 - (feedback - 70) / fbFail), progress per round x(1 + (feedback - 70) / fbRate) */
  fitFb: 0.0, payFb: 0.0,                                            /* a good principal values feedback when choosing drivers (OVR points per feedback point) and pays for it (share of pay per point) */
  budShare: { win: 0.30, build: 0.27, rebuild: 0.23, cut: 0.20 }, budErr: [0.20, 0.03], /* driver budget as a share of revenue by plan, and how far a principal at rating 0 / 100 is off it */
  drift: 1.5, retireAge: 62,
  ask: [2, 10],                                                      /* asking salary ($M) at rating 0 and 100 */
  poach: 0.25, quitOver: 3,
  keepTP: 0.78,                                                      /* principals re-signed without a market */
  /* Director: build quality by probability, never by certainty. A package can be a hit (bigger gain) or a miss (smaller), and fails more or less often. */
  hit: [0.06, 0.54], miss: [0.54, 0.06], hitMul: 1.65, missMul: 0.4, // chance of a hit / a miss at rating 0 and 100
  failTD: [1.35, 0.65],                                              /* failure chance multiplier at rating 0 and 100 */
  staffK: 0.8,                                                       /* how much a weak staff raises the failure chance (old value 2.5) */
  staffG: 0.8,                                                         /* staff effect on gain (old value 2); tuned so the director matters most, then the principal, then staff */
  tpG: 1.1,                                                          /* the principal's direct grip on the programme (old value 1.5). Tuned with the director (hit and miss), staff and money so that the director matters most, then the principal, then staff (B12) */
  /* Principal: when to stop and when to bring the package. Chance of the right call at rating 0 and 100. */
  stopRight: [0.25, 0.95], stopFalse: [0.12, 0.01],                  /* shelves the project when he should / when he should not */
  timeSd: [0.55, 0.10], suitSee: [0.4, 0.9],                         /* sd of his sense of timing; chance he notices a circuit that suits the part */
  regAlert: [0.2, 0.95], regBonus: 0.10,                             /* chance he prepares for next year's rules; effect on the team's readiness */
  judgeRating: 25,                                                   /* rating points of error when he judges a candidate, at the weakest principal */
  /* Principal choosing drivers and managing the money (draft in mkt12.js). */
  eyeOvr: [3.0, 0.5], eyePot: [1.7, 0.7],                            /* error in judging a driver's ability / potential, at rating 0 and 100 (OVR points, multiplier on the potential error) */
  planMiss: 0.30,                                                    /* chance a rating-0 principal misreads the team's situation (win now / build / rebuild) */
  capBias: [0.08, 0.0], capSd: [0.14, 0.03], strict: [0.45, 1.5],    /* payroll limit: a weak principal overspends and is lax about it; a good one sticks to it */
  payMul: [1.10, 0.92],                                              /* what he pays a driver relative to the going rate: a good negotiator saves money, a weak one overpays */
  /* Money through the season (Economy). Prize money and sponsor bonuses arrive race by race on the live standings, so a team that climbs can afford more upgrades,
     and the winter package is smaller so the budget lasts the year. Winter size 2.2 was the old value. */
  costMul: 0.8, gainIn: 2.6, gainWin: 2.0, rate: 0.45,              /* package cost and gain scale (in-season gain, winter gain) and progress per round; tuned by simulation (see MAJOR-UPDATE-DESIGN.md B11) */
  winterSize: 3.0, prizeIn: 0.7, sponPoint: 0.04,                    /* winter package size (was 2.2, but it now costs x0.65 and gains x2, so about as large as the old one in cost and much larger in effect); share of the annual prize paid race by race; sponsor bonus ($M) per championship point */
  winterErr: [0.30, 0.05]                                            /* how far off the right winter size a principal is at rating 0 and 100 */
};

function leadRating(kind, m) { var r = LEAD.rng[kind]; return Math.round(clamp((m - r[0]) / (r[1] - r[0]) * 100, 0, 100)); }
function leadMul(kind, rating) { var r = LEAD.rng[kind]; return r[0] + (r[1] - r[0]) * clamp(rating, 0, 100) / 100; }
function leadAsk(rating) { return Math.round((LEAD.ask[0] + (LEAD.ask[1] - LEAD.ask[0]) * clamp(rating, 0, 100) / 100) * 10) / 10; }
/* year: the season the question is about (defaults to the current one) */
function leadOn(S, year) { return !!(S && S.lead && S.lead.v >= 1 && (year == null ? S.season : year) >= S.lead.from && S.teams && S.teams[0] && !S.teams[0].spec); }   /* F1 and Classic teams only, not the junior series */

/* Existing saves: nothing played yet this season -> use it from now; otherwise from the next new season. */
function leadMigrate(S) {
  if (!S || S.lead || !S.teams || !S.drivers) return;
  S.lead = { v: LEAD.v, from: (S.round || 0) === 0 ? S.season : S.season + 1, ev: {} };
  /* the director's rating becomes the person's, equal to what the team has right now: nobody changes strength on the day */
  S.teams.forEach(function (t) { var dv = t.dev; if (!dv) return; if (dv.tdp) { dv.tdp.skill = dv.td; if (dv.tdp.loy == null) dv.tdp.loy = hash01(t.id + 3, 11); } if (dv.tp && dv.tp.loy == null) dv.tp.loy = hash01(t.id + 5, 13); });
}

/* team feedback: the better of the two drivers counts a little more */
function leadFeedback(S, t) {
  var fb = S.drivers.filter(function (d) { return d.team === t.id; }).map(function (d) { return Number.isFinite(d.fb) ? d.fb : 70; }).sort(function (a, b) { return b - a; });
  if (!fb.length) return 70;
  return fb.length > 1 ? 0.6 * fb[0] + 0.4 * fb[1] : fb[0];
}
function leadFbGain(S, t) { return 1 + (leadFeedback(S, t) - 70) / LEAD.fbGain; }
function leadFbRate(S, t) { return 1 + (leadFeedback(S, t) - 70) / LEAD.fbRate; }
function leadLerp(pair, rating) { return pair[0] + (pair[1] - pair[0]) * clamp(rating, 0, 100) / 100; }
/* the director's effect on one package: a gain factor (hit / normal / miss) and a failure multiplier */
function leadPackage(S, t) {
  var r = leadRating('td', t.dev.td), hit = leadLerp(LEAD.hit, r), miss = leadLerp(LEAD.miss, r), u = rnd();
  return { q: u < hit ? LEAD.hitMul : u < hit + miss ? LEAD.missMul : 1, fail: leadLerp(LEAD.failTD, r) };
}
function leadTPRating(t) { return leadRating('tp', t.dev.tp.skill); }
/* does a good principal make the call? chance by rating */
function leadCall(pair, t) { return rnd() < leadLerp(pair, leadTPRating(t)); }

/* what the principal and the director each get right, as probabilities (also shown in the story pack) */
/* chance of picking the best part for a given judgement error (measured: 400 draws over 160 real team states) */
var LEAD_PC = [[0.05, 0.967], [0.1, 0.935], [0.15, 0.903], [0.2, 0.872], [0.3, 0.813], [0.4, 0.761], [0.5, 0.713], [0.7, 0.633], [1.0, 0.548], [1.3, 0.50]];
function leadPc(sg) { var T = LEAD_PC; if (sg <= T[0][0]) return T[0][1]; for (var i = 1; i < T.length; i++) if (sg <= T[i][0]) return T[i - 1][1] + (T[i][1] - T[i - 1][1]) * (sg - T[i - 1][0]) / (T[i][0] - T[i - 1][0]); return T[T.length - 1][1]; }
function leadOdds(S, t) {
  var tpR = leadRating('tp', t.dev.tp.skill), tdR = leadRating('td', t.dev.td), fb = leadFeedback(S, t);
  var sTP = LEAD.sTP[0] + (LEAD.sTP[1] - LEAD.sTP[0]) * tpR / 100, sTD = clamp((LEAD.sTD[0] + (LEAD.sTD[1] - LEAD.sTD[0]) * tdR / 100) * (1 - (fb - 75) * LEAD.fbSig), 0.04, 1.3);
  var pick = leadPc(sTP), adv = leadPc(sTD), cons = LEAD.consBase - LEAD.consSlope * tpR / 100;
  return { pick: pick, cons: cons, adv: adv, right: (1 - cons) * pick + cons * adv, tpR: tpR, tdR: tdR, fb: fb, sTP: sTP, sTD: sTD };
}

function leadBest(a) { var b = 0; for (var i = 1; i < a.length; i++) if (a[i] > a[b]) b = i; return b; }

/* Which part to work on. Both the winter package and the in-season project call this.
   The part with the most to gain is found from the team's weak spots and R&D philosophy plus some uncertainty nobody can remove. The principal and the director
   each judge the parts with their own error (it falls with rating, and the director also benefits from good driver feedback). The principal leans on the
   director's advice with some probability, otherwise follows his own judgement. So a weak principal is wrong more often but not stupid:
   he mixes up two parts that are close, he does not pour a package into a part that is already maxed. */
function leadPickPart(S, t, tops) {
  var d = t.dev, o = leadOdds(S, t), w = PARTS.map(function (k) { return d.phil[k] * (3 + Math.max(0, tops[k] - t.car[k])) * (k === 'rel' ? DEV.relW : 1); });
  var base = w.map(function (x) { return Math.pow(x, 1.4) * Math.exp(LEAD.eps * gauss()); }), best = leadBest(base);
  var judge = function (sg) { return leadBest(base.map(function (x) { return x * Math.exp(sg * gauss()); })); };
  var own = judge(o.sTP), advice = judge(o.sTD), follows = rnd() < o.cons, ki = follows ? advice : own;
  if (!follows && own !== advice) leadOverrule(S, t, PARTS[advice], PARTS[own], advice === best);
  return PARTS[ki];
}

/* The principal went against the director. When the director was right, that costs: it is remembered and may be reported. */
function leadOverrule(S, t, adv, own, advRight) {
  var tdp = t.dev.tdp; if (!tdp || !advRight) return;
  tdp.over = (tdp.over || 0) + 1;
  var key = t.id + ':' + S.season; S.lead.ev = S.lead.ev || {};
  if (S.lead.ev[key]) return;
  var big = leadRating('td', t.dev.td) >= 55 || (S.drivers[S.pi] && S.drivers[S.pi].team === t.id);
  if (!big || hash01(S.season * 13 + t.id, 7) > 0.65) return;
  S.lead.ev[key] = 1;
  pushNews(S, { k: 'garage', kick: 'GARAGE', t: t.id, s: S.season, r: S.round + 1, head: t.dev.tp.name + ' overrules ' + tdp.name + ' at ' + t.name,
    sub: 'The technical director wanted the next package on the ' + adv + '. The principal chose the ' + own + '. The weakness stays for now.' });
}

/* ---------- staff market ---------- */
function leadRoom(S, t, kind) {
  var p = typeof teamPayroll === 'function' ? teamPayroll(S, t) : { dr: 0, st: 0 }, cap = typeof finPayCap === 'function' ? finPayCap(t) : 45;
  var other = (kind === 'td' ? (t.dev.tp && t.dev.tp.con ? t.dev.tp.con.pay : 0) : (t.dev.tdp && t.dev.tdp.con ? t.dev.tdp.con.pay : 0));
  return cap - p.dr - other;
}
/* how much a person likes a team's offer */
function leadScore(S, t, c, offer, ask, rankP, n, N) {
  return offer / ask + 0.03 * t.prestige + 0.35 * (1 - (rankP - 1) / Math.max(1, n - 1)) + (c.from === t.id ? 0.25 * (c.p.loy == null ? 0.5 : c.p.loy) : 0) + hgauss(t.id + c.p.name + N) * 0.08;
}
/* Two-sided matching (like a draft where both sides choose).
   Each open team ranks the candidates by what it thinks their rating is: its own principal's eye is not perfect (a weak principal can rank a mediocre
   director above a great one). The team proposes to its favourite it can afford; a candidate keeps the offer he likes best (pay, prestige, competitiveness,
   loyalty) and turns the rest down; those teams try their next choice. A second pass fills any vacancy that is left, at a lower pay if it must. */
function leadFill(S, N, kind, pool, open, rankP) {
  var n = S.teams.length, out = [];
  var rate = function (c) { return leadRating(kind, c.p.skill); };
  pool.forEach(function (c, i) { c.id = i; });
  var openIds = Object.keys(open).filter(function (k) { return open[k]; }).map(Number);
  var judge = function (t) { return kind === 'td' && t.dev.tp ? LEAD.judgeRating * leadOdds(S, t).sTP : 8; };
  var offerFor = function (t, c, relaxed) {
    var ask = leadAsk(rate(c)), room = leadRoom(S, t, kind), offer = Math.min(ask * 1.1, Math.max(room, 0));
    if (!relaxed && offer < ask * 0.8) return null;
    if (relaxed) offer = Math.max(offer, ask * 0.7);
    return { ask: ask, offer: offer };
  };
  [false, true].forEach(function (relaxed) {
    var free = openIds.filter(function (id) { return open[id]; });
    if (!free.length) return;
    var avail = pool.filter(function (c) { return !c.done; }), prefs = {}, idx = {}, held = {};
    free.forEach(function (id) {
      var sd = judge(S.teams[id]);
      prefs[id] = avail.map(function (c) { return { c: c, v: rate(c) + gauss() * sd }; }).sort(function (a, b) { return b.v - a.v; }).map(function (x) { return x.c; });
      idx[id] = 0;
    });
    var queue = free.slice();
    while (queue.length) {
      var id = queue.shift(), t = S.teams[id];
      while (idx[id] < prefs[id].length) {
        var c = prefs[id][idx[id]++], o = offerFor(t, c, relaxed); if (!o) continue;
        var sc = leadScore(S, t, c, o.offer, o.ask, rankP[id], n, N), h = held[c.id];
        if (!h) { held[c.id] = { id: id, s: sc, o: o.offer }; break; }
        if (sc > h.s) { queue.push(h.id); held[c.id] = { id: id, s: sc, o: o.offer }; break; }
      }
    }
    Object.keys(held).forEach(function (cid) { var h = held[cid], c = pool[cid]; c.done = true; open[h.id] = 0; out.push({ c: c, t: S.teams[h.id], pay: Math.round(h.o * 10) / 10 }); });
  });
  return out;
}
function leadMarket(S, N, ord) {
  var n = S.teams.length, st = S.mkt && S.mkt.staff ? S.mkt.staff : (S.mkt.staff = []);
  var rankP = {}; S.teams.slice().sort(function (a, b) { return teamPower(b) - teamPower(a); }).forEach(function (t, i) { rankP[t.id] = i + 1; });
  var used = {}; S.teams.forEach(function (t) { used[t.dev.tdp && t.dev.tdp.name] = 1; used[t.dev.tp && t.dev.tp.name] = 1; });
  /* directors: rating drifts a little, the oldest retire, a director who was overruled too often may walk out */
  var tdPool = [], tdOpen = {};
  S.teams.forEach(function (t) {
    var p = t.dev.tdp; if (!p) return;
    var r = leadRating('td', t.dev.td); r = clamp(r + gauss() * LEAD.drift + (p.age < 42 ? 0.8 : p.age > 54 ? -1 : 0), 4, 96); t.dev.td = leadMul('td', r); p.skill = t.dev.td;
    if (p.loy == null) p.loy = rnd();
    var quits = (p.over || 0) >= LEAD.quitOver && r >= 55 && rnd() < 0.5, retires = p.age >= LEAD.retireAge && rnd() < 0.5;
    if (retires) { p.con = Object.assign({}, p.con || {}, { end: N - 1 }); tdOpen[t.id] = 1; st.push({ k: 'tdout', n: p.name, t: t.id, why: 'retires' }); return; }
    if (quits) { p.con = Object.assign({}, p.con || {}, { end: N - 1 }); tdPool.push({ p: p, from: t.id }); tdOpen[t.id] = 1; st.push({ k: 'tdout', n: p.name, t: t.id, why: 'overruled' }); pushNews(S, { k: 'garage', kick: 'GARAGE', t: t.id, s: N, r: 0, head: p.name + ' leaves ' + t.name, sub: 'The technical director has had enough of being overruled and walks out. The seat is open on the market.' }); p.over = 0; return; }
    p.over = 0;
    if (p.con && p.con.end < N) { tdPool.push({ p: p, from: t.id }); tdOpen[t.id] = 1; }
  });
  /* one poaching attempt per winter at most: a stronger director is bought out of his contract by a team that scores better with him */
  if (rnd() < LEAD.poach) {
    var buyers = S.teams.filter(function (t) { return t.dev.tdp && !tdOpen[t.id] && leadRating('td', t.dev.td) < 50 && leadRoom(S, t, 'td') > 5; }).sort(function (a, b) { return b.prestige - a.prestige; });
    var b = buyers[0], target = null;
    if (b) S.teams.forEach(function (t) { var p = t.dev.tdp; if (!p || t.id === b.id || tdOpen[t.id] || !p.con || p.con.end < N + 1) return; if (leadRating('td', t.dev.td) >= leadRating('td', b.dev.td) + 20 && (!target || t.dev.td > target.dev.td)) target = t; });
    if (b && target) {
      var tp0 = target.dev.tdp, c0 = { p: tp0, from: target.id }, ask = leadAsk(leadRating('td', target.dev.td)), offer = Math.min(ask * 1.1, leadRoom(S, b, 'td'));
      var sB = leadScore(S, b, { p: tp0, from: -1 }, offer, ask, rankP[b.id], n, N), sT = leadScore(S, target, c0, tp0.con.pay, ask, rankP[target.id], n, N);
      if (sB > sT + 0.25 && offer >= ask * 0.8) {
        var fee = Math.round(0.8 * tp0.con.pay * (tp0.con.end - N + 1) * 10) / 10, old = b.dev.tdp;
        if (b.fin) b.fin.cash -= fee; if (target.fin) target.fin.cash += fee;
        target.dev.tdp = null; tdOpen[target.id] = 1;
        b.dev.tdp = tp0; b.dev.td = clamp(tp0.skill, LEAD.rng.td[0], LEAD.rng.td[1]); tp0.con = Object.assign({}, tp0.con, { pay: Math.round(offer * 10) / 10 });
        if (old) { old.con = Object.assign({}, old.con || {}, { end: N - 1 }); tdPool.push({ p: old, from: b.id }); tdOpen[b.id] = 1; }
        st.push({ k: 'tdpoach', n: tp0.name, f: target.id, t: b.id, fee: fee });
        pushNews(S, { k: 'garage', kick: 'GARAGE', t: b.id, s: N, r: 0, head: b.name + ' buy out ' + tp0.name + ' from ' + target.name, sub: 'A buy-out fee of about $' + fee + 'M changes hands. ' + target.short + ' now have a vacancy for the technical director.' });
      }
    }
  }
  var vac = Object.keys(tdOpen).length;
  for (var i = tdPool.length; i < vac + 1; i++) {
    var nm = shuffle(TDNAMES.filter(function (x) { return !used[x]; }))[0] || pick(TDNAMES); used[nm] = 1;
    var r0 = clamp(Math.round(50 + gauss() * LEAD.poolSd), LEAD.poolMin, LEAD.poolMax);
    tdPool.push({ p: { name: nm, age: Math.round(rr(37, 58)), skill: leadMul('td', r0), loy: rnd() }, from: -1 });
  }
  leadFill(S, N, 'td', tdPool, tdOpen, rankP).forEach(function (a) {
    var p = a.c.p, old = a.t.dev.tdp, len = 2 + Math.floor(rnd() * (leadRating('td', p.skill) >= 70 ? 2 : 3));
    p.con = { len: len, end: N + len - 1, pay: a.pay }; a.t.dev.tdp = p; a.t.dev.td = clamp(p.skill, LEAD.rng.td[0], LEAD.rng.td[1]);
    st.push(a.c.from === a.t.id ? { k: 'tdre', n: p.name, t: a.t.id } : { k: 'td', n: p.name, f: a.c.from, t: a.t.id, old: old ? old.name : '' });
  });
  /* principals: most are re-signed, some are released, newcomers join the pool; everyone chooses the best offer */
  var tpPool = [], tpOpen = {};
  S.teams.forEach(function (t) {
    var p = t.dev.tp; if (!p || !p.con || p.con.end >= N) return;
    if (rnd() < LEAD.keepTP) { p.con = staffCon(S, p.skill, false); p.con.end = N + p.con.len - 1; st.push({ k: 'tpre', n: p.name, t: t.id }); }
    else { tpPool.push({ p: p, from: t.id }); tpOpen[t.id] = 1; }
  });
  var vacT = Object.keys(tpOpen).length;
  for (var q = tpPool.length; q < vacT + 1 && vacT > 0; q++) { var np = newTP(S.teams[0]), tries = 0; while (used[np.name] && tries++ < 20) np = newTP(S.teams[0]); used[np.name] = 1; np.age = Math.round(rr(40, 60)); tpPool.push({ p: np, from: -1 }); }
  leadFill(S, N, 'tp', tpPool, tpOpen, rankP).forEach(function (a) {
    var p = a.c.p, old = a.t.dev.tp; p.con = staffCon(S, p.skill, false); p.con.end = N + p.con.len - 1; a.t.dev.tp = p;
    st.push(a.c.from === a.t.id ? { k: 'tpre', n: p.name, t: a.t.id } : { k: 'tp', n: p.name, f: a.c.from, t: a.t.id, old: old ? old.name : '' });
  });
  if (typeof setTargets === 'function') setTargets(S);
}

/* Should the principal shelve this season's project (stop developing the old car)? Two reasons: the season is lost, or new rules arrive next year.
   A good principal makes the right call; a weak one often does not, and sometimes shelves for no reason. */
function leadShelve(S, t, ranks, round, last) {
  if (last || t.dev.banked) return false;
  var behind = round >= seasonMilestone(S, 7) && ranks[t.id] - t.dev.target >= 3;
  var rulesNext = typeof leadRulesNext === 'function' && leadRulesNext(S) && round >= seasonMilestone(S, 5);
  if (rulesNext && !t.dev.regDecided) { t.dev.regDecided = true; t.dev.regReady = rnd() < leadLerp(LEAD.regAlert, leadTPRating(t)); if (t.dev.regReady) return true; }
  if (behind) return leadCall(LEAD.stopRight, t);
  /* a weak principal sometimes pulls the plug when he should not */
  return round >= seasonMilestone(S, 7) && rnd() < leadLerp(LEAD.stopFalse, leadTPRating(t)) * 0.05;
}
/* new rules next season, either a major or a minor change */
function leadRulesNext(S) { return S.regYear === S.season + 1 || (S.mode === 'pro' && S.regMinor === S.season + 1); }

/* the payroll this principal is prepared to carry, relative to the usual limit: weak ones drift above it */
function leadCapMul(t, N, tr) { return 1 + leadLerp(LEAD.capBias, tr) + leadLerp(LEAD.capSd, tr) * hgauss(t.id + '|cap|' + N); }

/* Pro market: how the principal sees a driver (error in OVR points, same for a given team and driver every time) and what he pays him */
function leadEye(g, t, d) { return leadOn(g, g.season + 1) && t.dev && t.dev.tp ? leadLerp(LEAD.eyeOvr, leadTPRating(t)) * hgauss(t.id + '|' + (d.uid || d.name) + '|' + g.season) : 0; }
function leadPayMul(g, t) { return leadOn(g, g.season + 1) && t.dev && t.dev.tp ? leadLerp(LEAD.payMul, leadTPRating(t)) : 1; }

/* Economy: prize money and sponsor bonuses paid after each round, on the standings as they are. Called once per round from devInSeason. */
function leadIncome(S, round) {
  var rounds = seasonRounds(S), rk = devRank(S);
  S.teams.forEach(function (t) {
    var f = t.fin; if (!f) return;
    var prize = LEAD.prizeIn * FIN.prize[rk[t.id] - 1] / rounds, dp = t.pts - (t.dev.ptsSeen || 0), spon = LEAD.sponPoint * Math.max(0, dp);
    t.dev.ptsSeen = t.pts;
    f.cash += prize + spon; f.paidPz = (f.paidPz || 0) + prize; f.paidSp = (f.paidSp || 0) + spon;
  });
}
/* winter package size: smaller than before; a good principal gets it about right and builds more when new rules are coming */
function leadWinterSize(S, t) {
  var tr = leadTPRating(t), err = leadLerp(LEAD.winterErr, tr) * hgauss(t.id + '|win|' + S.season), mul = 1 + err;
  if (leadRulesNext(S) && t.dev.regReady) mul *= 1.3;
  return LEAD.winterSize * clamp(mul, 0.6, 1.6);
}

/* ---------- Driver budget (separate from the R&D fund) ---------- */
function leadDriverRef(S) { var tot = 0, n = 0; S.teams.forEach(function (t) { if (t.fin && typeof teamPayroll === 'function') { tot += teamPayroll(S, t).dr; n++; } }); return n ? tot / n : 30; }
function leadPlan(g, t) {
  var cash = t.fin ? t.fin.cash : 0, rk = 1 + g.teams.filter(function (o) { return teamPower(o) > teamPower(t); }).length, amb = t.dev && t.dev.tp ? t.dev.tp.amb : 1;
  return cash < -5 ? 'cut' : rk <= 4 || (rk <= 7 && amb >= 2) ? 'win' : rk >= 8 ? 'rebuild' : 'build';
}
/* what the principal is willing to spend on his two drivers next season */
function leadDriverBudget(g, t) {
  var rev = t.fin && t.fin.rev ? t.fin.rev : 140, share = LEAD.budShare[leadPlan(g, t)] || 0.26, tr = leadTPRating(t);
  return rev * share * clamp(1 + leadLerp(LEAD.budErr, tr) * hgauss(t.id + '|bud|' + g.season), 0.6, 1.4);
}
function leadFbPay(g, t, d) { return leadOn(g, g.season + 1) && t && t.dev && t.dev.tp ? 1 + Math.max(0, (Number.isFinite(d.fb) ? d.fb : 70) - 70) * LEAD.payFb * leadTPRating(t) / 100 : 1; }
function leadFit(g, t, d) { return leadOn(g, g.season + 1) && t.dev && t.dev.tp ? LEAD.fitFb * leadTPRating(t) / 100 * ((Number.isFinite(d.fb) ? d.fb : 70) - 70) : 0; }
/* the best candidate he can afford inside the budget (pool is already sorted best first); null when none fits */
function leadPickAffordable(g, t, pool, here) {
  if (!leadOn(g, g.season + 1) || !t.dev || !t.dev.tp) return null;
  var budget = leadDriverBudget(g, t), spent = here.reduce(function (a, d) { return a + (d.con && Number.isFinite(d.con.pay) ? d.con.pay : payFor(ovr(d), 0.75)); }, 0);
  for (var i = 0; i < pool.length; i++) { var d = pool[i], pay = payFor(ovr(d), 0.75) * leadPayMul(g, t) * leadFbPay(g, t, d); if (spent + pay <= budget) { pool.splice(i, 1); return d; } }
  return null;
}
