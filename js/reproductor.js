// ===============================================================================================
// MIS PLAYLISTS — reproductor con look y comportamiento de Spotify (siempre
// oscuro, portada grande, degradé con el color de la portada, mini
// reproductor abajo, menú "⋯" por canción), adentro de un modal que en el
// celular ocupa toda la pantalla.
// Las canciones son las de data/*.json (con su letra, autor, compositor,
// etc.), y el mp3 de cada una sale de las rutas por libro de
// data/audios.json (ver js/audios.js): solo aparecen los cantos cuyo mp3
// existe en el repositorio de medios, y un libro sin ninguno no aparece.
// Si un canto tiene 2 mp3 (vocal/ y playbacks/), se elige según la versión
// preferida ("Con voz" / "Pista"), que se recuerda en este dispositivo.
// La portada sale de la imagen que trae el propio mp3 adentro (tag ID3,
// frame APIC): se piden solo los primeros bytes del archivo, no el audio
// entero. Si el mp3 no trae imagen, se usa "portada" del libro en
// libros.json (opcional) o una tapa generada con la marca del libro.
// El <audio> vive fuera del modal: minimizar NO corta la música (queda una
// barrita flotante abajo); cerrar con ✕ sí.
// Playlists guardadas LOCAL (localStorage "misPlaylists"), solo ids de
// canciones — mismo espíritu que Mis Listas.
// Usa funciones de app.js/songbook.js/lenguage.js/utils.js a propósito
// (LIBROS, getLibroSongs, getLibrosVisiblesOrdenados, getSongPorIdRapido,
// getLibroIdDeSong, getSongTitle, stripChords, detectSectionLabel, openSong,
// normalize, escapeHtml, dataAction, showToast, closeMenu).
// ===============================================================================================

// ===================== TRADUCCIÓN DEL MODAL =====================
const RP_LABELS = {
  titulo:            { es: "Mis Playlists", en: "My Playlists", it: "Le mie playlist", pt: "Minhas Playlists", fr: "Mes playlists", de: "Meine Playlists" },
  filtro_todo:       { es: "Todo", en: "All", it: "Tutto", pt: "Tudo", fr: "Tout", de: "Alle" },
  filtro_playlists:  { es: "Playlists", en: "Playlists", it: "Playlist", pt: "Playlists", fr: "Playlists", de: "Playlists" },
  filtro_libros:     { es: "Libros", en: "Books", it: "Libri", pt: "Livros", fr: "Livres", de: "Bücher" },
  tipo_libro:        { es: "Libro", en: "Book", it: "Libro", pt: "Livro", fr: "Livre", de: "Buch" },
  tipo_playlist:     { es: "Playlist", en: "Playlist", it: "Playlist", pt: "Playlist", fr: "Playlist", de: "Playlist" },
  canciones:         { es: "{n} canciones", en: "{n} songs", it: "{n} brani", pt: "{n} músicas", fr: "{n} titres", de: "{n} Titel" },
  crear_playlist:    { es: "Crear playlist", en: "Create playlist", it: "Crea playlist", pt: "Criar playlist", fr: "Créer une playlist", de: "Playlist erstellen" },
  crear_playlist_sub:{ es: "Armá tu propia lista de cantos", en: "Build your own list of songs", it: "Crea la tua lista di brani", pt: "Monte sua própria lista de músicas", fr: "Créez votre propre liste de titres", de: "Stell deine eigene Liste zusammen" },
  nombre_playlist:   { es: "Ponele nombre a tu playlist", en: "Give your playlist a name", it: "Dai un nome alla tua playlist", pt: "Dê um nome à sua playlist", fr: "Donnez un nom à votre playlist", de: "Gib deiner Playlist einen Namen" },
  nombre_default:    { es: "Mi playlist n.º {n}", en: "My playlist #{n}", it: "La mia playlist n. {n}", pt: "Minha playlist nº {n}", fr: "Ma playlist n° {n}", de: "Meine Playlist Nr. {n}" },
  sin_libros:        { es: "Todavía no hay libros con audios.", en: "There are no books with audio yet.", it: "Non ci sono ancora libri con audio.", pt: "Ainda não há livros com áudios.", fr: "Aucun livre avec audio pour l'instant.", de: "Noch keine Bücher mit Audio." },
  sin_resultados:    { es: "No hay resultados.", en: "No results.", it: "Nessun risultato.", pt: "Nenhum resultado.", fr: "Aucun résultat.", de: "Keine Ergebnisse." },
  buscar_en:         { es: "Título, número, letra o autor", en: "Title, number, lyrics or author", it: "Titolo, numero, testo o autore", pt: "Título, número, letra ou autor", fr: "Titre, numéro, paroles ou auteur", de: "Titel, Nummer, Text oder Autor" },
  playlist_vacia:    { es: "Agregá cantos con el menú ⋯ de cualquier canción.", en: "Add songs from the ⋯ menu of any song.", it: "Aggiungi brani dal menu ⋯ di qualsiasi brano.", pt: "Adicione músicas pelo menu ⋯ de qualquer música.", fr: "Ajoutez des titres via le menu ⋯ de n'importe quel titre.", de: "Füge Titel über das ⋯-Menü eines Titels hinzu." },
  playlist_vacia_t:  { es: "Esta playlist está vacía", en: "This playlist is empty", it: "Questa playlist è vuota", pt: "Esta playlist está vazia", fr: "Cette playlist est vide", de: "Diese Playlist ist leer" },
  agregar_playlist:  { es: "Agregar a playlist", en: "Add to playlist", it: "Aggiungi alla playlist", pt: "Adicionar à playlist", fr: "Ajouter à la playlist", de: "Zur Playlist hinzufügen" },
  nueva_playlist:    { es: "Nueva playlist", en: "New playlist", it: "Nuova playlist", pt: "Nova playlist", fr: "Nouvelle playlist", de: "Neue Playlist" },
  quitar_playlist:   { es: "Quitar de esta playlist", en: "Remove from this playlist", it: "Rimuovi da questa playlist", pt: "Remover desta playlist", fr: "Retirer de cette playlist", de: "Aus dieser Playlist entfernen" },
  subir:             { es: "Mover arriba", en: "Move up", it: "Sposta su", pt: "Mover para cima", fr: "Monter", de: "Nach oben" },
  bajar:             { es: "Mover abajo", en: "Move down", it: "Sposta giù", pt: "Mover para baixo", fr: "Descendre", de: "Nach unten" },
  ver_cancionero:    { es: "Ver en el cancionero", en: "Open in the songbook", it: "Apri nel canzoniere", pt: "Abrir no cancioneiro", fr: "Ouvrir dans le recueil", de: "Im Liederbuch öffnen" },
  renombrar:         { es: "Cambiar nombre", en: "Rename", it: "Rinomina", pt: "Renomear", fr: "Renommer", de: "Umbenennen" },
  eliminar:          { es: "Eliminar playlist", en: "Delete playlist", it: "Elimina playlist", pt: "Excluir playlist", fr: "Supprimer la playlist", de: "Playlist löschen" },
  cancelar:          { es: "Cancelar", en: "Cancel", it: "Annulla", pt: "Cancelar", fr: "Annuler", de: "Abbrechen" },
  agregada:          { es: "Agregada a {nombre}", en: "Added to {nombre}", it: "Aggiunta a {nombre}", pt: "Adicionada a {nombre}", fr: "Ajoutée à {nombre}", de: "Zu {nombre} hinzugefügt" },
  ya_estaba:         { es: "Ya está en {nombre}", en: "Already in {nombre}", it: "Già in {nombre}", pt: "Já está em {nombre}", fr: "Déjà dans {nombre}", de: "Schon in {nombre}" },
  confirm_eliminar:  { es: "¿Eliminar la playlist «{nombre}»?", en: "Delete the playlist «{nombre}»?", it: "Eliminare la playlist «{nombre}»?", pt: "Excluir a playlist «{nombre}»?", fr: "Supprimer la playlist «{nombre}» ?", de: "Playlist «{nombre}» löschen?" },
  desde:             { es: "Reproduciendo desde", en: "Playing from", it: "In riproduzione da", pt: "Tocando de", fr: "Lecture depuis", de: "Wiedergabe aus" },
  letra:             { es: "Letra", en: "Lyrics", it: "Testo", pt: "Letra", fr: "Paroles", de: "Songtext" },
  creditos:          { es: "Créditos", en: "Credits", it: "Crediti", pt: "Créditos", fr: "Crédits", de: "Mitwirkende" },
  acerca:            { es: "Acerca del canto", en: "About the song", it: "Info sul brano", pt: "Sobre a música", fr: "À propos du titre", de: "Über den Titel" },
  titulo_original:   { es: "Título original", en: "Original title", it: "Titolo originale", pt: "Título original", fr: "Titre original", de: "Originaltitel" },
  error_audio:       { es: "No se pudo reproducir este audio", en: "This audio couldn't be played", it: "Impossibile riprodurre questo audio", pt: "Não foi possível tocar este áudio", fr: "Impossible de lire cet audio", de: "Audio konnte nicht abgespielt werden" },
  temporizador_off:  { es: "Temporizador apagado", en: "Sleep timer off", it: "Timer disattivato", pt: "Temporizador desligado", fr: "Minuterie désactivée", de: "Timer aus" },
  temporizador_on:   { es: "La música se detiene en {n} min", en: "Music stops in {n} min", it: "La musica si ferma tra {n} min", pt: "A música para em {n} min", fr: "La musique s'arrête dans {n} min", de: "Musik stoppt in {n} Min." },
  minimizar:         { es: "Minimizar (sigue sonando)", en: "Minimize (keeps playing)", it: "Riduci (continua a suonare)", pt: "Minimizar (continua tocando)", fr: "Réduire (continue la lecture)", de: "Minimieren (spielt weiter)" },
  cerrar:            { es: "Cerrar y detener", en: "Close and stop", it: "Chiudi e ferma", pt: "Fechar e parar", fr: "Fermer et arrêter", de: "Schließen und stoppen" },
  conectar:          { es: "Conectar a un dispositivo", en: "Connect to a device", it: "Collega a un dispositivo", pt: "Conectar a um dispositivo", fr: "Connecter à un appareil", de: "Mit einem Gerät verbinden" },
  conectar_bt:       { es: "Conectá tu parlante o auriculares Bluetooth desde los ajustes del celular: la música sale por ahí sola.", en: "Pair your Bluetooth speaker or headphones from your phone settings: the music will play through them.", it: "Collega cassa o cuffie Bluetooth dalle impostazioni del telefono: la musica uscirà da lì.", pt: "Conecte sua caixa de som ou fone Bluetooth nas configurações do celular: a música sai por ali.", fr: "Connectez votre enceinte ou casque Bluetooth depuis les réglages du téléphone : la musique sortira par là.", de: "Verbinde Lautsprecher oder Kopfhörer per Bluetooth in den Handy-Einstellungen: Die Musik läuft dann darüber." },
  conectado:         { es: "Conectado a {nombre}", en: "Connected to {nombre}", it: "Collegato a {nombre}", pt: "Conectado a {nombre}", fr: "Connecté à {nombre}", de: "Verbunden mit {nombre}" },
  desconectado:      { es: "Se volvió a este dispositivo", en: "Back on this device", it: "Tornato su questo dispositivo", pt: "Voltou para este dispositivo", fr: "Retour sur cet appareil", de: "Wieder auf diesem Gerät" },
  sin_letra:         { es: "Este canto todavía no tiene la letra cargada.", en: "This song doesn't have lyrics yet.", it: "Questo brano non ha ancora il testo.", pt: "Esta música ainda não tem a letra.", fr: "Ce titre n'a pas encore de paroles.", de: "Für diesen Titel gibt es noch keinen Text." },
  himno_n:           { es: "Himno {n}", en: "Hymn {n}", it: "Inno {n}", pt: "Hino {n}", fr: "Cantique {n}", de: "Lied {n}" },
  repetir_off:       { es: "Sin repetir", en: "Repeat off", it: "Ripetizione disattivata", pt: "Sem repetir", fr: "Répétition désactivée", de: "Wiederholen aus" },
  repetir_todo:      { es: "🔁 En bucle: se repite toda la lista", en: "🔁 Looping the whole list", it: "🔁 In loop: si ripete tutta la lista", pt: "🔁 Em loop: repete a lista toda", fr: "🔁 En boucle : toute la liste se répète", de: "🔁 Endlosschleife: ganze Liste wiederholen" },
  repetir_uno:       { es: "🔂 Se repite solo este canto", en: "🔂 Repeating this song only", it: "🔂 Si ripete solo questo brano", pt: "🔂 Repete só esta música", fr: "🔂 Seul ce titre se répète", de: "🔂 Nur dieser Titel wird wiederholt" },
  aleatorio_on:      { es: "🔀 Aleatorio activado", en: "🔀 Shuffle on", it: "🔀 Casuale attivato", pt: "🔀 Aleatório ativado", fr: "🔀 Lecture aléatoire activée", de: "🔀 Zufallswiedergabe an" },
  aleatorio_off:     { es: "Aleatorio desactivado", en: "Shuffle off", it: "Casuale disattivato", pt: "Aleatório desativado", fr: "Lecture aléatoire désactivée", de: "Zufallswiedergabe aus" }
};

