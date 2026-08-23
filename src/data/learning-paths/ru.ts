import { defineLearningPath, grammar, vocab } from './shared';

export const RU_LEARNING_PATH = defineLearningPath({
  language: 'ru',
  letterPrerequisites: ['Cyrillic (Uppercase)', 'Cyrillic (Lowercase)'],
  letterUnitLessons: [grammar('alphabet-sounds')],
  units: [
    {
      id: 'first-steps',
      title: 'First steps',
      description: 'Greet people and tune your ear to Russian sounds.',
      lessons: [
        vocab('greetings'),
        grammar('pronunciation-rules'),
        vocab('numbers'),
      ],
    },
    {
      id: 'sound-rhythm',
      title: 'Sound and rhythm',
      description: 'Use stress and spelling patterns with everyday words.',
      lessons: [vocab('days-months'), grammar('stress'), vocab('colors')],
    },
    {
      id: 'people-things',
      title: 'People and things',
      description: 'Name family, animals, and the roles words take.',
      lessons: [vocab('family'), grammar('spelling-rules'), vocab('animals')],
    },
    {
      id: 'food-cases',
      title: 'Food and cases',
      description: 'Talk about food while meeting the case system.',
      lessons: [vocab('food'), grammar('cases'), vocab('body')],
    },
    {
      id: 'actions',
      title: 'Everyday actions',
      description: 'Use common verbs and notice completed versus ongoing actions.',
      lessons: [vocab('verbs'), grammar('verb-aspects'), vocab('house')],
    },
    {
      id: 'describing',
      title: 'Describing people',
      description: 'Match descriptive words to the people and things around you.',
      lessons: [vocab('adjectives'), grammar('gender'), vocab('school-work')],
    },
    {
      id: 'getting-around',
      title: 'Getting around',
      description: 'Move through places and use direct objects confidently.',
      lessons: [vocab('transport'), grammar('nominative-accusative'), vocab('weather')],
    },
    {
      id: 'daily-life',
      title: 'Daily life',
      description: 'Handle shopping, routines, and practical possession.',
      lessons: [vocab('shopping'), grammar('genitive'), vocab('time-routine')],
    },
  ],
});
