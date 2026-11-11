'use strict';
/* ===== Season v3: season map calendar, podium standings, race-card results, trophy cabinet ===== */

function ssResClass(r) { return !r ? '' : r.dnf ? 'bad' : r.pos === 1 ? 'p1' : r.pos === 2 ? 'p2' : r.pos === 3 ? 'p3' : r.pts ? 'pts' : 'out'; }

/* ---------- calendar: the season as a map of circuits ---------- */
hKal = function () {
  var n = seasonRounds(S), p = me(), best = null, pods = 0;
  S.results.forEach(function (r) { if (!r.dnf && (best == null || r.pos < best)) best = r.pos; if (!r.dnf && r.pos <= 3) pods++; });
  var dots = ''; for (var k = 0; k < n; k++) dots += '<i class="' + (k < S.round ? 'done ' + ssResClass(S.results[k]) : k === S.round ? 'now' : '') + '"><u>' + (k + 1) + '</u></i>';
  var h = '<section class="sc-head"><div><span class="sc-eyebrow">Season ' + S.season + (typeof leagueOf === 'function' ? ' · ' + leagueOf(S).toUpperCase() : '') + '</span><h2>' + (S.round >= n ? 'Season complete' : 'Round ' + (S.round + 1) + ' of ' + n) + '</h2></div>' +
    '<div class="sc-stats"><div><small>Points</small><b>' + p.pts + '</b></div><div><small>Best finish</small><b>' + (best == null ? '–' : 'P' + best) + '</b></div><div><small>Podiums</small><b>' + pods + '</b></div></div><div class="sc-prog" aria-hidden="true">' + dots + '</div></section><div class="sc-grid">';
  for (var i = 0; i < n; i++) {
    var ci = S.cal[i], c = circuitFor(S, ci), r = S.results[i], cur = i === S.round, st = r ? 'past ' + ssResClass(r) : cur ? 'next' : 'future';
    h += '<div class="sc-card clk ' + st + '" role="button" tabindex="0" data-act="th" data-v="' + ci + '"><span class="sc-r">R' + (i + 1) + '</span>' + flagSVG(ci, 26) + '<span class="sc-art">' + circuitSVG(ci, 150, 'currentColor') + '</span><b>' + c.name + '</b><small>' + c.loc + ' · ' + laps2(c) + ' laps · rain ' + Math.round(c.rain * 100) + '%</small>' +
      (r ? '<span class="sc-res"><b>' + (r.dnf ? 'DNF' : 'P' + r.pos) + '</b><em>' + (r.pts ? '+' + r.pts + ' pts' : r.dnf ? 'retired' : 'no points') + '</em></span>' : cur ? '<button class="sc-go" data-act="tab" data-v="utama"><i></i>Next race · go to grid →</button>' : '<span class="sc-res soon"><em>' + (i - S.round === 1 ? 'Up after this one' : 'In ' + (i - S.round) + ' races') + '</em></span>') + '</div>';
  }
  return h + '</div><p class="dim" style="font-size:12.5px;margin:10px 2px 0">Tap a circuit to see its history.</p>';
};

/* ---------- standings: podium + bars ---------- */
function ssPodium(rows) {
  if (rows.length < 3 || !rows[0].pts) return '';
  return '<div class="sp-podium">' + [1, 0, 2].map(function (i) {
    var r = rows[i], mine = r.d.uid === S.playerUid;
    return '<button class="sp-step s' + (i + 1) + (mine ? ' me' : '') + '" style="--tc:' + (r.team ? r.team.color : '#888') + '" data-act="world-driver" data-v="' + r.d.uid + '">' + helmetSVG(r.d, 64, false) + '<b>' + esc(r.d.name.split(' ').slice(-1)[0]) + (mine ? ' <em>YOU</em>' : '') + '</b><small>' + r.pts + ' pts' + (r.wins ? ' · ' + r.wins + (r.wins === 1 ? ' win' : ' wins') : '') + '</small><span>' + (i + 1) + '</span></button>';
  }).join('') + '</div>';
}
seasonStandingsCard = function (teams) {
  var rows = seasonStandingsRows(), list = rows;
  if (teams) {
    var by = {}; rows.forEach(function (r) { if (!r.team) return; var t = by[r.team.key] = by[r.team.key] || { team: r.team, pts: 0, wins: 0 }; t.pts += r.pts || 0; t.wins += r.wins || 0; });
    list = seasonBrowseYear() === S.season ? teamStandings(worldView(S, seasonBrowseLeague())).map(function (t) { return { team: t, pts: t.pts, wins: t.wins }; }) : Object.keys(by).map(function (k) { return by[k]; }).sort(function (a, b) { return b.pts - a.pts || b.wins - a.wins || a.team.id - b.team.id; });
  }
  var top = list.length ? Math.max(1, list[0].pts) : 1, myTeamKey = myTeam().key;
  return '<section class="card season-table-card sp-card"><h3>' + seasonBrowseLeague().toUpperCase() + ' · ' + (teams ? 'Teams' : 'Drivers') + '</h3>' + (!list.length ? '<p class="season-empty">No standings were recorded for this season.</p>' : (teams ? '' : ssPodium(rows)) + '<div class="scroll"><table class="t season-table sp-table ' + (teams ? 'teams-table' : '') + '"><thead><tr><th>#</th><th>' + (teams ? 'Team' : 'Driver') + '</th>' + (!teams ? '<th class="r">OVR</th>' : '') + '<th class="r">Wins</th><th class="r">Gap</th><th class="r">Pts</th></tr></thead><tbody>' + list.map(function (r, i) {
    var mine = teams ? seasonBrowseLeague() === leagueOf(S) && r.team.key === myTeamKey : r.d.uid === S.playerUid, pos = teams ? i + 1 : r.pos, col = r.team ? r.team.color : '#888', gap = list[0].pts - r.pts;
    return '<tr' + (mine ? ' class="me"' : '') + ' style="--tc:' + col + ';--w:' + Math.round((r.pts || 0) / top * 100) + '%"><td class="mono sp-pos"><span class="' + (pos <= 3 ? 'm' + pos : '') + '">' + pos + '</span></td><td class="sp-n">' + (teams ? '<button class="season-team-name" data-act="season-team" data-v="' + r.team.id + '">' + carSVG(r.team, 50) + '<span>' + esc(r.team.name) + '</span></button>' : '<button class="season-driver" data-act="world-driver" data-v="' + r.d.uid + '">' + avatarSVG(r.d, 28) + '<span>' + esc(r.d.name) + (mine ? ' <em class="sp-you">YOU</em>' : '') + '</span></button>') + '<i class="sp-bar"><u></u></i></td>' + (!teams ? '<td class="r mono">' + ovr(r.d) + '</td>' : '') + '<td class="r mono">' + r.wins + '</td><td class="r mono dim">' + (gap ? '-' + gap : i ? '=' : 'Leader') + '</td><td class="r mono"><b>' + r.pts + '</b></td></tr>';
  }).join('') + '</tbody></table></div>') + '</section>';
};

