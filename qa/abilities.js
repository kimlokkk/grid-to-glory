/* 6E only: unlocks, priority/loadout locks, mastery, bounded effects and old saves. */
const {chromium}=require('playwright');
const {assert,clickUI}=require('./flow');
const {pathToFileURL}=require('node:url');
const path=require('node:path'),fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch(),errors=[];
 try{
  const page=await browser.newPage({viewport:{width:320,height:568}});page.on('pageerror',e=>errors.push(e.message));await page.clock.install();await page.goto(pathToFileURL(path.resolve(__dirname,'../index.html')).href);
  const dir=path.resolve(__dirname,'../../outputs/baseline/saves');
  const fixtures=fs.readdirSync(dir).filter(f=>f.endsWith('.json')&&f!=='manifest.json').map(f=>JSON.parse(fs.readFileSync(path.join(dir,f),'utf8')));
  const rows=await page.evaluate(fixtures=>{
   const rows=[],check=(name,pass,data)=>rows.push({name,pass:!!pass,data});
   const facts=g=>JSON.stringify([g.xp,g.season,g.round,g.cal,g.career,g.results,g.hist,g.drivers.map(d=>[d.age,...PROGRESSION.stats.map(k=>d[k])])]);
   function fresh(arch='pace',league='f1'){seedRnd(606008);S=newProCareer('Ability',arch,7,league);return me();}
   function race(pos=5){const p=me();return {ci:S.cal[S.round],wetRace:true,cls:[{pos,dnf:pos===0,car:{isP:true,grid:1,evalSpins:0,pen:0}}]};}
   check('ten Classic fixtures preserve career/stats/XP and gain no ability powers',fixtures.every(g=>{const before=facts(g);migrate(g);return before===facts(g)&&!g.drivers[g.pi].abilities;}));
   check('five archetypes each start with exactly one matching ability and viable six-stat caps',Object.keys(ARCHS).length===5&&Object.keys(ARCHS).every(arch=>{const p=fresh(arch);return p.abilities.owned.length===1&&p.abilities.owned[0]===ABILITY_RULES.starter[arch]&&Object.values(p.growthCaps).reduce((a,b)=>a+b,0)>=540;}));
   let p=fresh('cons','f2');for(S.round=0;S.round<8;S.round++)abilityRace(S,race(1));
   check('junior achievements build visits but do not unlock F1 milestone abilities',p.abilities.owned.length===1&&Object.keys(p.abilities.mastery).length===8);
   p=fresh('pace');for(S.round=0;S.round<15;S.round++)abilityRace(S,race(5));const old=JSON.stringify(p.abilities);S.round--;abilityRace(S,race(1));
   check('real milestone counters unlock permanent abilities once without auto-equipping',['racer','raincraft','strategist','technical','composure','tyrecraft'].every(id=>p.abilities.owned.includes(id))&&p.abilities.priority.join()=== 'qualifier'&&JSON.stringify(p.abilities)===old);
   check('mastery thresholds are exactly 1/3/5/8/12 visits and stop at level five',[0,1,2,3,5,8,12,100].map(masteryLevel).join('|')==='0|1|1|2|3|4|5|5');
   p=fresh();p.evaluation.tier=3;p.abilities.owned=Object.keys(ABILITIES);p.abilities.priority=['legend','qualifier','racer','strategist','composure','tyrecraft','raincraft','technical'];abilityLock(S);
   check('Legend ability uses a normal slot; duplicates cannot create a fifth effect',activeAbilityIds(S).length===4&&activeAbilityIds(S).includes('legend')&&abilityPriority(S,'raincraft','toggle')===false);
   const priority=p.abilities.priority.join(),owned=p.abilities.owned.join();p.evaluation.tier=2;
   check('tier loss follows saved priorities, preserves ownership and disables Legend effect',selectedAbilities(p).join()==='qualifier,racer,strategist'&&p.abilities.priority.join()===priority&&p.abilities.owned.join()===owned&&abilityEffects(S,0).q===0.10);
   p.abilities.locked=null;p.evaluation.tier=3;GTG_TRACKS.slice(0,12).forEach(t=>p.abilities.mastery[t[1]]=12);const parts=abilityCapParts(S,'wet');p.wet=statCap(S,'wet');const before=p.wet,xp=S.xp;p.evaluation.tier=2;const reduced=statCap(S,'wet'),forecast=annualPreview(S);
   check('mastery +3 and Legend +2 combine at +5/99; losing Legend keeps mastery and settles gradually',parts.mastery===3&&parts.legend===2&&parts.total===5&&statCap(S,'pace')<=99&&abilityCapParts(S,'wet').mastery===3&&reduced===before-2&&p.wet===before&&forecast.rows.find(r=>r.k==='wet').after===before-1&&S.xp===xp);
   p.capBreakers={wet:100};check('existing numeric Cap Breakers cannot stack past +5',abilityCapParts(S,'wet').total===5);
   p.evaluation.tier=3;p.abilities.locked={season:S.season,league:'f1',ids:Object.keys(ABILITIES).concat(Object.keys(ABILITIES))};const b=abilityEffects(S,0);
   check('Focus + abilities + mastery share final pace/risk/tyre limits',Math.abs(combinedPace(85,b,true,1))<=.30&&Math.abs(combinedPace(15,b,false,1))<=.30&&combinedRisk({sc:0},{focus:85,push:2,atk:1,ability:b})>=.60&&combinedRisk({sc:0},{focus:0,push:2,atk:1,ability:b})<=1.65&&b.tyre>=.90);
   p=fresh('race');S.xp=0;const noRace=JSON.parse(JSON.stringify(S));noRace.drivers[19].abilities.priority=[];
   seedRnd(606008);P2._q=null;const faster=makeRace2(S,0,[19],{weather:{type:'kering',start:999,end:999,int:0}});seedRnd(606008);P2._q=null;const slower=makeRace2(noRace,0,[19],{weather:{type:'kering',start:999,end:999,int:0}});
   check('equipped Race Rhythm changes actual race pace without rewriting base stats',paceFree(faster,faster.cars[0])<paceFree(slower,slower.cars[0])&&p.pace===noRace.drivers[19].pace);
   p=fresh('pace');S.xp=0;const noQuali=JSON.parse(JSON.stringify(S));noQuali.drivers[19].abilities.priority=[];seedRnd(606008);const q1=qkInit(S,0,0);seedRnd(606008);const q2=qkInit(noQuali,0,0);
   check('Qualifying Instinct changes actual qualifying time',q1.base[19].t<q2.base[19].t);
   p=fresh('cons');S.xp=0;const noTyre=JSON.parse(JSON.stringify(S));noTyre.drivers[19].abilities.priority=[];seedRnd(606008);P2._q=null;const tyreA=makeRace2(S,0,[19],{});seedRnd(606008);P2._q=null;const tyreB=makeRace2(noTyre,0,[19],{});const om=P2.mechK,os=P2.mistK;P2.mechK=P2.mistK=0;
   try{seedRnd(606008);tick2(tyreA);seedRnd(606008);tick2(tyreB);}finally{P2.mechK=om;P2.mistK=os;}
   check('Strategic Calm reduces actual tyre wear and bounded incident multiplier',tyreA.cars[0].eff<tyreB.cars[0].eff&&combinedRisk(tyreA,tyreA.cars[0])<combinedRisk(tyreB,tyreB.cars[0]));
   p=fresh('tech');const noTech=JSON.parse(JSON.stringify(S));noTech.drivers[19].abilities.priority=[];const tops={aero:99,engine:99,chassis:99,rel:99},la=[],lb=[];
   seedRnd(606008);devPackage(S,S.teams[7],1,devRank(S),tops,la,{k:'aero',fm:1e-9});seedRnd(606008);devPackage(noTech,noTech.teams[7],1,devRank(noTech),tops,lb,{k:'aero',fm:1e-9});
   check('Technical Insight changes positive R&D feedback in the actual development function',la[0].g>lb[0].g&&la[0].g/lb[0].g<=1.05);
   p=fresh();p.abilities.mastery[CIRCUITS[0].key]=0;S.round=0;const visit=race(5);visit.ci=0;abilityRace(S,visit);const mastery=p.abilities.mastery[CIRCUITS[0].key],bank=S.xp;save();const saved=migrate(JSON.parse(JSON.stringify(S)));abilityRace(saved,visit);
   check('visit/unlock receipts persist on reload without duplicated mastery or XP',saved.drivers[19].abilities.mastery[CIRCUITS[0].key]===mastery&&saved.xp===bank);
   p=fresh();S.round=5;S.th={0:[{s:1,me:{p:4}},{s:0,me:{p:7}},{s:-1,me:null}]};p.capBreakers={wet:2};delete p.abilities;const legacy=facts(S);migrate(S);
   check('old Pro restores factual personal mastery but keeps in-season powers neutral',facts(S)===legacy&&p.abilities.mastery[CIRCUITS[0].key]===2&&p.abilities.locked.neutral&&abilityEffects(S,0).mastery===0&&abilityCapParts(S,'wet').legacy===2);
   p=fresh();S.xp=0;const result=simulateWeekend(S);const f=result.race.cars.find(f=>f.isP);
   check('actual Auto weekend locks a loadout, stores effects and records one personal visit',p.abilities.locked.ids.length===1&&f.ability.q===.1&&p.abilities.mastery[CIRCUITS[0].key]===1&&Object.keys(p.abilities.seen).length===1);
   p=fresh('tech');S.xp=0;p.age=16;let reached=null;
   for(let y=0;y<8;y++){S.season=y+1;S.league=y===0?'f3':y===1?'f2':'f1';S.cal=seasonCalendar(S);p.age=16+y;for(S.round=0;S.round<S.cal.length;S.round++){S.xp+=progressionXP(S,'base',PROGRESSION.annual[S.league]/S.cal.length)+progressionXP(S,'performance',60/S.cal.length)+progressionXP(S,'objectives',2);let keys;while((keys=PROGRESSION.stats.filter(k=>p[k]<statCap(S,k)&&skillCost(p[k],S,k)<=S.xp).sort((a,b)=>p[a]-p[b])).length)buySkill(S,keys[0]);if(reached==null&&baseOverall(p)>=90)reached=p.age;}}
   check('Technical archetype has a paid 90-overall path by 23 without legacy/Cap Breaker',reached!=null&&reached<=23,{reached});
   p=fresh();p.abilities.owned.push('racer');S.settings.style='expert';S.settings.tips=false;UI.screen='hub';UI.tab='aku';render();closeModal();return rows;
  },fixtures);
  await page.locator('#ability-loadout details').first().evaluate(el=>el.open=true);await clickUI(page,'[data-act=ability-toggle][data-v=racer]',true);await clickUI(page,'[data-act=ability-up][data-v=racer]',true);
  rows.push({name:'320px English loadout controls save the chosen priority without overflow',pass:await page.evaluate(()=>me().abilities.priority[0]==='racer'&&loadSave().drivers[S.pi].abilities.priority[0]==='racer'&&document.documentElement.scrollWidth<=320)});
  await page.evaluate(()=>A['wk-start']());const locked=await page.evaluate(()=>JSON.stringify(me().abilities));await page.evaluate(()=>A['ability-toggle']({v:'racer'}));
  rows.push({name:'weekend entry persists lock and rejects changes after qualifying preparation',pass:await page.evaluate(locked=>JSON.stringify(me().abilities)===locked&&loadSave().drivers[S.pi].abilities.locked.ids[0]==='racer',locked)});
  rows.forEach(r=>console.log(r.pass?'PASS':'FAIL',r.name,!r.pass&&r.data?JSON.stringify(r.data):''));console.log('ERRS',JSON.stringify(errors));assert.equal(errors.length,0);assert.equal(rows.filter(r=>!r.pass).length,0);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
