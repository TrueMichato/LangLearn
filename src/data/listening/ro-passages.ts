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
];
