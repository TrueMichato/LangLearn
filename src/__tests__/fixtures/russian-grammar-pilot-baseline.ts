import type { QuizCorrection } from '../helpers/grammar-retention';

// Source: git show 52dc334be3844d2b02de3fb35ebb1887d0999b13:public/content/grammar/ru/{lesson}.md
// The first two fields are literal shipped identities, not reconstructed from today's content.
// The third is the only approved successor (null = retired; do not transfer a review).
type PreviousIdentity = readonly [rule: string, example: string, successor: string | null];
interface LessonBaseline {
  quizzes: readonly [count: number, sha256: string];
  identities: readonly PreviousIdentity[];
}

export const baseline = {
  'alphabet-sounds': {
    quizzes: [5, '1905afe5a96b643163ac2f173ae83e3a34efc5a494cc20c07b15ae2ee77d9237'],
    identities: [
      ['The hard sign Ъ separates a prefix from a following е, ё, ю or я', 'Он с___ел весь суп.', 'prefix-hard-sign'],
    ],
  },
  'pronunciation-rules': {
    quizzes: [5, '07817ea41b424b27e89e7c947716b6a06acd85a64792d2b4e3e7630eedac4cf8'],
    identities: [
      ['A voiced consonant at the end of a word is pronounced voiceless but still written as voiced', 'На столе лежит хле___.', 'bread-final-spelling'],
    ],
  },
  stress: {
    quizzes: [4, '1526370fc93e30bfbbee2cb77460c08b207b449406d5f3510218975b8e950fff'],
    identities: [
      ['Stress alone can separate two entirely different words', 'Он купил ___ для двери за́мка.', 'lock-stress'],
      ['Some nouns move their stress when they change case', 'Она повернула ___.', 'head-accusative-stress'],
      ['The feminine past of быть is stressed on its ending', 'Она́ ___ до́ма.', 'feminine-past-stress'],
    ],
  },
  'spelling-rules': {
    quizzes: [4, 'b1e7afa7fd8353a518067fc347c8b765435cd552983ac2d87ef5c864506a524f'],
    identities: [
      ['After к, г, х, ж, ч, ш and щ write и, never ы', 'Хоро́шие ___ лежа́т на по́лке.', 'seven-letter-plural'],
      ['The seven-letter ы → и rule does not include ц', 'Which consonants trigger the seven-letter ы → и rule, and is ц one of them?', 'seven-letter-scope'],
      ['The seven-letter rule also affects adjective endings', 'A quiet house: ти́х___ дом. (-ый or -ий?)', 'seven-letter-adjective'],
      ['Stress determines о or е in these endings after ж, ш, ч, щ, ц', 'In the noun and adjective endings taught here, how do you choose о or е after ж, ш, ч, щ, ц?', 'five-letter-stress-condition'],
      ['A stressed instrumental ending keeps о after ж', 'With a knife: нож___м. (The ending is stressed.)', 'five-letter-stressed-o'],
      ['An unstressed instrumental ending uses е after ж', 'With a husband: му́ж___м.', 'five-letter-unstressed-e'],
      ['The five-letter ending rule includes ц', 'With a hare: за́йц___м.', 'five-letter-ts-ending'],
      ['Write у rather than ю after ц in ordinary Russian endings', 'To the father: отц___. (dative of оте́ц)', 'ts-u-application'],
      ['Write а rather than я after ц in ordinary Russian spellings', 'Street: у́лиц___. (а or я?)', 'ts-a-application'],
      ['The цу/ца rule has rare borrowed-word and proper-name exceptions', 'What replaces ю and я after ц in ordinary Russian spelling, and why can Цю́рих still contain ю?', 'ts-rule-exceptions'],
      ['The illustrated verb forms write у after ш and ч', 'I write: я пиш___. (писа́ть)', 'hushing-verb-u'],
      ['A mnemonic sentence helps recall the seven-letter consonant set', 'Recall the siskin mnemonic for the seven-letter spelling rule, including its meaning and the initials it encodes.', 'seven-letter-mnemonic'],
    ],
  },
  cases: {
    quizzes: [2, '933087c2c272b0100572a6ccaf300400eb88bfcfa872d087b5623d35f1fb77d5'],
    identities: [
      ['The accusative marks the direct object of a transitive verb', 'Он читает ___.', 'book-as-object'],
      ['The dative marks the person something is given to', 'Я дал книгу ___.', 'student-as-recipient'],
      ['After нет the missing thing stands in the genitive', 'У меня нет ___.', 'absent-cat'],
    ],
  },
  'verb-aspects': {
    quizzes: [2, 'da49cb15269bf2f1181625e709cdf3f0613db39997033c0846beeb0055841d5b'],
    identities: [
      ['A completed result calls for the perfective', 'Я ___ книгу.', 'finished-book'],
      ['Habits and repeated actions take the imperfective', 'Каждый день я ___ новые слова.', 'daily-study'],
      ['A stated duration calls for the imperfective', 'Я ___ книгу два часа.', 'reading-for-two-hours'],
    ],
  },
  gender: {
    quizzes: [5, '2d96e1e2dbb2ba12ef6f3a70a3c1571187fb5d61944b42657f94cd10d53f2430'],
    identities: [
      // Producing the lexical nouns “table” and “night” is not evidence of gender agreement.
      ['A noun ending in a consonant is masculine', '___ стоит в углу.', null],
      ['Nouns ending in -ь may be masculine or feminine and must be learned individually', 'Сегодня холодная ___.', null],
      ['An adjective takes the gender of the noun it modifies', 'Это ___ книга.', 'new-book-agreement'],
    ],
  },
  'nominative-accusative': {
    quizzes: [5, 'af73d8ae6a2c3a868685fc95baf9dd03670db634e54740d3e86072dccaf56966'],
    identities: [
      // Copying стол did not require distinguishing an animate object from an inanimate one.
      ['Masculine inanimate nouns look identical in the accusative', 'Я вижу ___.', null],
      ['A transitive verb puts its object in the accusative', 'Она читает ___.', 'book-accusative'],
      // Supplying в is a preposition task, not inflecting the noun for a destination.
      ['Motion towards a place uses в or на plus the accusative', 'Я иду ___ школу.', null],
    ],
  },
  genitive: {
    quizzes: [5, '73974b1dd2e60bb752057cf06775578563750542f812e94033c44cf4b9e247b0'],
    identities: [
      // Supplying нет is not producing the absent noun's ending.
      ['Absence is expressed by нет plus the genitive', 'У меня ___ машины.', null],
      ['Possession is built with у plus the genitive', '___ меня есть собака.', 'possession-frame'],
      ['An adjective follows its noun into the genitive', 'Книга нов___ студента на столе.', 'possessor-adjective'],
    ],
  },
  dative: {
    quizzes: [5, 'c41993f400dab40d4437e08aa1a7c236434251c8bff581aa0f84c7427af86592'],
    identities: [
      ['The dative marks the indirect object — the recipient', 'Я дал книгу ___.', 'friend-as-recipient'],
      ['Personal pronouns have their own dative forms to memorise', 'Дайте ___ время.', 'give-them-time'],
      ['Permission and prohibition put the person in the dative', '___ можно?', 'asking-permission'],
    ],
  },
} satisfies Record<string, LessonBaseline>;

const originalStressQuiz = {
  type: 'multiple-choice',
  question: 'Which pair shows the same word with different stress changing its meaning?',
  options: ['кот / кит (cat / whale)', 'мука́ / му́ка (torment / flour)', 'дом / том (house / volume)', 'мир / мор (peace / plague)'],
  answer: 1,
};

export const stressQuizCorrection: QuizCorrection = {
  lessonKey: 'ru/stress', position: 4,
  rationale: 'The shipped glosses were reversed: мука́ is flour and му́ка is torment. Only the gloss order changes; the Russian words, option position, and scoring stay the same.',
  original: originalStressQuiz,
  corrected: {
    ...originalStressQuiz,
    options: ['кот / кит (cat / whale)', 'мука́ / му́ка (flour / torment)', 'дом / том (house / volume)', 'мир / мор (peace / plague)'],
  },
};
