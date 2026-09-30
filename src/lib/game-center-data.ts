/* Build-time data for /game-center: ONE real, completed 2026 NCAA match,
 * rendered from public vbdata tables (games, teams, basic_statistics,
 * players, basic_play_by_plays). Read-only, anon key, never the fantasy
 * schema. The match is final, so the page can never go stale; the build
 * throws if any of it comes back empty, so a blank proof page never ships. */
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://api.playvoli.com';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhjaG9sa3JqcHV6YWhxdW1hamVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ0MDcwMzQsImV4cCI6MjA1OTk4MzAzNH0.RVhKzZkLxwwtbow3i3tUSVVnG_hMl-q0bwuvmqNuDq0';

/** Texas at Tennessee, 25 Sep 2026: a five-set SEC match between two
 *  VOLI Top 15 teams, with full box score and play-by-play. */
export const PROOF_GAME_ID = '20fdd2a2-d54c-48aa-a52d-596e04d6afae';

export interface TeamSide {
  name: string;
  abbr: string;
  conference: string | null;
  setsWon: number;
  setScores: number[];
}

export interface BoxLine {
  name: string;
  kills: number;
  errors: number;
  attempts: number;
  hitPct: string;
  assists: number;
  aces: number;
  blocks: number;
  digs: number;
}

export interface TeamBox {
  team: string;
  top: BoxLine[];
  totals: BoxLine;
  players: number;
}

export interface Rally {
  home: number;
  away: number;
  winner: 'home' | 'away';
  text: string;
}

export interface ProofMatch {
  gameId: string;
  dateLabel: string;
  isoDate: string;
  arena: string | null;
  home: TeamSide;
  away: TeamSide;
  winner: 'home' | 'away';
  box: { away: TeamBox; home: TeamBox };
  excerptSet: number;
  excerpt: Rally[];
  excerptSkipped: number;
  totalRallies: number;
  totalSubs: number;
  setsLogged: number;
}

const hit = (k: number, e: number, a: number) => {
  if (!a) return '.000';
  const v = (k - e) / a;
  const s = Math.abs(v).toFixed(3).replace(/^0/, '');
  return v < 0 ? `-${s}` : s;
};

