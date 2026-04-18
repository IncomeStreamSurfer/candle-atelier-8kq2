// @ts-check
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  output: 'server',
  adapter: vercel(),
  site: 'https://candle-atelier.vercel.app',
  vite: {
    plugins: [tailwindcss()],
  },
});
