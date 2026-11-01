const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const pg = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errs = []; pg.on('pageerror', e => errs.push(e.stack.split('\n').slice(0, 4).join('|')));
  await pg.goto(require('url').pathToFileURL(require('path').resolve(__dirname, '../index.html')).href); await pg.click('[data-act=new]'); await pg.evaluate("A['new-go']()"); await pg.waitForTimeout(300);
  const run = "(function(n){ for (var r=0;r<n;r++){ var ci=S.cal[S.round]; var R=runRace2(S,ci,qualiGrid2(S,ci),{}); var fl=null; R.cars.forEach(function(f){ if(!f.dnf&&f.best<900&&(!fl||f.best<fl.best)) fl=f;}); R.fl={di:fl.di,t:fl.best}; finishRace(S,{ci:R.ci,c:R.c,fl:R.fl,cls:R.cls.map(function(f){return {car:{d:f.d,di:f.di,isP:f.isP,grid:f.grid,dnf:f.dnf},pos:f.pos,dnf:!!f.dnf};})},4);} })";
  const scen = [['champion', "S.drivers[S.pi].pts=999"], ['podium-ish', "driverStandings(S)[1].pts>S.drivers[S.pi].pts && (S.drivers[S.pi].pts=driverStandings(S)[1].pts-1)"], ['back', "S.drivers[S.pi].pts=0"]];
  for (const [name, mod] of scen) {
    await pg.evaluate(run + "(9)"); await pg.evaluate("S.drivers[S.pi].obj = {ty:'pos', tgt:12, txt:'Finish P12 or better'}");
    await pg.evaluate("window.__pre = fnlPreText()"); const pre = await pg.evaluate("__pre");
    await pg.evaluate(run + "(1)"); await pg.evaluate(mod);
    const post = await pg.evaluate("fnlPostText({dnf:false,pos:5})");
    const rev = await pg.evaluate("(function(){ UI.screen='review'; render(); return document.querySelectorAll('.card').length })()");
    console.log(name, '\n PRE:', pre, '\n POST:', post, '\n review cards:', rev);
    await pg.evaluate("S.round=0; S.results=[]; S.teams.forEach(function(t){t.pts=0;t.wins=0}); S.drivers.forEach(function(d){d.pts=0;d.wins=0;d.pods=0})");
  }
  console.log('ERRS', JSON.stringify(errs)); await b.close();
})();
