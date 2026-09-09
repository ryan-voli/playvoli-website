import webpEnc from '@jsquash/webp/codec/enc/webp_enc_simd.js';
import { defaultOptions as WEBP_DEFAULTS } from '@jsquash/webp/meta.js';
import { initWasm } from '@resvg/resvg-wasm';
import {
  DESIGNER,
  AXIFORMA_BOOK,
  AXIFORMA_BLACK,
  RESVG_WASM,
  WEBP_ENC_WASM,
} from './card-assets';

/* Everything the card kinds share: the fonts and the two wasm encoders, the
 * app's colour rules transcribed, the two font-metric tables that let text be
 * measured before satori ever sees it, and the handful of element helpers.
 *
 * Apart from game-card.ts because the API has three kinds coming — cards,
 * data and embeds — and none of them should have to import an image endpoint
 * to get at a colour rule.
 */

/* Axiforma, not the app's system face: satori reads ttf/otf/woff and the
 * site's Inter is woff2, which it cannot parse. Book and Black are the two
 * real weights we have, so the scale is mapped onto them rather than faked —
 * asking for a weight with no file behind it is how every label came out
 * light. It is the one deliberate substitution in the replica, and it shows
 * only in the date line and the rank.
 *
 * Inlined, not fetched. See lib/card-assets.ts: pulling these from our own
 * origin works locally and dies inside a Vercel Function, which cannot
 * resolve its own public domain. Decoded once per process, not per request —
 * it is ~2MB of base64 and a warm function serves many renders.
 */
let fonts: any[] | null = null;
export function fontSet() {
  if (!fonts) {
    const book = AXIFORMA_BOOK();
    const black = AXIFORMA_BLACK();
    fonts = [
      { name: 'Designer', data: DESIGNER(), weight: 400, style: 'normal' },
      { name: 'Axiforma', data: book, weight: 400, style: 'normal' },
      { name: 'Axiforma', data: book, weight: 600, style: 'normal' },
      { name: 'Axiforma', data: black, weight: 700, style: 'normal' },
      { name: 'Axiforma', data: black, weight: 800, style: 'normal' },
    ];
  }
  return fonts;
}

/* libwebp, for the .webp route. Lossless, method 0.
 *
 * Lossless is not a compromise here, it is the cheap option: this card is
 * flat colour, one gradient and text, and webp's lossless mode gets it to
 * ~24KB against the PNG's ~139KB — SMALLER than the same image at quality
 * 95, with no ringing around the type and no banding in the wash. Method 0
 * costs 8ms; method 6 saves another 5KB and costs a full second, which is
 * the wrong trade for an image a forum re-fetches on every view.
 *
 * The SIMD build is imported directly rather than through @jsquash's own
 * init(), which feature-detects and then picks a DIFFERENT wasm file — a
 * runtime branch that would need both binaries inlined to be safe. Every
 * runtime this ships to has wasm SIMD.
 */
let webpReady: Promise<any> | null = null;
export function webpModule(): Promise<any> {
  webpReady ??= webpEnc({ noInitialRun: true, wasmBinary: WEBP_ENC_WASM() });
  return webpReady;
}

/* resvg hands back PREMULTIPLIED RGBA — asPng() undoes that on the way out,
 * .pixels does not. Encoding it as-is left a dark fringe on the rounded
 * corners' antialiasing, the only place on the card with partial alpha:
 * 272 pixels, up to 53 levels too dark, and exactly where the eye is looking
 * for a clean edge against the forum's background. */
export function unpremultiply(src: Uint8Array): Uint8Array {
  const out = new Uint8Array(src.length);
  for (let i = 0; i < src.length; i += 4) {
    const a = src[i + 3];
    out[i + 3] = a;
    if (a === 0 || a === 255) {
      out[i] = src[i]; out[i + 1] = src[i + 1]; out[i + 2] = src[i + 2];
    } else {
      out[i] = Math.min(255, Math.round((src[i] * 255) / a));
      out[i + 1] = Math.min(255, Math.round((src[i + 1] * 255) / a));
      out[i + 2] = Math.min(255, Math.round((src[i + 2] * 255) / a));
    }
  }
  return out;
}


