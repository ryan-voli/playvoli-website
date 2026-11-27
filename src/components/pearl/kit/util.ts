// Helpers for the Pearl kit: the Poster kit's props, read the Pearl way.
//
// The kit's components take the same props as src/components/poster/*, so a
// page converts by changing its imports and its layout. Props that only mean
// something on the Poster (field colours, hard-offset shadows, tilts, slope
// padding) are still accepted, and are ignored here.

export { vars } from '../util';

/** Poster field colours and offset tints: accepted, never drawn as fills. */
export type Field = 'ink' | 'lime' | 'blue' | 'rose';
export type Tint = Field | 'white';

/** A place on a stage: percent of the stage's width (x, w) and height (y).
 *  `r` (the Poster's tilt) is accepted and ignored: nothing in Pearl leans. */
export interface Place {
  x?: number; y?: number; w?: number; z?: number;
  xm?: number; ym?: number; wm?: number;
  r?: number;
}

/** The Pearl part of a Place, for pearl/util placeVars. */
export const level = ({ r: _r, ...p }: Place) => p;

const pc = (n?: number) => (n === undefined ? undefined : `${n}%`);
/** A stage position as inline custom properties (percent). */
export const placeStyle = (p: Place) =>
  [['--x', pc(p.x)], ['--y', pc(p.y)], ['--w', pc(p.w)], ['--z', p.z], ['--xm', pc(p.xm)], ['--ym', pc(p.ym)], ['--wm', pc(p.wm)]]
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => `${k}:${v}`)
    .join(';');

export const slug = (s: string) => s.toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

export const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/**
 * A display heading's text with its one italic navy word.
 * `em` names the words to set in italic (they must occur in the text; the
 * last occurrence is used). Without it, the last word is the one.
 */
export function emphasize(text: string, em?: string): string {
  const t = text.trim();
  let at = -1, len = 0;
  if (em && t.includes(em)) { at = t.lastIndexOf(em); len = em.length; }
  else {
    const m = /(\S+)\s*$/.exec(t);
    if (m) { at = m.index; len = m[1].length; }
  }
  if (at < 0) return esc(t);
  return `${esc(t.slice(0, at))}<em>${esc(t.slice(at, at + len))}</em>${esc(t.slice(at + len))}`;
}

/** A figure with its unit (+, %, &) in italic navy, as on the home page. */
export const fig = (v: string) => esc(v).replace(/\+|%|&amp;/g, (m) => `<em>${m}</em>`);
