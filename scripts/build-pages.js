#!/usr/bin/env node
/* Genera las paginas estaticas de servicio y de tips a partir de services.json,
   tips.json y scripts/tips-content.js.
   Uso:  node scripts/build-pages.js            (genera y reescribe sitemap.xml)
         node scripts/build-pages.js --check    (solo valida, no escribe)

   GitHub Pages sirve ficheros estaticos: el HTML generado va commiteado en el
   repo, igual que css/rest-*.css. Editar los JSON, no los HTML. */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const data = JSON.parse(fs.readFileSync(path.join(ROOT, 'services.json'), 'utf8'));
const NEG = data.negocio;
const SERVICIOS = data.servicios;
const checkOnly = process.argv.includes('--check');
const warnings = [];

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const byKey = {};
SERVICIOS.forEach(s => { byKey[s.key] = s; });

/* El modal de index.html tiene su propia copia de title/description/items
   (js/app-content-1.js, servicesData). Se usa para la tarjeta, no para la
   pagina, pero si divergen el visitante ve dos textos distintos. */
function validarConModal() {
  const js = fs.readFileSync(path.join(ROOT, 'js', 'app-content-1.js'), 'utf8');
  SERVICIOS.forEach(s => {
    const m = js.match(new RegExp('\\n\\s*' + s.key + ':\\s*\\{[\\s\\S]*?\\n\\s*\\}'));
    if (!m) { warnings.push(s.key + ': no existe en servicesData del modal'); return; }
    const t = m[0].match(/title:\s*'([^']*)'/);
    const esperado = s.modalTitle || s.label;
    if (t && t[1] !== esperado) {
      warnings.push(s.key + ': titulo del modal («' + t[1] + '») difiere de la pagina («' + esperado + '»)');
    }
    const it = m[0].match(/items:\s*\[([\s\S]*?)\]/);
    if (it) {
      const modalItems = (it[1].match(/'([^']*)'/g) || []).map(x => x.slice(1, -1));
      if (modalItems.length !== s.items.length) {
        warnings.push(s.key + ': el modal lista ' + modalItems.length + ' puntos y la pagina ' + s.items.length);
      }
    }
  });
}

function validarEnlaces() {
  SERVICIOS.forEach(s => {
    (s.related || []).forEach(r => {
      if (!byKey[r]) warnings.push(s.key + ': related apunta a «' + r + '», que no es un servicio');
    });
    if (s.slug !== s.slug.toLowerCase() || /[^a-z0-9-]/.test(s.slug)) {
      warnings.push(s.key + ': slug «' + s.slug + '» no es ascii minusculo con guiones');
    }
    if (s.meta.length > 165) warnings.push(s.key + ': meta description de ' + s.meta.length + ' caracteres (max 165)');
    if (s.title.length > 65) warnings.push(s.key + ': title de ' + s.title.length + ' caracteres (max 65)');
    if (!s.phrase || s.phrase.length > 60) warnings.push(s.key + ': falta «phrase» o pasa de 60 caracteres');
    if (!s.pasos || s.pasos.length !== 4) warnings.push(s.key + ': «pasos» debe tener 4 entradas');
  });
}

const urlDe = s => NEG.url + '/servicios/' + s.slug + '/';
const wa = txt => 'https://wa.me/' + NEG.whatsapp + '?text=' + encodeURIComponent(txt);

function headBase({ title, meta, h1, url, ld }) {
  return `  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <!-- Mismo arranque de tema que index.html: data-theme="light" es solo el valor previo. -->
  <script>(function(){try{var s=localStorage.getItem('theme');document.documentElement.setAttribute('data-theme',s||(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'));}catch(e){}})();</script>
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(meta)}">
  <meta name="author" content="${esc(NEG.nombre)}">
  <meta name="robots" content="index, follow">
  <meta name="theme-color" content="#0A0D1F" media="(prefers-color-scheme: dark)">
  <meta name="theme-color" content="#F7F8FB" media="(prefers-color-scheme: light)">
  <meta name="google-site-verification" content="UroQP0TYR1nk7Vt3Ws_MzWo_x_mi3C6uYbYdDphph58" />

  <meta property="og:title" content="${esc(h1)}">
  <meta property="og:description" content="${esc(meta)}">
  <meta property="og:type" content="article">
  <meta property="og:url" content="${url}">
  <meta property="og:locale" content="es_CO">
  <meta property="og:site_name" content="${esc(NEG.nombre)}">
  <meta property="og:image" content="${NEG.ogImage}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(h1)}">
  <meta name="twitter:description" content="${esc(meta)}">
  <meta name="twitter:image" content="${NEG.ogImage}">

  <link rel="canonical" href="${url}" />
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>💻</text></svg>">
  <link rel="preload" as="font" type="font/woff2" href="/fonts/outfit-latin.woff2" crossorigin>
  <link rel="preload" as="font" type="font/woff2" href="/fonts/jetbrainsmono-latin.woff2" crossorigin>
  <link rel="stylesheet" href="/css/styles.css">
  <link rel="stylesheet" href="/css/pages.css">
${ld.map(o => '  <script type="application/ld+json">\n  ' + JSON.stringify(o) + '\n  </script>').join('\n')}`;
}

