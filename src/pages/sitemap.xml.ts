// sitemap.xml: the pages search engines and AI crawlers should find, the same
// set the menus and the footer link to. Built with the static site; robots.txt
// points here. Pages that redirect, sign-in and profile pages, share-link
// pages and the noindex pages (Daily Grid, the badge page, the ad landing
// page) stay out.
import type { APIRoute } from 'astro';

const SITE = 'https://playvoli.com';

const PAGES: { path: string; priority: string; changefreq: string }[] = [
  { path: '/', priority: '1.0', changefreq: 'weekly' },
  { path: '/fantasy', priority: '0.9', changefreq: 'weekly' },
  { path: '/bracket', priority: '0.9', changefreq: 'daily' },
  { path: '/bracket/rules', priority: '0.3', changefreq: 'monthly' },
  { path: '/rankings', priority: '0.8', changefreq: 'weekly' },
  { path: '/methods', priority: '0.6', changefreq: 'monthly' },
  { path: '/about', priority: '0.7', changefreq: 'monthly' },
  { path: '/evollve', priority: '0.6', changefreq: 'monthly' },
  { path: '/cvt', priority: '0.5', changefreq: 'monthly' },
  { path: '/volleytalk', priority: '0.5', changefreq: 'monthly' },
  { path: '/mlm', priority: '0.5', changefreq: 'monthly' },
  { path: '/canaan', priority: '0.4', changefreq: 'monthly' },
  { path: '/lshotvb', priority: '0.4', changefreq: 'monthly' },
  { path: '/courtcaptains', priority: '0.4', changefreq: 'monthly' },
  { path: '/discordbot', priority: '0.5', changefreq: 'monthly' },
  { path: '/partner', priority: '0.5', changefreq: 'monthly' },
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
