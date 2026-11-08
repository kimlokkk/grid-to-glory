/* ===== Fasa E4a: kemasyhuran, penaja peribadi (laluan pay-driver) dan sidang akhbar lepas perlumbaan ===== */
var SP = { decay: 0.97, max: 3, myMul: 1.2, homeCi: 0 };
var BRANDS = ['Kopi Tiga', 'Orbit Telecom', 'Haluan Bank', 'Zephyr Energy', 'Nova Watches', 'Arcadia Airways', 'Sentosa Tyres', 'Lumen Sports', 'Pinnacle Insurance', 'Delta Foods', 'Aurora Mobile', 'Tiger Isotonic'];
function fameOf(S) { return S.fame == null ? 6 : S.fame; }
function fameTxt(f) { return f < 10 ? 'Unknown' : f < 25 ? 'Local name' : f < 45 ? 'Rising name' : f < 70 ? 'Well known' : f < 90 ? 'Star' : 'Global icon'; }
function isHome(S, ci) { return S.drivers[S.pi].nat === 'MY' && ci === SP.homeCi; }
/* dipanggil dari finishRace */
function fameRace(S, P, ci) {
  var g = P.dnf ? 0 : P.pos === 1 ? 7 : P.pos <= 3 ? 3.5 : P.pos <= 10 ? 1.2 : 0.3;
  if (S.drivers[S.pi].nat === 'MY') g *= 1.15;
  if (isHome(S, ci)) g *= 1.8;
  S.fame = clamp(fameOf(S) * SP.decay + g, 0, 100);
}
function sponProg(S, dl) {
  var r = S.results || [], n = 0;
  r.forEach(function (x) { if (x.dnf) return; if (dl.need.k === 'fin') n++; else if (dl.need.k === 'pts' && x.pos <= 10) n++; else if (dl.need.k === 'pod' && x.pos <= 3) n++; else if (dl.need.k === 'win' && x.pos === 1) n++; });
  return n;
}
function sponTxt(dl) { return dl.need.k === 'win' ? 'Win ' + dl.need.n + (dl.need.n === 1 ? ' race' : ' races') : dl.need.k === 'fin' ? 'Finish ' + dl.need.n + ' races' : dl.need.k === 'pts' ? 'Score points in ' + dl.need.n + ' races' : 'Take ' + dl.need.n + (dl.need.n === 1 ? ' podium' : ' podiums'); }
function sponActive(S) { return (S.spons || []).filter(function (d) { return !d.ended; }); }
function sponTotal(S) { var t = 0; sponActive(S).forEach(function (d) { t += d.v; }); return t; }
/* musim baru: jenama datang mengikut kemasyhuran */
function sponNew(S) {
  S.spons = (S.spons || []).filter(function (d) { return !d.ended; });
  var f = fameOf(S), p = S.drivers[S.pi], free = SP.max - S.spons.length, n = Math.min(free, Math.floor(f / 18) + (rnd() < 0.4 ? 1 : 0));
  var used = {}; S.spons.forEach(function (d) { used[d.n] = 1; });
  var pool = shuffle(BRANDS.filter(function (b) { return !used[b]; })); S.sponOffers = [];
  for (var i = 0; i < n && pool.length; i++) {
    var top = f >= 85 && rnd() < 0.45, hi = f >= 55 && rnd() < 0.5, need = top ? { k: 'win', n: 1 + (f >= 95 ? 1 : 0) } : hi ? { k: 'pod', n: 1 + (f >= 75 ? 1 : 0) } : f >= 25 && rnd() < 0.6 ? { k: 'pts', n: 5 + Math.floor(rnd() * 3) } : { k: 'fin', n: 8 + Math.floor(rnd() * 2) };
    var v = (0.5 + f * 0.05) * (p.nat === 'MY' ? SP.myMul : 1) * rr(0.85, 1.2) * (top ? 1.5 : hi ? 1.25 : 1);
    S.sponOffers.push({ n: pool.pop(), v: Math.round(v * 10) / 10, yrs: 1 + Math.floor(rnd() * 2), need: need });
  }
}
/* hujung musim: penaja puas hati atau tidak */
function sponEval(S) {
  var out = [];
  (S.spons || []).forEach(function (d) {
    if (d.ended) return;
    var ok = sponProg(S, d) >= d.need.n;
    d.mood = (d.mood || 0) + (ok ? 1 : -2); d.left--; d.res = ok ? 'met' : 'miss';
    if (d.left <= 0 || d.mood <= -2) d.ended = true;
    out.push({ n: d.n, ok: ok, ended: !!d.ended, why: d.left <= 0 && ok ? 'term' : d.mood <= -2 ? 'unhappy' : null });
  });
  S.sponOffers = null;
  return out;
}
/* pendapatan penaja kepada team pemain (60% daripada nilai) */
function sponIncome(S) { return S.mode === 'pro' ? 0 : sponTotal(S) * 0.6; }
/* nilai pemain di mata team: team yang kewangannya ketat lebih hargai penaja */
function sponV(S, t) {
  var tot = sponTotal(S); if (!tot) return 0;
  var strapped = t.plan === 'cut' || (t.fin && t.fin.fund < 60);
  return Math.min(4, tot / 2.5) * (strapped ? 2 : 1);
}
if (typeof A !== 'undefined') A['spon-yes'] = function (d) {
  var o = (S.sponOffers || [])[+d.i]; if (!o || sponActive(S).length >= SP.max) return;
  S.spons = S.spons || []; S.spons.push({ n: o.n, v: o.v, left: o.yrs, yrs: o.yrs, need: o.need, mood: 0, res: null, s: S.season });
  S.sponOffers.splice(+d.i, 1); save(); render();
};
if (typeof A !== 'undefined') A['spon-no'] = function (d) { if (S.sponOffers) S.sponOffers.splice(+d.i, 1); save(); render(); };

