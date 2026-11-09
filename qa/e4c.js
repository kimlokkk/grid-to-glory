const { chromium } = require('playwright');
const { assert, chooseStyle, signOffer } = require('./flow');
(async () => {
  const b = await chromium.launch(); const pg = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errs = []; pg.on('pageerror', e => errs.push(e.stack.split('\n').slice(0, 4).join('|'))); pg.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  await pg.goto(require('url').pathToFileURL(require('path').resolve(__dirname, '../index.html')).href); await pg.click('[data-act=new]'); await pg.evaluate("A['career-mode']({v:'classic'}); A['new-go']()"); await pg.waitForTimeout(300); await chooseStyle(pg);
  const run = "(function(n){ for (var r=0;r<n;r++){ var ci=S.cal[S.round]; var R=runRace2(S,ci,qualiGrid2(S,ci),{}); var fl=null; R.cars.forEach(function(f){ if(!f.dnf&&f.best<900&&(!fl||f.best<fl.best)) fl=f;}); R.fl={di:fl.di,t:fl.best}; finishRace(S,{ci:R.ci,c:R.c,fl:R.fl,cls:R.cls.map(function(f){return {car:{d:f.d,di:f.di,isP:f.isP,grid:f.grid,dnf:f.dnf},pos:f.pos,dnf:!!f.dnf};})},4);} })";
  await pg.evaluate("UI.screen='hub'; UI.tab='kereta'; render()"); await pg.waitForTimeout(200);
  console.log('faccard', await pg.evaluate("!!document.querySelector('.faccard')"), 'lobby btn', await pg.evaluate("!!document.querySelector('[data-act=fac-lobby]')"));
  await pg.screenshot({ path: 'e4c_team.png', fullPage: true });
  await pg.click('[data-act=fac-lobby]'); await pg.waitForTimeout(200);
  console.log('after lobby', await pg.evaluate("S.facLobby+' push='+S.teams[me().team].fac.push+' disabled='+!!document.querySelector('.faccard button[disabled]')"));
  assert.equal(await pg.evaluate('S.facLobby === S.season'), true);
  assert.equal(await pg.locator('.faccard button[disabled]').count(), 1);
  await pg.evaluate("A.tprof({v:'0'})"); await pg.waitForTimeout(300);
  await pg.screenshot({ path: 'e4c_prof.png', fullPage: true });
  const profile = (await pg.locator('#modal').innerText()).toLowerCase();
  assert.ok(profile.includes('facilities') && profile.includes('power'));
  console.log('prof has facilities', true);
  await pg.evaluate("closeModal()");
  /* paksa junior akademi ke team pemain supaya ujian muncul */
  await pg.evaluate("S.juniors.slice(0,2).forEach(function(j){ j.acad = me().team; })");
  await pg.evaluate(run + "(10)"); await pg.evaluate("S.contract=1; endSeason(S); save(); UI.screen='season'; render()"); await pg.waitForTimeout(300);
  console.log('test card', await pg.evaluate("document.body.innerText.indexOf('Young driver test')>=0"), JSON.stringify(await pg.evaluate("S.lastSummary.test")));
  await pg.screenshot({ path: 'e4c_season.png', fullPage: true });
  await signOffer(pg);
  console.log('new season', await pg.evaluate("S.season+' screen='+UI.screen+' fac='+S.teams[me().team].fac.lvl.toFixed(2)"));
  for (const t of ['musim','saya','kereta','kej','kal']) { await pg.evaluate("UI.screen='hub'; UI.tab='"+t+"'; render()"); await pg.waitForTimeout(100); }
  console.log('ERRS', JSON.stringify(errs)); await b.close();
})();
