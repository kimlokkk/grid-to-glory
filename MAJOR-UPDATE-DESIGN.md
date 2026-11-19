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

- Whether the car re-roll (`dev2.js`) and the era profile (`world21.js`) always apply on the same winter. Confirm with a test before writing news around either.
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

## E2. Triage (to do)

Everything stays in the major update until reviewed. Then choose which items ship early as small patches. Items that need no new game state or balance work are the likeliest candidates (Part A section 5, steward ruling display), but this is not decided.

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
