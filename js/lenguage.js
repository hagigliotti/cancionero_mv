// ===============================================================================================
// ===================== FLAGS (MAPEO DE IDIOMAS) ===============================================
// Emojis de bandera por código de idioma
const FLAGS = {
  es: "🇦🇷",
  en: "🇺🇸",
  it: "🇮🇹",
  pt: "🇧🇷",
  fr: "🇫🇷",
  de: "🇩🇪",
  he: "🇮🇱",
  gn: "🇵🇾",
  zu: "🇿🇦",
  af: "🇿🇦",
  sw: "🇹🇿",
  is: "🇮🇸"
};

// Nombres legibles por idioma
const FLAG_NAMES = {
  es: "Argentina",
  en: "Estados Unidos",
  he: "Israel",
  it: "Italia",
  pt: "Brasil",
  fr: "Francia",
  gn: "Guaraní",
  af: "Afrikaans",
  sw: "Kiswahili",
  zu: "Zulu",
  is: "Islandés"
};

// Nombre del IDIOMA en sí (no del país) — para listar "en qué idiomas hay
// canciones" (ver abrirValoresModal("idioma") en app.js). Cubre todos los
// códigos que aparecen realmente en los datos, incluidos los que no están
// en el selector rápido de arriba (hebreo, zulú, etc.)
const IDIOMA_NOMBRES = {
  es: "Español",
  en: "English",
  it: "Italiano",
  pt: "Português",
  gn: "Guaraní",
  fr: "Francés",
  he: "Hebreo",
  zu: "Zulú",
  af: "Afrikáans",
  sw: "Suajili",
  is: "Islandés"
};

// Salmo 146:2 en cada idioma, para el mensaje de bienvenida (#mensajeInicio)
// cuando no hay ninguna canción abierta — ver actualizarVersiculoInicio().
// El guaraní no tiene traducción propia acá: usa la de español (fallback en
// la función de abajo), igual que pasa con el guaraní en otras partes de la app.
const VERSICULO_INICIO = {
  es: { texto: `"Alabaré a Jehová en mi vida; cantaré salmos a mi Dios mientras viva."`, referencia: "Salmo 146:2" },
  en: { texto: `"I will praise the Lord as long as I live; I will sing praises to my God while I have my being."`, referencia: "Psalm 146:2" },
  it: { texto: `"Loda il Signore, anima mia: loderò il Signore per tutta la mia vita, finché vivo canterò inni al mio Dio."`, referencia: "Salmi 146:2" },
  pt: { texto: `"Que todo o meu ser te louve, ó Senhor! A vida inteira eu louvarei o meu Deus, cantarei louvores a ele enquanto eu viver."`, referencia: "Salmos 146:2" },
  fr: { texto: `"Je louerai l'Éternel tant que je vivrai, Je célébrerai mon Dieu tant que j'existerai."`, referencia: "Psaumes 146:2" },
  de: { texto: `"Ich will den Herrn loben mein Leben lang, für meinen Gott singen und musizieren, solange ich bin."`, referencia: "Psalmen 146:2" }
};

function actualizarVersiculoInicio() {
  const versiculoEl = document.getElementById("versiculoInicio");
  const referenciaEl = document.getElementById("referenciaInicio");
  if (!versiculoEl || !referenciaEl) return;

  const v = conFallbackIdioma(VERSICULO_INICIO);
  versiculoEl.textContent = v.texto;
  referenciaEl.textContent = v.referencia;
}

// Placeholder del buscador principal (#buscador) en cada idioma — mismo
// patrón que VERSICULO_INICIO: el guaraní no tiene entrada propia acá y cae
// al español (ver actualizarBuscadorPlaceholder()).
const BUSCADOR_PLACEHOLDER = {
  es: "🔎 Buscar por título, letra, autor, compositor, ritmo o tags",
  en: "🔎 Search by title, lyrics, author, composer, rhythm or tags",
  it: "🔎 Cerca per titolo, testo, autore, compositore, ritmo o tag",
  pt: "🔎 Buscar por título, letra, autor, compositor, ritmo ou tags",
  fr: "🔎 Rechercher par titre, paroles, auteur, compositeur, rythme ou tags",
  de: "🔎 Suche nach Titel, Text, Autor, Komponist, Rhythmus oder Tags"
};

function actualizarBuscadorPlaceholder() {
  const buscadorEl = document.getElementById("buscador");
  if (!buscadorEl) return;

  buscadorEl.placeholder = conFallbackIdioma(BUSCADOR_PLACEHOLDER);
}

