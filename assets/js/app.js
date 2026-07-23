const RUTA_CATEGORIAS = "categories/";
const TIEMPO_LIMITE_MS = 7000;

async function fetchConTiempoLimite(url, ms) {
    const controlador = new AbortController();
    const temporizador = setTimeout(function () {
        controlador.abort();
    }, ms || TIEMPO_LIMITE_MS);

    try {
        const respuesta = await fetch(url, { signal: controlador.signal });
        return respuesta;
    } finally {
        clearTimeout(temporizador);
    }
}

async function cargarCategorias() {
    const fleet = document.getElementById("fleet");

    try {
        const respuestaIndice = await fetch(RUTA_CATEGORIAS + "index.json");
        const indice = await respuestaIndice.json();

        fleet.innerHTML = "";

        for (const entrada of indice.categorias) {
            const respuestaDetalle = await fetch(RUTA_CATEGORIAS + entrada.id + ".json");
            const categoria = await respuestaDetalle.json();
            renderCategoria(categoria, fleet);
        }
    } catch (error) {
        fleet.innerHTML = "";
        const mensaje = document.createElement("p");
        mensaje.className = "error";
        mensaje.textContent = "No se pudieron cargar las categorías: " + error.message;
        fleet.appendChild(mensaje);
    }
}

function renderCategoria(cat, contenedor) {
    const details = document.createElement("details");
    details.className = "cat-" + cat.id;

    const summary = document.createElement("summary");

    const encabezado = document.createElement("span");
    encabezado.className = "cat-encabezado";

    if (cat.icono) {
        const icono = document.createElement("i");
        icono.className = cat.icono + " cat-icono";
        encabezado.appendChild(icono);
    }

    const nombre = document.createElement("span");
    nombre.textContent = cat.nombre;
    encabezado.appendChild(nombre);
    summary.appendChild(encabezado);

    const chips = document.createElement("span");
    chips.className = "cat-chips";

    if (cat.conceptos && cat.conceptos.length > 0) {
        const chipConceptos = document.createElement("span");
        chipConceptos.className = "meta-progress";
        chipConceptos.id = "progreso-conceptos-" + cat.id;
        chips.appendChild(chipConceptos);
    }

    if (cat.metasSugeridas && cat.metasSugeridas.length > 0) {
        const chip = document.createElement("span");
        chip.className = "meta-progress";
        chip.id = "progreso-" + cat.id;
        chips.appendChild(chip);
    }

    summary.appendChild(chips);
    details.appendChild(summary);

    if (cat.plataformas && cat.plataformas.length > 0) {
        const plataformas = document.createElement("p");
        plataformas.className = "plataformas";
        plataformas.textContent = "Plataformas: " + cat.plataformas.join(", ");
        details.appendChild(plataformas);
    }

    if (cat.id === "cripto") {
        details.appendChild(crearWidgetsCripto());
    }

    if (cat.id === "pesas") {
        details.appendChild(crearCalculadoraPesas());
    }

    if (cat.mostrarNoticias) {
        const seccionNoticias = crearSeccion("Noticias");
        const listaNoticias = document.createElement("ul");

        const cargando = document.createElement("li");
        cargando.className = "loading";
        cargando.textContent = "Cargando noticias...";
        listaNoticias.appendChild(cargando);

        seccionNoticias.appendChild(listaNoticias);

        if (cat.id === "cripto") {
            const seguimiento = crearSeguimientoPrecios();
            const recargarTodo = function () {
                cargarNoticiasCripto(cat, listaNoticias);
                cargarPreciosSeguidos(seguimiento.lista);
            };
            details.appendChild(crearSelectorMonedas(recargarTodo));
            details.appendChild(seguimiento.contenedor);
            details.appendChild(seccionNoticias);
            recargarTodo();
        } else {
            details.appendChild(seccionNoticias);
            cargarNoticias(cat, listaNoticias);
        }
    }

    if (cat.conceptos && cat.conceptos.length > 0) {
        const chipConceptos = summary.querySelector(".cat-chips .meta-progress");

        if (cat.id === "programacion") {
            details.appendChild(crearRoadmap(cat, chipConceptos));
        } else {
            const seccionConceptos = crearSeccion("Conceptos que debo dominar");
            const listaConceptos = document.createElement("ul");
            listaConceptos.className = "lista-conceptos";

            cat.conceptos.forEach(function (concepto, indice) {
                const li = document.createElement("li");
                li.className = "concepto-item nivel-" + concepto.nivel;

                const checkbox = document.createElement("input");
                checkbox.type = "checkbox";
                checkbox.id = "concepto-" + cat.id + "-" + (indice + 1);

                if (localStorage.getItem(checkbox.id) === "true") {
                    checkbox.checked = true;
                    li.classList.add("aprendido");
                }

                checkbox.addEventListener("click", function () {
                    localStorage.setItem(checkbox.id, checkbox.checked);
                    li.classList.toggle("aprendido", checkbox.checked);
                    actualizarProgresoConceptos(cat, chipConceptos);
                });

                const textoWrap = document.createElement("span");
                textoWrap.className = "concepto-texto-wrap";

                const badge = document.createElement("span");
                badge.className = "nivel-badge";
                badge.textContent = concepto.nivel;

                const texto = document.createElement("span");
                texto.textContent = concepto.titulo;

                textoWrap.appendChild(badge);
                textoWrap.appendChild(texto);

                li.appendChild(checkbox);
                li.appendChild(textoWrap);
                listaConceptos.appendChild(li);
            });

            seccionConceptos.appendChild(listaConceptos);
            details.appendChild(seccionConceptos);
        }

        actualizarProgresoConceptos(cat, chipConceptos);
    }

    if (cat.metasSugeridas && cat.metasSugeridas.length > 0) {
        const seccionMetas = crearSeccion("Metas");
        const listaMetas = document.createElement("ul");
        listaMetas.className = "lista-metas";
        const chipProgreso = summary.querySelector("#progreso-" + cat.id);

        cat.metasSugeridas.forEach(function (metaTexto, indice) {
            const li = document.createElement("li");
            li.className = "meta-item";

            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.id = "meta-" + cat.id + "-" + (indice + 1);

            const valorGuardado = localStorage.getItem(checkbox.id);
            if (valorGuardado === "true") {
                checkbox.checked = true;
            }

            checkbox.addEventListener("click", function () {
                localStorage.setItem(checkbox.id, checkbox.checked);
                actualizarProgresoMetas(cat, chipProgreso);
            });

            const texto = document.createElement("span");
            texto.textContent = metaTexto;

            li.appendChild(checkbox);
            li.appendChild(texto);
            listaMetas.appendChild(li);
        });

        seccionMetas.appendChild(listaMetas);
        details.appendChild(seccionMetas);
        actualizarProgresoMetas(cat, chipProgreso);
    }

    if (cat.sugerencias) {
        const seccionSugerencias = crearBloquePlataformas("Sugerencias de este mes", cat.sugerencias);
        details.appendChild(seccionSugerencias);
        if (cat.id === "videojuegos") {
            cargarSugerenciasPC(seccionSugerencias);
            cargarSugerenciasNintendo(seccionSugerencias);
        }
    }

    if (cat.ofertas) {
        const seccionOfertas = crearBloquePlataformas("Mejores ofertas", cat.ofertas);
        details.appendChild(seccionOfertas);
        if (cat.id === "videojuegos") {
            cargarOfertasPC(seccionOfertas);
            cargarOfertasNintendo(seccionOfertas);
        }
    }

    if (cat.mejorCalificados) {
        const seccionMejorCalificados = crearBloquePlataformas("Mejor calificados", cat.mejorCalificados);
        details.appendChild(seccionMejorCalificados);
        if (cat.id === "videojuegos") {
            cargarMejorCalificadosPC(seccionMejorCalificados);
            cargarMasPopularesNintendo(seccionMejorCalificados);
        }
    }

    contenedor.appendChild(details);
}

