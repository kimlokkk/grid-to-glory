# Grid to Glory: UI v3 handoff

Written 2026-11-13 so another assistant (or person) can continue the UI redesign.

## 1. Where the work is

- Repo: `https://github.com/kimlokkk/grid-to-glory`. Live site is GitHub Pages from `main`, still **v2.1.0** (commit `0bb5682`).
- All redesign work is on the local branch **`ui-v3`** (13 commits on top of `main`, listed below). **It has not been pushed.** `main` and the live site are untouched.
- The working copy lives in a folder the Claude desktop app created for the session. It is deleted if that session is deleted. To keep the work, push `ui-v3` to GitHub (needs a personal access token typed by the owner in a terminal; the remote is `https://kimlokkk@github.com/...`) or move the session to a real folder.
- Never touch other repositories or the owner's work accounts.

### Commits on `ui-v3` (oldest first)
| Commit | What |
|---|---|
| `4c5278b` | Hub tabs Home, Season, Driver, Team, Career; driver market offer cards and contract document; season-end wrap |
| `52aa957` | Qualifying screen (race weekend phase 1) |
| `627754d` | Strategy screen (phase 2) |
| `dc32d70` | Race screen (phase 3) first version |
| `ae574f3` | Race polish: realistic wheel, kerbs, progress bar, position pop |
| `8aa8a2d` | Race page follows the light app theme; wheel decluttered |
| `650496c` | Tyre, fuel, energy become dials on the wheel; radio line no longer clipped |
| `1964383` | Boost and Pit onto the wheel |
| `ecbbf95` | Round OT and BOX wheel buttons; battle card tidy |
| `6479696` | Smaller OT and BOX |
| `fc2b509` | Oval map (reverted next commit) |
| `c6a8c4d` | Real circuit layout again; cars drawn as team-coloured dots on the map |
| `adc3896` | Wheel screen shows tyre compound and age of the cars ahead and behind |

## 2. How the project works (read before editing)

- Static single-page game, no framework. `build.sh` concatenates `src/head.html`, `src/style.css` and every JS module (in the order listed in `build.sh`) into one `index.html`. **Always run `bash build.sh` after editing `src/`.** Serve the folder with any static server (for example `python3 -m http.server 8766`) and open `index.html`.
- All JS shares **one global scope**. Later modules override earlier ones by reassigning globals (`vQuali = function ...`, `hUtama = ...`, `A['buy'] = ...`). New redesign modules are appended at the end of the script list.
- UI is string-built HTML. `render()` redraws the current screen. Clicks are routed by `data-act="name"` to `A['name'](dataset, element)`.
- Globals: `S` (save), `UI` (screen/tab state), `RUN` (live race), `render()`, `save()`, `showModal()/closeModal()`, `snd('good')`.
- **Rules of the redesign:** presentation only. Do not change sim maths, mini-game timing, market/wallet/finance rules, or save format. Keep existing `data-act` names, ids and classes that `qa/` tests use (see section 5).
- The race screen is repainted every frame through fixed element ids: `strip, cockpit, towerb, radiob, lastr, posb, planb, dtrk` (battle strip) plus `tc<id>` and `btchip`. Keep them.

## 3. Visual language (keep consistent)

- Light page background; **dark "object" panels** (`#0d1120`) for hero banners, timing towers, the circuit map and the steering wheel.
- Fixed gold highlight `#ffd24a` (do not use the theme accent on dark panels, it can be dark).
- Italic uppercase headings in the display font (Chakra Petch style via `var(--disp)`), mono font for numbers.
- Team colour `--tc` on hero banners; medal colours gold/silver/bronze.
- Animations: `hpRise`, `hpPulse`, `hpBlink`, `tgDrive`; all respect `prefers-reduced-motion`.
- Cars: `carSVG(team, width, vertical?)`; helmets: `helmetSVG(driver, size, false)`; track outline: `circuitSVG`, `buildTrack(ci)`.
- Owner's language is Malay; reports to them are in Malay, casual.

## 4. DONE (design and code)

