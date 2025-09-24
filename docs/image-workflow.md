# Image Workflow

> **Maintainer note:** Internal reference for working with the Eleventy image shortcode.

This project uses the Eleventy Image utility (`@11ty/eleventy-img`) through a global `image` Nunjucks shortcode to generate responsive `<picture>` markup with AVIF, WebP, and raster fallbacks.

## Source Assets

- Place source files in the root [`images/`](../images) directory. Assets in this folder are kept in version control and are also copied to the output for legacy references (e.g., favicons and the web manifest).
- When adding a new asset, prefer the highest-quality original you have. The shortcode will create appropriately sized derivatives at build time.

## Using the `image` shortcode

```
{% raw %}{% image "/images/example.jpg", "Descriptive alt text", {
  widths: [400, 800, 1200],
  sizes: "(min-width: 900px) 50vw, 100vw",
  class: "example-class",
  formats: ["avif", "webp", "jpeg"],
  width: 400,
  height: 250
} %}{% endraw %}
```

Key options:

- `src` — Root-relative path to the source asset. Remote URLs are also supported.
- `alt` — Required alt text (pass an empty string for decorative images).
- `widths` — Array of target widths. Use smaller values for icons (e.g., `[40, 80]`) or `"auto"` to keep the original width. Defaults to `[320, 640, 960, 1280, 1600]`.
- `sizes` — The `sizes` attribute that informs the browser which source width to choose. Defaults to `100vw`.
- `class`, `style`, `width`, `height`, `ariaHidden`, `fetchpriority`, and other standard attributes can be supplied for the rendered `<img>` element.
- `formats` — Output formats; defaults to AVIF, WebP, and PNG. Override with `["avif", "webp", "jpeg"]` for photographs or when transparency is not required.

The shortcode returns a complete `<picture>` element with generated `<source>` elements and an `<img>` fallback. Image derivatives are written to `_site/img/` and cached under `.cache/eleventy-img/` for faster rebuilds.

## Building and Previewing

Run the full build to generate the responsive assets and the static site:

```
npm run build
```

The optimized images will appear in `_site/img/`. Launching the dev server (`npm run dev`) serves the same processed assets so you can validate responsive behaviour in the browser.
