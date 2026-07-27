import type { ClozeSentence } from './ja-cloze';

export const roClozeSentences: ClozeSentence[] = [
  // ── Beginner ──
  { id: 'ro-c001', target: 'Beau apă în fiecare zi', english: 'I drink water every day', blankedWord: 'apă', blankedReading: 'AH-puh', frequencyRank: 1, difficulty: 'beginner' },
  { id: 'ro-c002', target: 'Ea este studentă', english: 'She is a student', blankedWord: 'studentă', blankedReading: 'stoo-DEN-tuh', frequencyRank: 2, difficulty: 'beginner' },
  { id: 'ro-c003', target: 'Astăzi vremea este frumoasă', english: 'The weather is nice today', blankedWord: 'vremea', blankedReading: 'VREH-myah', frequencyRank: 3, difficulty: 'beginner' },
  { id: 'ro-c004', target: 'Îmi plac pisicile', english: 'I like cats', blankedWord: 'pisicile', blankedReading: 'pee-SEE-chee-leh', frequencyRank: 4, difficulty: 'beginner' },
  { id: 'ro-c005', target: 'Aceasta este o carte', english: 'This is a book', blankedWord: 'carte', blankedReading: 'KAR-teh', frequencyRank: 5, difficulty: 'beginner' },
  { id: 'ro-c006', target: 'Merg la școală în fiecare zi', english: 'I go to school every day', blankedWord: 'școală', blankedReading: 'SHKWAH-luh', frequencyRank: 6, difficulty: 'beginner' },
  { id: 'ro-c007', target: 'Am mâncat micul dejun', english: 'I ate breakfast', blankedWord: 'micul dejun', blankedReading: 'MEE-kool deh-ZHOON', frequencyRank: 7, difficulty: 'beginner' },
  { id: 'ro-c008', target: 'Am văzut un film aseară', english: 'We watched a movie last night', blankedWord: 'film', blankedReading: 'feelm', frequencyRank: 8, difficulty: 'beginner' },
  { id: 'ro-c009', target: 'Unde este gara?', english: 'Where is the station?', blankedWord: 'gara', blankedReading: 'GAH-rah', frequencyRank: 9, difficulty: 'beginner' },
  { id: 'ro-c010', target: 'Casa este mare', english: 'The house is big', blankedWord: 'casa', blankedReading: 'KAH-sah', frequencyRank: 10, difficulty: 'beginner' },
  { id: 'ro-c011', target: 'Bună dimineața, ce mai faci?', english: 'Good morning, how are you?', blankedWord: 'dimineața', blankedReading: 'dee-mee-NYAH-tsah', frequencyRank: 11, difficulty: 'beginner' },
  { id: 'ro-c012', target: 'Vreau o cafea, te rog', english: 'I want a coffee, please', blankedWord: 'cafea', blankedReading: 'kah-FYAH', frequencyRank: 12, difficulty: 'beginner' },

  // ── Intermediate ──
  { id: 'ro-c013', target: 'Trebuie să cumpăr medicamente de la farmacie', english: 'I need to buy medicine from the pharmacy', blankedWord: 'farmacie', blankedReading: 'far-mah-CHEE-eh', frequencyRank: 13, difficulty: 'intermediate' },
  { id: 'ro-c014', target: 'Restaurantul se închide la ora zece seara', english: 'The restaurant closes at ten at night', blankedWord: 'Restaurantul', blankedReading: 'res-tow-RAN-tool', frequencyRank: 14, difficulty: 'intermediate' },
  { id: 'ro-c015', target: 'Ea lucrează la o companie de tehnologie', english: 'She works at a technology company', blankedWord: 'companie', blankedReading: 'kom-pah-NEE-eh', frequencyRank: 15, difficulty: 'intermediate' },
  { id: 'ro-c016', target: 'Vara trecută am călătorit în Grecia', english: 'Last summer we traveled to Greece', blankedWord: 'călătorit', blankedReading: 'kuh-luh-toh-REET', frequencyRank: 16, difficulty: 'intermediate' },
  { id: 'ro-c017', target: 'Îmi place să citesc cărți de istorie', english: 'I like to read history books', blankedWord: 'citesc', blankedReading: 'chee-TESK', frequencyRank: 17, difficulty: 'intermediate' },
  { id: 'ro-c018', target: 'Autobuzul întârzie din cauza traficului', english: 'The bus is late because of the traffic', blankedWord: 'traficului', blankedReading: 'TRAH-fee-koo-loo-ee', frequencyRank: 18, difficulty: 'intermediate' },
  { id: 'ro-c019', target: 'Prietenul meu învață să conducă mașina', english: 'My friend is learning to drive the car', blankedWord: 'conducă', blankedReading: 'kon-DOO-kuh', frequencyRank: 19, difficulty: 'intermediate' },
  { id: 'ro-c020', target: 'Copiii se joacă în parc', english: 'The children are playing in the park', blankedWord: 'joacă', blankedReading: 'ZHWAH-kuh', frequencyRank: 20, difficulty: 'intermediate' },

  // ── Advanced ──
  { id: 'ro-c021', target: 'Deși era obosit, a continuat să muncească', english: 'Although he was tired, he kept working', blankedWord: 'obosit', blankedReading: 'oh-boh-SEET', frequencyRank: 21, difficulty: 'advanced' },
  { id: 'ro-c022', target: 'Guvernul a anunțat noi măsuri economice', english: 'The government announced new economic measures', blankedWord: 'măsuri', blankedReading: 'MUH-soo-ree', frequencyRank: 22, difficulty: 'advanced' },
  { id: 'ro-c023', target: 'Dacă aș avea mai mult timp, aș învăța pian', english: 'If I had more time, I would learn piano', blankedWord: 'timp', blankedReading: 'teemp', frequencyRank: 23, difficulty: 'advanced' },
  { id: 'ro-c024', target: 'Protejarea mediului este responsabilitatea tuturor', english: 'Protecting the environment is everyone\'s responsibility', blankedWord: 'mediului', blankedReading: 'MEH-dee-oo-loo-ee', frequencyRank: 24, difficulty: 'advanced' },

  // ── Everyday & travel (frequency-ranked) ──
  { id: 'ro-c025', target: 'Vreau să cumpăr pâine de la magazin', english: 'I want to buy bread from the store', blankedWord: 'pâine', blankedReading: 'PUH-ee-neh', frequencyRank: 25, difficulty: 'beginner' },
  { id: 'ro-c026', target: 'Trenul pleacă la ora opt', english: 'The train leaves at eight o\'clock', blankedWord: 'Trenul', blankedReading: 'TREH-nool', frequencyRank: 26, difficulty: 'beginner' },
  { id: 'ro-c027', target: 'Îmi place să beau ceai dimineața', english: 'I like to drink tea in the morning', blankedWord: 'ceai', blankedReading: 'chy', frequencyRank: 27, difficulty: 'beginner' },
  { id: 'ro-c028', target: 'Copiii merg la școală cu autobuzul', english: 'The children go to school by bus', blankedWord: 'autobuzul', blankedReading: 'ow-toh-BOO-zool', frequencyRank: 28, difficulty: 'beginner' },
  { id: 'ro-c029', target: 'Astăzi este o zi frumoasă', english: 'Today is a beautiful day', blankedWord: 'frumoasă', blankedReading: 'froo-MWAH-suh', frequencyRank: 29, difficulty: 'beginner' },
  { id: 'ro-c030', target: 'Am nevoie de ajutor, vă rog', english: 'I need help, please', blankedWord: 'ajutor', blankedReading: 'ah-zhoo-TOR', frequencyRank: 30, difficulty: 'beginner' },
  { id: 'ro-c031', target: 'Ea vorbește trei limbi străine', english: 'She speaks three foreign languages', blankedWord: 'limbi', blankedReading: 'LEEM-bee', frequencyRank: 31, difficulty: 'intermediate' },
  { id: 'ro-c032', target: 'Noi mâncăm împreună în fiecare seară', english: 'We eat together every evening', blankedWord: 'împreună', blankedReading: 'uhm-preh-OO-nuh', frequencyRank: 32, difficulty: 'intermediate' },
  { id: 'ro-c033', target: 'Cartea aceasta este foarte interesantă', english: 'This book is very interesting', blankedWord: 'interesantă', blankedReading: 'een-teh-reh-SAN-tuh', frequencyRank: 33, difficulty: 'intermediate' },
  { id: 'ro-c034', target: 'El lucrează la un spital mare', english: 'He works at a big hospital', blankedWord: 'spital', blankedReading: 'spee-TAL', frequencyRank: 34, difficulty: 'intermediate' },
  { id: 'ro-c035', target: 'Vremea se schimbă repede toamna', english: 'The weather changes quickly in autumn', blankedWord: 'toamna', blankedReading: 'TWAM-nah', frequencyRank: 35, difficulty: 'intermediate' },
  { id: 'ro-c036', target: 'Trebuie să plătesc factura la timp', english: 'I have to pay the bill on time', blankedWord: 'factura', blankedReading: 'fak-TOO-rah', frequencyRank: 36, difficulty: 'intermediate' },
  { id: 'ro-c037', target: 'Prietena mea locuiește în străinătate', english: 'My friend lives abroad', blankedWord: 'străinătate', blankedReading: 'struh-ee-nuh-TAH-teh', frequencyRank: 37, difficulty: 'intermediate' },
  { id: 'ro-c038', target: 'Guvernul a luat o decizie importantă', english: 'The government made an important decision', blankedWord: 'decizie', blankedReading: 'deh-CHEE-zee-eh', frequencyRank: 38, difficulty: 'advanced' },
  { id: 'ro-c039', target: 'Fără efort nu obții rezultate', english: 'Without effort you don\'t get results', blankedWord: 'efort', blankedReading: 'eh-FORT', frequencyRank: 39, difficulty: 'advanced' },
  { id: 'ro-c040', target: 'Deși era târziu, am continuat să lucrez', english: 'Although it was late, I kept working', blankedWord: 'târziu', blankedReading: 'tuhr-ZEE-oo', frequencyRank: 40, difficulty: 'advanced' },
];
