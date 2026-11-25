'use strict';
/* ===== Archive (2.5.0): season archive, records and driver rating history =====
   Stored once per finished season in S.arcv (final standings, poles, fastest laps, race winners, every driver's OVR).
   Older seasons are rebuilt on the fly from S.rr (race results), driver/team season history and S.hist, and are labelled partial. */
var AR = { keep: 30 };

function arLg() { return leagueOf(S); }
/* the league shown in the archive: the player's own by default; with the world ladder every league can be opened (never mixed) */
function arLgSel() { var l = UI.arLg; return S.world && (l === 'f1' || l === 'f2' || l === 'f3') ? l : arLg(); }
function arPeople(S) { var seen = {}, out = []; [S.drivers || [], S.reserves || [], S.retired || [], typeof worldPeople === 'function' ? worldPeople(S) : [], S.bench ? [S.bench] : []].forEach(function (L) { L.forEach(function (d) { var k = d.uid || d.name; if (!seen[k]) { seen[k] = 1; out.push(d); } }); }); return out; }
function arTeamByKey(S) { var m = {}; (S.world ? ['f1', 'f2', 'f3'] : [arLg()]).forEach(function (l) { var v = S.world ? worldView(S, l) : S; if (v && v.teams) v.teams.forEach(function (t) { if (t.key) m[t.key] = t; else if (l === 'f1') m['f1:' + t.id] = t; }); }); return m; }
/* a season of any league rebuilt from every driver's league history (the world keeps one line per driver, league and season) */
function arFromWH(S, s, lg) {
  var tk = arTeamByKey(S), d = [], tm = {};
  arPeople(S).forEach(function (x) {
    (x.worldHistory || []).forEach(function (r) {
      if (r.season !== s || r.league !== lg || r.pos == null) return;
      var t = tk[r.teamKey], sh = (x.sh || []).filter(function (h) { return h.s === s && (h.league === lg || !h.league); })[0];
      d.push({ u: x.uid || null, n: x.name, nat: x.nat || '', tm: t ? t.short : '–', tc: t ? t.color : '#888', p: r.pos, pts: r.points || 0, w: r.wins || 0, pd: sh ? sh.pods || 0 : 0, pl: null, fl: null, o: null });
      if (t) { var o = tm[r.teamKey] || (tm[r.teamKey] = { n: t.name, sh: t.short, c: t.color, pts: 0, w: 0 }); o.pts += r.points || 0; o.w += r.wins || 0; }
    });
  });
  if (!d.length) return null;
  d.sort(function (a, b) { return a.p - b.p; });
  var tl = Object.keys(tm).map(function (k) { return tm[k]; }).sort(function (a, b) { return b.pts - a.pts || b.w - a.w; }).map(function (o, i) { return Object.assign(o, { p: i + 1 }); });
  return { s: s, lg: lg, src: 'sh', ch: d[0].p === 1 ? d[0].n : '', cht: tl[0] ? tl[0].n : '', d: d, t: tl, rc: [] };
}
function arTeamOf(S, i) { return S.teams && S.teams[i] ? S.teams[i] : null; }

