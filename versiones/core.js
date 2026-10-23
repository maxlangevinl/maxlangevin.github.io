/* Núcleo compartido por las cinco versiones: obras, textos, visor, firma, zoom y escenas de scroll.
   Cada versión pone su propio diseño encima y llama a ML.boot({...}). Requiere data.js antes. */
(() => {
const BASE = window.ML_BASE || '../images/';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const smooth = t => t * t * (3 - 2 * t);
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
if (RM) document.documentElement.classList.add('rm');
const W_ = p => `${BASE}w/${p}.webp`;
const T_ = p => `${BASE}t/${p}.webp`;
const ratio = p => SIZES[p] ? SIZES[p][0] / SIZES[p][1] : .75;
const WA = '56987658226';
const MAIL = 'maxlangevinl@gmail.com';

// ── OBRAS ──
const im = (p, es = '', en = '') => ({ p, cap: { es, en } });
const seq = (base, n, from = 1) => Array.from({ length: n - from + 1 }, (_, i) => im(`${base}_${i + from}`));
const OIL_LINEN = { es: 'Óleo sobre lino', en: 'Oil on linen' };
const OIL_CANVAS = { es: 'Óleo sobre tela', en: 'Oil on canvas' };
const DIGITAL = { es: 'Ilustración digital en Photoshop', en: 'Digital illustration in Photoshop' };
const ANIM = { es: 'Ilustración digital · Animación en After Effects', en: 'Digital illustration · After Effects animation' };
const FABRIANO = { es: 'Xilografía sobre papel Fabriano', en: 'Woodcut on Fabriano paper' };
const NONE = { es: '', en: '' };
const POLI = ['Exposición «Polímatas» en el Estadio Italiano, 2024', '"Polímatas" exhibition at the Estadio Italiano, 2024'];
const EASEL = ['En el caballete del taller', 'On the studio easel'];

// cm: [ancho, alto] para dibujar las obras a escala real cuando hace falta
const WORKS = [
  { id: 'karin-goldberg', name: 'Karin Goldberg', cat: 'pinturas', year: '2025', tech: OIL_LINEN, dims: '48 × 68 cm', cm: [48, 68], desc: NONE, imgs: seq('pinturas/karin_goldberg', 8) },
  { id: 'marcos-16-16', name: 'Marcos 16:16', cat: 'pinturas', year: 'WIP', tech: OIL_CANVAS, dims: '77,5 × 102,5 cm', cm: [77.5, 102.5],
    desc: { es: 'Obra en proceso. La inscripción sobre la reja es Marcos 16:16 en latín: «el que crea y sea bautizado, se salvará».', en: 'Work in progress. The inscription above the grille is Mark 16:16 in Latin: "he that believeth and is baptized shall be saved".' },
    imgs: [im('pinturas/marcos_16_16_1'), im('pinturas/marcos_16_16_2', ...EASEL), ...seq('pinturas/marcos_16_16', 7, 3)] },
  { id: 'veteran-george', name: 'Veteran George', cat: 'pinturas', year: '2024', tech: OIL_LINEN, dims: '28 × 40 cm', cm: [28, 40], desc: NONE,
    imgs: [im('pinturas/veteran_george_1'), im('pinturas/veteran_george_2'), im('pinturas/veteran_george_3', 'Maximiliano Langevin con la obra en el taller', 'Maximiliano Langevin with the work in the studio')] },
  { id: 'el-conde', name: 'El Conde', cat: 'pinturas', year: '2024', tech: OIL_LINEN, dims: '40 × 60 cm', cm: [40, 60], desc: NONE,
    imgs: [im('pinturas/el_conde_1'), im('pinturas/el_conde_2', ...POLI),
      im('pinturas/el_conde_3', 'Maximiliano Langevin a la izquierda y Francisco Uzabeaga a la derecha. «Polímatas», Estadio Italiano, 2024', 'Maximiliano Langevin (left) and Francisco Uzabeaga (right). "Polímatas", Estadio Italiano, 2024'),
      im('pinturas/el_conde_4', ...POLI),
      im('pinturas/el_conde_5', 'Juan de Dios Larraín (productor) y Pablo Larraín (director) de la película «El Conde» con la obra', 'Juan de Dios Larraín (producer) and Pablo Larraín (director) of the film "El Conde" with the work')] },
  { id: 'consu-gato', name: 'Consu gato', cat: 'pinturas', year: '2024', tech: OIL_LINEN, dims: '71 × 50 cm', cm: [71, 50], desc: NONE, imgs: [im('pinturas/consu_gato_c'), im('pinturas/consu_gato', ...EASEL)] },
  { id: 'santiago', name: 'Santiago', cat: 'pinturas', year: '2024', tech: OIL_LINEN, dims: '40 × 50 cm', cm: [40, 50], desc: NONE, imgs: [im('pinturas/santiago_c'), im('pinturas/santiago_1', ...EASEL), ...seq('pinturas/santiago', 4, 2)] },
  { id: 'vicente', name: 'Vicente', cat: 'pinturas', year: '2022', tech: OIL_LINEN, dims: '40 × 50 cm', cm: [40, 50], desc: NONE, imgs: [im('pinturas/vicente_c'), im('pinturas/vicente_1', ...EASEL), ...seq('pinturas/vicente', 8, 2)] },
  { id: 'en-verano', name: 'En verano', cat: 'pinturas', year: '2022', tech: OIL_CANVAS, dims: '85 × 59 cm', cm: [59, 85],
    desc: { es: 'Reproducción de «En été — La bohémienne» de Renoir, al tamaño original de la obra.', en: 'Reproduction of Renoir’s "En été — La bohémienne", at the original size of the work.' }, imgs: [im('pinturas/en_verano_c'), ...seq('pinturas/en_verano', 7)] },
  { id: 'gallagath', name: 'Gallagath', cat: 'pinturas', year: '2021', tech: OIL_LINEN, dims: '50 × 70 cm', cm: [50, 70], desc: NONE,
    imgs: [im('pinturas/gallagath_2_c'), im('pinturas/gallagath_1', 'Maximiliano Langevin junto a la obra', 'Maximiliano Langevin with the work'), ...seq('pinturas/gallagath', 6, 3)] },
  { id: 'coti', name: 'Coti', cat: 'pinturas', year: '2020', tech: OIL_CANVAS, dims: '50 × 40 cm', cm: [40, 50], desc: NONE, imgs: [im('pinturas/coti_c'), ...seq('pinturas/coti', 4)] },
  { id: 'el-jardin', name: 'El Jardín de las Delicias', cat: 'pinturas', year: '2020', tech: OIL_CANVAS, dims: '30 × 40 cm', cm: [30, 40],
    desc: { es: 'Reproducción de un fragmento del tríptico de El Bosco.', en: 'Reproduction of a detail from Bosch’s triptych.' }, imgs: [im('pinturas/el_jardin_de_las_delicias_c'), ...seq('pinturas/el_jardin_de_las_delicias', 3)] },

  { id: 'bouguereau', name: 'Bouguereau', cat: 'dibujos', year: '2019', tech: { es: 'Grafito sobre papel de algodón', en: 'Graphite on cotton paper' }, dims: '30 × 23 cm', cm: [23, 30],
    desc: { es: 'Reproducción de un dibujo de William Bouguereau.', en: 'Reproduction of a drawing by William Bouguereau.' }, imgs: [im('dibujos/bouguereau_5'), ...seq('dibujos/bouguereau', 4)] },
  { id: 'parmigianino', name: 'Parmigianino', cat: 'dibujos', year: '2019', tech: { es: 'Sanguina sobre papel de algodón', en: 'Red chalk on cotton paper' }, dims: '40 × 29 cm', cm: [29, 40],
    desc: { es: 'Reproducción de un dibujo de Parmigianino.', en: 'Reproduction of a drawing by Parmigianino.' }, imgs: seq('dibujos/parmogianino', 4) },

  { id: 'la-mosca', name: 'La Mosca', cat: 'xilografia', year: '2017', tech: FABRIANO, dims: '30 × 70 cm', cm: [30, 70], desc: NONE,
    imgs: ['la_mosca_4', 'la_mosca_2', 'la_mosca_1', 'la_mosca_3', 'la_mosca_5', 'la_mosca_6'].map(x => im('xilografia/' + x)) },
  { id: 'guiseppe', name: 'Guiseppe', cat: 'xilografia', year: '2017', tech: FABRIANO, dims: '33 × 35 cm', cm: [33, 35], desc: NONE,
    imgs: ['guiseppe_2', 'guiseppe_1', 'guiseppe_3', 'guiseppe_4'].map(x => im('xilografia/' + x)) },
  { id: 'san-jorge', name: 'San Jorge y el Dragón', cat: 'xilografia', year: '2017', tech: FABRIANO, dims: '35 × 33 cm', cm: [35, 33],
    desc: { es: 'Reproducción del grabado «San Jorge matando al dragón» de Alberto Durero.', en: 'Reproduction of "Saint George Slaying the Dragon" by Albrecht Dürer.' },
    imgs: ['san_jorge_y_el_dragon_2', 'san_jorge_y_el_dragon_1', 'san_jorge_y_el_dragon_3', 'san_jorge_y_el_dragon_4'].map(x => im('xilografia/' + x)) },

  { id: 'autorretrato', name: 'Autorretrato', cat: 'ilustracion', year: '2018', tech: DIGITAL, dims: '', desc: NONE, imgs: seq('ilustracion/autorretrato', 6) },
  { id: 'wizard-frog', name: 'Wizard Frog', cat: 'ilustracion', year: '2020', tech: ANIM, dims: '', desc: NONE, imgs: [im('ilustracion/wizard_frog')] },
  { id: 'covitch-19', name: 'COVITCH-19', cat: 'ilustracion', year: '2020', tech: ANIM, dims: '', desc: { es: 'Cómic animado.', en: 'Animated comic.' }, imgs: [im('ilustracion/covitch_19')], link: 'https://www.instagram.com/p/CEhGrKED7qL/?img_index=1' },
  { id: 'saping', name: 'Saping', cat: 'ilustracion', year: '2021', tech: DIGITAL, dims: '', desc: NONE, imgs: seq('ilustracion/saping', 4) },
  { id: 'high-life', name: 'High Life', cat: 'ilustracion', year: '2020', tech: { es: 'Novela gráfica digital', en: 'Digital graphic novel' }, dims: '',
    desc: { es: 'El desafío: hacer una novela gráfica en dúo. Junto a Ignacio Villegas creamos una sátira con nuestro propio estilo. La profesora quedó tan sorprendida que nos pidió presentarla al resto del curso.',
            en: 'The challenge: make a graphic novel in pairs. With Ignacio Villegas we created a satire in our own style. The teacher was so impressed she asked us to present it to the whole class.' }, imgs: seq('ilustracion/high_life', 5) },
  { id: 'best-buds', name: 'Best Buds', cat: 'ilustracion', year: '2020', tech: DIGITAL, dims: '', desc: NONE, imgs: [im('ilustracion/best_buds')] },
  { id: 'melted', name: 'Melted', cat: 'ilustracion', year: '2021', tech: DIGITAL, dims: '', desc: NONE, imgs: [im('ilustracion/melted')] },

  { id: 'sapo-punk', name: 'Sapo Punk', cat: 'creaciones', year: '2022', tech: { es: 'Cerámica esmaltada', en: 'Glazed ceramic' }, dims: '', desc: NONE,
    imgs: ['sapo_punk_5', 'sapo_punk_1', 'sapo_punk_2', 'sapo_punk_3', 'sapo_punk_4', 'sapo_punk_6'].map(x => im('creaciones/' + x)) },
  { id: 'en-llamas', name: 'En llamas', cat: 'creaciones', year: '2020', tech: { es: 'Converse pintadas con marcadores Posca', en: 'Converse sneakers painted with Posca markers' }, dims: '', desc: NONE, imgs: [im('creaciones/en_llamas')] },
  { id: 'tasapo', name: 'Tasapo', cat: 'creaciones', year: '2022', tech: { es: 'Taza de cerámica esmaltada', en: 'Glazed ceramic mug' }, dims: '', desc: NONE, imgs: [im('creaciones/tasapo')] },
];
const BY_ID = Object.fromEntries(WORKS.map(w => [w.id, w]));
const CATS = ['pinturas', 'dibujos', 'xilografia', 'ilustracion', 'creaciones'];

// Notas de lectura: lo que se ve en la obra y por qué funciona. Breves, sin jerga.
const NOTES = {
  'karin-goldberg': { es: 'Verde tierra contra piel cálida y labios carmín: colores complementarios. El fondo frío hace que la piel se vea más cálida y viva. El punto más claro del cuadro es el velo, y desde ahí la mirada baja al ojo.',
                      en: 'Earth green against warm skin and crimson lips: complementary colours. The cool ground makes the skin look warmer and more alive. The lightest point in the picture is the veil, and from there the eye drops to hers.' },
  'gallagath': { es: 'Azul y naranja, complementarios. El azul ultramar del fondo empuja hacia adelante el pelaje anaranjado del perro, sin necesidad de un contorno.',
                 en: 'Blue and orange, complementaries. The ultramarine ground pushes the dog’s orange coat forward without needing an outline.' },
  'coti': { es: 'Un fondo rojo casi plano y un solo acento frío: los ojos azules. Todo el cuadro conduce a ellos.',
            en: 'An almost flat red ground and a single cool accent: the blue eyes. The whole picture leads to them.' },
  'veteran-george': { es: 'La camisa roja se separa de las paredes violeta y azules por temperatura de color, no por contraste de luz. Los blancos de la barba son el acento más alto.',
                      en: 'The red shirt separates from the violet and blue walls by colour temperature rather than light. The whites of the beard are the highest accent.' },
  'el-conde': { es: 'Grisalla: pintado solo en grises. Sin color, todo el peso está en la textura del abrigo de piel y en la sombra bajo la gorra.',
                en: 'Grisaille: painted only in greys. Without colour, all the weight falls on the texture of the fur coat and the shadow under the cap.' },
  'vicente': { es: 'Claroscuro: fondo oliva oscuro y una luz lateral que saca el torso de la sombra. La paleta es corta, casi toda en tierras.',
               en: 'Chiaroscuro: a dark olive ground and a side light that pulls the torso out of shadow. A short palette, almost all earths.' },
  'santiago': { es: 'Fondo azul grisáceo y piel en luz cálida. La trama del lino se deja ver bajo la pintura, como parte de la superficie.',
                en: 'A grey-blue ground and skin in warm light. The weave of the linen shows through the paint as part of the surface.' },
  'marcos-16-16': { es: 'El damero blanco y negro es una base neutra; el color se guarda para la luz que cae sobre el piso y para el dorado del retablo.',
                    en: 'The black-and-white chequerboard is a neutral base; colour is saved for the light on the floor and the gold of the altarpiece.' },
  'en-verano': { es: 'Copia de Renoir a tamaño real: pincelada suelta y verdes saturados, un ejercicio opuesto al realismo de sus retratos.',
                 en: 'A full-size copy of Renoir: loose brushwork and saturated greens, the opposite exercise to the realism of his portraits.' },
  'consu-gato': { es: 'Rosas y beiges muy cercanos entre sí; el gato negro es el punto más oscuro y ancla la composición.',
                  en: 'Pinks and beiges very close to each other; the black cat is the darkest point and anchors the composition.' },
  'el-jardin': { es: 'Fondo de tierra tostada para que el azul y el amarillo de la figura resalten, como en el original de El Bosco.',
                 en: 'A burnt-earth ground so the blue and yellow of the figure stand out, as in Bosch’s original.' },
};

const BIO = {
  es: [
    'Maximiliano Langevin nació en Santiago de Chile en 1996. Comenzó a explorar el dibujo y la pintura al óleo en 2019 bajo la tutela del pintor y muralista Javier Barriga, con quien estudió y refinó su técnica realista durante cinco años.',
    'En 2024 profundizó su formación con el pintor hiperrealista Francisco Uzabeaga, desarrollando una técnica más precisa y eficiente que consolidó su estilo.',
    'Publicista de oficio y pintor por vocación, ha construido una carrera ligada a la industria del cine, colaborando con empresas como Disney® y la productora chilena ganadora del Oscar Fábula®. Esa experiencia le dio un conocimiento profundo de fotografía, composición y dirección de arte que se nota en su pintura.',
    'Hoy es Director Creativo en Tactica OOH, agencia especializada en innovación en vía pública.',
    'La mayoría de sus pinturas parten de fotografías que él mismo toma. Además diseña y fabrica accesorios de pintura bajo la marca <em>Langevinci®</em>.',
  ],
  en: [
    'Maximiliano Langevin was born in Santiago, Chile, in 1996. He began drawing and oil painting in 2019 under painter and muralist Javier Barriga, studying and refining his realist technique with him for five years.',
    'In 2024 he continued his training with hyperrealist painter Francisco Uzabeaga, developing a more precise and efficient technique that consolidated his style.',
    'An advertising professional by trade and a painter by vocation, he has built a career tied to the film industry, working with companies such as Disney® and the Oscar-winning Chilean production company Fábula®. That experience gave him a deep knowledge of photography, composition and art direction that shows in his painting.',
    'He is currently Creative Director at Tactica OOH, an agency focused on innovation in outdoor advertising.',
    'Most of his paintings start from photographs he takes himself. He also designs and makes painting accessories under the brand <em>Langevinci®</em>.',
  ]
};
const TIMELINE = {
  es: [['1996', 'Nace en Santiago de Chile.'], ['2017', 'Primeras xilografías: La Mosca, Guiseppe y una copia del San Jorge de Durero.'],
       ['2019', 'Empieza a estudiar dibujo y óleo con Javier Barriga. Copias de Parmigianino y Bouguereau.'], ['2020—22', 'Primeros retratos al óleo, ilustración digital, animación y cerámica.'],
       ['2024', 'Estudia con Francisco Uzabeaga. «El Conde» se expone en «Polímatas», Estadio Italiano.'], ['2025', 'Karin Goldberg. Marcos 16:16 en el caballete.']],
  en: [['1996', 'Born in Santiago, Chile.'], ['2017', 'First woodcuts: La Mosca, Guiseppe and a copy of Dürer’s Saint George.'],
       ['2019', 'Starts studying drawing and oil painting with Javier Barriga. Copies after Parmigianino and Bouguereau.'], ['2020—22', 'First oil portraits, digital illustration, animation and ceramics.'],
       ['2024', 'Studies with Francisco Uzabeaga. "El Conde" is shown at "Polímatas", Estadio Italiano.'], ['2025', 'Karin Goldberg. Marcos 16:16 on the easel.']]
};
// Hoja de vida en formato de galería
const CV = {
  es: [['Formación', [['2019 — 2024', 'Taller de Javier Barriga, pintor y muralista'], ['2024', 'Francisco Uzabeaga, pintor hiperrealista']]],
       ['Exposiciones', [['2024', '«Polímatas», Estadio Italiano, Santiago']]],
       ['Cine y publicidad', [['', 'Colaboraciones con Disney® y Fábula®'], ['Hoy', 'Director Creativo, Tactica OOH']]],
       ['Taller', [['', 'Accesorios de pintura Langevinci®']]]],
  en: [['Training', [['2019 — 2024', 'Studio of Javier Barriga, painter and muralist'], ['2024', 'Francisco Uzabeaga, hyperrealist painter']]],
       ['Exhibitions', [['2024', '"Polímatas", Estadio Italiano, Santiago']]],
       ['Film and advertising', [['', 'Work with Disney® and Fábula®'], ['Now', 'Creative Director, Tactica OOH']]],
       ['Studio', [['', 'Langevinci® painting accessories']]]]
};
const COMMISSION = {
  es: [['Conversación', 'Hablamos de la persona, el lugar, el formato y la luz que quieres.'],
       ['Fotografía', 'Max hace su propia sesión de fotos: casi todas sus pinturas parten de fotografías que él toma.'],
       ['Pintura', 'Óleo sobre lino o tela, capa por capa, en el taller.'],
       ['Firma', 'La obra se entrega firmada y fechada.']],
  en: [['Conversation', 'We talk about the person, the place, the format and the light you want.'],
       ['Photography', 'Max does his own photo session: almost all his paintings start from photographs he takes.'],
       ['Painting', 'Oil on linen or canvas, layer by layer, in the studio.'],
       ['Signature', 'The work is delivered signed and dated.']]
};

// ── TEXTOS BASE ──
const CORE_T = {
  es: { wip: 'En proceso', views: 'vistas', view1: 'vista', lb_hint: 'Toca la imagen para acercar', lb_close: 'Cerrar', lb_prev: 'Anterior', lb_next: 'Siguiente',
        ig: 'Ver la animación en Instagram', ask: 'Consultar por esta obra', ask_msg: 'Hola Max, vi «{w}» en tu sitio web y me gustaría saber más.',
        palette: 'Paleta medida en la obra', copied: 'Correo copiado', copy_fail: 'Selecciona el correo para copiarlo', copy: 'Copiar',
        wa: 'Escribir por WhatsApp', wa_msg: 'Hola Max, vi tu sitio web y me gustaría conversar sobre un retrato.', lang_aria: 'Switch to English', menu: 'Menú',
        cats: { pinturas: 'Pinturas', dibujos: 'Dibujos', xilografia: 'Xilografía', ilustracion: 'Ilustración', creaciones: 'Objetos' } },
  en: { wip: 'In progress', views: 'views', view1: 'view', lb_hint: 'Tap the image to zoom', lb_close: 'Close', lb_prev: 'Previous', lb_next: 'Next',
        ig: 'Watch the animation on Instagram', ask: 'Ask about this work', ask_msg: 'Hi Max, I saw "{w}" on your website and would like to know more.',
        palette: 'Palette measured on the work', copied: 'Email copied', copy_fail: 'Select the address to copy it', copy: 'Copy',
        wa: 'Message on WhatsApp', wa_msg: 'Hi Max, I saw your website and would like to talk about a portrait.', lang_aria: 'Cambiar a español', menu: 'Menu',
        cats: { pinturas: 'Paintings', dibujos: 'Drawings', xilografia: 'Woodcuts', ilustracion: 'Illustration', creaciones: 'Objects' } }
};
let T = CORE_T, LANG = 'es';
const langCbs = [];
const t = k => (T[LANG][k] ?? T.es[k] ?? k);
const yearLabel = w => w.year === 'WIP' ? t('wip') : w.year;
const metaLine = w => [yearLabel(w), w.tech[LANG], w.dims].filter(Boolean).join(' · ');
const waLink = msg => `https://wa.me/${WA}?text=${encodeURIComponent(msg)}`;

function setLang(lang) {
  LANG = lang;
  try { localStorage.setItem('ml-lang', lang); } catch (e) {}
  document.documentElement.lang = lang;
  $$('[data-i18n]').forEach(el => { const v = T[lang][el.dataset.i18n]; if (v !== undefined) el.textContent = v; });
  $$('[data-i18n-html]').forEach(el => { const v = T[lang][el.dataset.i18nHtml]; if (v !== undefined) el.innerHTML = v; });
  $$('[data-i18n-aria]').forEach(el => { const v = T[lang][el.dataset.i18nAria]; if (v !== undefined) el.setAttribute('aria-label', v); });
  $$('.js-lang').forEach(b => { b.textContent = lang === 'es' ? 'EN' : 'ES'; b.setAttribute('aria-label', t('lang_aria')); });
  $$('.js-wa').forEach(a => a.href = waLink(t('wa_msg')));
  langCbs.forEach(cb => cb(lang));
  if (LB.work) LB.show(LB.i);
  requestAnimationFrame(() => { layoutAll(); tick(); });
}

// ── PIEZAS ──
function paletteHTML(id, opts = {}) {
  const p = PALETTES[id]; if (!p) return '';
  return `<div class="pal${opts.cls ? ' ' + opts.cls : ''}" role="img" aria-label="${t('palette')}">${p.map(([hex, s]) =>
    `<span style="flex:${s};background:${hex}" title="${hex} · ${Math.round(s * 100)}%">${opts.labels ? `<i>${hex}</i>` : ''}</span>`).join('')}</div>`;
}
function card(w, opts = {}) {
  const b = document.createElement('button');
  b.type = 'button'; b.className = 'work' + (opts.cls ? ' ' + opts.cls : ''); b.dataset.open = w.id;
  const first = w.imgs[0].p;
  const n = w.imgs.length;
  b.innerHTML = `
    <span class="frame" style="--a:${ratio(first).toFixed(4)}">
      <img src="${opts.large ? W_(first) : T_(first)}" alt="" loading="lazy" decoding="async">
      ${w.year === 'WIP' ? `<span class="badge">${t('wip')}</span>` : ''}
    </span>
    <span class="placard"><span class="t">${w.name}</span><span class="m">${metaLine(w)}</span>${opts.count !== false && n > 1 ? `<span class="m n">${n} ${t('views')}</span>` : ''}</span>`;
  b.setAttribute('aria-label', `${w.name}, ${metaLine(w)}`);
  return b;
}

// ── ESCENAS ──
const scenes = [];
let VH = innerHeight;
function scene(el, s) { s.el = el; scenes.push(s); return s; }
function progressOf(el) {
  const r = el.getBoundingClientRect();
  const total = r.height - VH;
  return { p: total > 0 ? clamp(-r.top / total) : 0, r };
}
// progreso de un elemento normal mientras cruza la pantalla: 0 cuando su borde superior está en `a`·alto, 1 cuando está en `b`·alto
function viewScene(el, update, a = .92, b = .45) {
  return scene(el, { view: true, a, b, update, layout() {} });
}
function endScene(el, update, span = .45) {
  return scene(el, { layout() {}, update() {}, endSpan: span, endUpdate: update });
}
function layoutAll() { VH = innerHeight; scenes.forEach(s => s.layout && s.layout()); }
function tick() {
  for (const s of scenes) {
    const r = s.el.getBoundingClientRect();
    if (r.bottom < -VH * .3 || r.top > VH * 1.3) continue;
    if (s.endUpdate) { const left = document.documentElement.scrollHeight - VH - scrollY; s.endUpdate(RM ? 1 : clamp(1 - (left - 4) / (s.endSpan * VH))); continue; }
    if (s.view) s.update(RM ? 1 : clamp((s.a * VH - r.top) / ((s.a - s.b) * VH)));
    else s.update(progressOf(s.el).p);
  }
  tickCbs.forEach(cb => cb());
}
const tickCbs = [];
let ticking = false;
addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(() => { ticking = false; tick(); }); } }, { passive: true });
let rz;
addEventListener('resize', () => { cancelAnimationFrame(rz); rz = requestAnimationFrame(() => { layoutAll(); tick(); }); });
addEventListener('load', () => { layoutAll(); tick(); });

