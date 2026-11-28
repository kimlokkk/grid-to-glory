/* Fame and personal sponsors: fame stays a number race after race, offers come every season (also after rejecting them), a broken save is repaired. */
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
      ck('sponsor settings and story pack settings are separate', SP.decay === 0.97 && SP.max === 3 && SPK.scope === 'latest');
      seedRnd(3); S = newProCareer('Fame', 'pace', 7, 'f1'); const me = S.drivers[S.pi]; ['pace', 'race', 'cons'].forEach(k => me[k] = 96); ['aero', 'engine', 'chassis'].forEach(k => S.teams[me.team].car[k] = 97);
      const play = () => { for (let i = 0; i < seasonRounds(S); i++) { const ci = S.cal[S.round], R = runRace2(S, ci, qualiGrid2(S, ci), {}); let fl = null; R.cars.forEach(f => { if (!f.dnf && f.best < 900 && (!fl || f.best < fl.best)) fl = f; }); R.fl = { di: fl.di, t: fl.best }; finishRace(S, { ci: R.ci, c: R.c, fl: R.fl, cls: R.cls.map(f => ({ car: { d: f.d, di: f.di, isP: f.isP, grid: f.grid, dnf: f.dnf }, pos: f.pos, dnf: !!f.dnf })) }, 4); } };
      play(); ck('fame is a number after a season and grows with results', Number.isFinite(S.fame) && S.fame > 20, S.fame);
      endSeason(S); startNewSeason(S, me.team, 2); const n1 = (S.sponOffers || []).length; (S.sponOffers || []).slice().forEach(() => A['spon-no']({ i: 0 }));
      play(); endSeason(S); startNewSeason(S, me.team, 2);
      ck('brands make offers every season, also after the last ones were rejected', n1 > 0 && (S.sponOffers || []).length > 0, [n1, (S.sponOffers || []).length]);
      S.fame = NaN; const o = JSON.parse(JSON.stringify(S)); o.round = 0; o.sponOffers = null; const R2 = migrate(o);
      ck('a saved broken fame (NaN comes back as null) is repaired from the career record and gets offers at round 0', Number.isFinite(R2.fame) && R2.fame > 20 && (R2.sponOffers || []).length > 0, [R2.fame]);
      return rows;
    });
    for (const r of rows) console.log((r.p ? 'PASS ' : 'FAIL ') + r.n + (r.p ? '' : ' ' + JSON.stringify(r.d)));
    assert.deepEqual(rows.filter(r => !r.p).map(r => r.n), []);
    console.log('ERRS', errors); assert.deepEqual(errors, []);
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exit(1); });
