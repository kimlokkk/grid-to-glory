'use strict';
/* Weekend phase 4: scenes around the existing games. IDs, input handlers and scoring stay intact. */
var MX41 = { active: false, kind: '', key: '', ctx: {}, practice: false, observer: null, viewFrame: 0, practiceStop: null, legacy: {}, lastLights: 0, sawRed: false, wheels: 0 };
var MX_KEYS = { lights:'start-lampu', clutch:'start-klac', wheels:'pit-roda', torque:'pit-tork', release:'pit-lollipop', brake:'brek', timing:'timing', apex:'apex', read:'baca-atk', traction:'traksi', quali:'quali', lane:'lane', chicane:'chicane', restart:'restart', grip:'grip' };
MGINFO['baca-def']=['Defend the line','Left / right',['Watch the proximity radar and spotter signal.','Cover the SAME side as the red threat.','3 rounds. Wait for the committed move; the rival can feint.']];
MGINFO['baca-atk']=['Take the gap','Left / right',['Follow the rival ahead.','Take the OTHER side when the open lane turns green.','3 rounds. Wait for the committed move; the rival can feint.']];
function mxGroup(kind) { return /^(lights|clutch)$/.test(kind) ? 'RACE START' : /^(wheels|torque|release)$/.test(kind) ? 'PIT LANE' : kind === 'quali' ? 'HOT LAP' : /^(read|lane)$/.test(kind) ? 'WHEEL TO WHEEL' : 'DRIVER CHALLENGE'; }
function mxKind(key) { var keys=Object.keys(MX_KEYS); for(var i=0;i<keys.length;i++) if(MX_KEYS[keys[i]]===key) return keys[i]; return key==='baca-def'?'read':key==='tutup'?'brake':'timing'; }
function mxViewStop() { if(MX41.observer) MX41.observer.disconnect(); MX41.observer=null; cancelAnimationFrame(MX41.viewFrame); cancelAnimationFrame(MX41.clockFrame); MX41.viewFrame=0; MX41.clockFrame=0; }
function mxSet(el, value) { if(el && el.textContent!==value) el.textContent=value; }
function mxBattleHUD(){var f=MX41.ctx.foe;if(!f)return '';return '<div class="mx-battle-hud"><b>'+esc(me().code)+' <small>YOU</small></b><span>'+ (MX41.ctx.g!=null?MX41.ctx.g.toFixed(1)+'s':'VS')+'</span><b>'+esc(f.d.code)+'</b></div>';}
/* The pit camera uses a 1000 × 740 space. Gun nozzles and wheel targets share these anchors. */
var MX_PIT_WHEELS = [[78.1,14.6],[78.1,86.6],[17.8,14.6],[17.8,86.6]];
function mxPitLayout() {
  return MX_PIT_WHEELS.map(function(w,i){
    var x=60+w[0]*8.8, y=198+w[1]*880*274/70000, bottom=i%2;
    return {x:x,y:y,crewY:y-(bottom?.03:.97)*184,turn:bottom?180:0};
  });
}
function mxCrewHTML() {
  return '<div class="mx-crew" aria-hidden="true">'+mxPitLayout().map(function(v,i){
    return '<i data-mx-crew="'+i+'" style="left:'+v.x/10+'%;top:'+v.crewY/7.4+'%;--crew-turn:'+v.turn+'deg"><em></em></i>';
  }).join('')+'</div>';
}
function mxPitPaint(team) {
  ensureCarSprite();
  var L=carLivery(team), roles={pod:L.pod==='s'?L.s:L.b,halo:L.halo==='s'?L.s:L.halo==='a'?L.a:CARB,surr:L.b,cock:L.a,box:L.s,rwm:L.s,rwe:L.b,fwf:L.s,fwe:L.b,fin:L.a};
  return '<svg class="mx-pit-paint" data-livery-pattern="'+esc(L.p)+'" viewBox="0 0 700 274" aria-hidden="true"><rect width="700" height="274" fill="'+L.b+'"/>'+Object.keys(roles).map(function(r){return '<use href="#c2'+r+'" fill="'+roles[r]+'"/>';}).join('')+'<g clip-path="url(#c2clip)">'+carPattern(L)+'</g></svg>';
}
function mxPitCar(html, phase) {
  var root=document.createElement('div');root.innerHTML=html;var car=root.querySelector('.pcar');if(!car)return html;
  car.classList.add('mx-pit-car');car.querySelector('svg').outerHTML='<div class="mx-pit-body">'+mxPitPaint(myTeam())+'</div>';
  car.querySelectorAll('.pty').forEach(function(el,i){el.style.left=(MX_PIT_WHEELS[i][0]-7.5)+'%';el.style.top=(MX_PIT_WHEELS[i][1]-12.3)+'%';if(phase==='traffic'||phase==='clear'){el.classList.remove('wrk');el.classList.add('done');}});
  return root.innerHTML;
}
function mxRivalTeam() { var f=MX41.ctx.foe||UI.mgFoe;return f?(f.t||S.teams[f.d.team]):S.teams[(myTeam().id+3)%S.teams.length]; }
function mxRearCar(team) { return '<div class="mx-rear-car">'+mxStartPaint(team,false)+'</div>'; }
function mxTopCar(team) { return '<div class="mx-top-car"><div class="mx-top-body">'+mxPitPaint(team)+'</div></div>'; }
function mxRoadArt(kind, extra) {
  var straight=/^(read|lane|restart)$/.test(kind);
  return '<div class="mx-drive-camera'+(straight?' mx-drive-straight':'')+(kind==='grip'?' mx-drive-wet':'')+'" aria-hidden="true"><div class="mx-drive-world"><div class="mx-drive-player">'+mxStartPaint(myTeam(),true)+'</div></div>'+(extra||'')+'</div>';
}
function mxDriveScene(kind, meter, extra, preview) {
  var defend=MX41.key==='tutup', labels={brake:defend?'DEFEND / BRAKING WINDOW':'ATTACK / LATE BRAKING',timing:'BRAKING POINT',apex:'HOLD ENTRY / RELEASE EXIT',traction:'THROTTLE CONTROL',grip:'WET GRIP / GENTLE THROTTLE',quali:'HOT LAP / SECTOR TIMING',chicane:'CHICANE / FOLLOW THE SEQUENCE',restart:'SAFETY CAR IN / RESTART'};
  var zone=MX41.ctx.zone||(/^(restart|quali)$/.test(kind)?'RACE CONTROL':'NEXT CORNER'), rival=kind==='brake'&&!defend&&MX41.ctx.foe?'<div class="mx-drive-foe">'+mxRearCar(mxRivalTeam())+'</div>':'';
  return '<div class="mx-scene mx-driving-scene mx-driving-'+kind+(preview?' mx-preview':'')+'">'+mxRoadArt(kind,rival)+'<div class="mx-drive-hud"><span>'+esc(zone.toUpperCase())+'</span><b>'+labels[kind]+'</b><small data-mx-drive-cue>'+(kind==='chicane'?'FOLLOW THE LIT ARROW':kind==='restart'?'WAIT FOR GREEN':'FIND YOUR TIMING')+'</small></div>'+(defend?'<div class="mx-inside-call"><i>◉</i> SPOTTER / RIVAL CLOSE<br><b>HOLD THE INSIDE</b></div>':'')+(extra||'')+(meter?'<div class="mx-window"><span>'+(/^(grip|traction)$/.test(kind)?'KEEP THE NEEDLE IN GREEN':'YOUR TIMING WINDOW')+'</span>'+meter+'</div>':'')+'</div>';
}
function mxBattleScene(html, preview) {
  var root=document.createElement('div');root.innerHTML=html;
  var lanes=root.querySelector('.lanes3,.lanes'), defend=MX41.key==='baca-def', laneMode=!lanes.classList.contains('lanes3'), rival=lanes.querySelector('.rv3'), player=lanes.querySelector('.me3');
  if(rival)rival.innerHTML=defend?mxTopCar(mxRivalTeam()):mxRearCar(mxRivalTeam());
  if(player)player.innerHTML=defend?mxTopCar(myTeam()):'';
  return '<div class="mx-scene mx-battle-scene '+(defend?'mx-proximity-scene':laneMode?'mx-pass-scene':'mx-overtake-scene')+(preview?' mx-preview':'')+'"><div class="mx-camera-label">'+(defend?'PROXIMITY RADAR / DEFEND':laneMode?'BLUE FLAGS / PICK THE GAP':'SLIPSTREAM / TAKE THE GAP')+'</div>'+mxBattleHUD()+'<div class="mx-battle-camera"><div class="mx-battle-road">'+(defend?'<div class="mx-radar-rings" aria-hidden="true"></div>':mxRoadArt('read'))+lanes.outerHTML+(laneMode?'<div class="mx-lane-traffic" aria-hidden="true">'+mxRearCar(mxRivalTeam())+'</div>':'')+'</div><div class="mx-spotter" data-mx-decision>'+(defend?'CAR BEHIND / HOLD YOUR LINE':'WATCH THE CAR AHEAD')+'</div></div></div>';
}
function mxSyncBattle(root) {
  var scene=root&&root.querySelector('.mx-battle-scene');if(!scene)return;
  var signal=scene.querySelector('.lane3.open,.lane3.threat'), blocked=scene.querySelector('.lane.blk'), defend=scene.classList.contains('mx-proximity-scene'), side=null, label=defend?'CAR BEHIND / WAIT FOR THE MOVE':'CAR AHEAD / WAIT FOR THE GAP';
  if(signal){side=[].indexOf.call(scene.querySelectorAll('.lane3'),signal)===0?'LEFT':'RIGHT';label=defend?'SPOTTER / COVER '+side:'OPEN LANE / TAKE '+side;}
  if(blocked){var left=[].indexOf.call(scene.querySelectorAll('.lane'),blocked)===0, car=scene.querySelector('.mx-lane-traffic');side=left?'RIGHT':'LEFT';label='CLEAR LANE / TAKE '+side;if(car)car.style.left=left?'25%':'75%';}
  scene.classList.toggle('mx-signal-live',!!side);scene.classList.toggle('mx-signal-left',side==='LEFT');scene.classList.toggle('mx-signal-right',side==='RIGHT');
  mxSet(scene.querySelector('[data-mx-decision]'),label);
}
function mxSyncDriving(box) {
  var scene=box.querySelector('.mx-driving-scene');if(!scene)return;
  var marker=scene.querySelector('.mk'), zone=scene.querySelector('.zone,.band3'), cue=scene.querySelector('[data-mx-drive-cue]');
  if(marker&&zone){var x=parseFloat(marker.style.left)||0,lo=parseFloat(zone.style.left)||0,hi=lo+(parseFloat(zone.style.width)||0),inside=x>=lo&&x<=hi,kind=MX41.kind;
    scene.classList.toggle('mx-in-window',inside);
    mxSet(cue,/^(grip|traction)$/.test(kind)?(inside?'HOLD THIS LEVEL':x<lo?'ADD THROTTLE':'LIFT / EASE OFF'):kind==='apex'?(x<lo?'WAIT FOR ENTRY':x>hi?'EXIT / RELEASE':'IN THE CORNER / HOLD'):inside?(MX41.key==='tutup'?'COVER NOW':'IN THE WINDOW'):'FIND YOUR TIMING');
  }
  var restart=scene.querySelector('#rsg');if(restart)scene.classList.toggle('mx-restart-ready',/green/i.test(restart.textContent));
}
/* One square camera space for artwork, contact points and grid boxes. */
function mxStartGrid() { return RUN&&RUN.R&&RUN.R.p ? RUN.R.p.grid : MX41.ctx.pos||1; }
function mxStartLayout(race, grid) {
  if(!race) return [];
  return race.cars.filter(function(f){return !f.isP&&f.grid<grid;}).sort(function(a,b){return b.grid-a.grid;}).slice(0,2).map(function(f){
    var gap=grid-f.grid, scale=1/(1+.5*gap), w=330*scale, h=w/2;
    var x=500+(gap%2?(grid%2?1:-1)*330*scale:0), base=375+270*scale;
    return {car:f,x:x,y:base-.98*h,w:w,h:h,base:base,box:{far:base-1.18*h,back:base+.12*h,frontHalf:.53*w,backHalf:.55*w}};
  });
}
function mxStartPaint(team, front) {
  var L=carLivery(team), transform=front?'matrix(0 -1.05 3.65 0 0 1325)':'matrix(0 -1.3 3.65 0 0 500)';
  // Project the existing SVG pattern onto the neutral rendered body; rubber/carbon retain their shading.
  var roles=front?'<path d="M0 0H300V1000H0ZM700 0H1000V1000H700Z" fill="'+(L.pod==='s'?L.s:L.b)+'"/>':'<path d="M185 96H815V173H185Z" fill="'+L.s+'"/>';
  return '<svg class="mx-start-paint" data-livery-pattern="'+esc(L.p)+'" viewBox="0 0 1000 '+(front?'1000':'500')+'" aria-hidden="true"><rect width="1000" height="100%" fill="'+L.b+'"/><g transform="'+transform+'">'+carPattern(L)+'</g>'+roles+'</svg>';
}
function mxCockpitArt() {
  var grid=mxStartGrid(), layout=mxStartLayout(RUN&&RUN.R,grid), marks='', rivals='';
  layout.slice().reverse().forEach(function(v){
    var b=v.box, f=v.car, team=f.t||S.teams[f.d.team];
    marks+='<g data-grid-box="'+f.grid+'"><path d="M'+(v.x-b.frontHalf)+' '+b.far+'L'+(v.x-b.backHalf)+' '+b.back+'H'+(v.x+b.backHalf)+'L'+(v.x+b.frontHalf)+' '+b.far+'"/><ellipse cx="'+v.x+'" cy="'+v.base+'" rx="'+v.w*.49+'" ry="'+v.h*.1+'"/></g>';
    rivals+='<div class="mx-start-rival" data-grid="'+f.grid+'" style="left:'+(v.x-v.w/2)/10+'%;top:'+v.y/10+'%;width:'+v.w/10+'%;height:'+v.h/10+'%">'+mxStartPaint(team,false)+'<span class="mx-rival-tag">P'+f.grid+' <b>'+esc(f.d.code)+'</b></span></div>';
  });
  return '<div class="mx-cockpit-art mx-cockpit-render" aria-hidden="true"><div class="mx-start-world"><svg class="mx-start-boxes" viewBox="0 0 1000 1000">'+marks+'</svg>'+rivals+'<div class="mx-start-player">'+mxStartPaint(myTeam(),true)+'</div></div></div>';
}
function mxStartScene(lights, meter, preview) {
  return '<div class="mx-scene mx-start-scene'+(mxStartGrid()%2?'':' mx-even-grid')+(preview?' mx-preview':'')+'">'+mxCockpitArt()+'<div class="mx-gantry"><span>GRID TO GLORY / START SYSTEM</span>'+lights+'<div class="mx-start-call" data-mx-call>'+(preview?'FIVE LIGHTS. ONE MOMENT.':'EYES ON THE LIGHTS')+'</div></div><div class="mx-grid-tag">GRID <b>P'+mxStartGrid()+'</b></div>'+(meter?'<div class="mx-rev"><div><span>REV WINDOW</span><b data-mx-rev>0%</b></div>'+meter+'</div>':'')+'</div>';
}
function mxPitScene(car, lane, preview, phase) {
  var L=carLivery(myTeam()), comp=MX41.ctx.comp||(RUN&&RUN.R?RUN.R.p.comp:'M'), col=COMP[comp]?COMP[comp].col:'#ffd24a';phase=phase||'service';
  var root=document.createElement('div');root.innerHTML=lane||'';
  var pass=root.querySelector('.pass');if(pass){pass.classList.add('mx-pit-pass');pass.querySelector('svg').classList.add('mx-pit-paint');}
  var caption=phase==='traffic'?'HOLD / CAR IN THE FAST LANE':phase==='clear'?'LANE CLEAR / RELEASE':phase==='working'?'HOLD / CREW WORKING':'FOUR WHEELS. ONE CLEAN STOP.';
  return '<div class="mx-scene mx-pit-scene mx-pit-render mx-pit-'+phase+(preview?' mx-preview':'')+'" data-mx-pit-phase="'+phase+'" style="--mx-crew-color:'+L.b+';--mx-crew-stripe:'+L.s+';--mx-comp:'+col+'"><div class="mx-pit-sign"><span>'+esc(myTeam().short)+' / PIT BOX</span><b data-mx-wheels>CREW READY</b></div>'+(root.innerHTML||'<div class="mx-pit-lane" aria-hidden="true"><span>FAST LANE →</span></div>')+'<div class="mx-pit-floor"><div class="mx-pit-camera"><div class="mx-pit-world"><svg class="mx-pit-box" viewBox="0 0 1000 740" aria-hidden="true"><path d="M25 245V174H975V245M25 497V568H975V497"/><path class="mx-pit-guides" d="M25 184V150H97M903 150H975V184M25 558V592H97M903 592H975V558"/></svg>'+mxPitCar(car,phase)+mxCrewHTML()+'</div></div><div class="mx-pit-comp"><b>'+esc(comp)+'</b> NEW TYRES</div></div><div class="mx-pit-caption"><i></i><span>'+caption+'</span><b>FL · FR · RL · RR</b></div></div>';
}
function mxPreview(kind) {
  if(/^(lights|clutch)$/.test(kind)) return mxStartScene('<div class="lights">'+[0,1,2,3,4].map(function(){return '<i class="on"></i>';}).join('')+'</div>','',true);
  if(/^(wheels|torque|release)$/.test(kind)) return mxPitScene(pitCarH(['','','',''],false),'',true);
  if(kind==='read')return mxBattleScene('<div class="lanes3 '+(MX41.key==='baca-def'?'def':'atk')+'"><div class="lane3"></div><div class="lane3 '+(MX41.key==='baca-def'?'threat':'open')+'">'+(MX41.key==='baca-def'?'COVER!':'GAP!')+'</div><div class="rv3" style="left:'+(MX41.key==='baca-def'?75:25)+'%"></div><div class="me3"></div></div>',true);
  if(kind==='lane')return mxBattleScene('<div class="lanes"><div class="lane blk">SLOW CAR</div><div class="lane">CLEAR</div></div>',true);
  return mxDriveScene(kind,'','',true);
}
function mxHeader(title, practice) { return '<header class="mx-header"><div><span class="mx-live-dot"></span>'+(practice?'PRACTICE / NO RACE EFFECT':mxGroup(MX41.kind))+'<small>'+esc(leagueOf(S).toUpperCase())+'</small></div><h2>'+title+'</h2></header>'; }
function mxPresentation(html) {
  var root=document.createElement('div'); root.innerHTML=html;
  var heading=root.querySelector('h2'), title=heading?heading.innerHTML:(MGINFO[MX41.key]||['Driver challenge'])[0]; if(heading) heading.remove();
  var result=!!root.querySelector('[data-act="mg-ok"],.onb-res') || (!root.querySelector('button,.track,.lights,.lanes3,.lanes,#chs') && !!heading);
  if(result) {
    var bad=!!(heading&&heading.classList.contains('bad')) || !!root.querySelector('.bad') || /jump start|unsafe|slow|miss|early|late|wide|lost|overshot|hit!/i.test(title+' '+root.textContent), pc=root.querySelector('.pcar'); if(pc) pc.remove();
    var pitResult=!/^(lights|clutch)$/.test(MX41.kind);
    return '<div class="mx41 mx-result '+(bad?'mx-miss':'mx-success')+'" style="--tc:'+myTeam().color+'">'+mxHeader(title,MX41.practice)+'<div class="mx-result-art'+(pitResult?' mx-pit-result-art':'')+'" aria-hidden="true"><span>'+(bad?'!':'✓')+'</span>'+(pitResult?'<div class="mx-pit-result-car">'+mxPitPaint(myTeam())+'</div>':carSVG(myTeam(),420))+'</div><div class="mx-result-body">'+root.innerHTML+'</div></div>';
  }
  var hint=root.querySelector('p.dim'), hintHTML=hint?hint.outerHTML:''; if(hint) hint.remove();
  if(MX41.kind==='read'){
    var defend=MX41.key==='baca-def';title=defend?'Defend the line':'Take the gap';
    hintHTML='<p class="dim">'+(defend?'Read the proximity radar. Cover the SAME side as the red threat. Wait for the committed move.':'Read the car ahead. Take the OTHER side when the open lane turns GREEN.')+'</p>';
    root.querySelectorAll('[data-tap="rd-s"],[data-tap="mx-side"]').forEach(function(b){var left=b.dataset.d==='L';b.textContent=(left?'◀ ':'')+(defend?'COVER ':'TAKE ')+(left?'LEFT':'RIGHT')+(left?'':' ▶');});
  }
  function take(selector) { var e=root.querySelector(selector); if(!e) return ''; var h=e.outerHTML;e.remove();return h; }
  var signal=root.querySelector('.lane3.open,.lane3.threat'), verdictBox=root.querySelector('#vd3');
  if(signal&&verdictBox&&/wait for it/i.test(verdictBox.textContent)){
    var side=[].indexOf.call(root.querySelectorAll('.lane3'),signal)===0?'LEFT':'RIGHT';
    verdictBox.textContent=verdictBox.textContent.replace(/wait for it.*/i,(signal.classList.contains('threat')?'COVER ':'TAKE ')+side);
  }
  var scene='', kind=MX41.kind, meter;
  if(/^(lights|clutch)$/.test(kind)) scene=mxStartScene(take('.lights'),take('.track'),false);
  else if(/^(wheels|torque|release)$/.test(kind)) {
    var pitCar=take('.pcar'), pitLane=take('.plane'), releaseText=(root.querySelector('.big')||{}).textContent||'', phase=kind!=='release'?'service':/green/i.test(releaseText)?'clear':/car coming/i.test(releaseText)?'traffic':'working';
    if(phase==='traffic'&&!pitLane){var other=S.teams.filter(function(t){return t.id!==myTeam().id;})[0];pitLane='<div class="plane"><div class="pass">'+carSVG(other,300)+'</div></div>';}
    scene=mxPitScene(pitCar,pitLane,false,phase);
  }
  else if(kind==='restart'&&root.querySelector('#rsg')) scene=mxDriveScene(kind,'','<div class="mx-restart-board">'+take('#rsg')+'</div>',false);
  else if(root.querySelector('.lanes3,.lanes')) scene=mxBattleScene(take('.lanes3,.lanes'),false);
  else {
    meter=take('.track');
    scene=mxDriveScene(kind,meter,kind==='chicane'?'<div class="mx-sequence">'+take('#chs')+'</div>':'',false);
  }
  return '<div class="mx41 mx-play mx-'+kind+'" style="--tc:'+myTeam().color+'">'+mxHeader(title,MX41.practice)+'<div class="mx-layout"><div class="mx-stage">'+scene+'</div><div class="mx-controls">'+(kind==='wheels'?'<div class="mx-stopwatch"><span>WHEEL CHANGE / LIVE</span><b data-mx-clock>READY</b><small>REACTION TIME · SECONDS</small></div>':'')+hintHTML+root.innerHTML+'</div></div></div>';
}
function mxSyncView() {
  var box=document.querySelector('#modal .mx-play'); if(!box) return;
  mxSyncBattle(box);mxSyncDriving(box);
  var ls=box.querySelectorAll('.lights i.on'), count=ls.length, call=box.querySelector('[data-mx-call]');
  if(call) {
    if(count>0) MX41.sawRed=true;
    mxSet(call,count?'HOLD / '+count+' OF 5':MX41.sawRed?'LIGHTS OUT — GO!':'EYES ON THE LIGHTS');
    box.classList.toggle('mx-go',MX41.sawRed&&count===0);
    if(count>MX41.lastLights) snd('light'); else if(!count&&MX41.lastLights) snd('go');
    MX41.lastLights=count;
  }
  var marker=box.querySelector('.mx-rev .mk'); if(marker) mxSet(box.querySelector('[data-mx-rev]'),Math.round(parseFloat(marker.style.left)||0)+'%');
  var tyres=box.querySelectorAll('.pty'), finished=0;
  tyres.forEach(function(el,i){var crew=box.querySelector('[data-mx-crew="'+i+'"]'), done=el.matches('.done,.ok'), busy=el.matches('.lit,.cur,.wrk'); if(done) finished++; if(crew){crew.classList.toggle('done',done);crew.classList.toggle('busy',busy);crew.classList.toggle('error',el.classList.contains('no'));}});
  var pit=box.querySelector('[data-mx-pit-phase]'), phase=pit&&pit.dataset.mxPitPhase;
  if(tyres.length) mxSet(box.querySelector('[data-mx-wheels]'),phase==='traffic'?'HOLD / TRAFFIC':phase==='clear'?'CLEAR TO RELEASE':phase==='working'?'CREW WORKING':finished===4?'ALL FOUR SECURED':finished+' / 4 SECURED');
  if(box.querySelector('.pty.lit')&&MX41.clockStart==null)MX41.clockStart=performance.now();
  if(finished>MX41.wheels) snd('tick');MX41.wheels=finished;
}
function mxObserve() {
  mxViewStop(); mxSyncView();
  document.querySelectorAll('#modal .mx41 [data-tap="mg-w"]').forEach(function(el){el.setAttribute('aria-label','Change '+['front left','front right','rear left','rear right'][Number(el.dataset.k)]+' wheel');});
  var box=document.querySelector('#modal .mx-play'); if(!box) return;
  function clock(){if(!box.isConnected)return;var el=box.querySelector('[data-mx-clock]');if(!el)return;if(MX41.clockStart!=null)mxSet(el,((performance.now()-MX41.clockStart)/1000).toFixed(2));MX41.clockFrame=requestAnimationFrame(clock);}
  if(box.querySelector('[data-mx-clock]'))MX41.clockFrame=requestAnimationFrame(clock);
  MX41.observer=new MutationObserver(function(records){
    if(!records.some(function(r){var e=r.target.nodeType===1?r.target:r.target.parentElement;return e&&(e.matches('.lights i,.pty,.mk,.lane3,.lane,.rv3,#rsg')||e.closest('#vd3'));})) return;
    if(!MX41.viewFrame) MX41.viewFrame=requestAnimationFrame(function(){MX41.viewFrame=0;mxSyncView();});
  });
  MX41.observer.observe(box,{subtree:true,attributes:true,attributeFilter:['class','style'],childList:true,characterData:true});
}
(function(){
  var sm=showModal,cm=closeModal;
  showModal=function(html){
    mxViewStop();
    if(!MX41.active || MX41.testingOff) return sm(html);
    var strip=UI.mgStrip;UI.mgStrip=null;
    try { sm(mxPresentation(html)); } finally { UI.mgStrip=strip; }
    mxObserve();
  };
  closeModal=function(){mxViewStop();MX41.active=false;if(MX41.practiceStop){var stop=MX41.practiceStop;MX41.practiceStop=null;stop();}return cm();};
})();
function mxEnter(kind) {
  mxViewStop();MX41.active=true;MX41.kind=kind;MX41.lastLights=0;MX41.sawRed=false;MX41.wheels=0;MX41.clockStart=null;
  if(!MX41.key || mxKind(MX41.key)!==kind) MX41.key=MX_KEYS[kind];
}
/* Adapters only add presentation. The original callbacks receive the original values. */
function mxAdapt(kind,fn){MX41.legacy[kind]=fn;return function(){mxEnter(kind);return fn.apply(this,arguments);};}
startGame=mxAdapt('lights',startGame);clutchStart=mxAdapt('clutch',clutchStart);
pitGame=mxAdapt('wheels',pitGame);pitTorque=mxAdapt('torque',pitTorque);pitRelease=mxAdapt('release',pitRelease);
readGame=mxAdapt('read',readGame);brakeGame=mxAdapt('brake',brakeGame);timingGame=mxAdapt('timing',timingGame);apexGame=mxAdapt('apex',apexGame);
tractionGame=mxAdapt('traction',tractionGame);qualiGame=mxAdapt('quali',qualiGame);laneGame=mxAdapt('lane',laneGame);chicaneGame=mxAdapt('chicane',chicaneGame);
restartGo=mxAdapt('restart',restartGo);wetGo=mxAdapt('grip',wetGo);

