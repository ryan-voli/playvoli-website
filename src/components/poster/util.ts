// Small helpers the poster components share: the palette by name, the angles
// a sticker may take, and inline custom properties.

export type Field = 'ink' | 'lime' | 'blue' | 'rose';
export type Tint = Field | 'white';

const TINTS: Record<Tint, string> = {
  ink: 'var(--ink)',
  lime: 'var(--lime)',
  blue: 'var(--blue)',
  rose: 'var(--rose)',
  white: '#fff',
};

/** A palette name as a CSS value. */
export function tint(name?: Tint): string | undefined {
  if (name === undefined) return undefined;
  const v = TINTS[name];
  if (!v) throw new Error(`"${name}" is not in the palette: use ink, lime, blue, rose or white`);
  return v;
}

/** The one angle and its halves. Nothing on the poster leans any other way. */
export const TILTS = [-15, -7.5, -3.75, 0, 3.75, 7.5, 15] as const;
export type Tilt = (typeof TILTS)[number];

export function tilt(r: number | undefined, what: string): number | undefined {
  if (r === undefined) return undefined;
  if (!(TILTS as readonly number[]).includes(r)) {
    throw new Error(`${what}: a tilt of ${r} degrees is off the grid. Use 0, 3.75, 7.5 or 15, either way.`);
  }
  return r;
}

type Value = string | number | undefined | null | false;

/** Inline custom properties (and plain ones), leaving out whatever is not set. */
export function vars(o: Record<string, Value>): string | undefined {
  const out = Object.entries(o)
    .filter(([, v]) => v !== undefined && v !== null && v !== false && v !== '')
    .map(([k, v]) => `${k}:${v}`)
    .join(';');
  return out || undefined;
}

/** Where a thing sits in a Stack: percent of the stack, degrees, layer. */
export interface Place {
  /** Left edge, in percent of the stack's width. */
  x?: number;
  /** Top edge, in percent of the stack's height. */
  y?: number;
  /** Width, in percent of the stack's width. */
  w?: number;
  /** Tilt in degrees: 0, 3.75, 7.5 or 15, either way. */
  r?: number;
  /** Layer: higher is in front. */
  z?: number;
  /** The same three for the one-column (phone) layout, where they differ. */
  xm?: number;
  ym?: number;
  wm?: number;
}

export function placeVars(p: Place, what: string): Record<string, Value> {
  return {
    '--x': p.x, '--y': p.y, '--w': p.w, '--r': tilt(p.r, what), '--z': p.z,
    '--xm': p.xm, '--ym': p.ym, '--wm': p.wm,
  };
}

export const slug = (s: string) => s.toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

/** Round to three places, for numbers printed into a style attribute. */
export const r3 = (n: number) => Math.round(n * 1000) / 1000;
