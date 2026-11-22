'use strict';
/* ===== Story pack: one block of plain text with the season so far (cars, teams, staff, drivers, news,
   full qualifying and race results, race logs). Copy it into a chat and a story can be written without screenshots. =====
   Extra per-race data (qualifying times, tyres, race log, key radio) is recorded in the existing S.rr entry when a race is
   committed and kept for the current and previous season only, so saves stay small. */
var SP = { scope: 'latest', keep: 2, last: 5 };

function spPct(v, lo, hi) { return clamp(Math.round((v - lo) / (hi - lo) * 100), 0, 100); }
function spN(v, d) { return Number.isFinite(v) ? v.toFixed(d == null ? 0 : d) : '-'; }
function spM(v) { return Number.isFinite(v) ? '$' + Math.round(v) + 'M' : '-'; }
function spSafe(name, fn) { try { return fn(); } catch (e) { return '(' + name + ' unavailable)'; } }
function spLead(S) { return leagueOf(S).toUpperCase(); }
function spDriverByName(S, name) { var f = null; S.drivers.forEach(function (d) { if (d.name === name) f = d; }); return f; }
function spCode(S, name) { var d = spDriverByName(S, name); return d ? d.code : String(name || '?').replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase(); }
function spTeamLine(S, idx) { var t = S.teams[idx]; return t ? t.name : '?'; }

var SP_EN = { pelan: 'planned', tayar: 'tyres', agresif: 'aggressive', skil: 'skill', sc: 'safety car', 'kitaran-pit': 'pit cycle', cuaca: 'weather', 'sc+cuaca': 'safety car + weather', peluang: 'chance', kesilapan: 'error', sentuhan: 'contact', kering: 'dry', basah: 'damp', hujan: 'rain', 'SC tamat': 'SC ended', 'VSC tamat': 'VSC ended', start: 'start', pace: 'pace', drs: 'DRS', attack: 'attack', undercut: 'undercut' };
function spEn(t) { return String(t == null ? '' : t).replace(/[A-Za-z+\-]+( tamat)?/g, function (w) { return SP_EN[w] != null ? SP_EN[w] : w; }); }

/* ---------- recording (called from commitRace) ---------- */
function storyRecord(S, wk) {
  var rec = S.rr && S.rr[S.rr.length - 1], R = wk && wk.R; if (!rec || !R || rec.s !== S.season || !wk.old) return;
  var code = function (di) { var d = S.drivers[di]; return d ? d.code : '?'; };
  var pits = {}; (R.log || []).forEach(function (e) { if (e.k === 'pit' && e.b != null) (pits[e.b] = pits[e.b] || []).push([e.lap || 0, e.comp || '', e.loss != null ? +e.loss.toFixed(1) : 0]); });
  rec.x = wk.old.cls.map(function (x) { var di = x.car.di, fin = x.car.comp || ''; return [fin, x.car.stops || 0, +(x.gap || 0).toFixed(1), x.dnf ? (typeof x.car.dnf === 'string' ? x.car.dnf : 'DNF') : '', x.car.c0 || fin, pits[di] || []]; });
  if (wk.qr && wk.qr.length) rec.qs = wk.qr.map(function (rows) { return rows.map(function (r) { return [code(r[0]), +r[1].toFixed(3)]; }); });
  rec.q = (wk.q || []).map(function (r) { return [code(r.di), S.drivers[r.di] ? S.drivers[r.di].team : -1, +(r.lap || 0).toFixed(3), r.sess]; });
  rec.m = { w: R.w ? R.w.type : '', sc: R.nSC || 0, vsc: R.nVSC || 0, ot: R.nClean || 0, flt: R.fl && R.fl.t ? +R.fl.t.toFixed(3) : 0, L: R.L };
  var keep = { pass: 1, contact: 1, spin: 1, dnf: 1, pit: 1, sc: 1, vsc: 1, restart: 1, wx: 1 };
  rec.lg = (R.log || []).filter(function (e) { return keep[e.k]; }).map(function (e) {
    var info = e.k === 'pit' ? 'for ' + (COMP[e.comp] ? COMP[e.comp].n : (e.comp || '?')) + ' tyres' + (e.loss != null ? ', ' + e.loss.toFixed(1) + 's lost' : '') + (e.tags && e.tags[1] ? ' (' + e.tags[1] + ')' : '') : e.k === 'pass' ? [e.zone].concat((e.tags || []).filter(function (t) { return t !== 'peluang'; })).join(', ') : (e.tags || []).join(', ');
    return [e.lap || 0, e.k, e.b != null ? code(e.b) : '', e.a != null ? code(e.a) : '', info];
  });
  rec.rd = (R.radio || []).filter(function (r) { return r.imp; }).slice(-60).map(function (r) { return [r.lap, r.t]; });
  S.rr.forEach(function (r) { if (r.s < S.season - (SP.keep - 1)) { delete r.q; delete r.qs; delete r.lg; delete r.rd; } });
}

