'use strict';
/* ===== Garage Watch (2.4.0): see regulation changes coming, and understand what they did. =====
   - Reg Report: when a change is applied, what each team's car did and why, from the real numbers
     (structure + rules + concept luck + winter development add up to the total change).
   - Regulation Watch: announced changes (major and minor), the new era, and a rough exposure board one season ahead.
   - Behind-the-garage stories from existing state: development, focus for the new rules, budgets.
   Nothing here changes game balance. Hooks live in dev2.js (record), career.js (news), world21.js (announce/apply). */
var RG = { keep: 4, tgt: { champ: -6, last: 5 } };

/* ---------- helpers ---------- */
function rgPow(p) { return (p[0] + p[1] + p[2] + p[3]) / 4; }
function rgR1(v) { return Math.round(v * 10) / 10; }
function rgSgn(v) { return (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v).toFixed(1); }
function rgRanks(vals) { var idx = vals.map(function (v, i) { return i; }).sort(function (a, b) { return vals[b] - vals[a] || a - b; }), r = []; idx.forEach(function (i, n) { r[i] = n + 1; }); return r; }
function rgSnap(S) { return S.teams.map(function (t) { return PARTS.map(function (k) { return t.car[k]; }); }); }
function rgIsF1(S) { return S.mode !== 'pro' || leagueOf(S) === 'f1'; }
function rgAttr(k) { return typeof ATTRN !== 'undefined' && ATTRN[k] ? ATTRN[k] : ({ race: 'racecraft', tyre: 'tyre management', wet: 'wet-weather skill' })[k] || k; }
function rgPct(v, lo, hi) { return clamp(Math.round((v - lo) / (hi - lo) * 100), 0, 100); }

/* ---------- recording (called from devWinter) ---------- */
function rgBegin(S, kind, mix, champId, lastId) {
  var mixes = PARTS.map(function (k) { return S.mode === 'pro' && typeof regPartMix === 'function' ? regPartMix(S, kind, k) : mix; }), parts = kind === 'minor' && typeof regAOn === 'function' && regAOn(S) ? regMinorParts(S).slice() : null;
  return { S: S, kind: kind, mix: mixes.reduce(function (a, x) { return a + x; }, 0) / mixes.length, mixes: mixes, parts: parts, season: S.season + 1, champId: champId, lastId: lastId, s0: rgSnap(S), s1: null, s2: null, s3: null,
    prep: S.teams.map(function (t) { return regPrep(t); }) };
}
function rgMid(ctx, stage) { if (ctx) ctx['s' + stage] = rgSnap(ctx.S); }
function rgBuild(S, ctx) {
  var p0 = ctx.s0.map(rgPow), p3 = ctx.s3.map(rgPow), r0 = rgRanks(p0), r3 = rgRanks(p3), prr = rgRanks(ctx.prep);
  var tgt = PARTS.map(function (k, j) { if (S.target && S.target[k] != null) return S.target[k]; return ctx.s0.reduce(function (a, p) { return a + p[j]; }, 0) / ctx.s0.length; });
  var teams = S.teams.map(function (t, i) {
    var st = PARTS.reduce(function (a, k, j) { return a + (ctx.mixes ? ctx.mixes[j] : ctx.mix) * (tgt[j] - ctx.s0[i][j]); }, 0) / 4, re = rgPow(ctx.s1[i]) - p0[i], ru = rgPow(ctx.s2[i]) - rgPow(ctx.s1[i]), pk = p3[i] - rgPow(ctx.s2[i]);
    return { id: t.id, n: t.name, sh: t.short, col: t.color, p0: rgR1(p0[i]), p1: rgR1(p3[i]), r0: r0[i], r1: r3[i],
      c: { st: rgR1(st), lu: rgR1(re - st), ru: rgR1(ru), pk: rgR1(pk) }, f: { champ: t.id === ctx.champId ? 1 : 0, last: t.id === ctx.lastId ? 1 : 0 }, pr: prr[i] };
  });
  return { season: ctx.season, kind: ctx.kind, mix: ctx.mix, parts: ctx.parts || undefined, teams: teams, era: null };
}
function rgFinish(S, ctx, reg, log) {
  try {
    if (ctx && ctx.s1 && ctx.s2) {
      ctx.s3 = rgSnap(S);
      var rp = rgBuild(S, ctx), note = S.rgEraNote;
      if (note && note.season === rp.season) rp.era = { from: note.from, to: note.to };
      S.regReports = (S.regReports || []).concat([rp]).slice(-RG.keep);
    }
    S.rgStart = { season: S.season + 1, cars: rgSnap(S).map(function (p) { return p.map(rgR1); }) };
    S.rgFin = S.teams.map(function (t) { return t.fin && typeof finStatus === 'function' ? finStatus(t).k : ''; });
  } catch (e) { }
}
function rgEraApplied(S, N, from, to) {
  S.rgEraNote = { season: N, from: from ? JSON.parse(JSON.stringify(from)) : null, to: to ? JSON.parse(JSON.stringify(to)) : null };
  var rp = (S.regReports || []).slice(-1)[0]; if (rp && rp.season === N) rp.era = { from: S.rgEraNote.from, to: S.rgEraNote.to };
}

