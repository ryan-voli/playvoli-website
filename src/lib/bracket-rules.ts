// The Bracket Challenge's Official Rules, read from the database on each
// request for /bracket/rules. They are the same document the app's Bracket
// page shows (global_settings.bracket_rules), so an edit there reaches the
// site within a minute (the page's CDN cache) and the two never drift.
// Read-only, anon key. Anything short of a complete, well-formed document
// throws, so the page answers 503 instead of rendering half of one.
import { SUPABASE_ANON_KEY, SUPABASE_URL } from './voli-rankings';

export interface RulesItem {
  subsection: string;
  title: string;
  text: string;
}

export interface RulesSection {
  section_number: string;
  section_title: string;
  content: RulesItem[];
}

export interface BracketRules {
  title: string;
  header: string;
  version: string;
  effective_date: string;
  sections: RulesSection[];
}

export async function currentBracketRules(): Promise<BracketRules> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/global_settings?select=bracket_rules&limit=1`, {
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
    signal: AbortSignal.timeout(5000),
  });
  if (!res.ok) throw new Error(`bracket rules: HTTP ${res.status}`);
  const rows = (await res.json()) as { bracket_rules: BracketRules | null }[];
  const rules = rows?.[0]?.bracket_rules;
  if (!rules || !Array.isArray(rules.sections) || !rules.sections.length) throw new Error('bracket rules: empty');
  const wellFormed = rules.sections.every(
    (s) =>
      s && typeof s.section_title === 'string' && Array.isArray(s.content) && s.content.length > 0 &&
      s.content.every((item) => item && typeof item.text === 'string'),
  );
  if (!wellFormed || typeof rules.header !== 'string') throw new Error('bracket rules: malformed');
  return rules;
}