function fadeRange(p, a, b, e) { return clamp((p - (a - e)) / e) * clamp(((b + e) - p) / e); }
function textLayer(el) {
  const [a, b] = el.dataset.r.split(',').map(Number);
  return { el, a, b, e: el.dataset.e ? +el.dataset.e : .05, last: -1, still: el.hasAttribute('data-still') };
}
function applyText(L, p) {
  const o = +fadeRange(p, L.a, L.b, L.e).toFixed(3);
  if (o === L.last) return;
  L.last = o;
  L.el.style.opacity = o;
  L.el.style.visibility = o < .02 ? 'hidden' : 'visible';
  if (!L.still) { const dir = p < L.a ? 1 : p > L.b ? -1 : 0; L.el.style.translate = `0 ${((1 - o) * 22 * dir).toFixed(1)}px`; }
  L.el.style.pointerEvents = o > .6 ? '' : 'none';
}

// ── ZOOM: la cámara entra en la pintura ──
// rect = [x, y, ancho, alto] normalizados respecto de la pintura completa (medidos alineando las fotos de detalle).
const FULL = [0, 0, 1, 1];
function zoomScene(el, cfg) {
  const stage = $('.stage', el), canvas = $('.zcanvas', stage), scrim = $('.scrim', stage);
  const [Pw, Ph] = SIZES[cfg.base];
  const eager = !!cfg.eager;
  const mk = (p, cls) => {
    const i = new Image(); i.decoding = 'async'; if (!eager) i.loading = 'lazy';
    i.src = W_(p); i.alt = ''; i.className = cls;
    const [w, h] = SIZES[p]; i.width = w; i.height = h; i.style.width = w + 'px'; i.style.height = h + 'px';
    canvas.appendChild(i); return i;
  };
  const base = mk(cfg.base, 'base'); base.alt = cfg.alt || '';
  const layers = (cfg.layers || []).map(L => ({ ...L, el: mk(L.p, 'layer'), size: SIZES[L.p] }));
  const texts = $$('.zt', stage).map(textLayer);
  const rail = $$('[data-goto]', stage);
  const pins = (cfg.pins || []).map(P => {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'pin'; b.textContent = P.n;
    b.setAttribute('aria-label', P.label || String(P.n));
    if (P.goto != null) b.dataset.goto = P.goto;
    canvas.appendChild(b); return { ...P, el: b };
  });
  let W = 1, H = 1, f0 = 1, cams = [], stillP = cfg.still ?? 0;
  function camFor(k) {
    if (k.cam) return k.cam;
    const [x, y, w, h] = k.rect;
    const ox = k.offset ? (typeof k.offset === 'function' ? k.offset(W, H) : k.offset) : 0;
    const zc = Math.min(W / (w * Pw * f0), H / (h * Ph * f0));
    const zv = Math.max(W / (w * Pw * f0), H / (h * Ph * f0));
    let z = k.fit === 'contain' ? zc : k.fit === 'cover' ? zv : Math.min(zv, zc * 1.4);
    z *= (k.pad || 1);
    // offset: desplaza el centro en fracción del ancho de pantalla (para dejar espacio a un texto lateral)
    return { cx: x + w / 2 - ox * W / (Pw * f0 * z), cy: y + h / 2 + (k.dy || 0), z };
  }
  function layout() {
    W = canvas.clientWidth; H = canvas.clientHeight;
    f0 = Math.min(W / Pw, H / Ph);
    cams = cfg.keys.map(k => ({ p: k.p, ...camFor(k) }));
  }
  function camAt(p) {
    let i = 0;
    while (i < cams.length - 2 && p > cams[i + 1].p) i++;
    const a = cams[i], b = cams[i + 1];
    const tt = ease(clamp((p - a.p) / ((b.p - a.p) || 1)));
    return { cx: lerp(a.cx, b.cx, tt), cy: lerp(a.cy, b.cy, tt), z: Math.exp(lerp(Math.log(a.z), Math.log(b.z), tt)) };
  }
  function update(p) {
    if (RM) p = stillP;
    const c = camAt(p), S = f0 * c.z;
    const ox = W / 2 - c.cx * Pw * S, oy = H / 2 - c.cy * Ph * S;
    base.style.transform = `translate3d(${ox.toFixed(1)}px,${oy.toFixed(1)}px,0) scale(${S.toFixed(5)})`;
    layers.forEach(L => {
      const [a, b, cc, d] = L.fade;
      const o = clamp((p - a) / (b - a)) * (1 - clamp((p - cc) / (d - cc)));
      L.el.style.opacity = o.toFixed(3);
      L.el.style.visibility = o < .005 ? 'hidden' : 'visible';
      if (o < .005) return;
      const s = L.rect[2] * Pw * S / L.size[0];
      L.el.style.transform = `translate3d(${(ox + L.rect[0] * Pw * S).toFixed(1)}px,${(oy + L.rect[1] * Ph * S).toFixed(1)}px,0) scale(${s.toFixed(5)})`;
    });
    pins.forEach(P => {
      const o = P.range ? fadeRange(p, P.range[0], P.range[1], .03) : 1;
      P.el.style.opacity = o; P.el.style.visibility = o < .05 ? 'hidden' : 'visible';
      P.el.style.transform = `translate3d(${(ox + P.x * Pw * S).toFixed(1)}px,${(oy + P.y * Ph * S).toFixed(1)}px,0) translate(-50%,-50%)`;
      P.el.classList.toggle('on', P.active ? (p >= P.active[0] && p <= P.active[1]) : false);
    });
    if (scrim && cfg.scrim) scrim.style.opacity = Math.max(0, ...cfg.scrim.map(([a, b]) => fadeRange(p, a, b, .05))).toFixed(3);
    texts.forEach(L => applyText(L, p));
    rail.forEach(btn => { const r = btn.dataset.range; if (r) { const [a, b] = r.split(',').map(Number); btn.classList.toggle('on', p >= a && p <= b); } });
    cfg.onUpdate && cfg.onUpdate(p);
  }
  $$('[data-goto]', stage).forEach(btn => btn.addEventListener('click', () => goTo(+btn.dataset.goto)));
  function goTo(p) {
    if (RM) { stillP = p; update(p); return; }
    const top = el.getBoundingClientRect().top + scrollY;
    scrollTo({ top: top + p * (el.offsetHeight - VH), behavior: 'smooth' });
  }
  return scene(el, { layout, update, goTo });
}

