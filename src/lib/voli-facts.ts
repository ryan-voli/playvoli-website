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
//   540,016 D1 player box-score lines since 2023 (DB, 27 Nov 2026); 18,300 of 18,343 completed D1 matches
//     since 2023 have a box score (99.8%)
//   445 of 445 MLV + LOVB matches have play-by-play
//
// NEVER claim NCAA play-by-play (owner, 15 Oct 2026: "we do not"). The
// database's NCAA rally rows are not a play-by-play feature. Play-by-play and
// rotations are MLV and LOVB only.
//   18,458 honors back to 1979; 3,019 AVCA All-America selections since 1981;
//     668 AVCA Coaches Polls since 1982
//   13 active podcasts, 949 episodes; 20 news outlets, 1,875 stories (DB, 27 Nov 2026)

export const FACTS_AS_OF = 'October 2026';

/** App downloads, iOS + Android (owner, 23 Oct 2026; 3.7k+ on 24 Nov 2026). Update as it grows. */
export const DOWNLOADS = '3.7k+';
/** When DOWNLOADS was last counted. Update the two together. */
export const DOWNLOADS_AS_OF = 'November 2026';

export const FACTS = [
  { value: '18,700+', label: 'college and pro matches since 2023' },
  { value: '500k+', label: 'NCAA player box-score lines' },
  { value: '99.8%', label: 'of Division I matches since 2023 with a box score' },
  { value: '18,000+', label: 'honors in the Volleyball Encyclopedia, back to 1979' },
  { value: '13 & 20', label: 'podcasts, and news outlets in one feed' },
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
    a: "Play fantasy volleyball with your friends, and follow college and pro volleyball live, with scores and box scores, and play-by-play for MLV and LOVB matches. Look up any team or player, see the VOLI Top 100 each Monday, and explore the Volleyball Encyclopedia, with more than 18,000 honors back to 1979. VOLI also brings together volleyball news from 20 outlets and 13 volleyball podcasts, and has a chat room for every match. It's free on iPhone and Android.",
  },
  {
    id: 'fantasy',
    q: 'Does VOLI have fantasy volleyball?',
    a: 'Yes. Build a team from real college or pro players and play the season against your friends in a public or private league. Leagues use a salary cap and multi-round contracts, and the NCAA season runs in ten rounds, Wednesday to Sunday. Volleyball podcasts run their own public leagues on VOLI. Fantasy is optional: everything else in VOLI works without it.',
  },
  {
    id: 'bracket',
    q: 'Does VOLI have a bracket challenge for the NCAA volleyball tournament?',
    a: "Yes. The College Volleyball Bracket Challenge is a free bracket game in the VOLI app for the NCAA Division I women's volleyball tournament. You pick the winner of all 63 matches, follow a live leaderboard, and can play against your friends in a group. In 2026 one $500 cash prize goes to the top eligible bracket: no purchase necessary, open to legal residents of the 50 U.S. states and D.C. who are 18 or older and have reached the age of majority in their state. How it works is at playvoli.com/bracket and the Official Rules are at playvoli.com/bracket/rules.",
  },
  {
    id: 'box-scores',
    q: 'Where can I find NCAA volleyball box scores and player stats?',
    a: "In the VOLI app. It has box scores for 99.8% of completed Division I women's matches since 2023 (more than 500,000 player lines), and set-by-set player stats for every MLV and LOVB match. Leaderboards sort by season, conference, position and class, in totals or per set.",
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
    a: 'Yes. VOLI gathers volleyball news from 20 outlets, from league and conference sites to independent writers, with each story linked to its source. It also carries 13 volleyball podcasts with more than 900 episodes to stream or download, with your place saved across devices.',
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
  name: 'VOLI: The Volleyball Hub',
  url: 'https://playvoli.com/',
  operatingSystem: 'iOS, Android',
  applicationCategory: 'SportsApplication',
  description:
    "VOLI is a free volleyball app for NCAA Division I women's volleyball, Major League Volleyball and LOVB: fantasy volleyball leagues, live scores and box scores, play-by-play for pro matches, team and player stats, the weekly VOLI Top 100 and match win chances, the Volleyball Encyclopedia of honors back to 1979, and volleyball news and podcasts in one feed.",
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  publisher: { '@id': 'https://playvoli.com/#organization' },
  downloadUrl: [STORE.ios, STORE.android],
  featureList: [
    "Fantasy volleyball leagues for NCAA Division I women's volleyball and MLV (LOVB joins in January 2027), with a salary cap and multi-round contracts; public leagues run by volleyball podcasts, and private leagues",
    "The College Volleyball Bracket Challenge: a free bracket game for the NCAA Division I women's volleyball tournament, with a live leaderboard and friend groups",
    'Live scores and box scores for college and pro matches with a lead chart for each set, and play-by-play with the rotation on court for MLV and LOVB matches; Live Activities on iPhone',
    "Box scores for 99.8% of completed Division I women's matches since 2023, more than 500,000 NCAA player lines, and set-by-set stats for all 445 MLV and LOVB matches",
    "The VOLI Top 100, VOLI's own Division I ranking from match results and strength of schedule, published each Monday, plus each college match's chance to win before first serve and after every set",
    'The Volleyball Encyclopedia: 18,000+ honors back to 1979, including 3,000+ AVCA All-America selections, the AVCA Coaches Poll since 1982 and all 45 NCAA champions',
    'Volleyball news from 20 outlets and 13 volleyball podcasts with 900+ episodes in one feed',
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

/** The home page's fan strip, quoted word for word (an ellipsis marks a cut;
 *  emoji and @mentions dropped). `from` is where each was said: a public App
 *  Store review (with the reviewer's public App Store name), a public Google
 *  Play review (no name: Play shows people's real names), or a message a
 *  user sent VOLI in the app (no name: those were not posted in public). */
export type FanQuote = { text: string; from: 'appstore' | 'play' | 'app'; name?: string };
export const FAN_QUOTES: FanQuote[] = [
  { from: 'appstore', name: 'GrayPuck19', text: 'The amount of stats, information, ability to track live matches, a built in fantasy game. Unbelievable. Hands down the best app for the sport.' },
  { from: 'app', text: "It was already so fun to watch volleyball before but now it's a completely new experience watching for your fantasy league. LOVE IT!" },
  { from: 'appstore', name: 'grooviegroves', text: 'Makes it much easier to follow the two different pro leagues and now NCAA\u2026 Love the fantasy function as well, makes it fun to follow along throughout the season.' },
  { from: 'app', text: "Between the fantasy draft and more games being televised, the usual drought between NCAA seasons has been much less painful, and I'm excited to be able to stay engaged with volleyball." },
  { from: 'appstore', name: 'kaipofresh', text: 'Bout time a fantasy draft thing came out for volleyball!! Makes the colleges season that much more enjoyable and fun to keep tabs on players from all over.' },
  { from: 'app', text: "The statistics and analysis are amazing. Nothing like it that I've found!" },
  { from: 'app', text: "This app is everything I've been dreaming of since I've gotten into professional volleyball!" },
  { from: 'appstore', name: 'Karatepandatiger', text: 'The fantasy formula is a great game loop and the dev team is ON IT when it comes to updates, bug fixes, and QoL add ons' },
  { from: 'app', text: "I'm loving this app so much! It's given me a reason to watch teams I don't normally watch and learn more about all the amazing talent out there." },
  { from: 'appstore', text: 'I literally check my scores all the time! It has brought me so much joy just to be able to see volleyball played in real time!' },
  { from: 'play', text: "Besides the scores updating live, I like the fact that there are articles and podcasts in the app so there's more to do than just keeping track of your team." },
  { from: 'app', text: 'I just got home from the Big 10 tournament and was watching the live stats on the app during the Nebraska game today!!!' },
  { from: 'app', text: 'This app is gorgeous. Thanks for putting it out there. And so fun!' },
  { from: 'appstore', name: 'Slanky2020', text: 'Finally something for the volleyball people! So excited to play fantasy with my friends' },
  { from: 'app', text: "It's really helping me start to follow Major League Volleyball! I especially love the fantasy component." },
  { from: 'app', text: 'User experience on a fantasy app has never been so good' },
  { from: 'appstore', name: 'BrahLa97', text: 'The GUI is sleek and it even includes audio content about the sport. Highly recommend!' },
  { from: 'app', text: 'The only sport I know anything about is volleyball, so this fantasy league experience has been novel and super fun.' },
  { from: 'app', text: 'Love the fantasy season wrapped feature. So fun and insightful' },
  { from: 'app', text: "Y'all are starting something huge that could be a massive growth factor for U.S. volleyball." },
  { from: 'appstore', name: 'Monique-86', text: '100% recommend. Great time using this app over the NCAA season' },
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
  'West Coast Conference', 'American Athletic Conference', 'VolleyMind', 'Elvis Thrill',
];

export const PODCASTS = [
  // Names and hosts exactly as content.podcasts holds them (title, author).
  { name: 'Volley Talk', by: 'Sarah Pavan', episodes: 101, partner: true },
  { name: 'Major League Minute', by: 'GMP and DOC', episodes: 56, partner: true },
  { name: 'The USA Volleyball Show', by: 'USA Volleyball', episodes: 156 },
  { name: 'Volleyball State', by: 'Jeff Sheldon and Lincoln Arneal', episodes: 146 },
  { name: 'Dig City', by: 'Purdue Volleyball', episodes: 135 },
  { name: 'Side Out Society', by: 'Tiffany Oshinsky and Lindsay Harwood', episodes: 68 },
  { name: 'Court Captains', by: 'KWND Studios', episodes: 67 },
  { name: 'Around the Block', by: 'Justin and Mike', episodes: 61 },
  { name: 'Serving Pancakes', by: 'iHeartPodcasts', episodes: 60 },
  { name: "Ember's Nest", by: 'Edward White', episodes: 48 },
  { name: 'Set 6', by: 'Major League Volleyball', episodes: 32 },
  { name: 'Six Zone Duo', by: 'Amie Just and Erin Sorensen', episodes: 16 },
  { name: 'Dig In', by: 'Grand Rapids Rise', episodes: 3 },
];

/** Bare "playvoli.com/..." mentions in an answer become links on the page. */
export const linkify = (text: string) =>
  text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/playvoli\.com(\/[a-z0-9\-\/]+)/g, '<a class="v-link" href="$1">playvoli.com$1</a>');
