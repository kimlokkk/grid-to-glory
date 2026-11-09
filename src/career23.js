'use strict';
/* F1 career closure. Idle years never pass through player race rewards. */
var CAREER9_HOF='gtg-hall-v1';
function careerCopy(x){return JSON.parse(JSON.stringify(x));}
function careerCommit(g,d){Object.keys(g).forEach(function(k){delete g[k];});Object.assign(g,d);}
function careerInit(g){
 if(g.mode!=='pro')return;
 if(!g.career9)g.career9={version:1,worldId:'world-'+Math.floor(hashS(g.playerUid+'|'+progressionPlayer(g).name+'|'+g.meta.rng)*1e10),comeback:{used:!!g.sit,legacy:!!g.sit},receipts:{},totals:{},rivals:[],mentorSeason:null};
 g.hallOfFame=g.hallOfFame||[];careerTotals(g);
 if(g.playerRetired&&!g.career9.retirement)careerRetire(g,progressionPlayer(g).age>=AGEING.retireAt?'Compulsory retirement at age '+AGEING.retireAt:'Retired in an earlier save');
 if(!g.playerRetired&&!g.sit&&g.lastSummary&&g.round>=seasonRounds(g)&&!careerRetirementDue(g)&&(g.offers!==null||g.contract<=1||g.fired)&&(!g.market8.window||g.market8.window.season!==g.season))marketOpen(g);
}
function careerTotals(g){
 var c=g.career9;if(!c)return;
 (g.rr||[]).forEach(function(r){var l=r.league||progressionPlayer(g).legacyLeague||'f1',key=r.key||l+':'+r.s+':'+r.r;if(c.receipts[key])return;
  var x=(r.c||[]).filter(function(x){return x[7]===g.playerUid||!x[7]&&x[5]===1;})[0];if(!x)return;c.receipts[key]=true;
  var t=c.totals[l]=c.totals[l]||{starts:0,wins:0,pods:0,poles:0,points:0,dnf:0};t.starts++;t.points+=x[3]||0;if(!x[2])t.dnf++;if(x[2]===1)t.wins++;if(x[2]>0&&x[2]<=3)t.pods++;if(x[4]===1)t.poles++;
 });
}
function careerNoSeat(g){var w=g.market8&&g.market8.window;return g.mode==='pro'&&!g.playerRetired&&leagueOf(g)==='f1'&&!g.sit&&g.round>=seasonRounds(g)&&(g.contract<=1||g.fired)&&w&&w.season===g.season&&!w.signed&&w.round===3&&!w.offers.some(function(o){return o.status==='open';});}
function careerCanComeback(g){return careerNoSeat(g)&&!g.career9.comeback.used&&progressionPlayer(g).age+1<AGEING.retireAt;}
function careerIdleTraining(g,focus,from){
 var p=progressionPlayer(g),slot=g.drivers[g.pi],bench=g.bench,sit=g.sit,round=g.round,plan={mode:p.training.mode,slots:p.training.slots.slice(),intensity:p.training.intensity},abilities=careerCopy(p.abilities);
 try{
  /* The regular skill purchase function reads the active slot. This is a training-only swap. */
  g.drivers[g.pi]=p;g.bench=null;g.sit=null;p.training.mode='manual';p.training.slots=[focus,'recovery','recovery'];p.training.intensity='normal';p.mind.locked=null;
  for(var r=from||0;r<seasonRounds(g);r++){g.round=r;trainingPrepare(g);}
  p.mind.momentum=0;p.mind.locked=null;
 }finally{g.drivers[g.pi]=slot;g.bench=bench;g.sit=sit;g.round=round;p.training.mode=plan.mode;p.training.slots=plan.slots;p.training.intensity=plan.intensity;p.abilities=abilities;}
}
function careerComebackPreview(g,focus){
 if(!TRAINING.focuses[focus]||focus==='recovery'||!careerCanComeback(g))return null;
 var d=careerCopy(g),p=progressionPlayer(d),before=PROGRESSION.stats.map(function(k){return p[k];}),fitness=p.body.fitness,age=p.age,xp=d.xp;
 applyAnnualChange(d);d.season++;d.round=0;d.lastSummary=null;careerIdleTraining(d,focus,0);
 return {focus:focus,ageBefore:age,age:p.age,fitnessBefore:fitness,fitness:p.body.fitness,xpBefore:xp,xp:d.xp,rows:PROGRESSION.stats.map(function(k,i){return {k:k,before:before[i],after:p[k]};})};
}
function careerRestoreBench(g){
 var p=g.bench;if(!p)return;
 var index=g.drivers.findIndex(function(d){return d.stand&&(!d.con||d.con.end<=g.season);});
 if(index<0)index=g.drivers.findIndex(function(d){return !d.con||d.con.end<=g.season;});
 if(index<0)throw new Error('No expiring slot for the uncontracted driver');
 var sd=g.drivers[index];p.team=sd.team;sd.stand=false;sd.team=-1;sd.id=-1;sd.con=null;g.reserves.push(sd);g.pi=index;p.id=index;g.drivers[index]=p;g.bench=null;g.sit=null;
 g.drivers.concat(g.reserves).forEach(function(d){d.stand=false;});
 var numbers={};g.drivers.forEach(function(d){if(d!==p)numbers[d.num]=true;});if(numbers[p.num]){var n=1;while(numbers[n])n++;p.num=n;}
 p.pts=0;p.wins=0;p.pods=0;p.fp=[];p.con={len:0,end:g.season,pay:0};g.contract=0;g.rival=null;
}
function careerIdleReview(g,focus,preview){
 var p=progressionPlayer(g),team=p.team;
 g.hist.push({season:g.season,league:'f1',inactive:true,reserve:true,pos:null,pts:0,wins:0,pods:0,team:g.teams[team].short,tcol:g.teams[team].color,age:p.age});
 careerRestoreBench(g);sponEval(g);g.round=seasonRounds(g);g.lastSummary={rec:g.hist[g.hist.length-1],ds:driverStandings(g).map(function(d){return d.id;}),ts:teamStandings(g).map(function(t){return t.id;})};
 g.career9.comeback={used:true,legacy:false,season:g.season,focus:focus,preview:preview};g.market8.window=null;g.market8.scoutKey=null;g.offers=[];g.fired=null;
 /* No race evidence for this year: retain protected tier and assess current condition. */
 if(careerRetirementDue(g)){g.offers=[];careerRetire(g,'Compulsory retirement before age '+AGEING.retireAt);}else{marketOpen(g);marketNews(g,p.name+' seeks an F1 comeback','A year of training is complete. Age, current ability, past results and real vacancies decide the next contract; no seat is guaranteed.');}
 foundationInit(g);worldValidate(g);
}
function careerStandIn(g,team){
 var league=leagueOf(g),d=g.reserves.shift();
 if(!d&&league!=='f1')d=worldRookie(g,'f3',false);
 if(!d){
  var f2=worldView(g,'f2'),f3=worldView(g,'f3');d=f2.drivers.filter(worldQualifiesF1).sort(function(a,b){return worldRankCandidate(b)-worldRankCandidate(a);})[0];if(!d)throw new Error('No experienced replacement');
  var i=f2.drivers.indexOf(d),j=f3.drivers.findIndex(function(x){return x.age>=17;}),graduate=f3.drivers[j];if(!graduate)throw new Error('No F3 replacement');
  var rookie=worldRookie(g,'f3',false);rookie.id=j;rookie.team=graduate.team;rookie.teamKey=graduate.teamKey;rookie.num=graduate.num;rookie.code=mkCode(rookie.name,{});rookie.fp=[];f3.drivers[j]=rookie;
  graduate.id=i;graduate.team=d.team;graduate.teamKey=d.teamKey;graduate.num=d.num;graduate.fp=[];f2.drivers[i]=graduate;
 }
 d.id=g.pi;d.team=team;d.num=mktNum(g);d.fp=d.fp||[];d.code=d.code||mkCode(d.name,usedCodes(g));return d;
}
function careerWorldWinter(g){
 var league=leagueOf(g);g.drivers.forEach(function(d){d.age++;});worldNewSeason(g,[]);
 if(league==='f1'){ensureDev(g);devWinter(g,[]);}else worldJuniorWinter(g,[]);
 g.teams.forEach(function(t){t.pts=0;t.wins=0;});g.season++;g.round=0;g.cal=seasonCalendar(g);
}
function careerComeback(g,focus){
 var preview=careerComebackPreview(g,focus);if(!preview)return false;
 var d=careerCopy(g),prior=_s;
 try{
  d.career9.comeback.used=true;worldPrepareAnnual(d);applyAnnualChange(d);
  var p=progressionPlayer(d),stand=careerStandIn(d,p.team);stand.id=d.pi;stand.stand=true;stand.con={len:1,end:d.season,pay:.5};d.drivers[d.pi]=stand;d.bench=p;d.sit={s:d.season+1,team:p.team,focus:'pace'};
  careerWorldWinter(d);d.contract=0;d.results=[];d.lastSummary=null;
  careerIdleTraining(d,focus,0);
  ['f1','f2','f3'].forEach(function(l){worldSimulate(d,l);});d.world.prepared=d.season;
  careerIdleReview(d,focus,preview);careerCommit(g,d);return true;
 }catch(e){seedRnd(prior);throw e;}
}
function careerLegacyIdle(g,focus){
 if(g.mode!=='pro'||!g.sit||!g.bench||g.career9.comeback.season===g.season)return false;
 var d=careerCopy(g),prior=_s;
 try{var start=d.round;careerIdleTraining(d,TRAINING.focuses[focus]?focus:'simulator',start);while(d.round<seasonRounds(d))sitRace(d);worldPrepareAnnual(d);careerIdleReview(d,focus,null);careerCommit(g,d);return true;}catch(e){seedRnd(prior);throw e;}
}
function careerMentor(g){
 var p=progressionPlayer(g),mate=mateOf(g,p);if(g.mode!=='pro'||g.playerRetired||g.sit||p.age<35||!mate||mate.age>24||g.career9.mentorSeason===g.season||g.round>=seasonRounds(g))return false;
 g.career9.mentorSeason=g.season;mate.mentor={season:g.season,from:p.uid};tmAdd(g,1);marketNews(g,p.name+' mentors '+mate.name,'Garage rapport improves. The younger teammate receives a small, bounded development benefit at the annual review.');return true;
}
function careerHallRead(){try{var a=JSON.parse(localStorage.getItem(CAREER9_HOF)||'[]');return Array.isArray(a)?a.filter(function(e){return e&&typeof e.id==='string'&&e.driver&&e.career;}):[];}catch(e){return [];}}
function careerHallMerge(a,b){var out=a.slice();b.forEach(function(e){if(!out.some(function(x){return x.id===e.id;}))out.push(e);});return out;}
function careerHallStore(g){var entries=careerHallMerge(careerHallRead(),g.hallOfFame||[]);g.hallOfFame=entries;try{localStorage.setItem(CAREER9_HOF,JSON.stringify(entries));return true;}catch(e){return false;}}
function careerLegacyBonus(entries){return entries.reduce(function(n,e){var score=e.legacy&&e.legacy.score;return Math.max(n,Number.isFinite(score)?score>=300?10:score>=100?5:0:0);},0);}
function careerLegacyScore(g){
 var h=(g.hist||[]).filter(function(r){return !r.inactive&&!r.reserve;}),f=h.filter(function(r){return (r.league|| (r.jr?'f2':'f1'))==='f1';}),j=h.filter(function(r){return r.league==='f2'||r.league==='f3'||r.jr;});
 var titles=Math.max(g.career.titles||0,f.filter(function(r){return r.pos===1;}).length),jtitles=Math.max(g.career.juniorTitles||0,j.filter(function(r){return r.pos===1;}).length);
 var normalized=f.reduce(function(s,r){var n=r.rounds|| (g.mode==='pro'?22:10);return s+Math.min(1,(r.wins||0)/n)*30+Math.min(1,(r.pods||0)/n)*10;},0);
 var score=Math.round(titles*100+jtitles*15+normalized),bonus=score>=300?10:score>=100?5:0;
 return {score:score,f1Titles:titles,juniorTitles:jtitles,bonusXP:bonus};
}
function careerRetire(g,reason){
 if(g.mode!=='pro')return false;if(g.career9.retirement)return g.career9.retirement;
 if(!g.sit&&g.round>=seasonRounds(g)&&!g.lastSummary&&!g.hist.some(function(r){return r.season===g.season&&(r.league||'f1')===leagueOf(g);}))endSeason(g);
 if(careerRetirementDue(g)&&g.round>=seasonRounds(g)&&progressionPlayer(g).age<AGEING.retireAt)applyAnnualChange(g);
 careerTotals(g);var p=progressionPlayer(g),legacy=careerLegacyScore(g);
 var e={id:g.career9.worldId+':'+p.uid,world:g.career9.worldId,driver:careerCopy(p),season:g.season,round:g.round,reason:reason||'Voluntary retirement',career:careerCopy(g.career),leagues:careerCopy(g.career9.totals),history:careerCopy(g.hist),races:careerCopy(g.rr||[]),teams:g.teams.map(function(t){return {key:t.key,name:t.name,history:careerCopy(t.sh||[])};}),rivals:careerCopy(g.career9.rivals),legacy:legacy};
 g.playerRetired=true;g.career9.retirement=e;g.hallOfFame=careerHallMerge(g.hallOfFame||[],[e]);marketNews(g,p.name+' retires',e.reason+'. The completed career and its records are preserved in the Hall of Fame.');return e;
}
function careerCloseSeason(g){
 if(g.mode!=='pro')return;var p=progressionPlayer(g),c=g.career9;
 if(g.rival&&!c.rivals.some(function(r){return r.season===g.season;})){var d=g.drivers[g.rival.di];if(d)c.rivals.push({season:g.season,uid:d.uid,name:d.name,w:g.rival.w,l:g.rival.l});}
 if(p.age>=38)c.veteran=true;
}
/* Continue the same world at the next season; never reroll existing people or teams. */
function careerSuccessor(g,uid,name,arch){
 if(g.mode!=='pro'||!g.playerRetired||!g.career9.retirement||!PROGRESSION.caps[arch])return false;
 if(!uid&&(!name||name.trim().length<2||allNames(g)[name.trim()]))return false;
 var d=careerCopy(g),prior=_s,retiree=progressionPlayer(d),oldLeague=leagueOf(d),oldSlot=d.pi;
 try{
  if(!d.bench){var stand=careerStandIn(d,retiree.team);stand.id=oldSlot;stand.stand=true;stand.con={len:1,end:d.season,pay:.5};d.drivers[oldSlot]=stand;d.bench=retiree;d.sit={s:d.season,team:retiree.team,focus:'pace'};}
  if(d.world.prepared!==d.season){worldSimulate(d,oldLeague,d.round);['f1','f2','f3'].forEach(function(l){if(l!==oldLeague)worldSimulate(d,l);});d.world.prepared=d.season;}
  careerWorldWinter(d);d.world.leagues[oldLeague]=worldView(d,oldLeague);
  var targetLeague='f3',target=worldView(d,'f3'),p;
  if(uid){['f3','f2'].some(function(l){var v=worldView(d,l),found=v.drivers.filter(function(x){return x.uid===uid;})[0];if(found){p=found;target=v;targetLeague=l;return true;}return false;});if(!p){seedRnd(prior);return false;}}
  else{
   p=target.drivers.filter(function(x){return x.age===16&&!x.worldHistory.length;})[0];
   if(!p){p=worldRookie(d,'f3',false);var displaced=target.drivers[target.drivers.length-1];p.team=displaced.team;displaced.team=-1;displaced.id=-1;target.reserves.push(displaced);target.drivers[target.drivers.length-1]=p;}
   p.name=name.trim();d.world.names[p.name]=true;p.pot=90;p.pk=28;p.nat=retiree.nat;
   PROGRESSION.stats.forEach(function(k){p[k]=66+(ARCHS[arch].b[k]||0);});
  }
  worldArchive(d,retiree,'Retired',oldLeague);delete d.world.leagues[targetLeague];
  var bonus=careerLegacyBonus(d.hallOfFame||[]);
  var n={v:2,mode:'pro',league:targetLeague,meta:d.meta,season:d.season,round:0,pi:target.drivers.indexOf(p),playerUid:p.uid,contract:1,xp:8+bonus,rd:'aero',results:[],rdLog:[],hist:[],career:{starts:0,wins:0,pods:0,poles:0,pts:0,fl:0,titles:0,dnf:0},arch:arch,teams:target.teams,drivers:target.drivers,reserves:target.reserves,retired:d.retired,world:d.world,people:d.people,events:d.events,wallet:{balance:0,ledger:[]},settings:d.settings,tips:d.tips,tut:d.tut,news:[],rr:[],hallOfFame:d.hallOfFame,regYear:d.world.era.next,career9:{version:1,worldId:d.career9.worldId,comeback:{used:false},receipts:{},totals:{},rivals:[],mentorSeason:null,legacyPackage:bonus}};
  p.id=n.pi;p.con={len:1,end:n.season,pay:targetLeague==='f2'?.15:.05};p.obj=null;p.miss=0;
  if(uid){n.hist=(p.worldHistory||[]).map(function(r){return {season:r.season,league:r.league,pos:r.pos,pts:r.points,wins:r.wins,pods:0,team:r.teamKey,champ:'',champTeam:'',age:null};});n.career.starts=p.starts||0;n.career.wins=(p.worldHistory||[]).reduce(function(s,r){return s+(r.wins||0);},0);n.career.juniorTitles=n.hist.filter(function(r){return r.pos===1;}).length;}
  n.cal=seasonCalendar(n);foundationInit(n);worldAssign(n,targetLeague,n.drivers,n.teams,n.season);objAssign(n,n.season);foundationInit(n);worldValidate(n);marketNews(n,p.name+' begins a new career','A new chapter in the same racing world. One bounded legacy package applies; the retired driver’s money and skills are not inherited.');careerCommit(g,n);return true;
 }catch(e){seedRnd(prior);throw e;}
}
function comebackHTML(){
 if(!careerNoSeat(S))return '';var c=S.career9.comeback;
 if(!careerCanComeback(S))return '<div class="card stack"><h3>Career decision</h3><p>'+(c.used?'Your one comeback opportunity has been used. No race contract is available after this market.':'The age limit leaves no eligible comeback year.')+'</p><button class="btn pri" data-act="retire">Close career and view Hall of Fame</button></div>';
 var focus=UI.comebackFocus||'simulator',v=careerComebackPreview(S,focus);
 return '<div class="card stack"><h3>One comeback year</h3><p>Train, then skip directly to next winter’s market. A return seat is not guaranteed. Existing XP pays for skill training; there are no race rewards or invented results.</p><div class="row">'+['simulator','racecraft','fitness'].map(function(k){return '<button class="btn sm '+(focus===k?'on':'')+'" data-act="comeback-focus" data-v="'+k+'">'+TRAINING.focuses[k]+'</button>';}).join('')+'</div><p>Age '+v.ageBefore+' → '+v.age+' · Fitness '+v.fitnessBefore.toFixed(1)+' → '+v.fitness.toFixed(1)+' · XP '+v.xpBefore+' → '+v.xp+'</p><p>'+v.rows.map(function(r){return ATTRN[r.k]+' '+r.before+' → '+r.after;}).join(' · ')+'</p><button class="btn pri" data-act="comeback-go" data-v="'+focus+'">Take the comeback year</button></div>';
}
function careerHallHTML(entries){return '<div class="card stack"><h2>Hall of Fame</h2><div class="row"><button class="btn sm" data-act="hall-export">Export Hall of Fame</button><button class="btn sm" data-act="hall-import">Restore backup</button></div><p>Export your save to back up these records. Browser storage can be lost if site data is cleared.</p>'+(!entries.length?'<p>No retired careers recorded yet.</p>':entries.map(function(e){return '<details><summary>'+esc(e.driver.name)+' · '+e.legacy.f1Titles+' F1 titles · legacy '+e.legacy.score+'</summary><p>'+esc(e.reason)+' · age '+e.driver.age+' · Season '+e.season+'</p><p>'+e.career.starts+' career starts · '+e.career.wins+' wins · '+(e.legacy.juniorTitles||0)+' junior titles</p>'+Object.keys(e.leagues).map(function(l){var t=e.leagues[l];return '<p>Recorded '+l.toUpperCase()+': '+t.starts+' starts · '+t.wins+' wins · '+t.points+' points</p>';}).join('')+'<p class="dim">Older aggregate totals remain in the full backup where detailed race records are unavailable.</p><p>'+e.history.filter(function(r){return !r.inactive&&r.pos===1;}).map(function(r){return 'Season '+r.season+' · '+(r.league|| (r.jr?'f2':'f1')).toUpperCase()+' champion';}).join('<br>')+'</p><p>'+e.rivals.map(function(r){return esc(r.name)+' · '+r.w+'–'+r.l;}).join('<br>')+'</p>'+presentationHallDetails(e)+'</details>';}).join(''))+'</div>';}
var careerOldRetire=vRetire;
vRetire=function(){if(S.mode!=='pro')return careerOldRetire();careerInit(S);var e=careerRetire(S,'Retired'),p=e.driver,nextBonus=careerLegacyBonus(S.hallOfFame),candidates=['f3','f2'].reduce(function(a,l){return a.concat(worldView(S,l).drivers);},[]).filter(function(d){return d.age<=21;});
 return '<div class="top"><div class="brand">Grid to <b>Glory</b></div></div><div class="stack"><div class="card stack"><h2>'+esc(p.name)+' · Career complete</h2><p>'+esc(e.reason)+' · age '+p.age+'</p><div class="chips">'+chip('F1 titles',e.legacy.f1Titles)+chip('Junior titles',e.legacy.juniorTitles)+chip('Legacy score',e.legacy.score)+'</div><p>Career record: '+e.career.starts+' starts · '+e.career.wins+' wins · '+e.career.pods+' podiums.</p><p>Next career bonus: +'+nextBonus+' XP from the highest eligible package only. Money, stats and mastery are not inherited.</p><button class="btn" data-act="export">Export full save / Hall of Fame backup</button></div>'+careerHallHTML(S.hallOfFame)+'<div class="card stack"><h3>Next chapter · same world</h3><p>The world moves to next season. A new rookie starts at 16; a protégé keeps their real age and history.</p><input type="text" id="successor-name" maxlength="36" placeholder="New driver name" aria-label="New driver name"><button class="btn pri" data-act="successor-new">Create a new rookie</button><details><summary>Choose an existing protégé</summary>'+candidates.map(function(d){return '<button class="btn sm" data-act="successor-pick" data-v="'+d.uid+'">'+esc(d.name)+' · age '+d.age+'</button>';}).join('')+'</details><p class="dim">The starting archetype is '+ARCHS[S.arch].n+'. New rookies enter F3; a protégé continues from their junior level.</p></div><button class="btn" data-act="successor-world">Start a new world</button><button class="btn" data-act="menu">Menu</button></div>';};
