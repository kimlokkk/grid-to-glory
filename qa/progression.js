/* Focused 6A checks: no unrelated regression suite. */
const {chromium}=require('playwright');
const {assert,clickUI}=require('./flow');
const {pathToFileURL}=require('node:url');
const path=require('node:path'),fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch(),errors=[];
 try{
  const page=await browser.newPage({viewport:{width:320,height:568}});
  page.on('pageerror',e=>errors.push(e.message));await page.clock.install();
  await page.goto(pathToFileURL(path.resolve(__dirname,'../index.html')).href);
  const fixtures=fs.readdirSync(path.resolve(__dirname,'../../outputs/baseline/saves')).filter(f=>f.endsWith('.json')&&f!=='manifest.json').map(f=>JSON.parse(fs.readFileSync(path.resolve(__dirname,'../../outputs/baseline/saves',f),'utf8')));
  const rows=await page.evaluate(fixtures=>{
   const rows=[],check=(name,pass,data)=>rows.push({name,pass:!!pass,data});
   const snapshot=g=>JSON.stringify({xp:g.xp,season:g.season,round:g.round,cal:g.cal,career:g.career,results:g.results,hist:g.hist,stats:g.drivers.map(d=>[d.pace,d.cons,d.race,d.wet,d.tyre,d.fb])});
   check('all legacy fixtures preserve XP, six stats, progress and records',fixtures.every(g=>{const before=snapshot(g);migrate(g);return before===snapshot(g)&&g.mode==='classic';}));
   const d={pace:60,cons:70,race:80,wet:90,tyre:50,fb:99};
   check('overall uses all six stats; display rounds consistently',rating(d)===449/6&&ovr(d)===75&&baseOverall({...d,focus:0,fatigue:100})===rating(d));
   S=newProCareer('Growth Test','pace',7);const p=me();
   check('six stats are purchasable; invalid keys and unaffordable buys cannot mutate save',PROGRESSION.stats.every(k=>{S.xp=100;const old=p[k],cost=skillCost(old,S,k);return buySkill(S,k)&&p[k]===old+1&&S.xp===100-cost;})&&(()=>{S.xp=0;const old=JSON.stringify(S);return !buySkill(S,'pace')&&!buySkill(S,'age')&&!buySkill(S,'__proto__')&&old===JSON.stringify(S);})());
   p.wet=statCap(S,'wet')-1;S.xp=100;
   const lowCost=skillCost(66,S,'wet'),nearCost=skillCost(p.wet,S,'wet');
   check('cost rises near cap; final point allowed, next point blocked',nearCost>lowCost&&buySkill(S,'wet')&&!buySkill(S,'wet'));
   p.capBreakers={pace:100,wet:5};
   check('Cap Breaker foundation is limited to +5 and absolute 99',statCap(S,'pace')===99&&statCap(S,'wet')===93);
   delete p.capBreakers;
   p.wet=97;delete p.growthCaps;delete S.progression;S.round=11;
   const oldXP=S.xp;migrate(S);const migrated=JSON.stringify(S.progression);migrate(S);
   check('old Pro above-cap stat retained; migration does not grant XP or reset receipts',p.wet===97&&statCap(S,'wet')===97&&S.xp===oldXP&&migrated===JSON.stringify(S.progression));
   let budgets=true;
   for(const league of ['f3','f2','f1']){
    const g=newProCareer('Budget','pace',7,league);let total=0;
    for(g.round=0;g.round<g.cal.length;g.round++){
     total+=progressionXP(g,'base',PROGRESSION.annual[league]/g.cal.length);
     budgets=budgets&&progressionXP(g,'base',1000)===0;
     for(const source of Object.keys(PROGRESSION.bonuses))progressionXP(g,source,999);
    }
    budgets=budgets&&total===PROGRESSION.annual[league]&&Object.entries(PROGRESSION.bonuses).every(([k,v])=>g.progression.earned[k]===v);
    const reloaded=migrate(JSON.parse(JSON.stringify(g)));budgets=budgets&&JSON.stringify(reloaded.progression)===JSON.stringify(g.progression);
    g.season++;g.round=0;const bank=g.xp;progressionInit(g);const fresh=progressionXP(g,'base',PROGRESSION.annual[league]/g.cal.length);
    budgets=budgets&&fresh===Math.floor(PROGRESSION.annual[league]/g.cal.length)&&g.xp===bank&&progressionXP(g,'base',999)===0;
   }
   check('8/22 rounds pay exact annual base; all bonus sources capped and reload-safe',budgets);
   check('neutral Auto mini-game defaults earn no manual skill bonus',proManualBonus({q:.5,s:.5,pn:[],bq:[]})===0&&proManualBonus({q:1,s:1,pn:[1],bq:[1]})===8);
   const a=newProCareer('Auto','pace',7),b=JSON.parse(JSON.stringify(a));
   let ax=0,bx=0;
   for(let r=0;r<22;r++){a.round=b.round=r;ax+=proRaceXP(a,{car:{team:7},dnf:true,pos:20},0,false);bx+=proRaceXP(b,{car:{team:7},dnf:true,pos:20},8,false);}
   check('Auto and Manual earn equal base, DNF retains base, manual advantage <=6',a.progression.earned.base===120&&b.progression.earned.base===120&&ax===120&&bx-ax===6);
   S=newProCareer('Garage','cons',7);tmInit(S).rel=10;const xp=S.xp;tmRace(S);tmInit(S).rel=-10;tmRace(S);
   check('garage mood cannot add or remove Pro XP',S.xp===xp);
   const paths=[];
   for(const arch of Object.keys(ARCHS))for(const [name,factor]of [['prodigy',1],['steady',.4],['late',0]]){
    const g=newProCareer('Path',arch,7,'f3'),p=g.drivers[g.pi];p.age=16;let hit=null,spent=0;
    for(let y=0;y<8;y++){
     g.season=y+1;g.league=y===0?'f3':y===1?'f2':'f1';g.cal=seasonCalendar(g);p.age=16+y;
     for(g.round=0;g.round<g.cal.length;g.round++){
      g.xp+=progressionXP(g,'base',PROGRESSION.annual[g.league]/g.cal.length)+progressionXP(g,'performance',factor*60/g.cal.length)+progressionXP(g,'objectives',factor*2);
      let choices;
      while((choices=PROGRESSION.stats.filter(k=>p[k]<statCap(g,k)&&skillCost(p[k],g,k)<=g.xp).sort((a,b)=>p[a]-p[b]||skillCost(p[a],g,a)-skillCost(p[b],g,b))).length){const before=g.xp;buySkill(g,choices[0]);spent+=before-g.xp;}
      if(hit===null&&baseOverall(p)>=90)hit=p.age;
     }
    }
    paths.push({arch,path:name,age90:hit,overall:+baseOverall(p).toFixed(2),spent});
   }
   check('all archetypes have a funded 90-overall path by 23 without Cap Breaker/manual/legacy',paths.filter(p=>p.path==='prodigy').every(p=>p.age90!==null&&p.age90<=23),paths);
   check('development is not guaranteed by age; lower rewards create slower paths',paths.filter(p=>p.path==='late').every(p=>p.age90===null));
   S=newProCareer('Race Integration','pace',7);let awarded=0;
   for(let r=0;r<22;r++)awarded+=simulateWeekend(S).result.xp;
   check('real 22-race engine pays annual base exactly, saves and loads correctly',S.progression.earned.base===120&&S.round===22&&S.rr.length===22&&awarded===S.progression.earned.base+(S.progression.earned.performance||0)&&JSON.stringify(migrate(JSON.parse(JSON.stringify(S))).progression)===JSON.stringify(S.progression));
   S=newProCareer('UI Test','race',7);S.settings.tips=false;S.xp=100;UI.screen='hub';UI.tab='aku';render();closeModal();
   return rows;
  },fixtures);
  const before=await page.evaluate(()=>({v:me().pace,xp:S.xp,cost:skillCost(me().pace,S,'pace')}));
  await clickUI(page,'[data-act=buy][data-k=pace]',true);
  rows.push({name:'320px Driver UI buys real stat, shows six caps, and fits screen',pass:await page.evaluate(before=>me().pace===before.v+1&&S.xp===before.xp-before.cost&&loadSave().xp===S.xp&&document.querySelectorAll('.skill').length===6&&document.querySelector('.skill').textContent.includes('/95')&&document.documentElement.scrollWidth<=320,before)});
  rows.forEach(r=>console.log(r.pass?'PASS':'FAIL',r.name,r.data?JSON.stringify(r.data):''));
  console.log('ERRS',JSON.stringify(errors));assert.equal(errors.length,0);assert.equal(rows.filter(r=>!r.pass).length,0);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