| Area | File | Notes |
|---|---|---|
| Home "Race Day Paddock" | `src/home32.js` | Broadcast hero with animated track and forecast, licence card, timing tower, mission, road to F1, rival poster, lights-out start sequence |
| Season | `src/season33.js` | Season map, podium standings, race result cards, trophy cabinet. News and World sub-views untouched |
| Driver "Driver Garage" | `src/driver34.js` | OVR radar, XP skill shop, tier ladder and grade, perk slots, circuit collection, training rings. Pro mode only (Classic and reserve year keep the old page) |
| Team "Team Garage" | `src/team35.js` | Garage hero, car blueprint (F1), R&D workshop, budget tank and facilities, pit wall, car pace ladder, line-up, teammate VS, contracts and history. Junior teams get crew and seat cards. "Team profile" button removed |
| Career "Driver's Office" | `src/career36.js` | Contract hero, inbox strip, wallet flow, fame ladder and sponsor slots, scout radar, academy, trophy cabinet |
| Driver market and contract | `src/career36.js` | Offer cards (pay delta, car rank, flags) and a contract document modal with a Now vs This offer table |
| Season-end wrap | `src/career36.js` | Final position hero (champion variant with confetti), podium, constructors bars, objective stamp, sponsor reactions, market first, old detail cards folded into "Your driver file" |
| Qualifying | `src/quali37.js` | Session stepper, verdict card, run-plan cards with pips, timing tower with drop zone, final grid as staggered slots |
| Strategy | `src/strat38.js` | Tyre guide, each plan as a coloured stint timeline with pit laps and forecast rain band, drawn tyre picker for wet races, switches, sticky "To the grid" bar |
| Race | `src/race39.js` | Circuit map with team-colour dots, battle strip kept, steering wheel (rev lights from gap ahead, status, position pop, rival tyres, three dials for tyre/fuel/energy that open the existing control picker, round OT and BOX buttons), chequered-flag card, light theme with dark map and wheel |

All of the above were checked at 390x844 (phone) and mostly 320x568, 768x1024 and 1440x900. Race polish after `dc32d70` was checked only once at 390x844 each time.

## 5. TO DO

1. **Race, remaining polish**
   - Race map labels can still overlap in a tight pack.
   - Verify the latest race changes on desktop (1440 wide), tablet and 320x568; only 390x844 was checked after the dial/OT/BOX work.
   - Watch live animation and smoothness on a real phone; it was only stepped manually in a background tab.
   - Pit-call modal (engineer calls with box/stay-out options) is still the old style (`pitCard`, `strat14.js`).
2. **Mini games (phase 4)**: 17 types in `src/minigames.js`, `mg3.js`, `mgr7.js`. Currently small modal bars with a 5-step tutorial first. Plan: full-screen scenes per input type (start-lights gantry, brake board, mirrors, top-down pit box), keep timing and scoring identical. Phone-first, big tap targets.
3. **Race result screen (phase 5)**: `vResult` in `src/ui5.js`. Plan: finish moment (podium variant), points and XP count-up, then press conference and news.
4. **Settings tab**: the only hub tab not redesigned.
5. **Smaller leftovers**: Season News and World sub-views; the team profile modal for other teams (`teamProfileHTML` in `src/team11.js`); driver profile modal; the three folded cards in the season wrap ("Next season", "Performance and tier", "Abilities") still have old styling inside; Classic mode only partly restyled (Team and Season calendar yes; Home, Driver, Career keep the old pages); states never tested: sacked, reserve year, comeback year, retirement, active academy member, rival poster on Home.
6. **Run the QA suite** (`qa/`, Playwright). It could not run on the owner's Mac during this work. Known to need updates: `qa/team_ui.js` clicks the removed Team profile button; `qa/career_ui.js` may assert the old layout; `qa/controls.js` was already changed to read fuel/energy from `.wh-dials button`.
7. **Bugs found, not fixed** (details in `BUGS-TODO.md`): a negative wallet blocks signing even a free contract (`marketAccept` in `src/market22.js`, line `if(o.package.own>g.wallet.balance)return false;`); the F1 rookie wallet bleeds money every round (costs exceed salary), so it can go negative.

## 6. Owner's requirements (from the conversation)

- "Grid to Glory is a GAME, so it must be FUN": gamey, F1-like, wow, not a form.
- **Phone first, desktop equally important.** Most players are on phones. Anything good on desktop should appear on phone if it can fit.
- Race screen: realistic F1 steering wheel (real shape, buttons, rotary dials); cars on the track must be readable (they chose coloured dots on the map; full car sprites stay in the battle strip so overtakes are clear); keep the real circuit shape.
- Boost and Pit must feel F1-like and not too big (round OT and BOX buttons were accepted, then made smaller).
- Tyre info for rivals should be inside the wheel screen.
- Race page must match the light theme of the rest of the game (not a full dark takeover).
- Show complete static screenshots with all data when asked; keep testing light to save usage.
- Commit only when asked; push only when asked. Commit messages end with a Co-Authored-By line for the assistant that wrote them.
