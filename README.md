# Grid to Glory

**Your seat. Your strategy. Your championship.**

A single-file, browser-based motorsport career game. Create a driver, fight for a seat, start at 16 in F3, progress through F2 to F1, race a 22-round F1 calendar, develop your skills and chase the world title, from the back of the grid to the top of the paddock.

**Play:** https://kimlokkk.github.io/grid-to-glory/

## Features
- Full career mode: contracts, offers, buyouts, reputation, sponsors and press conferences
- Qualifying, pit stops, tyres, weather, safety cars and optional mini-games (or just auto-run the race)
- A living grid: AI teams develop their cars, manage budgets, change plans, and hire and sack drivers
- Teammate rapport, team orders and a Pro comeback opportunity; Classic reserve careers remain supported
- Facilities, engine alliances, team loans and young driver tests
- Final-race radio, end-of-season review, circuit history, and a career that ages (Pro retirement at 45; Classic rules preserved)

## Saving
Progress is stored in your browser (localStorage), so it stays on the device and browser you play on. Use **Export save** / **Import save** to move a career between devices.

## Project layout
```
index.html        built game (this is what GitHub Pages serves)
build.sh          concatenates src/ into index.html
src/              source: head.html, style.css and the JS modules (order is set in build.sh)
qa/               regression scripts (Playwright); qa/all.sh runs them all
```
The game itself has no dependencies. Playwright is only needed for the tests.

## Development
```
bash build.sh                  # rebuild index.html from src/
npm install && npx playwright install chromium
bash qa/all.sh --quick         # regression suite (about 1 minute)
bash qa/all.sh                 # plus full-season e2e and monkey test (about 3 minutes)
```
Module files share one global scope and are loaded in the order listed in `build.sh`, so global function names must be unique. `qa/all.sh` checks this.

## Notes
- No server, no account, no tracking. It is one `index.html`.
- All teams, drivers and circuits are fictional. Not affiliated with any real racing series.
- Version 2.0.0
