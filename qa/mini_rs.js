const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const pg = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errs = []; pg.on('pageerror', e => errs.push(e.stack.split('\n').slice(0, 3).join('|')));
  await pg.clock.install(); await pg.goto(require('url').pathToFileURL(require('path').resolve(__dirname, '../index.html')).href); await pg.clock.runFor(500);
  const has = async s => !!(await pg.$(s)); const click = async s => { const el = await pg.$(s); if (!el) return false; try { await el.click({ timeout: 1500 }); return true; } catch (e) { return false; } }; const tick = ms => pg.clock.runFor(ms);
  await click('[data-act=new]'); await tick(300); await pg.evaluate("A['new-go']()"); await tick(300);
  await click('[data-act=wk-start]'); await tick(400);
  for (let z = 0; z < 40; z++) { if (await has('[data-act=q-next]')) break; if (await has('[data-act=mg-go]')) { await click('[data-act=mg-go]'); await tick(600); continue; } if (await has('[data-act=mg-auto]')) { await click('[data-act=mg-auto]'); await tick(600); continue; } if (await has('[data-act=mg-ok]')) { await click('[data-act=mg-ok]'); await tick(400); continue; } if (!(await click('[data-act=q-fin]'))) await click('[data-act=q-play]'); await tick(500); }
  await click('[data-act=q-next]'); await tick(300); await click('[data-act=s-go]'); await tick(500);
  await pg.evaluate("restartGame(RUN.R, RUN.R.p)"); await tick(1300);
  console.log('intro buttons:', await pg.$$eval('#modal button', bs => bs.map(x => x.dataset.act + '|' + x.innerText.slice(0,20))));
  await click("#modal [data-act=mg-go]"); await tick(1300);
  console.log('RESTART modal buttons:', await pg.$$eval('#modal button', bs => bs.map(x => x.dataset.act + '|' + x.innerText.slice(0,20))));
  await tick(3000); console.log('rsg text:', await pg.evaluate("document.getElementById('rsg') && document.getElementById('rsg').textContent"));
  await pg.click('#modal [data-tap=mg-rs]'); console.log('clicked');
  await tick(300); console.log('modal now:', (await pg.evaluate("(document.querySelector('#modal')||{}).innerText||''")).replace(/\s+/g, ' ').slice(0, 100), 'wait', await pg.evaluate('RUN.wait'));
  await tick(1000); console.log('after 1s: wait', await pg.evaluate('RUN.wait'), 'modal', (await pg.evaluate("(document.querySelector('#modal')||{}).innerText||''")).replace(/\s+/g, ' ').slice(0, 60));
  await tick(3000); console.log('after 4s: lap', await pg.evaluate('RUN.R.p.lap'), 'wait', await pg.evaluate('RUN.wait'), 'pause', await pg.evaluate('RUN.pause'));
  console.log('ERRS', JSON.stringify(errs)); await b.close();
})();
