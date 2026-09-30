// Build-time data helpers for the static proof pages (/rankings,
// /ncaa-volleyball, /ncaa-volleyball/leaders, /pro-volleyball, and anything
// else that renders public vbdata facts into HTML at build).
//
// Rules this file enforces for every caller:
//  - Public data only. The anon key below is the same one the browser already
//    ships in NavAuth.astro, and every read goes to the `vbdata` schema.
//    The `fantasy` schema is NEVER read from here (no prices, no scores).
//  - PostgREST caps a response at 1000 rows, so anything that can exceed that
//    goes through fetchAll(), which pages with .range() on a stable order.
//  - An empty result throws. A page built from nothing must fail the build so
//    the last good deploy stays live, rather than ship an empty or stale page.

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export const SUPABASE_URL = 'https://api.playvoli.com';
export const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhjaG9sa3JqcHV6YWhxdW1hamVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ0MDcwMzQsImV4cCI6MjA1OTk4MzAzNH0.RVhKzZkLxwwtbow3i3tUSVVnG_hMl-q0bwuvmqNuDq0';

const PAGE = 1000;

let _client: SupabaseClient | null = null;

/** Anon client, created once per build. */
export function client(): SupabaseClient {
  if (!_client) {
    _client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return _client;
}

/** Query builder rooted at the public `vbdata` schema. */
export function vb() {
  return client().schema('vbdata');
}

function fail(label: string, why: string): never {
  throw new Error(`[data] ${label}: ${why}. Refusing to build a page from missing data.`);
}

/**
 * Run one query (≤1000 rows) and throw if it errors or comes back empty
 * (unless allowEmpty).
 */
export async function fetchRows<T = any>(
  label: string,
  query: PromiseLike<{ data: T[] | null; error: any }>,
  opts: { allowEmpty?: boolean } = {},
): Promise<T[]> {
  const { data, error } = await query;
  if (error) fail(label, error.message || String(error));
  const rows = data ?? [];
  if (!rows.length && !opts.allowEmpty) fail(label, 'query returned no rows');
  return rows;
}

/**
 * Page past PostgREST's 1000-row cap. `make(from, to)` must return a query
 * with a STABLE .order() (a unique column last) and the .range(from, to)
 * applied, or pages can overlap or skip rows.
 */
export async function fetchAll<T = any>(
  label: string,
  make: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: any }>,
  opts: { allowEmpty?: boolean; parallel?: number } = {},
): Promise<T[]> {
  const parallel = Math.max(1, opts.parallel ?? 4);
  const out: T[] = [];
  let page = 0;
  for (;;) {
    const batch = await Promise.all(
      Array.from({ length: parallel }, (_, i) => {
        const p = page + i;
        return withRetry(() => make(p * PAGE, p * PAGE + PAGE - 1));
      }),
    );
    let done = false;
    for (const { data, error } of batch) {
      if (error) fail(label, error.message || String(error));
      const rows = data ?? [];
      out.push(...rows);
      if (rows.length < PAGE) { done = true; break; }
    }
    if (done) break;
    page += parallel;
  }
  if (!out.length && !opts.allowEmpty) fail(label, 'query returned no rows');
  return out;
}

/**
 * Retry a query on a returned error (statement timeouts and network blips
 * during a busy build), with a short backoff. The last error is returned as
 * is, so the caller still fails the build if the data never arrives.
 */
export async function withRetry<R extends { error: any }>(
  run: () => PromiseLike<R>,
  tries = 3,
): Promise<R> {
  let res = await run();
  for (let i = 1; i < tries && res.error; i++) {
    await new Promise((r) => setTimeout(r, 750 * i));
    res = await run();
  }
  return res;
}

/**
 * Run a query per chunk of ids (an indexed `in` filter), `parallel` chunks at
 * a time, paging inside each chunk. For reading a season's box scores by game
 * without ever scanning the whole table.
 */
