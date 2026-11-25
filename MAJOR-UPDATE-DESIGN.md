# Major update design (working spec, not implemented)

Collected from the design discussion after Season 5. Nothing here is built yet. Items marked **PROPOSED** are suggested defaults that still need a decision or tuning.

The whole document stays one **major update** for now. After review we pick which parts can ship early as small patches (see Part E). Anything not picked stays in the major update.

Contents: Part A regulation changes, Part B team principal, technical director and board, Part C engine allocation, Part D race weekend penalties, Part E phasing and triage, Part F decisions.

---

# Part A: Regulation changes


## 1. Goal

- Keep the pattern that already works: after a major regulation change the pecking order reshuffles (S3 to S4 in the playtest save: former bottom teams Ridgeline and Kaze rose to the top two, former top three Brennhart, Whitmore and Valerio fell to P9, P5 and P6).
- Make the change **readable**. A player should be able to see it coming, understand why each team moved, and make contract decisions from that (for example "which team will have the best car next season").
- Make the **technical director, team principal and technical staff** matter, because they lead the car programme.
- Keep it controlled: randomness stays, but it should look like a visible gamble, not hidden noise.

## 2. How it works today (from the code)

| Topic | Behaviour | Where |
|---|---|---|
| Schedule | Major every 5 to 6 seasons (`era.next = N + 5 + rand(0..1)`). Minor 2 to 3 seasons after the previous change, at least 2 seasons from a major. | `world21.js` (worldEra), `dev2.js` (regNextMinor) |
| Car re-roll | At winter of a regulation season each car part becomes `(1-mix) * old + mix * new`. Major mix 0.6, minor 0.3. `new` = league mean (kept constant) + noise with sd 9, clamped 50 to 97. | `dev2.js` 156-166 |
| R&D philosophy | Re-rolled per part (0.75 to 1.25) on major only. | `dev2.js` |
| Forced reshuffle (Pro) | `regBalance`: the champion is pushed down to about P5 to P6 (major). The slowest team is lifted to at most P7. Ranking counts driver quality as well as the car. | `dev2.js` 182-190 |
| Preparation | `regPrep` = prestige + technical director + technical staff, clamped. It only changes how far the champion falls or the last team rises, about plus or minus 1 place. The re-roll itself ignores it. | `dev2.js` 181 |
| Era profile | One of 3 profiles (engine +10% and aero -5%, aero +10% and engine -5%, chassis +12% and engine -5%), never equal to the current one. It reweights how much each part matters per lap and blends a driver attribute into pace (10% race, 5% qualifying). | `world21.js`, `engine2.js` carPerf3 |
| Announcement | The next era is already announced one season early as a `world` news item at R0. It is easy to miss. | `world21.js` worldEra |
| After the fact | The `reg` news ("New regulations rip up the rulebook") appears only in the regulation season. | `career.js` 230 |
| Regulation Watch | `regulationWatch()` knows the next minor or major, but no screen calls it. | `patch31.js` 119 |
| Development banking | Teams far behind target can shelve progress for the winter package ("switch focus to next season"). | `dev2.js` 116-119 |
| Engine deals | Customers pull 20% toward the works engine each winter and share 50% of works engine gains. | `fac12.js` |

## 3. What the simulation showed

250 simulated major changes from fresh starting fields (re-roll and `regBalance` only; era profile and winter packages not included):

| Rank before | Re-roll only: power change, average rank after | With `regBalance` (current game) |
|---|---|---|
| 1 (champion) | -6.0, P2.4 | -13.9, P6.8 (falls 100% of the time) |
| 2 / 3 | -4.4 / -3.8 | -4.5 / -3.7, stays around P2.4 / P2.9 |
| 5 to 8 | about 0 to +2.4 | about 0 to +2.3 |
| 9 | +4.5 | +4.4 |
| 10 (slowest) | +5.0, P8.8 | +13.4, P4.0 (rises 100% of the time) |

Conclusions:

1. The 60% re-roll toward the league mean explains part of it: cars far above average lose their lead, cars far below gain. Expected change is about `-0.6 * (distance from the mean)`.
2. `regBalance` is the dominant effect at both ends. The honest reason a champion falls and the slowest team rises is a fixed rule, not luck.
3. Hypothesis rejected: "teams specialised in one area fall more". Correlation between specialisation and change was only -0.13 to -0.18. Do not write that reason.
4. Leadership already shows up in the current grid. In the S6 pre-season pack, technical director rating correlates +0.63 with car rank (ten teams, small sample). Team principal about 0, technical staff -0.33 (noisy). At regulation time leadership is almost irrelevant (see regPrep above).

## 4. Decisions so far

- Keep the existing reshuffle pattern. Do not replace it with a "hold upgrades" system (considered and dropped because it risks flattening the order and rewarding the richest teams).
- Warn **one season ahead**, with **rough indicators**, not exact car numbers (scouting skill should still matter).
- Add a clear reason for every team's move, computed from real numbers.
- Regulation outcomes must depend on technical director, team principal and technical staff.
- Minor and major changes are different in kind (section 6).
- Team principal style must be balanced (section 7).

## 5. Transparency layer (no mechanic change, can ship first)

1. **Reg Report.** When a regulation change is applied, record per team: rank and power before and after, per-part change, and flags (champion, slowest team, preparation score, technical director, staff, whether the team switched focus early).
2. **Reason breakdown per team**, from real numbers:

| Component | Source | Wording idea |
|---|---|---|
| Structure | `-0.6 * distance from the mean` | "Built for the old rules" or "Clean sheet" |
| Champion rule | `regBalance` | "Champion's advantage locked into the old concept" |
| Catch-up rule | slowest team lifted | "Catch-up allowance for the slowest team" |
| Preparation | `regPrep` and leadership | "Technical department ready" or "Not ready" |
| Concept luck | actual change minus expected | "New concept beat or missed expectations" |

3. **Reg exposure card one season ahead**: rough tags per team (High, Medium, Low exposure; champion and slowest marked; prepared or not). No numbers and no luck component.
4. **Post-change feature story** in Paddock Wire: who gained and why, one line per team, plus the same breakdown in each team dossier.
5. **Regulation Watch card** in Season or Career: next change (minor or major), season, and how certain it is.
6. **Make the early warning loud**: a prominent news card and the card in 5, not just one ordinary line at R0.
7. **Behind-the-garage news** every 2 to 3 rounds about other teams: new technical director, loan, big package, "team X switches focus to next year", staff losses, facilities up. Varied, filterable, not only contracts.
8. Add the Regulation Watch lines to the story pack.