function head(s) {
  const ld = [
    {
      '@context': 'https://schema.org',
      '@type': 'Service',
      name: s.label,
      serviceType: s.label,
      description: s.meta,
      url: urlDe(s),
      provider: {
        '@type': 'LocalBusiness',
        name: NEG.nombre,
        url: NEG.url + '/',
        telephone: NEG.telefono,
        email: NEG.email
      },
      areaServed: NEG.cobertura.map(c => ({ '@type': 'City', name: c })),
      availableChannel: {
        '@type': 'ServiceChannel',
        serviceUrl: wa('Hola, necesito ' + s.phrase),
        availableLanguage: ['es']
      },
      hoursOfOperation: { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'], opens: '09:00', closes: '17:00' }
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Inicio', item: NEG.url + '/' },
        { '@type': 'ListItem', position: 2, name: 'Servicios', item: NEG.url + '/#servicios' },
        { '@type': 'ListItem', position: 3, name: s.label, item: urlDe(s) }
      ]
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: s.faq.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } }))
    }
  ];

  return headBase({ title: s.title, meta: s.meta, h1: s.h1, url: urlDe(s), ld });
}

function header() {
  const nav = [['Servicios', '/#servicios'], ['Nosotros', '/#nosotros'], ['Fundador', '/#fundador'], ['Tips', '/tips/'], ['Apps', '/#apps'], ['App Saldo', '/apps/saldo/'], ['FAQ', '/#faq'], ['Reseñas', '/#resenas'], ['Contacto', '/#contacto']];
  return `  <header class="header" id="siteHeader">
    <div class="header__shell">
      <div class="header__inner">
        <a href="/#inicio" class="logo" aria-label="${esc(NEG.nombre)} inicio">
          <span class="logo__mark" aria-hidden="true">
            <img src="/img/logo.webp" alt="${esc(NEG.nombre)}" width="160" height="120">
          </span>
          <span class="logo__text">servitecbaq</span>
        </a>
        <nav class="nav" id="nav" aria-label="Navegación principal">
${nav.map(([t, h]) => '          <a href="' + h + '">' + t + '</a>').join('\n')}
        </nav>
        <div class="header__actions">
          <button class="theme-toggle" id="themeToggle" aria-label="Cambiar tema">
            <span class="theme-icon-light" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"/></svg></span>
            <span class="theme-icon-dark" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M6.3 17.7l-1.4 1.4M19.1 4.9l-1.4 1.4"/></svg></span>
          </button>
          <a href="${wa('Hola, necesito servicio técnico')}" class="btn btn--accent btn--sm header__cta" target="_blank" rel="noopener">
            <span class="pulse-dot" aria-hidden="true"></span>
            Cotizar ahora
          </a>
          <button class="nav-toggle" id="navToggle" aria-label="Abrir menú" aria-expanded="false" aria-controls="nav">☰</button>
        </div>
      </div>
    </div>
  </header>`;
}

function footer() {
  return `  <footer class="footer">
    <div class="container">
      <div class="footer-grid">
        <div class="footer-col footer-col--brand">
          <a href="/#inicio" class="logo">
            <span class="logo__mark" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 17V7a2 2 0 0 1 2-2h9l5 5v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z"/><path d="M14 5v5h5"/><path d="M9 13h6M9 16h4"/></svg>
            </span>
            <span class="logo__text">servitecbaq</span>
          </a>
          <p class="footer-col__desc">Servicio técnico a domicilio en Barranquilla y área metropolitana. Reparación, redes, CCTV y soporte empresarial.</p>
        </div>
        <div class="footer-col">
          <h3>Servicios</h3>
          <ul>
${SERVICIOS.map(s => '            <li><a href="/servicios/' + s.slug + '/">' + esc(s.label) + '</a></li>').join('\n')}
          </ul>
        </div>
        <div class="footer-col">
          <h3>Empresa</h3>
          <ul>
            <li><a href="/#nosotros">Nosotros</a></li>
            <li><a href="/#fundador">Fundador</a></li>
            <li><a href="/tips/">Tips</a></li>
            <li><a href="/#apps">Aplicativos</a></li>
            <li><a href="/apps/saldo/">App Saldo</a></li>
          </ul>
        </div>
        <div class="footer-col">
          <h3>Contacto</h3>
          <ul>
            <li><a href="https://wa.me/${NEG.whatsapp}" target="_blank" rel="noopener">${esc(NEG.telefono)}</a></li>
            <li><a href="mailto:${NEG.email}">${esc(NEG.email)}</a></li>
            <li>Barranquilla, Colombia</li>
            <li>Lun–Sáb · 9:00–17:00</li>
          </ul>
        </div>
      </div>
      <div class="footer-bottom">
        <p>© 2026 servitecbaq · Todos los derechos reservados</p>
      </div>
    </div>
  </footer>`;
}

