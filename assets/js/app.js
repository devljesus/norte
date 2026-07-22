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
    const nombre = document.createElement("span");
    nombre.textContent = cat.nombre;
    summary.appendChild(nombre);

    if (cat.metasSugeridas && cat.metasSugeridas.length > 0) {
        const chip = document.createElement("span");
        chip.className = "meta-progress";
        chip.id = "progreso-" + cat.id;
        summary.appendChild(chip);
    }

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

    if (cat.mostrarNoticias) {
        const seccionNoticias = crearSeccion("Noticias");
        const listaNoticias = document.createElement("ul");

        const cargando = document.createElement("li");
        cargando.className = "loading";
        cargando.textContent = "Cargando noticias...";
        listaNoticias.appendChild(cargando);

        seccionNoticias.appendChild(listaNoticias);
        details.appendChild(seccionNoticias);
        cargarNoticias(cat, listaNoticias);
    }

    if (cat.conceptos && cat.conceptos.length > 0) {
        const seccionConceptos = crearSeccion("Conceptos (" + cat.conceptos.length + ")");
        const listaConceptos = document.createElement("ul");
        cat.conceptos.forEach(function (concepto) {
            const li = document.createElement("li");
            li.textContent = concepto.titulo;
            listaConceptos.appendChild(li);
        });
        seccionConceptos.appendChild(listaConceptos);
        details.appendChild(seccionConceptos);
    }

    if (cat.metasSugeridas && cat.metasSugeridas.length > 0) {
        const seccionMetas = crearSeccion("Metas");
        const listaMetas = document.createElement("ul");
        listaMetas.className = "lista-metas";
        const chipProgreso = summary.querySelector(".meta-progress");

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
        details.appendChild(crearBloquePlataformas("Sugerencias de este mes", cat.sugerencias));
    }

    if (cat.ofertas) {
        const seccionOfertas = crearBloquePlataformas("Mejores ofertas", cat.ofertas);
        details.appendChild(seccionOfertas);
        if (cat.id === "videojuegos") {
            cargarOfertasPC(seccionOfertas);
        }
    }

    if (cat.mejorCalificados) {
        details.appendChild(crearBloquePlataformas("Mejor calificados", cat.mejorCalificados));
    }

    contenedor.appendChild(details);
}

function crearSeccion(tituloTexto) {
    const seccion = document.createElement("section");
    const h2 = document.createElement("h2");
    h2.textContent = tituloTexto;
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

    const widgetMiedo = crearWidget("Fear & Greed");
    const widgetPrecio = crearWidget("Bitcoin (USD)");

    contenedor.appendChild(widgetMiedo.widget);
    contenedor.appendChild(widgetPrecio.widget);

    cargarFearGreed(widgetMiedo.valor);
    cargarPrecioBTC(widgetPrecio.valor);

    return contenedor;
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

async function cargarPrecioBTC(elemento) {
    try {
        const respuesta = await fetchConTiempoLimite("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd");
        const datos = await respuesta.json();
        elemento.textContent = "$" + datos.bitcoin.usd.toLocaleString("en-US");
    } catch (error) {
        elemento.textContent = "No disponible";
    }
}

async function cargarOfertasPC(seccionOfertas) {
    const listaPC = seccionOfertas.querySelector('ul[data-plataforma="PC"]');
    if (!listaPC) return;

    try {
        const respuesta = await fetchConTiempoLimite("https://www.cheapshark.com/api/1.0/deals?storeID=1&pageSize=3&sortBy=Recent");
        const ofertas = await respuesta.json();

        if (!Array.isArray(ofertas) || ofertas.length === 0) {
            throw new Error("respuesta sin ofertas");
        }

        listaPC.innerHTML = "";
        ofertas.forEach(function (oferta) {
            const li = document.createElement("li");
            const descuento = Math.round(parseFloat(oferta.savings));
            li.textContent = oferta.title + " — " + descuento + "% (" + "$" + oferta.salePrice + ")";
            listaPC.appendChild(li);
        });
    } catch (error) {
        listaPC.innerHTML = "";
        const li = document.createElement("li");
        li.className = "error";
        li.textContent = "No se pudieron cargar las ofertas de Steam ahora mismo.";
        listaPC.appendChild(li);
    }
}

cargarCategorias();
