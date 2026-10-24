import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useProgress } from '@react-three/drei';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import Lenis from 'lenis';
import Scene from './Scene.jsx';
import { STR } from './i18n.js';
import { RIG, S, ML, RM, TOUCH } from './state.js';

gsap.registerPlugin(ScrollTrigger, SplitText);
const pad = n => String(n).padStart(2, '0');

// ── Firma: se arma de izquierda a derecha según un progreso 0–1; lo que falta no se ve (plan compartido en core.js) ──
function Signature({ progress, className = '' }) {
  const id = useMemo(() => 'm' + Math.random().toString(36).slice(2, 8), []);
  const plan = ML.sigPlan(), pens = useRef([]);
  useLayoutEffect(() => {
    const t = Math.min(1, Math.max(0, progress)), X = plan.x0 + (plan.x1 - plan.x0) * t;
    pens.current.forEach((p, i) => {
      const s = plan.strokes[i], v = t >= 1 ? s.L : plan.at(s, X);
      p.setAttribute('stroke-dasharray', `${s.L} ${s.L}`); p.setAttribute('stroke-dashoffset', s.L - v);
      p.style.visibility = v > .5 ? 'visible' : 'hidden';
    });
  }, [progress]);
  const SIG = ML.SIG;
  return (
    <svg viewBox={`0 0 ${SIG.w} ${SIG.h}`} className={className} role="img" aria-label="Max Langevin">
      <defs><mask id={id} maskUnits="userSpaceOnUse" x="0" y="0" width={SIG.w} height={SIG.h}>
        <g fill="none" stroke="#fff" strokeWidth="46" strokeLinecap="round" strokeLinejoin="round">
          {plan.strokes.map((s, i) => <path key={i} d={s.d} ref={el => (pens.current[i] = el)} />)}
        </g></mask></defs>
      <path d={SIG.fill} fillRule="evenodd" fill="currentColor" mask={`url(#${id})`} />
    </svg>
  );
}

// ── Pantalla de carga: la firma se escribe con el porcentaje real de carga del 3D ──
function Loader({ t, onDone }) {
  const { progress, active } = useProgress();
  const [shown, setShown] = useState(0);
  const ref = useRef();
  // respaldo: si no hay nada que cargar o algo falla, no dejar a nadie esperando
  useEffect(() => { const a = setTimeout(() => setShown(s => (s === 0 ? 100 : s)), 2500), b = setTimeout(() => setShown(100), 9000); return () => { clearTimeout(a); clearTimeout(b); }; }, []);
  useEffect(() => { setShown(s => Math.max(s, progress)); }, [progress]);
  useEffect(() => {
    if (shown < 100) return;
    const tl = gsap.timeline({ delay: RM ? 0 : .35, onComplete: onDone });
    tl.to(ref.current.querySelector('.ld-in'), { autoAlpha: 0, y: -20, duration: RM ? 0 : .4, ease: 'power2.in' })
      .to(ref.current, { clipPath: 'inset(0 0 100% 0)', duration: RM ? 0 : .9, ease: 'expo.inOut' });
    return () => tl.kill();
  }, [shown]);
  return (
    <div ref={ref} className="fixed inset-0 z-[400] grid place-items-center bg-ink text-gesso" style={{ clipPath: 'inset(0 0 0 0)' }}>
      <div className="ld-in grid w-[min(440px,78vw)] gap-5">
        <Signature progress={shown / 100} className="w-full text-gesso" />
        <div className="flex justify-between font-mono text-xs uppercase tracking-widest text-gesso/70"><span>{t('loading')}</span><span>{Math.round(shown)}%</span></div>
      </div>
    </div>
  );
}

