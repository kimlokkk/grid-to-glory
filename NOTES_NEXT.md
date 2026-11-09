# Changes after 2.0.0 (working notes, not yet versioned)

- One world clock: F2 and F3 now run 10 rounds on 10 of the 22 F1 weekends (`JUNIOR_WEEKENDS` in foundation15.js). After each of your races the other two leagues complete every round scheduled up to that weekend (`worldSyncTo`, src/sync30.js; `worldSimulate` now resumes from `world.progress`).
- Market: selective offers (best few teams per league only, `MARKET8.offerCap`), F2 thresholds and seat costs rise with team prestige, junior team setup/crew/coaching follow prestige, F3 limited to three seasons (a final funded F2 seat is offered), F3 points can unlock F1 at 18 (harder threshold), stranded drivers retire.
- Ageing: retirement 42 (prompt 36), steeper wear bands. F1 costs: tax/agent 45% of salary + living cost.
- Dynamic ceiling: stat caps move +/-1 per season from car-relative STS (max +/-3), +1 once for academy membership.
- QA: legacy scripts start Classic via `career-mode`; scripts needing `../outputs/...` fixtures are reported as SKIP.
