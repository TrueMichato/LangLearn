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
  Keep an ID stable while its target (the one thing asked) is unchanged, even if
  wording changes; never repurpose it for a different target. Do not generate it
  from the answer, position, or current prompt. `sourceSection` names a real
  instructional section, not a new identity.
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
  candidate with the same NFC word. In unmarked lessons, conservative list/table
  suggestions remain optional. Do not broaden parsing to treat arbitrary prose
  as vocabulary.
- Check prose mnemonics and memory aids as well as examples. When useful, author
  an optional concept Q&A with the cue, its meaning, and the precise mapping to
  the rule, including any skipped connective words. Do not auto-convert prose or
  duplicate the essential rule-recall task.
- Legacy `grammar-card` blocks without this metadata remain supported and
  optional. When upgrading an existing block, keep its exact old `rule` and
  `example` strings whenever possible. If either must change, retain the exact
  previous pair in `legacyAliases`, for example
  `"legacyAliases":[{"rule":"old rule","example":"old prompt"}]`.
  This permits in-place adoption without resetting the existing review, but
  only for an unchanged target; a changed target gets a new ID.
  Do not fuzzy-match unrelated questions that happen to share an answer.

For a **fully reviewed lexical inventory**, add exactly this single-line public
control once, outside code fences:

```html
<!-- vocab-inventory: {"mode":"explicit"} -->
```

Use `vocab-inventory`, not `vocabulary-policy`. It makes valid authored
`vocab-card` blocks the authoritative lexicon, **including optional items**.
Zero lexical cards is an intentional empty lexical inventory only after
review, not a reason to omit the control. Formatting may still locate an inline
button for an authored word, but adds no extra vocabulary. Do not turn English
instructions, pronunciation fragments, paradigms, or quiz alternatives into
lexical cards. Grammar rules and concepts remain separate and are not suppressed.
Unmarked legacy lessons retain the formatting fallback even when partly authored;
adding one `vocab-card` is not an implicit completeness declaration.

`readLessonReviewBlocks(markdown, 'vocab-inventory')` in
`src/lib/lesson-review.ts` returns `{ items, diagnostics }`: `items.length === 1`
identifies one valid control. Unknown modes/properties, malformed or multiline
controls, missing colons or closing comments, and duplicates produce diagnostics
and no valid control; they must not masquerade as an empty inventory. Fenced
examples do not activate the control. `stripLessonReviewSources()` hides metadata and
controls, including malformed ones, while preserving fenced authoring examples.

`parseLessonReviewItems()` in `src/lib/lesson-capture.ts` returns both normalized
`items` and `diagnostics`. Malformed JSON, incomplete explicit metadata, and
duplicate IDs are errors, not an empty lesson. Consumers must surface failures
honestly rather than silently dropping material. Rule/concept cards use the
existing grammar card type and scheduled Review (reviewed rule-recall cards are
spaced further apart; see Rule-recall cards); words use lexical cards.
Authored identity is language + lesson + stable item ID, not answer text. Personal
cards have a separate local identity and are not source-owned content.

Saving is additive and transactional with initial reviews. Repeated saves reuse
existing cards; unchecked items are not deleted. A grammar answer must not mark
an unsaved lexical word as saved, and distinct questions with the same answer
must remain distinct. Adoption and wording repairs preserve schedules and review
history, and must not overwrite learner edits. Use **full backup/recovery** to
preserve these identities and associations. Portable Deck v1 is not a faithful
backup format for grammar cards.

#### Maintainer review and inventories

Review the actual lesson's prose, tables, exceptions, contrasts, and memory aids.
Decide what deserves lexical recall, rule application, or conceptual recall;
retain a small, content-appropriate essential core rather than meeting a card
quota. Extra examples and mnemonics can remain optional. Preserve spelling,
readings, dialect/register, and regional qualifications rather than turning a
local tendency into a universal rule.

Record that review in `src/__tests__/fixtures/grammar-retention/*.json`. Each
lesson names its teaching points with an independent instructional `objective`,
stable `id`, `kind`, `priority`, and real `sourceSection`. Rule/concept points
specify exact `format`, `prompt`, and `answer`; lexical points specify exact
`word` and `meaning`, plus `reading` where relevant. Optional `explanation` and
`contextSentence` expectations are checked when specified. These are reviewed
contracts, not snapshots generated from whatever the parser currently emits.
Review inventory and metadata changes together; preserve exact legacy aliases.
Section exclusions need a real heading and a reason limited to references,
assessment, or repetition already covered by named points. An exclusion is not
a blanket waiver for that heading's teaching material. All indexed lessons are
instructional and included; no entire lesson is excluded.

#### Catalog scope and focused gates

