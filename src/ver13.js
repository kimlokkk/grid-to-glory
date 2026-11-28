/* App version and release notes; save format version is independent. */
var APEX = { ver: '2.6.9', date: '25 Nov 2026', save: 2 };
var CHANGELOG = [
  { v: '2.6.9', d: 'Stewards, team sponsors and real circuits', date: '28 Nov 2026', l: [
    "Stewards now judge every contact. A hopeful lunge is the attacker's fault: 5 seconds, or 10 when the other car lost real time. A fair attempt is a racing incident with no action. In testing about two in three contacts were racing incidents.",
    "Time penalties are served at the next pit stop: the car is held for the penalty before the crew works. If the car does not stop again, the time is added at the flag. A driver who caused a collision and retired gets a grid drop at the next race instead.",
    "Qualifying: holding someone up now has a cause. A hold-up that cost a driver three places or more is impeding, a 3-place grid drop for the race; a smaller one is a reprimand. A driver who causes a yellow flag loses the lap he was on.",
    "Penalty points: 1 or 2 for each offence, cleared after 22 races. 12 points is a one-race ban, for you too: a reserve drives your car, you score nothing, and the round is marked BAN in the calendar.",
    "Where to see it: during the race your engineer tells you on the radio when you get a penalty, when you serve it and when a rival is penalised for hitting you; the caption flashes and the timing tower shows the time still to serve (+5s) and then the penalty served. After the race: a Stewards' decisions panel, your penalty points on the Driver tab, the race log and the Story pack. In testing there were about 1.2 penalties a race across the grid.",
    "Team radio has far more to say: every common moment (overtakes, places lost, pace, tyres, safety cars, pit stops, retirements, penalties, spins, rain) now has several lines, and the same line never plays twice in a row. Your replies on the pit call card vary too.",
    "When your result decides the title, your engineer tells you on the radio as you cross the line.",
    "Titles are announced the moment they are decided. As soon as nobody can catch the leader any more (26 points a race for a driver, 44 for a team), the race result shows a champion banner, Home keeps it for the rest of the season, and the news and the Story pack record the round and how many races were left.",
    "Fixed personal sponsors stopping for good: a clash between two settings made your fame break after the first race, so brands stopped making offers whatever your results (it was not caused by turning offers down). Fame works again, offers come every season, and a save with a broken fame has it rebuilt from your career record when you load it.",
    "Team sponsors: every F1 team now has a title sponsor and three partners, each with its own contract, a target place in the constructors' and bonuses for podiums and wins. Sponsors renew when the team meets the target and may walk away when it falls far short. The Team tab and the team dossier show the Partners panel.",
    "Money now follows standing more: the richest teams earn about twice what the poorest do (it was about 1.5 times). The cost cap still limits what a rich team can spend.",
    "Naming rights: a smaller team can sell its name, so the title sponsor goes on the car (for example 'Coral Alpenwerk Racing'). Heritage teams keep their own name. The archive and records always use the team's own name.",
    "Driver backing: some drivers bring personal money to the team they race for. You do too: half of what your personal sponsors pay is backing for your team, so building fame makes F1 teams keener to sign you. Teams also count a driver's backing when they choose who to sign.",
    "Prestige now follows results: a team's prestige moves towards its constructors' places over the last three seasons, plus a little for titles. The old dynasty penalty (a hidden handicap for teams that kept winning) is gone.",
    "Wind tunnel allowance (ATR), as in real F1: the constructors' leader gets 70% of the testing time and the last team 115%, in equal steps. It is set from last season's final order, reset at mid-season, and the winter car is built with the final order. Upgrades for the leader gain about 45% less than average, the last team's about 45% more. The R&D workshop on the Team tab shows your allowance; the dossier and the Story pack show every team's.",
    "Why: without the old penalty and with money following results, the top teams were locking in (in testing only 7% of bottom-half teams reached the top 3 within five seasons). With the allowance it is 28%, a small team wins the title within five seasons 9% of the time, and the champion repeats 41% of the time (52% without it). A top team with a strong principal and director still stays in the top 3 three seasons in four; a badly led one about half the time.",
    "Fixed giant upgrades: one package could add +25 to +36 to a part (aero 56 to 93 at once). Small and normal upgrades are unchanged; a single in-season package now tops out at about +14, a winter package at +30, so small teams climb over two or three seasons instead of jumping in one race.",
    "New look in the style of F1 TV graphics for the wind tunnel allowance, the team's Partners panel (car, title partner, partners in a timing-tower list, contract and target lights) and your personal sponsors (fame level, fame ladder, deal targets as progress pips, the backing you bring to your team).",
    "Story pack goes deeper without getting huge: every race now adds the race pace of every driver (median clean lap, so you can see who was really fast), a lap chart at five points of the race, your race lap by lap (time, place, gap to the cars ahead and behind, tyre and its age), your main battle, and who decided each of your pit stops: the engineer's call that you accepted, changed or turned down, your own press of the pit button, or the team when you were not asked. About 1.3 KB a race in the save; the whole-season pack shows your stints instead of every lap.",
    "Circuit maps are now the real tracks each circuit is modelled on, from GPS data: Velocera is Monza, Hanabi is Suzuka, Monte Albrecht is Monaco, Senja Marina is Marina Bay, and so on, in the real racing direction from the start line. Cars on the live race map follow the real line.",
    "Circuit characters follow the real venues too: length, tyre wear, how hard it is to pass, power or downforce, and rain. Velocera (Monza) is now the biggest power track, Monte Albrecht and Senja Marina need the most downforce, Seri Mutiara (Losail) and the desert and Las Vegas races almost never see rain, Cempaka Raya and Costa Vermelha see the most. Laps were adjusted with the length, so race distances stay as before; pit stop losses are unchanged. Some circuit descriptions were rewritten to match. Your existing career keeps its circuit history and track mastery; lap records set before this version are converted once to the new circuit lengths so they stay fair to beat.",
    "Overtaking happens at the real corners: each circuit's three overtaking zones are now its first braking corner, its tightest corner (a hairpin when it is one) and its strongest chicane, and the race map labels them where they are. In testing about 10% more clean passes a race (43 to 47), and the same number of stewards' penalties.",
    "Circuits now fly real flags: each fictional circuit is modelled on a real venue, and it shows the flag of that host country (Cempaka Raya: Malaysia, Senja Marina: Singapore, Monte Albrecht: Monaco and so on). The Story pack names the country too.",
    "Existing careers: the new circuits, flags and circuit characters apply at once; stewards, team sponsors and the wind tunnel allowance start now if no race of this season has been run, otherwise from the next season. Your circuit history, track mastery, archive and records are kept. Exporting a backup of your save before updating is always a good idea."
  ] },
  { v: '2.6.8', d: 'Power units, and reliability shown apart', date: '28 Nov 2026', l: [
    "Every F1 driver now has 4 power units a season. Before each race you choose which one to run on the qualifying page, with your engineer's suggestion: fresh units for engine-heavy tracks, worn ones where the engine matters less. A 5th or later unit is a 10-place grid drop after qualifying.",
    "Wear costs race pace (never qualifying) and raises the failure chance. Almost nothing below 50% wear, about 0.05 s a lap at 60%, 0.15 s at 80% and 0.3 s at 100%, more on engine-heavy tracks. A failed unit is lost for the season.",
    "Reliability decides how long a unit lasts (about 5.5 races at reliability 75) and how often it breaks. In testing, teams with reliability under 70 took a penalty in half of their seasons, teams above 80 in about 1 in 20. Overall failure rates stay about as before.",
    "Car pace is now shown apart from reliability: Team HQ, the car pace ladder, contract offers, the Paddock and the Story pack rank cars on aero, engine and chassis, with reliability listed on its own.",
    "Existing careers: a save with no race played this season switches at once, otherwise from the next season. Story pack: your power units, the unit you ran each race and every grid penalty.",
    "The power unit choice is a Power unit bay on the qualifying page: one tile per unit with a health gauge, the pace it will cost by the flag at this track, the engineer's pick and your season allocation; grid penalties show as a stewards' panel on the strategy page.",
    "Engine health on the Team tab and in every team's Paddock dossier (Performance): both drivers' units with health gauges, failures, units used and penalties.",
    "The strategy page now opens with a Track profile: the circuit's character, tyre wear, overtaking, engine importance and rain with level bars, a race plan tip and the track's history in your series. The circuit guide uses the same wording as the chips everywhere."
  ] },
  { v: '2.6.7', d: 'Story pack track fix', date: '25 Nov 2026', l: [
    "Fixed the Story pack describing overtaking the wrong way round: a track that is hard to pass on (such as the Monte Albrecht street circuit) was called easy. Overtaking, tyre wear and engine importance now use exactly the same bands as the circuit chips in the game, and the overtaking difficulty value is shown."
  ] },
  { v: '2.6.6', d: 'Fewer spins, and consistency matters', date: '25 Nov 2026', l: [
    "Unforced spins were far too common and barely depended on the driver: in testing every driver spun about 9 times a season, a consistency-90 driver almost as often as a consistency-75 one. The base chance is now much lower and consistency counts for much more: about 1 spin a season at consistency 90, 2 to 3 at 75 and 4 to 5 at 60.",
    "Pushing, overheated or worn tyres, rain and the first lap still raise the risk as before; they start from a lower base.",
    "Knock-on effects measured over 132 races: crash retirements fall from 1.2 to 0.5 a race, safety cars from 1.2 to 1.0 and virtual safety cars from 1.6 to 0.7 a race; mechanical failures are unchanged."
  ] },
  { v: '2.6.5', d: 'Weekend hold, track data and honest winter news', date: '25 Nov 2026', l: [
    "Leaving a race weekend during qualifying or on the strategy page still takes you Home, and Start weekend now continues exactly where you left it, even after closing the game. Before, qualifying started again with a new result, so a bad grid could be re-rolled. Leaving during the race still finishes the race for you, as before.",
    "The winter upgrade story now says what your team gained on the rest of the field, not the raw number before every team's winter work is counted.",
    "Story pack: every free principal and technical director in the pool is listed with rating, age and asking salary (before, only the best six of each).",
    "Story pack: every race now describes the track (length, power or downforce, tyre wear, overtaking, rain chance, pit loss), its history in your series (recent winners, poles, most wins, lap record), your record and mastery there, and a new NEXT RACE section previews the coming round.",
    "Circuit history keeps each series apart, so a win in F2 at a track no longer counts in its F1 history."
  ] },
  { v: '2.6.4', d: 'Shorter export code', date: '25 Nov 2026', l: [
    "Export save codes are now compressed: about 7 times shorter (a career of 8 seasons goes from about 1.7 million characters to about 230 thousand), with nothing left out. The Export screen says how much shorter the code is.",
    "Old codes still import, and line breaks or spaces picked up while copying are ignored. A browser too old to compress keeps the old format."
  ] },
  { v: '2.6.3', d: 'Archive for every series, records per league', date: '25 Nov 2026', l: [
    "The Archive now has F1, F2 and F3 side by side. Every finished season of every series is on file, with champions and final standings, whether you raced in it or not. Race-by-race results are kept for the series you race in.",
    "Your records are kept per league and never added together: the profile shows a table for F1, F2 and F3 (seasons, titles, wins, podiums, best finish), and the overview counts only the series you race in now. The Story pack gives the career per league too.",
    "Fixed the profile's league history showing extra \"Legacy\" rows: every season appeared twice because the season record did not say which league it was. Old saves are read from your season records, so no row is lost.",
    "A new car concept takes half from the technical director who worked on it through the season before the change and half from the one in charge after the winter market, so signing a strong director a year early pays off.",
    "Calendar: the round strip on a phone now breaks into two even rows, so round numbers 10 to 22 no longer split across two lines."
  ] },
  { v: '2.6.2', d: 'Reg Report and story pack: who built the new car', date: '25 Nov 2026', l: [
    "The Reg Report now splits each team's move into old-rules exposure, leadership (director, principal, preparation, staff and money), catch-up for the slowest, concept luck and winter development, and records who led each team at the change.",
    "Reasons name the real source: for example \"Head start from starting the new car in time and the director's concept\" or \"Started behind: a weak director's concept\". The old \"Champion handicap\" reason no longer appears, because there is no handicap any more.",
    "Story pack: when a change is announced it lists every team's director, principal, whether the new car was started in time, staff, R&D money and the expected head start; after the change each team line shows its leadership and luck."
  ] },
  { v: '2.6.1', d: 'Regulations: the new car comes from the people', date: '25 Nov 2026', l: [
    "A major change no longer drags the champion down by rule. The new car now comes from the team: a strong technical director builds a better concept, a principal who started the new car in time gains, technical staff make it reliable and money pays for the programme. Luck still plays a part, more so with a weak director. In testing, a champion with a strong principal and director stayed in the top three about half the time, and almost never before.",
    "A minor change is now different in kind: it targets one or two areas (aero most often, then chassis, then engine) and reworks about 75% of those, the rest of the car carries over. A major change rebuilds about 70% of every car. Regulation Watch, the news and the Reg Report name the areas.",
    "The slowest team still gets some help on a major change, and more of it when it already has a good director or prepared in time, so a well-run underdog can jump up the order. In testing the slowest team reached the top half about a third of the time.",
    "Applies from the next regulation change in careers with Leadership. Classic and junior series are unchanged."
  ] },
  { v: '2.6.0', d: 'Leadership', date: '25 Nov 2026', l: [
    "Technical directors now keep their quality. Until now a team's director quality was redrawn at random every winter whoever the person was, so the name on the door meant nothing. A director is now a real person with a rating (0 to 100) that moves only a little each year, so a strong one stays strong and a weak one stays weak, on any team.",
    "The principal decides, the director advises. Every upgrade decision is right with a chance that depends on both ratings and on how well the drivers explain the car. A weak principal is wrong more often, but in a believable way: he mixes up two parts that are close, he never pours a package into a part that is already maxed. He also leans on the director more, and when he overrules a director who was right, the better part loses out. Look for \"Right calls\" on a team's profile (Performance tab) and for stories like \"X overrules Y\". A director who is overruled too often can walk out.",
    "A good director builds better and fails less, by chance. A strong one has a much better chance of a hit package and a lower chance of a failed one; a weak one the reverse. Nothing is guaranteed, so a weak director can still land a good package.",
    "The principal runs the programme: he decides what to build, when to bring it, when to give up on a lost season and when to prepare for new rules next year, and a good one gets these right far more often than a weak one. He also judges which director to hire and which drivers to sign, and a weak principal can misjudge both and overpay for drivers; a good one negotiates better deals. You, as a driver, no longer pick the R&D focus: the Team tab now shows what the pit wall has decided.",
    "A real staff market. Directors and principals have asking salaries, and they choose the best offer on pay, team prestige, how competitive the car is and loyalty. Pay comes out of the team's budget, so the best director is a real trade-off. Rich teams still land more of them, but for a reason. A team can buy a director out of his contract for a fee; look for the stories.",
    "Driver feedback now matters for every team, not only yours. Better feedback gives bigger and faster upgrades with fewer failures, and a bad weekend setup costs less. It is worth about a third of the same amount of pace, so pace still comes first.",
    "Driver pay no longer comes out of the upgrade budget. Each principal sets a separate driver budget and cannot sign a driver the team cannot afford, so the choice is who is worth the wage.",
    "Development now runs through the whole season. Prize money and sponsor bonuses are paid race by race on the live standings, so a team that climbs can afford more upgrades, and packages cost less per upgrade so the budget lasts the year. Teams that shelve a lost season early now get a clearly bigger step over the winter. Upgrades are bigger and more frequent in-season, and the director now matters more than the principal or the staff for how good a package is, so teams move up and down the order during a season and not only at the winter or a rule change (in simulation about a quarter of teams now move two or more places in a season, up from a few percent).",
    "Principals and directors are now people, like drivers: nationality, age, rating, potential, contract and a career record. They grow towards a peak, slowly decline and retire, and a new generation of young principals and directors arrives every winter.",
    "A free-agent pool: people without a job stay available, get older and can be hired in any winter. A principal can let a director go for a clearly better free agent (the team pays half of the rest of the contract), and a sacked principal goes into the pool while the team hires a successor from it. You stay a driver: the team makes every hiring and firing decision.",
    "New screens: every principal and director has a dossier in the Paddock (portrait, rating, upgrade odds or judgement, rating over time, career and contract). The Paddock (Season, World) has a Staff tab with a card for everyone, free agents included, and the winter recap shows the best free agents.",
    "Story pack: each team's principal and director are described as people, and a new section lists the winter moves, firings, retirements and the best free agents.",
    "Existing careers switch over without anyone changing strength. A save with nothing played yet this season switches straight away; a save part-way through a season finishes it as before and switches at the start of the next season."
  ] },
  { v: '2.5.6', d: 'Technical director rating', date: '23 Nov 2026', l: [
    "Technical director ratings now use the same 0 to 100 scale as technical staff. Before, a director at the weak end of the market showed Rating 0 and a strong one 100, which made small differences look huge and the weakest look useless. A typical weak director now reads about 25 and a strong one about 75. Their real effect on car development has not changed.",
    "Shown on the team profile, the Paddock panel and the Story pack."
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
