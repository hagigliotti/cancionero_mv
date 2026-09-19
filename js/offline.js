// ===================== AVISO "SIN CONEXIÓN" =====================
// Cuando no hay internet aparece arriba a la derecha una etiqueta 📴 "Sin conexión".
// La app sigue funcionando igual con lo que ya tiene guardado (ver sw.js: el service
// worker guarda la interfaz y todas las letras la primera vez y, con internet, solo
// revisa si hay una versión nueva). Al volver la conexión, la etiqueta desaparece y se
// vuelve a buscar una actualización.
//
// navigator.onLine solo dice si hay red (wifi/datos), no si hay internet de verdad (un wifi
// sin salida figura como "online"), así que además se hace un pedido HEAD chico a
// version.json — el service worker no toca los HEAD, van directo a la red.
(function () {
  const badge = document.getElementById("offlineBadge");
  if (!badge) return;

  const CADA_MS = 60000;
  let sinConexion = false;
  let probando = false;

  function pintar(valor) {
    sinConexion = valor;
    badge.hidden = !valor;
    document.body.classList.toggle("sin-conexion", valor);
  }

  async function probar() {
    if (probando) return;

    if (!navigator.onLine) {
      pintar(true);
      return;
    }

    probando = true;
    const ctrl = typeof AbortController === "function" ? new AbortController() : null;
    const corte = setTimeout(() => ctrl && ctrl.abort(), 6000);

    try {
      // cualquier respuesta (aunque sea un 404) significa que hay internet
      await fetch("version.json", { method: "HEAD", cache: "no-store", signal: ctrl ? ctrl.signal : undefined });
      if (sinConexion) buscarActualizacion();
      pintar(false);
    } catch (e) {
      pintar(true);
    } finally {
      clearTimeout(corte);
      probando = false;
    }
  }

  // recién con internet de vuelta se revisa si hay una versión nueva de la app
  function buscarActualizacion() {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.getRegistration().then(reg => reg && reg.update()).catch(() => {});
  }

  window.actualizarOfflineBadge = function () {
    const txt = document.getElementById("offlineBadgeTxt");
    if (txt) txt.textContent = t("sin_conexion");
    badge.title = t("sin_conexion_tip");
    badge.setAttribute("aria-label", t("sin_conexion") + ". " + t("sin_conexion_tip"));
  };

  badge.addEventListener("click", () => showToast(t("sin_conexion_tip")));

  window.addEventListener("offline", () => pintar(true));
  window.addEventListener("online", probar);
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") probar(); });
  setInterval(() => { if (document.visibilityState === "visible") probar(); }, CADA_MS);

  actualizarOfflineBadge();
  probar();
})();
