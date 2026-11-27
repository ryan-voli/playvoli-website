import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';

export default defineConfig({
  output: 'static',
  // Addresses that moved. The home page is the app page now, and About holds
  // the questions, the partners, the roadmap and the contact block as sections.
  redirects: {
    '/app': '/', '/get': '/', '/poll': '/rankings',
    '/mobileapp': '/',
    '/faq': '/about#faq',
    '/contact': '/about#contact',
    '/whats-next': '/about#whats-next',
    '/partners': '/about#partners',
  },
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
