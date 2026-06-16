// Reveals the card, finishes the letter, then forces the press state on the
// No and Yes buttons to confirm the tactile feedback renders.
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
await page.waitForTimeout(1000);
await page.evaluate(() => {
  document.getElementById('surprise-overlay').classList.add('hidden');
  if (typeof startLetterSequence === 'function') startLetterSequence();
  if (typeof finishLetter === 'function') finishLetter(); // jump to revealed state
});
await page.waitForTimeout(1200);

// Confirm the tactile class got wired, then force a press on the No button.
const wired = await page.evaluate(() => document.getElementById('no-btn').classList.contains('tactile'));
console.log('no-btn has .tactile wired:', wired);
await page.evaluate(() => {
  document.getElementById('no-btn').classList.add('is-pressed');
  document.getElementById('yes-btn').classList.add('is-pressed');
});
await page.waitForTimeout(150);
await page.screenshot({ path: path.join(dir, 'shots', 'tactile-pressed.png') });
await browser.close();
console.log('wrote tactile-pressed.png');
