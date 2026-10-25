/* ============================================
   SERVITECBAQ · GENERADOR DE CUENTAS DE COBRO
   
   Este módulo NO es facturación electrónica.
   Genera cuentas de cobro en PDF, que son el
   documento correcto para personas naturales
   no responsables de IVA según la DIAN.
   
   Genera cuentas de cobro y cotizaciones en PDF; la cuenta de
   cobro es el documento correcto para personas naturales no
   responsables de IVA según la DIAN.

   Guarda un registro automático en Google Sheets vía Apps Script
   (fetch por POST: el token de sesión nunca viaja en la URL).

   Numeración: CC-AAAAMMDD#### y COT-AAAAMMDD####
   La asigna el servidor bajo LockService; el navegador solo mostra
   una previsión. Ejemplo: CC-202610080001
   ============================================ */

// ===== CONFIGURACIÓN =====
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzJjXoPmpuN5fHB_uE1rA7AJXplPA7-z0MoKqPh8Qu0XX8j3BtfpkXhAvFZPqeR0XDpIw/exec';

// ===== DATOS POR DEFECTO DEL EMISOR =====
const EMISOR_DEFAULT = {
    nombre: 'David Fragozo',
    cedula: '1143260112',
    telefono: '315 850 5020',
    email: 'soporte@servitecbaq.com',
    ciudad: 'Barranquilla, Atlántico',
    website: 'https://servitecbaq.com'
};

// ===== DATOS BANCARIOS =====
const DATOS_BANCARIOS = {
    bancolombia: {
        banco: 'Bancolombia',
        tipo: 'Cuenta de Ahorros',
        numero: '478 0000 1250',
        titular: 'David Fragozo',
        cedula: '1143260112'
    },
    nequi: {
        celular: '314 686 4986',
        titular: 'David Fragozo'
    }
};

