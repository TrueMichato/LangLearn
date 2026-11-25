import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { parseGrammarCardSources } from './src/lib/grammar-cards'
import { REVIEWED_GRAMMAR_LESSONS } from './src/lib/grammar-reviewed'

const ruleIdsModule = 'virtual:grammar-rule-ids'

export default defineConfig({
  base: '/LangLearn/',
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'grammar-rule-ids',
      resolveId(id) {
        if (id === ruleIdsModule) return `\0${id}`
      },
      load(id) {
        if (id !== `\0${ruleIdsModule}`) return
        // Only stable IDs ship in JS. Review must work without loading a lesson.
        const ruleIds: Record<string, string[]> = {}
        for (const [language, lessons] of Object.entries(REVIEWED_GRAMMAR_LESSONS)) {
          for (const lesson of lessons) {
            const key = `${language}/${lesson}`
            const path = fileURLToPath(new URL(`./public/content/grammar/${key}.md`, import.meta.url))
            this.addWatchFile(path)
            const { items, diagnostics } = parseGrammarCardSources(readFileSync(path, 'utf8'))
            if (diagnostics.length) this.error(`${key}: ${diagnostics[0].message}`)
            ruleIds[key] = items.flatMap(item => item.kind === 'concept' && item.id ? [item.id] : [])
          }
        }
        return `export default ${JSON.stringify(ruleIds)}`
      },
    },
    VitePWA({
      registerType: 'prompt',
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'LangLearn',
        short_name: 'LangLearn',
        description: 'A kind language learning PWA',
        theme_color: '#4f46e5',
        background_color: '#f8fafc',
        display: 'standalone',
        scope: '/LangLearn/',
        start_url: '/LangLearn/',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      injectManifest: {
        globPatterns: [
          '**/*.{js,css,html,ico,png,svg,woff2}',
          ...Object.entries(REVIEWED_GRAMMAR_LESSONS).flatMap(([lang, ids]) =>
            ids.map((id) => `content/grammar/${lang}/${id}.md`)),
        ],
        // The app bundles static learning data for every language, so the main
        // chunk exceeds workbox's 2 MiB default. Raise the precache limit.
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
      },
    }),
  ],
})
