export interface MinimalPair {
  id: string;
  wordA: string;
  wordB: string;
  readingA: string;
  readingB: string;
  meaningA: string;
  meaningB: string;
  hint: string;
  category: string;
}

export const jaMinimalPairs: MinimalPair[] = [
  // Voicing contrasts (ka/ga, ta/da, etc.)
  { id: 'ja-1', wordA: 'かく', wordB: 'がく', readingA: 'kaku', readingB: 'gaku', meaningA: 'to write', meaningB: 'learning', hint: 'k vs g', category: 'voicing' },
  { id: 'ja-2', wordA: 'たいこ', wordB: 'だいこ', readingA: 'taiko', readingB: 'daiko', meaningA: 'drum', meaningB: 'radish (alt)', hint: 't vs d', category: 'voicing' },
  { id: 'ja-3', wordA: 'かた', wordB: 'がた', readingA: 'kata', readingB: 'gata', meaningA: 'shoulder', meaningB: 'type/shape', hint: 'k vs g', category: 'voicing' },
  { id: 'ja-4', wordA: 'てんき', wordB: 'でんき', readingA: 'tenki', readingB: 'denki', meaningA: 'weather', meaningB: 'electricity', hint: 't vs d', category: 'voicing' },
  { id: 'ja-5', wordA: 'はし', wordB: 'ばし', readingA: 'hashi', readingB: 'bashi', meaningA: 'bridge', meaningB: 'bridge (suffix)', hint: 'h vs b', category: 'voicing' },
  { id: 'ja-6', wordA: 'かいが', wordB: 'がいが', readingA: 'kaiga', readingB: 'gaiga', meaningA: 'painting', meaningB: 'foreign picture', hint: 'k vs g', category: 'voicing' },
  { id: 'ja-7', wordA: 'ひと', wordB: 'びと', readingA: 'hito', readingB: 'bito', meaningA: 'person', meaningB: 'person (suffix)', hint: 'h vs b', category: 'voicing' },
  { id: 'ja-8', wordA: 'はん', wordB: 'ばん', readingA: 'han', readingB: 'ban', meaningA: 'half', meaningB: 'number/turn', hint: 'h vs b', category: 'voicing' },

  // Long vs short vowels
  { id: 'ja-9', wordA: 'おばさん', wordB: 'おばあさん', readingA: 'obasan', readingB: 'obaasan', meaningA: 'aunt', meaningB: 'grandmother', hint: 'short vs long あ', category: 'vowel-length' },
  { id: 'ja-10', wordA: 'おじさん', wordB: 'おじいさん', readingA: 'ojisan', readingB: 'ojiisan', meaningA: 'uncle', meaningB: 'grandfather', hint: 'short vs long い', category: 'vowel-length' },
  { id: 'ja-11', wordA: 'ここ', wordB: 'こうこう', readingA: 'koko', readingB: 'kōkō', meaningA: 'here', meaningB: 'high school', hint: 'short vs long お', category: 'vowel-length' },
  { id: 'ja-12', wordA: 'ゆき', wordB: 'ゆうき', readingA: 'yuki', readingB: 'yūki', meaningA: 'snow', meaningB: 'courage', hint: 'short vs long う', category: 'vowel-length' },
  { id: 'ja-13', wordA: 'え', wordB: 'ええ', readingA: 'e', readingB: 'ee', meaningA: 'picture', meaningB: 'yes', hint: 'short vs long え', category: 'vowel-length' },
  { id: 'ja-14', wordA: 'くき', wordB: 'くうき', readingA: 'kuki', readingB: 'kūki', meaningA: 'stem', meaningB: 'air', hint: 'short vs long う', category: 'vowel-length' },

  // Double consonants (っ)
  { id: 'ja-15', wordA: 'かた', wordB: 'かった', readingA: 'kata', readingB: 'katta', meaningA: 'form', meaningB: 'won (past)', hint: 'single vs double t', category: 'gemination' },
  { id: 'ja-16', wordA: 'きて', wordB: 'きって', readingA: 'kite', readingB: 'kitte', meaningA: 'wearing', meaningB: 'stamp', hint: 'single vs double t', category: 'gemination' },
  { id: 'ja-17', wordA: 'さか', wordB: 'さっか', readingA: 'saka', readingB: 'sakka', meaningA: 'slope', meaningB: 'writer', hint: 'single vs double k', category: 'gemination' },
  { id: 'ja-18', wordA: 'いた', wordB: 'いった', readingA: 'ita', readingB: 'itta', meaningA: 'was (existed)', meaningB: 'went/said (past)', hint: 'single vs double t', category: 'gemination' },
  { id: 'ja-19', wordA: 'もと', wordB: 'もっと', readingA: 'moto', readingB: 'motto', meaningA: 'origin', meaningB: 'more', hint: 'single vs double t', category: 'gemination' },
  { id: 'ja-20', wordA: 'かこ', wordB: 'かっこ', readingA: 'kako', readingB: 'kakko', meaningA: 'past', meaningB: 'brackets/cool', hint: 'single vs double k', category: 'gemination' },

  // N vs other nasals
  { id: 'ja-21', wordA: 'かな', wordB: 'かんな', readingA: 'kana', readingB: 'kanna', meaningA: 'alphabet', meaningB: 'plane (tool)', hint: 'n vs nn', category: 'nasal' },
  { id: 'ja-22', wordA: 'おに', wordB: 'おんに', readingA: 'oni', readingB: 'onni', meaningA: 'demon', meaningB: 'to (person)', hint: 'n position', category: 'nasal' },
  { id: 'ja-23', wordA: 'しに', wordB: 'しんに', readingA: 'shini', readingB: 'shinni', meaningA: 'death (purpose)', meaningB: 'truly', hint: 'n position', category: 'nasal' },

  // Similar sounds (つ/す, し/ち, etc.)
  { id: 'ja-24', wordA: 'つき', wordB: 'すき', readingA: 'tsuki', readingB: 'suki', meaningA: 'moon', meaningB: 'like/fond of', hint: 'tsu vs su', category: 'similar-sounds' },
  { id: 'ja-25', wordA: 'しる', wordB: 'ちる', readingA: 'shiru', readingB: 'chiru', meaningA: 'to know', meaningB: 'to scatter', hint: 'shi vs chi', category: 'similar-sounds' },
  { id: 'ja-26', wordA: 'ふく', wordB: 'ふくう', readingA: 'fuku', readingB: 'fukū', meaningA: 'clothes', meaningB: 'abdominal', hint: 'short vs long u', category: 'similar-sounds' },
  { id: 'ja-27', wordA: 'りょう', wordB: 'りょ', readingA: 'ryō', readingB: 'ryo', meaningA: 'dormitory', meaningB: 'abbreviation', hint: 'long vs short', category: 'similar-sounds' },
  { id: 'ja-28', wordA: 'びょういん', wordB: 'びよういん', readingA: 'byōin', readingB: 'biyōin', meaningA: 'hospital', meaningB: 'beauty salon', hint: 'byō vs biyō', category: 'similar-sounds' },
  { id: 'ja-29', wordA: 'じゅう', wordB: 'じゅ', readingA: 'jū', readingB: 'ju', meaningA: 'ten', meaningB: 'spell/curse', hint: 'long vs short u', category: 'similar-sounds' },
  { id: 'ja-30', wordA: 'ちゅうい', wordB: 'ちゅい', readingA: 'chūi', readingB: 'chui', meaningA: 'attention', meaningB: '(no meaning)', hint: 'long vs short u', category: 'similar-sounds' },
];