// traduce el texto fijo del menú (☰) — cada elemento tiene un id "txt..."
// puesto a propósito en index.html para esto. Se llama junto con
// actualizarVersiculoInicio()/actualizarBuscadorPlaceholder() cada vez que
// se inicia o se cambia el idioma.
function actualizarMenuIdioma() {
  const setText = (id, key) => {
    const el = document.getElementById(id);
    if (el) el.textContent = t(key);
  };

  setText("txtMenu", "menu");
  setText("txtInfoApp", "info_app");
  setText("txtRecursos", "recursos");
  setText("txtLibro", "libro");
  setText("txtBiblioteca", "biblioteca");
  setText("txtMiMusica", "mi_musica");
  setText("txtMisListas", "mis_listas");
  setText("txtBlocMusical", "bloc_musical");
  setText("txtHerramientas", "herramientas");
  setText("txtTamanoLetra", "tamano_letra");
  setText("txtMetronomoAfinador", "metronomo_afinador");
  setText("txtTransponerTonalidad", "transponer_tonalidad");
  setText("txtDiagramaAcordes", "diagrama_acordes");
  setText("txtTablatura", "tablatura");
  setText("txtTrasporte", "trasporte");
  setText("txtTeleprompterMenu", "teleprompter");
  setText("txtAjustes", "ajustes");
  setText("txtIdiomaCanciones", "idioma_canciones");
  setText("txtColorTema", "color_tema");
  setText("txtModoIglesia", "modo_iglesia");
  setText("txtProyector", "proyector");
  setText("txtFeedback", "feedback");
  setText("txtCompartir", "compartir");
  setText("txtContacto", "contacto");

  // "Ninguno/Piano/Guitarra/Bajo/Ukelele" del diagrama de acordes: hay dos
  // selects con las mismas opciones (menú y popover de acorde en la letra)
  ["menuChordInstrument", "chordPopoverInstrument"].forEach(id => {
    const sel = document.getElementById(id);
    if (!sel) return;
    Array.from(sel.options).forEach(opt => { opt.textContent = t(opt.value); });
  });

  // los botones "Mostrar/Ocultar"/"Activo/Inactivo" arman su propio texto
  // según su estado actual (ver applyTablaturaState, etc.) — se refrescan
  // llamando a esas mismas funciones en vez de traducir el botón a mano acá
  if (typeof applyTablaturaState === "function") applyTablaturaState();
  if (typeof applyTeleprompterBarVisibility === "function") applyTeleprompterBarVisibility();
  if (typeof applyChordFollowsTransposeState === "function") applyChordFollowsTransposeState();
  if (typeof updateProjectorMenuButton === "function") updateProjectorMenuButton();
}

// ===============================================================================================
// ===================== REGLA GENERAL DE FALLBACK DE IDIOMA ====================================
// es/gn → siempre español (gn no tiene traducciones propias en esta app: se
// muestra todo en español a propósito). Cualquier otro idioma → su propia
// traducción si el diccionario la tiene; si no, cae al inglés (no al
// español) — así un idioma que todavía no tiene traducciones propias (ej.
// hebreo, zulú, islandés, afrikáans, suajili) queda en inglés en vez de
// español, y si ni el inglés está cargado, recién ahí cae al español como
// último recurso. Todos los diccionarios de este archivo (UI_LABELS,
// VERSICULO_INICIO, BUSCADOR_PLACEHOLDER) usan esta misma regla acá.
function conFallbackIdioma(dict, lang = idiomaActual) {
  if (!lang || lang === "es" || lang === "gn") return dict.es;
  return dict[lang] || dict.en || dict.es;
}

