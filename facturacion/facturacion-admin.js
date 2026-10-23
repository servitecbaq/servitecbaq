/* ============================================
   SERVITECBAQ · CARTERA Y COTIZACIONES
   Vista de estado de pago, anulación y
   conversión cotización → cuenta de cobro.
   Habla con el mismo Apps Script que facturacion.js
   y reutiliza sus helper globales (api, esc, TIPOS).
   ============================================ */

const ESTADO_CLASE = {
    'Pendiente':  'pendiente',
    'Pagada':     'pagada',
    'Anulada':    'anulada',
    'Convertida': 'convertida',
    'Aceptada':   'aceptada',
    'Rechazada':  'rechazada'
};

let focoAnterior = null;

// ===== INICIALIZACIÓN =====
document.addEventListener('DOMContentLoaded', () => {
    inicializarVistas();
    inicializarFiltros();

    const actualizar = document.getElementById('btnActualizarCartera');
    if (actualizar) actualizar.addEventListener('click', cargarCartera);

    const actualizarCot = document.getElementById('btnActualizarCotizaciones');
    if (actualizarCot) actualizarCot.addEventListener('click', cargarCotizaciones);

    const contenedor = document.getElementById('contenedorModal');
    if (contenedor) contenedor.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') cerrarModal();
    });
});

// ===== CAMBIAR DE VISTA =====
function inicializarVistas() {
    const tabs = [...document.querySelectorAll('.vista-tab')];
    if (!tabs.length) return;

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => {
                const activo = t === tab;
                t.classList.toggle('is-active', activo);
                t.setAttribute('aria-selected', activo ? 'true' : 'false');
                const vista = document.getElementById(t.getAttribute('aria-controls'));
                if (vista) vista.hidden = !activo;
            });

            const id = tab.getAttribute('aria-controls');
            if (id === 'vistaCartera' && !tab.dataset.cargada) cargarCartera();
            if (id === 'vistaCotizaciones' && !tab.dataset.cargada) cargarCotizaciones();
            tab.dataset.cargada = '1';
        });
    });
}

function inicializarFiltros() {
    [['carteraBusca', 'carteraEstado', cargarCartera],
     ['cotBusca', 'cotEstado', cargarCotizaciones]].forEach(([campo, estado, recargar]) => {
        const el1 = document.getElementById(campo);
        const el2 = document.getElementById(estado);
        let timer = null;
        const programar = () => { clearTimeout(timer); timer = setTimeout(recargar, 350); };
        if (el1) el1.addEventListener('input', programar);
        if (el2) el2.addEventListener('change', recargar);
    });
}

// ===== CARTERA =====
async function cargarCartera() {
    const cuerpo = document.getElementById('cuerpoCartera');
    if (!cuerpo) return;

    const q = document.getElementById('carteraBusca').value.trim();
    const estado = document.getElementById('carteraEstado').value;

    cuerpo.innerHTML = filaEsperando('Consultando la hoja…', 7);

    try {
        const data = await api('listarCuentas', { tipo: 'Cuenta', estado, q, limite: 300 });
        if (data.result !== 'success') throw new Error(data.message || 'Respuesta inesperada');

        pintarResumenCartera(data);
        pintarTabla(cuerpo, data.cuentas, 'cuenta', 7);
    } catch (error) {
        console.error('Error al cargar la cartera:', error);
        cuerpo.innerHTML = filaEsperando('No se pudo leer la cartera. Vuelve a iniciar sesión o revisa la conexión.', 7);
    }
}

function pintarResumenCartera(data) {
    const caja = document.getElementById('carteraResumen');
    if (!caja) return;

    const pendienteHoy = data.cuentas.reduce((s, c) => s + (c.estado === 'Pendiente' ? c.total : 0), 0);

    caja.innerHTML = `
        <span class="chip chip-pendiente">Por cobrar (global): <strong>${formatearMoneda(data.totalPendiente || 0)}</strong></span>
        <span class="chip">Mostrando: <strong>${data.cuentas.length}</strong> de ${data.count}</span>
        <span class="chip">En esta lista: <strong>${formatearMoneda(pendienteHoy)}</strong></span>
    `;
}

