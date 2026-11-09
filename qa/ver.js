const { chromium } = require('playwright');
const assert = require('node:assert/strict');
(async () => {
  const b = await chromium.launch();
  try {
    const pg = await b.newPage({ viewport: { width: 390, height: 844 } }), errs = [];
    pg.on('pageerror', e => errs.push(e.message));
    await pg.goto(require('url').pathToFileURL(require('path').resolve(__dirname, '../index.html')).href);
    assert.match(await pg.locator('[data-act=chlog]').textContent(), /v2\.0\.0/);
    const url0 = pg.url();
    await pg.click('[data-act=chlog]');
    const notes = await pg.locator('#modal').textContent();
    for (const text of ['v2.0.0', '22-round', 'F3', 'Highlights', 'SVG', 'Existing saves', 'v1.0.0', '2 Nov 2026']) assert.ok(notes.includes(text), text);
    assert.equal(pg.url(), url0);
    assert.ok(await pg.evaluate(() => document.documentElement.scrollWidth <= 390));
    console.log('PASS homepage version, complete major notes and historical release date');
    // Version stamps use the existing Classic fixture; public Pro creation has a contract wizard.
    await pg.evaluate(() => { closeModal(); A.new(); A['career-mode']({ v: 'classic' }); A['new-go'](); save(); });
    assert.deepEqual(await pg.evaluate(() => { const o = JSON.parse(localStorage.getItem(KEY)); return [o.saveVer, o.appVer]; }), [2, '2.0.0']);
    await pg.evaluate(() => { const o = JSON.parse(localStorage.getItem(KEY)); delete o.saveVer; delete o.appVer; localStorage.setItem(KEY, JSON.stringify(o)); });
    await pg.reload(); await pg.click('[data-act=continue]');
    assert.deepEqual(await pg.evaluate(() => [S.saveVer, S.appVer, UI.screen]), [2, '2.0.0', 'hub']);
    console.log('PASS new and unstamped legacy saves use app 2.0.0 with unchanged save format 2');
    assert.equal(errs.length, 0); console.log('ERRS', JSON.stringify(errs));
  } finally { await b.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
