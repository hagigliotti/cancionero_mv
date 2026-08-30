// ===================== THEME =====================
// el modo proyector tiene su propia preferencia de tema ("projectorTheme"),
// separada de la normal ("theme") — así cada una se acuerda de lo último
// que elegiste ahí, sin pisarse entre sí
function themeStorageKey() {
  return document.body.classList.contains("projector") ? "projectorTheme" : "theme";
}

function toggleTheme() {
  const body = document.body;
  const storageKey = themeStorageKey();

  if (body.classList.contains("light-mode")) {
    body.classList.replace("light-mode", "dark-mode");
    localStorage.setItem(storageKey, "dark");
  } else {
    body.classList.replace("dark-mode", "light-mode");
    localStorage.setItem(storageKey, "light");
  }

  updateThemeMenuText();
  updateLogo();
  updateThemeColorMeta();
}

// aplica el tema guardado bajo storageKey (o "fallback" si todavía no se
// eligió ninguno ahí) — se usa tanto al cargar la app como al entrar/salir
// del modo proyector
function applyStoredTheme(storageKey, fallback) {
  const body = document.body;
  const saved = localStorage.getItem(storageKey) || fallback;

  body.classList.remove("light-mode", "dark-mode");
  body.classList.add(saved === "light" ? "light-mode" : "dark-mode");
}

function loadTheme() {
  // si ya arrancó en modo proyector (se agrega la clase antes de llamar a
  // loadTheme, ver init() en app.js), usa la preferencia del proyector;
  // si no, la normal
  applyStoredTheme(themeStorageKey(), document.body.classList.contains("projector") ? "light" : "dark");

  updateThemeMenuText();
  updateLogo();
  updateThemeColorMeta();
}

// barra de estado del sistema (modo standalone) acorde al tema activo
function updateThemeColorMeta() {
  const meta = document.querySelector('meta[name="theme-color"]');
  if (!meta) return;

  const isLight = document.body.classList.contains("light-mode");
  meta.setAttribute("content", isLight ? "#0d1e30" : "#f8fafc");
}

function updateThemeMenuText() {
  const btn = document.getElementById("themeToggleBtn");
  if (!btn) return;

  const isLight = document.body.classList.contains("light-mode");

  btn.textContent = isLight ? "👓" : "🕶️";
  btn.title = isLight ? "Cambiar a tema oscuro" : "Cambiar a tema claro";
  btn.setAttribute("aria-label", btn.title);
}


// ===================== COLOR DE ACENTO =====================
// independiente del tema claro/oscuro: se guarda como data-accent en
// <body> y en cascada cambia --sky/--sky-dark/--sky-rgb (ver style.css,
// bloques body[data-accent="..."]) — de ahí sale casi todo el celeste de
// la app (botones, acordes, fondo con tinte, glow), así que cambiar estas
// 3 variables alcanza para repintar todo sin tocar cada regla una por una.
// "celeste" no lleva atributo — es el valor por defecto ya en :root.
// El proyector en modo oscuro queda afuera a propósito (ver ese bloque en
// style.css, con más especificidad): siempre celeste/negro, no acompaña
// el acento elegido.
const ACCENTS = ["celeste", "naranja", "rosa", "coral", "violeta", "lila", "turquesa", "verde", "amarillo", "gris", "monocromo"];

function loadAccentColor() {
  applyAccentColor(localStorage.getItem("accentColor") || "celeste", false);
}

function setAccentColor(id) {
  applyAccentColor(id, true);
}

function applyAccentColor(id, guardar) {
  if (!ACCENTS.includes(id)) id = "celeste";

  if (id === "celeste") {
    document.body.removeAttribute("data-accent");
  } else {
    document.body.setAttribute("data-accent", id);
  }

  if (guardar) localStorage.setItem("accentColor", id);

  document.querySelectorAll("#accentPicker [data-accent-option]").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.accentOption === id);
  });

  // el logo "azul"/"negro"/"blanco" en modo nocturno depende de qué
  // acento está elegido (ver updateLogo) — recalcularlo acá también, no
  // solo al cambiar de tema, para que cambie en el momento al tocar un
  // círculo de color, no recién la próxima vez que se recargue la página
  if (typeof updateLogo === "function") updateLogo();
}

// ===== ALERT ============================================================================
function showToast(msg) {
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.innerText = msg;

  document.body.appendChild(toast);

  // fuerza el reflow antes de agregar "show": si se agrega en el mismo
  // frame que se crea el elemento, el navegador puede saltearse la
  // transición de entrada y aparecer sin animar
  requestAnimationFrame(() => toast.classList.add("show"));

  setTimeout(() => {
    toast.classList.remove("show");
    toast.addEventListener("transitionend", () => toast.remove(), { once: true });
  }, 2800);
}


