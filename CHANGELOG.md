# Changelog

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