// ===============================================================================================
// ===================== ETIQUETAS FIJAS DE LA INTERFAZ ==========================================
// Palabras fijas de la interfaz: la ficha de canción (etiquetas como
// "Autor:", "Compositor:", "Revisado:"), valores placeholder que vienen TAL
// CUAL guardados en data/*.json cuando el dato real no se conoce
// ("Desconocido", "Anónimo") y el menú (☰). No confundir con
// TAG_TRANSLATIONS (tag-translations.js, solo para tags) ni con nombres
// reales de persona, que nunca se traducen. Sigue la regla de
// conFallbackIdioma() de arriba.
const UI_LABELS = {
  // ficha de canción
  idiomas:            { es: "Idiomas",            en: "Languages",       it: "Lingue",              pt: "Idiomas",            fr: "Langues",            de: "Sprachen" },
  original:           { es: "Original",           en: "Original",        it: "Originale",           pt: "Original",           fr: "Original",           de: "Original" },
  otros_titulos:      { es: "Otros títulos",      en: "Other titles",    it: "Altri titoli",        pt: "Outros títulos",     fr: "Autres titres",      de: "Andere Titel" },
  autor:              { es: "Autor",              en: "Author",          it: "Autore",              pt: "Autor",              fr: "Auteur",             de: "Autor" },
  coautor:            { es: "Coautor",            en: "Co-author",       it: "Coautore",            pt: "Coautor",            fr: "Coauteur",           de: "Koautor" },
  compositor:         { es: "Compositor",         en: "Composer",        it: "Compositore",         pt: "Compositor",         fr: "Compositeur",        de: "Komponist" },
  traductor:          { es: "Traductor",          en: "Translator",      it: "Traduttore",          pt: "Tradutor",           fr: "Traducteur",         de: "Übersetzer" },
  anio:               { es: "Año",                en: "Year",            it: "Anno",                pt: "Ano",                fr: "Année",              de: "Jahr" },
  referencia_biblica: { es: "Referencia bíblica", en: "Bible reference", it: "Riferimento biblico", pt: "Referência bíblica", fr: "Référence biblique", de: "Bibelstelle" },
  tonalidad:          { es: "Tonalidad",          en: "Key",             it: "Tonalità",            pt: "Tom",                fr: "Tonalité",           de: "Tonart" },
  bpm:                { es: "BPM",                en: "BPM",             it: "BPM",                 pt: "BPM",                fr: "BPM",                de: "BPM" },
  compas:             { es: "Compás",             en: "Time signature",  it: "Tempo",               pt: "Compasso",           fr: "Mesure",             de: "Taktart" },
  ritmo:              { es: "Ritmo",              en: "Rhythm",          it: "Ritmo",               pt: "Ritmo",              fr: "Rythme",             de: "Rhythmus" },
  partitura:          { es: "Partitura",          en: "Sheet music",     it: "Spartito",            pt: "Partitura",          fr: "Partition",          de: "Notenblatt" },
  click_aqui:         { es: "Click aquí",         en: "Click here",      it: "Clicca qui",          pt: "Clique aqui",        fr: "Cliquez ici",        de: "Hier klicken" },
  temas:              { es: "Temas",              en: "Topics",          it: "Temi",                pt: "Temas",              fr: "Thèmes",             de: "Themen" },
  revisado:           { es: "Revisado",           en: "Reviewed",        it: "Revisionato",         pt: "Revisado",           fr: "Vérifié",            de: "Geprüft" },
  audio:              { es: "Audio",              en: "Audio",           it: "Audio",               pt: "Áudio",              fr: "Audio",              de: "Audio" },
  escuchar:           { es: "Escuchar",           en: "Listen",          it: "Ascolta",             pt: "Ouvir",              fr: "Écouter",            de: "Anhören" },
  si:                 { es: "Si",                 en: "Yes",             it: "Sì",                  pt: "Sim",                fr: "Oui",                de: "Ja" },
  no:                 { es: "No",                 en: "No",              it: "No",                  pt: "Não",                fr: "Non",                de: "Nein" },
  desconocido:        { es: "Desconocido",        en: "Unknown",         it: "Sconosciuto",         pt: "Desconhecido",       fr: "Inconnu",            de: "Unbekannt" },
  anonimo:            { es: "Anónimo",            en: "Anonymous",       it: "Anonimo",             pt: "Anônimo",            fr: "Anonyme",            de: "Anonym" },
  teleprompter:       { es: "Teleprónter",        en: "Teleprompter",    it: "Teleprompter",        pt: "Teleprompter",       fr: "Téléprompteur",      de: "Teleprompter" },

  // menú (☰)
  menu:                    { es: "Menú",                   en: "Menu",                  it: "Menu",                    pt: "Menu",                    fr: "Menu",                     de: "Menü" },
  info_app:                { es: "Información de la app",  en: "App information",       it: "Informazioni sull'app",   pt: "Informações do app",      fr: "Informations sur l'app",   de: "App-Informationen" },
  recursos:                { es: "Recursos",               en: "Resources",             it: "Risorse",                 pt: "Recursos",                fr: "Ressources",               de: "Ressourcen" },
  libro:                   { es: "Libro",                  en: "Book",                  it: "Libro",                   pt: "Livro",                   fr: "Livre",                    de: "Buch" },
  biblioteca:              { es: "Biblioteca",             en: "Library",               it: "Biblioteca",              pt: "Biblioteca",              fr: "Bibliothèque",             de: "Bibliothek" },
  mi_musica:               { es: "Mi música",              en: "My music",              it: "La mia musica",           pt: "Minha música",            fr: "Ma musique",               de: "Meine Musik" },
  mis_listas:              { es: "Mis Listas",             en: "My Setlists",           it: "Le mie scalette",         pt: "Minhas Listas",           fr: "Mes listes",               de: "Meine Listen" },
  bloc_musical:            { es: "Bloc musical",           en: "Music notepad",         it: "Blocco musicale",        pt: "Bloco musical",           fr: "Bloc-notes musical",       de: "Musiknotizblock" },
  herramientas:            { es: "Herramientas",           en: "Tools",                 it: "Strumenti",               pt: "Ferramentas",             fr: "Outils",                   de: "Werkzeuge" },
  tamano_letra:            { es: "Tamaño de letra",        en: "Text size",             it: "Dimensione testo",        pt: "Tamanho da letra",        fr: "Taille du texte",          de: "Textgröße" },
  metronomo_afinador:      { es: "Metrónomo y Afinador",   en: "Metronome & Tuner",     it: "Metronomo e Accordatore", pt: "Metrônomo e Afinador",    fr: "Métronome et Accordeur",   de: "Metronom und Stimmgerät" },
  transponer_tonalidad:    { es: "Transponer tonalidad",   en: "Transpose key",         it: "Trasporta tonalità",      pt: "Transpor tom",            fr: "Transposer la tonalité",   de: "Tonart transponieren" },
  diagrama_acordes:        { es: "Diagrama de acordes",    en: "Chord diagram",         it: "Diagramma accordi",       pt: "Diagrama de acordes",     fr: "Diagramme d'accords",      de: "Akkorddiagramm" },
  tablatura:               { es: "Tablatura",              en: "Tablature",             it: "Tablatura",               pt: "Tablatura",               fr: "Tablature",                de: "Tabulatur" },
  trasporte:               { es: "Trasporte",              en: "Chord transpose",       it: "Trasporto",               pt: "Transporte",              fr: "Transposition",            de: "Transponierung" },
  ajustes:                 { es: "Ajustes",                en: "Settings",              it: "Impostazioni",            pt: "Ajustes",                 fr: "Paramètres",               de: "Einstellungen" },
  idioma_canciones:        { es: "Idioma de las canciones",en: "Song language",         it: "Lingua dei canti",        pt: "Idioma das músicas",      fr: "Langue des chants",        de: "Liedsprache" },
  color_tema:              { es: "Color del tema",         en: "Theme color",           it: "Colore del tema",         pt: "Cor do tema",             fr: "Couleur du thème",         de: "Themenfarbe" },
  modo_iglesia:            { es: "Modo iglesia",           en: "Church mode",           it: "Modalità chiesa",         pt: "Modo igreja",             fr: "Mode église",              de: "Kirchenmodus" },
  proyector:               { es: "Proyector",              en: "Projector",             it: "Proiettore",              pt: "Projetor",                fr: "Projecteur",               de: "Projektor" },
  feedback:                { es: "Feedback",               en: "Feedback",              it: "Feedback",                pt: "Feedback",                fr: "Retours",                  de: "Feedback" },
  compartir:               { es: "Compartir",              en: "Share",                 it: "Condividi",               pt: "Compartilhar",            fr: "Partager",                 de: "Teilen" },
  contacto:                { es: "Contacto",               en: "Contact",               it: "Contatto",                pt: "Contato",                 fr: "Contact",                  de: "Kontakt" },

  // botones de estado on/off del menú
  mostrar:                 { es: "Mostrar",   en: "Show",     it: "Mostra",   pt: "Mostrar",  fr: "Afficher",  de: "Anzeigen" },
  ocultar:                 { es: "Ocultar",   en: "Hide",     it: "Nascondi", pt: "Ocultar",  fr: "Masquer",   de: "Ausblenden" },
  activo:                  { es: "Activo",    en: "On",       it: "Attivo",   pt: "Ativo",    fr: "Actif",     de: "Aktiv" },
  inactivo:                { es: "Inactivo",  en: "Off",      it: "Inattivo", pt: "Inativo",  fr: "Inactif",   de: "Inaktiv" },

  // instrumentos del diagrama de acordes
  ninguno:                 { es: "Ninguno",  en: "None",    it: "Nessuno", pt: "Nenhum",  fr: "Aucun",   de: "Keine" },
  piano:                   { es: "Piano",    en: "Piano",   it: "Piano",   pt: "Piano",   fr: "Piano",   de: "Piano" },
  guitarra:                { es: "Guitarra", en: "Guitar",  it: "Chitarra",pt: "Violão",  fr: "Guitare", de: "Gitarre" },
  bajo:                    { es: "Bajo",     en: "Bass",    it: "Basso",   pt: "Baixo",   fr: "Basse",   de: "Bass" },
  ukelele:                 { es: "Ukelele",  en: "Ukulele", it: "Ukulele", pt: "Ukulele", fr: "Ukulélé", de: "Ukulele" },

  // avisos
  idioma_fijo_aviso:       {
    es: "Este libro tiene un solo idioma — no se puede cambiar acá",
    en: "This book only has one language — it can't be changed here",
    it: "Questo libro ha una sola lingua — non si può cambiare qui",
    pt: "Este livro tem apenas um idioma — não é possível mudar aqui",
    fr: "Ce livre n'a qu'une seule langue — impossible de la changer ici",
    de: "Dieses Buch hat nur eine Sprache — kann hier nicht geändert werden"
  },
  proyector_solo_desktop:  {
    es: "📱 El modo proyector solo está disponible en tablets, PC o Mac.",
    en: "📱 Projector mode is only available on tablets, PC or Mac.",
    it: "📱 La modalità proiettore è disponibile solo su tablet, PC o Mac.",
    pt: "📱 O modo projetor só está disponível em tablets, PC ou Mac.",
    fr: "📱 Le mode projecteur n'est disponible que sur tablette, PC ou Mac.",
    de: "📱 Der Projektormodus ist nur auf Tablets, PC oder Mac verfügbar."
  }
};

