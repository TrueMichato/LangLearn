export interface StudyTip {
  id: string;
  text: string;
  category: 'review' | 'vocabulary' | 'reading' | 'general' | 'motivation' | 'technique';
  condition?: { context: string };
}

export const studyTips: StudyTip[] = [
  // Review tips
  {
    id: 'forgetting-natural',
    text: 'It takes ~10 encounters with a word before it sticks. Keep going! 💪',
    category: 'review',
    condition: { context: 'review' },
  },
  {
    id: 'active-recall',
    text: 'Try to remember a word before flipping the card — the effort strengthens memory.',
    category: 'review',
    condition: { context: 'review' },
  },
  {
    id: '90-retention',
    text: 'Aim for ~90% correct on reviews. Too high? Add more new cards. Too low? Slow down.',
    category: 'review',
    condition: { context: 'review' },
  },
  {
    id: 'repetition-learning',
    text: 'Re-reading the same text reveals new understanding each time.',
    category: 'review',
    condition: { context: 'review' },
  },
  {
    id: 'spaced-repetition-power',
    text: 'Spaced repetition is the most efficient way to move knowledge into long-term memory.',
    category: 'review',
    condition: { context: 'review' },
  },

  // Vocabulary tips
  {
    id: 'phrases-over-words',
    text: 'Learning words in context (phrases/sentences) is more effective than isolated words.',
    category: 'vocabulary',
    condition: { context: 'adding-word' },
  },
  {
    id: 'frequency-matters',
    text: 'The top 2,000 words cover ~90% of everyday language. Focus on high-frequency words first.',
    category: 'vocabulary',
    condition: { context: 'adding-word' },
  },
  {
    id: 'context-helps-memory',
    text: 'Words learned in context stick 3× better than isolated words.',
    category: 'vocabulary',
    condition: { context: 'adding-word' },
  },
  {
    id: 'vocab-over-grammar',
    text: 'Not knowing a word blocks understanding more than not knowing grammar.',
    category: 'vocabulary',
    condition: { context: 'dashboard' },
  },
  {
    id: 'example-sentences',
    text: 'Adding an example sentence to new words makes them much easier to remember.',
    category: 'vocabulary',
    condition: { context: 'adding-word' },
  },
  {
    id: 'personal-connection',
    text: 'Words connected to personal experiences or emotions are remembered more easily.',
    category: 'vocabulary',
  },

  // Reading tips
  {
    id: 'input-is-king',
    text: 'Reading and listening build the strongest foundation for language skills.',
    category: 'reading',
    condition: { context: 'dashboard' },
  },
  {
    id: 'comprehensible-input',
    text: 'The best reading material is content you understand ~90% of.',
    category: 'reading',
    condition: { context: 'reading' },
  },
  {
    id: 'sentence-structure',
    text: 'Learning common sentence patterns helps you sound more natural.',
    category: 'reading',
    condition: { context: 'reading' },
  },
  {
    id: 'dont-look-up-everything',
    text: "Don't look up every unknown word — try to guess from context first.",
    category: 'reading',
    condition: { context: 'reading' },
  },
  {
    id: 'read-for-fun',
    text: 'Reading material you genuinely enjoy leads to faster acquisition than textbooks.',
    category: 'reading',
  },

  // General tips
  {
    id: 'consistency-over-intensity',
    text: '5 minutes every day beats 2 hours once a week.',
    category: 'general',
    condition: { context: 'dashboard' },
  },
  {
    id: 'balance-activities',
    text: 'Mix reading, flashcards, grammar, and listening for the best results.',
    category: 'general',
    condition: { context: 'dashboard' },
  },
  {
    id: 'immersion',
    text: 'Change your phone language, listen to podcasts, watch shows in your target language.',
    category: 'general',
    condition: { context: 'dashboard' },
  },
  {
    id: 'intermediate-plateau',
    text: 'Progress feels slower at intermediate level — this is normal and expected.',
    category: 'general',
    condition: { context: 'dashboard' },
  },
  {
    id: 'push-yourself',
    text: "When content feels easy, it's time to move to something harder.",
    category: 'general',
  },

  // Motivation tips
  {
    id: 'growth-mindset',
    text: 'Mistakes are a natural part of learning — even native speakers make them.',
    category: 'motivation',
    condition: { context: 'review' },
  },
  {
    id: 'celebrate-small-wins',
    text: 'Every word you learn is progress. Celebrate the small victories! 🎉',
    category: 'motivation',
    condition: { context: 'dashboard' },
  },
  {
    id: 'compare-to-past-self',
    text: "Don't compare yourself to others — compare yourself to where you were last month.",
    category: 'motivation',
    condition: { context: 'dashboard' },
  },
  {
    id: 'enjoy-the-journey',
    text: 'Language learning is a marathon, not a sprint. Enjoy the process! 🏃',
    category: 'motivation',
  },
  {
    id: 'every-minute-counts',
    text: 'Even a 2-minute review session keeps your memory fresh. Every minute counts.',
    category: 'motivation',
    condition: { context: 'dashboard' },
  },

  // Technique tips
  {
    id: 'shadowing',
    text: 'Try shadowing: repeat audio immediately after hearing it to improve pronunciation.',
    category: 'technique',
  },
  {
    id: 'mnemonics',
    text: 'Create vivid mental images or stories to remember tricky words — the sillier, the better!',
    category: 'technique',
    condition: { context: 'adding-word' },
  },
  {
    id: 'write-it-out',
    text: 'Writing words by hand activates different memory pathways than typing.',
    category: 'technique',
  },
  {
    id: 'teach-someone',
    text: 'Try explaining a grammar point to someone — teaching is the best way to learn.',
    category: 'technique',
  },
  {
    id: 'chunk-study-sessions',
    text: 'Short, focused study sessions (15–25 min) are more effective than long, unfocused ones.',
    category: 'technique',
    condition: { context: 'dashboard' },
  },
];

export function getRandomTip(category?: string): StudyTip {
  const filtered = category
    ? studyTips.filter((tip) => tip.category === category)
    : studyTips;
  const pool = filtered.length > 0 ? filtered : studyTips;
  return pool[Math.floor(Math.random() * pool.length)];
}

export function getTipForContext(context: string): StudyTip {
  const contextual = studyTips.filter((tip) => tip.condition?.context === context);
  if (contextual.length > 0) {
    return contextual[Math.floor(Math.random() * contextual.length)];
  }
  return getRandomTip();
}
