import type { LessonBaseline } from './types';

// Source: git show ab35670cc1b6a4bdf9425a22d457b14f326562b7:public/content/grammar/ru/{lesson}.md (main before this rollout).
// The first two fields are literal shipped identities, not reconstructed from today's content.
// Only the third (the approved successor; null = retired, no review transfer) is an authoring decision.
export const baseline: Record<string, LessonBaseline> = {
  "prepositions-advanced": {
    quizzes: [4, "39f845238b6f26f950b5032153eb44dae4b8e5c08227c6b1ba0bbd8cb77bf06d"],
    identities: [
      ["Из-за marks an unwelcome cause and takes the genitive", "___ дождя мы остались дома.", "rain-iz-za"],
      ["Благодаря marks a welcome cause and takes the dative", "___ помощи друзей я справился.", "friends-help-blagodarya"],
    ],
  },
  "register-formality": {
    quizzes: [4, "c349c2ea1eb13f3334e6772a7b60c13986a8362a3ac99655aba1a2a640f364c3"],
    identities: [
      ["Вы always takes plural verb agreement", "___ говорите по-русски?", "polite-speak-russian"],
      ["The pronoun must match the ending the verb already carries", "Как ___ себя чувствуешь?", "friend-feeling"],
    ],
  },
  "culture-context": {
    quizzes: [4, "433eb10f2ece62c684df600068dd413f65ead62eed2bf8c7d23bf5860800a4ac"],
    identities: [
      ["A woman's patronymic ends in -овна or -евна", "Мария ___, можно вопрос?", "patronymic-ivanovna"],
      ["Respectful address is first name plus patronymic, with no title", "Здравствуйте, Иван ___!", "patronymic-petrovich"],
      ["A stranger is always addressed with Вы", "___ не подскажете, где метро?", "stranger-metro"],
    ],
  },
  "resources": {
    quizzes: [3, "a6c03c7cbea21094a4c0feabb2e2dc97b9436d932988f76a71e1d16f7439c8b6"],
    identities: [
    ],
  },
  "diminutives": {
    quizzes: [3, "fb5ac7d5dfd6273c9c60a31db3daeb72f4ff1b5e0ff9b62f45ccbe1f632ed01c"],
    identities: [
      ["A diminutive softens an offer and makes it sound friendly", "Хочешь ___?", "offer-tea-chayku"],
      ["The -ушк- suffix adds warmth rather than smallness", "Дай мне ___.", "warm-bread-khlebushek"],
    ],
  },
  "numbers-with-cases": {
    quizzes: [3, "05b406a211b8e381e4a27eb6a28cd54994bb840b50657ff3525d6047ebf8574f"],
    identities: [
      ["The numbers 2, 3 and 4 are followed by the genitive singular", "___ студента пришли.", null],
    ],
  },
  "aspect-practical": {
    quizzes: [3, "b998a731a8a395b0a7982f47619a1cf9ce1b4238112c3f6865d4c29a345d2120"],
    identities: [
      ["A background action interrupted by another takes the imperfective", "Я ___, когда ты позвонил.", "interrupted-reading"],
      ["An action with a reached result takes the perfective", "Она ___ ужин и села за стол.", "dinner-ready"],
      ["Denying that something ever happened uses the imperfective", "Я никогда не ___ эту книгу.", "never-read"],
    ],
  },
  "common-mistakes": {
    quizzes: [3, "e8f1578984572fb07bd5d18ed15eecd52bd755c57b85c306c7689c2ebb69b9ca"],
    identities: [
      ["After a negated verb the object commonly shifts to the genitive", "Я не вижу ___.", null],
      ["Repeated there-and-back trips use the multidirectional verb", "Каждый день я ___ в университет.", "daily-trips-khozhu"],
    ],
  },
  "formal-writing": {
    quizzes: [3, "714d9f6656fe8b026e0cea1fedd4ef9a7ec0f5aa48ca4c90a702ccd7dfdcf900"],
    identities: [
      ["The person something is sent to stands in the dative", "Направляю ___ документы.", "send-documents-vam"],
      ["Capitalised Вы still declines like any other pronoun", "Прошу ___ ответить на моё письмо.", "ask-reply-vas"],
    ],
  },
  "verbal-nouns": {
    quizzes: [3, "52af18dca08da2f7a9a4126927e8730a68d39a7203487bf5cd1f915ae72644e9"],
    identities: [
      ["A verbal noun lets an action take a genitive complement of its own", "___ этой задачи заняло два часа.", "solving-reshenie"],
      ["The suffix -ение turns a verb into the name of its action", "___ русского языка требует терпения.", "studying-izuchenie"],
    ],
  },
};
