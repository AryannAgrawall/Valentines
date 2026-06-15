import { chromium } from 'playwright';
const OUT = '.agents/shots';
const BASE = 'http://localhost:8123/index.html';
const browser = await chromium.launch();
async function run(name, vp, mobile) {
  const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: mobile ? 2 : 1, isMobile: mobile });
  const page = await ctx.newPage();
  await page.addInitScript(() => { HTMLMediaElement.prototype.play = () => Promise.resolve(); });
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.click('#open-surprise-btn');
  await page.waitForTimeout(800);
  for (let i = 0; i < 5; i++) { await page.evaluate(() => handleNoClick()); await page.waitForTimeout(80); }
  await page.evaluate(() => handleYesClick());
  await page.waitForTimeout(2400); // let options-menu fadeIn (1s delay) finish
  await page.screenshot({ path: `${OUT}/${name}.png` });
  console.log('shot', name);
  await ctx.close();
}
await run('desktop-7-options', { width: 1280, height: 800 }, false);
await run('mobile-5-options', { width: 390, height: 844 }, true);
await browser.close();
console.log('DONE');
