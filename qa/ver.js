const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const pg = await b.newPage({ viewport: { width: 390, height: 844 } }); const errs = [];
  pg.on('pageerror', e => errs.push(e.message));
  await pg.goto(require('url').pathToFileURL(require('path').resolve(__dirname, '../index.html')).href); await pg.waitForTimeout(300);
  const url0 = pg.url();
  await pg.click('[data-act=chlog]'); await pg.waitForTimeout(300);
  console.log('modal has v1.0.0:', await pg.evaluate("document.querySelector('#modal').innerText.indexOf('v1.0.0')>=0"), 'url same:', pg.url() === url0);
  await pg.screenshot({ path: 'ver_modal.png' }); await pg.waitForTimeout(1200);
  await pg.click('#modal [data-act=mclose]'); await pg.waitForTimeout(200);
  // start career, save, check stamp
  await pg.click('[data-act=new]'); await pg.fill('#w8l', 'Ver'); await pg.click('[data-act=w8-next]'); await pg.click('[data-act=w8-next]'); await pg.click('[data-act=d-team][data-v="8"]'); await pg.click('[data-act=w8-next]');
  await pg.evaluate("A['new-go']()"); await pg.waitForTimeout(300);
  console.log('stamp', await pg.evaluate("JSON.stringify([JSON.parse(localStorage.getItem(KEY)).saveVer, JSON.parse(localStorage.getItem(KEY)).appVer])"));
  // old save w/o stamp loads and gets stamped
  await pg.evaluate("var o=JSON.parse(localStorage.getItem(KEY)); delete o.saveVer; delete o.appVer; localStorage.setItem(KEY, JSON.stringify(o));");
  await pg.reload(); await pg.waitForTimeout(300);
  await pg.click('[data-act=continue]'); await pg.waitForTimeout(300);
  console.log('after continue', await pg.evaluate("S.saveVer+' '+S.appVer+' screen='+UI.screen"));
  console.log('ERRS', JSON.stringify(errs)); await b.close();
})();
