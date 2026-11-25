/* Weekend hold: Exit during qualifying or strategy goes Home; coming back continues the same weekend (no re-rolled grid), also after a reload; the race clears it. */
const { chromium } = require('playwright');
const { assert } = require('./flow');
const { pathToFileURL } = require('node:url');
const path = require('node:path');
(async () => {
  const browser = await chromium.launch(), errors = [];
  try {
    const pg = await browser.newPage({ viewport: { width: 390, height: 844 } });
    pg.on('pageerror', e => errors.push(e.message));
    const url = pathToFileURL(path.resolve(__dirname, '../index.html')).href;
    await pg.goto(url); await pg.waitForTimeout(500);
    const a = await pg.evaluate(() => {
      const rows = [], ck = (n, p, d) => rows.push({ n, p: !!p, d });
      seedRnd(3); S = newProCareer('Hold', 'pace', 7, 'f1'); S.settings.mini = false; if (A['onb-style']) A['onb-style']({ v: 'casual' }); closeModal(); UI.screen = 'hub'; render();
      A['wk-start'](); A['wk-quit'](); ck('Exit before anything runs simply goes Home', UI.screen === 'hub' && !S.wkHold);
      A['wk-start'](); A['q-auto'](); const part = JSON.stringify(UI.wk.Q.res || UI.wk.Q.log || UI.wk.Q.s), s1 = UI.wk.Q.s;
      A['wk-quit'](); ck('Exit part-way through qualifying goes Home without advancing the round', UI.screen === 'hub' && S.round === 0 && S.wkHold);
      A['wk-start'](); ck('Start weekend continues the same qualifying session', UI.screen === 'wk' && UI.wk.step === 'quali' && UI.wk.Q.s === s1 && JSON.stringify(UI.wk.Q.res || UI.wk.Q.log || UI.wk.Q.s) === part);
      A['q-fin'](); const g1 = UI.wk.q.map(r => r.di).join(); A['wk-quit'](); A['wk-start'](); A['q-fin']();
      ck('the grid is the same after leaving and coming back (no re-roll)', UI.wk.q.map(r => r.di).join() === g1);
      return { rows, g1 };
    });
    await pg.reload(); await pg.waitForTimeout(800);
    const b = await pg.evaluate((g1) => {
      const rows = [], ck = (n, p, d) => rows.push({ n, p: !!p, d });
      S = migrate(loadSave()); UI.screen = 'hub'; closeModal(); render();
      ck('the weekend survives a reload', !!S.wkHold); A['wk-start'](); A['q-fin']();
      ck('after a reload the grid is still the same', UI.wk && UI.wk.q && UI.wk.q.map(r => r.di).join() === g1);
      A['q-next'](); ck('strategy page reached', UI.wk.step === 'strat'); A['wk-quit'](); A['wk-start']();
      ck('Exit from strategy and back returns to the strategy page', UI.wk.step === 'strat');
      A['s-start']({ v: UI.wk.R && UI.wk.R.p ? (UI.wk.R.p.comp || 'M') : 'M' }); A['s-go'](); stopRace && stopRace(); ck('starting the race clears the hold (the race lock takes over)', UI.wk.step === 'race' && !S.wkHold);
      return rows;
    }, a.g1);
    const rows = a.rows.concat(b);
    for (const r of rows) console.log((r.p ? 'PASS ' : 'FAIL ') + r.n + (r.p ? '' : ' ' + JSON.stringify(r.d)));
    assert.deepEqual(rows.filter(r => !r.p).map(r => r.n), []);
    console.log('ERRS', errors); assert.deepEqual(errors, []);
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exit(1); });
