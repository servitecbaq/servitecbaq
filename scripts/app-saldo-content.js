/* Contenido de la pagina /apps/saldo/ — modulo de solo-build.
   Toda afirmación sobre el producto sale del sitio del desarrollador
   (https://alejandrofragozo.github.io/saldo-web/) y de las capturas públicas
   de su ficha en Google Play. Verificado 2026-10-20.
   No agregar características ni precios que no estén publicados ahí. */

module.exports = {
  slug: 'saldo',
  kicker: 'App destacada',
  title: 'App Saldo: controla quién te debe en tu negocio',
  h1: 'Saldo, la app para llevar el fiado sin cuaderno',
  meta: 'Qué hace la app Saldo, cuánto cuesta, qué trae el plan gratuito y cómo te la montamos: control del fiado, deudas y abonos desde un Android en Barranquilla.',

  intro: [
    'Saldo es una aplicación Android para registrar las ventas a crédito —el fiado— de un negocio: quién te debe, cuánto te debe, qué abono hizo y desde cuándo no paga. Sustituye el cuaderno donde se anotaba todo a mano.',
    'La desarrolla Alejandro Fragozo y se descarga de Google Play. Nosotros no vendemos la app ni cobramos la suscripción: damos el soporte local en Barranquilla, Soledad y Puerto Colombia para montarla, cargar tus clientes y que el registro no se pierda cuando cambia el teléfono.'
  ],

  sintomas: [
    { q: 'No sé cuánto le debe cada cliente', a: 'Las cuentas están repartidas entre el cuaderno, la cabeza y dos chats de WhatsApp. Cuando el cliente pregunta, nadie tiene el número a mano y se pierde venta por duda.' },
    { q: 'El cuaderno se pierde o se vuelve ilegible', a: 'Un cuaderno mojado, quemado o extraviado borra de golpe el histórico de meses. Sin copia, la deuda que no puedes probar simplemente deja de existir.' },
    { q: 'Cobro tarde y ya gastó', a: 'Sin recordatorio, el abono se acuerda cuando el cliente vuelve, que suele ser cuando ya agotó su cupo. El cobro oportuno vale más que cualquier lista de precios.' }
  ],

  funciones: [
    'Clientes con dato de contacto y límite de crédito propio',
    'Ventas a crédito y abonos con historial de cada movimiento',
    'Resumen con deuda total, saldo a favor y clientes al día',
    'Pantalla de seguimiento que sugiere cuánto cobrarle a cada cliente',
    'Comprobante de cada operación, listo para enviar por WhatsApp',
    'Recordatorios por notificación para no dejar pasar un cobro',
    'Funciona sin internet y sincroniza con la nube al reconectar',
    'Respaldo en infraestructura de Firebase y acceso desde varios dispositivos',
    'Entrada con correo o cuenta de Google',
    'Disponible en español, inglés y portugués'
  ],

  // Capturas tomadas de la ficha pública de la app en Google Play (2026-10-20).
  icono: { src: '/img/apps/saldo-icon.webp', w: 160, h: 160,
    alt: 'Icono de la app Saldo' },
  capturas: [
    { src: '/img/apps/saldo-01.webp', w: 320, h: 641,
      alt: 'Pantalla de Saldo con la deuda total, el saldo a favor y el número de clientes',
      cap: 'Deuda total, saldo a favor y cuántos clientes están al día' },
    { src: '/img/apps/saldo-02.webp', w: 320, h: 641,
      alt: 'Pantalla Seguimiento de Saldo con el cobro sugerido para cada cliente',
      cap: 'Seguimiento: la app sugiere cuánto cobrarle a cada cliente' },
    { src: '/img/apps/saldo-03.webp', w: 320, h: 641,
      alt: 'Ficha de un cliente en Saldo con sus deudas, pagos y botón para compartir el detalle',
      cap: 'Ficha por cliente con deudas, pagos y opción de compartir' },
    { src: '/img/apps/saldo-04.webp', w: 320, h: 641,
      alt: 'Comprobante de una venta a crédito generado por la app Saldo',
      cap: 'Comprobante de la venta a crédito, listo para enviar' }
  ],

  planes: [
    { name: 'Plan gratuito', price: '$0', amount: '0', note: 'Para empezar a registrar', items: ['Clientes, deudas y abonos', 'Respaldo manual', 'Funciona sin internet'] },
    { name: 'Plan mensual', price: '$11.500 / mes', amount: '11500', note: 'COP con IVA incluido', items: ['Clientes ilimitados', 'Sincronización automática', 'Sin anuncios', 'Periodo de gracia'] },
    { name: 'Plan anual', price: '$89.000 / año', amount: '89000', note: 'COP con IVA incluido', items: ['Todo lo del plan mensual', 'Sincronización en tiempo real', 'Periodo de gracia de 14 días'] }
  ],

  avisoPrecios: 'Precios publicados por el desarrollador en su sitio. Google Play puede mostrar otro valor según el país y la tasa del momento: confírmalo en la tienda antes de suscribirte.',

  pasos: [
    { t: 'Miramos cómo anotas hoy', d: 'En el local o por WhatsApp: cuántos clientes deben, quién atiende, si hay un teléfono o varios. De eso sale si te alcanza el plan gratuito o no.' },
    { t: 'Instalamos y respaldamos antes', d: 'Montamos la app, dejamos creado el acceso con correo o Google y le sacamos copia al registro que ya tengas, sea cuaderno, Excel o fotos.' },
    { t: 'Cargamos clientes y límites', d: 'Digitamos los clientes con su saldo inicial, ajustamos el límite de crédito de cada uno y configuramos los recordatorios de cobro.' },
    { t: 'Te dejamos operando', d: 'Diez minutos de entrenamiento para ti y quien atiende, más un canal directo por WhatsApp para las dudas de la primera semana.' }
  ],

  cuando: 'Si es una tienda o un puesto con pocos clientes que deben, el plan gratuito alcanza: registras, consultas y listo. La cosa cambia cuando atienden dos o tres personas desde distintos teléfonos, porque ahí la sincronización automática es lo que evita el doble apunte y el saldo que no cuadra.',

  error: 'El error que más vemos: instalar la app y no respaldar. En el plan gratuito el respaldo es manual, así que si se daña el teléfono sin haber exportado, el cuaderno digital se pierde igual que el de papel. Antes de seguir, configura el correo de recuperación y comprueba que la copia existe de verdad.',

  faq: [
    { q: '¿Saldo sirve para iPhone?', a: 'La app se publica para Android en Google Play, que es donde se descarga. El sitio del desarrollador no anuncia versión para iPhone.' },
    { q: '¿Cuánto cuesta Saldo?', a: 'Hay un plan gratuito con respaldo manual y dos de pago publicados por el desarrollador: $11.500 al mes u $89.000 al año, en pesos colombianos con IVA incluido. El valor final lo muestra Google Play según tu país.' },
    { q: '¿Puedo pasar la información de mi cuaderno o de un Excel?', a: 'Sí, y es justamente la parte que hacemos nosotros: cargamos los clientes con el saldo que ya tienen registrado para que no empieces desde cero ni pierdas antigüedad.' },
    { q: '¿Qué pasa si se daña el teléfono?', a: 'Con plan de pago la información se sincroniza en la nube, así que instalas en otro equipo y recuperas. Con plan gratuito el respaldo es manual: si no lo hiciste, el registro se va con el aparato.' },
    { q: '¿Ustedes son los dueños de la aplicación?', a: 'No. Saldo la desarrolla Alejandro Fragozo y la venta la maneja él por Google Play. Servitecbaq cobra únicamente el montaje, la carga de datos y el soporte presencial.' }
  ],

  avisoCapturas: 'Las cuatro capturas salen de la ficha pública de Saldo en Google Play; el icono, las pantallas y el nombre de la app pertenecen a su desarrollador.',

  related: ['instalacion', 'desarrollo', 'empresariales'],

  playUrl: 'https://play.google.com/store/apps/details?id=com.fragozo.saldo&hl=es_CO',
  devUrl: 'https://alejandrofragozo.github.io/saldo-web/',
  desarrollador: 'Alejandro Fragozo',
  paquete: 'com.fragozo.saldo',
  avisoMarca: 'Saldo es un producto de su desarrollador, Alejandro Fragozo. Esta página es de Servitecbaq y describe la app desde el lado del soporte local; nombres y precios citados pertenecen a él.',

  ctaTitle: '¿Te lo montamos hoy?',
  ctaText: 'Dime cuántos clientes tienes anotados en el cuaderno y agendamos el montaje en el local. La app la descargas del desarrollador; nosotros nos encargamos de que termine usándose.'
};
