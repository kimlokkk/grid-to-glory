'use strict';
/* ===== Radio variety (2.6.9): many more lines per moment, no line twice in a row, and the title call at the flag =====
   The race random numbers are never touched: the existing pick(RADIO.x) calls draw one number whatever the list length, so the lists can
   simply grow; fixed one-line calls are swapped afterwards with Math.random (flavour only). */
var RV_ADD = {
  start: ['Engineer: Lights out and away we go. Keep it clean into turn one.', 'Engineer: Green, green, green. Elbows out, brain on.', 'Engineer: Off we go. Long race, short memory.', 'Engineer: Lights out. Make the first lap count.', 'Engineer: We\'re racing. Remember: brakes are your friends.'],
  gain: ['Engineer: Got him. Lovely job, now build the gap.', 'Engineer: Beautiful. That\'s one more place in the bag.', 'Engineer: Textbook. The pit wall just stood up.', 'Engineer: Mega move. Keep the tyres happy now.', 'Engineer: Yes! Now don\'t look back, look forward.', 'Engineer: Clinical. Next target is already in range.'],
  lose: ['Engineer: Lost that one. Stay calm, the race is long.', 'Engineer: Okay, a place gone. Reset and go again.', 'Engineer: They had the tyres for that. Our turn will come.', 'Engineer: Don\'t fight the car. We\'ll get it back later.', 'Engineer: Annoying. Breathe, then attack.', 'Engineer: Let it go. Protect the tyres, the chance will come.'],
  tyre: ['Engineer: Tyres are on their last legs. Gentle on the exits.', 'Engineer: Rears are going. Short-shift out of the slow corners.', 'Engineer: Grip is dropping off. Manage it, don\'t fight it.', 'Engineer: Tyres are cooking. Ease off for a lap.'],
  lead: ['Engineer: Leading the race. Hit your marks, nothing fancy.', 'Engineer: P1. Smooth hands, clean laps.', 'Engineer: You\'re in front. Let the others make the mistakes.', 'Engineer: Lead\'s yours. Manage the gap and the tyres.'],
  idle: ['Engineer: Pace is good. Keep doing exactly that.', 'Engineer: Strong lap. The data looks lovely.', 'Engineer: All systems green. Keep it ticking.', 'Engineer: Rhythm is great. Stay out of trouble.', 'Engineer: Nice and tidy. Nothing to report, which is perfect.'],
  sc: ['Engineer: Safety car is out. Stay sharp, think about the stop.', 'Engineer: Safety car. Tyres warm, gap to the car ahead.', 'Engineer: SC deployed. Big moment for strategy.', 'Engineer: Safety car. Keep the temperatures up.'],
  dnf: ['Engineer: That\'s the end of our race. Bring it back if you can.', 'Engineer: We\'re out. Not your day, not our day.', 'Engineer: Retire the car. We\'ll go through everything tonight.', 'Engineer: Sorry, that\'s it. Head up, next one.'],
  slowpit: ['Engineer: Slow stop, sorry. We lost a couple of seconds there.', 'Engineer: Not our best stop. Push now, we can recover it.', 'Engineer: Problem on the right front. We\'ll fix it for next time.'],
  fastpit: ['Engineer: Rapid stop! The crew are flying today.', 'Engineer: What a stop. That\'s time gained right there.', 'Engineer: Superb work from the crew. Go, go!', 'Engineer: Lightning stop. Use it.']
};
var RV_LINES = {
  contact: ['Contact with {a}. Check the car feels okay.', 'We touched {a}. Any damage? Talk to me.', 'Contact with {a}. Front wing looks okay from here.', 'That was a bump with {a}. Keep going, we\'re watching the data.', 'Contact with {a}. Stay calm, the stewards will look at it.'],
  spin: ['You spun. Deep breath, carry on.', 'Spin! Get it pointing the right way and go.', 'Round you go. Tyres okay? Back on it.', 'We spun. No damage showing, rebuild the rhythm.', 'Spin. It happens. Forget it and focus on the next corner.'],
  vsc: ['VSC. Keep to the delta, no overtaking.', 'Virtual safety car. Stay above the delta.', 'VSC deployed. Keep the tyres warm, mind the delta.', 'VSC. Easy, keep the positive delta.'],
  restart: ['Safety car in this lap. Get ready for the restart!', 'Safety car is coming in. Tyres warm, be ready.', 'Restart this lap. Get a good run out of the last corner.', 'SC in this lap. Time to go racing again.'],
  dry: ['A dry line is appearing.', 'Track is drying. Slicks are close.', 'Dry line forming on the racing line.', 'It\'s drying out. Think about slicks.'],
  rain: ['Rain is starting. Easy on the throttle.', 'Rain coming down. Careful on the white lines.', 'It\'s raining. Gentle hands, gentle feet.', 'Drops on the visor? It\'s rain. Take care.'],
  pen: ['Stewards have given us a {sec}-second penalty for the contact with {a}. We serve it at the next stop. If we don\'t stop again it goes on our race time.', '{sec} seconds from the stewards for the contact with {a}. We take it at the next stop, or it goes on the race time.', 'Penalty: {sec} seconds for the incident with {a}. We\'ll serve it in the box.', 'Bad news, {sec}-second penalty for that one with {a}. Keep pushing, we\'ll serve it at the stop.'],
  penGrid: ['Stewards: that collision is a {places}-place grid drop at the next race.', 'We\'re out, and the stewards add a {places}-place grid drop for next time.', '{places}-place grid penalty for the next race. Not ideal.'],
  penVictim: ['Stewards: {b} gets {pen} for hitting us.', '{b} is penalised, {pen}. Justice.', 'The stewards agree: {pen} for {b}.', '{pen} for {b} for that contact. Keep your head down.'],
  penServe: ['Penalty served: we held you {sec} seconds in the box.', 'That\'s the {sec} seconds done. Clean slate.', 'Penalty served. Go get those places back.', '{sec} seconds served. Now we race.'],
  champ: ['WORLD CHAMPION! You are the world champion! Nobody can catch you now!', 'That\'s it! That\'s the title! You are the champion of the world!', 'You\'ve done it! Champion! The whole team is going crazy here!', 'Mathematically done! You are the world champion! Enjoy every second of this.'],
  champTeam: ['And that\'s the constructors\' title for the team too! Everyone in the factory thanks you!', 'Constructors\' champions as well! What a team, what a season!'],
  boxYes: ['“Box, box.”', '“Copy, boxing this lap.”', '“Understood, box.”', '“Bring me in.”', '“Okay, box box.”'],
  boxNo: ['“Negative, staying out.”', '“No, I\'ll stay out.”', '“Tyres are fine, staying out.”', '“Not yet. Give me two more laps.”', '“Staying out, trust me.”']
};
Object.keys(RV_ADD).forEach(function (k) { if (typeof RADIO !== 'undefined' && RADIO[k]) RV_ADD[k].forEach(function (l) { if (RADIO[k].indexOf(l) < 0) RADIO[k].push(l); }); });
var RV_LAST = {};
function rvSay(key, vars) {
  var L = RV_LINES[key] || [], last = RV_LAST[key], i = Math.floor(Math.random() * L.length); if (L.length > 1 && i === last) i = (i + 1 + Math.floor(Math.random() * (L.length - 1))) % L.length;
  RV_LAST[key] = i; var t = L[i] || '';
  return t.replace(/\{(\w+)\}/g, function (m, k) { return vars && vars[k] != null ? vars[k] : ''; });
}
/* a stable choice for a screen that is drawn many times (pit card) */
function rvStable(key, seed) { var L = RV_LINES[key] || []; return L.length ? L[Math.abs(seed) % L.length] : ''; }
(function () {
  if (typeof readLog !== 'function') return;
  var swap = [[/^Contact with (\w+)\. Front wing okay\? Okay\. Probably\.$/, 'contact'], [/^You spun\. Deep breath, carry on\.$/, 'spin'], [/^VSC\. Keep to the delta, no overtaking\.$/, 'vsc'], [/^Safety car in this lap\. Get ready for the restart!$/, 'restart'], [/^A dry line is appearing\.$/, 'dry'], [/^Rain is starting\. Easy on the throttle\.$/, 'rain']];
  var rl0 = readLog;
  readLog = function (R) {
    var n0 = (R.radio || []).length, out = rl0.apply(this, arguments);
    try {
      (R.radio || []).slice(n0).forEach(function (x) {
        swap.forEach(function (s) { var m = x.t.match(s[0]); if (m) x.t = rvSay(s[1], { a: m[1] }); });
        /* the same pooled line twice in a row: take another one from the pool */
        Object.keys(RADIO).forEach(function (k) { RADIO[k].forEach(function (l) { if (x.t.indexOf(l) >= 0) { if (RV_LAST['p:' + k] === l && RADIO[k].length > 1) { var o = RADIO[k].filter(function (z) { return z !== l; }); var nl = o[Math.floor(Math.random() * o.length)]; x.t = x.t.replace(l, nl); l = nl; } RV_LAST['p:' + k] = l; } }); });
      });
      /* at the flag: the title call */
      var p = R.p; if (p && p.fin && !R.rvChamp && typeof clinchWouldDecide === 'function') { R.rvChamp = true; var w = clinchWouldDecide(R); if (w.d) radio(R, rvSay('champ'), 'me', 1); if (w.c) radio(R, rvSay('champTeam'), 'me', 1); }
    } catch (e) { }
    return out;
  };
})();
