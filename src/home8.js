/* ===== Skrin tajuk + cipta pemandu (4 langkah) ===== */
var NATS = [['GB', 'United Kingdom'], ['DE', 'Germany'], ['FR', 'France'], ['IT', 'Italy'], ['ES', 'Spain'], ['NL', 'Netherlands'], ['BE', 'Belgium'], ['AT', 'Austria'], ['CH', 'Switzerland'], ['FI', 'Finland'], ['SE', 'Sweden'], ['DK', 'Denmark'], ['MC', 'Monaco'], ['PT', 'Portugal'], ['IE', 'Ireland'], ['PL', 'Poland'], ['BR', 'Brazil'], ['AR', 'Argentina'], ['MX', 'Mexico'], ['US', 'United States'], ['CA', 'Canada'], ['AU', 'Australia'], ['NZ', 'New Zealand'], ['JP', 'Japan'], ['CN', 'China'], ['TH', 'Thailand'], ['MY', 'Malaysia'], ['IN', 'India'], ['ID', 'Indonesia'], ['ZA', 'South Africa'], ['AE', 'United Arab Emirates'], ['NO','Norway'], ['BG','Bulgaria'], ['CO','Colombia'], ['LK','Sri Lanka'], ['SG','Singapore'], ['KR','South Korea'], ['TR','Turkey']];
function flagE(c) { c = String(c || '').toUpperCase(); if (!FLAG_SVGS[c]) return ''; return '<img class="country-flag" src="'+FLAG_SVGS[c]+'" alt="'+natName(c)+' flag" width="20" height="14">'; }
function natName(c) { for (var i = 0; i < NATS.length; i++) if (NATS[i][0] === c) return NATS[i][1]; return c; }
function draft() {
  var d = UI.draft;
  if (!d.v8) {
    d.v8 = 1; d.step = 1; d.first = d.first || (d.name ? d.name.split(' ')[0] : 'Hakim'); d.last = d.last || ''; d.nat = d.nat || 'MY'; d.age = d.age || 19; d.arch = d.arch || 'pace';
    d.team = d.team != null && d.team >= 7 ? d.team : 7; d.num = d.num || 19;
    d.helm = d.helm || { c1: '#e2342b', c2: '#ffffff', c3: '#1b2340', p: 0, v: 0, p2: 1 };
  }
  return d;
}
function takenNums() { var t = {}; BASE_DRIVERS.forEach(function (b) { t[b[9]] = 1; }); return t; }
function draftName(d) { return ((d.first || '').trim() + ' ' + (d.last || '').trim()).trim() || 'Driver'; }

/* ---------- skrin tajuk ---------- */
function vMenu() {
  var sv = loadSave(), hero = sv && sv.drivers ? sv.teams[sv.drivers[sv.pi].team] : TEAMS[Math.floor(Date.now() / 86400000) % TEAMS.length];
  var h = '<div class="t8"><div class="t8-bg"><i></i><i></i><i></i></div><div class="t8-in">' +
    '<div class="t8-brand"><span>GRID TO</span><b>GLORY</b></div>' +
    '<p class="t8-tag">Your seat. Your strategy. Your championship.</p>' +
    '<div class="t8-car">' + carSVG(hero, 520) + '</div>';
  if (sv && sv.drivers) {
    var p = sv.drivers[sv.pi], t = sv.teams[p.team];
    h += '<div class="t8-save" style="--tc:' + t.color + '"><div class="t8-hl">' + helmetSVG(Object.assign({}, p, { team: null }), 58, false) + '</div><div class="t8-si"><small>Continue career</small><b>' + esc(p.name) + '</b><span>' + esc(t.name) + ' · Season ' + sv.season + ' · Round ' + Math.min(sv.round + 1, seasonRounds(sv)) + '/' + seasonRounds(sv) + '</span></div><button class="btn pri" data-act="continue">Continue →</button></div>';
  }
  h += '<div class="t8-btns' + (sv && sv.drivers ? ' t8-b3' : '') + '"><button class="btn ' + (sv ? '' : 'pri') + ' wide" data-act="new">New career</button>' + (sv && sv.drivers ? '<button class="btn wide ghost8" data-act="export">Export save</button>' : '') + '<button class="btn wide ghost8" data-act="import">Import save</button></div>' +
    '<p class="t8-foot">All teams, drivers and circuits are fictional.<br><button class="t8-ver" data-act="chlog">v' + APEX.ver + ' · What\'s new</button></p></div></div>';
  return h;
}
A['new'] = function () { UI.draft.v8 = 0; draft(); UI.screen = 'new'; render(); };

