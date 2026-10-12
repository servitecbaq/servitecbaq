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
        const offset = header ? header.offsetHeight + 12 : 0;
        const top = target.getBoundingClientRect().top + window.pageYOffset - offset;
        window.scrollTo({ top: top, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
      }
    });
  });

  /* ============================================
     3. HEADER CON SOMBRA
     ============================================ */
  const header = document.querySelector('.header');
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
  const revealTargets = ['.service-card', '.feature', '.contact-card', '.faq-item'];
  revealTargets.forEach(function (selector) {
    document.querySelectorAll(selector).forEach(function (el, i) {
      el.classList.add('reveal');
      if (i < 8) el.classList.add('reveal-delay-' + ((i % 8) + 1));
    });
  });
  document.querySelectorAll('.section-title, .section-subtitle').forEach(function (el) {
    el.classList.add('reveal');
  });
  const founderCard = document.querySelector('.founder-card');
  if (founderCard) founderCard.classList.add('reveal');

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
    reparacion: { icon: '💻', title: 'Reparación de computadores', description: 'Diagnosticamos y solucionamos problemas de hardware y software, tanto en equipos de escritorio como portátiles.', items: ['Diagnóstico completo del equipo','Cambio de piezas (disco, RAM, batería, teclado)','Reinstalación de sistema operativo','Eliminación de virus y malware','Recuperación de datos cuando sea posible'] },
    mantenimiento: { icon: '⚡', title: 'Mantenimiento preventivo y correctivo', description: 'Prolongamos la vida útil de tus equipos con limpieza, optimización y revisiones periódicas.', items: ['Limpieza interna de polvo y ventiladores','Cambio de pasta térmica','Optimización del sistema operativo','Actualización de controladores y software','Revisión de temperaturas y rendimiento'] },
    redes: { icon: '🌐', title: 'Redes e Internet', description: 'Configuramos y solucionamos problemas de conectividad en hogares y pequeñas empresas.', items: ['Configuración de routers y módems','Instalación de redes Wi-Fi y cableadas','Ampliación de cobertura con repetidores','Solución de cortes o lentitud de internet','Configuración de red para pequeñas oficinas'] },
    impresoras: { icon: '🖨️', title: 'Impresoras', description: 'Instalamos, configuramos y reparamos impresoras de todas las marcas.', items: ['Instalación en Windows y Mac','Configuración en red o Wi-Fi','Solución de atascos y errores','Cambio de cartuchos y tóner','Impresión desde celular o tablet'] },
    instalacion: { icon: '🔧', title: 'Instalación y configuración', description: 'Dejamos tus equipos listos para trabajar, estudiar o disfrutar, con todo lo necesario configurado.', items: ['Instalación de computadores nuevos','Configuración inicial de Windows, macOS o Linux','Instalación de programas esenciales','Configuración de cuentas y correo','Puesta a punto de equipos para oficina'] },
    seguridad: { icon: '🔒', title: 'Seguridad y respaldo', description: 'Protegemos tu información y te enseñamos buenas prácticas para evitar pérdidas de datos.', items: ['Instalación de antivirus y firewall','Configuración de copias de seguridad automáticas','Respaldo en la nube o discos externos','Protección contra ransomware','Asesoría en contraseñas seguras'] },
    aplicativos: { icon: '🧩', title: 'Soporte de aplicativos', description: 'Te ayudamos con la instalación, configuración y solución de problemas de los programas que usas a diario.', items: ['Instalación y configuración de programas','Actualización o reinstalación de aplicaciones','Solución de errores de programas (Office, sistemas contables, navegadores, etc.)','Configuración de correo y aplicaciones corporativas'] },
    desarrollo: { icon: '👨‍💻', title: 'Desarrollo de software', description: 'Creamos soluciones a la medida para automatizar procesos y mejorar la operación de tu negocio.', items: ['Páginas web y landing pages','Automatización de tareas repetitivas','Scripts en PowerShell y Python','Integración de sistemas y APIs','Bases de datos SQL y reportes personalizados'] }
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

  document.querySelectorAll('.service-card').forEach(function (card) {
    const key = card.getAttribute('data-service');
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
        if (tipTrack) tipTrack.innerHTML = '<p style="text-align:center;color:var(--color-text-light);padding:40px 20px;">No se pudieron cargar los tips.</p>';
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
     10. LAZY LOAD: GR WIDGET
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
      }, { rootMargin: '300px 0px' });
      grObserver.observe(reviewsSection);
    } else {
      loadGrWidget();
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

  /* ============================================
     13. RADAR CANVAS EN HERO
     ============================================ */
  (function initHeroRadar() {
    const canvas = document.getElementById('heroRadar');
    if (!canvas) return;
    if (prefersReducedMotion) return;
    if (document.documentElement.classList.contains('low-power')) return;

    const ctx = canvas.getContext('2d');
    let W, H, dpr;
    let t = 0;
    const particles = [];
    let isVisible = true;

    const mouse = { x: -9999, y: -9999, radius: 160 };

    function getColors() {
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      return {
        dot: isDark ? 'rgba(77,216,255,0.95)' : 'rgba(37,99,235,0.85)',
        dotCore: isDark ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.9)',
        line: isDark ? 'rgba(77,216,255,' : 'rgba(37,99,235,',
        ring: isDark ? 'rgba(77,216,255,0.20)' : 'rgba(37,99,235,0.16)',
        sweep: isDark ? 'rgba(77,216,255,0.16)' : 'rgba(37,99,235,0.12)',
        glow: isDark ? 'rgba(77,216,255,0.9)' : 'rgba(37,99,235,0.7)'
      };
    }

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      W = rect.width;
      H = rect.height;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const targetCount = Math.max(30, Math.min(60, Math.floor((W * H) / 14000)));
      particles.length = 0;
      for (let i = 0; i < targetCount; i++) {
        particles.push({
          x: Math.random() * W,
          y: Math.random() * H,
          vx: (Math.random() - 0.5) * 0.28,
          vy: (Math.random() - 0.5) * 0.28,
          baseR: 1 + Math.random() * 1.8,
          phase: Math.random() * Math.PI * 2
        });
      }
    }

    function draw() {
      if (!isVisible) {
        requestAnimationFrame(draw);
        return;
      }

      const colors = getColors();
      ctx.clearRect(0, 0, W, H);

      const cx = W / 2;
      const cy = H / 2;
      const maxR = Math.max(W, H) * 0.6;

      ctx.strokeStyle = colors.ring;
      ctx.lineWidth = 1;
      const ringCount = 5;
      for (let i = 1; i <= ringCount; i++) {
        const r = (maxR / ringCount) * i;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();
      }

      const sweepAngle = (t * 0.008) % (Math.PI * 2);
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

      const linkDist = 150;
      for (let i = 0; i < particles.length; i++) {
        const p1 = particles[i];
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < linkDist) {
            const alpha = (1 - dist / linkDist) * 0.4;
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
          ctx.strokeStyle = colors.line + (force * 0.55) + ')';
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.stroke();
        }

        p.phase += 0.025;
        const pulse = 1 + Math.sin(p.phase) * 0.35;
        const r = Math.max(0.6, p.baseR * pulse);

        ctx.shadowBlur = 10;
        ctx.shadowColor = colors.glow;
        ctx.fillStyle = colors.dot;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowBlur = 0;
        ctx.fillStyle = colors.dotCore;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r * 0.35, 0, Math.PI * 2);
        ctx.fill();
      }

      t += 1;
      requestAnimationFrame(draw);
    }

    resize();
    draw();

    window.addEventListener('resize', resize);

    const heroSection = canvas.parentElement;
    if (heroSection) {
      heroSection.addEventListener('mousemove', function (e) {
        const rect = canvas.getBoundingClientRect();
        mouse.x = e.clientX - rect.left;
        mouse.y = e.clientY - rect.top;
      });
      heroSection.addEventListener('mouseleave', function () {
        mouse.x = -9999;
        mouse.y = -9999;
      });
    }

    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          isVisible = entry.isIntersecting;
        });
      }, { threshold: 0 });
      io.observe(canvas);
    }
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

      cursorRing.style.transform = `translate(${ringX}px, ${ringY}px) translate(-50%, -50%)`;
      cursorDot.style.transform  = `translate(${dotX}px, ${dotY}px) translate(-50%, -50%)`;

      rafId = requestAnimationFrame(animate);
    }

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    document.addEventListener('mouseleave', onMouseLeaveWindow);
    document.addEventListener('mouseenter', onMouseEnterWindow);

    document.querySelectorAll('[data-cursor="hover"]').forEach(function (el) {
      el.addEventListener('mouseenter', function () { document.body.classList.add('cursor-hover'); });
      el.addEventListener('mouseleave', function () { document.body.classList.remove('cursor-hover'); });
    });

    document.querySelectorAll('[data-cursor="view"]').forEach(function (el) {
      el.addEventListener('mouseenter', function () { document.body.classList.add('cursor-view'); });
      el.addEventListener('mouseleave', function () { document.body.classList.remove('cursor-view'); });
    });

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
     15. WIDGET: PANELES (Datos + Calculadora)
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

      // Cargar datos del dispositivo al abrir
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

    /* --------- Datos del dispositivo --------- */
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

      // IP y geolocalización
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

    if (deviceRefresh) {
      deviceRefresh.addEventListener('click', loadDeviceData);
    }

    // Actualizar la hora cada minuto si el panel está abierto
    setInterval(function () {
      if (devicePanel && devicePanel.classList.contains('open')) updateTime();
    }, 60000);

    /* --------- Calculadora --------- */
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
          ? previousValue + ' ' + currentOperator
          : '';
      }
    }

    function inputDigit(digit) {
      if (waitingForOperand) {
        currentInput = digit;
        waitingForOperand = false;
      } else {
        currentInput = currentInput === '0' ? digit : currentInput + digit;
      }
    }

    function inputDecimal() {
      if (waitingForOperand) {
        currentInput = '0.';
        waitingForOperand = false;
        return;
      }
      if (!currentInput.includes('.')) currentInput += '.';
    }

    function clearAll() {
      currentInput = '0';
      previousValue = null;
      currentOperator = null;
      waitingForOperand = false;
    }

    function toggleSign() {
      if (currentInput === '0') return;
      currentInput = currentInput.startsWith('-')
        ? currentInput.slice(1)
        : '-' + currentInput;
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
          currentInput = 'Error';
          previousValue = null;
          currentOperator = null;
          waitingForOperand = true;
          updateDisplay();
          return;
        }
        currentInput = String(result);
        previousValue = result;
      } else {
        previousValue = inputValue;
      }
      currentOperator = op;
      waitingForOperand = true;
      updateDisplay();
    }

    function handleEquals() {
      if (currentOperator === null) return;
      const result = performOperation();
      if (result === 'Error') {
        currentInput = 'Error';
        previousValue = null;
        currentOperator = null;
        waitingForOperand = true;
        updateDisplay();
        return;
      }
      currentInput = String(result);
      previousValue = null;
      currentOperator = null;
      waitingForOperand = true;
      updateDisplay();
    }

    calcButtons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        const action = btn.dataset.calc;
        if (currentInput === 'Error' && action !== 'clear') clearAll();

        if (/^[0-9]$/.test(action)) {
          inputDigit(action);
        } else {
          switch (action) {
            case '.': inputDecimal(); break;
            case 'clear': clearAll(); break;
            case 'sign': toggleSign(); break;
            case 'percent': applyPercent(); break;
            case '+':
            case '-':
            case '*':
            case '/': handleOperator(action); break;
            case '=': handleEquals(); return;
          }
        }
        updateDisplay();
      });
    });

    // Soporte de teclado
    document.addEventListener('keydown', function (e) {
      if (!calcPanel || !calcPanel.classList.contains('open')) return;

      const key = e.key;
      if (/^[0-9]$/.test(key)) {
        if (currentInput === 'Error') clearAll();
        inputDigit(key);
        updateDisplay();
      } else if (key === '.' || key === ',') {
        if (currentInput === 'Error') clearAll();
        inputDecimal();
        updateDisplay();
      } else if (key === '+' || key === '-' || key === '*' || key === '/') {
        if (currentInput === 'Error') clearAll();
        handleOperator(key);
      } else if (key === 'Enter' || key === '=') {
        e.preventDefault();
        handleEquals();
      } else if (key === 'Escape' || key === 'c' || key === 'C') {
        clearAll();
        updateDisplay();
      } else if (key === 'Backspace') {
        if (currentInput === 'Error') { clearAll(); }
        else if (currentInput.length <= 1 || (currentInput.length === 2 && currentInput.startsWith('-'))) {
          currentInput = '0';
        } else {
          currentInput = currentInput.slice(0, -1);
        }
        updateDisplay();
      }
    });

    updateDisplay();
  })();
    /* ============================================
     16. PANEL DE MINI-CHAT PARA WHATSAPP
     ============================================ */
  (function initWhatsAppPanel() {
    const whatsappBtn = document.getElementById('whatsappFloatBtn');
    const waPanel = document.getElementById('waModal');
    const waForm = document.getElementById('waForm');
    const overlay = document.getElementById('widgetOverlay');
    if (!whatsappBtn || !waPanel || !waForm) return;

    const WHATSAPP_NUMBER = '573158505020';

    // Reutilizamos el sistema de widgets existente
    // El panel se abre igual que calculadora y datos
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

      const waUrl = 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(message);

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
});