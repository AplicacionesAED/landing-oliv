import { useEffect, useRef, useState } from 'react';
import './BrochureDigitalMobile.css';
import slidesHtml from './brochure-slides-mobile.html?raw';

// Versión móvil del brochure (v7 Mobile).
// Carga los slides desde brochure-slides-mobile.html (imágenes en /assets/mobile/)
// y aporta la navegación (slide activo, dots, flechas, swipe, teclado).
export default function BrochureDigitalMobile() {
  const slidesRef = useRef<HTMLDivElement>(null);
  const curRef = useRef(0);
  const gRef = useRef<(n: number) => void>(() => { });
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const container = slidesRef.current;
    if (!container) return;

    container.innerHTML = slidesHtml;
    const slides = Array.from(container.querySelectorAll<HTMLElement>('.sl'));
    if (slides.length === 0) return;
    setTotal(slides.length);
    let cur = 0;

    const pad = (n: number) => String(n).padStart(2, '0');

    function bd() {
      const dc = document.getElementById('bm-dots');
      if (!dc) return;
      dc.innerHTML = '';
      for (let i = 0; i < slides.length; i++) {
        const d = document.createElement('div');
        d.className = 'dot' + (i === cur ? ' active' : '');
        d.onclick = () => g(i);
        dc.appendChild(d);
      }
    }

    function g(n: number) {
      if (n < 0 || n >= slides.length) return;
      const dir = n > cur ? 'slide-from-right' : 'slide-from-left';
      slides[cur].classList.remove('active', 'slide-from-right', 'slide-from-left');
      cur = n;
      curRef.current = cur;
      const el = slides[cur];
      el.classList.remove('slide-from-right', 'slide-from-left');
      void el.offsetWidth;
      el.classList.add('active', dir);
      const sn = document.getElementById('bm-sn');
      if (sn) sn.textContent = pad(cur + 1) + ' / ' + pad(slides.length);
      bd();
    }

    gRef.current = g;
    (window as any).gm = g;
    slides.forEach((s, i) => s.classList.toggle('active', i === 0));
    g(0);

    // ── Lienzo de diseño fijo (820px) escalado al ancho real del dispositivo ──
    // El v7 está diseñado a 820px de ancho; lo escalamos para llenar cualquier pantalla.
    const DESIGN_W = 820;
    function fit() {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const scale = vw / DESIGN_W;
      container!.style.width = DESIGN_W + 'px';
      container!.style.height = vh / scale + 'px';
      container!.style.transformOrigin = 'top left';
      container!.style.transform = 'scale(' + scale + ')';
    }
    fit();
    window.addEventListener('resize', fit);
    window.addEventListener('orientationchange', fit);

    // Swipe horizontal
    let sx = 0, sy = 0;
    const onTouchStart = (e: TouchEvent) => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; };
    const onTouchEnd = (e: TouchEvent) => {
      const dx = e.changedTouches[0].clientX - sx;
      const dy = e.changedTouches[0].clientY - sy;
      if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy)) dx < 0 ? g(cur + 1) : g(cur - 1);
    };
    container.addEventListener('touchstart', onTouchStart, { passive: true });
    container.addEventListener('touchend', onTouchEnd, { passive: true });

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') g(cur + 1);
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') g(cur - 1);
    };
    document.addEventListener('keydown', onKey);

    return () => {
      container.removeEventListener('touchstart', onTouchStart);
      container.removeEventListener('touchend', onTouchEnd);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', fit);
      window.removeEventListener('orientationchange', fit);
      delete (window as any).gm;
      container.innerHTML = '';
    };
  }, []);

  const screenshotMode = new URLSearchParams(window.location.search).has('screenshots');

  return (
    <div className={screenshotMode ? 'brochure-mobile-root screenshot-mode' : 'brochure-mobile-root'}>
      <nav>
        <div className="nl">OLIV<small>Cartagena</small></div>
        <div className="sn" id="bm-sn">01 / {String(total).padStart(2, '0')}</div>
      </nav>

      <div className="slides" ref={slidesRef} />

      <footer>
        <button className="nb" onClick={() => gRef.current(curRef.current - 1)}>&#8249;</button>
        <div className="dots" id="bm-dots" />
        <button className="nb" onClick={() => gRef.current(curRef.current + 1)}>&#8250;</button>
      </footer>
    </div>
  );
}
