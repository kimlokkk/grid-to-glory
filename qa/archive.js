/* Archive: season records, rebuild of older seasons, records page, OVR history, overflow. */
const { chromium } = require('playwright');
const { assert, chooseStyle } = require('./flow');
const { pathToFileURL } = require('node:url');
const path = require('node:path');
(async () => {
  const browser = await chromium.launch(), errors = [];
  try {
    for (const vp of [[360, 740], [1440, 900]]) {
      const pg = await browser.newPage({ viewport: { width: vp[0], height: vp[1] } });
      pg.on('pageerror', e => errors.push(e.message));
      await pg.goto(pathToFileURL(path.resolve(__dirname, '../index.html')).href);
      await pg.evaluate(() => { A.new(); A['career-mode']({ v: 'classic' }); A['new-go'](); });
      await chooseStyle(pg);
      const rows = await pg.evaluate(() => {
        const rows = [], ck = (n, p, d) => rows.push({ n, p: !!p, d });
        const play = n => { for (let r = 0; r < n; r++) { const ci = S.cal[S.round], R = runRace2(S, ci, qualiGrid2(S, ci), {}); let fl = null; R.cars.forEach(f => { if (!f.dnf && f.best < 900 && (!fl || f.best < fl.best)) fl = f; }); R.fl = { di: fl.di, t: fl.best }; finishRace(S, { ci: R.ci, c: R.c, fl: R.fl, cls: R.cls.map(f => ({ car: { d: f.d, di: f.di, isP: f.isP, grid: f.grid, dnf: f.dnf }, pos: f.pos, dnf: !!f.dnf })) }, 4); } };
        const season = () => { play(seasonRounds(S) - S.round); endSeason(S); startNewSeason(S, S.offers ? S.offers[0].team : null, S.offers ? S.offers[0].years : null); };
        season(); season(); play(3);
        ck('finished seasons stored in the archive', S.arcv.length === 2 && S.arcv.every(e => e.src === 'full' && e.d.length >= 8 && e.rc.length > 0 && e.ch), S.arcv.length);
        ck('archive rows carry OVR, poles, fastest laps', S.arcv[0].d.every(x => x.o > 0 && x.pl != null && x.fl != null));
        const poles = S.arcv[0].d.reduce((a, x) => a + x.pl, 0); ck('one pole and one winner per race', poles === S.arcv[0].rc.length && S.arcv[0].d.reduce((a, x) => a + x.w, 0) === S.arcv[0].rc.length, poles);
        const L = arAll(S); ck('arAll lists finished seasons plus the one in progress', L.length === 3 && L[0].src === 'live' && L[0].s === 3, L.map(e => e.src));
        const full = S.arcv.slice(); S.arcv = [];
        const L2 = arAll(S); ck('old seasons are rebuilt from race results when the archive is missing', L2.filter(e => e.src === 'rr').length === 2 && L2.every(e => e.ch) && L2.find(e => e.s === 1).d.length >= 8, L2.map(e => e.src));
        S.rr = []; const L3 = arAll(S); ck('without race results they fall back to season history', L3.filter(e => e.src === 'sh').length === 2, L3.map(e => e.src));
        S.drivers.forEach(d => { d.sh = []; }); S.retired = []; S.teams.forEach(t => { t.sh = []; }); const L4 = arAll(S); ck('without any history only champions remain', L4.filter(e => e.src === 'hist').length === 2 && L4.filter(e => e.src !== 'live').every(e => e.ch && !e.d.length), L4.map(e => e.src + ':' + e.d.length + ':' + e.t.length + ':' + !!e.ch));
        S.arcv = full;
        const R = arRecords(S); ck('records page data', R.dWins.length && R.dTitles.length && R.tTitles.length && R.best.pts, JSON.stringify(R.dTitles));
        const d0 = S.drivers[S.pi], rh = arRH(d0); ck('rating history has one point per finished season', rh.length >= 2 && rh.every(x => x.r > 0), rh);
        for (const v of ['champs', 'seasons', 'records']) { UI.arView = v; UI.musimView = 'archive'; UI.tab = 'musim'; UI.screen = 'hub'; render(); ck('archive ' + v + ' view renders', !!document.querySelector('.ar47') && !document.querySelector('.ar-seg button.on') === false); }
        UI.arSeason = 1; UI.arView = 'seasons'; render(); ck('season sheet lists drivers, teams and races', document.querySelectorAll('.ar-rows li').length >= 18 && document.querySelectorAll('.ar-races li').length > 0);
        ck('Archive button in Season nav', !!document.querySelector('[data-act=hub-section][data-v=archive]'));
        return rows;
      });
      for (const x of rows) console.log(vp[0] + ' ' + (x.p ? 'PASS ' : 'FAIL ') + x.n + (x.p ? '' : ' ' + JSON.stringify(x.d)));
      assert.deepEqual(rows.filter(x => !x.p).map(x => x.n), []);
      for (const v of ['champs', 'seasons', 'records']) {
        await pg.evaluate(v => { UI.arView = v; render(); }, v);
        const ov = await pg.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        assert.ok(ov <= 1, v + ' overflow ' + ov);
        if (vp[0] === 360 && process.env.SHOT) await pg.screenshot({ path: process.env.SHOT + '-' + v + '.png', fullPage: true });
      }
      await pg.close();
    }
    console.log('ERRS', errors); assert.deepEqual(errors, []);
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exit(1); });
