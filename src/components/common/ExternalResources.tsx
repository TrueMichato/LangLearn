import { useState, useMemo } from 'react';
import { useSettingsStore } from '../../stores/settingsStore';
import { getLanguageLabel } from '../../lib/languages';

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

const RESOURCES: Record<string, ResourceCategory[]> = {
  ja: [
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
  ],
  pt: [
    {
      label: 'Grammar & Learning',
      emoji: '📖',
      resources: [
        {
          name: 'Brazil-Help Grammar Guide',
          url: 'http://www.brazil-help.com/grammar.htm',
          description: 'Simple, clear grammar guide for Brazilian Portuguese learners.',
        },
        {
          name: 'Learning Portuguese',
          url: 'http://www.learningportuguese.co.uk/portuguese-courses/free-portuguese-courses',
          description: 'Blog with lessons and links to other resources (BRA/POR).',
        },
        {
          name: 'Book2 Portuguese',
          url: 'https://www.goethe-verlag.com/book2/EM/',
          description: 'Phrasebook course with audio for Brazilian and European Portuguese.',
        },
        {
          name: 'PortuguesePod101',
          url: 'https://youtube.com/user/portuguesepod101',
          description: 'Video lessons covering grammar, vocabulary, and culture.',
        },
      ],
    },
    {
      label: 'Dictionaries & Tools',
      emoji: '🔍',
      resources: [
        {
          name: 'PortugueseDictionary.net',
          url: 'http://www.portuguesedictionary.net/',
          description: 'English ↔ Portuguese dictionary with examples and audio.',
        },
        {
          name: 'LanguageCourse.net',
          url: 'https://www.languagecourse.net/vocabulary-trainer.php',
          description: '5,000-word vocabulary trainer with audio and spaced repetition.',
        },
      ],
    },
    {
      label: 'Audio & Podcasts',
      emoji: '🎧',
      resources: [
        {
          name: 'Tá Falado Podcast',
          url: 'https://itunes.apple.com/us/podcast/ta-falado-brazilian-portuguese/id206150220?mt=2',
          description: 'Brazilian Portuguese pronunciation for Spanish speakers — useful for all learners.',
        },
        {
          name: 'Street Smart Brazil',
          url: 'https://www.youtube.com/user/StreetSmartBrazil',
          description: 'YouTube channel with practical Brazilian Portuguese lessons.',
        },
        {
          name: 'Tradutex Portuguese Lessons',
          url: 'https://youtube.com/channel/UCSG1f-H-444ISV3itfaHCtA',
          description: 'Structured Portuguese lessons with clear explanations.',
        },
      ],
    },
    {
      label: 'Reading & Immersion',
      emoji: '📚',
      resources: [
        {
          name: 'Era Uma Vez',
          url: 'http://nonio.eses.pt/contos/',
          description: "Children's stories in Portuguese — read or have them read aloud to you.",
        },
        {
          name: 'BBC News in Portuguese',
          url: 'http://www.bbc.co.uk/portuguese',
          description: 'Current news articles in Portuguese — great for reading practice.',
        },
        {
          name: 'Fluent in 3 Months — Portuguese',
          url: 'http://www.fluentin3months.com/portuguese-after-spanish/',
          description: 'Practical tips for learning Portuguese, especially if you know Spanish.',
        },
      ],
    },
    {
      label: 'Practice & Flashcards',
      emoji: '🃏',
      resources: [
        {
          name: 'Memrise — Basic Brazilian Portuguese',
          url: 'http://www.memrise.com/course/78992/learn-basic-brazilian-portuguese/',
          description: 'Free flashcard-based course for beginner Brazilian Portuguese.',
        },
        {
          name: 'Memrise — 1000 Words of Portuguese',
          url: 'http://www.memrise.com/course/593/1000-words-of-elementary-portuguese-brasil/',
          description: '1,000 essential words of elementary Brazilian Portuguese.',
        },
        {
          name: 'GLOSS',
          url: 'https://gloss.dliflc.edu/',
          description: 'Audio and transcript resources for Brazilian and European Portuguese.',
        },
      ],
    },
    {
      label: 'Radio & TV',
      emoji: '📺',
      resources: [
        {
          name: 'Rádios EBC',
          url: 'http://radios.ebc.com.br/sites/_radios/player_streamer/index.html?emissora=radio-nacional-do-rio-de-janeiro#',
          description: 'Brazilian public radio stations — listen to live Portuguese broadcasts.',
        },
        {
          name: 'TV Brasil',
          url: 'http://www.ebc.com.br/tvbrasil-ao-vivo',
          description: 'Brazilian public TV — live programming for immersion.',
        },
        {
          name: 'RTP Play (Portugal)',
          url: 'http://www.rtp.pt/play/direto/rtp1',
          description: 'Portuguese TV/radio streaming — compare European Portuguese.',
        },
        {
          name: 'Latin American Media',
          url: 'http://lanic.utexas.edu/la/region/television/',
          description: 'Directory of Latin American TV stations and media resources.',
        },
      ],
    },
    {
      label: 'Community',
      emoji: '🌐',
      resources: [
        {
          name: 'r/Portuguese',
          url: 'https://www.reddit.com/r/Portuguese',
          description: 'Active subreddit for Portuguese learners with curated resource wiki.',
        },
        {
          name: 'Duolingo Portuguese',
          url: 'https://www.duolingo.com/course/pt/en/Learn-Portuguese-Online',
          description: 'Free gamified Portuguese course — mainly Brazilian Portuguese.',
        },
      ],
    },
  ],
  ar: [
    {
      label: 'Grammar & Learning',
      emoji: '📖',
      resources: [
        {
          name: 'Madinah Arabic',
          url: 'https://www.madinaharabic.com/',
          description: 'Two free structured courses from the Arabic alphabet through grammar.',
        },
        {
          name: 'Language Transfer — Arabic',
          url: 'https://www.languagetransfer.org/',
          description: 'Free all-audio "Introduction to Arabic" course that builds intuition step by step.',
        },
        {
          name: 'ArabicOnline.eu',
          url: 'http://www.arabiconline.eu/',
          description: 'EU-funded course and resources for Modern Standard Arabic.',
        },
        {
          name: 'Learning Arabic — Al Jazeera',
          url: 'http://learning.aljazeera.net/arabic',
          description: 'Guides, articles and resources for learners from Al Jazeera.',
        },
        {
          name: 'All The Arabic You Never Learned…',
          url: 'http://allthearabicyouneverlearnedthefirsttimearound.com/',
          description: 'A thorough, well-loved free grammar reference for serious learners.',
        },
        {
          name: 'Learn Arabic Online',
          url: 'http://www.learnarabiconline.com/',
          description: 'In-depth lessons on classical/advanced Arabic grammar (naḥw & ṣarf).',
        },
      ],
    },
    {
      label: 'Dictionaries & Tools',
      emoji: '🔍',
      resources: [
        {
          name: 'Qutrub — Verb Conjugator',
          url: 'https://qutrub.arabeyes.org/',
          description: 'Conjugate any Arabic verb across all tenses and persons.',
        },
        {
          name: 'Mo3jam — Dialect Dictionary',
          url: 'https://ar.mo3jam.com/',
          description: 'Crowd-sourced dictionary of colloquial words across Arabic dialects.',
        },
        {
          name: 'Tafqit — Numbers to Words',
          url: 'https://tafqit.com/',
          description: 'Convert any number into fully spelled-out (and correctly inflected) Arabic.',
        },
        {
          name: 'Reverso Context (English–Arabic)',
          url: 'https://context.reverso.net/translation/english-arabic/',
          description: 'See words and phrases translated in real bilingual example sentences.',
        },
        {
          name: 'Forvo — Arabic',
          url: 'https://forvo.com/languages/ar/',
          description: 'Hear any word pronounced by native speakers from different regions.',
        },
      ],
    },
    {
      label: 'Grammar & Vocab References',
      emoji: '🔤',
      resources: [
        {
          name: 'Arabic — Desert Sky',
          url: 'http://arabic.desert-sky.net/',
          description: 'Clear MSA grammar and vocabulary reference (with Egyptian notes).',
        },
        {
          name: 'Lisaan Masry',
          url: 'http://www.lisaanmasry.com/',
          description: 'Egyptian Arabic grammar guide and dictionary for colloquial learners.',
        },
        {
          name: 'Book2 — Arabic (MSA)',
          url: 'https://www.goethe-verlag.com/book2/EM/',
          description: 'Free phrasebook course with audio across 100 everyday topics.',
        },
      ],
    },
    {
      label: 'Dialects (Colloquial)',
      emoji: '🗣️',
      resources: [
        {
          name: 'Lisaan Masry (Egyptian)',
          url: 'http://www.lisaanmasry.com/',
          description: 'Grammar guide and dictionary dedicated to Egyptian Arabic.',
        },
        {
          name: 'abcLeb (Lebanese/Levantine)',
          url: 'http://www.abcleb.com/',
          description: 'Eng↔Lebanese glossaries and a colloquial verb conjugator.',
        },
        {
          name: 'SpeakMoroccan (Maghrebi)',
          url: 'http://www.speakmoroccan.com/',
          description: 'Phrases and vocabulary for Moroccan Darija.',
        },
        {
          name: 'SpeakDziri (Algerian)',
          url: 'https://sites.google.com/site/speakdziri/home',
          description: 'Alphabet guide, grammar, phrases and vocab for Algerian Arabic.',
        },
        {
          name: 'Peace Corps Moroccan Arabic',
          url: 'https://www.livelingua.com/peace-corps/Arabic-Moroccan/',
          description: 'Free textbook + audio primer for Moroccan Darija.',
        },
      ],
    },
    {
      label: 'Community',
      emoji: '🌐',
      resources: [
        {
          name: 'r/learn_arabic',
          url: 'https://www.reddit.com/r/learn_arabic/',
          description: 'Active community and resource wiki for Arabic learners of all levels.',
        },
        {
          name: 'r/arabic',
          url: 'https://www.reddit.com/r/arabic/',
          description: 'General Arabic subreddit — great for questions answered by fluent speakers.',
        },
      ],
    },
  ],
};

export default function ExternalResources() {
  const activeLanguages = useSettingsStore((s) => s.activeLanguages);
  const [open, setOpen] = useState(false);

  const languagesWithResources = useMemo(
    () => activeLanguages.filter((l) => RESOURCES[l]),
    [activeLanguages],
  );

  if (languagesWithResources.length === 0) return null;

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
        <div className="mt-3 space-y-6">
          {languagesWithResources.map((lang) => (
            <div key={lang}>
              {languagesWithResources.length > 1 && (
                <h3 className="text-sm font-bold text-slate-600 dark:text-slate-300 mb-3">
                  {getLanguageLabel(lang)}
                </h3>
              )}
              <div className="space-y-5">
                {RESOURCES[lang].map((category) => (
                  <div key={`${lang}-${category.label}`}>
                    <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                      {category.emoji} {category.label}
                    </h4>
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