## 6. Minor versus major (mechanic change, prototype after section 5)

Inspiration: the real 2026 regulation change, where teams had to build a new car and power unit and many stopped developing the old car early. (From memory, general only; no claims about actual 2026 results.)

| | Minor | Major |
|---|---|---|
| Idea | Teams adapt the current car | Teams build a new car |
| Car | Only 1 to 2 parts targeted by the profile, about 70% kept | All parts rebuilt, about 25 to 40% kept (**PROPOSED** 30%) |
| R&D philosophy | Kept | Re-rolled |
| Noise | Small | Larger, scaled by leadership and team principal style |

### Who decides what (major)

| Role | Effect |
|---|---|
| Technical director | Concept quality for aero and chassis: shifts the expected value of the new car (**PROPOSED** moderate, about plus or minus 3 car points at the extremes) |
| Team principal | Decisions: when to switch focus to the new car (sacrificing the current season) and risk appetite (section 7) |
| Technical staff | Execution: reliability of the new car and how fast the first packages work |
| Engine | Works teams build their own. Customers inherit the supplier's result, with a stronger pull on a major change than the current 20% per winter |
| Money and R&D fund | Capacity of the new-car programme, as a limit on how much current-season development a team can sacrifice |

### Guardrails

1. Keep the champion and catch-up rules, but scale them down somewhat.
2. Cap leadership effect. Technical director 100 teams already sit in the top three, so a strong effect could freeze the order.
3. Natural counterweight: technical directors move between teams (news like "Hargreave joins Whitmore"). Teams that hire a strong technical director a year early should show up as visible favourites.
4. Validate with simulation before accepting (section 9).

## 7. Team principal: balanced trade-off (**PROPOSED**, numbers to be tuned)

Both styles should have about the same expected result before skill. They differ in risk, and neither is strictly better. Team principal rating raises hit odds and lowers miss odds for everyone.

| Style | Outcome per concept area | Current-season cost |
|---|---|---|
| **Aggressive** | Wide spread. Roughly 30% chance of a big hit (about +8), about 25% chance of a miss (about -5), otherwise near the mean. | Switches focus to the new car earlier: weaker final season of the old rules |
| **Balanced** | Medium spread, smaller hit and miss | Switches mid-way |
| **Cautious** | Narrow spread, small misses (about -1.5), but a modest chance of a real breakthrough (about 12% for about +5) | Keeps developing the old car longer: more points before the change |

The starting numbers above are illustrative. Tune so that the long-run average is equal and the standard deviation differs, then check by simulation.

## 8. Behind-the-garage news (ties it together)

- Year before: era announcement, exposure card, technical director and staff moves, "switches focus early" stories, loans and budget stories.
- Regulation season: "New regulations" breaking story linking to the Reg Report.
- After: "Who gained and why", and follow-up development stories that reuse the same reasons.

## 9. Validation plan

Simulate 30 seasons across many seeds and measure:

- How many places the champion falls on a major change (target: still about P5 to P7 on average).
- How often the slowest team rises into the top half (target: unchanged from today).
- Rank correlation between consecutive seasons (not too high).
- How often the best technical director's team wins the title, and how often the champion repeats.
- Spread of results by team principal style (aggressive wider, equal mean).

Acceptance: the S3 to S4 style reshuffle remains, and technical director, team principal and staff measurably explain part of the outcome.

## 10. Rollout order

1. Reg Report, exposure card, post-change story, Regulation Watch card, louder warning, behind-the-garage news. No mechanic change. Ship as a minor version with release notes and tests.
2. Prototype the new minor/major mechanics and team principal styles on a separate branch with the simulation above.
3. Tune, then release with notes (for example 2.5.0).

## 11. Open decisions

1. Size of the technical director effect (proposed: moderate).
2. Aggressive and cautious numbers in section 7.
3. Share of the old car kept on a major change (proposed: 30%).
4. Whether customer teams should inherit the engine result fully on a major change.
5. Exact wording of the in-game reasons (the catch-up rule is a fixed rule; label it honestly).

## 12. Unverified

- **Verified (13-season simulation):** the car re-roll (`dev2.js`) and the era profile (`world21.js`) apply on the **same winter**, and the era is announced **one full season earlier** (for example announced after season 7, applied after season 8 for season 9).
- **Found while verifying:** the **minor** change shows the same breaking story as a major one ("New regulations rip up the rulebook ... every car must be rebuilt from scratch") but only 30% of the car is re-rolled, and a minor change is **never announced** in advance. This is misleading and is the first thing to fix (Part E2).
- The simulation does not include era-profile weights or winter packages, which probably explains why the real S4 shuffle was larger than the simulation.

---

# Part B: Team principal, technical director and board

## B1. Today (from the code)

- The part to upgrade is picked by weighted chance (`dev2.js` devPackage): R&D philosophy, gap to the best team, and team principal rating as an exponent (a better principal finds the weak part more reliably). There is no decision about *when* to bring it or *when* to fit it.
- The technical director multiplies gain: `td * staff^2 * tp.skill^1.5`. Roles are blended in one formula, with no split of authority.
- Teams choose drivers by team plan (`PLAN`: win, build, rebuild, cut), not by the principal.
- Board: one silent rule. If the team finishes 4 or more places below its target (`sackGap`), the principal is replaced at winter with 60% chance. No warning, no other action.

## B2. Authority split (**PROPOSED**)

| Role | Decides | Effect |
|---|---|---|
| **Team principal** | **What** to upgrade, **when** to bring it, **when** to fit it, **which drivers** to hire, how much to sacrifice this season for the next | Strategic direction. Final say |
| **Technical director** | **How good** the part is when it is built | Build quality. Builds what the principal orders |
| **Technical staff** | Execution: failure rate and reliability | As today |
| **Board** | Targets, budget, rewards and sanctions (B4) | Pressure and consequences |

## B3. Communication: the principal decides, the director advises

The principal always has the final decision, but listens to the technical director. This lets a good technical director carry a weak principal without removing the principal's importance.