/* ---- kad dalam tab Me ---- */
function sponCardHTML() {
  var f = fameOf(S), h = '<div class="card stack spon"><div class="row sp"><h3>Fame & sponsors</h3><span class="mono dim">' + fameTxt(f) + '</span></div>' +
    '<div class="fame"><i style="width:' + Math.round(f) + '%"></i></div><p class="dim" style="font-size:12.5px;margin:0">' + (me().nat === 'MY' ? 'Malaysian fans and brands love a home hero: your fame grows faster and sponsors pay more, and the home race counts double. ' : '') + (S.mode === 'pro' ? 'Personal sponsor fees pay your wallet. Seat funding is agreed separately.' : 'Brands pay your team part of their fee, and teams on a tight budget value that a lot.') + '</p>';
  var act = sponActive(S);
  if (act.length) h += '<h4>Active deals</h4>' + act.map(function (d) { var n = sponProg(S, d); return '<div class="sp-r"><div><b>' + esc(d.n) + '</b><span>' + sponTxt(d) + ' · ' + payTxt(d.v) + '/season · ' + d.left + ' left</span></div><em class="' + (n >= d.need.n ? 'good' : '') + '">' + Math.min(n, d.need.n) + '/' + d.need.n + '</em></div>'; }).join('');
  var of = S.sponOffers || [];
  if (of.length) h += '<h4>Offers</h4>' + of.map(function (o, i) { return '<div class="sp-r off"><div><b>' + esc(o.n) + '</b><span>' + sponTxt(o) + ' · ' + payTxt(o.v) + '/season · ' + o.yrs + (o.yrs === 1 ? ' season' : ' seasons') + '</span></div><div class="row" style="gap:6px"><button class="btn sm" data-act="spon-no" data-i="' + i + '">Pass</button><button class="btn sm pri" data-act="spon-yes" data-i="' + i + '">Sign</button></div></div>'; }).join('');
  if (!act.length && !of.length) h += '<p class="dim" style="margin:0">No brands are interested yet. Results and exposure bring them in.</p>';
  return h + '</div>';
}
function sponBannerHTML(cls) {
  var n = (S.sponOffers || []).length; if (!n || S.round > 0) return '';
  return '<div class="' + (cls || '') + ' card spon-b"><div><b>' + n + (n === 1 ? ' brand wants' : ' brands want') + ' to sponsor you</b><span>' + (S.mode === 'pro' ? 'Sign a deal to earn personal income.' : 'Sign a deal to bring money to the team.') + '</span></div><button class="btn sm pri" data-act="tab" data-v="kerjaya">See offers</button></div>';
}

