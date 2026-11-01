'use strict';
/* ===== Peta trek, event radio, bahaya sektor, pertarungan, animasi lap ===== */
var Q = { left: 0, quick: false, pause: false, instant: false };

/* ---------- trek prosedural (satu bentuk tetap bagi setiap litar) ---------- */
var TRK = {};
function lcg(seed) { var s = seed >>> 0; return function () { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }; }
function posAt(T, f) {
  var u = f * T.total, lo = 0, hi = T.cum.length - 1;
  while (hi - lo > 1) { var m = (lo + hi) >> 1; if (T.cum[m] <= u) lo = m; else hi = m; }
  var seg = T.cum[hi] - T.cum[lo] || 1, k = (u - T.cum[lo]) / seg, a = T.pts[lo], b = T.pts[hi % T.pts.length];
  return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
}
function buildTrack(ci) {
  if (TRK[ci]) return TRK[ci];
  var g = lcg(4242 + ci * 7919), N = 240, ks = [2, 3, 4, 5, 7], am = [0.20, 0.15, 0.10, 0.07, 0.04], ph = [], ap = [], pts = [], x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9, i;
  ks.forEach(function (k, j) { ph.push(g() * 6.2832); ap.push(am[j] * (0.6 + g() * 0.9)); });
  for (i = 0; i < N; i++) {
    var th = i / N * 6.2832, r = 1;
    ks.forEach(function (k, j) { r += ap[j] * Math.cos(k * th + ph[j]); });
    r = Math.max(r, 0.4);
    var x = r * Math.cos(th) * 1.55, y = r * Math.sin(th);
    pts.push([x, y]); x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
  }
  var sc = Math.min(340 / (x1 - x0), 180 / (y1 - y0)), ox = 200 - (x0 + x1) / 2 * sc, oy = 120 - (y0 + y1) / 2 * sc;
  pts = pts.map(function (q) { return [q[0] * sc + ox, q[1] * sc + oy]; });
  var cum = [0];
  for (i = 1; i <= N; i++) { var a = pts[i - 1], b = pts[i % N]; cum.push(cum[i - 1] + Math.hypot(b[0] - a[0], b[1] - a[1])); }
  var d = 'M' + pts.map(function (q) { return q[0].toFixed(1) + ' ' + q[1].toFixed(1); }).join('L') + 'Z';
  var T = { pts: pts, cum: cum, total: cum[N], d: d };
  T.marks = [1 / 3, 2 / 3, 0].map(function (f) {
    var p0 = posAt(T, f), p1 = posAt(T, (f + 0.004) % 1), dx = p1[0] - p0[0], dy = p1[1] - p0[1], l = Math.hypot(dx, dy) || 1;
    return { x: p0[0], y: p0[1], nx: -dy / l, ny: dx / l };
  });
  TRK[ci] = T; return T;
}
function carDist(R, car, T) {
  if (car.dnf && car.dnfDist != null) return car.dnfDist;
  if (R.lap === 0 || car.prev == null) return -(car.total - R.order[0].total) / R.c.base * 2.2;
  var den = car.nt - car.prev; if (!(den > 0)) den = R.c.base;
  return (R.lap - 1) + (T - car.prev) / den;
}
function placeDot(Tk, el, d, lbl) {
  var f = d - Math.floor(d), q = posAt(Tk, f);
  el.setAttribute('cx', q[0].toFixed(1)); el.setAttribute('cy', q[1].toFixed(1));
  if (lbl) { lbl.setAttribute('x', (q[0] + 8).toFixed(1)); lbl.setAttribute('y', (q[1] - 7).toFixed(1)); }
  return q;
}
function secsHTML(p) {
  var s = p.secs, h = '';
  for (var i = 0; i < 3; i++) {
    var t = '–', c = '';
    if (s && s.note) t = i === 1 ? s.note : '–';
    else if (s && s.t) { t = s.t[i].toFixed(3); c = s.c[i]; }
    h += '<div class="sec ' + c + '" id="sec' + i + '">S' + (i + 1) + '<br>' + t + '</div>';
  }
  return h;
}
function mapHTML(R) {
  var Tk = buildTrack(R.ci), p = R.pcar, Tn = R.lap > 0 ? R.order[0].total : 0, h = '<div class="mapwrap"><svg id="mapsvg" class="map" viewBox="' + camVB() + '" role="img" aria-label="Track map ' + esc(R.c.name) + '">';
  h += '<path class="trk-o" d="' + Tk.d + '"/><path class="trk-i" d="' + Tk.d + '"/><path class="trk-c" d="' + Tk.d + '"/>';
  Tk.marks.forEach(function (m, i) {
    h += '<line class="' + (i === 2 ? 'sline' : 'smark') + '" x1="' + (m.x - m.nx * 9).toFixed(1) + '" y1="' + (m.y - m.ny * 9).toFixed(1) + '" x2="' + (m.x + m.nx * 9).toFixed(1) + '" y2="' + (m.y + m.ny * 9).toFixed(1) + '"/>';
    if (i < 2) h += '<text class="lbl dm" x="' + (m.x + m.nx * 15 - 5).toFixed(1) + '" y="' + (m.y + m.ny * 15 + 3).toFixed(1) + '">S' + (i + 2) + '</text>';
  });
  var rv = R.rivalId, others = R.order.filter(function (c) { return !c.isP; }).reverse();
  others.concat([p]).forEach(function (car) {
    var q = posAt(Tk, (function () { var d = carDist(R, car, Tn); return d - Math.floor(d); })());
    var cls = car.isP ? 'dot me' : (rv === car.di ? 'dot rv' : 'dot') + (car.dnf ? ' out' : '');
    h += '<circle id="cr' + car.di + '" class="' + cls + '" cx="' + q[0].toFixed(1) + '" cy="' + q[1].toFixed(1) + '" r="' + (car.isP ? 6 : 4) + '" style="fill:' + car.t.color + '"/>';
    if (car.isP) h += '<text id="crl" class="lbl" x="' + (q[0] + 8).toFixed(1) + '" y="' + (q[1] - 7).toFixed(1) + '">' + p.d.code + '</text>';
  });
  return h + '</svg><div id="hud" class="hud">' + hudStatic(R) + '</div><div id="cap" class="cap"></div></div>';
}
UI.cam = UI.cam || { x: 200, y: 120, z: 1 }; UI.spd = UI.spd || 2; UI.camMode = UI.camMode || 'auto';
function camVB() { var c = UI.cam, w = 400 / c.z, h = 240 / c.z, x = clamp(c.x - w / 2, 0, 400 - w), y = clamp(c.y - h / 2, 0, 240 - h); return x.toFixed(1) + ' ' + y.toFixed(1) + ' ' + w.toFixed(1) + ' ' + h.toFixed(1); }
function hudStr(rank, a, ga, b, gb) {
  return '<b>P' + rank + '</b>' + (a ? '<span class="' + (ga < 0.5 ? 'hot' : '') + '">▲ ' + a.d.code + ' ' + ga.toFixed(1) + 's</span>' : '') + (b ? '<span class="' + (gb < 0.5 ? 'hot' : '') + '">▼ ' + b.d.code + ' ' + gb.toFixed(1) + 's</span>' : '');
}
function hudStatic(R) {
  var p = R.pcar; if (p.dnf) return '<b class="bad">DNF</b>';
  var i = R.order.indexOf(p); if (i < 0) return '';
  var a = i > 0 ? R.order[i - 1] : null, b = R.order[i + 1] || null;
  return hudStr(i + 1, a, a ? p.total - a.total : 0, b, b ? b.total - p.total : 0);
}

