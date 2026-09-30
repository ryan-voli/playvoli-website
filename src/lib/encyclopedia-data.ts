// Build-time data for /encyclopedia/*.
//
// Reads ONLY public `vbdata` history tables with the site's public anon key:
// player_awards, avca_rankings, season_results, ncaa_records, draft_picks,
// teams. Never the `fantasy` schema — no prices, no fantasy points.
//
// Every loader throws when its query comes back empty, so a stale or blank
// encyclopedia page fails the build instead of shipping.

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://api.playvoli.com';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhjaG9sa3JqcHV6YWhxdW1hamVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ0MDcwMzQsImV4cCI6MjA1OTk4MzAzNH0.RVhKzZkLxwwtbow3i3tUSVVnG_hMl-q0bwuvmqNuDq0';

const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  db: { schema: 'vbdata' },
  auth: { persistSession: false, autoRefreshToken: false },
});

type Row = Record<string, any>;

/** The date the build read the data, e.g. "30 September 2026". */
export const AS_OF = new Date().toLocaleDateString('en-US', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'America/Los_Angeles',
});

export const APP_STORE = 'https://apps.apple.com/us/app/voli-the-volleyball-hub/id6749812982';
export const PLAY_STORE = 'https://play.google.com/store/apps/details?id=com.playvoli.app';

function fail(what: string): never {
  throw new Error(`[encyclopedia] ${what} returned no rows — refusing to build an empty page`);
}

/** Pages through PostgREST's row cap. `build` must return a fresh query. */
async function fetchAll(build: () => any, what: string): Promise<Row[]> {
  const size = 1000;
  const out: Row[] = [];
  for (let from = 0; ; from += size) {
    const { data, error } = await build().range(from, from + size - 1);
    if (error) throw new Error(`[encyclopedia] ${what}: ${error.message}`);
    out.push(...(data ?? []));
    if (!data || data.length < size) break;
  }
  if (out.length === 0) fail(what);
  return out;
}

async function count(table: string, filter?: (q: any) => any): Promise<number> {
  let q = sb.from(table).select('*', { count: 'exact', head: true });
  if (filter) q = filter(q);
  const { count: n, error } = await q;
  if (error) throw new Error(`[encyclopedia] count ${table}: ${error.message}`);
  if (!n) fail(`count ${table}`);
  return n;
}

// Build-time memo: many static paths share one read.
const memo = new Map<string, Promise<any>>();
function once<T>(key: string, fn: () => Promise<T>): Promise<T> {
  if (!memo.has(key)) memo.set(key, fn());
  return memo.get(key)!;
}

export const fmt = (n: number) => n.toLocaleString('en-US');

// ---------------------------------------------------------------- overview

export interface Overview {
  honors: number;
  honorsFirstYear: number;
  honorsLastYear: number;
  awardTypes: number;
  awardingBodies: number;
  allAmericans: number;
  allAmericaFirstYear: number;
  polls: number;
  pollsFirstYear: number;
  finalPolls: number;
  champions: number;
  championsFirstYear: number;
  championsLastYear: number;
  confTitlesFirstYear: number;
  ncaaRecords: number;
  mlvHonors: number;
  lovbHonors: number;
  draftPicks: number;
}

export function getOverview(): Promise<Overview> {
  return once('overview', async () => {
    const awards = await fetchAll(
      () => sb.from('player_awards').select('year,award,awarding_body,league'),
      'player_awards',
    );
    const years = awards.map((r) => r.year as number);
    const aa = awards.filter((r) => r.awarding_body === 'AVCA' && r.award === 'all_america');
    const polls = await fetchAll(() => sb.from('avca_rankings').select('year,poll_type'), 'avca_rankings');
    const champs = await getNcaaChampions();
    const confT = await fetchAll(
      () => sb.from('season_results').select('year').eq('league', 'NCAA').like('stage', 'conference%'),
      'conference results',
    );
    return {
      honors: awards.length,
      honorsFirstYear: Math.min(...years),
      honorsLastYear: Math.max(...years),
      awardTypes: new Set(awards.map((r) => r.award)).size,
      awardingBodies: new Set(awards.map((r) => r.awarding_body)).size,
      allAmericans: aa.length,
      allAmericaFirstYear: Math.min(...aa.map((r) => r.year)),
      polls: polls.length,
      pollsFirstYear: Math.min(...polls.map((r) => r.year)),
      finalPolls: polls.filter((r) => r.poll_type === 'final').length,
      champions: champs.length,
      championsFirstYear: champs[champs.length - 1].year,
      championsLastYear: champs[0].year,
      confTitlesFirstYear: Math.min(...confT.map((r) => r.year)),
      ncaaRecords: await count('ncaa_records'),
      mlvHonors: awards.filter((r) => r.league === 'MLV').length,
      lovbHonors: awards.filter((r) => r.league === 'LOVB').length,
      draftPicks: await count('draft_picks'),
    };
  });
}

