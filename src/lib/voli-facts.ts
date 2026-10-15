// What VOLI is, in one place (owner, 15 Oct 2026: "AI positioning, SEO and a
// simple site"). /app, /faq, /methods, the splash's app data and the
// structured data all read from here, so a number or an answer can never differ between pages.
//
// Rules for this copy (owner, 30 Sep 2026): fantasy stays first; every other
// capability is stated with hard numbers; no comparisons with other products
// and no boasting; describe the PHONE app only.
//
// Numbers counted from the VOLI database on 15 Oct 2026:
//   18,788 completed college + pro matches since 2023
//   496,321 NCAA player box-score lines; 18,300 of 18,343 completed D1 matches
//     since 2023 have a box score (99.8%)
//   445 of 445 MLV + LOVB matches have play-by-play
//
// NEVER claim NCAA play-by-play (owner, 15 Oct 2026: "we do not"). The
// database's NCAA rally rows are not a play-by-play feature. Play-by-play and
// rotations are MLV and LOVB only.
//   18,458 honors back to 1979; 3,019 AVCA All-America selections since 1981;
//     668 AVCA Coaches Polls since 1982
//   12 active podcasts, 836 episodes; 19 news outlets in the last 120 days

export const FACTS_AS_OF = 'October 2026';

/** App downloads, iOS + Android (owner, 15 Oct 2026). Update as it grows. */
export const DOWNLOADS = '2.8k+';

export const FACTS = [
  { value: '18,700+', label: 'college and pro matches since 2023' },
  { value: '~500,000', label: 'NCAA player box-score lines' },
  { value: '99.8%', label: 'of Division I matches since 2023 with a box score' },
  { value: '18,000+', label: 'honors in the Volleyball Encyclopedia, back to 1979' },
  { value: '12 & 19', label: 'podcasts, and news outlets in one feed' },
];

export const STORE = {
  ios: 'https://apps.apple.com/us/app/voli-the-volleyball-hub/id6749812982',
  android: 'https://play.google.com/store/apps/details?id=com.playvoli.app',
};

export interface Faq {
  id: string;
  q: string;
  a: string;
}

export const FAQS: Faq[] = [
  {
    id: 'what',
    q: 'What can I do with VOLI?',
    a: "Play fantasy volleyball with your friends, and follow college and pro volleyball live, with scores and box scores, and play-by-play for MLV and LOVB matches. Look up any team or player, see the VOLI Top 100 each Monday, and explore the Volleyball Encyclopedia, with more than 18,000 honors back to 1979. VOLI also brings together volleyball news from 19 outlets and 12 volleyball podcasts, and has a chat room for every match. It's free on iPhone and Android.",
  },
  {
    id: 'fantasy',
    q: 'Does VOLI have fantasy volleyball?',
    a: 'Yes. Build a team from real college or pro players and play the season against your friends in a public or private league. Leagues use a salary cap and multi-round contracts, and the NCAA season runs in ten rounds, Wednesday to Sunday. Volleyball podcasts run their own public leagues on VOLI. Fantasy is optional: everything else in VOLI works without it.',
  },
  {
    id: 'box-scores',
    q: 'Where can I find NCAA volleyball box scores and player stats?',
    a: "In the VOLI app. It has box scores for 99.8% of completed Division I women's matches since 2023 (nearly 500,000 player lines), and set-by-set player stats for every MLV and LOVB match. Leaderboards sort by season, conference, position and class, in totals or per set.",
  },
  {
    id: 'play-by-play',
    q: 'Does VOLI have play-by-play?',
    a: 'For pro volleyball, yes. All 445 MLV and LOVB matches in VOLI have play-by-play, with each rally, substitution and the rotation on court. College matches have live scores, box scores and a lead chart for each set.',
  },
  {
    id: 'rankings',
    q: "Does VOLI rank teams or say who's likely to win?",
    a: "Yes. VOLI rates every Division I team from match results and strength of schedule, and publishes the VOLI Top 100 each Monday. Before first serve, each upcoming college match in the app shows each team's chance to win and the most likely set score, and during the match that chance updates after every set. The app also shows the AVCA Coaches Poll and EVOLLVE's team ratings. The current list is at playvoli.com/rankings, and how VOLI's numbers work at playvoli.com/methods.",
  },
  {
    id: 'history',
    q: 'Where can I look up AVCA All-Americans, AVCA poll history or past NCAA champions?',
    a: 'In the Volleyball Encyclopedia in the VOLI app. It covers 3,000+ AVCA All-America selections since 1981, AVCA Players and Coaches of the Year, the AVCA Coaches Poll since 1982, all 45 NCAA champions, ACC, Big 12, Big Ten and SEC honors, record books, the MLV Draft and pro league honors.',
  },
  {
    id: 'news',
    q: 'Does VOLI have volleyball news and podcasts?',
    a: 'Yes. VOLI gathers volleyball news from 19 outlets, from league and conference sites to independent writers, with each story linked to its source. It also carries 12 volleyball podcasts with more than 800 episodes to stream or download, with your place saved across devices.',
  },
  {
    id: 'leagues',
    q: 'Which leagues does VOLI cover, and is it affiliated with them?',
    a: "NCAA Division I women's volleyball, Major League Volleyball and LOVB, with Athletes Unlimited in the history archive. VOLI is independent and not affiliated with or endorsed by the NCAA, MLV, LOVB, the AVCA or any conference.",
  },
  {
    id: 'free',
    q: 'Is VOLI free?',
    a: 'Yes. VOLI is free on iPhone and Android.',
  },
];

