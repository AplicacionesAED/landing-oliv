// create-pdf.cjs — PDF híbrido: imagen JPEG por página + capa de texto invisible seleccionable
const { chromium } = require('playwright');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const fs = require('fs');
const path = require('path');

const URL = 'http://localhost:5173/brochure-digital?screenshots';
const TOTAL_SLIDES = 24;
const OUT_FILE = path.join(__dirname, 'Oliv Brochure.pdf');
const VIEWPORT = { width: 1920, height: 1080 };
const W = 1920, H = 1080;

// Sanea texto a caracteres que la fuente Helvetica (WinAnsi) puede codificar,
// para que ninguna línea con —, ·, comillas tipográficas o emojis se descarte.
function sanitize(s) {
  return s
    .replace(/ /g, ' ')            // nbsp
    .replace(/[‘’]/g, "'")    // comillas simples tipográficas
    .replace(/[“”]/g, '"')    // comillas dobles tipográficas
    .replace(/[–—]/g, '-')    // guiones en/em
    .replace(/…/g, '...')          // elipsis
    .replace(/·/g, '-')            // punto medio ·
    .replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}\u{2190}-\u{21FF}\u{2300}-\u{23FF}️‍]/gu, '') // emojis/símbolos
    .replace(/\s+/g, ' ')
    .trim();
}

// Extrae nodos de texto con posición por LÍNEA visual (getClientRects)
async function extractText(page) {
  return page.evaluate(() => {
    const active = document.querySelector('.sl.active');
    if (!active) return [];
    const results = [];
    const walker = document.createTreeWalker(active, NodeFilter.SHOW_TEXT);
    let node;

    while ((node = walker.nextNode())) {
      const raw = node.textContent;
      if (!raw.trim()) continue;
      const parent = node.parentElement;
      if (!parent) continue;
      const style = window.getComputedStyle(parent);
      if (style.display === 'none' || style.visibility === 'hidden') continue;

      const fontSize = parseFloat(style.fontSize) || 12;
      const range = document.createRange();
      range.selectNodeContents(node);

      // getClientRects → un rect por línea visual (maneja text wrapping)
      const lineRects = Array.from(range.getClientRects()).filter(r => r.width > 1 && r.height > 1);
      if (lineRects.length === 0) continue;

      // Distribuir palabras entre líneas por proporción de ancho
      let words = raw.trim().split(/\s+/);
      const totalW = lineRects.reduce((s, r) => s + r.width, 0) || 1;

      for (const r of lineRects) {
        const count = Math.max(1, Math.round((r.width / totalW) * words.length));
        const lineWords = words.splice(0, count);
        if (lineWords.length === 0) continue;

        // Y de la línea de base = bottom del rect − descenso (≈ 18% del font-size)
        results.push({
          text: lineWords.join(' '),
          x: r.x,
          baselineY: r.bottom - fontSize * 0.18,
          size: fontSize,
        });
      }

      // Palabras sobrantes por redondeo → última línea
      if (words.length > 0) {
        const last = lineRects[lineRects.length - 1];
        results.push({
          text: words.join(' '),
          x: last.x,
          baselineY: last.bottom - fontSize * 0.18,
          size: fontSize,
        });
      }
    }
    return results;
  });
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewportSize(VIEWPORT);

  console.log('Abriendo brochure...');
  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.waitForSelector('.sl.active', { timeout: 10000 });
  await page.waitForTimeout(800);

  const merged = await PDFDocument.create();
  merged.setTitle('OLIV Brochure Digital');
  merged.setAuthor('AED Constructores');
  const font = await merged.embedFont(StandardFonts.Helvetica);

  for (let i = 0; i < TOTAL_SLIDES; i++) {
    await page.evaluate((n) => window.g(n), i);
    await page.waitForTimeout(400);

    // 1. Captura visual como JPEG — imagen plana, navegación instantánea
    const jpeg = await page.screenshot({ type: 'jpeg', quality: 88, fullPage: false });

    // 2. Extraer texto con posición por línea
    const textNodes = await extractText(page);

    // 3. Página PDF: imagen + capa de texto invisible
    const jpgImg = await merged.embedJpg(jpeg);
    const pdfPage = merged.addPage([W, H]);

    pdfPage.drawImage(jpgImg, { x: 0, y: 0, width: W, height: H });

    for (const n of textNodes) {
      const safe = sanitize(n.text);
      if (!safe) continue;
      try {
        pdfPage.drawText(safe, {
          x: n.x,
          y: H - n.baselineY,   // PDF: origen abajo-izquierda; baselineY ya está calculada
          size: Math.max(6, Math.min(n.size, 120)),
          font,
          color: rgb(0, 0, 0),
          opacity: 0.001,
        });
      } catch (_) { /* saltar chars fuera de Latin-1 */ }
    }

    console.log(`  ✓ slide-${String(i + 1).padStart(2, '0')} (${textNodes.length} líneas de texto)`);
  }

  await browser.close();

  const bytes = await merged.save();
  fs.writeFileSync(OUT_FILE, bytes);
  const mb = (bytes.length / 1024 / 1024).toFixed(1);
  console.log(`\nPDF híbrido listo (${mb} MB):\n  ${OUT_FILE}`);
})();