// ===== COTIZACIONES =====
async function cargarCotizaciones() {
    const cuerpo = document.getElementById('cuerpoCotizaciones');
    if (!cuerpo) return;

    const q = document.getElementById('cotBusca').value.trim();
    const estado = document.getElementById('cotEstado').value;

    cuerpo.innerHTML = filaEsperando('Consultando la hoja…', 6);

    try {
        const data = await api('listarCuentas', { tipo: 'Cotización', estado, q, limite: 300 });
        if (data.result !== 'success') throw new Error(data.message || 'Respuesta inesperada');
        pintarTabla(cuerpo, data.cuentas, 'cotizacion', 6);
    } catch (error) {
        console.error('Error al cargar las cotizaciones:', error);
        cuerpo.innerHTML = filaEsperando('No se pudo leer la hoja. Revisa la conexión.', 6);
    }
}

// ===== TABLA =====
function filaEsperando(mensaje, columnas) {
    return `<tr><td class="tabla-esperando" colspan="${columnas}">${esc(mensaje)}</td></tr>`;
}

function pintarTabla(cuerpo, cuentas, vista, columnas) {
    if (!cuentas.length) {
        cuerpo.innerHTML = filaEsperando('No hay documentos con este filtro.', columnas);
        return;
    }

    cuerpo.innerHTML = cuentas.map((c, i) => `
        <tr>
            <th scope="row" class="celda-numero">${esc(c.numero)}</th>
            <td>${esc(c.fecha)}</td>
            <td>
                <div class="celda-cliente">${esc(c.cliente)}</div>
                <div class="celda-sub">${esc(c.documento)}</div>
            </td>
            <td class="celda-monto">${formatearMoneda(c.total)}</td>
            <td><span class="chip chip-${ESTADO_CLASE[c.estado] || 'pendiente'}">${esc(c.estado)}</span>${c.origen ? `<div class="celda-sub">${esc(c.origen)}</div>` : ''}</td>
            ${vista === 'cuenta' ? `<td class="celda-sub">${esc([c.fechaPago, c.medioPago].filter(Boolean).join(' · ')) || '—'}</td>` : ''}
            <td class="col-acciones">${botones(c, vista, i)}</td>
        </tr>
    `).join('');

    cuerpo.querySelectorAll('[data-accion]').forEach(btn => {
        btn.addEventListener('click', () => {
            const fila = cuentas[parseInt(btn.dataset.indice, 10)];
            const accion = btn.dataset.accion;
            if (accion === 'pagada')   pedirPago(fila);
            if (accion === 'anular')   confirmarAnulacion(fila);
            if (accion === 'reabrir')  cambiarEstado(fila, 'Pendiente', `¿Volver ${etiquetaDocumento(fila)} ${fila.numero} a Pendiente?`);
            if (accion === 'convertir') convertirCotizacion(fila);
            if (accion === 'aceptada')  cambiarEstado(fila, 'Aceptada', null);
            if (accion === 'rechazada') cambiarEstado(fila, 'Rechazada', null);
        });
    });
}

function etiquetaDocumento(f) {
    return f.tipo === 'Cotización' ? 'la cotización' : 'la cuenta de cobro';
}

function botones(c, vista, i) {
    const data = `data-indice="${i}"`;

    if (vista === 'cuenta') {
        if (c.estado === 'Pendiente') {
            return `<button type="button" class="btn-mini btn-mini-pago" ${data} data-accion="pagada">Marcar pagada</button>
                    <button type="button" class="btn-mini btn-mini-peligro" ${data} data-accion="anular">Anular</button>`;
        }
        if (c.estado === 'Pagada' || c.estado === 'Anulada') {
            return `<button type="button" class="btn-mini" ${data} data-accion="reabrir">Volver a pendiente</button>`;
        }
        return '';
    }

    if (c.estado === 'Convertida') return `<span class="chip chip-convertida">Ya generó ${esc(c.origen || 'una cuenta')}</span>`;
    if (c.estado === 'Anulada')    return `<button type="button" class="btn-mini" ${data} data-accion="reabrir">Reactivar</button>`;

    return `<button type="button" class="btn-mini btn-mini-pago" ${data} data-accion="convertir">Convertir en cuenta</button>
            <button type="button" class="btn-mini" ${data} data-accion="aceptada">Aceptada</button>
            <button type="button" class="btn-mini" ${data} data-accion="rechazada">Rechazada</button>`;
}

