const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const pg = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto(require('url').pathToFileURL(require('path').resolve(__dirname, '../index.html')).href); await pg.click('[data-act=new]'); await pg.evaluate("A['new-go']()"); await pg.waitForTimeout(300);
  const run = "(function(n){ for (var r=0;r<n;r++){ var ci=S.cal[S.round]; var R=runRace2(S,ci,qualiGrid2(S,ci),{}); var fl=null; R.cars.forEach(function(f){ if(!f.dnf&&f.best<900&&(!fl||f.best<fl.best)) fl=f;}); R.fl={di:fl.di,t:fl.best}; finishRace(S,{ci:R.ci,c:R.c,fl:R.fl,cls:R.cls.map(function(f){return {car:{d:f.d,di:f.di,isP:f.isP,grid:f.grid,dnf:f.dnf},pos:f.pos,dnf:!!f.dnf};})},4);} })";
  await pg.evaluate(run + "(9)");
  for (const k of ['lead', 'chase', 'mid']) {
    await pg.evaluate("(function(){ var d=S.drivers[S.pi], ds=driverStandings(S); var top=ds[0]; if(top===d) top=ds[1]; var k='" + k + "'; if(k==='lead') d.pts=top.pts+10; else if(k==='chase') d.pts=top.pts-12; else d.pts=Math.round(top.pts/2); })()");
    console.log(k, '->', await pg.evaluate("fnlPreText()"));
  }
  console.log('final?', await pg.evaluate("fnlFinal()"), 'ERRS', JSON.stringify(errs)); await b.close();
})();
