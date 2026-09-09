import {
  ELECTRIC, GLASS15, GLASS_NAV, LEMON, ROSE,
  capLabel, designer, designerWidth, el, rgb, rgba,
} from './card-kit';

/* The NCAA Head2Head section — "the seam" — from
 * lib/pages/games/widgets/ncaa_performance.dart.
 *
 * Every stat category is one band filled edge to edge with the two team
 * colours, split by an angled seam whose POSITION is the stat: it sits at the
 * away team's share of the category, and away always owns the left so
 * position carries identity rather than colour alone.
 *
 * THE ONE THING SATORI CANNOT DO is that seam. Two tilted polygons, each with
 * its own horizontal fade, is a CustomPainter in the app and there is no
 * clip-path, no polygon and no custom paint in satori's CSS subset. But resvg
 * is already the last step of this pipeline, so the band's ground goes in as
 * a data-URI <svg> — real <path> polygons, real <linearGradient> fills, the
 * painter's arithmetic transcribed — and satori composites it as an <img>.
 * Everything on top of it (the rail chip, the numerals, the deck, the ledger)
 * is ordinary flexbox.
 *
 * The gaps BETWEEN bands are left transparent on purpose: this hangs under
 * the card on a forum's own background, and the only places that get a ground
 * are the ones where the ground is the data.
 */

// ── the app's own numbers ──────────────────────────────────────────────
const PTS_H = 72, PTS_NUM = 34, PTS_EDGE = 0.30, PTS_R = 20;
const KLL_H = 54, KLL_NUM = 24;
const BAND_H = 44, BAND_NUM = 20, BAND_EDGE = 0.20, BAND_R = 16;
const DECK_H = 30;
const RAIL_H = 20, RAIL_INSET = 10, NUM_INSET = 24;
const SEAM_STROKE_INSET = 6;

/** One decimal only when a value is actually fractional (block halves). */
const fmt = (v: number) =>
  v === Math.round(v) ? String(Math.round(v)) : v.toFixed(1);

/** NCAA box-score convention: `.252`, negatives as `-.045`. */
const effFmt = (e: number) => {
  const s = Math.abs(e).toFixed(3).slice(1);
  return e < 0 ? `-${s}` : s;
};

const eff = (kills: number, errors: number, attempts: number) =>
  attempts > 0 ? (kills - errors) / attempts : 0;

/** Same tiers as the pro attack donut, so efficiency reads one way app-wide. */
const effColor = (e: number) =>
  e <= 0.159 ? ROSE : e < 0.28 ? ELECTRIC : LEMON;

/** A rounded-rect path with independent corners — the bands do not all round
 *  the same way (KLL rounds only its top, the deck under it only its
 *  bottom), and `rx` cannot say that. */
function roundRect(w: number, h: number, r: [number, number, number, number]) {
  const [tl, tr, br, bl] = r;
  return (
    `M${tl} 0 H${w - tr} A${tr} ${tr} 0 0 1 ${w} ${tr} ` +
    `V${h - br} A${br} ${br} 0 0 1 ${w - br} ${h} ` +
    `H${bl} A${bl} ${bl} 0 0 1 0 ${h - bl} ` +
    `V${tl} A${tl} ${tl} 0 0 1 ${tl} 0 Z`
  );
}

