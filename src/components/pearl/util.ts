// Small helpers for the light system's components.

/** "We *built it.*" → "We <em>built it.</em>", the rest escaped. The italic
 *  navy word belongs to display headings only. */
export const em = (text: string): string =>
  text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>');

/** Inline custom properties from a map, skipping empty values. */
export const vars = (v: Record<string, string | number | undefined | null>): string =>
  Object.entries(v)
    .filter(([, x]) => x !== undefined && x !== null && x !== '')
    .map(([k, x]) => `${k}:${x}`)
    .join(';');

/** A place on a stage: percentages of the stage's width / height. m = phone layout. */
export interface Place {
  x?: number; y?: number; w?: number; z?: number;
  xm?: number; ym?: number; wm?: number;
}
const pc = (n?: number) => (n === undefined ? undefined : `${n}%`);
export const placeVars = (p: Place) =>
  vars({ '--x': pc(p.x), '--y': pc(p.y), '--w': pc(p.w), '--z': p.z, '--xm': pc(p.xm), '--ym': pc(p.ym), '--wm': pc(p.wm) });
