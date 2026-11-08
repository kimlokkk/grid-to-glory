/* ===== Fasa E4b: rakan sepasukan. Keserasian (-10..10) naik bila ikut arahan team, turun bila membantah.
   Team order dalam race: pemandu utama di belakang kau = diminta bagi laluan; kau pemandu utama di belakang rakan = rakan diminta bagi laluan. ===== */
var TM = { gap: 0.05, obey: 1.5, refuse: -2, favour: -0.5 };
function tmInit(S) {
  var p = S.drivers[S.pi], m = typeof mateOf === 'function' ? mateOf(S, p) : null;
  if (!S.tm || (m && S.tm.n !== m.name)) S.tm = { n: m ? m.name : '', rel: 0, yes: 0, no: 0 };
  return S.tm;
}
function tmLabel(r) { return r >= 6 ? 'Close allies' : r >= 3 ? 'Friendly' : r > -3 ? 'Professional' : r > -6 ? 'Tense' : 'Open rivals'; }
function tmAdd(S, d) { var t = tmInit(S); t.rel = clamp(t.rel + d, -10, 10); }
/* dipanggil dari finishRace: suasana garaj menjejaskan moral dan XP */
function tmRace(S) {
  var t = tmInit(S);
  t.rel *= 0.97;
  if (t.rel >= 4) { S.morale = clamp((S.morale == null ? 50 : S.morale) + 1, 0, 100); if (S.mode !== 'pro') S.xp += 1; }
  else if (t.rel <= -4) { S.morale = clamp((S.morale == null ? 50 : S.morale) - 1, 0, 100); if (S.mode !== 'pro') S.xp = Math.max(0, S.xp - 1); }
}
function tmCardHTML() {
  var p = me(), m = mateOf(S, p); if (!m) return '';
  var t = tmInit(S), pct = Math.round((t.rel + 10) * 5), role = typeof roleOf === 'function' ? roleOf(S, p) : 'equal';
  var eff = t.rel >= 4 ? 'The garage is relaxed: +1 morale and +1 XP every race.' : t.rel <= -4 ? 'The garage is divided: -1 morale and -1 XP every race.' : 'Relations are workable, no side effects.';
  if (S.mode === 'pro') eff = eff.replace(' and +1 XP', '').replace(' and -1 XP', '');
  return '<div class="card stack tmc"><div class="row sp"><h3>Teammate</h3><span class="mono dim">' + tmLabel(t.rel) + '</span></div>' +
    '<div class="row sp" style="flex-wrap:nowrap"><div><b>' + esc(m.name) + '</b><div class="dim" style="font-size:12.5px">' + flagE(m.nat) + ' ' + ovr(m) + ' OVR · age ' + m.age + ' · you are ' + (ROLEN[role] || 'a driver').toLowerCase() + '</div></div></div>' +
    '<div class="fame"><i style="width:' + pct + '%;background:' + (t.rel >= 0 ? 'linear-gradient(90deg,#8b5cf6,#1f9d55)' : 'linear-gradient(90deg,#d64545,#8b5cf6)') + '"></i></div>' +
    '<p class="dim" style="font-size:12.5px;margin:0">' + eff + ' Orders obeyed ' + t.yes + ', refused ' + t.no + '.</p></div>';
}
/* ---- team order dalam race ---- */
function toMate(R, m) { var c = null; R.cars.forEach(function (f) { if (f.di === m.id) c = f; }); return c; }
function toSwap(a, b) { var credit = a.s > b.s ? 1 : -1; a.evalOrder = b.evalOrder = true; a.evalOrderCredit = clamp((a.evalOrderCredit || 0) + credit, -1, 1); b.evalOrderCredit = clamp((b.evalOrderCredit || 0) - credit, -1, 1); var s = a.s; a.s = b.s; b.s = s; var q = a.sPrev; a.sPrev = b.sPrev; b.sPrev = q; }
function toCheck(R, p) {
  if (RUN.to || RUN.fast || RUN.wait || p.fin || p.dnf || p.hold > 0 || R.sc) return;
  var P = S.drivers[S.pi], m = mateOf(S, P); if (!m) return;
  var mc = toMate(R, m); if (!mc || mc.fin || mc.dnf || mc.hold > 0) return;
  if (p.lap < Math.round(R.L * 0.4) || p.lap > R.L - 3 || p.lap !== mc.lap || Math.floor(p.s) !== Math.floor(mc.s)) return;
  var pp = posOf(R, p), mp = posOf(R, mc); if (Math.abs(pp - mp) !== 1 || Math.max(pp, mp) > 12 || Math.abs(p.s - mc.s) > TM.gap) return;
  var dv = ovr(P) - ovr(m); if (Math.abs(dv) < 2 || rnd() > 0.12) return;
  tmInit(S);
  if (pp < mp && dv < 0) { RUN.to = 1; toCard(R, p, mc, m); return; }                 /* aku di depan, rakan (pemandu utama) di belakang */
  if (pp > mp && dv > 0 && asking()) {                                     /* rakan di depan, aku pemandu utama: dia diminta bagi laluan */
    RUN.to = 1; toSwap(p, mc); tmAdd(S, TM.favour);
    radio(R, 'Team order: ' + m.name.split(' ').slice(-1)[0] + ' has been told to let you through.', 'me', 1);
    cap('Team order: positions swapped', 'sc');
  }
}
function toCard(R, p, mc, m) {
  RUN.wait = true; RUN.toMate = mc;
  var sn = m.name.split(' ').slice(-1)[0];
  showModal('<div><span class="badge">Radio · Lap ' + p.lap + '</span></div><h2>Team order</h2><p>The pit wall wants you to let <b>' + esc(sn) + '</b> through. He is the lead driver and has the pace to attack the cars ahead. Obeying costs you a place but earns you trust in the garage.</p><div class="evopts">' +
    '<button class="opt" data-act="to-yes"><div class="t">“Understood. Let him by.”</div><div class="s">Lose a place · teammate bond up · team trusts you</div></button>' +
    '<button class="opt" data-act="to-no"><div class="t">“No. I will fight for it.”</div><div class="s">Keep the place · teammate bond down · team morale drops</div></button></div>');
}
if (typeof A !== 'undefined') {
  A['to-yes'] = function () {
    var R = RUN.R, p = R.p, mc = RUN.toMate; closeModal();
    if (mc && !mc.fin && !mc.dnf) { toSwap(p, mc); radio(R, 'Position swapped. Thank you.', 'e', 1); cap('Team order obeyed', 'lost'); }
    var t = tmInit(S); t.yes++; tmAdd(S, TM.obey); S.morale = clamp((S.morale == null ? 50 : S.morale) + 2, 0, 100);
    var r = repInit(S), tid = S.drivers[S.pi].team; r.rel[tid] = clamp((r.rel[tid] || 0) + 0.5, -10, 10);
    RUN.wait = false; resume();
  };
  A['to-no'] = function () {
    var R = RUN.R; closeModal(); radio(R, 'Copy that. We will talk about this later.', 'x', 1);
    var t = tmInit(S); t.no++; tmAdd(S, TM.refuse); S.morale = clamp((S.morale == null ? 50 : S.morale) - 3, 0, 100);
    var r = repInit(S), tid = S.drivers[S.pi].team; r.rel[tid] = clamp((r.rel[tid] || 0) - 1, -10, 10);
    RUN.wait = false; resume();
  };
}
