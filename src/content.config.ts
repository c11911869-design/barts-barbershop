import { glob } from 'astro/loaders';
import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';

const services = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/services' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    price: z.string(),
    duration: z.string(),
    featured: z.boolean().default(false),
    order: z.number(),
  }),
});

const team = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/team' }),
  schema: ({ image }) =>
    z.object({
      name: z.string(),
      role: z.string(),
      bio: z.string(),
      image: image(),
      imageAlt: z.string(),
      specialties: z.array(z.string()),
      order: z.number(),
    }),
});

const gallery = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/gallery' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      alt: z.string(),
      image: image(),
      category: z.string(),
      credit: z.string().optional(),
      sourceUrl: z.url().optional(),
      license: z.string().optional(),
      order: z.number(),
    }),
});

const faqs = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/faqs' }),
  schema: z.object({
    question: z.string(),
    answer: z.string(),
    order: z.number(),
  }),
});

export const collections = { services, team, gallery, faqs };
