'use strict';
/* ===== UI asas: simpan, menu, karier baharu, hab ===== */
var KEY = 'apex-karier-v1';
var S = null;
var UI = { screen: 'menu', tab: 'musim', wk: null, draft: { name: 'Hakim', arch: 'pace', team: 7 }, run: null, wipe: false, last: '' };
var A = {};
var $app = document.getElementById('app');
var $modal = document.getElementById('modal');

function save() { try { if (typeof APEX !== 'undefined' && S && S.drivers) { S.saveVer = APEX.save; S.appVer = APEX.ver; } localStorage.setItem(KEY, JSON.stringify(S)); UI.saveWarn = 0; return true; } catch (e) { if (!UI.saveWarn) { UI.saveWarn = 1; try { toast('Could not save: browser storage is full or blocked. Progress may be lost if you close the page.'); } catch (e2) { } } return false; } }
function loadSave() { try { var j = localStorage.getItem(KEY); return j ? JSON.parse(j) : null; } catch (e) { return null; } }
function toast(m) { var t = document.createElement('div'); t.className = 'toast'; t.textContent = m; document.body.appendChild(t); setTimeout(function () { t.remove(); }, 2600); }
function migrate(o) { o.settings = o.settings || {}; if (o.settings.v !== 3) { o.settings.mini = true; o.settings.ask = true; o.settings.v = 3; }
  /* versi English: buang teks lama Bahasa Melayu yang tersimpan */
  if (o.drivers && typeof drvInit === 'function') drvInit(o);
  if (o.news) o.news = o.news.filter(function (n) { return n && typeof n === 'object'; });
  if (o.rdLog) o.rdLog = o.rdLog.filter(function (l) { return !/^Musim |gagal|Pakej/.test(l); });
  if (typeof verMigrate === 'function') o = verMigrate(o);
  return o; }
function me() { return S.drivers[S.pi]; }
function myTeam() { return S.teams[me().team]; }
function tagT(t) { return '<span class="tag" style="--tc:' + t.color + '">' + t.short + '</span>'; }
function tagD(d) { return '<span class="tag" style="--tc:' + S.teams[d.team].color + '">' + d.code + '</span>'; }
function bar(v, cls) { return '<div class="bar ' + (cls || '') + '"><i style="width:' + clamp(v, 0, 100) + '%"></i></div>'; }
function chip(l, v) { return '<span class="chip">' + l + ' <b>' + v + '</b></span>'; }
function tyc(k, big) { return '<i class="ty' + (big ? ' big' : '') + '" style="--c:' + COMP[k].col + '">' + k + '</i>'; }
function showModal(h) { $modal.innerHTML = '<div class="modal"><div class="mbox">' + h + '</div></div>'; UI.modalT = performance.now(); }
function closeModal() { $modal.innerHTML = ''; UI.mkey = null; }