function main(s) {
  const p = [];
  p.push(`  <main id="main" class="svc-page">
    <div class="container">
      <nav class="crumbs" aria-label="Ruta de navegación">
        <ol>
          <li><a href="/#inicio">Inicio</a></li>
          <li aria-hidden="true">/</li>
          <li><a href="/#servicios">Servicios</a></li>
          <li aria-hidden="true">/</li>
          <li aria-current="page">${esc(s.label)}</li>
        </ol>
      </nav>

      <header class="svc-hero">
        <span class="section-kicker">${s.icon} ${esc(s.label)}</span>
        <h1 class="section-title section-title--left">${esc(s.h1)}</h1>
${s.intro.map(par => '        <p class="svc-hero__lead">' + esc(par) + '</p>').join('\n')}
        <div class="svc-hero__actions">
          <a class="btn btn--accent btn--lg" href="${wa('Hola, necesito ' + s.phrase + ' en Barranquilla')}" target="_blank" rel="noopener">💬 Pedir por WhatsApp</a>
          <a class="btn btn--ghost btn--lg" href="mailto:${NEG.email}?subject=${encodeURIComponent(s.label)}">Correo a ${esc(NEG.email)}</a>
        </div>
        <ul class="svc-facts">
          <li><span class="svc-facts__k">Dónde</span>${esc(NEG.cobertura.join(' · '))}</li>
          <li><span class="svc-facts__k">Horario</span>${esc(NEG.horario)}</li>
          <li><span class="svc-facts__k">Teléfono</span>${esc(NEG.telefono)}</li>
        </ul>
      </header>

      <section class="svc-block">
        <h2 class="section-title section-title--left">Qué incluye ${esc(s.phrase)}</h2>
        <ul class="svc-includes">
${s.items.map(i => '          <li>' + esc(i) + '</li>').join('\n')}
        </ul>
      </section>`);

  if (s.sintomas) {
    p.push(`
      <section class="svc-block">
        <h2 class="section-title section-title--left">¿Te suena alguna de estas situaciones?</h2>
        <div class="svc-symptoms">
${s.sintomas.map(x => '          <article class="svc-symptom"><h3>' + esc(x.q) + '</h3><p>' + esc(x.a) + '</p></article>').join('\n')}
        </div>
      </section>`);
  }

  if (s.pasos) {
    p.push(`
      <section class="svc-block">
        <h2 class="section-title section-title--left">Cómo lo hacemos</h2>
        <ol class="svc-steps">
${s.pasos.map((x, i) => '          <li><span class="svc-steps__n" aria-hidden="true">' + String(i + 1).padStart(2, '0') + '</span><div><h3>' + esc(x.t) + '</h3><p>' + esc(x.d) + '</p></div></li>').join('\n')}
        </ol>
      </section>`);
  }

  p.push(`
      <section class="svc-block">
        <div class="faq-split">
          <div class="faq-split__head">
            <span class="section-kicker">❓ Preguntas frecuentes</span>
            <h2 class="section-title section-title--left">Dudas sobre ${esc(s.phrase)}</h2>
            <a class="btn btn--accent" href="${wa('Hola, tengo una duda sobre ' + s.phrase)}" target="_blank" rel="noopener">💬 Pregúntanos directamente</a>
          </div>
          <div class="faq-list">
${s.faq.map(f => '            <details class="faq-item"><summary><span>' + esc(f.q) + '</span><span class="faq-icon" aria-hidden="true">+</span></summary><div class="faq-answer">' + esc(f.a) + '</div></details>').join('\n')}
          </div>
        </div>
      </section>

      <section class="svc-block">
        <h2 class="section-title section-title--left">Otros servicios en Barranquilla</h2>
        <div class="svc-related">
${s.related.map(r => { const o = byKey[r]; return '          <a class="svc-related__card" href="/servicios/' + o.slug + '/"><span class="svc-related__icon" aria-hidden="true">' + o.icon + '</span><span class="svc-related__label">' + esc(o.label) + '</span></a>'; }).join('\n')}
        </div>
      </section>

      <section class="svc-cta">
        <div class="svc-cta__panel">
        <h2 class="section-title">Hablemos de ${esc(s.phrase)}</h2>
        <p class="svc-cta__text">Escríbenos con qué está pasando y te decimos qué puede ser antes de que te desplaces. Sin compromiso.</p>
        <a class="btn btn--accent btn--lg" href="${wa('Hola, necesito ' + s.phrase + ' en Barranquilla')}" target="_blank" rel="noopener">💬 Escribir por WhatsApp</a>
        </div>
      </section>
    </div>
  </main>`);
  return p.join('\n');
}

