# Knowledge-aware reading and practice

LangLearn derives local vocabulary evidence from the current language's lexical
cards, current reviews, and **explicit targets** of completed vocabulary lessons.
Saving a word makes it available for review; it does not make it familiar.
Successful current review evidence or an explicitly taught target counts as
familiar. Review-backed vocabulary is the familiar subset with a mature current
review (the existing 21-day threshold). A lapse can reduce review evidence without
erasing the independent fact that a lesson taught the word. Grammar and letter
cards do not certify lexical knowledge. Lesson test-outs count only resolvable
explicit vocabulary targets.

## Content maintenance

After changing vocabulary lesson word fields, IDs, or indexes, regenerate the
bundled target index and commit it with the content change:

```sh
node scripts/generate-lesson-targets.mjs
npm test -- src/__tests__/lesson-target-index.test.ts
```

The generator uses the **index/file ID**, not a lesson body's legacy internal ID.
It reads only `words[].word`, never example sentences, grammar prose, or answers.
Missing target data produces an incomplete estimate, not an assertion of zero
knowledge. Do not edit the generated `src/data/lesson-targets.json` by hand.

### Grammar lesson review material

Grammar completion and saving review material are separate decisions. Completing,
leaving, reopening, or reloading a lesson does **not** automatically add its
grammar cards. The completed-lesson picker previews **Words and phrases** and
**Rules and concepts** before an explicit save. Unsaved authored essential items
start selected; optional items and formatting-derived suggestions do not.
Skipping is normal and never blocks progression or changes the quiz score.
Previously completed lessons expose the picker without a quiz retake.

The shared capture tools work in all six lesson languages. Visible prose
vocabulary remains saveable before completion; quiz capture appears only after
that quiz is answered. The full authored rule/concept picker is available after
completion, not as a list of hidden answers during a fresh attempt. Learners can
also save additional words/phrases or compose their own rule/concept questions.
Manual entry works without a dictionary or an AI service. Selected visible text
is only a draft: the learner supplies and confirms a useful prompt and answer.
Do not mine incorrect quiz alternatives or infer vocabulary from English rule
prose.

#### Authoring contract

Place valid JSON inside single-line HTML comments near the relevant teaching
section. These comments are review metadata, not visible lesson prose. Continue
to explain the material in the lesson itself.

```html
<!-- vocab-card: {"id":"vocab-kniga","word":"кни́га","reading":"kníga","meaning":"book","priority":"essential","sourceSection":"1. The 7-Letter Rule"} -->

<!-- grammar-card: {"id":"seven-letter-plural","kind":"rule","format":"cloze","priority":"essential","sourceSection":"1. The 7-Letter Rule","rule":"After the seven consonants write и instead of ы","example":"Хоро́шие ___ лежа́т на по́лке.","answer":"кни́ги","explanation":"The stem ends in г, so the plural is кни́ги."} -->

<!-- grammar-card: {"id":"seven-letter-scope","kind":"concept","format":"qa","priority":"essential","sourceSection":"1. The 7-Letter Rule","rule":"The seven-letter set excludes ц","example":"Is ц one of the seven consonants that require и instead of ы?","answer":"No. The set is к, г, х, ж, ш, щ, ч.","explanation":"Огурцы́ does not violate a rule whose consonant set never included ц."} -->
```

- Every maintained item needs an `id`, `priority` (`essential` or `optional`),
  and nonempty `sourceSection`. IDs use lowercase letters/digits separated by
  `-`, `_`, or `.` and must be unique **across both block types in one lesson**.
  Keep an ID stable when wording changes; do not generate it from the answer,
  position, or current prompt. `sourceSection` names a real instructional section,
  not a new identity.
- `vocab-card` requires `word` and `meaning`; `reading` and `contextSentence`
  are optional. Supply a genuine target-language context, not a gloss that gives
  away the meaning on the front. Keep dictionary vocabulary separate from
  suffixes and paradigms: **ти́хий = quiet** is lexical; choosing **-ий** after
  х is an application task. Inflected examples are not all essential vocabulary.
- `grammar-card` additionally requires `kind` (`rule` for application, `concept`
  for conceptual recall), `format` (`qa` or `cloze`), `rule`, `example`, `answer`,
  and `explanation`. `hint` is optional. The historical field `example` is the
  **question/prompt**, including for Q&A. Ask one focused recall task per item.
  The rule should state the actual condition, not merely repeat the lesson title.