- The principal's own pick is correct with probability `p` that rises with principal rating (illustration: 55% at rating 0 up to 90% at rating 100).
- The principal consults the technical director. Weaker principals lean on advice more (illustration: 77% of the time at low rating, 53% at high). The advice itself is correct with a probability that rises with technical director rating (illustration: 60% at rating 0, 95% at rating 100).
- Rough results: weak principal with a great director about 0.89 correct, weak with a weak director about 0.78, strong with a great director about 0.93. A weak principal is wrong more often, but not always.
- When the principal overrules the director, the part is built as ordered. The part the director wanted does not progress, so the weakness stays. The director can become unhappy and may leave (technical directors already move between teams). Show it as news ("principal overrules technical director") so the player can read what is going on behind the garage.
- Probabilities **approved** as the starting point. Verify by simulation when the mechanic is built (Part E).

Principal style from Part A section 7 applies here too (aggressive switches focus to next year early, cautious later).

## B4. Board (**approved as proposed**)

- A **confidence score** (0 to 100) per team, from results versus target, trend and finances.
- **Reviews** at rounds 6, 12 and 18. Possible actions: warning, R&D budget cut, forced driver change or engine supplier change, replacing the principal (new principal, new direction), or rewards (more budget, higher target).
- The player is a driver, not a principal. Board actions reach the player as changes in the team: new principal, a driver forced in or out, a technical director leaving. These are also the "behind the garage" stories.

## B5. Rating as the real value (**DECIDED**)

Found while reading the S8 pack: a technical director "rating 0" was the weakest allowed multiplier (x0.90), shown on a 0.9 to 1.1 scale. Technical director, technical staff and team principal each had their own scale (0.9 to 1.1, 0.8 to 1.2, 0.75 to 1.25), so numbers could not be compared and many sat at exactly 0 or 100.

- **One 0 to 100 rating** for team principal, technical director and technical staff, stored as the real value (like driver stats). The multiplier the development formula uses is **derived from the rating in one place** (`leadMul(rating)`), so a change of balance is one number, not a hunt through the code.
- Starting mapping keeps today's effect: rating 50 is x1.00 and the director range stays about x0.90 to x1.10 until simulation says otherwise. Widening the range is a separate, tested decision.
- Pool candidates are drawn from a proper distribution (mean 50, spread about 20, no clamp at the ends), so there is no pile-up at 0 and 100.
- Existing saves: rating is **derived from the current multiplier** (migration, B7), so nobody changes strength on the day of the update.
- Interim fix already shipped: the old display now uses the 0.8 to 1.2 scale for directors (display only).

## B6. Technical director market (**DECIDED**, numbers to tune)

Today (`mktStaff`): contracts that end join a pool with 2 random newcomers, then teams take the highest skill in order of team strength. No cost, no refusal, no fit. Good directors concentrate at strong teams, weak ones at the back, and it looks arbitrary.

New model:

- **Each director has** rating, age, asking salary (rises with rating), contract length and loyalty. Rating drifts slowly each year (about plus or minus 1 to 3, by age), so no one is stuck at 0 and newcomers join with a normal spread. Retirement by age.
- **Offers both ways.** Each open team makes an offer (salary, length). The director scores each offer: pay, team prestige, how competitive the car and board target are, loyalty to the current team. The director takes the best, not the first team in line.
- **Salary comes from the R&D fund**, which already sits close to the cost cap (S8: about $60M to $84M). A top director costs a lot, so there is a real trade-off with principal, staff, drivers and development. Rich teams still win more of them, but for a stated reason.
- **Several rounds.** Directors with several offers decide first (best first). Teams that lose bid again for the next one. Same shape for principals.
- **Poaching under contract** is possible with a buy-out fee, sized so it is rare. News: "Valerio tries to sign Pemberton".
- **Leaving.** A director whose advice is overruled too often can leave (B3).
- **News and visibility.** Offers, refusals, bidding wars, who left and why. Reg-year hires (Part A section 8) show as favourites a year ahead.

## B7. Driver feedback as input to the director (**DECIDED**, numbers to tune)

Today (`dev2.js`, `devPackage`): the driver's feedback stat multiplies upgrade gain **only for the player's own team** (about x1.14 at feedback 91, clamped 0.8 to 1.25, plus the Feedback ability). AI teams get nothing, whatever their drivers' feedback.

New model:

- **Team feedback = average of the two drivers** (the lead driver counts a little more). It applies to **every team**.
- It is the quality of information the director gets: it raises the chance the director's **advice is correct** (illustration: about plus or minus 3 to 4 percentage points between feedback 60 and 90) and lowers the chance an upgrade **fails** a little.
- It **replaces** the player-only multiplier, so there is no double count. Calibrated so the player's team keeps about the same average gain as today, and AI teams get their fair share. Expected spread in S8: from about x0.99 (Fairbourne) to x1.09 (Kaze, Brennhart).
- AI teams include feedback when hiring drivers (to be checked in the market code first).

## B8. Rollout and existing saves (**DECIDED**)

The new leadership system is gated by a save field, `S.lead = { v: 1, from: <season> }`.

- **New careers** start on it.
- **Saves in progress** keep the old behaviour for the rest of the current season. At the **next new season** (the winter that starts season N+1) the migration runs and the new system is used from then on. Nobody changes mid-season.
- **Migration** (one time, deterministic, no random numbers): derive the 0 to 100 rating from today's multipliers, create asking salaries and contracts for directors and principals from the existing ones, set team feedback from the current drivers, start board confidence at a neutral value from the current standing versus target. No team changes strength on the day it runs.
- **A save that is at the start of a season with nothing played** (round 0, like S8 R0 right after the market) can opt in straight away: the migration runs before round 1, so the season is played on the new system. The hires for that season were already made under the old market, so the new market starts at the next winter.
- The code keeps the old path until the gate is on, so old behaviour is not changed by shipping.
- The save version is bumped, with tests: a save from before loads, migrates exactly once, and is not migrated twice.

## B9. Leadership core: what was built and measured (2.6.0)

**Finding that changed the plan.** `devWinter` redrew every team's technical director value each winter (`td + (1 - td) * 0.35 + N(0, 0.12)`), whoever the person was. Measured over 6 seeds of 10 seasons: the director rating changed by **25 points a year on average**, and 16% of team-seasons sat at exactly 0 or 100. The director's name never mattered. That is the real reason for the inconsistency, more than the market.

