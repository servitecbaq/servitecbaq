/* ============================================
   SERVITECBAQ · GENERADOR DE CUENTAS DE COBRO
   
   Este módulo NO es facturación electrónica.
   Genera cuentas de cobro en PDF, que son el
   documento correcto para personas naturales
   no responsables de IVA según la DIAN.
   
   Guarda un registro automático en Google Sheets
   a través de Google Apps Script usando un iframe
   oculto para evitar problemas de CORS.
   
   Sistema de numeración: CC-AAAAMMDD####
   Ejemplo: CC-202610080001
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

    // Inicializar botón de reset
    inicializarBotonReset();

    // Inicializar botón de logout
    inicializarBotonLogout();

    // Consultar el último consecutivo del día al cargar la página
    consultarUltimoConsecutivo();
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
                   value="${descripcion}"
                   placeholder="Ej: Mantenimiento preventivo" required>
        </td>
        <td>
            <input type="number" name="cantidad[]"
                   value="${cantidad}" min="0.01" step="0.01"
                   onchange="calcularTotales()" oninput="calcularTotales()">
        </td>
        <td>
            <input type="number" name="valor[]"
                   value="${valor}" min="0" step="0.01"
                   onchange="calcularTotales()" oninput="calcularTotales()">
        </td>
        <td>
            <input type="number" name="iva[]"
                   value="${iva}" min="0" max="100" step="0.01"
                   onchange="calcularTotales()" oninput="calcularTotales()">
        </td>
        <td class="total-linea">$0</td>
        <td>
            <button type="button" class="btn-eliminar"
                    onclick="eliminarFila(this)">✖</button>
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
        fecha: new Date().toLocaleDateString('es-CO')
    };
}

// ===== PARSEAR MONEDA =====
function parsearMoneda(texto) {
    const limpio = texto.replace(/[^\d]/g, '');
    return parseInt(limpio, 10) || 0;
}

// ===== CALCULAR CLAVE DE FECHA DEL DÍA =====
function obtenerFechaClave() {
    const hoy = new Date();
    const año = hoy.getFullYear();
    const mes = String(hoy.getMonth() + 1).padStart(2, '0');
    const dia = String(hoy.getDate()).padStart(2, '0');
    return `${año}${mes}${dia}`;
}

// ===== CONSULTAR ÚLTIMO CONSECUTIVO DEL DÍA DESDE EL SHEETS =====
async function consultarUltimoConsecutivo() {
    const fechaClave = obtenerFechaClave();
    const claveStorage = `consecutivo_${fechaClave}`;
    const claveReset = `reset_${fechaClave}`;

    if (localStorage.getItem(claveReset) === 'true') {
        console.log(`🔒 Reset activo para ${fechaClave} - no se consulta el Sheet`);
        localStorage.setItem(claveStorage, '0');
        return 0;
    }

    let ultimoLocal = parseInt(localStorage.getItem(claveStorage) || '0', 10);

    try {
        const token = sessionStorage.getItem('sb_token') || '';
        const url = `${GOOGLE_SCRIPT_URL}?accion=ultimoConsecutivo&fecha=${fechaClave}&token=${encodeURIComponent(token)}`;
        const respuesta = await fetch(url);
        const data = await respuesta.json();

        if (data.result === 'success') {
            const ultimoSheet = parseInt(data.ultimoConsecutivo) || 0;
            const ultimoReal = Math.max(ultimoLocal, ultimoSheet);
            localStorage.setItem(claveStorage, ultimoReal.toString());
            console.log(`📋 Consecutivo sincronizado (${fechaClave}): último = ${ultimoReal}`);
            return ultimoReal;
        }
    } catch (error) {
        console.warn('⚠️ No se pudo consultar el Sheets, usando localStorage:', error);
    }

    return ultimoLocal;
}

// ===== GENERAR NÚMERO CONSECUTIVO =====
function generarNumeroConsecutivo() {
    const fechaClave = obtenerFechaClave();
    const claveStorage = `consecutivo_${fechaClave}`;
    let ultimoNumero = parseInt(localStorage.getItem(claveStorage) || '0', 10);

    let nuevoNumero = ultimoNumero + 1;
    localStorage.setItem(claveStorage, nuevoNumero.toString());

    const consecutivoFormateado = nuevoNumero.toString().padStart(4, '0');

    return `CC-${fechaClave}${consecutivoFormateado}`;
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
    const numeroDocumento = generarNumeroConsecutivo();

    const numeroStat = document.getElementById('numeroStat');
    if (numeroStat) numeroStat.textContent = numeroDocumento;

    // Enviar a Sheets (con token de sesión y verificación de respuesta)
    const guardadoEnSheets = await enviarDatosAGoogle(datos, numeroDocumento);

    // Generar PDF
    try {
        await generarPDF(datos, numeroDocumento);
        if (guardadoEnSheets) {
            alert(`✅ Cuenta de cobro generada correctamente.\n\nNúmero: ${numeroDocumento}\nTotal: ${formatearMoneda(datos.totales.total)}`);
        } else {
            alert(`⚠️ La cuenta se generó, pero NO se pudo guardar en Google Sheets.\n\nRevisa tu conexión o vuelve a iniciar sesión.\n\nNúmero: ${numeroDocumento}\nTotal: ${formatearMoneda(datos.totales.total)}`);
        }
    } catch (error) {
        console.error('Error al generar el PDF:', error);
        alert('Hubo un error al generar el PDF. Revisa la consola para más detalles.');
    }
}

// ===== ENVIAR DATOS A GOOGLE SHEETS (FETCH con verificación) =====
async function enviarDatosAGoogle(datos, numeroDocumento) {
    const serviciosTexto = datos.servicios.map((s, idx) => {
        const cant = s.cantidad;
        const valorUnit = formatearMonedaPDF(s.valor_unitario);
        const ivaTexto = s.iva_porcentaje > 0 ? ` | IVA: ${s.iva_porcentaje}%` : '';
        const total = formatearMonedaPDF(s.total_linea);
        return `${idx + 1}. ${s.descripcion} | Cant: ${cant} | V.Unit: ${valorUnit}${ivaTexto} | Total: ${total}`;
    }).join('\n');

    const payload = {
        NumeroCuenta:     numeroDocumento,
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
        Observaciones:    datos.observaciones || '',
        Servicios:        serviciosTexto
    };

    const cuerpo = new URLSearchParams();
    cuerpo.append('payload', JSON.stringify(payload));
    cuerpo.append('token', sessionStorage.getItem('sb_token') || '');

    try {
        const respuesta = await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: cuerpo.toString()
        });
        const data = await respuesta.json();

        if (data.result !== 'success') {
            throw new Error(data.message || 'Respuesta inesperada del servidor');
        }

        console.log('✅ Datos enviados a Google Sheets:', numeroDocumento);
        return true;
    } catch (error) {
        console.error('Error al guardar en Google Sheets:', error);
        return false;
    }
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
        img.src = 'img/logo.png';
    });
}

// ===== GENERAR PDF =====
async function generarPDF(datos, numeroDocumento) {
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
        console.warn('⚠️ No se pudo cargar el logo:', error);
    }

    // ===== ENCABEZADO =====
    doc.setFillColor(10, 37, 64);
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

    doc.setTextColor(100, 181, 246);
    doc.setFontSize(8);
    doc.text('www.servitecbaq.com', textoX, 29);

    // Cuenta de cobro (derecha)
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('CUENTA DE COBRO', paginaAncho - margen, 14, { align: 'right' });
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`No. ${numeroDocumento}`, paginaAncho - margen, 20, { align: 'right' });
    doc.text(`Fecha: ${datos.fecha}`, paginaAncho - margen, 26, { align: 'right' });

    y = 44;

    // ===== DATOS DEL EMISOR =====
    doc.setTextColor(21, 101, 192);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('DATOS DEL EMISOR', margen, y);
    y += 2;
    doc.setDrawColor(30, 136, 229);
    doc.setLineWidth(0.5);
    doc.line(margen, y, margen + 50, y);
    y += 5;

    doc.setTextColor(51, 65, 85);
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
    doc.setTextColor(21, 101, 192);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('DATOS DEL CLIENTE', margen, y);
    y += 2;
    doc.line(margen, y, margen + 50, y);
    y += 5;

    doc.setTextColor(51, 65, 85);
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
    doc.setTextColor(21, 101, 192);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('DETALLE DE SERVICIOS', margen, y);
    y += 6;

    const colDesc = margen + 3;
    const colCant = margen + 105;
    const colValor = margen + 125;
    const colTotal = paginaAncho - margen - 3;

    doc.setFillColor(30, 136, 229);
    doc.rect(margen, y, paginaAncho - margen * 2, 7, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Descripción', colDesc, y + 5);
    doc.text('Cant.', colCant, y + 5);
    doc.text('Valor Unit.', colValor, y + 5);
    doc.text('Total', colTotal, y + 5, { align: 'right' });
    y += 7;

    doc.setTextColor(51, 65, 85);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);

    datos.servicios.forEach((servicio, idx) => {
        if (idx % 2 === 0) {
            doc.setFillColor(248, 250, 252);
            doc.rect(margen, y, paginaAncho - margen * 2, 7, 'F');
        }

        const descCorta = servicio.descripcion.length > 48
            ? servicio.descripcion.substring(0, 45) + '...'
            : servicio.descripcion;

        doc.text(descCorta, colDesc, y + 5);
        doc.text(servicio.cantidad.toString(), colCant, y + 5);
        doc.text(formatearMonedaPDF(servicio.valor_unitario), colValor, y + 5);
        doc.text(formatearMonedaPDF(servicio.total_linea), colTotal, y + 5, { align: 'right' });

        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.2);
        doc.line(margen, y + 7, paginaAncho - margen, y + 7);
        y += 7;
    });

    y += 5;

    // ===== TOTALES =====
    const totalesX = paginaAncho - margen - 60;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);

    doc.text('Subtotal:', totalesX, y);
    doc.text(formatearMonedaPDF(datos.totales.subtotal), colTotal, y, { align: 'right' });
    y += 4.5;

    doc.text('IVA:', totalesX, y);
    doc.text(formatearMonedaPDF(datos.totales.iva), colTotal, y, { align: 'right' });
    y += 7;

    doc.setFillColor(10, 37, 64);
    doc.rect(totalesX - 3, y - 4, 63, 11, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL:', totalesX, y + 3);
    doc.text(formatearMonedaPDF(datos.totales.total), colTotal, y + 3, { align: 'right' });
    y += 14;

    // ===== MONTO EN LETRAS =====
    doc.setTextColor(51, 65, 85);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8.5);
    const totalLetrasTexto = `Son: ${datos.totalLetras}`;
    const lineasLetras = doc.splitTextToSize(totalLetrasTexto, paginaAncho - margen * 2);
    doc.text(lineasLetras, margen, y);
    y += lineasLetras.length * 4 + 6;

    // ===== DATOS PARA PAGO =====
    const cajaAlto = 36;
    doc.setFillColor(240, 247, 255);
    doc.roundedRect(margen, y, paginaAncho - margen * 2, cajaAlto, 2, 2, 'F');
    doc.setDrawColor(30, 136, 229);
    doc.setLineWidth(0.4);
    doc.roundedRect(margen, y, paginaAncho - margen * 2, cajaAlto, 2, 2, 'S');

    doc.setTextColor(21, 101, 192);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('DATOS PARA PAGO', margen + 6, y + 7);

    doc.setDrawColor(30, 136, 229);
    doc.setLineWidth(0.3);
    doc.line(margen + 6, y + 9, margen + 60, y + 9);

    doc.setTextColor(51, 65, 85);
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
    doc.setTextColor(100, 116, 139);
    doc.text(
        'Por favor envíe el comprobante de pago a soporte@servitecbaq.com o al WhatsApp 315 850 5020.',
        margen + 6, y + 31
    );

    y += cajaAlto + 8;

    // ===== OBSERVACIONES =====
    if (datos.observaciones) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.5);
        doc.setTextColor(21, 101, 192);
        doc.text('OBSERVACIONES', margen, y);
        y += 5;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(51, 65, 85);
        const obsLineas = doc.splitTextToSize(datos.observaciones, paginaAncho - margen * 2);
        doc.text(obsLineas, margen, y);
        y += obsLineas.length * 4 + 6;
    }

    // ===== FIRMA =====
    const firmaAncho = 70;
    const firmaX = paginaAncho - margen - firmaAncho;
    const firmaY = paginaAlto - 45;

    doc.setDrawColor(51, 65, 85);
    doc.setLineWidth(0.3);
    doc.line(firmaX, firmaY, firmaX + firmaAncho, firmaY);

    doc.setFontSize(8.5);
    doc.setTextColor(51, 65, 85);
    doc.setFont('helvetica', 'normal');
    doc.text(datos.emisor.nombre, firmaX + 5, firmaY + 5);
    doc.text(`C.C. ${datos.emisor.cedula}`, firmaX + 5, firmaY + 9);
    doc.text('Firma del Prestador', firmaX + 5, firmaY + 13);

    // ===== PIE DE PÁGINA =====
    const totalPaginas = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPaginas; i++) {
        doc.setPage(i);
        doc.setFontSize(7.5);
        doc.setTextColor(148, 163, 184);
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
    const nombreArchivo = `CuentaCobro_${numeroDocumento}_${datos.cliente.nombre.replace(/\s+/g, '_')}.pdf`;
    doc.save(nombreArchivo);
}

// ===== BOTÓN DE RESET DEL CONSECUTIVO =====
function inicializarBotonReset() {
    const btn = document.getElementById('btnReset');
    if (!btn) return;

    btn.addEventListener('click', mostrarModalReset);
}

function mostrarModalReset() {
    const fechaClave = obtenerFechaClave();
    const claveStorage = `consecutivo_${fechaClave}`;
    const actual = parseInt(localStorage.getItem(claveStorage) || '0', 10);

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
        <div class="modal-box">
            <h3>
                <span class="modal-icon">
                    <svg viewBox="0 0 24 24" fill="none" width="18" height="18">
                        <path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
                              stroke="currentColor" stroke-width="2"
                              stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </span>
                Reiniciar consecutivo
            </h3>
            <p>Esto reiniciará el contador del día <strong>${fechaClave}</strong> para que la próxima cuenta de cobro vuelva a empezar en <strong>0001</strong>.</p>
            <div class="modal-info">
                <div>Último consecutivo hoy: <strong>${actual === 0 ? 'ninguno' : 'CC-' + fechaClave + String(actual).padStart(4, '0')}</strong></div>
                <div style="margin-top:6px; font-size:0.8rem; color: var(--gris-500);">El historial en Google Sheets no se modifica.</div>
            </div>
            <div class="modal-actions">
                <button type="button" class="btn-cancelar" id="modalCancelar">Cancelar</button>
                <button type="button" class="btn-confirmar" id="modalConfirmar">Sí, reiniciar</button>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);
    setTimeout(() => overlay.classList.add('active'), 10);

    const cerrar = () => {
        overlay.classList.remove('active');
        setTimeout(() => overlay.remove(), 200);
    };

    overlay.querySelector('#modalCancelar').addEventListener('click', cerrar);
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) cerrar();
    });

    overlay.querySelector('#modalConfirmar').addEventListener('click', () => {
        localStorage.removeItem(claveStorage);
        localStorage.setItem(`reset_${fechaClave}`, 'true');
        cerrar();

        setTimeout(() => {
            alert(`✅ Consecutivo reiniciado.\n\nLa próxima cuenta de cobro del ${fechaClave} será CC-${fechaClave}0001.`);
        }, 250);
    });
}

// ===== LIMPIAR FORMULARIO =====
function limpiarFormulario() {
    if (!confirm('¿Seguro que quieres limpiar todo el formulario?')) return;

    document.getElementById('formFactura').reset();
    document.getElementById('cuerpoServicios').innerHTML = '';
    document.getElementById('emisor_documento').value = EMISOR_DEFAULT.cedula;
    document.getElementById('emisor_website').value = EMISOR_DEFAULT.website;

    agregarFila();
    calcularTotales();
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