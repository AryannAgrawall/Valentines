import { chromium } from 'playwright';
const OUT = '.agents/shots';
const BASE = 'http://localhost:8123/index.html';
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--ignore-gpu-blocklist'] });
const errs = [];

function track(p, tag) {
  p.on('pageerror', e => errs.push(`[${tag}] PAGEERROR: ${e.message}`));
  p.on('console', m => { if (m.type() === 'error') errs.push(`[${tag}] CONSOLE: ${m.text()}`); });
}
const playSpy = () => {
  window.__played = false;
  HTMLMediaElement.prototype.play = function () { window.__played = true; return Promise.resolve(); };
};

async function state(p) {
  return await p.evaluate(() => {
    const o = document.getElementById('surprise-overlay');
    return {
      webglActive: o.classList.contains('webgl-active'),
      hidden: o.classList.contains('hidden'),
      played: !!window.__played,
      canvasShown: getComputedStyle(document.getElementById('envelope-canvas')).display !== 'none',
    };
  });
}

// ---------- DESKTOP 3D ----------
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const p = await ctx.newPage(); track(p, 'desktop');
  await p.addInitScript(playSpy);
  await p.goto(BASE, { waitUntil: 'networkidle' });
  await p.waitForTimeout(700);
  console.log('desktop @load:', JSON.stringify(await state(p)));
  await p.screenshot({ path: `${OUT}/p4-desktop-1-envelope.png` });
  await p.click('#open-surprise-btn');
  await p.waitForTimeout(450);
  await p.screenshot({ path: `${OUT}/p4-desktop-2-opening.png` });
  console.log('desktop @click+450:', JSON.stringify(await state(p)));
  await p.waitForTimeout(1800);
  console.log('desktop @click+2250:', JSON.stringify(await state(p)));
  await p.screenshot({ path: `${OUT}/p4-desktop-3-revealed.png` });
  await ctx.close();
}

// ---------- MOBILE 3D ----------
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, deviceScaleFactor: 2 });
  const p = await ctx.newPage(); track(p, 'mobile');
  await p.addInitScript(playSpy);
  await p.goto(BASE, { waitUntil: 'networkidle' });
  await p.waitForTimeout(700);
  console.log('mobile @load:', JSON.stringify(await state(p)));
  await p.screenshot({ path: `${OUT}/p4-mobile-1-envelope.png` });
  await p.click('#open-surprise-btn');
  await p.waitForTimeout(2300);
  console.log('mobile @reveal:', JSON.stringify(await state(p)));
  await p.screenshot({ path: `${OUT}/p4-mobile-2-revealed.png` });
  await ctx.close();
}

// ---------- REDUCED MOTION (fallback, no WebGL init) ----------
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, reducedMotion: 'reduce' });
  const p = await ctx.newPage(); track(p, 'reduced');
  await p.addInitScript(playSpy);
  await p.goto(BASE, { waitUntil: 'networkidle' });
  await p.waitForTimeout(400);
  console.log('reduced @load:', JSON.stringify(await state(p)));
  await p.screenshot({ path: `${OUT}/p4-reduced-1.png` });
  await p.click('#open-surprise-btn');
  await p.waitForTimeout(400);
  console.log('reduced @click:', JSON.stringify(await state(p)));
  await ctx.close();
}

// ---------- HARD 3s SAFETY (no-op gsap → timeline never completes) ----------
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const p = await ctx.newPage(); track(p, 'safety');
  await p.addInitScript(() => {
    window.__played = false;
    HTMLMediaElement.prototype.play = function () { window.__played = true; return Promise.resolve(); };
    const self = { to() { return self; }, play() {}, kill() {} };
    window.gsap = { timeline() { return self; } };
  });
  await p.goto(BASE, { waitUntil: 'networkidle' });
  await p.waitForTimeout(500);
  await p.click('#open-surprise-btn');
  await p.waitForTimeout(1000);
  console.log('safety @click+1s (should be hidden:false):', JSON.stringify(await state(p)));
  await p.waitForTimeout(2400); // total ~3.4s after click
  console.log('safety @click+3.4s (should be hidden:true):', JSON.stringify(await state(p)));
  await ctx.close();
}

await browser.close();
console.log('ERRORS:', errs.length ? errs.join(' | ') : 'none');
console.log('DONE');
