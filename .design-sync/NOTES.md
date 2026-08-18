# design-sync notes — playvoli-website → "VOLI Brand"

- **Brand-only import, deliberately.** This repo is the Astro marketing site, not a component library — zero components synced (converter tokens-only mode). The user's actual app is Flutter, which can't be synced (Dart, not web components). The 4 `.astro` components (Nav/Footer/NavAuth/QrModal) are server templates, not bundlable.
- **Entry is a stub**: `.design-sync/brand/entry.js` (`export {}`) — exists only so the converter resolves PKG_DIR to the repo root and emits the documented empty-bodied `_ds_bundle.js`. Pass `--entry ./.design-sync/brand/entry.js` on every build/driver run.
- **`--node-modules ./.ds-sync/node_modules`**, not the repo's: the site has no React; react/react-dom/@types/react are installed into the staged-scripts dir for vendoring. On a fresh clone, re-run `npm i esbuild ts-morph @types/react react react-dom` inside `.ds-sync/`.
- **Fonts**: Inter's `@font-face` lives inline in `src/layouts/Layout.astro` (not any CSS), and `global.css`'s Designer rule uses a site-absolute `/fonts/` URL — both restated with resolvable paths in `.design-sync/brand/fonts.css` (wired via `cfg.extraFonts`). The scraped dead Designer rule still appears first in `fonts/fonts.css` but is shadowed by the working one (later rule wins); harmless.
- **Axiforma is legacy** (used only by `css/styles.css` / old static pages) — deliberately not shipped. Current brand = Inter + Designer.
- **Render check**: run with `--no-render-check` — tokens-only, zero preview cards, so playwright would render nothing. Visual verification done instead via Chrome-headless screenshot of a test page consuming the `styles.css` closure (fonts, tokens, `.glass-card`/`.btn-primary` all confirmed rendering).

## Known render warns
- `[RENDER_SKIPPED]` (suppressed via `--no-render-check`) — expected permanently while the DS is tokens-only.

## Re-sync risks
- `.design-sync/brand/fonts.css` mirrors font rules whose sources live elsewhere (`Layout.astro` inline for Inter, `global.css` for Designer). If site fonts change, this file must be updated by hand — diff it against those sources on re-sync.
- `cfg.cssEntry` is `src/styles/global.css` — the live source, so token/class changes flow automatically. But the conventions header (`.design-sync/conventions.md`) enumerates tokens/classes by name; re-validate it against the fresh `_ds_bundle.css` per the base skill's conventions step.
- If the site ever gains a real component library (or the user wants specific UI patterns as components), that's a shape change — revisit scope with the user.