function page(s) {
  return `<!DOCTYPE html>
<!-- Generado por scripts/build-pages.js a partir de services.json. No editar a mano. -->
<html lang="es" data-theme="light">
<head>
${head(s)}
</head>
<body class="svc-page-body">
${header()}

${main(s)}

${footer()}
  <script src="/js/app-core.js" defer></script>
</body>
</html>
`;
}

/* ============================================
   TIPS — paginas /tips/<slug>/ y el hub /tips/
   El contenido largo vive en scripts/tips-content.js, indexado por la posicion
   del tip en tips.json. tips.json manda para el home; el resto para las paginas.
   ============================================ */
const TIPS = JSON.parse(fs.readFileSync(path.join(ROOT, 'tips.json'), 'utf8'));
const TIPS_C = require('./tips-content.js');
const tipIdx = Object.keys(TIPS_C).map(Number).sort((a, b) => a - b);
const tip = i => Object.assign({}, TIPS[i], TIPS_C[i], { idx: i });
const urlTip = i => NEG.url + '/tips/' + TIPS_C[i].slug + '/';

function validarTips() {
  const slugs = {};
  tipIdx.forEach(i => {
    const c = TIPS_C[i];
    if (!TIPS[i]) { warnings.push('tips-content[' + i + ']: no hay tip en esa posicion de tips.json'); return; }
    if (c.slug !== c.slug.toLowerCase() || /[^a-z0-9-]/.test(c.slug)) warnings.push(c.slug + ': slug no es ascii minusculo con guiones');
    if (slugs[c.slug]) warnings.push(c.slug + ': slug repetido');
    slugs[c.slug] = true;
    if (!byKey[c.service]) warnings.push(c.slug + ': service «' + c.service + '» no existe en services.json');
    if (c.h1.length > 65) warnings.push(c.slug + ': h1 de ' + c.h1.length + ' caracteres (max 65)');
    if (c.meta.length > 165) warnings.push(c.slug + ': meta de ' + c.meta.length + ' caracteres (max 165)');
    if (!c.pasos || c.pasos.length < 3 || c.pasos.length > 5) warnings.push(c.slug + ': «pasos» debe tener entre 3 y 5');
    if (!c.intro || c.intro.length !== 2) warnings.push(c.slug + ': «intro» debe tener 2 parrafos');
    (c.relacionados || []).forEach(r => {
      if (!TIPS_C[r]) warnings.push(c.slug + ': relacionado [' + r + '] no tiene contenido todavia');
    });
  });
  TIPS.forEach((t, i) => {
    if (!TIPS_C[i]) warnings.push('tip ' + i + ' («' + t.title + '»): sin pagina, falta en scripts/tips-content.js');
  });
}

function crumbs(nav) {
  return `      <nav class="crumbs" aria-label="Ruta de navegación">
        <ol>
${nav.map(([t, h]) => '          <li>' + (h ? '<a href="' + h + '">' + esc(t) + '</a>' : '<span aria-current="page">' + esc(t) + '</span>') + '</li>').join('\n')}
        </ol>
      </nav>`;
}

function tipLd(c) {
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: c.h1,
      description: c.meta,
      inLanguage: 'es',
      url: urlTip(c.idx),
      author: { '@type': 'Organization', name: NEG.nombre },
      publisher: { '@type': 'Organization', name: NEG.nombre, url: NEG.url + '/' },
      mainEntityOfPage: { '@type': 'WebPage', '@id': urlTip(c.idx) }
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Inicio', item: NEG.url + '/' },
        { '@type': 'ListItem', position: 2, name: 'Tips', item: NEG.url + '/tips/' },
        { '@type': 'ListItem', position: 3, name: c.h1, item: urlTip(c.idx) }
      ]
    }
  ];
}

