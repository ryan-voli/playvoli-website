// The fitted title, worked out once: Rider prints the lines, and Band and
// Cell read the last line's measure so a level column can sit as close under
// the title as the slope allows.
import { emWidth } from '../../lib/designer-metrics';
import { r3 } from './util';

/** One line of text, or two parts: one line on a wide screen, two on a phone. */
export type LineText = string | [string, string];

export interface RiderLine {
  text: LineText;
  /** 'big' is fitted edge to edge; 'sm' is the small line. Default 'big'. */
  size?: 'big' | 'sm';
  /** Outlined instead of solid. */
  hollow?: boolean;
  /** Stops a short big line short: the most its letters may stand, in --u, on wide screens. Default 20. */
  cap?: number;
  /** The same on phones. Default 20. */
  capPhone?: number;
  /** A two-part big line whose parts are each fitted edge to edge on a phone (a figure over its words). */
  fit?: boolean;
}

export interface TitleProps {
  /** A small outlined line above the title. */
  kicker?: string;
  /** The big line. Two parts make one line on a wide screen and two on a phone. */
  title?: LineText;
  /** A small outlined line under the title. */
  sub?: string;
  /** Every line spelled out, for anything the three above do not cover. */
  lines?: (LineText | RiderLine)[];
  /** Caps the title line (see RiderLine.cap). */
  cap?: number;
  capPhone?: number;
}

export interface Measured {
  size: 'big' | 'sm';
  hollow: boolean;
  parts: string[];
  /** Width in ems on one line. */
  em: number;
  /** Width in ems of each part. */
  ems: number[];
  cap?: number;
  capPhone?: number;
  fit: boolean;
}

/** A small line longer than this would have to shrink on a 320px phone. */
const SMALL_MAX = 15.5;
/** A big line longer than this sets its letters under 30px on a phone. */
const BIG_MAX = 11.5;

const say = (t: LineText) => (Array.isArray(t) ? t.join(' ') : t);

function measure(l: RiderLine): Measured {
  const parts = (Array.isArray(l.text) ? l.text : [l.text]).map((p) => p.trim());
  if (parts.some((p) => !p)) throw new Error('Rider: a title line is empty');
  const size = l.size ?? 'big';
  const ems = parts.map((p) => emWidth(p));
  const em = emWidth(parts.join(' '));
  if (size === 'sm') {
    if (parts.length > 1) throw new Error(`Rider: the small line "${say(l.text)}" cannot be split in two: give it as one string`);
    if (em > SMALL_MAX) {
      throw new Error(`Rider: the small line "${say(l.text)}" is ${em} ems wide. Keep a small line under ${SMALL_MAX} ems (about 19 letters), or move words to the big line.`);
    }
  } else {
    const widest = Math.max(...ems);
    if (widest > BIG_MAX) {
      throw new Error(
        `Rider: "${parts[ems.indexOf(widest)]}" is ${widest} ems wide, too long for one fitted line on a phone. ` +
          `Give the line as two parts, ['first words', 'last words'], or shorten it.`,
      );
    }
    if (l.fit && parts.length !== 2) throw new Error(`Rider: "fit" needs a two-part line (${say(l.text)})`);
  }
  return { size, hollow: !!l.hollow, parts, em, ems, cap: l.cap, capPhone: l.capPhone, fit: !!l.fit };
}

/** The lines a title is made of, measured. */
export function riderLines(p: TitleProps): Measured[] {
  if (p.lines) {
    return p.lines.map((l) => measure(typeof l === 'string' || Array.isArray(l) ? { text: l } : l));
  }
  const out: Measured[] = [];
  if (p.kicker) out.push(measure({ text: p.kicker, size: 'sm', hollow: true }));
  if (p.title) out.push(measure({ text: p.title, cap: p.cap, capPhone: p.capPhone }));
  if (p.sub) out.push(measure({ text: p.sub, size: 'sm', hollow: true }));
  return out;
}

/** The whole title as one sentence, for an id or a label. */
export const riderText = (lines: Measured[]) => lines.map((l) => l.parts.join(' ')).join(' ');

/** What Band and Cell print so a level column can tuck under the title's last
 *  line: the kind of line, its width in ems and the width its size is fitted
 *  to, on a wide screen and on a phone. Nothing when the title ends in a note. */
export function titleMetrics(lines: Measured[], endsInNote = false): { t?: 'sm' | 'big'; vars: Record<string, number | undefined> } {
  const last = lines[lines.length - 1];
  if (!last || endsInNote) return { vars: {} };
  if (last.size === 'sm') return { t: 'sm', vars: { '--te': last.em } };
  const two = last.parts.length === 2;
  const lastPart = last.ems[last.ems.length - 1];
  return {
    t: 'big',
    vars: {
      '--te': last.em,
      '--tf': last.em,
      '--tc': last.cap,
      // On a phone a two-part line is two lines: the column sits under the second.
      '--tem': two ? lastPart : last.em,
      '--tfm': two ? (last.fit ? lastPart : r3(Math.max(...last.ems))) : last.em,
      '--tcm': last.fit ? 999 : last.capPhone,
    },
  };
}
