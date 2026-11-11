'use strict';
/* ===== Career v3: Driver's Office, contract offers, contract document and season wrap. Presentation only: market, wallet, sponsor and academy rules are unchanged. ===== */
var CV = { seen: null };
var CV_FAME = [[0, 'Unknown'], [10, 'Local name'], [25, 'Rising name'], [45, 'Well known'], [70, 'Star'], [90, 'Global icon']];
function cvCash(n) { return (n < 0 ? '−' : '') + marketCash(Math.abs(n)); }
function cvHead(eyebrow, title, tag) { return '<div class="tg-head"><div><small>' + eyebrow + '</small><h2>' + title + '</h2></div>' + (tag ? '<span class="tg-tag">' + tag + '</span>' : '') + '</div>'; }
function cvHelp(title, body) { return '<details class="driver-help dg-help"><summary>' + title + '</summary>' + body + '</details>'; }
function cvRoundsLeft() { return Math.max(0, seasonRounds(S) - S.round); }
function cvOpenOffers() { var w = S.market8.window; return w && w.season === S.season && !w.signed ? w.offers.filter(function (o) { return o.status === 'open'; }) : []; }
function cvCarRank(league, team) { var ts = worldView(S, league).teams; return ts.slice().sort(function (a, b) { return teamPower(b) - teamPower(a); }).indexOf(team) + 1; }
function cvBrand(name) {
  var h = 0, i; for (i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 360;
  var ini = name.split(/\s+/).map(function (w) { return w[0]; }).join('').slice(0, 2).toUpperCase();
  return '<span class="cv-logo" style="--bh:' + h + '" aria-hidden="true">' + esc(ini) + '</span>';
}

/* ---------- hero: your contract ---------- */
function cvHero() {
  var p = progressionPlayer(S), t = myTeam(), c = conOf(S, p), l = leagueOf(S), lic = S.market8.license, live = S.contract > 0, offers = cvOpenOffers().length, last = live && S.contract === 1, left = cvRoundsLeft(), car = S.career;
  var side;
  if (l !== 'f1') {
    var pts = lic.earned ? 40 : lic.points, cc = 2 * Math.PI * 40;
    side = '<div class="cv-side"><small>Road to F1</small><div class="cv-path">' + ['f3', 'f2', 'f1'].map(function (x) { return '<span class="' + (x === l ? 'current' : ['f3', 'f2', 'f1'].indexOf(x) < ['f3', 'f2', 'f1'].indexOf(l) ? 'done' : '') + '">' + x.toUpperCase() + '</span>'; }).join('<i></i>') + '</div>' +
      '<div class="cv-lic"><div class="cv-lic-ring"><svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="40" fill="none" stroke="#ffffff22" stroke-width="10"/><circle cx="50" cy="50" r="40" fill="none" stroke="#ffd24a" stroke-width="10" stroke-linecap="round" stroke-dasharray="' + (cc * pts / 40).toFixed(1) + ' ' + cc.toFixed(1) + '" transform="rotate(-90 50 50)"/></svg><b>' + (lic.earned ? '✓' : lic.points) + '</b></div><div><b>F1 superlicence</b><span>' + (lic.earned ? 'Secured for life' : lic.points + ' of 40 points') + '</span><span>' + (l === 'f3' ? 'Win F3 for a funded F2 seat.' : 'Debut needs a seat, a licence and age 18.') + '</span></div></div></div>';
  } else {
    side = '<div class="cv-side"><small>Your F1 chapter</small><div class="cv-f1stats"><div class="gold"><b>' + (car.titles || 0) + '</b><span>Titles</span></div><div><b>' + (car.wins || 0) + '</b><span>Wins</span></div><div><b>' + (car.pods || 0) + '</b><span>Podiums</span></div><div><b>' + (car.starts || 0) + '</b><span>Starts</span></div></div></div>';
  }
  return '<section class="career-hero cv-hero" id="career-contract" style="--tc:' + t.color + '"><span class="cv-water" aria-hidden="true">' + (p.num || '') + '</span>' +
    '<div class="cv-hero-main"><div class="cv-eyebrow"><i></i>' + (live ? 'Signed driver' : 'Between contracts') + ' · ' + l.toUpperCase() + '</div>' +
    '<div class="cv-id">' + helmetSVG(p, 110, false) + '<div><h1>' + esc(p.name) + '</h1><p><span class="cv-team">' + esc(t.short) + '</span> ' + esc(t.name) + ' · age ' + p.age + '</p></div></div>' +
    '<div class="cv-deal"><div><small>' + (live ? 'Salary / season' : 'Race salary') + '</small><b>' + (live ? marketCash(c.pay) : '—') + '</b></div><div><small>' + (live ? 'Contract ends' : 'Last contract') + '</small><b>Season ' + c.end + '</b></div><div class="' + (last ? 'hot' : '') + '"><small>' + (live ? 'Time left' : 'Status') + '</small><b>' + (!live ? 'No seat' : last ? left + (left === 1 ? ' race' : ' races') : S.contract + ' seasons') + '</b></div></div>' +
    (last ? '<div class="cv-alert"><b>⏱ Final contract year.</b> Your seat runs out after ' + (left ? 'the next ' + left + (left === 1 ? ' race' : ' races') : 'this season') + '. Results now decide your next deal.</div>' : '') +
    '<div class="cv-chips">' + (c.wb ? '<span>Win bonus ' + marketCash(c.wb) + '</span>' : '') + (c.opt ? '<span>' + (c.opt.used ? 'Option settled' : c.opt.by === 'driver' ? 'You hold a +1 option' : 'Team holds a +1 option') + '</span>' : '') + '</div>' +
    (offers ? '<a class="btn cv-cta" href="#career-market">' + offers + ' seat ' + (offers === 1 ? 'offer' : 'offers') + ' on the table →</a>' : '') + '</div>' + side + '</section>';
}

/* ---------- inbox strip ---------- */
function cvInbox() {
  var items = [], sp = (S.sponOffers || []).length, seats = cvOpenOffers().length, ac = S.market8.academyOffers.filter(function (o) { return o.status === 'open' && o.season === S.season; }).length;
  if (seats) items.push(['#career-market', '📝', seats + ' seat ' + (seats === 1 ? 'offer' : 'offers')]);
  if (sp) items.push(['#career-sponsors', '💼', sp + ' sponsor ' + (sp === 1 ? 'offer' : 'offers')]);
  if (ac) items.push(['#career-academy', '🎓', ac + ' academy ' + (ac === 1 ? 'offer' : 'offers')]);
  if (!items.length) return '';
  return '<nav class="cv-inbox" aria-label="Waiting for your decision"><b>On your desk</b>' + items.map(function (x) { return '<a href="' + x[0] + '"><span aria-hidden="true">' + x[1] + '</span>' + x[2] + ' →</a>'; }).join('') + '</nav>';
}

/* ---------- wallet ---------- */
function cvWallet() {
  var m = S.market8, w = S.wallet, pack = m.commitment && m.commitment.package, agent = m.agent === S.season, neg = w.balance < 0;
  var cur = w.ledger.filter(function (r) { return r.season === S.season && r.round != null && !/^(entry|seat|agent|academy)/.test(r.key || ''); }), lastR = cur.length ? Math.max.apply(null, cur.map(function (r) { return r.round; })) : null, inn = 0, out = 0;
  if (lastR != null) cur.forEach(function (r) { if (r.round === lastR) { if (r.amount >= 0) inn += r.amount; else out -= r.amount; } });
  var net = inn - out, top = Math.max(inn, out, 0.000001);
  var h = '<section class="card career-panel career-wallet cv-wallet" id="career-wallet">' + cvHead('Personal wallet', 'Your money', neg ? 'Overdrawn' : '') +
    '<b class="cv-cash ' + (neg ? 'neg' : '') + '">' + cvCash(w.balance) + '</b>';
  if (lastR != null) h += '<div class="cv-flow ' + (net < 0 ? 'neg' : 'pos') + '"><div class="cv-flow-row"><span>In</span><i><u class="in" style="width:' + (inn / top * 100) + '%"></u></i><b>+' + marketCash(inn) + '</b></div><div class="cv-flow-row"><span>Out</span><i><u class="out" style="width:' + (out / top * 100) + '%"></u></i><b>−' + marketCash(out) + '</b></div><p><b>' + (net < 0 ? '▼ ' : '▲ ') + cvCash(net) + ' per round</b> at the last race.' + (net < 0 ? ' Costs are higher than your pay. A sponsor closes the gap.' : '') + '</p></div>';
  else h += '<p class="tg-note">No race income yet this season. Salary and costs post after every round.</p>';
  h += '<div class="cv-tx"><small>Latest</small>' + (w.ledger.length ? w.ledger.slice(-4).reverse().map(function (r) { return '<div><span>' + esc(r.label) + '</span><b class="' + (r.amount < 0 ? 'neg' : 'pos') + '">' + (r.amount < 0 ? '−' : '+') + marketCash(Math.abs(r.amount)) + '</b></div>'; }).join('') : '<p class="tg-note">No transactions recorded yet.</p>') + '</div>';
  if (w.ledger.length > 4) h += cvHelp('Older transactions', '<div class="cv-tx">' + w.ledger.slice(-14, -4).reverse().map(function (r) { return '<div><span>' + esc(r.label) + '</span><b class="' + (r.amount < 0 ? 'neg' : 'pos') + '">' + (r.amount < 0 ? '−' : '+') + marketCash(Math.abs(r.amount)) + '</b></div>'; }).join('') + '</div>');
  if (pack) h += cvHelp('Seat funding already committed', '<div class="career-funding-grid">' + [['You paid', pack.own], ['Academy', pack.academy], ['Programme', pack.grant]].concat(pack.promotion ? [['Promotion award', pack.promotion]] : []).map(function (x) { return driverMetric(x[0], marketCash(x[1]), ''); }).join('') + '</div><p>This package was committed when you signed. It is not another bill or extra wallet cash.</p>');
  h += '<div class="cv-agent ' + (agent ? 'on' : '') + '"><span class="cv-agent-ico" aria-hidden="true">🕴️</span><div><b>' + (agent ? 'Agent working for you' : 'Hire an agent') + '</b><p>' + (agent ? 'Pushing borderline teams to make an offer this winter.' : 'Pushes borderline teams to make an offer this winter.') + '</p></div><button class="btn sm" data-act="market-agent" ' + (agent || w.balance < MARKET8.agentFee ? 'disabled' : '') + '>' + (agent ? 'Active' : marketCash(MARKET8.agentFee)) + '</button></div>' +
    cvHelp('How your money works', '<p>Salary, bonuses and sponsors pay your wallet. Team budgets are separate. An agent cannot create a seat that does not exist; the fee covers one season.</p>');
  return h + '</section>';
}

/* ---------- fame and sponsors ---------- */
function cvFame() {
  var f = fameOf(S), act = sponActive(S), offers = S.sponOffers || [], tier = 0, i;
  for (i = 0; i < CV_FAME.length; i++) if (f >= CV_FAME[i][0]) tier = i;
  var next = CV_FAME[tier + 1], base = CV_FAME[tier][0], prog = next ? clamp((f - base) / (next[0] - base) * 100, 0, 100) : 100, slots = '';
  act.forEach(function (d) {
    var n = sponProg(S, d), done = Math.min(n, d.need.n);
    slots += '<div class="cv-brand on">' + cvBrand(d.n) + '<div class="cv-brand-m"><b>' + esc(d.n) + '</b><small>Signed · ' + d.left + (d.left === 1 ? ' season left' : ' seasons left') + '</small><p>' + esc(sponTxt(d)) + ' · ' + done + ' / ' + d.need.n + '</p>' + driverMeter(done, Math.max(1, d.need.n), 'Sponsor target progress') + '</div><span class="cv-brand-v"><b>' + marketCash(d.v) + '</b><small>/ season</small></span></div>';
  });
  offers.forEach(function (o, i) {
    slots += '<div class="cv-brand offer">' + cvBrand(o.n) + '<div class="cv-brand-m"><b>' + esc(o.n) + '</b><small>New offer · ' + o.yrs + (o.yrs === 1 ? ' season' : ' seasons') + '</small><p>Target: ' + esc(sponTxt(o)) + '</p></div><span class="cv-brand-v"><b>' + marketCash(o.v) + '</b><small>/ season</small></span><div class="ability-actions cv-brand-act"><button class="btn sm" data-act="spon-no" data-i="' + i + '">Pass</button><button class="btn sm pri" data-act="spon-yes" data-i="' + i + '">Sign sponsor</button></div></div>';
  });
  for (i = act.length; i < SP.max; i++) slots += offers.length && i === act.length ? '' : '<div class="cv-brand empty"><span class="cv-logo" aria-hidden="true">+</span><div class="cv-brand-m"><b>Open sponsor slot</b><small>' + (i === act.length ? 'Offers are reviewed at the season break.' : 'Grow your fame to fill it.') + '</small></div></div>';
  return '<section class="card career-panel career-sponsors cv-fame" id="career-sponsors">' + cvHead('Fame &amp; sponsors', 'Build your name', act.length + ' / ' + SP.max + ' deals') +
    '<ol class="cv-fame-ladder">' + CV_FAME.map(function (x, i) { return '<li class="' + (i < tier ? 'past' : i === tier ? 'current' : 'locked') + '"><b>' + x[1] + '</b><small>' + x[0] + '+</small></li>'; }).join('') + '</ol>' +
    '<div class="cv-fame-bar"><span><b>' + Math.round(f) + '</b> fame</span><i><u style="width:' + prog + '%"></u></i><span>' + (next ? (Math.ceil(next[0] - f)) + ' to ' + next[1] : 'Top level') + '</span></div>' +
    '<div class="cv-brands">' + slots + '</div>' +
    cvHelp('How sponsor money works', '<p>Personal sponsor fees pay your wallet. Seat funding is agreed separately. Results and press exposure affect fame.' + (me().nat === 'MY' ? ' Malaysian drivers receive home-market fame and sponsor bonuses.' : '') + '</p>') + '</section>';
}

/* ---------- scout radar ---------- */
function cvScouts() {
  var list = Object.keys(S.market8.scouts).map(function (k) { return S.market8.scouts[k]; }).filter(function (s) { return scoutRelevant(S, s); }), mine = myTeam();
  var rows = list.map(function (s) { var team = worldView(S, s.league || 'f1').teams[s.team], offer = scoutNegotiating(S, s); return { s: s, team: team, offer: offer, lvl: offer ? 3 : s.stage || 0, own: s.kind !== 'academy' && (s.league || 'f1') === leagueOf(S) && team.id === mine.id }; }).sort(function (a, b) { return b.lvl - a.lvl; });
  var blips = rows.map(function (r, i) { var ang = (i * 137.5 + 20) * Math.PI / 180, rad = [44, 34, 22, 12][r.lvl]; return '<circle class="l' + r.lvl + '" cx="' + (50 + Math.cos(ang) * rad).toFixed(1) + '" cy="' + (50 + Math.sin(ang) * rad).toFixed(1) + '" r="' + (r.lvl >= 2 ? 4 : 3) + '" fill="' + r.team.color + '"/>'; }).join('');
  var radar = '<div class="cv-radar ' + (rows.length ? 'live' : '') + '" aria-hidden="true"><svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="46"/><circle cx="50" cy="50" r="32"/><circle cx="50" cy="50" r="18"/><path d="M50 4v92M4 50h92"/><path class="sweep" d="M50 50L50 4A46 46 0 0 1 90 28Z"/>' + blips + '<circle class="me" cx="50" cy="50" r="3.5"/></svg></div>';
  var h = '<section class="card career-panel career-scouts cv-scouts" id="career-scouts">' + cvHead('Scout radar', 'Who is watching you?', rows.length + (rows.length === 1 ? ' team' : ' teams'));
  if (!rows.length) return h + '<div class="cv-radar-empty">' + radar + '<div><b>Nobody on the radar yet</b><p>Race results and consistency put you on a team\'s list.</p></div></div>' + cvHelp('What does interest mean?', '<p>Interest is a signal. Only a real contract offer gives you a seat or academy place.</p>') + '</section>';
  h += '<div class="cv-radar-wrap">' + radar + '<div class="cv-radar-key"><span><i class="l3"></i>Offer</span><span><i class="l2"></i>Strong interest</span><span><i class="l1"></i>Watching</span><span><i class="l0"></i>Detected</span></div></div><div class="cv-scout-list">' +
    rows.map(function (r) {
      var s = r.s, stage = ['Detected', 'Watching', 'Strong interest', 'Offer ready'][r.lvl], trend = s.trend > 1 ? '<em class="up">▲ rising</em>' : s.trend < -1 ? '<em class="dn">▼ cooling</em>' : '';
      return '<details class="career-scout cv-scout l' + r.lvl + '"><summary><span class="career-scout-logo" style="--tc:' + r.team.color + '">' + esc(r.team.short) + '</span><span class="career-scout-name"><b>' + esc(r.team.name) + '</b><small>' + (r.own ? 'Your team · renewal' : s.kind === 'academy' ? 'Academy place' : s.league.toUpperCase() + ' seat') + ' ' + trend + '</small></span><span class="cv-stage"><i></i><i></i><i></i>' + stage + '</span></summary><div class="career-scout-body"><b>Why they noticed you</b><p>' + esc(s.reason || 'Assessment in progress.') + '</p><b>What still needs to happen</b><p>' + esc(s.blocker || 'Assessment pending.') + '</p>' + (s.want ? '<p class="driver-insight">' + esc(s.want) + '</p>' : '') + (r.offer ? '<a class="btn sm" href="' + (s.kind === 'academy' ? '#career-academy' : '#career-market') + '">Review the offer →</a>' : '') + '</div></details>';
    }).join('') + '</div>' + cvHelp('What does interest mean?', '<p>Interest is a signal. Only a real contract offer gives you a seat or academy place. Open a team to see why they noticed you and what is still missing.</p>');
  return h + '</section>';
}

/* ---------- academy ---------- */
function cvAcademy() {
  var m = S.market8, a = m.academy, p = progressionPlayer(S), eligible = leagueOf(S) !== 'f1' && p.age <= MARKET8.academyAge, offers = m.academyOffers.filter(function (o) { return o.status === 'open' && o.season === S.season; }), program = m.program;
  if (!a && !eligible && !offers.length) return '';
  var h = '<section class="card career-panel career-academy cv-academy" id="career-academy">' + cvHead('Academy', a ? 'Your backing' : 'Find your backing', a ? 'Member' : 'Independent');
  h += offers.map(function (o) { var t = worldView(S, 'f1').teams[o.team]; return '<div class="cv-acad-offer" style="--tc:' + t.color + '"><span class="career-scout-logo" style="--tc:' + t.color + '">' + esc(t.short) + '</span><div><b>' + esc(t.name) + ' academy</b><small>Offer on the table · ' + Math.round(o.support * 100) + '% seat support</small></div><button class="btn sm pri" data-act="academy-review" data-v="' + o.id + '">Review offer →</button></div>'; }).join('');
  if (a) {
    var t = worldView(S, 'f1').teams[a.team];
    h += '<div class="cv-acad-card" style="--tc:' + t.color + '"><span class="career-scout-logo" style="--tc:' + t.color + '">' + esc(t.short) + '</span><div><small>Junior of</small><b>' + esc(t.name) + '</b></div></div><div class="cv-tiles2"><div><small>Seat support</small><b>' + Math.round(a.support * 100) + '%</b></div><div><small>Runs to</small><b>S' + a.until + '</b></div></div>' +
      cvHelp('Leaving your academy', '<p>Your academy supports funding and coaching. An F1 race seat still needs its own offer. Release costs ' + marketCash(a.release) + '. Coaching and future funding end when you leave.</p><button class="btn sm" data-act="academy-release">Review release →</button>');
  } else if (eligible) {
    h += '<p class="tg-note">An F1 team\'s academy pays part of your junior seat and adds coaching. Ask a team to look at you, or let results do the talking.</p><div class="cv-acad-list">' + worldView(S, 'f1').teams.map(function (t) {
      var s = m.scouts['academy:' + t.id], req = s && s.requested;
      return '<div style="--tc:' + t.color + '"><span class="career-scout-logo" style="--tc:' + t.color + '">' + esc(t.short) + '</span><span><b>' + esc(t.name) + '</b>' + (req ? '<small>' + esc(s.decision || 'Monitoring') + '</small>' : '') + '</span><button class="btn sm" data-act="academy-interest" data-v="' + t.id + '" ' + (req ? 'disabled' : '') + '>' + (req ? 'Asked' : 'Ask') + '</button></div>';
    }).join('') + '</div>';
  }
  if (program && marketFirstF1(S)) h += '<p class="cv-program"><b>F1 pathway:</b> ' + esc(worldView(S, 'f1').teams[program.team].name) + ' is your planned next-season opportunity. Eligibility and the driver market still apply.</p>';
  return h + '</section>';
}

/* ---------- record ---------- */
function cvRecord() {
  var c = S.career, hist = (S.hist || []), done = hist.filter(function (r) { return !r.inactive; }).length;
  return '<section class="card career-panel career-record cv-record" id="career-record">' + cvHead('Career stats', 'Trophy cabinet', done ? done + (done === 1 ? ' season' : ' seasons') : 'Rookie season') +
    '<div class="career-record-grid cv-trophies">' + [['Starts', c.starts], ['Wins', c.wins], ['Podiums', c.pods], ['Points', c.pts], ['F1 titles', c.titles], ['Junior titles', c.juniorTitles || 0]].map(function (x) { return '<div class="driver-metric ' + (x[1] ? 'has' : '') + (x[0].indexOf('titles') > 0 && x[1] ? ' gold' : '') + '"><small>' + x[0] + '</small><b>' + (x[1] || 0) + '</b></div>'; }).join('') + '</div>' +
    '<div class="cv-minor">' + [['Poles', c.poles], ['Fastest laps', c.fl], ['DNFs', c.dnf]].map(function (x) { return '<span><b>' + (x[1] || 0) + '</b> ' + x[0] + '</span>'; }).join('') + '</div>' +
    (!hist.length ? '<p class="tg-empty">Your first season is in progress. Every finished season adds a line here.</p>' : '<div class="cv-seasons">' + hist.slice().reverse().map(function (r) { var pos = r.inactive ? 'Out' : r.reserve ? 'Res' : r.pos ? 'P' + r.pos : '—'; return '<div class="' + (r.pos === 1 ? 'champ' : r.pos && r.pos <= 3 ? 'pod' : '') + '"><span class="s">S' + r.season + '</span><span class="l">' + (r.league || (r.jr ? 'f2' : 'f1')).toUpperCase() + '</span><span class="t">' + esc(r.team || '—') + '</span><b>' + pos + '</b><span class="p">' + (r.pts || 0) + ' pts</span></div>'; }).join('') + '</div>') + '</section>';
}

/* ---------- contract offers ---------- */
marketOfferHTML = function (o) {
  var t = worldView(S, o.league).teams[o.team], p = o.package, rank = cvCarRank(o.league, t), n = worldView(S, o.league).teams.length, mine = myTeam(), cur = conOf(S, progressionPlayer(S)), live = S.contract > 0 || cur;
  var open = cvOpenOffers(), bestPay = open.length > 1 && open.every(function (x) { return x.pay <= o.pay; }) && open.some(function (x) { return x.pay < o.pay; }), bestCar = open.length > 1 && open.every(function (x) { return cvCarRank(x.league, worldView(S, x.league).teams[x.team]) >= rank; }) && open.filter(function (x) { return x.league === o.league; }).length === open.length;
  var role = o.program ? 'Rookie programme' : o.renew ? 'Renewal' : o.loan ? 'Academy loan' : 'Race driver', same = o.league === leagueOf(S) && t.id === mine.id, step = o.league !== leagueOf(S);
  var dPay = cur ? o.pay - cur.pay : 0, myRank = cvCarRank(leagueOf(S), mine);
  var lines = [['Salary', '+' + marketCash(o.pay), 'pos']];
  if (p.academy) lines.push(['Academy funding', marketCash(p.academy), '']);
  if (p.grant) lines.push(['Programme support', marketCash(p.grant), '']);
  if (p.promotion) lines.push(['Promotion award (paid to the seat)', marketCash(p.promotion), '']);
  if (p.cost) lines.push(['Season seat cost', marketCash(p.cost), '']);
  if (p.own) lines.push(['You pay from your wallet', '−' + marketCash(p.own), 'neg']);
  if (o.buy) lines.push(['Buyout paid by the team', marketCash(o.buy.cost), '']);
  return '<article class="career-offer cv-offer' + (same ? ' same' : '') + '" style="--tc:' + t.color + '"><header><div class="cv-offer-car">' + carSVG(t, 240) + '</div><div class="cv-offer-id"><small>' + o.league.toUpperCase() + (step ? ' · step up' : '') + ' · ' + role + '</small><h3>' + esc(t.name) + '</h3></div>' +
    '<div class="cv-offer-flags">' + (bestCar ? '<span class="gold">Best car</span>' : '') + (bestPay ? '<span class="gold">Best pay</span>' : '') + (same ? '<span>Your team</span>' : '') + '</div></header>' +
    '<div class="cv-offer-pay"><b>' + marketCash(o.pay) + '</b><span>per season · ' + o.years + (o.years > 1 ? ' seasons' : ' season') + '</span>' + (cur && !same && Math.abs(dPay) > 0.0005 ? '<em class="' + (dPay > 0 ? 'up' : 'dn') + '">' + (dPay > 0 ? '▲ +' : '▼ −') + marketCash(Math.abs(dPay)) + ' vs now</em>' : '') + '</div>' +
    '<div class="cv-offer-tiles"><div><small>Car pace</small><b>#' + rank + '<i> of ' + n + '</i></b>' + (!step && !same ? '<span class="' + (rank < myRank ? 'up' : rank > myRank ? 'dn' : '') + '">' + (rank < myRank ? '▲ ' : rank > myRank ? '▼ ' : '') + 'yours is #' + myRank + '</span>' : '<span>' + (t.spec ? 'Spec car' : 'Team R&amp;D') + '</span>') + '</div><div><small>Expectation</small><b>' + (rank <= 3 ? 'Win now' : rank <= Math.ceil(n * 0.6) ? 'Score points' : 'Develop') + '</b><span>' + (rank <= 3 ? 'High pressure' : 'Room to grow') + '</span></div><div><small>Deadline</small><b>' + (o.protected ? 'Held' : 'Round ' + o.expires) + '</b><span>' + (o.protected ? 'Stays until you decide' : 'of the market') + '</span></div></div>' +
    '<p class="cv-offer-why"><b>Why you:</b> ' + esc(o.reason) + '</p>' +
    (lines.length > 1 ? '<div class="cv-offer-lines">' + lines.map(function (x) { return '<div><span>' + x[0] + '</span><b class="' + x[2] + '">' + x[1] + '</b></div>'; }).join('') + '</div>' : '') +
    '<div class="cv-offer-act"><button class="btn pri" data-act="market-review" data-v="' + o.id + '">Review contract</button>' + (!o.protected ? '<button class="btn sm" data-act="market-reject" data-v="' + o.id + '">Decline</button>' : '') + '</div></article>';
};
marketWindowHTML = function () {
  var w = S.market8.window; if (!w || w.season !== S.season || w.signed) return '';
  var offers = w.offers.filter(function (o) { return o.status === 'open'; });
  return '<section class="cv-market"><div class="cv-market-head"><div><small>Silly season</small><h2>Driver market</h2></div><ol class="cv-rounds" aria-label="Market round ' + w.round + ' of 3">' + [1, 2, 3].map(function (n) { return '<li class="' + (n < w.round ? 'past' : n === w.round ? 'current' : '') + '">' + n + '</li>'; }).join('') + '</ol></div>' +
    '<p class="cv-market-copy">' + (offers.length ? offers.length + (offers.length === 1 ? ' team wants' : ' teams want') + ' you. Sign one and the others walk away.' : 'No race-seat offers right now. ' + (marketFirstF1(S) ? 'Keep reviewing available junior funding and licence requirements.' : 'Review the career decision below after the final market round closes.')) + '</p>' +
    '<div class="cv-offers" style="--n:' + Math.max(1, Math.min(offers.length, 3)) + '">' + offers.map(marketOfferHTML).join('') + '</div>' +
    (w.round < 3 ? '<div class="cv-market-next"><button class="btn" data-act="market-next">Wait for market round ' + (w.round + 1) + ' →</button><span>Waiting can bring new offers, but unsigned ones can expire.</span></div>' : '') +
    (typeof comebackHTML === 'function' ? comebackHTML() : '') + '</section>';
};

/* ---------- contract document ---------- */
A['market-review'] = function (d) {
  var w = S.market8.window, o = w.offers.filter(function (o) { return o.id === d.v && o.status === 'open'; })[0]; if (!o) return;
  var t = worldView(S, o.league).teams[o.team], p = o.package, pl = progressionPlayer(S), mine = myTeam(), cur = conOf(S, pl), rank = cvCarRank(o.league, t), myRank = cvCarRank(leagueOf(S), mine), short = p.own > S.wallet.balance;
  var clauses = [['Term', o.years + (o.years > 1 ? ' seasons' : ' season') + ', from Season ' + (S.season + 1)], ['Salary', marketCash(o.pay) + ' per season'], ['Role', o.program ? 'Rookie programme driver' : o.renew ? 'Race driver (renewal)' : o.loan ? 'Race driver on academy loan' : 'Race driver'], ['Renewal', o.loan ? 'Academy membership continues' : 'Decided by results']];
  if (p.cost) clauses.push(['Seat funding', 'Season cost ' + marketCash(p.cost) + (p.academy ? ' · academy ' + marketCash(p.academy) : '') + (p.grant ? ' · programme ' + marketCash(p.grant) : '') + (p.promotion ? ' · promotion award ' + marketCash(p.promotion) : '')]);
  clauses.push(['You pay', p.own ? marketCash(p.own) + ' from your wallet on signing' : 'Nothing']);
  if (o.buy) clauses.push(['Buyout', 'The team pays ' + marketCash(o.buy.cost) + ' to free the seat']);
  var cmp = [['Team', esc(mine.name), esc(t.name), 0], ['Series', leagueOf(S).toUpperCase(), o.league.toUpperCase(), 0], ['Car pace', '#' + myRank, '#' + rank, o.league === leagueOf(S) ? myRank - rank : 0], ['Salary', cur ? marketCash(cur.pay) : '—', marketCash(o.pay), cur ? o.pay - cur.pay : 0]];
  showModal('<div class="cv-doc" style="--tc:' + t.color + '"><header><span class="cv-doc-mono">' + esc(t.short) + '</span><div><small>Driver contract · ' + o.league.toUpperCase() + '</small><h2>' + esc(t.name) + '</h2></div><div class="cv-doc-car">' + carSVG(t, 150) + '</div></header>' +
    '<p class="cv-doc-parties">Between <b>' + esc(t.name) + '</b> and <b>' + esc(pl.name) + '</b>, driver #' + pl.num + '.</p>' +
    '<ol class="cv-clauses">' + clauses.map(function (c) { return '<li><small>' + c[0] + '</small><b>' + c[1] + '</b></li>'; }).join('') + '</ol>' +
    '<div class="cv-cmp"><div class="h"><span></span><span>Now</span><span>This offer</span></div>' + cmp.map(function (r) { return '<div><span>' + r[0] + '</span><span>' + r[1] + '</span><b class="' + (r[3] > 0 ? 'up' : r[3] < 0 ? 'dn' : '') + '">' + r[2] + (r[3] > 0 ? ' ▲' : r[3] < 0 ? ' ▼' : '') + '</b></div>'; }).join('') + '</div>' +
    (short ? '<p class="cv-doc-warn">Your wallet (' + cvCash(S.wallet.balance) + ') does not cover the ' + marketCash(p.own) + ' you pay on signing.</p>' : '') +
    '<div class="cv-sign"><div><small>Driver signature</small><span class="cv-sig">' + esc(pl.name) + '</span></div><div><small>Valid until</small><b>' + (o.protected ? 'You decide' : 'Market round ' + o.expires) + '</b></div></div>' +
    '<p class="cv-doc-note">Signing withdraws every other seat offer.</p>' +
    '<button class="btn pri wide cv-sign-btn" data-act="market-sign" data-v="' + o.id + '">✍ Sign contract</button><button class="btn wide" data-act="mclose">Back</button></div>');
  var m = document.querySelector('#modal .mbox'); if (m) m.classList.add('mbpf');
};

/* ---------- career page ---------- */
var cvOldCareer = hKerjaya;
hKerjaya = function () {
  if (S.mode !== 'pro' || S.sit) return cvOldCareer();
  var p = progressionPlayer(S), mate = mateOf(S, p), market = marketWindowHTML(), extra = repCardHTML(S) + mktCard(''), key = S.season + ':' + S.round, fresh = CV.seen !== key; CV.seen = key;
  return '<div class="career-hq cv' + (fresh ? ' cv-in' : '') + '" style="--tc:' + myTeam().color + '">' + cvHero() + cvInbox() + (market ? '<div class="career-market cv-wide" id="career-market">' + market + '</div>' : '') +
    (function () { var ac = cvAcademy(); return '<div class="bento-column">' + cvFame() + cvScouts() + (ac ? cvRecord() : '') + '</div><div class="bento-column">' + cvWallet() + ac + (ac ? '' : cvRecord()) + '</div>'; })() +
    (extra ? '<div class="career-extra cv-wide">' + extra + '</div>' : '') +
    (p.age >= 38 || p.age >= 35 && mate && mate.age <= 24 ? '<section class="card career-panel career-decisions cv-wide">' + cvHead('Next chapter', 'Big decisions') + (p.age >= 38 ? '<p class="tg-note">You may keep racing with a valid seat through age 44, or retire now.</p><button class="btn" data-act="retire">Retire from racing</button>' : '') + (p.age >= 35 && mate && mate.age <= 24 ? '<button class="btn" data-act="mentor" ' + (S.career9.mentorSeason === S.season ? 'disabled' : '') + '>Mentor ' + esc(mate.name) + '</button>' : '') + '</section>' : '') + '</div>';
};
(function () { var tab0 = A['tab']; A['tab'] = function (d) { if (d && d.v === 'kerjaya' && UI.tab !== 'kerjaya') CV.seen = null; return tab0(d); }; })();

/* ---------- season wrap ---------- */
function svOrd(n) { return n + (n % 100 >= 11 && n % 100 <= 13 ? 'th' : ['th', 'st', 'nd', 'rd'][n % 10] || 'th'); }
function svConfetti(col) { var c = '', i; for (i = 0; i < 34; i++) c += '<i style="left:' + Math.round(Math.random() * 100) + '%;animation-delay:' + (Math.random() * 2.4).toFixed(2) + 's;animation-duration:' + (2.6 + Math.random() * 2).toFixed(2) + 's;background:' + (i % 3 === 0 ? '#ffd24a' : i % 3 === 1 ? col : '#fff') + '"></i>'; return '<div class="sv-conf" aria-hidden="true">' + c + '</div>'; }
function svHero(sm) {
  var r = sm.rec, p = me(), t = myTeam(), l = leagueOf(S).toUpperCase(), champ = r.pos === 1, pod = r.pos <= 3, ev = typeof evaluationSummary === 'function' ? evaluationSummary(S) : null, g = ev && ev.sts != null && typeof dgGrade === 'function' ? dgGrade(ev.sts) : null;
  var line = champ ? (l === 'F1' ? 'World Champion' : l + ' Champion') : pod ? 'Championship podium' : r.pos <= 10 ? 'Top-ten season' : 'Season complete';
  return '<section class="sv-hero ' + (champ ? 'champ' : pod ? 'pod' : '') + '" style="--tc:' + t.color + '">' + (pod ? svConfetti(t.color) : '') + '<span class="sv-water" aria-hidden="true">' + S.season + '</span>' +
    '<div class="sv-hero-main"><div class="cv-eyebrow"><i></i>' + l + ' · Season ' + S.season + ' · Final classification</div>' +
    '<div class="sv-pos"><b>P' + r.pos + '</b><div><h1>' + line + '</h1><p>' + esc(p.name) + ' · ' + esc(r.team || t.name) + '</p></div></div>' +
    '<div class="sv-stats"><div><b>' + r.pts + '</b><small>Points</small></div><div><b>' + r.wins + '</b><small>Wins</small></div><div><b>' + r.pods + '</b><small>Podiums</small></div>' + (g ? '<div class="grade g' + g + '"><b>' + g + '</b><small>Grade</small></div>' : '') + '</div>' +
    (champ ? '<p class="sv-line">🏆 You are the ' + (l === 'F1' ? 'Formula 1 World Champion' : l + ' Champion') + '. Nobody can take this one away.</p>' : '<p class="sv-line">' + (l === 'F1' ? 'World Champion' : l + ' Champion') + ': <b>' + esc(r.champ) + '</b> (' + esc(r.champTeam) + ').</p>') + '</div>' +
    '<div class="sv-hero-art">' + helmetSVG(p, 150, false) + '<div class="sv-hero-car">' + carSVG(t, 300) + '</div></div></section>';
}
function svPodium(sm) {
  var ds = sm.ds.slice(0, 6).map(function (id) { return S.drivers[id]; }), top = [ds[1], ds[0], ds[2]], mineId = me().id;
  var pod = '<div class="sv-podium">' + top.map(function (d, i) { if (!d) return ''; var pos = [2, 1, 3][i], t = S.teams[d.team]; return '<div class="p' + pos + (d.id === mineId ? ' me' : '') + '" style="--tc:' + (t ? t.color : '#888') + '">' + helmetSVG(d, pos === 1 ? 70 : 56, false) + '<b>' + esc(d.name) + '</b><small>' + d.pts + ' pts</small><span>' + pos + '</span></div>'; }).join('') + '</div>';
  var rest = ds.slice(3).map(function (d, i) { var t = S.teams[d.team]; return '<div class="' + (d.id === mineId ? 'me' : '') + '" style="--tc:' + (t ? t.color : '#888') + '"><span class="tg-pos">' + (i + 4) + '</span><i></i><b>' + esc(d.name) + '</b><span>' + d.pts + '</span></div>'; }).join('');
  var maxT = Math.max.apply(null, sm.ts.slice(0, 5).map(function (id) { return S.teams[id].pts; }).concat([1])), myT = myTeam().id;
  var teams = sm.ts.slice(0, 5).map(function (id, i) { var t = S.teams[id]; return '<div class="' + (id === myT ? 'me' : '') + '" style="--tc:' + t.color + '"><span class="tg-pos">' + (i + 1) + '</span><b>' + esc(t.short) + '</b><i><u style="width:' + clamp(t.pts / maxT * 100, 3, 100) + '%"></u></i><span>' + t.pts + '</span></div>'; }).join('');
  return '<section class="card sv-card sv-drivers">' + cvHead('Drivers', 'Championship podium') + pod + '<div class="sv-rest">' + rest + '</div></section><section class="card sv-card sv-teams">' + cvHead('Constructors', 'Top five') + '<div class="sv-team-rows">' + teams + '</div></section>';
}
function svVerdict(sm) {
  var h = '';
  if (sm.obj) {
    var ok = sm.obj.res === 'met', prot = sm.obj.res === 'protected';
    h += '<div class="sv-stamp ' + (ok || prot ? 'ok' : 'bad') + '"><span class="sv-stamp-mark">' + (prot ? 'Protected' : ok ? 'Target hit' : 'Target missed') + '</span><div><small>Team objective</small><b>' + esc(sm.obj.txt) + '</b><p>You finished P' + sm.obj.pos + '.' + (prot ? ' ' + esc(sm.obj.reason || '') : '') + '</p></div></div>';
    if (sm.opt) h += '<p class="sv-note ' + (sm.opt.x ? 'ok' : 'warn') + '">' + (sm.opt.x ? 'Your team took up its option: you are signed for one more season, now on ' + payTxt(sm.opt.pay) + '.' : 'Your team did not take up its option for an extra year.') + '</p>';
    if (sm.warn) h += '<p class="sv-note warn">The team is not happy: this is a repeat. Another miss and your seat is on the line.</p>';
    if (S.fired) h += '<p class="sv-note bad"><b>' + (S.fired.term ? 'Your contract has been terminated.' : 'The team will not renew your contract.') + '</b> ' + (S.fired.why === 'budget' ? 'Budget cuts: the team can no longer carry your salary. It is not personal.' : 'Targets were missed too often. The team is moving on.') + '</p>';
  }
  if (sm.spon && sm.spon.length) h += '<div class="sv-spons">' + sm.spon.map(function (x) { return '<div class="' + (x.ok ? 'ok' : 'bad') + '">' + cvBrand(x.n) + '<div><b>' + esc(x.n) + '</b><small>' + (x.ok ? 'Happy with your season' : 'Unhappy with your season') + ' · ' + (x.ended ? (x.why === 'unhappy' ? 'walking away' : 'deal has run its course') : 'deal continues') + '</small></div><span>' + (x.ok ? '👍' : '👎') + '</span></div>'; }).join('') + '</div>';
  return h ? '<section class="card sv-card sv-verdict">' + cvHead('The verdict', 'How the paddock saw it') + h + '</section>' : '';
}
var svOldSeason = vSeason;
vSeason = function () {
  var sm = S.lastSummary, r = sm && sm.rec, w = S.mode === 'pro' && S.market8 && S.market8.window, marketOpen = w && w.season === S.season && !w.signed;
  if (S.mode !== 'pro' || !r || r.reserve || r.inactive || (S.offers && !marketOpen)) return svOldSeason();
  var p = me(), ev = typeof evaluationSummary === 'function' ? evaluationSummary(S) : null, tierName = progressionPlayer(S).evaluation ? EVALUATION.tiers[progressionPlayer(S).evaluation.tier] : '';
  var h = '<div class="top"><div class="brand">Grid to <b>Glory</b></div><div class="meta"><span>Season ' + S.season + ' complete</span></div></div><div class="sv">' + svHero(sm) + '<div class="sv-grid">' + svPodium(sm) + svVerdict(sm) + '</div>';
  var promo = typeof juniorPromotionHTML === 'function' ? juniorPromotionHTML() : ''; if (promo) h += '<div class="sv-legacy">' + promo + '</div>';
  if (marketOpen) h += '<div id="career-market">' + marketWindowHTML() + '</div>';
  var extra = (typeof facTestHTML === 'function' ? facTestHTML(sm.test) : '') + (S.offers && typeof repCardHTML === 'function' ? repCardHTML(S) : ''); if (extra) h += '<div class="sv-legacy">' + extra + '</div>';
  h += '<section class="sv-debrief"><div class="cv-market-head"><div><small>Winter debrief</small><h2>Your driver file</h2></div></div>' +
    '<details class="sv-fold" open><summary><b>Next season: what changes</b><span>Age ' + p.age + ' → ' + (p.age + 1) + '</span></summary>' + annualPreviewHTML() + '</details>' +
    '<details class="sv-fold"><summary><b>Performance &amp; tier</b><span>' + esc(tierName) + (ev && ev.sts != null ? ' · score ' + ev.sts.toFixed(1) : '') + '</span></summary>' + evaluationCardHTML(true) + '</details>' +
    '<details class="sv-fold"><summary><b>Abilities &amp; mastery</b><span>' + abilitySlots(progressionPlayer(S)) + ' slots</span></summary>' + abilitiesHTML(true) + '</details></section>';
  if (careerRetirementDue(S)) h += '<section class="card sv-card"><h3>The end of the road</h3><p class="tg-note">Age ' + (AGEING.retireAt - 1) + ' is your final racing season. You must retire before starting a season at ' + AGEING.retireAt + '.</p><button class="btn pri wide" data-act="retire">Retire from racing</button></section>';
  else if (!marketOpen) h += '<button class="btn pri wide sv-go" data-act="next-season">Start season ' + (S.season + 1) + ' →</button>';
  if (p.age >= AGEING.retirePrompt && p.age < AGEING.retireAt - 1) h += '<button class="btn wide" data-act="retire">Retire from racing</button>';
  return h + '</div>';
};
