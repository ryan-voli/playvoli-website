// The site's own map: the main pages in the top row, the lime bar's model,
// the footer groups and the social links. The menu and the footer read from
// here, so a page is added, renamed or removed in one place.

export type Section = 'home' | 'fantasy' | 'bracket' | 'rankings' | 'about';

export interface MainPage {
  section: Exclude<Section, 'home'>;
  href: string;
  label: string;
}

/** Row 1, in order. Four links is what fits beside the logo at 320px wide. */
export const MAIN_PAGES: MainPage[] = [
  { section: 'fantasy', href: '/fantasy', label: 'Fantasy' },
  { section: 'bracket', href: '/bracket', label: 'Bracket' }, // seasonal: delete this line to take Bracket out of the top row
  { section: 'rankings', href: '/rankings', label: 'Top 100' },
  { section: 'about', href: '/about', label: 'About' },
];

/** One stop in the lime bar. */
export interface SubnavItem {
  /** "#section" on the page itself, "/page#section" from a sub-page, or a sub-page's path. */
  href: string;
  label: string;
  /** A shorter label for phones. It should be part of `label`: "Play" for "How to play". */
  short?: string;
  /** This item is the page being read (a sub-page marks itself). */
  current?: boolean;
}

/** The lime bar: the current category's menu. 2 to 9 items. */
export interface Subnav {
  /** What the bar is, for screen readers: "On this page", "Bracket Challenge". */
  label: string;
  items: SubnavItem[];
}

/** One category's menu, written once and used by the main page and its sub-pages. */
export interface SectionMenu {
  label: string;
  /** The category's main page, for example "/bracket". */
  base: string;
  /** Sections of the main page, by id. */
  sections: { id: string; label: string; short?: string }[];
  /** Sub-pages of the category, after the sections. */
  pages?: { href: string; label: string; short?: string }[];
}

/** The lime bar for one page of a category. On the main page the sections are
 *  plain anchors; on a sub-page they point back to the main page, and the
 *  sub-page is marked as the current one. */
export function sectionMenu(menu: SectionMenu, path: string): Subnav {
  const here = path.replace(/\/+$/, '') || '/';
  const onBase = here === menu.base;
  return {
    label: menu.label,
    items: [
      ...menu.sections.map((s) => ({ href: `${onBase ? '' : menu.base}#${s.id}`, label: s.label, short: s.short })),
      ...(menu.pages ?? []).map((p) => ({ href: p.href, label: p.label, short: p.short, current: p.href === here })),
    ],
  };
}

/** The home page's lime bar: the app, feature by feature. */
export const HOME_MENU: SectionMenu = {
  label: 'What is in the app',
  base: '/',
  sections: [
    { id: 'fantasy', label: 'Fantasy' },
    { id: 'live', label: 'Live games' },
    { id: 'stats', label: 'Stats' },
    { id: 'rankings', label: 'Rankings' },
    { id: 'encyclopedia', label: 'Encyclopedia' },
    { id: 'news', label: 'News' },
    { id: 'community', label: 'Community' },
    { id: 'evollve', label: 'Analytics' },
  ],
};

export interface FooterLink {
  href: string;
  label: string;
  /** Kept in the markup and out of sight. */
  hidden?: boolean;
}

export interface FooterGroup {
  title: string;
  titleHref?: string;
  links: FooterLink[];
}

export const FOOTER_GROUPS: FooterGroup[] = [
  {
    title: 'VOLI',
    links: [
      { href: '/', label: 'App' },
      { href: '/fantasy', label: 'Fantasy' },
      { href: '/bracket', label: 'Bracket Challenge' },
      { href: '/rankings', label: 'VOLI Top 100' },
      { href: '/methods', label: 'How the numbers work' },
      { href: '/about', label: 'About' },
      { href: '/about#faq', label: 'FAQ' },
      { href: '/about#whats-next', label: "What's next" },
      { href: '/about#contact', label: 'Contact' },
    ],
  },
  {
    title: 'Products',
    links: [
      { href: '/discordbot', label: 'Discord Bot' },
      { href: '/dailygrid', label: 'Daily Grid', hidden: true },
      { href: '/redditdailygrid', label: 'Reddit Daily Grid', hidden: true },
    ],
  },
  {
    title: 'Partners',
    titleHref: '/about#partners',
    links: [
      { href: '/partner', label: 'Partner with VOLI' },
      { href: '/volleytalk', label: 'Volley Talk' },
      { href: '/mlm', label: 'Major League Minute' },
      { href: '/evollve', label: 'EVOLLVE' },
      { href: '/cvt', label: 'College Volleyball Transfers' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { href: '/privacy', label: 'Privacy' },
      { href: '/terms', label: 'Terms' },
      { href: '/bracket/rules', label: 'Bracket rules' },
    ],
  },
];

export interface SocialLink {
  name: 'Instagram' | 'TikTok' | 'YouTube' | 'Facebook' | 'Reddit';
  href: string;
}

export const SOCIAL_LINKS: SocialLink[] = [
  { name: 'Instagram', href: 'https://instagram.com/playvoli' },
  { name: 'TikTok', href: 'https://tiktok.com/@playvoli' },
  { name: 'YouTube', href: 'https://youtube.com/@watchvoli' },
  { name: 'Facebook', href: 'https://www.facebook.com/thevolleyballhub' },
  { name: 'Reddit', href: 'https://reddit.com/r/playvoli' },
];

/** Said wherever the leagues are named prominently, and in every footer. */
export const INDEPENDENCE =
  'VOLI is independent and not affiliated with or endorsed by the NCAA, MLV, LOVB, the AVCA or any conference.';

export const SITE_URL = 'https://playvoli.com';
