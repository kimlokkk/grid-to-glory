/* ===== Mini game ikut radio: jurutera / krew / kawalan race panggil, strip pertarungan atas game ===== */
var SPK = { eng: { lbl: 'RADIO', col: null }, crew: { lbl: 'PIT CREW', col: null }, rc: { lbl: 'RACE CONTROL', col: '#f0b429' } };
function mgCall(ctx, key) {
  var p = me(), R = RUN && RUN.R, P = R ? R.p : null, k = ctx.k || (key.indexOf('pit') === 0 ? 'pit' : key.indexOf('start') === 0 ? 'start' : key), f = ctx.foe, code = f ? f.d.code : 'Someone';
  var zone = ctx.zone ? ctx.zone.charAt(0).toUpperCase() + ctx.zone.slice(1) : 'Next corner', g = ctx.g != null && ctx.g < 9 ? ctx.g.toFixed(1) : null;
  var tyre = '';
  if (f && P && f.eff != null) {
    var dl = Math.floor(f.eff) - Math.floor(P.eff);
    if (k === 'atk' && dl >= 5) tyre = 'His tyres are ' + Math.floor(f.eff) + ' laps old, yours ' + Math.floor(P.eff) + '. ';
    if (k === 'def' && dl <= -5) tyre = 'His tyres are fresher, careful. ';
  }
  switch (k) {
    case 'atk': return { s: 'eng', t: code + (g ? ' ' + g + ' ahead' : ' ahead') + '. ' + (ctx.drs ? 'DRS is open. ' : '') + tyre + zone + ', ' + pick(['send it!', 'go for it!', 'this is your chance!']), rep: 'Copy, let\'s go!' };
    case 'def': return { s: 'eng', t: code + (g ? ' ' + g + ' behind' : ' behind') + ', he\'s going to have a go. ' + tyre + 'Shut the door into ' + zone.toLowerCase() + '!', rep: 'Copy, closing it.' };
    case 'solo': return { s: 'eng', t: 'Clean air. ' + zone + ' coming up, let\'s find some time here.', rep: 'Copy.' };
    case 'lane': return { s: 'rc', t: 'Blue flags for ' + code + '. Slow car ahead, pick a lane.', rep: 'Understood.' };
    case 'grip': return { s: 'eng', t: 'Slippery into ' + zone.toLowerCase() + '. Gentle on the throttle, don\'t let the rears spin up.', rep: 'Copy.' };
    case 'restart': return { s: 'rc', t: 'Safety car is in this lap. Get ready for the restart.', rep: 'Ready.' };
    case 'pit': return { s: 'crew', t: 'Crew is standing by. ' + (ctx.comp ? TYN[ctx.comp] + ' tyres warm in the blankets. ' : '') + 'Box this lap, let\'s make it quick!', rep: 'Box, box!' };
    case 'start': return { s: 'eng', t: 'Full grid. ' + (ctx.pos ? 'You\'re P' + ctx.pos + '. ' : '') + 'Eyes on the lights, ignore the car next to you.', rep: 'Ready.' };
    case 'quali': return { s: 'eng', t: 'Tyres are up to temp. Hot lap now, push every sector.', rep: 'Copy, push.' };
  }
  return { s: 'eng', t: 'Okay, your turn. Focus.', rep: 'Ready!' };
}
function mgStripH(ctx) {
  var f = ctx && ctx.foe; if (!f || !RUN || !RUN.R) return '';
  var P = RUN.R.p, g = ctx.g != null && ctx.g < 9 ? ctx.g.toFixed(1) + 's' : '', atk = ctx.k === 'atk';
  var a = atk ? f : P, b = atk ? P : f;           /* depan di kiri */
  function c(x) { return '<div class="ms-c' + (x === P ? ' me' : '') + '"><b>' + x.d.code + '</b><span class="cv">' + carSVG(x.t, 120) + '</span></div>'; }
  return '<div class="mstrip">' + c(a) + '<div class="ms-g"><span>' + g + '</span>' + (ctx.drs ? '<i>DRS</i>' : '') + '</div>' + c(b) + '</div>';
}
function mgIntro(key, go, sub) {
  var inf = MGINFO[key]; if (!inf) { go(); return; }
  var ctx = UI.mgCtx || {}, done = false; UI.mgCtx = null;
  var call = mgCall(ctx, key), sp = SPK[call.s];
  UI.mgStrip = null;
  showModal(radioCard({ t: '“' + esc(call.t) + '”', live: true, big: true, col: sp.col, who: call.s === 'rc' ? 'RACE CONTROL' : '', lbl: sp.lbl }) + mgStripH(ctx) +
    '<div class="mgi"><div class="mgi-h"><span class="badge sc">' + inf[1] + '</span><b>' + inf[0] + '</b></div><ol>' + inf[2].map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ol>' +
    '<p class="dim mgi-k">Keyboard: Space to tap/hold, arrow keys for left/right.</p></div>' +
    '<button class="btn pri hit mgi-go" data-act="mg-go">“' + call.rep + '”</button>' +
    '<button class="btn sm" data-act="mg-cal">' + (S.settings.lat == null ? 'Taps feel off? Calibrate touch' : 'Touch calibration (' + S.settings.lat + ' ms)') + '</button>');
  A['mg-cal'] = function () { if (done) return; UI.mgCtx = ctx; calibGame(function () { mgIntro(key, go, sub); }); };
  function start() {
    if (done) return; done = true; UI.mkey = null; var n = 3;
    UI.mgStrip = ctx.foe ? ctx : null;
    (function tick() { if (n === 0) { UI.mgArm = performance.now() + 250; go(); return; } showModal('<h2>' + inf[0] + '</h2><div class="big" style="font-size:72px;padding:20px 0;color:var(--acc)">' + n + '</div>'); n--; setTimeout(tick, 450); })();
  }
  A['mg-go'] = start; UI.mkey = start;
}
/* strip pertarungan kekal di atas sepanjang game; hilang bila popup ditutup */
(function () {
  var sm = showModal, cm = closeModal;
  showModal = function (h) { sm((UI.mgStrip ? mgStripH(UI.mgStrip) : '') + h); };
  closeModal = function () { UI.mgStrip = null; cm(); };
})();
/* label penutur pada kad radio */
(function () {
  var rc = radioCard;
  radioCard = function (o) { var h = rc(o); return o.lbl ? h.replace('<span class="fr-lb">RADIO</span>', '<span class="fr-lb">' + o.lbl + '</span>') : h; };
})();

