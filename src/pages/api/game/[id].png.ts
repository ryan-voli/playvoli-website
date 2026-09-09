import type { APIRoute } from 'astro';
import satori from 'satori';
import { Resvg, initWasm } from '@resvg/resvg-wasm';
import { createClient } from '@supabase/supabase-js';
import {
  DESIGNER,
  AXIFORMA_BOOK,
  AXIFORMA_BLACK,
  RESVG_WASM,
} from '../../../lib/card-assets';

/* /api/game/<game_id>.png — the game drawer's header, rendered fresh on
 * every request.
 *
 * WHAT THIS IS. A replica of GameHeader (lib/pages/games/widgets/
 * game_header.dart) at collapse 0, not a poster inspired by it. Every
 * number below — the 8/8/8/10 padding, the 124pt team columns, the 150pt
 * body, the 34pt score cells, the 12pt dots, the .42/.14/0 wash alphas —
 * is the app's own value, so the two cannot drift into looking like
 * cousins. The one liberty is the corners: the PNG has real alpha outside
 * the 24pt radius, so it sits on a forum's own background instead of
 * carrying a dark rectangle around with it.
 *
 * WHAT IS DROPPED, and why. Everything in the header that only means
 * something to a finger: the drag handle, the action menu, the close
 * button, and the drawer's tab selector. Nothing else is left out.
 *
 * WHY AN ENDPOINT AND NOT A FILE. Forum posts cannot embed anything live:
 * ProBoards escapes HTML, so no iframe, no script, no component. What [img]
 * WILL take is a URL, and nothing says that URL has to return a static file.
 * Rendering per request means the score in a forum thread is current every
 * time somebody opens it — refresh-live rather than push-live, which in a
 * thread people are already scrolling is close enough to be indistinguishable.
 *
 * The cache headers are the whole ballgame. Serve this with a normal cache
 * policy and every reader sees whatever was rendered first, forever, and the
 * feature is pointless. See the response headers at the bottom.
 *
 * satori + resvg rather than @vercel/og, which wraps these two: its Node
 * build does a dynamic require('fs') for harfbuzz that Vite's dev SSR cannot
 * follow, so the route only worked in production and could not be looked at
 * locally. Satori emits glyphs as PATHS, so its SVG is self-contained and
 * resvg needs no fonts of its own.
 *
 * resvg's WASM build, not its native one. @resvg/resvg-js ships a prebuilt
 * binary per platform; the one installed on a Mac does not exist on Vercel's
 * Linux runtime, so the route rendered locally and 500'd in production. WASM
 * is the same renderer with no platform in it.
 */

