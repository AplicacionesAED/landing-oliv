// capture-slides.js — captura cada slide del brochure digital
// Uso: node capture-slides.js
// Requiere: npx playwright install chromium (solo la primera vez)

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const URL = 'http://localhost:5173/brochure-digital?screenshots';
const TOTAL_SLIDES = 24;
const OUT_DIR = path.join(__dirname, 'slides-capturas');
const VIEWPORT = { width: 1920, height: 1080 };

(async () => {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  // Limpiar capturas anteriores
  for (const f of fs.readdirSync(OUT_DIR)) {
    if (f.endsWith('.png')) fs.unlinkSync(path.join(OUT_DIR, f));
  }

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewportSize(VIEWPORT);

  console.log('Abriendo brochure...');
  await page.goto(URL, { waitUntil: 'networkidle' });

  // Esperar que el primer slide esté activo
  await page.waitForSelector('.sl.active', { timeout: 10000 });
  await page.waitForTimeout(800);

  for (let i = 0; i < TOTAL_SLIDES; i++) {
    // Navegar al slide i
    await page.evaluate((n) => window.g(n), i);
    await page.waitForTimeout(600); // esperar transición

    const num = String(i + 1).padStart(2, '0');
    const file = path.join(OUT_DIR, `slide-${num}.png`);
    await page.screenshot({ path: file, fullPage: false });
    console.log(`  ✓ slide-${num}.png`);
  }

  await browser.close();
  console.log(`\nListo. ${TOTAL_SLIDES} capturas guardadas en:\n  ${OUT_DIR}`);
})();
