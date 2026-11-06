/* Núcleo sobrio para las versiones 09–11: la obra al centro y pocas piezas, bien hechas.
   - Visor que se abre desde la miniatura que tocaste y vuelve a ella al cerrar.
   - Lupa ×3 en todas las imágenes: con el cursor encima, o manteniendo el dedo en el teléfono.
   - Tarjetas y botones con un leve rebote al pasar el cursor, como en iOS.
   Usa los datos, textos y la firma de core.js (cargar data.js y core.js antes). */
(() => {
const { $, $$, clamp, RM, W_, T_, ratio, WORKS, BY_ID } = ML;
const t = k => ML.t(k);
const FINE = matchMedia('(hover: hover) and (pointer: fine)').matches;

// Resorte amortiguado convertido a curva CSS linear(): sube rápido, se pasa apenas y se asienta
const SPRING = (() => {
  if (!CSS.supports('animation-timing-function', 'linear(0, 1)')) return 'cubic-bezier(.22,1.2,.36,1)';
  const z = .78, w = 13, wd = w * Math.sqrt(1 - z * z), pts = [];
  for (let i = 0; i <= 40; i++) { const s = i / 40 * .9; pts.push((1 - Math.exp(-z * w * s) * (Math.cos(wd * s) + z * w / wd * Math.sin(wd * s))).toFixed(4)); }
  pts[pts.length - 1] = '1';
  return `linear(${pts.join(', ')})`;
})();
const EASE_OUT = 'cubic-bezier(.2,.8,.2,1)';

const STR = {
  es: { n_work: 'Obra', n_about: 'Sobre', n_contact: 'Contacto', all: 'Todo', close: 'Cerrar', in_progress: 'En proceso',
        hint_mouse: 'Pasa el cursor sobre la obra para verla de cerca', hint_touch: 'Mantén el dedo sobre la obra para verla de cerca',
        zoom: 'Rueda del mouse: más o menos aumento', views_of: 'de', open_work: 'Ver la obra',
        about_p: 'Pintor realista chileno (Santiago, 1996). Pinta retratos al óleo sobre lino, casi siempre a partir de sus propias fotografías.',
        about_train: 'Se formó en el taller de Javier Barriga (2019–2024) y con Francisco Uzabeaga (2024).',
        about_expo: 'Exposición «Polímatas», Estadio Italiano, Santiago, 2024.',
        com_t: 'Retratos por encargo', com_p: 'Cada obra se entrega firmada, con certificado de autenticidad y placa de latón al reverso.',
        mail_copy: 'Copiar correo' },
  en: { n_work: 'Work', n_about: 'About', n_contact: 'Contact', all: 'All', close: 'Close', in_progress: 'In progress',
        hint_mouse: 'Move over the work to see it up close', hint_touch: 'Press and hold on the work to see it up close',
        zoom: 'Mouse wheel: more or less zoom', views_of: 'of', open_work: 'View the work',
        about_p: 'Chilean realist painter (Santiago, 1996). He paints oil portraits on linen, almost always from his own photographs.',
        about_train: 'He trained in the studio of Javier Barriga (2019–2024) and with Francisco Uzabeaga (2024).',
        about_expo: '"Polímatas" exhibition, Estadio Italiano, Santiago, 2024.',
        com_t: 'Portrait commissions', com_p: 'Every work is delivered signed, with a certificate of authenticity and a brass plaque on the back.',
        mail_copy: 'Copy email' }
};

const meta = w => [w.year === 'WIP' ? t('in_progress') : w.year, w.tech[ML.lang], w.dims].filter(Boolean).join(' · ');

// ── Tarjeta de obra: su proporción real, sin recortes ──
function card(w, opts = {}) {
  const b = document.createElement('button');
  b.type = 'button'; b.className = 'sb-card' + (opts.cls ? ' ' + opts.cls : ''); b.dataset.work = w.id;
  const p = w.imgs[0].p;
  b.innerHTML = `<span class="sb-frame" style="aspect-ratio:${ratio(p).toFixed(4)}"><img src="${T_(p)}" srcset="${T_(p)} 820w, ${W_(p)} 2000w" sizes="${opts.sizes || '(max-width: 700px) 92vw, 33vw'}" alt="" loading="lazy" decoding="async">${w.year === 'WIP' ? `<span class="sb-tag">${t('in_progress')}</span>` : ''}</span>
    ${opts.caption === false ? '' : `<span class="sb-cap"><span class="sb-cap-t">${w.name}</span><span class="sb-cap-m">${meta(w)}</span></span>`}`;
  b.setAttribute('aria-label', `${w.name}, ${meta(w)}`);
  return b;
}

// ── Lupa: un círculo que aumenta lo que hay bajo el cursor o el dedo ──
function loupe(img, opts = {}) {
  const lens = document.createElement('div'); lens.className = 'sb-loupe'; lens.setAttribute('aria-hidden', 'true');
  document.body.appendChild(lens);
  let z = opts.z || 3, src = null, on = false, last = null;
  const big = () => (opts.src ? opts.src() : null) || img.currentSrc || img.src;
  function place(x, y, lift) {
    const r = img.getBoundingClientRect(), R = lens.offsetWidth / 2;
    const px = clamp((x - r.left) / r.width), py = clamp((y - r.top) / r.height);
    const s = big(); if (s !== src) { src = s; lens.style.backgroundImage = `url("${s}")`; }
    lens.style.backgroundSize = `${r.width * z}px ${r.height * z}px`;
    lens.style.backgroundPosition = `${R - px * r.width * z}px ${R - py * r.height * z}px`;
    lens.style.transform = `translate3d(${x - R}px, ${y - R - (lift || 0)}px, 0)`;
    last = { x, y, lift };
  }
  const show = v => { if (v === on) return; on = v; lens.classList.toggle('on', v); };
  // cursor
  img.addEventListener('pointermove', e => { if (e.pointerType !== 'mouse') return; place(e.clientX, e.clientY); show(true); });
  img.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') show(false); });
  img.addEventListener('wheel', e => { if (!on || !opts.wheel) return; e.preventDefault(); z = clamp(z - Math.sign(e.deltaY) * .5, 2, 6); if (last) place(last.x, last.y, last.lift); }, { passive: false });
  // dedo: mantener presionado (sin mover) y arrastrar; el círculo va sobre el dedo para no taparlo
  if (opts.touch) {
    let timer = 0, start = null;
    img.addEventListener('pointerdown', e => {
      if (e.pointerType === 'mouse') return;
      start = { x: e.clientX, y: e.clientY, id: e.pointerId };
      timer = setTimeout(() => { timer = 0; place(start.x, start.y, 96); show(true); try { img.setPointerCapture(start.id); } catch (er) {} opts.onHold && opts.onHold(true); }, 220);
    });
    img.addEventListener('pointermove', e => {
      if (e.pointerType === 'mouse' || !start) return;
      if (timer && Math.hypot(e.clientX - start.x, e.clientY - start.y) > 10) { clearTimeout(timer); timer = 0; }
      if (on) place(e.clientX, e.clientY, 96);
    });
    const end = () => { clearTimeout(timer); timer = 0; start = null; if (on) { show(false); opts.onHold && opts.onHold(false); } };
    img.addEventListener('pointerup', end); img.addEventListener('pointercancel', end);
    img.addEventListener('contextmenu', e => e.preventDefault());
  }
  return { hide: () => show(false), get active() { return on; } };
}

// ── Visor ──
const LB = (() => {
  let el, img, bg, info, hint, list = [], idx = 0, view = 0, srcEl = null, open = false, lens, holding = false, lastFocus = null;
  function mount() {
    el = document.createElement('div'); el.className = 'sb-lb'; el.hidden = true;
    el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true');
    el.innerHTML = `<div class="sb-lb-bg"></div>
      <div class="sb-lb-stage"><p class="sb-hint"></p>
        <button class="sb-lb-nav prev" type="button" aria-label="${t('lb_prev')}"><svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg></button>
        <button class="sb-lb-nav next" type="button" aria-label="${t('lb_next')}"><svg viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg></button></div>
      <aside class="sb-lb-info"><p class="sb-lb-count"></p><h2 class="sb-lb-title"></h2><p class="sb-lb-meta"></p><p class="sb-lb-cap"></p>
        <div class="sb-lb-thumbs"></div><a class="sb-btn sb-lb-ask" target="_blank" rel="noopener"></a></aside>
      <button class="sb-lb-close" type="button"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg></button>`;
    img = document.createElement('img'); img.className = 'sb-lb-img'; img.alt = ''; img.draggable = false;
    el.appendChild(img); document.body.appendChild(el);
    bg = $('.sb-lb-bg', el); info = $('.sb-lb-info', el); hint = $('.sb-hint', el);
    bg.addEventListener('click', close);
    $('.sb-lb-close', el).addEventListener('click', close);
    $('.sb-lb-nav.prev', el).addEventListener('click', () => step(-1));
    $('.sb-lb-nav.next', el).addEventListener('click', () => step(1));
    $('.sb-lb-stage', el).addEventListener('click', e => { if (e.target.classList.contains('sb-lb-stage')) close(); });
    addEventListener('keydown', e => {
      if (!open) return;
      if (e.key === 'Escape') close(); else if (e.key === 'ArrowRight') step(1); else if (e.key === 'ArrowLeft') step(-1);
      else if (e.key === 'Tab') { const f = $$('button, a[href]', el).filter(x => x.offsetParent); const i = f.indexOf(document.activeElement); if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); } else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); } }
    });
    addEventListener('resize', () => { if (open) placeImg(false); });
    lens = loupe(img, { touch: true, wheel: true, src: () => img.dataset.big, onHold: v => { holding = v; } });
    // deslizar para pasar de obra en el teléfono
    let sw = null;
    img.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse') sw = { x: e.clientX, y: e.clientY, t: performance.now() }; });
    img.addEventListener('pointerup', e => {
      if (!sw || holding || lens.active) { sw = null; return; }
      const dx = e.clientX - sw.x, dy = e.clientY - sw.y, dt = performance.now() - sw.t; sw = null;
      if (dt < 600 && Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.4) step(dx < 0 ? 1 : -1);
      else if (dt < 600 && dy > 90 && Math.abs(dy) > Math.abs(dx) * 1.4) close();
    });
    ML.onLang(() => { if (open) fill(); });
  }
  const work = () => BY_ID[list[idx]];
  // Rectángulo donde cabe la imagen entera dentro del escenario
  function fitRect() {
    const se = $('.sb-lb-stage', el), r = se.getBoundingClientRect(), pt = parseFloat(getComputedStyle(se).paddingTop) || 0;
    const st = { left: r.left, top: r.top + pt, width: r.width, height: r.height - pt }, p = work().imgs[view].p, a = ratio(p);
    const pad = innerWidth < 700 ? 14 : 40, W = st.width - pad * 2, H = st.height - pad * 2;
    let w = Math.min(W, H * a), h = w / a;
    return { left: st.left + (st.width - w) / 2, top: st.top + (st.height - h) / 2, width: w, height: h };
  }
  function placeImg() { const r = fitRect(); Object.assign(img.style, { left: r.left + 'px', top: r.top + 'px', width: r.width + 'px', height: r.height + 'px' }); return r; }
  function setSrc(from) {
    const p = work().imgs[view].p;
    img.src = from || T_(p); img.dataset.big = W_(p);
    const hi = new Image(); hi.decoding = 'async'; hi.src = W_(p);
    hi.onload = () => { if (work().imgs[view].p === p) img.src = W_(p); };
  }
  function fill() {
    const w = work(), L = ML.lang;
    el.setAttribute('aria-label', w.name);
    $('.sb-lb-count', el).textContent = list.length > 1 ? `${idx + 1} ${t('views_of')} ${list.length}` : '';
    $('.sb-lb-title', el).textContent = w.name;
    $('.sb-lb-meta', el).textContent = meta(w);
    const cap = (w.imgs[view].cap && w.imgs[view].cap[L]) || (view === 0 && w.desc && w.desc[L]) || '';
    $('.sb-lb-cap', el).textContent = cap;
    const th = $('.sb-lb-thumbs', el);
    th.innerHTML = w.imgs.length > 1 ? w.imgs.map((m, i) => `<button type="button" data-v="${i}" aria-label="${i + 1} / ${w.imgs.length}" ${i === view ? 'aria-current="true"' : ''}><img src="${T_(m.p)}" alt="" loading="lazy"></button>`).join('') : '';
    $$('button', th).forEach(b => b.addEventListener('click', () => showView(+b.dataset.v)));
    const ask = $('.sb-lb-ask', el); ask.textContent = t('ask'); ask.href = ML.waLink(t('ask_msg').replace('{w}', w.name));
    $('.sb-lb-close', el).setAttribute('aria-label', t('close'));
    $$('.sb-lb-nav', el).forEach(b => b.hidden = list.length < 2);
  }
  function showHint() {
    hint.textContent = FINE ? t('hint_mouse') : t('hint_touch');
    hint.classList.remove('gone'); clearTimeout(showHint.t); showHint.t = setTimeout(() => hint.classList.add('gone'), 3200);
  }
  // Abrir: la imagen crece desde la miniatura tocada hasta su lugar
  function openWork(id, opts = {}) {
    if (!el) mount();
    list = opts.list || [id]; idx = Math.max(0, list.indexOf(id)); view = opts.view || 0;
    srcEl = opts.from || null; lastFocus = document.activeElement;
    el.hidden = false; open = true; document.documentElement.classList.add('lb-open');
    fill();
    const r1 = placeImg();
    const thumb = srcEl && srcEl.querySelector('img');
    setSrc(thumb && thumb.complete ? thumb.currentSrc : null);
    if (!RM) {
      bg.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 320, easing: 'ease-out' });
      info.animate([{ opacity: 0, transform: 'translateY(14px)' }, { opacity: 1, transform: 'none' }], { duration: 520, delay: 120, easing: EASE_OUT, fill: 'backwards' });
      $$('.sb-lb-close, .sb-lb-nav', el).forEach(b => b.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300, delay: 180, fill: 'backwards' }));
      if (thumb) {
        const r0 = thumb.getBoundingClientRect();
        thumb.style.visibility = 'hidden';
        img.animate([{ transform: `translate(${r0.left - r1.left}px, ${r0.top - r1.top}px) scale(${r0.width / r1.width}, ${r0.height / r1.height})`, borderRadius: getComputedStyle(thumb).borderRadius },
                     { transform: 'none', borderRadius: '0px' }], { duration: 640, easing: SPRING, fill: 'backwards' });
      } else img.animate([{ opacity: 0, transform: 'scale(.96)' }, { opacity: 1, transform: 'none' }], { duration: 420, easing: EASE_OUT });
    }
    try { history.replaceState(null, '', '#obra/' + id); } catch (e) {}
    $('.sb-lb-close', el).focus({ preventScroll: true });
    showHint();
  }
  // Cerrar: vuelve a su miniatura si está a la vista; si no, se desvanece
  function close() {
    if (!open) return; open = false; lens.hide();
    const card = $(`[data-work="${list[idx]}"]`), thumb = card && card.querySelector('img');
    const done = () => { el.hidden = true; document.documentElement.classList.remove('lb-open'); $$('.sb-card img').forEach(i => i.style.visibility = ''); };
    try { history.replaceState(null, '', location.pathname + location.search); } catch (e) {}
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
    if (RM) return done();
    const r1 = img.getBoundingClientRect(), r0 = thumb && view === 0 ? thumb.getBoundingClientRect() : null;
    const inView = r0 && r0.bottom > 0 && r0.top < innerHeight && r0.width > 0;
    bg.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 300, easing: 'ease-in', fill: 'forwards' });
    info.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 160, fill: 'forwards' });
    $$('.sb-lb-close, .sb-lb-nav', el).forEach(b => b.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 160, fill: 'forwards' }));
    const a = inView
      ? img.animate([{ transform: 'none' }, { transform: `translate(${r0.left - r1.left}px, ${r0.top - r1.top}px) scale(${r0.width / r1.width}, ${r0.height / r1.height})` }], { duration: 420, easing: 'cubic-bezier(.4,0,.2,1)', fill: 'forwards' })
      : img.animate([{ opacity: 1 }, { opacity: 0, transform: 'scale(.97)' }], { duration: 260, fill: 'forwards' });
    a.onfinish = () => { done(); el.getAnimations({ subtree: true }).forEach(x => x.cancel()); img.getAnimations().forEach(x => x.cancel()); };
  }
  function crossfade(dir) {
    placeImg(); setSrc();
    if (!RM) img.animate([{ opacity: 0, transform: `translateX(${dir * 24}px)` }, { opacity: 1, transform: 'none' }], { duration: 420, easing: EASE_OUT });
  }
  function showView(v) { if (v === view) return; const d = v > view ? 1 : -1; view = v; fill(); crossfade(d); }
  function step(d) {
    if (list.length < 2) return;
    $$('.sb-card img').forEach(i => i.style.visibility = '');
    idx = (idx + d + list.length) % list.length; view = 0; fill(); crossfade(d);
    try { history.replaceState(null, '', '#obra/' + list[idx]); } catch (e) {}
  }
  return { open: openWork, close };
})();

