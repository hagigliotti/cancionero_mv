function hasHymnNumbersInCurrentLanguage(){return getLibroSongs(libroActual).some(o=>{const e=parseInt(o.idiomas?.[idiomaActual]?.numero_himno,10);return!isNaN(e)&&e>0})}function naturalSort(o,e){const n=o.match(/(\D+)|(\d+)/g),r=e.match(/(\D+)|(\d+)/g),a=Math.min(n.length,r.length);for(let i=0;i<a;i++){const s=n[i],l=r[i],m=Number(s),d=Number(l);if(!isNaN(m)&&!isNaN(d)){if(m!==d)return m-d}else if(s!==l)return s.localeCompare(l,void 0,{sensitivity:"base"})}return n.length-r.length}function cleanTitleForIndex(o){return normalize(o).trim().replace(/^[¿¡!?"'“”‘’()\[\]\s]+/,"")}function getIndexLetter(o){const n=cleanTitleForIndex(o).charAt(0).toUpperCase();return n.match(/[A-ZÁÉÍÓÚÑ0-9]/i)?n:"#"}function normalizePersonField(o){return o?(Array.isArray(o)?o:[o]).map(n=>(n||"").trim()).filter(n=>n&&n!=="-"):[]}const ORDEN_LIBROS_EQUIV=["himnario","himnario_1962","melodias_de_victoria","cancionero","innario"];function calcularBanderasEquivalentes(o){const e=new Set(Object.keys(o.idiomas||{}).map(a=>o.idiomas[a]?.idioma_real||a)),n=ORDEN_LIBROS_EQUIV,r=new Map;return getEquivalenciasDe(o).forEach(a=>{const i=getSongPorIdRapido(a.id);i&&Object.keys(i.idiomas||{}).forEach(s=>{const l=i.idiomas[s];if(!l?.titulo)return;const m=l.idioma_real||s;if(e.has(m))return;const d=n.indexOf(a.libro),u=r.get(m);(!u||d<u.rank)&&r.set(m,{eq:a,lang:s,rank:d,audio:!!l.audio_url})})}),r}function renderBanderasEquivalentes(o,e=!1){const n=calcularBanderasEquivalentes(o),r=marcasEquivalentesPorIdioma(o);return[...n.entries()].sort((a,i)=>(FLAG_NAMES[a[0]]||a[0]).localeCompare(FLAG_NAMES[i[0]]||i[0])).map(([a,i])=>{const s=getLibroDef(i.eq.libro),l=ladoBanderaHtml(e&&i.audio,marcasLibrosHtml(r.get(a))),m=`${IDIOMA_NOMBRES[a]||a} \u2014 ${s?.nombre||i.eq.libro}${i.eq.numero?" #"+i.eq.numero:""}`;return`<span class="flag flag-lado" ${dataAction("abrirEquivalente",[i.eq.id,i.lang])} title="${escapeHtml(m)}"><span class="flag-emoji" data-flag-lang="${a}">${getFlagEmoji(a)}</span>${l}</span>`}).join("")}function marcasEquivalentesPorIdioma(o){const e=new Map,n=getLibroIdDeSong(o),r=getLibroDef(n);if(n&&n!==libroActual&&r?.marca){const a=r.idiomaDefault||"es",i=Object.keys(o.idiomas||{}).find(s=>o.idiomas[s]?.titulo&&(o.idiomas[s].idioma_real||s)===a);if(i){const s=o.idiomas[i].numero_himno;e.set(a,[{eq:{id:o.id,libro:n,numero:s},lang:i,numeros:s?[s]:[],propio:!0}])}}return getEquivalenciasDe(o).forEach(a=>{const i=getSongPorIdRapido(a.id);if(!i)return;const s=getLibroDef(a.libro)?.idiomaDefault||"es";Object.keys(i.idiomas||{}).forEach(l=>{const m=i.idiomas[l];if(!m?.titulo)return;const d=m.idioma_real||l;if(d!==s)return;const u=e.get(d)||[],f=u.find($=>$.eq.libro===a.libro);f?a.numero&&f.numeros.push(a.numero):u.push({eq:a,lang:l,numeros:a.numero?[a.numero]:[]}),e.set(d,u)})}),e.forEach(a=>a.sort((i,s)=>(s.propio?1:0)-(i.propio?1:0)||ORDEN_LIBROS_EQUIV.indexOf(i.eq.libro)-ORDEN_LIBROS_EQUIV.indexOf(s.eq.libro))),e}function marcasLibrosHtml(o){return o?.length?o.map(e=>{const n=getLibroDef(e.eq.libro);if(!n?.marca)return"";const r=`${n.nombre}${e.numeros.length?" #"+e.numeros.join(", #"):""}`;return`<small class="libro-marca marca-equiv" ${dataAction("abrirEquivalente",[e.eq.id,e.lang])} title="${escapeHtml(r)}">${escapeHtml(n.marca)}</small>`}).join(""):""}function ladoBanderaHtml(o,e){const n=o?'<span class="flag-audio-note">\u266A</span>':"";return n||e?`<span class="flag-side">${n}${e}</span>`:""}function renderEquivalenciasHtml(o){const e=getEquivalenciasDe(o);if(!e.length)return"";const n=e.map(r=>{const a=getLibroDef(r.libro)?.nombre||r.libro,i=r.numero?`${a} #${r.numero}`:`${a}: ${r.titulo}`,s=[r.tipo==="parcial"?"Letra o m\xFAsica con diferencias, u otra traducci\xF3n":"Mismo canto",r.confianza==="baja"?"a confirmar":"",r.nota||""].filter(Boolean).join(" \xB7 ");return`<span class="equiv-link" ${dataAction("abrirEquivalente",[r.id])} title="${escapeHtml(s)}">${escapeHtml(i)}</span>`}).join(", ");return`<div><b>${t("tambien_en")}:</b> ${n}</div>`}function openSong(o){mostrarCancionActual();const e=getTodasLasCanciones().find(c=>c.id===o||c.slug===o);if(!e){document.getElementById("contenido").innerHTML=`<p>${t("cancion_no_disp_libro")}</p>`,updateClearSearchBtn();return}const n=detectLibroBySong(e);libroActual===n&&(renderAlphabet(),updateAppTitle());const r=varianteDeCancion(e);let a=e?.idiomas?.[r];if(!a){const c=Object.keys(e.idiomas||{}).filter(b=>!esVarianteRegional(b));c.length>0&&(idiomaActual=c[0],a=e.idiomas[idiomaActual])}if(!a){document.getElementById("contenido").innerHTML=`<p>${t("cancion_no_disp_idioma")}</p>`,updateClearSearchBtn();return}closeList(),listaVisible=!1,letraActiva=null,ocultarMensajeInicio(),stopTeleprompter(),teleprompterSpeedMult=1;const i=getNumeroHimno(e),s=a.titulo||e.titulo_original||"Sin t\xEDtulo",l=i?`${i} - ${s}`:s,m=getLibroDef(getLibroIdDeSong(e)),d=m?.marca&&getEquivalenciasDe(e).length?`<small class="libro-marca titulo-libro-marca" title="${escapeHtml(m.nombre)}">${escapeHtml(m.marca)}</small>`:"",u=(a.titulo2||[]).map(c=>(c||"").trim()).filter(c=>c&&c!=="-"),f=u.length?` | <b>${t("otros_titulos")}:</b> ${u.join(", ")}`:"",A=(Array.isArray(e.titulo_original)?e.titulo_original:e.titulo_original?[e.titulo_original]:[]).map(c=>(c||"").trim()).filter(c=>c&&c!=="-"),h=normalizePersonField(a.traductor),y=h.length?`${renderPersonLinks("Traductor",h)} | `:"",v=normalizePersonField(a.arreglo),L=v.length?`${renderPersonLinks("Arreglo",v)} | `:"",E=normalizeArrayField(a.partitura).map(rutaPartituraExistente).filter(Boolean).length?`<button type="button" class="partitura-btn" ${dataAction("abrirPartituraCancion",[e.id,r])}>${t("click_aqui")}</button>`:t("no"),M=`
    <div class="song-meta">

      <div class="flags">
        <b>${t("idiomas")}:</b> ${renderLanguageFlags(e,!1,!0)}${renderBanderasEquivalentes(e)}
      </div>

      <div>
        <b>${t("original")}:</b>
          ${A.length?`
              <i><span class="original-title">"${A.join(", ")}"</span></i>
            `:""}
        ${f}
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
        ${normalizeReferenciaBiblica(e.referencia_biblica).length?typeof bibLinkearTexto=="function"?bibLinkearTexto(normalizeReferenciaBiblica(e.referencia_biblica).join(", ")):normalizeReferenciaBiblica(e.referencia_biblica).map(c=>`<a href="${`https://www.biblegateway.com/passage/?search=${encodeURIComponent(c)}&version=RVR1960`}" target="_blank">${c}</a>`).join(", "):t("no")}
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
        ${e.tags?.length?[...e.tags].map(c=>c?.toString().trim()).filter(Boolean).sort((c,b)=>getTagDisplay(c,idiomaActual).localeCompare(getTagDisplay(b,idiomaActual),"es",{sensitivity:"base"})).map(c=>{const b=getTagDisplay(c,idiomaActual);return`<span class="tag-link" ${dataAction("openPersonModal",[c,"tags",{tipo:"tags",filtroIdioma:idiomaActual,fromInfo:!1}])}>${b}</span>`}).join(", "):t("desconocido")} |

        <b>${t("revisado")}:</b>
          <span
            class="song-meta-revisado"
            data-revisado='${JSON.stringify(a.revisado)}'
            ${dataAction("openRevisadoList",["@el"])}
          >
            ${formatRevisadoEstado(a.revisado)}
          </span>

          <span class="revisado-personas">
            ${renderRevisadoPersonas(a.revisado)}
          </span>


        ${renderAudioLink(e,a)}
      </div>

      ${renderEquivalenciasHtml(e)}

    </div>

  `,g=e.idiomas?.[idiomaActual]?.nota,p=Array.isArray(g)?g.map(c=>(c||"").trim()).filter(c=>c!==""):typeof g=="string"?g.trim():"",T=Array.isArray(p)?p.length>0:p!=="";document.getElementById("contenido").innerHTML=`
  <div class="song-title-row" id="songTitleRow" data-song-id="${escapeHtml(e.id)}" data-lang="${escapeHtml(idiomaActual)}">
    <h2 class="song-title-text">${l}${d}</h2>
    <button type="button" class="fav-add-btn" ${dataAction("abrirMisListas",[e.id])} title="Agregar a una lista">\u2B50</button>
    ${Array.isArray(a.letra)&&a.letra.length&&typeof editorAcordesActivo=="function"&&editorAcordesActivo()?`<button type="button" class="editar-acordes-btn" ${dataAction("edTocarLapiz")} title="${escapeHtml(tEd("editar"))}" aria-label="${escapeHtml(tEd("editar"))}">\u270F\uFE0F</button>`:""}

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
    ${renderLyrics(a.letra)}
  </div>

  ${T?`
        <div class="song-note">
          ${Array.isArray(p)?p.map(c=>`<p>${c}</p>`).join(""):p.split(`
`).map(c=>`<p>${c}</p>`).join("")}
        </div>
      `:""}
`,applyTablaturaState(),applyTeleprompterBarVisibility(),resetTranspose(),window.scrollTo({top:0,behavior:"smooth"}),updateClearSearchBtn()}function selectLetter(o){if(letraActiva===o&&listaVisible){closeList(),letraActiva=null,highlightLetter(null),document.getElementById("contenido").innerHTML.trim()?mostrarCancionActual():mostrarMensajeInicio();return}abrirLetra(o)}function abrirLetra(o){letraActiva=o,listaVisible=!0,ocultarMensajeInicio(),ocultarCancionActual(),openList(),renderList(o),highlightLetter(o),window.scrollTo({top:0,behavior:"smooth"})}function renderList(o){const e=document.getElementById("indice");let n=getSortedData(),r=[];n.forEach(a=>{getAllSongTitles(a).forEach(s=>{r.push({song:a,displayTitle:buildDisplayTitle(a,s),rawTitle:s})})}),o&&o!=="*"&&(r=r.filter(a=>{const i=cleanTitleForIndex(a.rawTitle);return o==="#"?/^\d/.test(i):getIndexLetter(i)===o})),r.sort((a,i)=>naturalSort(cleanTitleForIndex(a.displayTitle),cleanTitleForIndex(i.displayTitle))),e.innerHTML=r.map(a=>`
    <li ${dataAction("openSong",[a.song.id])}>
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <span class="list-row-title">${a.displayTitle}</span>
        <span class="list-row-flags">
          ${renderLanguageFlags(a.song,!0,!1,!0)}${renderBanderasEquivalentes(a.song,!0)}
        </span>
      </div>
    </li>
  `).join("")}function buildDisplayTitle(o,e){const n=o?.idiomas?.[idiomaActual];if(getLibroDef(libroActual)?.numeroHimno){const r=parseInt(n?.numero_himno,10);if(!isNaN(r)&&r>0)return`${r} - ${e}`}return e}function getHymnNumbersByLanguage(o){return getLibroSongs(libroActual).map(e=>parseInt(e.idiomas?.[o]?.numero_himno,10)).filter(e=>!isNaN(e)).sort((e,n)=>e-n)}function buildHymnRanges(o){const e=getHymnNumbersByLanguage(o);if(!e.length)return[];const n=e[0],r=e[e.length-1],a=50,i=[];for(let s=Math.floor(n/a)*a+1;s<=r;s+=a){const l=Math.min(s+a-1,r);e.some(d=>d>=s&&d<=l)&&i.push([s,l])}return i}function expandSongTitles(o){const e=o.idiomas?.[idiomaActual]||{},n=e.titulo||[],r=e.titulo2||[];return[...normalizeField(n),...normalizeField(r)].map(i=>(i||"").trim()).filter(Boolean).map(i=>({song:o,title:i}))}function getSortedData(){const o=[...getDataActual()];return getLibroDef(libroActual)?.numeroHimno?o.sort((e,n)=>{const r=parseInt(e.idiomas?.[idiomaActual]?.numero_himno||0,10),a=parseInt(n.idiomas?.[idiomaActual]?.numero_himno||0,10);return r-a}):o.sort((e,n)=>{const r=getSongSortKey(e).num,a=getSongSortKey(n).num;return r-a})}function getSongSortKey(o){const n=(o.idiomas?.[idiomaActual]?.titulo||"").match(/^(\d+)/);return n?{type:"number",num:parseInt(n[1],10)}:{type:"text",num:999999}}function renderAlphabet(){const o=document.getElementById("alfabeto"),e=getDataActual();let n=new Set;e.forEach(l=>{const m=l.idiomas?.[idiomaActual]?.titulo;if(!m)return;const d=m.replace(/^[¿¡!?\s"'“”‘’]+/,""),u=normalize(d.charAt(0));u&&(/^\d/.test(u)?n.add("#"):n.add(u))});let r=Array.from(n).sort();getLibroDef(libroActual)?.numeroHimno?r=r.filter(l=>l!=="#"):r.includes("#")||r.unshift("#"),r.unshift("*"),o.innerHTML=`
    <div class="alpha-row">

      ${r.map(l=>`
        <button class="alpha" data-letter="${l}" ${dataAction("selectLetter",[l])}>
          ${l==="*"?"\u{1F524}":l==="#"?"#\uFE0F\u20E3":l}
        </button>
      `).join("")}

    </div>
  `;const a=document.getElementById("himnoRangosNav"),i=document.getElementById("himnoRangos");if(a&&i){const l=getLibroDef(libroActual)?.numeroHimno?buildHymnRanges(idiomaActual):[];l.length>0?(a.classList.remove("hidden"),i.innerHTML=`
        <div class="alpha-row">
          ${l.map(m=>`
            <button class="alpha" ${dataAction("selectRange",[m[0],m[1]])}>
              ${m[0]}-${m[1]}
            </button>
          `).join("")}
        </div>
      `):(a.classList.add("hidden"),i.innerHTML=""),window.syncHeaderOffsets?.()}const s=document.getElementById("letterRail");s&&(s.innerHTML=r.map(l=>`
      <span data-letter="${l}">${l==="*"?"\u25CF":l==="#"?"#":l}</span>
    `).join("")),highlightLetter(letraActiva)}function highlightLetter(o){let e=null;document.querySelectorAll("#alfabeto [data-letter]").forEach(n=>{const r=o!==null&&n.dataset.letter===o;n.classList.toggle("active",r),r&&(e=n)}),document.querySelectorAll("#letterRail [data-letter]").forEach(n=>{n.classList.toggle("active",o!==null&&n.dataset.letter===o)}),e&&e.scrollIntoView({behavior:"smooth",inline:"center",block:"nearest"})}function selectRange(o,e){stopTeleprompter(),ocultarMensajeInicio(),ocultarCancionActual(),openList(),renderHymnRange(o,e),letraActiva=null,highlightLetter(null),listaVisible=!0,window.scrollTo({top:0,behavior:"smooth"})}function renderHymnRange(o,e){const n=document.getElementById("indice"),r=getLibroSongs(libroActual).map(a=>{const i=parseInt(a.idiomas?.[idiomaActual]?.numero_himno,10);return{song:a,num:i}}).filter(a=>a.num>=o&&a.num<=e).sort((a,i)=>a.num-i.num);n.innerHTML=r.map(a=>{const i=a.song.idiomas?.[idiomaActual]||{},s=parseInt(i.numero_himno,10),l=i.titulo||a.song.titulo_original||"Sin t\xEDtulo",m=isNaN(s)?`${l}`:`${s} - ${l}`;return`
      <li ${dataAction("openSong",[a.song.id])}>
        <div style="display:flex; justify-content:space-between;">
          <span class="list-row-title">${m}</span>
          <span class="lang-flags-list">
            ${renderLanguageFlags(a.song,!0,!1,!0)}${renderBanderasEquivalentes(a.song,!0)}
          </span>
        </div>
      </li>
    `}).join("")}function getAlphabetData(){return getLibroSongs(libroActual)}let teleprompterActive=!1,teleprompterSpeedMult=1,teleprompterLastTs=null,teleprompterRAF=null,teleprompterRestante=0;const TELEPROMPTER_DEFAULT_BPM=80,TELEPROMPTER_PX_PER_BEAT=10;function getTeleprompterPxPerSecond(){const o=document.getElementById("teleprompterBar"),e=parseInt(o?.dataset.bpm,10);return(!isNaN(e)&&e>0?e:TELEPROMPTER_DEFAULT_BPM)/60*TELEPROMPTER_PX_PER_BEAT*teleprompterSpeedMult}function toggleTeleprompter(){teleprompterActive?stopTeleprompter():startTeleprompter()}function startTeleprompter(){const o=document.getElementById("teleprompterBar");if(!o)return;teleprompterActive=!0,teleprompterLastTs=null,teleprompterRestante=0;const e=document.getElementById("teleprompterPlayBtn");e&&(e.textContent="\u23F8",e.classList.add("active")),o.classList.add("active");const n=r=>{if(teleprompterActive){if(teleprompterLastTs!==null){const a=(r-teleprompterLastTs)/1e3;teleprompterRestante+=getTeleprompterPxPerSecond()*a;const i=Math.floor(teleprompterRestante);if(i>=1&&(window.scrollBy(0,i),teleprompterRestante-=i),window.innerHeight+window.scrollY>=document.documentElement.scrollHeight-2){stopTeleprompter();return}}teleprompterLastTs=r,teleprompterRAF=requestAnimationFrame(n)}};teleprompterRAF=requestAnimationFrame(n)}function stopTeleprompter(){teleprompterActive=!1,teleprompterLastTs=null,teleprompterRAF&&(cancelAnimationFrame(teleprompterRAF),teleprompterRAF=null);const o=document.getElementById("teleprompterPlayBtn");o&&(o.textContent="\u25B6",o.classList.remove("active")),document.getElementById("teleprompterBar")?.classList.remove("active")}function adjustTeleprompterSpeed(o){teleprompterSpeedMult=Math.min(3,Math.max(.4,+(teleprompterSpeedMult+o*.1).toFixed(1)));const e=document.getElementById("teleprompterSpeedLabel");e&&(e.textContent=teleprompterSpeedMult.toFixed(1)+"x")}
