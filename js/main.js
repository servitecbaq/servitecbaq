/* ============================================
   SERVITECBAQ — main.js
   Optimizado para rendimiento, accesibilidad y robustez.
   Todas las animaciones y funcionalidades intactas.
   ============================================ */

document.addEventListener('DOMContentLoaded', function () {
  'use strict';

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

  // ⚡ Cache de matchMedia (evita crear objetos repetidos)
  const mqCache = new Map();
  function mq(query) {
    if (!mqCache.has(query)) mqCache.set(query, window.matchMedia(query));
    return mqCache.get(query);
  }

  const isMobile = mq('(max-width: 640px)').matches;
  const isTablet = mq('(max-width: 900px)').matches;
  const prefersReducedMotion = mq('(prefers-reduced-motion: reduce)').matches;

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
     6. MODAL DE SERVICIOS
     ============================================ */
  const servicesData = {
    mantenimiento: {
      icon: '⚡', title: 'Mantenimiento y reparación',
      description: 'Prolongamos la vida útil de tus equipos y solucionamos fallas de hardware y software, tanto en computadores de escritorio como portátiles.',
      items: ['Limpieza interna de polvo y ventiladores','Cambio de pasta térmica','Optimización del sistema operativo','Diagnóstico completo del equipo','Cambio de piezas (disco, RAM, batería, teclado)','Reinstalación de sistema operativo','Eliminación de virus y malware','Recuperación de datos cuando sea posible']
    },
    redes: {
      icon: '🌐', title: 'Redes e Internet',
      description: 'Configuramos y solucionamos problemas de conectividad en hogares, oficinas y pequeñas empresas.',
      items: ['Configuración de routers y módems','Instalación de redes Wi-Fi y cableadas','Ampliación de cobertura con repetidores o mesh','Segmentación con VLAN para invitados o CCTV','Reservas DHCP y direccionamiento IP estable','Solución de cortes o lentitud de internet','Configuración de red para pequeñas oficinas']
    },
    impresoras: {
      icon: '🖨️', title: 'Impresoras',
      description: 'Instalamos, configuramos y reparamos impresoras de todas las marcas, en hogares y oficinas.',
      items: ['Instalación en Windows y Mac','Configuración en red o Wi-Fi','Solución de atascos y errores','Cambio de cartuchos y tóner','Impresión desde celular o tablet','Configuración de impresora compartida en red']
    },
    instalacion: {
      icon: '🧩', title: 'Instalación, configuración y soporte de aplicativos',
      description: 'Dejamos tus equipos listos para trabajar, estudiar o disfrutar, y te ayudamos con los programas que usas a diario.',
      items: ['Instalación de computadores nuevos','Configuración inicial de Windows, macOS o Linux','Instalación de programas esenciales','Configuración de cuentas y correo','Instalación y configuración de programas','Solución de errores en Office, sistemas contables y navegadores','Configuración de correo y aplicaciones corporativas','Actualización o reinstalación de aplicaciones']
    },
    seguridad: {
      icon: '🔒', title: 'Seguridad, respaldo y administración de usuarios',
      description: 'Protegemos tu información, configuramos copias de seguridad y gestionamos cuentas, permisos y accesos.',
      items: ['Instalación de antivirus y firewall','Configuración de copias de seguridad automáticas','Respaldo en la nube o discos externos','Protección contra ransomware','Asesoría en contraseñas seguras','Altas, bajas y modificaciones de usuarios','Grupos, roles y permisos por área','Políticas de contraseñas y expiración','Integración con Active Directory y Microsoft 365','Configuración de MFA y auditoría de accesos']
    },
    camaras: {
      icon: '📹', title: 'Videovigilancia (CCTV)',
      description: 'Instalamos, configuramos y administramos sistemas de cámaras de seguridad para hogares y negocios.',
      items: ['Instalación de cámaras IP y análogas (interior/exterior)','Configuración de DVR/NVR y almacenamiento','Acceso remoto desde celular (app o navegador)','Grabación por movimiento y horarios','Integración con la red existente y VLAN de CCTV','Mantenimiento, limpieza y revisión de cableado','Configuración de respaldo de video']
    },
    desarrollo: {
      icon: '👨‍💻', title: 'Desarrollo de software',
      description: 'Creamos soluciones a la medida para automatizar procesos y mejorar la operación de tu negocio.',
      items: ['Páginas web y landing pages','Automatización de tareas repetitivas','Scripts en PowerShell y Python','Integración de sistemas y APIs','Bases de datos SQL y reportes personalizados','Aplicaciones web a la medida']
    },
    empresariales: {
      icon: '☁️', title: 'Soluciones empresariales',
      description: 'Infraestructura, servidores y servicios en la nube para pequeñas y medianas empresas.',
      items: ['Administración de servidores Windows y Linux','Virtualización con VMware','Microsoft 365 y Azure','Active Directory y políticas de grupo (GPO)','Respaldos empresariales y plan de recuperación','Automatización con PowerShell','Monitoreo de red y servidores','Asesoría en seguridad informática']
    }
  };

  (function initServiceModal() {
    const modal = $('#serviceModal');
    const iconEl = $('#modalIcon');
    const titleEl = $('#modalTitle');
    const descEl = $('#modalDesc');
    const listEl = $('#modalList');
    const closeBtn = $('#modalClose');
    const ctaEl = modal ? modal.querySelector('.modal-cta') : null;
    if (!modal) return;

    let lastFocused = null;

    function open(key) {
      const data = servicesData[key];
      if (!data) return;
      lastFocused = document.activeElement;
      iconEl.textContent = data.icon;
      titleEl.textContent = data.title;
      descEl.textContent = data.description;
      listEl.textContent = '';
      const frag = document.createDocumentFragment();
      data.items.forEach(function (item) {
        const li = document.createElement('li');
        li.textContent = item;
        frag.appendChild(li);
      });
      listEl.appendChild(frag);
      if (ctaEl) {
        ctaEl.href = 'https://wa.me/' + CONFIG.whatsappNumber +
          '?text=' + encodeURIComponent('Hola Servitecbaq, necesito información sobre: ' + data.title);
      }
      modal.classList.add('open');
      modal.setAttribute('aria-hidden', 'false');
      document.body.classList.add('modal-open');
      setTimeout(function () { closeBtn && closeBtn.focus(); }, 50);
    }

    function close() {
      modal.classList.remove('open');
      modal.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('modal-open');
      if (lastFocused && lastFocused.focus) lastFocused.focus();
    }

    // Delegación: un único listener
    document.addEventListener('click', function (e) {
      const card = e.target.closest('.svc[data-service], .service-card[data-service]');
      if (card) {
        open(card.getAttribute('data-service'));
      }
    });

    document.addEventListener('keydown', function (e) {
      const card = e.target.closest && e.target.closest('.svc[data-service], .service-card[data-service]');
      if (card && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        open(card.getAttribute('data-service'));
        return;
      }
      if (e.key === 'Escape' && modal.classList.contains('open')) close();

      // Focus trap: el Tab no debe salir del modal abierto
      if (e.key === 'Tab' && modal.classList.contains('open')) {
        const focusables = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (!focusables.length) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    });

    if (closeBtn) closeBtn.addEventListener('click', close);
    modal.addEventListener('click', function (e) {
      if (e.target.hasAttribute('data-close-modal')) close();
    });
  })();

  /* ============================================
     7. TIPS (con AbortController para fetch)
     ============================================ */
  (function initTips() {
    const tipTrack = $('#tipTrack');
    const tipDots = $('#tipDots');
    const tipPrev = $('#tipPrev');
    const tipNext = $('#tipNext');
    const tipsGrid = $('#tipsGrid');
    const tipsExpandBtn = $('#tipsExpandBtn');
    const tipsGridWrapper = $('#tipsGridWrapper');
    const tipsExpandText = tipsExpandBtn ? tipsExpandBtn.querySelector('.tips-expand-text') : null;
    if (!tipTrack || !tipDots) return;

    const controller = new AbortController();
    const state = {
      data: [],
      current: 0,
      autoplayTimer: null,
      card: null,
      dots: null,
      carousel: $('#tipCarousel')
    };
    const shouldAutoplay = !isMobile && !prefersReducedMotion;

    function shuffle(arr) {
      const a = arr.slice();
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const t = a[i]; a[i] = a[j]; a[j] = t;
      }
      return a;
    }

    fetch('tips.json', { signal: controller.signal })
      .then(function (r) {
        if (!r.ok) throw new Error('tips.json');
        return r.json();
      })
      .then(function (data) {
        if (!Array.isArray(data) || data.length === 0) return;
        state.data = shuffle(data);

        const card = document.createElement('article');
        card.className = 'tip-card';
        tipTrack.appendChild(card);
        state.card = card;

        function paint(tip, animate) {
          const html =
            '<span class="tip-category">' + tip.category + '</span>' +
            '<div class="tip-icon" aria-hidden="true">' + tip.icon + '</div>' +
            '<h3 class="tip-title">' + tip.title + '</h3>' +
            '<p class="tip-desc">' + tip.desc + '</p>' +
            '<span class="tip-benefit">✨ ' + tip.benefit + '</span>';
          if (!animate || !shouldAutoplay) {
            card.innerHTML = html;
            return;
          }
          card.classList.add('switching');
          setTimeout(function () {
            card.innerHTML = html;
            card.classList.remove('switching');
          }, 180);
        }

        paint(state.data[0], false);

        // Dots
        const dotsFrag = document.createDocumentFragment();
        state.data.forEach(function (_, i) {
          const dot = document.createElement('button');
          dot.className = 'tip-dot' + (i === 0 ? ' active' : '');
          dot.setAttribute('aria-label', 'Ir al tip ' + (i + 1));
          dot.addEventListener('click', function () { goTo(i); });
          dotsFrag.appendChild(dot);
        });
        tipDots.appendChild(dotsFrag);
        state.dots = tipDots.querySelectorAll('.tip-dot');

        // Grid
        if (tipsGrid) {
          const gridFrag = document.createDocumentFragment();
          state.data.forEach(function (tip) {
            const mini = document.createElement('article');
            mini.className = 'tip-mini';
            mini.innerHTML =
              '<span class="tip-mini-icon" aria-hidden="true">' + tip.icon + '</span>' +
              '<h4>' + tip.title + '</h4>' +
              '<p>' + tip.desc + '</p>';
            gridFrag.appendChild(mini);
          });
          tipsGrid.appendChild(gridFrag);
        }

        function goTo(index) {
          if (index === state.current || !state.data.length) return;
          state.dots[state.current].classList.remove('active');
          state.current = (index + state.data.length) % state.data.length;
          state.dots[state.current].classList.add('active');
          paint(state.data[state.current], true);
          restartAutoplay();
        }
        function next() { goTo(state.current + 1); }
        function prev() { goTo(state.current - 1); }

        function startAutoplay() {
          if (state.autoplayTimer || !shouldAutoplay) return;
          state.autoplayTimer = setInterval(next, CONFIG.tipAutoplayMs);
        }
        function stopAutoplay() {
          if (state.autoplayTimer) {
            clearInterval(state.autoplayTimer);
            state.autoplayTimer = null;
          }
        }
        function restartAutoplay() { stopAutoplay(); startAutoplay(); }

        if (tipNext) tipNext.addEventListener('click', next);
        if (tipPrev) tipPrev.addEventListener('click', prev);

        if (state.carousel) {
          state.carousel.addEventListener('mouseenter', stopAutoplay);
          state.carousel.addEventListener('mouseleave', startAutoplay);
        }

        document.addEventListener('keydown', function (e) {
          if (!state.carousel) return;
          const rect = state.carousel.getBoundingClientRect();
          const inView = rect.top < window.innerHeight && rect.bottom > 0;
          if (!inView) return;
          if (e.key === 'ArrowRight') next();
          if (e.key === 'ArrowLeft') prev();
        });

        if (tipsExpandBtn && tipsGridWrapper) {
          tipsExpandBtn.addEventListener('click', function () {
            const isOpen = tipsGridWrapper.classList.toggle('open');
            tipsExpandBtn.setAttribute('aria-expanded', String(isOpen));
            if (tipsExpandText) {
              tipsExpandText.textContent = isOpen ? 'Ocultar tips' : 'Ver todos los tips';
            }
          });
        }

        // Autoplay al entrar en viewport
        if ('IntersectionObserver' in window && state.carousel && shouldAutoplay) {
          const playObserver = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
              if (entry.isIntersecting) startAutoplay();
              else stopAutoplay();
            });
          }, { threshold: 0.1 });
          playObserver.observe(state.carousel);
        }
      })
      .catch(function (err) {
        if (err.name === 'AbortError') return;
        console.error('Error tips:', err);
        tipTrack.innerHTML = '<p style="text-align:center;color:var(--fg-muted);padding:40px 20px;">No se pudieron cargar los tips.</p>';
      });
  })();

  /* ============================================
     8. APLICATIVOS
     ============================================ */
  (function initApps() {
    const appsGrid = $('#appsGrid');
    const appsFilters = $('#appsFilters');
    const appsSearch = $('#appsSearch');
    const appsEmpty = $('#appsEmpty');
    if (!appsGrid || !appsFilters) return;

    const controller = new AbortController();
    const state = { all: [], activeCategory: 'all', term: '' };

    fetch('apps.json', { signal: controller.signal })
      .then(function (r) {
        if (!r.ok) throw new Error('apps.json');
        return r.json();
      })
      .then(function (data) {
        if (!Array.isArray(data) || data.length === 0) return;
        state.all = data;

        const categories = ['all'];
        data.forEach(function (app) {
          if (!categories.includes(app.category)) categories.push(app.category);
        });

        const frag = document.createDocumentFragment();
        categories.forEach(function (cat) {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'apps-filter' + (cat === 'all' ? ' active' : '');
          btn.dataset.category = cat;
          btn.textContent = cat === 'all' ? 'Todos' : cat;
          frag.appendChild(btn);
        });
        appsFilters.textContent = '';
        appsFilters.appendChild(frag);
        render();
      })
      .catch(function (err) {
        if (err.name === 'AbortError') return;
        console.error('Error apps:', err);
        appsGrid.innerHTML = '<p class="apps-empty">No se pudieron cargar los aplicativos.</p>';
      });

    appsFilters.addEventListener('click', function (e) {
      const btn = e.target.closest('.apps-filter');
      if (!btn) return;
      appsFilters.querySelectorAll('.apps-filter').forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      state.activeCategory = btn.dataset.category;
      render();
    });

    if (appsSearch) {
      const onInput = debounce(function () {
        state.term = appsSearch.value;
        render();
      }, 200);
      appsSearch.addEventListener('input', onInput);
    }

    function render() {
      const term = state.term.toLowerCase().trim();
      const filtered = state.all.filter(function (app) {
        const catOk = state.activeCategory === 'all' || app.category === state.activeCategory;
        if (!catOk) return false;
        if (!term) return true;
        return app.name.toLowerCase().indexOf(term) !== -1 ||
               app.desc.toLowerCase().indexOf(term) !== -1 ||
               app.category.toLowerCase().indexOf(term) !== -1;
      });

      appsGrid.textContent = '';

      if (filtered.length === 0) {
        if (appsEmpty) appsEmpty.hidden = false;
        return;
      }
      if (appsEmpty) appsEmpty.hidden = true;

      const frag = document.createDocumentFragment();
      filtered.forEach(function (app) {
        const card = document.createElement('a');
        card.className = 'app-card';
        card.href = app.url;
        card.target = '_blank';
        card.rel = 'noopener noreferrer';

        const badges = (app.badges || []).map(function (b) {
          const isFree = b.toLowerCase() === 'gratis' || b.toLowerCase() === 'free';
          return '<span class="app-badge' + (isFree ? ' free' : '') + '">' + b + '</span>';
        }).join('');

        card.innerHTML =
          '<div class="app-logo" aria-hidden="true">' + app.icon + '</div>' +
          '<h3 class="app-name">' + app.name + '</h3>' +
          '<p class="app-desc">' + app.desc + '</p>' +
          '<div class="app-meta">' + badges + '</div>' +
          '<span class="app-link">Sitio oficial →</span>';

        frag.appendChild(card);
      });
      appsGrid.appendChild(frag);
    }
  })();

  /* ============================================
     9. FAQ (mejora progresiva)
     ============================================ */
  (function initFAQ() {
    $$('.faq-item').forEach(function (item) {
      const answer = item.querySelector('.faq-answer');
      if (!answer) return;
      if (answer.parentElement.classList.contains('faq-content')) return;

      const wrapper = document.createElement('div');
      wrapper.className = 'faq-content';
      const inner = document.createElement('div');
      answer.parentNode.insertBefore(wrapper, answer);
      wrapper.appendChild(inner);
      inner.appendChild(answer);
    });

    // ⚡ Solo una FAQ abierta a la vez (mejor UX)
    const items = $$('.faq-item');
    items.forEach(function (item) {
      item.addEventListener('toggle', function () {
        if (!item.open) return;
        items.forEach(function (other) {
          if (other !== item && other.open) other.open = false;
        });
      });
    });
  })();

  /* ============================================
     10. LAZY LOAD: GR WIDGET
     ============================================ */
  (function initGRWidget() {
    const reviewsSection = $('#resenas');
    if (!reviewsSection) return;

    let loaded = false;
    function load() {
      if (loaded) return;
      loaded = true;
      const script = document.createElement('script');
      script.src = CONFIG.grWidgetSrc;
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    }

    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            load();
            io.disconnect();
          }
        });
      }, { rootMargin: '200px 0px' });
      io.observe(reviewsSection);
    } else {
      whenIdle(load, 4000);
    }
  })();

  /* ============================================
     11. FORMULARIO DE CONTACTO
     ============================================ */
  (function initContactForm() {
    const form = $('#contactForm');
    const status = $('#formStatus');
    const submit = $('#formSubmit');
    if (!form) return;

    const controller = new AbortController();

    function setStatus(msg, type) {
      if (!status) return;
      status.hidden = false;
      status.className = 'form-status ' + (type || '');
      status.textContent = msg;
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      submit.disabled = true;
      submit.textContent = '⏳ Enviando…';
      if (status) {
        status.hidden = true;
        status.className = 'form-status';
        status.textContent = '';
      }

      fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' },
        signal: controller.signal
      })
        .then(function (r) { return r.json(); })
        .then(function (data) {
          if (!data.success) throw new Error(data.message || 'Error al enviar');
          setStatus('¡Gracias! Hemos recibido tu mensaje. Te responderemos lo antes posible.', 'success');
          form.reset();
          submit.disabled = false;
          submit.textContent = '✉️ Enviar mensaje';
          setTimeout(function () {
            if (status) status.hidden = true;
          }, 8000);
        })
        .catch(function (err) {
          if (err.name === 'AbortError') return;
          console.error('Error formulario:', err);
          setStatus('Hubo un problema al enviar. Intenta de nuevo o escríbenos por WhatsApp.', 'error');
          submit.disabled = false;
          submit.textContent = '✉️ Enviar mensaje';
        });
    });

    // ⚡ Limpiar listeners al descargar (buena práctica)
    window.addEventListener('beforeunload', function () { controller.abort(); });
  })();

  /* ============================================
     12. BOTÓN JIRA
     ============================================ */
  (function initJira() {
    const btn = $('#jiraFloatBtn');
    if (!btn) return;
    btn.addEventListener('click', function () {
      const win = window.open(CONFIG.jiraUrl, '_blank', 'noopener,noreferrer');
      if (!win) {
        // Popup bloqueado → fallback
        window.location.href = CONFIG.jiraUrl;
      }
    });
  })();

  /* ============================================
     13. RADAR CANVAS
     ============================================ */
  (function initHeroRadar() {
    const canvas = $('#heroRadar');
    if (!canvas) return;
    if (prefersReducedMotion) return;
    if (document.documentElement.classList.contains('low-power')) return;
    if (isTablet) { canvas.style.display = 'none'; return; }

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let W = 0, H = 0, dpr = 1;
    let t = 0;
    let rafId = null;
    let isVisible = true;
    let isReady = false;
    const particles = [];
    const mouse = { x: -9999, y: -9999, radius: CONFIG.radar.mouseRadius };

    let cachedColors = null;
    let cachedTheme = null;
    mq('(prefers-color-scheme: dark)'); // ensure cache

    const themeObserver = new MutationObserver(function () { cachedColors = null; });
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    function getColors() {
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      if (cachedColors && cachedTheme === isDark) return cachedColors;
      cachedTheme = isDark;
      cachedColors = {
        dot: isDark ? 'rgba(99,102,241,0.95)' : 'rgba(79,70,229,0.85)',
        dotCore: 'rgba(255,255,255,0.95)',
        line: isDark ? 'rgba(99,102,241,' : 'rgba(79,70,229,',
        ring: isDark ? 'rgba(99,102,241,0.18)' : 'rgba(79,70,229,0.14)',
        sweep: isDark ? 'rgba(249,115,22,0.10)' : 'rgba(249,115,22,0.08)'
      };
      return cachedColors;
    }

    function resize() {
      const rect = canvas.getBoundingClientRect();
      if (rect.width < 10 || rect.height < 10) { isReady = false; return false; }
      dpr = Math.min(window.devicePixelRatio || 1, CONFIG.radar.maxDpr);
      W = rect.width;
      H = rect.height;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const target = Math.max(
        CONFIG.radar.minParticles,
        Math.min(CONFIG.radar.maxParticles, Math.floor((W * H) / CONFIG.radar.particleDensity))
      );
      particles.length = 0;
      for (let i = 0; i < target; i++) {
        particles.push({
          x: Math.random() * W,
          y: Math.random() * H,
          vx: (Math.random() - 0.5) * 0.22,
          vy: (Math.random() - 0.5) * 0.22,
          baseR: 1 + Math.random() * 1.5,
          phase: Math.random() * Math.PI * 2
        });
      }
      isReady = true;
      return true;
    }

    function draw() {
      if (!isVisible || !isReady) { rafId = null; return; }
      const colors = getColors();
      ctx.clearRect(0, 0, W, H);

      const cx = W / 2, cy = H / 2;
      const maxR = Math.max(W, H) * 0.6;

      ctx.strokeStyle = colors.ring;
      ctx.lineWidth = 1;
      for (let i = 1; i <= 3; i++) {
        ctx.beginPath();
        ctx.arc(cx, cy, (maxR / 3) * i, 0, Math.PI * 2);
        ctx.stroke();
      }

      if (t % 2 === 0 && ctx.createConicGradient) {
        const angle = (t * 0.012) % (Math.PI * 2);
        const grad = ctx.createConicGradient(angle, cx, cy);
        grad.addColorStop(0, colors.sweep);
        grad.addColorStop(0.15, 'rgba(0,0,0,0)');
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, cy, maxR, 0, Math.PI * 2);
        ctx.fill();
      }

      const linkDist = CONFIG.radar.linkDist;
      const linkDistSq = linkDist * linkDist;
      for (let i = 0; i < particles.length; i++) {
        const p1 = particles[i];
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p1.x - p2.x, dy = p1.y - p2.y;
          const dSq = dx * dx + dy * dy;
          if (dSq < linkDistSq) {
            const alpha = (1 - Math.sqrt(dSq) / linkDist) * 0.35;
            ctx.strokeStyle = colors.line + alpha + ')';
            ctx.lineWidth = 0.6;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      }

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = W;
        if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H;
        if (p.y > H) p.y = 0;

        const dx = mouse.x - p.x, dy = mouse.y - p.y;
        const dM = Math.sqrt(dx * dx + dy * dy);
        if (dM < mouse.radius) {
          const force = (mouse.radius - dM) / mouse.radius;
          ctx.strokeStyle = colors.line + (force * 0.5) + ')';
          ctx.lineWidth = 0.7;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.stroke();
        }

        p.phase += 0.02;
        const pulse = 1 + Math.sin(p.phase) * 0.3;
        const r = Math.max(0.6, p.baseR * pulse);

        ctx.fillStyle = colors.dot;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = colors.dotCore;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r * 0.4, 0, Math.PI * 2);
        ctx.fill();
      }

      t += 1;
      rafId = requestAnimationFrame(draw);
    }

    function start() {
      if (!resize()) {
        setTimeout(start, 60);
        return;
      }
      rafId = requestAnimationFrame(draw);
    }

    if (document.readyState === 'complete') {
      requestAnimationFrame(start);
    } else {
      window.addEventListener('load', function () {
        requestAnimationFrame(start);
      }, { once: true });
    }

    // Resize
    const onResize = debounce(function () {
      if (resize() && !rafId) rafId = requestAnimationFrame(draw);
    }, 150);
    window.addEventListener('resize', onResize, { passive: true });

    if ('ResizeObserver' in window) {
      const ro = new ResizeObserver(debounce(function () {
        if (resize() && !rafId) rafId = requestAnimationFrame(draw);
      }, 150));
      ro.observe(canvas);
    }

    // Mouse
    const heroSection = canvas.parentElement;
    if (heroSection) {
      const onMouseMove = rafThrottle(function (e) {
        const rect = canvas.getBoundingClientRect();
        mouse.x = e.clientX - rect.left;
        mouse.y = e.clientY - rect.top;
      });
      heroSection.addEventListener('mousemove', onMouseMove, { passive: true });
      heroSection.addEventListener('mouseleave', function () {
        mouse.x = -9999; mouse.y = -9999;
      });
    }

    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          isVisible = entry.isIntersecting;
          if (isVisible && isReady && !rafId) rafId = requestAnimationFrame(draw);
        });
      }, { threshold: 0, rootMargin: '100px' });
      io.observe(canvas);
    }

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) {
        if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
      } else if (isVisible && isReady && !rafId) {
        rafId = requestAnimationFrame(draw);
      }
    });
  })();

  /* ============================================
     14. CURSOR PERSONALIZADO (robusto)
     ============================================ */
  (function initCustomCursor() {
    const ring = $('#cursorRing');
    const dot = $('#cursorDot');
    if (!ring || !dot) { document.body.style.cursor = 'auto'; return; }
    if (prefersReducedMotion) {
      ring.style.display = 'none';
      dot.style.display = 'none';
      document.body.style.cursor = 'auto';
      return;
    }
    if (mq('(any-pointer: none)').matches) {
      ring.style.display = 'none';
      dot.style.display = 'none';
      document.body.style.cursor = 'auto';
      return;
    }

    let mx = -100, my = -100;
    let rx = -100, ry = -100;
    let dx = -100, dy = -100;
    let rafId = null;
    let active = false;
    const RING_LERP = 0.18;
    const DOT_LERP = 0.55;

    function activate() {
      if (active) return;
      active = true;
      ring.style.display = 'block';
      dot.style.display = 'block';
      ring.style.opacity = '1';
      dot.style.opacity = '1';
      document.body.style.cursor = 'none';
      document.body.classList.add('cursor-ready');
    }

    function setPos(x, y) {
      ring.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0) translate(-50%,-50%)';
      dot.style.transform  = 'translate3d(' + x + 'px,' + y + 'px,0) translate(-50%,-50%)';
      rx = dx = x; ry = dy = y;
    }

    function onMove(e) {
      mx = e.clientX; my = e.clientY;
      if (!active) {
        activate();
        setPos(mx, my);
        rafId = requestAnimationFrame(animate);
      }
    }

    function animate() {
      if (!active) { rafId = null; return; }
      rx += (mx - rx) * RING_LERP;
      ry += (my - ry) * RING_LERP;
      dx += (mx - dx) * DOT_LERP;
      dy += (my - dy) * DOT_LERP;
      ring.style.transform = 'translate3d(' + rx + 'px,' + ry + 'px,0) translate(-50%,-50%)';
      dot.style.transform  = 'translate3d(' + dx + 'px,' + dy + 'px,0) translate(-50%,-50%)';
      rafId = requestAnimationFrame(animate);
    }

    const opts = { passive: true, capture: true };
    window.addEventListener('mousemove', onMove, opts);

    window.addEventListener('mousedown', function () { document.body.classList.add('cursor-down'); }, { capture: true });
    window.addEventListener('mouseup',   function () { document.body.classList.remove('cursor-down'); }, { capture: true });
    document.addEventListener('mouseleave', function () { document.body.classList.add('cursor-leaving'); }, { capture: true });
    document.addEventListener('mouseenter', function () { document.body.classList.remove('cursor-leaving'); }, { capture: true });

    function bindStates() {
      $$('[data-cursor="hover"]').forEach(function (el) {
        if (el.dataset.cursorBound === 'hover') return;
        el.dataset.cursorBound = 'hover';
        el.addEventListener('mouseenter', function () { document.body.classList.add('cursor-hover'); });
        el.addEventListener('mouseleave', function () { document.body.classList.remove('cursor-hover'); });
      });
      $$('[data-cursor="view"]').forEach(function (el) {
        if (el.dataset.cursorBound === 'view') return;
        el.dataset.cursorBound = 'view';
        el.addEventListener('mouseenter', function () { document.body.classList.add('cursor-view'); });
        el.addEventListener('mouseleave', function () { document.body.classList.remove('cursor-view'); });
      });
    }
    bindStates();

    const themeObserver = new MutationObserver(bindStates);
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) {
        if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
      } else if (active && !rafId) {
        rafId = requestAnimationFrame(animate);
      }
    });
  })();

  /* ============================================
     15. WIDGETS: DATOS + CALCULADORA
     ============================================ */
  (function initWidgets() {
    const overlay = $('#widgetOverlay');
    const devicePanel = $('#devicePanel');
    const calcPanel = $('#calcPanel');
    const deviceBtn = $('#deviceFloatBtn');
    const calcBtn = $('#calcFloatBtn');

    let active = null;

    function openPanel(panel) {
      if (!panel) return;
      if (active && active !== panel) {
        active.classList.remove('open');
        active.setAttribute('aria-hidden', 'true');
      }
      panel.classList.add('open');
      panel.setAttribute('aria-hidden', 'false');
      active = panel;
      if (overlay) overlay.classList.add('open');
      document.body.classList.add('widget-open');
      if (panel === devicePanel) loadDeviceData();
    }

    function close() {
      if (active) {
        active.classList.remove('open');
        active.setAttribute('aria-hidden', 'true');
        active = null;
      }
      if (overlay) overlay.classList.remove('open');
      document.body.classList.remove('widget-open');
    }

    if (deviceBtn) {
      deviceBtn.addEventListener('click', function () {
        if (devicePanel.classList.contains('open')) close(); else openPanel(devicePanel);
      });
    }
    if (calcBtn) {
      calcBtn.addEventListener('click', function () {
        if (calcPanel.classList.contains('open')) close(); else openPanel(calcPanel);
      });
    }

    if (overlay) overlay.addEventListener('click', close);
    $$('[data-close-widget]').forEach(function (el) { el.addEventListener('click', close); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && active) close();
    });

    /* --- Datos del dispositivo --- */
    const dIP = $('#dIP'), dISP = $('#dISP'), dCity = $('#dCity'), dCountry = $('#dCountry');
    const dOS = $('#dOS'), dBrowser = $('#dBrowser'), dTime = $('#dTime');
    const deviceRefresh = $('#deviceRefresh');
    const deviceController = new AbortController();

    function detectOS() {
      const ua = navigator.userAgent;
      if (/Windows NT 10/.test(ua)) return 'Windows 10/11';
      if (/Windows NT/.test(ua)) return 'Windows';
      if (/Mac OS X/.test(ua)) return 'macOS';
      if (/Android/.test(ua)) return 'Android';
      if (/iPhone|iPad|iPod/.test(ua)) return 'iOS';
      if (/Linux/.test(ua)) return 'Linux';
      return 'Desconocido';
    }
    function detectBrowser() {
      const ua = navigator.userAgent;
      if (/Edg\//.test(ua)) return 'Edge';
      if (/OPR\/|Opera/.test(ua)) return 'Opera';
      if (/Chrome\//.test(ua) && !/Edg|OPR/.test(ua)) return 'Chrome';
      if (/Safari\//.test(ua) && !/Chrome/.test(ua)) return 'Safari';
      if (/Firefox\//.test(ua)) return 'Firefox';
      return 'Desconocido';
    }
    function updateTime() {
      if (!dTime) return;
      const n = new Date();
      dTime.textContent = String(n.getHours()).padStart(2, '0') + ':' + String(n.getMinutes()).padStart(2, '0');
    }
    function loadDeviceData() {
      if (dOS) dOS.textContent = detectOS();
      if (dBrowser) dBrowser.textContent = detectBrowser();
      updateTime();
      [dIP, dISP, dCity, dCountry].forEach(function (el) { if (el) el.textContent = 'Cargando…'; });

      fetch(CONFIG.ipApiUrl, { signal: deviceController.signal })
        .then(function (r) { return r.json(); })
        .then(function (data) {
          if (dIP) dIP.textContent = data.ip || '—';
          if (dISP) dISP.textContent = data.org || '—';
          if (dCity) dCity.textContent = data.city || '—';
          if (dCountry) dCountry.textContent = data.country_name || '—';
        })
        .catch(function (err) {
          if (err.name === 'AbortError') return;
          [dIP, dISP, dCity, dCountry].forEach(function (el) { if (el) el.textContent = 'No disponible'; });
        });
    }
    if (deviceRefresh) deviceRefresh.addEventListener('click', loadDeviceData);
    setInterval(function () {
      if (devicePanel && devicePanel.classList.contains('open')) updateTime();
    }, 60000);

    /* --- Calculadora --- */
    const calcDisplay = $('#calcDisplay');
    const calcHistory = $('#calcHistory');
    const calcButtons = $$('.calc-btn');
    let current = '0', previous = null, operator = null, waiting = false;

    function updateDisplay() {
      if (!calcDisplay) return;
      let v = current;
      if (v.length > 12) {
        const n = parseFloat(v);
        if (!isNaN(n)) v = n.toExponential(6);
      }
      calcDisplay.textContent = v;
      if (calcHistory) {
        calcHistory.textContent = (previous !== null && operator !== null) ? previous + ' ' + operator : '';
      }
    }
    function inputDigit(d) {
      if (waiting) { current = d; waiting = false; }
      else { current = current === '0' ? d : current + d; }
    }
    function inputDecimal() {
      if (waiting) { current = '0.'; waiting = false; return; }
      if (current.indexOf('.') === -1) current += '.';
    }
    function clearAll() { current = '0'; previous = null; operator = null; waiting = false; }
    function toggleSign() {
      if (current === '0') return;
      current = current.charAt(0) === '-' ? current.slice(1) : '-' + current;
    }
    function applyPercent() {
      const v = parseFloat(current);
      if (!isNaN(v)) current = String(v / 100);
    }
    function perform() {
      const v = parseFloat(current);
      if (isNaN(v)) return null;
      if (previous === null) return v;
      let r = previous;
      switch (operator) {
        case '+': r += v; break;
        case '-': r -= v; break;
        case '*': r *= v; break;
        case '/': if (v === 0) return 'Error'; r /= v; break;
      }
      return Math.round(r * 1e10) / 1e10;
    }
    function handleOperator(op) {
      const v = parseFloat(current);
      if (operator && !waiting) {
        const r = perform();
        if (r === 'Error') {
          current = 'Error'; previous = null; operator = null; waiting = true;
          updateDisplay(); return;
        }
        current = String(r);
        previous = r;
      } else {
        previous = v;
      }
      operator = op;
      waiting = true;
      updateDisplay();
    }
    function handleEquals() {
      if (operator === null) return;
      const r = perform();
      if (r === 'Error') {
        current = 'Error'; previous = null; operator = null; waiting = true;
        updateDisplay(); return;
      }
      current = String(r);
      previous = null; operator = null; waiting = true;
      updateDisplay();
    }

    // Delegación en lugar de un listener por botón
    const calcGrid = calcPanel ? calcPanel.querySelector('.calc-grid') : null;
    if (calcGrid) {
      calcGrid.addEventListener('click', function (e) {
        const btn = e.target.closest('.calc-btn');
        if (!btn) return;
        const a = btn.dataset.calc;
        if (current === 'Error' && a !== 'clear') clearAll();
        if (/^[0-9]$/.test(a)) {
          inputDigit(a);
        } else {
          switch (a) {
            case '.': inputDecimal(); break;
            case 'clear': clearAll(); break;
            case 'sign': toggleSign(); break;
            case 'percent': applyPercent(); break;
            case '+': case '-': case '*': case '/': handleOperator(a); return;
            case '=': handleEquals(); return;
          }
        }
        updateDisplay();
      });
    }

    document.addEventListener('keydown', function (e) {
      if (!calcPanel || !calcPanel.classList.contains('open')) return;
      const k = e.key;
      if (/^[0-9]$/.test(k)) {
        if (current === 'Error') clearAll();
        inputDigit(k); updateDisplay();
      } else if (k === '.' || k === ',') {
        if (current === 'Error') clearAll();
        inputDecimal(); updateDisplay();
      } else if (k === '+' || k === '-' || k === '*' || k === '/') {
        if (current === 'Error') clearAll();
        handleOperator(k);
      } else if (k === 'Enter' || k === '=') {
        e.preventDefault(); handleEquals();
      } else if (k === 'Escape' || k === 'c' || k === 'C') {
        clearAll(); updateDisplay();
      } else if (k === 'Backspace') {
        if (current === 'Error') clearAll();
        else if (current.length <= 1 || (current.length === 2 && current.charAt(0) === '-')) current = '0';
        else current = current.slice(0, -1);
        updateDisplay();
      }
    });

    updateDisplay();
  })();

  /* ============================================
     16. PANEL WHATSAPP
     ============================================ */
  (function initWhatsAppPanel() {
    const trigger = $('#whatsappFloatBtn');
    const panel = $('#waModal');
    const form = $('#waForm');
    const overlay = $('#widgetOverlay');
    if (!trigger || !panel || !form) return;

    const devicePanel = $('#devicePanel');
    const calcPanel = $('#calcPanel');

    function closeAll() {
      [devicePanel, calcPanel, panel].forEach(function (p) {
        if (p) {
          p.classList.remove('open');
          p.setAttribute('aria-hidden', 'true');
        }
      });
      if (overlay) overlay.classList.remove('open');
      document.body.classList.remove('widget-open');
    }

    function openPanel() {
      closeAll();
      panel.classList.add('open');
      panel.setAttribute('aria-hidden', 'false');
      if (overlay) overlay.classList.add('open');
      document.body.classList.add('widget-open');
      const first = form.querySelector('input');
      if (first) setTimeout(function () { first.focus(); }, 300);
    }

    trigger.addEventListener('click', function () {
      if (panel.classList.contains('open')) closeAll(); else openPanel();
    });

    panel.addEventListener('click', function (e) {
      if (e.target.closest('[data-close-wa]')) closeAll();
    });

    if (overlay) overlay.addEventListener('click', closeAll);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && panel.classList.contains('open')) closeAll();
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      const name = ($('#wa-name').value || '').trim();
      const address = ($('#wa-address').value || '').trim();
      const contact = ($('#wa-contact').value || '').trim();
      const service = ($('#wa-service').value || '').trim();
      const detail = ($('#wa-detail').value || '').trim();

      if (!name || !address || !contact || !service) {
        form.querySelectorAll('[required]').forEach(function (input) {
          if (!input.value.trim()) {
            input.style.borderColor = '#dc3545';
            input.style.boxShadow = '0 0 0 3px rgba(220,53,69,0.15)';
          } else {
            input.style.borderColor = '';
            input.style.boxShadow = '';
          }
        });
        return;
      }

      let msg = '🔧 Nueva solicitud de servicio\n\n';
      msg += '👤 Nombre: ' + name + '\n';
      msg += '📍 Dirección: ' + address + '\n';
      msg += '📞 Contacto: ' + contact + '\n';
      msg += '🛠️ Servicio: ' + service + '\n';
      if (detail) msg += '📝 Detalle: ' + detail + '\n';
      msg += '\n---\nEnviado desde servitecbaq.com';

      const url = 'https://api.whatsapp.com/send?phone=' + CONFIG.whatsappNumber +
                  '&text=' + encodeURIComponent(msg);

      const win = window.open(url, '_blank', 'noopener,noreferrer');
      if (!win) window.location.href = url;

      setTimeout(function () {
        closeAll();
        form.reset();
      }, 500);
    });

    // Limpiar borde de error al escribir
    form.addEventListener('input', function (e) {
      if (e.target.matches('input, select, textarea')) {
        e.target.style.borderColor = '';
        e.target.style.boxShadow = '';
      }
    });
  })();

  /* ============================================
     17. MATRIX RAIN — Solo dark + panel abierto
     ============================================ */
  (function initMatrixPanel() {
    const panel = $('#devicePanel');
    const canvas = $('#matrixPanelRain');
    if (!panel || !canvas) return;
    if (prefersReducedMotion) return;
    if (document.documentElement.classList.contains('low-power')) return;
    if (isTablet) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const chars = 'アカサタナハマヤラワ0123456789ABCDEF<>{}[]/*-+=;:·'.split('');
    const fontSize = CONFIG.matrix.fontSize;
    let columns = 0;
    let drops = [];
    let rafId = null;
    let running = false;
    let lastTime = 0;
    const interval = CONFIG.matrix.frameIntervalMs;

    function resize() {
      const rect = panel.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, CONFIG.matrix.maxDpr);
      canvas.width = Math.max(1, Math.round(rect.width * dpr));
      canvas.height = Math.max(1, Math.round(rect.height * dpr));
      canvas.style.width = rect.width + 'px';
      canvas.style.height = rect.height + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      columns = Math.max(1, Math.floor(rect.width / fontSize));
      drops = new Array(columns).fill(1).map(function () { return Math.random() * -80; });
    }

    function drawFrame() {
      if (!running) return;
      const now = performance.now();
      if (now - lastTime < interval) {
        rafId = requestAnimationFrame(drawFrame);
        return;
      }
      lastTime = now;

      const dpr = Math.min(window.devicePixelRatio || 1, CONFIG.matrix.maxDpr);
      const w = canvas.width / dpr;
      const h = canvas.height / dpr;

      ctx.fillStyle = 'rgba(0,0,0,0.12)';
      ctx.fillRect(0, 0, w, h);
      ctx.font = fontSize + 'px "JetBrains Mono", monospace';
      ctx.textBaseline = 'top';
      ctx.fillStyle = '#00FF41';

      for (let i = 0; i < columns; i++) {
        const c = chars[Math.floor(Math.random() * chars.length)];
        const x = i * fontSize;
        const y = drops[i] * fontSize;
        ctx.fillText(c, x, y);
        if (y > h && Math.random() > 0.96) drops[i] = 0;
        drops[i]++;
      }
      rafId = requestAnimationFrame(drawFrame);
    }

    function start() {
      if (running) return;
      running = true;
      resize();
      rafId = requestAnimationFrame(drawFrame);
    }
    function stop() {
      running = false;
      if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
      const dpr = Math.min(window.devicePixelRatio || 1, CONFIG.matrix.maxDpr);
      ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
    }
    function isDark() {
      return document.documentElement.getAttribute('data-theme') === 'dark';
    }
    function sync() {
      if (isDark() && panel.classList.contains('open')) start(); else stop();
    }

    new MutationObserver(sync).observe(panel, { attributes: true, attributeFilter: ['class'] });
    new MutationObserver(sync).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    window.addEventListener('resize', debounce(function () { if (running) resize(); }, 200), { passive: true });

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) {
        if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
      } else if (running) {
        rafId = requestAnimationFrame(drawFrame);
      }
    });

    panel.addEventListener('mouseenter', function () {
      if (isDark()) document.body.classList.add('cursor-device');
    });
    panel.addEventListener('mouseleave', function () {
      document.body.classList.remove('cursor-device');
    });

    sync();
  })();

});