'use strict';
/* ===== Home v3: "Race Day Paddock" — broadcast hero, start lights, licence card, timing tower, mission, road map ===== */

var HP = { timers: [], run: false };
function hpLevel(n) { return '<i class="hp-pips" data-n="' + n + '"><u></u><u></u><u></u></i>'; }
function hpFc(label, value, n) { return '<div class="hp-fc"><small>' + label + '</small><b>' + value + '</b>' + (n ? hpLevel(n) : '') + '</div>'; }
function hpTrackSVG(ci) {
  var d = buildTrack(ci).d;
  return '<svg class="hp-track" viewBox="20 20 360 200" aria-hidden="true">' +
    '<path d="' + d + '" fill="none" stroke="#ffffff14" stroke-width="20" stroke-linejoin="round"/>' +
    '<path class="hp-track-line" pathLength="1" d="' + d + '" fill="none" stroke="#fff" stroke-width="7" stroke-linejoin="round" stroke-linecap="round"/>' +
    '<path d="' + d + '" fill="none" stroke="#0b0f1e" stroke-width="1.5" stroke-dasharray="3 9" opacity=".55"/>' +
    '<circle class="hp-track-car" r="7" fill="#ffd24a" stroke="#0b0f1e" stroke-width="2.5"><animateMotion dur="7s" begin="1.2s" repeatCount="indefinite" path="' + d + '"/></circle></svg>';
}
function hpMood(m) { return m >= 80 ? ['Flying', 5] : m >= 62 ? ['Confident', 4] : m >= 42 ? ['Steady', 3] : m >= 25 ? ['Frustrated', 2] : ['Rock bottom', 1]; }
function hpOvrDelta(p) {
  var now = ovr(p), h = S.hp;
  if (!h) h = S.hp = { s: S.season, r: S.round, base: now, prev: now };
  if (h.r !== S.round || h.s !== S.season) { h.prev = h.base; h.base = now; h.r = S.round; h.s = S.season; }
  return now - h.prev;
}

/* ---------- hero: next race, broadcast style ---------- */
function hpHero() {
  var t = myTeam(), n = seasonRounds(S);
  if (S.round >= n) {
    return '<section class="hp-hero done" style="--tc:' + t.color + '"><div class="hp-hero-main"><span class="hp-eyebrow"><i class="hp-chq"></i>Season ' + S.season + ' · chequered flag</span><h1>Season over</h1><p class="hp-loc">All ' + n + ' rounds complete. Time to see where you finished.</p></div>' +
      '<button class="hp-go plain" data-act="season-end"><span class="hp-go-t">Season results<small>Standings, awards and offers</small></span><span class="hp-go-arrow">→</span></button></section>';
  }
  var ci = S.cal[S.round], c = circuitFor(S, ci), rain = Math.round(c.rain * 100);
  var lights = ''; for (var i = 0; i < 5; i++) lights += '<i></i>';
  return '<section class="hp-hero" style="--tc:' + t.color + '">' +
    '<div class="hp-hero-main"><span class="hp-eyebrow"><i class="hp-live"></i>Round ' + (S.round + 1) + ' / ' + n + ' · next race</span>' +
    '<div class="hp-title">' + flagSVG(ci, 44) + '<h1>' + c.name + '</h1></div><p class="hp-loc">' + c.loc + ' · ' + laps2(c) + ' laps × ' + c.km.toFixed(1) + ' km</p>' +
    '<div class="hp-fcs">' + hpFc('Rain', rain + '%', rain >= 45 ? 3 : rain >= 20 ? 2 : 1) + hpFc('Tyre wear', c.wear < 0.95 ? 'Low' : c.wear < 1.15 ? 'Medium' : 'High', c.wear < 0.95 ? 1 : c.wear < 1.15 ? 2 : 3) +
    hpFc('Overtaking', c.ot < 0.5 ? 'Easy' : c.ot < 0.7 ? 'Medium' : 'Hard', c.ot < 0.5 ? 1 : c.ot < 0.7 ? 2 : 3) + hpFc('Engine', c.pw >= 0.55 ? 'Key' : c.pw <= 0.4 ? 'Minor' : 'Medium', c.pw >= 0.55 ? 3 : c.pw <= 0.4 ? 1 : 2) + '</div></div>' +
    '<div class="hp-hero-art">' + hpTrackSVG(ci) + '</div>' +
    '<button class="hp-go" data-act="wk-start" data-lights="1"><span class="hp-lights" aria-hidden="true">' + lights + '</span><span class="hp-go-t">Start race weekend<small>Qualifying, strategy, race</small></span><span class="hp-go-arrow">→</span></button></section>';
}