/* ---------- tema ikut warna pasukan ---------- */
function _rgb(h) { return [parseInt(h.substr(1, 2), 16), parseInt(h.substr(3, 2), 16), parseInt(h.substr(5, 2), 16)]; }
function _hex(c) { return '#' + c.map(function (v) { v = Math.max(0, Math.min(255, Math.round(v))); return (v < 16 ? '0' : '') + v.toString(16); }).join(''); }
function _lin(v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }
function _L(h) { var c = _rgb(h); return 0.2126 * _lin(c[0]) + 0.7152 * _lin(c[1]) + 0.0722 * _lin(c[2]); }
function _con(a, b) { var x = _L(a), y = _L(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); }
function _mix(a, b, t) { var p = _rgb(a), q = _rgb(b); return _hex([0, 1, 2].map(function (i) { return p[i] + (q[i] - p[i]) * t; })); }
function _hue(h) { var c = _rgb(h).map(function (v) { return v / 255; }), mx = Math.max.apply(null, c), mn = Math.min.apply(null, c), d = mx - mn; if (d < 0.16) return -1; var hh = mx === c[0] ? ((c[1] - c[2]) / d) % 6 : mx === c[1] ? (c[2] - c[0]) / d + 2 : (c[0] - c[1]) / d + 4; return (hh * 60 + 360) % 360; }
function themeOf(col) {
  var deep = '#141a33', t; for (t = 0; t <= 1; t += 0.05) { var c = _mix(col, '#141a33', t); if (_con(c, '#ffffff') >= 4.5) { deep = c; break; } }
  var hu = _hue(col), a1 = hu < 0 ? deep : col, a2 = (hu >= 30 && hu <= 65) ? '#1b2340' : '#f0b429';
  return { acc: a1, accDeep: deep, onAcc: _con(a1, '#ffffff') >= _con(a1, '#141a33') ? '#ffffff' : '#141a33', accSoft: _mix(a1, '#ffffff', 0.86), a2: a2, onA2: _con(a2, '#ffffff') >= _con(a2, '#141a33') ? '#ffffff' : '#1b2340' };
}
var _themeKey = '';
function applyTheme() {
  var col = UI.screen === 'new' && UI.draft && UI.draft.team != null ? TEAMS[UI.draft.team].color : UI.screen === 'menu' ? '#e2342b' : (S && S.drivers && S.teams) ? S.teams[me().team].color : '#e2342b';
  if (col === _themeKey) return; _themeKey = col;
  var th = themeOf(col), r = document.documentElement.style;
  r.setProperty('--acc', th.acc); r.setProperty('--accDeep', th.accDeep); r.setProperty('--onAcc', th.onAcc); r.setProperty('--accSoft', th.accSoft); r.setProperty('--a2', th.a2); r.setProperty('--onA2', th.onA2);
}
function render() {
  applyTheme();
  var h = '';
  if (UI.screen === 'menu') h = vMenu();
  else if (UI.screen === 'new') h = vNew();
  else if (UI.screen === 'hub') h = (S && S.sit && typeof vSit === 'function') ? vSit() : vHub();
  else if (UI.screen === 'wk') h = vWk();
  else if (UI.screen === 'season') h = vSeason();
  else if (UI.screen === 'review') h = vReview();
  else if (UI.screen === 'retire') h = vRetire();
  $app.innerHTML = '<div class="app">' + h + '</div>';
  var key = UI.screen + (UI.wk ? UI.wk.step : '');
  if (key !== UI.last) { UI.last = key; window.scrollTo(0, 0); }
}

document.addEventListener('click', function (e) {
  var b = e.target.closest('[data-act]');
  if (!b || b.disabled) return;
  /* klik hantu: jari yang tekan butang mini game jatuh atas butang baru (Teruskan) di tempat sama. Abaikan klik dalam popup yang baru muncul. */
  if (b.closest('#modal') && performance.now() - (UI.modalT || 0) < 650) return;
  var f = A[b.dataset.act];
  if (f) f(b.dataset, b);
});
/* butang masa-kritikal (mini game): bertindak masa jari MENYENTUH, bukan masa angkat */
document.addEventListener('pointerdown', function (e) {
  var b = e.target.closest('[data-tap]');
  if (!b || b.disabled) return;
  if (UI.mgArm && performance.now() < UI.mgArm) { e.preventDefault(); return; }
  e.preventDefault();
  var f = A[b.dataset.tap];
  if (f) f(b.dataset, b, e);
});
document.addEventListener('input', function (e) {
  var t = e.target;
  if (t.id === 'nm') UI.draft.name = t.value;
  if (t.id === 'plap' && UI.wk) { UI.wk.planLap = +t.value; var o = document.getElementById('plapv'); if (o) o.textContent = 'Lap ' + t.value; }
});
document.addEventListener('keyup', function (e) { if ((e.code === 'Space' || e.key === ' ') && UI.mkeyUp) { e.preventDefault(); UI.mkeyUp(e); } });
document.addEventListener('keydown', function (e) {
  if ((e.code === 'Space' || e.key === ' ') && UI.mkeyDown) { e.preventDefault(); if (!e.repeat) UI.mkeyDown(e); return; }
  if ((e.code === 'Space' || e.key === ' ') && UI.mkey) { e.preventDefault(); if (!e.repeat) UI.mkey(e); }
  if (UI.mkeyLR && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) { e.preventDefault(); UI.mkeyLR(e.key === 'ArrowLeft' ? 'L' : 'R'); }
});

