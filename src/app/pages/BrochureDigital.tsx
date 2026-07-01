import { useEffect, useRef } from 'react';
import './BrochureDigital.css';
import slidesHtml from './brochure-slides.html?raw';
import mobileMapSrc from '@/assets/mapa-mobile-oliv.webp';

const DESKTOP_IDS = ['s0', 's0b', 's1', 'sproj', 'p1', 'pmix', 's15e', 'srec', 's3', 's4', 's5', 's5b', 's6', 's7', 's8', 's10', 's11', 's11b', 's12', 's13', 's15', 's15c', 's15b', 's15d'];
const DESKTOP_T = 24;
const DESKTOP_PM: Record<number, number> = { 0: 0, 1: 0, 2: 1, 3: 1, 4: 1, 5: 1, 6: 1, 7: 1, 8: 2, 9: 3, 10: 3, 11: 3, 12: 4, 13: 4, 14: 5, 15: 5, 16: 5, 17: 5, 18: 5, 19: 5, 20: 6, 21: 6, 22: 7, 23: 7 };
const SECTION_NAMES = ['Inicio', 'Urbanismo', 'Ubicación', 'Amenidades', 'Interiores', 'Planos', 'Inversión', 'Respaldo'];
const FICHA_WL = new Set(['s10', 's11', 's12', 's13']);
const CD: Record<string, number> = { B1: 320500000, A2: 485000000, R2: 493000000, R3: 697000000 };
const fmt = (n: number) => '$' + n.toLocaleString('es-CO');

const NAV_SECTIONS = [
  { label: 'Inicio', idx: 0 },
  { label: 'Urbanismo', idx: 3 },
  { label: 'Ubicación', idx: 8 },
  { label: 'Amenidades', idx: 9 },
  { label: 'Interiores', idx: 12 },
  { label: 'Planos', idx: 14 },
  { label: 'Inversión', idx: 20 },
  { label: 'Respaldo', idx: 22 },
];