/* ---------- animasi satu lap ---------- */
function calcSecs(R, p) {
  if (p.dnf) return { note: 'DNF' };
  if (R.wasSC) return { note: 'Safety car' };
  if (p.pitting) return { note: 'Lap pit' };
  var f = [0.30, 0.38, 0.32].map(function (x) { return x + gauss() * 0.006; }), sum = f[0] + f[1] + f[2], pb = p.pb || (p.pb = [999, 999, 999]), t = [], c = [];
  var isFL = R.fl.di === p.di && R.fl.lap === R.lap;
  f.forEach(function (x, i) { var v = x / sum * p.last; t.push(v); if (v < pb[i]) { c.push(isFL ? 'pur' : 'good'); pb[i] = v; } else c.push('warn'); });
  return { t: t, c: c };
}
function revealSec(i, s) {
  var el = document.getElementById('sec' + i); if (!el) return;
  if (s.note) { el.innerHTML = 'S' + (i + 1) + '<br>' + (i === 1 ? s.note : '–'); return; }
  el.className = 'sec ' + s.c[i]; el.innerHTML = 'S' + (i + 1) + '<br>' + s.t[i].toFixed(3);
}
var capTimer = 0;
function showCap(text, cls) {
  var el = document.getElementById('cap'); if (!el) return;
  el.textContent = text; el.className = 'cap show ' + (cls || '');
  clearTimeout(capTimer); capTimer = setTimeout(function () { var e = document.getElementById('cap'); if (e) e.className = 'cap'; }, 2300);
}
var CAPPRI = { x: 0, sc: 1, w: 2, e: 3, f: 3.5, p: 4, i: 5 };
function animateLap(R, done) {
  var p = R.pcar, secs = calcSecs(R, p); p.secs = secs;
  var dur = (Q.quick || Q.instant) ? 0 : 3200 / (UI.spd || 1);
  if (dur <= 0) { setTimeout(done, 0); return; }
  var lead = R.order[0], T0 = lead.prev, T1 = lead.nt, Tk = buildTrack(R.ci), els = {}, shown = 0, t0 = performance.now(), last = t0, lastRank = null, lastPassAt = -9, capI = 0;
  for (var i = 0; i < R.cars.length; i++) { var e = document.getElementById('cr' + R.cars[i].di); if (e) els[R.cars[i].di] = e; }
  var lbl = document.getElementById('crl'), svg = document.getElementById('mapsvg'), hud = document.getElementById('hud'), hudTxt = '';
  for (var j = 0; j < 3; j++) { var se = document.getElementById('sec' + j); if (se) { se.className = 'sec'; se.innerHTML = 'S' + (j + 1) + '<br>…'; } }
  var lines = R.log.filter(function (l) { return l.lap === R.lap && l.k !== 'me'; }).sort(function (a, b) { return (CAPPRI[a.k] == null ? 9 : CAPPRI[a.k]) - (CAPPRI[b.k] == null ? 9 : CAPPRI[b.k]); }).slice(0, 3);
  var capAt = lines.map(function (l, n) { return 0.18 + n * (0.7 / Math.max(1, lines.length)); });
  function frame(now) {
    if (!UI.wk || UI.wk.R !== R || UI.screen !== 'wk') return;
    var dt = Math.min(0.1, (now - last) / 1000); last = now;
    var u = Math.min(1, (now - t0) / dur), T = T0 + u * (T1 - T0), arr = [], pq = null;
    R.cars.forEach(function (car) {
      var d = carDist(R, car, T), el = els[car.di], q = el ? placeDot(Tk, el, d, car.isP ? lbl : null) : null;
      if (car.isP) pq = q;
      if (!car.dnf) arr.push({ c: car, d: d });
    });
    arr.sort(function (a, b) { return b.d - a.d; });
    var jx = -1; for (var k = 0; k < arr.length; k++) if (arr[k].c === p) { jx = k; break; }
    var minGap = 99;
    if (jx >= 0) {
      var lt = p.raw > 0 ? p.raw : R.c.base, A1 = jx > 0 ? arr[jx - 1] : null, B1 = jx < arr.length - 1 ? arr[jx + 1] : null;
      var ga = A1 ? (A1.d - arr[jx].d) * lt : 99, gb = B1 ? (arr[jx].d - B1.d) * lt : 99; minGap = Math.min(ga, gb);
      var ht = hudStr(jx + 1, A1 && A1.c, ga, B1 && B1.c, gb); if (ht !== hudTxt && hud) { hud.innerHTML = ht; hudTxt = ht; }
      if (lastRank != null && jx + 1 !== lastRank && u - lastPassAt > 0.06) {
        lastPassAt = u;
        if (jx + 1 < lastRank) showCap('Overtake ' + B1.c.d.code + '! P' + (jx + 1), 'pass');
        else showCap('Passed by ' + A1.c.d.code + '. P' + (jx + 1), 'lost');
      }
      lastRank = jx + 1;
    }
    /* kamera */
    if (svg) {
      var tz = UI.camMode === 'full' ? 1 : UI.camMode === 'follow' ? 2.4 : (minGap < 1.2 ? 2.7 : minGap < 3 ? 1.7 : 1), cam = UI.cam, kk = 1 - Math.exp(-dt * 3.2);
      var tx = tz > 1.05 && pq ? pq[0] : 200, ty = tz > 1.05 && pq ? pq[1] : 120;
      cam.z += (tz - cam.z) * kk; cam.x += (tx - cam.x) * kk; cam.y += (ty - cam.y) * kk;
      svg.setAttribute('viewBox', camVB());
    }
    while (shown < 3 && u >= (shown + 1) / 3 - 0.001) { revealSec(shown, secs); shown++; }
    while (capI < lines.length && u >= capAt[capI]) { var ln = lines[capI++]; showCap(ln.t, ln.k === 'x' ? 'lost' : ln.k === 'sc' ? 'sc' : ln.k === 'w' ? 'wet' : ''); }
    if (u < 1) UI.raf = requestAnimationFrame(frame); else { UI.raf = 0; done(); }
  }
  UI.raf = requestAnimationFrame(frame);
}

