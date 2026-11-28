'use strict';
/* ===== Title clinched (2.6.9): the moment a championship can no longer be lost, the game says so =====
   After every race: if the leader's margin is larger than what the second can still score (26 a race for a driver: win plus fastest lap;
   44 for a team: one-two plus fastest lap), the title is decided. Shown on the race result, on Home for the rest of the season, in the news
   and in the story pack. Pro and classic careers; the player's own league. */
var CL = { drv: 26, team: 44 };
function clinchCheck(S) {
  var n = seasonRounds(S), left = n - S.round; if (left < 0) return;
  var ds = driverStandings(S), ts = teamStandings(S), c = S.clinch && S.clinch.s === S.season && S.clinch.lg === leagueOf(S) ? S.clinch : (S.clinch = { s: S.season, lg: leagueOf(S) });
  var me = S.drivers[S.pi], myT = me ? S.teams[me.team] : null;
  if (!c.d && ds.length > 1 && ds[0].pts - ds[1].pts > CL.drv * left) {
    c.d = { n: ds[0].name, me: ds[0] === me ? 1 : 0, r: S.round, left: left, pts: ds[0].pts, by: ds[0].pts - ds[1].pts, t: S.teams[ds[0].team] ? S.teams[ds[0].team].name : '' };
    if (typeof pushNews === 'function') pushNews(S, { k: 'garage', kick: 'CHAMPION', t: ds[0].team, s: S.season, r: S.round, head: ds[0].name + (left ? ' is ' + leagueOf(S).toUpperCase() + ' champion with ' + left + (left === 1 ? ' race' : ' races') + ' to spare' : ' is ' + leagueOf(S).toUpperCase() + ' champion'), sub: (left ? 'Nobody can catch ' + ds[0].name.split(' ')[0] + ' now: a lead of ' + c.d.by + ' points with at most ' + CL.drv * left + ' left to win.' : 'The title is decided at the final round.') });
    c.fresh = S.round;
  }
  if (!c.c && ts.length > 1 && ts[0].pts - ts[1].pts > CL.team * left) {
    c.c = { n: ts[0].name, me: myT === ts[0] ? 1 : 0, r: S.round, left: left, by: ts[0].pts - ts[1].pts };
    if (typeof pushNews === 'function') pushNews(S, { k: 'garage', kick: 'CHAMPIONS', t: ts[0].id, s: S.season, r: S.round, head: ts[0].name + ' win the constructors’ title' + (left ? ' with ' + left + (left === 1 ? ' race' : ' races') + ' to go' : ''), sub: 'A lead of ' + c.c.by + ' points that cannot be overturned.' });
    c.fresh = S.round;
  }
}
function clinchBannerHTML(where) {
  var c = S && S.clinch; if (!c || c.s !== S.season || c.lg !== leagueOf(S) || (!c.d && !c.c)) return '';
  var now = where === 'result' ? c.fresh === S.round : true; if (!now) return '';
  var dMe = c.d && c.d.me, cMe = c.c && c.c.me, justD = c.d && c.d.r === S.round, justC = c.c && c.c.r === S.round;
  if (where === 'result' && !justD && !justC) return '';
  if (!dMe && !cMe) {
    if (where !== 'result') return '';
    return '<section class="cl-note"><b>TITLE DECIDED</b><span>' + esc(justD ? c.d.n + ' has clinched the drivers’ title' : c.c.n + ' have clinched the constructors’ title') + (((justD ? c.d : c.c).left) ? ' with ' + (justD ? c.d : c.c).left + ' to go.' : '.') + '</span></section>';
  }
  var lines = [];
  if (dMe) lines.push('<div><small>Drivers’ championship</small><b>WORLD CHAMPION</b><em>' + (c.d.left ? 'Clinched in round ' + c.d.r + ' with ' + c.d.left + (c.d.left === 1 ? ' race' : ' races') + ' to spare · lead ' + c.d.by + ' pts' : 'Decided at the final round') + '</em></div>');
  if (cMe) lines.push('<div><small>Constructors’ championship</small><b>' + esc(c.c.n.toUpperCase()) + '</b><em>' + (c.c.left ? 'Clinched in round ' + c.c.r + ' with ' + c.c.left + ' to go · lead ' + c.c.by + ' pts' : 'Decided at the final round') + '</em></div>');
  var t = S.teams[S.drivers[S.pi].team];
  return '<section class="cl-ban ' + (where === 'result' && (justD || justC) ? 'burst' : 'calm') + '" style="--tc:' + (t ? t.color : '#ffd24a') + '"><span class="cl-crown" aria-hidden="true">♛</span><div class="cl-head"><small>Season ' + S.season + ' · ' + leagueOf(S).toUpperCase() + '</small><h2>' + (dMe && cMe ? 'Double champions' : dMe ? 'You are the champion' : 'Constructors’ champions') + '</h2></div><div class="cl-lines">' + lines.join('') + '</div>' + (where === 'result' && (justD && dMe) && c.d.left ? '<p class="cl-sub">Mathematically decided: nobody can catch you in the ' + c.d.left + ' race' + (c.d.left === 1 ? '' : 's') + ' left.</p>' : '') + '</section>';
}
function clinchPackText(S) {
  var c = S.clinch; if (!c || c.s !== S.season || (!c.d && !c.c)) return '';
  return 'Titles decided this season: ' + [c.d ? 'drivers’ title ' + c.d.n + (c.d.me ? ' (THE PLAYER)' : '') + ' in round ' + c.d.r + (c.d.left ? ' with ' + c.d.left + ' left, lead ' + c.d.by + ' pts' : ' at the final round') : '', c.c ? 'constructors’ title ' + c.c.n + (c.c.me ? ' (THE PLAYER’S TEAM)' : '') + ' in round ' + c.c.r + (c.c.left ? ' with ' + c.c.left + ' left' : ' at the final round') : ''].filter(Boolean).join('; ');
}
(function () {
  if (typeof finishRace === 'function') { var f0 = finishRace; finishRace = function (S) { var r = f0.apply(this, arguments); try { if (!S.sit || (S.sit && S.sit.ban)) clinchCheck(S); } catch (e) { } return r; }; }
  if (typeof vResult === 'function') { var v0 = vResult; vResult = function () { var h = v0.apply(this, arguments), b = clinchBannerHTML('result'); if (!b) return h; var k = h.indexOf('<section class="rv-hero'); if (k < 0) return b + h; var e = h.indexOf('</section>', k); return e >= 0 ? h.slice(0, e + 10) + b + h.slice(e + 10) : b + h; }; }
  if (typeof hUtama === 'function') { var h0 = hUtama; hUtama = function () { var h = h0.apply(this, arguments), b = clinchBannerHTML('home'); return b ? h.replace('<div class="hp', b + '<div class="hp') : h; }; }
})();