// ── FIRMA: se escribe con el scroll ──
// La forma es el contorno vectorizado de la firma pintada en «El Conde». Una máscara de trazos gruesos la descubre
// siguiendo el esqueleto de cada letra, en orden de escritura.
let sigN = 0;
function signature(host, opts = {}) {
  const id = 'sigmask' + (++sigN);
  const pens = SIG.pen.map(d => `<path d="${d}"/>`).join('');
  host.innerHTML = `<svg class="sig" viewBox="0 0 ${SIG.w} ${SIG.h}" role="img" aria-label="${opts.label || 'Firma de Max Langevin'}">
    <defs><mask id="${id}" maskUnits="userSpaceOnUse" x="0" y="0" width="${SIG.w}" height="${SIG.h}">
      <g fill="none" stroke="#fff" stroke-width="${opts.pen || 46}" stroke-linecap="round" stroke-linejoin="round">${pens}</g></mask></defs>
    ${opts.ghost === false ? '' : `<path class="sig-ghost" d="${SIG.fill}" fill-rule="evenodd"/>`}
    <path class="sig-ink" d="${SIG.fill}" fill-rule="evenodd" mask="url(#${id})"/></svg>`;
  const ps = $$('mask path', host);
  const Ls = ps.map(p => p.getTotalLength());
  const total = Ls.reduce((a, b) => a + b, 0);
  ps.forEach((p, i) => p.setAttribute('stroke-dasharray', `${Ls[i]} ${Ls[i]}`));
  let last = -1;
  const set = t => {
    t = RM ? 1 : clamp(t);
    if (Math.abs(t - last) < .001) return; last = t;
    let acc = 0; const D = t * total;
    ps.forEach((p, i) => { const v = clamp(D - acc, 0, Ls[i]); p.setAttribute('stroke-dashoffset', (Ls[i] - v).toFixed(1)); p.style.visibility = v > .5 ? 'visible' : 'hidden'; acc += Ls[i]; });
    host.classList.toggle('signed', t >= .999);
  };
  set(opts.start ?? 0);
  return set;
}