// traduce una etiqueta fija (clave de UI_LABELS) al idioma actual
function t(key, lang = idiomaActual) {
  const entry = UI_LABELS[key];
  if (!entry) return key;

  return conFallbackIdioma(entry, lang);
}

// traduce un VALOR de dato (no una etiqueta) solo cuando ese valor es,
// literalmente, uno de los placeholders "Desconocido"/"Anónimo" guardados en
// data/*.json — cualquier otro valor (nombre real de autor, tonalidad real,
// etc.) se devuelve intacto, sin tocar
function traducirValorFijo(valor, lang = idiomaActual) {
  if (!valor) return valor;

  const texto = valor.toString().trim();
  if (texto === "Desconocido") return t("desconocido", lang);
  if (texto === "Anónimo") return t("anonimo", lang);
  return valor;
}

// ===============================================================================================
// ===================== TRADUCCIÓN DE TAGS ======================================================
// El diccionario TAG_TRANSLATIONS y la función getTagDisplay() se movieron a
// su propio archivo: tag-translations.js (cargado antes que este en
// index.html) — para agregar o corregir una traducción de tag, editar ahí,
// no acá.

// ===============================================================================================
// ===================== BANDERA POR PAÍS (personalización, NO cambia el idioma) =================
// El idioma del contenido (letra, tablatura, índice) sigue siendo uno solo por código
// ("es", "en", "pt"); esto solo decide QUÉ bandera se muestra para ese idioma,
// según el país del usuario — pura personalización visual.
const FLAG_VARIANTS = {
  es: {
    AR: { emoji: "🇦🇷", nombre: "Argentina" },
    ES: { emoji: "🇪🇸", nombre: "España" },
    MX: { emoji: "🇲🇽", nombre: "México" },
    CO: { emoji: "🇨🇴", nombre: "Colombia" },
    PE: { emoji: "🇵🇪", nombre: "Perú" },
    CL: { emoji: "🇨🇱", nombre: "Chile" },
    VE: { emoji: "🇻🇪", nombre: "Venezuela" },
    EC: { emoji: "🇪🇨", nombre: "Ecuador" },
    UY: { emoji: "🇺🇾", nombre: "Uruguay" },
    PY: { emoji: "🇵🇾", nombre: "Paraguay" },
    BO: { emoji: "🇧🇴", nombre: "Bolivia" },
    CR: { emoji: "🇨🇷", nombre: "Costa Rica" },
    PA: { emoji: "🇵🇦", nombre: "Panamá" },
    GT: { emoji: "🇬🇹", nombre: "Guatemala" },
    HN: { emoji: "🇭🇳", nombre: "Honduras" },
    NI: { emoji: "🇳🇮", nombre: "Nicaragua" },
    SV: { emoji: "🇸🇻", nombre: "El Salvador" },
    DO: { emoji: "🇩🇴", nombre: "Rep. Dominicana" },
    CU: { emoji: "🇨🇺", nombre: "Cuba" },
    PR: { emoji: "🇵🇷", nombre: "Puerto Rico" }
  },
  // el nombre de cada país va en el idioma de ESE grupo (en/fr/de), no en
  // español: este grupo solo se muestra mientras idiomaActual sea ese mismo
  // idioma (ver abrirBanderaPicker: FLAG_VARIANTS[idiomaActual]), así que
  // "United States" siempre aparece con la UI ya en inglés, nunca en español
  en: {
    US: { emoji: "🇺🇸", nombre: "United States" },
    GB: { emoji: "🇬🇧", nombre: "United Kingdom" }
  },
  pt: {
    BR: { emoji: "🇧🇷", nombre: "Brasil" },
    PT: { emoji: "🇵🇹", nombre: "Portugal" }
  },
  // fr/de: todavía no están activos en el selector de idioma (#idioma no
  // los lista), pero quedan listos con sus variantes de país para cuando se
  // activen — francés y alemán se hablan en varios países, no solo en
  // Francia/Alemania
  fr: {
    FR: { emoji: "🇫🇷", nombre: "France" },
    BE: { emoji: "🇧🇪", nombre: "Belgique" },
    CH: { emoji: "🇨🇭", nombre: "Suisse" },
    CA: { emoji: "🇨🇦", nombre: "Canada" },
    CD: { emoji: "🇨🇩", nombre: "R. D. du Congo" },
    CI: { emoji: "🇨🇮", nombre: "Côte d'Ivoire" },
    SN: { emoji: "🇸🇳", nombre: "Sénégal" },
    HT: { emoji: "🇭🇹", nombre: "Haïti" }
  },
  de: {
    DE: { emoji: "🇩🇪", nombre: "Deutschland" },
    AT: { emoji: "🇦🇹", nombre: "Österreich" },
    CH: { emoji: "🇨🇭", nombre: "Schweiz" },
    LI: { emoji: "🇱🇮", nombre: "Liechtenstein" },
    LU: { emoji: "🇱🇺", nombre: "Luxemburg" }
  }
};