/* ---------- explanations: why a team moved ---------- */
function rgWhy(e, rp) {
  var c = e.c, n = rp.teams.length, R = [], add = function (k, tone, t, m) { R.push({ k: k, tone: tone, t: t, m: Math.abs(m) }); };
  if (Math.abs(c.st) >= 1.2) add('st', c.st < 0 ? 'bad' : 'good', c.st < 0 ? 'Built for the old rules: a lot of lead to lose' : 'Clean sheet: little to lose, plenty to gain', c.st);
  if (e.f.champ) add('ru', 'bad', 'Champion handicap: advantage locked into the old concept', Math.max(Math.abs(c.ru), 2));
  else if (e.f.last && c.ru >= 1) add('ru', 'good', 'Catch-up allowance for the slowest team', c.ru);
  else if (Math.abs(c.ru) >= 1.5) add('ru', c.ru < 0 ? 'bad' : 'good', c.ru < 0 ? 'The rules adjustment cost ground' : 'The rules adjustment helped', c.ru);
  if (Math.abs(c.lu) >= 1.5) add('lu', c.lu < 0 ? 'bad' : 'good', c.lu < 0 ? 'New concept missed expectations' : 'New concept beat expectations', c.lu);
  if (Math.abs(c.pk) >= 1.5) add('pk', c.pk < 0 ? 'bad' : 'good', c.pk < 0 ? 'Winter development and engine deal held the car back' : 'Winter development added to the step', c.pk);
  if (e.pr <= 3) add('pr', 'good', 'Technical department ready for the change', 0.5);
  else if (e.pr >= n - 2) add('pr', 'bad', 'Stretched technical department', 0.5);
  R.sort(function (a, b) { return b.m - a.m; });
  return R.slice(0, 3);
}
function rgMoves(rp) { return rp.teams.map(function (e) { return { e: e, d: e.r0 - e.r1 }; }); }
function rgReportStory(S, rp) {
  var mv = rgMoves(rp), up = mv.slice().sort(function (a, b) { return b.d - a.d || a.e.r1 - b.e.r1; })[0], dn = mv.slice().sort(function (a, b) { return a.d - b.d || b.e.r1 - a.e.r1; })[0];
  var top = rp.teams.slice().sort(function (a, b) { return a.r1 - b.r1; })[0], major = rp.kind === 'major';
  var line = [];
  if (up && up.d >= 2) line.push(up.e.n + ' climb from P' + up.e.r0 + ' to P' + up.e.r1);
  if (dn && dn.d <= -2) line.push(dn.e.n + ' slip from P' + dn.e.r0 + ' to P' + dn.e.r1);
  return { head: major ? 'New cars, new order: who gained and who lost' : 'Technical update shuffles the order', col: top ? top.col : '#e2342b', t: top ? top.id : null,
    sub: (line.length ? line.join('; ') + '. ' : '') + top.n + ' start Season ' + rp.season + ' with the best car. The full report shows why every team moved.' };
}
function rgProfileLines(p) {
  if (!p) return [];
  var f = function (m) { var d = Math.round((m - 1) * 100); return d > 0 ? { s: '+' + d + '%', c: 'up' } : d < 0 ? { s: '−' + Math.abs(d) + '%', c: 'dn' } : { s: 'No change', c: 'eq' }; };
  return [{ n: 'Engine', v: f(p.P) }, { n: 'Aero', v: f(p.A) }, { n: 'Chassis', v: f(p.M) }];
}

/* ---------- announcements ---------- */
function rgAnnounceMajor(S, N) {
  var e = S.world.era, p = e.nextProfile;
  pushNews(S, { k: 'regnews', rg: 'warn', kind: 'major', eff: e.next, col: '#e2342b', s: N, r: 0,
    head: 'Major regulations confirmed for Season ' + e.next,
    sub: regWords(S, 'major').line.replace(' from scratch', '') + ' ' + (p ? 'Engine ' + rgProfileLines(p)[0].v.s + ', aero ' + rgProfileLines(p)[1].v.s + ', chassis ' + rgProfileLines(p)[2].v.s + ' in lap-time weight, and ' + rgAttr(p.driver) + ' counts for more. ' : '') + 'Teams have one season to prepare.' });
}
function rgAnnounceMinor(S) {
  if (S.mode !== 'pro' || !S.regMinor || S.regMinor !== S.season + 2 || S.rgMinorAnn === S.regMinor) return;
  S.rgMinorAnn = S.regMinor;
  pushNews(S, { k: 'regnews', rg: 'warn', kind: 'minor', eff: S.regMinor, col: '#2f6fbd', s: S.season + 1, r: 0,
    head: 'Technical update confirmed for Season ' + S.regMinor,
    sub: 'A minor change. ' + regWords(S, 'minor').line });
}
function rgAfterWinter(S, wl, reg) {
  if (!rgIsF1(S)) return;
  var rp = reg ? (S.regReports || []).slice(-1)[0] : null;
  if (rp && rp.season === S.season + 1) { var st = rgReportStory(S, rp); pushNews(S, { k: 'regnews', rg: 'report', kind: rp.kind, rs: rp.season, t: st.t, col: st.col, head: st.head, sub: st.sub, s: S.season + 1, r: 0 }); }
  rgAnnounceMinor(S);
}

/* ---------- Regulation Watch state and exposure ---------- */
function rgChampId(S) {
  if (S.round > 0) return teamStandings(S)[0].id;
  var h = (S.hist || []).slice(-1)[0], t = h && S.teams.filter(function (x) { return x.name === h.champTeam; })[0];
  return t ? t.id : teamStandings(S)[0].id;
}
var RG_BANDS = {
  exposed: { l: 'Exposed', i: 0, a: '▼▼', t: 'A lot of lead to lose' }, watch: { l: 'Watch', i: 1, a: '▼', t: 'Likely to lose ground' },
  steady: { l: 'Steady', i: 2, a: '▬', t: 'Little change expected' }, upside: { l: 'Upside', i: 3, a: '▲', t: 'Likely to gain' },
  clean: { l: 'Clean sheet', i: 4, a: '▲▲', t: 'Little to lose, plenty to gain' }
};
/* One place for the expectation: the car re-roll pulls every part toward the league average by `mix`;
   the title leader is handicapped and the slowest team is helped. Only a rough band leaves this function. */
function rgExposure(S, kind) {
  var pro = S.mode === 'pro', mix = regMix(pro, kind), sc = (pro ? regAvgMix(S, kind) : mix) / 0.6, ts = S.teams, pows = ts.map(function (t) { return teamPower(t); }), pr = rgRanks(pows), prep = rgRanks(ts.map(function (t) { return regPrep(t); }));
  var champ = rgChampId(S), low = pows.indexOf(Math.min.apply(null, pows)), mine = S.drivers[S.pi] ? S.drivers[S.pi].team : -1, n = ts.length;
  var rows = ts.map(function (t, i) {
    var st = PARTS.reduce(function (a, k) { return a + (pro ? regPartMix(S, kind, k) : mix) * ((S.target && S.target[k] != null ? S.target[k] : pows[i]) - t.car[k]); }, 0) / 4;
    var ind = st + (t.id === champ ? RG.tgt.champ * sc : 0) + (i === low ? RG.tgt.last * sc : 0);
    var band = ind <= -5 * sc ? 'exposed' : ind <= -2 * sc ? 'watch' : ind < 2 * sc ? 'steady' : ind < 5 * sc ? 'upside' : 'clean';
    return { id: t.id, n: t.name, sh: t.short, col: t.color, rank: pr[i], band: band, ind: ind, champ: t.id === champ, last: i === low, ready: prep[i] <= 3, stretched: prep[i] >= n - 2, mine: t.id === mine };
  });
  rows.sort(function (a, b) { return a.ind - b.ind; });
  return rows;
}
function rgWatch(S) {
  if (!S || !S.teams || !rgIsF1(S) || S.sit) return { state: 'none' };
  var e = S.world && S.world.era, last = (S.regReports || []).slice(-1)[0] || null, w = { state: 'quiet', last: last };
  if (e && e.announced != null && e.announced === e.next && e.next === S.season + 1 && S.mode === 'pro') w = { state: 'warn', kind: 'major', eff: e.next, prof: e.nextProfile, cur: e.profile, last: last };
  else if (S.regMinor && S.rgMinorAnn === S.regMinor && S.regMinor === S.season + 1) w = { state: 'warn', kind: 'minor', eff: S.regMinor, last: last };
  if (w.state === 'warn') w.rows = rgExposure(S, w.kind);
  w.recent = !!(last && last.season === S.season);
  return w;
}

