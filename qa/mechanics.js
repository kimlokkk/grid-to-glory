/* Controlled comparisons through the real race engine, plus UI action guards. */
const { chromium } = require('playwright');
const { assert, chooseStyle } = require('./flow');
const { pathToFileURL } = require('node:url');
const path = require('node:path');
const fs = require('node:fs');

(async () => {
  const browser = await chromium.launch(), errors = [];
  try {
    const pg = await browser.newPage();
    pg.on('pageerror', e => errors.push(e.message));
    await pg.goto(pathToFileURL(path.resolve(__dirname, '../index.html')).href);
    await pg.evaluate(() => { A.new(); A['career-mode']({v:'classic'}); A['new-go'](); });
    await chooseStyle(pg);
    const results = await pg.evaluate(() => {
      const saved = { ...P2 }, random = rnd, rows = [];
      const check = (name, ok, data) => rows.push({ name, pass: !!ok, data });
      const close = (a, b) => Math.abs(a - b) < 1e-7;
      const state = R => ({ distance: R.p.s, fuel: R.p.fuel, wear: R.p.eff, energy: R.p.en, time: R.p.tFin });
      function race(push = 1, di = S.pi) {
        seedRnd(42021);
        const R = makeRace2(S, 0, [di], { temp: 0.5, weather: { type: 'kering', start: 999, end: 999, int: 0 } });
        const p = R.p = R.cars[0];
        Object.assign(p, { s: 2, sPrev: 2, lap: 3, lapNoise: 0, comp: 'H', eff: 0, plan: [], used: { M: 1, H: 1 }, fuel: (R.L - 2) * P2.fuel0, en: 0.8, push, fuelMode: 1, energyMode: 1, bot: { push, fuelMode: 1, energyMode: 1, noAttack: true, plan: { comp: 'H', stops: [] } } });
        p.pA = paceFree(R, p);
        return R;
      }
      function bind(R) {
        UI.wk = { R, mg: { q: 0.5, s: 0.5, pn: [], bq: [] } };
        RUN = { R, fast: false, wait: false, pause: true, logI: 0, stops: 0, tSig: 0 };
      }
      try {
        S.drivers.forEach(d => { d.cons = 70; });
        Object.assign(P2, { mechK: 0, mistK: 0, lapNz: 0, errK: 0 });
        for (const di of [S.pi, 0]) {
          const modes = [0, 1, 2].map(push => { const R = race(push, di); for (let i = 0; i < TICKS_PER_LAP; i++) tick2(R); return state(R); });
          check((di === S.pi ? 'player' : 'AI') + ': tyre push changes pace and wear', modes[2].distance > modes[1].distance && modes[1].distance > modes[0].distance && modes[2].wear > modes[1].wear && modes[1].wear > modes[0].wear, modes);
        }
        const finishes = [0, 1, 2].map(push => { const R = race(push); while (!R.done) tick2(R); return state(R); });
        check('push changes actual finish times', new Set(finishes.map(f => f.time.toFixed(3))).size === 3, finishes);
        const flatAttack = race(2), flatBalanced = race(1); flatAttack.p.en = flatBalanced.p.en = 0;
        check('Tyre Push still works when battery is empty', paceFree(flatAttack, flatAttack.p) < paceFree(flatBalanced, flatBalanced.p));
        const fuelHUD = race(2); fuelHUD.p.fuelMode = fuelHUD.p.bot.fuelMode = 2; bind(fuelHUD);
        const box = document.createElement('div'); box.innerHTML = cockpitHTML(fuelHUD);
        const ring = [...box.querySelectorAll('.rings > div')].find(el => el.querySelector('small').textContent.includes('Fuel'));
        check('fuel HUD warns about deficit at current Fuel Push mode', ring.querySelector('b').textContent === '-0.6' && ring.querySelector('small').textContent.includes('Fuel margin') && ring.querySelector('small').textContent.includes('Push'), { margin: ring.querySelector('b').textContent });

        const normal = race(), boosted = race(); bind(boosted); A['r-atk']();
        for (let i = 0; i < 5; i++) { tick2(normal); tick2(boosted); }
        check('boost gains distance and costs energy, tyre and fuel', boosted.p.s > normal.p.s && boosted.p.en < normal.p.en && boosted.p.eff > normal.p.eff && boosted.p.fuel < normal.p.fuel, { normal: state(normal), boosted: state(boosted) });
        function passTrial(boost, sample) {
          const R = race(), b = R.p;
          b.pF = paceFree(R, b);
          const a = { ...b, di: 0, d: S.drivers[0], a: { ...b.a }, s: b.s + 0.003 };
          if (boost) { b.atk = 10; b.pF = paceFree(R, b); }
          rnd = () => sample;
          try {
            const ok = attemptPass(R, b, a, { n: 'turn 1', q: 1 });
            return { ok, probability: R.log[0].p, passes: R.nPass };
          } finally { rnd = random; }
        }
        const chances = [passTrial(false, 1), passTrial(true, 1)];
        const draw = (chances[0].probability + chances[1].probability) / 2;
        const passes = [passTrial(false, draw), passTrial(true, draw)];
        check('boost can turn the same overtaking opportunity into a pass', !passes[0].ok && passes[0].passes === 0 && passes[1].ok && passes[1].passes === 1, passes);
        const last = race(), plain = race(); last.p.atk = last.dt / 2; last.p.atkCd = 100;
        tick2(last); tick2(plain);
        check('last boost tick pays its tyre and fuel cost', last.p.s > plain.p.s && last.p.eff > plain.p.eff * 1.2 && last.p.fuel < plain.p.fuel - (plain.p.s - 2) * 0.04, { normal: state(plain), boosted: state(last) });
        for (const condition of ['SC', 'VSC', 'pit', 'finished', 'lap1']) {
          const R = race(); bind(R);
          if (condition === 'SC' || condition === 'VSC') { R.sc = condition; R.scT = 10000; }
          if (condition === 'pit') R.p.hold = 5;
          if (condition === 'finished') R.p.fin = true;
          if (condition === 'lap1') R.p.lap = 1;
          A['r-atk']();
          check('boost rejected during ' + condition, R.p.atk === 0 && R.p.en === 0.8, { boost: R.p.atk, energy: R.p.en });
        }
        for (const sc of ['SC', 'VSC']) {
          const active = race(), inactive = race();
          for (const R of [active, inactive]) { R.sc = sc; R.scT = 10000; }
          active.p.atk = active.dt * 2;
          tick2(active); tick2(inactive);
          check(sc + ': existing boost cannot beat restrictions or waste resources', close(active.p.s, inactive.p.s) && close(active.p.eff, inactive.p.eff) && close(active.p.fuel, inactive.p.fuel), { active: state(active), inactive: state(inactive) });
        }
        const cooldown = race(); bind(cooldown); A['r-atk'](); const energy = cooldown.p.en; A['r-atk']();
        check('boost cannot be stacked during cooldown', cooldown.p.en === energy);
        A['r-mode']({ k: 'push', v: '2' }); A['r-mode']({ k: 'push', v: '-1' });
        check('Auto push takes over immediately', cooldown.p.push === aiPush(cooldown, cooldown.p), { push: cooldown.p.push, expected: aiPush(cooldown, cooldown.p) });

        function traffic(sc, manual) {
          const R = race(1, manual === null ? 0 : S.pi);
          const other = makeRace2(S, 0, [R.p.di === 0 ? 1 : 0], { weather: R.w }).cars[0];
          Object.assign(other, { s: 2.004, sPrev: 2.004, lap: 3, comp: 'H', eff: 0, used: { H: 1, M: 1 }, bot: { noAttack: true, push: 1, plan: { comp: 'H', stops: [] } } });
          R.cars.push(other); R.zones = [{ at: 0.1, q: 1, n: 'turn 1' }];
          R.p.bot.noAttack = false;
          R.p.bot.energyMode = manual === true ? 1 : null;
          if (sc) { R.sc = sc; R.scT = 10000; }
          rnd = () => 0.5;
          if (manual !== null) { bind(R); S.settings.ask = manual; S.settings.mini = false; stepOne(R); }
          else tick2(R);
          rnd = random;
          return R.p.atk;
        }
        check('AI does not spend boost under SC/VSC', traffic('SC', null) === 0 && traffic('VSC', null) === 0);
        check('AI still boosts while chasing under green', traffic(null, null) > 0);
        check('manual decisions keep boost under player control', traffic(null, true) === 0);
        check('Auto still manages boost when chasing', traffic(null, false) > 0);

        const tyres = race(), fresh = paceFree(tyres, tyres.p);
        tyres.p.eff = tyreLife(tyres.p, tyres) + 3;
        check('worn tyres slow the car', paceFree(tyres, tyres.p) > fresh + 2, { fresh, worn: paceFree(tyres, tyres.p), health: tyreHealth(tyres.p, tyres) });
        const fuel = race(); fuel.p.fuel = 10; const heavy = paceFree(fuel, fuel.p);
        fuel.p.fuel = 1; const light = paceFree(fuel, fuel.p);
        fuel.p.fuel = 0; const empty = paceFree(fuel, fuel.p);
        check('fuel mass and empty-tank penalty affect pace', heavy > light && empty > light + 2.9, { heavy, light, empty });

        function pit(sc = 0, crew = 2.4) {
          const R = race(); Object.assign(R.p, { s: 2.968, sPrev: 2.968, eff: 6, pitReq: 'M', crewT: crew });
          if (sc) { R.sc = sc; R.scT = 10000; }
          const initialFuel = R.p.fuel;
          const cost = pitLossOf(R.p, R) * (sc === 'SC' ? 0.5 : sc === 'VSC' ? 0.7 : 1);
          tick2(R);
          const entry = (2.97 - 2.968) * R.p.pA;
          return { R, cost, expectedHold: Math.max(0, cost - (R.dt - entry)), initialFuel };
        }
        const stop = pit();
        check('pit stop consumes remaining time in entry tick', close(stop.R.p.hold, stop.expectedHold), { actual: stop.R.p.hold, expected: stop.expectedHold });
        check('new tyres are unused while car is stationary in pit', stop.R.p.eff === 0 && stop.R.p.comp === 'M' && stop.R.p.stops === 1, state(stop.R));
        check('pit stop never refuels the car', stop.R.p.fuel < stop.initialFuel);
        const short = pit('SC');
        check('short SC stop can finish within the entry tick', short.expectedHold === 0 && short.R.p.hold === 0 && short.R.p.s > 2.97, state(short.R));
        const fastPit = pit(0, 2.4), slowPit = pit(0, 6.4);
        check('slower crew costs actual time', close(slowPit.R.p.hold - fastPit.R.p.hold, 4), { fast: fastPit.R.p.hold, slow: slowPit.R.p.hold });
        while (!fastPit.R.done) tick2(fastPit.R);
        while (!slowPit.R.done) tick2(slowPit.R);
        check('crew speed changes actual finish time', Math.abs(slowPit.R.p.tFin - fastPit.R.p.tFin - 4) < 0.05, { fast: fastPit.R.p.tFin, slow: slowPit.R.p.tFin });

        const delayed = race(); delayed.p.s = delayed.L - 0.01; delayed.p.sPrev = delayed.p.s; delayed.p.lap = delayed.L; delayed.p.hold = 1;
        const expectedFinish = 1 + 0.01 * paceFree(delayed, delayed.p);
        tick2(delayed);
        check('finish time includes partial-tick spin/hold', close(delayed.p.tFin, expectedFinish), { actual: delayed.p.tFin, expected: expectedFinish });
        const clean = race(), spun = race();
        P2.mistK = 20; P2.crashPerSpin = 0; rnd = () => 0.5;
        incidents(spun, [spun.p]); rnd = random; P2.mistK = 0;
        const hold = spun.p.hold;
        while (!clean.done) tick2(clean);
        while (!spun.done) tick2(spun);
        check('spin causes a real finish-time loss', hold > 0 && spun.nSpin === 1 && Math.abs(spun.p.tFin - clean.p.tFin - hold) < 0.05, { hold, clean: clean.p.tFin, spun: spun.p.tFin });

        P2.mistK = saved.mistK; P2.crashPerSpin = 0; P2.vscSpin = 0;
        const risk = (push, wet, consistency) => {
          const R = race(push); R.wet = wet;
          R.p.d = { ...R.p.d, cons: consistency, wet: consistency };
          R.p.a = { ...R.p.a, restart: consistency, adapt: consistency, risk: 50 };
          for (let seed = 1; seed <= 20000; seed++) { R.p.hold = 0; seedRnd(seed); incidents(R, [R.p]); }
          return R.nSpin;
        };
        const risks = { save: risk(0, 0, 70), balanced: risk(1, 0, 70), attack: risk(2, 0, 70), wet: risk(1, 0.8, 70), consistent: risk(1, 0, 95), inconsistent: risk(1, 0, 40) };
        check('spin risk responds to push, rain and consistency', risks.attack > risks.balanced && risks.balanced > risks.save && risks.wet > risks.balanced && risks.inconsistent > risks.consistent, risks);
      } finally { rnd = random; Object.assign(P2, saved); }
      return rows;
    });
    for (const result of results) console.log(result.pass ? 'PASS' : 'FAIL', result.name, result.data ? JSON.stringify(result.data) : '');
    if (process.env.QA_MECHANICS_REPORT) fs.writeFileSync(process.env.QA_MECHANICS_REPORT, JSON.stringify(results, null, 2) + '\n');
    const failures = results.filter(r => !r.pass).map(r => r.name);
    console.log('ERRS', JSON.stringify(errors.concat(failures)));
    assert.equal(errors.length + failures.length, 0, 'all mechanics checks pass');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
