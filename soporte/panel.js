/* ============================================
   SERVITECBAQ · SERVICE DESK · PANEL DE AGENTE
   Listado, detalle, cambio de estado y respuesta.
   Todo por POST con el token de sesión en el body.
   ============================================ */

// Reemplaza esta URL con la de tu Apps Script de service desk
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwlh96hxzmjdGZjFPIoVt15RWuDiNp7jirgTc226cgL-Ictf8V8De5gKH_ICfhnFzNR9Q/exec';

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

/* El listado no necesita el año: con día, mes y hora basta y la
   columna "Actualizado" deja de partirse en dos líneas. */
function fechaCorta(texto) {
    const m = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/.exec(String(texto || ''));
    if (!m) return String(texto || '');
    const fecha = new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]);
    const opciones = { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' };
    if (fecha.getFullYear() !== new Date().getFullYear()) opciones.year = 'numeric';
    return fecha.toLocaleString('es-CO', opciones);
}

function claseEstado(estado) {
    return {
        'Nuevo': 'badge-navy',
        'En curso': 'badge-teal',
        'En espera': 'badge-gris',
        'Resuelto': 'badge-verde',
        'Cerrado': 'badge-cerrado'
    }[estado] || 'badge-gris';
}

function clasePrioridad(prioridad) {
    return {
        'Alta': 'badge-rojo',
        'Media': 'badge-hueco',
        'Baja': 'badge-gris'
    }[prioridad] || 'badge-hueco';
}

/* El spinner sustituye al icono: el botón no cambia de ancho mientras
   trabaja. Como al deshabilitarlo el navegador le quita el foco, se
   anota el origen de la acción para devolvérselo al re-renderizar. */
let ultimoFoco = '';

function cargando(boton, activo) {
    const btn = document.getElementById(boton);
    if (!btn) return;
    if (activo) {
        const enfocado = document.activeElement;
        ultimoFoco = enfocado && enfocado.id ? enfocado.id : boton;
    }
    btn.disabled = activo;
    btn.classList.toggle('is-cargando', activo);
}

/* Aviso en pantalla en vez de alert(): el alert del navegador bloquea
   la página y no lleva el estilo del portal. */
