/* Full weekend modes and browser-reload checkpoints through real UI/physics. */
const {chromium}=require('playwright');
const {assert,chooseStyle,clickUI}=require('./flow');
const {pathToFileURL}=require('node:url');
const path=require('node:path'),fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch(),errors=[],rows=[];
 const check=(name,pass,data)=>rows.push({name,pass:!!pass,data});
 async function start(width=390,mini=false,ask=false){
  const pg=await browser.newPage({viewport:{width,height:844}});pg.on('pageerror',e=>errors.push(e.message));
  await pg.clock.install();await pg.goto(pathToFileURL(path.resolve(__dirname,'../index.html')).href);
  await pg.evaluate(()=>{seedRnd(601106);A.new();A['career-mode']({v:'classic'});A['new-go']();});await chooseStyle(pg,true);
  await pg.evaluate(({mini,ask})=>{S.settings.mini=mini;S.settings.ask=ask;P2.mechK=P2.mistK=0;S.settings.sound=false;save();}, {mini,ask});return pg;
 }
 async function click(pg,s){return clickUI(pg,s,true);}
 async function reload(pg){await pg.reload();await pg.clock.runFor(800);await click(pg,'[data-act=continue]');await pg.clock.runFor(800);}
 async function mini(pg){
  if(!await pg.locator('#modal > *').count())return false;
  await pg.clock.runFor(800);
  for(const action of ['onb-fin','pc-yes','to-yes','mg-ok','mg-auto','mg-go','mg-begin']){
   if(await pg.locator(`#modal [data-act=${action}]`).count()){await click(pg,`#modal [data-act=${action}]`);if(action==='mg-go')await pg.clock.runFor(3500);return true;}
  }
  if(await pg.locator('#modal [data-tap=mg-w]').count()){
   const k=await pg.locator('#pcar').evaluate(el=>[...el.querySelectorAll('.pty')].findIndex(e=>e.classList.contains('lit')));
   if(k>=0)await click(pg,`#modal [data-tap=mg-w][data-k="${k}"]`);else await pg.clock.runFor(1000);return true;
  }
  if(await pg.locator('#modal [data-tap]').count()){await click(pg,'#modal [data-tap] >> nth=0');await pg.clock.runFor(1200);return true;}
  await pg.clock.runFor(1500);return true;
 }
 async function grid(pg,manual=false){
  await click(pg,'[data-act=wk-start]');
  for(let n=0;n<35&&!await pg.locator('[data-act=q-next]').count();n++){
   if(await mini(pg))continue;
   await click(pg,await pg.locator('[data-act=q-play]').count()?'[data-act=q-play]':'[data-act=q-fin]');
  }
  assert.equal(await pg.locator('[data-act=q-next]').count(),1,'qualifying reaches grid');await click(pg,'[data-act=q-next]');
 }
 try{
  for(const config of (process.env.QA_WEEKEND_RELOAD_ONLY ? [] : [{name:'Manual + mini',mini:true,ask:true,fast:false,width:390},{name:'Auto normal',mini:false,ask:false,fast:false,width:1280},{name:'Manual FAST',mini:true,ask:true,fast:true,width:320},{name:'Engineer Auto FAST',mini:false,ask:false,fast:true,width:390}])){
   console.log('CASE',config.name);const pg=await start(config.width,config.mini,config.ask);const startingXP=await pg.evaluate(()=>S.xp);await grid(pg,config.mini);
   const gridState=await pg.evaluate(()=>({xp:S.xp,round:S.round,grid:UI.wk.R.p.grid,order:UI.wk.R.cars.map(f=>f.di)}));
   check(config.name+': qualifying awards no premature race XP',gridState.xp===startingXP&&gridState.round===0);
   if(config.ask){await click(pg,'[data-act=s-mode][data-k=push][data-v="1"]');await click(pg,'[data-act=s-mode][data-k=fuelMode][data-v="0"]');}
   await click(pg,'[data-act=s-go]');
   for(let n=0;n<20&&await pg.locator('#modal > *').count();n++)await mini(pg);
   if(await pg.locator('[data-act=r-playback]').count()){await click(pg,'[data-act=r-playback]');await pg.clock.runFor(700);}
   if(config.fast)await click(pg,'[data-act=r-fast]');else await click(pg,'[data-act=r-spd][data-v="4"]');
   if(await pg.evaluate(()=>RUN.pause))await click(pg,'[data-act=r-go]');
   let requested=false,pitCalls=0,miniCalls=0;
   for(let n=0;n<650;n++){
    if(await pg.evaluate(()=>RUN.R.done))break;
    const state=await pg.evaluate(()=>({lap:RUN.R.p.lap,fin:RUN.R.p.fin,wait:RUN.wait}));
    if(!requested&&state.lap>=3&&!state.fin){await pg.evaluate(()=>{RUN.R.p.pitReq='H';RUN.R.p.pitOk=false;RUN.R.p.why='pelan';});requested=true;}
    if(await pg.locator('#modal [data-act=pc-yes]').count())pitCalls++;
    if(await mini(pg)){miniCalls++;continue;}
    if(await pg.locator('[data-act=r-ff]').count()){await click(pg,'[data-act=r-ff]');continue;}
    await pg.clock.runFor(1000);
   }
   const done=await pg.evaluate(()=>({done:RUN.R.done,committed:!!UI.wk.rep,round:S.round,results:S.results.length,rr:S.rr.length,live:S.live,push:RUN.R.p.bot.push,fuel:RUN.R.p.bot.fuelMode,stops:RUN.R.p.stops}));
   check(config.name+': full race finishes and commits once',done.done&&done.committed&&done.round===1&&done.results===1&&done.rr===1&&done.live===null,done);
   check(config.name+': resource ownership survives race',config.ask?done.push===1&&done.fuel===0:done.push==null&&done.fuel==null);
   check(config.name+': pit actually happens',done.stops>=1&&(!config.ask||pitCalls>0),{pitCalls,miniCalls,stops:done.stops});
   await click(pg,'[data-act=r-done]');
   const stable=await pg.evaluate(()=>({round:S.round,xp:S.xp,career:S.career,results:S.results,rr:S.rr}));
   await pg.evaluate(()=>{A['r-done']();render();});
   check(config.name+': reopening result does not duplicate rewards',JSON.stringify(await pg.evaluate(()=>({round:S.round,xp:S.xp,career:S.career,results:S.results,rr:S.rr})))===JSON.stringify(stable));
   await reload(pg);
   check(config.name+': reload preserves committed result/rewards',JSON.stringify(await pg.evaluate(()=>({round:S.round,xp:S.xp,career:S.career,results:S.results,rr:S.rr})))===JSON.stringify(stable));
   await pg.close();
  }
  const pg=await start();await grid(pg);
  const before=await pg.evaluate(()=>({round:S.round,xp:S.xp,results:S.results.length}));await reload(pg);
  check('reload before lights does not award race or advance round',JSON.stringify(await pg.evaluate(()=>({round:S.round,xp:S.xp,results:S.results.length})))===JSON.stringify(before));
  await grid(pg);await click(pg,'[data-act=s-go]');await pg.evaluate(()=>{stopRace();for(let n=0;n<100;n++)stepOne(RUN.R);});
  const checkpoint=await pg.evaluate(()=>{
   const R=RUN.R;R.p.en=0.17;R.p.eff+=4;R.w={type:'basah',start:-9,end:999,int:0.9};R.wet=0.9;R.p.pen=5;
   // Force an already retired player: a reload may never resurrect that driver.
   retire(R,R.p,'Mechanical failure',0,0);
   liveCheckpoint(R);save();
   const seed=S.live.seed, expected=liveRestore(S,JSON.parse(JSON.stringify(S.live)));
   seedRnd(seed);
   return {name:R.p.d.name,grid:R.p.grid,reason:R.p.dnf,round:S.round,xp:S.xp,rows:expected.cls.map(f=>[f.d.name,f.team,f.dnf?0:f.pos,f.grid])};
  });
  await reload(pg);
  const settled=await pg.evaluate(()=>({round:S.round,result:S.results.at(-1),count:S.results.length,rr:S.rr.length,live:S.live,rows:S.rr.at(-1).c.map(r=>[r[0],r[1],r[2],r[4]])}));
  check('reload settles exactly one race',settled.round===checkpoint.round+1&&settled.count===1&&settled.rr===1&&settled.live===null,settled);
  check('reload never resurrects a retired player or changes original grid',settled.result.dnf===checkpoint.reason&&settled.result.grid===checkpoint.grid,{checkpoint,settled:settled.result});
  check('reload uses saved weather, tyres, resource state and random sequence',JSON.stringify(settled.rows)===JSON.stringify(checkpoint.rows));
  const after=await pg.evaluate(()=>JSON.stringify({round:S.round,xp:S.xp,career:S.career,results:S.results,rr:S.rr}));await reload(pg);
  check('second reload cannot settle or reward the race twice',await pg.evaluate(()=>JSON.stringify({round:S.round,xp:S.xp,career:S.career,results:S.results,rr:S.rr}))===after);
  await pg.close();
  const legacy=await start();
  await legacy.evaluate(()=>{S.live={r:S.round,ci:S.cal[S.round]};save();});await reload(legacy);
  check('legacy live marker without race snapshot still settles safely',await legacy.evaluate(()=>S.round===1&&S.results.length===1&&S.live===null));
  const legacyState=await legacy.evaluate(()=>JSON.stringify([S.round,S.xp,S.results,S.career]));await reload(legacy);
  check('legacy settlement also cannot reward twice',await legacy.evaluate(()=>JSON.stringify([S.round,S.xp,S.results,S.career]))===legacyState);await legacy.close();
  const quit=await start();await grid(quit);await click(quit,'[data-act=s-go]');
  const quitState=await quit.evaluate(()=>{stopRace();for(let i=0;i<80;i++)stepOne(RUN.R);const grid=RUN.R.p.grid;retire(RUN.R,RUN.R.p,'Mechanical failure',0,0);A['wk-quit']();return {grid,result:S.results.at(-1),round:S.round,count:S.results.length,live:S.live};});
  check('Exit also continues existing race without resurrecting DNF',quitState.result.dnf==='Mechanical failure'&&quitState.result.grid===quitState.grid&&quitState.round===1&&quitState.count===1&&quitState.live===null,quitState);await quit.close();
  for(const r of rows)console.log(r.pass?'PASS':'FAIL',r.name,r.data?JSON.stringify(r.data):'');
  if(process.env.QA_WEEKEND_REPORT)fs.writeFileSync(process.env.QA_WEEKEND_REPORT,JSON.stringify(rows,null,2)+'\n');
  const failures=rows.filter(r=>!r.pass).map(r=>r.name);console.log('ERRS',JSON.stringify(errors.concat(failures)));assert.equal(errors.length+failures.length,0);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