/* ---------- results: one card per race ---------- */
var ssOldRes = hRes;
hRes = function () {
  if (S.mode !== 'pro') return ssOldRes();
  var y = seasonBrowseYear(), l = seasonBrowseLeague(), list = seasonRaceRows().filter(function (r) { return r.s === y; }).sort(function (a, b) { return a.r - b.r; });
  if (!list.length) return ssOldRes();
  var teams0 = worldView(S, l).teams;
  return seasonBrowseNote() + '<div class="sr-grid">' + list.map(function (e) {
    var teams = e.teams || teams0, mine = null; e.c.forEach(function (r) { if (r[5] || r[7] && r[7] === S.playerUid) mine = r; });
    var cls = mine ? (!mine[2] ? 'bad' : mine[2] === 1 ? 'p1' : mine[2] === 2 ? 'p2' : mine[2] === 3 ? 'p3' : mine[3] ? 'pts' : 'out') : '';
    return '<button class="sr-card ' + cls + '" data-act="season-race" data-v="' + e.s + ':' + e.r + '"><span class="sr-top"><span class="sc-r">R' + (e.r + 1) + '</span>' + flagSVG(e.ci, 24) + '<b>' + esc(CIRCUITS[e.ci].name) + '</b></span><span class="sr-art">' + circuitSVG(e.ci, 110, 'currentColor') + '</span>' +
      '<span class="sr-pod">' + e.c.slice(0, 3).filter(function (r) { return r[2]; }).map(function (r, i) { var t = teams[r[1]] || { color: '#888' }; return '<span class="' + (r === mine ? 'me' : '') + '"><i class="m' + (i + 1) + '">' + (i + 1) + '</i><u style="background:' + t.color + '"></u>' + esc(r[0].split(' ').slice(-1)[0]) + '</span>'; }).join('') + '</span>' +
      (mine ? '<span class="sr-me"><small>You</small><b>' + (mine[2] ? 'P' + mine[2] : 'DNF') + '</b><em>' + (mine[3] ? '+' + mine[3] + ' pts' : mine[2] && mine[4] ? (mine[4] - mine[2] > 0 ? '▲' + (mine[4] - mine[2]) + ' from grid' : mine[4] - mine[2] < 0 ? '▼' + (mine[2] - mine[4]) + ' from grid' : 'held position') : '') + '</em></span>' : '<span class="sr-me none"><em>Full result →</em></span>') + '</button>';
  }).join('') + '</div>';
};

/* ---------- history: trophy cabinet ---------- */
var ssOldHist = hHist;
hHist = function () {
  var h = ssOldHist(), c = S.career, cut = h.indexOf('<div class="card"><h3 style="margin-bottom:8px">Records');
  if (cut < 0) return h;
  var T = [['🏁', 'Starts', c.starts], ['🏆', 'Wins', c.wins], ['🍾', 'Podiums', c.pods], ['⚡', 'Poles', c.poles], ['👑', 'Titles', c.titles], ['⭐', 'Points', c.pts]];
  return '<div class="season-history"><section class="sh-cab"><header><span>Trophy cabinet</span><span>' + esc(me().name) + '</span></header><div>' + T.map(function (x) { return '<div class="' + (x[2] ? 'has' : '') + '"><span aria-hidden="true">' + x[0] + '</span><b>' + (x[2] || 0) + '</b><small>' + x[1] + '</small></div>'; }).join('') + '</div></section>' + h.slice(cut);
};
