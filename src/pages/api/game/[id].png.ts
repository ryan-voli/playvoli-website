import type { APIRoute } from 'astro';
import satori from 'satori';
import { Resvg, initWasm } from '@resvg/resvg-wasm';
import { createClient } from '@supabase/supabase-js';

/* /api/game/<game_id>.png — the match card, rendered fresh on every request.
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

/* One init per process, not per request. initWasm throws if called twice, so
 * the promise is the guard — every request awaits the same one. */
let wasmReady: Promise<void> | null = null;
function ensureWasm(origin: string): Promise<void> {
  wasmReady ??= fetch(`${origin}/resvg.wasm`)
    .then((r) => r.arrayBuffer())
    .then((buf) => initWasm(buf));
  return wasmReady;
}

const SUPABASE_URL = 'https://api.playvoli.com';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhjaG9sa3JqcHV6YWhxdW1hamVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ0MDcwMzQsImV4cCI6MjA1OTk4MzAzNH0.RVhKzZkLxwwtbow3i3tUSVVnG_hMl-q0bwuvmqNuDq0';

const W = 900;
const H = 880;

const DARK = '#131819';
const CARD = 'rgba(255,255,255,0.055)';

/** vbdata stores hex with or without the leading '#'. */
function hex(c: string | null | undefined, fallback: string): string {
  if (!c) return fallback;
  const v = String(c).replace('#', '').trim();
  return /^[0-9a-fA-F]{6}$/.test(v) ? `#${v}` : fallback;
}

/** Satori has no CustomPainter, so the app's diagonal wash is approximated
 *  with two stacked linear gradients over a dark ground — same idea, same
 *  reach (it dies before midfield so neither colour overpowers the other). */
function splitBackground(away: string, home: string): string {
  return (
    `linear-gradient(105deg, ${away}E0 0%, ${away}4D 30%, ${away}00 62%),` +
    `linear-gradient(285deg, ${home}E0 0%, ${home}4D 30%, ${home}00 62%),` +
    `linear-gradient(0deg, ${DARK}, ${DARK})`
  );
}

const el = (type: string, props: Record<string, unknown>): any => ({
  type,
  props,
});

const text = (children: string, style: Record<string, unknown>) =>
  el('div', { style, children });

/** A player's line, as separate parts.
 *
 * Returned as a LIST, not a joined string. Satori collapses runs of
 * whitespace exactly as HTML does, so padding a separator does nothing and
 * the stats run together; and the app's middle dot is not in Axiforma, so it
 * silently fell back to a full stop. Real flex children with a gap sidestep
 * both.
 */
function statParts(r: any): string[] {
  const parts: string[] = [];
  if (r.atk_kll != null) parts.push(`${r.atk_kll} K`);
  if (r.atk_sum > 0 && r.atk_eff != null) {
    parts.push(Number(r.atk_eff).toFixed(3).replace(/^0/, ''));
  }
  if (r.dig_sum > 0) parts.push(`${r.dig_sum} DIG`);
  if (Number(r.blk_kll) > 0) parts.push(`${Number(r.blk_kll)} BLK`);
  if (r.srv_ace > 0) parts.push(`${r.srv_ace} ACE`);
  if (r.ast_sum >= 10) parts.push(`${r.ast_sum} AST`);
  return parts;
}

export const GET: APIRoute = async (ctx) => {
  // TEMPORARY. Vercel's CLI is not authenticated here, so a 500 from this
  // route is otherwise a blank page with no way to see why. Surfacing the
  // message is safe while nothing links to this endpoint, and comes out the
  // moment the cause is known.
  try {
    return await render(ctx);
  } catch (e: any) {
    return new Response(
      `render failed: ${e?.message ?? e}\n\n${e?.stack ?? ''}`,
      { status: 500, headers: { 'Content-Type': 'text/plain' } }
    );
  }
};