const ICONOS_SECCION = {
    "Noticias": "fa-solid fa-newspaper",
    "Conceptos que debo dominar": "fa-solid fa-book-open",
    "Metas": "fa-solid fa-bullseye",
    "Sugerencias de este mes": "fa-solid fa-star",
    "Mejores ofertas": "fa-solid fa-tag",
    "Mejor calificados": "fa-solid fa-trophy"
};

function crearSeccion(tituloTexto) {
    const seccion = document.createElement("section");
    const h2 = document.createElement("h2");

    const iconoClase = ICONOS_SECCION[tituloTexto];
    if (iconoClase) {
        const icono = document.createElement("i");
        icono.className = iconoClase;
        h2.appendChild(icono);
    }

    const texto = document.createElement("span");
    texto.textContent = tituloTexto;
    h2.appendChild(texto);

    seccion.appendChild(h2);
    return seccion;
}

function crearBloquePlataformas(tituloTexto, datosPorPlataforma) {
    const seccion = crearSeccion(tituloTexto);

    Object.keys(datosPorPlataforma).forEach(function (plataforma) {
        const h3 = document.createElement("h3");
        h3.textContent = plataforma;
        seccion.appendChild(h3);

        const ul = document.createElement("ul");
        ul.dataset.plataforma = plataforma;
        datosPorPlataforma[plataforma].forEach(function (item) {
            const li = document.createElement("li");
            li.textContent = item;
            ul.appendChild(li);
        });
        seccion.appendChild(ul);
    });

    return seccion;
}

function actualizarProgresoMetas(cat, chip) {
    if (!chip) return;

    let hechas = 0;
    cat.metasSugeridas.forEach(function (meta, indice) {
        if (localStorage.getItem("meta-" + cat.id + "-" + (indice + 1)) === "true") {
            hechas++;
        }
    });

    chip.textContent = hechas + "/" + cat.metasSugeridas.length;
}

function actualizarProgresoConceptos(cat, chip) {
    if (!chip) return;

    let aprendidos = 0;
    cat.conceptos.forEach(function (concepto, indice) {
        if (localStorage.getItem("concepto-" + cat.id + "-" + (indice + 1)) === "true") {
            aprendidos++;
        }
    });

    chip.textContent = aprendidos + "/" + cat.conceptos.length + " aprendidos";
}

/* ===== Roadmap de aprendizaje (Programación) ===== */

const ORDEN_NIVELES_ROADMAP = ["básico", "medio", "avanzado"];
const ETIQUETA_NIVEL_ROADMAP = { "básico": "Básico", "medio": "Medio", "avanzado": "Avanzado" };

function crearRoadmap(cat, chipProgreso) {
    const seccion = document.createElement("section");
    seccion.className = "roadmap-seccion";

    const h2 = document.createElement("h2");
    const icono = document.createElement("i");
    icono.className = "fa-solid fa-route";
    h2.appendChild(icono);
    const tituloTexto = document.createElement("span");
    tituloTexto.textContent = "Tu ruta de aprendizaje";
    h2.appendChild(tituloTexto);
    seccion.appendChild(h2);

    const roadmap = document.createElement("div");
    roadmap.className = "roadmap";
    seccion.appendChild(roadmap);

    function repintar() {
        renderizarRoadmapInterior(cat, roadmap, chipProgreso, repintar);
    }

    repintar();
    return seccion;
}