/* ===== Pertarungan v2: satu elemen untuk setiap kereta, gerak licin (lerp) guna transform ===== */
function trainEnsure(R, tr) {
  if (tr._built === R) return;
  tr._built = R; UI.tcars = {};
  var h = '<div class="road"></div>';
  R.cars.forEach(function (f) { h += '<div class="tcar' + (f.isP ? ' me' : '') + '" id="tc' + f.di + '" style="opacity:0;display:none">' + trainCarH(f) + '</div>'; });
  for (var k = 0; k < TRN * 2; k++) h += '<div class="tgap" id="tg' + k + '" style="display:none"></div>';
  tr.innerHTML = h;
}
function drawTrain(R, p, ahead, behind) {
  var tr = document.getElementById('dtrk'); if (!tr) return;
  trainEnsure(R, tr);
  var now = performance.now(), dt = UI.tLast ? Math.min(0.1, (now - UI.tLast) / 1000) : 0.016; UI.tLast = now;
  var W = tr.clientWidth || 300, k = 1 - Math.exp(-dt * 7);
  ahead.sort(function (a, b) { return a.g - b.g; }); behind.sort(function (a, b) { return a.g - b.g; });
  var out = p.fin || p.dnf; if (out) { ahead = []; behind = []; }
  tr.classList.toggle('out', !!out);
  ahead = ahead.slice(0, TRN); behind = behind.slice(0, TRN);
  var oa = trainPlace(ahead), ob = trainPlace(behind), want = {};
  want[p.di] = { x: 50, g: 0 };
  ahead.forEach(function (o, i) { want[o.f.di] = { x: 50 - oa[i], g: o.g }; });
  behind.forEach(function (o, i) { want[o.f.di] = { x: 50 + ob[i], g: -o.g }; });
  var T = UI.tcars, cw = W * TRW / 100;
  R.cars.forEach(function (f) {
    var el = document.getElementById('tc' + f.di); if (!el) return;
    var st = T[f.di] || (T[f.di] = { x: null, o: 0, g: 0 }), w = want[f.di];
    if (w) {
      if (st.x == null || st.o < 0.05) st.x = w.x + (w.g > 0 ? -6 : w.g < 0 ? 6 : 0);   /* masuk dari tepi */
      st.x += (w.x - st.x) * k; st.o += (1 - st.o) * k; st.g += (w.g - st.g) * k;
    } else { st.o += (0 - st.o) * Math.min(1, k * 3); if (st.x != null) st.x += ((st.x < 50 ? -6 : 106) - st.x) * k; }
    if (st.o < 0.02 && !w) { if (el.style.display !== 'none') el.style.display = 'none'; st.x = null; return; }
    if (el.style.display === 'none') el.style.display = '';
    el.style.transform = 'translate3d(' + (st.x / 100 * W - cw / 2).toFixed(1) + 'px,0,0)';
    el.style.opacity = st.o.toFixed(2);
  });
  /* label jarak antara kereta bersebelahan, ikut posisi licin */
  var drsOk = R.lap >= 3 && R.wet < 0.3 && !R.sc, upd = !UI.tgT || now - UI.tgT > 220; if (upd) UI.tgT = now;
  function gl(idx, A2, B2, side, first) {
    var el = document.getElementById('tg' + idx); if (!el) return;
    if (!A2) { el.style.display = 'none'; return; }
    var sa = T[A2.f.di], sb = B2 ? T[B2.f.di] : T[p.di]; if (!sa || !sb || sa.x == null) { el.style.display = 'none'; return; }
    var gv = Math.abs(sa.g - (B2 ? sb.g : 0)), x = (sa.x + sb.x) / 2, drs = first && side < 0 && gv < 1 && drsOk;
    el.style.display = ''; el.style.transform = 'translate3d(' + (x / 100 * W).toFixed(1) + 'px,0,0) translateX(-50%)';
    if (upd) { el.className = 'tgap' + (gv < 1 ? ' bt' : '') + (gv < 0.35 ? ' hot' : '') + (drs ? ' drs' : ''); el.innerHTML = gv.toFixed(1) + (drs ? '<i>DRS</i>' : ''); }
  }
  for (var i = 0; i < TRN; i++) { gl(i, ahead[i], i ? ahead[i - 1] : null, -1, i === 0); gl(TRN + i, behind[i], i ? behind[i - 1] : null, 1, i === 0); }
  trainInfo(R, p, ahead[0], behind[0]);
  var me5 = document.getElementById('tc' + p.di); if (me5) me5.classList.toggle('fight', !!((ahead[0] && ahead[0].g < 1) || (behind[0] && behind[0].g < 1)));
}