function tipMain(c) {
  const s = byKey[c.service] || {};
  const rel = (c.relacionados || []).filter(r => TIPS_C[r]).map(tip);
  return `  <main id="contenido" class="svc-page">
    <div class="container">
${crumbs([['Inicio', '/'], ['Tips', '/tips/'], [c.h1, null]])}

      <header class="svc-hero">
        <span class="section-kicker">${c.icon} ${esc(c.category)}</span>
        <h1 class="section-title section-title--left">${esc(c.h1)}</h1>
${c.intro.map(t => '        <p class="svc-hero__lead">' + esc(t) + '</p>').join('\n')}
        <div class="svc-hero__actions">
          <a class="btn btn--accent btn--lg" href="${wa('Hola, vi el tip de ' + c.h1.toLowerCase() + ' y necesito ayuda con eso')}" target="_blank" rel="noopener">💬 Pedir que lo configuren</a>
          <a class="btn btn--ghost btn--lg" href="/tips/">Ver todos los tips</a>
        </div>
      </header>

      <section class="svc-block">
        <h2 class="section-title section-title--left">Cómo lo implementamos</h2>
        <ol class="svc-steps">
${c.pasos.map((t, k) => '          <li><span class="svc-steps__n" aria-hidden="true">' + String(k + 1).padStart(2, '0') + '</span><div><p>' + esc(t) + '</p></div></li>').join('\n')}
        </ol>
      </section>

      <section class="svc-block">
        <h2 class="section-title section-title--left">Cuándo te conviene</h2>
        <p class="tip-prose">${esc(c.cuando)}</p>
      </section>

      <section class="svc-block">
        <h2 class="section-title section-title--left">El error que vemos siempre</h2>
        <p class="tip-prose tip-prose--warn">${esc(c.error)}</p>
      </section>

      <section class="svc-block">
        <h2 class="section-title section-title--left">Servicio relacionado</h2>
        <div class="svc-related svc-related--one">
          <a class="svc-related__card" href="/servicios/${s.slug}/"><span class="svc-related__icon" aria-hidden="true">${s.icon}</span><span class="svc-related__label">${esc(s.label)} en Barranquilla</span></a>
        </div>
      </section>

      <section class="svc-block">
        <h2 class="section-title section-title--left">Otros tips de ${esc(c.category.toLowerCase())}</h2>
        <div class="svc-related">
${rel.map(r => '          <a class="svc-related__card" href="/tips/' + r.slug + '/"><span class="svc-related__icon" aria-hidden="true">' + r.icon + '</span><span class="svc-related__label">' + esc(r.title) + '</span></a>').join('\n')}
        </div>
      </section>

      <section class="svc-cta">
        <div class="svc-cta__panel">
        <h2 class="section-title">¿Lo dejamos configurado?</h2>
        <p class="svc-cta__text">${esc(c.benefit)}. Cuéntanos cómo tienes los equipos hoy y te decimos qué aplica en tu caso, sin que desmontes nada.</p>
        <a class="btn btn--accent btn--lg" href="${wa('Hola, necesito ayuda con: ' + c.h1)}" target="_blank" rel="noopener">💬 Escribir por WhatsApp</a>
        </div>
      </section>
    </div>
  </main>`;
}

function tipPage(c) {
  return `<!DOCTYPE html>
<!-- Generado por scripts/build-pages.js a partir de tips.json + scripts/tips-content.js. No editar a mano. -->
<html lang="es" data-theme="light">
<head>
${headBase({ title: c.h1, meta: c.meta, h1: c.h1, url: urlTip(c.idx), ld: tipLd(c) })}
</head>
<body class="svc-page-body">
${header()}

${tipMain(c)}

${footer()}
  <script src="/js/app-core.js" defer></script>
</body>
</html>
`;
}

function tipsHub() {
  const porCat = {};
  tipIdx.forEach(i => { const t = tip(i); (porCat[t.category] = porCat[t.category] || []).push(t); });
  const cats = Object.keys(porCat);
  const ld = [{
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Tips de Windows para casas y oficinas',
    description: 'Guías cortas de seguridad, redes, respaldo y productividad en Windows, escritas por Servitecbaq desde el soporte diario en Barranquilla.',
    url: NEG.url + '/tips/',
    inLanguage: 'es'
  }];
  const url = NEG.url + '/tips/';
  return `<!DOCTYPE html>
<!-- Generado por scripts/build-pages.js. No editar a mano. -->
<html lang="es" data-theme="light">
<head>
${headBase({
    title: 'Tips de Windows para casa y oficina | Servitecbaq',
    meta: 'Guías cortas de seguridad, redes, respaldo y productividad en Windows, probadas en equipos reales de casas y oficinas de Barranquilla.',
    h1: 'Tips de Windows para casa y oficina',
    url: url, ld: ld
  })}
</head>
<body class="svc-page-body">
${header()}

  <main id="contenido" class="svc-page">
    <div class="container">
${crumbs([['Inicio', '/'], ['Tips', null]])}
      <header class="svc-hero">
        <span class="section-kicker">💡 Tips</span>
        <h1 class="section-title section-title--left">Tips de Windows para casa y oficina</h1>
        <p class="svc-hero__lead">Lo que aprendemos cada día arreglando equipos en Barranquilla: qué control sirve de verdad, cómo lo montamos y en qué se equivocan los manuales genéricos.</p>
        <p class="svc-hero__lead">Cada guía es corta y termina diciendo cuándo conviene hacerlo uno mismo y cuándo sale más barato llamar.</p>
      </header>
      <section class="svc-block">
${cats.map(cat => `      <div class="tip-cat">
        <h2 class="section-title section-title--left">${esc(cat)}</h2>
        <div class="tip-index">
${porCat[cat].map(t => '          <a class="tip-index__card" href="/tips/' + t.slug + '/"><span class="tip-index__icon" aria-hidden="true">' + t.icon + '</span><h3>' + esc(t.title) + '</h3><p>' + esc(t.desc) + '</p><span class="tip-index__k">✨ ' + esc(t.benefit) + '</span></a>').join('\n')}
        </div>
      </div>`).join('\n')}
      </section>
      <section class="svc-cta">
        <div class="svc-cta__panel">
        <h2 class="section-title">¿Prefieres que lo hagamos nosotros?</h2>
        <p class="svc-cta__text">Trabajamos en Barranquilla y el área metropolitana, en casa, oficina o remoto.</p>
        <a class="btn btn--accent btn--lg" href="${wa('Hola, vi los tips y necesito ayuda')}" target="_blank" rel="noopener">💬 Escribir por WhatsApp</a>
        </div>
      </section>
    </div>
  </main>

${footer()}
  <script src="/js/app-core.js" defer></script>
</body>
</html>
`;
}

