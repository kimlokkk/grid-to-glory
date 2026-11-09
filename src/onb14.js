'use strict';
/* ===== Onboarding: tutorial mini-game berperingkat + latihan, tip kontekstual, glosari, pilihan gaya main ===== */

/* ---------- 1. tutorial mini-game ---------- */
var ONB_GOAL = {
  quali: 'A better lap puts you higher on the starting grid. A higher grid makes the whole race easier.',
  start: 'A good start can gain you places before the first corner.',
  pit: 'A faster pit stop means less time lost in the pit lane.',
  lane: 'Picking the right lane gets you past a slower car without losing time.',
  restart: 'A sharp restart can win or lose you places when the safety car comes in.',
  def: 'Defend well and you keep your position.',
  atk: 'Attack well and you take the place.',
  other: 'A good result helps you in the fight for position, or keeps the car out of trouble.'
};
function onbGoal(key) {
  if (key === 'quali') return ONB_GOAL.quali; if (key.indexOf('start') === 0) return ONB_GOAL.start; if (key.indexOf('pit') === 0) return ONB_GOAL.pit;
  if (key === 'lane') return ONB_GOAL.lane; if (key === 'restart') return ONB_GOAL.restart; if (key === 'tutup' || key === 'baca-def') return ONB_GOAL.def; if (key === 'brek' || key === 'baca-atk') return ONB_GOAL.atk;
  return ONB_GOAL.other;
}
/* ilustrasi animasi ikut jenis */
function onbArt(type) {
  if (type === 'Left / right' || type === 'Pick a lane') return '<div class="onb-art lr"><div class="onb-rv"></div><div class="onb-lrb"><b>LEFT</b><b>RIGHT</b></div></div>';
  if (type === 'Hold & release' || type === 'Hold + tap') return '<div class="onb-art"><div class="onb-bar"><i class="onb-band"></i><i class="onb-mk"></i></div><div class="onb-hold"><span>HOLD</span></div></div>';
  return '<div class="onb-art"><div class="onb-bar"><i class="onb-zone"></i><i class="onb-mk"></i></div><div class="onb-tap"><span>TAP</span></div></div>';
}
var ONB = null;
function onbSlides(key) {
  var inf = MGINFO[key], s = [{ t: 'Why it matters', x: onbGoal(key) }];
  inf[2].forEach(function (x, i) { s.push({ t: 'Step ' + (i + 1), x: x }); });
  s.push({ t: 'Try it', x: 'Practice once with no risk. Nothing here affects your race.', practice: true });
  return s;
}
function onbShow() {
  var o = ONB, inf = MGINFO[o.key], sl = o.sl, i = o.i, s = sl[i], last = i === sl.length - 1;
  var dots = sl.map(function (_, k) { return '<i class="' + (k === i ? 'on' : k < i ? 'dn' : '') + '"></i>'; }).join('');
  showModal('<div class="row sp"><span class="badge sc">' + inf[1] + '</span><span class="dim" style="font-size:12px">How to play · ' + (i + 1) + ' of ' + sl.length + '</span></div><h2>' + inf[0] + '</h2>' +
    onbArt(inf[1]) + '<div class="onb-dots">' + dots + '</div><div class="onb-step"><small>' + s.t + '</small><p>' + s.x + '</p></div>' +
    '<div class="row" style="flex-wrap:nowrap">' + (i > 0 ? '<button class="btn" data-act="onb-back">Back</button>' : '') +
    (last ? '<button class="btn pri" style="flex:1" data-act="onb-prac">Practice</button><button class="btn" data-act="onb-fin">Skip practice</button>' : '<button class="btn pri" style="flex:1" data-act="onb-next">Next</button>') + '</div>' +
    (!last ? '<button class="btn sm" data-act="onb-fin">Skip tutorial</button>' : ''));
}
A['onb-next'] = function () { ONB.i++; onbShow(); };
A['onb-back'] = function () { ONB.i--; onbShow(); };
A['onb-fin'] = function () { var o = ONB; ONB = null; S.tut = S.tut || {}; S.tut[o.key] = 1; save(); mgIntro0(o.key, o.go, o.sub); };
A['onb-prac'] = function () { onbPractice(); };
A['onb-again'] = function () { onbPractice(); };

