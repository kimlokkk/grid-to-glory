const { chromium } = require('playwright');
const { assert, chooseStyle, signOffer } = require('./flow');
(async () => {
  const b = await chromium.launch(); const pg = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errs = []; pg.on('pageerror', e => errs.push(e.stack.split('\n').slice(0, 4).join('|'))); pg.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  await pg.goto(require('url').pathToFileURL(require('path').resolve(__dirname, '../index.html')).href); await pg.click('[data-act=new]'); await pg.evaluate("A['new-go']()"); await pg.waitForTimeout(300); await chooseStyle(pg);
  const run = "(function(n){ for (var r=0;r<n;r++){ var ci=S.cal[S.round]; var R=runRace2(S,ci,qualiGrid2(S,ci),{}); var fl=null; R.cars.forEach(function(f){ if(!f.dnf&&f.best<900&&(!fl||f.best<fl.best)) fl=f;}); R.fl={di:fl.di,t:fl.best}; finishRace(S,{ci:R.ci,c:R.c,fl:R.fl,cls:R.cls.map(function(f){return {car:{d:f.d,di:f.di,isP:f.isP,grid:f.grid,dnf:f.dnf},pos:f.pos,dnf:!!f.dnf};})},4);} })";
  await pg.evaluate(run + "(10)"); await pg.evaluate("S.contract=1; endSeason(S); save()");
  console.log('records', await pg.evaluate("Object.keys(S.th).length+' circuits, '+S.th[S.cal[0]].length+' rec, sample '+JSON.stringify(S.th[S.cal[0]][0])"));
  assert.equal(await pg.evaluate('Object.keys(S.th).length'), 10);
  await pg.evaluate("UI.screen='season'; render()"); await signOffer(pg);
  /* tahun simpanan tidak tambah rekod pemain */
  await pg.evaluate(run + "(10)"); await pg.evaluate("S.contract=1; endSeason(S); save()");
  await pg.evaluate("UI.screen='hub'; UI.tab='kal'; render()"); await pg.waitForTimeout(200);
  await pg.click('.krow.clk'); await pg.waitForTimeout(400);
  console.log('modal', await pg.evaluate("document.querySelector('#modal').innerText.replace(/\\n+/g,' | ').slice(0,300)"));
  assert.ok((await pg.locator('#modal').innerText()).toLowerCase().includes('circuit history'));
  await pg.screenshot({ path: 'th_modal.png' });
  await pg.evaluate("closeModal()");
  await pg.evaluate("UI.screen='hub'; UI.tab='utama'; render()");
  console.log('strip', await pg.evaluate("typeof thStrip==='function' && thStrip(0).indexOf('Circuit history')>=0"));
  /* sit */
  await pg.evaluate("S.round=0; S.results=[]; S.cal=[0,1,2,3,4,5,6,7,8,9]; S.th[0]=[]; startNewSeason(S, S.drivers[S.pi].team, 1, null, {sit:true})");
  await pg.evaluate("sitRace(S)"); console.log('sit rec', await pg.evaluate("JSON.stringify(S.th[S.cal[0]].slice(-1)[0].me)"));
  assert.equal(await pg.evaluate('S.th[S.cal[0]].slice(-1)[0].me'), null, 'reserve races do not become player results');
  console.log('ERRS', JSON.stringify(errs)); await b.close();
})();