/** FAQPage JSON-LD for exactly the questions a page shows (Google requires the
 *  marked-up questions to be visible on that page). */
export const faqSchema = (faqs: Faq[], url: string) => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  '@id': `${url}#faq`,
  url,
  mainEntity: faqs.map((f) => ({
    '@type': 'Question',
    name: f.q,
    acceptedAnswer: { '@type': 'Answer', text: f.a },
  })),
});

/** The app itself, under one @id wherever it appears. */
export const APP_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'MobileApplication',
  '@id': 'https://playvoli.com/#app',
  name: 'VOLI - The Volleyball Hub',
  url: 'https://playvoli.com/app',
  operatingSystem: 'iOS, Android',
  applicationCategory: 'SportsApplication',
  description:
    "VOLI is a free volleyball app for NCAA Division I women's volleyball, Major League Volleyball and LOVB: fantasy volleyball leagues, live scores and box scores, play-by-play for pro matches, team and player stats, the weekly VOLI Top 100 and match win chances, the Volleyball Encyclopedia of honors back to 1979, and volleyball news and podcasts in one feed.",
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  publisher: { '@id': 'https://playvoli.com/#organization' },
  downloadUrl: [STORE.ios, STORE.android],
  featureList: [
    "Fantasy volleyball leagues for NCAA Division I women's volleyball and MLV, with a salary cap and multi-round contracts; public leagues run by volleyball podcasts, and private leagues",
    'Live scores and box scores for college and pro matches with a lead chart for each set, and play-by-play with the rotation on court for MLV and LOVB matches; Live Activities on iPhone',
    "Box scores for 99.8% of completed Division I women's matches since 2023, nearly 500,000 NCAA player lines, and set-by-set stats for all 445 MLV and LOVB matches",
    "The VOLI Top 100, VOLI's own Division I ranking from match results and strength of schedule, published each Monday, plus each college match's chance to win before first serve and after every set",
    'The Volleyball Encyclopedia: 18,000+ honors back to 1979, including 3,000+ AVCA All-America selections, the AVCA Coaches Poll since 1982 and all 45 NCAA champions',
    'Volleyball news from 19 outlets and 12 volleyball podcasts with 800+ episodes in one feed',
    'A chat room for every match, rooms for NCAA, MLV and LOVB fans, a private chat for each fantasy league, and AMAs with volleyball creators',
    "EVOLLVE's college volleyball analytics: team ratings, player impact numbers and match predictions",
  ],
};

export const TESTIMONIALS = [
  "This app is everything I've been dreaming of since I've gotten into professional volleyball!",
  "It was already so fun to watch volleyball before but now it's a completely new experience watching for your fantasy league. LOVE IT!",
  'This app is gorgeous. Thanks for putting it out there. And so fun!',
  "Y'all are starting something huge that could be a massive growth factor for U.S. volleyball.",
];

export const appSchemaWithReviews = {
  ...APP_SCHEMA,
  review: TESTIMONIALS.map((t) => ({
    '@type': 'Review',
    reviewRating: { '@type': 'Rating', ratingValue: '5', bestRating: '5' },
    author: { '@type': 'Person', name: 'VOLI App User' },
    reviewBody: t,
  })),
};

export const NEWS_OUTLETS = [
  'SEC Sports', 'Major League Volleyball', 'NCAA.com', 'Hurrdat Sports', 'Sports Illustrated',
  'Big Ten Conference', 'ACC', 'LOVB', '900 Square Feet', 'Big 12 Conference', 'Big West',
  'Mountain West', 'Minute Volley', 'Big East', 'Cornfed Volleyball', 'EVOLLVE',
  'West Coast Conference', 'American Athletic Conference', 'VolleyMind',
];

export const PODCASTS = [
  { name: 'Volley Talk with Sarah Pavan', by: 'Sarah Pavan', episodes: 95, partner: true },
  { name: 'The Major League Minute', by: 'MLM', episodes: 50, partner: true },
  { name: 'The USA Volleyball Show', by: 'USA Volleyball', episodes: 153 },
  { name: 'Volleyball State', by: 'Jeff Sheldon and Lincoln Arneal', episodes: 137 },
  { name: 'Dig City', by: 'Purdue Volleyball', episodes: 130 },
  { name: 'Court Captains', by: 'KWND Studios', episodes: 67 },
  { name: 'The Side Out Society Podcast', by: 'Side Out Society', episodes: 62 },
  { name: 'Serving Pancakes', by: 'iHeartPodcasts', episodes: 60 },
  { name: "Ember's Nest", by: 'Edward White', episodes: 48 },
  { name: 'Set 6: The Official MLV Podcast', by: 'Major League Volleyball', episodes: 25 },
  { name: 'Six Zone Duo', by: 'Amie Just and Erin Sorensen', episodes: 8 },
  { name: 'Dig In: The Grand Rapids Rise Official Podcast', by: 'Grand Rapids Rise', episodes: 1 },
];

/** Bare "playvoli.com/..." mentions in an answer become links on the page. */
export const linkify = (text: string) =>
  text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/playvoli\.com(\/[a-z0-9\-\/]+)/g, '<a class="v-link" href="$1">playvoli.com$1</a>');
