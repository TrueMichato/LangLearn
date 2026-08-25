import { defineLearningPath, grammar, vocab } from './shared';

export const ES_LEARNING_PATH = defineLearningPath({
  language: 'es',
  letterPrerequisites: [],
  units: [
    {
      id: 'first-steps',
      title: 'First conversations',
      description: 'Greet people and pronounce the words you meet.',
      lessons: [vocab('greetings'), grammar('pronunciation'), vocab('numbers')],
    },
    {
      id: 'people-things',
      title: 'People and things',
      description: 'Use articles and describe familiar people and objects.',
      lessons: [vocab('family'), grammar('articles'), vocab('colors')],
    },
    {
      id: 'describing-acting',
      title: 'Describe and act',
      description:
        'Practice agreement or everyday -ar actions first. Both paths prepare you for fuller sentences.',
      strands: [
        {
          id: 'agreement',
          title: 'Making words agree',
          description:
            'Match nouns and descriptions while talking about daily life.',
          lessons: [vocab('food'), grammar('gender-number'), vocab('animals')],
        },
        {
          id: 'first-actions',
          title: 'First actions',
          description: 'Use regular -ar verbs for everyday activities.',
          lessons: [vocab('verbs'), grammar('present-ar'), vocab('body')],
        },
      ],
    },
    {
      id: 'expanding-actions',
      title: 'Expand your everyday verbs',
      description:
        'Add more action verbs and the two ways to say “to be” in either order. Both paths support practical conversation.',
      strands: [
        {
          id: 'more-actions',
          title: 'More actions',
          description: 'Add -er and -ir verbs around home, school, and work.',
          lessons: [
            vocab('house'),
            grammar('present-er-ir'),
            vocab('school-work'),
          ],
        },
        {
          id: 'being-there',
          title: 'Being and being there',
          description: 'Choose ser or estar while describing places and conditions.',
          lessons: [
            vocab('transport'),
            grammar('ser-estar'),
            vocab('weather'),
          ],
        },
      ],
    },
    {
      id: 'everyday-connections',
      title: 'Everyday connections',
      description:
        'Build practical routines or social language first. Both paths expand independent conversation.',
      strands: [
        {
          id: 'practical-life',
          title: 'Practical life',
          description: 'Use essential irregular verbs for shopping and routines.',
          lessons: [
            vocab('shopping'),
            grammar('irregular-verbs'),
            vocab('time-routine'),
          ],
        },
        {
          id: 'social-world',
          title: 'Your social world',
          description: 'Connect people, places, feelings, and hobbies.',
          lessons: [
            vocab('emotions'),
            grammar('prepositions'),
            vocab('hobbies'),
          ],
        },
      ],
    },
  ],
});
