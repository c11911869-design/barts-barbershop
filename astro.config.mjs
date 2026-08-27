import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://www.bartsbarbershop.org',
  output: 'static',
  integrations: [mdx(), sitemap()],
});