export const prerender = false;

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
function fontSet() {
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

/* One init per process, not per request. initWasm throws if called twice, so
 * the promise is the guard — every request awaits the same one. The catch is
 * for dev only: Vite re-evaluates this module on every save, which resets the
 * guard while the WASM instance itself survives. */
let wasmReady: Promise<void> | null = null;
function ensureWasm(): Promise<void> {
  wasmReady ??= initWasm(RESVG_WASM()).catch((e: any) => {
    if (!String(e?.message ?? e).includes('Already initialized')) throw e;
  });
  return wasmReady;
}

const SUPABASE_URL = 'https://api.playvoli.com';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhjaG9sa3JqcHV6YWhxdW1hamVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ0MDcwMzQsImV4cCI6MjA1OTk4MzAzNH0.RVhKzZkLxwwtbow3i3tUSVVnG_hMl-q0bwuvmqNuDq0';

/* ── Geometry, in the app's own points ──────────────────────────────────
 *
 * The whole tree is laid out at the 430pt design canvas the app is drawn
 * on, and resvg scales the finished VECTOR up at the end. So SCALE only
 * changes how many pixels come out, never the layout — and every constant
 * below can stay the number that is in the Dart file.
 *
 * SCALE 2 is the app's own retina rendering: 860x432, which lands in a
 * forum post at about the width of a phone screenshot. Higher is sharper
 * and also bigger on the page, which is the wrong trade here — so it is the
 * default rather than the ceiling, and ?w= moves it.
 */
const SCALE = 2;
const W = 430;

/* How wide the PNG comes out, in real pixels. ?w= overrides it, clamped:
 * below MIN the 9pt SET label stops being readable, and above MAX the file
 * is bigger than any forum column will ever show it at. The layout does not
 * change — the finished vector is just scaled — so every width is equally
 * sharp and none of them reflows anything. */
const OUT_DEFAULT = W * SCALE; // 860
const OUT_MIN = 320;
const OUT_MAX = 1290;

const PAD_L = 8, PAD_T = 8, PAD_R = 8, PAD_B = 10;
const STATUS_H = 36;      // the 36pt icon buttons set this row's height
const STATUS_GAP = 12;    // SizedBox(height: 12)
const BODY_H = 150;       // _bodyHeight at collapse 0
const COL_W = 124;        // _teamColumn width
const RADIUS = 24;        // ClipRRect
const H = PAD_T + STATUS_H + STATUS_GAP + BODY_H + PAD_B;

/* A dot row is as tall as its Designer score cell: fontSize 15 on a
 * lineHeight-1 box, plus the optical nudge. The dots (12) are shorter, so
 * they do not set it. */
const DOT_SIZE = 12;      // the winner dot
const DOT_ROW_H = 15 + 15 * (200 / 952) * 0.6;
const PILL_H = 34;        // _livePill at collapse 0

const DARK = '#131819';   // AppColors.eerieBlack
const LEMON = '#F0FF1E';  // AppColors.lemonLime
const GLASS15 = 'rgba(255,255,255,0.15)'; // AppColors.glassLight15

/* Designer advance widths, in font units (unitsPerEm 1000), read straight
 * out of the OTF's hmtx table. They exist so FittedBox(scaleDown) can be
 * reproduced: the app measures the name and shrinks it to fit 116pt, and
 * without the real widths a long name like MISSISSIPPI would just run off
 * its column. Caps and digits only — the face has no lowercase and every
 * string that reaches it is uppercased. */
const DESIGNER_EM = 1000;
const DESIGNER_ADV: Record<string, number> = {
  ' ': 445, A: 848, B: 834, C: 689, D: 795, E: 745, F: 722, G: 832, H: 804,
  I: 321, J: 655, K: 772, L: 659, M: 995, N: 837, O: 867, P: 810, Q: 867,
  R: 827, S: 796, T: 708, U: 836, V: 783, W: 1170, X: 759, Y: 717, Z: 753,
  '0': 796, '1': 411, '2': 816, '3': 787, '4': 819, '5': 821, '6': 824,
  '7': 714, '8': 820, '9': 823, '.': 242, "'": 209, '&': 785, '-': 422,
  '–': 548, '—': 783, '/': 570, '(': 342, ')': 342, '!': 321,
};
function designerWidth(s: string, size: number): number {
  let u = 0;
  for (const ch of s) u += DESIGNER_ADV[ch] ?? DESIGNER_ADV['O'];
  return (u / DESIGNER_EM) * size;
}

/* designerDescent(), the optical nudge DesignerText applies everywhere.
 * Designer's ink sits high in its line box (hhea ascent 752, descent -200),
 * so the app pushes it down by 60% of the descent to centre it. Same
 * numbers, same nudge — without it every Designer label in the replica
 * rides a pixel or two high. */
const DESIGNER_DESCENT_RATIO = (200 / 952) * 0.6;
const designerNudge = (size: number) => size * DESIGNER_DESCENT_RATIO;

/** vbdata stores hex with or without the leading '#'. */
function parseHex(c: string | null | undefined): [number, number, number] | null {
  if (!c) return null;
  const v = String(c).replace('#', '').trim();
  if (!/^[0-9a-fA-F]{6}$/.test(v)) return null;
  const n = parseInt(v, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
const FALLBACK: [number, number, number] = [0x3c, 0x43, 0x46];
const rgb = (c: [number, number, number]) => `rgb(${c[0]},${c[1]},${c[2]})`;
const rgba = (c: [number, number, number], a: number) =>
  `rgba(${c[0]},${c[1]},${c[2]},${a})`;

const luminance = (c: [number, number, number]) => {
  const f = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]);
};

/** TeamColors.visibleFill — lift a colour that is too dark to read as a
 *  colour at all (Omaha #000000, UConn #000E2F) to HSL lightness 0.20. */
function visibleFill(c: [number, number, number]): [number, number, number] {
  if (luminance(c) >= 0.02) return c;
  const [h, s] = toHsl(c);
  return fromHsl(h, s, 0.2);
}

/** TeamColors.indicatorFill — the set dots. A near-neutral colour that is
 *  genuinely close to the glass grey would read as an EMPTY dot, so those
 *  and only those go white; a saturated dark colour keeps its identity. */
function indicatorFill(c: [number, number, number]): [number, number, number] {
  const fill = visibleFill(c);
  if (toHsl(fill)[1] >= 0.15) return fill;
  const d = Math.hypot(fill[0] - 0x3c, fill[1] - 0x43, fill[2] - 0x46) /
    Math.sqrt(3 * 255 * 255);
  return d < 0.12 ? [255, 255, 255] : fill;
}

function toHsl(c: [number, number, number]): [number, number, number] {
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
function fromHsl(h: number, s: number, l: number): [number, number, number] {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  const t: number[][] = [[c, x, 0], [x, c, 0], [0, c, x], [0, x, c], [x, 0, c], [c, 0, x]];
  const [r, g, b] = t[Math.floor(h / 60) % 6];
  return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
}

/** PreGameSplit._colorsAreSimilar / effectiveAwayPrimary — when the two
 *  primaries are nearly the same colour the away side swaps to its
 *  secondary, so a matchup never paints one wash twice. */
function effectiveAwayPrimary(awayPri?: string, awaySec?: string, homePri?: string) {
  const a = parseHex(awayPri), b = parseHex(homePri), s = parseHex(awaySec);
  if (!a || !b || !s) return awayPri;
  const d = Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]) / Math.sqrt(3 * 255 * 255);
  return d < 0.15 ? awaySec : awayPri;
}

