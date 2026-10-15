// The current published VOLI Top 100, fetched on each request for /rankings
// (owner, 15 Oct 2026: "it should just pull the most current published
// ranking when it loads"). Read-only, anon key, the same client the share
// cards use.
//
// Reads vbdata.voli_rankings directly rather than the voli_current_ranking
// view: the view picks its week by season label (ORDER BY season DESC), which
// would switch to a pro season the day pro VOLI rankings are stored in the
// same table. Here the NCAA list is the newest published NCAA week, by date.
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://api.playvoli.com';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhjaG9sa3JqcHV6YWhxdW1hamVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ0MDcwMzQsImV4cCI6MjA1OTk4MzAzNH0.RVhKzZkLxwwtbow3i3tUSVVnG_hMl-q0bwuvmqNuDq0';

export interface RankedTeam {
  rank: number;
  prevRank: number | null;
  teamId: string;
  name: string;
  conference: string | null;
  wins: number | null;
  losses: number | null;
  rating: number | null;
}

export interface PublishedRanking {
  season: string; // "2026-NCAA Season"
  week: number;
  publishedAt: string; // "2026-10-12"
  teams: RankedTeam[];
}

export async function currentNcaaRanking(): Promise<PublishedRanking> {
  const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    db: { schema: 'vbdata' },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const latest = await sb
    .from('voli_rankings')
    .select('season, week, published_at')
    .like('season', '%NCAA%')
    .order('published_at', { ascending: false })
    .order('week', { ascending: false })
    .limit(1);
  if (latest.error) throw new Error(`latest week: ${latest.error.message}`);
  const head = latest.data?.[0];
  if (!head) throw new Error('no published NCAA ranking');

  const rows = await sb
    .from('voli_rankings')
    .select('rank, prev_rank, team_uuid, rating, wins, losses')
    .eq('season', head.season)
    .eq('week', head.week)
    .order('rank')
    .limit(100);
  if (rows.error) throw new Error(`rows: ${rows.error.message}`);
  if (!rows.data?.length) throw new Error('empty ranking');

  const ids = rows.data.map((r) => r.team_uuid);
  const teams = await sb.from('teams').select('team_id, name, abbreviation, conference').in('team_id', ids);
  if (teams.error) throw new Error(`teams: ${teams.error.message}`);
  const byId = new Map((teams.data ?? []).map((t) => [t.team_id, t]));

  return {
    season: head.season,
    week: head.week,
    publishedAt: String(head.published_at).slice(0, 10),
    teams: rows.data.map((r) => {
      const t = byId.get(r.team_uuid);
      return {
        rank: r.rank,
        prevRank: r.prev_rank,
        teamId: r.team_uuid,
        name: t?.name || t?.abbreviation || 'Unknown team',
        conference: t?.conference ?? null,
        wins: r.wins,
        losses: r.losses,
        rating: r.rating === null ? null : Number(r.rating),
      };
    }),
  };
}
