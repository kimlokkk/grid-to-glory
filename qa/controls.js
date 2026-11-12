/* Independent commands: real engine comparisons, mixed ownership and actual mobile clicks. */
const { chromium } = require('playwright');
const { assert, chooseStyle, clickUI } = require('./flow');
const { pathToFileURL } = require('node:url');
const path = require('node:path');
const fs = require('node:fs');
(async () => {
  const browser = await chromium.launch(), errors = [], rows = [];
  const record = (name, pass, data) => rows.push({ name, pass: !!pass, data });
  try {
    const pg = await browser.newPage({ viewport: { width: 390, height: 844 } });
    pg.on('pageerror', e => errors.push(e.message));
    await pg.clock.install();
    await pg.goto(pathToFileURL(path.resolve(__dirname, '../index.html')).href);
    await pg.evaluate(() => { seedRnd(20261105); A.new(); A['career-mode']({v:'classic'}); A['new-go'](); });
    await chooseStyle(pg, true);
    rows.push(...await pg.evaluate(() => {
      const rows = [], saved = { ...P2 }, random = rnd;
      const check = (name, pass, data) => rows.push({ name, pass: !!pass, data });
      const close = (a, b) => Math.abs(a - b) < 1e-7;
      function race(modes = {}, di = S.pi) {
        seedRnd(2121);
        const R = makeRace2(S, 0, [di], { temp: 0.5, weather: { type: 'kering', start: 999, end: 999, int: 0 } });
        R.p = R.cars[0]; const p = R.p;
        Object.assign(p, { s: 2, sPrev: 2, lap: 3, lapNoise: 0, comp: 'H', tyreTemp: 0.5, eff: 0, en: 0.8, plan: [], fuel: (R.L - 2) * P2.fuel0, used: { M: 1, H: 1 } });
        p.bot = { push: 1, fuelMode: 1, energyMode: 1, noAttack: true, plan: { comp: 'H', stops: [] }, ...modes };
        refreshRaceModes(R, p); p.pA = paceFree(R, p); return R;
      }
      function bind(R, fast = false, auto = false) {
        UI.wk = { R, mg: { q: 0.5, s: 0.5, pn: [], bq: [] } };
        RUN = { R, fast, auto, pause: true, wait: false, logI: 0, stops: 0, tSig: 0 };
        S.settings.ask = false; S.settings.mini = false;
      }
      const state = R => ({ distance: R.p.s - 2, wear: R.p.eff, fuel: R.p.fuel, energy: R.p.en, heat: tyreHeat(R.p), time: R.p.tFin });
      try {
        S.drivers.forEach(d => { d.cons = 70; });
        Object.assign(P2, { mechK: 0, mistK: 0, lapNz: 0, errK: 0 });
        for (const di of [S.pi, 0]) for (const key of ['push', 'fuelMode', 'energyMode']) {
          const samples = [0, 1, 2].map(mode => { const R = race({ [key]: mode }, di); for (let n = 0; n < 20; n++) tick2(R); return state(R); });
          check((di === S.pi ? 'player' : 'AI') + ': ' + key + ' changes real pace', samples[2].distance > samples[1].distance && samples[1].distance > samples[0].distance, samples);
          if (key === 'push') {
            check('tyre mode changes wear and heat', samples[2].wear / samples[2].distance > samples[1].wear / samples[1].distance && samples[1].wear / samples[1].distance > samples[0].wear / samples[0].distance && samples[2].heat > samples[1].heat && samples[1].heat > samples[0].heat);
            check('tyre mode leaves fuel and battery rates independent', samples.every(s => close((((laps2(CIRCUITS[0]) - 2) * P2.fuel0) - s.fuel) / s.distance, 1) && close((s.energy - 0.8) / s.distance, 0.02 * S.teams[S.drivers[di].team].car.engine / 80)));
          } else if (key === 'fuelMode') {
            const initial = (laps2(CIRCUITS[0]) - 2) * P2.fuel0;
            const rates = samples.map(s => (initial - s.fuel) / s.distance);
            check('fuel modes change fuel per distance', rates[2] > rates[1] && rates[1] > rates[0], rates);
            check('fuel mode does not alter tyre wear rate', samples.every(s => close(s.wear / s.distance, 1)));
          } else {
            check('Harvest charges; Deploy drains the same battery', samples[0].energy > samples[1].energy && samples[1].energy > samples[2].energy);
            check('energy mode does not alter tyre wear rate', samples.every(s => close(s.wear / s.distance, 1)));
          }
          const finishes = [0, 1, 2].map(mode => { const R = race({ [key]: mode }, di); while (!R.done) tick2(R); return state(R); });
          check(key + ' affects actual finish times (' + di + ')', finishes.every(s => Number.isFinite(s.time) && s.time > 0) && new Set(finishes.map(s => s.time.toFixed(3))).size === 3, finishes);
        }
        const mixed = race({ push: 2, fuelMode: 0, energyMode: 0 });
        const startFuel = mixed.p.fuel;
        for (let n = 0; n < 20; n++) tick2(mixed);
        check('Tyre Push + Fuel Save + Harvest works together', mixed.p.push === 2 && mixed.p.fuelMode === 0 && mixed.p.energyMode === 0 && mixed.p.eff / (mixed.p.s - 2) > 1.3 && close((startFuel - mixed.p.fuel) / (mixed.p.s - 2), 0.93) && mixed.p.en > 0.8, state(mixed));
        const emptyFuel = race({ fuelMode: 2 }), emptyFuelNeutral = race(); emptyFuel.p.fuel = emptyFuelNeutral.p.fuel = 0;
        check('empty tank cannot retain Fuel Push bonus', close(paceFree(emptyFuel, emptyFuel.p), paceFree(emptyFuelNeutral, emptyFuelNeutral.p)));
        const harvest = race({ energyMode: 0 }), full = race({ energyMode: 2 }); full.p.en = 0;
        const neutral = race({ energyMode: 1 }); neutral.p.en = 0;
        check('empty battery removes Deploy bonus, tyre push stays independent', close(paceFree(full, full.p), paceFree(neutral, neutral.p)));
        bind(harvest); activateBoost(harvest, harvest.p); const charged = harvest.p.en; tick2(harvest);
        check('Boost shares battery and cannot recharge while active', close(harvest.p.en, charged) && charged < 0.8);
        const boost = race({ energyMode: 2 }); boost.p.atk = 10;
        const boostNeutral = race(); boostNeutral.p.atk = 10;
        check('Deploy and Boost do not stack pace bonuses', close(paceFree(boost, boost.p), paceFree(boostNeutral, boostNeutral.p)));
        const heat = race({ push: 2 });
        for (let n = 0; n < 100; n++) tick2(heat);
        const hot = tyreHeat(heat.p), worn = heat.p.eff, hotLoss = tyreThermalLoss(heat.p);
        setRaceMode(heat, heat.p, 'push', 0);
        for (let n = 0; n < 40; n++) tick2(heat);
        check('sustained Push overheats; Save cools without restoring wear', hot > 0.78 && hotLoss > 0 && tyreHeat(heat.p) < hot && heat.p.eff > worn, { hot, cooled: tyreHeat(heat.p), worn, afterWear: heat.p.eff });
        const ai = race({ push: null, fuelMode: null, energyMode: null });
        ai.p.tyreTemp = 0.95; ai.p.fuel = ai.L - ai.p.s - 0.3; ai.p.en = 0.1;
        refreshRaceModes(ai, ai.p);
        check('engineer independently saves hot tyres, tight fuel and low energy', ai.p.push === 0 && ai.p.fuelMode === 0 && ai.p.energyMode === 0);
        for (const speed of ['normal', 'FAST', 'Skip']) {
          const R = race({ push: 2, fuelMode: 0, energyMode: null }); bind(R, speed === 'FAST', speed === 'Skip');
          R.p.tyreTemp = 1; R.p.fuel = R.L - R.p.s - 1;
          for (let n = 0; n < 40; n++) stepOne(R);
          check(speed + ': manual choices survive advice and laps; Auto energy continues', R.p.push === 2 && R.p.bot.push === 2 && R.p.fuelMode === 0 && R.p.bot.energyMode === null && (R.radio || []).some(r => /Fuel|Tyres/.test(r.t)));
          const fuel = R.p.bot.fuelMode;
          setRaceMode(R, R.p, 'push', -1);
          check(speed + ': returning tyres to Auto preserves other ownership', R.p.bot.push === null && R.p.push === 0 && R.p.bot.fuelMode === fuel && R.p.bot.energyMode === null);
        }
        for (const sc of ['SC', 'VSC']) {
          const a = race({ push: 2, fuelMode: 2, energyMode: 2 }), b = race({ push: 0, fuelMode: 0, energyMode: 0 });
          for (const R of [a, b]) { R.sc = sc; R.scT = 10000; tick2(R); }
          check(sc + ': commands cannot bypass restrictions; manual selections remain', close(a.p.s, b.p.s) && close(a.p.fuel, b.p.fuel) && close(a.p.en, b.p.en) && a.p.push === 2 && a.p.fuelMode === 2 && a.p.energyMode === 2);
        }
        const pit = race({ push: 2 }); pit.p.s = pit.p.sPrev = 2.968; pit.p.pitReq = 'M'; pit.p.tyreTemp = 1; pit.p.eff = 10; tick2(pit);
        check('pit fits fresh tyres with reset heat and no refuel', pit.p.comp === 'M' && pit.p.eff === 0 && pit.p.tyreTemp === 0.3);
        P2.mistK = saved.mistK; P2.crashPerSpin = 0; P2.vscSpin = 0;
        function risk(modes, hot = 0.5, worn = false) {
          const R = race(modes); R.p.tyreTemp = hot; if (worn) R.p.eff = tyreLife(R.p, R);
          for (let seed = 1; seed <= 40000; seed++) { R.p.hold = 0; seedRnd(seed); incidents(R, [R.p]); }
          return R.nSpin;
        }
        const risks = { base: risk({}), tyre: risk({ push: 2 }), fuel: risk({ fuelMode: 2 }), deploy: risk({ energyMode: 2 }), hot: risk({ push: 2 }, 1), worn: risk({ push: 2 }, 0.5, true) };
        check('spin responds to tyre push, heat and wear; no fuel/energy risk stacking', risks.tyre > risks.base && risks.hot > risks.tyre && risks.worn > risks.tyre && risks.fuel === risks.base && risks.deploy === risks.base, risks);
      } finally { rnd = random; Object.assign(P2, saved); }
      return rows;
    }));
    // Real strategy and race screens, with the actual delegated click handler.
    await pg.evaluate(() => { UI.wk = null; RUN = null; UI.screen = 'hub'; render(); A['wk-start'](); A['q-fin'](); A['q-next'](); });
    await pg.clock.runFor(800);
    record('strategy has three independent controls', await pg.locator('[data-act=s-mode]').count() === 12);
    const selectedPlan = await pg.evaluate(() => {
      if (!UI.wk.opts || UI.wk.opts.length < 2) return null;
      A['s-plan']({ v: '1' });
      return { plan: JSON.stringify(UI.wk.R.p.plan), comp: UI.wk.R.p.comp, estimate: UI.wk.opts[UI.wk.sel].est };
    });
    await clickUI(pg, '[data-act=s-mode][data-k=push][data-v="2"]', true);
    if (selectedPlan) {
      const afterPlan = await pg.evaluate(() => ({ plan: JSON.stringify(UI.wk.R.p.plan), comp: UI.wk.R.p.comp, estimate: UI.wk.opts[UI.wk.sel].est, locked: UI.wk.R.p.lock }));
      record('changing tyre effort reprices plans without overwriting selected pit plan', afterPlan.plan === selectedPlan.plan && afterPlan.comp === selectedPlan.comp && afterPlan.locked === 1 && afterPlan.estimate !== selectedPlan.estimate);
    }

    await clickUI(pg, '[data-act=s-mode][data-k=fuelMode][data-v="0"]', true);
    const ownership = await pg.evaluate(() => ({ bot: UI.wk.R.p.bot, html: document.body.textContent }));
    record('strategy clicks set mixed Manual/Auto ownership', ownership.bot.push === 2 && ownership.bot.fuelMode === 0 && ownership.bot.energyMode == null && ownership.html.includes('Manual'));
    await clickUI(pg, '[data-act=s-go]', true);
    await pg.evaluate(() => { stopRace(); closeModal(); RUN.wait = false; S.settings.ask = false; S.settings.mini = false; paintPanels(true); });
    for (const viewport of [{ width: 390, height: 844 }, { width: 320, height: 568 }, { width: 1280, height: 900 }]) {
      await pg.setViewportSize(viewport); await pg.clock.runFor(800);
      await pg.evaluate(() => { UI.phone = isPhone(); render(); paintPanels(true); });
      for (const [key, value] of [['energyMode', 2], ['push', -1], ['fuelMode', 1]]) {
        const selector = `[data-act=r-mode][data-k=${key}][data-v="${value}"]:visible`;
        if (!(await pg.locator(selector).count())) { await clickUI(pg, `[data-act=r-control][data-k=${key}]:visible`, true); await pg.clock.runFor(700); }
        await clickUI(pg, selector, true);
        record(`${viewport.width}: ${key} button applies`, await pg.evaluate(({ key, value }) => RUN.R.p.bot[key] === (value < 0 ? null : value), { key, value }));
      }
      const resourceSelector = '.wh-dials button:visible';
      record(`${viewport.width}: fuel and battery readings remain available`, await pg.locator(resourceSelector).filter({ hasText: /Fuel.*[+-]?[0-9]+\.[0-9]L/ }).count() === 1 && await pg.locator(resourceSelector).filter({ hasText: /Energy.*[0-9]+%/ }).count() === 1);
      if (viewport.height <= 700) record('small phone: race retains at least 160px of visible height', await pg.locator('.rview').evaluate(el => el.getBoundingClientRect().height >= 160));
      record(`${viewport.width}: controls fit page width`, await pg.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      if (process.env.QA_CONTROLS_DIR) await pg.screenshot({ path: path.join(process.env.QA_CONTROLS_DIR, `controls-${viewport.width}.png`), fullPage: true });
    }
    const failures = rows.filter(r => !r.pass).map(r => r.name);
    for (const r of rows) console.log(r.pass ? 'PASS' : 'FAIL', r.name, r.data ? JSON.stringify(r.data) : '');
    if (process.env.QA_CONTROLS_DIR) fs.writeFileSync(path.join(process.env.QA_CONTROLS_DIR, 'results.json'), JSON.stringify(rows, null, 2) + '\n');
    console.log('ERRS', JSON.stringify(errors.concat(failures)));
    assert.equal(errors.length + failures.length, 0);
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