/* ---------- menu ---------- */
function vMenu() {
  var sv = loadSave(), h = '<div class="hero"><div class="stripe"></div><div><h1>Grid to <span style="color:var(--acc)">Glory</span></h1></div>' +
    '<p class="dim" style="max-width:56ch">A racing driver career sim. Start at the back of the grid, call your own tyre and pit strategy, battle rain and safety cars, and climb your way to a championship-winning team. All teams and drivers are fictional.</p></div>';
  h += '<div class="stack">';
  if (sv && sv.drivers) {
    var p = sv.drivers[sv.pi], t = sv.teams[p.team];
    h += '<div class="card"><div class="row sp"><div><h3>Saved career</h3><h2 style="margin-top:6px">' + esc(p.name) + '</h2>' +
      '<p class="dim">Season ' + sv.season + ' · ' + t.name + ' · age ' + p.age + '</p></div><button class="btn pri" data-act="continue">Continue</button></div></div>';
  }
  h += '<div class="row"><button class="btn ' + (sv ? '' : 'pri') + '" data-act="new">New career</button><button class="btn" data-act="import">Import save</button></div></div>';
  return h;
}
A['continue'] = function () { var sv = loadSave(); if (!sv) return; S = migrate(sv); UI.screen = 'hub'; UI.tab = 'musim'; UI.wk = null; if (typeof liveSettle === 'function') liveSettle(); render(); };
A['new'] = function () { UI.screen = 'new'; render(); };
A['menu'] = function () { stopRun(); UI.screen = 'menu'; UI.wk = null; render(); };
A['import'] = function () {
  showModal('<h2>Import save</h2><p class="dim">Paste the save code you exported earlier.</p><textarea id="imp" spellcheck="false"></textarea><div class="row"><button class="btn pri" data-act="import-go">Import</button><button class="btn" data-act="mclose">Cancel</button></div>');
};
A['import-go'] = function () {
  try {
    var v = document.getElementById('imp').value.trim();
    var o = JSON.parse(decodeURIComponent(escape(atob(v))));
    if (!o.drivers || !o.teams) throw 0;
    S = migrate(o); save(); closeModal(); UI.screen = 'hub'; UI.tab = 'musim'; render(); toast('Save imported.');
  } catch (e) { toast('Invalid code.'); }
};
A['mclose'] = function () { closeModal(); };

/* ---------- karier baharu ---------- */
function vNew() {
  var d = UI.draft, h = '<div class="top"><div class="brand">Grid to <b>Glory</b></div><button class="btn sm" data-act="menu">Back</button></div><div class="stack">';
  h += '<div class="card stack"><h3>Driver name</h3><input type="text" id="nm" maxlength="18" value="' + esc(d.name) + '" autocomplete="off"></div>';
  h += '<div class="card stack"><h3>Driving style</h3><div class="pick">';
  Object.keys(ARCHS).forEach(function (k) { h += '<button class="opt ' + (d.arch === k ? 'on' : '') + '" data-act="d-arch" data-v="' + k + '"><div class="t">' + ARCHS[k].n + '</div><div class="s">' + ARCHS[k].d + '</div></button>'; });
  h += '</div></div><div class="card stack"><h3>First team</h3><div class="pick">';
  var lv = { 7: 'Medium', 8: 'Hard', 9: 'Very hard' };
  [7, 8, 9].forEach(function (i) {
    var t = TEAMS[i];
    h += '<button class="opt ' + (d.team === i ? 'on' : '') + '" data-act="d-team" data-v="' + i + '"><div class="t"><span class="tag" style="--tc:' + t.color + '">' + t.short + '</span>' + t.name + '</div><div class="s">Car rank #' + (i + 1) + ' of 10 · ' + lv[i] + '<br>' + t.base + ' · Team principal ' + t.tp.name + '<br>Teammate: ' + (function () { var m = BASE_DRIVERS.filter(function (b) { return b[8] === i; }); var k = m[0][3] >= m[1][3] ? m[0] : m[1]; return k[0] + ' (' + k[1] + ', ' + k[2] + ')'; })() + '</div></button>';
  });
  h += '</div></div><button class="btn pri wide" data-act="new-go">Start career</button></div>';
  return h;
}
A['d-arch'] = function (d) { UI.draft.arch = d.v; render(); };
A['d-team'] = function (d) { UI.draft.team = +d.v; render(); };
A['new-go'] = function () {
  var nm = (UI.draft.name || '').trim() || 'Driver';
  S = newCareer(nm, UI.draft.arch, UI.draft.team);
  save(); UI.screen = 'hub'; UI.tab = 'musim'; render();
};