// ===== INICIALIZACIÓN =====
document.addEventListener('DOMContentLoaded', () => {
    const hoy = new Date();
    const fechaFormateada = hoy.toLocaleDateString('es-CO', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    const fechaActual = document.getElementById('fechaActual');
    if (fechaActual) fechaActual.textContent = fechaFormateada;

    const fechaStat = document.getElementById('fechaStat');
    if (fechaStat) {
        fechaStat.textContent = hoy.toLocaleDateString('es-CO', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    }

    const emisorDoc = document.getElementById('emisor_documento');
    if (emisorDoc && emisorDoc.value === 'TU_CEDULA_AQUI') {
        emisorDoc.value = EMISOR_DEFAULT.cedula;
    }

    agregarFila();

    const form = document.getElementById('formFactura');
    if (form) form.addEventListener('submit', manejarEnvio);
    
    // Mostrar datos del usuario logueado
    mostrarUsuarioLogueado();

    inicializarTipoDocumento();
    inicializarClienteHistorial();
    inicializarEquipos();
    refrescarNumero();

    // Inicializar botón de logout
    inicializarBotonLogout();
});

// ===== BOTÓN DE CERRAR SESIÓN =====
function inicializarBotonLogout() {
    const btnLogout = document.getElementById('btnLogout');
    if (!btnLogout) return;

    btnLogout.addEventListener('click', () => {
        if (confirm('¿Seguro que quieres cerrar sesión?')) {
            sessionStorage.removeItem('sb_autenticado');
            sessionStorage.removeItem('sb_usuario');
            sessionStorage.removeItem('sb_login_time');
            sessionStorage.removeItem('sb_token');
            window.location.href = 'login.html';
        }
    });
}

// ===== AGREGAR FILA DE SERVICIO =====
function agregarFila(descripcion = '', cantidad = 1, valor = 0, iva = 0) {
    const tbody = document.getElementById('cuerpoServicios');
    if (!tbody) return;

    const fila = document.createElement('tr');

    fila.innerHTML = `
        <td>
            <input type="text" name="descripcion[]"
                   aria-label="Descripción del servicio"
                   value="${esc(descripcion)}"
                   placeholder="Ej: Mantenimiento preventivo" required>
        </td>
        <td data-etiqueta="Cantidad">
            <input type="number" name="cantidad[]"
                   aria-label="Cantidad"
                   value="${esc(cantidad)}" min="0.01" step="0.01"
                   onchange="calcularTotales()" oninput="calcularTotales()">
        </td>
        <td data-etiqueta="Valor unitario">
            <input type="number" name="valor[]"
                   aria-label="Valor unitario"
                   value="${esc(valor)}" min="0" step="0.01"
                   onchange="calcularTotales()" oninput="calcularTotales()">
        </td>
        <td data-etiqueta="IVA %">
            <input type="number" name="iva[]"
                   aria-label="IVA porcentaje"
                   value="${esc(iva)}" min="0" max="100" step="0.01"
                   onchange="calcularTotales()" oninput="calcularTotales()">
        </td>
        <td class="total-linea" data-etiqueta="Total de la línea">$0</td>
        <td>
            <button type="button" class="btn-eliminar" aria-label="Quitar este servicio"
                    onclick="eliminarFila(this)"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg></button>
        </td>
    `;

    tbody.appendChild(fila);
    calcularTotales();
}

// ===== ELIMINAR FILA =====
function eliminarFila(boton) {
    const filas = document.querySelectorAll('#cuerpoServicios tr');
    if (filas.length === 1) {
        alert('Debe haber al menos un servicio.');
        return;
    }
    boton.closest('tr').remove();
    calcularTotales();
}

// ===== CALCULAR TOTALES =====
function calcularTotales() {
    let subtotal = 0;
    let ivaTotal = 0;

    const filas = document.querySelectorAll('#cuerpoServicios tr');

    filas.forEach(fila => {
        const cantidad = parseFloat(fila.querySelector('[name="cantidad[]"]').value) || 0;
        const valor    = parseFloat(fila.querySelector('[name="valor[]"]').value) || 0;
        const iva      = parseFloat(fila.querySelector('[name="iva[]"]').value) || 0;

        const base       = cantidad * valor;
        const ivaLinea   = base * (iva / 100);
        const totalLinea = base + ivaLinea;

        fila.querySelector('.total-linea').textContent = formatearMoneda(totalLinea);

        subtotal += base;
        ivaTotal += ivaLinea;
    });

    const total = subtotal + ivaTotal;

    document.getElementById('subtotal').textContent = formatearMoneda(subtotal);
    document.getElementById('iva').textContent      = formatearMoneda(ivaTotal);
    document.getElementById('total').textContent    = formatearMoneda(total);

    const totalLetras = document.getElementById('totalLetras');
    if (totalLetras) {
        totalLetras.textContent = total > 0 ? numeroALetras(total) : '—';
    }

    const totalStat = document.getElementById('totalStat');
    if (totalStat) totalStat.textContent = formatearMoneda(total);

    const contador = document.getElementById('contadorServicios');
    if (contador) {
        const n = filas.length;
        contador.textContent = `${n} ${n === 1 ? 'item' : 'items'}`;
    }
}

// ===== FORMATEAR MONEDA (EN PANTALLA) =====
function formatearMoneda(valor) {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(valor);
}

// ===== FORMATEAR MONEDA PARA PDF (MANUAL) =====
function formatearMonedaPDF(valor) {
    const num = Math.round(valor);
    const str = Math.abs(num).toString();
    let resultado = '';
    let contador = 0;

    for (let i = str.length - 1; i >= 0; i--) {
        resultado = str[i] + resultado;
        contador++;
        if (contador === 3 && i > 0) {
            resultado = '.' + resultado;
            contador = 0;
        }
    }

    if (num < 0) resultado = '-' + resultado;

    return '$' + resultado;
}

// ===== CONVERTIR NÚMERO A LETRAS =====
function numeroALetras(numero) {
    const entero = Math.floor(numero);
    const centavos = Math.round((numero - entero) * 100);

    let letras = convertirEntero(entero);

    if (centavos > 0) {
        letras += ` CON ${centavos.toString().padStart(2, '0')}/100`;
    }

    return letras + ' PESOS';
}

function convertirEntero(numero) {
    if (numero === 0) return 'CERO';

    const UNIDADES = ['', 'UNO', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE'];
    const DECENAS   = ['', 'DIEZ', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'];
    const ESPECIALES = {
        11: 'ONCE', 12: 'DOCE', 13: 'TRECE', 14: 'CATORCE', 15: 'QUINCE',
        16: 'DIECISÉIS', 17: 'DIECISIETE', 18: 'DIECIOCHO', 19: 'DIECINUEVE',
        21: 'VEINTIUNO', 22: 'VEINTIDÓS', 23: 'VEINTITRÉS', 24: 'VEINTICUATRO',
        25: 'VEINTICINCO', 26: 'VEINTISÉIS', 27: 'VEINTISIETE', 28: 'VEINTIOCHO', 29: 'VEINTINUEVE'
    };
    const CENTENAS = ['', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS',
                      'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS'];

    function convertirGrupo(n) {
        if (n === 0) return '';
        if (n === 100) return 'CIEN';

        let resultado = '';
        const centena = Math.floor(n / 100);
        const resto = n % 100;

        if (centena > 0) {
            resultado += CENTENAS[centena];
            if (resto > 0) resultado += ' ';
        }

        if (resto > 0) {
            if (ESPECIALES[resto]) {
                resultado += ESPECIALES[resto];
            } else if (resto < 10) {
                resultado += UNIDADES[resto];
            } else {
                const decena = Math.floor(resto / 10);
                const unidad = resto % 10;
                resultado += DECENAS[decena];
                if (unidad > 0) {
                    resultado += ' Y ' + UNIDADES[unidad];
                }
            }
        }
        return resultado;
    }

    if (numero >= 1000000) {
        const millones = Math.floor(numero / 1000000);
        const resto = numero % 1000000;

        let textoMillones;
        if (millones === 1) {
            textoMillones = 'UN MILLÓN';
        } else {
            textoMillones = convertirGrupo(millones) + ' MILLONES';
        }

        if (resto > 0) {
            return textoMillones + ' ' + convertirEntero(resto);
        }
        return textoMillones;
    }

    if (numero >= 1000) {
        const miles = Math.floor(numero / 1000);
        const resto = numero % 1000;

        let textoMiles;
        if (miles === 1) {
            textoMiles = 'MIL';
        } else {
            textoMiles = convertirGrupo(miles) + ' MIL';
        }

        if (resto > 0) {
            return textoMiles + ' ' + convertirGrupo(resto);
        }
        return textoMiles;
    }

    return convertirGrupo(numero);
}

// ===== RECOLECTAR DATOS =====
function recolectarDatos() {
    const servicios = [];

    document.querySelectorAll('#cuerpoServicios tr').forEach(fila => {
        const cantidad = parseFloat(fila.querySelector('[name="cantidad[]"]').value) || 0;
        const valor    = parseFloat(fila.querySelector('[name="valor[]"]').value) || 0;
        const iva      = parseFloat(fila.querySelector('[name="iva[]"]').value) || 0;
        const base     = cantidad * valor;

        servicios.push({
            descripcion: fila.querySelector('[name="descripcion[]"]').value.trim(),
            cantidad: cantidad,
            valor_unitario: valor,
            iva_porcentaje: iva,
            total_linea: base + (base * iva / 100)
        });
    });

    const subtotalTexto = document.getElementById('subtotal').textContent;
    const ivaTexto = document.getElementById('iva').textContent;
    const totalTexto = document.getElementById('total').textContent;

    return {
        emisor: {
            nombre:   document.getElementById('emisor_nombre').value,
            cedula:   document.getElementById('emisor_documento').value,
            telefono: document.getElementById('emisor_telefono').value,
            email:    document.getElementById('emisor_email').value,
            ciudad:   document.getElementById('emisor_ciudad').value,
            website:  document.getElementById('emisor_website').value
        },
        cliente: {
            nombre:    document.getElementById('cliente_nombre').value.trim(),
            tipoDoc:   document.getElementById('cliente_tipo_doc').value,
            documento: document.getElementById('cliente_documento').value.trim(),
            email:     document.getElementById('cliente_email').value.trim(),
            telefono:  document.getElementById('cliente_telefono').value.trim(),
            direccion: document.getElementById('cliente_direccion').value.trim()
        },
        servicios: servicios,
        totales: {
            subtotal: parsearMoneda(subtotalTexto),
            iva:      parsearMoneda(ivaTexto),
            total:    parsearMoneda(totalTexto)
        },
        totalLetras: document.getElementById('totalLetras').textContent,
        observaciones: document.getElementById('observaciones').value.trim(),
        vigencia: parseInt(document.getElementById('vigencia_dias').value, 10) || 15,
        equipos: equiposSeleccionados(),
        origen: document.getElementById('documento_origen').value.trim(),
        fecha: new Date().toLocaleDateString('es-CO')
    };
}

// ===== PARSEAR MONEDA =====
function parsearMoneda(texto) {
    const limpio = texto.replace(/[^\d]/g, '');
    return parseInt(limpio, 10) || 0;
}

// ===== CONSULTAR AL APPS SCRIPT =====
// Todo va por POST: el token de sesión no debe aparecer nunca en una URL
// (quedaría en el historial del navegador y en los logs del proxy).
async function api(accion, parametros) {
    const cuerpo = new URLSearchParams();
    cuerpo.append('accion', accion);
    cuerpo.append('token', sessionStorage.getItem('sb_token') || '');
    Object.keys(parametros || {}).forEach(k => {
        if (parametros[k] !== '' && parametros[k] != null) cuerpo.append(k, parametros[k]);
    });

    const respuesta = await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: cuerpo.toString()
    });
    return respuesta.json();
}

// ===== TIPO DE DOCUMENTO EN CURSO =====
const TIPOS = {
    'Cuenta':     { prefijo: 'CC-',  etiqueta: 'CUENTA DE COBRO', archivo: 'CuentaCobro',  boton: 'Generar Cuenta de Cobro' },
    'Cotización': { prefijo: 'COT-', etiqueta: 'COTIZACIÓN',      archivo: 'Cotizacion',   boton: 'Generar Cotización' }
};

function tipoActual() {
    const marcado = document.querySelector('input[name="tipoDocumento"]:checked');
    return TIPOS[marcado ? marcado.value : 'Cuenta'] ? marcado.value : 'Cuenta';
}

function claveFecha(hoy = new Date()) {
    const año = hoy.getFullYear();
    const mes = String(hoy.getMonth() + 1).padStart(2, '0');
    const dia = String(hoy.getDate()).padStart(2, '0');
    return `${año}${mes}${dia}`;
}

// El número definitivo lo pone el servidor al guardar (bajo candado).
// Esto es solo la vista previa del campo.
async function refrescarNumero() {
    const tipo = tipoActual();
    const estatuto = document.getElementById('numeroStat');
    const campo = document.getElementById('numero_cuenta');
    const etiqueta = document.getElementById('etiquetaNumero');

    if (etiqueta) etiqueta.textContent = tipo === 'Cotización' ? 'N.° de Cotización' : 'N.° de Cuenta de Cobro';

    try {
        const data = await api('asignarNumero', { tipo, fecha: claveFecha() });
        if (data.result === 'success') {
            if (campo) campo.value = data.numero;
            if (estatuto) estatuto.textContent = data.numero;
            return data.numero;
        }
        console.warn('No se pudo leer el consecutivo:', data.message);
    } catch (error) {
        console.warn('No se pudo consultar el consecutivo:', error);
    }

    if (estatuto) estatuto.textContent = 'Al guardar';
    if (campo) campo.value = 'PENDIENTE';
    return null;
}

// ===== CAMBIAR TIPO DE DOCUMENTO =====
function aplicarTipo() {
    const tipo = tipoActual();
    const esCot = tipo === 'Cotización';

    const btn = document.getElementById('btnEnviar');
    if (btn) btn.querySelector('.btn-texto').textContent = TIPOS[tipo].boton;

    const pago = document.getElementById('bloquePago');
    if (pago) pago.hidden = esCot;

    const vigencia = document.getElementById('bloqueVigencia');
    if (vigencia) vigencia.hidden = !esCot;
}

function inicializarTipoDocumento() {
    document.querySelectorAll('input[name="tipoDocumento"]').forEach(radio => {
        radio.addEventListener('change', () => {
            aplicarTipo();
            refrescarNumero();
        });
    });

    const pagoBancolombia = document.getElementById('pagoBancolombia');
    if (pagoBancolombia) {
        const b = DATOS_BANCARIOS.bancolombia;
        pagoBancolombia.textContent = `${b.tipo} ${b.numero} · ${b.titular}`;
    }

    const pagoNequi = document.getElementById('pagoNequi');
    if (pagoNequi) {
        const n = DATOS_BANCARIOS.nequi;
        pagoNequi.textContent = `${n.celular} · ${n.titular}`;
    }

    aplicarTipo();
}


// ===== MANEJAR ENVÍO =====
async function manejarEnvio(evento) {
    evento.preventDefault();

    const filas = document.querySelectorAll('#cuerpoServicios tr');
    let serviciosValidos = 0;

    filas.forEach(fila => {
        const desc  = fila.querySelector('[name="descripcion[]"]').value.trim();
        const valor = parseFloat(fila.querySelector('[name="valor[]"]').value) || 0;
        if (desc && valor > 0) serviciosValidos++;
    });

    if (serviciosValidos === 0) {
        alert('Debes agregar al menos un servicio con descripción y valor.');
        return;
    }

    const nombreCliente = document.getElementById('cliente_nombre').value.trim();
    const docCliente = document.getElementById('cliente_documento').value.trim();
    const emailCliente = document.getElementById('cliente_email').value.trim();

    if (!nombreCliente || !docCliente || !emailCliente) {
        alert('Por favor completa los datos obligatorios del cliente (nombre, documento y correo).');
        return;
    }

    const datos = recolectarDatos();
    const tipo = tipoActual();
    const numeroVista = document.getElementById('numero_cuenta').value;

    // El servidor asigna y devuelve el número; el de la pantalla era una
    // previsión y puede haber quedado desfasado por otro equipo.
    const guardado = await enviarDatosAGoogle(datos, tipo);
    const numeroDocumento = guardado.numero || numeroVista;

    const numeroStat = document.getElementById('numeroStat');
    if (numeroStat) numeroStat.textContent = numeroDocumento;

    const estadoStat = document.getElementById('estadoStat');
    if (estadoStat) estadoStat.textContent = guardado.ok ? 'Pendiente' : 'Sin guardar';

    try {
        await generarPDF(datos, numeroDocumento, tipo);
        if (guardado.ok) {
            alert(`${TIPOS[tipo].etiqueta === 'COTIZACIÓN' ? 'Cotización' : 'Cuenta de cobro'} generada correctamente.\n\nNúmero: ${numeroDocumento}\nTotal: ${formatearMoneda(datos.totales.total)}`);
        } else {
            alert(`El PDF se generó, pero NO se pudo guardar en Google Sheets.\n\nRevisa tu conexión o vuelve a iniciar sesión.\n\nNúmero previsto: ${numeroDocumento}\n\nEl documento NO quedó en el registro: vuelve a generarlo después de reconectar.`);
        }
    } catch (error) {
        console.error('Error al generar el PDF:', error);
        alert('Hubo un error al generar el PDF. Revisa la consola para más detalles.');
        return;
    }

    refrescarNumero();
    if (datos.cliente.documento.length >= 4) cargarFichaCliente();
}

// ===== ENVIAR DATOS A GOOGLE SHEETS =====
async function enviarDatosAGoogle(datos, tipo) {
    const serviciosTexto = datos.servicios.map((s, idx) => {
        const cant = s.cantidad;
        const valorUnit = formatearMonedaPDF(s.valor_unitario);
        const ivaTexto = s.iva_porcentaje > 0 ? ` | IVA: ${s.iva_porcentaje}%` : '';
        const total = formatearMonedaPDF(s.total_linea);
        return `${idx + 1}. ${s.descripcion} | Cant: ${cant} | V.Unit: ${valorUnit}${ivaTexto} | Total: ${total}`;
    }).join('\n');

    // La vigencia no tiene columna propia en la hoja: se deja escrita en las
    // observaciones, que es donde el PDF también la muestra.
    const observaciones = tipo === 'Cotización'
        ? [datos.observaciones, `Vigencia: ${datos.vigencia || 15} días calendario`].filter(Boolean).join('\n')
        : datos.observaciones;

    const payload = {
        Tipo:             tipo,
        ClienteNombre:    datos.cliente.nombre,
        ClienteTipoDoc:   datos.cliente.tipoDoc,
        ClienteDocumento: datos.cliente.documento,
        ClienteEmail:     datos.cliente.email,
        ClienteTelefono:  datos.cliente.telefono || '',
        ClienteDireccion: datos.cliente.direccion || '',
        Subtotal:         Number(datos.totales.subtotal) || 0,
        IVA:              Number(datos.totales.iva) || 0,
        Total:            Number(datos.totales.total) || 0,
        TotalLetras:      datos.totalLetras,
        Observaciones:    observaciones || '',
        Servicios:        serviciosTexto,
        Equipos:          equiposSeleccionados().join('\n'),
        Origen:           datos.origen || ''
    };

    try {
        const data = await api('guardar', { payload: JSON.stringify(payload) });
        if (data.result !== 'success') throw new Error(data.message || 'Respuesta inesperada del servidor');
        console.log('Guardado en Google Sheets:', data.numero);
        return { ok: true, numero: data.numero };
    } catch (error) {
        console.error('Error al guardar en Google Sheets:', error);
        return { ok: false, numero: null };
    }
}

// ===== EQUIPOS ADJUNTOS AL DOCUMENTO =====
function equiposSeleccionados() {
    return [...document.querySelectorAll('#equiposCliente input[type="checkbox"]:checked')]
        .map(c => c.value)
        .filter(Boolean);
}


// ===== CARGAR LOGO COMO BASE64 =====
function cargarLogo() {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            try {
                const dataURL = canvas.toDataURL('image/png');
                resolve(dataURL);
            } catch (e) {
                reject(e);
            }
        };
        img.onerror = () => reject(new Error('No se pudo cargar el logo'));
        img.src = 'img/isotype-pdf.png';
    });
}