/* ---------- building entries ---------- */
function arFromRR(S, s, lg) {
  var L = (S.rr || []).filter(function (e) { return e.s === s && e.league === lg; }).sort(function (a, b) { return a.r - b.r; });
  if (!L.length) return null;
  var dm = {}, tm = {}, pl = {}, fl = {}, rc = [];
  L.forEach(function (e) {
    var w = null, p = null;
    e.c.forEach(function (r) {
      var o = dm[r[0]] || (dm[r[0]] = { n: r[0], nat: r[6] || '', ti: r[1], pts: 0, w: 0, pd: 0, pl: 0, fl: 0 });
      o.ti = r[1]; o.pts += r[3] || 0; if (r[2] === 1) { o.w++; w = r; } if (r[2] && r[2] <= 3) o.pd++; if (r[4] === 1) { o.pl++; p = r; }
      var t = tm[r[1]] || (tm[r[1]] = { id: r[1], pts: 0, w: 0 }); t.pts += r[3] || 0; if (r[2] === 1) t.w++;
    });
    if (e.fl && dm[e.fl]) dm[e.fl].fl++;
    var c = CIRCUITS[e.ci], wt = w ? arTeamOf(S, w[1]) : null;
    rc.push({ r: e.r, c: c ? c.name : '', w: w ? w[0] : null, wt: wt ? wt.short : '', wc: wt ? wt.color : '#888', p: p ? p[0] : null, f: e.fl || null });
  });
  var ds = Object.keys(dm).map(function (k) { return dm[k]; }).sort(function (a, b) { return b.pts - a.pts || b.w - a.w; });
  var d = ds.map(function (o, i) { var t = arTeamOf(S, o.ti); return { n: o.n, nat: o.nat, tm: t ? t.short : '–', tc: t ? t.color : '#888', p: i + 1, pts: o.pts, w: o.w, pd: o.pd, pl: o.pl, fl: o.fl, o: null }; });
  var tl = Object.keys(tm).map(function (k) { return tm[k]; }).sort(function (a, b) { return b.pts - a.pts || b.w - a.w; }).map(function (o, i) { var t = arTeamOf(S, o.id); return { n: t ? t.name : '–', sh: t ? t.short : '–', c: t ? t.color : '#888', p: i + 1, pts: o.pts, w: o.w }; });
  return { d: d, t: tl, rc: rc };
}
function arFromSH(S, s) {
  var people = S.drivers.concat(S.retired || []), d = [];
  people.forEach(function (x) { (x.sh || []).forEach(function (r) { if (r.s === s) d.push({ n: x.name, nat: x.nat || '', tm: r.t, tc: r.tc, p: r.pos, pts: r.pts, w: r.wins, pd: r.pods, pl: null, fl: null, o: null }); }); });
  d.sort(function (a, b) { return a.p - b.p; });
  var t = []; S.teams.forEach(function (x) { (x.sh || []).forEach(function (r) { if (r.s === s) t.push({ n: x.name, sh: x.short, c: x.color, p: r.pos, pts: r.pts, w: r.wins }); }); });
  t.sort(function (a, b) { return a.p - b.p; });
  return d.length || t.length ? { d: d, t: t, rc: [] } : null;
}
function arBack(S, rec) {
  var lg = rec.league || 'f1', body = arFromRR(S, rec.season, lg), src = 'rr';
  if (!body) { body = arFromSH(S, rec.season); src = 'sh'; }
  if (!body) { body = { d: [], t: [], rc: [] }; src = 'hist'; }
  /* the recorded champions are the source of truth for who won */
  return { s: rec.season, lg: lg, src: src, ch: rec.champ, cht: rec.champTeam, d: body.d, t: body.t, rc: body.rc, me: { p: rec.pos, pts: rec.pts, w: rec.wins, tm: rec.team, tc: rec.tcol } };
}
function arLive(S) {
  var lg = arLg(), ds = driverStandings(S), ts = teamStandings(S), rr = arFromRR(S, S.season, lg);
  var pl = {}, fl = {}, rc = rr ? rr.rc : [];
  rc.forEach(function (x) { if (x.p) pl[x.p] = (pl[x.p] || 0) + 1; if (x.f) fl[x.f] = (fl[x.f] || 0) + 1; });
  var d = ds.map(function (x, i) { var t = arTeamOf(S, x.team); return { u: x.uid || null, n: x.name, nat: x.nat || '', tm: t ? t.short : '–', tc: t ? t.color : '#888', p: i + 1, pts: x.pts, w: x.wins, pd: x.pods, pl: pl[x.name] || 0, fl: fl[x.name] || 0, o: ovr(x) }; });
  var t = ts.map(function (x, i) { return { n: x.name, sh: x.short, c: x.color, p: i + 1, pts: x.pts, w: x.wins }; });
  return { s: S.season, lg: lg, src: 'full', ch: ds[0] ? ds[0].name : '', cht: ts[0] ? ts[0].name : '', d: d, t: t, rc: rc };
}
function arRecord(S) {
  if (S.sit || !S.teams || !S.drivers) return;
  var e = arLive(S), lg = e.lg;   /* the player's league, race by race; the other leagues are rebuilt from the world's season lines */
  S.arcv = (S.arcv || []).filter(function (x) { return !(x.s === e.s && x.lg === lg); }).concat([e]).sort(function (a, b) { return a.s - b.s; }).slice(-AR.keep);
}

