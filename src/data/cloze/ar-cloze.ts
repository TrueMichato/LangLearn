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

  // ── Beginner (batch 2) ──
  { id: 'ar-c031', target: 'أنا جائِع، أُرِيدُ أن آكُلَ', english: 'I am hungry, I want to eat', blankedWord: 'جائِع', blankedReading: 'jāʾiʿ', frequencyRank: 200, difficulty: 'beginner' },
  { id: 'ar-c032', target: 'الكِتابُ على الطّاوِلة', english: 'The book is on the table', blankedWord: 'على', blankedReading: 'ʿalā', frequencyRank: 3, difficulty: 'beginner' },
  { id: 'ar-c033', target: 'كَم السّاعة الآن؟', english: 'What time is it now?', blankedWord: 'كَم', blankedReading: 'kam', frequencyRank: 65, difficulty: 'beginner' },
  { id: 'ar-c034', target: 'هو يَعْمَلُ في المُسْتَشْفى', english: 'He works in the hospital', blankedWord: 'المُسْتَشْفى', blankedReading: 'al-mustashfā', frequencyRank: 236, difficulty: 'beginner' },
  { id: 'ar-c035', target: 'نَحْنُ نَتَكَلَّمُ العَرَبِيّة قَلِيلًا', english: 'We speak a little Arabic', blankedWord: 'نَتَكَلَّمُ', blankedReading: 'natakallamu', frequencyRank: 170, difficulty: 'beginner' },
  { id: 'ar-c036', target: 'أَحْتاجُ إلى قَلَم ووَرَقة', english: 'I need a pen and paper', blankedWord: 'قَلَم', blankedReading: 'qalam', frequencyRank: 240, difficulty: 'beginner' },
  { id: 'ar-c037', target: 'الجَوُّ حارٌّ في الصَّيْف', english: 'The weather is hot in summer', blankedWord: 'الصَّيْف', blankedReading: 'aṣ-ṣayf', frequencyRank: 210, difficulty: 'beginner' },
  { id: 'ar-c038', target: 'أَذْهَبُ إلى العَمَل بِالحافِلة', english: 'I go to work by bus', blankedWord: 'بِالحافِلة', blankedReading: 'bi-l-ḥāfila', frequencyRank: 250, difficulty: 'beginner' },

  // ── Intermediate (batch 2) ──
  { id: 'ar-c039', target: 'يَنْبَغي أن تَشْرَبَ الماء كَثِيرًا', english: 'You should drink a lot of water', blankedWord: 'يَنْبَغي', blankedReading: 'yanbaghī', frequencyRank: 300, difficulty: 'intermediate' },
  { id: 'ar-c040', target: 'ما زِلْتُ أنْتَظِرُ الحافِلة', english: 'I am still waiting for the bus', blankedWord: 'أنْتَظِرُ', blankedReading: 'antaẓiru', frequencyRank: 190, difficulty: 'intermediate' },
  { id: 'ar-c041', target: 'بِالرَّغْمِ مِن التَّعَب، أكْمَلَ عَمَلَه', english: 'Despite the tiredness, he finished his work', blankedWord: 'أكْمَلَ', blankedReading: 'akmala', frequencyRank: 190, difficulty: 'intermediate' },
  { id: 'ar-c042', target: 'وَصَلَ القِطارُ في مَوْعِدِه', english: 'The train arrived on time', blankedWord: 'وَصَلَ', blankedReading: 'waṣala', frequencyRank: 199, difficulty: 'intermediate' },
  { id: 'ar-c043', target: 'قالَ لي إنَّه سَيَتَأَخَّر', english: 'He told me that he would be late', blankedWord: 'قالَ', blankedReading: 'qāla', frequencyRank: 25, difficulty: 'intermediate' },
  { id: 'ar-c044', target: 'زُرْتُ جَدَّتي يَوْمَ الجُمُعة', english: 'I visited my grandmother on Friday', blankedWord: 'زُرْتُ', blankedReading: 'zurtu', frequencyRank: 200, difficulty: 'intermediate' },
  { id: 'ar-c045', target: 'يَجِبُ أن نَحْتَرِمَ آراءَ الآخَرِين', english: 'We must respect the opinions of others', blankedWord: 'نَحْتَرِمَ', blankedReading: 'naḥtarima', frequencyRank: 280, difficulty: 'intermediate' },

  // ── Advanced (batch 2) ──
  { id: 'ar-c046', target: 'يَتَمَيَّزُ هذا البَلَدُ بِتَنَوُّعِه الثَّقافيّ', english: 'This country is distinguished by its cultural diversity', blankedWord: 'يَتَمَيَّزُ', blankedReading: 'yatamayyazu', frequencyRank: 300, difficulty: 'advanced' },
  { id: 'ar-c047', target: 'أدّى الاجْتِهادُ إلى نَتائِجَ رائِعة', english: 'Hard work led to wonderful results', blankedWord: 'الاجْتِهادُ', blankedReading: 'al-ijtihād', frequencyRank: 300, difficulty: 'advanced' },
  { id: 'ar-c048', target: 'مِن الضَّرُوريِّ الحِفاظُ على البِيئة', english: 'It is necessary to preserve the environment', blankedWord: 'البِيئة', blankedReading: 'al-bīʾa', frequencyRank: 300, difficulty: 'advanced' },
  { id: 'ar-c049', target: 'كُلَّما قَرَأْتَ أكْثَر، ازْدَدْتَ مَعْرِفة', english: 'The more you read, the more knowledge you gain', blankedWord: 'ازْدَدْتَ', blankedReading: 'izdadta', frequencyRank: 300, difficulty: 'advanced' },
  { id: 'ar-c050', target: 'لَوْلا مُساعَدَتُك، لَمَا نَجَحْتُ', english: 'Were it not for your help, I would not have succeeded', blankedWord: 'لَوْلا', blankedReading: 'lawlā', frequencyRank: 300, difficulty: 'advanced' },

  // ── Beginner (batch 3) ──
  { id: 'ar-c051', target: 'أُرِيدُ أن أَتَعَلَّمَ السِّباحة', english: 'I want to learn swimming', blankedWord: 'أَتَعَلَّمَ', blankedReading: 'ataʿallama', frequencyRank: 174, difficulty: 'beginner' },
  { id: 'ar-c052', target: 'هو يُسافِرُ إلى لُبْنان', english: 'He travels to Lebanon', blankedWord: 'يُسافِرُ', blankedReading: 'yusāfiru', frequencyRank: 201, difficulty: 'beginner' },
  { id: 'ar-c053', target: 'أَسْتَمِعُ إلى الأخْبار كُلَّ صَباح', english: 'I listen to the news every morning', blankedWord: 'أَسْتَمِعُ', blankedReading: 'astamiʿu', frequencyRank: 169, difficulty: 'beginner' },
  { id: 'ar-c054', target: 'الطِّفْلُ يَمْشي في الحَدِيقة', english: 'The child walks in the garden', blankedWord: 'يَمْشي', blankedReading: 'yamshī', frequencyRank: 181, difficulty: 'beginner' },
  { id: 'ar-c055', target: 'سَأَلْتُ المُعَلِّمَ عَن الدَّرْس', english: 'I asked the teacher about the lesson', blankedWord: 'سَأَلْتُ', blankedReading: 'saʾaltu', frequencyRank: 171, difficulty: 'beginner' },
  { id: 'ar-c056', target: 'نَسِيتُ مِفْتاحي في البَيْت', english: 'I forgot my key at home', blankedWord: 'نَسِيتُ', blankedReading: 'nasītu', frequencyRank: 173, difficulty: 'beginner' },
  { id: 'ar-c057', target: 'أَغْلَقْتُ البابَ قَبْلَ النَّوْم', english: 'I closed the door before sleeping', blankedWord: 'أَغْلَقْتُ', blankedReading: 'aghlaqtu', frequencyRank: 196, difficulty: 'beginner' },

  // ── Intermediate (batch 3) ──
  { id: 'ar-c058', target: 'يَسْتَخْدِمُ النّاسُ الهَواتِفَ الذَّكِيّة كَثِيرًا', english: 'People use smartphones a lot', blankedWord: 'يَسْتَخْدِمُ', blankedReading: 'yastakhdimu', frequencyRank: 206, difficulty: 'intermediate' },
  { id: 'ar-c059', target: 'اِجْتَمَعَ المُدَراءُ لِمُناقَشةِ الخُطّة', english: 'The managers met to discuss the plan', blankedWord: 'اِجْتَمَعَ', blankedReading: 'ijtamaʿa', frequencyRank: 250, difficulty: 'intermediate' },
  { id: 'ar-c060', target: 'يَجِبُ أن نَحْتَرِمَ القَوانِين', english: 'We must respect the laws', blankedWord: 'نَحْتَرِمَ', blankedReading: 'naḥtarima', frequencyRank: 121, difficulty: 'intermediate' },
  { id: 'ar-c061', target: 'اِسْتَقْبَلَ الرَّئيسُ الضُّيُوفَ في القَصْر', english: 'The president received the guests at the palace', blankedWord: 'اِسْتَقْبَلَ', blankedReading: 'istaqbala', frequencyRank: 269, difficulty: 'intermediate' },
  { id: 'ar-c062', target: 'تَعاوَنَ الفَرِيقُ لإنْجازِ المَشْرُوع', english: 'The team cooperated to finish the project', blankedWord: 'تَعاوَنَ', blankedReading: 'taʿāwana', frequencyRank: 250, difficulty: 'intermediate' },
  { id: 'ar-c063', target: 'دَعا صَدِيقي إلى حَفْلةِ زَواجِه', english: 'My friend invited me to his wedding', blankedWord: 'دَعا', blankedReading: 'daʿā', frequencyRank: 157, difficulty: 'intermediate' },
  { id: 'ar-c064', target: 'أُطَوِّرُ مَهاراتي في كُلِّ يَوم', english: 'I develop my skills every day', blankedWord: 'أُطَوِّرُ', blankedReading: 'uṭawwiru', frequencyRank: 250, difficulty: 'intermediate' },

  // ── Advanced (batch 3) ──
  { id: 'ar-c065', target: 'يَنْبَغي علينا أن نُحافِظَ على تُراثِنا', english: 'We ought to preserve our heritage', blankedWord: 'تُراثِنا', blankedReading: 'turāthinā', frequencyRank: 300, difficulty: 'advanced' },
  { id: 'ar-c066', target: 'اِزْدَهَرَت العُلُومُ في العَصْرِ الذَّهَبيّ', english: 'The sciences flourished in the golden age', blankedWord: 'اِزْدَهَرَت', blankedReading: 'izdaharat', frequencyRank: 300, difficulty: 'advanced' },
  { id: 'ar-c067', target: 'كُلَّما تَعَمَّقْتَ في الدِّراسة، ازْدادَ فَهْمُك', english: 'The deeper you go in study, the more your understanding grows', blankedWord: 'تَعَمَّقْتَ', blankedReading: 'taʿammaqta', frequencyRank: 300, difficulty: 'advanced' },
  { id: 'ar-c068', target: 'تُسْهِمُ التِّجارةُ في ازْدِهارِ الاقْتِصاد', english: 'Trade contributes to the prosperity of the economy', blankedWord: 'الاقْتِصاد', blankedReading: 'al-iqtiṣād', frequencyRank: 300, difficulty: 'advanced' },
  { id: 'ar-c069', target: 'يَعْتَمِدُ النَّجاحُ على الصَّبْرِ والمُثابَرة', english: 'Success depends on patience and perseverance', blankedWord: 'يَعْتَمِدُ', blankedReading: 'yaʿtamidu', frequencyRank: 300, difficulty: 'advanced' },
  { id: 'ar-c070', target: 'لا يُمْكِنُ إنْكارُ أَثَرِ التَّعْليمِ في المُجْتَمَع', english: "One cannot deny education's impact on society", blankedWord: 'المُجْتَمَع', blankedReading: 'al-mujtamaʿ', frequencyRank: 130, difficulty: 'advanced' },

  // ── Beginner (batch 4) ──
  { id: 'ar-c071', target: 'الغُرْفةُ الأُولى على اليَمِين', english: 'The first room is on the right', blankedWord: 'الأُولى', blankedReading: 'al-ūlā', frequencyRank: 45, difficulty: 'beginner' },
  { id: 'ar-c072', target: 'عِنْدي مَوْعِدٌ في السّاعةِ الثّالِثة', english: 'I have an appointment at three o’clock', blankedWord: 'الثّالِثة', blankedReading: 'ath-thālitha', frequencyRank: 90, difficulty: 'beginner' },
  { id: 'ar-c073', target: 'اِشْتَرَيْتُ نِصْفَ كِيلو مِن التُّفّاح', english: 'I bought half a kilo of apples', blankedWord: 'نِصْفَ', blankedReading: 'niṣf', frequencyRank: 288, difficulty: 'beginner' },
  { id: 'ar-c074', target: 'الطَّقْسُ اليَوْمَ غائِمٌ قَلِيلًا', english: 'The weather today is a bit cloudy', blankedWord: 'غائِم', blankedReading: 'ghāʾim', frequencyRank: 300, difficulty: 'beginner' },
  { id: 'ar-c075', target: 'يَعْمَلُ أَبي مُهَنْدِسًا مِعْماريًّا', english: 'My father works as an architect', blankedWord: 'مِعْماريًّا', blankedReading: 'miʿmāriyyan', frequencyRank: 300, difficulty: 'beginner' },

  // ── Intermediate (batch 4) ──
  { id: 'ar-c076', target: 'شاهَدْنا فِيلْمًا رائِعًا في السِّينَما', english: 'We watched a wonderful film at the cinema', blankedWord: 'شاهَدْنا', blankedReading: 'shāhadnā', frequencyRank: 246, difficulty: 'intermediate' },
  { id: 'ar-c077', target: 'تَقَعُ العِراقُ في قَلْبِ الشَّرْقِ الأوْسَط', english: 'Iraq lies in the heart of the Middle East', blankedWord: 'العِراقُ', blankedReading: 'al-ʿirāq', frequencyRank: 80, difficulty: 'intermediate' },
  { id: 'ar-c078', target: 'يَحْتَفِلُ النّاسُ بِالعِيدِ كُلَّ عام', english: 'People celebrate the feast every year', blankedWord: 'يَحْتَفِلُ', blankedReading: 'yaḥtafilu', frequencyRank: 250, difficulty: 'intermediate' },
  { id: 'ar-c079', target: 'أَحْتاجُ إلى ثُلُثِ الكَمِّيّةِ فَقَط', english: 'I only need a third of the amount', blankedWord: 'ثُلُثِ', blankedReading: 'thuluth', frequencyRank: 300, difficulty: 'intermediate' },
  { id: 'ar-c080', target: 'تَبادَلَ الزَّعِيمانِ وُجْهاتِ النَّظَر', english: 'The two leaders exchanged points of view', blankedWord: 'تَبادَلَ', blankedReading: 'tabādala', frequencyRank: 300, difficulty: 'intermediate' },

  // ── Advanced (batch 4) ──
  { id: 'ar-c081', target: 'يُعَدُّ نَهْرُ النِّيلِ أَطْوَلَ أَنْهارِ العالَم', english: 'The Nile is considered the longest river in the world', blankedWord: 'أَطْوَلَ', blankedReading: 'aṭwal', frequencyRank: 300, difficulty: 'advanced' },
  { id: 'ar-c082', target: 'أَسْهَمَت الحَضارةُ العَرَبِيّةُ في تَقَدُّمِ العِلْم', english: 'Arab civilization contributed to the advance of science', blankedWord: 'الحَضارةُ', blankedReading: 'al-ḥaḍāra', frequencyRank: 273, difficulty: 'advanced' },
  { id: 'ar-c083', target: 'تُواجِهُ المِنْطَقةُ تَحَدِّياتٍ مُناخيّةً كَبِيرة', english: 'The region faces major climate challenges', blankedWord: 'تُواجِهُ', blankedReading: 'tuwājihu', frequencyRank: 300, difficulty: 'advanced' },
  { id: 'ar-c084', target: 'مِن واجِبِنا أن نَنْقُلَ التُّراثَ لِلأجْيال', english: 'It is our duty to pass on heritage to the generations', blankedWord: 'الأجْيال', blankedReading: 'al-ajyāl', frequencyRank: 300, difficulty: 'advanced' },
  { id: 'ar-c085', target: 'كُلَّما زادَ العِلْمُ، اتَّسَعَت المَسْؤُوليّة', english: 'The more knowledge grows, the greater the responsibility', blankedWord: 'اتَّسَعَت', blankedReading: 'ittasaʿat', frequencyRank: 300, difficulty: 'advanced' },
];
