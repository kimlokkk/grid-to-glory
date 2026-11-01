/* ===== Fasa E3b: tahun simpanan. Pemain ambil setahun sebagai pemandu ujian/simpanan; pemandu ganti memandu tempat race;
   pemain berlatih, reputasi pulih, dan tawaran baru datang di hujung tahun. Enjin race tak berubah: slot pemain diisi pemandu ganti. ===== */
var SIT = { rounds: 10, pay: 0.6 };
var SITF = { pace: 'Pace', race: 'Racecraft', cons: 'Consistency', tyre: 'Tyres', wet: 'Wet weather' };
/* tawaran tahun simpanan: team dengan seat yang boleh terima pemain dan paling berprestij */
function sitOffer(S, offers) {
  var best = null;
  offers.forEach(function (o) { if (o.buy || o.last) return; if (!best || S.teams[o.team].prestige > S.teams[best.team].prestige) best = o; });
  if (!best) { var lo = offers.filter(function (o) { return !o.buy; })[0]; if (!lo) return null; best = lo; }
  return { team: best.team, years: 1, renew: false, sit: true, pay: SIT.pay, wb: 0, opt: false };
}
function sitStart(S, teamId) {
  var p = S.drivers[S.pi], j = newJunior(S, 20), sd;
  sd = juniorToDriver(S, j, S.pi, teamId); sd.stand = true; sd.con = conMake(S, sd, { len: 1, from: S.season + 1 });
  p.age++; p.team = teamId;
  S.bench = p; S.sit = { s: S.season + 1, team: teamId, focus: 'pace', ff: 0 };
  S.drivers[S.pi] = sd;
}
function sitRace(S) {
  var ci = S.cal[S.round], R = runRace2(S, ci, qualiGrid2(S, ci), {}), fl = null;
  R.cars.forEach(function (f) { if (!f.dnf && f.best < 900 && (!fl || f.best < fl.best)) fl = f; });
  R.fl = { di: fl ? fl.di : -1, t: 0 };
  finishRace(S, { ci: R.ci, c: R.c, fl: R.fl, cls: R.cls.map(function (f) { return { car: { d: f.d, di: f.di, isP: f.isP, grid: f.grid, dnf: f.dnf }, pos: f.pos, dnf: !!f.dnf }; }) }, 0);
}
/* hujung tahun: rekod semua pemandu, pulangkan pemain, beri ganjaran latihan, kira tawaran */
function endSit(S) {
  var ds = driverStandings(S), ts = teamStandings(S), sd = S.drivers[S.pi], p = S.bench, st = S.sit;
  if (typeof drvRecord === 'function') drvRecord(S);
  var tm = S.teams[st.team];
  sd.exTeam = st.team; sd.team = -1; sd.id = -1; sd.con = null; sd.rs = 0; sd.stand = false; sd.pts = 0; sd.wins = 0; sd.pods = 0; sd.obj = null;
  S.reserves = S.reserves || []; S.reserves.push(sd);
  p.id = S.pi; p.team = st.team; p.pts = 0; p.wins = 0; p.pods = 0; p.miss = 0; p.obj = null;
  S.drivers[S.pi] = p; S.bench = null; S.sit = null;
  /* latihan: fokus +3, dua kemahiran lain +1 */
  var gain = {}, others = shuffle(Object.keys(SITF).filter(function (k) { return k !== st.focus; })).slice(0, 2);
  [[st.focus, 3], [others[0], 1], [others[1], 1]].forEach(function (x) { var b = p[x[0]]; p[x[0]] = clamp(p[x[0]] + x[1], 45, 99); gain[x[0]] = p[x[0]] - b; });
  S.xp += 40; S.fame = clamp(fameOf(S) + 3, 0, 100); S.morale = Math.max(S.morale == null ? 50 : S.morale, 60);
  /* tahun jauh dari sorotan memulihkan nama: dendam separuh, rekod pecat dihapus, team tempat berkhidmat kenal kau */
  var r = repInit(S); r.fires = []; Object.keys(r.rel).forEach(function (k) { if (r.rel[k] < 0) r.rel[k] *= 0.5; }); r.rel[st.team] = clamp((r.rel[st.team] || 0) + 3, -10, 10);
  S.tm = null;
  S.lastSummary = { rec: { season: S.season, pos: 0, pts: 0, wins: 0, pods: 0, team: tm.short, tcol: tm.color, champ: ds[0].name, champTeam: ts[0].name, age: p.age, reserve: true, gain: gain, focus: st.focus },
    ds: ds.map(function (d) { return d.id; }), ts: ts.map(function (t) { return t.id; }), obj: null, opt: null, spon: null, warn: false };
  S.lastSummary.test = typeof testRun === 'function' ? testRun(S) : null;
  S.offers = null; S.fired = null; S.paddock = null;
  S.offers = makeOffers(S, 12, { renew: true, terminate: false }, true);
  return S.lastSummary.rec;
}
/* ---- skrin tahun simpanan ---- */
function vSit() {
  var st = S.sit, t = S.teams[st.team], p = S.bench, sd = S.drivers[S.pi], ds = driverStandings(S);
  var h = '<div class="top"><div class="brand">Apex <b>Career</b></div><div class="meta"><span>Season ' + S.season + ' · Round ' + Math.min(S.round + 1, 10) + '/10</span><button class="btn sm" data-act="menu">Menu</button></div></div><div class="stack">';
  h += '<div class="card stack"><div class="row sp"><h3>Reserve year</h3><span class="mono dim">' + tagT(t) + '</span></div><h2>' + esc(p.name) + '</h2>' +
    '<p class="dim" style="margin:0">You are the test and reserve driver at ' + esc(t.name) + '. <b>' + esc(sd.name) + '</b> is racing your seat this year. You work in the simulator, learn from the engineers and let the dust settle.</p>' +
    '<div class="fame"><i style="width:' + Math.round(S.round / 10 * 100) + '%"></i></div></div>';
  h += '<div class="card stack"><h3>Training focus</h3><p class="dim" style="margin:0">Your main skill gains +3 at the end of the year, two others gain +1. You also earn 40 XP and your reputation recovers.</p><div class="row" style="flex-wrap:wrap;gap:6px">' +
    Object.keys(SITF).map(function (k) { return '<button class="btn sm ' + (st.focus === k ? 'pri' : '') + '" data-act="sit-focus" data-k="' + k + '">' + SITF[k] + ' ' + p[k] + '</button>'; }).join('') + '</div></div>';
  h += '<div class="card"><h3 style="margin-bottom:8px">Drivers · top 6</h3><table class="t"><tbody>' + ds.slice(0, 6).map(function (d, i) { return '<tr><td class="mono dim" style="width:28px">' + (i + 1) + '</td><td>' + tagD(d) + ' ' + esc(d.name) + '</td><td class="r mono">' + d.pts + '</td></tr>'; }).join('') + '</tbody></table></div>';
  h += (typeof newsCard === 'function' ? newsCard('', 4) : '');
  if (S.round < 10) h += '<button class="btn pri wide" data-act="sit-next">Next race</button><button class="btn wide" data-act="sit-ff">Skip to end of season</button>';
  else h += '<button class="btn pri wide" data-act="season-end">See what happens next</button>';
  return h + '</div>';
}
if (typeof A !== 'undefined') {
  A['sit-focus'] = function (d) { if (S.sit) { S.sit.focus = d.k; save(); render(); } };
  A['sit-next'] = function () { if (S.sit && S.round < 10) { sitRace(S); save(); render(); } };
  A['sit-ff'] = function () { if (S.sit) { while (S.round < 10) sitRace(S); save(); render(); } };
}