// ── LUPA ──
function loupe(frame, src, opts = {}) {
  const lens = document.createElement('div'); lens.className = 'lens'; lens.dataset.z = '×' + (opts.z || 3);
  frame.appendChild(lens);
  const Z = opts.z || 3;
  let pos = opts.start || { x: .5, y: .3 }, touchOn = false;
  lens.style.backgroundImage = `url(${src})`;
  function place() {
    const r = frame.getBoundingClientRect(), lw = lens.offsetWidth;
    lens.style.left = (pos.x * r.width) + 'px'; lens.style.top = (pos.y * r.height) + 'px';
    lens.style.backgroundSize = `${r.width * Z}px ${r.height * Z}px`;
    lens.style.backgroundPosition = `${-(pos.x * r.width * Z - lw / 2)}px ${-(pos.y * r.height * Z - lw / 2)}px`;
  }
  const move = e => {
    if (e.pointerType === 'touch' && !touchOn) return;
    const r = frame.getBoundingClientRect();
    pos = { x: clamp((e.clientX - r.left) / r.width), y: clamp((e.clientY - r.top) / r.height) }; place();
  };
  frame.addEventListener('pointermove', move); frame.addEventListener('pointerdown', move);
  frame.tabIndex = 0;
  frame.addEventListener('keydown', e => {
    const d = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key];
    if (!d) return; e.preventDefault(); pos = { x: clamp(pos.x + d[0] * .04), y: clamp(pos.y + d[1] * .03) }; place();
  });
  new ResizeObserver(place).observe(frame);
  return { toggleTouch(on) { touchOn = on; frame.classList.toggle('touchon', on); }, place };
}

