/* Regresi hujung ke hujung: main musim penuh melalui UI sebenar dengan jam dipercepat. Guna: node e2e.js [bilangan musim] */
const { chromium } = require('playwright');
(async () => {
  const seasons = Number(process.argv[2] || 1), W = Number(process.argv[3] || 390);
  const b = await chromium.launch(); const pg = await b.newPage({ viewport: { width: W, height: 844 } });
  const errs = []; pg.on('pageerror', e => errs.push(e.stack.split('\n').slice(0, 4).join('|')));
  pg.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  await pg.clock.install();
  await pg.goto(require('url').pathToFileURL(require('path').resolve(__dirname, '../index.html')).href); await pg.clock.runFor(500);
  const has = async s => !!(await pg.$(s));
  const click = async s => { const el = await pg.$(s); if (!el) return false; try { await el.click({ timeout: 1500 }); return true; } catch (e) { return false; } };
  const tick = async ms => { await pg.clock.runFor(ms); };
  await click('[data-act=new]'); await tick(300); await pg.evaluate("A['new-go']()"); await tick(300);
  await pg.evaluate("S.settings.mini=true; S.settings.ask=true; save()");
  const log = [];
  for (let s = 0; s < seasons; s++) {
    for (let r = 0; r < 10; r++) {
      if (!(await click('[data-act=wk-start]'))) { log.push('no wk-start at S' + s + ' R' + r + ' screen=' + await pg.evaluate('UI.screen')); break; }
      await tick(300);
      for (let z = 0; z < 40; z++) { if (await has('[data-act=q-next]')) break; if (await has('[data-act=mg-go]')) { await click('[data-act=mg-go]'); await tick(600); continue; } if (await has('[data-act=mg-begin]') || await has('[data-act=mg-auto]')) { await click('[data-act=mg-auto]'); await tick(600); continue; } if (await has('[data-act=mg-ok]')) { await click('[data-act=mg-ok]'); await tick(400); continue; } if (await has('#modal [data-tap]')) { await tick(1100); await click('#modal [data-tap]'); await tick(900); continue; } if (!(await click('[data-act=q-fin]'))) await click('[data-act=q-play]'); await tick(500); }
      await click('[data-act=q-next]'); await tick(300);
      if (s === 0 && r === 9) await pg.screenshot({ path: 'e2e_finalpre.png', fullPage: true });
      await click('[data-act=s-go]'); await tick(500);
      await click('[data-act=mg-auto]'); await tick(200); await click('[data-act=mg-ok]'); await tick(200);
      await click('[data-act=r-fast]');
      let done = false;
      for (let i = 0; i < 2500 && !done; i++) {
        await tick(250);
        if (await has('[data-act=r-done]')) { done = true; break; }
        if (await has('[data-act=pc-yes]')) { await click('[data-act=pc-yes]'); continue; }
        if (await has('#modal [data-tap]')) { await tick(1100); await click('#modal [data-tap]'); await tick(900); continue; }
        if (await has('[data-act=mg-go]')) { await click('[data-act=mg-go]'); continue; }
        if (await has('[data-act=mg-begin]')) { await click('[data-act=mg-auto]'); continue; }
        if (await has('[data-act=mg-auto]')) { await click('[data-act=mg-auto]'); continue; }
        if (await has('[data-act=mg-ok]')) { await click('[data-act=mg-ok]'); continue; }
        if (await has('[data-act=r-ff]')) await click('[data-act=r-ff]');
      }
      if (!done) { log.push('race not finished S' + s + ' R' + r + ' screen=' + await pg.evaluate('UI.screen+"/"+(UI.wk&&UI.wk.step)')); await pg.screenshot({ path: 'e2e_stuck.png' }); break; }
      await click('[data-act=r-done]'); await tick(300);
      const hasPress = await has('[data-act=press]');
      if (hasPress) { await click('[data-act=press][data-i="0"]'); await tick(200); log.push('press S' + s + ' R' + r); }
      if (s === 0 && r === 0) await pg.screenshot({ path: 'e2e_result.png', fullPage: true });
      if (s === 0 && r === 9) await pg.screenshot({ path: 'e2e_finalpost.png', fullPage: true });
      await click('[data-act=r-next]'); await tick(300);
    }
    log.push('after last race: screen=' + await pg.evaluate('UI.screen'));
    if (await has('[data-act=rev-done]')) { if (s === 0) await pg.screenshot({ path: 'e2e_review.png', fullPage: true }); await click('[data-act=rev-done]'); await tick(300); }
    else { if (!(await has('[data-act=season-end]'))) { await pg.evaluate("UI.tab='musim'; render()"); await tick(200); } await click('[data-act=season-end]'); await tick(300); if (await has('[data-act=rev-done]')) { await click('[data-act=rev-done]'); await tick(300); } }
    log.push('S' + s + ' end: screen=' + await pg.evaluate('UI.screen') + ' offers=' + await pg.evaluate('S.offers?S.offers.length:0'));
    if (s === 0) await pg.screenshot({ path: 'e2e_season.png', fullPage: true });
    if (await has('[data-act=sign]')) await click('[data-act=sign]'); else await click('[data-act=next-season]');
    await tick(400);
    log.push('-> S' + await pg.evaluate('S.season') + ' screen=' + await pg.evaluate('UI.screen'));
    for (const t of ['saya', 'kereta', 'kej', 'kal', 'musim']) { await pg.evaluate("UI.screen='hub'; UI.tab='" + t + "'; render()"); await tick(100); }
  }
  console.log(log.join('\n')); console.log('ERRS', JSON.stringify(errs).slice(0, 1500));
  await b.close();
})();