function renderizarRoadmapInterior(cat, roadmap, chipProgreso, repintar) {
    roadmap.innerHTML = "";

    let indiceActual = -1;
    cat.conceptos.forEach(function (concepto, indice) {
        if (indiceActual === -1 && localStorage.getItem("concepto-" + cat.id + "-" + (indice + 1)) !== "true") {
            indiceActual = indice;
        }
    });

    ORDEN_NIVELES_ROADMAP.forEach(function (nivel) {
        const conceptosDelNivel = [];
        cat.conceptos.forEach(function (concepto, indice) {
            if (concepto.nivel === nivel) {
                conceptosDelNivel.push({ concepto: concepto, indiceOriginal: indice });
            }
        });

        if (conceptosDelNivel.length === 0) return;

        const etapa = document.createElement("div");
        etapa.className = "roadmap-etapa";

        const etapaTitulo = document.createElement("h3");
        etapaTitulo.className = "roadmap-etapa-titulo nivel-" + nivel;
        etapaTitulo.textContent = ETIQUETA_NIVEL_ROADMAP[nivel];
        etapa.appendChild(etapaTitulo);

        const linea = document.createElement("div");
        linea.className = "roadmap-linea";

        conceptosDelNivel.forEach(function (entrada) {
            const idCheckbox = "concepto-" + cat.id + "-" + (entrada.indiceOriginal + 1);
            const aprendido = localStorage.getItem(idCheckbox) === "true";
            const esActual = entrada.indiceOriginal === indiceActual;

            const nodo = document.createElement("div");
            nodo.className = "roadmap-nodo" + (aprendido ? " aprendido" : "") + (esActual ? " actual" : "");

            const puntoCol = document.createElement("div");
            puntoCol.className = "roadmap-punto-col";

            const punto = document.createElement("button");
            punto.type = "button";
            punto.className = "roadmap-punto";
            punto.setAttribute("aria-label", entrada.concepto.titulo);

            if (aprendido) {
                const check = document.createElement("i");
                check.className = "fa-solid fa-check";
                punto.appendChild(check);
            } else if (esActual) {
                const flecha = document.createElement("i");
                flecha.className = "fa-solid fa-play";
                punto.appendChild(flecha);
            }

            punto.addEventListener("click", function () {
                localStorage.setItem(idCheckbox, (!aprendido).toString());
                actualizarProgresoConceptos(cat, chipProgreso);
                repintar();
            });

            const conector = document.createElement("span");
            conector.className = "roadmap-conector";

            puntoCol.appendChild(punto);
            puntoCol.appendChild(conector);

            const textoWrap = document.createElement("span");
            textoWrap.className = "roadmap-texto-wrap";

            const texto = document.createElement("span");
            texto.className = "roadmap-texto";
            texto.textContent = entrada.concepto.titulo;
            textoWrap.appendChild(texto);

            if (esActual) {
                const etiquetaActual = document.createElement("span");
                etiquetaActual.className = "roadmap-actual-etiqueta";
                etiquetaActual.textContent = "Siguiente";
                textoWrap.appendChild(etiquetaActual);
            }

            nodo.appendChild(puntoCol);
            nodo.appendChild(textoWrap);
            linea.appendChild(nodo);
        });

        etapa.appendChild(linea);
        roadmap.appendChild(etapa);
    });
}

async function cargarNoticias(cat, listaNoticias) {
    if (!cat.fuentes || cat.fuentes.length === 0) {
        listaNoticias.innerHTML = "";
        const li = document.createElement("li");
        li.className = "error";
        li.textContent = "Esta categoría no tiene fuentes configuradas.";
        listaNoticias.appendChild(li);
        return;
    }

    for (const fuente of cat.fuentes) {
        const url = "https://api.rss2json.com/v1/api.json?rss_url=" + encodeURIComponent(fuente.rss);

        try {
            const respuesta = await fetchConTiempoLimite(url);
            const datos = await respuesta.json();

            if (datos.status !== "ok" || !datos.items || datos.items.length === 0) {
                throw new Error("respuesta sin noticias utilizables");
            }

            listaNoticias.innerHTML = "";
            datos.items.slice(0, 4).forEach(function (item) {
                const li = document.createElement("li");
                const enlace = document.createElement("a");
                enlace.href = item.link;
                enlace.target = "_blank";
                enlace.rel = "noopener";
                enlace.textContent = item.title;
                li.appendChild(enlace);
                listaNoticias.appendChild(li);
            });
            return;
        } catch (error) {
            continue;
        }
    }

    listaNoticias.innerHTML = "";
    const li = document.createElement("li");
    li.className = "error";
    li.textContent = "No se pudieron cargar las noticias de esta categoría ahora mismo.";
    listaNoticias.appendChild(li);
}

function crearWidgetsCripto() {
    const contenedor = document.createElement("div");
    contenedor.className = "widgets";

    const widgetMiedo = crearWidget("Fear & Greed (mercado)");
    contenedor.appendChild(widgetMiedo.widget);
    cargarFearGreed(widgetMiedo.valor);

    return contenedor;
}

const COINGECKO_IDS = {
    "bitcoin": "bitcoin",
    "ethereum": "ethereum",
    "solana": "solana",
    "xrp": "ripple",
    "dogecoin": "dogecoin",
    "cardano": "cardano",
    "polkadot": "polkadot",
    "litecoin": "litecoin",
    "chainlink": "chainlink",
    "avalanche": "avalanche-2",
    "polygon": "matic-network",
    "shiba inu": "shiba-inu",
    "bnb": "binancecoin",
    "tron": "tron",
    "stellar": "stellar",
    "toncoin": "the-open-network",
    "sui": "sui"
};