/* _PosterGroundPainter's two washes, as CSS angles.
 *
 * Flutter's Alignment.topLeft -> bottomRight gradient projects onto the
 * box's actual DIAGONAL. CSS's `to bottom right` does not — it uses the
 * magic-corner rule, which puts the other two corners at 50% and reads
 * visibly differently on a box this wide. Naming the diagonal's own angle
 * gets Flutter's exact axis: with direction (sin, -cos) parallel to (w, h),
 * CSS's own gradient-line length works out to the diagonal, so the corners
 * land on 0 and 1 the way Flutter puts them. */
const DIAG_DEG = (Math.atan2(W, -H) * 180) / Math.PI;
const wash = (c: [number, number, number], fromTopLeft: boolean) =>
  `linear-gradient(${(fromTopLeft ? DIAG_DEG : DIAG_DEG + 180).toFixed(2)}deg, ` +
  `${rgba(c, 0.42)} 0%, ${rgba(c, 0.14)} 42%, ${rgba(c, 0)} 85%)`;

/** foldForDisplayFont — Designer has no diacritics. */
const fold = (s: string) =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

/** _MarqueeName._lines — one word stays one line; anything longer splits
 *  into two lines balanced by character count. */
function marqueeLines(name: string): string[] {
  const words = fold(name).trim().toUpperCase().split(/\s+/).filter(Boolean);
  if (words.length <= 1) return words;
  let best = 1, bestDiff = Infinity;
  for (let i = 1; i < words.length; i++) {
    const d = Math.abs(
      words.slice(0, i).join(' ').length - words.slice(i).join(' ').length);
    if (d < bestDiff) { bestDiff = d; best = i; }
  }
  return [words.slice(0, best).join(' '), words.slice(best).join(' ')];
}

/** A set is decided at 25 (15 in the fifth) with a two-point lead. */
const setFinished = (i: number, a: number, h: number) =>
  (a >= (i === 4 ? 15 : 25) || h >= (i === 4 ? 15 : 25)) && Math.abs(a - h) >= 2;

// ── satori element helpers ────────────────────────────────────────────
const el = (style: Record<string, unknown>, children?: unknown): any => ({
  type: 'div',
  props: { style: { display: 'flex', ...style }, children },
});
const text = (children: string, style: Record<string, unknown>): any => ({
  type: 'div',
  props: { style: { display: 'flex', ...style }, children },
});

/** A Designer label: folded, uppercased, and nudged down by the same
 *  optical descent DesignerText applies in the app. */
const designer = (s: string, size: number, color: string, extra = {}) =>
  text(fold(s), {
    fontFamily: 'Designer',
    fontSize: size,
    lineHeight: 1,
    color,
    paddingTop: designerNudge(size),
    ...extra,
  });

