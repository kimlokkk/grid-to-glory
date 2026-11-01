/* ===== Fasa E2a: peranan, objektif kontrak, penilaian. Sasaran bergantung pada kereta DAN rating pemandu, bukan angka mutlak. ===== */
var OBJ = { slack: 0.6, young: 1.2, ref: 84, k: 0.28 };
function mateOf(S, d) { var m = null; S.drivers.forEach(function (x) { if (x.team === d.team && x.id !== d.id) m = x; }); return m; }
function roleOf(S, d) {
  var m = mateOf(S, d); if (!m) return 'lead';
  var df = ovr(d) - ovr(m);
  if (d.age <= 22 && df < 3) return 'young';
  return df >= 2 ? 'lead' : df <= -2 ? 'second' : 'equal';
}
var ROLEN = { lead: 'Lead driver', second: 'Second driver', equal: 'Co-driver', young: 'Young talent' };
/* kedudukan jangkaan dalam kejuaraan pemandu: kereta + rating (pemandu lemah dalam kereta bagus tetap dijangka tak lebih baik daripada kemampuannya) */
function objExp(S, d) {
  var rk = teamRank(S, d.team), base = rk * 1.4 + 1.7;
  return base + (OBJ.ref - ovr(d)) * OBJ.k;
}
function objFor(S, d, season) {
  var role = roleOf(S, d), m = mateOf(S, d), e = objExp(S, d), slack = OBJ.slack + (role === 'young' ? OBJ.young : 0);
  var o = { s: season || S.season, role: role, res: null };
  if (role === 'equal' && m) { o.ty = 'beat'; o.mate = m.name; o.txt = 'Finish ahead of ' + m.name + ' in the standings'; }
  else { o.ty = 'pos'; o.tgt = clamp(Math.round(e + slack), 1, 19); o.txt = 'Finish P' + o.tgt + ' or better in the championship'; }
  d.obj = o; if (d.miss == null) d.miss = 0;
  return o;
}
function objAssign(S, season) { S.drivers.forEach(function (d) { objFor(S, d, season); }); }
/* hujung musim: sudah capai atau belum */
function objEval(S) {
  var ds = driverStandings(S);
  S.drivers.forEach(function (d) {
    var o = d.obj; if (!o || o.res) return;
    var pos = ds.indexOf(d) + 1, ok;
    if (o.ty === 'beat') { var m = null; S.drivers.forEach(function (x) { if (x.name === o.mate) m = x; }); ok = !m || ds.indexOf(d) < ds.indexOf(m); }
    else ok = pos <= o.tgt;
    o.res = ok ? 'met' : 'miss'; o.pos = pos;
    d.miss = ok ? 0 : (d.miss || 0) + 1;
  });
}
/* dalam musim: sasaran masih dalam jangkauan? */
function objStatus(S, d) {
  var o = d.obj; if (!o) return null;
  var ds = driverStandings(S), pos = ds.indexOf(d) + 1, left = 10 - S.round;
  if (S.round === 0) return { k: 'new', txt: 'Season starts' };
  if (o.ty === 'beat') { var m = null; S.drivers.forEach(function (x) { if (x.name === o.mate) m = x; }); if (!m) return null; return d.pts > m.pts ? { k: 'ok', txt: 'Ahead of ' + m.name.split(' ').slice(-1)[0] + ' by ' + (d.pts - m.pts) + ' pts' } : d.pts === m.pts ? { k: 'mid', txt: 'Level on points' } : { k: 'bad', txt: 'Behind by ' + (m.pts - d.pts) + ' pts' }; }
  return pos <= o.tgt ? { k: 'ok', txt: 'On track: P' + pos + ' now' } : pos <= o.tgt + 2 ? { k: 'mid', txt: 'Close: P' + pos + ' now' } : { k: 'bad', txt: 'Behind: P' + pos + ' now' };
}
/* keputusan team terhadap pemain: sambung / tidak / putus kontrak */
function objVerdict(S) {
  var p = S.drivers[S.pi], miss = p.miss || 0, met = p.obj && p.obj.res === 'met', star = ovr(p) >= 84, t = S.teams[p.team];
  var v = { renew: true, terminate: false, why: null };
  if (!met && miss >= 2 && !star) { v.renew = false; v.why = 'perf'; }
  if (S.contract > 1 && miss >= 3 && !star) { v.terminate = true; v.renew = false; v.why = 'perf'; }
  if (t.fin && t.fin.cash < -2 && conOf(S, p).pay >= 6 && !met && S.contract <= 1) { v.renew = false; v.why = 'budget'; }
  return v;
}
function objDrvHTML(S, d, mini) {
  var o = d.obj; if (!o) return '';
  var st = d.id === S.pi || mini ? objStatus(S, d) : null;
  return '<div class="obj"><small>' + (ROLEN[o.role] || 'Driver') + ' objective</small><b>' + esc(o.txt) + '</b>' + (st ? '<span class="' + st.k + '">' + st.txt + '</span>' : '') + '</div>';
}
