/* ============================================
   SERVITECBAQ — app-interactive-1.js — contacto + jira + radar + cursor
   ============================================ */
(function () {
  'use strict';

  const skipParam = (location.search.match(/[?&]skip=([^&]+)/) || [])[1] || '';
  if (skipParam === 'all') return;

  var SVC = window.SVC;
  if (!SVC) return;
  var CONFIG = SVC.CONFIG, $ = SVC.$, $$ = SVC.$$, whenIdle = SVC.whenIdle,
      rafThrottle = SVC.rafThrottle, debounce = SVC.debounce, mq = SVC.mq,
      isMobile = SVC.isMobile, isTablet = SVC.isTablet,
      prefersReducedMotion = SVC.prefersReducedMotion;
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
    if (location.search.indexOf('noradar') !== -1) return;

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

    let lastFrame = 0;
    function draw(now) {
      if (!isVisible || !isReady) { rafId = null; return; }
      if (!lastFrame) lastFrame = now;
      if (now - lastFrame < CONFIG.radar.frameIntervalMs) { rafId = requestAnimationFrame(draw); return; }
      const elapsed = now - lastFrame;
      lastFrame = now;
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

      t += Math.max(1, Math.round(elapsed / CONFIG.radar.frameIntervalMs));
      rafId = requestAnimationFrame(draw);
    }

    function start() {
      if (!resize()) {
        setTimeout(start, 60);
        return;
      }
      rafId = requestAnimationFrame(draw);
    }

    // Arrancar solo tras la primera interacción del usuario
    let started = false;
    function arm() {
      if (started) return;
      started = true;
      window.removeEventListener('scroll', arm);
      window.removeEventListener('touchstart', arm);
      window.removeEventListener('pointerdown', arm);
      window.removeEventListener('keydown', arm);
      whenIdle(start, 3000);
    }
    window.addEventListener('scroll', arm, { passive: true });
    window.addEventListener('touchstart', arm, { passive: true });
    window.addEventListener('pointerdown', arm, { passive: true });
    window.addEventListener('keydown', arm, { passive: true });

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
})();
