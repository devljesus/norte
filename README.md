# 🧭 NORTE

**Tu estructura para lograr objetivos y mantenerte actualizado.**

Eliges una categoría de tu interés (cripto, programación, inglés, pesas, SEO, videojuegos...) y NORTE te da tres cosas todos los días:

1. **📰 Lo que está pasando** — noticias del día de fuentes confiables de esa categoría.
2. **📚 Lo que debes dominar** — los conceptos clave, ordenados por nivel, marcables a medida que los aprendes.
3. **✅ Hacia dónde vas** — tu checklist de metas con progreso visible.

> La idea nació de una carencia real: "lo que me ha faltado en mi vida es una
> estructura para conseguir mis objetivos y mantenerme al día". Si me faltó a mí,
> le falta a mucha más gente.

## Visión

Una plataforma donde cualquier persona arma su panel de objetivos por intereses.
Hoy es una web local; el plan de crecimiento:

- **v1 (actual):** panel funcional multi-categoría, datos en el navegador (localStorage).
- **v2:** cuentas de usuario (backend Node), tus paneles te siguen en cualquier dispositivo.
- **v3:** categorías creadas por la comunidad, rachas y estadísticas de constancia.
- **v4:** apps móviles, notificaciones diarias, y monetización (premium: más categorías, IA que resume tus noticias, informes semanales).

## Arquitectura: las categorías son datos, no código

La regla de oro del proyecto: **el código no sabe nada de cripto ni de inglés.**
Cada categoría es un archivo JSON en `categories/` que declara sus fuentes RSS,
sus conceptos y sus metas sugeridas. Agregar una categoría nueva NO requiere
programar: requiere escribir un JSON.

```
norte/
├── index.html          → estructura del panel
├── styles.css          → estilos (tema oscuro)
├── app.js              → toda la lógica (vanilla JS, sin frameworks)
└── categories/
    ├── index.json      → lista de categorías disponibles
    ├── cripto.json     → fuentes, conceptos y metas de cripto
    ├── programacion.json
    └── ingles.json     → ...y las que vengan
```

## Stack (a propósito, sin frameworks)

- **HTML + CSS + JavaScript puro** — para dominar las bases antes de usar atajos.
- **RSS** como fuente de noticias (gratis, sin API keys, estándar abierto).
- **localStorage** para persistencia local (v1).
- APIs públicas gratuitas por categoría (ej. CoinGecko para precios cripto).

## Correr el proyecto

Cualquier servidor estático sirve. Por ejemplo:

```
python -m http.server 8757
```

y abrir http://localhost:8757

## Diario de construcción

- **2026-07-18** — Fundaciones: panel multi-categoría con noticias RSS, conceptos
  con progreso, metas con checklist, y 3 categorías iniciales (cripto,
  programación, inglés). Widgets de precios y Fear & Greed para cripto.
