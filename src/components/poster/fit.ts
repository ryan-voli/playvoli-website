// Fits a display line whose words arrive in the browser (a league name, a
// matchup, a show's title) the way the poster's titles are fitted at build
// time: the words are broken into balanced lines, the widest line runs edge to
// edge (--em, in Designer's ems, from lib/designer-metrics), and a short line
// stops at its cap (--cap, --cap-m). The element carries the class "fit":
//
//   <span class="fit" id="game-title" style={`--em:${emWidth('View this game')}`}>View this game</span>
//   <script> import { keepFitted } from '../components/poster/fit'; keepFitted(document.getElementById('game-title')); </script>
//
// The text is the visitor's own data, so it may hold marks the display face
// cannot set (parentheses, which Designer draws as an I; accents other than
// É and Ñ; emoji). Those are set in the text face, inside the same line, and
// every word stays as it was written. Everything is built with textContent.
import { emWidth } from '../../lib/designer-metrics';

/** A mark Designer cannot set, set in the text face instead: about this wide. */
const ALT_EM = 0.8;
const SPACE_EM = emWidth(' ');

const canSet = (ch: string) => {
  if (/[()~→]/.test(ch)) return false;
  try {
    emWidth(ch);
    return true;
  } catch {
    return false;
  }
};

/** A word's width in ems: Designer's own figure where it can set every mark. */
function wordEm(word: string): number {
  try {
    if ([...word].every(canSet)) return emWidth(word);
  } catch {
    /* measured mark by mark below */
  }
  return [...word].reduce((w, ch) => w + (canSet(ch) ? emWidth(ch) : ALT_EM), 0);
}

/** Little words that read badly at the end of a line ("Indy Ignite at / Dallas Pulse"). */
const GLUE = new Set(['a', 'an', 'and', '&', 'at', 'the', 'v', 'v.', 'vs', 'vs.']);

/** Breaks words into `n` lines so that the widest line is as narrow as it can be. With
 *  `words`, no line but the last may end in a little word, if that can be helped. */
function balance(widths: number[], n: number, words?: string[]): number[] {
  const count = widths.length;
  const ok = (end: number) => !words || !GLUE.has(words[end - 1].toLowerCase());
  let best: number[] = [count];
  let bestW = Infinity;
  const lineW = (a: number, b: number) =>
    widths.slice(a, b).reduce((s, w) => s + w, 0) + SPACE_EM * Math.max(0, b - a - 1);
  const walk = (start: number, left: number, cuts: number[], widest: number) => {
    if (widest >= bestW) return;
    if (left === 1) {
      const w = Math.max(widest, lineW(start, count));
      if (w < bestW) {
        bestW = w;
        best = [...cuts, count];
      }
      return;
    }
    for (let end = start + 1; end <= count - left + 1; end++) {
      if (ok(end)) walk(end, left - 1, [...cuts, end], Math.max(widest, lineW(start, end)));
    }
  };
  walk(0, Math.min(n, count), [], 0);
  return best;
}

function setLine(line: HTMLElement, text: string) {
  let run = '';
  const flush = () => {
    if (run) line.append(run);
    run = '';
  };
  for (const ch of text) {
    if (ch === ' ' || canSet(ch)) {
      run += ch;
    } else {
      flush();
      const alt = document.createElement('span');
      alt.className = 'fit__alt';
      alt.textContent = ch;
      line.append(alt);
    }
  }
  flush();
}

/**
 * Lays out the element's current text as fitted display lines. A line is kept
 * to about `maxEm` ems (fewer on a phone), in at most `maxLines` lines.
 */
export function fitTitle(el: HTMLElement, { maxEm = 12, phoneMaxEm = 7.5, maxLines = 3, phoneMaxLines = 5 } = {}) {
  const text = (el.textContent || '').replace(/\s+/g, ' ').trim();
  if (!text) return;
  const phone = window.matchMedia('(max-width: 640px)').matches;
  const words = text.split(' ');
  const widths = words.map(wordEm);
  const total = widths.reduce((s, w) => s + w, 0) + SPACE_EM * (words.length - 1);
  const limit = phone ? phoneMaxEm : maxEm;
  const most = Math.min(phone ? phoneMaxLines : maxLines, words.length);

  // The fewest lines that keep every line near the limit and the lines near
  // one another in length (no lonely last word); failing that, the most even.
  const layout = (n: number) => {
    let cuts = balance(widths, n, words);
    if (cuts.length < n) cuts = balance(widths, n);
    const ems: number[] = [];
    let start = 0;
    for (const end of cuts) {
      ems.push(widths.slice(start, end).reduce((s, w) => s + w, 0) + SPACE_EM * (end - start - 1));
      start = end;
    }
    const widest = Math.max(...ems);
    return { cuts, widest, even: Math.min(...ems) / widest };
  };
  const tries = [];
  for (let n = Math.min(most, Math.max(1, Math.ceil(total / limit) - 1)); n <= most; n++) tries.push(layout(n));
  const biggest = (list: typeof tries) => list.reduce((a, b) => (b.widest < a.widest ? b : a));
  const fair = tries.filter((t) => t.cuts.length === 1 || t.even >= 0.45);
  const pick =
    tries.find((t) => t.widest <= limit * 1.35 && (t.cuts.length === 1 || t.even >= 0.6)) ??
    biggest(fair.length ? fair : tries);

  const lines: string[] = [];
  let start = 0;
  for (const end of pick.cuts) {
    lines.push(words.slice(start, end).join(' '));
    start = end;
  }
  const widest = pick.widest;

  el.dataset.fitted = text;
  el.style.setProperty('--em', String(Math.round(widest * 1000) / 1000));
  el.replaceChildren();
  lines.forEach((t, i) => {
    if (i) el.append(' ');
    const line = document.createElement('span');
    line.className = 'fit__l';
    setLine(line, t);
    el.append(line);
  });
}

/** Fits the element now, again whenever a script replaces its text, and on a change of layout. */
export function keepFitted(el: HTMLElement, options?: Parameters<typeof fitTitle>[1]) {
  const refit = () => {
    const text = (el.textContent || '').replace(/\s+/g, ' ').trim();
    if (text && text !== el.dataset.fitted) fitTitle(el, options);
  };
  fitTitle(el, options);
  new MutationObserver(refit).observe(el, { childList: true, characterData: true, subtree: true });
  window.matchMedia('(max-width: 640px)').addEventListener('change', () => fitTitle(el, options));
}
