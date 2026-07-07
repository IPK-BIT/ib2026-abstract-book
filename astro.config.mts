// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import starlightOpenAPI, { openAPISidebarGroups } from 'starlight-openapi'
import { unified } from '@astrojs/markdown-remark'; 
import rehypeSlug from 'rehype-slug';
import { rehypeAutolink } from './plugins/rehype-autolink';
import tailwindcss from '@tailwindcss/vite'; // <-- Modern Tailwind v4 Vite compiler plugin
import starlightLinksValidator from 'starlight-links-validator'
import starlightImageZoom from 'starlight-image-zoom'
import icon from "astro-icon";

import react from '@astrojs/react';

// Safely execute the plugin helper and handle typing mismatches after upgrades
const extraRehypePlugins = /** @type {any} */ (rehypeAutolink()) || [];

// https://astro.build/config
export default defineConfig({
    base: '/ib2026-abstract-book',
    integrations: [
        icon(),
        starlight({
            title: 'nfdi4ls',
            favicon: "favicon.png",
            customCss: [
                // Relative path to your custom CSS file
                './src/styles/tailwind.css',
                './src/styles/custom.css',
            ],
            components: {
                MarkdownContent: '@components/starlight/MarkdownContent.astro',
                Footer: '@components/starlight/Footer.astro',
            },
            editLink: {
                baseUrl: 'https://github.com/IPK-BIT/edal-pgp-knowledgebase/edit/main/'
            },
            social: [
                { icon: 'github', href: 'https://github.com/IPK-BIT/edal-pgp-knowledgebase', label: 'GitHub' },
            ],
            plugins: [
                starlightLinksValidator(),
                starlightImageZoom()
            ],
            sidebar: [
                {
                    label: 'Guides',
                    collapsed: true,
                    items: [
                        { autogenerate: { directory: 'guides' } },
                    ]
                },
                {
                    label: 'Abstracts',
                    items: [
                        { autogenerate: { directory: 'abstracts' } }
                    ],
                }
            ],
            expressiveCode: {
                defaultProps: {
                    // Enable wrap for specific languages
                    overridesByLang: {
                        'txt,md,bash': { wrap: true },
                    },
                },
            },
        }),
        react() // Old tailwind() integration completely removed from here
    ],
    markdown: {
        // Leverages the modern pluggable markdown pipeline config structure
        processor: unified({
            rehypePlugins: [
                rehypeSlug, 
                ...extraRehypePlugins
            ],
        }),
    },
    vite: {
        plugins: [
            tailwindcss() // <-- Handles Tailwind v4 compilation cleanly inside Vite
        ],
        resolve: {
            // Forces Vite to process CSS assets imported by tailwind / starlight packages across all environments
            noExternal: ['@astrojs/starlight-tailwind'],
        },
    },
});