/* One briefing, with optional instructions and a rehearsal. No repeated countdown/tutorial carousel. */
function mxBrief(o) {
  mxViewStop();MX41.active=false;MX41.practice=false;MX41.key=o.key;MX41.kind=mxKind(o.key);MX41.ctx=o.ctx||{};UI.mgCtx=null;UI.mgStrip=null;
  var inf=MGINFO[o.key], call=o.call||(o.call=mgCall(MX41.ctx,o.key));
  var hint=inf[2][0];if(o.key==='start-lampu')hint='Wait for all five red lights to go out. Then launch.';if(o.key==='pit-roda')hint='Four wheels. Tap each one when it lights up.';
  var h='<div class="mx41 mx-brief" style="--tc:'+myTeam().color+'">'+mxHeader(esc(inf[0]),false)+'<div class="mx-layout"><div class="mx-stage">'+mxPreview(MX41.kind)+'</div><div class="mx-controls"><div class="mx-radio-call"><span>'+ (call.s==='crew'?'PIT CREW':call.s==='rc'?'RACE CONTROL':'ENGINEER')+'</span><p>“'+esc(call.t)+'”</p></div><p class="mx-brief-hint">'+hint+'</p><div class="mx-input-tag">'+esc(inf[1])+'<span>'+(o.key==='start-klac'?'Space = throttle · → = launch':(o.key==='pit-roda'||o.key==='lane')?'Touch or Tab + Enter':/Left|lane/.test(inf[1])?'← / → or tap a side':'Touch or keyboard')+'</span></div><details class="mx-how"><summary>How to play</summary><ol>'+inf[2].filter(function(x){return x!=='Tap Start.';}).map(function(x){return '<li>'+x+'</li>';}).join('')+'</ol></details><button class="btn pri hit mx-primary" data-act="mg-go">'+(o.key==='pit-roda'?'BOX, BOX — START STOP':esc(call.rep))+' <span>→</span></button><div class="mx-secondary"><button class="btn" data-act="onb-prac">Practice</button><button class="btn" data-act="mg-cal">Calibrate touch</button></div></div></div></div>';
  showModal(h);mxSyncBattle(document.querySelector('#modal'));UI.mkey=mxBegin;
}
mgIntro=function(key,go,sub){
  if(!MGINFO[key]){go();return;}
  if(MX41.practiceStop){MX41.practiceStop();MX41.practiceStop=null;}
  ONB={key:key,go:go,sub:sub,ctx:UI.mgCtx||{},started:false};onbRep=ONB;mxBrief(ONB);
  A['mg-go']=mxBegin;
  A['mg-cal']=function(){var o=ONB;MX41.active=false;calibGame(function(){ONB=o;mxBrief(o);});};
};
function mxBegin(){
  var o=ONB;if(!o||o.started||MX41.practice)return;
  if(MX41.practiceStop){MX41.practiceStop();MX41.practiceStop=null;}
  o.started=true;MX41.practice=false;MX41.key=o.key;MX41.ctx=o.ctx||{};
  S.tut=S.tut||{};if(!S.tut[o.key]){S.tut[o.key]=1;save();}
  UI.mkey=null;UI.mgStrip=MX41.ctx.foe?MX41.ctx:null;UI.mgArm=performance.now()+250;
  o.go();
  if(o.key==='pit-roda'&&document.querySelector('#modal [data-act="mg-begin"]'))A['mg-begin']();
}
onbShow=function(){if(ONB)mxBrief(ONB);};
A['onb-fin']=mxBegin;
A['onb-replay']=function(){if(onbRep){ONB=onbRep;ONB.started=false;mxBrief(ONB);}};
A['mx-back']=function(){if(MX41.practiceStop){MX41.practiceStop();MX41.practiceStop=null;}MX41.practice=false;MX41.active=false;mxBrief(ONB);};