/* ---- sidang akhbar ---- */
var PRESS = {
  win: { q: 'The paddock is waiting. How do you sum up the day?', o: [
    { k: 'humble', t: '“This is all down to the team. They gave me a brilliant car.”', hint: 'Safe', mor: 4, fame: 0.5, rel: 1, mood: 0, r: 'The garage loves it. Nobody can fault the humility.' },
    { k: 'conf', t: '“We came here to win. I want more days like this.”', hint: 'Bold', mor: 1, fame: 2, rel: 0, mood: 1, r: 'Headline material. Sponsors like a driver with ambition.' },
    { k: 'dig', t: '“Some people said I could not do it. I enjoyed proving them wrong.”', hint: 'Spicy', mor: -2, fame: 3, rel: -0.5, mood: -1, r: 'The clip goes viral. Some at the team wince, one sponsor frowns.' }] },
  pod: { q: 'A podium finish. What was the key today?', o: [
    { k: 'humble', t: '“The strategy was spot on. Great job by everyone.”', hint: 'Safe', mor: 4, fame: 0.5, rel: 1, mood: 0, r: 'The pit wall gets some credit and returns the favour.' },
    { k: 'conf', t: '“Next time we go one step higher. Count on it.”', hint: 'Bold', mor: 1, fame: 2, rel: 0, mood: 1, r: 'Fans love the promise. Sponsors love the fans.' },
    { k: 'dig', t: '“I was faster than the guys ahead. Today just was not my day for luck.”', hint: 'Spicy', mor: -2, fame: 3, rel: -0.5, mood: -1, r: 'A sharp line, and a few eyebrows raised in the motorhome.' }] },
  pts: { q: 'Points in the bag. How was your race?', o: [
    { k: 'humble', t: '“Solid day. We build step by step.”', hint: 'Safe', mor: 2, fame: 0, rel: 0.5, mood: 0, r: 'Professional. The engineers nod.' },
    { k: 'conf', t: '“We left something on the table. I want more.”', hint: 'Bold', mor: 0, fame: 1, rel: 0, mood: 0.5, r: 'Hunger is attractive to everyone, brands included.' },
    { k: 'dig', t: '“Honestly, the car is not good enough for the speed I have.”', hint: 'Spicy', mor: -3, fame: 2, rel: -1.5, mood: -1, r: 'Quoted everywhere. The team principal is not amused.' }] },
  over: { q: 'Outside the points, but well ahead of where this car should be. How do you see it?', o: [
    { k: 'humble', t: '“The team gave me a good car and a good strategy. We maximised it.”', hint: 'Safe', mor: 3, fame: 0.5, rel: 1, mood: 0, r: 'The garage appreciates the credit. A job well done.' },
    { k: 'conf', t: '“This is what we are capable of. Imagine when we get the upgrades.”', hint: 'Bold', mor: 2, fame: 1.5, rel: 0, mood: 0.5, r: 'A hopeful quote. The factory is listening.' },
    { k: 'dig', t: '“We beat cars that should be quicker than us. Someone should ask them why.”', hint: 'Spicy', mor: 0, fame: 2.5, rel: -1, mood: -0.5, r: 'A sharp line, and a few rival garages bristle.' }] },
  bad: { q: 'A tough one today. What happened out there?', o: [
    { k: 'own', t: '“We need to review today and come back stronger.”', hint: 'Safe', mor: 2, fame: 0, rel: 1, mood: 0, r: 'Respect from the garage. Mistakes happen.' },
    { k: 'car', t: '“The car was just not quick enough today.”', hint: 'Risky', mor: -2, fame: 0.5, rel: -1, mood: -0.5, r: 'True, perhaps, but the engineers noticed who said it.' },
    { k: 'blame', t: '“Ask the pit wall. The strategy cost us everything.”', hint: 'Spicy', mor: -5, fame: 2, rel: -2.5, mood: -1, r: 'Explosive soundbite. Relationships with the team take a hit.' }] }
};
/* A retirement question states the recorded cause, without forcing the player to admit fault. */
PRESS.mech = { q: 'A mechanical failure ended your race. What is your reaction?', o: [
  { k: 'team', t: '“Reliability cost us today. We will work through it together.”', hint: 'Safe', mor: 2, fame: 0, rel: 1, mood: 0, r: 'The garage appreciates the support after the failure.' },
  { k: 'conf', t: '“We need to fix this. I want to fight for results.”', hint: 'Bold', mor: 0, fame: 1, rel: 0, mood: 0.5, r: 'A clear demand for better reliability.' },
  { k: 'blame', t: '“We cannot keep throwing away races with reliability.”', hint: 'Spicy', mor: -3, fame: 2, rel: -1.5, mood: -0.5, r: 'The public criticism puts pressure on the team.' }
] };
PRESS.dnf = { q: 'Your race ended in retirement. How do you respond?', o: [
  { k: 'review', t: '“We need to review what happened before drawing conclusions.”', hint: 'Safe', mor: 2, fame: 0, rel: 1, mood: 0, r: 'A measured response. The team will review the incident.' },
  { k: 'conf', t: '“A tough result. I will be ready for the next challenge.”', hint: 'Bold', mor: 0, fame: 1, rel: 0, mood: 0.5, r: 'A determined response after retirement.' },
  { k: 'dig', t: '“I am frustrated. Today was not good enough.”', hint: 'Spicy', mor: -2, fame: 2, rel: -1, mood: -0.5, r: 'The frustration is clear, without an agreed verdict on the cause.' }
] };
function pressMake(S, P, ci) {
  var team = P.car.team != null ? P.car.team : P.car.d.team;
  var exp = teamRank(S, team) * 2 - 0.5, dlt = P.dnf ? -99 : exp - P.pos;
  var kind = P.dnf ? (/mechanical/i.test(String(P.car.dnf)) ? 'mech' : 'dnf') : P.pos === 1 ? 'win' : P.pos <= 3 ? 'pod' : P.pos <= 10 ? (dlt < -3 ? 'bad' : 'pts') : (dlt >= 2 ? 'over' : 'bad');
  var big = kind === 'win' || kind === 'pod' || kind === 'over' || P.dnf || (kind === 'bad' && P.pos > 14) || P.car.grid - P.pos >= 4 || isHome(S, ci);
  if (!big && rnd() > 0.35) return null;
  return { kind: kind, home: isHome(S, ci), done: null };
}

