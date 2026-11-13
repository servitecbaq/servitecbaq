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
  h1: 'KioskCast, pantallas digitales que operan sin supervisión',
  meta: 'KioskCast convierte televisores Android en pantallas digitales gestionadas desde un hub local: bucles, grupos, caché sin internet y registro de lo emitido.',

  intro: [
    'KioskCast es la solución de señalización digital desarrollada por Servitecbaq para convertir un televisor comercial en la pantalla del negocio: reproduce en bucle los videos e imágenes que se le asignan, sin mando a distancia y sin supervisión permanente. Sirve para una recepción que promociona servicios, una cafetería que actualiza el menú según la franja horaria o varias sedes que muestran el mismo contenido al mismo tiempo.',
    'No es una aplicación descargada de una tienda ni un servicio en la nube con suscripción mensual. El software es de desarrollo propio, se instala en tu propia red y opera sin salida a internet: el panel de control se ejecuta en un equipo dentro del local y las pantallas se vinculan automáticamente. Si falla el proveedor de internet, las pantallas continúan emitiendo el último contenido cargado.'
  ],

  video: {
    src: '/img/soluciones/kioskcast/kioskcast-60s.mp4',
    poster: '/img/soluciones/kioskcast/kioskcast-60s.webp',
    w: 1920, h: 1080,
    title: 'KioskCast en 60 segundos',
    desc: 'Recorrido de un minuto por el panel del hub: medios, grupos, listas y la infraestructura local que mantiene la emisión dentro de la red del negocio.',
    nota: 'El video no lleva locución: estos son los textos que aparecen en pantalla.',
    guion: [
      '0–7 s · ¿Actualizar tus pantallas todavía significa recorrerlas una por una? Un pendrive, cuatro recorridos y versiones que nunca coinciden.',
      '7–15 s · KioskCast. Todas tus pantallas. Un solo panel. Administra contenido, listas y reproducción desde un hub dentro de tu propia red.',
      '15–24 s · Medios. Sube una vez. Emite cuando quieras.',
      '24–33 s · Grupos. Cada zona, su mensaje.',
      '33–42 s · Listas. Arma la secuencia. Pulsa emitir.',
      '42–51 s · Tu contenido viaja por tu red. No por internet. El hub sirve el panel y los medios; los televisores Android se conectan dentro de la red local.',
      '51–60 s · Convierte tus TVs en un canal de tu marca. Menos recorridos. Más control. Una experiencia consistente en cada pantalla. Hablemos de tus pantallas.'
    ]
  },

  sintomas: [
    { q: 'La pantalla se queda en el canal de televisión o en negro', a: 'Un televisor sin gestión muestra lo último que alguien dejó configurado. KioskCast fija el modo kiosco: la aplicación vuelve a primer plano si alguien la interrumpe y la pantalla permanece bajo control hasta que se libere desde el panel.' },
    { q: 'El menú o la promoción se actualizan con una memoria USB', a: 'Cada actualización exige desplazarse con la memoria y disponer de tiempo. Con KioskCast se carga el archivo en el panel y se emite a la pantalla seleccionada desde un único lugar.' },
    { q: 'Varias pantallas y ninguna muestra lo mismo al mismo tiempo', a: 'Los televisores se organizan en grupos y cada grupo emite una misma lista de forma simultánea. Distintos grupos pueden operar con contenidos diferentes sin interferencias.' },
    { q: 'No hay forma de comprobar qué se emitió', a: 'El hub registra cada comando con su hora y el usuario que lo ejecutó, y permite solicitar una captura de pantalla para verificar el contenido en emisión.' },
    { q: 'Un video de gran tamaño que el televisor no reproduce', a: 'Al cargarlo se analiza la ficha técnica del contenedor y el panel indica si un televisor Android estándar lo decodifica; cuando no, el hub lo recodifica a 1080p.' }
  ],

  capacidades: [
    'Bucle de videos MP4 e imágenes PNG/JPG, con intervalo fijo entre piezas',
    'Grupos de pantallas: una misma emisión a varios televisores al mismo tiempo',
    'Listas con nombre que se emiten con un clic',
    'Descubrimiento automático en la red: el televisor se registra al abrir la aplicación',
    'Caché local por huella SHA-256: la pantalla continúa emitiendo sin red',
    'Modo kiosco con pantalla siempre activa y en horizontal',
    'Bloqueo de modo kiosco: la aplicación recupera la pantalla si alguien la interrumpe',
    'Emisión superpuesta sobre lo que esté abierto en el televisor',
    'Control de volumen, pausa, detención y apertura de aplicaciones desde el panel',
    'Captura de lo que se muestra en cada pantalla para verificar sin desplazamiento',
    'Cuentas con rol administrador, permiso de gestión de contenido y control por pantalla',
    'Registro de comandos con usuario, hora y respuesta de cada pantalla'
  ],

  partes: [
    { icon: 'h-device-phone-mobile', t: 'Aplicación del televisor', d: 'Android 8.0 o superior, escrita en Kotlin con Media3 ExoPlayer. Reproduce en bucle, mantiene la caché local y se conecta al hub mediante WebSocket.' },
    { icon: 'h-server', t: 'Hub de gestión', d: 'Node.js con API REST, WebSocket y descubrimiento por UDP. Almacena medios, listas y registro en SQLite. Se instala como servicio de Windows o con systemd en Linux y Raspberry Pi.' },
    { icon: 'h-computer-desktop', t: 'Panel web', d: 'Una sola página servida por el propio hub, sin CDNs ni dependencias externas. Desde allí se cargan los archivos, se conforman grupos y listas y se emite.' },
    { icon: 'h-video-camera', t: 'Análisis y recodificación', d: 'Al cargar un video se analiza su ficha técnica y se determina si un televisor estándar lo decodifica. Cuando no, el hub lo recodifica a 1080p mediante ffmpeg.' }
  ],

  capturas: [
    { src: '/img/soluciones/kioskcast/pantallas.webp', w: 1600, h: 1000,
      alt: 'Panel del hub de KioskCast con tres pantallas agrupadas por zona y los botones de emisión de cada televisor',
      cap: 'Pantallas: grupos, permisos y controles de cada televisor' },
    { src: '/img/soluciones/kioskcast/medios.webp', w: 1600, h: 1000,
      alt: 'Vista de medios del panel con archivos de video e imagen, su ficha técnica, tamaño y huella',
      cap: 'Medios: la ficha de cada video se analiza al cargarlo y advierte si un televisor no puede reproducirlo' },
    { src: '/img/soluciones/kioskcast/listas.webp', w: 1600, h: 1000,
      alt: 'Vista de listas del panel con varias listas guardadas y sus piezas',
      cap: 'Listas: agrupa las piezas bajo un nombre y las emite con un clic' },
    { src: '/img/soluciones/kioskcast/registro.webp', w: 1600, h: 1000,
      alt: 'Vista de registro del panel con los últimos sucesos, su hora y quién los ejecutó',
      cap: 'Registro: cada comando queda con su hora, su emisor y la respuesta del televisor' }
  ],

  avisoCapturas: 'Las cuatro imágenes corresponden al panel de KioskCast con datos de ejemplo: no son instalaciones de clientes. Las IPs pertenecen a la reserva 192.0.2.0/24, destinada a documentación y ajena a cualquier red real.',

  ficha: [
    ['Versión publicada del APK', '2.17 (code 21)'],
    ['Android mínimo', '8.0 (API 26)'],
    ['Puertos', '8421 para API y panel · 8422/UDP para el descubrimiento'],
    ['Capacidad de la API', '26 endpoints REST y canal WebSocket'],
    ['Datos del hub', 'SQLite: 7 tablas entre pantallas, medios, listas, grupos, cuentas y registro'],
    ['Archivo máximo por subida', '2 GB'],
    ['Requisitos del hub', 'Node.js 18 o superior, en el mismo equipo que la red del local'],
    ['Idioma del panel y de la aplicación', 'Español'],
    ['Distribución', 'Entrega directa: instalación y alta de las pantallas a cargo de Servitecbaq'],
    ['Autor', 'Servitecbaq, Barranquilla']
  ],

  pasos: [
    { t: 'Definimos las pantallas necesarias', d: 'Ubicación, cantidad, contenido previsto y televisores o monitores disponibles. En muchos casos el equipo ya instalado es suficiente.' },
    { t: 'Instalamos el hub en la red del local', d: 'Se instala en un equipo del local, con inicio automático como servicio y las reglas de cortafuegos para los dos puertos. No requiere salida a internet.' },
    { t: 'Configuramos las pantallas', d: 'Se instala la aplicación en cada televisor, se configura el modo kiosco y se conceden los permisos requeridos. Cada modelo presenta particularidades que se resuelven en sitio.' },
    { t: 'Cargamos el contenido y capacitamos al personal', d: 'Se cargan las piezas, se configuran listas y grupos y el sistema queda en emisión. La etapa final es la capacitación para que el manejo sea autónomo.' }
  ],

  noHace: [
    'No incluye programación por franja horaria ni calendario: se emite la lista seleccionada, no una parrilla que se active automáticamente según la hora.',
    'No opera a través de internet ni con cuentas remotas: el hub reside en la red local del establecimiento, lo que garantiza independencia del proveedor de internet.',
    'No está en Google Play. Se instala directamente en el televisor y la instalación la realiza Servitecbaq.',
    'La emisión superpuesta requiere el permiso del sistema para mostrarse sobre otras aplicaciones; sin ese permiso, el audio se reproduce pero la imagen no se visualiza.',
    'El inicio automático al encender el televisor depende del firmware del equipo: algunos modelos no permiten asignar una aplicación como lanzador, situación que se resuelve en sitio o se descarta durante el levantamiento.',
    'No es un muro de video por regiones: cada pantalla muestra un contenido a la vez, no varias ventanas simultáneas con información y noticias.'
  ],

  faq: [
    { q: '¿Necesita internet?', a: 'No para emitir. El hub y las pantallas se comunican dentro de la red local, y cada televisor conserva en caché el último contenido recibido: si falla el internet, la pantalla continúa con su bucle.' },
    { q: '¿Sirve con el televisor que ya tengo?', a: 'En la mayoría de los casos, si es un Android TV con Android 8.0 o superior. Los equipos que no ejecutan Android no son compatibles, y los modelos cuyo firmware no permite fijar el modo kiosco se identifican durante la revisión previa.' },
    { q: '¿Por qué no está en Google Play?', a: 'Porque no es una aplicación de consumo: funciona vinculada a un hub instalado en el local, con su dirección y sus permisos definidos. Publicarla en la tienda no aportaría valor y exigiría un proceso de revisión en cada actualización.' },
    { q: '¿Cuántas pantallas admite un hub?', a: 'El límite lo determina la red, no el software: cada pantalla mantiene una conexión con el hub y emite en paralelo. Un solo hub es suficiente para un local con decenas de televisores; una cadena con sedes en distintas ciudades requiere un hub por sede.' },
    { q: '¿Quién es el dueño del software?', a: 'Servitecbaq. El código del hub, del panel y de la aplicación del televisor es de desarrollo propio, y la implementación se contrata directamente con nosotros: sin suscripciones de terceros ni intermediarios.' },
    { q: '¿Cuánto cuesta?', a: 'El software no se cobra por separado: la implementación se cotiza junto con las pantallas requeridas, dentro del mismo esquema de soluciones empresariales. Con la cantidad de televisores y su ubicación definimos el alcance.' }
  ],

  related: ['empresariales', 'redes', 'desarrollo'],
  servicioUrl: '/servicios/soporte-tecnico-empresarial-barranquilla/',

  ctaTitle: '¿Implementamos las pantallas de tu negocio?',
  ctaText: 'Indícanos cuántos televisores dispones y qué contenido deseas mostrar. El software es de desarrollo propio, la implementación se realiza en Barranquilla, Soledad y Puerto Colombia, y la cotización se gestiona a través del servicio de soluciones empresariales.'
};
