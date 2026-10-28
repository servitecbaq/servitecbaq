/* ============================================
   SERVITECBAQ · SERVICE DESK · PANEL DE AGENTE
   Listado, detalle, cambio de estado y respuesta.
   Todo por POST con el token de sesión en el body.
   ============================================ */

// Reemplaza esta URL con la de tu Apps Script de service desk
const GOOGLE_SCRIPT_URL = '';

const ESTADOS = ['Nuevo', 'En curso', 'En espera', 'Resuelto', 'Cerrado'];

/* ===== API ===== */

function apiBase() {
    if ((location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
        const alt = new URLSearchParams(location.search).get('api');
        if (alt) return alt;
    }
    return GOOGLE_SCRIPT_URL;
}

async function api(accion, parametros) {
    const base = apiBase();
    if (!base) throw new Error('Falta la URL del Apps Script: pega el /exec en GOOGLE_SCRIPT_URL de soporte/panel.js.');

    const cuerpo = new URLSearchParams();
    cuerpo.append('accion', accion);
    cuerpo.append('token', sessionStorage.getItem('sb_sd_token') || '');
    Object.keys(parametros || {}).forEach(k => {
        if (parametros[k] !== '' && parametros[k] != null) cuerpo.append(k, parametros[k]);
    });

    const respuesta = await fetch(base, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: cuerpo.toString()
    });
    const data = await respuesta.json();

    if (data.sinSesion) {
        cerrarSesion();
        throw new Error(data.message || 'Sesión expirada.');
    }
    return data;
}

function cerrarSesion() {
    sessionStorage.removeItem('sb_sd_autenticado');
    sessionStorage.removeItem('sb_sd_usuario');
    sessionStorage.removeItem('sb_sd_nombre');
    sessionStorage.removeItem('sb_sd_token');
    window.location.href = 'login.html';
}

/* ===== UTILIDADES ===== */

function esc(texto) {
    return String(texto == null ? '' : texto)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function formatearFecha(texto) {
    const m = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/.exec(String(texto || ''));
    if (!m) return String(texto || '');
    const fecha = new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]);
    return fecha.toLocaleString('es-CO', {
        day: 'numeric', month: 'short', year: 'numeric',
        hour: 'numeric', minute: '2-digit'
    });
}

function claseEstado(estado) {
    return {
        'Nuevo': 'badge-navy',
        'En curso': 'badge-teal',
        'En espera': 'badge-gris',
        'Resuelto': 'badge-verde',
        'Cerrado': 'badge-hueco'
    }[estado] || 'badge-gris';
}

function clasePrioridad(prioridad) {
    return {
        'Alta': 'badge-rojo',
        'Media': 'badge-hueco',
        'Baja': 'badge-gris'
    }[prioridad] || 'badge-hueco';
}

function cargando(boton, activo) {
    const btn = document.getElementById(boton);
    if (!btn) return;
    btn.disabled = activo;
    const texto = btn.querySelector('.btn-texto');
    const rueda = btn.querySelector('.cargando');
    if (texto) texto.style.display = activo ? 'none' : 'inline';
    if (rueda) rueda.style.display = activo ? 'inline-block' : 'none';
}

/* ===== LISTADO ===== */

let filtroEstado = '';

function filtrosActuales() {
    return {
        estado: filtroEstado,
        prioridad: document.getElementById('fPrioridad').value,
        busca: document.getElementById('fBusca').value.trim()
    };
}

async function cargarLista() {
    try {
        const data = await api('listar', filtrosActuales());
        if (data.result !== 'success') throw new Error(data.message || 'No se pudo cargar la lista.');

        pintarContadores(data.conteo || {});
        pintarTabla(data.tickets || []);
    } catch (error) {
        const cuerpo = document.getElementById('cuerpoTickets');
        cuerpo.innerHTML = '<tr><td colspan="7">' + esc(error.message) + '</td></tr>';
    }
}

function pintarContadores(conteo) {
    document.querySelectorAll('[data-contador]').forEach(nodo => {
        nodo.textContent = String(conteo[nodo.dataset.contador] || 0);
    });
}

