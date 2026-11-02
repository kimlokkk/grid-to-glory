'use strict';
/* ===== Fasa 14: tab News, keputusan penuh, sejarah, pelayar profil ===== */

function rrTag(tid) { var t = S.teams[tid] || { color: '#888', short: '?' }; return '<span class="tag" style="--tc:' + t.color + '">' + t.short + '</span>'; }
function rrSeasons() {
  var seen = {}, out = [];
  (S.rr || []).forEach(function (e) { if (!seen[e.s]) { seen[e.s] = 1; out.push(e.s); } });
  if (!seen[S.season]) out.push(S.season);
  return out.sort(function (a, b) { return a - b; });
}
function rrOf(s) { return (S.rr || []).map(function (e, i) { return { e: e, i: i }; }).filter(function (x) { return x.e.s === s; }).sort(function (a, b) { return a.e.r - b.e.r; }); }
function rrMine(e) { for (var i = 0; i < e.c.length; i++) if (e.c[i][5]) return e.c[i]; return null; }
function rrPos(row) { return row[2] ? 'P' + row[2] : 'DNF'; }

/* ---------- Races: Calendar | Results | History ---------- */
function hKalX() {
  var m = UI.kalMode || 'cal';
  var h = '<div class="seg" style="margin-bottom:12px;max-width:420px;grid-template-columns:repeat(3,1fr)">' + [['cal', 'Calendar'], ['res', 'Results'], ['his', 'History']].map(function (x) { return '<button class="' + (m === x[0] ? 'on' : '') + '" data-act="kal-m" data-v="' + x[0] + '">' + x[1] + '</button>'; }).join('') + '</div>';
  return h + (m === 'res' ? hRes() : m === 'his' ? hHist() : hKal());
}
A['kal-m'] = function (d) { UI.kalMode = d.v; render(); };

function hRes() {
  var ss = rrSeasons(), cur = UI.rsS && ss.indexOf(UI.rsS) > -1 ? UI.rsS : S.season, L = rrOf(cur);
  var h = '<div class="card"><div class="row sp" style="margin-bottom:8px"><h3>Race results</h3><div class="row" style="gap:6px">' + ss.map(function (s) { return '<button class="btn sm ' + (s === cur ? 'on' : '') + '" data-act="rs-s" data-v="' + s + '">S' + s + '</button>'; }).join('') + '</div></div>';
  if (!L.length) return h + '<p class="dim" style="margin:0">' + (cur === S.season ? 'No races completed yet this season.' : 'Full results were not recorded for this season.') + ' Full results are saved from every race you finish from now on.</p></div>';
  h += '<div class="krows">' + L.map(function (x) {
    var e = x.e, c = CIRCUITS[e.ci], w = e.c[0], pole = null, me = rrMine(e);
    e.c.forEach(function (r) { if (r[4] === 1) pole = r; });
    return '<div class="krow big clk" data-act="rr-open" data-v="' + x.i + '"><span class="mono dim">R' + (e.r + 1) + '</span>' + flagSVG(e.ci, 30) + '<div style="min-width:0"><b>' + c.name + '</b><small class="dim">Winner ' + esc(w[0]) + ' ' + rrTag(w[1]) + (pole ? ' · Pole ' + esc(pole[0].split(' ').slice(-1)[0]) : '') + '</small></div><div class="r6">' + (me ? '<span class="pill6 ' + (me[2] && me[2] <= 3 ? 'pod' : me[2] && me[2] <= 10 ? 'pts' : me[2] ? '' : 'bad') + '">' + rrPos(me) + '</span>' : '') + '</div></div>';
  }).join('') + '</div><p class="dim" style="font-size:12.5px;margin:8px 2px 0">Tap a race for the full classification.</p></div>';
  return h;
}
A['rs-s'] = function (d) { UI.rsS = +d.v; render(); };
function rrHTML(i) {
  var e = (S.rr || [])[i]; if (!e) return '';
  var c = CIRCUITS[e.ci], pole = null; e.c.forEach(function (r) { if (r[4] === 1) pole = r; });
  var rows = e.c.map(function (r, k) {
    var gain = r[2] && r[4] ? r[4] - r[2] : null;
    return '<tr class="' + (r[5] ? 'me' : '') + '"><td class="mono dim">' + (r[2] || '–') + '</td><td>' + rrTag(r[1]) + ' ' + esc(r[0]) + '</td><td class="r mono dim">' + (r[4] || '–') + '</td><td class="r mono ' + (gain > 0 ? 'good' : gain < 0 ? 'bad' : 'dim') + '">' + (gain == null ? '' : gain > 0 ? '▲' + gain : gain < 0 ? '▼' + (-gain) : '–') + '</td><td class="r mono"><b>' + (r[3] || (r[2] ? '' : 'DNF')) + '</b></td></tr>';
  }).join('');
  return '<div class="stack"><div class="row sp"><div><h3 style="margin:0">' + c.name + '</h3><small class="dim">Season ' + e.s + ' · Round ' + (e.r + 1) + '</small></div>' + flagSVG(e.ci, 34) + '</div>' +
    '<div class="scroll" style="max-height:56vh;overflow-y:auto"><table class="t"><thead><tr><th>#</th><th>Driver</th><th class="r">Grid</th><th class="r">+/-</th><th class="r">Pts</th></tr></thead><tbody>' + rows + '</tbody></table></div>' +
    '<p class="dim" style="font-size:12.5px;margin:0">' + (pole ? 'Pole: ' + esc(pole[0]) + '. ' : '') + (e.fl ? 'Fastest lap: ' + esc(e.fl) + '.' : '') + '</p><button class="btn pri wide" data-act="mclose">Close</button></div>';
}
A['rr-open'] = function (d) { showModal(rrHTML(+d.v)); };

