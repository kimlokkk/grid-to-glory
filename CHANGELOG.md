# Changelog

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
