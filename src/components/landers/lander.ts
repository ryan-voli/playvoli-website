// The shape of one league or podcast page (/volleytalk, /mlm, /canaan, /lshotvb,
// /courtcaptains). Each page file holds its own data, including its deep
// links into the app, and hands it to LeaguePage.astro, which lays it out.
import type { LineText } from '../pearl/kit/rider';

export interface LanderArt {
  src: string;
  width: number;
  height: number;
  /** What the picture shows. */
  alt: string;
}

export interface Lander {
  /** The page's path without the slash: "volleytalk". */
  slug: string;
  /** The league's or show's short name, as the copy says it: "Volley Talk". */
  name: string;
  /** A VOLI partner (listed at /about#partners): only then does the page link there.
   *  Canaan Courtside and Line Shot run leagues on VOLI but are not partners (owner, 26 Nov 2026). */
  partner?: boolean;
  /** The hero's colour. The other bands take the remaining colours in turn. */
  color: 'lime' | 'blue' | 'rose';
  /** The <title> and the meta description. */
  title: string;
  description: string;
  /** The hero: its small label, the headline lines and the first paragraph. */
  label: string[];
  lines: (LineText | { text: LineText; hollow?: boolean })[];
  lede: string;
  /** Pearl: the word of the headline set in italic navy (default: the last word). */
  em?: string;
  /** voli://league/<id>/<join code>: opens this league in the app. */
  league?: string;
  /** The show's official Bracket Challenge pool. Until picks lock, the page
   *  leads with it (Join the pool, voli://bracket?g=CODE) instead of the league;
   *  after that the league comes back on the next build. */
  pool?: {
    /** bracket.groups code: "VLYTLK". */
    code: string;
    /** The hero while the pool leads: label, headline lines, first paragraph, title, description. */
    label: string[];
    lines: (LineText | { text: LineText; hollow?: boolean })[];
    lede: string;
    em?: string;
    title: string;
    description: string;
  };
  /** voli://podcast/<id>: opens this podcast in the app. */
  podcast?: string;
  /** The label part of the click events: "volleytalk" sends league_join:volleytalk_league. */
  track: string;
  /** The cover art, from /images/partners/. */
  art?: LanderArt;
  /** The hard offset under the cover in the hero, when white will not show (a white cover). */
  artShadow?: 'ink' | 'white';
  /** The podcast as VOLI's podcast list names it ("Volley Talk"): its episode count comes from there. */
  show?: string;
  /** The podcast band's title, under "Listen to". */
  showTitle?: LineText;
  /** A few sentences about the podcast and who hosts it. */
  about?: string[];
  /** The podcast band shows the app's podcast player (a capture of this show's episode). */
  player?: boolean;
}
