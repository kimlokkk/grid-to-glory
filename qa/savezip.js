/* Save compression: round trip, old plain saves, quota fallback, size win. */
const { chromium } = require('playwright');
const { assert } = require('./flow');
const { pathToFileURL } = require('node:url');
const path = require('node:path');
(async () => {
  const browser = await chromium.launch(), errors = [];
  try {
    const pg = await browser.newPage();
    pg.on('pageerror', e => errors.push(e.message));
    await pg.goto(pathToFileURL(path.resolve(__dirname, '../index.html')).href);
    await pg.waitForTimeout(500);
    const rows = await pg.evaluate(() => {
      const rows = [], ck = (n, p, d) => rows.push({ n, p: !!p, d });
      seedRnd(777); S = newProCareer('Zip Té 😀', 'pace', 7, 'f1');
      const play = n => { for (let i = 0; i < n; i++) { const ci = S.cal[S.round], R = runRace2(S, ci, qualiGrid2(S, ci), {}); let fl = null; R.cars.forEach(f => { if (!f.dnf && f.best < 900 && (!fl || f.best < fl.best)) fl = f; }); R.fl = { di: fl.di, t: fl.best }; finishRace(S, { ci: R.ci, c: R.c, fl: R.fl, cls: R.cls.map(f => ({ car: { d: f.d, di: f.di, isP: f.isP, grid: f.grid, dnf: f.dnf }, pos: f.pos, dnf: !!f.dnf })) }, 4); } };
      for (let y = 0; y < 2; y++) { play(seasonRounds(S)); endSeason(S); startNewSeason(S, S.offers && S.offers[0] ? S.offers[0].team : null, S.offers && S.offers[0] ? S.offers[0].years : null); }
      play(4);
      const json = JSON.stringify(S), z = lzPack(json);
      ck('compressed at least 3x smaller', json.length / z.length >= 3, [json.length, z.length]);
      ck('unicode survives the round trip', JSON.stringify(JSON.parse(lzUnpack(z))) === json);
      UI.zipN = 0; UI.noZip = false; ck('save() stores the compressed form', save() && localStorage.getItem(KEY).startsWith('z1:'));
      const L = loadSave(); ck('loadSave restores the exact career', JSON.stringify(L) === JSON.stringify(S) && L.me === undefined && L.drivers[L.pi].name === S.drivers[S.pi].name);
      ck('verification never fell back to plain JSON', !UI.noZip);
      localStorage.setItem(KEY, json); const L2 = loadSave(); ck('an old plain save still loads', !!L2 && L2.season === S.season && L2.round === S.round);
      save(); ck('and is converted to compressed on the next save', localStorage.getItem(KEY).startsWith('z1:'));
      const real = Storage.prototype.setItem, size = localStorage.getItem(KEY).length; let lim = size * 0.97;
      Storage.prototype.setItem = function (k, v) { if (k === KEY && v.length > lim) throw new Error('QuotaExceededError'); return real.call(this, k, v); };
      UI.saveWarn = 0; const n0 = S.news.length; ck('quota nearly full: old news is trimmed and the save succeeds', save() === true && S.news.length <= 120 && S.news.length < n0, [S.news.length, n0]);
      lim = 100; UI.saveWarn = 0; ck('quota impossible: returns false and warns once', save() === false && UI.saveWarn === 1);
      Storage.prototype.setItem = real;
      const bad = lzPack('{"a":1}'); ck('tiny payload round trips', lzUnpack(bad) === '{"a":1}' && lzUnpack(lzPack('')) === '');
      return rows;
    });
    for (const r of rows) console.log((r.p ? 'PASS ' : 'FAIL ') + r.n + (r.p ? '' : ' ' + JSON.stringify(r.d)));
    assert.deepEqual(rows.filter(r => !r.p).map(r => r.n), []);
    console.log('ERRS', errors); assert.deepEqual(errors, []);
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exit(1); });
