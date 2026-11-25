import { describe, expect, it } from 'vitest';
import { parseLessonReviewItems } from '../lib/lesson-capture';
import type {
  GrammarReviewItem,
  LessonReviewPriority,
  VocabularyReviewItem,
} from '../lib/lesson-review';

type GrammarFixture = Pick<GrammarReviewItem, 'id' | 'kind' | 'format' | 'priority' | 'prompt' | 'answer'>
  & Partial<Pick<GrammarReviewItem, 'explanation'>>;
type VocabularyFixture = Pick<VocabularyReviewItem, 'id' | 'kind' | 'priority' | 'word' | 'meaning'>
  & Partial<Pick<VocabularyReviewItem, 'reading' | 'contextSentence'>>;

function vocabulary(
  id: string, priority: LessonReviewPriority, word: string, meaning: string, reading?: string,
): VocabularyFixture {
  return { id, kind: 'vocabulary', priority, word, meaning, ...(reading ? { reading } : {}) };
}

function concept(
  id: string, priority: LessonReviewPriority, prompt: string, answer: string,
): GrammarFixture {
  return { id, kind: 'concept', format: 'qa', priority, prompt, answer };
}

function application(
  id: string, priority: LessonReviewPriority, prompt: string, answer: string,
  format: 'cloze' | 'qa' = 'cloze',
): GrammarFixture {
  return { id, kind: 'rule', format, priority, prompt, answer };
}

