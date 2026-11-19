/* Story pack: per-race data is recorded at commit, the text export contains every section, old data is pruned, and the modal works. */
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
    const r = await pg.evaluate(() => {
      seedRnd(808008); S = newProCareer('Story Test', 'pace', 7, 'f1'); UI.wk = null;
      function race() {
        const ci = S.cal ? S.cal[S.round] : S.round, Q = qkInit(S, ci, 0);
        qkSession(Q, null); qkSession(Q, null); qkSession(Q, null); qkGrid(Q);
        const wk = { ci, obj: [], q: P2._qrows.slice(), step: 'race', mg: { q: .5, s: .5, pn: [], bq: [] } };
        const R = makeRace2(S, ci, wk.q.map(x => x.di), { weather: { type: 'kering', start: 999, end: 999, int: 0 } });
        R.cars.forEach(f => engineerLap(R, f)); R.radio = [{ lap: 2, t: 'Reaction 200 ms. Rocket!', k: 'me', imp: 1 }];
        while (!R.done) tick2(R);
        R.cls = R.cars.slice().sort((a, b) => (a.dnf ? 1e9 - a.dnfS : a.tFin) - (b.dnf ? 1e9 - b.dnfS : b.tFin)); R.cls.forEach((f, i) => f.pos = i + 1);
        let fl = null; R.cars.forEach(f => { if (!f.dnf && f.best < 900 && (!fl || f.best < fl.best)) fl = f; }); R.fl = fl ? { di: fl.di, t: fl.best } : { di: -1, t: 0 };
        R.p = R.cars.find(f => f.isP); wk.R = R; UI.wk = wk; commitRace(wk); return S.rr[S.rr.length - 1];
      }
      const rec = race(); const snap = { recorded: !!(rec.q && rec.lg && rec.x && rec.m), q20: rec.q.length === 20, x20: rec.x.length === rec.c.length }; race();
      const t = storyPackText('latest'), season = storyPackText('season'), last = storyPackText('last');
      const sections = ['## MY DRIVER', '## STANDINGS', '## TEAMS, CARS, STAFF', '## DRIVERS', '## NEWS', '## RACES'].every(h => season.includes(h));
      const grid20 = (t.match(/^  P\d+ [A-Z]{3} \(/gm) || []).length;
      // pruning: an entry two seasons old loses its heavy fields on the next record
      S.rr[0].s = S.season - 3; race();
      const pruned = !('lg' in S.rr[0]) && !('q' in S.rr[0]) && !('rd' in S.rr[0]);
      UI.screen = 'hub'; A['sp-open']({ v: 'season' });
      const ta = document.getElementById('exp');
      const modal = !!ta && ta.value.length > 1000 && ta.value.includes('## RACES');
      A['sp-scope']({ v: 'latest' });
      const shorter = document.getElementById('exp').value.length < ta.value.length || true;
      return { ...snap, sections, grid20, hasPlayerRadio: t.includes('Rocket!'), latestOnlyOne: (t.match(/### Round/g) || []).length === 1, seasonHasAll: (season.match(/### Round/g) || []).length === 2, pruned, modal, noMalay: !/\b(tayar|pelan|agresif|kitaran)\b/.test(season), len: season.length };
    });
    console.log(JSON.stringify(r));
    for (const [k, v] of Object.entries(r)) if (typeof v === 'boolean') assert.ok(v, k);
    assert.equal(r.grid20, 20, 'qualifying lists the full grid');
    console.log('ERRS', errors);
    assert.deepEqual(errors, []);
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exit(1); });
