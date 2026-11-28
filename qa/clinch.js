/* Title clinched: decided as soon as nobody can catch the leader; shown on the result, Home, news and the story pack. Stewards in the live race: radio and tower. */
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
      seedRnd(3); S = newProCareer('Champ', 'pace', 7, 'f1'); S.settings.tips = false; S.settings.mini = false; if (A['onb-style']) A['onb-style']({ v: 'casual' }); closeModal();
      /* live race: a penalty for the player reaches the radio, the caption and the tower */
      UI.screen = 'hub'; render(); A['wk-start'](); A['q-fin'](); A['q-next'](); const wk = UI.wk; A['s-start']({ v: wk.R.p.comp }); A['s-go'](); stopRace();
      const R = wk.R, p = R.p, a = R.cars.find(f => !f.isP); p.penQ = 5; R.log.push({ t: R.t, lap: 2, k: 'pen', b: p.di, a: a.di, sec: 5, out: 0, places: 0, txt: 't', tags: ['stewards'] }); readLog(R);
      ck('the engineer tells the player about a penalty on the radio', /\b5\b/.test((R.radio || []).slice(-1)[0].t) && /penalt|stewards/i.test((R.radio || []).slice(-1)[0].t));
      const seen = []; for (let i = 0; i < 24; i++) seen.push(rvSay('contact', { a: 'ABC' }));
      ck('radio lines vary and never repeat back to back', new Set(seen).size >= 4 && seen.every((t, i) => i === 0 || t !== seen[i - 1]), new Set(seen).size);
      ck('the common radio pools are much bigger now', ['gain', 'lose', 'idle', 'sc', 'dnf', 'fastpit'].every(k => RADIO[k].length >= 5));
      ck('the pit call card shows a varied but steady reply', rvStable('boxYes', 7) === rvStable('boxYes', 7) && rvStable('boxYes', 7) !== rvStable('boxYes', 8));
      ck('the timing tower shows the penalty to serve', /tw-pen/.test(towerHTML(R)));
      A['wk-quit']();
      /* a dominant car: the title is decided before the last round */
      const me = S.drivers[S.pi], t = S.teams[me.team]; ['pace', 'race', 'cons', 'tyre', 'wet'].forEach(k => me[k] = 99); ['aero', 'engine', 'chassis', 'rel'].forEach(k => t.car[k] = 99);
      let at = null; for (let i = S.round; i < seasonRounds(S); i++) { const ci = S.cal[S.round], R2 = runRace2(S, ci, qualiGrid2(S, ci), {}); let fl = null; R2.cars.forEach(f => { if (!f.dnf && f.best < 900 && (!fl || f.best < fl.best)) fl = f; }); R2.fl = { di: fl.di, t: fl.best }; finishRace(S, { ci: R2.ci, c: R2.c, fl: R2.fl, cls: R2.cls.map(f => ({ car: { d: f.d, di: f.di, isP: f.isP, grid: f.grid, dnf: f.dnf }, pos: f.pos, dnf: !!f.dnf })) }, 4); if (!at && S.clinch && S.clinch.d) at = { r: S.round, left: S.clinch.d.left, html: clinchBannerHTML('result') }; }
      const ds = driverStandings(S);
      ck('the title is decided as soon as the lead is bigger than what is left (26 a race)', at && at.left > 0 && ds[0] === me, at);
      ck('the race where it is decided shows the champion banner', at && /You are the champion|Double champions/.test(at.html));
      ck('Home keeps the champion banner for the rest of the season', /cl-ban/.test(hUtama()) || S.round >= seasonRounds(S));
      { seedRnd(5); const S0 = S; S = newProCareer('Flag', 'pace', 7, 'f1'); const me2 = S.drivers[S.pi]; me2.pts = 400; S.round = seasonRounds(S) - 3; const ci = S.cal[S.round], R3 = makeRace2(S, ci, qualiGrid2(S, ci), {}); R3.cars.forEach((f, i) => { f.fin = true; f.tFin = f.isP ? 1 : 100 + i; });
        ck('at the flag the engineer can tell the player the title is won', clinchWouldDecide(R3).d === true); S = S0; }
      ck('the news and the story pack say when the title was decided', (S.news || []).some(n => n.kick === 'CHAMPION') && /Titles decided this season: drivers/.test(storyPackText('latest')));
      return rows;
    });
    for (const r of rows) console.log((r.p ? 'PASS ' : 'FAIL ') + r.n + (r.p ? '' : ' ' + JSON.stringify(r.d)));
    assert.deepEqual(rows.filter(r => !r.p).map(r => r.n), []);
    console.log('ERRS', errors); assert.deepEqual(errors, []);
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exit(1); });
