import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';

export default defineConfig({
  output: 'static',
  adapter: vercel(),
  server: { port: 8080 },
  vite: {
    build: {
      assetsInlineLimit: 0,
    },
    // satori and resvg-wasm are both pure JS/WASM — nothing to externalise.
  },
});