// ── VISOR ──
const LB = (() => {
  const box = document.createElement('div');
  box.className = 'lb'; box.id = 'lb'; box.hidden = true;
  box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); box.setAttribute('aria-labelledby', 'lb-title');
  box.innerHTML = `
    <div class="lb-media" id="lb-media"><img id="lb-img" alt="">
      <button class="lb-arrow prev" id="lb-prev" type="button"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M15 5l-7 7 7 7"/></svg></button>
      <button class="lb-arrow next" id="lb-next" type="button"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M9 5l7 7-7 7"/></svg></button>
      <p class="lb-hint" id="lb-hint"></p></div>
    <aside class="lb-info">
      <p class="lb-count" id="lb-count"></p>
      <h3 id="lb-title"></h3>
      <p class="lb-meta" id="lb-meta"></p>
      <p class="lb-desc" id="lb-desc"></p>
      <p class="lb-cap" id="lb-cap" hidden></p>
      <div class="lb-color" id="lb-color" hidden><p class="lb-k" id="lb-pal-k"></p><div id="lb-pal"></div><p class="lb-note" id="lb-note"></p></div>
      <div class="lb-actions"><a class="lb-ask" id="lb-ask" target="_blank" rel="noopener"></a><a class="lb-link" id="lb-link" target="_blank" rel="noopener" hidden></a></div>
      <div class="lb-thumbs" id="lb-thumbs"></div>
    </aside>
    <button class="lb-close" id="lb-close" type="button"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M5 5l14 14M19 5L5 19"/></svg></button>`;
  const api = { work: null, i: 0 };
  let media, img, thumbs, prev, next, lastFocus = null;
  const ZS = 2.6;
  let down = null, moved = false, origin = { x: 50, y: 50 };
  function mount() {
    document.body.appendChild(box);
    media = $('#lb-media'); img = $('#lb-img'); thumbs = $('#lb-thumbs'); prev = $('#lb-prev'); next = $('#lb-next');
    $('#lb-close').addEventListener('click', api.close);
    prev.addEventListener('click', () => api.show(api.i - 1));
    next.addEventListener('click', () => api.show(api.i + 1));
    const setOrigin = o => { origin = { x: clamp(o.x, 0, 100), y: clamp(o.y, 0, 100) }; img.style.transformOrigin = `${origin.x}% ${origin.y}%`; };
    const pt = (cx, cy) => { const r = media.getBoundingClientRect(); return { x: (cx - r.left - img.offsetLeft) / img.offsetWidth * 100, y: (cy - r.top - img.offsetTop) / img.offsetHeight * 100 }; };
    img.addEventListener('pointerdown', e => { down = { x: e.clientX, y: e.clientY, type: e.pointerType, o: { ...origin } }; moved = false; try { img.setPointerCapture(e.pointerId); } catch (_) {} });
    img.addEventListener('pointermove', e => {
      if (down && Math.hypot(e.clientX - down.x, e.clientY - down.y) > 8) moved = true;
      if (!media.classList.contains('zoomed')) return;
      if (e.pointerType === 'mouse') { media.classList.add('panning'); setOrigin(pt(e.clientX, e.clientY)); }
      else if (down) { media.classList.add('panning'); setOrigin({ x: down.o.x - (e.clientX - down.x) / ((ZS - 1) * img.offsetWidth) * 100, y: down.o.y - (e.clientY - down.y) / ((ZS - 1) * img.offsetHeight) * 100 }); }
    });
    img.addEventListener('pointercancel', () => { down = null; media.classList.remove('panning'); });
    img.addEventListener('pointerup', e => {
      const d = down; down = null; if (!d) return;
      if (d.type !== 'mouse') media.classList.remove('panning');
      const dx = e.clientX - d.x;
      if (!media.classList.contains('zoomed') && d.type !== 'mouse' && Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(e.clientY - d.y)) { api.show(api.i + (dx < 0 ? 1 : -1)); return; }
      if (moved) return;
      if (media.classList.contains('zoomed')) media.classList.remove('zoomed', 'panning');
      else { setOrigin(pt(e.clientX, e.clientY)); media.classList.add('zoomed'); }
    });
    img.addEventListener('mouseleave', () => media.classList.remove('panning'));
    img.addEventListener('dragstart', e => e.preventDefault());
    addEventListener('keydown', e => {
      if (box.hidden) return;
      if (e.key === 'Escape') api.close();
      if (e.key === 'ArrowLeft') api.show(api.i - 1);
      if (e.key === 'ArrowRight') api.show(api.i + 1);
      if (e.key === 'Tab') {
        const f = $$('button, a[href]', box).filter(x => !x.hidden && !x.disabled && x.offsetParent !== null);
        if (!f.length) return;
        if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
      }
    });
  }
  api.show = i => {
    const w = api.work; if (!w) return;
    api.i = i = clamp(i, 0, w.imgs.length - 1);
    media.classList.remove('zoomed', 'panning');
    const e = w.imgs[i];
    img.src = W_(e.p); img.alt = `${w.name} — ${i + 1} / ${w.imgs.length}`;
    $('#lb-title').textContent = w.name;
    $('#lb-count').textContent = w.imgs.length > 1 ? `${i + 1} / ${w.imgs.length}` : t('cats')[w.cat];
    $('#lb-meta').textContent = metaLine(w);
    $('#lb-desc').textContent = w.desc[LANG] || '';
    const cap = e.cap[LANG], capEl = $('#lb-cap'); capEl.hidden = !cap; capEl.textContent = cap || '';
    const note = NOTES[w.id];
    $('#lb-color').hidden = !PALETTES[w.id];
    if (PALETTES[w.id]) { $('#lb-pal-k').textContent = t('palette'); $('#lb-pal').innerHTML = paletteHTML(w.id); $('#lb-note').textContent = note ? note[LANG] : ''; }
    const ask = $('#lb-ask'); ask.textContent = t('ask'); ask.href = waLink(t('ask_msg').replace('{w}', w.name));
    const link = $('#lb-link'); link.hidden = !w.link; if (w.link) { link.href = w.link; link.textContent = t('ig') + ' →'; }
    prev.disabled = i === 0; next.disabled = i === w.imgs.length - 1; prev.hidden = next.hidden = w.imgs.length < 2;
    prev.setAttribute('aria-label', t('lb_prev')); next.setAttribute('aria-label', t('lb_next')); $('#lb-close').setAttribute('aria-label', t('lb_close'));
    $('#lb-hint').textContent = t('lb_hint');
    $$('button', thumbs).forEach((b, k) => { b.classList.toggle('on', k === i); b.setAttribute('aria-current', k === i); });
    const on = thumbs.children[i]; if (on) on.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    if (w.imgs[i + 1]) { const pre = new Image(); pre.src = W_(w.imgs[i + 1].p); }
  };
  api.open = (id, i = 0) => {
    const w = BY_ID[id]; if (!w) return;
    api.work = w; lastFocus = document.activeElement;
    thumbs.innerHTML = ''; thumbs.hidden = w.imgs.length < 2;
    w.imgs.forEach((e, k) => {
      const b = document.createElement('button'); b.type = 'button'; b.setAttribute('aria-label', `${k + 1} / ${w.imgs.length}`);
      b.innerHTML = `<img src="${T_(e.p)}" alt="" loading="lazy">`; b.addEventListener('click', () => api.show(k)); thumbs.appendChild(b);
    });
    box.hidden = false; document.documentElement.classList.add('lb-open');
    requestAnimationFrame(() => box.classList.add('open'));
    api.show(i);
    try { history.replaceState(null, '', '#' + id); } catch (e) {}
    $('#lb-close').focus();
  };
  api.close = () => {
    box.classList.remove('open'); media.classList.remove('zoomed', 'panning');
    setTimeout(() => { box.hidden = true; img.removeAttribute('src'); }, RM ? 0 : 280);
    document.documentElement.classList.remove('lb-open'); api.work = null;
    try { history.replaceState(null, '', location.pathname + location.search); } catch (e) {}
    if (lastFocus) lastFocus.focus({ preventScroll: true });
  };
  api.mount = mount;
  return api;
})();

