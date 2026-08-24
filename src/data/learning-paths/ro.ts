import { defineLearningPath, grammar, vocab } from './shared';

export const RO_LEARNING_PATH = defineLearningPath({
  language: 'ro',
  letterPrerequisites: [],
  units: [
    {
      id: 'first-steps',
      title: 'First conversations',
      description: 'Greet people and get comfortable with Romanian sounds.',
      lessons: [vocab('greetings'), grammar('pronunciation'), vocab('numbers')],
    },
    {
      id: 'people-things',
      title: 'People and things',
      description: 'Meet noun gender through familiar people and objects.',
      lessons: [vocab('family'), grammar('nouns-gender'), vocab('colors')],
    },
    {
      id: 'naming-things',
      title: 'Naming things',
      description: 'Use Romanian articles with food, animals, and daily objects.',
      lessons: [vocab('food'), grammar('definite-article'), vocab('animals')],
    },
    {
      id: 'new-things',
      title: 'New people and things',
      description: 'Introduce someone or something for the first time.',
      lessons: [
        vocab('body'),
        grammar('indefinite-article'),
        vocab('house'),
      ],
    },
    {
      id: 'nouns-and-verbs',
      title: 'Nouns and core verbs',
      description:
        'Practice plural nouns and essential verbs in either order. Both paths support fuller everyday sentences.',
      strands: [
        {
          id: 'one-and-many',
          title: 'One and many',
          description: 'Build plural nouns around school, work, and transport.',
          lessons: [
            vocab('school-work'),
            grammar('plurals'),
            vocab('transport'),
          ],
        },
        {
          id: 'being-having',
          title: 'Being and having',
          description: 'Use a fi and a avea in practical daily situations.',
          lessons: [
            vocab('weather'),
            grammar('present-a-fi-avea'),
            vocab('shopping'),
          ],
        },
      ],
    },
    {
      id: 'everyday-expression',
      title: 'Everyday expression',
      description:
        'Build routine language or social expression first. Both paths expand your present-tense range.',
      strands: [
        {
          id: 'everyday-actions',
          title: 'Everyday actions',
          description: 'Use common Group 1 verbs for routines and feelings.',
          lessons: [
            vocab('verbs'),
            grammar('present-group1'),
            vocab('time-routine'),
          ],
        },
        {
          id: 'social-world',
          title: 'Your social world',
          description: 'Expand your verbs through emotions and hobbies.',
          lessons: [
            vocab('emotions'),
            grammar('present-group4'),
            vocab('hobbies'),
          ],
        },
      ],
    },
  ],
});
