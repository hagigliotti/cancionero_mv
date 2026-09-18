// ===============================================================================================
// MIS PEDIDOS DE ORACIÓN — cada pedido existe por sí solo (se puede crear sin
// ninguna lista) y opcionalmente pertenece a UNA lista (ej. "Familia",
// "Amigos"), que se puede asignar o cambiar en cualquier momento — mismo
// espíritu que Mis Listas (las canciones existen aparte, las listas solo
// las referencian), pero acá cada pedido vive DENTRO de una sola lista a la
// vez (o de ninguna), no varias.
// Guardado LOCAL en el dispositivo (localStorage para texto/datos, IndexedDB
// para las fotos, igual que el Bloc musical). No sube nada a ningún servidor.
// Usa funciones de app.js/songbook.js/utils.js (getTodasLasCanciones,
// getSongTitle, openSong, normalize, escapeHtml, dataAction, showToast,
// closeMenu) a propósito, porque un pedido puede enlazar un canto real del
// cancionero — a diferencia del Bloc musical, este archivo NO está aislado
// del resto.
// ===============================================================================================

// ===================== TRADUCCIÓN DEL MODAL =====================
// Mismo mecanismo que UI_LABELS/t() (lenguage.js), pero acá adentro para no
// mezclarlo con las etiquetas del menú/ficha de canción — este modal es
// autocontenido en cuanto a texto. conFallbackIdioma() es la función
// genérica de lenguage.js: es/gn siempre en español, cualquier otro idioma
// cae a inglés si no tiene traducción propia acá.
const ORACION_LABELS = {
  titulo:                { es: "Mis Pedidos de Oración",  en: "My Prayer Requests",        it: "Le Mie Richieste di Preghiera", pt: "Meus Pedidos de Oração",   fr: "Mes Demandes de Prière",         de: "Meine Gebetsanliegen" },
  subtitulo:              { es: "Anotá un pedido y, si querés, agregalo a una lista", en: "Write down a request and, if you'd like, add it to a list", it: "Scrivi una richiesta e, se vuoi, aggiungila a un elenco", pt: "Anote um pedido e, se quiser, adicione a uma lista", fr: "Notez une demande et, si vous le souhaitez, ajoutez-la à une liste", de: "Schreib ein Anliegen auf und füg es bei Bedarf einer Liste hinzu" },
  nuevo_pedido:            { es: "✍️ Nuevo pedido de oración", en: "✍️ New prayer request", it: "✍️ Nuova richiesta di preghiera", pt: "✍️ Novo pedido de oração", fr: "✍️ Nouvelle demande de prière", de: "✍️ Neues Gebetsanliegen" },
  placeholder_texto:       { es: "Escribí el pedido de oración...", en: "Write the prayer request...", it: "Scrivi la richiesta di preghiera...", pt: "Escreva o pedido de oração...", fr: "Écrivez la demande de prière...", de: "Schreib das Gebetsanliegen..." },
  chip_foto:               { es: "📷 Foto",     en: "📷 Photo",  it: "📷 Foto",    pt: "📷 Foto",     fr: "📷 Photo",  de: "📷 Foto" },
  chip_versiculo:          { es: "📖 Versículo", en: "📖 Verse",  it: "📖 Versetto", pt: "📖 Versículo", fr: "📖 Verset", de: "📖 Bibelvers" },
  chip_canto:              { es: "🎵 Canto",    en: "🎵 Song",   it: "🎵 Canto",   pt: "🎵 Cântico",   fr: "🎵 Chant",  de: "🎵 Lied" },
  btn_agregar:             { es: "+ Agregar pedido", en: "+ Add request", it: "+ Aggiungi richiesta", pt: "+ Adicionar pedido", fr: "+ Ajouter une demande", de: "+ Anliegen hinzufügen" },
  aviso_foto:              { es: "📷 Si agregás una foto, queda guardada solo en este dispositivo — no se sube a internet.", en: "📷 If you add a photo, it's saved only on this device — it's never uploaded.", it: "📷 Se aggiungi una foto, resta salvata solo su questo dispositivo — non viene mai caricata online.", pt: "📷 Se você adicionar uma foto, ela fica salva só neste dispositivo — nunca é enviada para a internet.", fr: "📷 Si vous ajoutez une photo, elle reste enregistrée uniquement sur cet appareil — elle n'est jamais envoyée sur internet.", de: "📷 Ein hinzugefügtes Foto wird nur auf diesem Gerät gespeichert — es wird nie ins Internet hochgeladen." },
  placeholder_buscar_canto:{ es: "Buscar canto o himno por título...", en: "Search for a song or hymn by title...", it: "Cerca un canto o inno per titolo...", pt: "Buscar um cântico ou hino pelo título...", fr: "Rechercher un chant ou cantique par titre...", de: "Lied oder Choral nach Titel suchen..." },
  cancelar:                { es: "Cancelar", en: "Cancel", it: "Annulla", pt: "Cancelar", fr: "Annuler", de: "Abbrechen" },
  tus_pedidos:             { es: "🛐 Tus pedidos", en: "🛐 Your requests", it: "🛐 Le tue richieste", pt: "🛐 Seus pedidos", fr: "🛐 Vos demandes", de: "🛐 Deine Anliegen" },
  organizar:               { es: "Organizar y respaldar", en: "Organize & back up", it: "Organizza e backup", pt: "Organizar e fazer backup", fr: "Organiser et sauvegarder", de: "Organisieren und sichern" },
  placeholder_lista:       { es: "Nombre de una lista (ej. Familia)", en: "List name (e.g. Family)", it: "Nome di un elenco (es. Famiglia)", pt: "Nome de uma lista (ex. Família)", fr: "Nom d'une liste (ex. Famille)", de: "Name einer Liste (z. B. Familie)" },
  btn_crear_lista:         { es: "+ Crear lista", en: "+ Create list", it: "+ Crea elenco", pt: "+ Criar lista", fr: "+ Créer une liste", de: "+ Liste erstellen" },
  btn_exportar:            { es: "⬆️ Exportar", en: "⬆️ Export", it: "⬆️ Esporta", pt: "⬆️ Exportar", fr: "⬆️ Exporter", de: "⬆️ Exportieren" },
  btn_importar:            { es: "⬇️ Importar", en: "⬇️ Import", it: "⬇️ Importa", pt: "⬇️ Importar", fr: "⬇️ Importer", de: "⬇️ Importieren" },
  aviso_export:            { es: "Para ver los mismos pedidos en otro navegador o dispositivo: exportá acá y luego importá ese archivo allá (listas, pedidos y fotos van incluidos).", en: "To see the same requests on another browser or device: export here and then import that file there (lists, requests and photos are included).", it: "Per vedere le stesse richieste su un altro browser o dispositivo: esporta qui e poi importa quel file lì (elenchi, richieste e foto sono incluse).", pt: "Para ver os mesmos pedidos em outro navegador ou dispositivo: exporte aqui e depois importe esse arquivo lá (listas, pedidos e fotos estão incluídos).", fr: "Pour voir les mêmes demandes sur un autre navigateur ou appareil : exportez ici puis importez ce fichier là-bas (listes, demandes et photos sont inclus).", de: "Um dieselben Anliegen in einem anderen Browser oder Gerät zu sehen: hier exportieren und die Datei dort importieren (Listen, Anliegen und Fotos sind enthalten)." },

  sin_texto:               { es: "(sin texto)", en: "(no text)", it: "(senza testo)", pt: "(sem texto)", fr: "(sans texte)", de: "(kein Text)" },
  agregar_foto:            { es: "📷 Agregar foto", en: "📷 Add photo", it: "📷 Aggiungi foto", pt: "📷 Adicionar foto", fr: "📷 Ajouter une photo", de: "📷 Foto hinzufügen" },
  agregar_versiculo:       { es: "📖 Agregar versículo", en: "📖 Add verse", it: "📖 Aggiungi versetto", pt: "📖 Adicionar versículo", fr: "📖 Ajouter un verset", de: "📖 Bibelvers hinzufügen" },
  agregar_canto:           { es: "🎵 Agregar canto", en: "🎵 Add song", it: "🎵 Aggiungi canto", pt: "🎵 Adicionar cântico", fr: "🎵 Ajouter un chant", de: "🎵 Lied hinzufügen" },
  quitar_foto:             { es: "Quitar foto", en: "Remove photo", it: "Rimuovi foto", pt: "Remover foto", fr: "Retirer la photo", de: "Foto entfernen" },
  quitar_versiculo:        { es: "Quitar versículo", en: "Remove verse", it: "Rimuovi versetto", pt: "Remover versículo", fr: "Retirer le verset", de: "Bibelvers entfernen" },
  quitar_canto:            { es: "Quitar canto", en: "Remove song", it: "Rimuovi canto", pt: "Remover cântico", fr: "Retirer le chant", de: "Lied entfernen" },
  lista_label:             { es: "📂 Lista:", en: "📂 List:", it: "📂 Elenco:", pt: "📂 Lista:", fr: "📂 Liste :", de: "📂 Liste:" },
  sin_lista_opcion:        { es: "Sin lista", en: "No list", it: "Nessun elenco", pt: "Sem lista", fr: "Sans liste", de: "Keine Liste" },
  sin_lista_seccion:       { es: "📌 Sin lista", en: "📌 No list", it: "📌 Nessun elenco", pt: "📌 Sem lista", fr: "📌 Sans liste", de: "📌 Keine Liste" },
  editar_texto:            { es: "Editar texto", en: "Edit text", it: "Modifica testo", pt: "Editar texto", fr: "Modifier le texte", de: "Text bearbeiten" },
  eliminar_pedido:         { es: "Eliminar pedido", en: "Delete request", it: "Elimina richiesta", pt: "Excluir pedido", fr: "Supprimer la demande", de: "Anliegen löschen" },
  cambiar_nombre:          { es: "Cambiar nombre", en: "Rename", it: "Rinomina", pt: "Renomear", fr: "Renommer", de: "Umbenennen" },
  eliminar_lista:          { es: "Eliminar lista", en: "Delete list", it: "Elimina elenco", pt: "Excluir lista", fr: "Supprimer la liste", de: "Liste löschen" },
  pedido_fecha:            { es: "🗓️ Pedido:", en: "🗓️ Requested:", it: "🗓️ Richiesta:", pt: "🗓️ Pedido:", fr: "🗓️ Demandée :", de: "🗓️ Erbeten:" },
  respondido_fecha:        { es: "✅ Respondido:", en: "✅ Answered:", it: "✅ Esaudita:", pt: "✅ Respondido:", fr: "✅ Exaucée :", de: "✅ Erhört:" },
  marcar_respondido:       { es: "Marcar como respondido", en: "Mark as answered", it: "Segna come esaudita", pt: "Marcar como respondido", fr: "Marquer comme exaucée", de: "Als erhört markieren" },
  lista_vacia:             { es: 'Todavía no tiene pedidos — asignale uno con el selector "📂 Lista" de cualquier pedido.', en: 'No requests yet — assign one with the "📂 List" selector on any request.', it: 'Non ha ancora richieste — assegnane una con il selettore "📂 Elenco" di qualsiasi richiesta.', pt: 'Ainda não tem pedidos — atribua um com o seletor "📂 Lista" de qualquer pedido.', fr: "Aucune demande pour l'instant — assignez-en une avec le sélecteur « 📂 Liste » de n'importe quelle demande.", de: 'Noch keine Anliegen — weise eines mit dem Auswähler "📂 Liste" bei einem beliebigen Anliegen zu.' },
  todo_vacio:              { es: 'Todavía no anotaste ningún pedido — escribilo arriba y tocá "+ Agregar pedido".', en: 'You haven\'t written any prayer request yet — write it above and tap "+ Add request".', it: 'Non hai ancora scritto nessuna richiesta di preghiera — scrivila sopra e tocca "+ Aggiungi richiesta".', pt: 'Você ainda não anotou nenhum pedido de oração — escreva acima e toque em "+ Adicionar pedido".', fr: "Vous n'avez encore noté aucune demande de prière — écrivez-la ci-dessus et touchez « + Ajouter une demande ».", de: 'Du hast noch kein Gebetsanliegen notiert — schreib es oben und tippe auf "+ Anliegen hinzufügen".' },
  sin_resultados:          { es: "Sin resultados", en: "No results", it: "Nessun risultato", pt: "Nenhum resultado", fr: "Aucun résultat", de: "Keine Ergebnisse" },

  prompt_nombre_lista:     { es: "Nuevo nombre de la lista:", en: "New name for the list:", it: "Nuovo nome dell'elenco:", pt: "Novo nome da lista:", fr: "Nouveau nom de la liste :", de: "Neuer Name der Liste:" },
  prompt_editar_pedido:    { es: "Editar pedido:", en: "Edit request:", it: "Modifica richiesta:", pt: "Editar pedido:", fr: "Modifier la demande :", de: "Anliegen bearbeiten:" },
  prompt_referencia:       { es: "Referencia bíblica (ej. Salmo 23:1):", en: "Bible reference (e.g. Psalm 23:1):", it: "Riferimento biblico (es. Salmo 23:1):", pt: "Referência bíblica (ex. Salmo 23:1):", fr: "Référence biblique (ex. Psaume 23:1) :", de: "Bibelstelle (z. B. Psalm 23:1):" },
  confirm_eliminar_lista_con_pedidos: { es: '¿Eliminar la lista "{nombre}"? Sus {n} pedido(s) no se borran — quedan "Sin lista".', en: 'Delete the list "{nombre}"? Its {n} request(s) won\'t be deleted — they\'ll stay as "No list".', it: 'Eliminare l\'elenco "{nombre}"? Le sue {n} richieste non vengono eliminate — restano "Senza elenco".', pt: 'Excluir a lista "{nombre}"? Seus {n} pedido(s) não são excluídos — ficam "Sem lista".', fr: 'Supprimer la liste « {nombre} » ? Ses {n} demande(s) ne seront pas supprimées — elles resteront « Sans liste ».', de: 'Liste "{nombre}" löschen? Ihre {n} Anliegen werden nicht gelöscht — sie bleiben als "Keine Liste" bestehen.' },
  confirm_eliminar_lista_vacia:       { es: '¿Eliminar la lista "{nombre}"?', en: 'Delete the list "{nombre}"?', it: 'Eliminare l\'elenco "{nombre}"?', pt: 'Excluir a lista "{nombre}"?', fr: 'Supprimer la liste « {nombre} » ?', de: 'Liste "{nombre}" löschen?' },
  confirm_eliminar_pedido: { es: "¿Eliminar este pedido de oración?", en: "Delete this prayer request?", it: "Eliminare questa richiesta di preghiera?", pt: "Excluir este pedido de oração?", fr: "Supprimer cette demande de prière ?", de: "Dieses Gebetsanliegen löschen?" },
  toast_escribir_algo:     { es: "Escribí algo, o agregá una foto, versículo o canto", en: "Write something, or add a photo, verse or song", it: "Scrivi qualcosa, oppure aggiungi una foto, un versetto o un canto", pt: "Escreva algo, ou adicione uma foto, versículo ou cântico", fr: "Écrivez quelque chose, ou ajoutez une photo, un verset ou un chant", de: "Schreib etwas, oder füge ein Foto, einen Bibelvers oder ein Lied hinzu" },
  toast_pedido_vacio:      { es: "El pedido no puede quedar vacío", en: "The request can't be left empty", it: "La richiesta non può restare vuota", pt: "O pedido não pode ficar vazio", fr: "La demande ne peut pas rester vide", de: "Das Anliegen darf nicht leer bleiben" },
  toast_no_foto:           { es: "⚠️ No se pudo guardar la foto", en: "⚠️ Couldn't save the photo", it: "⚠️ Non è stato possibile salvare la foto", pt: "⚠️ Não foi possível salvar a foto", fr: "⚠️ Impossible d'enregistrer la photo", de: "⚠️ Foto konnte nicht gespeichert werden" },
  alert_formato_invalido:  { es: "El archivo no tiene el formato esperado de Mis Pedidos de Oración.", en: "The file doesn't have the expected format for My Prayer Requests.", it: "Il file non ha il formato previsto per Le Mie Richieste di Preghiera.", pt: "O arquivo não tem o formato esperado de Meus Pedidos de Oração.", fr: "Le fichier n'a pas le format attendu pour Mes Demandes de Prière.", de: "Die Datei hat nicht das erwartete Format für Meine Gebetsanliegen." },
  alert_import_error:      { es: "No se pudo leer el archivo. ¿Es un export de Mis Pedidos de Oración?", en: "Couldn't read the file. Is it an export of My Prayer Requests?", it: "Non è stato possibile leggere il file. È un export de Le Mie Richieste di Preghiera?", pt: "Não foi possível ler o arquivo. É um export de Meus Pedidos de Oração?", fr: "Impossible de lire le fichier. Est-ce bien un export de Mes Demandes de Prière ?", de: "Datei konnte nicht gelesen werden. Ist es ein Export von Meine Gebetsanliegen?" },
  alert_import_ok:         { es: "✅ Pedidos importados con éxito.", en: "✅ Requests imported successfully.", it: "✅ Richieste importate con successo.", pt: "✅ Pedidos importados com sucesso.", fr: "✅ Demandes importées avec succès.", de: "✅ Anliegen erfolgreich importiert." }
};

