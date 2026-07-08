import { defineCollection, reference } from 'astro:content';
import { z } from 'astro/zod';
import { glob, file } from 'astro/loaders'; // <-- Added loaders for local files
import { docsLoader } from '@astrojs/starlight/loaders'; // <-- Added Starlight's official content layer loader
import { docsSchema } from '@astrojs/starlight/schema';
import fs from 'node:fs/promises';
// @ts-expect-error - package does not ship TypeScript declarations
import { toJSON } from '@orcid/bibtex-parse-js';

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

const bibtexLoader = (filePath: string) => {
  return {
    name: 'bibtex-loader',
    load: async ({ store, logger }: { store: any; logger: any }) => {
      try {
        const rawBib = await fs.readFile(filePath, 'utf-8');
        // Converts BibTeX string format directly to JSON array entries
        const parsedEntries = toJSON(rawBib);

        store.clear();
        for (const entry of parsedEntries) {
          // BibTeX keys are natively case-insensitive; force lowercase matching
          const id = entry.citationKey.toLowerCase();
          
          store.set({
            id: id,
            data: {
              type: entry.entryType,
              ...entry.entryTags,
            },
          });
        }
      } catch (error: any) {
        logger.error(`Failed to build BibTeX database: ${error.message}`);
      }
    },
  };
};

const referencesCollection = defineCollection({
  loader: bibtexLoader('./src/content/references/collection.bib'), // Location of your bib file
  schema: z.object({
    type: z.string(),
    title: z.string().optional(),
    author: z.string().optional(),
    journal: z.string().optional(),
    year: z.string().optional(),
    volume: z.string().optional(),
    number: z.string().optional(),
    pages: z.string().optional(),
    doi: z.string().optional(),
    url: z.string().optional(),
  }).passthrough(), // .passthrough() ensures custom fields like 'booktitle' don't crash validation
});

// Correctly defined using the Starlight content layer loader
const extendedDocsSchema = defineCollection({
  loader: docsLoader(), // <-- Essential for Starlight to discover your Markdown files
  schema: docsSchema({
    extend: z.object({
      authors: z.array(reference('authors')).optional(),
      references: z.array(reference('references')).optional(),
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
  references: referencesCollection,
};