export async function fetchByIds<T = any>(
  label: string,
  ids: string[],
  size: number,
  make: (ids: string[], from: number, to: number) => PromiseLike<{ data: T[] | null; error: any }>,
  opts: { allowEmpty?: boolean; parallel?: number } = {},
): Promise<T[]> {
  const groups = chunk(ids, size);
  const parallel = Math.max(1, opts.parallel ?? 6);
  const out: T[] = [];
  for (let i = 0; i < groups.length; i += parallel) {
    const batch = await Promise.all(
      groups.slice(i, i + parallel).map((g) =>
        fetchAll<T>(label, (from, to) => make(g, from, to), { allowEmpty: true, parallel: 1 })),
    );
    for (const rows of batch) out.push(...rows);
  }
  if (!out.length && !opts.allowEmpty) fail(label, 'query returned no rows');
  return out;
}

/** Exact row count for a filtered table; throws on error or zero. */
export async function countRows(
  label: string,
  table: string,
  filter?: (q: any) => any,
  opts: { allowZero?: boolean } = {},
): Promise<number> {
  let q: any = vb().from(table).select('*', { count: 'exact', head: true });
  if (filter) q = filter(q);
  const { count, error } = await q;
  if (error) fail(label, error.message || String(error));
  if (!count && !opts.allowZero) fail(label, 'count was zero');
  return count ?? 0;
}

/** Split an array into chunks (for `in` filters that must fit a URL). */
export function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

// ---------------------------------------------------------------------------
// Dates. vbdata.games.date is UTC; everything a fan reads is Pacific.

const TZ = 'America/Los_Angeles';

/** YYYY-MM-DD for an instant, in Pacific time. */
export function pacificDay(d: Date | string): string {
  const dt = typeof d === 'string' ? new Date(d) : d;
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(dt);
}

/** "September 30, 2026" for an instant (Pacific) or a YYYY-MM-DD day. */
export function longDate(d: Date | string): string {
  const dt = typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d) ? new Date(d + 'T12:00:00Z') : new Date(d);
  const tz = typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d) ? 'UTC' : TZ;
  return new Intl.DateTimeFormat('en-US', { timeZone: tz, month: 'long', day: 'numeric', year: 'numeric' }).format(dt);
}

/** "Monday, September 28, 2026" for a YYYY-MM-DD day. */
export function weekdayDate(day: string): string {
  return new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
    .format(new Date(day + 'T12:00:00Z'));
}

/** "Wed, Sep 30" for a YYYY-MM-DD day. */
export function shortDay(day: string): string {
  return new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', weekday: 'short', month: 'short', day: 'numeric' })
    .format(new Date(day + 'T12:00:00Z'));
}

/** "7:00 PM PT" for an instant. */
export function pacificTime(d: Date | string): string {
  return new Intl.DateTimeFormat('en-US', { timeZone: TZ, hour: 'numeric', minute: '2-digit' }).format(new Date(d)) + ' PT';
}

/** "September 30, 2026, 3:15 AM PT" for an instant. */
export function pacificStamp(d: Date | string): string {
  return `${longDate(d)}, ${pacificTime(d)}`;
}

/** The instant the build runs, fixed once so every page agrees. */
export const BUILD_TIME = new Date();

/** Fail the build if a date is older than `hours` before the build. */
export function assertFresh(label: string, when: Date | string, hours: number) {
  const age = (BUILD_TIME.getTime() - new Date(when).getTime()) / 36e5;
  if (age > hours) fail(label, `newest data is ${age.toFixed(1)}h old (limit ${hours}h)`);
}

// ---------------------------------------------------------------------------
// Formatting.

export const fmtInt = (n: number) => n.toLocaleString('en-US');

/** Round down to a friendly "N,000+" style figure for prose. */
export function roundDown(n: number, step = 1000): string {
  return fmtInt(Math.floor(n / step) * step);
}

/** ".312" style hitting percentage. */
export function fmtPct3(x: number): string {
  const s = x.toFixed(3);
  return x >= 0 && x < 1 ? s.replace(/^0/, '') : s.replace(/^-0/, '-');
}

// ---------------------------------------------------------------------------
// Shared lookups.

export interface Team {
  team_id: string;
  name: string;
  location: string | null;
  abbreviation: string | null;
  league: string;
  conference: string | null;
  primary_color: string | null;
  is_all_star: boolean | null;
}

/** Display name: NCAA teams use `name`; MLV clubs are location + nickname;
 *  LOVB clubs already carry their full name ("LOVB Austin"). */
export function teamName(t: Team | undefined | null): string {
  if (!t) return 'TBD';
  if (!t.location) return t.name;
  if (t.name.toLowerCase().includes(t.location.toLowerCase())) return t.name;
  return `${t.location} ${t.name}`;
}