/* ---------- text sections ---------- */
function spTyres(ex) {
  var nm = function (k) { return COMP[k] ? COMP[k].n : (k || '?'); }, pits = ex[5];
  if (!pits) return nm(ex[0]) + ' finish tyre, ' + ex[1] + ' stop' + (ex[1] === 1 ? '' : 's');
  var s = 'tyres: started ' + nm(ex[4]);
  pits.forEach(function (p) { s += ' > L' + p[0] + ' ' + nm(p[1]) + (p[2] ? ' (' + p[2].toFixed(1) + 's)' : ''); });
  return s + (pits.length ? (ex[3] ? ', retired on ' : ', finished ') + nm(ex[0]) : ' (no stop)') + ' · ' + ex[1] + ' stop' + (ex[1] === 1 ? '' : 's');
}
function spPlayer(S) {
  var p = S.drivers[S.pi], t = S.teams[p.team], L = [], con = typeof conOf === 'function' ? conOf(S, p) : null;
  var mate = typeof mateOf === 'function' ? mateOf(S, p) : null, role = typeof roleOf === 'function' ? roleOf(S, p) : '';
  L.push('Name: ' + p.name + ' (' + p.code + ') #' + p.num + ' · ' + (p.nat || '') + ' · age ' + p.age + ' · ' + spLead(S) + ' · team ' + t.name);
  L.push('Role: ' + ((typeof ROLEN !== 'undefined' && ROLEN[role]) || role) + (con ? ' · contract until season ' + con.end + ', pay $' + spN(con.pay, 1) + 'M' : ''));
  L.push('Overall ' + ovr(p) + ' · pace ' + p.pace + ' · consistency ' + p.cons + ' · racecraft ' + p.race + ' · wet ' + p.wet + ' · tyres ' + p.tyre + ' · feedback ' + p.fb + (typeof DTYPES !== 'undefined' && typeof typeOf === 'function' ? ' · archetype ' + DTYPES[typeOf(p)].n : ''));
  if (p.abilities && p.abilities.owned) L.push('Abilities: ' + p.abilities.owned.map(function (k) { return ABILITIES[k] ? ABILITIES[k].n + ' (' + ABILITIES[k].d + ')' : k; }).join('; '));
  if (p.evaluation) {
    var ev = typeof evaluationSummary === 'function' ? evaluationSummary(S) : null;
    L.push('Tier: ' + EVALUATION.tiers[p.evaluation.tier] + (ev && ev.sts != null ? ' · season STS ' + ev.sts.toFixed(1) + '/100 · head-to-head ' + ev.h2hWins + '/' + ev.h2hRaces : ''));
  }
  L.push('Career (incl. this season): titles ' + ((p.cs && p.cs.titles) || 0) + ', wins ' + (((p.cs && p.cs.wins) || 0) + (p.wins || 0)) + ', podiums ' + (((p.cs && p.cs.pods) || 0) + (p.pods || 0)));
  L.push('This season: ' + p.pts + ' pts, ' + p.wins + ' wins, ' + p.pods + ' podiums, ' + (S.results || []).filter(function (r) { return r.dnf; }).length + ' DNFs' + (S.round ? '' : ' (no races yet)'));
  if (mate) L.push('Teammate: ' + mate.name + ' (OVR ' + ovr(mate) + ', ' + mate.pts + ' pts)' + (S.tm ? ' · relationship ' + tmLabel(S.tm.rel) + ' (' + spN(S.tm.rel, 1) + '), team orders obeyed ' + S.tm.yes + ', refused ' + S.tm.no : ''));
  return L.join('\n');
}
function spStandings(S) {
  var L = ['DRIVERS' + (S.round ? '' : ' (no races yet: order is arbitrary)')];
  driverStandings(S).forEach(function (d, i) { L.push((i + 1) + '. ' + d.code + ' ' + d.name + ' (' + spTeamLine(S, d.team) + ') ' + d.pts + ' pts, ' + d.wins + ' wins, ' + d.pods + ' podiums'); });
  L.push('', 'CONSTRUCTORS');
  teamStandings(S).forEach(function (t, i) { L.push((i + 1) + '. ' + t.name + ' ' + t.pts + ' pts, ' + t.wins + ' wins'); });
  return L.join('\n');
}
function spRank(teams, key) { var r = {}; teams.slice().sort(function (a, b) { return b.car[key] - a.car[key]; }).forEach(function (t, i) { r[t.id] = i + 1; }); return r; }
function spTeams(S) {
  var ranks = { aero: spRank(S.teams, 'aero'), engine: spRank(S.teams, 'engine'), chassis: spRank(S.teams, 'chassis'), rel: spRank(S.teams, 'rel') }, pr = powerRank(S), me0 = S.drivers[S.pi].team, L = [];
  teamStandings(S).forEach(function (t, i) {
    var c = t.car, d = t.dev || {}, f = t.fin, tp = d.tp, ch = typeof TEAM_CHARS !== 'undefined' && t.char && TEAM_CHARS[t.char] ? TEAM_CHARS[t.char].name : '';
    L.push((t.id === me0 ? '[PLAYER TEAM] ' : '') + t.name + ' (' + t.short + ')' + (S.round ? ' · constructors P' + (i + 1) : ' · no races yet') + ' · car power rank #' + pr[t.id] + ' (avg ' + teamPower(t).toFixed(1) + ')');
    L.push('  Car: aero ' + Math.round(c.aero) + ' (#' + ranks.aero[t.id] + '), engine ' + Math.round(c.engine) + ' (#' + ranks.engine[t.id] + '), chassis ' + Math.round(c.chassis) + ' (#' + ranks.chassis[t.id] + '), reliability ' + Math.round(c.rel) + ' (#' + ranks.rel[t.id] + ')');
    if (typeof engLabel === 'function') L.push('  Engine deal: ' + engLabel(S, t) + (t.fac ? ' · facilities ' + facName(t) + ' (R&D ' + (facMul(t) >= 1 ? '+' : '') + Math.round((facMul(t) - 1) * 100) + '%)' : ''));
    if (f) L.push('  Money: revenue ' + spM(f.rev) + ', payroll ' + spM(f.pay) + ', R&D fund ' + spM(f.fund) + ', cash ' + spM(f.cash) + (f.loan > 0.5 ? ', loan ' + spM(f.loan) : '') + ' · ' + finStatus(t).txt);
    if (tp) L.push('  Team principal: ' + tp.name + (tp.age ? ' (' + tp.age + ')' : '') + ' · ' + (tp.amb >= 2 ? 'Aggressive' : tp.amb <= 0 ? 'Cautious' : 'Balanced') + ' · rating ' + spPct(tp.skill, 0.75, 1.25));
    if (d.tdp) L.push('  Technical director: ' + d.tdp.name + ' · rating ' + spPct(d.td, 0.9, 1.1));
    if (d.staff != null) L.push('  Technical staff ' + spPct(d.staff, 0.8, 1.2) + '/100 · board target P' + (d.target || '?') + (ch ? ' · team trait: ' + ch : ''));
    L.push('  Drivers: ' + S.drivers.filter(function (x) { return x.team === t.id; }).map(function (x) { return x.name + ' (OVR ' + ovr(x) + ')'; }).join(', '));
  });
  return L.join('\n');
}
function spDrivers(S) {
  var L = [];
  driverStandings(S).forEach(function (d) {
    var con = typeof conOf === 'function' ? conOf(S, d) : null, cs = d.cs || {}, ab = d.abilities && d.abilities.owned ? ' · abilities: ' + d.abilities.owned.map(function (k) { return ABILITIES[k] ? ABILITIES[k].n : k; }).join(', ') : '';
    L.push(d.code + ' ' + d.name + ' #' + d.num + ' · ' + (d.nat || '') + ' · age ' + d.age + ' · ' + spTeamLine(S, d.team) + ' · OVR ' + ovr(d) + ' (pace ' + d.pace + ', cons ' + d.cons + ', race ' + d.race + ', wet ' + d.wet + ', tyre ' + d.tyre + ', fb ' + d.fb + ')' + (typeof DTYPES !== 'undefined' && typeof typeOf === 'function' ? ' · ' + DTYPES[typeOf(d)].n : '') + ab);
    L.push('   Career: ' + (cs.titles || 0) + ' titles, ' + ((cs.wins || 0) + d.wins) + ' wins, ' + ((cs.pods || 0) + d.pods) + ' podiums · this season ' + d.pts + ' pts, ' + d.wins + ' wins' + (con ? ' · contract to ' + con.end + ' ($' + spN(con.pay, 1) + 'M)' : ''));
  });
  return L.join('\n');
}
function spNews(S, minRound) {
  var items = (S.news || []).filter(function (n) { return n && n.s === S.season && n.r >= minRound && n.story; });
  items.sort(function (a, b) { return a.r - b.r || a.id - b.id; });
  if (!items.length) return '(no stories recorded)';
  return items.map(function (n) { var st = n.story; return 'R' + n.r + ' [' + st.kick + '] ' + st.head + (st.sub ? ' - ' + st.sub : ''); }).join('\n');
}
function spRaces(S, scope) {
  var lg = leagueOf(S), all = (S.rr || []).filter(function (r) { return r.s === S.season && r.league === lg; }).sort(function (a, b) { return a.r - b.r; });
  var pick = scope === 'season' ? all : scope === 'last' ? all.slice(-SP.last) : all.slice(-1);
  if (!pick.length) return { text: '(no races completed this season yet)', first: 0 };
  var out = [];
  pick.forEach(function (rec) {
    var m = rec.m || {}, c = CIRCUITS[rec.ci], L = [];
    L.push('### Round ' + (rec.r + 1) + ': ' + (c ? c.name : 'circuit ' + rec.ci) + ' (' + rec.laps + ' laps)' + (m.w ? ' · weather ' + spEn(m.w) : '') + (m.sc != null ? ' · safety cars ' + m.sc + ', VSC ' + m.vsc + ', clean overtakes ' + m.ot : ''));
    if (rec.fl) L.push('Fastest lap: ' + rec.fl + (m.flt ? ' ' + fmtT(m.flt) : ''));
    if (rec.qs && rec.qs.length) {
      var teamOf = {}; (rec.q || []).forEach(function (q) { teamOf[q[0]] = spTeamLine(S, q[1]); });
      var cuts = ['out in Q1', 'out in Q2', 'Q3 shoot-out'];
      rec.qs.forEach(function (rows, si) {
        if (!rows.length) return;
        L.push('Qualifying Q' + (si + 1) + ' (' + rows.length + ' cars' + (si < 2 && rows.length > (si ? 10 : 15) ? ', slowest ' + (rows.length - (si ? 10 : 15)) + ' eliminated' : '') + '):');
        rows.forEach(function (r, i) { L.push('  P' + (i + 1) + ' ' + r[0] + (teamOf[r[0]] ? ' (' + teamOf[r[0]] + ')' : '') + ' ' + (i === 0 ? fmtT(r[1]) : '+' + (r[1] - rows[0][1]).toFixed(3)) + (si < 2 && i >= (si ? 10 : 15) ? ' [' + cuts[si] + ']' : '')); });
      });
      if (rec.q && rec.q.length) L.push('Final grid: ' + rec.q.map(function (q, i) { return (i + 1) + ' ' + q[0]; }).join(', '));
    } else if (rec.q && rec.q.length) {
      L.push('Qualifying (final order only; Q1/Q2/Q3 times were not recorded for this race):'); var pole = rec.q[0][2];
      rec.q.forEach(function (q, i) { L.push('  P' + (i + 1) + ' ' + q[0] + ' (' + spTeamLine(S, q[1]) + ') ' + (i === 0 ? fmtT(q[2]) : '+' + (q[2] - pole).toFixed(3)) + (q[3] === 1 ? ' [out in Q2]' : q[3] === 0 ? ' [out in Q1]' : '')); });
    } else L.push('Qualifying: times not recorded for this race. Grid slots are in the result table.');
    L.push('Race result (full):');
    rec.c.forEach(function (x, i) {
      var ex = rec.x && rec.x[i];
      L.push('  ' + (x[2] ? 'P' + x[2] : 'DNF') + ' ' + spCode(S, x[0]) + ' ' + x[0] + ' (' + spTeamLine(S, x[1]) + ') · grid ' + x[4] + (ex ? ' · ' + (ex[3] ? ex[3] : (x[2] > 1 ? '+' + ex[2] + 's' : 'winner')) + ' · ' + spTyres(ex) : '') + (x[3] ? ' · ' + x[3] + ' pts' : '') + (x[5] ? ' · PLAYER' : ''));
    });
    if (rec.lg && rec.lg.length) {
      L.push('Race log:');
      rec.lg.slice().sort(function (x, y) { return x[0] - y[0]; }).forEach(function (e) {
        var k = e[1], t = k === 'pass' ? e[2] + ' passes ' + e[3] + (e[4] ? ' (' + e[4] + ')' : '') : k === 'contact' ? 'contact: ' + e[2] + ' (attacking) and ' + e[3] : k === 'spin' ? e[2] + ' spins' : k === 'dnf' ? e[2] + ' retires: ' + e[4] : k === 'pit' ? e[2] + ' pits ' + e[4] : k === 'sc' ? 'SAFETY CAR' : k === 'vsc' ? 'VIRTUAL SAFETY CAR' : k === 'restart' ? 'restart ' + e[4] : e[4] || k;
        L.push('  L' + e[0] + ' ' + spEn(t));
      });
    } else L.push('Race log: not recorded for this race.');
    if (rec.rd && rec.rd.length) { L.push('Player radio, key moments:'); rec.rd.forEach(function (r) { L.push('  L' + r[0] + ' ' + r[1]); }); }
    out.push(L.join('\n'));
  });
  return { text: out.join('\n\n'), first: pick[0].r + 1 };
}
function storyPackText(scope) {
  var races = spSafe('races', function () { return spRaces(S, scope); }), done = S.round, tot = seasonRounds(S);
  var head = ['GRID TO GLORY · STORY PACK', spLead(S) + ' Season ' + S.season + ' · ' + done + '/' + tot + ' rounds completed · scope: ' + (scope === 'season' ? 'whole season' : scope === 'last' ? 'last ' + SP.last + ' races' : 'latest race'), '',
    'HOW TO USE: Everything below is fact from the game. Write the story in English from it: keep names, numbers, results and continuity exact; invent only dialogue, personalities and small scene details, and say which parts are invented.', ''];
  var sec = function (t, body) { return '## ' + t + '\n' + body + '\n'; };
  return head.join('\n') + '\n' + sec('MY DRIVER', spSafe('player', function () { return spPlayer(S); })) + '\n' + sec('STANDINGS', spSafe('standings', function () { return spStandings(S); })) + '\n' +
    sec('TEAMS, CARS, STAFF', spSafe('teams', function () { return spTeams(S); })) + '\n' + sec('REGULATIONS', spSafe('regulations', function () { return typeof rgPackText === 'function' ? rgPackText(S) : ''; })) + '\n' + sec('DRIVERS', spSafe('drivers', function () { return spDrivers(S); })) + '\n' +
    sec('NEWS', spSafe('news', function () { return spNews(S, scope === 'season' ? 0 : races.first || 0); })) + '\n' + sec('RACES', races.text);
}

