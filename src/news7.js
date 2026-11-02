/* ===== Paddock Wire: berita gaya siaran sukan. S.news = senarai objek, ditulis masa dipapar ===== */
var PARTN = { aero: 'aero', engine: 'engine', chassis: 'chassis', rel: 'reliability' };
function pushNews(S, o) {
  S.news = (S.news || []).filter(function (n) { return typeof n === 'object'; });
  if (o.s == null) o.s = S.season;
  if (o.r == null) o.r = S.round + 1;
  o.id = (S.newsId = (S.newsId || 0) + 1);
  S.news.unshift(o); S.news = S.news.slice(0, 300);
}
function newsList(S) {
  /* buang teks lama (versi Bahasa Melayu dulu) */
  return (S.news || []).filter(function (n) { return n && typeof n === 'object'; });
}
function nPick(o, arr) { return arr[(o.id || 0) % arr.length]; }
function newsStory(n) {
  var T = function (i) { return S.teams[i] || { name: '?', short: '?', color: '#888' }; }, t = n.t != null ? T(n.t) : null, part = PARTN[n.p] || 'car';
  var surname = function (di) { var d = S.drivers[di]; return d ? d.name.split(' ').slice(-1)[0] : '?'; };
  switch (n.k) {
    case 'race': {
      var w = n.w || [], wd = S.drivers[w[0]], wt = wd ? T(wd.team) : null, me5 = S.drivers[S.pi], ds = driverStandings(S), lead = ds[0], gap = ds[1] ? lead.pts - ds[1].pts : 0;
      var you = n.me ? (n.me === w.indexOf(S.pi) + 1 && n.me <= 3 ? '' : ' ' + surname(S.pi) + ' finished P' + n.me + '.') : ' ' + surname(S.pi) + ' failed to finish.';
      return { kick: 'RACE REPORT', kc: 'k-race', col: wt ? wt.color : '#888', team: wt,
        head: wd ? nPick(n, [surname(w[0]) + ' storms to victory at ' + n.c, surname(w[0]) + ' wins ' + n.c, surname(w[0]) + ' takes the chequered flag at ' + n.c, 'Masterclass from ' + surname(w[0]) + ' at ' + n.c]) : n.c + ' result',
        sub: (w[1] != null ? surname(w[1]) + ' and ' + surname(w[2]) + ' complete the podium.' : '') + you + (lead ? ' ' + surname(lead.id) + ' leads the championship' + (gap ? ' by ' + gap + ' pts.' : '.') : '') };
    }
    case 'upg': return { kick: 'TECHNICAL', kc: 'k-tech', col: t.color, team: t,
      head: n.big ? nPick(n, [t.name + ' unveil a major ' + part + ' overhaul', 'The wait is over: ' + t.name + '’s big ' + part + ' upgrade arrives']) : nPick(n, [t.name + ' bring a new ' + part + ' upgrade', 'Step forward for ' + t.name, t.name + ' unleash new ' + part + ' package']),
      sub: (n.big ? 'Months in the making, and it shows: ' : n.rush ? 'Rushed to the track early, but it works: ' : 'Early data points to ') + '+' + n.g + ' on the ' + part + '. Rivals are already asking questions.' };
    case 'rumour': return { kick: 'RUMOUR', kc: 'k-int', col: t.color, team: t,
      head: t.name + ' preparing ' + (n.big ? 'a major ' : 'a new ') + part + ' upgrade',
      sub: nPick(n, ['Paddock whispers say it could arrive as soon as next round.', 'Spotted in the garage under covers. Expect it soon.', 'Sources inside the team say the numbers look promising.']) };
    case 'upgf': return { kick: 'TECHNICAL', kc: 'k-tech', col: t.color, team: t,
      head: nPick(n, [t.name + ' upgrade misfires', 'Back to the drawing board for ' + t.name, t.name + '’s new ' + part + ' parts fail to deliver']),
      sub: n.rush ? 'Rushed to the track before it was ready, and it showed. A setback of ' + n.g + '.' : 'The new ' + part + ' package didn’t correlate with the wind tunnel. A setback of ' + n.g + '.' };
    case 'upgf2': return { kick: 'ANALYSIS', kc: 'k-ana', col: t.color, team: t,
      head: 'Pressure mounts at ' + t.name + ' after another failed upgrade',
      sub: 'Paddock sources point to a lack of experience in the design office.' };
    case 'bank': return { kick: 'STRATEGY', kc: 'k-ana', col: t.color, team: t,
      head: t.name + ' switch focus to next season',
      sub: 'Development on the current car has stopped. Every resource now goes into next year.' };
    case 'reg': return { kick: 'BREAKING', kc: 'k-brk', col: '#e2342b', team: null,
      head: 'New regulations rip up the rulebook',
      sub: 'Every car must be rebuilt from scratch for Season ' + n.s + '. The pecking order is up for grabs.' };
    case 'poach': return { kick: 'TRANSFER', kc: 'k-trf', col: t.color, team: t,
      head: t.name + ' poach senior engineer from ' + T(n.f).name,
      sub: 'A bigger pay cheque at ' + t.short + ', a dent in morale at ' + T(n.f).short + '.' };
    case 'sack': return { kick: 'BREAKING', kc: 'k-brk', col: t.color, team: t,
      head: t.name + ' part ways with team principal ' + n.o,
      sub: n.n + ' takes charge with immediate effect.' };
    case 'winter': return { kick: 'TECHNICAL', kc: 'k-tech', col: t.color, team: t,
      head: n.g >= 0 ? t.name + '’s winter upgrade delivers' : t.name + '’s winter upgrade falls short',
      sub: n.g >= 0 ? '+' + n.g + ' ' + part + ' found over the off-season.' : 'The ' + part + ' went backwards (' + n.g + '). Not the start the team wanted.' };
    case 'tp': return { kick: 'INTERVIEW', kc: 'k-int', col: t.color, team: t,
      head: '“We’re targeting P' + n.x + ' this year”',
      sub: n.n + ' (' + t.name + ') ' + (n.am == null || n.am >= 2 ? 'sets a bold goal. Journalists exchange knowing looks.' : n.am <= 0 ? 'plays it safe and asks for patience as the new season begins.' : 'lays out the plan for the new season.') };
    case 'retire': return { kick: 'RETIREMENT', kc: 'k-ana', col: t ? t.color : '#888', team: t,
      head: n.nd ? n.n + ' retires after finding no seat' : nPick(n, [n.n + ' calls time on his career', 'End of an era: ' + n.n + ' retires', n.n + ' hangs up his helmet']),
      sub: 'The ' + n.a + '-year-old leaves ' + (t ? t.name : 'the grid') + ' after ' + (n.ti ? n.ti + ' world title' + (n.ti > 1 ? 's' : '') + ' and ' : '') + n.w + ' win' + (n.w === 1 ? '' : 's') + '. The paddock will miss him.' };
    case 'rookie': return { kick: 'CONFIRMED', kc: 'k-trf', col: t ? t.color : '#888', team: t,
      head: (t ? t.name : 'Team') + ' promote ' + n.n + ' to the grid',
      sub: (typeof flagE === 'function' ? flagE(n.nat) + ' ' : '') + n.n + (n.jt ? ', the ' + JR_NAME + ' champion,' : n.ac ? ', a product of their own academy,' : ' from the ' + JR_NAME) + ' gets his big chance next season.' };
    case 'jchamp': return { kick: 'JUNIORS', kc: 'k-int', col: '#f0b429', team: null,
      head: n.n + ' crowned ' + JR_NAME + ' champion',
      sub: (typeof flagE === 'function' ? flagE(n.nat) + ' ' : '') + n.w + ' wins this season. Team bosses are already circling.' };
    /* ---- kontrak, transfer, musim silly ---- */
    case 'broke': return { kick: 'ANALYSIS', kc: 'k-ana', col: t.color, team: t,
      head: nPick(n, [t.name + ' push back upgrade as budget runs dry', t.name + ' cash-strapped: new ' + part + ' parts delayed', 'Finance office says wait at ' + t.name]),
      sub: nPick(n, ['The parts are nearly ready, but the money is not. Expect a smaller package, later.', 'Spending on drivers and the factory has left little for development. Questions are being asked.', 'A lesson in budgeting: you can’t buy a quick car and a big payroll at the same time.']) };
    case 'budget': return { kick: 'BUDGET WATCH', kc: 'k-ana', col: t.color, team: t,
      head: t.name + ' lead the money race with $' + n.a + 'M, ' + S.teams[n.z].short + ' squeezed on $' + n.b + 'M',
      sub: 'Development funds for Season ' + n.s + '. ' + (n.cap ? t.short + ' are up against the cost cap.' : 'Big gaps in the bank balance mean big gaps on the track.') };
    case 'cexp': { var sn = n.n.split(' ').slice(-1)[0]; return { kick: 'INTERVIEW', kc: 'k-int', col: t.color, team: t,
      head: nPick(n, ['“Contract talks can wait”, says ' + sn, sn + ': “Focused on the job, the future will sort itself out”', '“No rush on my future”: ' + sn + ' plays it cool']),
      sub: n.n + ' (' + t.short + ') is out of contract at the end of the year. Rival team bosses are asking nicely about his availability.' }; }
    case 'rumd': { var sn2 = n.n.split(' ').slice(-1)[0], ft = T(n.f); return { kick: 'RUMOUR', kc: 'k-int', col: t.color, team: t,
      head: nPick(n, [sn2 + ' linked with ' + t.name + ' switch', t.name + ' eye ' + sn2 + ' for next year', 'Is ' + sn2 + ' heading to ' + t.short + '?']),
      sub: nPick(n, ['Paddock chatter says talks have already taken place. ' + ft.short + ' insist they are relaxed about it.', 'A meeting over lunch in the motorhome area was “purely social”. Naturally.', 'Sources close to the driver suggest a decision is close, and ' + ft.short + ' would rather he stayed.']) }; }
    case 'seats': return { kick: 'SILLY SEASON', kc: 'k-trf', col: '#8b5cf6', team: null,
      head: 'Silly season looms: ' + n.c + ' contracts run out this year',
      sub: n.ts.length ? 'Seats could come up at ' + n.ts.map(function (i) { return T(i).short; }).join(', ') + '. Managers are already refreshing their phones.' : 'Most of the grid is locked in, so expect a quiet winter.' };
    case 'mine': return { kick: 'RUMOUR', kc: 'k-int', col: '#f0b429', team: null,
      head: n.ts.length ? 'Teams circle for your signature' : 'No calls yet. Results will do the talking',
      sub: n.ts.length ? n.ts.map(function (i) { return T(i).short; }).join(', ') + (n.ts.length > 1 ? ' are all' : ' is') + ' reported to be monitoring you. Your deal runs out at the end of the year.' : 'Your contract expires this year and nobody has rung yet. A strong finish would change that.' };
    case 'csack': return { kick: 'BREAKING', kc: 'k-brk', col: t.color, team: t,
      head: nPick(n, [n.n + ' shown the door by ' + t.name, t.name + ' part ways with ' + n.n, n.n + ' out at ' + t.short]),
      sub: n.w === 'budget' ? 'The numbers no longer add up: the budget at ' + t.short + ' could not carry the salary. Nothing personal, just maths.' : 'Targets were missed too many times. ' + t.name + ' decided a fresh start was needed.' };
    case 'pbuy': return { kick: 'BREAKING', kc: 'k-brk', col: t.color, team: t,
      head: t.name + ' pay off ' + n.n + ' to sign ' + n.pl,
      sub: 'A buy-out of ' + payTxt(n.c) + ' clears the seat. ' + n.n.split(' ').slice(-1)[0] + ' hits the open market, and the money comes out of the ' + t.short + ' development budget.' };
    case 'opx': return { kick: 'CONFIRMED', kc: 'k-trf', col: t.color, team: t,
      head: n.by === 'team' ? t.name + ' take up option on ' + n.n : n.n + ' triggers option to stay at ' + t.name,
      sub: 'The deal now runs to Season ' + n.u + ', with a pay rise. ' + (n.by === 'team' ? 'The team likes what it sees.' : 'He sees his future in the garage.') };
    case 'opn': return { kick: 'BREAKING', kc: 'k-brk', col: t.color, team: t,
      head: n.by === 'team' ? t.name + ' let ' + n.n + ' option lapse' : n.n + ' passes on option, will test the market',
      sub: n.by === 'team' ? 'The team chose not to keep him for an extra year. He will be on the market this winter.' : 'He believes there are better places to be. Expect offers from rivals.' };
    case 'psign': return { kick: n.mv ? 'BREAKING' : 'CONFIRMED', kc: n.mv ? 'k-brk' : 'k-trf', col: t.color, team: t,
      head: n.mv ? n.n + ' signs for ' + t.name : n.n + ' stays at ' + t.name,
      sub: n.mv ? 'The deal is done: ' + n.n + ' leaves ' + T(n.f).name + ' to join ' + t.name + ' on a ' + n.y + '-year contract. The paddock is talking.' : t.name + ' have tied down ' + n.n + ' with a new ' + n.y + '-year deal. Continuity for the new season.' };
    case 'cmove': return { kick: 'TRANSFER', kc: 'k-trf', col: t.color, team: t,
      head: nPick(n, [n.n + ' joins ' + t.name, 'CONFIRMED: ' + n.n + ' signs for ' + t.name, t.name + ' land ' + n.n]),
      sub: 'He leaves ' + T(n.f).name + ' on a deal that runs to Season ' + n.u + '. ' + (n.o >= 86 ? 'A blockbuster signing.' : n.o >= 80 ? 'A solid addition to the line-up.' : 'A quiet one, but it might pay off.') };
    case 'cre': return { kick: 'CONFIRMED', kc: 'k-trf', col: t.color, team: t,
      head: nPick(n, [n.n + ' extends with ' + t.name, n.n + ' commits his future to ' + t.name]),
      sub: 'The deal runs to Season ' + n.u + '. ' + t.short + ' say the decision was “easy”.' };
    case 'csign': return { kick: 'CONFIRMED', kc: 'k-trf', col: t.color, team: t,
      head: n.n + ' returns to the grid with ' + t.name,
      sub: 'Back from the sidelines on a deal to Season ' + n.u + '. Patience paid off.' };
    case 'cdrop': return { kick: 'ANALYSIS', kc: 'k-ana', col: t.color, team: t,
      head: nPick(n, [n.n + ' loses his seat at ' + t.name, 'No seat for ' + n.n + ' as ' + t.short + ' go another way']),
      sub: 'The ' + n.a + '-year-old drops to the reserve list. A comeback is possible, but the clock is ticking.' };
    case 'cstaff': return { kick: 'TRANSFER', kc: 'k-trf', col: t.color, team: t,
      head: n.n + ' joins ' + t.name + ' as ' + (n.z === 'td' ? 'technical director' : 'team principal'),
      sub: (n.f >= 0 ? 'He leaves ' + T(n.f).name + '. ' : 'A new face in the paddock. ') + (n.z === 'td' ? 'The factory is already talking about fresh ideas.' : 'The garage is already talking about a new direction.') };
    case 'eng': return { kick: 'TECHNICAL', kc: 'k-tech', col: t.color, team: t,
      head: t.name + ' switch to ' + n.to + ' power', sub: 'The deal with ' + n.f + ' ends after this winter. ' + t.short + ' hope the new engine closes the gap.' };
    case 'fac': return { kick: 'TECHNICAL', kc: 'k-tech', col: t.color, team: t,
      head: n.up ? t.name + ' open upgraded factory facilities' : t.name + ' scale back factory spending',
      sub: n.up ? 'New simulator and wind-tunnel time lift the team to level ' + n.lv + ' of 5.' : 'Money is tight and the facilities slip to level ' + n.lv + ' of 5.' };
    case 'loan': return { kick: 'ANALYSIS', kc: 'k-ana', col: t.color, team: t,
      head: t.name + ' take out a $' + n.a + 'M loan', sub: 'Overspending left a hole in the budget. The team will repay it over the next few seasons, so development will feel the squeeze.' };
    case 'test': return { kick: 'JUNIORS', kc: 'k-int', col: t.color, team: t,
      head: n.n + ' impresses in young driver test', sub: (typeof flagE === 'function' ? flagE(n.nat) + ' ' : '') + t.name + ' were delighted with the academy driver\u2019s feedback and pace.' };
    case 'gold': return { kick: 'JUNIORS', kc: 'k-int', col: '#f0b429', team: null,
      head: 'A golden generation arrives in the ' + JR_NAME,
      sub: n.ns.join(', ') + ' headline the best junior intake in years. Team bosses are calling it a once-in-a-decade crop.' };
    case 'hype': return { kick: 'JUNIORS', kc: 'k-int', col: '#f0b429', team: null,
      head: 'Scouts tip ' + n.n + ' as the next big thing',
      sub: (typeof flagE === 'function' ? flagE(n.nat) + ' ' : '') + 'Rated ' + n.st + '/5 by the media, though not every team is convinced. Time will tell.' };
    case 'preview': {
      var c = CIRCUITS[n.ci], L = laps2(c), rain = Math.round(c.rain * 100);
      return { kick: 'PREVIEW', kc: 'k-race', col: '#e2342b', team: null, ci: n.ci,
        head: nPick(n, ['Next up: ' + c.name, 'All eyes on ' + c.name, c.name + ': what to expect']),
        sub: L + ' laps around ' + c.loc + '. ' + (rain >= 40 ? 'A ' + rain + '% chance of rain could throw strategy into chaos.' : rain >= 20 ? 'Rain risk sits at ' + rain + '%, so keep an eye on the radar.' : 'Dry weather expected.') + ' Overtaking is ' + (c.ot < 0.5 ? 'easy here, so expect action.' : c.ot < 0.7 ? 'possible with a good run.' : 'hard, so qualifying is everything.') };
    }
    case 'season': {
      var fav = S.teams.filter(function (x) { return teamRank(S, x.id) === 1; })[0] || S.teams[0], sec = S.teams.filter(function (x) { return teamRank(S, x.id) === 2; })[0], mt = myTeam();
      return { kick: 'SEASON PREVIEW', kc: 'k-int', col: fav.color, team: fav,
        head: nPick(n, [fav.name + ' start as title favourites', 'Season ' + n.s + ': can anyone stop ' + fav.name + '?']),
        sub: 'Pre-season data puts ' + fav.short + ' ahead' + (sec ? ' of ' + sec.short : '') + '. ' + (mt === fav ? 'No pressure, then.' : 'Your team, ' + mt.name + ', starts with the #' + teamRank(S, mt.id) + ' car.') };
    }
    case 'standings': {
      var ds = driverStandings(S), a = ds[0], b = ds[1], p = S.drivers[S.pi], pos = ds.indexOf(p) + 1, at = S.teams[a.team];
      return { kick: 'STANDINGS', kc: 'k-ana', col: at.color, team: at,
        head: a === p ? 'You lead the championship!' : a.name.split(' ').slice(-1)[0] + ' leads the championship',
        sub: (b ? (a.pts - b.pts) + ' pts clear of ' + b.name.split(' ').slice(-1)[0] + '. ' : '') + (a === p ? '' : 'You are P' + pos + ' on ' + p.pts + ' pts.') };
    }
  }
  return { kick: 'PADDOCK', kc: 'k-ana', col: '#888', team: null, head: String(n.text || ''), sub: '' };
}
function newsAuto() {
  var out = [], ds = driverStandings(S), p = S.drivers[S.pi];
  if (S.round < 10) { var ci = S.cal[S.round], c = CIRCUITS[ci]; out.push({ k: 'preview', ci: ci, s: S.season, r: S.round + 1, id: 900 + S.round }); }
  if (ds[0] && ds[0].pts > 0) out.push({ k: 'standings', s: S.season, r: S.round, id: 950 + S.round });
  else out.push({ k: 'season', s: S.season, r: 0, id: 980 + S.season });
  return out;
}
function newsMeta(n) { return n.k === 'preview' ? 'S' + n.s + ' · Round ' + n.r + ' · Coming up' : n.r ? 'S' + n.s + ' · Round ' + n.r : 'S' + n.s + ' · Pre-season'; }
function newsCard(cls, max) {
  var L = newsList(S), A2 = newsAuto();
  L = L.length ? [L[0]].concat(A2, L.slice(1)) : A2;
  if (!L.length) return '';
  var top = L[0], st = newsStory(top), all = typeof UI !== 'undefined' && UI.nwAll, rest = L.slice(1, all ? 16 : (max || 4));
  var h = '<div class="' + cls + ' card nw"><div class="nw-bar"><span class="nw-brand">PADDOCK<b>WIRE</b></span><span class="nw-live"><i></i>LATEST</span></div>';
  h += '<div class="nw-top" style="--tc:' + st.col + '"><div class="nw-tx"><span class="nw-k ' + st.kc + '">' + st.kick + '</span><h4>' + esc(st.head) + '</h4><p>' + esc(st.sub) + '</p><small>' + newsMeta(top) + '</small></div>' +
    (st.team ? '<div class="nw-img">' + carSVG(st.team, 150, true) + '</div>' : st.ci != null ? '<div class="nw-img trk">' + circuitSVG(st.ci, 70, '#ffffff') + '</div>' : '') + '</div>';
  if (rest.length) h += '<div class="nw-list">' + rest.map(function (n) { var s = newsStory(n); return '<div class="nw-it" style="--tc:' + s.col + '"><span class="nw-k ' + s.kc + '">' + s.kick + '</span><b>' + esc(s.head) + '</b><small>' + newsMeta(n) + '</small></div>'; }).join('') + '</div>';
  if (L.length > (max || 4)) h += '<button class="nw-more" data-act="tab" data-v="news">All news →</button>';
  var tick = L.slice(0, 6).map(function (n) { return esc(newsStory(n).head); }).join('<i>◆</i>');
  h += '<div class="nw-tick"><span>NEWS</span><div><p>' + tick + '<i>◆</i>' + tick + '</p></div></div>';
  return h + '</div>';
}

if (typeof A !== 'undefined') A['nw-all'] = function () { UI.nwAll = !UI.nwAll; render(); };