/* ---------- History ---------- */
function hRecords() {
  var w = {}, p = {}, st = {};
  (S.rr || []).forEach(function (e) { e.c.forEach(function (r) { var n = r[0]; if (r[2] === 1) w[n] = (w[n] || 0) + 1; if (r[2] && r[2] <= 3) p[n] = (p[n] || 0) + 1; }); });
  var top = function (o) { return Object.keys(o).map(function (k) { return [k, o[k]]; }).sort(function (a, b) { return b[1] - a[1]; }).slice(0, 5); };
  var tbl = function (t, L) { return '<div><h4 style="margin:0 0 4px">' + t + '</h4>' + (L.length ? L.map(function (x, i) { return '<div class="row sp" style="padding:3px 0;border-bottom:1px solid var(--line)"><span>' + (i + 1) + '. ' + esc(x[0]) + '</span><b class="mono">' + x[1] + '</b></div>'; }).join('') : '<p class="dim" style="margin:0">None yet.</p>') + '</div>'; };
  return '<div class="card"><h3 style="margin-bottom:8px">Records</h3><div class="recgrid">' + tbl('Most wins', top(w)) + tbl('Most podiums', top(p)) + '</div><p class="dim" style="font-size:12.5px;margin:8px 0 0">Counted from the races recorded since this feature was added.</p></div>';
}
function hHist() {
  var c = S.career, h = '<div class="card"><h3 style="margin-bottom:8px">Your career</h3><div class="pf-tiles">' + [['Starts', c.starts], ['Wins', c.wins], ['Podiums', c.pods], ['Poles', c.poles], ['Titles', c.titles], ['Points', c.pts]].map(function (x) { return '<div><small>' + x[0] + '</small><b>' + x[1] + '</b></div>'; }).join('') + '</div></div>';
  h += hRecords();
  h += '<div class="card"><h3 style="margin-bottom:8px">Season by season</h3>';
  if (!S.hist.length) h += '<p class="dim" style="margin:0">Your first season is still in progress. Completed seasons appear here.</p>';
  else {
    h += '<div class="scroll"><table class="t"><thead><tr><th>Season</th><th>Team</th><th class="r">Pos</th><th class="r">Pts</th><th class="r">Wins</th><th>Champion</th></tr></thead><tbody>' + S.hist.slice().reverse().map(function (r) {
      var has = (S.rr || []).some(function (e) { return e.s === r.season; });
      return '<tr class="' + (has ? 'clk' : '') + '"' + (has ? ' data-act="hs-open" data-v="' + r.season + '"' : '') + '><td class="mono">S' + r.season + '</td><td><span class="tag" style="--tc:' + r.tcol + '">' + r.team + '</span></td><td class="r mono">P' + r.pos + '</td><td class="r mono">' + r.pts + '</td><td class="r mono">' + (r.wins || 0) + '</td><td class="dim">' + esc(r.champ) + (r.champTeam ? '<br><small>' + esc(r.champTeam) + '</small>' : '') + '</td></tr>';
    }).join('') + '</tbody></table></div><p class="dim" style="font-size:12.5px;margin:8px 0 0">Tap a season with full results to see its final standings.</p>';
  }
  return h + '</div>';
}
function hsHTML(s) {
  var pts = {}, wins = {}, tm = {};
  rrOf(s).forEach(function (x) { x.e.c.forEach(function (r) { pts[r[0]] = (pts[r[0]] || 0) + r[3]; if (r[2] === 1) wins[r[0]] = (wins[r[0]] || 0) + 1; tm[r[0]] = r[1]; }); });
  var L = Object.keys(pts).sort(function (a, b) { return pts[b] - pts[a] || (wins[b] || 0) - (wins[a] || 0); }), me = S.drivers[S.pi].name;
  return '<div class="stack"><h3 style="margin:0">Season ' + s + ' standings</h3><div class="scroll" style="max-height:60vh;overflow-y:auto"><table class="t"><thead><tr><th>#</th><th>Driver</th><th class="r">Wins</th><th class="r">Pts</th></tr></thead><tbody>' + L.map(function (n, i) { return '<tr class="' + (n === me ? 'me' : '') + '"><td class="mono dim">' + (i + 1) + '</td><td>' + rrTag(tm[n]) + ' ' + esc(n) + '</td><td class="r mono">' + (wins[n] || 0) + '</td><td class="r mono"><b>' + pts[n] + '</b></td></tr>'; }).join('') + '</tbody></table></div><button class="btn pri wide" data-act="mclose">Close</button></div>';
}
A['hs-open'] = function (d) { showModal(hsHTML(+d.v)); };

