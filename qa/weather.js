/* Forecast, strategy UI and engineer consistency; weather fixtures are controlled. */
const { chromium } = require('playwright');
const { assert, chooseStyle, clickUI } = require('./flow');
const { pathToFileURL } = require('node:url');
const path = require('node:path');

(async () => {
  const browser = await chromium.launch(), errors = [], failures = [];
  const check = (name, actual, expected) => {
    try { assert.deepEqual(actual, expected, name); }
    catch (e) { failures.push(name); console.log('FAIL', name, JSON.stringify({ actual, expected })); }
  };
  const cases = [
    ['dry', { type: 'kering', start: 999, end: 999, int: 0 }],
    ['rain later', { type: 'hujan', start: 6, end: 11, int: 0.9 }],
    ['wet drying', { type: 'basah', start: -9, end: 5, int: 0.6 }],
    ['heavy wet', { type: 'basah', start: -9, end: 20, int: 0.95 }],
    ['damp start', { type: 'basah', start: -9, end: 3, int: 0.25 }],
  ];
  try {
    for (const [name, weather] of cases) {
      const pg = await browser.newPage({ viewport: { width: 390, height: 900 } });
      pg.on('pageerror', e => errors.push(e.message));
      await pg.clock.install();
      await pg.goto(pathToFileURL(path.resolve(__dirname, '../index.html')).href);
      await pg.evaluate(() => { seedRnd(20261108); A.new(); A['career-mode']({v:'classic'}); A['new-go'](); });
      await chooseStyle(pg, true);
      await pg.evaluate(weather => {
        // Keep forecast noise reproducible and independent of rival creation.
        ensureRival(S);
        let seed = 1;
        for (; seed < 100; seed++) { seedRnd(seed); if (rnd() < 0.15) break; }
        seedRnd(seed);
        const original = genWeather2;
        genWeather2 = () => JSON.parse(JSON.stringify(weather));
        try { A['wk-start'](); } finally { genWeather2 = original; }
      }, weather);
      const forecast = await pg.evaluate(() => UI.wk.fc);
      check(name + ': no categorical dry promise', /Dry for the whole race\./.test(forecast), false);
      if (weather.start < 0) {
        check(name + ': observed wet start is explicit', /wet track at the start/i.test(forecast), true);
        check(name + ': gradual drying is explicit', /take longer to dry|remain wet/i.test(forecast), true);
      } else if (weather.type === 'hujan') {
        check(name + ': rain forecast remains visible', /rain expected around lap/i.test(forecast), true);
      }
      for (let i = 0; i < 8; i++) {
        if (await pg.locator('[data-act=q-next]').count()) break;
        await clickUI(pg, await pg.locator('[data-act=q-fin]').count() ? '[data-act=q-fin]' : '[data-act=q-play]', true);
      }
      await clickUI(pg, '[data-act=q-next]', true);
      check(name + ': same weather reaches race', await pg.evaluate(() => UI.wk.R.w), weather);
      check(name + ': forecast does not reroll after qualifying', await pg.evaluate(() => UI.wk.fc), forecast);
      const cards = await pg.locator('[data-act=s-plan]').count();
      check(name + ': dry time estimates only for dry weather', cards > 0, weather.type === 'kering');
      check(name + ': pit estimates do not contradict weather', await pg.evaluate(() => pitCosts(UI.wk.R, UI.wk.R.p) === null), weather.type !== 'kering');
      if (weather.int >= 0.4 && weather.start < 0) check(name + ': recommended starting tyre fits observed track', await pg.evaluate(() => UI.wk.R.p.comp), weather.int * 0.9 > 0.68 ? 'W' : 'I');
      if (process.env.QA_WEATHER_SCREENSHOT_DIR) await pg.screenshot({ path: path.join(process.env.QA_WEATHER_SCREENSHOT_DIR, name.replace(/ /g, '-') + '.png'), fullPage: true });
      if (name === 'wet drying') {
        const dries = await pg.evaluate(() => {
          const R = { ...UI.wk.R, wet: 0, lapPos: 11, w: { type: 'basah', start: -9, end: 3, int: 0.6 } };
          const p = { ...R.p, comp: 'I', used: { I: 1 }, eff: 11, fcErr: 0, lap: 12, pitReq: null, hold: 0, plan: [], bot: null };
          engineerLap(R, p);
          return { slick: !!SLICK[p.pitReq], reason: p.why };
        });
        check(name + ': engineer replaces worn inters on dry track', dries, { slick: true, reason: 'cuaca' });
      }
      if (weather.type === 'hujan') {
        const predicted = await pg.evaluate(() => UI.wk.w.start + UI.wk.R.p.fcErr);
        const range = forecast.match(/around lap (\d+)–(\d+)/);
        check(name + ': engineer rain timing matches displayed window', !!range && predicted >= +range[1] && predicted <= +range[2], true);
        const planCard = pg.locator('.card').filter({ has: pg.locator('h3', { hasText: "Engineer's plan" }) });
        check(name + ': auto pit explanation matches mode', (await planCard.innerText()).includes('Pit calls are automatic'), true);
        await clickUI(pg, '[data-act=s-ask]', true);
        check(name + ': manual pit explanation matches mode', (await planCard.innerText()).includes('Pit calls pause for your decision'), true);
        await clickUI(pg, '[data-act=s-ask]', true);
      }
      if (weather.type !== 'kering') {
        check(name + ': slick pace label is explicitly dry-only', (await pg.locator('[data-act=s-start][data-v=S] .s').innerText()).includes('in the dry'), true);
        await pg.evaluate(() => { UI.wk.R.p.lock = 1; });
        await clickUI(pg, '[data-act=s-start][data-v=I]', true);
        check(name + ': custom tyre clears old plan lock', await pg.evaluate(() => !!UI.wk.R.p.lock), false);
        check(name + ': wet tyre selected without dry strategy highlight', await pg.evaluate(() => ({ comp: UI.wk.R.p.comp, cards: document.querySelectorAll('[data-act=s-plan].on').length })), { comp: 'I', cards: 0 });
        await clickUI(pg, '[data-act=s-go]', true);
        check(name + ': selected tyre reaches grid', await pg.evaluate(() => RUN.R.p.comp), 'I');
      } else {
        await clickUI(pg, '[data-act=s-plan][data-v="1"]', true);
        check('dry: selected alternative is retained', await pg.evaluate(() => ({ selected: UI.wk.sel, lock: UI.wk.R.p.lock })), { selected: 1, lock: 1 });
        const request = await pg.evaluate(() => {
          const R = UI.wk.R, p = R.p;
          R.w = { type: 'hujan', start: 0, end: R.L + 2, int: 0.95 };
          R.wet = 0.8; R.lapPos = 4; p.lap = 5; p.fcErr = 0;
          p.pitReq = null; p.hold = 0;
          engineerLap(R, p);
          return { wetTyre: p.pitReq === 'I' || p.pitReq === 'W', reason: p.why };
        });
        check('dry: actual rain can override locked dry plan', request, { wetTyre: true, reason: 'cuaca' });
      }
      console.log('CHECKED', name, JSON.stringify({ forecast, strategyCards: cards }));
      await pg.close();
    }
    console.log('ERRS', JSON.stringify(errors.concat(failures)));
    if (errors.length || failures.length) process.exitCode = 1;
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
