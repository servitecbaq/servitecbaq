# Service Desk · `/soporte/`

Portal de tickets de ServitecBAQ. Tres páginas estáticas servidas por GitHub Pages;
el backend NO vive en este repositorio.

Este archivo es la guía de continuidad. Léalo completo antes de tocar nada: varias
reglas aquí no son de estilo, son decisiones del dueño del sitio o correcciones a
defectos que ya ocurrieron en producción.

## 1. Qué es cada archivo

| Archivo | Rol |
|---|---|
| `index.html` | Portal público: crear ticket y consultar ticket (dos `.vista` en un solo documento). |
| `soporte.js` | Lógica del portal: validación, `POST` al backend, render de resultado y conversación. |
| `login.html` + `login.js` | Acceso del agente. |
| `panel.html` + `panel.js` | Panel del agente: contadores, listado con filtros, detalle en modal, cambio de estado, respuesta y nota interna. |
| `soporte.css` | Único hoja de estilos, compartida por las tres páginas. |

Las tres páginas enlazan `soporte.css` directamente. **No** usan el `<style>` crítico
inline del sitio: ese bloque es generado por scripts que no están en el repo y solo
aplica a la portada y a `/servicios/`, `/tips/`, etc.

## 2. Contrato con el backend

El backend es un Apps Script (`ServiceDesk.gs`) con un `doPost` que despacha por el
campo `accion`. Todo es `POST` con `application/x-www-form-urlencoded`; **nunca**
viajan credenciales en la URL.

La URL `/exec` está escrita literal en `GOOGLE_SCRIPT_URL` dentro de `soporte.js`,
`panel.js` y `login.js`. Si se vuelve a implementar el script, hay que actualizar
**los tres** archivos en el mismo commit.

| `accion` | Parámetros | Respuesta |
|---|---|---|
| `crearTicket` | `nombre, email, telefono, categoria, prioridad, asunto, descripcion, sitio` | `result, numero, codigo, message` |
| `consultar` | `numero, codigo` | `result, ticket, mensajes[], message` |
| `responder` | `numero, codigo, mensaje` | `result, message` |
| `login` | `usuario, password` | `result, token, nombre, message` |
| `listar` | `token, estado, prioridad, busca` | `result, tickets[], conteo{}, message` |
| `detalle` | `token, numero` | `result, ticket, mensajes[]` |
| `estado` | `token, numero, estado` | `result, message` |
| `responderAgente` | `token, numero, mensaje, interno` (`interno` = `'SI'` o vacío) | `result, message` |

Forma de `ticket`: `numero, nombre, email, telefono, categoria, prioridad, asunto,
descripcion, estado, fecha, ultimaActualizacion, codigo` (el cliente nunca muestra `codigo`).

Forma de un elemento de `mensajes[]`: `nombre, fecha, mensaje, autor` (`'Agente'` o
`'Cliente'`) y `interno` para las notas del equipo.

`conteo` trae `Total` y una clave por estado (`Nuevo`, `En curso`, `En espera`,
`Resuelto`, `Cerrado`); el panel las lee con `[data-contador]`.

Fechas: el backend devuelve texto `AAAA-MM-DD HH:MM` (o ISO). `formatearFecha()`
las parsea con esa expresión; está duplicada en `soporte.js` y `panel.js`, así que un
cambio de formato se corrige en los dos archivos y no en cada llamada.

`sitio` es un campo trampa (honeypot): oculto para la persona, relleno por bots. El
portal lo envía tal cual; quien descarta el envío es el backend.

Sesión del agente: `sessionStorage` con `sb_sd_autenticado`, `sb_sd_usuario`,
`sb_sd_nombre`, `sb_sd_token`. El token se manda en el cuerpo de cada petición del
panel; si el backend responde `sinSesion: true`, `api()` cierra la sesión y devuelve
al login. `panel.html` sin sesión redirige a `login.html`.

El portal público guarda en `localStorage` (`sb_sd_tickets`, máximo 8) los pares
`numero + codigo` de los tickets creados en ese navegador, para los chips de
"mis tickets". Es el único estado que sobrevive a la recarga en el lado del cliente.

## 3. Reglas que no se rompen

- **Los `.gs` no se suben.** Este repo es público. `ServiceDesk.gs` y sus copias viven
  solo en la cuenta de Apps Script del dueño.
- **Nada de secretos en el repo**: ni `SECRETO`, ni tokens, ni contraseñas, ni la hoja
  de credenciales, ni en comentarios.
- **Prohibido cualquier indicador de disponibilidad**: "disponible", "en línea",
  "activo", "24/7", punticos verdes. Sí se permite: horario, "respuesta en menos de
  24 h", zona de atención, repuestos.
- **Cero emojis** en todo el sitio. Los iconos son SVG en línea (recorte de Heroicons
  outline) y las ilustraciones son SVG autohospedadas en `../img/illustrations/`.
- Las tres páginas llevan `noindex, nofollow`. Es a propósito: no es un defecto SEO y
  no se quita para "mejorar el puntaje".
- No publicar el domicilio del negocio en ninguna parte del módulo.
- No tocar el proyecto de Apps Script "API Inventario TI".
- Capas gratuitas: no proponer servicios de pago ni infraestructura nueva sin que él
  lo pida.