const FLAG_VARIANT_DEFAULT = { es: "AR", en: "US", pt: "BR", fr: "FR", de: "DE" };

let banderaPorIdioma = {};

// intenta adivinar el país a partir del idioma configurado en el sistema del
// celular (ej. "es-PE", "en-GB"). Es solo una sugerencia inicial: refleja la
// configuración del dispositivo, no la ubicación real
function detectarPaisPorNavegador(lang) {
  const variants = FLAG_VARIANTS[lang];
  if (!variants) return null;

  const locales = (navigator.languages && navigator.languages.length)
    ? navigator.languages
    : [navigator.language];

  for (const loc of locales) {
    const region = (loc.split("-")[1] || "").toUpperCase();
    if (region && variants[region]) return region;
  }

  return null;
}

function cargarBanderasStorage() {
  try {
    banderaPorIdioma = JSON.parse(localStorage.getItem("banderaPorIdioma")) || {};
  } catch (e) {
    banderaPorIdioma = {};
  }

  // completar automáticamente, una sola vez, los idiomas con variantes que
  // todavía no tengan bandera guardada — de ahí en más queda fijo
  Object.keys(FLAG_VARIANTS).forEach(lang => {
    if (banderaPorIdioma[lang]) return;
    banderaPorIdioma[lang] = detectarPaisPorNavegador(lang) || FLAG_VARIANT_DEFAULT[lang];
  });

  guardarBanderas();
}

function guardarBanderas() {
  localStorage.setItem("banderaPorIdioma", JSON.stringify(banderaPorIdioma));
}

// bandera a mostrar para un idioma dado (con variante de país si existe)
function getFlagEmoji(lang) {
  const variants = FLAG_VARIANTS[lang];

  if (variants) {
    const code = banderaPorIdioma[lang] || FLAG_VARIANT_DEFAULT[lang];
    return variants[code]?.emoji || FLAGS[lang] || "🌐";
  }

  return FLAGS[lang] || "🌐";
}

// elegir manualmente la bandera/país para un idioma (queda guardado)
function setBanderaIdioma(lang, code) {
  if (!FLAG_VARIANTS[lang]?.[code]) return;

  banderaPorIdioma[lang] = code;
  guardarBanderas();

  updateLangFlag();
  renderBanderaSelect();
  refreshAllVisibleFlags();
}

// actualiza EN EL MOMENTO todas las banderitas por-canción que ya están
// dibujadas en pantalla (listado por letra/número, rango de himnos,
// resultados de búsqueda, la canción abierta) al cambiar de país — sin
// esto, el cambio recién se veía en lo próximo que se renderizara (volver
// a abrir la canción, cambiar de letra, etc.), no en lo que ya estaba
// visible. En vez de tener que saber qué lista está mostrada ahora mismo
// y volver a llamar a la función que corresponda (renderList,
// renderHymnRange, search...), cada bandera por-canción se dibuja con
// data-flag-lang="<idioma mostrado>" (ver renderLanguageFlags y
// getAvailableFlags) y acá simplemente se recalcula el emoji de todas las
// que haya en el DOM en este momento, sea cual sea la vista
function refreshAllVisibleFlags() {
  document.querySelectorAll("[data-flag-lang]").forEach(el => {
    el.textContent = getFlagEmoji(el.dataset.flagLang);
  });
}

