/* Pit-stop challenge is played when the car enters the pit lane, and a pit call can be cancelled until then. */
const { chromium } = require('playwright');
const { assert, chooseStyle } = require('./flow');
const { pathToFileURL } = require('node:url');
const path = require('node:path');

(async () => {
  const browser = await chromium.launch(), errors = [];
  try {
    const pg = await browser.newPage();
    pg.on('pageerror', e => errors.push(e.message));
    await pg.goto(pathToFileURL(path.resolve(__dirname, '../index.html')).href);
    await pg.evaluate(() => { A.new(); A['career-mode']({ v: 'classic' }); A['new-go'](); });
    await chooseStyle(pg);
    const rows = await pg.evaluate(() => {
      const rows = [], check = (name, pass, data) => rows.push({ name, pass: !!pass, data });
      const realPitAny = pitAny, realCrew = crewTime;
      const DRY = { type: 'kering', start: 999, end: 999, int: 0 };
      let miniCalls = 0, miniCb = null;
      pitAny = function (cb) { miniCalls++; miniCb = cb; };
      crewTime = () => 2.6;
      Object.assign(P2, { mechK: 0, mistK: 0, lapNz: 0, errK: 0 });
      function start(o) {
        miniCalls = 0; miniCb = null; seedRnd(4242);
        S.settings.mini = o.mini !== false; S.settings.ask = true;
        const R = makeRace2(S, 0, [S.pi], { temp: 0.5, weather: DRY }), p = R.p = R.cars[0];
        UI.wk = { R, mg: { q: 0.5, s: 0.5, pn: [], bq: [] }, step: 'race' };
        RUN = { R, acc: 0, last: 0, spd: 2, pause: true, fast: !!o.fast, highlights: false, wait: false, logI: 0, radio: [], mgCd: 9999, sig: '', tSig: 0, fin: false, stops: p.stops };
        R.radio = RUN.radio; p.bot = { push: 1, fuelMode: 1, energyMode: 1, noAttack: true }; p.noPitUntil = 99;
        return { R, p };
      }
      function stepTo(R, p, pred, max = 4000) { let n = 0; while (!pred() && !RUN.wait && !R.done && n++ < max) stepOne(R); return n; }
      function lapFrac(p) { return p.s - Math.floor(p.s); }
      function call(p, comp) { p.noPitUntil = 0; p.pitReq = comp; RUN.wait = true; pitResolve(comp); }

      /* 1. pit call mid-lap: no challenge yet, race keeps running */
      let { R, p } = start({});
      stepTo(R, p, () => p.lap >= 3 && lapFrac(p) > 0.1 && lapFrac(p) < 0.3);
      const lapAtCall = p.lap; call(p, 'H');
      check('pit call does not open the pit-stop challenge', miniCalls === 0 && !RUN.wait && p.pitReq === 'H' && p.pitOk && !!RUN.pitPending && p.crewT == null, { miniCalls, wait: RUN.wait, pending: !!RUN.pitPending });
      const sAtCall = p.s;

      /* 2. race runs on, challenge opens just before the pit entry of the same lap, car has not stopped yet */
      stepTo(R, p, () => false);
      check('challenge starts at the pit entry of the same lap, before the stop', RUN.wait && miniCalls === 1 && p.stops === 0 && p.lap === lapAtCall && p.s > sAtCall + 0.5 && p.s < pitEntryS(p.s) && pitEntryS(p.s) - p.s < 0.1, { wait: RUN.wait, miniCalls, stops: p.stops, lap: p.lap, lapAtCall, s: p.s, entry: pitEntryS(p.s) });

      /* 3. cancel is blocked once the challenge is open */
      A['r-pitx']();
      check('cannot cancel while the challenge is open', p.pitReq === 'H' && p.pitOk, { pitReq: p.pitReq });

      /* 4. the challenge result drives the stop time */
      miniCb(2.1, 0.8);
      check('challenge result stored as crew time and race resumes', p.crewT === 2.1 && !RUN.wait && UI.wk.mg.pn.length === 1, { crewT: p.crewT, wait: RUN.wait, pn: UI.wk.mg.pn });
      stepTo(R, p, () => p.stops === 1);
      const pit = R.log.filter(e => e.k === 'pit')[0], want = R.c.pit * P2.pitS + 2.1 - 2.4;
      check('stop happens right after, using the challenge time', p.stops === 1 && pit && Math.abs(pit.loss - want) < 1e-6 && p.comp === 'H', { stops: p.stops, loss: pit && pit.loss, want });

      /* 5. cancel before the entry: no challenge, no stop */
      ({ R, p } = start({}));
      stepTo(R, p, () => p.lap >= 3 && lapFrac(p) > 0.1 && lapFrac(p) < 0.3);
      call(p, 'M'); stepTo(R, p, () => lapFrac(p) > 0.5 && lapFrac(p) < 0.6);
      A['r-pitx']();
      check('cancel before the entry clears the call and the pending challenge', p.pitReq == null && !p.pitOk && !RUN.pitPending && p.crewT == null, { pitReq: p.pitReq, pending: !!RUN.pitPending });
      const lap0 = p.lap; stepTo(R, p, () => p.lap >= lap0 + 2);
      check('cancelled call never triggers a challenge or a stop', miniCalls === 0 && p.stops === 0 && !RUN.wait, { miniCalls, stops: p.stops });

      /* 6. challenge setting off: stop happens at the entry without a challenge */
      ({ R, p } = start({ mini: false }));
      stepTo(R, p, () => p.lap >= 3 && lapFrac(p) > 0.1 && lapFrac(p) < 0.3);
      call(p, 'H'); const l1 = p.lap;
      check('no pending challenge when mini-games are off', !RUN.pitPending && !RUN.wait);
      stepTo(R, p, () => p.stops === 1);
      check('mini-games off: stop still happens at the end of the same lap', p.stops === 1 && miniCalls === 0 && p.lap === l1 && p.s > Math.floor(p.s) + 0.9, { stops: p.stops, miniCalls, lap: p.lap, l1, s: p.s });

      /* 7. pit called late in the lap: still a single challenge, at the next entry */
      ({ R, p } = start({}));
      stepTo(R, p, () => p.lap >= 3 && lapFrac(p) > 0.985);
      call(p, 'H'); const l2 = p.lap;
      stepTo(R, p, () => false);
      check('call after the entry point waits for the next lap entry', RUN.wait && miniCalls === 1 && p.lap === l2 + 1 && p.stops === 0, { miniCalls, lap: p.lap, l2, stops: p.stops });
      miniCb(2.4, null); stepTo(R, p, () => p.stops === 1);
      check('late call ends in exactly one stop', p.stops === 1 && miniCalls === 1);

      pitAny = realPitAny; crewTime = realCrew;
      return rows;
    });
    for (const r of rows) console.log((r.pass ? 'PASS ' : 'FAIL ') + r.name + (r.pass ? '' : ' ' + JSON.stringify(r.data)));
    assert.deepEqual(rows.filter(r => !r.pass).map(r => r.name), []);
    console.log('ERRS', errors);
    assert.deepEqual(errors, []);
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exit(1); });
