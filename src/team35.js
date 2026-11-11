'use strict';
/* ===== Team v3: Team Garage. Presentation only: development, finance, orders and facility rules are unchanged. ===== */
var TG = { seen: null, pop: null };
var TG_PARTS = [['aero', 'Aero', 'Wings and floor'], ['engine', 'Engine', 'Power unit'], ['chassis', 'Chassis', 'Suspension and balance'], ['rel', 'Reliability', 'Finishing races']];
var TG_ICO = {
  aero: 'M3 8h11a3 3 0 1 0-3-3M3 12h15a3 3 0 1 1-3 3M3 16h7',
  engine: 'M13 2 4 14h7l-1 8 9-12h-7z',
  chassis: 'M12 2l9 5v10l-9 5-9-5V7zM12 12l9-5M12 12v10M12 12 3 7',
  rel: 'M12 2l8 3v6c0 5-3.4 9-8 11-4.6-2-8-6-8-11V5zM8.5 12l2.5 2.5 4.5-5',
  setup: 'M4 6h9M17 6h3M4 12h3M11 12h9M4 18h11M19 18h1M15 4v4M9 10v4M17 16v4',
  crew: 'M12 21a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM12 13V9M9 2h6M19 6l1.5-1.5',
  coaching: 'M4 14a8 8 0 0 1 16 0M4 14v4h4v-6H4zM20 14v4h-4v-6h4zM16 18c0 2-1.5 3-4 3'
};
function tgIco(k) { return '<svg class="tg-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="' + TG_ICO[k] + '" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'; }
function tgHelp(title, body) { return '<details class="driver-help dg-help"><summary>' + title + '</summary>' + body + '</details>'; }
function tgHead(eyebrow, title, tag) { return '<div class="tg-head"><div><small>' + eyebrow + '</small><h2>' + title + '</h2></div>' + (tag ? '<span class="tg-tag">' + tag + '</span>' : '') + '</div>'; }
function tgRing(frac, text, sub, tone) {
  var c = 2 * Math.PI * 40, f = clamp(frac, 0, 1);
  return '<div class="tg-ring ' + (tone || '') + '"><svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" stroke-opacity=".16" stroke-width="10"/><circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" stroke-width="10" stroke-linecap="round" stroke-dasharray="' + (c * f).toFixed(1) + ' ' + c.toFixed(1) + '" transform="rotate(-90 50 50)"/></svg><b>' + text + '</b>' + (sub ? '<small>' + sub + '</small>' : '') + '</div>';
}
function tgPart(t, k) {
  var sorted = S.teams.slice().sort(function (a, b) { return b.car[k] - a.car[k]; }), rank = sorted.indexOf(t) + 1, n = S.teams.length;
  return { v: Math.round(t.car[k]), rank: rank, n: n, best: sorted[0], gap: Math.round(sorted[0].car[k] - t.car[k]), tone: rank <= Math.ceil(n * 0.3) ? 'good' : rank <= Math.ceil(n * 0.6) ? 'mid' : 'bad' };
}

/* ---------- hero: the car in the garage ---------- */
function tgHero(t, junior) {
  var m = teamHQMeta(t), league = (t.spec || leagueOf(S)).toUpperCase(), rank = teamStandings(S).indexOf(t) + 1;
  var stats = [['Standing', 'P' + rank], ['Points', t.pts], ['Wins', t.wins || 0], junior ? ['Car', 'Spec'] : ['Car pace', '#' + teamRank(S, t.id)], ['Round', S.round + '/' + seasonRounds(S)]];
  return '<section class="tg-hero"><span class="tg-water" aria-hidden="true">' + esc(t.short) + '</span>' +
    '<div class="tg-hero-copy"><div class="tg-eyebrow"><i></i>' + league + ' · Team HQ</div><h1>' + esc(t.name) + '</h1>' +
    '<p class="tg-loc">' + flagE(m.nat) + ' ' + esc(m.base) + (m.founded ? ' · Est. ' + m.founded : '') + '</p><p class="tg-story">' + esc(m.blurb) + '</p>' +
    '<div class="team-hero-actions"><button class="btn" data-act="team-season">Standings →</button></div></div>' +
    '<div class="tg-bay"><div class="tg-bay-top"><span>Garage ' + esc(t.short) + '</span><span>' + (junior ? 'Shared ' + league + ' specification' : 'Season ' + S.season + ' challenger') + '</span></div>' +
    '<div class="tg-bay-car">' + carSVG(t, 520) + '<div class="tg-bay-mirror" aria-hidden="true">' + carSVG(t, 520) + '</div></div></div>' +
    '<div class="tg-strip">' + stats.map(function (s) { return '<div><small>' + s[0] + '</small><b>' + s[1] + '</b></div>'; }).join('') + '</div></section>';
}

