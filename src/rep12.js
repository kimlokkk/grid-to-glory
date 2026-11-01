/* ===== Fasa E2b-1: reputasi. Dipecat meninggalkan kesan: team lama berdendam, TP berhati-hati takut ambil risiko,
   TP berani bagi peluang kedua. Kesan susut bila masa berlalu dan keputusan baik. ===== */
var REP = { burn: -8, gate: -5, decay: 0.78, window: 3, stainV: 2 };
function repInit(S) { if (!S.rep) S.rep = { rel: {}, fires: [] }; return S.rep; }
function repRel(S, tid) { return repInit(S).rel[tid] || 0; }
/* bilangan pemecatan prestasi dalam beberapa musim kebelakangan */
function repStain(S) { var r = repInit(S); return r.fires.filter(function (f) { return f.why === 'perf' && f.s > S.season - REP.window; }).length; }
/* hujung musim: hubungan dengan team susut ke sifar, kemudian dikemas kini mengikut musim ini */
function repEval(S) {
  var r = repInit(S), p = S.drivers[S.pi];
  Object.keys(r.rel).forEach(function (k) { r.rel[k] *= REP.decay; if (Math.abs(r.rel[k]) < 0.4) delete r.rel[k]; });
  if (p.obj && p.obj.res) {
    var d = p.obj.res === 'met' ? 2 : -1;
    if (p.obj.pos === 1) d += 3;
    r.rel[p.team] = clamp((r.rel[p.team] || 0) + d, -10, 10);
  }
  r.fires = r.fires.filter(function (f) { return f.s > S.season - 6; });
}
function repFired(S, f) {
  var r = repInit(S);
  if (f.why === 'perf') { r.rel[f.team] = REP.burn; r.fires.push({ s: S.season, t: f.team, why: 'perf' }); }
  else r.rel[f.team] = Math.max(r.rel[f.team] || 0, 2);      /* pecat sebab bajet: bukan salah kau */
}
/* pandangan sesebuah team terhadap pemain */
function repStance(S, t) {
  var stain = repStain(S), rel = repRel(S, t.id), amb = t.dev && t.dev.tp ? t.dev.tp.amb : 1;
  var o = { ok: true, dV: 0, tag: null };
  if (rel <= REP.gate) { o.ok = false; o.tag = 'burn'; return o; }
  o.dV = clamp(rel, 0, 8) * 0.3;
  if (rel >= 3) o.tag = 'warm';
  if (stain > 0) {
    if (amb <= 0) { o.dV -= 5 * stain; o.tag = 'cautious'; if (stain >= 2) { o.ok = false; } }
    else if (amb === 1) o.dV -= REP.stainV * stain;
    else { o.dV += 1.5 - 1.0 * (stain - 1); o.tag = 'bold'; }
  }
  return o;
}
/* kad "bagaimana paddock pandang kau" */
function repCardHTML(S) {
  var pd = S.paddock; if (!pd) return '';
  var tg = function (id) { var t = S.teams[id]; return '<span class="tag" style="--tc:' + t.color + '">' + t.short + '</span>'; };
  var row = function (arr, cls, ttl, txt) { return arr && arr.length ? '<div class="rep-r ' + cls + '"><b>' + ttl + '</b><span>' + arr.map(tg).join(' ') + '</span><em>' + txt + '</em></div>' : ''; };
  var h = row(pd.burn, 'bad', 'Burned bridges', 'Not taking your call after how things ended.') +
    row(pd.cautious, 'bad', 'Cautious bosses', 'Careful principals will not gamble on a driver who was sacked.') +
    row(pd.bold, 'good', 'Open to a second chance', 'Bolder principals like a driver with something to prove.') +
    row(pd.warm, 'good', 'On good terms', 'They remember how you drove for them.');
  if (!h) return '';
  return '<div class="card stack rep"><h3>How the paddock sees you</h3>' + h + '</div>';
}