function pintarTabla(tickets) {
    const cuerpo = document.getElementById('cuerpoTickets');
    const vacio = document.getElementById('estadoVacio');

    if (!tickets.length) {
        cuerpo.innerHTML = '';
        vacio.hidden = false;
        return;
    }
    vacio.hidden = true;

    cuerpo.innerHTML = tickets.map(t =>
        '<tr class="fila-ticket" data-numero="' + esc(t.numero) + '" tabindex="0" aria-label="Abrir ticket ' + esc(t.numero) + '">' +
        '<td><span class="numero">' + esc(t.numero) + '</span></td>' +
        '<td>' + esc(t.nombre) + '</td>' +
        '<td class="asunto" title="' + esc(t.asunto) + '">' + esc(t.asunto) + '</td>' +
        '<td>' + esc(t.categoria) + '</td>' +
        '<td><span class="badge ' + clasePrioridad(t.prioridad) + '">' + esc(t.prioridad) + '</span></td>' +
        '<td><span class="badge ' + claseEstado(t.estado) + '">' + esc(t.estado) + '</span></td>' +
        '<td>' + esc(formatearFecha(t.ultimaActualizacion)) + '</td>' +
        '</tr>'
    ).join('');

    cuerpo.querySelectorAll('.fila-ticket').forEach(fila => {
        const abrir = () => abrirDetalle(fila.dataset.numero);
        fila.addEventListener('click', abrir);
        fila.addEventListener('keydown', e => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                abrir();
            }
        });
    });
}

function aplicarFiltroDesdeChip(chip) {
    document.querySelectorAll('.stat-chip').forEach(c => c.classList.remove('is-activo'));
    chip.classList.add('is-activo');
    filtroEstado = chip.dataset.filtro || '';
    document.getElementById('fEstado').value = filtroEstado;
    cargarLista();
}

/* ===== DETALLE ===== */

let ticketAbierto = null;

async function abrirDetalle(numero) {
    try {
        const data = await api('detalle', { numero });
        if (data.result !== 'success') throw new Error(data.message || 'No se pudo abrir el ticket.');
        ticketAbierto = data.ticket.numero;
        pintarModal(data);
    } catch (error) {
        alert(error.message);
    }
}

function pintarModal(data) {
    const t = data.ticket;
    const contenedor = document.getElementById('contenedorModal');

    contenedor.innerHTML =
        '<div class="modal-fondo" role="dialog" aria-modal="true" aria-label="Ticket ' + esc(t.numero) + '">' +
        '<div class="modal">' +
            '<div class="modal-header">' +
                '<div>' +
                    '<h2>' + esc(t.numero) + '</h2>' +
                    '<div class="badges">' +
                        '<span class="badge ' + claseEstado(t.estado) + '">' + esc(t.estado) + '</span>' +
                        '<span class="badge ' + clasePrioridad(t.prioridad) + '">' + esc(t.prioridad) + '</span>' +
                        '<span class="badge badge-hueco">' + esc(t.categoria) + '</span>' +
                    '</div>' +
                '</div>' +
                '<button type="button" class="modal-cerrar" id="modalCerrar" aria-label="Cerrar">' +
                    '<svg viewBox="0 0 24 24" fill="none" width="15" height="15" aria-hidden="true"><path d="M6 18 18 6M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>' +
                '</button>' +
            '</div>' +
            '<div class="modal-cuerpo">' +
                '<div class="ficha">' +
                    '<span><strong>' + esc(t.nombre) + '</strong></span>' +
                    '<span><a href="mailto:' + esc(t.email) + '">' + esc(t.email) + '</a></span>' +
                    (t.telefono ? '<span><a href="tel:' + esc(t.telefono.replace(/\s/g, '')) + '">' + esc(t.telefono) + '</a></span>' : '') +
                    '<span>' + esc(formatearFecha(t.fecha)) + '</span>' +
                '</div>' +
                '<p class="asunto-ticket">' + esc(t.asunto) + '</p>' +
                '<div class="timeline">' + pintarTimeline(data.mensajes) + '</div>' +
                '<div class="acciones-estado">' +
                    '<label class="lector-solo" for="selEstado">Cambiar estado</label>' +
                    '<select id="selEstado">' + ESTADOS.map(e =>
                        '<option' + (e === t.estado ? ' selected' : '') + '>' + esc(e) + '</option>'
                    ).join('') + '</select>' +
                    '<button type="button" class="btn-mini" id="btnCambiarEstado">Aplicar estado</button>' +
                '</div>' +
                '<div class="responder-form">' +
                    '<div class="campo">' +
                        '<label for="respuestaAgente">Responder</label>' +
                        '<textarea id="respuestaAgente" maxlength="2000" rows="3" placeholder="Escribe tu respuesta al cliente..."></textarea>' +
                    '</div>' +
                    '<div class="acciones-form">' +
                        '<button type="button" class="btn-primario" id="btnEnviarRespuesta">' +
                            '<svg class="hic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5.99972 12L3.2688 3.12451C9.88393 5.04617 16.0276 8.07601 21.4855 11.9997C16.0276 15.9235 9.884 18.9535 3.26889 20.8752L5.99972 12ZM5.99972 12L13.5 12"/></svg>' +
                            '<span class="btn-texto">Enviar respuesta</span>' +
                            '<span class="cargando" style="display:none;" aria-hidden="true"></span>' +
                        '</button>' +
                        '<label class="opcion-interna">' +
                            '<input type="checkbox" id="chkInterno"> Nota interna (el cliente no la ve)' +
                        '</label>' +
                    '</div>' +
                '</div>' +
            '</div>' +
        '</div>' +
        '</div>';

    const fondo = contenedor.querySelector('.modal-fondo');
    fondo.addEventListener('click', e => {
        if (e.target === fondo) cerrarModal();
    });
    contenedor.querySelector('#modalCerrar').addEventListener('click', cerrarModal);
    contenedor.querySelector('#btnCambiarEstado').addEventListener('click', cambiarEstado);
    contenedor.querySelector('#btnEnviarRespuesta').addEventListener('click', enviarRespuesta);
    contenedor.querySelector('#respuestaAgente').focus();

    document.addEventListener('keydown', teclaEscape);
    document.body.style.overflow = 'hidden';
}