function onbPractice() {
  var o = ONB, inf = MGINFO[o.key], t = inf[1], done = false, raf = 0, hdr = '<div class="row sp"><span class="badge sc">Practice</span><span class="dim" style="font-size:12px">No effect on your race</span></div><h2>' + inf[0] + '</h2>';
  function end(msg, good) {
    done = true; cancelAnimationFrame(raf); UI.mkey = null;
    showModal(hdr + '<div class="onb-res ' + (good ? 'good' : 'warn') + '">' + msg + '</div><div class="row" style="flex-wrap:nowrap"><button class="btn" data-act="onb-again">Try again</button><button class="btn pri" style="flex:1" data-act="onb-fin">I\'m ready</button></div>');
  }
  if (t === 'Left / right' || t === 'Pick a lane') {
    var side = rnd() < 0.5 ? 'L' : 'R', same = o.key === 'baca-def', lane = t === 'Pick a lane';
    var rule = lane ? 'A slow car is in the ' + (side === 'L' ? 'LEFT' : 'RIGHT') + ' lane. Tap the CLEAR lane.' : same ? 'He is going ' + (side === 'L' ? 'LEFT' : 'RIGHT') + '. Tap the SAME side to cover it.' : 'He will cover the ' + (side === 'L' ? 'LEFT' : 'RIGHT') + '. Tap the OTHER side.';
    var want = lane ? (side === 'L' ? 'R' : 'L') : same ? side : (side === 'L' ? 'R' : 'L');
    showModal(hdr + '<p class="dim" style="margin:0">' + rule + '</p><div class="row" style="flex-wrap:nowrap"><button class="btn pri hit" id="onbL" style="min-height:84px;flex:1">LEFT</button><button class="btn pri hit" id="onbR" style="min-height:84px;flex:1">RIGHT</button></div>');
    var pick = function (c) { if (done) return; end(c === want ? 'Correct! Quick and clean.' : 'Wrong side. In the real game that costs you. Try again.', c === want); };
    document.getElementById('onbL').onclick = function () { pick('L'); }; document.getElementById('onbR').onclick = function () { pick('R'); };
    return;
  }
  var hold = t === 'Hold & release' || t === 'Hold + tap', c = 0.3 + rnd() * 0.3, w = 0.12, sp = 0.55, t0 = performance.now(), down = null, tIn = 0, tOut = 0;
  function pos(now) { var ph = ((now - t0) / 1000 * sp) % 2; return ph < 1 ? ph : 2 - ph; }
  showModal(hdr + '<p class="dim" style="margin:0">' + (hold ? 'HOLD when the marker enters the yellow band, RELEASE when it leaves.' : 'Tap when the marker is inside the green zone.') + '</p>' +
    '<div class="onb-bar big"><i class="' + (hold ? 'onb-band' : 'onb-zone') + '" style="left:' + ((c - w / 2) * 100) + '%;width:' + (w * 100) + '%;animation:none"></i><i class="onb-mk" id="onbM" style="animation:none"></i></div>' +
    '<button class="btn pri hit" id="onbB" style="min-height:84px;touch-action:none;user-select:none">' + (hold ? 'HOLD' : 'TAP') + '</button>');
  var m = document.getElementById('onbM'), b = document.getElementById('onbB');
  (function lp(now) { if (done) return; m.style.left = (pos(now) * 100) + '%'; raf = requestAnimationFrame(lp); })(performance.now());
  function dn() { if (done) return; var x = pos(performance.now()); if (!hold) { var e = Math.abs(x - c); end(e <= w / 2 ? (e <= w / 6 ? 'PERFECT! Dead centre.' : 'Good! In the zone.') : x < c ? 'Too early. Wait for the green.' : 'Too late. Try to tap a little sooner.', e <= w / 2); } else { down = x; } }
  function up() { if (done || down == null) return; var x = pos(performance.now()), e1 = Math.abs(down - (c - w / 2)), e2 = Math.abs(x - (c + w / 2)); var ok = e1 <= w * 0.7 && e2 <= w * 0.7; end(ok ? 'Nice! Both timings were close.' : (e1 > w * 0.7 ? 'Your press was off. Watch the marker enter the band, then press.' : 'Your release was off. Let go as the marker leaves the band.'), ok); }
  b.onpointerdown = function (e) { e.preventDefault(); dn(); }; b.onpointerup = up; b.onpointerleave = up;
  UI.mkey = dn;
}
var mgIntro0 = mgIntro;
mgIntro = function (key, go, sub) {
  var inf = MGINFO[key];
  if (!inf || !S || (S.tut && S.tut[key])) { mgIntro0(key, go, sub); if (inf) { var bx = document.querySelector('#modal .mbox'); if (bx) bx.insertAdjacentHTML('beforeend', '<button class="btn sm" data-act="onb-replay" data-k="' + key + '">How to play (tutorial)</button>'); onbRep = { key: key, go: go, sub: sub }; } return; }
  ONB = { key: key, go: go, sub: sub, sl: onbSlides(key), i: 0 }; onbShow();
};
var onbRep = null;
A['onb-replay'] = function () { if (!onbRep) return; UI.mkey = null; ONB = { key: onbRep.key, go: onbRep.go, sub: onbRep.sub, sl: onbSlides(onbRep.key), i: 0 }; onbShow(); };