/* every season of the current league, newest first: stored, rebuilt, and the one in progress */
function arAll(S, lg) {
  lg = lg || arLg(); var out = {}, stored = (S.arcv || []).filter(function (x) { return x.lg === lg; }), seasons = {};
  /* every season the world kept for this league, whether the player raced in it or not */
  arPeople(S).forEach(function (x) { (x.worldHistory || []).forEach(function (r) { if (r.league === lg) seasons[r.season] = 1; }); });
  Object.keys(seasons).forEach(function (k) { var e = arFromWH(S, +k, lg); if (e) out[k] = e; });
  (S.hist || []).forEach(function (r) { if ((r.league || 'f1') !== lg || r.inactive || r.reserve) return; var b = arBack(S, r); if (b.src === 'hist' && out[r.season]) { out[r.season].me = b.me; return; } out[r.season] = b; });
  stored.forEach(function (e) { var b = out[e.s]; out[e.s] = Object.assign({}, e, { me: b ? b.me : e.me }); });
  if (lg === arLg() && !out[S.season] && S.round > 0 && !S.sit) out[S.season] = Object.assign(arLive(S), { src: 'live' });
  return Object.keys(out).map(function (k) { return out[k]; }).sort(function (a, b) { return b.s - a.s; });
}

/* ---------- records ---------- */
function arRecords(S, lg) {
  var A0 = arAll(S, lg), dr = {}, tr = {}, best = { pts: null, w: null }, covPl = 0, covAll = 0;
  A0.forEach(function (e) {
    var done = e.src !== 'live';
    covAll++; if (e.d.some(function (x) { return x.pl != null; })) covPl++;
    e.d.forEach(function (x) {
      var o = dr[x.n] || (dr[x.n] = { n: x.n, tm: x.tm, tc: x.tc, t: 0, w: 0, pd: 0, pl: 0, fl: 0, s: 0 });
      o.tm = x.tm; o.tc = x.tc; o.w += x.w; o.pd += x.pd; o.pl += x.pl || 0; o.fl += x.fl || 0; o.s++;
      if (!best.pts || x.pts > best.pts.v) best.pts = { v: x.pts, n: x.n, s: e.s, tc: x.tc };
      if (!best.w || x.w > best.w.v) best.w = { v: x.w, n: x.n, s: e.s, tc: x.tc };
    });
    if (done && e.ch && dr[e.ch]) dr[e.ch].t++; else if (done && e.ch) dr[e.ch] = { n: e.ch, tm: '–', tc: '#888', t: 1, w: 0, pd: 0, pl: 0, fl: 0, s: 0 };
    e.t.forEach(function (x) { var o = tr[x.n] || (tr[x.n] = { n: x.n, sh: x.sh, c: x.c, t: 0, w: 0 }); o.w += x.w; });
    if (done && e.cht) { var o2 = tr[e.cht] || (tr[e.cht] = { n: e.cht, sh: e.cht.split(' ')[0], c: '#888', t: 0, w: 0 }); o2.t++; }
  });
  var top = function (o, k, min) { return Object.keys(o).map(function (n) { return o[n]; }).filter(function (x) { return x[k] >= (min || 1); }).sort(function (a, b) { return b[k] - a[k] || b.w - a.w; }).slice(0, 5); };
  return { dTitles: top(dr, 't'), dWins: top(dr, 'w'), dPods: top(dr, 'pd'), dPoles: top(dr, 'pl'), dFl: top(dr, 'fl'), tTitles: top(tr, 't'), tWins: top(tr, 'w'), best: best, n: A0.length, covPl: covPl, races: A0.reduce(function (a, e) { return a + e.rc.length; }, 0) };
}

