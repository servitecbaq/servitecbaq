/* ============================================
   SERVITECBAQ · SERVICE DESK · LOGIN DE AGENTE
   Valida usuario y contraseña vía Apps Script contra la
   hoja Users compartida con el portal de facturación.
   ============================================ */

// Reemplaza esta URL con la de tu Apps Script de service desk
const GOOGLE_SCRIPT_URL = '';

function apiBase() {
    if ((location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
        const alt = new URLSearchParams(location.search).get('api');
        if (alt) return alt;
    }
    return GOOGLE_SCRIPT_URL;
}

document.addEventListener('DOMContentLoaded', () => {
    if (sessionStorage.getItem('sb_sd_autenticado') === 'true' && sessionStorage.getItem('sb_sd_token')) {
        window.location.href = 'panel.html' + location.search;
        return;
    }
    const form = document.getElementById('loginForm');
    if (form) form.addEventListener('submit', manejarLogin);
});

async function manejarLogin(evento) {
    evento.preventDefault();

    const usuario = document.getElementById('usuario').value.trim();
    const password = document.getElementById('password').value.trim();
    const btnLogin = document.getElementById('btnLogin');
    const btnText = btnLogin.querySelector('.btn-text');
    const btnLoading = btnLogin.querySelector('.btn-loading');
    const mensajeError = document.getElementById('mensajeError');

    mensajeError.style.display = 'none';

    if (!usuario || !password) {
        mostrarError('Por favor completa usuario y contraseña.');
        return;
    }

    btnLogin.disabled = true;
    btnText.style.display = 'none';
    btnLoading.style.display = 'inline';

    try {
        const base = apiBase();
        if (!base) throw new Error('Falta la URL del Apps Script: pega el /exec en GOOGLE_SCRIPT_URL de soporte/login.js.');

        const cuerpo = new URLSearchParams();
        cuerpo.append('accion', 'login');
        cuerpo.append('usuario', usuario);
        cuerpo.append('password', password);

        const respuesta = await fetch(base, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: cuerpo.toString()
        });
        const data = await respuesta.json();

        if (data.result === 'success') {
            if (!data.token) {
                mostrarError('El servidor no devolvió un token de sesión. Revisa el Apps Script.');
                btnLogin.disabled = false;
                btnText.style.display = 'inline';
                btnLoading.style.display = 'none';
                return;
            }

            sessionStorage.setItem('sb_sd_autenticado', 'true');
            sessionStorage.setItem('sb_sd_usuario', usuario);
            sessionStorage.setItem('sb_sd_nombre', data.nombre || usuario);
            sessionStorage.setItem('sb_sd_token', data.token);
            sessionStorage.setItem('sb_sd_login_time', Date.now().toString());

            window.location.href = 'panel.html' + location.search;
        } else {
            mostrarError(data.message || 'Usuario o contraseña incorrectos.');
            btnLogin.disabled = false;
            btnText.style.display = 'inline';
            btnLoading.style.display = 'none';
        }
    } catch (error) {
        console.error('Error al validar login:', error);
        // TypeError = la peticion ni siquiera salio (URL vacia o sin red).
        mostrarError(error instanceof TypeError
            ? 'No se pudo conectar con el servidor. Intenta de nuevo.'
            : error.message);
        btnLogin.disabled = false;
        btnText.style.display = 'inline';
        btnLoading.style.display = 'none';
    }
}

function mostrarError(texto) {
    const mensajeError = document.getElementById('mensajeError');
    mensajeError.textContent = texto;
    mensajeError.style.display = 'block';

    const passwordInput = document.getElementById('password');
    passwordInput.focus();
    passwordInput.select();
}
