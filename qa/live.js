const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const pg = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errs = []; pg.on('pageerror', e => errs.push(e.stack.split('\n').slice(0, 4).join('|')));
  await pg.clock.install(); await pg.goto(require('url').pathToFileURL(require('path').resolve(__dirname, '../index.html')).href); await pg.clock.runFor(500);
  const has = async s => !!(await pg.$(s)); const click = async s => { const el = await pg.$(s); if (!el) return false; try { await el.click({ timeout: 1500 }); return true; } catch (e) { return false; } }; const tick = ms => pg.clock.runFor(ms);
  await click('[data-act=new]'); await tick(300); await pg.evaluate("A['new-go']()"); await tick(300); await pg.evaluate("S.settings.mini=false; S.settings.ask=false; save()");
  async function toRace() {
    await click('[data-act=wk-start]'); await tick(300);
    for (let z = 0; z < 8; z++) { if (await has('[data-act=q-next]')) break; if (!(await click('[data-act=q-fin]'))) await click('[data-act=q-play]'); await tick(300); }
    await click('[data-act=q-next]'); await tick(300); await click('[data-act=s-go]'); await tick(1500);
  }
  await toRace();
  console.log('mid-race: live', await pg.evaluate('JSON.stringify(S.live)'), 'round', await pg.evaluate('S.round'));
  await pg.evaluate("A['wk-quit']()"); await tick(300);
  console.log('after quit: round', await pg.evaluate('S.round'), 'results', await pg.evaluate('S.results.length'), 'live', await pg.evaluate('JSON.stringify(S.live)'), 'screen', await pg.evaluate('UI.screen'), 'toast', await pg.evaluate("(document.querySelector('.toast')||{}).textContent"));
  await toRace();
  await pg.reload(); await tick(500); await click('[data-act=continue]'); await tick(400);
  console.log('after reload+continue: round', await pg.evaluate('S.round'), 'results', await pg.evaluate('S.results.length'), 'live', await pg.evaluate('JSON.stringify(S.live)'));
  /* bendera berkotak: keputusan dikunci sebelum "View results" */
  await toRace(); await click('[data-act=r-fast]');
  for (let i = 0; i < 2500; i++) { await tick(250); if (await has('[data-act=r-done]')) break; if (await has('[data-act=pc-yes]')) await click('[data-act=pc-yes]'); if (await has('[data-act=r-ff]')) await click('[data-act=r-ff]'); }
  console.log('chequered: round', await pg.evaluate('S.round'), 'results', await pg.evaluate('S.results.length'), 'step', await pg.evaluate('UI.wk.step'), 'rep', await pg.evaluate('!!UI.wk.rep'));
  await pg.reload(); await tick(500); await click('[data-act=continue]'); await tick(400);
  console.log('reload at flag: round', await pg.evaluate('S.round'), 'results', await pg.evaluate('S.results.length'));
  console.log('ERRS', JSON.stringify(errs)); await b.close();
})();