/* ---------- behind-the-garage stories (deterministic, never touches the race random numbers) ---------- */
function rgHash(S, salt) { return hash01(S.season * 31 + S.round * 7 + 3, salt); }
function rgPart(k) { return ({ aero: 'aero', engine: 'engine', chassis: 'chassis', rel: 'reliability' })[k] || k; }
function rgGarage(S) {
  if (!rgIsF1(S) || S.sit || !S.teams) return;
  var rnd0 = S.round, last = rnd0 >= seasonRounds(S), made = 0, push = function (o) { o.k = 'garage'; o.s = S.season; o.r = S.round; pushNews(S, o); made++; };
  S.rgSeen = S.rgSeen && S.rgSeen.s === S.season ? S.rgSeen : { s: S.season, keys: {} };
  /* car power of every team after each round: feeds the Team outlook graph (current season only) */
  if (!S.rgTrend || S.rgTrend.season !== S.season) S.rgTrend = { season: S.season, pts: [] };
  if (!S.rgTrend.pts.some(function (x) { return x.r === S.round; })) S.rgTrend.pts.push({ r: S.round, p: S.teams.map(function (t) { return rgR1(teamPower(t)); }) });
  /* saves from before 2.4.0 have no winter snapshot: start measuring from now */
  if (!S.rgStart || S.rgStart.season !== S.season) S.rgStart = { season: S.season, cars: rgSnap(S).map(function (p) { return p.map(rgR1); }), late: true };
  /* money: a team crosses into a new budget state (at most one story per four rounds) */
  var fin = S.teams.map(function (t) { return t.fin && typeof finStatus === 'function' ? finStatus(t).k : ''; }), prev = S.rgFin || [];
  if (!last && (S.rgMoneyAt == null || rnd0 - S.rgMoneyAt >= 4)) {
    for (var i = 0; i < S.teams.length && !made; i++) {
      var a = prev[i], b = fin[i], t = S.teams[i]; if (!a || !b || a === b) continue;
      if (b === 'bad') push({ t: t.id, kick: 'GARAGE', head: t.name + ' feel the budget squeeze', sub: t.short + ' are running tight on cash. Expect smaller upgrade packages and fewer risks until the books recover.' });
      else if (b === 'cap') push({ t: t.id, kick: 'GARAGE', head: t.name + ' reach the cost cap', sub: 'Every dollar now counts. The development budget is as large as the rules allow.' });
      else if (b === 'good' && (a === 'bad' || a === 'ok')) push({ t: t.id, kick: 'GARAGE', head: t.name + ' are well funded again', sub: 'Healthy finances give ' + t.short + ' room to bring bolder upgrades.' });
      if (made) S.rgMoneyAt = rnd0;
    }
  }
  S.rgFin = fin;
  if (last || rnd0 % 3 !== 0) return;
  /* development watch: who has moved since winter */
  if (S.rgStart && S.rgStart.season === S.season && made < 2) {
    var p0 = S.rgStart.cars.map(rgPow), p1 = S.teams.map(function (t) { return teamPower(t); }), r0 = rgRanks(p0), r1 = rgRanks(p1), d = p1.map(function (v, i) { return v - p0[i]; });
    var order = d.map(function (v, i) { return i; }).sort(function (x, y) { return Math.abs(d[y]) - Math.abs(d[x]); }), pick0 = order.filter(function (i) { return Math.abs(d[i]) >= 1 && !S.rgSeen.keys['dev' + i + (d[i] > 0 ? 'u' : 'd')]; })[0];
    if (pick0 != null) {
      var t = S.teams[pick0], j = 0, best = 0; PARTS.forEach(function (k, x) { var dd = t.car[k] - S.rgStart.cars[pick0][x]; if (Math.abs(dd) > Math.abs(best)) { best = dd; j = x; } });
      var up = d[pick0] > 0, part = rgPart(PARTS[j]), big = Math.abs(d[pick0]) >= 2.5;
      S.rgSeen.keys['dev' + pick0 + (up ? 'u' : 'd')] = 1;
      push({ t: t.id, kick: 'GARAGE', head: up ? t.name + (big ? ' find a clear step in ' + part : ' add a solid gain in ' + part) : t.name + ' lose ground on ' + part,
        sub: (up ? 'The upgrades are working.' : 'Development has gone the wrong way.') + ' On car pace ' + t.short + ' are ' + (r1[pick0] === r0[pick0] ? 'still P' + r1[pick0] : (up ? 'up' : 'down') + ' from P' + r0[pick0] + ' to P' + r1[pick0]) + ' since winter.' });
    }
  }
  /* focus on the new rules: who is exposed, who has a clean sheet, who is ready */
  var w = rgWatch(S);
  if (w.state === 'warn' && made < 2 && rnd0 % 6 !== 0) {
    var rows = w.rows, cand = [];
    rows.slice(0, 2).forEach(function (r) { if (r.band === 'exposed' || r.band === 'watch') cand.push({ r: r, k: 'ex' }); });
    rows.slice(-2).forEach(function (r) { if (r.band === 'clean' || r.band === 'upside') cand.push({ r: r, k: 'cl' }); });
    rows.filter(function (r) { return r.ready; }).slice(0, 1).forEach(function (r) { cand.push({ r: r, k: 'rd' }); });
    rows.filter(function (r) { return r.stretched; }).slice(0, 1).forEach(function (r) { cand.push({ r: r, k: 'st' }); });
    cand = cand.filter(function (c) { return !S.rgSeen.keys['f' + c.k + c.r.id]; });
    var pick1 = cand[Math.floor(rgHash(S, 11) * cand.length)];
    if (pick1) {
      var r = pick1.r, nm = r.n, yr = w.eff;
      S.rgSeen.keys['f' + pick1.k + r.id] = 1;
      push({ t: r.id, kick: 'REGULATIONS', col: undefined, head: pick1.k === 'ex' ? (r.champ ? nm + ' face the hardest rebuild' : nm + ' weigh up how much to give away this season')
          : pick1.k === 'cl' ? nm + ' eye a fresh start for ' + yr : pick1.k === 'rd' ? nm + ' look best prepared for the ' + yr + ' rules' : nm + ' look stretched ahead of the ' + yr + ' rules',
        sub: pick1.k === 'ex' ? 'The team with the most to lose from the new rules has to decide how long to keep developing the current car.' : pick1.k === 'cl' ? 'With little to lose, ' + r.sh + ' can start thinking about next year early.'
          : pick1.k === 'rd' ? 'The technical department is seen as the best placed to turn the new rules into speed.' : 'The technical department has a lot on its plate, and the paddock wonders if it can deliver.' });
    }
  }
}