/* ---------- rating history (works in classic and pro) ---------- */
function arRH(d) {
  var m = {};
  (d.rh || []).forEach(function (x) { m[x.s] = { s: x.s, r: x.r }; });
  (S.arcv || []).forEach(function (e) { e.d.forEach(function (x) { if (x.o != null && (x.u ? x.u === d.uid : x.n === d.name)) m[e.s] = { s: e.s, r: x.o }; }); });
  return Object.keys(m).map(function (k) { return m[k]; }).filter(function (x) { return x.s < S.season || (x.s === S.season && S.round >= seasonRounds(S)); }).sort(function (a, b) { return a.s - b.s; });
}

/* ---------- UI ---------- */
function arTag(n, c) { return '<span class="ar-tag" style="--tc:' + c + '">' + esc(n) + '</span>'; }
function arSrc(e) { return e.src === 'full' ? ['Full record', 'ok'] : e.src === 'live' ? ['In progress', 'live'] : e.src === 'rr' ? ['Race results', 'mid'] : e.src === 'sh' ? ['Standings only', 'mid'] : ['Champions only', 'low']; }
function arHero(L) {
  var bg = arLgSel() !== arLg() && !L.some(function (e) { return e.src === 'full' || e.src === 'rr'; });
  var races = L.reduce(function (a, e) { return a + e.rc.length; }, 0), full = L.filter(function (e) { return e.src === 'full'; }).map(function (e) { return e.s; }).sort(function (a, b) { return a - b; })[0];
  return '<section class="ar-hero"><span class="ar-eyebrow">ARCHIVE · ' + String(arLgSel()).toUpperCase() + '</span><h2>Every season on file</h2><p>' + (bg ? 'You do not race in this series right now, so it runs in the background: champions and final standings are kept for every season, race-by-race results only while you race in it.' : 'Champions, final standings, race winners and records. Seasons played before this archive existed are rebuilt from what the game kept.') + '</p>' +
    '<div class="ar-badges"><span>' + L.length + (L.length === 1 ? ' SEASON' : ' SEASONS') + '</span>' + (bg ? '<span>FINAL STANDINGS EVERY SEASON</span>' : '<span>' + races + ' RACES</span>' + (full ? '<span class="ok">FULL RECORD FROM S' + full + '</span>' : '<span>FULL RECORD STARTS THIS SEASON</span>')) + '</div></section>';
}
function arSeg(v) { return '<div class="ar-seg" role="tablist">' + [['champs', 'Champions'], ['seasons', 'Seasons'], ['records', 'Records']].map(function (x) { return '<button role="tab" aria-selected="' + (v === x[0]) + '" class="' + (v === x[0] ? 'on' : '') + '" data-act="ar-view" data-v="' + x[0] + '">' + x[1] + '</button>'; }).join('') + '</div>'; }
function arChamps(L) {
  var me = S.drivers[S.pi] && S.drivers[S.pi].name;
  return '<div class="ar-list">' + L.map(function (e) {
    var s = arSrc(e), dt = e.d.filter(function (x) { return x.n === e.ch; })[0], tc = dt ? dt.tc : '#888', yours = e.ch === me, mine = e.me;
    return '<button class="ar-champ" style="--tc:' + tc + '" data-act="ar-season" data-v="' + e.s + '"><span class="ar-yr">S' + e.s + '</span><span class="ar-main">' +
      (e.src === 'live' ? '<small>Leading now</small><b>' + esc(e.ch) + '</b>' : '<small>Drivers’ champion' + (yours ? ' · you' : '') + '</small><b>' + esc(e.ch) + '</b>') +
      '<span class="ar-sub">' + (e.cht ? '<i>Constructors</i> ' + esc(e.cht) : '') + '</span></span><span class="ar-side"><em class="' + s[1] + '">' + s[0] + '</em>' + (mine && mine.p ? '<span>You: P' + mine.p + '</span>' : '') + '</span></button>';
  }).join('') + '</div>';
}
function arRows(e) {
  var me = S.drivers[S.pi] && S.drivers[S.pi].name, has = e.d.some(function (x) { return x.pl != null; });
  if (!e.d.length) return '<p class="ar-note">No standings were kept for this season. Only the champions are on file.</p>';
  return '<div class="ar-head"><span>#</span><span>Driver</span><span>W</span><span>Pole</span><span>Pts</span></div><ol class="ar-rows">' + e.d.map(function (x) {
    return '<li class="' + (x.n === me ? 'me' : '') + (x.p === 1 ? ' p1' : '') + '" style="--tc:' + x.tc + '"><span class="ar-p">' + x.p + '</span><span class="ar-n"><b>' + esc(x.n) + '</b><small>' + esc(x.tm) + (x.o != null ? ' · OVR ' + x.o : '') + '</small></span><span class="ar-v">' + x.w + '</span><span class="ar-v">' + (x.pl == null ? '–' : x.pl) + '</span><span class="ar-v pts">' + x.pts + '</span></li>';
  }).join('') + '</ol>' + (has ? '' : '<p class="ar-note">Poles were not recorded for this season.</p>');
}
function arTeams(e) {
  if (!e.t.length) return '';
  return '<h3 class="ar-h">Constructors</h3><ol class="ar-rows ar-t">' + e.t.map(function (x) { return '<li class="' + (x.p === 1 ? 'p1' : '') + '" style="--tc:' + x.c + '"><span class="ar-p">' + x.p + '</span><span class="ar-n"><b>' + esc(x.n) + '</b></span><span class="ar-v">' + x.w + '</span><span class="ar-v pts">' + x.pts + '</span></li>'; }).join('') + '</ol>';
}
function arRaces(e) {
  if (!e.rc.length) return '';
  return '<h3 class="ar-h">Race by race</h3><ol class="ar-races">' + e.rc.map(function (x) { return '<li style="--tc:' + x.wc + '"><span class="ar-r">R' + (x.r + 1) + '</span><span class="ar-c">' + esc(x.c) + '</span><span class="ar-w"><b>' + (x.w ? esc(x.w) : '–') + '</b>' + (x.wt ? '<small>' + esc(x.wt) + '</small>' : '') + '</span>' + (x.p ? '<span class="ar-pole" title="Pole">P ' + esc(x.p.split(' ').slice(-1)[0]) + '</span>' : '') + '</li>'; }).join('') + '</ol>';
}
function arSeasons(L) {
  if (!L.length) return '<p class="ar-note">No season has been completed yet. The first one is archived when the finale is over.</p>';
  var sel = L.filter(function (e) { return e.s === UI.arSeason; })[0] || L[0], s = arSrc(sel);
  return '<div class="ar-chips" role="group" aria-label="Season">' + L.map(function (e) { return '<button class="' + (e.s === sel.s ? 'on' : '') + '" data-act="ar-season" data-v="' + e.s + '">S' + e.s + '</button>'; }).join('') + '</div>' +
    '<section class="ar-sheet"><header><div><small>Season ' + sel.s + '</small><h3>' + (sel.src === 'live' ? 'Standings so far' : 'Final standings') + '</h3></div><em class="' + s[1] + '">' + s[0] + '</em></header>' +
    (sel.ch ? '<div class="ar-crown"><span>' + (sel.src === 'live' ? 'LEADING' : 'CHAMPION') + '</span><b>' + esc(sel.ch) + '</b>' + (sel.cht ? '<small>Constructors: ' + esc(sel.cht) + '</small>' : '') + '</div>' : '') +
    arRows(sel) + arTeams(sel) + arRaces(sel) + '</section>';
}
function arBoard(t, list, k, unit, cls) {
  var mx = list.length ? list[0][k] : 1;
  return '<section class="ar-board ' + (cls || '') + '"><h3>' + t + '</h3>' + (list.length ? '<ol>' + list.map(function (x, i) { return '<li style="--tc:' + (x.tc || x.c || '#888') + '"><span class="ar-p">' + (i + 1) + '</span><span class="ar-bn"><b>' + esc(x.n) + '</b><i style="width:' + Math.max(8, Math.round(x[k] / mx * 100)) + '%"></i></span><span class="ar-bv">' + x[k] + '</span></li>'; }).join('') + '</ol>' : '<p class="ar-note">None yet.</p>') + '</section>';
}
function arRecordsView(L) {
  var R = arRecords(S, arLgSel());
  if (!L.length) return '<p class="ar-note">Records appear once a season has been played.</p>';
  var bw = R.best.w, bp = R.best.pts;
  return '<div class="ar-boards">' + arBoard('Drivers’ titles', R.dTitles, 't') + arBoard('Most wins', R.dWins, 'w') + arBoard('Most podiums', R.dPods, 'pd') + arBoard('Most poles', R.dPoles, 'pl') + arBoard('Fastest laps', R.dFl, 'fl') +
    arBoard('Constructors’ titles', R.tTitles, 't') + arBoard('Team race wins', R.tWins, 'w') + '</div>' +
    ((bw || bp) ? '<div class="ar-best">' + (bw ? '<div style="--tc:' + bw.tc + '"><small>Most wins in a season</small><b>' + bw.v + '</b><span>' + esc(bw.n) + ' · S' + bw.s + '</span></div>' : '') + (bp ? '<div style="--tc:' + bp.tc + '"><small>Most points in a season</small><b>' + bp.v + '</b><span>' + esc(bp.n) + ' · S' + bp.s + '</span></div>' : '') + '</div>' : '') +
    '<p class="ar-note">Counted over ' + R.n + (R.n === 1 ? ' season' : ' seasons') + ' on file. Poles and fastest laps come from recorded race results' + (R.covPl < R.n ? ', so seasons played before this archive may be missing from those two lists' : '') + '.</p>';
}
function arPage() {
  var lg = arLgSel(), L = arAll(S, lg), v = UI.arView || 'champs';
  var lgs = S.world ? '<div class="ar-seg ar-lg" role="tablist" aria-label="League">' + ['f1', 'f2', 'f3'].map(function (l) { return '<button role="tab" aria-selected="' + (l === lg) + '" class="' + (l === lg ? 'on' : '') + '" data-act="ar-lg" data-v="' + l + '">' + l.toUpperCase() + (l === arLg() ? ' · yours' : '') + '</button>'; }).join('') + '</div>' : '';
  return '<div class="ar47">' + arHero(L) + lgs + arSeg(v) + (v === 'seasons' ? arSeasons(L) : v === 'records' ? arRecordsView(L) : (L.length ? arChamps(L) : '<p class="ar-note">No season has been completed yet. The first one is archived when the finale is over.</p>')) + '</div>';
}
if (typeof A !== 'undefined') {
  A['ar-view'] = function (d) { UI.arView = d.v; render(); };
  A['ar-lg'] = function (d) { UI.arLg = d.v; UI.arSeason = null; render(); };
  A['ar-season'] = function (d) { UI.arSeason = +d.v; UI.arView = 'seasons'; if (UI.musimView !== 'archive') { UI.musimView = 'archive'; UI.tab = 'musim'; UI.screen = 'hub'; } render(); window.scrollTo(0, 0); };
  A['ar-open'] = function () { UI.musimView = 'archive'; UI.tab = 'musim'; UI.screen = 'hub'; closeModal(); render(); window.scrollTo(0, 0); };
}
if (typeof hMusim === 'function') {
  var arMusim0 = hMusim;
  hMusim = function () { if (UI.musimView === 'archive') return rgNav('archive') + arPage(); return arMusim0.apply(this, arguments); };
  var arSection0 = A['hub-section'];
  A['hub-section'] = function (d) { if (d.v === 'archive') { UI.musimView = 'archive'; UI.tab = 'musim'; render(); window.scrollTo(0, 0); return; } return arSection0(d); };
}