function tRp(key, vars = {}, lang = idiomaActual) {
  const entry = RP_LABELS[key];
  let texto = entry ? conFallbackIdioma(entry, lang) : key;
  Object.keys(vars).forEach(k => { texto = texto.split(`{${k}}`).join(vars[k]); });
  return texto;
}

// ===================== ÍCONOS (SVG propios: fontawesome-min.css trae muy pocos) =====================
const RP_ICONOS = {
  play:     "M8 5.14v13.72a1 1 0 0 0 1.5.86l11-6.86a1 1 0 0 0 0-1.72l-11-6.86A1 1 0 0 0 8 5.14z",
  pause:    "M6 4h4v16H6zM14 4h4v16h-4z",
  next:     "M5 5.5v13a1 1 0 0 0 1.55.83L16 13v6h2V5h-2v6L6.55 4.67A1 1 0 0 0 5 5.5z",
  prev:     "M19 5.5v13a1 1 0 0 1-1.55.83L8 13v6H6V5h2v6l9.45-6.33A1 1 0 0 1 19 5.5z",
  shuffle:  "M10.59 9.17 5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z",
  repeat:   "M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z",
  repeat1:  "M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4zm-4-2V9h-1l-2 1v1h1.5v4H13z",
  down:     "M7.41 8.59 12 13.17l4.59-4.58L18 10l-6 6-6-6z",
  back:     "M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z",
  close:    "M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z",
  more:     "M6 10a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm6 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm6 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4z",
  plus:     "M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6z",
  addCirc:  "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 1.8a8.2 8.2 0 1 1 0 16.4 8.2 8.2 0 0 1 0-16.4zM11.1 7.5v3.6H7.5v1.8h3.6v3.6h1.8v-3.6h3.6v-1.8h-3.6V7.5z",
  check:    "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm-1.4 14.2-4.2-4.2 1.4-1.4 2.8 2.8 5.8-5.8 1.4 1.4z",
  search:   "M15.5 14h-.79l-.28-.27A6.47 6.47 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z",
  mic:      "M12 14a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V21h2v-3.08A7 7 0 0 0 19 11h-2z",
  nota:     "M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z",
  altavoz:  "M17 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2zm-5 2a2 2 0 1 1 0 4 2 2 0 0 1 0-4zm0 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm0-6a2 2 0 1 0 0 4 2 2 0 0 0 0-4z",
  letraIco: "M4 6h16v2H4zm0 5h16v2H4zm0 5h10v2H4z",
  luna:     "M12 3a9 9 0 1 0 9 9c0-.46-.04-.92-.1-1.36a5.39 5.39 0 0 1-4.4 2.26 5.4 5.4 0 0 1-3.14-9.8c-.44-.06-.9-.1-1.36-.1z",
  libro:    "M4 6H2v14a2 2 0 0 0 2 2h14v-2H4V6zm16-4H8a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2zm0 14H8V4h12v12z",
  trash:    "M6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z",
  edit:     "M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z",
  arriba:   "M7 14l5-5 5 5z",
  abajo:    "M7 10l5 5 5-5z",
  menos:    "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm5 11H7v-2h10v2z"
};

function rpIcono(nombre, clase = "") {
  return `<svg class="rp-ico ${clase}" viewBox="0 0 24 24" aria-hidden="true"><path d="${RP_ICONOS[nombre]}"/></svg>`;
}

// ===================== ESTADO =====================
const rpAudio = new Audio();
rpAudio.preload = "metadata";
// AirPlay (iPhone/Mac) y Chromecast (Remote Playback) trabajan sobre un
// <audio> que esté en la página: se agrega oculto, sin controles (no hay
// menú de descarga)
rpAudio.setAttribute("x-webkit-airplay", "allow");
rpAudio.hidden = true;
document.addEventListener("DOMContentLoaded", () => document.body.appendChild(rpAudio));

const rp = {
  cola: [],              // ids de canciones en el orden en que van a sonar
  idx: -1,               // posición actual en la cola
  origen: null,          // { tipo: "libro"|"playlist", id } de donde salió la cola
  version: localStorage.getItem("rpVersion") || "vocal",   // "vocal" | "playback"
  repetir: localStorage.getItem("rpRepetir") || "todo",    // "off" | "todo" (en bucle) | "uno"
  aleatorio: false,
  filtro: "todo",        // biblioteca: "todo" | "playlists" | "libros"
  coleccion: null,       // { tipo: "libro"|"playlist", id } abierta, o null = biblioteca
  busqueda: "",
  sonandoAbierto: false, // pantalla completa de "reproduciendo"
  sheet: null,           // menú ⋯ abierto: { modo: "cancion"|"agregar"|"playlist", songId?, playlistId?, idx? }
  timer: null,
  timerFin: 0
};

let misPlaylists = {};

function cargarPlaylistsStorage() {
  try {
    misPlaylists = JSON.parse(localStorage.getItem("misPlaylists") || "{}");
  } catch {
    misPlaylists = {};
  }
}

function guardarPlaylists() {
  localStorage.setItem("misPlaylists", JSON.stringify(misPlaylists));
}

// ===================== CATÁLOGO (canciones con mp3, por libro) =====================
// idioma en el que se toma la canción (título, letra, número): el fijo del
// libro (himnarios), o el activo de la app si la canción lo tiene, o el
// primero que tenga. null = la canción no tiene audio (ver js/audios.js)
function rpIdiomaDe(song, libro) {
  const idiomas = Object.keys(song.idiomas || {});
  const lang = libro?.idiomaFijo && song.idiomas?.[libro.idiomaDefault]
    ? libro.idiomaDefault
    : song.idiomas?.[idiomaActual] ? idiomaActual : idiomas[0];

  if (!lang || !getMp3Urls(song, lang, libro?.id).length) return null;
  return lang;
}

// ids de todo lo que suena en un libro: sus cantos con mp3 + los mp3 que
// no tienen canto en el .json ("mp3:libro:clave", ver getAudiosHuerfanos).
// Himnarios: por número. Resto (ej. Cancionero MV): alfabético, con el
// mismo criterio que el índice de la app (sin "¡¿", comillas ni acentos)
function rpIdsDeLibro(libroId) {
  const libro = LIBROS.find(l => l.id === libroId);
  const numDe = n => (/^\d+$/.test(String(n ?? "").trim()) ? Number(n) : Infinity);

  const cantos = getLibroSongs(libroId)
    .filter(s => s?.id && rpIdiomaDe(s, libro))
    .map(s => {
      const lang = rpIdiomaDe(s, libro);
      return { id: s.id, n: numDe(s.idiomas?.[lang]?.numero_himno), titulo: getSongTitle(s, lang) };
    });

  const sueltos = getAudiosHuerfanos(libroId)
    .map(h => ({ id: `mp3:${libroId}:${h.clave}`, n: numDe(h.clave), titulo: rpTituloDeArchivo(h.clave) }));

  const todos = cantos.concat(sueltos);

  if (libro?.numeroHimno) {
    todos.sort((a, b) => a.n - b.n);
  } else {
    todos.sort((a, b) => {
      const ta = cleanTitleForIndex(a.titulo) || " ";
      const tb = cleanTitleForIndex(b.titulo) || " ";
      return naturalSort(ta, tb);
    });
  }
  return todos.map(x => x.id);
}

// mp3 sin canto: "bienvenidos_a_la_casa" → "Bienvenidos a la casa"
function rpTituloDeArchivo(clave) {
  const t = clave.replace(/[_-]+/g, " ").trim();
  return t.charAt(0).toUpperCase() + t.slice(1);
}