/* ---------- UI: pieces ---------- */
function rgGauge(band) { var b = RG_BANDS[band]; return '<span class="rg-gauge" data-b="' + band + '" aria-hidden="true">' + [0, 1, 2, 3, 4].map(function (i) { return '<i class="' + (i === b.i ? 'on' : '') + '"></i>'; }).join('') + '</span>'; }
function rgTiles(p) {
  return '<div class="rg-tiles">' + rgProfileLines(p).map(function (x) { return '<div class="' + x.v.c + '"><small>' + x.n + '</small><b>' + x.v.s + '</b><span>' + (x.v.c === 'up' ? 'counts for more' : x.v.c === 'dn' ? 'counts for less' : 'unchanged') + '</span></div>'; }).join('') + '</div>';
}
function rgSteps(w) {
  var cur = S.season, E = w.eff, steps = [['Announced', 'Done'], ['Season ' + cur, 'Last year of the current rules'], ['Winter', 'Cars rebuilt'], ['Season ' + E, 'New rules']];
  return '<ol class="rg-steps" aria-label="Timeline">' + steps.map(function (x, i) { return '<li class="' + (i < 2 ? 'done' : '') + (i === 1 ? ' now' : '') + '"><i></i><b>' + x[0] + '</b><span>' + x[1] + '</span></li>'; }).join('') + '</ol>';
}
function rgHeroHTML(w) {
  if (w.state === 'warn') {
    var major = w.kind === 'major';
    return '<section class="rg-hero ' + (major ? '' : 'minor') + '"><small class="rg-eyebrow">REGULATION WATCH / SEASON ' + S.season + '</small>' +
      '<h2>' + (major ? 'MAJOR' : 'MINOR') + ' CHANGE<span>SEASON ' + w.eff + '</span></h2>' +
      '<p>' + (major ? regWords(S, 'major').line + ' Engine, aero and chassis count differently, and the order is up for grabs.' : regWords(S, 'minor').line) + '</p>' +
      '<div class="rg-badges"><span class="ok">ANNOUNCED</span><span>' + regWords(S, major ? 'major' : 'minor').badge + '</span><span>ONE SEASON TO PREPARE</span></div>' + rgSteps(w) + '</section>';
  }
  var l = w.last;
  return '<section class="rg-hero quiet"><small class="rg-eyebrow">REGULATION WATCH / SEASON ' + S.season + '</small><h2>QUIET<span>HORIZON</span></h2>' +
    '<p>No change has been announced. Major changes arrive every 5 to 6 seasons and minor ones every 2 to 3, and every change is announced one season ahead.</p>' +
    '<div class="rg-badges"><span>NOT ANNOUNCED</span>' + (l ? '<span>LAST CHANGE · ' + l.kind.toUpperCase() + ' · SEASON ' + l.season + '</span>' : '') + '</div></section>';
}
function rgBoardHTML(w) {
  var rows = w.rows, sc = w.kind === 'major' ? '' : ' (minor: about half as strong)';
  return '<section class="pd-panel rg-board"><small class="pd-eyebrow">EXPOSURE BOARD</small><h3>Who has the most to lose</h3>' +
    '<p class="rg-lead">A rough read of how each car is likely to move' + sc + '. Teams far above the league average have the most to lose, the title leader is handicapped and the slowest team gets a catch-up allowance. Luck still plays a part.</p>' +
    '<ul class="rg-rows">' + rows.map(function (r) {
      var b = RG_BANDS[r.band];
      return '<li class="rg-row ' + r.band + (r.mine ? ' mine' : '') + '" style="--tc:' + r.col + '"><i class="rg-tab"></i><div class="rg-who"><b>' + esc(r.n) + (r.mine ? ' <em>YOU</em>' : '') + '</b><span class="rg-tags"><u>P' + r.rank + ' on car pace</u>' +
        (r.champ ? '<u class="warn">Title leader</u>' : '') + (r.last ? '<u class="good">Slowest car</u>' : '') + (r.ready ? '<u class="good">Well prepared</u>' : '') + (r.stretched ? '<u class="bad">Stretched</u>' : '') + '</span></div>' +
        '<div class="rg-read">' + rgGauge(r.band) + '<span class="rg-band ' + r.band + '"><b>' + b.a + ' ' + b.l + '</b><small>' + b.t + '</small></span></div></li>';
    }).join('') + '</ul></section>';
}
function rgHelpHTML() {
  return dgHelp('How a regulation change works', (regAOn(S) ? '<p>On the winter a change arrives, a <b>major</b> change rebuilds <b>about 70% of every car</b>; a <b>minor</b> change targets one or two areas (aero, chassis or engine) and reworks <b>about 75% of those</b>, the rest carries over. Parts are redesigned toward the league average: a car far above average has the most to lose, a weak one has the most to gain.</p>' : '<p>On the winter a change arrives, <b>about 60% of every car</b> (major) or <b>30%</b> (minor) is redesigned toward the league average. A car far above average has the most to lose, a weak one has the most to gain.</p>') +
    '<p>The <b>title leader is handicapped</b> because its advantage is locked into the old concept, and the <b>slowest team gets a catch-up allowance</b>. Preparation (prestige, technical director and staff) softens the blow.</p>' +
    '<p>On a major change the era also shifts how much engine, aero and chassis matter on every lap, and which driver skill counts for more. Concept luck and winter development decide the rest.</p>');
}
/* ---------- UI: report ---------- */
function rgSlope(rp, mineId) {
  var n = rp.teams.length, H = 26, top = 24, xl = 128, xr = 232, W = 360, h = top + n * H + 6, y = function (r) { return top + (r - 1) * H + H / 2; }, o = '';
  o += '<text x="' + (xl - 14) + '" y="12" text-anchor="end" class="rg-st-h">BEFORE</text><text x="' + (xr + 14) + '" y="12" class="rg-st-h">AFTER</text>';
  rp.teams.slice().sort(function (a, b) { return a.r0 - b.r0; }).forEach(function (e) {
    var mine = e.id === mineId, y0 = y(e.r0), y1 = y(e.r1), mid = (xl + xr) / 2;
    o += '<path d="M' + xl + ' ' + y0 + ' C' + mid + ' ' + y0 + ' ' + mid + ' ' + y1 + ' ' + xr + ' ' + y1 + '" fill="none" stroke="' + e.col + '" stroke-width="' + (mine ? 4.5 : 2.5) + '" stroke-linecap="round" opacity="' + (mine ? 1 : .85) + '"/>';
    o += '<circle cx="' + xl + '" cy="' + y0 + '" r="' + (mine ? 5 : 3.6) + '" fill="' + e.col + '"/><circle cx="' + xr + '" cy="' + y1 + '" r="' + (mine ? 5 : 3.6) + '" fill="' + e.col + '"/>';
    var d = e.r0 - e.r1, ar = d > 0 ? '▲' + d : d < 0 ? '▼' + Math.abs(d) : '';
    o += '<text x="' + (xl - 14) + '" y="' + (y0 + 3.5) + '" text-anchor="end" class="rg-st-t' + (mine ? ' me' : '') + '">' + e.r0 + '  ' + esc(e.sh) + '</text>';
    o += '<text x="' + (xr + 14) + '" y="' + (y1 + 3.5) + '" class="rg-st-t' + (mine ? ' me' : '') + '">' + e.r1 + '  ' + esc(e.sh) + ' <tspan class="' + (d > 0 ? 'up' : d < 0 ? 'dn' : '') + '">' + ar + '</tspan></text>';
  });
  return '<svg class="rg-slope" viewBox="0 0 ' + W + ' ' + h + '" role="img" aria-label="Team order before and after the regulation change">' + o + '</svg>';
}
var RG_COMP = [['st', 'Old-rules exposure'], ['ru', 'Title and catch-up rules'], ['lu', 'Concept luck'], ['pk', 'Winter development and engines']];
function rgDbar(e, max) {
  var seg = function (neg) { return RG_COMP.map(function (c) { var v = e.c[c[0]]; if (neg ? v >= 0 : v <= 0) return ''; return '<u class="c-' + c[0] + '" style="width:' + Math.max(2, Math.abs(v) / max * 100).toFixed(1) + '%" title="' + c[1] + ' ' + rgSgn(v) + '"></u>'; }).join(''); };
  return '<div class="rg-dbar" role="img" aria-label="' + RG_COMP.map(function (c) { return c[1] + ' ' + rgSgn(e.c[c[0]]); }).join(', ') + '"><div class="neg">' + seg(true) + '</div><i></i><div class="pos">' + seg(false) + '</div></div>';
}
function rgReportBody(rp) {
  var mine = S.drivers[S.pi] ? S.drivers[S.pi].team : -1, max = 1; rp.teams.forEach(function (e) { RG_COMP.forEach(function (c) { max = Math.max(max, Math.abs(e.c[c[0]])); }); });
  var me0 = rp.teams.filter(function (e) { return e.id === mine; })[0], why = me0 ? rgWhy(me0, rp) : [];
  var yours = me0 ? '<section class="rg-yours ' + (me0.r1 < me0.r0 ? 'up' : me0.r1 > me0.r0 ? 'dn' : '') + '" style="--tc:' + me0.col + '"><small class="pd-eyebrow">YOUR TEAM</small><b>' + esc(me0.n) + ': P' + me0.r0 + ' → P' + me0.r1 + '</b><span>' +
    (why.length ? why.slice(0, 2).map(function (x) { return esc(x.t); }).join('. ') + '.' : 'Little changed.') + '</span></section>' : '';
  var legend = '<div class="rg-legend">' + RG_COMP.map(function (c) { return '<span><i class="c-' + c[0] + '"></i>' + c[1] + '</span>'; }).join('') + '</div>';
  var list = '<ul class="rg-teams">' + rp.teams.slice().sort(function (a, b) { return a.r1 - b.r1; }).map(function (e) {
    var d = e.r0 - e.r1, w = rgWhy(e, rp);
    return '<li class="' + (e.id === mine ? 'mine' : '') + '" style="--tc:' + e.col + '"><div class="rg-t-head"><i class="rg-pos">' + e.r1 + '</i><b>' + esc(e.n) + '</b><span class="rg-move ' + (d > 0 ? 'up' : d < 0 ? 'dn' : '') + '">' + (d > 0 ? '▲ ' + d : d < 0 ? '▼ ' + Math.abs(d) : '▬') + ' <small>P' + e.r0 + ' → P' + e.r1 + '</small></span></div>' + rgDbar(e, max) +
      '<div class="rg-why">' + (w.length ? w.map(function (x) { return '<u class="' + x.tone + '">' + esc(x.t) + '</u>'; }).join('') : '<u>Little changed</u>') + '</div></li>';
  }).join('') + '</ul>';
  var era = rp.era && rp.era.to ? pdPanel('THE NEW ERA', 'What counts for more now', rgTiles(rp.era.to) + '<p class="rg-lead">Driver skill that counts for more: <b>' + esc(rgAttr(rp.era.to.driver)) + '</b>.</p>') : '';
  return yours + pdPanel('HOW THE ORDER CHANGED', 'Before and after', rgSlope(rp, mine)) + pdPanel('WHY TEAMS MOVED', 'The reasons, team by team', '<p class="rg-lead">Each bar adds up to the team’s total change in car power: left of the line is lost, right is gained.</p>' + legend + list) + era;
}
function rgReportModal(season) {
  var rp = (S.regReports || []).filter(function (r) { return r.season === +season; })[0]; if (!rp) return;
  showModal('<article class="pn-article rg-art" style="--tc:' + (rp.kind === 'major' ? '#e2342b' : '#2f6fbd') + '"><header class="pd-top"><span>REGULATION REPORT / SEASON ' + rp.season + '</span><button class="pd-close" data-act="mclose" aria-label="Close report">✕</button></header>' +
    '<div class="rg-art-hero"><small class="rg-eyebrow">' + rp.kind.toUpperCase() + ' CHANGE · ' + (rp.parts ? esc(regPartsText(rp.parts)).toUpperCase() + ' RULES · 75% OF THOSE AREAS REDESIGNED' : Math.round(rp.mix * 100) + '% OF EVERY CAR REDESIGNED') + '</small><h2>' + (rp.kind === 'major' ? 'New cars, new order' : 'A technical update') + '</h2></div><div class="rg46 rg-art-body">' + rgReportBody(rp) + '</div></article>');
}
/* ---------- UI: Season page and Home strip ---------- */
function rgPage() {
  var w = rgWatch(S);
  if (w.state === 'none') return '<div class="rg46"><section class="rg-hero quiet"><small class="rg-eyebrow">REGULATION WATCH</small><h2>F1<span>ONLY</span></h2><p>Regulation changes apply to the F1 grid.</p></section></div>';
  var h = '<div class="rg46">' + rgHeroHTML(w);
  if (w.state === 'warn') {
    if (w.kind === 'major' && w.prof) h += pdPanel('THE NEW ERA', 'What will count for more', rgTiles(w.prof) + '<p class="rg-lead">Driver skill that will count for more: <b>' + esc(rgAttr(w.prof.driver)) + '</b>. Every team gets the same rules.</p>');
    h += rgBoardHTML(w);
  }
  if (w.last) {
    var l = w.last, mv = rgMoves(l).sort(function (a, b) { return b.d - a.d; }), up = mv[0], dn = mv[mv.length - 1];
    h += '<section class="pd-panel rg-last"><small class="pd-eyebrow">LAST CHANGE / SEASON ' + l.season + '</small><h3>' + (l.kind === 'major' ? 'The ' + l.season + ' reshuffle' : 'The ' + l.season + ' technical update') + '</h3>' +
      '<div class="rg-last-sum">' + (up && up.d > 0 ? '<span class="up"><b>▲ ' + up.d + '</b>' + esc(up.e.n) + '<small>P' + up.e.r0 + ' → P' + up.e.r1 + '</small></span>' : '') + (dn && dn.d < 0 ? '<span class="dn"><b>▼ ' + Math.abs(dn.d) + '</b>' + esc(dn.e.n) + '<small>P' + dn.e.r0 + ' → P' + dn.e.r1 + '</small></span>' : '') + '</div>' +
      '<button class="btn pri wide" data-act="rg-report" data-v="' + l.season + '">Read the full report</button>' +
      ((S.regReports || []).length > 1 ? '<div class="rg-hist">' + (S.regReports || []).slice(0, -1).reverse().map(function (r) { return '<button class="btn sm" data-act="rg-report" data-v="' + r.season + '">Season ' + r.season + ' · ' + r.kind + '</button>'; }).join('') + '</div>' : '') + '</section>';
  } else if (w.state === 'quiet') h += '<section class="pd-panel"><small class="pd-eyebrow">NO REPORTS YET</small><h3>Nothing to compare</h3><p class="rg-lead">When the next change is applied, this page will show how every team moved and why.</p></section>';
  return h + rgHelpHTML() + '</div>';
}
function rgStripHTML() {
  var w = rgWatch(S); if (w.state === 'none') return '';
  if (w.state === 'warn') {
    var rows = w.rows, mine = rows.filter(function (r) { return r.mine; })[0], top = rows.slice(0, 3), b = mine ? RG_BANDS[mine.band] : null;
    return '<button class="rg-strip ' + (w.kind === 'minor' ? 'minor' : '') + '" data-act="rg-open"><span class="rg-strip-ic" aria-hidden="true">⚑</span><span class="rg-strip-copy"><small>REGULATION WATCH · SEASON ' + w.eff + '</small><b>' + (w.kind === 'major' ? 'Major change next season' : 'Technical update next season') + '</b>' +
      '<span>' + (mine ? esc(mine.n) + ': <em class="' + mine.band + '">' + b.l + '</em>. ' : '') + 'Most exposed: ' + top.map(function (r) { return '<i style="--tc:' + r.col + '"></i>' + esc(r.sh); }).join(' ') + '</span></span><span class="rg-strip-go">OPEN →</span></button>';
  }
  var l = w.last; if (!l || l.season !== S.season || S.round > 10) return '';
  var me0 = l.teams.filter(function (e) { return S.drivers[S.pi] && e.id === S.drivers[S.pi].team; })[0];
  return '<button class="rg-strip report" data-act="rg-open"><span class="rg-strip-ic" aria-hidden="true">⚑</span><span class="rg-strip-copy"><small>REGULATION REPORT · SEASON ' + l.season + '</small><b>' + (l.kind === 'major' ? 'See how the new rules reshuffled the grid' : 'See what the technical update changed') + '</b>' +
    (me0 ? '<span>' + esc(me0.n) + ': P' + me0.r0 + ' → P' + me0.r1 + '</span>' : '') + '</span><span class="rg-strip-go">OPEN →</span></button>';
}
if (typeof A !== 'undefined') {
  A['rg-open'] = function () { UI.musimView = 'regs'; UI.tab = 'musim'; UI.screen = 'hub'; closeModal(); render(); window.scrollTo(0, 0); };
  A['rg-report'] = function (d) { rgReportModal(d.v); };
  var rgOpenNews = A['nw-open'];
  A['nw-open'] = function (d) {
    var n = newsList(S).filter(function (x) { return x.id === +d.v; })[0];
    if (n && ((n.k === 'regnews' && n.rg === 'report') || n.k === 'reg') && (S.regReports || []).some(function (r) { return r.season === (n.rs || n.s); })) return rgReportModal(n.rs || n.s);
    return rgOpenNews(d);
  };
}
/* Home: the strip sits above the three Home columns */
if (typeof hUtama === 'function') {
  var rgHome0 = hUtama;
  hUtama = function () { var h = rgHome0.apply(this, arguments), s = rgStripHTML(), i = h.indexOf('<div class="hp-cols">'); return s && i >= 0 ? h.slice(0, i) + s + h.slice(i) : h; };
}
/* Season: Regs and Archive views next to the others */
function rgNavBtns(view) {
  return (rgWatch(S).state === 'none' ? '' : '<button class="btn sm ' + (view === 'regs' ? 'on' : '') + (rgWatch(S).state === 'warn' ? ' rg-dot' : '') + '" data-act="hub-section" data-v="regs">Regs</button>') +
    (typeof arPage === 'function' ? '<button class="btn sm ' + (view === 'archive' ? 'on' : '') + '" data-act="hub-section" data-v="archive">Archive</button>' : '');
}
function rgNav(view) {
  return '<div class="hub-sections" role="group" aria-label="Season">' + [['calendar', 'Calendar'], ['results', 'Results'], ['standings', 'Standings'], ['news', 'News'], ['history', 'History']].concat(S.world ? [['world', 'World']] : []).map(function (x) { return '<button class="btn sm" data-act="hub-section" data-v="' + x[0] + '">' + x[1] + '</button>'; }).join('') + rgNavBtns(view) + '</div>';
}
if (typeof hMusim === 'function') {
  var rgMusim0 = hMusim;
  hMusim = function () {
    if (UI.musimView !== 'regs') { var h = rgMusim0.apply(this, arguments); return h.replace('</div>', rgNavBtns(UI.musimView) + '</div>'); }
    return rgNav('regs') + rgPage();
  };
  var rgSection0 = A['hub-section'];
  A['hub-section'] = function (d) { if (d.v === 'regs') { UI.musimView = 'regs'; UI.tab = 'musim'; render(); window.scrollTo(0, 0); return; } return rgSection0(d); };
}