const render: APIRoute = async ({ params, request }) => {
  const id = (params.id ?? '').replace(/\.png$/, '');
  const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    db: { schema: 'vbdata' },
  });

  const { data: game } = await sb
    .from('games')
    .select(
      'game_id, date, game_status, home_sets_won, away_sets_won, ' +
        'home_set_scores, away_set_scores, ' +
        'home:teams!games_home_uuid_fkey(team_id,name,abbreviation,primary_color),' +
        'away:teams!games_away_uuid_fkey(team_id,name,abbreviation,primary_color)'
    )
    .eq('game_id', id)
    .maybeSingle();

  if (!game) return new Response('Game not found', { status: 404 });

  const home: any = game.home;
  const away: any = game.away;

  const { data: stats } = await sb
    .from('basic_statistics')
    .select(
      'player_uuid, team_uuid, sets_played, atk_kll, atk_err, atk_sum, ' +
        'atk_eff, dig_sum, blk_kll, srv_ace, ast_sum, ' +
        'player:players!inner(first_name,last_name)'
    )
    .eq('game_uuid', id)
    .order('atk_kll', { ascending: false, nullsFirst: false })
    .limit(60);

  // Four lines, not the whole box. A share is an argument about what
  // mattered; a full box score is a screenshot of a table.
  const leaders = (stats ?? [])
    .filter((r: any) => (r.atk_kll ?? 0) > 0 || (r.dig_sum ?? 0) >= 10)
    .slice(0, 4);

  const awayCol = hex(away?.primary_color, '#3C4346');
  const homeCol = hex(home?.primary_color, '#3C4346');
  const hs = game.home_sets_won ?? 0;
  const as = game.away_sets_won ?? 0;
  const live = String(game.game_status) === 'live';
  const setPairs: string[] = [];
  const hss: number[] = (game.home_set_scores as number[]) ?? [];
  const ass: number[] = (game.away_set_scores as number[]) ?? [];
  for (let i = 0; i < Math.max(hss.length, ass.length); i++) {
    if (ass[i] == null || hss[i] == null) continue;
    setPairs.push(`${ass[i]}–${hss[i]}`);
  }

  const side = (ab: string, name: string, sets: number, isHome: boolean) => {
    const won = sets > (isHome ? as : hs);
    const block = el('div', {
      style: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: isHome ? 'flex-end' : 'flex-start',
      },
      children: [
        text(ab, {
          fontFamily: 'Designer',
          fontSize: 58,
          color: '#fff',
          lineHeight: 1,
        }),
        text(name, {
          fontSize: 19,
          color: 'rgba(255,255,255,0.6)',
          marginTop: 6,
          fontWeight: 600,
        }),
      ],
    });
    const score = text(String(sets), {
      fontSize: 68,
      fontWeight: 800,
      lineHeight: 1,
      color: won ? '#fff' : 'rgba(255,255,255,0.45)',
    });
    return el('div', {
      style: {
        display: 'flex',
        flex: 1,
        alignItems: 'center',
        gap: 20,
        justifyContent: isHome ? 'flex-end' : 'flex-start',
      },
      children: isHome ? [score, block] : [block, score],
    });
  };

  const chip = (label: string, accent?: string) =>
    text(label, {
      display: 'flex',
      backgroundColor: accent ?? 'rgba(0,0,0,0.30)',
      color: accent ? '#131819' : '#fff',
      fontSize: 17,
      fontWeight: 800,
      letterSpacing: 1.6,
      padding: '5px 15px',
      borderRadius: 15,
    });

  const tree = el('div', {
    style: {
      display: 'flex',
      flexDirection: 'column',
      width: W,
      height: H,
      backgroundColor: DARK,
      fontFamily: 'Inter',
    },
    children: [
      // ── scoreboard ────────────────────────────────────────────────
      el('div', {
        style: {
          display: 'flex',
          flexDirection: 'column',
          height: 340,
          padding: '28px 38px 24px 38px',
          backgroundImage: splitBackground(awayCol, homeCol),
        },
        children: [
          el('div', {
            style: { display: 'flex', justifyContent: 'center', gap: 12 },
            children: [
              chip(live ? 'LIVE' : 'FINAL', live ? '#F0FF1E' : undefined),
              ...(setPairs.length ? [chip(`${setPairs.length} SETS`)] : []),
            ],
          }),
          el('div', {
            style: {
              display: 'flex',
              flex: 1,
              alignItems: 'center',
              marginTop: 4,
            },
            children: [
              side(away?.abbreviation ?? '—', away?.name ?? '', as, false),
              text('–', {
                fontSize: 40,
                color: 'rgba(255,255,255,0.35)',
                padding: '0 10px',
              }),
              side(home?.abbreviation ?? '—', home?.name ?? '', hs, true),
            ],
          }),
          text(setPairs.join('    '), {
            display: 'flex',
            justifyContent: 'center',
            color: 'rgba(255,255,255,0.72)',
            fontSize: 22,
            fontWeight: 600,
            letterSpacing: 0.6,
          }),
        ],
      }),

      // ── leaders ───────────────────────────────────────────────────
      el('div', {
        style: {
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          padding: '30px 38px 0 38px',
        },
        children: [
          text('LEADERS', {
            color: 'rgba(255,255,255,0.38)',
            fontSize: 18,
            fontWeight: 800,
            letterSpacing: 2.6,
            marginBottom: 18,
          }),
          ...leaders.map((r: any) => {
            const isHome = r.team_uuid === home?.team_id;
            const ab = isHome ? home?.abbreviation : away?.abbreviation;
            const p: any = r.player;
            return el('div', {
              style: {
                display: 'flex',
                alignItems: 'center',
                backgroundColor: CARD,
                borderRadius: 22,
                padding: '17px 20px',
                marginBottom: 13,
              },
              children: [
                el('div', {
                  style: {
                    display: 'flex',
                    width: 5,
                    height: 50,
                    borderRadius: 3,
                    backgroundColor: isHome ? homeCol : awayCol,
                    marginRight: 18,
                  },
                }),
                el('div', {
                  style: { display: 'flex', flexDirection: 'column' },
                  children: [
                    el('div', {
                      style: { display: 'flex', alignItems: 'center', gap: 11 },
                      children: [
                        text(`${p?.first_name ?? ''} ${p?.last_name ?? ''}`, {
                          color: '#fff',
                          fontSize: 25,
                          fontWeight: 700,
                        }),
                        text(ab ?? '', {
                          color: 'rgba(255,255,255,0.35)',
                          fontSize: 17,
                          fontWeight: 800,
                          letterSpacing: 1,
                        }),
                      ],
                    }),
                    el('div', {
                      style: { display: 'flex', gap: 20, marginTop: 5 },
                      children: statParts(r).map((part) =>
                        text(part, {
                          color: 'rgba(255,255,255,0.72)',
                          fontSize: 21,
                          fontWeight: 600,
                        })
                      ),
                    }),
                  ],
                }),
              ],
            });
          }),
        ],
      }),

      // ── footer ────────────────────────────────────────────────────
      el('div', {
        style: {
          display: 'flex',
          justifyContent: 'space-between',
          padding: '0 38px 30px 38px',
        },
        children: [
          text('playvoli.com', {
            color: 'rgba(255,255,255,0.35)',
            fontSize: 19,
            fontWeight: 600,
          }),
          text(
            new Date(String(game.date)).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              timeZone: 'America/Los_Angeles',
            }),
            {
              color: 'rgba(255,255,255,0.35)',
              fontSize: 19,
              fontWeight: 600,
            }
          ),
        ],
      }),
    ],
  });

  // Fonts come off our own origin so this works identically on localhost,
  // a preview deployment and production without a path to configure.
  const origin = new URL(request.url).origin;
  // Axiforma, not Inter: satori reads ttf/otf/woff and the site's Inter is
  // woff2, which it cannot parse. Book and Black are the two real weights we
  // have, so the scale is mapped onto them rather than faked — asking for a
  // weight with no file behind it is how every label came out light.
  const [designer, book, black] = await Promise.all([
    fetch(`${origin}/fonts/Designer.otf`).then((r) => r.arrayBuffer()),
    fetch(`${origin}/fonts/Axiforma%20Book.otf`).then((r) => r.arrayBuffer()),
    fetch(`${origin}/fonts/Axiforma%20Black.otf`).then((r) => r.arrayBuffer()),
    ensureWasm(origin),
  ]);

  const svg = await satori(tree, {
    width: W,
    height: H,
    fonts: [
      { name: 'Designer', data: designer, weight: 400, style: 'normal' },
      { name: 'Inter', data: book, weight: 400, style: 'normal' },
      { name: 'Inter', data: book, weight: 600, style: 'normal' },
      { name: 'Inter', data: black, weight: 700, style: 'normal' },
      { name: 'Inter', data: black, weight: 800, style: 'normal' },
    ],
  });

  const png = new Resvg(svg, {
    fitTo: { mode: 'width', value: W },
  })
    .render()
    .asPng();

  // THE POINT OF THE WHOLE ENDPOINT. A forum will happily serve one cached
  // render of this to every reader for the rest of the thread's life, which
  // would freeze the score at whatever it was when the first person opened
  // it. no-store is deliberately heavier than no-cache: some forum image
  // proxies honour only the strongest header they understand.
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
