const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const pg = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errs = []; pg.on('pageerror', e => errs.push(e.stack.split('\n').slice(0, 3).join('|')));
  await pg.clock.install(); await pg.goto(require('url').pathToFileURL(require('path').resolve(__dirname, '../index.html')).href); await pg.clock.runFor(500);
  await pg.click('[data-act=new]'); await pg.clock.runFor(300); await pg.evaluate("A['new-go']()"); await pg.clock.runFor(300);
  console.log('settings', await pg.evaluate('JSON.stringify(S.settings)'));
  const acts = async () => pg.$$eval('[data-act]', els => els.filter(e => e.getBoundingClientRect().width > 0).map(e => e.dataset.act + (e.dataset.v ? ':' + e.dataset.v : '')));
  await pg.click('[data-act=wk-start]'); await pg.clock.runFor(400);
  for (let i = 0; i < 6; i++) { console.log('step', i, await pg.evaluate("UI.wk.step"), (await acts()).join(' ')); const a = await acts(); const go = ['q-play','q-fin','q-next','mg-go','mg-begin','mg-auto','mg-ok'].find(x => a.includes(x)); if (!go) break; await pg.click('[data-act=' + go + ']'); await pg.clock.runFor(900); }
  console.log('ERRS', JSON.stringify(errs)); await pg.screenshot({ path: 'mini_probe.png' }); await b.close();
})();
