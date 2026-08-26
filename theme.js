// ===================== THEME =====================
function toggleTheme() {
  const body = document.body;

  // 🚫 BLOQUEO EN MODO PROYECTOR
  if (body.classList.contains("projector")) {
    alert("📽️ Debes desactivar el \"modo proyector\" para cambiar el tema (claro/oscuro).");
    return;
  }

  if (body.classList.contains("light-mode")) {
    body.classList.replace("light-mode", "dark-mode");
    localStorage.setItem("theme", "dark");
  } else {
    body.classList.replace("dark-mode", "light-mode");
    localStorage.setItem("theme", "light");
  }

  updateThemeMenuText();
  updateLogo();
  updateThemeColorMeta();
}

function loadTheme() {
  const body = document.body;
  const saved = localStorage.getItem("theme");

  if (saved === "light") {
    body.classList.add("light-mode");
  } else {
    body.classList.add("dark-mode");
  }

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
  // bloquear en celulares y tablets
  if (isMobileOrTablet()) {
    alert("📱 El modo proyector solo está disponible en Desktops.");
    return;
  }

  const body = document.body;

  if (body.classList.contains("projector")) {
    body.classList.remove("projector");
    localStorage.setItem("projector", "off");
  } else {
    body.classList.add("projector");
    localStorage.setItem("projector", "on");
  }

  updateLogo();
}


// ===================== LOGO DINAMICO - BANNER =====================
function updateLogo() {
  const logo = document.getElementById("logoCancionero");

  if (!logo) return;

  // prioridad: modo proyector
  if (document.body.classList.contains("projector")) {
    logo.src = "imagenes/Cancionero_black.png";
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