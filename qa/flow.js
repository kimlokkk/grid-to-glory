/* Shared UI steps: honour modal click protection and exercise the real actions. */
const assert = require('node:assert/strict');

async function waitUI(pg, clock = false) {
  if (clock) await pg.clock.runFor(700);
  else await pg.waitForTimeout(700);
}

async function clickUI(pg, selector, clock = false) {
  const button = pg.locator(selector);
  if (!(await button.count())) return false;
  // Virtual time must advance for transient notices to disappear.
  if (await pg.locator('.toast').count()) {
    if (clock) await pg.clock.runFor(2700);
    else await pg.waitForTimeout(2700);
  }
  // Keep mobile controls clear of the fixed bottom navigation.
  await button.evaluate(el => el.scrollIntoView({ block: 'center', inline: 'center' }));
  await button.click({ timeout: 5000 });
  return true;
}

async function chooseStyle(pg, clock = false) {
  await waitUI(pg, clock);
  await pg.locator('[data-act=onb-style][data-v=casual]').click();
  assert.equal(await pg.evaluate('S.settings.style'), 'casual');
}

async function seasonIntro(pg, clock = false) {
  if (await pg.locator('[data-act=cm-ok]').count()) {
    await waitUI(pg, clock);
    await pg.locator('[data-act=cm-ok]').click();
  }
  if (await pg.locator('[data-act=pre-a]').count()) {
    await waitUI(pg, clock);
    await pg.locator('[data-act=pre-a]').first().click();
    await waitUI(pg, clock);
    await pg.locator('[data-act=pre-ok]').click();
  }
}

async function signOffer(pg, reserve = false, clock = false) {
  const season = await pg.evaluate('S.season');
  await pg.locator('[data-act=sign-pre][data-sit="' + (reserve ? 1 : 0) + '"]').first().click();
  await waitUI(pg, clock);
  await pg.locator('#modal [data-act=sign]').click();
  assert.equal(await pg.evaluate('S.season'), season + 1, 'sign advances one season');
  assert.equal(await pg.evaluate('!!S.sit'), reserve, 'correct contract type');
  assert.equal(await pg.locator('#modal .contract').count(), 0, 'signed contract must close');
  await seasonIntro(pg, clock);
  assert.equal(await pg.locator('#modal > *').count(), 0, 'season is ready to play');
}

module.exports = { assert, chooseStyle, seasonIntro, signOffer, waitUI, clickUI };
