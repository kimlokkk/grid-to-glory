/* Team sponsors: a title sponsor and partners per team, about 2x between the top and the bottom, naming rights (not for heritage teams), race bonuses, driver backing, the gate for older saves, the Partners panel and the story pack line. */
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
      seedRnd(5); S = newProCareer('Spx', 'pace', 7, 'f1');
      ck('a new career has team sponsors from its first season', S.spx && S.spx.from === S.season && spxOn(S), S.spx);
      const all = []; S.teams.forEach(t => { if (t.spxP.title) all.push(t.spxP.title.n); t.spxP.partners.forEach(x => all.push(x.n)); });
      ck('every team has a title sponsor and 3 partners, no brand on two cars', S.teams.every(t => t.spxP.title && t.spxP.partners.length === 3) && new Set(all).size === all.length, all.length);
      const tot = S.teams.map(t => spxSum(S, t)), hi = Math.max(...tot), lo = Math.min(...tot);
      ck('the richest team gets about 2x the poorest', hi / lo > 1.6 && hi / lo < 2.6, [hi, lo]);
      ck('heritage teams keep their own name', S.teams.filter(t => t.prestige >= SPX.heritage).every(t => !t.spxP.title.naming && spxName(t) === t.name));
      const nm = S.teams.find(t => t.spxP.title.naming);
      ck('naming rights put the sponsor in the shown name', !nm || (spxName(nm) !== nm.name && spxName(nm).indexOf(nm.name) > 0 && spxDisp(nm) === spxName(nm)), nm && spxName(nm));
      S.spons = [{ n: 'Home Test Brand', v: 6, yrs: 2, left: 2, need: { k: 'fin', n: 10 } }]; const me = S.drivers[S.pi];
      ck('the player brings backing from personal sponsors', spxBack(S, me) > 0, spxBack(S, me));
      const play = () => { for (let i = 0; i < seasonRounds(S); i++) { const ci = S.cal[S.round], R = runRace2(S, ci, qualiGrid2(S, ci), {}); let fl = null; R.cars.forEach(f => { if (!f.dnf && f.best < 900 && (!fl || f.best < fl.best)) fl = f; }); R.fl = { di: fl.di, t: fl.best }; finishRace(S, { ci: R.ci, c: R.c, fl: R.fl, cls: R.cls.map(f => ({ car: { d: f.d, di: f.di, isP: f.isP, grid: f.grid, dnf: f.dnf }, pos: f.pos, dnf: !!f.dnf })) }, 4); } };
      play();
      const w = teamStandings(S)[0];
      ck('podiums and wins pay sponsor bonuses', w.fin.spxBonus > 0, w.fin.spxBonus);
      ck('the story pack lists the sponsors', /Sponsors \$[\d.]+M\/yr: title /.test(storyPackText('season')));
      UI.screen = 'hub'; UI.tab = 'team'; if (A['onb-style']) A['onb-style']({ v: 'casual' }); closeModal(); render();
      ck('the Team tab shows the Partners panel', !!document.querySelector('.spx-card .spx-title') && document.querySelectorAll('.spx-card .spx-pt').length === 3);
      endSeason(S); startNewSeason(S, me.team, 2);
      ck('next season sponsorship is the contracts plus backing', S.teams.every(t => Math.abs(t.fin.spon - spxSum(S, t) - spxBackSum(S, t)) < 0.01), S.teams.map(t => [t.fin.spon, spxSum(S, t)]));
      ck('contracts run into the new season', S.teams.every(t => t.spxP.title.end >= S.season && t.spxP.partners.every(x => x.end >= S.season)));
      seedRnd(6); const G = newProCareer('Old', 'pace', 7, 'f1'); delete G.spx; G.teams.forEach(t => delete t.spxP); G.round = 3; const o = migrate(JSON.parse(JSON.stringify(G)));
      ck('an older save mid-season gets team sponsors from the next season', o.spx && o.spx.from === o.season + 1 && !spxOn(o), o.spx);
      return rows;
    });
    for (const r of rows) console.log((r.p ? 'PASS ' : 'FAIL ') + r.n + (r.p ? '' : ' ' + JSON.stringify(r.d)));
    assert.deepEqual(rows.filter(r => !r.p).map(r => r.n), []);
    console.log('ERRS', errors); assert.deepEqual(errors, []);
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exit(1); });