function obtenerIdCoinGecko(nombreMoneda) {
    const clave = nombreMoneda.trim().toLowerCase();
    if (COINGECKO_IDS[clave]) return COINGECKO_IDS[clave];
    return clave.replace(/\s+/g, "-");
}

function crearSeguimientoPrecios() {
    const contenedor = document.createElement("div");
    contenedor.className = "seguimiento-precios";

    const titulo = document.createElement("p");
    titulo.className = "selector-monedas-titulo";
    titulo.textContent = "Precios de tus monedas:";
    contenedor.appendChild(titulo);

    const lista = document.createElement("div");
    lista.className = "precios-lista";
    contenedor.appendChild(lista);

    return { contenedor: contenedor, lista: lista };
}

async function cargarPreciosSeguidos(lista) {
    const monedas = obtenerMonedasSeguidas();

    if (monedas.length === 0) {
        lista.innerHTML = "";
        const vacio = document.createElement("p");
        vacio.className = "loading";
        vacio.textContent = "No sigues ninguna moneda todavía.";
        lista.appendChild(vacio);
        return;
    }

    lista.innerHTML = "";
    const cargando = document.createElement("p");
    cargando.className = "loading";
    cargando.textContent = "Cargando precios...";
    lista.appendChild(cargando);

    const ids = monedas.map(obtenerIdCoinGecko).join(",");
    const url = "https://api.coingecko.com/api/v3/simple/price?ids=" + encodeURIComponent(ids) + "&vs_currencies=usd&include_24hr_change=true";

    try {
        const respuesta = await fetchConTiempoLimite(url);
        const datos = await respuesta.json();

        lista.innerHTML = "";
        monedas.forEach(function (moneda) {
            const info = datos[obtenerIdCoinGecko(moneda)];

            const fila = document.createElement("div");
            fila.className = "precio-fila";

            const nombre = document.createElement("span");
            nombre.className = "precio-nombre";
            nombre.textContent = moneda;
            fila.appendChild(nombre);

            if (info && typeof info.usd === "number") {
                const precio = document.createElement("span");
                precio.className = "precio-valor";
                const decimales = info.usd < 1 ? 4 : 2;
                precio.textContent = "$" + info.usd.toLocaleString("en-US", { maximumFractionDigits: decimales });
                fila.appendChild(precio);

                if (typeof info.usd_24h_change === "number") {
                    const cambioEl = document.createElement("span");
                    const cambio = info.usd_24h_change;
                    cambioEl.className = "precio-cambio " + (cambio >= 0 ? "positivo" : "negativo");
                    cambioEl.textContent = (cambio >= 0 ? "+" : "") + cambio.toFixed(1) + "%";
                    fila.appendChild(cambioEl);
                }
            } else {
                const noDisponible = document.createElement("span");
                noDisponible.className = "precio-valor loading";
                noDisponible.textContent = "no encontrada";
                fila.appendChild(noDisponible);
            }

            lista.appendChild(fila);
        });
    } catch (error) {
        lista.innerHTML = "";
        const errorEl = document.createElement("p");
        errorEl.className = "error";
        errorEl.textContent = "No se pudieron cargar los precios ahora mismo.";
        lista.appendChild(errorEl);
    }
}

function crearWidget(etiquetaTexto) {
    const widget = document.createElement("div");
    widget.className = "widget";

    const etiqueta = document.createElement("span");
    etiqueta.className = "widget-label";
    etiqueta.textContent = etiquetaTexto;

    const valor = document.createElement("span");
    valor.className = "widget-value";
    valor.textContent = "Cargando...";

    widget.appendChild(etiqueta);
    widget.appendChild(valor);
    return { widget: widget, valor: valor };
}

async function cargarFearGreed(elemento) {
    try {
        const respuesta = await fetchConTiempoLimite("https://api.alternative.me/fng/?limit=1&format=json");
        const datos = await respuesta.json();
        const actual = datos.data[0];
        elemento.textContent = actual.value + " · " + actual.value_classification;
    } catch (error) {
        elemento.textContent = "No disponible";
    }
}

async function cargarOfertasPC(seccionOfertas) {
    const listaPC = seccionOfertas.querySelector('ul[data-plataforma="PC"]');
    if (!listaPC) return;

    try {
        const respuesta = await fetchConTiempoLimite("https://www.cheapshark.com/api/1.0/deals?storeID=1&pageSize=4&sortBy=Recent");
        const ofertas = await respuesta.json();

        if (!Array.isArray(ofertas) || ofertas.length === 0) {
            throw new Error("respuesta sin ofertas");
        }

        listaPC.innerHTML = "";
        listaPC.classList.add("lista-juegos");
        ofertas.forEach(function (oferta) {
            const descuento = Math.round(parseFloat(oferta.savings));
            listaPC.appendChild(crearTarjetaJuego(oferta.title, oferta.thumb, descuento + "% — $" + oferta.salePrice));
        });
    } catch (error) {
        listaPC.innerHTML = "";
        const li = document.createElement("li");
        li.className = "error";
        li.textContent = "No se pudieron cargar las ofertas de Steam ahora mismo.";
        listaPC.appendChild(li);
    }
}

/* ===== Nintendo Switch 2: buscador propio de Nintendo Europe vía proxy CORS ===== */

const NINTENDO_SEARCH_BASE = "https://searching.nintendo-europe.com/es/select";
const CORS_PROXIES = [
    function (objetivo) { return "https://corsproxy.io/?url=" + encodeURIComponent(objetivo); },
    function (objetivo) { return "https://api.allorigins.win/raw?url=" + encodeURIComponent(objetivo); }
];

