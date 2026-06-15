import { chromium } from 'playwright';
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--ignore-gpu-blocklist'] });
const p = await (await browser.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
await p.goto('http://localhost:8123/index.html', { waitUntil: 'networkidle' });
await p.waitForTimeout(700);
console.log(await p.evaluate(() => ({
  onclickProp: typeof document.getElementById('open-surprise-btn').onclick,
  onclickAttr: document.getElementById('open-surprise-btn').getAttribute('onclick'),
  webglActive: document.getElementById('surprise-overlay').classList.contains('webgl-active'),
})));
await browser.close();
