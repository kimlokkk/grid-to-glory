/* ===== Fasa B: perkembangan pemandu, siri junior, sejarah & profil ===== */
var ATTRS = ['pace', 'cons', 'race', 'wet', 'tyre'], ATTRN = { pace: 'Pace', cons: 'Consistency', race: 'Racecraft', wet: 'Wet weather', tyre: 'Tyre management' };
var JR_NAME = 'Apex Junior Series';
/* jenis bakat: bentuk atribut + atribut yang berkembang paling laju */
var DTYPES = {
  speed: { n: 'Raw speed', off: { pace: 6, cons: -5, race: 1, wet: 0, tyre: -2 }, gw: { pace: 1.2, cons: 0.9 }, bio: 'Blisteringly quick over one lap, still learning to put a whole race together.' },
  rain: { n: 'Rain master', off: { pace: -1, cons: 1, race: 0, wet: 7, tyre: 0 }, gw: { wet: 1.2 }, bio: 'Comes alive when the heavens open. Car control is his calling card.' },
  tyre: { n: 'Tyre whisperer', off: { pace: -3, cons: 3, race: 0, wet: 0, tyre: 6 }, gw: { tyre: 1.2, cons: 1.1 }, bio: 'Makes a set of tyres last forever. Strategists love him.' },
  racer: { n: 'Racer', off: { pace: 1, cons: -3, race: 6, wet: 0, tyre: -1 }, gw: { race: 1.2 }, bio: 'Lives for wheel-to-wheel combat. Never gives an inch.' },
  calc: { n: 'Calculated', off: { pace: -2, cons: 6, race: -3, wet: 0, tyre: 2 }, gw: { cons: 1.2 }, bio: 'Mature beyond his years. Rarely fast, rarely wrong.' },
  all: { n: 'All-rounder', off: { pace: 0, cons: 1, race: 0, wet: 0, tyre: 0 }, gw: {}, bio: 'No obvious weakness. Does everything well.' }
};
function typeOf(d) {
  if (d.ty && DTYPES[d.ty]) return d.ty;
  var m = (d.pace + d.cons + d.race + d.wet + d.tyre) / 5, best = 'all', bv = 2.5;
  [['pace', 'speed'], ['wet', 'rain'], ['tyre', 'tyre'], ['race', 'racer'], ['cons', 'calc']].forEach(function (x) { var v = d[x[0]] - m; if (v > bv) { bv = v; best = x[1]; } });
  return best;
}
/* rekod karier sebelum musim 1 (rekaan) */
var CAREER0 = {
  'Jonas Albrecht': [196, 31, 74, 22, 2], 'Leo Castellani': [42, 2, 9, 3, 0], 'Oliver Hale': [138, 18, 47, 15, 1], 'Ryan Kellett': [88, 6, 22, 4, 0],
  'Antoine Sauvage': [150, 7, 30, 14, 0], 'Matteo Ruggeri': [260, 3, 28, 2, 0], 'Thiago Valença': [172, 44, 92, 30, 3], 'Kenta Arakawa': [66, 0, 2, 0, 0],
  'Callum Ashby': [180, 1, 12, 0, 0], 'Javier Lozano': [230, 4, 21, 2, 0], 'Lars Kjær': [290, 1, 9, 1, 0], 'Nathan Desrosiers': [110, 0, 1, 0, 0],
  'Hugo Lemaire': [170, 0, 3, 0, 0], 'Emiliano Robles': [64, 0, 1, 0, 0], 'Sebastian Vogt': [270, 2, 14, 1, 0], 'Freddie Marsh': [0, 0, 0, 0, 0],
  'Aleksi Rautio': [150, 0, 4, 0, 0], 'Blake Harrow': [22, 0, 0, 0, 0], 'Jamie Thornton': [140, 0, 1, 0, 0], 'Cole Matthews': [20, 0, 0, 0, 0]
};
/* penjana nama ikut negara (untuk siri junior) */
var NAMEGEN = {
  GB: [['Harry', 'Alfie', 'Archie', 'Jack', 'Oscar', 'George', 'Theo', 'Louis', 'Ethan', 'Max', 'Rory', 'Toby'], ['Turner', 'Hughes', 'Lawson', 'Bennett', 'Fletcher', 'Marsden', 'Holloway', 'Pritchard', 'Sutton', 'Wilde', 'Carver', 'Fenwick']],
  FR: [['Lucas', 'Mathis', 'Arthur', 'Nolan', 'Enzo', 'Clément', 'Bastien', 'Raphaël'], ['Girard', 'Morel', 'Fontaine', 'Rousseau', 'Chevalier', 'Perrin', 'Lambert', 'Faure']],
  DE: [['Felix', 'Leon', 'Paul', 'Niklas', 'Moritz', 'Tim', 'Jannik', 'Luca'], ['Krüger', 'Hartmann', 'Becker', 'Schreiber', 'Lorenz', 'Brandt', 'Kessler', 'Wolff']],
  IT: [['Marco', 'Andrea', 'Davide', 'Tommaso', 'Gabriele', 'Riccardo', 'Edoardo', 'Filippo'], ['Bianchi', 'Galli', 'Marchetti', 'Conti', 'Lombardi', 'Serra', 'Fabbri', 'Moretto']],
  ES: [['Pablo', 'Daniel', 'Álvaro', 'Marc', 'Sergio', 'Hugo'], ['Navarro', 'Ruiz', 'Castillo', 'Morales', 'Vidal', 'Romero']],
  NL: [['Sem', 'Daan', 'Thijs', 'Lars', 'Jesse', 'Ruben'], ['de Vries', 'Bakker', 'Janssen', 'Visser', 'Smit', 'Meijer']],
  BR: [['Pedro', 'Gabriel', 'Enzo', 'Rafael', 'Felipe', 'Caio'], ['Oliveira', 'Barbosa', 'Ferraz', 'Machado', 'Pereira', 'Teixeira']],
  AU: [['Jack', 'Liam', 'Cooper', 'Mitchell', 'Lachlan', 'Riley'], ['Walsh', 'Kennedy', 'Hayes', 'McKay', 'Doyle', 'Reid']],
  US: [['Logan', 'Tyler', 'Mason', 'Hunter', 'Carter', 'Brody'], ['Reynolds', 'Parker', 'Hayward', 'Collins', 'Brooks', 'Sullivan']],
  JP: [['Ren', 'Sota', 'Haruto', 'Yuto', 'Kaito', 'Riku'], ['Sato', 'Nakamura', 'Fujita', 'Ishikawa', 'Kimura', 'Hayashi']],
  BE: [['Arnaud', 'Thibault', 'Jens', 'Wout', 'Maxime', 'Lander'], ['Peeters', 'Claes', 'Dubois', 'Maes', 'Wouters', 'Lemmens']],
  DK: [['Oliver', 'Mikkel', 'Emil', 'Rasmus'], ['Nielsen', 'Holm', 'Lund', 'Kristensen']],
  FI: [['Eetu', 'Joona', 'Lauri', 'Ville'], ['Korhonen', 'Laine', 'Heikkinen', 'Niemi']],
  AT: [['Lukas', 'Jakob', 'Florian', 'Elias'], ['Gruber', 'Huber', 'Steiner', 'Moser']],
  MX: [['Santiago', 'Diego', 'Mateo', 'Iker'], ['Herrera', 'Ramírez', 'Castañeda', 'Fuentes']],
  CA: [['Liam', 'Noah', 'Félix', 'Owen'], ['Tremblay', 'Gagnon', 'MacLeod', 'Bouchard']],
  CN: [['Zhou', 'Wei', 'Hao', 'Yifan'], ['Chen', 'Lin', 'Zhang', 'Wang']],
  AR: [['Franco', 'Nicolás', 'Tomás', 'Joaquín'], ['Acosta', 'Benítez', 'Sosa', 'Medina']],
  NZ: [['Hamish', 'Finn', 'Jake', 'Ollie'], ['Burke', 'Harlow', 'Kingi', 'Maxwell']],
  SE: [['Viktor', 'Axel', 'Hugo', 'Linus'], ['Lindgren', 'Berg', 'Ekström', 'Sandberg']],
  CH: [['Noah', 'Jonas', 'Levin', 'Nico'], ['Keller', 'Meier', 'Baumann', 'Frei']],
  MY: [['Aiman', 'Irfan', 'Hafiz', 'Danial'], ['Rahman', 'Iskandar', 'Zulkifli', 'Hakimi']],
  TH: [['Pongsakorn', 'Kittipat', 'Nattawut'], ['Srisuk', 'Chaiyaphum', 'Wongsa']],
  IN: [['Arjun', 'Rohan', 'Kabir'], ['Mehta', 'Kapoor', 'Iyer']]
};
var NATW = [['GB', 18], ['FR', 9], ['DE', 8], ['IT', 8], ['NL', 6], ['ES', 6], ['BR', 6], ['AU', 5], ['US', 5], ['JP', 5], ['BE', 3], ['DK', 3], ['FI', 3], ['AT', 3], ['MX', 3], ['CA', 3], ['CN', 2], ['AR', 2], ['NZ', 2], ['SE', 2], ['CH', 2], ['MY', 1], ['TH', 1], ['IN', 1]];
function pickNat() { var t = 0; NATW.forEach(function (x) { t += x[1]; }); var r = rnd() * t; for (var i = 0; i < NATW.length; i++) { r -= NATW[i][1]; if (r <= 0) return NATW[i][0]; } return 'GB'; }
function allNames(S) { var u = {}; (S.drivers || []).concat(S.reserves || [], S.juniors || [], S.retired || []).forEach(function (d) { u[d.name] = 1; }); return u; }
function genName(S, nat) { var g = NAMEGEN[nat] || NAMEGEN.GB, u = allNames(S); for (var k = 0; k < 30; k++) { var n = pick(g[0]) + ' ' + pick(g[1]); if (!u[n]) return n; } return pick(g[0]) + ' ' + pick(g[1]) + ' Jr'; }
function ovr(d) { return Math.round(rating(d)); }

