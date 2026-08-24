import { defineLearningPath, grammar, vocab } from './shared';

export const JA_LEARNING_PATH = defineLearningPath({
  language: 'ja',
  letterPrerequisites: ['Hiragana', 'Katakana'],
  units: [
    {
      id: 'first-steps',
      title: 'First steps',
      description: 'Greet people, count, and build a basic sentence.',
      lessons: [vocab('greetings'), grammar('particles'), vocab('numbers')],
    },
    {
      id: 'everyday-foundations',
      title: 'Everyday foundations',
      description:
        'Build useful time language and descriptive language in either order. Both paths prepare you for daily conversations.',
      strands: [
        {
          id: 'time-actions',
          title: 'Time and actions',
          description: 'Talk about days, months, colors, and simple actions.',
          lessons: [
            vocab('days-months'),
            grammar('verb-forms'),
            vocab('colors'),
          ],
        },
        {
          id: 'people-things',
          title: 'People and things',
          description: 'Describe family, animals, and the world around you.',
          lessons: [
            vocab('family'),
            grammar('adjectives'),
            vocab('animals'),
          ],
        },
      ],
    },
    {
      id: 'food-counting',
      title: 'Food and counting',
      description: 'Order familiar food and count different kinds of things.',
      lessons: [vocab('food'), grammar('counters'), vocab('body')],
    },
    {
      id: 'actions-places',
      title: 'Actions and places',
      description: 'Use common verbs around home, school, and work.',
      lessons: [vocab('verbs'), grammar('giving-receiving'), vocab('house')],
    },
    {
      id: 'getting-around',
      title: 'Getting around',
      description: 'Travel, ask directions, and say what you can do.',
      lessons: [vocab('transport'), grammar('potential'), vocab('school-work')],
    },
    {
      id: 'daily-life',
      title: 'Daily life',
      description: 'Connect routines, weather, and possible outcomes.',
      lessons: [vocab('weather'), grammar('conditional'), vocab('time-routine')],
    },
    {
      id: 'social-world',
      title: 'Your social world',
      description: 'Share feelings, hobbies, and travel experiences.',
      lessons: [vocab('emotions'), grammar('passive'), vocab('hobbies')],
    },
  ],
});
