// tools/capture-screenshots.js
// Usage:
// 1) Start a local HTTP server in your project root, e.g.:
//    python -m http.server 8000
// 2) Install Puppeteer (node + npm required):
//    npm install puppeteer
// 3) Run the script:
//    node tools/capture-screenshots.js

const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

(async () => {
  const outDir = path.join(__dirname, 'screenshots');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const baseUrl = 'http://localhost:8000';

  // Pages to capture (relative to workspace root)
  const pages = [
    { path: '/player-dashboard.html', name: 'player' },
    { path: '/bank-dashboard.html', name: 'bank' }
  ];

  // Target viewports (common mobile widths; heights are approximate)
  const viewports = [
    { w: 360, h: 800 }, // small phones
    { w: 390, h: 844 }, // iPhone 12/13 miniish
    { w: 412, h: 915 }, // Pixel-ish
    { w: 428, h: 926 }, // larger phones
    { w: 600, h: 960 }, // small tablet / large phone
  ];

  // Optional: set localStorage sessions so dashboards show after login.
  // If you want to capture logged-in dashboards, fill in appropriate values
  // that exist in your Firestore project, for example:
  const sessions = {
    // Example:
    // bank: { key: 'monopolyBankGame', value: JSON.stringify({ gameName: 'demo', pin: '1234' }) },
    // player: { key: 'monopolyPlayer', value: JSON.stringify({ gameName: 'demo', pin: '1234', playerName: 'Juan' }) }
  };

  const browser = await puppeteer.launch({ headless: true });
  try {
    for (const pageInfo of pages) {
      for (const vp of viewports) {
        const page = await browser.newPage();
        await page.setViewport({ width: vp.w, height: vp.h, deviceScaleFactor: 2 });

        // If session values are provided, set them before navigation
        if (pageInfo.name === 'bank' && sessions.bank) {
          await page.evaluateOnNewDocument((k, v) => {
            localStorage.setItem(k, v);
          }, sessions.bank.key, sessions.bank.value);
        }
        if (pageInfo.name === 'player' && sessions.player) {
          await page.evaluateOnNewDocument((k, v) => {
            localStorage.setItem(k, v);
          }, sessions.player.key, sessions.player.value);
        }

        const url = baseUrl + pageInfo.path;
        console.log(`Opening ${url} @ ${vp.w}x${vp.h}`);
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

        // Give a short pause for dynamic content
        await page.waitForTimeout(1000);

        const filename = `${pageInfo.name}-${vp.w}x${vp.h}.png`;
        const filePath = path.join(outDir, filename);

        // Capture full page (will crop to viewport)
        await page.screenshot({ path: filePath, fullPage: false });
        console.log(`Saved ${filePath}`);

        await page.close();
      }
    }

    console.log('All screenshots saved in:', outDir);
  } catch (err) {
    console.error('Error capturing screenshots:', err);
  } finally {
    await browser.close();
  }
})();
