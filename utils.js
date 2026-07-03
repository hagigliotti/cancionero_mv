// ===================== STATE GLOBAL =====================
let revisadoModoActivo = false;
let modalContext = "normal";
let revisadoEstadoActual = "si";
let tagModalValue = "";

// ===================== HELPERS =====================

const tipoMap = {
  autor: "autor",
  coautor: "coautor",
  compositor: "compositor",
  traductor: "traductor"
};



// ===================== NORMALIZACIÓN =====================

function normalize(text) {
  return (text || "").toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[¿?¡!.,;:()"'`´¨[\]{}<>\/\\|@#$%^&*=+~…_-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}



function normalizeArrayField(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  return [value];
}

// ===================== BUSQUEDA / SEARCH =====================
function smartSort(a, b) {

  const titleA = normalize(a.displayTitle || "");
  const titleB = normalize(b.displayTitle || "");

  const numA = extractNumber(titleA);
  const numB = extractNumber(titleB);

  // 1. si ambos tienen número → ordenar por número
  if (numA !== null && numB !== null) {
    return numA - numB;
  }

  // 2. si uno tiene número → va primero el que NO tiene
  if (numA !== null) return -1;
  if (numB !== null) return 1;

  // 3. fallback alfabético
  return titleA.localeCompare(titleB, undefined, { sensitivity: "base" });
}




function buildSearchText(song) {
  const textos = [];

  // ===== TÍTULOS =====
  const idiomas = song.idiomas || {};

  Object.values(idiomas).forEach(lang => {
    if (lang?.titulo) textos.push(lang.titulo);
    if (lang?.titulo2) textos.push(lang.titulo2);
    if (lang?.letra) textos.push(lang.letra);
  });

  // ===== TÍTULO ORIGINAL =====
  textos.push(song.titulo_original);

  // ===== CAMPOS PERSONALES =====
  textos.push(song.autor);
  textos.push(song.coautor);
  textos.push(song.compositor);
  textos.push(song.traductor);

  return normalize(textos.flat().join(" "));
}

// ===== TAGS =====
if (song.tags) {
  textos.push(
    song.tags.map(t => normalize(t)).join(" ")
  );
}

// ===================== SEGURIDAD =====================

function escapeHtml(str = "") {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// ===================== REVISADO LABEL (🔥 FIX PEDIDO) =====================

function formatRevisadoLabel(value) {
  const [estado, personas] = normalizeRevisado(value);

  const label = estado.toLowerCase() === "si" ? "Si" : "No";

  const extra = personas.length
    ? ` - ${personas.join(", ")}`
    : "";

  return `Revisado: <b>${label}${extra}</b>`;
}

// --- Normalizador nuevo
function normalizeRevisado(value) {
  try {
    if (!value) return ["no", []];

    if (Array.isArray(value)) {
      const estado = (value[0] || "no").toLowerCase();
      const personas = value.slice(1).filter(Boolean);
      return [estado, personas];
    }

    return [value.toLowerCase(), []];

  } catch (e) {
    console.error("normalizeRevisado error:", value, e);
    return ["no", []];
  }
}



function getRevisadoEstado(value) {
  if (!value) return "no";
  if (Array.isArray(value)) return (value[0] || "no").toLowerCase();
  return value.toLowerCase();
}

function formatRevisadoDisplay(value) {
  const [estado, personas] = normalizeRevisado(value);

  const label = estado === "si" ? "Si" : "No";

  if (personas.length) {
    return `${label} - ${personas.join(", ")}`;
  }

  return label;
}


// ===================== SORTING =====================

function extractLeadingNumber(text) {
  if (!text) return null;
  const match = text.match(/^\d+/);
  return match ? parseInt(match[0], 10) : null;
}

function cleanTitleForSort(value) {
  return (normalizeText(value) || "")
    .replace(/^[^A-Z0-9ÁÉÍÓÚÜÑ]+/i, "")
    .trim();
}

function sortByTitle(data) {
  return [...data].sort((a, b) => {

    const aTitulo2 = a.idiomas?.[idiomaActual]?.titulo2 || "";
    const bTitulo2 = b.idiomas?.[idiomaActual]?.titulo2 || "";

    const aTitulo1 = a.idiomas?.[idiomaActual]?.titulo || "";
    const bTitulo1 = b.idiomas?.[idiomaActual]?.titulo || "";

    // 🔥 clave de orden: titulo2 si existe, si no titulo1
    const aKey = normalize(aTitulo2 || aTitulo1);
    const bKey = normalize(bTitulo2 || bTitulo1);

    return aKey.localeCompare(bKey, undefined, {
      sensitivity: "base",
      numeric: true
    });
  });
}

function getNumericSongs(data) {
  return data.filter(song => {
    const title = song.idiomas?.[idiomaActual]?.titulo || "";
    return /^\d/.test(title.trim());
  });
}

function sortNumericSongs(data) {
  return [...data].sort((a, b) => {

    const aTitle = a.idiomas?.[idiomaActual]?.titulo || "";
    const bTitle = b.idiomas?.[idiomaActual]?.titulo || "";

    const aNum = parseInt((aTitle.match(/^\d+/) || [0])[0], 10);
    const bNum = parseInt((bTitle.match(/^\d+/) || [0])[0], 10);

    return aNum - bNum;
  });
}

function renderABCList() {
  const data = getDataActual();
  renderListModal({
    title: "🔤 Orden alfabético",
    list: sortByTitle(data)
  });
}

function renderHashList() {
  const data = getDataActual();
  const numeric = getNumericSongs(data);

  renderListModal({
    title: "🔢 Orden numérico",
    list: sortNumericSongs(numeric)
  });
}

// ===================== MUSICA =====================

function normalizeRitmo(ritmo) {
  if (!ritmo) return [];
  return Array.isArray(ritmo)
    ? ritmo
    : ritmo.split("/").map(r => r.trim()).filter(Boolean);
}

function normalizeText(text = "") {
  return text?.toString().trim() || "";
}

function formatRitmo(ritmo) {
  const arr = normalizeRitmo(ritmo);

  if (!arr.length) return "";

  return arr
    .map(normalizeText)
    .sort((a, b) =>
      a.localeCompare(b, "es", { sensitivity: "base" })
    )
    .join(", ");
}

function extractRootNote(note) {

  if (!note) return "A";

  // buscar contenido entre paréntesis
  const parenMatch = note.match(/\(([^)]+)\)/);

  let cleanNote = parenMatch
    ? parenMatch[1]
    : note;

  // extraer nota base
  const match = cleanNote.match(/^([A-G][b#]?)/);

  return match ? match[1] : "A";
}

// ===================== CAMPOS ESPECÍFICOS =====================

function normalizeReferenciaBiblica(ref) {
  if (!ref) return [];
  return Array.isArray(ref)
    ? ref
    : ref.split(",").map(r => r.trim()).filter(Boolean);
}

function normalizeTituloOriginal(value) {
  if (!value) return "";
  if (Array.isArray(value)) return value.filter(Boolean).join(", ");
  return value;
}





// ===================== PERSONAS =====================

function renderPersonLinks(label, value) {
  const arr = normalizeArrayField(value);

  if (!arr.length) return "";

  return `
    <span>
      <b>${label}:</b>
      ${arr.map(p => `
        <span class="person-link"
          onclick="openPersonModal('${p}', '${label.toLowerCase()}')">
          ${p}
        </span>
      `).join(", ")}
    </span>
  `;
}



// ===================== Estrofas y Coros =====================



// ===================== AKA =====================
// a.k.a. (Del inglés "Also Known As", muy usado en música) $\rightarrow$ Significa "También conocida como".
function formatTitulo2(text) {
  if (!text) return "";

  return text.replace(
    /\(aka\)/gi,
    `<span class="aka" title="Also Known As">(aka)</span>`
  );
}

// ===================== MODAL HELPERS =====================
function normalizeMeta(song, field) {
  return normalizeSimple(song?.[field]);
}

// ===================== MODAL REVISADO =====================
function cerrarListModal() {
  document.getElementById("listModal").style.display = "none";
}



function toggleRevisadoEstado() {
  revisadoEstadoActual = (revisadoEstadoActual === "si") ? "no" : "si";
  renderRevisadoModal();
}

function renderRevisadoModal() {
  const data = getDataActual();

  const filtered = data.filter(song => {
    const [estado] = normalizeRevisado(song.idiomas?.[idiomaActual]?.revisado);

    if (revisadoEstadoActual === "si") {
      return estado === "si";
    } else {
      return estado !== "si";
    }
  });

  const btn = document.getElementById("toggleRevisadoBtn");

  if (btn) btn.style.display = "inline-block";

  if (btn) {
    btn.innerText =
      revisadoEstadoActual === "si"
        ? "❌ Ver no revisadas"
        : "✔️ Ver revisadas";
  }

  const title =
    revisadoEstadoActual === "si"
      ? "✔️ Canciones revisadas"
      : "❌ Canciones no revisadas";

  document.getElementById("listModalTitle").innerText = title;

  renderListModal({
    title,
    list: filtered
  });

  document.getElementById("listModal").style.display = "block";
}

function openRevisadoList(valor) {
  const [estado] = normalizeRevisado(valor);
  revisadoEstadoActual = (estado === "si") ? "si" : "no";
  renderRevisadoModal();
}

// ===================== MODAL PERSONAS =====================
let personModalTipo = "autor";
let personModalValor = "";

const personIcons = {
  autor: "👤",
  coautor: "👥",
  compositor: "🎼",
  traductor: "🌐"
};

function renderPersonModal() {
  const data = getDataActual();

  const filtered = data.filter(song => {
    const values = normalizeField(song[personModalTipo])
      .map(v => normalize(v));

    const traductor = normalizeField(song.idiomas?.[idiomaActual]?.traductor)
      .map(v => normalize(v));

    if (personModalTipo === "traductor") {
      return traductor.includes(normalize(personModalValor));
    }

    return values.includes(normalize(personModalValor));
  });

  const icon = personIcons[personModalTipo] || "👤";

const title = `${icon} ${personModalTipo.charAt(0).toUpperCase()}${personModalTipo.slice(1)}: ${personModalValor}`;

  const btn = document.getElementById("toggleRevisadoBtn");
    if (btn) btn.style.display = "none";
  document.getElementById("listModalTitle").innerText = title;

  renderListModal({
    title,
    list: filtered
  });

  document.getElementById("listModal").style.display = "block";
}

function showPersonSongs(valor, tipo) {
  personModalTipo = tipo;
  personModalValor = valor;
  renderPersonModal();
}

// ===================== MODAL TAGS =====================
function openTagModal(tag) {
  tagModalValue = tag;
  renderTagModal();
}

function renderTagModal() {
  const data = getDataActual();

  const filtered = data.filter(song =>
    song.tags?.some(t => normalize(t) === normalize(tagModalValue))
  );

  const title = `Tag: ${tagModalValue}`;

  document.getElementById("listModalTitle").innerText = title;

  // ocultar botón de revisados
  const btn = document.getElementById("toggleRevisadoBtn");
  if (btn) btn.style.display = "none";

  renderListModal({
    title,
    list: filtered
  });

  document.getElementById("listModal").style.display = "block";
}

function cerrarListModal() {
  document.getElementById("listModal").style.display = "none";
  tagModalValue = "";
}



// Funcion para cerrar modals
function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.style.display = "none";
}

function closeAllModals() {
  const modals = [
    "infoModal",
    "bibliotecaModal",
    "shareModal",
    "peopleModal",
    "metroModal",
    "modalMetronomo",
    "listModal"
  ];

  modals.forEach(id => {
    const m = document.getElementById(id);
    if (m) m.style.display = "none";
  });
}