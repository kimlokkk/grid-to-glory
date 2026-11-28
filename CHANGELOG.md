# Changelog

Note: the training XP clarity build (Keep my XP setting) was tested on the dev branch only and closed on 28 November 2026; it is not part of any release.

## 2.6.9 — 28 November 2026 (stewards)

- `src/stew52.js`, gate `S.stew`. Contact: `attemptPass` wrapper reads the pass chance `p` of the failed move; `p < 0.02` = 10 s, `< 0.08` = 5 s, else racing incident; up one step when the other car lost 2 s or more or the attacker retired; a retired attacker gets a 3 or 5-place drop at the next race. Served in the pit stop (`stewServe`, the car is held), else added at the flag (`stewFinish`, in `runRace2`, the live race and settle). Qualifying (`qkSession` hooks): traffic loss is recorded per run; a hold-up of 0.5 s or more that cost 3+ places is impeding (3-place drop, 1 point), smaller is a reprimand; one yellow-flag incident per session, half of them a driver error (culprit loses his better run). Culprits come from a hash, no extra race random numbers. Points: 5 s = 1, 10 s or grid = 2, impeding = 1; window 22 races; 12 = ban, points cleared. Ban: a reserve clone takes the seat before qualifying (`stewSwapIn`), the original is put back after `finishRace`; the player's round is run automatically (`S.sit` for that race) and recorded as BAN.
- Measured (8 seeds x 3 seasons, 528 races): 2.9 contacts a race, 2.0 racing incidents; time penalties 0.73 (0.54 served in a stop, 0.15 added at the flag), grid drops after a crash 0.14, impeding 0.35, reprimands 0.74, yellow lap deletions 1.33 a qualifying; 1.22 penalties a race; no bans in 24 seasons (12 points within 22 races is hard to reach, as in F1).
- Screens: Stewards' decisions fold on the result, penalty points card on the Driver tab, ban screen, BAN in the calendar, story pack lines. Live race: `readLog` wrapper turns `pen` / `penserve` log entries into the engineer's radio and the caption; the timing tower shows `+Ns` to serve and `Ns ✓` once served; the stored race log (story pack) keeps both kinds. Test: `qa/stew.js`.
- Radio variety (`src/radio54.js`): the `RADIO` pools grow from 2-3 to 6-9 lines (the existing `pick` calls draw one random number whatever the length, so the race random numbers are unchanged); fixed one-line calls (contact, spin, VSC, restart, rain, dry) are swapped after `readLog` with `Math.random` lines; no line twice in a row; pit card replies vary by a stable hash; penalty lines and the title call at the flag (`clinchWouldDecide`).
- Fixed: `export45.js` declared `var SP` (story pack settings) and overwrote `SP` from `spon12.js` (sponsor settings), so `SP.decay` was undefined, fame became NaN after the first race (saved as null) and `sponNew` made no offers. Story pack settings renamed `SPK`; `fameRepair` in `migrate` rebuilds fame from the career record (long-run level of the same results) and makes offers at round 0. Test: `qa/fame.js`.
- Title clinched (`src/clinch53.js`): after each race the drivers' title is decided when the lead is bigger than 26 x races left, the constructors' when bigger than 44 x races left; banner on the result and Home, news, story pack line. A save that has already passed that point shows it after its next race. Test: `qa/clinch.js`.

## 2.6.8 — 28 November 2026 (power units, reliability shown apart)

- `src/pu50.js`: pool of 4 units per driver per season (`S.pu.d[uid]`), planner `puPlan` (least worn at pw >= 0.55, most worn healthy at pw <= 0.4, fit a free unit at power tracks when only used ones are left, no unit past 115%), `puBefore` in `makeRace2` (choice, 10-place drop capped at 15), `puAttach`, pace `puLoss` in `paceFree` (race only), failure `puFail` in `incidents`, `puCommit` in `finishRace` (idempotent per round, DNF counts half, mechanical failure marks the unit). Player choice on the qualifying page (`pu-pick`), penalties on the strategy page, news, story pack. Gate `S.pu` (round 0 now, else next season).
- Measured (8 seeds x 3 seasons, 10,560 car-races): penalties per season by reliability under 70: 0.57 (50% of seasons), 70-79: 0.15, 80-89: 0.06, 90+: 0.05; mechanical failures 0.047 per car-race (0.043 without units); end-of-race pace cost mean 0.08 s, 90th percentile 0.24 s.
- `teamPace` / `teamPaceRank` / `teamRelRank` for screens (Team HQ, pace ladder, offers, Paddock sort, outlook, story pack); AI keeps `teamPower`.
- Test: `qa/pu.js`.