// traduce una etiqueta fija del modal (clave de ORACION_LABELS)
function tOracion(key, lang = idiomaActual) {
  const entry = ORACION_LABELS[key];
  if (!entry) return key;
  return conFallbackIdioma(entry, lang);
}

// igual que tOracion(), pero reemplaza placeholders {var} — para los pocos
// textos que necesitan un dato adentro (ej. el nombre de la lista al
// confirmar que se borre)
function tOracionFmt(key, vars = {}, lang = idiomaActual) {
  let texto = tOracion(key, lang);
  Object.keys(vars).forEach(k => { texto = texto.split(`{${k}}`).join(vars[k]); });
  return texto;
}

// aplica la traducción a todo lo fijo del modal (inputs/botones/avisos) y
// vuelve a dibujar lo dinámico (pedidos, listas, vista previa) para que
// también quede en el idioma nuevo. Se llama al abrir el modal y cada vez
// que cambia el idioma de la app (ver actualizarMenuIdioma() en lenguage.js)
function actualizarOracionIdioma() {
  const setText = (id, key) => { const el = document.getElementById(id); if (el) el.textContent = tOracion(key); };
  const setPlaceholder = (id, key) => { const el = document.getElementById(id); if (el) el.placeholder = tOracion(key); };
  const setTitle = (id, key) => { const el = document.getElementById(id); if (el) el.title = tOracion(key); };

  setText("oracionTitle", "titulo");
  setText("oracionSubtitulo", "subtitulo");
  setText("oracionLabelNuevo", "nuevo_pedido");
  setPlaceholder("oracionTextoInput", "placeholder_texto");
  setText("oracionChipFoto", "chip_foto");
  setText("oracionChipVersiculo", "chip_versiculo");
  setText("oracionChipCanto", "chip_canto");
  setText("oracionBtnAgregar", "btn_agregar");
  setText("oracionAvisoFoto", "aviso_foto");
  setPlaceholder("oracionSongPickerInput", "placeholder_buscar_canto");
  setTitle("oracionBtnCancelarBuscador", "cancelar");
  setText("oracionLabelTus", "tus_pedidos");
  setText("oracionLabelOrganizar", "organizar");
  setPlaceholder("oracionNuevaListaInput", "placeholder_lista");
  setText("oracionBtnCrearLista", "btn_crear_lista");
  setText("oracionBtnExportar", "btn_exportar");
  setText("oracionBtnImportar", "btn_importar");
  setText("oracionAvisoExport", "aviso_export");

  renderOracionAdjuntosPreview();
  renderListasOracion();
}