async function buscarNintendo(parametros) {
    const query = new URLSearchParams(parametros).toString();
    const objetivo = NINTENDO_SEARCH_BASE + "?" + query;

    for (const construirUrl of CORS_PROXIES) {
        try {
            const respuesta = await fetchConTiempoLimite(construirUrl(objetivo), 9000);
            const datos = await respuesta.json();
            if (datos && datos.response && datos.response.docs) {
                return datos.response.docs;
            }
        } catch (error) {
            continue;
        }
    }

    throw new Error("Ningún proxy CORS respondió para Nintendo");
}

async function cargarOfertasNintendo(seccionOfertas) {
    const lista = seccionOfertas.querySelector('ul[data-plataforma="Nintendo Switch 2"]');
    if (!lista) return;

    try {
        const juegos = await buscarNintendo({
            q: "*",
            fq: "type:GAME AND price_has_discount_b:true AND system_type:nintendoswitch2*",
            sort: "price_discount_percentage_f desc",
            rows: "4",
            wt: "json"
        });

        if (!juegos || juegos.length === 0) throw new Error("sin ofertas");

        lista.innerHTML = "";
        lista.classList.add("lista-juegos");
        juegos.forEach(function (juego) {
            const detalle = Math.round(juego.price_discount_percentage_f) + "% — " + juego.price_discounted_f + "€";
            lista.appendChild(crearTarjetaJuego(juego.title, juego.image_url_sq_s, detalle));
        });
    } catch (error) {
        lista.innerHTML = "";
        const li = document.createElement("li");
        li.className = "error";
        li.textContent = "No se pudieron cargar las ofertas de Nintendo ahora mismo.";
        lista.appendChild(li);
    }
}

async function cargarSugerenciasNintendo(seccionSugerencias) {
    const lista = seccionSugerencias.querySelector('ul[data-plataforma="Nintendo Switch 2"]');
    if (!lista) return;

    try {
        const juegos = await buscarNintendo({
            q: "*",
            fq: "type:GAME AND system_type:nintendoswitch2*",
            sort: "date_from desc",
            rows: "3",
            wt: "json"
        });

        if (!juegos || juegos.length === 0) throw new Error("sin sugerencias");

        lista.innerHTML = "";
        lista.classList.add("lista-juegos");
        juegos.forEach(function (juego) {
            lista.appendChild(crearTarjetaJuego(juego.title, juego.image_url_sq_s, "Recién anunciado/lanzado"));
        });
    } catch (error) {
        lista.innerHTML = "";
        const li = document.createElement("li");
        li.className = "error";
        li.textContent = "No se pudieron cargar sugerencias ahora mismo.";
        lista.appendChild(li);
    }
}

async function cargarMasPopularesNintendo(seccionMejorCalificados) {
    const lista = seccionMejorCalificados.querySelector('ul[data-plataforma="Nintendo Switch 2"]');
    if (!lista) return;

    try {
        const juegos = await buscarNintendo({
            q: "*",
            fq: "type:GAME AND system_type:nintendoswitch2*",
            sort: "hits_i desc",
            rows: "4",
            wt: "json"
        });

        if (!juegos || juegos.length === 0) throw new Error("sin datos");

        lista.innerHTML = "";
        lista.classList.add("lista-juegos");
        juegos.forEach(function (juego) {
            lista.appendChild(crearTarjetaJuego(juego.title, juego.image_url_sq_s, "Más buscado en Switch 2 (Nintendo no publica rating)"));
        });
    } catch (error) {
        lista.innerHTML = "";
        const li = document.createElement("li");
        li.className = "error";
        li.textContent = "No se pudieron cargar los más populares ahora mismo.";
        lista.appendChild(li);
    }
}

async function cargarSugerenciasPC(seccionSugerencias) {
    const listaPC = seccionSugerencias.querySelector('ul[data-plataforma="PC"]');
    if (!listaPC) return;

    try {
        const respuesta = await fetchConTiempoLimite("https://www.cheapshark.com/api/1.0/deals?storeID=1&pageSize=3&sortBy=Deal Rating");
        const juegos = await respuesta.json();

        if (!Array.isArray(juegos) || juegos.length === 0) {
            throw new Error("respuesta sin sugerencias");
        }

        listaPC.innerHTML = "";
        listaPC.classList.add("lista-juegos");
        juegos.forEach(function (juego) {
            listaPC.appendChild(crearTarjetaJuego(juego.title, juego.thumb, "Recomendado — " + juego.steamRatingPercent + "% en Steam"));
        });
    } catch (error) {
        listaPC.innerHTML = "";
        const li = document.createElement("li");
        li.className = "error";
        li.textContent = "No se pudieron cargar sugerencias ahora mismo.";
        listaPC.appendChild(li);
    }
}

async function cargarMejorCalificadosPC(seccionMejorCalificados) {
    const listaPC = seccionMejorCalificados.querySelector('ul[data-plataforma="PC"]');
    if (!listaPC) return;

    try {
        const respuesta = await fetchConTiempoLimite("https://www.cheapshark.com/api/1.0/deals?storeID=1&pageSize=4&sortBy=Metacritic");
        const juegos = await respuesta.json();

        if (!Array.isArray(juegos) || juegos.length === 0) {
            throw new Error("respuesta sin juegos");
        }

        listaPC.innerHTML = "";
        listaPC.classList.add("lista-juegos");
        juegos.forEach(function (juego) {
            const tieneMetacritic = juego.metacriticScore && juego.metacriticScore !== "0";
            const puntaje = tieneMetacritic
                ? juego.metacriticScore + "/100 Metacritic"
                : juego.steamRatingPercent + "% en Steam";
            listaPC.appendChild(crearTarjetaJuego(juego.title, juego.thumb, puntaje));
        });
    } catch (error) {
        listaPC.innerHTML = "";
        const li = document.createElement("li");
        li.className = "error";
        li.textContent = "No se pudieron cargar los mejor calificados ahora mismo.";
        listaPC.appendChild(li);
    }
}

