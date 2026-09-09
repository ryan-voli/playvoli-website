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
    // resvg is a native binding; Vite must not try to transform it.
    ssr: {
      external: ['@resvg/resvg-js'],
    },
  },
});
