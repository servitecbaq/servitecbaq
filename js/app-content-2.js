/* ============================================
   SERVITECBAQ — app-content-2.js — aplicativos + FAQ + reseñas
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
    let primerMontaje = true;

    // La rejilla se monta por lotes, así que crece ~1900px despues de que el navegador
    // ya resolvio la ancla: quien entra por #resenas, #faq o #contacto se queda corto.
    function reasentarAncla() {
      const id = location.hash.slice(1);
      if (!id) return;
      const destino = document.getElementById(id);
      if (destino) destino.scrollIntoView();
    }

    function load() {
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
    }

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

    // Cargar aplicativos solo cuando la sección se acerca al viewport. Va al
    // final del todo: su `return` saldría de initApps() sin registrar filtros.
    if ('IntersectionObserver' in window) {
      const appsSection = document.getElementById('apps');
      if (appsSection) {
        const loadObserver = new IntersectionObserver(function (entries) {
          if (entries[0].isIntersecting) { loadObserver.disconnect(); load(); }
        }, { rootMargin: '1200px 0px' });
        loadObserver.observe(appsSection);
        return;
      }
    }
    load();

    /* apps.json escribe los nombres con tildes («nómina»); sin plegarlas, buscar
       «nomina» no devuelve nada. */
    function fold(s) {
      return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    }

    function render() {
      const term = fold(state.term.trim());
      const filtered = state.all.filter(function (app) {
        const catOk = state.activeCategory === 'all' || app.category === state.activeCategory;
        if (!catOk) return false;
        if (!term) return true;
        return fold(app.name).indexOf(term) !== -1 ||
               fold(app.desc).indexOf(term) !== -1 ||
               fold(app.category).indexOf(term) !== -1;
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
      mountInChunks(appsGrid, Array.prototype.slice.call(frag.children), 6,
        primerMontaje && reasentarAncla);
      primerMontaje = false;
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
})();