/* ---------- constructors battle ---------- */
function tgBattle(t) {
  var st = teamStandings(S), i = st.indexOf(t), from = clamp(i - 1, 0, Math.max(0, st.length - 3)), rows = st.slice(from, from + 3), target = t.dev && t.dev.target;
  var gapUp = i > 0 ? st[i - 1].pts - t.pts : 0, gapDn = i < st.length - 1 ? t.pts - st[i + 1].pts : 0;
  return '<section class="card team-panel team-season tg-battle">' + tgHead('Championship', 'Constructors battle', 'Season ' + S.season) +
    '<div class="tg-battle-rows">' + rows.map(function (x) { var p = st.indexOf(x) + 1; return '<div class="tg-battle-row ' + (x === t ? 'me' : '') + '" style="--tc:' + x.color + '"><span class="tg-pos">P' + p + '</span><i></i><b>' + esc(x.name) + '</b><span class="tg-pts">' + x.pts + '<small> pts</small></span></div>'; }).join('') + '</div>' +
    '<div class="tg-chase">' + (i > 0 ? '<span class="up">▲ ' + gapUp + ' pts to P' + i + '</span>' : '<span class="up">★ Leading the championship</span>') + (i < st.length - 1 ? '<span class="dn">▼ ' + gapDn + ' pts ahead of P' + (i + 2) + '</span>' : '') + '</div>' +
    (target ? '<div class="tg-target ' + (i + 1 <= target ? 'ok' : 'off') + '"><small>Boss\'s target</small><b>P' + target + '</b><span>' + (i + 1 <= target ? 'On target' : (i + 1 - target) + ' place' + (i + 1 - target > 1 ? 's' : '') + ' behind') + '</span></div>' : '') +
    '<div class="tg-progress"><span>' + S.round + ' / ' + seasonRounds(S) + ' rounds complete</span>' + driverMeter(S.round, seasonRounds(S), 'Season completed rounds') + '</div>' +
    '<button class="btn sm" data-act="team-season">View championship →</button></section>';
}

