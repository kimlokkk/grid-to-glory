const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const pg = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errs = []; pg.on('pageerror', e => errs.push(e.stack.split('\n').slice(0, 4).join('|'))); pg.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  await pg.goto(require('url').pathToFileURL(require('path').resolve(__dirname, '../index.html')).href); await pg.click('[data-act=new]'); await pg.evaluate("A['new-go']()"); await pg.waitForTimeout(300);
  await pg.evaluate("S.settings.mini=false; S.settings.ask=false");
  const run = "(function(n){ for (var r=0;r<n;r++){ var ci=S.cal[S.round]; var R=runRace2(S,ci,qualiGrid2(S,ci),{}); var fl=null; R.cars.forEach(function(f){ if(!f.dnf&&f.best<900&&(!fl||f.best<fl.best)) fl=f;}); R.fl={di:fl.di,t:fl.best}; finishRace(S,{ci:R.ci,c:R.c,fl:R.fl,cls:R.cls.map(function(f){return {car:{d:f.d,di:f.di,isP:f.isP,grid:f.grid,dnf:f.dnf},pos:f.pos,dnf:!!f.dnf};})},4);} })";
  await pg.evaluate(run + "(10)"); await pg.evaluate("S.contract=1; endSeason(S); save(); UI.screen='hub'; UI.tab='musim'; render()"); await pg.waitForTimeout(200);
  await pg.click('[data-act=season-end]'); await pg.waitForTimeout(400);
  console.log('screen', await pg.evaluate('UI.screen'), 'offers', await pg.evaluate("JSON.stringify(S.offers.map(function(o){return [o.team,!!o.sit]}))"));
  await pg.screenshot({ path: 'e3b_offers.png', fullPage: true });
  const sitBtn = await pg.$('[data-sit="1"]'); console.log('sit button', !!sitBtn);
  if (!sitBtn) { console.log('ERRS', JSON.stringify(errs)); await b.close(); return; }
  await sitBtn.click(); await pg.waitForTimeout(500);
  console.log('after sign: screen', await pg.evaluate('UI.screen'), 'sit', await pg.evaluate('!!S.sit'));
  await pg.screenshot({ path: 'e3b_sit.png', fullPage: true });
  await pg.click('[data-act=sit-focus][data-k=wet]'); await pg.waitForTimeout(150);
  await pg.click('[data-act=sit-next]'); await pg.waitForTimeout(300);
  console.log('round', await pg.evaluate('S.round'));
  await pg.click('[data-act=sit-ff]'); await pg.waitForTimeout(500);
  await pg.screenshot({ path: 'e3b_sit_end.png', fullPage: true });
  await pg.click('[data-act=season-end]'); await pg.waitForTimeout(400);
  console.log('end: screen', await pg.evaluate('UI.screen'), 'sit', await pg.evaluate('!!S.sit'), 'offers', await pg.evaluate('S.offers.length'));
  await pg.screenshot({ path: 'e3b_summary.png', fullPage: true });
  await pg.click('[data-act=sign]'); await pg.waitForTimeout(400);
  console.log('new season', await pg.evaluate('S.season+" screen="+UI.screen+" me="+me().name+" id="+me().id+" team="+me().team+" round="+S.round'));
  for (const t of ['musim','saya','kereta','kej','kal']) { await pg.evaluate("UI.screen='hub'; UI.tab='"+t+"'; render()"); await pg.waitForTimeout(100); }
  await pg.evaluate(run + "(10)"); await pg.evaluate("S.contract=1; endSeason(S)"); console.log("normal season ok", await pg.evaluate("(S.offers||[]).length"));
  console.log('ERRS', JSON.stringify(errs)); await b.close();
})();
