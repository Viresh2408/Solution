import puppeteer from 'puppeteer';
import fs from 'fs';

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('https://vulnerabilty-defense.preview.emergentagent.com/', {
    waitUntil: 'networkidle0',
  });
  
  // Wait a little extra for any animations/renders to finish
  await new Promise(r => setTimeout(r, 2000));
  
  const html = await page.evaluate(() => document.documentElement.outerHTML);
  fs.writeFileSync('../landing/emergent.html', html);
  
  console.log('Scraped successfully to ../landing/emergent.html');
  await browser.close();
})();