// Human-reviewed teaching units, not a minimum card count. Changing a prompt,
// priority, or linguistic qualification requires reviewing its named fixture.
const PILOT: Record<string, (GrammarFixture | VocabularyFixture)[]> = {
  'ru/spelling-rules': [
    vocabulary('vocab-kniga', 'essential', 'кни́га', 'book', 'kníga'),
    vocabulary('vocab-rubashka', 'essential', 'руба́шка', 'shirt', 'rubáshka'),
    vocabulary('vocab-lampa', 'essential', 'ла́мпа', 'lamp', 'lámpa'),
    vocabulary('vocab-tikhiy', 'essential', 'ти́хий', 'quiet', 'tíkhiy'),
    vocabulary('vocab-koshka', 'optional', 'ко́шка', 'cat', 'kóshka'),
    vocabulary('vocab-nozhka', 'optional', 'но́жка', 'little leg', 'nózhka'),
    vocabulary('vocab-novyy', 'optional', 'но́вый', 'new', 'nóvyy'),
    vocabulary('vocab-russkiy', 'optional', 'ру́сский', 'Russian', 'rússkiy'),
    vocabulary('vocab-khoroshiy', 'optional', 'хоро́ший', 'good', 'khoróshiy'),
    vocabulary('vocab-strogiy', 'optional', 'стро́гий', 'strict', 'strógiy'),
    vocabulary('vocab-nozh', 'optional', 'нож', 'knife', 'nozh'),
    vocabulary('vocab-karandash', 'optional', 'каранда́ш', 'pencil', 'karandásh'),
    vocabulary('vocab-muzh', 'optional', 'муж', 'husband', 'muzh'),
    vocabulary('vocab-ulitsa', 'optional', 'у́лица', 'street', 'úlitsa'),
    vocabulary('vocab-tsaritsa', 'optional', 'цари́ца', 'tsarina', 'tsarítsa'),
    vocabulary('vocab-ogurtsy', 'optional', 'огурцы́', 'cucumbers (plural)', 'ogurtsý'),
    vocabulary('vocab-otets', 'optional', 'оте́ц', 'father', 'otéts'),
    vocabulary('vocab-pisat', 'optional', 'писа́ть', 'to write', "pisát'"),
    vocabulary('vocab-uchit', 'optional', 'учи́ть', 'to teach', "uchít'"),
    vocabulary('vocab-slyshat', 'optional', 'слы́шать', 'to hear', "slýshat'"),
    application('seven-letter-plural', 'essential',
      'Say that good books are on the shelf. Use the plural of кни́га: Хоро́шие ___ лежа́т на по́лке.', 'кни́ги'),
    concept('seven-letter-scope', 'essential',
      'Which consonants trigger the seven-letter ы → и rule?',
      'к, г, х, ж, ш, щ, ч; ц is not in this set.'),
    {
      ...concept('seven-letter-mnemonic', 'optional',
        'Which Russian sentence about a siskin helps you remember the seven-letter spelling rule?',
        'Где Же Шёл Чижик, Щипая Хлеб с Колбасой?'),
      explanation: '“Where did the siskin walk, nibbling bread with sausage?” Где → Г; Же → Ж; Шёл → Ш; Чижик → Ч; Щипая → Щ; Хлеб → Х; Колбасой → К. Skip с (“with”): it is not one of the seven initials.',
    },
    application('seven-letter-adjective', 'optional',
      'Describe a quiet house: ти́х___ дом.', 'ий'),
    concept('five-letter-stress-condition', 'essential',
      'In the noun and adjective endings taught here, how do you choose о or е after ж, ш, ч, щ, ц?',
      'Write о when the ending vowel is stressed; write е when it is unstressed.'),
    application('five-letter-stressed-o', 'essential',
      'With a knife: нож___м. (The ending is stressed.)', 'о́'),
    application('five-letter-unstressed-e', 'essential',
      'With a husband: му́ж___м.', 'е'),
    application('five-letter-ts-ending', 'optional', 'With a hare: за́йц___м.', 'е'),
    application('ts-u-application', 'essential',
      'To the father: отц___. (dative of оте́ц)', 'у́'),
    application('ts-a-application', 'optional', 'Finish the dictionary form for street: у́лиц___.', 'а'),
    concept('rule-ts-u-a', 'optional',
      'In ordinary Russian words, what do you write after ц instead of ю, and instead of я?',
      'у instead of ю; а instead of я.'),
    {
      ...concept('ts-rule-exceptions', 'essential',
        "You see Zurich written Цю́рих. Why isn't the ю a spelling mistake?",
        'Borrowed names can keep ю after ц.'),
      explanation: 'Ordinary Russian spellings use у and а after ц. A few borrowings and names keep ю or я, as in Цю́рих and Цявло́вский.',
    },
    application('hushing-verb-u', 'optional', 'I write: я пиш___. (писа́ть)', 'у́'),
  ],
  'ja/taekim-verb-classification': [
    vocabulary('vocab-nomu', 'essential', '飲む', 'to drink', 'のむ'),
    vocabulary('vocab-oyogu', 'essential', '泳ぐ', 'to swim', 'およぐ'),
    vocabulary('vocab-kaeru', 'essential', '帰る', 'to return home', 'かえる'),
    vocabulary('vocab-hashiru', 'essential', '走る', 'to run', 'はしる'),
    vocabulary('vocab-kiru', 'optional', '切る', 'to cut', 'きる'),
    vocabulary('vocab-shiru', 'optional', '知る', 'to know', 'しる'),
    vocabulary('vocab-hairu', 'optional', '入る', 'to enter', 'はいる'),
    vocabulary('vocab-suru', 'essential', 'する', 'to do', 'する'),
    vocabulary('vocab-kuru', 'essential', '来る', 'to come', 'くる'),
    vocabulary('vocab-benkyou-suru', 'optional', '勉強する', 'to study', 'べんきょうする'),
    application('ichidan-polite', 'essential',
      '毎日(まいにち)朝(あさ)ごはんを食(た)べ___。', 'ます'),
    application('godan-polite', 'essential',
      '毎朝(まいあさ)新聞(しんぶん)を読(よ)___。', 'みます'),
    concept('classification-heuristic', 'essential',
      'After setting aside する and 来る, does an /i/ or /e/ sound before る guarantee an ichidan verb?',
      'No. It suggests ichidan, but godan exceptions such as 帰る (かえる) and 走る (はしる) must be learned with their verb type.'),
    application('kaeru-godan-polite', 'essential',
      '毎日(まいにち)六時(ろくじ)に家(いえ)に___。', '帰(かえ)ります'),
    application('hashiru-godan-classification', 'optional',
      'Classify 走る (はしる, to run): ichidan, godan, or irregular?', 'Godan (う-verb).', 'qa'),
    concept('irregular-verb-members', 'essential',
      'Which two basic verbs are set aside as irregular before using the ichidan/godan decision guide?',
      'する (to do) and 来る (くる, to come).'),
    application('suru-compound-polite', 'optional', '勉強する → polite: 勉強___.', 'します'),
    application('kuru-polite', 'essential',
      '明日(あした)、友達(ともだち)が___。', '来(き)ます'),
  ],
  'es/cheatsheet-accent-rules': [
    vocabulary('vocab-arbol', 'essential', 'árbol', 'tree'),
    vocabulary('vocab-pais', 'essential', 'país', 'country'),
    vocabulary('vocab-tu-possessive', 'optional', 'tu', 'your (possessive)'),
    vocabulary('vocab-tu-pronoun', 'optional', 'tú', 'you (subject pronoun)'),
    vocabulary('vocab-baul', 'optional', 'baúl', 'trunk (storage chest)'),
    concept('aguda-accent-condition', 'essential',
      'When does an aguda, stressed on the last syllable, need a written tilde?',
      'When it ends in a vowel, or in n or s not preceded by another consonant.'),
    application('llana-arbol-application', 'essential',
      "The word 'árbol' carries a tilde because it ends in ___ and is stressed on the first syllable.",
      'l (a consonant other than n or s)'),
    concept('esdrujula-accent', 'essential',
      'A word is stressed on its third-to-last syllable. Does its final letter decide whether it takes a tilde?',
      'No. Esdrújulas always take a tilde.'),
    application('sobreesdrujula-application', 'optional',
      'Add the required tilde to digamelo (tell it to me), stressed on dí.', 'dígamelo', 'qa'),
    concept('diacritic-tu-contrast', 'essential',
      'What is the difference between tu and tú?',
      'tu means your (possessive); tú means you (subject pronoun).'),
    application('diacritic-el-application', 'optional',
      '___ me lo explicó ayer. (He explained it to me yesterday.)', 'Él'),
    concept('hiatus-weak-vowel-condition', 'essential',
      'What happens when a stressed i or u is next to an unstressed a, e, or o?',
      'They form a hiato, and the stressed i or u takes a tilde even if the general accent rules would not require one.'),
    application('hiatus-pais-application', 'essential',
      'Write the Spanish word for country with its required accent mark: pais.', 'país', 'qa'),
    concept('diphthong-general-rules', 'essential',
      'Does having a diptongo mean a word can never carry a tilde? Use canción as a check.',
      'No. Diptongos follow the general accent rules; canción takes a tilde because it is aguda and ends in n.'),
    concept('solo-ambiguity-qualification', 'optional',
      'Under current RAE guidance, is sólo an unrestricted alternative whenever solo means only?',
      'No. An optional tilde is limited to adverbial solo where the writer judges a risk of ambiguity; writing solo without a tilde is recommended.'),
    concept('demonstrative-ambiguity-qualification', 'optional',
      'When may este, ese, or aquel optionally carry a tilde, and can esto ever take one?',
      'Only in pronominal uses with a risk of ambiguity; not when accompanying a noun. Esto, eso, and aquello never take a tilde.'),
    application('uppercase-accent-application', 'essential',
      'Write África entirely in capital letters, preserving correct spelling.', 'ÁFRICA', 'qa'),
  ],
  'pt/gerund-progressive': [
    vocabulary('vocab-falar', 'essential', 'falar', 'to speak'),
    vocabulary('vocab-comer', 'essential', 'comer', 'to eat'),
    vocabulary('vocab-partir', 'optional', 'partir', 'to leave'),
    vocabulary('vocab-por', 'optional', 'pôr', 'to put'),
    concept('gerund-endings', 'essential',
      'How do regular Portuguese -ar, -er, and -ir infinitives form their gerunds?',
      'Replace -ar with -ando, -er with -endo, and -ir with -indo.'),
    application('gerund-ar-application', 'optional', 'falar → ___. (gerund)', 'falando'),
    application('gerund-er-application', 'essential', 'Ela está ___ um livro. (ler)', 'lendo'),
    application('gerund-ir-application', 'optional', 'partir → ___. (gerund)', 'partindo'),
    application('por-gerund-application', 'essential', 'pôr → ___. (gerund)', 'pondo'),
    application('present-progressive-application', 'essential',
      'Nós ___ ___ português. (estar + estudar)', 'estamos estudando'),
    application('past-progressive-application', 'essential',
      'Eu ___ ___ quando ela chegou. (estar + dormir)', 'estava dormindo'),
    concept('gerund-versus-progressive', 'essential',
      'What is the difference between estudando and estou estudando?',
      'Estudando is the gerund; estou estudando combines present-tense estar with that gerund to mean I am studying.'),
    concept('progressive-variety-contrast', 'essential',
      'What common progressive constructions correspond to I am speaking in Brazilian and European Portuguese?',
      'Brazilian Portuguese commonly uses estou falando; European Portuguese commonly uses estou a falar.'),
    concept('spoken-brazilian-contractions', 'optional',
      'What register and variety do Tô estudando and Tá chovendo illustrate?',
      'Informal spoken Brazilian Portuguese, with shortened forms of estar; formal writing normally uses the full forms.'),
    concept('continuar-meaning', 'optional',
      'What does continua estudando add beyond está estudando?',
      'It means keeps studying or continues studying, emphasizing that the action continues.'),
    application('ficar-waiting-application', 'optional',
      'Ela ficou ___ por horas. (esperar; She stayed waiting for hours.)', 'esperando'),
    concept('ir-gradual-action', 'optional',
      'What does vai melhorando aos poucos express in A situação vai melhorando aos poucos?',
      'The situation is gradually getting better, little by little.'),
    concept('andar-lately-meaning', 'optional',
      'What does Ele anda trabalhando demais mean in this lesson?',
      'He has been working too much lately.'),
  ],
  'ro/cognates-false-friends': [
    vocabulary('vocab-actual', 'essential', 'actual', 'current; present-day'),
    vocabulary('vocab-simpatic', 'essential', 'simpatic', 'nice; likeable'),
    vocabulary('vocab-sensibil', 'essential', 'sensibil', 'sensitive'),
    vocabulary('vocab-rezonabil', 'essential', 'rezonabil', 'sensible; reasonable'),
    {
      ...vocabulary('vocab-librarie', 'essential', 'librărie', 'bookstore'),
      contextSentence: 'Cumpăr o carte la librărie.',
    },
    vocabulary('vocab-biblioteca', 'essential', 'bibliotecă', 'library'),
    vocabulary('vocab-camera', 'optional', 'cameră', 'room; camera in compounds such as cameră video'),
    vocabulary('vocab-eventual', 'optional', 'eventual', 'possible; if necessary (adverbial use)'),
    application('cognate-informatie-application', 'essential',
      'Am nevoie de mai multă ___. (information)', 'informație'),
    concept('cognate-endings-tendency', 'essential',
      "What Romanian endings often correspond to English -tion, and does that guarantee a word's meaning?",
      'Often -ție or -țiune; no, the meaning and Romanian spelling still need checking.'),
    concept('actual-real-contrast', 'essential',
      'How does Romanian actual differ from English actual meaning real?',
      'Romanian actual means current or present-day; use real or adevărat for English actual meaning real.'),
    concept('personality-false-friend-contrast', 'essential',
      'Which Romanian words mean likeable, sensitive, and sensible respectively?',
      'simpatic = likeable; sensibil = sensitive; rezonabil = sensible or reasonable.'),
    application('sensible-idea-application', 'optional',
      'Este o idee ___. (It is a sensible idea.)', 'rezonabilă'),
    application('librarie-buying-application', 'essential', 'Cumpăr o carte la ___.', 'librărie'),
    concept('librarie-biblioteca-contrast', 'essential',
      'What is the difference between a librărie and a bibliotecă?',
      'A librărie is a bookstore where books are sold; a bibliotecă is a library where books can be borrowed.'),
    concept('magazin-revista-contrast', 'optional',
      'Does Romanian magazin mean an English magazine? What word names that publication?',
      'No. Magazin means shop or store; revistă means magazine.'),
    concept('cognate-verification', 'optional',
      'What should you check before trusting a familiar-looking Romanian cognate?',
      'Its meaning in context, gender and plural, pronunciation, and diacritics.'),
  ],
  'ar/masdar': [
    vocabulary('vocab-kitabah', 'essential', 'كِتَابَةٌ', 'writing; the act of writing', 'kitābatun'),
    vocabulary('vocab-dirasah', 'essential', 'دِرَاسَةٌ', 'study; the act of studying', 'dirāsatun'),
    vocabulary('vocab-darasa', 'optional', 'دَرَسَ', 'he studied; to study (dictionary form)', 'darasa'),
    vocabulary('vocab-taallum', 'optional', 'تَعَلُّمٌ', 'learning; the act of learning', 'taʿallumun'),
    vocabulary('vocab-istimal', 'optional', 'اِسْتِعْمَالٌ', 'use; the act of using', 'istiʿmālun'),
    concept('masdar-core-concept', 'essential',
      'What does an Arabic maṣdar name, and does it by itself say who acted or when?',
      'It names an action or process itself, without specifying an actor or a tense.'),
    application('masdar-reading-object', 'essential',
      'Complete “I love reading”: أُحِبُّ ___ (uḥibbu ___).', 'الْقِرَاءَةَ'),
    concept('masdar-subject-use', 'optional',
      'What role does تَعَلُّمُ الْعَرَبِيَّةِ have in تَعَلُّمُ الْعَرَبِيَّةِ مُفِيدٌ?',
      'It is the subject: learning Arabic. The sentence means Learning Arabic is useful.'),
    application('form-one-dirasah-application', 'essential',
      'Complete “study”: دَرَسَ (darasa) → ___ (dirāsatun).', 'دِرَاسَةٌ'),
    concept('form-one-not-predictable', 'essential',
      'Can you derive every Form I maṣdar by copying the shape in دَرَسَ → دِرَاسَةٌ?',
      'No. Many Form I maṣdars must be learned individually with their verbs; there is no single universal shape.'),
    application('form-five-taallum-application', 'optional',
      'Learning (Form V): ___. (from تَعَلَّمَ, he learned)', 'تَعَلُّمٌ'),
    application('form-ten-istimal-application', 'optional',
      'اِسْتَعْمَلَ (he used) → ___. (use)', 'اِسْتِعْمَالٌ'),
  ],
};

