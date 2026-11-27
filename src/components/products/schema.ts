// Structured data for the product and partner pages: the page itself
// (WebPage) and where it sits on the site (BreadcrumbList). Both name only
// what the page shows; the sitewide Organization, WebSite and app nodes are
// referred to by @id.
import { SITE_URL } from '../../lib/site';

export interface Crumb {
  name: string;
  /** The page's path on playvoli.com: "/", "/about". */
  path: string;
}

interface PageSchema {
  /** This page's path: "/cvt". */
  path: string;
  /** What the page is, in a few words. */
  name: string;
  description: string;
  /** From the home page down to this page, this page last. */
  crumbs: Crumb[];
}

export function pageSchema({ path, name, description, crumbs }: PageSchema): Record<string, unknown>[] {
  const url = `${SITE_URL}${path}`;
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      '@id': `${url}#webpage`,
      url,
      name,
      description,
      inLanguage: 'en-US',
      isPartOf: { '@id': `${SITE_URL}/#website` },
      publisher: { '@id': `${SITE_URL}/#organization` },
      mentions: { '@id': `${SITE_URL}/#app` },
      breadcrumb: { '@id': `${url}#breadcrumb` },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      '@id': `${url}#breadcrumb`,
      itemListElement: crumbs.map((c, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: c.name,
        item: c.path === '/' ? `${SITE_URL}/` : `${SITE_URL}${c.path}`,
      })),
    },
  ];
}
