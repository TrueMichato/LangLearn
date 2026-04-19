# AGENTS.md — LangLearn

IMPORTANT: Prefer retrieval-led reasoning over pre-training-led reasoning for any LangLearn tasks. Consult the codebase and this file before relying on assumptions.

## Project Overview

LangLearn is a local-first Progressive Web App for learning languages (Japanese, Russian, extensible). "Kind learning" philosophy — rewards effort, no penalties for mistakes. Deployed at `https://truemichato.github.io/LangLearn/`.

## Tech Stack

| Layer | Tech | Notes |
|-------|------|-------|
| Framework | React 19 + TypeScript 6 | Vite 8 bundler |
| Styling | Tailwind CSS v4 | Class-based dark mode |
| Database | Dexie.js v4 (IndexedDB) | Schema v7, 10 tables |
| State | Zustand | localStorage persistence |
| Routing | react-router-dom HashRouter | Required for GitHub Pages |
| PWA | vite-plugin-pwa | registerType: 'prompt' |
| Base path | `/LangLearn/` | All fetches use `import.meta.env.BASE_URL` |

## Commands

```
npm run build     # tsc -b && vite build
npx tsc --noEmit  # Type-check only
npm test          # vitest run (45 tests)
npm run dev       # Dev server
npm run lint      # ESLint
```

## Critical Conventions

1. **Content fetching** — ALWAYS prefix with `import.meta.env.BASE_URL`: `` fetch(`${import.meta.env.BASE_URL}content/grammar/ja/index.json`) ``
2. **Dark mode** — Every component MUST have `dark:` variants on all colors. Black text on dark bg is the #1 recurring bug.
3. **Language codes** — Use 2-letter codes internally (`ja`, `ru`). Display via `getLanguageLabel(code)` from `src/lib/languages.ts`. Never hardcode "Japanese" or "JA".
4. **DB queries** — Only `.where()` on INDEXED fields. Non-indexed → `.toArray()` then `.filter()`. Check `src/db/schema.ts` for indexes.
5. **DB migrations** — Never modify existing version stores. Always add `db.version(N+1)`.
6. **XP recording** — Two sources: timer auto-records to `studySessions` table; bonus XP via `useXPStore.getState().addXP(amount)`. Dashboard sums both.
7. **Touch targets** — Min 44px: `min-h-[44px]`.
8. **Canvas DPR** — When using `ctx.scale(dpr, dpr)`, coordinates must use CSS dimensions not physical pixels.

## Architecture Map

```
src/
├── App.tsx              # Router (15 routes), ErrorBoundary wrapper
├── pages/               # 15 route pages
│   ├── Dashboard.tsx    # Home — stats, streak, weekly goal, badges, heat map
│   ├── Review.tsx       # SRS review — 5 card types, keyboard shortcuts
│   ├── Words.tsx        # Vocabulary browser — search, filter, study sets
│   ├── Reader.tsx       # Immersion reader — furigana, stress marks, word mining
│   ├── Learn.tsx        # Hub → Grammar, Letters, Vocab, Sentences, Conjugations, Listening, Tests
│   ├── Grammar.tsx      # Grammar lesson browser + LessonView
│   ├── VocabLessons.tsx # Vocabulary lesson browser
│   ├── LetterPractice.tsx # Letter chart/draw/quiz per alphabet
│   ├── Tests.tsx        # Proficiency tests (vocab/grammar/mixed/full)
│   ├── Conjugations.tsx # Verb conjugation & noun declension drills
│   ├── SentenceBuilder.tsx # Tile/typing sentence practice
│   ├── Listening.tsx    # TTS passages + comprehension
│   ├── DailyChallenge.tsx # Daily mixed challenge (1.5x XP)
│   ├── Analytics.tsx    # SRS analytics (SVG/CSS charts)
│   └── Settings.tsx     # App config
├── components/          # 16 directories (layout, srs, grammar, vocab, letters, reader, dashboard, badges, analytics, dictionary, drills, sentences, words, settings, onboarding, common)
├── stores/              # 6 Zustand stores: settings, timer, review, xp, badge, studySets
├── lib/                 # 21 utility modules (sm2, card-types, xp, streaks, languages, dictionary, tts, tokenizer, analytics, badge-checker, daily-challenge, test-questions, notifications, etc.)
├── db/                  # schema.ts (interfaces + migrations), words.ts, reviews.ts, lessons.ts, characters.ts, texts.ts, backup.ts
├── data/                # Static content: alphabets/, badges.ts, conjugations/, listening/, sentences/
├── hooks/               # useBadgeChecker, useDarkMode, useDueCount, useFontSize, useKeyboardShortcuts, useNotificationScheduler
├── types/               # vocab.ts (VocabLesson types)
└── workers/             # kuromoji.worker.ts (Japanese tokenizer)

public/content/          # Runtime-fetched lesson content
├── grammar/{ja,ru}/     # 35 lessons each: index.json + *.md (with <!-- quiz: {...} --> blocks)
├── vocab/{ja,ru}/       # 40 lessons each: index.json + *.json (words + exercises)
└── dict/                # Kuromoji dictionary files
```

## Database Schema (v7) — Indexed Fields

```
words:             ++id, [language+createdAt], language, word, createdAt, *tags, type
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

Key interfaces: `Word` (id, language, word, reading, meaning, contextSentence, tags, type:'word'|'letter'), `Review` (wordId, ease, interval, repetitions, nextReviewDate), `LessonProgress` (id='{lang}/{lessonId}', completed, quizScore, attempts), `CharacterProgress` (id='{lang}/{alphabet}/{char}', mastery:'new'|'learning'|'mastered'), `TestHistory` (language, type, score, level), `DailyActivity` (date, studySeconds, cardsReviewed, goalMet, challengeComplete).

## SRS System

SM-2 algorithm in `src/lib/sm2.ts`. Grade 0-2 resets card; grade 3-5 advances interval. 5 card types assigned by repetition count: classic (rep 0+), reverse/cloze (rep 2+), listening/MC (rep 4+). MC and cloze auto-grade; others show manual grade buttons. Failed cards re-queue to end.

## XP Constants (src/lib/xp.ts)

Time: 10 XP/5min | Review: 2/card | Word added: 5 | Vocab lesson: 25 | Test: 30+3/correct | Conjugation: 20+3/correct | Sentence: 20+3/correct | Listening: 25+5/correct | Daily challenge: 1.5x multiplier | Letter practice: 5/practiced+3/quiz correct

## Content Formats

**Grammar lessons** (`.md`): Markdown with `<!-- quiz: {"type":"multiple-choice","question":"...","options":[...],"answer":0} -->` comment blocks. End with `## Sources` section.

**Vocab lessons** (`.json`): `{ id, words: [{word, reading, meaning, example, exampleMeaning}], exercises: [{type:'match'|'fill-blank'|'multiple-choice', ...}] }`

**Alphabets** (`src/data/alphabets/`): `{ char, romanji, group, strokes?, meaning? }` — Hiragana(81), Katakana(80), Kanji(403 N5+N4+N3), Cyrillic(33)

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
- `Word.type` added in v7 — older data backfilled via migration