/* ---------- car blueprint ---------- */
function tgBlueprint(t) {
  var P = {}, tiles = {};
  TG_PARTS.forEach(function (k) { P[k[0]] = tgPart(t, k[0]); });
  TG_PARTS.forEach(function (k) {
    var p = P[k[0]], dev = S.rd === k[0];
    tiles[k[0]] = '<div class="tg-bp-tile ' + p.tone + (dev ? ' dev' : '') + '"><div class="tg-bp-tile-h">' + tgIco(k[0]) + '<span><b>' + k[1] + '</b><small>' + k[2] + '</small></span>' + (dev ? '<em>In dev</em>' : '') + '</div>' +
      '<div class="tg-bp-tile-v"><b>' + p.v + '</b><span>#' + p.rank + '<small> of ' + p.n + '</small></span></div><i><u style="width:' + clamp(p.v, 0, 100) + '%"></u></i>' +
      '<p>' + (p.rank === 1 ? 'Best on the grid' : '−' + p.gap + ' to ' + esc(p.best.short)) + '</p></div>';
  });
  /* hotspots in car coordinates (700 x 274, nose to the right) */
  var hs = { aero: [636, 137, 700, 30], chassis: [420, 137, 700, 244], engine: [250, 137, 0, 30], rel: [120, 137, 0, 244] }, lines = '', dots = '';
  TG_PARTS.forEach(function (k) {
    var h = hs[k[0]], right = h[2] > 350, kx = right ? h[0] + 46 : h[0] - 46;
    lines += '<polyline class="' + P[k[0]].tone + '" points="' + h[0] + ',' + h[1] + ' ' + kx + ',' + h[3] + ' ' + h[2] + ',' + h[3] + '"/>';
    dots += '<circle class="' + P[k[0]].tone + '" cx="' + h[0] + '" cy="' + h[1] + '" r="9"/>';
  });
  return '<section class="tg-bp">' +
    '<div class="tg-bp-head"><div><small>Technical file</small><h2>' + esc(t.short) + ' car blueprint</h2></div><div class="tg-bp-pace"><small>Car pace</small><b>' + teamPower(t).toFixed(1) + '</b><span>#' + teamRank(S, t.id) + ' of ' + S.teams.length + '</span></div></div>' +
    '<div class="tg-bp-stage"><div class="tg-bp-side">' + tiles.engine + tiles.rel + '</div>' +
    '<div class="tg-bp-car">' + carSVG(t, 700) + '<svg class="tg-bp-lines" viewBox="0 0 700 274" aria-hidden="true">' + lines + dots + '</svg></div>' +
    '<div class="tg-bp-side">' + tiles.aero + tiles.chassis + '</div></div></section>';
}

/* ---------- R&D workshop ---------- */
function tgWorkshop(t) {
  var ds = t.dev && typeof devStatus === 'function' ? devStatus(t) : null, tp = t.dev && t.dev.tp, pc = ds ? Math.min(100, Math.round(ds.prog / ds.th * 100)) : 0;
  var h = '<section class="card team-panel tg-work">' + tgHead('R&amp;D workshop', 'Pick the focus', 'Your call');
  h += '<div class="tg-rd">' + TG_PARTS.map(function (k) {
    var p = tgPart(t, k[0]), on = S.rd === k[0];
    return '<button class="tg-rd-btn ' + (on ? 'on' : '') + (TG.pop === k[0] ? ' pop' : '') + '" data-act="rd" data-v="' + k[0] + '" aria-pressed="' + on + '">' + tgIco(k[0]) + '<b>' + k[1] + '</b><span>' + p.v + ' · #' + p.rank + '</span><em>' + (on ? 'In development' : 'Select') + '</em></button>';
  }).join('') + '</div>';
  if (ds) {
    h += '<div class="tg-next">' + tgRing(ds.banked ? 1 : pc / 100, ds.banked ? '—' : pc + '%', '', pc >= 100 ? 'good' : '') +
      '<div><small>Next upgrade</small><b>' + (ds.banked ? 'Switched to next year\'s car' : (RDNAME[ds.k] || 'New') + ' package') + '</b><p>' +
      (ds.banked ? 'The boss has given up on this season. Everything goes into the winter package.' : esc(tp.name) + ' decides when it goes on the car. ' + (tp.amb >= 2 ? 'Expect it early.' : tp.amb <= 0 ? 'He likes to wait for a big step.' : 'Usually when it\'s properly ready.')) + '</p></div></div>';
  }
  h += tgHelp('How development works', '<p>No fixed upgrade calendar: each team principal decides when their package is ready. Patient bosses wait for a big, safer step; teams under pressure rush parts out, and rushed parts fail more often. Your team follows this R&amp;D focus, helped by your feedback skill. Every few seasons, new regulations can shake up the whole grid.</p>');
  if (S.rdLog && S.rdLog.length) h += '<div class="tg-log"><small>Development log</small>' + S.rdLog.slice(0, 5).map(function (l) { return '<p>' + esc(l) + '</p>'; }).join('') + '</div>';
  return h + '</section>';
}

