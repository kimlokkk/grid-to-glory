'use strict';
/* ===== Fasa 7: rival, objektif hujung minggu, kepuasan pasukan, lawak ===== */
var RIV = {
  pick: ['Your rival this season: {r}. He once called you "the noisy rookie". Time to show him.', 'The media has picked your rival: {r}. Losing to him is not an option.', '{r} says he\'s never heard of you. He will by the end of the season.'],
  pass: ['There he is, {r}! Your rival is behind you. Feels good, doesn\'t it?', 'Past {r}! I want a screenshot of his face.', '{r} left behind. His team is scratching their heads.'],
  lost: ['{r} got past. I know, I know. Stay calm.', 'Your rival got by. Take it back later, nothing stupid now.', '{r} waved as he went past. Rude.'],
  win: ['You beat {r} today. Head-to-head {w}-{l}.', 'Rival down. {r} is heading back to the hotel grumpy. H2H {w}-{l}.'],
  lose: ['{r} wins today\'s duel. H2H {w}-{l}. Plenty of races left.', '{r} finished ahead today. No worries, H2H {w}-{l}, we\'re not done.'],
  lastLose: ['{r} finishes ahead in the season finale. Final H2H {w}-{l}.', '{r} gets the last word this year. Final H2H {w}-{l}. We go again next season.'],
  lastWin: ['You beat {r} in the finale. Final H2H {w}-{l}. A perfect way to end the season.', 'Last race, last word: you finish ahead of {r}. Final H2H {w}-{l}.']
};
var OBJT = {
  q3: { n: 'Reach Q3', xp: 6 }, q2: { n: 'Make it to Q2', xp: 5 },
  menang: { n: 'Win the race', xp: 10 }, podium: { n: 'Finish on the podium', xp: 8 }, mata: { n: 'Score points (top 10)', xp: 6 },
  mate: { n: 'Finish ahead of your teammate', xp: 5 }, naik: { n: 'Gain 3 places from the grid', xp: 5 },
  tamat: { n: 'Finish without a DNF', xp: 3 }, rival: { n: 'Finish ahead of your rival', xp: 5 }
};
var HEAD2 = {
  rivalW: ['{n} Beats {r}. The Paddock Is Talking', 'THE RIVALRY HEATS UP: {n} Ahead of {r}, Fans Go Wild', '{r} Hunts for New Excuses After Losing to {n}'],
  rivalL: ['{r} Laughs Last, {n} Plots Revenge', '{n} Loses to {r}: "Wait Till Next Race"']
};
function fmtR(s, o) { return s.replace(/\{(\w+)\}/g, function (m, k) { return o[k] != null ? o[k] : m; }); }

/* rival: pemandu bukan rakan sepasukan, dari pasukan yang hampir sama kuat, rating paling dekat */
function ensureRival(S) {
  if (S.rival && S.rival.season === S.season && S.drivers[S.rival.di]) return S.rival;
  var p = S.drivers[S.pi], pr = powerRankSafe(S), my = pr[p.team], best = null, bd = 1e9;
  S.drivers.forEach(function (d) {
    if (d.id === S.pi || d.team === p.team) return;
    var dist = Math.abs(pr[d.team] - my) * 3 + Math.abs(rating(d) - rating(p)) * 0.5 + rnd() * 2;
    if (dist < bd) { bd = dist; best = d; }
  });
  S.rival = { di: best.id, season: S.season, w: 0, l: 0, intro: false };
  return S.rival;
}
function powerRankSafe(S) { var l = S.teams.slice().sort(function (a, b) { return teamPower(b) - teamPower(a); }), r = {}; l.forEach(function (t, i) { r[t.id] = i + 1; }); return r; }

