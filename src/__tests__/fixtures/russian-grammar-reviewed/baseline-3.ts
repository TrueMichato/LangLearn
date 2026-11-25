import type { LessonBaseline } from './types';

// Source: git show ab35670cc1b6a4bdf9425a22d457b14f326562b7:public/content/grammar/ru/{lesson}.md (main before this rollout).
// The first two fields are literal shipped identities, not reconstructed from today's content.
// Only the third (the approved successor; null = retired, no review transfer) is an authoring decision.
export const baseline: Record<string, LessonBaseline> = {
  "word-order": {
    quizzes: [4, "902f32126211762037ee41e66f3c22a3472d5bd6506e1bc2c2f6393052e4b358"],
    identities: [
      ["Не stands immediately before the word it denies", "Я ___ читал эту книгу.", null],
      ["Есть is kept when the existence of the thing is the new information", "В городе ___ хороший музей.", null],
    ],
  },
  "short-adjectives": {
    quizzes: [4, "c6ff4663b2d3e20f8d7a3b6ce35e81bc6d8995b39dbcd0ddbb72928b40939d15"],
    identities: [
      ["Short-form adjectives agree with the subject in gender and number", "Она ___.", null],
      ["Only the short form works as a predicate before an infinitive", "Мы ___ идти.", null],
      ["An impersonal construction pairs a dative experiencer with a neuter short form", "Мне ___ это слышать.", null],
    ],
  },
  "verbs-of-motion-prefixed": {
    quizzes: [4, "f4edb0db3d3d4a14af300c5e8fdc11a36a28151fce017b088beda6ed512f8559"],
    identities: [
      ["По- marks setting off — the start of a journey", "Он ___ на работу.", null],
      ["При- marks arrival at the destination", "Она ___ домой поздно.", null],
      ["У- marks leaving somewhere and no longer being there", "Они ___ из города.", null],
    ],
  },
  "negation": {
    quizzes: [4, "25275b10ddea1efd9ea24a60d4dfd3b6d18ac9b945a30da0a6b33f314a52d0f5"],
    identities: [
      ["Moving не changes which part of the sentence is denied", "___ я это сделал.", null],
      ["Не negates whatever word directly follows it", "Она ___ работает сегодня.", null],
      ["Нет is the standalone no; не can never stand alone", "— Ты хочешь кофе? — ___, спасибо.", null],
    ],
  },
  "relative-pronouns": {
    quizzes: [4, "2d8eabfe962a2dbb9587871f7c310e764901f911795ad34090e055ec3a54fff5"],
    identities: [
      ["Кто…тот links a clause about a person to the main clause", "___ не работает, тот не ест.", null],
      ["Где is location, куда is direction towards, откуда is origin", "Магазин, ___ мы ходим, закрылся.", null],
      ["Чей means whose and agrees with the thing owned, not the owner", "Человек, ___ дом стоит на углу, — мой сосед.", null],
    ],
  },
  "time-clauses": {
    quizzes: [4, "fce0d57106f3880a5a4df66422a1e5d93e69a3e5c05a27a532f3f66e2f74f112"],
    identities: [
      ["Когда simply fixes the time at which something happens", "___ я читал, она смотрела телевизор.", null],
      ["Пока не plus a perfective verb means until", "Подожди, пока я ___ приду.", null],
      ["Пока stresses that two actions run side by side", "___ я готовил ужин, дети делали уроки.", null],
    ],
  },
  "subjunctive": {
    quizzes: [3, "f3acd4da80ab3114b1c65374044e0128d71baae119c52f151d4d67c4fde9c610"],
    identities: [
      ["When the two clauses have different subjects, use чтобы plus a past-tense verb", "Я хочу, ___ ты пришёл.", null],
      ["Чуть было не describes something that very nearly happened", "Я чуть ___ не опоздал!", null],
    ],
  },
  "passive-constructions": {
    quizzes: [4, "77ce9b3bf6e2463a0975bd354372b9c9ab7f42d2ac9178e1ad651fd188373bf8"],
    identities: [
      ["The written passive uses a short-form participle agreeing with the subject", "Книга ___ Толстым.", null],
      ["An ongoing passive is expressed with a -ся verb", "Дом ___ уже год.", null],
      ["An impersonal state puts the person experiencing it in the dative", "___ холодно.", null],
    ],
  },
  "aspect-pairs": {
    quizzes: [4, "26cc921a44b19da95de3f74a076d36f81533122aa96503e5accef39c001e7353"],
    identities: [
      ["A single finished action takes the perfective member of the pair", "Он ___ окно и вышел.", null],
      ["The suffix -ыва-/-ива- builds an imperfective partner from a perfective verb", "Она часто ___ интересные истории.", null],
      ["A stated stretch of time forces the imperfective", "Я ___ книгу весь вечер.", null],
    ],
  },
};