/* ---------- driver: superlicence card ---------- */
function hpLicence() {
  var p = me(), t = myTeam(), m = S.morale == null ? 50 : S.morale, mood = hpMood(m), dl = hpOvrDelta(p), c = conOf(S, p);
  var cheap = Math.min.apply(null, PROGRESSION.stats.filter(function (k) { return p[k] < statCap(S, k); }).map(function (k) { return skillCost(p[k], S, k); })), canTrain = isFinite(cheap) && S.xp >= cheap;
  var segs = ''; for (var i = 1; i <= 5; i++) segs += '<u class="' + (i <= mood[1] ? 'on' : '') + '"></u>';
  return '<article class="hp-lic" style="--tc:' + t.color + '"><span class="hp-lic-num" aria-hidden="true">' + p.num + '</span>' +
    '<header><span>Driver licence</span><span>' + (typeof leagueOf === 'function' ? leagueOf(S).toUpperCase() : 'F1') + ' · S' + S.season + '</span></header>' +
    '<button class="hp-lic-id" data-act="prof" data-v="d:' + p.id + '" aria-label="Open driver profile">' + helmetSVG(p, 104, false) +
    '<span class="hp-lic-name"><b>' + esc(p.name) + '</b><span>' + (typeof flagE === 'function' ? flagE(p.nat) + ' ' + natName(p.nat) : p.nat) + ' · age ' + p.age + '</span><span class="hp-lic-team"><i></i>' + esc(t.name) + '</span></span></button>' +
    '<div class="hp-lic-ovr"><small>OVR</small><b>' + ovr(p) + '</b>' + (dl ? '<em class="' + (dl > 0 ? 'up' : 'dn') + '">' + (dl > 0 ? '▲ +' : '▼ ') + dl + '</em>' : '<em>rating</em>') + '</div>' +
    '<div class="hp-lic-stats"><button class="hp-stat' + (canTrain ? ' pulse' : '') + '" data-act="tab" data-v="aku"><small>XP</small><b>' + S.xp + '</b><span>' + (canTrain ? 'Ready to train →' : 'Earn more on track') + '</span></button>' +
    '<div class="hp-stat"><small>Morale</small><b>' + mood[0] + '</b><span class="hp-mood m' + mood[1] + '">' + segs + '</span></div>' +
    '<div class="hp-stat"><small>Contract</small><b>' + S.contract + (S.contract === 1 ? ' season' : ' seasons') + '</b><span>' + payTxt(c.pay) + ' / season</span></div></div></article>';
}