function pintarTimeline(mensajes) {
    if (!mensajes.length) return '<p class="estado-vacio">Sin mensajes todavía.</p>';
    return mensajes.map(m => {
        if (m.interno) {
            return '<div class="burbuja burbuja-interna">' +
                '<span class="meta">Nota interna · ' + esc(m.nombre) + ' · ' + esc(formatearFecha(m.fecha)) + '</span>' +
                esc(m.mensaje) + '</div>';
        }
        const esAgente = m.autor === 'Agente';
        return '<div class="burbuja ' + (esAgente ? 'burbuja-agente' : 'burbuja-cliente') + '">' +
            '<span class="meta">' + esc(m.nombre) + ' · ' + esc(formatearFecha(m.fecha)) + '</span>' +
            esc(m.mensaje) + '</div>';
    }).join('');
}

function teclaEscape(e) {
    if (e.key === 'Escape') cerrarModal();
}

function cerrarModal() {
    document.getElementById('contenedorModal').innerHTML = '';
    document.removeEventListener('keydown', teclaEscape);
    document.body.style.overflow = '';
    ticketAbierto = null;
}

async function cambiarEstado() {
    if (!ticketAbierto) return;
    const nuevoEstado = document.getElementById('selEstado').value;
    try {
        const data = await api('estado', { numero: ticketAbierto, estado: nuevoEstado });
        if (data.result !== 'success') throw new Error(data.message || 'No se pudo cambiar el estado.');
        await abrirDetalle(ticketAbierto);
        await cargarLista();
    } catch (error) {
        alert(error.message);
    }
}

async function enviarRespuesta() {
    if (!ticketAbierto) return;
    const mensaje = document.getElementById('respuestaAgente').value.trim();
    const interno = document.getElementById('chkInterno').checked;
    if (mensaje.length < 1) return;

    cargando('btnEnviarRespuesta', true);
    try {
        const data = await api('responderAgente', { numero: ticketAbierto, mensaje, interno: interno ? 'SI' : '' });
        if (data.result !== 'success') throw new Error(data.message || 'No se pudo enviar la respuesta.');
        document.getElementById('respuestaAgente').value = '';
        await abrirDetalle(ticketAbierto);
        await cargarLista();
    } catch (error) {
        alert(error.message);
    } finally {
        cargando('btnEnviarRespuesta', false);
    }
}

/* ===== INICIALIZACION ===== */

document.addEventListener('DOMContentLoaded', () => {
    const nombre = sessionStorage.getItem('sb_sd_nombre') || 'Agente';
    document.getElementById('userNombre').textContent = nombre;
    document.getElementById('userAvatar').textContent = nombre.charAt(0).toUpperCase();

    document.getElementById('btnLogout').addEventListener('click', cerrarSesion);
    document.getElementById('btnActualizar').addEventListener('click', cargarLista);
    document.getElementById('btnFiltrar').addEventListener('click', () => { cargarLista(); });

    document.getElementById('fBusca').addEventListener('keydown', e => {
        if (e.key === 'Enter') cargarLista();
    });

    document.querySelectorAll('.stat-chip').forEach(chip => {
        chip.addEventListener('click', () => aplicarFiltroDesdeChip(chip));
    });

    cargarLista();
});
