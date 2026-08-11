// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import { unified } from '@astrojs/markdown-remark'; 
import rehypeSlug from 'rehype-slug';
import { rehypeAutolink } from './plugins/rehype-autolink';
import tailwindcss from '@tailwindcss/vite';
import starlightLinksValidator from 'starlight-links-validator'
import starlightImageZoom from 'starlight-image-zoom'
import icon from "astro-icon";
import starlightUiTweaks from 'starlight-ui-tweaks';

import react from '@astrojs/react';

const extraRehypePlugins = /** @type {any} */ (rehypeAutolink()) || [];

export default defineConfig({
    base: '/ib2026-abstract-book',
    integrations: [
        icon(),
        starlight({
            title: 'nfdi4ls',
            favicon: "favicon.png",
            customCss: [
                './src/styles/tailwind.css',
                './src/styles/custom.css',
            ],
            components: {
                MarkdownContent: '@components/starlight/MarkdownContent.astro',
                Footer: '@components/starlight/Footer.astro',
            },
            editLink: {
                baseUrl: 'https://github.com/IPK-BIT/ib2026-abstract-book/edit/main/'
            },
            social: [
                { icon: 'github', href: 'https://github.com/IPK-BIT/ib2026-abstract-book', label: 'GitHub' },
            ],
            plugins: [
                starlightLinksValidator(),
                starlightImageZoom(),
                starlightUiTweaks({
                    navbarLinks: [
                        { label: 'My Bookmarks', href: '/ib2026-abstract-book/bookmarks/'}
                    ]
                }),
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
                    overridesByLang: {
                        'txt,md,bash': { wrap: true },
                    },
                },
            },
        }),
        react()
    ],
    markdown: {
        processor: unified({
            rehypePlugins: [
                rehypeSlug, 
                ...extraRehypePlugins
            ],
        }),
    },
    vite: {
        plugins: [
            tailwindcss()
        ],
        resolve: {
            noExternal: ['@astrojs/starlight-tailwind'],
        },
    },
});