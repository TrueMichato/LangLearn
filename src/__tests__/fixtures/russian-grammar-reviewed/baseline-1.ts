import type { LessonBaseline } from './types';

// Source: git show ab35670cc1b6a4bdf9425a22d457b14f326562b7:public/content/grammar/ru/{lesson}.md (main before this rollout).
// The first two fields are literal shipped identities, not reconstructed from today's content.
// Only the third (the approved successor; null = retired, no review transfer) is an authoring decision.
export const baseline: Record<string, LessonBaseline> = {
  "instrumental": {
    quizzes: [5, "25afc05c867e9931568727059958dd5134995076e5a1ecbf66a040da82d55102"],
    identities: [
      ["Быть and стать put the resulting role in the instrumental", "Он хочет ___ врачом.", null],
      ["С is extended to со before an awkward consonant cluster", "Пойдём ___ мной!", "so-mnoy"],
      ["Accompaniment is с plus the instrumental", "Я иду в кино ___ другом.", "with-friend"],
    ],
  },
  "prepositional": {
    quizzes: [5, "4346457e02e4f08cfb7fe5c1fadc42ff0f38c1c590945be5ab1efa23f6333c25"],
    identities: [
      ["Being inside somewhere uses в plus the prepositional", "Я живу ___ Москве.", "live-in-moscow"],
      ["Certain workplaces and open spaces take на rather than в", "Он работает ___ заводе.", "works-at-factory"],
      ["О plus the prepositional means about something", "Мы говорим ___ музыке.", "talk-about-music"],
    ],
  },
  "conjugation": {
    quizzes: [5, "650d462b24b2b0662d8bbc08f0a1bd0daa38b06a10c201b409bce3a8ed00f605"],
    identities: [
      ["First-conjugation verbs take -ешь in the ты-form", "Ты ___ газету?", "you-read-newspaper"],
      ["Second-conjugation verbs take -ит in the он-form", "Он ___ по-русски.", "he-speaks-russian"],
      ["Many first-conjugation verbs change their stem consonant in the я-form", "Я ___ письмо.", null],
    ],
  },
  "past-future": {
    quizzes: [5, "c500fd784c1bbb03a57c852600ac93b30caa75748eb52ace748227768c0e8294"],
    identities: [
      ["The past tense agrees with the subject in gender and number", "Она ___ в магазине.", "she-was-at-store"],
      ["The compound future is буду plus an imperfective infinitive", "Я ___ читать весь вечер.", "will-be-reading"],
      ["A perfective verb in present endings carries future meaning", "Он ___ письмо.", "will-write-letter"],
    ],
  },
  "motion": {
    quizzes: [5, "2b8a6db7821a4322a337f5490aa409e797b7b988f89dec4a1da27e81beffd299"],
    identities: [
      ["One trip under way in one direction uses the unidirectional verb", "Сейчас я ___ в школу.", "going-to-school-now"],
      ["Habitual round trips use the multidirectional verb", "Я ___ в школу каждый день.", "go-to-school-daily"],
      ["The prefix по- marks the moment motion begins", "Он ___ на работу в восемь.", null],
    ],
  },
  "reflexive": {
    quizzes: [5, "573fb670b28a5bbb2c532b39f64fd04b46bdfa9589d7c9ee018757cc20dda4de"],
    identities: [
      ["The он-form of a reflexive verb is written -тся", "Он одевае___ быстро.", "dresses-quickly"],
      ["The reflexive ending is -сь after a vowel and -ся after a consonant", "Я умываю___ каждое утро.", "washes-face"],
      ["After a consonant the reflexive ending stays -ся", "Ты моешь___ слишком долго!", "wash-too-long"],
    ],
  },
  "adjective-declension": {
    quizzes: [5, "32cc1a7eb4820cec04b0a2683ba3c9ad303c0630990d83d94f04201ebe94b8c4"],
    identities: [
      ["An adjective copies the case, gender and number of the noun it modifies", "Она живёт в ___ квартире.", "lives-new-apartment"],
      ["Soft-stem adjectives use и/е where hard stems use ы/о", "У неё ___ глаза.", "has-blue-eyes"],
    ],
  },
  "pronouns": {
    quizzes: [5, "a95a43d2fde1b9da5c641df9a9510fcff7beebe6a21c457578765999e8c2a753"],
    identities: [
      ["Его, её and их never change their form", "Я знаю ___ сестру.", "knows-his-sister"],
      ["Свой is used when the owner is the subject of the same clause", "Мы продали ___ дом.", "sold-own-house"],
      ["Этот points at what is near, тот at what is further away", "___ дом очень старый.", "this-house-old"],
    ],
  },
  "numbers": {
    quizzes: [5, "8215c5300d2e1091d0033067ad7e0e307d192101d6f8a1a10936df5db598599f"],
    identities: [
      ["Numbers from five upward are followed by the genitive plural", "В городе ___ школ.", null],
      ["Ordinals behave like adjectives and agree with their noun", "Это мой ___ урок русского языка.", "first-lesson"],
      ["Russian counts minutes into the hour that is still coming", "Сейчас десять минут ___.", "ten-past-two"],
    ],
  },
};