/* ---------- hab ---------- */
function circuitChips(c) {
  return chip('Laps', laps2(c) + ' × ' + c.km.toFixed(1) + ' km') + chip('Rain', Math.round(c.rain * 100) + '%') +
    chip('Tyre wear', c.wear < 0.95 ? 'Low' : c.wear < 1.15 ? 'Medium' : 'High') +
    chip('Overtaking', c.ot < 0.5 ? 'Easy' : c.ot < 0.7 ? 'Medium' : 'Hard') +
    chip('Engine', c.pw >= 0.55 ? 'Important' : c.pw <= 0.4 ? 'Minor' : 'Medium');
}
function vHub() {
  var p = me(), t = myTeam(), ds = driverStandings(S), pos = ds.indexOf(p) + 1;
  var h = '<div class="top"><div class="brand">Grid to <b>Glory</b></div><div class="meta"><span>Season ' + S.season + ' · ' + Math.min(S.round + 1, 10) + '/10</span><button class="btn sm" data-act="menu">Menu</button></div></div>';
  h += '<div class="card row sp" style="margin-bottom:14px"><div class="row"><span class="numb" style="--tc:' + t.color + '">' + p.num + '</span><div><h2>' + esc(p.name) + '</h2><p class="dim">' + t.name + ' · age ' + p.age + ' · contract ' + S.contract + (S.contract === 1 ? ' season' : ' seasons') + ' · ' + payTxt(conOf(S, p).pay) + '</p></div></div>' +
    '<div class="row">' + chip('Standing', 'P' + pos) + chip('Points', p.pts) + chip('XP', S.xp) + chip('Morale', (S.morale == null ? 50 : S.morale) + '%') + '</div></div>';
  var tabs = [['musim', 'Season'], ['kej', 'Championship'], ['pemandu', 'Driver'], ['kereta', 'Car'], ['kerjaya', 'Career']];
  h += '<div class="tabs">' + tabs.map(function (x) { return '<button class="' + (UI.tab === x[0] ? 'on' : '') + '" data-act="tab" data-v="' + x[0] + '">' + x[1] + '</button>'; }).join('') + '</div>';
  h += ({ musim: tMusim, kej: tKej, pemandu: tPemandu, kereta: tKereta, kerjaya: tKerjaya })[UI.tab]();
  return h;
}
A['tab'] = function (d) { UI.tab = d.v; UI.wipe = false; render(); };