**Built.**
- Scales: rating 0 to 100 maps to x0.8 to x1.2 for director and staff, x0.75 to x1.25 for principal (the same scales the screens used). Stored on the person. The multiplier the formulas use is derived at hire and on drift, so nothing in the old formulas changed.
- Director quality is the person's rating. The winter random walk is skipped when the gate is on. In the market a rating drifts about 1.5 points a year (up to 42, down after 54).
- Decisions (B3): the best part is the one with the most to gain (weak spot, R&D philosophy, some shared uncertainty). Principal and director each **judge the parts with an error** (log-normal noise, sd falls with rating: principal 1.0 at rating 0 to 0.15 at 100, director 0.8 to 0.07, less when the drivers' feedback is above 75). That reproduces the B3 chances (principal alone 55% to 90%, director 60% to 95%) and makes mistakes **plausible**: confusing two parts that are close, almost never a maxed part (0.15% for the weakest pair on a car with a 99 part, measured). The principal leans on advice 77% to 53%. A first version chose the wrong part by weighted draw and could pour a package into a maxed part; that was illogical and was replaced. An overrule where the director was right is a "costly" overrule: counted, and reported (at most one story per team and season). Cost of a wrong call is small by design (measured: about 2% to 13% less gain, because near misses are near-equal), so leadership decisions move results modestly; larger stakes (when to bring a package, style) stay with Part A.
- Market: new directors N(50, 15) rating, ask 2 to 10 $M by rating, offers capped by what the team can pay (`finPayCap`), score = offer / ask + 0.03 x prestige + 0.35 x competitiveness + 0.25 x loyalty (own director) + noise. Best director chooses first. One buy-out attempt a winter at most (25%), fee 80% of the remaining salary. Walk-out when overruled 3+ times (rating 55+, 50%). Retirement from 62. Principals: 78% re-signed, the rest go to the same offer market.
- Team feedback: 0.6 x better driver + 0.4 x other. Gain x(1 + (feedback - 70) / 150) for every team (player also keeps the Feedback ability), failure x(1 - (feedback - 70) / 600).

**Simulation (6 seeds x 10 seasons, old rules vs Leadership):**

| | Old | Leadership |
|---|---|---|
| Spread of team power (sd) | 6.06 | 6.05 |
| Rank change per year | 0.94 | 1.00 |
| Top team changes in a year | 44% | 44% |
| Different constructors' champions in 10 years | 4.2 | 4.5 |
| Director rating change a year | 24.9 | 3.7 |
| Director rating at 0 or 100 | 16% | 0% |
| Correlation of director rating with team power | +0.17 | +0.29 |
| Director changes team a year | 24% | 21% |

The grid does not freeze and the spread is unchanged. Directors who are good are good for years and tend to sit at stronger teams without being forced there.

**Open / to tune.**
- Director spread in the market is N(0.80 + 0.4 x 0.5, sd 15 rating) = about plus or minus 6% effect, narrower than the old random walk (about plus or minus 11%). The team power spread is held by `sdTarget`, so it did not change, but the director now matters a little less in absolute terms. Widen `poolSd` if you want more weight on the director.
- Poaching is rare by design (about one every four winters); watch the news in a long career.
- Board reviews (B4) and the regulation mechanics (Part A) are not built yet.
- Staff market screen only lists director and principal moves; poaching and walk-outs appear as Paddock Wire stories.

## B10. Roles as decided (from the review of 2.6.0) and what is built

**Technical director: build quality, by probability.** A good director produces a package that is more likely to be a hit (bigger gain) and less likely to fail; a weak one the reverse. Never certain. Built: hit chance 6% to 54%, miss chance 54% to 6% by rating (hit x1.55, miss x0.45), failure multiplier 1.35 to 0.65. The old straight multiplier is not used while Leadership is on.

**Team principal: direction and management.** Wanted: knows which driver suits, balances money between drivers and the car, chooses a good director, picks the crucial component, knows when to stop developing, when to bring the package, and is ready for regulation changes.

| Role of the principal | Status |
|---|---|
| Chooses a good director | **Built.** Two-sided matching: each team ranks candidates with an error that shrinks with the principal's rating, then candidates choose among offers |
| Chooses the crucial component | **Built.** Noisy judgement; mistakes are near misses (B9) |
| Knows when to stop developing | **Built.** `leadShelve`: a good principal shelves a lost season 95% of the time, a weak one 25%, and a weak one sometimes shelves for no reason |
| When to bring the package | **Built (partly).** Timing error and noticing a circuit that suits the part. Package size is still driven by how long he waits (rush or big) as before |
| Ready for regulation changes | **Built.** In the season before new rules he decides to switch to next year's car (alert 20% to 95% by rating); that adds to `regPrep`, which softens the fall at the change |
| Which drivers suit | **Built (small effect).** Each team judges drivers with an error that falls with the principal's rating (draft in `world21.js`, `marketAI`, classic `mktScore`), and a weak principal sometimes misreads the team's plan (win now / build / rebuild). Measured: about +0.09 OVR of crew per +10 principal rating (36 seeds, about 2 standard errors) |
| Money between drivers and the car | **Built (no measurable effect yet).** A good principal negotiates driver contracts about 8% below the going rate, a weak one pays about 10% above (`leadPayMul`, in `worldAssign` and `conMake`). The effect on payroll, R&D fund and team power is within noise: only a few seats change each year, and the R&D fund rarely limits a package (teams sit near the cost cap with room), so money saved or wasted on drivers has almost no consequence for the car. Making it matter needs the finance model to tie package size or failure to the R&D fund (a separate piece of work) |

**Findings from building the driver and money part.** First results over 12 seeds looked like real effects and vanished at 36 seeds; the first version also hooked `conMake`, which pro mode never calls (pro contracts are made in `worldAssign`). Lesson: judge by a controlled A/B over 30+ seeds, not 12. A second lesson for the design: the money trade-off between drivers and the car is not real in the current finance model.

**Interim.** The principal's direct effect on gain (`tpG` 2.2) is a stand-in. His decisions alone cost little (a wrong call is a near miss), so without it he would barely matter until he also chooses drivers and money. Lower it as those phases come in.

**Measured (12 seeds x 10 seasons), change in team power a season per +10 rating, controlling for the team's starting strength:** director +0.25, principal +0.11, staff +0.16 (about plus or minus 0.04). Spread of team power 6.28, rank change 0.95 a year, no frozen order. A driver no longer steers R&D (the focus buttons are replaced by a read-only view of the pit wall's decision).

## B11. Economy and in-season development (tuned in 2.6.0)

**Problem (measured, 192 seasons, years without new rules).** Teams almost never changed place during a season: 3% moved two or more places and the average change was 0.3 places. The second half of the season had 4% of the first half's development. A year's movement happened at the winter (70%) or at a regulation change. Cause: the winter package cost about $41M of a ~$75M fund and left room for about one package in the season; and even with more money the packages were too small to separate teams whose gaps are about 0.6 power apart. From memory of real F1 (not checked here), teams bring upgrades most race weekends and the order moves during a season without new rules (McLaren 2024, Aston Martin 2023, Mercedes recovering, Ferrari and Red Bull 2022).

