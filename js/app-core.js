/* ============================================
   SERVITECBAQ — app-core.js — núcleo (helpers + UI esencial)
   ============================================ */
(function () {
  'use strict';

  const skipParam = (location.search.match(/[?&]skip=([^&]+)/) || [])[1] || '';
  if (skipParam === 'all') return;

  var SVC = window.SVC;
  /* ============================================
     CONFIGURACIÓN CENTRAL
     ============================================ */
  const CONFIG = {
    whatsappNumber: '573158505020',
    jiraUrl: 'https://servitecbaq.atlassian.net/servicedesk/customer/portal/3',
    grWidgetSrc: 'https://grwidget.com/v1/grwidget.js',
    clarityProjectId: 'z0y013ihgd',
    ipApiUrl: 'https://ipapi.co/json/',
    tipAutoplayMs: 8000,
    breakpoints: { mobile: 640, tablet: 900, desktop: 1024 },
    radar: {
      maxDpr: 1.5,
      particleDensity: 22000,
      minParticles: 20,
      maxParticles: 40,
      linkDist: 120,
      mouseRadius: 140
    },
    matrix: {
      maxDpr: 1.5,
      fontSize: 13,
      frameIntervalMs: 100
    }
  };

  /* Clarity se arranca aquí y no en el <head> porque las 43 URLs del sitio ya
     cargan este fichero: la medición no cuesta bytes de documento. */
  (function () {
    const id = CONFIG.clarityProjectId;
    if (!id || window.clarity) return;
    window.clarity = function () { (window.clarity.q = window.clarity.q || []).push(arguments); };
    const s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.clarity.ms/tag/' + id;
    document.head.appendChild(s);
  })();

  /* Un solo listener cubre los enlaces de WhatsApp de cada página. En el panel
     se segmenta por página: así cada guía se mide por clientes que escriben. */
  document.addEventListener('click', function (e) {
    if (!e.target.closest || !e.target.closest('a[href*="wa.me"]')) return;
    if (typeof window.clarity === 'function') window.clarity('event', 'wa_clic');
  });

  /* ============================================
     HELPERS
     ============================================ */
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.prototype.slice.call((root || document).querySelectorAll(sel));

  function rafThrottle(fn) {
    let scheduled = false;
    return function () {
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(function () {
        scheduled = false;
        fn.apply(this, arguments);
      });
    };
  }

  function debounce(fn, wait) {
    let timer;
    return function () {
      const ctx = this, args = arguments;
      clearTimeout(timer);
      timer = setTimeout(function () { fn.apply(ctx, args); }, wait);
    };
  }

  function whenIdle(fn, timeout) {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(fn, { timeout: timeout || 2000 });
    } else {
      setTimeout(fn, 1);
    }
  }

  // Inserta nodos por lotes para evitar long tasks en el render inicial
  function mountInChunks(container, nodes, chunkSize) {
    let i = 0;
    const size = chunkSize || 6;
    const token = (container._mountToken = (container._mountToken || 0) + 1);
    (function next() {
      if (token !== container._mountToken) return;
      const frag = document.createDocumentFragment();
      const end = Math.min(i + size, nodes.length);
      for (; i < end; i++) frag.appendChild(nodes[i]);
      container.appendChild(frag);
      if (i < nodes.length) whenIdle(next, 4000);
    })();
  }

  // ⚡ Cache de matchMedia (evita crear objetos repetidos)
  const mqCache = new Map();
  function mq(query) {
    if (!mqCache.has(query)) mqCache.set(query, window.matchMedia(query));
    return mqCache.get(query);
  }

  // API compartida entre chunks
  var SVC = window.SVC = window.SVC || {};
  SVC.CONFIG = CONFIG;
  SVC.$ = $;
  SVC.$$ = $$;
  SVC.whenIdle = whenIdle;
  SVC.rafThrottle = rafThrottle;
  SVC.debounce = debounce;
  SVC.mountInChunks = mountInChunks;
  SVC.mq = mq;

  const isMobile = mq('(max-width: 640px)').matches;
  const isTablet = mq('(max-width: 900px)').matches;
  const prefersReducedMotion = mq('(prefers-reduced-motion: reduce)').matches;
  SVC.isMobile = isMobile;
  SVC.isTablet = isTablet;
  SVC.prefersReducedMotion = prefersReducedMotion;

  /* ============================================
     DETECCIÓN DE DISPOSITIVO DE BAJA POTENCIA
     ============================================ */
  (function detectLowPower() {
    if (prefersReducedMotion) {
      document.documentElement.classList.add('low-power');
      return;
    }
    if (!isMobile && !isTablet) return;
    const cores = navigator.hardwareConcurrency || 8;
    const memory = navigator.deviceMemory || 4;
    if (cores <= 4 || memory < 4) {
      document.documentElement.classList.add('low-power');
    }
  })();

  /* ============================================
     1. MENÚ MÓVIL
     ============================================ */
  (function initMobileMenu() {
    const toggle = $('#navToggle');
    const nav = $('#nav');
    if (!toggle || !nav) return;

    function close() {
      nav.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.textContent = '☰';
      toggle.setAttribute('aria-label', 'Abrir menú');
      document.body.classList.remove('nav-open');
    }

    toggle.addEventListener('click', function () {
      const isOpen = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(isOpen));
      toggle.textContent = isOpen ? '✕' : '☰';
      toggle.setAttribute('aria-label', isOpen ? 'Cerrar menú' : 'Abrir menú');
      document.body.classList.toggle('nav-open', isOpen);
    });

    nav.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') close();
    });

    document.addEventListener('click', function (e) {
      if (!nav.classList.contains('open')) return;
      if (nav.contains(e.target) || toggle.contains(e.target)) return;
      close();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('open')) close();
    });

    // ⚡ Cerrar al cambiar a desktop
    mq('(min-width: 901px)').addEventListener('change', function (e) {
      if (e.matches) close();
    });
  })();

  /* ============================================
     2. SCROLL SUAVE
     ============================================ */
  (function initSmoothScroll() {
    document.addEventListener('click', function (e) {
      const link = e.target.closest('a[href^="#"]');
      if (!link) return;
      const href = link.getAttribute('href');
      if (!href || href === '#') return;
      const target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      const header = $('.header');
      const offset = header ? header.offsetHeight + 20 : 0;
      const top = target.getBoundingClientRect().top + window.pageYOffset - offset;
      window.scrollTo({ top: top, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
      // Actualizar hash sin saltar
      if (history.replaceState) history.replaceState(null, '', href);
    });
  })();

  /* ============================================
     3. HEADER CON SOMBRA AL SCROLL
     ============================================ */
  (function initHeaderScroll() {
    const header = $('#siteHeader') || $('.header');
    if (!header) return;

    let lastY = -1;
    const onScroll = rafThrottle(function () {
      const y = window.scrollY;
      if (y === lastY) return;
      lastY = y;
      header.classList.toggle('scrolled', y > 20);
    });

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  })();

  /* ============================================
     4. REVEAL ON SCROLL
     ============================================ */
  (function initReveal() {
    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
      // Sin animación: mostrar todo
      $$('.reveal, .svc, .bento, .about-feature, .contact-card, .faq-item, .stat-block, .kpi, .zone-chip, .app-card, .tip-mini, .cert-badge')
        .forEach(function (el) { el.classList.add('visible'); });
      return;
    }

    const selectors = [
      '.svc', '.about-feature', '.contact-card', '.faq-item', '.bento',
      '.stat-block', '.kpi', '.zone-chip', '.founder-split__stats',
      '.app-card', '.cert-badge', '.tip-mini'
    ];

    let counter = 0;
    selectors.forEach(function (sel) {
      $$(sel).forEach(function (el) {
        if (el.classList.contains('reveal')) return;
        if (el.closest('.hero__bento')) return;
        el.classList.add('reveal');
        el.classList.add('reveal-delay-' + ((counter++ % 8) + 1));
      });
    });

    $$('.section-title, .section-subtitle, .section-lead, .section-kicker').forEach(function (el) {
      if (!el.classList.contains('reveal')) el.classList.add('reveal');
    });

    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });

    $$('.reveal').forEach(function (el) { observer.observe(el); });
  })();

  /* ============================================
     5. TOGGLE DE TEMA
     ============================================ */
  (function initTheme() {
    const toggle = $('#themeToggle');
    if (toggle) {
      toggle.addEventListener('click', function () {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        try { localStorage.setItem('theme', next); } catch (e) {}
      });
    }

    mq('(prefers-color-scheme: dark)').addEventListener('change', function (e) {
      let saved = null;
      try { saved = localStorage.getItem('theme'); } catch (err) {}
      if (!saved) {
        document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
      }
    });
  })();

  /* ============================================
     RACK R-04 — tarjeta "Servicio estrella" (iso-glow)
     La escena vive en img/rack.svg: se inyecta aquí (chunk diferido)
     para no engordar el HTML crítico.
     ============================================ */
  (function initRack() {
    var host = document.querySelector('[data-rack]');
    if (!host || host.querySelector('svg')) return;

    var LOAD_PCT = [0, 8, 15, 23, 30, 38, 45, 53];
    var BAR_W = 57.4;
    var on = [true, true, true, true, true, true, true];
    var statusEl = document.querySelector('[data-rack-status]');

    function pad(n) { return (n < 10 ? '0' : '') + n; }

    function say(n) {
      if (statusEl) statusEl.textContent = n + ' de 7 unidades activas';
    }

    function render(svg) {
      var n = 0, i;
      for (i = 0; i < 7; i++) if (on[i]) n++;
      var pct = LOAD_PCT[n];
      var w = (BAR_W * pct / 100).toFixed(1);
      var up = svg.getElementById('rk-up');
      var load = svg.getElementById('rk-load');
      var bar = svg.getElementById('rk-bar');
      var glow = svg.getElementById('rk-barglow');
      if (up) up.textContent = 'UP ' + n + '/7';
      if (load) load.textContent = 'LOAD ' + pct + '%';
      if (bar) bar.setAttribute('width', w);
      if (glow) glow.setAttribute('width', w);
      var groups = svg.querySelectorAll('.rk-unit-g');
      for (i = 0; i < groups.length; i++) {
        groups[i].classList.toggle('rk-offg', !on[i]);
        groups[i].setAttribute('aria-pressed', on[i] ? 'true' : 'false');
        groups[i].setAttribute('aria-label', 'Unidad ' + pad(i + 1) + ': ' + (on[i] ? 'activa' : 'apagada'));
      }
    }

    function unit(e) {
      var t = e.target;
      return t && t.closest ? t.closest('.rk-unit-g') : null;
    }

    function toggle(g, svg) {
      var i = parseInt(g.getAttribute('data-unit'), 10) - 1;
      if (i < 0 || i > 6) return;
      on[i] = !on[i];
      render(svg);
      var n = 0;
      for (var k = 0; k < 7; k++) if (on[k]) n++;
      say(n);
    }

    function wire(svg) {
      render(svg);
      svg.addEventListener('click', function (e) {
        var g = unit(e);
        if (g) toggle(g, svg);
      });
      svg.addEventListener('keydown', function (e) {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        var g = unit(e);
        if (!g) return;
        e.preventDefault();
        toggle(g, svg);
      });
      svg.addEventListener('dblclick', function (e) {
        if (!unit(e)) return;
        for (var i = 0; i < 7; i++) on[i] = true;
        render(svg);
        say(7);
      });
    }

    function still() { return host.querySelector('svg,img'); }
    function fallback() {
      if (still()) return;
      host.innerHTML = '<img src="img/rack.svg" alt="Rack R-04 con siete unidades encendidas" style="width:100%;height:100%;object-fit:cover">';
    }
    if (typeof fetch !== 'function') { fallback(); return; }
    fetch('img/rack.svg').then(function (r) {
      if (!r.ok) throw new Error(r.status);
      return r.text();
    }).then(function (txt) {
      if (still()) return;
      host.innerHTML = txt;
      var svg = host.querySelector('svg');
      if (svg) wire(svg);
    }).catch(fallback);
  })();

})();