function tMusim() {
  var h = '<div class="cols two"><div class="stack">';
  if (S.round < 10) {
    var ci = S.cal[S.round], c = CIRCUITS[ci];
    h += '<div class="card nextc stack"><h3>Round ' + (S.round + 1) + ' · next up</h3><h2>' + c.name + '</h2><p class="dim">' + c.loc + '</p><div class="row">' + circuitChips(c) + '</div>' +
      '<p class="dim">Weekend: qualifying, strategy, start, race.</p><button class="btn pri wide" data-act="wk-start">Start race weekend</button></div>';
    if (S.rival && S.rival.season === S.season) { var rvd = S.drivers[S.rival.di]; h += '<div class="card row sp"><div><h3>Rival</h3><p style="margin-top:6px">' + tagD(rvd) + ' ' + esc(rvd.name) + '</p></div><div class="mono" style="font-size:20px">' + S.rival.w + ' – ' + S.rival.l + '</div></div>'; }
    h += (typeof mktCard === 'function' ? mktCard('') : '') + newsCard('', 4);
  } else {
    h += '<div class="card stack"><h3>Season ' + S.season + '</h3><h2>Season over</h2><p class="dim">All 10 rounds done. See the final standings and what\'s next for your contract.</p><button class="btn pri wide" data-act="season-end">Season results</button></div>';
  }
  h += '<div class="card"><h3 style="margin-bottom:8px">Calendar</h3><table class="t"><tbody>';
  for (var i = 0; i < 10; i++) {
    var cc = CIRCUITS[S.cal[i]], r = S.results[i];
    var res = r ? (r.dnf ? '<span class="bad">DNF</span>' : 'P' + r.pos) + (r.pts ? ' <span class="dim">· ' + r.pts + ' pts</span>' : '') : (i === S.round ? '<span class="pur">Next</span>' : '<span class="dim">–</span>');
    h += '<tr><td class="mono dim" style="width:30px">' + (i + 1) + '</td><td>' + cc.name + '</td><td class="r mono">' + res + '</td></tr>';
  }
  h += '</tbody></table></div></div><div class="stack">' + standingsMini() + '</div></div>';
  return h;
}
function standingsMini() {
  var ds = driverStandings(S), p = me(), h = '<div class="card"><h3 style="margin-bottom:8px">Driver standings</h3><table class="t"><tbody>';
  ds.forEach(function (d, i) {
    if (i < 6 || d === p) h += '<tr class="' + (d === p ? 'me' : '') + '"><td class="mono dim" style="width:28px">' + (i + 1) + '</td><td>' + tagD(d) + ' ' + esc(d.name) + '</td><td class="r mono">' + d.pts + '</td></tr>';
  });
  return h + '</tbody></table></div>';
}
function tKej() {
  var ds = driverStandings(S), ts = teamStandings(S), p = me();
  var h = '<div class="cols two"><div class="card"><h3 style="margin-bottom:8px">Drivers</h3><div class="scroll"><table class="t"><thead><tr><th>#</th><th>Driver</th><th class="r">Wins</th><th class="r">Pts</th></tr></thead><tbody>';
  ds.forEach(function (d, i) { h += '<tr class="' + (d === p ? 'me' : '') + '"><td class="mono dim">' + (i + 1) + '</td><td>' + tagD(d) + ' ' + esc(d.name) + '</td><td class="r mono">' + d.wins + '</td><td class="r mono">' + d.pts + '</td></tr>'; });
  h += '</tbody></table></div></div><div class="card"><h3 style="margin-bottom:8px">Constructors</h3><table class="t"><thead><tr><th>#</th><th>Team</th><th class="r">Pts</th></tr></thead><tbody>';
  ts.forEach(function (t, i) { h += '<tr class="' + (t.id === p.team ? 'me' : '') + '"><td class="mono dim">' + (i + 1) + '</td><td>' + tagT(t) + ' ' + t.name + '</td><td class="r mono">' + t.pts + '</td></tr>'; });
  return h + '</tbody></table></div></div>';
}
function tPemandu() {
  var p = me(), h = '<div class="card"><div class="row sp"><div><h3>Experience points</h3><div class="big" style="text-align:left;margin-top:6px">' + S.xp + ' <span class="dim" style="font-size:16px">XP</span></div></div><p class="dim" style="max-width:36ch">XP is earned after every race. Beating what your car should be capable of earns more XP.</p></div>';
  SKILLS.forEach(function (s) {
    var v = p[s[0]], cost = skillCost(v, S);
    h += '<div class="skill"><div><div class="nm">' + s[1] + '</div><div class="dim" style="font-size:12.5px">' + s[2] + '</div></div>' + bar(v, v >= 85 ? 'g' : '') + '<div class="mono">' + v + '</div><button class="btn sm" data-act="buy" data-k="' + s[0] + '" ' + (S.xp < cost || v >= 99 ? 'disabled' : '') + '>+1 · ' + cost + ' XP</button></div>';
  });
  return h + '</div>';
}
A['buy'] = function (d) { if (buySkill(S, d.k)) { save(); render(); } };

