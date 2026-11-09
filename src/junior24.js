'use strict';
/* Public Pro onboarding uses the existing league world and contract market. */
var JUNIOR10_BACKGROUNDS={
 family:{name:'Family backing',cash:4,detail:'More starting capital and freedom. Funding is finite; build results and sponsors for the long term.'},
 balanced:{name:'Balanced backing',cash:1.5,detail:'A modest budget. Balance seat costs, coaching and future funding.'},
 scholarship:{name:'Academy scholarship',cash:.1,detail:'An academy entry offer and first-season support. Exclusive membership and a release fee limit your freedom.'}
};
function juniorInit(g){if(g.mode!=='pro')return;if(!g.junior10)g.junior10={version:1,public:false,background:'legacy',funding:[],reputation:{},transitions:[]};}
function juniorDisplaced(g,team){return g.drivers.filter(function(x){return x.uid!==g.playerUid&&x.team===team;}).sort(function(a,b){return rating(a)-rating(b)||a.id-b.id;})[0];}
function juniorEntry(g,background,team,academy){
 if(g.mode!=='pro'||['f3','f2'].indexOf(leagueOf(g))<0||g.round!==0||g.junior10.started||!JUNIOR10_BACKGROUNDS[background]||!g.teams[team])return false;
 var allowed=[7,8,9];if(g.junior10.protegeAcademy!=null)allowed.push(g.junior10.protegeAcademy);
 if(background==='scholarship'&&allowed.indexOf(academy)<0)return false;
 if(academy!==null&&allowed.indexOf(academy)<0)return false;
 var d=careerCopy(g),p=progressionPlayer(d),old=p.team;
 if(old!==team){var mate=juniorDisplaced(d,team);mate.team=old;mate.teamKey=d.teams[old].key;p.team=team;p.teamKey=d.teams[team].key;}
 d.junior10.public=true;d.junior10.background=background;
 walletPost(d,'entry:capital',JUNIOR10_BACKGROUNDS[background].cash,'Starting capital');
 if(academy!==null){var id='entry:academy:'+academy;d.market8.academyOffers.push({id:id,team:academy,season:d.season,until:d.season+2,support:.35,release:MARKET8.release,status:'open',route:'scout'});if(!academyAccept(d,id))return false;}
 var cost=d.teams[team].seasonCost,acad=d.market8.academy?cost*d.market8.academy.support:0,grant=background==='scholarship'?cost-acad:0,own=marketMoney(cost-acad-grant);
 if(d.wallet.balance+1e-6<own)return false;
 walletPost(d,'entry:seat',-own,leagueOf(d).toUpperCase()+' first-season seat funding');
 var pack={cost:cost,academy:acad,grant:grant,promotion:0,own:own,release:0};d.market8.commitment={season:d.season,league:leagueOf(d),team:team,package:pack};d.junior10.funding.push({id:'entry:seat',season:d.season,league:leagueOf(d),team:team,package:pack});d.junior10.started=true;
 d.contract=1;p.con={len:1,end:d.season,pay:leagueOf(d)==='f2'?.15:.05};d.target=null;ensureDev(d);worldJuniorFinanceInit(d);objAssign(d,d.season);foundationInit(d);worldValidate(d);careerCommit(g,d);return true;
}
function juniorPreview(d){
 if(!d.proWorld){var prior=_s;try{seedRnd(d.source?d.source.meta.rng:d.proSeed);if(d.source){d.proWorld=careerCopy(d.source);if(!careerSuccessor(d.proWorld,d.protege||null,d.protege?null:draftName(d),d.arch))return null;if(d.protege)d.proWorld.junior10.protegeAcademy=progressionPlayer(d.proWorld).acad;}else d.proWorld=newProCareer(draftName(d),d.arch,7,'f3');d.proWorld.meta.rng=_s;d.ownNames=[draftName(d)];}finally{seedRnd(prior);}}
 var g=d.proWorld,p=progressionPlayer(g),name=d.protege?p.name:draftName(d);
 if(g.drivers.concat(g.reserves,worldPeople(g),g.retired||[]).some(function(x){return x.uid!==p.uid&&x.name===name;}))return null;
 if(name!==p.name&&allNames(g)[name]&&d.ownNames.indexOf(name)<0)return null;
 if(g.arch!==d.arch){g.arch=d.arch;if(!d.protege)PROGRESSION.stats.forEach(function(k){p[k]=66+(ARCHS[d.arch].b[k]||0);});delete p.growthCaps;delete p.abilities;progressionInit(g);}
 d.ownNames.push(name);p.name=name;if(!d.protege){p.nat=d.nat;p.age=16;}p.helm=Object.assign({},d.helm);
 var conflict=g.drivers.filter(function(x){return x!==p&&x.num===d.num;})[0];if(conflict)conflict.num=p.num;p.num=d.num;
 var codes={};g.drivers.forEach(function(x){if(x!==p)codes[x.code]=true;});p.code=mkCode(p.name,codes);
 return g;
}
function juniorEntryQuote(d){var g=juniorPreview(d);if(!g)return null;var b=JUNIOR10_BACKGROUNDS[d.background],t=g.teams[d.team],a=d.entryAcademy,acad=a!==null?t.seasonCost*.35:0,grant=d.background==='scholarship'?t.seasonCost-acad:0;return {game:g,team:t,cash:b.cash,cost:t.seasonCost,academy:acad,grant:grant,own:marketMoney(t.seasonCost-acad-grant)};}
var juniorOldNew=A['new'];
A['new']=function(){juniorOldNew();var d=UI.draft;d.careerMode='pro';d.age=16;d.start='f3';d.background='balanced';d.entryAcademy=null;d.team=7;d.sure=false;delete d.proWorld;delete d.source;delete d.protege;d.proSeed=(_s^Date.now())>>>0;render();};
A['career-mode']=function(x){var d=draft();if(d.source)return;if(['pro','classic'].indexOf(x.v)<0||d.source&&x.v!=='pro')return;d.careerMode=x.v;d.age=x.v==='pro'?16:19;d.start=x.v==='pro'?'f3':'f1';d.sure=false;render();};
A['junior-background']=function(x){if(!JUNIOR10_BACKGROUNDS[x.v])return;var d=draft();d.background=x.v;if(x.v==='scholarship'&&d.entryAcademy===null)d.entryAcademy=7;d.sure=false;render();};
A['entry-academy']=function(x){var d=draft(),v=+x.v;if(d.background==='scholarship'&&v<0)return;d.entryAcademy=v<0?null:v;d.sure=false;render();};
var juniorOldNums=takenNums;
takenNums=function(){return UI.draft&&UI.draft.careerMode==='pro'?{}:juniorOldNums();};
var juniorOldDriver=w8Driver;
w8Driver=function(d){var h=juniorOldDriver(d),pro=d.careerMode==='pro';if(d.protege)h=h.replace('id="w8f"','id="w8f" readonly').replace('id="w8l"','id="w8l" readonly').replace('id="w8n"','id="w8n" disabled');h='<div class="card stack"><h3>Career mode</h3><div class="row"><button class="btn '+(pro?'pri':'')+'" data-act="career-mode" data-v="pro">Pro · F3 to F1</button>'+(!d.source?'<button class="btn '+(!pro?'pri':'')+'" data-act="career-mode" data-v="classic">Classic</button>':'')+'</div><p>'+(pro?'Start at 16 in F3. Earn promotion to F2, then qualify for an F1 debut.':'The original career rules and start options.')+'</p></div>'+h;
 if(!pro)return h;
 return h.replace('Numbers already used by other drivers are hidden.','Your chosen number is reserved within the F3 grid. Numbers may be shared across different leagues.')+'<div class="card stack"><h3>Financial background</h3><p>Background changes funding and obligations. It gives no hidden pace or potential bonus.</p>'+Object.keys(JUNIOR10_BACKGROUNDS).map(function(k){var b=JUNIOR10_BACKGROUNDS[k];return '<button class="opt '+(d.background===k?'on':'')+'" data-act="junior-background" data-v="'+k+'"><b>'+b.name+' · '+marketCash(b.cash)+'</b><p>'+b.detail+'</p></button>';}).join('')+'</div>';
};
var juniorOldTeams=w8Team;
w8Team=function(d){if(d.careerMode!=='pro')return juniorOldTeams(d);var g=juniorPreview(d);if(!g)return '<div class="card"><p>That name is already used in this world. Go back and choose another name.</p></div>';
 return '<div class="card entry-intro"><span class="entry-eyebrow">Choose your team</span><h2>Your '+leagueOf(g).toUpperCase()+' entry package</h2><p>Same car. Different support. Compare seat cost, setup, crew and coaching to find your starting team.</p><div class="entry-rules"><span>'+leagueOf(g).toUpperCase()+' · spec cars</span><span>'+worldTeamSeats(leagueOf(g))+' drivers per team</span><span>One-season seat</span></div></div><div class="entry-grid">'+g.teams.map(function(t){var selected=d.team===t.id,leaving=progressionPlayer(g).team===t.id?null:juniorDisplaced(g,t.id),mates=g.drivers.filter(function(x){return x.uid!==g.playerUid&&x!==leaving&&x.team===t.id;});return '<button class="w8-team entry-team '+(selected?'on':'')+'" style="--tc:'+t.color+'" data-act="d-team" data-v="'+t.id+'" aria-pressed="'+selected+'"><span class="entry-heading"><span class="entry-name">'+esc(t.name)+'</span><span class="entry-mark" aria-hidden="true">'+(selected?'✓':'')+'</span></span><span class="entry-location">'+flagE(t.nat)+' '+esc(t.base)+'<span>Est. '+t.founded+'</span></span><span class="entry-cost"><span>Season seat</span><span class="entry-price">'+marketCash(t.seasonCost)+'<small> / season</small></span></span><span class="entry-support">'+['setup','crew','coaching'].map(function(k){return '<span><small>'+k[0].toUpperCase()+k.slice(1)+'</small><b>'+Math.round(t.ops[k]*100)+'</b></span>';}).join('')+'</span>'+'<span class="entry-details"><span class="entry-selected">'+(selected?'Selected team':'Team profile')+'</span><span>'+esc(t.blurb)+'</span><span class="entry-drivers"><small>Your teammates</small>'+mates.map(function(x){return esc(x.name);}).join(' · ')+'</span></span></button>';}).join('')+'</div>';

};
var juniorOldContract=w8Contract;
w8Contract=function(d){if(d.careerMode!=='pro')return juniorOldContract(d);var q=juniorEntryQuote(d);if(!q)return '<p>Choose a unique driver name before continuing.</p>';
 return (d.protege?'<div class="card stack"><h3>Financial background</h3><p>Your protégé keeps their real identity, age and stats. Choose their funding package.</p>'+Object.keys(JUNIOR10_BACKGROUNDS).map(function(k){return '<button class="btn sm '+(d.background===k?'pri':'')+'" data-act="junior-background" data-v="'+k+'">'+JUNIOR10_BACKGROUNDS[k].name+'</button>';}).join('')+'</div>':'')+'<div class="card stack"><h2>Review your '+leagueOf(q.game).toUpperCase()+' contract</h2><p>'+esc(progressionPlayer(q.game).name)+' · age '+progressionPlayer(q.game).age+' · '+flagE(d.nat)+' '+natName(d.nat)+' · '+ARCHS[d.arch].n+'</p><h3>'+esc(q.team.name)+'</h3><p>One season · 8 rounds · '+q.game.drivers.length+' drivers. Salary '+marketCash(leagueOf(q.game)==='f2'?.15:.05)+'/season. Your route is F3 → F2 → F1.</p><h3>Academy entry offer</h3><p>Membership is optional with family or balanced funding. Scholarships require an accepted academy offer. Membership does not guarantee an F1 seat.</p><div class="row">'+(d.background!=='scholarship'?'<button class="btn sm '+(d.entryAcademy===null?'pri':'')+'" data-act="entry-academy" data-v="-1">Independent</button>':'')+[7,8,9].concat(d.protege&&q.game.junior10.protegeAcademy!=null&&[7,8,9].indexOf(q.game.junior10.protegeAcademy)<0?[q.game.junior10.protegeAcademy]:[]).map(function(i){return '<button class="btn sm '+(d.entryAcademy===i?'pri':'')+'" data-act="entry-academy" data-v="'+i+'">'+esc(TEAMS[i].name)+'</button>';}).join('')+'</div>'+(d.entryAcademy!==null?'<p>Through Season '+(q.game.season+2)+': 35% junior seat funding and coaching within the existing training cap. Exclusive membership; release fee '+marketCash(MARKET8.release)+'. Placements may be supported loans to other teams.</p>':'<p>You keep your independence and can attract academy scouts or express interest later.</p>')+'<h3>First-season funding</h3><div class="chips">'+chip('Starting capital',marketCash(q.cash))+chip('Seat cost',marketCash(q.cost))+chip('Academy',marketCash(q.academy))+chip('Entry grant',marketCash(q.grant))+chip('You pay',marketCash(q.own))+chip('Wallet after signing',marketCash(q.cash-q.own))+'</div><p>Seat funding is settled once when you sign. No monthly surprise bill. Awards and grants fund your seat; they are not extra personal cash.</p></div>';
};
var juniorOldNext=A['w8-next'];
A['w8-next']=function(){var d=draft();if(d.careerMode!=='pro')return juniorOldNext();if(!d.first.trim()){toast('Enter your first name.');return;}d.sure=false;d.step=Math.min(4,d.step+1);render();window.scrollTo(0,0);};
var juniorOldTeamAction=A['d-team'];
A['d-team']=function(x){var d=draft();if(d.careerMode!=='pro')return juniorOldTeamAction(x);if(!Number.isInteger(+x.v)||+x.v<0||+x.v>9)return;d.team=+x.v;d.sure=false;render();};
var juniorOldGo=A['new-go'];
A['new-go']=function(){var d=draft();if(d.careerMode!=='pro')return juniorOldGo();
 if(d.step!==4||!d.first.trim()||!PROGRESSION.caps[d.arch]||!NATS.some(function(n){return n[0]===d.nat;})||!Number.isInteger(d.num)||d.num<2||d.num>99){toast('Complete your driver details and contract first.');return false;}
 if(loadSave()&&!d.sure){toast('Review and confirm replacing your saved career first.');return false;}
 var g=juniorPreview(d);if(!g){toast('Choose a unique driver name.');return false;}
 if(!juniorEntry(g,d.background,d.team,d.entryAcademy)){toast('This package needs valid funding and academy terms.');return false;}
 S=g;seedRnd(S.meta.rng);S.news=S.news||[];marketNews(S,me().name+' joins '+myTeam().name+' in '+leagueOf(S).toUpperCase(),'A funded junior entry package is confirmed. F2 promotion and an F1 licence must be earned on track.');S.hallOfFame=careerHallRead();save();UI.draft.v8=0;UI.wk=null;closeModal();UI.screen='hub';UI.tab='utama';render();return true;
};
function juniorPromotionPackage(g,l,t,guaranteed,base){
 if(!g.junior10||!g.junior10.public||l!=='f2'||leagueOf(g)!=='f3'||guaranteed)return base;
 var pos=driverStandings(g).indexOf(progressionPlayer(g))+1,award=pos<=3?base.cost*.7:pos<=5?base.cost*.4:0;
 base.promotion=Math.min(award,Math.max(0,base.cost-base.academy-base.grant));base.own=marketMoney(Math.max(0,base.cost-base.academy-base.grant-base.promotion));return base;
}
function juniorPrepareLeague(g){g.target=null;ensureDev(g);if(leagueOf(g)==='f1'){conInit(g);finInit(g);facInit(g);}var p=progressionPlayer(g);p.obj=null;p.miss=0;objAssign(g,g.season);g.tm=null;g.rival=null;}
function juniorTransferred(g,from,to,deal){
 if(!g.junior10)return;
 var p=progressionPlayer(g);g.junior10.transitions.push({season:g.season,from:from,to:to,uid:p.uid,teamKey:p.teamKey,age:p.age,offer:deal.id});
 juniorPrepareLeague(g);
 marketNews(g,p.name+' moves up to '+to.toUpperCase(),'Promotion confirmed at age '+p.age+'. Identity, skills, circuit knowledge and real junior history continue into the new championship.');
}
function juniorRoadmapHTML(){if(S.mode!=='pro'||leagueOf(S)==='f1')return '';var l=leagueOf(S),p=progressionPlayer(S),lic=S.market8.license,years=(S.hist||[]).filter(function(r){return r.league===l&&!r.inactive;}).length;
 return '<div class="card stack"><h3>Road to F1</h3><p>F3 → F2 → F1 · now '+l.toUpperCase()+' at age '+p.age+'</p><p>'+(l==='f3'?'Win F3 for a funded F2 promotion. Other F2 offers depend on performance and funding.':'Earn 40 licence points and be at least 18 for your F1 debut. An eligible first-time entrant has a protected final rookie opportunity.')+'</p><p>Licence: '+(lic.earned?'earned permanently':lic.points+' / 40')+' · '+(S.career.juniorTitles||0)+' junior titles.</p>'+(years>=3?'<p>Development review: another junior season is available if you have not won this championship and are not yet eligible to move up. There is no three-season career limit.</p>':'')+'<button class="btn sm" data-act="tab" data-v="kerjaya">Funding, academy and scouting</button></div>';
}
var juniorOldNudge=careerNudgeHTML;
careerNudgeHTML=function(){return juniorOldNudge()+juniorRoadmapHTML();};
var juniorOldCareer=hKerjaya;
hKerjaya=function(){return juniorRoadmapHTML()+juniorOldCareer();};
function juniorPromotionHTML(){if(S.mode!=='pro'||leagueOf(S)==='f1'||!S.lastSummary)return '';var p=progressionPlayer(S),l=leagueOf(S),lic=S.market8.license,pos=S.lastSummary.rec.pos;
 return '<div class="card stack"><h2>Next step · '+l.toUpperCase()+'</h2><p>'+(pos===1?'You won this championship and cannot repeat it.':'You can accept an eligible promotion or continue racing here with a funded package.')+'</p><p>Licence '+lic.points+' / 40'+(lic.earned?' · earned permanently':' · junior results count across the latest three seasons')+'. Next-season age '+(p.age+1)+'.</p><p>Promotion funding is conditional on signing the matching contract. It is committed to that seat once, with no cash withdrawal or claim-before-promotion step.</p></div>';
}
var juniorOldSeason=vSeason;
vSeason=function(){var h=juniorOldSeason();if(S.mode!=='pro'||leagueOf(S)==='f1')return h;return juniorPromotionHTML()+h.replace(/World Champion/g,leagueOf(S).toUpperCase()+' Champion');};
var juniorOldReview=vReview;
vReview=function(){var h=juniorOldReview();return S.mode==='pro'&&leagueOf(S)!=='f1'?h.replace(/World Champion/g,leagueOf(S).toUpperCase()+' Champion'):h;};
var juniorOldPost=fnlPostText;
fnlPostText=function(p){var h=juniorOldPost(p);return S.mode==='pro'&&leagueOf(S)!=='f1'?h.replace(/World Champion/g,leagueOf(S).toUpperCase()+' Champion'):h;};
var juniorOldHeader=hubSeasonHTML;
hubSeasonHTML=function(){if(S.mode!=='pro')return juniorOldHeader();var l=leagueOf(S).toUpperCase(),r=Math.min(S.round+1,seasonRounds(S));return '<span class="hub-season-long">'+l+' · Season '+S.season+' · Round '+r+'/'+seasonRounds(S)+'</span><span class="hub-season-short">'+l+' · S'+S.season+' R'+r+'/'+seasonRounds(S)+'</span>';};
var juniorOldTeam=worldJuniorTeamHTML;
worldJuniorTeamHTML=function(t){return juniorOldTeam(t)+'<div class="card stack"><h3>Your team drivers</h3>'+S.drivers.filter(function(d){return d.team===t.id;}).map(function(d){return '<button class="btn sm" data-act="world-driver" data-v="'+d.uid+'">'+flagE(d.nat)+' '+esc(d.name)+' · '+ovr(d)+' OVR</button>';}).join('')+'</div>';};

/* Retirement routes use the same reviewable seat/funding wizard. */
A['successor-world']=function(){careerHallStore(S);A.new();};
A['successor-new']=function(){var el=document.getElementById('successor-name'),name=el&&el.value.trim();if(!name||name.length<2||allNames(S)[name]){toast('Enter a unique new driver name.');return;}var source=careerCopy(S),arch=S.arch;careerHallStore(S);A.new();var d=draft();d.source=source;d.arch=arch;d.first=name;d.last='';render();};
A['successor-pick']=function(x){var source=careerCopy(S),p=worldPeople(S).concat(S.drivers).filter(function(d){return d.uid===x.v;})[0];if(!p)return;careerHallStore(S);A.new();var d=draft();d.source=source;d.protege=x.v;d.first=p.name;d.last='';d.nat=p.nat;d.age=p.age+1;d.background='scholarship';d.entryAcademy=p.acad==null?7:p.acad;d.step=3;var g=juniorPreview(d);if(!g){toast('That driver is no longer available in the junior ladder.');UI.screen='retire';render();return;}d.team=progressionPlayer(g).team;render();};