/* ---------- standings: TV timing tower ---------- */
function hpTower() {
  var p = me(), t = myTeam(), ds = driverStandings(S), pos = ds.indexOf(p), n = ds.length, rows = 6;
  var a = clamp(pos - 3, 0, Math.max(0, n - rows)), list = ds.slice(a, a + rows), ts = teamStandings(S), tpos = ts.indexOf(t) + 1;
  var h = '<article class="hp-tower"><header><span>Drivers’ championship</span><span>' + (S.round ? 'After R' + S.round : 'Pre-season') + '</span></header><ol>';
  if (a > 0) { var ld = ds[0]; h += '<li class="lead" style="--tc:' + S.teams[ld.team].color + '"><span class="pos">1</span><i></i><b>' + esc(ld.code || ld.name.slice(0, 3).toUpperCase()) + '</b><span class="nm">' + esc(ld.name.split(' ').slice(-1)[0]) + '</span><span class="pts">' + ld.pts + '</span><span class="gap">' + (ld.pts - p.pts ? '+' + (ld.pts - p.pts) : '–') + '</span></li><li class="cut" aria-hidden="true"></li>'; }
  list.forEach(function (d, i) {
    var g = d.pts - p.pts;
    h += '<li class="' + (d === p ? 'me' : '') + '" style="--tc:' + S.teams[d.team].color + '"><span class="pos">' + (a + i + 1) + '</span><i></i><b>' + esc(d.code || d.name.slice(0, 3).toUpperCase()) + '</b><span class="nm">' + esc(d.name.split(' ').slice(-1)[0]) + '</span><span class="pts">' + d.pts + '</span><span class="gap">' + (d === p ? 'YOU' : g ? (g > 0 ? '+' : '') + g : '–') + '</span></li>';
  });
  h += '</ol>';
  var ahead = pos > 0 ? ds[pos - 1] : null, form = S.results.slice(-5);
  h += '<p class="hp-chase">' + (S.round === 0 ? 'Everyone starts on zero. Lights out decides the rest.' : !ahead ? 'You lead the championship. Everyone is chasing you.' : ahead.pts - p.pts === 0 ? 'Level on points with <b>' + esc(ahead.name.split(' ').slice(-1)[0]) + '</b>. One place decides it.' : '<b>' + (ahead.pts - p.pts) + ' pts</b> to catch ' + esc(ahead.name.split(' ').slice(-1)[0]) + ' for P' + pos + '.') + '</p>';
  if (form.length) h += '<div class="hp-form"><small>Form</small>' + form.map(function (r) { return '<span class="' + (r.dnf ? 'bad' : r.pos <= 3 ? 'pod' : r.pts ? 'pts' : '') + '">' + (r.dnf ? 'DNF' : 'P' + r.pos) + '</span>'; }).join('') + '</div>';
  h += '<button class="hp-cons" data-act="tab" data-v="kej" style="--tc:' + t.color + '">' + carSVG(t, 74) + '<span><small>Constructors</small><b>P' + tpos + ' · ' + t.pts + ' pts</b></span><em>Standings →</em></button></article>';
  return h;
}

/* ---------- mission + road to F1 ---------- */
function hpMission() {
  var p = me(), o = p.obj; if (!o) return '';
  var st = objStatus(S, p) || { k: 'new', txt: 'Season starts' };
  return '<article class="hp-mission ' + st.k + '"><header><span>Season mission</span><span class="hp-badge">' + (st.k === 'ok' ? '✓ ' : '') + st.txt + '</span></header><h2>' + esc(o.txt) + '</h2><p>Set by the team. Hit it and they will want to keep you. Miss it and your seat is under review.</p></article>';
}
function hpRoad() {
  if (S.mode !== 'pro' || leagueOf(S) === 'f1') return '';
  var l = leagueOf(S), st = ['f3', 'f2', 'f1'], at = st.indexOf(l), lic = S.market8.license, pts = lic.earned ? 40 : clamp(lic.points, 0, 40), t = myTeam();
  return '<article class="hp-road" style="--tc:' + t.color + '"><header><span>Road to F1</span><span>' + (S.career.juniorTitles || 0) + ' junior titles</span></header>' +
    '<div class="hp-road-map" data-at="' + at + '"><i class="hp-road-line"><u style="width:' + (at * 50) + '%"></u></i>' + st.map(function (s, i) { return '<div class="hp-cp ' + (i < at ? 'past' : i === at ? 'now' : '') + '"><span>' + (i === at ? carSVG(t, 58) : i < at ? '✓' : i === 2 ? '🏁' : '') + '</span><b>' + s.toUpperCase() + '</b><small>' + (i === at ? 'You are here' : i < at ? 'Cleared' : i === 2 ? 'The dream' : 'Next step') + '</small></div>'; }).join('') + '</div>' +
    '<div class="hp-sl"><div><b>Superlicence</b><span>' + (lic.earned ? 'Secured' : pts + ' / 40 pts') + '</span></div><i role="progressbar" aria-label="F1 licence points" aria-valuemin="0" aria-valuemax="40" aria-valuenow="' + pts + '"><u style="width:' + (pts / 40 * 100) + '%"></u></i>' +
    '<small>' + (lic.earned ? 'Licence done. Now earn the seat.' : l === 'f3' ? 'Win F3 for a funded F2 promotion. ' + (40 - pts) + ' licence pts to go for F1.' : (40 - pts) + ' pts to go, and you must be 18+ for an F1 debut.') + '</small></div>' +
    '<button class="btn sm" data-act="tab" data-v="kerjaya">Career plan →</button></article>';
}

