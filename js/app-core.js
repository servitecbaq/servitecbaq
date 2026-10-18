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
})();
