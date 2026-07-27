# AGENTS.md — LangLearn

IMPORTANT: Prefer retrieval-led reasoning over pre-training-led reasoning for any LangLearn tasks. Consult the codebase and this file before relying on assumptions.

## Project Overview

LangLearn is a local-first Progressive Web App for learning languages (Japanese, Russian, Portuguese, Spanish, Arabic, extensible). "Kind learning" philosophy — rewards effort, no penalties for mistakes. Deployed at `https://truemichato.github.io/LangLearn/`.

## Tech Stack

| Layer | Tech | Notes |
|-------|------|-------|
| Framework | React 19 + TypeScript 6 | Vite 8 bundler |
| Styling | Tailwind CSS v4 | Class-based dark mode |
| Database | Dexie.js v4 (IndexedDB) | Schema v8, 10 tables |
| State | Zustand | localStorage persistence |
| Routing | react-router-dom HashRouter | Required for GitHub Pages |
| PWA | vite-plugin-pwa | registerType: 'prompt' |
| Base path | `/LangLearn/` | All fetches use `import.meta.env.BASE_URL` |

## Commands

```
npm run build     # tsc -b && vite build
npx tsc --noEmit  # Type-check only
npm test          # vitest run (67 tests)
npm run dev       # Dev server
npm run lint      # ESLint
```

## Critical Conventions

1. **Content fetching** — ALWAYS prefix with `import.meta.env.BASE_URL`: `` fetch(`${import.meta.env.BASE_URL}content/grammar/ja/index.json`) ``
2. **Dark mode** — Every component MUST have `dark:` variants on all colors. Black text on dark bg is the #1 recurring bug.
3. **Language codes** — Use 2-letter codes internally (`ja`, `ru`, `pt`, `es`, `ar`). Display via `getLanguageLabel(code)` from `src/lib/languages.ts`. Never hardcode "Japanese" or "JA".
   - **RTL** — Arabic (`ar`) is right-to-left. Set `rtl: true` on the language in `src/lib/languages.ts` and mark every element that renders *target-language* text with `dir` via `isRTL`/`rtlProps` from `src/lib/rtl.ts` (flashcards, reader, grammar examples, sentence tiles, cloze, vocab, dictation, translation, lyrics). Leave English-primary grammar prose LTR.
   - **Arabic dialects** — one `ar` code = MSA shared core; `arabicDialect` + `arabicColloquialFocus` settings surface dialect-tagged content (see `src/lib/arabic-dialects.ts`). Dialect vocab lessons carry a `dialect` field in their index entry; `VocabLessons.tsx` filters to MSA + the chosen dialect (hiding other dialects), badges dialect lessons, and — with colloquial focus on — surfaces colloquial lessons first (locking is reindexed to the visible list).
4. **DB queries** — Only `.where()` on INDEXED fields. Non-indexed → `.toArray()` then `.filter()`. Check `src/db/schema.ts` for indexes.
5. **DB migrations** — Never modify existing version stores. Always add `db.version(N+1)`.
6. **XP recording** — Two sources: timer auto-records to `studySessions` table; bonus XP via `useXPStore.getState().addXP(amount)`. Dashboard sums both.
7. **Touch targets** — Min 44px: `min-h-[44px]`.
8. **Canvas DPR** — When using `ctx.scale(dpr, dpr)`, coordinates must use CSS dimensions not physical pixels.

## Architecture Map