// Clic en cualquier tarjeta: abre el visor con la lista de su grupo
document.addEventListener('click', e => {
  const c = e.target.closest('[data-work]'); if (!c) return;
  e.preventDefault();
  const group = c.closest('[data-group]');
  const list = group ? $$('[data-work]', group).filter(x => x.offsetParent).map(x => x.dataset.work) : [c.dataset.work];
  LB.open(c.dataset.work, { from: c, list: [...new Set(list)] });
});

// ── Aparecer al entrar en pantalla, una sola vez ──
function reveal(root = document) {
  const els = $$('.sb-rv:not(.in)', root);
  if (RM || !('IntersectionObserver' in window)) { els.forEach(e => e.classList.add('in')); return; }
  const io = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } }), { rootMargin: '0px 0px -8% 0px' });
  els.forEach(e => io.observe(e));
}

// ── Control segmentado con una píldora que se desliza ──
function segmented(host, items, cur, onChange) {
  host.classList.add('sb-seg'); host.setAttribute('role', 'tablist');
  host.innerHTML = `<span class="sb-seg-pill" aria-hidden="true"></span>` + items.map(([k, n]) => `<button type="button" role="tab" data-k="${k}">${n}</button>`).join('');
  const pill = $('.sb-seg-pill', host);
  const set = (k, animate) => {
    cur = k;
    $$('button', host).forEach(b => b.setAttribute('aria-selected', b.dataset.k === k));
    const b = $(`button[data-k="${k}"]`, host); if (!b) return;
    pill.style.transition = animate && !RM ? '' : 'none';
    pill.style.width = b.offsetWidth + 'px'; pill.style.transform = `translateX(${b.offsetLeft}px)`;
  };
  host.addEventListener('click', e => { const b = e.target.closest('button'); if (!b || b.dataset.k === cur) return; set(b.dataset.k, true); onChange(b.dataset.k); b.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' }); });
  requestAnimationFrame(() => set(cur, false));
  addEventListener('resize', () => set(cur, false));
  return { set };
}

// ── Filas justificadas: todas las obras con su proporción, cada fila llena el ancho ──
function justify(host, h0) {
  const items = $$(':scope > .sb-card', host).filter(c => c.style.display !== 'none');
  const W = host.clientWidth, gap = parseFloat(getComputedStyle(host).columnGap) || 16;
  const target = typeof h0 === 'function' ? h0(W) : h0;
  let row = [], sum = 0;
  const flush = last => {
    if (!row.length) return;
    const h = last ? Math.min(target, (W - gap * (row.length - 1)) / sum) : (W - gap * (row.length - 1)) / sum;
    row.forEach(([c, a]) => { c.style.width = (a * h) + 'px'; });
    row = []; sum = 0;
  };
  items.forEach(c => {
    const a = parseFloat(c.querySelector('.sb-frame').style.aspectRatio) || 1;
    row.push([c, a]); sum += a;
    if (sum * target + gap * (row.length - 1) >= W) flush(false);
  });
  flush(true);
}

// ── Firma pequeña: se escribe una vez, de izquierda a derecha, cuando aparece ──
function sig(host, opts = {}) {
  const set = ML.signature(host, { label: 'Max Langevin', ...opts });
  if (RM || !('IntersectionObserver' in window)) { set(1); return; }
  const io = new IntersectionObserver(es => {
    if (!es.some(e => e.isIntersecting)) return; io.disconnect();
    const t0 = performance.now() + 150, D = 1500;
    const f = now => { const k = clamp((now - t0) / D); set(ML.ease(k)); if (k < 1) requestAnimationFrame(f); };
    requestAnimationFrame(f);
  }, { threshold: .6 });
  io.observe(host);
}

// ── Barra superior: se vuelve translúcida con desenfoque al bajar ──
function nav(el) { const f = () => el.classList.toggle('scrolled', scrollY > 8); addEventListener('scroll', f, { passive: true }); f(); }

function init(opts = {}) {
  const strings = { es: { ...STR.es, ...(opts.strings?.es || {}) }, en: { ...STR.en, ...(opts.strings?.en || {}) } };
  ML.boot({ strings });
  const h = location.hash.match(/^#obra\/([\w-]+)/);
  if (h && BY_ID[h[1]]) setTimeout(() => LB.open(h[1]), 300);
}

window.SB = { card, loupe, LB, reveal, segmented, justify, sig, nav, init, meta, SPRING, FINE };
})();
