// Phone screenshots of the VOLI app, shown inside the site's Phone component.
//
// Each image in public/images/screens/ is a full, uncropped capture resized to
// 780px wide. To add one: drop a 780px-wide WebP of a raw capture in
// public/images/screens/, then add a line below with its real pixel size, an
// alt text that says what the screen shows, and the date it was captured.

export interface Screen {
  src: string;
  width: number;
  height: number;
  alt: string;
  captured: string;
}

export const SCREENS = {
  fantasy: {
    src: '/images/screens/fantasy.webp',
    width: 780,
    height: 1695,
    alt: "VOLI app Fantasy tab during a live round 4: two fantasy teams with round points, season points and overall rank, and their leagues, including the Volley Talk Podcast league",
    captured: '2026-10-04',
  },
  fantasyCard: {
    src: '/images/screens/fantasyCard.webp',
    width: 780,
    height: 1695,
    alt: "VOLI app Fantasy tab for Tennessee setter Caroline Kerr: a $24.2K round 4 price, 157.83 season points, average per round, value, rostered share, points by round and a round ledger",
    captured: '2026-10-04',
  },
  games: {
    src: '/images/screens/games.webp',
    width: 780,
    height: 1695,
    alt: "VOLI app Games tab on Saturday, November 21: a date strip, filters for Live, Top 25 and Fantasy, and live college volleyball scores set by set, led by #8 Arizona State at #17 TCU",
    captured: '2026-11-21',
  },
  gameLive: {
    src: '/images/screens/gameLive.webp',
    width: 780,
    height: 1695,
    alt: "VOLI app live match, #2 Pitt at Virginia, Overview tab: set 2 in play, points each team needs to win the set, a lead chart, Pitt's chance to win and what each team did better",
    captured: '2026-11-21',
  },
  gameStats: {
    src: '/images/screens/gameStats.webp',
    width: 780,
    height: 1695,
    alt: "VOLI app live match, Pitt at Virginia, further down the Overview tab: team stats side by side for points, attack efficiency, kills, blocks and digs, and top performer cards",
    captured: '2026-11-21',
  },
  gameBox: {
    src: '/images/screens/gameBox.webp',
    width: 780,
    height: 1695,
    alt: "VOLI app box score for the live Pitt at Virginia match, Statistics tab: Pitt players by jersey number with sets played, serve aces and errors, receptions and assists, and a team total",
    captured: '2026-11-21',
  },
  rankings: {
    src: '/images/screens/rankings.webp',
    width: 780,
    height: 1695,
    alt: "VOLI app Stats tab, Teams view: the AVCA Coaches Poll of November 16, 2026, led by Nebraska, Pitt and Florida, with records, poll points, movement and an AVCA, VOLI and EVOLLVE switch",
    captured: '2026-11-21',
  },
  playerStats: {
    src: '/images/screens/playerStats.webp',
    width: 780,
    height: 1695,
    alt: "VOLI app player page for Pitt opposite hitter Olivia Babcock, Statistics tab: season efficiency, kills, blocks and aces, and her 2026 game log split into non-conference and conference matches",
    captured: '2026-11-21',
  },
  playerAnalytics: {
    src: '/images/screens/playerAnalytics.webp',
    width: 780,
    height: 1695,
    alt: "VOLI app Analytics tab for Olivia Babcock, analytics by EVOLLVE: a RAPM of +1.58, first of 481 opposites, 99th percentile, strongest and weakest skills, and attack percentiles",
    captured: '2026-11-21',
  },
  playerTrends: {
    src: '/images/screens/playerTrends.webp',
    width: 780,
    height: 1695,
    alt: "VOLI app Analytics tab for Olivia Babcock: attack efficiency match by match against her season and the Division I average, best, median and worst matches, and splits against ranked teams",
    captured: '2026-11-21',
  },
  teamAnalytics: {
    src: '/images/screens/teamAnalytics.webp',
    width: 780,
    height: 1695,
    alt: "VOLI app Analytics tab for Tennessee: #11 in the AVCA poll, #12 by VOLI and #10 by EVOLLVE, strongest and weakest areas, and per-set attack, serve and block ranks among 348 teams",
    captured: '2026-10-03',
  },
  news: {
    src: '/images/screens/news.webp',
    width: 780,
    height: 1695,
    alt: "VOLI app Content tab, Read view: a featured college volleyball story from the SEC, For You picks and more stories from league, conference and independent outlets, each with its source",
    captured: '2026-10-29',
  },
  podcast: {
    src: '/images/screens/podcast.webp',
    width: 780,
    height: 1695,
    alt: "VOLI app podcast player on an episode of Major League Minute, with a waveform scrubber, speed, 30-second skips, download and comments, above an episode of The Side Out Society Podcast",
    captured: '2026-10-29',
  },
  bracket: {
    src: '/images/screens/bracket.webp',
    width: 780,
    height: 1695,
    alt: "VOLI app Bracket tab for the 2026 College Volleyball Bracket Challenge before the field is announced: a $500 cash prize, a countdown clock, the sign-up count and an entry button",
    captured: '2026-11-21',
  },
  encyclopedia: {
    src: '/images/screens/encyclopedia.webp',
    width: 780,
    height: 1695,
    alt: "VOLI app Volleyball Encyclopedia home: search for awards, records, players and teams, entry counts for MLV, LOVB and NCAA history since 1981, and record books and honors by league",
    captured: '2026-10-29',
  },
  shareCard: {
    src: '/images/screens/shareCard.webp',
    width: 780,
    height: 1695,
    alt: "VOLI app share image editor for a final score, Oregon at Penn State on October 24, 2026: Penn State won 3 sets to 1, with set scores and a side-by-side team stat comparison",
    captured: '2026-10-29',
  },
} as const satisfies Record<string, Screen>;

export type ScreenKey = keyof typeof SCREENS;