const OR_DB_NAME = "oracionDB";
const OR_STORE = "fotos";

let orDB = null;

// { [listaId]: { name } } — las listas son solo una etiqueta con nombre; qué
// pedidos tiene cada una se calcula filtrando misPedidosOracion por listaId
let misListasOracion = {};

// { [pedidoId]: {id, texto, foto, versiculo, songId, songTitulo, fechaPedido,
//   fechaRespuesta, respondido, creadoEn, listaId} } — listaId es null si el
// pedido todavía no está en ninguna lista
let misPedidosOracion = {};

// pedido "en construcción" en el panel de arriba, todavía sin guardar
let oracionPendiente = { fotoBlob: null, fotoNombre: "", versiculo: null, songId: null, songTitulo: null };

// pedido (ya guardado) al que se le está por agregar un versículo/canto —
// null = va al pedido en construcción (oracionPendiente) en vez de a uno
// ya guardado
let oracionSongPickerTarget = undefined;

// qué listas quedaron abiertas (para no cerrar todo el acordeón cada vez que
// se agrega/edita/mueve un pedido y se vuelve a dibujar todo)
let oracionListasAbiertas = new Set();

// URLs de imagen creadas en el último render, para revocarlas y no ir
// acumulando memoria cada vez que se abre el modal o se edita un pedido
let oracionFotoUrls = [];