```
src/
├── App.tsx              # Router (19 routes), ErrorBoundary wrapper
├── pages/               # 19 route pages
│   ├── Dashboard.tsx    # Home — stats, vocab size widget, streak, badges, heat map
│   ├── Review.tsx       # SRS review — 6 card types (incl. grammar), keyboard shortcuts
│   ├── Words.tsx        # Vocabulary browser — search, filter, study sets, CSV import
│   ├── Reader.tsx       # Immersion reader — furigana, word status highlighting, word mining
│   ├── Learn.tsx        # Hub → Grammar, Letters, Vocab, Sentences, Conjugations, Listening, Music, Translation, Minimal Pairs, Numbers, Tests
│   ├── Grammar.tsx      # Grammar lesson browser + LessonView (auto-creates SRS grammar cards)
│   ├── VocabLessons.tsx # Vocabulary lesson browser
│   ├── LetterPractice.tsx # Letter chart/draw/quiz per alphabet
│   ├── Tests.tsx        # Proficiency tests (vocab/grammar/mixed/full)
│   ├── Conjugations.tsx # Verb conjugation & noun declension drills
│   ├── SentenceBuilder.tsx # Tile/typing sentence practice
│   ├── Listening.tsx    # TTS passages + comprehension + dictation mode
│   ├── Lyrics.tsx       # Song lyrics learning (anime openings, popular songs)
│   ├── TranslationPractice.tsx # English→target language translation with self-assessment
│   ├── DailyChallenge.tsx # Daily mixed challenge (1.5x XP)
│   ├── Analytics.tsx    # Per-language analytics + reading stats (SVG/CSS charts)
│   └── Settings.tsx     # App config
├── components/          # 17 directories (layout, srs, grammar, vocab, letters, reader, dashboard, badges, analytics, dictionary, drills, sentences, words, lyrics, settings, onboarding, common)
├── stores/              # 6 Zustand stores: settings, timer, review, xp, badge, studySets
├── lib/                 # 23 utility modules (sm2, card-types, xp, streaks, languages, dictionary, tts, tokenizer, analytics, badge-checker, daily-challenge, test-questions, notifications, text-diff, word-status, etc.)
├── db/                  # schema.ts (interfaces + migrations), words.ts (incl. bulkAddWords), reviews.ts, lessons.ts, characters.ts, texts.ts, backup.ts
├── data/                # Static content: alphabets/, badges.ts, conjugations/, listening/, sentences/, lyrics/, lyrics/
├── hooks/               # useBadgeChecker, useDarkMode, useDueCount, useFontSize, useKeyboardShortcuts, useNotificationScheduler
├── types/               # vocab.ts (VocabLesson types)
└── workers/             # kuromoji.worker.ts (Japanese tokenizer)

public/content/          # Runtime-fetched lesson content
├── grammar/{ja,ru,pt,es,ar}/   # 35+ lessons each: index.json + *.md (with <!-- quiz: {...} --> and <!-- grammar-card: {...} --> blocks). grammar-card blocks are SRS metadata, stripped from display by LessonView.
├── vocab/{ja,ru,pt,es,ar}/     # 40 lessons each: index.json + *.json (words + exercises)
├── reading/{ja,ru,pt,es,ar}/   # 10 curated texts each: index.json + *.txt (3 difficulty levels)
└── dict/                # Kuromoji dictionary files
```

## Database Schema (v8) — Indexed Fields

```
words:             ++id, [language+createdAt], [word+language], language, word, createdAt, *tags, type
reviews:           ++id, [wordId+nextReviewDate], wordId, nextReviewDate
texts:             ++id, language, createdAt
studySessions:     ++id, startTime, activity
settings:          key
dailyActivity:     date, goalMet, challengeComplete
lessonProgress:    id, language, lessonId
characterProgress: id, language, mastery
testHistory:       ++id, language, type, score, date
badges:            id, unlockedAt
```

Key interfaces: `Word` (id, language, word, reading, meaning, contextSentence, tags, type:'word'|'letter'|'grammar'), `Review` (wordId, ease, interval, repetitions, nextReviewDate), `LessonProgress` (id='{lang}/{lessonId}', completed, quizScore, attempts), `CharacterProgress` (id='{lang}/{alphabet}/{char}', mastery:'new'|'learning'|'mastered'), `TestHistory` (language, type, score, level), `DailyActivity` (date, studySeconds, cardsReviewed, goalMet, challengeComplete).

## SRS System

SM-2 algorithm in `src/lib/sm2.ts`. Grade 0-2 resets card; grade 3-5 advances interval. 6 card types: classic (rep 0+), reverse/cloze (rep 2+), listening/MC (rep 4+), grammar (always for type='grammar'). MC and cloze auto-grade; others show manual grade buttons. Failed cards re-queue to end. Grammar cards auto-created from `<!-- grammar-card: {...} -->` blocks in lessons on completion.