var careerOldWindow=marketWindowHTML;
marketWindowHTML=function(){return careerOldWindow().replace('Your comeback options will be reviewed at the career transition.','Review the career decision below after the final market round closes.')+comebackHTML();};
var careerOldSeason=vSeason;
vSeason=function(){if(S.mode==='pro'&&S.lastSummary&&S.lastSummary.rec.inactive)return '<div class="stack"><div class="card"><h2>Comeback year complete</h2><p>No races were credited to your career. Review the annual changes for your potential return season and the available contracts below.</p></div>'+annualPreviewHTML()+marketWindowHTML()+'</div>';return careerOldSeason();};
var careerOldEnd=endSeason;
endSeason=function(g){if(g.mode==='pro'&&g.sit){careerLegacyIdle(g,g.sit.focus==='pace'?'simulator':g.sit.focus);return g.lastSummary.rec;}var r=careerOldEnd(g);if(g.mode==='pro')careerCloseSeason(g);return r;};
var careerOldSit=vSit;
vSit=function(embedded){if(S.mode!=='pro')return careerOldSit(embedded);return '<div class="card stack"><h2>Existing reserve year</h2><p>Complete your training year, then review available contracts. Training uses your saved XP; no racing results are credited to you.</p><button class="btn pri" data-act="legacy-comeback">Complete year and review contracts</button></div>';};
var careerOldNext=A['next-season'];
A['next-season']=function(){if(S.mode==='pro'&&careerRetirementDue(S)&&S.round>=seasonRounds(S)){careerRetire(S,'Compulsory retirement before age '+AGEING.retireAt);careerHallStore(S);save();UI.screen='retire';render();return;}return careerOldNext();};
var careerOldRetireAction=A['retire'];
A['retire']=function(){if(S.mode!=='pro')return careerOldRetireAction();careerRetire(S,careerRetirementDue(S)&&S.round>=seasonRounds(S)?'Compulsory retirement before age '+AGEING.retireAt:careerNoSeat(S)?'Career closed after the driver market':'Voluntary retirement');careerHallStore(S);save();closeModal();UI.screen='retire';render();};
A['comeback-focus']=function(d){if(['simulator','racecraft','fitness'].indexOf(d.v)>=0){UI.comebackFocus=d.v;render();}};
A['comeback-go']=function(d){if(careerComeback(S,d.v)){save();UI.screen='season';render();}};
A['legacy-comeback']=function(){if(careerLegacyIdle(S,'simulator')){save();UI.screen='season';render();}};
A['successor-new']=function(){var el=document.getElementById('successor-name');if(careerSuccessor(S,null,el&&el.value,S.arch)){save();UI.screen='hub';UI.tab='utama';render();}else toast('Choose a unique driver name.');};
A['successor-pick']=function(d){if(careerSuccessor(S,d.v,null,S.arch)){save();UI.screen='hub';UI.tab='utama';render();}else toast('That driver is no longer available in the junior ladder. Choose another protégé.');};
A['mentor']=function(){if(careerMentor(S)){save();render();}};
var careerOldCareer=hKerjaya;
hKerjaya=function(){var h=careerOldCareer();if(S.mode!=='pro')return h;if(S.contract===0&&S.career9.comeback.used){var end=h.indexOf('</div>');h='<div class="stack"><div class="card stack"><h3>No current race contract</h3><p>Review the market for your return to F1.</p></div>'+h.slice(end+6);}var p=progressionPlayer(S),mate=mateOf(S,p);return h+(p.age>=38?'<div class="card"><h3>Veteran decision</h3><p>You may continue with a valid seat through age 44, or retire now.</p><button class="btn" data-act="retire">Retire from racing</button></div>':'')+(p.age>=35&&mate&&mate.age<=24?'<button class="btn" data-act="mentor" '+(S.career9.mentorSeason===S.season?'disabled':'')+'>Mentor '+esc(mate.name)+'</button>':'');};
var careerOldMenu=vMenu;
vMenu=function(){return careerOldMenu()+'<div class="stack">'+careerHallHTML(careerHallRead())+'</div>';};