// URL de vista previa de la foto TODAVÍA sin guardar (oracionPendiente) —
// aparte de oracionFotoUrls porque esta se genera directo del File elegido,
// sin pasar por IndexedDB
let oracionPendienteFotoUrl = null;

// ===================== INDEXEDDB (fotos) =====================
function orOpenDB() {
  return new Promise((resolve, reject) => {
    if (orDB) return resolve(orDB);

    const req = indexedDB.open(OR_DB_NAME, 1);

    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(OR_STORE)) {
        db.createObjectStore(OR_STORE, { keyPath: "id" });
      }
    };

    req.onsuccess = () => { orDB = req.result; resolve(orDB); };
    req.onerror = () => reject(req.error);
  });
}

// la foto de un pedido se guarda con la MISMA id que el pedido (un pedido =
// como mucho una foto), así no hace falta llevar un campo aparte para el
// link entre uno y otra
async function orGetFoto(id) {
  const db = await orOpenDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(OR_STORE, "readonly");
    const req = tx.objectStore(OR_STORE).get(id);
    req.onsuccess = () => resolve(req.result?.blob || null);
    req.onerror = () => reject(req.error);
  });
}

async function orPutFoto(id, blob) {
  const db = await orOpenDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(OR_STORE, "readwrite");
    tx.objectStore(OR_STORE).put({ id, blob });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function orDeleteFoto(id) {
  const db = await orOpenDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(OR_STORE, "readwrite");
    tx.objectStore(OR_STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// ===================== HELPERS =====================
function orFormatFecha(date) {
  const d = date.getDate().toString().padStart(2, "0");
  const m = (date.getMonth() + 1).toString().padStart(2, "0");
  return `${d}/${m}/${date.getFullYear()}`;
}

function orBlobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function orBase64ToBlob(dataUrl) {
  return fetch(dataUrl).then(res => res.blob());
}

function ordenarPedidos(a, b) {
  if (a.respondido !== b.respondido) return a.respondido ? 1 : -1;
  return (b.creadoEn || 0) - (a.creadoEn || 0);
}

// ===================== STORAGE =====================
function cargarListasOracionStorage() {
  try {
    misListasOracion = JSON.parse(localStorage.getItem("misListasOracion") || "{}");
  } catch {
    misListasOracion = {};
  }

  try {
    misPedidosOracion = JSON.parse(localStorage.getItem("misPedidosOracion") || "{}");
  } catch {
    misPedidosOracion = {};
  }
}

function guardarListasOracion() {
  localStorage.setItem("misListasOracion", JSON.stringify(misListasOracion));
}

function guardarPedidosOracion() {
  localStorage.setItem("misPedidosOracion", JSON.stringify(misPedidosOracion));
}

function findListaOracion(listaId) {
  return misListasOracion[listaId];
}

function findPedidoOracion(pedidoId) {
  return misPedidosOracion[pedidoId];
}

function pedidosDeLista(listaId) {
  return Object.values(misPedidosOracion).filter(p => (p.listaId || null) === listaId);
}

// ===================== INIT =====================
function initOracionModal() {
  document.getElementById("oracionSongPickerInput")
    ?.addEventListener("input", e => oracionFiltrarCanciones(e.target.value));
}

// ===================== ABRIR / CERRAR MODAL =====================
function abrirPedidosOracion() {
  if (typeof closeMenu === "function") closeMenu();

  const modal = document.getElementById("oracionModal");
  if (!modal) return;

  modal.style.display = "block";
  actualizarOracionIdioma();
}

function cerrarPedidosOracion() {
  const modal = document.getElementById("oracionModal");
  if (modal) modal.style.display = "none";

  oracionCerrarBuscadorCanto();
}

// ===================== LISTAS (CRUD) — solo agrupan por nombre, no son
// dueñas de los pedidos: borrar una lista NO borra sus pedidos, los deja
// "Sin lista" =====================
function crearListaOracionDesdeInput() {
  const input = document.getElementById("oracionNuevaListaInput");
  const nombre = (input?.value || "").trim();
  if (!nombre) return;

  const id = "orl" + Date.now();
  misListasOracion[id] = { name: nombre };
  guardarListasOracion();

  if (input) input.value = "";
  oracionListasAbiertas.add(id); // recién creada: que arranque abierta
  renderListasOracion();
}

function editarNombreListaOracion(listaId) {
  const lista = findListaOracion(listaId);
  if (!lista) return;

  const nuevo = prompt(tOracion("prompt_nombre_lista"), lista.name);
  if (nuevo === null) return;

  const limpio = nuevo.trim();
  if (!limpio) return;

  lista.name = limpio;
  guardarListasOracion();
  renderListasOracion();
}

function eliminarListaOracion(listaId) {
  const lista = findListaOracion(listaId);
  if (!lista) return;

  const enEstaLista = pedidosDeLista(listaId);
  const aviso = enEstaLista.length
    ? tOracionFmt("confirm_eliminar_lista_con_pedidos", { nombre: lista.name, n: enEstaLista.length })
    : tOracionFmt("confirm_eliminar_lista_vacia", { nombre: lista.name });

  if (!confirm(aviso)) return;

  enEstaLista.forEach(p => { p.listaId = null; });
  guardarPedidosOracion();

  delete misListasOracion[listaId];
  oracionListasAbiertas.delete(listaId);
  guardarListasOracion();

  renderListasOracion();
}

// mover un pedido a otra lista, o a "Sin lista" (listaId vacío/null)
function moverPedidoALista(pedidoId, listaId) {
  const p = findPedidoOracion(pedidoId);
  if (!p) return;

  p.listaId = listaId || null;
  guardarPedidosOracion();

  if (p.listaId) oracionListasAbiertas.add(p.listaId);
  renderListasOracion();
}

// ===================== ADJUNTOS DEL PEDIDO EN CONSTRUCCIÓN =====================
function renderAdjuntoPreviewHtml(pendiente) {
  if (oracionPendienteFotoUrl) {
    URL.revokeObjectURL(oracionPendienteFotoUrl);
    oracionPendienteFotoUrl = null;
  }

  const partes = [];

  if (pendiente.fotoBlob) {
    oracionPendienteFotoUrl = URL.createObjectURL(pendiente.fotoBlob);

    partes.push(`
      <div class="lista-song-row">
        <img class="oracion-foto-preview" src="${oracionPendienteFotoUrl}" alt="${tOracion("chip_foto")}">
        <button type="button" class="lista-remove-btn" data-action="oracionQuitarFotoPendiente" title="${tOracion("quitar_foto")}">✕</button>
      </div>
    `);
  }

  if (pendiente.versiculo) {
    partes.push(`
      <div class="lista-song-row">
        <span>📖 ${escapeHtml(pendiente.versiculo)}</span>
        <button type="button" class="lista-remove-btn" data-action="oracionQuitarVersiculoPendiente" title="${tOracion("quitar_versiculo")}">✕</button>
      </div>
    `);
  }

  if (pendiente.songId) {
    partes.push(`
      <div class="lista-song-row">
        <span>🎵 ${escapeHtml(pendiente.songTitulo || "")}</span>
        <button type="button" class="lista-remove-btn" data-action="oracionQuitarCantoPendiente" title="${tOracion("quitar_canto")}">✕</button>
      </div>
    `);
  }

  return partes.join("");
}

function renderOracionAdjuntosPreview() {
  const cont = document.getElementById("oracionAdjuntosPreview");
  if (!cont) return;
  cont.innerHTML = renderAdjuntoPreviewHtml(oracionPendiente);
}

function oracionQuitarFotoPendiente() {
  oracionPendiente.fotoBlob = null;
  oracionPendiente.fotoNombre = "";
  renderOracionAdjuntosPreview();
}

function oracionQuitarVersiculoPendiente() {
  oracionPendiente.versiculo = null;
  renderOracionAdjuntosPreview();
}

function oracionQuitarCantoPendiente() {
  oracionPendiente.songId = null;
  oracionPendiente.songTitulo = null;
  renderOracionAdjuntosPreview();
}

// ===================== FOTO (nueva o de un pedido ya guardado) — input de
// archivo creado al vuelo, no hace falta uno fijo por tarjeta. Se agrega al
// DOM (oculto) porque en iOS Safari un <input type="file"> nunca insertado
// en el documento deja el foco "atascado" ahí después de elegir la foto: la
// página vuelve a verse normal, pero los toques siguientes (ej. en "+
// Agregar pedido") no le llegan a ningún botón hasta que algo le saca el
// foco a ese input fantasma =====
function oracionElegirFoto(pedidoId = null) {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";
  input.style.position = "fixed";
  input.style.top = "-9999px";
  input.style.left = "-9999px";
  document.body.appendChild(input);

  const limpiar = () => {
    input.blur();
    input.remove();
  };

  input.addEventListener("change", async () => {
    const file = input.files?.[0];
    if (!file) { limpiar(); return; }

    if (pedidoId) {
      const p = findPedidoOracion(pedidoId);
      if (!p) { limpiar(); return; }

      try {
        await orPutFoto(pedidoId, file);
        p.foto = true;
        guardarPedidosOracion();
        renderListasOracion();
      } catch (err) {
        console.warn("No se pudo guardar la foto del pedido:", err);
        showToast(tOracion("toast_no_foto"));
      }
    } else {
      oracionPendiente.fotoBlob = file;
      oracionPendiente.fotoNombre = file.name;
      renderOracionAdjuntosPreview();
    }

    limpiar();
  });

  input.click();
}

function quitarFotoPedido(pedidoId) {
  const p = findPedidoOracion(pedidoId);
  if (!p) return;

  orDeleteFoto(pedidoId).catch(() => {});
  p.foto = false;
  guardarPedidosOracion();
  renderListasOracion();
}

// ===================== VERSÍCULO (mismo link a BibleGateway que usa la ficha
// de cada canción, ver songbook.js) =====================
function oracionPedirVersiculo(pedidoId = null) {
  const actual = pedidoId
    ? (findPedidoOracion(pedidoId)?.versiculo || "")
    : (oracionPendiente.versiculo || "");

  const ref = prompt(tOracion("prompt_referencia"), actual);
  if (ref === null) return;

  const limpio = ref.trim();
  if (!limpio) return;

  if (pedidoId) {
    const p = findPedidoOracion(pedidoId);
    if (!p) return;
    p.versiculo = limpio;
    guardarPedidosOracion();
    renderListasOracion();
  } else {
    oracionPendiente.versiculo = limpio;
    renderOracionAdjuntosPreview();
  }
}

function quitarVersiculoPedido(pedidoId) {
  const p = findPedidoOracion(pedidoId);
  if (!p) return;

  p.versiculo = null;
  guardarPedidosOracion();
  renderListasOracion();
}

// ===================== CANTO/HIMNO ENLAZADO (busca en TODOS los libros, no
// solo en el que esté abierto ahora — ver getTodasLasCanciones en app.js)
// =====================
function oracionAbrirBuscadorCanto(pedidoId = null) {
  oracionSongPickerTarget = pedidoId;

  const box = document.getElementById("oracionSongPickerBox");
  const input = document.getElementById("oracionSongPickerInput");
  if (!box || !input) return;

  box.classList.remove("hidden");
  input.value = "";
  document.getElementById("oracionSongPickerResults").innerHTML = "";
  input.focus();
  box.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function oracionCerrarBuscadorCanto() {
  document.getElementById("oracionSongPickerBox")?.classList.add("hidden");
  oracionSongPickerTarget = undefined;
}

function oracionFiltrarCanciones(query) {
  const resultsEl = document.getElementById("oracionSongPickerResults");
  if (!resultsEl) return;

  const q = normalize(query).trim();
  if (!q) { resultsEl.innerHTML = ""; return; }

  const encontradas = getTodasLasCanciones()
    .filter(song => normalize(getSongTitle(song)).includes(q))
    .slice(0, 15);

  if (!encontradas.length) {
    resultsEl.innerHTML = `<p class="biblio-empty">${tOracion("sin_resultados")}</p>`;
    return;
  }

  resultsEl.innerHTML = encontradas.map(song => `
    <div class="lista-song-row" ${dataAction("oracionElegirCancionPicker", [song.id, getSongTitle(song)])}>
      <span>🎵 ${escapeHtml(getSongTitle(song))}</span>
    </div>
  `).join("");
}

function oracionElegirCancionPicker(songId, titulo) {
  const pedidoId = oracionSongPickerTarget;

  if (pedidoId) {
    const p = findPedidoOracion(pedidoId);
    if (p) {
      p.songId = songId;
      p.songTitulo = titulo;
      guardarPedidosOracion();
      renderListasOracion();
    }
  } else {
    oracionPendiente.songId = songId;
    oracionPendiente.songTitulo = titulo;
    renderOracionAdjuntosPreview();
  }

  oracionCerrarBuscadorCanto();
}

function quitarCantoPedido(pedidoId) {
  const p = findPedidoOracion(pedidoId);
  if (!p) return;

  p.songId = null;
  p.songTitulo = null;
  guardarPedidosOracion();
  renderListasOracion();
}

// ===================== CREAR / EDITAR / BORRAR / TACHAR PEDIDO (siempre
// arrancan "Sin lista" — se asignan a una lista después con el selector
// "📂 Lista" de la tarjeta) =====================
async function crearPedidoOracionDesdeInput() {
  const input = document.getElementById("oracionTextoInput");
  const texto = (input?.value || "").trim();

  if (!texto && !oracionPendiente.fotoBlob && !oracionPendiente.versiculo && !oracionPendiente.songId) {
    showToast(tOracion("toast_escribir_algo"));
    return;
  }

  const id = "or" + Date.now();
  const ahora = new Date();

  const pedido = {
    id,
    texto,
    foto: false,
    versiculo: oracionPendiente.versiculo || null,
    songId: oracionPendiente.songId || null,
    songTitulo: oracionPendiente.songTitulo || null,
    fechaPedido: orFormatFecha(ahora),
    fechaRespuesta: null,
    respondido: false,
    creadoEn: ahora.getTime(),
    listaId: null
  };

  if (oracionPendiente.fotoBlob) {
    try {
      await orPutFoto(id, oracionPendiente.fotoBlob);
      pedido.foto = true;
    } catch (err) {
      console.warn("No se pudo guardar la foto del pedido:", err);
    }
  }

  misPedidosOracion[id] = pedido;
  guardarPedidosOracion();

  if (input) input.value = "";
  oracionPendiente = { fotoBlob: null, fotoNombre: "", versiculo: null, songId: null, songTitulo: null };
  renderOracionAdjuntosPreview();

  renderListasOracion();
}

function editarTextoPedido(pedidoId) {
  const p = findPedidoOracion(pedidoId);
  if (!p) return;

  const nuevo = prompt(tOracion("prompt_editar_pedido"), p.texto);
  if (nuevo === null) return;

  const limpio = nuevo.trim();
  if (!limpio && !p.foto && !p.versiculo && !p.songId) {
    showToast(tOracion("toast_pedido_vacio"));
    return;
  }

  p.texto = limpio;
  guardarPedidosOracion();
  renderListasOracion();
}

function borrarPedidoOracion(pedidoId) {
  const p = findPedidoOracion(pedidoId);
  if (!p) return;

  if (!confirm(tOracion("confirm_eliminar_pedido"))) return;

  if (p.foto) orDeleteFoto(pedidoId).catch(() => {});

  delete misPedidosOracion[pedidoId];
  guardarPedidosOracion();
  renderListasOracion();
}

function toggleRespondidoPedido(pedidoId) {
  const p = findPedidoOracion(pedidoId);
  if (!p) return;

  p.respondido = !p.respondido;
  p.fechaRespuesta = p.respondido ? orFormatFecha(new Date()) : null;

  guardarPedidosOracion();
  renderListasOracion();
}

// ===================== RENDER =====================
function renderListaOracionSelectHtml(p) {
  const listaIds = Object.keys(misListasOracion)
    .sort((a, b) => misListasOracion[a].name.localeCompare(misListasOracion[b].name, "es", { sensitivity: "base" }));

  const opciones = [`<option value="">${tOracion("sin_lista_opcion")}</option>`]
    .concat(listaIds.map(lid => `<option value="${lid}" ${p.listaId === lid ? "selected" : ""}>${escapeHtml(misListasOracion[lid].name)}</option>`))
    .join("");

  return `
    <div class="oracion-lista-row">
      <label for="oracionListaSel_${p.id}">${tOracion("lista_label")}</label>
      <select id="oracionListaSel_${p.id}" class="chord-instrument-select" onchange="moverPedidoALista('${p.id}', this.value)">${opciones}</select>
    </div>
  `;
}

function renderPedidoOracionHtml(p) {
  const textoCorto = p.texto?.length > 60 ? p.texto.slice(0, 60) + "…" : (p.texto || tOracion("sin_texto"));

  const fotoHtml = p.foto
    ? `<div class="lista-song-row">
         <img class="oracion-foto-preview" data-foto-id="${p.id}" alt="${tOracion("chip_foto")}">
         <button type="button" class="lista-remove-btn" ${dataAction("quitarFotoPedido", [p.id])} title="${tOracion("quitar_foto")}">✕</button>
       </div>`
    : `<button type="button" class="chip oracion-add-chip" ${dataAction("oracionElegirFoto", [p.id])}>${tOracion("agregar_foto")}</button>`;

  const versiculoHtml = p.versiculo
    ? `<div class="lista-song-row">
         <a href="https://www.biblegateway.com/passage/?search=${encodeURIComponent(p.versiculo)}&version=RVR1960" target="_blank" rel="noopener noreferrer">📖 ${escapeHtml(p.versiculo)}</a>
         <button type="button" class="lista-remove-btn" ${dataAction("quitarVersiculoPedido", [p.id])} title="${tOracion("quitar_versiculo")}">✕</button>
       </div>`
    : `<button type="button" class="chip oracion-add-chip" ${dataAction("oracionPedirVersiculo", [p.id])}>${tOracion("agregar_versiculo")}</button>`;

  const cantoHtml = p.songId
    ? `<div class="lista-song-row">
         <span ${dataAction("cerrarPedidosOracion,openSong", [p.songId])}>🎵 ${escapeHtml(p.songTitulo || "")}</span>
         <button type="button" class="lista-remove-btn" ${dataAction("quitarCantoPedido", [p.id])} title="${tOracion("quitar_canto")}">✕</button>
       </div>`
    : `<button type="button" class="chip oracion-add-chip" ${dataAction("oracionAbrirBuscadorCanto", [p.id])}>${tOracion("agregar_canto")}</button>`;

  return `
    <details class="about-section oracion-card ${p.respondido ? "oracion-respondido" : ""}">
      <summary>
        <span class="sec-icon">${p.respondido ? "✅" : "🛐"}</span>
        <span class="menu-row-label">${escapeHtml(textoCorto)}</span>
        <div class="lista-manage-btns" data-stop>
          <button type="button" class="lista-edit-btn" ${dataAction("editarTextoPedido", [p.id])} title="${tOracion("editar_texto")}">✏️</button>
          <button type="button" class="lista-delete-btn" ${dataAction("borrarPedidoOracion", [p.id])} title="${tOracion("eliminar_pedido")}">🗑️</button>
        </div>
        <span class="sec-chevron">▸</span>
      </summary>
      <div class="about-panel">
        <p>${escapeHtml(p.texto || tOracion("sin_texto"))}</p>

        ${fotoHtml}
        ${versiculoHtml}
        ${cantoHtml}
        ${renderListaOracionSelectHtml(p)}

        <div class="oracion-fechas">
          <span>${tOracion("pedido_fecha")} ${p.fechaPedido}</span>
          ${p.fechaRespuesta ? `<span>${tOracion("respondido_fecha")} ${p.fechaRespuesta}</span>` : ""}
        </div>

        <label class="oracion-respondido-toggle" data-stop>
          <input type="checkbox" ${p.respondido ? "checked" : ""} onchange="toggleRespondidoPedido('${p.id}')">
          ${tOracion("marcar_respondido")}
        </label>
      </div>
    </details>
  `;
}

function renderListaOracionHtml(listaId) {
  const lista = misListasOracion[listaId];
  const pedidos = pedidosDeLista(listaId).sort(ordenarPedidos);

  const pedidosHtml = pedidos.length
    ? pedidos.map(p => renderPedidoOracionHtml(p)).join("")
    : `<p class="biblio-empty">${tOracion("lista_vacia")}</p>`;

  return `
    <details class="about-section lista-card" data-lista-id="${listaId}">
      <summary>
        <span class="sec-icon">🛐</span>
        <span class="menu-row-label">${escapeHtml(lista.name)} <small>(${pedidos.length})</small></span>
        <div class="lista-manage-btns" data-stop>
          <button type="button" class="lista-edit-btn" ${dataAction("editarNombreListaOracion", [listaId])} title="${tOracion("cambiar_nombre")}">✏️</button>
          <button type="button" class="lista-delete-btn" ${dataAction("eliminarListaOracion", [listaId])} title="${tOracion("eliminar_lista")}">🗑️</button>
        </div>
        <span class="sec-chevron">▸</span>
      </summary>
      <div class="about-panel">
        ${pedidosHtml}
      </div>
    </details>
  `;
}

function renderListasOracion() {
  const cont = document.getElementById("oracionListasContainer");
  if (!cont) return;

  const sinLista = pedidosDeLista(null).sort(ordenarPedidos);
  const listaIds = Object.keys(misListasOracion)
    .sort((a, b) => misListasOracion[a].name.localeCompare(misListasOracion[b].name, "es", { sensitivity: "base" }));

  if (!sinLista.length && !listaIds.length) {
    cont.innerHTML = `<p class="biblio-empty">${tOracion("todo_vacio")}</p>`;
    return;
  }

  const partes = [];

  if (sinLista.length) {
    partes.push(`<p class="contact-label">${tOracion("sin_lista_seccion")}</p>`);
    partes.push(sinLista.map(p => renderPedidoOracionHtml(p)).join(""));
  }

  if (listaIds.length) {
    partes.push(listaIds.map(id => renderListaOracionHtml(id)).join(""));
  }

  cont.innerHTML = partes.join("");

  // mantiene abiertas las listas que ya estaban abiertas antes de este
  // render (si no, cada alta/baja/movida de un pedido cerraría todo el
  // acordeón)
  cont.querySelectorAll("details.lista-card").forEach(d => {
    const id = d.dataset.listaId;
    if (oracionListasAbiertas.has(id)) d.open = true;

    d.addEventListener("toggle", () => {
      if (d.open) oracionListasAbiertas.add(id);
      else oracionListasAbiertas.delete(id);
    });
  });

  renderPedidosFotos();
}

async function renderPedidosFotos() {
  oracionFotoUrls.forEach(u => URL.revokeObjectURL(u));
  oracionFotoUrls = [];

  const imgs = document.querySelectorAll("#oracionListasContainer .oracion-foto-preview[data-foto-id]");

  for (const img of imgs) {
    const id = img.dataset.fotoId;
    try {
      const blob = await orGetFoto(id);
      if (!blob) continue;

      const url = URL.createObjectURL(blob);
      oracionFotoUrls.push(url);
      img.src = url;
    } catch (err) {
      console.warn("No se pudo cargar la foto del pedido", id, err);
    }
  }
}

// ===================== EXPORTAR / IMPORTAR (fotos incluidas como base64,
// para que el archivo sea autocontenido — ver exportarMisListas en app.js
// para el mismo patrón sin fotos) =====================
async function exportarPedidosOracion() {
  const fotos = {};

  for (const p of Object.values(misPedidosOracion)) {
    if (!p.foto) continue;
    try {
      const blob = await orGetFoto(p.id);
      if (blob) fotos[p.id] = await orBlobToBase64(blob);
    } catch (err) {
      console.warn("No se pudo incluir la foto del pedido", p.id, err);
    }
  }

  const data = {
    tipo: "cancionero-mv-pedidos-oracion",
    version: 3,
    exportadoEl: new Date().toISOString(),
    listas: misListasOracion,
    pedidos: misPedidosOracion,
    fotos
  };

  const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `mis-pedidos-oracion_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

function importarPedidosOracion(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = async () => {
    try {
      const data = JSON.parse(reader.result);
      const nuevasListas = data.listas || {};
      const nuevosPedidos = data.pedidos || {};

      if (typeof nuevasListas !== "object" || typeof nuevosPedidos !== "object" ||
          Array.isArray(nuevasListas) || Array.isArray(nuevosPedidos)) {
        alert(tOracion("alert_formato_invalido"));
        return;
      }

      for (const p of Object.values(nuevosPedidos)) {
        if (p.foto && data.fotos?.[p.id]) {
          try {
            const blob = await orBase64ToBlob(data.fotos[p.id]);
            await orPutFoto(p.id, blob);
          } catch (err) {
            console.warn("No se pudo restaurar la foto del pedido", p.id, err);
            p.foto = false;
          }
        }
      }

      Object.assign(misListasOracion, nuevasListas);
      Object.assign(misPedidosOracion, nuevosPedidos);

      guardarListasOracion();
      guardarPedidosOracion();
      renderListasOracion();
      alert(tOracion("alert_import_ok"));
    } catch (e) {
      alert(tOracion("alert_import_error"));
    }
  };

  reader.readAsText(file);
  event.target.value = "";
}
