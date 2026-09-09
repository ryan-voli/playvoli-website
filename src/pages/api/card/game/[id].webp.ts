import { gameCard } from '../../../../lib/game-card';

/* /api/card/game/<game_id>.webp — the same card, losslessly encoded.
 *
 * The one to paste. Identical pixels to the .png and about a fifth of the
 * bytes, which matters more here than anywhere else on the site: the card is
 * served no-store on purpose, so every reader of a thread downloads it
 * again, every time. */
export const prerender = false;
export const GET = gameCard('webp');
