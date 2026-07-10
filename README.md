# IB 2026 Abstract Book

This repository contains the Astro-based abstract book for the IB 2026 conference. It is built with Starlight and custom components for browsing abstracts, authors, references, and the event schedule.

## What’s Included

- Abstract and guide pages powered by Astro Content Collections and Starlight
- Author profiles and styling data in YAML files
- A bibliography-backed reference collection from BibTeX
- Schedule data for the program overview
- Interactive UI components for maps, schedules, citations, and author cards

## Tech Stack

- [Astro](https://astro.build/)
- [Starlight](https://starlight.astro.build/)
- React for interactive components
- Tailwind CSS v4
- Leaflet for map-based interactions
- Mermaid for diagram support

## Getting Started

### Prerequisites

- Node.js 20 or newer
- npm

### Install Dependencies

```bash
npm install
```

### Start the Development Server

```bash
npm run dev
```

The site will be available in the local Astro dev server, usually at `http://localhost:4321`.

### Build for Production

```bash
npm run build
```

### Preview the Production Build

```bash
npm run preview
```

## Available Scripts

- `npm run dev` - start the Astro development server
- `npm run start` - alias for `npm run dev`
- `npm run build` - create a production build
- `npm run preview` - preview the production build locally
- `npm run astro` - run the Astro CLI directly

## Repository Structure

```text
src/content/docs/       Starlight docs content, including abstracts and guides
src/content/authors/    Author metadata files
src/content/references/ BibTeX source used for the reference collection
src/content/schedule/   Program and schedule data
src/components/         Shared Astro and React components
src/styles/             Global Tailwind and custom styles
public/                 Static assets
plugins/                Local Astro/Vite plugins
```

## Content Model

The site uses Astro content collections defined in `src/content.config.ts`:

- `docs` for the Starlight documentation and abstract pages
- `authors` for author metadata and profile styling
- `references` for BibTeX-backed citations
- `schedule` for the program schedule

If you add new content, keep the data in the matching collection folder so it is picked up automatically.

## Configuration Notes

- The site is configured with a base path of `/ib2026-abstract-book`, which is important for deployment.
- Starlight navigation is split into guides and abstracts.
- Custom components and CSS are wired in through `astro.config.mts`.

## Contributing

Please keep edits focused and consistent with the existing content model. If you add or rename content files, make sure related references and navigation entries still resolve correctly.
