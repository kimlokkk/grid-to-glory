/* Training XP: sessions spend XP by default; "Keep my XP" saves it; the spend is shown to the player. */
const { chromium } = require('playwright');
const { assert } = require('./flow');
const { pathToFileURL } = require('node:url');
const path = require('node:path');
(async () => {
  const browser = await chromium.launch(), errors = [];
  try {
    const pg = await browser.newPage({ viewport: { width: 390, height: 844 } });
    pg.on('pageerror', e => errors.push(e.message));
    await pg.goto(pathToFileURL(path.resolve(__dirname, '../index.html')).href);
    await pg.waitForTimeout(500);
    const rows = await pg.evaluate(() => {
      const rows = [], ck = (n, p, d) => rows.push({ n, p: !!p, d });
      const weekend = () => { const x0 = S.xp, L = trainingPrepare(S), x1 = S.xp, card = focusHTML(); const ci = S.cal[S.round], R = runRace2(S, ci, qualiGrid2(S, ci), {}); let fl = null; R.cars.forEach(f => { if (!f.dnf && f.best < 900 && (!fl || f.best < fl.best)) fl = f; }); R.fl = { di: fl.di, t: fl.best }; finishRace(S, { ci: R.ci, c: R.c, fl: R.fl, cls: R.cls.map(f => ({ car: { d: f.d, di: f.di, isP: f.isP, grid: f.grid, dnf: f.dnf }, pos: f.pos, dnf: !!f.dnf })) }, 4); return { x0, x1, spent: L ? L.spent : 0, after: S.xp, card }; };
      seedRnd(31); S = newProCareer('Xp Keep', 'pace', 7, 'f1'); trainingInit(S); S.xp = 20;
      let w = weekend();
      ck('default: a training session spends XP automatically', w.spent > 0 && w.x1 === w.x0 - w.spent, w);
      ck('the weekend card tells the player what was bought', w.card.includes('Training bought'));
      seedRnd(31); S = newProCareer('Xp Keep', 'pace', 7, 'f1'); trainingInit(S); progressionPlayer(S).training.spendXp = false; S.xp = 20;
      const seq = []; for (let i = 0; i < 4; i++) { w = weekend(); seq.push([w.x0, w.x1, w.after]); }
      ck('Keep my XP: no spend, XP only goes up', seq.every(r => r[1] === r[0] && r[2] >= r[1]) && seq[3][2] > seq[0][0], seq);
      ck('Keep my XP: readiness still builds', progressionPlayer(S).mind.locked.preparation > 0, progressionPlayer(S).mind.locked.preparation);
      /* the real select element drives the setting */
      UI.screen = 'hub'; UI.tab = 'aku'; render();
      const sel = document.querySelector('select[data-training=spend]'); ck('Driver > Training has the XP use switch', !!sel && sel.value === 'off', sel && sel.value);
      sel.value = 'on'; sel.dispatchEvent(new Event('change', { bubbles: true })); ck('switching back to Buy skills with XP', progressionPlayer(S).training.spendXp === true);
      return rows;
    });
    for (const r of rows) console.log((r.p ? 'PASS ' : 'FAIL ') + r.n + (r.p ? '' : ' ' + JSON.stringify(r.d)));
    assert.deepEqual(rows.filter(r => !r.p).map(r => r.n), []);
    console.log('ERRS', errors); assert.deepEqual(errors, []);
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exit(1); });
