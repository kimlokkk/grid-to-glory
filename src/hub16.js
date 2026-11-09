'use strict';
/* Five destinations, keeping old action aliases for existing links/saves and QA tools. */
function selectHubTab(tab) {
  var sections = { kal: ({ cal: 'calendar', res: 'results', his: 'history' })[UI.kalMode || 'cal'], kej: 'standings', news: 'news' };
  if (sections[tab]) { UI.musimView = sections[tab]; tab = 'musim'; }
  if (tab === 'saya' || tab === 'pemandu') tab = 'aku';
  if (tab === 'kereta') tab = 'team';
  UI.tab = NAV.some(function (x) { return x[0] === tab; }) ? tab : 'utama';
}
function hubSeasonHTML() {
  var r = Math.min(S.round + 1, seasonRounds(S)) + '/' + seasonRounds(S);
  return '<span class="hub-season-long">' + (S.jr && S.jr.on ? 'Junior Series · ' : '') + 'Season ' + S.season + ' · Round ' + r + '</span><span class="hub-season-short">' + (S.jr && S.jr.on ? 'JR · ' : '') + 'S' + S.season + ' · R' + r + '</span>';
}
function hMusim() {
  var views = [['calendar', 'Calendar'], ['results', 'Results'], ['standings', 'Standings'], ['news', 'News'], ['history', 'History']];
  if (S.world) views.push(['world', 'World']);
  var view = UI.musimView || 'calendar';
  if (!views.some(function (x) { return x[0] === view; })) view = 'calendar';
  return '<div class="hub-sections" role="group" aria-label="Season">' + views.map(function (x) { return '<button class="btn sm ' + (view === x[0] ? 'on' : '') + '" data-act="hub-section" data-v="' + x[0] + '">' + x[1] + '</button>'; }).join('') + '</div>' +
    ({ calendar: hKal, results: hRes, standings: hKed, news: hNews, history: hHist, world: hWorld })[view]();
}
function hAku() {
  if (S.sit) return '<div class="stack"><div class="card"><h2>' + esc(S.bench.name) + '</h2><p class="dim">Test and reserve driver · ' + esc(S.teams[S.sit.team].name) + '</p></div>' + reserveFocusHTML() + bodyCardHTML() + '</div>';
  return '<div class="' + (S.mode==='pro'?'driver-page':'stack') + '">' + drvCard() + evaluationCardHTML(false) + abilitiesHTML(false) + trainingCardHTML() + tPemandu() + '</div>';
}
function hTeam() { if (S.mode === 'pro' && myTeam().spec) return worldJuniorTeamHTML(myTeam()) + tmCardHTML(); return '<div class="stack">' + hPasukan() + (S.sit ? '' : tmCardHTML()) + '</div>'; }
function careerNudgeHTML() {
  var pending = S.offers && S.offers.length || S.mkt && S.mkt.s === S.season && !S.mkt.seen;
  if (!pending && S.contract !== 1) return '';
  return '<div class="card row sp"><div><b>Career</b><p class="dim">' + (S.contract === 1 ? 'Your contract ends this season.' : 'Paddock changes to review.') + '</p></div><button class="btn sm" data-act="tab" data-v="kerjaya">View →</button></div>';
}
function hKerjaya() {
  var p = S.bench || me(), t = S.teams[p.team], c = S.sit ? { pay: SIT.pay, end: S.season, wb: 0 } : conOf(S, p);
  var h = '<div class="stack"><div class="card stack"><h3>Current contract</h3><h2>' + esc(t.name) + '</h2><p>' + (S.sit ? 'Test and reserve driver' : 'Race driver') + ' · ' + S.contract + (S.contract === 1 ? ' season' : ' seasons') + ' remaining · ' + payTxt(c.pay) + '/season</p>' +
    '<p class="dim">Until Season ' + c.end + (c.wb ? ' · Win bonus ' + payTxt(c.wb) : '') + (c.opt && !c.opt.used ? ' · Extra-year option: ' + (c.opt.by === 'driver' ? 'driver' : 'team') : '') + '</p>' +
    (S.offers && S.offers.length && !S.sit ? '<button class="btn pri" data-act="season-end">Review offers</button>' : '') + '</div>';
  if (!S.sit) h += sponCardHTML();
  h += repCardHTML(S) + mktCard('') + tKerjaya();
  /* Scout Watch and legacy slots are populated when their gameplay modules exist. */
  if (typeof scoutWatchHTML === 'function') h += scoutWatchHTML();
  return h + '</div>';
}
A['tab'] = function (d) { selectHubTab(d.v); UI.wipe = false; UI.screen = 'hub'; render(); window.scrollTo(0, 0); };
A['hub-section'] = function (d) {
  if (['calendar', 'results', 'standings', 'news', 'history', 'world'].indexOf(d.v) < 0) return;
  UI.musimView = d.v; UI.tab = 'musim'; render(); window.scrollTo(0, 0);
};
A['hub-settings'] = function () { A.tab({v:'settings'}); };
A['kal-m'] = function (d) { UI.kalMode = d.v; selectHubTab('kal'); render(); };

['toggle', 'up', 'auto'].forEach(function (action) {
  A['ability-' + action] = function (d) { if (abilityPriority(S, d.v, action)) { save(); render(); } };
});

A['world-driver'] = function (d) { if (S.world) worldDriverModal(d.v); };
