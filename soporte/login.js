/* ============================================
   SERVITECBAQ · SERVICE DESK · LOGIN DE AGENTE
   Valida usuario y contraseña vía Apps Script contra la
   hoja Users compartida con el portal de facturación.
   ============================================ */

// Reemplaza esta URL con la de tu Apps Script de service desk
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwlh96hxzmjdGZjFPIoVt15RWuDiNp7jirgTc226cgL-Ictf8V8De5gKH_ICfhnFzNR9Q/exec';

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

    /* Al escribir, el aviso y el marcaje en rojo ya perdieron sentido. */
    ['usuario', 'password'].forEach(id => {
        const campo = document.getElementById(id);
        if (!campo) return;
        campo.addEventListener('input', () => {
            const contenedor = campo.closest('.campo');
            if (contenedor) contenedor.classList.remove('is-invalido');
            ocultarError();
        });
    });
});

async function manejarLogin(evento) {
    evento.preventDefault();

    const usuario = document.getElementById('usuario').value.trim();
    const password = document.getElementById('password').value.trim();

    ocultarError();
    limpiarInvalidos();

    if (!usuario || !password) {
        const destino = marcarInvalidos(!usuario ? 'usuario' : 'password');
        mostrarError('Completa ' + (!usuario ? 'el usuario' : 'la contraseña') + '.');
        if (destino) destino.focus();
        return;
    }

    cargandoLogin(true);

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
                cargandoLogin(false);
                return;
            }

            sessionStorage.setItem('sb_sd_autenticado', 'true');
            sessionStorage.setItem('sb_sd_usuario', usuario);
            sessionStorage.setItem('sb_sd_nombre', data.nombre || usuario);
            sessionStorage.setItem('sb_sd_token', data.token);
            sessionStorage.setItem('sb_sd_login_time', Date.now().toString());

            /* Sin recargar: el botón sigue en carga hasta que el panel
               toma el control, así no se puede reintentar a medias. */
            window.location.href = 'panel.html' + location.search;
            return;
        }

        mostrarError(data.message || 'Usuario o contraseña incorrectos.');
        cargandoLogin(false);
        const campoPassword = document.getElementById('password');
        campoPassword.focus();
        campoPassword.select();
    } catch (error) {
        console.error('Error al validar login:', error);
        // TypeError = la petición ni siquiera salió (URL vacía o sin red).
        mostrarError(error instanceof TypeError
            ? 'No se pudo conectar con el servidor. Intenta de nuevo.'
            : error.message);
        cargandoLogin(false);
    }
}

function cargandoLogin(activo) {
    const btn = document.getElementById('btnLogin');
    if (!btn) return;
    btn.disabled = activo;
    btn.classList.toggle('is-cargando', activo);
}

function marcarInvalidos(campoId) {
    const campo = document.getElementById(campoId).closest('.campo');
    if (campo) campo.classList.add('is-invalido');
    return document.getElementById(campoId);
}

function limpiarInvalidos() {
    document.querySelectorAll('.campo.is-invalido').forEach(c => c.classList.remove('is-invalido'));
}

function mostrarError(texto) {
    const mensajeError = document.getElementById('mensajeError');
    mensajeError.textContent = texto;
    mensajeError.classList.add('is-visible');
}

function ocultarError() {
    document.getElementById('mensajeError').classList.remove('is-visible');
}