## 4. Convenciones de interfaz

- **Tokens**: la paleta y las medidas salen de las variables en `:root` de
  `soporte.css` (mismos valores que `css/styles.css` del sitio: navy, teal, neutros).
  No meter colores literales nuevos sin token.
- **Tipografía**: Outfit autohospedada (`../fonts/outfit-latin*.woff2`), declarada con
  `@font-face` en `soporte.css` y pre-cargada en el `<head>` de las tres páginas.
  `font-display: optional` es decisión tomada: la primera visita puede pintar la pila
  del sistema y así se queda. No volver a Google Fonts (cuesta ~1,2 s de LCP y meter
  peticiones de tercero).
- **Blancos táctiles**: `--diana: 40px`. Cualquier enlace o botón tocable llega a esa
  medida con `padding`, no con `height` suelto.
- **Animaciones**: solo `opacity` y `transform`. Duraciones ≤ 0,35 s. Retardo
  escalonado con `--i` topado (`Math.min(i, 6)` / `12`) para que una lista larga no
  forme cola.
- **`[hidden] { display: none !important; }`** está en la línea 84 y sostiene todo lo
  que se oculta por atributo (vistas, estado vacío, aviso de ticket cerrado). Cualquier
  clase con `display` propio le ganaba sin esa regla; es la causa de varios fantasmas
  ya corregidos.

## 5. Trampas conocidas (todas costaron una corrección)

1. **`animation-fill-mode: both` puede dejar la página en blanco.** Si el navegador no
   llega a animar (pestaña en segundo plano, Lighthouse sin GPU), el elemento se queda
   en el fotograma 0 con `opacity: 0`. Las entradas **sin retardo** no llevan
   `fill-mode`; el estado final ya es el estilo normal del elemento. Solo se conserva
   `both` donde hay retardo escalonado (`.burbuja`, `.fila-ticket`) y en la salida del
   aviso.
2. **El aviso flotante se centra con `translate(-50%, 0)`**, por eso tiene su propio
   `@keyframes subir-aviso`. Reutilizar `subir` (que termina en `transform: none`) lo
   desplaza media pantalla al terminar la animación.
3. **El modal se re-renderiza** al cambiar estado o responder. `pintarModal()`
   conserva a propósito scroll, casilla de nota interna, borrador y foco; si se toca
   el render, hay que conservar esos cuatro. Al deshabilitar un botón el navegador le
   quita el foco, por eso existe `ultimoFoco`.
4. **Los estados de carga van por clase** (`.is-cargando`), no escribiendo
   `innerHTML` del botón: el spinner sustituye al icono y el botón no cambia de ancho.
5. **Nada de `alert()`**: se usa `notificar()` (aviso flotante con `role="status"`).
6. **En móvil la tabla se apila** con `data-etiqueta` en cada `<td>`; toda celda nueva
   del listado necesita su etiqueta o sale muda bajo 640 px.
7. **El esqueleto solo se pinta con la tabla vacía**; una recarga no debe borrar lo
   que ya se veía.
8. **`fechaCorta()` quita el año** cuando es el actual; `formatearFecha()` lo deja
   completo en el detalle.
9. **Toda texto interpolado pasa por `esc()`**. El HTML del modal y de la tabla se arma
   por concatenación.

## 6. Cómo verificar antes de commitear

El banco de pruebas **no está en el repo** (es local, en `Temp/sbq-lh`):

- `serve-sd.js` → sirve el repo en `http://127.0.0.1:8750`.
- `mock-sd.js` → imita el contrato de Apps Script en `http://127.0.0.1:8841`.
- `?api=http://localhost:8841` solo funciona en `localhost`/`127.0.0.1`: así se prueba
  sin backend y no hay riesgo de que el parámetro se cuele en producción.
- `sd-audit.js` → 14 capturas + `sd-audit/informe.json` (desbordes horizontales, blancos
  táctiles, errores de consola).
- `axe-sd-todo.js` (3 vistas base) y `axe-sd-vistas.js` (14 estados interactivos) → axe
  con `wcag2a, wcag2aa, wcag21aa, best-practice`.
- `run-lh.js <url> <salida> <mobile|desktop>` → Lighthouse.

Estado de la última verificación (local, 2026-10-28): desbordes 0 y errores de consola
0 en las 14 capturas; axe limpio en los 17 estados; portal 100/100/100 y login
100/100/100 en móvil y escritorio, LCP 1,5 s móvil / 0,4 s escritorio, 0 peticiones de
tercero. SEO 63/54 por el `noindex` deliberado: **no es una regresión, no se toca**.

Falsos positivos que ya están analizados y se aceptan: los `input` de radio de 1×40 px
(reemplazados por tarjetas), el honeypot `tSitio` y el checkbox de 16 px dentro de una
etiqueta de 40 px.

## 7. Pendientes

Hay una lista de siete huecos (aviso por correo, límites del login, versionado del
`.gs`, etc.) que el dueño dejó abierta **a propósito** y revisa el 30-10-2026. No se
abren por cuenta propia ni se enumeran aquí, que este repo es público.