**What changed (only while Leadership is on).**
- Prize money: 70% of the annual prize is paid race by race on the live standings (the winter fund no longer counts it twice). Sponsors pay $0.04M for every championship point scored. A team that climbs gets more to spend.
- Winter package size 3.0 (was 2.2) at cost x0.65 and gain x2.0; in-season packages cost x0.65 and gain x2.4. A first pass cut the winter package to 1.5 to spread money across the year and made winters too quiet (0.38 places a year in years without new rules, 6% of teams moving two or more); a team that shelves its season early is supposed to put its effort into next year's car, so it must get a clearly bigger winter step. Measured: a shelved team gains +0.39 over the winter, the others -0.09.
- The principal sets the winter package size with an error that falls with rating, and builds more when new rules are coming (readiness).

**Tuning (24 seeds x 8 seasons, years without new rules).**

| | 2+ places in a season | Rank change in a season | 2nd half / 1st half | Power spread | Different champions in 8 years | Cash below zero | Cash left |
|---|---|---|---|---|---|---|---|
| Before | 4% | 0.31 | 0.04 | 6.31 | 3.0 | 31% | $8M |
| Cheap packages (cost x0.5, gain x2) | 32% | 1.25 | 0.78 | 6.05 | 2.9 | 1% | $27M |
| Cost x0.8, gain x2.2 | 20% | 0.86 | 0.38 | 6.91 | 2.8 | 12% | $14M |
| **Chosen (cost x0.65, gain x2.4, prize 70%, sponsor $0.04M a point)** | **28%** | **1.11** | **0.66** | **6.89** | **3.5** | **4%** | **$19.5M** |
| **Final (as chosen, winter package 3.0 and winter gain x2.0)** | **27%** | **1.11** | **0.56** | **7.21** | **3.1** | **8%** | **$16.9M** |

Winter in years without new rules (rank change a year, teams moving 2+ places): before 0.65 and 13%; first choice 0.38 and 6%; final 0.78 and 17%.

Cheap packages made money almost irrelevant (1% in the red), which is the opposite of what is wanted; the chosen mix keeps money binding without freezing the second half. The power spread is measured at the finale before the winter normalisation (sdTarget), so it is a little higher than at the start of a season.

**Not done.** Letting the principal decide the split of the budget between drivers and the car as a real trade-off (B10): money now matters more (about $10M is worth about 0.2 power a year, measured before this change, to be re-measured), but a principal's driver-budget decision is still not modelled.

## B12. Balancing the director, the principal, staff and money (2.6.0)

**What the first economy tuning did.** Making upgrades bigger (B11) multiplied everything. Measured over 24 seeds x 8 seasons, years without new rules, per +10 rating, car power a year: director +0.25, **principal +0.68, staff +0.65**, and +$10M of R&D money +0.89. A team with a strong director, principal and staff (80, 80, 70) beat one with weak ones (20, 20, 30) by **8 power points a year**, more than the whole spread of the league (about 7). The intent is the other way round: the director decides how good a package is, the principal how well the programme is run, staff how reliably it is built. The winter step also did not depend on the director at all (-0.02), because the winter is dominated by catch-up and the league re-centring.

**What was done.** Lowered the principal's direct effect (gain exponent 2.2 to 1.1) and staff (gain exponent 2 to 0.8, failure factor 2.5 to 0.8); widened the director's hit and miss (hit x1.55 to x1.65, miss x0.45 to x0.4); made packages a little dearer (cost x0.65 to x0.8) with more gain (x2.4 to x2.6) so money still binds without dominating.

| Tuning | Director | Principal | Staff | +$10M | Strong team minus weak team | In-season 2+ places | Winter 2+ places | Shelved early: winter step |
|---|---|---|---|---|---|---|---|---|
| Before balancing | +0.25 | +0.68 | +0.65 | +0.89 | +8.2 | 27% | 17% | +0.39 vs -0.09 |
| **Final** | **+0.50** | **+0.25** | **+0.24** | **+0.37** | **+5.5** | **28%** | **23%** | **+0.81 vs -0.21** |

Order is now director, principal, staff. The strong-minus-weak gap is 5.5 against the aim of 3 to 4: the 80 versus 20 contrast is extreme, and a typical gap between teams (one standard deviation each, about 1.4 power a year in total) is modest next to the spread of the league (about 6.7). Measurement error on each effect is about plus or minus 0.07 to 0.09, so small differences between tunings are noise; the director comes out higher than the aim of 0.35. Money (+0.37 per $10M) binds: 14% of teams finish a season in the red and the average left over is $14M.

---

# Part C: Engine allocation

## C1. Today

There are no engine units. Mechanical failure chance is `(100 - reliability) * 0.00007 * tyre-age factor` per tick (`engine2.js` incidents). No mileage, no units, no penalty.

## C2. Rules (decided)

- Each driver has a **pool of 4 power units** for the season (22 races). **Before each race the driver chooses which unit to run.** Any unit that has not failed can be used, in any order. This is the **pool model** (approved).
- Every unit has its own **mileage** (laps run) and therefore its own **wear**. Mileage only grows on the unit that was run.
- **Wear affects race pace** (not only reliability), so the choice of unit matters at the circuit.
- A **fifth unit** (a new unit beyond the 4) gives a **grid penalty of 10 places** (approved), capped at **15 places per driver per race** in total. The new unit joins the pool, so later races can choose among 5.
- A **failed unit is out of the pool.** If no unit is left, a new one must be fitted (grid penalty).
- Failure chance rises with wear and is **mean-neutral** (see C3), so the season-average failure rate stays as today.

## C3. Wear, pace and failure (tuned by simulation, see C8)

- **Unit life** in races: `5.5 * (1 + (reliability - 75) / 100)`, clamped 4.4 to 6.6. (22 races / 4 units = 5.5 for a reliability of 75.)
- **Wear** `w` = laps run on that unit / its life in laps. It rises during a race, so use the wear at the start of the race plus the part of the race completed. It may exceed 1 (up to about 1.4) if a unit is stretched.
- **Pace:** effective engine rating drops by `5 * w^2` engine points in the **race only** (qualifying is not affected). At the end of life that is about 5 engine points, worth roughly 0.1 s per lap at an engine-heavy track. The cost scales with how much the track depends on the engine (`pw`).
- **Failure:** the existing hazard is multiplied by `m(w) = (1 + 4 * w^2) / (1 + 4/3)`. A fresh unit fails at about 0.43 times the baseline, mid-life at 0.86, end of life at 2.14. The average over a unit's life is 1, so the season-average failure rate is unchanged.
- A failed unit counts as used. Replacing it consumes one of the 4 units, which is what makes reliability matter for grid penalties (C8).

