# Capture screenshots (local)

This helper captures screenshots of your app at common mobile widths using Puppeteer.

Steps:

1) Start a local HTTP server in the project folder (from the repo root):

   - Python 3: `python -m http.server 8000`
   - Or any static server that serves the project at `http://localhost:8000`.

2) (optional) Edit `tools/capture-screenshots.js` to include valid `sessions` values if you want to capture *authenticated* dashboards.

   Example:
   ```js
   const sessions = {
     bank: { key: 'monopolyBankGame', value: JSON.stringify({ gameName: 'demo', pin: '1234' }) },
     player: { key: 'monopolyPlayer', value: JSON.stringify({ gameName: 'demo', pin: '1234', playerName: 'Juan' }) }
   };
   ```

   If you don't set sessions, the script will capture the public/login pages.

3) Install Puppeteer and run the script:

   ```bash
   npm install puppeteer
   node tools/capture-screenshots.js
   ```

   Screenshots will be saved to `tools/screenshots/` as PNG files named like `player-360x800.png`.

Notes:
- Puppeteer requires Node.js and will download a Chromium build (~100MB) on install.
- If you need me to run the script for you, I can (only if the environment has Node and internet access); otherwise you can run it locally and upload the generated PNGs here for review.