// ----------------------------------------------------------- NCAA champions

export interface ChampionYear {
  year: number;
  champion: string;
  coach: string | null;
  score: string | null;
  site: string | null;
  runnerUp: string | null;
  semifinalists: string[];
}

export function getNcaaChampions(): Promise<ChampionYear[]> {
  return once('champions', async () => {
    const rows = await fetchAll(
      () =>
        sb
          .from('season_results')
          .select('year,rank,team_name,outcome,coach,score,site')
          .eq('league', 'NCAA')
          .eq('stage', 'championship')
          .order('year', { ascending: false })
          .order('rank'),
      'NCAA championship results',
    );
    const byYear = new Map<number, Row[]>();
    for (const r of rows) {
      if (!byYear.has(r.year)) byYear.set(r.year, []);
      byYear.get(r.year)!.push(r);
    }
    const out: ChampionYear[] = [];
    for (const [year, rs] of byYear) {
      const champ = rs.find((r) => r.outcome === 'Champion');
      if (!champ) continue;
      const ru = rs.find((r) => r.outcome === 'Runner-up');
      out.push({
        year,
        champion: champ.team_name,
        coach: champ.coach ?? null,
        score: champ.score ?? null,
        site: champ.site ?? null,
        runnerUp: ru?.team_name ?? null,
        semifinalists: rs.filter((r) => r.outcome === 'Semifinalist').map((r) => r.team_name),
      });
    }
    if (!out.length) fail('NCAA champions');
    return out.sort((a, b) => b.year - a.year);
  });
}

// ------------------------------------------------------------ NCAA records

export interface RecordEntry {
  rank: number;
  value: string;
  name: string;
  team: string | null;
  opponent: string | null;
  when: string | null;
  detail: string | null;
}
export interface RecordLadder {
  label: string;
  total: number;
  entries: RecordEntry[]; // top of the list only
}
export interface RecordCategory {
  key: string;
  label: string;
  total: number;
  ladders: RecordLadder[];
}
export interface NcaaRecordBook {
  total: number;
  player: RecordCategory[];
  team: RecordCategory[];
}

const LENGTHS: Record<number, string> = { 3: 'Three-set match', 4: 'Four-set match', 5: 'Five-set match' };
const SCOPE_ORDER = ['match', 'season', 'career', 'other'];