const LESSONS = import.meta.glob([
  '../../public/content/grammar/ru/spelling-rules.md',
  '../../public/content/grammar/ja/taekim-verb-classification.md',
  '../../public/content/grammar/es/cheatsheet-accent-rules.md',
  '../../public/content/grammar/pt/gerund-progressive.md',
  '../../public/content/grammar/ro/cognates-false-friends.md',
  '../../public/content/grammar/ar/masdar.md',
], { query: '?raw', import: 'default', eager: true }) as Record<string, string>;

const LEGACY_IDENTITIES: Record<string, [string, string, string][]> = {
  'ru/spelling-rules': [
    ['seven-letter-plural', 'After к, г, х, ж, ч, ш and щ write и, never ы',
      'Хоро́шие ___ лежа́т на по́лке.'],
  ],
  'ja/taekim-verb-classification': [
    ['ichidan-polite', 'Ichidan verbs simply drop る',
      '毎日(まいにち)朝(あさ)ごはんを食(た)べ___。'],
    ['godan-polite', 'Godan verbs shift the final う sound to い before ます',
      '毎朝(まいあさ)新聞(しんぶん)を読(よ)___。'],
    ['kaeru-godan-polite', 'Some verbs ending in る are godan despite appearances',
      '毎日(まいにち)六時(ろくじ)に家(いえ)に___。'],
    ['kuru-polite', '来る is irregular and changes its reading when it conjugates',
      '明日(あした)、友達(ともだち)が___。'],
  ],
  'es/cheatsheet-accent-rules': [
    ['llana-arbol-application',
      'Words ending in vowel, n, or s are llanas by default — no tilde unless stress falls elsewhere',
      "The word 'árbol' carries a tilde because it ends in ___ and is stressed on the first syllable."],
  ],
  'pt/gerund-progressive': [
    ['gerund-er-application', 'Gerund formation', 'Ela está ___ um livro. (ler)'],
    ['present-progressive-application', 'Present progressive with estar',
      'Nós ___ ___ português. (estar + estudar)'],
    ['past-progressive-application', 'Past progressive with estava',
      'Eu ___ ___ quando ela chegou. (estar + dormir)'],
  ],
  'ro/cognates-false-friends': [
    ['cognate-informatie-application', 'English -tion cognates often correspond to Romanian -ție',
      'Am nevoie de mai multă ___. (information)'],
    ['librarie-buying-application', 'Librărie means bookstore; bibliotecă means library',
      'Cumpăr o carte la ___.'],
  ],
  'ar/masdar': [
    ['masdar-reading-object', 'A maṣdar names the action itself, not the doer or receiver.',
      'Complete “I love reading”: أُحِبُّ ___ (uḥibbu ___).'],
    ['form-one-dirasah-application',
      'Derived verb forms often have recognizable maṣdar patterns, but many Form I maṣdars must be learned individually.',
      'Complete “study”: دَرَسَ (darasa) → ___ (dirāsatun).'],
  ],
};

