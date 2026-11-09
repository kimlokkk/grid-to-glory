/* App version and release notes; save format version is independent. */
var APEX = { ver: '2.0.0', date: '9 Nov 2026', save: 2 };
var CHANGELOG = [
  { v: '2.0.0', d: 'Major career update', date: '9 Nov 2026', l: [
    "Start a Pro career at 16 in F3, earn promotion to F2 and qualify for an F1 debut. Choose your driver identity, helmet, archetype and funding background.",
    "Race a fixed 22-round F1 calendar with fictional GTG circuits, unique maps, profiles and strategy guides. Junior seasons use an eight-round calendar.",
    "A living F3, F2 and F1 world: ten teams per league, 30 F3 seats, 20 F2/F1 seats, driver regeneration and car development. Junior cars share a specification within their league.",
    "Scout Watch, performance-based offers, academy invitations or Express Interest, funded seat packages, permanent F1 licence eligibility and champion promotion routes.",
    "Six-stat Overall, XP-funded training, Fitness, Recovery, race-day Focus, annual ageing previews, car-relative performance assessment, H2H and tiers.",
    "Abilities, mastery, loadouts and bounded Cap Breaker growth. Mechanical DNFs are excluded from driving-performance penalties.",
    "Separate Tyres, Fuel and Energy controls with engineer Auto/Manual, meaningful resource trade-offs and optional engineer advice.",
    "Guided, Casual and Expert assistance, practice tutorials and Highlights playback alongside live viewing and Fast.",
    "F1 contract progression, one comeback opportunity after losing a seat, optional retirement from 38, a final racing season at 44 and retirement at 45. Hall of Fame records and a next-career legacy.",
    "Race consistency fixes across forecasts, strategy, HUD/results, pits, spins, press conferences and news.",
    "Fully English UI, five main menus, small-phone and desktop polish, enhanced team cards and supplied SVG country flags.",
    "Existing saves and Classic careers remain supported. Export/import and Hall of Fame backups help preserve progress."] },
  { v: '1.0.0', d: 'Launch', date: '2 Nov 2026', l: [
    'Full career mode: create a driver, race 10 rounds a season, grow your skills with XP and chase the title.',
    'Qualifying, pit stops, tyres, weather, safety cars and the mini-games, with auto-run if you just want to watch.',
    'Living grid: AI teams develop their cars, run budgets, change plans, sign and sack drivers.',
    'Contracts, offers, buyouts, reputation, sponsors, fame and press conferences.',
    'Teammate rapport and team orders. A reserve year if you lose your seat.',
    'Facilities, engine alliances, team loans and young driver tests.',
    'Final-race radio, end-of-season radio and a full Season review.',
    'Circuit history for every track, plus a career that ages: skills fade after 31, retirement at 42.'] }
];
/* nombor versi save: tambah langkah migrasi di sini bila format berubah */
function verMigrate(o) {
  if (o.saveVer > APEX.save) throw new Error('This save requires a newer game build');
  foundationInit(o);
  if (o.meta.rng != null) seedRnd(o.meta.rng);
  o.saveVer = APEX.save; o.appVer = APEX.ver;
  return o;
}
function chlogHTML() {
  return '<div class="stack"><h3>What\'s new</h3>' + CHANGELOG.map(function (c) {
    return '<div><div class="row sp"><b>v' + c.v + '</b><span class="mono dim">' + c.d + ' · ' + (c.date || APEX.date) + '</span></div><ul style="margin:6px 0 0;padding-left:18px">' + c.l.map(function (x) { return '<li class="dim" style="font-size:13px;margin:3px 0">' + esc(x) + '</li>'; }).join('') + '</ul></div>';
  }).join('') + '<button class="btn" data-act="mclose">Close</button></div>';
}
if (typeof A !== 'undefined') A['chlog'] = function () { showModal(chlogHTML()); };
