const { chromium } = require('playwright');
const { assert, chooseStyle } = require('./flow');
const { pathToFileURL } = require('node:url');
const path = require('node:path'), fs = require('node:fs');
(async () => {
 const browser = await chromium.launch(), errors=[];
 try {
  const pg=await browser.newPage({viewport:{width:390,height:844}});
  pg.on('pageerror',e=>errors.push(e.message));
  await pg.goto(pathToFileURL(path.resolve(__dirname,'../index.html')).href);
  await pg.evaluate(()=>{seedRnd(20261106); A.new(); A['new-go']();});
  await chooseStyle(pg);
  const rows=await pg.evaluate(()=>{
   const original=JSON.stringify(S), random=rnd, rows=[];
   const check=(name,pass,data)=>rows.push({name,pass:!!pass,data});
   function reset(){S=JSON.parse(original);UI.screen='hub';UI.wk=null;closeModal();rnd=()=>0.5;}
   function result(pos,reason=null){return {pos,dnf:!!reason,car:{d:me(),di:S.pi,isP:true,grid:15,dnf:reason}};}
   try {
    reset();const rank=S.teams.slice().sort((a,b)=>teamPower(b)-teamPower(a));
    me().team=rank[0].id;
    check('P11 best car is bad, not overperformance',pressMake(S,result(11),0)?.kind==='bad');
    me().team=rank.at(-1).id;
    check('P11 weakest car is overperformance',pressMake(S,result(11),0)?.kind==='over');
    check('mechanical DNF has factual conference',pressMake(S,result(20,'Mechanical failure'),0)?.kind==='mech');
    check('crash DNF has retirement question',pressMake(S,result(20,'Crash'),0)?.kind==='dnf');
    rnd=()=>0.1;
    for(const [pos,kind] of [[1,'win'],[2,'pod'],[3,'pod'],[7,'pts']])check('P'+pos+' conference',pressMake(S,result(pos),0)?.kind===kind);
    reset();const ids=[0,1,2],names=ids.map(i=>S.drivers[i].name);
    S.drivers[0].pts=25;S.rr=[{s:1,r:0,ci:0,c:ids.map((di,i)=>[S.drivers[di].name,S.drivers[di].team,i+1,25-i,di+1,0,''])}];
    pushNews(S,{k:'race',c:CIRCUITS[0].name,w:ids,me:12});
    const n=S.news[0],first=JSON.stringify(newsStory(n));
    S.drivers[0].name='Replacement Driver';S.drivers[0].team=9;S.drivers[1].pts=999;S.season=2;S.round=4;
    check('archived story survives replacement and standings changes',JSON.stringify(newsStory(n))===first);
    S=JSON.parse(JSON.stringify(S));check('story survives save roundtrip',JSON.stringify(newsStory(S.news[0]))===first);
    const legacy=newsStory({k:'race',c:CIRCUITS[0].name,s:1,r:1,w:ids,me:12,id:33});
    check('legacy article uses recorded winner',legacy.head.includes(names[0].split(' ').at(-1))&&!legacy.head.includes('Driver'),legacy);
    check('legacy article does not report current standings',!legacy.sub.includes('leads the championship'),legacy.sub);
    S.rr=[];const unavailable=newsStory({k:'race',c:'Old Race',s:1,r:1,w:[0,1,2],me:12});
    check('missing legacy history never attributes victory to replacement',!unavailable.head.includes('Driver')&&!/wins |victory/.test(unavailable.head));
    reset();pushNews(S,{k:'race',c:'Test',w:[0,1],me:0});const two=newsStory(S.news[0]);
    check('two finishers do not invent third podium driver',!/[?]|undefined/.test(two.sub)&&!two.sub.includes('complete the podium'),two);
    pushNews(S,{k:'race',c:'Test',w:[],me:0});check('no finisher does not invent winner',!/victory|wins |chequered|Masterclass/.test(newsStory(S.news[0]).head));
    reset();S.sit={team:me().team};S.bench={name:'Actual Player'};
    pushNews(S,{k:'race',c:'Reserve Test',w:[0,1,2],me:12,reserve:true,driver:me().name});
    check('reserve article describes stand-in',/stand-in/i.test(newsStory(S.news[0]).sub));
    reset();S.season=3;me().sh=[{s:1,t:myTeam().short,pos:2}];
    check('skipped season is not described as last year',preMake(S).kind!=='top');
    myTeam().dev.target=null;const pre=preMake(S),txt=PRE[pre.kind].q(pre.ctx);
    check('missing target never prints Pnull/Pundefined',!/Pnull|Pundefined/.test(txt),txt);
    reset();S.morale=99;S.fame=99;repInit(S).rel[me().team]=9.8;
    UI.wk={press:{kind:'win',home:true,done:null}};A.press({i:'0'});
    const effects=UI.wk.press.effects;
    check('records actual capped conference changes',effects&&Math.abs(effects.mor-1)<1e-7&&Math.abs(effects.fame-1)<1e-7&&Math.abs(effects.rel-.2)<1e-7,effects);
    const after=JSON.stringify([S.morale,S.fame,repInit(S).rel]);A.press({i:'0'});
    check('answer cannot award twice',JSON.stringify([S.morale,S.fame,repInit(S).rel])===after);
    const box=document.createElement('div');box.innerHTML=pressHTML(UI.wk.press);
    check('active UI shows actual capped effects',box.textContent.includes('Morale +1')&&box.textContent.includes('Fame +1')&&box.textContent.includes('Team +0.2'),box.textContent);
    reset();
    const team=myTeam(), former=S.teams.find(t=>t.id!==team.id);
    pushNews(S,{k:'psign',n:me().name,t:team.id,f:former.id,y:1,mv:true,reserve:true,s:2,r:0});
    check('reserve signing never claims a race-seat contract',/reserve driver/.test(newsStory(S.news[0]).head));
    pushNews(S,{k:'rookie',n:'Young Rookie',t:team.id,s:2,r:0});
    check('rookie debut uses explicit contract season',newsStory(S.news[0]).sub.includes('Season 2')&&!newsStory(S.news[0]).sub.includes('next season'));
    pushNews(S,{k:'eng',t:team.id,to:'New Supplier',f:'Old Supplier',s:2,r:0});
    check('engine switch uses correct effective season',newsStory(S.news[0]).sub.includes('Season 2')&&!newsStory(S.news[0]).sub.includes('ends after this winter'));
    const clone=JSON.parse(JSON.stringify(S));clone.teams[team.id].name='Other World';
    pushNews(clone,{k:'upg',t:team.id,p:'aero',g:1});
    check('news capture uses supplied save, not another global world',newsStory(clone.news[0]).head.includes('Other World'));
    reset();S.round=S.cal.length-1;me().pts=100;S.drivers.find(d=>d.id!==S.pi).pts=99;
    const closeTitle=fnlPreText();
    check('narrow title lead does not promise any finish guarantees title',!closeTitle.includes('Bring it home and we are champions'),closeTitle);
    S.drivers.forEach(d=>d.pts=0);me().pts=100;
    check('clinched championship recognised before final race',fnlPreText().includes('already secured'));
    check('generic race-win headlines never award world title',HEAD.win.every(h=>!/champion/i.test(h)));
    reset();S.morale=0;S.fame=0;repInit(S).rel[me().team]=-10;
    const negative=pressApply(S,PRESS.bad.o[2],false);
    check('lower caps also report actual changes',negative.mor===0&&negative.rel===0&&negative.fame===2,negative);
    reset();S.morale=50;S.fame=10;
    const ordinary=pressApply(S,PRESS.win.o[0],false);
    reset();S.morale=50;S.fame=10;
    const home=pressApply(S,PRESS.win.o[0],true);
    check('home conference doubles fame only',home.fame===ordinary.fame*2&&home.mor===ordinary.mor&&home.rel===ordinary.rel);
    reset();S.season=2;S.pre={s:2,kind:'std',ctx:{tg:5},done:null};S.morale=99;S.fame=99;repInit(S).rel[me().team]=9.8;
    A['pre-a']({i:'0'});const preEffects=JSON.stringify(S.pre.effects);const preState=JSON.stringify([S.morale,S.fame,repInit(S).rel]);
    A['pre-a']({i:'0'});check('pre-season answer cannot award twice',JSON.stringify([S.morale,S.fame,repInit(S).rel])===preState);
    S=JSON.parse(JSON.stringify(S));check('pre-season actual effects persist through save roundtrip',JSON.stringify(S.pre.effects)===preEffects);
    reset();rnd=random;seedRnd(20261107);sitStart(S,me().team);S.season=2;S.round=0;S.pre=null;
    const makePre=preMake;let asked=0;preMake=function(state){asked++;return makePre(state);};
    try{render();}finally{preMake=makePre;}
    check('reserve player is not asked stand-in preseason questions',asked===0);
    reset();S.cal=[0];S.round=0;S.drivers[0].pts=50;
    pushNews(S,{k:'race',c:'Final',s:1,r:1,w:[0,1,2],me:12});
    check('last-round article declares championship outcome',newsStory(S.news[0]).sub.includes('wins the championship'));
    S.round=1;check('completed calendar produces no upcoming race',!newsAuto().some(n=>n.k==='preview'));
    reset();
    S.rr=[{s:1,r:0,ci:0,c:[[S.drivers[0].name,0,1,25,1,0,''],[S.drivers[1].name,0,2,18,2,0,''],[S.drivers[2].name,1,0,0,3,0,'']]}];
    pushNews(S,{k:'race',c:'Short Podium',s:1,r:1,w:[0,1],me:0});A['nw-open']({v:String(S.news[0].id)});
    check('article modal never puts DNF on podium',document.querySelectorAll('.nwpod > div').length===2);
   } finally {S=JSON.parse(original);rnd=random;UI.wk=null;closeModal();}
   return rows;
  });
  // One actual weekend through the engine, then click the active conference UI.
  await pg.clock.install();
  const weekend=await pg.evaluate(()=>{
   S.settings.ask=false;S.settings.mini=false;render();A['wk-start']();A['q-fin']();A['q-next']();A['s-go']();stopRace();RUN.fast=true;RUN.auto=true;
   const saved={mechK:P2.mechK,mistK:P2.mistK};P2.mechK=P2.mistK=0;
   try {for(let i=0;i<4000&&!RUN.R.done;i++)stepOne(RUN.R);finishRun(RUN.R);A['r-done']();}
   finally {Object.assign(P2,saved);}
   if(!UI.wk.press){const random=rnd;rnd=()=>0.1;try{UI.wk.press=pressMake(S,UI.wk.rep.P,UI.wk.R.ci);}finally{rnd=random;}render();}
   const n=S.news.find(n=>n.k==='race'),entry=S.rr.at(-1),headline=UI.wk.headline;
   render();
   return {done:RUN.R.done,story:newsStory(n),id:n.id,entry,headlineStable:UI.wk.headline===headline,pos:UI.wk.rep.P.pos,dnf:UI.wk.rep.P.dnf};
  });
  const winner=weekend.entry.c.find(r=>r[2]===1);
  rows.push({name:'real weekend story matches committed race winner',pass:weekend.done&&winner&&weekend.story.head.includes(winner[0].split(' ').at(-1))});
  rows.push({name:'result headline stays stable on repaint',pass:weekend.headlineStable});
  await pg.clock.runFor(800);
  await pg.locator('[data-act=press]').first().click();
  rows.push({name:'real conference answer renders and records actual effects',pass:await pg.evaluate(()=>UI.wk.press.done===0&&!!UI.wk.press.effects&&document.querySelector('.pcf-a')!==null)});
  await pg.reload();
  await pg.clock.runFor(800);
  await pg.locator('[data-act=continue]').click();
  rows.push({name:'real race news survives browser reload',pass:await pg.evaluate(({id,story})=>JSON.stringify(newsStory(S.news.find(n=>n.id===id)))===JSON.stringify(story),{id:weekend.id,story:weekend.story})});
  rows.forEach(r=>console.log(r.pass?'PASS':'FAIL',r.name,r.data?JSON.stringify(r.data):''));
  if(process.env.QA_PRESS_NEWS_REPORT)fs.writeFileSync(process.env.QA_PRESS_NEWS_REPORT,JSON.stringify(rows,null,2)+'\n');
  const failures=rows.filter(r=>!r.pass).map(r=>r.name);console.log('ERRS',JSON.stringify(errors.concat(failures)));
  assert.equal(errors.length+failures.length,0);
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