## C4. Strategy

- The choice is **which unit goes where**. Put the **least-worn** units at engine-heavy circuits and the **most-worn** at engine-light circuits. Engine weight (`pw`) in the Pro profile: high at Lumen City 0.75, Velocera 0.75, Kaspira 0.65, Longwei 0.65, Falkenring 0.65, Sierra Alta 0.65, Île Laurent 0.6. Low at Monte Albrecht 0.3, Hanabi, Dunmere, Valle Dorado, Duinveld, Senja Marina and Qamar Dunes 0.35, Sol de Vega 0.4.
- Rule of thumb for the planner: rank the remaining circuits by `pw`, rank the units by wear, and match them.
- Simulation (C8): the best assignment beats a naive even rotation by about 0.9 points per season and the worst assignment is about 3.5 points below the best (mid-field car). The cost of mistakes is larger than the gain from perfection, so the decision matters mostly by avoiding bad matches. Title contenders score about three times as many points per race, so their stakes are about three times larger.
- A fifth unit costs a 10-place grid drop. The simulation found the drop costs about as much at easy-to-overtake tracks as at hard ones (about 17% difference), so the cheapest place to take it is where the team's expected result is *lowest*, not necessarily where passing is easy.
- Failures also shape the plan: a failed unit leaves the pool, which is why weak-reliability teams reach a fifth unit far more often (C8).

## C5. Who decides

- **Team principal and technical director suggest** the unit for the race, with a reason ("use unit 3, 18% worn: Lumen City is engine-heavy" or "unit 1 is at 92% wear, rest it at Senja Marina").
- **The driver decides which unit to use.** For the player this is a choice before each race. For AI drivers the decision follows the suggestion with a probability based on the driver's `risk` and the team's style (aggressive teams push worn units longer and take penalties earlier, cautious ones rest units early).
- AI default planner: match unit wear to circuit engine weight as in C4, with some noise so teams do not all choose the same.
- New units beyond 4 cost money (R&D fund), which ties into the principal's budget decisions.

## C6. UI

- A **power unit panel** on the team and driver cards: four unit cards with a wear bar, mileage and status (available, in use last race, failed), for example "Unit 2 · 46% worn".
- **Pre-race choice** after qualifying: select a unit, see the engineer's suggestion, the expected pace cost at this circuit (small, medium, large) and the extra failure risk. A fifth unit shows the grid penalty before confirming.
- Results and the story pack record the unit used each race and any penalty.

## C7. Regulation link

On a major regulation change, new power units are less reliable in their first season, scaled by technical staff and the works supplier.

## C8. Simulation study (tuning)

Note: the season table below was built with the engine's measured race costs and an optimiser over unit assignments. The pool-model figures in C4 come from the same data (best assignment, naive rotation, worst assignment).

Method: the real race engine, 22 circuits, 48 seeds per circuit (about 10,000 races), a mid-field team (rank 5), dry races, same qualifying grids reused across variants. Season model: expected points per race from the measured table, a failure term from the measured hazard, optimisation over unit assignments.

**Baseline (today).** Mechanical failure is **4.7% per car per race** (10,560 car-races). Per lap: reliability 60s 0.00245, 70s 0.00177, 80s 0.0013, matching the existing formula `(100 - rel) * 0.00007 * (1 + tyre age * 0.003)`.

**Cost of losing engine points (mid-field car, average over circuits):** points per car per race 4.51 at 0 lost, 3.10 at 8, 1.75 at 16. The cost depends strongly on the track's engine weight: circuits with `pw` of 0.6 or more lose about 2.0 points at 8 engine points, circuits with 0.4 or less lose about 0.8.

**Grid penalty (10 places).** Costs about 2.2 points per race, roughly half of the car's expected points. It varied little with overtaking difficulty (2.0 at easy tracks, 2.4 at hard ones).

**Season results for a mid-field car (points per season, about 99 with a perfect unit):**

| Setting (X engine points, life) | Wear cost incl. normal failures | Best vs worst unit allocation | 5th unit gain at 10-place penalty | Running only 3 units |
|---|---|---|---|---|
| X 5, life 4.5 races (weak reliability) | 15% | 4.9 | +2.4 | 10% |
| **X 5, life 5.5 races** | **11%** | **3.5** | **+0.9** | **7.5%** |
| X 5, life 6.5 races (strong reliability) | 9% | 2.7 | +0.3 | 5.5% |

About 5 points of the 11% is the normal failure rate that already exists today. Title contenders score about three times as many points per race, so the stakes scale roughly three times.

**Chosen:** `X = 5`, quadratic wear (`w^2`), failure multiplier with `a = 4`, life from reliability as in C3. A 5th unit is about neutral for an average car, clearly worthwhile only for weak-reliability teams, and not worthwhile for strong ones.

**How often will AI cars need a fifth unit?** Monte Carlo with a failure consuming a unit:

| Reliability | Failures per season | Chance of at least one 5th-unit penalty | Penalties per car per season |
|---|---|---|---|
| 60 | 1.6 | 56% | 0.65 |
| 70 | 1.2 | 45% | 0.50 |
| 80 | 0.8 | 32% | 0.34 |
| 90 | 0.4 | 17% | 0.17 |

For a 20-car grid that is roughly 7 to 10 penalised starts per season, about 0.4 per race. Not chaotic, and reliability clearly matters.

**Limits of the study:** one mid-field team, dry races only, expected-value model (no race-by-race randomness in the season model), and a one-line approximation for failure losses. Re-check by simulation once the real mechanic exists.

---

# Part D: Race weekend penalties

## D1. Today

Only two exist: +15 s for not using two dry compounds (`sim.js` finalizeRace) and 5 s for a jump start (`ui5.js`). Contact has no steward ruling (only the attacker can cause contact in `attemptPass`) and AI drivers are never penalised.

## D2. Scope (decided: tiers 1 to 3, no licence points)