/* ---------- pelari lap ---------- */
function stopRun() { Q.left = 0; Q.quick = false; Q.pause = false; if (UI.raf) { cancelAnimationFrame(UI.raf); UI.raf = 0; } UI.busy = false; }
function runLaps(n, quick) {
  if (UI.busy) return;
  Q.left = n; Q.quick = !!quick; Q.pause = false; nextLap();
}
function rlog(R, t, k, imp) { R.log.push({ lap: R.pend ? R.pend.lap : R.lap + 1, t: t, k: k || 'i', imp: imp ? 1 : 0 }); if (imp) R.lastImp++; }
function nextLap() {
  var wk = UI.wk;
  if (!wk || UI.screen !== 'wk' || wk.step !== 'race') { UI.busy = false; return; }
  var R = wk.R, p = R.pcar;
  if (R.done) { UI.busy = false; render(); return; }
  UI.busy = true; render();
  preEvent(R, p, function () {
    stepLapA(R, S);
    var bt = detectBattle(R, p);
    function go() {
      stepLapB(R, S);
      animateLap(R, function () { lapEnd(R); });
    }
    if (bt) { p.cdB = R.lap; R.rivalId = bt.rival.di; askBattle(R, p, bt, function () { R.battle = bt; go(); }); }
    else midEvent(R, p, go);
  });
}
function lapEnd(R) {
  var wk = UI.wk;
  if (!wk || wk.R !== R || UI.screen !== 'wk') { UI.busy = false; return; }
  R.rivalId = null; Q.left--;
  var p = R.pcar, stop = R.done || Q.left <= 0 || Q.pause;
  if (!stop && p.dnf && !Q.quick) { if (S.settings.ask) stop = true; else { Q.quick = true; Q.left = 999; toast('You\'re out. Simulating the rest of the race.'); } }
  if (!stop && !Q.quick && S.settings.ask && R.lastImp > 0) stop = true;
  if (!stop && !p.dnf && S.settings.ask) { var dd = pitDue(p, R); if (dd && R.lap + 1 === dd.lap) stop = true; }
  if (stop) { UI.busy = false; Q.left = 0; Q.quick = false; Q.pause = false; UI.cam = { x: 200, y: 120, z: 1 }; render(); return; }
  setTimeout(nextLap, (Q.quick || Q.instant) ? 40 : (S.settings.ask ? 250 : 60));
}