export const GET: APIRoute = async (ctx) => {
  try {
    return await render(ctx);
  } catch (e: any) {
    // The message only, never the stack: this endpoint is public.
    return new Response(`render failed: ${e?.message ?? 'unknown'}`, {
      status: 500,
      headers: { 'Content-Type': 'text/plain' },
    });
  }
};

const render: APIRoute = async ({ params, url }) => {
  const id = (params.id ?? '').replace(/\.png$/, '');
  const asked = Number.parseInt(url.searchParams.get('w') ?? '', 10);
  const outWidth = Number.isFinite(asked)
    ? Math.min(OUT_MAX, Math.max(OUT_MIN, asked))
    : OUT_DEFAULT;
  const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    db: { schema: 'vbdata' },
  });

  const { data: game } = await sb
    .from('games')
    .select(
      'game_id, date, game_status, season, home_uuid, away_uuid, ' +
        'home_sets_won, away_sets_won, home_set_scores, away_set_scores, ' +
        'home:teams!games_home_uuid_fkey(team_id,name,location,abbreviation,league,primary_color,secondary_color),' +
        'away:teams!games_away_uuid_fkey(team_id,name,location,abbreviation,league,primary_color,secondary_color)'
    )
    .eq('game_id', id)
    .maybeSingle();

  if (!game) return new Response('Game not found', { status: 404 });

  const home: any = game.home;
  const away: any = game.away;
  const season = String(game.season ?? '');
  const kickoff = game.date ? new Date(String(game.date)) : null;

  /* The records under the names, and the AVCA ranks above them. Both are
   * separate reads the drawer already has in hand when it builds the
   * header, so they are fetched here rather than left off — a header
   * missing its ranks is not the header. */
  const [{ data: results }, { data: polls }] = await Promise.all([
    sb
      .from('team_results')
      .select('team_uuid, wins, losses')
      .eq('event_season', season)
      .in('team_uuid', [game.home_uuid, game.away_uuid].filter(Boolean)),
    // Every dated poll of this season, newest first. AvcaRankService takes
    // the first one released STRICTLY BEFORE the game day — a poll that
    // dropped the morning of the match does not re-rank that night's card.
    sb
      .from('avca_rankings')
      .select('published_at, rankings')
      .eq('season', season)
      .not('published_at', 'is', null)
      .order('published_at', { ascending: false }),
  ]);

  const recordOf = (teamId?: string) => {
    const r = (results ?? []).find((x: any) => x.team_uuid === teamId);
    return r && r.wins != null && r.losses != null
      ? `${r.wins}–${r.losses}`
      : null;
  };

  const gameDay = kickoff
    ? new Date(
        kickoff.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' })
      )
    : null;
  const activePoll = gameDay
    ? (polls ?? []).find((p: any) => {
        const d = new Date(String(p.published_at) + 'T00:00:00');
        return d < new Date(gameDay.getFullYear(), gameDay.getMonth(), gameDay.getDate());
      })
    : null;
  const rankOf = (teamId?: string): number | null => {
    const list = (activePoll as any)?.rankings;
    if (!Array.isArray(list) || !teamId) return null;
    const hit = list.find((e: any) => e?.team_uuid === teamId);
    return hit?.rank != null ? Number(hit.rank) : null;
  };

  const awayFill = visibleFill(
    parseHex(effectiveAwayPrimary(
      away?.primary_color, away?.secondary_color, home?.primary_color)) ?? FALLBACK);
  const homeFill = visibleFill(parseHex(home?.primary_color) ?? FALLBACK);

  const status = String(game.game_status ?? '').toUpperCase();
  const isLive = status === 'LIVE';
  const isFinal = status === 'FINAL';
  const awayScores: number[] = (game.away_set_scores as number[]) ?? [];
  const homeScores: number[] = (game.home_set_scores as number[]) ?? [];
  const hasLiveScore = isLive && awayScores.length > 0 && homeScores.length > 0;

  const dateTimeStr = kickoff
    ? kickoff
        .toLocaleString('en-US', {
          month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
          timeZone: 'America/Los_Angeles',
        })
        .replace(/,\s(\d)/, ', $1')
    : '';

  // ── status row ────────────────────────────────────────────────────
  const pill = (label: string, bg: string) =>
    text(label, {
      backgroundColor: bg,
      color: '#000',
      fontSize: 12,
      fontWeight: 600,
      padding: '2px 8px',
      borderRadius: 16,
    });
  const dateText = text(dateTimeStr, {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
  });
  const statusRow = isLive
    ? [pill('LIVE', LEMON)]
    : isFinal
      ? [pill('FINAL', '#9E9E9E'), el({ width: 6 }), dateText]
      : [dateText];

  // ── the 5-dot set column ──────────────────────────────────────────
  /* The pill's row is the first undecided set with data, or — between
   * sets, when everything played is decided — the latest played one. */
  let liveIndex: number | null = null;
  if (hasLiveScore) {
    const played = Math.min(awayScores.length, homeScores.length);
    for (let i = 0; i < played && i < 5; i++) {
      if (!setFinished(i, awayScores[i], homeScores[i])) { liveIndex = i; break; }
    }
    if (liveIndex === null) liveIndex = Math.max(0, Math.min(4, played - 1));
  }

  const scoreCell = (v: number | null, dim: boolean) =>
    el({ width: 34, justifyContent: 'center' },
      v == null ? [] : [designer(String(v), 15, dim ? 'rgba(255,255,255,0.54)' : '#fff')]);

  /* Each row's height, because MainAxisAlignment.spaceEvenly divides what
   * is LEFT OVER and the rows are not all the same height. A row with no
   * data yet has no score text in it at all — SizedBox.shrink, not an empty
   * 34pt cell — so it is only as tall as its 12pt dot. Miss that and the
   * spacing of a live game (which always has empty rows below the pill)
   * comes out visibly tighter than the app's. */
  const rowHeights: number[] = [];
  const setRows = Array.from({ length: 5 }, (_, i) => {
    if (i === liveIndex) {
      rowHeights.push(PILL_H);
      const a = awayScores[i], h = homeScores[i];
      return el(
        {
          height: PILL_H,
          margin: '0 4px',
          padding: '0 16px',
          backgroundColor: GLASS15,
          borderRadius: PILL_H / 2,
          justifyContent: 'space-between',
          alignItems: 'center',
        },
        [
          designer(String(a), 20, '#fff'),
          text(`SET ${i + 1}`, {
            fontSize: 9,
            fontWeight: 800,
            letterSpacing: 1.2,
            color: 'rgba(255,255,255,0.7)',
          }),
          designer(String(h), 20, '#fff'),
        ]
      );
    }
    const hasData = i < awayScores.length && i < homeScores.length;
    rowHeights.push(hasData ? DOT_ROW_H : DOT_SIZE);
    const a = hasData ? awayScores[i] : null;
    const h = hasData ? homeScores[i] : null;
    const finished = hasData && setFinished(i, a!, h!);
    const awayWon = finished && a! > h!;
    const dot = finished
      ? rgb(indicatorFill(awayWon ? awayFill : homeFill))
      : 'rgba(255,255,255,0.15)';
    return el(
      { height: hasData ? DOT_ROW_H : DOT_SIZE, justifyContent: 'center', alignItems: 'center' },
      [
      scoreCell(a, finished && !awayWon),
      el({ width: 10 }),
      el({ width: DOT_SIZE, height: DOT_SIZE, borderRadius: DOT_SIZE / 2, backgroundColor: dot }),
      el({ width: 10 }),
      scoreCell(h, finished && awayWon),
    ]);
  });

  /* MainAxisAlignment.spaceEvenly, which satori's flexbox does not have:
   * six equal gaps around five rows. With every row's height known it is
   * the same thing written as a gap plus a matching top pad. */
  const evenGap = Math.max(
    0, (BODY_H - rowHeights.reduce((a, b) => a + b, 0)) / 6);

  // ── team columns ──────────────────────────────────────────────────
  const teamColumn = (team: any) => {
    const rank = rankOf(team?.team_id);
    const record = recordOf(team?.team_id);
    const isNcaa = team?.league === 'NCAA';
    const nameSrc: string =
      (isNcaa ? team?.name : team?.location) || team?.abbreviation || '';

    let mark: any[];
    if (isNcaa) {
      // The name IS the mark — Designer, no abbreviation, each line
      // FittedBox-scaled down to the 116pt column.
      const lines = marqueeLines(nameSrc || team?.abbreviation || '');
      const base = lines.length === 1 ? 34 : 26;
      mark = [
        el({ flexDirection: 'column', alignItems: 'center', paddingTop: designerNudge(base) },
          lines.map((line, i) => {
            const natural = designerWidth(line, base);
            const size = natural > 116 ? base * (116 / natural) : base;
            return el(
              { width: 116, justifyContent: 'center', marginTop: i > 0 ? 2 : 0 },
              [text(line, { fontFamily: 'Designer', fontSize: size, lineHeight: 1, color: '#fff' })]
            );
          })),
      ];
    } else {
      // Pro: location over the logo. The logo PNGs are app-bundle assets
      // and are not on the website, so the mark falls back to the
      // abbreviation in Designer at logo size — which is exactly what
      // TeamLogo draws for a team it has no art for.
      const loc = fold((team?.location ?? '').toUpperCase());
      const locSize = designerWidth(loc, 16) > 116 ? 16 * (116 / designerWidth(loc, 16)) : 16;
      const abbr = fold((team?.abbreviation ?? '').toUpperCase());
      const abSize = designerWidth(abbr, 80) > 80 ? 80 * (80 / designerWidth(abbr, 80)) : 80;
      mark = [
        el({ height: 18, width: 116, justifyContent: 'center', alignItems: 'center' },
          [designer(loc, locSize, '#fff')]),
        el({ height: 4 }),
        el({ width: 80, height: 80, justifyContent: 'center', alignItems: 'center' },
          [designer(abbr, abSize, rgb(parseHex(team?.primary_color) ?? [255, 255, 255]))]),
      ];
    }

    return el(
      {
        width: COL_W,
        height: BODY_H,
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      },
      [
        // The rank slot is always reserved, so the two sides' names stay
        // level when only one team is ranked.
        el({ height: 14, alignItems: 'center' },
          rank != null
            ? [text(`#${rank}`, { fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.7)' })]
            : []),
        el({ height: 2 }),
        ...mark,
        el({ height: 4 }),
        el({ height: 16, alignItems: 'center' },
          record ? [designer(record, 13, 'rgba(255,255,255,0.7)')] : []),
      ]
    );
  };

  // ── the tree ──────────────────────────────────────────────────────
  const layer = (style: Record<string, unknown>) =>
    el({ position: 'absolute', top: 0, left: 0, width: W, height: H, borderRadius: RADIUS, ...style });

  const tree = el(
    {
      position: 'relative',
      width: W,
      height: H,
      borderRadius: RADIUS,
      // Nothing paints outside the radius, so the PNG's corners carry real
      // alpha and the card sits on the forum's own background.
      overflow: 'hidden',
      backgroundColor: DARK,
      fontFamily: 'Axiforma',
    },
    [
      layer({ backgroundColor: 'rgba(255,255,255,0.04)' }),
      layer({ backgroundImage: wash(awayFill, true) }),
      layer({ backgroundImage: wash(homeFill, false) }),
      el(
        {
          position: 'relative',
          flexDirection: 'column',
          width: W,
          height: H,
          padding: `${PAD_T}px ${PAD_R}px ${PAD_B}px ${PAD_L}px`,
        },
        [
          el({ height: STATUS_H, alignItems: 'center', justifyContent: 'center' }, statusRow),
          el({ height: STATUS_GAP }),
          el({ alignItems: 'flex-start' }, [
            teamColumn(away),
            el({
              flexGrow: 1,
              height: BODY_H,
              flexDirection: 'column',
              paddingTop: evenGap,
              gap: evenGap,
            }, setRows),
            teamColumn(home),
          ]),
        ]
      ),
    ]
  );

  await ensureWasm();
  const svg = await satori(tree, { width: W, height: H, fonts: fontSet() });

  // The SVG is vector, so this is a clean scale-up of the 430pt layout
  // rather than a resample of a small bitmap.
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: outWidth } })
    .render()
    .asPng();

  /* THE POINT OF THE WHOLE ENDPOINT. A forum will happily serve one cached
   * render of this to every reader for the rest of the thread's life, which
   * would freeze the score at whatever it was when the first person opened
   * it. no-store is deliberately heavier than no-cache: some forum image
   * proxies honour only the strongest header they understand. */
  return new Response(png, {
    status: 200,
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=0, must-revalidate, no-store',
      'CDN-Cache-Control': 'no-store',
      'Vercel-CDN-Cache-Control': 'no-store',
    },
  });
};