/* objektif: dua sasaran ikut jangkaan kereta */
function makeObjectives(S) {
  var p = S.drivers[S.pi], E = S.mode === 'pro' ? evaluationExpected(S, S.cal[S.round], p).expected : teamRank(S, p.team) * 2 - 0.5, pool = [];
  if (E <= 3) pool.push('menang', 'podium'); else if (E <= 7) pool.push('podium', 'mata'); else if (E <= 13) pool.push('mata', 'naik'); else pool.push('naik', 'tamat');
  var q = E <= 9 ? 'q3' : E <= 15 ? 'q2' : null;
  var out = [pool[Math.floor(rnd() * pool.length)]];
  var extra = ['mate', 'rival', q].filter(Boolean); extra.push(pool[0] === out[0] ? pool[1] : pool[0]);
  var k2 = pick(extra); if (k2 === out[0]) k2 = 'mate';
  out.push(k2);
  if (S.mode === 'pro') progressionInit(S);
  return out.map(function (k) { return { k: k, n: OBJT[k].n, xp: S.mode === 'pro' ? ((S.progression.earned.objectives || 0) < PROGRESSION.bonuses.objectives ? 1 : 0) : OBJT[k].xp, ok: null }; });
}
function judgeQuali(wk) {
  var mine = wk.q.filter(function (r) { return r.di === S.pi; })[0];
  wk.obj.forEach(function (o) { if (o.k === 'q3') o.ok = mine.sess === 2; if (o.k === 'q2') o.ok = mine.sess >= 1; });
}
function judgeRace(wk, R) {
  var P = R.p, mate = R.cars.filter(function (f) { return f.team === P.team && !f.isP; })[0], rv = S.rival ? R.cars.filter(function (f) { return f.di === S.rival.di; })[0] : null, fin = !P.dnf;
  wk.obj.forEach(function (o) {
    if (o.ok != null) return;
    if (o.k === 'menang') o.ok = fin && P.pos === 1;
    else if (o.k === 'podium') o.ok = fin && P.pos <= 3;
    else if (o.k === 'mata') o.ok = fin && P.pos <= 10;
    else if (o.k === 'mate') o.ok = !mate || P.pos < mate.pos;
    else if (o.k === 'naik') o.ok = fin && P.grid - P.pos >= 3;
    else if (o.k === 'tamat') o.ok = fin;
    else if (o.k === 'rival') o.ok = !rv || P.pos < rv.pos;
  });
  var xp = 0, mor = 0;
  if (S.mode === 'pro') wk.obj.forEach(function (o) {
    var raceExcluded = mechanicalDNF(P) && ['q3', 'q2'].indexOf(o.k) < 0;
    var mateExcluded = o.k === 'mate' && (P.evalOrder || mate && (mate.evalOrder || mechanicalDNF(mate)));
    var rivalExcluded = o.k === 'rival' && (P.evalOrder || rv && (rv.evalOrder || mechanicalDNF(rv)));
    if (raceExcluded || mateExcluded || rivalExcluded) { o.protected = true; o.ok = null; }
  });
  wk.obj.forEach(function (o) { if (o.protected) return; if (o.ok) { xp += o.xp; mor += 6; } else mor -= 4; });
  S.morale = clamp((S.morale == null ? 50 : S.morale) + mor, 0, 100);
  /* rival H2H */
  var rmsg = null;
  if (rv && S.mode === 'pro' && (mechanicalDNF(P) || mechanicalDNF(rv) || P.evalOrder || rv.evalOrder)) rmsg = 'Rival comparison excluded: mechanical retirement or team order.';
  else if (rv) {
    var won = P.pos < rv.pos; if (won) S.rival.w++; else S.rival.l++;
    rmsg = fmtR(pick(S.round >= seasonRounds(S) - 1 ? (won ? RIV.lastWin : RIV.lastLose) : (won ? RIV.win : RIV.lose)), { r: rv.d.name.split(' ').slice(-1)[0], w: S.rival.w, l: S.rival.l });
  }
  if (S.mode === 'pro') xp = progressionXP(S, 'objectives', xp);
  return { xp: xp, mor: mor, rmsg: rmsg };
}
function objHTML(obj) {
  return obj.map(function (o) { return '<div class="row sp" style="padding:6px 0;border-bottom:1px solid #1d242d"><span>' + (o.protected ? '<span class="dim">Exempt</span> ' : o.ok === true ? '<b class="good">✓</b> ' : o.ok === false ? '<b class="bad">✗</b> ' : '<span class="dim">○</span> ') + esc(o.n) + '</span><span class="mono dim">+' + o.xp + ' XP</span></div>'; }).join('');
}
function moraleTxt(m) { return m >= 75 ? 'The team absolutely loves you' : m >= 55 ? 'The team is happy' : m >= 35 ? 'The team is watching closely' : 'The boss is browsing other drivers\' CVs'; }
