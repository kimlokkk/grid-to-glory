# Bugs to fix later

## 1. Negative wallet blocks signing a contract that costs nothing

**Found:** 2026-11-11, while reviewing the Career tab with a fast-forwarded F1 career (not yet reproduced in normal play).

**Where:** `src/market22.js`, `marketAccept`, the line `if(o.package.own>g.wallet.balance)return false;`

**What happens:** when the wallet balance is negative, every offer is refused with the toast
"Offer unavailable, requirements unmet or funding insufficient." This includes offers where the
driver pays $0 (`o.package.own === 0`), because `0 > -0.25` is true.

**Why the wallet goes negative:** in F1 the salary is posted per round (a $1.0M salary is $45K per
round), while "Tax, agent and living costs" takes $57K per round. A rookie with no sponsor starts at
$0 and loses about $11K per race. After 14 rounds the balance was -$159K, and -$250K at season end.

**Effect:** an F1 driver without sponsors can end the season unable to sign any contract.

**Suggested fix:** only check funds when the contract has a payment:
`if(o.package.own>0&&o.package.own>g.wallet.balance)return false;`

**Related, decide separately:** whether running costs should exceed a rookie F1 salary at all. The new
Career wallet shows the per-round net so the player can see it.

**Also:** the failure toast merges three different reasons. Say which one applied.

## 2. Malay word "trafik" shown in the qualifying table

**Found:** 2026-11-11, Q1 results, F1 career. A row read "ASH Ashby trafik".

**Where:** `src/ui5.js` line 52, in `vQuali`. A yellow flag is printed as "yellow flag", but every other
lap event falls through to the literal string `'trafik'`.

**Suggested fix:** change that literal to `'traffic'`.

**Status (2026-11-12):** no longer visible. The new qualifying screen (`src/quali37.js`) replaces this table and
prints "Traffic". The old literal is still in `src/ui5.js` but that code path is no longer rendered.
