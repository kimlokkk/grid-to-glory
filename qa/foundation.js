const {chromium}=require('playwright');
const {assert,chooseStyle,clickUI}=require('./flow');
const {pathToFileURL}=require('node:url');
const path=require('node:path'),fs=require('node:fs');
(async()=>{
 const b=await chromium.launch(),errors=[];
 try{
  const pg=await b.newPage({viewport:{width:390,height:844}});pg.on('pageerror',e=>errors.push(e.message));
  await pg.clock.install();await pg.goto(pathToFileURL(path.resolve(__dirname,'../index.html')).href);
  await pg.evaluate(()=>{seedRnd(604006);A.new();A['career-mode']({v:'classic'});A['new-go']();});await chooseStyle(pg,true);
  const rows=await pg.evaluate(()=>{
   const rows=[],check=(name,pass,data)=>rows.push({name,pass:!!pass,data});
   const original=JSON.stringify(S);
   const names=['Cempaka Raya','Longwei','Hanabi','Maravela','Île Laurent','Monte Albrecht','Sol de Vega','Falkenring','Dunmere','Nordkap','Valle Dorado','Duinveld','Velocera','Kaspira','Seri Mutiara','Senja Marina','Redstone Hills','Sierra Alta','Costa Vermelha','Lumen City','Qamar Dunes','Aurelia'];
   const laps=[25,24,24,26,28,30,25,30,24,20,29,29,25,23,25,26,24,28,29,22,25,26];
   try{
    const classic=newCareer('Legacy Test','pace',7);S=classic;
    simulateWeekend(S);simulateWeekend(S);
    const legacy=JSON.parse(JSON.stringify(S));
    ['mode','league','meta','people','events','wallet','schemaVersion','playerUid'].forEach(k=>delete legacy[k]);legacy.saveVer=1;
    [legacy.drivers,legacy.reserves,legacy.juniors,legacy.retired].forEach(a=>(a||[]).forEach(d=>delete d.uid));
    const summary=g=>JSON.stringify({season:g.season,round:g.round,cal:g.cal,xp:g.xp,results:g.results,history:g.hist,career:g.career,drivers:g.drivers.map(d=>[d.id,d.name,d.team,d.pts,d.age,d.pace]),fin:g.teams.map(t=>t.fin)});
    const before=summary(legacy),cal=JSON.stringify(legacy.cal),m=migrate(legacy);
    check('schema-1 migration preserves career, money, results and calendar',summary(m)===before);
    check('legacy save stays Classic with original ten rounds',m.mode==='classic'&&m.cal.length===10&&JSON.stringify(m.cal)===cal&&m.saveVer===2);
    const ids=m.drivers.map(d=>d.uid);migrate(m);
    check('migration is idempotent for permanent identities',JSON.stringify(m.drivers.map(d=>d.uid))===JSON.stringify(ids));
    check('original ten circuit indexes retain their names',CIRCUITS.slice(0,10).map(c=>c.name).join('|')==='GP Cempaka Raya|GP Costa Vermelha|GP Monte Albrecht|GP Hanabi|GP Sierra Alta|GP Nordkap|GP Dunmere|GP Valle Dorado|GP Seri Mutiara|GP Aurelia');
    check('Classic lap calculations remain unchanged',CIRCUITS.slice(0,10).every(c=>laps2(c)===clamp(Math.round(88/c.km),15,25)));
    seedRnd(604006);S=newProCareer('Pro Test','pace',7);
    const proto=S;
    check('Pro F1 has exact locked order',S.cal.map(ci=>CIRCUITS[ci].name).join('|')===names.map(n=>'GP '+n).join('|'));
    check('Pro F1 has exact locked laps and total 567',JSON.stringify(S.cal.map(ci=>laps2(circuitFor(S,ci))))===JSON.stringify(laps)&&laps.reduce((a,b)=>a+b,0)===567);
    check('all circuit keys are stable and unique',new Set(CIRCUITS.map(c=>c.key)).size===22&&S.cal.every(ci=>!!CIRCUITS[ci].key));
    check('junior configuration is eight rounds without changing Classic',GTG_LEAGUES.f2.rounds===8&&GTG_LEAGUES.f3.rounds===8&&seasonCalendar({mode:'pro',league:'f2'}).length===8&&seasonCalendar({mode:'pro',league:'f3'}).length===8);
    check('Pro grid remains 20 seats and two drivers per team',S.drivers.length===20&&S.teams.every(t=>S.drivers.filter(d=>d.team===t.id).length===2));
    const people=S.drivers.concat(S.juniors,S.reserves),uids=people.map(d=>d.uid);
    check('permanent identity is separate from grid slot and unique',uids.every(id=>typeof id==='string')&&new Set(uids).size===uids.length&&S.playerUid===me().uid);
    const j=S.world?worldView(S,'f2').drivers[0]:S.juniors[0],graduate=juniorToDriver(S,j,4,2);
    check('promotion retains person identity instead of slot identity',graduate.uid===j.uid&&graduate.id===4);
    UI.screen='hub';UI.tab='kal';render();
    check('calendar UI displays all 22 tracks and laps',document.querySelectorAll('.krow.big').length===22&&document.body.textContent.includes('30 laps')&&document.body.textContent.includes('/22'));
    S.round=9;check('round ten is not Pro season finale',!fnlFinal());S.round=21;check('round 22 is Pro season finale',fnlFinal());S.round=0;
    const initial=JSON.stringify(S),stats=[];window.phase4ProFixture=initial;let checkpoint;
    for(let r=0;r<22;r++){
     const sim=simulateWeekend(S),R=sim.race;
     stats.push({round:r+1,ci:R.ci,laps:R.L,scale:raceDistance(R),finishers:R.cls.filter(f=>!f.dnf).length,stops:R.cls.filter(f=>!f.dnf).map(f=>f.stops),fuel:R.cls.filter(f=>!f.dnf).map(f=>f.fuel)});
     check('R'+(r+1)+': real engine finishes locked distance and advances once',R.L===laps[r]&&R.done&&S.round===r+1&&S.results.length===r+1&&R.cls.every(f=>f.dnf||Number.isFinite(f.tFin)));
     if(r===9)checkpoint=JSON.stringify(S);
    }
    check('all 22 races create identity-linked history and shared events',S.rr.length===22&&S.rr.every(e=>e.circuitId&&e.c.every(r=>typeof r[7]==='string'))&&S.events.filter(e=>e.kind==='race').length===22&&S.news.filter(n=>n.k==='race').every(n=>n.eventId&&S.events.some(e=>e.id===n.eventId)));
    check('full-season Auto finishers retain usable fuel',stats.every(r=>r.fuel.every(f=>f>-.25)),stats);
    S.round=22;UI.screen='hub';UI.tab='utama';render();
    check('season end UI reports 22 completed rounds',document.body.textContent.includes('All 22 rounds complete.'));
    // Separate same-seed creation proves deterministic scenarios without animations.
    seedRnd(7331);S=newProCareer('Repeat Test','cons',8);simulateWeekend(S);const first=JSON.stringify(S.rr[0].c);
    seedRnd(7331);S=newProCareer('Repeat Test','cons',8);simulateWeekend(S);
    check('same seed reproduces creation and a complete simulated weekend',JSON.stringify(S.rr[0].c)===first);
    const state=JSON.stringify(S), nextRound=S.round;const roundSeed=S.meta.rng;simulateWeekend(S);const nextExpected=JSON.stringify(S.rr.at(-1).c);
    S=migrate(JSON.parse(state));simulateWeekend(S);
    check('save/load restores simulation random state for next weekend',JSON.stringify(S.rr.at(-1).c)===nextExpected);
    S=proto;const playerUid=me().uid,oldUid=S.drivers[0].uid;S.drivers[0].age=44;
    endSeason(S);startNewSeason(S,null,null);foundationInit(S);
    check('next season preserves fixed 22-round order',S.round===0&&S.season===2&&S.cal.map(ci=>CIRCUITS[ci].name).join('|')===names.map(n=>'GP '+n).join('|'));
    check('retirement does not erase person or attach history to replacement',S.people[oldUid]&&S.people[oldUid].seasons.length>0&&S.retired.some(d=>d.uid===oldUid)&&S.drivers.every(d=>d.uid!==oldUid));
    check('player identity survives new season and market',me().uid===playerUid&&S.playerUid===playerUid);
    check('new-season grid identities remain unique and exactly 20 seats',S.drivers.length===20&&new Set(S.drivers.map(d=>d.uid)).size===20&&S.teams.every(t=>S.drivers.filter(d=>d.team===t.id).length===2));
    const future=JSON.parse(JSON.stringify(S));future.saveVer=999;let rejected=false;try{migrate(future);}catch(e){rejected=true;}
    check('unsupported future save is rejected',rejected);
    S=JSON.parse(original);jrBuild(S);foundationInit(S);
    const juniorPlayer=me().uid,formerAI=S.drivers[0].uid;
    jrPromote({t:'8',y:'2',p:'0.5'});
    check('Classic player junior-to-F1 promotion retains permanent identity',me().uid===juniorPlayer&&S.playerUid===juniorPlayer&&S.mode==='classic'&&S.cal.length===10);
    check('promotion archives old roster without orphan active identities',S.people[formerAI].role==='archived'&&Object.values(S.people).filter(p=>p.role==='active').length===20&&new Set(S.drivers.map(d=>d.uid)).size===20);
    window.phase4Checkpoint=checkpoint;window.phase4Stats=stats;
   }finally{S=JSON.parse(original);UI.wk=null;closeModal();}
   return rows;
  });
  const proFixture=await pg.evaluate(()=>phase4ProFixture);
  const baselineDir=path.resolve(__dirname,'../../outputs/baseline/saves');
  for(const file of fs.readdirSync(baselineDir).filter(f=>f.endsWith('.json')&&f!=='manifest.json')){
   const legacy=JSON.parse(fs.readFileSync(path.join(baselineDir,file),'utf8'));
   const pass=await pg.evaluate(legacy=>{const before=JSON.stringify([legacy.season,legacy.round,legacy.cal,legacy.xp,legacy.career,legacy.results]);const migrated=migrate(legacy);return migrated.mode==='classic'&&migrated.saveVer===2&&before===JSON.stringify([migrated.season,migrated.round,migrated.cal,migrated.xp,migrated.career,migrated.results]);},legacy);
   rows.push({name:'original baseline save migrates: '+file,pass});
  }
  // Exercise actual export/import and Continue on an in-progress Pro season.
  await pg.evaluate(()=>{S=migrate(JSON.parse(phase4Checkpoint));S.settings.mini=false;S.settings.ask=false;save();UI.screen='hub';UI.tab='kal';render();A.export();});
  const code=await pg.locator('#exp').inputValue();
  await pg.evaluate(()=>{closeModal();A.import();});await pg.locator('#imp').fill(code);await pg.clock.runFor(800);await clickUI(pg,'[data-act=import-go]',true);
  rows.push({name:'actual export/import preserves Pro mode, round ten and identities',pass:await pg.evaluate(()=>S.mode==='pro'&&S.round===10&&S.cal.length===22&&me().uid===S.playerUid)});
  await pg.reload();await pg.clock.runFor(800);await clickUI(pg,'[data-act=continue]',true);
  rows.push({name:'round-ten reload stays in season, not premature review',pass:await pg.evaluate(()=>UI.screen==='hub'&&S.round===10&&seasonRounds(S)===22)});
  await pg.evaluate(()=>{A['wk-start']();A['q-fin']();A['q-next']();A['s-go']();stopRace();for(let i=0;i<40;i++)stepOne(RUN.R);});
  const race=await pg.evaluate(()=>({L:RUN.R.L,scale:RUN.R.distanceScale,grid:RUN.R.p.grid,uid:me().uid}));
  rows.push({name:'round 11 UI and engine use Valle Dorado profile',pass:race.L===29&&Math.abs(race.scale-4.4/5.3)<1e-7});
  await pg.reload();await pg.clock.runFor(800);await clickUI(pg,'[data-act=continue]',true);
  rows.push({name:'Pro race checkpoint reload settles same calendar round',pass:await pg.evaluate(race=>S.mode==='pro'&&S.round===11&&S.results.at(-1).grid===race.grid&&me().uid===race.uid&&S.cal.length===22,race)});
  const failures=rows.filter(r=>!r.pass).map(r=>r.name);rows.forEach(r=>console.log(r.pass?'PASS':'FAIL',r.name,r.data?JSON.stringify(r.data):''));
  if(process.env.QA_FOUNDATION_DIR){const fixture=proFixture;fs.writeFileSync(path.join(process.env.QA_FOUNDATION_DIR,'pro-f1-start.json'),fixture+'\n');fs.writeFileSync(path.join(process.env.QA_FOUNDATION_DIR,'pro-f1-start.save.txt'),Buffer.from(fixture,'utf8').toString('base64')+'\n');fs.writeFileSync(path.join(process.env.QA_FOUNDATION_DIR,'results.json'),JSON.stringify(rows,null,2)+'\n');await pg.screenshot({path:path.join(process.env.QA_FOUNDATION_DIR,'pro-round-12.png'),fullPage:true});}
  console.log('ERRS',JSON.stringify(errors.concat(failures)));assert.equal(errors.length+failures.length,0);
 }finally{await b.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