export default function BrochureDigital() {
  const slidesRef = useRef<HTMLDivElement>(null);
  const gRef = useRef<(n: number) => void>(() => { });
  const curRef = useRef(0);
  // nav indices — updated by mobile IIFE with secFirst values
  const navIndicesRef = useRef<number[]>([0, 3, 8, 9, 12, 14, 20, 22]);

  useEffect(() => {
    const container = slidesRef.current;
    if (!container) return;

    // Inject slides content directly — no DOMParser needed
    container.innerHTML = slidesHtml;

    // Inject portrait map for mobile into s3 slide
    const s3div = container.querySelector<HTMLElement>('#s3 > div');
    if (s3div) {
      const mobileMap = document.createElement('img');
      mobileMap.src = mobileMapSrc;
      mobileMap.className = 'mobile-map-img';
      mobileMap.alt = 'Mapa ubicación OLIV';
      s3div.appendChild(mobileMap);
    }

    let ids = [...DESKTOP_IDS];
    let total = DESKTOP_T;
    let pm: Record<number, number> = { ...DESKTOP_PM };
    let cur = 0;

    function getEl(id: string): HTMLElement | null {
      return document.getElementById(id);
    }

    function bd() {
      const dc = getEl('dots');
      if (!dc) return;
      dc.innerHTML = '';
      for (let i = 0; i < total; i++) {
        const d = document.createElement('div');
        d.className = 'dot' + (i === cur ? ' active' : '');
        d.onclick = () => g(i);
        dc.appendChild(d);
      }
    }

    function up() {
      document.querySelectorAll('.pl').forEach((p, i) =>
        p.classList.toggle('active', i === (pm[cur] ?? 0))
      );
    }

    function g(n: number) {
      if (n < 0 || n >= total) return;
      const dir = n > cur ? 'slide-from-right' : 'slide-from-left';
      const prev = getEl(ids[cur]);
      if (prev) prev.classList.remove('active', 'slide-from-right', 'slide-from-left');
      cur = n;
      curRef.current = cur;
      const curr = getEl(ids[cur]);
      if (curr) {
        curr.classList.remove('slide-from-right', 'slide-from-left');
        void curr.offsetWidth;
        curr.classList.add('active', dir);
      }
      const sn = getEl('sn');
      if (sn) sn.textContent = (cur + 1) + ' / ' + total;
      if (window.innerWidth <= 768) {
        const si = getEl('sec-ind');
        if (si) si.textContent = SECTION_NAMES[pm[cur] ?? 0];
        updateScrollHint();
      }
      bd();
      up();
    }

    gRef.current = g;
    (window as any).g = g;

    // Payment calculator exposed for inline onclick="sc('B1',event)" buttons
    (window as any).sc = (t: string, e: MouseEvent) => {
      document.querySelectorAll('.csel').forEach(b => b.classList.remove('active'));
      (e.target as HTMLElement).classList.add('active');
      const p = CD[t] ?? 0;
      const pairs: [string, string][] = [
        ['cv1', fmt(p)],
        ['cv2', fmt(Math.round(p * 0.01))],
        ['cv3', fmt(Math.round(p * 0.3))],
        ['cv4', fmt(Math.round(Math.round(p * 0.3) / 30)) + '/mes'],
        ['cv5', fmt(Math.round(p * 0.7))],
      ];
      pairs.forEach(([id, val]) => { const el = getEl(id); if (el) el.textContent = val; });
    };

    // ── Scroll indicator ──────────────────────────────────────────────────────
    let scrollHint: HTMLElement | null = null;

    function updateScrollHint() {
      if (!scrollHint) return;
      const ce = getEl(ids[cur]);
      if (!ce) { scrollHint.style.display = 'none'; return; }
      const scrollable =
        ce.querySelector<HTMLElement>('[style*="overflow-y:auto"]') ??
        ce.querySelector<HTMLElement>('[style*="overflow-y: auto"]');
      if (!scrollable) { scrollHint.style.display = 'none'; return; }
      const atBottom = scrollable.scrollTop + scrollable.clientHeight >= scrollable.scrollHeight - 12;
      scrollHint.style.display =
        scrollable.scrollHeight > scrollable.clientHeight + 8 && !atBottom ? 'flex' : 'none';
      scrollable.onscroll = () => {
        if (!scrollHint) return;
        const bot = scrollable.scrollTop + scrollable.clientHeight >= scrollable.scrollHeight - 12;
        scrollHint.style.display = bot ? 'none' : 'flex';
      };
    }

    // ── Mobile ────────────────────────────────────────────────────────────────
    if (window.innerWidth <= 768) {
      const LSEL = '[style*="width:54%"],[style*="width:52%"],[style*="width:60%"]';
      const RSEL = '[style*="width:49%"],[style*="width:51%"],[style*="width:40%"]';

      const fichaIds: string[] = [];
      document.querySelectorAll('.sl').forEach(sl => {
        if (FICHA_WL.has(sl.id) && sl.querySelector(LSEL) && sl.querySelector(RSEL))
          fichaIds.push(sl.id);
      });

      fichaIds.forEach(id => {
        const orig = getEl(id);
        if (!orig) return;
        const plan = orig.cloneNode(true) as HTMLElement;
        plan.id = id;
        plan.className = 'sl ficha-plan-slide';
        const hint = document.createElement('button');
        hint.style.cssText = "position:absolute;bottom:80px;left:50%;transform:translateX(-50%);z-index:10;padding:8px 22px;border:1px solid rgba(184,148,63,.55);border-radius:20px;background:rgba(20,20,16,.55);color:var(--gl);font-size:8px;letter-spacing:2px;text-transform:uppercase;cursor:pointer;font-family:'Jost',sans-serif;backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);white-space:nowrap;";
        hint.textContent = 'VER DETALLES →';
        hint.addEventListener('click', () => g(cur + 1));
        plan.appendChild(hint);
        const info = orig.cloneNode(true) as HTMLElement;
        info.id = id + '_info';
        info.className = 'sl ficha-info-slide';
        orig.parentNode!.insertBefore(plan, orig);
        orig.parentNode!.insertBefore(info, orig);
        orig.remove();
      });

      const newIds: string[] = [];
      document.querySelectorAll('.sl').forEach(sl => newIds.push(sl.id));
      ids = newIds;
      total = ids.length;

      const newPm: Record<number, number> = {};
      ids.forEach((id, i) => {
        const base = id.replace('_info', '');
        const oi = DESKTOP_IDS.indexOf(base);
        newPm[i] = oi >= 0 ? DESKTOP_PM[oi] : (i > 0 ? newPm[i - 1] : 0);
      });
      pm = newPm;

      const secFirst: Record<number, number> = {};
      ids.forEach((_, i) => { const s = pm[i]; if (secFirst[s] === undefined) secFirst[s] = i; });
      // Update nav indices so React buttons navigate to the correct mobile slides
      navIndicesRef.current = NAV_SECTIONS.map((_, sectionIdx) =>
        secFirst[sectionIdx] ?? navIndicesRef.current[sectionIdx]
      );

      const secInd = document.createElement('div');
      secInd.id = 'sec-ind';
      document.body.appendChild(secInd);

      scrollHint = document.createElement('div');
      scrollHint.id = 'scroll-hint';
      scrollHint.innerHTML =
        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
        '<polyline points="6 9 12 15 18 9"></polyline></svg><span>desplazar</span>';
      document.body.appendChild(scrollHint);

      let swX = 0, swY = 0;
      const onTouchStart = (e: TouchEvent) => { swX = e.touches[0].clientX; swY = e.touches[0].clientY; };
      const onTouchEnd = (e: TouchEvent) => {
        const dx = e.changedTouches[0].clientX - swX;
        const dy = e.changedTouches[0].clientY - swY;
        if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy)) dx < 0 ? g(cur + 1) : g(cur - 1);
      };
      document.addEventListener('touchstart', onTouchStart, { passive: true });
      document.addEventListener('touchend', onTouchEnd, { passive: true });

      const enablePinchZoom = (el: HTMLElement) => {
        const img =
          el.querySelector<HTMLElement>('img') ??
          el.querySelector<HTMLElement>('[style*="background-image"]');
        if (!img) return;
        let scale = 1, lastDist = 0;
        const dist = (t: TouchList) =>
          Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
        img.style.transformOrigin = 'center center';
        img.style.transition = 'transform .15s ease';
        img.style.touchAction = 'none';
        el.addEventListener('touchstart', e => {
          if (e.touches.length === 2) { lastDist = dist(e.touches); e.preventDefault(); }
        }, { passive: false });
        el.addEventListener('touchmove', e => {
          if (e.touches.length !== 2) return;
          e.preventDefault();
          const d = dist(e.touches);
          scale = Math.min(4, Math.max(1, scale * (d / lastDist)));
          img.style.transform = 'scale(' + scale + ')';
          lastDist = d;
        }, { passive: false });
        el.addEventListener('touchend', e => {
          if (e.touches.length < 2 && scale <= 1) { scale = 1; img.style.transform = 'scale(1)'; }
        });
        let lastTap = 0;
        el.addEventListener('touchend', e => {
          if (e.touches.length > 0) return;
          const now = Date.now();
          if (now - lastTap < 300) { scale = 1; img.style.transform = 'scale(1)'; }
          lastTap = now;
        });
      };
      document.querySelectorAll<HTMLElement>('.ficha-plan-slide').forEach(enablePinchZoom);
    }

    // ── Desktop extras ────────────────────────────────────────────────────────
    if (window.matchMedia('(hover:hover)').matches && window.innerWidth > 768) {
      const kh = document.createElement('div');
      kh.id = 'kb-hint';
      kh.innerHTML = '<kbd>←</kbd> navegar <kbd>→</kbd>';
      document.body.appendChild(kh);
      setTimeout(() => kh.remove(), 4200);
    }

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') g(cur + 1);
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') g(cur - 1);
    };
    const onFs = () => {
      const btn = getEl('fs-btn');
      if (btn) btn.style.opacity = document.fullscreenElement ? '1' : '';
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('fullscreenchange', onFs);

    g(0);

    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('fullscreenchange', onFs);
      delete (window as any).g;
      delete (window as any).sc;
      getEl('sec-ind')?.remove();
      getEl('scroll-hint')?.remove();
      getEl('kb-hint')?.remove();
      container.innerHTML = '';
    };
  }, []);

  function toggleFS() {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
    else document.exitFullscreen?.();
  }

  const screenshotMode = new URLSearchParams(window.location.search).has('screenshots');

  return (
    <div className={screenshotMode ? 'brochure-root screenshot-mode' : 'brochure-root'}>
      <nav>
        <div className="nc">
          <div className="sn" id="sn">1 / {DESKTOP_T}</div>
          <div className="np">
            {NAV_SECTIONS.map(({ label }, i) => (
              <button
                key={label}
                className="pl"
                onClick={() => {
                  const navigate = (window as any).g ?? gRef.current;
                  navigate(navIndicesRef.current[i]);
                }}
              >
                {label}
              </button>
            ))}
          </div>
          <button id="fs-btn" onClick={toggleFS} title="Pantalla completa">&#x26F6;</button>
        </div>
      </nav>

      <div className="slides" ref={slidesRef} />

      <footer>
        <button className="nb" onClick={() => { const g = (window as any).g ?? gRef.current; g(curRef.current - 1); }}>&#8592;</button>
        <div className="dots" id="dots" />
        <button className="nb" onClick={() => { const g = (window as any).g ?? gRef.current; g(curRef.current + 1); }}>&#8594;</button>
      </footer>
    </div>
  );
}