/* ---------- UI ---------- */
function spModalHTML() {
  var btn = function (v, l) { return '<button class="btn sm ' + (SP.scope === v ? 'on' : '') + '" data-act="sp-scope" data-v="' + v + '">' + l + '</button>'; };
  return '<h2>Story pack</h2><p class="dim">One block of text with the cars, teams, staff, drivers, news, full qualifying and race results and race logs. Copy it into a chat to get a story, no screenshots needed.</p>' +
    '<div class="row" style="gap:6px;flex-wrap:wrap">' + btn('latest', 'Latest race') + btn('last', 'Last ' + SP.last + ' races') + btn('season', 'Whole season') + '</div>' +
    '<textarea id="exp" readonly spellcheck="false" style="min-height:220px"></textarea><p class="dim" id="sp-size" style="margin:0;font-size:12px"></p>' +
    '<div class="row"><button class="btn pri" data-act="copy">Copy</button><button class="btn" data-act="sp-dl">Download .txt</button><button class="btn" data-act="mclose">Close</button></div>';
}
function spFill() {
  var ta = document.getElementById('exp'); if (!ta) return;
  var txt = spSafe('story pack', function () { return storyPackText(SP.scope); }); ta.value = txt;
  var sz = document.getElementById('sp-size'); if (sz) sz.textContent = txt.length.toLocaleString() + ' characters';
  document.querySelectorAll('#modal [data-act="sp-scope"]').forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-v') === SP.scope); });
}
if (typeof A !== 'undefined') {
  A['sp-open'] = function (d) { if (UI.screen === 'menu') { var sv = loadSave(); if (sv) S = migrate(sv); } if (!S || !S.drivers) return; if (d && d.v) SP.scope = d.v; showModal(spModalHTML()); spFill(); };
  A['sp-scope'] = function (d) { SP.scope = d.v; spFill(); };
  A['sp-dl'] = function () {
    var ta = document.getElementById('exp'); if (!ta) return;
    try {
      var a = document.createElement('a'), url = URL.createObjectURL(new Blob([ta.value], { type: 'text/plain;charset=utf-8' }));
      a.href = url; a.download = 'grid-to-glory-s' + S.season + '-r' + S.round + '-story-pack.txt'; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
    } catch (e) { toast('Could not start the download. Use Copy instead.'); }
  };
}
/* season review: add the button under the podium cards */
if (typeof svPodium === 'function') {
  var spOldPodium = svPodium;
  svPodium = function (sm) { return spOldPodium(sm) + '<section class="card sv-card"><button class="btn wide" data-act="sp-open" data-v="season">Copy story pack (whole season)</button></section>'; };
}