/* ---------- budget and factory ---------- */
function tgFactory(t) {
  var f = t.fin, d = t.dev; if (!f || !d) return '';
  if (typeof facInit === 'function') facInit(S);
  var st = finStatus(t), p = d.prog || 0, cost = finCostOf(DEV.pkg * Math.max(p, 1.0) / DEV.std, p < 1.2, p >= 2.0), ok = finAvail(t) >= cost;
  var fill = clamp(f.cash / Math.max(f.fund, 1) * 100, 0, 100), mark = clamp((f.cash - cost) / Math.max(f.fund, 1) * 100, 0, 100);
  var h = '<section class="card team-panel tg-factory">' + tgHead('Factory', 'Budget &amp; facilities', st.txt);
  h += '<div class="tg-fund ' + st.k + '"><div class="tg-fund-top"><div><small>R&amp;D fund left</small><b>$' + Math.round(f.cash) + 'M</b><span>of $' + Math.round(f.fund) + 'M</span></div><div class="r"><small>Next package costs</small><b>~$' + Math.round(cost) + 'M</b><span class="' + (ok ? 'ok' : 'no') + '">' + (ok ? 'Affordable' : 'Over budget: it will be scaled down') + '</span></div></div>' +
    '<div class="tg-tank" role="meter" aria-label="R&amp;D fund left" aria-valuemin="0" aria-valuemax="' + Math.round(f.fund) + '" aria-valuenow="' + Math.round(f.cash) + '"><i style="width:' + fill + '%"></i>' + (f.cash > cost ? '<u style="left:' + mark + '%;width:' + (fill - mark) + '%"></u>' : '') + '</div>' +
    '<div class="tg-tank-key"><span><i class="a"></i>Fund</span><span><i class="b"></i>Next package</span></div></div>';
  if (t.fac) {
    var lvl = clamp(Math.round(t.fac.lvl), 1, 5), mul = Math.round((facMul(t) - 1) * 100), used = S.facLobby === S.season;
    h += '<div class="tg-fac"><div class="tg-fac-top"><div><small>Facilities</small><b>' + facName(t) + '</b></div><div class="tg-pips" aria-label="Facility level ' + lvl + ' of 5">' + [1, 2, 3, 4, 5].map(function (n) { return '<i class="' + (n <= lvl ? 'on' : '') + '"></i>'; }).join('') + '</div><span class="tg-mul ' + (mul >= 0 ? 'ok' : 'no') + '">R&amp;D ' + (mul >= 0 ? '+' : '') + mul + '%</span></div>' +
      '<div class="tg-fac-list"><span>Wind tunnel</span><span>Simulator</span><span>Factory</span></div>' +
      '<p class="tg-note">Engine: <b>' + esc(engLabel(S, t)) + '</b>.' + (f.loan > 0.5 ? ' Team loan: $' + Math.round(f.loan) + 'M.' : '') + (t.fac.lvl >= 3.5 ? (S.mode === 'pro' ? ' The simulator earns you up to 6 XP per season.' : ' The simulator earns you +1 XP every race.') : '') + '</p>' +
      (used ? '<button class="btn sm" disabled>You already pushed the board this season</button>' : '<button class="btn sm" data-act="fac-lobby">Push the board for investment</button>') +
      tgHelp('What does pushing the board do?', '<p>Wind tunnel, simulator and factory grow with the team\'s income and make every upgrade package a bit better. Pushing the board costs some goodwill with the team; facilities get a nudge up next winter. Once per season.</p>') + '</div>';
  }
  return h + '</section>';
}