/* ---------- 2. tip kontekstual (sekali setiap skrin) ---------- */
var TIPS = {
  'hub:utama': ['Home', 'This is your base. See your next race, your standing and what is happening in the paddock. When you are ready, start the race weekend from here.'],
  'hub:musim': ['Season', 'Open the calendar, race results, standings, news and history from the section buttons.'],
  'hub:kerjaya': ['Career', 'Review your contract, sponsor offers and career record here.'],
  'hub:kal': ['Races', 'The calendar lists every race in your season. Switch to Results for the full classification of every race, or History for past seasons and records.'],
  'hub:news': ['Paddock Wire', 'All the news of the season: race reports, transfers, upgrades and rumours. Tap a story to read it in full and jump to the related driver, team or race results.'],
  'hub:kej': ['Standings', 'Points go to the top 10: 25, 18, 15, 12, 10, 8, 6, 4, 2, 1. Tap any driver or team to see their profile.'],
  'hub:team': ['Your car', 'Aero = cornering grip, Engine = straight-line speed, Chassis = tyre care, Reliability = fewer breakdowns. Upgrades arrive during the season. Finance shows what your team can afford to develop.'],
  'hub:aku': ['Your driver', 'Spend XP here to improve your driver. You earn XP every race: beating what your car should do earns the most. Find assistance and save controls on the Settings page.'],
  'wk:quali': ['Qualifying', 'Qualifying decides your starting grid. A better grid makes the race easier. The mini-game rewards a clean, well-timed lap. If you prefer to skip it, turn Mini game off in Settings.'],
  'wk:strat': ['Strategy: tyres and pace', 'Soft = fast but wears quickly. Medium = balanced. Hard = slow but lasts. Most races need a pit stop, and your engineer recommends a plan you can follow or change. Tyres, Fuel and Energy have separate controls. Each can stay on Auto or follow your manual choice. Pushing costs resources; hot or worn tyres increase spin risk. Boost spends the same battery as Deploy.'],
  'wk:result': ['After the race', 'Points go to the standings and XP to your driver. The press conference answer changes morale, fame and your relationship with the team.']
};
function onbCtx() {
  if (!S || !S.drivers || S.sit) return null;
  if (UI.screen === 'hub') return 'hub:' + UI.tab;
  if (UI.screen === 'wk' && UI.wk) return 'wk:' + UI.wk.step;
  return null;
}
function onbTip() {
  var k = onbCtx(); if (!k || !TIPS[k] || S.settings.tips === false || (S.tips && S.tips[k]) || $modal.innerHTML) return;
  var host = document.querySelector('.hmain') || document.querySelector('.app'); if (!host || host.querySelector('.tipc')) return;
  var T = TIPS[k];
  host.insertAdjacentHTML('afterbegin', '<div class="card tipc" data-k="' + k + '"><div><small>Tip</small><b>' + T[0] + '</b><p>' + T[1] + '</p></div><div class="row"><button class="btn sm pri" data-act="tip-ok" data-k="' + k + '">Got it</button><button class="btn sm" data-act="glossary">Glossary</button><button class="btn sm" data-act="tip-off">Hide all tips</button></div></div>');
}
A['tip-ok'] = function (d) { S.tips = S.tips || {}; S.tips[d.k] = 1; save(); var e = document.querySelector('.tipc'); if (e) e.remove(); };
A['tip-off'] = function () { S.settings.tips = false; save(); var e = document.querySelector('.tipc'); if (e) e.remove(); toast('Tips hidden. Turn them back on in Settings.'); };
A['tips-toggle'] = function () { S.settings.tips = S.settings.tips === false; if (S.settings.tips) S.tips = {}; save(); render(); };