function pressApply(S, o, home) {
  var before = { mor: S.morale == null ? 50 : S.morale, fame: fameOf(S), rel: (repInit(S).rel[S.drivers[S.pi].team] || 0) };
  var m = home ? 2 : 1;
  S.morale = clamp((S.morale == null ? 50 : S.morale) + o.mor, 0, 100);
  S.fame = clamp(fameOf(S) + o.fame * m, 0, 100);
  var r = repInit(S), tid = S.drivers[S.pi].team; r.rel[tid] = clamp((r.rel[tid] || 0) + o.rel, -10, 10);
  sponActive(S).forEach(function (d) { d.mood = (d.mood || 0) + o.mood * 0.5; });
  return { mor: S.morale - before.mor, fame: S.fame - before.fame, rel: r.rel[tid] - before.rel };
}
function pressChanges(pr, c) {
  var e = pr.effects || { mor: c.mor, fame: c.fame * (pr.home ? 2 : 1), rel: c.rel };
  return [['Morale', e.mor], ['Fame', e.fame], ['Team', e.rel]].map(function (x) { return [x[0], Math.round(x[1] * 10) / 10]; });
}
function pressHTML(pr) {
  if (!pr) return '';
  var Q = PRESS[pr.kind], h = '<div class="card stack press"><div class="row sp"><h3>Press conference</h3><span class="mono dim">' + (pr.home ? 'Home race · double fame' : 'Post-race') + '</span></div><p style="margin:0"><b>' + Q.q + '</b></p>';
  if (pr.done == null) h += Q.o.map(function (o, i) { return '<button class="opt press-o" data-act="press" data-i="' + i + '"><div class="t">' + o.t + '</div><div class="s">' + o.hint + '</div></button>'; }).join('');
  else { var c = Q.o[pr.done]; h += '<div class="press-a"><i>' + c.t + '</i><p>' + c.r + '</p><div class="chips">' + pressChanges(pr, c).map(function (x) { return '<span class="' + (x[1] > 0 ? 'good' : x[1] < 0 ? 'bad' : 'dim') + '">' + x[0] + ' ' + (x[1] > 0 ? '+' : '') + (Math.round(x[1] * 10) / 10) + '</span>'; }).join('') + '</div></div>'; }
  return h + '</div>';
}
if (typeof A !== 'undefined') A['press'] = function (d) {
  var pr = UI.wk && UI.wk.press; if (!pr || pr.done != null) return;
  var o = PRESS[pr.kind].o[+d.i]; if (!o) return; pr.done = +d.i; pr.effects = pressApply(S, o, pr.home); save(); render();
};