/* ---------- story pack ---------- */
function rgPackText(S) {
  var w = rgWatch(S), L = [];
  if (w.state === 'none') return 'Regulation changes apply to the F1 grid.';
  if (w.state === 'warn') {
    L.push('Announced: ' + w.kind.toUpperCase() + ' change for Season ' + w.eff + (w.kind === 'major' ? ' (about ' + regWords(S, 'major').pct + ' of every car rebuilt)' : regAOn(S) ? ' (' + regWords(S, 'minor').parts + ' rules: about 75% of those areas reworked, the rest carries over)' : ' (about 30% of every car reworked)') + '. Teams have one season to prepare.');
    if (w.kind === 'major' && w.prof) L.push('New era weights: ' + rgProfileLines(w.prof).map(function (x) { return x.n + ' ' + x.v.s; }).join(', ') + '; driver skill that counts for more: ' + rgAttr(w.prof.driver) + '.');
    L.push('Exposure (rough, most exposed first):');
    w.rows.forEach(function (r) { L.push('  ' + r.n + ': ' + RG_BANDS[r.band].l + ' (' + RG_BANDS[r.band].t + ')' + (r.champ ? ', title leader' : '') + (r.last ? ', slowest car' : '') + (r.ready ? ', well prepared' : '') + (r.stretched ? ', stretched' : '') + (r.mine ? ', PLAYER TEAM' : '')); });
  } else L.push('No regulation change announced. Majors every 5 to 6 seasons, minors every 2 to 3, always announced one season ahead.');
  (S.regReports || []).slice(-2).forEach(function (rp) {
    L.push('', 'Reg Report, Season ' + rp.season + ' (' + rp.kind + ', ' + (rp.parts ? regPartsText(rp.parts) + ' rules, about 75% of those areas redesigned' : Math.round(rp.mix * 100) + '% of every car redesigned') + '). Change in car power = old-rules exposure + title/catch-up rules + concept luck + winter development:');
    if (rp.era && rp.era.to) L.push('  New era weights: ' + rgProfileLines(rp.era.to).map(function (x) { return x.n + ' ' + x.v.s; }).join(', ') + '; driver skill: ' + rgAttr(rp.era.to.driver));
    rp.teams.slice().sort(function (a, b) { return a.r1 - b.r1; }).forEach(function (e) { L.push('  ' + e.n + ': P' + e.r0 + ' -> P' + e.r1 + ' | exposure ' + rgSgn(e.c.st) + ', rules ' + rgSgn(e.c.ru) + ', luck ' + rgSgn(e.c.lu) + ', development ' + rgSgn(e.c.pk) + ' | ' + rgWhy(e, rp).map(function (x) { return x.t; }).join('; ')); });
  });
  return L.join('\n');
}

