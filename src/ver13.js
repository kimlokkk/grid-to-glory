/* App version and release notes; save format version is independent. */
var APEX = { ver: '2.6.0', date: '19 Nov 2026', save: 2 };
var CHANGELOG = [
  { v: '2.6.0', d: 'Leadership', date: '23 Nov 2026', l: [
    "Technical directors now keep their quality. Until now a team's director quality was redrawn at random every winter whoever the person was, so the name on the door meant nothing. A director is now a real person with a rating (0 to 100) that moves only a little each year, so a strong one stays strong and a weak one stays weak, on any team.",
    "The principal decides, the director advises. Every upgrade decision is right with a chance that depends on both ratings and on how well the drivers explain the car. A weak principal is wrong more often, but in a believable way: he mixes up two parts that are close, he never pours a package into a part that is already maxed. He also leans on the director more, and when he overrules a director who was right, the better part loses out. Look for \"Right calls\" on a team's profile (Performance tab) and for stories like \"X overrules Y\". A director who is overruled too often can walk out.",
    "A good director builds better and fails less, by chance. A strong one has a much better chance of a hit package and a lower chance of a failed one; a weak one the reverse. Nothing is guaranteed, so a weak director can still land a good package.",
    "The principal runs the programme: he decides what to build, when to bring it, when to give up on a lost season and when to prepare for new rules next year, and a good one gets these right far more often than a weak one. He also judges which director to hire and which drivers to sign, and a weak principal can misjudge both and overpay for drivers; a good one negotiates better deals. You, as a driver, no longer pick the R&D focus: the Team tab now shows what the pit wall has decided.",
    "A real staff market. Directors and principals have asking salaries, and they choose the best offer on pay, team prestige, how competitive the car is and loyalty. Pay comes out of the team's budget, so the best director is a real trade-off. Rich teams still land more of them, but for a reason. A team can buy a director out of his contract for a fee; look for the stories.",
    "Driver feedback now helps every team, not only yours. The two drivers' feedback sets how well the team's upgrades work (better advice, fewer failed packages). Your own team keeps a similar gain overall.",
    "Development now runs through the whole season. Prize money and sponsor bonuses are paid race by race on the live standings, so a team that climbs can afford more upgrades, and packages cost less per upgrade so the budget lasts the year. Teams that shelve a lost season early now get a clearly bigger step over the winter. Upgrades are bigger and more frequent in-season, and the director now matters more than the principal or the staff for how good a package is, so teams move up and down the order during a season and not only at the winter or a rule change (in simulation about a quarter of teams now move two or more places in a season, up from a few percent).",
    "Existing careers switch over without anyone changing strength. A save with nothing played yet this season switches straight away; a save part-way through a season finishes it as before and switches at the start of the next season."
  ] },
  { v: '2.5.7', d: 'Technical director rating', date: '23 Nov 2026', l: [
    "Technical director ratings now use the same 0 to 100 scale as technical staff. Before, a director at the weak end of the market showed Rating 0 and a strong one 100, which made small differences look huge and the weakest look useless. A typical weak director now reads about 25 and a strong one about 75. Their real effect on car development has not changed.",
    "Shown on the team profile, the Paddock panel and the Story pack."
  ] },
  { v: '2.5.6', d: 'Training XP clarity', date: '22 Nov 2026', l: [
    "Pro careers: training sessions that use XP (Simulator, Racecraft, Wet, Technical) buy a skill point automatically each weekend when you can afford one. This was easy to miss and made XP look like it was not adding up. It is now shown on the weekend Focus card (\"Training bought Consistency +1 for 7 XP\") and in Driver, Training.",
    "New XP use setting in Driver, Training: Buy skills with XP (the old behaviour, still the default) or Keep my XP. Keep my XP saves everything you earn so you can spend it yourself in the skill shop. Preparation and Focus still build either way."
  ] },
  { v: '2.5.5', d: 'Story pack tyre fix', date: '22 Nov 2026', l: [
    "Fixed the Story pack showing the starting tyre wrongly. It repeated the finishing tyre, so a driver who started on Medium and stopped for Hard looked like Hard to Hard. The pack now reads the real starting tyre from the race.",
    "Races recorded with the wrong starting tyre cannot be repaired. They now say \"starting tyre not recorded\" and still list every stop and the tyre fitted, which were always correct. Races you play from now on are exact."
  ] },
  { v: '2.5.4', d: 'Race log positions', date: '22 Nov 2026', l: [
    "Story pack race log now says where everyone was: \"CAS passes MAT for P16 (from P17)\", \"CAS spins from P5, rejoins P17 (lost 12)\", \"RUG pits for Soft tyres, 6.3s lost, from P2, rejoins P4 (lost 2)\", \"HAR retires from P20: Mechanical failure\", and the positions of the two cars in a contact.",
    "Rejoin positions are taken as soon as the car is moving again after a spin or a stop, so the places lost are real and not an estimate. Races you already played keep the older log without positions."
  ] },
  { v: '2.5.3', d: 'Story pack detail', date: '22 Nov 2026', l: [
    "Story pack now records the full qualifying: every car's time in Q1, Q2 and Q3 with gaps, who was knocked out in Q1 and Q2, and the final grid.",
    "Every driver's tyre story in the race result: the tyre they started on, each stop with its lap, the tyre fitted and the time lost, and the tyre they finished on. The race log now says which tyre each stop fitted (\"HAL pits for Hard tyres, 7.8s lost (undercut)\").",
    "Races you already played keep the older, shorter format (final order and finish tyre only); the new detail is recorded from your next race."
  ] },
  { v: '2.5.2', d: 'Save space fix', date: '20 Nov 2026', l: [
    "Fixed \"Could not save: browser storage is full\" on phones. A career grows by about 150 KB every season and iPhone browsers only allow a few megabytes, so long careers ran out of room.",
    "Saves are now compressed about six times smaller, and every compressed save is checked before it is trusted. Your existing save is converted automatically the next time the game saves, and old saves still load.",
    "If the browser still refuses, the game now clears old race detail and old news and tries again before it warns you. The warning also tells you to export a backup and to avoid private browsing."
  ] },
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