/* One init per process, not per request. initWasm throws if called twice, so
 * the promise is the guard — every request awaits the same one. The catch is
 * for dev only: Vite re-evaluates this module on every save, which resets the
 * guard while the WASM instance itself survives. */
let wasmReady: Promise<void> | null = null;
export function ensureWasm(): Promise<void> {
  wasmReady ??= initWasm(RESVG_WASM()).catch((e: any) => {
    if (!String(e?.message ?? e).includes('Already initialized')) throw e;
  });
  return wasmReady;
}


/* Designer advance widths, in font units (unitsPerEm 1000), read straight
 * out of the OTF's hmtx table. They exist so FittedBox(scaleDown) can be
 * reproduced: the app measures the name and shrinks it to fit 116pt, and
 * without the real widths a long name like MISSISSIPPI would just run off
 * its column. Caps and digits only — the face has no lowercase and every
 * string that reaches it is uppercased. */
export const DESIGNER_EM = 1000;
export const DESIGNER_ADV: Record<string, number> = {
  ' ': 445, A: 848, B: 834, C: 689, D: 795, E: 745, F: 722, G: 832, H: 804,
  I: 321, J: 655, K: 772, L: 659, M: 995, N: 837, O: 867, P: 810, Q: 867,
  R: 827, S: 796, T: 708, U: 836, V: 783, W: 1170, X: 759, Y: 717, Z: 753,
  '0': 796, '1': 411, '2': 816, '3': 787, '4': 819, '5': 821, '6': 824,
  '7': 714, '8': 820, '9': 823, '.': 242, "'": 209, '&': 785, '-': 422,
  '–': 548, '—': 783, '/': 570, '(': 342, ')': 342, '!': 321,
};
export function designerWidth(s: string, size: number): number {
  let u = 0;
  for (const ch of s) u += DESIGNER_ADV[ch] ?? DESIGNER_ADV['O'];
  return (u / DESIGNER_EM) * size;
}


/* Axiforma's line box is not the platform font's, and the app's small labels
 * are positioned BY that line box — so copying the padding alone puts them in
 * the wrong place AND makes the box the wrong size. The status pill is the
 * one that shows: 2pt of padding around a 12pt line comes to 21pt in the app
 * and 18pt in Axiforma, and the short pill reads as squashed.
 *
 * So the box heights are the app's measured ones (a widget test pumping the
 * same Text and reading getSize, not a guess at the platform font's metrics),
 * and the label inside is placed by its CAP BOX — which is what the eye
 * actually centres on for an all-caps chip, and the only rule that survives
 * two fonts with different cap heights.
 */
/* Axiforma Book's advance widths, same source as Designer's: the OTF's hmtx
 * table, keyed by code point. Satori will happily overflow a row rather than
 * shrink it — flexShrink and textOverflow both no-op on a text node it has
 * already measured — so anything that has to fit gets truncated here, before
 * it ever reaches the layout. */
export const AX_ADV = new Map<number, number>([[32,247],[33,292],[34,455],[35,698],[36,561],[37,877],[38,697],[39,257],[40,387],[41,387],[42,450],[43,530],[44,239],[45,516],[46,230],[47,597],[48,678],[49,381],[50,556],[51,552],[52,591],[53,570],[54,612],[55,500],[56,623],[57,610],[58,258],[59,285],[60,574],[61,604],[62,546],[63,505],[64,975],[65,671],[66,669],[67,778],[68,756],[69,605],[70,568],[71,812],[72,756],[73,282],[74,554],[75,661],[76,601],[77,916],[78,778],[79,856],[80,603],[81,856],[82,636],[83,558],[84,561],[85,703],[86,704],[87,1024],[88,621],[89,633],[90,613],[91,364],[92,597],[93,364],[94,517],[95,581],[96,426],[97,663],[98,666],[99,598],[100,666],[101,609],[102,389],[103,666],[104,612],[105,241],[106,265],[107,539],[108,241],[109,970],[110,614],[111,644],[112,668],[113,668],[114,384],[115,448],[116,422],[117,592],[118,558],[119,834],[120,501],[121,548],[122,504],[123,366],[124,256],[125,366],[126,663],[183,254],[8211,715],[8212,1034],[8217,232],[8230,691]]);
export const AX_FALLBACK = 600;
export function axWidth(s: string, size: number): number {
  let u = 0;
  for (const ch of s) u += AX_ADV.get(ch.codePointAt(0)!) ?? AX_FALLBACK;
  return (u / 1000) * size;
}
/** Cut [s] to fit [max], ending on an ellipsis rather than mid-word. */
export function truncate(s: string, size: number, max: number): string {
  if (axWidth(s, size) <= max) return s;
  const dots = axWidth('…', size);
  let out = '';
  for (const ch of s) {
    if (axWidth(out + ch, size) + dots > max) break;
    out += ch;
  }
  out = out.replace(/[\s,.&-]+$/, '');
  return out ? out + '…' : '';
}

