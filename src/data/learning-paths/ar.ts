import { defineLearningPath, grammar, vocab } from './shared';

export const AR_LEARNING_PATH = defineLearningPath({
  language: 'ar',
  letterPrerequisites: [
    'Alphabet (28 Letters)',
    'Vowels & Marks (Ḥarakāt)',
    'Hamza & Special Forms',
  ],
  units: [
    {
      id: 'first-steps',
      title: 'First conversations',
      description: 'Greet people and understand how written Arabic joins.',
      lessons: [vocab('greetings'), grammar('arabic-script'), vocab('people-pronouns')],
    },
    {
      id: 'sounds-and-time',
      title: 'Sounds, numbers, and time',
      description:
        'Strengthen listening and reading in either order. Both paths make the next conversations easier to follow.',
      strands: [
        {
          id: 'hear-and-count',
          title: 'Hear and count',
          description: 'Tune your ear and use the first numbers confidently.',
          lessons: [
            vocab('numbers-1-20'),
            grammar('pronunciation'),
            vocab('numbers-large'),
          ],
        },
        {
          id: 'read-and-tell-time',
          title: 'Read and tell time',
          description: 'Read short vowels while talking about days and time.',
          lessons: [
            vocab('days-months'),
            grammar('harakat'),
            vocab('time'),
          ],
        },
      ],
    },
    {
      id: 'people-things',
      title: 'People and things',
      description: 'Use the definite article with colors and family.',
      lessons: [vocab('colors'), grammar('definite-article'), vocab('family')],
    },
    {
      id: 'describing',
      title: 'Describing the world',
      description: 'Notice grammatical gender while describing people and things.',
      lessons: [vocab('body'), grammar('gender'), vocab('food-drink')],
    },
    {
      id: 'simple-sentences',
      title: 'Simple sentences',
      description: 'Build present-tense ideas without a written “to be.”',
      lessons: [vocab('fruits-vegetables'), grammar('nominal-sentence'), vocab('house-furniture')],
    },
    {
      id: 'people-places',
      title: 'People and places',
      description: 'Use pronouns around clothing, animals, and familiar places.',
      lessons: [vocab('clothing'), grammar('pronouns'), vocab('animals')],
    },
    {
      id: 'connections',
      title: 'Making connections',
      description: 'Attach possession and object endings in everyday contexts.',
      lessons: [vocab('weather-nature'), grammar('attached-pronouns'), vocab('school')],
    },
  ],
});
