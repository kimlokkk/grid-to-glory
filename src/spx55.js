'use strict';
/* ===== Team sponsors (2.6.9): a title sponsor and partners per team, with contracts, targets and bonuses; naming rights; driver backing =====
   Total sponsorship by prestige: 62 + 8 x prestige ($M), about 2x between the top and the bottom (was 90 + 5 x prestige, 1.5x).
   Money still goes through the season budget (finSeason), so the cost cap still limits what a rich team can spend.
   Gated by S.spx (F1 Pro careers; new careers at once, older saves from the next winter). */
var SPX = { v: 1, base: 62, perPres: 8, title: 0.45, parts: [0.25, 0.18, 0.12], naming: 0.25, heritage: 8, pod: 0.004, win: 0.008, met: 0.05, tpPay: [0.92, 1.08], fame: 0.15, backShare: 0.5 };
var SPX_BRANDS = [
  ['Orbit Telecom', 'telecom', 1], ['Zephyr Energy', 'energy', 1], ['Arcadia Airways', 'airline', 1], ['Helix Cloud', 'tech', 1], ['Meridian Bank', 'finance', 1], ['Volta Drinks', 'drinks', 1], ['Solace Watches', 'luxury', 1], ['Northwind Logistics', 'logistics', 1],
  ['Aurum Pay', 'finance', 2], ['Nimbus Software', 'tech', 2], ['Kestrel Oil', 'energy', 2], ['Brightline Rail', 'logistics', 2], ['Coral Cola', 'drinks', 2], ['Vantage Motors', 'auto', 2], ['Pulse Mobile', 'telecom', 2], ['Atlas Insurance', 'finance', 2], ['Quantis Chips', 'tech', 2], ['Sierra Apparel', 'fashion', 2],
  ['Lumen Lubricants', 'energy', 3], ['Harbor Freight Co', 'logistics', 3], ['Pixel Arcade', 'tech', 3], ['Crest Water', 'drinks', 3], ['Falcon Tools', 'industry', 3], ['Rally Snacks', 'food', 3], ['Ember Coffee', 'food', 3], ['Granite Cement', 'industry', 3], ['Swift Courier', 'logistics', 3], ['Nova Paints', 'industry', 3], ['Blue Fern Hotels', 'travel', 3], ['Tidal Surfwear', 'fashion', 3],
  ['Titan Steel', 'industry', 1], ['Equinox Labs', 'pharma', 1], ['Monarch Spirits', 'drinks', 2], ['Vertex Crypto', 'finance', 2], ['Halo Gaming', 'tech', 2], ['Cobalt Batteries', 'energy', 2], ['Paragon Tyres', 'auto', 2],
  ['Saffron Foods', 'food', 3], ['Ridge Outdoor', 'fashion', 3], ['Echo Audio', 'tech', 3], ['Pinnacle Realty', 'finance', 3], ['Drift Energy Gum', 'food', 3], ['Lantern Media', 'media', 3], ['Kite Travel', 'travel', 3], ['Ironleaf Tea', 'drinks', 3], ['Sprocket Cycles', 'auto', 3], ['Marlin Boats', 'luxury', 3], ['Quill Stationery', 'industry', 3]
];
function spxOn(S) { return !!(S && S.mode === 'pro' && S.spx && S.spx.v >= 1 && S.season >= S.spx.from && S.teams && S.teams[0] && !S.teams[0].spec && (typeof leagueOf !== 'function' || leagueOf(S) === 'f1')); }
function spxMigrate(S) { if (!S || S.mode !== 'pro' || S.spx || !S.teams) return; S.spx = { v: SPX.v, from: (S.round || 0) === 0 ? S.season : S.season + 1 }; if ((S.round || 0) === 0) { spxBackInit(S); spxWinter(S, true); } }
function spxTotal(t) { return SPX.base + SPX.perPres * (t.prestige || 5); }
function spxTP(t) { return t.dev && t.dev.tp && typeof leadTPRating === 'function' ? SPX.tpPay[0] + (SPX.tpPay[1] - SPX.tpPay[0]) * leadTPRating(t) / 100 : 1; }
function spxFame(S, t) { var me = S.drivers[S.pi]; if (!me || me.team !== t.id || typeof fameOf !== 'function') return 1; var f = fameOf(S); return 1 + SPX.fame * clamp(f, 0, 100) / 100; }
function spxUsed(S) { var u = {}; S.teams.forEach(function (t) { var p = t.spxP; if (!p) return; if (p.title) u[p.title.n] = 1; (p.partners || []).forEach(function (x) { u[x.n] = 1; }); }); return u; }
/* a brand for a slot: top brands go to prestigious teams, smaller ones fill the rest; no brand on two cars */
function spxPick(S, t, used, big) {
  var pr = t.prestige || 5, want = big ? (pr >= 7 ? 1 : pr >= 4 ? 2 : 3) : (pr >= 7 ? 2 : 3);
  var gone = used['~' + t.id] || {}, free = function (b) { return !used[b[0]] && !gone[b[0]]; };
  var L = SPX_BRANDS.filter(function (b) { return free(b) && b[2] === want; });
  if (!L.length) L = SPX_BRANDS.filter(free);
  if (!L.length) L = SPX_BRANDS.filter(function (b) { return !used[b[0]]; });   /* a brand that just left may come back only when nothing else is free */
  var b = L[Math.floor(hashS(S.season + ':' + t.id + ':' + (big ? 't' : 'p') + ':' + Object.keys(used).length) * L.length) % L.length]; used[b[0]] = 1; return b;
}
function spxDeal(S, t, b, share, title, years, N) {
  if (N == null) N = S.season + 1;
  var v = spxTotal(t) * share * spxTP(t) * spxFame(S, t) * (0.92 + 0.16 * hashS(b[0] + ':' + S.season + ':' + t.id));
  var rk = typeof teamPaceRank === 'function' ? teamPaceRank(S, t.id) : 5, tgt = clamp(rk + (title ? 0 : 1), 1, 10);
  return { n: b[0], sec: b[1], tier: b[2], v: Math.round(v * 10) / 10, end: N + years - 1, tgt: tgt, from: N, title: title ? 1 : 0, met: 0 };
}
/* naming rights: the title sponsor pays a premium to have its name on the team; heritage teams (prestige 8+) keep their own name */
function spxName(t) { var p = t.spxP; return p && p.title && p.title.naming ? p.title.n.split(' ')[0] + ' ' + t.name : t.name; }
/* the winter: contracts end, results decide renewals, empty slots are filled */
function spxWinter(S, first) {
  if (!S.spx) return; var used = spxUsed(S), N = first ? S.season : S.season + 1;
  var ts = teamStandings(S), pos = {}; ts.forEach(function (t, i) { pos[t.id] = i + 1; });
  S.teams.forEach(function (t) {
    var p = t.spxP || (t.spxP = { title: null, partners: [] });
    var drop = function (d) { delete used[d.n]; (used['~' + t.id] = used['~' + t.id] || {})[d.n] = 1; };   /* a brand that leaves is free for other teams this winter */
    var judge = function (d) { if (!d || first) return d; var met = pos[t.id] <= d.tgt, far = pos[t.id] - d.tgt; d.met = met ? 1 : 0;
      if (d.end >= N) { if (!met && far >= 3 && hashS(d.n + ':' + S.season) < 0.5) { spxNews(S, t, d, 'leave'); drop(d); return null; } return d; }
      if (met || hashS(d.n + ':' + S.season + ':r') < 0.55) { var nd = spxDeal(S, t, [d.n, d.sec, d.tier], d.title ? SPX.title : d.v / spxTotal(t), !!d.title, 2 + Math.floor(hashS(d.n + N) * 2), N); nd.v = Math.round(nd.v * (met ? 1.08 : 0.92) * 10) / 10; nd.naming = d.naming; if (d.naming) nd.v = Math.round(nd.v * (1 + SPX.naming) * 10) / 10; return nd; }
      spxNews(S, t, d, 'end'); drop(d); return null; };
    p.title = judge(p.title); p.partners = p.partners.map(judge).filter(Boolean);
    if (!p.title) { var b = spxPick(S, t, used, true), d = spxDeal(S, t, b, SPX.title, true, 2 + Math.floor(hashS(b[0] + N) * 3), N); if ((t.prestige || 5) < SPX.heritage && hashS(b[0] + ':name:' + t.id) < clamp((SPX.heritage - t.prestige) / 6, 0, 0.9)) { d.naming = 1; d.v = Math.round(d.v * (1 + SPX.naming) * 10) / 10; } p.title = d; if (!first) spxNews(S, t, d, 'title'); }
    while (p.partners.length < SPX.parts.length) { var bp = spxPick(S, t, used, false); p.partners.push(spxDeal(S, t, bp, SPX.parts[p.partners.length], false, 1 + Math.floor(hashS(bp[0] + N) * 3), N)); }
    t.spxName = spxName(t);
  });
}
function spxNews(S, t, d, k) {
  if (typeof pushNews !== 'function') return;
  var head = k === 'title' ? (d.naming ? t.name + ' become ' + d.n.split(' ')[0] + ' ' + t.name : d.n + ' is the new title sponsor of ' + t.name) : k === 'leave' ? d.n + ' walks away from ' + t.name : d.n + ' does not renew with ' + t.name;
  var sub = k === 'title' ? 'A deal worth about $' + Math.round(d.v) + 'M a year' + (d.naming ? ', with the name on the team' : '') + '. Target: P' + d.tgt + ' in the constructors’.' : k === 'leave' ? 'The results were far from the P' + d.tgt + ' it was promised.' : 'The partnership ends at the end of the contract.';
  pushNews(S, { k: 'garage', kick: 'SPONSOR', t: t.id, s: S.season + 1, r: 0, head: head, sub: sub });
}
/* driver backing: personal sponsors who pay the team while the driver races there */
function spxBack(S, d) {
  if (!d) return 0;
  if (d === S.drivers[S.pi]) return typeof sponTotal === 'function' ? Math.round(sponTotal(S) * SPX.backShare * 10) / 10 : 0;
  return d.back || 0;
}
function spxBackInit(S) {
  var seen = {}; S.drivers.forEach(function (d) { var k = d.nat || 'XX'; seen[k] = (seen[k] || 0) + 1; });
  S.drivers.forEach(function (d, i) {
    if (i === S.pi || d.back != null) return;
    var rare = (seen[d.nat] || 1) === 1 ? 1.6 : 1, h = hashS((d.uid || d.name) + ':back');
    d.back = h < 0.3 ? Math.round((2 + 10 * hashS((d.uid || d.name) + ':bv')) * rare * 10) / 10 : 0;
  });
}
function spxSum(S, t) { var p = t.spxP; if (!p) return 0; return (p.title ? p.title.v : 0) + (p.partners || []).reduce(function (a, x) { return a + x.v; }, 0); }
function spxBackSum(S, t) { return S.drivers.filter(function (d) { return d.team === t.id; }).reduce(function (a, d) { return a + spxBack(S, d); }, 0); }
/* race by race: every sponsor pays a small bonus for a podium and for a win */
function spxRace(S, R) {
  if (!spxOn(S) || !R || !R.cls) return;
  R.cls.forEach(function (x) {
    var d = (x.car || x).d, t = d ? S.teams[d.team] : null; if (!t || !t.spxP || !t.fin || x.dnf || x.pos > 3) return;
    var k = x.pos === 1 ? SPX.win : SPX.pod, add = spxSum(S, t) * k; t.fin.cash += add; t.fin.spxBonus = (t.fin.spxBonus || 0) + add; t.fin.paidSp = (t.fin.paidSp || 0) + add;
  });
}
(function () { if (typeof finishRace === 'function') { var f0 = finishRace; finishRace = function (S, R) { try { spxRace(S, R); } catch (e) { } return f0.apply(this, arguments); }; } })();