/* ---------- pit dari event / butang ---------- */
function queuePit(comp, cont) {
  var wk = UI.wk, R = wk.R, p = R.pcar;
  function q(t, qual) { p.pitNext = comp; p.pitTime = t; if (p.plan.length) p.plan.shift(); if (qual != null) wk.mg.pn.push(qual); cont(); }
  if (S.settings.mini && !Q.quick && !Q.instant) pitGame(q); else q(crewTime(p), null);
}

/* ---------- modal event ---------- */
function autoIdx(ev) {
  var st = UI.wk && UI.wk.style;
  if (st === 'agresif' && ev.agr != null) return ev.agr;
  if (st === 'jimat' && ev.safe != null) return ev.safe;
  return ev.def;
}
function showEvent(ev, cont) {
  if (Q.quick || !S.settings.ask) {
    var ix = autoIdx(ev), o = ev.opts[ix];
    if (!Q.quick && !Q.instant) rlog(UI.wk.R, ev.title.replace(/<[^>]+>/g, '') + ': ' + o.l.replace(/\s*\(.*$/, ''), 'e');
    o.fn(cont); return;
  }
  UI.ev = { opts: ev.opts, cont: cont };
  var h = '<div><span class="badge ' + (ev.cls || '') + '">' + ev.tag + '</span></div><h2>' + ev.title + '</h2><p>' + ev.body + '</p>' + (ev.extra || '') + '<div class="evopts">';
  ev.opts.forEach(function (o, i) { h += '<button class="opt" data-act="ev-opt" data-i="' + i + '"><div class="t">' + o.l + '</div><div class="s">' + o.d + '</div></button>'; });
  showModal(h + '</div>');
}
A['ev-opt'] = function (d) { var e = UI.ev; if (!e) return; UI.ev = null; closeModal(); e.opts[+d.i].fn(e.cont); };
function cool(p, k, n, lap) { p.cd = p.cd || {}; if (p.cd[k] != null && lap - p.cd[k] < n) return true; p.cd[k] = lap; return false; }
function peek(p, k, n, lap) { return p.cd && p.cd[k] != null && lap - p.cd[k] < n; }

/* ---------- radio jurutera (sebelum lap) ---------- */
function preEvent(R, p, cont) {
  if (p.dnf || p.auto || p.pitNext || R.lap + 1 > R.c.laps) return cont();
  var L = R.lap + 1, rem = R.c.laps - R.lap, slick = p.comp === 'S' || p.comp === 'M' || p.comp === 'H', ts = tyreState(p, R), ev = null, rec;
  var hp = Math.round(ts.health * 100);
  if (R.sc > 0 && p.scSeen !== R.scCount) {
    p.scSeen = R.scCount;
    if (rem > 3) {
      rec = chooseComp(p, R);
      var needs = !(p.used.I || p.used.W) && ['S', 'M', 'H'].filter(function (k) { return p.used[k]; }).length < 2;
      ev = { tag: 'Safety car', cls: 'sc', title: 'Safety car on track', body: 'Pitting now costs only half the usual time. Your ' + COMP[p.comp].n + ', ' + p.age + ' laps, ' + hp + '%.' + (needs ? ' You haven\'t used two dry compounds yet.' : ''),
        opts: [{ l: 'Pit: ' + COMP[rec].n, d: 'Cheap right now. You might lose places to cars that stay out.', fn: function (c) { rlog(R, 'Engineer: we\'re pitting under the safety car.', 'e'); queuePit(rec, c); } },
          { l: 'Stay out', d: 'Keep track position, but a later stop will cost more.', fn: function (c) { rlog(R, 'Engineer: staying out.', 'e'); c(); } }],
        def: (needs || ts.health < 0.7) && !p.pitNext ? 0 : 1 };
    }
  }
  if (!ev && slick && R.wet >= 0.24 && rem > 2 && !peek(p, 'rain', 2, L)) {
    cool(p, 'rain', 2, L); rec = R.wet > 0.68 ? 'W' : 'I';
    ev = { tag: 'Weather', cls: 'wet', title: 'Track getting wetter', body: 'Your dry tyres are getting harder to control. Engineer recommends ' + COMP[rec].n + '.',
      opts: [{ l: 'Pit: ' + COMP[rec].n, d: 'Switch now before it gets too slow.', fn: function (c) { queuePit(rec, c); } },
        { l: 'Stay on dries', d: 'Risk losing a lot of time if the rain keeps coming.', fn: function (c) { c(); } }], def: 0 };
  } else if (!ev && slick && R.w.start > 0 && R.w.start < 999 && L === R.w.start - 1 && R.wet < 0.1 && rem > 5 && !peek(p, 'gamble', 99, L)) {
    cool(p, 'gamble', 99, L);
    ev = { tag: 'Weather', cls: 'wet', title: 'Radar: rain incoming', body: 'Dark clouds over sector 3. Rain could arrive in a lap or two. Exact timing unclear.',
      opts: [{ l: 'Gamble: pit for Inters now', d: 'If the rain comes, big win. If it doesn\'t, big loss.', fn: function (c) { rlog(R, 'Engineer: we\'re betting on rain.', 'e'); queuePit('I', c); } },
        { l: 'Wait and see', d: 'Stay on dries until the rain actually arrives.', fn: function (c) { c(); } }], def: 1 };
  } else if (!ev && !slick && R.wet < 0.1 && rem > 3 && !peek(p, 'dry', 3, L)) {
    cool(p, 'dry', 3, L); rec = chooseComp(p, R);
    ev = { tag: 'Weather', cls: 'wet', title: 'Track is dry now', body: 'Your ' + COMP[p.comp].n + ' tyres are overheating on a dry track. Recommended: ' + COMP[rec].n + '.',
      opts: [{ l: 'Pit: ' + COMP[rec].n, d: 'Back to dry tyres.', fn: function (c) { queuePit(rec, c); } }, { l: 'Stay out', d: 'Wet tyres wear very quickly on a dry track.', fn: function (c) { c(); } }], def: 0 };
  } else if (!ev && p.comp === 'I' && R.wet > 0.72 && rem > 2 && !peek(p, 'rain', 2, L)) {
    cool(p, 'rain', 2, L);
    ev = { tag: 'Weather', cls: 'wet', title: 'Heavy rain', body: 'Inters are starting to aquaplane in the standing water.',
      opts: [{ l: 'Pit: Wets', d: 'Full wets for the heavy stuff.', fn: function (c) { queuePit('W', c); } }, { l: 'Stay on Inters', d: 'Risk of aquaplaning off.', fn: function (c) { c(); } }], def: 0 };
  }
  if (!ev && slick && ts.health < (p.plan.length ? 0.15 : 0.28) && rem > 3 && !peek(p, 'tyre', 3, L)) {
    cool(p, 'tyre', 3, L); rec = chooseComp(p, R);
    ev = { tag: 'Tyres', cls: '', title: 'Tyres losing grip', body: COMP[p.comp].n + ' at ' + hp + '%, ' + p.age + ' laps old. Pace is dropping.',
      opts: [{ l: 'Pit: ' + COMP[rec].n, d: 'Change now, lose time in the pit lane.', fn: function (c) { queuePit(rec, c); } },
        { l: 'Stay out, Save mode', d: 'Slower wear, but slower pace too.', fn: function (c) { p.mode = 0; rlog(R, 'Engineer: manage the tyres.', 'e'); c(); } },
        { l: 'Push to the end', d: 'Try to hang on a few more laps. Risk of a sudden drop-off.', fn: function (c) { p.mode = 2; rlog(R, 'Engineer: okay, push!', 'e'); c(); } }],
      def: ts.health < 0.15 ? 0 : 1 };
  }
  if (ev) showEvent(ev, cont); else cont();
}

/* ---------- bahaya tengah lap (selepas fasa A) ---------- */
var HAZ = [
  { tag: 'Sector 2', title: 'Yellow flag', body: 'A car has stopped by the side of the track. Stewards are watching.', def: 0, agr: 1, safe: 0, opts: [
    { l: 'Lift off', d: 'Safe. Lose about 1.5s.', fn: function (R, p) { p.nt += 1.5; p.raw += 1.5; return 'You lifted under yellow (+1.5s).'; } },
    { l: 'Keep it flat', d: '75%: lose only 0.3s. 25%: 4s penalty.', fn: function (R, p) { if (rnd() < 0.75) { p.nt += 0.3; p.raw += 0.3; return 'You went through bravely. Barely lost anything.'; } p.pen += 4; return '4s penalty for ignoring yellow flags!'; } }] },
  { tag: 'Sector 1', title: 'Late braking into turn 3', body: 'A chance to gain time, but the front tyres are already hot.', def: 1, agr: 0, safe: 1, opts: [
    { l: 'Brake late', d: '50%: gain 0.6s. 50%: lock-up, lose 2s and damage the tyres.', fn: function (R, p) { if (rnd() < 0.5) { p.nt -= 0.6; p.raw -= 0.6; return 'Late braking worked, gained 0.6s.'; } p.nt += 2; p.raw += 2; p.eff += 3; return 'Lock-up! Lost 2s and flat-spotted the tyres.'; } },
    { l: 'Normal braking', d: 'No effect.', fn: function () { return null; } }] },
  { tag: 'Sector 3', title: 'Debris on the racing line', body: 'A piece of front wing on the racing line.', def: 0, agr: 1, safe: 0, opts: [
    { l: 'Go off-line to avoid it', d: 'Lose 0.7s and pick up a bit of dirt.', fn: function (R, p) { p.nt += 0.7; p.raw += 0.7; p.eff += 0.5; return 'You avoided the debris (+0.7s).'; } },
    { l: 'Drive over it gently', d: '85%: no effect. 15%: floor damage, lose 4s.', fn: function (R, p) { if (rnd() < 0.85) return 'You got through without trouble.'; p.nt += 4; p.raw += 4; return 'The debris damaged the floor (+4s).'; } }] }
];
function midEvent(R, p, cont) {
  var P = R.pend, L = R.lap;
  if (!p.dnf && P && !P.underSC && S.settings.mini && L >= 3 && L < R.c.laps - 1 && !peek(p, 'chal', 4, L) && rnd() < 0.34) { cool(p, 'chal', 4, L); return runChallenge(R, p, cont); }
  if (p.dnf || !P || P.underSC || L < 2 || L >= R.c.laps || rnd() > 0.2 || peek(p, 'haz', 3, L)) return cont();
  var pool = HAZ.slice();
  var act = P.act, i = act.indexOf(p);
  if (i > 0 && !p.pitting && p.nt - act[i - 1].nt < 2.5 && p.nt - act[i - 1].nt > 0.3 && !act[i - 1].pitting) {
    pool.push({ tag: 'Sector 1', title: 'Slipstream chance', body: 'You\'re in the slipstream of ' + act[i - 1].d.code + ' on the long straight.', def: 0, agr: 0, safe: 1, opts: [
      { l: 'Stay close', d: 'Gain 0.5s, slightly more tyre wear.', fn: function (R2, p2) { p2.nt -= 0.5; p2.raw -= 0.5; p2.eff += 0.3; return 'Slipstream worked, gained 0.5s.'; } },
      { l: 'Keep a gap', d: 'No effect.', fn: function () { return null; } }] });
  }
  var hz = pick(pool); cool(p, 'haz', 3, L);
  var opts = hz.opts.map(function (o) { return { l: o.l, d: o.d, fn: function (c) { var m = o.fn(R, p); if (m) rlog(R, m, 'e'); c(); } }; });
  showEvent({ tag: hz.tag, cls: 'sc', title: hz.title, body: hz.body, opts: opts, def: hz.def, agr: hz.agr, safe: hz.safe }, cont);
}

/* ---------- pertarungan roda ke roda ---------- */
function detectBattle(R, p) {
  var P = R.pend; if (!P || P.underSC || p.dnf || p.pitting) return null;
  if (p.cdB != null && R.lap - p.cdB < 2) return null;
  var act = P.act, i = act.indexOf(p); if (i < 0) return null;
  if (i > 0) { var a = act[i - 1]; if (!a.pitting && p.nt < a.nt) return { kind: 'attack', rival: a }; }
  if (i < act.length - 1) { var b = act[i + 1]; if (!b.pitting && b.nt < p.nt) return { kind: 'defend', rival: b }; }
  return null;
}
function pct(x) { return Math.round(x * 100) + '%'; }
function compareHTML(R, p, r) {
  function side(c, n) { var ts = tyreState(c, R); return '<div class="cmp"><div class="dim" style="font-size:12px">' + n + '</div><div class="row">' + tyc(c.comp) + '<b>' + c.d.code + '</b></div><div class="mono dim" style="font-size:12px">' + c.age + ' lap · ' + Math.round(ts.health * 100) + '%</div></div>'; }
  return '<div class="cmpbox">' + side(p, 'You') + '<div class="vs">VS</div>' + side(r, 'Rival') + '</div>';
}
function askBattle(R, p, bt, cont) {
  var r = bt.rival, L = R.lap, gap = Math.abs(p.total - r.total).toFixed(2), risk = 0.11 * (1 + R.wet * 2), ev;
  var drs = R.wet < 0.4 && L > 1 && Math.abs(p.total - r.total) < 1.0;
  function setS(kind, q) { p.stance = kind; p.sq = q; bt.kind = kind; }
  function withGame(kind, c) {
    if (S.settings.duel && !Q.quick && !Q.instant) duelGame(kind, function (q) { UI.wk.mg.bq.push(q); setS(kind, q); c(); });
    else { setS(kind, 0.5); c(); }
  }
  if (bt.kind === 'attack') {
    var s0 = passScore(R, p, r, L + 0, true);
    var pa = passProb(s0 + 0.7 + 1.6 * 0.5), ph = passProb(s0 - 1.4);
    ev = { tag: 'Racecraft', cls: 'sc', title: 'Attack ' + esc(r.d.name.split(' ').slice(-1)[0]) + '?', body: 'You\'re P' + (R.order.indexOf(p) + 1) + '. ' + r.d.code + ' is ahead by ' + gap + 's.' + (drs ? ' DRS available.' : ''), extra: compareHTML(R, p, r),
      opts: [{ l: 'Attack (≈' + pct(pa) + ')', d: 'Brake late. Contact risk ' + pct(risk) + ' if it fails, plus extra tyre wear.', fn: function (c) { withGame('attack', c); } },
        { l: 'Wait (≈' + pct(ph) + ')', d: 'Stay close and save tyres. Small chance of a pass.', fn: function (c) { setS('hold', 0.5); c(); } }], def: pa > 0.42 && R.wet < 0.5 ? 0 : 1, agr: 0, safe: pa > 0.55 && R.wet < 0.4 ? 0 : 1 };
  } else {
    var s1 = passScore(R, r, p, L + 0, true);
    var pd = passProb(s1 - (0.7 + 1.6 * 0.5)), pn = passProb(s1), py = passProb(s1 + 1.5);
    ev = { tag: 'Racecraft', cls: 'sc', title: esc(r.d.name.split(' ').slice(-1)[0]) + ' is attacking!', body: r.d.code + ' is behind you, ' + gap + 's.' + (drs ? ' DRS active for him.' : ''), extra: compareHTML(R, p, r),
      opts: [{ l: 'Defend (he gets by ≈' + pct(pd) + ')', d: 'Cover the inside line. More tyre wear.', fn: function (c) { withGame('defend', c); } },
        { l: 'Let him go (he gets by ≈' + pct(py) + ')', d: 'Save tyres and avoid risk, but you\'ll almost certainly lose a place.', fn: function (c) { setS('yield', 0.5); c(); } }], def: 0, agr: 0, safe: 0 };
  }
  showEvent(ev, cont);
}
function duelGame(kind, cb) {
  var zoneW = clamp(0.12 + (me().race - 60) / 300, 0.1, 0.24), zone = 0.3 + rnd() * 0.4, t0 = performance.now(), sp = 1.5 + rnd() * 0.5, raf = 0, locked = false;
  function pos() { var ph = ((performance.now() - t0) / 1000 * sp) % 2; return ph < 1 ? ph : 2 - ph; }
  showModal('<h2>' + (kind === 'attack' ? 'Brake late!' : 'Cover the line!') + '</h2><p class="dim">Tap (or press Space) when the marker is in the green zone.</p><div class="track"><div class="zone" style="left:' + ((zone - zoneW / 2) * 100) + '%;width:' + (zoneW * 100) + '%"></div><div class="mk" id="mk"></div></div><button class="btn pri hit" data-tap="mg-duel" style="min-height:70px">NOW</button>');
  function loop() { var m = document.getElementById('mk'); if (!m) return; m.style.left = (pos() * 100) + '%'; raf = requestAnimationFrame(loop); }
  raf = requestAnimationFrame(loop);
  function lock() {
    if (locked) return; locked = true; cancelAnimationFrame(raf); UI.mkey = null;
    var e = Math.abs(pos() - zone), q = clamp(1 - Math.max(0, e - zoneW / 2) / 0.3, 0, 1);
    showModal('<h2 class="' + (q > 0.85 ? 'pur' : q > 0.5 ? 'good' : 'warn') + '">' + (q > 0.85 ? 'Perfect!' : q > 0.5 ? 'Good' : 'Late') + '</h2>');
    setTimeout(function () { closeModal(); cb(q); }, 650);
  }
  A['mg-duel'] = lock; UI.mkey = lock;
}

/* ---------- lampu permulaan sinematik + mula auto ---------- */
function introLights(cb) {
  var wk = UI.wk, n = 0;
  if (Q.instant) { cb(); return; }
  function draw(on, msg, cls) {
    var l = ''; for (var i = 0; i < 5; i++) l += '<i class="' + (i < on ? 'on' : '') + '"></i>';
    showModal('<h2>' + esc(wk.c.name) + '</h2><div class="lights">' + l + '</div><p class="' + (cls || 'dim') + '" style="text-align:center;font-weight:600">' + msg + '</p>');
  }
  draw(0, 'Cars to the grid...');
  (function next() {
    setTimeout(function () {
      n++; draw(n, 'Red lights on');
      if (n < 5) next();
      else setTimeout(function () {
        draw(0, 'GO! Your reaction ' + Math.round((wk.react || 0.24) * 1000) + ' ms' + (wk.jump ? ' · jump start, 5s penalty' : ''), wk.jump ? 'bad' : 'good');
        setTimeout(function () { closeModal(); cb(); }, 1200);
      }, 700 + rnd() * 1400);
    }, n === 0 ? 900 : 600);
  })();
}
function beginRace() {
  if (S.settings.ask) return;
  introLights(function () { runLaps(999, false); });
}

/* ---------- cabaran kecil: +-1 saat ---------- */
var CHAL = {
  chicane: { n: 'Tight chicane', good: 'Chicane as clean as a freshly washed plate. Gained 1 second!', ok: 'Through the chicane, but not pretty.', bad: 'Off into the grass. The grass did nothing to you. Time lost.' },
  hairpin: { n: 'Slow hairpin', good: 'Perfect hairpin braking! Even the engineer is clapping. Gained 1 second!', ok: 'Safe through the hairpin, nothing gained.', bad: 'The hairpin ate you up. Lost time on the exit.' },
  slow: { n: 'Slow car', good: 'You slipped past the backmarker like a ghost. Gained 1 second!', ok: 'Backmarker cleared, but you got held up a little.', bad: 'That backmarker really was slow. You got stuck. Time lost.' }
};
function applyChallenge(R, p, kind, q, cont) {
  var ch = CHAL[kind], delta = 1 - 2 * q;
  p.nt += delta; p.raw += delta;
  rlog(R, (q > 0.75 ? ch.good : q < 0.35 ? ch.bad : ch.ok) + ' (' + (delta < 0 ? '−' : '+') + Math.abs(delta).toFixed(1) + 's)', q > 0.75 ? 'me' : q < 0.35 ? 'x' : 'e');
  cont();
}
function runChallenge(R, p, cont) {
  var kind = pick(['chicane', 'hairpin', 'slow']), auto = !S.settings.ask || Q.quick || Q.instant;
  function fin(q) { if (!auto) UI.wk.mg.bq.push(q); applyChallenge(R, p, kind, clamp(q, 0, 1), cont); }
  if (auto) return fin(clamp(0.5 + (me().cons - 66) / 100 + gauss() * 0.25, 0, 1));
  if (kind === 'chicane') chicaneGame(fin); else if (kind === 'hairpin') timingGame('Slow hairpin!', 'Tap (or press Space) when the marker is in the green zone to nail the braking.', 0.1, 1.9 + rnd() * 0.5, fin); else laneGame(fin);
}
function timingGame(title, hint, zoneW, sp, cb) {
  var zone = 0.3 + rnd() * 0.4, t0 = performance.now(), raf = 0, locked = false;
  function pos() { var ph = ((performance.now() - t0) / 1000 * sp) % 2; return ph < 1 ? ph : 2 - ph; }
  showModal('<h2>' + title + '</h2><p class="dim">' + hint + '</p><div class="track"><div class="zone" style="left:' + ((zone - zoneW / 2) * 100) + '%;width:' + (zoneW * 100) + '%"></div><div class="mk" id="mk"></div></div><button class="btn pri hit" data-tap="mg-tg" style="min-height:70px">BRAKE!</button><button class="btn sm" data-act="mg-tgauto">Auto</button>');
  function loop() { var m = document.getElementById('mk'); if (!m) return; m.style.left = (pos() * 100) + '%'; raf = requestAnimationFrame(loop); }
  raf = requestAnimationFrame(loop);
  function end(q) {
    if (locked) return; locked = true; cancelAnimationFrame(raf); UI.mkey = null;
    showModal('<h2 class="' + (q > 0.75 ? 'pur' : q > 0.35 ? 'good' : 'warn') + '">' + (q > 0.75 ? 'Perfect!' : q > 0.35 ? 'Not bad' : 'Too late') + '</h2>');
    setTimeout(function () { closeModal(); cb(q); }, 600);
  }
  function lock() { var e = Math.abs(pos() - zone); end(clamp(1 - Math.max(0, e - zoneW / 2) / 0.28, 0, 1)); }
  A['mg-tg'] = lock; A['mg-tgauto'] = function () { end(clamp(0.5 + (me().cons - 66) / 100 + gauss() * 0.25, 0, 1)); }; UI.mkey = lock;
}
function chicaneGame(cb) {
  var n = 4, seq = [], i = 0, hits = 0, timer = 0, done = false;
  for (var k = 0; k < n; k++) seq.push(rnd() < 0.5 ? 'L' : 'R');
  function draw() {
    var dots = ''; for (var j = 0; j < n; j++) dots += '<i class="stp ' + (j < i ? (seq[j] === seq[j] && j < i && hit[j] ? 'ok' : 'no') : (j === i ? 'cur' : '')) + '"></i>';
    showModal('<h2>Tight chicane!</h2><p class="dim">Tap the right direction as fast as you can (arrow keys work too).</p><div class="stps">' + dots + '</div><div class="bigarrow">' + (seq[i] === 'L' ? '◀' : '▶') + '</div><div class="row" style="flex-wrap:nowrap"><button class="btn pri hit" data-tap="mg-lr" data-d="L">◀ Left</button><button class="btn pri hit" data-tap="mg-lr" data-d="R">Right ▶</button></div><button class="btn sm" data-act="mg-lrauto">Auto</button>');
    clearTimeout(timer); timer = setTimeout(function () { step(null); }, 1100);
  }
  var hit = [];
  function step(dir) {
    if (done) return; clearTimeout(timer);
    var ok = dir === seq[i]; hit[i] = ok; if (ok) hits++; i++;
    if (i >= n) { done = true; UI.mkey = null; UI.mkeyLR = null; var q = hits / n; showModal('<h2 class="' + (q > 0.75 ? 'pur' : q > 0.35 ? 'good' : 'warn') + '">' + hits + ' / ' + n + ' correct</h2>'); setTimeout(function () { closeModal(); cb(q); }, 650); }
    else draw();
  }
  A['mg-lr'] = function (d) { step(d.d); };
  A['mg-lrauto'] = function () { if (done) return; done = true; clearTimeout(timer); UI.mkeyLR = null; closeModal(); cb(clamp(0.5 + (me().cons - 66) / 100 + gauss() * 0.25, 0, 1)); };
  UI.mkeyLR = function (d) { step(d); };
  draw();
}
function laneGame(cb) {
  var car = rnd() < 0.5 ? 0 : 1, t0 = performance.now(), done = false, moved = false, switchAt = 520 + rnd() * 300, willMove = rnd() < 0.55, tmo = 0, tick = 0;
  function draw() {
    showModal('<h2>Slow car ahead!</h2><p class="dim">Pick the open lane. He might switch lanes!</p><div class="lanes">' +
      [0, 1].map(function (l) { return '<button class="lane ' + (car === l ? 'blk' : '') + '" data-tap="mg-lane" data-l="' + l + '">' + (car === l ? 'SLOW CAR' : 'Clear') + '</button>'; }).join('') + '</div><button class="btn sm" data-act="mg-laneauto">Auto</button>');
  }
  function end(q) {
    if (done) return; done = true; clearTimeout(tmo); clearInterval(tick);
    showModal('<h2 class="' + (q > 0.75 ? 'pur' : q > 0.35 ? 'good' : 'warn') + '">' + (q > 0.75 ? 'Through!' : q > 0.35 ? 'Close' : 'Hit!') + '</h2>');
    setTimeout(function () { closeModal(); cb(q); }, 600);
  }
  A['mg-lane'] = function (d) { var t = performance.now() - t0; end(+d.l === car ? 0 : clamp(1 - t / 1900, 0.4, 1)); };
  A['mg-laneauto'] = function () { if (done) return; done = true; clearTimeout(tmo); closeModal(); cb(clamp(0.5 + (me().cons - 66) / 100 + gauss() * 0.25, 0, 1)); };
  draw();
  if (willMove) tmo = setTimeout(function () { if (done) return; car = 1 - car; moved = true; draw(); }, switchAt);
  tick = setTimeout(function () { end(0); }, 2200);
}