/* ---------- cipta pemandu ---------- */
var STEPS8 = ['Driver', 'Helmet', 'Team', 'Contract'];
function vNew() {
  var d = draft(), h = '<div class="top"><div class="brand">Grid to <b>Glory</b></div><button class="btn sm" data-act="menu">Exit</button></div>';
  h += '<div class="w8-steps">' + STEPS8.map(function (s, i) { return '<div class="' + (i + 1 === d.step ? 'on' : i + 1 < d.step ? 'done' : '') + '"><i>' + (i + 1 < d.step ? '✓' : i + 1) + '</i><span>' + s + '</span></div>'; }).join('') + '</div><div class="stack w8">';
  h += ({ 1: w8Driver, 2: w8Helmet, 3: w8Team, 4: w8Contract })[d.step](d);
  var sv8 = d.step === 4 ? loadSave() : null;
  if (sv8) h += '<p class="warn" style="margin:10px 0 0">You already have a saved career (' + esc(sv8.drivers[sv8.pi].name) + ', season ' + sv8.season + '). Starting a new one replaces it.</p>';
  h += '<div class="w8-nav">' + (d.step > 1 ? '<button class="btn" data-act="w8-back">← Back</button>' : '<span></span>') +
    (d.step < 4 ? '<button class="btn pri" data-act="w8-next">Next: ' + STEPS8[d.step] + ' →</button>' : '<button class="btn pri" data-act="' + (sv8 && !d.sure ? 'w8-sure' : 'new-go') + '">' + (sv8 && !d.sure ? 'Replace saved career' : 'Sign & start career') + '</button>') + '</div></div>';
  return h;
}
function w8Driver(d) {
  var tk = takenNums(), nums = '';
  for (var n = 2; n <= 99; n++) if (!tk[n]) nums += '<button class="' + (d.num === n ? 'on' : '') + '" data-act="w8-num" data-v="' + n + '">' + n + '</button>';
  var h = '<div class="card stack"><h3>Your name</h3><div class="w8-2"><input type="text" id="w8f" maxlength="14" placeholder="First name" value="' + esc(d.first) + '" autocomplete="off"><input type="text" id="w8l" maxlength="16" placeholder="Last name" value="' + esc(d.last) + '" autocomplete="off"></div>' +
    '<p class="dim" style="font-size:12.5px;margin:0">Your 3-letter code comes from your last name (or first name if you leave it empty).</p></div>';
  h += '<div class="card stack"><div class="w8-2"><div><h3>Nationality</h3><select id="w8n" class="w8-sel">' + NATS.slice().sort(function (a, b) { return a[1] < b[1] ? -1 : 1; }).map(function (x) { return '<option value="' + x[0] + '"' + (x[0] === d.nat ? ' selected' : '') + '>' + esc(x[1]) + '</option>'; }).join('') + '</select></div>' +
    '<div><h3>Age</h3><div class="w8-age">' + (d.careerMode === 'pro' ? [d.protege ? d.age : 16] : [18, 19, 20, 21, 22]).map(function (a) { return '<button class="' + (d.age === a ? 'on' : '') + '" data-act="w8-age" data-v="' + a + '">' + a + '</button>'; }).join('') + '</div></div></div></div>';
  h += '<div class="card stack"><div class="row sp"><h3>Race number</h3><span class="w8-bignum">#' + d.num + '</span></div><div class="w8-nums">' + nums + '</div><p class="dim" style="font-size:12px;margin:0">Numbers already used by other drivers are hidden.</p></div>';
  h += '<div class="card stack"><h3>Driving style</h3><div class="pick">';
  Object.keys(ARCHS).forEach(function (k) { h += '<button class="opt ' + (d.arch === k ? 'on' : '') + '" data-act="d-arch" data-v="' + k + '"><div class="t">' + ARCHS[k].n + '</div><div class="s">' + ARCHS[k].d + '</div></button>'; });
  return h + '</div></div>';
}
function w8Helmet(d) {
  var me8 = { name: draftName(d), num: d.num, helm: d.helm, id: -9 }, L = d.helm;
  var h = '<div class="card w8-hel"><div class="w8-hprev">' + helmetSVG(me8, 190, false) + '<div><b>' + esc(draftName(d)) + '</b><span>' + flagE(d.nat) + ' #' + d.num + '</span><button class="btn sm" data-act="w8-rand">🎲 Randomise</button></div></div></div>';
  h += '<div class="card stack"><h3>Design</h3><div class="w8-pats">' + HPAT.map(function (_, i) { return '<button class="' + (L.p === i ? 'on' : '') + '" data-act="w8-pat" data-v="' + i + '">' + helmetSVG({ name: '', num: '', helm: Object.assign({}, L, { p: i }), id: -9 }, 64, false) + '</button>'; }).join('') + '</div></div>';
  function sw(key, label) { return '<div class="w8-sw"><small>' + label + '</small><div>' + HPAL.map(function (c) { return '<button style="background:' + c + '" class="' + (L[key] === c ? 'on' : '') + '" data-act="w8-col" data-k="' + key + '" data-v="' + c + '" aria-label="' + c + '"></button>'; }).join('') + '</div></div>'; }
  h += '<div class="card stack"><h3>Colours</h3>' + sw('c1', 'Base') + sw('c2', 'Design') + sw('c3', 'Detail & number') + '</div>';
  h += '<div class="card stack"><h3>Visor & extras</h3><div class="w8-age">' + ['Dark', 'Gold', 'Blue', 'Red'].map(function (n, i) { return '<button class="' + (L.v === i ? 'on' : '') + '" data-act="w8-vis" data-v="' + i + '">' + n + '</button>'; }).join('') + '</div>' +
    '<div class="w8-age">' + ['Clean', 'Pinstripe', 'Rear flash'].map(function (n, i) { return '<button class="' + (L.p2 === i ? 'on' : '') + '" data-act="w8-p2" data-v="' + i + '">' + n + '</button>'; }).join('') + '</div></div>';
  return h;
}
function w8Team(d) {
  var lv = { 7: 'Medium', 8: 'Hard', 9: 'Very hard' }, h = '<div class="card"><h3>Three teams want you</h3><p class="dim" style="margin:6px 0 0">Every career starts at the back. Pick the team you want to grow with. A better car is easier now, a weaker one makes every point count.</p></div>';
  [7, 8, 9].forEach(function (i) {
    var t = TEAMS[i], m = BASE_DRIVERS.filter(function (b) { return b[8] === i; }), mate = m[0][3] >= m[1][3] ? m[0] : m[1], on = d.team === i;
    var bars = [['aero', 'Aero'], ['engine', 'Engine'], ['chassis', 'Chassis'], ['rel', 'Reliability']].map(function (k) { return '<div class="w8-bar"><span>' + k[1] + '</span><i><u style="width:' + Math.round((t.car[k[0]] - 50) / 49 * 100) + '%;background:' + t.color + '"></u></i><b>' + t.car[k[0]] + '</b></div>'; }).join('');
    h += '<button class="w8-team' + (on ? ' on' : '') + '" data-act="d-team" data-v="' + i + '" style="--tc:' + t.color + '">' +
      '<div class="w8-th"><div><small>' + esc(t.base) + ' · Est. ' + t.founded + '</small><b>' + esc(t.name) + '</b><span>' + esc(t.engine) + ' · Car rank #' + (i + 1) + ' · ' + lv[i] + '</span></div><div class="w8-tcar">' + carSVG(t, 64, true) + '</div></div>' +
      '<p class="w8-blurb">' + esc(t.blurb) + '</p><div class="w8-bars">' + bars + '</div>' +
      '<div class="w8-ppl"><div><small>Team principal</small><b>' + esc(t.tp.name) + '</b></div><div class="w8-mate">' + helmetSVG({ name: mate[0], id: 100 + i, num: mate[9], team: null }, 34, false) + '<div><small>Teammate</small><b>' + flagE(mate[1]) + ' ' + esc(mate[0]) + '</b><span>age ' + mate[2] + ' · #' + mate[9] + '</span></div></div></div>' +
      (on ? '<div class="w8-pick">✓ Selected</div>' : '') + '</button>';
  });
  return h;
}
function w8Pay(d) { var q = { pace: 66, cons: 66, race: 66, wet: 66, tyre: 66, fb: 66 }, b = ARCHS[d.arch].b; for (var k in b) q[k] += b[k]; return payTxt(payFor(ovr(q))) + '/season'; }
function w8Contract(d) {
  var t = TEAMS[d.team], me8 = { name: draftName(d), num: d.num, helm: d.helm, id: -9 };
  return '<div class="card w8-con" style="--tc:' + t.color + '"><small>Driver contract</small><div class="w8-cm">' + helmetSVG(me8, 120, false) + '<div><b>' + esc(draftName(d)) + '</b><span>' + flagE(d.nat) + ' ' + esc(natName(d.nat)) + ' · age ' + d.age + ' · #' + d.num + '</span><span>' + ARCHS[d.arch].n + '</span></div></div>' +
    '<div class="w8-ct"><div><small>Team</small><b>' + esc(t.name) + '</b></div><div><small>Length</small><b>2 seasons</b></div><div><small>Salary</small><b>' + w8Pay(d) + '</b></div></div>' +
    '<div class="w8-carbig">' + carSVG(t, 320) + '</div><p class="dim" style="font-size:12.5px;margin:0">' + esc(t.tp.name) + ': “Welcome aboard. Show us what you can do, and the rest will follow.”</p></div>';
}
A['w8-next'] = function () { var d = draft(); if (d.step === 1 && !(d.first || '').trim()) { toast('Enter a name first.'); return; } d.step = Math.min(4, d.step + 1); render(); window.scrollTo(0, 0); };
A['w8-sure'] = function () { var d = draft(); d.sure = true; toast('Tap again to confirm: your saved career will be replaced.'); render(); };
A['w8-back'] = function () { var d = draft(); d.step = Math.max(1, d.step - 1); render(); window.scrollTo(0, 0); };
A['w8-age'] = function (x) { draft().age = +x.v; render(); };
A['w8-num'] = function (x) { draft().num = +x.v; render(); };
A['w8-pat'] = function (x) { draft().helm.p = +x.v; render(); };
A['w8-col'] = function (x) { draft().helm[x.k] = x.v; render(); };
A['w8-vis'] = function (x) { draft().helm.v = +x.v; render(); };
A['w8-p2'] = function (x) { draft().helm.p2 = +x.v; render(); };
A['w8-rand'] = function () { var H = draft().helm, c = shuffle(HPAL.slice()); H.c1 = c[0]; H.c2 = c[1]; H.c3 = c[2]; H.p = Math.floor(rnd() * HPAT.length); H.v = Math.floor(rnd() * 4); H.p2 = Math.floor(rnd() * 3); render(); };
A['d-team'] = function (x) { draft().team = +x.v; render(); };
document.addEventListener('input', function (e) {
  var t = e.target, d = UI.draft; if (!d) return;
  if (t.id === 'w8f') d.first = t.value; else if (t.id === 'w8l') d.last = t.value;
});
document.addEventListener('change', function (e) { if (e.target.id === 'w8n') { draft().nat = e.target.value; } });
A['new-go'] = function () {
  var d = draft(), nm = draftName(d);
  S = newCareer(nm, d.arch, d.team);
  var p = S.drivers[S.pi]; p.nat = d.nat; p.age = d.age; p.num = d.num; p.helm = Object.assign({}, d.helm);
  UI.draft.v8 = 0;
  save(); UI.screen = 'hub'; UI.tab = 'utama'; render();
};
render();