for (const [lesson, fixtures] of Object.entries(PILOT)) {
  describe(`lesson retention: ${lesson}`, () => {
    const markdown = LESSONS[`../../public/content/grammar/${lesson}.md`];
    const parsed = parseLessonReviewItems(markdown);

    it('has valid metadata and lesson-local unique IDs across both kinds of blocks', () => {
      expect(parsed.diagnostics).toEqual([]);
    });

    for (const fixture of fixtures) {
      it(`retains ${fixture.id}`, () => {
        expect(parsed.items.find((item) => item.id === fixture.id)).toMatchObject({
          ...fixture,
          provenance: 'authored',
          source: fixture.kind === 'vocabulary' ? 'vocab-card' : 'grammar-card',
        });
      });
    }

    it('leaves formatting-only suggestions optional', () => {
      for (const item of parsed.items.filter((item) => item.provenance === 'formatting')) {
        expect(item.priority, item.id).toBe('optional');
      }
    });

    for (const [id, rule, example] of LEGACY_IDENTITIES[lesson]) {
      it(`preserves the legacy rule/prompt identity of ${id}`, () => {
        const item = parsed.items.find((candidate) => candidate.id === id);
        expect(item).toBeDefined();
        if (!item || item.kind === 'vocabulary') throw new Error(`Missing grammar item ${id}`);
        expect([{ rule: item.rule, example: item.prompt }, ...item.legacyAliases])
          .toContainEqual({ rule, example });
      });
    }
  });
}

