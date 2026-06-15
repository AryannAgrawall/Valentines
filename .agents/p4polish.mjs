import { chromium } from 'playwright';
const OUT = '.agents/shots';
const BASE = 'http://localhost:8123/index.html';
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--ignore-gpu-blocklist'] });

// 1) Steady closed envelope (band should be gone)
{
  const p = await (await browser.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
  await p.addInitScript(() => { HTMLMediaElement.prototype.play = () => Promise.resolve(); });
  await p.goto(BASE, { waitUntil: 'networkidle' });
  await p.waitForTimeout(800);
  await p.screenshot({ path: `${OUT}/polish-1-closed.png` });
  // mid-open
  await p.click('#open-surprise-btn');
  await p.waitForTimeout(900);
  await p.screenshot({ path: `${OUT}/polish-2-opening.png` });
}

// 2) Throttle three.core.js by ~900ms, screenshot the EARLY placeholder (~150ms)
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const p = await ctx.newPage();
  await p.addInitScript(() => { HTMLMediaElement.prototype.play = () => Promise.resolve(); });
  await p.route('**/three.core.js', async (route) => {
    await new Promise(r => setTimeout(r, 900));
    route.continue();
  });
  await p.goto(BASE, { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(120);
  const early = await p.evaluate(() => ({
    env3d: document.documentElement.classList.contains('env-3d'),
    envReady: document.getElementById('surprise-overlay').classList.contains('env-ready'),
    // is the flat envelope graphic visible? (its ::before triangle would imply yes)
    btnBg: getComputedStyle(document.getElementById('open-surprise-btn')).backgroundColor,
    h2Visible: (() => { const r = document.querySelector('#surprise-overlay h2').getBoundingClientRect(); return r.width > 10 && r.height > 10; })(),
  }));
  console.log('EARLY (placeholder) state:', JSON.stringify(early));
  await p.screenshot({ path: `${OUT}/polish-3-early-placeholder.png` });
  await ctx.close();
}

await browser.close();
console.log('DONE');
