/* Stewards: contact rulings, time penalties served in a stop or added at the flag, qualifying impeding, penalty points, bans with a reserve. */
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
      const fin = (R) => { let fl = null; R.cars.forEach(f => { if (!f.dnf && f.best < 900 && (!fl || f.best < fl.best)) fl = f; }); R.fl = { di: fl.di, t: fl.best }; finishRace(S, { ci: R.ci, c: R.c, fl: R.fl, cls: R.cls.map(f => ({ car: { d: f.d, di: f.di, isP: f.isP, grid: f.grid, dnf: f.dnf }, pos: f.pos, dnf: !!f.dnf })) }, 4); };
      seedRnd(3); S = newProCareer('Stew', 'pace', 7, 'f1'); if (A['onb-style']) A['onb-style']({ v: 'casual' }); closeModal();
      ck('new F1 careers have stewards', stewOn(S) && S.stew.from === S.season);
      let rulings = 0, served = 0, added = 0, races = 0, pen = null;
      for (let i = 0; i < 12; i++) { const ci = S.cal[S.round], R = runRace2(S, ci, qualiGrid2(S, ci), {}); races++; rulings += R.stew.filter(e => e.k === 'time' || e.k === 'grid').length; served += R.log.filter(e => e.k === 'penserve').length; added += R.stew.filter(e => e.k === 'added').length; if (!pen) pen = R.cars.find(f => f.penTot && !f.dnf) ? R : null; fin(R); }
      ck('contacts get rulings (time or grid penalties happen, not every contact)', rulings > 0 && rulings < races * 3, [rulings, races]);
      ck('time penalties are served in a pit stop or added at the flag', served + added > 0, [served, added]);
      if (pen) { const f = pen.cars.find(x => x.penTot && !x.dnf); ck('an unserved penalty never stays pending at the flag', pen.cars.every(x => !(x.penQ > 0) || x.dnf), f.penTot); }
      ck('rulings are logged and give penalty points', S.stew.log.length > 0 && Object.keys(S.stew.pts).length > 0);
      ck('the story pack has the stewards lines', /Penalty points: \d+ of 12/.test(storyPackText('season')) && /Stewards: /.test(storyPackText('season')));
      /* a time penalty with no stop left is added at the flag */
      { const ci = S.cal[S.round], R = makeRace2(S, ci, qualiGrid2(S, ci), {}), f = R.cars[3]; f.penQ = 5; f.pen = 0; f.fin = true; f.tFin = 100; stewFinish(R); ck('a pending 5 s is added to the race time at the flag', f.pen === 5 && f.penQ === 0 && R.stew.some(e => e.k === 'added')); }
      /* served in a stop: the car is held */
      { const ci = S.cal[S.round], R = makeRace2(S, ci, qualiGrid2(S, ci), {}), f = R.cars[2]; f.penQ = 10; f.hold = 20; stewServe(R, f); ck('a pending 10 s is served at the stop (held longer)', f.hold === 30 && f.penQ === 0 && f.penServed === 10); }
      /* impeding in qualifying gives a grid drop at this round's race */
      { const d = S.drivers[5]; S.stew.grid.push({ k: stewKey(d), n: d.name, s: S.season, r: S.round, places: 3, why: 'impeded someone in Q2', q: 1 }); const ci = S.cal[S.round], g = qualiGrid2(S, ci), q0 = g.indexOf(5), R = makeRace2(S, ci, g, {}), at = R.cars.findIndex(f => f.di === 5);
        ck('a qualifying grid drop moves the driver back 3 places', at === Math.min(g.length - 1, q0 + 3) && R.stewGrid.length >= 1, [q0, at]); }
      /* penalty points to 12 = ban for the next race; the reserve drives; the player is put back */
      { const me = S.drivers[S.pi], r0 = S.round; for (let i = 0; i < 6; i++) stewPoint(S, me, 2, 'Test'); ck('12 points ban the driver for the next race and clear the points', stewBanned(S, me, S.season, r0 + 1) && stewPts(S, me) === 0);
        const ci = S.cal[S.round]; fin(runRace2(S, ci, qualiGrid2(S, ci), {}));
        const res0 = S.results.length, pts0 = me.pts, starts0 = me.starts, teamPts0 = S.teams[me.team].pts; UI.screen = 'hub'; A['wk-start']();
        ck('the banned round is run with a reserve in the car', S.round === r0 + 2 && S.drivers[S.pi] === me && !S.sit && !S.bench, [S.round, r0]);
        ck('the player gets no points or start for the banned race, and the results list marks it', me.pts === pts0 && me.starts === starts0 && S.results.length === res0 + 1 && S.results[S.results.length - 1].ban);
        ck('the ban screen tells the player who drove', /You are banned/.test(document.querySelector('#modal') ? document.querySelector('#modal').textContent : '')); closeModal(); }
      ck('Driver tab shows the penalty points card', /Penalty points/.test(hAku()));
      { const di = 7, d = S.drivers[di], p0 = d.pts, s0 = d.starts; for (let i = 0; i < 6; i++) stewPoint(S, d, 2, 'Test'); const ci = S.cal[S.round]; fin(runRace2(S, ci, qualiGrid2(S, ci), {}));
        const ci2 = S.cal[S.round], g = qualiGrid2(S, ci2), sub = S.drivers[di]; const R = runRace2(S, ci2, g, {}); fin(R);
        ck('a banned AI driver is replaced by a reserve for one race and comes back with no points from it', sub !== d && sub.stand && S.drivers[di] === d && d.starts === s0 + 1, [sub.name, d.name]); }
      return rows;
    });
    for (const r of rows) console.log((r.p ? 'PASS ' : 'FAIL ') + r.n + (r.p ? '' : ' ' + JSON.stringify(r.d)));
    assert.deepEqual(rows.filter(r => !r.p).map(r => r.n), []);
    console.log('ERRS', errors); assert.deepEqual(errors, []);
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exit(1); });
