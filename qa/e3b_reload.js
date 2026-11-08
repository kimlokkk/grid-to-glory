const { chromium } = require('playwright');
const { assert, chooseStyle, signOffer } = require('./flow');
(async () => {
  const b = await chromium.launch(); const pg = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto(require('url').pathToFileURL(require('path').resolve(__dirname, '../index.html')).href); await pg.click('[data-act=new]'); await pg.evaluate("A['new-go']()"); await pg.waitForTimeout(300); await chooseStyle(pg);
  const run = "(function(n){ for (var r=0;r<n;r++){ var ci=S.cal[S.round]; var R=runRace2(S,ci,qualiGrid2(S,ci),{}); var fl=null; R.cars.forEach(function(f){ if(!f.dnf&&f.best<900&&(!fl||f.best<fl.best)) fl=f;}); R.fl={di:fl.di,t:fl.best}; finishRace(S,{ci:R.ci,c:R.c,fl:R.fl,cls:R.cls.map(function(f){return {car:{d:f.d,di:f.di,isP:f.isP,grid:f.grid,dnf:f.dnf},pos:f.pos,dnf:!!f.dnf};})},4);} })";
  await pg.evaluate(run + "(10)"); await pg.evaluate("S.contract=1; endSeason(S); save(); UI.screen='season'; render()"); await pg.waitForTimeout(200);
  await signOffer(pg, true); await pg.click('[data-act=sit-next]'); await pg.waitForTimeout(200); await pg.click('.bnav [data-act=tab][data-v=aku]'); await pg.click('[data-act=sit-focus][data-k=tyre]');
  await pg.reload(); await pg.waitForTimeout(500); await pg.click('[data-act=continue]'); await pg.waitForTimeout(400);
  console.log(await pg.evaluate("UI.screen+' sit='+!!S.sit+' bench='+(S.bench&&S.bench.name)+' round='+S.round+' focus='+(S.sit&&S.sit.focus)+' vSit='+!!document.querySelector('[data-act=sit-next]')"));
  assert.deepEqual(await pg.evaluate("({sit:!!S.sit,round:S.round,focus:S.sit&&S.sit.focus,bench:!!S.bench})"), {sit:true,round:1,focus:'tyre',bench:true});
  await pg.click('.htop [data-act=menu]'); assert.equal(await pg.evaluate('UI.screen'), 'menu'); await pg.waitForTimeout(200);
  console.log('ERRS', JSON.stringify(errs)); await b.close();
})();
