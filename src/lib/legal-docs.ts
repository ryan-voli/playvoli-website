// The privacy policy and the terms of use, read from the database on each
// request for /privacy and /terms. They are the same documents the app shows
// (global_settings.privacy_policy and global_settings.terms_of_use), so an edit
// there reaches the site within a minute (the pages' CDN cache) and the two
// never drift. Read-only, anon key. Anything short of a complete, well-formed
// document throws, so the page answers 503 instead of rendering half of one.
//
// The stored text is formatted here and never edited: every word comes out as
// it is stored, escaped, in this shape:
//   - the header is the opening paragraph;
//   - each section is an h2, "<number>. <title>", with an id for the contents;
//   - privacy policy items with a title get it as an h3; terms items with a
//     subsection open their first paragraph with "<subsection> <title>." in bold;
//   - a blank line starts a new block; in a block that has bullets (•), the
//     text before the first bullet is a paragraph and each bullet is a list
//     item; a single line break inside a paragraph is kept (an address);
//   - email addresses become mailto links.
import { SUPABASE_ANON_KEY, SUPABASE_URL } from './voli-rankings';

export type LegalKind = 'privacy' | 'terms';

export interface LegalItem {
  subsection?: string;
  title?: string;
  text: string;
}

export interface LegalSection {
  section_number?: string | number;
  section_title: string;
  content: LegalItem[];
}

export interface LegalDoc {
  title?: string;
  header: string;
  version?: string;
  effective_date?: string;
  last_updated?: string;
  sections: LegalSection[];
}

const COLUMN: Record<LegalKind, string> = { privacy: 'privacy_policy', terms: 'terms_of_use' };

export async function currentLegalDoc(kind: LegalKind): Promise<LegalDoc> {
  const column = COLUMN[kind];
  const res = await fetch(`${SUPABASE_URL}/rest/v1/global_settings?select=${column}&limit=1`, {
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
    signal: AbortSignal.timeout(5000),
  });
  if (!res.ok) throw new Error(`${column}: HTTP ${res.status}`);
  const rows = (await res.json()) as Record<string, LegalDoc | null>[];
  const doc = rows?.[0]?.[column];
  if (!doc || !Array.isArray(doc.sections) || !doc.sections.length) throw new Error(`${column}: empty`);
  const wellFormed = doc.sections.every(
    (s) =>
      s && typeof s.section_title === 'string' && Array.isArray(s.content) && s.content.length > 0 &&
      s.content.every((item) => item && typeof item.text === 'string'),
  );
  if (!wellFormed || typeof doc.header !== 'string') throw new Error(`${column}: malformed`);
  return doc;
}

/** "2026-08-29" as "August 29, 2026". Anything else is shown as stored. */
export function docDate(value?: string): string {
  if (!value) return '';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  return new Date(`${value}T12:00:00Z`).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

const escape = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}/g;

/** One run of stored text as inline HTML: escaped, line breaks kept, emails linked. */
function inline(text: string): string {
  return text
    .split('\n')
    .map((line) => escape(line.trim()).replace(EMAIL, (m) => `<a href="mailto:${m}">${m}</a>`))
    .filter(Boolean)
    .join('<br>');
}

/** Stored text as blocks of HTML. `lead` opens the first paragraph (a bold subsection label). */
function blocks(text: string, lead = '', firstClass = ''): string {
  const out: string[] = [];
  let first = true;
  const para = (body: string) => {
    const cls = first && firstClass ? ` class="${firstClass}"` : '';
    out.push(`<p${cls}>${first && lead ? `${lead} ` : ''}${body}</p>`);
    first = false;
  };
  for (const chunk of text.split(/\n[ \t]*\n/)) {
    if (!chunk.trim()) continue;
    if (chunk.includes('•')) {
      const parts = chunk.split('•');
      const before = parts[0].trim();
      if (before) para(inline(before));
      else if (first && lead) para('');
      const items = parts.slice(1).map((p) => p.trim()).filter(Boolean);
      if (items.length) out.push(`<ul>${items.map((p) => `<li>${inline(p)}</li>`).join('')}</ul>`);
      first = false;
    } else {
      para(inline(chunk.trim()));
    }
  }
  if (first && lead) para('');
  return out.join('\n');
}

const slug = (s: string) =>
  s.toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

/** The document as HTML for the reading sheet: the header, then each section. */
export function legalHtml(kind: LegalKind, doc: LegalDoc): string {
  const html: string[] = [blocks(doc.header, '', 'lead')];
  const used = new Set<string>();
  doc.sections.forEach((s, i) => {
    const num = s.section_number === undefined || s.section_number === null ? '' : String(s.section_number).trim();
    let id = slug(s.section_title) || `section-${num || i + 1}`;
    while (used.has(id)) id = `${id}-${i + 1}`;
    used.add(id);
    html.push(`<h2 id="${id}">${num ? `${escape(num)}. ` : ''}${escape(s.section_title)}</h2>`);
    for (const item of s.content) {
      const title = (item.title ?? '').trim();
      const sub = (item.subsection ?? '').trim();
      if (kind === 'privacy') {
        if (title) html.push(`<h3>${escape(title)}</h3>`);
        html.push(blocks(item.text));
      } else {
        const label = sub ? `<strong>${escape(sub)}${title ? ` ${escape(title)}` : ''}.</strong>` : '';
        html.push(blocks(item.text, label));
      }
    }
  });
  return html.join('\n');
}
