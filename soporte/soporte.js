/* ============================================
   SERVITECBAQ · SERVICE DESK · PORTAL PUBLICO
   Crear ticket, consultar con numero + codigo,
   responder. Todo por POST al Apps Script.
   ============================================ */

// Reemplaza esta URL con la de tu Apps Script de service desk
// (Implementar > Nueva implementacion > Cualquier usuario).
const GOOGLE_SCRIPT_URL = '';

const CLAVE_TICKETS = 'sb_sd_tickets';

/* ===== API ===== */

// En localhost permite apuntar a un mock con ?api=http://localhost:8841
// para probar sin backend. En produccion siempre usa GOOGLE_SCRIPT_URL.
function apiBase() {
    if ((location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
        const alt = new URLSearchParams(location.search).get('api');
        if (alt) return alt;
    }
    return GOOGLE_SCRIPT_URL;
}

async function api(accion, parametros) {
    const base = apiBase();
    if (!base) throw new Error('Falta la URL del Apps Script: pega el /exec en GOOGLE_SCRIPT_URL de soporte/soporte.js.');

    const cuerpo = new URLSearchParams();
    cuerpo.append('accion', accion);
    Object.keys(parametros || {}).forEach(k => {
        if (parametros[k] !== '' && parametros[k] != null) cuerpo.append(k, parametros[k]);
    });

    const respuesta = await fetch(base, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: cuerpo.toString()
    });
    return respuesta.json();
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

function mostrarError(id, mensaje) {
    const caja = document.getElementById(id);
    caja.textContent = mensaje;
    caja.style.display = 'block';
}

function ocultarError(id) {
    document.getElementById(id).style.display = 'none';
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

async function copiarTexto(texto, boton) {
    try {
        await navigator.clipboard.writeText(texto);
    } catch (e) {
        const aux = document.createElement('textarea');
        aux.value = texto;
        document.body.appendChild(aux);
        aux.select();
        document.execCommand('copy');
        aux.remove();
    }
    const original = boton.textContent;
    boton.textContent = 'Copiado';
    setTimeout(() => { boton.textContent = original; }, 1500);
}

/* ===== VISTAS ===== */

function mostrarVista(nombre) {
    document.querySelectorAll('.vista').forEach(v => { v.hidden = true; });
    const vista = document.getElementById('vista' + nombre.charAt(0).toUpperCase() + nombre.slice(1));
    if (vista) vista.hidden = false;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    ocultarError('crearError');
    ocultarError('consultaError');
}

/* ===== MIS TICKETS (localStorage) ===== */

function leerMisTickets() {
    try {
        return JSON.parse(localStorage.getItem(CLAVE_TICKETS) || '[]');
    } catch (e) {
        return [];
    }
}

function guardarMisTickets(lista) {
    localStorage.setItem(CLAVE_TICKETS, JSON.stringify(lista));
}

function recordarTicket(numero, codigo) {
    const lista = leerMisTickets().filter(t => t.numero !== numero);
    lista.unshift({ numero, codigo });
    guardarMisTickets(lista.slice(0, 8));
    pintarMisTickets();
}

function pintarMisTickets() {
    const bloque = document.getElementById('misTicketsBloque');
    const chips = document.getElementById('misTicketsChips');
    const lista = leerMisTickets();
    if (!lista.length) {
        bloque.hidden = true;
        chips.innerHTML = '';
        return;
    }
    bloque.hidden = false;
    chips.innerHTML = lista.map(t =>
        '<button type="button" class="chip-ticket" data-numero="' + esc(t.numero) + '" data-codigo="' + esc(t.codigo) + '">' +
        '<svg viewBox="0 0 24 24" fill="none" class="hic" aria-hidden="true"><path d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 0 1 0 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 0 1 0-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
        esc(t.numero) + '</button>'
    ).join('');
    chips.querySelectorAll('.chip-ticket').forEach(btn => {
        btn.addEventListener('click', () => {
            document.getElementById('cNumero').value = btn.dataset.numero;
            document.getElementById('cCodigo').value = btn.dataset.codigo;
            consultar();
        });
    });
}

/* ===== CREAR TICKET ===== */

let ultimoTicket = null;

async function crearTicket(evento) {
    evento.preventDefault();

    const nombre = document.getElementById('tNombre').value.trim();
    const email = document.getElementById('tEmail').value.trim();
    const telefono = document.getElementById('tTelefono').value.trim();
    const categoria = document.getElementById('tCategoria').value;
    const prioridad = (document.querySelector('input[name="prioridad"]:checked') || {}).value || 'Media';
    const asunto = document.getElementById('tAsunto').value.trim();
    const descripcion = document.getElementById('tDescripcion').value.trim();
    const sitio = document.getElementById('tSitio').value.trim();

    ocultarError('crearError');

    if (nombre.length < 3) return mostrarError('crearError', 'Escribe tu nombre completo.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return mostrarError('crearError', 'Escribe un correo válido.');
    if (!categoria) return mostrarError('crearError', 'Elige una categoría.');
    if (asunto.length < 8) return mostrarError('crearError', 'El asunto debe tener al menos 8 caracteres.');
    if (descripcion.length < 20) return mostrarError('crearError', 'Describe el problema con más detalle (mínimo 20 caracteres).');

    cargando('btnEnviarTicket', true);
    try {
        const data = await api('crearTicket', { nombre, email, telefono, categoria, prioridad, asunto, descripcion, sitio });
        if (data.result !== 'success') throw new Error(data.message || 'No se pudo crear el ticket.');

        document.getElementById('exitoNumero').textContent = data.numero;
        document.getElementById('exitoCodigo').textContent = data.codigo;
        ultimoTicket = { numero: data.numero, codigo: data.codigo };
        recordarTicket(data.numero, data.codigo);
        document.getElementById('formTicket').reset();
        mostrarVista('exito');
    } catch (error) {
        mostrarError('crearError', error.message);
    } finally {
        cargando('btnEnviarTicket', false);
    }
}

/* ===== CONSULTAR ===== */

async function consultar() {
    const numero = document.getElementById('cNumero').value.trim().toUpperCase();
    const codigo = document.getElementById('cCodigo').value.trim();

    ocultarError('consultaError');
    if (!numero || !codigo) return mostrarError('consultaError', 'Ingresa el número y el código de tu ticket.');

    cargando('btnConsultar', true);
    try {
        const data = await api('consultar', { numero, codigo });
        if (data.result !== 'success') throw new Error(data.message || 'No se pudo consultar el ticket.');
        pintarResultado(data);
        recordarTicket(numero, codigo);
    } catch (error) {
        mostrarError('consultaError', error.message);
        document.getElementById('resultadoConsulta').hidden = true;
    } finally {
        cargando('btnConsultar', false);
    }
}

function pintarResultado(data) {
    const t = data.ticket;
    document.getElementById('resNumero').textContent = t.numero;

    const estado = document.getElementById('resEstado');
    estado.textContent = t.estado;
    estado.className = 'badge ' + claseEstado(t.estado);

    const prioridad = document.getElementById('resPrioridad');
    prioridad.textContent = t.prioridad;
    prioridad.className = 'badge ' + clasePrioridad(t.prioridad);

    document.getElementById('resFecha').innerHTML =
        '<svg class="hic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 6V12H16.5M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"/></svg>' +
        esc(formatearFecha(t.fecha));
    document.getElementById('resCategoria').innerHTML =
        '<svg class="hic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11.4194 15.1694L17.25 21C18.2855 22.0355 19.9645 22.0355 21 21C22.0355 19.9645 22.0355 18.2855 21 17.25L15.1233 11.3733M11.4194 15.1694L13.9155 12.1383C14.2315 11.7546 14.6542 11.5132 15.1233 11.3733M11.4194 15.1694L6.76432 20.8219C6.28037 21.4096 5.55897 21.75 4.79768 21.75C3.39064 21.75 2.25 20.6094 2.25 19.2023C2.25 18.441 2.59044 17.7196 3.1781 17.2357L10.0146 11.6056M15.1233 11.3733C15.6727 11.2094 16.2858 11.1848 16.8659 11.2338C16.9925 11.2445 17.1206 11.25 17.25 11.25C19.7353 11.25 21.75 9.23528 21.75 6.75C21.75 6.08973 21.6078 5.46268 21.3523 4.89779L18.0762 8.17397C16.9605 7.91785 16.0823 7.03963 15.8262 5.92397L19.1024 2.64774C18.5375 2.39223 17.9103 2.25 17.25 2.25C14.7647 2.25 12.75 4.26472 12.75 6.75C12.75 6.87938 12.7555 7.00749 12.7662 7.13411C12.8571 8.20956 12.6948 9.39841 11.8617 10.0845L11.7596 10.1686M10.0146 11.6056L5.90901 7.5H4.5L2.25 3.75L3.75 2.25L7.5 4.5V5.90901L11.7596 10.1686M10.0146 11.6056L11.7596 10.1686M18.375 18.375L15.75 15.75M4.86723 19.125H4.87473V19.1325H4.86723V19.125Z"/></svg>' +
        esc(t.categoria);
    document.getElementById('resAsunto').textContent = t.asunto;

    const timeline = document.getElementById('resTimeline');
    timeline.innerHTML = (data.mensajes || []).map(m => {
        const esAgente = m.autor === 'Agente';
        return '<div class="burbuja ' + (esAgente ? 'burbuja-agente' : 'burbuja-cliente') + '">' +
            '<span class="meta">' + esc(esAgente ? 'Servitecbaq' : m.nombre) + ' · ' + esc(formatearFecha(m.fecha)) + '</span>' +
            esc(m.mensaje) + '</div>';
    }).join('');

    const cerrado = t.estado === 'Cerrado';
    document.getElementById('resCerrado').hidden = !cerrado;
    document.getElementById('resResponder').hidden = cerrado;

    document.getElementById('resultadoConsulta').hidden = false;
    document.getElementById('resultadoConsulta').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function responder() {
    const numero = document.getElementById('cNumero').value.trim().toUpperCase();
    const codigo = document.getElementById('cCodigo').value.trim();
    const mensaje = document.getElementById('respuestaMensaje').value.trim();
    const ok = document.getElementById('respuestaOk');

    ok.style.display = 'none';
    if (mensaje.length < 3) return mostrarError('consultaError', 'Escribe tu respuesta antes de enviarla.');

    cargando('btnResponder', true);
    try {
        const data = await api('responder', { numero, codigo, mensaje });
        if (data.result !== 'success') throw new Error(data.message || 'No se pudo enviar la respuesta.');
        document.getElementById('respuestaMensaje').value = '';
        ok.textContent = 'Respuesta enviada.';
        ok.style.display = 'block';
        setTimeout(() => { ok.style.display = 'none'; }, 3000);
        await consultar();
    } catch (error) {
        mostrarError('consultaError', error.message);
    } finally {
        cargando('btnResponder', false);
    }
}

/* ===== INICIALIZACION ===== */

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('formTicket');
    if (form) form.addEventListener('submit', crearTicket);

    document.getElementById('btnIrCrear').addEventListener('click', () => mostrarVista('crear'));
    document.getElementById('btnIrConsulta').addEventListener('click', () => mostrarVista('consulta'));
    document.getElementById('btnConsultar').addEventListener('click', consultar);
    document.getElementById('btnResponder').addEventListener('click', responder);
    document.getElementById('btnVerMiTicket').addEventListener('click', () => {
        if (ultimoTicket) {
            document.getElementById('cNumero').value = ultimoTicket.numero;
            document.getElementById('cCodigo').value = ultimoTicket.codigo;
        }
        mostrarVista('consulta');
        consultar();
    });
    document.getElementById('btnOtroTicket').addEventListener('click', () => mostrarVista('crear'));

    document.querySelectorAll('.volver-vista').forEach(link => {
        link.addEventListener('click', e => {
            e.preventDefault();
            mostrarVista(link.dataset.vista);
        });
    });

    document.querySelectorAll('.btn-copiar').forEach(btn => {
        btn.addEventListener('click', () => {
            const destino = document.getElementById(btn.dataset.copia);
            if (destino) copiarTexto(destino.textContent, btn);
        });
    });

    document.getElementById('cNumero').addEventListener('input', e => {
        e.target.value = e.target.value.toUpperCase();
    });

    pintarMisTickets();
});
