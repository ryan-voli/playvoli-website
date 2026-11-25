// The College Volleyball Bracket Challenge in one place. /bracket, its promos
// on the splash and /app, the /faq answer and the structured data all read
// from here, so a date, a rule or the prize can never differ between them.
//
// Every fact mirrors the Official Rules (version 1.4, effective October 24,
// 2026). The rules themselves live in the database and are rendered fresh on
// each request at /bracket/rules. When they change, change this file too.
//
// NAMING. The game is the "College Volleyball Bracket Challenge". "NCAA" only
// ever describes the tournament being picked, never the game. Rounds carry
// the Official Rules' names: first round, second round, regional semifinals,
// regional finals, national semifinals, championship match.
//
// DATES. The 2026 tournament calendar is the NCAA's: field announced
// November 29, first and second rounds December 3-5, regionals December
// 10-13, national semifinals December 17 and the championship match December
// 20 in San Antonio.
import type { Faq } from './voli-facts';

export const BRACKET = {
  name: 'College Volleyball Bracket Challenge',
  season: '2026',
  path: '/bracket',
  rulesPath: '/bracket/rules',
  url: 'https://playvoli.com/bracket',
  rulesUrl: 'https://playvoli.com/bracket/rules',
  prize: '$500',
  matches: 63,
  teams: 64,
  maxPoints: 192,
  /** Central Time calendar days; the contest runs on the Sponsor's Central clock. */
  fieldOn: '2026-11-29',
  firstMatchOn: '2026-12-03',
  finalOn: '2026-12-20',
  /** The scheduled start of the first match, as an ISO instant with its
   *  offset (for example '2026-12-03T15:00:00-06:00'). Unknown until the
   *  NCAA publishes the schedule on November 29: fill it in then, and the
   *  page and promos switch to "locked" at that moment instead of at the end
   *  of the day. */
  lockAt: null as string | null,
};

/** Where the challenge stands on a given day. */
export type BracketPhase = 'soon' | 'today' | 'open' | 'lockday' | 'locked' | 'over';

const centralDay = (now: Date) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Chicago', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);

export const bracketPhase = (now: Date = new Date()): BracketPhase => {
  const day = centralDay(now);
  if (BRACKET.lockAt && day <= BRACKET.finalOn && now.getTime() >= Date.parse(BRACKET.lockAt)) return 'locked';
  if (day < BRACKET.fieldOn) return 'soon';
  if (day === BRACKET.fieldOn) return 'today';
  if (day < BRACKET.firstMatchOn) return 'open';
  if (day === BRACKET.firstMatchOn) return 'lockday';
  if (day <= BRACKET.finalOn) return 'locked';
  return 'over';
};

/** One line on where things stand: `short` for the promos, `long` for /bracket.
 *  The pages print the build day's line and a small script re-reads the
 *  calendar on each visit, so the line is right between deploys too. */
export const BRACKET_STATUS: Record<BracketPhase, { short: string; long: string }> = {
  soon: {
    short: 'Brackets open Nov. 29',
    long: 'Brackets open Sunday, November 29, as soon as the 64-team field is announced. Sign up in the app now so you are ready.',
  },
  today: {
    short: 'Brackets open today',
    long: 'Brackets open today, Sunday, November 29, as soon as the 64-team field is announced.',
  },
  open: {
    short: 'Brackets are open',
    long: 'Brackets are open. Picks lock Thursday, December 3, at the scheduled start of the first match.',
  },
  lockday: {
    short: 'Picks lock today',
    long: 'Picks lock today, Thursday, December 3, at the scheduled start of the first match. The time is shown in the app. After that, brackets are locked.',
  },
  locked: {
    short: 'Brackets are locked',
    long: 'Brackets are locked for 2026. Follow every bracket on the leaderboard in the VOLI app.',
  },
  over: {
    short: 'The 2026 challenge is complete',
    long: "The 2026 challenge is complete. The winner's username will be posted in the app once verified. Thank you for playing.",
  },
};

/** The promos on the splash and /app come down once picks lock. */
export const promoIsLive = (phase: BracketPhase) => phase !== 'locked' && phase !== 'over';

/** What a small inline script needs to keep the status line current. */
export const BRACKET_CLOCK = {
  fieldOn: BRACKET.fieldOn,
  firstMatchOn: BRACKET.firstMatchOn,
  finalOn: BRACKET.finalOn,
  lockAt: BRACKET.lockAt,
  status: BRACKET_STATUS,
};

export const BRACKET_ROUNDS = [
  { round: 'First round', matches: 32, points: 1 },
  { round: 'Second round', matches: 16, points: 2 },
  { round: 'Regional semifinals', matches: 8, points: 4 },
  { round: 'Regional finals', matches: 4, points: 8 },
  { round: 'National semifinals', matches: 2, points: 16 },
  { round: 'Championship match', matches: 1, points: 32 },
];