1. **Stewards.** A contact caused by a failed overtake gets a ruling: no further action, 5 s or 10 s. A "Stewards' decisions" row on the result screen and a radio message.
   - **Base: how realistic the attempt was, not push mode.** A calm, calculated driver can run push mode without taking risks, so push mode is not used. The game already computes the chance `p` that the pass succeeds (pace advantage, attack versus defend skill, driver risk, DRS, tyres, overtaking difficulty). Low `p` at contact means an over-optimistic move.
   - Measured over 308 races: 2.6 contacts per race; `p` at contact has median 0.19, 25th percentile 0.08, 75th percentile 0.41.
   - **Starting thresholds (to tune):** `p` below 0.05 is the attacker's fault, **10 s** (about 15% of contacts); `p` from 0.05 to 0.12 is **5 s** (about 20%); above that is a **racing incident**, no action (about 65%). That is roughly 0.9 penalised contacts per race.
   - **Consequence step:** if the other car lost time or the attacker crashed out, move one step up (no action to 5 s, 5 s to 10 s).
   - The defender is never penalised, as today (only attackers can cause contact in the engine).
2. **Grid penalties.** From engine allocation (Part C). Applied to the grid after qualifying. Cap the total number of penalties per race so the grid does not become chaotic.
3. **Pit offences.** Unsafe release and pit lane speeding from pit-stop quality (mini-game result or crew time).

Not included: super licence penalty points and race bans.

Penalties feed the existing assessment (a penalty already reduces the consistency score).

---

# Part E: Phasing and triage

## E1. Phases (**PROPOSED**)

| Phase | Content | Mechanic change |
|---|---|---|
| 1 | Reg Report, exposure card, post-change story, Regulation Watch card, louder warning, behind-the-garage news (Part A section 5) | No |
| 2 | Team principal and technical director authority, board reviews (Part B), minor and major regulation mechanics (Part A section 6) | Yes |
| 3 | Engine allocation (Part C) | Yes |
| 4 | Steward penalties and pit offences (Part D) | Yes |

Each phase gets simulation checks (Part A section 9, plus engine and penalty distributions) and its own tests.

## E2. Triage (PROPOSED, awaiting approval)

Criteria: player value, size, balance or save risk, dependencies. Items that change no balance and need little new state go first.

### Patch 1: Garage Watch (no balance change)

| Item | Size | Notes |
|---|---|---|
| Distinguish minor and major in the news, and announce minor changes in advance | S | Fixes the misleading "rebuilt from scratch" story on a minor |
| Early-warning card for the next change (kind, season, profile hint, certainty) from `regulationWatch()` | S | Function exists but no screen uses it |
| Louder early warning: breaking-style news and a card, not one ordinary line at R0 | S | The announcement already exists one season ahead |
| Reg Report recorded when a change is applied (per team: rank and power before and after, per-part change, flags, preparation) | S | Small save footprint (about ten teams per change) |
| Post-change feature story: who gained and why, one line per team | S to M | Reasons come from the report (Part A section 5) |
| Exposure tags a season ahead: High, Medium, Low, champion and slowest marked, prepared or not | M | Rough tags only. Build it from one `regExpectation()` helper that reads the mix constants, so a later mechanic change updates one place |
| Behind-the-garage news every 2 to 3 rounds from existing state (loans, facilities, switch focus, principal and director moves, big packages) | M | Cap the frequency and vary the kinds |
| Story pack: Regulation Watch and Reg Report lines | S | |

Tests: a timing test (re-roll and era on the same winter, announcement one season earlier), report contents, news caps.

### Patch 2: Stewards (small balance change)

Tier 1 steward rulings from Part D (base: pass success chance `p`, consequence step, attacker only), shown on the result screen with a radio message. Needs a simulation to confirm about 1 penalised contact per race and a check on the consistency score. Independent of everything else.

### Stays in the major update

| Item | Why it stays |
|---|---|
| Minor and major rebuild mechanics, leadership effect (Part A section 6) | Rebalances the whole grid. Needs multi-season simulation |
| Principal decides, director advises (B2, B3) | Changes AI development choices. Needs simulation |
| Board reviews and actions (B4) | New state and AI behaviour. A visible confidence display could follow Patch 1 |
| Engine allocation and the pool model (Part C) | Race engine, qualifying and AI planner changes, new save data, new UI |
| Grid penalties from engine units (D tier 2) | Depends on Part C |
| Pit offences (D tier 3) | Depends on a pit-quality measure. Could become a small patch later |

### Order

Patch 1, then Patch 2, then the major update in the order of E1 (phase 2 mechanics, phase 3 engines).

---

# Part F: Decisions

## F1. Decided

- Pattern of regulation reshuffle is kept.
- One season warning, rough indicators.
- Team principal decides, technical director advises. A weak principal is wrong more often, not always. Principal styles are balanced (equal average, different risk).
- Technical director has more influence on build quality, principal on direction.
- 4 power units per season. Wear affects race pace. Principal and technical director suggest, the driver decides.
- Penalty tiers 1 to 3. No licence points.
- Document is the **Major update design**. Triage for patches comes later.
- Rating 0 to 100 is the real stored value for principal, director and staff (B5). Technical director market with offers, salary and poaching (B6). Driver feedback feeds the director for every team (B7). Rollout gated by `S.lead`, existing saves switch at the next new season (B8).

## F2. Decided in the tuning round

- Grid penalty 10 places, cap 15 per driver per race (approved).
- Team principal probabilities in B3 (approved).
- Board review actions and thresholds in B4 (approved).
- Wear curve and failure multiplier tuned by simulation (C3, C8).
- Steward base is the attempt's success chance `p`, not push mode (D2).
- **Pool model approved:** each driver has 4 units and chooses which one to run before every race (C2 to C6).

## F3. Open

1. Check the pool model by simulation once built: the Monte Carlo for fifth-unit frequency in C8 assumed a one-after-another plan with replacement on failure, and a pool with free choice may behave slightly differently.
2. Steward thresholds (D2): 0.05 and 0.12 are starting values. Tune by simulation, with a target of about 1 penalised contact per race.
3. Real-world check of the engine penalty values once built (C8 limits).
4. Remaining open items from Part A section 11.

## B13. Driver pay separate from the R&D fund; what driver feedback is worth (2.6.0)