// ===== GENERAR PDF =====
async function generarPDF(datos, numeroDocumento, tipo = 'Cuenta') {
    const esCotizacion = tipo === 'Cotización';
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'mm', 'a4');

    const paginaAncho = doc.internal.pageSize.getWidth();
    const paginaAlto  = doc.internal.pageSize.getHeight();
    const margen = 18;
    let y = 20;

    // ===== CARGAR LOGO =====
    let logoBase64 = null;
    try {
        logoBase64 = await cargarLogo();
    } catch (error) {
        console.warn('No se pudo cargar el logo:', error);
    }

    // ===== ENCABEZADO =====
    doc.setFillColor(20, 43, 74);
    doc.rect(0, 0, paginaAncho, 34, 'F');

    // Logo (si se cargó)
    let textoX = margen;
    if (logoBase64) {
        doc.addImage(logoBase64, 'PNG', margen, 7, 20, 20);
        textoX = margen + 24;
    }

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('SERVITECBAQ', textoX, 15);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Reparación, Mantenimiento y Soporte Tecnológico', textoX, 20);
    doc.text('Barranquilla, Atlántico · Colombia', textoX, 24.5);

    doc.setTextColor(111, 201, 200);
    doc.setFontSize(8);
    doc.text('www.servitecbaq.com', textoX, 29);

    // Cuenta de cobro (derecha)
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(TIPOS[tipo].etiqueta, paginaAncho - margen, 14, { align: 'right' });
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`No. ${numeroDocumento}`, paginaAncho - margen, 20, { align: 'right' });
    doc.text(`Fecha: ${datos.fecha}`, paginaAncho - margen, 26, { align: 'right' });

    y = 44;

    // ===== DATOS DEL EMISOR =====
    doc.setTextColor(12, 110, 110);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('DATOS DEL EMISOR', margen, y);
    y += 2;
    doc.setDrawColor(25, 175, 175);
    doc.setLineWidth(0.5);
    doc.line(margen, y, margen + 50, y);
    y += 5;

    doc.setTextColor(51, 69, 90);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');

    const anchoCol = (paginaAncho - margen * 2) / 2;

    doc.text(`Nombre: ${datos.emisor.nombre}`, margen, y);
    doc.text(`Correo: ${datos.emisor.email}`, margen + anchoCol, y);
    y += 4.5;
    doc.text(`Cédula: ${datos.emisor.cedula}`, margen, y);
    doc.text(`Sitio web: ${datos.emisor.website}`, margen + anchoCol, y);
    y += 4.5;
    doc.text(`Teléfono: ${datos.emisor.telefono}`, margen, y);
    doc.text(`Ciudad: ${datos.emisor.ciudad}`, margen + anchoCol, y);
    y += 10;

    // ===== DATOS DEL CLIENTE =====
    doc.setTextColor(12, 110, 110);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('DATOS DEL CLIENTE', margen, y);
    y += 2;
    doc.line(margen, y, margen + 50, y);
    y += 5;

    doc.setTextColor(51, 69, 90);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');

    doc.text(`Nombre: ${datos.cliente.nombre}`, margen, y);
    doc.text(`Correo: ${datos.cliente.email}`, margen + anchoCol, y);
    y += 4.5;
    doc.text(`${datos.cliente.tipoDoc}: ${datos.cliente.documento}`, margen, y);
    if (datos.cliente.telefono) doc.text(`Teléfono: ${datos.cliente.telefono}`, margen + anchoCol, y);
    y += 4.5;
    if (datos.cliente.direccion) {
        doc.text(`Dirección: ${datos.cliente.direccion}`, margen, y);
        y += 4.5;
    }
    y += 6;

    // ===== TABLA DE SERVICIOS =====
    doc.setTextColor(12, 110, 110);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('DETALLE DE SERVICIOS', margen, y);
    y += 6;

    const colDesc = margen + 3;
    const colCant = margen + 105;
    const colValor = margen + 125;
    const colTotal = paginaAncho - margen - 3;

    // Cabecera de tabla: relleno con texto blanco encima, así que va teal-600 (#0E7C7C,
    // 5,01:1). La aguamarina pura #19AFAF con blanco se queda en 2,69:1.
    doc.setFillColor(14, 124, 124);
    doc.rect(margen, y, paginaAncho - margen * 2, 7, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Descripción', colDesc, y + 5);
    doc.text('Cant.', colCant, y + 5);
    doc.text('Valor Unit.', colValor, y + 5);
    doc.text('Total', colTotal, y + 5, { align: 'right' });
    y += 7;

    doc.setTextColor(51, 69, 90);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);

    datos.servicios.forEach((servicio, idx) => {
        if (idx % 2 === 0) {
            doc.setFillColor(245, 247, 250);
            doc.rect(margen, y, paginaAncho - margen * 2, 7, 'F');
        }

        const descCorta = servicio.descripcion.length > 48
            ? servicio.descripcion.substring(0, 45) + '...'
            : servicio.descripcion;

        doc.text(descCorta, colDesc, y + 5);
        doc.text(servicio.cantidad.toString(), colCant, y + 5);
        doc.text(formatearMonedaPDF(servicio.valor_unitario), colValor, y + 5);
        doc.text(formatearMonedaPDF(servicio.total_linea), colTotal, y + 5, { align: 'right' });

        doc.setDrawColor(221, 227, 234);
        doc.setLineWidth(0.2);
        doc.line(margen, y + 7, paginaAncho - margen, y + 7);
        y += 7;
    });

    y += 5;

    // ===== TOTALES =====
    const totalesX = paginaAncho - margen - 60;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(90, 100, 114);

    doc.text('Subtotal:', totalesX, y);
    doc.text(formatearMonedaPDF(datos.totales.subtotal), colTotal, y, { align: 'right' });
    y += 4.5;

    doc.text('IVA:', totalesX, y);
    doc.text(formatearMonedaPDF(datos.totales.iva), colTotal, y, { align: 'right' });
    y += 7;

    doc.setFillColor(20, 43, 74);
    doc.rect(totalesX - 3, y - 4, 63, 11, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL:', totalesX, y + 3);
    doc.text(formatearMonedaPDF(datos.totales.total), colTotal, y + 3, { align: 'right' });
    y += 14;

    // ===== MONTO EN LETRAS =====
    doc.setTextColor(51, 69, 90);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8.5);
    const totalLetrasTexto = `Son: ${datos.totalLetras}`;
    const lineasLetras = doc.splitTextToSize(totalLetrasTexto, paginaAncho - margen * 2);
    doc.text(lineasLetras, margen, y);
    y += lineasLetras.length * 4 + 6;

    // ===== DATOS PARA PAGO / VIGENCIA =====
    const cajaAlto = 36;
    doc.setFillColor(235, 240, 246);
    doc.roundedRect(margen, y, paginaAncho - margen * 2, cajaAlto, 2, 2, 'F');
    doc.setDrawColor(25, 175, 175);
    doc.setLineWidth(0.4);
    doc.roundedRect(margen, y, paginaAncho - margen * 2, cajaAlto, 2, 2, 'S');

    doc.setTextColor(12, 110, 110);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');

    if (esCotizacion) {
        doc.text('CONDICIONES DE LA COTIZACIÓN', margen + 6, y + 7);
        doc.setLineWidth(0.3);
        doc.line(margen + 6, y + 9, margen + 80, y + 9);

        doc.setTextColor(51, 69, 90);
        doc.setFontSize(8.5);
        doc.setFont('helvetica', 'normal');
        doc.text(`Precio vigente por ${datos.vigencia || 15} días calendario desde la fecha de emisión.`, margen + 6, y + 16);
        doc.text('Los tiempos de ejecución se acuerdan al confirmar el servicio.', margen + 6, y + 21.5);
        doc.text('Para aceptar, responde este documento o escribe a soporte@servitecbaq.com.', margen + 6, y + 27);
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(7.5);
        doc.setTextColor(90, 100, 114);
        doc.text('Al confirmar la cotización se emite la cuenta de cobro correspondiente.', margen + 6, y + 32.5);
    } else {
        doc.text('DATOS PARA PAGO', margen + 6, y + 7);

        doc.setDrawColor(25, 175, 175);
        doc.setLineWidth(0.3);
        doc.line(margen + 6, y + 9, margen + 60, y + 9);

        doc.setTextColor(51, 69, 90);
        doc.setFontSize(8.5);
        doc.setFont('helvetica', 'bold');
        doc.text('Bancolombia', margen + 6, y + 14);
        doc.setFont('helvetica', 'normal');
        doc.text(
            `${DATOS_BANCARIOS.bancolombia.tipo}: ${DATOS_BANCARIOS.bancolombia.numero}`,
            margen + 6, y + 19
        );
        doc.text(
            `Titular: ${DATOS_BANCARIOS.bancolombia.titular} · C.C. ${DATOS_BANCARIOS.bancolombia.cedula}`,
            margen + 6, y + 24
        );

        const colDerX = margen + (paginaAncho - margen * 2) / 2 + 5;
        doc.setFont('helvetica', 'bold');
        doc.text('Nequi', colDerX, y + 14);
        doc.setFont('helvetica', 'normal');
        doc.text(`Celular: ${DATOS_BANCARIOS.nequi.celular}`, colDerX, y + 19);
        doc.text(`Titular: ${DATOS_BANCARIOS.nequi.titular}`, colDerX, y + 24);

        doc.setFont('helvetica', 'italic');
        doc.setFontSize(7.5);
        doc.setTextColor(90, 100, 114);
        doc.text(
            'Por favor envíe el comprobante de pago a soporte@servitecbaq.com o al WhatsApp 315 850 5020.',
            margen + 6, y + 31
        );
    }

    y += cajaAlto + 8;

    // ===== EQUIPOS INTERVENIDOS =====
    if (datos.equipos && datos.equipos.length) {
        if (y + 6 + datos.equipos.length * 4.5 > paginaAlto - 50) {
            doc.addPage();
            y = 25;
        }

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.5);
        doc.setTextColor(12, 110, 110);
        doc.text('EQUIPOS INTERVENIDOS', margen, y);
        y += 5;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(51, 69, 90);

        datos.equipos.forEach(equipo => {
            const lineas = doc.splitTextToSize('· ' + equipo, paginaAncho - margen * 2);
            doc.text(lineas, margen, y);
            y += lineas.length * 4 + 1;
        });
        y += 5;
    }

    // ===== OBSERVACIONES =====
    if (datos.observaciones) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.5);
        doc.setTextColor(12, 110, 110);
        doc.text('OBSERVACIONES', margen, y);
        y += 5;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(51, 69, 90);
        const obsLineas = doc.splitTextToSize(datos.observaciones, paginaAncho - margen * 2);
        doc.text(obsLineas, margen, y);
        y += obsLineas.length * 4 + 6;
    }

    // ===== FIRMA =====
    const firmaAncho = 70;
    const firmaX = paginaAncho - margen - firmaAncho;
    const firmaY = paginaAlto - 45;

    doc.setDrawColor(51, 69, 90);
    doc.setLineWidth(0.3);
    doc.line(firmaX, firmaY, firmaX + firmaAncho, firmaY);

    doc.setFontSize(8.5);
    doc.setTextColor(51, 69, 90);
    doc.setFont('helvetica', 'normal');
    doc.text(datos.emisor.nombre, firmaX + 5, firmaY + 5);
    doc.text(`C.C. ${datos.emisor.cedula}`, firmaX + 5, firmaY + 9);
    doc.text('Firma del Prestador', firmaX + 5, firmaY + 13);

    // ===== PIE DE PÁGINA =====
    const totalPaginas = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPaginas; i++) {
        doc.setPage(i);
        doc.setFontSize(7.5);
        doc.setTextColor(167, 175, 184);
        doc.setFont('helvetica', 'normal');
        doc.text(
            `ServitecBAQ · ${datos.emisor.email} · ${datos.emisor.telefono} · www.servitecbaq.com`,
            paginaAncho / 2,
            paginaAlto - 8,
            { align: 'center' }
        );
        doc.text(
            `Página ${i} de ${totalPaginas}`,
            paginaAncho - margen,
            paginaAlto - 8,
            { align: 'right' }
        );
    }

    // ===== GUARDAR =====
    const nombreArchivo = `${TIPOS[tipo].archivo}_${numeroDocumento}_${datos.cliente.nombre.replace(/\s+/g, '_')}.pdf`;
    doc.save(nombreArchivo);
}

