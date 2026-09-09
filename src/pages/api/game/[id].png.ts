import { gameCard } from '../../../lib/game-card';

/* LEGACY — /api/game/<game_id>.png.
 *
 * The card moved to /api/card/game/<id>.png when the API grew a kind
 * segment. This stays because the URL is already pasted into forum posts,
 * and a dead image in a thread is worse than a spare route file. It renders
 * the same card; nothing new should link here.
 */
export const prerender = false;
export const GET = gameCard('png');
