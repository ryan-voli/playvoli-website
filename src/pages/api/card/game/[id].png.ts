import { gameCard } from '../../../../lib/game-card';

/* /api/card/game/<game_id>.png
 *
 * The route is a name; the renderer lives in lib/game-card.ts so the other
 * API kinds (data, embed) can address the same uuids without importing an
 * image endpoint to do it.
 *
 * Prefer the .webp sibling where it is an option — same pixels, a fifth of
 * the bytes. This one stays for anywhere that still wants a PNG. */
export const prerender = false;
export const GET = gameCard('png');
