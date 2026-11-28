import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';

export default defineConfig({
  output: 'static',
  // Addresses that moved. The home page is the app page now, and About holds
  // the questions, the partners, the roadmap and the contact block as sections.
  // Full addresses in Location (search consoles read a bare "/" as a soft
  // signal). The old site's /app/* pages still get search clicks.
  redirects: {
    '/app': 'https://playvoli.com/', '/get': 'https://playvoli.com/',
    '/app/bracket': 'https://playvoli.com/bracket',
    '/app/fantasy': 'https://playvoli.com/fantasy',
    '/app/rankings': 'https://playvoli.com/rankings',
    '/app/about': 'https://playvoli.com/about',
    '/poll': 'https://playvoli.com/rankings',
    '/mobileapp': 'https://playvoli.com/',
    '/faq': 'https://playvoli.com/about#faq',
    '/contact': 'https://playvoli.com/about#contact',
    '/whats-next': 'https://playvoli.com/about#whats-next',
    '/partners': 'https://playvoli.com/about#partners',
    '/creatorscourt': 'https://playvoli.com/partner',
  },
  // One address per page: /bracket/ redirects to /bracket instead of serving
  // a duplicate. The adapter writes this as a redirect route for Vercel.
  trailingSlash: 'never',
  // satori loads harfbuzz's wasm from node_modules at RUNTIME, and Vercel's
  // function bundle only carries what it can see statically — so the route
  // rendered locally and died in production with ENOENT on hb.wasm.
  // includeFiles copies it into the bundle at the same path it looks for.
  adapter: vercel({
    includeFiles: ['./node_modules/harfbuzzjs/hb.wasm'],
  }),
  server: { port: 8080 },
  vite: {
    build: {
      assetsInlineLimit: 0,
    },
    // satori and resvg-wasm are both pure JS/WASM — nothing to externalise.
  },
});
