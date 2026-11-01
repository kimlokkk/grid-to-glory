/* ===== Radio pasukan gaya siaran TV: bar warna pasukan, nama pemandu, gelombang suara, petikan ===== */
var RKC = { sc: '#f0b429', w: '#38bdf8', x: '#e2342b', me: '#1f9d55', e: null, i: '#8a93a8' };
function radioMeta(x) {
  var t = x.t, who = 'ENGINEER';
  if (/^(Jurutera|Engineer):\s*/.test(t)) t = t.replace(/^(Jurutera|Engineer):\s*/, '');
  if (x.k === 'sc' && /safety car|vsc|bendera/i.test(t) && !/Jurutera/.test(x.t)) who = 'RACE CONTROL';
  return { who: who, t: t, col: RKC[x.k] || myTeam().color };
}
function waveH(n, live) {
  var h = '<span class="fr-wv' + (live ? ' live' : '') + '">';
  for (var i = 0; i < (n || 12); i++) h += '<i style="--h:' + (30 + ((i * 37) % 70)) + '%;--d:' + ((i * 53) % 400) + 'ms"></i>';
  return h + '</span>';
}
function radioCard(o) {
  /* o: {t, lap, col, who, live, big, sub} */
  var p = me(), t = myTeam(), sur = p.name.split(' ').slice(-1)[0].toUpperCase();
  return '<div class="frad' + (o.big ? ' frbig' : '') + (o.live ? ' isnew' : '') + '" style="--rc:' + (o.col || t.color) + '"><div class="fr-bar"></div><div class="fr-in">' +
    '<div class="fr-h"><span class="fr-nm">' + esc(sur) + '</span><span class="fr-tm">' + esc(t.short) + '</span><span class="fr-lb">' + (o.who === 'RACE CONTROL' ? 'RACE CONTROL' : 'RADIO') + '</span>' + waveH(o.big ? 16 : 12, o.live) + (o.lap ? '<span class="fr-lp">L' + o.lap + '</span>' : '') + '</div>' +
    '<div class="fr-q">' + o.t + '</div>' + (o.sub ? '<div class="fr-s">' + o.sub + '</div>' : '') + '</div></div>';
}
function lastRadioHTML(R) {
  var l = (R.radio || []).filter(function (x) { return x.k !== 'i'; }).slice(-1)[0];
  if (!l) return radioCard({ t: '“Red lights. Focus.”', lap: 0 });
  var m = radioMeta(l), idx = R.radio.lastIndexOf(l); if (UI.radSeen !== idx) { UI.radSeen = idx; UI.radT = performance.now(); } var fresh = performance.now() - (UI.radT || 0) < 3600;
  return radioCard({ t: '“' + esc(m.t) + '”', lap: l.lap, col: m.col, who: m.who, live: fresh });
}
function radioHTML(R) {
  var l = (R.radio || []).slice(-30).reverse();
  if (!l.length) return '<div class="frlog"><div class="fr-row"><span class="fr-l">L1</span><span>Red lights. Get ready.</span></div></div>';
  return '<div class="frlog">' + l.map(function (x, i) { var m = radioMeta(x); return '<div class="fr-row k-' + x.k + '" style="--rc:' + m.col + '"><span class="fr-l">L' + x.lap + '</span><div><small>' + (x.k === 'i' ? 'INFO' : m.who) + '</small>' + (x.k === 'i' ? esc(m.t) : '“' + esc(m.t) + '”') + '</div></div>'; }).join('') + '</div>';
}
/* kad keputusan pit: jurutera bercakap dulu, pilihan kau jadi balasan */
function pitCard(R, p) {
  RUN.wait = true;
  var w = WHYT[p.why] || ['Engineer wants to pit', 'Fresh tyres are faster for the rest of the race.'], hp = Math.round(tyreHealth(p, R) * 100), ah = nearAhead(R, p);
  var body = w[1] + ' Currently on ' + TYN[p.comp] + ', ' + Math.floor(p.eff) + ' laps old, ' + hp + '% left. Recommended: <b>' + TYN[p.pitReq] + '</b>.' + (p.why === 'undercut' && ah ? ' Target: ' + ah.d.code + '.' : '') + (mandOf(p) ? ' <span class="fr-warn">You haven\'t used two dry compounds yet.</span>' : '');
  var opts = '<button class="opt" data-act="pc-yes"><div class="t">“Box, box.” ' + tyc(p.pitReq) + ' ' + TYN[p.pitReq] + '</div><div class="s">Pit at the end of this lap.</div></button>';
  ['S', 'M', 'H', 'I', 'W'].forEach(function (k) { if (k !== p.pitReq && (SLICK[k] === SLICK[p.pitReq] || R.wet > 0.1)) opts += '<button class="opt" data-act="pc-alt" data-v="' + k + '"><div class="t">Box, but ' + tyc(k) + ' ' + TYN[k] + '</div><div class="s">Your call.</div></button>'; });
  opts += '<button class="opt" data-act="pc-no"><div class="t">“Negative, staying out.”</div><div class="s">Engineer will ask again in 2 laps.</div></button>';
  var col = p.why === 'sc' ? RKC.sc : p.why === 'cuaca' ? RKC.w : null;
  showModal(radioCard({ t: '“' + w[0] + '”', sub: body, lap: p.lap, col: col, live: true, big: true }) + '<div class="fr-rep">Reply</div><div class="evopts">' + opts + '</div>');
}
