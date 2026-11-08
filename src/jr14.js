'use strict';
/* ===== Fasa 14: laluan Junior Series (F2) -> F1 ===== */
var JR_MAX = 3;      /* tahun maksimum dalam Junior Series sebelum dipaksa naik */

/* ---------- pilihan mula dalam wizard ---------- */
function startPickHTML(d) {
  var s = d.start === 'jr' ? 'jr' : 'f1';
  return '<div class="card stack"><h3>Where does your career begin?</h3><div class="seg" style="grid-template-columns:repeat(2,1fr)"><button class="' + (s === 'f1' ? 'on' : '') + '" data-act="w8-start" data-v="f1">Formula 1</button><button class="' + (s === 'jr' ? 'on' : '') + '" data-act="w8-start" data-v="jr">Junior Series</button></div>' +
    '<p class="dim" style="margin:0">' + (s === 'jr' ? 'Start in the ' + JR_NAME + ' with a smaller car and young rivals. Impress over up to ' + JR_MAX + ' seasons and Formula 1 teams will make offers. The better you finish, the better the team.' : 'Start straight in Formula 1 with one of the three smallest teams.') + '</p></div>';
}
var w8Team0 = w8Team;
w8Team = function (d) { return startPickHTML(d) + w8Team0(d); };
A['w8-start'] = function (d) { draft().start = d.v; render(); };

/* ---------- bina dunia junior ---------- */
function jrTeamName(n) { return n.replace(/ (Motorsport|Racing|F1 Team)$/, '') + ' Junior'; }
function jrCar(v) { return Math.round((62 + (v - 62) * 0.3) * 10) / 10; }
function jrBuild(S) {
  if (S.mode === 'pro') { worldEnterJunior(S); return; }
  var p = S.drivers[S.pi], home = p.team, used = {};
  S.jr = { on: true, yr: 1, home: home };
  S.teams.forEach(function (t) {
    t.name = jrTeamName(t.name);
    ['aero', 'engine', 'chassis', 'rel'].forEach(function (k) { t.car[k] = jrCar(t.car[k]); t.base[k] = jrCar(t.base[k]); });
  });
  S.drivers.forEach(function (d) { if (d.id === S.pi) used[d.code] = 1; });
  var pool = (S.juniors || []).slice();
  while (pool.length < 19) pool.push(newJunior(S, 17 + Math.floor(rnd() * 5)));
  pool = shuffle(pool).slice(0, 19);
  var nums = shuffle([2, 3, 5, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38].filter(function (n) { return n !== p.num; }));
  var slots = []; S.teams.forEach(function (t) { slots.push(t.id); if (t.id !== home) slots.push(t.id); });
  var ai = pool.map(function (j, i) {
    var d = { id: i, name: j.name, nat: j.nat, age: j.age, pace: j.pace, cons: j.cons, race: j.race, wet: j.wet, tyre: j.tyre, fb: j.fb, team: slots[i], num: nums.pop(), pot: j.pot, pk: j.pk, ty: j.ty, bio: (DTYPES[j.ty] && DTYPES[j.ty].bio) || 'Young talent.', code: mkCode(j.name, used), pts: 0, wins: 0, pods: 0, poles: 0, starts: 0, dnf: 0, fl: 0 };
    return d;
  });
  S.drivers = ai.concat([p]);
  S.reserves = []; S.juniors = null; S.retired = [];
  p.id = S.pi = ai.length;
  S.drivers.forEach(function (d) { d.con = null; d.cs = null; d.sh = null; d.rh = null; d.pa = null; });
  drvInit(S);
  S.contract = 1; p.con = { len: 1, end: S.season, pay: 0.5 };
  if (S.mode === 'pro') { S.league = 'f2'; S.cal = seasonCalendar(S); }
  S.rival = null; S.news = []; S.rr = [];
  pushNews(S, { k: 'season', s: 1, r: 0 });
  return S;
}
var ng0 = A['new-go'];
A['new-go'] = function () {
  var jr = draft().start === 'jr';
  ng0();
  if (jr) { try { jrBuild(S); S.settings.style = S.settings.style; save(); render(); } catch (e) { toast('Could not start the Junior Series: ' + e.message); } }
};

