'use strict';
/* ===== Hab v6: navigasi (tepi di laptop, bawah di telefon) + grafik vektor ringan ===== */
function h32(s) { var h = 2166136261; s = String(s); for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }

/* avatar pemandu: dijana dari id + nama, sut ikut warna pasukan */
var SKIN = ['#f3d2b3', '#e8b98f', '#d39a6a', '#b07548', '#8a5634', '#5e3a22'], HAIR = ['#1d1612', '#3b2618', '#6b4423', '#a8743a', '#d9b26a', '#7a7f87', '#b23b25'];
function avatarSVG(d, size) {
  var t = S.teams[d.team], g = h32(d.id + d.name), sk = SKIN[g % SKIN.length], hr = HAIR[(g >> 4) % HAIR.length], st = (g >> 8) % 4, col = t.color, s = size || 56;
  var hair = [
    '<path d="M27 36c0-12 8-19 21-19s21 7 21 19c-4-5-9-8-21-8s-17 3-21 8z" fill="' + hr + '"/>',
    '<path d="M26 40c-1-15 9-23 22-23 14 0 23 8 22 23-3-8-7-12-12-13-5 4-15 5-25 1-3 3-5 7-7 12z" fill="' + hr + '"/>',
    '<path d="M27 38c0-13 9-21 21-21s21 8 21 21l-3-2c-2-7-8-11-18-11s-16 4-18 11z" fill="' + hr + '"/><circle cx="48" cy="17" r="5" fill="' + hr + '"/>',
    '<path d="M28 34c2-10 10-16 20-16s18 6 20 16c-6-4-13-5-20-5s-14 1-20 5z" fill="' + hr + '"/>'
  ][st];
  return '<svg class="av5" width="' + s + '" height="' + s + '" viewBox="0 0 96 96" aria-hidden="true"><rect width="96" height="96" rx="22" fill="' + col + '22"/>' +
    '<path d="M14 96c2-20 16-29 34-29s32 9 34 29z" fill="' + col + '"/><path d="M40 68l8 10 8-10" fill="none" stroke="#ffffffaa" stroke-width="3"/>' +
    '<rect x="41" y="56" width="14" height="14" rx="5" fill="' + sk + '"/><ellipse cx="48" cy="42" rx="19" ry="21" fill="' + sk + '"/>' + hair +
    '<circle cx="41" cy="44" r="2.2" fill="#1b2340"/><circle cx="55" cy="44" r="2.2" fill="#1b2340"/><path d="M42 53q6 4 12 0" fill="none" stroke="#1b2340" stroke-width="2" stroke-linecap="round"/></svg>';
}
/* kereta pandangan atas, warna pasukan */
function carSVG(col, w) {
  return '<svg class="car5" width="' + (w || 220) + '" viewBox="0 0 220 90" aria-hidden="true">' +
    '<rect x="4" y="22" width="16" height="46" rx="3" fill="#1b2340"/><rect x="2" y="16" width="20" height="8" rx="2" fill="' + col + '"/><rect x="2" y="66" width="20" height="8" rx="2" fill="' + col + '"/>' +
    '<rect x="26" y="8" width="26" height="16" rx="5" fill="#1b2340"/><rect x="26" y="66" width="26" height="16" rx="5" fill="#1b2340"/><rect x="140" y="6" width="30" height="18" rx="6" fill="#1b2340"/><rect x="140" y="66" width="30" height="18" rx="6" fill="#1b2340"/>' +
    '<path d="M20 40h60l20-12h56l14 8v18l-14 8h-56l-20-12H20z" fill="' + col + '"/><path d="M100 30h50l8 15-8 15h-50z" fill="' + col + '"/><path d="M150 38h44l20 3v8l-20 3h-44z" fill="' + col + '"/>' +
    '<rect x="196" y="30" width="20" height="30" rx="3" fill="' + col + '"/><rect x="198" y="34" width="16" height="22" rx="2" fill="#ffffff55"/>' +
    '<ellipse cx="118" cy="45" rx="13" ry="8" fill="#1b2340"/><path d="M104 45q14-16 28 0" fill="none" stroke="#6f7487" stroke-width="3"/>' +
    '<path d="M60 45h40" stroke="#ffffff66" stroke-width="2"/></svg>';
}
/* bendera rekaan: dari indeks litar */
var FLAGC = ['#d93a2f', '#ffffff', '#1b2340', '#1f9d55', '#f0b429', '#2f6db5', '#0e8a8c', '#7b2d8b', '#111111', '#ff7a1a'];
function flagSVG(seed, w) {
  var g = h32('flag' + seed), a = FLAGC[g % 10], b = FLAGC[(g >> 4) % 10], c = FLAGC[(g >> 8) % 10], k = (g >> 12) % 4, W = w || 34, H = Math.round(W * 0.68);
  if (b === a) b = '#ffffff'; if (c === b) c = a === '#1b2340' ? '#f0b429' : '#1b2340';
  var body = k === 0 ? '<rect width="30" height="7" fill="' + a + '"/><rect y="7" width="30" height="6" fill="' + b + '"/><rect y="13" width="30" height="7" fill="' + c + '"/>' :
    k === 1 ? '<rect width="10" height="20" fill="' + a + '"/><rect x="10" width="10" height="20" fill="' + b + '"/><rect x="20" width="10" height="20" fill="' + c + '"/>' :
    k === 2 ? '<rect width="30" height="20" fill="' + a + '"/><circle cx="15" cy="10" r="5.5" fill="' + b + '"/>' :
    '<rect width="30" height="20" fill="' + a + '"/><path d="M0 0L13 10L0 20z" fill="' + c + '"/><rect x="13" y="8" width="17" height="4" fill="' + b + '"/>';
  return '<svg class="flag5" width="' + W + '" height="' + H + '" viewBox="0 0 30 20" aria-hidden="true">' + body + '<rect width="30" height="20" fill="none" stroke="#1b234033"/></svg>';
}
function circuitSVG(ci, w, col) {
  var T = buildTrack(ci);
  return '<svg class="cir5" width="' + (w || 160) + '" viewBox="20 20 360 200" aria-hidden="true"><path d="' + T.d + '" fill="none" stroke="' + (col || '#ffffff') + '" stroke-width="9" stroke-linejoin="round" opacity=".95"/><path d="' + T.d + '" fill="none" stroke="#00000033" stroke-width="2" stroke-dasharray="4 10"/></svg>';
}
function spark(arr, w, h) {
  if (arr.length < 2) return '<svg width="' + w + '" height="' + h + '"></svg>';
  var mx = 20, pts = arr.map(function (v, i) { return [(i / (arr.length - 1)) * (w - 8) + 4, 4 + (v - 1) / (mx - 1) * (h - 8)]; });
  return '<svg width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '" aria-hidden="true"><polyline points="' + pts.map(function (p) { return p.join(','); }).join(' ') + '" fill="none" stroke="var(--acc)" stroke-width="2.5" stroke-linejoin="round"/>' +
    pts.map(function (p, i) { return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="' + (i === pts.length - 1 ? 4 : 2.5) + '" fill="' + (i === pts.length - 1 ? 'var(--acc)' : 'var(--panel)') + '" stroke="var(--acc)" stroke-width="2"/>'; }).join('') + '</svg>';
}

/* ikon menu (garis) */
var ICO = {
  musim: '<path d="M4 11l8-7 8 7v9h-5v-6H9v6H4z"/>',
  kal: '<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/>',
  news: '<path d="M5 4h11a2 2 0 0 1 2 2v13H7a2 2 0 0 1-2-2zM18 8h2v9a2 2 0 0 1-2 2M8 8h7M8 12h7M8 15h4"/>',
  kej: '<path d="M8 4h8v5a4 4 0 0 1-8 0zM8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M8 20h8M10 17h4"/>',
  kereta: '<path d="M3 15l2-5h14l2 5v3H3zM7 18v2M17 18v2M5 13h14"/><circle cx="7.5" cy="15.5" r="1"/><circle cx="16.5" cy="15.5" r="1"/>',
  saya: '<circle cx="12" cy="8" r="4"/><path d="M4 20c1-4 4-6 8-6s7 2 8 6"/>'
};
function ico(k) { return '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ICO[k] + '</svg>'; }
var NAV = [['musim', 'Home'], ['news', 'News'], ['kal', 'Races'], ['kej', 'Standings'], ['kereta', 'Team'], ['saya', 'Me']];

function vHub() {
  if (UI.tab === 'pemandu' || UI.tab === 'kerjaya') UI.tab = 'saya';
  if (!NAV.some(function (x) { return x[0] === UI.tab; })) UI.tab = 'musim';
  if (typeof ensureDev === 'function') ensureDev(S);
  var nav = NAV.map(function (x) { return '<button class="' + (UI.tab === x[0] ? 'on' : '') + '" data-act="tab" data-v="' + x[0] + '">' + ico(x[0]) + '<span>' + x[1] + '</span></button>'; }).join('');
  var body = ({ musim: hUtama, news: hNews, kal: hKalX, kej: hKed, kereta: hPasukan, saya: hSaya })[UI.tab]();
  return '<div class="hub6"><aside class="snav"><div class="brand">Grid to <b>Glory</b></div><nav>' + nav + '</nav><button class="btn sm" data-act="menu">Main menu</button></aside>' +
    '<main class="hmain"><div class="top htop"><div class="brand">Grid to <b>Glory</b></div><div class="meta"><span>' + (S.jr && S.jr.on ? 'Junior Series · ' : '') + 'Season ' + S.season + ' · Round ' + Math.min(S.round + 1, 10) + '/10</span><button class="btn sm" data-act="menu">Menu</button></div></div>' + body + '</main>' +
    '<nav class="bnav">' + nav + '</nav></div>';
}

function drvCard() {
  var p = me(), t = myTeam(), ds = driverStandings(S), pos = ds.indexOf(p) + 1;
  return '<div class="card dcard"><div class="row" style="gap:12px;flex-wrap:nowrap"><button class="hbtn" data-act="prof" data-v="d:' + p.id + '">' + avatarSVG(p, 64) + '</button><div style="min-width:0"><h2>' + esc(p.name) + ' <span class="dim" style="font-size:15px">#' + p.num + '</span></h2><p class="dim" style="margin:0">' + (typeof flagE === 'function' ? flagE(p.nat) + ' ' + natName(p.nat) : p.nat) + '</p><p class="dim">' + esc(t.name) + ' · age ' + p.age + ' · contract ' + S.contract + (S.contract === 1 ? ' season' : ' seasons') + ' · ' + payTxt(conOf(S, p).pay) + '</p></div><div style="margin-left:auto;text-align:center"><div class="big" style="font-size:36px;line-height:1">' + ovr(p) + '</div><small class="dim">Rating</small></div></div>' +
    (typeof objDrvHTML === 'function' ? objDrvHTML(S, p) : '') + '<div class="tiles3"><div><small>Standing</small><b>P' + pos + '</b></div><div><small>Points</small><b>' + p.pts + '</b></div><div><small>XP</small><b>' + S.xp + '</b></div><div><small>Morale</small><b>' + (S.morale == null ? 50 : S.morale) + '%</b></div></div></div>';
}
function hUtama() {
  var p = me(), t = myTeam(), h = '<div class="grid6' + (S.rival && S.rival.season === S.season ? ' hr' : '') + '">';
  h += '<div class="g-a">' + drvCard() + '</div>';
  if (S.round < 10) {
    var ci = S.cal[S.round], c = CIRCUITS[ci];
    h += '<div class="g-b card nextc stack"><div class="row sp" style="flex-wrap:nowrap;align-items:flex-start"><div class="stack" style="gap:6px;min-width:0"><div class="row" style="gap:8px">' + flagSVG(ci, 30) + '<h3>Round ' + (S.round + 1) + ' / 10 · next up</h3></div><h2 style="font-size:28px">' + c.name + '</h2><p class="dim">' + c.loc + '</p></div><div class="cirwrap">' + circuitSVG(ci, 120) + '</div></div>' +
      '<div class="row">' + circuitChips(c) + '</div><button class="btn pri wide" data-act="wk-start">Start race weekend →</button></div>';
  } else h += '<div class="g-b card nextc stack"><h3>Season ' + S.season + '</h3><h2>Season over</h2><p class="dim">All 10 rounds complete.</p><button class="btn pri wide" data-act="season-end">Season results →</button></div>';
  /* jubin */
  var res = S.results.map(function (r) { return r.dnf ? 20 : r.pos; }), ds = driverStandings(S), pos = ds.indexOf(p) + 1, ts = teamStandings(S), tpos = ts.indexOf(t) + 1;
  h += '<div class="g-c card"><h3>Season standing</h3><div class="row sp" style="flex-wrap:nowrap"><div><div class="bignum">P' + pos + '</div><p class="dim">' + p.pts + ' pts' + (p.wins ? ' · ' + p.wins + ' wins' : '') + '</p></div>' + spark(res.length ? res : [20], 120, 56) + '</div></div>';
  var parts = [['aero', 'Aero'], ['engine', 'Engine'], ['chassis', 'Chassis'], ['rel', 'Reliability']];
  h += '<div class="g-d card"><h3>Car · rank #' + teamRank(S, t.id) + '</h3><div class="pbars">' + parts.map(function (k) { var v = Math.round(t.car[k[0]]); return '<div><span>' + k[1] + '</span><i><u style="width:' + clamp((v - 45) / 54 * 100, 4, 100) + '%"></u></i><b>' + v + '</b></div>'; }).join('') + '</div></div>';
  h += '<div class="g-e card"><h3>Constructors</h3><div class="row sp" style="flex-wrap:nowrap"><div><div class="bignum">P' + tpos + '</div><p class="dim">' + t.pts + ' pts</p></div>' + carSVG(t, 110) + '</div><button class="btn sm" data-act="tab" data-v="kej">View standings →</button></div>';
  /* rival */
  if (S.rival && S.rival.season === S.season) {
    var rv = S.drivers[S.rival.di];
    h += '<div class="g-f card"><h3>Season rival</h3><div class="vs6">' + avatarSVG(p, 48) + '<div class="sc6"><b>' + S.rival.w + ' – ' + S.rival.l + '</b><small>H2H</small></div>' + avatarSVG(rv, 48) + '</div><p class="dim" style="text-align:center">' + esc(p.name.split(' ')[0]) + ' vs ' + esc(rv.name) + ' (' + S.teams[rv.team].short + ')</p></div>';
  }
  h += '<div class="g-gs stack">' + (typeof xpNudgeHTML === 'function' ? xpNudgeHTML('') : '') + (typeof sponBannerHTML === 'function' ? sponBannerHTML('') : '') + (typeof mktCard === 'function' ? mktCard('') : '') + newsCard('', 4) + '</div>';
  /* kalendar mini */
  var up = ''; for (var i = S.round; i < Math.min(10, S.round + 3); i++) { var cc = CIRCUITS[S.cal[i]]; up += '<div class="krow">' + flagSVG(S.cal[i], 24) + '<span class="mono dim">R' + (i + 1) + '</span><span>' + cc.name + '</span><span class="dim">' + laps2(cc) + ' laps</span></div>'; }
  if (up) h += '<div class="g-h card"><div class="row sp"><h3>Coming up</h3><button class="btn sm" data-act="tab" data-v="kal">Calendar →</button></div>' + up + '</div>';
  return h + '</div>';
}
function hKal() {
  var h = '<div class="card"><div class="row sp" style="margin-bottom:6px"><h3>Season calendar ' + S.season + '</h3><span class="dim">' + S.round + ' / 10 done</span></div><div class="krows">';
  for (var i = 0; i < 10; i++) {
    var ci = S.cal[i], c = CIRCUITS[ci], r = S.results[i], cur = i === S.round;
    var res = r ? (r.dnf ? '<span class="pill6 bad">DNF</span>' : '<span class="pill6 ' + (r.pos <= 3 ? 'pod' : r.pos <= 10 ? 'pts' : '') + '">P' + r.pos + '</span>') + (r.pts ? ' <span class="dim mono">' + r.pts + ' pts</span>' : '') : cur ? '<span class="pill6 now">Next</span>' : '<span class="dim">–</span>';
    h += '<div class="krow big clk' + (cur ? ' cur' : '') + '" data-act="th" data-v="' + ci + '"><span class="mono dim">R' + (i + 1) + '</span>' + flagSVG(ci, 30) + '<div style="min-width:0"><b>' + c.name + '</b><small class="dim">' + c.loc + ' · ' + laps2(c) + ' laps · rain ' + Math.round(c.rain * 100) + '%</small></div><div class="r6">' + res + '</div></div>';
  }
  return h + '</div><p class="dim" style="font-size:12.5px;margin:8px 2px 0">Tap a circuit to see its history.</p></div>';
}
var WIDE = window.matchMedia ? window.matchMedia('(min-width: 1100px)') : { matches: false };
if (WIDE.addEventListener) WIDE.addEventListener('change', function () { if (typeof UI !== 'undefined' && UI.screen === 'hub' && !document.querySelector('#modal > *')) render(); });
function hKed() {
  if (!WIDE.matches || UI.kedMode === 'j' || UI.kedMode === 'pf') return hKed1();
  var keep = UI.kedMode, seg = function (on) { return '<div class="seg" style="margin-bottom:12px;max-width:340px;grid-template-columns:repeat(3,1fr)"><button class="on" data-act="ked-m" data-v="p">Standings</button><button data-act="ked-m" data-v="j">Juniors</button><button data-act="ked-m" data-v="pf">Profiles</button></div>'; };
  var strip = function (x) { return x.replace(/^<div class="seg"[\s\S]*?<\/button><\/div>/, ''); };
  UI.kedMode = 'p'; var a = strip(hKed1()); UI.kedMode = 't'; var b = strip(hKed1()); UI.kedMode = keep;
  return seg(true) + '<div class="kedwide">' + a + b + '</div>';
}
function hKed1() {
  var mode = UI.kedMode || 'p', p = me(), h = '<div class="seg" style="margin-bottom:12px;max-width:480px;grid-template-columns:repeat(4,1fr)"><button class="' + (mode === 'p' ? 'on' : '') + '" data-act="ked-m" data-v="p">Drivers</button><button class="' + (mode === 't' ? 'on' : '') + '" data-act="ked-m" data-v="t">Teams</button><button class="' + (mode === 'j' ? 'on' : '') + '" data-act="ked-m" data-v="j">Juniors</button><button class="' + (mode === 'pf' ? 'on' : '') + '" data-act="ked-m" data-v="pf">Profiles</button></div>'; if (mode === 'pf') return h + hProf(); h += '<div class="card">';
  if (mode === 'p') {
    var ds = driverStandings(S);
    h += '<div class="scroll"><table class="t"><thead><tr><th>#</th><th>Driver</th><th class="r">OVR</th><th class="r">Wins</th><th class="r">Pts</th></tr></thead><tbody>';
    ds.forEach(function (d, i) { h += '<tr class="' + (d === p ? 'me' : '') + ' clk" data-act="prof" data-v="d:' + d.id + '"><td class="mono dim">' + (i + 1) + '</td><td><div class="row" style="gap:8px;flex-wrap:nowrap">' + avatarSVG(d, 28) + '<span>' + tagD(d) + ' ' + esc(d.name) + (S.rival && d.id === S.rival.di ? ' <span class="pill6 pod">rival</span>' : '') + '</span></div></td><td class="r mono dim">' + ovr(d) + '</td><td class="r mono">' + d.wins + '</td><td class="r mono"><b>' + d.pts + '</b></td></tr>'; });
  } else if (mode === 'j') {
    var J = S.juniors.map(function (j, i) { return { j: j, i: i }; }).sort(function (a, b) { return (a.j.jr.last || 99) - (b.j.jr.last || 99) || rating(b.j) - rating(a.j); });
    h += '<p class="dim" style="font-size:12.5px;margin:0 0 8px">' + JR_NAME + ': the next generation. When a seat opens, the best-rated junior gets promoted.' + (S.jrChamp ? ' Reigning champion: <b>' + esc(S.jrChamp.name) + '</b>.' : '') + '</p>';
    h += '<div class="scroll"><table class="t"><thead><tr><th>#</th><th>Driver</th><th class="r">Age</th><th class="r">OVR</th><th class="r">Potential</th></tr></thead><tbody>';
    J.forEach(function (x, k) { var j = x.j; h += '<tr class="clk" data-act="prof" data-v="j:' + x.i + '"><td class="mono dim">' + (j.jr.last || '–') + '</td><td>' + flagE(j.nat) + ' ' + esc(j.name) + (j.jr.titles ? ' <span class="pill6 pod">champ</span>' : '') + '<br><small class="dim">' + DTYPES[typeOf(j)].n + '</small></td><td class="r mono">' + j.age + '</td><td class="r mono"><b>' + ovr(j) + '</b></td><td class="r">' + starsH(potStars(j.pot)) + '</td></tr>'; });
  } else {
    var ts = teamStandings(S);
    h += '<div class="scroll"><table class="t"><thead><tr><th>#</th><th>Team</th><th class="r">Wins</th><th class="r">Pts</th></tr></thead><tbody>';
    ts.forEach(function (t, i) { h += '<tr class="' + (t.id === p.team ? 'me' : '') + ' clk" data-act="tprof" data-v="' + t.id + '"><td class="mono dim">' + (i + 1) + '</td><td><div class="row" style="gap:8px;flex-wrap:nowrap">' + carSVG(t, 54) + '<span>' + tagT(t) + ' ' + t.name + '</span></div></td><td class="r mono">' + t.wins + '</td><td class="r mono"><b>' + t.pts + '</b></td></tr>'; });
  }
  return h + '</tbody></table></div></div>';
}
A['ked-m'] = function (d) { UI.kedMode = d.v; render(); };
function hPasukan() {
  var t = myTeam(), mates = S.drivers.filter(function (d) { return d.team === t.id; });
  var h = '<div class="card nextc carhero"><div class="chr"><div class="chl"><h3>Your team</h3><h2 style="font-size:26px">' + t.name + '</h2><p class="dim">' + mates.map(function (d) { return esc(d.name); }).join(' · ') + '</p>' + (TEAMS[t.id] && TEAMS[t.id].base && t.name === TEAMS[t.id].name ? '<p class="dim" style="font-size:12.5px;margin-top:2px">' + TEAMS[t.id].base + ' · Est. ' + TEAMS[t.id].founded + ' · ' + TEAMS[t.id].titles + ' titles · ' + TEAMS[t.id].engine + '</p>' : '') + '<button class="btn sm tpbtn" data-act="tprof" data-v="' + t.id + '">Team profile →</button><div class="chm">' + mates.map(function (d) { return '<button class="hbtn" data-act="prof" data-v="d:' + d.id + '">' + helmetSVG(d, 40, false) + '</button>'; }).join('') + '</div></div><div class="carbig">' + carSVG(t, 132, true) + '</div></div></div>';
  return h + tKereta();
}
function hSaya() { return '<div class="stack">' + drvCard() + (typeof tmCardHTML === 'function' ? tmCardHTML() : '') + (typeof sponCardHTML === 'function' ? sponCardHTML() : '') + tPemandu() + tKerjaya() + '</div>'; }
