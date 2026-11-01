/* ===== v1.0: nombor versi, changelog, versi dalam save ===== */
var APEX = { ver: '1.0.0', date: '2 Nov 2026', save: 1 };
var CHANGELOG = [
  { v: '1.0.0', d: 'Launch', l: [
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
  var from = o.saveVer || 0;
  /* save sebelum 1.0 tiada saveVer; semua medan baru sudah diisi oleh init masing-masing */
  o.saveVer = APEX.save; o.appVer = APEX.ver;
  return o;
}
function chlogHTML() {
  return '<div class="stack"><h3>What\'s new</h3>' + CHANGELOG.map(function (c) {
    return '<div><div class="row sp"><b>v' + c.v + '</b><span class="mono dim">' + c.d + ' · ' + APEX.date + '</span></div><ul style="margin:6px 0 0;padding-left:18px">' + c.l.map(function (x) { return '<li class="dim" style="font-size:13px;margin:3px 0">' + esc(x) + '</li>'; }).join('') + '</ul></div>';
  }).join('') + '<button class="btn" data-act="mclose">Close</button></div>';
}
if (typeof A !== 'undefined') A['chlog'] = function () { showModal(chlogHTML()); };