// ===== CAMBIOS DE ESTADO =====
async function cambiarEstado(fila, estado, mensaje) {
    if (mensaje && !confirm(mensaje)) return;

    try {
        const data = await api('actualizarEstado', { numero: fila.numero, estado });
        if (data.result !== 'success') throw new Error(data.message || 'Respuesta inesperada');
        recargarVistas();
    } catch (error) {
        console.error('Error al actualizar el estado:', error);
        alert('No se pudo actualizar: ' + error.message);
    }
}

function confirmarAnulacion(fila) {
    abrirModal({
        titulo: 'Anular documento',
        cuerpo: `<p>Se marcará <strong>${esc(fila.numero)}</strong> de ${esc(fila.cliente)} como <strong>Anulada</strong>.` +
                ` La fila queda en la hoja como registro; el número no se reutiliza.</p>`,
        confirmar: 'Sí, anular',
        peligro: true,
        onConfirmar: () => cambiarEstado(fila, 'Anulada', null)
    });
}

function pedirPago(fila) {
    const hoy = new Date().toISOString().slice(0, 10);

    abrirModal({
        titulo: 'Marcar como pagada',
        cuerpo: `
            <p><strong>${esc(fila.numero)}</strong> · ${esc(fila.cliente)} · ${formatearMoneda(fila.total)}</p>
            <div class="campo">
                <label for="modalFechaPago">Fecha del pago</label>
                <input type="date" id="modalFechaPago" value="${hoy}">
            </div>
            <div class="campo">
                <label for="modalMedioPago">Medio de pago</label>
                <select id="modalMedioPago">
                    <option value="Bancolombia">Bancolombia</option>
                    <option value="Nequi">Nequi</option>
                    <option value="Efectivo">Efectivo</option>
                    <option value="Transferencia">Transferencia</option>
                    <option value="Otro">Otro</option>
                </select>
            </div>`,
        confirmar: 'Guardar pago',
        onConfirmar: () => {
            const fechaPago = document.getElementById('modalFechaPago').value;
            const medioPago = document.getElementById('modalMedioPago').value;
            return api('actualizarEstado', { numero: fila.numero, estado: 'Pagada', fechaPago, medioPago })
                .then(data => {
                    if (data.result !== 'success') throw new Error(data.message || 'Respuesta inesperada');
                    recargarVistas();
                });
        }
    });
}

// ===== COTIZACIÓN → CUENTA DE COBRO =====
async function convertirCotizacion(fila) {
    if (!confirm(`¿Convertir la cotización ${fila.numero} en una cuenta de cobro?\n\n` +
                 `Se crea CC-hoy con el mismo cliente e importe, y la cotización queda como Convertida.`)) {
        return;
    }

    let data;
    try {
        data = await api('convertirCotizacion', { numero: fila.numero });
    } catch (error) {
        alert('No se pudo comunicar con el servidor: ' + error.message);
        return;
    }

    if (data.result !== 'success') {
        alert('No se pudo convertir: ' + (data.message || 'respuesta inesperada'));
        return;
    }

    try {
        await generarPDF(datosDesdeDocumento(data.documento), data.numero, 'Cuenta');
    } catch (error) {
        console.error('La cuenta se creó pero el PDF falló:', error);
        alert(`La cuenta ${data.numero} quedó registrada en la hoja, pero no se pudo descargar el PDF.\n` +
              'Puedes volver a generarla desde la cartera.');
    }

    recargarVistas();
}