/* ---------- pit wall: the people in charge ---------- */
function tgBoss(t) {
  var d = t.dev; if (!d || !d.tp) return '';
  var tp = d.tp, skill = Math.round((tp.skill - 0.75) / 0.5 * 100), staff = Math.round((d.staff - 0.8) / 0.4 * 100), ini = tp.name.split(' ').map(function (w) { return w[0]; }).join('').slice(0, 2);
  var style = tp.amb >= 2 ? ['Aggressive', 'Sets bold targets and pushes parts out early.'] : tp.amb <= 0 ? ['Cautious', 'Plays it safe and waits for a big step.'] : ['Balanced', 'Brings parts when they are properly ready.'];
  return '<section class="card team-panel tg-boss">' + tgHead('Pit wall', 'Who runs the team', style[0]) +
    '<div class="tg-boss-id"><span class="tg-avatar" aria-hidden="true">' + esc(ini) + '</span><div><small>Team principal</small><b>' + esc(tp.name) + '</b><p>' + (tp.age ? 'Age ' + tp.age + ' · ' : '') + style[1] + '</p></div></div>' +
    '<div class="tg-bars"><div><span><small>Principal rating</small><b>' + clamp(skill, 0, 100) + '</b></span>' + driverMeter(skill, 100, 'Team principal rating') + '</div><div><span><small>Technical staff</small><b>' + clamp(staff, 0, 100) + '</b></span>' + driverMeter(staff, 100, 'Technical staff rating') + '</div></div>' +
    (d.tdp ? '<p class="tg-note">Technical director: <b>' + esc(d.tdp.name) + '</b>.</p>' : '') + '</section>';
}

/* ---------- grid power ladder ---------- */
function tgPower(t) {
  var list = S.teams.slice().sort(function (a, b) { return teamPower(b) - teamPower(a); }), mine = teamPower(t), top = teamPower(list[0]), low = Math.min(50, teamPower(list[list.length - 1]) - 5);
  return '<section class="card team-panel tg-power">' + tgHead('Grid', 'Car pace ladder', '#' + (list.indexOf(t) + 1) + ' of ' + list.length) +
    '<div class="tg-ladder">' + list.map(function (x, i) {
      var v = teamPower(x), d = v - mine;
      return '<div class="tg-ladder-row ' + (x === t ? 'me' : '') + '" style="--tc:' + x.color + '"><span class="tg-pos">' + (i + 1) + '</span><b>' + esc(x.short) + '</b><i><u style="width:' + clamp((v - low) / (top - low) * 100, 4, 100) + '%"></u></i><span class="tg-val">' + v.toFixed(1) + '</span><span class="tg-d ' + (x === t ? 'you' : d > 0 ? 'no' : 'ok') + '">' + (x === t ? 'YOU' : (d > 0 ? '+' : '−') + Math.abs(d).toFixed(1)) + '</span></div>';
    }).join('') + '</div>' + tgHelp('What is car pace?', '<p>The average of Aero, Engine, Chassis and Reliability. The last column shows each car against yours.</p>') + '</section>';
}

