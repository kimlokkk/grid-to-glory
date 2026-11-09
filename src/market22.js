'use strict';
/* Personal money, evidence-based scouting and a persisted three-round market. */
var MARKET8 = { academyAge:24, academyQuality:.05, release:.2, agentFee:.03,
 license:{f2:[40,40,40,30,20,10,8,6,4,3],f3:[30,25,20,15,12,9,7,5,3,2]} };
function marketCash(n){return Math.abs(n)<.1?'$'+Math.round(n*1000)+'K':payTxt(n);}
function marketMoney(n){return Math.round(n*1000000)/1000000;}
function walletPost(g,key,amount,label){
 var w=g.wallet;if(w.ledger.some(function(r){return r.key===key;}))return false;
 if(!Number.isFinite(amount))throw new Error('Invalid wallet amount');
 w.balance=marketMoney(w.balance+amount);w.ledger.push({key:key,amount:marketMoney(amount),label:label,season:g.season,round:g.round});return true;
}
function marketInit(g){
 if(g.mode!=='pro'||!g.world)return;
 if(!g.market8){g.market8={version:1,scouts:{},academy:null,academyOffers:[],license:{earned:false,entries:[]},receipts:{},window:null,agent:false};
  /* Legacy wages/results are not replayed as new cash. */
  if(g.round>0)for(var r=0;r<g.round;r++)g.market8.receipts[g.season+':'+leagueOf(g)+':'+r]=true;
 }
 if(g.market8.academy&&g.market8.academy.until<g.season){g.market8.academy=null;progressionPlayer(g).acad=null;}
 marketLicense(g);marketProgram(g);marketAcademyQuality(g);
}
function marketLicense(g){
 var l=g.market8.license,p=progressionPlayer(g),rows=(g.hist||[]).concat((p.worldHistory||[]).map(function(r){return {season:r.season,league:r.league,pos:r.pos};}));
 rows.forEach(function(r){if(!MARKET8.license[r.league]||!r.pos)return;var key=r.season+':'+r.league;if(!l.entries.some(function(e){return e.key===key;}))l.entries.push({key:key,season:r.season,league:r.league,points:MARKET8.license[r.league][r.pos-1]||0});});
 var total=l.entries.filter(function(r){return r.season>=g.season-2;}).reduce(function(s,r){return s+r.points;},0);if(total>=40)l.earned=true;l.points=l.earned?40:Math.min(40,total);return l;
}
function marketFirstF1(g){return leagueOf(g)!=='f1'&&!(g.hist||[]).some(function(r){return r.league==='f1'&&!r.reserve;});}
function marketProgram(g){
 var m=g.market8;if(m.program&&m.program.year===g.season+1)return m.program;
 var v=worldView(g,'f1'),ranked=v.teams.slice().sort(function(a,b){return teamPower(a)-teamPower(b);}),seat;
 ranked.some(function(t){seat=v.drivers.filter(function(d){return d.uid!==g.playerUid&&d.team===t.id&&d.con&&d.con.end===g.season;}).sort(function(a,b){return worldRankCandidate(a)-worldRankCandidate(b);})[0];return !!seat;});
 m.program=seat?{year:g.season+1,team:seat.team,uid:seat.uid}:null;return m.program;
}
function marketAcademyQuality(g){var p=progressionPlayer(g);if(!p.training)return;var a=g.market8.academy;p.training.qualitySources.academy=a&&a.until>=g.season?MARKET8.academyQuality:0;}
function marketNews(g,head,sub){var e=recordEvent(g,'market',{head:head,sub:sub});pushNews(g,{k:'world',eventId:e.id,head:head,sub:sub});}
function marketScore(g,t){
 var p=progressionPlayer(g),e=evaluationSummary(g),recent=(g.results||[]).filter(function(r){return !r.dnf;}).slice(-4),merit=recent.length?recent.reduce(function(s,r){return s+Math.max(-3,5-r.pos*.5);},0)/recent.length:0;
 return clamp(rating(p)+Math.max(0,estPot(t,p,g.season)-rating(p))*.15+evaluationMarketBonus(g,p)+merit+(e.sts==null?0:clamp((e.sts-50)/10,-3,4)),35,99);
}
function marketScout(g,force){
 var m=g.market8,p=progressionPlayer(g),key=trainingKey(g);if(m.scoutKey===key&&!force)return;m.scoutKey=key;
 var target=leagueOf(g)==='f3'?'f2':'f1',v=worldView(g,target),samples=(g.results||[]).length;
 v.teams.forEach(function(t){
  var id='seat:'+target+':'+t.id,old=m.scouts[id],score=marketScore(g,t),threshold=target==='f1'?62+t.prestige*2.3:60+t.prestige*.65;
  var stage=score>=threshold+3&&samples>=3?2:score>=threshold-5&&samples>=1?1:0;
  var seats=marketSeats(g,target,t.id),s={id:id,kind:'seat',league:target,team:t.id,score:score,threshold:threshold,stage:stage,trend:old?score-old.score:0,reason:'Car-relative performance, recent results and estimated potential.',blocker:target==='f1'&&(!m.license.earned||p.age+1<18)?'F1 needs age 18 and 40 licence points.':seats.open<1?'No expiring seat; a funded buyout would be required.':'A seat can open next season.',want:'Sustain pace and clean results across several races.'};
  m.scouts[id]=s;if(stage>0&&(!old||old.stage!==stage))marketNews(g,t.name+' '+(stage===2?'show strong interest':'are watching'),p.name+' is being assessed for '+target.toUpperCase()+'. '+s.blocker+' Interest is not a contract offer.');
 });
 if(leagueOf(g)==='f1'||p.age>MARKET8.academyAge)return;
 worldView(g,'f1').teams.forEach(function(t){
  var id='academy:'+t.id,old=m.scouts[id],score=marketScore(g,t),threshold=63+t.prestige*1.6,request=old&&old.requested;
  var stage=score>=threshold+3&&samples>=3?2:score>=threshold-6&&samples>=1?1:0;
  var s={id:id,kind:'academy',league:'f1',team:t.id,score:score,threshold:threshold,stage:stage,trend:old?score-old.score:0,requested:!!request,requestAt:old&&old.requestAt,decision:old&&old.decision,reason:request?'Your expression of interest is being assessed against your racing record.':'Scouts are assessing your results and estimated potential.',blocker:m.academy?'Already signed to an academy.':'Selection is separate from a race seat.',want:'Show sustained pace, consistency and development.'};
  if(request&&samples>=(old.requestAt||0)+1){s.decision=stage===2?'Offer':stage===1?'Monitoring':'Declined';s.requestAt=old.requestAt;}
  m.scouts[id]=s;
  if(!m.academy&&stage===2&&!m.academyOffers.some(function(o){return o.team===t.id&&o.season===g.season;})){
   m.academyOffers.push({id:g.season+':academy:'+t.id,team:t.id,season:g.season,until:g.season+1,support:.35,release:MARKET8.release,status:'open',route:request?'interest':'scout'});
   marketNews(g,t.name+' academy make an offer','An academy contract is available for review. It provides funding and coaching, with exclusivity and a release clause; no F1 seat is promised.');
  }else if(stage>0&&(!old||old.stage!==stage))marketNews(g,t.name+' academy are watching',p.name+' has attracted academy attention. No membership or race seat has been confirmed.');
 });
}
function academyExpress(g,team){marketInit(g);var m=g.market8,p=progressionPlayer(g);if(leagueOf(g)==='f1'||p.age>MARKET8.academyAge||m.academy||!worldView(g,'f1').teams[team])return false;
 var id='academy:'+team,s=m.scouts[id]||{id:id,team:team,kind:'academy',stage:0,score:0};if(s.requested)return false;s.requested=true;s.requestAt=g.results.length;s.decision='Pending';m.scouts[id]=s;
 marketNews(g,worldView(g,'f1').teams[team].name+' academy receive an enquiry','Your expression of interest will be assessed after further racing evidence. This is not an offer.');return true;
}
function academyAccept(g,id){marketInit(g);var m=g.market8,o=m.academyOffers.filter(function(o){return o.id===id&&o.status==='open'&&o.season===g.season;})[0];if(!o||m.academy)return false;
 m.academy={team:o.team,until:o.until,support:o.support,release:o.release};progressionPlayer(g).acad=o.team;o.status='accepted';m.academyOffers.forEach(function(x){if(x.status==='open')x.status='withdrawn';});marketAcademyQuality(g);marketNews(g,progressionPlayer(g).name+' joins '+worldView(g,'f1').teams[o.team].name+' academy','Funding and coaching support agreed. Race-seat contracts remain separate.');return true;
}
function academyRelease(g){var a=g.market8.academy;if(!a||g.wallet.balance<a.release)return false;walletPost(g,'academy-release:'+g.season+':'+a.team,-a.release,'Academy release');g.market8.academy=null;progressionPlayer(g).acad=null;marketAcademyQuality(g);return true;}
function marketRace(g,P){
 if(g.mode!=='pro'||g.sit)return;marketInit(g);var key=trainingKey(g),m=g.market8;if(m.receipts[key])return;m.receipts[key]=true;
 var p=progressionPlayer(g),c=p.con||{},n=seasonRounds(g);
 walletPost(g,key+':salary',(c.pay||0)/n,'Driver salary');
 if(!P.dnf&&P.pos===1&&c.wb)walletPost(g,key+':win',c.wb,'Contract win bonus');
 sponActive(g).forEach(function(d){walletPost(g,key+':sponsor:'+d.n,d.v/n,'Personal sponsor: '+d.n);});
 marketScout(g);
}
function marketSeats(g,l,team){var v=worldView(g,l),kept=v.drivers.filter(function(d){return d.team===team&&d.uid!==g.playerUid&&d.con&&d.con.end>g.season;}),w=g.market8&&g.market8.window;
 if(w&&w.season===g.season)(w.aiDeals||[]).forEach(function(x){if(x.league===l&&x.team===team&&!kept.some(function(d){return d.uid===x.uid;})){var d=v.drivers.concat(v.reserves).filter(function(d){return d.uid===x.uid;})[0];if(d)kept.push(d);}});
 return {kept:kept,open:worldTeamSeats(l)-kept.length};}