function tKereta() {
  var t = myTeam(), h = '<div class="cols two"><div class="card stack"><div class="row sp"><h2>' + t.name + '</h2>' + chip('Car performance', '#' + teamRank(S, t.id)) + '</div>';
  [['aero', 'Aero'], ['engine', 'Engine'], ['chassis', 'Chassis'], ['rel', 'Reliability']].forEach(function (k) {
    var rank = S.teams.slice().sort(function (a, b) { return b.car[k[0]] - a.car[k[0]]; }).indexOf(t) + 1;
    h += '<div class="skill"><div class="nm">' + k[1] + '</div>' + bar(t.car[k[0]]) + '<div class="mono">' + Math.round(t.car[k[0]]) + '</div><span class="dim mono">#' + rank + '</span></div>';
  });
  if (typeof ensureDev === 'function') ensureDev(S);
  if (t.dev && t.dev.tp) h += '<div class="skill"><div class="nm">Technical staff</div>' + bar((t.dev.staff - 0.8) / 0.4 * 100) + '<div class="mono">' + Math.round((t.dev.staff - 0.8) / 0.4 * 100) + '</div><span class="dim mono"></span></div>' +
    '<div class="skill"><div class="nm">Team principal</div>' + bar((t.dev.tp.skill - 0.75) / 0.5 * 100) + '<div class="mono">' + Math.round((t.dev.tp.skill - 0.75) / 0.5 * 100) + '</div><span class="dim" style="font-size:12.5px">' + esc(t.dev.tp.name) + '</span></div>' +
    '<p class="dim" style="font-size:13px">Boss\'s target this season: P' + t.dev.target + ' in the constructors\' championship. ' + (t.dev.tp.amb >= 2 ? 'He\'s not shy about setting targets.' : t.dev.tp.amb <= 0 ? 'He\'s playing it safe.' : '') + '</p>';
  if (t.fin && typeof finCardHTML === 'function') h += finCardHTML(t);
  if (t.fin && typeof facCardHTML === 'function') h += facCardHTML(t);
  if (t.dev && typeof devStatus === 'function') { var ds5 = devStatus(t), pc5 = Math.min(100, Math.round(ds5.prog / ds5.th * 100)); h += '<div class="devnow"><div class="row sp"><h3>Next upgrade</h3><span class="mono">' + (ds5.banked ? 'shelved' : pc5 + '%') + '</span></div><p style="margin:4px 0 6px"><b>' + (ds5.banked ? 'Development switched to next year\'s car' : (RDNAME[ds5.k] || 'New') + ' package in development') + '</b></p>' + bar(ds5.banked ? 100 : pc5, pc5 >= 100 ? 'g' : '') + '<p class="dim" style="font-size:12.5px;margin-top:6px">' + (ds5.banked ? 'The boss has given up on this season. Everything goes into the winter package.' : t.dev.tp.name + ' decides when it goes on the car. ' + (t.dev.tp.amb >= 2 ? 'Expect it early.' : t.dev.tp.amb <= 0 ? 'He likes to wait for a big step.' : 'Usually when it\'s properly ready.')) + '</p></div>'; }
  h += '<h3>R&amp;D focus</h3><div class="row">';
  [['aero', 'Aero'], ['engine', 'Engine'], ['chassis', 'Chassis'], ['rel', 'Reliability']].forEach(function (k) { h += '<button class="btn sm ' + (S.rd === k[0] ? 'on' : '') + '" data-act="rd" data-v="' + k[0] + '">' + k[1] + '</button>'; });
  h += '</div><p class="dim">No fixed upgrade calendar: each team principal decides when their package is ready. Patient bosses wait for a big, safer step; teams under pressure rush parts out, and rushed parts fail more often. Your team follows this R&amp;D focus, helped by your feedback skill. Every few seasons, new regulations can shake up the whole grid.</p>';
  if (S.rdLog.length) h += '<h3>Development log</h3>' + S.rdLog.slice(0, 5).map(function (l) { return '<p class="dim" style="font-size:13px">' + esc(l) + '</p>'; }).join('');
  h += '</div><div class="card"><h3 style="margin-bottom:8px">Car performance by team</h3><table class="t"><tbody>';
  S.teams.slice().sort(function (a, b) { return teamPower(b) - teamPower(a); }).forEach(function (x, i) { h += '<tr class="' + (x.id === t.id ? 'me' : '') + '"><td class="mono dim" style="width:28px">' + (i + 1) + '</td><td>' + tagT(x) + ' ' + x.name + '</td><td class="r mono">' + teamPower(x).toFixed(1) + '</td></tr>'; });
  return h + '</tbody></table></div></div>';
}
A['rd'] = function (d) { S.rd = d.v; save(); render(); };