/* ---------- drivers ---------- */
function tgRoster(t) {
  var ds = driverStandings(S), drivers = S.drivers.filter(function (d) { return d.team === t.id; });
  return '<section class="card team-panel team-lineup tg-lineup">' + tgHead('Race drivers', 'The line-up', drivers.length + ' race drivers') +
    '<div class="tg-drivers" style="--seats:' + drivers.length + '">' + drivers.map(function (d) {
      var mine = S.playerUid ? d.uid === S.playerUid : d.id === S.pi, action = S.mode === 'pro' && d.uid ? 'world-driver' : 'prof', value = action === 'prof' ? 'd:' + d.id : d.uid;
      return '<button class="team-driver-card tg-driver ' + (mine ? 'is-player' : '') + '" data-act="' + action + '" data-v="' + value + '" aria-label="Open ' + esc(d.name) + ' driver profile"><span class="tg-driver-num" aria-hidden="true">' + d.num + '</span>' +
        '<span class="tg-driver-top"><span class="tg-driver-tag">' + (mine ? 'YOU' : 'TEAM DRIVER') + '</span><span class="tg-driver-ovr"><small>OVR</small>' + ovr(d) + '</span></span>' +
        '<span class="tg-driver-id">' + helmetSVG(d, 84, false) + '<span><b>' + esc(d.name) + '</b><small>' + flagE(d.nat) + ' ' + natName(d.nat) + ' · age ' + d.age + '</small></span></span>' +
        '<span class="tg-driver-stats"><span><small>Standing</small><b>P' + (ds.indexOf(d) + 1) + '</b></span><span><small>Points</small><b>' + d.pts + '</b></span><span><small>Number</small><b>#' + d.num + '</b></span></span></button>';
    }).join('') + '</div></section>';
}
function tgBond() {
  var p = me(), m = mateOf(S, p); if (!m) return '';
  var tm = S.tm && S.tm.n === m.name ? S.tm : { rel: 0, yes: 0, no: 0 }, role = ROLEN[roleOf(S, p)] || 'Driver', ds = driverStandings(S);
  var effect = tm.rel >= 4 ? 'Supportive relationship: +1 morale after a race.' : tm.rel <= -4 ? 'Strained relationship: −1 morale after a race.' : 'Professional relationship. No morale change right now.';
  if (S.mode !== 'pro' && Math.abs(tm.rel) >= 4) effect += ' Classic also applies ' + (tm.rel > 0 ? '+1' : '−1') + ' XP.';
  var tape = [['Standing', ds.indexOf(p) + 1, ds.indexOf(m) + 1, true, 'P'], ['Points', p.pts, m.pts, false, ''], ['Overall', ovr(p), ovr(m), false, '']];
  return '<section class="card team-panel team-bond tg-bond">' + tgHead('Teammate', 'Inside the garage', tmLabel(tm.rel)) +
    '<div class="tg-vs"><div class="tg-vs-side">' + helmetSVG(p, 64, false) + '<b>' + esc(p.name) + '</b><small>You · ' + role + '</small></div><span class="tg-vs-badge">VS</span><div class="tg-vs-side">' + helmetSVG(m, 64, false) + '<b>' + esc(m.name) + '</b><small>' + flagE(m.nat) + ' age ' + m.age + '</small></div></div>' +
    '<div class="tg-tape">' + tape.map(function (r) { var a = r[3] ? r[1] < r[2] : r[1] > r[2], b = r[3] ? r[2] < r[1] : r[2] > r[1]; return '<div><b class="' + (a ? 'win' : '') + '">' + r[4] + r[1] + '</b><small>' + r[0] + '</small><b class="' + (b ? 'win' : '') + '">' + r[4] + r[2] + '</b></div>'; }).join('') + '</div>' +
    '<div class="tg-rope ' + (tm.rel >= 3 ? 'co' : tm.rel <= -3 ? 'ri' : '') + '"><div class="tg-rope-top"><span class="ri">⚔ Rivalry</span><b>' + tmLabel(tm.rel) + ' <em>' + (tm.rel > 0 ? '+' : tm.rel < 0 ? '−' : '') + Math.abs(tm.rel) + '</em></b><span class="co">Cooperation 🤝</span></div><div class="tg-rope-bar" role="meter" aria-label="Teammate relationship" aria-valuemin="-10" aria-valuemax="10" aria-valuenow="' + tm.rel + '"><u></u><i style="left:' + clamp((tm.rel + 10) * 5, 3, 97) + '%"></i></div><div class="tg-rope-scale"><span>−10</span><span>0</span><span>+10</span></div></div>' +
    '<div class="tg-orders"><span><b>' + tm.yes + '</b> orders obeyed</span><span><b>' + tm.no + '</b> orders refused</span></div><p class="tg-note">' + effect + '</p>' +
    tgHelp('Your role &amp; team orders', '<p>Your current role: ' + role + '. Team-order comparisons currently use ' + esc(m.name) + '. The complete line-up is shown in the line-up card.</p>') + '</section>';
}

