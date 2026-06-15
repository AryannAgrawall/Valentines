import { chromium } from 'playwright';
import { mkdirSync } from 'fs';

const OUT = '.agents/shots';
mkdirSync(OUT, { recursive: true });
const BASE = 'http://localhost:8123/index.html';

const browser = await chromium.launch();

async function shot(page, name) {
  await page.screenshot({ path: `${OUT}/${name}.png` });
  console.log('shot', name);
}

// quiet the audio so autoplay/play() never blocks
async function prep(page) {
  await page.addInitScript(() => {
    HTMLMediaElement.prototype.play = function () { return Promise.resolve(); };
  });
}

// ---------- DESKTOP ----------
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  await prep(page);
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  await shot(page, 'desktop-1-intro');

  await page.click('#open-surprise-btn');
  await page.waitForTimeout(1200); // overlay fade + gif load
  await shot(page, 'desktop-2-main');

  // three No clicks -> growth + sadder gif
  for (let i = 0; i < 3; i++) { await page.evaluate(() => handleNoClick()); await page.waitForTimeout(350); }
  await shot(page, 'desktop-3-after3no');

  // reach runaway (>=5) and trigger one runaway move + possible glow
  for (let i = 0; i < 4; i++) { await page.evaluate(() => handleNoClick()); await page.waitForTimeout(250); }
  await page.evaluate(() => runAway());
  await page.evaluate(() => runAway());
  await page.waitForTimeout(300);
  await shot(page, 'desktop-4-runaway-growth');

  // say yes
  await page.evaluate(() => handleYesClick());
  await page.waitForTimeout(1000);
  await shot(page, 'desktop-5-yes');

  // pick a date
  await page.evaluate(() => selectFood('Netflix and Pizza 🍕📺'));
  await page.waitForTimeout(800);
  await shot(page, 'desktop-6-final');
  await ctx.close();
}

// ---------- MOBILE (iPhone 12-ish) ----------
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true });
  const page = await ctx.newPage();
  await prep(page);
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(700);
  await shot(page, 'mobile-1-intro');
  await page.click('#open-surprise-btn');
  await page.waitForTimeout(1200);
  await shot(page, 'mobile-2-main');
  await page.evaluate(() => handleYesClick()); // gated, won't proceed
  // force yes path: 5 no then yes
  for (let i = 0; i < 5; i++) { await page.evaluate(() => handleNoClick()); await page.waitForTimeout(120); }
  await shot(page, 'mobile-3-growth');
  await page.evaluate(() => handleYesClick());
  await page.waitForTimeout(900);
  await shot(page, 'mobile-4-yes');
  await ctx.close();
}

// ---------- LANDSCAPE (short height) ----------
{
  const ctx = await browser.newContext({ viewport: { width: 740, height: 360 }, deviceScaleFactor: 2, isMobile: true });
  const page = await ctx.newPage();
  await prep(page);
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(700);
  await shot(page, 'landscape-1-intro');
  await page.click('#open-surprise-btn');
  await page.waitForTimeout(1200);
  await shot(page, 'landscape-2-main');
  for (let i = 0; i < 5; i++) { await page.evaluate(() => handleNoClick()); await page.waitForTimeout(100); }
  await page.evaluate(() => handleYesClick());
  await page.waitForTimeout(800);
  await shot(page, 'landscape-3-yes');
  await ctx.close();
}

await browser.close();
console.log('DONE');
