/* Export code: compressed (GTG2.), much shorter, imports back exactly; old plain codes still import. */
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
    const rows = await pg.evaluate(async () => {
      const rows = [], ck = (n, p, d) => rows.push({ n, p: !!p, d });
      seedRnd(5); S = newProCareer('Export', 'pace', 7, 'f1');
      const play = () => { for (let i = S.round; i < seasonRounds(S); i++) { const ci = S.cal[S.round], R = runRace2(S, ci, qualiGrid2(S, ci), {}); let fl = null; R.cars.forEach(f => { if (!f.dnf && f.best < 900 && (!fl || f.best < fl.best)) fl = f; }); R.fl = { di: fl.di, t: fl.best }; finishRace(S, { ci: R.ci, c: R.c, fl: R.fl, cls: R.cls.map(f => ({ car: { d: f.d, di: f.di, isP: f.isP, grid: f.grid, dnf: f.dnf }, pos: f.pos, dnf: !!f.dnf })) }, 4); } };
      for (let y = 0; y < 3; y++) { play(); endSeason(S); startNewSeason(S, S.offers && S.offers[0] ? S.offers[0].team : null, S.offers && S.offers[0] ? S.offers[0].years : null); }
      save(); const json = JSON.stringify(S), oldCode = btoa(unescape(encodeURIComponent(json)));
      const code = await expZip(json);
      ck('the export code is compressed and at least 5 times shorter', code.indexOf('GTG2.') === 0 && oldCode.length / code.length >= 5, [oldCode.length, code.length]);
      ck('the code survives line breaks and spaces when pasted', (await expUnzip(code.replace(/(.{76})/g, '$1\n '))) === json);
      ck('the compressed code imports back exactly', (await expUnzip(code)) === json);
      ck('an old plain code still imports', (await expUnzip(oldCode)) === json);
      A['export'](); await new Promise(r => setTimeout(r, 300)); const ta = document.getElementById('exp');
      ck('the Export screen shows the compressed code and how much shorter it is', ta && ta.value.indexOf('GTG2.') === 0 && /times shorter/.test(document.querySelector('#modal').textContent));
      closeModal(); const before = S.season; A.import(); document.getElementById('imp').value = code; A['import-go'](); await new Promise(r => setTimeout(r, 500));
      ck('importing the code from the screen restores the career', S && S.season === before && JSON.stringify(S.teams.map(t => t.pts)) === JSON.stringify(JSON.parse(json).teams.map(t => t.pts)));
      return rows;
    });
    for (const r of rows) console.log((r.p ? 'PASS ' : 'FAIL ') + r.n + (r.p ? '' : ' ' + JSON.stringify(r.d)));
    assert.deepEqual(rows.filter(r => !r.p).map(r => r.n), []);
    console.log('ERRS', errors); assert.deepEqual(errors, []);
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exit(1); });
