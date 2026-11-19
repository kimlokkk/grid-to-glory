# Regulation changes: design notes (working spec, not implemented)

Collected from the design discussion after Season 5. Nothing here is built yet. Items marked **PROPOSED** are suggested defaults that still need a decision or tuning.

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