- A `cloze` prompt contains `___` or `＿＿`. Put only what belongs in the blank
  in `answer`, with transliteration, glosses, and qualifications in the reading,
  hint, or explanation where appropriate. A `qa` prompt asks a question and
  reveals the full answer separately. Explicit answers are kept **verbatim**,
  including English conceptual answers; they do not pass through the legacy
  answer-token/gloss extraction heuristic.
- Preserve Russian stress, Arabic vocalization and case where taught, Japanese
  readings and exceptions, meaningful Latin diacritics, and variety/register
  qualifications. A Form I Arabic example is not a universal maṣdar formula;
  Brazilian progressive preferences are not a ban on European gerunds.
- Mark the small set of central lexical targets, applications, and concepts
  essential. Additional examples can reinforce the same objective as optional
  items. Essential means *suggested for selection*, not already learned or
  mandatory to save. Explicit vocabulary takes precedence over a formatting
  candidate with the same NFC word; conservative list/table suggestions remain
  optional. Do not broaden parsing to treat arbitrary prose as vocabulary.
- Check prose mnemonics and memory aids as well as examples. When useful, author
  an optional concept Q&A with the cue, its meaning, and the precise mapping to
  the rule, including any skipped connective words. Do not auto-convert prose or
  duplicate the essential rule-recall task.
- Legacy `grammar-card` blocks without this metadata remain supported and
  optional. When upgrading an existing block, keep its exact old `rule` and
  `example` strings whenever possible. If either must change, retain the exact
  previous pair in `legacyAliases`, for example
  `"legacyAliases":[{"rule":"old rule","example":"old prompt"}]`.
  This permits in-place adoption without resetting the existing review.
  Do not fuzzy-match unrelated questions that happen to share an answer.

`parseLessonReviewItems()` in `src/lib/lesson-capture.ts` returns both normalized
`items` and `diagnostics`. Malformed JSON, incomplete explicit metadata, and
duplicate IDs are errors, not an empty lesson. Consumers must surface failures
honestly rather than silently dropping material. Rule/concept cards use the
existing grammar card type and normal scheduled Review; words use lexical cards.
Authored identity is language + lesson + stable item ID, not answer text. Personal
cards have a separate local identity and are not source-owned content.

Saving is additive and transactional with initial reviews. Repeated saves reuse
existing cards; unchecked items are not deleted. A grammar answer must not mark
an unsaved lexical word as saved, and distinct questions with the same answer
must remain distinct. Adoption and wording repairs preserve schedules and review
history, and must not overwrite learner edits. Use **full backup/recovery** to
preserve these identities and associations. Portable Deck v1 is not a faithful
backup format for grammar cards.

#### Pilot coverage and focused gates

This is a manually reviewed six-lesson pilot, not a completeness audit of all
555 grammar lessons. Shared tools cover all six languages immediately; authored
coverage is staged by missing useful teaching points, not by whether a lesson
already contains a card.

| Pilot lesson | Named teaching units |
| --- | --- |
| `ru/spelling-rules` | `seven-letter-scope` and `seven-letter-plural`; `five-letter-stress-condition` with separate stressed/unstressed applications; `ts-u-application` and `ts-rule-exceptions`; lexical `vocab-kniga`, `vocab-rubashka`, `vocab-lampa`, `vocab-tikhiy`, plus optional glossed verbs |
| `ja/taekim-verb-classification` | `classification-heuristic`, ichidan/godan applications, deceptive る-verbs, irregular verbs and する compounds; explicit meanings/readings including `vocab-nomu` and `vocab-oyogu` |
| `es/cheatsheet-accent-rules` | Stress classes beyond `llana-arbol-application`, diacritic contrasts, hiatus/diphthong conditions, capital accents, and qualified current RAE guidance |
| `pt/gerund-progressive` | `gerund-endings` versus present/past applications, exceptional `pondo`, `gerund-versus-progressive`, variety/register contrasts, optional auxiliary meanings |
| `ro/cognates-false-friends` | Cognate spelling as a tendency, lexical false friends, `librarie-biblioteca-contrast`, actual/real and personality contrasts |
| `ar/masdar` | Individually learned vocalized lexical maṣdars, action-noun usage, `form-one-dirasah-application` versus `form-one-not-predictable`, optional derived-form examples |

`src/__tests__/lesson-retention-content.test.ts` reads the real six lesson files
through the canonical parser and checks named IDs, exact prompts/answers,
kinds/formats, lexical meanings/readings, and essential/optional treatment.
The general grammar-card and quiz content gates still apply; only validated
explicit Q&A is exempt from legacy cloze-only constraints. Counts cannot prove
semantic completeness. Review the teaching inventory and its fixtures together
when editing a pilot, and run:

```sh
npm test -- src/__tests__/lesson-retention-content.test.ts src/__tests__/grammar-cards-content.test.ts src/__tests__/grammar-quiz-content.test.ts
```

Changing grammar metadata alone does **not** require regenerating vocabulary
lesson targets. Saving grammar material, completing a grammar lesson, or selecting
an essential item does not add familiar-vocabulary evidence. A lexical save
becomes available for review but still needs the existing evidence rules above.
This feature makes material reviewable; it is not measured proof of better
long-term human retention.

## Coverage is vocabulary, not comprehension

Reader and full song lyrics count both familiar **word occurrences** and
**distinct vocabulary**. Repetition can change occurrence coverage without
changing distinct coverage. Review-backed percentages are included in familiar
percentages, never added on top. Empty lexical text has no percentage rather than
100%. Estimates update when local evidence changes.

Japanese uses dictionary tokenization and verified base forms when available;
the explicitly labeled fallback segments character runs approximately. Other
languages use surface forms and explicit aliases, not guessed stemming.
Russian stress marks and optional Arabic vocalization are normalized; meaningful
Latin accents remain significant. Names, phrases, unlisted inflections, and
unsupported segmentation can reduce matching. No full multilingual
lemmatization, synonym inference, or AI-generated exercise content is provided.

Reader displays the original source separators, punctuation, and paragraph breaks.
Lookup context uses positions in that unmodified source, even with furigana or
optional Russian stress display. Keyboard users Tab into one lexical word, move
with Left/Right (reversed for RTL reading order), and open details with Enter or
Space. Closing details returns focus to that word; separators are never targets.

Word details show supplied metadata or exact saved/bundled song-vocabulary
meanings first. This is not a complete offline dictionary and does not infer
inflections beyond a verified Japanese lemma. Online lookup is an explicit action.
Editing and saving are separate deliberate steps; lookup never saves a word.
Late responses cannot replace edits, and lookup/save failures retain the draft.
Reader retains a separate draft per source word while that text is open, including
across closing details or selecting another word; opening a new text clears them.
The shared modal focus contract contains focus and restores the opener.

## Practice and assessment boundaries

- Review home separates scheduled reviews from explicit optional practice.
  Scheduled answers use the selected scheduler and write review logs. Optional
  practice includes future-dated saved cards, uses the existing review batch
  size, and requeues misses only in memory: it never changes any review field,
  review log, familiarity evidence, retention or mistake statistics. Existing
  timer-based effort/XP still counts. Queues freeze at explicit start; changing
  recall direction does not reroll membership. Manual study sets store word IDs;
  tag sets require all selected tags. Both respect their language scope and
  exclude deleted/unavailable members without substitution. Smart Due Today
  remains due-only even in practice. Legacy set links remain scheduled due-only
  and mistake/topic links retain curated scheduling unless practice is explicit.
- The practice selector is separate from the due-card scheduler and does not
  modify SRS intervals. Its 80–90% familiar-occurrence target is a **soft ranking
  preference**, not an eligibility gate or an accuracy claim. Supplied target-only
  metadata is labeled; it is not full-prompt coverage.
- Manual language, difficulty, and form filters remain hard boundaries. Guided
  scopes and session bounds remain authoritative. Small pools, missing evidence,
  unresolved targets, and approximate Japanese tokenization are disclosed.
  Beginners receive available introductory content, not an empty knowledge gate.
- Listening selects passages by full-text vocabulary at attempt start.
  Dictation selects full reference sentences within the chosen passage
  difficulty. The attempt does not reroll after a word save. Listening transcript
  capture is available only after **all** passage questions; a transcript could
  otherwise answer later questions. Dictation capture appears after submission.
- Song browsing ranks full lyric text within the selected language, search, and
  difficulty. It never replaces a manually selected song. Existing song
  vocabulary saving remains the sole song save flow, now editable and
  transactionally duplicate-safe, including offline bundled metadata. The
  lyrics completion bonus counts newly added vocabulary, not existing rows.
- Vocabulary/grammar lessons retain authored exercise sequence. Vocabulary
  capture is offered at the completed-lesson summary. Embedded grammar quizzes
  offer it after reveal, using explicit lesson vocabulary or recognizable
  target-script options. Grammar completion offers the opt-in review-material
  picker described above instead of automatically saving authored cards.
  English rule prose is not guessed into vocabulary; Latin-script grammar
  content without explicit lexical metadata may therefore have no capture
  candidates.
- **Proficiency tests and lesson test-outs are not adaptive.** Generation,
  distribution, scoring, timing, and test-out's no-XP policy are unchanged.
  Capture is offered only on final results. Assessment capture recognizes
  existing vocabulary prompt templates and explicit target-option direction
  metadata; it intentionally omits ambiguous English grammar prose and unmarked
  target material. It is not a new question-generation pipeline.

