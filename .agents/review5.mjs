import { chromium } from 'playwright';
const OUT = '.agents/shots';
const BASE = 'http://localhost:8123/index.html';
const browser = await chromium.launch();
const errors = [];
async function page(ctx) {
  const p = await ctx.newPage();
  p.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
  await p.addInitScript(() => { HTMLMediaElement.prototype.play = () => Promise.resolve(); });
  return p;
}
// reduced motion: options should now appear promptly
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  const p = await page(ctx);
  await p.goto(BASE, { waitUntil: 'networkidle' });
  await p.click('#open-surprise-btn');
  for (let i = 0; i < 5; i++) { await p.evaluate(() => handleNoClick()); await p.waitForTimeout(50); }
  await p.evaluate(() => handleYesClick());
  await p.waitForTimeout(300); // short — options must already be visible under reduced motion
  await p.screenshot({ path: `${OUT}/rm-3-yes-fast.png` });
  await ctx.close();
}
// normal: final burst palette
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await page(ctx);
  await p.goto(BASE, { waitUntil: 'networkidle' });
  await p.click('#open-surprise-btn');
  for (let i = 0; i < 5; i++) { await p.evaluate(() => handleNoClick()); await p.waitForTimeout(50); }
  await p.evaluate(() => handleYesClick());
  await p.waitForTimeout(2000);
  await p.evaluate(() => selectFood('Netflix and Pizza 🍕📺'));
  await p.waitForTimeout(350);
  await p.screenshot({ path: `${OUT}/m-8-final-burst.png` });
  await ctx.close();
}
await browser.close();
console.log('ERRORS:', errors.length ? errors.join(' | ') : 'none');
console.log('DONE');
