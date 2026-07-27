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
];