function Cursor() {
  const ref = useRef();
  useEffect(() => {
    if (TOUCH || RM) return;
    const el = ref.current, xTo = gsap.quickTo(el, 'x', { duration: .35, ease: 'power3' }), yTo = gsap.quickTo(el, 'y', { duration: .35, ease: 'power3' });
    const move = e => { xTo(e.clientX); yTo(e.clientY); };
    const over = e => { const c = e.target.closest('[data-cursor]'); el.classList.toggle('big', !!c); el.firstChild.textContent = c ? c.dataset.cursor : ''; };
    addEventListener('pointermove', move); addEventListener('pointerover', over);
    return () => { removeEventListener('pointermove', move); removeEventListener('pointerover', over); };
  }, []);
  return <div ref={ref} className="cursor" aria-hidden="true"><span /></div>;
}

// Botón magnético: sigue un poco al cursor
function Magnetic({ as: Tag = 'a', className = '', children, ...props }) {
  const ref = useRef();
  useEffect(() => {
    if (TOUCH || RM) return;
    const el = ref.current, xTo = gsap.quickTo(el, 'x', { duration: .5, ease: 'elastic.out(1,.4)' }), yTo = gsap.quickTo(el, 'y', { duration: .5, ease: 'elastic.out(1,.4)' });
    const m = e => { const r = el.getBoundingClientRect(); xTo((e.clientX - r.left - r.width / 2) * .3); yTo((e.clientY - r.top - r.height / 2) * .4); };
    const l = () => { xTo(0); yTo(0); };
    el.addEventListener('pointermove', m); el.addEventListener('pointerleave', l);
    return () => { el.removeEventListener('pointermove', m); el.removeEventListener('pointerleave', l); };
  }, []);
  return <Tag ref={ref} className={`inline-flex min-h-[48px] items-center gap-2 rounded-full px-6 py-3 font-medium ${className}`} {...props}>{children}</Tag>;
}

const GALLERY = ['karin-goldberg', 'marcos-16-16', 'veteran-george', 'el-conde', 'consu-gato', 'santiago', 'vicente', 'en-verano', 'gallagath', 'coti', 'el-jardin', 'bouguereau', 'parmigianino', 'la-mosca', 'guiseppe', 'san-jorge'];