/** Cleans the NCAA book's footnote marks (^, *) off a name. */
const cleanName = (s: string | null) => (s ?? '').replace(/^[\^*†#\s]+|[\^*†#\s]+$/g, '');
/** "(1981-2000)" and "1981-2000" are the same ladder. */
const normEra = (s: string | null) =>
  (s ?? '')
    .replace(/[()]/g, '')
    .replace(/\s*;\s*/g, ' · ')
    .replace(/\s+/g, ' ')
    .trim();

export const RECORDS_TOP_N = 5;

export function getNcaaRecords(): Promise<NcaaRecordBook> {
  return once('ncaa-records', async () => {
    const rows = await fetchAll(
      () =>
        sb
          .from('ncaa_records')
          .select('entity_type,scope,match_length,stat_category,category_label,era,rank,value,player_name,team_name,opponent,when_label,detail')
          .order('record_id'),
      'ncaa_records',
    );
    const build = (entity: string): RecordCategory[] => {
      const cats = new Map<string, Row[]>();
      for (const r of rows.filter((r) => r.entity_type === entity)) {
        if (!cats.has(r.stat_category)) cats.set(r.stat_category, []);
        cats.get(r.stat_category)!.push(r);
      }
      const out: RecordCategory[] = [];
      for (const [key, rs] of cats) {
        const ladders = new Map<string, { sort: [number, number, string]; label: string; rows: Row[] }>();
        for (const r of rs) {
          const era = normEra(r.era);
          const base =
            r.scope === 'match'
              ? LENGTHS[r.match_length] ?? 'Match'
              : r.scope === 'season'
                ? 'Season'
                : r.scope === 'career'
                  ? 'Career'
                  : 'All-time';
          const label = era ? `${base} · ${era}` : base;
          const k = label.toLowerCase();
          if (!ladders.has(k)) {
            const si = SCOPE_ORDER.indexOf(r.scope);
            ladders.set(k, { sort: [si < 0 ? 9 : si, r.match_length ?? 0, era.toLowerCase()], label, rows: [] });
          }
          ladders.get(k)!.rows.push(r);
        }
        const sorted = [...ladders.values()].sort(
          (a, b) => a.sort[0] - b.sort[0] || a.sort[1] - b.sort[1] || a.sort[2].localeCompare(b.sort[2]),
        );
        out.push({
          key,
          label: rs[0].category_label ?? key.replace(/_/g, ' '),
          total: rs.length,
          ladders: sorted.map((l) => {
            const seen = new Set<string>();
            const entries = l.rows
              .sort((a, b) => a.rank - b.rank)
              .filter((r) => {
                // The book repeats a few ties across its pages; show each once.
                const id = `${r.rank}|${r.value}|${cleanName(r.player_name ?? r.team_name).toLowerCase()}`;
                if (seen.has(id)) return false;
                seen.add(id);
                return true;
              });
            return {
              label: l.label,
              total: entries.length,
              entries: entries
                .filter((r) => r.rank <= RECORDS_TOP_N)
                .map((r) => ({
                  rank: r.rank,
                  value: r.value,
                  name: cleanName(r.player_name ?? r.team_name),
                  team: r.player_name ? r.team_name : null,
                  opponent: r.opponent,
                  when: r.when_label,
                  detail: r.detail,
                })),
            };
          }),
        });
      }
      return out.sort((a, b) => a.label.localeCompare(b.label));
    };
    return { total: rows.length, player: build('player'), team: build('team') };
  });
}

// --------------------------------------------------------- AVCA final polls

export interface PollTeam {
  rank: number;
  team: string;
  tied: boolean;
}
export interface FinalPoll {
  slug: string; // the season year, e.g. "2025"; the spring-2021 poll is "2020"
  seasonYear: number;
  label: string; // "2025 season" / "2020 season (played spring 2021)"
  publishedAt: string | null;
  pollName: string | null;
  teams: PollTeam[];
}

export function getAvcaFinalPolls(): Promise<FinalPoll[]> {
  return once('avca-finals', async () => {
    const rows = await fetchAll(
      () =>
        sb
          .from('avca_rankings')
          .select('year,term,published_at,sponsor,rankings')
          .eq('poll_type', 'final')
          .order('year', { ascending: false }),
      'AVCA final polls',
    );
    const polls: FinalPoll[] = rows.map((r) => {
      const spring = r.term === 'Spring';
      const seasonYear = spring ? r.year - 1 : r.year;
      const teams: PollTeam[] = ((r.rankings as Row[]) ?? [])
        .map((t) => ({ rank: Number(t.rank), team: String(t.team_name ?? ''), tied: !!t.tied }))
        .sort((a, b) => a.rank - b.rank);
      return {
        slug: String(seasonYear),
        seasonYear,
        label: spring ? `${seasonYear} season (played spring ${r.year})` : `${seasonYear} season`,
        publishedAt: r.published_at
          ? new Date(r.published_at + 'T12:00:00Z').toLocaleDateString('en-US', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
              timeZone: 'UTC',
            })
          : null,
        pollName: r.sponsor ?? null,
        teams,
      };
    });
    const ok = polls.filter((p) => p.teams.length > 0);
    if (!ok.length) fail('AVCA final polls');
    return ok.sort((a, b) => b.seasonYear - a.seasonYear);
  });
}

// ------------------------------------------------------------- pro leagues

const AWARD_NAMES: Record<string, string> = {
  mvp: 'Most Valuable Player',
  championship_mvp: 'Championship MVP',
  finals_mvp: 'Finals MVP',
  classic_mvp: 'Classic MVP',
  classic_all_tournament: 'Classic All-Tournament Team',
  rising_star: 'Rising Star',
  most_inspirational: 'Most Inspirational Player',
  middle_blocker_of_the_year: 'Middle Blocker of the Year',
  opposite_hitter_of_the_year: 'Opposite Hitter of the Year',
  outside_hitter_of_the_year: 'Outside Hitter of the Year',
  setter_of_the_year: 'Setter of the Year',
  libero_of_the_year: 'Libero of the Year',
  server_of_the_year: 'Server of the Year',
  coach_of_the_year: 'Coach of the Year',
  all_league: 'All-League Team',
  all_star: 'All-Star',
  lovb_icons: 'LOVB Icons',
  woman_of_the_year: 'Woman of the Year',
  player_of_the_week: 'Player of the Week',
  offensive_player_of_the_week: 'Offensive Player of the Week',
  defensive_player_of_the_week: 'Defensive Player of the Week',
};
// Same editorial order as the app's pro volumes.
const PRO_ORDER = [
  'mvp', 'championship_mvp', 'finals_mvp', 'classic_mvp',
  'outside_hitter_of_the_year', 'opposite_hitter_of_the_year', 'middle_blocker_of_the_year',
  'setter_of_the_year', 'libero_of_the_year', 'server_of_the_year', 'rising_star',
  'coach_of_the_year', 'most_inspirational', 'woman_of_the_year',
  'all_league', 'lovb_icons', 'all_star', 'classic_all_tournament',
  'player_of_the_week', 'offensive_player_of_the_week', 'defensive_player_of_the_week',
];
const TEAM_AWARDS = new Set(['all_league', 'lovb_icons', 'all_star', 'classic_all_tournament']);
const WEEKLY_AWARDS = new Set(['player_of_the_week', 'offensive_player_of_the_week', 'defensive_player_of_the_week']);
const TIER: Record<string, string> = { first_team: 'First team', second_team: 'Second team' };

export interface Honoree {
  name: string;
  team: string | null;
  position: string | null;
  tier: string | null;
  week: string | null;
}
export interface AwardSection {
  key: string;
  label: string;
  kind: 'season' | 'team' | 'weekly';
  total: number;
  years: { year: number; honorees: Honoree[] }[];
}
export interface ChampionRow {
  year: number;
  event: string; // "Playoffs" / "LOVB Classic"
  champion: string;
  runnerUp: string | null;
}
export interface DraftPick {
  year: number;
  round: number;
  pick: number | null;
  overall: number | null;
  player: string;
  position: string | null;
  college: string | null;
  team: string | null;
  note: string | null;
}
export interface ProLeague {
  league: 'MLV' | 'LOVB';
  honors: number;
  firstYear: number;
  lastYear: number;
  champions: ChampionRow[];
  awards: AwardSection[];
  draft: { year: number; picks: DraftPick[] }[];
  draftPicks: number;
}

export function getProLeague(league: 'MLV' | 'LOVB'): Promise<ProLeague> {
  return once(`pro-${league}`, async () => {
    const aw = await fetchAll(
      () =>
        sb
          .from('player_awards')
          .select('year,award,designation,week,player_name,team_name,position')
          .eq('league', league)
          .order('year', { ascending: false }),
      `${league} honors`,
    );
    const res = await fetchAll(
      () =>
        sb
          .from('season_results')
          .select('year,stage,rank,team_name,outcome')
          .eq('league', league)
          .in('stage', ['playoffs', 'classic'])
          .in('outcome', ['Champion', 'Runner-up']),
      `${league} results`,
    );

    const champions: ChampionRow[] = [];
    const keys = new Set(res.map((r) => `${r.year}|${r.stage}`));
    for (const k of keys) {
      const [y, stage] = k.split('|');
      const rs = res.filter((r) => String(r.year) === y && r.stage === stage);
      const c = rs.find((r) => r.outcome === 'Champion');
      if (!c) continue;
      champions.push({
        year: Number(y),
        event: stage === 'classic' ? 'LOVB Classic' : 'Championship',
        champion: c.team_name,
        runnerUp: rs.find((r) => r.outcome === 'Runner-up')?.team_name ?? null,
      });
    }
    champions.sort((a, b) => b.year - a.year || (a.event === 'Championship' ? -1 : 1));

    const groups = new Map<string, Row[]>();
    for (const r of aw) {
      if (!groups.has(r.award)) groups.set(r.award, []);
      groups.get(r.award)!.push(r);
    }
    const order = (k: string) => {
      const i = PRO_ORDER.indexOf(k);
      return i < 0 ? 999 : i;
    };
    const tierRank = (d: string | null) => (d === 'first_team' ? 0 : d === 'second_team' ? 1 : 2);
    const weekNum = (w: string | null) => {
      const m = /\d+/.exec(w ?? '');
      return m ? Number(m[0]) : 0;
    };
    const awards: AwardSection[] = [...groups.entries()]
      .sort((a, b) => order(a[0]) - order(b[0]) || a[0].localeCompare(b[0]))
      .map(([key, rs]) => {
        const kind: AwardSection['kind'] = WEEKLY_AWARDS.has(key) ? 'weekly' : TEAM_AWARDS.has(key) ? 'team' : 'season';
        const years = [...new Set(rs.map((r) => r.year as number))].sort((a, b) => b - a);
        return {
          key,
          label: AWARD_NAMES[key] ?? key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
          kind,
          total: rs.length,
          years: years.map((year) => ({
            year,
            honorees: rs
              .filter((r) => r.year === year)
              .sort(
                (a, b) =>
                  tierRank(a.designation) - tierRank(b.designation) ||
                  weekNum(a.week) - weekNum(b.week) ||
                  String(a.player_name).localeCompare(String(b.player_name)),
              )
              .map((r) => ({
                name: r.player_name,
                team: r.team_name ?? null,
                position: r.position ?? null,
                tier: r.designation ? TIER[r.designation] ?? null : null,
                week: r.week ?? null,
              })),
          })),
        };
      });

    let draft: ProLeague['draft'] = [];
    let draftPicks = 0;
    if (league === 'MLV') {
      const teams = await fetchAll(() => sb.from('teams').select('team_id,location,name'), 'teams');
      const tname = new Map(teams.map((t) => [t.team_id, [t.location, t.name].filter(Boolean).join(' ')]));
      const picks = await fetchAll(
        () =>
          sb
            .from('draft_picks')
            .select('draft_year,round,pick_number,overall_pick,player_name,position,college,notes,team_uuid')
            .order('draft_year', { ascending: false })
            .order('overall_pick'),
        'MLV draft picks',
      );
      draftPicks = picks.length;
      const ys = [...new Set(picks.map((p) => p.draft_year as number))].sort((a, b) => b - a);
      draft = ys.map((year) => ({
        year,
        picks: picks
          .filter((p) => p.draft_year === year)
          .sort((a, b) => (a.overall_pick ?? 999) - (b.overall_pick ?? 999) || a.round - b.round)
          .map((p) => ({
            year,
            round: p.round,
            pick: p.pick_number,
            overall: p.overall_pick,
            player: p.player_name,
            position: p.position,
            college: p.college,
            team: tname.get(p.team_uuid) ?? null,
            // Trade notes are facts; long editorial notes stay in the app.
            note: p.notes && /^traded|^from /i.test(p.notes) ? p.notes : null,
          })),
      }));
    }

    const yrs = aw.map((r) => r.year as number);
    return {
      league,
      honors: aw.length,
      firstYear: Math.min(...yrs),
      lastYear: Math.max(...yrs),
      champions,
      awards,
      draft,
      draftPicks,
    };
  });
}
