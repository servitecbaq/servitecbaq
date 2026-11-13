/* Contenido de la pagina /apps/saldo/ — modulo de solo-build.
   Toda afirmación sobre el producto sale del sitio del desarrollador
   (https://alejandrofragozo.github.io/saldo-web/) y de las capturas públicas
   de su ficha en Google Play. Verificado 2026-10-20.
   No agregar características ni precios que no estén publicados ahí. */

module.exports = {
  slug: 'saldo',
  kicker: 'App destacada',
  title: 'App Saldo: controla quién te debe en tu negocio',
  h1: 'Saldo, la aplicación para controlar las ventas a crédito',
  meta: 'App Saldo: qué hace, cuánto cuesta, qué incluye el plan gratuito y cómo la instalamos. Control de ventas a crédito, deudas y abonos desde Android en Barranquilla.',

  intro: [
    'Saldo es una aplicación Android para registrar las ventas a crédito de un negocio: quién te debe, cuánto, qué abonos ha realizado y desde cuándo está pendiente el pago. Sustituye el cuaderno donde se anotaba todo a mano.',
    'La desarrolla Alejandro Fragozo y se descarga de Google Play. Nosotros no vendemos la aplicación ni cobramos la suscripción: prestamos el soporte local en Barranquilla, Soledad y Puerto Colombia para instalarla, cargar tus clientes y garantizar que el registro no se pierda al cambiar de teléfono.'
  ],

  sintomas: [
    { q: 'No sé cuánto le debe cada cliente', a: 'Las cuentas están repartidas entre el cuaderno, la memoria y conversaciones de WhatsApp. Cuando el cliente consulta, nadie tiene el dato a la mano y se pierde una venta por falta de información.' },
    { q: 'El cuaderno se pierde o se vuelve ilegible', a: 'Un cuaderno extraviado o deteriorado elimina de una vez el historial de meses. Sin respaldo, la deuda que no se puede demostrar deja de ser exigible.' },
    { q: 'El cobro se realiza tarde, cuando el cliente ya dispuso del dinero', a: 'Sin recordatorios, el abono se acuerda cuando el cliente regresa, momento en que suele haber agotado el cupo. El cobro oportuno incide más en la utilidad que cualquier ajuste de precios.' }
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
    'Inicio de sesión con correo o cuenta de Google',
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
      cap: 'Seguimiento: la aplicación sugiere cuánto cobrarle a cada cliente' },
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
    { t: 'Revisamos tu registro actual', d: 'En el local o por WhatsApp: cantidad de clientes con saldo pendiente, quién administra el registro y cuántos dispositivos intervienen. De ese diagnóstico depende si el plan gratuito es suficiente.' },
    { t: 'Instalamos y respaldamos primero', d: 'Instalamos la aplicación, configuramos el acceso con correo o cuenta de Google y respaldamos el registro existente, sea cuaderno, Excel o fotografías.' },
    { t: 'Registramos clientes y límites', d: 'Cargamos los clientes con su saldo inicial, definimos el límite de crédito de cada uno y configuramos los recordatorios de cobro.' },
    { t: 'Entregamos en operación', d: 'Una capacitación breve para ti y el personal de atención, más un canal directo por WhatsApp para resolver dudas durante la primera semana.' }
  ],

  cuando: 'En una tienda o un local con pocos clientes con saldo pendiente, el plan gratuito es suficiente: se registra, se consulta y la operación queda al día. La situación cambia cuando dos o tres personas atienden desde dispositivos distintos, ya que la sincronización automática evita registros duplicados y diferencias de saldo.',

  error: 'El error más frecuente consiste en instalar la aplicación sin configurar el respaldo. En el plan gratuito el respaldo es manual: si el teléfono se avería sin haber exportado el registro, la información se pierde igual que en el cuaderno de papel. Antes de continuar, configura el correo de recuperación y verifica que la copia existe realmente.',

  faq: [
    { q: '¿Saldo sirve para iPhone?', a: 'La aplicación se publica para Android en Google Play, que es donde se descarga. El sitio del desarrollador no anuncia versión para iPhone.' },
    { q: '¿Cuánto cuesta Saldo?', a: 'Existe un plan gratuito con respaldo manual y dos de pago publicados por el desarrollador: $11.500 al mes u $89.000 al año, en pesos colombianos con IVA incluido. El valor final lo muestra Google Play según tu país.' },
    { q: '¿Puedo trasladar la información de mi cuaderno o de un Excel?', a: 'Sí, y es la parte que asumimos nosotros: registramos los clientes con el saldo vigente para que no empieces desde cero ni pierdas el historial.' },
    { q: '¿Qué ocurre si el teléfono se avería?', a: 'Con plan de pago la información se sincroniza en la nube: se instala en otro equipo y se recupera. Con el plan gratuito el respaldo es manual; si no se realizó, el registro se pierde con el dispositivo.' },
    { q: '¿Ustedes son los propietarios de la aplicación?', a: 'No. Saldo la desarrolla Alejandro Fragozo y la comercializa él a través de Google Play. Servitecbaq cobra únicamente la instalación, la carga de datos y el soporte presencial.' }
  ],

  avisoCapturas: 'Las cuatro capturas provienen de la ficha pública de Saldo en Google Play; el icono, las pantallas y el nombre de la aplicación pertenecen a su desarrollador.',

  related: ['instalacion', 'desarrollo', 'empresariales'],

  playUrl: 'https://play.google.com/store/apps/details?id=com.fragozo.saldo&hl=es_CO',
  devUrl: 'https://alejandrofragozo.github.io/saldo-web/',
  desarrollador: 'Alejandro Fragozo',
  paquete: 'com.fragozo.saldo',
  avisoMarca: 'Saldo es un producto de su desarrollador, Alejandro Fragozo. Esta página es de Servitecbaq y describe la aplicación desde el soporte local; nombres y precios citados pertenecen a él.',

  ctaTitle: '¿Instalamos Saldo en tu negocio?',
  ctaText: 'Indícanos cuántos clientes tienes registrados en el cuaderno y agendamos la instalación en el local. La aplicación se descarga del desarrollador; nosotros nos encargamos de dejarla en operación.'
};
