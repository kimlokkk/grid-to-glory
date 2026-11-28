/* Power units: 4 per season, wear costs race pace and raises failures, a 5th unit is a grid drop; reliability shown apart from pace. */
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
      const play = (n) => { for (let i = 0; i < n; i++) { const ci = S.cal[S.round], R = runRace2(S, ci, qualiGrid2(S, ci), {}); let fl = null; R.cars.forEach(f => { if (!f.dnf && f.best < 900 && (!fl || f.best < fl.best)) fl = f; }); R.fl = { di: fl.di, t: fl.best }; finishRace(S, { ci: R.ci, c: R.c, fl: R.fl, cls: R.cls.map(f => ({ car: { d: f.d, di: f.di, isP: f.isP, grid: f.grid, dnf: f.dnf }, pos: f.pos, dnf: !!f.dnf })) }, 4); } };
      seedRnd(4); S = newProCareer('PU', 'pace', 7, 'f1');
      ck('new F1 careers use power units', puOn(S) && S.pu.from === S.season);
      ck('pace cost follows the agreed curve (about 0 below 50%, 0.05 at 60%, 0.15 at 80%, 0.3 at 100%)', puLossAt(0.45) < 0.01 && Math.abs(puLossAt(0.6) - 0.05) < 0.02 && Math.abs(puLossAt(0.8) - 0.15) < 0.03 && Math.abs(puLossAt(1) - 0.3) < 0.001, [puLossAt(0.6), puLossAt(0.8)]);
      ck('failure multiplier is mean-neutral over a unit life', Math.abs([0, .1, .2, .3, .4, .5, .6, .7, .8, .9, 1].reduce((a, w) => a + puFailAt(w), 0) / 11 - 1) < 0.08);
      ck('a weaker reliability makes a unit wear out sooner', puLife({ car: { rel: 60 } }) < puLife({ car: { rel: 90 } }));
      play(seasonRounds(S));
      const pools = S.drivers.map(d => puPool(S, d)), maxFree = pools.every(P => P.units.length - P.pens <= 4);
      ck('nobody runs more than 4 units without a penalty, and every unit has wear', maxFree && pools.every(P => P.units.every(u => u.w > 0)));
      ck('a failed unit is marked and leaves the pool', pools.some(P => P.units.some(u => u.f)) ? pools.every(P => P.units.filter(u => u.f).every(u => puPlan(S, S.drivers[pools.indexOf(P)], S.cal[0]).i !== P.units.indexOf(u))) : true);
      /* force a 5th unit for the player and check the grid drop */
      endSeason(S); startNewSeason(S, S.offers && S.offers[0] ? S.offers[0].team : null, S.offers && S.offers[0] ? S.offers[0].years : null);
      const me = S.drivers[S.pi], P = puPool(S, me); P.units = [0, 1, 2, 3].map(() => ({ w: 1.3, races: 6, f: 0 })); S.puPick = { s: S.season, r: S.round, i: -1 };
      const ci = S.cal[S.round], grid = qualiGrid2(S, ci), q0 = grid.indexOf(S.pi), R = makeRace2(S, ci, grid, {}), at = R.cars.findIndex(f => f.isP);
      ck('a 5th unit drops the player 10 places (or to the back)', at === Math.min(grid.length - 1, q0 + 10) && R.puPens.some(p => p.di === S.pi && p.places === 10), [q0, at]);
      ck('the race pace cost is applied in the race and not to a fresh unit', R.cars[at].pu && R.cars[at].pu.w0 === 0 && puLoss(R, R.cars[at]) === 0);
      P.units[0].w = 1.0; S.puPick = { s: S.season, r: S.round, i: 0 }; const R2 = makeRace2(S, ci, grid, {}), f2 = R2.cars.find(f => f.isP); f2.lap = R2.L;
      ck('with every unit past 115% the engineer asks for a new unit rather than stretching', (P.units.forEach(u => u.w = 1.3), puPlan(S, me, ci).i === -1)); P.units[0].w = 1.0;
      ck('a worn unit costs pace by the end of the race (more than 0.25 s a lap from a unit at 100%)', f2.pu && f2.pu.w0 === 1 && puLoss(R2, f2) / (R2.c.pw / 0.55) > 0.25, [f2.pu, puLoss(R2, f2)]);
      ck('the story pack lists the power units', /Power units \(4 per season/.test(storyPackText('latest')));
      ck('car pace is shown without reliability', S.teams.every(t => Math.abs(teamPace(t) - (t.car.aero + t.car.engine + t.car.chassis) / 3) < 1e-9) && /car pace rank #\d+ .* reliability \d+ \(#\d+\)/.test(storyPackText('latest')));
      return rows;
    });
    for (const r of rows) console.log((r.p ? 'PASS ' : 'FAIL ') + r.n + (r.p ? '' : ' ' + JSON.stringify(r.d)));
    assert.deepEqual(rows.filter(r => !r.p).map(r => r.n), []);
    console.log('ERRS', errors); assert.deepEqual(errors, []);
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exit(1); });
