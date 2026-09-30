import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';
import sitemap from '@astrojs/sitemap';

// Private, account-only, redirect and app deep-link shell pages stay out of
// the sitemap. /oauth-callback is the phone app's login return: never list it.
const SITEMAP_EXCLUDE = [
  '/oauth-callback', '/auth', '/profile', '/confirmation', '/download',
  '/game', '/podcast', '/league', '/dailygrid', '/poll', '/get', '/404', '/api',
];

export default defineConfig({
  site: 'https://playvoli.com',
  output: 'static',
  integrations: [
    sitemap({
      filter: (page) => {
        const path = new URL(page).pathname.replace(/\/+$/, '') || '/';
        return !SITEMAP_EXCLUDE.some((p) => path === p || path.startsWith(p + '/') || (p === '/auth' && path.startsWith('/auth')));
      },
      // Match the pages' canonical URLs, which carry no trailing slash.
      serialize: (item) => ({ ...item, url: item.url.replace(/(?<=[^/])\/+$/, '').replace(/^(https:\/\/playvoli\.com)$/, '$1/') }),
    }),
  ],
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
