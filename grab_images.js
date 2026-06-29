const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const OUT = '/tmp/claude-0/-home-user-liberto/5bad47e2-522f-5527-bb6f-2bad8d8f925e/scratchpad/imgs';
fs.mkdirSync(OUT, { recursive: true });

(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', headless: true });
  const context = await browser.newContext({ viewport: { width: 480, height: 900 } });

  const captured = {};
  context.on('response', async (response) => {
    const url = response.url();
    if (/\.(jpg|jpeg|png|webp)/i.test(url)) {
      try {
        const buf = await response.body();
        if (buf.length > 20000) {
          const name = url.split('/').pop().split('?')[0];
          if (!captured[name]) {
            captured[name] = true;
            fs.writeFileSync(path.join(OUT, name), buf);
            console.log('SAVED:', name, Math.round(buf.length/1024) + 'KB', url);
          }
        }
      } catch(e) {}
    }
  });

  const page = await context.newPage();
  await page.goto('https://inlead.digital/filho-liberto/', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);

  // Click through all steps
  for (let i = 0; i < 25; i++) {
    await page.waitForTimeout(1500);
    const clicked = await page.evaluate(() => {
      // find visible buttons
      const btns = Array.from(document.querySelectorAll('button, [role=button], .btn'));
      const visible = btns.find(b => {
        const r = b.getBoundingClientRect();
        return r.width > 0 && r.height > 0;
      });
      if (visible) { visible.click(); return true; }
      return false;
    });
    if (!clicked) break;
    console.log('Clicked step', i+1);
  }

  await page.waitForTimeout(3000);
  await browser.close();
  console.log('\nDone. Files:', fs.readdirSync(OUT).join(', '));
})();
