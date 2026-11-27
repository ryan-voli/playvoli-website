// The cut-out cards in /images/splash/: pieces of real app screens, each a
// rounded card on a black ground. `rad` is the card's own corner as a share
// of its width / height: it trims the ground off so the sticker and its hard
// offset keep the card's shape.

export interface Cutout {
  src: string;
  width: number;
  height: number;
  rad: string;
  alt: string;
}

export const CUTOUTS = {
  'card-fantasy': {
    src: '/images/splash/card-fantasy.webp', width: 900, height: 756, rad: '4.8% / 5.7%',
    alt: 'VOLI app fantasy player card: a $24.2K price for round 4, 157.83 season points, average per round, value, rostered share and points by round',
  },
  'card-game': {
    src: '/images/splash/card-game.webp', width: 900, height: 296, rad: '5.8% / 17.6%',
    alt: "VOLI app game card for LSU at Tennessee, with each team's chance to win before first serve",
  },
  'card-stats': {
    src: '/images/splash/card-stats.webp', width: 900, height: 399, rad: '5.8% / 13.1%',
    alt: 'VOLI app player card for UCLA setter Kate Duffey: team hitting efficiency, assists, aces, blocks and digs, in totals and per set',
  },
  'float-final': {
    src: '/images/splash/float-final.webp', width: 760, height: 397, rad: '4.75% / 9.1%',
    alt: 'VOLI app final score: Pitt beat SMU in three sets, 25-12, 25-21 and 26-24',
  },
  'float-rank': {
    src: '/images/splash/float-rank.webp', width: 760, height: 132, rad: '4.75% / 27.3%',
    alt: 'VOLI app ranking row: Nebraska, ranked first, with its overall record, conference record and poll points',
  },
  'float-article': {
    src: '/images/splash/float-article.webp', width: 760, height: 468, rad: '4.1% / 6.6%',
    alt: 'VOLI app news feed: a story about Nebraska volleyball, tagged NCAA, Big Ten and UNL, with its author',
  },
  'float-chat': {
    src: '/images/splash/float-chat.webp', width: 760, height: 117, rad: '4.9% / 31.6%',
    alt: "VOLI app chat list: the NCAA fan room with its latest message",
  },
  'float-pct': {
    src: '/images/splash/float-pct.webp', width: 760, height: 392, rad: '4.75% / 9.2%',
    alt: "VOLI app EVOLLVE analytics card: a setter's RAPM of +0.40, 95th percentile among Division I setters, with strongest and weakest skills",
  },
  'float-oregon': {
    src: '/images/splash/float-oregon.webp', width: 760, height: 337, rad: '6.1% / 13.8%',
    alt: 'VOLI app team card for Oregon: record, hitting efficiency, kills, aces and blocks, in totals and per set',
  },
  'float-tile': {
    src: '/images/splash/float-tile.webp', width: 585, height: 703, rad: '7.9% / 6.6%',
    alt: 'VOLI app analytics tile: a team hitting percentage of .243, the Division I and Big Ten averages, and its percentile in each',
  },
} as const satisfies Record<string, Cutout>;

export type CutoutKey = keyof typeof CUTOUTS;