/* ============================================
   APP SALDO — pagina /apps/saldo/
   Las características y precios los publica el desarrollador del app
   (scripts/app-saldo-content.js cita la fuente). Servitecbaq solo aporta el
   soporte local, así que la pagina no suplanta la ficha oficial.
   ============================================ */
const APP = require('./app-saldo-content.js');
const urlApp = NEG.url + '/apps/' + APP.slug + '/';

function validarApp() {
  if (APP.slug !== APP.slug.toLowerCase() || /[^a-z0-9-]/.test(APP.slug)) warnings.push(APP.slug + ': slug no es ascii minusculo con guiones');
  if (APP.title.length > 65) warnings.push(APP.slug + ': title de ' + APP.title.length + ' caracteres (max 65)');
  if (APP.meta.length > 165) warnings.push(APP.slug + ': meta de ' + APP.meta.length + ' caracteres (max 165)');
  if (!APP.intro || APP.intro.length !== 2) warnings.push(APP.slug + ': «intro» debe tener 2 parrafos');
  if (!APP.pasos || APP.pasos.length !== 4) warnings.push(APP.slug + ': «pasos» debe tener 4 entradas');
  if (APP.planes.length !== 3) warnings.push(APP.slug + ': «planes» debe tener 3 entradas');
  APP.planes.forEach(p => { if (!/^\d+$/.test(p.amount)) warnings.push(APP.slug + ': plan «' + p.name + '» sin amount numerico'); });
  APP.related.forEach(r => {
    if (!byKey[r]) warnings.push(APP.slug + ': related apunta a «' + r + '», que no es un servicio');
  });
  [APP.icono].concat(APP.capturas).forEach(x => {
    if (!x.w || !x.h) warnings.push(APP.slug + ': «' + x.src + '» sin width/height, da CLS');
    if (!fs.existsSync(path.join(ROOT, x.src.replace(/^\//, '')))) warnings.push(APP.slug + ': falta el archivo ' + x.src);
  });
}

function appLd() {
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'MobileApplication',
      name: 'Saldo',
      description: APP.intro[0],
      url: urlApp,
      downloadUrl: APP.playUrl,
      operatingSystem: 'Android',
      applicationCategory: 'BusinessApplication',
      image: NEG.url + APP.icono.src,
      screenshot: APP.capturas.map(c => NEG.url + c.src),
      featureList: APP.funciones,
      developer: { '@type': 'Organization', name: APP.desarrollador, url: APP.devUrl },
      offers: APP.planes.map(p => ({
        '@type': 'Offer', name: p.name, price: p.amount, priceCurrency: 'COP', category: 'https://schema.org/Subscription'
      }))
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Inicio', item: NEG.url + '/' },
        { '@type': 'ListItem', position: 2, name: 'App destacada', item: NEG.url + '/#saldo' },
        { '@type': 'ListItem', position: 3, name: 'Saldo', item: urlApp }
      ]
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: APP.faq.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } }))
    }
  ];
}

