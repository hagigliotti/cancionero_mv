function hasHymnNumbersInCurrentLanguage(){return getLibroSongs(libroActual).some(a=>{const e=parseInt(a.idiomas?.[idiomaActual]?.numero_himno,10);return!isNaN(e)&&e>0})}function naturalSort(a,e){const n=a.match(/(\D+)|(\d+)/g),i=e.match(/(\D+)|(\d+)/g),o=Math.min(n.length,i.length);for(let r=0;r<o;r++){const s=n[r],l=i[r],m=Number(s),d=Number(l);if(!isNaN(m)&&!isNaN(d)){if(m!==d)return m-d}else if(s!==l)return s.localeCompare(l,void 0,{sensitivity:"base"})}return n.length-i.length}function cleanTitleForIndex(a){return normalize(a).trim().replace(/^[¿¡!?"'“”‘’()\[\]\s]+/,"")}function getIndexLetter(a){const n=cleanTitleForIndex(a).charAt(0).toUpperCase();return n.match(/[A-ZÁÉÍÓÚÑ0-9]/i)?n:"#"}function normalizePersonField(a){return a?(Array.isArray(a)?a:[a]).map(n=>(n||"").trim()).filter(n=>n&&n!=="-"):[]}const ORDEN_LIBROS_EQUIV=["himnario","himnario_1962","melodias_de_victoria","cancionero","innario"];function calcularBanderasEquivalentes(a){const e=new Set(Object.keys(a.idiomas||{}).map(o=>a.idiomas[o]?.idioma_real||o)),n=ORDEN_LIBROS_EQUIV,i=new Map;return getEquivalenciasDe(a).forEach(o=>{const r=getSongPorIdRapido(o.id);r&&Object.keys(r.idiomas||{}).forEach(s=>{const l=r.idiomas[s];if(!l?.titulo)return;const m=l.idioma_real||s;if(e.has(m))return;const d=n.indexOf(o.libro),u=i.get(m);(!u||d<u.rank)&&i.set(m,{eq:o,lang:s,rank:d,audio:!!l.audio_url})})}),i}function renderBanderasEquivalentes(a,e=!1){const n=calcularBanderasEquivalentes(a),i=marcasEquivalentesPorIdioma(a);return[...n.entries()].sort((o,r)=>(FLAG_NAMES[o[0]]||o[0]).localeCompare(FLAG_NAMES[r[0]]||r[0])).map(([o,r])=>{const s=getLibroDef(r.eq.libro),l=ladoBanderaHtml(e&&r.audio,marcasLibrosHtml(i.get(o))),m=`${IDIOMA_NOMBRES[o]||o} \u2014 ${s?.nombre||r.eq.libro}${r.eq.numero?" #"+r.eq.numero:""}`;return`<span class="flag flag-lado" ${dataAction("abrirEquivalente",[r.eq.id,r.lang])} title="${escapeHtml(m)}"><span class="flag-emoji" data-flag-lang="${o}">${getFlagEmoji(o)}</span>${l}</span>`}).join("")}function marcasEquivalentesPorIdioma(a){const e=new Map,n=getLibroIdDeSong(a),i=getLibroDef(n);if(n&&n!==libroActual&&i?.marca){const o=i.idiomaDefault||"es",r=Object.keys(a.idiomas||{}).find(s=>a.idiomas[s]?.titulo&&(a.idiomas[s].idioma_real||s)===o);if(r){const s=a.idiomas[r].numero_himno;e.set(o,[{eq:{id:a.id,libro:n,numero:s},lang:r,numeros:s?[s]:[],propio:!0}])}}return getEquivalenciasDe(a).forEach(o=>{const r=getSongPorIdRapido(o.id);if(!r)return;const s=getLibroDef(o.libro)?.idiomaDefault||"es";Object.keys(r.idiomas||{}).forEach(l=>{const m=r.idiomas[l];if(!m?.titulo)return;const d=m.idioma_real||l;if(d!==s)return;const u=e.get(d)||[],$=u.find(b=>b.eq.libro===o.libro);$?o.numero&&$.numeros.push(o.numero):u.push({eq:o,lang:l,numeros:o.numero?[o.numero]:[]}),e.set(d,u)})}),e.forEach(o=>o.sort((r,s)=>(s.propio?1:0)-(r.propio?1:0)||ORDEN_LIBROS_EQUIV.indexOf(r.eq.libro)-ORDEN_LIBROS_EQUIV.indexOf(s.eq.libro))),e}function marcasLibrosHtml(a){return a?.length?a.map(e=>{const n=getLibroDef(e.eq.libro);if(!n?.marca)return"";const i=`${n.nombre}${e.numeros.length?" #"+e.numeros.join(", #"):""}`;return`<small class="libro-marca marca-equiv" ${dataAction("abrirEquivalente",[e.eq.id,e.lang])} title="${escapeHtml(i)}">${escapeHtml(n.marca)}</small>`}).join(""):""}function ladoBanderaHtml(a,e){const n=a?'<span class="flag-audio-note">\u266A</span>':"";return n||e?`<span class="flag-side">${n}${e}</span>`:""}function renderEquivalenciasHtml(a){const e=getEquivalenciasDe(a);if(!e.length)return"";const n=e.map(i=>{const o=getLibroDef(i.libro)?.nombre||i.libro,r=i.numero?`${o} #${i.numero}`:`${o}: ${i.titulo}`,s=[i.tipo==="parcial"?"Letra o m\xFAsica con diferencias, u otra traducci\xF3n":"Mismo canto",i.confianza==="baja"?"a confirmar":"",i.nota||""].filter(Boolean).join(" \xB7 ");return`<span class="equiv-link" ${dataAction("abrirEquivalente",[i.id])} title="${escapeHtml(s)}">${escapeHtml(r)}</span>`}).join(", ");return`<div><b>${t("tambien_en")}:</b> ${n}</div>`}function openSong(a){mostrarCancionActual();const e=getTodasLasCanciones().find(c=>c.id===a||c.slug===a);if(!e){document.getElementById("contenido").innerHTML=`<p>${t("cancion_no_disp_libro")}</p>`,updateClearSearchBtn();return}const n=detectLibroBySong(e);libroActual===n&&(renderAlphabet(),updateAppTitle());let i=e?.idiomas?.[idiomaActual];if(!i){const c=Object.keys(e.idiomas||{});c.length>0&&(idiomaActual=c[0],i=e.idiomas[idiomaActual])}if(!i){document.getElementById("contenido").innerHTML=`<p>${t("cancion_no_disp_idioma")}</p>`,updateClearSearchBtn();return}closeList(),listaVisible=!1,letraActiva=null,ocultarMensajeInicio(),stopTeleprompter(),teleprompterSpeedMult=1;const o=getNumeroHimno(e),r=i.titulo||e.titulo_original||"Sin t\xEDtulo",s=o?`${o} - ${r}`:r,l=getLibroDef(getLibroIdDeSong(e)),m=l?.marca&&getEquivalenciasDe(e).length?`<small class="libro-marca titulo-libro-marca" title="${escapeHtml(l.nombre)}">${escapeHtml(l.marca)}</small>`:"",d=(e.idiomas?.[idiomaActual]?.titulo2||[]).map(c=>(c||"").trim()).filter(c=>c&&c!=="-"),u=d.length?` | <b>${t("otros_titulos")}:</b> ${d.join(", ")}`:"",b=(Array.isArray(e.titulo_original)?e.titulo_original:e.titulo_original?[e.titulo_original]:[]).map(c=>(c||"").trim()).filter(c=>c&&c!=="-"),A=normalizePersonField(i.traductor),y=A.length?`${renderPersonLinks("Traductor",A)} | `:"",h=normalizePersonField(i.arreglo),L=h.length?`${renderPersonLinks("Arreglo",h)} | `:"",v=normalizeArrayField(i.partitura).map(rutaPartituraExistente).filter(Boolean),E=v.length?`<a href="#" ${dataAction("abrirPartituraModal",[v[0]])}>${t("click_aqui")}</a>`:t("no"),M=`
    <div class="song-meta">

      <div class="flags">
        <b>${t("idiomas")}:</b> ${renderLanguageFlags(e,!1,!0)}${renderBanderasEquivalentes(e)}
      </div>

      <div>
        <b>${t("original")}:</b>
          ${b.length?`
              <i><span class="original-title">"${b.join(", ")}"</span></i>
            `:""}
        ${u}
      </div>

      <div>
        ${renderPersonLinks("Autor",e.autor)}
        ${e.autor?" | ":""}

        ${renderPersonLinks("Coautor",e.coautor)}
        ${e.coautor?" | ":""}

        ${renderPersonLinks("Compositor",e.compositor)}
        ${e.compositor?" | ":""}

        ${L}

        ${y}

        <b>${t("anio")}:</b> ${traducirValorFijo(normalizeSimple(e.year))}
      </div>

      <div>
        <b>${t("referencia_biblica")}:</b>
        ${normalizeReferenciaBiblica(e.referencia_biblica).length?normalizeReferenciaBiblica(e.referencia_biblica).map(c=>`<a href="${`https://www.biblegateway.com/passage/?search=${encodeURIComponent(c)}&version=RVR1960`}" target="_blank">${c}</a>`).join(", "):t("no")}
      </div>

      <div class="song-metro" ${dataAction("abrirMetronomoDesdeMenu")} style="cursor:pointer;">

        ${normalizeMeta(e,"tonalidad")&&normalize(normalizeMeta(e,"tonalidad"))!=="DESCONOCIDO"?`
            <b>${t("tonalidad")}:</b>
            <span class="meta-link tonalidad-link"
              data-tonalidad="${normalizeMeta(e,"tonalidad")}"
              data-bpm="${normalizeMeta(e,"tempo_bpm")||""}"
              data-compas="${normalizeMeta(e,"compas")||""}"
              ${dataAction("abrirAfinadorDesdeElemento",["tonalidad","@el"])}>
              ${normalizeMeta(e,"tonalidad")}
            </span> |
          `:`
            <b>${t("tonalidad")}:</b>
            <span class="meta-normal">${t("desconocido")}</span> |
          `}

        ${normalizeMeta(e,"tempo_bpm")&&normalize(normalizeMeta(e,"tempo_bpm"))!=="DESCONOCIDO"?`
            <b>${t("bpm")}:</b>
            <span class="meta-link bpm-link"
              data-tonalidad="${normalizeMeta(e,"tonalidad")||""}"
              data-bpm="${normalizeMeta(e,"tempo_bpm")}"
              data-compas="${normalizeMeta(e,"compas")||""}"
              ${dataAction("abrirAfinadorDesdeElemento",["bpm","@el"])}>
              ${normalizeMeta(e,"tempo_bpm")}
            </span> |
          `:`
          <b>${t("bpm")}:</b>
          <span class="meta-unknown">${t("desconocido")}</span> |
        `}

        ${normalizeMeta(e,"compas")&&normalize(normalizeMeta(e,"compas"))!=="DESCONOCIDO"?`
            <b>${t("compas")}:</b>
            <span class="meta-link compas-link"
              data-tonalidad="${normalizeMeta(e,"tonalidad")||""}"
              data-bpm="${normalizeMeta(e,"tempo_bpm")||""}"
              data-compas="${normalizeMeta(e,"compas")}"
              ${dataAction("abrirAfinadorDesdeElemento",["compas","@el"])}>
              ${normalizeMeta(e,"compas")}
            </span> |
          `:`
          <b>${t("compas")}:</b>
          <span class="meta-unknown">${t("desconocido")}</span> |
        `}

        <b>${t("ritmo")}:</b> ${traducirValorFijo(formatRitmo(e.ritmo))||t("desconocido")} |

        <b>${t("partitura")}:</b> ${E}
      </div>

      <div>
        <b class="temas-label-link" ${dataAction("abrirValoresModal",["tags",null,{fromInfo:!1}])} title="Ver todos los tags">${t("temas")}:</b>
        ${e.tags?.length?[...e.tags].map(c=>c?.toString().trim()).filter(Boolean).sort((c,f)=>getTagDisplay(c,idiomaActual).localeCompare(getTagDisplay(f,idiomaActual),"es",{sensitivity:"base"})).map(c=>{const f=getTagDisplay(c,idiomaActual);return`<span class="tag-link" ${dataAction("openPersonModal",[c,"tags",{tipo:"tags",filtroIdioma:idiomaActual,fromInfo:!1}])}>${f}</span>`}).join(", "):t("desconocido")} |

        <b>${t("revisado")}:</b>
          <span
            class="song-meta-revisado"
            data-revisado='${JSON.stringify(e.idiomas?.[idiomaActual]?.revisado)}'
            ${dataAction("openRevisadoList",["@el"])}
          >
            ${formatRevisadoEstado(e.idiomas?.[idiomaActual]?.revisado)}
          </span>

          <span class="revisado-personas">
            ${renderRevisadoPersonas(e.idiomas?.[idiomaActual]?.revisado)}
          </span>


        ${renderAudioLink(e,i)}
      </div>

      ${renderEquivalenciasHtml(e)}

    </div>

  `,g=e.idiomas?.[idiomaActual]?.nota,p=Array.isArray(g)?g.map(c=>(c||"").trim()).filter(c=>c!==""):typeof g=="string"?g.trim():"",I=Array.isArray(p)?p.length>0:p!=="";document.getElementById("contenido").innerHTML=`
  <div class="song-title-row" id="songTitleRow" data-song-id="${escapeHtml(e.id)}" data-lang="${escapeHtml(idiomaActual)}">
    <h2 class="song-title-text">${s}${m}</h2>
    <button type="button" class="fav-add-btn" ${dataAction("abrirMisListas",[e.id])} title="Agregar a una lista">\u2B50</button>
    ${Array.isArray(i.letra)&&i.letra.length&&typeof editorAcordesActivo=="function"&&editorAcordesActivo()?`<button type="button" class="editar-acordes-btn" ${dataAction("abrirEditorAcordes")} title="${escapeHtml(tEd("editar"))}" aria-label="${escapeHtml(tEd("editar"))}">\u270F\uFE0F</button>`:""}

    <div class="teleprompter-bar" id="teleprompterBar" data-bpm="${normalizeMeta(e,"tempo_bpm")||""}">
      <span class="teleprompter-label">${t("teleprompter")}</span>
      <button type="button" class="teleprompter-play-btn" id="teleprompterPlayBtn" ${dataAction("toggleTeleprompter")} title="Teleprompter: scroll autom\xE1tico de la letra">\u25B6</button>
      <div class="teleprompter-speed">
        <button type="button" ${dataAction("adjustTeleprompterSpeed",[-1])} title="M\xE1s lento">\u2212</button>
        <span id="teleprompterSpeedLabel">1.0x</span>
        <button type="button" ${dataAction("adjustTeleprompterSpeed",[1])} title="M\xE1s r\xE1pido">+</button>
      </div>
    </div>
  </div>

  ${M}

  <div class="lyrics">
    ${renderLyrics(i.letra)}
  </div>

  ${I?`
        <div class="song-note">
          ${Array.isArray(p)?p.map(c=>`<p>${c}</p>`).join(""):p.split(`
`).map(c=>`<p>${c}</p>`).join("")}
        </div>
      `:""}
`,applyTablaturaState(),applyTeleprompterBarVisibility(),resetTranspose(),window.scrollTo({top:0,behavior:"smooth"}),updateClearSearchBtn()}function selectLetter(a){if(letraActiva===a&&listaVisible){closeList(),letraActiva=null,highlightLetter(null),document.getElementById("contenido").innerHTML.trim()?mostrarCancionActual():mostrarMensajeInicio();return}abrirLetra(a)}function abrirLetra(a){letraActiva=a,listaVisible=!0,ocultarMensajeInicio(),ocultarCancionActual(),openList(),renderList(a),highlightLetter(a),window.scrollTo({top:0,behavior:"smooth"})}function renderList(a){const e=document.getElementById("indice");let n=getSortedData(),i=[];n.forEach(o=>{getAllSongTitles(o).forEach(s=>{i.push({song:o,displayTitle:buildDisplayTitle(o,s),rawTitle:s})})}),a&&a!=="*"&&(i=i.filter(o=>{const r=cleanTitleForIndex(o.rawTitle);return a==="#"?/^\d/.test(r):getIndexLetter(r)===a})),i.sort((o,r)=>naturalSort(cleanTitleForIndex(o.displayTitle),cleanTitleForIndex(r.displayTitle))),e.innerHTML=i.map(o=>`
    <li ${dataAction("openSong",[o.song.id])}>
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <span class="list-row-title">${o.displayTitle}</span>
        <span class="list-row-flags">
          ${renderLanguageFlags(o.song,!0,!1,!0)}${renderBanderasEquivalentes(o.song,!0)}
        </span>
      </div>
    </li>
  `).join("")}function buildDisplayTitle(a,e){const n=a?.idiomas?.[idiomaActual];if(getLibroDef(libroActual)?.numeroHimno){const i=parseInt(n?.numero_himno,10);if(!isNaN(i)&&i>0)return`${i} - ${e}`}return e}function getHymnNumbersByLanguage(a){return getLibroSongs(libroActual).map(e=>parseInt(e.idiomas?.[a]?.numero_himno,10)).filter(e=>!isNaN(e)).sort((e,n)=>e-n)}function buildHymnRanges(a){const e=getHymnNumbersByLanguage(a);if(!e.length)return[];const n=e[0],i=e[e.length-1],o=50,r=[];for(let s=Math.floor(n/o)*o+1;s<=i;s+=o){const l=Math.min(s+o-1,i);e.some(d=>d>=s&&d<=l)&&r.push([s,l])}return r}function expandSongTitles(a){const e=a.idiomas?.[idiomaActual]||{},n=e.titulo||[],i=e.titulo2||[];return[...normalizeField(n),...normalizeField(i)].map(r=>(r||"").trim()).filter(Boolean).map(r=>({song:a,title:r}))}function getSortedData(){const a=[...getDataActual()];return getLibroDef(libroActual)?.numeroHimno?a.sort((e,n)=>{const i=parseInt(e.idiomas?.[idiomaActual]?.numero_himno||0,10),o=parseInt(n.idiomas?.[idiomaActual]?.numero_himno||0,10);return i-o}):a.sort((e,n)=>{const i=getSongSortKey(e).num,o=getSongSortKey(n).num;return i-o})}function getSongSortKey(a){const n=(a.idiomas?.[idiomaActual]?.titulo||"").match(/^(\d+)/);return n?{type:"number",num:parseInt(n[1],10)}:{type:"text",num:999999}}function renderAlphabet(){const a=document.getElementById("alfabeto"),e=getDataActual();let n=new Set;e.forEach(l=>{const m=l.idiomas?.[idiomaActual]?.titulo;if(!m)return;const d=m.replace(/^[¿¡!?\s"'“”‘’]+/,""),u=normalize(d.charAt(0));u&&(/^\d/.test(u)?n.add("#"):n.add(u))});let i=Array.from(n).sort();getLibroDef(libroActual)?.numeroHimno?i=i.filter(l=>l!=="#"):i.includes("#")||i.unshift("#"),i.unshift("*"),a.innerHTML=`
    <div class="alpha-row">

      ${i.map(l=>`
        <button class="alpha" data-letter="${l}" ${dataAction("selectLetter",[l])}>
          ${l==="*"?"\u{1F524}":l==="#"?"#\uFE0F\u20E3":l}
        </button>
      `).join("")}

    </div>
  `;const o=document.getElementById("himnoRangosNav"),r=document.getElementById("himnoRangos");if(o&&r){const l=getLibroDef(libroActual)?.numeroHimno?buildHymnRanges(idiomaActual):[];l.length>0?(o.classList.remove("hidden"),r.innerHTML=`
        <div class="alpha-row">
          ${l.map(m=>`
            <button class="alpha" ${dataAction("selectRange",[m[0],m[1]])}>
              ${m[0]}-${m[1]}
            </button>
          `).join("")}
        </div>
      `):(o.classList.add("hidden"),r.innerHTML=""),window.syncHeaderOffsets?.()}const s=document.getElementById("letterRail");s&&(s.innerHTML=i.map(l=>`
      <span data-letter="${l}">${l==="*"?"\u25CF":l==="#"?"#":l}</span>
    `).join("")),highlightLetter(letraActiva)}function highlightLetter(a){let e=null;document.querySelectorAll("#alfabeto [data-letter]").forEach(n=>{const i=a!==null&&n.dataset.letter===a;n.classList.toggle("active",i),i&&(e=n)}),document.querySelectorAll("#letterRail [data-letter]").forEach(n=>{n.classList.toggle("active",a!==null&&n.dataset.letter===a)}),e&&e.scrollIntoView({behavior:"smooth",inline:"center",block:"nearest"})}function selectRange(a,e){stopTeleprompter(),ocultarMensajeInicio(),ocultarCancionActual(),openList(),renderHymnRange(a,e),letraActiva=null,highlightLetter(null),listaVisible=!0,window.scrollTo({top:0,behavior:"smooth"})}function renderHymnRange(a,e){const n=document.getElementById("indice"),i=getLibroSongs(libroActual).map(o=>{const r=parseInt(o.idiomas?.[idiomaActual]?.numero_himno,10);return{song:o,num:r}}).filter(o=>o.num>=a&&o.num<=e).sort((o,r)=>o.num-r.num);n.innerHTML=i.map(o=>{const r=o.song.idiomas?.[idiomaActual]||{},s=parseInt(r.numero_himno,10),l=r.titulo||o.song.titulo_original||"Sin t\xEDtulo",m=isNaN(s)?`${l}`:`${s} - ${l}`;return`
      <li ${dataAction("openSong",[o.song.id])}>
        <div style="display:flex; justify-content:space-between;">
          <span class="list-row-title">${m}</span>
          <span class="lang-flags-list">
            ${renderLanguageFlags(o.song,!0,!1,!0)}${renderBanderasEquivalentes(o.song,!0)}
          </span>
        </div>
      </li>
    `}).join("")}function getAlphabetData(){return getLibroSongs(libroActual)}let teleprompterActive=!1,teleprompterSpeedMult=1,teleprompterLastTs=null,teleprompterRAF=null,teleprompterRestante=0;const TELEPROMPTER_DEFAULT_BPM=80,TELEPROMPTER_PX_PER_BEAT=10;function getTeleprompterPxPerSecond(){const a=document.getElementById("teleprompterBar"),e=parseInt(a?.dataset.bpm,10);return(!isNaN(e)&&e>0?e:TELEPROMPTER_DEFAULT_BPM)/60*TELEPROMPTER_PX_PER_BEAT*teleprompterSpeedMult}function toggleTeleprompter(){teleprompterActive?stopTeleprompter():startTeleprompter()}function startTeleprompter(){const a=document.getElementById("teleprompterBar");if(!a)return;teleprompterActive=!0,teleprompterLastTs=null,teleprompterRestante=0;const e=document.getElementById("teleprompterPlayBtn");e&&(e.textContent="\u23F8",e.classList.add("active")),a.classList.add("active");const n=i=>{if(teleprompterActive){if(teleprompterLastTs!==null){const o=(i-teleprompterLastTs)/1e3;teleprompterRestante+=getTeleprompterPxPerSecond()*o;const r=Math.floor(teleprompterRestante);if(r>=1&&(window.scrollBy(0,r),teleprompterRestante-=r),window.innerHeight+window.scrollY>=document.documentElement.scrollHeight-2){stopTeleprompter();return}}teleprompterLastTs=i,teleprompterRAF=requestAnimationFrame(n)}};teleprompterRAF=requestAnimationFrame(n)}function stopTeleprompter(){teleprompterActive=!1,teleprompterLastTs=null,teleprompterRAF&&(cancelAnimationFrame(teleprompterRAF),teleprompterRAF=null);const a=document.getElementById("teleprompterPlayBtn");a&&(a.textContent="\u25B6",a.classList.remove("active")),document.getElementById("teleprompterBar")?.classList.remove("active")}function adjustTeleprompterSpeed(a){teleprompterSpeedMult=Math.min(3,Math.max(.4,+(teleprompterSpeedMult+a*.1).toFixed(1)));const e=document.getElementById("teleprompterSpeedLabel");e&&(e.textContent=teleprompterSpeedMult.toFixed(1)+"x")}
