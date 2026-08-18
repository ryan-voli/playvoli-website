# VOLI Brand — how to build with this design system

This is a **brand layer, not a component library**: tokens, fonts, and a small set of CSS classes from the PlayVoli/VOLI site. Build screens with your own HTML/React markup and style everything with the vocabulary below. There is no provider or wrapper — just make sure `styles.css` is loaded.

## The look

Dark-only. `styles.css` already paints `html` with the brand background: near-black (`--bg-dark: #0a0a0b`) with faint volt-green/blue/violet radial glows. Keep page backgrounds transparent so that treatment shows through; never design on white. Text is white-on-dark at three opacities.

## Tokens (CSS custom properties — all defined in `_ds_bundle.css`)

| Token | Value / use |
|---|---|
| `--bg-dark` | `#0a0a0b` page background |
| `--bg-card` | `rgba(255,255,255,0.03)` card fill |
| `--glass-border` | `rgba(255,255,255,0.08)` 1px card/input borders |
| `--glass-highlight` | top-edge highlight line on cards |
| `--text-primary` | `#ffffff` headings, body |
| `--text-secondary` | 60% white — supporting copy |
| `--text-muted` | 40% white — placeholders, captions |
| `--accent` | `#c8ff00` volt green — primary actions, highlights |
| `--accent-glow` | `rgba(200,255,0,0.3)` — box-shadow glow under accent elements |
| `--accent-subtle` | `rgba(200,255,0,0.1)` — accent-tinted fills/badges |
| `--electric-blue` | `#00d4ff` secondary accent |
| `--rose` | `#FF1F6D` tertiary accent / alerts |

Accent elements take **black text on volt green** (`background: var(--accent); color: #000`).

## Classes (the only shipped classes — everything else is yours to write with tokens)

- `.glass-card` — frosted panel: `--bg-card` fill, 40px backdrop-blur, 1px `--glass-border`, 24px radius, 3rem/2rem padding, top highlight line.
- `.form-input` — dark input: 12px radius, `--glass-border`, `--text-muted` placeholder; focus ring is accent-tinted (`rgba(200,255,0,0.3)`).
- `.btn-primary` — full-width volt-green button: black 600-weight text, 14px radius, `0 4px 24px var(--accent-glow)` shadow, lifts 2px on hover.

Radius idiom: 24px for cards, 12–14px for inputs/buttons. Motion: 0.2–0.3s ease, translateY lifts.

## Fonts (shipped in `fonts/`, wired via `styles.css`)

- **Inter** — everything by default (variable 300–800). Body stack: `'Inter', -apple-system, BlinkMacSystemFont, sans-serif`.
- **Designer** — display-only wordmark font: the `VOLI` logotype and short, loud, uppercase headings. `font-family: 'Designer'`. Never for body copy.

## Where the truth lives

Read `_ds_bundle.css` (the site's full global stylesheet — tokens, base, classes) and `fonts/fonts.css` before inventing styles. Both are in `styles.css`'s import closure, which every design receives.

## Idiomatic example (verified render)

```html
<h1 style="font-family:'Designer';font-size:2.5rem">VOLI</h1>
<div class="glass-card" style="max-width:420px">
  <h2 style="margin-bottom:1rem">Join the league</h2>
  <input class="form-input" placeholder="you@playvoli.com" style="margin-bottom:1rem">
  <button class="btn-primary">Join the League</button>
</div>
```
