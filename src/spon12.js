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
function sponIncome(S) { return sponTotal(S) * 0.6; }
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
    '<div class="fame"><i style="width:' + Math.round(f) + '%"></i></div><p class="dim" style="font-size:12.5px;margin:0">' + (me().nat === 'MY' ? 'Malaysian fans and brands love a home hero: your fame grows faster and sponsors pay more, and the home race counts double. ' : '') + 'Brands pay your team part of their fee, and teams on a tight budget value that a lot.</p>';
  var act = sponActive(S);
  if (act.length) h += '<h4>Active deals</h4>' + act.map(function (d) { var n = sponProg(S, d); return '<div class="sp-r"><div><b>' + esc(d.n) + '</b><span>' + sponTxt(d) + ' · ' + payTxt(d.v) + '/season · ' + d.left + ' left</span></div><em class="' + (n >= d.need.n ? 'good' : '') + '">' + Math.min(n, d.need.n) + '/' + d.need.n + '</em></div>'; }).join('');
  var of = S.sponOffers || [];
  if (of.length) h += '<h4>Offers</h4>' + of.map(function (o, i) { return '<div class="sp-r off"><div><b>' + esc(o.n) + '</b><span>' + sponTxt(o) + ' · ' + payTxt(o.v) + '/season · ' + o.yrs + (o.yrs === 1 ? ' season' : ' seasons') + '</span></div><div class="row" style="gap:6px"><button class="btn sm" data-act="spon-no" data-i="' + i + '">Pass</button><button class="btn sm pri" data-act="spon-yes" data-i="' + i + '">Sign</button></div></div>'; }).join('');
  if (!act.length && !of.length) h += '<p class="dim" style="margin:0">No brands are interested yet. Results and exposure bring them in.</p>';
  return h + '</div>';
}
function sponBannerHTML(cls) {
  var n = (S.sponOffers || []).length; if (!n || S.round > 0) return '';
  return '<div class="' + (cls || '') + ' card spon-b"><div><b>' + n + (n === 1 ? ' brand wants' : ' brands want') + ' to sponsor you</b><span>Sign a deal to bring money to the team.</span></div><button class="btn sm pri" data-act="tab" data-v="saya">See offers</button></div>';
}

