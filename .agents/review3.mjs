import { chromium } from 'playwright';
const OUT = '.agents/shots';
const BASE = 'http://localhost:8123/index.html';
const browser = await chromium.launch();

async function flow(name, vp, mobile, mode) {
  const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: mobile ? 2 : 1, isMobile: mobile });
  const page = await ctx.newPage();
  await page.addInitScript(() => { HTMLMediaElement.prototype.play = () => Promise.resolve(); });
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  if (mode === 'intro') { await page.screenshot({ path: `${OUT}/${name}.png` }); await ctx.close(); console.log(name); return; }
  await page.click('#open-surprise-btn');
  await page.waitForTimeout(900);
  if (mode === 'main') { await page.screenshot({ path: `${OUT}/${name}.png` }); await ctx.close(); console.log(name); return; }
  for (let i = 0; i < 5; i++) { await page.evaluate(() => handleNoClick()); await page.waitForTimeout(80); }
  await page.evaluate(() => handleYesClick());
  await page.waitForTimeout(2400);
  await page.screenshot({ path: `${OUT}/${name}.png` });
  await ctx.close();
  console.log(name);
}

await flow('v2-desktop-main', { width: 1440, height: 900 }, false, 'main');
await flow('v2-desktop-options', { width: 1440, height: 900 }, false, 'options');
await flow('v2-mobile-main', { width: 390, height: 844 }, true, 'main');
await flow('v2-mobile-options', { width: 390, height: 844 }, true, 'options');
await flow('v2-landscape-main', { width: 740, height: 360 }, true, 'main');
await flow('v2-landscape-options', { width: 740, height: 360 }, true, 'options');
await flow('v2-wideshort-main', { width: 1280, height: 560 }, false, 'main');
await browser.close();
console.log('DONE');
