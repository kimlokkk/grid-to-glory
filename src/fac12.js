/* ===== Fasa E4c: kemudahan, pakatan enjin, pinjaman team, ujian pemandu muda.
   - Kemudahan (terowong angin, simulator, kilang) 1-5: ikut pendapatan team, perlahan berubah; menambah kecekapan R&D. Pemain boleh melobi.
   - Pakatan enjin: team pelanggan berkongsi kemajuan enjin team kilang, dan boleh bertukar pembekal.
   - Pinjaman: dana negatif jadi pinjaman dibayar beransur, bukan satu hentakan.
   - Ujian pemandu muda: hujung musim, junior akademi dan pelatih naik atau jatuh. ===== */
var FAC = { mul0: 0.94, mulK: 0.015, move: 0.3, lobbyUp: 0.6, lobbyCost: 2, share: 0.5, shareLoss: 0.3, pull: 0.2, offset: 3, maxCust: 3, swP: 0.12, loanRep: 0.4, loanMin: 6 };
var SUPS = ['Brennhart', 'Valerio', 'Kaze', 'Lumière'];
var SUPW = { 'Brennhart': 0, 'Valerio': 2, 'Kaze': 7, 'Lumière': 6 };
var FACN = ['Basic', 'Modest', 'Modern', 'Advanced', 'Elite'];
function facInit(S) {
  S.teams.forEach(function (t) {
    if (!t.fac) t.fac = { lvl: clamp(1 + t.prestige * 0.36 + gauss() * 0.25, 1, 5), push: 0 };
    if (!t.eng) {
      var m = typeof TEAMS !== 'undefined' ? TEAMS[t.id] : null, s = (m && m.engine) || '', sup = SUPS.filter(function (x) { return s.indexOf(x) === 0; })[0] || SUPS[t.id % 4];
      t.eng = { sup: sup, works: s.indexOf('(works)') >= 0 || SUPW[sup] === t.id, since: S.season };
    }
  });
}
function facMul(t) { return t && t.fac ? FAC.mul0 + FAC.mulK * t.fac.lvl : 1; }
function facName(t) { return FACN[clamp(Math.round(t.fac.lvl) - 1, 0, 4)]; }
function engLabel(S, t) { return t.eng ? t.eng.sup + (t.eng.works ? ' (works)' : ' (customer)') : ((typeof TEAMS !== 'undefined' && TEAMS[t.id] && TEAMS[t.id].engine) || ''); }
function engWorks(S, sup) { return S.teams[SUPW[sup]]; }
/* team kilang membangunkan enjin: pelanggan dapat sebahagian */
function engShare(S, t, gain) {
  if (!t.eng || !t.eng.works) return;
  S.teams.forEach(function (c) { if (c.eng && !c.eng.works && c.eng.sup === t.eng.sup) c.car.engine = clamp(c.car.engine + gain * (gain > 0 ? FAC.share : FAC.shareLoss), 45, 99); });
}
/* dipanggil dari devWinter sebelum purata liga dikekalkan */
function e4Winter(S, log) {
  facInit(S);
  var mine = S.drivers[S.pi] ? S.drivers[S.pi].team : -1;
  /* kemudahan: sasaran ikut pendapatan, bergerak perlahan */
  var rk = S.teams.slice().sort(function (a, b) { return ((b.fin && b.fin.rev) || 0) - ((a.fin && a.fin.rev) || 0); }), pos = {};
  rk.forEach(function (t, i) { pos[t.id] = i; });
  S.teams.forEach(function (t) {
    var before = Math.round(t.fac.lvl), target = 1 + 4 * (1 - pos[t.id] / (S.teams.length - 1)) + (t.fac.push || 0);
    t.fac.lvl = clamp(t.fac.lvl + (target - t.fac.lvl) * FAC.move + gauss() * 0.12, 1, 5); t.fac.push = 0;
    if (t.id === mine && Math.round(t.fac.lvl) !== before && log) log.push({ fac: true, t: t.id, up: Math.round(t.fac.lvl) > before, lv: Math.round(t.fac.lvl) });
  });
  /* enjin: pelanggan tarik ke arah kilang; pembekal lemah ditinggalkan */
  var sr = SUPS.slice().sort(function (a, b) { return engWorks(S, b).car.engine - engWorks(S, a).car.engine; }), nc = {};
  S.teams.forEach(function (c) { if (!c.eng.works) nc[c.eng.sup] = (nc[c.eng.sup] || 0) + 1; });
  S.teams.forEach(function (c) {
    if (c.eng.works) return;
    var w = engWorks(S, c.eng.sup), mine2 = sr.indexOf(c.eng.sup);
    if (mine2 >= 2 && rnd() < FAC.swP * (c.dev && c.dev.tp && c.dev.tp.amb >= 2 ? 1.3 : 1)) {
      var better = sr.filter(function (s) { return sr.indexOf(s) < mine2 && (nc[s] || 0) < FAC.maxCust; })[0];
      if (better) { var old = c.eng.sup; nc[old]--; nc[better] = (nc[better] || 0) + 1; c.eng.sup = better; c.eng.since = S.season + 1; w = engWorks(S, better); c.car.engine = clamp(0.6 * c.car.engine + 0.4 * (w.car.engine - FAC.offset), 45, 99); if (log) log.push({ eng: true, t: c.id, f: old, to: better }); return; }
    }
    c.car.engine = clamp((1 - FAC.pull) * c.car.engine + FAC.pull * (w.car.engine - FAC.offset), 45, 99);
  });
}
/* pinjaman: dipanggil dari finSeason */
function facLoan(S, t, f, sh) {
  var ln = f.loan || 0, add = 0;
  if (sh > 3) { add = sh; ln += sh; sh = 0; if (typeof pushNews === 'function' && (t.id === (S.drivers[S.pi] || {}).team || add > 9)) pushNews(S, { k: 'loan', t: t.id, a: Math.round(add), s: S.season + 1, r: 0 }); }
  var rep = Math.min(ln, Math.max(FAC.loanMin, ln * FAC.loanRep)); ln -= rep;
  f.loan = ln; f.lrep = rep;
  return rep + sh;
}
/* ujian pemandu muda di hujung musim; pulang baris untuk team pemain */
function testRun(S) {
  if (S.mode === 'pro' && leagueOf(S) !== 'f1') return [];
  facInit(S);
  var out = [], mine = S.drivers[S.pi] ? S.drivers[S.pi].team : -1;
  S.teams.forEach(function (t) {
    var jr = (S.juniors || []).filter(function (j) { return j.acad === t.id; }).sort(function (a, b) { return b.pot - a.pot; }).slice(0, 2);
    if (!jr.length) return;
    var avg = 0, n = 0; S.drivers.forEach(function (d) { if (d.team === t.id) { avg += rating(d); n++; } }); avg = n ? avg / n : 70;
    jr.forEach(function (j) {
      var perf = (rating(j) - avg) / 6 + gauss() * 0.9 + (t.fac.lvl - 3) * 0.15, lab = perf > 0.7 ? 'impressed' : perf < -1.0 ? 'struggled' : 'solid', g = lab === 'impressed' ? 2 : lab === 'solid' ? 1 : 0, k = pick(ATTRS);
      if (g) j[k] = clamp(j[k] + g, 50, 90);
      if (lab === 'impressed') j.pot = clamp(j.pot + 1, 60, 99); else if (lab === 'struggled') j.pot = clamp(j.pot - 1, 60, 99);
      j.test = { s: S.season, l: lab };
      if (t.id === mine) out.push({ n: j.name, nat: j.nat, l: lab, k: k, g: g, o: ovr(j) });
      if (lab === 'impressed' && (t.id === mine || j.pot >= 86) && typeof pushNews === 'function') pushNews(S, { k: 'test', t: t.id, n: j.name, nat: j.nat, s: S.season, r: 11 });
    });
  });
  return out;
}
/* XP kecil setiap race kalau kemudahan team pemain maju (simulator) */
function facRace(S) {
  var p = S.drivers[S.pi], t = p && S.teams[p.team]; if (!t || !t.fac) return;
  if (t.fac.lvl >= 3.5) S.xp += S.mode === 'pro' ? progressionXP(S, 'facilities', PROGRESSION.bonuses.facilities / seasonRounds(S)) : 1;
}
/* ---- paparan ---- */
function facSectionHTML(t, mineView) {
  facInit(S);
  var f = t.fac, e = t.eng, w = engWorks(S, e.sup), fin = t.fin || {}, h = '<h4>Facilities & engine</h4>';
  h += pfTiles([['Facilities', facName(t)], ['R&D', (facMul(t) >= 1 ? '+' : '') + Math.round((facMul(t) - 1) * 100) + '%'], ['Engine', e.sup], ['Deal', e.works ? 'Works' : 'Customer']]);
  var rk = SUPS.slice().sort(function (a, b) { return engWorks(S, b).car.engine - engWorks(S, a).car.engine; }).indexOf(e.sup) + 1;
  h += '<p class="dim" style="margin:6px 0 0;font-size:12.5px">' + (e.works ? 'Builds its own power unit; ' + S.teams.filter(function (x) { return x.eng && !x.eng.works && x.eng.sup === e.sup; }).length + ' customer team(s) share the gains. ' : 'Buys ' + esc(e.sup) + ' power from ' + esc(w.name) + ' and shares its engine progress. ') + esc(e.sup) + ' ranks #' + rk + ' of 4 for engine strength.' + (fin.loan > 0.5 ? ' <b>Loan:</b> $' + Math.round(fin.loan) + 'M outstanding, $' + Math.round(fin.lrep || 0) + 'M repaid this winter.' : '') + '</p>';
  return h;
}
function facCardHTML(t) {
  if (!t || !t.fin) return '';
  facInit(S);
  var f = t.fac, used = S.facLobby === S.season, pct = Math.round((f.lvl - 1) / 4 * 100);
  var h = '<div class="card stack faccard"><div class="row sp"><h3>Facilities</h3><span class="mono dim">' + facName(t) + ' · R&amp;D ' + (facMul(t) >= 1 ? '+' : '') + Math.round((facMul(t) - 1) * 100) + '%</span></div>' +
    '<div class="fame"><i style="width:' + pct + '%"></i></div>' +
    '<p class="dim" style="font-size:12.5px;margin:0">Wind tunnel, simulator and factory. They grow with the team\'s income and make every upgrade package a bit better.' + (f.lvl >= 3.5 ? (S.mode === 'pro' ? ' Your team\'s simulator earns up to 6 XP per season.' : ' Your team\'s simulator earns you +1 XP every race.') : '') + '</p>' +
    '<p class="dim" style="font-size:12.5px;margin:0">Engine: <b>' + esc(engLabel(S, t)) + '</b>.' + (t.fin.loan > 0.5 ? ' Team loan: $' + Math.round(t.fin.loan) + 'M.' : '') + '</p>';
  h += used ? '<button class="btn sm" disabled>You already pushed the board this season</button>' : '<button class="btn sm" data-act="fac-lobby">Push the board for investment</button><p class="dim" style="font-size:12px;margin:0">Costs some goodwill with the team. Facilities get a nudge up next winter.</p>';
  return h + '</div>';
}
function facTestHTML(rows) {
  if (!rows || !rows.length) return '';
  return '<div class="card stack"><h3>Young driver test</h3><p class="dim" style="margin:0">The academy drivers got a day in the car at the end of the season.</p>' + rows.map(function (r) {
    return '<div class="row sp" style="flex-wrap:nowrap"><span>' + flagE(r.nat) + ' <b>' + esc(r.n) + '</b></span><span class="mono ' + (r.l === 'impressed' ? 'good' : r.l === 'struggled' ? 'bad' : 'dim') + '">' + r.l + (r.g ? ' · ' + ATTRN[r.k] + ' +' + r.g : '') + '</span></div>';
  }).join('') + '</div>';
}
if (typeof A !== 'undefined') {
  A['fac-lobby'] = function () {
    var p = S.drivers[S.pi], t = S.teams[p.team]; if (!t || S.facLobby === S.season) return;
    facInit(S); S.facLobby = S.season; t.fac.push = (t.fac.push || 0) + FAC.lobbyUp;
    var r = repInit(S); r.rel[t.id] = clamp((r.rel[t.id] || 0) - FAC.lobbyCost, -10, 10);
    save(); render();
  };
}