/* ---- sidang akhbar ---- */
var PRESS = {
  win: { q: 'The paddock is waiting. How do you sum up the day?', o: [
    { k: 'humble', t: '“This is all down to the team. They gave me a brilliant car.”', hint: 'Safe', mor: 4, fame: 0.5, rel: 1, mood: 0, r: 'The garage loves it. Nobody can fault the humility.' },
    { k: 'conf', t: '“We came here to win, and we are coming for the title.”', hint: 'Bold', mor: 1, fame: 2, rel: 0, mood: 1, r: 'Headline material. Sponsors like a driver with ambition.' },
    { k: 'dig', t: '“Some people said I could not do it. I enjoyed proving them wrong.”', hint: 'Spicy', mor: -2, fame: 3, rel: -0.5, mood: -1, r: 'The clip goes viral. Some at the team wince, one sponsor frowns.' }] },
  pod: { q: 'A podium finish. What was the key today?', o: [
    { k: 'humble', t: '“The strategy was spot on. Great job by everyone.”', hint: 'Safe', mor: 4, fame: 0.5, rel: 1, mood: 0, r: 'The pit wall gets some credit and returns the favour.' },
    { k: 'conf', t: '“Next time we go one step higher. Count on it.”', hint: 'Bold', mor: 1, fame: 2, rel: 0, mood: 1, r: 'Fans love the promise. Sponsors love the fans.' },
    { k: 'dig', t: '“I was faster than the guys ahead. Today just was not my day for luck.”', hint: 'Spicy', mor: -2, fame: 3, rel: -0.5, mood: -1, r: 'A sharp line, and a few eyebrows raised in the motorhome.' }] },
  pts: { q: 'Points in the bag. How was your race?', o: [
    { k: 'humble', t: '“Solid day. We build step by step.”', hint: 'Safe', mor: 2, fame: 0, rel: 0.5, mood: 0, r: 'Professional. The engineers nod.' },
    { k: 'conf', t: '“We left something on the table. I want more.”', hint: 'Bold', mor: 0, fame: 1, rel: 0, mood: 0.5, r: 'Hunger is attractive to everyone, brands included.' },
    { k: 'dig', t: '“Honestly, the car is not good enough for the speed I have.”', hint: 'Spicy', mor: -3, fame: 2, rel: -1.5, mood: -1, r: 'Quoted everywhere. The team principal is not amused.' }] },
  bad: { q: 'A tough one today. What happened out there?', o: [
    { k: 'own', t: '“My mistake. I will learn from it and come back stronger.”', hint: 'Safe', mor: 2, fame: 0, rel: 1, mood: 0, r: 'Respect from the garage. Mistakes happen.' },
    { k: 'car', t: '“The car was just not quick enough today.”', hint: 'Risky', mor: -2, fame: 0.5, rel: -1, mood: -0.5, r: 'True, perhaps, but the engineers noticed who said it.' },
    { k: 'blame', t: '“Ask the pit wall. The strategy cost us everything.”', hint: 'Spicy', mor: -5, fame: 2, rel: -2.5, mood: -1, r: 'Explosive soundbite. Relationships with the team take a hit.' }] }
};
function pressMake(S, P, ci) {
  var kind = P.dnf || P.pos > 14 ? 'bad' : P.pos === 1 ? 'win' : P.pos <= 3 ? 'pod' : P.pos <= 10 ? 'pts' : 'bad';
  var big = kind === 'win' || kind === 'pod' || P.dnf || P.pos - 0 > 14 || (!P.dnf && P.car.grid - P.pos >= 4) || isHome(S, ci);
  if (!big && rnd() > 0.35) return null;
  return { kind: kind, home: isHome(S, ci), done: null };
}
function pressApply(S, o, home) {
  var m = home ? 2 : 1;
  S.morale = clamp((S.morale == null ? 50 : S.morale) + o.mor, 0, 100);
  S.fame = clamp(fameOf(S) + o.fame * m, 0, 100);
  var r = repInit(S), tid = S.drivers[S.pi].team; r.rel[tid] = clamp((r.rel[tid] || 0) + o.rel, -10, 10);
  sponActive(S).forEach(function (d) { d.mood = (d.mood || 0) + o.mood * 0.5; });
}
function pressHTML(pr) {
  if (!pr) return '';
  var Q = PRESS[pr.kind], h = '<div class="card stack press"><div class="row sp"><h3>Press conference</h3><span class="mono dim">' + (pr.home ? 'Home race · double fame' : 'Post-race') + '</span></div><p style="margin:0"><b>' + Q.q + '</b></p>';
  if (pr.done == null) h += Q.o.map(function (o, i) { return '<button class="opt press-o" data-act="press" data-i="' + i + '"><div class="t">' + o.t + '</div><div class="s">' + o.hint + '</div></button>'; }).join('');
  else { var c = Q.o[pr.done]; h += '<div class="press-a"><i>' + c.t + '</i><p>' + c.r + '</p><div class="chips">' + [['Morale', c.mor], ['Fame', c.fame * (pr.home ? 2 : 1)], ['Team', c.rel]].map(function (x) { return '<span class="' + (x[1] > 0 ? 'good' : x[1] < 0 ? 'bad' : 'dim') + '">' + x[0] + ' ' + (x[1] > 0 ? '+' : '') + (Math.round(x[1] * 10) / 10) + '</span>'; }).join('') + '</div></div>'; }
  return h + '</div>';
}
if (typeof A !== 'undefined') A['press'] = function (d) {
  var pr = UI.wk && UI.wk.press; if (!pr || pr.done != null) return;
  var o = PRESS[pr.kind].o[+d.i]; pr.done = +d.i; pressApply(S, o, pr.home); save(); render();
};
