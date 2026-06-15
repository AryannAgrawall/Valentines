import { chromium } from 'playwright';
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--ignore-gpu-blocklist'] });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const p = await ctx.newPage();
p.on('console', m => console.log('PAGE:', m.text()));
await p.addInitScript(() => {
  window.__played = false;
  HTMLMediaElement.prototype.play = function () { window.__played = true; return Promise.resolve(); };
  // patch revealCard later to trace who calls it
});
await p.goto('http://localhost:8123/index.html', { waitUntil: 'networkidle' });
await p.waitForTimeout(700);
// wrap revealCard to log a stack when called
await p.evaluate(() => {
  const orig = window.revealCard;
  window.revealCard = function () { console.log('[trace] revealCard called\n' + new Error().stack); return orig.apply(this, arguments); };
});
const t0 = Date.now();
await p.click('#open-surprise-btn');
for (let i = 0; i < 25; i++) {
  const hidden = await p.evaluate(() => document.getElementById('surprise-overlay').classList.contains('hidden'));
  if (hidden) { console.log('hidden became true at +', Date.now() - t0, 'ms'); break; }
  await p.waitForTimeout(100);
}
await browser.close();