function tKerjaya() {
  var c = S.career, h = '<div class="stack"><div class="card"><h3 style="margin-bottom:10px">Career stats</h3><div class="grid3">';
  [['Races', c.starts], ['Wins', c.wins], ['Podium', c.pods], ['Pole', c.poles], ['Fastest laps', c.fl], ['Points', c.pts], ['World titles', c.titles], ['DNF', c.dnf]].forEach(function (x) {
    h += '<div class="card" style="background:var(--panel2)"><div class="dim" style="font-size:12px">' + x[0] + '</div><div class="num" style="font-size:24px;font-weight:600">' + x[1] + '</div></div>';
  });
  h += '</div></div>';
  if (S.hist.length) {
    h += '<div class="card"><h3 style="margin-bottom:8px">Season history</h3><div class="scroll"><table class="t"><thead><tr><th>Season</th><th>Team</th><th class="r">Pos</th><th class="r">Pts</th><th>Champion</th></tr></thead><tbody>';
    S.hist.forEach(function (r) { h += '<tr><td class="mono">' + r.season + '</td><td><span class="tag" style="--tc:' + r.tcol + '">' + r.team + '</span></td><td class="r mono">P' + r.pos + '</td><td class="r mono">' + r.pts + '</td><td class="dim">' + esc(r.champ) + '</td></tr>'; });
    h += '</tbody></table></div></div>';
  }
  h += '<div class="card stack"><h3>Settings</h3><div class="row"><button class="btn sm ' + (S.settings.ask ? 'on' : '') + '" data-act="ask">Race decisions: ' + (S.settings.ask ? 'I decide' : 'Auto (watch)') + '</button><button class="btn sm ' + (S.settings.mini ? 'on' : '') + '" data-act="mini">Mini game: ' + (S.settings.mini ? 'On' : 'Off') + '</button><button class="btn sm" data-act="calib">Touch calibration (' + Math.round(MGT.lat) + ' ms)</button><button class="btn sm" data-act="export">Export save</button>' +
    (UI.wipe ? '<button class="btn sm bad" data-act="wipe-go">Yes, delete career</button><button class="btn sm" data-act="tab" data-v="kerjaya">Cancel</button>' : '<button class="btn sm bad" data-act="wipe">Delete career</button>') +
    '<button class="btn sm" data-act="retire">Retire</button></div><p class="dim">Your career auto-saves after every race in this browser. Use Export to move to another device.</p></div></div>';
  return h;
}
A['ask'] = function () { S.settings.ask = !S.settings.ask; save(); render(); };
A['mini'] = function () { S.settings.mini = !S.settings.mini; save(); render(); };
A['export'] = function () {
  var sv = UI.screen === 'menu' ? loadSave() : S;
  if (!sv) { toast('No saved career to export.'); return; }
  var code = btoa(unescape(encodeURIComponent(JSON.stringify(sv))));
  showModal('<h2>Export save</h2><p class="dim">Copy this code and keep it somewhere safe.</p><textarea id="exp" readonly spellcheck="false">' + code + '</textarea><div class="row"><button class="btn pri" data-act="copy">Copy</button><button class="btn" data-act="mclose">Close</button></div>');
};
A['copy'] = function () {
  var ta = document.getElementById('exp'); ta.select();
  try { navigator.clipboard.writeText(ta.value).then(function () { toast('Copied.'); }, function () { toast('Code selected, press Copy on your keyboard.'); }); } catch (e) { toast('Code selected, copy it manually.'); }
};
A['wipe'] = function () { UI.wipe = true; render(); };
A['wipe-go'] = function () { try { localStorage.removeItem(KEY); } catch (e) { } S = null; UI.wipe = false; UI.screen = 'menu'; render(); };
A['retire'] = function () { UI.screen = 'retire'; render(); };
