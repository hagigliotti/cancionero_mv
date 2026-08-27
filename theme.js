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

  // modo nocturno (fondo navy)
  if (document.body.classList.contains("light-mode")) {
    logo.src = "imagenes/Cancionero_blue.png";
    return;
  }

  // modo diurno (fondo claro)
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