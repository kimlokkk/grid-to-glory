/* Focused 6D checks: scoring, exclusions, tier boundaries and old saves. */
const {chromium}=require('playwright');
const {assert}=require('./flow');
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
   const state=g=>JSON.stringify([g.xp,g.season,g.round,g.cal,g.career,g.results,g.hist,g.drivers.map(d=>[d.age,...PROGRESSION.stats.map(k=>d[k])])]);
   check('ten Classic saves preserve stats, XP and career without new evaluation fields',fixtures.every(g=>{const before=state(g);migrate(g);return before===state(g)&&!g.drivers[g.pi].evaluation;}));
   function fresh(){S=newProCareer('Review','pace',7);return me();}
   function result(pos=10,reason=null,mateReason=null){const p=me(),m=mateOf(S,p);return {ci:S.cal[S.round],c:circuitFor(S,S.cal[S.round]),fl:{di:-1,t:0},cls:[{car:{d:p,di:p.id,isP:true,team:p.team,grid:10,dnf:reason},pos:pos,dnf:!!reason},{car:{d:m,di:m.id,isP:false,team:m.team,grid:11,dnf:mateReason},pos:pos+1,dnf:!!mateReason}]};}
   function season(score,n=22,excluded=0){const e=me().evaluation;e.races=e.races.filter(r=>r.season!==S.season);for(let i=0;i<n+excluded;i++)e.races.push({key:S.season+':f1:'+i,season:S.season,league:'f1',round:i,sts:i<n?score:null,excluded:i<n?null:'Mechanical DNF',h2h:i<n?50:null,h2hWin:i<n});S.round=22;}
   let p=fresh();const first=evaluationPrepare(S,S.cal[0]),expected=first.expected;S.teams[p.team].car.engine=99;S.teams[p.team].car.aero=99;S.teams[p.team].car.chassis=99;
   check('pre-race expectation freezes despite subsequent car changes',evaluationPrepare(S,S.cal[0]).expected===expected&&first.carExpected>=1&&first.expected<=20);
   S.round++;check('next weekend recalculates expectation after car development',evaluationPrepare(S,S.cal[1]).expected<expected);
   p=fresh();const weak=evaluationExpected(S,S.cal[0],p).expected;S.teams[p.team].car={aero:99,engine:99,chassis:99,rel:99};const strong=evaluationExpected(S,S.cal[0],p).expected;
   check('same result is harder against a stronger car expectation',strong<weak&&50+(weak-10)*6>50+(strong-10)*6);
   p=fresh();let m=mateOf(S,p);PROGRESSION.stats.forEach(k=>{p[k]=70;m[k]=90;});evaluationPrepare(S,S.cal[0]);evaluationRace(S,result(5));const hStrong=p.evaluation.latest.h2h;
   p=fresh();m=mateOf(S,p);PROGRESSION.stats.forEach(k=>{p[k]=70;m[k]=50;});evaluationPrepare(S,S.cal[0]);evaluationRace(S,result(5));
   check('beating a stronger teammate earns more adjusted H2H credit',hStrong>p.evaluation.latest.h2h);
   p=fresh();evaluationPrepare(S,S.cal[0]);evaluationRace(S,result(20,'Mechanical failure'));const receipt=JSON.stringify(p.evaluation);evaluationRace(S,result(1));
   check('mechanical DNF is excluded rather than zero; race scoring is once-only',evaluationSummary(S).n===0&&evaluationSummary(S).excluded===1&&p.evaluation.latest.sts==null&&receipt===JSON.stringify(p.evaluation));
   S.round++;evaluationPrepare(S,S.cal[1]);evaluationRace(S,result(8,null,'Mechanical failure'));
   check('teammate mechanical DNF excludes H2H without excluding player driving',p.evaluation.latest.h2h===null&&p.evaluation.latest.sts!=null);
   p=fresh();evaluationPrepare(S,S.cal[0]);const ordered=result(10);const a={s:10,sPrev:9},b={s:9.99,sPrev:8.99};toSwap(a,b);Object.assign(ordered.cls[0].car,a,{evalSpins:1});evaluationRace(S,ordered);
   check('actual team swap credits lost place, excludes H2H, retains genuine mistakes',p.evaluation.latest.order&&p.evaluation.latest.h2h===null&&p.evaluation.latest.consistency===75&&Math.abs(p.evaluation.latest.performance-clamp(50+(p.evaluation.latest.snapshot.expected-9)*6,0,100))<1e-8);
   p=fresh();season(66);const rookie=tierPreview(S);evaluationClose(S);const closed=JSON.stringify(p.evaluation);evaluationClose(S);
   check('rookie uses one real season without a zero-filled second season; close is idempotent',rookie.average===66&&p.evaluation.tier===2&&closed===JSON.stringify(p.evaluation));
   p=fresh();season(66);const fullScore=evaluationSummary(S).sts;S.league='f2';S.cal=seasonCalendar(S);p.evaluation.races=Array.from({length:8},(_,i)=>({key:'1:f2:'+i,season:1,league:'f2',sts:66,excluded:null,h2h:50,h2hWin:true}));
   check('STS normalizes actual races across 22-round F1 and eight-round junior seasons',evaluationSummary(S).sts===fullScore);
   p=fresh();p.evaluation.tier=2;p.evaluation.seasons=[{season:0,league:'f1',rounds:22,n:22,sts:70}];season(20);evaluationClose(S);const warning=p.evaluation.tier===2&&p.evaluation.weakSeasons===1;
   S.season++;season(20);evaluationClose(S);const down=p.evaluation.tier===1&&p.evaluation.review.slotsBefore===3&&p.evaluation.review.slotsAfter===2;
   S.season++;season(90);evaluationClose(S);
   check('two weak assessed seasons cause one-step drop; recovery clears warning',warning&&down&&p.evaluation.weakSeasons===0&&p.evaluation.tier>=1);
   p=fresh();p.evaluation.tier=2;season(0,0,22);evaluationClose(S);
   check('all-mechanical season preserves tier and creates no weak-season strike',p.evaluation.tier===2&&p.evaluation.weakSeasons===0&&p.evaluation.review.summary.sts===null);
   p=fresh();season(90);S.hist=[{league:'f3',pos:1},{league:'f2',pos:1},{league:'f3',pos:1}];const noJuniorLeagueTitles=tierPreview(S).to<3;S.hist=[{season:0,pos:1,jr:true},{season:-1,pos:1,jr:true},{season:-2,pos:1,jr:true}];const junior=tierPreview(S).to;S.hist.push({season:0,pos:1},{season:-1,pos:1},{season:-2,pos:1});const qualified=tierPreview(S);evaluationClose(S);const bank=S.xp,body=JSON.stringify(p.body);S.season++;season(20);evaluationClose(S);S.season++;season(20);evaluationClose(S);
   check('Legend requires three F1 titles/current form; ever-Legend record persists on drop',noJuniorLeagueTitles&&junior<3&&qualified.to===3&&p.evaluation.tier===2&&p.evaluation.everLegend&&p.evaluation.f1Titles===3);
   check('tier changes never award XP, discount costs or reduce wear',bank===S.xp&&body===JSON.stringify(p.body)&&skillCost(80,S,'pace')===proSkillCost(80,S,'pace'));
   p=fresh();p.miss=2;p.obj={s:S.season,ty:'pos',tgt:1,txt:'Win title',res:null};S.drivers[0].pts=20;season(0,0,22);endSeason(S);
   check('mechanical losses do not trigger contract performance strike or termination',p.obj.res==='protected'&&p.miss===2&&!objVerdict(S).terminate&&objVerdict(S).renew&&S.lastSummary.obj.res==='protected');
   p=fresh();const raw=result(20,'Mechanical failure');const rv=ensureRival(S),rival=S.drivers[rv.di];const race={p:{di:p.id,d:p,team:p.team,pos:20,grid:10,dnf:'Mechanical failure'},cars:[]};race.cars=[race.p,{di:rival.id,d:rival,team:rival.team,pos:8,dnf:null}];const w={obj:[{k:'mate',n:'Mate',xp:1,ok:null},{k:'tamat',n:'Finish',xp:1,ok:null}]};const morale=S.morale;const j=judgeRace(w,race);
   check('mechanical race objectives/rivalry do not add blame or morale penalties',j.mor===0&&j.xp===0&&rv.w===0&&rv.l===0&&w.obj.every(o=>o.protected));
   p=fresh();delete p.evaluation;S.live={r:0,ci:S.cal[0]};const saved=state(S);migrate(S);evaluationPrepare(S,S.cal[0]);evaluationRace(S,result(20));
   check('old Pro live save is not retroactively graded and retains career data',saved===state(S)&&p.evaluation.latest.excluded&&p.evaluation.latest.sts==null);
   p=fresh();S.xp=0;const run=simulateWeekend(S);const real=p.evaluation.latest;save();const reloaded=migrate(JSON.parse(JSON.stringify(S)));
   check('actual race pipeline stores pre-race evidence before R&D and survives reload',real&&real.snapshot&&real.snapshot.key==='1:f1:0'&&S.round===1&&JSON.stringify(reloaded.drivers[S.pi].evaluation)===JSON.stringify(p.evaluation));
   S.settings.tips=false;UI.screen='hub';UI.tab='aku';render();closeModal();
   check('320px English performance/tier panel is readable without width overflow',document.body.textContent.includes('Performance & tier')&&document.body.textContent.includes('Season score')&&document.documentElement.scrollWidth<=320);
   return rows;
  },fixtures);
  rows.forEach(r=>console.log(r.pass?'PASS':'FAIL',r.name,!r.pass&&r.data?JSON.stringify(r.data):''));console.log('ERRS',JSON.stringify(errors));assert.equal(errors.length,0);assert.equal(rows.filter(r=>!r.pass).length,0);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
