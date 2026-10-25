/* ============================================
   SERVITECBAQ — app-interactive-2.js — widgets + WhatsApp
   ============================================ */
(function () {
  'use strict';

  const skipParam = (location.search.match(/[?&]skip=([^&]+)/) || [])[1] || '';
  if (skipParam === 'all') return;

  var SVC = window.SVC;
  if (!SVC) return;
  var CONFIG = SVC.CONFIG, $ = SVC.$, $$ = SVC.$$;
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

    // Todo CTA de WhatsApp abre el panel en vez de sacar al usuario del sitio.
    // El href se deja intacto: sin JS, clic central o Ctrl/Cmd siguen abriendo wa.me.
    document.addEventListener('click', function (e) {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const link = e.target.closest && e.target.closest('a[href*="wa.me"], a[href*="api.whatsapp.com"]');
      if (!link || link.closest('#waModal')) return;
      const motivo = new URL(link.href, location.href).searchParams.get('text');
      const detail = $('#wa-detail');
      if (motivo && detail && !detail.value.trim()) detail.value = motivo;
      if (SVC.closeServiceModal) SVC.closeServiceModal();
      openPanel();
      e.preventDefault();
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

      let msg = 'Nueva solicitud de servicio\n\n';
      msg += 'Nombre: ' + name + '\n';
      msg += 'Dirección: ' + address + '\n';
      msg += 'Contacto: ' + contact + '\n';
      msg += 'Servicio: ' + service + '\n';
      if (detail) msg += 'Detalle: ' + detail + '\n';
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

})();