## 2.6.7 — 25 November 2026 (story pack track fix)

- `spTrack` read `c.ot` as ease; it is difficulty (the engine subtracts it from the pass score, fewer zones above 0.85). Bands now copy `circuitChips`: overtaking < 0.5 easy, < 0.7 medium, else hard; tyre wear < 0.95 low, < 1.15 medium, else high; engine >= 0.55 power, <= 0.4 downforce. Test in `qa/records.js`.

## 2.6.6 — 25 November 2026 (fewer spins, consistency matters)

- `incidents()` mistake chance: `P2.mistK2 * (mistF + ((100 - cv) / mistC) ^ mistP)` with cv = 0.7 consistency + 0.3 restart (0.0016, 0.3, 20, 1.6), was `mistK * (1 + (100 - cv) / 30)` (0.0065); other multipliers unchanged; `P2.mistV` 1 restores the old curve. Measured (3 seeds x 2 seasons, 132 races): spins per season by consistency 88+ 8.9 -> 1.0, 80-87 8.5 -> 1.8, 70-79 10.4 -> 2.5, under 70 9.1 -> 3.6; per race crash DNF 1.23 -> 0.49, SC 1.23 -> 0.96, VSC 1.56 -> 0.73, mechanical 0.95 -> 0.90, passes 75 -> 80.
- Every race result changes from this version (same random draws, different outcomes), so the gate-off identity check against older builds no longer applies to race results.

## 2.6.5 — 25 November 2026 (weekend hold, track data in the story pack, winter news against the field)