// La hoja guarda los ítems como texto plano (formato que escribe
// enviarDatosAGoogle), así que hay que volver a armarlos para el PDF.
function parsearServicios(texto) {
    const entero = (v) => parseInt(String(v).replace(/[^\d]/g, ''), 10) || 0;

    return String(texto || '').split('\n').map(l => l.trim()).filter(Boolean).map(linea => {
        const partes = linea.split('|').map(p => p.trim());
        const campo = (nombre) => {
            const p = partes.find(x => x.indexOf(nombre + ':') === 0);
            return p ? p.slice(nombre.length + 1).trim() : '';
        };

        const cantidad = parseFloat(campo('Cant')) || 1;
        const valorUnitario = entero(campo('V.Unit'));
        const iva = parseFloat(campo('IVA')) || 0;
        const totalLinea = entero(campo('Total')) || Math.round(cantidad * valorUnitario * (1 + iva / 100));

        return {
            descripcion: (partes[0] || '').replace(/^\d+\.\s*/, ''),
            cantidad,
            valor_unitario: valorUnitario,
            iva_porcentaje: iva,
            total_linea: totalLinea
        };
    });
}

function datosDesdeDocumento(doc) {
    const emisor = (id) => {
        const el = document.getElementById(id);
        return el ? el.value : '';
    };

    return {
        emisor: {
            nombre:   emisor('emisor_nombre'),
            cedula:   emisor('emisor_documento'),
            telefono: emisor('emisor_telefono'),
            email:    emisor('emisor_email'),
            ciudad:   emisor('emisor_ciudad'),
            website:  emisor('emisor_website')
        },
        cliente: doc.cliente,
        servicios: parsearServicios(doc.servicios),
        totales: doc.totales,
        totalLetras: doc.totalLetras,
        observaciones: doc.observaciones,
        vigencia: doc.vigencia || 15,
        equipos: String(doc.equipos || '').split('\n').filter(Boolean),
        origen: doc.origen || '',
        fecha: new Date().toLocaleDateString('es-CO')
    };
}

// ===== RECARGAR =====
function recargarVistas() {
    const carteraActiva = !document.getElementById('vistaCartera').hidden;
    const cotActiva = !document.getElementById('vistaCotizaciones').hidden;

    // Cada pestaña se carga una sola vez; como el servidor acaba de cambiar,
    // la vista oculta tiene que volver a pedirse cuando se active.
    document.querySelectorAll('.vista-tab').forEach(t => { delete t.dataset.cargada; });

    if (carteraActiva) cargarCartera();
    if (cotActiva) cargarCotizaciones();
    refrescarNumero();
}

// ===== MODAL =====
function abrirModal({ titulo, cuerpo, confirmar, onConfirmar, peligro }) {
    cerrarModal();
    focoAnterior = document.activeElement;

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'modalTitulo');
    overlay.innerHTML = `
        <div class="modal-box">
            <h3 id="modalTitulo">${esc(titulo)}</h3>
            <div class="modal-cuerpo">${cuerpo}</div>
            <div class="modal-actions">
                <button type="button" class="btn-cancelar" id="modalCancelar">Cancelar</button>
                <button type="button" class="${peligro ? 'btn-confirmar btn-peligro' : 'btn-confirmar'}" id="modalConfirmar">${esc(confirmar)}</button>
            </div>
        </div>
    `;

    document.getElementById('contenedorModal').appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('active'));

    overlay.querySelector('#modalCancelar').addEventListener('click', cerrarModal);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) cerrarModal(); });

    overlay.querySelector('#modalConfirmar').addEventListener('click', async (e) => {
        e.target.disabled = true;
        try {
            await onConfirmar();
        } catch (error) {
            console.error(error);
            alert('No se pudo completar la acción: ' + error.message);
        } finally {
            cerrarModal();
        }
    });

    const inicial = overlay.querySelector('input, select') || overlay.querySelector('#modalConfirmar');
    if (inicial) inicial.focus();
}

function cerrarModal() {
    const overlay = document.querySelector('#contenedorModal .modal-overlay');
    if (!overlay) return;

    overlay.classList.remove('active');
    setTimeout(() => overlay.remove(), 200);
    if (focoAnterior && focoAnterior.isConnected) focoAnterior.focus();
}
