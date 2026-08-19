import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';

export default defineConfig({
  output: 'static',
  adapter: vercel(),

  // /whats-next is hidden while the roadmap is rewritten (the page itself is
  // parked at src/pages/_whats-next.astro, which Astro's router ignores).
  // Shared links and anything already indexed land on /about instead of a
  // 404 — which matters right now, with sponsorship traffic arriving.
  //
  // 302, not 301: the page is coming back, and a permanent redirect would
  // tell search engines to drop the URL for good.
  redirects: {
    '/whats-next': { status: 302, destination: '/about' },
  },
  server: { port: 8080 },
  vite: {
    build: {
      assetsInlineLimit: 0,
    },
  },
});
