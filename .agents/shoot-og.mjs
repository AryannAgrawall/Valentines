// Renders the OG template to og-image.png (1200x630) and the icon PNGs.
import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import path from 'path';

const dir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(dir, '..');

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
await page.goto('file://' + path.join(dir, 'og-template.html').replace(/\\/g, '/'));
await page.waitForTimeout(1200); // let webfonts settle
await page.screenshot({ path: path.join(root, 'og-image.png'), clip: { x: 0, y: 0, width: 1200, height: 630 } });

// Square apple-touch-icon (180x180) cropped from the favicon for a rich home-screen icon.
await page.setContent(`<body style="margin:0"><img src="file://${path.join(root,'favicon.svg').replace(/\\/g,'/')}" width="180" height="180"></body>`);
await page.setViewportSize({ width: 180, height: 180 });
await page.waitForTimeout(200);
await page.screenshot({ path: path.join(root, 'apple-touch-icon.png'), clip: { x: 0, y: 0, width: 180, height: 180 } });

await browser.close();
console.log('OG image + apple-touch-icon written');
