import type { ListeningPassage } from './ja-passages';

export const roPassages: ListeningPassage[] = [
  // --- Easy (7) ---
  {
    id: 'ro-easy-1',
    title: 'Self Introduction',
    text: 'Bună ziua! Numele meu este Andrei. Sunt român. Locuiesc în Cluj. Studiez informatica la universitate. Îmi pare bine de cunoștință!',
    difficulty: 'easy',
    questions: [
      { question: "What is the speaker's name?", options: ['Andrei', 'Mihai', 'Radu', 'Ionel'], correctIndex: 0 },
      { question: 'Where does he live?', options: ['București', 'Iași', 'Cluj', 'Timișoara'], correctIndex: 2 },
    ],
  },
  {
    id: 'ro-easy-2',
    title: 'At the Café',
    text: 'Bună ziua! Aș vrea o cafea cu lapte, vă rog. Mare, dacă se poate. Și un covrig. Cât costă totul?',
    difficulty: 'easy',
    questions: [
      { question: 'What does the speaker order to drink?', options: ['Tea', 'Coffee with milk', 'Juice', 'Water'], correctIndex: 1 },
      { question: 'What food does she want?', options: ['Cake', 'A pretzel', 'Bread', 'A cookie'], correctIndex: 1 },
    ],
  },
  {
    id: 'ro-easy-3',
    title: 'The Weather',
    text: 'Astăzi este foarte cald în Constanța. Temperatura este de treizeci și cinci de grade. Nu este niciun nor pe cer. Merg la plajă cu prietenii mei.',
    difficulty: 'easy',
    questions: [
      { question: 'How is the weather?', options: ['Cold', 'Rainy', 'Very hot', 'Windy'], correctIndex: 2 },
      { question: 'What will the speaker do?', options: ['Stay home', 'Go to the beach', 'Go shopping', 'Study'], correctIndex: 1 },
    ],
  },
  {
    id: 'ro-easy-4',
    title: 'My Family',
    text: 'Familia mea este mare. Am doi frați și o soră. Tatăl meu este profesor, iar mama mea este doctoriță. Locuim împreună la Brașov.',
    difficulty: 'easy',
    questions: [
      { question: 'How many siblings does the speaker have?', options: ['Two', 'Three', 'Four', 'One'], correctIndex: 1 },
      { question: "What is the mother's profession?", options: ['Teacher', 'Lawyer', 'Doctor', 'Engineer'], correctIndex: 2 },
    ],
  },
  {
    id: 'ro-easy-5',
    title: 'At the Market',
    text: 'Bună dimineața! Vreau un kilogram de roșii, vă rog. Cât costă merele? Trei lei? Bine, iau două kilograme. Mulțumesc!',
    difficulty: 'easy',
    questions: [
      { question: 'What does the speaker buy a kilogram of?', options: ['Apples', 'Tomatoes', 'Potatoes', 'Onions'], correctIndex: 1 },
      { question: 'How many kilograms of apples does she buy?', options: ['One', 'Two', 'Three', 'None'], correctIndex: 1 },
    ],
  },
  {
    id: 'ro-easy-6',
    title: 'Daily Routine',
    text: 'În fiecare zi mă trezesc la ora șapte. Iau micul dejun și beau o cafea. Apoi merg la muncă cu autobuzul. Seara citesc o carte și mă culc devreme.',
    difficulty: 'easy',
    questions: [
      { question: 'What time does the speaker wake up?', options: ['Six', 'Seven', 'Eight', 'Nine'], correctIndex: 1 },
      { question: 'How does the speaker get to work?', options: ['By car', 'By bus', 'On foot', 'By train'], correctIndex: 1 },
    ],
  },
  {
    id: 'ro-easy-7',
    title: 'At the Restaurant',
    text: 'Bună seara! O masă pentru două persoane, vă rog. Aș dori o ciorbă de legume și o sarma. De băut, un pahar cu apă. Mulțumesc frumos!',
    difficulty: 'easy',
    questions: [
      { question: 'For how many people is the table?', options: ['One', 'Two', 'Three', 'Four'], correctIndex: 1 },
      { question: 'What does the speaker want to drink?', options: ['Wine', 'A glass of water', 'Beer', 'Juice'], correctIndex: 1 },
    ],
  },

  // --- Medium (4) ---
  {
    id: 'ro-med-1',
    title: 'Weekend Plans',
    text: 'Weekendul acesta vreau să merg la munte cu familia. Vom pleca sâmbătă dimineață cu mașina. Am rezervat o cabană lângă Sinaia. Sper că vremea va fi frumoasă și că vom putea face drumeții.',
    difficulty: 'medium',
    questions: [
      { question: 'Where does the speaker want to go?', options: ['To the sea', 'To the mountains', 'Abroad', 'To the village'], correctIndex: 1 },
      { question: 'When will they leave?', options: ['Friday evening', 'Saturday morning', 'Sunday', 'Monday'], correctIndex: 1 },
      { question: 'What did the speaker reserve?', options: ['A hotel', 'A cabin', 'A tent', 'An apartment'], correctIndex: 1 },
    ],
  },
  {
    id: 'ro-med-2',
    title: 'Looking for the Museum',
    text: 'Scuzați-mă, puteți să îmi spuneți unde este Muzeul Național de Artă? Mergeți drept înainte până la semafor, apoi faceți dreapta. Muzeul este chiar lângă parc. Este cam la zece minute de mers pe jos.',
    difficulty: 'medium',
    questions: [
      { question: 'What is the person looking for?', options: ['The train station', 'The National Art Museum', 'The library', 'The theater'], correctIndex: 1 },
      { question: 'What should they do at the traffic light?', options: ['Turn left', 'Turn right', 'Go straight', 'Stop'], correctIndex: 1 },
      { question: 'How long is the walk?', options: ['Five minutes', 'Ten minutes', 'Twenty minutes', 'An hour'], correctIndex: 1 },
    ],
  },
  {
    id: 'ro-med-3',
    title: 'A Phone Call',
    text: 'Alo, bună! Te sun ca să te întreb dacă vii la petrecerea mea de sâmbătă. Începe la ora opt seara, la mine acasă. Va fi multă lume și muzică bună. Te rog să îmi spui până vineri dacă poți veni.',
    difficulty: 'medium',
    questions: [
      { question: 'Why is the speaker calling?', options: ['To cancel a meeting', 'To invite to a party', 'To ask for help', 'To say goodbye'], correctIndex: 1 },
      { question: 'What time does the party start?', options: ['Six', 'Seven', 'Eight', 'Nine'], correctIndex: 2 },
      { question: 'By when should the friend reply?', options: ['Thursday', 'Friday', 'Saturday', 'Sunday'], correctIndex: 1 },
    ],
  },
  {
    id: 'ro-med-4',
    title: 'At the Doctor',
    text: 'Bună ziua, domnule doctor. Nu mă simt bine de câteva zile. Mă doare capul și am febră. De asemenea, tușesc mult noaptea. Cred că am răcit. Ce mă sfătuiți să fac?',
    difficulty: 'medium',
    questions: [
      { question: 'How long has the patient felt unwell?', options: ['A few hours', 'A few days', 'A week', 'A month'], correctIndex: 1 },
      { question: 'Which symptom is NOT mentioned?', options: ['Headache', 'Fever', 'Cough', 'Stomach ache'], correctIndex: 3 },
      { question: 'What does the patient think is wrong?', options: ['A broken bone', 'A cold', 'An allergy', 'Nothing serious'], correctIndex: 1 },
    ],
  },

  // --- Hard (3) ---
  {
    id: 'ro-hard-1',
    title: 'A Job Interview',
    text: 'Am absolvit Facultatea de Economie acum trei ani și de atunci am lucrat la o companie de contabilitate. Caut un post nou pentru că aș vrea să am mai multe responsabilități. Consider că sunt o persoană organizată și că lucrez bine în echipă. Sunt convins că aș putea contribui la succesul companiei dumneavoastră.',
    difficulty: 'hard',
    questions: [
      { question: 'What did the speaker study?', options: ['Law', 'Economics', 'Medicine', 'Engineering'], correctIndex: 1 },
      { question: 'Why is the speaker looking for a new job?', options: ['Higher salary', 'More responsibilities', 'Closer to home', 'Better schedule'], correctIndex: 1 },
      { question: 'How does the speaker describe themselves?', options: ['Creative and quiet', 'Organized and a team player', 'Ambitious but shy', 'Experienced but tired'], correctIndex: 1 },
    ],
  },
  {
    id: 'ro-hard-2',
    title: 'Environmental Concerns',
    text: 'În ultimii ani, poluarea a devenit o problemă tot mai gravă în orașele mari. Dacă nu luăm măsuri, calitatea aerului va continua să scadă. Cred că ar trebui să folosim mai mult transportul public și să reciclăm mai mult. Fiecare dintre noi poate face ceva pentru a proteja mediul înconjurător.',
    difficulty: 'hard',
    questions: [
      { question: 'What problem is discussed?', options: ['Traffic', 'Pollution', 'Unemployment', 'Housing'], correctIndex: 1 },
      { question: 'What will happen if no measures are taken?', options: ['Air quality will drop', 'Prices will rise', 'Cities will grow', 'Nothing'], correctIndex: 0 },
      { question: 'What solution does the speaker suggest?', options: ['Building more roads', 'Using public transport and recycling', 'Moving to the countryside', 'Planting one tree'], correctIndex: 1 },
    ],
  },
  {
    id: 'ro-hard-3',
    title: 'A Childhood Memory',
    text: 'Când eram mic, îmi petreceam verile la bunici, la țară. Îmi amintesc mirosul pâinii coapte în cuptor și zgomotul râului din apropiere. Bunicul mă învăța să pescuiesc, iar bunica îmi spunea povești seara. Deși au trecut mulți ani, acele amintiri au rămas cele mai frumoase din copilăria mea.',
    difficulty: 'hard',
    questions: [
      { question: 'Where did the speaker spend summers?', options: ['At the seaside', 'At the grandparents in the countryside', 'Abroad', 'In the city'], correctIndex: 1 },
      { question: 'What did the grandfather teach?', options: ['To cook', 'To fish', 'To read', 'To swim'], correctIndex: 1 },
      { question: 'What did the grandmother do in the evening?', options: ['Sang songs', 'Told stories', 'Baked bread', 'Played games'], correctIndex: 1 },
    ],
  },

  // --- Additional (easy 2, medium 2, hard 2) ---
  {
    id: 'ro-easy-8',
    title: 'Shopping',
    text: 'Astăzi merg la magazin. Vreau să cumpăr pâine, lapte și ouă. De asemenea, am nevoie de fructe și legume. La sfârșit, plătesc la casă și mă întorc acasă.',
    difficulty: 'easy',
    questions: [
      { question: 'What does the speaker want to buy?', options: ['Meat and fish', 'Bread, milk and eggs', 'Coffee and tea', 'Clothes'], correctIndex: 1 },
      { question: 'What does the speaker do at the end?', options: ['Pays and goes home', 'Meets a friend', 'Goes to work', 'Eats at a restaurant'], correctIndex: 0 },
    ],
  },
  {
    id: 'ro-easy-9',
    title: 'Free Time',
    text: 'Îmi place să citesc și să ascult muzică. În weekend joc fotbal cu prietenii mei. Uneori merg la cinema sau mă plimb prin parc. Îmi place foarte mult natura.',
    difficulty: 'easy',
    questions: [
      { question: 'What does the speaker do on weekends?', options: ['Plays football', 'Goes shopping', 'Studies', 'Works'], correctIndex: 0 },
      { question: 'What does the speaker love a lot?', options: ['The city', 'Nature', 'Cars', 'Cooking'], correctIndex: 1 },
    ],
  },
  {
    id: 'ro-med-5',
    title: 'At the Hotel',
    text: 'Bună ziua! Am o rezervare pe numele Popescu. Aș dori o cameră pentru două nopți. Este micul dejun inclus în preț? Și la ce oră trebuie să eliberez camera în ultima zi?',
    difficulty: 'medium',
    questions: [
      { question: 'How many nights does the guest want to stay?', options: ['One', 'Two', 'Three', 'A week'], correctIndex: 1 },
      { question: 'What does the guest ask about first?', options: ['Parking', 'Whether breakfast is included', 'The Wi-Fi', 'A taxi'], correctIndex: 1 },
      { question: 'What else does the guest want to know?', options: ['The checkout time', 'The room number', 'The price of dinner', 'The pool hours'], correctIndex: 0 },
    ],
  },
  {
    id: 'ro-med-6',
    title: 'Asking for Directions',
    text: 'Scuzați-mă, cum ajung la muzeu? Mergeți drept înainte până la a doua intersecție, apoi faceți la stânga. Muzeul este lângă bibliotecă, vizavi de parc. Nu puteți să-l ratați.',
    difficulty: 'medium',
    questions: [
      { question: 'What is the person looking for?', options: ['The museum', 'The hospital', 'The market', 'The station'], correctIndex: 0 },
      { question: 'Where should they turn left?', options: ['At the first corner', 'At the second intersection', 'After the bridge', 'At the park'], correctIndex: 1 },
      { question: 'What is the museum next to?', options: ['A school', 'The library', 'A restaurant', 'The station'], correctIndex: 1 },
    ],
  },
  {
    id: 'ro-hard-4',
    title: 'My Job',
    text: 'Lucrez de cinci ani la o firmă de arhitectură din București. Îmi place munca mea pentru că este creativă și mereu diferită. Totuși, uneori programul este solicitant și trebuie să lucrez și în weekend. Sper ca anul viitor să primesc o promovare.',
    difficulty: 'hard',
    questions: [
      { question: 'How long has the speaker worked there?', options: ['Two years', 'Five years', 'Ten years', 'One year'], correctIndex: 1 },
      { question: 'Why does the speaker like the job?', options: ['It is well paid', 'It is creative and varied', 'It is close to home', 'It has short hours'], correctIndex: 1 },
      { question: 'What does the speaker hope for next year?', options: ['A new office', 'A promotion', 'A longer holiday', 'A different city'], correctIndex: 1 },
    ],
  },
  {
    id: 'ro-hard-5',
    title: 'A Changing Climate',
    text: 'În ultimele decenii, clima s-a schimbat vizibil în întreaga lume. Verile au devenit mai calde, iar fenomenele extreme sunt tot mai frecvente. Oamenii de știință avertizează că, dacă nu reducem emisiile, consecințele vor fi grave. Fiecare gest mic, precum reciclarea, poate contribui la o schimbare pozitivă.',
    difficulty: 'hard',
    questions: [
      { question: 'What has changed in recent decades?', options: ['The economy', 'The climate', 'The population', 'The language'], correctIndex: 1 },
      { question: 'What do scientists warn about?', options: ['Rising prices', 'Serious consequences if emissions are not reduced', 'A lack of water', 'New diseases'], correctIndex: 1 },
      { question: 'What small action is mentioned?', options: ['Recycling', 'Walking', 'Reading', 'Saving money'], correctIndex: 0 },
    ],
  },

  // --- More themed passages ---
  {
    id: 'ro-easy-10',
    title: 'A Phone Call',
    text: 'Alo? Bună, Maria! Ce faci? Vrei să mergem la film diseară? Filmul începe la ora șapte. Ne vedem în fața cinematografului, bine? Pa!',
    difficulty: 'easy',
    questions: [
      { question: 'What does the caller suggest?', options: ['Going to dinner', 'Going to a film', 'Studying together', 'Going shopping'], correctIndex: 1 },
      { question: 'What time does the film start?', options: ['Six', 'Seven', 'Eight', 'Nine'], correctIndex: 1 },
    ],
  },
  {
    id: 'ro-easy-11',
    title: 'Weather Forecast',
    text: 'Mâine va fi o zi frumoasă. Dimineața va fi soare, dar după-amiază vor fi câțiva nori. Temperatura maximă va fi de douăzeci de grade. Nu va ploua.',
    difficulty: 'easy',
    questions: [
      { question: 'How will the morning be?', options: ['Rainy', 'Sunny', 'Snowy', 'Foggy'], correctIndex: 1 },
      { question: 'Will it rain tomorrow?', options: ['Yes', 'No', 'Only at night', 'In the morning'], correctIndex: 1 },
    ],
  },
  {
    id: 'ro-med-7',
    title: 'Booking a Table',
    text: 'Bună ziua! Aș dori să rezerv o masă pentru patru persoane, pentru diseară, la ora opt. Ar fi posibil una lângă fereastră? Numele meu este Ionescu. Vă mulțumesc frumos!',
    difficulty: 'medium',
    questions: [
      { question: 'For how many people is the reservation?', options: ['Two', 'Three', 'Four', 'Five'], correctIndex: 2 },
      { question: 'What does the caller prefer?', options: ['A quiet corner', 'A table by the window', 'A table outside', 'A booth'], correctIndex: 1 },
      { question: 'At what time is the reservation?', options: ['Seven', 'Eight', 'Nine', 'Six'], correctIndex: 1 },
    ],
  },
  {
    id: 'ro-med-8',
    title: 'A Lost Bag',
    text: 'Scuzați-mă, mi-am pierdut geanta în tren. Era o geantă neagră, cu niște documente și un telefon. Am coborât la Gara de Nord acum o oră. Unde pot să întreb de obiectele pierdute?',
    difficulty: 'medium',
    questions: [
      { question: 'What did the person lose?', options: ['A wallet', 'A bag', 'A suitcase', 'A phone only'], correctIndex: 1 },
      { question: 'What color was it?', options: ['Brown', 'Black', 'Red', 'Blue'], correctIndex: 1 },
      { question: 'When did the person get off the train?', options: ['An hour ago', 'Yesterday', 'This morning', 'A few minutes ago'], correctIndex: 0 },
    ],
  },
  {
    id: 'ro-hard-6',
    title: 'A News Bulletin',
    text: 'Astăzi, la București, a avut loc o conferință despre educație. Miniștri din mai multe țări au discutat despre viitorul școlilor. Ei au subliniat importanța tehnologiei în clasă, dar și nevoia de profesori bine pregătiți. Conferința se va încheia mâine.',
    difficulty: 'hard',
    questions: [
      { question: 'What was the conference about?', options: ['Health', 'Education', 'Economy', 'Sport'], correctIndex: 1 },
      { question: 'What did the ministers emphasize?', options: ['Lower taxes', 'Technology and well-trained teachers', 'More holidays', 'New buildings'], correctIndex: 1 },
      { question: 'When will the conference end?', options: ['Today', 'Tomorrow', 'Next week', 'It already ended'], correctIndex: 1 },
    ],
  },
  {
    id: 'ro-hard-7',
    title: 'Time in Nature',
    text: 'Cred că este important să petrecem mai mult timp în natură. În ziua de azi, mulți oameni stau ore întregi în fața ecranelor și uită de lumea reală. O plimbare prin pădure sau o zi la munte ne poate ajuta să ne relaxăm și să ne recăpătăm energia. Sănătatea mintală depinde și de asta.',
    difficulty: 'hard',
    questions: [
      { question: 'What does the speaker think is important?', options: ['Working harder', 'Spending time in nature', 'Saving money', 'Using technology'], correctIndex: 1 },
      { question: 'What do many people do nowadays?', options: ['Travel a lot', 'Spend hours in front of screens', 'Read books', 'Exercise daily'], correctIndex: 1 },
      { question: 'What does the speaker say nature helps with?', options: ['Making money', 'Relaxing and regaining energy', 'Learning languages', 'Meeting people'], correctIndex: 1 },
    ],
  },

  // --- Set 3 ---
  {
    id: 'ro-easy-12',
    title: 'At the Pharmacy',
    text: 'Bună ziua! Mă doare capul și am puțină febră. Aveți ceva pentru durere? Da, aceste pastile vă pot ajuta. Luați una dimineața și una seara. Vă mulțumesc mult!',
    difficulty: 'easy',
    questions: [
      { question: 'What is wrong with the customer?', options: ['A cough', 'A headache and slight fever', 'A stomach ache', 'A cold'], correctIndex: 1 },
      { question: 'How often should they take the pills?', options: ['Once a day', 'Morning and evening', 'Every hour', 'Only at night'], correctIndex: 1 },
    ],
  },
  {
    id: 'ro-easy-13',
    title: 'My Hometown',
    text: 'Orașul meu natal este mic, dar foarte frumos. Are un râu, un parc mare și o piață în centru. Îmi place să mă plimb pe străzile vechi. Oamenii de aici sunt prietenoși și liniștiți.',
    difficulty: 'easy',
    questions: [
      { question: 'How is the speaker\'s hometown described?', options: ['Big and busy', 'Small but beautiful', 'Cold and grey', 'Far away'], correctIndex: 1 },
      { question: 'What does the speaker like to do?', options: ['Go shopping', 'Walk on the old streets', 'Swim in the river', 'Visit the market'], correctIndex: 1 },
    ],
  },
  {
    id: 'ro-med-9',
    title: 'Planning a Trip',
    text: 'Vara aceasta vrem să vizităm Transilvania. Plănuim să vedem castelul Bran și orașul Sibiu. Vom sta cinci zile la munte, într-o pensiune mică. Sper că vom avea timp și pentru o drumeție prin Carpați.',
    difficulty: 'medium',
    questions: [
      { question: 'Which region do they want to visit?', options: ['Moldova', 'Transylvania', 'Dobrogea', 'Banat'], correctIndex: 1 },
      { question: 'How long will they stay in the mountains?', options: ['Three days', 'Five days', 'A week', 'Two weeks'], correctIndex: 1 },
      { question: 'What do they hope to do as well?', options: ['Go to the beach', 'A hike in the Carpathians', 'Visit a museum', 'Attend a concert'], correctIndex: 1 },
    ],
  },
  {
    id: 'ro-hard-8',
    title: 'The Value of Reading',
    text: 'Mulți spun că nu mai au timp să citească, dar cred că este o scuză. Cititul ne îmbogățește vocabularul, ne dezvoltă imaginația și ne ajută să înțelegem mai bine lumea. Chiar și zece minute pe zi pot face o diferență. O carte bună este un prieten care nu te dezamăgește niciodată.',
    difficulty: 'hard',
    questions: [
      { question: 'What does the speaker think about not having time to read?', options: ['It is understandable', 'It is an excuse', 'It is a real problem', 'It is normal'], correctIndex: 1 },
      { question: 'What does reading develop, according to the speaker?', options: ['Only memory', 'Vocabulary and imagination', 'Physical strength', 'Musical skill'], correctIndex: 1 },
      { question: 'How does the speaker describe a good book?', options: ['An expensive item', 'A friend who never disappoints', 'A waste of time', 'A rare treasure'], correctIndex: 1 },
    ],
  },
];
