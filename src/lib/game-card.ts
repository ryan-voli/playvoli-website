import type { APIRoute } from 'astro';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-wasm';
import { createClient } from '@supabase/supabase-js';
import {
  LEMON, GLASS15,
  AX_CAP, axAscent, axWidth, truncate, capLabel,
  designer, designerNudge, designerWidth,
  el, text, fold, encodeImage, ensureWasm, fontSet, onGlass,
  FALLBACK, parseHex, rgb, rgba, visibleFill, indicatorFill,
  STATUS_PILL_H, STATUS_DATE_H,
} from './card-kit';
import { h2hSection, h2hHeight, type Totals } from './h2h-section';

/* The game card: the game drawer's header, rendered fresh on every request.
 *
 * Served at /api/card/game/<game_id>.png. The `card` segment is the API's
 * kind, not decoration — data, embeds and cards will all address the same
 * uuids, and they differ in everything that matters about a response: content
 * type, cache policy, and how much work a request costs. Putting the kind
 * first keeps those together and lets each kind grow its own resources
 * (player, team) underneath it.
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
const CARD_H = PAD_T + STATUS_H + STATUS_GAP + BODY_H + PAD_B;

/* A dot row is as tall as its Designer score cell: fontSize 15 on a
 * lineHeight-1 box, plus the optical nudge. The dots (12) are shorter, so
 * they do not set it. */
const DOT_SIZE = 12;      // the winner dot
const DOT_ROW_H = 15 + 15 * (200 / 952) * 0.6;
const PILL_H = 34;        // _livePill at collapse 0

/** PreGameSplit._colorsAreSimilar / effectiveAwayPrimary — when the two
 *  primaries are nearly the same colour the away side swaps to its
 *  secondary, so a matchup never paints one wash twice. */
function effectiveAwayPrimary(awayPri?: string, awaySec?: string, homePri?: string) {
  const a = parseHex(awayPri), b = parseHex(homePri), s = parseHex(awaySec);
  if (!a || !b || !s) return awayPri;
  const d = Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]) / Math.sqrt(3 * 255 * 255);
  return d < 0.15 ? awaySec : awayPri;
}

/** Companion to effectiveAwayPrimary: what the away team's SECONDARY should
 *  be treated as, which is its original primary when a swap happened. */
function effectiveAwaySecondary(awayPri?: string, awaySec?: string, homePri?: string) {
  const a = parseHex(awayPri), b = parseHex(homePri), sec = parseHex(awaySec);
  if (!a || !b || !sec) return awaySec;
  const d = Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]) / Math.sqrt(3 * 255 * 255);
  return d < 0.15 ? awayPri : awaySec;
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
const DIAG_DEG = (Math.atan2(W, -CARD_H) * 180) / Math.PI;
const wash = (c: [number, number, number], fromTopLeft: boolean) =>
  `linear-gradient(${(fromTopLeft ? DIAG_DEG : DIAG_DEG + 180).toFixed(2)}deg, ` +
  `${rgba(c, 0.42)} 0%, ${rgba(c, 0.14)} 42%, ${rgba(c, 0)} 85%)`;

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

export type CardFormat = 'png' | 'webp';

/** The route handler, for whichever extension asked for it. */
export const gameCard = (format: CardFormat): APIRoute => async (ctx) => {
  try {
    return await render(ctx, format);
  } catch (e: any) {
    // The message only, never the stack: this endpoint is public.
    return new Response(`render failed: ${e?.message ?? 'unknown'}`, {
      status: 500,
      headers: { 'Content-Type': 'text/plain' },
    });
  }
};