/* ---------- Contract Outlook (2.4.1): today's picture of a team, shown on offer cards ---------- */
function rgOutlook(id) {
  if (!rgIsF1(S) || !S.teams || !S.teams[id] || S.sit) return null;
  var pows = S.teams.map(function (t) { return teamPower(t); }), rk = rgRanks(pows), n = S.teams.length, t = S.teams[id], o = { id: id, rank: rk[id], n: n, tags: [] };
  var st = S.rgStart && S.rgStart.season === S.season && S.rgStart.cars && S.rgStart.cars[id] ? S.rgStart : null;
  if (st) { var p0 = S.rgStart.cars.map(rgPow), r0 = rgRanks(p0); o.d = pows[id] - p0[id]; o.dr = r0[id] - rk[id]; }
  o.fin = t.fin && typeof finStatus === 'function' ? finStatus(t) : null;
  o.tg = t.dev && t.dev.target || null;
  var w = rgWatch(S); o.warn = w.state === 'warn' ? (w.rows.filter(function (r) { return r.id === id; })[0] || null) : null;
  if (o.rank <= 3) o.tags.push(['Title contender', 'good']); else if (o.rank >= n - 2) o.tags.push(['Back of the grid', 'bad']);
  if (o.d != null) { if (o.d >= 1.5 || o.dr >= 2) o.tags.push(['Rising', 'good']); else if (o.d <= -1.5 || o.dr <= -2) o.tags.push(['Falling', 'bad']); }
  if (o.warn) { if (o.warn.band === 'exposed' || o.warn.band === 'watch') o.tags.push(['Exposed to new rules', 'bad']); else if (o.warn.band === 'clean' || o.warn.band === 'upside') o.tags.push(['Gains from new rules', 'good']); if (o.warn.ready) o.tags.push(['Well prepared', 'good']); if (o.warn.stretched) o.tags.push(['Stretched', 'bad']); }
  return o;
}
function rgSeries(id) {
  var out = [], st = S.rgStart && S.rgStart.season === S.season && !S.rgStart.late ? S.rgStart : null;
  if (st && st.cars) out.push({ r: 0, v: rgPow(st.cars[id]), a: st.cars.reduce(function (a, c) { return a + rgPow(c); }, 0) / st.cars.length });
  var tr = S.rgTrend && S.rgTrend.season === S.season ? S.rgTrend.pts : [];
  tr.forEach(function (x) { if (!out.some(function (y) { return y.r === x.r; })) out.push({ r: x.r, v: x.p[id], a: x.p.reduce(function (a, b) { return a + b; }, 0) / x.p.length }); });
  return out.sort(function (a, b) { return a.r - b.r; });
}
function rgSpark(ser) {
  var W = 300, H = 76, px = 14, py = 10;
  if (ser.length < 2) return '<div class="rg-spark empty"><svg viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none" aria-hidden="true"><line x1="' + px + '" y1="' + H / 2 + '" x2="' + (W - px) + '" y2="' + H / 2 + '"/></svg><span>The graph fills in after a few races</span></div>';
  var vals = ser.map(function (x) { return x.v; }).concat(ser.map(function (x) { return x.a; })), lo = Math.min.apply(null, vals), hi = Math.max.apply(null, vals), mid = (lo + hi) / 2, span = Math.max(hi - lo, 4); lo = mid - span / 2; hi = mid + span / 2;
  var r0 = ser[0].r, r1 = Math.max(ser[ser.length - 1].r, r0 + 1);
  var X = function (r) { return px + (r - r0) / (r1 - r0) * (W - 2 * px); }, Y = function (v) { return H - py - (v - lo) / (hi - lo) * (H - 2 * py); };
  var line = ser.map(function (x, i) { return (i ? 'L' : 'M') + X(x.r).toFixed(1) + ' ' + Y(x.v).toFixed(1); }).join(''), avg = ser.map(function (x, i) { return (i ? 'L' : 'M') + X(x.r).toFixed(1) + ' ' + Y(x.a).toFixed(1); }).join('');
  var last = ser[ser.length - 1], area = line + 'L' + X(last.r).toFixed(1) + ' ' + (H - py + 4) + 'L' + X(r0).toFixed(1) + ' ' + (H - py + 4) + 'Z';
  return '<div class="rg-spark"><svg viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none" role="img" aria-label="Car power this season"><path class="ar" d="' + area + '"/><path class="av" d="' + avg + '"/><path class="ln" d="' + line + '"/></svg>' +
    '<i class="dot" style="left:' + (X(last.r) / W * 100).toFixed(1) + '%;top:' + (Y(last.v) / H * 100).toFixed(1) + '%"></i><div class="rg-spark-k"><span><b></b>This car</span><span><b class="a"></b>Grid average</span></div></div>';
}
function rgOutlookHTML(id) {
  var o = rgOutlook(id); if (!o) return '';
  var ser = rgSeries(id), has = o.d != null, cls = !has ? '' : o.d >= 0.5 ? 'up' : o.d <= -0.5 ? 'dn' : '';
  var order = S.teams.map(function (t) { return { id: t.id, v: teamPower(t) }; }).sort(function (a, b) { return b.v - a.v; });
  var pos = '<span class="rg-field" aria-hidden="true">' + order.map(function (x) { return '<i class="' + (x.id === id ? 'me' : '') + '"></i>'; }).join('') + '</span>';
  var chips = [['Trend', has ? (cls === 'up' ? '▲ ' : cls === 'dn' ? '▼ ' : '') + rgSgn(rgR1(o.d)) : '–', cls, has ? (o.dr ? (o.dr > 0 ? 'Up ' : 'Down ') + Math.abs(o.dr) + (Math.abs(o.dr) > 1 ? ' places' : ' place') : 'Same place') + ' since winter' : 'From the next race']];
  if (o.fin) chips.push(['Money', o.fin.txt, o.fin.k === 'bad' ? 'dn' : o.fin.k === 'good' || o.fin.k === 'cap' ? 'up' : '', 'Budget status']);
  if (o.warn) chips.push(['New rules', RG_BANDS[o.warn.band].l, o.warn.band === 'exposed' || o.warn.band === 'watch' ? 'dn' : o.warn.band === 'steady' ? '' : 'up', RG_BANDS[o.warn.band].t]);
  if (o.tg) chips.push(['Board target', 'P' + o.tg, '', 'In the constructors’']);
  return '<div class="rg-out" aria-label="Team outlook"><div class="rg-out-h"><div><small>Team outlook</small><b>P' + o.rank + '</b><i>of ' + o.n + ' on car pace</i></div>' + pos + '</div>' + rgSpark(ser) +
    '<div class="rg-out-g">' + chips.map(function (c) { return '<div class="' + c[2] + '"><small>' + c[0] + '</small><b>' + c[1] + '</b><span>' + c[3] + '</span></div>'; }).join('') + '</div>' +
    (o.tags.length ? '<div class="rg-tags">' + o.tags.map(function (x) { return '<u class="' + x[1] + '">' + x[0] + '</u>'; }).join('') + '</div>' : '') +
    '<p class="rg-out-n">Cars are rebuilt every winter, so this is today’s picture, not a promise.</p></div>';
}
(function () {
  var oc0 = typeof offerCardHTML === 'function' ? offerCardHTML : null;
  if (oc0) offerCardHTML = function (o) { var h = oc0.apply(this, arguments), k = '<button class="btn pri wide" data-act="sign-pre"', i = h.lastIndexOf(k); try { var x = o.f1 || o.sit ? '' : rgOutlookHTML(o.team); return x && i >= 0 ? h.slice(0, i) + x + h.slice(i) : h; } catch (e) { return h; } };
  var mo0 = typeof marketOfferHTML === 'function' ? marketOfferHTML : null;
  if (mo0) marketOfferHTML = function (o) { var h = mo0.apply(this, arguments), k = '<div class="cv-offer-act">', i = h.lastIndexOf(k); try { var x = o.league === 'f1' && !o.program && !o.loan ? rgOutlookHTML(o.team) : ''; return x && i >= 0 ? h.slice(0, i) + x + h.slice(i) : h; } catch (e) { return h; } };
})();
