const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const pg = await b.newPage();
  await pg.goto(require('url').pathToFileURL(require('path').resolve(__dirname, '../index.html')).href); await pg.click('[data-act=new]'); await pg.evaluate("A['new-go']()"); await pg.waitForTimeout(300);
  const run = "(function(n){ for (var r=0;r<n;r++){ var ci=S.cal[S.round]; var R=runRace2(S,ci,qualiGrid2(S,ci),{}); var fl=null; R.cars.forEach(function(f){ if(!f.dnf&&f.best<900&&(!fl||f.best<fl.best)) fl=f;}); R.fl={di:fl.di,t:fl.best}; finishRace(S,{ci:R.ci,c:R.c,fl:R.fl,cls:R.cls.map(function(f){return {car:{d:f.d,di:f.di,isP:f.isP,grid:f.grid,dnf:f.dnf},pos:f.pos,dnf:!!f.dnf};})},4);} })";
  await pg.evaluate("S.drivers[S.pi].pace=99;S.drivers[S.pi].race=99");
  await pg.evaluate(run + "(10)");
  console.log(await pg.evaluate("(function(){ var bad=0; S.results.forEach(function(r){ var h=S.th[r.ci].filter(function(x){return x.s===S.season})[0]; var p=r.dnf?0:r.pos; if(!h||!h.me||h.me.p!==p) bad++; }); return 'mismatch '+bad+' of '+S.results.length; })()"));
  await b.close();
})();