function rpTrackHuerfano(trackId) {
  const [, libroId, ...resto] = trackId.split(":");
  const clave = resto.join(":");
  const libro = LIBROS.find(l => l.id === libroId);
  const h = getAudiosHuerfanos(libroId).find(x => x.clave === clave);

  if (!h) {
    // si después se cargó el canto en el .json, la playlist sigue andando con él
    const cfg = AUDIOS_CFG?.libros?.[libroId];
    const song = cfg && getLibroSongs(libroId).find(s => claveAudioDeCancion(s, cfg, libro) === clave);
    return song ? rpTrack(song.id) : null;
  }

  const numerico = /^\d+$/.test(clave);
  const numero = numerico ? String(Number(clave)) : "";
  const titulo = numerico ? tRp("himno_n", { n: numero }) : rpTituloDeArchivo(clave);

  return {
    song: { id: trackId, idiomas: {} },
    libro, lang: null, data: {}, numero, titulo,
    tituloCompleto: titulo,
    subtitulo: libro?.nombre || "",
    mp3s: [h.vocal, h.playback].filter(Boolean),
    huerfano: true
  };
}

// cuando termina de llegar la lista de audios de GitHub, se redibuja
document.addEventListener("audios-listos", () => {
  if (rpModalAbierto()) rpRender();
});

function rpLibrosConAudio() {
  return getLibrosVisiblesOrdenados().filter(l => rpIdsDeLibro(l.id).length);
}

// datos de una canción listos para mostrar
function rpTrack(songId) {
  if (String(songId).startsWith("mp3:")) return rpTrackHuerfano(songId);

  const song = getSongPorIdRapido(songId);
  if (!song) return null;

  const libroId = getLibroIdDeSong(song);
  const libro = LIBROS.find(l => l.id === libroId);
  const lang = rpIdiomaDe(song, libro);
  if (!lang) return null;

  const data = song.idiomas[lang];
  const numero = data.numero_himno || "";
  const titulo = getSongTitle(song, lang);
  const autores = rpPersonas(song.autor);

  return {
    song, libro, lang, data, numero, titulo,
    tituloCompleto: numero ? `${numero} - ${titulo}` : titulo,
    subtitulo: autores.join(", ") || libro?.nombre || "",
    mp3s: getMp3Urls(song, lang, libroId)
  };
}

// campo de personas/valores → array limpio (sin vacíos ni "-")
function rpLista(v) {
  return normalizeArrayField(v).map(x => (x || "").toString().trim()).filter(x => x && x !== "-");
}

// personas: además sin "Desconocido" (no aporta nada en créditos ni debajo del título)
function rpPersonas(v) {
  return rpLista(v).filter(x => normalize(x) !== "DESCONOCIDO");
}

function rpEsPlayback(url) {
  return /playback|instrumental|pista/i.test(url);
}

// url a reproducir según la versión preferida (si existe esa versión)
function rpUrlSegunVersion(mp3s) {
  if (mp3s.length < 2) return mp3s[0];
  const quiere = rp.version === "playback";
  return mp3s.find(u => rpEsPlayback(u) === quiere) || mp3s[0];
}

function rpEnAlgunaPlaylist(songId) {
  return Object.values(misPlaylists).some(pl => pl.songIds.includes(songId));
}

// ===================== PORTADAS Y COLORES =====================
const rpPortadas = new Map(); // url → Promise<{ img, album, color } | null>