// ===== FICHA DEL CLIENTE (historial + equipos) =====
let timerFicha = null;
let ultimoDocumentoConsultado = '';

function esc(texto) {
    return String(texto == null ? '' : texto)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function inicializarClienteHistorial() {
    const campo = document.getElementById('cliente_documento');
    if (!campo) return;

    campo.addEventListener('input', () => {
        clearTimeout(timerFicha);
        timerFicha = setTimeout(cargarFichaCliente, 500);
    });
    campo.addEventListener('blur', cargarFichaCliente);

    const rellenar = document.getElementById('clienteHistorial');
    if (rellenar) rellenar.addEventListener('click', (e) => {
        if (e.target.id === 'btnRellenarCliente') rellenarCliente();
    });
}

async function cargarFichaCliente() {
    const documento = document.getElementById('cliente_documento').value.trim();
    const caja = document.getElementById('clienteHistorial');
    const equiposCaja = document.getElementById('equiposCliente');
    if (!caja) return;

    if (documento.length < 4) {
        ultimoDocumentoConsultado = '';
        caja.innerHTML = '';
        if (equiposCaja) equiposCaja.innerHTML = '';
        return;
    }

    ultimoDocumentoConsultado = documento;
    caja.innerHTML = '<div class="ficha-cargando">Buscando historial de ' + esc(documento) + '…</div>';

    try {
        const [rCliente, rEquipos] = await Promise.all([
            api('buscarCliente', { documento }),
            api('equiposPorCliente', { documento })
        ]);

        pintarHistorial(caja, rCliente.cliente);
        if (equiposCaja) pintarEquipos(equiposCaja, rEquipos.equipos || []);
    } catch (error) {
        console.warn('No se pudo leer la ficha del cliente:', error);
        caja.innerHTML = '<div class="ficha-error">No se pudo consultar el historial. Revisa tu conexión.</div>';
    }
}

function pintarHistorial(caja, cliente) {
    if (!cliente) {
        caja.innerHTML = '<div class="ficha-empty">Cliente nuevo: todavía no tiene documentos registrados.</div>';
        return;
    }

    const pendiente = cliente.montoPendiente > 0
        ? `<span class="chip chip-pendiente">${cliente.pendientes} pendiente${cliente.pendientes === 1 ? '' : 's'} · ${formatearMoneda(cliente.montoPendiente)}</span>`
        : '<span class="chip chip-al-dia">Sin saldos pendientes</span>';

    caja.innerHTML = `
        <div class="ficha-head">
            <strong>${esc(cliente.nombre)}</strong>
            <span>${esc(cliente.tipoDoc)} ${esc(cliente.documento)}</span>
        </div>
        <div class="ficha-chips">
            <span class="chip">${cliente.emitidas} documento${cliente.emitidas === 1 ? '' : 's'}</span>
            ${pendiente}
            <span class="chip chip-fecha">Última: ${esc(cliente.ultima || '—')}</span>
        </div>
        <button type="button" class="btn-enlace" id="btnRellenarCliente">Rellenar datos del cliente</button>
    `;

    caja.dataset.nombre    = cliente.nombre || '';
    caja.dataset.tipoDoc   = cliente.tipoDoc || 'CC';
    caja.dataset.email     = cliente.email || '';
    caja.dataset.telefono  = cliente.telefono || '';
    caja.dataset.direccion = cliente.direccion || '';
}

function rellenarCliente() {
    const caja = document.getElementById('clienteHistorial');
    if (!caja) return;

    const campos = {
        cliente_nombre:     caja.dataset.nombre,
        cliente_email:      caja.dataset.email,
        cliente_telefono:   caja.dataset.telefono,
        cliente_direccion:  caja.dataset.direccion
    };

    let completados = 0;
    Object.keys(campos).forEach(id => {
        const input = document.getElementById(id);
        if (input && !input.value.trim() && campos[id]) {
            input.value = campos[id];
            completados++;
        }
    });

    const tipoDoc = document.getElementById('cliente_tipo_doc');
    if (tipoDoc && caja.dataset.tipoDoc) {
        [...tipoDoc.options].forEach(o => { if (o.value === caja.dataset.tipoDoc) tipoDoc.value = o.value; });
    }

    if (completados === 0) {
        caja.querySelector('#btnRellenarCliente').textContent = 'Los datos ya están completos';
    }
}

function pintarEquipos(caja, equipos) {
    // La selección no se pierde al repintar (por ejemplo al registrar un equipo nuevo).
    const seleccion = new Set(equiposSeleccionados());

    if (!equipos.length) {
        caja.innerHTML = '<div class="ficha-empty">Este cliente no tiene equipos registrados. Usa «Equipo nuevo».</div>';
        return;
    }

    caja.innerHTML = `<div class="equipos-titulo">${equipos.length} equipo(s) registrado(s)</div>` +
        equipos.map(eq => {
            const etiqueta = [eq.tipo, eq.marca, eq.modelo].filter(Boolean).join(' ') || 'Equipo';
            const detalle  = [eq.serial && 'SN ' + eq.serial, eq.activos, eq.detalle].filter(Boolean).join(' · ');
            const valor    = [etiqueta, detalle].filter(Boolean).join(' | ') + (eq.estado ? ' | ' + eq.estado : '');
            return `
                <label class="equipo-fila">
                    <input type="checkbox" value="${esc(valor)}">
                    <span class="equipo-nombre">${esc(etiqueta)}</span>
                    <span class="equipo-meta">${esc(detalle)}</span>
                    <span class="chip chip-${eq.estado === 'Entregado' ? 'al-dia' : 'pendiente'}">${esc(eq.estado)}</span>
                </label>`;
        }).join('');

    caja.querySelectorAll('input[type="checkbox"]').forEach(c => { if (seleccion.has(c.value)) c.checked = true; });
}

// ===== REGISTRO RÁPIDO DE EQUIPO =====
function inicializarEquipos() {
    const btn = document.getElementById('btnEquipoNuevo');
    if (btn) btn.addEventListener('click', guardarEquipo);

    const form = document.getElementById('formEquipo');
    if (form) form.addEventListener('submit', (e) => { e.preventDefault(); guardarEquipo(); });
}

async function guardarEquipo() {
    const documento = document.getElementById('cliente_documento').value.trim();
    if (!documento) {
        alert('Primero escribe el documento del cliente para poder registrar el equipo.');
        return;
    }

    const valor = (id) => {
        const el = document.getElementById(id);
        return el ? el.value.trim() : '';
    };

    const datos = {
        documento,
        cliente: document.getElementById('cliente_nombre').value.trim(),
        tipo:    valor('eq_tipo'),
        marca:   valor('eq_marca'),
        modelo:  valor('eq_modelo'),
        serial:  valor('eq_serial'),
        activos: valor('eq_activos'),
        detalle: valor('eq_detalle'),
        estado:  valor('eq_estado') || 'En taller',
        nota:    valor('eq_nota'),
        numero:  document.getElementById('numero_cuenta').value
    };

    if (!datos.tipo && !datos.marca && !datos.serial && !datos.activos) {
        alert('El equipo necesita al menos un dato: tipo, marca, serial o nº de activos.');
        return;
    }

    const btn = document.getElementById('btnEquipoNuevo');
    if (btn) btn.disabled = true;

    try {
        const data = await api('equipoGuardar', { payload: JSON.stringify(datos) });
        if (data.result !== 'success') throw new Error(data.message || 'Respuesta inesperada');

        ['eq_tipo', 'eq_marca', 'eq_modelo', 'eq_serial', 'eq_activos', 'eq_detalle', 'eq_nota']
            .forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });

        await cargarFichaCliente();
        alert('Equipo registrado.');
    } catch (error) {
        console.error('Error al registrar el equipo:', error);
        alert('No se pudo registrar el equipo. Revisa la consola.');
    } finally {
        if (btn) btn.disabled = false;
    }
}