export const STATUS_PILL_H = 21;             // Container(padding v2) + 12pt line
export const STATUS_DATE_H = 19;             // 13pt line
export const AX_CAP = 0.739;                 // Axiforma cap height, both weights
export const axAscent = (weight: number) => (weight >= 700 ? 0.774 : 0.771);

/** A label whose CAP BOX sits dead centre in a [box]-tall row. */
export function capLabel(
  s: string,
  o: {
    size: number; box: number; color: string;
    weight?: number; letterSpacing?: number;
  }
) {
  const weight = o.weight ?? 400;
  // With lineHeight 1 the text box is exactly `size` tall and the baseline
  // sits `ascent * size` below its top. Put the box where that lands the cap
  // box centred, and stop relying on anyone's idea of vertical alignment.
  const top = (o.box + AX_CAP * o.size) / 2 - axAscent(weight) * o.size;
  return el(
    { height: o.box, alignItems: 'flex-start', flexShrink: 0 },
    [
      text(s, {
        fontSize: o.size,
        fontWeight: weight,
        lineHeight: 1,
        color: o.color,
        paddingTop: top,
        ...(o.letterSpacing ? { letterSpacing: o.letterSpacing } : {}),
      }),
    ]
  );
}


/* designerDescent(), the optical nudge DesignerText applies everywhere.
 * Designer's ink sits high in its line box (hhea ascent 752, descent -200),
 * so the app pushes it down by 60% of the descent to centre it. Same
 * numbers, same nudge — without it every Designer label in the replica
 * rides a pixel or two high. */
export const DESIGNER_DESCENT_RATIO = (200 / 952) * 0.6;
export const designerNudge = (size: number) => size * DESIGNER_DESCENT_RATIO;

/** vbdata stores hex with or without the leading '#'. */
export function parseHex(c: string | null | undefined): [number, number, number] | null {
  if (!c) return null;
  const v = String(c).replace('#', '').trim();
  if (!/^[0-9a-fA-F]{6}$/.test(v)) return null;
  const n = parseInt(v, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
export const FALLBACK: [number, number, number] = [0x3c, 0x43, 0x46];
export const rgb = (c: [number, number, number]) => `rgb(${c[0]},${c[1]},${c[2]})`;
export const rgba = (c: [number, number, number], a: number) =>
  `rgba(${c[0]},${c[1]},${c[2]},${a})`;

export const luminance = (c: [number, number, number]) => {
  const f = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]);
};

/** TeamColors.visibleFill — lift a colour that is too dark to read as a
 *  colour at all (Omaha #000000, UConn #000E2F) to HSL lightness 0.20. */
export function visibleFill(c: [number, number, number]): [number, number, number] {
  if (luminance(c) >= 0.02) return c;
  const [h, s] = toHsl(c);
  return fromHsl(h, s, 0.2);
}

/** TeamColors.indicatorFill — the set dots. A near-neutral colour that is
 *  genuinely close to the glass grey would read as an EMPTY dot, so those
 *  and only those go white; a saturated dark colour keeps its identity. */
export function indicatorFill(c: [number, number, number]): [number, number, number] {
  const fill = visibleFill(c);
  if (toHsl(fill)[1] >= 0.15) return fill;
  const d = Math.hypot(fill[0] - 0x3c, fill[1] - 0x43, fill[2] - 0x46) /
    Math.sqrt(3 * 255 * 255);
  return d < 0.12 ? [255, 255, 255] : fill;
}