const render = async (
  { params, url }: Parameters<APIRoute>[0],
  format: CardFormat
): Promise<Response> => {
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
      'game_id, date, game_status, season, arena, home_uuid, away_uuid, ' +
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
  const [{ data: results }, { data: polls }, { data: statRows }] = await Promise.all([
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
    /* Per-player rows, summed on this side: PostgREST has no GROUP BY, and
     * the app sums them on the client too (_NcaaPerformanceWrapper), so this
     * is the same arithmetic over the same rows rather than a second opinion
     * computed a different way. */
    sb
      .from('basic_statistics')
      .select(
        'team_uuid, srv_ace, srv_err, rec_sum, rec_err, ast_sum, ' +
          'set_err, atk_kll, atk_err, atk_sum, blk_kll, blk_err, dig_sum'
      )
      .eq('game_uuid', id),
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

  /* Numeric columns (blk_kll among them) can arrive as strings — coerce
   * rather than drop them, same as the app does on realtime payloads. */
  const STAT_KEYS = [
    'srv_ace', 'srv_err', 'rec_sum', 'rec_err', 'ast_sum', 'set_err',
    'atk_kll', 'atk_err', 'atk_sum', 'blk_kll', 'blk_err', 'dig_sum',
  ];
  const awayTotals: Totals = {};
  const homeTotals: Totals = {};
  for (const row of (statRows ?? []) as any[]) {
    const into = row.team_uuid === game.away_uuid ? awayTotals : homeTotals;
    for (const k of STAT_KEYS) {
      const v = row[k];
      const n = typeof v === 'number' ? v : Number.parseFloat(String(v ?? '')) || 0;
      into[k] = (into[k] ?? 0) + n;
    }
  }
  const hasStats =
    Object.keys(awayTotals).length > 0 || Object.keys(homeTotals).length > 0;

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
    el(
      {
        height: STATUS_PILL_H,
        paddingLeft: 8,
        paddingRight: 8,
        backgroundColor: bg,
        borderRadius: 16,
      },
      [capLabel(label, { size: 12, weight: 600, box: STATUS_PILL_H, color: '#000' })]
    );
  // Centred in the status row the same way the app's Row centres it: its own
  // 19pt line box, centred in the 36pt row.
  const dateText = capLabel(dateTimeStr, {
    size: 13, box: STATUS_DATE_H, color: 'rgba(255,255,255,0.7)',
  });
  /* The one addition to the header, and the reason it is allowed: the share
   * has no action menu and no close button, so the status row has most of
   * its width free where the app's has none. A rule and the arena is what
   * fits there without changing anything else — and in a forum thread, where
   * the game is not on screen anywhere else, WHERE it is being played is the
   * fact a reader is most likely to be missing.
   *
   * A drawn 1pt rule rather than a pipe glyph: the pipe's height and its
   * position on the line are the font's business, and it would not sit at
   * the same place as the app's date text next to it. */
  const separator = el({
    width: 1,
    height: 13,
    marginLeft: 9,
    marginRight: 9,
    backgroundColor: 'rgba(255,255,255,0.22)',
    flexShrink: 0,
  });
  // Dimmer than the date, and it shrinks first: the arena is the last thing
  // in the row and the only thing there that can be cut without losing the
  // score, the state or the day.
  const arena = String((game as any).arena ?? '').trim();
  // What the status group in front of it already costs, measured rather than
  // guessed: the pill is 8pt of padding either side of its label, and the
  // rule carries 9pt of margin on each side.
  const statusW = isLive
    ? 16 + axWidth('LIVE', 12)
    : isFinal
      ? 16 + axWidth('FINAL', 12) + 6 + axWidth(dateTimeStr, 13)
      : axWidth(dateTimeStr, 13);
  const arenaLabel = arena
    ? truncate(arena, 13, W - PAD_L - PAD_R - statusW - 19 - 24)
    : '';
  const arenaText = arenaLabel
    ? [separator, capLabel(arenaLabel, {
        size: 13, box: STATUS_DATE_H, color: 'rgba(255,255,255,0.45)',
      })]
    : [];

  const statusRow = [
    ...(isLive
      ? [pill('LIVE', LEMON)]
      : isFinal
        ? [pill('FINAL', '#9E9E9E'), el({ width: 6, flexShrink: 0 }), dateText]
        : [dateText]),
    ...arenaText,
  ];

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
          capLabel(`SET ${i + 1}`, {
            size: 9, weight: 800, letterSpacing: 1.2,
            box: PILL_H, color: 'rgba(255,255,255,0.7)',
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
        rank != null
            ? capLabel(`#${rank}`, {
                size: 12, weight: 700, box: 14, color: 'rgba(255,255,255,0.7)',
              })
            : el({ height: 14 }),
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
    el({ position: 'absolute', top: 0, left: 0, width: W, height: CARD_H, borderRadius: RADIUS, ...style });

  /* The section hangs UNDER the card on the forum's own background, so it is
   * only there when it has something to say. A game with no box score yet
   * gets the card and nothing else, rather than the app's "no team stats"
   * placeholder — a share is not a screen somebody navigated to on purpose. */
  const showH2H = hasStats && away?.league === 'NCAA' && home?.league === 'NCAA';
  const totalH = CARD_H + (showH2H ? h2hHeight() : 0);

  const card = el(
    {
      position: 'relative',
      width: W,
      height: CARD_H,
      borderRadius: RADIUS,
      // Nothing paints outside the radius, so the PNG's corners carry real
      // alpha and the card sits on the forum's own background.
      overflow: 'hidden',
      /* NO opaque base. _PosterGroundPainter lays down white 4% and the two
       * washes and nothing else — the dark under a header in the app is the
       * DRAWER, not the header. Painting one here made the card the only
       * opaque thing in the image, so it sat as a solid slab above stat bands
       * the board showed through. The card is translucent for the same reason
       * they are, and by the same rule: the only ink is the ink the painter
       * actually puts down. */
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
          height: CARD_H,
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

  const tree = el(
    // The family belongs on the ROOT, not on the card: the section below it
    // inherits from here, and without it satori falls back to the first font
    // registered — which is Designer, and every label came out in it.
    { flexDirection: 'column', width: W, height: totalH, fontFamily: 'Axiforma' },
    showH2H
      ? [
          card,
          // The same 8pt gutters as the card's own padding, so the bands line
          // up with the team columns above them, not with the card's edge.
          el({ paddingLeft: PAD_L, paddingRight: PAD_R }, [
            h2hSection({
              width: W - PAD_L - PAD_R,
              away: awayTotals,
              home: homeTotals,
              awayFill,
              homeFill,
              awayInk: onGlass(awayFill, effectiveAwaySecondary(
                away?.primary_color, away?.secondary_color, home?.primary_color)),
              homeInk: onGlass(homeFill, home?.secondary_color),
              awayAbbr: away?.abbreviation ?? 'AWAY',
              homeAbbr: home?.abbreviation ?? 'HOME',
              stamp: new Date().toLocaleString('en-US', {
                month: 'short', day: 'numeric', hour: 'numeric',
                minute: '2-digit', timeZone: 'America/Los_Angeles',
              }) + ' PT',
            }),
          ]),
        ]
      : [card]
  );

  await ensureWasm();
  const svg = await satori(tree, { width: W, height: totalH, fonts: fontSet() });

  // The SVG is vector, so this is a clean scale-up of the 430pt layout
  // rather than a resample of a small bitmap.
  const rendered = new Resvg(svg, { fitTo: { mode: 'width', value: outWidth } })
    .render();

  const { body, type } = await encodeImage(rendered, format);

  /* THE POINT OF THE WHOLE ENDPOINT. A forum will happily serve one cached
   * render of this to every reader for the rest of the thread's life, which
   * would freeze the score at whatever it was when the first person opened
   * it. no-store is deliberately heavier than no-cache: some forum image
   * proxies honour only the strongest header they understand. */
  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': type,
      'Cache-Control': 'public, max-age=0, must-revalidate, no-store',
      'CDN-Cache-Control': 'no-store',
      'Vercel-CDN-Cache-Control': 'no-store',
    },
  });
};
