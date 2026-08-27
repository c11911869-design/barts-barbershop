import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://www.bartsbarbershop.org',
  output: 'static',
  integrations: [
    mdx(),
    // The feedback form is an internal review tool, not public marketing content.
    sitemap({ filter: (page) => !page.includes('/feedback') }),
  ],
});
