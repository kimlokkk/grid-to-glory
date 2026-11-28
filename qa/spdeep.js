/* Story pack race analysis from a real live race: lap-by-lap for the player, race pace, lap chart, and who decided each pit stop (engineer's call accepted or declined, the player's own button). */
const { chromium } = require('playwright');
const { assert, chooseStyle, clickUI } = require('./flow');
(async () => {
  const b = await chromium.launch(); const pg = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errs = []; pg.on('pageerror', e => errs.push(e.stack.split('\n').slice(0, 4).join('|')));
  await pg.clock.install(); await pg.goto(require('url').pathToFileURL(require('path').resolve(__dirname, '../index.html')).href); await pg.clock.runFor(500);
  const has = async s => !!(await pg.$(s)); const click = s => clickUI(pg, s, true); const tick = ms => pg.clock.runFor(ms);
  await click('[data-act=new]'); await tick(300); await pg.evaluate("A['career-mode']({v:'classic'}); A['new-go']()"); await tick(300); await chooseStyle(pg, true); await pg.evaluate("S.settings.mini=false; S.settings.ask=true; save()");
  await click('[data-act=wk-start]'); await tick(300);
  for (let z = 0; z < 8; z++) { if (await has('[data-act=q-next]')) break; if (!(await click('[data-act=q-fin]'))) await click('[data-act=q-play]'); await tick(300); }
  await pg.evaluate("A['q-next']()"); await tick(300); await pg.evaluate("seedRnd(SEEDX); A['s-go']()".replace('SEEDX', String(process.env.SPSEED || 21))); await tick(1500);
  assert.equal(await pg.evaluate('!!S.live'), true, 'race must actually start');
  await click('[data-act=r-fast]');
  let cards = 0, manual = false;
  for (let i = 0; i < 6000; i++) {
    await tick(250); if (await has('[data-act=r-done]')) break;
    if (!(await has('#modal [data-act=pc-yes]')) && await has('#modal .mbox [data-act]')) { await pg.evaluate(() => { const m = document.querySelector('#modal .mbox'), b = m && (m.querySelector('[data-act=mclose]') || m.querySelector('.opt[data-act]') || m.querySelector('[data-act]')); if (b && A[b.getAttribute('data-act')]) A[b.getAttribute('data-act')]({ v: b.getAttribute('data-v'), i: b.getAttribute('data-i') }); }); await tick(250); continue; }
    if (await has('#modal [data-act=pc-yes]')) { cards++; await pg.evaluate(n => A[n === 1 ? 'pc-no' : 'pc-yes']({}), cards); await tick(250); continue; }
    if (!cards && await pg.evaluate('RUN && RUN.R && RUN.R.p.lap >= 3 && !RUN.R.p.pitReq && !RUN.wait && !RUN.R.p.fin && !RUN.R.p.dnf')) await pg.evaluate("(()=>{const p=RUN.R.p;p.pitReq=p.comp==='H'?'M':'H';p.why='pelan';p.pitOk=false;})()");
    if (!manual && await pg.evaluate('RUN && RUN.R && RUN.R.p.lap >= Math.round(RUN.R.L * 0.6) && !RUN.R.p.pitReq && !RUN.wait && !RUN.R.p.hold && !document.querySelector("#modal .mbox")')) {
      manual = await pg.evaluate("(()=>{A['r-pitm']();const c=RUN.R.p.comp==='S'?'M':'S';A['r-pit']({v:c});A['r-pit-confirm']();return !!RUN.R.p.pitReq})()"); await tick(300);
    }
  }
  if (!(await has('[data-act=r-done]'))) console.log('STUCK', await pg.evaluate(() => JSON.stringify({ lap: RUN && RUN.R && RUN.R.p.lap, L: RUN && RUN.R && RUN.R.L, wait: RUN && RUN.wait, pause: RUN && RUN.pause, done: RUN && RUN.R && RUN.R.done, pitOpen: UI.pitOpen, modal: (document.querySelector('#modal') || {}).innerText ? document.querySelector('#modal').innerText.slice(0, 200) : '', acts: [...document.querySelectorAll('#modal [data-act]')].map(e => e.getAttribute('data-act')).slice(0, 8) })));
  assert.equal(await has('[data-act=r-done]'), true, 'race reaches the flag');
  const r = await pg.evaluate(() => { const rec = S.rr[S.rr.length - 1], d = rec.dp || {}; const t = storyPackText('latest'); return { has: !!rec.dp, dnf: (rw => !!rw && !rw[2])(rec.c.find(x => x[0] === S.drivers[S.pi].name)), laps: rec.laps, pl: (d.pl || []).length, pace: (d.pace || []).length, lc: (d.lc || []).length, pd: (d.pd || []).map(x => x[1]), size: JSON.stringify(rec.dp || {}).length, txt: t.slice(t.indexOf('Race pace'), t.indexOf('Race pace') + 200), dec: t.split('\n').filter(l => /^  L\d+ (the engineer|your own|the team|you cancelled)/.test(l)) }; });
  console.log(JSON.stringify({ cards, manual, ...r, txt: undefined }, null, 0)); console.log(r.txt); console.log(r.dec.join('\n'));
  const rows = [], ck = (n, p, d) => rows.push({ n, p: !!p, d });
  ck('the race summary is recorded', r.has && (r.pl === r.laps || r.dnf) && r.pace >= 15 && r.lc >= 4, [r.pl, r.laps, r.pace, r.lc]);
  ck('the summary is small (under 3 KB a race)', r.size < 3000, r.size);
  ck('an accepted engineer call is recorded as the team\'s call', r.pd.indexOf('call') >= 0 || cards < 2, r.pd);
  ck('a declined call is recorded', cards >= 1 && r.pd.indexOf('stay') >= 0, [cards, r.pd]);
  ck('the player\'s own pit button is recorded apart', !manual || r.pd.indexOf('self') >= 0, r.pd);
  ck('the story pack tells them apart', r.dec.length >= r.pd.filter(x => x !== 'auto').length && (!manual || r.dec.some(l => /your own call/.test(l))), r.dec);
  for (const x of rows) console.log((x.p ? 'PASS ' : 'FAIL ') + x.n + (x.p ? '' : ' ' + JSON.stringify(x.d)));
  assert.deepEqual(rows.filter(x => !x.p).map(x => x.n), []);
  console.log('ERRS', JSON.stringify(errs)); assert.deepEqual(errs, []); await b.close();
})().catch(e => { console.error(e); process.exit(1); });
