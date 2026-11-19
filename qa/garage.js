/* Garage Watch: regulation announcements, reg report, UI render and overflow. */
const { chromium } = require('playwright');
const { assert, chooseStyle } = require('./flow');
const { pathToFileURL } = require('node:url');
const path = require('node:path');
(async () => {
  const browser = await chromium.launch(), errors = [];
  try {
    for (const vp of [[360, 740], [390, 844], [1440, 900]]) {
      const pg = await browser.newPage({ viewport: { width: vp[0], height: vp[1] } });
      pg.on('pageerror', e => errors.push(e.message));
      await pg.goto(pathToFileURL(path.resolve(__dirname, '../index.html')).href);
      await pg.evaluate(() => { A.new(); A['career-mode']({ v: 'classic' }); A['new-go'](); });
      await chooseStyle(pg);
      const r = await pg.evaluate(() => {
        const rows = [], ck = (n, p, d) => rows.push({ n, p: !!p, d });
        const w = rgWatch(S); ck('watch state valid', ['none', 'quiet', 'warn'].includes(w.state), w.state);
        S.regMinor = S.season + 1; S.rgMinorAnn = S.regMinor; const w2 = rgWatch(S);
        ck('major announced -> warn with 10+ rows', w2.state === 'warn' && w2.rows.length >= 8, w2.state + ' ' + (w2.rows || []).length);
        const ex = rgExposure(S, 'major'); ck('exposure bands valid', ex.length >= 8 && ex.every(x => ['exposed','watch','steady','upside','clean'].includes(x.band)));
        { const s0 = S.regReports ? S.regReports.length : 0; S.regYear = S.season + 1; devWinter(S, []); const rp = S.regReports[S.regReports.length - 1];
          ck('winter records a report', S.regReports.length >= s0 + 1 && rp.teams.length >= 8);
          ck('components sum to total move', rp.teams.every(e => Math.abs(e.c.st + e.c.ru + e.c.lu + e.c.pk - (e.p1 - e.p0)) < 0.2), rp.teams.map(e => [e.c, e.p0, e.p1])); }
        { delete S.rgStart; delete S.rgFin; delete S.rgSeen; let e = null; try { rgGarage(S); } catch (x) { e = x.message; } ck('old save without winter snapshot: garage news starts cleanly', !e && S.rgStart && S.rgStart.season === S.season, e); }
        { const offs = makeOffers(S, 5, null, true), html = offs.filter(o => !o.f1 && !o.sit).map(o => offerCardHTML(o));
          ck('offer cards carry a team outlook', html.length && html.every(h => h.includes('rg-out') && h.includes('Team outlook')), html.length);
          const ol = rgOutlook(S.teams[0].id); ck('outlook has rank, tags array', ol && ol.rank >= 1 && Array.isArray(ol.tags)); }
        UI.musimView = 'regs'; UI.tab = 'musim'; UI.screen = 'hub'; render();
        ck('regs page renders', !!document.querySelector('.rg46'));
        let ok = true; try { rgPackText(S); storyPackText(S); } catch (e) { ok = e.message; } ck('pack text', ok === true, ok);
        UI.tab = 'utama'; UI.screen = 'hub'; render(); ck('home strip', !!document.querySelector('.rg-strip'));
        return rows;
      });
      for (const x of r) { console.log(vp[0] + ' ' + (x.p ? 'PASS ' : 'FAIL ') + x.n + (x.p ? '' : ' ' + JSON.stringify(x.d))); }
      assert.deepEqual(r.filter(x => !x.p).map(x => x.n), []);
      await pg.evaluate(() => { UI.musimView = 'regs'; UI.tab = 'musim'; render(); });
      const ov = await pg.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      console.log(vp[0] + ' overflow', ov); assert.ok(ov <= 1, 'overflow ' + ov);
      if (vp[0] === 390) await pg.screenshot({ path: process.env.SHOT || '/tmp/rg.png', fullPage: true });
      await pg.close();
    }
    console.log('ERRS', errors); assert.deepEqual(errors, []);
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exit(1); });
