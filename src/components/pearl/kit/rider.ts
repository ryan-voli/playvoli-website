// Poster title props, read as one Pearl display heading.
//
// A Poster title comes as title + sub, kicker + title, or lines. Pearl sets
// every one of them as a single sentence in the display face, in the same
// words and order, with one italic navy word: the `em` prop names it, or it
// is the last word. Sizes ('sm'), outlines (hollow), caps and fits are the
// Poster's and are ignored.

/** One line of text, or two parts (the Poster's wide / phone break). */
export type LineText = string | [string, string];

export interface RiderLine {
  text: LineText;
  size?: 'big' | 'sm';
  hollow?: boolean;
  cap?: number;
  capPhone?: number;
  fit?: boolean;
}

export interface TitleProps {
  kicker?: string;
  title?: LineText;
  sub?: string;
  lines?: (LineText | RiderLine)[];
  cap?: number;
  capPhone?: number;
  /** Pearl only: the word(s) of the title to set in italic navy. Default: the last word. */
  em?: string;
}

const say = (t: LineText) => (Array.isArray(t) ? t.map((p) => p.trim()).join(' ') : t.trim());

/** The title's words, in order, as one sentence. Empty when there is none. */
export function titleText(p: TitleProps): string {
  if (p.lines?.length) {
    return p.lines.map((l) => say(typeof l === 'string' || Array.isArray(l) ? l : l.text)).join(' ');
  }
  return [p.kicker, p.title && say(p.title), p.sub].filter(Boolean).join(' ');
}