- `src/wkhold49.js`: qualifying and strategy state is kept in `S.wkHold` (key season:round:league) once a session has run; `wk-start` restores it; the race clears it. Found while checking: Exit in qualifying and Start weekend again re-rolled qualifying (6 tries gave P14, P16, P11, P18, P13, P10).
- Winter news `g` is now the change against the league average after the winter (`rel`), with the raw gain kept as `raw`.
- Story pack lists every free agent in the pool (was the best 6 of each kind).
- Story pack: `spTrack` per race (character, history before that race in this league, player record and mastery) and a NEXT RACE section. Circuit history records `lg`; `thStats(ci, lg)` filters by league (`thLg` infers older records from the player's season record).
- Test: `qa/wkhold.js`.

## 2.6.4 — 25 November 2026 (shorter export code)

- Export: `GTG2.` + base64 of deflate-raw (`CompressionStream`) of the save JSON; import reads both formats (`expUnzip`), strips whitespace. Measured on an 8-season career: 1,704k -> 231k characters (7.4x), lossless. Not done: 50x (would need dropping the F2/F3 world, race results and news; a lighter export without the event log and old news would reach about 10x).
- Tests: `qa/exportzip.js`; `qa/navigation.js` decodes the new format (that test needs save fixtures not in this container).

## 2.6.3 — 25 November 2026 (archive for every series, records per league)

- `arAll(S, lg)` builds every season of a league from the world's per-driver season lines (`arFromWH`), plus stored and rebuilt seasons of the player's own league; Archive has an F1 / F2 / F3 switch (`UI.arLg`), records per league (`arRecords(S, lg)`).
- `d.sh` lines now carry `league`; `shLeague` infers it for old lines (world history, the player's season record, the last known league). `careerByLeague` and `careerLeagueText` keep F1, F2 and F3 apart; profile overview tiles, a per-league Career table, the Race record league column and the story pack use them. `worldDriverHistoryHTML` no longer adds duplicate "legacy" rows.
- Regulations: `regSnapPrev` stores the director rating at the start of `startNewSeason` (before the winter market); `regTD` blends 50/50 with the director in charge at the change.
- Calendar round strip: CSS grid, two even rows under 640px.
- Test: `qa/records.js`.

## 2.6.2 — 25 November 2026 (Reg Report and story pack for the new regulations)

- Reg Report entries get `c.pe` (expected leadership head start, from `regConcept` without luck at the start of the change), `c.lu` is now luck only, and `pp` records director, principal, ratings, preparation and the parts of the head start; `rgLeadWhy` names the biggest sources. No champion-handicap reason under phase B. Story pack: leadership table when a change is announced, leadership and people in each Reg Report line.
- Known design point (not changed): the concept uses the director in place after the winter staff market, so a director signed that winter counts in full.

## 2.6.1 — 25 November 2026 (regulations: the new car comes from the people)

- Phase A: a major change rebuilds 70% of every part (was 60%); a minor change targets one or two areas (aero 50%, chassis 30%, engine 20% weights, chosen from a hash) and reworks 75% of those (was 30% of every part). Words in news, Regulation Watch, Reg Report and story pack come from `regWords`.
- Phase B (`S.lead.reg >= 2`): new-car concept = director (7 points from rating 0 to 100 around 50), principal (3), preparation (+3), money (2), luck (sd 3, wider with a weak director), part noise sd 4 (was 9); staff execution on reliability. No forced drop for the champion; the slowest team is lifted to P8, or P7 when it has a director rated 55+ or prepared in time. Measured with 24 seeds x 20 seasons (about 80 majors and 80 minors): champion stays top 3 after a major 45% (was 1%), with strong leadership 48%; top-3 teams with TD 60+ stay top 3 55%, TD below 45 14%; slowest team into the top half 37% (was 48% with the forced rules, 25% without the director link); champion repeats 34% (was 32%).

## 2.6.0 — 25 November 2026 (Leadership)

- Principals and directors on screen: a dossier in the same Paddock frame as a driver (portrait in team colours, rating badge, Overview with upgrade odds or judgement, rating over time, Career table, Contract), a Staff tab in the Paddock browser with a card for every principal, director and free agent, and free-agent cards in the winter recap. Nationalities of the existing staff names now match the names. The story pack has a new PRINCIPALS AND DIRECTORS section (winter moves, firings, free agents, retirements) and each team line describes its principal and director as a person.
- Principals and directors are people (design B14): nationality, age, potential, career list, a profile card (Team HQ and the winter recap), ageing and retirement, young new generations each winter, and a lasting pool of free agents. A principal can let a director go for a clearly better free agent (half the rest of the contract is paid), and a sacked principal goes into the pool and the team hires another from it. The player stays a driver; the team holds all hiring and firing.
- Driver wages are paid outside the R&D fund; the principal sets a separate driver budget with a hard limit in the draft (design B13). Driver feedback now counts for more: bigger and faster development gains, fewer failures, a bad weekend setup costs less (tuned so +10 feedback is worth about a third of +10 pace), good principals prefer it and pay a little more for it.
- Gate `S.lead = { v:1, from }`. New careers on; a save with round 0 turns on at once; a save part-way through a season turns on from the next season. Gate off = old code and old random numbers (checked identical to 2.5.x over seeded seasons).
- Director quality is the person's rating (0 to 100 = x0.8 to x1.2). The old winter random walk of the team's director value (`dev2.js` devWinter, sd 0.12 a year, 25 rating points a year on average) is skipped when on; ratings drift about 1.5 points a year in the market.
- Principal decides, director advises (`leadPickPart`): the best part is judged by the principal and the director with an error that falls with rating (log-normal noise, calibrated to the B3 probabilities), so mistakes are near misses, not maxed parts; overrule stories and walk-outs; "Right calls" on the team profile and in the Story pack.
- Staff market (`leadMarket`): asking salary by rating, offers scored on pay, prestige, competitiveness and loyalty, salary limited by what the team can pay, buy-out poaching, retirement, walk-out when overruled, principals re-signed 78% of the time.
- Director builds by probability (`leadPackage`): hit / normal / miss chances and failure multiplier by rating, instead of a straight multiplier. The principal's direct effect on gain is `tpG` 2.2 (interim); he decides when to shelve a lost season (`leadShelve`), prepares for next year's rules (`regReady`, softens `regPrep`), has a timing error in `devThresholdLead`, and judges candidates in the two-sided market (`leadFill`). The driver R&D focus override is gone while Leadership is on.
- Principal and drivers/money: his judgement of a driver carries an error that falls with rating (`leadEye`, in the pro draft in `world21.js`, `marketAI` and the classic draft `mktScore`), a weak principal misreads the team's plan (`mktPlans`) and pays more for contracts (`leadPayMul`, x1.10 at rating 0 to x0.92 at 100, in `worldAssign` and `conMake`). Measured over 36 seeds x 10 seasons: better drivers (about +0.09 OVR per +10 principal rating); payroll, R&D fund and team power effects are within noise.
- Economy and in-season development (tuned by simulation, design B11): prize money (70% of the annual amount) and sponsor bonuses ($0.04M per championship point) are paid after each round on the live standings; packages cost x0.65, in-season gain x2.4, winter package size 3.0 and winter gain x2.0. Result over 24 seeds x 8 seasons (years without new rules): teams moving 2+ places in a season 4% -> 27%, rank change in a season 0.31 -> 1.11 places, second half of the season 0.04 -> 0.56 of the first, winter movement 0.65 -> 0.78 places with 17% of teams moving 2+, teams that shelved a lost season early gain +0.39 power over the winter against -0.09 for the others, number of different champions unchanged, cash below zero at the finale 31% -> 8%.
- Leadership weights tuned together (design B12): director hit x1.65 / miss x0.4, principal gain exponent 1.1 (was 2.2 for a while, 1.5 in the old game), staff gain exponent 0.8 and staff failure factor 0.8 (old game 2 and 2.5), package cost x0.8, in-season gain x2.6. Per +10 rating, car power a year: director +0.50, principal +0.25, staff +0.24; +$10M of R&D money +0.37; teams that shelved a lost season gain +0.81 over the winter against -0.21.
- A new principal brought in after the board sacks one never shares a name with another team's.
- Team feedback (both drivers) replaces the player-only driver feedback multiplier; applies to every team; also lowers upgrade failure slightly.
- `qa/leadership.js`.

## 2.5.6 — 23 November 2026 (technical director rating)

- Technical director rating display uses `pct100(td, 0.8, 1.2)` (was 0.9 to 1.1) on the team profile, Paddock panel and Story pack. Display only: the director multiplier (clamped 0.8 to 1.2, new candidates 0.9 to 1.1) and the development formula are unchanged.

## 2.5.5 — 22 November 2026 (story pack tyre fix)

- Story pack: the starting tyre was read from `oldShape` data, which does not carry `c0`, so it fell back to the finishing tyre. It is now read from the real race car and flagged with `rec.tv`. Races recorded without the flag print "starting tyre not recorded" but keep their (correct) stop list.
- `qa/storypack.js` now checks the recorded starting tyre against the race and that every dry finisher shows two compounds.

## 2.5.4 — 22 November 2026 (race log positions)

- Race log entries carry running order: pass (`pb`/`pa`), contact, spin and pit (`p0` and the rejoin position `p1`, filled in by `resolvePend` once the car is moving), retire (`p0`). Computed by `raceOrderPos` from car distance; no random numbers are used, so race results are unchanged.
- Story pack text shows the positions (older races keep the previous wording).

## 2.5.3 — 22 November 2026 (story pack detail)

- Story pack: Q1/Q2/Q3 per-session times (`rec.qs`, from `P2._qres`), eliminations marked, final grid line.
- Story pack: per-driver tyre story (`rec.x[i][4..5]`: starting tyre and stops with lap/compound/time lost); engine remembers the starting tyre (`f.c0`) at the first stop. Pit lines in the race log name the fitted tyre.
- Old races keep the previous format.

## 2.5.2 — 20 November 2026 (save space fix)

- Saves are LZW-compressed (about 6x smaller, prefix z1:), verified by decompressing on the first saves of a session and every eighth save; falls back to plain JSON if a check ever fails. Plain saves from older versions still load and are converted on the next save.
- If storage still refuses, old per-race detail, old news and old events are trimmed and the save is retried before the warning appears; the warning now suggests exporting a backup and avoiding private browsing.

## 2.5.1 — 19 November 2026 (app icon)

- New Grid to Glory logo (double G and wordmark, recoloured to the game's navy and gold) as favicon (16, 32 and 192 px PNG) and apple-touch-icon. Sources in src/assets (logo-gtg.png transparent master, logo-512.png, icon PNGs).

## 2.5.0 — 19 November 2026 (archive)

- Season > Archive: champions of every season, full final standings, race-by-race winners and poles, all-time records.
- Finished seasons are archived in full (standings, poles, fastest laps, winners, every driver's OVR). Older seasons are rebuilt from race results, driver and team history and champions, with a completeness label.
- Fixed Pro careers not recording driver rating history; rating graphs now gain a point each season.

## 2.4.1 — 19 November 2026 (contract outlook)

- Team outlook on F1 contract offer cards (classic offers and the pro market): car-pace rank and field position, per-race car-power graph against the grid average, trend since winter, money, new-rules exposure, board target and tags.

## 2.4.0 — 19 November 2026 (Garage Watch)

- Regulation Watch (Season > Regs, Home banner): minor and major changes announced one season ahead, rough per-team exposure bands, title leader / slowest / prepared / stretched tags.
- Reg Report recorded at regulation time: per-team before/after, split into exposure, title and catch-up rules, concept luck and winter development; slope chart and reasons.
- Behind-the-garage news (development watch, new-rules focus, budget) with a Garage filter in Paddock Wire; minor updates have their own news.
- Story pack Regulations section.

## 2.3.0 — 19 November 2026 (pit wall and story pack)

- Pit-stop challenge now starts as the car reaches the pit entry instead of when the tyres are chosen. A queued call can be cancelled until the challenge starts; mini-games off or Fast keep the automatic stop.
- Contract sheet padding and signature layout fixed for small phones.
- Story pack: one block of text with cars, teams, staff, drivers, news, full qualifying and race results and race logs, for the latest race, the last five races or the whole season (Copy or Download). Per-race qualifying times, tyres, log and key radio are recorded for the current and previous season.

## 2.1.0 — 10 November 2026 (playtest build)

- Synchronised F3/F2/F1 worlds, market scarcity, ageing and a dynamic ceiling (Mind-based growth step).
- Talent range 84–96 (gifted 95–97), steeper XP near cap, wider AI/regen spread. Target curve: ~80 at 20, ~86 at 25, ~90 at 30.
- Regulation Watch: minor changes every 2–3 seasons, major every 5–6, with dynasty falls that also consider driver quality, prestige drift and a back-to-back champion development handicap.
- Team operations (setup, coaching, pit crew) and five team characters.
- 12 hard performance abilities and 5 junior "Asas" abilities.
- Academy as a home: no rival academy offers once signed, seat routes through the academy, release fee for other teams, interest capped at 4–8 teams, protected seats never priced above what you hold.

## 2.0.0 — 9 November 2026

- Start a Pro career at 16 in F3, earn promotion to F2 and qualify for an F1 debut. Choose your driver identity, helmet, archetype and funding background.
- Race a fixed 22-round F1 calendar with fictional GTG circuits, unique maps, profiles and strategy guides. Junior seasons use an eight-round calendar.
- A living F3, F2 and F1 world: ten teams per league, 30 F3 seats, 20 F2/F1 seats, driver regeneration and car development. Junior cars share a specification within their league.
- Scout Watch, performance-based offers, academy invitations or Express Interest, funded seat packages, permanent F1 licence eligibility and champion promotion routes.
- Six-stat Overall, XP-funded training, Fitness, Recovery, race-day Focus, annual ageing previews, car-relative performance assessment, H2H and tiers.
- Abilities, mastery, loadouts and bounded Cap Breaker growth. Mechanical DNFs are excluded from driving-performance penalties.
- Separate Tyres, Fuel and Energy controls with engineer Auto/Manual, meaningful resource trade-offs and optional engineer advice.
- Guided, Casual and Expert assistance, practice tutorials and Highlights playback alongside live viewing and Fast.
- F1 contract progression, one comeback opportunity after losing a seat, optional retirement from 38, a final racing season at 44 and retirement at 45. Hall of Fame records and a next-career legacy.
- Race consistency fixes across forecasts, strategy, HUD/results, pits, spins, press conferences and news.
- Fully English UI, five main menus, small-phone and desktop polish, enhanced team cards and supplied SVG country flags.
- Existing saves and Classic careers remain supported. Export/import and Hall of Fame backups help preserve progress.

## 1.0.0
- Full career mode: create a driver, race 10 rounds a season, grow your skills with XP and chase the title.
- Qualifying, pit stops, tyres, weather, safety cars and mini-games, with auto-run.
- Living grid: AI teams develop cars, run budgets, change plans, sign and sack drivers.
- Contracts, offers, buyouts, reputation, sponsors, fame and press conferences.
- Teammate rapport and team orders. Reserve year if you lose your seat.
- Facilities, engine alliances, team loans and young driver tests.
- Final-race radio, end-of-season radio, Season review and circuit history.
- Aging: skills fade after 31, retirement at 42.
