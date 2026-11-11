/* Contenido de la pagina /soluciones/kioskcast/ — modulo de solo-build.

   Cada afirmación de este archivo salió del repositorio de KioskCast leido el
   2026-11-11: hub/server.js, hub/public/index.html, tv-app (build.gradle.kts y
   las fuentes bajo com.servitecbaq.kioskcast), installer/installer.iss y
   docs/manual-de-operacion.md. Lo que no está en el código no se publica: nada
   de planificador de calendario, nada de nube, nada de tienda de apps.

   Las capturas se generan con kioskcast-video/capturar-demo.js, que abre el panel
   real y le sustituye las respuestas de la API por datos de ejemplo: en las
   imágenes no hay clientes, ni IPs de una red viva, ni huellas de archivos reales. */

module.exports = {
  slug: 'kioskcast',
  kicker: 'Solución desarrollada por Servitecbaq',
  title: 'KioskCast: pantallas digitales en Barranquilla | Servitecbaq',
  h1: 'KioskCast, la pantalla del negocio funcionando sola',
  meta: 'KioskCast convierte TVs Android en pantallas digitales gestionadas desde un hub local: bucles, grupos, caché sin internet y registro de lo emitido.',

  intro: [
    'KioskCast es la solución de señalización digital que desarrollamos en Servitecbaq para que un televisor corriente haga de pantalla del negocio: reproduce los videos y las imágenes que le mandas, en bucle, sin mando a distancia y sin que nadie tenga que estar pendiente de él. Una recepción que promociona servicios, una cafetería que cambia el menú cuando cambia la hora, paradas que muestran lo mismo en varios puntos a la vez.',
    'No es una app descargada de una tienda ni un servicio en la nube al que se paga suscripción mes a mes. El software lo escribimos nosotros, se instala en tu propia red y funciona sin salir a internet: el panel de control corre en un equipo dentro del local y las pantallas se le conectan solas. Si se cae el proveedor de internet, las pantallas siguen emitiendo lo último que cargaste.'
  ],

  sintomas: [
    { q: 'La pantalla se queda en el canal de TV o en negro', a: 'Un televisor sin dirección hace lo último que alguien dejó puesto. KioskCast sujeta el kiosco: la app vuelve a su sitio si alguien la saca y la pantalla es nuestra hasta que tú la sueltes.' },
    { q: 'El menú o la promoción se cambian a mano con un USB', a: 'Cada cambio obliga a alguien con el pendrive y con tiempo. Aquí subes el archivo al panel y lo emites a la pantalla que elijas, desde el mismo sitio donde lo cargaste.' },
    { q: 'Varias pantallas y ninguna dice lo mismo a la vez', a: 'Los TVs se agrupan y el grupo emite junto una misma lista. Cada grupo puede estar con contenido distinto sin que se estorben entre sí.' },
    { q: 'No hay forma de probar qué se emitió', a: 'El hub deja registro de cada comando con su hora y de quién lo mandó, y puede pedir una captura de la pantalla para ver qué tiene delante.' },
    { q: 'Un video pesa 400 MB y el TV no lo mueve', a: 'Al subirlo se analiza la ficha del contenedor y el panel te dice si un TV Android corriente lo decodifica; si no, se recodifica a 1080p en el propio hub.' }
  ],

  capacidades: [
    'Bucle de videos MP4 e imágenes PNG/JPG, con hueco fijo entre piezas',
    'Grupos de pantallas: una emisión simultánea a varios TVs a la vez',
    'Listas con nombre que se emiten con un botón',
    'Descubrimiento en la red: el TV se anuncia solo al abrir la app',
    'Caché offline por huella SHA-256: la pantalla sigue emitiendo sin red',
    'Modo kiosco con pantalla siempre encendida y en horizontal',
    'Sujeción del kiosco: la app recupera la pantalla si alguien la interrumpe',
    'Emisión superpuesta sobre lo que esté abierto en el TV',
    'Volumen, pausa, parada y arranque de apps desde el panel',
    'Captura de lo que hay en cada pantalla para verificar sin desplazarte',
    'Cuentas con rol administrador, permiso de gestión de contenido y mando por pantalla',
    'Registro de comandos con usuario, hora y respuesta de cada pantalla'
  ],

  partes: [
    { icon: 'h-device-phone-mobile', t: 'App del TV', d: 'Android 8.0 o superior, escrita en Kotlin con Media3 ExoPlayer. Reproduce en bucle, guarda caché y se conecta al hub por WebSocket.' },
    { icon: 'h-server', t: 'Hub', d: 'Node.js con API REST, WebSocket y descubrimiento por UDP. Guarda medios, listas y registro en SQLite. Se instala como servicio de Windows o con systemd en Linux y Raspberry Pi.' },
    { icon: 'h-computer-desktop', t: 'Panel web', d: 'Una sola página servida por el propio hub, sin CDNs ni dependencias externas. Desde ahí se suben los archivos, se forman grupos y listas y se emite.' },
    { icon: 'h-video-camera', t: 'Análisis y recodificación', d: 'Al subir un video se lee su ficha y se decide si un TV corriente lo decodifica. Cuando no, el hub lo recodifica a 1080p con ffmpeg.' }
  ],

  capturas: [
    { src: '/img/soluciones/kioskcast/pantallas.webp', w: 1600, h: 1000,
      alt: 'Panel del hub de KioskCast con tres pantallas: dos en línea, una sin señal, con sus grupos y botones de emisión',
      cap: 'Pantallas: estado en vivo, grupos y los botones de mando de cada TV' },
    { src: '/img/soluciones/kioskcast/medios.webp', w: 1600, h: 1000,
      alt: 'Vista de medios del panel con archivos de video e imagen, su ficha técnica, tamaño y huella',
      cap: 'Medios: la ficha de cada video se analiza al subirlo y avisa si un TV no lo mueve' },
    { src: '/img/soluciones/kioskcast/listas.webp', w: 1600, h: 1000,
      alt: 'Vista de listas del panel con varias listas guardadas y sus piezas',
      cap: 'Listas: juntas las piezas con nombre y las emites con un botón' },
    { src: '/img/soluciones/kioskcast/registro.webp', w: 1600, h: 1000,
      alt: 'Vista de registro del panel con los últimos sucesos, su hora y quién los mandó',
      cap: 'Registro: cada comando queda con su hora, su emisor y la respuesta del TV' }
  ],

  avisoCapturas: 'Las cuatro imágenes son el panel de KioskCast con datos de ejemplo: no son instalaciones de clientes. Las IPs corresponden a la reserva 192.0.2.0/24, que está reservada para documentación y no pertenece a ninguna red real.',

  ficha: [
    ['Versión publicada del APK', '2.17 (code 21)'],
    ['Android mínimo', '8.0 (API 26)'],
    ['Puertos', '8421 para API y panel · 8422/UDP para el descubrimiento'],
    ['Capacidad de la API', '26 endpoints REST y canal WebSocket'],
    ['Datos del hub', 'SQLite: 7 tablas entre pantallas, medios, listas, grupos, cuentas y registro'],
    ['Archivo máximo por subida', '2 GB'],
    ['Requisitos del hub', 'Node.js 18 o superior, en el mismo equipo que la red del local'],
    ['Idioma del panel y de la app', 'Español'],
    ['Distribución', 'Entrega directa: instalación y alta de las pantallas a cargo de Servitecbaq'],
    ['Autor', 'Servitecbaq, Barranquilla']
  ],

  pasos: [
    { t: 'Vemos qué pantallas hacen falta', d: 'Dónde, cuántas, qué se quiere mostrar y con qué TVs o monitores cuentas ya. Muchas veces el aparato que está en la pared sirve tal cual.' },
    { t: 'Montamos el hub en tu red', d: 'Se instala en un equipo del local, con su servicio de arranque automático y el cortafuegos abierto en los dos puertos. No sale a internet.' },
    { t: 'Preparamos las pantallas', d: 'Instalamos la app en cada TV, lo ponemos en modo kiosco y le damos los permisos que necesita. Aquí es donde cada modelo de TV se comporta distinto y donde hay que estar.' },
    { t: 'Cargamos el contenido y enseñamos', d: 'Subimos tus piezas, armamos las listas y los grupos, y te dejamos emitiendo. La última parte es enseñarte a hacerlo tú sin nosotros.' }
  ],

  noHace: [
    'No tiene planificador por hora ni calendario: se emite la lista que tú mandas, no una programación que se activa sola según la hora.',
    'No funciona por internet ni con cuentas remotas: el hub vive en la red local del local, que es justamente lo que lo hace independiente del proveedor.',
    'No está en Google Play. Se instala directamente en el TV, y esa instalación la hacemos nosotros.',
    'La emisión superpuesta sobre otras apps necesita que se le conceda el permiso de mostrar encima de otras aplicaciones; sin ese permiso, el video suena pero no se ve.',
    'El arranque automático al encender el TV depende del firmware del aparato: hay modelos que no permiten que una app se quede de lanzadora, y eso se resuelve en sitio o se descarta.',
    'No es un muro de vídeo con regiones: una pantalla, un contenido a la vez, no varias ventanas simultáneas con clima y noticias.'
  ],

  faq: [
    { q: '¿Necesita internet?', a: 'No para emitir. El hub y las pantallas se hablan dentro de tu red, y cada TV guarda en caché lo último que recibió: si se cae el internet, la pantalla sigue con su bucle.' },
    { q: '¿Sirve con el TV que ya tengo?', a: 'Casi siempre, si es Android TV con Android 8.0 o más nuevo. Los que no corren Android se quedan fuera, y hay modelos cuyo firmware no deja sujetar el kiosco: eso se revisa antes de instalar, no después.' },
    { q: '¿Por qué no está en Google Play?', a: 'Porque no es una app de consumo: va paired con un hub instalado en el local, con su dirección y sus permisos. Publicarlo en la tienda no serviría de nada y obligaría a mantener una revisión de tienda en cada cambio.' },
    { q: '¿Cuántas pantallas aguanta un hub?', a: 'El límite no lo pone el software sino tu red: cada pantalla mantiene una conexión con el hub y emite en paralelo. Para un local con pocas decenas de TVs va sobrado; para una cadena con sedes en ciudades distintas hace falta un hub por sede.' },
    { q: '¿Quién es el dueño del software?', a: 'Servitecbaq. El código del hub, el panel y la app del TV es nuestro, y el montaje se contrata con nosotros: no hay suscripción de terceros que pagar ni una tienda en el medio.' },
    { q: '¿Cuánto cuesta?', a: 'No se cobra el software por separado: se cotiza el montaje junto con las pantallas que hacen falta, que va por el mismo camino que nuestras soluciones empresariales. Escríbenos con cuántos TVs y dónde, y te damos el alcance.' }
  ],

  related: ['empresariales', 'redes', 'desarrollo'],
  servicioUrl: '/servicios/soporte-tecnico-empresarial-barranquilla/',

  ctaTitle: '¿Montamos las pantallas de tu negocio?',
  ctaText: 'Cuéntanos cuántos televisores tienes y qué quieres que muestren. El software es nuestro, el montaje lo hacemos en Barranquilla, Soledad y Puerto Colombia, y la cotización va por el servicio de soluciones empresariales.'
};
