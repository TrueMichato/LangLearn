export interface ImmersionTip {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'media' | 'daily-life' | 'social' | 'technology' | 'creative';
  languages?: string[];
}

export const immersionTips: ImmersionTip[] = [
  // Media
  {
    id: 'tv-subtitles',
    title: 'Watch with target language subtitles',
    description: 'Watch TV shows or movies with subtitles in your target language to train reading speed and listening comprehension simultaneously.',
    icon: '📺',
    category: 'media',
  },
  {
    id: 'podcasts',
    title: 'Listen to podcasts during commutes',
    description: 'Fill idle time with podcasts in your target language — even passive listening builds familiarity with natural speech patterns.',
    icon: '🎧',
    category: 'media',
  },
  {
    id: 'social-media',
    title: 'Follow target language accounts',
    description: 'Follow social media accounts that post in your target language for bite-sized daily exposure to authentic content.',
    icon: '📱',
    category: 'media',
  },
  {
    id: 'music-lyrics',
    title: 'Listen to music and look up lyrics',
    description: 'Find songs you enjoy in your target language, look up the lyrics, and sing along to practice pronunciation and vocabulary.',
    icon: '🎵',
    category: 'media',
  },
  {
    id: 'youtube-channels',
    title: 'Watch YouTube in your target language',
    description: 'Subscribe to YouTube channels in your target language — tutorials, vlogs, and entertainment are great for natural immersion.',
    icon: '▶️',
    category: 'media',
  },
  {
    id: 'nhk-anime',
    title: 'Watch NHK World and anime with JP subs',
    description: 'NHK World offers free news in simplified Japanese. Try watching anime with Japanese subtitles to connect spoken and written forms.',
    icon: '🇯🇵',
    category: 'media',
    languages: ['ja'],
  },
  {
    id: 'manga-reading',
    title: 'Read manga in Japanese',
    description: 'Manga provides visual context that helps you guess unknown words. Start with furigana editions aimed at younger readers.',
    icon: '📖',
    category: 'media',
    languages: ['ja'],
  },
  {
    id: 'russian-podcasts-news',
    title: 'Listen to Russian podcasts and news',
    description: 'Try "Медуза" or "Радио Арзамас" for podcasts. Read news on lenta.ru — start with headlines and short articles.',
    icon: '🇷🇺',
    category: 'media',
    languages: ['ru'],
  },

  // Daily Life
  {
    id: 'phone-language',
    title: 'Change your phone language',
    description: 'Switch your phone or computer language to your target language. You already know where things are, so you\'ll learn vocabulary through context.',
    icon: '📲',
    category: 'daily-life',
  },
  {
    id: 'sticky-notes',
    title: 'Label objects with sticky notes',
    description: 'Put sticky notes on household objects with their names in your target language. You\'ll absorb vocabulary passively every day.',
    icon: '🏷️',
    category: 'daily-life',
  },
  {
    id: 'think-target-lang',
    title: 'Think in your target language',
    description: 'During routine activities like cooking or walking, try narrating your thoughts in your target language — even simple sentences count.',
    icon: '💭',
    category: 'daily-life',
  },
  {
    id: 'cook-recipes',
    title: 'Cook from target language recipes',
    description: 'Find recipes written in your target language. You\'ll learn food vocabulary and practice reading instructions in a hands-on context.',
    icon: '🍳',
    category: 'daily-life',
  },
  {
    id: 'journal',
    title: 'Keep a journal in your target language',
    description: 'Write a few sentences each day about what you did or how you feel. Don\'t worry about perfection — consistency matters more.',
    icon: '📓',
    category: 'daily-life',
  },

  // Social
  {
    id: 'language-exchange',
    title: 'Find a language exchange partner',
    description: 'Use platforms like iTalki or HelloTalk to find native speakers who want to learn your language in exchange for practicing theirs.',
    icon: '🤝',
    category: 'social',
  },
  {
    id: 'online-communities',
    title: 'Join online communities',
    description: 'Participate in forums, Discord servers, or Reddit communities that use your target language — reading and posting builds real skills.',
    icon: '💬',
    category: 'social',
  },
  {
    id: 'meetups',
    title: 'Attend language meetups',
    description: 'Look for local language meetups or cultural events in your area. Speaking with others is the fastest way to build confidence.',
    icon: '🎉',
    category: 'social',
  },

  // Technology
  {
    id: 'browser-search',
    title: 'Search in your target language',
    description: 'Set your browser\'s default search to a target-language search engine, or simply type queries in your target language.',
    icon: '🔍',
    category: 'technology',
  },
  {
    id: 'target-lang-apps',
    title: 'Use target language apps',
    description: 'Install weather, news, or productivity apps that operate in your target language for regular low-effort exposure.',
    icon: '⛅',
    category: 'technology',
  },
  {
    id: 'video-games',
    title: 'Play games in your target language',
    description: 'Switch your favorite video games to your target language. RPGs and visual novels are especially great for reading practice.',
    icon: '🎮',
    category: 'technology',
  },

  // Creative
  {
    id: 'short-stories',
    title: 'Write short stories or diary entries',
    description: 'Creative writing pushes you to use new grammar and vocabulary. Start small — even a few sentences about your day counts.',
    icon: '✍️',
    category: 'creative',
  },
  {
    id: 'translate-quotes',
    title: 'Translate your favorite quotes',
    description: 'Pick quotes you love and try translating them. It\'s a fun puzzle that deepens your understanding of both languages.',
    icon: '💡',
    category: 'creative',
  },
  {
    id: 'nhk-easy-news',
    title: 'Read NHK Easy News daily',
    description: 'NHK Easy News provides graded Japanese news articles with furigana and simple vocabulary — perfect for building reading stamina.',
    icon: '📰',
    category: 'media',
    languages: ['ja'],
  },
  {
    id: 'phone-japanese',
    title: 'Switch your devices to Japanese',
    description: 'Change your phone and computer language settings to Japanese. Everyday interactions become mini immersion sessions.',
    icon: '📱',
    category: 'technology',
    languages: ['ja'],
  },
  {
    id: 'manga-with-dictionary',
    title: 'Read manga with a dictionary app',
    description: 'Read manga with a dictionary app nearby for natural casual Japanese. You\'ll absorb slang, sentence-enders, and colloquial grammar.',
    icon: '📚',
    category: 'media',
    languages: ['ja'],
  },
  {
    id: 'shadowing',
    title: 'Shadow native speakers',
    description: 'Repeat what native speakers say immediately after hearing it. Shadowing trains your pronunciation, rhythm, and intonation all at once.',
    icon: '🗣️',
    category: 'media',
  },
  {
    id: 'lyrics-study',
    title: 'Study song lyrics and sing along',
    description: 'Look up lyrics to songs in your target language and sing along. Music makes vocabulary and phrases stick through melody and repetition.',
    icon: '🎤',
    category: 'creative',
  },
  {
    id: 'recipe-cooking',
    title: 'Follow recipes in your target language',
    description: 'Cook from recipes written in your target language. The hands-on context makes food and cooking vocabulary unforgettable.',
    icon: '👨‍🍳',
    category: 'daily-life',
  },
  {
    id: 'ajatt-environment',
    title: 'Create an all-target-language environment',
    description: 'Surround yourself with your target language at home — labels, sticky notes, reminders, and background audio all in your target language.',
    icon: '🏠',
    category: 'daily-life',
  },
  {
    id: 'graded-readers',
    title: 'Start with graded readers',
    description: 'Graded readers (tadoku) are written for learners at specific levels. They build reading confidence without overwhelming you with unknown words.',
    icon: '📕',
    category: 'media',
  },
];