function Content({ lang, t, toggleLang, setFrameloop }) {
  const root = useRef();
  const [footSig, setFootSig] = useState(0);
  const [menu, setMenu] = useState(false);
  const W = ML.WORKS, B = ML.BY_ID;

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const wide = innerWidth > innerHeight;
      const mob = innerWidth < 760;
      // Cámara del caballete: tres movimientos amarrados al scroll
      Object.assign(RIG, { x: 0, y: 1.2, z: mob ? 50 : 34, lx: 0, ly: mob ? 5.5 : .4, lz: 0, ry: -.5, ex: wide ? 4.4 : 0 });
      const rig = gsap.timeline({ scrollTrigger: { trigger: '#top', start: 'top top', end: 'bottom bottom', scrub: RM ? true : 1.2 } });
      rig.to(RIG, { z: mob ? 30 : 21, y: 2, ly: 1.1, ex: 0, ry: 0, duration: 1, ease: 'power2.inOut' })
        .to(RIG, { x: mob ? 13 : 10, z: mob ? 17 : 12, y: 3, ly: 1.1, ry: -1.05, duration: 1, ease: 'power2.inOut' })
        .to(RIG, { x: .15, z: mob ? 8.5 : 6.4, y: 2.3, lx: .15, ly: 2.1, ry: 0, duration: 1, ease: 'power2.inOut' });
      // Textos del caballete y del pigmento según su tramo de scroll
      document.querySelectorAll('[data-cap]').forEach(el => {
        const sec = el.closest('section'), [a, b] = el.dataset.cap.split(',').map(Number);
        gsap.set(el, { autoAlpha: a === 0 ? 1 : 0 });
        const tl = gsap.timeline({ scrollTrigger: { trigger: sec, start: 'top top', end: 'bottom bottom', scrub: true } });
        if (a > 0) tl.fromTo(el, { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: .06 }, a);
        if (b < 1) tl.to(el, { autoAlpha: 0, y: -40, duration: .06 }, b);
        tl.set({}, {}, 1);
      });
      // Escena activa y progreso del pigmento
      ScrollTrigger.create({ trigger: '#pigmento', start: 'top 55%', end: 'max', onToggle: s => { S.scene = s.isActive ? 'pigment' : 'hero'; } });
      ScrollTrigger.create({ trigger: '#pigmento', start: 'top top', end: 'bottom bottom', scrub: true, onUpdate: s => (S.pigment = s.progress * 1.12) });
      // El lienzo 3D se apaga al terminar el pigmento
      ScrollTrigger.create({ trigger: '#pigmento', start: 'bottom bottom', end: 'bottom 40%', scrub: true,
        onUpdate: s => { const c = document.querySelector('canvas'); if (c) c.parentElement.style.opacity = 1 - s.progress; setFrameloop(s.progress >= 1 ? 'never' : 'always'); } });
      // Galería horizontal fija
      const track = root.current.querySelector('#track');
      if (!RM) gsap.to(track, { x: () => -(track.scrollWidth - innerWidth), ease: 'none',
        scrollTrigger: { trigger: '#obras', pin: true, scrub: 1, end: () => '+=' + (track.scrollWidth - innerWidth), invalidateOnRefresh: true,
          onUpdate: s => gsap.set('#g-bar', { scaleX: s.progress }) } });
      // Títulos que se revelan palabra por palabra
      document.querySelectorAll('[data-split]').forEach(el => {
        const sp = SplitText.create(el, { type: 'words', mask: 'words' });
        gsap.from(sp.words, { yPercent: 110, duration: RM ? 0 : 1, stagger: .045, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 88%' } });
      });
      // Imágenes que se descubren
      document.querySelectorAll('[data-reveal]').forEach(el => gsap.fromTo(el, { clipPath: 'inset(100% 0 0 0)' }, { clipPath: 'inset(0% 0 0 0)', duration: RM ? 0 : 1.4, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 85%' } }));
      // Firma del cierre
      ScrollTrigger.create({ trigger: '#firma', start: 'top 95%', end: 'bottom 70%', scrub: true, onUpdate: s => setFootSig(s.progress) });
      ScrollTrigger.refresh();
    }, root);
    return () => ctx.revert();
  }, [lang]);

  // filtro de pintura líquida: la distorsión sube y baja al entrar a una obra
  useEffect(() => {
    const disp = document.getElementById('liquid-disp'), turb = document.getElementById('liquid-turb');
    const enter = e => { if (!e.target.closest('.liquid')) return; gsap.fromTo(disp, { attr: { scale: 0 } }, { attr: { scale: 38 }, duration: .45, yoyo: true, repeat: 1, ease: 'sine.inOut' }); gsap.to(turb, { attr: { baseFrequency: '0.012 0.03' }, duration: .9, yoyo: true, repeat: 1 }); };
    root.current.addEventListener('pointerover', enter);
    return () => root.current && root.current.removeEventListener('pointerover', enter);
  }, []);

  const L = lang;
  const go = (e, id) => { e.preventDefault(); setMenu(false); const el = document.getElementById(id); if (el) (window.__lenis ? window.__lenis.scrollTo(el, { offset: 0 }) : el.scrollIntoView()); };
  const navItems = [['top', 'n_studio'], ['pigmento', 'n_pigment'], ['obras', 'n_works'], ['about', 'n_about'], ['encargos', 'n_commission'], ['contact', 'n_contact']];
  const pal = ML.PALETTES['coti'];
  const copyMail = () => {
    const fallback = () => { const a = root.current.querySelector('.js-mail'), r = document.createRange(); r.selectNodeContents(a); const s = getSelection(); s.removeAllRanges(); s.addRange(r); ML.toast(ML.t('copy_fail')); };
    try { navigator.clipboard.writeText(ML.MAIL).then(() => ML.toast(ML.t('copied')), fallback); } catch (e) { fallback(); }
  };

  return (
    <div ref={root}>
      <svg width="0" height="0" className="absolute" aria-hidden="true"><filter id="liquid"><feTurbulence id="liquid-turb" type="fractalNoise" baseFrequency="0.008 0.02" numOctaves="2" seed="4" /><feDisplacementMap id="liquid-disp" in="SourceGraphic" scale="0" /></filter></svg>

      <header className="gutter fixed inset-x-0 top-0 z-[140] flex h-16 items-center bg-gesso/75 backdrop-blur-md justify-between gap-4 pt-[env(safe-area-inset-top)]">
        <a href="#top" onClick={e => go(e, 'top')} className="flex items-center gap-2.5 font-display text-lg"><img src={`${window.ML_BASE}logo_ml.png`} alt="" className="h-7 w-7" />Max Langevin</a>
        <nav aria-label="Secciones" className="hidden items-center gap-6 lg:flex">
          {navItems.slice(0, 5).map(([id, k]) => <a key={id} href={`#${id}`} onClick={e => go(e, id)} className="text-sm text-smoke transition-colors hover:text-ink">{t(k)}</a>)}
        </nav>
        <div className="flex items-center gap-2">
          <button type="button" onClick={toggleLang} aria-label={L === 'es' ? 'Switch to English' : 'Cambiar a español'} className="min-h-[38px] min-w-[46px] rounded-full font-mono text-xs ring-1 ring-line">{L === 'es' ? 'EN' : 'ES'}</button>
          <button type="button" className="grid h-11 w-11 place-items-center lg:hidden" aria-expanded={menu} aria-label={t('menu')} onClick={() => setMenu(m => !m)}>
            <span className="block h-px w-5 bg-ink shadow-[0_6px_0_#141210]" />
          </button>
        </div>
      </header>
      {menu && (
        <div className="gutter fixed inset-0 z-[130] flex flex-col gap-2 bg-gesso pt-28">
          {navItems.map(([id, k]) => <a key={id} href={`#${id}`} onClick={e => go(e, id)} className="font-display text-4xl">{t(k)}</a>)}
        </div>
      )}

      <main className="relative z-10">
        {/* 1 · El caballete */}
        <section id="top" className="relative h-[420vh]" aria-label="Karin Goldberg">
          <div className="sticky top-0 h-[100svh]" data-cursor={t('drag')}>
            <div data-cap="0,.12" className="gutter absolute inset-x-0 top-24 grid max-w-[44rem] gap-5 md:top-1/2 md:-translate-y-1/2">
              <p className="k text-cadmio">{t('h_k')}</p>
              <h1 className="font-display text-[clamp(3rem,8vw,7.6rem)] leading-[.92] tracking-tightest">Maximiliano Langevin</h1>
              <p className="hidden max-w-[34ch] text-lg text-smoke md:block">{t('h_p')}</p>
              <p className="k hidden text-smoke md:block">{TOUCH ? t('h_scroll') : t('h_drag')}</p>
            </div>
            <div data-cap=".18,.4" className="gutter absolute bottom-[8vh] left-0 grid max-w-[30rem] gap-2"><p className="rounded bg-gesso/80 p-3 backdrop-blur md:bg-transparent md:p-0 md:backdrop-blur-none font-display text-[clamp(1.6rem,3vw,2.6rem)] leading-tight">{t('c1')}</p><p className="k text-smoke">{t('c1s')}</p></div>
            <div data-cap=".46,.68" className="gutter absolute bottom-[8vh] left-0 grid max-w-[30rem] gap-2"><p className="rounded bg-gesso/80 p-3 backdrop-blur md:bg-transparent md:p-0 md:backdrop-blur-none font-display text-[clamp(1.6rem,3vw,2.6rem)] leading-tight">{t('c2')}</p></div>
            <div data-cap=".86,1" className="gutter absolute bottom-[8vh] left-0 grid max-w-[30rem] gap-4"><p className="rounded bg-gesso/80 p-3 font-display text-[clamp(1.6rem,3vw,2.6rem)] leading-tight backdrop-blur">{t('c3')}</p><div><Magnetic as="button" type="button" data-open="karin-goldberg" className="bg-ink text-gesso">{t('see')}</Magnetic></div></div>
          </div>
        </section>

        {/* 2 · Pigmento */}
        <section id="pigmento" className="relative h-[320vh]" aria-labelledby="pig-h">
          <div className="sticky top-0 h-[100svh]">
            <div data-cap="0,.42" className="gutter absolute inset-x-0 top-24 grid max-w-[36rem] gap-4 md:left-auto md:right-0 md:top-1/2 md:-translate-y-1/2"><div className="grid gap-4 rounded bg-gesso/80 p-5 backdrop-blur-md">
              <p className="k text-cadmio">{t('p_k')}</p>
              <h2 id="pig-h" className="font-display text-[clamp(2.2rem,4.6vw,4.4rem)] leading-[.98] tracking-tight">{t('p_h')}</h2>
              <p className="text-lg text-smoke">{t('p_p')}</p>
            </div></div>
            <div data-cap=".55,1" className="gutter absolute bottom-[4vh] right-0 grid w-full max-w-[32rem] gap-3 md:bottom-auto md:top-1/2 md:-translate-y-1/2"><div className="grid gap-3 rounded bg-gesso/85 p-5 backdrop-blur-md">
              <p className="font-display text-[clamp(1.6rem,2.8vw,2.4rem)] leading-tight">{t('p_2')}</p>
              <div className="flex h-12 w-full overflow-hidden rounded-sm" role="img" aria-label={t('p_pal')}>{pal.map(([hex, s]) => <span key={hex} style={{ flex: s, background: hex }} title={`${hex} · ${Math.round(s * 100)}%`} />)}</div>
              <div className="flex justify-between font-mono text-[11px] text-smoke">{pal.slice(0, 4).map(([hex, s]) => <span key={hex}>{hex} {Math.round(s * 100)}%</span>)}</div>
              <p className="k text-smoke">{t('p_end')}</p>
              <div><Magnetic as="button" type="button" data-open="coti" className="bg-ink text-gesso">{t('see')}</Magnetic></div>
            </div></div>
          </div>
        </section>

        {/* 3 · Galería horizontal */}
        <section id="obras" className="relative h-[100svh] overflow-hidden bg-paper" aria-labelledby="g-h">
          <div className="gutter flex items-end justify-between gap-6 pt-24">
            <div className="grid gap-3"><p className="k text-cadmio">{t('g_k')}</p><h2 id="g-h" data-split className="font-display text-[clamp(2.2rem,5vw,4.6rem)] leading-none tracking-tight">{t('g_h')}</h2></div>
            <div className="hidden max-w-[22rem] gap-3 md:grid"><p className="text-sm text-smoke">{t('g_hint')}</p><div className="h-px w-full bg-line"><div id="g-bar" className="h-px origin-left scale-x-0 bg-ink" /></div></div>
          </div>
          <div id="track" className={`gutter mt-[5vh] flex w-max items-end gap-[clamp(1.4rem,3.4vw,3.4rem)] ${RM ? 'overflow-x-auto' : ''}`}>
            {GALLERY.map((id, i) => { const w = B[id]; const a = ML.ratio(w.imgs[0].p); return (
              <button key={id} type="button" data-open={id} data-cursor={t('view')} className="liquid group grid gap-3 text-left" aria-label={`${w.name}, ${ML.metaLine(w)}`}>
                <span className="block overflow-hidden bg-gesso shadow-[0_24px_40px_-24px_rgba(20,18,16,.5)]" style={{ height: 'min(54svh,560px)', width: `calc(min(54svh,560px) * ${a.toFixed(3)})` }}>
                  <img src={ML.T_(w.imgs[0].p)} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]" />
                </span>
                <span className="flex items-baseline gap-3"><span className="font-mono text-xs text-smoke">{pad(i + 1)}</span><span className="font-display text-xl">{w.name}</span></span>
                <span className="-mt-2 font-mono text-[11px] text-smoke">{ML.metaLine(w)}</span>
              </button>); })}
          </div>
        </section>

        {/* Ilustración y objetos */}
        <section className="gutter bg-paper py-[12vh]" aria-labelledby="more-h">
          <h2 id="more-h" data-split className="mb-10 font-display text-[clamp(1.8rem,3.4vw,3rem)] leading-tight">{t('g_more')}</h2>
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-5">
            {W.filter(w => w.cat === 'ilustracion' || w.cat === 'creaciones').map(w => (
              <button key={w.id} type="button" data-open={w.id} data-cursor={t('view')} className="group grid gap-2 text-left">
                <span className="block aspect-square overflow-hidden bg-gesso"><img src={ML.T_(w.imgs[0].p)} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" /></span>
                <span className="font-display">{w.name}</span><span className="-mt-1.5 font-mono text-[11px] text-smoke">{ML.yearLabel(w)}</span>
              </button>))}
          </div>
        </section>

        {/* Biografía */}
        <section id="about" className="gutter grid gap-12 bg-gesso py-[14vh] md:grid-cols-[5fr_7fr]" aria-labelledby="about-h">
          <figure className="grid max-w-[460px] gap-3 self-start md:sticky md:top-24">
            <img data-reveal src={`${window.ML_BASE}maximiliano_langevin.jpg`} alt="Retrato de Maximiliano Langevin" className="aspect-square w-full object-cover grayscale" loading="lazy" />
            <figcaption className="k text-smoke">Santiago, Chile · 1996</figcaption>
          </figure>
          <div className="min-w-0">
            <p className="k text-cadmio">{t('a_k')}</p>
            <h2 id="about-h" data-split className="mb-8 mt-3 font-display text-[clamp(2.2rem,4.6vw,4.2rem)] leading-none tracking-tight">Maximiliano Langevin Larraín</h2>
            <div className="grid max-w-[62ch] gap-4 text-smoke [&_em]:text-ink">{ML.BIO[L].map((p, i) => <p key={i} className={i === 0 ? 'text-xl leading-relaxed text-ink' : ''} dangerouslySetInnerHTML={{ __html: p }} />)}</div>
            <div className="mt-10 grid gap-8 sm:grid-cols-2">{ML.CV[L].map(([h, rows]) => (
              <div key={h}><h3 className="k mb-2 text-cadmio">{h}</h3><ul>{rows.map(([a, b], i) => <li key={i} className="grid grid-cols-[6.5rem_1fr] gap-3 border-t border-line py-2 text-sm"><span className="text-smoke">{a}</span><span>{b}</span></li>)}</ul></div>))}</div>
          </div>
        </section>

        {/* Encargos */}
        <section id="encargos" className="gutter bg-ink py-[14vh] text-gesso" aria-labelledby="enc-h">
          <p className="k text-[#e57a63]">{t('enc_k')}</p>
          <h2 id="enc-h" data-split className="mt-3 max-w-[20ch] font-display text-[clamp(2.2rem,5vw,4.6rem)] leading-none tracking-tight">{t('enc_h')}</h2>
          <ol className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">{ML.COMMISSION[L].map(([a, b], i) => (
            <li key={a} className="grid gap-2 border-t border-gesso/25 pt-4"><span className="font-mono text-xs text-gesso/60">{pad(i + 1)}</span><b className="font-display text-2xl font-normal">{a}</b><span className="text-gesso/70">{b}</span></li>))}</ol>
        </section>

        {/* Contacto */}
        <section id="contact" className="gutter bg-gesso pb-10 pt-[14vh]" aria-labelledby="ct-h">
          <h2 id="ct-h" data-split className="max-w-[14ch] font-display text-[clamp(2.8rem,8vw,7.4rem)] leading-[.92] tracking-tightest">{t('ct_h')}</h2>
          <p className="mt-6 max-w-[40ch] text-lg text-smoke">{t('ct_p')}</p>
          <p className="mt-10 font-display text-[clamp(1.5rem,4vw,3rem)]"><a className="js-mail underline decoration-1 underline-offset-8" href={`mailto:${ML.MAIL}`}>{ML.MAIL}</a></p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Magnetic className="js-wa bg-cadmio text-white" href={ML.waLink(L === 'es' ? 'Hola Max, vi tu sitio web y me gustaría conversar sobre un retrato.' : 'Hi Max, I saw your website and would like to talk about a portrait.')} target="_blank" rel="noopener" data-cursor="WhatsApp">{t('wa')}</Magnetic>
            <Magnetic as="button" type="button" className="ring-1 ring-ink" onClick={copyMail}>{t('copy')}</Magnetic>
          </div>
          <ul className="mt-10 flex flex-wrap gap-x-8 gap-y-2 font-mono text-xs uppercase tracking-widest text-smoke">
            <li><a className="inline-block py-2 hover:text-ink" href="https://www.instagram.com/max_langevinci/" target="_blank" rel="noopener">Instagram</a></li>
            <li><a className="inline-block py-2 hover:text-ink" href="https://www.behance.net/maximilianolangevin" target="_blank" rel="noopener">Behance</a></li>
            <li><a className="inline-block py-2 hover:text-ink" href="https://www.linkedin.com/in/maximilianolangevin/" target="_blank" rel="noopener">LinkedIn</a></li>
          </ul>
          <div id="firma" className="mt-16 w-[min(620px,92%)] text-ink"><Signature progress={RM ? 1 : footSig} className="w-full" /></div>
          <footer className="mt-12 flex flex-wrap justify-between gap-4 border-t border-line pt-5 font-mono text-xs text-smoke"><span>© 2026 Maximiliano Langevin</span><span>Langevinci®</span></footer>
        </section>
      </main>
    </div>
  );
}