function crearTarjetaJuego(tituloTexto, imagenUrl, detalleTexto) {
    const li = document.createElement("li");
    li.className = "tarjeta-juego";

    if (imagenUrl) {
        const img = document.createElement("img");
        img.src = imagenUrl;
        img.alt = tituloTexto;
        img.loading = "lazy";
        li.appendChild(img);
    }

    const info = document.createElement("div");
    info.className = "tarjeta-juego-info";

    const nombre = document.createElement("span");
    nombre.className = "tarjeta-juego-titulo";
    nombre.textContent = tituloTexto;

    const detalle = document.createElement("span");
    detalle.className = "tarjeta-juego-detalle";
    detalle.textContent = detalleTexto;

    info.appendChild(nombre);
    info.appendChild(detalle);
    li.appendChild(info);

    return li;
}

/* ===== Cripto: monedas seguidas + noticias filtradas ===== */

const MONEDAS_POR_DEFECTO = ["Bitcoin", "Ethereum", "Solana", "XRP"];

function obtenerMonedasSeguidas() {
    const guardado = localStorage.getItem("cripto-monedas-seguidas");
    if (!guardado) return MONEDAS_POR_DEFECTO.slice();

    try {
        return JSON.parse(guardado);
    } catch (error) {
        return MONEDAS_POR_DEFECTO.slice();
    }
}

function guardarMonedasSeguidas(monedas) {
    localStorage.setItem("cripto-monedas-seguidas", JSON.stringify(monedas));
}

function crearSelectorMonedas(alCambiarMonedas) {
    const contenedor = document.createElement("div");
    contenedor.className = "selector-monedas";

    const titulo = document.createElement("p");
    titulo.className = "selector-monedas-titulo";
    titulo.textContent = "Monedas que sigo:";
    contenedor.appendChild(titulo);

    const listaTags = document.createElement("div");
    listaTags.className = "tags-monedas";
    contenedor.appendChild(listaTags);

    function repintarTags() {
        listaTags.innerHTML = "";
        obtenerMonedasSeguidas().forEach(function (moneda) {
            const tag = document.createElement("span");
            tag.className = "tag-moneda";
            tag.textContent = moneda;

            const quitar = document.createElement("button");
            quitar.type = "button";
            quitar.className = "tag-moneda-quitar";
            quitar.textContent = "×";
            quitar.setAttribute("aria-label", "Dejar de seguir " + moneda);
            quitar.addEventListener("click", function () {
                const nuevaLista = obtenerMonedasSeguidas().filter(function (m) {
                    return m !== moneda;
                });
                guardarMonedasSeguidas(nuevaLista);
                repintarTags();
                alCambiarMonedas();
            });

            tag.appendChild(quitar);
            listaTags.appendChild(tag);
        });
    }

    repintarTags();

    const formAgregar = document.createElement("form");
    formAgregar.className = "form-agregar-moneda";

    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = "Agregar otra moneda...";

    const boton = document.createElement("button");
    boton.type = "submit";
    boton.textContent = "Agregar";

    formAgregar.appendChild(input);
    formAgregar.appendChild(boton);

    formAgregar.addEventListener("submit", function (evento) {
        evento.preventDefault();
        const nombre = input.value.trim();
        if (!nombre) return;

        const monedas = obtenerMonedasSeguidas();
        const yaExiste = monedas.some(function (m) {
            return m.toLowerCase() === nombre.toLowerCase();
        });

        if (!yaExiste) {
            monedas.push(nombre);
            guardarMonedasSeguidas(monedas);
            repintarTags();
            alCambiarMonedas();
        }
        input.value = "";
    });

    contenedor.appendChild(formAgregar);
    return contenedor;
}

async function cargarNoticiasCripto(cat, listaNoticias) {
    const monedas = obtenerMonedasSeguidas();

    listaNoticias.innerHTML = "";
    const cargando = document.createElement("li");
    cargando.className = "loading";
    cargando.textContent = "Cargando noticias de " + cat.fuentes.length + " fuentes...";
    listaNoticias.appendChild(cargando);

    const resultados = await Promise.all(cat.fuentes.map(async function (fuente) {
        const url = "https://api.rss2json.com/v1/api.json?rss_url=" + encodeURIComponent(fuente.rss);
        try {
            const respuesta = await fetchConTiempoLimite(url);
            const datos = await respuesta.json();
            if (datos.status !== "ok" || !datos.items) return [];
            return datos.items.map(function (item) {
                return { titulo: item.title, link: item.link, fuente: fuente.nombre, fecha: item.pubDate };
            });
        } catch (error) {
            return [];
        }
    }));

    const todosLosItems = resultados.flat();

    if (todosLosItems.length === 0) {
        listaNoticias.innerHTML = "";
        const li = document.createElement("li");
        li.className = "error";
        li.textContent = "No se pudieron cargar las noticias de cripto ahora mismo.";
        listaNoticias.appendChild(li);
        return;
    }

    todosLosItems.sort(function (a, b) {
        return new Date(b.fecha) - new Date(a.fecha);
    });

    const coincidencias = monedas.length === 0 ? [] : todosLosItems.filter(function (item) {
        const texto = item.titulo.toLowerCase();
        return monedas.some(function (moneda) {
            return texto.indexOf(moneda.toLowerCase()) !== -1;
        });
    });

    const hayCoincidencias = coincidencias.length > 0;
    const itemsAMostrar = hayCoincidencias ? coincidencias.slice(0, 10) : todosLosItems.slice(0, 6);

    listaNoticias.innerHTML = "";

    if (!hayCoincidencias) {
        const aviso = document.createElement("li");
        aviso.className = "loading";
        aviso.textContent = "Sin noticias específicas de tus monedas ahora mismo — mostrando lo más reciente:";
        listaNoticias.appendChild(aviso);
    }

    itemsAMostrar.forEach(function (item) {
        const li = document.createElement("li");
        const enlace = document.createElement("a");
        enlace.href = item.link;
        enlace.target = "_blank";
        enlace.rel = "noopener";
        enlace.textContent = item.titulo;
        li.appendChild(enlace);

        const fuenteTag = document.createElement("span");
        fuenteTag.className = "noticia-fuente";
        fuenteTag.textContent = item.fuente;
        li.appendChild(fuenteTag);

        listaNoticias.appendChild(li);
    });
}

