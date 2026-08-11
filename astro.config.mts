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
import { VitePWA } from 'vite-plugin-pwa';

import react from '@astrojs/react';

const extraRehypePlugins = /** @type {any} */ (rehypeAutolink()) || [];

export default defineConfig({
    base: '/ib2026-abstract-book',
    integrations: [
        icon(),
        starlight({
            title: 'nfdi4ls',
            favicon: "favicon.png",
            head: [
                {
                    tag: 'link',
                    attrs: {
                        rel: 'manifest',
                        href: '/ib2026-abstract-book/manifest.webmanifest',
                    },
                },
                {
                    tag: 'script',
                    attrs: {
                        type: 'module',
                    },
                    content: `if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/ib2026-abstract-book/sw.js', { scope: '/ib2026-abstract-book/' });
  });
}`,
                },
            ],
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
            tailwindcss(),
            // Add VitePWA plugin configuration here
            VitePWA({
                registerType: 'autoUpdate',
                injectRegister: false,
                workbox: {
                    globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
                    navigateFallback: '/ib2026-abstract-book/',
                },
                manifest: {
                    name: 'nfdi4ls Abstract Book',
                    short_name: 'Abstract Book',
                    description: 'nfdi4ls conference abstract book application',
                    theme_color: '#ffffff',
                    background_color: '#ffffff',
                    display: 'standalone',
                    start_url: '/ib2026-abstract-book/',
                    scope: '/ib2026-abstract-book/',
                    icons: [
                        {
                            src: '/ib2026-abstract-book/favicon.svg',
                            sizes: '192x192',
                            type: 'image/svg+xml'
                        },
                        {
                            src: '/ib2026-abstract-book/favicon.svg',
                            sizes: '512x512',
                            type: 'image/svg+xml',
                            purpose: 'any maskable'
                        }
                    ]
                }
            })
        ],
        resolve: {
            noExternal: ['@astrojs/starlight-tailwind'],
        },
    },
});