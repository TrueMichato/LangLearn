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

## Practice and assessment boundaries

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
  target-script options. English rule prose is not guessed into vocabulary;
  Latin-script grammar content without explicit lexical metadata may therefore
  have no capture candidates.
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
with the app; runtime lesson assets still need to have been loaded/cached for
offline access. Browser speech/voice availability and online dictionaries are
not guaranteed offline. Knowledge estimates are not proficiency assessments.
