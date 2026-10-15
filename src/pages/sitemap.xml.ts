// sitemap.xml (owner, 15 Oct 2026): the pages search engines and AI crawlers
// should find, the same set the splash and footer link to. Built with the
// static site; robots.txt points here. Daily Grid pages are noindex and stay
// out, as do sign-in, profile and share-card routes.
import type { APIRoute } from 'astro';

const SITE = 'https://playvoli.com';

const PAGES: { path: string; priority: string; changefreq: string }[] = [
  { path: '/', priority: '1.0', changefreq: 'weekly' },
  { path: '/app', priority: '0.9', changefreq: 'weekly' },
  { path: '/rankings', priority: '0.8', changefreq: 'weekly' },
  { path: '/faq', priority: '0.8', changefreq: 'monthly' },
  { path: '/methods', priority: '0.7', changefreq: 'monthly' },
  { path: '/about', priority: '0.7', changefreq: 'monthly' },
  { path: '/evollve', priority: '0.6', changefreq: 'monthly' },
  { path: '/partners', priority: '0.6', changefreq: 'monthly' },
  { path: '/volleytalk', priority: '0.5', changefreq: 'monthly' },
  { path: '/mlm', priority: '0.5', changefreq: 'monthly' },
  { path: '/discordbot', priority: '0.5', changefreq: 'monthly' },
  { path: '/creatorscourt', priority: '0.4', changefreq: 'monthly' },
  { path: '/whats-next', priority: '0.5', changefreq: 'monthly' },
  { path: '/contact', priority: '0.4', changefreq: 'yearly' },
  { path: '/privacy', priority: '0.2', changefreq: 'yearly' },
  { path: '/terms', priority: '0.2', changefreq: 'yearly' },
];

export const GET: APIRoute = () => {
  const lastmod = new Date().toISOString().slice(0, 10);
  const urls = PAGES.map(
    (p) => `  <url><loc>${SITE}${p.path}</loc><lastmod>${lastmod}</lastmod><changefreq>${p.changefreq}</changefreq><priority>${p.priority}</priority></url>`
  ).join('\n');
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
  return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