/* ===== the Partners panel: Team tab and the team dossier ===== */
function spxStatus(S, t, d) {
  var pos = teamStandings(S).indexOf(t) + 1, gap = pos - d.tgt;
  if ((S.round || 0) === 0) return ['new', 'Season ahead'];
  return gap <= 0 ? ['ok', 'On target'] : gap <= 2 ? ['warn', 'Behind target'] : ['bad', 'At risk'];
}
function spxTeamHTML(t) {
  if (!S || !spxOn(S) || !t || t.spec || !t.spxP) return '';
  var p = t.spxP, m = function (v) { return '$' + (Math.round(v * 10) / 10).toFixed(1) + 'M'; }, tot = spxSum(S, t), back = spxBackSum(S, t);
  var tl = p.title, st = tl ? spxStatus(S, t, tl) : null, yrs = function (d) { var n = d.end - S.season + 1; return n <= 1 ? 'Final year' : n + ' seasons left'; };
  var title = tl ? '<div class="spx-title ' + st[0] + '">' + cvBrand(tl.n) + '<div class="spx-tn"><small>Title sponsor' + (tl.naming ? ' · name on the car' : '') + '</small><b>' + esc(tl.n) + '</b><span>' + esc(tl.sec) + ' · ' + yrs(tl) + '</span></div><div class="spx-tv"><b>' + m(tl.v) + '</b><small>A YEAR</small></div>' +
    '<div class="spx-tgt"><span>Target <b>P' + tl.tgt + '</b></span><em>' + st[1] + '</em></div></div>' : '';
  var parts = (p.partners || []).map(function (d) { var s2 = spxStatus(S, t, d); return '<div class="spx-pt ' + s2[0] + '">' + cvBrand(d.n) + '<b>' + esc(d.n) + '</b><small>' + esc(d.sec) + '</small><span class="spx-pv">' + m(d.v) + '</span><span class="spx-pg">P' + d.tgt + ' · ' + yrs(d) + '</span></div>'; }).join('');
  var ds = S.drivers.filter(function (d) { return d.team === t.id; }), brow = ds.map(function (d) { var v = spxBack(S, d), me = d === S.drivers[S.pi]; return '<span class="' + (v > 0 ? 'on' : '') + '"><b>' + esc(d.name) + (me ? ' <i>YOU</i>' : '') + '</b><em>' + (v > 0 ? '+' + m(v) : me ? (S.spons && S.spons.length ? 'Your sponsors back you' : 'Sign personal sponsors to bring backing') : 'No backing') + '</em></span>'; }).join('');
  var bon = t.fin && t.fin.spxBonus ? t.fin.spxBonus : 0;
  return '<section class="pu-bay spx-card" style="--tc:' + t.color + '"><header><div><small>Commercial · season ' + S.season + '</small><h3>Partners</h3></div><div class="pu-life"><b>' + m(tot + back) + '</b><small>A YEAR</small></div></header>' + title +
    '<div class="spx-pts">' + parts + '</div><div class="spx-back"><small>Driver backing</small>' + brow + '</div>' +
    '<p class="pu-foot">Podium bonus ' + (SPX.pod * 100).toFixed(1) + '% · win bonus ' + (SPX.win * 100).toFixed(1) + '% of the deals' + (bon ? ' · earned this season ' + m(bon) : '') + (spxName(t) !== t.name ? ' · racing as ' + esc(spxName(t)) : (t.prestige || 5) >= SPX.heritage ? ' · heritage team: the name is not for sale' : '') + '</p></section>';
}
(function () {
  if (typeof hTeam === 'function') { var t0 = hTeam; hTeam = function () { var h = t0.apply(this, arguments), t = typeof myTeam === 'function' ? myTeam() : null, box = spxTeamHTML(t); if (!box) return h; var k = h.indexOf('<div class="team-development tg-col">'); return k >= 0 ? h.slice(0, k) + box + h.slice(k) : h + box; }; }
  if (typeof pdTeamHTML === 'function') { var d0 = pdTeamHTML; pdTeamHTML = function (r) { var h = d0.apply(this, arguments); if (!h || PD42.tab !== 'overview' || r.league !== leagueOf(S)) return h; var t = S.teams[r.index], box = spxTeamHTML(t); if (!box) return h; var k = h.lastIndexOf('</div></div>'); return k >= 0 ? h.slice(0, k) + '<div class="pd-span">' + box + '</div>' + h.slice(k) : h + box; }; }
})();
/* the name shown on screens (naming rights); the archive and records keep the team's own name */
function spxDisp(t) { return t && typeof S !== 'undefined' && S && S.teams && S.teams[t.id] === t && spxOn(S) ? spxName(t) : t ? t.name : ''; }
function spxPackLine(S, t) {
  var p = t.spxP, m = function (v) { return '$' + (Math.round(v * 10) / 10) + 'M'; }, d = function (x) { return x.n + ' (' + x.sec + ', ' + m(x.v) + '/yr to S' + x.end + ', target P' + x.tgt + ')'; };
  var bk = S.drivers.filter(function (x) { return x.team === t.id && spxBack(S, x) > 0; }).map(function (x) { return x.name + ' ' + m(spxBack(S, x)); });
  return 'Sponsors ' + m(spxSum(S, t) + spxBackSum(S, t)) + '/yr: title ' + (p.title ? d(p.title) + (p.title.naming ? ' with naming rights' : '') : 'none') + '; partners ' + (p.partners || []).map(d).join(', ') + (bk.length ? '; driver backing ' + bk.join(', ') : '') + (t.fin && t.fin.spxBonus ? '; podium/win bonuses this season ' + m(t.fin.spxBonus) : '');
}
