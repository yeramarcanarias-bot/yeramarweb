// ============================================
// YERAMAR - INTRO DEL LOGO
// Vídeo con sonido al cargar la página -> al terminar, "aterriza" en el
// logo del header -> se sustituye por el GIF animado en bucle.
//
// Misma estructura que el protocolo de arranque de El Trenzado (probado
// y funcionando ahí): SIN contenedor envolvente — el propio <video> es
// el que se transforma directamente. Adaptado a lo que un navegador
// permite (aquí no hay control sobre el proceso de la ventana, así que
// las protecciones de sesión/autoplay/reduced-motion son propias de web).
// ============================================

(function () {
  'use strict';

  var CLAVE_SESION = 'yeramarIntroVista';

  document.addEventListener('DOMContentLoaded', function () {
    var backdrop = document.getElementById('introBackdrop');
    var video = document.getElementById('introVideo');
    var headerLogo = document.getElementById('headerLogo');
    var gate = document.getElementById('introStartGate');

    if (!backdrop || !video || !headerLogo) return;

    function irDirectoAlEstadoFinal() {
      backdrop.remove();
      video.remove();
      if (gate) gate.remove();
      headerLogo.src = 'logo-animado.gif';
    }

    // Ya se vio la intro en esta pestaña (sessionStorage: se repite si el
    // visitante abre una pestaña nueva, pero no en cada recarga/ancla de
    // la misma sesión). Si sessionStorage no está disponible (modo privado
    // extremo, etc.) simplemente se reproduce la intro cada vez: no falla.
    var yaVista = false;
    try { yaVista = sessionStorage.getItem(CLAVE_SESION) === '1'; } catch (e) {}

    // Accesibilidad: quien tiene activado "reducir movimiento" en su
    // sistema se salta la animación por completo, no solo la acorta.
    var prefiereMenosMovimiento = false;
    try {
      prefiereMenosMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch (e) {}

    if (yaVista || prefiereMenosMovimiento) {
      irDirectoAlEstadoFinal();
      return;
    }

    // El logo real se deja invisible (no oculto: sigue ocupando su sitio
    // en el layout) para poder medir su posición exacta al final.
    headerLogo.classList.add('intro-pending');

    var terminado = false;
    function finalizar() {
      if (terminado) return;
      terminado = true;
      try { sessionStorage.setItem(CLAVE_SESION, '1'); } catch (e) {}
      backdrop.remove();
      video.remove();
      if (gate) gate.remove();
      headerLogo.src = 'logo-animado.gif';
      headerLogo.classList.remove('intro-pending');
      headerLogo.classList.add('intro-revealing');
    }

    video.addEventListener('error', finalizar, { once: true });

    function posicionarModal() {
      // Un poco más grande que antes (0.74/560 -> 0.8/640).
      var w = Math.min(window.innerWidth * 0.8, 640);
      var h = w * 9 / 16;
      Object.assign(video.style, {
        width: w + 'px',
        height: h + 'px',
        left: ((window.innerWidth - w) / 2) + 'px',
        top: ((window.innerHeight - h) / 2) + 'px'
      });
    }

    posicionarModal();

    // Reproducir CON sonido. Un navegador web bloquea el autoplay con
    // sonido si el visitante no ha interactuado antes con el sitio -- es
    // una política del propio navegador, no algo saltable desde el
    // código (a diferencia de la app de escritorio, donde
    // "autoplayPolicy: no-user-gesture-required" sí lo fuerza). Por eso
    // aquí NO se intenta reproducir solo: se espera al toque en la
    // puerta de entrada (#introStartGate) para arrancar exactamente en
    // ese gesto, que es lo único que garantiza que el sonido no se
    // silencie. Si por lo que sea la puerta no existiera en el HTML, se
    // cae al intento directo de siempre (mudo si el navegador lo bloquea).
    function arrancarVideo() {
      // Red de seguridad: si el vídeo no carga, se cuelga, o cualquier
      // cosa rara pasa, la web nunca debe quedarse tapada por la intro.
      // Vídeo (8s) + vuelo hasta el logo (1.5s) + margen -> nunca debe
      // disparar antes de que la secuencia normal haya podido terminar.
      // Cuenta desde AQUÍ (cuando el vídeo arranca de verdad) y no desde
      // que carga la página, porque con la puerta de entrada el usuario
      // puede tardar lo que quiera en tocar.
      setTimeout(finalizar, 12000);

      video.muted = false;
      var intento = video.play();
      if (intento && typeof intento.catch === 'function') {
        intento.catch(function () {
          video.muted = true;
          video.play().catch(function () { finalizar(); });
        });
      }
    }

    if (gate) {
      // <button> real: Enter/Espacio ya disparan 'click' de forma nativa,
      // no hace falta un manejador de teclado aparte.
      var entrar = function (ev) {
        if (ev) ev.preventDefault();
        gate.classList.add('is-hidden');
        gate.removeEventListener('click', entrar);
        setTimeout(function () { if (gate) gate.remove(); }, 400);
        arrancarVideo();
      };
      gate.addEventListener('click', entrar);
      gate.focus();
    } else {
      arrancarVideo();
    }

    video.addEventListener('ended', function () {
      var startRect = video.getBoundingClientRect();
      var targetRect = headerLogo.getBoundingClientRect();

      // Si por lo que sea el logo destino no tiene tamaño (layout raro,
      // fuente no cargada aún, etc.), no hay a dónde volar: se remata sin más.
      if (!targetRect.width || !targetRect.height) { finalizar(); return; }

      // El fondo oscuro se desvanece a la vez que el vídeo vuela a su sitio.
      backdrop.style.opacity = '0';

      var scaleX = targetRect.width / startRect.width;
      var scaleY = targetRect.height / startRect.height;
      var translateX = (targetRect.left + targetRect.width / 2) - (startRect.left + startRect.width / 2);
      var translateY = (targetRect.top + targetRect.height / 2) - (startRect.top + startRect.height / 2);

      video.classList.add('is-flying');
      video.style.transformOrigin = 'center center';
      video.style.borderRadius = '14px';
      video.style.boxShadow = 'none';
      video.style.transform = 'translate(' + translateX + 'px, ' + translateY + 'px) scale(' + scaleX + ', ' + scaleY + ')';

      video.addEventListener('transitionend', finalizar, { once: true });
    }, { once: true });

    // Si cambia el tamaño de ventana MIENTRAS el vídeo aún está en el
    // modal centrado (no durante el vuelo), se recoloca para seguir centrado.
    window.addEventListener('resize', function () {
      if (terminado || video.classList.contains('is-flying')) return;
      posicionarModal();
    });
  });
})();