['continue','import-go'].forEach(function(action){var old=A[action];A[action]=function(d){var r=old(d);if(S&&S.mode==='pro'&&(S.hallOfFame||[]).length)careerHallStore(S);return r;};});

A['successor-world']=function(){var el=document.getElementById('successor-name'),name=el&&el.value.trim();if(!name||name.length<2){toast('Enter the new driver name above.');return;}var next=newProCareer(name,S.arch,7,'f3');next.hallOfFame=careerHallMerge(careerHallRead(),S.hallOfFame||[]);next.settings=careerCopy(S.settings);careerCommit(S,next);save();UI.screen='hub';UI.tab='utama';render();};
A['hall-export']=function(){var entries=careerHallMerge(careerHallRead(),S&&S.hallOfFame||[]);showModal('<h2>Hall of Fame backup</h2><p>Keep this backup outside browser storage.</p><textarea id="exp" readonly></textarea><button class="btn" data-act="copy">Copy</button><button class="btn" data-act="mclose">Close</button>');document.getElementById('exp').value=JSON.stringify({kind:'gtg-hall',version:1,entries:entries});};
A['hall-import']=function(){showModal('<h2>Restore Hall of Fame</h2><p>Paste a Hall of Fame backup. Existing careers and records are retained.</p><textarea id="hall-import-data"></textarea><button class="btn pri" data-act="hall-restore">Restore</button><button class="btn" data-act="mclose">Back</button>');};
A['hall-restore']=function(){try{var data=JSON.parse(document.getElementById('hall-import-data').value);if(data.kind!=='gtg-hall'||data.version!==1||!Array.isArray(data.entries)||!data.entries.every(function(e){return e&&typeof e.id==='string'&&e.driver&&typeof e.driver.name==='string'&&e.career&&Number.isFinite(e.career.starts)&&e.legacy&&Number.isFinite(e.legacy.score)&&Array.isArray(e.history)&&Array.isArray(e.rivals)&&e.leagues;}))throw new Error('Invalid backup');var entries=careerHallMerge(careerHallRead(),data.entries);localStorage.setItem(CAREER9_HOF,JSON.stringify(entries));if(S&&S.mode==='pro'){S.hallOfFame=careerHallMerge(S.hallOfFame||[],entries);save();}closeModal();render();}catch(e){toast('Could not restore this Hall of Fame backup. Check the file and available browser storage.');}};
