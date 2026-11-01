/* ===== Sejarah litar: pemenang, pole, lap terpantas dan keputusan pemain di setiap litar, musim demi musim. ===== */
function thRecord(S, R, P) {
  if (!R || R.ci == null) return;
  var w = R.cls.filter(function (x) { return x.pos === 1 && !x.dnf; })[0], pl = R.cls.filter(function (x) { return x.car.grid === 1; })[0], fd = R.fl && R.fl.di >= 0 ? S.drivers[R.fl.di] : null;
  var pk = function (x) { var d = x.car.d, t = S.teams[d.team]; return { n: d.name, c: d.code, t: t ? t.short : '', tc: t ? t.color : '#888' }; };
  var rec = { s: S.season, w: w ? pk(w) : null, pl: pl ? pk(pl) : null, fl: fd ? { n: fd.name, c: fd.code, tc: S.teams[fd.team] ? S.teams[fd.team].color : '#888', t: R.fl.t > 0 ? R.fl.t : 0 } : null, me: P ? { p: P.dnf ? 0 : P.pos, g: P.car.grid, d: P.dnf ? 1 : 0 } : null };
  S.th = S.th || {}; var a = S.th[R.ci] = S.th[R.ci] || [];
  a = a.filter(function (r) { return r.s !== S.season; }); a.push(rec); S.th[R.ci] = a.slice(-25);
}
function thStats(ci) {
  var a = (S.th && S.th[ci]) || [], best = 0, wins = 0, pods = 0, tally = {}, lap = null;
  a.forEach(function (r) {
    if (r.me && r.me.p) { if (!best || r.me.p < best) best = r.me.p; if (r.me.p === 1) wins++; if (r.me.p <= 3) pods++; }
    if (r.w) tally[r.w.n] = (tally[r.w.n] || 0) + 1;
    if (r.fl && r.fl.t > 0 && (!lap || r.fl.t < lap.t)) lap = { t: r.fl.t, n: r.fl.n, s: r.s };
  });
  var top = null; Object.keys(tally).forEach(function (k) { if (!top || tally[k] > top.n) top = { name: k, n: tally[k] }; });
  return { a: a, best: best, wins: wins, pods: pods, top: top, lap: lap };
}
function thHTML(ci) {
  var c = CIRCUITS[ci], st = thStats(ci), mine = st.a.filter(function (r) { return r.me; }).length;
  var h = '<div><span class="badge">Circuit history</span></div><div class="row" style="gap:10px;flex-wrap:nowrap;margin:8px 0">' + flagSVG(ci, 34) + '<div><h2 style="margin:0">' + esc(c.name) + '</h2><small class="dim">' + esc(c.loc) + ' · ' + laps2(c) + ' laps · rain ' + Math.round(c.rain * 100) + '%</small></div></div>';
  if (!st.a.length) return h + '<p class="dim">No race has been held here in your career yet. The history fills in as you play.</p><button class="btn wide" data-act="mclose">Close</button>';
  h += pfTiles([['Races', st.a.length], ['Your best', st.best ? 'P' + st.best : mine ? 'DNF' : '–'], ['Your wins', st.wins], ['Podiums', st.pods]]);
  h += '<p class="dim" style="margin:8px 0;font-size:13px">' + (st.top ? 'Most wins: <b>' + esc(st.top.name) + '</b> (' + st.top.n + ').' : '') + (st.lap ? ' Lap record: <b>' + fmtT(st.lap.t) + '</b> by ' + esc(st.lap.n) + ' (S' + st.lap.s + ').' : '') + '</p>';
  h += '<div class="scroll"><table class="t"><thead><tr><th>Season</th><th>Winner</th><th>Pole</th><th class="r">You</th></tr></thead><tbody>' + st.a.slice().reverse().map(function (r) {
    var tg = function (x) { return x ? '<span class="tag" style="--tc:' + x.tc + '">' + esc(x.c) + '</span> ' + esc(x.n.split(' ').slice(-1)[0]) : '–'; };
    return '<tr><td class="mono">S' + r.s + '</td><td>' + tg(r.w) + '</td><td>' + tg(r.pl) + '</td><td class="r mono ' + (r.me && r.me.p === 1 ? 'pur' : r.me && r.me.p && r.me.p <= 3 ? 'good' : r.me && r.me.d ? 'bad' : '') + '">' + (r.me ? (r.me.d ? 'DNF' : 'P' + r.me.p) : '<span class="dim">out</span>') + '</td></tr>';
  }).join('') + '</tbody></table></div><button class="btn wide" data-act="mclose" style="margin-top:10px">Close</button>';
  return h;
}
function thStrip(ci) {
  var st = thStats(ci), l = st.a[st.a.length - 1];
  if (!l) return '<button class="btn sm" data-act="th" data-v="' + ci + '">Circuit history</button>';
  return '<button class="btn sm" data-act="th" data-v="' + ci + '">Circuit history · last winner ' + (l.w ? esc(l.w.n.split(' ').slice(-1)[0]) : '–') + ' (S' + l.s + ')' + (st.best ? ' · your best P' + st.best : '') + '</button>';
}
if (typeof A !== 'undefined') A['th'] = function (d) { showModal(thHTML(+d.v)); };