/* ---------- junior teams: crew and seat ---------- */
function tgCrew(t) {
  var areas = [['setup', 'Setup', 'Small lap-time gain all weekend'], ['crew', 'Pit crew', 'Faster, cleaner pit stops'], ['coaching', 'Coaching', 'Better training and growth']];
  return '<section class="card team-panel team-support tg-crew">' + tgHead('Team support', 'The crew behind the pace', 'Spec car') +
    '<div class="tg-crew-list">' + areas.map(function (a) {
      var v = Math.round(t.ops[a[0]] * 100), tone = v >= 70 ? 'good' : v >= 55 ? 'mid' : 'bad';
      return '<div class="team-support-row tg-crew-row">' + tgRing(v / 100, v, '', tone) + '<div><span class="tg-crew-h">' + tgIco(a[0]) + '<b>' + a[1] + '</b></span><p>' + a[2] + '</p></div></div>';
    }).join('') + '</div>' + tgHelp('What changes on track?', '<p>The cars share a specification. Setup creates a small lap-time difference. Pit crew quality affects stop time. Coaching supports training quality and driver growth. These ratings do not change the shared engine, aero or chassis specification.</p>') + '</section>';
}
function tgLinks(t) {
  var names = (t.academyLinks || []).map(function (i) { return worldView(S, 'f1').teams[i].name; });
  return '<section class="card team-panel team-links tg-links">' + tgHead('Seat &amp; academy links', 'Your place in the paddock') +
    '<div class="tg-links-row"><div class="tg-seat"><small>Base season seat cost</small><b>' + marketCash(t.seasonCost) + '</b></div><div class="tg-acad"><small>Team academy partners</small><div>' + (names.length ? names.map(function (n) { return '<span class="tg-tag">' + esc(n) + '</span>'; }).join('') : '<span class="tg-tag">Independent operation</span>') + '</div></div></div>' +
    '<button class="btn sm" data-act="tab" data-v="kerjaya">My funding &amp; contract →</button>' +
    tgHelp('How does this relate to my contract?', '<p>The seat cost is before academy support and personal funding. Team links are separate from your own academy contract. Review your actual funding package in Career.</p>') + '</section>';
}