// ===== PROYECTOR ============================================================================
function toggleProjectorMode() {
  // bloquear solo en celulares — tablets, PC y Mac sí pueden usarlo
  if (isSmartphone()) {
    alert("📱 El modo proyector solo está disponible en tablets, PC o Mac.");
    return;
  }

  const body = document.body;

  if (body.classList.contains("projector")) {
    body.classList.remove("projector");
    localStorage.setItem("projector", "off");

    // al salir, vuelve a la preferencia normal (no la del proyector)
    applyStoredTheme("theme", "dark");
    updateThemeMenuText();
    updateThemeColorMeta();
  } else {
    body.classList.add("projector");
    localStorage.setItem("projector", "on");

    // usa la última preferencia elegida DENTRO del proyector; si es la
    // primera vez que se usa, arranca en oscuro (fondo negro) por defecto
    applyStoredTheme("projectorTheme", "light");
    updateThemeMenuText();
    updateThemeColorMeta();
  }

  updateLogo();
  updateProjectorMenuButton();
}

// botón "Activo"/"Inactivo" del menú (mismo patrón que Tablatura/Teleprónter)
function initProjectorToggleButton() {
  const btn = document.getElementById("projectorToggleBtn");
  if (!btn) return;

  btn.addEventListener("click", toggleProjectorMode);

  // el proyector no funciona en celulares: directamente se oculta el
  // control entero (con su título "Modo iglesia") para no ofrecer algo
  // que solo va a mostrar una alerta de bloqueo
  if (isSmartphone()) {
    document.getElementById("projectorToggleGroup")?.classList.add("hidden");
  }
}

function updateProjectorMenuButton() {
  const btn = document.getElementById("projectorToggleBtn");
  if (!btn) return;

  const activo = document.body.classList.contains("projector");

  btn.innerText = activo ? "Activo" : "Inactivo";
  btn.classList.remove("on", "off");
  btn.classList.add(activo ? "on" : "off");
}


// ===================== LOGO DINAMICO - BANNER =====================
function updateLogo() {
  const logo = document.getElementById("logoCancionero");

  if (!logo) return;

  // prioridad: modo proyector — según el tema del proyector el fondo es
  // negro u blanco (ver MODO PROYECTOR en style.css), el logo tiene que
  // matchear igual que en el modo normal
  if (document.body.classList.contains("projector")) {
    logo.src = document.body.classList.contains("dark-mode")
      ? "imagenes/Cancionero_white.png"  // proyector claro (fondo blanco)
      : "imagenes/Cancionero_black.png"; // proyector oscuro (fondo negro)
    return;
  }

  // modo nocturno: el logo "azul" (Cancionero_blue.png) tiene ese fondo
  // pintado adentro de la imagen a propósito para el navy de --bg-night,
  // pero esa base ya no es siempre navy — cambia según el color del tema
  // (ver COLOR DE ACENTO en style.css). Por eso el logo también depende
  // del acento elegido: "celeste" sigue usando el azul (matchea con su
  // propio navy), "gris"/"monocromo" usan el negro (matchean con esos
  // fondos casi negros), y el resto de las paletas usa el blanco — no hay
  // un logo por cada color, pero el blanco "flota" razonablemente bien
  // sobre cualquier fondo oscuro, y el resplandor del color del tema
  // alrededor (.logo-title img, ver CSS) hace que el borde se vea
  // intencional en vez de una costura
  if (document.body.classList.contains("light-mode")) {
    const acento = document.body.getAttribute("data-accent") || "celeste";
    if (acento === "gris" || acento === "monocromo") {
      logo.src = "imagenes/Cancionero_black.png";
    } else if (acento === "celeste") {
      logo.src = "imagenes/Cancionero_blue.png";
    } else {
      logo.src = "imagenes/Cancionero_white.png";
    }
    return;
  }

  // modo diurno (fondo claro): el logo blanco ya matchea siempre, porque
  // --bg-day también arranca en blanco puro arriba (donde vive el logo)
  // sin importar el acento elegido — no hace falta ningún ajuste acá
  logo.src = "imagenes/Cancionero_white.png";
}

// ===================== MOBILE =====================
function isMobileOrTablet() {
  return /Mobi|Android|iPhone|iPad|iPod|Tablet/i.test(navigator.userAgent);
}

// específico para el modo proyector: solo bloquea celulares — tablets, PC
// y Mac quedan afuera a propósito. Los celulares casi siempre traen
// "Mobile" en el user agent (iPhone, Android en modo teléfono); las
// tablets (iPad, Android en modo tablet) no lo traen
function isSmartphone() {
  const ua = navigator.userAgent;
  return /Mobile/i.test(ua) && !/iPad/i.test(ua);
}