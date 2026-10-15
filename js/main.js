document.addEventListener('DOMContentLoaded', function () {

  const isMobile = window.matchMedia('(max-width: 640px)').matches;
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ============================================
     DETECCIÓN DE CAPACIDAD DEL DISPOSITIVO
     ============================================ */
  (function detectLowPowerDevice() {
    if (prefersReducedMotion) {
      document.documentElement.classList.add('low-power');
      return;
    }
    if (!isMobile) return;
    const cores = navigator.hardwareConcurrency || 8;
    const memory = navigator.deviceMemory || 4;
    if (cores <= 4 || memory < 4) {
      document.documentElement.classList.add('low-power');
    }
  })();

  /* ============================================
     1. MENÚ MÓVIL
     ============================================ */
  const toggle = document.getElementById('navToggle');
  const nav = document.getElementById('nav');

  function closeNav() {
    if (!nav || !toggle) return;
    nav.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.textContent = '☰';
    toggle.setAttribute('aria-label', 'Abrir menú');
    document.body.classList.remove('nav-open');
  }

  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      const isOpen = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', isOpen);
      document.body.classList.toggle('nav-open', isOpen);
      toggle.textContent = isOpen ? '✕' : '☰';
      toggle.setAttribute('aria-label', isOpen ? 'Cerrar menú' : 'Abrir menú');
    });

    nav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', closeNav);
    });

    document.addEventListener('click', function (e) {
      if (!nav.classList.contains('open')) return;
      if (nav.contains(e.target) || toggle.contains(e.target)) return;
      closeNav();
    });
  }

  /* ============================================
     2. SCROLL SUAVE
     ============================================ */
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#' || targetId === '') return;
      const target = document.querySelector(targetId);
      if (target) {
        e.preventDefault();
        const header = document.querySelector('.header');
        const offset = header ? header.offsetHeight + 20 : 0;
        const top = target.getBoundingClientRect().top + window.pageYOffset - offset;
        window.scrollTo({ top: top, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
      }
    });
  });

  /* ============================================
     3. HEADER CON SOMBRA AL SCROLL
     ============================================ */
  const header = document.getElementById('siteHeader') || document.querySelector('.header');
  if (header) {
    let ticking = false;
    window.addEventListener('scroll', function () {
      if (!ticking) {
        window.requestAnimationFrame(function () {
          header.classList.toggle('scrolled', window.scrollY > 20);
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  }

  /* ============================================
     4. REVEAL ON SCROLL
     ============================================ */
  const revealTargets = [
    '.service-card', '.svc', '.about-feature', '.contact-card', '.faq-item',
    '.bento', '.stat-block', '.kpi', '.zone-chip', '.founder-split__stats',
    '.feature', '.app-card'
  ];
  revealTargets.forEach(function (selector) {
    document.querySelectorAll(selector).forEach(function (el, i) {
      if (el.closest('.hero__bento')) return;
      if (el.classList.contains('reveal')) return;
      el.classList.add('reveal');
      if (i < 8) el.classList.add('reveal-delay-' + ((i % 8) + 1));
    });
  });
  document.querySelectorAll('.section-title, .section-subtitle, .section-lead, .section-kicker').forEach(function (el) {
    if (!el.classList.contains('reveal')) el.classList.add('reveal');
  });
  const founderCard = document.querySelector('.founder-card, .founder-split');
  if (founderCard && !founderCard.classList.contains('reveal')) founderCard.classList.add('reveal');

  if ('IntersectionObserver' in window && !prefersReducedMotion) {
    const revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });

    document.querySelectorAll('.reveal').forEach(function (el) {
      revealObserver.observe(el);
    });
  } else {
    document.querySelectorAll('.reveal').forEach(function (el) {
      el.classList.add('visible');
    });
  }

  /* ============================================
     5. TOGGLE DE TEMA
     ============================================ */
  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', function () {
      const current = document.documentElement.getAttribute('data-theme');
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      try { localStorage.setItem('theme', next); } catch (e) {}
    });
  }

  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  mediaQuery.addEventListener('change', function (e) {
    let savedTheme = null;
    try { savedTheme = localStorage.getItem('theme'); } catch (err) {}
    if (!savedTheme) {
      document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
    }
  });

  /* ============================================
     6. MODAL DE SERVICIOS
     ============================================ */
  const servicesData = {
    mantenimiento: {
      icon: '⚡',
      title: 'Mantenimiento y reparación',
      description: 'Prolongamos la vida útil de tus equipos y solucionamos fallas de hardware y software, tanto en computadores de escritorio como portátiles.',
      items: [
        'Limpieza interna de polvo y ventiladores',
        'Cambio de pasta térmica',
        'Optimización del sistema operativo',
        'Diagnóstico completo del equipo',
        'Cambio de piezas (disco, RAM, batería, teclado)',
        'Reinstalación de sistema operativo',
        'Eliminación de virus y malware',
        'Recuperación de datos cuando sea posible'
      ]
    },
    redes: {
      icon: '🌐',
      title: 'Redes e Internet',
      description: 'Configuramos y solucionamos problemas de conectividad en hogares, oficinas y pequeñas empresas.',
      items: [
        'Configuración de routers y módems',
        'Instalación de redes Wi-Fi y cableadas',
        'Ampliación de cobertura con repetidores o mesh',
        'Segmentación con VLAN para invitados o CCTV',
        'Reservas DHCP y direccionamiento IP estable',
        'Solución de cortes o lentitud de internet',
        'Configuración de red para pequeñas oficinas'
      ]
    },
    impresoras: {
      icon: '🖨️',
      title: 'Impresoras',
      description: 'Instalamos, configuramos y reparamos impresoras de todas las marcas, en hogares y oficinas.',
      items: [
        'Instalación en Windows y Mac',
        'Configuración en red o Wi-Fi',
        'Solución de atascos y errores',
        'Cambio de cartuchos y tóner',
        'Impresión desde celular o tablet',
        'Configuración de impresora compartida en red'
      ]
    },
    instalacion: {
      icon: '🧩',
      title: 'Instalación, configuración y soporte de aplicativos',
      description: 'Dejamos tus equipos listos para trabajar, estudiar o disfrutar, y te ayudamos con los programas que usas a diario.',
      items: [
        'Instalación de computadores nuevos',
        'Configuración inicial de Windows, macOS o Linux',
        'Instalación de programas esenciales',
        'Configuración de cuentas y correo',
        'Instalación y configuración de programas',
        'Solución de errores en Office, sistemas contables y navegadores',
        'Configuración de correo y aplicaciones corporativas',
        'Actualización o reinstalación de aplicaciones'
      ]
    },
    seguridad: {
      icon: '🔒',
      title: 'Seguridad, respaldo y administración de usuarios',
      description: 'Protegemos tu información, configuramos copias de seguridad y gestionamos cuentas, permisos y accesos.',
      items: [
        'Instalación de antivirus y firewall',
        'Configuración de copias de seguridad automáticas',
        'Respaldo en la nube o discos externos',
        'Protección contra ransomware',
        'Asesoría en contraseñas seguras',
        'Altas, bajas y modificaciones de usuarios',
        'Grupos, roles y permisos por área',
        'Políticas de contraseñas y expiración',
        'Integración con Active Directory y Microsoft 365',
        'Configuración de MFA y auditoría de accesos'
      ]
    },
    camaras: {
      icon: '📹',
      title: 'Videovigilancia (CCTV)',
      description: 'Instalamos, configuramos y administramos sistemas de cámaras de seguridad para hogares y negocios.',
      items: [
        'Instalación de cámaras IP y análogas (interior/exterior)',
        'Configuración de DVR/NVR y almacenamiento',
        'Acceso remoto desde celular (app o navegador)',
        'Grabación por movimiento y horarios',
        'Integración con la red existente y VLAN de CCTV',
        'Mantenimiento, limpieza y revisión de cableado',
        'Configuración de respaldo de video'
      ]
    },
    desarrollo: {
      icon: '👨‍💻',
      title: 'Desarrollo de software',
      description: 'Creamos soluciones a la medida para automatizar procesos y mejorar la operación de tu negocio.',
      items: [
        'Páginas web y landing pages',
        'Automatización de tareas repetitivas',
        'Scripts en PowerShell y Python',
        'Integración de sistemas y APIs',
        'Bases de datos SQL y reportes personalizados',
        'Aplicaciones web a la medida'
      ]
    },
    empresariales: {
      icon: '☁️',
      title: 'Soluciones empresariales',
      description: 'Infraestructura, servidores y servicios en la nube para pequeñas y medianas empresas.',
      items: [
        'Administración de servidores Windows y Linux',
        'Virtualización con VMware',
        'Microsoft 365 y Azure',
        'Active Directory y políticas de grupo (GPO)',
        'Respaldos empresariales y plan de recuperación',
        'Automatización con PowerShell',
        'Monitoreo de red y servidores',
        'Asesoría en seguridad informática'
      ]
    }
  };

  const modal = document.getElementById('serviceModal');
  const modalIcon = document.getElementById('modalIcon');
  const modalTitle = document.getElementById('modalTitle');
  const modalDesc = document.getElementById('modalDesc');
  const modalList = document.getElementById('modalList');
  const modalCloseBtn = document.getElementById('modalClose');
  const modalCta = modal ? modal.querySelector('.modal-cta') : null;

  function openModal(key) {
    const data = servicesData[key];
    if (!data || !modal) return;
    modalIcon.textContent = data.icon;
    modalTitle.textContent = data.title;
    modalDesc.textContent = data.description;
    modalList.innerHTML = '';
    data.items.forEach(function (item) {
      const li = document.createElement('li');
      li.textContent = item;
      modalList.appendChild(li);
    });
    if (modalCta) {
      const msg = encodeURIComponent('Hola Servitecbaq, necesito información sobre: ' + data.title);
      modalCta.href = 'https://wa.me/573158505020?text=' + msg;
    }
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
  }

  function closeModal() {
    if (!modal) return;
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
  }

  // ⚡ FIX: acepta tanto .service-card como .svc[data-service]
  document.querySelectorAll('.service-card, .svc[data-service]').forEach(function (card) {
    const key = card.getAttribute('data-service');
    if (!key) return;
    card.addEventListener('click', function () { openModal(key); });
    card.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openModal(key);
      }
    });
  });

  if (modal) {
    if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeModal);
    modal.querySelectorAll('[data-close-modal]').forEach(function (el) {
      el.addEventListener('click', closeModal);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && modal.classList.contains('open')) closeModal();
    });
  }

  /* ============================================
     7. TIPS
     ============================================ */
  const tipTrack = document.getElementById('tipTrack');
  const tipDots = document.getElementById('tipDots');
  const tipPrev = document.getElementById('tipPrev');
  const tipNext = document.getElementById('tipNext');
  const tipsGrid = document.getElementById('tipsGrid');
  const tipsExpandBtn = document.getElementById('tipsExpandBtn');
  const tipsGridWrapper = document.getElementById('tipsGridWrapper');
  const tipsExpandText = tipsExpandBtn ? tipsExpandBtn.querySelector('.tips-expand-text') : null;

  let currentTip = 0;
  let tipsData = [];
  let autoplayTimer = null;
  const SHOULD_AUTOPLAY = !isMobile && !prefersReducedMotion;
  const AUTOPLAY_INTERVAL = 8000;

  function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  if (tipTrack && tipDots) {
    fetch('tips.json')
      .then(function (r) { if (!r.ok) throw new Error('tips.json'); return r.json(); })
      .then(function (data) {
        if (!Array.isArray(data) || data.length === 0) return;
        tipsData = shuffleArray(data);

        const card = document.createElement('article');
        card.className = 'tip-card';
        tipTrack.appendChild(card);

        function paintTip(tip, animate) {
          const html =
            '<span class="tip-category">' + tip.category + '</span>' +
            '<div class="tip-icon">' + tip.icon + '</div>' +
            '<h3 class="tip-title">' + tip.title + '</h3>' +
            '<p class="tip-desc">' + tip.desc + '</p>' +
            '<span class="tip-benefit">✨ ' + tip.benefit + '</span>';

          if (!animate || !SHOULD_AUTOPLAY || prefersReducedMotion) {
            card.innerHTML = html;
            return;
          }
          card.classList.add('switching');
          setTimeout(function () {
            card.innerHTML = html;
            card.classList.remove('switching');
          }, 180);
        }

        paintTip(tipsData[0], false);

        tipsData.forEach(function (tip, i) {
          const dot = document.createElement('button');
          dot.className = 'tip-dot' + (i === 0 ? ' active' : '');
          dot.setAttribute('aria-label', 'Ir al tip ' + (i + 1));
          dot.addEventListener('click', function () { goToTip(i); });
          tipDots.appendChild(dot);
        });

        if (tipsGrid) {
          const frag = document.createDocumentFragment();
          tipsData.forEach(function (tip) {
            const mini = document.createElement('article');
            mini.className = 'tip-mini';
            mini.innerHTML =
              '<span class="tip-mini-icon">' + tip.icon + '</span>' +
              '<h4>' + tip.title + '</h4>' +
              '<p>' + tip.desc + '</p>';
            frag.appendChild(mini);
          });
          tipsGrid.appendChild(frag);
        }

        const dots = tipDots.querySelectorAll('.tip-dot');

        function goToTip(index) {
          if (index === currentTip || !tipsData.length) return;
          dots[currentTip].classList.remove('active');
          currentTip = (index + tipsData.length) % tipsData.length;
          dots[currentTip].classList.add('active');
          paintTip(tipsData[currentTip], true);
          restartAutoplay();
        }
        function nextTip() { goToTip(currentTip + 1); }
        function prevTip() { goToTip(currentTip - 1); }

        function startAutoplay() {
          if (autoplayTimer || !SHOULD_AUTOPLAY) return;
          autoplayTimer = setInterval(nextTip, AUTOPLAY_INTERVAL);
        }
        function stopAutoplay() {
          if (autoplayTimer) { clearInterval(autoplayTimer); autoplayTimer = null; }
        }
        function restartAutoplay() { stopAutoplay(); startAutoplay(); }

        if (tipNext) tipNext.addEventListener('click', nextTip);
        if (tipPrev) tipPrev.addEventListener('click', prevTip);

        const carousel = document.getElementById('tipCarousel');
        if (carousel) {
          carousel.addEventListener('mouseenter', stopAutoplay);
          carousel.addEventListener('mouseleave', startAutoplay);
        }

        document.addEventListener('keydown', function (e) {
          if (!carousel) return;
          const rect = carousel.getBoundingClientRect();
          const inView = rect.top < window.innerHeight && rect.bottom > 0;
          if (!inView) return;
          if (e.key === 'ArrowRight') nextTip();
          if (e.key === 'ArrowLeft') prevTip();
        });

        if (tipsExpandBtn && tipsGridWrapper) {
          tipsExpandBtn.addEventListener('click', function () {
            const isOpen = tipsGridWrapper.classList.toggle('open');
            tipsExpandBtn.setAttribute('aria-expanded', isOpen);
            if (tipsExpandText) tipsExpandText.textContent = isOpen ? 'Ocultar tips' : 'Ver todos los tips';
          });
        }

        if ('IntersectionObserver' in window && carousel && SHOULD_AUTOPLAY) {
          const playObserver = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
              if (entry.isIntersecting) startAutoplay(); else stopAutoplay();
            });
          }, { threshold: 0.1 });
          playObserver.observe(carousel);
        }
      })
      .catch(function (error) {
        console.error('Error tips:', error);
        if (tipTrack) tipTrack.innerHTML = '<p style="text-align:center;color:var(--fg-muted);padding:40px 20px;">No se pudieron cargar los tips.</p>';
      });
  }

  /* ============================================
     8. APLICATIVOS
     ============================================ */
  const appsGrid = document.getElementById('appsGrid');
  const appsFilters = document.getElementById('appsFilters');
  const appsSearch = document.getElementById('appsSearch');
  const appsEmpty = document.getElementById('appsEmpty');

  if (appsGrid && appsFilters) {
    let allApps = [];
    let activeCategory = 'all';
    let searchTerm = '';

    fetch('apps.json')
      .then(function (r) { if (!r.ok) throw new Error('apps.json'); return r.json(); })
      .then(function (data) {
        if (!Array.isArray(data) || data.length === 0) return;
        allApps = data;

        const categories = ['all'];
        data.forEach(function (app) {
          if (!categories.includes(app.category)) categories.push(app.category);
        });

        const frag = document.createDocumentFragment();
        categories.forEach(function (cat) {
          const btn = document.createElement('button');
          btn.className = 'apps-filter' + (cat === 'all' ? ' active' : '');
          btn.dataset.category = cat;
          btn.textContent = cat === 'all' ? 'Todos' : cat;
          btn.addEventListener('click', function () {
            appsFilters.querySelectorAll('.apps-filter').forEach(function (b) { b.classList.remove('active'); });
            btn.classList.add('active');
            activeCategory = cat;
            renderApps();
          });
          frag.appendChild(btn);
        });
        appsFilters.innerHTML = '';
        appsFilters.appendChild(frag);

        renderApps();
      })
      .catch(function (error) {
        console.error('Error apps:', error);
        if (appsGrid) appsGrid.innerHTML = '<p class="apps-empty">No se pudieron cargar los aplicativos.</p>';
      });

    function renderApps() {
      if (!appsGrid) return;

      const term = searchTerm.toLowerCase().trim();
      const filtered = allApps.filter(function (app) {
        const cat = activeCategory === 'all' || app.category === activeCategory;
        const s = !term ||
          app.name.toLowerCase().includes(term) ||
          app.desc.toLowerCase().includes(term) ||
          app.category.toLowerCase().includes(term);
        return cat && s;
      });

      appsGrid.innerHTML = '';

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
        card.rel = 'noopener';

        const badgesHTML = (app.badges || []).map(function (b) {
          const isFree = b.toLowerCase() === 'gratis' || b.toLowerCase() === 'free';
          return '<span class="app-badge' + (isFree ? ' free' : '') + '">' + b + '</span>';
        }).join('');

        card.innerHTML =
          '<div class="app-logo">' + app.icon + '</div>' +
          '<h3 class="app-name">' + app.name + '</h3>' +
          '<p class="app-desc">' + app.desc + '</p>' +
          '<div class="app-meta">' + badgesHTML + '</div>' +
          '<span class="app-link">Sitio oficial →</span>';

        frag.appendChild(card);
      });
      appsGrid.appendChild(frag);
    }

    if (appsSearch) {
      let debounceTimer;
      appsSearch.addEventListener('input', function (e) {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(function () {
          searchTerm = e.target.value;
          renderApps();
        }, 200);
      });
    }
  }

  /* ============================================
     9. FAQ
     ============================================ */
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(function (item) {
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

    /* ============================================
     10. LAZY LOAD: GR WIDGET (OPTIMIZADO)
     - Carga solo cuando el usuario se acerca 200px
     - Con timeout de respaldo por si el observer no dispara
     ============================================ */
  const reviewsSection = document.getElementById('resenas');
  let grWidgetLoaded = false;

  function loadGrWidget() {
    if (grWidgetLoaded || !reviewsSection) return;
    grWidgetLoaded = true;
    const script = document.createElement('script');
    script.src = 'https://grwidget.com/v1/grwidget.js';
    script.async = true;
    script.defer = true;
    script.crossOrigin = 'anonymous';
    document.body.appendChild(script);
  }

  if (reviewsSection) {
    if ('IntersectionObserver' in window) {
      const grObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            loadGrWidget();
            grObserver.disconnect();
          }
        });
      }, { rootMargin: '200px 0px' });
      grObserver.observe(reviewsSection);
    } else {
      // Fallback: cargar tras 4s si no hay IO
      setTimeout(loadGrWidget, 4000);
    }
  }

  /* ============================================
     11. FORMULARIO DE CONTACTO (Web3Forms)
     ============================================ */
  const contactForm = document.getElementById('contactForm');
  const formStatus = document.getElementById('formStatus');
  const formSubmit = document.getElementById('formSubmit');

  if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();

      formSubmit.disabled = true;
      formSubmit.textContent = '⏳ Enviando…';
      if (formStatus) {
        formStatus.hidden = true;
        formStatus.className = 'form-status';
        formStatus.textContent = '';
      }

      const formData = new FormData(contactForm);

      fetch(contactForm.action, {
        method: 'POST',
        body: formData,
        headers: { 'Accept': 'application/json' }
      })
        .then(function (response) { return response.json(); })
        .then(function (data) {
          if (data.success) {
            if (formStatus) {
              formStatus.hidden = false;
              formStatus.className = 'form-status success';
              formStatus.textContent = '¡Gracias! Hemos recibido tu mensaje. Te responderemos lo antes posible.';
            }
            contactForm.reset();
            formSubmit.disabled = false;
            formSubmit.textContent = '✉️ Enviar mensaje';
            setTimeout(function () {
              if (formStatus) formStatus.hidden = true;
            }, 8000);
          } else {
            throw new Error(data.message || 'Error al enviar');
          }
        })
        .catch(function (error) {
          console.error('Error formulario:', error);
          if (formStatus) {
            formStatus.hidden = false;
            formStatus.className = 'form-status error';
            formStatus.textContent = 'Hubo un problema al enviar. Intenta de nuevo o escríbenos por WhatsApp al +57 315 850 5020.';
          }
          formSubmit.disabled = false;
          formSubmit.textContent = '✉️ Enviar mensaje';
        });
    });
  }

  /* ============================================
     12. BOTÓN FLOTANTE DE JIRA
     ============================================ */
  const jiraFloatBtn = document.getElementById('jiraFloatBtn');
  if (jiraFloatBtn) {
    jiraFloatBtn.addEventListener('click', function () {
      window.open(
        'https://servitecbaq.atlassian.net/servicedesk/customer/portal/3',
        '_blank',
        'noopener,noreferrer'
      );
    });
  }

  /*  /* ============================================
     13. RADAR CANVAS EN HERO (OPTIMIZADO)
     - Deshabilitado en mobile
     - Reducido en desktop
     - Pausado al no estar visible
     ============================================ */
  (function initHeroRadar() {
    const canvas = document.getElementById('heroRadar');
    if (!canvas) return;
    if (prefersReducedMotion) return;
    if (document.documentElement.classList.contains('low-power')) return;

    // ⚡ DESHABILITADO EN MOBILE — la causa #1 del score bajo
    if (window.matchMedia('(max-width: 900px)').matches) {
      canvas.style.display = 'none';
      return;
    }

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let W, H, dpr;
    let t = 0;
    const particles = [];
    let isVisible = true;
    let rafId = null;
    const mouse = { x: -9999, y: -9999, radius: 140 };

    // Colores cacheados por tema (evitar getComputedStyle en cada frame)
    let cachedColors = null;
    let cachedTheme = null;
    const themeObserver = new MutationObserver(function () {
      cachedColors = null; // invalidar cache
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme']
    });

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
      dpr = Math.min(window.devicePixelRatio || 1, 1.5); // ⚡ tope a 1.5 en lugar de 2
      const rect = canvas.getBoundingClientRect();
      W = rect.width;
      H = rect.height;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // ⚡ menos partículas: entre 20 y 40
      const targetCount = Math.max(20, Math.min(40, Math.floor((W * H) / 22000)));
      particles.length = 0;
      for (let i = 0; i < targetCount; i++) {
        particles.push({
          x: Math.random() * W,
          y: Math.random() * H,
          vx: (Math.random() - 0.5) * 0.22,
          vy: (Math.random() - 0.5) * 0.22,
          baseR: 1 + Math.random() * 1.5,
          phase: Math.random() * Math.PI * 2
        });
      }
    }

    function draw() {
      if (!isVisible) {
        rafId = null;
        return;
      }

      const colors = getColors();
      ctx.clearRect(0, 0, W, H);

      const cx = W / 2;
      const cy = H / 2;
      const maxR = Math.max(W, H) * 0.6;

      ctx.strokeStyle = colors.ring;
      ctx.lineWidth = 1;
      // ⚡ menos anillos: 3 en lugar de 5
      const ringCount = 3;
      for (let i = 1; i <= ringCount; i++) {
        const r = (maxR / ringCount) * i;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();
      }

      // ⚡ sweep solo cada 2 frames
      if (t % 2 === 0) {
        const sweepAngle = (t * 0.012) % (Math.PI * 2);
        if (ctx.createConicGradient) {
          const grad = ctx.createConicGradient(sweepAngle, cx, cy);
          grad.addColorStop(0, colors.sweep);
          grad.addColorStop(0.15, 'rgba(0,0,0,0)');
          grad.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(cx, cy, maxR, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // ⚡ Conexiones: dist reducida a 120, y solo si hay pocas partículas
      const linkDist = 120;
      const linkDistSq = linkDist * linkDist;
      if (particles.length <= 40) {
        for (let i = 0; i < particles.length; i++) {
          const p1 = particles[i];
          for (let j = i + 1; j < particles.length; j++) {
            const p2 = particles[j];
            const dx = p1.x - p2.x;
            const dy = p1.y - p2.y;
            const distSq = dx * dx + dy * dy;
            if (distSq < linkDistSq) {
              const alpha = (1 - Math.sqrt(distSq) / linkDist) * 0.35;
              ctx.strokeStyle = colors.line + alpha + ')';
              ctx.lineWidth = 0.6;
              ctx.beginPath();
              ctx.moveTo(p1.x, p1.y);
              ctx.lineTo(p2.x, p2.y);
              ctx.stroke();
            }
          }
        }
      }

      // ⚡ Partículas SIN shadowBlur (eliminado — el mayor costo de FPS)
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = W;
        if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H;
        if (p.y > H) p.y = 0;

        const dx = mouse.x - p.x;
        const dy = mouse.y - p.y;
        const distM = Math.sqrt(dx * dx + dy * dy);
        if (distM < mouse.radius) {
          const force = (mouse.radius - distM) / mouse.radius;
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

        // Círculo exterior SIN glow (mucho más rápido)
        ctx.fillStyle = colors.dot;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fill();

        // Núcleo blanco
        ctx.fillStyle = colors.dotCore;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r * 0.4, 0, Math.PI * 2);
        ctx.fill();
      }

      t += 1;
      rafId = requestAnimationFrame(draw);
    }

    resize();
    rafId = requestAnimationFrame(draw);

    // ⚡ Resize con debounce
    let resizeTimer;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resize, 200);
    }, { passive: true });

    const heroSection = canvas.parentElement;
    if (heroSection) {
      let mouseRaf = null;
      heroSection.addEventListener('mousemove', function (e) {
        if (mouseRaf) return;
        mouseRaf = requestAnimationFrame(function () {
          const rect = canvas.getBoundingClientRect();
          mouse.x = e.clientX - rect.left;
          mouse.y = e.clientY - rect.top;
          mouseRaf = null;
        });
      }, { passive: true });
      heroSection.addEventListener('mouseleave', function () {
        mouse.x = -9999;
        mouse.y = -9999;
      });
    }

    // ⚡ Pausar cuando sale del viewport
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          isVisible = entry.isIntersecting;
          if (isVisible && !rafId) {
            rafId = requestAnimationFrame(draw);
          }
        });
      }, { threshold: 0, rootMargin: '100px' });
      io.observe(canvas);
    }

    // ⚡ Pausar cuando la pestaña no está visible
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) {
        if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
      } else if (isVisible && !rafId) {
        rafId = requestAnimationFrame(draw);
      }
    });
  })();
  /* ============================================
     14. CURSOR PERSONALIZADO
     ============================================ */
  (function initCustomCursor() {
    const cursorRing = document.getElementById('cursorRing');
    const cursorDot = document.getElementById('cursorDot');
    if (!cursorRing || !cursorDot) return;

    const isTouch = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
    if (isTouch) return;
    if (prefersReducedMotion) return;
    if (document.documentElement.classList.contains('low-power')) return;

    let mouseX = -100, mouseY = -100;
    let ringX = -100, ringY = -100;
    let dotX = -100, dotY = -100;
    let rafId = null;
    let isReady = false;

    const RING_LERP = 0.14;
    const DOT_LERP = 0.55;

    function onMouseMove(e) {
      mouseX = e.clientX;
      mouseY = e.clientY;
      if (!isReady) {
        ringX = dotX = mouseX;
        ringY = dotY = mouseY;
        isReady = true;
        document.body.classList.add('cursor-ready');
      }
    }

    function onMouseLeaveWindow() { document.body.classList.add('cursor-leaving'); }
    function onMouseEnterWindow() { document.body.classList.remove('cursor-leaving'); }
    function onMouseDown() { document.body.classList.add('cursor-down'); }
    function onMouseUp() { document.body.classList.remove('cursor-down'); }

    function animate() {
      ringX += (mouseX - ringX) * RING_LERP;
      ringY += (mouseY - ringY) * RING_LERP;
      dotX  += (mouseX - dotX)  * DOT_LERP;
      dotY  += (mouseY - dotY)  * DOT_LERP;

      cursorRing.style.transform = 'translate(' + ringX + 'px, ' + ringY + 'px) translate(-50%, -50%)';
      cursorDot.style.transform  = 'translate(' + dotX + 'px, ' + dotY + 'px) translate(-50%, -50%)';

      rafId = requestAnimationFrame(animate);
    }

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    document.addEventListener('mouseleave', onMouseLeaveWindow);
    document.addEventListener('mouseenter', onMouseEnterWindow);

    function bindCursor() {
      document.querySelectorAll('[data-cursor="hover"]').forEach(function (el) {
        if (el.dataset.cursorBound === 'hover') return;
        el.dataset.cursorBound = 'hover';
        el.addEventListener('mouseenter', function () { document.body.classList.add('cursor-hover'); });
        el.addEventListener('mouseleave', function () { document.body.classList.remove('cursor-hover'); });
      });
      document.querySelectorAll('[data-cursor="view"]').forEach(function (el) {
        if (el.dataset.cursorBound === 'view') return;
        el.dataset.cursorBound = 'view';
        el.addEventListener('mouseenter', function () { document.body.classList.add('cursor-view'); });
        el.addEventListener('mouseleave', function () { document.body.classList.remove('cursor-view'); });
      });
    }

    bindCursor();
    const themeObserver = new MutationObserver(bindCursor);
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    animate();

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) {
        if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
      } else {
        if (!rafId) animate();
      }
    });
  })();

  /* ============================================
     15. WIDGETS: PANELES
     ============================================ */
  (function initWidgets() {
    const overlay = document.getElementById('widgetOverlay');
    const devicePanel = document.getElementById('devicePanel');
    const calcPanel = document.getElementById('calcPanel');
    const deviceBtn = document.getElementById('deviceFloatBtn');
    const calcBtn = document.getElementById('calcFloatBtn');

    let activePanel = null;

    function openPanel(panel) {
      if (!panel) return;
      if (activePanel && activePanel !== panel) {
        activePanel.classList.remove('open');
        activePanel.setAttribute('aria-hidden', 'true');
      }
      panel.classList.add('open');
      panel.setAttribute('aria-hidden', 'false');
      activePanel = panel;
      if (overlay) overlay.classList.add('open');
      document.body.classList.add('widget-open');
      if (panel === devicePanel) loadDeviceData();
    }

    function closePanels() {
      if (activePanel) {
        activePanel.classList.remove('open');
        activePanel.setAttribute('aria-hidden', 'true');
        activePanel = null;
      }
      if (overlay) overlay.classList.remove('open');
      document.body.classList.remove('widget-open');
    }

    if (deviceBtn) {
      deviceBtn.addEventListener('click', function () {
        if (devicePanel.classList.contains('open')) closePanels();
        else openPanel(devicePanel);
      });
    }
    if (calcBtn) {
      calcBtn.addEventListener('click', function () {
        if (calcPanel.classList.contains('open')) closePanels();
        else openPanel(calcPanel);
      });
    }

    if (overlay) overlay.addEventListener('click', closePanels);
    document.querySelectorAll('[data-close-widget]').forEach(function (el) {
      el.addEventListener('click', closePanels);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && activePanel) closePanels();
    });

    /* Datos del dispositivo */
    const dIP = document.getElementById('dIP');
    const dISP = document.getElementById('dISP');
    const dCity = document.getElementById('dCity');
    const dCountry = document.getElementById('dCountry');
    const dOS = document.getElementById('dOS');
    const dBrowser = document.getElementById('dBrowser');
    const dTime = document.getElementById('dTime');
    const deviceRefresh = document.getElementById('deviceRefresh');

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
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, '0');
      const mm = String(now.getMinutes()).padStart(2, '0');
      dTime.textContent = hh + ':' + mm;
    }
    function loadDeviceData() {
      if (dOS) dOS.textContent = detectOS();
      if (dBrowser) dBrowser.textContent = detectBrowser();
      updateTime();
      if (dIP) dIP.textContent = 'Cargando…';
      if (dISP) dISP.textContent = 'Cargando…';
      if (dCity) dCity.textContent = 'Cargando…';
      if (dCountry) dCountry.textContent = 'Cargando…';
      fetch('https://ipapi.co/json/')
        .then(function (r) { return r.json(); })
        .then(function (data) {
          if (dIP) dIP.textContent = data.ip || '—';
          if (dISP) dISP.textContent = data.org || '—';
          if (dCity) dCity.textContent = data.city || '—';
          if (dCountry) dCountry.textContent = data.country_name || '—';
        })
        .catch(function () {
          if (dIP) dIP.textContent = 'No disponible';
          if (dISP) dISP.textContent = 'No disponible';
          if (dCity) dCity.textContent = 'No disponible';
          if (dCountry) dCountry.textContent = 'No disponible';
        });
    }

    if (deviceRefresh) deviceRefresh.addEventListener('click', loadDeviceData);

    setInterval(function () {
      if (devicePanel && devicePanel.classList.contains('open')) updateTime();
    }, 60000);

    /* Calculadora */
    const calcDisplay = document.getElementById('calcDisplay');
    const calcHistory = document.getElementById('calcHistory');
    const calcButtons = document.querySelectorAll('.calc-btn');

    let currentInput = '0';
    let previousValue = null;
    let currentOperator = null;
    let waitingForOperand = false;

    function updateDisplay() {
      if (!calcDisplay) return;
      let displayValue = currentInput;
      if (displayValue.length > 12) {
        const num = parseFloat(displayValue);
        if (!isNaN(num)) displayValue = num.toExponential(6);
      }
      calcDisplay.textContent = displayValue;
      if (calcHistory) {
        calcHistory.textContent = previousValue !== null && currentOperator !== null
          ? previousValue + ' ' + currentOperator : '';
      }
    }
    function inputDigit(digit) {
      if (waitingForOperand) { currentInput = digit; waitingForOperand = false; }
      else { currentInput = currentInput === '0' ? digit : currentInput + digit; }
    }
    function inputDecimal() {
      if (waitingForOperand) { currentInput = '0.'; waitingForOperand = false; return; }
      if (!currentInput.includes('.')) currentInput += '.';
    }
    function clearAll() {
      currentInput = '0'; previousValue = null; currentOperator = null; waitingForOperand = false;
    }
    function toggleSign() {
      if (currentInput === '0') return;
      currentInput = currentInput.startsWith('-') ? currentInput.slice(1) : '-' + currentInput;
    }
    function applyPercent() {
      const value = parseFloat(currentInput);
      if (isNaN(value)) return;
      currentInput = String(value / 100);
    }
    function performOperation() {
      const inputValue = parseFloat(currentInput);
      if (isNaN(inputValue)) return null;
      if (previousValue === null) return inputValue;
      let result = previousValue;
      switch (currentOperator) {
        case '+': result += inputValue; break;
        case '-': result -= inputValue; break;
        case '*': result *= inputValue; break;
        case '/':
          if (inputValue === 0) return 'Error';
          result /= inputValue;
          break;
      }
      return Math.round(result * 1e10) / 1e10;
    }
    function handleOperator(op) {
      const inputValue = parseFloat(currentInput);
      if (currentOperator && !waitingForOperand) {
        const result = performOperation();
        if (result === 'Error') {
          currentInput = 'Error'; previousValue = null; currentOperator = null; waitingForOperand = true;
          updateDisplay(); return;
        }
        currentInput = String(result);
        previousValue = result;
      } else { previousValue = inputValue; }
      currentOperator = op;
      waitingForOperand = true;
      updateDisplay();
    }
    function handleEquals() {
      if (currentOperator === null) return;
      const result = performOperation();
      if (result === 'Error') {
        currentInput = 'Error'; previousValue = null; currentOperator = null; waitingForOperand = true;
        updateDisplay(); return;
      }
      currentInput = String(result);
      previousValue = null; currentOperator = null; waitingForOperand = true;
      updateDisplay();
    }

    calcButtons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        const action = btn.dataset.calc;
        if (currentInput === 'Error' && action !== 'clear') clearAll();
        if (/^[0-9]$/.test(action)) { inputDigit(action); }
        else {
          switch (action) {
            case '.': inputDecimal(); break;
            case 'clear': clearAll(); break;
            case 'sign': toggleSign(); break;
            case 'percent': applyPercent(); break;
            case '+': case '-': case '*': case '/': handleOperator(action); break;
            case '=': handleEquals(); return;
          }
        }
        updateDisplay();
      });
    });

    document.addEventListener('keydown', function (e) {
      if (!calcPanel || !calcPanel.classList.contains('open')) return;
      const key = e.key;
      if (/^[0-9]$/.test(key)) {
        if (currentInput === 'Error') clearAll();
        inputDigit(key); updateDisplay();
      } else if (key === '.' || key === ',') {
        if (currentInput === 'Error') clearAll();
        inputDecimal(); updateDisplay();
      } else if (key === '+' || key === '-' || key === '*' || key === '/') {
        if (currentInput === 'Error') clearAll();
        handleOperator(key);
      } else if (key === 'Enter' || key === '=') {
        e.preventDefault(); handleEquals();
      } else if (key === 'Escape' || key === 'c' || key === 'C') {
        clearAll(); updateDisplay();
      } else if (key === 'Backspace') {
        if (currentInput === 'Error') { clearAll(); }
        else if (currentInput.length <= 1 || (currentInput.length === 2 && currentInput.startsWith('-'))) {
          currentInput = '0';
        } else { currentInput = currentInput.slice(0, -1); }
        updateDisplay();
      }
    });

    updateDisplay();
  })();

  /* ============================================
     16. PANEL WHATSAPP
     ============================================ */
  (function initWhatsAppPanel() {
    const whatsappBtn = document.getElementById('whatsappFloatBtn');
    const waPanel = document.getElementById('waModal');
    const waForm = document.getElementById('waForm');
    const overlay = document.getElementById('widgetOverlay');
    if (!whatsappBtn || !waPanel || !waForm) return;

    const WHATSAPP_NUMBER = '573158505020';

    let activeWidget = null;
    const devicePanel = document.getElementById('devicePanel');
    const calcPanel = document.getElementById('calcPanel');

    function closeAllWidgets() {
      [devicePanel, calcPanel, waPanel].forEach(function (p) {
        if (p) {
          p.classList.remove('open');
          p.setAttribute('aria-hidden', 'true');
        }
      });
      if (overlay) overlay.classList.remove('open');
      document.body.classList.remove('widget-open');
      activeWidget = null;
    }

    function openWaPanel() {
      closeAllWidgets();
      waPanel.classList.add('open');
      waPanel.setAttribute('aria-hidden', 'false');
      if (overlay) overlay.classList.add('open');
      document.body.classList.add('widget-open');
      activeWidget = waPanel;
      const firstInput = waForm.querySelector('input');
      if (firstInput) setTimeout(function () { firstInput.focus(); }, 300);
    }

    whatsappBtn.addEventListener('click', function () {
      if (waPanel.classList.contains('open')) closeAllWidgets();
      else openWaPanel();
    });

    waPanel.querySelectorAll('[data-close-wa]').forEach(function (el) {
      el.addEventListener('click', closeAllWidgets);
    });
    if (overlay) overlay.addEventListener('click', closeAllWidgets);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && activeWidget) closeAllWidgets();
    });

    waForm.addEventListener('submit', function (e) {
      e.preventDefault();

      const name = (document.getElementById('wa-name').value || '').trim();
      const address = (document.getElementById('wa-address').value || '').trim();
      const contact = (document.getElementById('wa-contact').value || '').trim();
      const service = (document.getElementById('wa-service').value || '').trim();
      const detail = (document.getElementById('wa-detail').value || '').trim();

      if (!name || !address || !contact || !service) {
        waForm.querySelectorAll('[required]').forEach(function (input) {
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

      let message = '🔧 Nueva solicitud de servicio\n\n';
      message += '👤 Nombre: ' + name + '\n';
      message += '📍 Dirección: ' + address + '\n';
      message += '📞 Contacto: ' + contact + '\n';
      message += '🛠️ Servicio: ' + service + '\n';
      if (detail) message += '📝 Detalle: ' + detail + '\n';
      message += '\n---\nEnviado desde servitecbaq.com';

      const waUrl = 'https://api.whatsapp.com/send?phone=' + WHATSAPP_NUMBER + '&text=' + encodeURIComponent(message);
      window.open(waUrl, '_blank', 'noopener,noreferrer');

      setTimeout(function () {
        closeAllWidgets();
        waForm.reset();
      }, 500);
    });

    waForm.querySelectorAll('input, select, textarea').forEach(function (input) {
      input.addEventListener('input', function () {
        this.style.borderColor = '';
        this.style.boxShadow = '';
      });
    });
  })();

    /* ============================================
     17. MATRIX EN PANEL DISPOSITIVO (OPTIMIZADO)
     - Deshabilitado en mobile
     - FPS reducido
     - Corre solo cuando está visible Y dark
     ============================================ */
  (function initMatrixPanel() {
    const panel = document.getElementById('devicePanel');
    const canvas = document.getElementById('matrixPanelRain');
    if (!panel || !canvas) return;

    // ⚡ Deshabilitado en mobile
    if (window.matchMedia('(max-width: 900px)').matches) return;
    if (prefersReducedMotion) return;
    if (document.documentElement.classList.contains('low-power')) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const chars = 'アカサタナハマヤラワ0123456789ABCDEF<>{}[]/*-+=;:·'.split('');
    const fontSize = 13;
    let columns = 0;
    let drops = [];
    let rafId = null;
    let running = false;
    let lastTime = 0;
    const frameInterval = 100; // ⚡ 10 FPS en lugar de 15

    function resize() {
      const rect = panel.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5); // ⚡ tope 1.5
      canvas.width = Math.max(1, rect.width) * dpr;
      canvas.height = Math.max(1, rect.height) * dpr;
      canvas.style.width = rect.width + 'px';
      canvas.style.height = rect.height + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      columns = Math.max(1, Math.floor(rect.width / fontSize));
      drops = new Array(columns).fill(1).map(function () { return Math.random() * -80; });
    }

    function drawFrame() {
      if (!running) return;
      const now = performance.now();
      if (now - lastTime < frameInterval) {
        rafId = requestAnimationFrame(drawFrame);
        return;
      }
      lastTime = now;

      const w = canvas.width / (Math.min(window.devicePixelRatio || 1, 1.5));
      const h = canvas.height / (Math.min(window.devicePixelRatio || 1, 1.5));

      ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
      ctx.fillRect(0, 0, w, h);

      ctx.font = fontSize + 'px "JetBrains Mono", monospace';
      ctx.textBaseline = 'top';

      for (let i = 0; i < columns; i++) {
        const text = chars[Math.floor(Math.random() * chars.length)];
        const x = i * fontSize;
        const y = drops[i] * fontSize;

        // ⚡ Sin shadowBlur — solo color sólido
        ctx.fillStyle = '#00FF41';
        ctx.fillText(text, x, y);

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
      if (canvas) {
        const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
        ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
      }
    }

    function isDark() {
      return document.documentElement.getAttribute('data-theme') === 'dark';
    }

    function shouldRun() {
      return isDark() && panel.classList.contains('open');
    }

    function sync() {
      if (shouldRun()) start(); else stop();
    }

    const classObserver = new MutationObserver(sync);
    classObserver.observe(panel, { attributes: true, attributeFilter: ['class'] });
    const themeObserver = new MutationObserver(sync);
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    let resizeTimer;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () { if (running) resize(); }, 200);
    }, { passive: true });

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