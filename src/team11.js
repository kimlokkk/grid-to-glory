/* ===== Profil pasukan ===== */
function teamMeta(t) { var m = TEAMS[t.id]; return m && m.name === t.name ? m : null; }
function tpStyle(a) { return a >= 2 ? 'Bold' : a <= 0 ? 'Cautious' : 'Balanced'; }
function pct100(v, lo, hi) { return Math.round(clamp((v - lo) / (hi - lo) * 100, 0, 100)); }
function teamProfileHTML(id) {
  if (S.mode === 'pro' && S.teams[id] && S.teams[id].spec) return worldJuniorTeamHTML(S.teams[id]) + '<button class="btn wide" data-act="mclose">Close</button>';
  var t = S.teams[id]; if (!t) return '';
  if (typeof ensureDev === 'function') ensureDev(S);
  var m = teamMeta(t) || {}, ts = teamStandings(S), pos = ts.indexOf(t) + 1, rk = teamRank(S, t.id), dv = t.dev || {};
  var drivers = S.drivers.filter(function (d) { return d.team === t.id; }), res = (S.reserves || []).filter(function (d) { return d.team === -1 && d.exTeam === t.id; });
  var pods = 0; drivers.forEach(function (d) { pods += d.pods; });
  var titles = (m.titles || 0) + (t.sh || []).filter(function (r) { return r.pos === 1; }).length, wins = (m.wins0 || 0) + (t.sh || []).reduce(function (a, r) { return a + r.wins; }, 0) + t.wins;
  var parts = [['aero', 'Aero'], ['engine', 'Engine'], ['chassis', 'Chassis'], ['rel', 'Reliability']];
  var prk = {}; parts.forEach(function (p) { prk[p[0]] = S.teams.filter(function (x) { return x.car[p[0]] > t.car[p[0]]; }).length + 1; });
  var h = '<div class="pf tpf" style="--tc:' + t.color + '"><div class="pf-h tpf-h"><div class="pf-id"><small>' + (m.base ? esc(m.base) + ' · Est. ' + m.founded : t.short) + '</small><b>' + esc(t.name) + '</b><span>' + (typeof engLabel === 'function' ? esc(engLabel(S, t)) + ' power' : m.engine ? esc(m.engine) + ' power' : '') + '</span></div>' +
    '<div class="pf-ovr"><b>#' + rk + '</b><small>CAR</small></div></div>' +
    '<div class="tpf-car">' + carSVG(t, 420) + '</div>';
  if (m.blurb) h += '<p class="pf-bio">' + esc(m.blurb) + '</p>';
  h += '<h4>Car performance · ' + teamPower(t).toFixed(1) + '</h4><div class="pf-att">' + parts.map(function (p) { var v = Math.round(t.car[p[0]]); return '<div><span>' + p[1] + '</span><i><u style="width:' + clamp((v - 45) / 54 * 100, 0, 100) + '%"></u></i><b>' + v + '</b><em>#' + prk[p[0]] + '</em></div>'; }).join('') + '</div>';
  h += '<h4>Drivers</h4><div class="tpf-drv">' + drivers.map(function (d) { return '<button class="tpf-d" data-act="prof" data-v="d:' + d.id + '">' + helmetSVG(d, 46, false) + '<div><b>' + esc(d.name) + '</b><span>' + flagE(d.nat) + ' #' + d.num + ' · age ' + d.age + ' · until ' + conUntil(S, d) + (d.obj ? ' · ' + ROLEN[d.obj.role] : '') + '</span></div><em>' + ovr(d) + '<small>OVR</small></em></button>'; }).join('') + '</div>';
  h += '<h4>Season ' + S.season + '</h4>' + pfTiles([['Pos', 'P' + pos], ['Pts', t.pts], ['Wins', t.wins], ['Podiums', pods]]);
  if (dv.tp) {
    var st = typeof devStatus === 'function' ? devStatus(t) : null;
    h += '<h4>Leadership & factory</h4><div class="tpf-lead"><div><small>Team principal</small><b>' + esc(dv.tp.name) + '</b><span>Rating ' + pct100(dv.tp.skill, 0.75, 1.25) + ' · ' + tpStyle(dv.tp.amb) + '</span>' + (dv.tp.con ? '<span class="cn">Until S' + dv.tp.con.end + ' · ' + payTxt(dv.tp.con.pay) + '</span>' : '') + '</div>' + (dv.tdp ? '<div><small>Technical director</small><b>' + esc(dv.tdp.name) + '</b><span>Rating ' + pct100(dv.td, 0.9, 1.1) + ' · age ' + dv.tdp.age + '</span>' + (dv.tdp.con ? '<span class="cn">Until S' + dv.tdp.con.end + ' · ' + payTxt(dv.tdp.con.pay) + '</span>' : '') + '</div>' : '') + '<div><small>Technical staff</small><b>' + pct100(dv.staff, 0.8, 1.2) + '<span style="display:inline"> /100</span></b><span>' + (dv.staff >= 1.05 ? 'Top-class factory' : dv.staff >= 0.95 ? 'Solid' : 'Short on experience') + '</span></div>' +
      '<div><small>Board target</small><b>P' + dv.target + '</b><span>in the constructors’</span></div>' + (st ? '<div><small>Next upgrade</small><b>' + (st.banked ? 'Shelved' : (RDNAME[st.k] || 'New') + ' · ' + Math.min(100, Math.round(st.prog / st.th * 100)) + '%') + '</b><span>' + (st.banked ? 'Focus on next year' : 'In development') + '</span></div>' : '') + '</div>';
  }
  if (typeof teamPolicy === 'function') {
    var ac = (S.juniors || []).map(function (j, i) { return { j: j, i: i }; }).filter(function (x) { return x.j.acad === t.id; });
    h += '<h4>Driver policy</h4><p class="dim" style="margin:0 0 6px"><b>' + teamPolicy(t) + '.</b> ' + (t.plan && PLAN[t.plan] ? 'Current plan: <b>' + PLAN[t.plan].n + '</b>. ' + PLAN[t.plan].d + ' ' : '') + 'Scouting ' + (scoutQ(t) >= 0.66 ? 'sharp' : scoutQ(t) >= 0.33 ? 'average' : 'patchy') + '.</p>';
    if (ac.length) h += '<div class="tpf-drv">' + ac.map(function (x) { return '<button class="tpf-d" data-act="prof" data-v="j:' + x.i + '"><div><b>' + esc(x.j.name) + '</b><span>' + flagE(x.j.nat) + ' academy · age ' + x.j.age + '</span></div><em>' + ovr(x.j) + '<small>OVR</small></em></button>'; }).join('') + '</div>'; else h += '<p class="dim" style="font-size:12.5px">No juniors on the academy books right now.</p>';
  }
  if (typeof teamPayroll === 'function') { var pr = teamPayroll(S, t); h += '<h4>Contracts</h4>' + pfTiles([['Driver pay', payTxt(pr.dr)], ['Staff pay', payTxt(pr.st)], ['Expiring', pr.exp + ' of ' + pr.n]]); }
  if (typeof finHTML === 'function') h += finHTML(t);
  if (typeof facSectionHTML === 'function' && t.fin) h += facSectionHTML(t);
  h += '<h4>All-time record</h4>' + pfTiles([['Titles', titles], ['Wins', wins], ['Founded', m.founded || '–']]);
  if (t.sh && t.sh.length) h += '<h4>History</h4><table class="t pf-hist"><thead><tr><th>Season</th><th class="r">Pos</th><th class="r">Wins</th><th class="r">Podiums</th><th class="r">Pts</th></tr></thead><tbody>' + t.sh.slice().reverse().map(function (r) { return '<tr><td class="mono">S' + r.s + '</td><td class="r mono">' + (r.pos === 1 ? '<b class="pur">P1</b>' : 'P' + r.pos) + '</td><td class="r mono">' + r.wins + '</td><td class="r mono">' + r.pods + '</td><td class="r mono">' + r.pts + '</td></tr>'; }).join('') + '</tbody></table>';
  return h + '<button class="btn wide" data-act="mclose">Close</button></div>';
}
if (typeof A !== 'undefined') A['tprof'] = function (x) { showModal(teamProfileHTML(+x.v)); var m = document.querySelector('#modal .mbox'); if (m) m.classList.add('mbpf'); };
