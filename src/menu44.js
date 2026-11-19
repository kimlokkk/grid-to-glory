'use strict';
/* Opening menu: read saved career context without migrating it or changing simulation state. */
function mmCareer44(sv) {
  if (!sv || !sv.drivers || !sv.teams) return null;
  var p=sv.bench||sv.drivers[sv.pi];
  if (!p) return null;
  var t=sv.teams[p.team], rank=sv.drivers.indexOf(p), rounds=seasonRounds(sv);
  var circuit=sv.cal && CIRCUITS[sv.cal[sv.round]];
  return {p:p,t:t,league:leagueOf(sv).toUpperCase(),rank:rank<0?null:driverStandings(sv).indexOf(p)+1,
    next:sv.playerRetired?'Career complete':sv.bench?'Awaiting a seat':sv.round>=rounds?'Season review':circuit?circuit.name:'Race weekend',
    round:Math.min((sv.round||0)+1,rounds),rounds:rounds};
}
vMenu=function() {
  var sv=loadSave(), c=mmCareer44(sv), t=c&&c.t||TEAMS[Math.floor(Date.now()/86400000)%TEAMS.length];
  var h='<main class="mm44" style="--mm-team:'+t.color+'"><header class="mm44-top"><span><i></i> CAREER PADDOCK</span><span>RACE. RISE. REPEAT.</span></header>'+
    '<div class="mm44-stage" aria-hidden="true"><div class="mm44-garage"></div><div class="mm44-machine">'+pdCar(t)+'</div><div class="mm44-bay"><span>01 / TEAM GARAGE</span><b>'+esc(t.name)+'</b></div></div>'+
    '<section class="mm44-content"><div class="mm44-eyebrow">YOUR JOURNEY TO THE TOP</div><h1 class="mm44-logo"><span>GRID TO</span><b>GLORY<span>.</span></b></h1><p class="mm44-tag">Earn your seat. Own the race.</p>';
  if(c) {
    h+='<div class="mm44-career"><div class="mm44-driver">'+helmetSVG(c.p,64,false,sv)+'<div><small>'+esc(c.league)+' · SEASON '+sv.season+'</small><b>'+esc(c.p.name)+'</b><span>'+esc(c.t?c.t.name:'Free agent')+'</span></div><strong>'+(c.rank?'P'+c.rank:'—')+'<small>'+(c.rank?'STANDING':'NO SEAT')+'</small></strong></div>'+
      '<div class="mm44-next"><div><small>'+(sv.playerRetired?'LEGACY':sv.bench?'CAREER STATUS':sv.round>=c.rounds?'UP NEXT':'NEXT GRAND PRIX')+'</small><b>'+esc(c.next)+'</b></div><span>'+(sv.playerRetired?'RETIRED':sv.bench?'RESERVE':'RD '+c.round+' / '+c.rounds)+'</span></div></div>';
  } else h+='<p class="mm44-intro">From your first contract to the championship.<br>Your career starts in this garage.</p>';
  h+='<div class="mm44-actions">'+(c?'<button class="btn mm44-primary" data-act="continue">Continue career <span>→</span></button>':'')+
    '<button class="btn '+(c?'mm44-secondary':'mm44-primary')+'" data-act="new">New career <span>'+(c?'+':'→')+'</span></button></div>'+
    '<nav class="mm44-tools" aria-label="Menu utilities"><button data-act="mm-save">Save data</button><span>/</span><button data-act="mm-hall">Hall of fame</button><span>/</span><button data-act="chlog">What’s new <small>v'+APEX.ver+'</small></button></nav></section>'+
    '<footer class="mm44-footer"><span>EVERY LEGEND STARTS ON THE GRID.</span><small>All teams, drivers and circuits are fictional.</small></footer></main>';
  return h;
};
A['mm-hall']=function(){showModal(careerHallHTML(careerHallRead())+'<button class="btn wide" data-act="mclose">Back to menu</button>');};
A['mm-save']=function() {
  var c=mmCareer44(loadSave());
  showModal('<h2>Save data</h2><p class="dim" style="margin:12px 0 20px">Keep a backup of your career or bring one from another device.</p><div class="stack">'+(c?'<button class="btn pri wide" data-act="export">Export saved career</button>':'')+'<button class="btn wide" data-act="import">Import save code</button>'+(c?'<button class="btn wide" data-act="sp-open">Copy story pack</button>':'')+'<button class="btn wide" data-act="mclose">Back to menu</button></div>');
};
/* The base UI performs its first render before presentation modules load. */
if(UI.screen==='menu')render();