/** _SeamSplitPainter, as SVG. */
function seamSvg(
  w: number, h: number, seam: number, dim: number,
  away: [number, number, number], home: [number, number, number],
  radius: [number, number, number, number]
): string {
  const x = seam * w;
  // The seam leans AWAY from the side that owns more: dead vertical at 50/50,
  // scaling to a 45-degree tilt by a 75/25 split.
  const lean = Math.max(-1, Math.min(1, (seam - 0.5) / 0.25));
  const t = (h / 2) * lean;
  const reach = Math.abs(t);
  // The lock-screen fade language: colour anchored at the outer edge, easing
  // out well before the seam so the middle stays dark. Each side's fade spans
  // exactly its territory, so the reach of the colour still encodes the share.
  const grad = (c: [number, number, number], id: string, x1: number, x2: number) =>
    `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${x1}" y1="0" x2="${x2}" y2="0">` +
    `<stop offset="0" stop-color="${rgb(c)}" stop-opacity="${0.62 * dim}"/>` +
    `<stop offset="0.52" stop-color="${rgb(c)}" stop-opacity="${0.22 * dim}"/>` +
    `<stop offset="0.96" stop-color="${rgb(c)}" stop-opacity="0"/>` +
    `</linearGradient>`;
  // The net: a whisper of a seam so the split point still reads, drawn along
  // the tilted line but held off the band's top and bottom edges.
  const along = (y: number) => x + t - 2 * t * (y / h);
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">` +
    `<defs>${grad(away, 'a', 0, x + reach)}${grad(home, 'h', w, x - reach)}` +
    `<clipPath id="c"><path d="${roundRect(w, h, radius)}"/></clipPath></defs>` +
    `<g clip-path="url(#c)">` +
    // Quiet ground so the band reads as a card even where the fades die out.
    `<rect width="${w}" height="${h}" fill="#ffffff" fill-opacity="0.05"/>` +
    `<path d="M0 0 L${x + t} 0 L${x - t} ${h} L0 ${h} Z" fill="url(#a)"/>` +
    `<path d="M${w} 0 L${x + t} 0 L${x - t} ${h} L${w} ${h} Z" fill="url(#h)"/>` +
    `<line x1="${along(SEAM_STROKE_INSET)}" y1="${SEAM_STROKE_INSET}" ` +
    `x2="${along(h - SEAM_STROKE_INSET)}" y2="${h - SEAM_STROKE_INSET}" ` +
    `stroke="#ffffff" stroke-opacity="${0.28 * dim}" stroke-width="1.5" stroke-linecap="round"/>` +
    `</g></svg>`
  );
}

const dataUri = (svg: string) =>
  'data:image/svg+xml;base64,' + Buffer.from(svg, 'utf8').toString('base64');

export type Totals = Record<string, number>;

export interface H2HInput {
  width: number;
  away: Totals;
  home: Totals;
  awayFill: [number, number, number];
  homeFill: [number, number, number];
  awayInk: [number, number, number];
  homeInk: [number, number, number];
  awayAbbr: string;
  homeAbbr: string;
  official: boolean | null;
}

const ERROR_COLS: [string, string][] = [
  ['SRV', 'srv_err'], ['REC', 'rec_err'], ['SET', 'set_err'],
  ['ATK', 'atk_err'], ['BLK', 'blk_err'],
];

const OFFICIAL_H = 17 + 8;   // 12pt line + Padding(bottom: 8)
const LEDGER_H = 12 + 16 + 8 + 16 + 34 + 34 + 10;

/** Total height of the section, so the caller can size the canvas. */
export function h2hHeight(official: boolean | null): number {
  return (
    (official !== null ? OFFICIAL_H : 0) +
    8 + PTS_H + 12 + KLL_H + DECK_H +
    (8 + BAND_H) * 5 +
    12 + LEDGER_H
  );
}