// actualiza el ícono de bandera de la fila Idioma — solo queda "clickeable"
// si el idioma activo tiene más de un país disponible
function renderBanderaSelect() {
  // el span interno #idiomaFlagIconEmoji (no #idiomaFlagIcon entero): ese
  // ícono también tiene adentro el triangulito ".tap-hint-badge" que avisa
  // que se puede tocar — escribir sobre el ícono entero lo borraría cada
  // vez que cambia el idioma
  const icon = document.getElementById("idiomaFlagIcon");
  const emojiEl = document.getElementById("idiomaFlagIconEmoji");
  const variants = FLAG_VARIANTS[idiomaActual];

  if (!variants) {
    // sin variantes de país (ej. italiano, guaraní): igual se muestra SU
    // bandera fija, solo que el ícono no abre ningún selector
    if (emojiEl) emojiEl.textContent = getFlagEmoji(idiomaActual);
    if (icon) icon.classList.remove("flag-pick");
    return;
  }

  const current = banderaPorIdioma[idiomaActual] || FLAG_VARIANT_DEFAULT[idiomaActual];

  if (emojiEl) emojiEl.textContent = variants[current]?.emoji || "🌐";
  if (icon) icon.classList.add("flag-pick");
}

// popover con la lista de países del idioma activo (se dispara tocando la
// bandera de la fila Idioma). Antes esto intentaba abrir un <select> nativo
// oculto con .focus()+.click(): poco confiable entre navegadores (a veces
// no abría nada) y el foco programático sobre un elemento casi invisible
// hacía que la página saltara para "mostrarlo" — de ahí el salto raro del
// menú. Un popover propio evita las dos cosas.
function abrirBanderaPicker() {
  const variants = FLAG_VARIANTS[idiomaActual];
  if (!variants) return;

  const backdrop = document.getElementById("banderaPopoverBackdrop");
  const lista = document.getElementById("banderaPopoverList");
  if (!backdrop || !lista) return;

  const current = banderaPorIdioma[idiomaActual] || FLAG_VARIANT_DEFAULT[idiomaActual];

  const ordenados = Object.entries(variants)
    .sort((a, b) => a[1].nombre.localeCompare(b[1].nombre, "es", { sensitivity: "base" }));

  lista.innerHTML = ordenados.map(([code, info]) => `
    <button type="button" class="bandera-option ${code === current ? "active" : ""}"
            ${dataAction("elegirBanderaDesdePicker", [code])}>
      <span class="bandera-option-emoji">${info.emoji}</span>
      <span class="bandera-option-name">${info.nombre}</span>
    </button>
  `).join("");

  backdrop.classList.remove("hidden");
}

function cerrarBanderaPicker() {
  document.getElementById("banderaPopoverBackdrop")?.classList.add("hidden");
}

function elegirBanderaDesdePicker(code) {
  setBanderaIdioma(idiomaActual, code);
  cerrarBanderaPicker();
}

function initBanderaPicker() {
  const backdrop = document.getElementById("banderaPopoverBackdrop");
  if (!backdrop) return;

  backdrop.addEventListener("click", e => {
    if (e.target === backdrop) cerrarBanderaPicker();
  });
}


// ===============================================================================================
// ===================== ESTADO GLOBAL DEL IDIOMA ===============================================
let idiomaActual = "es";


// ===============================================================================================
// ===================== INICIALIZACIÓN DEL IDIOMA ===============================================
function initLanguage(defaultLang = "es") {

  // carga desde localStorage o usa idioma por defecto
  idiomaActual = localStorage.getItem("idioma") || defaultLang;

  const idiomaSelect = document.getElementById("idioma");
  const menuIdioma = document.getElementById("menuIdioma");

  // sincroniza UI
  if (idiomaSelect) idiomaSelect.value = idiomaActual;
  if (menuIdioma) menuIdioma.value = idiomaActual;

  updateLangFlag();
  actualizarVersiculoInicio();
  actualizarBuscadorPlaceholder();
  actualizarMenuIdioma();
}


// ===============================================================================================
// ===================== DISPONIBILIDAD DE IDIOMAS ==============================================

// Devuelve qué idiomas existen realmente en los datos
function getAvailableLanguages(data) {
  const set = new Set();

  data.forEach(song => {
    if (!song.idiomas) return;

    Object.keys(song.idiomas).forEach(lang => {
      const titulo = song.idiomas[lang]?.titulo;
      if (titulo && titulo.length > 0) {
        set.add(lang);
      }
    });
  });

  return set;
}


// Si el idioma actual no existe en los datos → fallback automático
function validateIdiomaActual() {
  const data = getDataActual();
  const available = getAvailableLanguages(data);

  if (!available.has(idiomaActual)) {
    idiomaActual = [...available][0];
  }
}


// ===============================================================================================
// ===================== CAMBIO DE IDIOMA =======================================================
function setIdioma(lang) {

  idiomaActual = lang;
  localStorage.setItem("idioma", lang);

  const idiomaSelect = document.getElementById("idioma");
  const menuIdioma = document.getElementById("menuIdioma");

  if (idiomaSelect) idiomaSelect.value = lang;
  if (menuIdioma) menuIdioma.value = lang;

  updateLangFlag();
  renderBanderaSelect();
  actualizarVersiculoInicio();
  actualizarBuscadorPlaceholder();
  actualizarMenuIdioma();

  // refrescar UI dependiente del idioma
  renderAlphabet();
  renderList(letraActiva);
}


