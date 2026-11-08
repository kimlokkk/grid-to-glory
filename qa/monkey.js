/* Ujian monyet: klik rawak pada kawalan UI sambil memantau ralat, teks NaN/undefined dan limpahan mendatar. Guna: node monkey.js [langkah] [seed] */
const { chromium } = require('playwright');
const { chooseStyle } = require('./flow');
(async () => {
  const steps = Number(process.argv[2] || 600), seed = Number(process.argv[3] || 1);
  let s = seed * 9301 + 49297; const R = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
  const b = await chromium.launch(); const pg = await b.newPage({ viewport: { width: 360, height: 780 } });
  const errs = new Set(), findings = new Map(), trail = [];
  pg.on('pageerror', e => errs.add(e.message + ' @ ' + trail.slice(-3).join(' > ')));
  pg.on('console', m => { if (m.type() === 'error') errs.add('console: ' + m.text().slice(0, 160)); });
  await pg.goto(require('url').pathToFileURL(require('path').resolve(__dirname, '../index.html')).href); await pg.waitForTimeout(300);
  await pg.click('[data-act=new]'); await pg.evaluate("seedRnd(" + seed + "); UI.draft.arch=['pace','cons','wet','race'][" + (seed % 4) + "]; UI.draft.team=" + [9, 8, 7, 6, 3][seed % 5] + "; A['new-go']()"); await pg.waitForTimeout(300);
  await chooseStyle(pg);
  await pg.evaluate("S.settings.mini=false; S.settings.ask=false; save()");
  const ff = "(function(){ try { var n=0; while(S.round<10 && !S.sit && n++<12){ var ci=S.cal[S.round]; var Rr=runRace2(S,ci,qualiGrid2(S,ci),{}); var fl=null; Rr.cars.forEach(function(f){ if(!f.dnf&&f.best<900&&(!fl||f.best<fl.best)) fl=f;}); Rr.fl={di:fl?fl.di:-1,t:fl?fl.best:0}; finishRace(S,{ci:Rr.ci,c:Rr.c,fl:Rr.fl,cls:Rr.cls.map(function(f){return {car:{d:f.d,di:f.di,isP:f.isP,grid:f.grid,dnf:f.dnf},pos:f.pos,dnf:!!f.dnf};})},4);} UI.wk=null; UI.screen='hub'; UI.tab='utama'; render(); return 'ok'; } catch(e){ return 'ERR '+e.message } })()";
  const scan = () => pg.evaluate(() => { const t = document.body.innerText, bad = []; ['NaN', 'undefined', '[object', 'Infinity', 'null'].forEach(k => { if (t.includes(k)) bad.push(k); }); return { bad, ow: document.documentElement.scrollWidth - innerWidth, scr: (window.UI && UI.screen) + '/' + (UI.tab || '') + '/' + (UI.wk ? UI.wk.step : ''), n: document.querySelectorAll('[data-act]').length }; });
  const BL = /^(wipe|wipe-go|new|new-go|r-fast|wk-quit)$/;
  let stuck = 0, seasons = 0, acted = {}; const T0 = Date.now(), BUD = Number(process.argv[4] || 200) * 1000; let done = 0;
  for (let i = 0; i < steps && Date.now() - T0 < BUD; i++) {
    done = i; const sc = await scan();
    if (sc.bad.length) { const k = sc.bad.join(',') + ' @ ' + sc.scr; if (!findings.has(k)) findings.set(k, trail.slice(-4).join(' > ')); }
    if (sc.ow > 2) { const k = 'overflow ' + sc.ow + 'px @ ' + sc.scr; if (!findings.has(k)) findings.set(k, trail.slice(-4).join(' > ')); }
    /* kerap-kerap lompat musim supaya skrin hujung musim, tawaran dan tahun simpanan diliputi */
    const st = await pg.evaluate("S.round>=10 ? 'done' : 'play'");
    const modalOpen = await pg.locator('#modal > *').count() > 0;
    if (!modalOpen && st === 'done' && !(await pg.$('[data-act=season-end]')) && !(await pg.$('[data-act=rev-done]')) && !(await pg.$('[data-act=sign-pre]')) && !(await pg.$('[data-act=sign]')) && !(await pg.$('[data-act=next-season]'))) { await pg.evaluate("UI.screen='hub'; UI.tab='utama'; render()"); }
    if (!modalOpen && R() < 0.025 && st === 'play') { const r = await pg.evaluate(ff); if (r !== 'ok') findings.set('ff ' + r, trail.slice(-3).join(' > ')); trail.push('FF'); continue; }
    if (!modalOpen && R() < 0.3 && (await pg.evaluate("UI.screen==='hub'"))) { const tb = ['musim', 'kal', 'kej', 'kereta', 'saya'][Math.floor(R() * 5)]; trail.push('TAB:' + tb); await pg.evaluate("UI.tab='" + tb + "'; render()"); await pg.waitForTimeout(30); }
    const acts = await pg.$$eval('[data-act], [data-tap]', els => { const modal = document.querySelector('#modal'); if (modal && modal.children.length) els = Array.from(modal.querySelectorAll('[data-act], [data-tap]')); return els.filter(e => { const r = e.getBoundingClientRect(), cs = getComputedStyle(e); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && !e.disabled; }).map(e => ({ a: e.dataset.act || e.dataset.tap, attr: e.dataset.tap ? 'data-tap' : 'data-act', v: e.dataset.v || '', t: (e.innerText || '').slice(0, 24).replace(/\s+/g, ' '), i: e.dataset.i || '' })); });
    const ok = acts.filter(x => !BL.test(x.a));
    if (!ok.length) { stuck++; findings.set('NO CONTROLS @ ' + sc.scr, trail.slice(-4).join(' > ')); break; }
    /* utamakan tindakan yang memajukan musim */
    const adv = ok.filter(x => /^(season-end|rev-done|sign-pre|sign|next-season|sit-next|sit-ff|wk-start)$/.test(x.a));
    const rest = ok.filter(x => !/^(tab|menu|prof|tprof|nw-all|retire|season-end|rev-done|sign-pre|sign|next-season|wk-start)$/.test(x.a)); const pick = (adv.length && R() < 0.12) ? adv[Math.floor(R() * adv.length)] : (rest.length && R() < 0.8) ? rest[Math.floor(R() * rest.length)] : ok[Math.floor(R() * ok.length)];
    if (R() < 0.05) await pg.evaluate('S.xp += 150');
    acted[pick.a] = (acted[pick.a] || 0) + 1; trail.push(pick.a + (pick.v ? ':' + pick.v : ''));
    if (pick.a === 'wk-start') { /* sertai terus hujung race melalui lompat */ const r = await pg.evaluate(ff); trail.push('FF'); continue; }
    try { await pg.click('[' + pick.attr + '="' + pick.a + '"]' + (pick.v ? '[data-v="' + pick.v + '"]' : '') + (pick.i ? '[data-i="' + pick.i + '"]' : ''), { timeout: 700 }); } catch (e) { }
    await pg.waitForTimeout(40);
    const season = await pg.evaluate('S.season'); if (season > seasons) seasons = season;
    if (await pg.evaluate("!!document.querySelector('#modal > *') && !document.querySelector('#modal [data-tap]')")) { await pg.waitForTimeout(250); if (R() < 0.5) await pg.evaluate("closeModal()"); }
  }
  console.log(JSON.stringify(acted)); console.log('seasons reached', seasons, 'stuck', stuck, 'distinct actions', Object.keys(acted).length);
  console.log('ERRORS', errs.size); errs.forEach(e => console.log('  ', e.slice(0, 300)));
  console.log('FINDINGS', findings.size); findings.forEach((v, k) => console.log('  ', k, '<=', v.slice(0, 200)));
  await b.close();
  if (errs.size || findings.size) process.exitCode = 1;
})();
