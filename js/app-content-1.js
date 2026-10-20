/* ============================================
   SERVITECBAQ — app-content-1.js — servicios + tips
   ============================================ */
(function () {
  'use strict';

  const skipParam = (location.search.match(/[?&]skip=([^&]+)/) || [])[1] || '';
  if (skipParam === 'all') return;

  var SVC = window.SVC;
  if (!SVC) return;
  var CONFIG = SVC.CONFIG, $ = SVC.$, $$ = SVC.$$, whenIdle = SVC.whenIdle,
      debounce = SVC.debounce, mountInChunks = SVC.mountInChunks, mq = SVC.mq,
      isMobile = SVC.isMobile, isTablet = SVC.isTablet,
      prefersReducedMotion = SVC.prefersReducedMotion;

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

    // El panel de WhatsApp queda por debajo del modal (9997 < 10000) y hay que cerrarlo antes
    SVC.closeServiceModal = close;

    // Delegación: un único listener.
    // Los títulos de las tarjetas enlazan a su página de servicio; si el clic
    // cae dentro de un <a>, deja pasar la navegación y no abre el modal.
    document.addEventListener('click', function (e) {
      if (e.target.closest('a')) return;
      const card = e.target.closest('.svc[data-service], .service-card[data-service]');
      if (card) {
        open(card.getAttribute('data-service'));
      }
    });

    document.addEventListener('keydown', function (e) {
      const card = !e.target.closest || e.target.closest('a') ? null
        : e.target.closest('.svc[data-service], .service-card[data-service]');
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

    function load() {
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
          mountInChunks(tipsGrid, Array.prototype.slice.call(gridFrag.children), 6);
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
    }

    // Cargar tips solo cuando la sección se acerca al viewport
    if ('IntersectionObserver' in window) {
      const tipsSection = document.getElementById('tips');
      if (tipsSection) {
        const loadObserver = new IntersectionObserver(function (entries) {
          if (entries[0].isIntersecting) { loadObserver.disconnect(); load(); }
        }, { rootMargin: '1200px 0px' });
        loadObserver.observe(tipsSection);
        return;
      }
    }
    load();
  })();
})();