/* ---------- 3. glosari ---------- */
var GLOSS = [
  ['Grid', 'Your starting position, set by qualifying.'], ['Pole', 'First place on the grid.'],
  ['Soft / Medium / Hard', 'Tyre types. Soft is fastest but wears quickly. Hard lasts longest but is slower.'],
  ['Inter / Wet', 'Tyres for damp and rainy conditions.'], ['Pit stop', 'A trip into the pit lane to change tyres. It costs time, but fresh tyres are faster.'],
  ['Undercut', 'Pitting earlier than a rival so fresh tyres gain you time on them.'], ['Safety car (SC)', 'A slow pace car after an incident. Everyone bunches up and a pit stop costs less time.'],
  ['VSC', 'Virtual safety car: everyone slows to a set pace without a pace car.'], ['Energy', 'Battery charge shared by Deploy and Boost. Harvest recharges it at a pace cost.'],
  ['Boost', 'A short burst of speed for overtaking. It costs energy.'], ['DRS', 'A rear wing flap that opens in detection zones to help you pass on straights.'],
  ['Aero / Engine / Chassis / Reliability', 'The four car parts: grip, power, tyre care and fewer breakdowns.'], ['OVR / Rating', 'A driver\'s overall ability from 45 to 99, combining pace, consistency, racecraft, wet skill and tyre care.'],
  ['XP', 'Experience points to improve your driver. Earned after each race.'], ['Constructors\'', 'The team championship, scored from both drivers\' points.'],
  ['Countback', 'The tie-break when drivers have equal points: most wins first, then most second places, and so on.']
];
A['glossary'] = function () {
  showModal('<div class="row sp"><h2 style="margin:0">Glossary</h2></div><dl class="gloss">' + GLOSS.map(function (g) { return '<dt>' + g[0] + '</dt><dd>' + g[1] + '</dd>'; }).join('') + '</dl><button class="btn pri wide" data-act="mclose">Close</button>');
};

/* ---------- 4. pilihan gaya main (karier baru sahaja) ---------- */
function onbStyleHTML() {
  return '<div class="stack"><h2 style="margin:0">How do you want to play?</h2><p class="dim" style="margin:0">You can change this anytime in Settings.</p>' +
    '<button class="opt press-o" data-act="onb-style" data-v="guided"><div class="t"><b>Guided</b> (recommended)</div><div class="s">You make the calls, with tips, a glossary and an engineer who recommends. Mini-games on.</div></button>' +
    '<button class="opt press-o" data-act="onb-style" data-v="casual"><div class="t"><b>Casual</b></div><div class="s">Your engineer handles pit stops and strategy. No mini-games. Just watch the race and manage your career.</div></button>' +
    '<button class="opt press-o" data-act="onb-style" data-v="expert"><div class="t"><b>Expert</b></div><div class="s">All decisions and mini-games, no tips. For players who know F1.</div></button></div>';
}
A['onb-style'] = function (d) {
  var st = S.settings; st.style = d.v;
  if (d.v === 'casual') { st.ask = false; st.mini = false; st.tips = true; } else if (d.v === 'guided') { st.ask = true; st.mini = true; st.tips = true; } else { st.ask = true; st.mini = true; st.tips = false; }
  save(); closeModal(); render();
};

/* ---------- pancang render ---------- */
(function () {
  var r0 = render;
  render = function () {
    r0();
    try {
      if (!S || !S.drivers) return;
      if (UI.screen === 'hub' && !S.sit && S.season === 1 && S.round === 0 && !S.settings.style && !(S.results && S.results.length) && !$modal.innerHTML) { showModal(onbStyleHTML()); return; }
      onbTip();
    } catch (e) { }
  };
})();
