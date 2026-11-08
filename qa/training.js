/* 6C only: persistent training, Mind, actual physics and save boundaries. */
const {chromium}=require('playwright');
const {assert}=require('./flow');
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
   check('10 Classic fixtures preserve stats, XP and progress without training/Mind',fixtures.every(g=>{const before=JSON.stringify([g.xp,g.season,g.round,g.cal,g.career,g.results,g.hist,g.drivers.map(d=>[d.age,...stats(d)])]);migrate(g);trainingPrepare(g);return before===JSON.stringify([g.xp,g.season,g.round,g.cal,g.career,g.results,g.hist,g.drivers.map(d=>[d.age,...stats(d)])])&&!g.drivers[g.pi].mind;}));
   S=newProCareer('Training','pace',7);let p=me();S.xp=100;p.training.slots=['technical','technical','technical'];
   const value=p.fb,bank=S.xp,cost1=skillCost(value,S,'fb'),cost2=skillCost(value+1,S,'fb');
   const prepared=trainingPrepare(S),once=JSON.stringify(S);trainingPrepare(S);qkInit(S,S.cal[0],0);makeRace2(S,S.cal[0],[S.pi],{});
   check('training buys real skills with existing XP once before qualifying/race',p.fb===value+2&&S.xp===bank-cost1-cost2&&prepared.spent===cost1+cost2&&JSON.stringify(S)===once);
   const loaded=migrate(JSON.parse(JSON.stringify(S))),before=JSON.stringify(loaded);trainingPrepare(loaded);
   check('plan, Focus and preparation receipt survive reload without reapplying',JSON.stringify(loaded)===before);
   p.training.slotSources={academy:true,ability:true,coach:true};p.training.qualitySources={coach:1,academy:2};
   check('all slot/quality sources combine within three slots and 15% quality',trainingSlots(p)===3&&trainingQuality(p)===1.15);
   const g=newProCareer('Fitness','cons',7),gp=g.drivers[g.pi];gp.training.slots=['fitness','fitness','fitness'];gp.training.slotSources={one:true,two:true};gp.training.intensity='hard';g.xp=0;const fit=gp.body.fitness;
   for(g.round=0;g.round<22;g.round++){trainingPrepare(g);trainingAfterRace(g,{pos:10,dnf:false,car:{team:7}});}
   check('Fitness improves body within shared annual cap, without XP/stat/age/wear grants',Math.abs(gp.body.fitness-fit-18)<.001&&g.xp===0&&gp.age===19&&gp.body.wear===0&&gp.training.year.fitness<=18.0001);
   gp.age=43;const annual=annualPreview(g),oldBody=JSON.parse(JSON.stringify(gp.body));applyAnnualChange(g);const yearlyOnce=JSON.stringify(g);applyAnnualChange(g);
   check('trained Fitness/care feed one previewed annual change without another training/XP grant',gp.age===44&&gp.body.fitness===annual.fitness&&gp.body.wear===annual.wear&&g.xp===0&&yearlyOnce===JSON.stringify(g)&&oldBody.fitness>70);
   const recover=newProCareer('Recovery','pace',7),rp=recover.drivers[recover.pi];rp.mind.fatigue=100;rp.training.slots=['recovery','recovery'];
   const fatigue=[];for(recover.round=0;recover.round<3;recover.round++){trainingPrepare(recover);trainingAfterRace(recover,{pos:10,dnf:false,car:{team:7}});fatigue.push(rp.mind.fatigue);}
   check('Recovery genuinely restores fatigue over weekends without a burnout lock',fatigue[0]<100&&fatigue[2]<fatigue[0]&&fatigue[2]<35,fatigue);
   const orderA=newProCareer('Order','pace',7),orderB=JSON.parse(JSON.stringify(orderA));orderA.drivers[19].training.slots=['recovery','fitness'];orderB.drivers[19].training.slots=['fitness','recovery'];trainingPrepare(orderA);trainingPrepare(orderB);
   check('reordering slots cannot exploit fatigue clamping',orderA.drivers[19].mind.fatigue===orderB.drivers[19].mind.fatigue);
   rp.training.mode='auto';rp.training.goal='wet';rp.training.intensity='hard';rp.mind.fatigue=80;const auto=effectiveTraining(rp);
   check('Auto respects target but switches to Recovery and lowers intensity under fatigue',auto.slots.every(k=>k==='recovery')&&auto.intensity==='light'&&rp.training.goal==='wet');
   const high=newProCareer('Focus','pace',7),low=JSON.parse(JSON.stringify(high));
   for(const [game,confidence,momentum,fatigue]of [[high,100,20,0],[low,0,-20,90]]){game.xp=0;const p=game.drivers[game.pi];p.training.slots=['technical','technical'];p.mind.confidence=confidence;p.mind.momentum=momentum;p.mind.fatigue=fatigue;trainingPrepare(game);}
   const hs=JSON.stringify(stats(high.drivers[19])),ls=JSON.stringify(stats(low.drivers[19]));
   seedRnd(606003);const hq=qkInit(high,high.cal[0],0);seedRnd(606003);const lq=qkInit(low,low.cal[0],0);
   seedRnd(606004);P2._q=null;const hr=makeRace2(high,high.cal[0],[high.pi],{weather:{type:'kering',start:999,end:999,int:0}});seedRnd(606004);P2._q=null;const lr=makeRace2(low,low.cal[0],[low.pi],{weather:{type:'kering',start:999,end:999,int:0}});
   const hf=hr.cars[0],lf=lr.cars[0];
   check('Focus changes actual qualifying base and race pace without changing stats/overall',hq.base[19].t<lq.base[19].t&&paceFree(hr,hf)<paceFree(lr,lf)&&hs===ls&&JSON.stringify(stats(high.drivers[19]))===hs&&baseOverall(high.drivers[19])===baseOverall(low.drivers[19]));
   const oldRnd=rnd,oldMech=P2.mechK;
   try{
    P2.mechK=0;
    for(const [R,f]of [[hr,hf],[lr,lf]]){R.wet=0;f.lap=2;f.push=2;f.atk=1;f.tyreTemp=.5;f.gA=99;let first=true;rnd=function(){if(first){first=false;return .001;}return .99;};incidents(R,[f]);}
    check('same incident draw causes low-Focus spin while high Focus stays clean',lr.nSpin===1&&hr.nSpin===0,{high:high.drivers[19].mind.focus,low:low.drivers[19].mind.focus});
   }finally{rnd=oldRnd;P2.mechK=oldMech;}
   const balanced=focusRisk({sc:0},{focus:15,push:1,atk:0}),pushed=focusRisk({sc:0},{focus:15,push:2,atk:0}),boosted=focusRisk({sc:0},{focus:15,push:1,atk:1});
   check('Tyre Push/Boost amplify Focus risk; modifiers stay bounded',pushed>balanced&&boosted>balanced&&focusRisk({sc:0},{focus:100,push:2,atk:1})>=TRAINING.riskMin);
   const xpA=newProCareer('XP','pace',7),xpB=JSON.parse(JSON.stringify(xpA));xpA.drivers[19].mind.focus=15;xpB.drivers[19].mind.focus=85;
   check('Mind does not alter XP rewards or costs for the same result',proRaceXP(xpA,{pos:5,dnf:false,car:{team:7}},0,false)===proRaceXP(xpB,{pos:5,dnf:false,car:{team:7}},0,false)&&skillCost(80,xpA,'pace')===skillCost(80,xpB,'pace'));
   const conf=high.drivers[19].mind.confidence,exp=high.drivers[19].mind.momentum;trainingAfterRace(high,{pos:20,dnf:true,car:{dnf:'Mechanical failure',team:7}});const settled=JSON.stringify(high);trainingAfterRace(high,{pos:20,dnf:true,car:{dnf:'Mechanical failure',team:7}});
   check('mechanical DNF does not blame Confidence; post-race Mind settles once',high.drivers[19].mind.confidence===conf&&high.drivers[19].mind.momentum===exp*.65&&settled===JSON.stringify(high));
   const oldLive=newProCareer('Old live','pace',7);delete oldLive.drivers[19].training;delete oldLive.drivers[19].mind;oldLive.live={r:0,ci:oldLive.cal[0]};const ox=oldLive.xp,os=JSON.stringify(stats(oldLive.drivers[19]));migrate(oldLive);trainingPrepare(oldLive);trainingAfterRace(oldLive,{pos:9,dnf:false,car:{team:7}});
   check('old live save gets neutral Focus without retroactive training or NaN Mind',oldLive.xp===ox&&JSON.stringify(stats(oldLive.drivers[19]))===os&&oldLive.drivers[19].mind.focus===50&&Number.isFinite(oldLive.drivers[19].mind.confidence));
   S=newProCareer('Real weekend','pace',7);S.xp=0;const report=simulateWeekend(S),mp=me().mind;
   check('actual Auto weekend prepares Focus, updates fatigue/Mind, and pays only existing XP sources',S.round===1&&mp.locked&&mp.settled==='1:f1:0'&&report.race.cars.find(f=>f.isP).focus===mp.locked.focus&&S.progression.earned.base===Math.floor(120/22)&&S.xp===report.result.xp);
   S=newProCareer('UI','pace',7);S.settings.tips=false;UI.screen='hub';UI.tab='aku';render();closeModal();
   return rows;
  },fixtures);
  await page.locator('[data-training=mode]').selectOption('auto');
  await page.locator('[data-training=goal]').selectOption('fitness');
  await page.locator('[data-training=intensity]').selectOption('light');
  const ui=await page.evaluate(()=>({plan:me().training,saved:loadSave().drivers[S.pi].training,width:document.documentElement.scrollWidth}));
  rows.push({name:'320px English training controls persist Auto target/intensity without overflow',pass:ui.plan.mode==='auto'&&ui.plan.goal==='fitness'&&ui.plan.intensity==='light'&&JSON.stringify(ui.plan)===JSON.stringify(ui.saved)&&ui.width<=320});
  await page.evaluate(()=>A['wk-start']());
  rows.push({name:'qualifying shows locked Focus and reasons before racing',pass:await page.evaluate(()=>document.body.textContent.includes('Weekend Focus')&&document.body.textContent.includes('Confidence')&&document.body.textContent.includes('XP spent')&&loadSave().drivers[S.pi].mind.locked.focus===me().mind.locked.focus)});
  rows.forEach(r=>console.log(r.pass?'PASS':'FAIL',r.name,!r.pass&&r.data?JSON.stringify(r.data):''));console.log('ERRS',JSON.stringify(errors));assert.equal(errors.length,0);assert.equal(rows.filter(r=>!r.pass).length,0);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
