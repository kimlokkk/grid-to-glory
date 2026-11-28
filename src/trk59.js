'use strict';
/* Circuit layouts drawn from the real venues (2.6.9). Each point is [x, y, r]: r is how far the corner starts from the point,
   small for hairpins and chicanes, big for sweepers; r 0 keeps a straight running through. The lap runs in point order and
   starts at point 0. Circuits not listed here keep their older outline (with rounded corners). */
var TRACK_LAYOUT2 = {
  16: [[150, 200, 0], [300, 200, 4], [312, 186, 4], [330, 188, 6], [375, 165, 50], [390, 110, 30], [388, 92, 4], [374, 84, 4], [384, 72, 6], [380, 48, 12], [365, 34, 8], [345, 40, 10], [300, 60, 0], [225, 90, 6], [212, 104, 6], [196, 96, 6], [110, 118, 10], [50, 128, 40], [40, 185, 38], [80, 200, 20]]   /* Velocera, after Monza */,
  3: [[240, 195, 0], [335, 195, 30], [362, 170, 10], [338, 150, 8], [358, 130, 8], [330, 114, 8], [350, 94, 8], [322, 64, 24], [280, 56, 8], [262, 66, 4], [250, 80, 5], [130, 172, 4], [112, 164, 4], [106, 150, 8], [70, 140, 40], [30, 100, 22], [45, 62, 22], [80, 58, 10], [232, 150, 30], [206, 168, 4], [226, 182, 4]]   /* Hanabi, after Suzuka (figure of eight) */,
  2: [[110, 160, 0], [175, 140, 5], [190, 120, 6], [245, 80, 30], [262, 50, 8], [282, 38, 6], [305, 50, 6], [316, 68, 4], [336, 70, 4], [376, 90, 2], [370, 102, 2], [338, 98, 4], [330, 118, 6], [336, 138, 5], [318, 160, 6], [230, 192, 60], [190, 194, 4], [178, 182, 4], [166, 194, 5], [140, 198, 6], [120, 182, 4], [108, 196, 4], [90, 182, 4], [78, 194, 4], [52, 188, 4], [46, 170, 5], [68, 160, 6]]   /* Monte Albrecht, after Monaco */
};
/* points [x, y, r]: r = how far the corner starts from the point (small = hairpin/chicane, big = sweeper) */
function trackRound2(P) {
  var n = P.length, out = [], i, k;
  for (i = 0; i < n; i++) {
    var a = P[(i - 1 + n) % n], v = P[i], b = P[(i + 1) % n], r = v[2] == null ? 10 : v[2];
    var la = Math.hypot(v[0] - a[0], v[1] - a[1]), lb = Math.hypot(b[0] - v[0], b[1] - v[1]);
    var c = Math.min(r, 0.48 * la, 0.48 * lb);
    if (c < 0.5) { out.push([v[0], v[1]]); continue; }
    var p0 = [v[0] + (a[0] - v[0]) * c / la, v[1] + (a[1] - v[1]) * c / la], p2 = [v[0] + (b[0] - v[0]) * c / lb, v[1] + (b[1] - v[1]) * c / lb], m = Math.max(3, Math.round(c / 2.5));
    for (k = 0; k <= m; k++) { var t = k / m, u = 1 - t; out.push([u * u * p0[0] + 2 * u * t * v[0] + t * t * p2[0], u * u * p0[1] + 2 * u * t * v[1] + t * t * p2[1]]); }
  }
  return out;
}
function trackFit(pts) {
  var x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9; pts.forEach(function (q) { x0 = Math.min(x0, q[0]); x1 = Math.max(x1, q[0]); y0 = Math.min(y0, q[1]); y1 = Math.max(y1, q[1]); });
  var sc = Math.min(330 / (x1 - x0), 170 / (y1 - y0)), ox = 200 - (x0 + x1) / 2 * sc, oy = 120 - (y0 + y1) / 2 * sc;
  return pts.map(function (q) { return [q[0] * sc + ox, q[1] * sc + oy, q[2] == null ? null : q[2] * sc]; });
}
(function () { if (typeof TRK !== 'undefined') Object.keys(TRACK_LAYOUT2).forEach(function (k) { delete TRK[k]; }); })();