function notificar(mensaje, tipo) {
    const previo = document.querySelector('.aviso-flotante');
    if (previo) previo.remove();

    const aviso = document.createElement('div');
    aviso.className = 'aviso-flotante ' + (tipo === 'ok' ? 'is-ok' : 'is-error');
    aviso.setAttribute('role', 'status');
    aviso.textContent = mensaje;
    document.body.appendChild(aviso);

    setTimeout(() => {
        aviso.classList.add('is-saliendo');
        setTimeout(() => aviso.remove(), 200);
    }, 4200);
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

/* Filas huecas mientras llega la primera respuesta. Solo se pintan con
   la tabla vacía: una recarga no debe borrar lo que ya se veía. */
function pintarSkeleton() {
    const fila = '<tr class="fila-skeleton">' +
        ['62%', '110px', '80%', '70px', '54px', '64px', '96px'].map(an =>
            '<td><span class="esqueleto" style="--an:' + an + '"></span></td>'
        ).join('') +
        '</tr>';
    document.getElementById('cuerpoTickets').innerHTML = fila.repeat(5);
}

async function cargarLista() {
    const cuerpo = document.getElementById('cuerpoTickets');
    const vacio = document.getElementById('estadoVacio');

    if (!cuerpo.querySelector('.fila-ticket')) {
        vacio.hidden = true;
        pintarSkeleton();
    }

    try {
        const data = await api('listar', filtrosActuales());
        if (data.result !== 'success') throw new Error(data.message || 'No se pudo cargar la lista.');

        pintarContadores(data.conteo || {});
        pintarTabla(data.tickets || []);
    } catch (error) {
        cuerpo.innerHTML = '';
        mostrarVacio(error.message);
    }
}

function mostrarVacio(mensaje) {
    const vacio = document.getElementById('estadoVacio');
    document.getElementById('estadoVacioTexto').textContent = mensaje;
    vacio.hidden = false;
}

function pintarContadores(conteo) {
    document.querySelectorAll('[data-contador]').forEach(nodo => {
        nodo.textContent = String(conteo[nodo.dataset.contador] || 0);
    });
}

function pintarTabla(tickets) {
    const cuerpo = document.getElementById('cuerpoTickets');

    if (!tickets.length) {
        cuerpo.innerHTML = '';
        mostrarVacio('No hay tickets con esos filtros.');
        return;
    }
    document.getElementById('estadoVacio').hidden = true;

    /* data-etiqueta: en móvil cada celda se apila y necesita el nombre
       de su columna. --i: la fila entra escalonada, sin animar el ancho. */
    cuerpo.innerHTML = tickets.map((t, i) =>
        '<tr class="fila-ticket" data-numero="' + esc(t.numero) + '" tabindex="0" style="--i:' + Math.min(i, 12) + '" aria-label="Abrir ticket ' + esc(t.numero) + '">' +
        '<td data-etiqueta="Número"><span class="numero">' + esc(t.numero) + '</span></td>' +
        '<td data-etiqueta="Cliente">' + esc(t.nombre) + '</td>' +
        '<td class="asunto" data-etiqueta="Asunto" title="' + esc(t.asunto) + '">' + esc(t.asunto) + '</td>' +
        '<td data-etiqueta="Categoría">' + esc(t.categoria) + '</td>' +
        '<td data-etiqueta="Prioridad"><span class="badge ' + clasePrioridad(t.prioridad) + '">' + esc(t.prioridad) + '</span></td>' +
        '<td data-etiqueta="Estado"><span class="badge ' + claseEstado(t.estado) + '">' + esc(t.estado) + '</span></td>' +
        '<td class="actualizado" data-etiqueta="Actualizado">' + esc(fechaCorta(t.ultimaActualizacion)) + '</td>' +
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
        notificar(error.message);
    }
}

function pintarModal(data) {
    const t = data.ticket;
    const contenedor = document.getElementById('contenedorModal');
    const eraNuevo = !contenedor.firstElementChild;

    /* El modal se re-renderiza tras cambiar estado o responder:
       la conversación no debe saltar ni perder la casilla interna.
       El borrador se conserva solo cuando sigue teniendo sentido
       (enviar la respuesta ya lo limpia antes de volver a pintar). */
    const cuerpoPrevio = contenedor.querySelector('.modal-cuerpo');
    const scrollPrevio = cuerpoPrevio ? cuerpoPrevio.scrollTop : 0;
    const alFinal = cuerpoPrevio
        ? cuerpoPrevio.scrollTop + cuerpoPrevio.clientHeight >= cuerpoPrevio.scrollHeight - 24
        : false;
    const nota = contenedor.querySelector('#respuestaAgente');
    const borrador = nota ? nota.value : '';
    const interno = contenedor.querySelector('#chkInterno');
    const marcadoInterno = interno ? interno.checked : false;
    const enfocado = document.activeElement;
    const focoPrevio = (enfocado && enfocado.id) ? enfocado.id : ultimoFoco;
    ultimoFoco = '';

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
                    '<label class="etiqueta-control" for="selEstado">Estado del ticket</label>' +
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
                            '<span class="cargando" aria-hidden="true"></span>' +
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

    const cuerpo = contenedor.querySelector('.modal-cuerpo');
    const notaNueva = contenedor.querySelector('#respuestaAgente');
    notaNueva.value = borrador;
    const chkNuevo = contenedor.querySelector('#chkInterno');
    chkNuevo.checked = marcadoInterno;

    if (eraNuevo) {
        /* preventScroll: sin él, enfocar el área de respuesta
           desplaza la página detrás del modal. */
        notaNueva.focus({ preventScroll: true });
    } else {
        cuerpo.scrollTop = alFinal ? cuerpo.scrollHeight : scrollPrevio;
        const anterior = focoPrevio ? contenedor.querySelector('#' + CSS.escape(focoPrevio)) : null;
        if (anterior) anterior.focus({ preventScroll: true });
    }

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
    const numero = ticketAbierto;
    document.getElementById('contenedorModal').innerHTML = '';
    document.removeEventListener('keydown', teclaEscape);
    document.body.style.overflow = '';
    ticketAbierto = null;

    /* Devuelve el foco a la fila con la que se abrió; sin esto el Tab
       volvería a arrancar desde el principio de la página. */
    const fila = numero
        ? document.querySelector('#cuerpoTickets [data-numero="' + CSS.escape(numero) + '"]')
        : null;
    if (fila) fila.focus({ preventScroll: true });
}

async function cambiarEstado() {
    if (!ticketAbierto) return;
    const nuevoEstado = document.getElementById('selEstado').value;
    cargando('btnCambiarEstado', true);
    try {
        const data = await api('estado', { numero: ticketAbierto, estado: nuevoEstado });
        if (data.result !== 'success') throw new Error(data.message || 'No se pudo cambiar el estado.');
        await abrirDetalle(ticketAbierto);
        await cargarLista();
        notificar('Estado actualizado a ' + nuevoEstado + '.', 'ok');
    } catch (error) {
        notificar(error.message);
    } finally {
        cargando('btnCambiarEstado', false);
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
        notificar(interno ? 'Nota interna guardada.' : 'Respuesta enviada al cliente.', 'ok');
    } catch (error) {
        notificar(error.message);
    } finally {
        cargando('btnEnviarRespuesta', false);
    }
}

/* El aviso de carga del listado: el botón se queda con su icono y la
   tabla no se vacía, así que el único feedback honesto es el propio
   botón. */
async function refrescar(boton) {
    cargando(boton, true);
    try {
        await cargarLista();
    } finally {
        cargando(boton, false);
    }
}

/* ===== INICIALIZACION ===== */

document.addEventListener('DOMContentLoaded', () => {
    const nombre = sessionStorage.getItem('sb_sd_nombre') || 'Agente';
    document.getElementById('userNombre').textContent = nombre;
    document.getElementById('userAvatar').textContent = nombre.charAt(0).toUpperCase();

    document.getElementById('btnLogout').addEventListener('click', cerrarSesion);
    document.getElementById('btnActualizar').addEventListener('click', () => refrescar('btnActualizar'));
    document.getElementById('btnFiltrar').addEventListener('click', () => refrescar('btnFiltrar'));

    document.getElementById('fBusca').addEventListener('keydown', e => {
        if (e.key === 'Enter') refrescar('btnFiltrar');
    });

    document.querySelectorAll('.stat-chip').forEach(chip => {
        chip.addEventListener('click', () => aplicarFiltroDesdeChip(chip));
    });

    cargarLista();
});