export default function App() {
  const initial = (() => { try { const s = localStorage.getItem('ml-lang'); if (s) return s; } catch (e) {} return (navigator.language || 'es').toLowerCase().startsWith('es') ? 'es' : 'en'; })();
  const [lang, setLang] = useState(initial);
  const [loaded, setLoaded] = useState(false);
  const [frameloop, setFrameloop] = useState('always');
  const t = k => STR[lang][k] ?? STR.es[k] ?? k;
  const toggleLang = () => { const n = lang === 'es' ? 'en' : 'es'; ML.setLang(n); setLang(n); };
  useEffect(() => { ML.setLang(lang); document.documentElement.lang = lang; }, []);
  // Scroll suave (Lenis) conectado a ScrollTrigger
  useEffect(() => {
    if (RM) return;
    const lenis = new Lenis({ lerp: .1, wheelMultiplier: .9 });
    window.__lenis = lenis;
    lenis.on('scroll', ScrollTrigger.update);
    const tick = time => lenis.raf(time * 1000);
    gsap.ticker.add(tick); gsap.ticker.lagSmoothing(0);
    // el visor detiene el scroll de fondo
    const mo = new MutationObserver(() => document.documentElement.classList.contains('lb-open') ? lenis.stop() : lenis.start());
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => { mo.disconnect(); gsap.ticker.remove(tick); lenis.destroy(); };
  }, []);
  return (
    <>
      <Scene frameloop={frameloop} />
      <Content key={lang} lang={lang} t={t} toggleLang={toggleLang} setFrameloop={setFrameloop} />
      {!loaded && <Loader t={t} onDone={() => setLoaded(true)} />}
      <Cursor />
    </>
  );
}
