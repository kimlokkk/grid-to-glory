'use strict';
/* Real flags for the circuits (2.6.9). The circuits are fictional, each modelled on a real venue (length, layout, character);
   the flag is the host country of the venue it is modelled on. Before, the flag was coloured stripes from a hash. */
FLAG_SVGS.AZ = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMjAwIiBoZWlnaHQ9IjYwMCIgdmlld0JveD0iMCAwIDEyMDAgNjAwIj48cGF0aCBmaWxsPSIjNTA5ZTJmIiBkPSJNMCAwaDEyMDB2NjAwSDB6Ii8+PHBhdGggZmlsbD0iI2VmMzM0MCIgZD0iTTAgMGgxMjAwdjQwMEgweiIvPjxwYXRoIGZpbGw9IiMwMGI1ZTIiIGQ9Ik0wIDBoMTIwMHYyMDBIMHoiLz48Y2lyY2xlIGN4PSI1NjAiIGN5PSIzMDAiIHI9IjkwIiBmaWxsPSIjZmZmIi8+PGNpcmNsZSBjeD0iNTgzIiBjeT0iMzAwIiByPSI3NSIgZmlsbD0iI2VmMzM0MCIvPjxwb2x5Z29uIGZpbGw9IiNmZmYiIHBvaW50cz0iNjc1LjAsMjU1LjAgNjgyLjcsMjgxLjUgNzA2LjgsMjY4LjIgNjkzLjUsMjkyLjMgNzIwLjAsMzAwLjAgNjkzLjUsMzA3LjcgNzA2LjgsMzMxLjggNjgyLjcsMzE4LjUgNjc1LjAsMzQ1LjAgNjY3LjMsMzE4LjUgNjQzLjIsMzMxLjggNjU2LjUsMzA3LjcgNjMwLjAsMzAwLjAgNjU2LjUsMjkyLjMgNjQzLjIsMjY4LjIgNjY3LjMsMjgxLjUiLz48L3N2Zz4=';
FLAG_SVGS.BH = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAwIiBoZWlnaHQ9IjYwMCIgdmlld0JveD0iMCAwIDEwMDAgNjAwIj48cGF0aCBmaWxsPSIjY2UxMTI2IiBkPSJNMCAwaDEwMDB2NjAwSDB6Ii8+PHBhdGggZmlsbD0iI2ZmZiIgZD0iTTAgMGgyNTBsMTUwIDYwLTE1MCA2MCAxNTAgNjAtMTUwIDYwIDE1MCA2MC0xNTAgNjAgMTUwIDYwLTE1MCA2MCAxNTAgNjAtMTUwIDYwSDB6Ii8+PC9zdmc+';
var TRACK_NAT = { 0: 'MY', 10: 'CN', 3: 'JP', 11: 'PT', 12: 'CA', 2: 'MC', 13: 'ES', 14: 'AT', 6: 'GB', 5: 'NO', 7: 'AR', 15: 'NL', 16: 'IT', 17: 'AZ', 8: 'ID', 18: 'SG', 19: 'US', 4: 'MX', 1: 'BR', 20: 'US', 21: 'BH', 9: 'AU' };
var TRACK_NAT_NAME = { AZ: 'Azerbaijan', BH: 'Bahrain' };
function trackNat(ci) { return TRACK_NAT[ci] || null; }
function trackNatName(ci) { var c = trackNat(ci); return c ? (TRACK_NAT_NAME[c] || (typeof natName === 'function' ? natName(c) : c)) : ''; }
(function () {
  if (typeof flagSVG !== 'function') return;
  var f0 = flagSVG;
  flagSVG = function (seed, w) {
    var c = trackNat(seed); if (!c || !FLAG_SVGS[c]) return f0.apply(this, arguments);
    var W = w || 34, H = Math.round(W * 0.68);
    return '<img class="flag5 flag-real" src="' + FLAG_SVGS[c] + '" width="' + W + '" height="' + H + '" alt="' + esc(trackNatName(seed)) + ' flag" title="' + esc(trackNatName(seed)) + '">';
  };
})();