/* ---------- Profiles browser (Standings › Profiles) ---------- */
function hProf() {
  var m = UI.pfM || 'd', h = '<div class="seg" style="margin-bottom:12px;max-width:300px;grid-template-columns:repeat(2,1fr)"><button class="' + (m === 'd' ? 'on' : '') + '" data-act="pf-m" data-v="d">Drivers</button><button class="' + (m === 't' ? 'on' : '') + '" data-act="pf-m" data-v="t">Teams</button></div>';
  if (m === 'd') {
    var L = S.drivers.slice().sort(function (a, b) { return ovr(b) - ovr(a); });
    h += '<div class="pfgrid">' + L.map(function (d) {
      var t = S.teams[d.team], k = d.id === S.pi;
      return '<button class="pfc ' + (k ? 'me' : '') + '" data-act="prof" data-v="d:' + d.id + '"><span class="pfh">' + helmetSVG(d, 46, false) + '</span><span class="pfn"><b>' + esc(d.name) + '</b><small>' + flagE(d.nat) + ' ' + esc(t.name) + ' · age ' + d.age + '</small></span><span class="pfo"><b>' + ovr(d) + '</b><small>OVR</small></span></button>';
    }).join('') + '</div>';
  } else {
    var T = S.teams.slice().sort(function (a, b) { return teamPower(b) - teamPower(a); }), ts = teamStandings(S);
    h += '<div class="pfgrid">' + T.map(function (t, i) {
      var mates = S.drivers.filter(function (d) { return d.team === t.id; });
      return '<button class="pfc ' + (t.id === S.drivers[S.pi].team ? 'me' : '') + '" data-act="tprof" data-v="' + t.id + '"><span class="pfh pfcar">' + carSVG(t, 70) + '</span><span class="pfn"><b>' + esc(t.name) + '</b><small>' + mates.map(function (d) { return esc(d.name.split(' ').slice(-1)[0]); }).join(' · ') + ' · P' + (ts.indexOf(t) + 1) + '</small></span><span class="pfo"><b>#' + (i + 1) + '</b><small>CAR</small></span></button>';
    }).join('') + '</div>';
  }
  return h;
}
A['pf-m'] = function (d) { UI.pfM = d.v; render(); };