## Daily Challenge

Only eligible vocabulary choices use the lexical selector. The existing target
mix (three vocabulary, two grammar, two character items, with the established
character fallback where pools are missing) is retained; unsupported or small
pools can still yield fewer than seven items. Vocabulary selection uses explicit
single-word targets, not a fictional passage coverage estimate. Saved grammar
and letter cards are excluded from the vocabulary pool.

The first successful generation persists IDs **and complete prompt payloads**
with the evidence revision in the existing local `settings` table under
`daily-practice:v1:DATE:LANGUAGE`. Subsequent starts and browser reloads reuse
that payload despite vocabulary edits/deletions or changed lesson progress.
New dates and languages have independent attempts. Broken saved payloads report
an error instead of silently rerolling. Empty generations are not persisted.
Bare grammar progress IDs and legacy `grammar/`-prefixed IDs are both recognized.
Missing required lesson assets raise a retryable load error without freezing a
character-only success. Legitimately absent/small pools instead retain explicit
pool-limit notices in the frozen payload and expose them in the daily question UI.
These frozen payloads are ordinary local settings and follow existing settings
backup/import behavior; there is no server attempt store.

Daily completion remains the independent date-keyed `dailyActivity` flag (not a
per-language flag). Completion uses the **starting date** even across midnight,
and preserves the existing `round((30 + 5 × correct) × 1.5)` XP formula and retry
reward behavior. A deliberate Next question action replaces auto-advance so
post-answer vocabulary editing does not disappear beneath the learner.

## Vocabulary lesson continuity

The content loader accepts canonical exercise arrays unchanged and wraps the
known legacy singleton multiple-choice shape (`type`, `question`, `options`,
`answer`) in a one-item `items` array. Question text, option order, answer and
stage order are preserved; authored files are not rewritten. Frozen snapshots
use that normalized payload, so reloading the same legacy asset does not signal
a content change. Missing question data, invalid answers and malformed explicit
`items` arrays remain honest load errors rather than silently skipped questions.

Vocabulary lessons checkpoint meaningful changes in the existing local settings
table under `vocab-attempt:v1:LANGUAGE:LESSON` (identity segments are URL-encoded).
Each versioned record carries a unique attempt ID, optimistic revision, saved
time, source-content compatibility marker, full lesson snapshot, frozen authored
and generated exercise payloads (including matching/choice order), stage/item
position, input, hints, selections and submitted results. Checkpoints begin only
after reading the saved record. There is no vocabulary-attempt expiry or global
count cap; the assessment-draft retention rules do not apply.

Returning to a lesson resumes automatically with a saved-place indicator. Saved
material is immediately usable while its source is checked, and remains usable
offline without waiting for a refetch. Missing, changed or invalid source content
offers an explicit saved-copy/retry/restart choice where recovery is possible.
Malformed or unsupported checkpoints are retained, with a recovery download and
explicit restart rather than a silent reset. Restart creates a new identity and
archives the replaced record under `vocab-attempt-recovery:v1:ID`. Other languages
and lessons are untouched. A stale tab cannot overwrite/restart a newer revision.
Failed checkpoints leave the current session usable, visibly unsaved and
retryable. Revealed answers wait for an explicit Next/Continue action; resuming
does not recreate auto-advance timers.

Finishing commits lesson progress and a pending `vocab-receipt:v1:ATTEMPT_ID`
record together in Dexie, preserving the existing lesson-progress attempt count.
A separate reward step persists the attempt's token and XP total together in
`langlearn-xp` version 2; version 0/1 totals migrate unchanged. The receipt is
finalized only after that succeeds. These stores are **not atomic together**:
failure leaves a pending completion, and its retry consults durable credited
tokens instead of awarding again. XP is not presented as earned until confirmed.
A deliberate retake has a new attempt ID and retains the existing reward formula.
Word saving remains explicit and duplicate-safe; checkpointing/completion does
not add vocabulary/review rows or change knowledge-evidence rules.

Full backups, replacement imports, snapshots and recovery capsules carry the
settings records; new recovery capsules also carry the XP payload/token ledger,
including the award-before-receipt-finalization window. Old backups/capsules
without attempts or XP remain supported. Merge keeps live attempts on key
conflicts and never imports a source XP total. Instead, source credited-token
evidence settles matching imported pending receipts, preventing a merge from
re-awarding XP that the source already credited.
Browser-capsule recovery is distinct from an intentional full-backup replacement:
after IndexedDB-only loss it preserves the higher valid XP total, combines live
and capsule credited tokens, and settles recovered receipts against that durable
evidence. Surviving XP is re-read at the storage-write boundary. Explicit full
backup replacement retains its deliberate replacement semantics. Settings-held
attempts count as progress consistently for capsule/snapshot creation, empty-data
discovery and the live-data guard; ordinary preferences and archived replacements
do not make an empty database look populated.