function appMain() {
  return `  <main id="contenido" class="svc-page">
    <div class="container">
${crumbs([['Inicio', '/'], ['App destacada', '/#saldo'], ['Saldo', null]])}

      <header class="svc-hero">
        <img class="app-icon" src="${APP.icono.src}" width="${APP.icono.w}" height="${APP.icono.h}" alt="${esc(APP.icono.alt)}" decoding="async">
        <span class="section-kicker">${esc(APP.kicker)}</span>
        <h1 class="section-title section-title--left">${esc(APP.h1)}</h1>
${APP.intro.map(t => '        <p class="svc-hero__lead">' + esc(t) + '</p>').join('\n')}
        <div class="svc-hero__actions">
          <a class="btn btn--accent btn--lg" href="${APP.playUrl}" target="_blank" rel="noopener">📲 Descargar en Google Play</a>
          <a class="btn btn--ghost btn--lg" href="${wa('Hola, necesito que me monten la app Saldo en el negocio')}" target="_blank" rel="noopener">💬 Pedir el montaje</a>
        </div>
        <ul class="svc-facts">
          <li><span class="svc-facts__k">Plataforma</span>Android (Google Play)</li>
          <li><span class="svc-facts__k">Soporte local</span>${esc(NEG.cobertura.join(' · '))}</li>
          <li><span class="svc-facts__k">Desarrollador</span>${esc(APP.desarrollador)}</li>
        </ul>
      </header>

      <section class="svc-block">
        <h2 class="section-title section-title--left">Qué hace Saldo</h2>
        <ul class="svc-includes">
${APP.funciones.map(i => '          <li>' + esc(i) + '</li>').join('\n')}
        </ul>
      </section>

      <section class="svc-block">
        <h2 class="section-title section-title--left">Así se ve en el teléfono</h2>
        <div class="app-shots">
${APP.capturas.map(c => '          <figure class="app-shot"><img src="' + c.src + '" width="' + c.w + '" height="' + c.h + '" alt="' + esc(c.alt) + '" loading="lazy" decoding="async"><figcaption>' + esc(c.cap) + '</figcaption></figure>').join('\n')}
        </div>
        <p class="tip-prose">${esc(APP.avisoCapturas)}</p>
      </section>

      <section class="svc-block">
        <h2 class="section-title section-title--left">¿Te suena alguna de estas situaciones?</h2>
        <div class="svc-symptoms">
${APP.sintomas.map(x => '          <article class="svc-symptom"><h3>' + esc(x.q) + '</h3><p>' + esc(x.a) + '</p></article>').join('\n')}
        </div>
      </section>

      <section class="svc-block">
        <h2 class="section-title section-title--left">Planes y precios</h2>
        <div class="app-plans">
${APP.planes.map(p => `          <article class="app-plan">
            <h3 class="app-plan__name">${esc(p.name)}</h3>
            <p class="app-plan__price">${esc(p.price)}</p>
            <p class="app-plan__note">${esc(p.note)}</p>
            <ul>
${p.items.map(i => '              <li>' + esc(i) + '</li>').join('\n')}
            </ul>
          </article>`).join('\n')}
        </div>
        <p class="tip-prose">${esc(APP.avisoPrecios)}</p>
      </section>

      <section class="svc-block">
        <h2 class="section-title section-title--left">Cómo te lo montamos</h2>
        <ol class="svc-steps">
${APP.pasos.map((x, i) => '          <li><span class="svc-steps__n" aria-hidden="true">' + String(i + 1).padStart(2, '0') + '</span><div><h3>' + esc(x.t) + '</h3><p>' + esc(x.d) + '</p></div></li>').join('\n')}
        </ol>
      </section>

      <section class="svc-block">
        <h2 class="section-title section-title--left">Cuándo alcanza con el plan gratuito</h2>
        <p class="tip-prose">${esc(APP.cuando)}</p>
      </section>

      <section class="svc-block">
        <h2 class="section-title section-title--left">El error que vemos siempre</h2>
        <p class="tip-prose tip-prose--warn">${esc(APP.error)}</p>
      </section>

      <section class="svc-block">
        <div class="faq-split">
          <div class="faq-split__head">
            <span class="section-kicker">❓ Preguntas frecuentes</span>
            <h2 class="section-title section-title--left">Dudas sobre la app Saldo</h2>
            <a class="btn btn--accent" href="${wa('Hola, tengo una duda sobre la app Saldo')}" target="_blank" rel="noopener">💬 Pregúntanos directamente</a>
          </div>
          <div class="faq-list">
${APP.faq.map(f => '            <details class="faq-item"><summary><span>' + esc(f.q) + '</span><span class="faq-icon" aria-hidden="true">+</span></summary><div class="faq-answer">' + esc(f.a) + '</div></details>').join('\n')}
          </div>
        </div>
      </section>

      <section class="svc-block">
        <h2 class="section-title section-title--left">Servicios relacionados</h2>
        <div class="svc-related">
${APP.related.map(r => { const o = byKey[r]; return '          <a class="svc-related__card" href="/servicios/' + o.slug + '/"><span class="svc-related__icon" aria-hidden="true">' + o.icon + '</span><span class="svc-related__label">' + esc(o.label) + '</span></a>'; }).join('\n')}
        </div>
      </section>

      <section class="svc-block">
        <h2 class="section-title section-title--left">Otros tips de Windows para el negocio</h2>
        <div class="svc-related svc-related--one">
          <a class="svc-related__card" href="/tips/"><span class="svc-related__icon" aria-hidden="true">💡</span><span class="svc-related__label">Guías de respaldo, redes y seguridad</span></a>
        </div>
      </section>

      <section class="svc-block">
        <h2 class="section-title section-title--left">Ficha del producto</h2>
        <ul class="svc-facts">
          <li><span class="svc-facts__k">Desarrollador</span><a href="${APP.devUrl}" target="_blank" rel="noopener">${esc(APP.desarrollador)}</a></li>
          <li><span class="svc-facts__k">Google Play</span>${esc(APP.paquete)}</li>
          <li><span class="svc-facts__k">Idiomas</span>Español, inglés y portugués</li>
          <li><span class="svc-facts__k">Sitio del app</span><a href="${APP.devUrl}" target="_blank" rel="noopener">alejandrofragozo.github.io/saldo-web</a></li>
        </ul>
        <p class="tip-prose">${esc(APP.avisoMarca)}</p>
      </section>

      <section class="svc-cta">
        <div class="svc-cta__panel">
        <h2 class="section-title">${esc(APP.ctaTitle)}</h2>
        <p class="svc-cta__text">${esc(APP.ctaText)}</p>
        <a class="btn btn--accent btn--lg" href="${wa('Hola, quiero que me monten Saldo en el negocio')}" target="_blank" rel="noopener">💬 Escribir por WhatsApp</a>
        </div>
      </section>
    </div>
  </main>`;
}

