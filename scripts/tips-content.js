/* ============================================
   tips-content.js — contenido de las páginas /tips/<slug>/
   Consumido solo por scripts/build-pages.js en el build; el sitio no lo carga.
   Las claves son los índices de tips.json (orden del archivo tal cual).
   Por tip: slug, service (clave de services.json), h1, meta, intro[2],
   pasos[3-5], cuando, error, relacionados[3 índices].
   ============================================ */
module.exports = {

  /* ---------- Seguridad ---------- */
  0: {
    slug: 'bitlocker-cifrar-disco-completo',
    service: 'seguridad',
    h1: 'BitLocker: cifrar el disco completo del portátil',
    meta: 'BitLocker viene en Windows Pro y cifra el disco entero. Si roban un portátil, los documentos quedan ilegibles sin la clave. Cómo lo activamos bien.',
    intro: [
      'Windows Pro y Enterprise traen BitLocker incluido. Cifra el disco sector por sector, así que un equipo apagado y robado no es una fuente de datos: es un ladrillo hasta que alguien introduzca la clave correcta.',
      'Sin cifrado, basta con sacar el disco y conectarlo a otro equipo como unidad secundaria para leer todo lo que había dentro. Ese es exactamente el escenario que BitLocker cierra, y es la razón por la que lo pedimos antes que cualquier otro control en equipos que salen de la oficina.'
    ],
    pasos: [
      'Revisamos el tipo de disco y si la placa trae TPM 2.0; con TPM la clave se sella al hardware y el arranque queda protegido sin pedir contraseña extra.',
      'Creamos y guardamos la clave de recuperación en un lugar que no viva en el mismo equipo: cuenta Microsoft, archivo en una unidad aparte o impreso en el archivador de la oficina.',
      'Ciframos la unidad del sistema y, si aplica, las unidades de datos. Un disco de 512 GB tarda varias horas, así que se deja corriendo fuera del horario.',
      'Verificamos el estado con manage-bde -status y probamos que el equipo sigue arrancando normal antes de entregarlo.'
    ],
    cuando: 'Cualquier portátil que salga de la oficina o guarde contabilidad, nómina, historias clínicas o datos de clientes. En equipos domésticos con Windows Home no está disponible: ahí se cifra solo la carpeta de trabajo y se refuerza el respaldo.',
    error: 'Activar BitLocker sin guardar la clave de recuperación. Cuando la placa cambia, una actualización de firmware o la BIOS pide la clave, y sin ese archivo el disco es irrecuperable: no existe puerta trasera ni forma de sacarlo.',
    relacionados: [25, 23, 4]
  },

  1: {
    slug: 'laps-contrasena-unica-por-equipo',
    service: 'seguridad',
    h1: 'LAPS: una contraseña de administrador distinta en cada PC',
    meta: 'LAPS asigna y rota una contraseña de administrador local única por equipo y la guarda en Active Directory. Elimina la clave compartida de toda la red.',
    intro: [
      'En la mayoría de oficinas pequeñas la contraseña del administrador local es la misma en todos los equipos, porque es lo más cómodo de instalar. Ese único secreto compartido convierte cualquier PC comprometido en la puerta hacia los demás.',
      'Local Administrator Password Solution (LAPS) genera una contraseña aleatoria y larga por equipo, la rota sola según la frecuencia configurada y la deposita en un atributo de Active Directory protegido, de modo que solo quien debe verla puede recuperarla.'
    ],
    pasos: [
      'Extender el esquema de Active Directory con las plantillas de LAPS y verificar la replicación.',
      'Aplicar la directiva de grupo que crea la contraseña, define su longitud y el intervalo de rotación.',
      'Restringir quién lee el atributo en AD: el grupo de soporte, no cualquier usuario autenticado.',
      'Probar el flujo con un equipo fuera de línea y documentar el procedimiento para recuperar la clave en un caso real.'
    ],
    cuando: 'Redes con dominio, desde cinco equipos hacia arriba, y en cualquier oficina con contabilidad o sistemas que se abran como administrador local. Sin controlador de dominio no aplica: ahí la alternativa es una contraseña distinta por equipo guardada en un gestor.',
    error: 'Dejar el atributo de lectura abierto a Todos. Si cualquier usuario autenticado puede leer la contraseña de administrador de un equipo, el control se vuelve decorativo.',
    relacionados: [14, 4, 5]
  },

  2: {
    slug: 'windows-defender-application-control',
    service: 'seguridad',
    h1: 'Application Control: que solo corra lo firmado y aprobado',
    meta: 'Windows Defender Application Control bloquea ejecutables no aprobados. Es de lo más eficaz contra ransomware, pero exige una fase de prueba.',
    intro: [
      'Application Control (WDAC) funciona al revés que un antivirus: no busca lo malo, sino que bloquea todo lo que no esté en la lista de lo permitido. Un archivo descargado de un anuncio falso, una macro que suelta un ejecutable o un .exe suelto en Descargas no llegan a ejecutarse.',
      'Es el control con mejor relación eficacia-esfuerzo contra ransomware en equipos con software estable, y por eso se configura siempre en dos fases y nunca de golpe.'
    ],
    pasos: [
      'Levantar un inventario de lo que realmente se ejecuta en el equipo o el perfil de puesto.',
      'Generar una política base y aplicarla primero en modo de auditoría, sin bloquear nada.',
      'Dejarla entre una y dos semanas de trabajo normal y revisar el registro de eventos para ver qué faltaría.',
      'Pasar a modo impuesto, con la política de emergencia y el modo fuera de línea documentados antes de activarla.'
    ],
    cuando: 'Puestos de caja, recepción, quioscos, terminales de producción y cualquier equipo donde la gente no instala programas. En equipos de desarrollo o con software contable que cambia a menudo, conviene empezar por el bloqueo de carpetas de usuario, que es más suave.',
    error: 'Activar la política en modo impuesto sin fase de auditoría y sin ruta de recuperación. El resultado típico es un equipo que no deja abrir el sistema contable y un soporte sin cómo revertirlo.',
    relacionados: [6, 29, 5]
  },

  3: {
    slug: 'autenticacion-multiplicador-mfa',
    service: 'seguridad',
    h1: 'MFA: el segundo factor en correo, banca y acceso remoto',
    meta: 'El segundo factor bloquea más del 99 % de los accesos con contraseña robada. Dónde activar MFA primero y qué usar cuando no hay Microsoft 365.',
    intro: [
      'La mayor parte de las cuentas comprometidas no se rompen: se inician con una contraseña válida obtenida en un robo masivo, en un correo de phishing o en una filtración de otro servicio. Un segundo factor convierte esa contraseña en información insuficiente.',
      'No es un control perfecto —existe el fatigado por notificaciones y el robo de sesión—, pero es el cambio que más superficie protege por hora invertida, sobre todo en el correo, que es a la vez cuenta y llave de recuperación de las demás.'
    ],
    pasos: [
      'Empezar por el correo corporativo y la banca en línea, que son las cuentas desde las que se resetean todas las otras.',
      'Activar MFA también en el acceso remoto: VPN, escritorio remoto y panel del proveedor de facturación.',
      'Preferir aplicación autenticadora o llave física por encima del SMS, que se puede interceptar con portabilidad de línea.',
      'Definir y probar el procedimiento para un equipo perdido o un viajero sin teléfono, porque si no existe, el usuario termina pidiendo que le quiten el factor.'
    ],
    cuando: 'Siempre que el servicio lo ofrezca. Si el correo va en Google Workspace o Microsoft 365, es un interruptor. Si el correo es de un hosting económico con Webmail, se puede reforzar con MFA en el panel del hosting y cambiando la contraseña de acceso.',
    error: 'Activar MFA y no dejar métodos de respaldo. Al día siguiente alguien pierde el teléfono, no hay forma de entrar, y el sistema se desactiva a las prisas sin volver a activarse nunca.',
    relacionados: [13, 5, 20]
  },

  4: {
    slug: 'permisos-ntfs-bien-configurados',
    service: 'seguridad',
    h1: 'Permisos NTFS: que cada quien vea solo lo suyo',
    meta: 'Permisos heredados, Todos con control total y una carpeta compartida que lee todo el mundo. Así se arreglan los permisos NTFS en una red pequeña.',
    intro: [
      'Casi toda carpeta compartida que revisamos llega igual: permisos heredados de la unidad, el grupo Todos con control total y una estructura de carpetas que fue creciendo por copiar y pegar. El resultado es que cualquier equipo de la red puede leer, borrar o reemplazar la contabilidad.',
      'Corregirlo no es un proyecto grande, pero sí exige orden: definir primero quién debe ver qué, aplicar permisos sobre grupos y no sobre usuarios, y romper la herencia justo donde empieza la información sensible.'
    ],
    pasos: [
      'Mapear carpetas contra roles reales: contabilidad, gerencia, talento humano, operación, público.',
      'Crear grupos de seguridad con nombre de rol y quitar el acceso directo de usuarios individuales.',
      'Aplicar la escalera mínima: Lectura y ejecución en lo común, Modificar donde se trabaja, y accesos especiales solo donde hay datos sensibles.',
      'Verificar desde una cuenta de prueba que lo que no debe verse no se ve, y documentar la matriz para las altas y bajas.'
    ],
    cuando: 'En cuanto hay una carpeta compartida con información que no le toca a todo el mundo, y de forma obligatoria al recibir un empleado nuevo o al irse uno. En equipos sin dominio se logra con usuarios locales distintos y carpetas con acceso compartido restringido.',
    error: 'Agregar usuarios directos en la pestaña de Seguridad. Meses después nadie sabe quién tiene acceso a qué, y al irse una persona quedan permisos huérfanos que nadie revisa.',
    relacionados: [5, 1, 22]
  },

  5: {
    slug: 'auditoria-de-eventos-en-windows',
    service: 'seguridad',
    h1: 'Auditoría de eventos: saber quién entró y qué se borró',
    meta: 'Habilitar la auditoría de eventos de Windows deja rastro de inicios de sesión, cambios de permisos y borrados. Qué eventos activar y dónde se ven.',
    intro: [
      'Cuando algo sale mal en una red, la pregunta es siempre la misma: quién lo hizo y a qué hora. Sin auditoría activada, la respuesta es imposible, porque Windows no guarda ese detalle por defecto.',
      'Activar cuatro o cinco categorías de auditoría y saber leer el Visor de eventos convierte un incidente difuso en un hecho documentado, y es lo que permite distinguir un error de alguien de un acceso indebido real.'
    ],
    pasos: [
      'Habilitar inicio y cierre de sesión, cambio de estado de cuenta, acceso a objetos y cambio de directivas de auditoría.',
      'Fijar el tamaño y la política del registro de seguridad para que no sobrescriba semanas buenas en un mes movido.',
      'Aprender los eventos clave: 4624 de inicio de sesión, 4625 de intento fallido, 4672 de privilegios especiales y 4720/4726 de cuentas creadas o borradas.',
      'Dejar una rutina de revisión semanal y un respaldo de los registros antes de cualquier borrado masivo programado.'
    ],
    cuando: 'En el servidor o el equipo que guarda la información, y en cualquier dominio. En una red sin servidor, se activa en el equipo de contabilidad y se revisa de vez en cuando; no es lo mismo que un dominio, pero da rastro.',
    error: 'Activar auditoría de acceso a objetos sobre toda la unidad. El registro se llena, el equipo se pone lento y el archivo de seguridad termina en sobrescritura permanente, que es justo cuando se necesita.',
    relacionados: [4, 1, 31]
  },

  6: {
    slug: 'firewall-con-reglas-de-salida',
    service: 'seguridad',
    h1: 'Firewall de Windows con reglas de salida',
    meta: 'Todos miran las entradas, pero el malware se va por las reglas de salida. Cómo limitar qué programas pueden conectar a Internet en Windows.',
    intro: [
      'El firewall de Windows está activado por defecto, pero en la práctica solo filtra lo que entra. Lo que sale casi nunca está controlado, y un equipo ya infectado no necesita un puerto abierto para llamar a su servidor de control y bajar más cosas.',
      'Las reglas de salida cambian el enfoque: se define qué aplicaciones pueden conectar y se bloquea el resto. Es más engorroso de mantener que una lista de entradas, por eso se aplica por perfil de equipo y no a todo el parque por igual.'
    ],
    pasos: [
      'Definir el perfil: puesto de trabajo estándar, puesto crítico o servidor.',
      'Permitir salida explícita del navegador, el correo, el sistema contable y las actualizaciones de Windows.',
      'Bloquear la ejecución y la salida desde carpetas temporales, Descargas y AppData, que es de donde salen la mayoría de los binarios de malware.',
      'Revisar cada cierto tiempo la lista de reglas y documentar qué programa se agregó y por qué.'
    ],
    cuando: 'Equipos con información sensible, servidores y puestos que no instalan software. En una casa con un solo equipo, basta con el perfil público bien configurado y no compartir en redes ajenas.',
    error: 'Crear reglas de salida que permitan todo el programa de turno con la excusa de que «así funciona». Cada regla de permiso amplio es un agujero permanente que nadie vuelve a cerrar.',
    relacionados: [2, 17, 5]
  },

  /* ---------- Productividad ---------- */
  7: {
    slug: 'task-scheduler-con-powershell',
    service: 'empresariales',
    h1: 'Task Scheduler con PowerShell: lo repetitivo solo',
    meta: 'Limpieza de temporales, respaldo nocturno o reporte de discos: Task Scheduler ejecuta un script de PowerShell a una hora fija y se acabó la rutina.',
    intro: [
      'Hay tareas que se hacen «de vez en cuando» y nunca se hacen: limpiar la carpeta de temporales, sacar un listado de equipos con poco disco, comprimir los archivos del mes. Un script de veinte líneas y una tarea programada los convierten en algo que ocurre solo.',
      'La ventaja no es solo el tiempo ahorrado, sino la constancia: una rutina manual se relaja en dos semanas, una tarea programada sigue corriendo aunque nadie la recuerde.'
    ],
    pasos: [
      'Escribir el script con salidas a un archivo de registro, para poder revisar qué hizo sin estar mirando la pantalla.',
      'Probarlo a mano con una cuenta igual a la que lo ejecutará, porque el error típico es de permisos sobre rutas de red.',
      'Crear la tarea en Task Scheduler con el disparador correcto y la opción de ejecutar aunque el usuario no haya iniciado sesión, cuando aplica.',
      'Dejar una segunda tarea o un evento de registro que avise cuando la primera falla, porque una tarea silenciosa falla en silencio.'
    ],
    cuando: 'Cualquier cosa que se repita a diario o semanalmente en más de un equipo: limpieza, respaldos, reportes, renovación de certificados. Con dominio, la tarea se despliega por directiva de grupo en lugar de crearla equipo por equipo.',
    error: 'Guardar la contraseña del servicio dentro del script en texto plano. Se resuelve con una cuenta de servicio de privilegios mínimos o con credenciales cifradas en el almacén de Windows.',
    relacionados: [27, 23, 5]
  },

  8: {
    slug: 'snap-layouts-ventanas-windows',
    service: 'mantenimiento',
    h1: 'Snap Layouts: organizar ventanas con Win + Z',
    meta: 'En Windows 11, Win + Z reparte la pantalla en diseños fijos. Para quien trabaja con dos o tres ventanas abiertas todo el día, cambia el día.',
    intro: [
      'Media pantalla para el correo, un tercio para el sistema contable y el resto para el navegador. Hacerlo a mano con el mouse es mover ventanas y ajustar bordes cada vez que se abre algo.',
      'Los diseños de acoplamiento de Windows 11 lo dejan en una combinación de teclas: Win + Z elige el diseño y Win + flecha manda la ventana al hueco. Una vez que se prueba, el ajuste manual deja de usarse.'
    ],
    pasos: [
      'Activar la opción en Configuración > Sistema > Multitarea y probar los diseños con Win + Z.',
      'Mover ventanas entre huecos con Win + flecha y agrupar con Win + Tab para cambiar de grupo completo.',
      'Configurar los diseños que se usan a diario en el monitor principal y revisar la escala si hay dos monitores distintos.',
      'Si el equipo aún está en Windows 10, PowerToys agrega una cuadrícula de ventanas equivalente.'
    ],
    cuando: 'Puestos donde hay siempre tres o más ventanas abiertas: recepción, contabilidad, atención al cliente. En pantallas de 13 pulgadas con una sola ventana a la vez, aporta poco.',
    error: 'Usarlo con un solo monitor de 24 pulgadas y escala al 150 %: los diseños dejan texto ilegible en dos columnas. Ahí conviene un monitor secundario antes que más atajos.',
    relacionados: [9, 10, 12]
  },

  9: {
    slug: 'escritorios-virtuales-windows',
    service: 'mantenimiento',
    h1: 'Escritorios virtuales con Win + Tab',
    meta: 'Separar trabajo, correo y personal en escritorios distintos de Windows. Win + Tab, Task View y por qué ayuda a no perder ventanas.',
    intro: [
      'El problema no es tener muchas ventanas abiertas, es tenerlas todas en el mismo lugar: el navegador con veinte pestañas peleando con el contable y el chat del cliente. Win + Tab abre Task View y permite repartir todo en escritorios separados.',
      'No es una herramienta nueva ni hace nada que no se pudiera hacer antes, pero cambia el hábito: cada escritorio guarda su contexto y al cambiar de tarea no se cierra nada, solo se mueve uno de escritorio.'
    ],
    pasos: [
      'Abrir Task View con Win + Tab y crear un escritorio por tipo de trabajo, no por proyecto.',
      'Mover ventanas entre escritorios arrastrándolas en Task View o con Win + Ctrl + Shift + flecha.',
      'Cambiar entre escritorios con Win + Ctrl + flecha, que es el atajo que hace que se use de verdad.',
      'Asignar un fondo distinto a cada escritorio para saber dónde se está sin mirar las ventanas.'
    ],
    cuando: 'Equipos con una sola pantalla donde se alternan tareas que no se mezclan: administración y navegación, diseño y correo. Con dos monitores físicos suele sobrar.',
    error: 'Crear un escritorio por cada cosa y perder la cuenta. Con dos o tres se gana; con ocho se vuelve a estar igual que antes, pero más confundido.',
    relacionados: [8, 10, 11]
  },

  10: {
    slug: 'powertoys-microsoft-utilidades',
    service: 'mantenimiento',
    h1: 'PowerToys: cuatro utilidades que valen la instalación',
    meta: 'PowerToys trae FancyZones, PowerRename, el selector de colores y Awake. Gratis, de Microsoft, y sin tocar el registro del equipo.',
    intro: [
      'PowerToys es un paquete oficial de Microsoft con herramientas que Windows debió traer siempre. Se instala sin tocar el registro ni desactivar nada del sistema, y se puede quitar limpio.',
      'De todo el paquete, cuatro funciones justifican tenerlo en un equipo de trabajo: FancyZones para diseños de ventana fijos, PowerRename para renombrar por lotes desde el menú contextual, el selector de colores y Awake para evitar que el equipo duerma mientras corre una tarea larga.'
    ],
    pasos: [
      'Instalar desde GitHub o desde el Administrador de paquetes de Windows, y dejar que se actualice solo.',
      'Configurar FancyZones con los diseños que se usan a diario, no con los que trae por defecto.',
      'Probar PowerRename sobre una copia de una carpeta de trabajo antes de usarlo sobre la original.',
      'Activar solo los módulos que se usan: cada módulo extra es una proceso residente y una ventana de configuración abierta.'
    ],
    cuando: 'En equipos de diseño, contabilidad con archivos por lotes y en cualquier puesto con pantalla grande donde se organizan ventanas a mano. En equipos con disco mecánico y poca RAM, conviene no instalarlo.',
    error: 'Instalarlo en un equipo de producción con software contable sensible a ventanas superpuestas. FancyZones cambia cómo se acomodan las ventanas y hay aplicaciones antiguas que lo sufren.',
    relacionados: [11, 8, 9]
  },

  11: {
    slug: 'everything-busqueda-archivos-windows',
    service: 'mantenimiento',
    h1: 'Everything: encontrar archivos en segundos',
    meta: 'La búsqueda de Windows tarda y falla. Everything indexa los nombres de NTFS al instante y encuentra cualquier archivo en un equipo de trabajo.',
    intro: [
      'La búsqueda integrada de Windows indexa contenido, respeta permisos y se le escapan carpetas. En un equipo con años de archivos, encontrar «ese Excel del mes pasado» se vuelve un ejercicio de memoria de rutas.',
      'Everything lee directamente la tabla de archivos maestra de las unidades NTFS: indexa millones de nombres en segundos y muestra resultados mientras se escribe. Es gratuito, portable y no envía nada a Internet.'
    ],
    pasos: [
      'Instalar la versión de escritorio y dejar que corra como servicio si se quiere búsqueda de red.',
      'Indexar solo las unidades de datos; indexar todo incluye carpetas del sistema que nadie busca.',
      'Aprender los filtros por extensión y por carpeta, que es donde se gana tiempo real.',
      'Revisar las opciones de privacidad si el equipo tiene documentos sensibles compartidos en red.'
    ],
    cuando: 'Cualquier equipo con mucho archivo local: contabilidad, ingeniería, fotografía, oficinas con carpetas compartidas montadas como unidad. En un portátil con dos carpetas, no aporta nada.',
    error: 'Compartir el índice por red sin restringirlo. Cualquier equipo de la red puede buscar en los nombres de archivo del tuyo, y ahí aparecen cosas como «nómina noviembre.xlsx».',
    relacionados: [10, 12, 4]
  },

  12: {
    slug: 'historial-del-portapapeles-win-v',
    service: 'mantenimiento',
    h1: 'Historial del portapapeles con Win + V',
    meta: 'Win + V guarda los últimos elementos copiados, incluidos fragmentos de texto. Un cambio de hábito que evita reescribir datos una y otra vez.',
    intro: [
      'El portapapeles normal guarda una sola cosa: al copiar lo siguiente, lo anterior se pierde. En tareas de capturar datos —de un PDF al contable, de un correo al sistema— eso obliga a ir y venir de ventana en ventana.',
      'El historial de Windows conserva las últimas copias, permite pegar cualquiera con Win + V y se sincroniza entre equipos si se activa. Es un interruptor, no una instalación.'
    ],
    pasos: [
      'Activarlo en Configuración > Sistema > Portapapeles.',
      'Fijar con el alfiler los elementos que se usan todo el día, porque el resto se rota.',
      'Usar Win + V en lugar de Ctrl + V cuando se necesita elegir qué pegar.',
      'Revisar la sincronización antes de activarla en un equipo compartido o de oficina.'
    ],
    cuando: 'Puestos de digitación, facturación, recepción y cualquier trabajo de copiar y pegar entre dos sistemas. En un equipo usado por varias personas, mejor sin sincronizar.',
    error: 'Dejar el historial con datos sensibles sin borrar. Contraseñas, números de tarjeta y cédulas se quedan ahí hasta que se rotan o se borran.',
    relacionados: [8, 9, 5]
  },

  /* ---------- Redes ---------- */
  13: {
    slug: 'escritorio-remoto-sobre-vpn',
    service: 'redes',
    h1: 'Escritorio remoto sobre VPN, nunca con el puerto abierto',
    meta: 'Abrir el 3389 a Internet es la puerta que barren los ransomware. El acceso remoto correcto es un túnel VPN y RDP solo dentro de la red.',
    intro: [
      'Publicar el puerto de escritorio remoto en el router es la forma rápida de poder entrar desde fuera, y es también lo primero que escanean los bots que buscan equipos expuestos. Los intentos de fuerza bruta sobre RDP público se cuentan por miles al día.',
      'La alternativa no es más cara: una VPN en el router o en un equipo de la red deja al usuario dentro de la red local, y desde ahí el escritorio remoto funciona como funciona siempre, sin exponer nada a Internet.'
    ],
    pasos: [
      'Activar la VPN del router (WireGuard o IPsec) o montar un servidor VPN aparte, y crear un usuario por persona.',
      'Cerrar cualquier redirección de puerto 3389 que ya exista en el módem.',
      'Restringir RDP al grupo de usuarios que debe entrar y, si hay dominio, protegerlo por directiva de grupo.',
      'Probar el flujo completo desde una red externa y documentar qué equipo se puede tocar desde fuera.'
    ],
    cuando: 'Siempre que se necesite entrar a la oficina desde casa o desde otro ciudad. Si el proveedor de internet entrega IP dinámica, la VPN lo sigue permitiendo sin depender de una IP fija.',
    error: 'Dejar RDP expuesto con la contraseña de siempre y sin segundo factor. Es el vector de la mayoría de los ransomware que llegan a una oficina pequeña.',
    relacionados: [3, 16, 6]
  },

  14: {
    slug: 'directivas-de-grupo-gpo',
    service: 'empresariales',
    h1: 'Group Policy: configurar todos los PCs a la vez',
    meta: 'Con Active Directory, una GPO aplica pantalla de bloqueo, fondo, unidades de red y permisos en todos los equipos. Sin entrar uno por uno.',
    intro: [
      'En una red con dominio, configurar equipo por equipo no escala: a los tres meses cada PC tiene una política distinta y nadie sabe por qué. Las directivas de grupo aplican el mismo criterio a todos y dejan registro de quién lo cambió.',
      'Lo útil en una oficina pequeña no son las cien opciones del editor, sino un puñado: bloqueo de pantalla, protector de pantalla, unidades de red mapeadas, impresora predeterminada, hora sincronizada y permisos de instalación de software.'
    ],
    pasos: [
      'Crear una unidad organizativa por tipo de puesto, no una por persona.',
      'Enlazar directivas pequeñas y con nombre claro, en lugar de una sola directiva gigante.',
      'Enlazar primero en un grupo de prueba y verificar con gpresult /h antes de subirlo a toda la red.',
      'Documentar qué directiva hace qué: es el único lugar donde alguien entenderá la red dentro de dos años.'
    ],
    cuando: 'A partir de unos diez equipos con controlador de dominio. Por debajo, el costo de mantener el dominio puede superar el beneficio y alcanza con perfiles locales bien armados.',
    error: 'Editar la directiva Default Domain Policy para todo. Se rompe el bloqueo de cuenta, la expiración de contraseñas y después nadie recuerda qué estaba ahí.',
    relacionados: [1, 4, 27]
  },

  15: {
    slug: 'reservas-dhcp-por-direccion-mac',
    service: 'redes',
    h1: 'Reservas DHCP: que la impresora no cambie de IP',
    meta: 'Reservar la IP por dirección MAC en el router o el servidor DHCP evita que la impresora, el DVR o un equipo dejen de responder de pronto.',
    intro: [
      'Muchos fallos «de la impresora» o «de las cámaras» no son de la impresora ni de las cámaras: el servidor DHCP entregó una IP nueva después de un reinicio y el equipo que apuntaba a la vieja quedó buscando en el aire.',
      'Una reserva DHCP ata la dirección MAC del dispositivo a una IP fija dentro del rango. El dispositivo sigue obteniendo su dirección automáticamente, pero siempre la misma, sin configurar nada en cada equipo.'
    ],
    pasos: [
      'Definir un rango bajo del pool para dispositivos fijos y dejar el resto para visitantes y celulares.',
      'Listar las MAC de impresora, DVR/NVR, AP y equipos críticos antes de tocar el router.',
      'Crear las reservas con un nombre legible por dispositivo, no por número de serie.',
      'Documentar la tabla de reservas y guardarla fuera del router, porque al restablecer la configuración se pierde.'
    ],
    cuando: 'En toda red con más de un dispositivo que se comparte: impresora en red, cámaras, NAS, equipo de facturación. En una casa con un solo computador y un celular, no hace falta.',
    error: 'Dar IP estática a mano en cada equipo sin llevar registro. A los seis meses hay dos dispositivos peleándose por la misma dirección y el fallo aparece y desaparece según quién encienda primero.',
    relacionados: [16, 18, 2]
  },

  16: {
    slug: 'vlans-para-separar-trafico',
    service: 'redes',
    h1: 'VLAN: que las cámaras no compartan red con la oficina',
    meta: 'Separar CCTV, invitados y equipos de trabajo en VLAN distintas limita el daño de un compromiso y ordena el tráfico de la red de la oficina.',
    intro: [
      'En la mayoría de las redes pequeñas todo está en la misma red: celulares personales, la cámara del local, la impresora y el computador donde está la contabilidad. Cualquiera de esos dispositivos, si se compromete, ve a todos los demás.',
      'Dividir en VLANs corta ese camino. Las cámaras no alcanzan el servidor, los invitados no ven la impresora y el tráfico pesado de video no interfiere con el sistema contable.'
    ],
    pasos: [
      'Definir los segmentos: trabajo, servidores, CCTV e invitados, con un rango y una puerta de enlace por segmento.',
      'Configurar el router o el switch gestionado y verificar que los puertos pertenezcan a la VLAN correcta.',
      'Montar las reglas de paso entre VLAN: se permite lo necesario, no todo.',
      'Probar desde cada segmento que lo que no debe verse no se ve, y documentar la matriz.'
    ],
    cuando: 'Cuando hay cámaras IP, red de invitados o más de un tipo de dispositivo con intereses distintos. Requiere equipo que soporte VLAN; con el módem del proveedor no se puede.',
    error: 'Crear VLANs y dejarlas todas enrutadas entre sí sin filtro. Se gana la complejidad de dividirlas y no se gana el aislamiento, que era el punto.',
    relacionados: [15, 17, 6]
  },

  17: {
    slug: 'dns-con-filtrado-contenido',
    service: 'redes',
    h1: 'DNS con filtrado: Quad9 y Cloudflare for Families',
    meta: 'Cambiar el DNS de la red por uno con filtrado bloquea dominios de malware y contenido para adultos sin instalar nada en cada equipo.',
    intro: [
      'Antes de que un equipo descargue nada, resuelve un nombre. Si ese paso se hace contra un DNS que ya conoce los dominios de malware, de phishing o de contenido para adultos, la conexión ni siquiera se intenta.',
      'Es la defensa con mejor relación esfuerzo-cobertura que existe para una red doméstica o una oficina sin servidor: no instala nada en los equipos, no cuesta y cubre también a los celulares y las cámaras conectados al Wi-Fi.'
    ],
    pasos: [
      'Elegir el nivel de filtrado: Quad9 bloquea dominios maliciosos; Cloudflare Family agrega el contenido para adultos.',
      'Configurar el DNS en el router, no en cada equipo, para que cubra todo lo que se conecta por Wi-Fi.',
      'Verificar con la página de prueba del proveedor que las consultas salen por el DNS nuevo.',
      'Dejar un segundo servidor de respaldo y documentar cómo se desactiva temporalmente cuando algo legitimo queda bloqueado.'
    ],
    cuando: 'Redes con niños, locales con Wi-Fi abierto al público y cualquier oficina que no tenga un filtro de contenido en el servidor. No reemplaza el control parental con horarios, pero lo acompaña.',
    error: 'Olvidar que algunos equipos traen DNS fijo de fábrica. Se configura el router, se cree protegido, y un portátil con DNS escrito a mano sigue saliendo sin filtro.',
    relacionados: [16, 6, 3]
  },

  18: {
    slug: 'analisis-de-canales-wifi',
    service: 'redes',
    h1: 'Análisis de canales Wi-Fi antes de cambiar el router',
    meta: 'Antes de comprar un router nuevo: ver qué canales están ocupados, medir la señal real y mover el punto de acceso. Casi siempre hay una causa física.',
    intro: [
      'El diagnóstico más caro es el que se hace sin medir. «El internet va lento» puede ser el plan contratado, el canal saturado del vecindario, un microondas, o el punto de acceso metido detrás de un tablero metálico.',
      'Un análisis de espectro toma diez minutos y responde cuál de todos es. En un edificio de Barranquilla con veinte redes visibles en el mismo canal, el problema casi nunca es el proveedor.'
    ],
    pasos: [
      'Escanear las redes visibles y anotar en qué canales están, con el analizador integrado de Windows o una app del celular.',
      'Medir la señal real en los puntos donde se trabaja, no al lado del router.',
      'Mover el canal o el ancho de banda: 20 MHz en 2.4 GHz y 40/80 en 5 GHz según el caso.',
      'Repetir la medición después del cambio para poder decir si mejoró, y recién ahí evaluar un repetidor o un sistema mesh.'
    ],
    cuando: 'Cortes que aparecen a ciertas horas, video que se traba en una punta del local, o una oficina donde el Wi-Fi funciona en unas sillas y en otras no.',
    error: 'Subir la potencia del router al máximo creyendo que así llega más lejos. Aumenta la interferencia propia y la de todos los vecinos, y la batería de los celulares se pega.',
    relacionados: [16, 19, 15]
  },

  19: {
    slug: 'wpa3-en-redes-corporativas',
    service: 'redes',
    h1: 'WPA3 en la red de la oficina',
    meta: 'WPA3 cierra los ataques por diccionario que funcionan contra WPA2 y protege mejor las contraseñas cortas. Qué equipos lo soportan y cómo migrar.',
    intro: [
      'WPA2 se rompió de una forma práctica con los ataques offline: se captura el apretón de manos y se prueban millones de contraseñas contra esa captura, sin tocar la red. Una contraseña corta o de diccionario cae en minutos.',
      'WPA3 cambia ese esquema con un intercambio que no se puede reutilizar fuera de la sesión y con protección adicional cuando la contraseña es débil. No hace invulnerable una contraseña mala, pero cierra la puerta del ataque masivo.'
    ],
    pasos: [
      'Revisar el soporte en el punto de acceso y en los clientes: cámaras antiguas e impresoras son las que se quedan.',
      'Migrar primero la red de trabajo y dejar una red secundaria en WPA2 para lo que no levante WPA3.',
      'Usar una contraseña larga aunque el protocolo sea nuevo, porque WPA3 no reemplaza la longitud.',
      'Activar el modo mixto solo mientras dura la migración y cerrarlo cuando ya no queden clientes viejos.'
    ],
    cuando: 'Redes nuevas o con clientes modernos, y siempre que se monte una red de trabajo con información sensible. En un local con cámaras de 2015, la respuesta realista es aislarlas en su propia VLAN.',
    error: 'Poner WPA3 solo y descubrir después que la impresora o la cámara no se conectan. Sin red de transición, el resultado es volver a WPA2 y quedarse sin nada.',
    relacionados: [16, 17, 18]
  },

  /* ---------- Datos ---------- */
  20: {
    slug: 'file-history-onedrive-kfm',
    service: 'seguridad',
    h1: 'File History y OneDrive KFM: dos capas de versión',
    meta: 'File History guarda versiones locales y OneDrive KFM respalda Escritorio, Documentos e Imágenes en la nube. Así se combinan sin duplicar espacio.',
    intro: [
      'Perder un archivo por un disco dañado es una desgracia; perderlo porque alguien lo sobrescribió hace tres semanas y no hay versión anterior es una tontería evitable. Las dos capas que cubren eso en Windows ya vienen incluidas.',
      'File History guarda versiones locales en un disco externo. Known Folder Move redirectiona Escritorio, Documentos e Imágenes a OneDrive, que conserva versiones propias del archivo. Juntas cubren el sobrescribir y el perder el equipo.'
    ],
    pasos: [
      'Definir cuál de las dos capas es la copia larga y cuál la local, para no guardar lo mismo dos veces en el mismo disco.',
      'Activar KFM en OneDrive y dejar que termine la sincronización inicial antes de trabajar.',
      'Configurar File History sobre un disco externo que no sea el mismo donde se trabaja.',
      'Probar restaurar una versión de un archivo real, no solo confiar en que está activado.'
    ],
    cuando: 'Equipos de una sola persona o oficinas sin servidor. Con dominio y perfil roaming, la estrategia cambia a respaldo del servidor y las carpetas redirigidas por directiva.',
    error: 'Poner File History a apuntar a la misma unidad donde están los documentos. Un fallo de disco se lleva el original y la «copia» a la vez.',
    relacionados: [24, 23, 22]
  },

  21: {
    slug: 'storage-sense-limpieza-automatica',
    service: 'mantenimiento',
    h1: 'Storage Sense: que Windows limpie solo el disco',
    meta: 'Storage Sense borra temporales, vacía la papelera y limpia Descargas según reglas. Recupera gigas en discos pequeños sin instalar nada.',
    intro: [
      'Los discos de 128 y 256 GB se llenan con lo que nadie usa: actualizaciones viejas de Windows, archivos temporales, instaladores que quedaron en Descargas y una papelera con meses. Storage Sense barre eso con reglas que se definen una vez.',
      'No es una herramienta de rescate cuando el disco ya está lleno al 98 %; funciona mejor dejándolo configurado desde el principio, limpiando un poco cada semana.'
    ],
    pasos: [
      'Activarlo en Configuración > Sistema > Almacenamiento y elegir cada cuánto corre.',
      'Definir la regla de la papelera y de la carpeta de Descargas, que es donde más espacio se recupera.',
      'Revisar primero con «Archivos que no se abren hace mucho» en modo sugerencia antes de borrar automático.',
      'Dejar limpio temporal para actualizaciones: un disco al 95 % no instala parches y Windows empieza a fallar raro.'
    ],
    cuando: 'Portátiles con SSD pequeño y equipos de uso general. En estaciones de trabajo con proyectos grandes, la limpieza automática de Descargas puede molestar más de lo que ayuda.',
    error: 'Configurar limpieza automática de Descargas en un equipo donde esa carpeta se usa como archivo. Lo borrado no está en la papelera: se fue.',
    relacionados: [31, 22, 26]
  },

  22: {
    slug: 'versiones-anteriores-shadow-copies',
    service: 'seguridad',
    h1: 'Versiones anteriores de un archivo (Shadow Copies)',
    meta: 'Las copias de volumen de Windows permiten abrir un archivo de ayer desde sus propiedades. Cómo activarlas en una carpeta compartida y en un PC.',
    intro: [
      'El punto de restauración más rápido del mundo es poder abrir el archivo que se dañó ayer sin tocar un respaldo. Eso son las shadow copies: Windows toma instantáneas de un volumen y las expone en el menú «Versiones anteriores».',
      'En un servidor o en el equipo que comparte la carpeta, cubre a todos los usuarios a la vez. En un PC de escritorio, cubre ese equipo y sirve como red de seguridad para el que trabaja sin respaldo.'
    ],
    pasos: [
      'Activar la protección del sistema en la unidad donde están los datos y asignar el espacio máximo.',
      'Programar las tomas: en el servidor, cada hora durante el horario de trabajo suele bastar.',
      'Explicar al usuario cómo entrar con clic derecho > Propiedades > Versiones anteriores, que es donde se usa de verdad.',
      'Entender que no reemplaza el respaldo: si el disco muere, las versiones mueren con él.'
    ],
    cuando: 'Carpetas compartidas con documentos que se editan a diario y cualquier equipo con protección del sistema activada. No sirve para bases de datos grandes, que necesitan su propio respaldo.',
    error: 'Tratar las versiones anteriores como respaldo y no tener copia externa. Son una comodidad de recuperación, no una copia de seguridad.',
    relacionados: [23, 20, 24]
  },

  23: {
    slug: 'regla-3-2-1-de-respaldo',
    service: 'seguridad',
    h1: 'La regla 3-2-1 de respaldo, en una oficina pequeña',
    meta: 'Tres copias, dos medios distintos, una fuera del sitio. Cómo aplicarla de verdad en una PYME sin gastar en infraestructura de respaldo.',
    intro: [
      'La regla es vieja y sigue siendo el mejor resumen: tres copias de lo importante, en dos tipos de medio distintos, con una fuera del sitio. No es un producto que se compra, es una decisión sobre dónde queda cada copia.',
      'En una oficina pequeña el fallo típico no es no tener respaldo, es tener dos copias en el mismo disco y en el mismo escritorio. Se queman las dos en el mismo evento: un robo, una inundación o un ransomware que cifra lo que ve.'
    ],
    pasos: [
      'Listar qué información no se puede volver a conseguir: contabilidad, clientes, correos, base de datos, diseños.',
      'Elegir el medio local (disco externo o NAS) y el medio remoto (nube cifrada o disco en otra sede).',
      'Programar la copia automática y definir cada cuánto: diaria para contabilidad, semanal para lo demás.',
      'Restaurar algo de prueba cada cierto tiempo y anotar cuánto tardó la recuperación.'
    ],
    cuando: 'Desde el primer día que hay información de la que depende el negocio. Si la respuesta a «¿y si mañana no está?» es incómoda, el respaldo ya toca.',
    error: 'Nunca haber restaurado nada. El respaldo que no se probó es una esperanza, y se descubre justo el día que hace falta.',
    relacionados: [20, 22, 24]
  },

  24: {
    slug: 'onedrive-versionado-de-archivos',
    service: 'seguridad',
    h1: 'OneDrive y su versionado de archivos',
    meta: 'OneDrive guarda versiones de cada archivo y se puede limpiar sin borrar historial. Configurar bien el consumo de espacio y los archivos solo en línea.',
    intro: [
      'El versionado de OneDrive resuelve solo algo que en un disco local exige configuración: cada vez que se guarda un archivo, queda una versión anterior recuperable desde el sitio. Un borrado equivocado se deshace desde la papelera en línea.',
      'La parte que la gente configura mal es el consumo local: sin «Archivos a demanda», la carpeta completa baja al disco y un equipo de 256 GB se llena con los archivos de la empresa que nunca abre.'
    ],
    pasos: [
      'Activar Archivos a demanda para que lo que no se abre quede como puntero, no como bytes en el disco.',
      'Mover Escritorio, Documentos e Imágenes a OneDrive con la opción de copia de seguridad de Windows.',
      'Aprender a abrir el historial de versiones desde el explorador y desde el sitio web.',
      'Revisar qué carpetas se sincronizan: la carpeta de un proyecto pesado conviene dejarla solo en línea.'
    ],
    cuando: 'Personas y oficinas pequeñas que ya pagan Microsoft 365 y no tienen servidor. No reemplaza el respaldo del servidor en una red con dominio, pero cubre los perfiles de usuario.',
    error: 'Sincronizar la carpeta completa de un proyecto de video o de planos pesados. El disco local se llena y la sincronización se vuelve eterna en una conexión doméstica.',
    relacionados: [20, 23, 22]
  },

  25: {
    slug: 'cifrado-de-carpetas-con-efs',
    service: 'seguridad',
    h1: 'EFS: cifrar una carpeta suelta en Windows',
    meta: 'El cifrado de archivos de Windows (EFS) protege una carpeta por usuario cuando BitLocker no está disponible. Para qué sirve y dónde se complica.',
    intro: [
      'En Windows Home no hay BitLocker, pero sí EFS: cifrar una carpeta para que solo la lea la cuenta de Windows que la creó. Es la opción rápida para un directorio de contabilidad o de nómina en un equipo de uso personal.',
      'Está atado al certificado de la cuenta, y ahí viene el detalle: si se restablece la contraseña «a la fuerza», se borra el perfil o se reinstala Windows sin exportar ese certificado, los archivos quedan cifrados para nadie.'
    ],
    pasos: [
      'Exportar el certificado de EFS con su clave antes de cifrar nada, y guardarlo fuera del equipo.',
      'Cifrar solo la carpeta de trabajo, no la unidad completa, para no mezclar rendimiento con seguridad.',
      'Comprobar que el acceso funciona desde la cuenta correcta y que está bloqueado desde otra.',
      'Recordar que EFS no protege un archivo adjunto: al enviarlo por correo viaja descifrado.'
    ],
    cuando: 'Equipos sin BitLocker donde una sola persona usa el computador y hay una carpeta concreta que proteger. Con dominio, la administración de claves se centraliza; sin él, el certificado exportado es la única red.',
    error: 'Cifrar y reinstalar el sistema sin haber exportado el certificado. Es el único caso en el que estos archivos se pierden de verdad.',
    relacionados: [0, 23, 4]
  },

  26: {
    slug: 'compresion-ntfs-archivos-poco-usados',
    service: 'mantenimiento',
    h1: 'Compresión NTFS para lo que casi no se abre',
    meta: 'Comprimir una carpeta de archivos antiguos libera espacio en el disco sin moverlos de lugar. Cuándo ayuda y cuándo castiga el desempeño.',
    intro: [
      'La compresión de NTFS trabaja por archivo y es transparente: se abre igual, solo que ocupa menos. En documentos, planos, bases de datos y respaldos viejos que casi no se leen, la ganancia es fácil de ver en un disco pequeño.',
      'El costo es CPU en cada lectura y escritura, así que se aprovecha en lo frío y molesta en lo que se abre todo el día.'
    ],
    pasos: [
      'Identificar carpetas de archivo histórico que se abren pocas veces al mes.',
      'Comprimir por carpeta con «Propiedades > Avanzadas > Comprimir contenido», no la unidad completa.',
      'Medir el espacio recuperado y el tiempo de apertura de un archivo típico.',
      'Revertir si el equipo es de disco mecánico y la carpeta se abre seguido: ahí el intercambio no vale.'
    ],
    cuando: 'Discos de capacidad ajustada con años de archivo. En unidades ya comprimidas de por sí (video, imágenes, respaldos .zip) no hay nada que ganar.',
    error: 'Comprimir la carpeta de Windows o la del programa contable. El sistema se degrada, las actualizaciones fallan y el espacio recuperado no compensa el problema creado.',
    relacionados: [21, 22, 0]
  },

  /* ---------- Sistemas ---------- */
  27: {
    slug: 'windows-update-for-business',
    service: 'empresariales',
    h1: 'Windows Update for Business: mandar tú las actualizaciones',
    meta: 'Diferir características, forzar parches de seguridad y evitar que diez equipos se actualicen a la vez en plena facturación.',
    intro: [
      'Sin control, Windows decide cuándo actualiza. En una oficina eso significa equipos reiniciándose durante la caja del día o una versión nueva cayendo el mismo día en todos los puestos a la vez.',
      'Windows Update for Business permite separar las dos cosas: los parches de seguridad entran rápido y sin discusión, las actualizaciones de características se retrasan y se prueban primero en un equipo.'
    ],
    pasos: [
      'Definir dos anillos: uno de prueba con dos o tres equipos, y el general con el resto.',
      'Diferir las características un número concreto de días y dejar las actualizaciones de seguridad sin demora.',
      'Programar la hora activa para que los reinicios no coincidan con el horario de atención.',
      'Revisar el informe de cumplimiento semanal para ver qué equipo lleva semanas sin actualizar.'
    ],
    cuando: 'Dominios y equipos con Microsoft 365 Business. En una red sin dominio se puede lograr parte con las opciones de pausa del propio Windows, sin tanta precisión.',
    error: 'Diferir todo por igual, incluidas las actualizaciones de seguridad, para que «no molesten». Es la receta para que un equipo siga expuesto a un parche que ya existe.',
    relacionados: [14, 31, 30]
  },

  28: {
    slug: 'imagen-de-sistema-con-dism',
    service: 'empresariales',
    h1: 'Capturar la imagen de un equipo con DISM',
    meta: 'DISM /Capture-Image deja el sistema de un equipo en un archivo .wim para reinstalarlo entero en minutos cuando el disco muere.',
    intro: [
      'Reinstalar un equipo desde cero toma medio día: sistema, controladores, programas, licencias, cuentas y la configuración que nadie documentó. Restaurar una imagen toma veinte minutos.',
      'DISM captura el volumen en un archivo .wim que se puede aplicar en un disco nuevo. Es una herramienta que ya viene en Windows y que no requiere comprar nada.'
    ],
    pasos: [
      'Preparar el equipo: actualizaciones puestas, programas probados y archivos personales fuera de la imagen.',
      'Arrancar desde un medio de recuperación y capturar el volumen con DISM /Capture-Image.',
      'Guardar la imagen en un disco distinto al que se capturó y anotar qué equipos tienen imagen.',
      'Probar una restauración sobre un disco de prueba al menos una vez, porque una imagen no verificada es un archivo grande.'
    ],
    cuando: 'Antes de un cambio grande, en equipos con software difícil de reinstalar y en oficinas con varios modelos iguales donde la misma imagen sirve para todos.',
    error: 'Incluir la carpeta de trabajo dentro de la imagen y tratarla como respaldo. La imagen es para volver a tener sistema, no para conservar los archivos de hoy.',
    relacionados: [23, 29, 31]
  },

  29: {
    slug: 'sandbox-de-windows-para-probar',
    service: 'mantenimiento',
    h1: 'Sandbox de Windows: probar sin arriesgar el equipo',
    meta: 'Windows Sandbox levanta un Windows limpio y desechable en segundos para abrir un archivo sospechoso o probar un instalador sin tocar nada.',
    intro: [
      'Hay momentos en que hace falta abrir un archivo que llegó por correo o instalar un programa que nadie conoce. Hacerlo en el equipo de trabajo es un riesgo; hacerlo en una máquina virtual armada a mano toma media hora.',
      'Windows Sandbox es la versión rápida: un Windows limpio en una ventana, que se levanta en segundos y se descarta al cerrarla. Lo que pase ahí no toca el equipo real.'
    ],
    pasos: [
      'Activar la funcionalidad en Programas y características y verificar que la virtualización venga de la UEFI.',
      'Guardar un archivo de configuración .wsb con la carpeta compartida y el software que siempre hace falta.',
      'Probar el instalador o abrir el archivo dentro del entorno aislado.',
      'Cerrar sin miedo: al cerrarse se descarta todo, así que nada que se quiera conservar se deja dentro.'
    ],
    cuando: 'Equipos con Windows Pro o Enterprise y suficiente RAM para dos sistemas a la vez. En Windows Home no está disponible y la alternativa es una máquina virtual completa.',
    error: 'Esperar que los archivos creados dentro sobrevivan al cierre. Sandbox es desechable por diseño; lo que se guarda, se guarda afuera.',
    relacionados: [2, 30, 6]
  },

  30: {
    slug: 'sysinternals-suite-diagnostico',
    service: 'mantenimiento',
    h1: 'Sysinternals: Process Explorer, Autoruns y Procmon',
    meta: 'La suite de Sysinternals muestra qué proceso abre un archivo, qué arranca con Windows y qué está tocando un programa. Diagnóstico sin conjeturas.',
    intro: [
      'El Administrador de tareas dice qué se ve. Cuando el problema es un proceso que no aparece, un servicio que se levanta solo o un archivo bloqueado por alguien, hace falta mirar más abajo.',
      'Sysinternals es un conjunto de utilidades gratuitas de Microsoft que responden esas preguntas sin instalar nada: Process Explorer, Autoruns y Procmon cubren la mayoría de los diagnósticos lentos de un equipo.'
    ],
    pasos: [
      'Llevar la suite en una carpeta del pendrive de herramientas, lista para usar sin instalar.',
      'Usar Process Explorer para ver el árbol real de procesos, qué firma tiene cada uno y qué maneja.',
      'Pasar Autoruns para ver qué se levanta con Windows y desactivar con criterio, no a ciegas.',
      'Grabar una sesión de Procmon cuando el problema es intermitente y filtrar por el proceso sospechoso.'
    ],
    cuando: 'Equipos lentos sin causa visible, programas que no cierran, archivos que quedan bloqueados o una sospecha de malware que el antivirus no reporta.',
    error: 'Desactivar en Autoruns entradas que no se entienden. Ahí están los controladores de audio, el panel de la placa y el antivirus, y el equipo queda raro sin que nadie sepa por qué.',
    relacionados: [31, 29, 5]
  },

  31: {
    slug: 'performance-monitor-en-windows',
    service: 'mantenimiento',
    h1: 'Performance Monitor: medir antes de cambiar el disco',
    meta: 'Contadores de disco, memoria y procesador para saber si la lentitud es de hardware o de software, con datos y no con impresiones.',
    intro: [
      '«Ese equipo está lento» puede significar cinco cosas distintas: disco al 100 %, memoria agotada con archivo de paginación de por medio, un proceso comiendo CPU, red saturada o un programa esperando algo que nunca llega.',
      'Performance Monitor deja grabar los contadores durante una jornada y mirar la curva después. Es la diferencia entre cambiar un disco que estaba bien y encontrar que el culpable era un servicio indexando a las tres de la tarde.'
    ],
    pasos: [
      'Armar un conjunto de recolección con disco, memoria, procesador y red, con un intervalo corto.',
      'Dejarlo grabando durante una ventana donde se note el problema, no cinco minutos al azar.',
      'Mirar cola de disco y tiempo de respuesta antes que el porcentaje de uso, que engaña.',
      'Comparar la curva con la experiencia del usuario para saber cuál de los picos es el que molesta.'
    ],
    cuando: 'Lentitud recurrente sin causa clara, equipos que van bien al prender y mal al final del día, y cualquier decisión de compra de hardware que se quiera justificar con datos.',
    error: 'Concluir por una foto del Administrador de tareas tomada en el peor segundo. Una medición de veinte minutos responde lo mismo sin discusión.',
    relacionados: [30, 21, 5]
  }
};


