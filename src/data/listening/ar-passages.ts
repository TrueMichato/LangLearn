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
];