/* ---------- News ---------- */
var NWCAT = { all: 'All', race: 'Races', trf: 'Transfers', oth: 'Other' };
function nwCat(st) { return st.kc === 'k-race' ? 'race' : st.kc === 'k-trf' ? 'trf' : 'oth'; }
function hNews() {
  var f = UI.nwF || 'all', L = newsList(S).map(function (n) { var st = null; try { st = newsStory(n); } catch (e) { } return st ? { n: n, st: st } : null; }).filter(Boolean);
  var h = '<div class="card nw"><div class="nw-bar"><span class="nw-brand">PADDOCK<b>WIRE</b></span><span class="nw-live"><i></i>' + L.length + ' STORIES</span></div>' +
    '<div class="row" style="gap:6px;padding:10px 12px 4px">' + Object.keys(NWCAT).map(function (k) { return '<button class="btn sm ' + (f === k ? 'on' : '') + '" data-act="nw-f" data-v="' + k + '">' + NWCAT[k] + '</button>'; }).join('') + '</div>';
  var V = L.filter(function (x) { return f === 'all' || nwCat(x.st) === f; });
  if (!V.length) return h + '<p class="dim" style="padding:12px">No stories here yet. They appear as the season unfolds.</p></div>';
  h += '<div class="nw-list nwfull">' + V.map(function (x) {
    return '<button class="nw-it nwb" data-act="nw-open" data-v="' + x.n.id + '" style="--tc:' + x.st.col + '"><span class="nw-k ' + x.st.kc + '">' + x.st.kick + '</span><b>' + esc(x.st.head) + '</b><p>' + esc(x.st.sub) + '</p><small>' + newsMeta(x.n) + '</small></button>';
  }).join('') + '</div>';
  return h + '</div>';
}
A['nw-f'] = function (d) { UI.nwF = d.v; render(); };
A['nw-open'] = function (d) {
  var n = newsList(S).filter(function (x) { return x.id === +d.v; })[0]; if (!n) return;
  var st = newsStory(n), extra = '', btns = '';
  if (n.k === 'race') {
    var e = (S.rr || []).filter(function (x) { return x.s === n.s && x.r === n.r - 1; })[0], ix = (S.rr || []).indexOf(e);
    if (e) {
      extra = '<div class="nwpod">' + e.c.slice(0, 3).map(function (r, i) { return '<div><span class="mono dim">P' + (i + 1) + '</span> ' + rrTag(r[1]) + ' <b>' + esc(r[0]) + '</b></div>'; }).join('') + '</div>';
      btns += '<button class="btn" data-act="rr-open" data-v="' + ix + '">Full results</button>';
    }
  }
  if (n.t != null && S.teams[n.t]) btns += '<button class="btn" data-act="tprof" data-v="' + n.t + '">' + esc(S.teams[n.t].name) + ' profile</button>';
  var who = n.n && S.drivers.filter(function (x) { return x.name === n.n; })[0];
  if (who) btns += '<button class="btn" data-act="prof" data-v="d:' + who.id + '">' + esc(who.name) + ' profile</button>';
  showModal('<div class="stack nwd" style="--tc:' + st.col + '"><div class="row sp"><span class="nw-k ' + st.kc + '">' + st.kick + '</span><small class="dim">' + newsMeta(n) + '</small></div>' +
    (st.team ? '<div class="nw-img nwd-img">' + carSVG(st.team, 190, true) + '</div>' : st.ci != null ? '<div class="nw-img trk nwd-img">' + circuitSVG(st.ci, 90, '#ffffff') + '</div>' : '') +
    '<h2 style="margin:0">' + esc(st.head) + '</h2><p style="margin:0;font-size:15.5px;line-height:1.6">' + esc(st.sub) + '</p>' + extra +
    (btns ? '<div class="row">' + btns + '</div>' : '') + '<button class="btn pri wide" data-act="mclose">Close</button></div>');
};

/* keputusan perlumbaan musim ini dalam profil pemandu */
function pfRaces(d) {
  var L = rrOf(S.season), out = [];
  L.forEach(function (x) { x.e.c.forEach(function (r) { if (r[0] === d.name) out.push({ r: x.e.r, ci: x.e.ci, g: r[4], p: r[2], pts: r[3], i: x.i }); }); });
  if (!out.length) return '';
  return '<div class="pf-rr">' + out.map(function (o) { return '<button class="pfrr ' + (o.p && o.p <= 3 ? 'pod' : o.p && o.p <= 10 ? 'pts' : o.p ? '' : 'bad') + '" data-act="rr-open" data-v="' + o.i + '"><small>R' + (o.r + 1) + '</small><b>' + (o.p ? 'P' + o.p : 'DNF') + '</b><small>G' + o.g + '</small></button>'; }).join('') + '</div>';
}