/* ---- sidang akhbar pra-musim (modal, sekali setiap musim dari Musim 2) ---- */
function preMake(S) {
  var p = S.drivers[S.pi], t = S.teams[p.team], sh = p.sh && p.sh.length ? p.sh[p.sh.length - 1] : null, tg = t.dev && t.dev.target, rk = teamRank(S, t.id);
  var moved = sh && sh.t !== t.short, ctx = { team: t.name, tg: tg, rk: rk, last: sh ? sh.pos : null, lt: sh ? sh.t : null };
  var kind = moved ? 'move' : sh && sh.s === S.season - 1 && sh.pos > 0 && sh.pos <= 3 ? 'top' : sh && (p.miss || 0) >= 1 ? 'press' : 'std';
  return { s: S.season, kind: kind, ctx: ctx, done: null };
}
var PRE = {
  move: { q: function (c) { return 'New colours, new season. How are you settling in at ' + c.team + '?'; }, o: [
    { k: 'humble', t: '“The team has made me feel at home. I just want to learn and repay their trust.”', hint: 'Safe', mor: 3, fame: 0.5, rel: 2, mood: 0, r: 'The new garage warms to you straight away.' },
    { k: 'conf', t: '“I did not come here to make up the numbers. I am here to win.”', hint: 'Bold', mor: 1, fame: 2, rel: 0, mood: 1, r: 'Headlines everywhere. Now you have to deliver.' },
    { k: 'dig', t: '“There are no excuses now. This team needs to deliver.”', hint: 'Spicy', mor: 0, fame: 3, rel: -1, mood: -1, r: 'The new garage feels the pressure from that quote.' }] },
  top: { q: function (c) { return 'You finished P' + c.last + ' last year. Is the pressure on to do it again?'; }, o: [
    { k: 'humble', t: '“Every season starts from zero. We go race by race.”', hint: 'Safe', mor: 2, fame: 0.5, rel: 1, mood: 0, r: 'Calm and professional. Exactly what the team wants to hear.' },
    { k: 'conf', t: '“I want the championship. Nothing less.”', hint: 'Bold', mor: 1, fame: 2.5, rel: 0, mood: 1, r: 'The fans love it. The garage is already counting the points.' },
    { k: 'dig', t: '“The others should be worried, not me.”', hint: 'Spicy', mor: 0, fame: 3, rel: -1, mood: -0.5, r: 'A soundbite for the ages. Rivals take note.' }] },
  press: { q: function (c) { return 'Last season did not go to plan. What has changed this winter?'; }, o: [
    { k: 'own', t: '“I know what I did wrong. I have worked on it all winter.”', hint: 'Safe', mor: 3, fame: 0, rel: 1.5, mood: 0, r: 'Honest and humble. The engineers respect it.' },
    { k: 'conf', t: '“Judge me on this year. I am a different driver now.”', hint: 'Bold', mor: 1, fame: 1.5, rel: 0, mood: 0.5, r: 'A confident reset. The pressure is yours now.' },
    { k: 'dig', t: '“The car held me back. Give me a good one and see.”', hint: 'Spicy', mor: -2, fame: 2, rel: -2, mood: -1, r: 'The factory reads it twice.' }] },
  std: { q: function (c) { return c.tg != null ? 'The boss wants P' + c.tg + ' in the constructors\' this year. Realistic?' : 'What are your expectations for the team this season?'; }, o: [
    { k: 'humble', t: '“It is a big ask, but we will give everything for it.”', hint: 'Safe', mor: 2, fame: 0.5, rel: 1, mood: 0, r: 'Measured and loyal. The pit wall nods.' },
    { k: 'conf', t: '“We can do better than that. Watch us.”', hint: 'Bold', mor: 1, fame: 2, rel: 0, mood: 1, r: 'Ambition sells. Sponsors perk up.' },
    { k: 'dig', t: '“Targets are easy to set. Cars are harder to build.”', hint: 'Spicy', mor: -1, fame: 2.5, rel: -1.5, mood: -0.5, r: 'A quip aimed at the boss. The boss heard it.' }] }
};
function preHTML(pr) {
  var Q = PRE[pr.kind], h = '<div class="stack press"><div class="row sp"><h3>Pre-season press conference</h3><span class="mono dim">Season ' + pr.s + '</span></div><p style="margin:0"><b>' + Q.q(pr.ctx) + '</b></p>';
  if (pr.done == null) h += Q.o.map(function (o, i) { return '<button class="opt press-o" data-act="pre-a" data-i="' + i + '"><div class="t">' + o.t + '</div><div class="s">' + o.hint + '</div></button>'; }).join('');
  else { var c = Q.o[pr.done]; h += '<div class="press-a"><i>' + c.t + '</i><p>' + c.r + '</p><div class="chips">' + pressChanges(pr, c).map(function (x) { return '<span class="' + (x[1] > 0 ? 'up' : x[1] < 0 ? 'dn' : '') + '">' + x[0] + ' ' + (x[1] > 0 ? '+' : '') + x[1] + '</span>'; }).join('') + '</div></div><button class="btn pri wide" data-act="pre-ok">On to the season</button>'; }
  return h + '</div>';
}
A['pre-a'] = function (d) { var pr = S.pre; if (!pr || pr.done != null) return; var o = PRE[pr.kind].o[+d.i]; if (!o) return; pr.done = +d.i; pr.effects = pressApply(S, o, false); save(); showModal(preHTML(pr)); };
A['pre-ok'] = function () { closeModal(); };
(function () {
  var r0 = render;
  render = function () {
    r0();
    try {
      if (S && S.drivers && !S.sit && UI.screen === 'hub' && S.round === 0 && S.season >= 2 && !$modal.innerHTML) {
        if (!S.pre || S.pre.s !== S.season) { S.pre = preMake(S); save(); showModal(preHTML(S.pre)); }
      }
    } catch (e) { }
  };
})();

/* log ralat: disimpan dalam save (turut ikut Export save) supaya bug yang susah direproduce boleh dikesan */
window.addEventListener('error', function (e) {
  try {
    if (typeof S === 'undefined' || !S || !S.drivers) return;
    S.errs = (S.errs || []).slice(-9);
    S.errs.push({ s: S.season, r: S.round, scr: UI.screen, m: String(e.message || '').slice(0, 160), at: String((e.error && e.error.stack) || '').split('\n').slice(0, 3).join(' | ').slice(0, 300) });
    save();
  } catch (x) { }
});
