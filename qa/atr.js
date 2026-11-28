/* Wind tunnel allowance (ATR): the leader gets the least, the last team the most, the league average stays the same, the order resets at mid-season, the winter car uses the final order, older saves from the next season, the workshop strip and the story pack line. */
const { chromium } = require('playwright');
const { assert } = require('./flow');
const { pathToFileURL } = require('node:url');
const path = require('node:path');
(async () => {
  const browser = await chromium.launch(), errors = [];
  try {
    const pg = await browser.newPage({ viewport: { width: 390, height: 844 } });
    pg.on('pageerror', e => errors.push(e.message));
    await pg.goto(pathToFileURL(path.resolve(__dirname, '../index.html')).href); await pg.waitForTimeout(500);
    const rows = await pg.evaluate(() => {
      const rows = [], ck = (n, p, d) => rows.push({ n, p: !!p, d });
      seedRnd(8); S = newProCareer('Atr', 'pace', 7, 'f1');
      ck('a new career has the allowance from its first season', S.atr && S.atr.from === S.season && atrOn(S), S.atr);
      const o = atrOrder(S), byPos = id => o.pos[id], T = S.teams.slice().sort((a, b) => byPos(a.id) - byPos(b.id));
      const m = T.map(t => atrMul(S, t));
      ck('P1 gets the least, P10 the most, in steps', m.every((x, i) => i === 0 || x > m[i - 1]) && atrPct(S, T[0]) === ATR.top && Math.abs(atrPct(S, T[9]) - ATR.bot) < 1e-9, m);
      ck('the league average gain stays the same', Math.abs(m.reduce((a, b) => a + b, 0) / m.length - 1) < 1e-9);
      ck('period 1 uses last season\'s final order', o.per === 1 && T.every(t => !t.sh || !t.sh.length || t.sh[t.sh.length - 1].pos === byPos(t.id)));
      const play = n => { for (let i = 0; i < n; i++) { const ci = S.cal[S.round], R = runRace2(S, ci, qualiGrid2(S, ci), {}); let fl = null; R.cars.forEach(f => { if (!f.dnf && f.best < 900 && (!fl || f.best < fl.best)) fl = f; }); R.fl = { di: fl.di, t: fl.best }; finishRace(S, { ci: R.ci, c: R.c, fl: R.fl, cls: R.cls.map(f => ({ car: { d: f.d, di: f.di, isP: f.isP, grid: f.grid, dnf: f.dnf }, pos: f.pos, dnf: !!f.dnf })) }, 4); } };
      play(Math.ceil(seasonRounds(S) / 2));
      const o2 = atrOrder(S), ts = teamStandings(S);
      ck('from mid-season the order is the standings at the halfway round', o2.per === 2 && ts.every((t, i) => o2.pos[t.id] === i + 1));
      play(2); ck('the mid-season order stays fixed after that', atrOrder(S).k === o2.k && ts.every(t => atrOrder(S).pos[t.id] === o2.pos[t.id]));
      ck('one package is capped: small gains unchanged, a huge one bends to the cap (season 14, winter 30)', devCap(S, 5, false) === 5 && devCap(S, 36, false) <= DEVCAP.cap && devCap(S, 36, false) > DEVCAP.knee && devCap(S, 15, true) === 15 && devCap(S, 90, true) <= DEVCAP.wCap, [devCap(S, 36, false), devCap(S, 90, true)]);
      ck('the story pack lists the allowance', /Wind tunnel allowance \(ATR\): \d+% as P\d+/.test(storyPackText('season')));
      UI.screen = 'hub'; UI.tab = 'team'; if (A['onb-style']) A['onb-style']({ v: 'casual' }); closeModal(); render();
      ck('the R&D workshop shows the allowance strip', !!document.querySelector('.atr-strip .atr-bars i.on'));
      play(seasonRounds(S) - S.round); const fin = teamStandings(S);
      ck('the winter car uses the final order', atrMul(S, fin[0], true) < 1 && atrMul(S, fin[9], true) > 1);
      seedRnd(9); const G = newProCareer('Old', 'pace', 7, 'f1'); delete G.atr; G.round = 4; const r = migrate(JSON.parse(JSON.stringify(G)));
      ck('an older save mid-season gets the allowance from the next season', r.atr && r.atr.from === r.season + 1 && !atrOn(r), r.atr);
      return rows;
    });
    for (const r of rows) console.log((r.p ? 'PASS ' : 'FAIL ') + r.n + (r.p ? '' : ' ' + JSON.stringify(r.d)));
    assert.deepEqual(rows.filter(r => !r.p).map(r => r.n), []);
    console.log('ERRS', errors); assert.deepEqual(errors, []);
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exit(1); });
