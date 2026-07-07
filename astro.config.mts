// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import starlightOpenAPI, { openAPISidebarGroups } from 'starlight-openapi'
import rehypeSlug from 'rehype-slug';
import { rehypeAutolink } from './plugins/rehype-autolink';
import tailwind from '@astrojs/tailwind';
import starlightLinksValidator from 'starlight-links-validator'
import starlightImageZoom from 'starlight-image-zoom'
import icon from "astro-icon";

import react from '@astrojs/react';

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
					autogenerate: { directory: 'guides' },
				},
				{
					label: 'Abstracts',
					autogenerate: { directory: 'abstracts' },
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
		tailwind({
			// Disable the default base styles:
			applyBaseStyles: false,
		}),
		react()],
	markdown: {
		rehypePlugins: [rehypeSlug, ...rehypeAutolink()],
	},
});