/* Rehearsals use the same inputs and thresholds, with fixed signals. They never touch S or race RNG. */
onbPractice=function(){
  if(!ONB)return;
  UI.mkey=UI.mkeyDown=UI.mkeyUp=UI.mkeyLR=null;
  var kind=mxKind(ONB.key);
  if(!/^(lights|clutch|wheels|torque|release)$/.test(kind)){
    return mxSkillPractice(kind);
  }
  if(MX41.practiceStop)MX41.practiceStop();
  MX41.practice=true;MX41.key=ONB.key;MX41.ctx=ONB.ctx||{};mxEnter(kind);
  var st={done:false,held:false,rev:.2,out:false,t0:0,lights:0,i:0,err:0,v:0,pen:0,started:false,phase:'working'},timers=[],raf=0,last=0,hist=[],classes=['','','',''];
  function later(fn,ms){timers.push(setTimeout(function(){if(!st.done)fn();},ms));}
  function stop(){st.done=true;timers.forEach(clearTimeout);cancelAnimationFrame(raf);unbindHold();UI.mkey=null;UI.mkeyLR=null;}
  MX41.practiceStop=stop;
  function back(){return '<button class="btn sm mx-practice-back" data-act="mx-back">← Back to briefing</button>';}
  function report(title,value,line,bad){stop();MX41.practiceStop=null;showModal('<h2'+(bad?' class="bad"':'')+'>'+title+'</h2><div class="big">'+value+'</div><div class="onb-res '+(bad?'warn':'good')+'">'+line+'</div><p class="dim">Practice only. Your race, XP and points are untouched.</p><div class="row"><button class="btn" data-act="onb-again">Try again</button><button class="btn pri" data-act="mx-back">Back to briefing →</button></div>');}
  function lightsHTML(){return '<div class="lights">'+[0,1,2,3,4].map(function(){return '<i></i>';}).join('')+'</div>';}
  function paintLights(n){document.querySelectorAll('#modal .lights i').forEach(function(el,i){el.className=i<n?'on':'';});}
  if(kind==='lights'||kind==='clutch'){
    var clutch=kind==='clutch';
    function launch(e){
      if(st.done)return;var jump=!st.out,ms=jump?0:Math.max(0,(tEv(e)-(clutch?MGT.lat:0)-st.t0)),good=st.rev>=.58&&st.rev<=.76;
      report(jump?'Jump start!':ms<260?'Sharp launch!':ms>=1500?'Missed the lights':'Off the line',jump?'+5s':Math.round(ms)+' ms',jump?'Wait until every red light goes out.':clutch?(good?'Revs in the green. Clean traction.':st.rev>.76?'Too many revs. Ease off before launch.':'Revs low. Build them into the green window.'):ms>=330?'Late off the line. Watch for the instant all five lights switch off.':'That is the real lights-out signal. You are ready for the grid.',jump||ms>=330);
    }
    showModal('<h2>'+ (clutch?'Clutch & throttle rehearsal':'Lights out rehearsal')+'</h2><p class="dim">'+(clutch?'Hold THROTTLE to keep revs in the green. Tap LAUNCH when the red lights go out.':'Five red lights. Tap LAUNCH only when all five go out.')+'</p>'+lightsHTML()+(clutch?'<div class="track"><div class="zone" style="left:58%;width:18%"></div><div class="mk" id="mk"></div></div><div class="row st9">'+holdBtn('cl','THROTTLE<br><small>hold</small>')+'<button class="btn hit st9-go" data-tap="mg-launch">LAUNCH</button></div>':'<button class="btn pri hit" data-tap="mg-hit">LAUNCH</button>')+back());
    arm();if(clutch){bindHold('cl',function(){st.held=true;},function(){st.held=false;});A['mg-launch']=function(d,b,e){launch(e);};UI.mkeyLR=function(d){if(d==='R')launch(null);};}else{A['mg-hit']=function(d,b,e){launch(e);};UI.mkey=launch;}
    var first=clutch?1400:750,step=clutch?850:750;
    for(var i=0;i<5;i++)(function(n){later(function(){paintLights(n);},first+(n-1)*step);})(i+1);
    later(function(){st.out=true;st.t0=performance.now();paintLights(0);later(function(){launch(null);},1500);},first+4*step+1200);
    if(clutch)(function frame(now){if(st.done)return;var dt=last?Math.min(.05,(now-last)/1000):0;last=now;st.rev=clamp(st.rev+(st.held ? .6 : -.75)*dt+Math.sin(now/90)*.003,0,1);var m=document.getElementById('mk');if(m)m.style.left=st.rev*100+'%';raf=requestAnimationFrame(frame);})(performance.now());
    return;
  }
  if(kind==='wheels'){
    var order=[1,3,0,2];
    function draw(){showModal('<h2>Wheel change rehearsal</h2><p class="dim">Tap the lit wheel. A wrong wheel adds time.</p>'+pitCarH(classes,st.started)+(st.started?'<p class="dim">'+st.i+' / 4 wheels</p>':'<button class="btn pri hit" data-act="mg-begin">Start rehearsal</button>')+back());}
    A['mg-begin']=function(){if(st.started||st.done)return;st.started=true;draw();arm();later(function(){st.t0=performance.now();classes[order[0]]='lit';draw();},650);};
    A['mg-w']=function(d){if(st.done||!st.t0)return;if(+d.k!==order[st.i]){st.err++;return;}classes[+d.k]='done';st.i++;if(st.i===4){var time=clamp(1.9+Math.max(0,(performance.now()-st.t0)/1000-1.6)*.9+st.err*.4,1.9,7);report('Stop complete',time.toFixed(1)+' s',st.err?st.err+' wrong taps. Follow the yellow wheel.':'All four wheels secured. Ready to race.',time>=3.2);}else{classes[order[st.i]]='lit';draw();}};
    draw();return;
  }
  if(kind==='torque'){
    var names=['Front left','Front right','Rear left','Rear right'];st.t0=performance.now();
    function drawTorque(){classes=classes.map(function(c,i){return i<st.i?c:i===st.i?'cur':'';});showModal('<h2>Wheel gun rehearsal</h2><p class="dim">Hold the gun. Release inside the green window.</p>'+pitCarH(classes,false)+'<p class="dim">'+names[st.i]+' · '+(st.i+1)+' / 4</p>'+trackH('tq3',zoneH(.66,.79,'zone')+zoneH(.79,1,'red3'))+holdBtn('tq','HOLD / WHEEL GUN')+back());bindHold('tq',function(){if(armed())st.held=true;},releaseTorque);arm();}
    function releaseTorque(){if(!st.held||st.done)return;st.held=false;var x=st.v-1.1*MGT.lat/1000,ok=x>=.66&&x<=.79;classes[st.i]=ok?'ok':'no';if(!ok)st.pen+=x>.79?(x<=.82?.25:.7):(x>=.63?.2:.45);st.i++;st.v=0;if(st.i===4){var t=(performance.now()-st.t0)/1000,time=clamp(1.9+Math.max(0,t-3.2)*.3+st.pen,1.9,7);report('Wheel gun report',time.toFixed(1)+' s',st.pen?'Some wheels missed the torque window. Release in the green.':'Four precise releases. Every wheel is secure.',time>=3.2);}else drawTorque();}
    drawTorque();(function frame(now){if(st.done)return;var dt=last?Math.min(.05,(now-last)/1000):0;last=now;if(st.held)st.v=Math.min(1.05,st.v+dt*1.1);var m=document.getElementById('tq3m');if(m)m.style.left=Math.min(100,st.v*100)+'%';if(st.v>=1.05&&st.held)releaseTorque();raf=requestAnimationFrame(frame);})(performance.now());return;
  }
  function drawRelease(label,cls){showModal('<h2>Safe release rehearsal</h2><p class="dim">Wait for GREEN. RED means traffic is passing.</p>'+pitCarH(['wrk','wrk','wrk','wrk'],false)+'<div class="big '+cls+'">'+label+'</div><button class="btn pri hit" data-tap="mg-lp">RELEASE!</button>'+back());}
  function release(){if(st.done)return;if(st.phase==='working'){drawRelease('CREW WORKING','warn');return;}var unsafe=st.phase==='traffic',ms=unsafe?0:Math.max(0,performance.now()-st.t0);report(unsafe?'Unsafe release!':'Clear to go',unsafe?'+3s':Math.round(ms)+' ms',unsafe?'A car was passing. Hold until the lane is clear.':'The pit lane is clear. That is your release signal.',unsafe);}
  A['mg-lp']=release;UI.mkey=release;drawRelease('CREW WORKING','warn');arm();later(function(){st.phase='traffic';drawRelease('CAR COMING','bad');},1200);later(function(){st.phase='clear';st.t0=performance.now();drawRelease('GREEN — RELEASE','good');},2400);later(release,4000);
};
/* The remaining rehearsals mirror each input pattern with deterministic signals. */
function mxSkillPractice(kind){
  if(MX41.practiceStop)MX41.practiceStop();
  MX41.practice=true;MX41.key=ONB.key;MX41.ctx=ONB.ctx||{};mxEnter(kind);
  var st={done:false,held:false,live:false,i:0,v:.3,inBand:0,t0:performance.now(),entry:null,exit:null},timers=[],raf=0,last=0,grades=[],key=ONB.key;
  function later(fn,ms){timers.push(setTimeout(function(){if(!st.done)fn();},ms));}
  function stop(){st.done=true;timers.forEach(clearTimeout);cancelAnimationFrame(raf);unbindHold();UI.mkey=UI.mkeyLR=null;}
  MX41.practiceStop=stop;
  function back(){return '<button class="btn sm mx-practice-back" data-act="mx-back">← Back to briefing</button>';}
  function report(title,value,line,bad){stop();MX41.practiceStop=null;showModal('<h2'+(bad?' class="bad"':'')+'>'+title+'</h2><div class="big">'+value+'</div><div class="onb-res '+(bad?'warn':'good')+'">'+line+'</div><p class="dim">Practice only. No race time, XP or points change.</p><div class="row"><button class="btn" data-act="onb-again">Try again</button><button class="btn pri" data-act="mx-back">Back to briefing →</button></div>');}
  function sides(hint,art,choose){showModal('<h2>'+esc(MGINFO[key][0])+' rehearsal</h2><p class="dim">'+hint+'</p>'+art+'<div class="row"><button class="btn pri hit" id="onbL" data-tap="mx-side" data-d="L">◀ LEFT</button><button class="btn pri hit" id="onbR" data-tap="mx-side" data-d="R">RIGHT ▶</button></div>'+back());A['mx-side']=function(d){choose(d.d);};document.getElementById('onbL').onclick=function(){choose('L');};document.getElementById('onbR').onclick=function(){choose('R');};UI.mkeyLR=choose;arm();}
  if(kind==='read'){
    var defend=key==='baca-def',team=MX41.ctx.foe&&MX41.ctx.foe.t?MX41.ctx.foe.t:S.teams[(myTeam().id+1)%S.teams.length];
    function choose(side){if(st.done||!st.live)return;var correct=side===(defend?'R':'L'),rt=performance.now()-st.t0;report(correct?'Read it right!':'Wrong side',correct?Math.round(rt)+' ms':'TRY AGAIN',correct?'You followed the real signal. Watch for the final move.':defend?'Cover the SAME side as the rival.':'Attack the OTHER side, into the open lane.',!correct);}
    sides(defend?'Wait for the rival to move. Cover the SAME side.':'Wait for the rival to move. Take the OTHER side.','<div class="lanes3 '+(defend?'def':'atk')+'"><div class="lane3"></div><div class="lane3"></div><div class="rv3" id="mx-practice-rival" style="left:50%">'+carSVG(team,90,true)+'</div><div class="me3">'+carSVG(myTeam(),90,true)+'</div></div>',choose);
    later(function(){st.live=true;st.t0=performance.now();document.getElementById('mx-practice-rival').style.left='75%';var lanes=document.querySelectorAll('#modal .lane3');lanes[defend?1:0].classList.add(defend?'threat':'open');lanes[defend?1:0].textContent=defend?'COVER!':'GAP!';},1200);
    later(function(){report('Signal missed','TOO SLOW','Wait for the move, then choose a side.',true);},3500);return;
  }
  if(kind==='lane'){
    var blocked='L';
    function choose(side){if(st.done)return;var ok=side!==blocked;report(ok?'Clear lane!':'Blocked lane',ok?'THROUGH':'TRY AGAIN',ok?'You picked the open lane. Keep watching for a switch.':'That lane has the slow car. Take the clear one.',!ok);}
    sides('Pick the clear lane. The slow car can switch sides.','<div class="lanes"><div class="lane blk" id="mx-block-left">SLOW CAR</div><div class="lane" id="mx-block-right">CLEAR</div></div>',choose);
    later(function(){blocked='R';document.getElementById('mx-block-left').classList.remove('blk');document.getElementById('mx-block-left').textContent='CLEAR';document.getElementById('mx-block-right').classList.add('blk');document.getElementById('mx-block-right').textContent='SLOW CAR';},900);return;
  }
  if(kind==='chicane'){
    var seq=['L','R','L','R'],hits=0;
    function choose(side){if(st.done)return;var ok=side===seq[st.i];if(ok)hits++;var e=document.getElementById('ch'+st.i);e.className=ok?'mx-arrow good':'mx-arrow bad';st.i++;if(st.i===4){report('Sequence complete',hits+' / 4',hits===4?'Four clean direction changes.':'Follow the lit arrow from left to right.',hits<3);}else document.getElementById('ch'+st.i).classList.add('current');}
    sides('Tap each lit arrow, in order. Four inputs before time runs out.','<div id="chs" class="mx-arrow-row">'+seq.map(function(d,i){return '<div class="mx-arrow'+(i===0?' current':'')+'" id="ch'+i+'">'+(d==='L'?'◀':'▶')+'</div>';}).join('')+'</div>',choose);later(function(){report('Time is up',hits+' / 4','Follow the lit arrow, one input at a time.',true);},3400);return;
  }
  if(kind==='restart'){
    function go(){if(st.done)return;var early=!st.live,ms=early?0:performance.now()-st.t0;report(early?'Too early!':ms<500?'Restart ready':'Late restart',early?'WAIT':Math.round(ms)+' ms',early?'The restart signal must turn GREEN before you go.':'That green signal is your cue to accelerate.',early||ms>=500);}
    showModal('<h2>Restart rehearsal</h2><p class="dim">Tap GO only when the restart signal turns green.</p><div class="big" id="rsg">WAIT...</div><button class="btn pri hit" data-tap="mg-rs">GO!</button>'+back());A['mg-rs']=go;UI.mkey=go;arm();later(function(){st.live=true;st.t0=performance.now();var e=document.getElementById('rsg');e.textContent='GREEN!';e.className='big good';},1600);later(function(){report('Signal missed','TOO SLOW','Watch for GREEN, then go.',true);},3500);return;
  }
  if(kind==='traction'||kind==='grip'){
    showModal('<h2>'+esc(MGINFO[key][0])+' rehearsal</h2><p class="dim">Hold to add throttle. Release to lift. Keep the needle inside the moving green window.</p><div class="track"><div class="zone" id="gz"></div><div class="mk" id="mk"></div></div><div class="bar"><i id="gt" style="width:0%"></i></div>'+holdBtn('gbtn','HOLD / THROTTLE')+back());bindHold('gbtn',function(){st.held=true;},function(){st.held=false;});arm();
    (function frame(now){if(st.done)return;var dt=last?Math.min(.05,(now-last)/1000):0;last=now;var u=(now-st.t0)/1000,b=.45+.18*Math.sin(u*1.7)+.06*Math.sin(u*4.3);st.v=clamp(st.v+(st.held ? .85 : -.75)*dt+Math.sin(u*9)*.004,0,1);if(st.v>=b-.1&&st.v<=b+.1)st.inBand+=dt;document.getElementById('gz').style.left=(b-.1)*100+'%';document.getElementById('gz').style.width='20%';document.getElementById('mk').style.left=st.v*100+'%';document.getElementById('gt').style.width=Math.min(100,u/3*100)+'%';if(u>=3){var percent=Math.round(st.inBand/3*100);report(percent>=50?'Grip controlled':'Throttle needs work',percent+'% IN GREEN','Add throttle when below the green window. Lift when above it.',percent<30);return;}raf=requestAnimationFrame(frame);})(performance.now());return;
  }
  if(kind==='apex'){
    var duration=2600,a=.3,b=.68;
    function pos(t){return (t-st.t0)/duration;}
    function press(e){if(st.done||st.entry!=null||!armed())return;st.entry=pos(tEv(e)-MGT.lat);hitMark('mx-apex',st.entry,'in');}
    function release(e){if(st.done||st.entry==null)return;st.exit=pos(tEv(e)-MGT.lat);finish();}
    function finish(){var entry=st.entry==null?1:Math.abs(st.entry-a),exit=st.exit==null?1:Math.abs(st.exit-b),ok=entry<=.07&&exit<=.07;report(ok?'Clean apex!':'Line needs work',ok?'TIDY':'TRY AGAIN','Press as the marker ENTERS the yellow band. Release as it LEAVES.',!ok);}
    showModal('<h2>Apex rehearsal</h2><p class="dim">HOLD at the left edge. RELEASE at the right edge.</p>'+trackH('mx-apex',zoneH(a,b,'band3'))+holdBtn('apb','HOLD THROUGH THE CORNER')+back());bindHold('apb',press,release);arm();(function frame(now){if(st.done)return;var x=pos(now);document.getElementById('mx-apexm').style.left=Math.min(100,x*100)+'%';if(x>=1.03){finish();return;}raf=requestAnimationFrame(frame);})(performance.now());return;
  }
  var brake=kind==='brake',quali=kind==='quali',centres=[.4,.62,.48],sp=1.6,c=.52;
  function position(t){var u=(t-st.t0)/1000;if(brake){u=u/1.7;return u*u*.6+u*.4;}var ph=u*sp%2;return ph<1?ph:2-ph;}
  function drawTiming(){
    if(quali){c=centres[st.i];sp=1.15+st.i*.3;}
    var zones=brake?zoneH(.67,.83,'zone')+zoneH(.83,1,'red3'):zoneH(c-.088*sp,c+.088*sp,'zone')+zoneH(c-.042*sp,c+.042*sp,'sweet');
    showModal('<h2>'+esc(MGINFO[key][0])+' rehearsal</h2><p class="dim">'+(brake?'Brake as late as you can inside the green window. Red means overshot.':quali?'Lock each of the three sectors in the green window.':'Tap in the green window. The centre is perfect.')+'</p>'+trackH('mx-time',zones)+(quali?'<div class="sectors">'+[0,1,2].map(function(i){return '<div class="sec '+(grades[i]?GRD[grades[i]].c:'')+'">S'+(i+1)+'<br>'+(grades[i]?GRD[grades[i]].n:i===st.i?'…':'–')+'</div>';}).join('')+'</div>':'')+'<button class="btn pri hit" data-tap="mx-time">'+(quali?'LOCK SECTOR':brake?'BRAKE!':'TAP THE WINDOW')+'</button>'+back());arm();st.t0=performance.now();st.live=true;cancelAnimationFrame(raf);raf=requestAnimationFrame(frame);
  }
  function tap(e){
    if(st.done||!st.live||!armed())return;st.live=false;var x=position(tEv(e)-MGT.lat),off=Math.abs(x-c)/sp,g=brake?(x>.83?'M':x>=.67?(x>.78?'P':'B'):'O'):off<=.042?'P':off<=.088?'B':off<=.13?'O':'M';
    if(quali){grades.push(g);st.i++;if(st.i<3){later(drawTiming,850);return;}var delta=grades.reduce(function(s,k){return s+QMOD[k];},0);report('Three sectors locked',(delta<0?'−':'+')+Math.abs(delta).toFixed(2)+' s','Practice lap delta from your three sector grades.',delta>0);}
    else report(GRD[g].n,brake?x>.83?'OVERSHOT':x<.67?'EARLY':'IN THE WINDOW':Math.round(off*1000)+' ms OFF',brake?'The later edge of the green window gives the best braking.':'Aim for the middle of the green window.',g==='M'||g==='O');
  }
  function frame(now){if(st.done||!st.live)return;var x=position(now),m=document.getElementById('mx-timem');if(m)m.style.left=clamp(x,0,1)*100+'%';if(brake&&x>=1.05){report('Braked too late','OVERSHOT','Brake inside the green window, before the red.',true);return;}raf=requestAnimationFrame(frame);}
  A['mx-time']=function(d,b,e){tap(e);};UI.mkey=tap;drawTiming();
}
/* Focused tap controls also work with Enter; wheel quadrants support Space as well. */
document.addEventListener('keydown',function(e){
  var b=e.target.closest&&e.target.closest('#modal .mx41 button[data-tap]');
  if(!b||b.disabled||e.repeat||(e.key!=='Enter'&&!(e.code==='Space'&&b.dataset.tap==='mg-w')))return;
  e.preventDefault();if(!armed())return;var fn=A[b.dataset.tap];if(fn)fn(b.dataset,b,e);
});
