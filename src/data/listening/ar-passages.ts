import type { ListeningPassage } from './ja-passages';

// Arabic (MSA) listening passages with English comprehension questions.
// Original texts, lightly diacritized for clarity. 7 easy / 6 medium / 5 hard.
export const arPassages: ListeningPassage[] = [
  // ── Easy ──────────────────────────────────────────────
  {
    id: 'ar-easy-1',
    title: 'Self Introduction',
    text: 'مَرْحَبًا! اسْمِي سامِر. أنا مِن الأُرْدُنّ. عُمْري خَمْسة وعِشْرُون عامًا. أنا مُهَنْدِس وأعْمَلُ في شَرِكة كَبِيرة. أُحِبُّ القِراءة وكُرة القَدَم.',
    difficulty: 'easy',
    questions: [
      { question: "What is the speaker's name?", options: ['Karim', 'Samir', 'Tariq', 'Nabil'], correctIndex: 1 },
      { question: 'What is his job?', options: ['Doctor', 'Teacher', 'Engineer', 'Driver'], correctIndex: 2 },
    ],
  },
  {
    id: 'ar-easy-2',
    title: 'At the Café',
    text: 'صَباح الخَيْر. أُرِيدُ فِنْجان قَهْوة مِن فَضْلِك، وقِطْعة كَعْك. كَم الحِساب؟ هل تَقْبَلُونَ البِطاقة أم النَّقْد فَقَط؟',
    difficulty: 'easy',
    questions: [
      { question: 'What does the speaker order to drink?', options: ['Tea', 'Coffee', 'Juice', 'Water'], correctIndex: 1 },
      { question: 'What does the speaker ask at the end?', options: ['For the bathroom', 'If they accept card or only cash', 'For more sugar', 'For the WiFi'], correctIndex: 1 },
    ],
  },
  {
    id: 'ar-easy-3',
    title: 'My Family',
    text: 'عائِلَتِي صَغِيرة. لي أخٌ واحِد وأُخْتان. أبي طَبِيب وأُمِّي مُعَلِّمة. نَسْكُنُ في شَقّة قَرِيبة مِن البَحْر. في العُطْلة نَزُورُ جَدِّي وجَدَّتِي.',
    difficulty: 'easy',
    questions: [
      { question: 'How many sisters does the speaker have?', options: ['One', 'Two', 'Three', 'None'], correctIndex: 1 },
      { question: 'What does the father do?', options: ['Engineer', 'Teacher', 'Doctor', 'Merchant'], correctIndex: 2 },
    ],
  },
  {
    id: 'ar-easy-4',
    title: 'The Weather',
    text: 'الجَوُّ اليَوْم بارِد ومُمْطِر في المَدِينة. لن أخْرُجَ للرِّياضة. أُفَضِّلُ أن أبْقى في البَيْت، أقْرَأُ كِتابًا وأشْرَبُ الشّاي السّاخِن.',
    difficulty: 'easy',
    questions: [
      { question: 'How is the weather today?', options: ['Hot and sunny', 'Cold and rainy', 'Windy and dry', 'Snowy'], correctIndex: 1 },
      { question: 'What will the speaker do?', options: ['Go running', 'Stay home and read', 'Visit friends', 'Go shopping'], correctIndex: 1 },
    ],
  },
  {
    id: 'ar-easy-5',
    title: 'At the Market',
    text: 'أذْهَبُ إلى السُّوق كُلَّ يَوْم جُمُعة. أشْتَري الخُضار والفاكِهة والخُبْز. البائِع رَجُل لَطِيف. اليَوْم اشْتَرَيْتُ تُفّاحًا وطَماطِم وبُرْتُقالًا.',
    difficulty: 'easy',
    questions: [
      { question: 'When does the speaker go to the market?', options: ['Every Monday', 'Every Friday', 'Every morning', 'Every evening'], correctIndex: 1 },
      { question: 'What did the speaker buy today?', options: ['Bread only', 'Meat and fish', 'Apples, tomatoes and oranges', 'Milk and sugar'], correctIndex: 2 },
    ],
  },
  {
    id: 'ar-easy-6',
    title: 'My Day',
    text: 'أسْتَيْقِظُ في السّاعة السّابِعة صَباحًا. أتَناوَلُ الفَطُور ثُمّ أذْهَبُ إلى العَمَل. في المَساء أعُودُ إلى البَيْت وأُشاهِدُ التِّلْفاز قَلِيلًا. أنامُ في السّاعة الحادِية عَشْرة.',
    difficulty: 'easy',
    questions: [
      { question: 'When does the speaker wake up?', options: ['At six', 'At seven', 'At eight', 'At nine'], correctIndex: 1 },
      { question: 'What does the speaker do in the evening?', options: ['Study', 'Watch TV a little', 'Go to the gym', 'Cook dinner'], correctIndex: 1 },
    ],
  },
  {
    id: 'ar-easy-7',
    title: 'Weekend Plans',
    text: 'في نِهاية الأُسْبُوع سَأذْهَبُ إلى السِّينَما مَع أصْدِقائي. سَنُشاهِدُ فِيلْمًا جَدِيدًا يَوْم السَّبْت. بَعْدَ ذلك نُرِيدُ أن نَتَعَشّى في مَطْعَم قَرِيب.',
    difficulty: 'easy',
    questions: [
      { question: 'Where will the speaker go on the weekend?', options: ['The beach', 'The cinema', 'The library', 'The park'], correctIndex: 1 },
      { question: 'What will they do afterwards?', options: ['Go home', 'Have dinner at a restaurant', 'Play football', 'Go shopping'], correctIndex: 1 },
    ],
  },

  // ── Medium ────────────────────────────────────────────
  {
    id: 'ar-med-1',
    title: 'A Trip to Cairo',
    text: 'في الصَّيْف الماضي سافَرْتُ إلى القاهِرة مَع عائِلَتِي. زُرْنا الأهْرامات وأبا الهَوْل، وكانَت رائِعة حَقًّا. تَناوَلْنا الطَّعام المِصْري اللَّذِيذ، وتَجَوَّلْنا في الأسْواق القَدِيمة. أتَمَنّى أن أعُودَ في العام القادِم.',
    difficulty: 'medium',
    questions: [
      { question: 'When did the speaker travel to Cairo?', options: ['Last summer', 'Last winter', 'Next year', 'Last week'], correctIndex: 0 },
      { question: 'What did they visit?', options: ['The sea and the mountains', 'The pyramids and the Sphinx', 'A museum only', 'The desert'], correctIndex: 1 },
    ],
  },
  {
    id: 'ar-med-2',
    title: 'Learning Arabic',
    text: 'أدْرُسُ اللُّغة العَرَبِيّة مُنْذُ سَنَتَيْن. في البِداية كانَت الحُرُوف صَعْبة، لكِنّي تَعَوَّدْتُ عَلَيْها. الآن أسْتَطِيعُ أن أقْرَأَ نُصُوصًا بَسِيطة وأكْتُبَ رَسائِل قَصِيرة. أُحِبُّ العَرَبِيّة لأنَّها لُغة جَمِيلة وغَنِيّة.',
    difficulty: 'medium',
    questions: [
      { question: 'How long has the speaker studied Arabic?', options: ['One year', 'Two years', 'Three years', 'Six months'], correctIndex: 1 },
      { question: 'What was difficult at the beginning?', options: ['The grammar', 'The letters', 'The numbers', 'The pronunciation'], correctIndex: 1 },
    ],
  },
  {
    id: 'ar-med-3',
    title: 'A Phone Call',
    text: 'أهْلًا يا لَيْلى، كَيْفَ حالُكِ؟ أتَّصِلُ بِكِ لأنَّني أُرِيدُ دَعْوَتَكِ إلى حَفْلة عِيد مِيلادِي يَوْم الخَمِيس القادِم في بَيْتِنا. سَتَبْدَأُ الحَفْلة في السّاعة السّابِعة مَساءً. أرْجُو أن تَحْضُري.',
    difficulty: 'medium',
    questions: [
      { question: 'Why is the speaker calling?', options: ['To ask for help', 'To invite Layla to a birthday party', 'To cancel a meeting', 'To say goodbye'], correctIndex: 1 },
      { question: 'When is the party?', options: ['Next Monday', 'Next Thursday', 'This Friday', 'Tomorrow'], correctIndex: 1 },
    ],
  },
  {
    id: 'ar-med-4',
    title: 'At the Doctor',
    text: 'دَكْتُور، أشْعُرُ بِأَلَم في رَأْسي مُنْذُ يَوْمَيْن، وعِنْدي حُمّى خَفِيفة. لا أسْتَطِيعُ النَّوْم جَيِّدًا. قالَ الطَّبِيب إنَّني بِحاجة إلى الرّاحة، ووَصَفَ لي دَواءً وطَلَبَ مِنّي أن أشْرَبَ الكَثِير مِن الماء.',
    difficulty: 'medium',
    questions: [
      { question: 'What is the patient complaining about?', options: ['Stomach pain', 'A headache and mild fever', 'A broken arm', 'A cough'], correctIndex: 1 },
      { question: 'What did the doctor advise?', options: ['Surgery', 'Rest, medicine and drinking water', 'To exercise more', 'Nothing'], correctIndex: 1 },
    ],
  },
  {
    id: 'ar-med-5',
    title: 'My Neighborhood',
    text: 'أسْكُنُ في حَيّ هادِئ في وَسَط المَدِينة. قُرْبَ بَيْتي هُناكَ حَدِيقة كَبِيرة ومَكْتَبة ومَسْجِد قَدِيم. كُلَّ صَباح أرى الأطْفال يَذْهَبُونَ إلى المَدْرَسة، والباعة يَفْتَحُونَ مَحَلّاتِهِم. أُحِبُّ حَيّي كَثِيرًا.',
    difficulty: 'medium',
    questions: [
      { question: 'Where does the speaker live?', options: ['In the countryside', 'In a quiet neighborhood downtown', 'By the sea', 'On a farm'], correctIndex: 1 },
      { question: 'What is NOT mentioned near the house?', options: ['A garden', 'A library', 'A hospital', 'An old mosque'], correctIndex: 2 },
    ],
  },
  {
    id: 'ar-med-6',
    title: 'A Recipe',
    text: 'لِتَحْضِير كُوب مِن الشّاي بالنَّعْناع، نَغْلي الماء أوّلًا. ثُمّ نُضِيفُ الشّاي وأوْراق النَّعْناع الطّازَجة والسُّكَّر حَسَب الرَّغْبة. نَتْرُكُه دَقائِق قَلِيلة، ثُمّ نَسْكُبُه في الأكْواب. إنّه مَشْرُوب شائِع في بِلاد كَثِيرة.',
    difficulty: 'medium',
    questions: [
      { question: 'What drink is being prepared?', options: ['Coffee', 'Mint tea', 'Orange juice', 'Hot chocolate'], correctIndex: 1 },
      { question: 'What is the first step?', options: ['Add sugar', 'Boil the water', 'Add mint', 'Pour into cups'], correctIndex: 1 },
    ],
  },

  // ── Hard ──────────────────────────────────────────────
  {
    id: 'ar-hard-1',
    title: 'The Arabic Language',
    text: 'تُعَدُّ اللُّغة العَرَبِيّة مِن أكْثَر اللُّغات انْتِشارًا في العالَم، إذ يَتَحَدَّثُ بِها أكْثَر مِن أرْبَعِمِئة مِلْيُون إنْسان. وهي اللُّغة الرَّسْمِيّة في أكْثَر مِن عِشْرِين دَوْلة. تَتَمَيَّزُ بِنِظام جُذُور غَنِيّ يَسْمَحُ بِتَكْوِين آلاف الكَلِمات مِن أصْل واحِد، ولَها لَهَجات مَحَلِّيّة مُتَنَوِّعة إلى جانِب الفُصْحى.',
    difficulty: 'hard',
    questions: [
      { question: 'About how many people speak Arabic?', options: ['Over 100 million', 'Over 200 million', 'Over 400 million', 'Over a billion'], correctIndex: 2 },
      { question: 'What feature is highlighted?', options: ['Its simple alphabet', 'Its rich root system', 'Its lack of dialects', 'Its Latin script'], correctIndex: 1 },
    ],
  },
  {
    id: 'ar-hard-2',
    title: 'Hospitality',
    text: 'يَحْتَلُّ الكَرَم مَكانة كَبِيرة في الثَّقافة العَرَبِيّة. عِنْدَما يَزُورُكَ ضَيْف، مِن العادات أن تُقَدِّمَ له القَهْوة أو الشّاي والتَّمْر، حَتّى لَو جاءَ فَجْأة. يُقالُ إنَّ الضَّيْف يَبْقى مُكَرَّمًا ثَلاثة أيّام دُون أن يُسْأَلَ عَن سَبَب زِيارَتِه. هذه التَّقالِيد ما زالَت حَيّة في كَثِير مِن المُجْتَمَعات.',
    difficulty: 'hard',
    questions: [
      { question: 'What is traditionally offered to a guest?', options: ['Only water', 'Coffee or tea and dates', 'Money', 'Nothing until asked'], correctIndex: 1 },
      { question: 'For how long is a guest said to be honored?', options: ['One day', 'Three days', 'A week', 'A month'], correctIndex: 1 },
    ],
  },
  {
    id: 'ar-hard-3',
    title: 'The Value of Reading',
    text: 'يَرى كَثِير مِن المُفَكِّرِين أنَّ القِراءة هي أفْضَل وَسِيلة لِتَنْمِية العَقْل وتَوْسِيع المَعْرِفة. فَمِن خِلال الكُتُب نَسْتَطِيعُ أن نُسافِرَ إلى عُصُور وأماكِن لم نَزُرْها، ونَتَعَرَّفَ على أفْكار مُخْتَلِفة عَن أفْكارِنا. لِذلك يَنْصَحُ التَّرْبَوِيُّون بِتَشْجِيع الأطْفال على القِراءة مُنْذُ الصِّغَر.',
    difficulty: 'hard',
    questions: [
      { question: 'According to the passage, what is the best way to develop the mind?', options: ['Travel', 'Reading', 'Sport', 'Music'], correctIndex: 1 },
      { question: 'What do educators recommend?', options: ['Buying more books', 'Encouraging children to read from a young age', 'Watching documentaries', 'Studying abroad'], correctIndex: 1 },
    ],
  },
  {
    id: 'ar-hard-4',
    title: 'A Changing City',
    text: 'تَغَيَّرَت مَدِينَتِي كَثِيرًا خِلال العَقْد الماضي. كانَت في السّابِق صَغِيرة وهادِئة، أمّا الآن فَقَد امْتَلَأَت بِالأبْراج العالِية والطُّرُق المُزْدَحِمة. صَحِيح أنَّ الحَياة أصْبَحَت أسْرَع وأكْثَر راحة مِن ناحِية الخَدَمات، لكِنَّ كَثِيرًا مِن النّاس يَشْتاقُونَ إلى بَساطة الماضي.',
    difficulty: 'hard',
    questions: [
      { question: 'How was the city in the past?', options: ['Big and crowded', 'Small and quiet', 'Poor and empty', 'Industrial'], correctIndex: 1 },
      { question: 'What do many people miss?', options: ['The old buildings', 'The simplicity of the past', 'The cheap prices', 'The weather'], correctIndex: 1 },
    ],
  },
  {
    id: 'ar-hard-5',
    title: 'The Importance of Water',
    text: 'الماء أساس الحَياة على الأرْض، فَلا يَسْتَطِيعُ أيّ كائِن حَيّ أن يَعِيشَ بِدُونِه. ومَع ذلك، تُواجِهُ مَناطِق كَثِيرة في العالَم نَقْصًا حادًّا في المِياه العَذْبة بِسَبَب التَّغَيُّر المُناخِي وسُوء الاسْتِخْدام. لِذلك يَجِبُ عَلَيْنا جَمِيعًا أن نُرَشِّدَ اسْتِهْلاكَنا ونُحافِظَ على هذه النِّعْمة الثَّمِينة.',
    difficulty: 'hard',
    questions: [
      { question: 'Why do many regions face fresh-water shortages?', options: ['Too much rain', 'Climate change and misuse', 'Population decline', 'War only'], correctIndex: 1 },
      { question: 'What does the passage urge us to do?', options: ['Drink more water', 'Rationalize consumption and conserve water', 'Build more dams', 'Move to cities'], correctIndex: 1 },
    ],
  },

  // ── Easy (batch 2) ──
  {
    id: 'ar-easy-8',
    title: 'Ordering at a Café',
    text: 'أهْلًا وسَهْلًا! أُرِيدُ كوبًا مِن الشّاي بِالنَّعْناع، ومِن فَضْلِك قِطْعة صَغِيرة مِن الكَعْك. أنا لا أُحِبُّ السُّكَّر كَثِيرًا، فَقَط مِلْعَقة واحِدة. شُكْرًا جَزِيلًا لَك.',
    difficulty: 'easy',
    questions: [
      { question: 'What does the speaker order to drink?', options: ['Coffee', 'Mint tea', 'Orange juice', 'Water'], correctIndex: 1 },
      { question: 'How much sugar does the speaker want?', options: ['None', 'One spoon', 'Two spoons', 'A lot'], correctIndex: 1 },
    ],
  },
  {
    id: 'ar-easy-9',
    title: 'My Hobbies',
    text: 'في وَقْتِ فَراغي أُحِبُّ أن أقْرَأَ الكُتُب وأسْتَمِعَ إلى المُوسِيقى. في نِهاية الأُسْبُوع ألْعَبُ كُرة القَدَم مَع أصْدِقائي في الحَدِيقة. أُحِبُّ أيْضًا الطَّبْخ والرَّسْم.',
    difficulty: 'easy',
    questions: [
      { question: 'What does the speaker do on the weekend?', options: ['Study', 'Play football with friends', 'Watch TV', 'Sleep'], correctIndex: 1 },
      { question: 'Which hobby is NOT mentioned?', options: ['Reading', 'Cooking', 'Swimming', 'Drawing'], correctIndex: 2 },
    ],
  },

  // ── Medium (batch 2) ──
  {
    id: 'ar-med-7',
    title: 'A Job Interview',
    text: 'صَباح الخَيْر. اسْمي أحْمَد، وقَد دَرَسْتُ الهَنْدَسة في جامِعة القاهِرة. عَمِلْتُ ثَلاث سَنَوات في شَرِكة كَبِيرة، وأُجِيدُ اللُّغة الإنْجِلِيزيّة والحاسُوب. أبْحَثُ الآن عَن فُرْصة جَدِيدة أتَعَلَّمُ فيها وأُطَوِّرُ مَهاراتي.',
    difficulty: 'medium',
    questions: [
      { question: 'What did the speaker study?', options: ['Medicine', 'Engineering', 'Law', 'Business'], correctIndex: 1 },
      { question: 'How many years of experience does he have?', options: ['One', 'Two', 'Three', 'Five'], correctIndex: 2 },
    ],
  },
  {
    id: 'ar-med-8',
    title: 'Giving Directions',
    text: 'عَفْوًا، كَيْفَ أَصِلُ إلى المَتْحَف؟ اِمْشِ مُسْتَقِيمًا حَتّى نِهاية الشّارِع، ثُمّ انْعَطِفْ يَمِينًا عِنْدَ المَصْرِف. المَتْحَف على يَسارِك، بِجانِبِ الحَدِيقة الكَبِيرة. إنّه قَرِيب، عَشْر دَقائِق سَيْرًا على الأقْدام.',
    difficulty: 'medium',
    questions: [
      { question: 'Where should you turn right?', options: ['At the museum', 'At the bank', 'At the garden', 'At the end of the bridge'], correctIndex: 1 },
      { question: 'How far away is the museum?', options: ['One hour', 'Ten minutes on foot', 'Two kilometers', 'Very far'], correctIndex: 1 },
    ],
  },

  // ── Hard (batch 2) ──
  {
    id: 'ar-hard-6',
    title: 'Technology and Society',
    text: 'غَيَّرَت التِّكْنُولوجيا الحَدِيثة طَريقة تَواصُلِنا وعَمَلِنا بِشَكْل جَذْريّ. فَبِفَضْلِ الهَواتِف الذَّكِيّة والإنْتَرْنِت، أصْبَحَ بِإمْكانِنا الوُصُولُ إلى المَعْلُومات في لَحَظات. ومَع ذلك، يُحَذِّرُ بَعْضُ الخُبَراء مِن الإفْراطِ في اسْتِخْدامِها، لأنّه قَد يُؤَثِّرُ على العَلاقاتِ الإنْسانيّة والصِّحّةِ النَّفْسيّة.',
    difficulty: 'hard',
    questions: [
      { question: 'What has modern technology changed radically?', options: ['The weather', 'The way we communicate and work', 'The price of food', 'The population'], correctIndex: 1 },
      { question: 'What do some experts warn about?', options: ['Buying new phones', 'Overusing technology', 'Slow internet', 'Learning to code'], correctIndex: 1 },
    ],
  },

  // ── Easy (batch 3) ──
  {
    id: 'ar-easy-10',
    title: 'At the Airport',
    text: 'عَفْوًا، أينَ صالةُ المُغادَرة؟ رِحْلَتي إلى إسْطَنْبُول تُقْلِعُ في السّاعة الثّالِثة. مَعي حَقِيبة واحِدة فَقَط. هل أَحْتاجُ إلى بِطاقة الصُّعُود الآن؟ شُكْرًا لِمُساعَدَتِك.',
    difficulty: 'easy',
    questions: [
      { question: 'Where is the traveler going?', options: ['Cairo', 'Istanbul', 'Dubai', 'Beirut'], correctIndex: 1 },
      { question: 'How many bags does the traveler have?', options: ['One', 'Two', 'Three', 'None'], correctIndex: 0 },
    ],
  },
  {
    id: 'ar-easy-11',
    title: 'My Favourite Food',
    text: 'طَعامي المُفَضَّل هو الأُرْزُ بِالدَّجاج. أُمّي تَطْبُخُه يَوْمَ الجُمُعة، وتَضَعُ عليه الكَثِير مِن البَهارات. أُحِبُّ أيْضًا الحَلْوى، خاصّةً الكُنافة. بَعْدَ الغَداء نَشْرَبُ الشّايَ مَعًا.',
    difficulty: 'easy',
    questions: [
      { question: "What is the speaker's favourite food?", options: ['Fish', 'Rice with chicken', 'Bread', 'Soup'], correctIndex: 1 },
      { question: 'What do they drink after lunch?', options: ['Coffee', 'Tea', 'Juice', 'Water'], correctIndex: 1 },
    ],
  },
  {
    id: 'ar-easy-12',
    title: 'The Four Seasons',
    text: 'في الرَّبِيع تُزْهِرُ الأشْجار ويَعْتَدِلُ الجَوّ. في الصَّيْف تَكُونُ الشَّمْسُ حارّة. في الخَرِيف تَسْقُطُ الأوْراق، وفي الشِّتاء يَبْرُدُ الطَّقْسُ ويَنْزِلُ المَطَر. لِكُلِّ فَصْلٍ جَمالُه.',
    difficulty: 'easy',
    questions: [
      { question: 'What happens in autumn?', options: ['Trees blossom', 'The leaves fall', 'It gets very hot', 'It snows heavily'], correctIndex: 1 },
      { question: 'When does it rain?', options: ['Spring', 'Summer', 'Winter', 'Never'], correctIndex: 2 },
    ],
  },

  // ── Medium (batch 3) ──
  {
    id: 'ar-med-9',
    title: 'Ramadan',
    text: 'رَمَضانُ شَهْرٌ مُبارَك يَصُومُ فيه المُسْلِمُونَ مِن الفَجْرِ حَتّى الغُرُوب. عِنْدَ المَغْرِب تَجْتَمِعُ العائِلةُ على مائِدةِ الإفْطار، وغالِبًا ما يَبْدَؤُونَ بِتَمْرةٍ وكوبِ ماء. إنّه شَهْرُ العِبادةِ والكَرَمِ ولَمِّ الشَّمْل.',
    difficulty: 'medium',
    questions: [
      { question: 'Until when do Muslims fast during Ramadan?', options: ['Until noon', 'From dawn until sunset', 'All night', 'Only in the morning'], correctIndex: 1 },
      { question: 'What do they often break the fast with?', options: ['Bread and cheese', 'A date and a cup of water', 'Rice', 'Coffee'], correctIndex: 1 },
    ],
  },
  {
    id: 'ar-med-10',
    title: 'Learning a New Skill',
    text: 'قَرَّرْتُ هذا العام أن أَتَعَلَّمَ العَزْفَ على العُود. في البِداية كانَت أَصابِعي تُؤْلِمُني، ولم أَسْتَطِعْ أن أَعْزِفَ أيَّ لَحْن. لكِنّي تَدَرَّبْتُ كُلَّ يَوْم، وبَعْدَ شُهُور أَصْبَحْتُ أَعْزِفُ أَغانيَ بَسِيطة. الصَّبْرُ مِفْتاحُ كُلِّ نَجاح.',
    difficulty: 'medium',
    questions: [
      { question: 'What did the speaker decide to learn?', options: ['Painting', 'Playing the oud', 'Cooking', 'Swimming'], correctIndex: 1 },
      { question: 'What does the speaker say is the key to success?', options: ['Money', 'Talent', 'Patience', 'Luck'], correctIndex: 2 },
    ],
  },

  // ── Hard (batch 3) ──
  {
    id: 'ar-hard-7',
    title: 'The Golden Age of Science',
    text: 'شَهِدَ العالَمُ الإسْلاميُّ بَيْنَ القَرْنَيْنِ الثّامِنِ والثّالِثَ عَشَرَ عَصْرًا ذَهَبيًّا مِن الازْدِهارِ العِلْميّ. فَفي بَيْتِ الحِكْمةِ بِبَغْداد، تَرْجَمَ العُلَماءُ كُتُبَ اليُونانِ والفُرْسِ والهِنْد، وأَضافُوا إليها اكْتِشافاتِهِم في الطِّبِّ والفَلَكِ والرِّياضِيّات. ولا يَزالُ أَثَرُ هؤُلاءِ العُلَماءِ حاضِرًا في عِلْمِنا اليَوْم.',
    difficulty: 'hard',
    questions: [
      { question: 'Where did scholars translate books from Greece, Persia and India?', options: ['Cairo University', 'The House of Wisdom in Baghdad', 'Al-Azhar', 'Cordoba'], correctIndex: 1 },
      { question: 'In which fields did they add discoveries?', options: ['Only poetry', 'Medicine, astronomy and mathematics', 'Only law', 'Painting'], correctIndex: 1 },
    ],
  },

  // ── Easy (batch 4) ──
  {
    id: 'ar-easy-13',
    title: 'Numbers and Time',
    text: 'أَسْتَيْقِظُ في السّاعةِ السّادِسةِ والنِّصْف. أَتَناوَلُ فَطُوري في السّابِعة، وأَبْدَأُ العَمَلَ في الثّامِنة. في الواحِدةِ ظُهْرًا أَتَناوَلُ الغَداء. هذا هو رُوتِيني اليَوْميّ.',
    difficulty: 'easy',
    questions: [
      { question: 'When does the speaker wake up?', options: ['At six', 'At half past six', 'At seven', 'At eight'], correctIndex: 1 },
      { question: 'When do they start work?', options: ['At seven', 'At eight', 'At one', 'At half past six'], correctIndex: 1 },
    ],
  },
  {
    id: 'ar-easy-14',
    title: 'My School',
    text: 'مَدْرَسَتي كَبِيرة وجَمِيلة. فيها عِشْرُونَ صَفًّا ومَكْتَبةٌ واسِعة ومَلْعَبٌ لِكُرةِ القَدَم. مُعَلِّمُونا لُطَفاء، ومادَّتي المُفَضَّلة هي العُلُوم. أَذْهَبُ إلى المَدْرَسةِ كُلَّ يَوْمٍ ما عَدا الجُمُعةَ والسَّبْت.',
    difficulty: 'easy',
    questions: [
      { question: 'How many classrooms does the school have?', options: ['Ten', 'Fifteen', 'Twenty', 'Thirty'], correctIndex: 2 },
      { question: "What is the speaker's favourite subject?", options: ['Maths', 'Science', 'History', 'Arabic'], correctIndex: 1 },
    ],
  },

  // ── Medium (batch 4) ──
  {
    id: 'ar-med-11',
    title: 'Booking a Hotel',
    text: 'مَساءَ الخَيْر، أُرِيدُ أن أَحْجِزَ غُرْفةً لِشَخْصَيْنِ لِثَلاثِ لَيالٍ. هل يُوجَدُ إفْطارٌ مَجّانيّ؟ وكَم سِعْرُ اللَّيْلةِ الواحِدة؟ نَحْنُ سَنَصِلُ يَوْمَ الخَمِيسِ مَساءً، ونُغادِرُ يَوْمَ الأحَد.',
    difficulty: 'medium',
    questions: [
      { question: 'How many nights does the speaker want to book?', options: ['One', 'Two', 'Three', 'A week'], correctIndex: 2 },
      { question: 'What does the speaker ask about?', options: ['A gym', 'Free breakfast and the price', 'A swimming pool', 'Parking'], correctIndex: 1 },
    ],
  },
  {
    id: 'ar-med-12',
    title: 'A Childhood Memory',
    text: 'حِينَ كُنْتُ صَغِيرًا، كُنّا نَقْضي الصَّيْفَ في قَرْيةِ جَدّي قُرْبَ البَحْر. كُنْتُ أَلْعَبُ مَع أَبْناءِ عَمّي طَوالَ النَّهار، ونَسْبَحُ في الماءِ البارِد. أَتَذَكَّرُ رائِحةَ خُبْزِ جَدَّتي، وما زِلْتُ أَحِنُّ إلى تِلْكَ الأيّام.',
    difficulty: 'medium',
    questions: [
      { question: 'Where did the speaker spend the summer?', options: ["At grandfather's village near the sea", 'In the city', 'In the mountains', 'Abroad'], correctIndex: 0 },
      { question: 'What does the speaker still remember?', options: ["Grandmother's bread smell", 'The school', 'The traffic', 'A film'], correctIndex: 0 },
    ],
  },

  // ── Hard (batch 4) ──
  {
    id: 'ar-hard-8',
    title: 'Water in the Arab World',
    text: 'تُعَدُّ نُدْرةُ المِياهِ مِن أَكْبَرِ التَّحَدِّياتِ التي تُواجِهُ العالَمَ العَرَبيّ. فَمُعْظَمُ دُوَلِ المِنْطَقةِ تَقَعُ في مَناطِقَ جافّةٍ أو شِبْهِ جافّة، وتَعْتَمِدُ على أَنْهارٍ قَلِيلةٍ ومِياهٍ جَوْفيّة. لِذلك تَسْعى الحُكُوماتُ إلى تَحْلِيةِ مِياهِ البَحْرِ وتَرْشِيدِ الاسْتِهْلاك، لِأنَّ الماءَ أَساسُ الحَياةِ والتَّنْمِية.',
    difficulty: 'hard',
    questions: [
      { question: 'Why is water scarce in most of the region?', options: ['Too many rivers', 'It lies in dry or semi-dry areas', 'It is too cold', 'People waste rain'], correctIndex: 1 },
      { question: 'What are governments doing about it?', options: ['Nothing', 'Desalinating seawater and rationalizing use', 'Importing rivers', 'Building more cities'], correctIndex: 1 },
    ],
  },

  // ── Easy (batch 5) ──
  {
    id: 'ar-easy-15',
    title: 'At the Pharmacy',
    text: 'مَساءَ الخَيْر، أَشْعُرُ بِصُداعٍ وأَلَمٍ في الحَلْق. هل عِنْدَكُم دَواءٌ مُناسِب؟ وكَم مَرّةً آخُذُه في اليَوْم؟ شُكْرًا، وأُرِيدُ أيْضًا عُلْبةَ مَناديل.',
    difficulty: 'easy',
    questions: [
      { question: 'What is the speaker complaining about?', options: ['A stomachache', 'A headache and sore throat', 'A broken leg', 'A toothache'], correctIndex: 1 },
      { question: 'What else does the speaker want?', options: ['A box of tissues', 'A bottle of water', 'A newspaper', 'A bandage'], correctIndex: 0 },
    ],
  },
  {
    id: 'ar-easy-16',
    title: 'The Little Cat',
    text: 'عِنْدي قِطّةٌ صَغِيرةٌ اسْمُها لُولُو. لَوْنُها أَبْيَضُ وعَيْناها زَرْقاوان. تُحِبُّ أن تَنامَ في الشَّمْسِ وتَلْعَبَ بِالكُرة. كُلَّ صَباحٍ تَنْتَظِرُني عِنْدَ الباب.',
    difficulty: 'easy',
    questions: [
      { question: 'What colour is the cat?', options: ['Black', 'White', 'Brown', 'Grey'], correctIndex: 1 },
      { question: 'What does the cat like to do?', options: ['Swim', 'Sleep in the sun and play with a ball', 'Climb trees', 'Hide'], correctIndex: 1 },
    ],
  },

  // ── Medium (batch 5) ──
  {
    id: 'ar-med-13',
    title: 'Planning a Trip',
    text: 'قَرَّرْنا أنا وأَصْدِقائي أن نُسافِرَ إلى المَغْرِبِ في الصَّيْف. سَنَزُورُ مَدِينةَ فاس، ونَتَجَوَّلُ في أَسْواقِها القَدِيمة، ونَتَذَوَّقُ الطَّعامَ المَغْرِبيّ. حَجَزْنا الفُنْدُقَ وتَذاكِرَ الطّائِرةِ مُبَكِّرًا لِنُوَفِّرَ المال.',
    difficulty: 'medium',
    questions: [
      { question: 'Where are they travelling?', options: ['Egypt', 'Morocco', 'Jordan', 'Iraq'], correctIndex: 1 },
      { question: 'Why did they book early?', options: ['To get better seats', 'To save money', 'It was required', 'To avoid the heat'], correctIndex: 1 },
    ],
  },

  // ── Hard (batch 5) ──
  {
    id: 'ar-hard-9',
    title: 'The Value of Dialects',
    text: 'كَثِيرًا ما يَظُنُّ المُتَعَلِّمُونَ أنَّ الفُصْحى وَحْدَها هي العَرَبِيّةُ الحَقِيقيّة، لكِنَّ اللَّهَجاتِ المَحَلِّيّةَ لا تَقِلُّ غِنًى ولا أَهَمّيّة. فَهي لُغةُ البَيْتِ والشّارِعِ والأُغْنِية، وتَحْمِلُ رُوحَ كُلِّ بَلَد. لِذلك يَنْصَحُ الخُبَراءُ بِتَعَلُّمِ الفُصْحى لِلقِراءةِ والكِتابة، ولَهْجةٍ واحِدةٍ لِلحَياةِ اليَوْميّة.',
    difficulty: 'hard',
    questions: [
      { question: 'What do learners often mistakenly think?', options: ['Dialects are easy', 'Only Fuṣḥā is "real" Arabic', 'Arabic has no dialects', 'Everyone speaks MSA'], correctIndex: 1 },
      { question: 'What do experts recommend?', options: ['Learning only MSA', 'Learning MSA for reading/writing and one dialect for daily life', 'Avoiding dialects', 'Learning all dialects at once'], correctIndex: 1 },
    ],
  },

  // ── Easy (batch 6) ──
  {
    id: 'ar-easy-17',
    title: 'At the Market',
    text: 'ذَهَبْتُ إلى السُّوقِ صَباحًا لِأشْتَرِيَ الفَواكِه. اِشْتَرَيْتُ تُفّاحًا وبُرْتُقالًا ومَوْزًا. البائِعُ كانَ لَطِيفًا وأعْطانِي سِعْرًا جَيِّدًا. دَفَعْتُ عَشَرَةَ دَنانِيرَ وعُدْتُ إلى البَيْتِ سَعِيدًا.',
    difficulty: 'easy',
    questions: [
      { question: 'When did the speaker go to the market?', options: ['In the evening', 'In the morning', 'At night', 'At noon'], correctIndex: 1 },
      { question: 'How much did the speaker pay?', options: ['Five dinars', 'Ten dinars', 'Twenty dinars', 'Two dinars'], correctIndex: 1 },
    ],
  },
  {
    id: 'ar-easy-18',
    title: 'Morning Routine',
    text: 'أسْتَيْقِظُ كُلَّ يَوْمٍ في السّاعةِ السّادِسة. أغْسِلُ وَجْهِي وأتَناوَلُ الفَطُور. ثُمَّ أشْرَبُ فِنْجانَ قَهْوةٍ وأذْهَبُ إلى العَمَل. أُحِبُّ الصَّباحَ لِأنَّهُ هادِئٌ ومُنْعِش.',
    difficulty: 'easy',
    questions: [
      { question: 'What time does the speaker wake up?', options: ['Five', 'Six', 'Seven', 'Eight'], correctIndex: 1 },
      { question: 'Why does the speaker like the morning?', options: ['It is noisy', 'It is quiet and refreshing', 'It is warm', 'It is short'], correctIndex: 1 },
    ],
  },
  {
    id: 'ar-easy-19',
    title: 'A Phone Call',
    text: 'مَرْحَبًا يا سامِي! هل أنتَ مَشْغُولٌ غَدًا؟ أُرِيدُ أن نَلْتَقِيَ في المَقْهى في السّاعةِ الخامِسة. سَنَشْرَبُ الشّايَ ونَتَحَدَّثُ قَلِيلًا. أراكَ غَدًا، مَعَ السَّلامة.',
    difficulty: 'easy',
    questions: [
      { question: 'Where do they want to meet?', options: ['At the café', 'At the park', 'At home', 'At the office'], correctIndex: 0 },
      { question: 'At what time?', options: ['Four', 'Five', 'Six', 'Seven'], correctIndex: 1 },
    ],
  },
  {
    id: 'ar-easy-20',
    title: 'The Library',
    text: 'المَكْتَبةُ قَرِيبةٌ مِن بَيْتِي. أذْهَبُ إلَيْها كُلَّ أُسْبُوعٍ لِأسْتَعِيرَ الكُتُب. الجَوُّ هُناكَ هادِئٌ ومُناسِبٌ لِلقِراءة. أُفَضِّلُ كُتُبَ التّارِيخِ والعُلُوم.',
    difficulty: 'easy',
    questions: [
      { question: 'How often does the speaker go to the library?', options: ['Every day', 'Every week', 'Every month', 'Rarely'], correctIndex: 1 },
      { question: 'What kinds of books does the speaker prefer?', options: ['Novels and poetry', 'History and science', 'Cooking', "Children's books"], correctIndex: 1 },
    ],
  },

  // ── Medium (batch 6) ──
  {
    id: 'ar-med-14',
    title: 'A Trip to the Museum',
    text: 'في نِهايةِ الأُسْبُوعِ زُرْتُ المَتْحَفَ الوَطَنِيَّ مَعَ أصْدِقائِي. شاهَدْنا قِطَعًا أثَريّةً قَدِيمةً ولَوْحاتٍ جَمِيلة. شَرَحَ لَنا الدَّلِيلُ تارِيخَ كُلِّ قِطْعةٍ بِالتَّفْصِيل. تَعَلَّمْتُ الكَثِيرَ عَن حَضاراتِ المِنْطَقة. كانَتْ رِحْلةً مُمْتِعةً ومُفِيدة.',
    difficulty: 'medium',
    questions: [
      { question: 'When did they visit the museum?', options: ['On a weekday', 'On the weekend', 'At midnight', 'During a holiday abroad'], correctIndex: 1 },
      { question: 'Who explained the history of each piece?', options: ['A teacher', 'A guide', 'A friend', 'A student'], correctIndex: 1 },
    ],
  },
  {
    id: 'ar-med-15',
    title: 'Learning to Cook',
    text: 'بَدَأْتُ أتَعَلَّمُ الطَّبْخَ مِن أُمِّي هذا العام. في البِدايةِ كُنْتُ أُخْطِئُ كَثِيرًا، لكِنِّي تَحَسَّنْتُ مَعَ الوَقْت. الآنَ أسْتَطِيعُ أن أُحَضِّرَ عِدّةَ أطْباقٍ لَذِيذة. أكْثَرُ ما أُحِبُّ طَبْخَهُ هو الأُرْزُ بِالخُضار. الطَّبْخُ هِوايةٌ جَمِيلةٌ تُرِيحُ النَّفْس.',
    difficulty: 'medium',
    questions: [
      { question: 'From whom did the speaker learn to cook?', options: ['Father', 'Mother', 'A friend', 'A chef'], correctIndex: 1 },
      { question: 'What does the speaker most like to cook?', options: ['Meat', 'Rice with vegetables', 'Soup', 'Bread'], correctIndex: 1 },
    ],
  },
  {
    id: 'ar-med-16',
    title: 'The New Neighbor',
    text: 'اِنْتَقَلَ جارٌ جَدِيدٌ إلى الشَّقّةِ المُجاوِرة الأُسْبُوعَ الماضي. هو طالِبٌ جامِعِيٌّ يَدْرُسُ الهَنْدَسة. رَحَّبْنا بِهِ ودَعَوْناهُ لِتَناوُلِ العَشاء. تَحَدَّثْنا عَن دِراسَتِهِ وعَن مَدِينَتِهِ. أصْبَحْنا أصْدِقاءَ بِسُرْعة.',
    difficulty: 'medium',
    questions: [
      { question: 'What does the new neighbor study?', options: ['Medicine', 'Engineering', 'Law', 'Art'], correctIndex: 1 },
      { question: 'What did they invite him for?', options: ['Coffee', 'Dinner', 'A trip', 'A game'], correctIndex: 1 },
    ],
  },
  {
    id: 'ar-med-17',
    title: 'A Rainy Day Plan',
    text: 'كانَ مِنَ المُفْتَرَضِ أن نَذْهَبَ إلى الشّاطِئِ اليَوْم، لكِنَّ المَطَرَ لَم يَتَوَقَّفْ مُنْذُ الصَّباح. لِذلك قَرَّرْنا أن نَبْقى في البَيْت. شاهَدْنا فِيلْمًا وأعْدَدْنا الفُشارَ ولَعِبْنا بَعْضَ الألْعاب. رَغْمَ تَغْيِيرِ الخُطّة، قَضَيْنا وَقْتًا مُمْتِعًا مَعًا.',
    difficulty: 'medium',
    questions: [
      { question: 'Why did they change their plan?', options: ['It was too hot', 'It kept raining', 'They were tired', 'The beach was closed'], correctIndex: 1 },
      { question: 'What did they do instead?', options: ['Went shopping', 'Stayed home and watched a film', 'Visited a friend', 'Went to a museum'], correctIndex: 1 },
    ],
  },

  // ── Hard (batch 6) ──
  {
    id: 'ar-hard-10',
    title: 'The Importance of Reading',
    text: 'تُعَدُّ القِراءةُ مِن أهَمِّ العاداتِ الَّتِي يَنْبَغِي أن يَكْتَسِبَها الإنْسانُ مُنْذُ الصِّغَر. فَهي تُوَسِّعُ المَدارِكَ وتُغْنِي المُفْرَداتِ وتُنَمِّي الخَيال. كما أنَّها تُساعِدُ على فَهْمِ الثَّقافاتِ المُخْتَلِفة والتَّفْكِيرِ النَّقْدِيّ. ومَع اِنْتِشارِ الشّاشاتِ، صارَ تَخْصِيصُ وَقْتٍ يَوْمِيٍّ لِلقِراءةِ أكْثَرَ أهَمّيّةً مِن أيِّ وَقْتٍ مَضى. لِذلك يَنْصَحُ التَّرْبَوِيُّونَ بِتَشْجِيعِ الأطْفالِ على القِراءةِ الحُرّةِ بَدَلًا مِن إجْبارِهِم.',
    difficulty: 'hard',
    questions: [
      { question: 'According to the text, what does reading develop?', options: ['Only memory', 'Perception, vocabulary and imagination', 'Only reading speed', 'Physical strength'], correctIndex: 1 },
      { question: 'What do educators recommend?', options: ['Forcing children to read', 'Encouraging free reading instead of forcing', 'Banning all screens', 'Reading only textbooks'], correctIndex: 1 },
    ],
  },
  {
    id: 'ar-hard-11',
    title: 'Saving Water',
    text: 'المِياهُ العَذْبةُ مَوْرِدٌ ثَمِينٌ ومَحْدُودٌ، ومَعَ ازْدِيادِ عَدَدِ السُّكّانِ وتَغَيُّرِ المُناخِ، أصْبَحَ الحِفاظُ عَلَيْها ضَرُورةً مُلِحّة. يُمْكِنُ لِكُلِّ فَرْدٍ أن يُساهِمَ بِخُطُواتٍ بَسِيطة، مِثْلَ إغْلاقِ الصُّنْبُورِ أثْناءَ تَنْظِيفِ الأسْنان، وإصْلاحِ التَّسَرُّبات، وإعادةِ اسْتِخْدامِ مِياهِ الغَسِيلِ لِلرَّيّ. إنَّ المَسْؤُوليّةَ مُشْتَرَكةٌ بَيْنَ الأفْرادِ والحُكُومات، فَالماءُ أساسُ الحَياةِ كُلِّها.',
    difficulty: 'hard',
    questions: [
      { question: 'Why has conserving water become urgent?', options: ['Prices rose', 'Population growth and climate change', 'It tastes bad', 'Wells dried up completely'], correctIndex: 1 },
      { question: 'Which is a suggested simple step?', options: ['Drinking less water', 'Closing the tap while brushing teeth', 'Buying bottled water', 'Moving to a city'], correctIndex: 1 },
    ],
  },
  {
    id: 'ar-hard-12',
    title: 'The Story of Coffee',
    text: 'يُقالُ إنَّ القَهْوةَ اكْتُشِفَتْ في مِنْطَقةِ الحَبَشةِ قَبْلَ قُرُونٍ عَدِيدة، ثُمَّ اِنْتَقَلَتْ زِراعَتُها وشُرْبُها إلى اليَمَنِ حَيْثُ ازْدَهَرَتْ. ومِن مِيناءِ المُخا اليَمَنِيِّ انْتَشَرَتْ إلى بَقِيّةِ العالَم. صارَتِ المَقاهِي أماكِنَ لِلِّقاءِ وتَبادُلِ الأفْكار، حَتّى سُمِّيَتْ أحْيانًا مَدارِسَ الحُكَماء. واليَوْمَ تُعَدُّ القَهْوةُ مِن أكْثَرِ المَشْرُوباتِ شَعْبيّةً حَوْلَ العالَم.',
    difficulty: 'hard',
    questions: [
      { question: 'Where is coffee said to have been discovered?', options: ['Yemen', 'The Abyssinia region', 'Brazil', 'Turkey'], correctIndex: 1 },
      { question: 'From which port did coffee spread to the world?', options: ['Aden', 'Mokha (al-Mukhā)', 'Jeddah', 'Basra'], correctIndex: 1 },
    ],
  },
];
