import { useState } from 'react';

interface Resource {
  name: string;
  url: string;
  description: string;
}

interface ResourceCategory {
  label: string;
  emoji: string;
  resources: Resource[];
}

const jaResources: ResourceCategory[] = [
  {
    label: 'Grammar & Learning',
    emoji: '📖',
    resources: [
      {
        name: "Tae Kim's Grammar Guide",
        url: 'https://guidetojapanese.org/learn/grammar',
        description: 'Systematic grammar from a Japanese perspective. Free, CC-licensed.',
      },
      {
        name: 'JGram',
        url: 'http://www.jgram.org/',
        description: 'JLPT-leveled grammar points with examples and quizzes.',
      },
      {
        name: 'Many Things Japanese',
        url: 'http://www.manythings.org/japanese/',
        description: 'Free study materials, listen-and-repeat, and quizzes.',
      },
    ],
  },
  {
    label: 'Dictionaries & Tools',
    emoji: '🔍',
    resources: [
      {
        name: 'Jisho.org',
        url: 'https://jisho.org/',
        description: 'Comprehensive Japanese-English dictionary with kanji lookup.',
      },
      {
        name: 'Ichi.moe',
        url: 'https://ichi.moe/',
        description: 'Paste text to get word-by-word breakdown with translations.',
      },
      {
        name: 'WWWJDIC',
        url: 'http://www.edrdg.org/cgi-bin/wwwjdic/wwwjdic',
        description: "Jim Breen's classic Japanese dictionary.",
      },
    ],
  },
  {
    label: 'Kanji & Characters',
    emoji: '🔤',
    resources: [
      {
        name: 'WaniKani',
        url: 'https://www.wanikani.com/',
        description: 'SRS-based kanji and vocabulary learning (free trial available).',
      },
      {
        name: 'Reviewing the Kanji',
        url: 'https://kanji.koohii.com/',
        description: "Community for studying kanji with Heisig's method.",
      },
      {
        name: 'Realkana',
        url: 'https://realkana.com/',
        description: 'Clean hiragana and katakana practice tool.',
      },
    ],
  },
  {
    label: 'Community & Immersion',
    emoji: '🌐',
    resources: [
      {
        name: 'r/LearnJapanese',
        url: 'https://www.reddit.com/r/LearnJapanese',
        description: 'Active community for Japanese learners of all levels.',
      },
      {
        name: 'AJATT',
        url: 'http://www.alljapaneseallthetime.com/blog/',
        description: 'Immersion-first philosophy for learning Japanese.',
      },
    ],
  },
];

export default function ExternalResources() {
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="w-full min-h-[44px] flex items-center justify-between text-left"
      >
        <span className="text-lg font-semibold text-slate-700 dark:text-slate-200">
          📚 Recommended Resources
        </span>
        <span
          className={`text-gray-400 dark:text-gray-500 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        >
          ▼
        </span>
      </button>

      {open && (
        <div className="mt-3 space-y-5">
          {jaResources.map((category) => (
            <div key={category.label}>
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                {category.emoji} {category.label}
              </h3>
              <div className="space-y-2">
                {category.resources.map((resource) => (
                  <a
                    key={resource.url}
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block bg-white dark:bg-gray-800 rounded-xl shadow p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="text-indigo-600 dark:text-indigo-400 font-medium text-sm">
                        {resource.name}
                      </span>
                      <span className="text-gray-400 dark:text-gray-500 text-xs">↗</span>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {resource.description}
                    </p>
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