function newJunior(S, age, opt) {
  var nat = pickNat(), r = rnd(), pot = opt && opt.pot ? opt.pot : Math.round(r < 0.04 ? rr(89, 94) : r < 0.22 ? rr(83, 89) : rr(72, 83)), base = rr(58, 66) + (age - 16) * 2.5;
  var tys = ['speed', 'speed', 'rain', 'tyre', 'racer', 'racer', 'calc', 'all', 'all'], ty = pick(tys);
  var j = { name: genName(S, nat), nat: nat, age: age, pot: pot, pk: Math.round(rr(25, 30)), ty: ty, jr: { pts: 0, wins: 0, titles: 0, seasons: 0 }, fb: 55 + Math.round(rnd() * 25), hy: gauss() * 4, acad: pickAcad(S) };
  ATTRS.forEach(function (k) { j[k] = Math.round(clamp(base + DTYPES[ty].off[k] + gauss() * 2.2 + (pot - 85) * 0.15, 50, 82)); });
  return j;
}
function drvInit(S) {
  (S.drivers || []).concat(S.reserves || []).forEach(function (d) {
    if (d.pk == null) d.pk = Math.round(rr(26, 31));
    if (d.pot == null) d.pot = Math.max(ovr(d), d.age < 26 ? ovr(d) + Math.round(rr(3, 8)) : ovr(d));
    if (!d.cs) { var c = CAREER0[d.name] || [0, 0, 0, 0, 0]; d.cs = { starts: c[0], wins: c[1], pods: c[2], poles: c[3], titles: c[4] }; }
    if (!d.sh) d.sh = [];
    if (!d.rh) d.rh = [{ s: S.season, r: ovr(d) }];
    if (!d.pa) d.pa = {};
  });
  if (!S.juniors) { S.juniors = []; for (var i = 0; i < 10; i++) S.juniors.push(newJunior(S, 17 + Math.floor(rnd() * 4))); }
  if (!S.retired) S.retired = [];
  if (typeof conInit === 'function') conInit(S);
  if (typeof mktInit === 'function') mktInit(S);
  if (typeof finInit === 'function') finInit(S);
  if (typeof objFor === 'function') (S.drivers || []).forEach(function (d) { if (!d.obj && d.team >= 0) objFor(S, d, S.season); });
}
/* prestasi berbanding jangkaan kereta, setiap race (bukan berbanding rakan sepasukan) */
function drvPerf(S, d, x) {
  var exp = teamRank(S, d.team) * 1.4 + 1.7, sc;       /* purata posisi sebenar ikut kedudukan kereta (diukur dari simulasi) */
  if (x.dnf) sc = /mechanical/i.test(String(x.car.dnf || '')) ? 0 : -0.6;     /* rosak bukan salah dia */
  else sc = clamp((exp - x.pos) / 6, -1, 1.5);
  d.perf = d.perf || { n: 0, s: 0 }; d.perf.n++; d.perf.s += sc;
}
function perfMult(d) { var p = d.perf; if (!p || !p.n) return 1; return clamp(1 + 0.4 * (p.s / p.n), 0.7, 1.4); }
/* persekitaran pasukan: staf teknikal + team principal */
function envMult(S, d) {
  var t = S.teams[d.team]; if (!t || !t.dev) return 1;
  var st = clamp((t.dev.staff - 0.8) / 0.4, 0, 1), tp = clamp(((t.dev.tp ? t.dev.tp.skill : 1) - 0.75) / 0.5, 0, 1);
  return 0.85 + 0.3 * (0.6 * st + 0.4 * tp);
}
/* rekod hujung musim: sejarah setiap pemandu */
function drvRecord(S) {
  drvInit(S);
  var ds = driverStandings(S);
  teamStandings(S).forEach(function (t, i) { t.sh = t.sh || []; if (t.sh.length && t.sh[t.sh.length - 1].s === S.season) return; var pods = 0; S.drivers.forEach(function (d) { if (d.team === t.id) pods += d.pods; }); t.sh.push({ s: S.season, pos: i + 1, pts: t.pts, wins: t.wins, pods: pods }); });
  ds.forEach(function (d, i) {
    var t = S.teams[d.team];
    d.sh.push({ s: S.season, t: t ? t.short : '–', tc: t ? t.color : '#888', pos: i + 1, pts: d.pts, wins: d.wins, pods: d.pods });
    d.cs.wins += d.wins; d.cs.pods += d.pods; if (i === 0) d.cs.titles++; d.cs.rec = S.season;
  });
  if (typeof objEval === 'function') objEval(S);
}
/* satu pemandu tua/muda satu tahun */
function drvGrow(d, mult) {
  var o = rating(d), gap = Math.max(0, d.pot - o), a = d.age, m = mult || 1, gw = (DTYPES[typeOf(d)] || DTYPES.all).gw;
  d.pa = {}; ATTRS.forEach(function (k) { d.pa[k] = d[k]; });
  if (a < d.pk) {
    var g = gap * rr(0.16, 0.36) * m + gauss() * 0.5;
    ATTRS.forEach(function (k) { d[k] += g * (gw[k] || (k === 'cons' ? 1.1 : k === 'wet' ? 0.9 : 1)) + gauss() * 0.7; });
  } else if (a <= d.pk + 1) {
    ATTRS.forEach(function (k) { d[k] += gauss() * 0.6 + gap * 0.08 * m; });
  } else {
    var y = a - d.pk - 1, b = 0.8 + 0.4 * y;
    d.pace -= b * rr(0.8, 1.5); d.race -= b * rr(0.5, 1.0); d.wet -= b * rr(0.2, 0.7);
    d.cons += a <= 35 ? rr(-0.3, 0.8) : -b * rr(0.3, 0.8); d.tyre += a <= 35 ? rr(-0.2, 0.7) : -b * rr(0.2, 0.6);
  }
  ATTRS.forEach(function (k) { d[k] = clamp(Math.round(d[k]), 45, 99); });
}
/* siri junior: satu musim + perkembangan + budak baru */
function juniorSeason(S, log) {
  var J = S.juniors; J.forEach(function (j) { j.jr.pts = 0; j.jr.w = 0; });
  for (var r = 0; r < 10; r++) {
    var o = J.map(function (j) { return { j: j, v: rating(j) + gauss() * 3.5 }; }).sort(function (a, b) { return b.v - a.v; });
    o.forEach(function (x, i) { if (i < 10) x.j.jr.pts += PTS[i]; if (i === 0) { x.j.jr.wins++; x.j.jr.w++; } });
  }
  var st = J.slice().sort(function (a, b) { return b.jr.pts - a.jr.pts; });
  st.forEach(function (j, i) { j.jr.last = i + 1; j.jr.seasons++; });
  st[0].jr.titles++; S.jrChamp = { name: st[0].name, nat: st[0].nat, s: S.season };
  if (log) log.push({ jchamp: st[0].name, nat: st[0].nat, w: st[0].jr.w });
  J.forEach(function (j) { j.age++; drvGrow(j, j.jr.last <= 3 ? 1.15 : j.jr.last >= 8 ? 0.9 : 1); });
}
/* bersara + naikkan pelumba junior terbaik */
function drvRetire(S, log) {
  S.drivers.forEach(function (d) {
    if (d.id === S.pi) return;
    var o = rating(d), pr = d.age >= 42 ? 1 : d.age >= 33 ? (d.age - 33) * 0.1 + (o < 80 ? 0.15 : 0) + (d.age >= 40 ? 0.35 : 0) : 0;
    if (rnd() >= pr) return;
    S.retired.push({ name: d.name, nat: d.nat, age: d.age, cs: d.cs, sh: d.sh, num: d.num, code: d.code, s: S.season });
    d.vac = true;                                     /* kerusi kosong: diisi dalam musim transfer (mkt12.js) */
    if (log) log.push({ retire: d.name, age: d.age, t: d.team, wins: d.cs.wins + d.wins, titles: d.cs.titles });
  });
}
/* dipanggil dari startNewSeason */
function drvNewSeason(S, log) {
  drvInit(S);
  juniorSeason(S, log);
  S.drivers.forEach(function (d) {
    var pm = perfMult(d), em = envMult(S, d);
    d.lastPerf = { pm: pm, em: em, s: S.season, n: d.perf ? d.perf.n : 0, avg: d.perf && d.perf.n ? d.perf.s / d.perf.n : 0 };
    if (d.id !== S.pi) drvGrow(d, pm * em);
    d.perf = { n: 0, s: 0 };
  });
  drvRetire(S, log);
  if (typeof mktRun === 'function') mktRun(S, log);
  S.drivers.forEach(function (d) { d.rh = d.rh || []; d.rh.push({ s: S.season + 1, r: ovr(d) }); });
}
function potStars(p) { return p >= 93 ? 5 : p >= 89 ? 4 : p >= 85 ? 3 : p >= 81 ? 2 : 1; }
function starsH(n) { var h = ''; for (var i = 0; i < 5; i++) h += '<i class="' + (i < n ? 'on' : '') + '">★</i>'; return '<span class="stars">' + h + '</span>'; }

