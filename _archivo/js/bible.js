// Crear función de traducción
function translateBibleRef(refArray, lang = "es") {
  if (!Array.isArray(refArray)) return [];

  const map = BIBLE_BOOKS[lang] || BIBLE_BOOKS.es;

  return refArray.map(ref => {
    const parts = ref.split(" ");
    const chapter = parts.pop();
    const book = parts.join(" ");

    const translated = map[book] || book;

    return `${translated} ${chapter}`;
  });
}

// BASE DE TRADUCCIONES
// ===============================
// LISTA BASE DE LIBROS
// ===============================
const BIBLE_BOOKS_LIST = [
  "Genesis","Exodus","Leviticus","Numbers","Deuteronomy",
  "Joshua","Judges","Ruth",
  "1 Samuel","2 Samuel",
  "1 Kings","2 Kings",
  "1 Chronicles","2 Chronicles",
  "Ezra","Nehemiah","Esther",
  "Job","Psalms","Proverbs","Ecclesiastes","Song of Solomon",
  "Isaiah","Jeremiah","Lamentations","Ezekiel","Daniel",
  "Hosea","Joel","Amos","Obadiah","Jonah","Micah","Nahum","Habakkuk","Zephaniah","Haggai","Zechariah","Malachi",
  "Matthew","Mark","Luke","John",
  "Acts","Romans",
  "1 Corinthians","2 Corinthians",
  "Galatians","Ephesians","Philippians","Colossians",
  "1 Thessalonians","2 Thessalonians",
  "1 Timothy","2 Timothy","Titus","Philemon",
  "Hebrews","James","1 Peter","2 Peter","1 John","2 John","3 John","Jude","Revelation"
];