export async function getProofMatch(): Promise<ProofMatch> {
  const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    db: { schema: 'vbdata' },
    auth: { persistSession: false },
  });

  const [{ data: game, error: gErr }, { data: stats, error: sErr }, { data: pbp, error: pErr }] =
    await Promise.all([
      sb
        .from('games')
        .select(
          'game_id, date, game_status, league, arena, home_sets_won, away_sets_won, home_set_scores, away_set_scores, ' +
            'home:teams!games_home_uuid_fkey(team_id,name,abbreviation,conference),' +
            'away:teams!games_away_uuid_fkey(team_id,name,abbreviation,conference)'
        )
        .eq('game_id', PROOF_GAME_ID)
        .maybeSingle(),
      sb
        .from('basic_statistics')
        .select('player_uuid, team_uuid, atk_kll, atk_err, atk_sum, ast_sum, srv_ace, blk_kll, dig_sum')
        .eq('game_uuid', PROOF_GAME_ID),
      sb.from('basic_play_by_plays').select('set, set_score, pbp_body').eq('game_uuid', PROOF_GAME_ID),
    ]);

  if (gErr || sErr || pErr) throw new Error(`game-center: query failed (${gErr?.message ?? sErr?.message ?? pErr?.message})`);
  if (!game) throw new Error('game-center: proof match not found');
  const g: any = game;
  if (String(g.game_status) !== 'final') throw new Error('game-center: proof match is not final');
  if (!stats?.length) throw new Error('game-center: proof match has no box score');
  if (!pbp?.length) throw new Error('game-center: proof match has no play-by-play');

  const ids = [...new Set(stats.map((r: any) => r.player_uuid).filter(Boolean))];
  const { data: players, error: plErr } = await sb
    .from('players')
    .select('player_id, first_name, last_name')
    .in('player_id', ids);
  if (plErr || !players?.length) throw new Error('game-center: player names missing');
  const nameOf = new Map(players.map((p: any) => [p.player_id, `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim()]));

  const boxFor = (teamId: string, teamName: string): TeamBox => {
    const rows = stats.filter((r: any) => r.team_uuid === teamId);
    if (!rows.length) throw new Error(`game-center: no box score rows for ${teamName}`);
    const lines: BoxLine[] = rows.map((r: any) => {
      const k = r.atk_kll ?? 0, e = r.atk_err ?? 0, a = r.atk_sum ?? 0;
      return {
        name: nameOf.get(r.player_uuid) || 'Unknown',
        kills: k,
        errors: e,
        attempts: a,
        hitPct: hit(k, e, a),
        assists: r.ast_sum ?? 0,
        aces: r.srv_ace ?? 0,
        blocks: Number(r.blk_kll ?? 0),
        digs: r.dig_sum ?? 0,
      };
    });
    const sum = (f: keyof BoxLine) => lines.reduce((t, l) => t + (l[f] as number), 0);
    const totals: BoxLine = {
      name: 'Team',
      kills: sum('kills'),
      errors: sum('errors'),
      attempts: sum('attempts'),
      hitPct: hit(sum('kills'), sum('errors'), sum('attempts')),
      assists: sum('assists'),
      aces: sum('aces'),
      blocks: Math.round(sum('blocks') * 10) / 10,
      digs: sum('digs'),
    };
    // Top five by involvement: kills first, then assists, then digs.
    const top = [...lines]
      .sort((x, y) => y.kills - x.kills || y.assists - x.assists || y.digs - x.digs)
      .slice(0, 5);
    return { team: teamName, top, totals, players: lines.length };
  };

  const home: TeamSide = {
    name: g.home.name,
    abbr: g.home.abbreviation,
    conference: g.home.conference,
    setsWon: g.home_sets_won,
    setScores: g.home_set_scores ?? [],
  };
  const away: TeamSide = {
    name: g.away.name,
    abbr: g.away.abbreviation,
    conference: g.away.conference,
    setsWon: g.away_sets_won,
    setScores: g.away_set_scores ?? [],
  };
  if (!home.setScores.length) throw new Error('game-center: set scores missing');

  const sets = [...pbp].sort((a: any, b: any) => a.set - b.set);
  let totalRallies = 0;
  let totalSubs = 0;
  for (const s of sets as any[]) {
    totalRallies += (s.pbp_body?.rallies ?? []).length;
    totalSubs += (s.pbp_body?.subs ?? []).length;
  }

  // The excerpt: the closing stretch of the deciding (last) set.
  const last: any = sets[sets.length - 1];
  const rallies: any[] = last.pbp_body?.rallies ?? [];
  if (!rallies.length) throw new Error('game-center: deciding set has no rallies');
  const take = 15;
  const excerpt: Rally[] = rallies.slice(-take).map((r) => ({
    home: r.score?.[0] ?? 0,
    away: r.score?.[1] ?? 0,
    winner: r.winner === 'home' ? 'home' : 'away',
    text: String(r.text ?? '').trim(),
  }));

  const d = new Date(String(g.date));
  const dateLabel = d.toLocaleDateString('en-US', {
    timeZone: 'America/New_York',
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return {
    gameId: g.game_id,
    dateLabel,
    isoDate: d.toISOString(),
    arena: g.arena ?? null,
    home,
    away,
    winner: home.setsWon > away.setsWon ? 'home' : 'away',
    box: { away: boxFor(g.away.team_id, away.name), home: boxFor(g.home.team_id, home.name) },
    excerptSet: last.set,
    excerpt,
    excerptSkipped: Math.max(0, rallies.length - take),
    totalRallies,
    totalSubs,
    setsLogged: sets.length,
  };
}