// pide los primeros n bytes del archivo. Con Range el servidor manda solo eso;
// si lo ignora y manda el archivo entero, se corta la descarga apenas alcanza
async function rpLeerBytes(url, n) {
  const res = await fetch(url, { headers: { Range: `bytes=0-${n - 1}` } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const reader = res.body.getReader();
  const out = new Uint8Array(n);
  let leidos = 0;

  while (leidos < n) {
    const { done, value } = await reader.read();
    if (done) break;
    const cuanto = Math.min(value.length, n - leidos);
    out.set(value.subarray(0, cuanto), leidos);
    leidos += cuanto;
  }

  reader.cancel().catch(() => {});
  return out.subarray(0, leidos);
}

function rpSynchsafe(b, i) {
  return (b[i] << 21) | (b[i + 1] << 14) | (b[i + 2] << 7) | b[i + 3];
}

function rpTextoId3(bytes) {
  const enc = bytes[0];
  const decoder = new TextDecoder(enc === 1 ? "utf-16" : enc === 2 ? "utf-16be" : enc === 3 ? "utf-8" : "latin1");
  return decoder.decode(bytes.subarray(1)).replace(/\0+$/, "").split("\0")[0].trim();
}

function rpParsearId3(b) {
  const ver = b[3];
  const flags = b[5];
  let pos = 10;
  const fin = 10 + rpSynchsafe(b, 6);

  // extended header (raro): se saltea
  if (flags & 0x40) pos += ver === 4 ? rpSynchsafe(b, 10) : 4 + ((b[10] << 24) | (b[11] << 16) | (b[12] << 8) | b[13]);

  const res = { img: null, album: "" };
  const idLen = ver === 2 ? 3 : 4;
  const cabecera = ver === 2 ? 6 : 10;

  while (pos + cabecera <= Math.min(fin, b.length)) {
    const id = String.fromCharCode(...b.subarray(pos, pos + idLen));
    if (!/^[A-Z0-9]+$/.test(id)) break; // padding

    let size;
    if (ver === 2) size = (b[pos + 3] << 16) | (b[pos + 4] << 8) | b[pos + 5];
    else if (ver === 4) size = rpSynchsafe(b, pos + 4);
    else size = (b[pos + 4] << 24) | (b[pos + 5] << 16) | (b[pos + 6] << 8) | b[pos + 7];

    let datos = b.subarray(pos + cabecera, pos + cabecera + size);
    // v2.4 con "data length indicator": 4 bytes extra antes de los datos
    if (ver === 4 && (b[pos + 9] & 0x01)) datos = datos.subarray(4);

    if ((id === "TALB" || id === "TAL") && !res.album) {
      res.album = rpTextoId3(datos);
    }

    if ((id === "APIC" || id === "PIC") && !res.img) {
      const enc = datos[0];
      let i;
      let mime;

      if (ver === 2) {
        const fmt = String.fromCharCode(...datos.subarray(1, 4)).toLowerCase();
        mime = fmt === "png" ? "image/png" : "image/jpeg";
        i = 4;
      } else {
        const finMime = datos.indexOf(0, 1);
        mime = String.fromCharCode(...datos.subarray(1, finMime)) || "image/jpeg";
        if (!mime.includes("/")) mime = `image/${mime.toLowerCase() === "png" ? "png" : "jpeg"}`;
        i = finMime + 1;
      }

      i += 1; // tipo de imagen (portada, contraportada, etc.)

      // descripción terminada en 0 (o en 00 si es UTF-16)
      if (enc === 1 || enc === 2) {
        while (i + 1 < datos.length && !(datos[i] === 0 && datos[i + 1] === 0)) i += 2;
        i += 2;
      } else {
        while (i < datos.length && datos[i] !== 0) i++;
        i += 1;
      }

      res.img = URL.createObjectURL(new Blob([datos.subarray(i)], { type: mime }));
    }

    if (res.img && res.album) break;
    pos += cabecera + size;
  }

  return res;
}

// color dominante (promedio, oscurecido) de una imagen — para el degradé de fondo
function rpColorDeImagen(src) {
  return new Promise(resolve => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const c = document.createElement("canvas");
        c.width = c.height = 16;
        const ctx = c.getContext("2d");
        ctx.drawImage(img, 0, 0, 16, 16);
        const px = ctx.getImageData(0, 0, 16, 16).data;
        let r = 0, g = 0, b = 0;
        for (let i = 0; i < px.length; i += 4) { r += px[i]; g += px[i + 1]; b += px[i + 2]; }
        const n = px.length / 4;
        resolve(rpColorOscuro(r / n, g / n, b / n));
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function rpColorOscuro(r, g, b) {
  // lleva el color a un tono con saturación y oscuridad "tipo Spotify"
  const max = Math.max(r, g, b) / 255, min = Math.min(r, g, b) / 255;
  let h = 0;
  const d = max - min;
  if (d) {
    if (max === r / 255) h = ((g - b) / 255 / d) % 6;
    else if (max === g / 255) h = (b - r) / 255 / d + 2;
    else h = (r - g) / 255 / d + 4;
  }
  h = Math.round(h * 60 + 360) % 360;
  const s = d ? Math.max(35, Math.min(70, (d / (1 - Math.abs(max + min - 1))) * 100)) : 0;
  return `hsl(${h}, ${Math.round(s)}%, 32%)`;
}

// color fijo por libro/playlist (para tapas generadas), derivado del nombre
function rpColorPorTexto(texto = "") {
  let h = 0;
  for (const ch of texto) h = (h * 31 + ch.charCodeAt(0)) % 360;
  return `hsl(${h}, 55%, 34%)`;
}

function rpLeerPortada(url) {
  if (!url) return Promise.resolve(null);
  if (rpPortadas.has(url)) return rpPortadas.get(url);

  const promesa = (async () => {
    try {
      const head = await rpLeerBytes(url, 10);
      if (head.length < 10 || head[0] !== 0x49 || head[1] !== 0x44 || head[2] !== 0x33) return null; // "ID3"

      const total = 10 + rpSynchsafe(head, 6);
      if (total > 4 * 1024 * 1024) return null; // tag gigante: no vale la pena

      const res = rpParsearId3(await rpLeerBytes(url, total));
      if (res.img) res.color = await rpColorDeImagen(res.img);
      return res;
    } catch (err) {
      console.warn("No se pudo leer la portada del mp3:", url, err);
      return null;
    }
  })();

  rpPortadas.set(url, promesa);
  return promesa;
}

// tapa generada (estilo "playlist" de Spotify): degradé + marca/nombre
function rpTapaHtml(texto, sub, color, extraClase = "") {
  return `
    <div class="rp-tapa ${extraClase}" style="--tapa:${color}">
      <span class="rp-tapa-marca">${escapeHtml(texto)}</span>
      ${sub ? `<span class="rp-tapa-sub">${escapeHtml(sub)}</span>` : ""}
    </div>
  `;
}

function rpTapaLibroHtml(libro, extraClase = "") {
  if (libro?.portada) {
    return `<div class="rp-tapa ${extraClase}"><img src="${escapeHtml(libro.portada)}" alt=""></div>`;
  }
  return rpTapaHtml(libro?.marca || (libro?.nombre || "?").slice(0, 2), libro?.nombre || "", rpColorPorTexto(libro?.id), extraClase);
}

function rpTapaPlaylistHtml(pl, plId, extraClase = "") {
  return `
    <div class="rp-tapa rp-tapa-playlist ${extraClase}" style="--tapa:${rpColorPorTexto(plId + pl.name)}">
      ${rpIcono("nota", "rp-tapa-ico")}
    </div>
  `;
}

function rpColorLibro(libro) {
  return rpColorPorTexto(libro?.id);
}

// ===================== ABRIR / CERRAR =====================
function abrirReproductor() {
  if (typeof closeMenu === "function") closeMenu();

  const modal = document.getElementById("reproductorModal");
  if (!modal) return;

  rpTraducirFijos();
  rpRender();
  modal.style.display = "block";
  rpPushHistorial();
  refrescarAudios(); // si hay mp3 nuevos en GitHub, se redibuja solo (ver js/audios.js)
  rpActualizarMiniFlotante();
}

// botón 🎧 mp3 de la ficha de un canto: abre el reproductor directo en ese
// canto (pantalla "reproduciendo", con Con voz / Pista si hay las dos), y
// la cola sigue con el resto de su libro, como un álbum en Spotify
function rpReproducirCancion(songId) {
  const song = getSongPorIdRapido(songId);
  const libroId = song && getLibroIdDeSong(song);
  if (!libroId || !rpTrack(songId)?.mp3s.length) return;

  rp.coleccion = { tipo: "libro", id: libroId };
  rp.busqueda = "";
  rp.sheet = null;
  rp.sonandoAbierto = true;

  if (rp.cola[rp.idx] !== songId) {
    const ids = rpIdsDeLibro(libroId);
    rpReproducirLista(ids.includes(songId) ? ids : [songId], songId, false, { tipo: "libro", id: libroId });
  } else if (rpAudio.paused) {
    rpAudio.play().catch(() => {});
  }

  abrirReproductor();
  const s = document.getElementById("rpSonando");
  if (s) s.scrollTop = 0;
}

// sigue sonando: solo se oculta el modal y aparece la barrita flotante
function minimizarReproductor() {
  const modal = document.getElementById("reproductorModal");
  if (modal) modal.style.display = "none";
  rp.sheet = null;
  rpSacarHistorial();
  rpActualizarMiniFlotante();
}

// ===================== BOTÓN "ATRÁS" DEL CELULAR =====================
// mientras el reproductor está abierto hay una entrada extra en el
// historial: "atrás" no saca de la app, sino que retrocede un paso adentro
// del reproductor (cierra el menú ⋯ → baja "reproduciendo" → vuelve a la
// biblioteca → minimiza), como en Spotify
let rpEnHistorial = false;

function rpPushHistorial() {
  if (rpEnHistorial) return;
  history.pushState({ rpModal: true }, "");
  rpEnHistorial = true;
}

function rpSacarHistorial() {
  if (!rpEnHistorial) return;
  rpEnHistorial = false;
  history.back(); // el popstate que dispara se ignora (rpEnHistorial ya es false)
}

window.addEventListener("popstate", () => {
  if (!rpEnHistorial) return;
  rpEnHistorial = false;
  if (!rpModalAbierto()) return;

  if (rp.sheet) rpCerrarSheet();
  else if (rp.sonandoAbierto) rpCerrarSonando();
  else if (rp.coleccion) rpAbrirColeccion(null, null);
  else {
    minimizarReproductor();
    return;
  }
  rpPushHistorial();
});

// ===================== SIN DESCARGAS =====================
// el audio no tiene controles nativos (no hay "Descargar" ni "Guardar
// audio como…"); acá además se bloquea el menú del clic derecho / toque
// largo y el arrastre de las portadas en todo el reproductor
["contextmenu", "dragstart"].forEach(tipo => {
  document.addEventListener(tipo, e => {
    if (e.target.closest?.("#reproductorModal, #rpFlotante")) e.preventDefault();
  });
});

function cerrarReproductor() {
  rp.idx = -1;   // antes de vaciar el src, para que el evento "error" no salte al siguiente
  rp.cola = [];
  rp.origen = null;
  rp.sonandoAbierto = false;
  rp.sheet = null;
  rpAudio.pause();
  rpAudio.removeAttribute("src");
  rpAudio.load();
  rpCancelarTimer();
  if ("mediaSession" in navigator) navigator.mediaSession.metadata = null;

  const modal = document.getElementById("reproductorModal");
  if (modal) modal.style.display = "none";
  rpSacarHistorial();
  rpActualizarMiniFlotante();
}

function rpModalAbierto() {
  const modal = document.getElementById("reproductorModal");
  return !!modal && modal.style.display === "block";
}

function rpTraducirFijos() {
  const menu = document.getElementById("txtMisPlaylists");
  if (menu) menu.textContent = tRp("titulo");
  if (rpModalAbierto()) rpRender();
}

// ===================== REPRODUCCIÓN =====================
// arranca a sonar una lista de canciones desde la canción "desdeId"
function rpReproducirLista(ids, desdeId = null, mezclar = false, origen = null) {
  const validos = ids.filter(id => rpTrack(id)?.mp3s.length);
  if (!validos.length) return;

  let cola = [...validos];
  let inicio = desdeId ? Math.max(0, validos.indexOf(desdeId)) : 0;

  if (mezclar) {
    rp.colaOriginal = [...validos];
    cola = rpMezclar(cola);
    inicio = 0;
  }

  rp.aleatorio = mezclar;
  rp.cola = cola;
  rp.origen = origen;
  rpCargar(inicio, true);
}

function rpMezclar(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function rpCargar(idx, reproducir = true, mantenerTiempo = false) {
  const track = rpTrack(rp.cola[idx]);
  if (!track) return;

  rp.idx = idx;
  const url = rpUrlSegunVersion(track.mp3s);
  const tiempo = mantenerTiempo ? rpAudio.currentTime : 0;

  if (rpAudio.src !== new URL(url, location.href).href) {
    rpAudio.src = url;
    if (tiempo) rpAudio.addEventListener("loadedmetadata", () => { rpAudio.currentTime = tiempo; }, { once: true });
  }

  if (reproducir) rpAudio.play().catch(() => {});

  rpRender();
  rpActualizarMediaSession(track, url);
  rpActualizarMiniFlotante();
}

function rpTogglePlay() {
  if (rp.idx < 0) return;
  if (rpAudio.paused) rpAudio.play().catch(() => {});
  else rpAudio.pause();
}

function rpSiguiente(automatico = false) {
  if (!rp.cola.length) return;

  if (automatico && rp.repetir === "uno") {
    rpAudio.currentTime = 0;
    rpAudio.play().catch(() => {});
    return;
  }

  let sig = rp.idx + 1;
  if (sig >= rp.cola.length) {
    if (automatico && rp.repetir === "off") {
      rpAudio.pause();
      rpAudio.currentTime = 0;
      rpRender();
      return;
    }
    sig = 0;
  }
  rpCargar(sig, true);
}

// como Spotify: si ya pasaron unos segundos, "anterior" vuelve al principio del tema
function rpAnterior() {
  if (!rp.cola.length) return;
  if (rpAudio.currentTime > 4) {
    rpAudio.currentTime = 0;
    return;
  }
  rpCargar(rp.idx > 0 ? rp.idx - 1 : rp.cola.length - 1, true);
}

// como Spotify: al activarlo mezcla lo que falta (el tema actual sigue
// sonando); al desactivarlo vuelve al orden original desde el tema actual
function rpToggleAleatorio() {
  if (!rp.cola.length) return;
  const actual = rp.cola[rp.idx];
  rp.aleatorio = !rp.aleatorio;

  if (rp.aleatorio) {
    rp.colaOriginal = [...rp.cola];
    const resto = rpMezclar(rp.cola.filter((_, i) => i !== rp.idx));
    rp.cola = [actual, ...resto];
    rp.idx = 0;
  } else if (rp.colaOriginal?.includes(actual)) {
    rp.cola = rp.colaOriginal;
    rp.idx = rp.cola.indexOf(actual);
  }

  showToast(tRp(rp.aleatorio ? "aleatorio_on" : "aleatorio_off"));
  rpRender();
}

// sin repetir → en bucle (repite toda la lista) → repite solo este canto
function rpCiclarRepetir() {
  rp.repetir = rp.repetir === "off" ? "todo" : rp.repetir === "todo" ? "uno" : "off";
  localStorage.setItem("rpRepetir", rp.repetir);
  showToast(tRp(`repetir_${rp.repetir}`));
  rpRender();
}

// cambia entre "con voz" y "pista" sin perder el punto donde iba el tema
function rpCambiarVersion(version) {
  if (rp.version === version) return;
  rp.version = version;
  localStorage.setItem("rpVersion", version);
  if (rp.idx >= 0) rpCargar(rp.idx, !rpAudio.paused, true);
  else rpRender();
}

function rpSeek(valor) {
  if (!isFinite(rpAudio.duration)) return;
  rpAudio.currentTime = (Number(valor) / 1000) * rpAudio.duration;
  rpActualizarProgreso();
}

// temporizador para dormir: cada toque pasa a 15 → 30 → 60 min → apagado
function rpCiclarTimer() {
  const opciones = [15, 30, 60];
  const restante = rp.timer ? Math.round((rp.timerFin - Date.now()) / 60000) : 0;
  const siguiente = opciones.find(m => m > restante);

  rpCancelarTimer();

  if (siguiente) {
    rp.timerFin = Date.now() + siguiente * 60000;
    rp.timer = setTimeout(() => {
      rpAudio.pause();
      rpCancelarTimer();
      rpRender();
    }, siguiente * 60000);
    showToast(tRp("temporizador_on", { n: siguiente }));
  } else {
    showToast(tRp("temporizador_off"));
  }
  rpRender();
}

function rpCancelarTimer() {
  clearTimeout(rp.timer);
  rp.timer = null;
  rp.timerFin = 0;
}

function rpFormatoTiempo(seg) {
  if (!isFinite(seg) || seg < 0) return "0:00";
  const m = Math.floor(seg / 60);
  const s = Math.floor(seg % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

// controles de la pantalla bloqueada / notificación del celular / auriculares
function rpActualizarMediaSession(track, url) {
  if (!("mediaSession" in navigator)) return;

  const base = {
    title: track.tituloCompleto,
    artist: track.subtitulo,
    album: track.libro?.nombre || "",
    artwork: [{ src: "imagenes/icons/icon-512.png", sizes: "512x512", type: "image/png" }]
  };

  navigator.mediaSession.metadata = new MediaMetadata(base);

  rpLeerPortada(url).then(p => {
    if (p?.img && rp.cola[rp.idx] === track.song.id) {
      navigator.mediaSession.metadata = new MediaMetadata({ ...base, artwork: [{ src: p.img }] });
    }
  });
}

if ("mediaSession" in navigator) {
  navigator.mediaSession.setActionHandler("play", () => rpAudio.play());
  navigator.mediaSession.setActionHandler("pause", () => rpAudio.pause());
  navigator.mediaSession.setActionHandler("previoustrack", () => rpAnterior());
  navigator.mediaSession.setActionHandler("nexttrack", () => rpSiguiente());
  try {
    navigator.mediaSession.setActionHandler("seekto", e => { rpAudio.currentTime = e.seekTime; });
  } catch { /* navegadores viejos */ }
}

rpAudio.addEventListener("ended", () => rpSiguiente(true));
rpAudio.addEventListener("play", rpActualizarEstadoPlay);
rpAudio.addEventListener("pause", rpActualizarEstadoPlay);
rpAudio.addEventListener("timeupdate", rpActualizarProgreso);
rpAudio.addEventListener("loadedmetadata", rpActualizarProgreso);
rpAudio.addEventListener("error", () => {
  if (rp.idx < 0 || !rpAudio.src) return;
  showToast(tRp("error_audio"));
  if (rp.cola.length > 1) setTimeout(() => rpSiguiente(), 1500);
});

// ===================== PLAYLISTS =====================
// crea una playlist (con nombre sugerido, como Spotify) y opcionalmente le agrega una canción
function rpCrearPlaylist(songId = null) {
  const n = Object.keys(misPlaylists).length + 1;
  const nombre = prompt(tRp("nombre_playlist"), tRp("nombre_default", { n }));
  if (nombre === null || !nombre.trim()) return;

  const id = "p" + Date.now();
  misPlaylists[id] = { name: nombre.trim(), songIds: songId ? [songId] : [] };
  guardarPlaylists();

  rp.sheet = null;
  if (songId) {
    showToast(tRp("agregada", { nombre: nombre.trim() }));
  } else {
    rp.coleccion = { tipo: "playlist", id };
    rp.busqueda = "";
  }
  rpRender();
}

function rpAgregarAPlaylist(playlistId, songId) {
  const pl = misPlaylists[playlistId];
  if (!pl || !songId) return;

  if (pl.songIds.includes(songId)) {
    showToast(tRp("ya_estaba", { nombre: pl.name }));
  } else {
    pl.songIds.push(songId);
    guardarPlaylists();
    showToast(tRp("agregada", { nombre: pl.name }));
  }

  rp.sheet = null;
  rpRender();
}

function rpQuitarDePlaylist(playlistId, songId) {
  const pl = misPlaylists[playlistId];
  if (!pl) return;
  pl.songIds = pl.songIds.filter(id => id !== songId);
  guardarPlaylists();
  rp.sheet = null;
  rpRender();
}

function rpMoverEnPlaylist(playlistId, idx, delta) {
  const pl = misPlaylists[playlistId];
  const destino = idx + delta;
  rp.sheet = null;
  if (!pl || destino < 0 || destino >= pl.songIds.length) return rpRender();
  [pl.songIds[idx], pl.songIds[destino]] = [pl.songIds[destino], pl.songIds[idx]];
  guardarPlaylists();
  rpRender();
}

function rpRenombrarPlaylist(playlistId) {
  const pl = misPlaylists[playlistId];
  rp.sheet = null;
  if (!pl) return rpRender();
  const nuevo = prompt(tRp("nombre_playlist"), pl.name);
  if (nuevo !== null && nuevo.trim()) {
    pl.name = nuevo.trim();
    guardarPlaylists();
  }
  rpRender();
}

function rpEliminarPlaylist(playlistId) {
  const pl = misPlaylists[playlistId];
  rp.sheet = null;
  if (!pl) return rpRender();
  if (confirm(tRp("confirm_eliminar", { nombre: pl.name }))) {
    delete misPlaylists[playlistId];
    guardarPlaylists();
    if (rp.coleccion?.id === playlistId) rp.coleccion = null;
  }
  rpRender();
}

// ===================== NAVEGACIÓN =====================
function rpElegirFiltro(filtro) {
  rp.filtro = filtro;
  rpRender();
}

function rpAbrirColeccion(tipo, id) {
  rp.coleccion = tipo ? { tipo, id } : null;
  rp.busqueda = "";
  rpRender();
  const body = document.getElementById("rpBody");
  if (body) body.scrollTop = 0;
}

function rpBuscar(valor) {
  rp.busqueda = valor;
  rpRenderFilasColeccion();
}

function rpAbrirSonando() {
  if (rp.idx < 0) return;
  rp.sonandoAbierto = true;
  rpRender();
  const s = document.getElementById("rpSonando");
  if (s) s.scrollTop = 0;
}

function rpCerrarSonando() {
  rp.sonandoAbierto = false;
  rpRender();
}

function rpAbrirSheet(modo, songId = null, playlistId = null, idx = null) {
  rp.sheet = { modo, songId, playlistId, idx };
  rpRenderSheet();
}

function rpCerrarSheet() {
  rp.sheet = null;
  rpRenderSheet();
}

function rpAbrirEnCancionero(songId) {
  const id = songId || rp.cola[rp.idx];
  if (!id) return;
  rp.sheet = null;
  rp.sonandoAbierto = false;
  minimizarReproductor();
  openSong(id);
}

// ids de la colección abierta, filtrados por la búsqueda
function rpIdsColeccion(conBusqueda = true) {
  const col = rp.coleccion;
  if (!col) return [];

  let ids = col.tipo === "libro"
    ? rpIdsDeLibro(col.id)
    : (misPlaylists[col.id]?.songIds || []).filter(id => rpTrack(id));

  const q = conBusqueda ? normalize(rp.busqueda.trim()) : "";
  if (q) {
    // primero los que coinciden en número o título, después el resto
    // (letra, autor, compositor, temas…), como el buscador principal
    const porTitulo = [];
    const porOtros = [];
    ids.forEach(id => {
      const tr = rpTrack(id);
      if (!tr) return;
      if (String(tr.numero) === q || normalize(tr.titulo).includes(q)) porTitulo.push(id);
      else if (rpTextoBusqueda(tr).includes(q)) porOtros.push(id);
    });
    ids = porTitulo.concat(porOtros);
  }
  return ids;
}

// texto buscable de un canto: el mismo del buscador principal
// (buildSearchText en utils.js: títulos, letra sin acordes, autor,
// compositor, traductor, ritmo, temas…), calculado una sola vez
const _rpTextoBusqueda = new Map();

function rpTextoBusqueda(tr) {
  if (tr.huerfano) return normalize(tr.titulo);
  let texto = _rpTextoBusqueda.get(tr.song.id);
  if (texto === undefined) {
    texto = buildSearchText(tr.song);
    _rpTextoBusqueda.set(tr.song.id, texto);
  }
  return texto;
}

// si la búsqueda aparece en la letra, el renglón donde está (para mostrarlo
// debajo del título en vez del autor)
function rpRenglonQueCoincide(tr, q) {
  if (!q || tr.huerfano || normalize(tr.titulo).includes(q)) return "";
  const lineas = normalizeArrayField(tr.data.letra).map(l => stripChords(l || "").trim()).filter(Boolean);
  const i = lineas.findIndex(l => normalize(l).includes(q));
  if (i >= 0) return lineas[i];
  // la frase puede cruzar dos renglones
  const j = lineas.findIndex((l, k) => k < lineas.length - 1 && normalize(`${l} ${lineas[k + 1]}`).includes(q));
  return j >= 0 ? `${lineas[j]} / ${lineas[j + 1]}` : "";
}

function rpReproducirColeccion(mezclar) {
  const col = rp.coleccion;
  if (!col) return;
  rpReproducirLista(rpIdsColeccion(false), null, mezclar, { ...col });
}

// toca una canción de la colección: suena esa y la cola sigue con el resto
function rpReproducirDesde(songId) {
  const col = rp.coleccion;
  if (!col) return;

  // si ya es la que suena, solo abre la pantalla de reproducción
  if (rp.cola[rp.idx] === songId && rp.origen?.id === col.id) return rpAbrirSonando();

  rpReproducirLista(rpIdsColeccion(false), songId, false, { ...col });
}

// ===================== RENDER =====================
function rpRender() {
  const body = document.getElementById("rpBody");
  if (!body) return;

  if (rp.coleccion?.tipo === "playlist" && !misPlaylists[rp.coleccion.id]) rp.coleccion = null;
  if (rp.coleccion?.tipo === "libro" && !rpIdsDeLibro(rp.coleccion.id).length) rp.coleccion = null;

  body.innerHTML = rp.coleccion ? rpHtmlColeccion() : rpHtmlBiblioteca();
  if (rp.coleccion) rpRenderFilasColeccion();
  else rpRenderRiel([]);

  rpRenderSonando();
  rpRenderMini();
  rpRenderSheet();
  rpActualizarProgreso();
}

// --- Biblioteca (pantalla principal) ---
function rpHtmlBiblioteca() {
  const chip = (f, label) => `<button type="button" class="rp-chip${rp.filtro === f ? " activa" : ""}" ${dataAction("rpElegirFiltro", [f])}>${label}</button>`;

  const playlistIds = Object.keys(misPlaylists)
    .sort((a, b) => misPlaylists[a].name.localeCompare(misPlaylists[b].name, "es", { sensitivity: "base" }));
  const libros = rpLibrosConAudio();
  const origenId = rp.idx >= 0 ? rp.origen?.id : null;

  const filaPlaylist = id => {
    const pl = misPlaylists[id];
    return `
      <div class="rp-item${origenId === id ? " sonando" : ""}" ${dataAction("rpAbrirColeccion", ["playlist", id])}>
        ${rpTapaPlaylistHtml(pl, id, "rp-tapa-56")}
        <div class="rp-item-txt">
          <span class="rp-item-titulo">${escapeHtml(pl.name)}</span>
          <span class="rp-item-sub">${tRp("tipo_playlist")} · ${tRp("canciones", { n: pl.songIds.length })}</span>
        </div>
      </div>
    `;
  };

  const filaLibro = l => `
    <div class="rp-item${origenId === l.id ? " sonando" : ""}" ${dataAction("rpAbrirColeccion", ["libro", l.id])}>
      ${rpTapaLibroHtml(l, "rp-tapa-56")}
      <div class="rp-item-txt">
        <span class="rp-item-titulo">${escapeHtml(l.nombre)}</span>
        <span class="rp-item-sub">${tRp("tipo_libro")} · ${tRp("canciones", { n: rpIdsDeLibro(l.id).length })}</span>
      </div>
    </div>
  `;

  const crear = `
    <div class="rp-item" ${dataAction("rpCrearPlaylist")}>
      <div class="rp-tapa rp-tapa-56 rp-tapa-crear">${rpIcono("plus")}</div>
      <div class="rp-item-txt">
        <span class="rp-item-titulo">${tRp("crear_playlist")}</span>
        <span class="rp-item-sub">${tRp("crear_playlist_sub")}</span>
      </div>
    </div>
  `;

  let items = "";
  if (rp.filtro !== "libros") items += crear + playlistIds.map(filaPlaylist).join("");
  if (rp.filtro !== "playlists") items += libros.map(filaLibro).join("");
  if (rp.filtro === "libros" && !libros.length) items = `<p class="rp-vacio">${tRp("sin_libros")}</p>`;

  return `
    <div class="rp-top">
      <button type="button" class="rp-icon-btn" ${dataAction("minimizarReproductor")} title="${escapeHtml(tRp("minimizar"))}">${rpIcono("down")}</button>
      <h2 class="rp-top-titulo">${tRp("titulo")}</h2>
      <button type="button" class="rp-icon-btn" ${dataAction("rpCrearPlaylist")} title="${escapeHtml(tRp("crear_playlist"))}">${rpIcono("plus")}</button>
      <button type="button" class="rp-icon-btn" ${dataAction("cerrarReproductor")} title="${escapeHtml(tRp("cerrar"))}">${rpIcono("close")}</button>
    </div>
    <div class="rp-chips">
      ${chip("todo", tRp("filtro_todo"))}
      ${chip("playlists", tRp("filtro_playlists"))}
      ${chip("libros", tRp("filtro_libros"))}
    </div>
    <div class="rp-items">${items}</div>
  `;
}

// --- Colección (libro o playlist abierta) ---
function rpHtmlColeccion() {
  const col = rp.coleccion;
  const esLibro = col.tipo === "libro";
  const libro = esLibro ? LIBROS.find(l => l.id === col.id) : null;
  const pl = esLibro ? null : misPlaylists[col.id];

  const nombre = esLibro ? libro.nombre : pl.name;
  const total = rpIdsColeccion(false).length;
  const color = esLibro ? rpColorLibro(libro) : rpColorPorTexto(col.id + pl.name);
  const tapa = esLibro ? rpTapaLibroHtml(libro, "rp-tapa-hero") : rpTapaPlaylistHtml(pl, col.id, "rp-tapa-hero");
  const sonandoAca = rp.idx >= 0 && rp.origen?.id === col.id;
  const playing = sonandoAca && !rpAudio.paused;

  return `
    <div class="rp-hero" style="--rp-color:${color}">
      <div class="rp-top rp-top-flotante">
        <button type="button" class="rp-icon-btn rp-icon-fondo" ${dataAction("rpAbrirColeccion", [null, null])}>${rpIcono("back")}</button>
        <span class="rp-flex"></span>
        <button type="button" class="rp-icon-btn rp-icon-fondo" ${dataAction("minimizarReproductor")} title="${escapeHtml(tRp("minimizar"))}">${rpIcono("down")}</button>
        <button type="button" class="rp-icon-btn rp-icon-fondo" ${dataAction("cerrarReproductor")} title="${escapeHtml(tRp("cerrar"))}">${rpIcono("close")}</button>
      </div>
      ${tapa}
    </div>
    <div class="rp-col-info">
      <h2 class="rp-col-titulo">${escapeHtml(nombre)}</h2>
      <p class="rp-col-sub">${esLibro ? tRp("tipo_libro") : tRp("tipo_playlist")} · ${tRp("canciones", { n: total })}</p>
      <div class="rp-col-acciones">
        ${esLibro ? "" : `<button type="button" class="rp-icon-btn rp-icon-gris" ${dataAction("rpAbrirSheet", ["playlist", null, col.id])}>${rpIcono("more")}</button>`}
        <span class="rp-flex"></span>
        ${total ? `
          <button type="button" class="rp-icon-btn rp-icon-gris${rp.aleatorio && sonandoAca ? " rp-verde" : ""}" ${dataAction("rpReproducirColeccion", [true])}>${rpIcono("shuffle")}</button>
          <button type="button" class="rp-play-verde" data-rp-play-col ${dataAction(sonandoAca ? "rpTogglePlay" : "rpReproducirColeccion", sonandoAca ? [] : [false])}>${rpIcono(playing ? "pause" : "play")}</button>
        ` : ""}
      </div>
    </div>
    ${total > 8 ? `
      <label class="rp-buscador">
        ${rpIcono("search")}
        <input type="search" id="rpBuscador" placeholder="${escapeHtml(tRp("buscar_en"))}" value="${escapeHtml(rp.busqueda)}" oninput="rpBuscar(this.value)">
      </label>
    ` : ""}
    <div id="rpFilas" class="rp-filas"></div>
  `;
}

// las filas se redibujan solas al escribir en el buscador (sin rehacer el
// input, para no perder el foco ni el teclado del celular)
function rpRenderFilasColeccion() {
  const cont = document.getElementById("rpFilas");
  const col = rp.coleccion;
  if (!cont || !col) return;

  const esLibro = col.tipo === "libro";
  const ids = rpIdsColeccion();
  const actual = rp.idx >= 0 ? rp.cola[rp.idx] : null;

  if (!ids.length) {
    rpRenderRiel([]);
    cont.innerHTML = esLibro || rp.busqueda
      ? `<p class="rp-vacio">${tRp("sin_resultados")}</p>`
      : `<div class="rp-vacio"><b>${tRp("playlist_vacia_t")}</b><br>${tRp("playlist_vacia")}</div>`;
    return;
  }

  const todos = esLibro ? null : misPlaylists[col.id].songIds;
  const q = normalize(rp.busqueda.trim());
  const porNumero = esLibro && !!LIBROS.find(l => l.id === col.id)?.numeroHimno;
  const paso = porNumero ? rpPasoRiel(ids) : 0;
  const indices = [];

  cont.innerHTML = ids.map(id => {
    const tr = rpTrack(id);
    const sonando = id === actual;
    // riel vertical: letra (libros alfabéticos) o rango de números (himnarios)
    const renglon = rpRenglonQueCoincide(tr, q);
    // con búsqueda el orden ya no es alfabético/numérico: sin riel
    const indice = esLibro && !q ? rpIndiceDe(tr, paso) : null;
    const marcaIndice = indice && !indices.includes(indice) ? (indices.push(indice), ` data-rp-indice="${escapeHtml(indice)}"`) : "";
    const izquierda = esLibro
      ? `<span class="rp-fila-num">${sonando ? rpEcualizador() : escapeHtml(tr.numero || "•")}</span>`
      : rpTapaLibroHtml(tr.libro, "rp-tapa-48");

    return `
      <div class="rp-fila${sonando ? " sonando" : ""}"${marcaIndice}>
        <div class="rp-fila-main" ${dataAction("rpReproducirDesde", [id])}>
          ${izquierda}
          <div class="rp-item-txt">
            <span class="rp-item-titulo">${escapeHtml(esLibro ? tr.titulo : tr.tituloCompleto)}</span>
            <span class="rp-item-sub">${tr.mp3s.length > 1 ? `<span class="rp-badge">${rpIcono("mic")}</span>` : ""}${renglon ? `<i class="rp-renglon">“${escapeHtml(renglon)}”</i>` : escapeHtml(tr.subtitulo)}</span>
          </div>
        </div>
        <button type="button" class="rp-icon-btn rp-icon-gris" ${dataAction("rpAbrirSheet", ["cancion", id, esLibro ? null : col.id, esLibro ? null : todos.indexOf(id)])}>${rpIcono("more")}</button>
      </div>
    `;
  }).join("");

  rpRenderRiel(indices);
}

// ===================== RIEL VERTICAL (A–Z / números) =====================
// mismo espíritu que el riel de letras de los modales del cancionero
// (renderModalLetterRail en app.js), pero se puede arrastrar el dedo y
// muestra una burbuja grande con la letra, como la agenda del celular
const RP_RIEL_MIN = 6;

// himnarios: marcas cada 10/20/25/50/100 según cuántos himnos tenga, para
// que queden unas 10–14 (ej. 600 himnos → 1, 50, 100…; 200 → 1, 20, 40…)
function rpPasoRiel(ids) {
  const max = Math.max(0, ...ids.map(id => Number(rpTrack(id)?.numero) || 0));
  return [10, 20, 25, 50, 100].find(p => max / p <= 14) || 100;
}

// paso > 0: rango de números (himnarios); 0: letra inicial del título
function rpIndiceDe(tr, paso) {
  if (paso) {
    const n = Number(tr.numero);
    if (!Number.isFinite(n) || !tr.numero) return null;
    return String(n < paso ? 1 : Math.floor(n / paso) * paso);
  }
  return getIndexLetter(tr.titulo);
}

function rpRenderRiel(indices) {
  const riel = document.getElementById("rpRiel");
  const body = document.getElementById("rpBody");
  if (!riel) return;

  const visible = indices.length >= RP_RIEL_MIN;
  riel.hidden = !visible;
  body?.classList.toggle("con-riel", visible);
  riel.innerHTML = visible ? indices.map(i => `<span data-i="${escapeHtml(i)}">${escapeHtml(i)}</span>`).join("") : "";
}

function rpSaltarAIndice(indice, suave) {
  const body = document.getElementById("rpBody");
  const fila = body?.querySelector(`[data-rp-indice="${CSS.escape(indice)}"]`);
  if (!fila) return;
  body.scrollTo({ top: fila.offsetTop - 8, behavior: suave ? "smooth" : "auto" });
}

(function initRielReproductor() {
  let arrastrando = false;

  const indiceEn = (x, y) => document.elementFromPoint(x, y)?.closest?.("#rpRiel [data-i]")?.dataset.i;

  const mostrar = indice => {
    const burbuja = document.getElementById("rpRielBurbuja");
    if (!burbuja || !indice) return;
    burbuja.textContent = indice;
    burbuja.hidden = false;
    document.querySelectorAll("#rpRiel [data-i]").forEach(el => el.classList.toggle("activa", el.dataset.i === indice));
  };

  const ocultar = () => {
    const burbuja = document.getElementById("rpRielBurbuja");
    if (burbuja) burbuja.hidden = true;
    document.querySelectorAll("#rpRiel .activa").forEach(el => el.classList.remove("activa"));
  };

  document.addEventListener("pointerdown", e => {
    if (!e.target.closest?.("#rpRiel")) return;
    arrastrando = true;
    e.preventDefault();
    const i = indiceEn(e.clientX, e.clientY);
    if (i) { mostrar(i); rpSaltarAIndice(i, false); }
  });

  document.addEventListener("pointermove", e => {
    if (!arrastrando) return;
    // x fija en el centro del riel: el dedo puede irse un poco al costado
    const riel = document.getElementById("rpRiel");
    const r = riel?.getBoundingClientRect();
    const i = r ? indiceEn(r.left + r.width / 2, Math.min(Math.max(e.clientY, r.top + 1), r.bottom - 1)) : null;
    if (i && document.getElementById("rpRielBurbuja")?.textContent !== i) {
      mostrar(i);
      rpSaltarAIndice(i, false);
    }
  });

  ["pointerup", "pointercancel"].forEach(tipo => document.addEventListener(tipo, () => {
    if (!arrastrando) return;
    arrastrando = false;
    setTimeout(ocultar, 350);
  }));
})();

function rpEcualizador() {
  const pausa = rpAudio.paused ? " pausado" : "";
  return `<span class="rp-eq${pausa}"><i></i><i></i><i></i></span>`;
}

// --- Pantalla "reproduciendo" (sube desde abajo, como en Spotify) ---
function rpRenderSonando() {
  const cont = document.getElementById("rpSonando");
  if (!cont) return;

  const tr = rp.idx >= 0 ? rpTrack(rp.cola[rp.idx]) : null;
  const abierto = rp.sonandoAbierto && !!tr;
  cont.classList.toggle("abierto", abierto);
  if (!tr) {
    cont.innerHTML = "";
    return;
  }

  const playing = !rpAudio.paused;
  const enPlaylist = rpEnAlgunaPlaylist(tr.song.id);
  const origen = rp.origen?.tipo === "playlist" ? misPlaylists[rp.origen.id]?.name : tr.libro?.nombre;
  const timerMin = rp.timer ? Math.max(1, Math.round((rp.timerFin - Date.now()) / 60000)) : 0;

  cont.style.setProperty("--rp-color", rpColorLibro(tr.libro));
  cont.innerHTML = `
    <div class="rp-son-top">
      <button type="button" class="rp-icon-btn" ${dataAction("rpCerrarSonando")}>${rpIcono("down")}</button>
      <div class="rp-son-origen">
        <span>${tRp("desde")}</span>
        <b>${escapeHtml(origen || "")}</b>
      </div>
      <button type="button" class="rp-icon-btn" ${dataAction("rpAbrirSheet", ["cancion", tr.song.id, rp.origen?.tipo === "playlist" ? rp.origen.id : null, null])}>${rpIcono("more")}</button>
    </div>

    <div class="rp-son-cover" id="rpCoverGrande">${rpTapaLibroHtml(tr.libro, "rp-tapa-grande")}</div>

    <div class="rp-son-titulo">
      <div class="rp-son-titulo-txt">
        <h3>${escapeHtml(tr.tituloCompleto)}</h3>
        <p id="rpAlbum">${escapeHtml(tr.subtitulo)}</p>
      </div>
      <button type="button" class="rp-icon-btn rp-icon-grande${enPlaylist ? " rp-verde" : ""}" ${dataAction("rpAbrirSheet", ["agregar", tr.song.id])}>${rpIcono(enPlaylist ? "check" : "addCirc")}</button>
    </div>

    <div class="rp-progreso">
      <input type="range" id="rpSeek" min="0" max="1000" value="0" oninput="rpSeek(this.value)">
      <div class="rp-tiempos"><span id="rpTiempoActual">0:00</span><span id="rpTiempoTotal">-0:00</span></div>
    </div>

    <div class="rp-controles">
      <button type="button" class="rp-icon-btn rp-ctrl-lado${rp.aleatorio ? " rp-verde rp-punto" : ""}" ${dataAction("rpToggleAleatorio")}>${rpIcono("shuffle")}</button>
      <button type="button" class="rp-icon-btn rp-ctrl-salto" ${dataAction("rpAnterior")}>${rpIcono("prev")}</button>
      <button type="button" class="rp-play-blanco" data-rp-play ${dataAction("rpTogglePlay")}>${rpIcono(playing ? "pause" : "play")}</button>
      <button type="button" class="rp-icon-btn rp-ctrl-salto" ${dataAction("rpSiguiente")}>${rpIcono("next")}</button>
      <button type="button" class="rp-icon-btn rp-ctrl-lado${rp.repetir !== "off" ? " rp-verde rp-punto" : ""}" ${dataAction("rpCiclarRepetir")}>${rpIcono(rp.repetir === "uno" ? "repeat1" : "repeat")}</button>
    </div>

    <div class="rp-son-extras">
      <button type="button" class="rp-icon-btn rp-icon-gris${rpConectado ? " rp-verde" : ""}" ${dataAction("rpConectarDispositivo")} title="${escapeHtml(tRp("conectar"))}">${rpIcono("altavoz")}</button>
      ${tr.mp3s.length > 1 ? `
        <div class="rp-version-toggle">
          <button type="button" class="${rp.version === "vocal" ? "activa" : ""}" ${dataAction("rpCambiarVersion", ["vocal"])}>${rpIcono("mic")} ${escapeHtml(t("mp3_vocal"))}</button>
          <button type="button" class="${rp.version === "playback" ? "activa" : ""}" ${dataAction("rpCambiarVersion", ["playback"])}>${rpIcono("nota")} ${escapeHtml(t("mp3_playback"))}</button>
        </div>
      ` : `<span class="rp-flex"></span>`}
      <button type="button" class="rp-icon-btn rp-icon-gris${rp.timer ? " rp-verde" : ""}" ${dataAction("rpCiclarTimer")}>${rpIcono("luna")}${rp.timer ? `<small>${timerMin}'</small>` : ""}</button>
    </div>

    <button type="button" class="rp-ver-letra" ${dataAction("rpVerLetra")}>${rpIcono("letraIco")} ${tRp("letra")} ${rpIcono("down")}</button>

    ${rpHtmlLetra(tr)}
    ${rpHtmlCreditos(tr)}
    ${rpHtmlAcerca(tr)}
  `;

  rpCargarPortadaEn(document.getElementById("rpCoverGrande"), "rp-tapa-grande");
}

// baja hasta la tarjeta de la letra (queda debajo de los controles)
function rpVerLetra() {
  const cont = document.getElementById("rpSonando");
  const card = document.getElementById("rpCardLetra");
  const barra = cont?.querySelector(".rp-son-top");
  if (cont && card) cont.scrollTo({ top: card.offsetTop - (barra?.offsetHeight || 0) - 8, behavior: "smooth" });
}

// ===================== CONECTAR (AirPlay / Chromecast / Bluetooth) =====================
// - iPhone/iPad/Mac (Safari): abre el selector de AirPlay, que además lista
//   parlantes y auriculares Bluetooth
// - Android/Chrome: Remote Playback API → selector de Chromecast / TV
// - Chrome/Edge en computadora: elegir la salida de audio (parlante BT, etc.)
// - si nada de eso está disponible: Bluetooth se conecta desde el sistema
//   (la web no puede emparejar), y se avisa cómo
let rpConectado = false;

async function rpConectarDispositivo() {
  try {
    if (typeof rpAudio.webkitShowPlaybackTargetPicker === "function") {
      rpAudio.webkitShowPlaybackTargetPicker();
      return;
    }

    if (rpAudio.remote && typeof rpAudio.remote.prompt === "function") {
      await rpAudio.remote.prompt();
      return;
    }

    if (navigator.mediaDevices?.selectAudioOutput && typeof rpAudio.setSinkId === "function") {
      const salida = await navigator.mediaDevices.selectAudioOutput();
      await rpAudio.setSinkId(salida.deviceId);
      showToast(tRp("conectado", { nombre: salida.label || "" }));
      return;
    }
  } catch (err) {
    // canceló el selector, o el dispositivo/navegador no lo soporta: se cae al aviso
    if (err?.name === "NotAllowedError" || err?.name === "AbortError") return;
    console.warn("No se pudo abrir el selector de dispositivos:", err);
  }

  showToast(tRp("conectar_bt"));
}

if (rpAudio.remote) {
  rpAudio.remote.addEventListener("connect", () => { rpConectado = true; rpRenderSonando(); });
  rpAudio.remote.addEventListener("disconnect", () => {
    rpConectado = false;
    showToast(tRp("desconectado"));
    rpRenderSonando();
  });
}

if (window.WebKitPlaybackTargetAvailabilityEvent) {
  rpAudio.addEventListener("webkitcurrentplaybacktargetiswirelesschanged", () => {
    rpConectado = !!rpAudio.webkitCurrentPlaybackTargetIsWireless;
    rpRenderSonando();
  });
}

// letra sola: sin acordes/tablatura y sin teleprónter, en una tarjeta como la de Spotify
function rpHtmlLetra(tr) {
  const original = normalizeArrayField(tr.data.letra);
  if (!original.some(l => l && l.trim() && l !== "br")) {
    return `
      <section class="rp-card rp-card-letra" id="rpCardLetra">
        <h4>${tRp("letra")}</h4>
        <p class="rp-acerca-nota">${tRp("sin_letra")}</p>
      </section>
    `;
  }

  let html = "";
  original.forEach(linea => {
    const limpia = stripChords(linea || "").trim();
    if (!limpia || limpia === "br") {
      // renglón vacío (o que solo tenía acordes): separa estrofas, sin duplicar
      if ((linea || "").trim() === "" || linea === "br") html += `<div class="rp-letra-sep"></div>`;
      return;
    }
    if (/^\d+$/.test(limpia)) {
      html += `<span class="rp-letra-etq">${escapeHtml(limpia)}</span>`;
      return;
    }
    const tipo = typeof detectSectionLabel === "function" ? detectSectionLabel(limpia) : null;
    if (tipo) {
      html += `<span class="rp-letra-etq">${escapeHtml(limpia)}</span>`;
      return;
    }
    html += `<p>${escapeHtml(limpia)}</p>`;
  });

  return `
    <section class="rp-card rp-card-letra" id="rpCardLetra">
      <h4>${tRp("letra")}</h4>
      <div class="rp-letra">${html}</div>
    </section>
  `;
}

function rpHtmlCreditos(tr) {
  const song = tr.song;
  const personas = [
    ["autor", song.autor],
    ["coautor", song.coautor],
    ["compositor", song.compositor],
    ["arreglo", tr.data.arreglo],
    ["traductor", tr.data.traductor]
  ].flatMap(([rol, v]) => rpPersonas(v).map(nombre => ({ rol, nombre })));

  if (!personas.length) return "";

  return `
    <section class="rp-card">
      <h4>${tRp("creditos")}</h4>
      ${personas.map(p => `
        <div class="rp-credito">
          <b>${escapeHtml(p.nombre)}</b>
          <span>${t(p.rol)}</span>
        </div>
      `).join("")}
    </section>
  `;
}

function rpHtmlAcerca(tr) {
  if (tr.huerfano) return ""; // mp3 sin canto en el .json: no hay datos que mostrar
  const song = tr.song;
  const valor = v => {
    const s = rpLista(v).join(", ");
    return typeof traducirValorFijo === "function" ? traducirValorFijo(s) : s;
  };

  const datos = [
    ["titulo_original", rpLista(song.titulo_original).join(", "), true],
    ["anio", valor(song.year)],
    ["tonalidad", valor(song.tonalidad)],
    ["ritmo", valor(song.ritmo)],
    ["referencia_biblica", valor(song.referencia_biblica)]
  ].filter(([, v]) => v);

  const notas = rpLista(tr.data.nota);

  return `
    <section class="rp-card">
      <h4>${tRp("acerca")}</h4>
      ${notas.map(n => `<p class="rp-acerca-nota">${escapeHtml(n)}</p>`).join("")}
      ${datos.map(([key, v, propio]) => `
        <div class="rp-dato"><span>${propio ? tRp(key) : t(key)}</span><b>${escapeHtml(v)}</b></div>
      `).join("")}
      <button type="button" class="rp-btn-borde" ${dataAction("rpAbrirEnCancionero", [tr.song.id])}>${rpIcono("libro")} ${tRp("ver_cancionero")}</button>
    </section>
  `;
}

// --- Mini reproductor (abajo del modal) ---
function rpRenderMini() {
  const mini = document.getElementById("rpMini");
  if (!mini) return;

  const tr = rp.idx >= 0 ? rpTrack(rp.cola[rp.idx]) : null;
  mini.hidden = !tr || rp.sonandoAbierto;
  if (mini.hidden) return;

  mini.style.setProperty("--rp-color", rpColorLibro(tr.libro));
  mini.innerHTML = rpHtmlMini(tr, "rpCoverMini", "rpAbrirSonando");
  rpCargarPortadaEn(document.getElementById("rpCoverMini"), "rp-tapa-40");
}

function rpHtmlMini(tr, coverId, accion) {
  return `
    <div class="rp-mini-main" ${dataAction(accion)}>
      <div id="${coverId}">${rpTapaLibroHtml(tr.libro, "rp-tapa-40")}</div>
      <div class="rp-item-txt">
        <span class="rp-item-titulo">${escapeHtml(tr.tituloCompleto)}</span>
        <span class="rp-item-sub">${escapeHtml(tr.subtitulo)}</span>
      </div>
    </div>
    <button type="button" class="rp-icon-btn" data-rp-play ${dataAction("rpTogglePlay")}>${rpIcono(rpAudio.paused ? "play" : "pause")}</button>
    <div class="rp-mini-barra"><span data-rp-barra></span></div>
  `;
}

// barrita flotante FUERA del modal: aparece solo si el modal está minimizado y hay algo cargado
function rpActualizarMiniFlotante() {
  const flot = document.getElementById("rpFlotante");
  if (!flot) return;

  const tr = rp.idx >= 0 ? rpTrack(rp.cola[rp.idx]) : null;
  flot.hidden = !tr || rpModalAbierto();
  if (flot.hidden) return;

  flot.style.setProperty("--rp-color", rpColorLibro(tr.libro));
  flot.innerHTML = rpHtmlMini(tr, "rpCoverFlot", "abrirReproductor");
  rpCargarPortadaEn(document.getElementById("rpCoverFlot"), "rp-tapa-40");
}

// --- Menú ⋯ (hoja que sube desde abajo) ---
function rpRenderSheet() {
  const cont = document.getElementById("rpSheet");
  if (!cont) return;

  const s = rp.sheet;
  cont.classList.toggle("abierto", !!s);
  if (!s) {
    cont.innerHTML = "";
    return;
  }

  const opcion = (icono, label, accion, args = []) => `
    <button type="button" class="rp-sheet-op" ${dataAction(accion, args)}>${rpIcono(icono)}<span>${label}</span></button>
  `;

  let cabecera = "";
  let opciones = "";

  if (s.modo === "playlist") {
    const pl = misPlaylists[s.playlistId];
    cabecera = rpHtmlSheetCabecera(rpTapaPlaylistHtml(pl, s.playlistId, "rp-tapa-48"), pl.name, tRp("canciones", { n: pl.songIds.length }));
    opciones = opcion("edit", tRp("renombrar"), "rpRenombrarPlaylist", [s.playlistId]) +
               opcion("trash", tRp("eliminar"), "rpEliminarPlaylist", [s.playlistId]);
  } else {
    const tr = rpTrack(s.songId);
    cabecera = rpHtmlSheetCabecera(rpTapaLibroHtml(tr.libro, "rp-tapa-48"), tr.tituloCompleto, tr.subtitulo);

    if (s.modo === "agregar") {
      const ids = Object.keys(misPlaylists)
        .sort((a, b) => misPlaylists[a].name.localeCompare(misPlaylists[b].name, "es", { sensitivity: "base" }));
      opciones = `
        <button type="button" class="rp-sheet-op" ${dataAction("rpCrearPlaylist", [s.songId])}>
          <span class="rp-tapa rp-tapa-40 rp-tapa-crear">${rpIcono("plus")}</span><span>${tRp("nueva_playlist")}</span>
        </button>
        ${ids.map(id => {
          const ya = misPlaylists[id].songIds.includes(s.songId);
          return `
            <button type="button" class="rp-sheet-op" ${dataAction("rpAgregarAPlaylist", [id, s.songId])}>
              ${rpTapaPlaylistHtml(misPlaylists[id], id, "rp-tapa-40")}
              <span>${escapeHtml(misPlaylists[id].name)}</span>
              ${ya ? rpIcono("check", "rp-verde") : ""}
            </button>
          `;
        }).join("")}
      `;
    } else {
      opciones = opcion("addCirc", tRp("agregar_playlist"), "rpAbrirSheet", ["agregar", s.songId]);
      if (s.playlistId) {
        const pl = misPlaylists[s.playlistId];
        const idx = pl.songIds.indexOf(s.songId);
        opciones += opcion("menos", tRp("quitar_playlist"), "rpQuitarDePlaylist", [s.playlistId, s.songId]);
        if (idx > 0) opciones += opcion("arriba", tRp("subir"), "rpMoverEnPlaylist", [s.playlistId, idx, -1]);
        if (idx >= 0 && idx < pl.songIds.length - 1) opciones += opcion("abajo", tRp("bajar"), "rpMoverEnPlaylist", [s.playlistId, idx, 1]);
      }
      if (!tr.huerfano) opciones += opcion("libro", tRp("ver_cancionero"), "rpAbrirEnCancionero", [s.songId]);
    }
  }

  cont.innerHTML = `
    <div class="rp-sheet-fondo" ${dataAction("rpCerrarSheet")}></div>
    <div class="rp-sheet-panel">
      <div class="rp-sheet-asa"></div>
      ${cabecera}
      <div class="rp-sheet-ops">${opciones}</div>
      <button type="button" class="rp-sheet-cancelar" ${dataAction("rpCerrarSheet")}>${tRp("cancelar")}</button>
    </div>
  `;
}

function rpHtmlSheetCabecera(tapa, titulo, sub) {
  return `
    <div class="rp-sheet-cab">
      ${tapa}
      <div class="rp-item-txt">
        <span class="rp-item-titulo">${escapeHtml(titulo)}</span>
        <span class="rp-item-sub">${escapeHtml(sub)}</span>
      </div>
    </div>
  `;
}

// --- Portada real (si el mp3 trae imagen) y color de fondo ---
function rpCargarPortadaEn(el, clase) {
  if (!el) return;
  const tr = rp.idx >= 0 ? rpTrack(rp.cola[rp.idx]) : null;
  if (!tr) return;

  const songId = tr.song.id;
  rpLeerPortada(rpUrlSegunVersion(tr.mp3s)).then(p => {
    if (!p || !el.isConnected || rp.cola[rp.idx] !== songId) return;

    if (p.img) el.innerHTML = `<div class="rp-tapa ${clase}"><img src="${p.img}" alt=""></div>`;

    if (p.color) {
      ["rpSonando", "rpMini", "rpFlotante"].forEach(id => {
        document.getElementById(id)?.style.setProperty("--rp-color", p.color);
      });
    }

    // el nombre del álbum (si el mp3 lo trae) se suma debajo del autor
    const album = document.getElementById("rpAlbum");
    if (album && p.album && !album.dataset.album) {
      album.dataset.album = "1";
      album.textContent = [album.textContent, p.album].filter(Boolean).join(" · ");
    }
  });
}

function rpActualizarEstadoPlay() {
  const icono = rpIcono(rpAudio.paused ? "play" : "pause");
  document.querySelectorAll("[data-rp-play]").forEach(b => { b.innerHTML = icono; });

  const colBtn = document.querySelector("[data-rp-play-col]");
  if (colBtn && rp.origen?.id === rp.coleccion?.id) colBtn.innerHTML = icono;

  document.querySelectorAll(".rp-eq").forEach(eq => eq.classList.toggle("pausado", rpAudio.paused));
  rpActualizarMiniFlotante();
}

function rpActualizarProgreso() {
  const dur = rpAudio.duration;
  const cur = rpAudio.currentTime;
  const pct = isFinite(dur) && dur > 0 ? cur / dur : 0;

  const seek = document.getElementById("rpSeek");
  if (seek) {
    if (document.activeElement !== seek) seek.value = Math.round(pct * 1000);
    seek.style.setProperty("--pct", `${pct * 100}%`);
  }

  const a = document.getElementById("rpTiempoActual");
  const b = document.getElementById("rpTiempoTotal");
  if (a) a.textContent = rpFormatoTiempo(cur);
  if (b) b.textContent = isFinite(dur) ? `-${rpFormatoTiempo(dur - cur)}` : "-0:00";

  document.querySelectorAll("[data-rp-barra]").forEach(el => { el.style.width = `${pct * 100}%`; });
}

// ===================== INIT =====================
cargarPlaylistsStorage();