/* ---------- profil pemandu (popup) ---------- */
function careerOf(d) {
  var c = d.cs || { starts: 0, wins: 0, pods: 0, poles: 0, titles: 0 }, done = c.rec === S.season;
  return { starts: c.starts + (d.starts || 0), wins: c.wins + (done ? 0 : d.wins || 0), pods: c.pods + (done ? 0 : d.pods || 0), poles: c.poles + (d.poles || 0), titles: c.titles };
}
function pfTiles(arr) { return '<div class="pf-tiles">' + arr.map(function (x) { return '<div><small>' + x[0] + '</small><b>' + x[1] + '</b></div>'; }).join('') + '</div>'; }
function pfAttrs(d) {
  return '<div class="pf-att">' + ATTRS.map(function (k) {
    var v = d[k], p = d.pa && d.pa[k] != null ? d.pa[k] : v, dl = v - p;
    return '<div><span>' + ATTRN[k] + '</span><i><u style="width:' + clamp((v - 45) / 54 * 100, 0, 100) + '%"></u></i><b>' + v + '</b><em class="' + (dl > 0 ? 'up' : dl < 0 ? 'dn' : '') + '">' + (dl > 0 ? '▲' + dl : dl < 0 ? '▼' + (-dl) : '') + '</em></div>';
  }).join('') + '</div>';
}
function profileHTML(kind, i) {
  var d = kind === 'j' ? S.juniors[i] : S.drivers[i]; if (!d) return '';
  var jr = kind === 'j', t = jr ? null : S.teams[d.team], col = t ? t.color : '#f0b429', o = ovr(d), mine = !jr && d.id === S.pi;
  var potH = (d.age < (d.pk || 28) || jr) && !mine ? '<div class="pf-pot"><small>Scout rating</small>' + starsH(potStars(scoutPot(d))) + '</div>' : '<div class="pf-pot"><small>' + (mine ? 'Growth' : 'Status') + '</small><b>' + (mine ? 'XP-driven' : d.age > (d.pk || 28) + 2 ? 'Veteran' : 'At his peak') + '</b></div>';
  var h = '<div class="pf" style="--tc:' + col + '"><div class="pf-h"><div class="pf-helm">' + helmetSVG(jr ? Object.assign({}, d, { team: null, id: 500 + i }) : d, 84, false) + '</div><div class="pf-id"><small>' + (jr ? JR_NAME : '<a class="pf-tl" data-act="tprof" data-v="' + t.id + '">' + esc(t.name) + ' ›</a>') + '</small><b>' + esc(d.name) + '</b><span>' + flagE(d.nat) + ' ' + esc(natName(d.nat)) + ' · age ' + d.age + (d.num ? ' · #' + d.num : '') + '</span></div>' +
    '<div class="pf-ovr"><b>' + o + '</b><small>OVR</small></div></div>' + potH;
  h += '<div class="pf-chips"><span class="pf-ty">' + DTYPES[typeOf(d)].n + '</span>' + (!jr && d.lastPerf && d.lastPerf.n ? '<span>Last season: ' + (d.lastPerf.avg > 0.25 ? 'beat expectations' : d.lastPerf.avg < -0.25 ? 'below expectations' : 'as expected') + '</span>' : '') + (!jr && !mine && envMult(S, d) >= 1.05 ? '<span>Strong team environment</span>' : '') + '</div>';
  if (d.bio) h += '<p class="pf-bio">' + esc(d.bio) + '</p>'; else if (jr) h += '<p class="pf-bio">' + DTYPES[typeOf(d)].bio + '</p>';
  h += '<h4>Attributes</h4>' + pfAttrs(d);
  if (jr) {
    h += '<h4>' + JR_NAME + '</h4>' + pfTiles([['Seasons', d.jr.seasons], ['Titles', d.jr.titles], ['Wins', d.jr.wins], ['Last year', d.jr.last ? 'P' + d.jr.last : '–']]);
    h += '<p class="dim" style="font-size:12.5px">Scouts rate him ' + potStars(scoutPot(d)) + '/5, but that is only an estimate. Every team judges him differently.' + (d.gold ? ' <b class="pur">Golden generation.</b>' : '') + '</p>' + (d.acad != null ? '<p class="dim" style="font-size:12.5px">Academy: <a class="pf-tl" style="color:var(--acc)" data-act="tprof" data-v="' + d.acad + '">' + esc(S.teams[d.acad].name) + ' ›</a></p>' : '<p class="dim" style="font-size:12.5px">Independent: not tied to any team yet.</p>');
  } else {
    var ds = driverStandings(S), c = careerOf(d);
    if (typeof conSectionHTML === 'function') h += conSectionHTML(S, d);
    h += '<h4>Season ' + S.season + '</h4>' + pfTiles([['Pos', 'P' + (ds.indexOf(d) + 1)], ['Pts', d.pts], ['Wins', d.wins], ['Podiums', d.pods]]);
    h += '<h4>Career</h4>' + pfTiles([['Starts', c.starts], ['Wins', c.wins], ['Podiums', c.pods], ['Poles', c.poles], ['Titles', c.titles]]);
    var rh = (d.rh || []).map(function (x) { return x.r; }); if (!rh.length || rh[rh.length - 1] !== o) rh = rh.concat([o]);
    if (rh.length >= 2) h += '<h4>Rating trend</h4><div class="pf-spark">' + rateSpark(rh, d.rh || []) + '</div>';
    if (d.sh && d.sh.length) h += '<h4>History</h4><table class="t pf-hist"><thead><tr><th>Season</th><th>Team</th><th class="r">Pos</th><th class="r">Wins</th><th class="r">Pts</th></tr></thead><tbody>' + d.sh.slice().reverse().map(function (r) { return '<tr><td class="mono">S' + r.s + '</td><td><span class="tag" style="--tc:' + r.tc + '">' + r.t + '</span></td><td class="r mono">P' + r.pos + '</td><td class="r mono">' + r.wins + '</td><td class="r mono">' + r.pts + '</td></tr>'; }).join('') + '</tbody></table>';
  }
  return h + '<button class="btn wide" data-act="mclose">Close</button></div>';
}
if (typeof A !== 'undefined') A['prof'] = function (x) { var p = String(x.v).split(':'); showModal(profileHTML(p[0], +p[1])); var m = document.querySelector('#modal .mbox'); if (m) m.classList.add('mbpf'); };
if (typeof A !== 'undefined' && !A['mclose']) A['mclose'] = function () { closeModal(); };

