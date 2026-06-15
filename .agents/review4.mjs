import { chromium } from 'playwright';
const OUT = '.agents/shots';
const BASE = 'http://localhost:8123/index.html';
const browser = await chromium.launch();
const errors = [];

async function newPage(ctx) {
  const page = await ctx.newPage();
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('CONSOLE: ' + m.text()); });
  await page.addInitScript(() => { HTMLMediaElement.prototype.play = () => Promise.resolve(); });
  return page;
}

// Normal motion, full flow + a mid-reveal frame
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await newPage(ctx);
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  await page.click('#open-surprise-btn');
  await page.waitForTimeout(350); // mid reveal (overlay lifting/blurring, card settling)
  await page.screenshot({ path: `${OUT}/m-1-reveal-mid.png` });
  await page.waitForTimeout(900);
  await page.screenshot({ path: `${OUT}/m-2-main-settled.png` });
  // toast (yes-tease) appearing
  await page.evaluate(() => handleYesClick());
  await page.waitForTimeout(180);
  await page.screenshot({ path: `${OUT}/m-3-toast-midfade.png` });
  // growth
  for (let i = 0; i < 5; i++) { await page.evaluate(() => handleNoClick()); await page.waitForTimeout(120); }
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${OUT}/m-4-grown.png` });
  // yes -> confetti + entrance
  await page.evaluate(() => handleYesClick());
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${OUT}/m-5-yes-entrance.png` });
  await page.waitForTimeout(2200);
  await page.screenshot({ path: `${OUT}/m-6-yes-options.png` });
  await page.evaluate(() => selectFood('Cafe Hopping ☕🍰'));
  await page.waitForTimeout(700);
  await page.screenshot({ path: `${OUT}/m-7-final.png` });
  await ctx.close();
}

// Reduced motion: ensure no errors, states render, confetti guard path runs
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  const page = await newPage(ctx);
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.click('#open-surprise-btn');
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUT}/rm-1-main.png` });
  for (let i = 0; i < 5; i++) { await page.evaluate(() => handleNoClick()); await page.waitForTimeout(60); }
  await page.evaluate(() => handleYesClick());
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${OUT}/rm-2-yes.png` });
  await ctx.close();
}

await browser.close();
console.log('ERRORS:', errors.length ? errors.join(' | ') : 'none');
console.log('DONE');
