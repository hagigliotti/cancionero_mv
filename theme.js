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
}

function updateThemeMenuText() {
  const item = document.getElementById("themeMenuItem");
  if (!item) return;

  const isLight = document.body.classList.contains("light-mode");

  item.innerHTML = isLight
    ? "👓 Tema claro"
    : "🕶️ Tema oscuro";
}


// ===== ALERT ============================================================================
function showToast(msg) {
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.innerText = msg;

  document.body.appendChild(toast);

  setTimeout(() => toast.remove(), 2500);
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
    logo.src = "imagenes/Banner_black.png";
    return;
  }

  // tema claro
  if (document.body.classList.contains("light-mode")) {
    logo.src = "imagenes/Banner_blu.png";
    return;
  }

  // tema oscuro azul
  logo.src = "imagenes/Banner_white.png";
}

// ===================== MOBILE =====================
function isMobileOrTablet() {
  return /Mobi|Android|iPhone|iPad|iPod|Tablet/i.test(navigator.userAgent);
}