Home integration uses
`loadLatestVocabAttemptSummary(language)` from
`src/lib/vocab-lesson-attempt.ts`. It returns
`Promise<VocabAttemptSummary | null>` for the latest compatible unfinished
attempt (including an unconfirmed completion), with `language`, stable
`lessonId`, `attemptId`, `title`, readable `stage`, one-based `position`,
`itemCount`, millisecond `updatedAt`, and the lesson `route`. It does not choose a
curricular next step or change the current language; read failures propagate.
Pass the catalog title through `VocabLessonView`'s optional `title` prop when
starting a new attempt.
Late catalog-title updates change only metadata on the same live session,
including unsaved work; they never rehydrate its state or reroll its questions.

## First instructional entry

Onboarding and shared starting points resolve the first vocabulary lesson from
the existing learning-path manifest, using `/vocab-lessons?lesson=ID` in the
global current language. They do not create a shorter lesson or change its
authored exercises. Catalogs and test-outs remain separate browsing choices.
The onboarding handoff uses the current language, not the first active language;
Skip and “I'll look around first” still dismiss without starting a lesson.
Only words explicitly saved become vocabulary review cards.

Guided script links use `/letters/LANGUAGE?mode=learn&alphabet=NAME&group=next`
to open a teaching card directly. `group` also accepts an exact persisted column
name, URL-encoded rather than an array position. `next` resolves the next unlocked
incomplete column, or the first completed column when all are complete.
Unknown/locked groups show an explanation and the existing column browser,
without recording completion. Later script alphabets check the real learning
path state, including retained access; a failed check offers retry rather than
silently opening a locked alphabet. Omitting `group`, or choosing Back to
columns, preserves independent browsing, charts and quizzes. Unsupported
languages are named explicitly; another language is never silently substituted.

## Guided checkpoints and nonlexical evidence

The six guided paths retain their existing continuation activity IDs. New
foundation checkpoints follow explicit instructional anchors: pronunciation
contrasts (script foundations for Japanese), five authored sentences practicing
the relevant structures, and Arabic numbers 1–20 after that vocabulary lesson.
Checkpoint IDs include their anchor rather than an array position. Their
`guidedScope` query carries explicit item IDs, categories, range/task or
difficulty bounds; `descriptor.scope` exposes these to activity selectors.
Participation completes a checkpoint even with a zero score. Existing
standalone controls remain independent.

Schema v12 adds only minimal `skillProgress` counters. Minimal pairs record
attempts/correct by language and contrast ID; numbers record them by language,
direction and range. Selection favors demonstrated weak skills while retaining
some reinforcement/exploration inside the chosen filters. Letter quizzes and
drawing use existing character progress within the selected alphabet. Active
queues and character evidence remain frozen until a new attempt; this does not
alter vocabulary knowledge, SRS, or XP rules. Revealed genuine minimal-pair
words can be saved; phonetic fragments, suffixes and arbitrary numeric answers
are excluded.

The upgrade freezes pre-checkpoint lesson/activity evidence and legacy script
groups in local settings. A versioned baseline resolves the **v1** path against
that frozen evidence before applying v2 gates. Earlier inserted checkpoints
remain incomplete catch-up suggestions and do not remove earned access.
Out-of-order lesson completions are not proof that earlier prerequisites were
met. Later progress cannot retroactively turn new required practice into
catch-up. Backups and recovery capsules include skill counters; old capsules
remain valid according to the tables present in their schema version.

## Saving and limitations

Shared practice capture mounts only after the relevant reveal boundary. It uses
bundled metadata first; dictionary lookup is optional, editable, and fallible.
Never fabricate a meaning on lookup failure. Saves use the transactional
`saveWordsToVocabulary()` primitive, creating the normal word and initial review
together with duplicate protection. Shared capture adds no separate XP or
bookmark subsystem. Source, lesson, and dialect tags should be passed through
when the activity has them.

All evidence and frozen attempts remain local. Generated target content ships
with the app; unstarted runtime lesson assets still need to have been loaded/cached
for offline access. Saved vocabulary attempts include their lesson material.
Browser speech/voice availability and online dictionaries are
not guaranteed offline. Knowledge estimates are not proficiency assessments.
