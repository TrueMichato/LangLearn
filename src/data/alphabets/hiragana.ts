export interface Character {
  char: string;
  romanji: string;
  group: string;
  strokes: number;
  meaning?: string;
  // Mnemonic learning support (Tofugu-sourced content marked with source: 'tofugu')
  mnemonic?: string;
  hint?: string;
  radicals?: string[];
  onyomi?: string[];
  kunyomi?: string[];
  exampleWords?: { word: string; reading: string; meaning: string }[];
  source?: string;
  imageUrl?: string;
}

export const HIRAGANA: Character[] = [
  // Vowels
  { char: 'あ', romanji: 'a', group: 'Vowels', strokes: 3, hint: 'A', mnemonic: "Find the capital A inside of it. This A will tell you that this kana is also 'a'. There is another similar kana, お, but that one doesn't have an A in it.", source: 'tofugu', imageUrl: 'https://files.tofugu.com/articles/japanese/2014-06-30-learn-hiragana/あ.png' },
  { char: 'い', romanji: 'i', group: 'Vowels', strokes: 2, hint: 'eels', mnemonic: "Think of a couple of eels hanging out. They're upright because they're trying to mimic the letter 'i' which also stands upright.", source: 'tofugu', imageUrl: 'https://files.tofugu.com/articles/japanese/2014-06-30-learn-hiragana/い.png' },
  { char: 'う', romanji: 'u', group: 'Vowels', strokes: 2, hint: 'U', mnemonic: "Notice the U shape right in it! It's sideways but it's there. Be careful, there's another similar hiragana, つ, but that one isn't wearing a hat like U (you) are.", source: 'tofugu', imageUrl: 'https://files.tofugu.com/articles/japanese/2014-06-30-learn-hiragana/う.png' },
  { char: 'え', romanji: 'e', group: 'Vowels', strokes: 2, hint: 'exotic bird', mnemonic: 'Think of it like an exotic bird. The feathery thing on its head gives it away that it\'s exotic. It also lays exotic eggs.', source: 'tofugu', imageUrl: 'https://files.tofugu.com/articles/japanese/2014-06-30-learn-hiragana/え.png' },
  { char: 'お', romanji: 'o', group: 'Vowels', strokes: 3, hint: 'o o', mnemonic: "Can you see the letter 'o' in here, two times? This one looks similar to あ, except there are two letter 'o' symbols visible in there.", source: 'tofugu', imageUrl: 'https://files.tofugu.com/articles/japanese/2014-06-30-learn-hiragana/お.jpg' },
  // K-row
  { char: 'か', romanji: 'ka', group: 'K-row', strokes: 3, hint: 'mosquito', mnemonic: "See how this kana looks like a mosquito? Mosquitos happen to be called か (ka) in Japanese. You also say 'cut it out, darn mosquito!' when they try to suck your blood.", source: 'tofugu', imageUrl: 'https://files.tofugu.com/articles/japanese/2014-06-30-learn-hiragana/か-mosquito.png' },
  { char: 'き', romanji: 'ki', group: 'K-row', strokes: 4, hint: 'key', mnemonic: 'Notice how much it resembles a key.', source: 'tofugu', imageUrl: 'https://files.tofugu.com/articles/japanese/2014-06-30-learn-hiragana/き.png' },
  { char: 'く', romanji: 'ku', group: 'K-row', strokes: 1, hint: 'cuckoo', mnemonic: "Think of this kana being the mouth of a coo-coo / cuckoo bird popping out saying 'ku ku, ku ku!'", source: 'tofugu', imageUrl: 'https://files.tofugu.com/articles/japanese/2014-06-30-learn-hiragana/く.png' },
  { char: 'け', romanji: 'ke', group: 'K-row', strokes: 3, hint: 'kelp', mnemonic: 'See how this kana resembles some wiggly kelp?', source: 'tofugu', imageUrl: 'https://files.tofugu.com/articles/japanese/2014-06-30-learn-hiragana/け-kelp.png' },
  { char: 'こ', romanji: 'ko', group: 'K-row', strokes: 2, hint: 'co-habitation', mnemonic: 'A couple of co-habitation worms. They\'re so happy together, co-habitating the same area!', source: 'tofugu', imageUrl: 'https://files.tofugu.com/articles/japanese/2014-06-30-learn-hiragana/こ.png' },
  // S-row
  { char: 'さ', romanji: 'sa', group: 'S-row', strokes: 3, hint: 'salsa', mnemonic: 'Notice how this kana looks like two hands stirring a bowl of salsa. This salsa is so chunky and thick, you need two hands just to stir it!', source: 'tofugu', imageUrl: 'https://files.tofugu.com/articles/japanese/2014-06-30-learn-hiragana/さ-salsa.jpg' },
  { char: 'し', romanji: 'shi', group: 'S-row', strokes: 1, hint: "shepherd's crook", mnemonic: "This kana looks like a giant shepherd's crook used to herd sheep.", source: 'tofugu', imageUrl: 'https://files.tofugu.com/articles/japanese/2014-06-30-learn-hiragana/し-sheperds-crook.png' },
  { char: 'す', romanji: 'su', group: 'S-row', strokes: 2, hint: 'swing', mnemonic: "See the swing doing a loop-dee-loop throwing that poor kid off of it? Imagine him screaming 'I'M GONNA SUE SOMEBODY FOR THIS!' as he flies off.", source: 'tofugu', imageUrl: 'https://files.tofugu.com/articles/japanese/2014-06-30-learn-hiragana/す.png' },
  { char: 'せ', romanji: 'se', group: 'S-row', strokes: 3, hint: 'sell', mnemonic: "This kana looks like a mouth with a big vampire fang in it. Someone's trying to sell you a set of vampire teeth because they are just so sexy!", source: 'tofugu', imageUrl: 'https://files.tofugu.com/articles/japanese/2014-06-30-learn-hiragana/せ.png' },
  { char: 'そ', romanji: 'so', group: 'S-row', strokes: 1, hint: 'soda', mnemonic: 'See how this kana looks like a mouth slurping soda?', source: 'tofugu', imageUrl: 'https://files.tofugu.com/articles/japanese/2014-06-30-learn-hiragana/そ-soda.png' },
  // T-row
  { char: 'た', romanji: 'ta', group: 'T-row', strokes: 4, hint: 'taco', mnemonic: "Use your imagination and see this kana as a fork, taco, and lime garnish for your taco. You're eating a taco with a fork? That's a bit weird, but you do you.", source: 'tofugu', imageUrl: 'https://files.tofugu.com/articles/japanese/2014-06-30-learn-hiragana/た-taco.png' },
  { char: 'ち', romanji: 'chi', group: 'T-row', strokes: 2, hint: 'cheese', mnemonic: "You know when someone tells you to say 'cheese' when taking a picture? This kana looks like that forced smile you have to make every time you're in a group photo.", source: 'tofugu', imageUrl: 'https://files.tofugu.com/articles/japanese/2014-06-30-learn-hiragana/ち-say-cheese.png' },
  { char: 'つ', romanji: 'tsu', group: 'T-row', strokes: 1, hint: 'tsunami', mnemonic: "Look at the swoosh of this hiragana. Doesn't it look like a big wave, or tsunami?", source: 'tofugu', imageUrl: 'https://files.tofugu.com/articles/japanese/2014-06-30-learn-hiragana/つ-tsunami.jpg' },
  { char: 'て', romanji: 'te', group: 'T-row', strokes: 1, hint: 'telescope', mnemonic: "Can you see a good ol' telescope? It's a hand-held one! In Japanese, 'hand' is て (te). That should help you remember this kana looks like an old-school hand(te)-held telescope.", source: 'tofugu', imageUrl: 'https://files.tofugu.com/articles/japanese/2014-06-30-learn-hiragana/て-telescope.png' },
  { char: 'と', romanji: 'to', group: 'T-row', strokes: 2, hint: 'toe', mnemonic: 'This kana looks just like someone\'s toe with a little nail or splinter in it. Imagine how much this would hurt if it was your toe!', source: 'tofugu', imageUrl: 'https://files.tofugu.com/articles/japanese/2014-06-30-learn-hiragana/と.png' },
  // N-row
  { char: 'な', romanji: 'na', group: 'N-row', strokes: 4, hint: 'knot', mnemonic: "This kana looks like a complicated knot. 'Na' what a difficult knot to untie!", source: 'tofugu', imageUrl: 'https://files.tofugu.com/articles/japanese/2014-06-30-learn-hiragana/な.jpg' },
  { char: 'に', romanji: 'ni', group: 'N-row', strokes: 3, hint: 'needle', mnemonic: 'See the needles? There are two vertical lines that look like a pair of needles next to a thread.', source: 'tofugu', imageUrl: 'https://files.tofugu.com/articles/japanese/2014-06-30-learn-hiragana/に.jpg' },
  { char: 'ぬ', romanji: 'nu', group: 'N-row', strokes: 2, hint: 'noodles', mnemonic: 'This kana has a big loopy thing at the end, like noodles being twirled around on chopsticks.', source: 'tofugu', imageUrl: 'https://files.tofugu.com/articles/japanese/2014-06-30-learn-hiragana/ぬ.jpg' },
  { char: 'ね', romanji: 'ne', group: 'N-row', strokes: 2, hint: 'Nessie', mnemonic: 'Nessie, the Loch Ness Monster, swam to Japan and surfaced! Can you see her long neck sticking out of the water?', source: 'tofugu', imageUrl: 'https://files.tofugu.com/articles/japanese/2014-06-30-learn-hiragana/ね.png' },
  { char: 'の', romanji: 'no', group: 'N-row', strokes: 1, hint: 'no', mnemonic: "This kana looks like a 'No' sign. You can see the circle with a diagonal line going through it.", source: 'tofugu', imageUrl: 'https://files.tofugu.com/articles/japanese/2014-06-30-learn-hiragana/の.jpg' },
  // H-row
  { char: 'は', romanji: 'ha', group: 'H-row', strokes: 3, hint: 'hat', mnemonic: 'Ha! This kana is shaped like a laughing person wearing a big hat. Ha ha ha!', source: 'tofugu', imageUrl: 'https://files.tofugu.com/articles/japanese/2014-06-30-learn-hiragana/は.png' },
  { char: 'ひ', romanji: 'hi', group: 'H-row', strokes: 1, hint: 'he laughs', mnemonic: "He is laughing. 'Hee hee hee.' Can you see the smiley mouth?", source: 'tofugu', imageUrl: 'https://files.tofugu.com/articles/japanese/2014-06-30-learn-hiragana/ひ.jpg' },
  { char: 'ふ', romanji: 'fu', group: 'H-row', strokes: 4, hint: 'Mt. Fuji', mnemonic: 'This character looks like Mt. Fuji with a little puff of cloud over the top.', source: 'tofugu', imageUrl: 'https://files.tofugu.com/articles/japanese/2014-06-30-learn-hiragana/ふ.jpg' },
  { char: 'へ', romanji: 'he', group: 'H-row', strokes: 1, hint: 'hill', mnemonic: "This is a simple hill shape. 'Hey, look at that hill!'", source: 'tofugu', imageUrl: 'https://files.tofugu.com/articles/japanese/2014-06-30-learn-hiragana/へ.jpg' },
  { char: 'ほ', romanji: 'ho', group: 'H-row', strokes: 4, hint: 'hopscotch', mnemonic: 'A person playing hopscotch. You can see the grid and a little person there.', source: 'tofugu', imageUrl: 'https://files.tofugu.com/articles/japanese/2014-06-30-learn-hiragana/ほ.png' },
  // M-row
  { char: 'ま', romanji: 'ma', group: 'M-row', strokes: 3, hint: 'mama', mnemonic: 'Think of a mama holding her baby. See the arms wrapping around?', source: 'tofugu', imageUrl: 'https://files.tofugu.com/articles/japanese/2014-06-30-learn-hiragana/ま.jpg' },
  { char: 'み', romanji: 'mi', group: 'M-row', strokes: 2, hint: '21', mnemonic: "See the number 21 in this kana? MI-21. A blackjack dealer at a table would say 'twenty-one!'", source: 'tofugu', imageUrl: 'https://files.tofugu.com/articles/japanese/2014-06-30-learn-hiragana/み.jpg' },
  { char: 'む', romanji: 'mu', group: 'M-row', strokes: 3, hint: 'moo', mnemonic: "This looks like a cow's face — 'Moo!'", source: 'tofugu', imageUrl: 'https://files.tofugu.com/articles/japanese/2014-06-30-learn-hiragana/む.jpg' },
  { char: 'め', romanji: 'me', group: 'M-row', strokes: 2, hint: 'eye', mnemonic: 'This looks like an eye (目/め means eye in Japanese). See the round shape?', source: 'tofugu', imageUrl: 'https://files.tofugu.com/articles/japanese/2014-06-30-learn-hiragana/め.jpg' },
  { char: 'も', romanji: 'mo', group: 'M-row', strokes: 3, hint: 'more', mnemonic: "This kana wants MORE hooks — look at all those hooks! Mo' hooks, mo' problems.", source: 'tofugu', imageUrl: 'https://files.tofugu.com/articles/japanese/2014-06-30-learn-hiragana/も.jpg' },
  // Y-row
  { char: 'や', romanji: 'ya', group: 'Y-row', strokes: 3, hint: 'yak', mnemonic: "This looks like a yak with horns — 'Ya know, I'm a yak!'", source: 'tofugu', imageUrl: 'https://files.tofugu.com/articles/japanese/2014-06-30-learn-hiragana/や.jpg' },
  { char: 'ゆ', romanji: 'yu', group: 'Y-row', strokes: 2, hint: 'U-turn fish', mnemonic: "A fish making a U-turn — 'yuu' turn!", source: 'tofugu', imageUrl: 'https://files.tofugu.com/articles/japanese/2014-06-30-learn-hiragana/ゆ.png' },
  { char: 'よ', romanji: 'yo', group: 'Y-row', strokes: 2, hint: 'yo-yo', mnemonic: "This looks like a yo-yo dangling on its string. 'Yo!' what a cool yo-yo.", source: 'tofugu', imageUrl: 'https://files.tofugu.com/articles/japanese/2014-06-30-learn-hiragana/よ.jpg' },
  // R-row
  { char: 'ら', romanji: 'ra', group: 'R-row', strokes: 2, hint: 'rapper', mnemonic: "A rapper holding a microphone — 'Ra-ra-ra!' Drop the beat!", source: 'tofugu', imageUrl: 'https://files.tofugu.com/articles/japanese/2014-06-30-learn-hiragana/ら.png' },
  { char: 'り', romanji: 'ri', group: 'R-row', strokes: 2, hint: 'reeds', mnemonic: 'Two reeds blowing in the wind by a river.', source: 'tofugu', imageUrl: 'https://files.tofugu.com/articles/japanese/2014-06-30-learn-hiragana/り.png' },
  { char: 'る', romanji: 'ru', group: 'R-row', strokes: 1, hint: 'loop', mnemonic: 'This kana has a big loop at the bottom — following a looping route.', source: 'tofugu', imageUrl: 'https://files.tofugu.com/articles/japanese/2014-06-30-learn-hiragana/る.png' },
  { char: 'れ', romanji: 're', group: 'R-row', strokes: 2, hint: 'ramp', mnemonic: "This kana looks like someone going up a ramp. 'Re-ally steep ramp!'", source: 'tofugu', imageUrl: 'https://files.tofugu.com/articles/japanese/2014-06-30-learn-hiragana/れ.png' },
  { char: 'ろ', romanji: 'ro', group: 'R-row', strokes: 1, hint: 'road', mnemonic: "A simple winding road — 'ro-ad' ahead!", source: 'tofugu', imageUrl: 'https://files.tofugu.com/articles/japanese/2014-06-30-learn-hiragana/ろ.png' },
  // W-row + N
  { char: 'わ', romanji: 'wa', group: 'W-row', strokes: 2, hint: 'wave', mnemonic: "A wave curling over — 'Wa!' watch out for that wave!", source: 'tofugu', imageUrl: 'https://files.tofugu.com/articles/japanese/2014-06-30-learn-hiragana/わ.png' },
  { char: 'を', romanji: 'wo', group: 'W-row', strokes: 3, hint: 'acrobat', mnemonic: "An acrobat doing a balancing act. This kana is used only as a particle (like 'wo').", source: 'tofugu', imageUrl: 'https://files.tofugu.com/articles/japanese/2014-06-30-learn-hiragana/を.png' },
  { char: 'ん', romanji: 'n', group: 'W-row', strokes: 1, hint: 'end', mnemonic: "The last hiragana character — it looks like a smooth curve that says 'the end.' N marks the end of the basic hiragana!", source: 'tofugu', imageUrl: 'https://files.tofugu.com/articles/japanese/2014-06-30-learn-hiragana/ん.png' },
  // Dakuten
  { char: 'が', romanji: 'ga', group: 'Dakuten', strokes: 5 },
  { char: 'ぎ', romanji: 'gi', group: 'Dakuten', strokes: 6 },
  { char: 'ぐ', romanji: 'gu', group: 'Dakuten', strokes: 3 },
  { char: 'げ', romanji: 'ge', group: 'Dakuten', strokes: 5 },
  { char: 'ご', romanji: 'go', group: 'Dakuten', strokes: 4 },
  { char: 'ざ', romanji: 'za', group: 'Dakuten', strokes: 5 },
  { char: 'じ', romanji: 'ji', group: 'Dakuten', strokes: 3 },
  { char: 'ず', romanji: 'zu', group: 'Dakuten', strokes: 4 },
  { char: 'ぜ', romanji: 'ze', group: 'Dakuten', strokes: 5 },
  { char: 'ぞ', romanji: 'zo', group: 'Dakuten', strokes: 3 },
  { char: 'だ', romanji: 'da', group: 'Dakuten', strokes: 6 },
  { char: 'ぢ', romanji: 'di', group: 'Dakuten', strokes: 4 },
  { char: 'づ', romanji: 'du', group: 'Dakuten', strokes: 3 },
  { char: 'で', romanji: 'de', group: 'Dakuten', strokes: 3 },
  { char: 'ど', romanji: 'do', group: 'Dakuten', strokes: 4 },
  { char: 'ば', romanji: 'ba', group: 'Dakuten', strokes: 5 },
  { char: 'び', romanji: 'bi', group: 'Dakuten', strokes: 3 },
  { char: 'ぶ', romanji: 'bu', group: 'Dakuten', strokes: 6 },
  { char: 'べ', romanji: 'be', group: 'Dakuten', strokes: 3 },
  { char: 'ぼ', romanji: 'bo', group: 'Dakuten', strokes: 6 },
  // Handakuten
  { char: 'ぱ', romanji: 'pa', group: 'Handakuten', strokes: 4 },
  { char: 'ぴ', romanji: 'pi', group: 'Handakuten', strokes: 2 },
  { char: 'ぷ', romanji: 'pu', group: 'Handakuten', strokes: 5 },
  { char: 'ぺ', romanji: 'pe', group: 'Handakuten', strokes: 2 },
  { char: 'ぽ', romanji: 'po', group: 'Handakuten', strokes: 5 },
  // Yōon (basic)
  { char: 'きゃ', romanji: 'kya', group: 'Yōon', strokes: 2 },
  { char: 'きゅ', romanji: 'kyu', group: 'Yōon', strokes: 2 },
  { char: 'きょ', romanji: 'kyo', group: 'Yōon', strokes: 2 },
  { char: 'しゃ', romanji: 'sha', group: 'Yōon', strokes: 2 },
  { char: 'しゅ', romanji: 'shu', group: 'Yōon', strokes: 2 },
  { char: 'しょ', romanji: 'sho', group: 'Yōon', strokes: 2 },
  { char: 'ちゃ', romanji: 'cha', group: 'Yōon', strokes: 2 },
  { char: 'ちゅ', romanji: 'chu', group: 'Yōon', strokes: 2 },
  { char: 'ちょ', romanji: 'cho', group: 'Yōon', strokes: 2 },
  { char: 'にゃ', romanji: 'nya', group: 'Yōon', strokes: 2 },
  { char: 'にゅ', romanji: 'nyu', group: 'Yōon', strokes: 2 },
  { char: 'にょ', romanji: 'nyo', group: 'Yōon', strokes: 2 },
  { char: 'ひゃ', romanji: 'hya', group: 'Yōon', strokes: 2 },
  { char: 'ひゅ', romanji: 'hyu', group: 'Yōon', strokes: 2 },
  { char: 'ひょ', romanji: 'hyo', group: 'Yōon', strokes: 2 },
  { char: 'みゃ', romanji: 'mya', group: 'Yōon', strokes: 2 },
  { char: 'みゅ', romanji: 'myu', group: 'Yōon', strokes: 2 },
  { char: 'みょ', romanji: 'myo', group: 'Yōon', strokes: 2 },
  { char: 'りゃ', romanji: 'rya', group: 'Yōon', strokes: 2 },
  { char: 'りゅ', romanji: 'ryu', group: 'Yōon', strokes: 2 },
  { char: 'りょ', romanji: 'ryo', group: 'Yōon', strokes: 2 },
  // Yōon-Dakuten
  { char: 'ぎゃ', romanji: 'gya', group: 'Yōon-Dakuten', strokes: 2 },
  { char: 'ぎゅ', romanji: 'gyu', group: 'Yōon-Dakuten', strokes: 2 },
  { char: 'ぎょ', romanji: 'gyo', group: 'Yōon-Dakuten', strokes: 2 },
  { char: 'じゃ', romanji: 'ja', group: 'Yōon-Dakuten', strokes: 2 },
  { char: 'じゅ', romanji: 'ju', group: 'Yōon-Dakuten', strokes: 2 },
  { char: 'じょ', romanji: 'jo', group: 'Yōon-Dakuten', strokes: 2 },
  { char: 'びゃ', romanji: 'bya', group: 'Yōon-Dakuten', strokes: 2 },
  { char: 'びゅ', romanji: 'byu', group: 'Yōon-Dakuten', strokes: 2 },
  { char: 'びょ', romanji: 'byo', group: 'Yōon-Dakuten', strokes: 2 },
  // Yōon-Handakuten
  { char: 'ぴゃ', romanji: 'pya', group: 'Yōon-Handakuten', strokes: 2 },
  { char: 'ぴゅ', romanji: 'pyu', group: 'Yōon-Handakuten', strokes: 2 },
  { char: 'ぴょ', romanji: 'pyo', group: 'Yōon-Handakuten', strokes: 2 },
  // Sokuon
  { char: 'っ', romanji: '(pause)', group: 'Sokuon', strokes: 1 },
];