// ===============================
// TRADUCCIONES
// ===============================
const BIBLE_BOOKS = {
  es: {
    "Genesis":"Génesis","Exodus":"Éxodo","Leviticus":"Levítico","Numbers":"Números","Deuteronomy":"Deuteronomio",
    "Joshua":"Josué","Judges":"Jueces","Ruth":"Rut",
    "1 Samuel":"1 Samuel","2 Samuel":"2 Samuel",
    "1 Kings":"1 Reyes","2 Kings":"2 Reyes",
    "1 Chronicles":"1 Crónicas","2 Chronicles":"2 Crónicas",
    "Ezra":"Esdras","Nehemiah":"Nehemías","Esther":"Ester",
    "Job":"Job","Psalms":"Salmos","Proverbs":"Proverbios","Ecclesiastes":"Eclesiastés","Song of Solomon":"Cantar de los Cantares",
    "Isaiah":"Isaías","Jeremiah":"Jeremías","Lamentations":"Lamentaciones","Ezekiel":"Ezequiel","Daniel":"Daniel",
    "Hosea":"Oseas","Joel":"Joel","Amos":"Amós","Obadiah":"Abdías","Jonah":"Jonás","Micah":"Miqueas","Nahum":"Nahúm","Habakkuk":"Habacuc","Zephaniah":"Sofonías","Haggai":"Hageo","Zechariah":"Zacarías","Malachi":"Malaquías",
    "Matthew":"Mateo","Mark":"Marcos","Luke":"Lucas","John":"Juan",
    "Acts":"Hechos","Romans":"Romanos",
    "1 Corinthians":"1 Corintios","2 Corinthians":"2 Corintios",
    "Galatians":"Gálatas","Ephesians":"Efesios","Philippians":"Filipenses","Colossians":"Colosenses",
    "1 Thessalonians":"1 Tesalonicenses","2 Thessalonians":"2 Tesalonicenses",
    "1 Timothy":"1 Timoteo","2 Timothy":"2 Timoteo","Titus":"Tito","Philemon":"Filemón",
    "Hebrews":"Hebreos","James":"Santiago","1 Peter":"1 Pedro","2 Peter":"2 Pedro","1 John":"1 Juan","2 John":"2 Juan","3 John":"3 Juan","Jude":"Judas","Revelation":"Apocalipsis"
    },
  en: Object.fromEntries(
    BIBLE_BOOKS_LIST.map(book => [book, book])
  ),
  
  it: {
    "Genesis":"Genesi","Exodus":"Esodo","Leviticus":"Levitico","Numbers":"Numeri","Deuteronomy":"Deuteronomio",
    "Joshua":"Giosuè","Judges":"Giudici","Ruth":"Rut",
    "1 Samuel":"1 Samuele","2 Samuel":"2 Samuele",
    "1 Kings":"1 Re","2 Kings":"2 Re",
    "1 Chronicles":"1 Cronache","2 Chronicles":"2 Cronache",
    "Ezra":"Esdra","Nehemiah":"Neemia","Esther":"Ester",
    "Job":"Giobbe","Psalms":"Salmi","Proverbs":"Proverbi","Ecclesiastes":"Ecclesiaste","Song of Solomon":"Cantico dei Cantici",
    "Isaiah":"Isaia","Jeremiah":"Geremia","Lamentations":"Lamentazioni","Ezekiel":"Ezechiele","Daniel":"Daniele",
    "Hosea":"Osea","Joel":"Gioele","Amos":"Amos","Obadiah":"Abdia","Jonah":"Giona","Micah":"Michea","Nahum":"Naum","Habakkuk":"Abacuc","Zephaniah":"Sofonia","Haggai":"Aggeo","Zechariah":"Zaccaria","Malachi":"Malachia",
    "Matthew":"Matteo","Mark":"Marco","Luke":"Luca","John":"Giovanni",
    "Acts":"Atti","Romans":"Romani",
    "1 Corinthians":"1 Corinzi","2 Corinthians":"2 Corinzi",
    "Galatians":"Galati","Ephesians":"Efesini","Philippians":"Filippesi","Colossians":"Colossesi",
    "1 Thessalonians":"1 Tessalonicesi","2 Thessalonians":"2 Tessalonicesi",
    "1 Timothy":"1 Timoteo","2 Timothy":"2 Timoteo","Titus":"Tito","Philemon":"Filemone",
    "Hebrews":"Ebrei","James":"Giacomo","1 Peter":"1 Pietro","2 Peter":"2 Pietro","1 John":"1 Giovanni","2 John":"2 Giovanni","3 John":"3 Giovanni","Jude":"Giuda","Revelation":"Apocalisse"
    },
  pt: {
    "Genesis":"Gênesis","Exodus":"Êxodo","Leviticus":"Levítico","Numbers":"Números","Deuteronomy":"Deuteronômio",
    "Joshua":"Josué","Judges":"Juízes","Ruth":"Rute",
    "1 Samuel":"1 Samuel","2 Samuel":"2 Samuel",
    "1 Kings":"1 Reis","2 Kings":"2 Reis",
    "1 Chronicles":"1 Crônicas","2 Chronicles":"2 Crônicas",
    "Ezra":"Esdras","Nehemiah":"Neemias","Esther":"Ester",
    "Job":"Jó","Psalms":"Salmos","Proverbs":"Provérbios","Ecclesiastes":"Eclesiastes","Song of Solomon":"Cântico dos Cânticos",
    "Isaiah":"Isaías","Jeremiah":"Jeremias","Lamentations":"Lamentações","Ezekiel":"Ezequiel","Daniel":"Daniel",
    "Hosea":"Oséias","Joel":"Joel","Amos":"Amós","Obadiah":"Obadias","Jonah":"Jonas","Micah":"Miquéias","Nahum":"Naum","Habakkuk":"Habacuque","Zephaniah":"Sofonias","Haggai":"Ageu","Zechariah":"Zacarias","Malachi":"Malaquias",
    "Matthew":"Mateus","Mark":"Marcos","Luke":"Lucas","John":"João",
    "Acts":"Atos","Romans":"Romanos",
    "1 Corinthians":"1 Coríntios","2 Corinthians":"2 Coríntios",
    "Galatians":"Gálatas","Ephesians":"Efésios","Philippians":"Filipenses","Colossians":"Colossenses",
    "1 Thessalonians":"1 Tessalonicenses","2 Thessalonians":"2 Tessalonicenses",
    "1 Timothy":"1 Timóteo","2 Timothy":"2 Timóteo","Titus":"Tito","Philemon":"Filemom",
    "Hebrews":"Hebreus","James":"Tiago","1 Peter":"1 Pedro","2 Peter":"2 Pedro","1 John":"1 João","2 John":"2 João","3 John":"3 João","Jude":"Judas","Revelation":"Apocalipse"
    },
  fr: {
    "Genesis":"Genèse","Exodus":"Exode","Leviticus":"Lévitique","Numbers":"Nombres","Deuteronomy":"Deutéronome",
    "Joshua":"Josué","Judges":"Juges","Ruth":"Ruth",
    "1 Samuel":"1 Samuel","2 Samuel":"2 Samuel",
    "1 Kings":"1 Rois","2 Kings":"2 Rois",
    "1 Chronicles":"1 Chroniques","2 Chronicles":"2 Chroniques",
    "Ezra":"Esdras","Nehemiah":"Néhémie","Esther":"Esther",
    "Job":"Job","Psalms":"Psaumes","Proverbs":"Proverbes","Ecclesiastes":"Ecclésiaste","Song of Solomon":"Cantique des Cantiques",
    "Isaiah":"Ésaïe","Jeremiah":"Jérémie","Lamentations":"Lamentations","Ezekiel":"Ézéchiel","Daniel":"Daniel",
    "Hosea":"Osée","Joel":"Joël","Amos":"Amos","Obadiah":"Abdias","Jonah":"Jonas","Micah":"Michée","Nahum":"Nahoum","Habakkuk":"Habacuc","Zephaniah":"Sophonie","Haggai":"Aggée","Zechariah":"Zacharie","Malachi":"Malachie",
    "Matthew":"Matthieu","Mark":"Marc","Luke":"Luc","John":"Jean",
    "Acts":"Actes","Romans":"Romains",
    "1 Corinthians":"1 Corinthiens","2 Corinthians":"2 Corinthiens",
    "Galatians":"Galates","Ephesians":"Éphésiens","Philippians":"Philippiens","Colossians":"Colossiens",
    "1 Thessalonians":"1 Thessaloniciens","2 Thessalonians":"2 Thessaloniciens",
    "1 Timothy":"1 Timothée","2 Timothy":"2 Timothée","Titus":"Tite","Philemon":"Philémon",
    "Hebrews":"Hébreux","James":"Jacques","1 Peter":"1 Pierre","2 Peter":"2 Pierre","1 John":"1 Jean","2 John":"2 Jean","3 John":"3 Jean","Jude":"Jude","Revelation":"Apocalypse"
    },
  de: {
    "Genesis":"Genesis","Exodus":"Exodus","Leviticus":"Levitikus","Numbers":"Numeri","Deuteronomy":"Deuteronomium",
    "Joshua":"Josua","Judges":"Richter","Ruth":"Rut",
    "1 Samuel":"1 Samuel","2 Samuel":"2 Samuel",
    "1 Kings":"1 Könige","2 Kings":"2 Könige",
    "1 Chronicles":"1 Chronik","2 Chronicles":"2 Chronik",
    "Ezra":"Esra","Nehemiah":"Nehemia","Esther":"Esther",
    "Job":"Hiob","Psalms":"Psalmen","Proverbs":"Sprüche","Ecclesiastes":"Prediger","Song of Solomon":"Hoheslied",
    "Isaiah":"Jesaja","Jeremiah":"Jeremia","Lamentations":"Klagelieder","Ezekiel":"Hesekiel","Daniel":"Daniel",
    "Hosea":"Hosea","Joel":"Joel","Amos":"Amos","Obadiah":"Obadja","Jonah":"Jona","Micah":"Micha","Nahum":"Nahum","Habakkuk":"Habakuk","Zephaniah":"Zefanja","Haggai":"Haggai","Zechariah":"Sacharja","Malachi":"Maleachi",
    "Matthew":"Matthäus","Mark":"Markus","Luke":"Lukas","John":"Johannes",
    "Acts":"Apostelgeschichte","Romans":"Römer",
    "1 Corinthians":"1 Korinther","2 Corinthians":"2 Korinther",
    "Galatians":"Galater","Ephesians":"Epheser","Philippians":"Philipper","Colossians":"Kolosser",
    "1 Thessalonians":"1 Thessalonicher","2 Thessalonians":"2 Thessalonicher",
    "1 Timothy":"1 Timotheus","2 Timothy":"2 Timotheus","Titus":"Titus","Philemon":"Philemon",
    "Hebrews":"Hebräer","James":"Jakobus","1 Peter":"1 Petrus","2 Peter":"2 Petrus","1 John":"1 Johannes","2 John":"2 Johannes","3 John":"3 Johannes","Jude":"Judas","Revelation":"Offenbarung"
    },
  he: {
    "Genesis":"בראשית","Exodus":"שמות","Leviticus":"ויקרא","Numbers":"במדבר","Deuteronomy":"דברים",
    "Joshua":"יהושע","Judges":"שופטים","Ruth":"רות",
    "1 Samuel":"שמואל א","2 Samuel":"שמואל ב",
    "1 Kings":"מלכים א","2 Kings":"מלכים ב",
    "1 Chronicles":"דברי הימים א","2 Chronicles":"דברי הימים ב",
    "Ezra":"עזרא","Nehemiah":"נחמיה","Esther":"אסתר",
    "Job":"איוב","Psalms":"תהילים","Proverbs":"משלי","Ecclesiastes":"קהלת","Song of Solomon":"שיר השירים",
    "Isaiah":"ישעיהו","Jeremiah":"ירמיהו","Lamentations":"איכה","Ezekiel":"יחזקאל","Daniel":"דניאל",
    "Hosea":"הושע","Joel":"יואל","Amos":"עמוס","Obadiah":"עובדיה","Jonah":"יונה","Micah":"מיכה","Nahum":"נחום","Habakkuk":"חבקוק","Zephaniah":"צפניה","Haggai":"חגי","Zechariah":"זכריה","Malachi":"מלאכי",
    "Matthew":"מתי","Mark":"מרקוס","Luke":"לוקס","John":"יוחנן",
    "Acts":"מעשי השליחים","Romans":"רומים",
    "1 Corinthians":"קורינתים א","2 Corinthians":"קורינתים ב",
    "Galatians":"גלטים","Ephesians":"אפסים","Philippians":"פיליפים","Colossians":"קולוסים",
    "1 Thessalonians":"תסלוניקים א","2 Thessalonians":"תסלוניקים ב",
    "1 Timothy":"טימותיאוס א","2 Timothy":"טימותיאוס ב","Titus":"טיטוס","Philemon":"פילימון",
    "Hebrews":"עברים","James":"יעקב","1 Peter":"פטרוס א","2 Peter":"פטרוס ב","1 John":"יוחנן א","2 John":"יוחנן ב","3 John":"יוחנן ג","Jude":"יהודה","Revelation":"התגלות"
    },
  sw: {
    "Genesis":"Mwanzo","Exodus":"Kutoka","Leviticus":"Mambo ya Walawi","Numbers":"Hesabu","Deuteronomy":"Kumbukumbu la Torati",
    "Joshua":"Yoshua","Judges":"Waamuzi","Ruth":"Ruthu",
    "1 Samuel":"1 Samweli","2 Samuel":"2 Samweli",
    "1 Kings":"1 Wafalme","2 Kings":"2 Wafalme",
    "1 Chronicles":"1 Mambo ya Nyakati","2 Chronicles":"2 Mambo ya Nyakati",
    "Ezra":"Ezra","Nehemiah":"Nehemia","Esther":"Esta",
    "Job":"Ayubu","Psalms":"Zaburi","Proverbs":"Mithali","Ecclesiastes":"Mhubiri","Song of Solomon":"Wimbo Ulio Bora",
    "Isaiah":"Isaya","Jeremiah":"Yeremia","Lamentations":"Maombolezo","Ezekiel":"Ezekieli","Daniel":"Danieli",
    "Hosea":"Hosea","Joel":"Yoeli","Amos":"Amosi","Obadiah":"Obadia","Jonah":"Yona","Micah":"Mika","Nahum":"Nahumu","Habakkuk":"Habakuki","Zephaniah":"Sefania","Haggai":"Hagai","Zechariah":"Zekaria","Malachi":"Malaki",
    "Matthew":"Mathayo","Mark":"Marko","Luke":"Luka","John":"Yohana",
    "Acts":"Matendo","Romans":"Warumi",
    "1 Corinthians":"1 Wakorintho","2 Corinthians":"2 Wakorintho",
    "Galatians":"Wagalatia","Ephesians":"Waefeso","Philippians":"Wafilipi","Colossians":"Wakolosai",
    "1 Thessalonians":"1 Wathesalonike","2 Thessalonians":"2 Wathesalonike",
    "1 Timothy":"1 Timotheo","2 Timothy":"2 Timotheo","Titus":"Tito","Philemon":"Filemoni",
    "Hebrews":"Waebrania","James":"Yakobo","1 Peter":"1 Petro","2 Peter":"2 Petro","1 John":"1 Yohana","2 John":"2 Yohana","3 John":"3 Yohana","Jude":"Yuda","Revelation":"Ufunuo"
    },
  zu: {
    "Genesis":"UGenesise","Exodus":"U-Eksodusi","Leviticus":"ULevitikusi","Numbers":"Izinombolo","Deuteronomy":"UDuteronomi",
    "Joshua":"UJoshua","Judges":"AbaHluleli","Ruth":"URuthe",
    "1 Samuel":"1 Samuweli","2 Samuel":"2 Samuweli",
    "1 Kings":"1 AmaKhosi","2 Kings":"2 AmaKhosi",
    "1 Chronicles":"1 IziKronike","2 Chronicles":"2 IziKronike",
    "Ezra":"U-Ezra","Nehemiah":"UNehemiya","Esther":"U-Esteri",
    "Job":"UJobe","Psalms":"AmaHubo","Proverbs":"Izaga","Ecclesiastes":"UmShumayeli","Song of Solomon":"IsiHlabelelo SeziHlabelelo",
    "Isaiah":"U-Isaya","Jeremiah":"UJeremiya","Lamentations":"IsiLilo","Ezekiel":"UHezekeli","Daniel":"UDaniyeli",
    "Hosea":"UHoseya","Joel":"UJoweli","Amos":"U-Amosi","Obadiah":"U-Obadiya","Jonah":"UJona","Micah":"UMika","Nahum":"UNahume","Habakkuk":"UHabhakuki","Zephaniah":"USofaniya","Haggai":"UHagayi","Zechariah":"UZakariya","Malachi":"UMalaki",
    "Matthew":"UMathewu","Mark":"UMarku","Luke":"ULuka","John":"UJohane",
    "Acts":"IzEnzo","Romans":"KwabaseRoma",
    "1 Corinthians":"1 KwabaseKorinte","2 Corinthians":"2 KwabaseKorinte",
    "Galatians":"KwabaseGalathiya","Ephesians":"Kwabase-Efesu","Philippians":"KwabaseFilipi","Colossians":"KwabaseKholose",
    "1 Thessalonians":"1 KwabaseThesalonika","2 Thessalonians":"2 KwabaseThesalonika",
    "1 Timothy":"1 KuThimothewu","2 Timothy":"2 KuThimothewu","Titus":"KuThithu","Philemon":"KuFilemoni",
    "Hebrews":"KumaHeberu","James":"KaJakobe","1 Peter":"1 KaPetru","2 Peter":"2 KaPetru","1 John":"1 KaJohane","2 John":"2 KaJohane","3 John":"3 KaJohane","Jude":"KaJuda","Revelation":"IsAmbulo"
    },
  af: {
    "Genesis":"Genesis","Exodus":"Eksodus","Leviticus":"Levitikus","Numbers":"Numeri","Deuteronomy":"Deuteronomium",
    "Joshua":"Josua","Judges":"Rigters","Ruth":"Rut",
    "1 Samuel":"1 Samuel","2 Samuel":"2 Samuel",
    "1 Kings":"1 Konings","2 Kings":"2 Konings",
    "1 Chronicles":"1 Kronieke","2 Chronicles":"2 Kronieke",
    "Ezra":"Esra","Nehemiah":"Nehemia","Esther":"Ester",
    "Job":"Job","Psalms":"Psalms","Proverbs":"Spreuke","Ecclesiastes":"Prediker","Song of Solomon":"Hooglied",
    "Isaiah":"Jesaja","Jeremiah":"Jeremia","Lamentations":"Klaagliedere","Ezekiel":"Esegiël","Daniel":"Daniël",
    "Hosea":"Hosea","Joel":"Joël","Amos":"Amos","Obadiah":"Obadja","Jonah":"Jona","Micah":"Miga","Nahum":"Nahum","Habakkuk":"Habakuk","Zephaniah":"Sefanja","Haggai":"Haggai","Zechariah":"Sagaria","Malachi":"Maleagi",
    "Matthew":"Matteus","Mark":"Markus","Luke":"Lukas","John":"Johannes",
    "Acts":"Handelinge","Romans":"Romeine",
    "1 Corinthians":"1 Korintiërs","2 Corinthians":"2 Korintiërs",
    "Galatians":"Galasiërs","Ephesians":"Efesiërs","Philippians":"Filippense","Colossians":"Kolossense",
    "1 Thessalonians":"1 Tessalonisense","2 Thessalonians":"2 Tessalonisense",
    "1 Timothy":"1 Timoteus","2 Timothy":"2 Timoteus","Titus":"Titus","Philemon":"Filemon",
    "Hebrews":"Hebreërs","James":"Jakobus","1 Peter":"1 Petrus","2 Peter":"2 Petrus","1 John":"1 Johannes","2 John":"2 Johannes","3 John":"3 Johannes","Jude":"Judas","Revelation":"Openbaring"
    },
  gn: {
    "Genesis":"Génesis", "Exodus":"Éxodo", "Leviticus":"Levítico", "Numbers":"Papapykuéra", "Deuteronomy":"Deuteronomio",
    "Joshua":"Josué", "Judges":"Mburuvichakuéra", "Ruth":"Rut",
    "1 Samuel":"1 Samuel", "2 Samuel":"2 Samuel",
    "1 Kings":"1 Reyes", "2 Kings":"2 Reyes",
    "1 Chronicles":"1 Crónicas", "2 Chronicles":"2 Crónicas",
    "Ezra":"Esdras", "Nehemiah":"Nehemías", "Esther":"Ester", "Job":"Job", "Psalms":"Salmos", "Proverbs":"Proverbios",
    "Ecclesiastes":"Eclesiastés", "Song of Solomon":"Purahéi Guasu", "Isaiah":"Isaías", "Jeremiah":"Jeremías",
    "Lamentations":"Jeremías Jahe'o", "Ezekiel":"Ezequiel", "Daniel":"Daniel", "Hosea":"Oseas", "Joel":"Joel",
    "Amos":"Amós", "Obadiah":"Abdías", "Jonah":"Jonás", "Micah":"Miqueas", "Nahum":"Nahúm", "Habakkuk":"Habacuc", 
    "Zephaniah":"Sofonías", "Haggai":"Hageo", "Zechariah":"Zacarías", "Malachi":"Malaquías",
    "Matthew":"Mateo", "Mark":"Marcos", "Luke":"Lucas", "John":"Juan", "Acts":"Apostolkuéra Rembiapo", "Romans":"Romanos",
    "1 Corinthians":"1 Corintios", "2 Corinthians":"2 Corintios",  "Galatians":"Gálatas", "Ephesians":"Efesios", "Philippians":"Filipenses",
    "Colossians":"Colosenses", "1 Thessalonians":"1 Tesalonicenses", "2 Thessalonians":"2 Tesalonicenses", "1 Timothy":"1 Timoteo",
    "2 Timothy":"2 Timoteo", "Titus":"Tito", "Philemon":"Filemón", "Hebrews":"Hebreos", "James":"Santiago",
    "1 Peter":"1 Pedro", "2 Peter":"2 Pedro", "1 John":"1 Juan", "2 John":"2 Juan", "3 John":"3 Juan", "Jude":"Judas", "Revelation":"Apocalipsis"
    },
  is: {
    "Genesis":"Genesis","Exodus":"Exodus","Leviticus":"3. Mósebók","Numbers":"4. Mósebók","Deuteronomy":"5. Mósebók",
    "Joshua":"Jósúabók","Judges":"Dómarabók","Ruth":"Rutarbók",
    "1 Samuel":"1. Samúelsbók","2 Samuel":"2. Samúelsbók",
    "1 Kings":"1. Konungabók","2 Kings":"2. Konungabók",
    "1 Chronicles":"1. Kroníkubók","2 Chronicles":"2. Kroníkubók",
    "Ezra":"Esrabók","Nehemiah":"Nehemíabók","Esther":"Esterarbók",
    "Job":"Jobsbók","Psalms":"Sálmarnir","Proverbs":"Orðskviðir","Ecclesiastes":"Prédikarinn","Song of Solomon":"Ljóðaljóðin",
    "Isaiah":"Jesaja","Jeremiah":"Jeremía","Lamentations":"Harmljóðin","Ezekiel":"Esekíel","Daniel":"Daníel",
    "Hosea":"Hósea","Joel":"Jóel","Amos":"Amos","Obadiah":"Óbadía","Jonah":"Jónas","Micah":"Míka","Nahum":"Nahúm","Habakkuk":"Habakkúk","Zephaniah":"Sefanía","Haggai":"Haggai","Zechariah":"Sakaría","Malachi":"Malakí",
    "Matthew":"Matteus","Mark":"Markús","Luke":"Lúkas","John":"Jóhannes",
    "Acts":"Postulasagan","Romans":"Rómverjabréfið",
    "1 Corinthians":"1. Korintubréf","2 Corinthians":"2. Korintubréf",
    "Galatians":"Galatabréfið","Ephesians":"Efesusbréfið","Philippians":"Filippíbréfið","Colossians":"Kólossubréfið",
    "1 Thessalonians":"1. Þessaloníkubréf","2 Thessalonians":"2. Þessaloníkubréf",
    "1 Timothy":"1. Tímóteusarbréf","2 Timothy":"2. Tímóteusarbréf","Titus":"Títusarbréf","Philemon":"Fílemonsbréf",
    "Hebrews":"Hebreabréfið","James":"Jakobsbréf","1 Peter":"1. Pétursbréf","2 Peter":"2. Pétursbréf","1 John":"1. Jóhannesarbréf","2 John":"2. Jóhannesarbréf","3 John":"3. Jóhannesarbréf","Jude":"Júdasarbréf","Revelation":"Opinberunarbókin"
    }
};


