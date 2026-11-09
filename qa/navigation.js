const {chromium}=require('playwright');
const {assert,chooseStyle,clickUI,signOffer}=require('./flow');
const {pathToFileURL}=require('node:url');
const path=require('node:path'),fs=require('node:fs');
(async()=>{
 const b=await chromium.launch(),errors=[],rows=[];
 const check=(name,pass,data)=>rows.push({name,pass:!!pass,data});
 try{
  const pg=await b.newPage({viewport:{width:390,height:844}});pg.on('pageerror',e=>errors.push(e.message));
  await pg.clock.install();await pg.goto(pathToFileURL(path.resolve(__dirname,'../index.html')).href);
  await pg.evaluate(()=>{seedRnd(605006);A.new();A['career-mode']({v:'classic'});A['new-go']();});await chooseStyle(pg,true);
  await pg.evaluate(()=>{S.settings.mini=false;S.settings.ask=false;simulateWeekend(S);save();render();});
  check('pit wheel labels are English',await pg.evaluate(()=>PTYS.join('|')==='FL|FR|RL|RR'));
  check('onboarding and training prompts use English destinations',await pg.evaluate(()=>['hub:utama','hub:musim','hub:kerjaya'].map(k=>TIPS[k][0]).join('|')==='Home|Season|Career'&&!/\bAku\b/.test(TIPS['wk:quali'][1]+onbStyleHTML()+xpNudgeHTML())));
  const nav=(id)=>`${pg.viewportSize().width>=900?'.snav nav':'.bnav'} [data-act=tab][data-v=${id}]`;
  for(const viewport of [{width:390,height:844},{width:320,height:568},{width:1280,height:900}]){
   await pg.setViewportSize(viewport);await pg.clock.runFor(100);
   const initial=await pg.evaluate(()=>JSON.stringify([S.round,S.xp,S.career,S.results]));
   for(const [id,label] of [['utama','Home'],['musim','Season'],['aku','Driver'],['team','Team'],['kerjaya','Career']]){
    await clickUI(pg,nav(id),true);
    if(await pg.locator('[data-act=tip-ok]').count())await clickUI(pg,'[data-act=tip-ok]',true);
    const state=await pg.evaluate(()=>({tab:UI.tab,width:document.documentElement.scrollWidth,labels:[...document.querySelectorAll(matchMedia('(min-width:900px)').matches?'.snav nav button':'.bnav button')].map(b=>b.textContent.trim()),active:document.querySelectorAll(matchMedia('(min-width:900px)').matches?'.snav nav button.on':'.bnav button.on').length,actions:[...document.querySelectorAll('.hmain [data-act]')].map(e=>e.dataset.act),text:document.querySelector('.hmain').textContent}));
    check(`${viewport.width} ${label}: main destinations and one active tab`,state.tab===id&&state.active===1&&state.labels.join('|')===('Home|Season|Driver|Team|Career'+(viewport.width>=900?'|Settings':'')));
    check(`${viewport.width} ${label}: English menu text`,!/\b(Utama|Musim|Aku|Kerjaya|Kalendar|Keputusan|Kedudukan|Sejarah)\b/.test(state.text));
    check(`${viewport.width} ${label}: no page-width overflow`,state.width<=viewport.width,{width:state.width});
    if(id==='utama')check(`${viewport.width}: next race accessible in Home`,state.actions.includes('wk-start'));
    if(id==='aku')check(`${viewport.width}: skills accessible in Driver and settings moved out`,state.actions.includes('buy')&&!state.actions.includes('ask')&&!state.actions.includes('export'));
    if(id==='team')check(`${viewport.width}: team profile, R&D and teammate remain accessible`,state.actions.includes('tprof')&&state.actions.includes('rd')&&state.text.includes('Teammate'));
    if(id==='kerjaya')check(`${viewport.width}: contract/sponsors/career remain accessible`,state.text.includes('Current contract')&&state.text.includes('Career stats')&&state.text.includes('Fame'));
    if(process.env.QA_NAV_DIR){await pg.screenshot({path:path.join(process.env.QA_NAV_DIR,`${viewport.width}-${id}.png`),fullPage:true});if(id==='utama'&&viewport.width<900)await pg.screenshot({path:path.join(process.env.QA_NAV_DIR,`${viewport.width}-utama-view.png`)});}
   }
   if(viewport.width<900)check(`${viewport.width}: season/round label fits header`,await pg.locator('.hub-season-short').evaluate(el=>el.getBoundingClientRect().right<=el.parentElement.getBoundingClientRect().right+1));
   check(`${viewport.width}: navigation never awards XP or changes results`,await pg.evaluate(()=>JSON.stringify([S.round,S.xp,S.career,S.results]))===initial);
   await clickUI(pg,nav('musim'),true);
   for(const section of ['calendar','results','standings','news','history']){
    await clickUI(pg,`[data-act=hub-section][data-v=${section}]`,true);
    check(`${viewport.width}: Season ${section} opens`,await pg.evaluate(section=>UI.musimView===section&&document.querySelectorAll('.hub-sections .on').length===1&&[...document.querySelectorAll('.hub-sections button')].map(b=>b.textContent).join('|')==='Calendar|Results|Standings|News|History',section));
   }
   await clickUI(pg,'[data-act=hub-settings]',true);
   const settings=await pg.locator('#career-settings').boundingBox();
   check(`${viewport.width}: header Settings reaches settings panel`,await pg.evaluate(()=>UI.tab==='settings')&&settings.width>0);
  }
  await pg.setViewportSize({width:390,height:844});
  await clickUI(pg,nav('aku'),true);await pg.evaluate(()=>{S.xp=60;render();});
  const skill=await pg.evaluate(()=>({value:me().pace,xp:S.xp,cost:skillCost(me().pace,S)}));await clickUI(pg,'[data-act=buy][data-k=pace]',true);
  check('training purchase applies exactly once after menu move',await pg.evaluate(skill=>me().pace===skill.value+1&&S.xp===skill.xp-skill.cost,skill));
  await clickUI(pg,'[data-act=hub-settings]',true);
  const ask=await pg.evaluate(()=>S.settings.ask);await clickUI(pg,'[data-act=ask]',true);
  check('settings toggle still changes the real saved setting',await pg.evaluate(ask=>S.settings.ask===!ask&&loadSave().settings.ask===!ask,ask));
  await clickUI(pg,'[data-act=export]',true);
  const code=await pg.locator('#exp').inputValue(),exported=JSON.parse(Buffer.from(code,'base64').toString('utf8'));
  check('export remains functional from Settings',exported.round===1&&exported.saveVer===2);
  await pg.clock.runFor(800);await clickUI(pg,'#modal [data-act=mclose]',true);
  await clickUI(pg,'[data-act=glossary]',true);check('glossary remains reachable',await pg.locator('#modal > *').count()===1);await pg.evaluate(()=>closeModal());
  await clickUI(pg,nav('team'),true);await clickUI(pg,'[data-act=rd][data-v=engine]',true);
  check('R&D selection remains functional in Team',await pg.evaluate(()=>S.rd==='engine'&&loadSave().rd==='engine'));
  await pg.evaluate(()=>{S.sponOffers=[{n:'Menu Test',v:1.5,yrs:2,need:{k:'fin',n:1}}];});await clickUI(pg,nav('kerjaya'),true);
  await clickUI(pg,'[data-act=spon-yes][data-i="0"]',true);
  check('sponsor signing remains functional in Career',await pg.evaluate(()=>sponActive(S).some(d=>d.n==='Menu Test')&&S.sponOffers.length===0));
  const aliases=[['saya','aku'],['pemandu','aku'],['kereta','team'],['kal','musim'],['kej','musim'],['news','musim'],['kerjaya','kerjaya']];
  for(const [old,now]of aliases){await pg.evaluate(old=>A.tab({v:old}),old);check('legacy shortcut '+old+' still resolves',await pg.evaluate(now=>UI.tab===now,now));}
  // Real existing save states: Pro, Junior, reserve and contract-market.
  const dir=path.resolve(__dirname,'../../outputs/baseline/saves');
  for(const file of ['05-classic-junior-new.json','04-classic-reserve.json']){
   const data=JSON.parse(fs.readFileSync(path.join(dir,file),'utf8'));
   await pg.evaluate(data=>{S=migrate(data);UI.wk=null;UI.screen='hub';UI.tab='utama';render();},data);if(await pg.locator('[data-act=onb-style]').count())await chooseStyle(pg,true);else await pg.evaluate(()=>closeModal());
   for(const id of ['utama','musim','aku','team','kerjaya']){await clickUI(pg,nav(id),true);check(file+': '+id+' accessible',await pg.evaluate(id=>UI.tab===id,id));}
   if(data.sit){
    await clickUI(pg,nav('aku'),true);check('reserve Driver trains player instead of stand-in',await pg.locator('[data-act=buy]').count()===0&&await pg.locator('[data-act=sit-focus]').count()===5);
    const stand=await pg.evaluate(()=>JSON.stringify(S.drivers[S.pi]));await clickUI(pg,'[data-act=sit-focus][data-k=wet]',true);
    check('reserve training focus changes without editing stand-in',await pg.evaluate(stand=>S.sit.focus==='wet'&&JSON.stringify(S.drivers[S.pi])===stand,stand));
    await clickUI(pg,nav('utama'),true);check('reserve advancement remains in Home',await pg.locator('[data-act=sit-next]').count()===1&&await pg.locator('[data-act=sit-ff]').count()===1);
   }
  }
  const market=JSON.parse(fs.readFileSync(path.join(dir,'03-classic-f1-market.json'),'utf8'));
  await pg.evaluate(data=>{S=migrate(data);UI.screen='hub';UI.tab='kerjaya';render();closeModal();},market);
  await clickUI(pg,'[data-act=season-end]',true);
  check('Career Review offers opens existing market flow',await pg.evaluate(()=>UI.screen==='season')&&await pg.locator('[data-act=sign-pre]').count()>0);
  await signOffer(pg,false,true);check('signing through Career returns to Home',await pg.evaluate(()=>UI.tab==='utama'&&S.season===2));
  const pro=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../../outputs/phase4/pro-f1-start.json'),'utf8'));
  await pg.evaluate(data=>{S=migrate(data);UI.screen='hub';UI.tab='musim';UI.musimView='calendar';render();closeModal();},pro);
  check('Pro retains all 22 calendar entries under Season',await pg.locator('.krow.big').count()===22&&await pg.evaluate(()=>document.body.textContent.includes('/22')));
  if(process.env.QA_NAV_DIR)await pg.screenshot({path:path.join(process.env.QA_NAV_DIR,'390-pro-musim.png'),fullPage:true});
  const failures=rows.filter(r=>!r.pass).map(r=>r.name);rows.forEach(r=>console.log(r.pass?'PASS':'FAIL',r.name,r.data?JSON.stringify(r.data):''));
  if(process.env.QA_NAV_DIR)fs.writeFileSync(path.join(process.env.QA_NAV_DIR,'results.json'),JSON.stringify(rows,null,2)+'\n');
  console.log('ERRS',JSON.stringify(errors.concat(failures)));assert.equal(errors.length+failures.length,0);
 }finally{await b.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