export const BRACKET_DATES = [
  { iso: '2026-11-29', when: 'Sunday, Nov. 29', what: 'The field of 64 is announced', detail: 'The selection show airs that evening on ESPN. Brackets open in VOLI as soon as the field is set.' },
  { iso: '2026-12-03', when: 'Thursday, Dec. 3', what: 'Brackets lock', detail: 'Picks lock at the scheduled start of the first match of the first round. The time is shown in the app.' },
  { iso: '2026-12-03', when: 'Dec. 3 to 5', what: 'First and second rounds', detail: 'Played at campus sites. 48 of the 63 matches.' },
  { iso: '2026-12-10', when: 'Dec. 10 to 13', what: 'Regional semifinals and regional finals', detail: 'Twelve matches decide the four national semifinalists.' },
  { iso: '2026-12-17', when: 'Thursday, Dec. 17', what: 'National semifinals', detail: 'Alamodome, San Antonio.' },
  { iso: '2026-12-20', when: 'Sunday, Dec. 20', what: 'Championship match', detail: 'Alamodome, San Antonio. Its total points decide the first tiebreaker.' },
];

export const BRACKET_STEPS = [
  {
    title: 'Get the VOLI app',
    text: 'VOLI is free on iPhone and Android. Create a free account and open the Bracket page.',
  },
  {
    title: 'Sign up to play',
    text: 'Tap Sign up on the Bracket page. Signing up alone does not enter you for the $500: for that, add your birthdate and state and confirm you are eligible before brackets lock. Entering for the prize is optional.',
  },
  {
    title: 'Fill out your bracket',
    text: 'Once the field of 64 is set on November 29, pick the winner of all 63 matches, from the first round to the championship match, and set your tiebreaker. Change your picks as often as you like until brackets lock.',
  },
  {
    title: 'Follow it live',
    text: "Every result scores your bracket automatically. Watch the leaderboard, see where you stand in your groups, and open anyone's bracket once picks lock.",
  },
];

/** The same text feeds the visible answers and the FAQPage structured data. */
export const BRACKET_FAQS: Faq[] = [
  {
    id: 'what',
    q: 'What is the College Volleyball Bracket Challenge?',
    a: "It is a free bracket game in the VOLI app for the 2026 NCAA Division I women's volleyball tournament. You pick the winner of all 63 matches, from the first round to the championship match, and earn points for every correct pick.",
  },
  {
    id: 'free',
    q: 'Is it free to enter?',
    a: 'Yes. Entry is free and no purchase is necessary. You need the free VOLI app, on iPhone or Android, and a free VOLI account.',
  },
  {
    id: 'prize',
    q: 'What is the prize?',
    a: 'One prize of $500 in cash goes to the eligible entrant whose complete bracket finishes highest. VOLI funds the prize itself, and no part of it comes from entrants. It is paid by ACH bank transfer, mailed check or Venmo.',
  },
  {
    id: 'eligible',
    q: 'Who can win the $500?',
    a: "Legal residents of the 50 United States and the District of Columbia who are at least 18 and have reached the age of majority where they live (19 in Alabama and Nebraska, 21 in Mississippi). To be eligible you sign up for the prize in the app and save a complete bracket, all 63 picks and the tiebreaker, before brackets lock. These people cannot win: current NCAA student-athletes; staff of any NCAA school's athletics department, and staff with responsibilities within or over one; staff of any athletic conference office; VOLI's owners, officers, employees and contractors and their immediate family and household members; and anyone paid to promote the contest. The Official Rules are at playvoli.com/bracket/rules.",
  },
  {
    id: 'optional',
    q: 'Do I have to enter for the prize to play?',
    a: 'No. Entering for the $500 is optional. You can fill out a bracket and appear on the leaderboard without it. To be eligible for the prize you also give your birthdate and state and confirm you are eligible, before brackets lock.',
  },
  {
    id: 'dates',
    q: 'When do brackets open and lock?',
    a: "Brackets open on Sunday, November 29, 2026, as soon as the 64-team field is announced. The Official Rules schedule the opening for 12:00 p.m. Central, but brackets cannot open until the NCAA releases the field, which is expected that evening. They lock at the scheduled start of the tournament's first match; the first round begins Thursday, December 3. You can change your picks at any time before the lock.",
  },
  {
    id: 'scoring',
    q: 'How is a bracket scored?',
    a: 'Each correct pick earns 1 point in the first round, 2 in the second round, 4 in the regional semifinals, 8 in the regional finals, 16 in the national semifinals and 32 for the championship match. A perfect bracket scores 192 points.',
  },
  {
    id: 'ties',
    q: 'How are ties broken?',
    a: 'With your bracket you predict the total points scored by both teams across all sets of the championship match. The closest prediction ranks higher, whether it is over or under. If brackets are still tied, the one with more points in the latest rounds ranks higher, working back from the championship match. If they are still tied after that, the prize is split equally.',
  },
  {
    id: 'groups',
    q: 'Can I play against my friends?',
    a: 'Yes. Before picks lock, create a group in the app and share its invite link, and your group gets its own leaderboard. Everyone still plays one bracket, which counts in every group they join and on the main leaderboard. Groups have no prize of their own.',
  },
  {
    id: 'entries',
    q: 'How many brackets can I enter?',
    a: 'One. The limit is one bracket per person and one VOLI account per person.',
  },
  {
    id: 'official',
    q: "Is this the NCAA's official bracket game?",
    a: 'No. The College Volleyball Bracket Challenge is run by VOLI, an independent volleyball app. It is not affiliated with, sponsored by or endorsed by the NCAA.',
  },
];
