/* Muat save lama: buang medan baru dari save, muat semula, render semua tab, jalan satu musim. Guna: node oldsave.js [level 1|2] */
const { chromium } = require('playwright');
(async () => {
  const level = Number(process.argv[2] || 1);
  const b = await chromium.launch(); const pg = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errs = []; pg.on('pageerror', e => errs.push(e.stack.split('\n').slice(0, 4).join('|')));
  await pg.goto(require('url').pathToFileURL(require('path').resolve(__dirname, '../index.html')).href); await pg.click('[data-act=new]'); await pg.evaluate("A['career-mode']({v:'classic'}); A['new-go']()"); await pg.waitForTimeout(300);
  const run = "(function(n){ for (var r=0;r<n;r++){ var ci=S.cal[S.round]; var R=runRace2(S,ci,qualiGrid2(S,ci),{}); var fl=null; R.cars.forEach(function(f){ if(!f.dnf&&f.best<900&&(!fl||f.best<fl.best)) fl=f;}); R.fl={di:fl.di,t:fl.best}; finishRace(S,{ci:R.ci,c:R.c,fl:R.fl,cls:R.cls.map(function(f){return {car:{d:f.d,di:f.di,isP:f.isP,grid:f.grid,dnf:f.dnf},pos:f.pos,dnf:!!f.dnf};})},4);} })";
  await pg.evaluate(run + "(10)"); await pg.evaluate("endSeason(S); startNewSeason(S, null, null)"); await pg.evaluate(run + "(3)");
  /* kupas medan baru ikut tahap */
  const strip = level === 1
    ? "delete S.rep; delete S.fame; delete S.spons; delete S.sponOffers; delete S.paddock; delete S.pbuy; S.drivers.forEach(function(d){ if(d.con){ delete d.con.wb; delete d.con.opt; } }); S.teams.forEach(function(t){ delete t.plan; });"
    : "delete S.rep; delete S.fame; delete S.spons; delete S.sponOffers; delete S.paddock; delete S.pbuy; delete S.mkt; delete S.fired; S.drivers.forEach(function(d){ delete d.con; delete d.obj; delete d.miss; delete d.sk; delete d.hy; }); S.teams.forEach(function(t){ delete t.plan; delete t.fin; if(t.dev){ delete t.dev.tdp; delete t.dev.acad; if(t.dev.tp) delete t.dev.tp.con; } }); (S.juniors||[]).forEach(function(j){ delete j.acad; delete j.hy; });";
  await pg.evaluate(strip + " save()");
  await pg.reload(); await pg.waitForTimeout(500);
  await pg.click('[data-act=continue]'); await pg.waitForTimeout(400);
  console.log('loaded', await pg.evaluate("UI.screen+' S'+S.season+' round '+S.round"));
  for (const t of ['musim', 'kal', 'kej', 'kereta', 'saya']) { await pg.evaluate("UI.screen='hub'; UI.tab='" + t + "'; render()"); await pg.waitForTimeout(150); }
  await pg.evaluate("A.prof({v:'d:19'})"); await pg.waitForTimeout(200); await pg.evaluate("closeModal()");
  await pg.evaluate("A.prof({v:'t:' + me().team})"); await pg.waitForTimeout(200); await pg.evaluate("closeModal()");
  const info = await pg.evaluate("JSON.stringify({con:!!me().con, obj:!!me().obj, fin:!!myTeam().fin, tdp:!!(myTeam().dev&&myTeam().dev.tdp)})"); console.log('state', info);
  await pg.evaluate(run + "(7)");
  const res = await pg.evaluate("(function(){ try { endSeason(S); var o=S.offers?S.offers.length:0; startNewSeason(S, S.offers?S.offers[0].team:null, S.offers?S.offers[0].years:null); var ok=S.drivers.every(function(d,i){return d.id===i}), c2=S.teams.every(function(t){return S.drivers.filter(function(d){return d.team===t.id}).length===2}); return 'ok offers='+o+' ids='+ok+' two='+c2+' S'+S.season+' fame='+Math.round(S.fame||0); } catch(e){ return 'ERR '+e.stack.split('\\n').slice(0,3).join('|'); } })()");
  console.log(res);
  await pg.evaluate(run + "(10)"); console.log('season2', await pg.evaluate("(function(){ try { endSeason(S); startNewSeason(S, S.offers?S.offers[0].team:null, S.offers?S.offers[0].years:null); return 'ok S'+S.season } catch(e){ return 'ERR '+e.stack.split('\\n').slice(0,3).join('|') } })()"));
  for (const t of ['musim', 'saya', 'kereta']) { await pg.evaluate("UI.screen='hub'; UI.tab='" + t + "'; render()"); await pg.waitForTimeout(150); }
  console.log('ERRS', JSON.stringify(errs)); await b.close();
})();
