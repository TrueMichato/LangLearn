import type { LessonBaseline } from './types';

// Source: git show ab35670cc1b6a4bdf9425a22d457b14f326562b7:public/content/grammar/ru/{lesson}.md (main before this rollout).
// The first two fields are literal shipped identities, not reconstructed from today's content.
// Only the third (the approved successor; null = retired, no review transfer) is an authoring decision.
export const baseline: Record<string, LessonBaseline> = {
  "comparatives": {
    quizzes: [5, "34e4483a3e6b1657e2a506d7df575552404ba40bdeb1743b881fa53264707969"],
    identities: [
      ["A handful of everyday comparatives are irregular and must be learned whole", "Москва ___ Петербурга.", "moscow-bigger"],
      ["Более plus an unchanged adjective builds a compound comparative", "Она ___ ответственная студентка.", "more-responsible-student"],
      ["The suffix -ейший turns an adjective into a one-word superlative", "Это красив___ город в мире.", "most-beautiful-city"],
    ],
  },
  "conjunctions": {
    quizzes: [5, "b57ddc40639f7545d74bef54d6e9445523dbfc106a16adebbdd2624fa3b33772"],
    identities: [
      ["И joins items of equal weight", "Я люблю чай ___ кофе.", "tea-and-coffee"],
      ["Но marks a genuine contradiction between the clauses", "Я устал, ___ не сплю.", "tired-not-sleeping"],
      ["А contrasts two facts without setting them against each other", "Я читаю, ___ он спит.", "reading-while-sleeping"],
    ],
  },
  "expressions": {
    quizzes: [5, "ab1bfa7fe55d1b6c49a6cecbf4ddcde8d9584fcb52dfcc3e9b36c118073c0817"],
    identities: [
      ["Вы takes plural agreement even when it refers to one person", "___ очень добры.", "vy-very-kind"],
      ["Moving to informal address is asked for, not assumed", "Можно на \"___\"?", "switch-to-ty"],
    ],
  },
  "imperative": {
    quizzes: [4, "bf9caec5100ccaf1872dc0b92c527b0af63d0fdfc2bc1ef6244668191f781db4"],
    identities: [
      ["Adding -те makes an imperative polite or plural", "Читай___ текст на странице пять.", "read-page-five-polite"],
    ],
  },
  "prefixes": {
    quizzes: [4, "87dcc90b7b16d330c20ac318bbaa9b9f7bc1a177b42f49ea2e45ed80dec6611f"],
    identities: [
      ["The prefix в- adds the sense of movement into something", "Он ___ в комнату.", "entered-the-room"],
      ["The prefix вы- means movement out of somewhere", "Она ___ из дома.", "went-out-of-the-house"],
      ["The prefix при- marks arrival at the destination", "Гости ___ вовремя.", "guests-arrived"],
    ],
  },
  "participles": {
    quizzes: [4, "ffcd4479dd8f0f6587e9444dee32153d1538056f6d30569e370d430d4e33a136"],
    identities: [
      ["A present active participle is the они-form plus -щий", "Человек, говоря___ по телефону, — мой брат.", "person-speaking-on-phone"],
      ["A past active participle replaces the past -л with -вший", "Человек, написа___ эту книгу, живёт в Москве.", "person-who-wrote-book"],
      ["Passive participles decline exactly like ordinary adjectives", "Он — уважаем___ профессор.", "respected-professor"],
    ],
  },
  "gerunds": {
    quizzes: [3, "fbf8de08f2c070f892fee026070fb0d8adecef1437afe51a29e96f24efbbec1e"],
    identities: [
      ["A verbal adverb must share its subject with the main verb", "Читая книгу, она ___ чай.", "reading-drank-tea"],
      ["Perfective verbal adverbs end in -в or -вши, keeping -сь if reflexive", "Вернув___ домой, мы поужинали.", "returned-home-had-dinner"],
    ],
  },
  "conditional": {
    quizzes: [3, "a1b23993d3bbc490d06539edff04881a0d95a53a52f9f0b672f50cac658a59d7"],
    identities: [
      ["The conditional is a past-tense verb plus the particle бы", "Я ___ прочитал эту книгу.", "would-read-this-book"],
      ["Чтобы introduces the purpose an action serves", "Я учу русский, ___ читать Достоевского.", "study-russian-to-read"],
    ],
  },
  "indirect-speech": {
    quizzes: [4, "492be5a5577f964538ec3e180cb55f9faca2357bb4cc0163548c7572355308d7"],
    identities: [
      ["A reported statement is introduced by что", "Он сказал, ___ он живёт в Москве.", "said-he-lives-in-moscow"],
      ["A reported command uses чтобы with a past-tense verb", "Мама сказала, ___ я убрал комнату.", "mom-said-clean-room"],
      ["A reported yes-no question uses the particle ли", "Он спросил, говорю ___ я по-русски.", "asked-if-i-speak-russian"],
    ],
  },
};