/* ---------- rival poster ---------- */
var HP_TAUNT = ['“He is not on my radar.”', '“Ask me again when he beats me.”', '“I respect him. I just finish ahead of him.”', '“Rivalry? He has to be closer for that.”', '“See you in the mirrors.”'];
function hpRival() {
  if (!S.rival || S.rival.season !== S.season) return '';
  var p = me(), rv = S.drivers[S.rival.di]; if (!rv) return '';
  var w = S.rival.w, l = S.rival.l;
  return '<article class="hp-rival" style="--tc:' + myTeam().color + ';--rc:' + S.teams[rv.team].color + '"><header><span>Season rival</span><span>Head to head</span></header><div class="hp-vs"><div>' + helmetSVG(p, 72, false) + '<b>' + esc(p.name.split(' ').slice(-1)[0]) + '</b></div><div class="hp-vs-sc"><b>' + w + '<i>–</i>' + l + '</b><small>VS</small></div><div>' + helmetSVG(rv, 72, false) + '<b>' + esc(rv.name.split(' ').slice(-1)[0]) + '</b></div></div>' +
    '<p>' + (w > l ? 'You are winning the duel. Keep him behind.' : w < l ? esc(rv.name.split(' ').slice(-1)[0]) + ' says: ' + HP_TAUNT[(h32(rv.name) + S.round) % HP_TAUNT.length] : esc(rv.name.split(' ').slice(-1)[0]) + ' says: ' + HP_TAUNT[(h32(rv.name) + S.round) % HP_TAUNT.length]) + '</p></article>';
}

/* ---------- coming up: circuit outlines ---------- */
function hpNext() {
  var n = seasonRounds(S), up = '';
  for (var i = S.round + 1; i < Math.min(n, S.round + 4); i++) { var cc = circuitFor(S, S.cal[i]); up += '<button class="hp-up" data-act="th" data-v="' + S.cal[i] + '"><span class="hp-up-art">' + circuitSVG(S.cal[i], 64, 'currentColor') + '</span><small>R' + (i + 1) + '</small><b>' + cc.name + '</b><span>' + laps2(cc) + ' laps · rain ' + Math.round(cc.rain * 100) + '%</span></button>'; }
  if (!up) return '';
  return '<article class="hp-ups"><header><span>Coming up</span><button class="btn sm" data-act="tab" data-v="kal">Calendar →</button></header><div>' + up + '</div></article>';
}

hUtama = function () {
  var feed = careerNudgeHTML() + (typeof sponBannerHTML === 'function' ? sponBannerHTML('') : '');
  return '<div class="hp' + (HP.seen === S.season + ':' + S.round ? ' seen' : '') + '">' + hpHero() +
    '<div class="hp-cols"><div class="hp-col">' + hpLicence() + hpMission() + '</div><div class="hp-col">' + hpTower() + '</div><div class="hp-col">' + hpRoad() + hpRival() + hpNext() + '</div></div>' +
    (feed ? '<div class="hp-feed">' + feed + '</div>' : '') + newsCard('', 4) + '</div>';
};
/* entry animations only play the first time Home is shown for a round */
var hpRender0 = render;
render = function () { var r = hpRender0.apply(this, arguments); try { if (UI.screen === 'hub' && UI.tab === 'utama' && S) HP.seen = S.season + ':' + S.round; } catch (e) { } return r; };

/* ---------- start lights: five reds, lights out, go ---------- */
function hpStop() { HP.timers.forEach(clearTimeout); HP.timers = []; HP.run = false; }
var hpWk0 = A['wk-start'];
A['wk-start'] = function (d, b) {
  var still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!d || !d.lights || !b || still || navigator.webdriver || HP.run) { hpStop(); return hpWk0(d, b); }   /* second tap skips the sequence */
  HP.run = true; b.classList.add('run');
  var L = b.querySelectorAll('.hp-lights i');
  for (var i = 0; i < 5; i++) (function (i) { HP.timers.push(setTimeout(function () { if (L[i]) L[i].classList.add('on'); snd('light'); }, 60 + i * 210)); })(i);
  HP.timers.push(setTimeout(function () { b.classList.add('out'); snd('go'); }, 60 + 5 * 210 + 240));
  HP.timers.push(setTimeout(function () { hpStop(); hpWk0(d, b); }, 60 + 5 * 210 + 240 + 320));
};