function marketAI(g){
 var w=g.market8.window;if(!w||w.signed)return;w.aiDeals=w.aiDeals||[];var v=worldView(g,'f1'),used={};w.aiDeals.forEach(function(x){used[x.uid]=true;});
 var pool=v.drivers.concat(v.reserves).filter(function(d){return d.uid!==g.playerUid&&!used[d.uid]&&d.age+1<45&&(!d.con||d.con.end<=g.season);});
 v.teams.slice().sort(function(a,b){return teamPower(b)-teamPower(a);}).forEach(function(t){
  var reserve=w.offers.some(function(o){return o.league==='f1'&&o.team===t.id&&o.status==='open';})?1:0;
  if(marketFirstF1(g)&&g.market8.program&&g.market8.program.team===t.id)reserve=Math.max(1,reserve);
  var open=marketSeats(g,'f1',t.id).open-reserve;
  /* Each round permits fresh domino opportunities; some vacancies remain for the next round. */
  if(open<1||w.round<3&&t.id%2!==w.round%2)return;
  pool.sort(function(a,b){return worldRankCandidate(b)+(b.acad===t.id?1:0)-worldRankCandidate(a)-(a.acad===t.id?1:0);});
  while(open>0&&pool.length){var d=pool.shift(),pay=payFor(ovr(d),.75);if(t.fin&&pay>finPayCap(t))continue;
   w.aiDeals.push({league:'f1',uid:d.uid,team:t.id,pay:pay,years:d.age>=35||t.prestige<=3?1:2});used[d.uid]=true;open--;
   marketNews(g,d.name+' agrees '+t.name+' deal','An expiring-contract driver has committed to an F1 seat for next season. Other unfilled vacancies remain in the market.');
  }
 });
}
function marketApplyAI(g){
 var w=g.market8&&g.market8.window;if(!w||w.season!==g.season)return;
 var v=worldView(g,'f1');(w.aiDeals||[]).forEach(function(x){var d=v.drivers.concat(v.reserves).filter(function(d){return d.uid===x.uid;})[0];if(!d)return;
  if(v.reserves.indexOf(d)>=0){v.reserves.splice(v.reserves.indexOf(d),1);v.drivers.push(d);}
  d.team=x.team;d.con={len:x.years,end:g.season+x.years,pay:x.pay};d.teamKey='f1:'+x.team;
 });
}

