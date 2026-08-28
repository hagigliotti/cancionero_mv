// ===============================================================================================
// DICCIONARIO DE TRADUCCIÓN DE TAGS (Español → Italiano/Português/English/Français/Deutsch)
// ===============================================================================================
// Los tags de cada canción se guardan en un solo campo, siempre en español
// (ver la limpieza que se hizo en data/*.json) — no hay un campo separado por
// idioma como sí lo hay para título/letra. Este diccionario traduce ese mismo
// tag al vuelo, SOLO para mostrarlo en pantalla, sin tocar el dato guardado
// (que sigue usándose tal cual, en español, para filtrar/buscar).
//
// Cómo agregar un tag nuevo:
//   1. Copiá una línea de ejemplo y cambiá la clave (en español, tal cual
//      está escrita en data/*.json) y las 5 traducciones.
//   2. La clave tiene que ser EXACTAMENTE igual al tag guardado en los JSON
//      (mismos acentos y mayúscula inicial) o no va a encontrar la traducción.
//   3. Si un tag no está en este diccionario, no rompe nada: simplemente se
//      muestra en español en vez de traducido (ver getTagDisplay más abajo).
//   4. No hace falta tocar ningún otro archivo — este .js se carga solo.
//
// Idiomas sin entrada en este diccionario (hebreo, zulú, etc.) caen al
// inglés (en); si un tag ni siquiera tiene traducción al inglés todavía,
// se muestra en español antes que mostrar algo vacío (ver getTagDisplay).
// Guaraní (gn) es la única excepción: siempre se muestra en español.
const TAG_TRANSLATIONS = {
  "Adoración":              { it: "Adorazione",              pt: "Adoração",                 en: "Worship",                  fr: "Adoration",                  de: "Anbetung" },
  "Alabanza":                { it: "Lode",                    pt: "Louvor",                   en: "Praise",                   fr: "Louange",                    de: "Lob" },
  "Alegría":                 { it: "Gioia",                   pt: "Alegria",                  en: "Joy",                      fr: "Joie",                        de: "Freude" },
  "Amistad":                 { it: "Amicizia",                pt: "Amizade",                  en: "Friendship",               fr: "Amitié",                      de: "Freundschaft" },
  "Amor de Dios":            { it: "Amore di Dio",            pt: "Amor de Deus",             en: "God's Love",               fr: "Amour de Dieu",               de: "Liebe Gottes" },
  "Anhelo":                  { it: "Desiderio",               pt: "Anseio",                   en: "Longing",                  fr: "Désir",                       de: "Sehnsucht" },
  "Caminar":                 { it: "Cammino",                 pt: "Caminhar",                 en: "Walk",                     fr: "Marche",                      de: "Wandeln" },
  "Clásico":                 { it: "Classico",                pt: "Clássico",                 en: "Classic",                  fr: "Classique",                   de: "Klassisch" },
  "Club":                    { it: "Club",                    pt: "Clube",                    en: "Club",                     fr: "Club",                        de: "Club" },
  "Comunidad":                { it: "Comunità",                pt: "Comunidade",               en: "Community",                fr: "Communauté",                  de: "Gemeinschaft" },
  "Comunión":                { it: "Comunione",               pt: "Comunhão",                 en: "Communion",                fr: "Communion",                   de: "Gemeinschaft" },
  "Confianza":               { it: "Fiducia",                 pt: "Confiança",                en: "Trust",                    fr: "Confiance",                   de: "Vertrauen" },
  "Congregacional":          { it: "Congregazionale",         pt: "Congregacional",           en: "Congregational",           fr: "Congrégationnel",             de: "Gemeinde" },
  "Conquistadores":          { it: "Esploratori",             pt: "Desbravadores",            en: "Pathfinders",              fr: "Explorateurs",                de: "Pfadfinder" },
  "Consagración":            { it: "Consacrazione",           pt: "Consagração",              en: "Consecration",             fr: "Consécration",                de: "Weihe" },
  "Consuelo":                { it: "Conforto",                pt: "Consolo",                  en: "Comfort",                  fr: "Réconfort",                   de: "Trost" },
  "Coronación":              { it: "Incoronazione",           pt: "Coroação",                 en: "Coronation",               fr: "Couronnement",                de: "Krönung" },
  "Creación":                { it: "Creazione",               pt: "Criação",                  en: "Creation",                 fr: "Création",                    de: "Schöpfung" },
  "Devoción":                { it: "Devozione",               pt: "Devoção",                  en: "Devotion",                 fr: "Dévotion",                    de: "Hingabe" },
  "Entrega":                 { it: "Dedizione",               pt: "Entrega",                  en: "Surrender",                fr: "Abandon",                     de: "Übergabe" },
  "Esperanza":               { it: "Speranza",                pt: "Esperança",                en: "Hope",                     fr: "Espérance",                   de: "Hoffnung" },
  "Evangelismo":             { it: "Evangelizzazione",        pt: "Evangelismo",              en: "Evangelism",               fr: "Évangélisation",              de: "Evangelisation" },
  "Exaltación":              { it: "Esaltazione",             pt: "Exaltação",                en: "Exaltation",               fr: "Exaltation",                  de: "Erhöhung" },
  "Fe":                      { it: "Fede",                    pt: "Fé",                       en: "Faith",                    fr: "Foi",                         de: "Glaube" },
  "Felicidad":               { it: "Felicità",                pt: "Felicidade",               en: "Happiness",                fr: "Bonheur",                     de: "Glück" },
  "Fidelidad":               { it: "Fedeltà",                 pt: "Fidelidade",               en: "Faithfulness",             fr: "Fidélité",                    de: "Treue" },
  "Fraternidad":             { it: "Fratellanza",             pt: "Fraternidade",             en: "Brotherhood",              fr: "Fraternité",                  de: "Brüderlichkeit" },
  "Gospel":                  { it: "Gospel",                  pt: "Gospel",                   en: "Gospel",                   fr: "Gospel",                      de: "Gospel" },
  "Gozo":                    { it: "Gioia",                   pt: "Regozijo",                 en: "Gladness",                 fr: "Allégresse",                  de: "Frohlocken" },
  "Gracia":                  { it: "Grazia",                  pt: "Graça",                    en: "Grace",                    fr: "Grâce",                       de: "Gnade" },
  "Grandeza de Dios":        { it: "Grandezza di Dio",        pt: "Grandeza de Deus",         en: "God's Greatness",          fr: "Grandeur de Dieu",            de: "Größe Gottes" },
  "Gratitud":                { it: "Gratitudine",             pt: "Gratidão",                 en: "Gratitude",                fr: "Gratitude",                   de: "Dankbarkeit" },
  "Iglesia":                 { it: "Chiesa",                  pt: "Igreja",                   en: "Church",                   fr: "Église",                      de: "Kirche" },
  "Instrumentos":            { it: "Strumenti",               pt: "Instrumentos",             en: "Instruments",              fr: "Instruments",                 de: "Instrumente" },
  "Intimidad":               { it: "Intimità",                pt: "Intimidade",               en: "Intimacy",                 fr: "Intimité",                    de: "Nähe" },
  "Italiano":                { it: "Italiano",                pt: "Italiano",                 en: "Italian",                  fr: "Italien",                     de: "Italienisch" },
  "Jesucristo":              { it: "Gesù Cristo",             pt: "Jesus Cristo",             en: "Jesus Christ",             fr: "Jésus-Christ",                de: "Jesus Christus" },
  "Jóvenes":                 { it: "Giovani",                 pt: "Jovens",                   en: "Youth",                    fr: "Jeunesse",                    de: "Jugend" },
  "Júbilo":                  { it: "Giubilo",                 pt: "Júbilo",                   en: "Jubilation",               fr: "Jubilation",                  de: "Jubel" },
  "Justificación":           { it: "Giustificazione",         pt: "Justificação",             en: "Justification",            fr: "Justification",               de: "Rechtfertigung" },
  "Luz":                     { it: "Luce",                    pt: "Luz",                      en: "Light",                    fr: "Lumière",                     de: "Licht" },
  "Majestad":                { it: "Maestà",                  pt: "Majestade",                en: "Majesty",                  fr: "Majesté",                     de: "Majestät" },
  "Majestuoso":              { it: "Maestoso",                pt: "Majestoso",                en: "Majestic",                 fr: "Majestueux",                  de: "Majestätisch" },
  "Misericordia":            { it: "Misericordia",            pt: "Misericórdia",             en: "Mercy",                    fr: "Miséricorde",                 de: "Barmherzigkeit" },
  "Misión":                  { it: "Missione",                pt: "Missão",                   en: "Mission",                  fr: "Mission",                     de: "Mission" },
  "Multilingüe":             { it: "Multilingue",             pt: "Multilíngue",              en: "Multilingual",             fr: "Multilingue",                 de: "Mehrsprachig" },
  "Música tradicional hebrea": { it: "Musica tradizionale ebraica", pt: "Música tradicional hebraica", en: "Traditional Hebrew Music", fr: "Musique traditionnelle hébraïque", de: "Traditionelle hebräische Musik" },
  "Navidad":                 { it: "Natale",                  pt: "Natal",                    en: "Christmas",                fr: "Noël",                        de: "Weihnachten" },
  "Nueva Jerusalén":         { it: "Nuova Gerusalemme",       pt: "Nova Jerusalém",           en: "New Jerusalem",            fr: "Nouvelle Jérusalem",          de: "Neues Jerusalem" },
  "Oración":                 { it: "Preghiera",               pt: "Oração",                   en: "Prayer",                   fr: "Prière",                      de: "Gebet" },
  "Paz":                     { it: "Pace",                    pt: "Paz",                      en: "Peace",                    fr: "Paix",                        de: "Frieden" },
  "Petición":                { it: "Supplica",                pt: "Súplica",                  en: "Petition",                 fr: "Supplication",                de: "Bitte" },
  "Purificación":            { it: "Purificazione",           pt: "Purificação",              en: "Purification",             fr: "Purification",                de: "Reinigung" },
  "Sacrificio":              { it: "Sacrificio",              pt: "Sacrifício",               en: "Sacrifice",                fr: "Sacrifice",                   de: "Opfer" },
  "Salvación":               { it: "Salvezza",                pt: "Salvação",                 en: "Salvation",                fr: "Salut",                       de: "Erlösung" },
  "Scout":                   { it: "Scout",                   pt: "Escoteiro",                en: "Scout",                    fr: "Scout",                       de: "Pfadfinder" },
  "Segunda Venida":          { it: "Seconda Venuta",          pt: "Segunda Vinda",            en: "Second Coming",            fr: "Second Avènement",            de: "Wiederkunft" },
  "Servicio":                { it: "Servizio",                pt: "Serviço",                  en: "Service",                  fr: "Service",                     de: "Dienst" },
  "Testimonio":              { it: "Testimonianza",           pt: "Testemunho",               en: "Testimony",                fr: "Témoignage",                  de: "Zeugnis" },
  "Trinidad":                { it: "Trinità",                 pt: "Trindade",                 en: "Trinity",                  fr: "Trinité",                     de: "Dreieinigkeit" },
  "Unidad":                  { it: "Unità",                   pt: "Unidade",                  en: "Unity",                    fr: "Unité",                       de: "Einheit" },
  "Vida":                    { it: "Vita",                    pt: "Vida",                     en: "Life",                     fr: "Vie",                         de: "Leben" },
  "Villancico":              { it: "Canto di Natale",         pt: "Cântico Natalino",         en: "Christmas Carol",          fr: "Chant de Noël",               de: "Weihnachtslied" }
};

// texto a mostrar de un tag según el idioma: es/gn siempre en español (tal
// cual está guardado); it/pt/en/fr/de usan el diccionario de arriba; el
// resto de los idiomas (hebreo, zulú, etc., o cualquiera sin traducción
// puntual de este tag) cae al inglés — y si ni eso hay, se muestra en
// español antes que mostrar algo vacío
function getTagDisplay(tagEspanol, lang) {
  if (!lang || lang === "es" || lang === "gn") return tagEspanol;

  const traducciones = TAG_TRANSLATIONS[tagEspanol];
  if (!traducciones) return tagEspanol;

  return traducciones[lang] || traducciones.en || tagEspanol;
}