/* ---------- tawaran naik ke F1 pada hujung musim ---------- */
function jrOffers(S) {
  var p = S.drivers[S.pi], last = S.hist[S.hist.length - 1], pos = last ? last.pos : 10, o = ovr(p), yr = S.jr.yr;
  var bonus = pos === 1 ? 8 : pos <= 3 ? 4 : pos <= 5 ? 2 : pos <= 10 ? 0 : -3;
  var score = o + bonus + (yr - 1) * 1.5, ranks = TEAMS.slice().sort(function (a, b) { return (b.car.aero + b.car.engine + b.car.chassis + b.car.rel) - (a.car.aero + a.car.engine + a.car.chassis + a.car.rel); }), out = [];
  ranks.forEach(function (t, i) {
    var need = 94 - i * 2.3 - (t.id === S.jr.home ? 3 : 0);       /* rank 1 mahu ~94, rank 10 mahu ~73 */
    if (score >= need) out.push({ team: t.id, years: 2, pay: payFor(o, 0.35), wb: 0, opt: false, renew: false, f1: true });
  });
  if (!out.length && yr >= JR_MAX) { var w = ranks[ranks.length - 1]; out.push({ team: w.id, years: 1, pay: payFor(o, 0.3), wb: 0, opt: false, renew: false, f1: true, last: true }); }
  out = out.slice(0, 4);                                               /* sehingga 4 tawaran terbaik yang masih munasabah */
  if (yr < JR_MAX) out.push({ team: p.team, years: 1, pay: 0.5, wb: 0, opt: false, renew: true, stay: true });
  return out;
}
var endSeason0 = endSeason;
endSeason = function (S) {
  var r = endSeason0(S);
  if (S.jr && S.jr.on) { S.offers = S.mode === 'pro' && careerRetirementDue(S) ? [] : jrOffers(S); S.fired = null; }
  return r;
};

/* ---------- naik ke F1: bina dunia F1 dan pindahkan pemandu ---------- */
function jrPromote(d) {
  if (S.mode === 'pro') { worldPromotePlayer(S, +d.t, +d.y, +d.p); return; }
  if (S.mode === 'pro') {
    if (S.playerRetired || S.round < seasonRounds(S)) return false;
    if (applyAnnualChange(S).retire) { save(); UI.screen = 'retire'; render(); return false; }
  }
  var o = S, p0 = o.drivers[o.pi], teamId = +d.t, yrs = +d.y, pay = +d.p;
  if (o.mode === 'pro') yrs = Math.min(yrs, AGEING.retireAt - p0.age);
  var F = newCareer(p0.name, o.arch, teamId, { mode: o.mode, nextPersonId: o.meta && o.meta.nextPersonId }), p = F.drivers[F.pi];
  ['nat', 'age', 'helm', 'pace', 'cons', 'race', 'wet', 'tyre', 'fb', 'pot', 'pk'].forEach(function (k) { if (p0[k] != null) p[k] = p0[k]; });
  if (p0.abilities) p.abilities = JSON.parse(JSON.stringify(p0.abilities));
  if (p0.evaluation) { p.evaluation = JSON.parse(JSON.stringify(p0.evaluation)); p.evaluation.tier = 0; p.evaluation.weakSeasons = 0; p.evaluation.capture = null; p.evaluation.review = null; }
  if (p0.training) p.training = JSON.parse(JSON.stringify(p0.training));
  if (p0.mind) p.mind = JSON.parse(JSON.stringify(p0.mind));
  if (p0.body) p.body = JSON.parse(JSON.stringify(p0.body));
  if (p0.growthCaps) p.growthCaps = Object.assign({}, p0.growthCaps);
  if (p0.capBreakers) p.capBreakers = Object.assign({}, p0.capBreakers);
  var taken = {}; F.drivers.forEach(function (x) { if (x !== p) taken[x.num] = 1; }); (F.reserves || []).forEach(function (x) { taken[x.num] = 1; });
  p.num = !taken[p0.num] ? p0.num : (shuffle([7, 8, 9, 11, 12, 14, 15, 16, 18, 19, 20, 21].filter(function (n) { return !taken[n]; }))[0] || 99);
  p.bio = 'Graduate of the ' + JR_NAME + '.'; p.cs = null; drvInit(F);
  F.season = o.season + 1; F.xp = o.xp; F.morale = o.morale; F.fame = o.fame; F.settings = o.settings; F.tips = o.tips; F.tut = o.tut; F.errs = o.errs; F.arch = o.arch;
  F.career = o.career; F.hist = o.hist.map(function (r) { return Object.assign({}, r, { jr: true }); }); F.rr = o.rr || [];
  delete F.people[p.uid];
  var archive = JSON.parse(JSON.stringify(o.people || {}));
  Object.keys(archive).forEach(function (uid) { if (archive[uid].role === 'active') archive[uid].role = 'archived'; });
  p.uid = p0.uid; F.people = Object.assign(archive, F.people);
  F.news = []; F.contract = yrs; p.con = { len: yrs, end: F.season + yrs - 1, pay: pay };
  var from = o.drivers[o.pi].name;
  S = F; save(); UI.screen = 'hub'; UI.tab = 'utama'; render();
  pushNews(S, { k: 'psign', n: from, t: teamId, f: teamId, y: yrs, mv: true, s: S.season, r: 0 });
  ceremonyModal(S.teams[teamId], from, true, false, yrs, pay, S.season);
  snd('sign');
}
var sign1 = A['sign'];
A['sign'] = function (d) { if (+d.f1 === 1) { jrPromote(d); return; } return sign1(d); };

/* hitung tahun junior bila kekal */
var sns0 = startNewSeason;
startNewSeason = function (S, a, b, c, d) { var r = sns0(S, a, b, c, d); if (r !== false && S.jr && S.jr.on) S.jr.yr++; return r; };