/* ---------- contracts, driver policy, record and history (moved here from the team profile pop-up) ---------- */
function tgContracts(t) {
  var dv = t.dev || {}, drivers = S.drivers.filter(function (d) { return d.team === t.id; }), rows = [];
  drivers.forEach(function (d) { rows.push(['Driver', d.name, typeof conUntil === 'function' ? 'Until ' + conUntil(S, d) : '', d.obj && ROLEN[d.obj.role] ? ROLEN[d.obj.role] : '#' + d.num]); });
  if (dv.tp) rows.push(['Team principal', dv.tp.name, dv.tp.con ? 'Until S' + dv.tp.con.end : '', dv.tp.con ? payTxt(dv.tp.con.pay) : '']);
  if (dv.tdp) rows.push(['Technical director', dv.tdp.name, dv.tdp.con ? 'Until S' + dv.tdp.con.end : '', dv.tdp.con ? payTxt(dv.tdp.con.pay) : '']);
  var h = '<section class="card team-panel tg-contracts">' + tgHead('Paddock office', 'Contracts &amp; driver policy', typeof teamPolicy === 'function' ? esc(teamPolicy(t)) : '');
  if (typeof teamPayroll === 'function') { var pr = teamPayroll(S, t); h += '<div class="tg-tiles"><div><small>Driver pay</small><b>' + payTxt(pr.dr) + '</b></div><div><small>Staff pay</small><b>' + payTxt(pr.st) + '</b></div><div class="' + (pr.exp ? 'warn' : '') + '"><small>Expiring</small><b>' + pr.exp + ' of ' + pr.n + '</b></div></div>'; }
  h += '<div class="tg-deals">' + rows.map(function (r) { return '<div><span><small>' + r[0] + '</small><b>' + esc(r[1]) + '</b></span><span class="r"><b>' + r[2] + '</b><small>' + r[3] + '</small></span></div>'; }).join('') + '</div>';
  if (typeof teamPolicy === 'function') {
    var ac = (S.juniors || []).map(function (j, i) { return { j: j, i: i }; }).filter(function (x) { return x.j.acad === t.id; });
    h += '<div class="tg-policy"><small>Driver policy</small><p><b>' + esc(teamPolicy(t)) + '.</b> ' + (t.plan && PLAN[t.plan] ? 'Current plan: <b>' + PLAN[t.plan].n + '</b>. ' + PLAN[t.plan].d + ' ' : '') + 'Scouting ' + (scoutQ(t) >= 0.66 ? 'sharp' : scoutQ(t) >= 0.33 ? 'average' : 'patchy') + '.</p>' +
      (ac.length ? '<div class="tg-acads">' + ac.map(function (x) { return '<button class="tg-acad-btn" data-act="prof" data-v="j:' + x.i + '"><span><b>' + esc(x.j.name) + '</b><small>' + flagE(x.j.nat) + ' academy · age ' + x.j.age + '</small></span><em>' + ovr(x.j) + '<small>OVR</small></em></button>'; }).join('') + '</div>' : '<p class="tg-note">No juniors on the academy books right now.</p>') + '</div>';
  }
  return h + '</section>';
}
function tgHistory(t) {
  var m = teamMeta(t) || {}, sh = t.sh || [];
  var titles = (m.titles || 0) + sh.filter(function (r) { return r.pos === 1; }).length, wins = (m.wins0 || 0) + sh.reduce(function (a, r) { return a + r.wins; }, 0) + (t.wins || 0);
  return '<section class="card team-panel tg-history">' + tgHead('Trophy room', 'Record &amp; history', m.founded ? 'Est. ' + m.founded : '') +
    '<div class="tg-history-body"><div class="tg-record"><div class="gold"><b>' + titles + '</b><small>Titles</small></div><div><b>' + wins + '</b><small>Wins</small></div><div><b>' + (m.founded || '–') + '</b><small>Founded</small></div></div>' +
    (sh.length ? '<div class="tg-seasons"><div class="tg-seasons-h"><span>Season</span><span>Pos</span><span>Wins</span><span>Podiums</span><span>Pts</span></div>' + sh.slice().reverse().map(function (r) { return '<div class="' + (r.pos === 1 ? 'champ' : r.pos <= 3 ? 'pod' : '') + '"><span>S' + r.s + '</span><span><b>P' + r.pos + '</b></span><span>' + r.wins + '</span><span>' + r.pods + '</span><span>' + r.pts + '</span></div>'; }).join('') + '</div>'
      : '<p class="tg-empty">No completed seasons in this save yet. Every finished season adds a line here.</p>') + '</div></section>';
}

/* ---------- page ---------- */
var tgOldPage = hTeam;
hTeam = function () {
  if (S.sit) return tgOldPage();
  var t = myTeam(), junior = S.mode === 'pro' && !!t.spec, key = S.season + ':' + S.round, fresh = TG.seen !== key;
  if (typeof ensureDev === 'function' && !junior) ensureDev(S);
  TG.seen = key;
  var h = '<div class="team-hq tg ' + (junior ? 'tg-junior' : 'tg-f1') + (fresh ? ' tg-in' : '') + '" style="--tc:' + t.color + '">' + tgHero(t, junior);
  if (junior) h += '<div class="tg-col">' + tgCrew(t) + tgLinks(t) + '</div><div class="tg-col">' + tgBattle(t) + tgBond() + '</div>' + tgRoster(t);
  else h += tgBlueprint(t) + '<div class="team-development tg-col">' + tgWorkshop(t) + tgFactory(t) + tgContracts(t) + '</div><div class="tg-col">' + tgBattle(t) + tgBoss(t) + tgPower(t) + '</div>' + tgRoster(t) + tgBond() + tgHistory(t);
  TG.pop = null;
  return h + '</div>';
};
(function () {
  var rd0 = A['rd']; A['rd'] = function (d) { var was = S.rd; rd0(d); if (S.rd !== was) { TG.pop = S.rd; try { snd('good'); } catch (e) { } render(); } };
  var tab0 = A['tab']; A['tab'] = function (d) { if (d && d.v === 'team' && UI.tab !== 'team') TG.seen = null; return tab0(d); };
})();