## XP Constants (src/lib/xp.ts)

Time: 10 XP/5min | Review: 2/card | Word added: 5 | Vocab lesson: 25 | Test: 30+3/correct | Conjugation: 20+3/correct | Sentence: 20+3/correct | Listening: 25+5/correct | Daily challenge: 1.5x multiplier | Letter practice: 5/practiced+3/quiz correct | Dictation: 15+5/correct | Translation: 20+5/correct+2/partial | Lyrics: 25+3/vocab added

## Content Formats

**Grammar lessons** (`.md`): Markdown with `<!-- quiz: {"type":"multiple-choice","question":"...","options":[...],"answer":0} -->` comment blocks. Also supports `<!-- grammar-card: {"rule":"...","hint":"...","example":"...","answer":"...","explanation":"..."} -->` blocks for SRS grammar cards. End with `## Sources` section.

**Curated reading texts** (`.txt`): Plain text files in `public/content/reading/{lang}/`. Index file lists texts with id, title, titleEn, difficulty, wordCount, tags, description.

**Song lyrics** (`src/data/lyrics/`): TypeScript data files with `Song` interface: id, title, titleRomanized, artist, context, language, difficulty, lines (original/reading/translation), vocab (word/reading/meaning).

**Vocab lessons** (`.json`): `{ id, words: [{word, reading, meaning, example, exampleMeaning}], exercises: [{type:'match'|'fill-blank'|'multiple-choice', ...}] }`

**Alphabets** (`src/data/alphabets/`): `{ char, romanji, group, strokes?, meaning? }` — Hiragana(81), Katakana(80), Kanji(403 N5+N4+N3), Cyrillic(33), Arabic(28 letters + harakat + hamza/special forms + numerals)

## Navigation

Bottom tabs: 📊 Home | 🃏 Review | 📚 Words | 📖 Reader | 🎓 Learn. Header: logo + timer + dictionary + dark mode. Settings via ⚙️ on Dashboard.

## Styling Patterns

```
Card:     bg-white dark:bg-gray-800 rounded-2xl shadow p-4
Heading:  text-gray-800 dark:text-gray-100
Muted:    text-gray-500 dark:text-gray-400
Button:   bg-indigo-600 text-white px-5 py-2 rounded-xl hover:bg-indigo-700
Link:     text-indigo-600 dark:text-indigo-400 font-medium
Success:  bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200
Error:    bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200
```

## Known Quirks

- `vite-plugin-pwa` peer dep conflict with Vite 8 — use `--legacy-peer-deps`
- Kuromoji externalizes `path` module — harmless build warning
- Chunk size >500KB warning — could use code splitting
- `Word.type` added in v7 — older data backfilled via migration. Extended to `'grammar'` for grammar review cards
- Analytics supports per-language filtering via optional `language` parameter

## Notifications

Three-tier delivery (see `docs/notifications.md` for full details):

1. **Cloud reminders** — Web Push from `infra/push-worker/` (Cloudflare Worker + KV + 5-min cron). The only mechanism that fires reliably while the app is fully closed across browsers/iOS. Requires `VITE_VAPID_PUBLIC` + `VITE_PUSH_API_URL` env vars at build time. **TZ-aware**: client sends `prefs.timezone` (IANA name); worker schedules wall-clock times in the user's TZ via `tz.ts` helpers. Worker also recovers from stale per-subscription state by zeroing day-scoped fields when `lastActiveDate < todayLocal`.
2. **TimestampTrigger** — pre-scheduled client-side notifications. Chromium with experimental flag only. Suppressed when cloud is active to avoid double-firing.
3. **Periodic Background Sync** — installed Chromium PWAs only, best-effort.

Client lifecycle lives in `src/lib/push-subscription.ts` and `src/hooks/useNotificationScheduler.ts`. Settings UI: `src/components/settings/NotificationSettings.tsx` (cloud sub-toggle, three test buttons, status tier display, privacy copy). Worker stores subscription + prefs + a small state blob (streak, due count, today's minutes, etc.) — **never** vocabulary, answers, or review history.

