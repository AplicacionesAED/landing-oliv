// create-pdf-mobile.cjs — PDF de la vista MÓVIL (/brochure-digital-mobile)
// Imagen por página (alta resolución) + capa de texto invisible seleccionable.
const { chromium } = require('playwright');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const fs = require('fs');
const path = require('path');

const URL = 'http://localhost:5173/brochure-digital-mobile?screenshots';
const TOTAL_SLIDES = 26;
const OUT_FILE = path.join(__dirname, 'Oliv Brochure Mobile.pdf');
// Página tipo teléfono (puntos PDF). Se captura a 3x para nitidez.
const W = 430, H = 932;
const SCALE_SHOT = 3;

function sanitize(s) {
  return s
    .replace(/ /g, ' ')
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, '-')
    .replace(/…/g, '...')
    .replace(/·/g, '-')
    .replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}\u{2190}-\u{21FF}\u{2300}-\u{23FF}️‍]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Extrae texto con posición por LÍNEA visual, corrigiendo por el escalado del lienzo.
async function extractText(page) {
  return page.evaluate(() => {
    const active = document.querySelector('.sl.active');
    if (!active) return [];
    // escala aplicada al lienzo .slides (transform: scale(x))
    const slides = document.querySelector('.slides');
    let scale = 1;
    if (slides) {
      const t = getComputedStyle(slides).transform;
      const m = t && t.startsWith('matrix') ? t.match(/matrix\(([^)]+)\)/) : null;
      if (m) scale = parseFloat(m[1].split(',')[0]) || 1;
    }
    const results = [];
    const walker = document.createTreeWalker(active, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      const raw = node.textContent;
      if (!raw.trim()) continue;
      const parent = node.parentElement;
      if (!parent) continue;
      const st = getComputedStyle(parent);
      if (st.display === 'none' || st.visibility === 'hidden') continue;
      const fontSize = (parseFloat(st.fontSize) || 12) * scale; // tamaño visual real
      const range = document.createRange();
      range.selectNodeContents(node);
      const lineRects = Array.from(range.getClientRects()).filter(r => r.width > 1 && r.height > 1);
      if (lineRects.length === 0) continue;
      let words = raw.trim().split(/\s+/);
      const totalW = lineRects.reduce((s, r) => s + r.width, 0) || 1;
      for (const r of lineRects) {
        const count = Math.max(1, Math.round((r.width / totalW) * words.length));
        const lineWords = words.splice(0, count);
        if (lineWords.length === 0) continue;
        results.push({ text: lineWords.join(' '), x: r.x, baselineY: r.bottom - fontSize * 0.18, size: fontSize });
      }
      if (words.length > 0) {
        const last = lineRects[lineRects.length - 1];
        results.push({ text: words.join(' '), x: last.x, baselineY: last.bottom - fontSize * 0.18, size: fontSize });
      }
    }
    return results;
  });
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: SCALE_SHOT });

  console.log('Abriendo brochure móvil...');
  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.waitForSelector('.sl.active', { timeout: 10000 });
  await page.waitForFunction(() => typeof window.gm === 'function', { timeout: 10000 });
  await page.waitForTimeout(600);

  const merged = await PDFDocument.create();
  merged.setTitle('OLIV Brochure Digital · Móvil');
  merged.setAuthor('AED Constructores');
  const font = await merged.embedFont(StandardFonts.Helvetica);

  for (let i = 0; i < TOTAL_SLIDES; i++) {
    await page.evaluate((n) => window.gm(n), i);
    await page.waitForTimeout(420);

    const jpeg = await page.screenshot({ type: 'jpeg', quality: 90 });
    const textNodes = await extractText(page);

    const jpg = await merged.embedJpg(jpeg);
    const pg = merged.addPage([W, H]);
    pg.drawImage(jpg, { x: 0, y: 0, width: W, height: H });

    for (const n of textNodes) {
      const safe = sanitize(n.text);
      if (!safe) continue;
      try {
        pg.drawText(safe, { x: n.x, y: H - n.baselineY, size: Math.max(4, Math.min(n.size, 120)), font, color: rgb(0, 0, 0), opacity: 0.001 });
      } catch (_) { /* char fuera de Latin-1 */ }
    }
    console.log(`  ✓ slide-${String(i + 1).padStart(2, '0')} (${textNodes.length} líneas)`);
  }

  await browser.close();
  const bytes = await merged.save();
  fs.writeFileSync(OUT_FILE, bytes);
  console.log(`\nPDF móvil listo (${(bytes.length / 1024 / 1024).toFixed(1)} MB):\n  ${OUT_FILE}`);
})();