function rateSpark(v, rh) {
  var w = 300, h = 70, mn = Math.min.apply(null, v) - 2, mx = Math.max.apply(null, v) + 2, n = v.length;
  var P = v.map(function (x, i) { return [8 + i / (n - 1) * (w - 16), h - 14 - (x - mn) / (mx - mn) * (h - 26)]; });
  var lab = P.map(function (p, i) { return '<text x="' + p[0].toFixed(0) + '" y="' + (p[1] - 6).toFixed(0) + '" text-anchor="middle" font-size="10" font-family="IBM Plex Mono, monospace" fill="currentColor">' + v[i] + '</text>'; }).join('');
  var sl = P.map(function (p, i) { return '<text x="' + p[0].toFixed(0) + '" y="' + (h - 1) + '" text-anchor="middle" font-size="9" fill="currentColor" opacity=".55">' + (rh[i] ? 'S' + rh[i].s : 'now') + '</text>'; }).join('');
  return '<svg viewBox="0 0 ' + w + ' ' + h + '" width="100%" height="' + h + '"><polyline points="' + P.map(function (p) { return p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join(' ') + '" fill="none" style="stroke:var(--tc)" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>' + P.map(function (p) { return '<circle cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="3.5" style="fill:var(--tc)"/>'; }).join('') + lab + sl + '</svg>';
}