export function toHsl(c: [number, number, number]): [number, number, number] {
  const r = c[0] / 255, g = c[1] / 255, b = c[2] / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return [h * 360, s, l];
}
export function fromHsl(h: number, s: number, l: number): [number, number, number] {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  const t: number[][] = [[c, x, 0], [x, c, 0], [0, c, x], [0, x, c], [x, 0, c], [c, 0, x]];
  const [r, g, b] = t[Math.floor(h / 60) % 6];
  return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
}


/** foldForDisplayFont — Designer has no diacritics. */
export const fold = (s: string) =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');


// ── satori element helpers ────────────────────────────────────────────
export const el = (style: Record<string, unknown>, children?: unknown): any => ({
  type: 'div',
  props: { style: { display: 'flex', ...style }, children },
});
export const text = (children: string, style: Record<string, unknown>): any => ({
  type: 'div',
  props: { style: { display: 'flex', ...style }, children },
});

/** A Designer label: folded, uppercased, and nudged down by the same
 *  optical descent DesignerText applies in the app. */
export const designer = (s: string, size: number, color: string, extra = {}) =>
  text(fold(s), {
    fontFamily: 'Designer',
    fontSize: size,
    lineHeight: 1,
    color,
    paddingTop: designerNudge(size),
    ...extra,
  });


/* AppColors, the ones these surfaces use. */
export const DARK = '#131819';                    // eerieBlack
export const LEMON = '#F0FF1E';                   // lemonLime
export const ROSE = '#FF1F6D';
export const ELECTRIC = '#17E9FC';                // electricBlue
export const GLASS15 = 'rgba(255,255,255,0.15)';  // glassLight15
export const GLASS_NAV = 'rgba(19,24,25,0.6)';    // glassDarkNav

/** TeamColors.onGlass — the team's own colour where it clears contrast
 *  against the app's glass ground, its secondary where that does, else white.
 *  The ratio test is symmetric, so a near-black passes it and would then
 *  render as ink on a dark card; visibleFill lifts exactly those. */
export function onGlass(
  primary: [number, number, number],
  secondaryHex?: string | null
): [number, number, number] {
  const ground: [number, number, number] = [0x3c, 0x43, 0x46];
  const ratio = (x: [number, number, number], y: [number, number, number]) => {
    const lx = luminance(x), ly = luminance(y);
    return lx > ly ? (lx + 0.05) / (ly + 0.05) : (ly + 0.05) / (lx + 0.05);
  };
  if (ratio(primary, ground) >= 1.6) return visibleFill(primary);
  const sec = parseHex(secondaryHex);
  if (sec && ratio(sec, ground) >= 1.6) return visibleFill(sec);
  return [255, 255, 255];
}

/** resvg's rendered pixmap as the bytes for [format], plus its content type. */
export async function encodeImage(
  rendered: { pixels: Uint8Array; width: number; height: number; asPng(): Uint8Array },
  format: 'png' | 'webp'
): Promise<{ body: Uint8Array; type: string }> {
  if (format !== 'webp') return { body: rendered.asPng(), type: 'image/png' };
  const enc = await webpModule();
  const out = enc.encode(
    unpremultiply(rendered.pixels), rendered.width, rendered.height,
    {
      ...WEBP_DEFAULTS,
      lossless: 1,
      quality: 100,
      /* Method 1, not 0. It costs ~300ms and returns a third of the bytes
       * (154KB -> 101KB on the tall card), pixel for pixel identical — a bad
       * trade on a route that renders per request, and a free one behind the
       * cache below, where stale-while-revalidate means that work happens in
       * the background and no reader ever waits for it.
       *
       * Still lossless: measured against lossy at q88/q92/q95, which came out
       * BIGGER as well as lossy. Flat colour, long gradients and an alpha
       * channel are the case webp's lossy mode is worst at. */
      method: 1,
      exact: 1, // keep transparent pixels' RGB, don't let it invent any
    }
  );
  if (!out) throw new Error('webp encode failed');
  return { body: out, type: 'image/webp' };
}
