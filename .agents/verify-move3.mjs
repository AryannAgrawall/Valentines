// Loads the real page, sets a test name, reveals the card, and screenshots the
// letter typing + the staged reveal of the question/controls.
import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import path from 'path';

const dir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(dir, '..');
const url = 'file://' + path.join(root, 'index.html').replace(/\\/g, '/');

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 900, height: 800 } });
page.on('pageerror', e => console.log('PAGE ERROR:', e.message));
await page.goto(url);
await page.waitForTimeout(1200);

// Reveal the card using the REAL config (bypass the 3D envelope for the test).
await page.evaluate(() => {
  document.getElementById('surprise-overlay').classList.add('hidden');
  if (typeof startLetterSequence === 'function') startLetterSequence();
});

await page.waitForTimeout(1800);
await page.screenshot({ path: path.join(dir, 'shots', 'move3-typing.png') });

await page.waitForTimeout(9000); // let typing finish + controls reveal
const revealed = await page.evaluate(() =>
  document.getElementById('main-container').classList.contains('letter-revealed'));
console.log('letter-revealed class present:', revealed);
await page.screenshot({ path: path.join(dir, 'shots', 'move3-revealed.png') });

await browser.close();
console.log('wrote move3-typing.png and move3-revealed.png');