- Driver wages no longer come out of the R&D fund (`finSeason` subtracts team staff payroll plus a reference driver payroll, `leadDriverRef`). The principal gets a separate driver budget (`leadDriverBudget`: revenue x share by plan win/build/rebuild/cut, with a budget error that shrinks with rating). In the pro draft a team takes the first driver it can afford (`leadPickAffordable`). So the principal's money choice is "who is worth the wage", not "driver or R&D".
- Measured (randomised, 24 seeds x 8 years, n=1920): +1 OVR on both drivers = +12.7 constructor points; +$10M R&D = +10 pts; +10 feedback on both drivers = about +0.2 to +0.35 car power (+4 to +8 pts). Feedback is a small lever per step but the real range is wide (55 to 90), so a 35 point gap is about 2 OVR of value. Money cannot raise a driver's OVR, so feedback is the one driver stat a team gets back through development.
- Locked benefits of feedback (final tuning, target: +10 team feedback worth 30 to 40% of +10 pace; +10 pace both drivers = 4.0 car power equivalent because drvK 0.018 / carK 0.045): team gain 1+(fb-70)/55, failure x(1-(fb-70)/200), in-season progress x(1+(fb-70)/125), a bad weekend setup costs less (`leadSetup`, 5% per point, clamp 0.5 to 1.5; good setups unchanged), good principals prefer it in the draft (`fitFb` 0.10) and the market pays a little more (`payFb` 0.003). Measured per +10 feedback: development +0.60 power a year (+/-0.08), setup about +0.67 by calculation (too small to see in constructor points, which are +/-2), total about 1.3 power = 32% of +10 pace. Constructor points are too noisy to tune feedback; use car power. League health with this tuning: in-season 2+ places 26%, winter 23%, champions 3.1 per 8 years.
- Gate off = unchanged. QA: same 16 UI-flow failures with and without this change (browser flow timeouts in this container); leadership suite passes.

## B14. Principals and directors as people, with a pool (built in 2.6.0)

Goal: a team principal (TP) and a technical director (TD) are people like drivers: profile, a pool of free agents, hire and fire, and new generations.

What exists (checked in code, 2.6.0): name, age, rating (`skill`), loyalty, contract (len, end, pay), TD `over`, TP `amb`. TDs retire from 62, TPs never retire. The winter market (`leadMarket`) builds a temporary list: expiring contracts plus (vacancies + 1) new names; whoever is not hired disappears. A TP sacked in `devWinter` is replaced at once by a random new one. There is no board actor ("board target" is only a number).

Plan:
1. Person record: id, kind, name, nat, age, rating, pot (peak rating), peak age, loyalty, career history [{season, team, rating, pay}], status (employed, free, retired). Existing saves get a record built from what they have.
2. Ageing like drivers: rating rises to the peak age (TD about 48, TP about 50), flat, then declines after about 58; retirement for both kinds.
3. Persistent pool `S.mkt.pool`: people without a job stay, age, and can be hired in any winter; retired people leave. New generation every winter: young people (TD 34 to 40, TP 38 to 44) with low rating and high pot, number set to keep the pool at about 10 TDs and 8 TPs.
4. Hire and fire: the TP hires and fires the TD (a buy-out of half the remaining contract when fired); the team (stand-in for the board, with a board target) hires and fires the TP, and a sacked TP goes into the pool and the replacement comes from the pool through the same matching (`leadFill`), not at random.
5. Profile: tap a name in Team HQ for a card like a driver profile (rating, age, nationality, contract, history, a short note on style).
6. Tuning: the market now has more candidates, so re-check league health (in-season and winter movement, champions, cash) with 24+ seeds, and the gate-off, old-save and full suite checks.

Open choices: (a) a board as a real actor, later; (b) whether the player can hire and fire (the player's own team has no such menu yet).

Built (steps 1 to 5, the player stays a driver: he gives feedback and drives; the team holds all hiring and firing power; the board stays a stand-in, the team): records with id, nationality, potential, peak age, career history; ageing (grow to the peak, flat, decline after 58); retirement (TD 62, TP 66, 50% a winter); persistent free-agent pool kept in `S.lead.pool` (not `S.mkt`, which is rebuilt each winter), about 10 TDs and 8 TPs, a first mixed-age pool for old saves; new generations of young people each winter; a principal can let a director go when he judges a free agent clearly better (gap 18 rating points, half the rest of the contract paid, at most 2 a winter); a sacked principal (`devWinter`) goes into the pool and the team hires through `leadFill`; profile card from Team HQ and from the free-agent list in the winter recap; tests in `qa/leadership.js` section 6b. League health after the change (24 seeds): TD +0.33, TP +0.33, staff +0.20 per +10 rating, in-season 2+ places 24%, winter 24%, champions 2.9 per 8 years, cash below zero 13%.

B14 screens and story pack (2.6.0): `leadStaffHTML` renders the dossier through `pdFrame` (route kind `staff`, action `pd-staff`), `leadAvatarSVG` draws the portrait (a director wears a headset, a principal a jacket and tie; skin and hair are fixed per name, grey hair from 56), `leadStaffCards` adds the Staff tab to the Paddock browser (only for the player's own F1 league with the gate on), `leadFreeAgentsHTML` the free-agent cards in the winter recap. History entries for a re-signing with the same team merge into one spell. Nationality of the fixed staff name lists comes from `LEAD_NAT` (records made by the first dev build are corrected once, flag `nv`). Story pack: `spPerson` (one line per person) and `spPeople` (winter moves, pool, retirements).

## B15. Regulations phase A and B (built on the dev branch, 2.6.2)

Why: with principals and directors as rated people, a fixed handicap on the champion (`regBalance` forcing it to about P5 or P6 on every major change) made the people meaningless at the biggest moment. Measured with the old rules: the champion stayed in the top three after a major change 1% of the time, and the director's rating did not predict the new order (rank correlation +0.04).

Phase A: major 70% of every part; minor targets one or two areas (aero, chassis, engine, never reliability), 75% of those, the rest carries over (`regMinorParts`, `regPartMix`, `regWords`).

Phase B: the new car = league average + concept (`regConcept`: director, principal, preparation, money, luck) + execution (staff); `regOffPart` spreads it over the parts (aero and chassis full, engine 30%, reliability mostly staff); minor changes use 60% of it on the targeted areas only. No forced drop for the champion. The slowest team is lifted to P8, or to P7 when it has a director rated 55 or more or prepared in time (the help follows the people, not luck). Regulation Watch exposure uses the same expectation without luck.

Measured (24 seeds x 20 seasons each): see CHANGELOG 2.6.2. Trade-off accepted by the user: fewer forced reshuffles, underdog jumps about a third of the time and mostly when the underdog has a good director.