function appPage() {
  return `<!DOCTYPE html>
<!-- Generado por scripts/build-pages.js a partir de scripts/app-saldo-content.js. No editar a mano. -->
<html lang="es" data-theme="light">
<head>
${headBase({ title: APP.title, meta: APP.meta, h1: APP.h1, url: urlApp, ld: appLd() })}
</head>
<body class="svc-page-body">
${header()}

${appMain()}

${footer()}
  <script src="/js/app-core.js" defer></script>
</body>
</html>
`;
}

function sitemap() {  // Fecha local del contenido: toISOString() trae la hora UTC, que en Colombia
  // (+0 respecto a -5) deja un <lastmod> en el futuro.
  const d = new Date(fs.statSync(path.join(ROOT, 'services.json')).mtimeMs);
  const today = [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-');
  const urls = [NEG.url + '/'].concat(SERVICIOS.map(urlDe), [NEG.url + '/tips/'], tipIdx.map(urlTip), [urlApp]);
  return `<?xml version="1.0" encoding="UTF-8"?>
<!-- Generado por scripts/build-pages.js -->
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => '  <url>\n    <loc>' + u + '</loc>\n    <lastmod>' + today + '</lastmod>\n  </url>').join('\n')}
</urlset>
`;
}

validarConModal();
validarEnlaces();
validarTips();
validarApp();

if (warnings.length) {
  console.log('Avisos:');
  warnings.forEach(w => console.log('  - ' + w));
}

if (checkOnly) {
  console.log(warnings.length ? 'Validación con avisos.' : 'Validación limpia.');
  process.exit(0);
}

let escritas = 0;
// CRLF: core.autocrlf=true deja el checkout del repo con saltos de línea CRLF.
// Si el generador escribiera LF, cada build dejaría las páginas como "modificadas".
const escribir = (file, txt) => fs.writeFileSync(file, txt.replace(/\r?\n/g, '\r\n'), 'utf8');
SERVICIOS.forEach(s => {
  const dir = path.join(ROOT, 'servicios', s.slug);
  fs.mkdirSync(dir, { recursive: true });
  escribir(path.join(dir, 'index.html'), page(s));
  escritas++;
});
escribir(path.join(ROOT, 'sitemap.xml'), sitemap());

let tipsEscritas = 0;
tipIdx.forEach(i => {
  const dir = path.join(ROOT, 'tips', TIPS_C[i].slug);
  fs.mkdirSync(dir, { recursive: true });
  escribir(path.join(dir, 'index.html'), tipPage(tip(i)));
  tipsEscritas++;
});
fs.mkdirSync(path.join(ROOT, 'tips'), { recursive: true });
escribir(path.join(ROOT, 'tips', 'index.html'), tipsHub());

const dirApp = path.join(ROOT, 'apps', APP.slug);
fs.mkdirSync(dirApp, { recursive: true });
escribir(path.join(dirApp, 'index.html'), appPage());

console.log(escritas + ' paginas de servicio, ' + tipsEscritas + ' de tips y 1 de app generadas; sitemap.xml reescrito (' + (SERVICIOS.length + tipIdx.length + 3) + ' URLs).');
