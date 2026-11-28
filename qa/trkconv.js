/* Real circuits: lap records from older saves are converted once to the new circuit lengths; new careers and a second load are left alone; circuit history and mastery keys are kept. */
const { chromium } = require('playwright');
const { assert } = require('./flow');
const { pathToFileURL } = require('node:url');
const path = require('node:path');
(async () => {
  const browser = await chromium.launch(), errors = [];
  try {
    const pg = await browser.newPage();
    pg.on('pageerror', e => errors.push(e.message));
    await pg.goto(pathToFileURL(path.resolve(__dirname, '../index.html')).href); await pg.waitForTimeout(500);
    const rows = await pg.evaluate(() => {
      const rows = [], ck = (n, p, d) => rows.push({ n, p: !!p, d });
      seedRnd(4); S = newProCareer('Conv', 'pace', 7, 'f1');
      ck('a new career is marked as converted at once', S.trkV === 1, S.trkV);
      const G = JSON.parse(JSON.stringify(S)); delete G.trkV; G.round = 5;
      G.th = { 13: [{ s: 1, lg: 'f1', w: { n: 'A' }, fl: { n: 'A', c: 'AAA', t: 92.0 }, me: { p: 2, g: 3, d: 0 } }], 14: [{ s: 1, lg: 'f1', fl: { n: 'B', t: 76.0 } }], 10: [{ s: 1, lg: 'f1', fl: { n: 'C', t: 99.5 } }] };
      const o = migrate(JSON.parse(JSON.stringify(G)));
      ck('an old Sol de Vega record (circuit 10% shorter) is converted by the base lap ratio', Math.abs(o.th[13][0].fl.t - 92 * 83 / 92) < 0.01, o.th[13][0].fl.t);
      ck('a record on a longer circuit gets slower (Falkenring)', Math.abs(o.th[14][0].fl.t - 76 * 78 / 76) < 0.01, o.th[14][0].fl.t);
      ck('a circuit whose length did not change keeps its record (Longwei)', o.th[10][0].fl.t === 99.5, o.th[10][0].fl.t);
      ck('the rest of the circuit history is kept', o.th[13][0].w.n === 'A' && o.th[13][0].me.p === 2);
      const o2 = migrate(JSON.parse(JSON.stringify(o)));
      ck('loading again does not convert twice', o2.th[13][0].fl.t === o.th[13][0].fl.t, o2.th[13][0].fl.t);
      ck('track mastery is kept (same circuit keys)', CIRCUITS[13].key === 'sol-de-vega' && CIRCUITS[16].key === 'velocera');
      return rows;
    });
    for (const r of rows) console.log((r.p ? 'PASS ' : 'FAIL ') + r.n + (r.p ? '' : ' ' + JSON.stringify(r.d)));
    assert.deepEqual(rows.filter(r => !r.p).map(r => r.n), []);
    console.log('ERRS', errors); assert.deepEqual(errors, []);
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exit(1); });
