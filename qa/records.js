/* Archive and player records: every season of F1, F2 and F3 is on file, leagues are never mixed, no "legacy" rows, tidy round strip. */
const { chromium } = require('playwright');
const { assert } = require('./flow');
const { pathToFileURL } = require('node:url');
const path = require('node:path');
(async () => {
  const browser = await chromium.launch(), errors = [];
  try {
    const pg = await browser.newPage({ viewport: { width: 390, height: 844 } });
    pg.on('pageerror', e => errors.push(e.message));
    await pg.goto(pathToFileURL(path.resolve(__dirname, '../index.html')).href);
    await pg.waitForTimeout(500);
    const rows = await pg.evaluate(() => {
      const rows = [], ck = (n, p, d) => rows.push({ n, p: !!p, d });
      seedRnd(5); S = newProCareer('Records', 'pace', 7, 'f1'); const p = S.drivers[S.pi];
      const play = () => { for (let i = S.round; i < seasonRounds(S); i++) { const ci = S.cal[S.round], R = runRace2(S, ci, qualiGrid2(S, ci), {}); let fl = null; R.cars.forEach(f => { if (!f.dnf && f.best < 900 && (!fl || f.best < fl.best)) fl = f; }); R.fl = { di: fl.di, t: fl.best }; finishRace(S, { ci: R.ci, c: R.c, fl: R.fl, cls: R.cls.map(f => ({ car: { d: f.d, di: f.di, isP: f.isP, grid: f.grid, dnf: f.dnf }, pos: f.pos, dnf: !!f.dnf })) }, 4); } };
      for (let y = 0; y < 3; y++) { play(); endSeason(S); startNewSeason(S, S.offers && S.offers[0] ? S.offers[0].team : null, S.offers && S.offers[0] ? S.offers[0].years : null); }
      ['f1', 'f2', 'f3'].forEach(l => { const L = arAll(S, l), seasons = L.filter(e => e.src !== 'live').map(e => e.s).sort(); ck(l.toUpperCase() + ' archive has every finished season with a champion', JSON.stringify(seasons) === JSON.stringify([1, 2, 3]) && L.filter(e => e.src !== 'live').every(e => e.ch && e.d.length >= 10), seasons); });
      ck('each series champion really raced in that series that season (no mixing)', ['f2', 'f3'].every(l => arAll(S, l).filter(e => e.src !== 'live').every(e => { const c = arPeople(S).find(d => d.name === e.ch); return c && (c.worldHistory || []).some(r => r.season === e.s && r.league === l && r.pos === 1); })));
      ck('new season lines carry their league', p.sh.every(h => h.league === 'f1'));
      /* an old save: seasons 1 and 2 were in F2, the season lines have no league */
      p.sh.forEach(h => { delete h.league; }); (p.worldHistory || []).forEach(r => { if (r.season <= 2) r.league = 'f2'; }); (S.hist || []).forEach(h => { if (h.season <= 2) h.league = 'f2'; });
      const L = careerByLeague(p), f1 = L.find(x => x.l === 'f1'), f2 = L.find(x => x.l === 'f2');
      ck('career numbers are kept per league, never added together', f1 && f2 && f2.seasons === 2 && f1.seasons === 1, L);
      const hist = worldDriverHistoryHTML(p); ck('league history has no "legacy" rows and one row per season', !/legacy/i.test(hist) && (hist.match(/<tr>/g) || []).length === 3);
      ck('the story pack gives the career per league', /Career by league .*F1: .*F2: /.test(storyPackText('latest')));
      const sp = storyPackText('latest'); ck('the story pack describes the track, its history in this league and the next race', /\nTrack: .* km, .* laps · .* · rain chance \d+% · pit stop/.test(sp) && /## NEXT RACE\nRound /.test(sp) && /History here \(F1\)/.test(sp));
      ck('story pack track bands match the circuit chips on screen (overtaking: higher value is harder)', S.cal.every(ci => { const c = circuitFor(S, ci), t = spTrack(S, ci); return t.indexOf(c.ot < 0.5 ? 'easy to overtake' : c.ot < 0.7 ? 'medium to overtake' : 'hard to overtake') >= 0 && t.indexOf((c.wear < 0.95 ? 'low' : c.wear < 1.15 ? 'medium' : 'high') + ' tyre wear') >= 0 && (c.pw >= 0.55 ? /power track/ : c.pw <= 0.4 ? /downforce track/ : /balanced/).test(t); }) && /Monte Albrecht[^\n]*hard to overtake/.test(S.cal.map(ci => spTrack(S, ci)).join('\n')));
      const ci0 = S.cal[0], th0 = (S.th[ci0] || []).length; S.th[ci0].push({ s: 2, lg: 'f2', w: { n: 'Junior Winner', t: 'X' }, me: { p: 1, g: 1, d: 0 } });
      ck('circuit history keeps leagues apart', thStats(ci0, 'f1').a.length === th0 && thStats(ci0, 'f2').a.length === 1 && thStats(ci0, 'f1').wins === thStats(ci0, 'f1').a.filter(r => r.me && r.me.p === 1).length);
      play(); return rows;
    });
    for (const r of rows) console.log((r.p ? 'PASS ' : 'FAIL ') + r.n + (r.p ? '' : ' ' + JSON.stringify(r.d)));
    assert.deepEqual(rows.filter(r => !r.p).map(r => r.n), []);
    console.log('ERRS', errors); assert.deepEqual(errors, []);
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exit(1); });