/* ===== Pesas: calculadora de calorías y macros ===== */

function crearCalculadoraPesas() {
    const contenedor = document.createElement("div");
    contenedor.className = "calculadora";

    const titulo = document.createElement("h2");
    titulo.textContent = "Calculadora de calorías y macros";
    contenedor.appendChild(titulo);

    const intro = document.createElement("p");
    intro.className = "calculadora-intro";
    intro.textContent = "Dieta flexible: estos son tus números objetivo (calorías y gramos), no un menú fijo. Cúmplelos con la comida que tengas disponible ese día.";
    contenedor.appendChild(intro);

    const form = document.createElement("form");
    form.className = "form-calculadora";

    form.appendChild(crearCampoSelect("sexo", "Sexo", [
        ["hombre", "Hombre"],
        ["mujer", "Mujer"]
    ]));
    form.appendChild(crearCampoNumero("peso", "Peso (kg)", { step: "0.1", required: true }));
    form.appendChild(crearCampoNumero("altura", "Altura (cm)", { required: true }));
    form.appendChild(crearCampoNumero("edad", "Edad", { required: true }));
    form.appendChild(crearCampoSelect("actividad", "Nivel de actividad", [
        ["1.2", "Sedentario (poco o nada de ejercicio)"],
        ["1.375", "Ligero (1-3 días/semana)"],
        ["1.55", "Moderado (3-5 días/semana)"],
        ["1.725", "Activo (6-7 días/semana)"],
        ["1.9", "Muy activo (entrenamiento intenso diario)"]
    ]));
    form.appendChild(crearCampoSelect("objetivo", "Objetivo", [
        ["ganar", "Ganar músculo"],
        ["definicion", "Definición (bajar grasa)"],
        ["mantener", "Mantenimiento"]
    ]));
    form.appendChild(crearCampoNumero("diasEntreno", "Días de entrenamiento esta semana", { min: "1", max: "7", value: "4" }));
    form.appendChild(crearCampoCheckbox("proteinaPolvo", "Tomo proteína en polvo"));
    form.appendChild(crearCampoCheckbox("creatina", "Tomo creatina"));

    const boton = document.createElement("button");
    boton.type = "submit";
    boton.textContent = "Calcular";
    form.appendChild(boton);

    contenedor.appendChild(form);

    const resultado = document.createElement("div");
    resultado.className = "resultado-calculadora";
    resultado.hidden = true;
    contenedor.appendChild(resultado);

    const datosGuardados = cargarDatosCalculadora(form);
    if (datosGuardados) {
        mostrarResultadoCalculadora(datosGuardados, resultado);
    }

    form.addEventListener("submit", function (evento) {
        evento.preventDefault();
        const datos = leerDatosFormulario(form);
        localStorage.setItem("pesas-calculadora-datos", JSON.stringify(datos));
        mostrarResultadoCalculadora(datos, resultado);
    });

    return contenedor;
}

function crearCampoNumero(nombre, etiquetaTexto, opciones) {
    opciones = opciones || {};
    const campo = document.createElement("div");
    campo.className = "campo";

    const etiqueta = document.createElement("label");
    etiqueta.textContent = etiquetaTexto;
    etiqueta.htmlFor = "campo-" + nombre;

    const input = document.createElement("input");
    input.type = "number";
    input.id = "campo-" + nombre;
    input.name = nombre;
    if (opciones.step) input.step = opciones.step;
    if (opciones.min) input.min = opciones.min;
    if (opciones.max) input.max = opciones.max;
    if (opciones.value) input.value = opciones.value;
    if (opciones.required) input.required = true;

    campo.appendChild(etiqueta);
    campo.appendChild(input);
    return campo;
}

function crearCampoSelect(nombre, etiquetaTexto, opcionesLista) {
    const campo = document.createElement("div");
    campo.className = "campo";

    const etiqueta = document.createElement("label");
    etiqueta.textContent = etiquetaTexto;
    etiqueta.htmlFor = "campo-" + nombre;

    const select = document.createElement("select");
    select.id = "campo-" + nombre;
    select.name = nombre;

    opcionesLista.forEach(function (par) {
        const opcion = document.createElement("option");
        opcion.value = par[0];
        opcion.textContent = par[1];
        select.appendChild(opcion);
    });

    campo.appendChild(etiqueta);
    campo.appendChild(select);
    return campo;
}

function crearCampoCheckbox(nombre, etiquetaTexto) {
    const campo = document.createElement("div");
    campo.className = "campo campo-checkbox";

    const etiqueta = document.createElement("label");
    const input = document.createElement("input");
    input.type = "checkbox";
    input.name = nombre;

    etiqueta.appendChild(input);
    etiqueta.appendChild(document.createTextNode(" " + etiquetaTexto));
    campo.appendChild(etiqueta);
    return campo;
}

