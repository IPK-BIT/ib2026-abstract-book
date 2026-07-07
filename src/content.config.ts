import { z, defineCollection, reference } from 'astro:content';
import { glob, file } from 'astro/loaders'; // <-- Added loaders for local files
import { docsLoader } from '@astrojs/starlight/loaders'; // <-- Added Starlight's official content layer loader
import { docsSchema } from '@astrojs/starlight/schema';

const authors = defineCollection({
  // Use glob or file loader depending on how your data files are stored
  loader: glob({ pattern: '**/*.{json,yaml,yml}', base: './src/content/authors' }),
  schema: ({ image }) => z.object({
    name: z.string(),
    image: image().optional(),
    socials: z.array(
      z.object({
        icon: z.string(),
        href: z.string().url(),
      })
    ).optional(),
    styling: z.object({
      text: z.string().max(3),
      color: z.string(),
      background: z.string(),
    }).partial().optional(),
    affiliation: z.string().optional(),
  }),
});

// Correctly defined using the Starlight content layer loader
const extendedDocsSchema = defineCollection({
  loader: docsLoader(), // <-- Essential for Starlight to discover your Markdown files
  schema: docsSchema({
    extend: z.object({
      authors: z.array(reference('authors')).optional(),
    }),
  })
});

const contributionSchema = z.object({
  time: z.string(), 
  title: z.string(),
  speaker: z.string().optional(),
  abstractSlug: z.string().optional(),
  type: z.enum(['Keynote', 'Full Talk', 'Poster', 'Panel', 'Break']),
  location: z.string().optional(),
});

const scheduleCollection = defineCollection({
  loader: glob({ pattern: '**/*.{json,yaml,yml}', base: './src/content/schedule' }),
  schema: z.object({
    days: z.array(z.object({
      date: z.string(),
      label: z.string(), 
      slots: z.array(z.object({
        time: z.string(), 
        title: z.string(), 
        description: z.string().optional(),
        chair: z.string().optional(), 
        location: z.string().optional(),
        type: z.enum(['Keynote', 'Full Talk', 'Poster', 'Panel', 'Break']).optional(), 
        contributions: z.array(contributionSchema).optional(), 
      }))
    }))
  })
});

export const collections = {
  docs: extendedDocsSchema,
  authors: authors,
  schedule: scheduleCollection,
};