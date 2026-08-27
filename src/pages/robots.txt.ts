import type { APIRoute } from 'astro';
import { business } from '../data/business';

export const GET: APIRoute = () =>
  new Response(
    `User-agent: *
Allow: /

Sitemap: ${new URL('/sitemap-index.xml', business.siteUrl).toString()}
`,
    {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
      },
    },
  );
