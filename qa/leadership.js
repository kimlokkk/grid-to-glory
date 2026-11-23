/* Leadership: rating scale, gate and migration, decisions, feedback for every team, staff market, news cap, save round trip. */
const { chromium } = require('playwright');
const { assert, chooseStyle } = require('./flow');
const { pathToFileURL } = require('node:url');
const path = require('node:path');
(async () => {
  const browser = await chromium.launch(), errors = [];
  try {
    const pg = await browser.newPage();
    pg.on('pageerror', e => errors.push(e.message));
    await pg.goto(pathToFileURL(path.resolve(__dirname, '../index.html')).href);
    await pg.waitForTimeout(400);
    const rows = await pg.evaluate(() => {
      const rows = [], ck = (n, p, d) => rows.push({ n, p: !!p, d });
      const play = n => { for (let i = 0; i < n; i++) { const ci = S.cal[S.round], R = runRace2(S, ci, qualiGrid2(S, ci), {}); let fl = null; R.cars.forEach(f => { if (!f.dnf && f.best < 900 && (!fl || f.best < fl.best)) fl = f; }); R.fl = { di: fl.di, t: fl.best }; finishRace(S, { ci: R.ci, c: R.c, fl: R.fl, cls: R.cls.map(f => ({ car: { d: f.d, di: f.di, isP: f.isP, grid: f.grid, dnf: f.dnf }, pos: f.pos, dnf: !!f.dnf })) }, 4); } };
      const nextSeason = () => { endSeason(S); startNewSeason(S, S.offers && S.offers[0] ? S.offers[0].team : null, S.offers && S.offers[0] ? S.offers[0].years : null); };
      /* 1. scale */
      ck('rating <-> multiplier round trip on all three scales', ['td', 'tp', 'staff'].every(k => [0, 25, 50, 75, 100].every(r => leadRating(k, leadMul(k, r)) === r)));
      ck('rating 0 / 100 = the weakest / strongest multiplier; asking pay rises with rating', leadMul('td', 0) === 0.8 && leadMul('td', 100) === 1.2 && leadAsk(80) > leadAsk(20));
      /* 2. new career is on; gate rules */
      seedRnd(21); S = newProCareer('Lead', 'pace', 7, 'f1');
      ck('a new career starts with Leadership on', S.lead && S.lead.v === 1 && S.lead.from === 1 && leadOn(S));
      ck('director rating is stored on the person and equals the team value', S.teams.every(t => !t.dev.tdp || t.dev.tdp.skill === t.dev.td));
      const mk = (round) => { const o = JSON.parse(JSON.stringify(S)); delete o.lead; o.round = round; o.season = 5; return o; };
      let o = mk(0); leadMigrate(o); ck('save with nothing played this season: on straight away', o.lead.from === 5 && leadOn(o));
      o = mk(7); leadMigrate(o); ck('save part-way through a season: on from the next new season', o.lead.from === 6 && !leadOn(o) && leadOn(o, 6));
      const before = JSON.stringify(o.lead); leadMigrate(o); ck('migration runs only once', JSON.stringify(o.lead) === before);
      const o2 = mk(7), p0 = o2.teams.map(t => teamPower(t)), td0 = o2.teams.map(t => t.dev.td); leadMigrate(o2);
      ck('migration changes nobody\'s strength', o2.teams.every((t, i) => teamPower(t) === p0[i] && t.dev.td === td0[i]));
      const sp = JSON.parse(JSON.stringify(S)); sp.teams[0].spec = true; ck('junior series never use it', !leadOn(sp));
      /* 3. gate off keeps the old winter random walk, gate on removes it */
      seedRnd(22); S = newProCareer('Lead2', 'pace', 7, 'f1'); play(seasonRounds(S));
      const t0 = S.teams.map(t => t.dev.td); S.lead.from = 99; const logA = []; devWinter(S, logA); const changedOff = S.teams.some((t, i) => t.dev.td !== t0[i]);
      seedRnd(22); S = newProCareer('Lead2', 'pace', 7, 'f1'); play(seasonRounds(S)); const t1 = S.teams.map(t => t.dev.td); devWinter(S, []); const changedOn = S.teams.some((t, i) => t.dev.td !== t1[i]);
      ck('old system: director quality random-walks each winter; Leadership: it does not', changedOff && !changedOn, { changedOff, changedOn });
      /* 4. decision odds */
      const T = S.teams[3], odds = (tp, td) => { T.dev.tp.skill = leadMul('tp', tp); T.dev.td = leadMul('td', td); return leadOdds(S, T); };
      const a = odds(10, 10), b = odds(10, 95), c = odds(90, 10), d = odds(90, 95);
      ck('odds follow the design: weak principal + great director beats weak + weak; great + great is best', b.right > a.right + 0.15 && d.right > c.right && d.right > b.right && a.right > 0.55 && d.right < 0.95, [a.right, b.right, c.right, d.right]);
      /* 4b. a mistake is a near miss, not a package poured into a maxed part */
      { const W = S.teams[3], keep = JSON.stringify(W.car), pn = pushNews; pushNews = () => { }; W.car = { aero: 99, engine: 70, chassis: 68, rel: 77 }; PARTS.forEach(k => W.dev.phil[k] = 1);
        W.dev.tp.skill = leadMul('tp', 0); W.dev.td = leadMul('td', 0); S.drivers.filter(x => x.team === W.id).forEach(x => x.fb = 55);
        const tops = { aero: 99, engine: 92, chassis: 90, rel: 90 }, cnt = { aero: 0, engine: 0, chassis: 0, rel: 0 }; for (let i = 0; i < 3000; i++) { S.lead.ev = {}; cnt[leadPickPart(S, W, tops)]++; }
        pushNews = pn; W.car = JSON.parse(keep);
        ck('even the weakest principal and director almost never pick a part that is already maxed', cnt.aero / 3000 < 0.01 && (cnt.engine + cnt.chassis) / 3000 > 0.85, cnt); }
      /* 4c. director: probability, not certainty */
      { const W = S.teams[4], draw = (r) => { W.dev.td = leadMul('td', r); let q = 0, f = 0, hit = 0, N = 6000; for (let i = 0; i < N; i++) { const p = leadPackage(S, W); q += p.q; f += p.fail; if (p.q > 1) hit++; } return { q: q / N, fail: f / N, hit: hit / N }; };
        const lo = draw(0), hi = draw(100), mid = draw(50);
        ck('a good director: more hits, less failure, better average package; a weak one the reverse; nobody certain', hi.q > lo.q + 0.25 && hi.fail < lo.fail * 0.6 && hi.hit > lo.hit * 3 && hi.hit < 0.7 && lo.hit > 0.03 && Math.abs(mid.q - 1) < 0.08, { lo, mid, hi }); }
      /* 4d. principal: when to stop and readiness for new rules */
      { const W = S.teams[5], ranks = {}; S.teams.forEach(t => ranks[t.id] = 5); ranks[W.id] = W.dev.target + 4;
        const rate = (r) => { W.dev.tp.skill = leadMul('tp', r); let ok = 0; for (let i = 0; i < 2000; i++) { W.dev.banked = false; if (leadShelve(S, W, ranks, seasonMilestone(S, 7), false)) ok++; } return ok / 2000; };
        const weak = rate(5), strong = rate(95); ck('a good principal shelves a lost season far more often than a weak one', strong > 0.85 && weak < 0.4, { weak, strong });
        S.regYear = S.season + 1; const ready = (r) => { W.dev.tp.skill = leadMul('tp', r); let ok = 0; for (let i = 0; i < 2000; i++) { W.dev.banked = false; W.dev.regDecided = false; W.dev.regReady = false; leadShelve(S, W, { [W.id]: 1 }, seasonMilestone(S, 7), false); if (W.dev.regReady) ok++; } return ok / 2000; };
        const rw = ready(5), rs = ready(95); W.dev.regReady = true; const pr1 = regPrep(W); W.dev.regReady = false; const pr0 = regPrep(W); S.regYear = 99;
        ck('a good principal prepares for new rules far more often, and preparation softens the fall', rs > 0.85 && rw < 0.45 && pr1 > pr0, { rw, rs, pr0, pr1 }); }
      /* 4e. the driver no longer steers R&D */
      { UI.screen = 'hub'; UI.tab = 'team'; render(); const on = document.querySelectorAll('[data-act=rd]').length; const keep = S.lead; S.lead = { v: 1, from: 99 }; render(); const off = document.querySelectorAll('[data-act=rd]').length; S.lead = keep; render();
        ck('with Leadership the R&D focus buttons are gone; without it they stay', on === 0 && off === 4, { on, off }); }
      /* 4f. principal and drivers/money */
      { const W = S.teams[6], d0 = S.drivers.find(x => x.team !== W.id); const eye = (r) => { W.dev.tp.skill = leadMul('tp', r); let ss = 0, N = 60; for (let i = 0; i < N; i++) ss += Math.pow(leadEye(S, W, { uid: 'u' + i }), 2); return Math.sqrt(ss / N); };
        const pay = (r) => { W.dev.tp.skill = leadMul('tp', r); return leadPayMul(S, W); };
        ck('a weak principal misjudges drivers more and pays more for them; a good one the reverse', eye(0) > eye(100) * 2.5 && pay(0) > 1.05 && pay(100) < 0.97, [eye(0), eye(100), pay(0), pay(100)]);
        const k = S.lead; S.lead = { v: 1, from: 99 }; ck('with the gate off these never apply', leadEye(S, W, d0) === 0 && leadPayMul(S, W) === 1); S.lead = k; }
      /* 5. feedback reaches every team */
      const aiT = S.teams.find(t => S.drivers[S.pi].team !== t.id), ds = S.drivers.filter(x => x.team === aiT.id);
      ds.forEach(x => x.fb = 95); const hi = leadFbGain(S, aiT); ds.forEach(x => x.fb = 55); const lo = leadFbGain(S, aiT);
      ck('driver feedback changes an AI team\'s upgrade gain (it used to be the player\'s team only)', hi > 1.1 && lo < 0.95, [hi, lo]);
      /* 6. market */
      seedRnd(23); S = newProCareer('Lead3', 'pace', 7, 'f1'); const ratings = [], names = new Set(); let dup = 0;
      for (let y = 0; y < 6; y++) { play(seasonRounds(S)); nextSeason(); S.teams.forEach(t => { ratings.push(leadRating('td', t.dev.td)); }); const nm = S.teams.map(t => t.dev.tdp && t.dev.tdp.name), tp = S.teams.map(t => t.dev.tp && t.dev.tp.name); if (new Set(nm).size !== nm.length || nm.includes(null) || new Set(tp).size !== tp.length) dup++; }
      ck('after every winter each team has one director and one principal, no one twice', dup === 0, dup);
      ck('director ratings spread without piling up at 0 or 100', ratings.filter(r => r <= 3 || r >= 97).length / ratings.length < 0.05, ratings.filter(r => r <= 3 || r >= 97).length + '/' + ratings.length);
      ck('every director has a contract that has not ended and a salary', S.teams.every(t => t.dev.tdp.con && t.dev.tdp.con.end >= S.season && t.dev.tdp.con.pay >= 1), S.teams.map(t => t.dev.tdp.con));
      /* 7. overrule news is capped to one per team and season */
      const ev = Object.keys(S.lead.ev || {}); ck('at most one overrule story per team and season', ev.length === new Set(ev).size);
      /* 8. save round trip */
      save(); const L = loadSave(); ck('the gate survives save and load', L.lead && L.lead.v === 1 && L.lead.from === S.lead.from);
      /* 9. classic mode */
      A.new(); A['career-mode']({ v: 'classic' }); A['new-go'](); ck('classic career gets it too and plays a season without error', S.lead && S.lead.v === 1 && (play(seasonRounds(S)), true));
      return rows;
    });
    for (const r of rows) console.log((r.p ? 'PASS ' : 'FAIL ') + r.n + (r.p ? '' : ' ' + JSON.stringify(r.d)));
    assert.deepEqual(rows.filter(r => !r.p).map(r => r.n), []);
    console.log('ERRS', errors); assert.deepEqual(errors, []);
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exit(1); });
