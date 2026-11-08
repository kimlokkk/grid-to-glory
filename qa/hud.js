/* FAST HUD vs committed classification, including controlled finish edge cases. */
const { chromium } = require('playwright');
const { assert, chooseStyle, clickUI } = require('./flow');
const { pathToFileURL } = require('node:url');
const path = require('node:path');

(async () => {
  const browser = await chromium.launch();
  const errors = [], failures = [];
  function check(name, actual, expected) {
    try { assert.deepEqual(actual, expected, name); }
    catch (e) { failures.push(name); console.log('FAIL', name, JSON.stringify({ actual, expected })); }
  }
  async function start(width, seed) {
    const pg = await browser.newPage({ viewport: { width, height: 900 } });
    pg.on('pageerror', e => errors.push(e.message));
    await pg.clock.install();
    await pg.goto(pathToFileURL(path.resolve(__dirname, '../index.html')).href);
    await pg.evaluate(seed => { seedRnd(seed); A.new(); A['career-mode']({v:'classic'}); A['new-go'](); }, seed);
    await chooseStyle(pg, true);
    await clickUI(pg, '[data-act=wk-start]', true);
    for (let i = 0; i < 8; i++) {
      if (await pg.locator('[data-act=q-next]').count()) break;
      await clickUI(pg, await pg.locator('[data-act=q-fin]').count() ? '[data-act=q-fin]' : '[data-act=q-play]', true);
    }
    await clickUI(pg, '[data-act=q-next]', true);
    await clickUI(pg, '[data-act=s-go]', true);
    await pg.clock.runFor(500);
    return pg;
  }
  async function finalState(pg, label) {
    const data = await pg.evaluate(() => {
      const R = RUN.R, p = R.p, expected = R.cars.slice().sort((a, b) => {
        const ta = a.dnf ? 1e9 - a.dnfS : a.tFin + (a.pen || 0);
        const tb = b.dnf ? 1e9 - b.dnfS : b.tFin + (b.pen || 0);
        return ta - tb;
      });
      const tower = [...document.querySelectorAll('#towerb .tr')].filter(el => !el.classList.contains('head') && !el.classList.contains('gap'));
      const rows = tower.map(el => ({
        pos: el.children[0].textContent, code: el.querySelector('.c').textContent,
        gap: el.querySelector('.g').textContent, tyre: el.querySelector('.ty').textContent,
        age: el.querySelector('.ty2 > i:last-child').textContent, stops: el.children[5].textContent,
      }));
      const lead = expected[0];
      const pi = expected.indexOf(p), ahead = expected[pi - 1], behind = expected[pi + 1];
      const expectedRows = expected.map((f, i) => ({
        pos: f.dnf ? '–' : String(i + 1), code: f.d.code,
        gap: f.dnf ? 'DNF' : i === 0 ? 'Wins' : '+' + Math.max(0, f.tFin + (f.pen || 0) - lead.tFin - (lead.pen || 0)).toFixed(1),
        tyre: f.comp, age: String(Math.floor(f.eff)), stops: String(f.stops),
      }));
      return {
        rows, expectedRows,
        battle: document.getElementById('btchip').textContent,
        neighbours: document.getElementById('tinfo').textContent,
        ghosts: [...document.querySelectorAll('#dtrk .tcar:not(.me)')].filter(el => el.style.display !== 'none' && Number(el.style.opacity) > 0).length,
        caption: document.getElementById('cap').classList.contains('show'),
        playerPos: document.querySelector('#posb .bigp')?.textContent || null,
        positionGaps: [...document.querySelectorAll('#posb .gp b')].map(el => el.textContent).filter(t => /[\d.]s$/.test(t)).map(t => parseFloat(t)),
        expectedPositionGaps: p.dnf ? [] : [ahead ? Math.max(0, p.tFin + (p.pen || 0) - ahead.tFin - (ahead.pen || 0)) : null, behind && !behind.dnf ? Math.max(0, behind.tFin + (behind.pen || 0) - p.tFin - (p.pen || 0)) : null].filter(v => v !== null).map(v => Number(v.toFixed(1))),
        expectedPos: p.dnf ? 'DNF' : 'P' + (expected.indexOf(p) + 1),
        saved: S.results[S.results.length - 1],
        expectedSaved: { pos: pi + 1, pts: !p.dnf && pi < 10 ? PTS[pi] + (R.fl.di === p.di ? 1 : 0) : 0, dnf: p.dnf || null },
        history: S.rr[S.rr.length - 1].c.map(row => ({ name: row[0], pos: row[2], pts: row[3] })),
        expectedHistory: expected.map((f, i) => ({ name: f.d.name, pos: f.dnf ? 0 : i + 1, pts: !f.dnf && i < 10 ? PTS[i] + (R.fl.di === f.di ? 1 : 0) : 0 })),
        expectedIntervals: expected.map((f, i) => f.dnf ? 'DNF' : i === 0 ? 'Wins' : '+' + Math.max(0, f.tFin + (f.pen || 0) - expected[i - 1].tFin - (expected[i - 1].pen || 0)).toFixed(1)),
        committed: { round: S.round, xp: S.xp, career: JSON.parse(JSON.stringify(S.career)), results: JSON.parse(JSON.stringify(S.results)) },
        ids: R.cls.map(f => f.di), expectedIds: expected.map(f => f.di),
      };
    });
    check(label + ': full tower positions, adjusted gaps, tyres and stops', data.rows, data.expectedRows);
    check(label + ': finish badge', data.battle, 'CHEQUERED FLAG');
    check(label + ': no stale neighbour tyres', data.neighbours, '');
    check(label + ': no ghost opponents', data.ghosts, 0);
    check(label + ': no old race caption', data.caption, false);
    if (data.playerPos !== null) {
      check(label + ': player position', data.playerPos, data.expectedPos);
      check(label + ': position panel adjusted gaps', data.positionGaps, data.expectedPositionGaps);
    }
    check(label + ': committed order', data.ids, data.expectedIds);
    check(label + ': saved result', { pos: data.saved.pos, pts: data.saved.pts, dnf: data.saved.dnf }, data.expectedSaved);
    check(label + ': full saved classification/points', data.history, data.expectedHistory);
    if (process.env.QA_HUD_SCREENSHOT_DIR) await pg.screenshot({ path: path.join(process.env.QA_HUD_SCREENSHOT_DIR, label.replace(/[^a-z0-9]+/gi, '-') + '.png'), fullPage: true });
    await pg.evaluate(() => A.tw2({ v: 'int' }));
    await pg.clock.runFor(50);
    check(label + ': adjusted intervals', await pg.locator('#towerb .tr:not(.head):not(.gap) .g').allTextContents(), data.expectedIntervals);
    await clickUI(pg, '[data-act=r-done]', true);
    await pg.evaluate(() => { UI.clsAll = true; render(); });
    const result = await pg.evaluate(() => ({
      rows: [...document.querySelectorAll('tr[data-act=prof]')].map(el => ({
        pos: el.children[0].textContent, tyre: el.children[2].querySelector('.ty').textContent,
        stops: el.children[2].querySelector('.dim').textContent.trim(), time: el.children[3].textContent,
      })),
      committed: { round: S.round, xp: S.xp, career: S.career, results: S.results },
    }));
    check(label + ': results screen positions/tyres/stops', result.rows.map(r => ({ pos: r.pos, tyre: r.tyre, stops: r.stops })), data.expectedRows.map(r => ({ pos: r.pos, tyre: r.tyre, stops: r.stops })));
    check(label + ': results screen gaps', result.rows.slice(1).map(r => r.time), data.expectedRows.slice(1).map(r => r.gap));
    check(label + ': opening results does not award twice', result.committed, data.committed);
    console.log('CHECKED', label);
  }
  try {
    for (const width of [390, 1280]) {
      const pg = await start(width, 20261105);
      await pg.evaluate(() => { UI.twFull = true; A['r-fast'](); });
      for (let i = 0; i < 2500; i++) {
        await pg.clock.runFor(100);
        if (await pg.evaluate(() => RUN.fin)) break;
      }
      assert.equal(await pg.evaluate(() => RUN.fin), true, 'FAST completes real race');
      await finalState(pg, 'FAST ' + width);
      await pg.close();
    }
    for (const kind of ['penalty', 'leader penalty', 'DNF']) {
      const pg = await start(390, 20261106);
      // Prime the actual battle render just before a finish inside its throttle window.
      const clearedAtFast = await pg.evaluate(kind => {
        stopRace(); UI.twFull = true;
        const R = RUN.R, p = R.p, other = R.cars.find(f => f !== p);
        p.fin = false; p.dnf = null; p.s = 2; p.sPrev = 2;
        other.fin = false; other.dnf = null; other.s = 2.005; other.sPrev = other.s;
        UI.tinfoT = 0; drawCars(R, 1); cap('Safety car', 'sc');
        A[kind === 'DNF' ? 'r-ff' : 'r-fast']();
        const cleared = !document.getElementById('cap').classList.contains('show');
        R.cars.forEach((f, i) => {
          f.fin = true; f.dnf = null; f.s = R.L; f.sPrev = R.L;
          f.tFin = 1200 + i * 2; f.pen = 0; f.eff = 7 + i / 10;
        });
        p.tFin = 1200; p.pen = 5;
        other.tFin = 1202;
        if (kind === 'leader penalty') p.tFin = 1190;
        if (kind === 'DNF') { p.dnf = 'Engine failure'; p.dnfS = R.L - 2; p.tFin = 1e9; }
        R.sc = 'SC'; R.done = true; RUN.fin = false;
        RUN.pause = false; loop(performance.now());
        return cleared;
      }, kind);
      check(kind + ': enabling FAST clears old caption immediately', clearedAtFast, true);
      await finalState(pg, 'controlled ' + kind + ' under SC');
      await pg.close();
    }
    console.log('ERRS', JSON.stringify(errors.concat(failures)));
    if (errors.length || failures.length) process.exitCode = 1;
  } finally {
    await browser.close();
  }
})().catch(e => { console.error(e); process.exitCode = 1; });