// ===== LIMPIAR FORMULARIO =====
function limpiarFormulario() {
    if (!confirm('¿Seguro que quieres limpiar todo el formulario?')) return;

    document.getElementById('formFactura').reset();
    document.getElementById('cuerpoServicios').innerHTML = '';
    document.getElementById('emisor_documento').value = EMISOR_DEFAULT.cedula;
    document.getElementById('emisor_website').value = EMISOR_DEFAULT.website;

    const historial = document.getElementById('clienteHistorial');
    if (historial) historial.innerHTML = '';
    const equipos = document.getElementById('equiposCliente');
    if (equipos) equipos.innerHTML = '';
    ultimoDocumentoConsultado = '';

    agregarFila();
    calcularTotales();
    refrescarNumero();
}

// ===== MOSTRAR USUARIO LOGUEADO EN EL CHIP =====
function mostrarUsuarioLogueado() {
    const usuario = sessionStorage.getItem('sb_usuario') || 'Usuario';
    const userNombre = document.getElementById('userNombre');
    const userAvatar = document.getElementById('userAvatar');

    if (userNombre) {
        // Si el usuario tiene formato tipo "dfragozo" o "david.fragozo", lo mostramos tal cual
        // Pero si quieres mostrar con mayúscula inicial, usa la siguiente línea:
        userNombre.textContent = usuario.charAt(0).toUpperCase() + usuario.slice(1);
    }

    if (userAvatar) {
        // Tomar las primeras 2 letras del usuario para el avatar
        // Si el usuario tiene espacios o puntos, tomamos las iniciales
        const partes = usuario.split(/[.\s_-]+/).filter(p => p.length > 0);
        let iniciales = '';

        if (partes.length >= 2) {
            iniciales = partes[0][0] + partes[1][0];
        } else if (usuario.length >= 2) {
            iniciales = usuario.substring(0, 2);
        } else {
            iniciales = usuario.substring(0, 1) || '?';
        }

        userAvatar.textContent = iniciales.toUpperCase();
    }
}

// ===== EXPONER FUNCIONES GLOBALES =====
window.agregarFila = agregarFila;
window.eliminarFila = eliminarFila;
window.calcularTotales = calcularTotales;
window.limpiarFormulario = limpiarFormulario;
window.api = api;
window.esc = esc;
window.tipoActual = tipoActual;
window.TIPOS = TIPOS;