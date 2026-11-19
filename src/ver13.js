/* App version and release notes; save format version is independent. */
var APEX = { ver: '2.5.1', date: '19 Nov 2026', save: 2 };
var CHANGELOG = [
  { v: '2.5.1', d: 'New app icon', date: '19 Nov 2026', l: [
    "Grid to Glory has a logo: a double G in gold and white with the GRID TO GLORY wordmark, in the game's navy and gold. It shows in the browser tab, in bookmarks and as the icon when you add the game to your phone's home screen.",
    "The tab icon uses just the double G so it stays readable at 16 pixels; the home screen icon carries the full logo with the wordmark."
  ] },
  { v: '2.5.0', d: 'Archive', date: '19 Nov 2026', l: [
    "New Archive page in Season, with three views. Champions lists the drivers' and constructors' champion of every season. Seasons opens the final standings for any season: every driver's wins, poles and points, the constructors' table and a race-by-race list of winners and pole sitters. Records shows the all-time leaders for titles, wins, podiums, poles and fastest laps, team titles and wins, and the best single seasons.",
    "From now on every finished season is archived in full, including each driver's rating at season end. Seasons you already played are rebuilt from the race results, standings and champions the game kept, and are marked Race results, Standings only or Champions only so you can see how complete they are.",
    "Driver rating graphs now record every season in Pro careers too. Before this they only showed the first season and now. Ratings from earlier seasons were not kept and cannot be recovered, so the graph grows from this season onwards."
  ] },
  { v: '2.4.1', d: 'Contract outlook', date: '19 Nov 2026', l: [
    "Every F1 contract offer now carries a Team outlook card: car-pace rank with the team's place in the field, a graph of its car power race by race against the grid average, trend since winter, money status, exposure to announced regulation changes and the board target, with quick tags like Rising, Falling or Gains from new rules.",
    "The graph starts filling from your next race, so older saves show it after a few rounds. Cars are rebuilt every winter, so treat the outlook as a guide and not a promise."
  ] },
  { v: '2.4.0', d: 'Garage Watch', date: '19 Nov 2026', l: [
    "New Regs page in Season and a Home banner: Regulation Watch tells you what is coming, one season ahead, for major and minor changes alike, with a rough exposure read for every team (Exposed, Watch, Steady, Upside, Clean sheet) plus title leader, slowest car, well prepared and stretched tags.",
    "Minor technical updates are now announced a season early and have their own news, separate from the big rebuilds. Major changes get a louder breaking-news warning.",
    "After a change you get a Reg Report: every team's place before and after, and why. Each move is split into exposure to the old rules, title and catch-up balancing, concept luck and winter development, with a before-and-after slope chart.",
    "Behind-the-garage stories every few rounds, built from real team state: development watch, focus for the new rules and budget pressure. Filter them with the new Garage category in Paddock Wire.",
    "Story pack gains a Regulations section with the watch state and latest Reg Report."
  ] },
  { v: '2.3.0', d: 'Pit wall and story pack', date: '19 Nov 2026', l: [
    "Pit stops play out at the right moment: choose your tyres from an engineer call or the BOX button and the race keeps running. The pit-stop challenge now opens as your car reaches the pit entry, and its result sets your stop time.",
    "A queued pit call can be cancelled at any point until the pit-stop challenge starts. Mini-games off or Fast playback keep the quick automatic stop.",
    "Contract sheets are tidier: the offer document keeps its normal padding and the signature and Valid until fields fit small phones.",
    "New Story pack: copy your season as plain text, with the cars, teams, staff, drivers, news, full qualifying and race results and the race log. Choose the latest race, the last five races or the whole season, then Copy or Download. Find it on the race result screen, the season review and Save data in the main menu.",
    "Qualifying times, tyres and stops, race logs and key radio are now recorded for each new race and kept for the current and previous season. Earlier races still show their full results and grid."
  ] },
  { v: '2.2.0', d: 'The paddock update', date: '15 Nov 2026', l: [
    "New cartoon garage main menu with your team’s SVG livery, saved driver, league, championship standing and next race. Continue Career takes centre stage; Save Data and Hall of Fame remain one tap away.",
    "Create Driver is now a four-step studio: live identity preview, race number picker, driving style cards, helmet designs, colours and visor, team garages and contract review. Phone players get a pinned helmet preview while editing.",
    "Review your real funding package, academy support and exact contract amounts before signing. Existing-career backup and replacement confirmation remain available in setup.",
    "Home becomes the Race Day Paddock: next-race hero and forecast, driver licence, championship timing tower, missions, Road to F1, rival poster and a lights-out weekend introduction.",
    "Season gets a race calendar map, podium standings, event result cards and a trophy cabinet.",
    "Pro Driver Garage adds an Overall radar, XP skill shop, tier ladder, ability slots, circuit collection and training rings.",
    "Team Garage brings team-liveried cars, an F1 car blueprint and R&D workshop, finances and facilities, pit wall, pace comparison, line-up, teammate battle, contracts and history. Junior teams show their crew and seat support.",
    "Career becomes the Driver’s Office with contract and inbox cards, wallet flow, fame, sponsors, scouting and academy status. Market offers and contract documents compare your current seat with the proposed deal.",
    "Season-end review adds a champion celebration, podium, constructors comparison, objective verdicts, sponsor reactions and market choices, with detailed driver records still available.",
    "Qualifying adds session progress, run-plan cards, verdicts, a clearer timing tower and staggered final-grid slots. Strategy shows stint timelines, planned pit laps, rain forecast bands, tyre choices and a clear To the Grid action.",
    "Race cockpit polish: real circuit layouts with team-coloured dots, readable battles, steering-wheel tyre/fuel/energy dials, rival tyre compound and age, OT and BOX controls and position celebrations. Live weather and forecast details are available from the race screen.",
    "BOX flow repaired: select your tyre, explicitly confirm the stop, or return to the race without queuing it. Cancelling a queued stop clears the pit request and avoids an unwanted pit mini-game. Resource warnings stay on the steering screen; the extra warning bar is removed.",
    "Mini-games gain larger game scenes and clear touch controls. Cartoon artwork covers the start grid, pit lane and driving challenges, with team SVG liveries kept on the cars. Overtake and cover scenes use track and radar views.",
    "After-race results add winner, podium, points, recovery and retirement presentations, rewards, race highlights and full classification access, followed by the existing press conference and news flow.",
    "Season News becomes Paddock Wire with feature stories and article views. World browsing and driver/team profiles gain clearer cards, league navigation, stats and team liveries.",
    "Phone and desktop layouts refined throughout the redesigned screens. Existing career saves, race rules, mini-game timing and scoring remain supported without a new save format."
  ] },
  { v: '2.1.0', d: 'Playtest build', date: '10 Nov 2026', l: [
    "Talent, XP and ageing rebalanced: a typical driver reaches ~80 at 20, ~86 at 25 and ~90 at 30.",
    "Regulation changes now reshuffle the grid: dynasties fall, prestige drifts and back-to-back champions are handicapped.",
    "Team operations and five team characters; 12 hard abilities plus junior basic abilities.",
    "Academy membership is a home: seat routes through the academy, release fee to leave, interest from 4 to 8 teams, protected seats never cost more than you hold."
  ] },
  { v: '2.0.0', d: 'Major career update', date: '9 Nov 2026', l: [
    "Start a Pro career at 16 in F3, earn promotion to F2 and qualify for an F1 debut. Choose your driver identity, helmet, archetype and funding background.",
    "Race a fixed 22-round F1 calendar with fictional GTG circuits, unique maps, profiles and strategy guides. Junior seasons use an eight-round calendar.",
    "A living F3, F2 and F1 world: ten teams per league, 30 F3 seats, 20 F2/F1 seats, driver regeneration and car development. Junior cars share a specification within their league.",
    "Scout Watch, performance-based offers, academy invitations or Express Interest, funded seat packages, permanent F1 licence eligibility and champion promotion routes.",
    "Six-stat Overall, XP-funded training, Fitness, Recovery, race-day Focus, annual ageing previews, car-relative performance assessment, H2H and tiers.",
    "Abilities, mastery, loadouts and bounded Cap Breaker growth. Mechanical DNFs are excluded from driving-performance penalties.",
    "Separate Tyres, Fuel and Energy controls with engineer Auto/Manual, meaningful resource trade-offs and optional engineer advice.",
    "Guided, Casual and Expert assistance, practice tutorials and Highlights playback alongside live viewing and Fast.",
    "F1 contract progression, one comeback opportunity after losing a seat, optional retirement from 38, a final racing season at 44 and retirement at 45. Hall of Fame records and a next-career legacy.",
    "Race consistency fixes across forecasts, strategy, HUD/results, pits, spins, press conferences and news.",
    "Fully English UI, five main menus, small-phone and desktop polish, enhanced team cards and supplied SVG country flags.",
    "Existing saves and Classic careers remain supported. Export/import and Hall of Fame backups help preserve progress."] },
  { v: '1.0.0', d: 'Launch', date: '2 Nov 2026', l: [
    'Full career mode: create a driver, race 10 rounds a season, grow your skills with XP and chase the title.',
    'Qualifying, pit stops, tyres, weather, safety cars and the mini-games, with auto-run if you just want to watch.',
    'Living grid: AI teams develop their cars, run budgets, change plans, sign and sack drivers.',
    'Contracts, offers, buyouts, reputation, sponsors, fame and press conferences.',
    'Teammate rapport and team orders. A reserve year if you lose your seat.',
    'Facilities, engine alliances, team loans and young driver tests.',
    'Final-race radio, end-of-season radio and a full Season review.',
    'Circuit history for every track, plus a career that ages: skills fade after 31, retirement at 42.'] }
];
/* nombor versi save: tambah langkah migrasi di sini bila format berubah */
function verMigrate(o) {
  if (o.saveVer > APEX.save) throw new Error('This save requires a newer game build');
  foundationInit(o);
  if (o.meta.rng != null) seedRnd(o.meta.rng);
  o.saveVer = APEX.save; o.appVer = APEX.ver;
  return o;
}
function chlogHTML() {
  return '<div class="stack"><h3>What\'s new</h3>' + CHANGELOG.map(function (c) {
    return '<div><div class="row sp"><b>v' + c.v + '</b><span class="mono dim">' + c.d + ' · ' + (c.date || APEX.date) + '</span></div><ul style="margin:6px 0 0;padding-left:18px">' + c.l.map(function (x) { return '<li class="dim" style="font-size:13px;margin:3px 0">' + esc(x) + '</li>'; }).join('') + '</ul></div>';
  }).join('') + '<button class="btn" data-act="mclose">Close</button></div>';
}
if (typeof A !== 'undefined') A['chlog'] = function () { showModal(chlogHTML()); };
