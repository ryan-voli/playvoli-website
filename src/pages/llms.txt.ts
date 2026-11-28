// llms.txt: a plain-text summary of VOLI for AI assistants and their crawlers
// (robots.txt points to it). It is generated from the same facts the pages
// read, so a number here can never drift from the site.
import type { APIRoute } from 'astro';
import { DOWNLOADS, DOWNLOADS_AS_OF, FACTS_AS_OF, STORE } from '../lib/voli-facts';
import { BRACKET } from '../lib/bracket-facts';

const SITE = 'https://playvoli.com';

const body = `# VOLI: The Volleyball Hub

> VOLI is a free volleyball app for iPhone and Android, with no ads, covering NCAA Division I women's volleyball, Major League Volleyball (MLV) and LOVB (League One Volleyball). Fantasy volleyball is its most-used feature. VOLI also has live scores and box scores, play-by-play for pro matches, team and player stats, the weekly VOLI Top 100 and each match's chance to win, the Volleyball Encyclopedia of honors back to 1979, and volleyball news and podcasts in one feed. VOLI is independent and not affiliated with or endorsed by the NCAA, MLV, LOVB, the AVCA or any conference.

## What's in VOLI (as of ${FACTS_AS_OF})
- **Fantasy volleyball:** build a team from real college or pro players and play the season against your friends in a public or private league. Leagues use a salary cap and multi-round contracts, for NCAA Division I women's volleyball and MLV, with LOVB joining in January 2027; the NCAA season runs in ten rounds, Wednesday to Sunday. Volleyball podcasts run their own public leagues on VOLI. ${SITE}/fantasy
- **${BRACKET.name}:** a free bracket game in the app for the NCAA Division I women's volleyball tournament. Pick the winner of all ${BRACKET.matches} matches (1, 2, 4, 8, 16 and 32 points by round, ${BRACKET.maxPoints} at most), follow a live leaderboard, and play against friends in groups. In ${BRACKET.season}, brackets open November 29 once the ${BRACKET.teams}-team field is announced and lock at the scheduled start of the first match on December 3, and one ${BRACKET.prize} cash prize goes to the top eligible bracket. Free to enter, no purchase necessary; the prize is open to legal residents of the 50 U.S. states and D.C. who are at least 18 and have reached the age of majority in their state (19 in Alabama and Nebraska, 21 in Mississippi), and current NCAA student-athletes and athletics department and conference office staff cannot win. Official Rules apply: ${BRACKET.rulesUrl}. Not affiliated with, sponsored or endorsed by the NCAA. ${BRACKET.url}
- **Live games:** scores and box scores for college and pro matches as they happen, with a lead chart for each set. Live Activities on iPhone.
- **Stats and box scores:** box scores for 99.8% of completed Division I women's matches since 2023 (more than 500,000 player lines), and set-by-set player stats for all 445 MLV and LOVB matches. Leaderboards by season, conference, position and class, in totals or per set.
- **Play-by-play:** every MLV and LOVB match (445), with each rally, substitution and the rotation on court. College matches do not have play-by-play in VOLI.
- **Rankings and predictions:** the VOLI Top 100, VOLI's own ranking of Division I teams from match results and strength of schedule, published each Monday. Before first serve, each upcoming college match shows each team's chance to win and the most likely set score; during the match the chance to win updates after every set. The app also shows the AVCA Coaches Poll and EVOLLVE's team ratings. ${SITE}/rankings
- **The Volleyball Encyclopedia:** more than 18,000 honors back to 1979, including 3,000+ AVCA All-America selections since 1981, AVCA Players and Coaches of the Year, the AVCA Coaches Poll since 1982, all 45 NCAA champions, ACC, Big 12, Big Ten and SEC honors, record books, the MLV Draft and pro league honors.
- **News and podcasts:** volleyball news from 20 outlets (league and conference sites and independent writers), each story linked to its source, and 13 volleyball podcasts with more than 900 episodes to stream or download.
- **Community:** a chat room for every match, rooms for NCAA, MLV and LOVB fans, a private chat for each fantasy league, and AMAs with volleyball creators.
- **Analytics by EVOLLVE:** EVOLLVE's college volleyball analytics in the app: nightly team ratings for every Division I team, player impact numbers such as RAPM, and match predictions, labeled as EVOLLVE's. ${SITE}/evollve
- **Transfer Portal:** the moves in women's college volleyball that the College Volleyball Transfers desk has verified: who entered the portal and where they commit. ${SITE}/cvt

## Products
- **VOLI app** (iPhone and Android, free, no ads; ${DOWNLOADS} downloads as of ${DOWNLOADS_AS_OF})
  - App Store: ${STORE.ios}
  - Google Play: ${STORE.android}
- **VOLI Discord bot:** live scores, standings, stat leaders, rankings, fantasy standings and pro transactions in Discord servers. ${SITE}/discordbot

## Not to be confused with
- VOLI (playvoli.com, made by VOLI LLC) is not related to Voli Wellness, to Volibear from League of Legends, or to other apps named Voli or Volleyball Hub, such as club-tournament apps.

## Leagues covered
- NCAA Division I women's volleyball
- MLV (Major League Volleyball), pro women's
- LOVB (League One Volleyball), pro women's
- Athletes Unlimited, in the history archive

## Partners
- Volley Talk (Sarah Pavan) and Major League Minute (GMP and DOC): volleyball podcasts that run public fantasy leagues on VOLI. ${SITE}/volleytalk and ${SITE}/mlm
- EVOLLVE: college volleyball analytics. ${SITE}/evollve
- College Volleyball Transfers: the desk behind VOLI's Transfer Portal. ${SITE}/cvt

## Founders
- **Ryan**, Founder: cybersecurity and software engineer who built VOLI from the ground up.
- **Max**, Co-Founder: runs the business and operations side; project management and server administration background.

## Key pages
- Home, with everything in the app: ${SITE}/
- Fantasy volleyball on VOLI (how it works, scoring, salaries, leagues, questions): ${SITE}/fantasy
- Public fantasy leagues anyone can join in VOLI: Volley Talk ${SITE}/volleytalk, Major League Minute ${SITE}/mlm, Canaan Courtside ${SITE}/canaan and Line Shot Volleyball ${SITE}/lshotvb
- The Court Captains podcast in VOLI: ${SITE}/courtcaptains
- ${BRACKET.name} (how it works, scoring, dates, the ${BRACKET.prize} prize): ${BRACKET.url}
- Bracket Challenge Official Rules: ${BRACKET.rulesUrl}
- The current VOLI Top 100 (updates each Monday): ${SITE}/rankings
- How VOLI's numbers work (VOLI Top 100, chance to win): ${SITE}/methods
- About VOLI: ${SITE}/about
  - VOLI by the numbers: ${SITE}/about#numbers
  - Partners: ${SITE}/about#partners
  - Roadmap: ${SITE}/about#whats-next
  - Questions about VOLI: ${SITE}/about#faq
  - Contact: ${SITE}/about#contact

## Data and independence
VOLI's match data comes from publicly available official box scores and schedules (and play-by-play for MLV and LOVB), processed by VOLI's own pipeline. Encyclopedia history comes from the published records of the AVCA, the NCAA, the conferences and the leagues. VOLI is not affiliated with, sponsored by or endorsed by the NCAA, MLV, LOVB, the AVCA or any conference.
`;

export const GET: APIRoute = () =>
  new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