// ===============================================================================================
// ===================== BOTÓN DE BANDERA =======================================================
function updateLangFlag() {
  // el span #langBtnFlag (no el <button> entero): el botón también tiene
  // adentro el triangulito ".lang-btn-badge" que avisa que se puede tocar
  // para cambiar — si esto escribiera sobre el botón entero (innerText),
  // lo borraría cada vez que cambia el idioma
  const flagEl = document.getElementById("langBtnFlag");
  if (!flagEl) return;

  flagEl.innerText = getFlagEmoji(idiomaActual);
}


// ===============================================================================================
// ===================== FLAGS POR CANCION ======================================================

// agrupa las banderas en filas (hasta 4 por fila; 5 si son más de 8 en
// total, para no dejar una última fila casi vacía) — con 4 o menos entra
// todo en una sola fila, como siempre
function chunkFlagRows(langs) {
  const rowSize = langs.length > 8 ? 5 : 4;
  const rows = [];
  for (let i = 0; i < langs.length; i += rowSize) rows.push(langs.slice(i, i + rowSize));
  return rows;
}

function wrapFlagRows(langs, flagHtml) {
  const rows = chunkFlagRows(langs);
  if (rows.length <= 1) return langs.map(flagHtml).join("");
  return rows.map(row => `<span class="flags-row">${row.map(flagHtml).join("")}</span>`).join("");
}

// nota (♪) chica pegada a la bandera, solo si ESE idioma tiene audio propio
// (audio_url puede variar de un idioma a otro dentro de la misma canción)
function audioNoteHtml(idiomaData) {
  return idiomaData?.audio_url ? `<span class="flag-audio-note">♪</span>` : "";
}

// Devuelve banderas disponibles (versión compacta para listas — usada en
// los resultados de búsqueda, ver search() en app.js)
function getAvailableFlags(song) {
  const idiomas = song.idiomas || {};

  const langs = Object.keys(idiomas)
    .filter(lang => idiomas[lang])
    .sort((a, b) => (FLAG_NAMES[a] || a).localeCompare(FLAG_NAMES[b] || b));

  // "idioma_real": ver el mismo ajuste en renderLanguageFlags más arriba —
  // sin esto, los himnos con letra sin traducir (ej. los ingleses del
  // Innario italiano) mostraban la bandera del libro (🇮🇹) en los
  // resultados de búsqueda en vez de la real (🇺🇸/🇬🇧)
  return wrapFlagRows(langs, lang => {
    const flagLang = idiomas[lang]?.idioma_real || lang;
    return `
    <span ${dataAction("changeLanguage", [lang, song.id])}
          title="${IDIOMA_NOMBRES[flagLang] || flagLang}"
          style="cursor:pointer; margin-right:6px;"
          data-flag-lang="${flagLang}">
      ${getFlagEmoji(flagLang)}
    </span>
  `;
  });
}


// Devuelve banderas con estilo (UI más completa). mostrarNotaAudio: la ♪
// solo se pide desde el listado por letra/número (ver renderList en
// songbook.js) — en la canción abierta y en el rango de himnos no se muestra.
// singleRow: en filas angostas (listado por letra/número) las banderas se
// agrupan en filas fijas de 4/5 para no desbordar; dentro de la canción
// abierta (.song-meta) hay mucho más ancho disponible, así que ahí no se
// pre-agrupan — se dejan sueltas y el flex-wrap del contenedor las acomoda
// solo, entrando todas en una fila si entran
function renderLanguageFlags(song, mostrarNotaAudio = false, singleRow = false) {
  const idiomas = song.idiomas || {};

  const langs = Object.keys(idiomas)
    .filter(lang => idiomas[lang]?.titulo)
    .sort((a, b) => (FLAG_NAMES[a] || a).localeCompare(FLAG_NAMES[b] || b));

  // la bandera va en su propio span (.flag-emoji) separado de la nota de
  // audio: así el subrayado de "activo" (border-bottom) queda solo debajo
  // de la bandera, no estirado también debajo de la ♪
  //
  // "idioma_real": libros de idioma fijo (ej. Innario italiano, ver
  // idiomaFijo en libros.json) guardan TODO bajo una sola clave ("it") sin
  // importar el idioma real de la letra, porque esa clave es la que decide
  // el número de himno / orden / filtros de todo el libro — cambiarla saca
  // la canción del himnario. Pero hay himnos ahí adentro cuyo texto está en
  // inglés sin traducir (ej. inno 505): para esos casos, "idioma_real"
  // (dentro de idiomas.it) permite mostrar la bandera/nombre que corresponde
  // al idioma real de la letra sin tocar la clave "it" de la que depende
  // todo lo demás. getFlagEmoji ya respeta la variante de bandera elegida
  // por el usuario (ej. EEUU/GB para "en"), así que no hace falta nada más.
  const flagHtml = lang => {
    const flagLang = idiomas[lang]?.idioma_real || lang;
    return `
    <span class="flag ${lang === idiomaActual ? "active" : ""}"
          ${dataAction("changeLanguage", [lang, song.id])}
          title="${IDIOMA_NOMBRES[flagLang] || flagLang}">
      <span class="flag-emoji" data-flag-lang="${flagLang}">${getFlagEmoji(flagLang)}</span>${mostrarNotaAudio ? audioNoteHtml(idiomas[lang]) : ""}
    </span>
  `;
  };

  return singleRow ? langs.map(flagHtml).join("") : wrapFlagRows(langs, flagHtml);
}


