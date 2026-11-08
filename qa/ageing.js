/* Focused 6B validation: annual boundaries, legacy saves and preview UI. */
const {chromium}=require('playwright');
const {assert,clickUI}=require('./flow');
const {pathToFileURL}=require('node:url');
const path=require('node:path'),fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch(),errors=[];
 try{
  const page=await browser.newPage({viewport:{width:320,height:568}});page.on('pageerror',e=>errors.push(e.message));await page.clock.install();
  await page.goto(pathToFileURL(path.resolve(__dirname,'../index.html')).href);
  const dir=path.resolve(__dirname,'../../outputs/baseline/saves');
  const fixtures=fs.readdirSync(dir).filter(f=>f.endsWith('.json')&&f!=='manifest.json').map(f=>JSON.parse(fs.readFileSync(path.join(dir,f),'utf8')));
  const rows=await page.evaluate(fixtures=>{
   const rows=[],check=(name,pass,data)=>rows.push({name,pass:!!pass,data});
   const stats=p=>PROGRESSION.stats.map(k=>p[k]);
   const legacy=g=>JSON.stringify([g.season,g.round,g.cal,g.xp,g.career,g.results,g.hist,g.drivers.map(d=>[d.age,...stats(d)])]);
   check('10 legacy saves preserve ages, six stats, XP and records without Pro wear',fixtures.every(g=>{const before=legacy(g);migrate(g);return legacy(g)===before&&!g.drivers[g.pi].body;}));
   S=newProCareer('Veteran','pace',7);let p=me();p.age=38;p.pace=95;p.body.fitness=55;p.body.wear=6;
   const before=JSON.stringify(S),seed=_s,v=annualPreview(S);annualPreview(S);
   check('preview is pure and deterministic: no age, stat, XP, RNG or wear changes',before===JSON.stringify(S)&&seed===_s&&JSON.stringify(v)===JSON.stringify(annualPreview(S)));
   const good=JSON.parse(before),poor=JSON.parse(before);good.drivers[good.pi].body.fitness=95;good.drivers[good.pi].body.care=1;poor.drivers[poor.pi].body.fitness=25;poor.drivers[poor.pi].body.care=0;
   const a=annualPreview(good),b=annualPreview(poor),badResults=JSON.parse(before);badResults.morale=0;badResults.career.dnf=100;badResults.tier='prospect';
   check('Fitness/care reduce wear; morale, results and tier do not alter ageing',a.rate<b.rate&&a.fitness>b.fitness&&JSON.stringify(v)===JSON.stringify(annualPreview(badResults)));
   p.pace=99;p.capBreakers={pace:0};p.body.wear=15;const overlap=annualPreview(S);
   check('wear and over-cap adjustment use max, never sum, with gradual cap settling',overlap.rows.every(r=>r.loss===Math.min(r.before-40,Math.max(r.wearLoss,r.capLoss))&&r.capLoss<=1)&&overlap.rows[0].after>overlap.rows[0].capAfter);
   const current=p.pace;statCap(S,'pace');
   check('reading a lowered cap never truncates an above-cap stat',p.pace===current);
   S=newProCareer('Old Pro','cons',7);p=me();p.age=43;p.cons=98;delete p.body;
   const old=JSON.stringify([p.age,stats(p),S.xp]);migrate(S);const init=JSON.stringify(p.body);migrate(S);
   check('existing Pro save initializes neutral body once without retrospective penalties',old===JSON.stringify([p.age,stats(p),S.xp])&&init===JSON.stringify(p.body)&&p.body.wear===0&&p.body.appliedSeason===S.season);
   S=newProCareer('Annual Integration','wet',7);p=me();p.age=38;p.body.fitness=40;p.body.wear=9;S.round=22;endSeason(S);
   const forecast=annualPreview(S),xp=S.xp;startNewSeason(S,null,null);
   check('real season transition matches preview exactly and retains XP',p.age===forecast.age&&p.body.fitness===forecast.fitness&&p.body.wear===forecast.wear&&forecast.rows.every(r=>p[r.k]===r.after)&&S.xp===xp&&S.season===2,{age:p.age,season:S.season,round:S.round,actual:stats(p),forecast,body:p.body,retired:S.playerRetired,xp:S.xp,expectedXP:xp});
   const once=JSON.stringify(S),again=startNewSeason(S,null,null);
   check('repeated transition cannot advance age, world or wear twice',again===false&&once===JSON.stringify(S));
   save();const reloaded=migrate(JSON.parse(JSON.stringify(S)));
   check('annual receipt, fractions and forecast survive reload without reapplying',JSON.stringify(reloaded.drivers[reloaded.pi].body)===JSON.stringify(p.body)&&reloaded.drivers[reloaded.pi].age===39);
   S=newProCareer('Reserve Integration','cons',7);p=me();p.age=37;S.round=22;endSeason(S);startNewSeason(S,7,1,null,{sit:true});
   const reserve=S.bench;
   check('reserve entry ages real player exactly once',reserve===p&&p.age===38&&p.body.appliedSeason===2&&S.drivers[S.pi]!==p,{age:p.age,benchAge:S.bench&&S.bench.age,season:S.season,round:S.round});
   S.round=22;endSeason(S);const afterReserve=annualPreview(S);startNewSeason(S,7,1);
   check('reserve return applies one annual change with previewed net stats',me()===p&&p.age===39&&afterReserve.rows.every(r=>p[r.k]===r.after));
   S=newProCareer('Last Seasons','race',7);p=me();p.age=42;S.round=22;
   check('42-year-old Pro can still receive racing offers',makeOffers(S,8,{renew:true},true).some(o=>!o.sit));
   p.age=43;const offers=makeOffers(S,8,{renew:true},true);
   check('contracts/options and reserve cannot promise racing at 45',offers.length>0&&offers.every(o=>o.years===1&&!o.opt&&!o.sit));
   endSeason(S);startNewSeason(S,7,3);const lastAge=p.age,lastContract=S.contract;S.round=22;endSeason(S);
   check('age 44 remains playable with one season maximum and no age-45 offers',lastAge===44&&lastContract===1&&S.offers.every(o=>!o.years),{lastAge,lastContract,age:p.age,season:S.season,offers:S.offers});
   const season=S.season;const blocked=startNewSeason(S,null,null);const retiredStats=JSON.stringify(stats(p));
   const blockedAgain=startNewSeason(S,null,null);let raceBlocked=false;try{simulateWeekend(S);}catch(e){raceBlocked=/retired/.test(e.message);}
   check('entering 45 retires before a new season and blocks repeat/race bypasses',blocked===false&&blockedAgain===false&&p.age===45&&S.playerRetired&&S.season===season&&Array.isArray(S.retired)&&retiredStats===JSON.stringify(stats(p))&&raceBlocked);
   S=newProCareer('Junior Transfer','pace',7,'f2');p=me();p.age=22;p.body.wear=2;S.round=8;
   const transfer=annualPreview(S);jrPromote({t:'7',y:'2',p:'1'});closeModal();
   check('junior promotion carries body and applies one year before F1',me().age===23&&S.season===2&&me().body.wear===transfer.wear&&me().body.appliedSeason===2&&transfer.rows.every(r=>me()[r.k]===r.after),{age:me().age,body:me().body,season:S.season,transfer});
   const years=[];S=newProCareer('Wear Curve','pace',7);p=me();p.age=29;PROGRESSION.stats.forEach(k=>p[k]=p.growthCaps[k]);
   for(let age=30;age<=44;age++){const f=applyAnnualChange(S);years.push({age:p.age,fitness:p.body.fitness,wear:p.body.wear,pace:p.pace,overall:+baseOverall(p).toFixed(2)});S.season++;}
   check('30–44 curve stays gradual, preserves craft, and never breaches stat limits',years.every((r,i)=>r.age===30+i&&r.fitness>=0&&r.wear>=0&&(i===0||years[i-1].pace-r.pace<=3))&&p.race>p.pace&&stats(p).every(n=>n>=40&&n<=99),years);
   S=newProCareer('Preview UI','pace',7);p=me();p.age=38;p.body.wear=5;S.round=22;endSeason(S);S.settings.tips=false;UI.screen='season';render();closeModal();
   const markup=annualPreviewHTML();check('38+ review offers voluntary retirement and English annual preview',markup.includes('You can retire now')&&markup.includes('Next-season preview')&&markup.includes('Net'));
   return rows;
  },fixtures);
  const initial=await page.evaluate(()=>({age:me().age,wear:me().body.wear,xp:S.xp,pace:me().pace}));
  await page.evaluate(()=>{UI.tab='aku';UI.screen='hub';S.xp=100;render();});
  await clickUI(page,'[data-act=buy][data-k=pace]',true);
  await page.evaluate(()=>{UI.screen='season';render();});
  rows.push({name:'320px preview refreshes after a real stat purchase without advancing time',pass:await page.evaluate(initial=>annualPreview(S).rows[0].before===initial.pace+1&&me().age===initial.age&&me().body.wear===initial.wear&&document.querySelector('#annual-preview')&&document.documentElement.scrollWidth<=320,initial)});
  rows.forEach(r=>console.log(r.pass?'PASS':'FAIL',r.name,!r.pass&&r.data?JSON.stringify(r.data):''));console.log('ERRS',JSON.stringify(errors));
  assert.equal(errors.length,0);assert.equal(rows.filter(r=>!r.pass).length,0);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
