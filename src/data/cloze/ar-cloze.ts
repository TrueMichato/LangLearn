import type { ClozeSentence } from './ja-cloze';

// Arabic (MSA) cloze sentences — fill the most useful word from context.
// Original sentences; vocabulary drawn from high-frequency MSA. Readings use
// scholarly transliteration. blankedReading = transliteration of the answer.
export const arClozeSentences: ClozeSentence[] = [
  // ── Beginner ──
  { id: 'ar-c001', target: 'أنا مِن مِصْر', english: 'I am from Egypt', blankedWord: 'مِن', blankedReading: 'min', frequencyRank: 2, difficulty: 'beginner' },
  { id: 'ar-c002', target: 'البَيْت كَبِير', english: 'The house is big', blankedWord: 'البَيْت', blankedReading: 'al-bayt', frequencyRank: 78, difficulty: 'beginner' },
  { id: 'ar-c003', target: 'هذا كِتاب جَدِيد', english: 'This is a new book', blankedWord: 'كِتاب', blankedReading: 'kitāb', frequencyRank: 97, difficulty: 'beginner' },
  { id: 'ar-c004', target: 'أشْرَبُ الماء', english: 'I drink the water', blankedWord: 'الماء', blankedReading: 'al-māʾ', frequencyRank: 84, difficulty: 'beginner' },
  { id: 'ar-c005', target: 'هي طالِبة في الجامِعة', english: 'She is a student at the university', blankedWord: 'طالِبة', blankedReading: 'ṭāliba', frequencyRank: 98, difficulty: 'beginner' },
  { id: 'ar-c006', target: 'أُحِبُّ القَهْوة', english: 'I love coffee', blankedWord: 'أُحِبُّ', blankedReading: 'uḥibbu', frequencyRank: 185, difficulty: 'beginner' },
  { id: 'ar-c007', target: 'أينَ المَطار؟', english: 'Where is the airport?', blankedWord: 'أينَ', blankedReading: 'ayna', frequencyRank: 66, difficulty: 'beginner' },
  { id: 'ar-c008', target: 'الطَّقْس جَمِيل اليَوْم', english: 'The weather is beautiful today', blankedWord: 'اليَوْم', blankedReading: 'al-yawm', frequencyRank: 24, difficulty: 'beginner' },
  { id: 'ar-c009', target: 'أُمِّي مُعَلِّمة', english: 'My mother is a teacher', blankedWord: 'مُعَلِّمة', blankedReading: 'muʿallima', frequencyRank: 99, difficulty: 'beginner' },
  { id: 'ar-c010', target: 'نَذْهَبُ إلى السُّوق', english: 'We go to the market', blankedWord: 'إلى', blankedReading: 'ilā', frequencyRank: 5, difficulty: 'beginner' },
  { id: 'ar-c011', target: 'عِنْدي أخٌ وأُخْت', english: 'I have a brother and a sister', blankedWord: 'أُخْت', blankedReading: 'ukht', frequencyRank: 129, difficulty: 'beginner' },
  { id: 'ar-c012', target: 'الوَلَد يَأْكُلُ الخُبْز', english: 'The boy eats the bread', blankedWord: 'يَأْكُلُ', blankedReading: 'yaʾkulu', frequencyRank: 175, difficulty: 'beginner' },
  { id: 'ar-c013', target: 'السَّيّارة أمامَ البَيْت', english: 'The car is in front of the house', blankedWord: 'السَّيّارة', blankedReading: 'as-sayyāra', frequencyRank: 104, difficulty: 'beginner' },
  { id: 'ar-c014', target: 'أنا سَعِيد جِدًّا', english: 'I am very happy', blankedWord: 'سَعِيد', blankedReading: 'saʿīd', frequencyRank: 150, difficulty: 'beginner' },
  { id: 'ar-c015', target: 'شُكْرًا جَزِيلًا', english: 'Thank you very much', blankedWord: 'شُكْرًا', blankedReading: 'shukran', frequencyRank: 218, difficulty: 'beginner' },

  // ── Intermediate ──
  { id: 'ar-c016', target: 'أُرِيدُ أن أتَعَلَّمَ العَرَبِيّة', english: 'I want to learn Arabic', blankedWord: 'أتَعَلَّمَ', blankedReading: 'ataʿallama', frequencyRank: 174, difficulty: 'intermediate' },
  { id: 'ar-c017', target: 'كانَ الجَوُّ بارِدًا أمْس', english: 'The weather was cold yesterday', blankedWord: 'كانَ', blankedReading: 'kāna', frequencyRank: 14, difficulty: 'intermediate' },
  { id: 'ar-c018', target: 'سَوْفَ أُسافِرُ غَدًا', english: 'I will travel tomorrow', blankedWord: 'سَوْفَ', blankedReading: 'sawfa', frequencyRank: 63, difficulty: 'intermediate' },
  { id: 'ar-c019', target: 'لم أفْهَمِ السُّؤال', english: 'I did not understand the question', blankedWord: 'أفْهَمِ', blankedReading: 'afham', frequencyRank: 173, difficulty: 'intermediate' },
  { id: 'ar-c020', target: 'المَدِينة التي زُرْتُها جَمِيلة', english: 'The city that I visited is beautiful', blankedWord: 'التي', blankedReading: 'allatī', frequencyRank: 6, difficulty: 'intermediate' },
  { id: 'ar-c021', target: 'يَجِبُ أن نَذْهَبَ الآن', english: 'We must go now', blankedWord: 'الآن', blankedReading: 'al-ān', frequencyRank: 49, difficulty: 'intermediate' },
  { id: 'ar-c022', target: 'هل يُمْكِنُكَ أن تُساعِدَني؟', english: 'Can you help me?', blankedWord: 'تُساعِدَني', blankedReading: 'tusāʿidanī', frequencyRank: 205, difficulty: 'intermediate' },
  { id: 'ar-c023', target: 'قَرَأْتُ هذا الكِتاب مَرَّتَيْن', english: 'I read this book twice', blankedWord: 'قَرَأْتُ', blankedReading: 'qaraʾtu', frequencyRank: 168, difficulty: 'intermediate' },
  { id: 'ar-c024', target: 'الطَّعام في هذا المَطْعَم لَذِيذ', english: 'The food in this restaurant is delicious', blankedWord: 'المَطْعَم', blankedReading: 'al-maṭʿam', frequencyRank: 261, difficulty: 'intermediate' },
  { id: 'ar-c025', target: 'أعْمَلُ في شَرِكة كَبِيرة', english: 'I work at a big company', blankedWord: 'شَرِكة', blankedReading: 'sharika', frequencyRank: 267, difficulty: 'intermediate' },

  // ── Advanced ──
  { id: 'ar-c026', target: 'رَغْمَ المَطَر، خَرَجْنا للنُّزْهة', english: 'Despite the rain, we went out for a walk', blankedWord: 'رَغْمَ', blankedReading: 'raghma', frequencyRank: 300, difficulty: 'advanced' },
  { id: 'ar-c027', target: 'تُعْتَبَرُ اللُّغة العَرَبِيّة مِن أقْدَمِ اللُّغات', english: 'Arabic is considered one of the oldest languages', blankedWord: 'اللُّغة', blankedReading: 'al-lugha', frequencyRank: 116, difficulty: 'advanced' },
  { id: 'ar-c028', target: 'لا بُدَّ مِن الاحْتِرام المُتَبادَل', english: 'Mutual respect is essential', blankedWord: 'الاحْتِرام', blankedReading: 'al-iḥtirām', frequencyRank: 300, difficulty: 'advanced' },
  { id: 'ar-c029', target: 'ازْدادَ عَدَدُ السُّكّان بِسُرْعة', english: 'The population grew quickly', blankedWord: 'عَدَدُ', blankedReading: 'ʿadad', frequencyRank: 53, difficulty: 'advanced' },
  { id: 'ar-c030', target: 'يَسْعى الجَمِيعُ إلى تَحْقِيقِ أحْلامِهِم', english: 'Everyone strives to achieve their dreams', blankedWord: 'أحْلامِهِم', blankedReading: 'aḥlāmihim', frequencyRank: 300, difficulty: 'advanced' },
];
