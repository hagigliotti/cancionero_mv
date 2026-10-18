const MANUAL_VERSION="2.68.1",MANUAL_FECHA="18/10/2026",MANUAL_CAPITULOS=[{id:"inicio",icono:"\u{1F44B}",titulo:"Primeros pasos",html:`
      <p><strong>Cancionero MV</strong> es una app gratuita, sin publicidad, para cantar y tocar: m\xE1s de 2.000 cantos e himnos con letra, acordes, audio, partituras y presentaciones, en varios idiomas.</p>
      <h4>C\xF3mo abrirla</h4>
      <ul>
        <li>Desde cualquier navegador: <b>hagigliotti.github.io/cancionero_mv</b>. Funciona en celular, tablet, computadora y televisor.</li>
        <li>Se puede <b>instalar como app</b> (\xEDcono en la pantalla de inicio). Ver el cap\xEDtulo <i>Instalar la app</i>.</li>
      </ul>
      <h4>Sin internet</h4>
      <ul>
        <li>Una vez abierta con internet, la app queda guardada en el dispositivo: las letras y los acordes se pueden usar <b>sin conexi\xF3n</b>.</li>
        <li>Cuando no hay internet aparece el aviso <b>\u{1F4F4} Sin conexi\xF3n</b>. Lo que necesita internet (audios, partituras, presentaciones) vuelve a funcionar solo cuando vuelve la conexi\xF3n.</li>
      </ul>
      <h4>Actualizaciones</h4>
      <ul>
        <li>La app se actualiza sola. Cuando hay una versi\xF3n nueva aparece un aviso abajo: tocalo para cargarla.</li>
        <li>Si algo se ve viejo o raro: <b>\u2630 Men\xFA \u2192 Informaci\xF3n de la app \u2192 \u{1F504} Forzar actualizaci\xF3n</b>. Baja la app entera de nuevo; tus listas, playlists, notas y ajustes no se pierden. Necesita internet.</li>
        <li>Si algo nuevo no aparece, cerr\xE1 la pesta\xF1a (o la app) y volv\xE9 a abrirla.</li>
      </ul>`},{id:"pantalla",icono:"\u{1F3E0}",titulo:"La pantalla principal",html:`
      <ul>
        <li><b>Logo</b> arriba. Debajo, el <b>vers\xEDculo de bienvenida</b> (Salmo 146:2), que se ve siempre que no hay una canci\xF3n abierta, tambi\xE9n al cambiar de libro.</li>
        <li><b>\u2630 Men\xFA</b> (izquierda): todas las opciones y ajustes.</li>
        <li><b>\u{1F50E} Buscador</b> (centro): ver el cap\xEDtulo <i>Buscar</i>. La <b>\u2715</b> lo borra y vuelve al inicio.</li>
        <li><b>Bandera</b> (derecha): idioma de la app y de las canciones. Ver el cap\xEDtulo <i>Idiomas</i>.</li>
        <li><b>Barra de letras</b> (abc, #, A, B, C\u2026): abre la lista de cantos que empiezan con esa letra. Las flechas \u25C0 \u25B6 a los costados la deslizan. En los himnarios aparece adem\xE1s una barra de <b>rangos de n\xFAmeros</b> (1-50, 51-100\u2026).</li>
        <li>Al bajar, el buscador y la barra de letras quedan fijos arriba.</li>
      </ul>`},{id:"libros",icono:"\u{1F4DA}",titulo:"Los libros",html:`
      <p>Se elige el libro en <b>\u2630 Men\xFA \u2192 Recursos \u2192 Libro</b>.</p>
      <ul>
        <li><b>Cancionero MV</b> \u2014 coritos y cantos (marca <b>C</b>).</li>
        <li><b>Himnario Adventista 2009</b> \u2014 por n\xFAmero (marca <b>'09</b>).</li>
        <li><b>Himnario Adventista 1962</b> \u2014 por n\xFAmero (marca <b>'62</b>).</li>
        <li><b>Melod\xEDas de Victoria</b> \u2014 por n\xFAmero (marca <b>MV</b>).</li>
        <li><b>Innario Avventista</b> \u2014 himnario en italiano (marca <b>IA</b>).</li>
        <li><b>Campamento</b> \u2014 cantos de campamento.</li>
      </ul>
      <h4>Detalles</h4>
      <ul>
        <li>En el <b>Cancionero MV</b> tambi\xE9n aparecen los <b>coritos</b> de los himnarios (por ejemplo, \xABEn mi vivir\xBB, n.\xBA 574 del Himnario 2009).</li>
        <li>Junto a la bandera de cada canto aparece la <b>marca de otros libros</b> donde est\xE1 ese mismo canto (C, '09, '62, MV, IA). Toc\xE1ndola se abre en ese libro.</li>
        <li>Algunos libros tienen un <b>idioma fijo</b> (por ejemplo, el Innario en italiano): al entrar, la app pasa sola a ese idioma.</li>
      </ul>`},{id:"buscar",icono:"\u{1F50E}",titulo:"Buscar un canto",html:`
      <ul>
        <li>Escrib\xED en el buscador: busca a la vez por <b>t\xEDtulo</b>, <b>letra</b>, <b>autor</b>, <b>compositor</b>, <b>ritmo</b>, <b>temas</b> y <b>n\xFAmero de himno</b>. No hace falta escribir el nombre exacto ni los acentos.</li>
        <li>Busca en <b>todos los libros</b> a la vez; cada resultado muestra sus banderas y la marca de su libro. Si el mismo canto est\xE1 en varios libros (por ejemplo el Himnario 2009 y el de 1962) aparece <b>una sola vez</b>, el del libro que est\xE1s mirando; los otros libros figuran como marca ('62, '09\u2026) al costado de la bandera.</li>
        <li>Toc\xE1 un resultado para abrirlo. La <b>\u2715</b> borra la b\xFAsqueda.</li>
        <li>Si no hay resultados, la app sugiere probar con otras palabras.</li>
      </ul>`},{id:"cancion",icono:"\u{1F3B5}",titulo:"La canci\xF3n abierta",html:`
      <h4>Arriba</h4>
      <ul>
        <li><b>T\xEDtulo</b> y <b>\u2B50</b> para agregarla a Mis Listas.</li>
        <li><b>Telepr\xF3nter</b> \u25B6 con \u2212 / + de velocidad (ver cap\xEDtulo <i>Telepr\xF3nter</i>).</li>
      </ul>
      <h4>Ficha del canto</h4>
      <ul>
        <li><b>Idiomas</b>: una bandera por cada idioma en que est\xE1 la letra. Toc\xE1 una para cambiar.</li>
        <li><b>Original / Otros t\xEDtulos</b>, <b>Autor</b>, <b>Compositor</b>, <b>Traductor</b>, <b>A\xF1o</b>. Tocando un nombre ves todos sus cantos.</li>
        <li><b>Referencia b\xEDblica</b> con enlace al pasaje.</li>
        <li><b>Tonalidad</b>, <b>BPM</b> y <b>Comp\xE1s</b>: toc\xE1ndolos se abre el afinador o el metr\xF3nomo con ese dato.</li>
        <li><b>Ritmo</b>, <b>Partitura</b> (si existe, se abre adentro de la app), <b>Temas</b> (toc\xE1 uno para ver todos los cantos de ese tema), <b>Revisado</b>.</li>
        <li><b>Audio</b>: enlaces a Spotify, YouTube o Apple Music, y <b>\u{1F3A7} mp3</b> para escucharlo en el reproductor de la app. <b>\u{1F5A5}\uFE0F Presentaci\xF3n</b> abre las diapositivas.</li>
        <li><b>Tambi\xE9n en</b>: el mismo canto en otros libros (por ejemplo \xABOh, qu\xE9 esperanza\xBB \u2194 Himnario 2009 n.\xBA 181).</li>
      </ul>
      <h4>La letra</h4>
      <ul>
        <li>Los c\xEDrculos con <b>n\xFAmero</b> marcan cada estrofa; <b>CORO</b>, <b>Puente</b>, <b>Final</b>, <b>Repite</b> y <b>Canon</b> indican la estructura.</li>
        <li><b>Voz 1 / Voz 2 / Todos / Voz masculina / Voz femenina</b> indican qui\xE9n canta cada parte.</li>
        <li>Los <b>acordes</b> van arriba de la s\xEDlaba donde cambian. Ver el cap\xEDtulo <i>Acordes</i>.</li>
      </ul>`},{id:"acordes",icono:"\u{1F3B8}",titulo:"Acordes y diagramas",html:`
      <h4>Tocar un acorde</h4>
      <ul>
        <li>Tocando un acorde de la letra <b>suena</b> y se abre una ventanita con <b>c\xF3mo se toca</b> en el instrumento elegido.</li>
        <li>Si en un mismo lugar hay varios acordes (por ejemplo [Am - G - C]) suenan uno tras otro.</li>
        <li>El instrumento se elige en la ventanita, en <b>\u2630 Men\xFA \u2192 Herramientas \u2192 Diagrama de acordes</b> o en la pesta\xF1a Acordes del afinador. Con <b>Ninguno</b> el acorde suena pero no aparece la ventanita.</li>
      </ul>
      <h4>Guitarra, bajo y ukelele</h4>
      <ul>
        <li>Diagrama del m\xE1stil: \u25CF d\xF3nde poner los dedos, \u25CB cuerda al aire, \u2715 cuerda que no se toca. Si el acorde va m\xE1s arriba en el m\xE1stil se indica el traste (\xAB5fr\xBB).</li>
        <li>En guitarra el bajo es siempre la fundamental (D = xx0232, A = x02220, C = x32010).</li>
      </ul>
      <h4>Piano</h4>
      <ul>
        <li>El acorde aparece <b>centrado</b> en el teclado, con el nombre de cada nota sobre su tecla. La fundamental va en un tono oscuro del color del tema.</li>
        <li><b>\u266A Fa \xB7 \u266A La \xB7 \u266A Do</b>: cada bot\xF3n (y cada tecla marcada) hace sonar <b>esa nota sola</b>. <b>Escuchar</b> toca el acorde completo.</li>
        <li><b>Posici\xF3n</b>: Fundamental, 1\xAA inv., 2\xAA inv. (inversiones). Cambia el dibujo y c\xF3mo suena el acorde.</li>
      </ul>
      <h4>Instrumentos de viento</h4>
      <ul>
        <li><b>Flauta traversa, Flauta dulce, Clarinete (Si\u266D), Trompeta (Si\u266D), Saxo alto (Mi\u266D) y Saxo tenor (Si\u266D)</b>.</li>
        <li>Los vientos tocan una nota: se muestra la <b>nota del acorde</b> (G \u2192 Sol) con su digitaci\xF3n, separada en <b>MANO IZQ.</b> y <b>MANO DER.</b>, con el pulgar y las llaves extra.</li>
        <li>Instrumentos en Si\u266D y Mi\u266D: dos tarjetas. <b>\xABPara que suene Sol con el piano\xBB</b> (la digitaci\xF3n transpuesta, resaltada) y <b>\xABDigitaci\xF3n de Sol\xBB</b> tal cual, aclarando qu\xE9 nota suena as\xED.</li>
        <li>Tocando una tarjeta se escucha la nota.</li>
      </ul>
      <h4>Tablatura</h4>
      <ul><li><b>\u2630 Men\xFA \u2192 Herramientas \u2192 Tablatura (Mostrar/Ocultar)</b>: muestra u oculta los acordes sobre la letra.</li></ul>`},{id:"transponer",icono:"\u{1F39A}\uFE0F",titulo:"Transponer y \xABTrasporte\xBB",html:`
      <ul>
        <li><b>\u2630 Men\xFA \u2192 Herramientas \u2192 Transponer tonalidad</b>: <b>\u266D</b> baja medio tono, <b>\u266F</b> sube medio tono, <b>\u266E</b> vuelve a la tonalidad original. Todos los acordes de la letra cambian.</li>
        <li>Si la canci\xF3n est\xE1 transportada, la ventanita del acorde muestra <b>dos diagramas</b>: <b>Transportado</b> (suena como la canci\xF3n) y <b>Original</b> (como est\xE1 escrito).</li>
        <li><b>Trasporte \u2014 Activo/Inactivo</b> (en el mismo men\xFA) decide cu\xE1l es el principal (resaltado y el que suena):
          <ul>
            <li><b>Activo</b>: el transportado, para tocar igual que la canci\xF3n.</li>
            <li><b>Inactivo</b>: el original; en guitarra y ukelele dice adem\xE1s <b>\xABCon cejilla en el traste N suena como la canci\xF3n\xBB</b>.</li>
          </ul>
        </li>
        <li>Los vientos usan el acorde seg\xFAn Trasporte y aclaran el otro.</li>
      </ul>`},{id:"texto",icono:"\u{1F520}",titulo:"Tama\xF1o de letra y may\xFAsculas",html:`
      <ul>
        <li><b>\u2630 Men\xFA \u2192 Herramientas \u2192 Tama\xF1o de letra</b>:
          <ul>
            <li><b>Aa / AA</b>: pasa la letra a may\xFAsculas y vuelve (los acordes no cambian).</li>
            <li><b>A\u2212</b> achica, <b>A</b> vuelve al tama\xF1o normal, <b>A+</b> agranda.</li>
          </ul>
        </li>
        <li>Para agrandar a mano, el zoom con dos dedos tambi\xE9n funciona.</li>
      </ul>`},{id:"teleprompter",icono:"\u{1F4DC}",titulo:"Telepr\xF3nter",html:`
      <ul>
        <li>En la canci\xF3n abierta: <b>\u25B6</b> hace que la letra baje sola; <b>\u23F8</b> la detiene.</li>
        <li><b>\u2212</b> / <b>+</b> cambian la velocidad (se ve, por ejemplo, \xAB1.0x\xBB).</li>
        <li><b>\u2630 Men\xFA \u2192 Herramientas \u2192 Telepr\xF3nter (Mostrar/Ocultar)</b> muestra u oculta esa barra.</li>
      </ul>`},{id:"idiomas",icono:"\u{1F30E}",titulo:"Idiomas",html:`
      <ul>
        <li>La app est\xE1 en <b>espa\xF1ol, ingl\xE9s, italiano, portugu\xE9s, franc\xE9s y alem\xE1n</b>; las canciones, adem\xE1s, en guaran\xED y otros idiomas.</li>
        <li><b>Bandera de arriba a la derecha</b>: con un toque pasa al siguiente idioma disponible; manteni\xE9ndola presionada se abre la lista completa.</li>
        <li>Tambi\xE9n en <b>\u2630 Men\xFA \u2192 Ajustes \u2192 Idioma</b>. Tocando la banderita de esa fila pod\xE9s elegir la <b>bandera de tu pa\xEDs</b> (por ejemplo, Estados Unidos o Reino Unido para el ingl\xE9s).</li>
        <li>En cada canci\xF3n, las <b>banderas de la ficha</b> cambian el idioma de ese canto.</li>
      </ul>`},{id:"listas",icono:"\u2B50",titulo:"Mis Listas",html:`
      <p>Repertorios propios (para el culto, un ensayo, un campamento\u2026). Se abren en <b>\u2630 Men\xFA \u2192 Mi m\xFAsica \u2192 Mis Listas</b> o con la <b>\u2B50</b> de cualquier canto.</p>
      <ul>
        <li><b>Crear</b>: escrib\xED el nombre y toc\xE1 <b>+ Crear</b>.</li>
        <li><b>Agregar o quitar un canto</b>: toc\xE1 la \u2B50 del canto y marc\xE1 o desmarc\xE1 la lista.</li>
        <li>Toc\xE1 una lista para ver sus cantos y abrirlos; \u2715 para quitar uno; tambi\xE9n se puede eliminar la lista.</li>
        <li><b>\u2699\uFE0F Organizar y respaldar</b>: <b>Exportar</b> guarda un archivo con tus listas e <b>Importar</b> las carga en otro celular o navegador.</li>
        <li>Las listas se guardan solo en tu dispositivo.</li>
      </ul>`},{id:"reproductor",icono:"\u{1F3A7}",titulo:"Mis Playlists (reproductor de m\xFAsica)",html:`
      <p>Se abre con <b>\u{1F3A7}</b> (arriba del men\xFA o en <b>Mi m\xFAsica \u2192 Mis Playlists</b>) o con <b>\u{1F3A7} mp3</b> en un canto.</p>
      <h4>Biblioteca</h4>
      <ul>
        <li>Filtros <b>Todo \xB7 Playlists \xB7 Libros</b>.</li>
        <li><b>Playlists destacadas</b> (etiqueta DESTACADA, por ejemplo \xABConquistadores\xBB): vienen con la app, para todos, y no se pueden modificar.</li>
        <li><b>Crear playlist</b> (+): ponele nombre y agreg\xE1 cantos con \u22EF \u2192 <b>Agregar a playlist</b>.</li>
        <li>Cada <b>libro</b> es un \xE1lbum con todos sus cantos que tienen audio.</li>
        <li>Cuando se suben audios nuevos aparece un aviso \xABHay canciones nuevas en\u2026\xBB, el libro muestra <b>\xAB3 nuevas\xBB</b> y cada canto nuevo lleva un <b>punto verde</b> hasta que lo escuch\xE1s.</li>
      </ul>
      <h4>Dentro de un \xE1lbum o playlist</h4>
      <ul>
        <li>Buscador por t\xEDtulo, n\xFAmero, letra o autor.</li>
        <li><b>Barra vertical</b> a la derecha: en los himnarios, n\xFAmeros arriba y <b>letras</b> abajo. Tocar una letra ordena por t\xEDtulo; tocar un n\xFAmero vuelve al orden por n\xFAmero. Se puede deslizar el dedo.</li>
        <li>\u25B6 reproduce desde el principio; \u{1F500} en orden aleatorio. Toc\xE1 un canto para empezar desde ah\xED.</li>
        <li>Men\xFA <b>\u22EF</b> de un canto: agregar a playlist, quitar de la playlist, subir/bajar, <b>Ver en el cancionero</b>.</li>
        <li>Men\xFA <b>\u22EF</b> de una playlist propia: <b>Compartir playlist</b> (manda un link: quien lo abre la recibe en su app), Cambiar nombre, Eliminar.</li>
      </ul>
      <h4>Reproduciendo</h4>
      <ul>
        <li>Portada, barra de progreso, \u23EE \u23EF \u23ED, \u{1F500} aleatorio y \u{1F501} repetir (toda la lista / un solo canto).</li>
        <li><b>Con voz / Pista (playback)</b> cuando el canto tiene las dos versiones.</li>
        <li>\u{1F319} <b>Temporizador</b> para que la m\xFAsica se detenga sola; \u{1F508} <b>conectar</b> a un parlante o auriculares Bluetooth.</li>
        <li>Debajo: <b>Letra</b>, <b>Cr\xE9ditos</b> y <b>Acerca del canto</b>.</li>
      </ul>
      <h4>Mientras us\xE1s la app</h4>
      <ul>
        <li><b>\u2304 Minimizar</b>: la m\xFAsica sigue y aparece una <b>barrita abajo</b>; tocala para volver. Su <b>\u2715</b> detiene la m\xFAsica.</li>
        <li><b>\u2715</b> arriba: cierra y detiene. El bot\xF3n <b>Atr\xE1s</b> del celular retrocede paso a paso dentro del reproductor.</li>
      </ul>`},{id:"afinador",icono:"\u{1F4DF}",titulo:"Metr\xF3nomo y afinador",html:`
      <p><b>\u2630 Men\xFA \u2192 Herramientas \u2192 Metr\xF3nomo y Afinador</b> (o tocando la tonalidad, BPM o comp\xE1s de un canto).</p>
      <ul>
        <li><b>\u{1F3AF} Afinador</b>: General, Guitarra, Bajo, Viol\xEDn o Ukelele; referencia <b>La4 = 440 Hz</b> (ajustable con \u2212 / +); <b>\u{1F3A4} Activar micr\xF3fono</b> y toc\xE1 o cant\xE1: indica la nota y si est\xE1s alto o bajo.</li>
        <li><b>\u{1F941} Metr\xF3nomo</b>: BPM con \u2212 / +, <b>\u{1F446} Tap tempo</b> (toc\xE1 al ritmo), <b>Comp\xE1s</b> (1/4 a 7/8), <b>Subdivisi\xF3n</b> (\u2669 \u266A \u266A\xB3 \u266C), <b>Acento</b> en el tiempo que elijas, <b>\u25B6\uFE0F Play</b> y <b>\u{1F50A} Sonido</b>.</li>
        <li><b>\u{1F3B5} Notas</b>: piano para tocar cualquier nota, con octava ajustable.</li>
        <li><b>\u{1F3B6} Acordes</b>: eleg\xED la nota y el tipo (Mayor, menor, 7, Maj7, min7, sus2, sus4, dim, dim7, m7b5, aug, 6, m6); muestra sus notas, el diagrama y lo hace sonar.</li>
        <li><b>\u{1F3BC} Escalas</b>: escalas de cada tonalidad.</li>
        <li><b>\u{1F535} Quintas</b>: c\xEDrculo de cuartas y quintas; toc\xE1 una tonalidad para escucharla.</li>
      </ul>`},{id:"bloc",icono:"\u{1F399}\uFE0F",titulo:"Bloc musical",html:`
      <p>Para grabar una idea antes de olvidarla. <b>\u2630 Men\xFA \u2192 Mi m\xFAsica \u2192 Bloc musical</b>.</p>
      <ul>
        <li>Escrib\xED un nombre y toc\xE1 <b>+ Nueva</b>.</li>
        <li>Adentro: toc\xE1 el bot\xF3n rojo para <b>grabar</b>; \u25B6\uFE0F para escuchar. Pod\xE9s anotar letra y acordes, tonalidad, ritmo y BPM.</li>
        <li><b>\u2B07\uFE0F Descargar</b> el audio o <b>\u{1F5D1}\uFE0F Eliminar</b> la idea.</li>
        <li><b>\u2699\uFE0F Organizar y respaldar</b>: Exportar / Importar para pasarlas a otro dispositivo.</li>
        <li>Las grabaciones quedan solo en tu dispositivo. El micr\xF3fono se usa \xFAnicamente cuando toc\xE1s grabar.</li>
      </ul>`},{id:"oracion",icono:"\u{1F6D0}",titulo:"Mis Pedidos de Oraci\xF3n",html:`
      <p>Se abre con <b>\u{1F6D0}</b> arriba del men\xFA.</p>
      <ul>
        <li>Escrib\xED el pedido y toc\xE1 <b>+ Agregar pedido</b>. Pod\xE9s sumarle <b>\u{1F4F7} una foto</b>, <b>\u{1F4D6} un vers\xEDculo</b> o <b>\u{1F3B5} un canto</b>.</li>
        <li>Cada pedido se puede editar, borrar o marcar como <b>\u2705 respondido</b>.</li>
        <li><b>Listas</b> (+ Crear lista) para agruparlos (familia, iglesia\u2026); se pueden renombrar, eliminar y mover pedidos entre listas.</li>
        <li><b>\u2699\uFE0F Organizar y respaldar</b>: Exportar / Importar.</li>
        <li>Todo, incluidas las fotos, queda solo en tu dispositivo.</li>
      </ul>`},{id:"biblioteca",icono:"\u{1F4D6}",titulo:"Biblioteca",html:`
      <ul>
        <li><b>\u2630 Men\xFA \u2192 Recursos \u2192 Biblioteca</b>: libros y recursos para leer o descargar, con buscador por t\xEDtulo o autor.</li>
        <li>Cada recurso indica a qui\xE9n pertenecen los derechos y, si corresponde, el <b>permiso</b> de uso.</li>
      </ul>`},{id:"info",icono:"\u2139\uFE0F",titulo:"Informaci\xF3n de la app",html:`
      <ul>
        <li><b>\u2630 Men\xFA \u2192 Informaci\xF3n de la app</b>: versi\xF3n y fecha de actualizaci\xF3n, y el bot\xF3n <b>\u{1F504} Forzar actualizaci\xF3n</b> (baja la app entera de nuevo sin perder tus listas ni ajustes).</li>
        <li><b>Estad\xEDsticas</b>: cantidad de canciones, traducidas e idiomas.</li>
        <li>Listados de <b>Autores, Compositores, Traductores, Arregladores, Temas</b> y <b>Equivalencias</b> (el mismo canto en distintos libros), con filtro por idioma o por libro.</li>
        <li>En esos listados, un canto que est\xE1 en varios libros aparece <b>una sola vez</b>, con un bot\xF3n por libro (por ejemplo <b>'09 #394 \xB7 '62 #196</b>: libro y n\xFAmero de himno): toc\xE1 la fila para abrirlo, o el bot\xF3n del libro que prefieras.</li>
        <li>Este <b>\u{1F4D8} Manual de usuario</b>, c\xF3mo instalar la app, copyright, cr\xE9ditos y fuentes.</li>
      </ul>`},{id:"apariencia",icono:"\u{1F3A8}",titulo:"Apariencia: d\xEDa, noche y colores",html:`
      <ul>
        <li><b>\u{1F576}\uFE0F / \u{1F453}</b> (arriba del men\xFA): cambia entre modo <b>noche</b> (fondo oscuro) y modo <b>d\xEDa</b> (fondo claro).</li>
        <li><b>\u2630 Men\xFA \u2192 Ajustes \u2192 Color del tema</b>: 13 colores \u2014 Blanco, Rojo, Coral, Naranja, Amarillo, Verde, Turquesa, Celeste, Azul, Violeta, Lila, Rosa y Gris. Cada c\xEDrculo muestra el color y su fondo nocturno.</li>
        <li>El color se aplica a botones, acordes, fondo y barra del celular.</li>
      </ul>`},{id:"iglesia",icono:"\u{1F4FD}\uFE0F",titulo:"Modo iglesia: proyector y TV",html:`
      <h4>Proyector (computadora)</h4>
      <ul>
        <li><b>\u2630 Men\xFA \u2192 Modo iglesia \u2192 Proyector</b>.</li>
        <li>La letra se ve <b>grande</b>; se ocultan herramientas que no hacen falta proyectar.</li>
        <li>En el inicio aparece un <b>c\xF3digo QR</b> para que todos sigan la letra en su celular.</li>
        <li>Fondo negro o blanco con \u{1F576}\uFE0F / \u{1F453}. El telepr\xF3nter funciona igual.</li>
        <li>Solo en computadora (en el celular avisa).</li>
      </ul>
      <h4>Modo TV (control remoto)</h4>
      <ul>
        <li>Se activa solo en Smart TV / Android TV / Google TV, o en <b>\u2630 Men\xFA \u2192 Modo iglesia \u2192 Modo TV</b> en una computadora.</li>
        <li><b>Flechas</b> para moverte, <b>OK</b> para elegir, <b>Atr\xE1s</b> para cerrar o volver. Los botones <b>\u25B2 \u25BC</b> de la pantalla tambi\xE9n hacen bajar y subir la letra.</li>
        <li>En el inicio tambi\xE9n muestra el <b>c\xF3digo QR</b>.</li>
        <li>No aparece en celulares ni tablets.</li>
      </ul>`},{id:"sabado",icono:"\u{1F305}",titulo:"Feliz s\xE1bado",html:`
      <ul>
        <li>Cada <b>viernes a la puesta del sol</b> (seg\xFAn el lugar donde est\xE1s) aparece un saludo de feliz s\xE1bado con un <b>vers\xEDculo</b> distinto cada vez y un enlace para escuchar <b>\xABCuando empieza el santo s\xE1bado\xBB</b>.</li>
        <li>Aparece una sola vez por semana, entre la puesta del sol del viernes y la del s\xE1bado.</li>
      </ul>`},{id:"instalar",icono:"\u{1F4F2}",titulo:"Instalar la app",html:`
      <ul>
        <li><b>iPhone / iPad (Safari)</b>: bot\xF3n Compartir \u2192 <b>Agregar a pantalla de inicio</b>.</li>
        <li><b>Android (Chrome)</b>: aparece el aviso <b>Instal\xE1 Cancionero App</b>, o men\xFA \u22EE \u2192 <b>Instalar app</b>.</li>
        <li><b>Computadora (Chrome / Edge)</b>: \xEDcono de instalar en la barra de direcciones.</li>
        <li>Instalada, se abre a pantalla completa y funciona sin internet.</li>
      </ul>`},{id:"compartir",icono:"\u{1F517}",titulo:"Compartir, contacto y donaciones",html:`
      <ul>
        <li><b>Compartir</b> (abajo del men\xFA): manda la app por WhatsApp, mail, AirDrop, etc.; <b>\u{1F4CB} Copiar</b> el enlace o mostrar el <b>c\xF3digo QR</b> para escanear con otro celular.</li>
        <li><b>Contacto</b>: escribir por un error o una sugerencia, Instagram, YouTube y reportes.</li>
        <li><b>Buy me a coffee</b>: donaciones por Revolut o Mercado Pago, para sostener la app.</li>
      </ul>`},{id:"privacidad",icono:"\u{1F512}",titulo:"Privacidad",html:`
      <ul>
        <li>Mis Listas, Mis Playlists, el Bloc musical, los Pedidos de oraci\xF3n, el tema, el color y el idioma se guardan <b>solo en tu dispositivo</b>. No se suben a ning\xFAn servidor.</li>
        <li>El <b>micr\xF3fono</b> se usa solo para el afinador y para grabar en el Bloc, y \xFAnicamente cuando lo activ\xE1s.</li>
        <li>La <b>c\xE1mara/fotos</b> se usan solo si agreg\xE1s una foto a un pedido de oraci\xF3n.</li>
        <li>Para pasar tus datos a otro dispositivo us\xE1 <b>Exportar / Importar</b> en cada secci\xF3n.</li>
      </ul>`},{id:"problemas",icono:"\u{1F6E0}\uFE0F",titulo:"Preguntas frecuentes y problemas",html:`
      <ul>
        <li><b>No veo una novedad</b>: cerr\xE1 la pesta\xF1a o la app y volv\xE9 a abrirla.</li>
        <li><b>No suena un audio</b>: revis\xE1 la conexi\xF3n a internet y que el celular no est\xE9 en silencio.</li>
        <li><b>El acorde no abre la ventanita</b>: en Diagrama de acordes est\xE1 elegido \xABNinguno\xBB, o est\xE1s en modo proyector/TV.</li>
        <li><b>La pantalla qued\xF3 agrandada</b>: hac\xE9 zoom con dos dedos para volver; la app ya no se agranda sola al tocar un campo.</li>
        <li><b>Cambi\xE9 de celular</b>: us\xE1 Exportar en el viejo e Importar en el nuevo (Mis Listas, Bloc, Pedidos de oraci\xF3n).</li>
        <li><b>Encontr\xE9 un error en una letra</b>: avis\xE1 desde <b>Contacto</b>.</li>
      </ul>`},{id:"novedades",icono:"\u{1F195}",titulo:"Novedades",html:`
      <ul>
        <li><b>2.68.1</b> \u2014 Sin personas duplicadas: cada autor, compositor y traductor con un \xFAnico nombre en todos los libros (por ejemplo \xABWilson Almeida\xBB y \xABWilson F. Almeida\xBB son uno solo). Cr\xE9ditos iguales para el mismo canto en distintos libros.</li>
        <li><b>2.68.0</b> \u2014 Bot\xF3n <b>\u{1F504} Forzar actualizaci\xF3n</b> en Informaci\xF3n de la app.</li>
        <li><b>2.67.5</b> \u2014 iPhone: el cursor del buscador ya no aparece m\xE1s abajo que el texto.</li>
        <li><b>2.67.4</b> \u2014 En la b\xFAsqueda, el mismo canto de dos libros aparece una sola vez (con la marca del otro libro al lado de la bandera). \xAB\xA1Cu\xE1n firme cimiento!\xBB: autor John Rippon.</li>
        <li><b>2.67.3</b> \u2014 Los cr\xE9ditos que eran el nombre de una colecci\xF3n (por ejemplo \xABA Selection of Hymns, 1787\xBB) pasan a \xABAn\xF3nimo\xBB, \xABMelod\xEDa tradicional\xBB o al autor real; la colecci\xF3n queda en la nota del himno. Botones de libro con \xAB#\xBB del n\xFAmero de himno.</li>
        <li><b>2.67.2</b> \u2014 En los listados de autores, compositores, traductores y temas, cada canto aparece una sola vez con un bot\xF3n por libro.</li>
        <li><b>2.67.1</b> \u2014 Autores, compositores y traductores con su nombre completo (por ejemplo \xABP. P. B.\xBB \u2192 Philip P. Bliss, \xABB. D. Ackley\xBB \u2192 Bentley D. Ackley) y cada persona una sola vez en los listados.</li>
        <li><b>2.67.0</b> \u2014 Manual de usuario completo dentro de la app.</li>
        <li><b>2.66.x</b> \u2014 Piano: acorde centrado, cada nota suena sola, posici\xF3n aparte. Original y transportado lado a lado seg\xFAn \xABTrasporte\xBB, con cejilla. Guitarra corregida. 13 colores (Blanco y Gris distintos, Rojo y Azul nuevos). Gris de d\xEDa en gris claro.</li>
        <li><b>2.65.0</b> \u2014 Diagramas para vientos (flauta traversa, flauta dulce, clarinete, trompeta, saxo alto y tenor). C\xF3digo QR en modo TV.</li>
        <li><b>2.64.0</b> \u2014 Playlists destacadas (\xABConquistadores\xBB) y compartir playlists por link.</li>
        <li><b>2.63.0</b> \u2014 Bot\xF3n Aa (may\xFAsculas), vers\xEDculo siempre al cambiar de libro, nuevos coritos del Coritario J\xF3venes.</li>
        <li><b>2.62.0</b> \u2014 Saludo de feliz s\xE1bado.</li>
        <li><b>2.61.0</b> \u2014 Avisos de canciones nuevas en el reproductor, audios m4a.</li>
      </ul>`}];let manualDesdeInfo=!1;function abrirManual(e=!1){manualDesdeInfo=e,e&&typeof cerrarInfo=="function"&&cerrarInfo(),typeof closeMenu=="function"&&closeMenu();const o=document.getElementById("manualModal");if(!o)return;renderManual(),o.style.display="block",document.getElementById("manualModalBack")?.classList.toggle("hidden",!e);const l=document.getElementById("manualBuscar");l&&(l.value=""),o.querySelector(".about-body")?.scrollTo(0,0)}function cerrarManual(){const e=document.getElementById("manualModal");e&&(e.style.display="none")}function volverAInfoDesdeManual(){cerrarManual(),typeof info=="function"&&info()}function renderManual(e=""){const o=document.getElementById("manualContenido"),l=document.getElementById("manualIndice"),r=document.getElementById("manualModalMeta");if(!o)return;r&&(r.textContent=`Versi\xF3n ${MANUAL_VERSION} \xB7 actualizado ${MANUAL_FECHA}`);const s=a=>typeof normalize=="function"?normalize(a):a.toLowerCase(),i=s(e.trim()),t=a=>s(a.titulo+" "+a.html.replace(/<[^>]+>/g," ")),n=MANUAL_CAPITULOS.filter(a=>!i||t(a).includes(i));l&&(l.innerHTML=n.map(a=>`<button type="button" class="manual-indice-item" ${dataAction("irACapituloManual",[a.id])}>${a.icono} ${escapeHtml(a.titulo)}</button>`).join("")),o.innerHTML=n.length?n.map(a=>`
        <details class="about-section manual-cap" id="manual-${a.id}"${i?" open":""}>
          <summary><span class="sec-icon">${a.icono}</span><span>${escapeHtml(a.titulo)}</span><span class="sec-chevron">\u25B8</span></summary>
          <div class="about-panel">${a.html}</div>
        </details>`).join(""):`<p class="manual-vacio">No hay resultados para \xAB${escapeHtml(e)}\xBB.</p>`}function irACapituloManual(e){const o=document.getElementById("manual-"+e);o&&(o.open=!0,o.scrollIntoView({behavior:"smooth",block:"start"}))}function buscarEnManual(e){renderManual(e||"")}