function marketPackage(g,l,t,guaranteed){
 if(l==='f1')return {cost:0,academy:0,grant:0,own:0,release:0};
 var cost=Number.isFinite(t.seasonCost)?t.seasonCost:(l==='f2'?2.2+t.id*.05:.7+t.id*.02),a=g.market8.academy,academy=a&&a.until>=g.season+1?cost*a.support:0;
 /* Ladder support is committed to the team, not paid as personal cash. */
 var grant=guaranteed?Math.max(0,cost-academy):0,own=Math.max(0,cost-academy-grant);
 return juniorPromotionPackage(g,l,t,guaranteed,{cost:cost,academy:academy,grant:grant,promotion:0,own:marketMoney(own),release:0});
}
function marketOffer(g,l,t,guaranteed,program){
 var m=g.market8,w=m.window,p=progressionPlayer(g),seats=marketSeats(g,l,t.id),s=m.scouts['seat:'+l+':'+t.id],buy=null;
 if(seats.open<1){var weak=seats.kept.slice().sort(function(a,b){return worldRankCandidate(a)-worldRankCandidate(b);})[0];if(!weak||!weak.con||weak.con.end<=g.season||rating(p)<rating(weak)+2||l!=='f1'||!t.fin||buyCost(g,weak)>Math.max(0,t.fin.cash)*.2)return null;buy={uid:weak.uid,cost:buyCost(g,weak)};}
 var pack=marketPackage(g,l,t,guaranteed),a=m.academy,loan=!!(a&&a.until>=g.season+1&&l==='f1'&&a.team!==t.id);var pay=l==='f1'?payFor(ovr(p),program?.3:.75):l==='f2'?.15:.05;
 if(l==='f1'&&t.fin&&pay>finPayCap(t)&&!program)return null;
 var renewal=l===leagueOf(g)&&p.team===t.id,years=l==='f1'&&!program?Math.min(2,careerNextYears(g)):1;
 return {id:w.id+':'+l+':'+t.id+':'+(program?'program':guaranteed?'funded':'seat'),league:l,team:t.id,years:years,pay:pay,wb:0,opt:false,renew:renewal,program:!!program,protected:!!guaranteed,expires:program||guaranteed?null:Math.min(3,w.round+1),status:'open',buy:buy,kept:seats.kept.map(function(d){return d.uid;}),package:pack,loan:loan,reason:program?'Planned rookie programme vacancy.':s?s.reason:'A funded continuing junior seat.',score:s?s.score:marketScore(g,t)};
}
function marketTargets(g){var l=leagueOf(g),p=progressionPlayer(g),pos=driverStandings(g).indexOf(p)+1;
 if(l==='f3')return pos===1?['f2']:['f2','f3'];
 if(l==='f2')return g.market8.license.earned&&p.age+1>=18?['f1']:(pos===1?[]:['f2']);return ['f1'];
}
function marketPublish(g){
 var m=g.market8,w=m.window;if(!w||w.signed)return;var targets=marketTargets(g),p=progressionPlayer(g),pos=driverStandings(g).indexOf(p)+1;
 targets.forEach(function(l){worldView(g,l).teams.forEach(function(t){
  var id=w.id+':'+l+':'+t.id+':seat';if(w.offers.some(function(o){return o.id===id||o.league===l&&o.team===t.id&&o.protected;}))return;
  var scout=m.scouts['seat:'+l+':'+t.id],same=l===leagueOf(g)&&t.id===p.team,guaranteed=l!=='f1'&&same&&pos!==1;
  if(!guaranteed&&(!scout||scout.score<scout.threshold+(w.round===1?2:w.round===2?0:-2)-(m.agent===g.season?1:0)))return;
  if(same&&g.fired&&!guaranteed)return;
  var o=marketOffer(g,l,t,guaranteed,false);if(o){w.offers.push(o);if(scout)scout.negotiating=true;marketNews(g,t.name+' make a contract offer','A '+l.toUpperCase()+' race-seat offer is now available until '+(o.expires?'market round '+o.expires:'you decide')+'.');}
 });});
 if(leagueOf(g)==='f3'&&pos===1&&!w.offers.some(function(o){return o.league==='f2'&&o.protected;})){
  var teams=worldView(g,'f2').teams.slice().sort(function(a,b){return a.seasonCost-b.seasonCost;}),o=marketOffer(g,'f2',teams[0],true,false);if(o){w.offers.forEach(function(x){if(x.league==='f2'&&x.team===o.team&&x.status==='open')x.status='withdrawn';});w.offers.push(o);}
 }
 if(marketFirstF1(g)&&targets.indexOf('f1')>=0&&!w.offers.some(function(o){return o.program||o.league==='f1'&&o.status==='open';})){
  var program=marketProgram(g);if(program){var o=marketOffer(g,'f1',worldView(g,'f1').teams[program.team],true,true);if(o)w.offers.push(o);}
 }
 g.offers=w.offers.filter(function(o){return o.status==='open';});
}
function marketOpen(g){marketInit(g);var m=g.market8;if(m.window&&m.window.season===g.season)return m.window;
 marketLicense(g);marketScout(g,true);m.window={id:'market:'+g.season+':'+leagueOf(g),season:g.season,round:1,offers:[],moves:[],aiDeals:[],signed:null};marketPublish(g);return m.window;
}
function marketAdvance(g,confirmed){
 var w=g.market8.window;if(!w||w.signed||w.round>=3)return false;
 var exp=w.offers.filter(function(o){return o.status==='open'&&!o.protected&&o.expires<=w.round;});if(exp.length&&!confirmed)return 'confirm';
 exp.forEach(function(o){o.status='expired';marketNews(g,worldView(g,o.league).teams[o.team].name+' offer expires','The unsigned offer has been released back to the market.');});
 w.round++;marketAI(g);marketPublish(g);return true;
}
function marketReject(g,id,confirmed){var w=g.market8.window,o=w&&w.offers.filter(function(o){return o.id===id&&o.status==='open';})[0];if(!o||o.protected)return false;if(!confirmed)return 'confirm';o.status='rejected';marketPublish(g);g.offers=w.offers.filter(function(x){return x.status==='open';});return true;}
/* Recheck actual contracts and funds; dataset attributes never determine the deal. */
function marketAccept(g,id){
 var m=g.market8,w=m&&m.window,o=w&&w.offers.filter(function(o){return o.id===id&&o.status==='open';})[0];if(!o||w.signed||g.round<seasonRounds(g)||careerRetirementDue(g))return false;
 if(o.league!==leagueOf(g)&&!((leagueOf(g)==='f3'&&o.league==='f2')||(leagueOf(g)==='f2'&&o.league==='f1')))return false;
 if(o.league==='f1'&&leagueOf(g)!=='f1'&&(!m.license.earned||progressionPlayer(g).age+1<18))return false;
 var currentPackage=marketPackage(g,o.league,worldView(g,o.league).teams[o.team],o.protected);if(currentPackage.own>o.package.own+.000001)return false;
 var seats=marketSeats(g,o.league,o.team),buy=o.buy&&seats.kept.filter(function(d){return d.uid===o.buy.uid;})[0];if(seats.open<1&&!buy)return false;
 if(o.package.own>g.wallet.balance)return false;
 var draft=JSON.parse(JSON.stringify(g)),prior=_s,dm=draft.market8,dw=dm.window,deal=dw.offers.filter(function(x){return x.id===id;})[0],oldLeague=leagueOf(draft),p=progressionPlayer(draft),targetBefore=worldView(draft,deal.league);
 try{
  if(buy){var bd=targetBefore.drivers.filter(function(d){return d.uid===buy.uid;})[0],t=targetBefore.teams[deal.team];if(!t.fin||t.fin.cash<deal.buy.cost)return false;t.fin.cash-=deal.buy.cost;bd.con.end=draft.season;}
  if(deal.package.own)walletPost(draft,'seat:'+deal.id,-deal.package.own,'Junior season funding');
  dw.signed=deal.id;deal.status='accepted';dw.offers.forEach(function(x){if(x.status==='open')x.status='withdrawn';});
  if(startNewSeason(draft,oldLeague===deal.league?deal.team:null,deal.years)===false){seedRnd(prior);return false;}
  if(oldLeague!==deal.league){
   draft.junior10.reputation[oldLeague]=careerCopy(draft.rep||{rel:{},fires:[]});draft.rep=careerCopy(draft.junior10.reputation[deal.league]||{rel:{},fires:[]});
   var old=worldView(draft,oldLeague),target=worldView(draft,deal.league),slot=target.drivers.findIndex(function(d){return d.team===deal.team&&deal.kept.indexOf(d.uid)<0&&!(dw.aiDeals||[]).some(function(x){return x.uid===d.uid&&x.league===deal.league;});});if(slot<0)throw new Error('Reserved seat unavailable');
   var displaced=target.drivers[slot],home=p.team,oldSlot=old.drivers.findIndex(function(d){return d.uid===p.uid;});
   var replacement=old.reserves.shift()||worldRookie(draft,'f3',false);if(oldLeague==='f2'&&!replacement.worldHistory.some(function(r){return r.league==='f3'||r.league==='f2';})){
    var f3=worldView(draft,'f3'),candidate=f3.drivers.filter(function(d){return d.worldHistory.some(function(r){return r.league==='f3';});}).sort(function(a,b){return worldRankCandidate(b)-worldRankCandidate(a);})[0],ci=f3.drivers.indexOf(candidate),ct=candidate.team;f3.drivers[ci]=replacement;replacement.team=ct;replacement=candidate;
   }
   replacement.team=home;old.drivers[oldSlot]=replacement;displaced.team=-1;displaced.id=-1;target.reserves.push(displaced);target.drivers[slot]=p;p.team=deal.team;
   draft.world.leagues[oldLeague]=old;delete draft.world.leagues[deal.league];draft.league=deal.league;draft.jr=null;draft.teams=target.teams;draft.drivers=target.drivers;draft.reserves=target.reserves;draft.pi=slot;draft.cal=seasonCalendar(draft);draft.rival=null;
   if(deal.league==='f1'){p.evaluation.tier=0;p.evaluation.weakSeasons=0;p.evaluation.capture=null;}
  }
  draft.contract=deal.years;p.con={len:deal.years,end:draft.season+deal.years-1,pay:deal.pay,wb:deal.wb,loan:deal.loan};
  ['f1','f2','f3'].forEach(function(l){var v=worldView(draft,l);worldAssign(draft,l,v.drivers,v.teams,draft.season);});
  dm.commitment={season:draft.season,league:deal.league,team:deal.team,package:deal.package};draft.junior10.funding.push({id:deal.id,season:draft.season,league:deal.league,team:deal.team,package:careerCopy(deal.package)});if(oldLeague!==deal.league)juniorTransferred(draft,oldLeague,deal.league,deal);marketAcademyQuality(draft);foundationInit(draft);worldValidate(draft);
  marketNews(draft,p.name+' signs for '+draft.teams[p.team].name,deal.years+' season '+deal.league.toUpperCase()+' contract confirmed'+(deal.loan?' on an academy-supported loan.':'.'));
  Object.keys(g).forEach(function(k){delete g[k];});Object.assign(g,draft);return true;
 }catch(e){seedRnd(prior);throw e;}
}
function marketAgent(g){if(g.market8.agent===g.season||g.wallet.balance<MARKET8.agentFee)return false;walletPost(g,'agent:'+g.season,-MARKET8.agentFee,'Agent season fee');g.market8.agent=g.season;return true;}
function marketOfferHTML(o){var t=worldView(S,o.league).teams[o.team],p=o.package,rank=worldView(S,o.league).teams.slice().sort(function(a,b){return teamPower(b)-teamPower(a);}).indexOf(t)+1;
 var dials=[['Car','#'+rank],['Status',o.program?'Rookie':o.renew?'Continuity':'Race driver'],['Pressure',rank<=3?'High':'Develop / score'],['Money',marketCash(o.pay)+'/season'],['Freedom',o.years+' season'+(o.years>1?'s':'')],['Development',t.spec?'Shared spec / coaching':'Team R&D'],['Future',o.loan?'Academy loan':'Results decide renewal']];
 return '<div class="card stack"><h3>'+esc(t.name)+' · '+o.league.toUpperCase()+'</h3><p>'+esc(o.reason)+'</p><div class="chips">'+dials.map(function(x){return chip(x[0],x[1]);}).join('')+'</div><p>You receive: '+marketCash(o.pay)+' salary; '+marketCash(p.academy)+' academy funding; '+marketCash(p.grant)+' programme support.'+(p.promotion?' Conditional promotion award '+marketCash(p.promotion)+' is paid directly to this seat on signing.':'')+'</p><p>You pay: '+marketCash(p.own)+' from your wallet. Season seat cost '+marketCash(p.cost)+'.'+(o.buy?' The team pays the '+marketCash(o.buy.cost)+' buyout.':'')+'</p><p class="dim">'+(o.protected?'This final funded pathway stays available until you decide.':'Valid through market round '+o.expires+'.')+' '+(o.loan?'Academy membership continues; this is a supported loan.':'Future competitiveness is uncertain.')+'</p><button class="btn pri" data-act="market-review" data-v="'+o.id+'">Review contract</button>'+(!o.protected?'<button class="btn sm" data-act="market-reject" data-v="'+o.id+'">Decline</button>':'')+'</div>';
}
function marketWindowHTML(){var w=S.market8.window;if(!w||w.season!==S.season||w.signed)return '';var offers=w.offers.filter(function(o){return o.status==='open';});return '<div class="card stack"><h2>Driver market · round '+w.round+' / 3</h2><p>Offers use the same assessment as Scout Watch. Advancing can release unsigned offers. Signing commits one seat and withdraws your other offers.</p>'+offers.map(marketOfferHTML).join('')+(w.round<3?'<button class="btn" data-act="market-next">Next market round</button>':'')+(!offers.length?'<p>No current race-seat offers. '+(marketFirstF1(S)?'Keep reviewing available junior funding and licence requirements.':'Your comeback options will be reviewed at the career transition.')+'</p>':'')+'</div>';}
function academyHTML(){var m=S.market8,a=m.academy,p=progressionPlayer(S);return '<div class="card stack"><h3>Academy</h3>'+(a?'<p>'+esc(worldView(S,'f1').teams[a.team].name)+' · through Season '+a.until+'. '+Math.round(a.support*100)+'% junior seat funding and bounded coaching support. Exclusive membership; no guaranteed F1 seat.</p><button class="btn sm" data-act="academy-release">Review release · '+marketCash(a.release)+'</button>':(leagueOf(S)!=='f1'&&p.age<=MARKET8.academyAge?'<p>Be scouted or express interest. Further racing evidence determines selection.</p><details><summary>Explore academies</summary>'+worldView(S,'f1').teams.map(function(t){var s=m.scouts['academy:'+t.id];return '<div class="row sp"><span>'+esc(t.name)+(s&&s.requested?' · '+esc(s.decision||'Monitoring'):'')+'</span><button class="btn sm" data-act="academy-interest" data-v="'+t.id+'" '+(s&&s.requested?'disabled':'')+'>Express Interest</button></div>';}).join('')+'</details>':'<p>No active academy membership.</p>'))+m.academyOffers.filter(function(o){return o.status==='open'&&o.season===S.season;}).map(function(o){return '<button class="btn pri" data-act="academy-review" data-v="'+o.id+'">Review '+esc(worldView(S,'f1').teams[o.team].name)+' academy offer</button>';}).join('')+'</div>';}
function scoutNegotiating(g,s){var m=g.market8,w=m.window;if(s.kind==='academy')return m.academyOffers.some(function(o){return o.team===s.team&&o.season===g.season&&o.status==='open';});return !!(w&&w.season===g.season&&!w.signed&&w.offers.some(function(o){return o.league===s.league&&o.team===s.team&&o.status==='open';}));}
function scoutRelevant(g,s){return (s.kind==='seat'?s.league===(leagueOf(g)==='f3'?'f2':'f1'):leagueOf(g)!=='f1')&&(s.stage>0||s.requested||scoutNegotiating(g,s));}
function scoutWatchHTML(){if(S.mode!=='pro'||!S.market8)return '';var m=S.market8,scouts=Object.keys(m.scouts).map(function(k){return m.scouts[k];}).filter(function(s){return scoutRelevant(S,s);});return '<div class="card stack"><h3>Scout Watch</h3><p>Observation is not an offer. Negotiations appear only after a real offer.</p>'+scouts.map(function(s){return '<p><b>'+esc(worldView(S,s.league||'f1').teams[s.team].name)+(s.kind==='academy'?' academy':' · '+s.league.toUpperCase())+'</b> · '+(scoutNegotiating(S,s)?'Negotiations':s.stage===2?'Strong interest':s.stage===1?'Watching':'Detected')+' · '+(s.trend>1?'Rising':s.trend< -1?'Falling':'Steady')+'<br>'+esc(s.reason)+'<br>'+esc(s.blocker||'Assessment pending.')+' '+esc(s.want||'')+'</p>';}).join('')+(!scouts.length?'<p>Build a racing record to attract attention.</p>':'')+'</div>';}
function marketCareerHTML(){var m=S.market8,l=m.license,w=S.wallet,program=m.program;return '<div class="card stack"><h3>Personal wallet</h3><h2>'+marketCash(w.balance)+'</h2><p>Salary, win bonuses and personal sponsors pay you. Team budgets are separate. Junior funding is shown before signing.</p><p>F1 licence: '+(l.earned?'Earned permanently':l.points+' / 40 points')+'. Minimum debut age 18. Points come from the latest three junior seasons.</p>'+(m.commitment?'<p>Committed season funding: '+marketCash(m.commitment.package.own)+' personal + '+marketCash(m.commitment.package.academy)+' academy + '+marketCash(m.commitment.package.grant)+' programme.</p>':'')+'<details><summary>Recent transactions</summary>'+w.ledger.slice(-12).reverse().map(function(r){return '<p>'+esc(r.label)+' · '+(r.amount<0?'-':'+')+marketCash(Math.abs(r.amount))+'</p>';}).join('')+'</details><button class="btn sm" data-act="market-agent" '+(m.agent===S.season?'disabled':'')+'>'+(m.agent===S.season?'Agent active':'Hire agent · '+marketCash(MARKET8.agentFee))+'</button><p class="dim">An agent highlights existing opportunities; they cannot create seats.</p></div><div class="card stack"><h3>Seat Watch</h3>'+['f1','f2','f3'].map(function(l){var v=worldView(S,l),n=v.teams.reduce(function(n,t){return n+marketSeats(S,l,t.id).open;},0);return '<p>'+l.toUpperCase()+': '+n+' potential expiring seats for next season.</p>';}).join('')+(program?'<p>Planned F1 rookie opportunity: '+esc(worldView(S,'f1').teams[program.team].name)+' · next season. This uses an expiring contract inside the 20-car grid.</p>':'<p>No expiring rookie-programme vacancy is recorded yet.</p>')+'</div>'+academyHTML()+marketWindowHTML();}
/* Integrations preserve Classic and use the existing season/race engine. */
var marketOldEnd=endSeason;
endSeason=function(g){if(g.mode==='pro'&&g.lastSummary)return g.lastSummary.rec;var r=marketOldEnd(g);if(g.mode==='pro'){marketInit(g);marketLicense(g);if(!careerRetirementDue(g)&&(leagueOf(g)!=='f1'||g.offers!==null))marketOpen(g);}return r;};
var marketOldOffers=makeOffers;
makeOffers=function(g,p,v,f){return g.mode==='pro'?[]:marketOldOffers(g,p,v,f);};
var marketOldSeason=vSeason;
vSeason=function(){if(S.mode!=='pro'||!S.market8||!S.market8.window||S.market8.window.season!==S.season||S.market8.window.signed)return marketOldSeason();var h=marketOldSeason();return h+marketWindowHTML();};
var marketOldCareer=hKerjaya;
hKerjaya=function(){return marketOldCareer()+(S.mode==='pro'?marketCareerHTML():'');};
var marketOldNudge=careerNudgeHTML;
careerNudgeHTML=function(){
 if(S.mode!=='pro'||!S.market8)return marketOldNudge();
 var count=Object.keys(S.market8.scouts).filter(function(k){return scoutRelevant(S,S.market8.scouts[k]);}).length,w=S.market8.window,offers=w&&w.season===S.season?w.offers.filter(function(o){return o.status==='open';}).length:0;
 return '<div class="card home-career"><div class="home-card-head"><div><h3>Career centre</h3><h2>Your next move</h2></div><span class="home-tag">'+(S.contract===1?'Contract year':S.contract+' seasons left')+'</span></div><div class="career-metrics"><div><small>Personal wallet</small><b>'+marketCash(S.wallet.balance)+'</b></div><div><small>Scout interest</small><b>'+count+' <span>teams / academies</span></b></div><div><small>Open offers</small><b>'+offers+'</b></div></div><div class="home-card-footer"><p class="dim">'+(S.contract===1?'Your contract ends this season. Review funding and your next seat.':'Follow team interest, academy support and your contract options.')+'</p><button class="btn sm" data-act="tab" data-v="kerjaya">Open career →</button></div></div>';
};
A['academy-interest']=function(d){if(academyExpress(S,+d.v)){save();render();}};
A['academy-review']=function(d){var o=S.market8.academyOffers.filter(function(o){return o.id===d.v&&o.status==='open';})[0];if(!o)return;showModal('<h2>Academy offer</h2><p>'+esc(worldView(S,'f1').teams[o.team].name)+' · through Season '+o.until+'.</p><p>'+Math.round(o.support*100)+'% of junior seat costs and coaching quality within the existing training cap. No extra XP or unlimited slots. Exclusive academy membership; release fee '+marketCash(o.release)+'. Race seats require a separate offer.</p><button class="btn pri" data-act="academy-sign" data-v="'+o.id+'">Accept academy contract</button><button class="btn" data-act="mclose">Back</button>');};
A['academy-sign']=function(d){if(academyAccept(S,d.v)){closeModal();save();render();}};
A['academy-release']=function(){showModal('<h2>Release academy contract?</h2><p>Pay '+marketCash(S.market8.academy.release)+' from your wallet. Coaching and future funding end.</p><button class="btn" data-act="academy-leave">Confirm release</button><button class="btn" data-act="mclose">Back</button>');};
A['academy-leave']=function(){if(academyRelease(S)){closeModal();save();render();}else toast('Insufficient personal funds.');};
A['market-agent']=function(){if(marketAgent(S)){save();render();}else toast('Insufficient personal funds.');};
A['market-review']=function(d){var w=S.market8.window,o=w.offers.filter(function(o){return o.id===d.v&&o.status==='open';})[0];if(!o)return;showModal('<h2>Driver contract</h2>'+marketOfferHTML(o)+'<p>Signing withdraws all other seat offers and commits the displayed funding.</p><button class="btn pri" data-act="market-sign" data-v="'+o.id+'">Sign contract</button><button class="btn" data-act="mclose">Back</button>');};
A['market-sign']=function(d){if(marketAccept(S,d.v)){closeModal();save();UI.screen='hub';UI.tab='utama';render();ceremonyModal(myTeam(),me().name,true,false,S.contract,me().con.pay,S.season);}else toast('Offer unavailable, requirements unmet or funding insufficient.');};
A['market-next']=function(d){var r=marketAdvance(S,+d.ok===1);if(r==='confirm'){showModal('<h2>Advance the market?</h2><p>Unsigned offers reaching their deadline can expire. Better offers may be lost. A protected first-F1 rookie offer remains available.</p><button class="btn" data-act="market-next" data-ok="1">Advance</button><button class="btn" data-act="mclose">Back</button>');return;}if(r){closeModal();save();render();}};
A['market-reject']=function(d){var r=marketReject(S,d.v,+d.ok===1);if(r==='confirm'){showModal('<h2>Decline this offer?</h2><p>You may lose your best or last ordinary offer. It will not be regenerated.</p><button class="btn" data-act="market-reject" data-v="'+esc(d.v)+'" data-ok="1">Decline offer</button><button class="btn" data-act="mclose">Back</button>');return;}if(r){closeModal();save();render();}};

/* Old season buttons cannot bypass an open Pro market. */
var marketOldNext=A['next-season'];
A['next-season']=function(){var w=S.mode==='pro'&&S.market8&&S.market8.window;if(w&&w.season===S.season&&!w.signed){UI.screen='season';render();return;}return marketOldNext();};