// ===============================================================================================
// ===================== CAMBIO DIRECTO DE IDIOMA POR CANCION ===================================
function changeLanguage(lang, songId) {

  idiomaActual = lang;
  localStorage.setItem("idioma", idiomaActual);

  const idiomaSelect = document.getElementById("idioma");
  if (idiomaSelect) idiomaSelect.value = lang;

  updateLangFlag();
  renderBanderaSelect();
  actualizarVersiculoInicio();
  actualizarBuscadorPlaceholder();
  actualizarMenuIdioma();

  const menuIdioma = document.getElementById("menuIdioma");
  if (menuIdioma) menuIdioma.value = lang;

  renderAlphabet();
  openSong(songId);
}


// ===============================================================================================
// ===================== UI DE BOTÓN DE IDIOMA ===================================================
function initLanguageUI() {

  const langBtn = document.getElementById("langBtn");
  const idiomaSelect = document.getElementById("idioma");

  let pressTimer;

  // CLICK: cambia idioma secuencialmente
  langBtn?.addEventListener("click", () => {
    const options = Array.from(idiomaSelect.options);
    const currentIndex = options.findIndex(o => o.value === idiomaActual);
    const nextIndex = (currentIndex + 1) % options.length;
    setIdioma(options[nextIndex].value);
  });

  // LONG PRESS: abre selector manual
  langBtn?.addEventListener("mousedown", () => {
    pressTimer = setTimeout(() => {
      idiomaSelect.style.pointerEvents = "auto";
      idiomaSelect.style.opacity = "1";
      idiomaSelect.focus();
      idiomaSelect.click();
    }, 500);
  });

  langBtn?.addEventListener("mouseup", () => clearTimeout(pressTimer));
  langBtn?.addEventListener("mouseleave", () => clearTimeout(pressTimer));

  // cambio desde select
  idiomaSelect?.addEventListener("change", () => {
    setIdioma(idiomaSelect.value);

    idiomaSelect.style.opacity = "0";
    idiomaSelect.style.pointerEvents = "none";
  });
}


// ===============================================================================================
// ===================== HELPERS DE CANCIONES ===================================================

// Título según idioma actual
function getSortTitle(song) {
  return normalize(song.idiomas?.[idiomaActual]?.titulo || "");
}

// Número de himno si existe. lang opcional: por defecto el idioma activo,
// pero el listado de un tag filtrado por idioma (ver renderPeopleModal)
// necesita mostrar el número de ESE idioma, no del que esté activo ahora
function getNumeroHimno(c, lang = idiomaActual) {
  return c.idiomas?.[lang]?.numero_himno ?? "";
}


// ===============================================================================================
// ===================== TÍTULOS MULTIIDIOMA ====================================================

// Devuelve todos los títulos posibles de una canción
function getAllSongTitles(song) {
  const base = song.idiomas?.[idiomaActual]?.titulo || "";
  const extras = normalizeArrayField(song.idiomas?.[idiomaActual]?.titulo2 || []);

  return [base, ...extras]
    .map(t => (t || "").trim())
    .filter(Boolean);
}


// Devuelve el mejor título disponible (fallback automático). lang opcional:
// por defecto el idioma activo — ver getNumeroHimno para el porqué
function getSongTitle(song, lang = idiomaActual) {

  const current = song?.idiomas?.[lang]?.titulo;

  if (Array.isArray(current)) {
    const valid = current.find(t => typeof t === "string" && t.trim());
    if (valid) return valid.trim();
  }

  if (typeof current === "string" && current.trim()) {
    return current.trim();
  }

  // fallback a cualquier idioma
  const idiomas = song?.idiomas || {};

  for (const lang of Object.keys(idiomas)) {

    const titulo = idiomas[lang]?.titulo;

    if (Array.isArray(titulo)) {
      const valid = titulo.find(t => typeof t === "string" && t.trim());
      if (valid) return valid.trim();
    }

    if (typeof titulo === "string" && titulo.trim()) {
      return titulo.trim();
    }
  }

  return "Sin título";
}


// ===============================================================================================
// ===================== NORMALIZACIÓN GENERAL ==================================================
// normalizeText vive en utils.js (se usa acá para titulo/titulo_original)

function normalizeSimple(value) {
  if (!value) return "";
  if (Array.isArray(value)) return value.filter(Boolean).join(", ");
  return value;
}

function normalizeField(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}


// ===============================================================================================
// ===================== NORMALIZACIÓN DE CANCIONES =============================================
function normalizeSong(song) {

  if (!song?.idiomas) return song;

  Object.keys(song.idiomas).forEach(lang => {
    const t = song.idiomas?.[lang]?.titulo;
    song.idiomas[lang].titulo = normalizeText(t);
  });

  song.titulo_original = normalizeText(song.titulo_original);

  song.year = normalizeSimple(song.year);
  song.tonalidad = normalizeSimple(song.tonalidad);
  song.tempo_bpm = normalizeSimple(song.tempo_bpm);
  song.compas = normalizeSimple(song.compas);

  return song;
}


// ===============================================================================================
// ===================== CAMPOS ESPECÍFICOS =====================================================
function normalizeTraductor(lang) {
  const trad = lang?.traductor;
  if (!trad) return [];
  return Array.isArray(trad) ? trad : [trad];
}