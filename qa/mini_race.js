const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const pg = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errs = []; pg.on('pageerror', e => errs.push(e.stack.split('\n').slice(0, 3).join('|')));
  await pg.clock.install(); await pg.goto(require('url').pathToFileURL(require('path').resolve(__dirname, '../index.html')).href); await pg.clock.runFor(500);
  const has = async s => !!(await pg.$(s)); const click = async s => { const el = await pg.$(s); if (!el) return false; try { await el.click({ timeout: 1500 }); return true; } catch (e) { return false; } }; const tick = ms => pg.clock.runFor(ms);
  const acts = async () => pg.$$eval('[data-act]', els => els.filter(e => e.getBoundingClientRect().width > 0).map(e => e.dataset.act + (e.dataset.v ? ':' + e.dataset.v : '')));
  await click('[data-act=new]'); await tick(300); await pg.evaluate("A['new-go']()"); await tick(300);
  await click('[data-act=wk-start]'); await tick(400);
  for (let z = 0; z < 40; z++) { if (await has('[data-act=q-next]')) break; if (await has('[data-act=mg-go]')) { await click('[data-act=mg-go]'); await tick(600); continue; } if (await has('[data-act=mg-auto]')) { await click('[data-act=mg-auto]'); await tick(600); continue; } if (await has('[data-act=mg-ok]')) { await click('[data-act=mg-ok]'); await tick(400); continue; } if (!(await click('[data-act=q-fin]'))) await click('[data-act=q-play]'); await tick(500); }
  await click('[data-act=q-next]'); await tick(300); await click('[data-act=s-go]'); await tick(500);
  let last = '', same = 0, seen = {};
  for (let i = 0; i < 1400; i++) {
    await tick(250);
    if (await has('[data-act=r-done]')) { console.log('RACE DONE at tick', i); break; }
    const a = await acts(); a.forEach(x => seen[x] = (seen[x] || 0) + 1);
    const lap = await pg.evaluate("RUN && RUN.R ? RUN.R.p.lap + '/' + (RUN.wait ? 'WAIT' : 'run') + '/' + (RUN.pause ? 'PAUSE' : '') : '-'");
    if (lap === last) same++; else { same = 0; last = lap; }
    for (const x of ['pc-yes', 'mg-go', 'mg-begin', 'mg-auto', 'mg-ok', 'r-ff']) if (a.includes(x)) { await click('[data-act=' + x + ']'); break; }
    if (same >= 6 && same % 6 === 0 && (await has('#modal button'))) { await pg.evaluate("document.querySelector('#modal button').click()"); await tick(400); }
    if (same === 140) { console.log('STUCK at', lap, 'acts:', a.join(' ')); console.log('modal:', await pg.evaluate("(document.querySelector('#modal')||{}).innerText||''".replace(/\n/g,' ')).then(t => String(t).replace(/\s+/g, ' ').slice(0, 300))); await pg.screenshot({ path: 'mini_stuck.png' }); break; }
  }
  console.log('seen actions:', Object.keys(seen).join(' '));
  console.log('ERRS', JSON.stringify(errs)); await b.close();
})();