**Coverage is not eligibility.** This section describes **authored inventory
coverage**: reviewed `vocab-card`/`grammar-card` metadata, recorded in
`src/__tests__/fixtures/grammar-retention/*.json` and protected by the gate
tests below. It does not make a lesson eligible for the reviewed card UI or the
rule scheduler. **Eligibility** is separate: a lesson qualifies only when its ID
is listed in `src/lib/grammar-reviewed/{lang}.ts` (see *Rollout decision and
recommended checks*), which also requires re-authoring it to the contract and
passing that language's tests. Every indexed lesson in all six languages is now
listed, but inventory coverage alone never made any of them eligible. The
numbers and tables in this section measure coverage only.

The inventory expansion (#48) reviewed all **508 indexed lessons** in the
Japanese, Arabic, Spanish, Portuguese, and Romanian grammar catalogs across
**25 completed batches**. Shared capture tools support all six languages, but
Russian was outside this expansion: `ru/spelling-rules` remains the original
reference, and the Russian catalog was made eligible separately (#51, #54; see
*Rollout status*). This coverage applies to those five indexed catalogs, not
non-indexed assets or the wider Russian catalog.

| Catalog | Reviewed / indexed lessons | Named points at #48 (`6d495a0`) | Named points at `64c1a32` | Inventory files |
| --- | ---: | ---: | ---: | --- |
| Japanese (`ja`) | 179 / 179 | 3,715 | 4,141 | 12 |
| Arabic (`ar`) | 186 / 186 | 1,926 | 2,319 | 6 |
| Spanish (`es`) | 55 / 55 | 1,204 | 1,387 | 3 |
| Portuguese (`pt`) | 38 / 38 | 1,194 | 1,292 | 2 |
| Romanian (`ro`) | 50 / 50 | 1,092 | 1,196 | 2 |

At #48 (`6d495a0`) all five catalogs were fully reviewed and canonical-validated,
and the independent full-508 catalog guard and focused retention gates passed.
That snapshot named **9,131 points**: 4,071 vocabulary targets, 3,173 rule
applications, and 1,887 concepts; 3,163 essential and 5,968 optional. The
rollout PRs have since edited the inventories: at `64c1a32` the same 25 files
name **10,335 points** (4,071 vocabulary, 3,797 rule applications, 2,467
concepts; 3,853 essential, 6,482 optional). Counts describe the reviewed
inventory, not semantic proof. Inventory points exclude Russian and are not the
parser item counts in *Rollout status*.

The original six-lesson fixtures in
`src/__tests__/lesson-retention-content.test.ts` remain focused semantic and
legacy-adoption regressions, not the boundary of catalog coverage:

| Original reference lesson | Named teaching units |
| --- | --- |
| `ru/spelling-rules` | `seven-letter-scope` and `seven-letter-plural`; `five-letter-stress-condition` with separate stressed/unstressed applications; `ts-u-application` and `ts-rule-exceptions`; lexical `vocab-kniga`, `vocab-rubashka`, `vocab-lampa`, `vocab-tikhiy`, plus optional glossed verbs |
| `ja/taekim-verb-classification` | `classification-heuristic`, ichidan/godan applications, deceptive る-verbs, irregular verbs and する compounds; explicit meanings/readings including `vocab-nomu` and `vocab-oyogu` |
| `es/cheatsheet-accent-rules` | Stress classes beyond `llana-arbol-application`, diacritic contrasts, hiatus/diphthong conditions, capital accents, and qualified current RAE guidance |
| `pt/gerund-progressive` | `gerund-endings` versus present/past applications, exceptional `pondo`, `gerund-versus-progressive`, variety/register contrasts, optional auxiliary meanings |
| `ro/cognates-false-friends` | Cognate spelling as a tendency, lexical false friends, `librarie-biblioteca-contrast`, actual/real and personality contrasts |
| `ar/masdar` | Individually learned vocalized lexical maṣdars, action-noun usage, `form-one-dirasah-application` versus `form-one-not-predictable`, optional derived-form examples |

Expanded examples include Spanish `cuyas-novelas` (agreement with the possessed
noun), Portuguese `clock-time-agreement` (including singular noon/midnight),
Romanian `presumptive-not-fact` (supposition versus assertion), Japanese
`stem-formation` in `tofugu-verb-nagara`, and Arabic `gulf-qaf-scope` (qualified
regional pronunciation, not a universal rule).

`grammar-retention-catalog.test.ts`, `grammar-retention-validator.test.ts`, and
`helpers/grammar-retention.ts` under `src/__tests__/` use the canonical parser
against real indexed assets and reviewed inventories. The catalog gate requires
every indexed lesson exactly once; missing inventories are errors, not exclusions.
The fixed `grammar-retention-legacy.json` baseline protects **508 indexed assets,
1,249 grammar identities, 137 stable authored IDs (including 87 vocabulary IDs),
and 1,415 quiz payloads**. The fixture records
`605abceda40372fe69c20ca6f19eec6d9b727971` as its authentic baseline; those grammar
inputs were independently verified identical at `9102181`. Keep the recorded
baseline independent of current parser output. Authored quiz sequence and payloads
remain frozen except for exactly five reviewed inline-quiz data corrections:

- `es/relative-pronouns`, second quiz: change zero-based `answer: 2` (**cuyos**)
  to `answer: 3` (**cuyas**), agreeing with **novelas**.
- `pt/numbers-dates`, third quiz (4:30): replace option 0, **São quatro e trinta**,
  with `São quatro e quinze` (no trailing period). Retain `answer: 1`,
  **São quatro e meia**; the old distractor was also a valid expression of 4:30.
- `ja/purpose`, second quiz: change only the question to
  “Using ように, how do you say 'I set an alarm so as not to oversleep'?”;
  all options and `answer: 1` remain unchanged.
- `ja/taekim-desire-volition`, second quiz: change the question to
  “Why is an unqualified '彼は行きたい' often avoided in ordinary conversation?”
  and option 1 to “An unqualified たい assertion normally presents the speaker's
  own desire”; retain `answer: 1` and all other options.
- `ar/istighatha-nudba`, second quiz: change only option 0 from
  `وَا قَلْبَاهُ (wā qalbāh)` to `وَا قَلْبَاهْ (wā qalbāh)`, matching pausal
  long ā + hāʾ as-sakt, not possessive -hu; retain the question, `answer: 0`,
  and all other choices.

All five source corrections are confirmed. The separate
`src/__tests__/fixtures/grammar-retention-quiz-corrections.json` records
`lessonKey`, one-based quiz `position`, linguistic `rationale`, and full
`original`/`corrected` payloads. `validateLegacyLesson(markdown, baseline, lessonKey?)`
requires the exact corrected payload in matching lesson context, then reverses
**only those five approved changes** before comparing with the immutable original
quiz hash. Catalog callers supply the lesson key. The old incorrect payload
fails with that context; corrected payloads cannot use the exception without it.
Keep the original baseline fixture and hashes unchanged; admit no other quiz
rewrite. This is a narrow data repair, not a change to quiz ordering, generation,
or the scoring algorithm.

Focused mutation gates reject dropped or mistyped teaching units, changed
kinds/priorities/prompts/answers, incorrect lexical meanings/readings, fabricated
headings, malformed metadata, duplicate IDs, missing assets, stale/overlapping
inventories, and lost or ambiguously assigned exact legacy identities. Quality
checks catch specified front-side answer/meaning leaks, whole-sentence answers
misused as cloze spans, corrupt reconstruction, and newly joined Arabic/Latin
tokens. Capture/render tests also protect explicit-inventory authority, optional
and intentional-zero vocabulary, legacy fallback, control diagnostics, and fenced
examples. These checks protect specified contracts, not all possible bad prose.
The general grammar-card and quiz content gates still apply; only validated
explicit Q&A is exempt from legacy cloze-only constraints. Run the existing gates
without new dependencies:

```sh
gh cfs -- npm test -- \
  src/__tests__/grammar-retention-catalog.test.ts \
  src/__tests__/grammar-retention-validator.test.ts \
  src/__tests__/grammar-retention-quiz-corrections.test.ts \
  src/__tests__/lesson-retention-content.test.ts \
  src/__tests__/lesson-capture.test.ts \
  src/__tests__/lesson-capture-render.test.ts \
  src/__tests__/lesson-markdown-render.test.ts \
  src/__tests__/grammar-cards-content.test.ts \
  src/__tests__/grammar-quiz-content.test.ts
```

Changing grammar metadata alone does **not** require regenerating vocabulary
lesson targets. The inventory expansion itself changes no UI, database schema,
scheduler, XP, or lexical-familiarity rules. Saving grammar material, completing
a grammar lesson, or selecting an essential item does not add familiar-vocabulary
evidence.
A lexical save becomes available for review but still needs the existing evidence
rules above. Counts and passing gates are not semantic-completeness proof or a
guarantee that future prose is captured automatically. Human/model linguistic
review is not native-speaker certification. This feature makes material
reviewable; it is not measured proof of better long-term human retention.

#### Russian pilot: audit the question before reading the answer

Scope: Russian lessons 1–10 by index order. At `52dc334` their picker offered
185 lexical and 35 grammar suggestions. These are **suggestions**, not cards
saved, learners tested, or learning outcomes. For each candidate, hide the
back. Ask a reviewer to answer, name the one decision being tested, and try to
pass by copying the cue or giving an equally valid contrary answer. Then reveal:
does the model answer the visible question, and does the reason explain *why
this choice here*? Record the lesson/item ID, objective, acceptable alternatives
and a decision: **keep, rewrite, make optional, or leave in the lesson**.
Do not require an essential card or any lexical suggestions per lesson.

| Lessons | What to check |
| --- | --- |
| 1 Alphabet; 2 Pronunciation; 3 Stress | Separate `мат` and `мать` and their meanings. Supplying written `б` in `хле___` is spelling; identifying the final [p] in `хлеб` is sound knowledge, not a recording of pronunciation. For stress, distinguish a castle (`за́мок`) from a lock (`замо́к`) by meaning; show `замок` without the mark on the front. Accept “first/second syllable” when placement is the target. |
| 4 Spelling; 5 Cases | `ти́х___ дом` can test an ending; keep a mnemonic optional, not a second task. `У меня нет ___` + `кошка` elicits `кошки`. “Start with accusative and genitive” is advice, not vocabulary. |
| 6 Aspect; 7 Gender | `Я ___ книгу` permits both `читал` and `прочитал`. Specify process or finished result **before** reveal. Retrieving `стол` for “table” does not demonstrate gender; `Это ___ комната` + `новый` elicits agreement (`новая`) without printing the answer. |
| 8 Accusative; 9 Genitive; 10 Dative | Contrast `вижу стол` with `вижу брата`: copying `стол` alone is weak evidence. To test genitive, supply `нет` and elicit `машины`, not the reverse. Pair producing a recipient (`они` → `им`) with interpreting *who receives what*, rather than another paradigm to name. |

**Why test both directions?** [Shintani, Li & Ellis](https://doi.org/10.1111/lang.12001)
distinguish comprehension and production outcomes; neither is a proxy for the
other. [Norris & Ortega](https://doi.org/10.1111/0023-8333.00136) inform focused
instruction; [Kim & Webb](https://doi.org/10.1111/lang.12479) inform spaced
practice. None establishes a typing advantage here. *The Language Learner’s
Handbook* (§§9.3–9.5, 11.4–11.5, 11.6.3/11.6.6) and the archived community
[natural methods](https://web.archive.org/web/20200303205501/https://www.reddit.com/r/languagelearning/comments/cgix54/learning_methods_101_natural_methods_xlong_post/),
[linguistic methods](https://web.archive.org/web/20200303205457/https://www.reddit.com/r/languagelearning/comments/chsl3z/learning_methods_102_linguistic_methods_xlong_post/)
and [wiki](https://web.archive.org/web/20201221080347/https://www.reddit.com/r/languagelearning/wiki/index)
are practitioner references for meaningful context and focused recall, not
controlled comparisons of these interfaces.

#### Rule-recall cards

**Why.** The pilot only practised *application* (produce or interpret a form).
The rule itself appeared only after reveal, so learners never retrieved it.
Rule cards add a compact explanation the learner can recall and then use to
check and repair their own output. They supplement application cards; they
don't replace them.

**What.** A rule card is a `grammar-card` with `"kind":"concept"` and
`"format":"qa"`; newly authored ones use an `id` prefixed `rule-` as a
convention. It uses the existing schema; there's no parser or DB change. Neither
Review nor the scheduler checks the prefix (see *How reviewed rule cards
behave*). The front (`example`) asks one atomic question in one of three
directions: trigger → rule (“After нет, which case?”
→ genitive), example → reason (“Why is it воды in Здесь нет воды?”), or
contrast (“Which past aspect leaves completion open?”). The answer is short
and self-graded; `explanation` ties it to a real form and says what paraphrase
counts. Where possible a card shares `sourceSection` with the application card
that practises the same rule; that pairing is advisory, but `sourceSection` must
be a real heading in the section that teaches the rule, not a summary or
reference section. Aim for 2–4 per lesson, 1–2 `essential`. In reviewed
lessons Review labels these cards “Recall the rule”, and the lesson picker
separates *Rule to remember* from *Practice using a rule*. At the #51 pilot,
Russian lessons 1–10 offered 38 lexical suggestions and 75 grammar items, all
authored and parsed with no diagnostics: 36 application items (`"kind":"rule"`)
and 39 declarative items (`"kind":"concept"`). Of the 39, 35 were new `rule-*`
cards and 4 were earlier concepts in `ru/spelling-rules`
(`seven-letter-scope`, `five-letter-stress-condition`, `ts-rule-exceptions`,
`seven-letter-mnemonic`). For current counts, see *Rollout status*.
`russian-grammar-pilot.test.ts` checks that every `rule-` card is concept + qa,
hides its own answer, sits under a real heading, and doesn't show on its front
a one-word Russian answer of another card in the same lesson. Only
`rule-hard-sign-position` (ъ) and `rule-final-devoicing` (б) are exempt.
Each language now has its own reviewed-grammar test in `src/__tests__/`
(`russian-grammar-reviewed.test.ts`, `japanese-grammar-reviewed.test.ts`,
`arabic-grammar-reviewed.test.tsx`, `spanish-grammar-reviewed.test.ts`,
`portuguese-grammar-reviewed.test.ts`, `romanian-grammar-reviewed.test.ts`)
that applies that language's checks and records its exemptions and
retirements; the shared retirement helper
`src/__tests__/helpers/grammar-retirements.ts` is checked by
`grammar-retirements.test.ts`.

**Don't** put the answer, or a stress mark that gives it away, in the prompt
or `hint`. Don't offer a two-way choice whose answer is one of the options
(“present or future?”). Don't show a form that another card asks the learner
to produce: ask trigger → rule instead (“Which aspect presents a past action as
completed?”), or pick an example form no card targets. Don't ask for a recited paragraph, a whole table or an open set:
split paradigms into cells. Don't test terminology the lesson doesn't treat as
the point, or require the lesson's exact wording. Don't teach anything the
lesson doesn't. Reuse an ID only for the **same target** (the one thing asked):
keep the stable ID and the exact old `rule`/`example` pair, as the current
strings or, if either must change, as an exact `legacyAliases` entry; that is
how a saved card is adopted in place. Never repurpose an ID for a different
target. A changed target gets a new ID, and the old ID is retired and never
recycled; a saved card for a retired ID is left alone and keeps normal
spacing. When an aggregate card (a whole table, set or multi-target question)
is split into atomic cards, the aggregate's ID is retired: no successor takes
its old `rule`/`example` pair as an alias, so none inherits its saved schedule,
and learners' saved rows and history are left intact (as #57 and #58 did).
Never fuzzy-match.

**Evidence: empirical.** Meta-analyses find explicit instruction effective:
[Norris & Ortega 2000](https://doi.org/10.1111/0023-8333.00136) (49 studies)
and [Spada & Tomita 2010](https://doi.org/10.1111/j.1467-9922.2010.00562.x)
(41 studies, controlled knowledge and spontaneous use). They study *teaching*,
not memorizing rule cards, and mostly use controlled outcome measures. Skill
acquisition theory, as summarized by Suzuki & DeKeyser (in press; preprint,
read secondhand), treats declarative knowledge as the starting point that
deliberate practice proceduralizes. Links between rule knowledge and
proficiency are weak to moderate and correlational:
[Alderson, Clapham & Steel 1997](https://doi.org/10.1177/136216889700100202)
found a weak relationship; [Roehr 2008](https://doi.org/10.1093/applin/amm037)
reports moderate correlations. Retrieval practice beats restudy at a delay
([Roediger & Karpicke 2006](https://doi.org/10.1111/j.1467-9280.2006.01693.x)),
recall beats recognition and feedback matters
([Rowland 2014](https://doi.org/10.1037/a0037559)). Those materials were not
grammar rules, so this supports remembering the statement, not using it.

**Evidence: practitioner.** Wozniak's
[Twenty rules of formulating knowledge](https://www.supermemo.com/en/blog/twenty-rules-of-formulating-knowledge)
(understand before memorizing; minimum information; avoid sets and
enumerations) is expert opinion, not controlled or L2-specific. *The Language
Learner's Handbook* warns “Do not rely on memorising grammar rules” and treats
rules as a stepping-stone to meaning in context. Its own grammar flashcards
are application cards, which is why rule cards stay few and paired.

##### How reviewed rule cards behave

**Which cards.** Only lessons listed in `src/lib/grammar-reviewed/{lang}.ts`
are eligible. A saved card is a rule-recall card (`isRuleRecallCard` in
`src/lib/grammar-review-scope.ts`) only when its saved kind is `concept`, its
saved source is an authored lesson item, and its language, lesson and item ID
match a `concept` item in a listed lesson as currently shipped. Vite generates
that ID list at build time (`virtual:grammar-rule-ids`), so Review needn't load
a lesson. Every concept item in a listed lesson qualifies, not only `rule-` ones.
Tags, an ID prefix or lesson membership alone are not proof. These cards read
“Recall the rule”; any other concept card reads “Recall the concept”.

**Spacing.** Rule-recall cards come back about half as often as other review
cards. After a successful grade (3 or higher), the time until the next review is
doubled and rounded (`RULE_CARD_INTERVAL_MULTIPLIER` in `src/db/reviews.ts`). The
rationale is the weak link above between knowing a rule and using it: review
time is better spent on application and comprehension. The factor of 2 is a
design choice, not a value taken from a study. Failed grades aren't stretched, so
relearning runs at normal speed. Only the due date changes; the scheduler's
stored interval, stability and difficulty stay unscaled, so spacing doesn't
compound and the 21-day maturity thresholds count passes as before. Existing
due dates aren't migrated: the new spacing applies from each card's next
successful grade. Schedule-free practice is unaffected.

**Normal spacing.** The following do not inherit the slower spacing and are never
labelled “Recall the rule”: old application cards, even in a listed lesson
(including an older comprehension question saved as a concept, whose ID is not a
current concept ID); cards whose ID was retired or removed; custom or personal
cards; and any card whose authored identity can't be verified. Lesson membership
isn't enough because some saved concept cards were application questions.

**Refreshing saved wording.** Revised lessons can leave a saved card with old
wording. When the current scope has saved cards from listed lessons, Review offers
**Refresh saved lesson cards**. It runs only when the learner chooses it and
requests only a language code and lesson ID, so learner wording stays local. A
card is updated to the lesson's current wording and question type only when its
stored wording is still the unmodified source wording and it isn't custom or
personal. Learner edits, review dates, schedules, history, tags and XP are left
alone, and no card is added or removed. The result reports updated, unchanged,
skipped (personal, edited, retired or unverifiable) and unavailable cards. A
lesson that can't be loaded or validated is left unchanged and can be retried;
the lessons that did load commit together, or none do if the write fails.

**Answer mode.** Say or think is the default. Typing is an optional field in
reviewed lessons: offline, never graded or stored, with the learner
self-grading. No evidence supports changing the default.

**Limitation.** Recalling a rule is not using it, and rule memorization is
distinct from comprehension and production: report rule recall separately from
both. There is no learner evidence yet that these cards help comprehension or
production in this app, and nothing here claims they do.

#### Facilitator sheet: does offering typing help on new sentences?

Run this outside the app with individual volunteers who can read basic
Cyrillic. Use slips or show one **prompt only** at a time. Keep models and the
entire delayed check out of sight. Explain that the exercise compares practice
methods, not people; no recording, account, or Cyrillic keyboard is needed.
Learners may skip, stop, or decline notes. Do not collect names, raw attempts,
keystrokes or audio; use anonymous local tally marks only.

1. **Assign before practice.** Shuffle four slips: Say/Think + Aspect first,
   Say/Think + Dative first, Type offered + Aspect first, Type offered + Dative
   first. Deal without replacement; reshuffle for each four volunteers. Each
   person stays in one mode and does **both** sets. The comparison is the offer
   of typing, not self-selected typists versus non-typists.
2. **Practise once per row.** In Say/Think, say or think the target, then reveal.
   In Type offered, invite the learner to type the target in an offline,
   non-saving field (no cloud keyboard or dictation) or say/think instead.
   Leave their attempt beside the model for reveal,
   then clear it. In both modes, show the same model and reason, let the learner
   self-grade just the target, and move on without extra repetitions. Use the
   same optional hints on request: “Result or process?” or “Who gets it?”
   No forced typing, hints that print the answer, or automatic string grading.
3. **Return after 48 hours** without rehearsing these items; note the actual
   interval and any intervening practice. Give the unseen check below in the
   assigned set order, with no hints, models or feedback until the end.
   Test both groups the same way: invite a short spoken answer, or handwriting
   if preferred (choose the accessible test method before assignment). English
   or pointing to the person suffices for an interpretation. Do not require
   anyone to type to demonstrate transfer.

**Practice cards.** For aspect production, give both infinitives: `читать /
прочитать` (read). For dative production, give the dictionary form in the cue.
For aspect interpretation ask “Does this tell us they finished, or is that left
open?” For dative interpretation ask “Who receives the object?”

| Set / task | Prompt | Reveal and reason |
| --- | --- | --- |
| Aspect · produce | Vera finished the letter. `Вера ___ письмо.` | `прочитала` presents the reading as completed. |
| Aspect · produce | Anton was reading when interrupted halfway through. `Антон ___ книгу.` | `читал` describes the ongoing reading. |
| Aspect · interpret | `Ира читала статью.` (статья = article) | Left open: `читала` says she was reading, not that she reached the end. |
| Aspect · interpret | `Павел прочитал рассказ.` (рассказ = story) | Finished: `прочитал` presents a completed reading. |
| Dative · produce | Oleg gave his brother a map. `Олег дал ___ карту.` (брат) | `брату`: the brother receives the map. |
| Dative · produce | Nina gave her sister a key. `Нина дала ___ ключ.` (сестра) | `сестре`: the sister receives the key. |
| Dative · interpret | `Мише Лена дала билет.` (билет = ticket) | Misha: `Мише` marks the recipient, even at the start. |
| Dative · interpret | `Игорь дал Оле книгу.` (книга = book) | Olya: `Оле` marks the recipient; Igor is the giver. |

**Held-out check and key (facilitator only).** Use the same two interpretation
questions as in practice. For production give the cues shown; do not show the
key. Give `писать / написать` (write) on both aspect production items.

| Set / task | Unseen prompt | Credit for |
| --- | --- | --- |
| Aspect · produce | Viktor was writing when interrupted halfway through. `Виктор ___ письмо.` | `писал`: ongoing writing, not `написал`. |
| Aspect · produce | Katya finished writing the note. `Катя ___ записку.` | `написала`: completed writing, not `писала`. |
| Aspect · interpret | `Максим написал отчёт.` (отчёт = report) | Finished / “he got it written.” |
| Aspect · interpret | `Зоя писала объявление.` (объявление = notice) | Left open / “she was writing; we don't know if she finished.” Not “she definitely didn't finish.” |
| Dative · produce | Natasha gave her friend a ticket. `Наташа дала ___ билет.` (подруга) | `подруге`, including `своей подруге`; not `подруга`. |
| Dative · produce | Boris gave his neighbor a map. `Борис дал ___ карту.` (сосед) | `соседу`, including `своему соседу`; not `соседа`. |
| Dative · interpret | `Соня дала Диме ручку.` (ручка = pen) | Dima / Dmitry / `Диме`; not Sonya. |
| Dative · interpret | `Тане Роман дал журнал.` (журнал = magazine) | Tanya / Tatyana / `Тане`; not Roman. |

**Score the target, not the transcript.** On each attempted item mark 1 for
the stated distinction, 0 if absent or contrary; mark a skip/unobservable
response separately. For production require an identifiable inflected attempt,
not pointing to or copying an infinitive. On an aspect item `написал` for
Katya earns aspect credit despite the agreement slip; on a case item `sosedu`
is enough to identify the dative. Ignore stress, capitalization, unrelated
words and spelling slips that leave the target clear. Accept equivalent meaning
without terminology on interpretation. Apply the same rule in both groups;
flag an ambiguous key for review rather than imposing exact match.

**Tally and decision.** For each assigned mode and set order, record volunteers
assigned/returned, test method and interval. Report **production and
interpretation separately**: per person and condition, correct / attempted out
of four offered for each skill, with skips and missing follow-ups visible.
If you also ask a learner to state a rule (for example “after нет, which
case?”), tally rule recall as a third, separate score; it earns no production
or interpretation credit.
Keep a separate practice tally: hints, skips, typing taken up/declined, and
reported friction (none / manageable / blocked; e.g. keyboard or composition).
Invite an optional comment about what got in the way; tally themes, not quotes.
Ease, speed, self-grades, and practising a familiar sentence are not transfer.
This is a protocol, not a result: a small voluntary sample and two objectives
at one delay cannot establish fluency, pronunciation, long-term retention, or
an effect in another language. Keep **say/think as the default, typing
optional**. Only reconsider with a consistent held-out benefit across repeated
balanced groups and orders, no meaningful loss on the other skill, and
acceptable friction. If sparse, mixed, tied, or driven by who returned, report
that rather than changing the default.

#### Rollout decision and recommended checks

A lesson gets the reviewed treatment (optional hints, “Recall the rule” labels
and slower rule spacing, the typed-attempt option, explicit wording refresh and
offline precache) only once its ID is listed in
`src/lib/grammar-reviewed/{lang}.ts`, checked by `isReviewedGrammarLesson` /
`reviewedGrammarLessonId` in `src/lib/grammar-review-scope.ts`. Each language has
its own list so rollouts don't conflict. Listing also adds the lesson's concept
IDs to the generated rule-ID module; a listed lesson whose grammar blocks produce
diagnostics fails the build. Add a lesson only after it is re-authored to the
authoring contract and passes its tests. The 508 inventories above do not
certify the reviewed treatment. (This section was formerly titled *Gates before
extending the pilot*.)

**Rollout decision.** The maintainer chose to extend the reviewed treatment
across all six languages without first running the learner comparison or
getting qualified native-speaker sign-off. The checks below are therefore
**recommended follow-ups and evidence limits, not satisfied preconditions**.
Listing a lesson means it was re-authored and checked against the contract and
its tests; it doesn't mean a native speaker approved it or that learners did
better. Say/think stays the default answer mode, with typing optional, because
no evidence supports changing it.

##### Rollout status

*Application* is `"kind":"rule"` and *declarative* is `"kind":"concept"`. The
counts are at merged `64c1a32`, from the canonical parser
(`parseLessonReviewItems` in `src/lib/lesson-capture.ts`) over every indexed
lesson. Every lesson is listed, none produces diagnostics, and all 6,700
grammar items are authored; every lesson except `ru/resources` has both
application and declarative items. They count authored items, not saved cards,
learners or outcomes.

| Language | Indexed lessons | Eligible (listed) lessons | Lexical | Application | Declarative | Notes |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| Russian (`ru`) | 47 | 47 | 131 | 278 | 158 | Lessons 1–10 by index order in #51, 11–47 in #54. `resources` is a reference page, intentionally without application or declarative items. |
| Japanese (`ja`) | 179 | 179 | 1,399 | 1,748 | 994 | #56 |
| Arabic (`ar`) | 186 | 186 | 919 | 716 | 684 | #59 |
| Spanish (`es`) | 55 | 55 | 551 | 501 | 335 | #53, #57; #57 retired 14 aggregate paradigm/set cards superseded by atomic splits; #61 clarified tense cues without changing counts. |
| Portuguese (`pt`) | 38 | 38 | 676 | 421 | 195 | #58 |
| Romanian (`ro`) | 50 | 50 | 526 | 411 | 259 | #55; #60 retired one redundant aggregate card. |
| **Total** | **555** | **555** | **4,202** | **4,075** | **2,625** | |

Unfinished exceptions: none. All six catalogs are merged and every indexed
lesson is listed; the only listed lesson without either grammar type is
`ru/resources`, an intentional reference page.

**Release spot checks** (reported by the release coordinator; not learner
evidence or native-speaker review): historical Japanese and Portuguese
comprehension (application) rows kept their ID, schedule and review log through
an explicit refresh, and a second Good grade scheduled them 6 days out, not 12;
a Spanish six-ending aggregate card saved from the #53 build was skipped
non-destructively by refresh after #57 retired it, and was likewise graded at 6
days. On the live Pages build, an English-primary prompt that begins with
Arabic rendered left-to-right in the lesson picker and preview, while an
Arabic-primary prompt with an English gloss stayed right-to-left
(`grammarDirection` in `src/lib/grammar-direction.ts`); with the server
stopped, all 555 offline grammar lesson responses from the #59 production
build matched source. Spot checks, counts and passing tests are not semantic
proof, human review or learning benefit; any benefit of the slower rule spacing
remains a hypothesis.

##### Recommended checks

1. **Each language.** Have a qualified reviewer for each language assess the
   fronts, valid alternatives and reveals, using the audit method above,
   including whether each rule card is accurate, atomic and not given away.
   Report any learner result for rule recall separately from comprehension and
   production. Independently check lexical inventories (including deliberate
   zero), stable IDs and exact old aliases for unchanged targets. A new target
   must not inherit mastery. Verify on clean and edited decks: explicit save,
   preview/Review agreement, offline revisit, backup/restore, intact personal
   wording and schedules. Check touch, keyboard, screen-reader access and
   legacy cards. Passing tests is not a learner result or a native-speaker
   certification.
2. **Record what was actually reviewed.** For each language, record which
   lessons and objectives a qualified reviewer actually checked and what
   remains untested; listing alone is not that record. Never delete old
   learner-owned cards as catalog cleanup.
3. **Start from the regression samples.** Every language is now listed. The
   samples below remain the starting point for language-qualified review and
   script/input and legacy checks. The inventories above protect existing
   material; they do not certify the reviewed treatment or justify a rewrite.
   Retain sound items. Any change of default needs its own learner evidence.
   These are samples and recommended checks, not approval or evidence of
   completed review.

| Source lesson / item ID | What must survive; what to try |
| --- | --- |
| [Japanese: particles](../public/content/grammar/ja/particles.md) · `topic-marker` | The particle is written は but pronounced *wa*. Distinguish selecting the written particle from giving its reading; composing and confirming kana/kanji with an IME must not reveal or grade the card. |
| [Arabic: script](../public/content/grammar/ar/arabic-script.md) · `six-non-connectors` | In RTL text, ا، د، ذ، ر، ز، و break the connection to the next letter **on the left**. Check mixed-direction prompts and answers visually and when read aloud. In each sample, name the intended variety/dialect and decide whether vocalization is actually the target. |
| [Spanish: present -ar](../public/content/grammar/es/present-ar.md) · `ar-vosotros` | With explicit `vosotros`, the form is `habláis`; `ustedes hablan` expresses the plural in other regional contexts, not in this blank. Preserve that cue; distinguish accent recall from difficulty entering an accent. |
| [Portuguese: present -ar](../public/content/grammar/pt/present-ar.md) · `ar-singular` | `A gente fala` means “we speak” with singular agreement. Don't require the ending for `nós` after `a gente`. Check Brazilian/European usage in context and whether a phone keyboard makes accent entry the actual task. |
| [Romanian: a fi and a avea](../public/content/grammar/ro/present-a-fi-avea.md) · `este-e-register` | Both `Ea e acasă` and `Ea este acasă` are valid; don't mark everyday `e` wrong for not matching `este`. Check entry of ă/â/î/ș/ț separately from recognition of register. |

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
