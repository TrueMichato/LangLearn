# LangLearn

A kind language-learning PWA with offline support and spaced repetition.

## Tech Stack

- **React 19** + **TypeScript** — UI framework
- **Vite 8** + **vite-plugin-pwa** — build tooling & service worker
- **Tailwind CSS 4** — styling
- **Zustand** — state management
- **Dexie (IndexedDB)** — offline-first data storage
- **Vitest** — unit tests

## Getting Started

```bash
npm install --legacy-peer-deps
npm run dev
```

## Build

```bash
npm run build    # TypeScript check + Vite production build
npm run preview  # Preview the production build locally
```

## Tests

```bash
npm test
```

## Deployment

The app is deployed to **GitHub Pages** via a workflow in `.github/workflows/`.
The `base` path in `vite.config.ts` is set to `/langlearn/` to match the
GitHub Pages URL.
