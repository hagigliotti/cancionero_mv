// ===================== MODO TV (Android TV / Google TV / Smart TV) =====================
// Pensado para usar la app con el CONTROL REMOTO: sin dedo ni mouse no hay forma
// de arrastrar el scroll, y los botones que no son <button>/<a> (filas de listas,
// items del menú) ni siquiera reciben el foco. En modo TV (body.tv):
//   - las flechas del control (↑ ↓ ← →) mueven el foco entre los elementos de la
//     pantalla, cada uno con un contorno bien visible (navegación espacial propia,
//     para no depender de lo que traiga cada navegador de TV);
//   - las filas/ítems con data-action se vuelven enfocables y OK / Enter los "toca";
//   - si no hay nada más para enfocar en esa dirección, la flecha SCROLLEA la
//     pantalla, el menú o el modal abierto;
//   - "Atrás" (Escape / GoBack) cierra el modal, menú o popover que esté arriba;
//   - botones flotantes ▲ ▼ para scrollear (útil si la TV tiene cursor tipo mouse);
//   - las flechitas ◀ ▶ de la barra de letras/números se ven siempre (ver style.css).
// Se activa solo si detecta una TV (user agent) o a mano: Menú → Modo iglesia →
// Modo TV, o abriendo la app con ?tv=1 (?tv=0 lo apaga). Aislado a propósito: fuera
// del modo TV no cambia nada en la app.
(function () {
  const UA_TV = /Android ?TV|GoogleTV|Google TV|SMART-?TV|SmartTV|BRAVIA|\bAFT[A-Z]|Tizen|Web0S|WebOS|CrKey|HbbTV|NetCast|VIDAA|Fire ?TV|\bTV\b/i;

  // ---- detección / preferencia ----
  function leerPref() {
    try { return localStorage.getItem("tvMode"); } catch (e) { return null; }
  }

  function guardarPref(v) {
    try { localStorage.setItem("tvMode", v); } catch (e) { /* sin storage: solo dura la sesión */ }
  }

  // celulares y tablets táctiles: el modo TV no existe ahí (ni el interruptor del menú)
  function esDispositivoTactil(ua) {
    return /Mobi|iPhone|iPod|iPad|Tablet/i.test(ua) ||
           (/Android/i.test(ua) && navigator.maxTouchPoints > 0) ||
           (/Macintosh/i.test(ua) && navigator.maxTouchPoints > 1);     // iPad que se identifica como Mac
  }

  // solo TV y PC. ?tv=1 en la URL lo fuerza (por si una TV se identifica raro) y queda guardado
  function permitido() {
    const ua = navigator.userAgent || "";
    try {
      const q = new URLSearchParams(location.search).get("tv");
      if (q === "1" || q === "on") { guardarPref("on"); localStorage.setItem("tvForzado", "1"); }
      else if (q === "0" || q === "off") guardarPref("off");
    } catch (e) { /* URL rara: se ignora */ }

    let forzado = false;
    try { forzado = localStorage.getItem("tvForzado") === "1"; } catch (e) { /* sin storage */ }

    return UA_TV.test(ua) || forzado || !esDispositivoTactil(ua);
  }

  function detectarTV() {
    const pref = leerPref();
    if (pref === "on") return true;
    if (pref === "off") return false;

    const ua = navigator.userAgent || "";
    // Android sin pantalla táctil = casi seguro una TV / caja (los celulares y tablets tienen touch)
    return UA_TV.test(ua) || (/Android/i.test(ua) && !navigator.maxTouchPoints);
  }

  let activo = false;
  let observer = null;
  let timer = null;
  let scrollBtns = null;
  let ultimoAlcance = null;
  let focoGuardado = null;

  // ---- helpers de DOM ----
  const SEL_FOCO = 'a[href], button, input:not([type="hidden"]), select, textarea, summary, [tabindex]:not([tabindex="-1"]), [data-action]';

  function esVisible(el) {
    if (el.disabled) return false;
    if (el.closest(".dropdown-menu:not(.active)")) return false;   // el menú cerrado está fuera de pantalla (transform)

    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) return false;

    const cs = getComputedStyle(el);
    // pointer-events:none = capa decorativa o cerrada (ej. el fondo del menú), no se puede "tocar"
    return cs.visibility !== "hidden" && cs.display !== "none" && cs.pointerEvents !== "none";
  }

  function hayScrollY(el) {
    if (el.scrollHeight <= el.clientHeight + 4) return false;   // barato: descarta casi todo sin pedir estilos
    const cs = getComputedStyle(el);
    return cs.overflowY === "auto" || cs.overflowY === "scroll";
  }

  // solo los ancestros de el (hasta raiz) — barato, se usa para cada candidato
  function scrolleableAncestro(el, raiz) {
    for (let n = el; n && n !== document.body && n !== document.documentElement; n = n.parentElement) {
      if (hayScrollY(n)) return n;
      if (n === raiz) break;
    }
    return null;
  }

  function scrolleableDe(el, raiz) {
    const anc = scrolleableAncestro(el, raiz);
    if (anc) return anc;

    if (raiz && raiz !== document.body) {
      const dentro = [raiz, ...raiz.querySelectorAll("*")].find(hayScrollY);
      if (dentro) return dentro;
    }
    return raiz === document.body || !raiz ? document.scrollingElement : null;
  }

  function popoverAbierto() {
    return document.querySelector(".chord-popover-backdrop:not(.hidden)");
  }

  function modalAbierto() {
    const abiertos = Array.from(document.querySelectorAll(".modal, .np-modal"))
      .filter(m => getComputedStyle(m).display !== "none");
    return abiertos[abiertos.length - 1] || null;
  }

  // el "alcance" es la capa que está arriba de todo: la navegación con las flechas
  // no sale de ella (ej. con un modal abierto no se puede enfocar lo de atrás)
  function alcance() {
    return popoverAbierto() || modalAbierto() || document.querySelector(".dropdown-menu.active") || document.body;
  }

  function enfocables(raiz) {
    // los botones flotantes ▲ ▼ quedan afuera: son para quien usa un cursor, con el control
    // remoto ya se scrollea con las flechas
    // los acordes de la letra no son paradas del foco (con ↓ se iría de acorde en acorde)
    return Array.from(raiz.querySelectorAll(SEL_FOCO)).filter(el => !el.matches(".chord, .libro-marca") && esVisible(el));
  }

  // los <li>, <div>, <span> con data-action no reciben el foco solos: se les da tabindex
  function volverEnfocables(raiz) {
    raiz.querySelectorAll("[data-action]:not(button):not(a):not(input):not(select):not(textarea):not([tabindex]):not(.chord):not(.libro-marca)").forEach(el => {
      el.tabIndex = 0;
      if (!el.getAttribute("role")) el.setAttribute("role", "button");
    });
  }

  // en la pantalla principal quedan barras fijas arriba (buscador, letras, título de la canción):
  // lo que pasa por debajo de ellas no se ve. Devuelve hasta dónde llegan (0 si no hay ninguna)
  const CABECERA = ".top-bar, .alfabeto-nav, .song-title-row";

  function bordeSuperior(raiz) {
    if (raiz !== document.body) return 0;

    let borde = 0;
    document.querySelectorAll(CABECERA).forEach(el => {
      const pos = getComputedStyle(el).position;
      if (pos !== "sticky" && pos !== "fixed") return;

      const r = el.getBoundingClientRect();
      if (r.height > 0 && r.top <= 8) borde = Math.max(borde, r.bottom);
    });
    return borde;
  }

  // ¿el elemento está dentro de lo que se ve ahora en pantalla (y de su scroll)?
  function enVista(el, raiz, borde) {
    const r = el.getBoundingClientRect();
    const cy = r.top + r.height / 2;
    const cx = r.left + r.width / 2;
    if (cy < 0 || cy > innerHeight || cx < 0 || cx > innerWidth) return false;
    if (borde && cy < borde + 2 && !el.closest(CABECERA)) return false;

    const sc = scrolleableAncestro(el, raiz);
    if (sc) {
      const s = sc.getBoundingClientRect();
      if (cy < s.top || cy > s.bottom) return false;
    }
    return true;
  }

  // ---- navegación espacial ----
  function puntaje(cr, r, dir) {
    const cx = cr.left + cr.width / 2;
    const cy = cr.top + cr.height / 2;
    let prim, orth, dOrth;

    if (dir === "down") {
      if (!(r.top > cy)) return null;
      prim = Math.max(0, r.top - cr.bottom);
      orth = Math.max(0, Math.max(r.left - cr.right, cr.left - r.right));
      dOrth = Math.abs((r.left + r.width / 2) - cx);
    } else if (dir === "up") {
      if (!(r.bottom < cy)) return null;
      prim = Math.max(0, cr.top - r.bottom);
      orth = Math.max(0, Math.max(r.left - cr.right, cr.left - r.right));
      dOrth = Math.abs((r.left + r.width / 2) - cx);
    } else if (dir === "right") {
      if (!(r.left > cx)) return null;
      prim = Math.max(0, r.left - cr.right);
      orth = Math.max(0, Math.max(r.top - cr.bottom, cr.top - r.bottom));
      dOrth = Math.abs((r.top + r.height / 2) - cy);
    } else {
      if (!(r.right < cx)) return null;
      prim = Math.max(0, cr.left - r.right);
      orth = Math.max(0, Math.max(r.top - cr.bottom, cr.top - r.bottom));
      dOrth = Math.abs((r.top + r.height / 2) - cy);
    }
    return prim + orth * 3 + dOrth * 0.5;
  }

  function enfocar(el) {
    const borde = bordeSuperior(alcance());
    const enCabecera = borde && el.closest(CABECERA);

    try { el.focus({ preventScroll: !!enCabecera }); } catch (e) { return; }
    // por si el navegador no llevó el elemento a la vista (o quedó tapado por la barra fija);
    // lo que está en las barras fijas de arriba ya se ve siempre: no hay que scrollear por eso
    if (!enCabecera) el.scrollIntoView({ block: "nearest", inline: "nearest" });

    if (borde && !enCabecera) {
      const top = el.getBoundingClientRect().top;
      if (top < borde + 8) window.scrollBy(0, top - borde - 12);
    }
  }

  function scrollearHorizontal(el, dir) {
    for (let n = el; n && n !== document.body; n = n.parentElement) {
      const cs = getComputedStyle(n);
      if ((cs.overflowX === "auto" || cs.overflowX === "scroll") && n.scrollWidth > n.clientWidth + 4) {
        n.scrollBy({ left: (dir === "right" ? 1 : -1) * Math.max(160, n.clientWidth * 0.6), behavior: "auto" });
        return true;
      }
    }
    return false;
  }

  function puedeScrollear(sc, dir) {
    if (!sc) return false;
    return dir === "down"
      ? sc.scrollTop + sc.clientHeight < sc.scrollHeight - 2
      : sc.scrollTop > 2;
  }

  // fraccion: cuánto de la pantalla se salta. Con las flechas el salto es CHICO (~30%, entre 80 y 140 px)
  // para que el contenido no quede cortado ni desfasado; PageUp/PageDown y los botones ▲ ▼ saltan más
  function scrollearVertical(sc, dir, fraccion) {
    if (!sc) return;
    const alto = sc === document.scrollingElement ? innerHeight : sc.clientHeight;
    const paso = fraccion ? alto * fraccion : Math.max(80, Math.min(alto * 0.3, 140));
    // instantáneo (no "smooth"): una animación en curso se cancelaba con cada scrollIntoView de la app
    sc.scrollBy({ top: (dir === "down" ? 1 : -1) * paso, behavior: "auto" });
  }

  function navegar(dir) {
    const raiz = alcance();
    const lista = enfocables(raiz);
    const borde = bordeSuperior(raiz);
    let actual = document.activeElement;

    const valido = actual && actual !== document.body && actual !== document.documentElement &&
      raiz.contains(actual) && esVisible(actual);

    if (!valido) {
      // primer elemento a la vista (en un modal/menú, salteando el botón ✕ si hay algo más)
      const enPantalla = lista.filter(el => enVista(el, raiz, borde));
      const sinCerrar = enPantalla.filter(el => !el.matches(".about-close, .np-close, .chord-popover-close"));
      const primero = (sinCerrar.length ? sinCerrar : enPantalla)
        .sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top || a.getBoundingClientRect().left - b.getBoundingClientRect().left)[0];

      if (primero) enfocar(primero);
      else if (dir === "up" || dir === "down") scrollearVertical(scrolleableDe(document.body, raiz), dir);
      return;
    }

    // el foco quedó fuera de pantalla (se estuvo scrolleando, ej. leyendo una letra larga): la flecha
    // sigue scrolleando en vez de saltar a las barras fijas de arriba; recién al llegar al borde se mueve el foco
    if ((dir === "up" || dir === "down") && !enVista(actual, raiz, borde)) {
      const sc0 = scrolleableDe(actual, raiz);
      if (puedeScrollear(sc0, dir)) { scrollearVertical(sc0, dir); return; }
    }

    const cr = actual.getBoundingClientRect();
    const cands = lista
      .filter(el => el !== actual && !actual.contains(el) && !el.contains(actual))
      .map(el => ({ el, s: puntaje(cr, el.getBoundingClientRect(), dir) }))
      .filter(x => x.s !== null)
      .sort((a, b) => a.s - b.s);

    if (dir === "left" || dir === "right") {
      const cerca = cands[0];
      if (cerca) enfocar(cerca.el);
      else scrollearHorizontal(actual, dir);
      return;
    }

    // arriba / abajo: si el más cercano ya está a la vista se va a él; si queda fuera de
    // pantalla se scrollea para descubrirlo (así los elementos fijos, como un aviso abajo de
    // todo, no le "roban" el foco a la fila que sigue); recién al llegar al borde se salta
    const mejor = cands[0];
    if (mejor && enVista(mejor.el, raiz, borde)) { enfocar(mejor.el); return; }

    const sc = scrolleableDe(actual, raiz);
    if (puedeScrollear(sc, dir)) { scrollearVertical(sc, dir); return; }

    // ya no se puede scrollear más: si el foco había quedado fuera de pantalla, se pasa al elemento
    // más cercano que SÍ se ve (ej. los botones del final) y no a uno lejano que haría saltar la pantalla
    const cercanoVisible = enVista(actual, raiz, borde) ? null : cands.find(x => enVista(x.el, raiz, borde) && !(borde && x.el.closest(CABECERA)));
    if (cercanoVisible) { enfocar(cercanoVisible.el); return; }

    if (mejor) enfocar(mejor.el);
  }

  // ---- "Atrás": cierra lo que esté arriba de todo ----
  function cerrarSuperior() {
    const pop = popoverAbierto();
    if (pop) {
      const b = pop.querySelector(".chord-popover-close");
      if (b) { b.click(); return true; }
    }

    const m = modalAbierto();
    if (m) {
      const b = m.querySelector('.about-close, .np-close, [data-action^="cerrar"]');
      if (b) { b.click(); return true; }
    }

    const menu = document.querySelector(".dropdown-menu.active");
    if (menu) {
      const b = menu.querySelector('[data-action="closeMenu"]');
      if (b) { b.click(); return true; }
    }
    return false;
  }

  function direccionDe(e) {
    switch (e.key) {
      case "ArrowUp": case "Up": return "up";
      case "ArrowDown": case "Down": return "down";
      case "ArrowLeft": case "Left": return "left";
      case "ArrowRight": case "Right": return "right";
    }
    // algunos navegadores de TV mandan "Unidentified" y solo el keyCode
    switch (e.keyCode) {
      case 38: case 19: return "up";
      case 40: case 20: return "down";
      case 37: case 21: return "left";
      case 39: case 22: return "right";
    }
    return null;
  }

  function esAtras(e) {
    return e.key === "Escape" || e.key === "GoBack" || e.key === "BrowserBack" ||
           e.keyCode === 27 || e.keyCode === 4 || e.keyCode === 166;
  }

  function onKeyDown(e) {
    if (!activo || e.altKey || e.ctrlKey || e.metaKey) return;

    if (esAtras(e)) {
      if (cerrarSuperior()) e.preventDefault();
      return;
    }

    const el = document.activeElement;
    const tag = el?.tagName;

    // OK / Enter sobre un elemento con data-action que no es botón nativo: lo "toca"
    if ((e.key === "Enter" || e.key === " " || e.key === "Spacebar" || e.keyCode === 13 || e.keyCode === 23) &&
        el && el.matches?.("[data-action]") && !/^(BUTTON|A|INPUT|SELECT|TEXTAREA)$/.test(tag)) {
      e.preventDefault();
      el.click();
      return;
    }

    // PageUp / PageDown (o canal +/- del control): scrollea una pantalla entera de una vez —
    // cómodo para leer una letra larga sin ir foco por foco
    const pagina = e.key === "PageUp" || e.key === "PageDown" || e.key === "ChannelUp" || e.key === "ChannelDown" ||
                   e.keyCode === 33 || e.keyCode === 34 || e.keyCode === 427 || e.keyCode === 428;
    if (pagina) {
      const sube = e.key === "PageUp" || e.key === "ChannelUp" || e.keyCode === 33 || e.keyCode === 427;
      e.preventDefault();
      e.stopPropagation();
      scrollearVertical(scrolleableDe(document.body, alcance()), sube ? "up" : "down", 0.8);
      return;
    }

    const dir = direccionDe(e);
    if (!dir) return;

    // dentro de un campo de texto las flechas mueven el cursor; recién cuando el cursor
    // está en el borde (o el campo es de una sola línea, para ↑ ↓) se sale hacia otro elemento.
    // Un <select> cerrado no se traba: cuando está abierto el navegador se queda las teclas él
    if (tag === "TEXTAREA" || (tag === "INPUT" && !/^(button|submit|reset|checkbox|radio|file|image|color)$/i.test(el.type))) {
      if (el.type === "range" || el.type === "number") {
        if (dir === "left" || dir === "right") return;
      } else {
        let ini = null, fin = null;
        try { ini = el.selectionStart; fin = el.selectionEnd; } catch (err) { /* tipos sin selección (email, etc.) */ }

        const sinSeleccion = ini === fin;
        const alInicio = ini === null || (sinSeleccion && ini === 0);
        const alFinal = fin === null || (sinSeleccion && fin === (el.value || "").length);

        if (tag === "TEXTAREA") {
          if (dir === "left" || dir === "right") return;
          if ((dir === "up" && !alInicio) || (dir === "down" && !alFinal)) return;
        } else if ((dir === "left" && !alInicio) || (dir === "right" && !alFinal)) {
          return;
        }
      }
    }

    // al cerrarse un modal/menú, el foco vuelve al botón que lo abrió (la 1ª tecla solo lo restaura)
    const raiz = alcance();
    if (raiz !== ultimoAlcance) {
      if (ultimoAlcance === document.body && raiz !== document.body) focoGuardado = el;
      const volviendo = raiz === document.body && ultimoAlcance !== document.body;
      ultimoAlcance = raiz;

      if (volviendo && focoGuardado && document.contains(focoGuardado) && esVisible(focoGuardado)) {
        const f = focoGuardado;
        focoGuardado = null;
        e.preventDefault();
        enfocar(f);
        return;
      }
    }

    e.preventDefault();
    navegar(dir);
  }

  // ---- botones flotantes ▲ ▼ ----
  function crearScrollBtns() {
    if (scrollBtns) return;

    scrollBtns = document.createElement("div");
    scrollBtns.id = "tvScroll";
    scrollBtns.hidden = true;
    scrollBtns.innerHTML =
      '<button type="button" data-tv-scroll="up" aria-label="' + (window.t ? t("tv_subir") : "Subir") + '">▲</button>' +
      '<button type="button" data-tv-scroll="down" aria-label="' + (window.t ? t("tv_bajar") : "Bajar") + '">▼</button>';

    // stopPropagation: el click no tiene que llegar al "cerrar al tocar afuera" del menú/modales
    scrollBtns.addEventListener("click", e => {
      const b = e.target.closest("button[data-tv-scroll]");
      if (!b) return;
      e.stopPropagation();
      scrollearVertical(scrolleableDe(document.body, alcance()), b.dataset.tvScroll, 0.6);
    });

    document.body.appendChild(scrollBtns);
  }

  function actualizarScrollBtns() {
    if (!scrollBtns) return;

    const raiz = alcance();
    const sc = scrolleableDe(document.body, raiz);
    const hay = !!sc && sc.scrollHeight > (sc === document.scrollingElement ? innerHeight : sc.clientHeight) + 8;

    scrollBtns.hidden = !hay;
    if (!hay) return;

    scrollBtns.querySelector('[data-tv-scroll="up"]').classList.toggle("off", !puedeScrollear(sc, "up"));
    scrollBtns.querySelector('[data-tv-scroll="down"]').classList.toggle("off", !puedeScrollear(sc, "down"));
  }

  // ---- alta / baja del modo ----
  function programarMarcado() {
    if (programarMarcado.pend) return;
    programarMarcado.pend = true;

    requestAnimationFrame(() => {
      programarMarcado.pend = false;
      if (activo) volverEnfocables(document.body);
    });
  }

  function iniciar() {
    volverEnfocables(document.body);
    crearScrollBtns();

    if (!observer) {
      observer = new MutationObserver(programarMarcado);
      observer.observe(document.body, { childList: true, subtree: true });
    }

    document.addEventListener("keydown", onKeyDown, true);
    window.addEventListener("scroll", actualizarScrollBtns, { passive: true, capture: true });
    window.addEventListener("resize", actualizarScrollBtns);
    timer = setInterval(actualizarScrollBtns, 700);
    actualizarScrollBtns();
  }

  function parar() {
    if (observer) { observer.disconnect(); observer = null; }
    document.removeEventListener("keydown", onKeyDown, true);
    window.removeEventListener("scroll", actualizarScrollBtns, { capture: true });
    window.removeEventListener("resize", actualizarScrollBtns);
    if (timer) { clearInterval(timer); timer = null; }
    if (scrollBtns) scrollBtns.hidden = true;
  }

  function aplicar(v) {
    if (v === activo) return;
    activo = v;
    document.body.classList.toggle("tv", v);
    if (v) iniciar(); else parar();
    updateTvModeMenuButton();
  }

  // ---- botón del menú (Modo iglesia → Modo TV) ----
  window.toggleTvMode = function () {
    guardarPref(activo ? "off" : "on");
    aplicar(!activo);
  };

  window.updateTvModeMenuButton = function () {
    const btn = document.getElementById("tvModeToggleBtn");
    if (!btn) return;

    btn.innerText = activo ? t("activo") : t("inactivo");
    btn.classList.remove("on", "off");
    btn.classList.add(activo ? "on" : "off");

    scrollBtns?.querySelector('[data-tv-scroll="up"]')?.setAttribute("aria-label", t("tv_subir"));
    scrollBtns?.querySelector('[data-tv-scroll="down"]')?.setAttribute("aria-label", t("tv_bajar"));
  };

  window.isTvMode = () => activo;

  // en celulares/tablets: sin modo TV y sin la fila del menú
  const puede = permitido();
  const fila = document.getElementById("tvModeToggleRow");
  if (fila) fila.hidden = !puede;

  if (puede) {
    document.getElementById("tvModeToggleBtn")?.addEventListener("click", window.toggleTvMode);
    aplicar(detectarTV());
    updateTvModeMenuButton();
  }
})();