export function teamColor(t: Team | undefined | null): string {
  const v = String(t?.primary_color ?? '').replace('#', '').trim();
  return /^[0-9a-fA-F]{6}$/.test(v) ? `#${v}` : 'rgba(255,255,255,0.25)';
}

let _teams: Map<string, Team> | null = null;

/** Every team, keyed by team_id. */
export async function teamsById(): Promise<Map<string, Team>> {
  if (_teams) return _teams;
  const rows = await fetchAll<Team>('teams', (from, to) =>
    vb().from('teams')
      .select('team_id,name,location,abbreviation,league,conference,primary_color,is_all_star')
      .order('team_id')
      .range(from, to),
  );
  _teams = new Map(rows.map((t) => [t.team_id, t]));
  return _teams;
}

export interface Game {
  game_id: string;
  date: string;
  home_uuid: string;
  away_uuid: string;
  home_sets_won: number | null;
  away_sets_won: number | null;
  home_set_scores: number[] | null;
  away_set_scores: number[] | null;
  game_status: string;
  league: string;
  season: string;
}

export const GAME_COLS =
  'game_id,date,home_uuid,away_uuid,home_sets_won,away_sets_won,home_set_scores,away_set_scores,game_status,league,season';

/** "25-21, 22-25, 25-18" from the winner's point of view order (home first). */
export function setLine(g: Game, homeFirst = true): string {
  const h = g.home_set_scores ?? [];
  const a = g.away_set_scores ?? [];
  const n = Math.min(h.length, a.length);
  const parts: string[] = [];
  for (let i = 0; i < n; i++) parts.push(homeFirst ? `${h[i]}-${a[i]}` : `${a[i]}-${h[i]}`);
  return parts.join(', ');
}

export interface RankRow {
  season: string;
  week: number;
  published_at: string;
  rank: number;
  team_uuid: string;
  team_name: string;
  conference: string | null;
  rating: number;
  prev_rank: number | null;
  wins: number | null;
  losses: number | null;
  movement: number | null;
}

let _top100: RankRow[] | null = null;

/**
 * The current published VOLI Top 100 (newest published week), verified
 * against max(week) in vbdata.voli_rankings for that season so the page can
 * never label an older list as current.
 */
export async function currentTop100(): Promise<RankRow[]> {
  if (_top100) return _top100;
  const rows = await fetchRows<RankRow>('voli_current_ranking',
    vb().from('voli_current_ranking')
      .select('season,week,published_at,rank,team_uuid,team_name,conference,rating,prev_rank,wins,losses,movement')
      .order('rank'),
  );
  const { season, week } = rows[0];
  if (rows.some((r) => r.season !== season || r.week !== week)) {
    throw new Error('[data] voli_current_ranking: mixed weeks in the current list');
  }
  const latest = await fetchRows<{ week: number }>('voli_rankings max week',
    vb().from('voli_rankings').select('week').eq('season', season).order('week', { ascending: false }).limit(1),
  );
  if (latest[0].week !== week) {
    throw new Error(`[data] rankings week ${week} is not the newest published week (${latest[0].week})`);
  }
  _top100 = rows;
  return rows;
}

/** "2026-NCAA Season" -> 2026 */
export function seasonYear(season: string): number {
  const m = /^(\d{4})/.exec(season);
  if (!m) throw new Error(`[data] unrecognised season label: ${season}`);
  return Number(m[1]);
}

/**
 * The NCAA regular season of the most recent final NCAA match, plus that
 * match's instant (the "as of" for anything built from finished matches).
 */
export async function latestNcaaSeason(): Promise<{ season: string; lastFinal: string }> {
  const rows = await fetchRows<{ season: string; date: string }>('latest NCAA final',
    vb().from('games').select('season,date')
      .eq('league', 'NCAA').eq('game_status', 'final')
      .lte('date', BUILD_TIME.toISOString())
      .order('date', { ascending: false }).limit(1),
  );
  // Tournament matches carry "YYYY-NCAA Tournament"; stats pages key off the
  // regular season label of the same year.
  const season = rows[0].season.replace(/Tournament$/, 'Season');
  return { season, lastFinal: rows[0].date };
}