function leerDatosFormulario(form) {
    return {
        sexo: form.querySelector('[name="sexo"]').value,
        peso: parseFloat(form.querySelector('[name="peso"]').value),
        altura: parseFloat(form.querySelector('[name="altura"]').value),
        edad: parseFloat(form.querySelector('[name="edad"]').value),
        actividad: parseFloat(form.querySelector('[name="actividad"]').value),
        objetivo: form.querySelector('[name="objetivo"]').value,
        diasEntreno: parseInt(form.querySelector('[name="diasEntreno"]').value, 10),
        proteinaPolvo: form.querySelector('[name="proteinaPolvo"]').checked,
        creatina: form.querySelector('[name="creatina"]').checked
    };
}

function cargarDatosCalculadora(form) {
    const guardado = localStorage.getItem("pesas-calculadora-datos");
    if (!guardado) return null;

    try {
        const datos = JSON.parse(guardado);
        form.querySelector('[name="sexo"]').value = datos.sexo;
        form.querySelector('[name="peso"]').value = datos.peso;
        form.querySelector('[name="altura"]').value = datos.altura;
        form.querySelector('[name="edad"]').value = datos.edad;
        form.querySelector('[name="actividad"]').value = datos.actividad;
        form.querySelector('[name="objetivo"]').value = datos.objetivo;
        form.querySelector('[name="diasEntreno"]').value = datos.diasEntreno;
        form.querySelector('[name="proteinaPolvo"]').checked = !!datos.proteinaPolvo;
        form.querySelector('[name="creatina"]').checked = !!datos.creatina;
        return datos;
    } catch (error) {
        return null;
    }
}

function calcularCaloriasYMacros(datos) {
    const bmr = datos.sexo === "mujer"
        ? 10 * datos.peso + 6.25 * datos.altura - 5 * datos.edad - 161
        : 10 * datos.peso + 6.25 * datos.altura - 5 * datos.edad + 5;

    const tdee = bmr * datos.actividad;

    let calorias;
    let proteinaPorKg;
    if (datos.objetivo === "ganar") {
        calorias = tdee * 1.12;
        proteinaPorKg = 2.0;
    } else if (datos.objetivo === "definicion") {
        calorias = tdee * 0.80;
        proteinaPorKg = 2.2;
    } else {
        calorias = tdee;
        proteinaPorKg = 1.8;
    }

    const proteina = datos.peso * proteinaPorKg;
    const caloriasProteina = proteina * 4;
    const caloriasGrasas = calorias * 0.25;
    const grasas = caloriasGrasas / 9;
    const caloriasCarbos = calorias - caloriasProteina - caloriasGrasas;
    const carbohidratos = Math.max(caloriasCarbos, 0) / 4;

    return {
        calorias: Math.round(calorias),
        proteina: Math.round(proteina),
        grasas: Math.round(grasas),
        carbohidratos: Math.round(carbohidratos)
    };
}

function mostrarResultadoCalculadora(datos, contenedorResultado) {
    const resultado = calcularCaloriasYMacros(datos);

    contenedorResultado.innerHTML = "";
    contenedorResultado.hidden = false;

    const caloriasEl = document.createElement("p");
    caloriasEl.className = "resultado-calorias";
    caloriasEl.textContent = resultado.calorias + " kcal/día";
    contenedorResultado.appendChild(caloriasEl);

    const macros = document.createElement("div");
    macros.className = "macros";
    macros.appendChild(crearMacroChip("Proteína", resultado.proteina + " g"));
    macros.appendChild(crearMacroChip("Grasas", resultado.grasas + " g"));
    macros.appendChild(crearMacroChip("Carbohidratos", resultado.carbohidratos + " g"));
    contenedorResultado.appendChild(macros);

    const notaFlexible = document.createElement("p");
    notaFlexible.className = "nota-calculadora";
    notaFlexible.textContent = "Estos números son tu meta diaria. No importa exactamente qué comas, mientras te acerques a estos totales — así funciona una dieta flexible.";
    contenedorResultado.appendChild(notaFlexible);

    const notaFrecuencia = document.createElement("p");
    notaFrecuencia.className = "nota-calculadora";
    notaFrecuencia.textContent = "Marcaste " + datos.diasEntreno + " días de entreno esta semana. Si tu frecuencia varía entre 3 y 5 días, ajusta el nivel de actividad arriba según la semana real que tengas.";
    contenedorResultado.appendChild(notaFrecuencia);

    if (datos.creatina) {
        const notaCreatina = document.createElement("p");
        notaCreatina.className = "nota-calculadora";
        notaCreatina.textContent = "Creatina: 3-5 g diarios, a cualquier hora, todos los días (entrenes o no). No necesitas fase de carga.";
        contenedorResultado.appendChild(notaCreatina);
    }

    if (datos.proteinaPolvo) {
        const notaProteina = document.createElement("p");
        notaProteina.className = "nota-calculadora";
        notaProteina.textContent = "Proteína en polvo: úsala para completar tu meta de " + resultado.proteina + " g si no llegas con comida real — no reemplaza todas tus comidas.";
        contenedorResultado.appendChild(notaProteina);
    }
}

function crearMacroChip(etiquetaTexto, valorTexto) {
    const chip = document.createElement("div");
    chip.className = "macro-chip";

    const etiqueta = document.createElement("span");
    etiqueta.className = "macro-label";
    etiqueta.textContent = etiquetaTexto;

    const valor = document.createElement("span");
    valor.className = "macro-valor";
    valor.textContent = valorTexto;

    chip.appendChild(etiqueta);
    chip.appendChild(valor);
    return chip;
}

cargarCategorias();
