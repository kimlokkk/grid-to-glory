'use strict';
/* Race weekend v3, phase 5. Presentation only; settlement and press actions stay unchanged. */
var RV = { wk: null, entered: 0, folds: {}, raf: 0 };
var rvOldResult = vResult;

function rvOutcome(P) {
  if (P.dnf) return { cls: 'dnf', label: 'Retired', title: 'Not our day.', line: 'A hard stop. A reason to come back stronger.' };
  if (P.pos === 1) return { cls: 'win', label: 'Race winner', title: 'This one is yours.', line: 'First to the flag. Make some noise.' };
  if (P.pos <= 3) return { cls: 'podium', label: 'Podium finish', title: 'Get up there.', line: 'Three steps. One place with your name on it.' };
  if (P.pts > 0) return { cls: 'points', label: 'Points finish', title: 'Every point counts.', line: 'Another result on the board. Another step forward.' };
  if (P.car.grid - P.pos >= 3) return { cls: 'charge', label: 'Recovery drive', title: 'Never stopped fighting.', line: 'Places earned. Lessons taken. On to the next one.' };
  return { cls: 'finish', label: 'Chequered flag', title: 'The fight goes on.', line: 'Bank the experience. Bring it to the next race.' };
}
/* Reuse legacy cards so profile links, classification, evaluation, media and finale data survive. */
function rvLegacyParts(html) {
  var root = document.createElement('div'); root.innerHTML = html;
  var parts = { extras: [] }, stack = null;
  Array.prototype.forEach.call(root.children, function (el) { if (el.classList.contains('stack')) stack = el; });
  if (!stack) return parts;
  Array.prototype.forEach.call(stack.children, function (el) {
    var head = el.querySelector('h3'), title = head ? head.textContent.trim() : '';
    if (el.matches('[data-act="r-next"]')) parts.next = el.outerHTML;
    else if (/^Results\s*·/.test(title)) return;
    else if (el.querySelector('[data-act="cls-all"]')) {
      var foot = el.querySelector('p'); if (foot) foot.insertAdjacentText('afterbegin', 'Race totals · ');
      parts.classification = el.outerHTML;
    } else if (title === 'Team objectives') parts.objectives = el.outerHTML;
    else if (title === 'Key moments') parts.moments = el.outerHTML;
    else if (el.id === 'performance-review') parts.evaluation = el.outerHTML;
    else if (el.classList.contains('pcf') || el.classList.contains('press')) parts.press = el.outerHTML;
    else if (el.classList.contains('nw')) parts.news = el.outerHTML;
    else parts.extras.push(el.outerHTML);
  });
  return parts;
}
function rvCounter(value, prefix) {
  var n = Number(value) || 0;
  return '<b data-rv-count="' + n + '" data-rv-prefix="' + (prefix || '') + '" aria-label="' + (prefix || '') + n + '">' + (prefix || '') + n + '</b>';
}
function rvFold(key, title, sub, html) {
  if (!html) return '';
  return '<details class="rv-file" data-rv-fold="' + key + '"' + (RV.folds[key] ? ' open' : '') + '><summary><span><b>' + title + '</b><small>' + sub + '</small></span><i aria-hidden="true">+</i></summary><div class="rv-file-body">' + html + '</div></details>';
}
document.addEventListener('toggle', function (e) {
  var el = e.target;
  if (el.dataset && el.dataset.rvFold && el.isConnected && RV.wk === UI.wk) RV.folds[el.dataset.rvFold] = el.open;
}, true);
function rvPodium(R, P) {
  if (P.dnf || P.pos > 3) return '';
  var finishers = R.cls.filter(function (x) { return !x.dnf; }).slice(0, 3), order = [1, 0, 2];
  return '<div class="rv-podium" aria-label="Race podium">' + order.map(function (i) {
    var x = finishers[i]; if (!x) return '';
    var d = x.car.d, team = S.teams[d.team];
    return '<div class="rv-step p' + (i + 1) + (x.car.isP ? ' you' : '') + '" style="--pod-team:' + team.color + '"><div class="rv-pod-driver">' + helmetSVG(d, 42, false) + '<b>' + esc(d.code) + '</b></div><div class="rv-plinth"><strong>' + (i + 1) + '</strong><small>' + esc(team.short) + (x.car.isP ? ' · YOU' : '') + '</small></div></div>';
  }).join('') + '</div>';
}
function rvHero(wk, P, outcome, fresh) {
  var d = P.car.d, team = S.teams[d.team], live = wk.R && wk.R.p, gain = P.car.grid - P.pos;
  var retirement = P.dnf && live && live.dnfS != null ? 'Retired on lap ' + (Math.floor(live.dnfS) + 1) : 'Race ended early';
  var change = P.dnf ? retirement : gain > 0 ? '▲ ' + gain + (gain === 1 ? ' place gained' : ' places gained') : gain < 0 ? '▼ ' + -gain + (gain === -1 ? ' place lost' : ' places lost') : 'Held your starting position';
  var radioLog = wk.old.log || [], radioLine = radioLog.length ? radioLog[radioLog.length - 1].t : outcome.line;
  var confetti = '';
  if (outcome.cls === 'win' && fresh) for (var i = 0; i < 16; i++) confetti += '<i style="--x:' + ((i * 23 + 7) % 100) + '%;--delay:' + (i % 4 * .1) + 's;--tilt:' + (i % 2 ? 32 : -32) + 'deg"></i>';
  return '<section class="rv-hero ' + outcome.cls + (P.pos === 3 && !P.dnf ? ' bronze' : '') + (fresh ? ' arrive' : '') + '" style="--tc:' + team.color + '"><div class="rv-hero-grid" aria-hidden="true"></div><div class="rv-confetti" aria-hidden="true">' + confetti + '</div>' +
    '<div class="rv-session"><span><i></i>' + outcome.label + '</span><span>' + esc(leagueOf(S).toUpperCase()) + ' / ROUND ' + S.round + '</span></div>' +
    '<div class="rv-hero-main"><div class="rv-verdict"><span class="rv-position">' + (P.dnf ? 'DNF' : 'P' + P.pos) + '</span><h1>' + outcome.title + '</h1><p>' + esc(P.dnf ? String(P.car.dnf) : outcome.line) + '</p></div><div class="rv-driver-mark">' + helmetSVG(d, 82, false) + '<span>#' + esc(String(d.num == null ? '—' : d.num)) + '</span></div></div>' +
    '<div class="rv-driver-name"><span>' + esc(d.name) + '</span><small>' + esc(team.name) + '</small></div><div class="rv-car" aria-hidden="true">' + carSVG(team, 480) + '</div>' +
    '<div class="rv-grid-change"><span>GRID <b>P' + P.car.grid + '</b></span><i aria-hidden="true">››</i><span>FINISH <b>' + (P.dnf ? 'DNF' : 'P' + P.pos) + '</b></span><em class="' + (!P.dnf && gain > 0 ? 'good' : '') + '">' + change + '</em></div>' +
    rvPodium(wk.old, P) + '<div class="rv-radio"><span>TEAM RADIO</span><p>“' + esc(radioLine) + '”</p></div></section>';
}
function rvRewards(wk, P, fresh) {
  var base = Number(wk.rep.xp) || 0, bonus = Number(wk.jr.xp) || 0, total = base + bonus;
  var rank = driverStandings(S).indexOf(me()) + 1, driver = me();
  return '<aside class="rv-rewards' + (fresh ? ' arrive' : '') + '"><div class="rv-section-label"><span>YOUR HAUL</span><small>RACE REWARDS</small></div><div class="rv-reward-main"><div class="rv-points"><small>CHAMPIONSHIP POINTS</small>' + rvCounter(P.pts, '+') + '</div><div class="rv-xp"><small>XP EARNED</small>' + rvCounter(total, '+') + '</div></div>' +
    '<div class="rv-xp-track" aria-hidden="true"><i style="width:' + (total ? base / total * 100 : 0) + '%"></i><u style="width:' + (total ? bonus / total * 100 : 0) + '%"></u></div><div class="rv-xp-split"><span><i></i>Race XP <b>+' + base + '</b></span><span><i></i>Objective bonus <b>+' + bonus + '</b></span></div>' +
    '<div class="rv-standing"><span><small>DRIVERS’ CHAMPIONSHIP</small><b>P' + rank + '</b></span><span>' + driver.pts + ' <small>season pts</small></span></div>' +
    '<div class="rv-morale"><span>Race morale</span><b class="' + (wk.jr.mor < 0 ? 'negative' : 'positive') + '">' + (wk.jr.mor > 0 ? '+' : '') + wk.jr.mor + '</b><small>' + esc(moraleTxt(S.morale)) + '</small></div></aside>';
}
function rvRaceStory(wk, P) {
  var mates = wk.old.cls.filter(function (x) { return x.car.di !== P.car.di && x.car.d.team === P.car.d.team; }), mate = mates[0];
  var versus = !mate ? 'No teammate classified' : P.dnf && mate.dnf ? 'Both retired' : !P.dnf && (mate.dnf || P.pos < mate.pos) ? 'Finished ahead' : 'Finished behind';
  var fastest = wk.old.fl.di === P.car.di;
  return '<section class="rv-story"><div class="rv-story-cell"><small>' + (mates.length > 1 ? 'BEST TEAMMATE' : 'TEAMMATE CHECK') + '</small><b>' + (mate ? esc(mate.car.d.code) + ' · ' + (mate.dnf ? 'DNF' : 'P' + mate.pos) : '—') + '</b><span>' + versus + '</span></div><div class="rv-story-cell"><small>YOUR PIT STOPS</small><b>' + P.car.stops + '</b><span>' + (P.dnf ? 'Race cut short' : 'Across the finish line') + '</span></div><div class="rv-story-cell"><small>' + (fastest ? 'FASTEST LAP · YOURS' : 'RACE FASTEST LAP') + '</small><b>' + (wk.old.fl.di >= 0 ? fmtT(wk.old.fl.t) : '—') + '</b><span>' + (wk.old.fl.di >= 0 ? esc(S.drivers[wk.old.fl.di].code) : 'No lap recorded') + '</span></div></section>';
}
function rvMoments(R) {
  var messages = (R.log || []).filter(function (m) { return m.imp; }), shown = messages.slice(-40);
  if (!shown.length) return '';
  return '<div class="rv-moments">' + shown.map(function (m) { return '<div><b>L' + m.lap + '</b><p>' + esc(m.t.replace(/^Engineer:\s*/, '')) + '</p></div>'; }).join('') + (messages.length > shown.length ? '<small>Latest 40 important radio messages.</small>' : '') + '</div>';
}
function rvAnimate(wk) {
  cancelAnimationFrame(RV.raf);
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function frame() {
    if (UI.wk !== wk || wk.step !== 'result') { RV.raf = 0; return; }
    var t = reduced ? 1 : clamp((performance.now() - RV.entered - 150) / 950, 0, 1), eased = 1 - Math.pow(1 - t, 3);
    document.querySelectorAll('.rv40 [data-rv-count]').forEach(function (el) { el.textContent = el.dataset.rvPrefix + Math.round(Number(el.dataset.rvCount) * eased); });
    RV.raf = t < 1 ? requestAnimationFrame(frame) : 0;
  }
  frame();
}
vResult = function () {
  /* Keep the legacy once-only headline/press preparation, and preserve all existing cards. */
  var legacy = rvOldResult(), wk = UI.wk, P = wk.rep.P, parts = rvLegacyParts(legacy), outcome = rvOutcome(P);
  if (RV.wk !== wk) { cancelAnimationFrame(RV.raf); RV.wk = wk; RV.entered = performance.now(); RV.folds = {}; }
  var fresh = performance.now() - RV.entered < 1200;
  var media = parts.press || '<div class="rv-no-press"><small>MEDIA PEN</small><h3>A quiet exit.</h3><p>No press conference this round. Take the lessons back to the garage.</p></div>';
  var files = rvFold('classification', 'Race classification', 'Full timing · tyres · points', parts.classification) +
    rvFold('objectives', 'Team objectives', 'Objective bonus +' + (wk.jr.xp || 0) + ' XP', parts.objectives) +
    rvFold('performance', 'Driver performance', 'Assessment · tier · teammate record', parts.evaluation) +
    rvFold('moments', 'Race radio & key moments', 'The important calls, in order', rvMoments(wk.old)) +
    rvFold('garage', 'Garage update', 'Team development after this round', wk.rep.rd && wk.rep.rd.length ? '<p>' + wk.rep.rd.map(esc).join(' · ') + '</p>' : '');
  setTimeout(function () { if (UI.wk === wk && wk.step === 'result') rvAnimate(wk); }, 0);
  return '<div class="rv40" style="--tc:' + S.teams[P.car.d.team].color + '">' + wkHead(false) + '<div class="rv-top">' + rvHero(wk, P, outcome, fresh) + '<div class="rv-summary">' + rvRewards(wk, P, fresh) + rvRaceStory(wk, P) + '</div></div>' +
    (parts.extras.length ? '<div class="rv-season">' + parts.extras.join('') + '</div>' : '') +
    '<div class="rv-media"><section class="rv-media-room"><div class="rv-room-heading"><span>01 / THE MICROPHONE IS YOURS</span><b>Inside the media pen</b></div>' + media + '</section><section class="rv-headlines"><div class="rv-room-heading"><span>02 / AROUND THE PADDOCK</span><b>How they’ll remember it</b></div>' + (parts.news || '') + '<div class="rv-press-note"><i aria-hidden="true">“</i><p>' + (wk.press ? wk.press.done == null ? 'Your words can move morale, fame and team relations. Choose your response.' : 'Your response is on the record. Take the next chapter back to the paddock.' : 'The next headline starts on the next grid.') + '</p></div></section></div>' +
    '<section class="rv-files"><div class="rv-room-heading"><span>THE RACE FILE</span><b>Dig into the details</b></div>' + files + '</section><div class="rv-footer"><div><small>UP NEXT</small><b>' + (S.round >= seasonRounds(S) && !S.sit ? 'The season debrief' : 'Back to the paddock') + '</b></div>' + parts.next + '</div></div>';
};