describe('pilot lexical versus grammatical targets', () => {
  it('offers precisely the reviewed spelling reference inventory, with no formatting spillover', () => {
    const { items } = parseLessonReviewItems(LESSONS['../../public/content/grammar/ru/spelling-rules.md']);
    expect(items.map((item) => item.id).sort()).toEqual(PILOT['ru/spelling-rules'].map((item) => item.id).sort());
  });

  it('does not turn suffix applications or rejected Russian spellings into authored vocabulary', () => {
    const { items } = parseLessonReviewItems(
      LESSONS['../../public/content/grammar/ru/spelling-rules.md'],
    );
    const words = items
      .filter((item): item is VocabularyReviewItem =>
        item.kind === 'vocabulary' && item.provenance === 'authored')
      .map((item) => item.word);
    for (const nonword of ['-и', 'ий', 'о́', 'е', 'у́', 'книгы', 'отцю', 'пишю']) {
      expect(words).not.toContain(nonword);
    }
  });

  it('uses the explicit meaning for a duplicated visible word instead of the whole rule annotation', () => {
    const { items } = parseLessonReviewItems(
      LESSONS['../../public/content/grammar/ru/spelling-rules.md'],
    );
    expect(items.filter((item) => item.kind === 'vocabulary' && item.word === 'ла́мпа'))
      .toMatchObject([{ id: 'vocab-lampa', meaning: 'lamp', priority: 'essential' }]);
  });
});