// ── CONTACTO ──
function toast(msg) {
  let el = $('#toast');
  if (!el) { el = document.createElement('div'); el.id = 'toast'; el.className = 'toast'; el.setAttribute('role', 'status'); document.body.appendChild(el); }
  el.textContent = msg; el.classList.add('show');
  clearTimeout(toast.t); toast.t = setTimeout(() => el.classList.remove('show'), 2200);
}
function wireCopy() {
  $$('.js-copy').forEach(b => b.addEventListener('click', () => {
    const target = $(b.dataset.target || '.js-mail');
    const fallback = () => { const r = document.createRange(); r.selectNodeContents(target); const s = getSelection(); s.removeAllRanges(); s.addRange(r); toast(t('copy_fail')); };
    try { navigator.clipboard.writeText(MAIL).then(() => toast(t('copied')), fallback); } catch (e) { fallback(); }
  }));
}

// ── ARRANQUE ──
function boot(opts = {}) {
  T = { es: { ...CORE_T.es, ...(opts.strings?.es || {}) }, en: { ...CORE_T.en, ...(opts.strings?.en || {}) } };
  LB.mount();
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-open]');
    if (b) { e.preventDefault(); LB.open(b.dataset.open, +(b.dataset.i || 0)); }
  });
  $$('.js-lang').forEach(b => b.addEventListener('click', () => setLang(LANG === 'es' ? 'en' : 'es')));
  wireCopy();
  let saved = null; try { saved = localStorage.getItem('ml-lang'); } catch (e) {}
  setLang(saved || ((navigator.language || 'es').toLowerCase().startsWith('es') ? 'es' : 'en'));
  layoutAll(); tick();
  const h = location.hash.slice(1); if (BY_ID[h]) LB.open(h);
}

window.ML = { $, $$, clamp, lerp, ease, smooth, RM, W_, T_, ratio, WORKS, BY_ID, CATS, NOTES, BIO, TIMELINE, CV, COMMISSION, PALETTES, SIZES, SIG, MAIL, WA,
  t, get lang() { return LANG; }, onLang: cb => langCbs.push(cb), onTick: cb => tickCbs.push(cb), setLang, metaLine, yearLabel, waLink,
  paletteHTML, card, scene, viewScene, endScene, zoomScene, signature, loupe, fadeRange, textLayer, applyText, layoutAll, tick, LB, toast, boot, FULL };
})();