export function h2hSection(i: H2HInput): any {
  const W = i.width;
  const a = (k: string) => i.away[k] ?? 0;
  const h = (k: string) => i.home[k] ?? 0;

  // Points earned = kills + aces + blocks. Half-credited block assists can
  // leave this fractional until the stat officializing pass cleans the box
  // score — accepted; the display formats halves when they appear.
  const awayPts = a('atk_kll') + a('srv_ace') + a('blk_kll');
  const homePts = h('atk_kll') + h('srv_ace') + h('blk_kll');

  const band = (
    code: string, av: number, hv: number,
    height = BAND_H, numeralSize = BAND_NUM, edge = BAND_EDGE,
    radius: [number, number, number, number] = [BAND_R, BAND_R, BAND_R, BAND_R]
  ) => {
    const total = av + hv;
    const started = total > 0;
    const seam = started
      ? Math.min(1 - edge, Math.max(edge, av / total))
      : 0.5;
    const dim = started ? 1 : 0.35;
    const ink = started ? '#fff' : 'rgba(255,255,255,0.38)';
    const numeral = (v: number, side: 'left' | 'right') =>
      el(
        { position: 'absolute', [side]: NUM_INSET, top: 0, height, alignItems: 'center' } as any,
        [designer(fmt(v), numeralSize, ink)]
      );

    return el({ position: 'relative', width: W, height }, [
      {
        type: 'img',
        props: {
          src: dataUri(seamSvg(W, height, seam, dim, i.awayFill, i.homeFill, radius)),
          width: W, height,
          style: { position: 'absolute', top: 0, left: 0 },
        },
      },
      el({
        position: 'absolute', top: 0, left: 0, width: W, height,
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: `${radius[0]}px ${radius[1]}px ${radius[2]}px ${radius[3]}px`,
      }),
      // The centre rail: the dark strip the code sits on, inset from both
      // edges so its rounded ends never touch them.
      el(
        {
          position: 'absolute', left: RAIL_INSET, top: (height - RAIL_H) / 2,
          width: W - RAIL_INSET * 2, height: RAIL_H,
          backgroundColor: GLASS_NAV, borderRadius: RAIL_H / 2,
          alignItems: 'center', justifyContent: 'center',
        },
        [capLabel(code, {
          size: 10, weight: 800, letterSpacing: 1.2, box: RAIL_H, color: '#fff',
        })]
      ),
      numeral(av, 'left'),
      numeral(hv, 'right'),
    ]);
  };

  /* The dark strip under the attack band: hitting efficiency in its app-wide
   * tier colours (kept OFF the team fills on purpose) plus each side's
   * attempt count. */
  const deck = () => {
    const cell = (e: number, att: number) =>
      capLabel(att > 0 ? effFmt(e) : '—', {
        size: 15, weight: 800, box: DECK_H,
        color: att > 0 ? effColor(e) : 'rgba(255,255,255,0.38)',
      });
    const att = (v: number) =>
      capLabel(`${Math.round(v)} att`, {
        size: 10, box: DECK_H, color: 'rgba(255,255,255,0.54)',
      });
    const ae = eff(a('atk_kll'), a('atk_err'), a('atk_sum'));
    const he = eff(h('atk_kll'), h('atk_err'), h('atk_sum'));
    return el(
      {
        width: W, height: DECK_H, paddingLeft: 16, paddingRight: 16,
        backgroundColor: GLASS15,
        borderRadius: `0 0 ${BAND_R}px ${BAND_R}px`,
        alignItems: 'center',
      },
      [
        cell(ae, a('atk_sum')), el({ width: 6 }), att(a('atk_sum')),
        el({ flexGrow: 1 }),
        capLabel('EFF', {
          size: 10, weight: 700, letterSpacing: 1.5, box: DECK_H,
          color: 'rgba(255,255,255,0.38)',
        }),
        el({ flexGrow: 1 }),
        att(h('atk_sum')), el({ width: 6 }), cell(he, h('atk_sum')),
      ]
    );
  };

  /* All five error columns in one quiet table — errors stay off the coloured
   * bands so territory up there always means production. Per column the
   * cleaner side reads white, the worse side rose. */
  const ledger = () => {
    const tot = (s: Totals) =>
      ERROR_COLS.reduce((sum, c) => sum + (s[c[1]] ?? 0), 0);
    const valueColor = (mine: number, theirs: number) =>
      mine === theirs ? 'rgba(255,255,255,0.54)' : mine < theirs ? '#fff' : ROSE;

    const hairline = () =>
      el({ flexGrow: 1, height: 1, backgroundColor: rgba([255, 31, 109], 0.25) });

    /* The abbreviation chip lives in a 52pt box and the app lets a long
     * abbreviation overflow it — CLEM renders as CLE with the M sliced down
     * the middle. Same 52pt box here, but the cut lands on a whole letter:
     * the two read identically, and a share does not carry a half-glyph out
     * into a thread where it just looks broken. */
    const chipLabel = (abbr: string) => {
      let out = abbr.toUpperCase();
      while (out.length > 1 && designerWidth(out, 13) > 52 - 16) {
        out = out.slice(0, -1);
      }
      return out;
    };

    const teamRow = (
      abbr: string, ink: [number, number, number], mine: Totals, theirs: Totals
    ) =>
      el({ width: W - 32, height: 34, alignItems: 'center' }, [
        el({ width: 52 }, [
          el(
            {
              paddingLeft: 8, paddingRight: 8, height: 13 + 6,
              backgroundColor: GLASS_NAV, borderRadius: 6, alignItems: 'center',
            },
            [designer(chipLabel(abbr), 13, rgb(ink))]
          ),
        ]),
        ...ERROR_COLS.map((c) =>
          el({ flexGrow: 1, flexBasis: 0, justifyContent: 'center' }, [
            designer(fmt(mine[c[1]] ?? 0), 18,
              valueColor(mine[c[1]] ?? 0, theirs[c[1]] ?? 0)),
          ])
        ),
        el({
          width: 1, height: 22, marginLeft: 4, marginRight: 4,
          backgroundColor: 'rgba(255,255,255,0.12)',
        }),
        el({ width: 44, justifyContent: 'center' }, [
          designer(fmt(tot(mine)), 22, valueColor(tot(mine), tot(theirs))),
        ]),
      ]);

    return el(
      {
        width: W, flexDirection: 'column',
        paddingLeft: 16, paddingRight: 16, paddingTop: 12, paddingBottom: 10,
        backgroundColor: GLASS15, borderRadius: 20,
      },
      [
        el({ width: W - 32, height: 16, alignItems: 'center' }, [
          hairline(),
          el({ paddingLeft: 12, paddingRight: 12 }, [
            capLabel('ERRORS', {
              size: 11, weight: 800, letterSpacing: 3, box: 16, color: ROSE,
            }),
          ]),
          hairline(),
        ]),
        el({ height: 8 }),
        el({ width: W - 32, height: 16, alignItems: 'center' }, [
          el({ width: 52 }),
          ...ERROR_COLS.map((c) =>
            el({ flexGrow: 1, flexBasis: 0, justifyContent: 'center' }, [
              capLabel(c[0], {
                size: 9, weight: 700, letterSpacing: 1, box: 16,
                color: 'rgba(255,255,255,0.38)',
              }),
            ])
          ),
          el({ width: 9 }),
          el({ width: 44, justifyContent: 'center' }, [
            capLabel('TOT', {
              size: 9, weight: 700, letterSpacing: 1, box: 16,
              color: 'rgba(255,255,255,0.38)',
            }),
          ]),
        ]),
        teamRow(i.awayAbbr, i.awayInk, i.away, i.home),
        teamRow(i.homeAbbr, i.homeInk, i.home, i.away),
      ]
    );
  };

  return el({ width: W, flexDirection: 'column' }, [
    ...(i.official !== null
      ? [
          el({ width: W, height: OFFICIAL_H, justifyContent: 'center' }, [
            capLabel(i.official ? 'Official Stats' : 'Unofficial Stats', {
              size: 12, weight: 600, box: 17,
              color: i.official ? ELECTRIC : '#9E9E9E',
            }),
          ]),
        ]
      : []),
    el({ height: 8 }),
    band('PTS', awayPts, homePts, PTS_H, PTS_NUM, PTS_EDGE,
      [PTS_R, PTS_R, PTS_R, PTS_R]),
    el({ height: 12 }),
    band('KLL', a('atk_kll'), h('atk_kll'), KLL_H, KLL_NUM, BAND_EDGE,
      [BAND_R, BAND_R, 0, 0]),
    deck(),
    el({ height: 8 }),
    band('ACE', a('srv_ace'), h('srv_ace')),
    el({ height: 8 }),
    band('REC', a('rec_sum'), h('rec_sum')),
    el({ height: 8 }),
    band('AST', a('ast_sum'), h('ast_sum')),
    el({ height: 8 }),
    band('BLK', a('blk_kll'), h('blk_kll')),
    el({ height: 8 }),
    band('DIG', a('dig_sum'), h('dig_sum')),
    el({ height: 12 }),
    ledger(),
  ]);
}
