# Bart's Barber Shop Website

Modern static Astro website for Bart's Barber Shop. The site is built for low-maintenance static hosting with Astro, TypeScript, Tailwind CSS, Markdown content collections, local SEO metadata, sitemap, robots.txt, and JSON-LD structured data.

## Tech Stack

- Astro static output
- TypeScript
- Tailwind CSS via `@tailwindcss/postcss`
- Markdown/MDX-ready content collections
- No CMS, database, or required client-side JavaScript

## Install

```bash
npm install
```

## Local Development

```bash
npm run dev
```

Astro will print a local URL, usually `http://localhost:4321`.

## Build

```bash
npm run build
```

This runs `astro check` and then generates the static site in `dist/`.

## Preview

```bash
npm run preview
```

This serves the production build locally after `npm run build`.

## Repository

The canonical remote is:

- `https://github.com/c11911869-design/barts-barbershop` (private)

Node version is pinned to 22 in `.nvmrc` so local and CI builds match.

## Cloudflare Deployment

The site is deployed as a **Cloudflare Worker with static assets**, not as a
Pages project. The Cloudflare dashboard's current "Create application" flow
produces a Worker, and Workers do not read the Pages `functions/` convention.

Configuration lives in `wrangler.jsonc`:

- `assets.directory` points at the Astro `dist/` output
- `main` points at `worker/index.ts`

Requests matching a built file are served straight from the asset store without
invoking the Worker. Everything else falls through to `worker/index.ts`, which
is how `/api/feedback` is reached.

### Build settings

Set in the Cloudflare dashboard under Settings -> Build:

- Build command: `npm run build`
- Deploy command: `npx wrangler deploy`
- Root directory: `/`

The deploy command must not be left to autodetect. Without `wrangler.jsonc`
present, `wrangler deploy` tries to convert the project to the Astro SSR
adapter mid-build and fails.

### Response headers

`public/_headers` is copied verbatim into `dist/` at build time. It currently
sends `X-Robots-Tag: noindex, nofollow` so the pre-launch review deployment
cannot compete with the live `bartsbarbershop.org` site in search results.

Remove that one line at launch. Leave the remaining security headers in place.

## Content Editing

Editable content lives in:

- `src/content/services/` for service cards, descriptions, prices, and durations
- `src/content/team/` for barber/team profiles
- `src/content/gallery/` for gallery metadata and image references
- `src/content/faqs/` for FAQ questions and answers
- `src/data/business.ts` for business name, URL, address, phone, hours, coordinates, directions, and social/profile links

Original website photos live in:

- `src/assets/original-site/`

Unused placeholder images live in:

- `src/assets/gallery/`
- `public/images/`
- `public/og-image.svg`

The active gallery uses original website photos from `src/assets/original-site/`.

## TODO Before Launch

- Remove the `X-Robots-Tag: noindex, nofollow` line from `public/_headers`.
- Point `site` in `astro.config.mjs` at the final production domain.
- Move DNS for the production domain (currently hosted at Interland).
- Confirm current pricing and service availability.
- Confirm holiday hours and any temporary schedule changes.
- Confirm whether any non-cash payment options should be added in the future.
- Add more detailed individual barber bios if desired.
- Review original website photos and replace or remove any that should not be used on the new site.
- Replace the map placeholder with an embedded Google Map for the verified address.
- Add verified Google Business Profile, Yelp, Facebook, Instagram, or other official profile URLs to `sameAs`.
- Add approved customer reviews.
- Update copy to match the shop's final brand voice.

## Feedback Form and Agent Pipeline

`/feedback/` is a private review form. It is `noindex` and excluded from the
sitemap because it is a review tool, not public marketing content.

### Request flow

1. The visitor completes the form and a Cloudflare Turnstile challenge.
2. `worker/index.ts` verifies the Turnstile token, checks a honeypot field,
   and validates lengths.
3. A GitHub issue is filed with the `client-feedback` label.
4. A notification email is sent through Resend. Email failure is logged but does
   not fail the request, because the issue is already the durable record.

### Why approval is manual

The form does not apply the `approved` label, and the agent workflow only fires
on that label. Turnstile stops bots, not a determined person who finds the URL,
so a human decides what becomes paid agent work.

### Worker environment variables

Set these under Settings -> Variables and Secrets. Mark everything except
`PUBLIC_TURNSTILE_SITE_KEY` as encrypted:

| Variable | Purpose |
| --- | --- |
| `PUBLIC_TURNSTILE_SITE_KEY` | Public widget key, baked into the HTML at build time |
| `TURNSTILE_SECRET_KEY` | Server-side Turnstile verification |
| `FEEDBACK_GITHUB_TOKEN` | Fine-grained PAT, Issues read/write, this repo only |
| `FEEDBACK_GITHUB_REPO` | `c11911869-design/barts-barbershop` |
| `RESEND_API_KEY` | Resend API key |
| `FEEDBACK_TO_EMAIL` | Where notifications are delivered |
| `FEEDBACK_FROM_EMAIL` | Verified Resend sender |
| `FEEDBACK_PASSCODE` | Optional shared access code |

### GitHub Actions secrets

| Secret | Purpose |
| --- | --- |
| `ANTHROPIC_API_KEY` | Used by both agent workflows |

### Workflows

- `ci.yml` type checks and builds every pull request, and asserts that
  `dist/_headers` still carries the noindex directive.
- `feedback-agent.yml` fires on the `approved` label, implements the change on a
  `feedback/issue-N` branch, and opens a pull request. It never pushes to `main`.
- `claude-review.yml` reviews those pull requests for factual drift,
  accessibility, SEO, and scope creep. It does not approve or merge.

Local development uses `.dev.vars`, which is gitignored. See `.env.example`.

## Generated SEO Assets

- Sitemap is generated by `@astrojs/sitemap`.
- Robots file is generated at `/robots.txt`.
- Every page has a unique title, description, canonical URL, Open Graph metadata, and Twitter metadata.
- LocalBusiness / BarberShop JSON-LD is included on pages.
- FAQ JSON-LD is included on the FAQ page.
